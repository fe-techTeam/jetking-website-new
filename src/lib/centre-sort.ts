/**
 * Shared centre-list ordering for CMS settings: name, manual sortOrder, or a
 * city-wise shuffle that stays fixed for N days then reshuffles centres within
 * each city (Delhi’s centres among themselves, Mumbai’s among themselves, …).
 */

export type CentresListSort = 'name' | 'manual' | 'shuffle';

export type CentresSortSettings = {
  listSort: CentresListSort;
  /** Days a shuffle order stays fixed (1 = every day, 7 = weekly). */
  shuffleEveryDays: number;
};

export const CENTRES_SORT_DEFAULTS: CentresSortSettings = {
  listSort: 'name',
  shuffleEveryDays: 1,
};

type SortableCentre = {
  slug: string;
  name: string;
  /** City grouping for shuffle — centres without a city share one bucket. */
  citySlug?: string | null;
  sortOrder?: number | null;
};

/** UTC day-bucket so SSR and requests in the same window share one order. */
export function shuffleBucket(intervalDays: number, nowMs = Date.now()): number {
  const days = Math.max(1, Math.floor(intervalDays) || 1);
  const utcDay = Math.floor(nowMs / 86_400_000);
  return Math.floor(utcDay / days);
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(parts: string[]): number {
  let h = 2166136261;
  for (const part of parts) {
    for (let i = 0; i < part.length; i++) {
      h ^= part.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 0xff;
  }
  return h >>> 0;
}

/** Fisher–Yates with a seeded PRNG — same inputs ⇒ same order. */
export function seededShuffle<T extends { slug: string }>(items: T[], seed: number): T[] {
  const out = items.slice();
  const rand = mulberry32(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

function cityKey(c: SortableCentre): string {
  return (c.citySlug ?? '').trim() || '_';
}

/**
 * Shuffle centres within each city; cities stay A–Z by slug so Delhi’s list
 * reshuffles among Delhi centres only, without mixing cities together.
 */
function shuffleByCity<T extends SortableCentre>(centres: T[], bucket: number): T[] {
  const byCity = new Map<string, T[]>();
  for (const centre of centres) {
    const key = cityKey(centre);
    const list = byCity.get(key);
    if (list) list.push(centre);
    else byCity.set(key, [centre]);
  }

  const cityKeys = [...byCity.keys()].sort((a, b) => a.localeCompare(b));
  const out: T[] = [];
  for (const key of cityKeys) {
    const group = byCity.get(key)!;
    const seed = hashSeed(['centres-shuffle-city', key, String(bucket), ...group.map((c) => c.slug).sort()]);
    out.push(...seededShuffle(group, seed));
  }
  return out;
}

export function sortCentresList<T extends SortableCentre>(
  centres: T[],
  settings: CentresSortSettings = CENTRES_SORT_DEFAULTS,
  nowMs = Date.now(),
): T[] {
  const mode = settings.listSort ?? 'name';

  if (mode === 'manual') {
    return centres.slice().sort((a, b) => {
      const ao = Number.isFinite(a.sortOrder) ? Number(a.sortOrder) : Number.POSITIVE_INFINITY;
      const bo = Number.isFinite(b.sortOrder) ? Number(b.sortOrder) : Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug);
    });
  }

  if (mode === 'shuffle') {
    const bucket = shuffleBucket(settings.shuffleEveryDays ?? 1, nowMs);
    return shuffleByCity(centres, bucket);
  }

  return centres.slice().sort((a, b) => a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));
}
