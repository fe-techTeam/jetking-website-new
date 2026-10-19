/**
 * The scale claims the site publishes without a named source: the founding year, and
 * counts computed from the content source itself. Student, placement, salary and
 * recruiter figures stay off the page until Jetking confirms them — the same rule
 * `lib/content/fixtures/trust.ts` applies to the homepage trust band.
 */
export const FOUNDED_YEAR = 1947;

export const SINCE_FOUNDED = `Since ${FOUNDED_YEAR}`;

export interface NetworkCounts {
  courses: number;
  centres: number;
  cities: number;
}

export function legacyStats(counts: NetworkCounts) {
  return [
    { value: String(FOUNDED_YEAR), label: 'Year founded' },
    { value: String(counts.centres), label: 'Learning centres' },
    { value: String(counts.cities), label: 'Cities across India' },
    { value: String(counts.courses), label: 'Courses on offer' },
  ] as const;
}
