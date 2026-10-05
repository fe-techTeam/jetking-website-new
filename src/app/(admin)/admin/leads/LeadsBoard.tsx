'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import { submitLead, moveLeadStatus, addNote, removeLead, getLeadTimeline } from './actions';
import type { Lead, LeadActivity } from '@/lib/db/schema';
import type { LeadStats, LeadStatus } from '@/lib/leads/store';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { FilterChip } from '../FilterChip';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'enrolled', 'lost'];
const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  enrolled: 'Enrolled',
  lost: 'Lost',
};
/** Status semantics, not the accent: "new" borrows the warning/amber token (needs
 *  attention), "enrolled" the success token — the blue accent stays reserved for
 *  interactive UI, never a status label. */
const STATUS_CLASS: Record<LeadStatus, string> = {
  new: 'text-[var(--color-signal-600)]',
  contacted: 'text-foreground-secondary',
  enrolled: 'text-growth-600',
  lost: 'text-foreground-muted',
};

/** The little dot beside each status label — colour carries meaning here, so it is never the accent. */
const STATUS_DOT: Record<LeadStatus, string> = {
  new: '#f79009',
  contacted: '#667085',
  enrolled: '#12b76a',
  lost: '#c4c9d4',
};

function emptyByStatus(): Record<LeadStatus, number> {
  return { new: 0, contacted: 0, enrolled: 0, lost: 0 };
}

function statsFrom(rows: Lead[]): LeadStats {
  const byStatus = emptyByStatus();
  for (const row of rows) {
    const status = row.status as LeadStatus;
    if (status in byStatus) byStatus[status] += 1;
  }
  return { total: rows.length, byStatus };
}

export function LeadsBoard({
  initialLeads,
  initialStats,
  initialStatusFilter,
}: {
  initialLeads: Lead[];
  initialStats: LeadStats;
  initialStatusFilter?: LeadStatus;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const [stats, setStats] = useState(initialStats);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>(initialStatusFilter ?? 'all');
  const [sourceFilter, setSourceFilter] = useState<string | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<LeadActivity[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const sources = Array.from(new Set(leads.map((l) => l.source))).sort();

  const query = search.trim().toLowerCase();
  const filteredLeads = leads.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
    if (!query) return true;
    return [l.name, l.courseInterest, l.city].some((f) => f?.toLowerCase().includes(query));
  });
  const filtersActive = statusFilter !== 'all' || sourceFilter !== 'all' || query.length > 0;

  function selectLead(id: string) {
    setSelectedId(id);
    setNoteDraft('');
    setMessage(null);
    setError(null);
    start(async () => {
      setTimeline(await getLeadTimeline(id));
    });
  }

  function changeStatus(id: string, status: LeadStatus) {
    start(async () => {
      const result = await moveLeadStatus(id, status);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLeads((prev) => {
        const next = prev.map((l) => (l.id === id ? result.lead : l));
        setStats(statsFrom(next));
        return next;
      });
      if (selectedId === id) setTimeline(await getLeadTimeline(id));
      setMessage(`Moved to ${STATUS_LABEL[status]}.`);
    });
  }

  function saveNote(id: string) {
    if (!noteDraft.trim()) return;
    start(async () => {
      const result = await addNote(id, noteDraft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNoteDraft('');
      setTimeline(await getLeadTimeline(id));
      setMessage('Note added.');
    });
  }

  function handleDelete(id: string, name: string) {
    setPendingDelete({ id, name });
  }

  function confirmDeleteLead() {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    start(async () => {
      await removeLead(id);
      setLeads((prev) => {
        const next = prev.filter((l) => l.id !== id);
        setStats(statsFrom(next));
        return next;
      });
      if (selectedId === id) setSelectedId(null);
      setMessage(`Deleted ${name}.`);
      setPendingDelete(null);
    });
  }

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setMessage(null);
    setError(null);
    start(async () => {
      const result = await submitLead(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLeads((prev) => {
        const next = [result.lead, ...prev];
        setStats(statsFrom(next));
        return next;
      });
      setMessage('Lead added.');
      setShowNew(false);
      formRef.current?.reset();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="adm-eyebrow">leads</p>
          <h1 className="adm-title mt-3">Leads</h1>
          <p className="adm-lede mt-3">
            Everything the chatbot, enquiry form, and centre staff bring in — one pipeline.
          </p>
        </div>
        <button
          type="button"
          className="adm-btn-primary font-bold inline-flex h-11 shrink-0 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm"
          onClick={() => setShowNew((v) => !v)}
        >
          {showNew ? 'Cancel' : '+ New lead'}
        </button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="adm-card p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Total
          </p>
          <p className="numeral mt-3 text-[1.875rem] leading-none font-extrabold tracking-[-0.03em] text-foreground">
            {stats.total}
          </p>
        </div>
        {STATUSES.map((s) => (
          <div key={s} className="adm-card p-4 sm:p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
              <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_DOT[s] }} />
              {STATUS_LABEL[s]}
            </p>
            <p className="numeral mt-3 text-[1.875rem] leading-none font-extrabold tracking-[-0.03em] text-foreground">
              {stats.byStatus[s]}
            </p>
          </div>
        ))}
      </div>

      {showNew ? (
        <form
          ref={formRef}
          onSubmit={handleCreate}
          className="mt-8 grid gap-4 adm-card p-5 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Name</span>
            <input name="name" required className="admin-input" placeholder="Full name" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Phone</span>
            <input name="phone" className="admin-input" placeholder="+91 …" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Email</span>
            <input name="email" type="email" className="admin-input" placeholder="name@example.com" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">City</span>
            <input name="city" className="admin-input" placeholder="Pune" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Course interest</span>
            <input name="courseInterest" className="admin-input" placeholder="CCNA" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Source</span>
            <select name="source" className="admin-input" defaultValue="form">
              <option value="form">Form</option>
              <option value="chatbot">Chatbot</option>
              <option value="centre">Centre</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Persona</span>
            <select name="persona" className="admin-input" defaultValue="">
              <option value="">—</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
              <option value="professional">Professional</option>
              <option value="franchise">Franchise</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="label-mono">Notes</span>
            <textarea name="notes" rows={2} className="admin-input resize-y" />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="adm-btn-primary font-bold inline-flex h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-6 text-sm disabled:opacity-45"
            >
              {pending ? 'Saving…' : 'Save lead'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 text-sm font-medium text-[var(--color-error-600)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p aria-live="polite" className="mt-6 text-sm text-growth-600">
          {message}
        </p>
      ) : null}

      <div role="group" aria-label="Leads view" className="mt-10 inline-flex rounded-[13px] bg-border-subtle p-1 ring-1 ring-border">
        {(['board', 'list'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`min-h-11 min-w-24 cursor-pointer rounded-[10px] px-4 text-sm font-bold capitalize transition-all focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] ${
              view === v
                ? 'bg-background text-foreground shadow-[0_1px_3px_rgb(14_20_36/0.12)]'
                : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, course, or city…"
            className="admin-input h-10 w-full max-w-xs"
            aria-label="Search leads"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
              All statuses
            </FilterChip>
            {STATUSES.map((s) => (
              <FilterChip
                key={s}
                active={statusFilter === s}
                onClick={() => setStatusFilter((prev) => (prev === s ? 'all' : s))}
              >
                {STATUS_LABEL[s]}
              </FilterChip>
            ))}
          </div>
          {sources.length > 1 ? (
            <div className="flex flex-wrap items-center gap-1.5 border-l border-border pl-3">
              <FilterChip active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')} capitalize>
                All sources
              </FilterChip>
              {sources.map((s) => (
                <FilterChip
                  key={s}
                  active={sourceFilter === s}
                  onClick={() => setSourceFilter((prev) => (prev === s ? 'all' : s))}
                  capitalize
                >
                  {s}
                </FilterChip>
              ))}
            </div>
          ) : null}
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setSourceFilter('all');
              }}
              className="cursor-pointer text-xs font-semibold text-foreground-muted hover:text-foreground"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        {filtersActive ? (
          <p className="label-mono">
            Showing {filteredLeads.length} of {leads.length} leads
          </p>
        ) : null}
      </div>

      {view === 'board' ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STATUSES.map((status) => (
            <div key={status} className="adm-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_DOT[status] }} />
                <span className="text-sm font-bold tracking-tight text-foreground">{STATUS_LABEL[status]}</span>
                <span className="numeral ml-auto rounded-full bg-surface px-2.5 py-0.5 text-xs font-bold text-foreground-secondary ring-1 ring-border">
                  {filteredLeads.filter((l) => l.status === status).length}
                </span>
              </div>
              <div className="flex flex-col gap-2 p-2.5">
                {filteredLeads
                  .filter((l) => l.status === status)
                  .map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-[12px] border border-border bg-background p-3 shadow-[0_1px_2px_rgb(14_20_36/0.04)] transition-[border-color,box-shadow] hover:border-border-medium hover:shadow-[0_6px_16px_-8px_rgb(14_20_36/0.22)]"
                    >
                      <button
                        type="button"
                        className="block min-h-11 w-full cursor-pointer text-left"
                        onClick={() => selectLead(lead.id)}
                      >
                        <span className="block text-sm font-semibold text-foreground">
                          {lead.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-foreground-muted">
                          {[lead.courseInterest, lead.city].filter(Boolean).join(' · ') || '—'}
                        </span>
                      </button>
                      <select
                        aria-label={`Move ${lead.name}`}
                        value={lead.status}
                        disabled={pending}
                        onChange={(e) => changeStatus(lead.id, e.target.value as LeadStatus)}
                        className="admin-input mt-2 py-0 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                {filteredLeads.filter((l) => l.status === status).length === 0 ? (
                  <p className="px-1 py-3 text-xs text-foreground-muted">No leads.</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto adm-card">
          <table className="adm-table w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {['Name', 'Course', 'City', 'Source', 'Status', 'Updated'].map((h) => (
                  <th key={h} className="label-mono px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer border-b border-border last:border-none hover:bg-surface"
                  onClick={() => selectLead(lead.id)}
                >
                  <td className="px-4 py-3 font-semibold text-foreground">{lead.name}</td>
                  <td className="px-4 py-3 text-foreground-secondary">{lead.courseInterest || '—'}</td>
                  <td className="px-4 py-3 text-foreground-secondary">{lead.city || '—'}</td>
                  <td className="px-4 py-3 text-foreground-secondary capitalize">{lead.source}</td>
                  <td className={`px-4 py-3 font-medium ${STATUS_CLASS[lead.status as LeadStatus]}`}>
                    {STATUS_LABEL[lead.status as LeadStatus]}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                    {new Date(lead.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-foreground-muted">
                    No leads match these filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div className="mt-10 adm-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-mono">{selected.source} · {selected.persona ?? 'no persona'}</p>
              <h2 className="mt-2 text-2xl">{selected.name}</h2>
            </div>
            <button
              type="button"
              className="cursor-pointer rounded-[var(--admin-radius)] border border-border px-3 py-1 text-xs font-semibold text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="label-mono">Phone</dt>
              <dd className="mt-1 font-mono text-foreground">
                {selected.phone ? (
                  <a href={`tel:${selected.phone}`} className="text-[var(--accent)] hover:underline">
                    {selected.phone}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="label-mono">Email</dt>
              <dd className="mt-1 font-mono text-foreground">
                {selected.email ? (
                  <a href={`mailto:${selected.email}`} className="text-[var(--accent)] hover:underline">
                    {selected.email}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="label-mono">Course</dt>
              <dd className="mt-1 text-foreground">{selected.courseInterest || '—'}</dd>
            </div>
            <div>
              <dt className="label-mono">City</dt>
              <dd className="mt-1 text-foreground">{selected.city || '—'}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="label-mono">Status</span>
            <select
              value={selected.status}
              disabled={pending}
              onChange={(e) => changeStatus(selected.id, e.target.value as LeadStatus)}
              className="admin-input h-9 w-auto"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={pending}
              className="ml-auto cursor-pointer rounded-[var(--admin-radius)] border border-border px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:border-[var(--color-error-600)] hover:text-[var(--color-error-600)] disabled:opacity-45"
              onClick={() => handleDelete(selected.id, selected.name)}
            >
              Delete lead
            </button>
          </div>

          <div className="mt-6">
            <p className="label-mono border-b border-border pb-2">Timeline</p>
            <ul className="mt-3 flex flex-col gap-2">
              {timeline.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 text-sm">
                  <span className="label-mono mt-0.5 shrink-0 capitalize text-foreground-muted">
                    {entry.kind.replace('_', ' ')}
                  </span>
                  <span className="text-foreground-secondary">{entry.body}</span>
                  <span className="ml-auto shrink-0 font-mono text-xs text-foreground-muted">
                    {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </li>
              ))}
              {timeline.length === 0 ? <li className="text-sm text-foreground-muted">No activity yet.</li> : null}
            </ul>

            <div className="mt-4 flex gap-3">
              <input
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a note…"
                className="admin-input flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveNote(selected.id);
                }}
              />
              <button
                type="button"
                disabled={pending || !noteDraft.trim()}
                onClick={() => saveNote(selected.id)}
                className="cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-45"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete lead"
        description={
          <>
            Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This
            cannot be undone.
          </>
        }
        pending={pending}
        onConfirm={confirmDeleteLead}
      />
    </div>
  );
}
