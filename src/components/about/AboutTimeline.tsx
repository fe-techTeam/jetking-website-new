'use client';

import { useId, useState } from 'react';
import type { Milestone } from '@/lib/content/types';
import { fill } from '@/lib/content/copy/define';
import type { aboutCopy } from '@/lib/content/copy/pages/about';

/**
 * Decade bands the timeline is broken into. Each milestone lands in the
 * first band its year fits (so a boundary year like 1986 lands in the band
 * that ends there, not the one that starts there).
 */
const BAND_ENDS = [1986, 2010, 2020] as const;

/**
 * The timeline is CMS content now, so a milestone can be added for any year. The first band is
 * open-ended downward and the last open-ended upward (its label follows the newest year), which
 * means no milestone an editor adds can silently fall between bands and vanish. Empty bands are
 * dropped rather than shown as blank tabs.
 */
function groupByDecade(timeline: Milestone[], copy: typeof aboutCopy.defaults) {
  const latest = Math.max(2026, ...timeline.map((m) => parseInt(m.year, 10)).filter(Number.isFinite));
  const bands = [
    { label: copy['timeline.band.0'], end: BAND_ENDS[0] as number },
    { label: copy['timeline.band.1'], end: BAND_ENDS[1] as number },
    { label: copy['timeline.band.2'], end: BAND_ENDS[2] as number },
    { label: fill(copy['timeline.band.3'], { latest }), end: Infinity },
  ];
  return bands
    .map((band, bandIndex) => {
      const previousEnd = bands[bandIndex - 1]?.end ?? -Infinity;
      return {
        label: band.label,
        items: timeline.filter((item) => {
          const year = parseInt(item.year, 10);
          return year > previousEnd && year <= band.end;
        }),
      };
    })
    .filter((band) => band.items.length > 0);
}

/**
 * Decade tabs — one panel of milestone cards per band. Replaces the previous
 * GSAP scroll-scrubbed vertical timeline (which made visitors scroll through
 * 23 milestones to reach the end) with a single click to jump to any decade.
 */
export function AboutTimeline({ timeline, copy }: { timeline: Milestone[]; copy: typeof aboutCopy.defaults }) {
  const timelineByDecade = groupByDecade(timeline, copy);
  const [activeIndex, setActiveIndex] = useState(timelineByDecade.length - 1);
  const tabId = useId();
  const active = timelineByDecade[Math.min(activeIndex, timelineByDecade.length - 1)];
  if (!active) return null;

  return (
    <div className="mt-8 sm:mt-10">
      <div role="tablist" aria-label={copy['timeline.tabsLabel']} className="flex flex-wrap gap-2">
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
          <div key={`${item.year}-${item.title}`} className="kit kit-card p-5 sm:p-6">
            <span className="numeral inline-flex rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold text-[var(--dc-accent-soft)]">
              {item.year}
            </span>
            <h3 className="mt-3 font-display text-[16px] leading-snug font-bold tracking-[-0.01em] text-[var(--dc-ink)]">
              {item.title}
            </h3>
            {item.body ? (
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)]">
                {item.body}
              </p>
            ) : null}
            {item.link ? (
              <a
                href={item.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="tap mt-3 inline-flex min-h-11 items-center sm:min-h-6 text-[13px] font-bold text-[var(--dc-accent-soft)] hover:underline"
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
