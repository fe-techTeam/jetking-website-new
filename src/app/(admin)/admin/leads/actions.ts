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
  type LeadStatus,
  type LeadStats,
} from '@/lib/leads/store';
import { resolveCentreCity, cityMatches } from '@/lib/leads/centre-scope';
import { leadInputSchema, leadStatusSchema } from '@/lib/leads/schema';
import type { Lead, LeadActivity } from '@/lib/db/schema';
import { recordAudit } from '@/lib/audit/log';

const STAFF_ROLES = ['admin', 'editor', 'centre_staff'] as const;

/** `centre_staff` only ever see/touch leads from their own centre's city,
 *  resolved once per call against the real CMS centre/city records (see
 *  `resolveCentreCity`) rather than guessed from the centre slug's text. */
async function scopeCityFor(user: CurrentUser): Promise<string | null> {
  if (user.role !== 'centre_staff') return null;
  if (!user.centreSlug) return null;
  return resolveCentreCity(user.centreSlug);
}

function scopeLeads(scopeCity: string | null, leads: Lead[]): Lead[] {
  if (scopeCity === null) return leads;
  return leads.filter((l) => cityMatches(scopeCity, l.city));
}

async function requireLeadInScope(leadId: string, user: CurrentUser): Promise<Lead> {
  const lead = await getLead(leadId);
  if (!lead) throw new Error('Lead not found.');
  if (user.role === 'centre_staff') {
    const scopeCity = await scopeCityFor(user);
    if (!cityMatches(scopeCity, lead.city)) throw new Error('Lead not found.');
  }
  return lead;
}

export async function getLeads(): Promise<Lead[]> {
  const user = await requireRole([...STAFF_ROLES]);
  const scopeCity = await scopeCityFor(user);
  return scopeLeads(scopeCity, await listLeads());
}

export async function getLeadsSummary(): Promise<LeadStats> {
  const user = await requireRole([...STAFF_ROLES]);
  if (user.role !== 'centre_staff') return getLeadStats();

  const scopeCity = await scopeCityFor(user);
  const scoped = scopeLeads(scopeCity, await listLeads());
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
