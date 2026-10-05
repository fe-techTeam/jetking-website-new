import type { Route } from 'next';
import { ArrowUpRight, Building2, GraduationCap, Layers, Newspaper, PenLine, Users } from 'lucide-react';
import Link from 'next/link';
import { requireRole, seedCmsFromFixtures } from './actions';
import { listCollection } from '@/lib/cms/store';
import { isDatabaseConfigured } from '@/lib/leads/store';
import { getLeadsSummary } from './leads/actions';
import { StatCard, BarChartCard, DonutChartCard } from './DashboardWidgets';
import { ResetFixturesCard } from './ResetFixturesCard';
import { COLLECTIONS } from './registry';

export default async function AdminDashboard() {
  // Every role lands here — this is `requireRole`'s own redirect target for
  // "signed in but wrong role", so restricting it to a subset of roles would
  // bounce anyone outside that subset straight back to itself.
  const user = await requireRole(['admin', 'editor', 'centre_staff']);

  const rows = await Promise.all(
    COLLECTIONS.filter((c) => c.dashboard !== false).map(async (c) => ({ ...c, items: await listCollection(c.key) })),
  );
  const bars = rows.map((r) => ({
    label: r.label,
    value: r.items.length,
    href: `/admin/${r.route}` as Route,
  }));

  const totalContent = rows.reduce((sum, r) => sum + r.items.length, 0);
  const draftCount = rows.reduce(
    (sum, r) => sum + r.items.filter((item) => item.status === 'draft').length,
    0,
  );
  const publishedCount = totalContent - draftCount;

  const centresCount = rows.find((r) => r.key === 'centres')?.items.length ?? 0;
  // First collection with a draft — the natural "go fix this" destination for
  // the drafts stat card when there's more than one collection to check.
  const firstDraftRoute = rows.find((r) => r.items.some((item) => item.status === 'draft'))?.route;

  // Goes through the leads action (not the store directly) so `centre_staff`
  // gets the same centre-scoped count here as on the Leads page itself.
  const leadStats = isDatabaseConfigured() ? await getLeadsSummary() : null;

  const canEditContent = user.role !== 'centre_staff';
  const publishedPercent = totalContent > 0 ? Math.round((publishedCount / totalContent) * 100) : 0;
  const firstName = user.name.trim().split(/\s+/)[0] || 'there';
  const draftSummary =
    draftCount > 0
      ? `${draftCount} ${draftCount === 1 ? 'draft is' : 'drafts are'} waiting for review.`
      : 'Everything is published.';

  return (
    <div className="mx-auto max-w-6xl">
      <section className="adm-hero p-6 sm:p-8 lg:p-10" aria-labelledby="admin-welcome">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold tracking-[0.12em] text-white/85 uppercase">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#f97066]" />
          Dashboard
        </p>
        <h1
          id="admin-welcome"
          className="mt-4 max-w-2xl text-[1.75rem] leading-[1.1] font-extrabold tracking-[-0.03em] text-white sm:text-[2.25rem]"
        >
          Welcome back, {firstName}
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/80">
          {totalContent} records across {rows.length} collections. {draftSummary} Saving revalidates the
          site and triggers Guide re-ingest.
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {canEditContent ? (
            <>
              <Link href={'/admin/courses' as Route} className="adm-hero-chip">
                <GraduationCap aria-hidden="true" className="h-4 w-4" />
                Manage courses
              </Link>
              <Link href={'/admin/posts' as Route} className="adm-hero-chip">
                <Newspaper aria-hidden="true" className="h-4 w-4" />
                Write a post
              </Link>
            </>
          ) : null}
          {leadStats ? (
            <Link href={'/admin/leads' as Route} className="adm-hero-chip">
              <Users aria-hidden="true" className="h-4 w-4" />
              Review leads
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 opacity-70" />
            </Link>
          ) : null}
        </div>
      </section>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Total content"
          value={totalContent}
          meter={{ percent: publishedPercent, caption: `${publishedPercent}% published` }}
        />
        <StatCard
          icon={PenLine}
          label="Drafts awaiting review"
          value={draftCount}
          badge={draftCount > 0 ? 'Needs review' : 'All clear'}
          badgeTone={draftCount > 0 ? 'warn' : 'good'}
          href={draftCount > 0 && firstDraftRoute ? (`/admin/${firstDraftRoute}` as Route) : undefined}
        />
        <StatCard
          icon={Users}
          label="Leads"
          value={leadStats ? leadStats.total : '—'}
          badge={leadStats ? `${leadStats.byStatus.new} new` : 'Not configured'}
          badgeTone={leadStats && leadStats.byStatus.new > 0 ? 'warn' : 'neutral'}
          href={
            leadStats
              ? ((leadStats.byStatus.new > 0 ? '/admin/leads?status=new' : '/admin/leads') as Route)
              : undefined
          }
        />
        <StatCard icon={Building2} label="Centres" value={centresCount} href={'/admin/centres' as Route} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 [&>section]:h-full">
          <BarChartCard
            title="Content by type"
            description="Record count per collection, across draft and published."
            bars={bars}
          />
        </div>
        <div className="lg:col-span-2 [&>section]:h-full">
          <DonutChartCard
            title="Publish status"
            description="How much of the content is live versus still a draft."
            segments={[
              { label: 'Published', value: publishedCount, color: '#12b76a' },
              { label: 'Draft', value: draftCount, color: '#f79009' },
            ]}
          />
        </div>
      </div>

      {canEditContent ? <ResetFixturesCard action={seedCmsFromFixtures} /> : null}
    </div>
  );
}
