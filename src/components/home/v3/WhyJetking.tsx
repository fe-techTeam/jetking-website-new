import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { REASONS } from '@/components/explore/content';
import { CardRail, FeatureCard, Reveal, Section, SectionHeader } from '@/components/kit';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/** Website content: the "10 reasons why Jetking is every student's choice" already published on jetking.com (see `explore/content.ts`). Five are shown; the rest live on /explore. Only the icon is looked up from there — the wording is the page copy `why.items.N.*`, in this order. */
const SHOWN = [
  'Trained & Certified Faculty',
  'Practical Foundation through Labs',
  'Scenario Based Learning',
  'SmartLabPlus Teaching Methodology',
  'Placement Support',
];
const ICONS = SHOWN.map((t) => REASONS.find((r) => r.title === t)!.icon);

export function WhyJetking({ copy }: { copy: HomeCopy }) {
  return (
    <Section tone="plain" deco="glow" labelledBy="home-why-heading">
      <SectionHeader
        id="home-why-heading"
        eyebrow={copy['why.eyebrow']}
        title={copy['why.title']}
        action={
          <Link
            href={copy['why.cta.href'] as Route}
            className="tap inline-flex items-center gap-1.5 text-[14px] font-bold text-[var(--k-red)]"
          >
            {copy['why.cta.label']}
            <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </Link>
        }
      />
      <Reveal>
        <CardRail label={copy['why.rail.aria']} cols={5} colsMd={2}>
          {ICONS.map((icon, i) => (
            <FeatureCard key={i} icon={icon} title={copy[`why.items.${i}.title` as keyof HomeCopy]}>
              {copy[`why.items.${i}.detail` as keyof HomeCopy]}
            </FeatureCard>
          ))}
        </CardRail>
      </Reveal>

    </Section>
  );
}
