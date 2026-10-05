import { EnquiryLink } from '@/components/EnquirySheet';
import { CardRail, Callout, FeatureCard, Reveal, Section, SectionHeader, StatBadges } from '@/components/kit';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import type { professionalCopy } from '@/lib/content/copy/pages/professional';
import { BENEFIT_ICONS, FLEXIBLE_OPTION_ICONS, IMPACT_STAT_ICONS } from './data';

export function ProfessionalImpact({ copy }: { copy: typeof professionalCopy.defaults }) {
  const k = (key: string) => (copy as Record<string, string>)[key] ?? '';
  return (
    <Section tone="plain" deco="glow" labelledBy="pro-impact-heading">
      <SectionHeader
        id="pro-impact-heading"
        eyebrow={copy['impact.eyebrow']}
        title={
          <>
            {copy['impact.title.prefix']} <span className="text-[var(--k-red)]">{siteConfig.name}</span>
          </>
        }
        lede={copy['impact.lede']}
      />
      <Reveal>
        <StatBadges
          stats={IMPACT_STAT_ICONS.map((icon, i) => ({
            value: k(`impact.${i}.value`),
            label: k(`impact.${i}.label`),
            icon,
          }))}
        />
      </Reveal>

      <div className="mt-14 sm:mt-16">
        <h3 id="pro-flex-heading" className="text-[22px] font-extrabold tracking-[-0.01em] text-[var(--k-ink)] sm:text-[26px]">
          {copy['flex.title']}
        </h3>
        <p className="mt-2 max-w-[56ch] text-[16px] leading-relaxed text-[var(--k-ink-2)]">
          {copy['flex.lede']}
        </p>
        <ul aria-labelledby="pro-flex-heading" className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {FLEXIBLE_OPTION_ICONS.map((Icon, i) => (
            <li key={i} className="kit kit-card flex items-center gap-3 p-4 sm:p-5">
              <span className="kit-iconwell" aria-hidden="true">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="text-[15px] leading-snug font-bold text-[var(--k-ink)]">{k(`flex.${i}.label`)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 sm:mt-16">
        <h3 id="pro-benefits-heading" className="text-[22px] font-extrabold tracking-[-0.01em] text-[var(--k-ink)] sm:text-[26px]">
          {copy['benefits.title']}
        </h3>
        <p className="mt-2 max-w-[56ch] text-[16px] leading-relaxed text-[var(--k-ink-2)]">
          {copy['benefits.lede']}
        </p>
        <div className="mt-6">
          <CardRail label={copy['benefits.rail.label']} cols={3} colsMd={2}>
            {BENEFIT_ICONS.map((icon, i) => (
              <FeatureCard key={i} icon={icon} title={k(`benefits.${i}.title`)}>
                {k(`benefits.${i}.detail`)}
              </FeatureCard>
            ))}
          </CardRail>
        </div>
      </div>

      <div className="mt-12 sm:mt-14">
        <Callout
          icon={TrendingUp}
          title={copy['callout.title']}
          action={
            <EnquiryLink
              source="professional-impact"
              className="dc-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-bold sm:text-[16px]"
            >
              {copy['callout.cta.label']}
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </EnquiryLink>
          }
        >
          {copy['callout.body']}
        </Callout>
      </div>
    </Section>
  );
}
