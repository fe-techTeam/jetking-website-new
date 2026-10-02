/**
 * Handover notes — Phase 1 go-live checklist
 *
 * Run after UAT on staging. Do not treat this as optional reading.
 */

/*
## Cutover
1. CONTENT_SOURCE=admin on production
2. OPENAI_API_KEY + GUIDE_MODEL=gpt-4o set
3. Apply supabase/migrations/20260331000000_init.sql
4. npm run migrate:cms (or import from Admin) then npm run build:chatbot-index
5. ADMIN_PASSWORD rotated; REVALIDATE_SECRET set
6. DNS TTL lowered; rollback = previous Vercel deployment + redirects.json

## SEO
- npm run verify:seo -- --base https://www.jetking.com
- Submit sitemap; request indexing for top 20 URLs
- Monitor Search Console coverage 14 days

## Training
- Admin: /admin — courses, variants, persona rules
- Rules example: IF location=Mumbai AND interest=AI AND returning THEN variant=ai-mumbai
- Jetking AI answers Jetking facts only from the KB
- Dashboards: persona × enquiry funnel in PostHog + GA4
*/
