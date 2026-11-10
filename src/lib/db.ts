import fs from 'fs';
import path from 'path';
import { Account, Category, ImportBatch, MerchantMapping, Transaction } from './types';
import { appendToGoogleSheet, getGoogleSheetsClient } from './google-sheets';

export interface FinoraDatabase {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  merchantMappings: MerchantMapping[];
  importHistory: ImportBatch[];
  targets: Array<{ id: string; category: string; targetAmount: number; period: string; updatedAt: string }>;
  budgets: Array<{ id: string; month: string; totalBudget: number; allocatedAmount: number; updatedAt: string }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'finora_data.json');

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Food & Dining', icon: 'Utensils', color: '#10B981', monthlyTarget: 15000, dailyTarget: 500 },
  { id: 'cat-2', name: 'Groceries', icon: 'ShoppingCart', color: '#059669', monthlyTarget: 12000, dailyTarget: 400 },
  { id: 'cat-3', name: 'Travel & Commute', icon: 'Car', color: '#0284C7', monthlyTarget: 8000, dailyTarget: 260 },
  { id: 'cat-4', name: 'Shopping', icon: 'ShoppingBag', color: '#8B5CF6', monthlyTarget: 10000, dailyTarget: 330 },
  { id: 'cat-5', name: 'Entertainment', icon: 'Film', color: '#EC4899', monthlyTarget: 4000, dailyTarget: 130 },
  { id: 'cat-6', name: 'Subscriptions', icon: 'CreditCard', color: '#6366F1', monthlyTarget: 3000, dailyTarget: 100 },
  { id: 'cat-7', name: 'Fuel', icon: 'Fuel', color: '#F59E0B', monthlyTarget: 6000, dailyTarget: 200 },
  { id: 'cat-8', name: 'Utilities', icon: 'Zap', color: '#14B8A6', monthlyTarget: 5000, dailyTarget: 160 },
  { id: 'cat-9', name: 'Healthcare', icon: 'HeartPulse', color: '#EF4444', monthlyTarget: 4000, dailyTarget: 130 },
  { id: 'cat-10', name: 'Investments', icon: 'TrendingUp', color: '#10B981', monthlyTarget: 25000, dailyTarget: 830 },
  { id: 'cat-11', name: 'Salary & Income', icon: 'Briefcase', color: '#10B981', monthlyTarget: 0, dailyTarget: 0 },
  { id: 'cat-12', name: 'Other Expenses', icon: 'HelpCircle', color: '#64748B', monthlyTarget: 5000, dailyTarget: 160 },
];

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-hdfc-salary',
    name: 'HDFC Corporate Salary',
    bankName: 'HDFC Bank',
    accountType: 'Salary Account',
    accountNumber: '•••• 8921',
    openingBalance: 45000,
    currentBalance: 45000,
    currency: 'INR',
    color: '#0284C7',
    icon: 'Landmark',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-sbi-savings',
    name: 'SBI Emergency Savings',
    bankName: 'State Bank of India',
    accountType: 'Savings Account',
    accountNumber: '•••• 3410',
    openingBalance: 82500,
    currentBalance: 82500,
    currency: 'INR',
    color: '#059669',
    icon: 'Building2',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-icici-cc',
    name: 'ICICI Amazon Pay Card',
    bankName: 'ICICI Bank',
    accountType: 'Credit Card',
    accountNumber: '•••• 1092',
    openingBalance: 12400,
    currentBalance: 12400,
    currency: 'INR',
    color: '#8B5CF6',
    icon: 'CreditCard',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-cash',
    name: 'Physical Cash Wallet',
    bankName: 'Cash',
    accountType: 'Cash',
    accountNumber: '•••• 0000',
    openingBalance: 6500,
    currentBalance: 6500,
    currency: 'INR',
    color: '#10B981',
    icon: 'Wallet',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getInitialDB(): FinoraDatabase {
  return {
    accounts: INITIAL_ACCOUNTS,
    transactions: [],
    categories: INITIAL_CATEGORIES,
    merchantMappings: [
      { id: 'm-1', pattern: 'SWIGGY', merchantName: 'Swiggy', category: 'Food & Dining', isUserOverride: false, updatedAt: new Date().toISOString() },
      { id: 'm-2', pattern: 'ZOMATO', merchantName: 'Zomato', category: 'Food & Dining', isUserOverride: false, updatedAt: new Date().toISOString() },
      { id: 'm-3', pattern: 'UBER', merchantName: 'Uber', category: 'Travel & Commute', isUserOverride: false, updatedAt: new Date().toISOString() },
      { id: 'm-4', pattern: 'AMAZON', merchantName: 'Amazon', category: 'Shopping', isUserOverride: false, updatedAt: new Date().toISOString() },
      { id: 'm-5', pattern: 'NETFLIX', merchantName: 'Netflix', category: 'Entertainment', isUserOverride: false, updatedAt: new Date().toISOString() },
    ],
    importHistory: [],
    targets: [],
    budgets: [],
  };
}

export function readDatabase(): FinoraDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }

    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      accounts: parsed.accounts || [],
      transactions: parsed.transactions || [],
      categories: parsed.categories || INITIAL_CATEGORIES,
      merchantMappings: parsed.merchantMappings || [],
      importHistory: parsed.importHistory || [],
      targets: parsed.targets || [],
      budgets: parsed.budgets || [],
    };
  } catch (err) {
    console.error('Error reading database file, returning initial database:', err);
    return getInitialDB();
  }
}

export function writeDatabase(data: FinoraDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // Async sync to Google Sheets if configured
    if (getGoogleSheetsClient()) {
      syncDbToGoogleSheets(data).catch(err => {
        console.error('Background Google Sheets sync error:', err);
      });
    }
  } catch (err) {
    console.error('Error writing database file:', err);
    throw err;
  }
}

/**
 * Background sync to Google Sheets
 */
export async function syncDbToGoogleSheets(data: FinoraDatabase) {
  try {
    if (data.accounts.length > 0) {
      await appendToGoogleSheet('Accounts', data.accounts);
    }
    if (data.transactions.length > 0) {
      await appendToGoogleSheet('Transactions', data.transactions);
    }
    if (data.importHistory.length > 0) {
      await appendToGoogleSheet('ImportHistory', data.importHistory);
    }
  } catch (err) {
    console.error('Google Sheets sync failed:', err);
  }
}

