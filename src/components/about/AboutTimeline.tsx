'use client';

import { useId, useState } from 'react';
import { TIMELINE } from './data';

/**
 * Decade bands the timeline is broken into. Each milestone lands in the
 * first band its year fits (so a boundary year like 1986 lands in the band
 * that ends there, not the one that starts there).
 */
const DECADE_BANDS: Array<{ label: string; end: number }> = [
  { label: '1940 – 1986', end: 1986 },
  { label: '1986 – 2010', end: 2010 },
  { label: '2010 – 2020', end: 2020 },
  { label: '2020 – 2026', end: 2026 },
];

const timelineByDecade = DECADE_BANDS.map((band, bandIndex) => {
  const previousEnd = DECADE_BANDS[bandIndex - 1]?.end ?? -Infinity;
  return {
    label: band.label,
    items: TIMELINE.filter((item) => {
      const year = parseInt(item.year, 10);
      return year > previousEnd && year <= band.end;
    }),
  };
});

/**
 * Decade tabs — one panel of milestone cards per band. Replaces the previous
 * GSAP scroll-scrubbed vertical timeline (which made visitors scroll through
 * 23 milestones to reach the end) with a single click to jump to any decade.
 */
export function AboutTimeline() {
  const [activeIndex, setActiveIndex] = useState(timelineByDecade.length - 1);
  const tabId = useId();
  const active = timelineByDecade[activeIndex]!;

  return (
    <div className="mt-8 sm:mt-10">
      <div role="tablist" aria-label="Company history by decade" className="flex flex-wrap gap-2">
        {timelineByDecade.map((band, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={band.label}
              type="button"
              role="tab"
              id={`${tabId}-tab-${index}`}
              aria-selected={isActive}
              aria-controls={`${tabId}-panel-${index}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
                e.preventDefault();
                const delta = e.key === 'ArrowRight' ? 1 : -1;
                const next = (index + delta + timelineByDecade.length) % timelineByDecade.length;
                setActiveIndex(next);
                document.getElementById(`${tabId}-tab-${next}`)?.focus();
              }}
              className="about-tl-tab numeral shrink-0"
            >
              {band.label}
            </button>
          );
        })}
      </div>

      <div
        key={activeIndex}
        id={`${tabId}-panel-${activeIndex}`}
        role="tabpanel"
        aria-labelledby={`${tabId}-tab-${activeIndex}`}
        tabIndex={0}
        className="about-tl-fade-in mt-6 grid gap-4 sm:grid-cols-2"
      >
        {active.items.map((item) => (
          <div key={`${item.year}-${item.title}`} className="dc-panel rounded-[16px] p-5 sm:p-6">
            <span className="numeral inline-flex rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold text-[var(--dc-accent-soft)]">
              {item.year}
            </span>
            <h3 className="mt-3 font-display text-[16px] leading-snug font-bold tracking-[-0.01em] text-[var(--dc-ink)]">
              {item.title}
            </h3>
            {item.body ? (
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--dc-ink-secondary)]">
                {item.body}
              </p>
            ) : null}
            {item.link ? (
              <a
                href={item.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="tap mt-3 inline-flex min-h-6 items-center text-[13px] font-bold text-[var(--dc-accent-soft)] hover:underline"
              >
                {item.link.label}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
