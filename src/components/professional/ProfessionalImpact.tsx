import { EnquiryLink } from '@/components/EnquirySheet';
import { Section } from '@/components/kit';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { FLEXIBLE_OPTIONS, IMPACT_STATS, PROFESSIONAL_BENEFITS } from './data';

export function ProfessionalImpact() {
  return (
    <Section tone="plain" deco="glow" labelledBy="pro-impact-heading">
        <div>
          <div className="max-w-3xl">
            <p className="text-[13px] font-bold tracking-[0.06em] text-[var(--dc-accent-soft)] uppercase">
              Career outcomes
            </p>
            <h2
              id="pro-impact-heading"
              className="section-title mt-2 font-display text-[var(--dc-ink)]"
            >
              The Impact You Can Expect from{' '}
              <span className="text-[var(--dc-accent-soft)]">{siteConfig.name}</span>
            </h2>
            <p className="mt-3 max-w-[58ch] text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
              Practical career growth for working professionals who upskill without leaving their
              current role.
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-4 lg:grid-cols-4">
            {IMPACT_STATS.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] p-4 xs:rounded-[20px] xs:p-5"
              >
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--dc-accent-soft)]/35 bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                >
                  <stat.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="mt-3.5 block font-display text-[22px] leading-none font-extrabold text-[var(--dc-ink)] sm:text-[24px]">
                    {stat.value}
                  </span>
                  <span className="mt-2 block text-[12.5px] leading-snug text-[var(--dc-ink-secondary)] sm:text-[13px]">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 border-t border-[var(--dc-hairline-strong)] pt-8 sm:mt-10 sm:pt-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
              <div className="max-w-xl">
                <h3
                  id="pro-flex-heading"
                  className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] sm:text-[20px]"
                >
                  Flexible Learning That Fits Your Life
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)]">
                  Choose a schedule that works around your job — not the other way around.
                </p>
              </div>
            </div>

            <ul
              className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
              aria-labelledby="pro-flex-heading"
            >
              {FLEXIBLE_OPTIONS.map((option) => (
                <li key={option.label}>
                  <div className="flex h-full flex-col items-start gap-3 rounded-[16px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] p-4 sm:rounded-[16px] sm:p-5">
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--dc-accent-soft)]/40 bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)]"
                    >
                      <option.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <p className="text-[14px] font-bold leading-snug text-[var(--dc-ink)]">
                      {option.label}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className={[
            'mt-10 grid gap-6 xs:gap-7 sm:mt-12 sm:gap-8',
            'lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-6 xl:gap-x-10',
            
          ].join(' ')}
          role="group" aria-labelledby="pro-benefits-heading"
        >
          <div className="max-w-xl lg:col-span-7 xl:col-span-8">
            <h3
              id="pro-benefits-heading"
              className="font-display text-[24px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] xs:text-[26px] sm:text-[28px] lg:text-[30px]"
            >
              Why Professionals Choose Jetking
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--dc-ink-muted)] sm:text-[15px]">
              What you get when you upskill with a course built for working schedules.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-3 xs:gap-3.5 sm:grid-cols-2 sm:gap-4 lg:col-span-7 lg:row-start-2 xl:col-span-8">
            {PROFESSIONAL_BENEFITS.map((benefit) => (
              <li key={benefit.title} className="min-w-0">
                <article className="pro-card flex h-full gap-3.5 rounded-[16px] p-4 xs:gap-4 xs:rounded-[20px] xs:p-5 sm:flex-col sm:gap-0">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--dc-accent-soft)]/40 bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)] xs:h-11 xs:w-11 sm:h-12 sm:w-12"
                  >
                    <benefit.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 sm:mt-4">
                    <h4 className="text-[15px] font-extrabold text-[var(--dc-ink)] xs:text-[16px]">
                      {benefit.title}
                    </h4>
                    <p className="mt-1 text-[14px] leading-snug text-[var(--dc-ink-muted)] xs:mt-1.5 sm:leading-relaxed">
                      {benefit.detail}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <div className="min-w-0 lg:col-span-5 lg:row-start-2 lg:self-stretch xl:col-span-4">
            <div className="relative flex h-full flex-col justify-center overflow-hidden rounded-[24px] border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] p-6 xs:rounded-[24px] xs:p-7 sm:rounded-[28px] sm:p-8 lg:p-7 xl:p-8">
              <span
                aria-hidden="true"
                className="relative grid h-11 w-11 place-items-center rounded-2xl bg-[var(--dc-accent-tint)] text-[var(--dc-accent-soft)] shadow-brand xs:h-12 xs:w-12"
              >
                <TrendingUp className="h-5 w-5" strokeWidth={1.75} />
              </span>

              <h3 className="relative mt-4 font-display text-[22px] font-extrabold tracking-[-0.02em] text-[var(--dc-ink)] xs:mt-5 xs:text-[24px] sm:text-[26px]">
                Ready to upgrade?
              </h3>
              <p className="relative mt-2.5 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] xs:mt-3 xs:text-[15px]">
                Book a free career upgrade session — get a personalised plan without interrupting
                your work week.
              </p>

              <EnquiryLink
                source="professional-impact"
                className="group/book relative mt-6 inline-flex w-full min-h-12 items-center justify-between gap-3 rounded-full bg-[var(--dc-navy)] py-3 pr-3 pl-5 text-[14.5px] font-bold text-white transition-colors hover:bg-jk-700 xs:mt-7 xs:text-[15px]"
              >
                <span>Book My Session Now</span>
                <span
                  aria-hidden="true"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/book:translate-x-0.5"
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </EnquiryLink>
            </div>
          </div>
        </div>
      </Section>
  );
}
