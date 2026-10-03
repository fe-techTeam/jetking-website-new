import { Reveal, Section, SectionHeader, StepPath } from '@/components/kit';
import { GROWTH_STEPS } from './data';

export function ProfessionalGrowthPath() {
  return (
    <Section tone="plain" deco="grid" labelledBy="pro-growth-heading">
      <SectionHeader
        id="pro-growth-heading"
        eyebrow="Career progression"
        title="Your Career Growth Path with Jetking"
        lede="From your current role to your next promotion — five practical milestones that fit around a full-time schedule."
      />
      <Reveal>
        <StepPath
          steps={GROWTH_STEPS.map((step) => ({
            icon: step.icon,
            title: step.title,
            body: <p className="lg:max-w-[12rem]">{step.detail}</p>,
          }))}
        />
      </Reveal>
    </Section>
  );
}
