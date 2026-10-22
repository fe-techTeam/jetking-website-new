'use client';

import { useMemo, useState, useTransition } from 'react';
import { ArrowLeft, Eye, EyeOff, Pencil, RotateCcw, Save, Search } from 'lucide-react';
import { saveCollectionItem, removeCollectionItem } from '../actions';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { MediaPickerButton } from '../MediaPicker';
import { isSectionVisibilityKey, listSectionToggles } from '@/lib/content/copy/sections';

export interface EditablePage {
  id: string;
  label: string;
  path?: string;
  group: string;
  description?: string;
  defaults: Record<string, string>;
}

type Overrides = Record<string, Record<string, string>>;

const SEGMENT_LABELS: Record<string, string> = {
  seo: 'SEO & sharing',
  cta: 'Call to action',
  faq: 'FAQ',
  ogImage: 'Share image',
  contact: 'Contact numbers',
  mobileBar: 'Mobile sticky bar',
};

/** Full-key labels when the dotted path alone is unclear for editors. */
const FIELD_LABELS: Record<string, string> = {
  'contact.phone': 'Toll-free Call number (sticky Call buttons & footer)',
  'contact.whatsapp': 'WhatsApp number (sticky WhatsApp buttons)',
  'contact.email': 'Email',
  'contact.address': 'Head office address',
};

function humanizeSegment(segment: string): string {
  if (/^\d+$/.test(segment)) return `Item ${Number(segment) + 1}`;
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  const spaced = segment.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** `hero.cta.href` → section "Hero", field "Call to action › Href". Single-segment keys sit under "General". */
function describeKey(key: string): { section: string; label: string } {
  if (FIELD_LABELS[key]) {
    const parts = key.split('.');
    return { section: humanizeSegment(parts[0]!), label: FIELD_LABELS[key]! };
  }
  const parts = key.split('.');
  if (parts.length === 1) return { section: 'General', label: humanizeSegment(parts[0]!) };
  const [first, ...rest] = parts;
  return { section: humanizeSegment(first!), label: rest.map(humanizeSegment).join(' › ') };
}

/** Copy keys that hold an image path: `hero.image`, `seo.ogImage`, `affiliation.0.logo`… */
const IMAGE_KEY = /(^|\.)(image|photo|logo|avatar|poster|src|ogImage)$/i;

/** A value that is itself an image file path (`/home/centre-exterior.jpg`), whatever its key is called. */
const IMAGE_VALUE = /^(\/|https?:\/\/)\S+\.(jpe?g|png|webp|avif|gif|svg)(\?\S*)?$/i;
const isImageField = (key: string, defaultValue: string) => IMAGE_KEY.test(key) || IMAGE_VALUE.test(defaultValue.trim());

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
  const [confirmSave, setConfirmSave] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<string | null>(null);
  /** Opens on the list of pages; choosing one opens its own full-width page. */
  const [view, setView] = useState<'list' | 'edit'>('list');

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

  const sectionToggles = useMemo(() => listSectionToggles(page.defaults), [page]);

  const sections = useMemo(() => {
    const map = new Map<string, Array<{ key: string; label: string }>>();
    for (const key of Object.keys(page.defaults)) {
      // Visibility flags have their own toggle panel — keep them out of the text fields.
      if (isSectionVisibilityKey(key)) continue;
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
    setView('edit');
    document.getElementById('admin-content')?.scrollTo({ top: 0 });
    setDraft({ ...next.defaults, ...(overrides[id] ?? {}) });
    setMessage(null);
    setError(null);
    setQuery('');
  }

  function requestSwitch(id: string) {
    if (id === page.id && view === 'edit') return;
    if (isDirty) setPendingSwitch(id);
    else openPage(id);
  }

  /** Back to the list of pages; unsaved edits ask first. */
  function goList() {
    if (isDirty) {
      setPendingSwitch('__list__');
      return;
    }
    setView('list');
    document.getElementById('admin-content')?.scrollTo({ top: 0 });
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

  // Find a page by its name or by any wording on it — handy when you remember a sentence, not which page it is on.
  const [pageQuery, setPageQuery] = useState('');
  const pq = pageQuery.trim().toLowerCase();
  const listedPages = pq
    ? pages.filter(
        (p) =>
          p.label.toLowerCase().includes(pq) ||
          Object.values({ ...p.defaults, ...(overrides[p.id] ?? {}) }).some((v) => v.toLowerCase().includes(pq)),
      )
    : pages;
  const groups = [...new Set(listedPages.map((p) => p.group))];
  const fieldCount = Object.keys(page.defaults).length;
  const editedCount = Object.keys(nextEntries).length;

  return (
    <div className="mt-6">
      {/* ── Page list ─────────────────────────────────────────────────── */}
      {view === 'list' ? (
        <div>
          <input
            value={pageQuery}
            onChange={(e) => setPageQuery(e.target.value)}
            placeholder="Search pages and wording…"
            aria-label="Search pages"
            className="admin-input h-11 w-full text-sm sm:max-w-sm"
          />
          {listedPages.length === 0 ? <p className="mt-8 text-center text-sm text-foreground-muted">No page has that wording.</p> : null}
          {groups.map((group) => (
            <section key={group} className="mt-6" aria-label={group}>
              <h2 className="text-xs font-bold tracking-wide text-foreground-muted uppercase">{group}</h2>
              <ul className="adm-card mt-2 divide-y divide-border overflow-hidden">
                {listedPages
                  .filter((p) => p.group === group)
                  .map((p) => {
                    const edits = Object.keys(overrides[p.id] ?? {}).length;
                    return (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-surface/60">
                        <button type="button" onClick={() => requestSwitch(p.id)} className="min-w-0 flex-1 cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]">
                          <span className="block text-[15px] font-semibold text-foreground">{p.label}</span>
                          <span className="block truncate text-xs text-foreground-muted">
                            {p.description ?? `${Object.keys(p.defaults).length} fields`}
                            {p.path ? ` · ${p.path}` : ''}
                          </span>
                        </button>
                        {edits > 0 ? (
                          <span className="numeral shrink-0 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-xs font-bold text-[var(--accent-ink)]">{edits} edited</span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => requestSwitch(p.id)}
                          className="min-h-10 shrink-0 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-xs font-bold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
                        >
                          <Pencil aria-hidden="true" className="mr-1.5 inline h-3.5 w-3.5" />Edit text
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {/* ── Fields ────────────────────────────────────────────────────── */}
      {view === 'edit' ? (
      <div className="min-w-0">
        <button type="button" onClick={goList} className="mb-3 inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground-secondary hover:text-[var(--accent-ink)]">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All pages
        </button>
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
                <RotateCcw aria-hidden="true" className="mr-2 inline h-4 w-4" />Reset page
              </button>
              <button
                type="button"
                disabled={pending || !isDirty}
                onClick={() => setConfirmSave(true)}
                className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-6 text-sm font-bold disabled:opacity-45"
              >
                <Save aria-hidden="true" className="mr-2 inline h-4 w-4" />{pending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {sectionToggles.length > 0 ? (
            <section
              aria-label="Show or hide sections"
              className="mt-6 rounded-[var(--admin-radius)] border border-border bg-surface/50 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
                    <Eye aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />
                    Show or hide sections
                  </h3>
                  <p className="mt-1 text-xs text-foreground-muted">
                    Turn a block off to remove it from the live page. Its wording stays below so you can edit it while it is hidden.
                  </p>
                </div>
                <p className="text-xs font-semibold text-foreground-muted">
                  {sectionToggles.filter((t) => (draft[t.key] ?? 'true').toLowerCase() !== 'false').length} of{' '}
                  {sectionToggles.length} visible
                </p>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {sectionToggles.map(({ id, key, label }) => {
                  const on = (draft[key] ?? 'true').trim().toLowerCase() !== 'false';
                  const changed = (draft[key] ?? '') !== (page.defaults[key] ?? 'true');
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={`${label}: ${on ? 'shown' : 'hidden'}`}
                        onClick={() => setDraft((d) => ({ ...d, [key]: on ? 'false' : 'true' }))}
                        className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--admin-radius)] border px-3.5 text-left transition-colors ${
                          on
                            ? 'border-border bg-background hover:border-[var(--accent)]'
                            : 'border-dashed border-border-medium bg-surface/80 text-foreground-muted'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground">{label}</span>
                          {changed ? (
                            <span className="mt-0.5 inline-block rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent-ink)]">
                              Edited
                            </span>
                          ) : null}
                        </span>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            on ? 'bg-[#ecfdf3] text-[#067647]' : 'bg-[var(--color-error-50)] text-[#b42318]'
                          }`}
                        >
                          {on ? <Eye aria-hidden="true" className="h-3.5 w-3.5" /> : <EyeOff aria-hidden="true" className="h-3.5 w-3.5" />}
                          {on ? 'Shown' : 'Hidden'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <div className="relative mt-5">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a field or some text…"
              aria-label="Find a field"
              style={{ paddingLeft: 40 }}
              className="admin-input"
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
                      // Anything longer than a short label gets the full width — a half-width box hides the text it is for.
                      const wide = long || defaultValue.length > 26 || value.length > 26 || isImageField(key, defaultValue);
                      const id = `copy-${page.id}-${key}`;
                      return (
                        <div key={key} className={wide ? 'sm:col-span-2' : ''}>
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
                          {isImageField(key, defaultValue) ? (
                            <div className="flex items-start gap-3">
                              {value ? (
                                // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary path
                                <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-md border border-border bg-surface object-contain" />
                              ) : null}
                              <input
                                id={id}
                                value={value}
                                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                                placeholder="/path/to/image or https://…"
                                className="admin-input min-w-0 flex-1"
                              />
                              <MediaPickerButton onPick={(item) => setDraft((d) => ({ ...d, [key]: item.url }))} />
                            </div>
                          ) : long ? (
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
      ) : null}

      <AdminConfirmDialog
        open={confirmSave}
        onOpenChange={(open) => !pending && setConfirmSave(open)}
        title="Publish these text changes?"
        description="The new wording and images go live on the website straight away."
        confirmLabel="Publish"
        pendingLabel="Saving…"
        tone="default"
        pending={pending}
        onConfirm={() => {
          setConfirmSave(false);
          save();
        }}
      />
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
          if (pendingSwitch === '__list__') {
            setDraft({ ...page.defaults, ...saved });
            setView('list');
          } else if (pendingSwitch) openPage(pendingSwitch);
          setPendingSwitch(null);
        }}
      />
    </div>
  );
}
