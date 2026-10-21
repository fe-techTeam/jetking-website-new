'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Phone } from 'lucide-react';
import { track } from '@/lib/analytics';
import { whatsappHrefFromNumber } from '@/lib/site';
import { useSiteCopy } from '@/components/providers/site-copy';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import type { centresCopy } from '@/lib/content/copy/pages/centres';

/**
 * Phone/tablet bottom bar for the long centre page: Call + WhatsApp use the site-wide
 * CMS numbers (toll-free / WhatsApp), not this centre’s local line. Enquire scrolls to
 * the hero form. Appears once the hero actions scroll away; hidden from lg up.
 */
export function StickyCentreBar({
  anchorId,
  centreSlug,
  copy,
}: {
  copy: typeof centresCopy.defaults;
  anchorId: string;
  centreSlug: string;
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
      <div className="shell flex items-center gap-2 py-3 xs:gap-2.5">
        {phone ? (
          <a
            href={`tel:${phone}`}
            aria-label={copy['centreBar.callLabel']}
            onClick={() => track('phone_clicked', { centre_slug: centreSlug, type: 'sticky-bar-helpline' })}
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[var(--dc-hairline-strong)] px-2.5 text-[13px] font-bold text-[var(--dc-ink)] transition-colors hover:bg-[var(--dc-surface)] xs:gap-2 xs:px-3 xs:text-[14px]"
          >
            <Phone className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            {copy['centreBar.call']}
          </a>
        ) : null}
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy['centreBar.whatsappLabel']}
            onClick={() =>
              track('whatsapp_clicked', { centre_slug: centreSlug, surface: 'sticky-centre-bar' })
            }
            className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 text-[13px] font-bold text-[#128C7E] transition-colors hover:bg-[#25D366]/18 xs:gap-2 xs:px-3 xs:text-[14px] dark:text-[#25D366]"
          >
            <WhatsAppIcon className="h-4 w-4 shrink-0" />
            {copy['centreBar.whatsapp']}
          </a>
        ) : null}
        <a
          href={`#${anchorId}`}
          className="dc-cta inline-flex h-11 min-w-0 flex-[1.25] items-center justify-center gap-1 rounded-full px-2.5 text-[13px] font-bold xs:gap-1.5 xs:px-3 xs:text-[14px]"
        >
          {copy['centreBar.enquire']}
          <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
