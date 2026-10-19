'use client';

import type { Testimonial } from '@/lib/content/types';
import { TestimonialSlider } from '@/components/TestimonialSlider';
import type { StudentCopy } from '@/lib/content/copy/pages/student';

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

export function StudentTestimonialSlider({
  testimonials,
  copy,
}: {
  testimonials?: Testimonial[];
  copy: StudentCopy;
}) {
  const avatars = [
    copy['stories.avatar.0'],
    copy['stories.avatar.1'],
    copy['stories.avatar.2'],
    copy['stories.avatar.3'],
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
