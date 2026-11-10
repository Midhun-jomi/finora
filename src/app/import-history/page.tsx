'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  UploadCloud,
  Landmark,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { ImportBatch } from '@/lib/types';

export default function ImportHistoryPage() {
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/import-history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.importHistory || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRollback = async (batch: ImportBatch) => {
    const confirmMsg = `Are you sure you want to rollback and remove all ${batch.successfulCount} transactions imported from "${batch.fileName}" on ${new Date(batch.importedAt).toLocaleDateString()}? Account balance will be restored automatically.`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/import-history?id=${batch.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.message || 'Batch rolled back successfully.');
        fetchHistory();
        setTimeout(() => setFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Error rolling back batch.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
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
            <History className="w-7 h-7 text-emerald-400" />
            Bank Statement Import History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete audit trail of all CSV statement uploads, duplicate counts, and batch rollback controls.
          </p>
        </div>

        <Link
          href="/import"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black text-xs font-bold shadow-glow-emerald transition active:scale-95 self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4 stroke-[2.5]" />
          Import New Statement
        </Link>
      </div>

      {/* History Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading import history...</div>
        ) : history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-medium uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Statement File Name</th>
                  <th className="py-3 px-4">Target Account</th>
                  <th className="py-3 px-4">Import Date & Time</th>
                  <th className="py-3 px-4 text-center">Parsed</th>
                  <th className="py-3 px-4 text-center">Successful</th>
                  <th className="py-3 px-4 text-center">Duplicates</th>
                  <th className="py-3 px-4 text-center">Failed</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map(batch => (
                  <tr key={batch.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="font-bold text-white block">{batch.fileName}</span>
                          <span className="text-[10px] font-mono text-slate-500">{batch.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {batch.accountName}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(batch.importedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                      {batch.totalParsed}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                      {batch.successfulCount}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-amber-400">
                      {batch.duplicateCount}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold text-slate-500">
                      {batch.failedCount}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/transactions?search=${batch.fileName}`}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-medium transition"
                        >
                          View Transactions
                        </Link>
                        <button
                          onClick={() => handleRollback(batch)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-medium transition"
                          title="Undo / Rollback this import"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Rollback
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p>No bank statements imported yet.</p>
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
  );
}

