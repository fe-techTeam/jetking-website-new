import 'server-only';
import { content } from '@/lib/content';
import { crmIdsForCentre, sendToCrm, toCrmPayload, type CrmStatus } from '@/lib/crm/smartrain';
import { noteCrmPersonExists, setCrmStatus, type CrmHandoffStatus } from '@/lib/leads/intake';
import { leadForLog, safeError } from '@/lib/pii';

/**
 * Shared CRM hand-off for every lead path (website enquiry, chatbot, admin “Add lead”,
 * journey soft-save). Admin panel storage is the caller’s job; this module only pushes
 * to the external CRM and updates `crm_status` when a lead id is known.
 */

export interface CrmHandoffInput {
  /** Admin-panel lead id, when already stored. */
  leadId?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  /** Preferred centre slug (visitor pick or centre_staff scope). */
  centreSlug?: string | null;
  /** City name or slug — used to pick a CRM-mapped centre when none was chosen. */
  city?: string | null;
  /**
   * Full body for a generic (non-Smartrain) CRM_ENDPOINT JSON post.
   * When omitted, a minimal enquiry-shaped object is sent.
   */
  raw?: Record<string, unknown>;
}

/**
 * Centre the CRM should receive: the chosen slug if mapped, else the first
 * CRM-mapped centre in the given city.
 */
export async function resolveCentreForCrm(
  centreSlug: string | undefined | null,
  city: string | undefined | null,
): Promise<string | undefined> {
  if (centreSlug && crmIdsForCentre(centreSlug)) return centreSlug;
  const key = city?.trim().toLowerCase();
  if (!key) return centreSlug ?? undefined;
  const cities = await content.listCities();
  const match = cities.find((c) => c.slug === key || c.name.toLowerCase() === key);
  if (!match) return centreSlug ?? undefined;
  const centres = await content.listCentres({ citySlug: match.slug });
  return centres.find((c) => crmIdsForCentre(c.slug))?.slug ?? centreSlug ?? undefined;
}

export type HandoffResult = {
  routed: boolean;
  status: CrmHandoffStatus | 'none';
  detail?: string;
};

/**
 * Push one lead to the configured CRM. Never throws to the visitor/admin UX —
 * failures are logged and recorded on the lead row when possible.
 */
export async function handoffLeadToCrm(input: CrmHandoffInput): Promise<HandoffResult> {
  const endpoint = process.env.CRM_ENDPOINT;
  const leadId = input.leadId ?? null;

  if (!endpoint) {
    console.warn('[crm:unrouted]', leadForLog({ name: input.name, phone: input.phone, source: 'crm-handoff' }));
    return { routed: false, status: 'none' };
  }

  if (process.env.CRM_PROVIDER === 'smartrain') {
    const centreSlug = await resolveCentreForCrm(input.centreSlug, input.city);
    const built = toCrmPayload({
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      centreSlug,
    });
    if (!built.ok) {
      console.warn('[crm:skipped]', built.reason);
      if (leadId) await setCrmStatus(leadId, 'skipped', built.reason).catch(() => {});
      return { routed: false, status: 'skipped', detail: built.reason };
    }
    const outcome = await sendToCrm(endpoint, built.payload);
    if (outcome.status === 'failed' || outcome.status === 'rejected') {
      console.error('[crm:failed]', outcome.status, outcome.detail);
    }
    const status = outcome.status as CrmStatus;
    const detail =
      status === 'routed'
        ? null
        : status === 'duplicate'
          ? 'Mobile already exists in CRM (unique:users) — changing centre does not create a second user'
          : outcome.detail;
    if (leadId) {
      await setCrmStatus(leadId, status, detail).catch(() => {});
      // Same mobile, new place/course: CRM will not create another lead — keep the panel row and note it.
      if (status === 'duplicate') {
        const place = [centreSlug, input.city].filter(Boolean).join(' / ') || 'unknown place';
        await noteCrmPersonExists(leadId, place).catch(() => {});
      }
    }
    return { routed: status === 'routed', status, detail: detail ?? undefined };
  }

  const body =
    input.raw ??
    ({
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      city: input.city || undefined,
      centre: input.centreSlug || undefined,
      receivedAt: new Date().toISOString(),
    } satisfies Record<string, unknown>);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.CRM_API_KEY ? { authorization: `Bearer ${process.env.CRM_API_KEY}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`CRM returned ${response.status}`);
    if (leadId) await setCrmStatus(leadId, 'routed', null).catch(() => {});
    return { routed: true, status: 'routed' };
  } catch (error) {
    const detail = error instanceof Error && error.name === 'TimeoutError' ? 'timed out' : 'network or CRM error';
    console.error('[crm:failed]', leadForLog(body), safeError(error));
    if (leadId) await setCrmStatus(leadId, 'failed', detail).catch(() => {});
    return { routed: false, status: 'failed', detail };
  }
}
