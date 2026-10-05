import type { MetadataRoute } from 'next';
import { content } from '@/lib/content';
import { centrePath } from '@/lib/centre-path';
import { disclosures } from '@/lib/investors/disclosures';
import { absoluteUrl } from '@/lib/site';

/**
 * Generated from the content source, so it can never drift out of sync with what
 * actually exists — a hand-maintained sitemap is the usual cause of the "sitemap
 * contains redirected/404 URLs" failure in the CI SEO gate (§6.2).
 *
 * There are no city URLs: `/centres/{city}` permanently redirects to the centres directory,
 * and a redirecting URL does not belong in a sitemap.
 *
 * `/enquiry` is deliberately absent: it is noindex, and a noindex URL in the sitemap
 * is a contradictory signal to crawlers.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, centres, posts] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listPosts(),
  ]);

  // Google only trusts `lastmod` on sites where it is accurate, so a static page carries one only
  // when it can be derived from the content it lists; "now" on every build would discredit them all.
  const latest = (dates: string[]) =>
    dates.length ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))) : undefined;
  const coursesUpdated = latest(courses.map((c) => c.updatedAt));
  const centresUpdated = latest(centres.map((c) => c.updatedAt));
  const postsUpdated = latest(posts.map((p) => p.updatedAt));
  const siteUpdated = latest(
    [coursesUpdated, centresUpdated, postsUpdated].filter((d): d is Date => Boolean(d)).map((d) => d.toISOString()),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: siteUpdated, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/courses'), lastModified: coursesUpdated, changeFrequency: 'weekly', priority: 0.9 },
    { url: absoluteUrl('/centres'), lastModified: centresUpdated, changeFrequency: 'monthly', priority: 0.8 },
    { url: absoluteUrl('/placements'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/franchise'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/blog'), lastModified: postsUpdated, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/about-us'), changeFrequency: 'monthly', priority: 0.7 },
    { url: absoluteUrl('/faq'), changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/sitemap'), changeFrequency: 'monthly', priority: 0.3 },
    { url: absoluteUrl('/privacy-policy'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/terms-conditions'), changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/enrollment-terms-and-conditions'), changeFrequency: 'yearly', priority: 0.3 },
    {
      url: absoluteUrl('/investors'),
      // Filings land quarterly, so the honest "last modified" is when the lists were last synced.
      lastModified: new Date(disclosures.syncedAt),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  return [
    ...staticRoutes,
    ...courses.map((course) => ({
      url: absoluteUrl(`/courses/${course.slug}`),
      lastModified: new Date(course.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...centres.map((centre) => ({
      url: absoluteUrl(centrePath(centre.slug)),
      lastModified: new Date(centre.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    // A post canonicalised to another URL is a duplicate; only the canonical belongs here.
    ...posts.filter((post) => !post.seo.canonicalPath || post.seo.canonicalPath === `/blog/${post.slug}`).map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ];
}
