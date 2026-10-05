import { Reveal, Section, SectionHeader, StepPath } from '@/components/kit';
import type { professionalCopy } from '@/lib/content/copy/pages/professional';
import { GROWTH_STEP_ICONS } from './data';

export function ProfessionalGrowthPath({ copy }: { copy: typeof professionalCopy.defaults }) {
  return (
    <Section tone="plain" deco="grid" labelledBy="pro-growth-heading">
      <SectionHeader
        id="pro-growth-heading"
        eyebrow={copy['growth.eyebrow']}
        title={copy['growth.title']}
        lede={copy['growth.lede']}
      />
      <Reveal>
        <StepPath
          steps={GROWTH_STEP_ICONS.map((icon, i) => ({
            icon,
            title: copy[`growth.${i}.title` as 'growth.0.title'],
            body: <p className="lg:max-w-[12rem]">{copy[`growth.${i}.detail` as 'growth.0.detail']}</p>,
          }))}
        />
      </Reveal>
    </Section>
  );
}
