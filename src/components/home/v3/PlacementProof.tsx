import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import type { PlacementTestimonial } from '@/lib/content/types';
import { CardRail, Reveal, Section, SectionHeader, StoryCard } from '@/components/kit';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/**
 * "Our learners, our pride": Jetking's own published, named placement stories (`placements/data.ts`)
 * on a light wash band, no invented ratings. Content comes from the CMS `placements_page` document. The first three are shown; the placement disclaimer
 * stays underneath and the rest live on /placements.
 */
export function PlacementProof({
  testimonials,
  disclaimer,
  copy,
}: {
  testimonials: PlacementTestimonial[];
  disclaimer: string;
  copy: HomeCopy;
}) {
  return (
    <Section tone="wash" labelledBy="home-proof-heading">
      <SectionHeader
        id="home-proof-heading"
        title={copy['proof.title']}
        lede={copy['proof.lede']}
        action={
          <Link
            href={copy['proof.cta.href'] as Route}
            className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            {copy['proof.cta.label']}
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      />
      <Reveal>
        <CardRail label={copy['proof.rail.aria']} cols={3}>
          {testimonials.slice(0, 3).map((t) => (
            <StoryCard key={t.name} name={t.name} outcome={t.role} quote={t.quote} />
          ))}
        </CardRail>
      </Reveal>
      <p className="mt-5 text-[14px] leading-relaxed text-[var(--k-ink-3)]">{disclaimer}</p>
    </Section>
  );
}
