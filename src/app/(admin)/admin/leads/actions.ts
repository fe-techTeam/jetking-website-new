'use server';

import { requireRole, type CurrentUser } from '../actions';
import {
  createLead,
  deleteLead,
  getLead,
  listLeadActivities,
  listLeads,
  updateLeadStatus,
  addLeadNote,
  getLeadStats,
  assignLead,
  setLeadFollowUp,
  logLeadCall,
  deleteLeads,
  importLeadRows,
  CALL_OUTCOMES,
  type CallOutcome,
  type ImportRow,
  type LeadStatus,
  type LeadStats,
} from '@/lib/leads/store';
import { resolveCentreCity, cityMatches } from '@/lib/leads/centre-scope';
import { leadInputSchema, leadStatusSchema } from '@/lib/leads/schema';
import type { Lead, LeadActivity } from '@/lib/db/schema';
import { recordAudit } from '@/lib/audit/log';
import { listUsers } from '@/lib/auth/users';

const STAFF_ROLES = ['admin', 'editor', 'centre_staff'] as const;

/** `centre_staff` only ever see/touch leads from their own centre's city,
 *  resolved once per call against the real CMS centre/city records (see
 *  `resolveCentreCity`) rather than guessed from the centre slug's text. */
async function scopeCityFor(user: CurrentUser): Promise<string | null> {
  if (user.role !== 'centre_staff') return null;
  if (!user.centreSlug) return null;
  return resolveCentreCity(user.centreSlug);
}

/** In scope: the lead's city is the staff member's centre city, or it was enquired for that exact centre. */
function inScope(scopeCity: string | null, centreSlug: string | null, lead: Lead): boolean {
  return cityMatches(scopeCity, lead.city) || (centreSlug !== null && lead.centreSlug === centreSlug);
}

function scopeLeads(scopeCity: string | null, leads: Lead[], centreSlug: string | null = null): Lead[] {
  if (scopeCity === null) return leads;
  return leads.filter((l) => inScope(scopeCity, centreSlug, l));
}

async function requireLeadInScope(leadId: string, user: CurrentUser): Promise<Lead> {
  const lead = await getLead(leadId);
  if (!lead) throw new Error('Lead not found.');
  if (user.role === 'centre_staff') {
    const scopeCity = await scopeCityFor(user);
    if (!inScope(scopeCity, user.centreSlug, lead)) throw new Error('Lead not found.');
  }
  return lead;
}

export async function getLeads(): Promise<Lead[]> {
  const user = await requireRole([...STAFF_ROLES]);
  const scopeCity = await scopeCityFor(user);
  return scopeLeads(scopeCity, await listLeads(), user.centreSlug);
}

export async function getLeadsSummary(): Promise<LeadStats> {
  const user = await requireRole([...STAFF_ROLES]);
  if (user.role !== 'centre_staff') return getLeadStats();

  const scopeCity = await scopeCityFor(user);
  const scoped = scopeLeads(scopeCity, await listLeads(), user.centreSlug);
  const byStatus = { new: 0, contacted: 0, enrolled: 0, lost: 0 };
  for (const lead of scoped) byStatus[lead.status as LeadStatus] = (byStatus[lead.status as LeadStatus] ?? 0) + 1;
  return { total: scoped.length, byStatus };
}

export async function getLeadTimeline(leadId: string): Promise<LeadActivity[]> {
  const user = await requireRole([...STAFF_ROLES]);
  await requireLeadInScope(leadId, user);
  return listLeadActivities(leadId);
}

export async function submitLead(
  formData: FormData,
): Promise<{ ok: true; lead: Lead } | { ok: false; error: string }> {
  const user = await requireRole([...STAFF_ROLES]);
  const defaultCity = user.role === 'centre_staff' ? await scopeCityFor(user) : null;

  const raw = {
    name: String(formData.get('name') ?? ''),
    phone: String(formData.get('phone') ?? ''),
    email: String(formData.get('email') ?? ''),
    courseInterest: String(formData.get('courseInterest') ?? ''),
    city: String(formData.get('city') ?? defaultCity ?? ''),
    source: String(formData.get('source') ?? 'form'),
    persona: String(formData.get('persona') ?? ''),
    notes: String(formData.get('notes') ?? ''),
  };

  const parsed = leadInputSchema.safeParse({
    ...raw,
    persona: raw.persona || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid lead.' };
  }

  try {
    const lead = await createLead(parsed.data);
    void recordAudit(user, 'lead.create', 'lead', lead.id, `Added lead "${lead.name}"`);
    return { ok: true, lead };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Could not save lead.' };
  }
}

export async function moveLeadStatus(
  leadId: string,
  status: string,
): Promise<{ ok: true; lead: Lead } | { ok: false; error: string }> {
  const user = await requireRole([...STAFF_ROLES]);

  const parsedStatus = leadStatusSchema.safeParse(status);
  if (!parsedStatus.success) {
    return { ok: false, error: 'Invalid status.' };
  }

  try {
    await requireLeadInScope(leadId, user);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lead not found.' };
  }

  const lead = await updateLeadStatus(leadId, parsedStatus.data as LeadStatus);
  if (!lead) return { ok: false, error: 'Lead not found.' };
  void recordAudit(user, 'lead.status_change', 'lead', lead.id, `Moved "${lead.name}" to ${lead.status}`);
  return { ok: true, lead };
}

export async function addNote(leadId: string, note: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole([...STAFF_ROLES]);
  if (!note.trim()) return { ok: false, error: 'Note is empty.' };
  let lead: Lead;
  try {
    lead = await requireLeadInScope(leadId, user);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lead not found.' };
  }
  await addLeadNote(leadId, note.trim());
  void recordAudit(user, 'lead.note', 'lead', leadId, `Added a note to "${lead.name}"`);
  return { ok: true };
}

export async function removeLead(leadId: string): Promise<void> {
  const user = await requireRole([...STAFF_ROLES]);
  const lead = await requireLeadInScope(leadId, user);
  await deleteLead(leadId);
  void recordAudit(user, 'lead.delete', 'lead', leadId, `Deleted lead "${lead.name}"`);
}

/* ── Assignment, follow-ups, calls, bulk work, import ─────────────────── */

async function leadsInScope(ids: string[], user: CurrentUser): Promise<Lead[]> {
  const out: Lead[] = [];
  for (const id of ids.slice(0, 500)) {
    try {
      out.push(await requireLeadInScope(id, user));
    } catch {
      /* not visible to this user — skipped */
    }
  }
  return out;
}

/** Names a lead can be assigned to: active staff. A centre's own staff only ever see themselves. */
export async function listAssignees(): Promise<string[]> {
  const user = await requireRole([...STAFF_ROLES]);
  if (user.role === 'centre_staff') return [user.name];
  try {
    return (await listUsers()).filter((u) => u.status === 'active').map((u) => u.name).sort((a, b) => a.localeCompare(b));
  } catch {
    return [user.name];
  }
}

export async function assignLeads(ids: string[], assignee: string | null): Promise<{ ok: true; leads: Lead[] } | { ok: false; error: string }> {
  const user = await requireRole([...STAFF_ROLES]);
  const target = assignee?.trim() || null;
  if (target && target.length > 120) return { ok: false, error: 'That name is too long.' };
  const scoped = await leadsInScope(ids, user);
  const updated: Lead[] = [];
  for (const lead of scoped) {
    const row = await assignLead(lead.id, target);
    if (row) updated.push(row);
  }
  void recordAudit(user, 'lead.assign', 'lead', null, `${target ? `Assigned ${updated.length} lead(s) to ${target}` : `Unassigned ${updated.length} lead(s)`}`);
  return { ok: true, leads: updated };
}

export async function scheduleFollowUp(id: string, iso: string | null): Promise<{ ok: true; lead: Lead } | { ok: false; error: string }> {
  const user = await requireRole([...STAFF_ROLES]);
  let when: Date | null = null;
  if (iso) {
    when = new Date(iso);
    if (Number.isNaN(when.getTime())) return { ok: false, error: 'That date is not valid.' };
  }
  try {
    await requireLeadInScope(id, user);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lead not found.' };
  }
  const lead = await setLeadFollowUp(id, when);
  if (!lead) return { ok: false, error: 'Lead not found.' };
  void recordAudit(user, 'lead.follow_up', 'lead', id, `${when ? 'Scheduled' : 'Cleared'} a follow-up for "${lead.name}"`);
  return { ok: true, lead };
}

export async function recordCall(id: string, outcome: string, note: string): Promise<{ ok: true; lead: Lead } | { ok: false; error: string }> {
  const user = await requireRole([...STAFF_ROLES]);
  if (!(CALL_OUTCOMES as readonly string[]).includes(outcome)) return { ok: false, error: 'Choose what happened on the call.' };
  try {
    await requireLeadInScope(id, user);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Lead not found.' };
  }
  const lead = await logLeadCall(id, outcome as CallOutcome, note.slice(0, 1000));
  if (!lead) return { ok: false, error: 'Lead not found.' };
  void recordAudit(user, 'lead.call', 'lead', id, `Logged a call with "${lead.name}" (${outcome})`);
  return { ok: true, lead };
}

export async function removeLeads(ids: string[]): Promise<{ deleted: number }> {
  const user = await requireRole([...STAFF_ROLES]);
  const scoped = await leadsInScope(ids, user);
  await deleteLeads(scoped.map((l) => l.id));
  void recordAudit(user, 'lead.delete', 'lead', null, `Deleted ${scoped.length} lead(s)`);
  return { deleted: scoped.length };
}

export async function importLeads(rows: ImportRow[]): Promise<{ added: number; duplicates: number; invalid: number }> {
  const user = await requireRole(['admin', 'editor']);
  const valid = rows.filter((r) => r.name && r.name.trim() && (r.phone?.trim() || r.email?.trim())).slice(0, 2000);
  const result = await importLeadRows(valid, user.name);
  void recordAudit(user, 'lead.import', 'lead', null, `Imported ${result.added} lead(s) (${result.duplicates} duplicates skipped)`);
  return { ...result, invalid: rows.length - valid.length };
}
