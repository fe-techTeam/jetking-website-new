import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight } from 'lucide-react';
import { BOTTOM_CTA_FEATURES } from './data';

export function ProfessionalBottomCta() {
  return (
    <section className="pro-bottom-cta py-10 sm:py-12 lg:py-14" aria-labelledby="pro-cta-heading">
      <div className="shell">
        <div
          className={[
            'flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10',
          ].join(' ')}
        >
          <div className="max-w-2xl">
            <h2
              id="pro-cta-heading"
              className="subsection-title font-display text-[var(--dc-ink)]"
            >
              Ready to take the next step in your career?
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
              Book a free career upgrade session with our experts.
            </p>
            <ul className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-3">
              {BOTTOM_CTA_FEATURES.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center gap-2 text-[13px] font-semibold text-[var(--dc-ink-secondary)]"
                >
                  <item.icon
                    className="h-4 w-4 text-[var(--dc-accent-soft)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={'/enquiry' as Route}
            className="group/cta inline-flex min-h-14 shrink-0 items-center justify-center gap-3 self-start rounded-full bg-[var(--dc-navy)] py-3.5 pr-3 pl-7 text-[15px] font-bold text-white transition-colors hover:bg-jk-700 sm:text-[16px] lg:self-center"
          >
            Book My Session Now
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-900 transition-transform duration-200 group-hover/cta:translate-x-0.5"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
