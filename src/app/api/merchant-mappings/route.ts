import { NextResponse } from 'next/server';
import { readDatabase, writeDatabase } from '@/lib/db';
import { MerchantMapping } from '@/lib/types';

export async function GET() {
  try {
    const db = readDatabase();
    return NextResponse.json({ merchantMappings: db.merchantMappings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pattern, merchantName, category, defaultType } = body;

    if (!pattern || !category) {
      return NextResponse.json({ error: 'Pattern and category are required.' }, { status: 400 });
    }

    const db = readDatabase();
    const patUpper = pattern.toUpperCase().trim();
    const existingIdx = db.merchantMappings.findIndex(m => m.pattern.toUpperCase() === patUpper);

    const mappingItem: MerchantMapping = {
      id: existingIdx !== -1 ? db.merchantMappings[existingIdx].id : `m-${Date.now()}`,
      pattern: patUpper,
      merchantName: merchantName ? merchantName.trim() : pattern.trim(),
      category: category.trim(),
      defaultType,
      isUserOverride: true,
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      db.merchantMappings[existingIdx] = mappingItem;
    } else {
      db.merchantMappings.push(mappingItem);
    }

    writeDatabase(db);
    return NextResponse.json({ mapping: mappingItem });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mapping ID is required.' }, { status: 400 });
    }

    const db = readDatabase();
    db.merchantMappings = db.merchantMappings.filter(m => m.id !== id);
    writeDatabase(db);

    return NextResponse.json({ deleted: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

