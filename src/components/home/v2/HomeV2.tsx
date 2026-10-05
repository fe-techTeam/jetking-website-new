import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { fill } from '@/lib/content/copy/define';
import type { HomeCopy } from '@/lib/content/copy/pages/home';
import { SINCE_FOUNDED } from '@/lib/brand-facts';
import { AskAiLink } from '@/components/AskAiLink';
import { ActionBar } from './ActionBar';
import { JourneyHexes } from './JourneyHexes';
import { HeroEnquireCta } from './HeroEnquireCta';
import type { EnquiryCentre } from '@/components/EnquiryModal';

/**
 * The homepage — "Future-Ready".
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
  /** Live network size for the proof line — computed, never a hand-typed claim. */
  counts: { centres: number; cities: number };
  copy: HomeCopy;
}) {
  const proof = [
    SINCE_FOUNDED,
    fill(copy['hero.proof.centres'], { centres: counts.centres }),
    fill(copy['hero.proof.cities'], { cities: counts.cities }),
  ];
  return (
    <section
      className={[
        'home-v2 home-v2-themeable relative flex flex-col overflow-hidden',
        /*
         * The header is sticky and transparent until scrolled, so pulling this
         * section's box up behind it (negative margin) and padding the same
         * amount back in keeps every bit of visible content exactly where it
         * was — only the gradient background now extends up behind the header
         * instead of stopping in a hard line at the header's bottom edge.
         * Offsets must match SiteHeader's own height breakpoints (72/80/88/96).
         */
        '-mt-[72px] pt-[72px]',
        'xs:-mt-[80px] xs:pt-[80px]',
        'sm:-mt-[88px] sm:pt-[88px]',
        '2xl:-mt-[96px] 2xl:pt-[96px]',
      ].join(' ')}
    >
      <div className="shell relative flex flex-1 flex-col py-8 xs:py-10 sm:py-12 md:py-14 lg:py-12 xl:py-10 2xl:py-8 3xl:py-10">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div
          className={[
            'grid flex-1 items-center gap-8',
            'xs:gap-9 sm:gap-10 md:gap-12',
            /* Stacked up to 1024px. From 1024px the hero is two-column (circles from 1200px) — heading left,
               honeycomb right in the banner's first part — with a compact left column and
               NO rail gutter (the rail stays inline below until 2xl). That keeps the hexes
               ~240px so labels never clip. At 2xl the column widens, the rail goes fixed,
               and the hero reserves its gutter. */
            /* 1024–1199: two-column too, with the chooser as compact row cards (circles need 1200px). */
            'lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-8',
            'lg2:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg2:gap-6',
            '2xl:grid-cols-[minmax(0,470px)_minmax(0,1fr)] 2xl:gap-6',
            '3xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)] 3xl:gap-10',
            '4xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)] 4xl:gap-12',
          ].join(' ')}
        >
          <div className="flex h-full flex-col justify-center">
            <p className="k-hero-eyebrow">
              {copy['hero.eyebrow']}
            </p>

            <h1
              className="page-title-hero mt-4 text-[var(--v2-ink)] xs:mt-5 lg:mt-6"
            >
              {copy['hero.title.line1']}
              <br />
              {copy['hero.title.line2']}{' '}
              <span className="text-[var(--v2-accent)]">{siteConfig.name}</span>
            </h1>

            <p className="mt-4 max-w-[42ch] text-[15px] leading-[1.6] text-[var(--v2-ink-secondary)] xs:mt-4 xs:text-[15.5px] sm:text-[16px] lg:text-[17px] 3xl:text-[18px]">
              {copy['hero.sub.line1']}
              <br className="hidden sm:inline" /> {copy['hero.sub.line2']}
            </p>

            <ul className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] font-bold text-[var(--v2-ink)] sm:text-[14px]">
              {proof.map((item, i) => (
                <li key={item} className="flex items-center gap-2.5">
                  {i > 0 ? (
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[var(--v2-accent)]" />
                  ) : null}
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-row flex-wrap items-center gap-2.5 xs:mt-7 xs:gap-3 sm:mt-8 sm:gap-x-4 sm:gap-y-5 2xl:gap-x-6 lg:mt-8 2xl:mt-[34px]">
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

            <AskAiLink className="mt-4 text-[var(--v2-eyebrow)] sm:mt-5" />

          </div>

          {/* Chooser occupies the former banner slot */}
          <div className="v2-hero-stage relative flex h-full flex-col items-center justify-center text-center">
            <h2 className="subsection-title font-display text-[var(--v2-ink)]">
              {copy['chooser.title']}
            </h2>
            <p className="mt-2.5 text-[14px] text-[var(--v2-ink-muted)] xs:mt-3 xs:text-[15px] sm:text-[15.5px]">
              {copy['chooser.sub']}
            </p>

            <div className="mt-5 w-full xs:mt-6 lg:mt-6 xl:mt-7">
              <JourneyHexes copy={copy} />
            </div>
          </div>
        </div>

        {/* ── Action bar ───────────────────────────────────────────────── */}
        <div className="mt-8 shrink-0 xs:mt-10 lg:mt-12 3xl:mt-14">
          <ActionBar copy={copy} />
        </div>
      </div>
    </section>
  );
}
