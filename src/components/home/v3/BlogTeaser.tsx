'use client';

import { Section, SectionHeader } from '@/components/kit';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/content/types';
import { PostCard } from '@/components/blog/BlogCards';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';

/**
 * The home page's row of latest articles. Each one is the same `PostCard` as the /blog index, so the two
 * can't drift apart (this used to be a separate hand-rolled copy with its own shadow, image ratio and chip).
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
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 -mx-[var(--gutter)] px-[var(--gutter)] scroll-px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
      >
        {posts.map((post) => (
          <li key={post.slug} className="min-w-0 w-[80%] shrink-0 snap-start sm:w-auto">
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
