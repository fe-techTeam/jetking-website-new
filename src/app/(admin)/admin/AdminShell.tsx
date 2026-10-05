'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import { AdminTopbar } from './AdminTopbar';

/**
 * Owns the one piece of real interactive shell behavior this layout needs:
 * an off-canvas sidebar below the `lg` breakpoint. The sidebar markup itself
 * (nav, branding, sign-out form) stays server-rendered in layout.tsx and is
 * passed in as `sidebar` — this component only handles show/hide, so the
 * server keeps owning auth, the nav list, and the logout server action.
 */
export function AdminShell({
  sidebar,
  navItems,
  user,
  liveContent,
  children,
}: {
  sidebar: ReactNode;
  navItems: Array<{ href: Route; label: string; icon: string }>;
  user: { name: string; role: string };
  liveContent: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Closes the off-canvas sidebar after a nav link is followed — the layout
  // (and this component) persists across client-side route changes, so
  // without this the overlay would stay open on the new page. Adjusted here
  // during render rather than in a `useEffect`, per React's own guidance for
  // "reset state when a prop changes": an effect would commit the open shell
  // for one frame first, then a second render to close it.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="flex h-full">
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-[#090c15]/60 backdrop-blur-[2px] transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        className={`fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:h-full lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar items={navItems} user={user} liveContent={liveContent} onMenuClick={() => setOpen(true)} />
        {children}
      </div>
    </div>
  );
}
