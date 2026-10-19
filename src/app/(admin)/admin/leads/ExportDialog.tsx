'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Braces, Download, FileSpreadsheet, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { EXPORT_COLUMNS, toCsv, toJson, toSheet, type ExportableLead } from '@/lib/leads/transfer';

type Format = 'xlsx' | 'csv' | 'json';
type Scope = 'selected' | 'filtered' | 'all';

const FORMATS: Array<{ key: Format; label: string; hint: string; Icon: typeof FileText }> = [
  { key: 'xlsx', label: 'Excel', hint: '.xlsx — opens in Excel, Sheets, Numbers', Icon: FileSpreadsheet },
  { key: 'csv', label: 'CSV', hint: '.csv — works everywhere, incl. other CRMs', Icon: FileText },
  { key: 'json', label: 'JSON', hint: '.json — for developers and automations', Icon: Braces },
];

const PREFS = 'jk-leads-export';

function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/**
 * Export leads: choose which leads (selected / the current filter / everything), the file type and the
 * columns. The last choice is remembered in this browser.
 */
export function ExportDialog({
  open,
  onOpenChange,
  selected,
  filtered,
  all,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: ExportableLead[];
  filtered: ExportableLead[];
  all: ExportableLead[];
}) {
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(PREFS) ?? 'null') as { format?: Format; columns?: string[] } | null;
    } catch {
      return null;
    }
  })();
  const [format, setFormat] = useState<Format>(saved?.format ?? 'xlsx');
  const [scope, setScope] = useState<Scope>(selected.length > 0 ? 'selected' : 'filtered');
  const [columns, setColumns] = useState<string[]>(saved?.columns ?? EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.key));
  const [busy, setBusy] = useState(false);

  const rows = scope === 'selected' ? selected : scope === 'filtered' ? filtered : all;
  const cols = EXPORT_COLUMNS.filter((c) => columns.includes(c.key));

  async function run() {
    if (rows.length === 0 || cols.length === 0) return;
    setBusy(true);
    try {
      localStorage.setItem(PREFS, JSON.stringify({ format, columns }));
    } catch {
      /* storage blocked */
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const base = `jetking-leads-${stamp}`;
    if (format === 'csv') download(new Blob([toCsv(rows, cols)], { type: 'text/csv;charset=utf-8' }), `${base}.csv`);
    else if (format === 'json') download(new Blob([toJson(rows, cols)], { type: 'application/json' }), `${base}.json`);
    else {
      const { default: writeExcelFile } = await import('write-excel-file/browser');
      await writeExcelFile(toSheet(rows, cols) as never).toFile(`${base}.xlsx`);
    }
    setBusy(false);
    onOpenChange(false);
  }

  const scopes: Array<{ key: Scope; label: string; n: number }> = [
    { key: 'selected', label: 'Selected leads', n: selected.length },
    { key: 'filtered', label: 'Current view (filters applied)', n: filtered.length },
    { key: 'all', label: 'Every lead', n: all.length },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#090c15]/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_28px_70px_-20px_rgb(9_12_21/0.45)] focus:outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em] text-foreground">
                <Download aria-hidden="true" className="h-5 w-5 text-[var(--accent)]" /> Export leads
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-foreground-muted">Pick what to export and how. Your choice is remembered.</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close" className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-foreground-muted hover:bg-surface hover:text-foreground">
              <X aria-hidden="true" className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-6 overflow-y-auto px-6 py-5">
            <fieldset>
              <legend className="text-xs font-bold tracking-wide text-foreground-muted uppercase">Which leads</legend>
              <div className="mt-2 flex flex-col gap-2">
                {scopes.map((s) => (
                  <label key={s.key} className={`flex cursor-pointer items-center justify-between gap-3 rounded-[var(--admin-radius)] border px-3.5 py-2.5 text-sm ${scope === s.key ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-border'} ${s.n === 0 ? 'opacity-50' : ''}`}>
                    <span className="flex items-center gap-2.5">
                      <input type="radio" name="scope" checked={scope === s.key} disabled={s.n === 0} onChange={() => setScope(s.key)} className="accent-[var(--accent)]" />
                      {s.label}
                    </span>
                    <span className="numeral font-bold text-foreground">{s.n}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-xs font-bold tracking-wide text-foreground-muted uppercase">File type</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {FORMATS.map(({ key, label, hint, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={format === key}
                    onClick={() => setFormat(key)}
                    className={`cursor-pointer rounded-[var(--admin-radius)] border p-3 text-left transition-colors ${format === key ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-border hover:border-border-medium'}`}
                  >
                    <Icon aria-hidden="true" className={`h-5 w-5 ${format === key ? 'text-[var(--accent)]' : 'text-foreground-muted'}`} />
                    <span className="mt-2 block text-sm font-bold text-foreground">{label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-foreground-muted">{hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="flex w-full items-center justify-between text-xs font-bold tracking-wide text-foreground-muted uppercase">
                Columns
                <span className="flex gap-3 normal-case">
                  <button type="button" onClick={() => setColumns(EXPORT_COLUMNS.map((c) => c.key))} className="cursor-pointer font-semibold text-[var(--accent-ink)] hover:underline">All</button>
                  <button type="button" onClick={() => setColumns(EXPORT_COLUMNS.filter((c) => c.default).map((c) => c.key))} className="cursor-pointer font-semibold text-[var(--accent-ink)] hover:underline">Default</button>
                </span>
              </legend>
              <div className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                {EXPORT_COLUMNS.map((c) => (
                  <label key={c.key} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-foreground-secondary">
                    <input type="checkbox" checked={columns.includes(c.key)} onChange={(e) => setColumns(e.target.checked ? [...columns, c.key] : columns.filter((k) => k !== c.key))} className="h-4 w-4 accent-[var(--accent)]" />
                    {c.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-surface/60 px-6 py-4">
            <span className="text-xs text-foreground-muted">{rows.length} lead{rows.length === 1 ? '' : 's'} · {cols.length} column{cols.length === 1 ? '' : 's'}</span>
            <div className="flex gap-2">
              <Dialog.Close className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border-medium px-5 text-sm font-semibold text-foreground-secondary hover:bg-surface">Cancel</Dialog.Close>
              <button type="button" disabled={busy || rows.length === 0 || cols.length === 0} onClick={run} className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--admin-radius)] px-5 text-sm font-bold disabled:opacity-45">
                <Download aria-hidden="true" className="h-4 w-4" /> {busy ? 'Preparing…' : 'Download'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
