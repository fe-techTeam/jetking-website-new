'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Swipeable row with Prev / Next. Native scroll-snap does the sliding (touch, trackpad and
 * keyboard work without JS); the buttons just move it one page. No autoplay, so there is
 * nothing to pause. Every slide stays in the DOM.
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
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const [progress, setProgress] = useState(0);

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  function page(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  }

  const btn =
    'grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-[var(--cp-line)] bg-[var(--cp-bg)] text-[var(--cp-ink)] transition-colors hover:border-[var(--cp-red)] hover:text-[var(--cp-red)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--cp-line)] disabled:hover:text-[var(--cp-ink)]';

  const controls = (
    <div className="flex shrink-0 gap-2">
      <button type="button" className={btn} onClick={() => page(-1)} disabled={edge.start} aria-label="Previous">
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button type="button" className={btn} onClick={() => page(1)} disabled={edge.end} aria-label="Next">
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">{header}</div>
        {controls}
      </div>
      <div className={aside ? 'mt-8 grid gap-6 lg:grid-cols-[minmax(0,20%)_minmax(0,1fr)]' : 'mt-8'}>
        {aside}
        <div className="min-w-0">
          <ul ref={track} onScroll={update} className="cp-snap cp-snap-clean" tabIndex={0} aria-label={label}>
            {children}
          </ul>
          <div className="mt-5 h-1 overflow-hidden rounded-full bg-[var(--cp-line)]" aria-hidden="true">
            <div className="h-full w-1/4 rounded-full bg-[var(--cp-red)] transition-[margin] duration-150" style={{ marginLeft: `${progress * 75}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
