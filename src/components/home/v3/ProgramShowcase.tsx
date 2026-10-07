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
import type { HomeCopy } from '@/lib/content/copy/pages/home';

type TabId = 'featured' | 'degrees' | 'careers' | CourseCategoryId;

type Tab = { id: TabId; label: string };

function inTab(course: Course, tab: Tab): boolean {
  if (tab.id === 'featured') return Boolean(course.featured);
  if (tab.id === 'degrees') return course.level === 'degree';
  if (tab.id === 'careers') return course.level !== 'degree';
  return categoriesOf(course).includes(tab.id);
}

/** Featured first, then Degree Programs and Career Courses, then the catalogue by technology — tabs only where there are courses. */
export function ProgramShowcase({ courses, copy }: { courses: Course[]; copy: HomeCopy }) {
  const [tab, setTab] = useState<TabId>('featured');
  const TABS: Tab[] = [
    { id: 'featured', label: copy['programs.tab.featured'] },
    { id: 'degrees', label: copy['programs.tab.degree'] },
    { id: 'careers', label: copy['programs.tab.career'] },
    ...COURSE_CATEGORIES.filter((c) => c.id !== 'degree').map((c) => ({ id: c.id, label: c.label })),
  ];
  const tabs = TABS.filter((t) => courses.some((c) => inTab(c, t)));
  if (tabs.length === 0) return null;

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0]!;
  const visible = courses.filter((c) => inTab(c, activeTab));

  return (
    <Section tone="plain" labelledBy="home-programs-heading">
        <SectionHeader
          id="home-programs-heading"
          eyebrow={copy['programs.eyebrow']}
          title={copy['programs.title']}
          lede={copy['programs.lede']}
          action={
            <Link
              href={copy['programs.cta.href'] as Route}
              className="tap inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
            >
              {copy['programs.cta.label']}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          }
        />

        <div
          className="-mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] pb-1 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]"
          role="group"
          aria-label={copy['programs.filter.aria']}
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
          <CardTrack key={tab} label={`${activeTab.label} courses`}>
            {visible.map((course) => (
              <li
                key={course.slug}
                className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
              >
                <CourseCard course={course} surface="home-showcase" layout="stack" compact />
              </li>
            ))}
          </CardTrack>
        </div>
      </Section>
  );
}
