'use client';

import { Section } from '@/components/kit';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Course } from '@/lib/content/types';
import { CardTrack } from '@/components/CardTrack';
import { CourseCard } from '@/components/CourseCard';

export function ProfessionalPrograms({ courses }: { courses: Course[] }) {
  const items = courses.slice(0, 4);

  return (
    <Section tone="tint" labelledBy="pro-programs-heading"><div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-[1_1_18rem]">
          <h2
            id="pro-programs-heading"
            className="section-title inline-flex items-center gap-2.5 font-display text-[var(--dc-ink)]"
          >
            <Sparkles
              className="h-6 w-6 text-[var(--dc-accent-soft)]"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            Top Courses for High-Growth Careers
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[15px]">
            Short and professional tracks designed to fit around a full-time job.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={'/courses' as Route}
            className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <CardTrack label="top courses">
          {items.map((course, i) => (
            <li key={course.slug} className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]">
              <CourseCard
                course={course}
                surface="professional-programs"
                layout="stack"
                badge={i === 0 ? 'Top pick' : undefined}
              />
            </li>
          ))}
        </CardTrack>
      </div>
    </Section>
  );
}
