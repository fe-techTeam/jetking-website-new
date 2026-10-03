import Link from 'next/link';
import type { Route } from 'next';
import {
  ArrowRight,
  Briefcase,
  GraduationCap,
  MapPin,
  MessageCircle,
  Newspaper,
  Store,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ButtonLink } from '@/components/ui';

/**
 * 404.
 *
 * During and after the migration this page will be hit by traffic from legacy URLs
 * that the redirect map missed. It therefore does real work: it offers the main
 * routes rather than being a dead end, and every 404 hit is worth monitoring in
 * Search Console as a signal that the redirect map has a gap.
 *
 * Palette follows the rest of the site: white / grey surfaces with Jetking red as the only accent,
 * built from theme tokens so it tracks the light / dark toggle.
 */

const DESTINATIONS: Array<{ href: Route; title: string; meta: string; icon: LucideIcon }> = [
  { href: '/courses', title: 'Courses', meta: 'Degrees, diplomas and short courses', icon: GraduationCap },
  { href: '/centres', title: 'Centres', meta: '39 centres across 28 cities', icon: MapPin },
  { href: '/placements', title: 'Placements', meta: 'How placement support works', icon: Briefcase },
  { href: '/blog', title: 'Guidance', meta: 'Choosing a course and a career', icon: Newspaper },
  { href: '/franchise', title: 'Franchise', meta: 'The operating model', icon: Store },
  { href: '/enquiry', title: 'Talk to a counsellor', meta: 'Get a call back, free', icon: MessageCircle },
];

export default function NotFound() {
  return (
    <div className="shell py-12 sm:py-16 lg:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1 text-[12px] font-bold tracking-[0.1em] text-[var(--accent-ink)] uppercase">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Error 404
          </p>
          <h1 className="page-title mt-5 text-balance text-foreground">
            We couldn&rsquo;t find that page
          </h1>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-foreground-secondary">
            The link may be old, or the page may have moved during our site migration. Try one of
            the places below, or tell us what you were looking for and a counsellor will point you
            to it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/" size="lg">
              Back to home
            </ButtonLink>
            <ButtonLink href="/courses" tone="secondary" size="lg">
              Browse courses
            </ButtonLink>
          </div>
        </div>

        {/* Illustration: a browser window with a big 404, drawn with theme tokens so it follows the toggle. */}
        <div aria-hidden="true" className="mx-auto w-full max-w-[28rem]">
          <svg viewBox="0 0 448 340" className="h-auto w-full" fill="none">
            <ellipse cx="224" cy="316" rx="150" ry="12" className="fill-[var(--color-border)] opacity-60" />
            <rect x="28" y="24" width="392" height="268" rx="20" className="fill-[var(--color-card)] stroke-[var(--color-border-medium)]" strokeWidth="2" />
            <path d="M28 64h392" className="stroke-[var(--color-border)]" strokeWidth="2" />
            <circle cx="56" cy="44" r="6" className="fill-[var(--accent)]" />
            <circle cx="76" cy="44" r="6" className="fill-[var(--color-border-medium)]" />
            <circle cx="96" cy="44" r="6" className="fill-[var(--color-border-medium)]" />
            <rect x="124" y="35" width="248" height="18" rx="9" className="fill-[var(--color-surface)]" />
            <text x="224" y="190" textAnchor="middle" style={{ fontFamily: 'var(--font-sans)' }} fontWeight="700" fontSize="112" letterSpacing="-4" className="fill-[var(--accent)]">
              404
            </text>
            <rect x="120" y="222" width="208" height="10" rx="5" className="fill-[var(--color-border)]" />
            <rect x="152" y="244" width="144" height="10" rx="5" className="fill-[var(--color-border)]" />
            <circle cx="372" cy="246" r="44" className="fill-[var(--color-card)] stroke-[var(--accent)]" strokeWidth="6" />
            <path d="M404 278l24 24" className="stroke-[var(--accent)]" strokeWidth="10" strokeLinecap="round" />
            <path d="M356 230l32 32M388 230l-32 32" className="stroke-[var(--accent)]" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <section className="mt-14 sm:mt-16" aria-labelledby="nf-where">
        <h2 id="nf-where" className="text-[13px] font-bold tracking-[0.1em] text-foreground-muted uppercase">
          Where would you like to go?
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((d) => {
            const Icon = d.icon;
            return (
              <li key={d.href}>
                <Link
                  href={d.href}
                  className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:p-5"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-bold text-foreground">{d.title}</span>
                    <span className="mt-0.5 block text-[14px] leading-snug text-foreground-muted">{d.meta}</span>
                  </span>
                  <ArrowRight
                    className="h-5 w-5 shrink-0 text-foreground-muted transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent-ink)]"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
