import ids from './centre-ids.json';

/**
 * Hand-off of website enquiries to the external CRM (`POST …/externalInquirySave`, JSON).
 *
 * The CRM's contract (as given by its owner, and confirmed by a test request):
 *   mobile (required), email (required), first_name (required), last_name,
 *   state (required), city (required), center (required), course
 * where state / city / center / course are the CRM's own NUMERIC ids, not names.
 *
 * Behaviour observed from the live endpoint: no authentication; always HTTP 200; failures come back in the
 * body as `{"action":"error","messages":{"mobile":["The mobile has already been taken."]}}`. So the HTTP
 * status alone says nothing — the body decides.
 *
 * Each site centre maps to a CRM branch (and the branch's city and state) in `centre-ids.json`, built from
 * the legacy branch / cities / states exports. A lead with no mappable centre, or no email, is NOT sent
 * with invented values: it is kept here and marked `skipped` with the reason.
 */

type CentreIds = { center: number; city: number; state: number; crm: string };
const CENTRE_IDS = ids as Record<string, CentreIds>;

export type CrmStatus = 'routed' | 'duplicate' | 'rejected' | 'skipped' | 'failed';
export interface CrmOutcome {
  status: CrmStatus;
  /** Short, PII-free reason for logs and the admin. */
  detail: string;
}

export interface CrmPayload {
  mobile: string;
  email: string;
  first_name: string;
  last_name?: string;
  state: number;
  city: number;
  center: number;
  course?: number;
}

export interface CrmLeadInput {
  name: string;
  phone: string;
  email?: string;
  /** Slug of the centre the visitor chose, if any. */
  centreSlug?: string;
  /** CRM course id, if the course is mapped. */
  courseId?: number;
}

/** CRM branch ids for a site centre slug, or null when the centre is not mapped. */
export function crmIdsForCentre(slug: string | undefined): CentreIds | null {
  return slug ? (CENTRE_IDS[slug] ?? null) : null;
}

/** Ten-digit Indian mobile number: strips spaces, `+91`, a leading 0. */
export function normalizeMobile(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function splitName(full: string): { first: string; last?: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const first = parts[0] ?? '';
  const last = parts.slice(1).join(' ');
  return last ? { first, last } : { first };
}

export function toCrmPayload(lead: CrmLeadInput): { ok: true; payload: CrmPayload } | { ok: false; reason: string } {
  const mobile = normalizeMobile(lead.phone);
  if (!mobile) return { ok: false, reason: 'mobile is not a valid 10-digit Indian number' };
  const email = lead.email?.trim();
  if (!email) return { ok: false, reason: 'email missing (required by the CRM)' };
  const target = crmIdsForCentre(lead.centreSlug);
  if (!target) return { ok: false, reason: lead.centreSlug ? `centre "${lead.centreSlug}" has no CRM branch mapping` : 'no centre chosen (required by the CRM)' };
  const { first, last } = splitName(lead.name);
  if (!first) return { ok: false, reason: 'name missing' };

  return {
    ok: true,
    payload: {
      mobile,
      email,
      first_name: first,
      ...(last ? { last_name: last } : {}),
      state: target.state,
      city: target.city,
      center: target.center,
      ...(lead.courseId ? { course: lead.courseId } : {}),
    },
  };
}

const TIMEOUT_MS = 8_000;

/** Flattens the CRM's `messages` object into a short, field-only description (never echoes submitted values). */
function describeMessages(messages: unknown): { text: string; duplicateMobile: boolean } {
  if (!messages || typeof messages !== 'object') return { text: 'rejected', duplicateMobile: false };
  const entries = Object.entries(messages as Record<string, unknown>);
  const duplicateMobile = entries.some(
    ([field, v]) => field === 'mobile' && Array.isArray(v) && v.some((m) => /already been taken/i.test(String(m))),
  );
  const text = entries
    .map(([field, v]) => `${field}: ${(Array.isArray(v) ? v : [v]).map((m) => String(m)).join(' / ')}`)
    .join('; ')
    .slice(0, 300);
  return { text: text || 'rejected', duplicateMobile };
}

export async function sendToCrm(
  endpoint: string,
  payload: CrmPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<CrmOutcome> {
  let response: Response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    return { status: 'failed', detail: error instanceof Error && error.name === 'TimeoutError' ? 'timed out' : 'network error' };
  }
  if (!response.ok) return { status: 'failed', detail: `HTTP ${response.status}` };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { status: 'failed', detail: 'response was not JSON' };
  }
  const result = (body ?? {}) as { action?: unknown; messages?: unknown };
  if (result.action === 'error') {
    const { text, duplicateMobile } = describeMessages(result.messages);
    // The CRM already has this person: retrying cannot help and nothing was lost.
    if (duplicateMobile) return { status: 'duplicate', detail: 'mobile already in the CRM' };
    return { status: 'rejected', detail: text };
  }
  return { status: 'routed', detail: typeof result.action === 'string' ? result.action : 'ok' };
}
