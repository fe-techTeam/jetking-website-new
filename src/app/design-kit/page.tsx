import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight, Award, Briefcase, Cpu, GraduationCap, MapPin, MessageCircle, Users, Wrench } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { EnquiryLink } from '@/components/EnquirySheet';
import { RECRUITERS } from '@/components/placements/data';
import {
  Callout,
  CardRail,
  ComparisonTable,
  FeatureCard,
  LogoStrip,
  Reveal,
  Section,
  SectionHeader,
  StatBadges,
  StepPath,
  StoryCard,
  Timeline,
} from '@/components/kit';

export const metadata: Metadata = buildMetadata(
  {
    title: 'Design kit',
    description: 'Internal preview of the shared page components.',
    noindex: true,
  },
  '/design-kit',
);

const BTN =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--theme-accent)] px-6 text-[15px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]';

/** Internal reference: every kit component, in the tone rhythm a real page should follow. Placeholder content only. */
export default function DesignKitPage() {
  // Internal reference only: not served in production unless explicitly enabled.
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SHOW_DESIGN_KIT !== 'true') notFound();
  return (
    <>
      <Section tone="plain" deco="glow" labelledBy="k-hero">
        <SectionHeader
          id="k-hero"
          eyebrow="Design kit · preview"
          title="One set of parts, used the same way on every page"
          lede="White, grey and one red. Rhythm comes from alternating section tones, a little texture, and varied components. All content below is placeholder."
        />
        <Reveal>
          <StatBadges
            stats={[
              { value: '1947', label: 'Training since', icon: Award },
              { value: '39', label: 'Centres', icon: MapPin },
              { value: '28', label: 'Cities', icon: Users },
              { value: '18', label: 'Courses', icon: GraduationCap },
            ]}
          />
        </Reveal>
      </Section>

      <Section tone="tint" labelledBy="k-features">
        <SectionHeader id="k-features" eyebrow="Feature cards" title="Why learners choose us" lede="Icon, title, two lines. Swipe on phones, a grid from tablet." />
        <CardRail label="Why choose us" cols={3}>
          <FeatureCard icon={Wrench} title="Hands-on labs">Practise on real hardware and cloud set-ups with an instructor beside you.</FeatureCard>
          <FeatureCard icon={Cpu} title="Industry tools">Learn the tools employers list in job descriptions, not just theory.</FeatureCard>
          <FeatureCard icon={Briefcase} title="Placement support">Resume work, interview practice and introductions to hiring partners.</FeatureCard>
        </CardRail>
      </Section>

      <Section tone="plain" deco="dots" labelledBy="k-compare">
        <SectionHeader id="k-compare" eyebrow="Comparison table" title="Jetking vs a typical online course" lede="Compare only on facts we can stand behind." />
        <ComparisonTable
          caption="Jetking compared with a typical online course"
          rows={[
            { criterion: 'Classroom labs', us: true, others: false },
            { criterion: 'In-person mentors', us: true, others: false },
            { criterion: 'Local centre support', us: '39 centres', others: 'Online only' },
            { criterion: 'Certification prep', us: true, others: true },
          ]}
        />
      </Section>

      <Section tone="wash" labelledBy="k-stories">
        <SectionHeader id="k-stories" eyebrow="Story cards" title="Learner stories" lede="Portrait, outcome and a short quote. Sample names." />
        <CardRail label="Learner stories" cols={3}>
          <StoryCard name="Sample Learner" outcome="Cloud Support Engineer" quote="The labs made the theory click. I could show real work in my interviews." />
          <StoryCard name="Another Learner" outcome="SOC Analyst" quote="My mentor at the centre pushed me to finish a proper capstone project." />
          <StoryCard name="Third Learner" outcome="Network Engineer" quote="Weekend doubt sessions meant I never stayed stuck for long." />
        </CardRail>
      </Section>

      <Section tone="plain" labelledBy="k-logos">
        <SectionHeader id="k-logos" eyebrow="Logo strip" title="Where our learners work" lede="Equal tiles, same height, text fallback if a logo is missing." />
        <LogoStrip label="Hiring partners" logos={[...RECRUITERS.slice(0, 5), { name: 'No logo yet' }]} />
      </Section>

      <Section tone="tint" labelledBy="k-steps">
        <SectionHeader id="k-steps" eyebrow="Step path" title="How it works" lede="Icon discs joined by arrows on desktop, a rail on phones." />
        <StepPath
          steps={[
            { icon: Wrench, title: 'Learn', body: 'Hands-on training with real tools.' },
            { icon: Cpu, title: 'Practice', body: 'Lab sessions and mock interviews.' },
            { icon: Award, title: 'Get certified', body: 'Industry and Jetking certificates.' },
            { icon: Briefcase, title: 'Get placed', body: 'Career support and introductions.' },
          ]}
        />
        <div className="mt-12" />
        <SectionHeader eyebrow="Timeline" title="Numbered timeline" />
        <Timeline
          steps={[
            { title: 'Choose a course', body: 'Pick a degree or a short course that fits your goal.' },
            { title: 'Train at a centre', body: 'Attend labs and mentor sessions near you.' },
            { title: 'Build projects', body: 'Finish real projects for your portfolio.' },
            { title: 'Get career support', body: 'Resume, interviews and introductions to hiring partners.' },
          ]}
        />
      </Section>

      <Section tone="plain" labelledBy="k-callout">
        <h2 id="k-callout" className="sr-only">Callout</h2>
        <Callout
          icon={MessageCircle}
          title="Not sure which course is right?"
          action={
            <EnquiryLink source="design-kit" className={BTN}>
              Talk to a counsellor <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </EnquiryLink>
          }
        >
          Tell us your goal and a counsellor from your nearest centre will call you.
        </Callout>
      </Section>
    </>
  );
}
