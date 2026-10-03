import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { REASONS } from '@/components/explore/content';
import { CardRail, FeatureCard, Reveal, Section, SectionHeader } from '@/components/kit';

/** Website content: the "10 reasons why Jetking is every student's choice" already published on jetking.com (see `explore/content.ts`). Five are shown; the rest live on /explore. */
const SHOWN = [
  'Trained & Certified Faculty',
  'Practical Foundation through Labs',
  'Scenario Based Learning',
  'SmartLabPlus Teaching Methodology',
  'Placement Support',
];
const ITEMS = SHOWN.map((t) => REASONS.find((r) => r.title === t)!);

export function WhyJetking() {
  return (
    <Section tone="plain" deco="glow" labelledBy="home-why-heading">
      <SectionHeader
        id="home-why-heading"
        eyebrow="Why Jetking"
        title="What makes Jetking different?"
        action={
          <Link
            href={'/about-us' as Route}
            className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            Our story
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      />
      <Reveal>
        <CardRail label="Reasons to choose Jetking" cols={5} colsMd={2}>
          {ITEMS.map((item) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title}>
              {item.detail}
            </FeatureCard>
          ))}
        </CardRail>
      </Reveal>

    </Section>
  );
}
