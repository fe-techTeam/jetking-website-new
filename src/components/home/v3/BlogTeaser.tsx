'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/content/types';
import { formatPostDate, postCover } from '@/components/blog/BlogCards';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';

/**
 * A compact card built on this page's own `dc-*` tokens rather than importing
 * `PostCard` from `BlogCards.tsx` directly — that component's classes
 * (`.blog-card`, …) read `--blog-*` custom properties that only resolve under a
 * `.blog-page` ancestor, which this page doesn't (and shouldn't) wrap itself in.
 * The pure helpers (`formatPostDate`, `postCover`) have no such dependency, so
 * those are reused as-is.
 */
export function BlogTeaser({ posts }: { posts: Post[] }) {
  const { ref, edge, scrollByItem } = useScrollTrack<HTMLUListElement>();
  if (posts.length === 0) return null;

  return (
    <section className="border-y border-[var(--dc-hairline)] bg-[var(--dc-surface)] py-12 sm:py-14 lg:py-16" aria-labelledby="home-blog-heading">
      <div className="shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="dc-eyebrow text-[13px] font-bold tracking-[0.06em] uppercase">From the blog</p>
            <h2
              id="home-blog-heading"
              className="dc-heading-glow mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] xs:text-[28px] sm:text-[32px]"
            >
              Career guidance and industry notes
            </h2>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <Link
              href={'/blog' as Route}
              className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]"
            >
              Visit the blog
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
            <ScrollNavButtons
              edge={edge}
              onPrev={() => scrollByItem(-1)}
              onNext={() => scrollByItem(1)}
              label="articles"
              className="shrink-0"
            />
          </div>
        </div>

        <ul
          ref={ref}
          tabIndex={0}
          aria-label="Latest articles"
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 -mx-[var(--gutter)] px-[var(--gutter)] scroll-px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {posts.map((post) => {
            const cover = postCover(post);
            return (
              <li key={post.slug} className="min-w-0 w-[80%] shrink-0 snap-start sm:w-auto">
                <Link
                  href={`/blog/${post.slug}` as Route}
                  className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] shadow-[var(--dc-shadow)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--dc-shadow-hover)]"
                >
                  <div className="dc-card-media relative aspect-[16/9] w-full overflow-hidden">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt={cover.alt || post.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- brand asset on a placeholder plate
                      <img
                        src="/brand/jetking-wordmark.png"
                        alt=""
                        draggable={false}
                        className="absolute inset-0 m-auto h-9 w-auto max-w-[60%] object-contain opacity-70"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="dc-chip px-2.5 py-1 text-[12px] tracking-[0.04em] uppercase">
                        {post.category}
                      </span>
                      <time dateTime={post.publishedAt} className="numeral text-[12px] text-[var(--dc-ink-muted)]">
                        {formatPostDate(post.publishedAt)}
                      </time>
                    </div>
                    <h3 className="mt-3.5 font-display text-[16px] leading-snug font-extrabold text-[var(--dc-ink)] sm:text-[17px]">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-[var(--dc-ink-muted)]">
                      {post.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 border-t border-[var(--dc-hairline)] pt-4 text-[13px] font-bold text-[var(--dc-accent-soft)]">
                      Read article
                      <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
