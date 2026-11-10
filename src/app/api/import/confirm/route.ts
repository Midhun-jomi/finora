import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { ImportBatch, ParsedTransactionPreview, Transaction } from '@/lib/types';
import { calculateAccountBalance } from '@/lib/financial-calculator';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      accountId,
      fileName,
      transactions,
      learnedRules,
    }: {
      accountId: string;
      fileName: string;
      transactions: ParsedTransactionPreview[];
      learnedRules?: Array<{ pattern: string; merchantName: string; category: string }>;
    } = body;

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required.' }, { status: 400 });
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions selected for import.' }, { status: 400 });
    }

    const db = readDatabase();
    const accountIndex = db.accounts.findIndex(a => a.id === accountId);
    if (accountIndex === -1) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const account = db.accounts[accountIndex];
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    // Map previews to formal Transactions
    const newTransactions: Transaction[] = transactions.map((item, index) => {
      return {
        id: `txn-imp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        accountId,
        date: item.date,
        description: item.description,
        originalDescription: item.originalDescription || item.description,
        merchantName: item.merchantName || 'General',
        amount: item.amount,
        type: item.type,
        category: item.category || 'General',
        source: 'CSV Import',
        importBatchId: batchId,
        bankReferenceId: item.referenceNumber || undefined,
        importedAt: nowIso,
        balanceAfter: item.balance,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    });

    // Add to DB transactions
    db.transactions.push(...newTransactions);

    // Save batch to ImportHistory
    const importHistoryItem: ImportBatch = {
      id: batchId,
      fileName: fileName || 'statement.csv',
      accountId,
      accountName: account.name,
      importedAt: nowIso,
      totalParsed: transactions.length,
      successfulCount: newTransactions.length,
      duplicateCount: 0,
      failedCount: 0,
    };
    db.importHistory.unshift(importHistoryItem);

    // Learn & persist new merchant mappings if provided
    if (learnedRules && Array.isArray(learnedRules)) {
      learnedRules.forEach(rule => {
        if (!rule.pattern || !rule.category) return;
        const patUpper = rule.pattern.toUpperCase().trim();
        const existingIdx = db.merchantMappings.findIndex(m => m.pattern.toUpperCase() === patUpper);
        if (existingIdx !== -1) {
          db.merchantMappings[existingIdx].category = rule.category;
          db.merchantMappings[existingIdx].merchantName = rule.merchantName || rule.pattern;
          db.merchantMappings[existingIdx].isUserOverride = true;
          db.merchantMappings[existingIdx].updatedAt = nowIso;
        } else {
          db.merchantMappings.push({
            id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            pattern: patUpper,
            merchantName: rule.merchantName || rule.pattern,
            category: rule.category,
            isUserOverride: true,
            updatedAt: nowIso,
          });
        }
      });
    }

    // Automatically update current balance for the account
    account.currentBalance = calculateAccountBalance(account, db.transactions);
    account.updatedAt = nowIso;
    db.accounts[accountIndex] = account;

    // Save all to database (and trigger Google Sheets sync if configured)
    writeDatabase(db);

    return NextResponse.json({
      success: true,
      batchId,
      importedCount: newTransactions.length,
      accountUpdatedBalance: account.currentBalance,
      importHistoryItem,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to confirm transaction import.' }, { status: 500 });
  }
}

