'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { Course, CourseLevel } from '@/lib/content/types';
import { COURSE_CATEGORIES, categoriesOf, type CourseCategoryId } from '@/lib/course-categories';
import { ScrollNavButtons, useScrollTrack } from '@/components/ScrollNav';
import { CardTrack } from './CardTrack';

const LEVEL_LABEL: Record<CourseLevel, string> = {
  degree: 'Degree',
  diploma: 'Diploma',
  certification: 'Certification',
  short: 'Short course',
};

type TabId = 'featured' | CourseCategoryId;

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'featured', label: 'Featured' },
  ...COURSE_CATEGORIES.filter((c) => c.id !== 'degree').map((c) => ({ id: c.id, label: c.label })),
];

function inTab(course: Course, tab: (typeof TABS)[number]): boolean {
  if (tab.id === 'featured') return Boolean(course.featured);
  return categoriesOf(course).includes(tab.id);
}

/** Featured programmes first, then the catalogue by technology — tabs only for technologies that have courses. */
export function ProgramShowcase({ courses }: { courses: Course[] }) {
  const [tab, setTab] = useState<TabId>('featured');
  const { ref: tabsRef, edge: tabsEdge, scrollByItem: scrollTabsBy } = useScrollTrack<HTMLDivElement>();

  const tabs = TABS.filter((t) => courses.some((c) => inTab(c, t)));
  if (tabs.length === 0) return null;

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0]!;
  const visible = courses.filter((c) => inTab(c, activeTab));

  return (
    <section
      className="border-y border-[var(--dc-hairline)] bg-[var(--dc-surface)] py-12 sm:py-14 lg:py-16"
      aria-labelledby="home-programs-heading"
    >
      <div className="shell">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="dc-eyebrow text-[13px] font-bold tracking-[0.06em] uppercase">Courses</p>
            <h2
              id="home-programs-heading"
              className="dc-heading-glow mt-2 font-display text-[26px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] xs:text-[28px] sm:text-[32px]"
            >
              Explore our courses
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
              Industry-aligned, certification-focused courses for real-world careers — from a first certification to a full degree.
            </p>
          </div>
          <Link
            href={'/courses' as Route}
            className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]"
          >
            View all courses
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-end sm:hidden">
          <ScrollNavButtons
            edge={tabsEdge}
            onPrev={() => scrollTabsBy(-1)}
            onNext={() => scrollTabsBy(1)}
            label="technology filters"
          />
        </div>

        <div
          ref={tabsRef}
          className="mt-2 -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-6 sm:flex-wrap sm:overflow-visible sm:px-0"
          role="group"
          aria-label="Filter courses by technology"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={[
                'dc-chip shrink-0 px-4 py-2 text-[13px]',
                tab === t.id ? '!bg-jk-600 !text-white' : '',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <CardTrack key={tab} label={`${tab} courses`}>
            {visible.map((course) => (
              <li
                key={course.slug}
                className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
              >
                <Link
                  href={`/courses/${course.slug}` as Route}
                  className="flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] shadow-[var(--dc-shadow)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--dc-shadow-hover)]"
                >
                  <div className="dc-card-media relative aspect-[16/9] w-full overflow-hidden lg:aspect-[16/8]">
                    {course.heroImage ? (
                      <Image
                        src={course.heroImage.url}
                        alt={course.heroImage.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <span className="dc-chip w-fit px-3 py-1 text-[12px] tracking-[0.04em] uppercase">
                      {LEVEL_LABEL[course.level]} · {course.duration}
                    </span>
                    <h3 className="mt-3.5 font-display text-[17px] leading-snug font-extrabold text-[var(--dc-ink)] sm:text-[18px]">
                      {course.shortTitle}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-[var(--dc-ink-muted)]">
                      {course.summary}
                    </p>
                    <p className="mt-2.5 line-clamp-2 flex-1 text-[12.5px] leading-snug text-[var(--dc-ink-secondary)]">
                      <span className="font-bold text-[var(--dc-ink)]">Eligibility: </span>
                      {course.eligibility}
                    </p>
                    <span className="mt-5 inline-flex items-center justify-between gap-3 border-t border-[var(--dc-hairline)] pt-4 text-[13.5px] font-bold text-[var(--dc-accent-soft)]">
                      View &amp; apply
                      <span
                        aria-hidden="true"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jk-600 text-white"
                      >
                        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </CardTrack>
        </div>
      </div>
    </section>
  );
}
