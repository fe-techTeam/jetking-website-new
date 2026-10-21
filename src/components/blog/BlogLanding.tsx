import Image from 'next/image';
import Link from 'next/link';
import { Section } from '@/components/kit';
import { EnquiryLink } from '@/components/EnquirySheet';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { Post } from '@/lib/content/types';
import type { blogCopy } from '@/lib/content/copy/pages/blog';
import { BlogHero } from './BlogHero';
import { BlogIndex } from './BlogIndex';
import { isSectionVisible } from '@/lib/content/copy/sections';

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
  const show = (id: string) => isSectionVisible(copy, id);
  return (
    <div className="blog-page relative overflow-hidden">
      {show('hero') ? (
        <BlogHero
          copy={copy}
          articleCount={allPosts.length}
          topicCount={categories.length}
          initialQuery={initialQuery}
          activeCategory={activeCategory}
        />
      ) : null}

      {show('index') ? (
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
      ) : null}

      {show('cta') ? (
        <Section tone="plain" labelledBy="blog-cta">
          <div className="kit-card overflow-hidden md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,min(24rem,42%))]">
            <div className="p-6 sm:p-10">
              <p className="text-[13px] font-bold tracking-[0.12em] text-[var(--k-red)] uppercase">{copy['cta.eyebrow']}</p>
              <h2 id="blog-cta" className="section-title mt-2.5 text-[var(--k-ink)]">
                {copy['cta.title']}
              </h2>
              <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">{copy['cta.body']}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <EnquiryLink
                  source="blog-landing"
                  className="group/book inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--k-red-fill)] py-3 pr-3 pl-5 text-[15px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
                >
                  <span>{copy['cta.primary.label']}</span>
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[var(--k-red)] transition-transform duration-200 group-hover/book:translate-x-0.5"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                </EnquiryLink>
                <Link
                  href={copy['cta.secondary.href'] as Route}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--k-line-strong)] px-6 py-3 text-[15px] font-bold text-[var(--k-ink)] transition-colors hover:border-[var(--k-red)] hover:text-[var(--k-red)]"
                >
                  {copy['cta.secondary.label']}
                </Link>
              </div>
            </div>

            <div className="relative aspect-[4/3] md:self-center">
              <Image src={copy['cta.image']} alt="" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover object-center" />
            </div>
          </div>
        </Section>
      ) : null}
    </div>
  );
}
