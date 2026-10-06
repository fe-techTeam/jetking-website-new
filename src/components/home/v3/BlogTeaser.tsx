'use client';

import { Section, SectionHeader } from '@/components/kit';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/content/types';
import { PostCard } from '@/components/blog/BlogCards';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/**
 * The home page's row of latest articles. Each one is the same `PostCard` as the /blog index, so the two
 * can't drift apart (this used to be a separate hand-rolled copy with its own shadow, image ratio and chip).
 */
export function BlogTeaser({ posts, copy }: { posts: Post[]; copy: HomeCopy }) {
  const { ref, edge, scrollByItem } = useScrollTrack<HTMLUListElement>();
  const canSlide = !(edge.start && edge.end);
  if (posts.length === 0) return null;

  return (
    <Section tone="tint" labelledBy="home-blog-heading">
      <SectionHeader
        id="home-blog-heading"
        eyebrow={copy['blog.eyebrow']}
        title={copy['blog.title']}
        action={
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <Link
              href={copy['blog.cta.href'] as Route}
              className="tap inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
            >
              {copy['blog.cta.label']}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
            {/* Only when there is something to slide to: not when every card already fits */}
            {canSlide ? (
              <ScrollNavButtons
                alwaysVisible
                edge={edge}
                onPrev={() => scrollByItem(-1)}
                onNext={() => scrollByItem(1)}
                label={copy['blog.nav.label']}
                className="shrink-0"
              />
            ) : null}
          </div>
        }
      />

      <ul
        ref={ref}
        tabIndex={0}
        aria-label={copy['blog.list.aria']}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 -mx-[var(--gutter)] px-[var(--gutter)] scroll-px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-5 sm:px-0 sm:scroll-px-0"
      >
        {posts.map((post) => (
          <li
            key={post.slug}
            className="min-w-0 w-[80%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <PostCard post={post} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
