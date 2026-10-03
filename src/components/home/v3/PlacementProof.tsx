import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { PLACEMENT_DISCLAIMER, TESTIMONIALS } from '@/components/placements/data';
import { CardRail, Reveal, Section, SectionHeader, StoryCard } from '@/components/kit';

/**
 * "Our learners, our pride": Jetking's own published, named placement stories (`placements/data.ts`)
 * on a light wash band, no invented ratings. The first three are shown; the placement disclaimer
 * stays underneath and the rest live on /placements.
 */
export function PlacementProof() {
  return (
    <Section tone="wash" labelledBy="home-proof-heading">
      <SectionHeader
        id="home-proof-heading"
        title="Our learners, our pride"
        lede="Real stories from students who trained at Jetking and now work at organisations across industries."
        action={
          <Link
            href={'/placements' as Route}
            className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            Watch success stories
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      />
      <Reveal>
        <CardRail label="Placement stories" cols={3}>
          {TESTIMONIALS.slice(0, 3).map((t) => (
            <StoryCard key={t.name} name={t.name} outcome={t.role} quote={t.quote} />
          ))}
        </CardRail>
      </Reveal>
      <p className="mt-5 text-[12.5px] leading-relaxed text-[var(--k-ink-3)]">{PLACEMENT_DISCLAIMER}</p>
    </Section>
  );
}
