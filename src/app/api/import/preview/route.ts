import { NextResponse } from 'next/server';
import { readDatabase } from '@/lib/db';
import { parseBankStatementCSV, transformRowsToPreviews } from '@/lib/csv-parser';
import { markDuplicatesInPreviews } from '@/lib/duplicate-detector';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let csvContent = '';
    let accountId = '';
    let customMapping: any = undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      accountId = (formData.get('accountId') as string) || '';
      const customMappingStr = formData.get('customMapping') as string;

      if (!file) {
        return NextResponse.json({ error: 'No CSV file provided.' }, { status: 400 });
      }

      // Security check: restrict file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 10MB limit.' }, { status: 400 });
      }

      csvContent = await file.text();

      if (customMappingStr) {
        try {
          customMapping = JSON.parse(customMappingStr);
        } catch (e) {
          // ignore invalid custom mapping JSON
        }
      }
    } else {
      const body = await req.json();
      csvContent = body.csvContent;
      accountId = body.accountId;
      customMapping = body.customMapping;
    }

    if (!csvContent || !csvContent.trim()) {
      return NextResponse.json({ error: 'CSV statement content is empty.' }, { status: 400 });
    }

    if (!accountId) {
      return NextResponse.json({ error: 'Please select a bank account to import into.' }, { status: 400 });
    }

    const db = readDatabase();
    const account = db.accounts.find(a => a.id === accountId);
    if (!account) {
      return NextResponse.json({ error: 'Selected bank account was not found.' }, { status: 404 });
    }

    // 1. Parse CSV
    const { headers, mapping, detectedBank, rows, rawRowsCount } = parseBankStatementCSV(
      csvContent,
      customMapping
    );

    // 2. Transform into normalized previews with auto-categorization
    const rawPreviews = transformRowsToPreviews(rows, mapping, db.merchantMappings as any);

    // 3. Intelligent Duplicate Detection
    const previews = markDuplicatesInPreviews(rawPreviews, db.transactions, accountId);

    const duplicateCount = previews.filter(p => p.isDuplicate).length;
    const readyCount = previews.filter(p => !p.isDuplicate).length;

    return NextResponse.json({
      success: true,
      bankName: detectedBank || account.bankName,
      headers,
      detectedMapping: mapping,
      previews,
      stats: {
        rawRowsCount,
        parsedCount: previews.length,
        readyCount,
        duplicateCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to parse bank statement.' }, { status: 400 });
  }
}

