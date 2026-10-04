'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const roundButton =
  'grid h-11 w-11 place-items-center rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--dc-hairline-strong)] disabled:hover:bg-[var(--dc-card)]';

/**
 * Swipeable card row — one card on a phone, two on a tablet, three on desktop.
 * Same approach as `OfferLetterSlider`: native scroll-snap does the sliding (touch,
 * trackpad and keyboard scrolling work with no JS), Prev/Next scroll by one card, and
 * there is no autoplay. Children are `<li>` cards; every card stays in the DOM, so all
 * of them remain crawlable.
 */
export function CardTrack({ label, children }: { label: string; children: ReactNode }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = trackRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateEdges]);

  function scrollByCard(direction: 1 | -1) {
    const el = trackRef.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * (first.offsetWidth + gap), behavior: reduce ? 'auto' : 'smooth' });
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          disabled={edge.start}
          aria-label={`Previous ${label}`}
          className={roundButton}
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          disabled={edge.end}
          aria-label={`Next ${label}`}
          className={roundButton}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>

      <ul
        ref={trackRef}
        onScroll={updateEdges}
        // A scroll container must be focusable for keyboard users to scroll it with the arrow keys.
        tabIndex={0}
        aria-label={label}
        className="mt-4 flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pt-1 pb-4 motion-reduce:scroll-auto sm:gap-6"
      >
        {children}
      </ul>
    </div>
  );
}
