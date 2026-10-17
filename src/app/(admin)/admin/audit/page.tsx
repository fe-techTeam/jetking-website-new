import { requireRole } from '../actions';
import Link from 'next/link';
import type { Route } from 'next';
import { AUDIT_GROUPS, isDatabaseConfigured, listAuditLog, type AuditGroup } from '@/lib/audit/log';

const PAGE_SIZE = 50;
const GROUP_OPTION_LABEL: Record<AuditGroup, string> = {
  content: 'Content',
  leads: 'Leads',
  team: 'Team',
  media: 'Media',
};

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Action codes are dot-namespaced (`cms.save`, `lead.status_change`,
 *  `team.invite`) — this only needs to turn the namespace into the label
 *  shown as a pill; the full sentence lives in each entry's own summary. */
const ACTION_GROUP_LABEL: Record<string, string> = {
  cms: 'Content',
  lead: 'Leads',
  team: 'Team',
  media: 'Media',
};

function actionGroup(action: string): string {
  return action.split('.')[0] ?? action;
}

function formatWhen(value: Date | string): string {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireRole(['admin']);

  if (!isDatabaseConfigured()) {
    return (
      <div className="max-w-2xl">
        <p className="adm-eyebrow">audit</p>
        <h1 className="adm-title mt-3">Audit log</h1>
        <div
          role="alert"
          className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-error-200)] bg-[var(--color-error-50)] px-5 py-4 text-sm font-medium text-[var(--color-error-600)]"
        >
          <code className="text-foreground">DATABASE_URL</code> is not set, so there is nowhere to
          durably keep action history. Point it at any Postgres instance, then run{' '}
          <code className="text-foreground">npm run db:migrate</code>. See{' '}
          <code className="text-foreground">.env.example</code>.
        </div>
      </div>
    );
  }

  const sp = await searchParams;
  const groupRaw = one(sp.group);
  const group = (AUDIT_GROUPS as readonly string[]).includes(groupRaw) ? (groupRaw as AuditGroup) : undefined;
  const actor = one(sp.actor).trim();
  const q = one(sp.q).trim();
  const from = one(sp.from);
  const to = one(sp.to);
  const pageNum = Math.max(1, Number.parseInt(one(sp.page), 10) || 1);

  const { entries, total } = await listAuditLog({
    group,
    actor,
    q,
    from,
    to,
    limit: PAGE_SIZE,
    offset: (pageNum - 1) * PAGE_SIZE,
  });
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(group || actor || q || from || to);

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    if (group) params.set('group', group);
    if (actor) params.set('actor', actor);
    if (q) params.set('q', q);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return (qs ? `/admin/audit?${qs}` : '/admin/audit') as Route;
  };

  const field =
    'min-h-11 w-full rounded-[var(--admin-radius)] border border-border-medium bg-background px-3 text-sm text-foreground';
  const labelCls = 'mb-1.5 block text-xs font-medium text-foreground-muted';

  return (
    <div>
      <p className="adm-eyebrow">audit</p>
      <h1 className="adm-title mt-3">Audit log</h1>
      <p className="adm-lede mt-3">
        Every content save or delete, lead status change, media change and team change made in this
        panel — newest first. {total} {total === 1 ? 'entry' : 'entries'}
        {filtered ? ' match the filters' : ''}.
      </p>

      <form method="get" action="/admin/audit" className="adm-card mt-8 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div>
          <label htmlFor="audit-group" className={labelCls}>Type</label>
          <select id="audit-group" name="group" defaultValue={group ?? ''} className={field}>
            <option value="">All</option>
            {AUDIT_GROUPS.map((g) => (
              <option key={g} value={g}>{GROUP_OPTION_LABEL[g]}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-actor" className={labelCls}>Actor</label>
          <input id="audit-actor" name="actor" defaultValue={actor} placeholder="Name" className={field} />
        </div>
        <div className="lg:col-span-2">
          <label htmlFor="audit-q" className={labelCls}>Search summary</label>
          <input id="audit-q" name="q" defaultValue={q} placeholder="e.g. Course" className={field} />
        </div>
        <div>
          <label htmlFor="audit-from" className={labelCls}>From</label>
          <input id="audit-from" type="date" name="from" defaultValue={from} className={field} />
        </div>
        <div>
          <label htmlFor="audit-to" className={labelCls}>To</label>
          <input id="audit-to" type="date" name="to" defaultValue={to} className={field} />
        </div>
        <div className="flex gap-3 sm:col-span-2 lg:col-span-6">
          <button
            type="submit"
            className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] bg-[var(--accent)] px-5 text-sm font-bold text-white"
          >
            Apply filters
          </button>
          {filtered ? (
            <Link
              href={'/admin/audit' as Route}
              className="inline-flex min-h-11 items-center rounded-[var(--admin-radius)] border border-border-medium px-5 text-sm font-semibold text-foreground-secondary"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-8 overflow-x-auto adm-card">
        <table className="adm-table w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {['When', 'Actor', 'Action', 'Summary'].map((h) => (
                <th key={h} className="label-mono px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border last:border-none">
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-foreground-muted">
                  {formatWhen(entry.createdAt)}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">{entry.actorName}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-foreground-secondary">
                    {ACTION_GROUP_LABEL[actionGroup(entry.action)] ?? actionGroup(entry.action)}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground-secondary">{entry.summary}</td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-foreground-muted">
                  No actions recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <nav aria-label="Audit log pages" className="mt-4 flex items-center justify-between text-sm">
        {pageNum > 1 ? (
          <Link href={hrefFor(pageNum - 1)} className="font-semibold text-[var(--accent-ink)]">
            &larr; Newer
          </Link>
        ) : (
          <span />
        )}
        <span className="text-foreground-muted">
          Page {pageNum} of {pageCount}
        </span>
        {pageNum < pageCount ? (
          <Link href={hrefFor(pageNum + 1)} className="font-semibold text-[var(--accent-ink)]">
            Older &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
