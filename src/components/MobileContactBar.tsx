'use client';

import { EnquiryLink } from '@/components/EnquirySheet';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowRight, MessageCircle, Phone } from 'lucide-react';
import { track } from '@/lib/analytics';
import { whatsappHref } from '@/lib/site';
import { useSiteCopy } from '@/components/providers/site-copy';

/**
 * Routes with their own conversion path: the enquiry form itself, course pages
 * (StickyCourseCta), centre pages (StickyCentreBar: that centre's own number and enquiry), and the
 * franchise/investor audiences, who aren't enquiring about courses.
 */
const EXCLUDED = [/^\/enquiry/, /^\/courses\/[^/]+/, /^\/centres\/[^/]+/, /^\/franchise/, /^\/investors/, /^\/account/];

/**
 * Phone/tablet bottom bar: call the helpline or start an enquiry from anywhere. Slides in once
 * the hero has scrolled away, like StickyCourseCta.
 */
export function MobileContactBar() {
  const pathname = usePathname();
  const copy = useSiteCopy();
  const [scrolled, setScrolled] = useState(false);
  const [obscuring, setObscuring] = useState(false);
  const excluded = EXCLUDED.some((re) => re.test(pathname));

  useEffect(() => {
    if (excluded) return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    // Step aside for the footer and for any in-page lead form: the bar would cover its submit
    // button, and the form is already the next step it points to.
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setObscuring(visible.size > 0);
    });
    const watch = () =>
      document
        .querySelectorAll('#site-footer, main form:not([role="search"])')
        .forEach((el) => observer.observe(el));
    watch();
    // Some forms (the student journey's steps) only mount after the visitor interacts.
    const mutations = new MutationObserver(watch);
    const main = document.getElementById('main');
    if (main) mutations.observe(main, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
      mutations.disconnect();
    };
  }, [excluded, pathname]);

  if (excluded) return null;
  const shown = scrolled && !obscuring;
  const phone = copy['contact.phone'];

  return (
    <div
      inert={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--theme-hairline)] bg-[var(--theme-card)]/95 pb-[env(safe-area-inset-bottom)] shadow-bar backdrop-blur-md transition-transform duration-300 ease-[var(--ease-out-soft)] motion-reduce:transition-none lg:hidden ${
        shown ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="shell flex items-center gap-2.5 py-3">
        <a
          href={`tel:${phone}`}
          onClick={() => track('phone_clicked', { surface: 'mobile-contact-bar', path: pathname })}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--theme-hairline-strong)] px-4 text-[14px] font-bold text-[var(--theme-ink)] transition-colors hover:bg-[var(--theme-surface)]"
        >
          <Phone className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          {copy['mobileBar.call.label']}
        </a>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy['mobileBar.whatsapp.ariaLabel']}
            onClick={() => track('whatsapp_clicked', { surface: 'mobile-contact-bar', path: pathname })}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--theme-hairline-strong)] text-[var(--theme-parent-ink)] transition-colors hover:bg-[var(--theme-surface)]"
          >
            <MessageCircle className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
          </a>
        ) : null}
        <EnquiryLink
          source="mobile-contact-bar"
          onClick={() => track('enquiry_started', { surface: 'mobile-contact-bar', path: pathname })}
          className="inline-flex h-11 flex-[1.4] items-center justify-center gap-1.5 rounded-full bg-[var(--theme-accent)] px-4 text-[14px] font-bold text-white transition-colors hover:bg-[var(--theme-accent-hover)]"
        >
          {copy['mobileBar.enquire.label']}
          <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </EnquiryLink>
      </div>
    </div>
  );
}
