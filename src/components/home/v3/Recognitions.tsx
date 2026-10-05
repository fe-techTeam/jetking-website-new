import { UNIVERSITY_PARTNERS } from '@/components/explore/content';
import { CardRail, FeatureCard, LogoStrip, Reveal, Section, SectionHeader } from '@/components/kit';
import { RECOGNITIONS } from './data';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

export function Recognitions({ copy }: { copy: HomeCopy }) {
  return (
    <Section tone="plain" deco="dots" labelledBy="home-recognition-heading">
      <SectionHeader
        id="home-recognition-heading"
        eyebrow={copy['recognition.eyebrow']}
        title={copy['recognition.title']}
      />
      <Reveal>
        <CardRail label={copy['recognition.rail.aria']} cols={3}>
          {RECOGNITIONS.map((item, i) => (
            <FeatureCard
              key={i}
              icon={item.icon}
              title={copy[`recognition.items.${i}.title` as keyof HomeCopy]}
              badge={copy[`recognition.items.${i}.badge` as keyof HomeCopy]}
            >
              {copy[`recognition.items.${i}.detail` as keyof HomeCopy]}
            </FeatureCard>
          ))}
        </CardRail>
      </Reveal>

      <div className="mt-10 sm:mt-12">
        <p className="mb-4 text-[13px] font-bold tracking-[0.1em] text-[var(--k-ink-3)] uppercase">
          {copy['recognition.universities.label']}
        </p>
        <LogoStrip
          size="lg"
          showNames
          label={copy['recognition.universities.aria']}
          logos={UNIVERSITY_PARTNERS.map((p) => ({ name: p.name, src: p.src }))}
        />
      </div>
    </Section>
  );
}
