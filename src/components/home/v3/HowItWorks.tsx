'use client';

import { ArrowRight, BookOpen, BriefcaseBusiness, Check, Cpu, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';
import { HUE_VARS, type Hue } from './data';

interface Step {
  icon: LucideIcon;
  hue: Hue;
  title: string;
  points: string[];
}

/** Wording taken from the site's own content: `placements/data.ts` (process steps, student benefits), the live "reasons" (`explore/content.ts`) and the course certifications. */
const STEPS: Step[] = [
  {
    icon: BookOpen,
    hue: 'network',
    title: 'Learn',
    points: ['Learn practically with real-world tools', 'Trained & certified faculty', 'Scenario based learning'],
  },
  {
    icon: Cpu,
    hue: 'cloud',
    title: 'Practice',
    points: ['One computer per student in the lab', 'Mock interviews', 'AI bot interviews and presentation practice'],
  },
  {
    icon: Trophy,
    hue: 'cyber',
    title: 'Get certified',
    points: ['Industry certifications such as CCNA, AWS and CEH', 'Jetking certificates for every course', 'Partnership with NSDC'],
  },
  {
    icon: BriefcaseBusiness,
    hue: 'ai',
    title: 'Get placement support',
    points: ['Biodata preparation', 'Student interviews with hiring partners', 'Appointment letter'],
  },
];

export function HowItWorks() {
  const { ref, edge, scrollByItem } = useScrollTrack<HTMLOListElement>();

  return (
    <section
      className="py-12 sm:py-14 lg:py-16"
      aria-labelledby="home-how-heading"
    >
      <div className="shell">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h2
              id="home-how-heading"
              className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] xs:text-[28px] sm:text-[32px]"
            >
              Build your career, step by step
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
              From beginner to job-ready professional &mdash; we guide you at every stage.
            </p>
          </div>
          <ScrollNavButtons
            edge={edge}
            onPrev={() => scrollByItem(-1)}
            onNext={() => scrollByItem(1)}
            label="steps"
            className="mb-1 shrink-0"
          />
        </div>

        <ol
          ref={ref}
          aria-label="Steps"
          tabIndex={0}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 -mx-[var(--gutter)] px-[var(--gutter)] scroll-px-[var(--gutter)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => {
            const { accent, tint } = HUE_VARS[step.hue];
            return (
              <li key={step.title} className="relative w-[80%] shrink-0 snap-start sm:w-auto">
                <div
                  className="h-full rounded-[22px] border border-[var(--dc-hairline)] p-5 shadow-[var(--dc-shadow)] sm:p-6"
                  style={{ background: `linear-gradient(160deg, ${tint}, var(--dc-card) 70%)` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--dc-card)]"
                      style={{ color: accent }}
                    >
                      <step.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="font-display text-[17px] font-extrabold text-[var(--dc-ink)]">
                      <span className="numeral mr-1.5">{index + 1}</span>
                      {step.title}
                    </h3>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {step.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-[13px] leading-snug text-[var(--dc-ink-secondary)]"
                      >
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0"
                          style={{ color: accent }}
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                {index < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 -right-[18px] z-10 hidden h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-[var(--dc-card)] text-[var(--dc-accent-soft)] shadow-[var(--dc-shadow)] lg:grid"
                  >
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
