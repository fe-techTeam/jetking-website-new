'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Course } from '@/lib/content/types';
import { CardTrack } from '@/components/CardTrack';
import { CourseCard } from '@/components/CourseCard';
import { Section, SectionHeader } from '@/components/kit';

/** A page's course slider: shared section header, the shared course card, prev/next buttons. */
export function RecommendedCourses({
  courses,
  title = 'Recommended for You',
  description = 'Popular courses for students — tap a card to explore details.',
  headingId = 'stu-recommended',
  tone = 'plain',
  id,
  className,
  children,
}: {
  courses: Course[];
  title?: string;
  description?: string;
  headingId?: string;
  /** Pick the tone that alternates with the sections around it. */
  tone?: 'plain' | 'tint' | 'wash';
  id?: string;
  className?: string;
  /** Extra content between the header and the slider (e.g. format filters). */
  children?: ReactNode;
}) {
  const items = courses.slice(0, 4);

  return (
    <Section tone={tone} id={id} className={className} labelledBy={headingId}>
      <SectionHeader
        id={headingId}
        title={title}
        lede={description}
        action={
          <Link
            href={'/courses' as Route}
            className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            View all
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      />
      {children}
      <CardTrack label="recommended courses">
        {items.map((course, i) => (
          <li
            key={course.slug}
            className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
          >
            <CourseCard
              course={course}
              surface="student-recommended"
              layout="stack"
              badge={i === 0 ? 'Best match' : undefined}
            />
          </li>
        ))}
      </CardTrack>
    </Section>
  );
}
