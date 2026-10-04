'use client';

import { Section, SectionHeader } from '@/components/kit';
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
    <Section tone="tint" labelledBy="home-blog-heading">
        <SectionHeader
          id="home-blog-heading"
          eyebrow="From the blog"
          title="Career guidance and industry notes"
          action={
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <Link
                href={'/blog' as Route}
                className="tap inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
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
          }
        />

        <ul
          ref={ref}
          tabIndex={0}
          aria-label="Latest articles"
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 -mx-[var(--gutter)] px-[var(--gutter)] scroll-px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {posts.map((post) => {
            const cover = postCover(post);
            return (
              <li key={post.slug} className="min-w-0 w-[80%] shrink-0 snap-start sm:w-auto">
                <Link
                  href={`/blog/${post.slug}` as Route}
                  className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] shadow-[var(--dc-shadow)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--dc-shadow-hover)]"
                >
                  <div className="dc-card-media relative aspect-[12/5] w-full overflow-hidden">
                    {cover ? (
                      <>
                        {/* Blurred copy fills the letterbox bars so any cover ratio looks intentional. */}
                        <Image
                          src={cover.url}
                          alt=""
                          fill
                          sizes="64px"
                          aria-hidden="true"
                          className="scale-125 object-cover opacity-70 blur-xl"
                        />
                        <Image
                          src={cover.url}
                          alt={cover.alt || post.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="relative object-contain"
                        />
                      </>
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
                    <p className="mt-2 line-clamp-2 flex-1 text-[14px] leading-relaxed text-[var(--dc-ink-muted)]">
                      {post.excerpt}
                    </p>
                    <span className="mt-5 inline-flex items-center justify-between gap-3 border-t border-[var(--dc-hairline)] pt-4 text-[13.5px] font-bold text-[var(--dc-accent-soft)]">
                      Read article
                      <span
                        aria-hidden="true"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jk-600 text-white"
                      >
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>
  );
}
