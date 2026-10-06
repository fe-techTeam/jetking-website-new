'use client';

import Image from 'next/image';
import { Check, PhoneCall } from 'lucide-react';
import type { EnquiryCentre } from '@/components/EnquiryModal';
import { QuickEnquiryForm } from '@/components/QuickEnquiryForm';
import { Section } from '@/components/kit';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/** Inline lead form (same `QuickEnquiryForm` and `/api/enquiry` as the hero modal), so the closing CTA captures a lead without opening anything or leaving the page. */
export function FinalCta({ centres, copy }: { centres: EnquiryCentre[]; copy: HomeCopy }) {
  const POINTS = [copy['cta.points.0'], copy['cta.points.1'], copy['cta.points.2']];

  return (
    <Section tone="tint" labelledBy="home-final-cta-heading">
      <div className="grid overflow-hidden rounded-[28px] border border-[var(--k-line)] bg-[var(--k-card)] shadow-[var(--k-shadow-up)] lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        {/* Photo side: the promise, in white over the picture */}
        <div className="relative isolate flex min-h-[420px] flex-col justify-end overflow-hidden p-6 sm:p-10 lg:min-h-[560px] lg:p-12">
          <Image
            src="/home/why-labs.jpg"
            alt=""
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="-z-10 object-cover object-[center_30%]"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-scrim/95 via-scrim/65 to-scrim/25" />

          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[var(--k-red-fill)] to-jk-700 text-white shadow-brand">
            <PhoneCall className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <h2
            id="home-final-cta-heading"
            className="mt-6 max-w-[18ch] font-display text-[30px] leading-[1.08] font-extrabold tracking-[-0.025em] text-white sm:text-[38px] lg:text-[44px]"
          >
            {copy['cta.title']}
          </h2>
          <p className="mt-4 max-w-[46ch] text-[15.5px] leading-relaxed text-white/80 sm:text-[17px]">
            {copy['cta.body']}
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-[15px] text-white/90">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/30">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Form side */}
        <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <p className="mb-5 font-display text-[22px] font-extrabold tracking-[-0.01em] text-[var(--k-ink)] sm:text-[26px]">
            {copy['cta.form.title']}
          </p>
          <QuickEnquiryForm centres={centres} source="home-final-cta-form" />
        </div>
      </div>
    </Section>
  );
}
