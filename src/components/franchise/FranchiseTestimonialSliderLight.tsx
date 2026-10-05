'use client';

import type { Testimonial } from '@/lib/content/types';
import { TestimonialSlider } from '@/components/TestimonialSlider';
import type { franchiseCopy } from '@/lib/content/copy/pages/franchise';

const AVATARS = [
  '/franchise/partner-avatar-2.webp',
  '/franchise/partner-avatar-1.webp',
  '/franchise/partner-avatar-3.webp',
] as const;

export function FranchiseTestimonialSliderLight({
  copy,
  testimonials,
}: {
  copy: typeof franchiseCopy.defaults;
  testimonials?: Testimonial[];
}) {
  // Shown only when the CMS has no usable partner stories.
  const fallback: Testimonial[] = [0, 1, 2].map((i) => ({
    id: `fra-fallback-${i + 1}`,
    quote: copy[`stories.${i}.quote` as 'stories.0.quote'],
    name: copy[`stories.${i}.name` as 'stories.0.name'],
    role: copy[`stories.${i}.role` as 'stories.0.role'],
  }));

  return (
    <TestimonialSlider
      testimonials={testimonials}
      fallback={fallback}
      avatars={AVATARS}
      label={copy['stories.label']}
      accept={(t) => !!t.quote?.trim() && !/placeholder/i.test(t.name)}
    />
  );
}
