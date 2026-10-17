'use client';

import { useState, useTransition } from 'react';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { importRedirects, removeRedirect, saveRedirect, type RedirectItem } from './actions';

const blank = { id: undefined as string | undefined, source: '', destination: '', permanent: true, note: '' };

export function RedirectsManager({ initial, staticCount }: { initial: RedirectItem[]; staticCount: number }) {
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [bulk, setBulk] = useState('');
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<RedirectItem | null>(null);
  const [pending, start] = useTransition();

  const q = query.trim().toLowerCase();
  const shown = q ? items.filter((r) => r.source.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q)) : items;

  function submit() {
    setError(null);
    start(async () => {
      const result = await saveRedirect(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) => (form.id ? prev.map((r) => (r.id === result.item.id ? result.item : r)) : [result.item, ...prev]));
      setForm(blank);
    });
  }

  function runImport() {
    start(async () => {
      const result = await importRedirects(bulk);
      setBulkResult(`${result.added} added${result.skipped.length ? `, ${result.skipped.length} skipped` : ''}.${result.skipped.length ? `\n${result.skipped.join('\n')}` : ''}`);
      if (result.added > 0) {
        const fresh = await import('./actions').then((m) => m.listRedirects());
        setItems(fresh);
        setBulk('');
      }
    });
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <div className="flex flex-col gap-4">
        <section className="adm-card p-5">
          <h2 className="text-sm font-bold text-foreground">{form.id ? 'Edit redirect' : 'Add a redirect'}</h2>
          <div className="mt-4 flex flex-col gap-3">
            <label className="text-xs font-semibold text-foreground-secondary">
              Old URL
              <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="/old-page" className="admin-input mt-1.5" />
            </label>
            <label className="text-xs font-semibold text-foreground-secondary">
              New URL
              <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="/courses or https://…" className="admin-input mt-1.5" />
            </label>
            <label className="text-xs font-semibold text-foreground-secondary">
              Note (optional)
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="admin-input mt-1.5" />
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground-secondary">
              <input type="checkbox" checked={form.permanent} onChange={(e) => setForm({ ...form, permanent: e.target.checked })} className="h-4 w-4 accent-[var(--accent)]" />
              Permanent (SEO-safe 301-style). Untick for a temporary redirect.
            </label>
            {error ? (
              <p role="alert" className="text-sm font-medium text-[var(--color-error-600)]">
                {error}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button type="button" disabled={pending} onClick={submit} className="adm-btn-primary min-h-11 cursor-pointer rounded-[var(--admin-radius)] px-5 text-sm font-bold disabled:opacity-45">
                {pending ? 'Saving…' : form.id ? 'Save changes' : 'Add redirect'}
              </button>
              {form.id ? (
                <button type="button" onClick={() => setForm(blank)} className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary">
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="adm-card p-5">
          <h2 className="text-sm font-bold text-foreground">Bulk import</h2>
          <p className="mt-1 text-xs text-foreground-muted">One per line: /old-url , /new-url</p>
          <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={5} className="admin-input mt-3 font-mono text-xs" aria-label="Redirects to import" />
          <button type="button" disabled={pending || !bulk.trim()} onClick={runImport} className="mt-3 min-h-10 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary hover:border-[var(--accent)] disabled:opacity-45">
            Import
          </button>
          {bulkResult ? <pre className="mt-3 max-h-40 overflow-auto text-xs whitespace-pre-wrap text-foreground-secondary">{bulkResult}</pre> : null}
        </section>
      </div>

      <section className="adm-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface/70 px-4 py-3">
          <h2 className="text-sm font-bold text-foreground">
            Managed redirects <span className="font-medium text-foreground-muted">· {items.length}</span>
          </h2>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" aria-label="Search redirects" className="admin-input h-9 max-w-48 text-sm" />
        </div>
        {shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-foreground-muted">{items.length === 0 ? 'No redirects added yet.' : 'Nothing matches.'}</p>
        ) : (
          <ul className="max-h-[36rem] divide-y divide-border overflow-auto">
            {shown.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 text-sm">
                  <p className="truncate font-semibold text-foreground">
                    {r.source} <span className="text-foreground-muted">→</span> {r.destination}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {r.permanent ? 'Permanent' : 'Temporary'}
                    {r.note ? ` · ${r.note}` : ''}
                    {r.createdBy ? ` · ${r.createdBy}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setForm({ id: r.id, source: r.source, destination: r.destination, permanent: r.permanent, note: r.note })} className="cursor-pointer text-xs font-semibold text-[var(--accent-ink)] hover:underline">
                    Edit
                  </button>
                  <button type="button" onClick={() => setToDelete(r)} className="cursor-pointer text-xs font-semibold text-foreground-muted hover:text-[#b42318]">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-border px-4 py-3 text-xs text-foreground-muted">
          {staticCount} more reviewed legacy redirects are built into the site and are not listed here.
        </p>
      </section>

      <AdminConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Delete redirect"
        description={
          <>
            Stop redirecting <span className="font-semibold text-foreground">{toDelete?.source}</span>? Visitors will get a 404 there unless a page exists.
          </>
        }
        onConfirm={() => {
          const target = toDelete;
          if (!target) return;
          start(async () => {
            await removeRedirect(target.id);
            setItems((prev) => prev.filter((r) => r.id !== target.id));
            setToDelete(null);
          });
        }}
      />
    </div>
  );
}
