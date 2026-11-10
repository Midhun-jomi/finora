import Papa from 'papaparse';
import { ColumnMapping, ParsedTransactionPreview, TransactionType } from './types';
import { categorizeTransaction } from './categorizer';

export interface BankStatementProfile {
  bankId: string;
  bankName: string;
  headerKeywords: string[];
  dateAliases: string[];
  descriptionAliases: string[];
  debitAliases: string[];
  creditAliases: string[];
  amountAliases: string[];
  typeAliases: string[];
  balanceAliases: string[];
  refAliases: string[];
}

export const KNOWN_BANK_PROFILES: BankStatementProfile[] = [
  {
    bankId: 'sbi',
    bankName: 'State Bank of India',
    headerKeywords: ['Txn Date', 'Value Date', 'Ref No./Cheque No.', 'Withdrawal (Dr)', 'Deposit (Cr)'],
    dateAliases: ['Txn Date', 'Transaction Date', 'Txn Date.', 'Date'],
    descriptionAliases: ['Description', 'Narration', 'Particulars', 'Remarks'],
    debitAliases: ['Debit', 'Withdrawal (Dr)', 'Withdrawal', 'Dr Amount', 'Debit Amount'],
    creditAliases: ['Credit', 'Deposit (Cr)', 'Deposit', 'Cr Amount', 'Credit Amount'],
    amountAliases: ['Amount'],
    typeAliases: ['Dr / Cr', 'Type'],
    balanceAliases: ['Balance', 'Balance (INR)', 'Closing Balance'],
    refAliases: ['Ref No./Cheque No.', 'Ref No', 'Cheque No.', 'UTR/Ref No', 'Cheque/Ref.No.'],
  },
  {
    bankId: 'hdfc',
    bankName: 'HDFC Bank',
    headerKeywords: ['Chq./Ref.No.', 'Value Dt', 'Withdrawal Amt.', 'Deposit Amt.', 'Closing Balance'],
    dateAliases: ['Date', 'Txn Date', 'Transaction Date'],
    descriptionAliases: ['Narration', 'Description', 'Transaction Details'],
    debitAliases: ['Withdrawal Amt.', 'Withdrawal Amount', 'Debit', 'Withdrawal Amt'],
    creditAliases: ['Deposit Amt.', 'Deposit Amount', 'Credit', 'Deposit Amt'],
    amountAliases: ['Amount'],
    typeAliases: ['Dr/Cr', 'Type'],
    balanceAliases: ['Closing Balance', 'Closing Bal', 'Balance'],
    refAliases: ['Chq./Ref.No.', 'Chq/Ref No', 'Ref No.', 'Cheque No.'],
  },
  {
    bankId: 'icici',
    bankName: 'ICICI Bank',
    headerKeywords: ['Transaction Remarks', 'Withdrawal Amount (INR)', 'Deposit Amount (INR)', 'Balance (INR)'],
    dateAliases: ['Transaction Date', 'Value Date', 'Date'],
    descriptionAliases: ['Transaction Remarks', 'Particulars', 'Narration', 'Description'],
    debitAliases: ['Withdrawal Amount (INR)', 'Withdrawal Amount', 'Debit', 'Dr Amount'],
    creditAliases: ['Deposit Amount (INR)', 'Deposit Amount', 'Credit', 'Cr Amount'],
    amountAliases: ['Amount'],
    typeAliases: ['Type'],
    balanceAliases: ['Balance (INR)', 'Balance', 'Available Balance'],
    refAliases: ['Cheque No', 'Cheque No.', 'Ref No.', 'UTR Number'],
  },
  {
    bankId: 'axis',
    bankName: 'Axis Bank',
    headerKeywords: ['Tran Date', 'CHQNO', 'PARTICULARS', 'DR', 'CR', 'BAL'],
    dateAliases: ['Tran Date', 'Transaction Date', 'Date'],
    descriptionAliases: ['PARTICULARS', 'Particulars', 'Description', 'Narration'],
    debitAliases: ['DR', 'Debit', 'Dr Amount'],
    creditAliases: ['CR', 'Credit', 'Cr Amount'],
    amountAliases: ['Amount'],
    typeAliases: ['Type'],
    balanceAliases: ['BAL', 'Balance', 'Net Balance'],
    refAliases: ['CHQNO', 'Cheque No', 'Chq No', 'Ref No'],
  },
  {
    bankId: 'federal',
    bankName: 'Federal Bank',
    headerKeywords: ['Withdrawals', 'Deposits', 'Cheque No'],
    dateAliases: ['Date', 'Txn Date'],
    descriptionAliases: ['Description', 'Narration', 'Particulars'],
    debitAliases: ['Withdrawals', 'Withdrawal', 'Debit'],
    creditAliases: ['Deposits', 'Deposit', 'Credit'],
    amountAliases: ['Amount'],
    typeAliases: ['Type'],
    balanceAliases: ['Balance', 'Closing Balance'],
    refAliases: ['Cheque No', 'Ref No'],
  },
  {
    bankId: 'canara',
    bankName: 'Canara Bank',
    headerKeywords: ['TRANS DATE', 'VALUE DATE', 'REMARKS', 'CHEQUE NO', 'DEBIT', 'CREDIT'],
    dateAliases: ['TRANS DATE', 'TRANSACTION DATE', 'Date'],
    descriptionAliases: ['REMARKS', 'Particulars', 'Narration'],
    debitAliases: ['DEBIT', 'Debit', 'DR AMOUNT'],
    creditAliases: ['CREDIT', 'Credit', 'CR AMOUNT'],
    amountAliases: ['AMOUNT', 'Amount'],
    typeAliases: ['TYPE'],
    balanceAliases: ['BALANCE', 'Balance'],
    refAliases: ['CHEQUE NO', 'Ref No'],
  },
];

/**
 * Clean Indian/Western numeric strings:
 * "1,50,000.00" -> 150000
 * "₹ 4,500.50" -> 4500.50
 * "120.00 (Dr)" -> 120
 * "(500.00)" -> 500
 */
export function cleanAmount(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.abs(val);

  let str = String(val).trim();
  if (!str || str === '-' || str === '--') return 0;

  // Remove currency signs, commas, Dr/Cr
  str = str.replace(/[₹$€£\s,]/g, '');
  // If wrapped in parentheses like (500), strip them
  if (str.startsWith('(') && str.endsWith(')')) {
    str = str.slice(1, -1);
  }
  // Strip trailing or leading Dr/Cr
  str = str.replace(/(?:dr|cr)$/i, '').replace(/^(?:dr|cr)/i, '');

  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Standardize varied bank date strings to ISO YYYY-MM-DD
 * Supports: DD/MM/YYYY, DD-MM-YYYY, DD/MM/YY, DD-Mon-YYYY (15-Jan-2024), YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const str = dateStr.trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Month lookup table for DD-Mon-YYYY e.g., 15-Jan-2024 or 15-Jan-24
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };

  const monMatch = str.match(/^(\d{1,2})[-\/\s]([A-Za-z]{3})[-\/\s](\d{2,4})$/i);
  if (monMatch) {
    const day = monMatch[1].padStart(2, '0');
    const mon = monthMap[monMatch[2].toLowerCase()] || '01';
    let year = monMatch[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${mon}-${day}`;
  }

  // Handle DD/MM/YYYY or DD-MM-YYYY or DD/MM/YY
  const dmyMatch = str.match(/^(\d{1,2})[-\/\.](\d{1,2})[-\/\.](\d{2,4})(?:\s+.*)?$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = '20' + year;
    }
    // Simple sanity check if day and month might be inverted if month > 12
    if (parseInt(month, 10) > 12 && parseInt(day, 10) <= 12) {
      return `${year}-${day}-${month}`;
    }
    return `${year}-${month}-${day}`;
  }

  // Fallback to Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Scan raw parsed rows to find the actual table header index,
 * bypassing preamble lines (e.g. Account No, Branch Name, Customer Address, etc.)
 */
export function findHeaderRowIndex(rows: any[][]): number {
  const commonHeaderKeywords = [
    'date', 'txn date', 'transaction date', 'tran date',
    'narration', 'description', 'particulars',
    'debit', 'credit', 'withdrawal', 'deposit', 'balance', 'amount'
  ];

  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    const rowText = row.map(cell => String(cell || '').trim().toLowerCase()).join(' ');
    let matchCount = 0;
    for (const kw of commonHeaderKeywords) {
      if (rowText.includes(kw)) {
        matchCount++;
      }
    }

    if (matchCount >= 2) {
      return i;
    }
  }

  return 0; // fallback to row 0
}

/**
 * Auto-detect column mapping given headers
 */
export function autoDetectColumnMapping(headers: string[]): {
  mapping: ColumnMapping;
  detectedBank?: string;
} {
  const cleanHeaders = headers.map(h => String(h || '').trim());
  const lowerHeaders = cleanHeaders.map(h => h.toLowerCase());

  let detectedBank: string | undefined;

  // 1. Try matching known bank profiles
  for (const profile of KNOWN_BANK_PROFILES) {
    let kwHits = 0;
    for (const kw of profile.headerKeywords) {
      if (lowerHeaders.some(h => h.includes(kw.toLowerCase()))) {
        kwHits++;
      }
    }
    if (kwHits >= 2) {
      detectedBank = profile.bankName;
      break;
    }
  }

  const findHeaderIndex = (aliases: string[]): string => {
    for (const alias of aliases) {
      const aliasLower = alias.toLowerCase();
      // exact match first
      const exactIdx = lowerHeaders.findIndex(h => h === aliasLower);
      if (exactIdx !== -1) return cleanHeaders[exactIdx];
      // partial match
      const partIdx = lowerHeaders.findIndex(h => h.includes(aliasLower));
      if (partIdx !== -1) return cleanHeaders[partIdx];
    }
    return '';
  };

  const dateCol = findHeaderIndex([
    'date', 'txn date', 'transaction date', 'tran date', 'value date', 'trans date'
  ]);

  const descCol = findHeaderIndex([
    'narration', 'description', 'particulars', 'transaction remarks', 'remarks', 'details'
  ]);

  const debitCol = findHeaderIndex([
    'withdrawal amt.', 'withdrawal amount', 'withdrawal (dr)', 'withdrawals',
    'debit', 'dr', 'dr amount', 'withdrawal', 'spent'
  ]);

  const creditCol = findHeaderIndex([
    'deposit amt.', 'deposit amount', 'deposit (cr)', 'deposits',
    'credit', 'cr', 'cr amount', 'deposit', 'received'
  ]);

  const amountCol = findHeaderIndex([
    'amount', 'txn amount', 'transaction amount'
  ]);

  const balanceCol = findHeaderIndex([
    'closing balance', 'balance (inr)', 'balance', 'bal', 'closing bal', 'net balance'
  ]);

  const refCol = findHeaderIndex([
    'ref no./cheque no.', 'chq./ref.no.', 'cheque no', 'chqno', 'cheque no.',
    'ref no', 'utr', 'reference number', 'transaction id'
  ]);

  return {
    mapping: {
      date: dateCol,
      description: descCol,
      debit: debitCol,
      credit: creditCol,
      amount: amountCol,
      balance: balanceCol,
      referenceNumber: refCol,
    },
    detectedBank,
  };
}

/**
 * Full CSV parsing orchestration:
 * Reads text, discovers table boundaries, creates columns mapping, extracts rows
 */
export function parseBankStatementCSV(
  csvContent: string,
  customMapping?: ColumnMapping
): {
  headers: string[];
  mapping: ColumnMapping;
  detectedBank?: string;
  rows: Array<Record<string, any>>;
  rawRowsCount: number;
} {
  // Parse CSV as raw arrays first
  const parsedRaw = Papa.parse<string[]>(csvContent, {
    skipEmptyLines: 'greedy',
  });

  if (!parsedRaw.data || parsedRaw.data.length === 0) {
    throw new Error('CSV file is empty or could not be parsed.');
  }

  const headerIdx = findHeaderRowIndex(parsedRaw.data);
  const rawHeaders = (parsedRaw.data[headerIdx] || []).map(h => String(h || '').trim());
  // Filter out any purely blank headers
  const headers = rawHeaders.filter(h => h.length > 0);

  const { mapping: autoMapping, detectedBank } = autoDetectColumnMapping(headers);
  const mapping = customMapping || autoMapping;

  // Extract data rows below headerIdx
  const rows: Array<Record<string, any>> = [];
  for (let i = headerIdx + 1; i < parsedRaw.data.length; i++) {
    const rawRow = parsedRaw.data[i];
    if (!rawRow || rawRow.length === 0) continue;

    // Skip summary / footer rows (e.g. "Total Debit", "Closing Balance", "** End of Statement **")
    const joinedRow = rawRow.join(' ').toLowerCase();
    if (
      joinedRow.includes('end of statement') ||
      joinedRow.includes('total debit') ||
      joinedRow.includes('opening balance') ||
      joinedRow.includes('generated on') ||
      joinedRow.includes('page ')
    ) {
      continue;
    }

    const rowObj: Record<string, any> = {};
    let hasSomeValue = false;

    rawHeaders.forEach((header, idx) => {
      if (header && idx < rawRow.length) {
        const val = rawRow[idx];
        rowObj[header] = val;
        if (val && String(val).trim().length > 0) {
          hasSomeValue = true;
        }
      }
    });

    if (hasSomeValue) {
      rows.push(rowObj);
    }
  }

  return {
    headers,
    mapping,
    detectedBank,
    rows,
    rawRowsCount: rows.length,
  };
}

/**
 * Converts raw parsed rows into normalized Finora preview items with auto-categorization
 */
export function transformRowsToPreviews(
  rows: Array<Record<string, any>>,
  mapping: ColumnMapping,
  userMappings = []
): ParsedTransactionPreview[] {
  const previews: ParsedTransactionPreview[] = [];

  rows.forEach((row, idx) => {
    const rawDate = row[mapping.date] || '';
    const date = normalizeDate(rawDate);
    const description = (row[mapping.description] || 'Bank Transaction').trim();
    const ref = mapping.referenceNumber ? (row[mapping.referenceNumber] || '').trim() : '';

    let debit = 0;
    let credit = 0;

    if (mapping.debit && row[mapping.debit] !== undefined) {
      debit = cleanAmount(row[mapping.debit]);
    }
    if (mapping.credit && row[mapping.credit] !== undefined) {
      credit = cleanAmount(row[mapping.credit]);
    }

    // Single amount column with Type ('Dr'/'Cr' or sign)
    if (debit === 0 && credit === 0 && mapping.amount && row[mapping.amount] !== undefined) {
      const amtStr = String(row[mapping.amount]).trim();
      const numAmt = cleanAmount(amtStr);
      if (amtStr.includes('Cr') || amtStr.includes('+')) {
        credit = numAmt;
      } else {
        debit = numAmt;
      }
    }

    // Skip zero amount transactions or empty rows
    if (debit === 0 && credit === 0) {
      return;
    }

    const isCredit = credit > 0 && debit === 0;
    const amount = isCredit ? credit : debit;
    const balance = mapping.balance && row[mapping.balance] ? cleanAmount(row[mapping.balance]) : undefined;

    // Automatic Categorization & Type Deduction
    const catResult = categorizeTransaction(
      description,
      userMappings,
      isCredit ? 'credit' : 'debit'
    );

    let finalType: TransactionType = catResult.suggestedType || (isCredit ? 'income' : 'expense');

    previews.push({
      tempId: `preview-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      date,
      rawDate,
      description,
      originalDescription: description,
      merchantName: catResult.merchantName,
      debit,
      credit,
      amount,
      type: finalType,
      category: catResult.category,
      balance,
      referenceNumber: ref,
      isDuplicate: false,
      selected: true, // selected for import by default
    });
  });

  return previews;
}

