'use client';

import type { ReactNode } from 'react';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';

/**
 * Swipeable row with Prev / Next and a progress bar — one page of cards at a time.
 * Scroll behaviour, edge detection and reduced-motion handling come from the shared
 * `useScrollTrack` hook (the same one behind the home page's scroll rows); this component only
 * adds the layout. No autoplay, so there is nothing to pause. Every slide stays in the DOM.
 */
export function SnapSlider({
  children,
  label,
  header,
  aside,
}: {
  children: ReactNode;
  label: string;
  header?: ReactNode;
  /** Optional left column (about 20% on desktop, stacked above on phones) beside the slider. */
  aside?: ReactNode;
}) {
  const { ref, edge, progress, scrollByPage } = useScrollTrack<HTMLUListElement>();

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">{header}</div>
        <ScrollNavButtons
          edge={edge}
          onPrev={() => scrollByPage(-1)}
          onNext={() => scrollByPage(1)}
          label={label}
          alwaysVisible
        />
      </div>
      <div className={aside ? 'mt-8 grid gap-6 lg:grid-cols-[minmax(0,20%)_minmax(0,1fr)]' : 'mt-8'}>
        {aside}
        <div className="min-w-0">
          <ul ref={ref} className="cp-snap cp-snap-clean" tabIndex={0} aria-label={label}>
            {children}
          </ul>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-[var(--cp-line)]" aria-hidden="true">
            <div
              className="h-full w-1/4 rounded-full bg-[var(--cp-red)] transition-[margin] duration-150"
              style={{ marginLeft: `${progress * 75}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
