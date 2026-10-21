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
  // Full partner name first — most visitors won't know what "SUNY" alone means.
  { id: 'suny', label: 'State University of New York' },
];

export const COURSE_LEVEL_LABEL = Object.fromEntries(COURSE_LEVELS.map((l) => [l.id, l.label])) as Record<
  CourseLevel,
  string
>;

/** Chip on course cards — same wording as the filter so SUNY is never unexplained. */
export const COURSE_LEVEL_BADGE: Record<CourseLevel, string> = {
  degree: 'Degree',
  diploma: 'Diploma',
  certification: 'Certification',
  short: 'Short course',
  suny: 'State University of New York',
};

export type CourseCategoryId =
  | 'degree'
  | 'suny'
  | 'cloud'
  | 'cyber-security'
  | 'networking'
  | 'data'
  | 'hardware-os'
  | 'design-gaming'
  | 'marketing';

export type CourseTechnologyId = Exclude<CourseCategoryId, 'degree' | 'suny'>;

/** Technology names as shown in the /courses "Technology" filter; the header menu uses the same list. */
export const COURSE_TECHNOLOGIES: ReadonlyArray<{ id: CourseTechnologyId; label: string }> = [
  { id: 'cloud', label: 'Cloud' },
  { id: 'cyber-security', label: 'Cyber Security' },
  { id: 'networking', label: 'Networking' },
  { id: 'data', label: 'Data' },
  { id: 'design-gaming', label: 'Design & Gaming' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'hardware-os', label: 'Hardware & OS' },
];

const TECH_LABEL = Object.fromEntries(COURSE_TECHNOLOGIES.map((t) => [t.id, t.label])) as Record<CourseTechnologyId, string>;

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
  { id: 'degree', label: COURSE_LEVEL_LABEL.degree, href: '/courses?level=degree', params: { level: 'degree' }, level: 'degree' },
  { id: 'suny', label: COURSE_LEVEL_LABEL.suny, href: '/courses?level=suny', params: { level: 'suny' }, level: 'suny' },
  { id: 'cloud', label: TECH_LABEL.cloud, href: '/courses?tech=cloud', params: { tech: 'cloud' }, match: /cloud|\baws\b|azure/ },
  {
    id: 'cyber-security',
    label: TECH_LABEL['cyber-security'],
    href: '/courses?tech=cyber-security',
    params: { tech: 'cyber-security' },
    match: /cyber|hacking|security/,
  },
  {
    id: 'networking',
    label: TECH_LABEL.networking,
    href: '/courses?tech=networking',
    params: { tech: 'networking' },
    match: /network|routing|switching|cisco/,
  },
  { id: 'data', label: TECH_LABEL.data, href: '/courses?tech=data', params: { tech: 'data' }, match: /\bdata\b/ },
  {
    id: 'design-gaming',
    label: TECH_LABEL['design-gaming'],
    href: '/courses?tech=design-gaming',
    params: { tech: 'design-gaming' },
    match: /multimedia|animation|gaming|metaverse|design/,
  },
  {
    id: 'marketing',
    label: TECH_LABEL.marketing,
    href: '/courses?tech=marketing',
    params: { tech: 'marketing' },
    match: /marketing/,
  },
  {
    id: 'hardware-os',
    label: TECH_LABEL['hardware-os'],
    href: '/courses?tech=hardware-os',
    params: { tech: 'hardware-os' },
    match: /hardware|windows|server|red hat/,
  },
];

/** True when the course is a SUNY partnership programme (slug/title or stored level). */
export function isSunyCourse(course: { slug: string; title: string; level?: CourseLevel }): boolean {
  if (course.level === 'suny') return true;
  const haystack = `${course.slug} ${course.title}`.toLowerCase().replace(/-/g, ' ');
  return /\bsuny\b/.test(haystack);
}

/**
 * Level used for filters, badges and menus.
 * CMS records saved before the SUNY level existed still say `certification`;
 * those are treated as SUNY when the slug/title says so.
 */
export function courseLevel(course: { slug: string; title: string; level: CourseLevel }): CourseLevel {
  if (isSunyCourse(course)) return 'suny';
  return course.level;
}

export function categoriesOf(course: { slug: string; title: string; level: CourseLevel }): CourseCategoryId[] {
  const haystack = `${course.slug} ${course.title}`.toLowerCase().replace(/-/g, ' ');
  // SUNY partnership courses use their own level — don't also bucket them under Cyber / AI tech.
  if (isSunyCourse(course)) {
    return ['suny'];
  }
  return COURSE_CATEGORIES.filter((c) => (c.level ? course.level === c.level : c.match?.test(haystack))).map((c) => c.id);
}
