'use client';

import type { Testimonial } from '@/lib/content/types';
import { TestimonialSlider } from '@/components/TestimonialSlider';
import type { ParentCopy } from '@/lib/content/copy/pages/parent';

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

export function ParentTestimonialSlider({
  testimonials,
  copy,
}: {
  testimonials?: Testimonial[];
  copy: ParentCopy;
}) {
  const avatars = [
    copy['stories.slider.0'],
    copy['stories.slider.1'],
    copy['stories.slider.2'],
    copy['stories.slider.3'],
  ];

  return (
    <TestimonialSlider
      testimonials={testimonials}
      fallback={FALLBACK}
      avatars={avatars}
      label={copy['stories.label']}
    />
  );
}
