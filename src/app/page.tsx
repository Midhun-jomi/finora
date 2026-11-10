'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Landmark,
  CreditCard,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  UploadCloud,
  PlusCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { Account, FinancialKPIs, Transaction } from '@/lib/types';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Form states for Add Account modal
  const [newAccName, setNewAccName] = useState('');
  const [newAccBank, setNewAccBank] = useState('');
  const [newAccType, setNewAccType] = useState('Savings Account');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccOpening, setNewAccOpening] = useState('0');
  const [newAccColor, setNewAccColor] = useState('#10B981');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resKpis, resAccounts] = await Promise.all([
        fetch('/api/analytics'),
        fetch('/api/accounts'),
      ]);

      if (resKpis.ok) {
        const data = await resKpis.json();
        setKpis(data.kpis);
      }
      if (resAccounts.ok) {
        const data = await resAccounts.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccBank) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAccName,
          bankName: newAccBank,
          accountType: newAccType,
          accountNumber: newAccNumber,
          openingBalance: parseFloat(newAccOpening) || 0,
          color: newAccColor,
        }),
      });

      if (res.ok) {
        setFeedback('Account created successfully!');
        setIsAddAccountOpen(false);
        setNewAccName('');
        setNewAccBank('');
        setNewAccNumber('');
        setNewAccOpening('0');
        fetchData();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create account.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating account.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number | undefined) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black px-4 py-3 rounded-xl font-medium shadow-glow-emerald flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Header & Prominent Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Financial Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              REAL-TIME SYNC
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your bank accounts, daily expenses, and automated statement imports.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddAccountOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white text-sm font-semibold transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            Add Account
          </button>

          <Link
            href="/import"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-sm font-bold shadow-glow-emerald transition active:scale-95"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            Import Bank Statement
          </Link>
        </div>
      </div>

      {/* Premium KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Net Total Balance */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/10 group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Net Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatCurrency(kpis?.totalBalance)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">Across {kpis?.accountCount || 0} accounts</span>
            <span>•</span>
            <span>Zero API fees</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition"></div>
        </div>

        {/* Bank Balance */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/10 group hover:border-cyan-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Bank Balance</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight">
              {formatCurrency(kpis?.totalBankBalance)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span>Liquid in Savings & Salary</span>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/10 group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Cash Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
              {formatCurrency(kpis?.totalCashBalance)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span>Physical Wallets & Cash</span>
          </div>
        </div>

        {/* Credit Card Outstanding */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden border border-white/10 group hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Credit Card Debt</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
              {formatCurrency(kpis?.totalCreditCardOutstanding)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span>Total current outstanding</span>
          </div>
        </div>
      </div>

      {/* Secondary KPIs: Daily Expense, Monthly Expense, Monthly Income, Last Import */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Today's Expenses</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white mt-1">
            {formatCurrency(kpis?.dailyExpense)}
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span>This Month's Spending</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-300 mt-1">
            {formatCurrency(kpis?.monthlyExpense)}
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>This Month's Income</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-300 mt-1">
            {formatCurrency(kpis?.monthlyIncome)}
          </div>
        </div>

        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Last CSV Import</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-1 truncate">
            {kpis?.lastImportDate ? new Date(kpis.lastImportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No imports yet'}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Accounts Breakdown & Category Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Bank Accounts List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-emerald-400" />
              Connected Bank & Financial Accounts ({accounts.length})
            </h2>
            <Link
              href="/accounts"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Manage all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {accounts.map(acc => (
              <div
                key={acc.id}
                className="glass-panel p-5 rounded-2xl border border-white/10 hover:border-white/20 transition relative overflow-hidden group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                      {acc.bankName}
                    </span>
                    <h3 className="text-base font-bold text-white mt-0.5 group-hover:text-emerald-300 transition">
                      {acc.name}
                    </h3>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                    style={{
                      backgroundColor: `${acc.color}20`,
                      color: acc.color,
                      border: `1px solid ${acc.color}40`,
                    }}
                  >
                    {acc.accountType}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Balance</span>
                    <span className="text-xl font-extrabold text-white">
                      {formatCurrency(acc.currentBalance)}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">{acc.accountNumber}</span>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <Link
                    href={`/import?accountId=${acc.id}`}
                    className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Import CSV
                  </Link>
                  <Link
                    href={`/transactions?accountId=${acc.id}`}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    View txns
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Quick statement import callout */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Have a bank statement CSV?</h4>
                <p className="text-xs text-slate-400">
                  Works seamlessly with SBI, HDFC, ICICI, Axis, Federal, Canara & generic Indian bank statements.
                </p>
              </div>
            </div>
            <Link
              href="/import"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shrink-0 text-center transition"
            >
              Upload Statement Now
            </Link>
          </div>
        </div>

        {/* Right Column (1 col): Category Targets & Spending */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-400" />
              Monthly Category Targets
            </h2>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            {kpis?.categorySpending && kpis.categorySpending.length > 0 ? (
              kpis.categorySpending.slice(0, 6).map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{cat.category}</span>
                    <span className="text-slate-400">
                      <span className="text-white font-semibold">{formatCurrency(cat.amount)}</span> / {formatCurrency(cat.monthlyTarget)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.percentage > 100
                          ? 'bg-rose-500'
                          : cat.percentage > 80
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Daily Target: {formatCurrency(cat.dailyTarget)}</span>
                    <span className={cat.percentage > 100 ? 'text-rose-400 font-bold' : ''}>
                      {cat.percentage}% used
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No category spending data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Recent Transactions
            </h2>
            <p className="text-xs text-slate-400">
              Transactions imported from CSV statements or recorded manually.
            </p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View all transactions <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          {kpis?.recentTransactions && kpis.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description / Merchant</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {kpis.recentTransactions.map(txn => {
                    const isCredit = txn.type === 'income' || txn.type === 'refund';
                    return (
                      <tr key={txn.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{txn.date}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{txn.merchantName}</span>
                          <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                            {txn.description}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                            {txn.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              txn.source === 'CSV Import'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-700/50 text-slate-300'
                            }`}
                          >
                            {txn.source}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-sm">
                          <span className={isCredit ? 'text-emerald-400' : 'text-slate-200'}>
                            {isCredit ? '+' : '-'} {formatCurrency(txn.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <p>No transactions recorded yet.</p>
              <Link
                href="/import"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs"
              >
                <UploadCloud className="w-4 h-4" /> Import First Statement
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Add Account Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel-elevated w-full max-w-lg rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Add Bank or Financial Account
              </h3>
              <button
                onClick={() => setIsAddAccountOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Nickname</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary Account, Emergency Fund"
                  value={newAccName}
                  onChange={e => setNewAccName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bank / Institution Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={newAccBank}
                    onChange={e => setNewAccBank(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Account Type</label>
                  <select
                    value={newAccType}
                    onChange={e => setNewAccType(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Savings Account">Savings Account</option>
                    <option value="Salary Account">Salary Account</option>
                    <option value="Current Account">Current Account</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI Wallet">UPI Wallet</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Digital Wallet">Digital Wallet</option>
                    <option value="Investment Account">Investment Account</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Last 4 Digits (Masked)
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 4821"
                    value={newAccNumber}
                    onChange={e => setNewAccNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Never enter full account or card details.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={newAccOpening}
                    onChange={e => setNewAccOpening(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Card Accent Color</label>
                <div className="flex items-center gap-3">
                  {['#10B981', '#0284C7', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewAccColor(color)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        newAccColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    ></button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
