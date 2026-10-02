import { formatCentreRecords } from '@/features/jetking-ai/format-passage';
import { extractCityHint } from '@/features/jetking-ai/city';
import { loadIndex } from '@/features/knowledge/lib/engine';
import type { CentreRecord } from '@/features/knowledge/types';
import websiteCorpus from '@/content/website-corpus.json';
import centreCoordinates from '@/content/centre-coordinates.json';

export { extractCityHint };

const CENTRE_COORDINATES: Record<string, { lat: number; lng: number }> = centreCoordinates;

const CITY_ALIASES: Record<string, string[]> = {
  bangalore: ['bangalore', 'bengaluru'],
  bengaluru: ['bangalore', 'bengaluru'],
  gurgaon: ['gurgaon', 'gurugram'],
  gurugram: ['gurgaon', 'gurugram'],
  delhi: ['delhi', 'noida', 'gurgaon', 'gurugram', 'azadpur'],
  mumbai: ['mumbai', 'borivali', 'dadar', 'khar', 'thane', 'vasai', 'vashi'],
  // Renamed in 2018 — still the more commonly used name; no branch record
  // itself says "Allahabad", so this needs a real alias rather than relying
  // on the locations[]-substring fallback the other CITY_RE additions use.
  allahabad: ['prayagraj'],
  // IT-hub neighbourhoods `extractCityHint` recognises (see CITY_RE in
  // city.ts) that have no Jetking branch of their own — route them to the
  // nearest city hub instead of falling through to the generic "name your
  // city" reply, which was surfacing an unrelated city (Ahmedabad) as the
  // example. Hinjewadi sits right beside the Wakad/Chinchwad branch.
  hinjewadi: ['pune'],
  andheri: ['mumbai'],
  koramangala: ['bangalore', 'bengaluru'],

  // Same idea, extended to every other city Jetking has a centre in —
  // matched against real, well-known localities only (never a guess at
  // which city an ambiguous name belongs to).
  bandra: ['mumbai'],
  powai: ['mumbai'],
  malad: ['mumbai'],
  kandivali: ['mumbai'],
  goregaon: ['mumbai'],
  juhu: ['mumbai'],
  colaba: ['mumbai'],
  worli: ['mumbai'],
  chembur: ['mumbai'],
  ghatkopar: ['mumbai'],
  mulund: ['mumbai'],

  dwarka: ['delhi'],
  rohini: ['delhi'],
  'karol bagh': ['delhi'],
  'connaught place': ['delhi'],
  pitampura: ['delhi'],
  janakpuri: ['delhi'],
  saket: ['delhi'],
  'nehru place': ['delhi'],

  whitefield: ['bangalore', 'bengaluru'],
  'electronic city': ['bangalore', 'bengaluru'],
  indiranagar: ['bangalore', 'bengaluru'],
  marathahalli: ['bangalore', 'bengaluru'],
  'hsr layout': ['bangalore', 'bengaluru'],
  jayanagar: ['bangalore', 'bengaluru'],
  'btm layout': ['bangalore', 'bengaluru'],
  'jp nagar': ['bangalore', 'bengaluru'],
  malleshwaram: ['bangalore', 'bengaluru'],

  'hitech city': ['hyderabad'],
  gachibowli: ['hyderabad'],
  madhapur: ['hyderabad'],
  secunderabad: ['hyderabad'],
  begumpet: ['hyderabad'],
  dilsukhnagar: ['hyderabad'],

  wakad: ['pune'],
  kothrud: ['pune'],
  baner: ['pune'],
  'viman nagar': ['pune'],
  hadapsar: ['pune'],
  aundh: ['pune'],
  kharadi: ['pune'],

  'salt lake': ['kolkata'],
  'park street': ['kolkata'],
  howrah: ['kolkata'],
  rajarhat: ['kolkata'],
  behala: ['kolkata'],
  garia: ['kolkata'],

  satellite: ['ahmedabad'],
  navrangpura: ['ahmedabad'],
  bopal: ['ahmedabad'],
  vastrapur: ['ahmedabad'],

  'gomti nagar': ['lucknow'],
  hazratganj: ['lucknow'],

  sitabuldi: ['nagpur'],
  dharampeth: ['nagpur'],

  'cyber city': ['gurgaon', 'gurugram'],
  'dlf phase': ['gurgaon', 'gurugram'],
};

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function cityMatches(centreCity: string, hint: string): boolean {
  const city = norm(centreCity);
  const h = norm(hint);
  if (city === h || city.includes(h) || h.includes(city)) return true;
  const aliases = CITY_ALIASES[h];
  return Boolean(aliases?.some((a) => city === a || city.includes(a)));
}

interface BranchRecord {
  slug: string;
  name: string;
  cityName: string;
  locality: string;
  pincode: string;
  addressLine: string;
  phone: string;
  intro: string;
  programmes: string[];
}

function websiteBranches(): BranchRecord[] {
  const courses = new Map(
    websiteCorpus.structured.courses.map((course) => [course.slug, course.title]),
  );
  const cityNames = new Map(websiteCorpus.structured.cities.map((city) => [city.slug, city.name]));

  return websiteCorpus.structured.centres.map((branch) => ({
    slug: branch.slug,
    name: branch.name,
    cityName: cityNames.get(branch.citySlug) ?? branch.citySlug,
    locality: branch.locality,
    pincode: branch.pincode,
    addressLine: branch.addressLine,
    phone: branch.phone,
    intro: branch.intro,
    programmes: branch.coursesOffered.map((slug) => courses.get(slug) ?? slug.replace(/-/g, ' ')),
  }));
}

/**
 * Google's documented URL-based Maps API — no key needed, opens a pin/search
 * for the query text.
 *
 * `encodeURIComponent` deliberately leaves `( ) ! ~ * '` unescaped (RFC 3986
 * "unreserved" marks), but several branch addresses contain a literal
 * `(W)`/`(E)` suffix (e.g. Borivali's "... Borivali (W), Mumbai,
 * Maharashtra."). Left unescaped, that `)` closes the outer markdown
 * `[text](url)` link early — richInline's link regex stops the URL capture
 * at the first `)` — truncating the href and spilling the rest of the
 * encoded query into the visible answer text as plain characters. Escaping
 * parens ourselves keeps them out of the URL entirely.
 */
function mapsSearchUrl(query: string): string {
  const encoded = encodeURIComponent(query).replace(/[()]/g, (c) =>
    c === '(' ? '%28' : '%29',
  );
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/**
 * A single named branch gets its own full detail — street address, phone,
 * and a Maps link — rather than formatCentreRecords' compact
 * name+locality+pincode line meant for listing several branches at once.
 */
function formatBranchAnswer(branch: BranchRecord): string {
  const lines: string[] = [
    `## ${branch.name}, ${branch.cityName}`,
    '',
    branch.intro,
    '',
    `Address: ${branch.addressLine}`,
    `Phone: ${branch.phone}`,
    '',
    `[📍 Open ${branch.name} in Google Maps](${mapsSearchUrl(`${branch.name}, ${branch.addressLine}`)})`,
    '',
  ];

  if (branch.programmes.length) {
    lines.push('### Courses commonly offered', '');
    for (const p of branch.programmes.slice(0, 6)) {
      lines.push(`- ${p.replace(/—|–/g, ' - ')}`);
    }
    lines.push('');
  }

  lines.push(
    '_Tell me your locality and a Jetking counsellor can confirm the nearest centre and batch timings._',
  );
  return lines.join('\n').trim();
}

/**
 * A location query can name one specific branch ("Jetking Borivali",
 * "courses at the Wakad centre") rather than just the city. Answering with
 * resolveCentreAnswer's usual city hub in that case is misleading — it
 * merges every branch in the city into one record, so "what courses does
 * Jetking Borivali offer" got back all 6 Mumbai branches and their pooled
 * programme list instead of Borivali's own address. Only narrows to a
 * single branch when exactly one branch's own name/locality/slug matches —
 * an ambiguous hint or the city name itself (present in no branch's own
 * name/locality) falls through to the existing hub behaviour untouched.
 */
function pickBranchForQuery(branches: BranchRecord[], query: string): BranchRecord | null {
  const hint = extractCityHint(query);
  if (!hint) return null;
  const h = norm(hint);
  const candidates = branches.filter(
    (b) => norm(b.name).includes(h) || norm(b.locality).includes(h) || norm(b.slug) === h,
  );
  return candidates.length === 1 ? (candidates[0] ?? null) : null;
}

function websiteCentres(): CentreRecord[] {
  const courses = new Map(
    websiteCorpus.structured.courses.map((course) => [course.slug, course.title]),
  );

  return websiteCorpus.structured.cities.map((city) => {
    const branches = websiteCorpus.structured.centres.filter(
      (centre) => centre.citySlug === city.slug,
    );
    const programmes = [
      ...new Set(
        branches.flatMap((branch) =>
          branch.coursesOffered.map((slug) => courses.get(slug) ?? slug.replace(/-/g, ' ')),
        ),
      ),
    ];

    return {
      id: `website-${city.slug}`,
      city: city.name,
      path: `/centres?q=${encodeURIComponent(city.name)}`,
      summary: city.intro,
      locations: branches.map((branch) => ({
        name: branch.name,
        locality: `${branch.locality} · ${branch.pincode}`,
      })),
      programmes,
    };
  });
}

/**
 * Pick the best centre record(s) for a location question from the structured KB.
 * Prefers a city hub that has branch `locations` over suburb SEO pages.
 */
function pickCentresForQuery(
  centres: CentreRecord[],
  query: string,
): CentreRecord[] {
  const hint = extractCityHint(query);
  // No city named at all — let resolveCentreAnswer's own no-match branch
  // handle it with a "name your city" prompt. Returning the first 4 centres
  // alphabetically (Ahmedabad, Balasore, Bengaluru, Bhopal, ...) here instead
  // used to win: resolveCentreAnswer only falls back to that prompt when
  // `picked` is empty, so this always-populated array short-circuited it and
  // led every "what is my nearest centre?" with an arbitrary city's own
  // summary line ("Jetking centres in Ahmedabad offer...") as if it meant
  // something, before finally asking for a locality further down.
  if (!hint) return [];

  const matched = centres.filter(
    (c) =>
      cityMatches(c.city, hint) ||
      c.locations.some(
        (location) =>
          norm(location.name).includes(hint) || norm(location.locality).includes(hint),
      ),
  );
  if (!matched.length) return [];

  // Exact city hub with branches (e.g. Mumbai with 6 localities)
  const hub =
    matched.find((c) => norm(c.city) === hint && c.locations.length > 0) ??
    matched.find((c) => c.locations.length > 0) ??
    matched.find((c) => norm(c.city) === hint) ??
    matched[0];

  return hub ? [hub] : matched.slice(0, 3);
}

/**
 * Build a structured centre reply from the KB — never SEO embedding blobs.
 * Returns null when the KB has no usable centre match.
 */
export async function resolveCentreAnswer(query: string): Promise<string | null> {
  const branch = pickBranchForQuery(websiteBranches(), query);
  if (branch) return formatBranchAnswer(branch);

  const index = await loadIndex();
  const picked = pickCentresForQuery([...websiteCentres(), ...index.base.centres], query);
  if (!picked.length) {
    // No city named — offer a short national overview from hubs that have branches.
    const hubs = [...websiteCentres(), ...index.base.centres]
      .filter((c) => c.locations.length > 0)
      .slice(0, 4);
    if (!hubs.length) return null;
    return formatCentreRecords(
      hubs,
      'Jetking training centres',
      `Jetking runs training centres across India. Name your city and I will list the nearest branches.`,
    );
  }

  const title =
    picked.length === 1 ? `Jetking centres in ${picked[0]!.city}` : 'Jetking training centres';
  const lede = picked.length === 1 ? picked[0]!.summary : undefined;
  return formatCentreRecords(picked, title, lede);
}

/** Great-circle distance in km — accurate enough to rank city-level centres. */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Nearest centre by straight-line distance from the visitor's coordinates —
 * used when the browser's Geolocation API supplied lat/lng and the query
 * text named no city for `pickCentresForQuery` to key off. Centres with no
 * entry in centre-coordinates.json are skipped rather than guessed at.
 * Website and KB centre lists both use the same `city` records for the same
 * place, so multiple candidates can tie on distance — the branch-bearing hub
 * (locations.length > 0) is preferred over an empty SEO stub at that city.
 */

/**
 * A locality that has its own coordinate entry and its own bare `city`
 * record (Thane, Swargate, Ameerpet, Azadpur, …) but no populated
 * `locations[]` — a KB-scraped suburb page indexed as if it were its own
 * city, distinct from the real metro hub record (Mumbai, Pune, Hyderabad,
 * Delhi, …) that already lists it as a proper branch with a real address.
 * Real, independent Jetking cities always have at least one populated
 * `locations` entry, so this test doesn't risk misclassifying one of those.
 */
const NEARBY_STUB_RADIUS_KM = 60;

function pickCentreByCoords(
  centres: CentreRecord[],
  lat: number,
  lng: number,
): { centre: CentreRecord; distanceKm: number } | null {
  const withDistance = centres
    .map((c) => {
      const coord = CENTRE_COORDINATES[c.city];
      return coord ? { centre: c, distanceKm: haversineKm(lat, lng, coord.lat, coord.lng) } : null;
    })
    .filter((x): x is { centre: CentreRecord; distanceKm: number } => x !== null)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  if (!withDistance.length) return null;

  const nearest = withDistance[0]!;

  // The raw-nearest match is an address-less locality stub (see
  // NEARBY_STUB_RADIUS_KM above) — the exact same locality, searched by name
  // instead of coordinates, resolves to the rich metro hub via
  // pickCentresForQuery's `locations[]` substring match (e.g. "centre in
  // Thane" → the Mumbai record, because Mumbai lists a "Jetking Thane"
  // branch). Do the same here: prefer the nearest hub with a real address
  // over a same-distance-ish stub with none, rather than handing back "Jetking
  // centre in Thane" with no address just because it's technically 0km away.
  if (nearest.centre.locations.length === 0) {
    const richNearby = withDistance.find(
      (x) => x.centre.locations.length > 0 && x.distanceKm <= NEARBY_STUB_RADIUS_KM,
    );
    if (richNearby) return richNearby;
  }

  const nearestCity = nearest.centre.city;
  const sameCity = withDistance.filter((x) => x.centre.city === nearestCity);
  return sameCity.find((x) => x.centre.locations.length > 0) ?? sameCity[0]!;
}

/**
 * Same structured-record answer as resolveCentreAnswer, but keyed off the
 * visitor's real coordinates instead of a city named in the query text.
 */
export async function resolveCentreAnswerByCoords(
  lat: number,
  lng: number,
): Promise<string | null> {
  const index = await loadIndex();
  const result = pickCentreByCoords([...websiteCentres(), ...index.base.centres], lat, lng);
  if (!result) return null;

  const { centre, distanceKm } = result;
  return formatCentreRecords(
    [centre],
    `Jetking centres in ${centre.city}`,
    `Based on your current location, your nearest Jetking centre is in ${centre.city} (about ${Math.round(distanceKm)} km away).`,
  );
}
