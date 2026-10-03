import Image from 'next/image';
import { siteConfig } from '@/lib/site';
import { BlogHeroSearch } from './BlogHeroSearch';

/**
 * Canonical blog index hero (cinematic full-bleed).
 *
 * Owned design — do not replace with the older split “Making sense of the choice”
 * banner or counsellor CTAs. Other agents: edit copy only if asked; keep structure.
 */
export function BlogHero({
  articleCount,
  topicCount,
  initialQuery = '',
  activeCategory = null,
}: {
  articleCount: number;
  topicCount: number;
  initialQuery?: string;
  activeCategory?: string | null;
}) {
  return (
    <section className="shell relative pt-6 pb-10 xs:pt-8 sm:pt-10 lg:pt-12 lg:pb-12">
      <div className="blog-hero-banner relative min-h-[min(72vw,420px)] overflow-hidden rounded-[24px] xs:min-h-[380px] xs:rounded-[28px] sm:min-h-[440px] sm:rounded-[28px] lg:min-h-[520px]">
        <Image
          src="/blog/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center] sm:object-[72%_center]"
        />
        <div aria-hidden="true" className="blog-hero-wash pointer-events-none absolute inset-0" />

        <div className="relative z-[1] flex h-full min-h-[inherit] flex-col justify-center px-6 py-10 xs:px-8 xs:py-12 sm:px-10 sm:py-14 lg:max-w-[64%] lg:px-12 lg:py-16 xl:px-14">
          <p className="text-[14px] font-bold tracking-[0.18em] text-[var(--dc-accent-soft)] uppercase sm:text-[14.5px]">
            Blogs &amp; Insights
          </p>

          <h1 className="page-title mt-4 font-display text-[var(--dc-ink)] sm:mt-5">
            Ideas. Insights. Impact.
            <span className="mt-1 block text-[var(--dc-accent-soft)] sm:mt-1.5">
              For Your Future.
            </span>
          </h1>

          <p className="mt-4 max-w-[56ch] text-[14.5px] leading-[1.65] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:mt-5 sm:text-[16px]">
            Actionable insights on technology, careers, industry trends and learning — crafted to
            help you stay ahead.
          </p>

          <div className="mt-7 w-full sm:mt-8">
            <BlogHeroSearch initialQuery={initialQuery} activeCategory={activeCategory} />
          </div>

          <p className="mt-5 numeral text-[13.5px] font-bold tracking-[0.12em] text-[var(--dc-ink-muted)] uppercase sm:mt-6">
            {siteConfig.name}
            {' · '}
            {articleCount} {articleCount === 1 ? 'article' : 'articles'}
            {topicCount > 1 ? ` · ${topicCount} topics` : null}
          </p>
        </div>
      </div>
    </section>
  );
}
