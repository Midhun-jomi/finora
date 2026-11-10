import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';
import { computeFinancialKPIs } from '@/lib/financial-calculator';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;

    const db = readDatabase();
    const kpis = computeFinancialKPIs(db.accounts, db.transactions, db.categories, date);

    return NextResponse.json({ kpis });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

