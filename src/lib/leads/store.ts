import 'server-only';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/lib/db/client';
import { leadActivities, leads, type Lead, type LeadActivity } from '@/lib/db/schema';
import type { leadInputSchema, LEAD_STATUSES } from './schema';
import type { z } from 'zod';

export { isDatabaseConfigured };

type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

function requireDb() {
  const db = getDb();
  if (!db) {
    throw new Error('DATABASE_URL is not set — the leads database is not configured.');
  }
  return db;
}

export async function listLeads(): Promise<Lead[]> {
  const db = requireDb();
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const db = requireDb();
  const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return row;
}

export async function listLeadActivities(leadId: string): Promise<LeadActivity[]> {
  const db = requireDb();
  return db
    .select()
    .from(leadActivities)
    .where(eq(leadActivities.leadId, leadId))
    .orderBy(desc(leadActivities.createdAt));
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const db = requireDb();
  const [row] = await db
    .insert(leads)
    .values({
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      courseInterest: input.courseInterest || null,
      city: input.city || null,
      source: input.source,
      persona: input.persona || null,
      notes: input.notes || null,
    })
    .returning();
  if (!row) throw new Error('Insert did not return a row.');
  await db.insert(leadActivities).values({
    leadId: row.id,
    kind: input.source === 'chatbot' ? 'chatbot' : 'note',
    body: input.source === 'chatbot' ? 'Handed off from a chatbot conversation.' : 'Lead created.',
  });
  return row;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<Lead | undefined> {
  const db = requireDb();
  const [row] = await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  if (row) {
    await db.insert(leadActivities).values({
      leadId: id,
      kind: 'status_change',
      body: `Status changed to "${status}".`,
    });
  }
  return row;
}

export async function addLeadNote(id: string, note: string): Promise<void> {
  const db = requireDb();
  await db.insert(leadActivities).values({ leadId: id, kind: 'note', body: note });
  await db.update(leads).set({ notes: note, updatedAt: new Date() }).where(eq(leads.id, id));
}

export async function deleteLead(id: string): Promise<void> {
  const db = requireDb();
  await db.delete(leads).where(eq(leads.id, id));
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
}

export async function getLeadStats(): Promise<LeadStats> {
  const db = requireDb();
  const rows = await db.select({ status: leads.status }).from(leads);
  const byStatus: Record<string, number> = { new: 0, contacted: 0, enrolled: 0, lost: 0 };
  for (const r of rows) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  return { total: rows.length, byStatus: byStatus as LeadStats['byStatus'] };
}

/* ── Assignment, follow-ups, calls, bulk work ─────────────────────────── */

export async function assignLead(id: string, assignee: string | null): Promise<Lead | undefined> {
  const db = requireDb();
  const [row] = await db.update(leads).set({ assignedTo: assignee, updatedAt: new Date() }).where(eq(leads.id, id)).returning();
  if (row) {
    await db.insert(leadActivities).values({
      leadId: id,
      kind: 'note',
      body: assignee ? `Assigned to ${assignee}.` : 'Unassigned.',
    });
  }
  return row;
}

export async function setLeadFollowUp(id: string, at: Date | null): Promise<Lead | undefined> {
  const db = requireDb();
  const [row] = await db.update(leads).set({ followUpAt: at, updatedAt: new Date() }).where(eq(leads.id, id)).returning();
  if (row) {
    await db.insert(leadActivities).values({
      leadId: id,
      kind: 'note',
      body: at ? `Follow-up scheduled for ${at.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}.` : 'Follow-up cleared.',
    });
  }
  return row;
}

export const CALL_OUTCOMES = ['connected', 'no_answer', 'busy', 'wrong_number', 'call_back_later'] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];
export const CALL_OUTCOME_LABEL: Record<CallOutcome, string> = {
  connected: 'Spoke to them',
  no_answer: 'No answer',
  busy: 'Busy',
  wrong_number: 'Wrong number',
  call_back_later: 'Asked to call back later',
};

export async function logLeadCall(id: string, outcome: CallOutcome, note: string): Promise<Lead | undefined> {
  const db = requireDb();
  await db.insert(leadActivities).values({
    leadId: id,
    kind: 'call',
    body: `${CALL_OUTCOME_LABEL[outcome]}${note.trim() ? ` — ${note.trim()}` : ''}`,
  });
  // A real conversation moves a brand-new lead on; anything else just refreshes it.
  const [row] = await db
    .update(leads)
    .set(outcome === 'connected' ? { status: sql`case when ${leads.status} = 'new' then 'contacted' else ${leads.status} end`, updatedAt: new Date() } : { updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return row;
}

export async function deleteLeads(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = requireDb();
  await db.delete(leads).where(inArray(leads.id, ids));
}

export interface ImportRow {
  name: string;
  phone?: string;
  email?: string;
  courseInterest?: string;
  city?: string;
  source?: string;
  notes?: string;
}

/** Inserts imported rows, skipping any whose phone number already exists. */
export async function importLeadRows(rows: ImportRow[], importer: string): Promise<{ added: number; duplicates: number }> {
  const db = requireDb();
  const existing = new Set((await db.select({ p: leads.phone }).from(leads)).map((r) => (r.p ?? '').replace(/\D/g, '')).filter(Boolean));
  let added = 0;
  let duplicates = 0;
  for (const r of rows) {
    const phone = (r.phone ?? '').replace(/[^\d+]/g, '');
    const digits = phone.replace(/\D/g, '');
    if (digits && existing.has(digits)) {
      duplicates++;
      continue;
    }
    const source = ['form', 'chatbot', 'centre', 'franchise'].includes(r.source ?? '') ? r.source! : 'form';
    const [row] = await db
      .insert(leads)
      .values({
        name: r.name.trim().slice(0, 200),
        phone: phone || null,
        email: r.email?.trim() || null,
        courseInterest: r.courseInterest?.trim() || null,
        city: r.city?.trim() || null,
        source,
        form: 'import',
        notes: r.notes?.trim() || null,
      })
      .returning({ id: leads.id });
    if (row) await db.insert(leadActivities).values({ leadId: row.id, kind: 'note', body: `Imported by ${importer}.` });
    if (digits) existing.add(digits);
    added++;
  }
  return { added, duplicates };
}
