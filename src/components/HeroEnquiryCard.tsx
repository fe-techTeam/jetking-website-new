'use client';

import { QuickEnquiryForm, type EnquiryCentre } from '@/components/QuickEnquiryForm';
import { useSiteCopy } from '@/components/providers/site-copy';

/**
 * The lead-form card that sits in the open right-hand side of a page banner (/centres, /courses).
 *
 * Desktop only: below `lg` the banner is a single column, and each of these pages already has a
 * closing "Enquire now" call to action further down. Colours come from the host page's token set
 * — `centres` reads `--centres-*`, `dc` reads the shared `--dc-*` dark-canvas tokens — so the card
 * follows that page's light/dark theme like everything around it.
 */
const TONES = {
  // Each `eyebrow` matches that host banner's own eyebrow style (CentresHero / dc-eyebrow
  // label-mono), so this card's heading reads as part of the same banner, not a one-off.
  centres: {
    card: 'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] shadow-[var(--dc-shadow)]',
    eyebrow: 'k-hero-eyebrow',
  },
  dc: {
    card: 'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] shadow-[var(--dc-shadow)]',
    eyebrow: 'k-hero-eyebrow',
  },
} as const;

export function HeroEnquiryCard({
  centres,
  source,
  tone,
  titleId,
}: {
  centres: EnquiryCentre[];
  /** Recorded with the lead so it is clear which banner it came from, e.g. `courses-hero-form`. */
  source: string;
  tone: keyof typeof TONES;
  /** Unique id for the heading that names the card. */
  titleId: string;
}) {
  const t = TONES[tone];
  const copy = useSiteCopy();
  return (
    <aside
      aria-labelledby={titleId}
      className="hidden lg:block lg:w-[400px] lg:shrink-0 lg:py-7 lg:pr-8 xl:w-[440px] xl:pr-10"
    >
      <div className={`rounded-[24px] border p-4 ${t.card}`}>
        <h2 id={titleId} className={`mb-3 ${t.eyebrow}`}>
          {copy['enquiry.heroCard.title']}
        </h2>
        <QuickEnquiryForm centres={centres} source={source} compact />
      </div>
    </aside>
  );
}
