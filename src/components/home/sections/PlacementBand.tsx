import type { HomeCopy } from '@/lib/content/copy/pages/home';
import { fill } from '@/lib/content/copy/define';

/**
 * A solid red band straight after the banner: the year's placement count and a one-line invitation. The
 * figure comes from the placements content (`learnersPlaced`), so it is edited in one place. The layers behind
 * the text are decoration only: soft light and shade, a faded dot grid at the edges and hairlines.
 */
export function PlacementBand({ copy, placed }: { copy: HomeCopy; placed: { value: string } }) {
  const line1 = fill(copy['placementBand.line1'], { placed: placed.value });

  return (
    <section className="relative isolate overflow-hidden bg-[var(--theme-accent)] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_130%_at_88%_0%,rgb(255_255_255/0.18),transparent_62%),radial-gradient(55%_110%_at_0%_100%,rgb(0_0_0/0.2),transparent_66%)]" />
        <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle,rgb(255_255_255/0.6)_1px,transparent_1.5px)] [background-size:22px_22px] [mask-image:linear-gradient(90deg,#000,transparent_30%,transparent_70%,#000)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-black/15" />
      </div>

      <div className="shell py-12 text-center sm:py-14 lg:py-[4.5rem]">
        <p className="font-display text-[clamp(1.875rem,5vw,3.75rem)] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance">
          <span className="block">{line1}</span>
          <span className="block">{copy['placementBand.line2']}</span>
        </p>
      </div>
    </section>
  );
}
