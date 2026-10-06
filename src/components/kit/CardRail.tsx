'use client';

import type { ReactNode } from 'react';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';

/**
 * Cards in a row: a swipe-snap slider on phones (with Prev/Next arrows whenever there is more
 * to scroll to), an even grid from tablet up. `cols` is the desktop column count.
 */
export function CardRail({
  cols = 3,
  colsMd,
  label,
  children,
}: {
  /** Desktop column count. */
  cols?: 2 | 3 | 4 | 5;
  /** Tablet column count (defaults to `cols`). */
  colsMd?: 2 | 3 | 4;
  label: string;
  children: ReactNode;
}) {
  const { ref, edge, scrollByItem } = useScrollTrack<HTMLDivElement>();
  const canSlide = !(edge.start && edge.end);

  return (
    <div>
      {canSlide ? (
        <ScrollNavButtons
          edge={edge}
          onPrev={() => scrollByItem(-1)}
          onNext={() => scrollByItem(1)}
          label={label}
          alwaysVisible
          className="mb-3 justify-end md:hidden"
        />
      ) : null}
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="kit-rail focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--theme-accent)]"
        style={{ '--kit-cols': cols, '--kit-cols-md': colsMd ?? cols } as React.CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
