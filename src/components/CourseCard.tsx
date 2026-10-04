'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Course } from '@/lib/content/types';
import { COURSE_LEVEL_LABEL } from '@/lib/course-categories';
import { track } from '@/lib/analytics';
import { TransitionLink } from '@/components/motion/TransitionLink';

/**
 * The one course card used on every page (the /courses list, the home page, centre pages, student and
 * professional pages, "similar courses"). A photo on top (a thumbnail beside the text on phones, so a
 * long list stays short), the level and duration, the title, who it is for, and one action.
 *
 * Put it inside a list item or `<article>`; it renders the link only. `as` is the heading level, so a
 * card under a section's h2 is an h3.
 */
export function CourseCard({
  course,
  surface,
  as: Heading = 'h3',
  href,
  layout = 'list',
  badge,
  tag,
  title,
  description,
  cta = 'View course',
}: {
  course: Pick<Course, 'slug' | 'title' | 'level' | 'duration' | 'eligibility' | 'heroImage'>;
  /** Where the card sits, recorded with the click (`explorer-card`, `home-showcase`, …). */
  surface: string;
  as?: 'h2' | 'h3';
  /** Where the card goes; defaults to the course page. */
  href?: string;
  /** `list`: on phones a thumbnail beside the text, so a long list stays short. `stack`: photo on top at every width (swipe rows). */
  layout?: 'list' | 'stack';
  /** A short label on the photo, e.g. "Best match". */
  badge?: string;
  /** Replaces the level label. */
  tag?: string;
  title?: string;
  /** Replaces the eligibility line. */
  description?: string;
  cta?: string;
}) {
  const text = description ?? course.eligibility;
  const stack = layout === 'stack';

  return (
    <TransitionLink
      href={href ?? `/courses/${course.slug}`}
      onClick={() => track('course_viewed', { course_slug: course.slug, surface })}
      className="dc-card-shell dc-card-interactive group/card block h-full"
    >
      <div className={`dc-card flex h-full overflow-hidden ${stack ? 'flex-col' : 'sm:flex-col'}`}>
        <div
          className={`dc-card-media relative shrink-0 overflow-hidden ${
            stack
              ? 'aspect-[16/10] w-full'
              : 'min-h-[112px] w-[104px] min-[400px]:w-[120px] sm:aspect-[16/10] sm:min-h-0 sm:w-auto'
          }`}
        >
          {course.heroImage ? (
            <Image
              src={course.heroImage.url}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 640px) 42vw, 120px"
              className="object-cover transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover/card:scale-[1.04]"
            />
          ) : null}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-scrim/65 via-transparent to-transparent"
          />
          {badge ? (
            <span className="dc-cta absolute top-2 left-2 rounded-full px-2.5 py-1 text-[11.5px] font-bold sm:top-3 sm:left-3">
              {badge}
            </span>
          ) : null}
        </div>

        <div className={`flex min-w-0 flex-1 flex-col ${stack ? 'p-5 sm:p-7' : 'p-4 sm:p-7'}`}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex rounded-full border border-[var(--dc-accent-border)] bg-[var(--dc-accent-tint)] px-2.5 py-1 text-[12px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase">
              {tag ?? COURSE_LEVEL_LABEL[course.level]}
            </span>
            <span className="numeral text-[12.5px] font-semibold text-[var(--dc-ink-muted)]">{course.duration}</span>
          </div>

          <Heading className="mt-2 font-display text-[15.5px] leading-snug font-extrabold tracking-[-0.02em] text-balance text-[var(--dc-ink)] transition-colors group-hover/card:text-[var(--dc-accent-soft)] sm:mt-3.5 sm:text-[18px]">
            {title ?? course.title}
          </Heading>

          <p className={`mt-2 line-clamp-2 flex-1 text-[14px] leading-relaxed text-[var(--dc-ink-muted)] ${stack ? '' : 'max-sm:hidden'}`}>
            {text}
          </p>

          <div className={`mt-auto flex items-center justify-between gap-3 ${stack ? 'pt-5' : 'pt-2.5 sm:pt-6'}`}>
            <span className="text-[13.5px] font-bold text-[var(--dc-accent-soft)]">{cta}</span>
            <span
              aria-hidden="true"
              className={`dc-cta h-10 w-10 shrink-0 place-items-center rounded-full ${stack ? 'grid' : 'hidden sm:grid'}`}
            >
              <ArrowRight
                className="h-[18px] w-[18px] transition-transform duration-200 ease-[var(--ease-out-soft)] group-hover/card:translate-x-0.5"
                strokeWidth={2.25}
              />
            </span>
          </div>
        </div>
      </div>
    </TransitionLink>
  );
}
