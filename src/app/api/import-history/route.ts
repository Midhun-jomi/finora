import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { calculateAccountBalance } from '@/lib/financial-calculator';

export async function GET() {
  try {
    const db = readDatabase();
    return NextResponse.json({ importHistory: db.importHistory });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * Rollback / Undo an import batch:
 * Deletes all transactions associated with this batch ID and recalculates the account balance.
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get('id');

    if (!batchId) {
      return NextResponse.json({ error: 'Import Batch ID is required.' }, { status: 400 });
    }

    const db = readDatabase();
    const batch = db.importHistory.find(b => b.id === batchId);

    // Delete all transactions from this batch
    const remainingTransactions = db.transactions.filter(t => t.importBatchId !== batchId);
    const deletedCount = db.transactions.length - remainingTransactions.length;
    db.transactions = remainingTransactions;

    // Remove the batch from history
    db.importHistory = db.importHistory.filter(b => b.id !== batchId);

    // Recompute account balance if account still exists
    if (batch?.accountId) {
      const acc = db.accounts.find(a => a.id === batch.accountId);
      if (acc) {
        acc.currentBalance = calculateAccountBalance(acc, db.transactions);
      }
    }

    writeDatabase(db);

    return NextResponse.json({
      success: true,
      message: `Rolled back import batch ${batchId}. Removed ${deletedCount} transactions.`,
      deletedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
