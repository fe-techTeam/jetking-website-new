'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import type { Course } from '@/lib/content/types';
import type { StudentDiscovery } from '@/persona/studentJourney';
import { interestIntent } from '@/persona/studentJourney';
import { track } from '@/lib/analytics';

export function RecommendStep({
  courses,
  discovery,
  selectedSlug,
  onSelect,
  onContinue,
}: {
  courses: Course[];
  discovery: StudentDiscovery;
  selectedSlug?: string;
  onSelect: (slug: string) => void;
  onContinue: () => void;
}) {
  const intent = interestIntent(discovery.interest);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[13px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase">
          Step 2 · Recommended for you
        </p>
        <h2 className="section-title mt-2 font-display text-[var(--dc-ink)]">
          Courses matched to your {intent} goal
        </h2>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-[var(--dc-ink-secondary)]">
          Pick one to build your career roadmap. You can explore details or continue with
          your top match.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {courses.map((course, i) => {
          const selected = selectedSlug === course.slug;
          const top = i === 0;

          return (
            <li key={course.slug}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelect(course.slug);
                  track('journey_course_selected', { slug: course.slug, rank: i + 1 });
                }}
                className={[
                  'stu-card relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-[24px] p-5 text-left transition-[box-shadow,border-color]',
                  selected
                    ? 'ring-2 ring-[var(--dc-accent-soft)] ring-offset-2 ring-offset-[var(--dc-surface)]'
                    : 'hover:shadow-[var(--dc-shadow-hover)]',
                ].join(' ')}
              >
                {top ? (
                  <>
                    <span className="stu-course-badge" aria-hidden="true">
                      <Sparkles className="h-3 w-3" strokeWidth={2.25} />
                      Best match
                    </span>
                    <span className="sr-only">Best match for you</span>
                  </>
                ) : null}
                <span className={`font-display text-[17px] font-extrabold text-[var(--dc-ink)] ${top ? 'pr-20' : ''}`}>
                  {course.title}
                </span>
                <span className="mt-2 text-[13px] font-semibold text-[var(--dc-accent-soft)]">
                  {course.duration} · {course.level}
                </span>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)]">
                  {course.summary.slice(0, 140)}
                  {course.summary.length > 140 ? '…' : ''}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {course.outcomes.slice(0, 2).map((o) => (
                    <li
                      key={o}
                      className="flex items-start gap-2 text-[14px] text-[var(--dc-ink-muted)]"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--dc-accent-soft)]"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      {o}
                    </li>
                  ))}
                </ul>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-[var(--dc-accent-soft)]">
                  {selected ? 'Selected' : 'Select for roadmap'}
                  {selected ? (
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedSlug ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={onContinue}
            className="group/next inline-flex min-h-12 items-center gap-3 rounded-full bg-[var(--dc-accent)] py-3 pr-3 pl-6 text-[15px] font-bold text-white transition-colors hover:bg-jk-700"
          >
            Continue with selected course
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-900 transition-transform group-hover/next:translate-x-0.5"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </button>
          <Link
            href={`/courses/${selectedSlug}` as Route}
            className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[var(--dc-hairline-strong)] px-6 text-[14px] font-bold text-[var(--dc-ink-secondary)] transition-colors hover:border-[var(--dc-accent-soft)]"
            onClick={() => track('journey_course_detail', { slug: selectedSlug })}
          >
            View full course details
          </Link>
        </div>
      ) : (
        <p className="text-[14px] text-[var(--dc-ink-muted)]">
          Select a course above to continue.
        </p>
      )}
    </div>
  );
}
