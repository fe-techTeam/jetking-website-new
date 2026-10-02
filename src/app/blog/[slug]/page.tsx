import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { articleSchema, breadcrumbSchema, buildMetadata, postDescription } from '@/lib/seo';
import { JsonLd, type Crumb } from '@/components/ui';
import { BlogArticle } from '@/components/blog/BlogArticle';
import { ArticleViewTracker } from './ArticleViewTracker';

/**
 * Blog article — the template that carries the ~136 migrated posts.
 *
 * This is the highest-volume SEO surface on the site. The article body is fully
 * static and identical for every visitor. The only adaptive element is the nudge
 * between the body and the related strip, which is the templated persona-aware
 * nudge layer scoped across migrated content.
 */

export async function generateStaticParams() {
  const posts = await content.listPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await content.getPost(slug);
  if (!post) return {};
  return buildMetadata({ ...post.seo, description: postDescription(post) }, `/blog/${post.slug}`);
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await content.getPost(slug);
  if (!post) notFound();

  const allPosts = await content.listPosts();
  const related = allPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  const trail: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ];

  return (
    <>
      <JsonLd data={[articleSchema(post), breadcrumbSchema(trail)]} />
      <ArticleViewTracker slug={post.slug} category={post.category} title={post.title} />
      <BlogArticle post={post} related={related} trail={trail} />
    </>
  );
}
