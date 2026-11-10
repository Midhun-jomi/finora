import { Account, Category, FinancialKPIs, Transaction } from './types';

/**
 * Calculates current balance for an account by taking opening balance
 * and aggregating all active transactions for that account.
 *
 * Rules:
 * - For Credit Card:
 *   Purchases (expense) increase the outstanding debt balance.
 *   Payments (credit_card_payment / credit) decrease outstanding balance.
 * - For Bank/Wallet/Cash:
 *   Income and Refunds increase balance.
 *   Expenses and Transfers out decrease balance.
 *   Transfers in increase balance.
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[]
): number {
  const accountTxns = transactions.filter(t => t.accountId === account.id);
  const incomingTransfers = transactions.filter(
    t => t.type === 'transfer' && t.transferToAccountId === account.id
  );

  let balance = Number(account.openingBalance) || 0;

  if (account.accountType === 'Credit Card') {
    // For credit cards: openingBalance is typically existing outstanding (positive or 0)
    for (const t of accountTxns) {
      if (t.type === 'expense') {
        balance += t.amount; // new charges increase card balance/outstanding
      } else if (t.type === 'refund' || t.type === 'credit_card_payment' || t.type === 'income') {
        balance -= t.amount; // repayments reduce balance
      }
    }
    return Math.max(0, balance);
  }

  // Regular Bank, Savings, Salary, Wallet, Cash accounts
  for (const t of accountTxns) {
    if (t.type === 'income' || t.type === 'refund') {
      balance += t.amount;
    } else if (t.type === 'expense' || t.type === 'credit_card_payment' || t.type === 'transfer') {
      balance -= t.amount;
    }
  }

  // Add transfers received from other accounts
  for (const t of incomingTransfers) {
    balance += t.amount;
  }

  return balance;
}

/**
 * Computes all Financial KPIs and analytics across accounts, transactions, and categories.
 */
export function computeFinancialKPIs(
  accounts: Account[],
  transactions: Transaction[],
  categories: Category[],
  targetDateStr?: string
): FinancialKPIs {
  const referenceDate = targetDateStr ? new Date(targetDateStr) : new Date();
  const currentYearMonth = referenceDate.toISOString().slice(0, 7); // "YYYY-MM"
  const currentDay = referenceDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

  // 1. Account Balances Breakdown
  let totalBankBalance = 0;
  let totalCashBalance = 0;
  let totalCreditCardOutstanding = 0;

  accounts.forEach(acc => {
    if (acc.status === 'archived') return;
    const bal = calculateAccountBalance(acc, transactions);

    if (acc.accountType === 'Credit Card') {
      totalCreditCardOutstanding += bal;
    } else if (acc.accountType === 'Cash') {
      totalCashBalance += bal;
    } else {
      // Savings, Salary, Current, Digital Wallet, Investment
      totalBankBalance += bal;
    }
  });

  // Net total balance = Bank + Cash - Credit Card Outstanding
  const totalBalance = totalBankBalance + totalCashBalance - totalCreditCardOutstanding;

  // 2. Transaction Classifications
  let dailyExpense = 0;
  let monthlyExpense = 0;
  let monthlyIncome = 0;

  const categoryTotals: Record<string, { monthly: number; daily: number }> = {};
  categories.forEach(c => {
    categoryTotals[c.name] = { monthly: 0, daily: 0 };
  });

  transactions.forEach(t => {
    const isThisMonth = t.date.startsWith(currentYearMonth);
    const isToday = t.date === currentDay;

    // RULE 1: Transfers between accounts MUST NOT count as income or expense
    if (t.type === 'transfer') {
      return;
    }

    // RULE 2: Credit Card bill payments must not be double counted as expenses
    // when underlying card transactions are already recorded.
    if (t.type === 'credit_card_payment') {
      return;
    }

    // RULE 3: Refunds reduce expense (or separate refund credit)
    if (t.type === 'refund') {
      if (isThisMonth) {
        monthlyExpense = Math.max(0, monthlyExpense - t.amount);
      }
      if (isToday) {
        dailyExpense = Math.max(0, dailyExpense - t.amount);
      }
      if (t.category && categoryTotals[t.category]) {
        categoryTotals[t.category].monthly = Math.max(0, categoryTotals[t.category].monthly - t.amount);
        categoryTotals[t.category].daily = Math.max(0, categoryTotals[t.category].daily - t.amount);
      }
      return;
    }

    // RULE 4: Income
    if (t.type === 'income') {
      if (isThisMonth) {
        monthlyIncome += t.amount;
      }
      return;
    }

    // RULE 5: Standard Expenses
    if (t.type === 'expense') {
      if (isThisMonth) {
        monthlyExpense += t.amount;
      }
      if (isToday) {
        dailyExpense += t.amount;
      }

      const catName = t.category || 'Other Expenses';
      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { monthly: 0, daily: 0 };
      }

      if (isThisMonth) {
        categoryTotals[catName].monthly += t.amount;
      }
      if (isToday) {
        categoryTotals[catName].daily += t.amount;
      }
    }
  });

  const netSavings = monthlyIncome - monthlyExpense;

  // 3. Category Target & Budget Utilization
  let totalMonthlyTarget = 0;
  const categorySpending = categories.map(cat => {
    const spentMonthly = categoryTotals[cat.name]?.monthly || 0;
    const spentDaily = categoryTotals[cat.name]?.daily || 0;
    totalMonthlyTarget += cat.monthlyTarget || 0;

    const percentage = cat.monthlyTarget > 0 ? (spentMonthly / cat.monthlyTarget) * 100 : 0;

    return {
      category: cat.name,
      amount: spentMonthly,
      monthlyTarget: cat.monthlyTarget || 0,
      dailyTarget: cat.dailyTarget || 0,
      dailySpent: spentDaily,
      percentage: Math.min(Math.round(percentage), 999),
      color: cat.color,
    };
  });

  // Sort by highest spend
  categorySpending.sort((a, b) => b.amount - a.amount);

  const budgetUtilization =
    totalMonthlyTarget > 0 ? Math.min(Math.round((monthlyExpense / totalMonthlyTarget) * 100), 100) : 0;

  // 4. Imports stats
  const importedTxns = transactions.filter(t => t.source === 'CSV Import');
  const recentImportedCount = importedTxns.length;
  let lastImportDate: string | null = null;
  if (importedTxns.length > 0) {
    const sorted = [...importedTxns].sort(
      (a, b) => new Date(b.importedAt || b.createdAt).getTime() - new Date(a.importedAt || a.createdAt).getTime()
    );
    lastImportDate = sorted[0].importedAt || sorted[0].createdAt;
  }

  // 5. Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return {
    totalBalance,
    totalBankBalance,
    totalCashBalance,
    totalCreditCardOutstanding,
    dailyExpense,
    monthlyExpense,
    monthlyIncome,
    netSavings,
    budgetUtilization,
    accountCount: accounts.filter(a => a.status === 'active').length,
    lastImportDate,
    recentImportedCount,
    categorySpending,
    recentTransactions,
  };
}

