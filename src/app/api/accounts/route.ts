import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { Account, AccountType } from '@/lib/types';
import { calculateAccountBalance } from '@/lib/financial-calculator';

export async function GET() {
  try {
    const db = readDatabase();
    
    // Compute current balances dynamically
    const enrichedAccounts = db.accounts.map(account => {
      const currentBalance = calculateAccountBalance(account, db.transactions);
      
      // Calculate account-wise expense and income
      const accountTxns = db.transactions.filter(t => t.accountId === account.id);
      const totalExpense = accountTxns
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = accountTxns
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        ...account,
        currentBalance,
        totalExpense,
        totalIncome,
        transactionCount: accountTxns.length,
      };
    });

    return NextResponse.json({ accounts: enrichedAccounts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, bankName, accountType, accountNumber, openingBalance, currency, color, icon } = body;

    if (!name || !bankName || !accountType) {
      return NextResponse.json({ error: 'Name, bank name, and account type are required.' }, { status: 400 });
    }

    // Security validation: Never allow full 16-digit card / account numbers. Mask to last 4 digits.
    let cleanAccNum = (accountNumber || '').trim();
    if (cleanAccNum.length > 4) {
      const last4 = cleanAccNum.slice(-4);
      cleanAccNum = `•••• ${last4}`;
    } else if (cleanAccNum.length > 0 && !cleanAccNum.includes('•')) {
      cleanAccNum = `•••• ${cleanAccNum}`;
    } else if (!cleanAccNum) {
      cleanAccNum = '•••• ' + Math.floor(1000 + Math.random() * 9000);
    }

    const newAccount: Account = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      bankName: bankName.trim(),
      accountType: accountType as AccountType,
      accountNumber: cleanAccNum,
      openingBalance: parseFloat(openingBalance) || 0,
      currentBalance: parseFloat(openingBalance) || 0,
      currency: currency || 'INR',
      color: color || '#10B981',
      icon: icon || 'Landmark',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = readDatabase();
    db.accounts.push(newAccount);
    writeDatabase(db);

    return NextResponse.json({ account: newAccount }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, bankName, accountType, openingBalance, color, icon, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required.' }, { status: 400 });
    }

    const db = readDatabase();
    const index = db.accounts.findIndex(a => a.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    const current = db.accounts[index];
    const updated: Account = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      bankName: bankName !== undefined ? bankName.trim() : current.bankName,
      accountType: accountType !== undefined ? accountType : current.accountType,
      openingBalance: openingBalance !== undefined ? parseFloat(openingBalance) : current.openingBalance,
      color: color !== undefined ? color : current.color,
      icon: icon !== undefined ? icon : current.icon,
      status: status !== undefined ? status : current.status,
      updatedAt: new Date().toISOString(),
    };

    db.accounts[index] = updated;
    writeDatabase(db);

    return NextResponse.json({ account: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required.' }, { status: 400 });
    }

    const db = readDatabase();
    const accountIndex = db.accounts.findIndex(a => a.id === id);
    if (accountIndex === -1) {
      return NextResponse.json({ error: 'Account not found.' }, { status: 404 });
    }

    // Check if account has transactions
    const txnCount = db.transactions.filter(t => t.accountId === id).length;
    const force = searchParams.get('force') === 'true';

    if (txnCount > 0 && !force) {
      // Archive instead of hard delete to preserve financial history
      db.accounts[accountIndex].status = 'archived';
      db.accounts[accountIndex].updatedAt = new Date().toISOString();
      writeDatabase(db);
      return NextResponse.json({
        archived: true,
        message: `Account has ${txnCount} transactions. It has been archived instead of deleted to protect history.`,
      });
    }

    // Hard delete account and optionally its transactions
    db.accounts.splice(accountIndex, 1);
    if (force) {
      db.transactions = db.transactions.filter(t => t.accountId !== id);
    }
    writeDatabase(db);

    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
