'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { REASONS } from '@/components/explore/content';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';
import { HUE_VARS, type Hue } from './data';

/** Website content: the "10 reasons why Jetking is every student's choice" already published on jetking.com (see `explore/content.ts`). Five are shown; the rest live on /explore. */
const SHOWN = ['Trained & Certified Faculty', 'Practical Foundation through Labs', 'Scenario Based Learning', 'SmartLabPlus Teaching Methodology', 'Placement Support'];
const HUES: Hue[] = ['ai', 'network', 'cloud', 'cyber', 'network'];
const ITEMS = SHOWN.map((t, i) => ({ ...REASONS.find((r) => r.title === t)!, hue: HUES[i]! }));

export function WhyJetking() {
  const { ref, edge, scrollByItem } = useScrollTrack<HTMLUListElement>();

  return (
    <section className="py-12 sm:py-14 lg:py-16" aria-labelledby="home-why-heading">
      <div className="shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="dc-eyebrow text-[13px] font-bold tracking-[0.06em] uppercase">Why Jetking</p>
            <h2
              id="home-why-heading"
              className="section-title mt-2 font-display text-[var(--dc-ink)]"
            >
              What makes Jetking different?
            </h2>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <Link
              href={'/about-us' as Route}
              className="tap inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]"
            >
              Our story
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
            <ScrollNavButtons
              edge={edge}
              onPrev={() => scrollByItem(-1)}
              onNext={() => scrollByItem(1)}
              label="reasons"
              className="shrink-0"
            />
          </div>
        </div>

        <ul
          ref={ref}
          tabIndex={0}
          aria-label="Reasons to choose Jetking"
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 -mx-[var(--gutter)] px-[var(--gutter)] scroll-px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5">
          {ITEMS.map((item) => {
            const { accent, tint } = HUE_VARS[item.hue];
            return (
              <li key={item.title} className="w-[80%] shrink-0 snap-start sm:w-auto">
                <article className="flex h-full flex-col gap-3.5 p-1 sm:p-2">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-[color-mix(in_srgb,var(--dc-hairline)_80%,transparent)]"
                    style={{ background: tint, color: accent }}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="text-[15.5px] font-extrabold text-[var(--dc-ink)] sm:text-[16px]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--dc-ink-muted)]">
                      {item.detail}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
