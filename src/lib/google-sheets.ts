import { google } from 'googleapis';

export interface GoogleSheetsClientConfig {
  sheetId?: string;
  clientEmail?: string;
  privateKey?: string;
}

export function getGoogleSheetsClient(overrideSheetId?: string) {
  const sheetId = overrideSheetId || process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    return null;
  }

  // Handle escaped newlines in env private key
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return { sheets, sheetId };
}

export const REQUIRED_SHEET_HEADERS = {
  Accounts: [
    'id', 'name', 'bankName', 'accountType', 'accountNumber',
    'openingBalance', 'currentBalance', 'currency', 'color',
    'icon', 'status', 'createdAt', 'updatedAt'
  ],
  Transactions: [
    'id', 'accountId', 'date', 'description', 'originalDescription',
    'merchantName', 'amount', 'type', 'category', 'source',
    'importBatchId', 'bankReferenceId', 'importedAt', 'balanceAfter',
    'notes', 'createdAt', 'updatedAt'
  ],
  Categories: [
    'id', 'name', 'icon', 'color', 'monthlyTarget', 'dailyTarget'
  ],
  MerchantMappings: [
    'id', 'pattern', 'merchantName', 'category', 'defaultType', 'isUserOverride', 'updatedAt'
  ],
  ImportHistory: [
    'id', 'fileName', 'accountId', 'accountName', 'importedAt',
    'totalParsed', 'successfulCount', 'duplicateCount', 'failedCount'
  ],
  Targets: [
    'id', 'category', 'targetAmount', 'period', 'updatedAt'
  ],
  Budgets: [
    'id', 'month', 'totalBudget', 'allocatedAmount', 'updatedAt'
  ]
};

/**
 * Initializes and ensures all required sheets exist with their header rows.
 */
export async function initializeSpreadsheet(sheetId: string) {
  const client = getGoogleSheetsClient();
  if (!client) {
    return { initialized: false, message: 'Google Sheets credentials not configured.' };
  }

  try {
    const meta = await client.sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const existingSheets = (meta.data.sheets || []).map(s => s.properties?.title || '');
    const sheetsToCreate = Object.keys(REQUIRED_SHEET_HEADERS).filter(
      name => !existingSheets.includes(name)
    );

    if (sheetsToCreate.length > 0) {
      await client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: sheetsToCreate.map(title => ({
            addSheet: {
              properties: { title },
            },
          })),
        },
      });

      // Write headers
      for (const title of sheetsToCreate) {
        const headers = REQUIRED_SHEET_HEADERS[title as keyof typeof REQUIRED_SHEET_HEADERS];
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${title}!A1:${String.fromCharCode(64 + headers.length)}1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [headers],
          },
        });
      }
    }

    return { initialized: true, existingSheets };
  } catch (err: any) {
    return { initialized: false, error: err.message };
  }
}

/**
 * Reads all rows from a sheet and returns as an array of objects
 */
export async function readFromGoogleSheet(sheetName: keyof typeof REQUIRED_SHEET_HEADERS): Promise<any[]> {
  const client = getGoogleSheetsClient();
  if (!client) return [];

  try {
    const res = await client.sheets.spreadsheets.values.get({
      spreadsheetId: client.sheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return [];

    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((h: string, idx: number) => {
        obj[h] = row[idx] !== undefined ? row[idx] : '';
      });
      return obj;
    });
  } catch (err) {
    console.error(`Error reading from Google Sheet ${sheetName}:`, err);
    return [];
  }
}

/**
 * Appends rows to a sheet
 */
export async function appendToGoogleSheet(
  sheetName: keyof typeof REQUIRED_SHEET_HEADERS,
  rows: any[]
): Promise<boolean> {
  const client = getGoogleSheetsClient();
  if (!client || rows.length === 0) return false;

  try {
    const headers = REQUIRED_SHEET_HEADERS[sheetName];
    const values = rows.map(item => headers.map(h => (item[h] !== undefined ? String(item[h]) : '')));

    await client.sheets.spreadsheets.values.append({
      spreadsheetId: client.sheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values,
      },
    });

    return true;
  } catch (err) {
    console.error(`Error appending to Google Sheet ${sheetName}:`, err);
    return false;
  }
}

