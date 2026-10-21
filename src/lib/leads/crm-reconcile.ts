import 'server-only';
import type { Lead } from '@/lib/db/schema';
import { handoffLeadToCrm, type HandoffResult } from '@/lib/leads/crm-handoff';
import { needsCrmPush } from '@/lib/leads/crm-status';

/** Cap a single admin reconcile run so a large backlog cannot block the request. */
export const CRM_RECONCILE_BATCH_LIMIT = 100;

/** Pause between CRM posts during a batch (ms) to avoid hammering the endpoint. */
export const CRM_RECONCILE_GAP_MS = 200;

export function leadToCrmHandoffInput(lead: Lead) {
  return {
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
      form: lead.form,
      persona: lead.persona,
      notes: lead.notes,
      receivedAt: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : String(lead.createdAt),
      reconcile: true,
    },
  };
}

/** Push one admin-panel lead to the CRM. Caller must have already checked scope. */
export async function pushLeadRowToCrm(lead: Lead): Promise<HandoffResult> {
  return handoffLeadToCrm(leadToCrmHandoffInput(lead));
}

export type ReconcileCounts = {
  attempted: number;
  /** Successfully saved as its own CRM entry this run. */
  pushed: number;
  /** CRM API rejected because mobile already exists — still unmatched for a separate entry. */
  blockedSameMobile: number;
  /** Still not matched after the attempt (failed / rejected / skipped / none). */
  stillUnmatched: number;
};

export function emptyReconcileCounts(): ReconcileCounts {
  return { attempted: 0, pushed: 0, blockedSameMobile: 0, stillUnmatched: 0 };
}

export function tallyHandoff(counts: ReconcileCounts, result: HandoffResult): void {
  counts.attempted += 1;
  if (result.status === 'routed') counts.pushed += 1;
  else if (result.status === 'duplicate') counts.blockedSameMobile += 1;
  else counts.stillUnmatched += 1;
}

export function filterUnmatchedLeads(leads: Lead[]): Lead[] {
  return leads.filter((l) => needsCrmPush(l.crmStatus));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
