import { BookOpen, BriefcaseBusiness, Check, Cpu, Trophy } from 'lucide-react';
import { Reveal, Section, SectionHeader, Timeline } from '@/components/kit';

/** Wording taken from the site's own content: `placements/data.ts` (process steps, student benefits), the live "reasons" (`explore/content.ts`) and the course certifications. */
const STEPS = [
  {
    icon: BookOpen,
    title: 'Learn',
    points: ['Learn practically with real-world tools', 'Trained & certified faculty', 'Scenario based learning'],
  },
  {
    icon: Cpu,
    title: 'Practice',
    points: ['One computer per student in the lab', 'Mock interviews', 'AI bot interviews and presentation practice'],
  },
  {
    icon: Trophy,
    title: 'Get certified',
    points: ['Industry certifications such as CCNA, AWS and CEH', 'Jetking certificates for every course', 'Partnership with NSDC'],
  },
  {
    icon: BriefcaseBusiness,
    title: 'Get placement support',
    points: ['Biodata preparation', 'Student interviews with hiring partners', 'Appointment letter'],
  },
];

export function HowItWorks() {
  return (
    <Section tone="tint" deco="grid" labelledBy="home-how-heading">
      <SectionHeader
        id="home-how-heading"
        title="Build your career, step by step"
        lede="From beginner to job-ready professional — we guide you at every stage."
      />
      <Reveal>
        <Timeline
          steps={STEPS.map((s) => ({
            title: s.title,
            body: (
              <ul className="mt-1 space-y-1.5">
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
