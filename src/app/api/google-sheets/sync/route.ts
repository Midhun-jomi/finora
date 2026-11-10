import { NextResponse } from 'next/server';
import { readDatabase, syncDbToGoogleSheets } from '@/lib/db';
import { getGoogleSheetsClient, initializeSpreadsheet } from '@/lib/google-sheets';

export async function GET() {
  try {
    const client = getGoogleSheetsClient();
    if (!client) {
      return NextResponse.json({
        connected: false,
        message: 'Google Sheets credentials not set in environment (GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY). Local secure database engine is actively storing all data.',
      });
    }

    const test = await initializeSpreadsheet(client.sheetId);
    return NextResponse.json({
      connected: test.initialized,
      sheetId: client.sheetId,
      existingSheets: test.existingSheets,
      message: test.initialized ? 'Google Sheets connected successfully.' : test.message || test.error,
    });
  } catch (err: any) {
    return NextResponse.json({ connected: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const client = getGoogleSheetsClient();
    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Google Sheets credentials not configured. Financial records are securely maintained in local database.',
      }, { status: 400 });
    }

    const db = readDatabase();
    await initializeSpreadsheet(client.sheetId);
    await syncDbToGoogleSheets(db);

    return NextResponse.json({
      success: true,
      message: 'All Accounts, Transactions, and Import History successfully synced to Google Sheets!',
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
