'use client';

import { useState, useTransition } from 'react';
import { saveCollectionItem, removeCollectionItem } from './actions';
import type { CmsCollection } from '@/lib/cms/types';
import { ADMIN_FORM_CONFIG } from '@/lib/cms/admin-form-config';
import { ValueEditor, humanize } from './ValueEditor';
import { AdminConfirmDialog } from './AdminConfirmDialog';
import { AdminPageHeader } from './AdminPageHeader';
import { WebsiteUsage } from './WebsiteUsage';
import type { AppearsOn } from './registry';

function StatusBadge({ status }: { status: string }) {
  const published = status === 'published';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
        published ? 'bg-[var(--color-growth-50)] text-[#067647]' : 'bg-[var(--color-signal-50)] text-[#b54708]'
      }`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {published ? 'Published' : status === 'draft' ? 'Draft' : status}
    </span>
  );
}

type Rec = Record<string, unknown>;
type PendingSwitch = { kind: 'record'; item: Rec } | { kind: 'new' };

export function RecordEditor({
  collection,
  idKey,
  initial,
  title,
  description = 'Edit as a form and save — no JSON required.',
  live = true,
  appearsOn = [],
  note,
}: {
  collection: CmsCollection;
  idKey: string;
  initial: unknown[];
  title: string;
  description?: string;
  /** False when the website does not render this collection — the strip below the heading says so. */
  live?: boolean;
  appearsOn?: AppearsOn[];
  note?: string;
}) {
  // Looked up here rather than passed as a prop: a Server Component page can't
  // hand a Client Component a config object whose `blank` field is a function —
  // React Server Components can only serialize plain data across that boundary.
  const config = ADMIN_FORM_CONFIG[collection];
  const initialRecords = initial as Rec[];
  const firstRecord = initialRecords[0];
  const firstDraft = { ...config.blank(), ...(firstRecord ?? {}) };

  const [items, setItems] = useState<Rec[]>(initialRecords);
  const [draft, setDraft] = useState<Rec>(firstDraft);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(firstDraft));
  const [originalId, setOriginalId] = useState<string | undefined>(
    firstRecord ? String(firstRecord[idKey]) : undefined,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null);
  const [search, setSearch] = useState('');

  const isDirty = JSON.stringify(draft) !== savedSnapshot;
  const query = search.trim().toLowerCase();
  const visibleItems = query ? items.filter((item) => String(item[idKey]).toLowerCase().includes(query)) : items;

  function confirmDelete(id: string) {
    start(async () => {
      await removeCollectionItem(collection, idKey, id);
      setItems((prev) => prev.filter((p) => p[idKey] !== id));
      if (originalId === id) applyNew();
      setMessage(`Deleted ${id}.`);
      setPendingDeleteId(null);
    });
  }

  const published = draft.status === 'published';
  const fieldKeys = Object.keys(draft).filter((k) => k !== 'status');

  const sections = config.sections
    ? [
        ...config.sections.map((s) => ({
          title: s.title,
          fields: s.fields.filter((f) => fieldKeys.includes(f)),
        })),
        {
          title: 'More',
          fields: fieldKeys.filter((f) => !config.sections!.some((s) => s.fields.includes(f))),
        },
      ].filter((s) => s.fields.length > 0)
    : [{ title: null, fields: fieldKeys }];

  function applyRecord(item: Rec) {
    const next = { ...config.blank(), ...item };
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    setOriginalId(String(item[idKey]));
    setMessage(null);
    setError(null);
  }

  function applyNew() {
    const next = config.blank();
    setDraft(next);
    setSavedSnapshot(JSON.stringify(next));
    setOriginalId(undefined);
    setMessage(null);
    setError(null);
  }

  function loadRecord(item: Rec) {
    if (isDirty) {
      setPendingSwitch({ kind: 'record', item });
      return;
    }
    applyRecord(item);
  }

  function startNew() {
    if (isDirty) {
      setPendingSwitch({ kind: 'new' });
      return;
    }
    applyNew();
  }

  function confirmSwitch() {
    if (!pendingSwitch) return;
    if (pendingSwitch.kind === 'record') applyRecord(pendingSwitch.item);
    else applyNew();
    setPendingSwitch(null);
  }

  function save() {
    start(async () => {
      setMessage(null);
      setError(null);
      const result = await saveCollectionItem(collection, idKey, JSON.stringify(draft), originalId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) => {
        const next = [...prev];
        const renamedFromIdx =
          originalId !== undefined ? next.findIndex((p) => p[idKey] === originalId) : -1;
        if (renamedFromIdx >= 0) {
          next[renamedFromIdx] = draft;
          return next;
        }
        const idx = next.findIndex((p) => p[idKey] === draft[idKey]);
        if (idx >= 0) next[idx] = draft;
        else next.push(draft);
        return next;
      });
      setOriginalId(String(draft[idKey]));
      setSavedSnapshot(JSON.stringify(draft));
      setMessage('Saved. Revalidation and Guide re-ingest hooks fired.');
    });
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow={collection.replace(/_/g, ' ')}
        title={title}
        description={description}
      />

      <WebsiteUsage live={live} appearsOn={appearsOn} note={note} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:items-start">
        {/* ── Record list ─────────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="adm-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 border-b border-border bg-surface/70 px-4 py-3.5">
              <h2 className="text-sm font-bold tracking-tight text-foreground">Records</h2>
              <span className="numeral rounded-full bg-background px-2.5 py-0.5 text-xs font-bold text-foreground-secondary ring-1 ring-border">
                {query ? `${visibleItems.length} / ${items.length}` : items.length}
              </span>
            </div>

            {items.length > 8 ? (
              <div className="border-b border-border p-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search records…"
                  aria-label="Search records"
                  className="admin-input h-9 text-sm"
                />
              </div>
            ) : null}

            <ul className="max-h-[34rem] overflow-auto">
              {visibleItems.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-foreground-muted">
                  {query ? 'No records match your search.' : 'No records yet — add one below.'}
                </li>
              ) : null}
              {visibleItems.map((item, i) => {
                const id = String(item[idKey] ?? i);
                const status = String(item.status ?? 'unknown');
                const isActive = originalId === id;

                return (
                  <li
                    key={id}
                    className={`relative flex items-center gap-2 border-b border-border px-3 transition-colors last:border-none ${
                      isActive ? 'bg-[var(--accent-soft)]' : 'hover:bg-surface/70'
                    }`}
                  >
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r-full bg-[var(--accent)]"
                      />
                    ) : null}
                    <button
                      type="button"
                      aria-current={isActive ? 'true' : undefined}
                      className="min-w-0 flex-1 cursor-pointer py-3 text-left focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                      onClick={() => loadRecord(item)}
                    >
                      <span
                        className={`block text-sm leading-snug break-words ${isActive ? 'font-bold text-[var(--accent-ink)]' : 'font-medium text-foreground'}`}
                      >
                        {id}
                      </span>
                      <span className="mt-1 block">
                        <StatusBadge status={status} />
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={pending}
                      aria-label={`Delete ${id}`}
                      className="min-h-11 shrink-0 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3.5 text-xs font-semibold text-foreground-muted transition-colors hover:border-[var(--color-error-600)] hover:bg-[var(--color-error-50)] hover:text-[#b42318] disabled:opacity-45"
                      onClick={() => setPendingDeleteId(id)}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            type="button"
            onClick={startNew}
            className="mt-3 min-h-11 w-full cursor-pointer rounded-[12px] border border-dashed border-border-medium bg-background px-4 text-sm font-bold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
          >
            + New record
          </button>
        </div>

        {/* ── Form ────────────────────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="adm-card p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <button
                type="button"
                role="switch"
                aria-checked={published}
                onClick={() => setDraft((prev) => ({ ...prev, status: published ? 'draft' : 'published' }))}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[12px] pr-2 text-sm font-bold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                <span
                  aria-hidden="true"
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                    published ? 'bg-growth-600' : 'bg-border-medium'
                  }`}
                >
                  <span
                    className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${
                      published ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </span>
                {published ? 'Published' : 'Draft'}
              </button>

              <div className="flex items-center gap-3">
                {error ? (
                  <p role="alert" className="text-sm font-medium text-[var(--color-error-600)]">
                    {error}
                  </p>
                ) : null}
                {message ? (
                  <p aria-live="polite" className="text-sm text-growth-600">
                    {message}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={pending}
                  onClick={save}
                  className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-6 text-sm font-bold disabled:opacity-45"
                >
                  {pending ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-6">
              {sections.map((section, i) => (
                <div key={section.title ?? 'flat'} className={i > 0 ? 'border-t border-border pt-6' : ''}>
                  {section.title ? (
                    <h3 className="mb-4 text-sm font-bold tracking-tight text-foreground">{section.title}</h3>
                  ) : null}
                  <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                    {section.fields.map((key) => {
                      const value = draft[key];
                      const isWide = Array.isArray(value) || (typeof value === 'object' && value !== null);
                      return (
                        <div key={key} className={isWide ? 'sm:col-span-2' : ''}>
                          <label className="mb-1.5 block text-xs font-semibold text-foreground-secondary">
                            {config.selectFields?.[key]?.label ?? humanize(key)}
                          </label>
                          <ValueEditor
                            fieldKey={key}
                            value={value}
                            config={config}
                            onChange={(next) => setDraft((prev) => ({ ...prev, [key]: next }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sticks to the bottom of the viewport on a long form, so Save is
             never more than one glance away without scrolling back to the top. */}
          <div className="adm-card sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 !bg-background/90 px-4 py-3 shadow-[var(--adm-shadow-lift)] backdrop-blur-md">
            <span
              className={`inline-flex items-center gap-2 text-sm font-semibold ${isDirty ? 'text-[#b54708]' : 'text-foreground-muted'}`}
            >
              <span aria-hidden="true" className="adm-dot" />
              {isDirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={save}
              className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm font-bold disabled:opacity-45"
            >
              {pending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <AdminConfirmDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
        title="Delete record"
        description={
          <>
            Delete <span className="font-semibold text-foreground">{pendingDeleteId}</span> from{' '}
            {collection}? This cannot be undone.
          </>
        }
        pending={pending}
        onConfirm={() => pendingDeleteId && confirmDelete(pendingDeleteId)}
      />

      <AdminConfirmDialog
        open={pendingSwitch !== null}
        onOpenChange={(open) => !open && setPendingSwitch(null)}
        title="Discard unsaved changes?"
        description="You've edited this record without saving. Switching now discards those changes."
        confirmLabel="Discard"
        onConfirm={confirmSwitch}
      />
    </div>
  );
}
