'use client';

import { useMemo, useRef, useState, useTransition, type FormEvent } from 'react';
import { submitLead, moveLeadStatus, addNote, removeLead, getLeadTimeline } from './actions';
import type { Lead, LeadActivity } from '@/lib/db/schema';
import type { LeadStatus } from '@/lib/leads/store';
import { AdminConfirmDialog } from '../AdminConfirmDialog';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'enrolled', 'lost'];
const STATUS_LABEL: Record<LeadStatus, string> = { new: 'New', contacted: 'Contacted', enrolled: 'Enrolled', lost: 'Lost' };
/** Colour carries the meaning here (amber = needs a call, green = won) — never the brand accent. */
const STATUS_STYLE: Record<LeadStatus, { dot: string; pill: string }> = {
  new: { dot: '#f79009', pill: 'bg-[var(--color-signal-50)] text-[#b54708]' },
  contacted: { dot: '#667085', pill: 'bg-surface text-foreground-secondary ring-1 ring-border' },
  enrolled: { dot: '#12b76a', pill: 'bg-[var(--color-growth-50)] text-[#067647]' },
  lost: { dot: '#c4c9d4', pill: 'bg-surface text-foreground-muted ring-1 ring-border' },
};
const SOURCE_LABEL: Record<string, string> = { form: 'Website form', chatbot: 'Chatbot', centre: 'Centre', franchise: 'Franchise' };
const PAGE_SIZE = 25;

type SortKey = 'createdAt' | 'name' | 'status';
type Range = 'all' | 'today' | '7' | '30';

const when = (d: Date | string) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function statsFrom(rows: Lead[]): { total: number; byStatus: Record<LeadStatus, number> } {
  const byStatus = { new: 0, contacted: 0, enrolled: 0, lost: 0 };
  for (const row of rows) if (row.status in byStatus) byStatus[row.status as LeadStatus] += 1;
  return { total: rows.length, byStatus };
}

/** Spreadsheet formulas typed into a name or message must not run when the file is opened. */
const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

/** The status select, styled as the pill — changing it saves straight away. */
function StatusSelect({ lead, onChange, disabled }: { lead: Lead; onChange: (s: LeadStatus) => void; disabled: boolean }) {
  const s = lead.status as LeadStatus;
  return (
    <select
      aria-label={`Status of ${lead.name}`}
      value={s}
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as LeadStatus)}
      className={`h-9 cursor-pointer rounded-full border-0 px-3 text-xs font-bold focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 ${STATUS_STYLE[s].pill}`}
    >
      {STATUSES.map((x) => (
        <option key={x} value={x}>
          {STATUS_LABEL[x]}
        </option>
      ))}
    </select>
  );
}

export function LeadsBoard({
  initialLeads,
  initialStatusFilter,
}: {
  initialLeads: Lead[];
  initialStatusFilter?: LeadStatus;
}) {
  const [leads, setLeads] = useState(initialLeads);
  const stats = useMemo(() => statsFrom(leads), [leads]);
  // "Today / last 7 days" are measured from when the page was opened.
  const [now] = useState(() => Date.now());
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<LeadActivity[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>(initialStatusFilter ?? 'all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [range, setRange] = useState<Range>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [pageIndex, setPageIndex] = useState(0);
  const [checked, setChecked] = useState<string[]>([]);

  const [showNew, setShowNew] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selected = leads.find((l) => l.id === selectedId) ?? null;
  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source))).sort(), [leads]);
  const cities = useMemo(() => Array.from(new Set(leads.map((l) => l.city).filter((c): c is string => Boolean(c)))).sort(), [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const since = range === 'all' ? 0 : range === 'today' ? new Date(now).setHours(0, 0, 0, 0) : now - Number(range) * 86_400_000;
    const rows = leads.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (cityFilter !== 'all' && l.city !== cityFilter) return false;
      if (since && new Date(l.createdAt).getTime() < since) return false;
      if (!q) return true;
      return [l.name, l.courseInterest, l.city, l.phone, l.email, l.centreName, l.message].some((f) => f?.toLowerCase().includes(q));
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
      if (sort.key === 'status') return (STATUSES.indexOf(a.status as LeadStatus) - STATUSES.indexOf(b.status as LeadStatus)) * dir;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });
  }, [leads, search, statusFilter, sourceFilter, cityFilter, range, sort, now]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);
  const filtersActive = statusFilter !== 'all' || sourceFilter !== 'all' || cityFilter !== 'all' || range !== 'all' || search.trim() !== '';
  const allOnPage = pageRows.length > 0 && pageRows.every((l) => checked.includes(l.id));

  function clearFilters() {
    setSearch('');
    setStatusFilter('all');
    setSourceFilter('all');
    setCityFilter('all');
    setRange('all');
    setPageIndex(0);
  }

  function sortBy(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }));
  }
  const arrow = (key: SortKey) => (sort.key === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : '');

  function openLead(id: string) {
    setSelectedId(id);
    setNoteDraft('');
    setMessage(null);
    setError(null);
    setView('detail');
    document.getElementById('admin-content')?.scrollTo({ top: 0 });
    start(async () => setTimeline(await getLeadTimeline(id)));
  }

  function changeStatus(id: string, status: LeadStatus) {
    setError(null);
    start(async () => {
      const result = await moveLeadStatus(id, status);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setLeads((prev) => prev.map((l) => (l.id === id ? result.lead : l)));
      if (selectedId === id) setTimeline(await getLeadTimeline(id));
      setMessage(`Moved to ${STATUS_LABEL[status]}.`);
    });
  }

  function bulkStatus(status: LeadStatus) {
    const ids = checked;
    start(async () => {
      for (const id of ids) {
        const result = await moveLeadStatus(id, status);
        if (result.ok) setLeads((prev) => prev.map((l) => (l.id === id ? result.lead : l)));
      }
      setChecked([]);
      setMessage(`Moved ${ids.length} lead${ids.length === 1 ? '' : 's'} to ${STATUS_LABEL[status]}.`);
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

  function confirmDeleteLead() {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    start(async () => {
      await removeLead(id);
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setChecked((c) => c.filter((x) => x !== id));
      if (selectedId === id) {
        setSelectedId(null);
        setView('list');
      }
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
      setLeads((prev) => [result.lead, ...prev]);
      setMessage('Lead added.');
      setShowNew(false);
      formRef.current?.reset();
    });
  }

  function exportCsv() {
    const head = ['Received', 'Name', 'Phone', 'Email', 'Course', 'City', 'State', 'Centre', 'Qualification', 'Source', 'Form', 'Status', 'Campaign', 'Message'];
    const rows = filtered.map((l) => [
      new Date(l.createdAt).toISOString(), l.name, l.phone, l.email, l.courseInterest, l.city, l.state, l.centreName, l.qualification,
      SOURCE_LABEL[l.source] ?? l.source, l.form, STATUS_LABEL[l.status as LeadStatus] ?? l.status,
      [l.utmSource, l.utmMedium, l.utmCampaign].filter(Boolean).join(' / '), l.message,
    ]);
    const csv = '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `jetking-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const banner = (
    <>
      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-[var(--color-error-600)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p aria-live="polite" className="mt-4 text-sm font-medium text-growth-600">
          {message}
        </p>
      ) : null}
    </>
  );

  return (
    <div className="mx-auto max-w-7xl">
      {view === 'list' ? (
        <>
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="adm-eyebrow">Leads</p>
              <h1 className="adm-title mt-3">Leads</h1>
              <p className="adm-lede mt-3">Every enquiry from the website, the chatbot and your centres, in one list.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={exportCsv} disabled={filtered.length === 0} className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)] disabled:opacity-45">
                Export CSV
              </button>
              <button type="button" onClick={() => setShowNew((v) => !v)} className="adm-btn-primary min-h-11 cursor-pointer rounded-[var(--admin-radius)] px-5 text-sm font-bold">
                {showNew ? 'Cancel' : '+ New lead'}
              </button>
            </div>
          </header>

          {/* Status tiles double as filters. */}
          <div className="-mx-4 mt-6 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:px-0" role="group" aria-label="Filter by status">
            {(['all', ...STATUSES] as const).map((s) => {
              const count = s === 'all' ? stats.total : stats.byStatus[s];
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setStatusFilter(s);
                    setPageIndex(0);
                  }}
                  className={`adm-card min-w-[7.5rem] shrink-0 cursor-pointer p-3 text-left transition-shadow sm:min-w-0 sm:p-4 ${active ? 'ring-2 ring-[var(--accent)]' : 'hover:shadow-[var(--adm-shadow-lift)]'}`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
                    <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: s === 'all' ? 'var(--accent)' : STATUS_STYLE[s].dot }} />
                    {s === 'all' ? 'All leads' : STATUS_LABEL[s]}
                  </span>
                  <span className="numeral mt-1.5 block text-2xl leading-none font-extrabold tracking-[-0.03em] text-foreground sm:mt-2 sm:text-[1.75rem]">{count}</span>
                </button>
              );
            })}
          </div>

          {showNew ? (
            <form ref={formRef} onSubmit={handleCreate} className="adm-card mt-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm"><span className="label-mono">Name *</span><input name="name" required className="admin-input" placeholder="Full name" /></label>
              <label className="flex flex-col gap-1.5 text-sm"><span className="label-mono">Phone</span><input name="phone" type="tel" className="admin-input" placeholder="+91 …" /></label>
              <label className="flex flex-col gap-1.5 text-sm"><span className="label-mono">Email</span><input name="email" type="email" className="admin-input" placeholder="name@example.com" /></label>
              <label className="flex flex-col gap-1.5 text-sm"><span className="label-mono">City</span><input name="city" className="admin-input" placeholder="Pune" /></label>
              <label className="flex flex-col gap-1.5 text-sm"><span className="label-mono">Course interest</span><input name="courseInterest" className="admin-input" placeholder="BCA" /></label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="label-mono">Source</span>
                <select name="source" className="admin-input" defaultValue="form">
                  <option value="form">Website form</option>
                  <option value="chatbot">Chatbot</option>
                  <option value="centre">Centre (walk-in / phone)</option>
                  <option value="franchise">Franchise</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2 lg:col-span-3"><span className="label-mono">Notes</span><textarea name="notes" rows={2} className="admin-input resize-y" /></label>
              <div className="sm:col-span-2 lg:col-span-3">
                <button type="submit" disabled={pending} className="adm-btn-primary min-h-11 cursor-pointer rounded-[var(--admin-radius)] px-6 text-sm font-bold disabled:opacity-45">
                  {pending ? 'Saving…' : 'Save lead'}
                </button>
              </div>
            </form>
          ) : null}

          {banner}

          {/* Filters */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageIndex(0);
              }}
              placeholder="Search name, phone, email, course, city…"
              aria-label="Search leads"
              className="admin-input h-11 w-full text-sm lg:max-w-sm"
            />
            <select aria-label="Source" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPageIndex(0); }} style={{ width: "auto" }} className="admin-input h-11 text-sm">
              <option value="all">All sources</option>
              {sources.map((s) => (<option key={s} value={s}>{SOURCE_LABEL[s] ?? s}</option>))}
            </select>
            <select aria-label="City" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setPageIndex(0); }} style={{ width: "auto" }} className="admin-input h-11 text-sm">
              <option value="all">All cities</option>
              {cities.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <select aria-label="Received" value={range} onChange={(e) => { setRange(e.target.value as Range); setPageIndex(0); }} style={{ width: "auto" }} className="admin-input h-11 text-sm">
              <option value="all">Any time</option>
              <option value="today">Today</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
            {filtersActive ? (
              <button type="button" onClick={clearFilters} className="min-h-11 cursor-pointer px-2 text-sm font-semibold text-[var(--accent-ink)] hover:underline">
                Clear filters
              </button>
            ) : null}
            <span className="ml-auto text-xs text-foreground-muted">
              {filtered.length} of {leads.length} lead{leads.length === 1 ? '' : 's'}
            </span>
          </div>

          {checked.length > 0 ? (
            <div className="adm-card mt-3 flex flex-wrap items-center gap-3 px-4 py-2.5" role="region" aria-label="Bulk actions">
              <span className="text-sm font-semibold text-foreground">{checked.length} selected</span>
              <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                Move to
                <select
                  aria-label="Move selected leads to"
                  defaultValue=""
                  disabled={pending}
                  onChange={(e) => e.target.value && bulkStatus(e.target.value as LeadStatus)}
                  style={{ width: "auto" }} className="admin-input h-9 text-sm"
                >
                  <option value="" disabled>Choose status…</option>
                  {STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
                </select>
              </label>
              <button type="button" onClick={() => setChecked([])} className="ml-auto cursor-pointer text-sm font-semibold text-foreground-muted hover:text-foreground">Clear selection</button>
            </div>
          ) : null}

          {/* Table (tablet and up) */}
          <div className="adm-card mt-4 hidden overflow-hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
                <thead className="border-b border-border bg-surface/70 text-xs font-bold tracking-wide text-foreground-muted uppercase">
                  <tr>
                    <th scope="col" className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label="Select all leads on this page"
                        checked={allOnPage}
                        onChange={(e) => setChecked(e.target.checked ? Array.from(new Set([...checked, ...pageRows.map((l) => l.id)])) : checked.filter((id) => !pageRows.some((l) => l.id === id)))}
                        className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                      />
                    </th>
                    <th scope="col" className="px-3 py-3" aria-sort={sort.key === 'name' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" onClick={() => sortBy('name')} className="cursor-pointer font-bold uppercase hover:text-foreground">Lead{arrow('name')}</button>
                    </th>
                    <th scope="col" className="px-3 py-3">Interested in</th>
                    <th scope="col" className="px-3 py-3">Source</th>
                    <th scope="col" className="px-3 py-3" aria-sort={sort.key === 'status' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" onClick={() => sortBy('status')} className="cursor-pointer font-bold uppercase hover:text-foreground">Status{arrow('status')}</button>
                    </th>
                    <th scope="col" className="px-3 py-3" aria-sort={sort.key === 'createdAt' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" onClick={() => sortBy('createdAt')} className="cursor-pointer font-bold uppercase hover:text-foreground">Received{arrow('createdAt')}</button>
                    </th>
                    <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Call</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.map((l) => (
                    <tr key={l.id} onClick={() => openLead(l.id)} className="cursor-pointer transition-colors hover:bg-surface/60">
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select ${l.name}`} checked={checked.includes(l.id)} onChange={(e) => setChecked(e.target.checked ? [...checked, l.id] : checked.filter((id) => id !== l.id))} className="h-4 w-4 cursor-pointer accent-[var(--accent)]" />
                      </td>
                      <td className="max-w-[16rem] px-3 py-3">
                        <button type="button" onClick={(e) => { e.stopPropagation(); openLead(l.id); }} className="block max-w-full cursor-pointer truncate text-left font-semibold text-foreground hover:text-[var(--accent-ink)]">{l.name}</button>
                        <span className="block truncate text-xs text-foreground-muted">{[l.phone, l.email].filter(Boolean).join(' · ') || '—'}</span>
                      </td>
                      <td className="max-w-[16rem] px-3 py-3 text-foreground-secondary">
                        <span className="line-clamp-2">{l.courseInterest || '—'}</span>
                        <span className="block truncate text-xs text-foreground-muted">{[l.city, l.centreName].filter(Boolean).join(' · ') || '—'}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-foreground-secondary">{SOURCE_LABEL[l.source] ?? l.source}</td>
                      <td className="px-3 py-3"><StatusSelect lead={l} disabled={pending} onChange={(s) => changeStatus(l.id, s)} /></td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-foreground-muted">{when(l.createdAt)}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5">
                          {l.phone ? (
                            <a href={`tel:${l.phone}`} aria-label={`Call ${l.name}`} className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">☎</a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-foreground-muted">{leads.length === 0 ? 'No leads yet. They appear here as soon as someone submits an enquiry.' : 'No leads match these filters.'}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards (phones) */}
          <ul className="mt-4 flex flex-col gap-3 lg:hidden">
            {pageRows.map((l) => (
              <li key={l.id} className="adm-card p-4">
                <button type="button" onClick={() => openLead(l.id)} className="block w-full cursor-pointer text-left">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-bold text-foreground">{l.name}</span>
                      <span className="block truncate text-xs text-foreground-muted">{when(l.createdAt)} · {SOURCE_LABEL[l.source] ?? l.source}</span>
                    </span>
                  </span>
                  <span className="mt-2 block text-sm text-foreground-secondary">{[l.courseInterest, l.city].filter(Boolean).join(' · ') || '—'}</span>
                </button>
                <div className="mt-3 flex items-center gap-2">
                  {l.phone ? <a href={`tel:${l.phone}`} className="inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--admin-radius)] bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-ink)]">Call {l.phone}</a> : null}
                  <StatusSelect lead={l} disabled={pending} onChange={(s) => changeStatus(l.id, s)} />
                </div>
              </li>
            ))}
            {pageRows.length === 0 ? <li className="adm-card px-4 py-10 text-center text-sm text-foreground-muted">{leads.length === 0 ? 'No leads yet.' : 'No leads match these filters.'}</li> : null}
          </ul>

          {pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)} className="min-h-10 cursor-pointer font-semibold text-foreground-secondary disabled:opacity-40">← Previous</button>
              <span className="text-foreground-muted">Page {pageIndex + 1} of {pageCount}</span>
              <button type="button" disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex(pageIndex + 1)} className="min-h-10 cursor-pointer font-semibold text-foreground-secondary disabled:opacity-40">Next →</button>
            </div>
          ) : null}
        </>
      ) : selected ? (
        <>
          <button type="button" onClick={() => setView('list')} className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground-secondary hover:text-[var(--accent-ink)]">
            <span aria-hidden="true">←</span> All leads
          </button>

          <header className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="adm-eyebrow">{SOURCE_LABEL[selected.source] ?? selected.source}</p>
              <h1 className="adm-title mt-3">{selected.name}</h1>
              <p className="adm-lede mt-2">Received {when(selected.createdAt)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusSelect lead={selected} disabled={pending} onChange={(s) => changeStatus(selected.id, s)} />
              {selected.phone ? <a href={`tel:${selected.phone}`} className="inline-flex min-h-11 items-center rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">Call</a> : null}
              {selected.phone ? <a href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">WhatsApp</a> : null}
              {selected.email ? <a href={`mailto:${selected.email}`} className="inline-flex min-h-11 items-center rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">Email</a> : null}
              <button type="button" disabled={pending} onClick={() => setPendingDelete({ id: selected.id, name: selected.name })} className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-muted hover:border-[var(--color-error-600)] hover:bg-[var(--color-error-50)] hover:text-[#b42318] disabled:opacity-45">Delete</button>
            </div>
          </header>
          {banner}

          <section className="adm-card mt-6 p-5 sm:p-6" aria-labelledby="lead-details">
            <h2 id="lead-details" className="text-base font-bold text-foreground">Enquiry details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  ['Phone', selected.phone],
                  ['Email', selected.email],
                  ['Interested in', selected.courseInterest],
                  ['City', selected.city],
                  ['State', selected.state],
                  ['Centre', selected.centreName],
                  ['Qualification', selected.qualification === 'graduate' ? 'Graduate or above' : selected.qualification],
                  ['Came from', selected.form],
                  ['Campaign', [selected.utmSource, selected.utmMedium, selected.utmCampaign].filter(Boolean).join(' / ')],
                  ['Landing page', selected.landingPage],
                  ['CRM hand-off', selected.crmStatus === 'routed' ? 'Sent' : selected.crmStatus === 'failed' ? 'Failed — follow up manually' : 'Not configured'],
                ] as const
              )
                .filter(([, v]) => v)
                .map(([label, v]) => (
                  <div key={label}>
                    <dt className="text-xs font-bold tracking-wide text-foreground-muted uppercase">{label}</dt>
                    <dd className="mt-1 break-words text-foreground">{v}</dd>
                  </div>
                ))}
            </dl>
            {selected.message ? (
              <div className="mt-5 border-t border-border pt-4 text-sm">
                <p className="text-xs font-bold tracking-wide text-foreground-muted uppercase">Message from the visitor</p>
                <p className="mt-1 whitespace-pre-wrap text-foreground">{selected.message}</p>
              </div>
            ) : null}
          </section>

          <section className="adm-card mt-5 p-5 sm:p-6" aria-labelledby="lead-activity">
            <h2 id="lead-activity" className="text-base font-bold text-foreground">Activity</h2>
            <div className="mt-4 flex gap-3">
              <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a note — what was discussed, next step…" aria-label="Add a note" className="admin-input h-11 min-w-0 flex-1" onKeyDown={(e) => { if (e.key === 'Enter') saveNote(selected.id); }} />
              <button type="button" disabled={pending || !noteDraft.trim()} onClick={() => saveNote(selected.id)} className="adm-btn-primary min-h-11 shrink-0 cursor-pointer rounded-[var(--admin-radius)] px-5 text-sm font-bold disabled:opacity-45">Add note</button>
            </div>
            <ol className="mt-5 flex flex-col">
              {timeline.map((entry) => (
                <li key={entry.id} className="flex gap-3 border-l-2 border-border py-2 pl-4 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground-secondary">{entry.body}</p>
                    <p className="mt-0.5 text-xs text-foreground-muted capitalize">{entry.kind.replace('_', ' ')} · {when(entry.createdAt)}</p>
                  </div>
                </li>
              ))}
              {timeline.length === 0 ? <li className="text-sm text-foreground-muted">No activity yet.</li> : null}
            </ol>
          </section>
        </>
      ) : null}

      <AdminConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete lead"
        description={<>Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This cannot be undone.</>}
        pending={pending}
        onConfirm={confirmDeleteLead}
      />
    </div>
  );
}
