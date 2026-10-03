'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { useDialog } from '@/components/useDialog';

export interface OfferLetterSample {
  /** Path under /public — replace with a real, consented letter to swap a sample out. */
  src: string;
  alt: string;
  /** The role named in the letter. */
  title: string;
  /** Sector of the (placeholder) employer. */
  sector: string;
}

const NOTE = 'Illustrative sample — actual offer letters vary by employer.';

const roundButton =
  'grid h-11 w-11 place-items-center rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:bg-[var(--dc-accent-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--dc-hairline-strong)] disabled:hover:bg-[var(--dc-card)]';

/**
 * Sample offer letters as a swipeable row — one card on a phone, two on a tablet, three on
 * desktop — where each card opens a full-size gallery.
 *
 * Native scroll-snap does the sliding (touch, trackpad and keyboard scrolling work with no JS)
 * and Prev/Next just scroll it by one card. There is deliberately no autoplay: these are
 * documents people want to read, and a self-moving row is what WCAG 2.2.2 asks a pause
 * control for.
 */
export function OfferLetterSlider({ items, label }: { items: readonly OfferLetterSample[]; label: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const hintId = useId();

  const updateEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    // 2px of slack: scrollLeft is fractional on zoomed / high-DPI screens.
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

  /** After browsing in the gallery, bring the row to the letter the visitor last looked at. */
  function closeGallery() {
    const el = trackRef.current;
    const card = openIndex === null ? null : (el?.children[openIndex] as HTMLElement | undefined);
    if (el && card) {
      const visible = card.offsetLeft >= el.scrollLeft && card.offsetLeft + card.offsetWidth <= el.scrollLeft + el.clientWidth;
      if (!visible) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'auto' });
    }
    setOpenIndex(null);
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label} className="relative">
      <div className="flex items-center justify-between gap-3">
        <p id={hintId} className="text-[14px] font-semibold text-[var(--dc-ink-muted)]">
          Tap a letter to view it full size
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            disabled={edge.start}
            aria-label="Previous sample offer letter"
            className={roundButton}
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            disabled={edge.end}
            aria-label="Next sample offer letter"
            className={roundButton}
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ul
        ref={trackRef}
        onScroll={updateEdges}
        // A scroll container must be focusable for keyboard users to scroll it with the arrow keys.
        tabIndex={0}
        aria-describedby={hintId}
        className="dc-filter-scroll mt-5 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 motion-reduce:scroll-auto"
      >
        {items.map((item, index) => (
          <li
            key={item.src}
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${items.length}: ${item.title}`}
            className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
          >
            <figure className="dc-panel flex h-full flex-col overflow-hidden rounded-[16px] p-3 sm:p-4">
              <button
                type="button"
                onClick={() => setOpenIndex(index)}
                aria-haspopup="dialog"
                aria-label={`View ${item.title} sample offer letter full size`}
                className="group relative flex h-64 cursor-zoom-in items-center justify-center overflow-hidden rounded-[12px] bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dc-accent-soft)] sm:h-72"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static SVG specimen; nothing for the image optimiser to do */}
                <img src={item.src} alt="" loading="lazy" className="h-full w-full object-contain" />
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 bottom-2.5 grid h-9 w-9 place-items-center rounded-full bg-ink-900/78 text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 max-md:opacity-100"
                >
                  <ZoomIn className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
              </button>
              <figcaption className="mt-3 px-1">
                <p className="text-[15px] font-bold text-[var(--dc-ink)]">{item.title}</p>
                <p className="mt-1 text-[14px] leading-snug text-[var(--dc-ink-muted)]">
                  {item.sector} · {NOTE}
                </p>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {openIndex !== null ? (
        <OfferLetterGallery items={items} index={openIndex} onIndexChange={setOpenIndex} onClose={closeGallery} />
      ) : null}
    </div>
  );
}

/**
 * Full-size viewer: one letter at a time with Prev/Next, a thumbnail strip and a counter.
 * Escape closes; the left/right arrow keys move between letters. Focus is trapped inside and
 * returned to the card that opened it (the shared `useDialog` behaviour).
 */
function OfferLetterGallery({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: readonly OfferLetterSample[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const item = items[index]!;
  const last = items.length - 1;

  useDialog(true, onClose, dialogRef, { modal: true });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') onIndexChange(Math.min(index + 1, last));
      if (event.key === 'ArrowLeft') onIndexChange(Math.max(index - 1, 0));
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, last, onIndexChange]);

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 sm:p-6">
      <div aria-hidden="true" className="absolute inset-0" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-full w-full max-w-[56rem] flex-col gap-3 rounded-[20px] border border-white/15 bg-ink-950/96 p-3 shadow-2xl sm:gap-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-4 px-1">
          <div className="min-w-0">
            <p id={titleId} className="truncate font-display text-[17px] font-extrabold text-white sm:text-[19px]">
              {item.title}
            </p>
            <p className="mt-0.5 text-[14px] leading-snug text-white/65">
              {item.sector} · {NOTE}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p aria-live="polite" className="numeral text-[14px] font-bold text-white/70">
              {index + 1} / {items.length}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close gallery"
              className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <div className="flex max-h-[62vh] min-h-0 w-full items-center justify-center overflow-hidden rounded-[12px] bg-white sm:max-h-[68vh]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static SVG specimen */}
            <img src={item.src} alt={item.alt} className="max-h-[62vh] w-auto max-w-full object-contain sm:max-h-[68vh]" />
          </div>

          <button
            type="button"
            onClick={() => onIndexChange(index - 1)}
            disabled={index === 0}
            aria-label="Previous letter"
            className="absolute top-1/2 left-2 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ink-900/82 text-white shadow-lg transition-colors hover:bg-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onIndexChange(index + 1)}
            disabled={index === last}
            aria-label="Next letter"
            className="absolute top-1/2 right-2 grid h-11 w-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ink-900/82 text-white shadow-lg transition-colors hover:bg-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>

        <ul className="flex justify-center gap-2 overflow-x-auto px-1 pb-1" aria-label="Choose a letter">
          {items.map((thumb, i) => (
            <li key={thumb.src} className="shrink-0">
              <button
                type="button"
                onClick={() => onIndexChange(i)}
                aria-label={`Show ${thumb.title}`}
                aria-current={i === index ? 'true' : undefined}
                className={`h-16 w-12 cursor-pointer overflow-hidden rounded-md bg-white transition-[opacity,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-[72px] sm:w-[52px] ${
                  i === index ? 'opacity-100 ring-2 ring-[var(--dc-accent-soft)]' : 'opacity-55 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static SVG specimen */}
                <img src={thumb.src} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
