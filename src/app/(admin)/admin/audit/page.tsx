import { requireRole } from '../actions';
import { isDatabaseConfigured, listAuditLog } from '@/lib/audit/log';

/** Action codes are dot-namespaced (`cms.save`, `lead.status_change`,
 *  `team.invite`) — this only needs to turn the namespace into the label
 *  shown as a pill; the full sentence lives in each entry's own summary. */
const ACTION_GROUP_LABEL: Record<string, string> = {
  cms: 'Content',
  lead: 'Leads',
  team: 'Team',
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

export default async function AdminAuditPage() {
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

  const entries = await listAuditLog(200);

  return (
    <div>
      <p className="adm-eyebrow">audit</p>
      <h1 className="adm-title mt-3">Audit log</h1>
      <p className="adm-lede mt-3">
        Every content save or delete, lead status change, and team change made in this panel —
        newest first, up to the last {entries.length === 200 ? '200 entries' : `${entries.length} entries`}.
      </p>

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
    </div>
  );
}
