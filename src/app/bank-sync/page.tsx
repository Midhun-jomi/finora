'use client';

import React from 'react';
import Link from 'next/link';
import {
  Radio,
  ShieldCheck,
  Building,
  Key,
  Layers,
  CheckCircle,
  Clock,
  ArrowRight,
  Info,
  Lock,
  UploadCloud,
} from 'lucide-react';
import { AccountAggregatorRegistry } from '@/lib/account-aggregator';

export default function BankSyncArchitecturePage() {
  const providers = AccountAggregatorRegistry.listAvailableProviders();

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            RBI ACCOUNT AGGREGATOR ARCHITECTURE
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
          <Radio className="w-7 h-7 text-amber-400" />
          Automatic Bank Sync — Coming Soon
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Finora is engineered with an extensible, provider-agnostic banking architecture designed for future
          RBI-licensed Account Aggregator (AA) integration.
        </p>
      </div>

      {/* Honest Status & Privacy Guarantee Banner */}
      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          Zero Fake APIs • 100% Free & Transparent Operation
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Finora currently operates entirely via secure, free, user-controlled <strong>CSV bank statement imports</strong>.
          We do not require paid third-party banking APIs, screen scrapers, or Account Aggregator fees.
          Your existing registered bank accounts in Finora are managed manually and via statement imports.
        </p>
      </div>

      {/* Architecture Overview */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Provider-Independent Integration Framework
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            When RBI Account Aggregator SDKs are connected, transactions will flow directly into Finora’s
            existing categorization and duplicate detection engines without rebuilding any schema or frontend components.
          </p>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-900/80 p-5 rounded-xl border border-white/10 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
              1
            </div>
            <h4 className="font-bold text-white">FIP (Financial Info Provider)</h4>
            <p className="text-slate-400 text-[11px]">
              SBI, HDFC, ICICI, Axis, and all scheduled Indian commercial banks holding your accounts.
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-xl border border-amber-500/30 space-y-2 relative">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold">
              2
            </div>
            <h4 className="font-bold text-amber-300">RBI Licensed AA Gateway</h4>
            <p className="text-slate-400 text-[11px]">
              Consent Managers (OneMoney, Finvu, Setu) handling secure cryptographic user consent and tokenization.
            </p>
          </div>

          <div className="bg-slate-900/80 p-5 rounded-xl border border-emerald-500/30 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">
              3
            </div>
            <h4 className="font-bold text-emerald-300">FIU (Finora Core Platform)</h4>
            <p className="text-slate-400 text-[11px]">
              Standardized ingestion into Finora's transaction engine, instant rule categorization, and Google Sheets sync.
            </p>
          </div>
        </div>
      </div>

      {/* Planned Future Providers */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Building className="w-5 h-5 text-slate-400" />
          Planned Account Aggregator Providers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providers.map(p => (
            <div
              key={p.name}
              className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 opacity-80 hover:opacity-100 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{p.name}</h3>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {p.rbiRegistration}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                  {p.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {p.description}
              </p>

              <button
                disabled
                className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-xs font-semibold cursor-not-allowed"
              >
                Connect via {p.name} (Coming Soon)
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Call to Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-white">Import Your Statement Today For Free</h4>
          <p className="text-xs text-slate-400 mt-1">
            Download your CSV from your bank's net banking portal and Finora will process it in under 3 seconds.
          </p>
        </div>
        <Link
          href="/import"
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shrink-0 transition"
        >
          Go to Statement Import
        </Link>
      </div>
    </div>
  );
}
