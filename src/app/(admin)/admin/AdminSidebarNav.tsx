'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import {
  LayoutGrid,
  Users,
  GraduationCap,
  Building2,
  Newspaper,
  HelpCircle,
  ShieldCheck,
  UserCog,
  LayoutTemplate,
  SlidersHorizontal,
  KeyRound,
  History,
  Globe,
  MapPin,
  BadgeCheck,
  Trophy,
  Info,
  Award,
  Scale,
  Type,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

// Icons are looked up by name here rather than passed in as props: a Server
// Component can't hand a Client Component a component reference (same
// "functions can't cross the RSC boundary" rule that applies to any function).
const ICONS: Record<string, LucideIcon> = {
  LayoutGrid,
  Users,
  GraduationCap,
  Building2,
  Newspaper,
  HelpCircle,
  ShieldCheck,
  UserCog,
  LayoutTemplate,
  SlidersHorizontal,
  KeyRound,
  History,
  Globe,
  MapPin,
  BadgeCheck,
  Trophy,
  Info,
  Award,
  Scale,
  Type,
};

export function AdminSidebarNav({
  items,
}: {
  items: Array<{ href: Route; label: string; icon: string; group?: string; tag?: string }>;
}) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLElement>(null);
  const [more, setMore] = useState({ above: false, below: false });

  // The list scrolls inside the sidebar on short screens (the phone drawer, small laptops). With
  // the scrollbar hidden there was no sign that more links sat below the fold, so a fade + chevron
  // appears on whichever edge still has content. Measured from observers/scroll events — never
  // synchronously in the effect — so it also follows the viewport resizing or the role-filtered
  // list changing length.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () =>
      setMore({
        above: el.scrollTop > 4,
        below: el.scrollHeight - el.scrollTop - el.clientHeight > 4,
      });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [items.length]);

  return (
    <div className="relative mt-4 flex min-h-0 flex-1 flex-col">
      <nav
        ref={scrollRef}
        aria-label="Admin sections"
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => {
          const showGroupHeading = Boolean(item.group) && item.group !== items[index - 1]?.group;
          const Icon = ICONS[item.icon] ?? LayoutGrid;
          const active = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href);

          return (
            <Fragment key={item.href}>
              {showGroupHeading ? <p className="adm-sidebar-group first:pt-2">{item.group}</p> : null}
              <Link href={item.href} aria-current={active ? 'page' : undefined} className="adm-nav-link">
                <span className="adm-nav-icon">
                  <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {/* Collections the website doesn't render say so here, not only on their own page. */}
                {item.tag ? (
                  <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">
                    {item.tag}
                  </span>
                ) : null}
              </Link>
            </Fragment>
          );
        })}
      </nav>

      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-[#0d1220] to-transparent transition-opacity duration-200 ${
          more.above ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/80 to-transparent pb-1 transition-opacity duration-200 ${
          more.below ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <ChevronDown className="h-4 w-4 animate-bounce text-white/70 motion-reduce:animate-none" strokeWidth={2.5} />
      </div>
    </div>
  );
}
