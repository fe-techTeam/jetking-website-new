import { CardRail, FeatureCard, Reveal, Section, SectionHeader } from '@/components/kit';
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


    </Section>
  );
}
