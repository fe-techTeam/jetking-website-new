'use client';

import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { ExternalLink, Menu } from 'lucide-react';

export function AdminTopbar({
  items,
  user,
  liveContent,
  onMenuClick,
}: {
  items: Array<{ href: Route; label: string; icon: string }>;
  user: { name: string; role: string };
  /** `CONTENT_SOURCE=admin` — whether saves here are what the public site actually reads. */
  liveContent: boolean;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const current =
    items.find((item) => (item.href === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.href)))
      ?.label ?? 'Dashboard';

  return (
    <header className="adm-topbar sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 px-4 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-[12px] border border-border text-foreground-secondary transition-colors hover:border-border-medium hover:bg-surface hover:text-foreground lg:hidden"
      >
        <Menu aria-hidden="true" className="h-5 w-5" />
      </button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
        <span className="hidden text-foreground-muted sm:inline">Admin</span>
        <span aria-hidden="true" className="hidden text-border-medium sm:inline">
          /
        </span>
        <span aria-current="page" className="truncate font-semibold text-foreground">
          {current}
        </span>
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <span
          title={
            liveContent
              ? 'Saves here are what the public site reads.'
              : 'The public site reads repo fixtures, so saves here will not go live.'
          }
          className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold sm:inline-flex ${
            liveContent
              ? 'border-[var(--color-growth-600)]/25 bg-[var(--color-growth-50)] text-[#067647]'
              : 'border-[var(--color-signal-600)]/30 bg-[var(--color-signal-50)] text-[#b54708]'
          }`}
        >
          <span aria-hidden="true" className="adm-dot" />
          {liveContent ? 'Content is live' : 'Fixtures mode'}
        </span>

        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="adm-btn-ghost inline-flex min-h-11 items-center gap-2 rounded-[12px] px-3.5 text-sm font-semibold sm:min-h-10"
        >
          <span className="hidden sm:inline">View site</span>
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only sm:hidden">View site</span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>

        <span
          aria-hidden="true"
          title={`${user.name} · ${user.role}`}
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f97066] to-[#a50d13] text-sm font-bold text-white shadow-[0_6px_14px_-6px_rgb(199_20_28/0.8)] md:grid"
        >
          {user.name.slice(0, 1).toUpperCase()}
        </span>
      </div>
    </header>
  );
}
