'use client';

import Image from 'next/image';
import type { Testimonial } from '@/lib/content/types';
import { Carousel } from '@/components/Carousel';

/**
 * The red "quote card" testimonial carousel shared by the student, parent and franchise pages.
 * Each page used to carry its own ~85-line copy of this markup, identical except for the label, the
 * fallback stories and (for franchise) a filter on CMS entries; those three inputs are now props.
 * (Placements and Centres keep their own sliders — their cards are genuinely different designs.)
 */
export function TestimonialSlider({
  testimonials,
  fallback,
  avatars,
  label,
  accept,
}: {
  /** Stories from the CMS; used instead of `fallback` when any pass `accept`. */
  testimonials?: Testimonial[];
  fallback: Testimonial[];
  /** Portrait images, cycled across the slides. */
  avatars: readonly string[];
  /** Accessible name of the carousel, e.g. "Student stories". */
  label: string;
  /** Optional filter for CMS entries (e.g. drop empty or placeholder records). */
  accept?: (t: Testimonial) => boolean;
}) {
  const cms = (testimonials ?? []).filter(accept ?? (() => true));
  const items = cms.length ? cms : fallback;

  return (
    <Carousel
      items={items}
      label={label}
      itemKey={(item) => item.id}
      itemLabel={(item) => `${item.name}, ${item.role}`}
      classNames={{
        dotActive: 'bg-[var(--dc-accent-soft)]',
        dotIdle: 'bg-[var(--dc-ink-muted)]/40',
        button:
          'border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)] hover:text-[var(--dc-accent-soft)]',
      }}
    >
      {(item, i) => (
        <blockquote className="kit kit-card flex h-full min-h-[220px] flex-col p-6 sm:min-h-[240px] sm:p-7">
          <span
            aria-hidden="true"
            className="font-display text-[56px] leading-none font-extrabold text-[var(--k-red)] opacity-40"
          >
            &ldquo;
          </span>
          <p className="-mt-5 flex-1 text-[15.5px] leading-relaxed font-medium text-[var(--k-ink-2)] sm:text-[16.5px]">
            {item.quote}
          </p>
          <footer className="mt-6 flex items-center gap-3">
            <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[var(--k-line-strong)]">
              {(() => {
                const src = avatars[i % avatars.length] ?? avatars[0];
                return src ? <Image src={src} alt="" fill sizes="48px" className="object-cover" /> : null;
              })()}
            </span>
            <cite className="not-italic">
              <span className="block text-[14.5px] font-bold text-[var(--k-ink)]">{item.name}</span>
              <span className="mt-0.5 block text-[13px] text-[var(--k-ink-3)]">{item.role}</span>
            </cite>
          </footer>
        </blockquote>
      )}
    </Carousel>
  );
}
