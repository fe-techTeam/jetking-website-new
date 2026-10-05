import { EnquiryLink } from '@/components/EnquirySheet';
import { Section } from '@/components/kit';
import { ArrowRight } from 'lucide-react';
import type { professionalCopy } from '@/lib/content/copy/pages/professional';
import { BOTTOM_CTA_FEATURE_ICONS } from './data';

export function ProfessionalBottomCta({ copy }: { copy: typeof professionalCopy.defaults }) {
  return (
    <Section tone="wash" labelledBy="pro-cta-heading">
        <div
          className={[
            'flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10',
          ].join(' ')}
        >
          <div className="max-w-2xl">
            <h2
              id="pro-cta-heading"
              className="section-title font-display text-[var(--dc-ink)]"
            >
              {copy['cta.title']}
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
              {copy['cta.lede']}
            </p>
            <ul className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
              {BOTTOM_CTA_FEATURE_ICONS.map((Icon, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-[14px] font-semibold text-[var(--dc-ink-secondary)]"
                >
                  <Icon
                    className="h-4 w-4 text-[var(--dc-accent-soft)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {copy[`cta.features.${i}` as 'cta.features.0']}
                </li>
              ))}
            </ul>
          </div>

          <EnquiryLink
            source="professional-bottom-cta"
            className="group/cta inline-flex min-h-14 shrink-0 items-center justify-center gap-3 self-start rounded-full bg-[var(--dc-navy)] py-3.5 pr-3 pl-7 text-[15px] font-bold text-white transition-colors hover:bg-jk-700 sm:text-[16px] lg:self-center"
          >
            {copy['cta.button.label']}
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </EnquiryLink>
        </div>
      </Section>
  );
}
