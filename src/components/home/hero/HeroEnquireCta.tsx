'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';
import { EnquiryModal, type EnquiryCentre } from '@/components/EnquiryModal';
import { track } from '@/lib/analytics';

/**
 * Second hero CTA, beside "Explore Courses": opens the quick enquiry modal (name,
 * mobile, state, centre). Outlined rather than filled so the primary action keeps its
 * weight and the glow; colours come from the hero's own theme variables so it follows
 * light and dark with the rest of the hero.
 */
export function HeroEnquireCta({ centres, label }: { centres: EnquiryCentre[]; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          track('enquiry_started', { surface: 'home-hero-modal' });
          setOpen(true);
        }}
        aria-haspopup="dialog"
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border-2 border-[var(--v2-accent)] bg-transparent px-3.5 py-2 text-[13px] font-bold text-[var(--v2-ink)] transition-colors duration-200 hover:bg-[var(--v2-accent)] hover:text-white sm:min-h-12 sm:gap-2.5 sm:px-5 sm:py-3.5 sm:text-[16px]"
      >
        <Phone className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} aria-hidden="true" />
        {label}
      </button>

      <EnquiryModal open={open} onClose={() => setOpen(false)} centres={centres} source="home-hero-modal" />
    </>
  );
}
