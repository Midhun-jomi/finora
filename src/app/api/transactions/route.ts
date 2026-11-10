import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { Transaction, TransactionSource, TransactionType } from '@/lib/types';
import { extractMerchantFromNarration } from '@/lib/categorizer';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get('accountId');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const source = searchParams.get('source');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const db = readDatabase();
    let results = [...db.transactions];

    if (accountId) {
      results = results.filter(t => t.accountId === accountId);
    }
    if (category) {
      results = results.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }
    if (type) {
      results = results.filter(t => t.type === type);
    }
    if (source) {
      results = results.filter(t => t.source === source);
    }
    if (startDate) {
      results = results.filter(t => t.date >= startDate);
    }
    if (endDate) {
      results = results.filter(t => t.date <= endDate);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        t =>
          t.description.toLowerCase().includes(q) ||
          t.merchantName.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.bankReferenceId && t.bankReferenceId.toLowerCase().includes(q))
      );
    }

    // Sort by date desc
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accountId, date, description, amount, type, category, notes, transferToAccountId } = body;

    if (!accountId || !date || !amount) {
      return NextResponse.json({ error: 'Account, date, and amount are required.' }, { status: 400 });
    }

    const desc = (description || 'Manual Transaction').trim();
    const merchant = extractMerchantFromNarration(desc);

    const newTxn: Transaction = {
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      accountId,
      date,
      description: desc,
      originalDescription: desc,
      merchantName: merchant,
      amount: Math.abs(parseFloat(amount)),
      type: (type as TransactionType) || 'expense',
      category: category || 'General',
      source: 'Manual' as TransactionSource,
      notes: notes || '',
      transferToAccountId: transferToAccountId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const db = readDatabase();
    db.transactions.unshift(newTxn);
    writeDatabase(db);

    return NextResponse.json({ transaction: newTxn }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, category, type, accountId, notes, merchantName, description, learnMerchantRule } = body;

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
    }

    const db = readDatabase();
    const index = db.transactions.findIndex(t => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }

    const current = db.transactions[index];
    const oldCategory = current.category;

    const updated: Transaction = {
      ...current,
      category: category !== undefined ? category : current.category,
      type: type !== undefined ? type : current.type,
      accountId: accountId !== undefined ? accountId : current.accountId,
      notes: notes !== undefined ? notes : current.notes,
      merchantName: merchantName !== undefined ? merchantName : current.merchantName,
      description: description !== undefined ? description : current.description,
      updatedAt: new Date().toISOString(),
    };

    db.transactions[index] = updated;

    // Feature 4: "Remember manually corrected merchant-category mappings for future imports."
    if (category && category !== oldCategory && (learnMerchantRule !== false)) {
      const keyword = (updated.merchantName || updated.description).toUpperCase().slice(0, 30);
      const existingMappingIndex = db.merchantMappings.findIndex(
        m => m.pattern.toUpperCase() === keyword || keyword.includes(m.pattern.toUpperCase())
      );

      if (existingMappingIndex !== -1) {
        db.merchantMappings[existingMappingIndex].category = category;
        db.merchantMappings[existingMappingIndex].isUserOverride = true;
        db.merchantMappings[existingMappingIndex].updatedAt = new Date().toISOString();
      } else {
        db.merchantMappings.push({
          id: `m-${Date.now()}`,
          pattern: keyword,
          merchantName: updated.merchantName || keyword,
          category,
          isUserOverride: true,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    writeDatabase(db);

    return NextResponse.json({ transaction: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required.' }, { status: 400 });
    }

    const db = readDatabase();
    const initialLen = db.transactions.length;
    db.transactions = db.transactions.filter(t => t.id !== id);

    if (db.transactions.length === initialLen) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }

    writeDatabase(db);
    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

