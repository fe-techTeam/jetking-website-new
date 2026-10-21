import centreCoordinates from '@/content/centre-coordinates.json';

type LatLng = { lat: number; lng: number };

const COORD_BY_NAME = centreCoordinates as Record<string, LatLng>;

/** Great-circle distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** "Borivali West" → also try "Borivali"; drop Jetking prefix noise. */
function nameVariants(raw: string | undefined | null): string[] {
  const hint = raw?.trim();
  if (!hint) return [];
  const out: string[] = [hint];
  const noJetking = hint.replace(/^jetking\s+/i, '').trim();
  if (noJetking && noJetking.toLowerCase() !== hint.toLowerCase()) out.push(noJetking);
  const noCardinal = noJetking
    .replace(/\s+(west|east|north|south|w\.?|e\.?|n\.?|s\.?)\s*$/i, '')
    .trim();
  if (noCardinal && !out.some((v) => v.toLowerCase() === noCardinal.toLowerCase())) {
    out.push(noCardinal);
  }
  return out;
}

function lookupExact(hint: string): LatLng | null {
  const key = Object.keys(COORD_BY_NAME).find((k) => k.toLowerCase() === hint.toLowerCase());
  return key ? COORD_BY_NAME[key]! : null;
}

function lookupPartial(hint: string): LatLng | null {
  const needle = hint.toLowerCase();
  if (needle.length < 3) return null;
  // Prefer the longest key that contains / is contained by the hint (more specific locality).
  const matches = Object.keys(COORD_BY_NAME)
    .filter((k) => {
      const key = k.toLowerCase();
      return key.includes(needle) || needle.includes(key);
    })
    .sort((a, b) => b.length - a.length);
  return matches[0] ? COORD_BY_NAME[matches[0]!]! : null;
}

function lookupNamedCoords(hints: Array<string | undefined | null>): LatLng | null {
  const variants = hints.flatMap(nameVariants);
  for (const hint of variants) {
    const exact = lookupExact(hint);
    if (exact) return exact;
  }
  for (const hint of variants) {
    const partial = lookupPartial(hint);
    if (partial) return partial;
  }
  return null;
}

/**
 * Prefer stored centre geo; otherwise locality / centre name from the coordinate table.
 * City is last resort — using it first made every Mumbai centre share one point (and show ~0 m
 * when the visitor was near that city centroid).
 */
export function resolveCentreCoords(centre: {
  name: string;
  locality?: string;
  cityName?: string;
  geo?: LatLng | null;
}): LatLng | null {
  if (
    centre.geo &&
    Number.isFinite(centre.geo.lat) &&
    Number.isFinite(centre.geo.lng) &&
    !(centre.geo.lat === 0 && centre.geo.lng === 0)
  ) {
    return centre.geo;
  }
  return (
    lookupNamedCoords([centre.locality, centre.name]) ??
    lookupNamedCoords([centre.cityName])
  );
}

export type RankedCentre<T> = T & { distanceKm: number };

/** Nearest first. Centres without resolvable coordinates are omitted. */
export function rankCentresByDistance<
  T extends { name: string; locality?: string; cityName?: string; geo?: LatLng | null },
>(centres: T[], origin: LatLng): RankedCentre<T>[] {
  return centres
    .map((centre) => {
      const coord = resolveCentreCoords(centre);
      return coord ? { ...centre, distanceKm: haversineKm(origin, coord) } : null;
    })
    .filter((row): row is RankedCentre<T> => row !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/** Human distance for badges — never prints a misleading "0 m". */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '—';
  const meters = km * 1000;
  if (meters < 100) return '< 100 m';
  if (km < 1) return `${Math.round(meters)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
