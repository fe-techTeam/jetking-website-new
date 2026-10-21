import type { ReactNode } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import '@/styles/admin.css';
import { adminLogout, getCurrentUser } from './actions';
import type { Role, Section } from '@/lib/auth/roles';
import { AdminSidebarNav } from './AdminSidebarNav';
import { AdminShell } from './AdminShell';
import { UserMenu } from './UserMenu';
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
// `roles` = only those built-in roles (admin-only screens); `section` = anyone whose role gives access to that section.
type NavItem = { href: Route; label: string; icon: string; group: string; roles?: Role[]; section?: Section; tag?: string };

/** Extra Website-group screens that are not record collections, placed after the website's collections. */
const WEBSITE_TOOLS: NavItem[] = [
  { href: '/admin/media' as Route, label: 'Media library', icon: 'Image', group: GROUP.website, section: 'media' },
  { href: '/admin/seo' as Route, label: 'SEO overview', icon: 'Search', group: GROUP.website, section: 'seo' },
  { href: '/admin/redirects' as Route, label: 'Redirects', icon: 'Link2', group: GROUP.website, section: 'redirects' },
];

const COLLECTION_NAV: NavItem[] = COLLECTIONS.map(
  (c): NavItem => ({
    href: `/admin/${c.route}` as Route,
    label: c.label,
    icon: c.icon,
    group: c.group,
    roles: c.roles,
    section: c.roles ? undefined : 'content',
    // Collections the website does not render say so in the sidebar, not only on their own page. The
    // Jetking Guide group's heading already says it, so only the others need a tag.
    tag: c.live || c.group === GROUP.guide ? undefined : 'Not live',
  }),
);
/** The assistant's own screens, listed at the top of the Chatbot group. */
const CHATBOT_TOOLS: NavItem[] = [
  { href: '/admin/chatbot' as Route, label: 'Chatbot overview', icon: 'Bot', group: GROUP.guide, section: 'chatbot' },
  { href: '/admin/chatbot-questions' as Route, label: 'Unanswered questions', icon: 'Inbox', group: GROUP.guide, section: 'chatbot' },
];

const lastWebsite = COLLECTION_NAV.map((i) => i.group).lastIndexOf(GROUP.website);
const firstGuide = COLLECTION_NAV.findIndex((i) => i.group === GROUP.guide);
const CONTENT_NAV: NavItem[] = [
  ...COLLECTION_NAV.slice(0, lastWebsite + 1),
  ...WEBSITE_TOOLS,
  ...COLLECTION_NAV.slice(lastWebsite + 1, firstGuide),
  ...CHATBOT_TOOLS,
  ...COLLECTION_NAV.slice(firstGuide),
];

const NAV: NavItem[] = [
  { href: '/admin' as Route, label: 'Dashboard', icon: 'LayoutGrid', group: 'Main' },
  { href: '/admin/website' as Route, label: 'Website map', icon: 'Globe', group: 'Main', section: 'content' },
  ...CONTENT_NAV,
  { href: '/admin/leads' as Route, label: 'Leads', icon: 'Users', group: 'CRM', section: 'leads' },
  { href: '/admin/team' as Route, label: 'Team & access', icon: 'KeyRound', group: 'Administration', roles: ['admin'] },
  { href: '/admin/audit' as Route, label: 'Audit log', icon: 'History', group: 'Administration', roles: ['admin'] },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const nav = user
    ? NAV.filter(
        (item) =>
          (!item.roles || (item.roles as readonly string[]).includes(user.role)) &&
          (!item.section || user.access[item.section] !== 'none'),
      ).map((item) => (item.section && user.access[item.section] === 'view' && !item.tag ? { ...item, tag: 'View only' } : item))
    : [];

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

      <div className="mt-auto pt-4">
        <UserMenu variant="sidebar" name={user.name} role={user.roleLabel} logoutAction={adminLogout} />
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
            user={{ name: user.name, role: user.roleLabel }}
            logoutAction={adminLogout}
            liveContent={(process.env.CONTENT_SOURCE ?? 'admin') === 'admin'}
          >
            <div id="admin-content" className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {(process.env.CONTENT_SOURCE ?? 'admin') !== 'admin' ? (
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
