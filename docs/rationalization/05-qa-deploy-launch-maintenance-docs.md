# Rationalization 05: QA, hosting, launch readiness, maintenance, documentation (checklist sections 17-21)

Audit date 2026-10-19, branch `backend-admin-cms`. Read-only except this file. Every figure below came from a command run in this session. Secrets in `.env.local` were not printed.

Status key: Done / Partial / Missing / N/A.

## Command results (evidence base)

| Command | Result |
|---|---|
| `npx tsc --noEmit` | Clean, no output |
| `npx eslint src tests` | 0 errors, 3 warnings (`src/features/jetking-ai/jetking-ai-client.tsx` lines 1005 and 1143: `react-hooks/exhaustive-deps`; `src/lib/utm.ts:33` unused eslint-disable) |
| `npx vitest run` | 39 files: 35 pass, 4 fail. 529 tests: 519 pass, 10 fail. All 10 failures are `ECONNREFUSED 127.0.0.1:5433` / `::1:5433` (Postgres). Failing files: `tests/cms-integration.test.ts` (4 of 4), `tests/enquiry-route.test.ts` (2 of 4), `tests/leads-intake.test.ts` (3 of 3), `tests/media-redirects.test.ts` (1 of 3). No other failures. Matches the expected 4 files. |
| `npx next build` | FAILED after 6m59s (exit 1). Compile OK (76s), TypeScript OK (64s). Failed in "Collecting page data": `SiteFooter` -> `getPageCopyOverrides` -> `records-db.ts:35` query on `cms_seeded` threw ECONNREFUSED. `.env.local` has `DATABASE_URL` set and the DB at :5433 is down. Environmental, but see finding F1: the build hard-depends on a reachable DB whenever `DATABASE_URL` is set. |
| `npm outdated` | No major lag on runtime deps (next 16.3.0 vs 16.4.2, react 19.2.8 vs 19.3.1, zod 4.4.3 vs 4.6.7, lucide-react 1.28 vs 1.59). Major-only gaps: `eslint` 9 vs 10, `vitest` 3 vs 5, `typescript` 5.9 vs 7.0, `@types/node` 22 vs 26 (all dev-only, hold). |

## 17. QA and testing

| Item | Status | Evidence | Action |
|---|---|---|---|
| Unit tests | Done | 39 files in `tests/`, 529 tests, 519 pass without a DB. Cover admin auth (session, team, password audit, account), CMS (schemas, sanitise, store, locations, actions), leads (intake, transfer, enquiry), chatbot (guard, route, schema, render), persona (classify, channel, infer, ruleMatch, profile, visitor), `client-ip`, `rich-text`, `responsive`, `content`, `media-redirects` | Keep |
| Integration tests needing Postgres | Partial | 4 files above fail with ECONNREFUSED when no DB; helper `tests/helpers/db.ts` hardcodes port 5433 via env | Make them skip (`describe.skipIf(!dbReachable)`) so `npm run check` is green offline, or document `docker run` one-liner for the test DB |
| E2E / browser tests | Missing | No `playwright` or `cypress` in `package.json`; no e2e dir. `.playwright-mcp/` is an untracked scratch folder from the MCP tool, not a suite | Add Playwright smoke suite (home, /courses, a course page, /centres, enquiry submit, admin login) |
| Public-flow coverage: enquiry | Partial | `tests/enquiry-route.test.ts` (2 of 4 need DB), `leads-intake.test.ts`; `/api/journey/save` CRM path has no test (grep `journey/save` in tests: 0 hits) | Add journey-save test |
| Public-flow coverage: centres directory, course pages, search | Missing | No test files named for centres/courses pages/search; only fixture/content tests (`content.test.ts`, `cms-wiring.test.ts`) | Add render/smoke tests for `/centres`, `/courses/[slug]`, search route |
| Accessibility / responsive tests | Partial | `tests/responsive.test.ts` is static; a11y was scanned manually with axe (README "Accessibility" section), not automated | Add `@axe-core/playwright` to the e2e suite |
| SEO gate | Partial | `npm run verify:seo` (`scripts/verify-redirects.ts`) needs a running server and is not wired into any pipeline | Run in CI against a preview deploy |
| Chatbot answer eval | Done | `check:chatbot-answers`, `eval:chatbot-retrieval`, `eval:conversations`, fixtures in `scripts/fixtures/` | Run on schedule |
| `npm run check` | Partial | = typecheck + lint + test. Red offline due to the 4 DB files | See DB-skip action |
| Lint scope | Partial | `npm run lint` is `eslint .`; audits ran `eslint src tests` | Align scripts so one command is canonical |
| CI | Missing | `.github/` absent (confirmed). `vercel.json` only sets build command and function `maxDuration: 60`. No pre-merge checks | Add GitHub Actions: install, `check` with a Postgres service, `next build` |
| Cross-browser / device testing | Missing | No documented matrix or tooling | Add to launch checklist (BrowserStack or manual) |
| Load / performance testing | Missing | No k6/Lighthouse CI config | Add Lighthouse CI on key pages |

## 18. Hosting and deployment

| Item | Status | Evidence | Action |
|---|---|---|---|
| Host | Done | Vercel: `vercel.json`, `.vercel/project.json`; `docs/SHARED_DATABASE.md` names Vercel project `jetking-panel`. Self-host path via `BUILD_STANDALONE=true` (`next.config.ts`) | Document the chosen host in README |
| Environments (dev/staging/prod) | Partial | Vercel Preview/Production implied in `docs/SHARED_DATABASE.md`; `DEVELOPMENT-PLAN.md` says "Test -> Staging -> Production" but no env matrix, branch mapping or staging URL is documented | Write an environments table (URL, branch, DB, secrets owner) |
| Env var documentation | Partial | See "Env var diff" below | Fix `.env.example` |
| Build pipeline | Partial | `npm run build` compiles and type-checks but fails at page-data collection when `DATABASE_URL` is set but unreachable (see results). Prerender of `SiteFooter` calls the DB | See F1 |
| DB migrations | Partial | Drizzle: `drizzle/migrations/0000..0010` + `npm run db:migrate` (`scripts/migrate-db.ts`). Documented only in `docs/SHARED_DATABASE.md`. A second, stale schema exists: `supabase/migrations/20260331000000_init.sql` | Add migration step to deploy checklist; retire or label the Supabase SQL |
| Deploy steps | Partial | `docs/HANDOVER.md` "Cutover" (26 lines) is outdated (see 21) | Rewrite as a real runbook |
| Rollback | Partial | One line in `docs/HANDOVER.md`: previous Vercel deployment + `redirects.json`. No DB-migration rollback, no CMS content rollback (`docs/PROCESS_AUDIT.md` M10: no versioning) | Document Vercel instant rollback and drizzle forward-fix policy |
| Backups | Missing | No backup/restore doc. `data/cms/store.json` is git-tracked and is the live content source when no DB; Postgres backup policy not stated | Document Neon/Vercel PG PITR and a `pg_dump` cron; restore drill |
| Redirects for moved pages | Done | `redirects.json` (403 B, small), `redirects.generated.json` (4 B, effectively empty), `src/lib/legacy-routes.ts`, runtime DB redirects (`drizzle 0006`), `data/redirect-gaps.json` (36 undecided per PROCESS_AUDIT), `scripts/verify-redirects.ts`; `docs/SEO_ROUTING_AUDIT.md` reports 5 live URLs still 404 after fixes | Close the 5 gaps; see doc 04 |
| Security headers / HSTS | Done | `next.config.ts` `securityHeaders` (HSTS preload, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) | None (CSP is in doc 04's scope) |
| Rate limiting in prod | Done | `RATE_LIMIT_STORE`, prod refuses to boot on memory unless `RATE_LIMIT_ALLOW_MEMORY=true` (`.env.example`); `src/lib/rate-limit.ts:107` Redis class is commented out | Multi-instance needs Redis implemented |
| Error monitoring | Partial | `src/lib/error-report.ts` posts to `ERROR_WEBHOOK_URL` if set; env var undocumented | Document; consider Sentry |
| SSL / domain | N/A here | Handled by Vercel; no repo evidence | Record domain registrar and renewal owner in runbook |

### Env var diff (`.env.example` + `docs/chatbot.env.example` vs `process.env.*` in src, scripts, config)

- Used but undocumented: `NEXT_PUBLIC_SITE_URL` (the one that actually sets canonicals, `src/lib/config/env.ts:48`, `src/lib/site.ts:17`), `ERROR_WEBHOOK_URL`, `NEXT_PUBLIC_ALLOW_INDEXING` (`src/app/robots.ts:28`), `NEXT_PUBLIC_SHOW_DESIGN_KIT`, `NEXT_PUBLIC_SHOW_INSPECTOR`, `JK_AUTHORITY_WEIGHT`, `PLANNER_MODEL`, `BUILD_STANDALONE`. Platform vars (`NODE_ENV`, `VERCEL`, `NEXT_RUNTIME`, `NEXT_PHASE`, `LOCALAPPDATA`) need no docs. `REDIS_URL` only appears in a commented-out stub.
- Documented but unused in code: `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. GTM/PostHog appear only in `src/lib/analytics.ts` and `src/proxy.ts` by name; no env read. README still claims "analytics via track() -> GA4/GTM + PostHog".
- Mismatch: `.env.example` documents `SITE_URL=http://localhost:3000` as "must be set in prod", but canonicals and `site.url` read `NEXT_PUBLIC_SITE_URL` (default `https://www.jetking.com`); `SITE_URL` is read only in `src/lib/config/env.server.ts:19`. A deployer following `.env.example` will leave canonicals pointing at the default.
- Stray line: `.env.example` has `NEXT_PUBLIC_WHATSAPP_NUMBER=` and `NEXT_PUBLIC_WHATSAPP_MESSAGE=` in unrelated sections; default WhatsApp number in code is `919999999999` (`src/lib/config/env.ts:37`), a placeholder that ships if unset.

## 19. Launch readiness

| Item | Status | Evidence | Action |
|---|---|---|---|
| Placeholder copy | Partial | "To be updated" rendered on centre pages, course template and home placement section unless `NEXT_PUBLIC_SHOW_PLACEHOLDERS=false` (`CentreDetail.tsx:95`, `CoursePageTemplate.tsx:153`, `PlacementProof.tsx:20`). Default (unset) SHOWS placeholders, and `.env.example` has it commented out | Invert default or set `NEXT_PUBLIC_SHOW_PLACEHOLDERS=false` in prod env; add to launch checklist |
| Test or dummy data in content | Partial | `data/cms/store.json` (4.6 MB, tracked) and `src/lib/content/fixtures/locations.ts` match "lorem/dummy/example.com" patterns; not verified individually | Content owner to review; grep for `example.com`, `test` entries before launch |
| Default WhatsApp number | Partial | `919999999999` fallback in `src/lib/config/env.ts:37` | Fail loudly in prod if unset |
| Contact details correctness | Partial | Phone falls back from `NEXT_PUBLIC_PHONE` to a helpline default (`src/lib/content/copy/pages/site.ts`); no automated or documented verification | Business owner to sign off footer, /contact, schema.org phone |
| Forms reach recipients | Partial | `/api/enquiry`: saves to Postgres if `DATABASE_URL`; if `CRM_ENDPOINT` unset it `console.warn('[enquiry:unrouted]')` with full payload and returns `ok:true, routed:false` (`src/app/api/enquiry/route.ts:183-189`). Logged, not dropped, but only in Vercel logs (retention limited) unless DB is set. CRM failure logs `[enquiry:crm-failed]` and marks lead failed. No email/Slack notification path | Require `DATABASE_URL` or `CRM_ENDPOINT` in prod; add notification to sales mailbox; alert on `unrouted` |
| Mixed content | Done | `grep "http://"` in `src` excluding localhost and w3.org: 0 hits; HSTS preload set | None |
| Dev-default secrets guarded | Done | Each throws in production if unset: `ADMIN_PASSWORD` (`src/app/(admin)/admin/actions.ts:80`, dev fallback `changeme`), `ADMIN_SESSION_SECRET` (`src/lib/auth/session.ts:21`), `PERSONA_COOKIE_SECRET` (`src/persona/cookie.ts:33`), `CHATBOT_SESSION_SECRET` (`src/lib/chatbot/session.ts`) | Caveat: `.env.example` ships `PERSONA_COOKIE_SECRET=dev-only-insecure-secret-replace-in-production` uncommented; copying it to prod passes the guard. Comment it out |
| Indexing control | Done | `NEXT_PUBLIC_ALLOW_INDEXING` + CMS `seo.allowIndexing` in `src/app/robots.ts` | Document so staging stays noindex |
| Redirect verification pre-launch | Partial | `scripts/verify-redirects.ts` exists, needs live server; HANDOVER lists it | Run and attach output |
| Sitemap / Search Console | Partial | Listed in HANDOVER; no evidence of execution | Launch checklist item |
| Analytics live | Partial | GTM/PostHog env vars documented but unused (see diff) | Decide and wire or remove from docs |
| Legal pages, cookie consent | N/A here | Covered in doc 04 | See doc 04 |

## 20. Ongoing maintenance

| Item | Status | Evidence | Action |
|---|---|---|---|
| Dependency freshness | Done | `npm outdated`: patch/minor lag only; majors held on dev tools (see results) | Enable Dependabot or Renovate (no `.github`) |
| Unused dependencies | Partial | Spot check: `write-excel-file`, `class-variance-authority`, `@supabase/supabase-js`, `sanitize-html` are each imported in 1 file; `@xenova/transformers` in 2. No unused runtime dep found. `pdf-parse`, `mammoth`, `cheerio` are scripts-only devDeps, correctly placed. `@supabase/supabase-js` is used by `src/lib/supabase.ts` while the README states Postgres via Drizzle is the path | Run `npx depcheck` in CI; decide whether to drop Supabase client |
| Security patching | Missing | No `npm audit` step, no policy | Add `npm audit --omit=dev` to CI |
| Content refresh procedure | Done | README "Keeping Jetking AI trained": `build:chatbot-index`, 2 JSON files committed | Automate after CMS publish (HANDOVER/PROCESS_AUDIT gap) |
| Monitoring / uptime | Missing | Only the optional error webhook | Add uptime check and alert route |
| Domain / certificate renewals | Missing | No doc; Vercel manages certs | Record registrar, expiry date, owner |
| Periodic access review | Missing | Admin roles exist (`admin/editor/centre_staff`, Team & Access page) but no review cadence documented; session revocation exists (`drizzle 0010_session_version`) | Quarterly review checklist; rotate `ADMIN_SESSION_SECRET` on staff exit |
| Backups and restore drill | Missing | See section 18 | Same |
| Support / escalation | Missing | No contact tree in any doc | Add owner, vendor and SLA table |

## 21. Documentation and handover

| Item | Status | Evidence | Action |
|---|---|---|---|
| README | Partial | 224 lines, good script table and homepage notes, but stale (see below) | Update |
| Architecture docs | Partial | README "one rule", `DEVELOPMENT-PLAN.md` (427 lines, original proposal incl. commercials), `docs/ADMIN_PANEL.md` (445 lines), `docs/CHATBOT.md`, `docs/SHARED_DATABASE.md` | Consolidate into `docs/` index |
| Sitemap / IA doc | Partial | `docs/SEO_ROUTING_AUDIT.md`, `data/legacy-urls.json` | Add current route map |
| API docs | Missing | No list of `/api/*` routes and contracts (enquiry, chat, chatbot, journey/save, revalidate) | Generate from `src/app/api` |
| DB docs | Partial | `docs/SHARED_DATABASE.md` setup only; no schema/ER doc (`src/lib/db/schema.ts` is the source) | Add short schema overview |
| Admin training docs | Partial | `docs/ADMIN_PANEL.md`; HANDOVER "Training" is 4 lines of obsolete content (persona rules) | Write editor guide with screenshots |
| Handover | Partial | `docs/HANDOVER.md` outdated | Rewrite |
| Audit docs | Done | `ADMIN_AUDIT.md`, `PROCESS_AUDIT.md`, `SEO_ROUTING_AUDIT.md`, `centres-csv-reconciliation.md` | Mark dated; archive when closed |

### Stale claims (evidence)

1. README "Environment": `NEXT_PUBLIC_SITE_URL` is correct but `.env.example` says `SITE_URL`; contradictory (see env diff).
2. README "Locked stack": embeddings "OpenAI text-embedding-3-small", vectors "Supabase pgvector", answers "GPT-4o". Actual: local `Xenova/paraphrase-multilingual-MiniLM-L12-v2` (`JK_EMBED_MODEL`), embeddings in `src/content/jetking-embeddings.json` (17.4 MB), Ollama default (`.env.example`).
3. README "Layout" lists `src/supabase/migrations/`; real folder is `/supabase/migrations/` and the live schema is `drizzle/migrations/` (11 files).
4. README "Repository": says working branch `frontend`; current branch is `backend-admin-cms`.
5. README quick start: "ADMIN_PASSWORD or open in local" and Env section "ADMIN_PASSWORD - simple staff gate when Supabase Auth is unset"; real model is `DATABASE_URL` -> multi-user accounts, ADMIN_PASSWORD is a legacy fallback (`docs/SHARED_DATABASE.md`).
6. `docs/HANDOVER.md` step 3 "Apply supabase/migrations/20260331000000_init.sql" should be `npm run db:migrate`; step 5 "ADMIN_PASSWORD rotated" should be `create:admin` plus `ADMIN_SESSION_SECRET`, `CHATBOT_SESSION_SECRET`; omits `DATABASE_URL`, `CRM_ENDPOINT`.
7. HANDOVER "Training": persona rules example (`IF location=Mumbai...`) conflicts with memory note that persona is explicit-by-default.
8. README "Status: analytics via track() -> GA4/GTM + PostHog": no `NEXT_PUBLIC_GTM_ID`/POSTHOG env reads exist in code.
9. README script table lists `npm run test` as "persona rule matrix + guardrail suite + CMS rules"; suite is now 39 files, mostly admin.
10. `docs/ADMIN_AUDIT.md` says "17 new files, 280+ tests"; current total is 529 tests (dated snapshot, not wrong, but unlabeled).
11. `DEVELOPMENT-PLAN.md` still describes ₹6,00,000 / 7-week plan, headless CMS and pgvector/GPT-4o; it is a proposal, not as-built, and contains commercials.

## Repo hygiene

| Check | Result |
|---|---|
| Tracked files | 1568 |
| `tsconfig.tsbuildinfo` | Not tracked, ignored by `*.tsbuildinfo` |
| `.playwright-mcp/` | Untracked and NOT ignored (shows in `git status`, 44 KB) |
| Tracked build log | `data/chatbot-build.log` is tracked |
| Large tracked files | `src/content/jetking-embeddings.json` 17.4 MB; `data/cms/store.json` 4.6 MB; `src/content/website-corpus.json` 4.3 MB; `src/lib/content/fixtures/posts.migrated.json` 3.6 MB; `data/blog-scraped.json` 1.9 MB; `src/content/jetking-kb.json` 0.55 MB; `src/lib/content/fixtures/locations.ts` 0.37 MB; `package-lock.json` 0.43 MB. No video/zip/psd. Images in `public/` max ~417 KB |
| Line endings | No `.gitattributes`. `git ls-files --eol`: 579 files index LF / working tree CRLF, 4 mixed, 57 LF/LF, 852 binary. Windows autocrlf working tree; no enforced normalisation |
| Root clutter | `redirects.generated.json` (4 B, effectively empty, tracked), `models/` (1 Modelfile), `design-system/MASTER.md` (1 file), `.cursor/rules` and `.claude/launch.json` tracked, `drizzle.config.ts` and `supabase/` (legacy) |
| Duplicate / stale docs | `DEVELOPMENT-PLAN.md` vs `docs/HANDOVER.md` overlap on go-live; three audits dated 2026-09 in `docs/`; `docs/chatbot.env.example` vs `.env.example` overlap |
| Dead / stale npm scripts | `check:seo` duplicates `verify:seo`; `sync:investors`, `localize:media`, `migrate:blog`, `crawl:legacy`, `build:redirects`, `migrate:cms`, `seed:locations` are one-off migration tools (still present; keep but group). `lint` = `eslint .` but docs use `src tests`. `typecheck` ok |
| `.gitignore` | Good coverage of env, `.next`, `.cache`, `data/chatbot/`, `*.tmp`. Gaps: `.playwright-mcp/`, `.claude/` local files (launch.json is deliberately tracked), `*.log` under `data/` (`data/chatbot-build.log` tracked despite `*-debug.log*` rules), `/.vercel` is listed |
| `store.json` as production data | Tracked intentionally (comment in `.gitignore`); every CMS edit made via file store is a git change and a 4.6 MB blob |

## Rationalization findings

| # | Path | Proposed action | Effort | Risk |
|---|---|---|---|---|
| F1 | `src/lib/cms/records-db.ts:35`, `src/lib/cms/store.ts:282` | Make page-copy and CMS reads fall back to the file store on DB error (as `locations-db` already does) so `next build` survives a down DB | S | Low; avoids build-time outage |
| F2 | `.github/workflows/` (new) | CI: `npm ci`, `check`, Postgres service for integration tests, `next build`, `npm audit` | M | Low |
| F3 | `tests/cms-integration.test.ts`, `enquiry-route`, `leads-intake`, `media-redirects`, `tests/helpers/db.ts` | `skipIf` when DB unreachable; document test DB command | S | Low |
| F4 | new `e2e/` + Playwright | Smoke suite for home, courses, centres, search, enquiry, admin login | L | Low |
| F5 | `.env.example`, `src/types/env.d.ts` | Add missing vars, remove/mark unused GTM/PostHog/anon key, reconcile `SITE_URL` vs `NEXT_PUBLIC_SITE_URL`, comment out `PERSONA_COOKIE_SECRET` example | S | Low |
| F6 | `docs/HANDOVER.md`, `README.md` | Rewrite per stale-claims list; add environments table, backup/rollback, support/escalation, renewals | M | None |
| F7 | `.gitignore`, `.gitattributes` | Ignore `.playwright-mcp/`; add `* text=auto eol=lf` and renormalise (`git add --renormalize .`) in a dedicated commit | S | Medium: large diff, do alone |
| F8 | `data/chatbot-build.log`, `redirects.generated.json` | `git rm --cached` log; delete empty generated redirects if `build-redirects.ts` does not need it (verify) | S | Low |
| F9 | `src/content/jetking-embeddings.json` (17 MB), `data/blog-scraped.json`, `posts.migrated.json` | Move generated/one-off data to release artifact or Git LFS; keep embeddings build in CI | M | Medium; chatbot relies on file at runtime |
| F10 | `NEXT_PUBLIC_SHOW_PLACEHOLDERS`, `src/lib/config/env.ts:37` | Default placeholders off in production; fail if WhatsApp number unset in prod | S | Low |
| F11 | `/api/enquiry`, `/api/journey/save` | Require DB or CRM in prod; add email/Slack notify and `unrouted` alert; test journey-save | M | Low |
| F12 | `supabase/`, `src/lib/supabase.ts`, README stack table | Decide: remove legacy Supabase artefacts or document as optional | M | Medium |
| F13 | `package.json` scripts | Drop `check:seo` alias; group migration one-offs under `scripts/legacy/`; make `lint` consistent | S | Low |
| F14 | `.github/dependabot.yml` | Weekly updates; hold eslint 10, vitest 5, typescript 7 | S | Low |

## Top 10 priorities

1. F11: guarantee enquiries reach a human (DB or CRM required in prod, notification, alert on `[enquiry:unrouted]`).
2. F10: turn off "To be updated" placeholders and the `919999999999` WhatsApp fallback for production.
3. F5: fix `.env.example` (SITE_URL mismatch, insecure example secret, missing vars) before anyone deploys from it.
4. F2: add CI (check, build, audit); nothing currently gates merges.
5. F1: stop `next build` depending on a live DB; today's build fails here at page-data collection.
6. F6: rewrite HANDOVER and README (migrations, secrets, rollback, backups, support, renewals).
7. Backups: document and test Postgres backup and restore; `store.json` is the only fallback copy.
8. F3 + F4: DB-skip for integration tests, then Playwright smoke tests for centres, courses, search, enquiry.
9. F7 + F8: `.gitignore` `.playwright-mcp/`, `.gitattributes` LF normalisation, untrack build log.
10. Close the 5 remaining live-URL 404s and 36 undecided redirect gaps, then run `verify:seo` on the preview before cutover.
