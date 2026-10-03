'use client';

import { CheckCircle2 } from 'lucide-react';
import type { EnquiryCentre } from '@/components/EnquiryModal';
import { QuickEnquiryForm } from '@/components/QuickEnquiryForm';
import { Section } from '@/components/kit';

const POINTS = [
  'A counsellor from your nearest centre calls you back',
  'Eligibility, fees and batch options — no entrance test',
  'No obligation to enrol on the call',
];

/** Inline lead form (same `QuickEnquiryForm` and `/api/enquiry` as the hero modal), so the closing CTA captures a lead without opening anything or leaving the page. */
export function FinalCta({ centres }: { centres: EnquiryCentre[] }) {
  return (
    <Section tone="tint" deco="glow" labelledBy="home-final-cta-heading">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-14">
        <div>
          <h2 id="home-final-cta-heading" className="section-title text-[var(--k-ink)]">
            Ready to start? Talk to a counsellor today.
          </h2>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
            Tell us what you want to study and where. Leave your number and we will call you back.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-[15px] text-[var(--k-ink-2)]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--k-red)]" strokeWidth={2} aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="kit-card p-5 sm:p-7">
          <p className="mb-4 text-[19px] font-bold text-[var(--k-ink)]">Request a callback</p>
          <QuickEnquiryForm centres={centres} source="home-final-cta-form" />
        </div>
      </div>
    </Section>
  );
}
