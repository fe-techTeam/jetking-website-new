'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { EnquiryCentre } from '@/components/EnquiryModal';
import { QuickEnquiryForm } from '@/components/QuickEnquiryForm';

const POINTS = [
  'A counsellor from your nearest centre calls you back',
  'Eligibility, fees and batch options — no entrance test',
  'No obligation to enrol on the call',
];

/** Inline lead form (same `QuickEnquiryForm` and `/api/enquiry` as the hero modal), so the closing CTA captures a lead without opening anything. */
export function FinalCta({ centres }: { centres: EnquiryCentre[] }) {
  return (
    <section className="border-y border-[var(--dc-hairline)] bg-[var(--dc-surface)] py-14 sm:py-16 lg:py-20" aria-labelledby="home-final-cta-heading">
      <div className="shell">
        <div className="dc-banner relative grid gap-8 overflow-hidden rounded-[28px] px-6 py-10 xs:rounded-[28px] sm:px-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-center lg:gap-12">
          <div>
            <h2
              id="home-final-cta-heading"
              className="section-title font-display text-[var(--dc-ink)]"
            >
              Ready to start? Talk to a counsellor today.
            </h2>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[var(--dc-ink-secondary)] sm:text-[15px]">
              Tell us what you want to study and where. Leave your number and we will call you back.
            </p>
            <ul className="mt-6 space-y-2.5">
              {POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[14px] text-[var(--dc-ink-secondary)]">
                  <CheckCircle2
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--dc-accent-soft)]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {point}
                </li>
              ))}
            </ul>
            <Link
              href={'/courses' as Route}
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-[var(--dc-hairline-strong)] px-6 py-3 text-[15px] font-bold text-[var(--dc-ink)] transition-colors hover:border-[var(--dc-accent-soft)]"
            >
              Browse all courses
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-[24px] border border-[var(--dc-hairline)] bg-[var(--dc-card)] p-5 shadow-[var(--dc-shadow)] sm:p-6">
            <p className="mb-4 font-display text-[18px] font-extrabold text-[var(--dc-ink)]">Request a callback</p>
            <QuickEnquiryForm centres={centres} source="home-final-cta-form" />
          </div>
        </div>
      </div>
    </section>
  );
}
