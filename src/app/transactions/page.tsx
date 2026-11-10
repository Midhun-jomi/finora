'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeftRight,
  Search,
  Filter,
  Edit2,
  Trash2,
  UploadCloud,
  Landmark,
  PlusCircle,
  FileSpreadsheet,
  Radio,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { Account, Transaction, TransactionSource, TransactionType } from '@/lib/types';

function TransactionsContent() {
  const searchParams = useSearchParams();
  const initAccount = searchParams.get('accountId') || '';
  const initSearch = searchParams.get('search') || '';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(initSearch);
  const [selectedAccount, setSelectedAccount] = useState(initAccount);
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Edit Modal State
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editNotes, setEditNotes] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [learnRule, setLearnRule] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Manual Transaction Modal State
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [manualAccount, setManualAccount] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualDesc, setManualDesc] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualType, setManualType] = useState<TransactionType>('expense');
  const [manualCategory, setManualCategory] = useState('Food & Dining');
  const [manualNotes, setManualNotes] = useState('');

  const categories = [
    'Food & Dining', 'Groceries', 'Travel & Commute', 'Shopping',
    'Entertainment', 'Subscriptions', 'Fuel', 'Utilities',
    'Healthcare', 'Investments', 'Salary & Income', 'Transfer',
    'Credit Card Payment', 'Refunds', 'Other Expenses'
  ];

  const fetchTxns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedAccount) params.append('accountId', selectedAccount);
      if (selectedSource) params.append('source', selectedSource);
      if (selectedType) params.append('type', selectedType);
      if (selectedCategory) params.append('category', selectedCategory);

      const [resTxn, resAcc] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`),
        fetch('/api/accounts'),
      ]);

      if (resTxn.ok) {
        const data = await resTxn.json();
        setTransactions(data.transactions || []);
      }
      if (resAcc.ok) {
        const data = await resAcc.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxns();
  }, [search, selectedAccount, selectedSource, selectedType, selectedCategory]);

  const openEditModal = (t: Transaction) => {
    setEditingTxn(t);
    setEditCategory(t.category);
    setEditAccountId(t.accountId);
    setEditType(t.type);
    setEditNotes(t.notes || '');
    setEditMerchant(t.merchantName);
    setLearnRule(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTxn) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTxn.id,
          category: editCategory,
          accountId: editAccountId,
          type: editType,
          notes: editNotes,
          merchantName: editMerchant,
          learnMerchantRule: learnRule,
        }),
      });

      if (res.ok) {
        setEditingTxn(null);
        setFeedback('Transaction updated & rules memorized.');
        fetchTxns();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update transaction.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const accId = manualAccount || (accounts.length > 0 ? accounts[0].id : '');
    if (!accId || !manualAmount) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: accId,
          date: manualDate,
          description: manualDesc || 'Manual Entry',
          amount: parseFloat(manualAmount),
          type: manualType,
          category: manualCategory,
          notes: manualNotes,
        }),
      });
      if (res.ok) {
        setIsAddManualOpen(false);
        setManualDesc('');
        setManualAmount('');
        setManualNotes('');
        setFeedback('Manual transaction added!');
        fetchTxns();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add transaction.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['ID', 'Date', 'Merchant', 'Description', 'Category', 'Type', 'Amount', 'Source', 'Reference ID', 'Notes'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      `"${(t.merchantName || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount,
      t.source,
      t.bankReferenceId || '',
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `finora_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setFeedback('Transaction deleted.');
        fetchTxns();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-black px-4 py-3 rounded-xl font-medium shadow-glow-emerald flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ArrowLeftRight className="w-7 h-7 text-emerald-400" />
            Financial Transactions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, filter, edit categories, and audit your imported and manual transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95"
            title="Export filtered transactions as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV
          </button>

          <button
            onClick={() => setIsAddManualOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            Log Transaction
          </button>

          <Link
            href="/import"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-bold shadow-glow-emerald transition active:scale-95"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            Import CSV
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search merchant, description, reference ID, notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Account filter */}
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>

            {/* Source filter */}
            <select
              value={selectedSource}
              onChange={e => setSelectedSource(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Sources</option>
              <option value="CSV Import">CSV Import</option>
              <option value="Manual">Manual</option>
              <option value="Future Bank Sync">Bank Sync</option>
            </select>

            {/* Type filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
              <option value="credit_card_payment">CC Payment</option>
              <option value="refund">Refund</option>
            </select>

            {/* Category filter */}
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading transactions...</div>
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Merchant / Description</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map(t => {
                  const acc = accounts.find(a => a.id === t.accountId);
                  const isCredit = t.type === 'income' || t.type === 'refund';
                  const isTransfer = t.type === 'transfer' || t.type === 'credit_card_payment';

                  return (
                    <tr key={t.id} className="hover:bg-white/5 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {t.date}
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white block">{t.merchantName}</span>
                          {t.bankReferenceId && (
                            <span className="text-[10px] font-mono text-slate-500">
                              #{t.bankReferenceId}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate" title={t.description}>
                          {t.description}
                        </span>
                        {t.notes && (
                          <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                            Note: {t.notes}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-300 font-medium block">
                          {acc?.name || 'Account'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {acc?.accountNumber || ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px] font-medium border border-white/5">
                          {t.category}
                        </span>
                      </td>

                      {/* Source Indicator */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                            t.source === 'CSV Import'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : t.source === 'Future Bank Sync'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-slate-700/40 text-slate-300'
                          }`}
                        >
                          {t.source === 'CSV Import' && <FileSpreadsheet className="w-3 h-3" />}
                          {t.source === 'Future Bank Sync' && <Radio className="w-3 h-3" />}
                          {t.source}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                        <span
                          className={
                            isCredit
                              ? 'text-emerald-400'
                              : isTransfer
                              ? 'text-cyan-400'
                              : 'text-slate-100'
                          }
                        >
                          {isCredit ? '+' : isTransfer ? '⇄' : '-'} {formatCurrency(t.amount)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                            title="Edit Category & Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p>No transactions match your filters.</p>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-xs"
            >
              <UploadCloud className="w-4 h-4" /> Import Statement
            </Link>
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Edit Transaction
              </h3>
              <button onClick={() => setEditingTxn(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Merchant / Title</label>
                <input
                  type="text"
                  value={editMerchant}
                  onChange={e => setEditMerchant(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={editType}
                    onChange={e => setEditType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer (Self)</option>
                    <option value="credit_card_payment">Credit Card Payment</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Account</label>
                <select
                  value={editAccountId}
                  onChange={e => setEditAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bankName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Add custom notes or tags..."
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Remember rule toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={learnRule}
                    onChange={e => setLearnRule(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>Remember this merchant category rule for all future imports</span>
                </label>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingTxn(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Manual Transaction Modal */}
      {isAddManualOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Log Manual Transaction
              </h3>
              <button onClick={() => setIsAddManualOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Account *</label>
                  <select
                    value={manualAccount}
                    onChange={e => setManualAccount(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.bankName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Merchant / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Local Grocery Store, Cash Coffee"
                  value={manualDesc}
                  onChange={e => setManualDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={manualAmount}
                    onChange={e => setManualAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type</label>
                  <select
                    value={manualType}
                    onChange={e => setManualType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                    <option value="credit_card_payment">CC Payment</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={manualCategory}
                    onChange={e => setManualCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / Tags</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={manualNotes}
                  onChange={e => setManualNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddManualOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 text-xs">Loading transactions...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
