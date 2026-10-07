import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import type { HomeCopy } from '@/lib/content/copy/pages/home';
import type { NetworkCounts } from '@/lib/brand-facts';
import { AskAiLink } from '@/components/AskAiLink';
import { StatsStrip } from './StatsStrip';
import { HeroEnquireCta } from './HeroEnquireCta';
import { HeroEnquiryCard } from '@/components/HeroEnquiryCard';
import type { EnquiryCentre } from '@/components/EnquiryModal';

/**
 * The homepage — "Future-Ready".
 *
 * The lead is a full-width photo banner, like /courses and the centre pages: copy on the left, the enquiry
 * card on the right (desktop) and the numbers strip along the bottom. The audience chooser (student /
 * professional / browsing) is no longer shown here; the audience pages stay reachable from the menus.
 *
 * Ask Jetking lives on the global Guide launcher. There is no floating quick-action
 * rail here (Find Center / Call / Book Counselling) — the Professional page still uses it.
 */
export function HomeV2({
  enquiryCentres,
  counts,
  copy,
}: {
  /** Centres offered in the hero's quick-enquiry modal (state → centre). */
  enquiryCentres: EnquiryCentre[];
  /** Live network size for the numbers strip — computed, never a hand-typed claim. */
  counts: NetworkCounts;
  copy: HomeCopy;
}) {
  return (
    <section
      className={[
        'home-v2 home-v2-themeable relative flex flex-col overflow-hidden',
        /* A little air between the header and the banner photo. */
        'pt-3 sm:pt-5',
      ].join(' ')}
    >
      {/* ── Banner: full-width photo, copy left, enquiry card right, numbers strip along the bottom ── */}
      <div className="centres-detail-hero relative !rounded-none !border-0 !shadow-none">
        <Image
          src={copy['hero.image']}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[60%_30%] lg:object-[center_30%]"
        />
        <div aria-hidden="true" className="centres-detail-wash pointer-events-none absolute inset-0" />

        <div className="shell relative z-[1] flex flex-col">
          <div className="flex min-h-[min(110vw,560px)] flex-col lg:min-h-[540px] lg:flex-row lg:items-center lg:justify-between lg:gap-8">
            <div className="flex flex-1 flex-col justify-center py-9 xs:py-11 sm:py-12 lg:max-w-[58%] lg:py-12">
              <p className="k-hero-eyebrow">{copy['hero.eyebrow']}</p>

              <h1 className="page-title-hero mt-4 text-[var(--dc-ink)] xs:mt-5 lg:mt-6">
                {copy['hero.title.line1']}
                <br />
                {copy['hero.title.line2']} <span className="text-[var(--dc-accent-soft)]">{siteConfig.name}</span>
              </h1>

              <p className="mt-4 max-w-[42ch] text-[15px] leading-[1.6] text-[var(--dc-ink-secondary)] xs:text-[15.5px] sm:text-[16px] lg:text-[17px] 3xl:text-[18px]">
                {copy['hero.sub.line1']}
                <br className="hidden sm:inline" /> {copy['hero.sub.line2']}
              </p>

              <div className="mt-6 flex flex-row flex-wrap items-center gap-2.5 xs:mt-7 xs:gap-3 sm:mt-8 sm:gap-x-4 sm:gap-y-5 lg:mt-8">
                <Link
                  href={copy['hero.cta.href'] as Route}
                  className="v2-cta-glow group/explore inline-flex min-h-11 items-center gap-2 rounded-full py-2.5 pr-3.5 pl-4 text-[13px] font-bold text-white transition-[background-color,box-shadow] duration-200 sm:min-h-12 sm:gap-6 sm:py-4 sm:pr-5.5 sm:pl-7 sm:text-[16px]"
                >
                  {copy['hero.cta.label']}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/explore:translate-x-0.5 sm:h-5 sm:w-5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </Link>
                <HeroEnquireCta centres={enquiryCentres} label={copy['hero.enquire.label']} />
              </div>

              <AskAiLink className="mt-4 text-[var(--dc-accent-soft)] sm:mt-5" />
            </div>

            <HeroEnquiryCard
              centres={enquiryCentres}
              source="home-hero-form"
              tone="dc"
              titleId="home-hero-form-title"
            />
          </div>

          <div className="pb-6 sm:pb-8">
            <StatsStrip counts={counts} />
          </div>
        </div>
      </div>
    </section>
  );
}
