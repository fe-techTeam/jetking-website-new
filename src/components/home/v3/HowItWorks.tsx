import { BookOpen, BriefcaseBusiness, Check, Cpu, Trophy } from 'lucide-react';
import { Reveal, Section, SectionHeader, StepPath } from '@/components/kit';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/** Wording taken from the site's own content: `placements/data.ts` (process steps, student benefits), the live "reasons" (`explore/content.ts`) and the course certifications. The text lives in the page copy (`how.steps.N.*`); only the icons are fixed here. */
const STEP_ICONS = [BookOpen, Cpu, Trophy, BriefcaseBusiness];

export function HowItWorks({ copy }: { copy: HomeCopy }) {
  const STEPS = STEP_ICONS.map((icon, i) => ({
    icon,
    title: copy[`how.steps.${i}.title` as keyof HomeCopy],
    points: [0, 1, 2].map((p) => copy[`how.steps.${i}.points.${p}` as keyof HomeCopy]),
  }));

  return (
    <Section tone="tint" deco="grid" labelledBy="home-how-heading">
      <SectionHeader
        id="home-how-heading"
        title={copy['how.title']}
        lede={copy['how.lede']}
      />
      <Reveal>
        <StepPath
          steps={STEPS.map((s) => ({
            icon: s.icon,
            title: s.title,
            body: (
              <ul className="mt-1 space-y-1.5 lg:text-left">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[14.5px] leading-snug">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--k-red)]" strokeWidth={2.5} aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            ),
          }))}
        />
      </Reveal>
    </Section>
  );
}
