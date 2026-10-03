'use client';

import Image from 'next/image';
import { Carousel } from '@/components/Carousel';
import type { CentreTestimonial } from '@/lib/content/types';

const AVATARS = [
  '/student/testimonial.webp',
  '/student/avatar-1.webp',
  '/student/avatar-2.webp',
  '/student/avatar-3.webp',
] as const;

type Slide = CentreTestimonial & { id: string };

export function CentreTestimonialSlider({
  testimonials,
}: {
  testimonials: CentreTestimonial[];
}) {
  if (!testimonials.length) return null;

  const items: Slide[] = testimonials.map((t, i) => ({
    ...t,
    id: `centre-story-${i}-${t.name.replace(/\s+/g, '-').toLowerCase()}`,
  }));

  return (
    <Carousel
      items={items}
      label="Student stories"
      itemKey={(item) => item.id}
      itemLabel={(item) => (item.role ? `${item.name}, ${item.role}` : item.name)}
      classNames={{
        viewport: 'rounded-[24px]',
        controls: 'text-[var(--dc-ink)]',
        button:
          'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink)] hover:border-[var(--dc-accent-soft)]',
        dotActive: 'bg-[var(--dc-accent-soft)]',
        dotIdle: 'bg-[var(--dc-ink-muted)]/40',
      }}
    >
      {(item, i) => (
        <blockquote className="centres-quote flex h-full min-h-[240px] flex-col p-6 text-white sm:min-h-[260px] sm:p-7">
          <span
            aria-hidden="true"
            className="font-display text-[56px] leading-none font-extrabold text-white/30"
          >
            &ldquo;
          </span>
          <p className="-mt-5 flex-1 text-[15.5px] leading-relaxed font-medium text-white/95 sm:text-[16.5px]">
            {item.quote}
          </p>
          <footer className="mt-6 flex items-center gap-3">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white/40">
              <Image
                src={AVATARS[i % AVATARS.length] ?? AVATARS[0]}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
              />
            </span>
            <cite className="not-italic">
              <span className="block text-[14.5px] font-bold text-white">{item.name}</span>
              {item.role ? (
                <span className="mt-0.5 block text-[13px] text-white/80">{item.role}</span>
              ) : null}
            </cite>
          </footer>
        </blockquote>
      )}
    </Carousel>
  );
}
