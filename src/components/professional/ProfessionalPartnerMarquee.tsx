'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { professionalCopy } from '@/lib/content/copy/pages/professional';
import { HIRING_PARTNERS } from './data';

/**
 * Hiring-partner logos as an auto-scrolling strip (same recipe as the /placements recruiter
 * marquee: `.dc-marquee` in dark-canvas.css).
 *
 * Auto-moving content needs a way to stop it (WCAG 2.2.2), so besides pausing on hover and
 * keyboard focus there is an explicit Pause / Play button. With `prefers-reduced-motion` the
 * CSS turns the strip into a static wrapped grid and the button is hidden. The second copy of
 * the list only exists for the seamless loop, so it is `aria-hidden`.
 */
export function ProfessionalPartnerMarquee({ copy }: { copy: typeof professionalCopy.defaults }) {
  const [paused, setPaused] = useState(false);

  return (
    <div>
      <div className="dc-marquee" data-paused={paused} style={{ ['--dc-marquee-duration' as string]: '36s' }}>
        <div className="dc-marquee-track">
          <PartnerList />
          <PartnerList clone />
        </div>
      </div>

      <div className="mt-5 flex justify-center motion-reduce:hidden">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? copy['partners.play.aria'] : copy['partners.pause.aria']}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 text-[12.5px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)]"
        >
          {paused ? (
            <Play className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          ) : (
            <Pause className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          )}
          {paused ? copy['partners.play'] : copy['partners.pause']}
        </button>
      </div>
    </div>
  );
}

function PartnerList({ clone = false }: { clone?: boolean }) {
  return (
    <ul
      // `pr-4` matches the gap, so both copies are the same width and the loop lands exactly.
      className={`flex shrink-0 gap-4 pr-4${clone ? ' dc-marquee-clone' : ''}`}
      aria-hidden={clone || undefined}
    >
      {HIRING_PARTNERS.map((partner) => (
        <li
          key={partner.name}
          // White tiles in both themes: the logos are artwork drawn for a white ground.
          className="flex h-20 w-40 shrink-0 items-center justify-center rounded-[12px] bg-white px-5 py-3.5 shadow-logo sm:h-24 sm:w-48"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logos; nothing for the image optimiser to do */}
          <img
            src={partner.logo}
            alt={clone ? '' : partner.name}
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        </li>
      ))}
    </ul>
  );
}
