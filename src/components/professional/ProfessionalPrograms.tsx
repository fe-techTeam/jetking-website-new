'use client';

import { Section } from '@/components/kit';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Course } from '@/lib/content/types';
import { CardTrack } from '@/components/CardTrack';
import { CourseCard } from '@/components/CourseCard';
import type { professionalCopy } from '@/lib/content/copy/pages/professional';

export function ProfessionalPrograms({ copy, courses }: { copy: typeof professionalCopy.defaults; courses: Course[] }) {
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
            {copy['programs.title']}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[15px]">
            {copy['programs.lede']}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={copy['programs.viewAll.href'] as Route}
            className="tap inline-flex min-h-11 items-center gap-1.5 text-[14px] font-bold text-[var(--dc-accent-soft)]"
          >
            {copy['programs.viewAll.label']}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <CardTrack label={copy['programs.track.label']}>
          {items.map((course, i) => (
            <li key={course.slug} className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]">
              <CourseCard
                course={course}
                surface="professional-programs"
                layout="stack"
                badge={i === 0 ? copy['programs.badge'] : undefined}
              />
            </li>
          ))}
        </CardTrack>
      </div>
    </Section>
  );
}
