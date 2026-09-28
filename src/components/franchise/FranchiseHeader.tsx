'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { cx } from '@/components/ui';
import { useDialog } from '@/components/useDialog';
import { useHydrated } from '@/components/useHydrated';

const NAV_LINKS = [
  { label: 'Why Jetking', href: '#why-jetking' },
  { label: 'Courses', href: '/courses' },
  { label: 'Success Stories', href: '#testimonials' },
  { label: 'Franchise Support', href: '#journey' },
  { label: 'Resources', href: '/faq' },
] as const;

function JetkingCrest({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'relative grid shrink-0 place-items-center overflow-hidden border-[2.5px] sm:border-[3px]',
        className,
      )}
      style={{
        borderRadius: '7px 7px 46% 46% / 7px 7px 56% 56%',
        borderColor: 'var(--color-brand-crest)',
      }}
    >
      <span
        className="mt-[-2px] h-[58%] w-[38%]"
        style={{
          background:
            'repeating-linear-gradient(-48deg,var(--color-brand-crest) 0 2px,transparent 2px 5.5px)',
        }}
      />
    </span>
  );
}

export function FranchiseHeader() {
  const [scrolled, setScrolled] = useState(false);
  const mounted = useHydrated();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Same modal contract as the main site header — see `useDialog`.
  useDialog(menuOpen, closeMenu, drawerRef);

  const drawer = mounted
    ? createPortal(
        <>
          <div
            aria-hidden="true"
            className={cx(
              'fixed inset-0 z-[70] bg-foreground/35 transition-opacity duration-300 motion-reduce:transition-none',
              menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            onClick={closeMenu}
          />
          <aside
            id="franchise-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal={menuOpen || undefined}
            aria-label="Franchise menu"
            inert={!menuOpen}
            className={cx(
              'fixed inset-y-0 right-0 z-[80] flex w-[min(100%,22rem)] flex-col bg-background shadow-[-18px_0_40px_rgb(16_24_40/0.12)] transition-transform duration-300 sm:w-[24rem]',
              menuOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full',
            )}
          >
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-5 sm:h-[80px] sm:px-6">
              <span className="font-display text-[18px] font-extrabold tracking-[-0.02em]">Menu</span>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-foreground text-background hover:bg-foreground-secondary"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto px-5 py-4 sm:px-6">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  className="border-b border-border py-4 text-[16px] font-bold text-foreground transition-colors hover:text-[var(--accent-ink)] last:border-0"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="#enquire"
                onClick={closeMenu}
                className="fra-btn-primary mt-6 w-full"
              >
                Enquire Now
                <span aria-hidden="true">→</span>
              </Link>
            </nav>
          </aside>
        </>,
        document.body,
      )
    : null;

  return (
    <header
      className={cx(
        'fra-header sticky top-0 z-50 transition-[background-color,box-shadow] duration-300',
        scrolled && 'bg-white/95 shadow-[0_4px_20px_rgb(16_24_40/0.06)] backdrop-blur-md',
      )}
    >
      <div className="shell flex h-[72px] items-center justify-between gap-4 sm:h-[80px]">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label={`${siteConfig.name} home`}>
          <JetkingCrest className="h-[38px] w-[32px] sm:h-[44px] sm:w-[38px]" />
          <span className="flex flex-col">
            <span className="font-display text-[20px] leading-none font-extrabold tracking-[-0.02em] text-jk-500 sm:text-[24px]">
              {siteConfig.name}
              <sup className="ml-0.5 text-[8px] font-bold sm:text-[12px]">®</sup>
            </span>
            <span className="mt-0.5 text-[12px] font-semibold tracking-[0.06em] text-jk-500 sm:text-[12px]">
              Better Life
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex xl:gap-8" aria-label="Franchise">
          {NAV_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="fra-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="#enquire" className="fra-btn-primary hidden px-5 py-2.5 text-[13.5px] sm:inline-flex">
            Enquire Now
            <span aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="franchise-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-ink-900 text-white transition-colors hover:bg-ink-800 sm:h-12 sm:w-12 lg:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            ) : (
              <span aria-hidden="true" className="flex flex-col items-center gap-1">
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-3 rounded-full bg-white" />
              </span>
            )}
          </button>
        </div>
      </div>
      {drawer}
    </header>
  );
}
