import { requireRole } from '../actions';
import { isDatabaseConfigured } from '@/lib/leads/store';
import { LEAD_STATUSES } from '@/lib/leads/schema';
import type { LeadStatus } from '@/lib/leads/store';
import { getLeads, getLeadsSummary } from './actions';
import { LeadsBoard } from './LeadsBoard';

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(['admin', 'editor', 'centre_staff']);
  const params = await searchParams;
  const initialStatusFilter = LEAD_STATUSES.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus)
    : undefined;

  if (!isDatabaseConfigured()) {
    return (
      <div className="max-w-2xl">
        <p className="adm-eyebrow">leads</p>
        <h1 className="adm-title mt-3">Leads</h1>
        <div
          role="alert"
          className="mt-8 rounded-[var(--radius-card)] border border-[var(--color-error-200)] bg-[var(--color-error-50)] px-5 py-4 text-sm font-medium text-[var(--color-error-600)]"
        >
          <code className="text-foreground">DATABASE_URL</code> is not set, so there is nowhere to
          store leads. Point it at any Postgres instance — no Supabase SDK is involved in this
          path — then run <code className="text-foreground">npm run db:migrate</code> to create the
          tables. See <code className="text-foreground">.env.example</code>.
        </div>
      </div>
    );
  }

  // Both already apply `centre_staff` scoping — going through the same
  // actions the client calls later means there's exactly one implementation
  // of "what can this role see," not a second copy that could drift from it.
  const [leads, stats] = await Promise.all([getLeads(), getLeadsSummary()]);

  return <LeadsBoard initialLeads={leads} initialStats={stats} initialStatusFilter={initialStatusFilter} />;
}
