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
  Image as ImageIcon,
  Settings,
  Link2,
  Landmark,
  Megaphone,
  MessageSquareQuote,
  Boxes,
  Inbox,
  Search,
  Bot,
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
  Image: ImageIcon,
  Settings,
  Link2,
  Landmark,
  Megaphone,
  MessageSquareQuote,
  Boxes,
  Inbox,
  Search,
  Bot,
};

type NavEntry = { href: Route; label: string; icon: string; group?: string; tag?: string };

/** Consecutive items sharing a group become one group (the list is already ordered the way the menu reads). */
function groupsOf(items: NavEntry[]): Array<{ group: string; entries: NavEntry[] }> {
  const out: Array<{ group: string; entries: NavEntry[] }> = [];
  for (const item of items) {
    const group = item.group ?? '';
    const last = out[out.length - 1];
    if (last && last.group === group) last.entries.push(item);
    else out.push({ group, entries: [item] });
  }
  return out;
}

export function AdminSidebarNav({
  items,
}: {
  items: Array<{ href: Route; label: string; icon: string; group?: string; tag?: string }>;
}) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLElement>(null);
  const [more, setMore] = useState({ above: false, below: false });
  const [filter, setFilter] = useState('');
  /** Menu groups the editor has folded away. Remembered per browser; a group holding the current page opens itself. */
  const [folded, setFolded] = useState<string[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('jk-admin-nav-folded') ?? '[]') as unknown;
      if (Array.isArray(saved)) setFolded(saved.filter((g): g is string => typeof g === 'string')); // eslint-disable-line react-hooks/set-state-in-effect
    } catch {
      /* storage blocked */
    }
  }, []);
  function toggleGroup(group: string) {
    setFolded((prev) => {
      const next = prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group];
      try {
        localStorage.setItem('jk-admin-nav-folded', JSON.stringify(next));
      } catch {
        /* storage blocked */
      }
      return next;
    });
  }
  const f = filter.trim().toLowerCase();
  const visible = f ? items.filter((i) => i.label.toLowerCase().includes(f)) : items;

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
  }, [items.length, visible.length, folded]);

  return (
    <div className="relative mt-4 flex min-h-0 flex-1 flex-col">
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Jump to…"
        aria-label="Filter the menu"
        className="mb-2 h-10 w-full shrink-0 rounded-[10px] border border-white/10 bg-white/[0.06] px-3 text-sm text-white placeholder:text-white/45 focus:border-white/30 focus:outline-none"
      />
      <nav
        ref={scrollRef}
        aria-label="Admin sections"
        className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visible.length === 0 ? <p className="px-3 py-4 text-sm text-white/55">Nothing matches.</p> : null}
        {groupsOf(visible).map(({ group, entries }) => {
          const holdsCurrent = entries.some((item) => (item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href)));
          // While filtering, or when the group holds the page you are on, it stays open.
          const open = Boolean(f) || holdsCurrent || !folded.includes(group);
          return (
            <Fragment key={group}>
              {group ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group)}
                  aria-expanded={open}
                  className="adm-sidebar-group flex w-full cursor-pointer items-center justify-between text-left first:pt-2 hover:text-white/80"
                >
                  <span>{group}</span>
                  <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} strokeWidth={2.5} />
                </button>
              ) : null}
              {open
                ? entries.map((item) => {
                    const Icon = ICONS[item.icon] ?? LayoutGrid;
                    const active = item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className="adm-nav-link">
                        <span className="adm-nav-icon">
                          <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {/* Collections the website doesn't render say so here, not only on their own page. */}
                        {item.tag ? (
                          <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">{item.tag}</span>
                        ) : null}
                      </Link>
                    );
                  })
                : null}
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
