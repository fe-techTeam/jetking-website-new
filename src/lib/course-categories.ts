import type { CourseLevel } from '@/lib/content/types';

/**
 * Course categories shared by the header mega menu and the homepage programme tabs.
 * The course model has no category field, so — like the /courses filter
 * (`CourseExplorer` TECHNOLOGY_KEYWORDS) — a course belongs to every technology whose
 * keywords appear in its slug or title. `href` values use the params /courses reads
 * (`?tech=` and `?level=`).
 */
/** Display order and labels for course levels, shared by every surface that shows one. */
export const COURSE_LEVELS: ReadonlyArray<{ id: CourseLevel; label: string }> = [
  { id: 'degree', label: 'Degree' },
  { id: 'diploma', label: 'Diploma' },
  { id: 'certification', label: 'Certification' },
  { id: 'short', label: 'Short course' },
];

export const COURSE_LEVEL_LABEL = Object.fromEntries(COURSE_LEVELS.map((l) => [l.id, l.label])) as Record<
  CourseLevel,
  string
>;

export type CourseCategoryId =
  | 'degree'
  | 'cloud'
  | 'cyber-security'
  | 'networking'
  | 'data'
  | 'hardware-os'
  | 'design-gaming'
  | 'marketing';

export interface CourseCategory {
  id: CourseCategoryId;
  label: string;
  href: string;
  /** Query params that select this category on /courses. */
  params: Record<string, string>;
  level?: CourseLevel;
  match?: RegExp;
}

export const COURSE_CATEGORIES: readonly CourseCategory[] = [
  { id: 'degree', label: 'Degree courses', href: '/courses?level=degree', params: { level: 'degree' }, level: 'degree' },
  { id: 'cloud', label: 'Cloud computing', href: '/courses?tech=cloud', params: { tech: 'cloud' }, match: /cloud|\baws\b|azure/ },
  {
    id: 'cyber-security',
    label: 'Cyber security',
    href: '/courses?tech=cyber-security',
    params: { tech: 'cyber-security' },
    match: /cyber|hacking|security/,
  },
  {
    id: 'networking',
    label: 'Networking',
    href: '/courses?tech=networking',
    params: { tech: 'networking' },
    match: /network|routing|switching|cisco/,
  },
  { id: 'data', label: 'Data & analytics', href: '/courses?tech=data', params: { tech: 'data' }, match: /\bdata\b/ },
  {
    id: 'hardware-os',
    label: 'Hardware & OS',
    href: '/courses?tech=hardware-os',
    params: { tech: 'hardware-os' },
    match: /hardware|windows|server|red hat/,
  },
  {
    id: 'design-gaming',
    label: 'Design & gaming',
    href: '/courses?tech=design-gaming',
    params: { tech: 'design-gaming' },
    match: /multimedia|animation|gaming|metaverse|design/,
  },
  {
    id: 'marketing',
    label: 'Digital marketing',
    href: '/courses?tech=marketing',
    params: { tech: 'marketing' },
    match: /marketing/,
  },
];

export function categoriesOf(course: { slug: string; title: string; level: CourseLevel }): CourseCategoryId[] {
  const haystack = `${course.slug} ${course.title}`.toLowerCase().replace(/-/g, ' ');
  return COURSE_CATEGORIES.filter((c) => (c.level ? course.level === c.level : c.match?.test(haystack))).map((c) => c.id);
}
