'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { FileUp, Upload, X } from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { IMPORT_FIELDS, guessMapping, parseCsv, type ImportKey } from '@/lib/leads/transfer';
import { importLeads } from './actions';

/** Import leads from a CSV (a file or pasted text): columns are matched by their headers and can be corrected before importing. */
export function ImportDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (open: boolean) => void; onDone: (summary: string) => void }) {
  const [raw, setRaw] = useState('');
  const [mapping, setMapping] = useState<Record<ImportKey, number> | null>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const table = useMemo(() => (raw.trim() ? parseCsv(raw) : []), [raw]);
  const headers = table[0] ?? [];
  const body = table.slice(1);
  const map = mapping ?? (headers.length ? guessMapping(headers) : null);

  async function readFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setError('That file is over 3 MB — split it into smaller files.');
      return;
    }
    setError(null);
    setMapping(null);
    setRaw(await file.text());
  }

  const rows = map
    ? body.map((r) => Object.fromEntries(IMPORT_FIELDS.map((f) => [f.key, map[f.key] >= 0 ? (r[map[f.key]] ?? '').trim() : ''])) as Record<ImportKey, string>)
    : [];
  const usable = rows.filter((r) => r.name && (r.phone || r.email));

  function run() {
    setError(null);
    start(async () => {
      const result = await importLeads(usable);
      onDone(`Imported ${result.added} lead${result.added === 1 ? '' : 's'}${result.duplicates ? `, ${result.duplicates} skipped (phone already exists)` : ''}${result.invalid ? `, ${result.invalid} skipped (no name or contact)` : ''}.`);
      setRaw('');
      setMapping(null);
      onOpenChange(false);
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#090c15]/60 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[22px] border border-border bg-card shadow-[0_28px_70px_-20px_rgb(9_12_21/0.45)] focus:outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
            <div>
              <Dialog.Title className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em] text-foreground">
                <Upload aria-hidden="true" className="h-5 w-5 text-[var(--accent)]" /> Import leads
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-foreground-muted">From a CSV with a header row. People whose phone number already exists are skipped.</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Close" className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-foreground-muted hover:bg-surface hover:text-foreground">
              <X aria-hidden="true" className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--admin-radius)] border border-dashed border-border-medium bg-surface/50 px-4 py-6 text-center text-sm text-foreground-secondary hover:border-[var(--accent)]">
              <FileUp aria-hidden="true" className="h-6 w-6 text-foreground-muted" />
              <span className="font-semibold text-foreground">Choose a CSV file</span>
              <span className="text-xs text-foreground-muted">or paste the rows below</span>
              <input type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => readFile(e.target.files?.[0])} />
            </label>
            <textarea
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setMapping(null);
              }}
              rows={4}
              placeholder={'Name,Phone,Email,Course,City\nAsha Rao,9800000001,asha@example.com,BCA,Pune'}
              aria-label="CSV text"
              className="admin-input font-mono text-xs"
            />

            {map && headers.length > 0 ? (
              <div>
                <p className="text-xs font-bold tracking-wide text-foreground-muted uppercase">Match the columns</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {IMPORT_FIELDS.map((f) => (
                    <label key={f.key} className="flex flex-col gap-1 text-xs font-semibold text-foreground-secondary">
                      {f.label}
                      {f.key === 'name' ? ' *' : ''}
                      <select
                        value={map[f.key]}
                        onChange={(e) => setMapping({ ...map, [f.key]: Number(e.target.value) })}
                        className="admin-input h-10 text-sm"
                      >
                        <option value={-1}>— none —</option>
                        {headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h || `Column ${i + 1}`}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-sm text-foreground-secondary">
                  <strong className="text-foreground">{usable.length}</strong> of {rows.length} row{rows.length === 1 ? '' : 's'} can be imported (a name and a phone or email are needed).
                </p>
                {usable.length > 0 ? (
                  <div className="mt-2 overflow-x-auto rounded-[var(--admin-radius)] border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface/70 text-foreground-muted">
                        <tr>{IMPORT_FIELDS.map((f) => <th key={f.key} className="px-3 py-2 font-bold">{f.label}</th>)}</tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {usable.slice(0, 5).map((r, i) => (
                          <tr key={i}>{IMPORT_FIELDS.map((f) => <td key={f.key} className="max-w-[10rem] truncate px-3 py-1.5 text-foreground-secondary">{r[f.key] || '—'}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ) : null}
            {error ? <p role="alert" className="text-sm font-medium text-[var(--color-error-600)]">{error}</p> : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border bg-surface/60 px-6 py-4">
            <Dialog.Close className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border-medium px-5 text-sm font-semibold text-foreground-secondary hover:bg-surface">Cancel</Dialog.Close>
            <button type="button" disabled={pending || usable.length === 0} onClick={run} className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--admin-radius)] px-5 text-sm font-bold disabled:opacity-45">
              <Upload aria-hidden="true" className="h-4 w-4" /> {pending ? 'Importing…' : `Import ${usable.length || ''} lead${usable.length === 1 ? '' : 's'}`}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
