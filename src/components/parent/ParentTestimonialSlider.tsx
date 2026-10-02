'use client';

import Image from 'next/image';
import type { Testimonial } from '@/lib/content/types';
import { Carousel } from '@/components/Carousel';

const AVATARS = [
  '/student/avatar-1.webp',
  '/student/avatar-2.webp',
  '/student/avatar-3.webp',
  '/student/testimonial.webp',
] as const;

const FALLBACK: Testimonial[] = [
  {
    id: 'par-fallback-1',
    quote:
      'We needed fee clarity and a real conversation about placements — not marketing slogans. Visiting the centre made the difference.',
    name: 'Mrs. Kavita Sharma',
    role: 'Parent of BCA Student',
  },
  {
    id: 'par-fallback-2',
    quote:
      'Visiting the centre and meeting faculty mattered more than any brochure. Counsellors never pushed us to enrol the same day.',
    name: 'Meera D.',
    role: 'Parent · Delhi NCR',
  },
  {
    id: 'par-fallback-3',
    quote:
      'Placement support started early — mock interviews made the real ones much less stressful for our son.',
    name: 'Parent of a diploma student',
    role: 'Pune',
  },
];

export function ParentTestimonialSlider({ testimonials }: { testimonials?: Testimonial[] }) {
  const items = testimonials?.length ? testimonials : FALLBACK;

  return (
    <Carousel
      items={items}
      label="Parent stories"
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
