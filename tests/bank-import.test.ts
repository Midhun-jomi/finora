import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseBankStatementCSV, transformRowsToPreviews, normalizeDate } from '../src/lib/csv-parser';
import { checkDuplicate, markDuplicatesInPreviews } from '../src/lib/duplicate-detector';
import { categorizeTransaction } from '../src/lib/categorizer';
import { calculateAccountBalance, computeFinancialKPIs } from '../src/lib/financial-calculator';
import { Account, Category, MerchantMapping, Transaction } from '../src/lib/types';

describe('Finora Bank Account & Automated Expense Tracking Test Suite', () => {
  const sampleDir = path.join(__dirname, '../sample-statements');

  // Helper dummy accounts
  const dummySalaryAccount: Account = {
    id: 'acc-hdfc',
    name: 'HDFC Salary Account',
    bankName: 'HDFC Bank',
    accountType: 'Salary Account',
    accountNumber: '•••• 8921',
    openingBalance: 50000,
    currentBalance: 50000,
    currency: 'INR',
    color: '#0284C7',
    icon: 'Landmark',
    status: 'active',
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
  };

  const dummyCreditCard: Account = {
    id: 'acc-icici-cc',
    name: 'ICICI Amazon Pay Card',
    bankName: 'ICICI Bank',
    accountType: 'Credit Card',
    accountNumber: '•••• 1092',
    openingBalance: 10000,
    currentBalance: 10000,
    currency: 'INR',
    color: '#8B5CF6',
    icon: 'CreditCard',
    status: 'active',
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
  };

  const dummyCategories: Category[] = [
    { id: 'c1', name: 'Food & Dining', icon: 'Utensils', color: '#10B981', monthlyTarget: 10000, dailyTarget: 333 },
    { id: 'c2', name: 'Travel & Commute', icon: 'Car', color: '#0284C7', monthlyTarget: 5000, dailyTarget: 166 },
    { id: 'c3', name: 'Shopping', icon: 'ShoppingBag', color: '#8B5CF6', monthlyTarget: 8000, dailyTarget: 266 },
    { id: 'c4', name: 'Entertainment', icon: 'Film', color: '#EC4899', monthlyTarget: 3000, dailyTarget: 100 },
    { id: 'c5', name: 'Subscriptions', icon: 'CreditCard', color: '#6366F1', monthlyTarget: 2000, dailyTarget: 66 },
    { id: 'c6', name: 'Fuel', icon: 'Fuel', color: '#F59E0B', monthlyTarget: 4000, dailyTarget: 133 },
    { id: 'c7', name: 'Salary & Income', icon: 'Briefcase', color: '#10B981', monthlyTarget: 0, dailyTarget: 0 },
  ];

  // Test 1: Import a valid SBI CSV statement
  it('1. Imports a valid SBI CSV statement correctly identifying headers and rows', () => {
    const sbiCsv = fs.readFileSync(path.join(sampleDir, 'sbi_statement.csv'), 'utf-8');
    const { headers, mapping, rows } = parseBankStatementCSV(sbiCsv);

    expect(headers).toContain('Txn Date');
    expect(headers).toContain('Debit');
    expect(headers).toContain('Credit');
    expect(headers).toContain('Balance');

    expect(mapping.date).toBe('Txn Date');
    expect(mapping.debit).toBe('Debit');
    expect(mapping.credit).toBe('Credit');
    expect(rows.length).toBe(6);

    const previews = transformRowsToPreviews(rows, mapping);
    expect(previews.length).toBe(6);
    expect(previews[0].description).toContain('SWIGGY');
    expect(previews[0].debit).toBe(450);
    expect(previews[0].category).toBe('Food & Dining');
  });

  // Test 2: Import an HDFC CSV statement
  it('2. Imports an HDFC CSV statement with metadata preamble and footer lines', () => {
    const hdfcCsv = fs.readFileSync(path.join(sampleDir, 'hdfc_statement.csv'), 'utf-8');
    const { mapping, rows } = parseBankStatementCSV(hdfcCsv);

    expect(mapping.date).toBe('Date');
    expect(mapping.description).toBe('Narration');
    expect(mapping.debit).toBe('Withdrawal Amt.');
    expect(mapping.credit).toBe('Deposit Amt.');
    expect(rows.length).toBe(5);

    const previews = transformRowsToPreviews(rows, mapping);
    expect(previews[0].merchantName).toBe('Zomato');
    expect(previews[0].category).toBe('Food & Dining');
    expect(previews[1].merchantName).toBe('Amazon');
    expect(previews[1].category).toBe('Shopping');
  });

  // Test 3: Import a CSV with different column names (Axis Bank)
  it('3. Imports a CSV with different column names (Axis Bank: Tran Date, PARTICULARS, DR, CR, BAL)', () => {
    const axisCsv = fs.readFileSync(path.join(sampleDir, 'axis_statement.csv'), 'utf-8');
    const { mapping, rows } = parseBankStatementCSV(axisCsv);

    expect(mapping.date).toBe('Tran Date');
    expect(mapping.description).toBe('PARTICULARS');
    expect(mapping.debit).toBe('DR');
    expect(mapping.credit).toBe('CR');
    expect(mapping.balance).toBe('BAL');

    const previews = transformRowsToPreviews(rows, mapping);
    expect(previews.length).toBe(4);
    expect(previews[0].debit).toBe(1450);
    expect(previews[0].merchantName).toBe('Blinkit');
  });

  // Test 4: Import a statement with debit and credit transactions
  it('4. Correctly distinguishes debit and credit transactions as expenses and income', () => {
    const sbiCsv = fs.readFileSync(path.join(sampleDir, 'sbi_statement.csv'), 'utf-8');
    const { mapping, rows } = parseBankStatementCSV(sbiCsv);
    const previews = transformRowsToPreviews(rows, mapping);

    const salaryTxn = previews.find(p => p.description.includes('SALARY'));
    expect(salaryTxn).toBeDefined();
    expect(salaryTxn?.credit).toBe(75000);
    expect(salaryTxn?.debit).toBe(0);
    expect(salaryTxn?.type).toBe('income');

    const uberTxn = previews.find(p => p.description.includes('UBER'));
    expect(uberTxn).toBeDefined();
    expect(uberTxn?.debit).toBe(280);
    expect(uberTxn?.credit).toBe(0);
    expect(uberTxn?.type).toBe('expense');
  });

  // Test 5: Import the same statement twice (duplicate detection)
  it('5. Detects duplicates when importing the same statement twice', () => {
    const existingTransactions: Transaction[] = [
      {
        id: 'txn-1',
        accountId: 'acc-hdfc',
        date: '2024-11-01',
        description: 'SWIGGY BANGALORE IN',
        originalDescription: 'SWIGGY BANGALORE IN',
        merchantName: 'Swiggy',
        amount: 450,
        type: 'expense',
        category: 'Food & Dining',
        source: 'CSV Import',
        bankReferenceId: 'UPI/43120199201',
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-11-01T00:00:00Z',
      },
    ];

    const duplicateCandidate = {
      date: '2024-11-01',
      amount: 450,
      description: 'SWIGGY BANGALORE IN',
      referenceNumber: 'UPI/43120199201',
      accountId: 'acc-hdfc',
    };

    const result = checkDuplicate(duplicateCandidate, existingTransactions);
    expect(result.isDuplicate).toBe(true);
    expect(result.matchedTransactionId).toBe('txn-1');
  });

  // Test 6: Import transactions with missing descriptions
  it('6. Gracefully handles transactions with missing or blank descriptions', () => {
    const csvWithBlankDesc = `Date,Description,Debit,Credit,Balance\n2024-11-10,,300,,1000\n2024-11-10,   ,150,,850`;
    const { mapping, rows } = parseBankStatementCSV(csvWithBlankDesc);
    const previews = transformRowsToPreviews(rows, mapping);

    expect(previews.length).toBe(2);
    expect(previews[0].description).toBeDefined();
    expect(previews[0].category).toBe('Other Expenses');
  });

  // Test 7: Import transactions with different date formats
  it('7. Normalizes varied Indian date formats (DD/MM/YYYY, DD-Mon-YYYY, DD/MM/YY)', () => {
    expect(normalizeDate('01/11/2024')).toBe('2024-11-01');
    expect(normalizeDate('15-Nov-2024')).toBe('2024-11-15');
    expect(normalizeDate('05-Jan-24')).toBe('2024-01-05');
    expect(normalizeDate('2024-12-25')).toBe('2024-12-25');
  });

  // Test 8: Correct a wrongly categorized transaction and verify learning
  it('8. Remembers manually corrected merchant-category mappings', () => {
    const userMappings: MerchantMapping[] = [
      {
        id: 'm-custom',
        pattern: 'UNCOMMON_MERCHANT',
        merchantName: 'Uncommon Coffee Shop',
        category: 'Food & Dining',
        isUserOverride: true,
        updatedAt: '2024-11-01T00:00:00Z',
      },
    ];

    const result = categorizeTransaction('POS PURCHASE UNCOMMON_MERCHANT BLR', userMappings);
    expect(result.category).toBe('Food & Dining');
    expect(result.merchantName).toBe('Uncommon Coffee Shop');
  });

  // Test 9: Verify daily expense KPI updates
  it('9. Correctly calculates daily expense KPI for current day', () => {
    const today = '2024-11-10';
    const txns: Transaction[] = [
      {
        id: 't1',
        accountId: 'acc-hdfc',
        date: today,
        description: 'Swiggy Lunch',
        originalDescription: 'Swiggy',
        merchantName: 'Swiggy',
        amount: 500,
        type: 'expense',
        category: 'Food & Dining',
        source: 'CSV Import',
        createdAt: '2024-11-10T12:00:00Z',
        updatedAt: '2024-11-10T12:00:00Z',
      },
      {
        id: 't2',
        accountId: 'acc-hdfc',
        date: today,
        description: 'Uber Ride',
        originalDescription: 'Uber',
        merchantName: 'Uber',
        amount: 250,
        type: 'expense',
        category: 'Travel & Commute',
        source: 'CSV Import',
        createdAt: '2024-11-10T14:00:00Z',
        updatedAt: '2024-11-10T14:00:00Z',
      },
    ];

    const kpis = computeFinancialKPIs([dummySalaryAccount], txns, dummyCategories, today);
    expect(kpis.dailyExpense).toBe(750);
  });

  // Test 10: Verify category target updates
  it('10. Computes category target utilization and percentages accurately', () => {
    const today = '2024-11-10';
    const txns: Transaction[] = [
      {
        id: 't1',
        accountId: 'acc-hdfc',
        date: '2024-11-02',
        description: 'Swiggy Orders',
        originalDescription: 'Swiggy',
        merchantName: 'Swiggy',
        amount: 2500,
        type: 'expense',
        category: 'Food & Dining',
        source: 'CSV Import',
        createdAt: '2024-11-02T12:00:00Z',
        updatedAt: '2024-11-02T12:00:00Z',
      },
    ];

    const kpis = computeFinancialKPIs([dummySalaryAccount], txns, dummyCategories, today);
    const foodCat = kpis.categorySpending.find(c => c.category === 'Food & Dining');
    expect(foodCat).toBeDefined();
    expect(foodCat?.amount).toBe(2500);
    expect(foodCat?.monthlyTarget).toBe(10000);
    expect(foodCat?.percentage).toBe(25); // 2500 / 10000 = 25%
  });

  // Test 11: Verify account balance calculations
  it('11. Accurately updates account balance with opening balance and transactions', () => {
    const txns: Transaction[] = [
      {
        id: 't1',
        accountId: 'acc-hdfc',
        date: '2024-11-01',
        description: 'Salary',
        originalDescription: 'Salary',
        merchantName: 'Salary',
        amount: 20000,
        type: 'income',
        category: 'Salary & Income',
        source: 'CSV Import',
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-11-01T00:00:00Z',
      },
      {
        id: 't2',
        accountId: 'acc-hdfc',
        date: '2024-11-02',
        description: 'Rent Payment',
        originalDescription: 'Rent',
        merchantName: 'Rent',
        amount: 15000,
        type: 'expense',
        category: 'Housing',
        source: 'CSV Import',
        createdAt: '2024-11-02T00:00:00Z',
        updatedAt: '2024-11-02T00:00:00Z',
      },
    ];

    // Opening 50,000 + 20,000 income - 15,000 expense = 55,000
    const bal = calculateAccountBalance(dummySalaryAccount, txns);
    expect(bal).toBe(55000);
  });

  // Test 12: Verify transfers are not counted as expenses
  it('12. Excludes internal transfers from expense and income totals', () => {
    const today = '2024-11-10';
    const txns: Transaction[] = [
      {
        id: 't-trf',
        accountId: 'acc-hdfc',
        date: '2024-11-05',
        description: 'SELF TRANSFER TO SAVINGS',
        originalDescription: 'SELF TRANSFER TO SAVINGS',
        merchantName: 'Self Transfer',
        amount: 10000,
        type: 'transfer',
        category: 'Transfer',
        source: 'CSV Import',
        createdAt: '2024-11-05T00:00:00Z',
        updatedAt: '2024-11-05T00:00:00Z',
      },
    ];

    const kpis = computeFinancialKPIs([dummySalaryAccount], txns, dummyCategories, today);
    expect(kpis.monthlyExpense).toBe(0);
    expect(kpis.monthlyIncome).toBe(0);
  });

  // Test 13: Verify credit card payments are not double-counted
  it('13. Does not double-count credit card bill payments as expenses', () => {
    const today = '2024-11-10';
    const txns: Transaction[] = [
      // 1. Credit card expense already recorded
      {
        id: 't-cc-spend',
        accountId: 'acc-icici-cc',
        date: '2024-11-02',
        description: 'Amazon Electronics',
        originalDescription: 'Amazon Electronics',
        merchantName: 'Amazon',
        amount: 5000,
        type: 'expense',
        category: 'Shopping',
        source: 'CSV Import',
        createdAt: '2024-11-02T00:00:00Z',
        updatedAt: '2024-11-02T00:00:00Z',
      },
      // 2. Later paying off the CC bill from salary account
      {
        id: 't-cc-pay',
        accountId: 'acc-hdfc',
        date: '2024-11-08',
        description: 'CRED CC PAYMENT ICICI CARD',
        originalDescription: 'CRED CC PAYMENT ICICI CARD',
        merchantName: 'Credit Card Bill Payment',
        amount: 5000,
        type: 'credit_card_payment',
        category: 'Credit Card Payment',
        source: 'CSV Import',
        createdAt: '2024-11-08T00:00:00Z',
        updatedAt: '2024-11-08T00:00:00Z',
      },
    ];

    const kpis = computeFinancialKPIs([dummySalaryAccount, dummyCreditCard], txns, dummyCategories, today);
    // Monthly expense should ONLY be 5000 (from the card spend), NOT 10000!
    expect(kpis.monthlyExpense).toBe(5000);
  });
});

