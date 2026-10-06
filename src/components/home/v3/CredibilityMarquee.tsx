'use client';

import { LogoStrip, Section, SectionHeader } from '@/components/kit';
import { UNIVERSITY_PARTNERS } from '@/components/explore/content';
import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { HIRING_PARTNERS } from '@/components/professional/data';
import { CERT_LOGOS, MORE_EMPLOYER_LOGOS } from './data';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

const EMPLOYER_LOGOS: ReadonlyArray<{ name: string; file: string; dark?: boolean }> = [
  ...HIRING_PARTNERS.map((p) => ({ name: p.name, file: p.logo })),
  ...MORE_EMPLOYER_LOGOS,
];

/**
 * Two auto-scrolling logo rows — certifications the curriculum prepares students for, and
 * where alumni work. Same `.dc-marquee` recipe as `ProfessionalPartnerMarquee` (pause on
 * hover/focus, explicit Pause/Play control for WCAG 2.2.2, static wrapped grid under
 * `prefers-reduced-motion`). Logos are real assets already in the repo — `public/logos/`
 * (matched against certifications named in the course fixtures) and `HIRING_PARTNERS`
 * (jetking.com's own published recruiter list) — nothing invented for this page.
 */
export function CredibilityMarquee({ copy }: { copy: HomeCopy }) {
  const [paused, setPaused] = useState(false);

  return (
    <Section tone="tint" labelledBy="home-credibility-heading">
        <SectionHeader
          id="home-credibility-heading"
          eyebrow={copy['marquee.eyebrow']}
          title={copy['marquee.heading']}
        />

        <div className="mt-8 sm:mt-10">
          <p className="label-mono text-[12px] text-[var(--dc-ink-muted)]">{copy['marquee.certs.label']}</p>
          <div className="mt-3 dc-marquee" data-paused={paused} style={{ ['--dc-marquee-duration' as string]: '32s' }}>
            <div className="dc-marquee-track">
              <LogoList items={CERT_LOGOS} />
              <LogoList items={CERT_LOGOS} clone />
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <p className="label-mono text-[12px] text-[var(--dc-ink-muted)]">{copy['marquee.alumni.label']}</p>
          <div className="mt-3 dc-marquee" data-paused={paused} style={{ ['--dc-marquee-duration' as string]: '40s' }}>
            <div className="dc-marquee-track">
              <LogoList items={EMPLOYER_LOGOS} />
              <LogoList items={EMPLOYER_LOGOS} clone />
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10">
          <p className="label-mono text-[12px] text-[var(--dc-ink-muted)]">{copy['recognition.universities.label']}</p>
          <div className="mt-3">
            <LogoStrip
              size="lg"
              showNames
              label={copy['recognition.universities.aria']}
              logos={UNIVERSITY_PARTNERS.map((p) => ({ name: p.name, src: p.src }))}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center motion-reduce:hidden">
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-pressed={paused}
            aria-label={paused ? copy['marquee.play.aria'] : copy['marquee.pause.aria']}
            className="dc-chip inline-flex h-10 gap-2 px-4 text-[12.5px]"
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
            ) : (
              <Pause className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
            )}
            {paused ? copy['marquee.play.label'] : copy['marquee.pause.label']}
          </button>
        </div>
      </Section>
  );
}

function LogoList({
  items,
  clone = false,
}: {
  items: ReadonlyArray<{ name: string; file: string; dark?: boolean }>;
  clone?: boolean;
}) {
  return (
    <ul
      className={`flex shrink-0 gap-4 pr-4${clone ? ' dc-marquee-clone' : ''}`}
      aria-hidden={clone || undefined}
    >
      {items.map((item, index) => (
        <li
          key={`${item.name}-${index}`}
          className={`flex h-16 w-32 shrink-0 items-center justify-center rounded-[12px] px-4 py-3 shadow-logo sm:h-20 sm:w-40 ${'dark' in item && item.dark ? 'bg-tile-dark' : 'bg-white'}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small static logos; nothing for the image optimiser to do */}
          <img
            src={item.file}
            alt={clone ? '' : item.name}
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        </li>
      ))}
    </ul>
  );
}
