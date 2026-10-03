import { UNIVERSITY_PARTNERS } from '@/components/explore/content';
import { CardRail, FeatureCard, LogoStrip, Reveal, Section, SectionHeader } from '@/components/kit';
import { RECOGNITIONS } from './data';

export function Recognitions() {
  return (
    <Section tone="plain" deco="dots" labelledBy="home-recognition-heading">
      <SectionHeader
        id="home-recognition-heading"
        eyebrow="Recognition"
        title="Recognised by industry, regulators and peers"
      />
      <Reveal>
        <CardRail label="Recognitions" cols={3}>
          {RECOGNITIONS.map((item) => (
            <FeatureCard key={item.title} icon={item.icon} title={item.title} badge={item.badge}>
              {item.detail}
            </FeatureCard>
          ))}
        </CardRail>
      </Reveal>

      <div className="mt-10 sm:mt-12">
        <p className="mb-4 text-[13px] font-bold tracking-[0.1em] text-[var(--k-ink-3)] uppercase">
          Collaboration with top universities &amp; learning entities
        </p>
        <LogoStrip
          size="lg"
          showNames
          label="University and learning partners"
          logos={UNIVERSITY_PARTNERS.map((p) => ({ name: p.name, src: p.src }))}
        />
      </div>
    </Section>
  );
}
