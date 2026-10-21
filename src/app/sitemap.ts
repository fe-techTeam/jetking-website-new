import type { MetadataRoute } from 'next';
import { content } from '@/lib/content';
import { centrePath } from '@/lib/centre-path';
import { disclosures } from '@/lib/investors/disclosures';
import { absoluteUrl } from '@/lib/site';
import type { SitemapChangeFrequency } from '@/lib/content/types';

/**
 * Generated from the content source + SEO settings (`sitemapInclude` / `sitemapExclude`),
 * so editors control the static URL list from the admin without a deploy.
 *
 * Courses, centres and posts are always appended (unless noindex / excluded).
 * City URLs are omitted: `/centres/{city}` redirects and does not belong in a sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await content.getSeoSettings();
  const excluded = new Set(seo.sitemapExclude.map((p) => p.trim().replace(/\/+$/, '') || '/'));
  const [courses, centres, posts] = await Promise.all([
    content.listCourses(),
    content.listCentres(),
    content.listPosts(),
  ]);

  const latest = (dates: string[]) =>
    dates.length ? new Date(Math.max(...dates.map((d) => new Date(d).getTime()))) : undefined;
  const coursesUpdated = latest(courses.map((c) => c.updatedAt));
  const centresUpdated = latest(centres.map((c) => c.updatedAt));
  const postsUpdated = latest(posts.map((p) => p.updatedAt));
  const siteUpdated = latest(
    [coursesUpdated, centresUpdated, postsUpdated].filter((d): d is Date => Boolean(d)).map((d) => d.toISOString()),
  );

  const lastModFor = (path: string): Date | undefined => {
    if (path === '/') return siteUpdated;
    if (path === '/courses') return coursesUpdated;
    if (path === '/centres') return centresUpdated;
    if (path === '/blog') return postsUpdated;
    if (path === '/investors') return new Date(disclosures.syncedAt);
    return undefined;
  };

  const staticRoutes: MetadataRoute.Sitemap = seo.sitemapInclude.map((entry) => {
    const path = entry.path.trim().replace(/\/+$/, '') || '/';
    return {
      url: absoluteUrl(path),
      lastModified: lastModFor(path),
      changeFrequency: (entry.changeFrequency ?? 'monthly') as SitemapChangeFrequency,
      priority: entry.priority ?? 0.5,
    };
  });

  const urls: MetadataRoute.Sitemap = [
    ...staticRoutes,
    ...courses
      .filter((c) => !c.seo.noindex && c.hasDetailPage !== false)
      .map((course) => ({
        url: absoluteUrl(`/courses/${course.slug}`),
        lastModified: new Date(course.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.9,
      })),
    ...centres
      .filter((c) => !c.seo.noindex)
      .map((centre) => ({
        url: absoluteUrl(centrePath(centre.slug)),
        lastModified: new Date(centre.updatedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ...posts
      .filter(
        (post) =>
          !post.seo.noindex && (!post.seo.canonicalPath || post.seo.canonicalPath === `/blog/${post.slug}`),
      )
      .map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'yearly' as const,
        priority: 0.6,
      })),
  ];

  return urls.filter((entry) => !excluded.has(new URL(entry.url).pathname.replace(/\/+$/, '') || '/'));
}
