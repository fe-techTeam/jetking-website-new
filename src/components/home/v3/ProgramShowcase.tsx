'use client';

import { Section, SectionHeader } from '@/components/kit';
import { useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { Course } from '@/lib/content/types';
import {
  COURSE_CATEGORIES,
  categoriesOf,
  type CourseCategoryId,
} from '@/lib/course-categories';
import { CourseCard } from '@/components/CourseCard';
import { CardTrack } from '@/components/CardTrack';

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
  const tabs = TABS.filter((t) => courses.some((c) => inTab(c, t)));
  if (tabs.length === 0) return null;

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0]!;
  const visible = courses.filter((c) => inTab(c, activeTab));

  return (
    <Section tone="plain" labelledBy="home-programs-heading">
        <SectionHeader
          id="home-programs-heading"
          eyebrow="Courses"
          title="Explore our courses"
          lede="Industry-aligned, certification-focused courses for real-world careers — from a first certification to a full degree."
          action={
            <Link
              href={'/courses' as Route}
              className="tap inline-flex shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
            >
              View all courses
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          }
        />

        <div
          className="-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]"
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
                <CourseCard course={course} surface="home-showcase" layout="stack" />
              </li>
            ))}
          </CardTrack>
        </div>
      </Section>
  );
}
