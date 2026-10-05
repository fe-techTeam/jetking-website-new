'use client';

import { useMemo, useState, useTransition } from 'react';
import { Search } from 'lucide-react';
import { saveCollectionItem, removeCollectionItem } from '../actions';
import { AdminConfirmDialog } from '../AdminConfirmDialog';

export interface EditablePage {
  id: string;
  label: string;
  path?: string;
  group: string;
  description?: string;
  defaults: Record<string, string>;
}

type Overrides = Record<string, Record<string, string>>;

const SEGMENT_LABELS: Record<string, string> = { seo: 'SEO & sharing', cta: 'Call to action', faq: 'FAQ', ogImage: 'Share image' };

function humanizeSegment(segment: string): string {
  if (/^\d+$/.test(segment)) return `Item ${Number(segment) + 1}`;
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  const spaced = segment.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** `hero.cta.href` → section "Hero", field "Call to action › Href". Single-segment keys sit under "General". */
function describeKey(key: string): { section: string; label: string } {
  const parts = key.split('.');
  if (parts.length === 1) return { section: 'General', label: humanizeSegment(parts[0]!) };
  const [first, ...rest] = parts;
  return { section: humanizeSegment(first!), label: rest.map(humanizeSegment).join(' › ') };
}

const LONG_KEY = /description|body|lede|intro|text|paragraph|answer|summary|quote|disclaimer|note/i;

export function PageCopyEditor({ pages, initialOverrides }: { pages: EditablePage[]; initialOverrides: Overrides }) {
  const [overrides, setOverrides] = useState<Overrides>(initialOverrides);
  const [selectedId, setSelectedId] = useState(pages[0]?.id ?? '');
  const [draft, setDraft] = useState<Record<string, string>>(() => ({
    ...(pages[0]?.defaults ?? {}),
    ...(initialOverrides[pages[0]?.id ?? ''] ?? {}),
  }));
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);

  const page = pages.find((p) => p.id === selectedId) ?? pages[0]!;
  const saved = overrides[page.id] ?? {};

  /** What would be stored: only fields that differ from the shipped text. */
  const nextEntries = useMemo(() => {
    const out: Record<string, string> = {};
    for (const key of Object.keys(page.defaults)) {
      const value = draft[key] ?? '';
      if (value.trim() !== '' && value !== page.defaults[key]) out[key] = value;
    }
    return out;
  }, [draft, page]);
  const isDirty = JSON.stringify(nextEntries) !== JSON.stringify(saved);

  const sections = useMemo(() => {
    const map = new Map<string, Array<{ key: string; label: string }>>();
    for (const key of Object.keys(page.defaults)) {
      const { section, label } = describeKey(key);
      if (!map.has(section)) map.set(section, []);
      map.get(section)!.push({ key, label });
    }
    // SEO first: it is what most edits are about, and it is the same on every page.
    return [...map.entries()].sort(([a], [b]) => (a === 'SEO & sharing' ? -1 : b === 'SEO & sharing' ? 1 : 0));
  }, [page]);

  const q = query.trim().toLowerCase();
  const matches = (key: string, label: string) =>
    !q || key.toLowerCase().includes(q) || label.toLowerCase().includes(q) || (draft[key] ?? '').toLowerCase().includes(q);

  function openPage(id: string) {
    const next = pages.find((p) => p.id === id)!;
    setSelectedId(id);
    setDraft({ ...next.defaults, ...(overrides[id] ?? {}) });
    setMessage(null);
    setError(null);
    setQuery('');
  }

  function requestSwitch(id: string) {
    if (id === page.id) return;
    if (isDirty) setPendingSwitch(id);
    else openPage(id);
  }

  function save() {
    start(async () => {
      setMessage(null);
      setError(null);
      const entries = nextEntries;
      if (Object.keys(entries).length === 0) {
        if (Object.keys(saved).length > 0) await removeCollectionItem('page_copy', 'id', page.id);
      } else {
        const result = await saveCollectionItem(
          'page_copy',
          'id',
          JSON.stringify({ id: page.id, entries, status: 'published' }),
          Object.keys(saved).length > 0 ? page.id : undefined,
        );
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      setOverrides((prev) => {
        const copy = { ...prev };
        if (Object.keys(entries).length === 0) delete copy[page.id];
        else copy[page.id] = entries;
        return copy;
      });
      setMessage('Saved. The page has been refreshed.');
    });
  }

  function resetPage() {
    start(async () => {
      if (Object.keys(saved).length > 0) await removeCollectionItem('page_copy', 'id', page.id);
      setOverrides((prev) => {
        const copy = { ...prev };
        delete copy[page.id];
        return copy;
      });
      setDraft({ ...page.defaults });
      setConfirmReset(false);
      setMessage('Reset to the original text.');
    });
  }

  const groups = [...new Set(pages.map((p) => p.group))];
  const fieldCount = Object.keys(page.defaults).length;
  const editedCount = Object.keys(nextEntries).length;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-start">
      {/* ── Page list ─────────────────────────────────────────────────── */}
      <nav aria-label="Pages" className="min-w-0">
        <div className="adm-card overflow-hidden">
          {groups.map((group) => (
            <div key={group}>
              <p className="border-b border-border bg-surface/70 px-4 py-3 text-xs font-bold tracking-wide text-foreground-muted uppercase">
                {group}
              </p>
              <ul>
                {pages
                  .filter((p) => p.group === group)
                  .map((p) => {
                    const active = p.id === page.id;
                    const edits = Object.keys(overrides[p.id] ?? {}).length;
                    return (
                      <li key={p.id} className="relative border-b border-border last:border-none">
                        {active ? (
                          <span
                            aria-hidden="true"
                            className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r-full bg-[var(--accent)]"
                          />
                        ) : null}
                        <button
                          type="button"
                          aria-current={active ? 'true' : undefined}
                          onClick={() => requestSwitch(p.id)}
                          className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${
                            active ? 'bg-[var(--accent-soft)]' : 'hover:bg-surface/70'
                          }`}
                        >
                          <span className={`text-sm ${active ? 'font-bold text-[var(--accent-ink)]' : 'font-medium text-foreground'}`}>
                            {p.label}
                          </span>
                          {edits > 0 ? (
                            <span className="numeral shrink-0 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-bold text-[var(--accent-ink)]">
                              {edits} edited
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* ── Fields ────────────────────────────────────────────────────── */}
      <div className="min-w-0">
        <div className="adm-card p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold tracking-[-0.02em] text-foreground">{page.label}</h2>
              {page.description ? <p className="mt-1 text-sm text-foreground-muted">{page.description}</p> : null}
              <p className="mt-2 text-xs font-semibold text-foreground-muted">
                {fieldCount} editable field{fieldCount === 1 ? '' : 's'}
                {editedCount > 0 ? ` · ${editedCount} changed from the original` : ''}
                {page.path ? (
                  <>
                    {' · '}
                    <a
                      href={page.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-ink)] underline-offset-2 hover:underline"
                    >
                      View page<span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {error ? (
                <p role="alert" className="text-sm font-medium text-[var(--color-error-600)]">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p aria-live="polite" className="text-sm font-semibold text-[#067647]">
                  {message}
                </p>
              ) : null}
              <button
                type="button"
                disabled={pending || Object.keys(saved).length === 0}
                onClick={() => setConfirmReset(true)}
                className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border-medium bg-background px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:border-[var(--color-error-600)] hover:text-[#b42318] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset page
              </button>
              <button
                type="button"
                disabled={pending || !isDirty}
                onClick={save}
                className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-6 text-sm font-bold disabled:opacity-45"
              >
                {pending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="relative mt-5">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a field or some text…"
              aria-label="Find a field"
              className="admin-input pl-10"
            />
          </div>

          <div className="mt-6 flex flex-col gap-8">
            {sections.map(([section, fields]) => {
              const visible = fields.filter((f) => matches(f.key, f.label));
              if (visible.length === 0) return null;
              return (
                <section key={section} aria-label={section}>
                  <h3 className="mb-4 text-sm font-bold tracking-tight text-foreground">{section}</h3>
                  <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    {visible.map(({ key, label }) => {
                      const value = draft[key] ?? '';
                      const defaultValue = page.defaults[key] ?? '';
                      const changed = value.trim() !== '' && value !== defaultValue;
                      const long = defaultValue.length > 90 || value.length > 90 || LONG_KEY.test(key);
                      const id = `copy-${page.id}-${key}`;
                      return (
                        <div key={key} className={long ? 'sm:col-span-2' : ''}>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <label htmlFor={id} className="text-xs font-semibold text-foreground-secondary">
                              {label}
                              {changed ? (
                                <span className="ml-2 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent-ink)]">
                                  Edited
                                </span>
                              ) : null}
                            </label>
                            {changed ? (
                              <button
                                type="button"
                                onClick={() => setDraft((d) => ({ ...d, [key]: defaultValue }))}
                                className="tap cursor-pointer text-xs font-semibold text-foreground-muted hover:text-[var(--accent-ink)]"
                              >
                                Restore original
                              </button>
                            ) : null}
                          </div>
                          {long ? (
                            <textarea
                              id={id}
                              value={value}
                              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                              rows={Math.min(8, Math.max(3, Math.ceil(value.length / 90)))}
                              className="admin-input resize-y"
                            />
                          ) : (
                            <input
                              id={id}
                              value={value}
                              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                              className="admin-input"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            {q && sections.every(([, fields]) => fields.every((f) => !matches(f.key, f.label))) ? (
              <p className="text-sm text-foreground-muted">No fields match “{query}”.</p>
            ) : null}
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={confirmReset}
        onOpenChange={(open) => !pending && setConfirmReset(open)}
        title={`Reset ${page.label} to the original text?`}
        description="Every edit you have saved to this page is discarded and the page goes back to the wording it shipped with."
        confirmLabel="Reset page"
        pendingLabel="Resetting…"
        pending={pending}
        onConfirm={resetPage}
      />
      <AdminConfirmDialog
        open={pendingSwitch !== null}
        onOpenChange={(open) => !open && setPendingSwitch(null)}
        title="Discard unsaved changes?"
        description="You've edited this page without saving. Switching now discards those changes."
        confirmLabel="Discard"
        onConfirm={() => {
          if (pendingSwitch) openPage(pendingSwitch);
          setPendingSwitch(null);
        }}
      />
    </div>
  );
}
