'use client';

import { ArrowRight, Award, BookOpen, Briefcase, Code2 } from 'lucide-react';
import type { Course } from '@/lib/content/types';
import {
  buildCareerRoadmap,
  interestIntent,
  type StudentDiscovery,
} from '@/persona/studentJourney';
import { track } from '@/lib/analytics';

const PHASE_ICONS = [BookOpen, Code2, Award, Briefcase] as const;

export function RoadmapStep({
  course,
  discovery,
  onContinue,
}: {
  course: Course;
  discovery: StudentDiscovery;
  onContinue: () => void;
}) {
  const phases = buildCareerRoadmap(course, discovery);
  const intent = interestIntent(discovery.interest);

  return (
    <div className="space-y-8">
      <div>
        <p className="k-eyebrow">
          Step 4 · Your career roadmap
        </p>
        <h2 className="section-title mt-2 font-display text-[var(--dc-ink)]">
          Your path to a {intent} career
        </h2>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
          Based on <strong className="font-bold text-[var(--dc-ink)]">{course.title}</strong>{' '}
          — here is how Jetking takes you from learning to employment.
        </p>
      </div>

      <ol className="stu-journey-panel relative overflow-hidden rounded-[28px] px-5 py-8 xs:rounded-[28px] sm:px-8 sm:py-10">
        {phases.map((phase, i) => {
          const Icon = PHASE_ICONS[i] ?? BookOpen;
          return (
            <li
              key={phase.title}
              className={[
                'relative flex gap-4 pb-8 last:pb-0',
                i < phases.length - 1
                  ? 'before:absolute before:top-10 before:left-[19px] before:h-[calc(100%-2rem)] before:w-px before:bg-[var(--dc-accent-soft)]/35'
                  : '',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[var(--dc-accent-soft)] bg-[var(--dc-card)] text-[var(--dc-accent-soft)]"
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-display text-[17px] font-extrabold text-[var(--dc-ink)]">
                    {phase.title}
                  </h3>
                  {phase.duration ? (
                    <span className="text-[12px] font-semibold text-[var(--dc-accent-soft)]">
                      {phase.duration}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)]">
                  {phase.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => {
          track('journey_roadmap_continue', { slug: course.slug });
          onContinue();
        }}
        className="group/next inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--dc-navy)] py-3 pr-3 pl-6 text-[15px] font-bold text-white transition-colors hover:bg-jk-700"
      >
        Book free counselling for this path
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform group-hover/next:translate-x-0.5"
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
        </span>
      </button>
    </div>
  );
}
