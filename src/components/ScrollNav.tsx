'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '@/components/ui';

/**
 * Shared logic behind every "scrolls on mobile, becomes a static grid/wrap from `sm`"
 * row on the site (home's Steps, Recognitions, the courses technology filter, …).
 *
 * Touch and trackpad users can already swipe these — the gap this closes is a plain
 * mouse, which has no way to drag a hidden-scrollbar `overflow-x-auto` row at all.
 * Same approach as `CardTrack`'s carousel, generalised so it isn't reimplemented at
 * every call site.
 */
export function useScrollTrack<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    el.addEventListener('scroll', updateEdges, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', updateEdges);
    };
  }, [updateEdges]);

  const scrollByItem = useCallback((direction: 1 | -1) => {
    const el = ref.current;
    const first = el?.firstElementChild as HTMLElement | null;
    if (!el || !first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * (first.offsetWidth + gap), behavior: reduce ? 'auto' : 'smooth' });
  }, []);

  return { ref, edge, updateEdges, scrollByItem };
}

const roundButton =
  'grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--dc-hairline-strong)] disabled:hover:bg-[var(--dc-card)]';

/**
 * Prev/Next controls for a `useScrollTrack` row — visible only below `sm`, where the
 * row is the thing that scrolls (it becomes a static grid/wrap from `sm` up, so the
 * buttons would have nothing to do there).
 */
export function ScrollNavButtons({
  edge,
  onPrev,
  onNext,
  label,
  className,
}: {
  edge: { start: boolean; end: boolean };
  onPrev: () => void;
  onNext: () => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cx('flex gap-2 sm:hidden', className)}>
      <button
        type="button"
        onClick={onPrev}
        disabled={edge.start}
        aria-label={`Previous ${label}`}
        className={roundButton}
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={edge.end}
        aria-label={`Next ${label}`}
        className={roundButton}
      >
        <ChevronRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
      </button>
    </div>
  );
}
