'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { EnquiryLink } from '@/components/EnquirySheet';
import { track } from '@/lib/analytics';
import { siteConfig } from '@/lib/site';

/**
 * Phone/tablet bottom bar for the long course page. Appears once the hero's own CTA row
 * (`anchorId`) has scrolled above the viewport, and steps aside while the site footer is on
 * screen so it never covers the legal links. Hidden from lg up, where the page is short
 * enough that the hero CTA is never far away.
 */
export function StickyCourseCta({
  anchorId,
  title,
  duration,
}: {
  anchorId: string;
  title: string;
  duration: string;
}) {
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
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--dc-hairline)] bg-[var(--dc-card)]/95 pb-[env(safe-area-inset-bottom)] shadow-bar backdrop-blur-md transition-transform duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none lg:hidden ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="shell flex items-center gap-3 py-3">
        <div className="hidden min-w-0 flex-1 sm:block">
          <p className="truncate text-[14px] font-extrabold text-[var(--dc-ink)]">{title}</p>
          <p className="text-[12px] font-semibold text-[var(--dc-ink-muted)]">{duration}</p>
        </div>
        <a
          href={`tel:${siteConfig.phone || siteConfig.helpline}`}
          aria-label="Call Jetking"
          onClick={() => track('phone_clicked', { surface: 'sticky-course-cta' })}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--dc-hairline-strong)] text-[var(--dc-ink)] transition-colors hover:bg-[var(--dc-surface)]"
        >
          <Phone className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
        </a>
        <EnquiryLink
          source="course-sticky-bar"
          className="dc-cta inline-flex h-11 flex-1 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-[14px] font-bold xs:px-5 sm:flex-none"
        >
          Enquire now
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </EnquiryLink>
      </div>
    </div>
  );
}
