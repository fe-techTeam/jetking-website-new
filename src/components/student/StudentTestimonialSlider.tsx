'use client';

import Image from 'next/image';
import type { Testimonial } from '@/lib/content/types';
import { Carousel } from '@/components/Carousel';

const AVATARS = [
  '/student/testimonial.webp',
  '/student/avatar-1.webp',
  '/student/avatar-2.webp',
  '/student/avatar-3.webp',
] as const;

const FALLBACK: Testimonial[] = [
  {
    id: 'stu-fallback-1',
    quote:
      'I wanted a degree that was not just theory — the labs made certifications feel achievable.',
    name: 'Riya M.',
    role: 'BCA track · Class of 2025',
  },
  {
    id: 'stu-fallback-2',
    quote:
      'Counsellors helped me pick between cloud and cyber without pressure to enrol the same day.',
    name: 'Aarav K.',
    role: 'Diploma track',
  },
  {
    id: 'stu-fallback-3',
    quote:
      'Placement support started early — mock interviews made the real ones much less stressful.',
    name: 'Sneha P.',
    role: 'Cyber Security track',
  },
];

export function StudentTestimonialSlider({ testimonials }: { testimonials?: Testimonial[] }) {
  const items = testimonials?.length ? testimonials : FALLBACK;

  return (
    <Carousel
      items={items}
      label="Student stories"
      itemKey={(item) => item.id}
      itemLabel={(item) => `${item.name}, ${item.role}`}
      classNames={{
        viewport: 'rounded-[24px]',
        dotActive: 'bg-[var(--stu-accent-soft)]',
        dotIdle: 'bg-[var(--stu-ink-muted)]/40',
        button:
          'border-[var(--stu-hairline)] bg-[var(--stu-card)] text-[var(--stu-ink)] transition-colors hover:border-[var(--stu-accent-soft)] hover:text-[var(--stu-accent-soft)]',
      }}
    >
      {(item, i) => (
        <blockquote className="stu-quote flex h-full min-h-[220px] flex-col p-6 text-white sm:min-h-[240px] sm:p-7">
          <span
            aria-hidden="true"
            className="font-display text-[56px] leading-none font-extrabold text-white/30"
          >
            &ldquo;
          </span>
          <p className="-mt-5 flex-1 text-[15.5px] leading-relaxed font-medium sm:text-[16.5px]">
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
              <span className="block text-[14.5px] font-bold">{item.name}</span>
              <span className="mt-0.5 block text-[13px] text-white">{item.role}</span>
            </cite>
          </footer>
        </blockquote>
      )}
    </Carousel>
  );
}
