'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  PlusCircle,
  Edit2,
  Trash2,
  Archive,
  ArrowUpRight,
  ArrowDownLeft,
  UploadCloud,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Account, AccountType } from '@/lib/types';

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('Savings Account');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [currency, setCurrency] = useState('INR');
  const [color, setColor] = useState('#10B981');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateModal = () => {
    setEditingAccount(null);
    setName('');
    setBankName('');
    setAccountType('Savings Account');
    setAccountNumber('');
    setOpeningBalance('0');
    setCurrency('INR');
    setColor('#10B981');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (acc: any) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBankName(acc.bankName);
    setAccountType(acc.accountType);
    setAccountNumber(acc.accountNumber?.replace('•••• ', '') || '');
    setOpeningBalance(String(acc.openingBalance || 0));
    setCurrency(acc.currency || 'INR');
    setColor(acc.color || '#10B981');
    setStatus(acc.status || 'active');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bankName) return;

    try {
      setSubmitting(true);
      const url = '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';
      const body = {
        id: editingAccount ? editingAccount.id : undefined,
        name,
        bankName,
        accountType,
        accountNumber,
        openingBalance: parseFloat(openingBalance) || 0,
        currency,
        color,
        status,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFeedback(editingAccount ? 'Account updated!' : 'Account created!');
        fetchAccounts();
        setTimeout(() => setFeedback(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save account');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchive = async (acc: any) => {
    const newStatus = acc.status === 'active' ? 'archived' : 'active';
    try {
      const res = await fetch('/api/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acc.id, status: newStatus }),
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (acc: any) => {
    if (!confirm(`Are you sure you want to delete or archive "${acc.name}"?`)) return;

    try {
      const res = await fetch(`/api/accounts?id=${acc.id}`);
      const data = await res.json();
      if (data.archived) {
        alert(data.message);
      }
      fetchAccounts();
    } catch (err) {
      console.error(err);
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

  const totalBalance = accounts
    .filter(a => a.status === 'active')
    .reduce((sum, a) => {
      if (a.accountType === 'Credit Card') {
        return sum - (a.currentBalance || 0);
      }
      return sum + (a.currentBalance || 0);
    }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
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
            <Landmark className="w-7 h-7 text-emerald-400" />
            Bank & Financial Accounts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your savings, salary, credit cards, UPI wallets, and cash reserves.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-sm font-bold shadow-glow-emerald transition active:scale-95"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          Add Financial Account
        </button>
      </div>

      {/* Aggregate Balance Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">
            Combined Net Worth Across Accounts
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1">
            {formatCurrency(totalBalance)}
          </div>
        </div>

        <div className="flex items-center gap-8 text-xs">
          <div>
            <span className="text-slate-400 block">Active Accounts</span>
            <span className="text-lg font-bold text-emerald-400">
              {accounts.filter(a => a.status === 'active').length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Archived Accounts</span>
            <span className="text-lg font-bold text-slate-400">
              {accounts.filter(a => a.status === 'archived').length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Transactions</span>
            <span className="text-lg font-bold text-white">
              {accounts.reduce((sum, a) => sum + (a.transactionCount || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const isArchived = acc.status === 'archived';
          return (
            <div
              key={acc.id}
              className={`rounded-2xl p-6 relative overflow-hidden transition-all duration-300 border ${
                isArchived
                  ? 'bg-slate-900/40 border-white/5 opacity-60'
                  : 'glass-panel hover:border-white/20 hover:shadow-card-elevated'
              }`}
              style={{
                boxShadow: isArchived ? undefined : `0 10px 30px -15px ${acc.color}25`,
              }}
            >
              {/* Premium Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                    {acc.bankName}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{acc.name}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase"
                    style={{
                      backgroundColor: `${acc.color}20`,
                      color: acc.color,
                      border: `1px solid ${acc.color}50`,
                    }}
                  >
                    {acc.accountType}
                  </span>
                  {isArchived && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                      Archived
                    </span>
                  )}
                </div>
              </div>

              {/* Card Chip & Masked Number visual */}
              <div className="mt-6 flex items-center justify-between">
                <div className="w-10 h-7 rounded bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
                  <div className="w-6 h-4 border border-amber-400/50 rounded-sm"></div>
                </div>
                <span className="text-sm font-mono tracking-widest text-slate-300">
                  {acc.accountNumber}
                </span>
              </div>

              {/* Balance */}
              <div className="mt-6">
                <span className="text-xs text-slate-400 block">
                  {acc.accountType === 'Credit Card' ? 'Current Outstanding' : 'Current Balance'}
                </span>
                <span
                  className={`text-2xl font-black tracking-tight ${
                    acc.accountType === 'Credit Card' ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {formatCurrency(acc.currentBalance)}
                </span>
              </div>

              {/* Account-wise income & expenses breakdown */}
              <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Total Expenses</span>
                  <span className="font-semibold text-rose-300 flex items-center gap-1 mt-0.5">
                    <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" />
                    {formatCurrency(acc.totalExpense)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Total Income</span>
                  <span className="font-semibold text-emerald-300 flex items-center gap-1 mt-0.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    {formatCurrency(acc.totalIncome)}
                  </span>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <Link
                  href={`/import?accountId=${acc.id}`}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" /> Import CSV
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/transactions?accountId=${acc.id}`}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                    title="View Transactions"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => openEditModal(acc)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
                    title="Edit Account"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleArchive(acc)}
                    className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5"
                    title={isArchived ? 'Unarchive' : 'Archive'}
                  >
                    <Archive className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(acc)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel-elevated w-full max-w-lg rounded-2xl p-6 border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                {editingAccount ? 'Edit Financial Account' : 'Add Financial Account'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Name / Nickname</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary, SBI Emergency Fund"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={e => setAccountType(e.target.value as AccountType)}
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
                    placeholder="e.g. 8921"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    step="any"
                    value={openingBalance}
                    onChange={e => setOpeningBalance(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Card Accent Color</label>
                <div className="flex items-center gap-3">
                  {['#10B981', '#0284C7', '#8B5CF6', '#EC4899', '#F59E0B', '#14B8A6', '#6366F1'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    ></button>
                  ))}
                </div>
              </div>

              {editingAccount && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Account Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingAccount ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
