import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const sheetInput = (body.sheetId || body.spreadsheetUrl || '').trim();
    let explicitId: string | undefined = undefined;

    if (sheetInput) {
      const match = sheetInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
      explicitId = match ? match[1] : sheetInput;
      process.env.GOOGLE_SHEET_ID = explicitId;

      // Update .env.local file
      try {
        const envPath = path.join(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf-8');
          if (envContent.includes('GOOGLE_SHEET_ID=')) {
            envContent = envContent.replace(/GOOGLE_SHEET_ID=.*/, `GOOGLE_SHEET_ID=${explicitId}`);
          } else {
            envContent = `GOOGLE_SHEET_ID=${explicitId}\n` + envContent;
          }
          fs.writeFileSync(envPath, envContent, 'utf-8');
        }
      } catch (e) {
        console.error('Could not update .env.local:', e);
      }
    }

    const client = getGoogleSheetsClient(explicitId);
    if (!client) {
      return NextResponse.json({
        success: false,
        message: 'Google Sheets credentials not configured. Please supply a Sheet ID or URL and service account keys.',
      }, { status: 400 });
    }

    const initRes = await initializeSpreadsheet(client.sheetId);
    if (!initRes.initialized) {
      return NextResponse.json({
        success: false,
        message: initRes.message || initRes.error || 'Failed to initialize spreadsheet. Make sure you shared the sheet with the service account email as Editor.',
      }, { status: 400 });
    }

    const db = readDatabase();
    await syncDbToGoogleSheets(db);

    return NextResponse.json({
      success: true,
      sheetId: client.sheetId,
      message: 'Successfully connected and synced all 7 sheets with Google Sheets!',
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
