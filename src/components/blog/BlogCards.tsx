import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { ImageRef, Post } from '@/lib/content/types';
import { blogCopy } from '@/lib/content/copy/pages/blog';
export const BLOG_PAGE_SIZE = 12;

/** The card's own labels — callers on the blog pass their loaded copy; other pages get the shipped wording. */
export type PostCardCopy = Pick<typeof blogCopy.defaults, 'card.latestBadge' | 'card.readArticle'>;

export function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function blogIndexHref({
  category = null,
  searchQuery,
  page,
}: {
  category?: string | null;
  searchQuery?: string;
  page?: number;
}): Route {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  const q = searchQuery?.trim();
  if (q) params.set('q', q);
  if (page && page > 1) params.set('page', String(page));
  const qs = params.toString();
  return (qs ? `/blog?${qs}` : '/blog') as Route;
}

/** @deprecated Prefer blogIndexHref — kept for existing call sites. */
export function categoryHref(category: string | null, searchQuery?: string): Route {
  return blogIndexHref({ category, searchQuery });
}

/** Cover for cards — hero first, then SEO og image. */
export function postCover(post: Post): ImageRef | null {
  if (post.heroImage?.url) return post.heroImage;
  if (post.seo?.ogImage) {
    return { url: post.seo.ogImage, alt: post.title };
  }
  return null;
}

export function PostCard({
  post,
  badge,
  copy = blogCopy.defaults,
}: {
  post: Post;
  badge?: 'latest';
  copy?: PostCardCopy;
}) {
  const cover = postCover(post);

  return (
    <article className="relative h-full">
      {badge === 'latest' ? (
        <span className="blog-latest-badge">
          <Sparkles className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />
          {copy['card.latestBadge']}
        </span>
      ) : null}
      <Link
        href={`/blog/${post.slug}` as Route}
        className="blog-card blog-card-interactive group/post flex h-full flex-col overflow-hidden rounded-[var(--dc-cut)]"
      >
        <div
          className={`blog-card-media relative aspect-[840/300] overflow-hidden ${cover ? '' : 'max-sm:hidden'}`}
        >
          {cover ? (
            <Image
              src={cover.url}
              alt={cover.alt || post.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-contain transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/post:scale-[1.03]"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-[linear-gradient(145deg,var(--dc-card),var(--dc-surface),var(--dc-card))]"
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- brand asset; sized by caller */}
              <img
                src="/brand/jetking-wordmark.png"
                alt=""
                draggable={false}
                className="block h-[34px] w-auto select-none object-contain transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/post:scale-[1.03] sm:h-[40px]"
              />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 xs:p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase">
              {post.category}
            </span>
            <time
              dateTime={post.publishedAt}
              className="numeral text-[12.5px] font-semibold text-[var(--dc-ink-muted)]"
            >
              {formatPostDate(post.publishedAt)}
            </time>
          </div>

          <h3 className="mt-3 font-display text-[17px] sm:mt-3.5 leading-snug font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] transition-colors group-hover/post:text-[var(--dc-accent-soft)] xs:text-[18px]">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 flex-1 sm:line-clamp-3 text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
            {post.excerpt}
          </p>

          {/* Same action row as the course card: the label, then the round red arrow. */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-4 sm:pt-5">
            <span className="text-[13.5px] font-bold text-[var(--dc-accent-soft)]">{copy['card.readArticle']}</span>
            <span aria-hidden="true" className="dc-cta grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <ArrowRight
                className="h-[18px] w-[18px] transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/post:translate-x-0.5"
                strokeWidth={2.25}
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
