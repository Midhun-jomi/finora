import './globals.css';
import Link from 'next/link';
import {
  Wallet,
  Landmark,
  FileSpreadsheet,
  ArrowLeftRight,
  History,
  Radio,
  Settings,
  PlusCircle,
  UploadCloud,
} from 'lucide-react';

export const metadata = {
  title: 'Finora — Bank Accounts & Expense Automation',
  description: 'Premium personal finance management with automated bank statement imports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-black">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-4 lg:px-8 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Finora Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-glow-emerald group-hover:scale-105 transition-all">
                <Wallet className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Finora <span className="text-[10px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PRO</span>
                </span>
                <p className="text-[11px] text-slate-400 hidden sm:block">Intelligent Financial Operating System</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
              >
                Dashboard
              </Link>
              <Link
                href="/accounts"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
              >
                <Landmark className="w-4 h-4 text-emerald-400" />
                Bank Accounts
              </Link>
              <Link
                href="/import"
                className="px-3.5 py-2 rounded-lg text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                Import Statement
              </Link>
              <Link
                href="/transactions"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
              >
                <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                Transactions
              </Link>
              <Link
                href="/import-history"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
              >
                <History className="w-4 h-4 text-slate-400" />
                History
              </Link>
              <Link
                href="/bank-sync"
                className="px-3.5 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition flex items-center gap-2"
              >
                <Radio className="w-4 h-4 text-slate-400" />
                <span>Bank Sync</span>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Soon</span>
              </Link>
            </nav>

            {/* Action Buttons & Status */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/settings"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                title="Google Sheets & Settings"
              >
                <Settings className="w-5 h-5" />
              </Link>

              <Link
                href="/import"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-semibold text-xs tracking-wide shadow-glow-emerald transition-all active:scale-95"
              >
                <UploadCloud className="w-4 h-4 stroke-[2.5]" />
                Import Statement
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>Finora — Zero Third-Party Fee Banking & Expense Intelligence</p>
            <p className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Secure Offline & Local-First Processing
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

