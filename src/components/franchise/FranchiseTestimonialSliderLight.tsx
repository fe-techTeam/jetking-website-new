'use client';

import type { Testimonial } from '@/lib/content/types';
import { TestimonialSlider } from '@/components/TestimonialSlider';

const AVATARS = [
  '/franchise/partner-avatar-2.webp',
  '/franchise/partner-avatar-1.webp',
  '/franchise/partner-avatar-3.webp',
] as const;

const FALLBACK: Testimonial[] = [
  {
    id: 'fra-fallback-1',
    quote:
      'The brand opened doors with parents in our city that a standalone centre never would. Within 18 months we broke even and are now expanding.',
    name: 'Rohit Verma',
    role: 'Franchise Partner · Pune',
  },
  {
    id: 'fra-fallback-2',
    quote:
      "Jetking's end-to-end support — from centre setup to marketing — made the move from corporate life to education entrepreneurship smooth.",
    name: 'Priya Nair',
    role: 'Franchise Partner · Bengaluru',
  },
  {
    id: 'fra-fallback-3',
    quote:
      'The proven curriculum and placement partnerships gave us credibility from day one. Parents trust the Jetking name.',
    name: 'Amit Desai',
    role: 'Franchise Partner · Ahmedabad',
  },
];

export function FranchiseTestimonialSliderLight({ testimonials }: { testimonials?: Testimonial[] }) {
  return (
    <TestimonialSlider
      testimonials={testimonials}
      fallback={FALLBACK}
      avatars={AVATARS}
      label="Partner stories"
      accept={(t) => !!t.quote?.trim() && !/placeholder/i.test(t.name)}
    />
  );
}
