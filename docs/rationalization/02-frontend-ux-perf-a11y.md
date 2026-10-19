# 02 - Frontend, UX/UI, Performance, Accessibility (checklist sections 3, 7, 12, 13)

Read-only audit, branch `backend-admin-cms`. `src/app/(admin)` excluded. Status: Done / Partial / Missing / N/A.
Next.js is v16 (`package.json`). No source was changed by this audit.

## Section 3 - UI/UX design system

| Item | Status | Evidence | Action |
|---|---|---|---|
| Colour/type/spacing tokens | Done | `src/styles/globals.css` `@theme`: jk-50..950 red ramp, ink ramp, surfaces, AA-annotated text tokens, `--font-sans`, `--text-*` with line-heights | none |
| Design doc | Partial | `design-system/MASTER.md` (233 lines) says "Light (single mode)", but code ships dark mode (`components/providers/theme-*`, `styles/dark-canvas.css` 754 lines, `viewport.colorScheme`). MASTER still lists muted text #667085; globals uses #5f6b7d | Rewrite MASTER.md to match code (S) |
| Typography | Done | One face via `next/font/google` Fira_Sans, `display: swap`, CSS var (`layout.tsx`); display/mono tokens alias sans | none |
| Component states | Done | global `:focus-visible` ring (`globals.css:656`); `components/ui/button.tsx` (cva); `form.tsx` invalid/required/describedby | none |
| Component library | Partial | Three parallel layers: `components/ui.tsx` (+`form.tsx`), `components/kit/*` (13 comps, all imported), `components/ui/{button,dialog,confirm-dialog}.tsx` (shadcn-style; only consumed by chatbot `features/jetking-ai`). Hand-rolled modals elsewhere: EnquiryModal, ExitIntentPopup, SiteAuthDialog, FilterSheet, OfferLetterSlider, LeaderDetailModal | Consolidate dialogs (M) |
| Hard-coded values | Partial | 10 arbitrary `[#hex]` classes and 13 `text-[10px|11px]` in non-admin tsx; 14 CSS files (5.4k lines) with page-scoped skins | Tokenise remaining hex / tiny sizes (S) |
| Design-kit reference page | Done | `app/design-kit/page.tsx` returns 404 in production unless `NEXT_PUBLIC_SHOW_DESIGN_KIT=true` | none |
| Dark mode | Done | `theme-script.tsx` beforeInteractive, `suppressHydrationWarning`, `themeColor` per scheme | none |

## Section 7 - Frontend development

| Item | Status | Evidence | Action |
|---|---|---|---|
| Component reuse | Partial | Findings F1-F7: multiple testimonial sliders, 3 dead persona trees, 2 course templates | Rationalise |
| Responsive layouts | Done | Mobile-first Tailwind; `MobileContactBar`, `FilterSheet` bottom sheet, `dvh` units | none |
| Navigation / dropdowns | Done | `SiteHeader.tsx` drawer: Escape, focus trap, focus return, `aria-expanded`; `CoursesMenu.tsx` | none |
| Client-side validation | Done | `form.tsx` Field: `aria-invalid`, `aria-describedby`, required; `QuickEnquiryForm` shared; `BotTrap`; zod server-side in `/api/enquiry` | none |
| Loading states | Missing | No `loading.tsx` outside admin; `Suspense` used in only 2 files (`app/enquiry/page.tsx`, `CoursesMenu.tsx`) | Add `loading.tsx` for /courses, /centres, /blog (S) |
| Error states | Done | `app/error.tsx`, `global-error.tsx`, `not-found.tsx` (120 lines); `instrumentation-client.ts` reports window errors/rejections to `/api/client-error` | optional per-segment error.tsx |
| Empty / success states | Partial | Ad hoc inside forms, `CourseExplorer`, `CentresIndex`; no shared EmptyState | Add `kit/EmptyState` (S) |
| Browser support | Partial | No `browserslist` in package.json (Next defaults); iOS input-zoom guard script; relies on `inert`, `dvh` | Document support matrix (S) |
| Unused deps | Done | Every dep imported (grep): `@tiptap/*` only in admin `RichTextEditor` + `lib/rich/html.ts`; `@tiptap/pm` is a peer (keep); `mammoth`/`pdf-parse` only in `scripts/` as devDeps (correct); `cheerio` devDep used in scripts + 1 src file (check it is not bundled client-side); `@xenova/transformers` server-external | none |
| `'use client'` footprint | Partial | 104 of 183 non-admin tsx files are client. Root chrome is client: `SiteShell`, `SiteHeader`, `PersonaProvider`, `AccountProvider`, `ExitIntentPopup` on every page | Dynamic-import ExitIntentPopup/chatbot (S) |
| Client-exposed env | Done | NEXT_PUBLIC_ only: ALLOW_INDEXING, PERSONA_MODE, PHONE, SHOW_DESIGN_KIT, SHOW_INSPECTOR, SHOW_PLACEHOLDERS, SITE_URL, SUPABASE_URL, WHATSAPP_NUMBER/MESSAGE. No secrets | none |

## Section 12 - Performance

| Item | Status | Evidence | Action |
|---|---|---|---|
| next/image | Partial | 74 `<Image>` across 43 files vs 26 raw `<img>` (non-admin): `SiteHeader.tsx:224`, `CredibilityMarquee.tsx:108`, `RecruiterMarquee.tsx:77`, `ZoomImage.tsx`, `OfferLetterSlider.tsx` (3), `CoursePageTemplate.tsx:626`, `ExploreLanding.tsx`, `jetking-ai-client.tsx:197/212`, dead `VideoStories.tsx` | Convert raster raw imgs; add width/height (S) |
| Image config | Done | `next.config.ts`: avif+webp, remotePatterns limited to www.jetking.com; 69 `sizes=`, 24 priority/lazy attrs | none |
| Asset weight | Partial | `public/` = 42 MB: `media` 34 MB (765 webp, hashed CMS uploads), courses 2.4M, home 2.2M. Biggest file 417 KB (`home/centre-exterior.jpg`), then `courses/*.jpg` 337 KB, `placements/photos/hero-male.webp` 331 KB. No oversize files | Convert 5 JPG >300 KB to webp (S) |
| Duplicate assets | Partial | `public/courses/routing-switching-administrator.jpg` == `red-hat-professional.jpg` (identical md5) | Dedupe (S) |
| Fonts | Done | single next/font Fira_Sans, 5 weights (400-800) | Trim unused weights (S) |
| Third-party scripts | N/A / flag | No GTM or PostHog loader exists anywhere. `lib/analytics.ts:74-77` pushes to `window.dataLayer`/`window.posthog` only if present, so tracked events are no-ops. Only `<Script>` are 2 tiny inline beforeInteractive scripts (theme, iOS zoom guard) | If analytics intended, add via `next/script` afterInteractive (hand to analytics owner) |
| Caching / ISR | Partial | No `revalidate`, `unstable_cache`, `use cache` in non-admin routes; only `llms.txt` is `force-static`. `generateStaticParams` on blog/[slug], centres/[city], centres/[city]/[slug], courses/[slug], courses/[slug]/design-2. `cookies()` only in auth/chatbot libs. Static vs dynamic therefore depends on the content layer; unverified without a build | Run `next build` route table; add explicit revalidate / tag revalidation on CMS publish (M) |
| Layout shift | Partial | next/font handles fallback metrics; raw `<img>` (header logo, marquees) lack explicit dimensions | add width/height (S) |
| Bundle red flags | Partial | Zero `next/dynamic` / `import()` in non-admin src. `optimizePackageImports: ['lucide-react']` set. Chatbot client file `jetking-ai-client.tsx` ~1.5k lines; confirm it loads on demand | Lazy-load chatbot, exit popup, modals (M) |
| Response headers | Partial | HSTS, nosniff, XFO, Referrer, Permissions-Policy set; no CSP; no explicit immutable cache rule for `/media/*` hashed files | Add CSP report-only + cache header (S) |

## Section 13 - Accessibility

| Item | Status | Evidence | Action |
|---|---|---|---|
| Skip link | Done | `layout.tsx` `href="#main"`, visible on focus; `<main id="main">` | none |
| Focus styles | Done | global `:focus-visible` 2px `--focus-ring`; `outline-none` only on `FilterSheet` panel and chatbot input | verify chatbot input shows focus on its container |
| Reduced motion | Done | global rule `globals.css:691` + per-component handling in ~20 files (Carousel, marquees, Reveal, ScrollNav, TransitionLink) | none |
| Carousels / marquees | Done | `Carousel.tsx`: pause button (WCAG 2.2.2), `aria-roledescription`, `inert` off-screen slides, dots as buttons with `aria-current`; marquees have `aria-pressed` pause, hidden under `motion-reduce` | none |
| Dialogs / menus | Partial | `useDialog.ts` + radix `ui/dialog.tsx`; four backdrops are `<div aria-hidden onClick>` (fine if Escape handled) | Verify all hand-rolled modals use `useDialog` |
| Labels / form a11y | Done | `form.tsx` label + describedby + invalid; 162 `aria-label`, 25 live-region/alert/status usages | none |
| Alt text | Done | 47 `alt=""` are decorative by design | spot-check `ExploreLanding.tsx:121` partner logo |
| Contrast | Done | Tokens annotated with measured ratios; muted darkened to #5f6b7d | sync MASTER.md |
| Semantic HTML | Done | main/header/footer, JsonLd, breadcrumbs | run axe/Lighthouse in CI (S) |

## Rationalization findings

**F1 - Retired audience pages are dead at runtime.** `next.config.ts` redirects `/student`, `/parent`, `/professional` to `/` (temporary 307), so `src/app/{student,parent,professional}/page.tsx` never render. Dead subtree: `components/student/{StudentLanding,StudentTestimonialSlider}.tsx` + `student/journey/*` (8 files, ~1,330 lines), `components/parent/*` (ParentLanding 479 lines + slider), `components/professional/*` (9 files, ~700 lines), their copy files under `lib/content/copy/pages/{student,parent,professional}`, and `public/{student,parent,professional}` (11 images; recheck refs first, 3-7 src references each). KEEP: `student/RecommendedCourses.tsx` (used by ExploreLanding), `CardTrack` (home), `HeroOrbit` (Explore/Franchise; it uses `.stu-orbit-ring` from student.css - rehome rule first). Effort M; risk low-medium (redirect is "temporary so they can be brought back" - owner must confirm; git preserves).

**F2 - Orphan home components** (zero importers, grep-verified): `home/hero/StatsStrip.tsx`, `home/sections/CounsellorBand.tsx`, `home/sections/VideoStories.tsx` (has 2 raw imgs). Delete. S, low.

**F3 - Near-duplicate testimonial sliders.** `TestimonialSlider.tsx` (73), `student/`, `parent/`, `explore/ExploreTestimonialSlider` (166), `franchise/FranchiseTestimonialSliderLight` (31), `placements/PlacementsTestimonialSlider` (96), `professional/ProfessionalSocialProof` (110) all wrap `Carousel.tsx`. Student/Parent die with F1. Merge into one variant-driven component. M, low (visual diff).

**F4 - Overlapping slider/rail/marquee primitives.** `Carousel` (255), `CardTrack` (82), `centres/CardSlider` (76), `centres/PlacementSlider` (48), `courses/[slug]/SnapSlider` (54), `kit/CardRail` (50), `ScrollNav` (112), `placements/OfferLetterSlider` (288, own lightbox); three marquee copies of the `.dc-marquee` pattern (`CredibilityMarquee`, `RecruiterMarquee`, `ProfessionalPartnerMarquee` - last dies with F1). Standardise: CardRail+ScrollNav for rails, Carousel for slides, one Marquee. M-L, medium (keep a11y behaviour).

**F5 - Two course templates.** `CoursePageTemplate.tsx` (943) vs `CoursePageTemplateB.tsx` (551) behind noindex `/courses/[slug]/design-2`, which also doubles static params. Pick a winner; delete the other and route (or gate by env like design-kit). M, medium (product decision).

**F6 - Enquiry form wrappers.** `QuickEnquiryForm` is shared, but `ExploreEnquiryForm`, `FranchiseEnquiryFormLight`, `CentreHeroForm`, `app/enquiry/EnquiryForm.tsx`, `HeroEnquiryCard`, `EnquiryModal`, `EnquirySheet` each re-wrap fields. Fold into variants of one form. M, medium (lead capture: keep tracking and bot trap).

**F7 - Three UI primitive layers.** radix-dialog, cva, tailwind-merge, slot are consumed only by `ui/*` (chatbot). Migrate hand-rolled modals to `ui/dialog`/`useDialog`, or drop radix. M, medium.

**F8 - Dead CSS shipped globally.** `student.css` (234), `parent.css` (58), `professional.css` (221) are `@import`ed in `globals.css:9-12`, so ~500 lines load on every page for redirected routes. Remove with F1 after rehoming `.stu-*` rules still referenced by `app/enquiry/EnquiryForm.tsx` (comment line 41) and HeroOrbit. S, low. Also confirm `admin.css` (413) is loaded only by the admin layout (not in globals imports).

**F9 - Duplicate image** (identical courses JPG pair) plus F1-linked images. S, low.

**F10 - Provider stack on every page.** Root layout nests SiteCopy, Persona, Account, EnquirySheet providers and always mounts ExitIntentPopup and MobileContactBar. Persona is explicit-by-default, so `SilentPersonaInfer` is probably a no-op by default - verify and gate. S, low.

## Top 10 priorities

1. F1+F8: remove retired student/parent/professional components, CSS, copy, images (~3k lines; ~500 CSS lines shipped to every page). M
2. F2: delete the 3 orphan home components. S
3. Add `loading.tsx` for /courses, /centres, /blog and a shared EmptyState. S
4. Define caching: run `next build`, record static/dynamic per route, add `revalidate` or CMS-publish tag revalidation (nothing explicit today). M
5. F5: decide course template A vs B; remove loser and `design-2`. M
6. Lazy-load chatbot, ExitIntentPopup, modals with `next/dynamic` (none used today). M
7. F3: collapse testimonial sliders into one component. M
8. Update `design-system/MASTER.md` (dark mode, token values). S
9. F6/F7: unify enquiry-form wrappers and modal primitives (test lead capture). M
10. Asset hygiene: dedupe course JPG, convert >300 KB JPGs, immutable cache header for `/media`, width/height on raw imgs, decide on GTM/PostHog loader (analytics currently no-ops). S
