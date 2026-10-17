import 'server-only';
import { and, desc, eq, gte } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { leadActivities, leads } from '@/lib/db/schema';
import { listCollection } from '@/lib/cms/store';

/**
 * Stores a public enquiry (any form, the chatbot hand-off, the exit-intent popup) as a row in `leads`
 * with every field mapped: the channel, the form it came from, the visitor's city/centre/course resolved
 * against the CMS records (so the admin filters and centre-staff scoping match on real names), the
 * qualification and message, and the campaign attribution. Runs before the CRM hand-off so a lead is
 * never lost to a CRM outage; callers treat a failure here as non-fatal.
 */

export interface EnquiryInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  centre?: string;
  qualification?: string;
  courseSlug?: string;
  message?: string;
  persona?: string;
  source: string;
  visitorId?: string;
  journeyStage?: string;
  intent?: string;
  accountId?: string;
  utm?: { source?: string; medium?: string; campaign?: string; content?: string; landingPage?: string };
}

const norm = (v: string | undefined) => (v ?? '').trim().toLowerCase();
const nullable = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

/** `chatbot` for the assistant, `centre` for a centre page's own form, `franchise` for franchise enquiries, else `form`. */
function channelOf(source: string): string {
  if (source === 'jetking-ai-chat') return 'chatbot';
  if (/^centre|centre-/.test(source) || /^\/centres\//.test(source)) return 'centre';
  if (/franchise/.test(source)) return 'franchise';
  return 'form';
}

/** Same person re-submitting (double click, page refresh, two forms) inside this window is one lead. */
const DUPLICATE_WINDOW_MS = 15 * 60_000;

export async function saveEnquiry(input: EnquiryInput): Promise<{ id: string; duplicate: boolean } | null> {
  const db = getDb();
  if (!db) return null;

  const [cities, centres, courses] = await Promise.all([
    listCollection('cities'),
    listCollection('centres'),
    listCollection('courses'),
  ]);

  const centre = input.centre ? centres.find((c) => c.slug === input.centre) : undefined;
  const cityKey = norm(input.city);
  const city =
    cities.find((c) => c.slug === (centre?.citySlug ?? '') || norm(c.slug) === cityKey || norm(c.name) === cityKey) ?? undefined;
  const course = input.courseSlug ? courses.find((c) => c.slug === input.courseSlug) : undefined;

  const phone = input.phone.replace(/[^\d+]/g, '');
  const form = input.source.slice(0, 200);

  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const [existing] = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.phone, phone), eq(leads.form, form), gte(leads.createdAt, since)))
    .orderBy(desc(leads.createdAt))
    .limit(1);
  if (existing) {
    await db.insert(leadActivities).values({ leadId: existing.id, kind: 'note', body: 'Submitted the same form again.' });
    return { id: existing.id, duplicate: true };
  }

  const persona = ['student', 'parent', 'professional', 'franchise'].includes(input.persona ?? '') ? input.persona! : null;
  const [row] = await db
    .insert(leads)
    .values({
      name: input.name.trim(),
      phone,
      email: nullable(input.email),
      courseInterest: course?.title ?? null,
      courseSlug: course?.slug ?? nullable(input.courseSlug),
      city: city?.name ?? nullable(input.city),
      state: nullable(input.state) ?? city?.state ?? null,
      centreSlug: centre?.slug ?? null,
      centreName: centre?.name ?? null,
      qualification: nullable(input.qualification),
      message: nullable(input.message),
      source: channelOf(input.source),
      form,
      persona,
      visitorId: nullable(input.visitorId),
      accountId: nullable(input.accountId),
      journeyStage: nullable(input.journeyStage),
      intent: nullable(input.intent),
      utmSource: nullable(input.utm?.source),
      utmMedium: nullable(input.utm?.medium),
      utmCampaign: nullable(input.utm?.campaign),
      utmContent: nullable(input.utm?.content),
      landingPage: nullable(input.utm?.landingPage),
    })
    .returning({ id: leads.id });
  if (!row) return null;

  await db.insert(leadActivities).values({
    leadId: row.id,
    kind: channelOf(input.source) === 'chatbot' ? 'chatbot' : 'note',
    body:
      channelOf(input.source) === 'chatbot'
        ? 'Handed off from a chatbot conversation.'
        : `Enquiry received from ${form}${course ? ` about ${course.title}` : ''}.`,
  });
  return { id: row.id, duplicate: false };
}

export async function setCrmStatus(id: string, status: 'routed' | 'failed'): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.update(leads).set({ crmStatus: status }).where(eq(leads.id, id));
}
