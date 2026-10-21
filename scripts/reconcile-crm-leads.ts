/**
 * Reconcile admin-panel leads with the CRM: push every row whose crm_status is
 * not yet `routed`. Same mobile can need a separate CRM entry (other centre).
 * Today the API may return "mobile already taken" — those stay unmatched for retry.
 *
 * Run with: npm run reconcile:crm-leads
 *           npm run reconcile:crm-leads -- --dry-run
 *           npm run reconcile:crm-leads -- --limit 50
 */
import './load-env';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { desc, inArray } from 'drizzle-orm';
import { leads } from '../src/lib/db/schema';
import { CRM_UNMATCHED_STATUSES } from '../src/lib/leads/crm-status';
import { handoffLeadToCrm } from '../src/lib/leads/crm-handoff';

const GAP_MS = 200;

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set — nothing to reconcile. See .env.example.');
    process.exit(1);
  }
  if (!process.env.CRM_ENDPOINT) {
    console.error('CRM_ENDPOINT is not set — configure the CRM webhook first.');
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');
  const limit = Math.max(1, Math.min(5_000, Number(argValue('--limit') ?? 500) || 500));

  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  try {
    const rows = await db
      .select()
      .from(leads)
      .where(inArray(leads.crmStatus, [...CRM_UNMATCHED_STATUSES]))
      .orderBy(desc(leads.createdAt))
      .limit(limit);

    console.log(`Found ${rows.length} unmatched lead(s) (limit ${limit}).${dryRun ? ' Dry run — no CRM calls.' : ''}`);

    let pushed = 0;
    let blockedSameMobile = 0;
    let stillUnmatched = 0;

    for (let i = 0; i < rows.length; i++) {
      const lead = rows[i]!;
      if (dryRun) {
        console.log(`[dry-run] ${lead.id} ${lead.name} crm_status=${lead.crmStatus}`);
        continue;
      }
      const result = await handoffLeadToCrm({
        leadId: lead.id,
        name: lead.name,
        phone: lead.phone ?? '',
        email: lead.email,
        centreSlug: lead.centreSlug,
        city: lead.city,
        raw: {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          city: lead.city,
          centre: lead.centreSlug,
          courseInterest: lead.courseInterest,
          source: lead.source,
          reconcile: true,
          receivedAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : String(lead.createdAt),
        },
      });
      // handoff already updates crm_status when leadId is set; keep a local tally.
      if (result.status === 'routed') pushed += 1;
      else if (result.status === 'duplicate') blockedSameMobile += 1;
      else stillUnmatched += 1;
      console.log(`${lead.id} → ${result.status}${result.detail ? ` (${result.detail})` : ''}`);
      if (i < rows.length - 1) await new Promise((r) => setTimeout(r, GAP_MS));
    }

    if (!dryRun) {
      console.log(`Done. pushed=${pushed} blockedSameMobile=${blockedSameMobile} stillUnmatched=${stillUnmatched}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
