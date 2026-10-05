import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { breadcrumbSchema } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { BlogLanding } from '@/components/blog/BlogLanding';
import { blogCopy } from '@/lib/content/copy/pages/blog';
import { loadCopy, pageMetadata } from '@/lib/content/copy/load';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(blogCopy, '/blog');
}

/**
 * Blog index — Future-Ready dark canvas (home / student language).
 *
 * Cards carry the volume better than a light editorial list once the page sits
 * on the same dark lead as `/` and `/student`. Adaptation re-orders cards; it
 * never hides a post. Article pages (`/blog/[slug]`) stay on the light reading
 * template — only this index shares the lead skin.
 */
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { category: rawCategory, q: rawQuery, page: rawPage } = await searchParams;
  const copy = await loadCopy(blogCopy);
  const allPosts = await content.listPosts();

  const categories = [...new Set(allPosts.map((p) => p.category))].sort((a, b) =>
    a.localeCompare(b),
  );

  const activeCategory =
    rawCategory && categories.includes(rawCategory) ? rawCategory : null;

  const posts = activeCategory
    ? allPosts.filter((p) => p.category === activeCategory)
    : allPosts;

  const parsedPage = Number.parseInt(typeof rawPage === 'string' ? rawPage : '', 10);
  const initialPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const trail: Crumb[] = [
    { name: copy['breadcrumb.home'], path: '/' },
    { name: copy['breadcrumb.blog'], path: '/blog' },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(trail)} />
      <BlogLanding
        copy={copy}
        allPosts={allPosts}
        posts={posts}
        categories={categories}
        activeCategory={activeCategory}
        latestSlug={allPosts[0]?.slug ?? null}
        initialQuery={typeof rawQuery === 'string' ? rawQuery : ''}
        initialPage={initialPage}
      />
    </>
  );
}
