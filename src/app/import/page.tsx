'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Landmark,
  ChevronDown,
  Info,
  Check,
  X,
  FileText,
  Sliders,
  ShieldAlert,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { Account, ColumnMapping, ParsedTransactionPreview, TransactionType } from '@/lib/types';

const POPULAR_BANKS = [
  { name: 'SBI', label: 'State Bank of India', sample: 'sbi_statement.csv' },
  { name: 'HDFC', label: 'HDFC Bank', sample: 'hdfc_statement.csv' },
  { name: 'ICICI', label: 'ICICI Bank', sample: 'generic_statement.csv' },
  { name: 'Axis', label: 'Axis Bank', sample: 'axis_statement.csv' },
  { name: 'Federal', label: 'Federal Bank', sample: 'generic_statement.csv' },
  { name: 'Canara', label: 'Canara Bank', sample: 'generic_statement.csv' },
  { name: 'Generic', label: 'Standard CSV', sample: 'generic_statement.csv' },
];

function ImportContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselectedAccId = searchParams.get('accountId');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(preselectedAccId || '');
  const [categories, setCategories] = useState<string[]>([
    'Food & Dining', 'Groceries', 'Travel & Commute', 'Shopping',
    'Entertainment', 'Subscriptions', 'Fuel', 'Utilities',
    'Healthcare', 'Investments', 'Salary & Income', 'Transfer',
    'Credit Card Payment', 'Refunds', 'Other Expenses'
  ]);

  // Step state (1: Select & Upload, 2: Preview & Mapping, 3: Completed)
  const [step, setStep] = useState<number>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Parsing result states
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [detectedBank, setDetectedBank] = useState<string>('');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    date: '',
    description: '',
    debit: '',
    credit: '',
    amount: '',
    balance: '',
    referenceNumber: '',
  });
  const [previews, setPreviews] = useState<ParsedTransactionPreview[]>([]);
  const [showMappingDrawer, setShowMappingDrawer] = useState(false);

  // Success result
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch accounts on mount
  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => {
        const accs = data.accounts || [];
        setAccounts(accs);
        if (!selectedAccountId && accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Handle file drop/upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = async (f: File) => {
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Please upload a valid .csv bank statement file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10MB limit.');
      return;
    }

    setFile(f);
    setFileName(f.name);
    setErrorMsg(null);

    const text = await f.text();
    setCsvRawText(text);

    // Automatically trigger parse preview
    parseStatement(text, f.name, selectedAccountId);
  };

  const loadSampleCSV = async (sampleFileName: string) => {
    try {
      setParsing(true);
      setErrorMsg(null);
      let sampleText = '';

      if (sampleFileName === 'sbi_statement.csv') {
        sampleText = `Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
01/11/2024,01/11/2024,SWIGGY BANGALORE IN,UPI/43120199201,450.00,,49550.00
02/11/2024,02/11/2024,UBER INDIA BANGALORE,UPI/43120199202,280.00,,49270.00
03/11/2024,03/11/2024,MONTHLY SALARY NOV 2024,NEFT-SAL-102919,,75000.00,124270.00
04/11/2024,04/11/2024,INDIANOIL PETROL PUMP,POS/48201928,1500.00,,122770.00
05/11/2024,05/11/2024,SELF TRANSFER TO SAVINGS,IMPS/TRF/99120,5000.00,,117770.00
06/11/2024,06/11/2024,SWIGGY REFUND ORDER 991,UPI/REF/991203,,150.00,117920.00`;
      } else if (sampleFileName === 'hdfc_statement.csv') {
        sampleText = `HDFC BANK STATEMENT
Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/11/24,ZOMATO RESTAURANT GURGAON,00000491823,01/11/24,620.00,,44380.00
02/11/24,AMAZON SELLER SERVICES MUMBAI,00000491824,02/11/24,2499.00,,41881.00
03/11/24,NETFLIX ENTERTAINMENT,00000491825,03/11/24,649.00,,41232.00
04/11/24,CRED CC PAYMENT HDFC CARD,00000491826,04/11/24,12400.00,,28832.00
05/11/24,DIVIDEND CREDITED TCS LTD,00000491827,05/11/24,,1800.00,30632.00`;
      } else {
        sampleText = `Tran Date,CHQNO,PARTICULARS,DR,CR,BAL
15-Nov-2024,CHQ-1001,BLINKIT GROCERY BLR,1450.00,,58550.00
16-Nov-2024,CHQ-1002,GOOGLE STORAGE GSUITE,130.00,,58420.00
17-Nov-2024,CHQ-1003,AIRTEL PREPAID RECHARGE,499.00,,57921.00
18-Nov-2024,CHQ-1004,CASH DEPOSIT BRANCH,,5000.00,62921.00`;
      }

      setFileName(sampleFileName);
      setCsvRawText(sampleText);
      parseStatement(sampleText, sampleFileName, selectedAccountId);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load sample CSV.');
    } finally {
      setParsing(false);
    }
  };

  const parseStatement = async (csvContent: string, nameOfFile: string, accId: string, customMap?: ColumnMapping) => {
    if (!accId) {
      setErrorMsg('Please select a target bank account first.');
      return;
    }

    try {
      setParsing(true);
      setErrorMsg(null);

      const res = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          accountId: accId,
          customMapping: customMap,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse CSV');
      }

      setDetectedHeaders(data.headers || []);
      setDetectedBank(data.bankName || '');
      setColumnMapping(data.detectedMapping || {});
      setPreviews(data.previews || []);
      setStep(2); // Move to Preview & Confirmation
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error parsing statement.');
    } finally {
      setParsing(false);
    }
  };

  const handleCustomMappingApply = () => {
    parseStatement(csvRawText, fileName, selectedAccountId, columnMapping);
    setShowMappingDrawer(false);
  };

  // Row update handlers
  const toggleRowSelected = (tempId: string) => {
    setPreviews(prev =>
      prev.map(p => (p.tempId === tempId ? { ...p, selected: !p.selected } : p))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setPreviews(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const updateRowCategory = (tempId: string, category: string) => {
    setPreviews(prev =>
      prev.map(p => (p.tempId === tempId ? { ...p, category } : p))
    );
  };

  const updateRowType = (tempId: string, type: TransactionType) => {
    setPreviews(prev =>
      prev.map(p => (p.tempId === tempId ? { ...p, type } : p))
    );
  };

  // Step 9 & 10: Confirm and Save Import
  const handleConfirmImport = async () => {
    const selectedTxns = previews.filter(p => p.selected);
    if (selectedTxns.length === 0) {
      alert('Please select at least one transaction to import.');
      return;
    }

    try {
      setConfirming(true);
      setErrorMsg(null);

      // Collect any merchant-category overrides learned during this preview
      const learnedRules = selectedTxns.map(t => ({
        pattern: (t.merchantName || t.description).slice(0, 30),
        merchantName: t.merchantName,
        category: t.category,
      }));

      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: selectedAccountId,
          fileName,
          transactions: selectedTxns,
          learnedRules,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save imported transactions.');
      }

      setSuccessResult(data);
      setStep(3); // Success step
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to import transactions.');
    } finally {
      setConfirming(false);
    }
  };

  const selectedCount = previews.filter(p => p.selected).length;
  const duplicateCount = previews.filter(p => p.isDuplicate).length;
  const totalDebit = previews
    .filter(p => p.selected && (p.type === 'expense' || p.type === 'transfer' || p.type === 'credit_card_payment'))
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCredit = previews
    .filter(p => p.selected && (p.type === 'income' || p.type === 'refund'))
    .reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* 10-Step Visual Breadcrumbs */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
              step >= 1 ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
            }`}
          >
            1
          </span>
          <span className={step === 1 ? 'font-bold text-white' : 'text-slate-400'}>
            Account & Statement Upload
          </span>
        </div>

        <div className="hidden sm:block text-slate-600">→</div>

        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
              step >= 2 ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
            }`}
          >
            2
          </span>
          <span className={step === 2 ? 'font-bold text-white' : 'text-slate-400'}>
            Intelligent Preview, Duplicate Check & Categorization
          </span>
        </div>

        <div className="hidden sm:block text-slate-600">→</div>

        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
              step >= 3 ? 'bg-emerald-500 text-black' : 'bg-slate-800 text-slate-400'
            }`}
          >
            3
          </span>
          <span className={step === 3 ? 'font-bold text-white' : 'text-slate-400'}>
            Confirmation & Instant Financial Update
          </span>
        </div>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* STEP 1: Select Account & Upload Statement */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Account Selector */}
            <div className="md:col-span-1 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Landmark className="w-4 h-4 text-emerald-400" />
                Step 1: Select Target Account
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">Bank Account to Import Into</label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.name} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Supported Indian Banks notice */}
              <div className="pt-4 border-t border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Supported Bank Formats
                </span>
                <p className="text-[11px] text-slate-400">
                  Built-in heuristic parsers for SBI, HDFC, ICICI, Axis, Federal, Canara, and standard CSV statements.
                </p>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-1.5">
                    Click to test with realistic sample statement:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_BANKS.map(b => (
                      <button
                        key={b.name}
                        type="button"
                        onClick={() => loadSampleCSV(b.sample)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-white/10 text-[10px] font-mono text-slate-300 hover:text-emerald-400 transition"
                      >
                        {b.name} Sample
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Drag & Drop Upload Dropzone */}
            <div className="md:col-span-2 glass-panel p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-64 border-2 border-dashed border-white/15 hover:border-emerald-500/50 hover:bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition shadow-glow-emerald">
                  <UploadCloud className="w-8 h-8 stroke-[2]" />
                </div>

                <div className="mt-4 space-y-1">
                  <h3 className="text-base font-bold text-white">
                    Drop your Bank Statement CSV here
                  </h3>
                  <p className="text-xs text-slate-400">
                    or click to browse from your computer (Max size 10MB)
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Client & Local Processing • No Banking Passwords/OTPs Required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Intelligent Preview, Column Mapping, Duplicate Check & Categorization */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                  {detectedBank ? `Detected Format: ${detectedBank}` : 'Standard CSV'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 truncate">{fileName}</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Transaction Preview & Intelligent Categorization
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMappingDrawer(!showMappingDrawer)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                {showMappingDrawer ? 'Hide Column Mapping' : 'Adjust Column Mapping'}
              </button>

              <button
                onClick={() => {
                  setStep(1);
                  setPreviews([]);
                }}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Change File
              </button>
            </div>
          </div>

          {/* Column Mapping Fallback Tool (Collapsible) */}
          {showMappingDrawer && (
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    Step 6: Column Mapping Verification
                  </h4>
                  <p className="text-xs text-slate-400">
                    If your bank uses custom column headers, match them below and click Apply.
                  </p>
                </div>
                <button
                  onClick={handleCustomMappingApply}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition"
                >
                  Apply & Re-parse
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Date Column *</label>
                  <select
                    value={columnMapping.date}
                    onChange={e => setColumnMapping({ ...columnMapping, date: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="">Select...</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Description Column *</label>
                  <select
                    value={columnMapping.description}
                    onChange={e => setColumnMapping({ ...columnMapping, description: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="">Select...</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Withdrawal / Debit</label>
                  <select
                    value={columnMapping.debit}
                    onChange={e => setColumnMapping({ ...columnMapping, debit: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="">None / Amount col</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Deposit / Credit</label>
                  <select
                    value={columnMapping.credit}
                    onChange={e => setColumnMapping({ ...columnMapping, credit: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="">None / Amount col</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Balance Column</label>
                  <select
                    value={columnMapping.balance}
                    onChange={e => setColumnMapping({ ...columnMapping, balance: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="">Optional</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Reference / Cheque No.</label>
                  <select
                    value={columnMapping.referenceNumber}
                    onChange={e => setColumnMapping({ ...columnMapping, referenceNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="">Optional</option>
                    {detectedHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Summary / Stats Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="glass-panel p-4 rounded-xl border border-white/10">
              <span className="text-slate-400 block">Total In Statement</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{previews.length}</span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-emerald-500/30">
              <span className="text-slate-400 block">Selected For Import</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                {selectedCount} of {previews.length}
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-amber-500/30">
              <span className="text-slate-400 block">Duplicate Warnings</span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">
                {duplicateCount} detected
              </span>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/10">
              <span className="text-slate-400 block">Net Import Amount</span>
              <span className="text-lg font-bold text-slate-200 mt-0.5 block">
                +{formatCurrency(totalCredit)} / -{formatCurrency(totalDebit)}
              </span>
            </div>
          </div>

          {/* Interactive Preview Table */}
          <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden space-y-0">
            <div className="p-3.5 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleSelectAll(true)}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => toggleSelectAll(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Deselect All
                </button>
                {duplicateCount > 0 && (
                  <>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviews(prev =>
                          prev.map(p => (p.isDuplicate ? { ...p, selected: false } : p))
                        );
                      }}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      Uncheck All Duplicates
                    </button>
                  </>
                )}
              </div>

              <span className="text-slate-400 text-[11px]">
                Tip: You can change Category or Transaction Type in-place before saving.
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#0F172A] border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider z-10">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">Import</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Merchant / Narration</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Ref ID</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {previews.map(item => {
                    const isCredit = item.type === 'income' || item.type === 'refund';
                    return (
                      <tr
                        key={item.tempId}
                        className={`transition ${
                          item.isDuplicate
                            ? 'bg-amber-950/20 hover:bg-amber-900/30'
                            : item.selected
                            ? 'hover:bg-white/5'
                            : 'opacity-50 hover:opacity-75'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleRowSelected(item.tempId)}
                            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                          />
                        </td>

                        {/* Date */}
                        <td className="py-3 px-3 font-mono text-slate-300 whitespace-nowrap">
                          {item.date}
                        </td>

                        {/* Merchant & Narration */}
                        <td className="py-3 px-3 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block">{item.merchantName}</span>
                            {item.isDuplicate && (
                              <span
                                className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono shrink-0"
                                title={item.duplicateReason}
                              >
                                DUPLICATE
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate block" title={item.description}>
                            {item.description}
                          </span>
                        </td>

                        {/* Transaction Type */}
                        <td className="py-3 px-3">
                          <select
                            value={item.type}
                            onChange={e => updateRowType(item.tempId, e.target.value as any)}
                            className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="transfer">Transfer (Self)</option>
                            <option value="credit_card_payment">CC Payment</option>
                            <option value="refund">Refund</option>
                          </select>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <select
                            value={item.category}
                            onChange={e => updateRowCategory(item.tempId, e.target.value)}
                            className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500"
                          >
                            {categories.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>

                        {/* Ref ID */}
                        <td className="py-3 px-3 font-mono text-slate-400 text-[10px] truncate max-w-[120px]">
                          {item.referenceNumber || '-'}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                          <span className={isCredit ? 'text-emerald-400' : 'text-slate-100'}>
                            {isCredit ? '+' : '-'} {formatCurrency(item.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 9 & 10 Confirmation Action Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block">
                Ready to confirm: <span className="text-white font-bold">{selectedCount}</span> transactions selected
              </span>
              <span className="text-[11px] text-slate-500">
                All selected records will be saved to your Finora Transactions sheet and recalculate all balances immediately.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={confirming || selectedCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-sm font-bold shadow-glow-emerald transition active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                {confirming ? 'Saving Transactions...' : `Confirm & Import ${selectedCount} Transactions`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Completed Screen */}
      {step === 3 && (
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-emerald-500/40 text-center space-y-6 max-w-xl mx-auto animate-fade-in shadow-glow-emerald">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Statement Imported Successfully!
            </h2>
            <p className="text-xs text-slate-400 mt-2">
              Imported {successResult?.importedCount || 0} transactions into your financial account.
              Account balances, daily spending, and category budgets have been updated.
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 text-xs text-slate-300 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Import Batch ID:</span>
              <span className="font-mono text-emerald-400">{successResult?.batchId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Updated Account Balance:</span>
              <span className="font-bold text-white">
                {formatCurrency(successResult?.accountUpdatedBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Merchant Mappings:</span>
              <span className="text-emerald-400">Rules learned for future imports</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition text-center"
            >
              Go to Dashboard
            </Link>

            <Link
              href="/transactions"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold transition text-center"
            >
              View All Transactions
            </Link>

            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setPreviews([]);
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs transition text-center"
            >
              Import Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-slate-400 text-xs">Loading Statement Wizard...</div>}>
      <ImportContent />
    </React.Suspense>
  );
}
