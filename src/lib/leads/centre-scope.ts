import 'server-only';
import { listCollection } from '@/lib/cms/store';

/**
 * `centre_staff` scoping, resolved against the real CMS centre/city records
 * instead of guessing from a slug — the previous model matched a user's
 * `centreSlug` (e.g. "pune-shivajinagar") as a loose substring against a
 * lead's free-text `city` ("Pune"), which broke for any centre slug that
 * didn't happen to literally contain the city name. This resolves the
 * centre's *actual* city once, then does an exact case-insensitive match.
 */

export interface CentreOption {
  slug: string;
  name: string;
  cityName: string;
}

/** Every centre, for the Team & Access "assign a centre" picker — so an admin
 *  can only ever assign a centre that actually exists, not free text. */
export async function listCentreOptions(): Promise<CentreOption[]> {
  const [centres, cities] = await Promise.all([listCollection('centres'), listCollection('cities')]);
  const cityNameBySlug = new Map(cities.map((c) => [c.slug, c.name]));
  return centres
    .map((centre) => ({
      slug: centre.slug,
      name: centre.name,
      cityName: cityNameBySlug.get(centre.citySlug) ?? centre.citySlug,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The city a given centre slug actually belongs to, or `null` if the slug
 *  doesn't match a real centre (a stale assignment after a centre was
 *  renamed or removed) — callers treat `null` as "scope to nothing". */
export async function resolveCentreCity(centreSlug: string): Promise<string | null> {
  const options = await listCentreOptions();
  return options.find((c) => c.slug === centreSlug)?.cityName ?? null;
}

export function cityMatches(scopeCity: string | null, leadCity: string | null): boolean {
  if (!scopeCity || !leadCity) return false;
  return scopeCity.trim().toLowerCase() === leadCity.trim().toLowerCase();
}

/** In scope: the lead's city is the staff member's centre city, or it was enquired for that exact centre. */
export function leadInScope(scopeCity: string | null, centreSlug: string | null, lead: { city: string | null; centreSlug: string | null }): boolean {
  return cityMatches(scopeCity, lead.city) || (!!centreSlug && lead.centreSlug === centreSlug);
}

/** Filters to a centre-staff member's leads. `restricted` leads with no resolvable scope see NOTHING (fail closed). */
export function scopeLeadList<T extends { city: string | null; centreSlug: string | null }>(restricted: boolean, scopeCity: string | null, centreSlug: string | null, leads: T[]): T[] {
  if (!restricted) return leads;
  return leads.filter((l) => leadInScope(scopeCity, centreSlug, l));
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);
