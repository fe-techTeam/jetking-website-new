'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowRight, Phone } from 'lucide-react';
import { track } from '@/lib/analytics';

/**
 * Phone/tablet bottom bar for the long centre page: Call this centre and Enquire. Appears once the
 * hero's action row (`anchorId`) has scrolled out of view and steps aside while the site footer is
 * on screen. Hidden from lg up, where the hero actions are never far away.
 */
export function StickyCentreBar({
  anchorId,
  centreSlug,
  phoneHref,
}: {
  anchorId: string;
  centreSlug: string;
  phoneHref: string | null;
}) {
  const [pastHero, setPastHero] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    const anchor = document.getElementById(anchorId);
    const footer = document.getElementById('site-footer');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === anchor) setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        else setFooterVisible(entry.isIntersecting);
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
        {phoneHref ? (
          <a
            href={phoneHref}
            aria-label="Call this centre"
            onClick={() => track('phone_clicked', { centre_slug: centreSlug, type: 'sticky-bar' })}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] px-4 text-[14px] font-bold text-[var(--dc-ink)] transition-colors hover:bg-[var(--dc-surface)] max-xs:w-11 max-xs:px-0"
          >
            <Phone className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
            <span className="max-xs:sr-only">Call</span>
          </a>
        ) : null}
        <Link
          href={`/enquiry?centre=${centreSlug}` as Route}
          className="dc-cta inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-5 text-[14px] font-bold"
        >
          Enquire now
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
