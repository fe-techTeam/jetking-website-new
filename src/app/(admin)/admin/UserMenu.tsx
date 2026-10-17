'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { ChevronsUpDown, ExternalLink, LogOut, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * The signed-in person's menu — account, the live site and sign out in one place. `sidebar` is the full-width
 * chip at the bottom of the menu (opens upward); `topbar` is the round avatar at the top right (opens downward).
 */
export function UserMenu({
  variant,
  name,
  role,
  logoutAction,
}: {
  variant: 'sidebar' | 'topbar';
  name: string;
  role: string;
  logoutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const avatar = (
    <span
      aria-hidden="true"
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f97066] to-[#a50d13] text-sm font-bold text-white shadow-[0_6px_14px_-6px_rgb(199_20_28/0.9)]"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );

  const item = 'flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium text-foreground-secondary hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]';

  return (
    <div ref={box} className="relative">
      {variant === 'sidebar' ? (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="adm-sidebar-user flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-white"
        >
          {avatar}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{name}</span>
            <span className="block truncate text-xs text-white/60">{role}</span>
          </span>
          <ChevronsUpDown aria-hidden="true" className="h-4 w-4 shrink-0 text-white/60" />
        </button>
      ) : (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Account menu for ${name}`}
          onClick={() => setOpen(!open)}
          className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
        >
          {avatar}
        </button>
      )}

      {open ? (
        <div
          role="menu"
          className={`absolute z-40 w-60 rounded-[var(--admin-radius)] border border-border bg-background p-1.5 shadow-[var(--adm-shadow-lift)] ${
            variant === 'sidebar' ? 'bottom-full left-0 mb-2' : 'top-full right-0 mt-2'
          }`}
        >
          <div className="border-b border-border px-3 pt-1.5 pb-2.5">
            <p className="truncate text-sm font-bold text-foreground">{name}</p>
            <p className="truncate text-xs text-foreground-muted">{role}</p>
          </div>
          <div className="pt-1.5">
            <Link role="menuitem" href={'/admin/account' as Route} onClick={() => setOpen(false)} className={item}>
              <UserRound aria-hidden="true" className="h-4 w-4" />
              My account
            </Link>
            <a role="menuitem" href="/" target="_blank" rel="noopener noreferrer" className={item}>
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
              View site
            </a>
            <form action={logoutAction} className="mt-1 border-t border-border pt-1">
              <button role="menuitem" type="submit" className={`${item} text-[#b42318] hover:text-[#b42318]`}>
                <LogOut aria-hidden="true" className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
