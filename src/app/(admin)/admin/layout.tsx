import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import '@/styles/admin.css';
import { adminLogout, getCurrentUser } from './actions';
import { ROLE_LABEL, type Role } from '@/lib/auth/users';
import { AdminSidebarNav } from './AdminSidebarNav';
import { AdminShell } from './AdminShell';
import { COLLECTIONS, GROUP } from './registry';

export const metadata = {
  title: 'Jetking Admin',
  robots: { index: false, follow: false },
};

/**
 * Admin chrome, modernized after the TailAdmin reference (nextjs-demo.
 * tailadmin.com) — shell proportions, control density, card/table/form
 * quality — but NOT its palette or typeface: the accent stays Jetking red
 * and the type stays the site's own Bricolage/Jakarta pairing (see the
 * comment on `.surface-default` in globals.css for the full rationale).
 *
 * Deliberately still the *light* surface, forced via `.surface-default` so a
 * visitor's site-wide dark-mode toggle can't carry into the CMS.
 *
 * The shell is a fixed-height viewport (`h-screen` + `overflow-hidden`) with
 * exactly one scrolling region — `<main>`. That's what keeps the sidebar and
 * topbar in place while content scrolls, rather than `position: sticky`
 * fighting an ancestor's overflow.
 */

// Grouped to follow the website: Main, then the content that appears on the site, personalisation,
// the Jetking Guide's own knowledge base, CRM and administration. `AdminSidebarNav` renders a group
// heading whenever `group` changes between consecutive (role-filtered) items, so this array's order
// IS the sidebar's visual order. The content entries come from `registry.ts` so the sidebar can't
// drift from the collection pages or the Website map.
type NavItem = { href: Route; label: string; icon: string; group: string; roles?: Role[]; tag?: string };

const NAV: NavItem[] = [
  { href: '/admin' as Route, label: 'Dashboard', icon: 'LayoutGrid', group: 'Main' },
  { href: '/admin/website' as Route, label: 'Website map', icon: 'Globe', group: 'Main', roles: ['admin', 'editor'] },
  ...COLLECTIONS.map(
    (c): NavItem => ({
      href: `/admin/${c.route}` as Route,
      label: c.label,
      icon: c.icon,
      group: c.group,
      roles: c.roles ?? ['admin', 'editor'],
      // Collections the website does not render say so in the sidebar, not only on their own page. The
      // Jetking Guide group's heading already says it, so only the others need a tag.
      tag: c.live || c.group === GROUP.guide ? undefined : 'Not live',
    }),
  ),
  { href: '/admin/leads' as Route, label: 'Leads', icon: 'Users', group: 'CRM' },
  { href: '/admin/team' as Route, label: 'Team & access', icon: 'KeyRound', group: 'Administration', roles: ['admin'] },
  { href: '/admin/audit' as Route, label: 'Audit log', icon: 'History', group: 'Administration', roles: ['admin'] },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const nav = user ? NAV.filter((item) => !item.roles || item.roles.includes(user.role)) : [];

  const sidebar = user ? (
    <aside className="adm-sidebar flex h-full w-[272px] shrink-0 flex-col p-4">
      <Link href={'/admin' as Route} className="adm-sidebar-brand rounded-[14px] focus-visible:outline-2 focus-visible:outline-white">
        <span className="adm-sidebar-mark">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand asset; sized by caller */}
          <img
            src="/brand/jetking-wordmark.png"
            alt="Jetking"
            draggable={false}
            className="h-5 w-auto shrink-0 select-none object-contain"
          />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[15px] font-bold tracking-tight text-white">Admin Console</span>
          <span className="block text-xs font-medium text-white/60">Content &amp; operations</span>
        </span>
      </Link>

      <AdminSidebarNav items={nav} />

      {/* Identity and sign-out are deliberately two visually distinct blocks
         — the account summary isn't the same kind of thing as the sign-out action. */}
      <div className="mt-auto pt-4">
        <div className="adm-sidebar-user flex items-center gap-3 p-3">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f97066] to-[#a50d13] text-sm font-bold text-white shadow-[0_6px_14px_-6px_rgb(199_20_28/0.9)]"
          >
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
            <span className="block truncate text-xs text-white/60">{ROLE_LABEL[user.role]}</span>
          </span>
        </div>

        <form action={adminLogout} className="mt-3">
          <button
            type="submit"
            className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-[12px] border border-white/15 px-4 text-sm font-semibold text-white/85 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  ) : null;

  return (
    <div className="surface-default adm h-screen overflow-hidden bg-surface text-foreground">
      {user && sidebar ? (
        <>
          {/* The root layout (src/app/layout.tsx) already renders its own
             "Skip to content" targeting `<main id="main">`, which wraps this
             entire admin shell — so on an admin page that skip link lands
             right before the sidebar, not past it. This second, differently
             worded link is what actually skips the ~13-link sidebar nav.
             Its target is a plain `<div>`, not `<main>`: the root's `<main
             id="main">` is already the page's one landmark, and nesting a
             second `<main>` inside it would be an invalid nested landmark. */}
          <a
            href="#admin-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-[var(--admin-radius)] focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip sidebar navigation
          </a>
          <AdminShell
            sidebar={sidebar}
            navItems={nav}
            user={{ name: user.name, role: ROLE_LABEL[user.role] }}
            liveContent={process.env.CONTENT_SOURCE === 'admin'}
          >
            <div id="admin-content" className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {process.env.CONTENT_SOURCE !== 'admin' ? (
                <div
                  role="alert"
                  className="mb-6 rounded-[var(--admin-radius)] border border-[var(--color-signal-600)]/25 bg-[var(--color-signal-50)] px-4 py-3 text-sm font-medium text-[var(--color-signal-600)]"
                >
                  Changes here do not affect the live site. The deployed site is reading content from
                  repo fixtures (<code>CONTENT_SOURCE={process.env.CONTENT_SOURCE ?? 'local'}</code>
                  ), not this CMS store — saves below will succeed but won&apos;t go live until
                  CONTENT_SOURCE is set to <code>admin</code> and the site is redeployed.
                </div>
              ) : null}
              {children}
            </div>
          </AdminShell>
        </>
      ) : (
        <div className="h-full overflow-y-auto">{children}</div>
      )}
    </div>
  );
}
