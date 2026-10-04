'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import type { CourseLevel } from '@/lib/content/types';
import {
  COURSE_LEVELS,
  COURSE_LEVEL_LABEL as LEVEL_LABEL,
  COURSE_TECHNOLOGIES,
  type CourseCategoryId,
} from '@/lib/course-categories';
import { cx } from './ui';

export interface MenuCourse {
  slug: string;
  title: string;
  level: CourseLevel;
  duration: string;
  featured: boolean;
  categories: CourseCategoryId[];
}

interface MenuItem {
  key: string;
  label: string;
  /** Closing link text, e.g. "View all degree courses". */
  viewAll: string;
  href: string;
  params: Record<string, string>;
  has: (course: MenuCourse) => boolean;
}

/** Level and technology are different questions, so the menu keeps them in two groups named as in the /courses filter ("Level", "Technology"), with the same labels. */
const LEVEL_ITEMS: MenuItem[] = COURSE_LEVELS.map((l) => ({
  key: `level:${l.id}`,
  label: l.label,
  viewAll: `View all ${l.id === 'short' ? 'short courses' : `${l.label.toLowerCase()} courses`}`,
  href: `/courses?level=${l.id}`,
  params: { level: l.id },
  has: (course) => course.level === l.id,
}));

const TECH_ITEMS: MenuItem[] = COURSE_TECHNOLOGIES.map((t) => ({
  key: `tech:${t.id}`,
  label: t.label,
  viewAll: `View all ${t.label} courses`,
  href: `/courses?tech=${t.id}`,
  params: { tech: t.id },
  has: (course) => course.categories.includes(t.id),
}));

/**
 * "Courses" header item with a mega menu (desktop header only): categories on the left,
 * the real courses in the highlighted category on the right — hover, focus or click a
 * category to switch. Opens on hover and on keyboard focus (`group-focus-within`), so every
 * link is reachable by Tab. The trigger is still a real link to /courses. A category is
 * marked current when the URL is /courses with exactly that filter, and a course when
 * its own page is open.
 */
function Inner({ onDarkLead, courses }: { onDarkLead: boolean; courses: MenuCourse[] }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const onCourses = pathname === '/courses' || pathname.startsWith('/courses/');

  const groups = [
    { title: 'Level', items: LEVEL_ITEMS.filter((i) => courses.some(i.has)) },
    { title: 'Technology', items: TECH_ITEMS.filter((i) => courses.some(i.has)) },
  ].filter((g) => g.items.length > 0);
  const all = groups.flatMap((g) => g.items);
  const [activeKey, setActiveKey] = useState(all[0]?.key ?? '');
  const active = all.find((i) => i.key === activeKey) ?? all[0];
  const list = active ? courses.filter(active.has) : [];

  const isCurrent = (params: Record<string, string>) =>
    pathname === '/courses' && Object.keys(params).every((k) => search.get(k) === params[k]);

  return (
    <div className="group">
      <Link
        href={'/courses' as Route}
        aria-current={pathname === '/courses' ? 'page' : undefined}
        aria-haspopup="true"
        className={cx(
          'inline-flex items-center gap-1 rounded-full px-3 py-2.5 text-sm font-bold tracking-[-0.01em] transition-colors duration-200 min-[1400px]:px-4',
          onCourses
            ? onDarkLead
              ? 'text-white'
              : 'text-[var(--accent-ink)]'
            : onDarkLead
              ? 'text-white/75 hover:bg-white/10 hover:text-white'
              : 'text-foreground-secondary hover:bg-surface hover:text-foreground',
        )}
      >
        Courses
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </Link>

      {/* Positioned against the (sticky) header, so it is centred on the page, not on the trigger. */}
      <div className="invisible absolute top-full left-1/2 z-[60] w-[min(960px,calc(100vw-48px))] -translate-x-1/2 pt-2 opacity-0 transition-[opacity,visibility] duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="grid overflow-hidden rounded-2xl border border-border bg-background shadow-xl lg:grid-cols-[260px_minmax(0,1fr)]">
          <ul className="border-r border-border bg-surface p-3" aria-label="Course groups">
            {groups.map((group, gi) => (
              <li key={group.title} className={gi > 0 ? 'mt-3 border-t border-border pt-3' : undefined}>
                <p className="label-mono px-3 pb-1.5 text-[11px] text-foreground-muted">{group.title}</p>
                <ul aria-label={group.title}>
                  {group.items.map((item) => {
                    const highlighted = item.key === active?.key;
                    const current = isCurrent(item.params);
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href as Route}
                          aria-current={current ? 'page' : undefined}
                          onMouseEnter={() => setActiveKey(item.key)}
                          onFocus={() => setActiveKey(item.key)}
                          className={cx(
                            'flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                            highlighted
                              ? 'bg-background text-[var(--accent-ink)] shadow-xs'
                              : 'text-foreground-secondary hover:text-foreground',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={cx('h-1.5 w-1.5 shrink-0 rounded-full', current ? 'bg-[var(--accent-ink)]' : 'bg-transparent')}
                            />
                            {item.label}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 opacity-60" strokeWidth={2} aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
            <li className="mt-2 border-t border-border pt-2">
              <Link
                href={'/courses' as Route}
                aria-current={pathname === '/courses' && !search.get('tech') && !search.get('level') ? 'page' : undefined}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--accent-ink)] hover:bg-background"
              >
                All courses
                <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </Link>
            </li>
          </ul>

          <div className="p-5">
            {active ? (
              <>
                <p className="label-mono text-[12px] text-foreground-muted">{active.label}</p>
                <ul className="mt-3 grid gap-x-6 sm:grid-cols-2" aria-label={`${active.label} courses`}>
                  {list.map((course) => {
                    const here = pathname === `/courses/${course.slug}`;
                    return (
                      <li key={course.slug}>
                        <Link
                          href={`/courses/${course.slug}` as Route}
                          aria-current={here ? 'page' : undefined}
                          className={cx(
                            'block rounded-xl px-3 py-2.5 transition-colors hover:bg-surface',
                            here && 'bg-jk-50',
                          )}
                        >
                          <span
                            className={cx(
                              'block text-sm font-semibold',
                              here ? 'text-[var(--accent-ink)]' : 'text-foreground',
                            )}
                          >
                            {course.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-foreground-muted">
                            {LEVEL_LABEL[course.level]} · {course.duration}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  href={active.href as Route}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 text-sm font-bold text-[var(--accent-ink)]"
                >
                  {active.viewAll}
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoursesMenu({ onDarkLead, courses }: { onDarkLead: boolean; courses: MenuCourse[] }) {
  return (
    <Suspense
      fallback={
        <Link
          href={'/courses' as Route}
          className="rounded-full px-4 py-2.5 text-sm font-bold tracking-[-0.01em] text-foreground-secondary"
        >
          Courses
        </Link>
      }
    >
      <Inner onDarkLead={onDarkLead} courses={courses} />
    </Suspense>
  );
}
