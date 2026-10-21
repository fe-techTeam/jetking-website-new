# Environment variables — reference

Everything that differs between machines (local, staging, production) is an environment variable, so
nothing needs a code change to deploy. This page explains the groups; the copy-paste templates are:

| File | Use |
| --- | --- |
| [`.env.production.example`](../.env.production.example) | What to set in **Vercel → Environment Variables → Production**. Three sections: required, recommended, optional (commented defaults). |
| [`.env.example`](../.env.example) | Local development (`cp .env.example .env.local`). |

**Rules**

- Real values go only in Vercel (mark secrets **Sensitive**) or a local, git-ignored `.env.local` — never in a committed file.
- `NEXT_PUBLIC_*` values are public and baked into the build: **redeploy after changing one**.
- A test (`tests/env-documented.test.ts`) fails if code reads a variable that is not listed in `.env.production.example`, so the template cannot drift.
- Scripts such as `npm run db:migrate` read `.env.local` / `.env` themselves (shell variables win).

## 1. Required

| Variable | Purpose |
| --- | --- |
| `SITE_URL`, `NEXT_PUBLIC_SITE_URL` | Public address (canonicals, sitemap, links in emails) |
| `PERSONA_COOKIE_SECRET`, `REVALIDATE_SECRET`, `ADMIN_SESSION_SECRET`, `USER_SESSION_SECRET`, `CHATBOT_SESSION_SECRET` | Five different random secrets; the server will not start in production without them |
| `ADMIN_PASSWORD` | Shared admin password — only used when there is **no** `DATABASE_URL` |
| `CONTENT_SOURCE` (`admin`) | Site reads published CMS content |
| `NEXT_PUBLIC_SHOW_PLACEHOLDERS` (`false`) | Hide "To be updated" tiles |
| `RATE_LIMIT_ALLOW_MEMORY` (`true`) | Accept the in-memory rate limiter (single instance / serverless) |

## 2. Recommended

| Group | Variables | What it enables |
| --- | --- | --- |
| Database | `DATABASE_URL`, `DATABASE_SSL` | Personal staff accounts and **custom roles**, leads inbox, audit log, OTP, centres/cities tables. Then run `npm run db:migrate` and `npm run seed:locations`. |
| Contact | `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_WHATSAPP_MESSAGE` | Call / WhatsApp buttons |
| CRM | `CRM_PROVIDER`, `CRM_ENDPOINT` (`CRM_API_KEY`) | Forward enquiries to Smartrain |
| Email | `MAIL_DRIVER=smtp`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_NAME`, `MAIL_ENCRYPTION`, `NEXT_PUBLIC_EMAIL_RESET_ENABLED` | Staff welcome / password emails and the visitor "reset password" link (see [AUTH.md](./AUTH.md)). Off unless `MAIL_DRIVER=smtp`. Gmail needs an **App Password**. |
| AI | `OPENAI_API_KEY`, `GUIDE_ENABLED`, `GUIDE_PROVIDER`, `GUIDE_MODEL` | Jetking AI composed answers (without a key it answers from the knowledge base) |

## 3. Optional (all have defaults)

| Group | Variables | Notes |
| --- | --- | --- |
| Mobile OTP | `OTP_ENABLED` + `NEXT_PUBLIC_OTP_ENABLED` (set together), `OTP_SECRET`, `SMS_AUTH_KEY`, `SMS_OTP_TEMPLATE_ID`, `SMS_SENDER_ID`, `SMS_ROUTE`, `SMS_ENDPOINT` | Needs `DATABASE_URL`. Never set `OTP_DEV_ECHO` in production. |
| Tracking | `NEXT_PUBLIC_TRACKING_ENABLED`, `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA_IDS`, `NEXT_PUBLIC_META_PIXEL_IDS`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | The live site's GTM, GA4, Google Ads and Meta pixels are the built-in defaults. They load **only** in a production build that is indexable (`NEXT_PUBLIC_ALLOW_INDEXING` not `false`). An empty value turns that tag off. |
| Search engines | `NEXT_PUBLIC_ALLOW_INDEXING` | Set `false` on staging / preview |
| Site details | `NEXT_PUBLIC_HELPLINE`, `NEXT_PUBLIC_SOCIAL_FACEBOOK` / `_INSTAGRAM` / `_YOUTUBE` / `_LINKEDIN` / `_TWITTER` | Defaults are the published Jetking values |
| Security headers | `CSP_SCRIPT_SRC`, `CSP_CONNECT_SRC`, `CSP_FRAME_SRC`, `CSP_IMG_SRC`, `IMAGE_REMOTE_HOSTS` | Add a host here when a new third-party script / API / frame / image needs one. Malformed values are ignored. |
| Operations | `TRUSTED_PROXY_HOPS`, `RATE_LIMIT_STORE`, `REDIS_URL`, `LOG_LEAD_PAYLOADS`, `ERROR_WEBHOOK_URL`, `MAIL_FROM_ADDRESS` | `LOG_LEAD_PAYLOADS=false` keeps lead details out of logs |
| Assistant tuning | `OPENAI_BASE_URL`, `PLANNER_MODEL`, `PERSONA_INFER_MODEL`, `NEXT_PUBLIC_PERSONA_MODE`, `OLLAMA_*`, `JK_*` | Change only when evaluating answer quality; `npm run build:chatbot-index` uses `JK_EMBED_DIM` / `JK_EMBED_BATCH` |
| Legacy | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Old storage path; leave unset |

## Never set in production

`NEXT_PUBLIC_SHOW_INSPECTOR`, `NEXT_PUBLIC_SHOW_DESIGN_KIT`, `OTP_DEV_ECHO`, `BUILD_STANDALONE`.

## Where each is read

| Area | Code |
| --- | --- |
| Public values (`NEXT_PUBLIC_*`) | `src/lib/config/env.ts`, `src/lib/site.ts`, `src/lib/social.ts`, `src/lib/tracking.ts` |
| Server-only values | `src/lib/config/env.server.ts`, `src/lib/mail/`, `src/lib/otp/`, `src/lib/crm/` |
| Security headers / image hosts | `next.config.ts` |
| OpenAI endpoint | `src/lib/config/openai.ts` |

Related: [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) · [AUTH.md](./AUTH.md) · [INDEX.md](./INDEX.md)
