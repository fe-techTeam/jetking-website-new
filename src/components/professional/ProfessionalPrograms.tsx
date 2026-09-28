'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useRef } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Clock3, Sparkles } from 'lucide-react';
import type { Course } from '@/lib/content/types';
import { scrollBehavior } from '@/lib/motion';
import { programVisualFor, type ProgramMeta } from './data';

function TopPickBadge() {
  return (
    <span className="pro-course-badge" aria-hidden="true">
      <Sparkles className="h-3 w-3" strokeWidth={2.25} />
      Top pick
    </span>
  );
}

function ProgramCard({
  course,
  visual,
  featured,
}: {
  course: Course;
  visual: ProgramMeta;
  featured: boolean;
}) {
  const CoverIcon = visual.icon;

  return (
    <Link
      href={`/courses/${course.slug}` as Route}
      className="pro-course-card group/course relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-[22px] border border-[var(--pro-hairline)] bg-[var(--pro-card)] p-5 text-left shadow-[var(--pro-shadow)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--pro-shadow-hover)] sm:min-h-[380px] sm:p-6 lg:min-h-0"
    >
      {featured ? (
        <>
          <TopPickBadge />
          <span className="sr-only">Top pick for working professionals</span>
        </>
      ) : null}

      <div className={`flex flex-wrap items-center gap-2 ${featured ? 'max-w-[72%]' : ''}`}>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--pro-hairline)] bg-[var(--pro-surface)] px-2 py-0.5 text-[12px] font-semibold text-[var(--pro-ink-muted)]">
          <Clock3 className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          {course.duration || visual.durationLabel}
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold"
          style={{ background: visual.accentTint, color: visual.accent }}
        >
          <Briefcase className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          Salary upto {visual.salaryHint}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-[color-mix(in_srgb,var(--pro-hairline)_80%,transparent)] sm:h-12 sm:w-12"
          style={{ background: visual.accentTint, color: visual.accent }}
        >
          <CoverIcon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.75} />
        </span>
        <h3 className="min-w-0 flex-1 font-display text-[16px] leading-snug font-extrabold tracking-[-0.01em] text-[var(--pro-ink)] sm:text-[17px]">
          {course.title}
        </h3>
      </div>

      <ul className="mt-4 flex flex-1 flex-col gap-0 border-t border-[var(--pro-hairline)]/60 pt-1">
        {visual.bullets.map((item) => (
          <li
            key={item.label}
            className="flex items-start gap-2.5 border-b border-[var(--pro-hairline)]/40 py-2.5 last:border-b-0"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{ background: visual.accentTint, color: visual.accent }}
            >
              <item.icon className="h-3.5 w-3.5" strokeWidth={1.85} />
            </span>
            <span className="min-w-0 flex-1 text-[12.5px] leading-snug font-semibold text-[var(--pro-ink-secondary)] sm:text-[13px]">
              {item.label}
            </span>
          </li>
        ))}
      </ul>

      <span className="mt-auto inline-flex items-center justify-between gap-3 border-t border-[var(--pro-hairline)] pt-4 text-[14px] font-bold">
        <span style={{ color: visual.accent }}>Explore Course</span>
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white transition-transform duration-200 group-hover/course:translate-x-0.5"
          style={{ background: visual.accentSolid ?? visual.accent }}
        >
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </span>
    </Link>
  );
}

export function ProfessionalPrograms({ courses }: { courses: Course[] }) {
  const scroller = useRef<HTMLUListElement>(null);
  const items = courses.slice(0, 4);

  const scrollBy = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-program-card]');
    const gap = 16;
    const step = (card?.offsetWidth ?? 288) + gap;
    el.scrollBy({ left: dir * step, behavior: scrollBehavior() });
  };

  return (
    <section
      className="shell py-10 sm:py-12 lg:py-14"
      aria-labelledby="pro-programs-heading"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-[1_1_18rem]">
          <h2
            id="pro-programs-heading"
            className="inline-flex items-center gap-2.5 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--pro-ink)] xs:text-[28px] sm:text-[32px]"
          >
            <Sparkles
              className="h-6 w-6 text-[var(--pro-accent-soft)]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            Top Courses for High-Growth Careers
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--pro-ink-muted)] sm:text-[15px]">
            Short and professional tracks designed to fit around a full-time job.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={'/courses' as Route}
            className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--pro-accent-soft)]"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          </Link>
          {items.length > 1 ? (
            <div className="flex gap-2 lg:hidden">
              <button
                type="button"
                aria-label="Previous courses"
                onClick={() => scrollBy(-1)}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[var(--pro-hairline)] bg-[var(--pro-card)] text-[var(--pro-ink)] transition-colors hover:border-[var(--pro-accent)]"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={2} />
              </button>
              <button
                type="button"
                aria-label="Next courses"
                onClick={() => scrollBy(1)}
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-[var(--pro-hairline)] bg-[var(--pro-card)] text-[var(--pro-ink)] transition-colors hover:border-[var(--pro-accent)]"
              >
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <ul
        ref={scroller}
        className="pro-course-track mt-8 flex gap-4 overflow-x-auto overscroll-x-contain pb-2 lg:hidden"
      >
        {items.map((course, i) => {
          const visual = programVisualFor(course);
          return (
            <li
              key={course.slug}
              data-program-card
              className="w-[min(88vw,300px)] shrink-0 snap-start sm:w-[280px]"
            >
              <ProgramCard course={course} visual={visual} featured={i === 0} />
            </li>
          );
        })}
      </ul>

      <ul className="mt-8 hidden grid-cols-2 gap-4 lg:grid xl:grid-cols-4 xl:gap-5">
        {items.map((course, i) => {
          const visual = programVisualFor(course);
          return (
            <li key={course.slug} className="min-w-0">
              <ProgramCard course={course} visual={visual} featured={i === 0} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
