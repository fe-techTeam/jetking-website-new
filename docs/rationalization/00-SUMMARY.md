# Codebase rationalization: summary and roadmap

Five read-only audits against the 21-section website checklist. Detail and per-item status tables are in the numbered files in this folder; this page is the decision layer.

| File | Checklist sections |
|---|---|
| [01-strategy-ia-pages-content-brand](01-strategy-ia-pages-content-brand.md) | 1, 2, 4, 5, 6 |
| [02-frontend-ux-perf-a11y](02-frontend-ux-perf-a11y.md) | 3, 7, 12, 13 |
| [03-backend-data-integrations](03-backend-data-integrations.md) | 8, 9, 10 |
| [04-seo-security-legal-analytics](04-seo-security-legal-analytics.md) | 11, 14, 15, 16 |
| [05-qa-deploy-launch-maintenance-docs](05-qa-deploy-launch-maintenance-docs.md) | 17 to 21 |

Admin-panel security and tests were covered separately in `docs/ADMIN_AUDIT.md`.

Verified directly while consolidating: there is no `.github` folder (no CI); `.playwright-mcp` is not in `.gitignore`; `next` is 16.3.0; "Lorem ipsum" is present in `data/cms/store.json` and `src/lib/content/fixtures/locations.ts`; `src/lib/analytics.ts` is the only analytics code and nothing loads GTM or PostHog. The other findings are the audit agents' own, each checked by them with grep/ls; the `next build` failure was not re-run.

## What is in good shape

Accessibility basics (skip link, focus ring, reduced motion, carousel pause, form labels); SEO fundamentals (metadata on every page, canonicals, sitemap, `llms.txt`, structured data, noindex on private pages); all 6 `dangerouslySetInnerHTML` uses safe or sanitised; no committed secrets; production refuses dev-default secrets; type check clean, 0 lint errors; all npm dependencies are used.

## Priority 1: fix before launch (security, legal, correctness)

1. **Production build fails when the database is down.** `next build` stops at page-data collection because a page-copy read throws instead of falling back to the file store. Make every public read degrade (the centres and records layers already do).
2. **Vulnerable framework.** `next` 16.3.0 is in a critical advisory range; `npm audit --omit=dev` reports 8 issues (2 critical, 6 high). Upgrade and re-test.
3. **No Content Security Policy** and uneven same-origin checks on public POST routes.
4. **Lead PII in logs.** The enquiry and journey routes log full name, phone and email on failure. Log ids only; add a retention and deletion policy and a backup/restore procedure for leads.
5. **Consent and privacy.** No cookie banner while `src/proxy.ts` sets visitor and UTM cookies for everyone; privacy policy is generic IT Act text (no DPDP Act duties, retention, grievance contact). Needs legal review, not only code.
6. **Placeholder content live.** Lorem ipsum in the Mohali centre FAQs (store, fixtures, chatbot corpus), visible "To be updated" tiles, WhatsApp fallback number `919999999999`.
7. **`robots.txt` does not disallow `/admin`** (only meta noindex) and 5 live URLs still 404 per `docs/SEO_ROUTING_AUDIT.md`.

## Priority 2: make it real (features that exist on paper)

8. **Analytics collects nothing.** 59 `track()` calls but no GTM or PostHog loader. Add a consent-gated loader and define KPIs (none are documented).
9. **No CI and no end-to-end tests.** Add a workflow running typecheck, lint, tests and `verify:seo`; add browser tests for enquiry, centres directory, course pages and search. Give Postgres-dependent tests a service container so they run.
10. **No error/uptime/Core Web Vitals monitoring, no notifications.** No email/SMS service; a failed CRM post is never retried.
11. **Missing pages:** cookie policy, accessibility statement, thank-you URL, careers. No `loading.tsx` anywhere.
12. **Env docs wrong.** `.env.example` lists `SITE_URL` but canonicals read `NEXT_PUBLIC_SITE_URL`; 8 used variables undocumented, 4 documented but unused. README and `docs/HANDOVER.md` are stale (11 claims listed in file 05).

## Priority 3: rationalize (remove duplication and dead weight)

| Area | Action | Effort | Risk |
|---|---|---|---|
| Dead persona pages | `/student`, `/parent`, `/professional` redirect to `/` but ship ~3k lines of components and ~500 lines of CSS on every page. Extract the parent/professional copy that `about-us` and `courses` still import, then delete. | M | Medium |
| Prototypes in production | Remove or gate `courses/[slug]/design-2` (943 + 551 line templates) and `/design-kit`. | S | Low |
| Redirect sources | Four overlapping sources; `redirects.generated.json` is empty, `redirect-gaps.json` stale. Keep one source of truth. | M | Medium (SEO) |
| Supabase | Looks dead: legacy write branch in `store.ts`, a second unanswered-question sink, and an unused SQL migration that conflicts with the Drizzle tables. Confirm, then remove. | M | Medium |
| CMS storage | Four paths (`store.json`, `cms_records`, `cities`/`centres`, Supabase) and list/upsert/delete repeated three times. Converge on Postgres with the file store as read-only fallback. | L | Medium |
| Components | Orphans `StatsStrip`, `CounsellorBand`, `VideoStories`; 6+ near-identical testimonial sliders; overlapping rail/slider/marquee; three UI primitive layers. | M | Low |
| Assets and data | 24 unreferenced files and byte-identical duplicate images in `public/`; dead `data/blog-scraped.json`, `data/blog-paths-live.json`, tracked `data/chatbot-build.log`, multi-MB generated JSON. | S | Low |
| Repo hygiene | Add `.playwright-mcp` to `.gitignore`; add `.gitattributes` (579 files have CRLF in the working tree); fix the `sync:content` doc reference (script is `sync:chatbot-content`). | S | Low |
| Brand docs | `design-system/MASTER.md` says light mode only; dark canvas ships. | S | Low |

## Suggested order

1. Items 1 to 4 (build resilience, framework upgrade, CSP, PII logging): small, high-impact, mostly code.
2. Items 6 and 7 plus the quick Priority 3 hygiene rows: content and config clean-up.
3. Items 5, 8 and 9 together (consent, analytics, CI); item 5 needs legal input.
4. The dead-persona-page removal, then redirect and CMS storage consolidation as separate, individually reviewed changes.

Nothing in this folder changed source code. Each Priority 3 action is a separate change with its own risk; none was applied.
