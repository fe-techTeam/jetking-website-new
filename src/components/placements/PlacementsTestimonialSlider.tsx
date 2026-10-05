'use client';

import Image from 'next/image';
import { Carousel } from '@/components/Carousel';
import type { PlacementTestimonial as Testimonial } from '@/lib/content/types';
import type { placementsCopy } from '@/lib/content/copy/pages/placements';

/* Generic avatar placeholders — same set every persona testimonial slider
   uses, since no real headshots exist for these published quotes. */
const AVATARS = [
  '/student/testimonial.webp',
  '/student/avatar-1.webp',
  '/student/avatar-2.webp',
  '/student/avatar-3.webp',
] as const;

type Slide = Testimonial & { id: string };

/**
 * `role` is free text mirrored from jetking.com — sometimes "Title, Company"
 * (e.g. "Support Engineer, Apple"), sometimes just the company on its own
 * (e.g. "Tata Consultancy Services"). Split on the last comma so the company
 * can be shown on its own line without re-typing any of the source data.
 */
function splitRole(role: string): { title?: string; company: string } {
  const commaIndex = role.lastIndexOf(',');
  if (commaIndex === -1) return { company: role.trim() };
  return { title: role.slice(0, commaIndex).trim(), company: role.slice(commaIndex + 1).trim() };
}

export function PlacementsTestimonialSlider({
  testimonials,
  copy,
}: {
  testimonials: Testimonial[];
  copy: Pick<typeof placementsCopy.defaults, 'testimonials.carouselLabel'>;
}) {
  const items: Slide[] = testimonials.map((t, i) => ({
    ...t,
    id: `placement-story-${i}-${t.name.replace(/\s+/g, '-').toLowerCase()}`,
  }));

  return (
    <Carousel
      items={items}
      label={copy['testimonials.carouselLabel']}
      dots={false}
      itemKey={(item) => item.id}
      itemLabel={(item) => `${item.name}, ${item.role}`}
      classNames={{
        viewport: 'rounded-[24px]',
        controls: 'text-[var(--dc-ink)]',
        button:
          'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink)] hover:border-[var(--dc-accent-soft)]',
        dotActive: 'bg-[var(--dc-accent-soft)]',
        dotIdle: 'bg-[var(--dc-ink-muted)]/40',
      }}
    >
      {(item, i) => {
        const { title, company } = splitRole(item.role);
        return (
          <blockquote className="kit kit-card flex h-full min-h-[220px] flex-col gap-5 p-6 sm:min-h-[200px] sm:flex-row sm:items-center sm:gap-6 sm:p-7">
            <footer className="flex shrink-0 flex-col items-center gap-2 text-center sm:w-[180px]">
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[var(--k-line-strong)]">
                <Image
                  src={AVATARS[i % AVATARS.length] ?? AVATARS[0]}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </span>
              <cite className="not-italic">
                <span className="block text-[14px] font-bold text-[var(--k-ink)]">{item.name}</span>
                {title ? <span className="mt-0.5 block text-[12px] text-[var(--k-ink-3)]">{title}</span> : null}
                {/* The employer sits with the person's details, under their name and role. */}
                <span className="mt-1 block text-[12.5px] leading-snug font-bold text-[var(--k-red)]">{company}</span>
              </cite>
            </footer>

            <div className="relative flex-1">
              <span
                aria-hidden="true"
                className="absolute -top-3 -left-1 font-display text-[40px] leading-none font-extrabold text-[var(--k-red)] opacity-40"
              >
                &ldquo;
              </span>
              <p className="relative pl-6 text-[14.5px] leading-relaxed font-medium text-[var(--k-ink-2)] sm:pl-7 sm:text-[15.5px]">
                {item.quote}
              </p>
            </div>
          </blockquote>
        );
      }}
    </Carousel>
  );
}
