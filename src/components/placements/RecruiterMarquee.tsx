'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { placementsCopy } from '@/lib/content/copy/pages/placements';

export interface Recruiter {
  name: string;
  src: string;
}

/**
 * Recruiter logos as an auto-scrolling strip.
 *
 * Auto-moving content needs a way to stop it (WCAG 2.2.2), so besides pausing on hover and
 * keyboard focus there is an explicit Pause / Play button. With `prefers-reduced-motion` there
 * is no scrolling at all — the CSS turns the strip into a static wrapped grid and hides the
 * button, since there is nothing to pause. The second copy of the list is decoration for the
 * seamless loop, so it is `aria-hidden` and screen readers hear each recruiter once.
 */
export function RecruiterMarquee({
  items,
  copy = placementsCopy.defaults,
}: {
  items: readonly Recruiter[];
  /** The Pause / Play labels — the Placements page passes its loaded copy; other pages get the shipped wording. */
  copy?: Pick<
    typeof placementsCopy.defaults,
    'recruiters.pauseLabel' | 'recruiters.resumeLabel' | 'recruiters.pause' | 'recruiters.play'
  >;
}) {
  const [paused, setPaused] = useState(false);

  return (
    <div>
      <div className="dc-marquee mt-8 sm:mt-10" data-paused={paused}>
        <div className="dc-marquee-track">
          <RecruiterList items={items} />
          <RecruiterList items={items} clone />
        </div>
      </div>

      <div className="mt-4 flex justify-center motion-reduce:hidden">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? copy['recruiters.resumeLabel'] : copy['recruiters.pauseLabel']}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 text-[12.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)]"
        >
          {paused ? (
            <Play className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <Pause className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          )}
          {paused ? copy['recruiters.play'] : copy['recruiters.pause']}
        </button>
      </div>
    </div>
  );
}

function RecruiterList({ items, clone = false }: { items: readonly Recruiter[]; clone?: boolean }) {
  return (
    <ul
      // `pr-4` matches the gap, so the two lists are the same width and the loop lands exactly.
      className={`flex shrink-0 gap-4 pr-4${clone ? ' dc-marquee-clone' : ''}`}
      aria-hidden={clone || undefined}
    >
      {items.map((company) => (
        <li
          key={company.name}
          // Logos sit on white tiles in both themes: they are raster artwork drawn for a white ground.
          className="flex h-24 w-44 shrink-0 items-center justify-center rounded-[16px] border border-[var(--dc-hairline)] bg-white px-5 py-4 shadow-md sm:h-28 sm:w-52"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logos; nothing for the image optimiser to do */}
          <img
            src={company.src}
            alt={clone ? '' : company.name}
            loading="lazy"
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        </li>
      ))}
    </ul>
  );
}
