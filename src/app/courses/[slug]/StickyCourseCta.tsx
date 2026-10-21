'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { EnquiryLink } from '@/components/EnquirySheet';
import { track } from '@/lib/analytics';
import { whatsappHrefFromNumber } from '@/lib/site';
import { useSiteCopy } from '@/components/providers/site-copy';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import type { coursesCopy } from '@/lib/content/copy/pages/courses';

/**
 * Phone/tablet bottom bar for the long course page. Appears once the hero's own CTA row
 * (`anchorId`) has scrolled above the viewport, and steps aside while the site footer is on
 * screen so it never covers the legal links. Hidden from lg up, where the page is short
 * enough that the hero CTA is never far away.
 *
 * Background is a solid elevated surface (not translucent) so page content never shows
 * through in light or dark theme. Actions only — no course title/duration (those live in the page).
 */
export function StickyCourseCta({
  anchorId,
  copy,
}: {
  copy: typeof coursesCopy.defaults;
  anchorId: string;
}) {
  const site = useSiteCopy();
  const phone = site['contact.phone'];
  const whatsappHref = whatsappHrefFromNumber(site['contact.whatsapp']);
  const [pastHero, setPastHero] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    const footer = document.getElementById('site-footer');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === anchor) {
          setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        } else {
          setFooterVisible(entry.isIntersecting);
        }
      }
    });
    if (anchor) observer.observe(anchor);
    if (footer) observer.observe(footer);
    return () => observer.disconnect();
  }, [anchorId]);

  const shown = pastHero && !footerVisible;

  return (
    <div
      inert={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#d0d5dd] bg-[#f2f4f7] pb-[env(safe-area-inset-bottom)] text-[#101828] shadow-[0_-12px_40px_rgb(16_24_40/0.2)] transition-transform duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none lg:hidden dark:border-[#3a3a48] dark:bg-[#1a1a26] dark:text-[#f4f4f8] dark:shadow-[0_-12px_40px_rgb(0_0_0/0.65)] ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="shell flex items-center justify-end gap-3 py-3">
        <a
          href={`tel:${phone}`}
          aria-label={copy['courseSticky.callLabel']}
          onClick={() => track('phone_clicked', { surface: 'sticky-course-cta' })}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#c8cdd6] bg-white text-current transition-colors hover:bg-[#e8eaef] dark:border-white/20 dark:bg-[#252532] dark:hover:bg-[#2e2e3c]"
        >
          <Phone className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </a>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={site['mobileBar.whatsapp.ariaLabel']}
            onClick={() => track('whatsapp_clicked', { surface: 'sticky-course-cta' })}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#25D366]/45 bg-[#25D366]/12 text-[#128C7E] transition-colors hover:bg-[#25D366]/2 dark:text-[#25D366]"
          >
            <WhatsAppIcon className="h-[18px] w-[18px]" />
          </a>
        ) : null}
        <EnquiryLink
          source="course-sticky-bar"
          className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#c7141c] px-4 text-[14px] font-bold text-white shadow-[0_6px_16px_rgb(199_20_28/0.35)] transition-colors hover:bg-[#a50d13] xs:flex-none xs:px-5"
        >
          {copy['courseSticky.cta']}
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </EnquiryLink>
      </div>
    </div>
  );
}
