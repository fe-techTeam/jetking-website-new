/**
 * Campaign attribution (UTM) — capture, storage and read-back.
 *
 * Landing pages carry `utm_source`, `utm_medium`, `utm_campaign` and `utm_content`
 * (e.g. `/?utm_source=google&utm_medium=cpc&utm_campaign=bca-admissions-2026&utm_content=ad-a`).
 * `src/proxy.ts` stores them in the readable `jk_utm` cookie on the first request, so the
 * values are already there before any client script runs and survive navigation. From then on:
 *   - `/api/enquiry` merges them into every lead (all forms — nothing to wire per form),
 *   - `track()` adds them to every analytics event.
 * A visit with new UTM parameters replaces the stored set (last campaign click wins); a visit
 * without any leaves it untouched for the cookie's 30 days.
 *
 * Edge-safe: no Node or DOM APIs at module level.
 */

export const UTM_COOKIE = 'jk_utm';
export const UTM_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface UtmAttribution {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  /** Path the visitor landed on when the parameters arrived. */
  landingPage?: string;
}

const MAX_LEN = 100;

/** Trim, drop control chars and cap the length — these values end up in a CRM. */
function clean(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  // eslint-disable-next-line no-control-regex
  const v = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_LEN);
  return v || undefined;
}

/** Reads the four UTM parameters from a URL's query string. `undefined` when none is present. */
export function utmFromParams(params: URLSearchParams, landingPath: string): UtmAttribution | undefined {
  const utm: UtmAttribution = {
    source: clean(params.get('utm_source')),
    medium: clean(params.get('utm_medium')),
    campaign: clean(params.get('utm_campaign')),
    content: clean(params.get('utm_content')),
  };
  if (!utm.source && !utm.medium && !utm.campaign && !utm.content) return undefined;
  utm.landingPage = landingPath.slice(0, 200);
  return utm;
}

/** Plain JSON — the cookie API percent-encodes the value itself, so encoding here would double-encode it. */
export function encodeUtm(utm: UtmAttribution): string {
  return JSON.stringify(utm);
}

export function decodeUtm(raw: string | undefined | null): UtmAttribution | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Record<string, unknown>;
    const pick = (k: string) => (typeof parsed[k] === 'string' ? clean(parsed[k] as string) : undefined);
    const utm: UtmAttribution = {
      source: pick('source'),
      medium: pick('medium'),
      campaign: pick('campaign'),
      content: pick('content'),
      landingPage: pick('landingPage'),
    };
    return utm.source || utm.medium || utm.campaign || utm.content ? utm : undefined;
  } catch {
    return undefined;
  }
}

/** Reads one cookie out of a raw `Cookie` header / `document.cookie` string. */
export function cookieValue(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return undefined;
}

/** Flat, CRM-style keys (`utm_source`, …) — what leads and analytics events carry. */
export function utmToFlat(utm: UtmAttribution | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (utm?.source) out.utm_source = utm.source;
  if (utm?.medium) out.utm_medium = utm.medium;
  if (utm?.campaign) out.utm_campaign = utm.campaign;
  if (utm?.content) out.utm_content = utm.content;
  if (utm?.landingPage) out.landing_page = utm.landingPage;
  return out;
}

/** Browser-side read of the stored attribution. */
export function readUtmClient(): UtmAttribution | undefined {
  if (typeof document === 'undefined') return undefined;
  return decodeUtm(cookieValue(document.cookie, UTM_COOKIE));
}
