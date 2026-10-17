'use client';

import { useMemo, useState, useTransition } from 'react';
import { saveSeo, type SeoTarget, type SeoValues } from './actions';
import { MediaPickerButton } from '../MediaPicker';
import { AdminConfirmDialog } from '../AdminConfirmDialog';

export interface SeoRow {
  kind: 'page' | 'record';
  collection: string;
  id: string;
  label: string;
  path: string;
  title: string;
  description: string;
  canonicalPath: string;
  ogImage: string;
  noindex: boolean;
  draft?: boolean;
}

const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;
const PAGE_SIZE = 40;
const TYPE_LABEL: Record<string, string> = { page_copy: 'Page', courses: 'Course', centres: 'Centre', cities: 'City', posts: 'Post' };

function issuesOf(r: SeoRow, titleCounts: Map<string, number>): string[] {
  const out: string[] = [];
  const t = r.title.trim();
  if (!t) out.push('No title');
  else if (t.length > TITLE_MAX) out.push('Title too long');
  else if (t.length < 20) out.push('Title short');
  if ((titleCounts.get(t.toLowerCase()) ?? 0) > 1 && t) out.push('Duplicate title');
  const d = r.description.trim();
  if (!d) out.push('No description');
  else if (d.length > DESC_MAX) out.push('Description too long');
  else if (d.length < DESC_MIN) out.push('Description short');
  if (r.noindex) out.push('Hidden from search');
  return out;
}

function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.trim().length;
  const ok = n >= min && n <= max;
  return <span className={`text-xs ${ok ? 'text-[#067647]' : 'text-[#b54708]'}`}>{n} / {max}</span>;
}

export function SeoTable({ rows: initial }: { rows: SeoRow[] }) {
  const [rows, setRows] = useState(initial);
  const [type, setType] = useState('all');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<SeoValues | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirmRow, setConfirmRow] = useState<SeoRow | null>(null);

  const titleCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) if (!r.draft) m.set(r.title.trim().toLowerCase(), (m.get(r.title.trim().toLowerCase()) ?? 0) + 1);
    return m;
  }, [rows]);

  const withIssues = useMemo(() => rows.map((r) => ({ r, issues: issuesOf(r, titleCounts) })), [rows, titleCounts]);
  const totalIssues = withIssues.filter((x) => x.issues.some((i) => i !== 'Hidden from search')).length;
  const q = query.trim().toLowerCase();
  const shown = withIssues.filter(
    ({ r, issues }) =>
      (type === 'all' || r.collection === type) &&
      (!onlyIssues || issues.some((i) => i !== 'Hidden from search')) &&
      (!q || `${r.label} ${r.path} ${r.title}`.toLowerCase().includes(q)),
  );
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const view = shown.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const key = (r: SeoRow) => `${r.collection}:${r.id}`;

  function open(r: SeoRow) {
    setOpenKey(key(r));
    setDraft({ title: r.title, description: r.description, canonicalPath: r.canonicalPath, ogImage: r.ogImage, noindex: r.noindex });
    setError(null);
  }

  function save(r: SeoRow) {
    if (!draft) return;
    const target: SeoTarget = r.kind === 'page' ? { kind: 'page', id: r.id } : { kind: 'record', collection: r.collection as 'courses', id: r.id };
    start(async () => {
      const result = await saveSeo(target, draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRows((prev) => prev.map((x) => (key(x) === key(r) ? { ...x, ...draft } : x)));
      setOpenKey(null);
    });
  }

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Pages & records', rows.length],
          ['Need attention', totalIssues],
          ['Hidden from search', rows.filter((r) => r.noindex).length],
          ['Without a share image', rows.filter((r) => !r.ogImage).length],
        ].map(([label, n]) => (
          <div key={label} className="adm-card p-4">
            <p className="text-xs font-semibold text-foreground-secondary">{label}</p>
            <p className="numeral mt-2 text-2xl leading-none font-extrabold text-foreground">{n}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search title or URL…" aria-label="Search" className="admin-input h-10 max-w-xs text-sm" />
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} aria-label="Type" className="admin-input h-10 w-auto text-sm">
          <option value="all">All types</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}s</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-foreground-secondary">
          <input type="checkbox" checked={onlyIssues} onChange={(e) => { setOnlyIssues(e.target.checked); setPage(0); }} className="h-4 w-4 accent-[var(--accent)]" />
          Only show problems
        </label>
        <span className="text-xs text-foreground-muted">{shown.length} shown</span>
      </div>

      <ul className="adm-card mt-4 divide-y divide-border overflow-hidden">
        {view.length === 0 ? <li className="px-4 py-8 text-center text-sm text-foreground-muted">Nothing matches.</li> : null}
        {view.map(({ r, issues }) => {
          const isOpen = openKey === key(r);
          return (
            <li key={key(r)} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    <span className="mr-2 rounded bg-surface px-1.5 py-0.5 text-[11px] font-bold text-foreground-muted ring-1 ring-border">{TYPE_LABEL[r.collection]}</span>
                    {r.label}
                    {r.draft ? <span className="ml-2 text-xs font-medium text-[#b54708]">Draft</span> : null}
                  </p>
                  <p className="truncate text-xs text-foreground-muted">{r.path}</p>
                  <p className="mt-1 truncate text-sm text-foreground-secondary">{r.title || '—'}</p>
                  {issues.length > 0 ? (
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      {issues.map((i) => (
                        <span key={i} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${i === 'Hidden from search' ? 'bg-surface text-foreground-muted ring-1 ring-border' : 'bg-[var(--color-signal-50)] text-[#b54708]'}`}>{i}</span>
                      ))}
                    </p>
                  ) : null}
                </div>
                <button type="button" onClick={() => (isOpen ? setOpenKey(null) : open(r))} className="min-h-10 shrink-0 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3.5 text-xs font-bold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">
                  {isOpen ? 'Close' : 'Edit'}
                </button>
              </div>

              {isOpen && draft ? (
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold text-foreground-secondary">
                      <span className="flex justify-between">Title <Counter value={draft.title} min={20} max={TITLE_MAX} /></span>
                      <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="admin-input mt-1.5" />
                    </label>
                    <label className="text-xs font-semibold text-foreground-secondary">
                      <span className="flex justify-between">Description <Counter value={draft.description} min={DESC_MIN} max={DESC_MAX} /></span>
                      <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={3} className="admin-input mt-1.5" />
                    </label>
                    {r.kind === 'record' ? (
                      <label className="text-xs font-semibold text-foreground-secondary">
                        Canonical URL (only if this content lives elsewhere)
                        <input value={draft.canonicalPath} onChange={(e) => setDraft({ ...draft, canonicalPath: e.target.value })} placeholder={r.path} className="admin-input mt-1.5" />
                      </label>
                    ) : null}
                    <div className="text-xs font-semibold text-foreground-secondary">
                      Share image
                      <div className="mt-1.5 flex gap-2">
                        <input value={draft.ogImage} onChange={(e) => setDraft({ ...draft, ogImage: e.target.value })} placeholder="Site default" className="admin-input min-w-0 flex-1" />
                        <MediaPickerButton onPick={(m) => setDraft({ ...draft, ogImage: m.url })} />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <input type="checkbox" checked={draft.noindex} onChange={(e) => setDraft({ ...draft, noindex: e.target.checked })} className="h-4 w-4 accent-[var(--accent)]" />
                      Hide this page from search engines (noindex)
                    </label>
                    {error ? <p role="alert" className="text-sm font-medium text-[var(--color-error-600)]">{error}</p> : null}
                    <div>
                      <button type="button" disabled={pending} onClick={() => setConfirmRow(r)} className="adm-btn-primary min-h-11 cursor-pointer rounded-[var(--admin-radius)] px-6 text-sm font-bold disabled:opacity-45">
                        {pending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-[var(--admin-radius)] border border-border bg-background p-4" aria-label="Search result preview">
                    <p className="text-xs font-semibold text-foreground-muted">Search result preview</p>
                    <p className="mt-3 truncate text-xs text-foreground-muted">{(r.canonicalPath || r.path)}</p>
                    <p className="mt-1 text-[18px] leading-snug text-[#1a0dab]">{draft.title.slice(0, 70) || 'Title'}</p>
                    <p className="mt-1 text-sm leading-snug text-foreground-secondary">{draft.description.slice(0, 170) || 'Description'}</p>
                    {r.kind === 'page' ? <p className="mt-3 text-[11px] text-foreground-muted">Tokens like {'{siteName}'} are filled in on the live page.</p> : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="cursor-pointer font-semibold text-foreground-secondary disabled:opacity-40">← Previous</button>
          <span className="text-foreground-muted">Page {page + 1} of {pages}</span>
          <button type="button" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="cursor-pointer font-semibold text-foreground-secondary disabled:opacity-40">Next →</button>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={confirmRow !== null}
        onOpenChange={(open) => !pending && !open && setConfirmRow(null)}
        title="Publish these SEO changes?"
        description={
          <>
            The title, description and indexing for <span className="font-semibold text-foreground">{confirmRow?.label}</span> change on the live site
            straight away.
          </>
        }
        confirmLabel="Publish"
        pendingLabel="Saving…"
        tone="default"
        pending={pending}
        onConfirm={() => {
          const row = confirmRow;
          setConfirmRow(null);
          if (row) save(row);
        }}
      />
    </div>
  );
}
