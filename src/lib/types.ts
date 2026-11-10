export type AccountType =
  | 'Savings Account'
  | 'Salary Account'
  | 'Current Account'
  | 'Cash'
  | 'UPI Wallet'
  | 'Debit Card'
  | 'Credit Card'
  | 'Digital Wallet'
  | 'Investment Account';

export type AccountStatus = 'active' | 'archived';

export interface Account {
  id: string;
  name: string;
  bankName: string;
  accountType: AccountType;
  accountNumber: string; // Only masked/last 4 digits (e.g., •••• 4892)
  openingBalance: number;
  currentBalance: number;
  currency: string;
  color: string;
  icon: string;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType =
  | 'expense'
  | 'income'
  | 'transfer'
  | 'refund'
  | 'credit_card_payment';

export type TransactionSource = 'Manual' | 'CSV Import' | 'Future Bank Sync';

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  description: string;
  originalDescription: string;
  merchantName: string;
  amount: number; // positive value
  type: TransactionType;
  category: string;
  source: TransactionSource;
  importBatchId?: string;
  bankReferenceId?: string;
  importedAt?: string;
  balanceAfter?: number;
  transferToAccountId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyTarget: number;
  dailyTarget: number;
}

export interface MerchantMapping {
  id: string;
  pattern: string; // keyword match (uppercase)
  merchantName: string;
  category: string;
  defaultType?: TransactionType;
  isUserOverride: boolean;
  updatedAt: string;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  accountId: string;
  accountName: string;
  importedAt: string;
  totalParsed: number;
  successfulCount: number;
  duplicateCount: number;
  failedCount: number;
}

export interface ParsedTransactionPreview {
  tempId: string;
  date: string;
  rawDate: string;
  description: string;
  originalDescription: string;
  merchantName: string;
  debit: number;
  credit: number;
  amount: number;
  type: TransactionType;
  category: string;
  balance?: number;
  referenceNumber: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  existingTransactionId?: string;
  selected: boolean;
}

export interface ColumnMapping {
  date: string;
  description: string;
  debit: string;
  credit: string;
  amount?: string;
  type?: string;
  balance?: string;
  referenceNumber?: string;
}

export interface FinancialKPIs {
  totalBalance: number;
  totalBankBalance: number;
  totalCashBalance: number;
  totalCreditCardOutstanding: number;
  dailyExpense: number;
  monthlyExpense: number;
  monthlyIncome: number;
  netSavings: number;
  budgetUtilization: number;
  accountCount: number;
  lastImportDate: string | null;
  recentImportedCount: number;
  categorySpending: Array<{
    category: string;
    amount: number;
    monthlyTarget: number;
    dailyTarget: number;
    dailySpent: number;
    percentage: number;
    color?: string;
  }>;
  recentTransactions: Transaction[];
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetNames: {
    accounts: string;
    transactions: string;
    categories: string;
    merchantMappings: string;
    importHistory: string;
    targets: string;
    budgets: string;
  };
  connected: boolean;
  lastSyncedAt?: string;
}

