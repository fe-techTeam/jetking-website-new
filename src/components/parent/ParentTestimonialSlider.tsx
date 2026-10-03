'use client';

import type { Testimonial } from '@/lib/content/types';
import { TestimonialSlider } from '@/components/TestimonialSlider';

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
  return (
    <TestimonialSlider
      testimonials={testimonials}
      fallback={FALLBACK}
      avatars={AVATARS}
      label="Parent stories"
    />
  );
}
