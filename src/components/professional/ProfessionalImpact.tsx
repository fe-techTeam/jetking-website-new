import { EnquiryLink } from '@/components/EnquirySheet';
import { CardRail, Callout, FeatureCard, Reveal, Section, SectionHeader, StatBadges } from '@/components/kit';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { FLEXIBLE_OPTIONS, IMPACT_STATS, PROFESSIONAL_BENEFITS } from './data';

export function ProfessionalImpact() {
  return (
    <Section tone="plain" deco="glow" labelledBy="pro-impact-heading">
      <SectionHeader
        id="pro-impact-heading"
        eyebrow="Career outcomes"
        title={
          <>
            The Impact You Can Expect from <span className="text-[var(--k-red)]">{siteConfig.name}</span>
          </>
        }
        lede="Practical career growth for working professionals who upskill without leaving their current role."
      />
      <Reveal>
        <StatBadges stats={IMPACT_STATS.map((s) => ({ value: s.value, label: s.label, icon: s.icon }))} />
      </Reveal>

      <div className="mt-14 sm:mt-16">
        <h3 id="pro-flex-heading" className="text-[22px] font-extrabold tracking-[-0.01em] text-[var(--k-ink)] sm:text-[26px]">
          Flexible Learning That Fits Your Life
        </h3>
        <p className="mt-2 max-w-[56ch] text-[16px] leading-relaxed text-[var(--k-ink-2)]">
          Choose a schedule that works around your job — not the other way around.
        </p>
        <ul aria-labelledby="pro-flex-heading" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {FLEXIBLE_OPTIONS.map((option) => (
            <li key={option.label} className="kit kit-card flex items-center gap-3 p-4 sm:p-5">
              <span className="kit-iconwell" aria-hidden="true">
                <option.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="text-[15px] leading-snug font-bold text-[var(--k-ink)]">{option.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 sm:mt-16">
        <h3 id="pro-benefits-heading" className="text-[22px] font-extrabold tracking-[-0.01em] text-[var(--k-ink)] sm:text-[26px]">
          Why Professionals Choose Jetking
        </h3>
        <p className="mt-2 max-w-[56ch] text-[16px] leading-relaxed text-[var(--k-ink-2)]">
          What you get when you upskill with a course built for working schedules.
        </p>
        <div className="mt-6">
          <CardRail label="Why professionals choose Jetking" cols={3} colsMd={2}>
            {PROFESSIONAL_BENEFITS.map((benefit) => (
              <FeatureCard key={benefit.title} icon={benefit.icon} title={benefit.title}>
                {benefit.detail}
              </FeatureCard>
            ))}
          </CardRail>
        </div>
      </div>

      <div className="mt-12 sm:mt-14">
        <Callout
          icon={TrendingUp}
          title="Ready to upgrade?"
          action={
            <EnquiryLink
              source="professional-impact"
              className="dc-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold sm:text-[16px]"
            >
              Book My Session Now
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </EnquiryLink>
          }
        >
          Book a free career upgrade session — get a personalised plan without interrupting your work week.
        </Callout>
      </div>
    </Section>
  );
}
