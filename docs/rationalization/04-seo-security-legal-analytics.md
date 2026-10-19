# 04 - SEO, security, legal, analytics (checklist sections 11, 14, 15, 16)

Scope: public site and shared infrastructure. Admin internals are covered by `docs/ADMIN_AUDIT.md` and not repeated.
Method: grep/ls/read only. No servers started, nothing edited. `.env.local` was not read. Next 16.3.0 installed.

## Section 11 - SEO

| Item | Status | Evidence | Action |
|---|---|---|---|
| Unique title/description per page | Done | `buildMetadata()` in `src/lib/seo.ts:24` used by home, courses, centres, blog, faq, legal etc.; root template in `src/app/layout.tsx:28` | none |
| Routes WITHOUT metadata | Partial | Public: only `src/app/chatbot/page.tsx` (layout supplies noindex, fine). `/account` and `/enquiry` are noindex by design. All 25 other pages lacking metadata are `/admin/*` (noindex via admin layout) | none |
| Heading hierarchy | Partial | `verify-redirects.ts` asserts one H1 on indexable pages, but it needs a running server and is not in CI (no `.github/`) | run it in a gate |
| Canonical URLs | Done | `seo.ts:26,37` absolute self-referential canonical, `canonicalPath` override; blog duplicates handled in sitemap | none |
| sitemap.ts completeness | Done | `src/app/sitemap.ts`: static routes, all non-noindex courses, centres (`centrePath`), blog; excludes `/enquiry`, city URLs, noindex rows, editor `sitemapExclude`. Ghaziabad centre is fixture-driven (`locations.ts:7406`), so it appears automatically if published | none |
| `/sitemap` HTML page in sitemap | Done | `src/app/sitemap/page.tsx` | none |
| robots.ts blocks /admin and /api | Partial | Default disallow is `['/api/', ...extraDisallow]` (`robots.ts:35`); `extraDisallow` ships empty (`fixtures/seo-settings.ts:10`). `/admin` is NOT in robots.txt; it relies on `robots: {index:false}` in `(admin)/admin/layout.tsx:14` | add `/admin` to default disallow |
| Staging noindex | Done | `NEXT_PUBLIC_ALLOW_INDEXING=false` hard stop plus admin switch (`robots.ts:26`) | none |
| noindex for private/duplicate | Done | `/enquiry`, `/account`, `/chatbot`, `/explore`, `/design-kit`, `/courses/[slug]/design-2` | none |
| JSON-LD | Done | Organization+WebSite (layout), Course+CourseInstance, LocalBusiness+EducationalOrganization with geo (`centreSchema`), BlogPosting, FAQPage, BreadcrumbList; `JsonLd` escapes `<` (`ui.tsx:262`) | validate with Rich Results test once; Course schema lacks `offers`/price (deliberate) |
| OG images | Partial | Only `/og/course/[slug]` (`src/app/og/course/[slug]/route.tsx`); other pages use the site default image from `buildMetadata` | optional: OG for centres and blog |
| Redirects | Done | `redirects.json` = 3 entries (17 lines), `redirects.generated.json` = `[]`, `src/lib/legacy-routes.ts` = ~20 entries; DB-managed rules via `findRedirect` in `proxy.ts`. `next.config.ts` merges (later wins) | `redirects.generated.json` is unused, see findings |
| Redirect chains check | Partial | `scripts/verify-redirects.ts` (`npm run verify:seo`/`check:seo`) checks single-hop, canonical, sitemap; needs a running server and a legacy URL list; not wired to CI | wire to CI |
| llms.txt | Done | `src/app/llms.txt/route.ts` generated from content, force-static | none |
| hreflang | N/A | single locale `en-IN`, no alternates | none |
| Local SEO for centres | Done | per-centre page + LocalBusiness schema + geo + sitemap + llms.txt grouping | none |
| Broken internal links | Missing | no link checker script found (`scripts/` has only redirect verifier) | add a crawl-based link check to the SEO gate |

## Section 14 - Security and privacy

| Item | Status | Evidence | Action |
|---|---|---|---|
| HTTPS/HSTS | Done | `next.config.ts` `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`; cookies `secure` in production | confirm preload submission is intended |
| Security headers | Partial | Exist: X-Content-Type-Options, X-Frame-Options SAMEORIGIN, Referrer-Policy, Permissions-Policy (geolocation=self), HSTS. `poweredByHeader:false` | see CSP row |
| CSP | Missing | grep for `Content-Security-Policy` in `src/` and `next.config.ts`: no match | add report-only CSP, then enforce (needs nonce for inline theme/zoom-guard scripts and JSON-LD) |
| `dangerouslySetInnerHTML` (all 6) | Done | (1) `layout.tsx:85` static `themeScript`; (2) `layout.tsx:90` static `iosInputZoomGuardScript`; (3) `components/ui.tsx:266` JSON-LD, `<` escaped; (4) `blog/BlogArticle.tsx:159` wrapped in `sanitizeRichHtml(post.bodyHtml)` at render; (5) `kit/FaqList.tsx:48` raw `faq.answer`, but only after `isRichHtml` and sanitised on save plus `sanitizePublicRows` re-sanitising public reads (`cms/store.ts:252`, covers faqs, courses, centres); (6) `store.ts:252` is a comment, not a usage | FaqList is sanitised upstream only; wrap in `sanitizeRichHtml` at the sink too |
| CSRF on public POSTs | Partial | `/api/enquiry` and `/api/client-error` check `Sec-Fetch-Site`/Origin. `/api/chat` has 1 origin check; `/api/chatbot/auth`, `/api/journey/save`, `/api/persona/infer` have none; cookies are `SameSite=Lax` so browsers block cross-site cookie POSTs, but login/signup is unauthenticated | add shared same-origin guard helper |
| Secrets in client code | Done | NEXT_PUBLIC_ vars are non-secret (phone, WhatsApp, site flags, Supabase URL/anon key commented out). Service keys are server-only | none |
| .env committed | Done | `git ls-files | grep env` shows only `.env.example` and source files; `.env.local` untracked | none |
| Cookie flags | Partial | Admin and chat session: httpOnly, lax, secure in prod. `jk_visitor_id`, UTM, persona cookies intentionally `httpOnly:false` (client reads) | fine; gate them on consent (Section 15) |
| Rate limiting | Partial | `src/lib/rate-limit.ts` on enquiry (5/10min plus stricter no-signal), chat, auth, journey, persona, revalidate, client-error. `/api/locations` has none (read-only). Default memory store is per instance; production refuses to boot on memory unless `RATE_LIMIT_ALLOW_MEMORY` | set a shared store on multi-instance |
| Bot/spam protection | Partial | honeypot `hp` + min-time `ft` (`BotTrap.tsx`, enquiry route); no CAPTCHA/Turnstile; `hp`/`ft` are client-supplied (already in ADMIN_AUDIT) | add Turnstile/hCaptcha if spam appears |
| File uploads (public) | N/A | no public upload route; admin media upload audited | none |
| Error leakage | Done | routes return generic JSON; `error.tsx`/`global-error.tsx` show no stack | none |
| Dependency vulns | Missing | `npm audit --omit=dev`: 8 vulnerabilities, 2 critical (next 16.0.0-16.3.7, protobufjs), 6 high (nanoid, sharp, source-map-js and transitive chain via `@xenova/transformers`). Installed next is 16.3.0, inside the critical range | upgrade next to a patched 16.x; `npm audit fix`; review `@xenova/transformers` need |
| PII in logs | Missing | `api/enquiry/route.ts:180,188,212` log full enquiry (name, phone, email) via `JSON.stringify(enquiry)`; `api/journey/save/route.ts:71,88` same | log lead id only; keep payload in DB |
| Incident response doc | Missing | no incident/runbook doc in `docs/` (grep) | write one-page runbook |
| Dev auth defaults | Partial | `session.ts:24`, `chatbot/session.ts:24` dev secrets outside production (ADMIN_AUDIT open item) | fail closed unless NODE_ENV=development |

## Section 15 - Legal and compliance

| Item | Status | Evidence | Action |
|---|---|---|---|
| Privacy policy page | Partial | `/privacy-policy` renders CMS doc (`legal_documents`), fallback `src/lib/legal/privacy-policy.json` (13.7 KB, imported from the old jetking.com). Content is generic IT-Act text: no mention of DPDP Act 2023, retention, grievance officer, withdrawal/erasure rights, PostHog/GTM, OpenAI/chatbot processing (grep counts 0) | legal rewrite for DPDP |
| Terms and conditions | Done | `/terms-conditions`, 12.9 KB real content | review currency |
| Enrollment terms | Done | `/enrollment-terms-and-conditions`, 68 KB real content | none |
| Cookie consent banner | Missing | grep for consent/banner components finds none; only a checkbox in `CentreHeroForm.tsx:170` | build banner before enabling analytics |
| Analytics consent gating | Missing | no consent state anywhere; `jk_visitor_id` and UTM cookies set for all non-bot visitors in `proxy.ts:79,116` | gate non-essential cookies |
| Form disclosures | Partial | `QuickEnquiryForm.tsx:257` one-line note ("only to respond"), no link to privacy policy; centre hero form has consent checkbox "contacted about programmes" | link policy; add purpose text on all forms |
| Marketing consent | Partial | single bundled checkbox only on `CentreHeroForm`; other forms none; no separate WhatsApp/SMS opt-in | separate, unticked marketing consent stored with lead |
| Retention policy | Missing | none documented; leads kept in Postgres indefinitely | define retention and a delete job |
| Grievance/DPO contact | Missing | not in privacy JSON | add per DPDP |

## Section 16 - Analytics and monitoring

| Item | Status | Evidence | Action |
|---|---|---|---|
| GTM / PostHog loaded | Missing | `src/lib/analytics.ts` only pushes to `window.dataLayer` / `window.posthog`; grep for `googletagmanager`, `posthog-js`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_POSTHOG_*` finds them only in `.env.example`. No script loader exists, so no events are collected | decide stack; add consent-gated loader |
| Event taxonomy | Done | 38 `EventName`s, 59 `track()` call sites; enquiry_started/submitted at 7 sites each, phone/whatsapp clicks, course/centre/article views, scroll depth | none |
| Conversion tracking | Partial | `enquiry_submitted` emitted, but with no tag manager it goes nowhere; no GA4/Ads conversion config in repo | configure after loader |
| Error monitoring | Partial | vendor-free: `lib/error-report.ts` (JSON log + optional `ERROR_WEBHOOK_URL`, 5-min throttle), `/api/client-error`, `error.tsx`, `global-error.tsx`, `src/instrumentation-client.ts`. `ERROR_WEBHOOK_URL` is not in `.env.example` | document env var; consider Sentry |
| Uptime monitoring | Missing | no health route, no config | add `/api/health` + external monitor |
| Core Web Vitals | Missing | no `useReportWebVitals`, Vercel Speed Insights or web-vitals dependency | add RUM (Vercel Speed Insights or web-vitals to track()) |
| CI gating | Missing | no `.github/`; `check` and `check:seo` are manual | add CI |

## Rationalization findings

| Path | Finding | Proposed action | Effort | Risk |
|---|---|---|---|---|
| `src/lib/analytics.ts` | Whole event layer is dead at runtime (no loader), 59 call sites do nothing but build payloads | Add consent-gated GTM/PostHog loader or delete the vendor split | M | low |
| `src/app/student|parent|professional/page.tsx`, `explore/page.tsx` | `/student`, `/parent`, `/professional` are redirected to `/` in `next.config.ts` so the page files are unreachable | Delete pages or remove redirect | S | low |
| `redirects.generated.json` | `[]`, not read by `next.config.ts` | Delete or document | S | low |
| `redirects.json` vs `legacy-routes.ts` vs DB rules | Three redirect sources, merged in three places (`next.config.ts`, `proxy.ts` lookup) | Pick one source of truth (DB rules) and migrate the 20+3 static ones | M | medium (SEO) |
| `src/app/courses/[slug]/design-2`, `design-kit` | Dev prototypes shipped to prod (noindex) | Gate behind env or delete | S | low |
| `src/proxy.ts` CRAWLER_UA | Regex also matches `lighthouse`/`gtmetrix`; ok, but duplicates bot lists in `robots.ts` AI_CRAWLERS | Single shared list | S | low |
| Origin/CSRF checks | Duplicated inline in enquiry and client-error, absent elsewhere | Extract `assertSameOrigin()` into `src/lib/` and apply to all public POSTs | S | low |
| `src/lib/seo.ts` vs per-page `metadata` | Consistent (`buildMetadata`); `design-2` and `chatbot/layout` use raw `robots` | acceptable | - | - |
| Lead logging | PII dumped via `console.*` in enquiry and journey routes | Replace with id-only logs | S | low |

## Top 10 priorities

1. Upgrade `next` (critical advisory range 16.0.0-16.3.7; installed 16.3.0) and run `npm audit fix`; re-run audit.
2. Stop logging full enquiry/journey payloads (PII) in `api/enquiry` and `api/journey/save`.
3. Rewrite privacy policy for DPDP Act 2023 (purposes, retention, rights, grievance officer, processors: analytics, OpenAI, CRM).
4. Build a cookie/consent banner and gate `jk_visitor_id`, UTM and any analytics on it (`proxy.ts` sets them unconditionally).
5. Add marketing/WhatsApp consent checkbox and privacy-policy link to all enquiry forms; store consent with lead.
6. Add a Content-Security-Policy (report-only first) in `next.config.ts`.
7. Decide and wire analytics (GTM/PostHog loader, consent-gated); today no events are collected. Add CWV RUM.
8. Add `/admin` to default robots disallow (currently relies on meta noindex only).
9. Add CI running `check`, `verify:seo`, `npm audit`; add uptime/health endpoint and an incident runbook.
10. Shared same-origin guard for all public POSTs (auth, journey, persona/infer, chat) and a shared rate-limit store before multi-instance deploy.
