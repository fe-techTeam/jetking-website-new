'use client';

import { CheckCircle2 } from 'lucide-react';
import type { EnquiryCentre } from '@/components/EnquiryModal';
import { QuickEnquiryForm } from '@/components/QuickEnquiryForm';
import { Section } from '@/components/kit';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/** Inline lead form (same `QuickEnquiryForm` and `/api/enquiry` as the hero modal), so the closing CTA captures a lead without opening anything or leaving the page. */
export function FinalCta({ centres, copy }: { centres: EnquiryCentre[]; copy: HomeCopy }) {
  const POINTS = [copy['cta.points.0'], copy['cta.points.1'], copy['cta.points.2']];

  return (
    <Section tone="tint" deco="glow" labelledBy="home-final-cta-heading">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-center lg:gap-14">
        <div>
          <h2 id="home-final-cta-heading" className="section-title text-[var(--k-ink)]">
            {copy['cta.title']}
          </h2>
          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-[var(--k-ink-2)] sm:text-[17px]">
            {copy['cta.body']}
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
          <p className="mb-4 text-[19px] font-bold text-[var(--k-ink)]">{copy['cta.form.title']}</p>
          <QuickEnquiryForm centres={centres} source="home-final-cta-form" />
        </div>
      </div>
    </Section>
  );
}
