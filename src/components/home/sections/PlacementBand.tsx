import type { HomeCopy } from '@/lib/content/copy/pages/home';
import { fill } from '@/lib/content/copy/define';

/**
 * The year's placement count and a one-line invitation, straight after the banner. Styled as the same red
 * card as the "top positions" statement further down the page (28px radius, dark-red border, concentric
 * rings), so the two read as one family. The figure comes from the placements content (`learnersPlaced`),
 * so it is edited in one place. `kit` provides the shadow token the card uses.
 */
export function PlacementBand({ copy, placed }: { copy: HomeCopy; placed: { value: string } }) {
  const line1 = fill(copy['placementBand.line1'], { placed: placed.value });

  return (
    <div className="kit shell py-5 sm:py-6">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-jk-700 bg-jk-600 p-6 text-white shadow-[var(--k-shadow-up)] sm:p-10 lg:px-14 lg:py-12">
        <span aria-hidden="true" className="pointer-events-none absolute -right-24 -bottom-32 -z-10 hidden h-[520px] w-[520px] rounded-full border border-white/15 lg:block" />
        <span aria-hidden="true" className="pointer-events-none absolute -right-8 -bottom-16 -z-10 hidden h-[360px] w-[360px] rounded-full border border-white/20 lg:block" />
        <p className="mx-auto max-w-[28ch] text-center font-display text-[28px] leading-[1.1] font-extrabold tracking-[-0.02em] text-balance sm:text-[40px] lg:text-[52px]">
          <span className="block">{line1}</span>
          <span className="block">{copy['placementBand.line2']}</span>
        </p>
      </section>
    </div>
  );
}
