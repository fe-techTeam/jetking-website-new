# Jetking Admin Panel

A CMS + CRM for staff: publish every editorial content type the public site reads, manage the
lead pipeline the chatbot and enquiry form feed into, and manage staff accounts with real roles
— all from `/admin`.

Built with Next.js 16 (App Router), React 19, TypeScript, Zod, and Tailwind CSS v4. Content
storage is dual-mode (local file store or Supabase); leads and staff accounts are plain
Postgres via Drizzle ORM, reached directly through `DATABASE_URL` — **`@supabase/supabase-js`
is never involved in that path**, even when the connection string happens to point at a
Supabase-hosted database.

Visually it follows the [TailAdmin reference](https://nextjs-demo.tailadmin.com/) for shell
proportions, control density, and component quality (sidebar, topbar, cards, tables, forms,
modals) — but keeps the public site's own brand: Jetking red as the accent, not TailAdmin's
blue, and the site's own Bricolage Grotesque / Plus Jakarta Sans type pairing, not TailAdmin's
Outfit. See [Design system](#design-system) below.

---

## Getting started

The panel works with **zero configuration** — no `DATABASE_URL`, no `ADMIN_PASSWORD` set —
using in-repo content fixtures and a single dev password (`changeme`):

```bash
npm install
npm run dev              # http://localhost:3000/admin
```

For real content persistence and real multi-user accounts, wire up Postgres:

```bash
# .env.local
DATABASE_URL=postgres://user:password@host:5432/dbname
ADMIN_SESSION_SECRET=$(openssl rand -hex 32)

npm run db:migrate                                              # create the tables
npm run create:admin -- --name "Your Name" --email you@example.com --password "..."
npm run dev                                                      # sign in with that account
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run db:generate` | Generate a Drizzle migration from `src/lib/db/schema.ts` after a schema change |
| `npm run db:migrate` | Apply pending migrations in `drizzle/migrations/` to `DATABASE_URL` |
| `npm run create:admin -- --name ... --email ... --password ...` | Bootstrap the first admin account (Team & Access itself needs one to sign in) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |

---

## Shell

```
┌─────────────┬──────────────────────────────────────────┐
│             │  Admin / <current page>            (topbar) │
│  Jetking    ├──────────────────────────────────────────┤
│  sidebar    │                                            │
│  (272px,    │           <page content>                  │
│  role-      │           (scrolls independently)          │
│  filtered)  │                                            │
│             │                                            │
│  [avatar]   │                                            │
│  Sign out   │                                            │
└─────────────┴──────────────────────────────────────────┘
```

The shell is a fixed-height viewport (`h-screen` + `overflow-hidden`) with exactly **one**
scrolling region — `<main>`. That's what keeps the sidebar and topbar in place while content
scrolls, rather than `position: sticky` fighting an ancestor's overflow. Below the `lg`
breakpoint the sidebar becomes an off-canvas panel (`AdminShell.tsx`) with a real toggle in the
topbar, a backdrop, and auto-close on navigation.

### Sidebar nav grouping

Nav items are grouped into five quiet section headings — **Main** (Dashboard), **Content**
(Courses, Centres, Posts, FAQs, Policies, Faculty), **Experience** (Homepage variants, Persona
rules), **CRM** (Leads), **Administration** (Team & access, Audit log) — matching the
`NAV` array's own order in `layout.tsx`, since `AdminSidebarNav.tsx` renders a heading whenever
an item's `group` differs from the item before it (both role-filtered, so a role that can't see
a whole group never renders that heading either). This is purely a rendering grouping on top of
the same role-gated list — **not** a second permission system: every item still only appears when
`!item.roles || item.roles.includes(user.role)`, exactly as before, and every corresponding page
and server action still independently calls `requireRole([...])` regardless of what the sidebar
shows.

Row treatment (`AdminSidebarNav.tsx`): 44px-tall rows, `--admin-radius` (8px) active pill,
`--accent-soft` background with `--accent` icon+text on the active route, muted gray icons
otherwise. Group headings are deliberately quieter than item text — small, uppercase,
`text-foreground-muted/70` — not `.label-mono` (used for page eyebrows elsewhere), whose
monospace tracking reads as more prominent than a section header should.

Key files:

| File | Role |
| --- | --- |
| `src/app/(admin)/admin/layout.tsx` | Resolves the current user, builds the (role-filtered) nav, composes the shell |
| `AdminShell.tsx` | Off-canvas sidebar mechanics (mobile) |
| `AdminSidebarNav.tsx` | Nav list, active-route highlighting |
| `AdminTopbar.tsx` | Breadcrumb-style page title, mobile menu button |
| `AdminConfirmDialog.tsx` | Shared destructive-action confirmation modal (Radix Dialog) — replaces `window.confirm()` everywhere |

---

## Authentication & roles

Two modes, chosen once per deployment by whether `DATABASE_URL` is set — **never mixed**:

- **Multi-user** (DB configured) — real accounts in `admin_users`, PBKDF2-SHA256 password
  hashing via Web Crypto (no bcrypt/argon2 dependency), a session cookie that carries a user id
  and is re-verified against the database on every request (so disabling someone or changing
  their role takes effect immediately, not at next login). The login page grows an email field
  automatically.
- **Legacy single-password** (no DB) — every visitor who knows `ADMIN_PASSWORD` is treated as a
  synthetic full-admin. No per-user accounts, no roles. This is what the panel falls back to
  with zero configuration.

### Login page

`/admin/login` — a light split card (`login/page.tsx` for the static brand/intro half,
`LoginForm.tsx` for the interactive half), not the dark full-bleed panel from earlier in this
project: a subtle gray page background, a white card, the real Jetking wordmark, and the brand
red reserved for the CTA and focus states rather than a whole panel.

`LoginForm.tsx` is built on React 19's `useActionState` rather than the old
`redirect('/admin/login?error=…')` pattern — `adminLogin` now returns `{ error: string | null }`
instead of redirecting on failure, so a wrong password re-renders the same page with an alert
above the form instead of a full navigation. That gets everything a modern login form is
expected to have "for free" from the hook: `pending` disables the submit button and swaps its
label to "Signing in…", and the form's own state (email/password values, which field is
touched) survives the failed attempt instead of clearing.

Beyond that: inline field-level validation (a red border + message under the exact field that's
wrong, not just a top-level error), autofocus on the first real field (email when DB-backed,
password otherwise — never a fixed field regardless of mode), show/hide password, correct
`autoComplete` values (`username` / `current-password`) so browser password managers behave,
and an explicit `onKeyDown` → `form.requestSubmit()` handler on both fields as a deliberate
belt-and-suspenders for Enter-to-submit (a 2+ field form's "implicit submission" is a native
browser default action that isn't something to take on faith across every environment).
No "Forgot password?" link — there is no self-service reset flow (see Known gaps), so a link
promising one would be a dead end.

All of this lives in `src/app/(admin)/admin/actions.ts` (`getCurrentUser`, `requireRole`,
`adminLogin`, `adminLogout`) and `src/lib/auth/` (`users.ts` — DB access, `password.ts` —
hashing, `roles.ts` — the plain `Role` type/constants, deliberately dependency-free so client
components can import it without pulling the Postgres driver into the browser bundle).

### Roles

| Role | Content (Courses, Centres, Posts, FAQs, Policies, Faculty, Homepage variants, Persona rules) | Leads | Team & Access | Audit log | Dashboard |
| --- | --- | --- | --- | --- | --- |
| **admin** | Full — create, edit, publish, delete | All leads | Invite, change role, disable, reset password, remove | Full history | Full, incl. "Reset from fixtures" |
| **editor** | Full — create, edit, publish, delete | All leads | No access (redirected to Dashboard) | No access | Full, incl. "Reset from fixtures" |
| **centre_staff** | No access (redirected to Dashboard) | **Own centre only** | No access | No access | Read-only stats; no "Reset from fixtures" |

`centre_staff` scoping resolves their `centreSlug` to its real city through the CMS `centres` /
`cities` collections, then does an exact, case-insensitive match against a lead's `city` field
(leads don't carry a centre id directly) — see `src/lib/leads/centre-scope.ts`
(`resolveCentreCity`, `cityMatches`) and `scopeCityFor()` in
`src/app/(admin)/admin/leads/actions.ts`. Inviting or re-scoping a `centre_staff` account
(`Team & Access`) validates the chosen centre against that same list, via a `<select>` rather
than free text, so a scope can't point at a typo'd or deleted centre.

Enforcement is server-side on every page and action via `requireRole([...])`, not just hidden
nav — a `centre_staff` account hitting `/admin/courses` directly by URL is redirected back to
`/admin`, same as clicking a nav item they can't see.

---

## Content (CMS)

Eight collections, each with the same shape: a record list + a generated form, no raw JSON
anywhere.

| Collection | Route | id field |
| --- | --- | --- |
| Courses | `/admin/courses` | `slug` |
| Centres | `/admin/centres` | `slug` |
| Posts (blog/news) | `/admin/posts` | `slug` |
| FAQs | `/admin/faqs` | `id` |
| Policies | `/admin/policies` | `slug` |
| Faculty | `/admin/faculty` | `slug` |
| Homepage variants | `/admin/variants` | `id` |
| Persona rules | `/admin/rules` | `id` |

### How the form is generated

`RecordEditor.tsx` renders a record's fields through `ValueEditor.tsx`, which recurses on the
**value's own shape** (not a JSON-schema library): a string becomes a text input or textarea
(by field-name heuristic or length), a number a number input, a boolean a checkbox, a string
array a chip list (`TagListEditor.tsx`), an array of objects a repeatable card list, and a
plain object just renders its own fields inline — **no wrapping box**, so a course's nested
`fees` / `seo` / `personaRelevance` read as flat labeled sections, not boxes-inside-boxes.

`src/lib/cms/admin-form-config.ts` supplies, per collection:

- `blank()` — a fully-populated empty record (every possible field present with an empty
  value), so a new record shows every field instead of requiring staff to know a hidden JSON
  key to add one.
- `itemTemplates` — the shape of one new item for a repeatable array-of-objects field (a course
  has no way to infer what a new "phase" looks like once that array is empty).
- `selectFields` — which string fields are actually a fixed set of choices (course `level`,
  post `kind`, FAQ `topic`, persona-rule `field`/`op`).
- `sections` — optional named field groups for the longer records (`courses`, `centres`,
  `posts` each have 4/4/3, e.g. "Basics" / "Curriculum & outcomes" / "Fees & audience" / "Media
  & SEO" for a course) so a 20+ field form reads as a few short forms instead of one long
  undifferentiated grid. Any field the config doesn't list still renders, under a trailing
  "More" section, so an incomplete config can't silently hide a field. Collections without
  `sections` (short enough not to need one) render as one flat list, unchanged.

The one field type with its own dedicated editor is `body` (posts, policies): an ordered array
of rich-text blocks — paragraph, heading, list, quote, image — handled by `BlocksEditor.tsx`
with add/remove/reorder, too structured for the generic recursive form to handle well.

### Long-form usability

`RecordEditor.tsx` also handles the things that matter once a record — or a collection — gets
large:

- **Unsaved-changes protection** — the draft is compared against a snapshot taken on load/save;
  switching records or starting a new one while dirty prompts an `AdminConfirmDialog` ("Discard
  unsaved changes?") instead of silently discarding edits.
- **A sticky bottom save bar** — mirrors the record list's own status ("Unsaved changes" / "All
  changes saved") plus a Save button, so a long form never puts Save more than one scroll away.
- **Record search** — collections with more than 8 records (e.g. 40 Centres) get a search box
  above the record list, filtering by id/slug substring.

### Storage

`src/lib/cms/store.ts` is dual-mode: the local file store (`data/cms/store.json`, gitignored,
reseeded from `src/lib/content/fixtures/` on first read) is always the read path; when Supabase
env vars are present, writes also go to Supabase tables. `CONTENT_SOURCE=admin` is what tells
the **public site** to actually read from this store instead of the repo fixtures directly — the
admin layout shows a banner when it isn't set, since saves still succeed locally but won't
affect the live site.

Saves don't refresh the chatbot's knowledge automatically — run `npm run build:chatbot-index`
after content changes.

---

## Leads (CRM)

Real Postgres tables (`leads`, `lead_activities`) via Drizzle — see
[`src/lib/db/schema.ts`](../src/lib/db/schema.ts). No file-store fallback: a lead is live
operational data, not editorial content that needs to keep working offline.

- **Board** (kanban: New → Contacted → Enrolled → Lost) and **List** views, toggled in place.
- **Search** (name/course/city) plus **status** and **source** filter chips apply to both views
  at once, with a "Showing X of Y" count. The status filter reads a `?status=` query param on
  load, so the Dashboard's "N new" leads badge can deep-link straight into a pre-filtered view.
- Click a lead to open its detail panel — contact info (phone/email render as `tel:` / `mailto:`
  links, not just text), a status `<select>`, a note field, and a timeline (`lead_activities`:
  chatbot handoff, calls, notes, status changes).
- "+ New lead" for manual entry (walk-ins, phone enquiries).
- Delete goes through `AdminConfirmDialog`, not `window.confirm()`.

`src/app/(admin)/admin/leads/actions.ts` and `page.tsx` apply the `centre_staff` scoping
described above uniformly to the list, the Dashboard's lead count, and every mutation.

---

## Team & Access

`/admin/team`, admin-only. Real account management, not a mockup:

- **Search** (name/email) plus role filter chips, matching the Leads toolbar pattern.
- **Invite** — name, email, temporary password, role, and (for `centre_staff`) a centre picked
  from a `<select>` of real CMS centres.
- **Change role / centre** inline via a `<select>` per row. Changing a **role** now prompts an
  `AdminConfirmDialog` ("Change role from X to Y?") before it takes effect — the one inline
  `<select>` in the panel that fires a real, hard-to-notice mutation on a single click, so it's
  the one that gets a confirm step. Re-scoping a `centre_staff` account's **centre** stays
  instant (low-risk, easily corrected).
- **Activate / disable** — disabling also prompts a confirm dialog (`AdminConfirmDialog`,
  brand-accent tone since it's a warning, not strictly destructive); re-activating stays instant,
  since it's the low-risk, immediately-reversible direction. A disabled account is rejected at
  both login and on its next `getCurrentUser()` check, so it's revoked mid-session, not just
  blocked from signing in again.
- **Reset password** — a small modal, admin-set.
- **Remove** — with a confirm dialog. An admin can't demote, disable, or remove their own
  account (`src/app/(admin)/admin/team/actions.ts`).

---

## Audit log

`/admin/audit`, admin-only. A read-only history of every mutating action taken in the panel:
CMS record saved or deleted, a fixtures reset, a lead created / had its status changed / got a
note / was deleted, and a team member invited / had their role or status changed / had their
password reset / was removed. Newest first, up to the last 200 entries.

Backed by a fourth Postgres table, `admin_audit_log` (`src/lib/db/schema.ts`), written by
`recordAudit()` in `src/lib/audit/log.ts` — called from each mutating server action after it
succeeds. It's deliberately best-effort: a failed audit write is logged to the server console
and never fails or rolls back the action it's describing. Like Leads and Team & Access, it
degrades gracefully (a plain "DATABASE_URL is not set" message) when no database is configured
— there's nowhere to durably keep history without one.

`actorName` is captured at write time rather than joined from `admin_users` at read time, so a
later-removed team member's history stays attributed and readable. The legacy single-password
path (`actor.id === 'local-admin'`) still records entries — just with a null `actorId`, since
there's no real user row to point at in that mode.

---

## Dashboard

`/admin` — reachable by every role (it's `requireRole`'s own "wrong role" redirect target, so
restricting it would create a redirect loop). Real numbers only:

- Icon-badge stat cards: total content, drafts awaiting review, leads (centre-scoped for
  `centre_staff`), centres.
- **Actionable, not just informative** — the Leads and Centres cards, and every "Content by
  type" bar row, are real links (hover reveals an arrow / row highlight) straight to the
  relevant editor page. The Leads card links to `/admin/leads?status=new` when there are new
  leads. Drafts links to the first collection that actually has one. A card only links
  somewhere when a single destination genuinely makes sense — "Total content" (an aggregate
  across 8 collections) stays a plain figure rather than a fabricated link.
- A hand-rolled SVG bar chart (content count per collection) and donut (published vs. draft
  share) — `DashboardWidgets.tsx`. No charting library: two static, non-interactive charts don't
  justify the dependency.
- Deliberately **no fabricated trend badges** (TailAdmin's own dashboard shows "+20% last
  month" pills; this app has no time-series data anywhere to back that up). A badge only
  appears where there's a real, current figure to show — "all clear" / "needs review" for
  drafts, "N new" for leads, "not configured" when `DATABASE_URL` is unset.
- "Reset CMS from fixtures" (admin/editor only) — replaces every content record with the
  in-repo fixture set; destructive, used for seeding a fresh environment.

---

## Design system

Everything below is scoped to the admin panel via the `.surface-default` class
(`src/styles/globals.css`) — it forces the light palette regardless of an ancestor `.dark` (a
visitor's site-wide dark-mode toggle shouldn't carry into the CMS), and re-points the accent to
Jetking red rather than the public site's default alias, without touching any public-site token.

| Token | Value | Used for |
| --- | --- | --- |
| `--accent` / `--accent-hover` / `--accent-active` | `jk-500` / `jk-600` / `jk-700` | Primary buttons, active nav, links, focus rings |
| `--color-growth-600` / `-50` | `#12B76A` / soft green | Success badges, "Published" |
| `--color-signal-600` / `-50` | `#F79009` / soft amber | Warning badges, "needs review" |
| `--color-error-600` / `-50` / `-200` | `#F04438` / soft red | Destructive actions, error banners |
| `--color-info-600` / `-50` | `#0BA5EC` / soft blue | Reserved for informational badges |
| `--admin-radius` | `8px` | Buttons, inputs, nav items (TailAdmin's control radius) |
| `--radius-card` | `1rem` (16px) | Cards (shared with the public site) |

Inputs (`.admin-input`, same globals.css layer) are **white/transparent with a hairline
border**, not gray-filled — a filled input reads as "boxed," which is exactly the nested-panel
clutter this was tuned to avoid after a dedicated pass to match the reference's flat, spacious
form pages (see the `ValueEditor.tsx` comment on why nested objects render with no wrapping box
at all).

Typeface: the site's own Bricolage Grotesque (display) / Plus Jakarta Sans (body) pairing —
deliberately **not** swapped for TailAdmin's Outfit, since Jetking already has an intentional,
documented type system (`design-system/MASTER.md`).

The one un-rethemed element is the Jetking wordmark itself (sidebar and login page alike) — it's
the brand, not a UI accent, so it stays full brand red regardless of the rest of the panel's
token overrides.

### Shared components

- **`AdminConfirmDialog.tsx`** — the one confirm-before-acting modal, used for every
  destructive-or-risky action panel-wide (delete, discard-unsaved-changes, disable, role
  change). Takes a `tone`: `'destructive'` (default — red, for delete/disable/discard) or
  `'default'` (brand accent, for a confirm step that isn't inherently harmful, like a role
  change that could just as easily be a promotion). The disabled-state opacity on its confirm
  button (`disabled:opacity-45`) matches the same value used on every other button in the panel
  — it was `opacity-50` here alone until this pass caught the mismatch.
- **`FilterChip.tsx`** — the pill-shaped filter toggle used by Leads' status/source filters and
  Team's role filter. Extracted because the active/inactive class string was hand-copied six
  times across two files; also the thing that gives every filter chip a real `aria-pressed`
  state, not just a visual one.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | For real persistence | Plain Postgres connection string — leads, staff accounts. Any Postgres works, including a Supabase project's own connection string (just not through their SDK). |
| `DATABASE_SSL` | No | Set to `false` for a local Postgres without TLS |
| `ADMIN_SESSION_SECRET` | With `DATABASE_URL` | Signs multi-user session cookies, independent of any one user's password |
| `ADMIN_PASSWORD` | Without `DATABASE_URL` | Legacy shared-password gate; defaults to `changeme` outside production |
| `CONTENT_SOURCE` | No | `admin` makes the **public site** read from this CMS store instead of repo fixtures |
| `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | No | Optional — CMS content write-through to Supabase tables (unrelated to the Postgres/leads/auth path above) |

See `.env.example` for the full annotated list.

---

## Accessibility

- **Skip links** — the root site layout already renders a "Skip to content" targeting the
  page's one `<main id="main">` landmark; on an admin page, that landmark wraps the *entire*
  admin shell (sidebar included), so it doesn't actually skip anything useful there. The admin
  layout adds a second, differently-worded **"Skip sidebar navigation"** link targeting a plain
  `<div id="admin-content">` — a `<div>`, not another `<main>`, since nesting a second `<main>`
  landmark inside the root's would itself be invalid.
- **Keyboard focus** is never suppressed without a replacement — `:focus-visible` has a
  panel-wide fallback outline (`src/styles/globals.css`), and `.admin-input` replaces it with an
  explicit border + ring rather than just turning it off.
- **Filter chips** (`FilterChip.tsx`) carry `aria-pressed`, so a status/source/role filter reads
  as a real toggle button to a screen reader, not just a differently-colored `<button>`.
- **Decorative chart SVGs** (`DonutChartCard`'s ring) are `aria-hidden="true"` — the adjacent
  legend already states the same values as text, so the raw SVG would otherwise be announced as
  meaningless path/circle noise.
- **Heading hierarchy** — Dashboard's chart card titles are `<h2>` (siblings of nothing between
  them and the page `<h1>`), not `<h3>`, which would skip a level.
- Not yet done: a full automated audit (axe/Lighthouse) and a screen-reader pass end to end —
  what's here is a targeted pass on the gaps found, not an exhaustive certification.

---

## Known gaps

- No self-service password change or "forgot password" flow — password resets are admin-only,
  by design, for a small internal staff tool.
- Audit log has no filtering/search UI yet — it's a plain, newest-first read-only list for now.
