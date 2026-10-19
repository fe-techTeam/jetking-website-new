# Admin panel audit: features, security, quality, tests

Scope: every server-side feature of `/admin` (auth, CMS content, leads, team, redirects, chatbot console, media, SEO, API routes). Four parallel reviews, then a combined check run. UI-only components were not audited line by line; the logic behind them was.

## Result

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `eslint src tests` | 0 errors (3 pre-existing warnings) |
| Unit tests (no database needed) | 17 new files, 280+ tests, all pass |
| Tests that need Postgres | 4 files fail with `ECONNREFUSED` here (database not running); not caused by these changes |

## Features reviewed and verdicts

| Area | Feature | Verdict |
|---|---|---|
| Auth | Session cookie and signing, expiry, role re-read per request | OK |
| Auth | `adminLogin` | Fixed (timing revealed which emails exist) |
| Auth | `requireRole`, logout, legacy password mode | OK (production refuses unset secrets) |
| Team | invite, change role, disable, remove, reset password, own password | Fixed (non-UUID and unknown ids; false audit entries) |
| Audit log | write and list | OK (server-only writes) |
| CMS | `saveCollectionItem`, `removeCollectionItem`, `setRecordStatus` | Fixed (client-supplied id field, id/payload validation, unsafe URLs, prototype keys) |
| CMS | `seedCmsFromFixtures` (reset) | Fixed (admin only; now also resets centres and cities tables) |
| CMS | Publish filtering, rename, duplicates, revisions | OK |
| CMS | Rich text sanitiser, public FAQ rendering, legal markdown links | Fixed (re-sanitised on public read; `javascript:` links blocked) |
| CMS | Media upload and serving, SEO settings | OK |
| Centres/cities | Postgres rows | Fixed (first edit no longer shrinks the directory to one row) |
| Leads | list, summary, create, status, notes, assign, delete | Fixed (centre staff with no centre saw every lead; city pinning; id validation) |
| Leads | import, export, public enquiry intake | Hardened (row and field caps; formula-injection escaping verified) |
| Redirects | save, remove, import, matching | Fixed (open redirect via `/\host`, multi-hop loops, size limits) |
| Chatbot console | transcripts, test question, knowledge, settings | Fixed (Host-header URL); otherwise OK |
| API | `/api/revalidate`, `/api/client-error` | Fixed (throttle before secret check; body size cap) |

## Open items (decisions for the product owner)

High value:
- **Memory rate limiting is per instance** (a shared store such as Redis is the fix on multi-instance hosts).
- **Dev defaults outside `NODE_ENV=production`.** The password `changeme` and the dev session secret apply on any non-production deploy (for example staging) that sets neither.
- **External redirects are allowed by design.** Any admin or editor can send visitors to any `https://` host. Consider an allow-list or an admin-only restriction.

Medium:
- Password minimums differ (8 for invite/reset, 10 for self-change); no maximum length.
- `/api/enquiry` has no body-size cap and logs the full payload on a store failure.
- `ft` and `hp` fields in the enquiry form are client-supplied, so a script can forge them.
- Lead de-duplication differs between import (phone digits, all leads) and intake (exact phone and form within 15 minutes); email is never de-duplicated. Centre staff can delete leads and assign them to any name.
- `removeCollectionItem` still allows deleting singleton records (legal documents, about page); only the UI hides it.
- `src/proxy.ts` runs `new URL(rule.destination)` without a try/catch; `redirects.source` uniqueness is on the raw value.
- Editors can trigger a knowledge rebuild, which spawns a build process (fixed command, resource risk only).
- `saveCollectionItem` saves the original record, so unknown extra keys pass through (unsafe URLs and keys are blocked).
- `inviteUser` can return a raw database error if the email insert races.

Rationalization candidates (not done, to avoid churn):
- List/upsert/delete logic is repeated in `store.ts`, `records-db.ts` and `locations-db.ts`.
- Lead status and source vocabularies are duplicated in `schema.ts`, `store.ts` and `transfer.ts`; `transfer.ts` is really the import/export helper module.
- Not reviewed: `website`, `search` pages and the dashboard widgets' data access.

## Tests added

`tests/admin-auth-*` (66), `admin-cms-*` (113, including the new locations-db helpers), `admin-leads-*` (53), `admin-ops-*` (46). They mock the database and `next/*`, so they run anywhere with `npm test`.

## Follow-up fixes (second pass)

- **Rate-limit key no longer spoofable.** `src/lib/client-ip.ts` takes the client IP from the entry the trusted proxy appended (`TRUSTED_PROXY_HOPS`, default 1; `x-vercel-forwarded-for` on Vercel; 0 = ignore the header). All limiters (login and every API route) use it.
- **Sessions can be revoked.** `admin_users.session_version` (migration `0010_session_version.sql`) is signed into the cookie and re-checked on every request. Sign-out, password change and admin password reset bump it, so a copied cookie stops working; the browser that changed its own password is re-issued a fresh cookie. **Run `npm run db:migrate`; everyone is signed out once because the cookie format changed.**
- **Audit trail covers sign-ins.** `auth.login`, `auth.login_failed` (with the reason: unknown email, wrong password, disabled account) and `auth.logout` are recorded and filterable under "Sign-ins" in the audit log. Failed attempts by non-accounts are stored by the typed email with no actor id; passwords are never logged.
