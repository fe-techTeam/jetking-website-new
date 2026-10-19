# Rationalization audit 01: strategy, IA, pages, content, brand

Scope: checklist sections 1, 2, 4, 5, 6. Read-only audit of branch `backend-admin-cms` (2026-10-19). Evidence is grep/ls verified; paths relative to repo root. Status: Done / Partial / Missing / N/A.

## Section 1. Strategy and rationalization

| Item | Status | Evidence | Recommended action |
|---|---|---|---|
| Purpose, audience, UVP documented | Partial | `DEVELOPMENT-PLAN.md` s1 (three products A/B/C) and persona table (line ~159) state purpose and audiences. No UVP/positioning statement. `design-system/MASTER.md` has "Communicate: Credibility, Clarity, Competence, Care" only | Add a one-page positioning/UVP section to DEVELOPMENT-PLAN or README |
| Feature prioritisation | Partial | Plan has phases and a risk table (R1..R5, line ~394); no MoSCoW or backlog. Phase-1 "definition of done" exists (line ~20) | Add a prioritised backlog table (now/next/later) |
| KPIs / success metrics | Missing | `grep -i kpi` over DEVELOPMENT-PLAN/README returns nothing; only "measured as positive conversion" (line 261). Analytics events exist (`src/lib/analytics.ts`, `ScrollDepthTracker`, `FeeDepthTracker`) but no stated targets | Define 5-8 KPIs (enquiry conversion, SEO coverage, CWV, chatbot handoff rate) with baselines |
| Every page mapped to a goal | Partial | `src/app/(admin)/admin/registry.ts` (website map, `appearsOn`) maps pages to CMS records, not business goals | Add goal column (lead / trust / SEO / legal) to the page inventory |
| Rationalization (redundant pages, assets) | Partial | See findings F1-F12 below | Execute priorities list |

## Section 2. Information architecture and sitemap

| Item | Status | Evidence | Recommended action |
|---|---|---|---|
| Sitemap (machine) | Done | `src/app/sitemap.ts` generated from `content`; excludes noindex `/enquiry`; honest `lastModified`; honours `seo.sitemapExclude` | None |
| Sitemap (human) | Done, mild redundancy | `src/app/sitemap/page.tsx` built from same content; listed in sitemap.xml at priority 0.3 | Keep; see F9 |
| Page hierarchy | Done | `/`, `/courses/[slug]`, `/centres/[city]/[slug]` plus flat `/centres/[slug]`, `/blog/[slug]`, legal trio | Remove nested `centres/[city]/[slug]` if unused (F7) |
| Primary navigation | Done | `src/lib/site.ts` `mainNav`: About Us, Courses, Centres, Placements, Franchise, Investors, Blog; mega menu in `SiteHeader.tsx` via `SiteHeaderServer.tsx` | Consider moving Investors to footer (low audience value for students) |
| Secondary nav / footer | Done | `SiteFooter.tsx`: contact, social, courses, cities (`/centres?q=`), legal trio (`copy/pages/site.ts` footer.legal.0-2) | Add `/sitemap` link to footer legal row if absent |
| URL conventions | Done | Lowercase kebab slugs; flat centre slugs; `typedRoutes: true` in `next.config.ts`; `centrePath` helper | Note inconsistent suffixes: `/about-us` vs `/faq`, `/terms-conditions` vs `/enrollment-terms-and-conditions` (acceptable; they mirror live) |
| Breadcrumbs | Partial | `Breadcrumbs` component rendered in courses, faq, investors, sitemap, CourseTemplate A/B, BlogArticle, CentreDetail, LegalDocument, AboutLanding, PlacementsLanding. `breadcrumbSchema` JSON-LD on 19 pages | Verify visible crumbs on blog index, centres index, franchise (they emit schema only) |
| Internal linking | Partial | Course to centres (`CentrePicker`), centre to courses (`CentreFeaturedProgrammes`), blog cards, related courses. Blog to course links not verified | Add related-course block to blog articles; link-check in CI |
| Taxonomy | Partial | `src/lib/course-categories.ts` (categories + levels), `cities` collection, blog tags in posts. No blog category pages | Decide whether blog categories need landing pages |
| Old to new URL mapping | Partial | Three layers: `redirects.json` (3 entries), `src/lib/legacy-routes.ts` (~156 lines), `data/legacy-urls.*` (only 40 URLs crawled), `redirects.generated.json` (empty `[]`), `data/redirect-gaps.json` (36 entries, stale). `docs/SEO_ROUTING_AUDIT.md`: 5 of 521 live URLs still 404 (`/career`, `/life-at-jetkings`, `/jetking-jets`, `/centres/sewri`) | Consolidate (F3); resolve the 5 open 404s; regenerate gaps against the 521-URL set |
| Search / filters / pagination | Done | Blog: `BlogIndex.tsx` (search + paging, `BLOG_PAGE_SIZE`, URL-synced); courses: `CourseExplorer.tsx` + `FilterSheet`; centres: `CentresIndex` + `CentresHeroSearch`. No site-wide search route | Optional global search; chatbot partly covers it |

## Section 4. Pages and content

| Page | Status | Evidence | Recommended action |
|---|---|---|---|
| Home | Done | `src/app/page.tsx`, `components/home/*` | None |
| About | Done | `src/app/about-us/page.tsx`, `components/about/*` | None |
| Courses list + detail | Done | `courses/page.tsx`, `courses/[slug]/page.tsx` (template A) | Remove template B preview (F2) |
| Centres list + detail | Done | `centres/page.tsx`, `centres/[city]/page.tsx` (flat slug handler, city redirects to `/centres?q=`) | Directory name `[city]` is misleading; see F7 |
| Contact / enquiry | Done | `enquiry/page.tsx` (noindex), `EnquiryForm.tsx`, `EnquirySheet`, `api/enquiry`; `/contact-us` redirects to `/enquiry` | None |
| FAQ | Done | `faq/page.tsx`; `fixtures/faqs.ts` header says "PLACEHOLDER CONTENT" | Confirm FAQ copy is client-approved, then drop the header |
| Blog | Done | `blog/page.tsx`, `blog/[slug]/page.tsx`; 416 posts in `data/cms/store.json` (plan says ~136) | Update plan figures |
| Testimonials | Partial | No route; embedded sliders (Home, Student, Parent, Explore, Franchise each have their own slider component) | Fine as sections; dedupe sliders (F8) |
| Team / leadership | Partial | `AboutLanding` + `LeaderDetailModal`; 3 leader photos unreferenced (F6) | Wire up or delete |
| Careers | Missing | `/career` is a known 404 (`docs/SEO_ROUTING_AUDIT.md`); no route | Client decision: build or 410 |
| Pricing | Partial | Fees live inside course pages (`FeeDepthTracker`); no pricing page | N/A unless desired |
| Search page | Missing | No `/search` route | Optional |
| Login / account | Done | `account/page.tsx` (noindex), `AccountProvider`, `SiteAuthDialog`, `/chatbot` page | Ensure `/chatbot` has noindex or is intentionally indexed |
| Privacy / terms / enrollment terms | Done | `privacy-policy`, `terms-conditions`, `enrollment-terms-and-conditions` pages; `LegalDocument` | None |
| Cookie policy | Missing | `grep -ril cookie` finds only auth/session code; no policy page or consent banner | Add cookie policy + consent banner (analytics is loaded) |
| Accessibility statement | Missing | No route | Add short statement |
| Investors (extra) | Done | `investors/page.tsx`, `lib/investors/disclosures.json` | None |
| 404 | Done | `not-found.tsx` with six destination cards | None |
| 500 / error boundary | Done | `error.tsx`, `global-error.tsx`, `api/client-error` | None |
| 403 | Missing | No forbidden page; admin guards in `(admin)` | Low priority |
| Thank-you pages | Partial | Inline success `Notice` in `enquiry/EnquiryForm.tsx` (line ~186); no dedicated URL | Add `/enquiry/thank-you` (noindex) for GA/Ads conversion tracking |

Content quality

| Item | Status | Evidence | Recommended action |
|---|---|---|---|
| Placeholder / "To be updated" | Partial | Intentional visible placeholders: `CoursePageTemplate.tsx` L79-152, `CentreDetail.tsx` L94, strings in `copy/pages/courses.ts` L136-145 and `copy/pages/centres.ts` L121 | Gate behind a flag so they never render in production (F5) |
| Lorem ipsum | Partial | 5 FAQ answers for centre `mohali` in `data/cms/store.json` (lines 7273-7289), `src/lib/content/fixtures/locations.ts` L4353, and copied into `src/content/website-corpus.json` (chatbot corpus) | Replace or delete; rebuild corpus (`npm run build:chatbot-index`) |
| TODO / FIXME in src | Done | Grep of `src/app`, `components`, `lib` finds none | None |
| Test / sample data | Partial | "Sample" offer letters (`copy/pages/placements.ts` L78-88, `OFFER_LETTER_SAMPLES`), sample degree/certificate images; labelled as illustrative | Replace with consented real letters before go-live |
| Duplicated copy blocks | Partial | Per-persona landing copy (`copy/pages/student|parent|professional|explore.ts`) overlaps; five testimonial slider variants | See F1, F8 |
| Outdated dates | Partial | `design-system/MASTER.md` and plan dated 2026-09; `data/chatbot-build.log` committed | Remove generated log (F10) |
| Alt text | Partial | 98 `<Image|img>` usages in `src/app` + `src/components`; 59 `alt=""` (decorative expected) | Spot-check that the 59 are decorative |
| Image sizes in public/ | Partial | `public/` 968 files, ~44 MB, of which `public/media` 34 MB (732 hashed webp). Largest: `home/centre-exterior.jpg` 417 KB, `courses/*.jpg` 337 KB, `placements/photos/hero-male.webp` 331 KB | Convert large JPGs to webp/avif; `next/image` already serves avif/webp |
| Metadata | Done | All pages go through `buildMetadata` (`src/lib/seo.ts`): title, description, canonical, robots, OG, Twitter | None |
| Social / OG images | Done | `public/og-default.png` is 1200x630; per-course dynamic card `src/app/og/course/[slug]/route.tsx` | None |

## Section 5. Content preparation

| Item | Status | Evidence | Recommended action |
|---|---|---|---|
| Content source of truth | Partial | CMS `data/cms/store.json` (4.6 MB, default `CONTENT_SOURCE=admin`) plus code fixtures `src/lib/content/fixtures/*` (locations.ts 367 KB, posts.migrated.json 3.5 MB) plus `src/content/website-corpus.json` (4.3 MB, generated) | Document which is authoritative; fixtures should be seed-only (F4) |
| Page copy externalised | Done | `src/lib/content/copy/pages/*` with `loadCopy` and admin overrides | None |
| Blog migration | Done | `scripts/migrate-blog.ts`, `data/blog-migration-report.json`, 410 migrated vs 416 in store | Confirm the 6-post delta is intentional |
| Legacy content crawl | Partial | `scripts/crawl-legacy.ts`; `data/legacy-urls.*` has 40 rows only; `data/blog-paths-live.json` has 2 entries; `blog-scraped.json` 218 | Re-crawl against 521 live URLs or delete the stale artefacts |
| Manual knowledge | Partial | `data/manual-knowledge/` (entries.json 4 bytes, README, urls.txt), `src/content/manual-knowledge.json` 67 bytes: empty | Fill or remove |

## Section 6. Branding and visual identity

| Item | Status | Evidence | Recommended action |
|---|---|---|---|
| Logo | Done | `public/brand/jetking-wordmark.png` (320x100), `jetking-shield.png` (238x266) used via `components/brand/jetking-shield.tsx`, admin, OG route, `BlogCards` | Provide SVG masters; PNG wordmark is low-res for retina |
| Favicon / app icons | Done | `src/app/icon.png` 192x192, `apple-icon.png` 180x180 | Add 512x512 maskable icon for PWA |
| Manifest | Partial | `src/app/manifest.ts`: lists a 192 icon and the 180 apple icon as `icons`; no 512 | Add 512 icon; apple-icon should not be in manifest |
| Brand tokens | Done | `src/styles/globals.css` `--color-*`, `--accent`, `--font-sans` (Fira); `design-system/MASTER.md` states it documents globals.css | Fix drift: MASTER.md says muted `#667085`, code has `#5f6b7d` (L68) |
| Single accent colour | Partial | `--color-track-cyber/cloud/network/ai` are all `#c7141c` (globals.css L91-94): dead differentiation; `--color-brand-crest #d81f26` vs accent jk-500 | Collapse track tokens into one or give meaning |
| Light/dark consistency | Partial | MASTER.md says "Light (single mode)" yet `.dark-canvas` skin and `dark-canvas.css` (754 lines) drive courses, faq, investors, about, sitemap; `not-found.tsx` says "tracks the light / dark toggle" | Update MASTER.md to describe dark-canvas sections |
| Style sheet sprawl | Partial | 14 CSS files (5.2 kLOC) incl. `student.css`, `professional.css`, `parent.css` for retired pages; `enquiry/EnquiryForm.tsx` L41 depends on `student.css` | Move shared enquiry rules out before deleting (F1) |

## Rationalization findings

| # | Paths | What is redundant | Proposed action | Effort | Risk |
|---|---|---|---|---|---|
| F1 | `src/app/student`, `parent`, `professional` (3 pages); `components/student/*` (incl. `journey/*` 8 files), `components/parent/*`, `components/professional/*`; `styles/student.css`, `parent.css`, `professional.css` | `next.config.ts` (`retired` array) 307-redirects these three routes to `/`, so the pages are unreachable. ~2.5 kLOC of components plus 513 lines CSS still compile and ship in the CSS bundle. Verified no inbound links in `src` except admin registry | Delete pages and Landing components. Keep `RecommendedCourses` (used by explore), `copy/pages/parent.ts` and `professional.ts` (imported by `about-us` and `courses/page.tsx`), and avatar images still referenced by placements. Move shared CSS used by `EnquiryForm` first. Decide fate of `api/journey/save` | M | med |
| F2 | `src/app/courses/[slug]/design-2/page.tsx`, `CoursePageTemplateB.tsx` (551 lines) | Client "design preview" of an alternate course template, served in production (noindex, canonical to live page). Only referenced by itself | Delete, or gate with `notFound()` in production like design-kit. Keep in git history | S | low |
| F3 | `redirects.json`, `redirects.generated.json`, `src/lib/legacy-routes.ts`, `data/redirect-gaps.json`, `data/legacy-urls.csv` + `.json`, `src/lib/redirects/*`, `drizzle 0006_redirects.sql` | Four redirect sources merged by `next.config.ts` (later wins). `redirects.json` `/centre/:city` duplicates `legacy-routes.ts` `/centre/:slug`; `redirects.json` bce/blog entries duplicate pattern rules. `redirects.generated.json` is `[]`. `redirect-gaps.json` lists 36 paths, several already resolved in `legacy-routes.ts` (`/sitemap-xml`, `/courses/aws-solution-specialist`, `red-hat-certification-rhcsa`, `/diploma-in-cloud-computing-and-cyber-security`). CSV and JSON hold the same 40 URLs | Pick one authority (DB-backed `redirects` table or one file). Delete `.generated.json` from git (generate on demand). Remove CSV or JSON duplicate. Regenerate gaps. Run `npm run verify:seo` | M | med (SEO) |
| F4 | `src/lib/content/fixtures/locations.ts` (367 KB), `posts.migrated.json` (3.5 MB), `data/cms/store.json` (4.6 MB), `src/content/website-corpus.json` (4.3 MB), `jetking-embeddings.json` (17 MB), `jetking-kb.json` | Same centres/posts/courses stored in up to three places (fixtures, CMS store, chatbot corpus). Default `CONTENT_SOURCE=admin` means fixtures are fallback/seed. Divergence already visible: 416 posts in store vs 410 in fixtures | Document authority; stop shipping fixtures in the client/server bundle unless `local` source is selected; consider storing generated corpus/embeddings outside git (LFS or release artefact) | L | med |
| F5 | `CoursePageTemplate.tsx` L79-152, `CentreDetail.tsx` L94, `copy/pages/courses.ts` L136-145, `centres.ts` L121 | Visible "To be updated" placeholder tiles render in production if content is missing | Hide placeholders when `NODE_ENV==='production'` or when `NEXT_PUBLIC_SHOW_PLACEHOLDERS!=='true'`; complete content for the 2 courses lacking tools | S | low |
| F6 | Unreferenced public assets (24 files, ~0.6 MB; verified by basename grep across src, data, scripts, docs): `about/leaders/team/{pradnya-pawar,shiv-hansraj-pal,varun-sukhrani}.jpg`, `courses/sample-offer-letter.svg`, `franchise/building-sm.jpg`, `home/how-bg.jpg`, `home/journey-{franchise,parent,professional}-v3.jpg`, 12 `logos/*.svg` (cplusplus, googleads, googleanalytics, instagram, kalilinux, linkedin, meta, microsoftazure, microsoftexcel, pinterest, snapchat, tcs, unrealengine, windows11, youtube) | Dead files | Delete after one final grep of CMS records (admin may reference by path at runtime) | S | low |
| F7 | `public/` byte-identical duplicates (md5): `franchise/hero.jpg` = `franchise/building-sm.jpg` = `home/journey-franchise-v3.jpg`; `parent/hero.jpg` = `home/journey-parent-v3.jpg`; `courses/red-hat-professional.jpg` = `routing-switching-administrator.jpg`; `student/avatar-4.webp` = `student/testimonial.webp`; two course certificate JPGs identical; 4 pairs in `public/media` | Duplicate binaries (some placeholders reused as real images, e.g. two courses share one hero) | Dedupe; commission distinct course imagery for the two courses sharing a file | S | low |
| F7b | `src/app/centres/[city]/[slug]/page.tsx` | Nested route alongside flat `/centres/[city]` slug handler (which is really the centre page); docs say there are no city pages | Confirm whether `[city]/[slug]` is still reachable/used; rename `[city]` to `[slug]` to reflect reality; delete nested route if redundant | S | med |
| F8 | `components/{student,parent,explore}/*TestimonialSlider.tsx`, `franchise/FranchiseTestimonialSliderLight.tsx`, `components/TestimonialSlider.tsx` | Five testimonial sliders with near-identical behaviour | Collapse into the shared `TestimonialSlider` with a theme prop (after F1 two of them vanish) | M | low |
| F9 | `src/app/sitemap/page.tsx` + `copy/pages/sitemap.ts` vs `sitemap.ts` | Human sitemap is intentional (not a true duplicate) but is listed in `sitemap.xml` at priority 0.3, wasting crawl budget | Keep page; drop from `sitemap.xml` or keep noindex; add footer link | S | low |
| F10 | `data/chatbot-build.log`, `data/blog-*.json`, `redirects.generated.json`, `tsconfig.tsbuildinfo`, `.playwright-mcp/` | Generated or scratch artefacts in repo root/data (`chatbot-build.log` is tracked) | `git rm` tracked logs; add to `.gitignore` | S | low |
| F11 | `src/app/explore/page.tsx`, `components/explore/*`, `copy/pages/explore.ts` | Noindex, unlinked (only `lib/cms/publish.ts` revalidates it and `WhyJetking.tsx` comments that "the rest live on /explore"). Overlaps with home + about "10 reasons" | Decide: link it from home "why" section, or retire like F1. `REASONS` in `explore/content.ts` is used by about/home so extract before deleting | M | med |
| F12 | `src/app/design-kit/page.tsx`, `styles/kit.css`, `components/kit/*` | `/design-kit` already 404s in production unless `NEXT_PUBLIC_SHOW_DESIGN_KIT=true` (not in README/.env docs). Acceptable internal tool; kit components are shared | Keep; document the env flag; keep out of sitemap (already) | S | low |
| F13 | `src/lib/content/copy/pages/{student,parent,professional,explore}.ts` | Persona landing copy partly overlaps and parent/professional modules are imported by unrelated pages for 2-3 keys | After F1, move the shared keys into `about.ts`/`courses.ts` copy modules | M | low |
| F14 | `.admin registry.ts` `UNLISTED_PAGE_IDS` (L346) and `hiddenRecordIds` (L261) | Admin lists student/parent/professional/explore as unlisted pages | Remove entries when F1 lands | S | low |

## Top 10 priorities

1. Fix redirect hygiene (F3): one authority, delete the empty generated file, regenerate gaps, decide the 5 open 404s (`/career`, `/life-at-jetkings`, `/jetking-jets`, `/centres/sewri`).
2. Remove Lorem ipsum from Mohali centre FAQs in CMS store, fixtures and chatbot corpus (rebuild index) (Content).
3. Hide "To be updated" placeholders in production (F5).
4. Retire dead persona routes and their code/CSS (F1), after extracting shared enquiry CSS and copy keys (F13, F14).
5. Delete or production-gate the `design-2` course preview (F2); it is a client-review artefact served in production.
6. Add cookie policy plus consent banner, and an accessibility statement (Section 4 Missing).
7. Add dedicated `/enquiry/thank-you` (noindex) for conversion tracking.
8. Define KPIs and a UVP block in the plan docs (Section 1 gaps).
9. Clean `public/`: delete 24 unreferenced files, dedupe identical binaries, recompress >300 KB JPGs (F6, F7).
10. Declare content authority (CMS vs fixtures vs corpus) and stop committing generated artefacts (F4, F10); fix MASTER.md drift (muted colour, "single mode", dead track tokens).
