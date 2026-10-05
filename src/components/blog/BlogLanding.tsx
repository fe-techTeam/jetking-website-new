import Link from 'next/link';
import { Section } from '@/components/kit';
import { EnquiryLink } from '@/components/EnquirySheet';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/content/types';
import type { blogCopy } from '@/lib/content/copy/pages/blog';
import { BlogHero } from './BlogHero';
import { BlogIndex } from './BlogIndex';

/**
 * Blog index page shell.
 *
 * Hero UI lives in `BlogHero.tsx` (do not inline an alternate hero here — that
 * causes Cursor/Claude overwrite conflicts). This file composes hero + index +
 * closing CTA.
 */
export function BlogLanding({
  copy,
  allPosts,
  posts,
  categories,
  activeCategory,
  latestSlug,
  initialQuery = '',
  initialPage = 1,
}: {
  copy: typeof blogCopy.defaults;
  allPosts: Post[];
  posts: Post[];
  categories: string[];
  activeCategory: string | null;
  /** Editorial latest post slug — badge stays on this card even after AdaptiveList reorders. */
  latestSlug: string | null;
  initialQuery?: string;
  initialPage?: number;
}) {
  return (
    <div className="blog-page relative overflow-hidden">
      <BlogHero
        copy={copy}
        articleCount={allPosts.length}
        topicCount={categories.length}
        initialQuery={initialQuery}
        activeCategory={activeCategory}
      />

      <BlogIndex
        copy={copy}
        key={`${activeCategory ?? 'all'}:${initialQuery}:${initialPage}`}
        posts={posts}
        categories={categories}
        activeCategory={activeCategory}
        latestSlug={latestSlug}
        initialQuery={initialQuery}
        initialPage={initialPage}
      />

      <Section tone="wash" deco="glow" labelledBy="blog-cta">
          <div>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-12">
              <div>
                <p className="k-eyebrow">
                  {copy['cta.eyebrow']}
                </p>
                <h2
                  id="blog-cta"
                  className="section-title mt-3 font-display text-[var(--dc-ink)]"
                >
                  {copy['cta.title']}
                </h2>
                <p className="mt-3 max-w-[46ch] text-[14.5px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15.5px]">
                  {copy['cta.body']}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
                <EnquiryLink
                  source="blog-landing"
                  className="group/book inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--dc-accent)] py-3 pr-3 pl-5 text-[14.5px] font-bold text-white transition-colors hover:bg-[var(--dc-accent-soft)] xs:text-[15px]"
                >
                  <span>{copy['cta.primary.label']}</span>
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/book:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </EnquiryLink>
                <Link
                  href={copy['cta.secondary.href'] as Route}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--dc-hairline-strong)] px-6 py-3 text-[14.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)] xs:text-[15px]"
                >
                  {copy['cta.secondary.label']}
                </Link>
              </div>
            </div>
          </div>
        </Section>
    </div>
  );
}
