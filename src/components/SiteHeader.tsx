'use client';

import { EnquiryLink } from '@/components/EnquirySheet';
import Link from 'next/link';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bot, Moon, Sun, UserRound, X } from 'lucide-react';
import { mainNav } from '@/lib/site';
import { fill } from '@/lib/content/copy/define';
import { useSiteCopy } from '@/components/providers/site-copy';
import { copyLinks } from '@/components/providers/site-copy-links';
import { useTheme } from '@/components/providers/theme-provider';
import { useAccount } from '@/components/account/AccountProvider';
import { cx } from './ui';
import { CoursesMenu, type MenuCourse } from './CoursesMenu';
import { useDialog } from './useDialog';
import { useHydrated } from './useHydrated';

export type { MenuCourse };

/**
 * Site header — matches the Jetking Landing Replica chrome:
 * red crest + wordmark + "Better Life", circular utility, dark hamburger.
 *
 * The full text nav still lives in the right-side drawer (used at every width, and the
 * only nav on phone/tablet). From `lg` (1024px) up, the header also shows the four most
 * important destinations — About Us, Courses, Centres, Placements — as a direct link
 * row: the site has grown into a full multi-section marketing surface (courses,
 * centres, placements, franchise, blog…), and burying every one of those behind a
 * hamburger on desktop, where there is plenty of room for a link row, costs
 * discoverability for no real benefit at that width.
 */
export function SiteHeader({ menuCourses }: { menuCourses: MenuCourse[] }) {
  const pathname = usePathname();
  const copy = useSiteCopy();
  const { resolvedTheme, toggleTheme } = useTheme();
  const account = useAccount();
  const [scrolled, setScrolled] = useState(false);
  const mounted = useHydrated();
  const drawerRef = useRef<HTMLElement>(null);

  // Labels and links come from the site copy; `mainNav` is the shape (and which item is the Courses menu).
  const nav = copyLinks(copy, 'header.nav', mainNav.length).map((item, i) => ({
    ...item,
    isCourses: mainNav[i]?.href === '/courses',
  }));

  const [menu, setMenu] = useState({ open: false, path: pathname });
  const open = menu.open && menu.path === pathname;
  const setOpen = useCallback(
    (next: boolean) => setMenu({ open: next, path: pathname }),
    [pathname],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);

  /* Both the top bar and its drawer follow the resolved global theme. */
  const onDarkLead = resolvedTheme === 'dark';
  const themeLabel = resolvedTheme === 'dark' ? copy['header.theme.toLight'] : copy['header.theme.toDark'];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /*
   * Escape-to-close, focus into the drawer, a Tab loop inside it, and focus back
   * on the hamburger when it closes. Previously only Escape was handled: opening
   * the menu left focus on the toggle behind an overlay, and Tab walked straight
   * into the page underneath.
   */
  useDialog(open, close, drawerRef);

  const drawer = mounted
    ? createPortal(
        <>
          {/*
            Scrim. A div, not a button: with a focus trap and a real Close button in
            the drawer header, a full-viewport "Dismiss menu" control adds a second
            tab stop that announces nothing useful. Click-to-dismiss is a pointer
            convenience, and every keyboard route to the same outcome already exists.
          */}
          <div
            aria-hidden="true"
            className={cx(
              'fixed inset-0 z-[70] transition-opacity duration-300 ease-out motion-reduce:transition-none',
              onDarkLead ? 'bg-black/55' : 'bg-foreground/35',
              open ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            onClick={close}
          />

          <aside
            id="site-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal={open || undefined}
            aria-label={copy['header.drawer.ariaLabel']}
            inert={!open}
            className={cx(
              'fixed inset-y-0 right-0 z-[80] flex w-[min(100%,22rem)] flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:w-[24rem]',
              onDarkLead ? 'surface-inverse bg-background' : 'bg-background',
              open
                ? cx('translate-x-0', onDarkLead ? 'shadow-drawer shadow-black/55' : 'shadow-drawer')
                : 'pointer-events-none translate-x-full',
            )}
          >
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-border px-5 xs:h-[80px] sm:h-[88px] sm:px-6 2xl:h-[96px]">
              <span className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-foreground sm:text-[20px]">
                {copy['header.drawer.title']}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label={copy['header.menu.closeLabel']}
                className={cx(
                  'grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors duration-200 sm:h-12 sm:w-12',
                  onDarkLead
                    ? 'bg-white text-ink-900 hover:bg-surface'
                    : 'bg-foreground text-background hover:bg-foreground-secondary',
                )}
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <nav aria-label={copy['header.drawer.navAriaLabel']} className="flex flex-1 flex-col overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
              {nav.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href as Route}
                    aria-current={active ? 'page' : undefined}
                    onClick={close}
                    className={cx(
                      'flex items-center gap-2 border-b border-border py-4 text-[16px] font-bold tracking-[-0.01em] transition-colors last:border-0 sm:text-[17px]',
                      active
                        ? 'text-[var(--accent-ink)]'
                        : 'text-foreground hover:text-[var(--accent-ink)]',
                    )}
                  >
                    {active ? (
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-ink)]" />
                    ) : null}
                    {item.label}
                  </Link>
                );
              })}
              {account.ready ? (
                account.user ? (
                  <div className="mt-2 flex items-center justify-between gap-3 border-b border-border py-4">
                    <Link
                      href={'/account' as Route}
                      onClick={close}
                      className="min-w-0 truncate text-[16px] font-bold tracking-[-0.01em] text-foreground hover:text-[var(--accent-ink)] sm:text-[17px]"
                    >
                      {fill(copy['header.account.myAccount'], { name: account.user.name })}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        void account.logout();
                      }}
                      className="shrink-0 cursor-pointer text-sm font-bold text-foreground-secondary hover:text-[var(--accent-ink)]"
                    >
                      {copy['header.account.logout']}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      account.openAuth('login');
                    }}
                    className="mt-2 flex cursor-pointer items-center gap-2 border-b border-border py-4 text-left text-[16px] font-bold tracking-[-0.01em] text-foreground transition-colors hover:text-[var(--accent-ink)] sm:text-[17px]"
                  >
                    {copy['header.account.loginOrSignup']}
                  </button>
                )
              ) : null}
              <EnquiryLink
                source="site-header"
                onClick={close}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-jk-600 px-7 py-3.5 text-[15px] font-bold text-white shadow-brand transition-colors hover:bg-jk-700"
              >
                {copy['header.cta.label']}
                <span aria-hidden="true" className="text-lg leading-none">
                  →
                </span>
              </EnquiryLink>
            </nav>
          </aside>
        </>,
        document.body,
      )
    : null;

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-[background-color,box-shadow] duration-300',
        /*
         * Header sits above <main>, not over the hero. `bg-transparent` therefore
         * shows the white body — on the dark lead use the canvas colour instead.
         */
        onDarkLead
          ? scrolled
            ? 'bg-background shadow-md shadow-black/45'
            : 'bg-background'
          : scrolled
            ? 'bg-background shadow-md'
            : 'bg-transparent',
      )}
    >
      <div className="shell flex h-[72px] items-center justify-between gap-4 xs:h-[80px] sm:h-[88px] min-[1400px]:grid min-[1400px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] min-[1600px]:flex 2xl:h-[96px]">
        <Link href="/" className="group flex min-h-11 items-center" aria-label={copy['header.logo.ariaLabel']}>
          {/* eslint-disable-next-line @next/next/no-img-element -- brand asset; sized by caller */}
          <img
            src="/brand/jetking-wordmark.png"
            alt={copy['header.logo.alt']}
            draggable={false}
            className="block h-[28px] max-w-full select-none object-contain object-left xs:h-[32px] sm:h-[38px] 2xl:h-[42px]"
          />
        </Link>

        <nav aria-label={copy['header.nav.ariaLabel']} className="hidden flex-1 items-center justify-center gap-0.5 lg:flex min-[1400px]:flex-none min-[1400px]:gap-1 min-[1600px]:flex-1">
          {nav.map((item, index) => {
            if (item.isCourses) return <CoursesMenu key={item.href} label={item.label} href={item.href} onDarkLead={onDarkLead} courses={menuCourses} />;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'rounded-full px-3 py-2.5 text-sm font-bold tracking-[-0.01em] transition-colors duration-200 min-[1400px]:px-4',
                  /* Only the first four fit beside the actions until the header is this wide; the rest live in the menu. */
                  index >= 4 && 'hidden min-[1600px]:inline',
                  active
                    ? onDarkLead
                      ? 'text-white'
                      : 'text-[var(--accent-ink)]'
                    : onDarkLead
                      ? 'text-white/75 hover:bg-white/10 hover:text-white'
                      : 'text-foreground-secondary hover:bg-surface hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 xs:gap-4 sm:gap-5 lg:gap-3 min-[1400px]:justify-self-end min-[1700px]:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={themeLabel}
            aria-pressed={resolvedTheme === 'dark'}
            title={themeLabel}
            className={cx(
              'group grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border transition-[background-color,transform,border-color,color,box-shadow] duration-200 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-jk-500 active:scale-[0.96] motion-reduce:transform-none xs:h-12 xs:w-12 sm:h-[52px] sm:w-[52px]',
              onDarkLead
                ? 'border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/16'
                : 'border-border-medium bg-background text-foreground hover:border-border-strong hover:bg-surface',
            )}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" aria-hidden="true" />
            )}
          </button>
          {account.ready ? (
            account.user ? (
              <Link
                href={'/account' as Route}
                aria-label={fill(copy['header.account.ariaLabel'], { name: account.user.name })}
                title={account.user.name}
                className={cx(
                  'hidden h-12 w-12 shrink-0 place-items-center rounded-full border text-base font-extrabold transition-[background-color,border-color,box-shadow] sm:grid sm:h-[52px] sm:w-[52px]',
                  onDarkLead
                    ? 'border-white/20 bg-white/10 text-white hover:bg-white/16'
                    : 'border-border-medium bg-background text-jk-600 hover:border-border-strong hover:bg-surface',
                )}
              >
                {account.user.name.trim().charAt(0).toUpperCase() || '?'}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => account.openAuth('login')}
                className={cx(
                  'hidden h-[52px] cursor-pointer items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-bold whitespace-nowrap transition-[background-color,border-color,color,box-shadow] sm:inline-flex min-[1700px]:px-5',
                  onDarkLead
                    ? 'border-white/20 bg-white/10 text-white hover:bg-white/16'
                    : 'border-border-medium bg-background text-foreground hover:border-border-strong hover:bg-surface',
                )}
              >
                <UserRound className="h-5 w-5 text-jk-500" aria-hidden="true" />
                <span className="hidden min-[1700px]:inline">{copy['header.account.login']}</span>
                <span className="sr-only min-[1700px]:hidden">{copy['header.account.login']}</span>
              </button>
            )
          ) : null}
          <Link
            href={'/chatbot' as Route}
            className={cx(
              'inline-flex h-11 items-center justify-center gap-2 rounded-full border px-3 text-sm font-bold transition-[background-color,border-color,color,box-shadow] xs:h-12 xs:px-4 sm:h-[52px] sm:px-5',
              onDarkLead
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/16'
                : 'border-border-medium bg-background text-foreground hover:border-border-strong hover:bg-surface',
            )}
            aria-label={copy['header.ai.ariaLabel']}
          >
            <Bot
              className="h-5 w-5 text-jk-500"
              aria-hidden="true"
            />
            <span className="hidden sm:inline lg:hidden min-[1700px]:inline">{copy['header.ai.label']}</span>
          </Link>
          <EnquiryLink
            source="site-header"
            className="hidden h-[52px] items-center justify-center rounded-full bg-jk-600 px-5 text-sm font-bold whitespace-nowrap text-white transition-colors hover:bg-jk-700 lg:inline-flex"
          >
            {copy['header.cta.label']}
          </EnquiryLink>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? copy['header.menu.closeLabel'] : copy['header.menu.openLabel']}
            className={cx(
              'group relative grid h-12 w-12 cursor-pointer place-items-center rounded-full transition-[background-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:scale-[1.04] active:scale-[0.94] motion-reduce:transition-colors motion-reduce:hover:scale-100 motion-reduce:active:scale-100 xs:h-[52px] xs:w-[52px] sm:h-[62px] sm:w-[62px]',
              onDarkLead
                ? 'bg-white text-ink-900 hover:bg-surface'
                : 'bg-foreground text-background hover:bg-foreground-secondary',
            )}
          >
            {/*
              Three bars stay mounted so open/close can morph via transform
              instead of hard-swapping to the Lucide X. Hover also nudges each line.
            */}
            <span
              aria-hidden="true"
              className="relative block h-[14px] w-[18px] sm:h-[18px] sm:w-6"
            >
              <span
                className={cx(
                  'absolute left-0 top-0 block h-[2px] w-full origin-center rounded-full transition-[transform,opacity,width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:h-[2.5px]',
                  open
                    ? 'translate-y-[6px] rotate-45 bg-jk-500 sm:translate-y-[7.75px]'
                    : onDarkLead
                      ? 'bg-ink-900 group-hover:-translate-y-0.5 group-hover:bg-jk-500'
                      : 'bg-white group-hover:-translate-y-0.5 group-hover:bg-jk-500',
                )}
              />
              <span
                className={cx(
                  'absolute left-0 top-1/2 block h-[2px] w-full -translate-y-1/2 origin-center rounded-full bg-jk-500 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:h-[2.5px]',
                  open
                    ? 'scale-x-0 opacity-0 delay-75'
                    : 'group-hover:scale-x-[0.72] group-hover:delay-75',
                )}
              />
              <span
                className={cx(
                  'absolute bottom-0 left-0 block h-[2px] w-3 origin-center rounded-full transition-[transform,opacity,width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:h-[2.5px] sm:w-4',
                  open
                    ? 'w-full -translate-y-[6px] -rotate-45 bg-jk-500 delay-100 sm:-translate-y-[7.75px]'
                    : onDarkLead
                      ? 'bg-ink-900 group-hover:w-full group-hover:translate-y-0.5 group-hover:bg-jk-500'
                      : 'bg-white group-hover:w-full group-hover:translate-y-0.5 group-hover:bg-jk-500',
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {drawer}
    </header>
  );
}
