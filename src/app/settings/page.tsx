'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Trash2,
  Sliders,
  Shield,
  Layers,
  Search,
} from 'lucide-react';
import { MerchantMapping } from '@/lib/types';

export default function SettingsPage() {
  // Google Sheets state
  const [sheetsStatus, setSheetsStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Merchant Mappings state
  const [mappings, setMappings] = useState<MerchantMapping[]>([]);
  const [mappingSearch, setMappingSearch] = useState('');
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [rulePattern, setRulePattern] = useState('');
  const [ruleMerchant, setRuleMerchant] = useState('');
  const [ruleCategory, setRuleCategory] = useState('Food & Dining');

  const categories = [
    'Food & Dining', 'Groceries', 'Travel & Commute', 'Shopping',
    'Entertainment', 'Subscriptions', 'Fuel', 'Utilities',
    'Healthcare', 'Investments', 'Salary & Income', 'Transfer',
    'Credit Card Payment', 'Refunds', 'Other Expenses'
  ];

  const fetchSheetsStatus = async () => {
    try {
      const res = await fetch('/api/google-sheets/sync');
      if (res.ok) {
        const data = await res.json();
        setSheetsStatus(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMappings = async () => {
    try {
      const res = await fetch('/api/merchant-mappings');
      if (res.ok) {
        const data = await res.json();
        setMappings(data.merchantMappings || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSheetsStatus();
    fetchMappings();
  }, []);

  const handleSyncSheets = async () => {
    try {
      setSyncing(true);
      const res = await fetch('/api/google-sheets/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncFeedback('Spreadsheet synced successfully!');
      } else {
        setSyncFeedback(data.message || 'Could not sync with Google Sheets.');
      }
      setTimeout(() => setSyncFeedback(null), 5000);
      fetchSheetsStatus();
    } catch (err) {
      console.error(err);
      setSyncFeedback('Error syncing to Google Sheets.');
    } finally {
      setSyncing(false);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rulePattern || !ruleCategory) return;

    try {
      const res = await fetch('/api/merchant-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: rulePattern,
          merchantName: ruleMerchant || rulePattern,
          category: ruleCategory,
        }),
      });

      if (res.ok) {
        setIsAddRuleOpen(false);
        setRulePattern('');
        setRuleMerchant('');
        fetchMappings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const res = await fetch(`/api/merchant-mappings?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMappings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMappings = mappings.filter(
    m =>
      m.pattern.toLowerCase().includes(mappingSearch.toLowerCase()) ||
      m.merchantName.toLowerCase().includes(mappingSearch.toLowerCase()) ||
      m.category.toLowerCase().includes(mappingSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-emerald-400" />
          Settings & Integrations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure Google Sheets cloud storage, review learned merchant categorization rules, and security controls.
        </p>
      </div>

      {/* Google Sheets Integration Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Google Sheets Primary Storage
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    sheetsStatus?.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-white/10'
                  }`}
                >
                  {sheetsStatus?.connected ? 'CONNECTED' : 'LOCAL ENGINE ACTIVE'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Stores Accounts, Transactions, Categories, MerchantMappings, ImportHistory, Targets, and Budgets.
              </p>
            </div>
          </div>

          <button
            onClick={handleSyncSheets}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {syncFeedback && (
          <div className="p-3 rounded-xl bg-slate-900 border border-white/10 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Security & Credentials Notice */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Shield className="w-4 h-4 text-emerald-400" />
            Zero Frontend Exposure Security Rule
          </div>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            In strict compliance with Finora security policies, Google Sheets API private keys and credentials
            are <strong>never bundled into frontend client code</strong>. All reads and writes are securely routed
            through authenticated server-side API handlers.
          </p>
          <div className="pt-2 text-[11px] font-mono text-slate-400">
            Environment Variables: <code className="text-emerald-400">GOOGLE_SHEET_ID</code>,{' '}
            <code className="text-emerald-400">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>,{' '}
            <code className="text-emerald-400">GOOGLE_PRIVATE_KEY</code>
          </div>
        </div>

        {/* Sheets Schema List */}
        <div>
          <span className="text-xs font-semibold text-slate-300 block mb-2">
            Standardized Sheet Architecture (7 Schemas):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {['Accounts', 'Transactions', 'Categories', 'MerchantMappings', 'ImportHistory', 'Targets', 'Budgets'].map(
              sheet => (
                <div key={sheet} className="p-2.5 rounded-lg bg-slate-900 border border-white/5 text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{sheet}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Merchant Categorization Rules */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              Learned Merchant Categorization Rules ({mappings.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Finora automatically remembers any category corrections made during statement imports.
            </p>
          </div>

          <button
            onClick={() => setIsAddRuleOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Add Rule
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search learned merchant patterns, names, categories..."
            value={mappingSearch}
            onChange={e => setMappingSearch(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto max-h-80 overflow-y-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0F172A] border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider sticky top-0">
              <tr>
                <th className="py-2.5 px-3">Keyword Pattern</th>
                <th className="py-2.5 px-3">Clean Merchant Name</th>
                <th className="py-2.5 px-3">Assigned Category</th>
                <th className="py-2.5 px-3">Origin</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMappings.map(m => (
                <tr key={m.id} className="hover:bg-white/5">
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{m.pattern}</td>
                  <td className="py-2.5 px-3 text-white">{m.merchantName}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 text-[11px]">
                      {m.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[10px]">
                    {m.isUserOverride ? 'Learned User Override' : 'System Default'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => handleDeleteRule(m.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Remove rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Rule Modal */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel-elevated w-full max-w-md rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Add Merchant Rule
              </h3>
              <button onClick={() => setIsAddRuleOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Keyword in Bank Narration</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STARBUCKS, BLINKIT, CRED"
                  value={rulePattern}
                  onChange={e => setRulePattern(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Clean Merchant Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Starbucks Coffee"
                  value={ruleMerchant}
                  onChange={e => setRuleMerchant(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assigned Expense Category</label>
                <select
                  value={ruleCategory}
                  onChange={e => setRuleCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddRuleOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
