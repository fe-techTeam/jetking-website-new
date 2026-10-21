import type { Course } from '@/lib/content/types';
import type { Route } from 'next';

/**
 * Whether a published course has its own `/courses/[slug]` page.
 *
 * - `hasDetailPage: false` → no page (cards go to enquiry)
 * - `hasDetailPage: true` → page on
 * - unset → yes for normal courses; no for SUNY partnership stubs (thin catalogue
 *   entries until an editor turns Detail page on in CMS)
 */
export function courseHasDetailPage(
  course: Pick<Course, 'slug' | 'hasDetailPage'> & { title?: string },
): boolean {
  if (course.hasDetailPage === false) return false;
  if (course.hasDetailPage === true) return true;
  const haystack = `${course.slug} ${course.title ?? ''}`.toLowerCase().replace(/-/g, ' ');
  if (/\bsuny\b/.test(haystack)) return false;
  return true;
}

/** Catalogue / menu / card destination: detail page, or enquiry with the course preselected. */
export function courseHref(course: Pick<Course, 'slug' | 'hasDetailPage'> & { title?: string }): Route {
  if (courseHasDetailPage(course)) return `/courses/${course.slug}` as Route;
  return `/enquiry?course=${encodeURIComponent(course.slug)}` as Route;
}
