'use client';

import {
  ArrowDown, ArrowLeft, ArrowUp, Bot, CalendarClock, Check, CircleAlert, Clock, Copy, Download, Eye, Globe, Inbox, Mail,
  MapPin, MessageCircle, MoreHorizontal, Phone, PhoneCall, Plus, Search, StickyNote, Trash2, Upload, User, UserPlus, Users, X,
  ArrowRightLeft, Building2, GraduationCap, Megaphone,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import {
  submitLead, moveLeadStatus, addNote, removeLead, removeLeads, getLeadTimeline, assignLeads, scheduleFollowUp, recordCall, listAssignees,
} from './actions';
import type { Lead, LeadActivity } from '@/lib/db/schema';
import type { LeadStatus } from '@/lib/leads/store';
import { SOURCE_LABEL, STATUS_LABEL as STATUS_TEXT } from '@/lib/leads/transfer';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { ExportDialog } from './ExportDialog';
import { ImportDialog } from './ImportDialog';

const STATUSES: LeadStatus[] = ['new', 'contacted', 'enrolled', 'lost'];
const STATUS_LABEL = STATUS_TEXT as Record<LeadStatus, string>;
/** Colour carries the meaning here (amber = needs a call, green = won) — never the brand accent. */
const STATUS_STYLE: Record<LeadStatus, { dot: string; pill: string }> = {
  new: { dot: '#f79009', pill: 'bg-[var(--color-signal-50)] text-[#b54708]' },
  contacted: { dot: '#667085', pill: 'bg-surface text-foreground-secondary ring-1 ring-border' },
  enrolled: { dot: '#12b76a', pill: 'bg-[var(--color-growth-50)] text-[#067647]' },
  lost: { dot: '#c4c9d4', pill: 'bg-surface text-foreground-muted ring-1 ring-border' },
};
const SOURCE_ICON: Record<string, typeof Globe> = { form: Globe, chatbot: Bot, centre: Building2, franchise: Megaphone };
const CALL_OUTCOMES: Array<[string, string]> = [
  ['connected', 'Spoke to them'], ['no_answer', 'No answer'], ['busy', 'Busy'], ['wrong_number', 'Wrong number'], ['call_back_later', 'Asked to call back later'],
];
const PAGE_SIZE = 25;

type SortKey = 'createdAt' | 'name' | 'status' | 'followUpAt';
type Range = 'all' | 'today' | '7' | '30';
type SmartView = 'all' | 'mine' | 'unassigned' | 'due';

const when = (d: Date | string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const day = (d: Date | string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
/** `datetime-local` value (the editor's own time zone) for a stored instant. */
function toLocalInput(d: Date | string | null): string {
  if (!d) return '';
  const x = new Date(d);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
}

function statsFrom(rows: Lead[]) {
  const byStatus = { new: 0, contacted: 0, enrolled: 0, lost: 0 };
  for (const row of rows) if (row.status in byStatus) byStatus[row.status as LeadStatus] += 1;
  return { total: rows.length, byStatus };
}

function Owner({ name }: { name: string | null }) {
  if (!name) return <span className="text-xs text-foreground-muted">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-secondary">
      <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[10px] font-bold text-[var(--accent-ink)]">{initials(name)}</span>
      <span className="max-w-[7rem] truncate">{name}</span>
    </span>
  );
}

function FollowUp({ at, closed, now }: { at: Date | string | null; closed: boolean; now: number }) {
  if (!at) return <span className="text-xs text-foreground-muted">—</span>;
  const overdue = !closed && new Date(at).getTime() < now;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${overdue ? 'text-[#b42318]' : 'text-foreground-secondary'}`}>
      {overdue ? <CircleAlert aria-hidden="true" className="h-3.5 w-3.5" /> : <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />}
      {day(at)}
      {overdue ? <span className="sr-only"> (overdue)</span> : null}
    </span>
  );
}

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
        <option key={x} value={x}>{STATUS_LABEL[x]}</option>
      ))}
    </select>
  );
}

/** The "⋯" menu on every row: the things staff do to a lead without opening it. */
function RowMenu({ children, label }: { children: ReactNode; label: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div ref={box} className="relative" onClick={(e) => e.stopPropagation()}>
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-56 rounded-[var(--admin-radius)] border border-border bg-background p-1.5 shadow-[var(--adm-shadow-lift)]" onClick={() => setOpen(false)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function MenuItem({ icon: Icon, children, onClick, href, danger, external }: { icon: typeof Phone; children: ReactNode; onClick?: () => void; href?: string; danger?: boolean; external?: boolean }) {
  const cls = `flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left text-sm font-medium hover:bg-surface ${danger ? 'text-[#b42318]' : 'text-foreground-secondary'}`;
  const inner = (<><Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{children}</>);
  return href ? (
    <a role="menuitem" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={cls}>{inner}</a>
  ) : (
    <button role="menuitem" type="button" onClick={onClick} className={cls}>{inner}</button>
  );
}

const ACTIVITY_ICON: Record<string, typeof StickyNote> = { call: PhoneCall, note: StickyNote, status_change: ArrowRightLeft, chatbot: Bot };

export function LeadsBoard({ initialLeads, initialStatusFilter, me, canImport }: { initialLeads: Lead[]; initialStatusFilter?: LeadStatus; me: string; canImport: boolean }) {
  const [leads, setLeads] = useState(initialLeads);
  const stats = useMemo(() => statsFrom(leads), [leads]);
  // "Today / due" are measured from when the page was opened.
  const [now] = useState(() => Date.now());
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<LeadActivity[]>([]);
  const [assignees, setAssignees] = useState<string[]>([me]);

  const [search, setSearch] = useState('');
  const [smart, setSmart] = useState<SmartView>('all');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>(initialStatusFilter ?? 'all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [range, setRange] = useState<Range>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [pageIndex, setPageIndex] = useState(0);
  const [checked, setChecked] = useState<string[]>([]);

  const [showNew, setShowNew] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [call, setCall] = useState({ outcome: 'connected', note: '' });
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; label: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    listAssignees().then(setAssignees).catch(() => {});
  }, []);

  const selected = leads.find((l) => l.id === selectedId) ?? null;
  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source))).sort(), [leads]);
  const cities = useMemo(() => Array.from(new Set(leads.map((l) => l.city).filter((c): c is string => Boolean(c)))).sort(), [leads]);
  const open = (l: Lead) => l.status === 'new' || l.status === 'contacted';
  const isDue = (l: Lead) => open(l) && l.followUpAt !== null && new Date(l.followUpAt).getTime() <= now;
  const counts = useMemo(
    () => ({
      all: leads.length,
      mine: leads.filter((l) => l.assignedTo === me && open(l)).length,
      unassigned: leads.filter((l) => !l.assignedTo && open(l)).length,
      due: leads.filter(isDue).length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leads, me, now],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const since = range === 'all' ? 0 : range === 'today' ? new Date(now).setHours(0, 0, 0, 0) : now - Number(range) * 86_400_000;
    const rows = leads.filter((l) => {
      if (smart === 'mine' && !(l.assignedTo === me && (l.status === 'new' || l.status === 'contacted'))) return false;
      if (smart === 'unassigned' && !(!l.assignedTo && (l.status === 'new' || l.status === 'contacted'))) return false;
      if (smart === 'due' && !((l.status === 'new' || l.status === 'contacted') && l.followUpAt !== null && new Date(l.followUpAt).getTime() <= now)) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && l.source !== sourceFilter) return false;
      if (cityFilter !== 'all' && l.city !== cityFilter) return false;
      if (since && new Date(l.createdAt).getTime() < since) return false;
      if (!q) return true;
      return [l.name, l.courseInterest, l.city, l.phone, l.email, l.centreName, l.message, l.assignedTo].some((f) => f?.toLowerCase().includes(q));
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return rows.sort((a, b) => {
      if (sort.key === 'name') return a.name.localeCompare(b.name) * dir;
      if (sort.key === 'status') return (STATUSES.indexOf(a.status as LeadStatus) - STATUSES.indexOf(b.status as LeadStatus)) * dir;
      if (sort.key === 'followUpAt') {
        const av = a.followUpAt ? new Date(a.followUpAt).getTime() : Infinity;
        const bv = b.followUpAt ? new Date(b.followUpAt).getTime() : Infinity;
        return (av - bv) * dir;
      }
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    });
  }, [leads, search, smart, me, statusFilter, sourceFilter, cityFilter, range, sort, now]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE);
  const filtersActive = smart !== 'all' || statusFilter !== 'all' || sourceFilter !== 'all' || cityFilter !== 'all' || range !== 'all' || search.trim() !== '';
  const allOnPage = pageRows.length > 0 && pageRows.every((l) => checked.includes(l.id));
  const selectedLeads = leads.filter((l) => checked.includes(l.id));

  const reset = () => setPageIndex(0);
  function clearFilters() {
    setSearch(''); setSmart('all'); setStatusFilter('all'); setSourceFilter('all'); setCityFilter('all'); setRange('all'); reset();
  }
  function sortBy(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'followUpAt' ? 'asc' : 'desc' }));
  }
  const sortMark = (k: SortKey) => (sort.key === k ? (sort.dir === 'asc' ? <ArrowUp aria-hidden="true" className="ml-1 inline h-3 w-3" /> : <ArrowDown aria-hidden="true" className="ml-1 inline h-3 w-3" />) : null);

  function openLead(id: string) {
    setSelectedId(id); setNoteDraft(''); setMessage(null); setError(null); setView('detail');
    document.getElementById('admin-content')?.scrollTo({ top: 0 });
    start(async () => setTimeline(await getLeadTimeline(id)));
  }
  const patch = (lead: Lead) => setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
  const refreshTimeline = async (id: string) => selectedId === id && setTimeline(await getLeadTimeline(id));

  function changeStatus(id: string, status: LeadStatus) {
    setError(null);
    start(async () => {
      const r = await moveLeadStatus(id, status);
      if (!r.ok) return setError(r.error);
      patch(r.lead); await refreshTimeline(id); setMessage(`Moved to ${STATUS_LABEL[status]}.`);
    });
  }
  function bulkStatus(status: LeadStatus) {
    const ids = checked;
    start(async () => {
      for (const id of ids) {
        const r = await moveLeadStatus(id, status);
        if (r.ok) patch(r.lead);
      }
      setChecked([]); setMessage(`Moved ${ids.length} lead${ids.length === 1 ? '' : 's'} to ${STATUS_LABEL[status]}.`);
    });
  }
  function assign(ids: string[], who: string | null) {
    start(async () => {
      const r = await assignLeads(ids, who);
      if (!r.ok) return setError(r.error);
      r.leads.forEach(patch); setChecked([]);
      setMessage(who ? `Assigned ${r.leads.length} lead${r.leads.length === 1 ? '' : 's'} to ${who}.` : `Unassigned ${r.leads.length} lead${r.leads.length === 1 ? '' : 's'}.`);
      if (ids.length === 1) await refreshTimeline(ids[0]!);
    });
  }
  function followUp(id: string, iso: string | null) {
    start(async () => {
      const r = await scheduleFollowUp(id, iso);
      if (!r.ok) return setError(r.error);
      patch(r.lead); await refreshTimeline(id); setMessage(iso ? 'Follow-up scheduled.' : 'Follow-up cleared.');
    });
  }
  const inDays = (n: number, hour = 10) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(hour, 0, 0, 0); return d.toISOString(); };
  function saveNote(id: string) {
    if (!noteDraft.trim()) return;
    start(async () => {
      const r = await addNote(id, noteDraft);
      if (!r.ok) return setError(r.error);
      setNoteDraft(''); await refreshTimeline(id); setMessage('Note added.');
    });
  }
  function logCall(id: string) {
    start(async () => {
      const r = await recordCall(id, call.outcome, call.note);
      if (!r.ok) return setError(r.error);
      patch(r.lead); setCall({ outcome: 'connected', note: '' }); await refreshTimeline(id); setMessage('Call logged.');
    });
  }
  function confirmDelete() {
    if (!pendingDelete) return;
    const { ids } = pendingDelete;
    start(async () => {
      if (ids.length === 1) await removeLead(ids[0]!); else await removeLeads(ids);
      setLeads((prev) => prev.filter((l) => !ids.includes(l.id)));
      setChecked((c) => c.filter((x) => !ids.includes(x)));
      if (selectedId && ids.includes(selectedId)) { setSelectedId(null); setView('list'); }
      setMessage(`Deleted ${pendingDelete.label}.`); setPendingDelete(null);
    });
  }
  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setMessage(null); setError(null);
    start(async () => {
      const r = await submitLead(fd);
      if (!r.ok) return setError(r.error);
      setLeads((prev) => [r.lead, ...prev]); setMessage('Lead added.'); setShowNew(false); formRef.current?.reset();
    });
  }
  function copy(text: string, what: string) {
    void navigator.clipboard?.writeText(text);
    setMessage(`${what} copied.`);
  }

  const banner = (
    <>
      {error ? <p role="alert" className="mt-4 flex items-center gap-2 text-sm font-medium text-[var(--color-error-600)]"><CircleAlert aria-hidden="true" className="h-4 w-4" />{error}</p> : null}
      {message ? <p aria-live="polite" className="mt-4 flex items-center gap-2 text-sm font-medium text-growth-600"><Check aria-hidden="true" className="h-4 w-4" />{message}</p> : null}
    </>
  );

  const btn = 'inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-ink)] disabled:opacity-45';

  const smartTabs: Array<[SmartView, string, typeof Users, number]> = [
    ['all', 'All leads', Users, counts.all],
    ['mine', 'My leads', User, counts.mine],
    ['unassigned', 'Unassigned', Inbox, counts.unassigned],
    ['due', 'Follow-up due', Clock, counts.due],
  ];

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
              {canImport ? <button type="button" onClick={() => setImportOpen(true)} className={btn}><Upload aria-hidden="true" className="h-4 w-4" />Import</button> : null}
              <button type="button" onClick={() => setExportOpen(true)} disabled={leads.length === 0} className={btn}><Download aria-hidden="true" className="h-4 w-4" />Export</button>
              <button type="button" onClick={() => setShowNew((v) => !v)} className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--admin-radius)] px-5 text-sm font-bold">
                {showNew ? <X aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}{showNew ? 'Cancel' : 'New lead'}
              </button>
            </div>
          </header>

          {/* Status tiles double as filters. */}
          <div className="-mx-4 mt-6 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:px-0" role="group" aria-label="Filter by status">
            {(['all', ...STATUSES] as const).map((s) => {
              const count = s === 'all' ? stats.total : stats.byStatus[s];
              const active = statusFilter === s;
              return (
                <button key={s} type="button" aria-pressed={active} onClick={() => { setStatusFilter(s); reset(); }}
                  className={`adm-card min-w-[7.5rem] shrink-0 cursor-pointer p-3 text-left transition-shadow sm:min-w-0 sm:p-4 ${active ? 'ring-2 ring-[var(--accent)]' : 'hover:shadow-[var(--adm-shadow-lift)]'}`}>
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
                  <option value="form">Website form</option><option value="chatbot">Chatbot</option><option value="centre">Centre (walk-in / phone)</option><option value="franchise">Franchise</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm sm:col-span-2 lg:col-span-3"><span className="label-mono">Notes</span><textarea name="notes" rows={2} className="admin-input resize-y" /></label>
              <div className="sm:col-span-2 lg:col-span-3">
                <button type="submit" disabled={pending} className="adm-btn-primary inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--admin-radius)] px-6 text-sm font-bold disabled:opacity-45"><Plus aria-hidden="true" className="h-4 w-4" />{pending ? 'Saving…' : 'Save lead'}</button>
              </div>
            </form>
          ) : null}

          {banner}

          {/* Smart views */}
          <div className="-mx-4 mt-5 flex gap-1.5 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Lead views">
            {smartTabs.map(([key, label, Icon, n]) => (
              <button key={key} type="button" role="tab" aria-selected={smart === key} onClick={() => { setSmart(key); reset(); }}
                className={`-mb-px inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border-b-2 px-3.5 text-sm font-semibold transition-colors ${smart === key ? 'border-[var(--accent)] text-[var(--accent-ink)]' : 'border-transparent text-foreground-secondary hover:text-foreground'}`}>
                <Icon aria-hidden="true" className="h-4 w-4" />{label}
                <span className={`numeral rounded-full px-2 py-0.5 text-xs font-bold ${key === 'due' && n > 0 ? 'bg-[var(--color-error-50)] text-[#b42318]' : 'bg-surface text-foreground-secondary ring-1 ring-border'}`}>{n}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <div className="relative w-full lg:max-w-sm">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); reset(); }} placeholder="Search name, phone, email, course, city, owner…" aria-label="Search leads" style={{ paddingLeft: 36 }} className="admin-input h-11 text-sm" />
            </div>
            <select aria-label="Source" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); reset(); }} style={{ width: 'auto' }} className="admin-input h-11 text-sm">
              <option value="all">All sources</option>{sources.map((s) => (<option key={s} value={s}>{SOURCE_LABEL[s] ?? s}</option>))}
            </select>
            <select aria-label="City" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); reset(); }} style={{ width: 'auto' }} className="admin-input h-11 text-sm">
              <option value="all">All cities</option>{cities.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <select aria-label="Received" value={range} onChange={(e) => { setRange(e.target.value as Range); reset(); }} style={{ width: 'auto' }} className="admin-input h-11 text-sm">
              <option value="all">Any time</option><option value="today">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option>
            </select>
            {filtersActive ? <button type="button" onClick={clearFilters} className="inline-flex min-h-11 cursor-pointer items-center gap-1 px-2 text-sm font-semibold text-[var(--accent-ink)] hover:underline"><X aria-hidden="true" className="h-3.5 w-3.5" />Clear filters</button> : null}
            <span className="ml-auto text-xs text-foreground-muted">{filtered.length} of {leads.length} lead{leads.length === 1 ? '' : 's'}</span>
          </div>

          {checked.length > 0 ? (
            <div className="adm-card mt-3 flex flex-wrap items-center gap-3 px-4 py-2.5" role="region" aria-label="Bulk actions">
              <span className="text-sm font-semibold text-foreground">{checked.length} selected</span>
              <label className="flex items-center gap-2 text-sm text-foreground-secondary"><ArrowRightLeft aria-hidden="true" className="h-4 w-4" />
                <select aria-label="Move selected leads to" defaultValue="" disabled={pending} onChange={(e) => e.target.value && bulkStatus(e.target.value as LeadStatus)} style={{ width: 'auto' }} className="admin-input h-9 text-sm">
                  <option value="" disabled>Move to…</option>{STATUSES.map((s) => (<option key={s} value={s}>{STATUS_LABEL[s]}</option>))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground-secondary"><UserPlus aria-hidden="true" className="h-4 w-4" />
                <select aria-label="Assign selected leads to" defaultValue="" disabled={pending} onChange={(e) => e.target.value && assign(checked, e.target.value === '__none' ? null : e.target.value)} style={{ width: 'auto' }} className="admin-input h-9 text-sm">
                  <option value="" disabled>Assign to…</option>{assignees.map((a) => (<option key={a} value={a}>{a}</option>))}<option value="__none">Unassign</option>
                </select>
              </label>
              <button type="button" onClick={() => setExportOpen(true)} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground-secondary hover:text-[var(--accent-ink)]"><Download aria-hidden="true" className="h-4 w-4" />Export</button>
              <button type="button" onClick={() => setPendingDelete({ ids: checked, label: `${checked.length} leads` })} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-[#b42318]"><Trash2 aria-hidden="true" className="h-4 w-4" />Delete</button>
              <button type="button" onClick={() => setChecked([])} className="ml-auto cursor-pointer text-sm font-semibold text-foreground-muted hover:text-foreground">Clear selection</button>
            </div>
          ) : null}

          {/* Table (desktop) */}
          <div className="adm-card mt-4 hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                <thead className="border-b border-border bg-surface/70 text-xs font-bold tracking-wide text-foreground-muted uppercase">
                  <tr>
                    <th scope="col" className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all leads on this page" checked={allOnPage} onChange={(e) => setChecked(e.target.checked ? Array.from(new Set([...checked, ...pageRows.map((l) => l.id)])) : checked.filter((id) => !pageRows.some((l) => l.id === id)))} className="h-4 w-4 cursor-pointer accent-[var(--accent)]" /></th>
                    <th scope="col" className="px-3 py-3" aria-sort={sort.key === 'name' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => sortBy('name')} className="cursor-pointer font-bold uppercase hover:text-foreground">Lead{sortMark('name')}</button></th>
                    <th scope="col" className="px-3 py-3">Interested in</th>
                    <th scope="col" className="hidden px-3 py-3 lg:table-cell">Source</th>
                    <th scope="col" className="px-3 py-3" aria-sort={sort.key === 'status' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => sortBy('status')} className="cursor-pointer font-bold uppercase hover:text-foreground">Status{sortMark('status')}</button></th>
                    <th scope="col" className="hidden px-3 py-3 lg:table-cell">Owner</th>
                    <th scope="col" className="hidden px-3 py-3 xl:table-cell" aria-sort={sort.key === 'followUpAt' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => sortBy('followUpAt')} className="cursor-pointer font-bold uppercase hover:text-foreground">Follow-up{sortMark('followUpAt')}</button></th>
                    <th scope="col" className="px-3 py-3" aria-sort={sort.key === 'createdAt' ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}><button type="button" onClick={() => sortBy('createdAt')} className="cursor-pointer font-bold uppercase hover:text-foreground">Received{sortMark('createdAt')}</button></th>
                    <th scope="col" className="px-4 py-3 text-right"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageRows.map((l) => {
                    const SrcIcon = SOURCE_ICON[l.source] ?? Globe;
                    return (
                      <tr key={l.id} onClick={() => openLead(l.id)} className="cursor-pointer transition-colors hover:bg-surface/60">
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select ${l.name}`} checked={checked.includes(l.id)} onChange={(e) => setChecked(e.target.checked ? [...checked, l.id] : checked.filter((id) => id !== l.id))} className="h-4 w-4 cursor-pointer accent-[var(--accent)]" /></td>
                        <td className="max-w-[15rem] px-3 py-3">
                          <button type="button" onClick={(e) => { e.stopPropagation(); openLead(l.id); }} className="block max-w-full cursor-pointer truncate text-left font-semibold text-foreground hover:text-[var(--accent-ink)]">{l.name}</button>
                          <span className="block truncate text-xs text-foreground-muted">{[l.phone, l.email].filter(Boolean).join(' · ') || '—'}</span>
                          {/* Narrower screens drop the Owner and Follow-up columns; keep the facts under the name. */}
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 xl:hidden">
                            <span className="lg:hidden"><Owner name={l.assignedTo} /></span>
                            <FollowUp at={l.followUpAt} closed={!open(l)} now={now} />
                          </span>
                        </td>
                        <td className="max-w-[15rem] px-3 py-3 text-foreground-secondary">
                          <span className="line-clamp-2">{l.courseInterest || '—'}</span>
                          <span className="flex items-center gap-1 truncate text-xs text-foreground-muted"><MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />{[l.city, l.centreName].filter(Boolean).join(' · ') || '—'}</span>
                        </td>
                        <td className="hidden px-3 py-3 whitespace-nowrap text-foreground-secondary lg:table-cell"><span className="inline-flex items-center gap-1.5"><SrcIcon aria-hidden="true" className="h-4 w-4 text-foreground-muted" />{SOURCE_LABEL[l.source] ?? l.source}</span></td>
                        <td className="px-3 py-3"><StatusSelect lead={l} disabled={pending} onChange={(s) => changeStatus(l.id, s)} /></td>
                        <td className="hidden px-3 py-3 lg:table-cell"><Owner name={l.assignedTo} /></td>
                        <td className="hidden px-3 py-3 whitespace-nowrap xl:table-cell"><FollowUp at={l.followUpAt} closed={!open(l)} now={now} /></td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs text-foreground-muted">{when(l.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <RowMenu label={`Actions for ${l.name}`}>
                              <MenuItem icon={Eye} onClick={() => openLead(l.id)}>Open lead</MenuItem>
                              {l.phone ? <MenuItem icon={Phone} href={`tel:${l.phone}`}>Call</MenuItem> : null}
                              {l.phone ? <MenuItem icon={MessageCircle} href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} external>WhatsApp</MenuItem> : null}
                              {l.email ? <MenuItem icon={Mail} href={`mailto:${l.email}`}>Email</MenuItem> : null}
                              {l.phone ? <MenuItem icon={Copy} onClick={() => copy(l.phone!, 'Phone number')}>Copy phone</MenuItem> : null}
                              {l.email ? <MenuItem icon={Copy} onClick={() => copy(l.email!, 'Email')}>Copy email</MenuItem> : null}
                              <div className="my-1 h-px bg-border" />
                              <MenuItem icon={UserPlus} onClick={() => assign([l.id], me)}>Assign to me</MenuItem>
                              <MenuItem icon={CalendarClock} onClick={() => followUp(l.id, inDays(1))}>Follow up tomorrow</MenuItem>
                              <div className="my-1 h-px bg-border" />
                              <MenuItem icon={Trash2} danger onClick={() => setPendingDelete({ ids: [l.id], label: l.name })}>Delete</MenuItem>
                            </RowMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pageRows.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-14 text-center text-foreground-muted"><Inbox aria-hidden="true" className="mx-auto mb-2 h-8 w-8 opacity-50" />{leads.length === 0 ? 'No leads yet. They appear here as soon as someone submits an enquiry.' : 'No leads match these filters.'}</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards (phones and tablets) */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {pageRows.map((l) => {
              const SrcIcon = SOURCE_ICON[l.source] ?? Globe;
              return (
                <li key={l.id} className="adm-card p-4">
                  <button type="button" onClick={() => openLead(l.id)} className="block w-full cursor-pointer text-left">
                    <span className="block truncate text-[15px] font-bold text-foreground">{l.name}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-foreground-muted"><SrcIcon aria-hidden="true" className="h-3.5 w-3.5" />{SOURCE_LABEL[l.source] ?? l.source}<span>·</span>{when(l.createdAt)}</span>
                    <span className="mt-2 flex items-start gap-1.5 text-sm text-foreground-secondary"><GraduationCap aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />{[l.courseInterest, l.city].filter(Boolean).join(' · ') || '—'}</span>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusSelect lead={l} disabled={pending} onChange={(s) => changeStatus(l.id, s)} />
                    <Owner name={l.assignedTo} />
                    <FollowUp at={l.followUpAt} closed={!open(l)} now={now} />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {l.phone ? <a href={`tel:${l.phone}`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-[var(--admin-radius)] bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-ink)]"><Phone aria-hidden="true" className="h-4 w-4" />Call</a> : null}
                    {l.phone ? <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${l.name}`} className="grid h-10 w-10 place-items-center rounded-[var(--admin-radius)] border border-border text-foreground-secondary"><MessageCircle aria-hidden="true" className="h-4 w-4" /></a> : null}
                    <RowMenu label={`Actions for ${l.name}`}>
                      <MenuItem icon={Eye} onClick={() => openLead(l.id)}>Open lead</MenuItem>
                      {l.email ? <MenuItem icon={Mail} href={`mailto:${l.email}`}>Email</MenuItem> : null}
                      <MenuItem icon={UserPlus} onClick={() => assign([l.id], me)}>Assign to me</MenuItem>
                      <MenuItem icon={CalendarClock} onClick={() => followUp(l.id, inDays(1))}>Follow up tomorrow</MenuItem>
                      <MenuItem icon={Trash2} danger onClick={() => setPendingDelete({ ids: [l.id], label: l.name })}>Delete</MenuItem>
                    </RowMenu>
                  </div>
                </li>
              );
            })}
            {pageRows.length === 0 ? <li className="adm-card px-4 py-10 text-center text-sm text-foreground-muted">{leads.length === 0 ? 'No leads yet.' : 'No leads match these filters.'}</li> : null}
          </ul>

          {pageCount > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button type="button" disabled={pageIndex === 0} onClick={() => setPageIndex(pageIndex - 1)} className="inline-flex min-h-10 cursor-pointer items-center gap-1 font-semibold text-foreground-secondary disabled:opacity-40"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Previous</button>
              <span className="text-foreground-muted">Page {pageIndex + 1} of {pageCount}</span>
              <button type="button" disabled={pageIndex >= pageCount - 1} onClick={() => setPageIndex(pageIndex + 1)} className="min-h-10 cursor-pointer font-semibold text-foreground-secondary disabled:opacity-40">Next →</button>
            </div>
          ) : null}
        </>
      ) : selected ? (
        <>
          <button type="button" onClick={() => setView('list')} className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm font-semibold text-foreground-secondary hover:text-[var(--accent-ink)]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />All leads</button>

          <header className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="adm-eyebrow">{SOURCE_LABEL[selected.source] ?? selected.source}</p>
              <h1 className="adm-title mt-3">{selected.name}</h1>
              <p className="adm-lede mt-2">Received {when(selected.createdAt)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusSelect lead={selected} disabled={pending} onChange={(s) => changeStatus(selected.id, s)} />
              {selected.phone ? <a href={`tel:${selected.phone}`} className={btn}><Phone aria-hidden="true" className="h-4 w-4" />Call</a> : null}
              {selected.phone ? <a href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={btn}><MessageCircle aria-hidden="true" className="h-4 w-4" />WhatsApp</a> : null}
              {selected.email ? <a href={`mailto:${selected.email}`} className={btn}><Mail aria-hidden="true" className="h-4 w-4" />Email</a> : null}
              <button type="button" disabled={pending} onClick={() => setPendingDelete({ ids: [selected.id], label: selected.name })} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-muted hover:border-[var(--color-error-600)] hover:bg-[var(--color-error-50)] hover:text-[#b42318] disabled:opacity-45"><Trash2 aria-hidden="true" className="h-4 w-4" />Delete</button>
            </div>
          </header>
          {banner}

          {/* Owner + follow-up */}
          <section className="adm-card mt-6 p-5 sm:p-6" aria-labelledby="lead-owner">
            <h2 id="lead-owner" className="flex items-center gap-2 text-base font-bold text-foreground"><UserPlus aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />Owner &amp; follow-up</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-bold tracking-wide text-foreground-muted uppercase">Assigned to</span>
                <span className="flex gap-2">
                  <select value={selected.assignedTo ?? ''} disabled={pending} onChange={(e) => assign([selected.id], e.target.value || null)} className="admin-input h-11 min-w-0 flex-1">
                    <option value="">Unassigned</option>
                    {selected.assignedTo && !assignees.includes(selected.assignedTo) ? <option value={selected.assignedTo}>{selected.assignedTo}</option> : null}
                    {assignees.map((a) => (<option key={a} value={a}>{a}</option>))}
                  </select>
                  {selected.assignedTo !== me ? <button type="button" disabled={pending} onClick={() => assign([selected.id], me)} className={btn}>Me</button> : null}
                </span>
              </label>
              <div className="flex flex-col gap-1.5 text-sm">
                <span className="text-xs font-bold tracking-wide text-foreground-muted uppercase">Next follow-up</span>
                <input type="datetime-local" aria-label="Next follow-up" value={toLocalInput(selected.followUpAt)} disabled={pending} onChange={(e) => followUp(selected.id, e.target.value ? new Date(e.target.value).toISOString() : null)} className="admin-input h-11" />
                <span className="flex flex-wrap gap-1.5">
                  {([['Tomorrow', 1], ['In 3 days', 3], ['Next week', 7]] as const).map(([label, n]) => (
                    <button key={label} type="button" disabled={pending} onClick={() => followUp(selected.id, inDays(n))} className="min-h-8 cursor-pointer rounded-full border border-border px-3 text-xs font-semibold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">{label}</button>
                  ))}
                  {selected.followUpAt ? <button type="button" disabled={pending} onClick={() => followUp(selected.id, null)} className="min-h-8 cursor-pointer px-2 text-xs font-semibold text-foreground-muted hover:text-foreground">Clear</button> : null}
                </span>
              </div>
            </div>
          </section>

          <section className="adm-card mt-5 p-5 sm:p-6" aria-labelledby="lead-details">
            <h2 id="lead-details" className="flex items-center gap-2 text-base font-bold text-foreground"><User aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />Enquiry details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {([
                ['Phone', selected.phone], ['Email', selected.email], ['Interested in', selected.courseInterest], ['City', selected.city], ['State', selected.state], ['Centre', selected.centreName],
                ['Qualification', selected.qualification === 'graduate' ? 'Graduate or above' : selected.qualification], ['Came from', selected.form],
                ['Campaign', [selected.utmSource, selected.utmMedium, selected.utmCampaign].filter(Boolean).join(' / ')], ['Landing page', selected.landingPage],
                ['CRM hand-off', selected.crmStatus === 'routed' ? 'Sent' : selected.crmStatus === 'failed' ? 'Failed — follow up manually' : 'Not configured'],
              ] as const).filter(([, v]) => v).map(([label, v]) => (
                <div key={label}>
                  <dt className="text-xs font-bold tracking-wide text-foreground-muted uppercase">{label}</dt>
                  <dd className="mt-1 flex items-center gap-2 break-words text-foreground">
                    {v}
                    {(label === 'Phone' || label === 'Email') && v ? <button type="button" aria-label={`Copy ${label.toLowerCase()}`} onClick={() => copy(v, label)} className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded text-foreground-muted hover:bg-surface hover:text-foreground"><Copy aria-hidden="true" className="h-3.5 w-3.5" /></button> : null}
                  </dd>
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
            <h2 id="lead-activity" className="flex items-center gap-2 text-base font-bold text-foreground"><Clock aria-hidden="true" className="h-4 w-4 text-[var(--accent)]" />Activity</h2>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[var(--admin-radius)] border border-border p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground"><PhoneCall aria-hidden="true" className="h-4 w-4" />Log a call</p>
                <select aria-label="Call outcome" value={call.outcome} onChange={(e) => setCall({ ...call, outcome: e.target.value })} className="admin-input mt-3 h-10 text-sm">
                  {CALL_OUTCOMES.map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                </select>
                <input value={call.note} onChange={(e) => setCall({ ...call, note: e.target.value })} placeholder="What was said (optional)" aria-label="Call note" className="admin-input mt-2 h-10 text-sm" />
                <button type="button" disabled={pending} onClick={() => logCall(selected.id)} className="adm-btn-primary mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[var(--admin-radius)] px-4 text-sm font-bold disabled:opacity-45"><Check aria-hidden="true" className="h-4 w-4" />Log call</button>
              </div>
              <div className="rounded-[var(--admin-radius)] border border-border p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-foreground"><StickyNote aria-hidden="true" className="h-4 w-4" />Add a note</p>
                <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={3} placeholder="What was discussed, next step…" aria-label="Add a note" className="admin-input mt-3 resize-y text-sm" />
                <button type="button" disabled={pending || !noteDraft.trim()} onClick={() => saveNote(selected.id)} className="adm-btn-primary mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[var(--admin-radius)] px-4 text-sm font-bold disabled:opacity-45"><Plus aria-hidden="true" className="h-4 w-4" />Add note</button>
              </div>
            </div>

            <ol className="mt-6 flex flex-col">
              {timeline.map((entry) => {
                const Icon = ACTIVITY_ICON[entry.kind] ?? StickyNote;
                return (
                  <li key={entry.id} className="flex gap-3 py-2.5 text-sm">
                    <span aria-hidden="true" className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-foreground-muted ring-1 ring-border"><Icon className="h-3.5 w-3.5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground-secondary">{entry.body}</p>
                      <p className="mt-0.5 text-xs text-foreground-muted"><span className="capitalize">{entry.kind.replace('_', ' ')}</span> · {when(entry.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
              {timeline.length === 0 ? <li className="text-sm text-foreground-muted">No activity yet.</li> : null}
            </ol>
          </section>
        </>
      ) : null}

      {exportOpen ? (
        <ExportDialog open onOpenChange={setExportOpen} selected={selectedLeads} filtered={filtered} all={leads} />
      ) : null}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} onDone={(s) => { setMessage(s); window.location.reload(); }} />

      <AdminConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={pendingDelete && pendingDelete.ids.length > 1 ? 'Delete leads' : 'Delete lead'}
        description={<>Delete <span className="font-semibold text-foreground">{pendingDelete?.label}</span>? This cannot be undone.</>}
        pending={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
