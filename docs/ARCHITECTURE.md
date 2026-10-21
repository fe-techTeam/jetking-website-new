# System architecture

## 1. What this platform is

A **single Next.js 16 App Router** project that includes:

| Surface | URL | Who uses it |
| --- | --- | --- |
| Marketing / career website | `/`, `/courses`, `/centres`, … | Public visitors |
| Staff CMS + CRM | `/admin` | Admins, editors, centre staff |
| Jetking AI assistant | `/chatbot` (CMS **Show on website**; otherwise 404) | Public visitors |
| Public APIs | `/api/*` | Enquiry, chat, auth, OTP, revalidate |

There is **one codebase, one deploy**. Content is not cloned into a separate headless CMS product — the admin panel *is* the CMS.

---

## 2. High-level architecture

```mermaid
flowchart TB
  Browser[Visitor / Staff browser]

  subgraph Next["Next.js application"]
    Proxy["src/proxy.ts<br/>edge hints"]
    Pages["App Router pages<br/>src/app/**"]
    Admin["Admin App Router<br/>src/app/(admin)/admin/**"]
    API["Route handlers<br/>src/app/api/**"]
    Content["ContentSource<br/>src/lib/content"]
    ChatAI["Jetking AI<br/>src/features/jetking-ai"]
  end

  subgraph Storage
    Files["data/cms + fixtures<br/>(no DATABASE_URL)"]
    PG[(Postgres via Drizzle<br/>DATABASE_URL)]
    Emb["jetking-embeddings.json<br/>+ BM25 corpus"]
  end

  External[[Optional: CRM · Ollama · OpenAI · SMS OTP]]

  Browser --> Proxy --> Pages
  Browser --> Admin
  Browser --> API
  Pages --> Content
  Admin --> Content
  Admin --> PG
  Content -->|CONTENT_SOURCE=admin| Files
  Content -->|CONTENT_SOURCE=admin + DB| PG
  API --> ChatAI
  ChatAI --> Emb
  ChatAI --> Content
  API -->|enquiry / journey| PG
  API --> External
```

---

## 3. Technology stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 + Jetking design tokens (`src/styles`) |
| Public content API | `ContentSource` (`local` fixtures **or** `admin` CMS) |
| CMS persistence | File store under `data/cms/` **or** Postgres collections |
| Leads / staff / OTP / media bytes | Postgres + Drizzle (`src/lib/db/schema.ts`) |
| Chatbot retrieval | Local embeddings (`@xenova/transformers`) + BM25 |
| Chatbot wording | Ollama by default (`GUIDE_PROVIDER=local`); OpenAI opt-in |
| Auth (admin) | Signed cookie `jk_admin_session` |
| Auth (site / chatbot) | Separate cookies: `jk_user_session`, `jk_chat_session` |
| Audience paths (student/parent/professional) | **Removed from IA** — URLs 301 to `/` |
| Hosting | Vercel (primary) or Node standalone (`BUILD_STANDALONE=true`) |

---

## 4. Request lifecycle (public page)

```mermaid
sequenceDiagram
  participant U as User
  participant P as proxy.ts
  participant R as React Server Component page
  participant CS as ContentSource
  participant Store as CMS / fixtures

  U->>P: GET /courses/bca-...
  P->>R: Forward request
  R->>CS: getCourse(slug), page copy, SEO
  CS->>Store: published records only
  Store-->>CS: Course + copy
  CS-->>R: Typed content
  R-->>U: Canonical HTML (same for crawlers and visitors)
```

**SEO rule:** one canonical HTML document per URL (no cloaking). The site does **not** ship separate student/parent/professional experiences; old paths redirect home.

---

## 5. ContentSource — single read API

All public pages and many chatbot resolvers call `content.*` from `src/lib/content`.

```mermaid
flowchart LR
  ENV["CONTENT_SOURCE env"]
  ENV -->|local| FIX[fixtures in src/lib/content/fixtures]
  ENV -->|admin default| CMS[listCollection / CMS store]
  CMS -->|no DATABASE_URL| FILE[data/cms/store.json]
  CMS -->|DATABASE_URL| PG[(cms_* tables)]
  FIX --> API[ContentSource methods]
  FILE --> API
  PG --> API
  API --> Pages[Pages / Chat / Enquiry]
```

| Method examples | Used by |
| --- | --- |
| `listCourses()`, `getCourse(slug)` | `/courses`, centre featured, chatbot course answers |
| `listCentres()`, `getCity()` | `/centres`, maps, enquiry centre pickers |
| `getPlacementsPage()` | `/placements`, chatbot placement answers |
| `getPageCopyOverrides(id)` | Headings/CTAs editable in **Page text** |
| `getSeoSettings()` | `robots.ts`, sitemap behaviour |

Draft records are **never** returned to the public site (`publishedOnly: true`).

---

## 6. Admin write path

```mermaid
flowchart TB
  Editor[Staff in /admin]
  Form[Zod-validated editor]
  Action[Server actions<br/>admin/actions + collection actions]
  Store[CMS store write]
  Audit[audit_log]
  Reval["/api/revalidate optional"]

  Editor --> Form --> Action
  Action --> Store
  Action --> Audit
  Action -.-> Reval
  Store --> Public[Next public read on next request]
```

Publish semantics: each collection row has a `status` (`draft` | `published`). Only published rows appear on the website.

---

## 7. Chatbot answer pipeline

Public availability is CMS-managed: **Admin → Assistant settings → Show on website** (`chatbot_settings.enabled`). When off, `/chatbot` and `/api/chat` are unavailable (404) and all public links stay hidden — see [CHATBOT.md](./CHATBOT.md).

```mermaid
flowchart TB
  Gate{CMS Show on website?}
  Q[User message]
  G[conversation-guard<br/>greeting / injection / guarantee / competitor]
  Loc[resolveCentreAnswer]
  Demo[Fixed demo booking + lead form]
  Course[resolveCourseAnswer<br/>catalogue / fees / compare]
  Place[resolvePlacementAnswer]
  Search[semanticSearch + rankHits]
  LLM[Ollama or passages fallback]

  Gate -->|no| Off[404 / no public links]
  Gate -->|yes| Q
  Q --> G
  G -->|reply| Out[Response]
  G -->|continue| Loc
  Loc -->|location ask| Out
  Loc -->|else| Demo
  Demo -->|wantDemo| Out
  Demo --> Course
  Course -->|hit| Out
  Course -->|miss| Place
  Place -->|hit| Out
  Place -->|miss| Search
  Search --> LLM --> Out
```

Structured resolvers use the **same catalogue / placements content** as the website so fees, eligibility, and “100% placement” SEO blobs cannot invent facts.

Default model policy: `GUIDE_PROVIDER=local` — **no OpenAI required**. See [CHATBOT.md](./CHATBOT.md).

---

## 8. Leads & enquiry

Live paths dual-write: **admin `leads` table first**, then shared [`src/lib/leads/crm-handoff.ts`](../src/lib/leads/crm-handoff.ts) to the external CRM.

```mermaid
flowchart LR
  F1[Enquiry form]
  F2[Centre / home CTAs]
  F3[Chatbot lead form]
  F4[Admin Add lead]
  API["/api/enquiry<br/>/api/journey/save"]
  DB[(leads + lead_activities)]
  Hand[handoffLeadToCrm]
  CRM[CRM_ENDPOINT]
  AdminUI["/admin/leads"]

  F1 --> API
  F2 --> API
  F3 --> API
  F4 --> DB
  API --> DB
  DB --> Hand
  F4 --> Hand
  Hand --> CRM
  DB --> AdminUI
```

Without `DATABASE_URL`, enquiries cannot be stored in the panel (logged only). Production should set Postgres **and** `CRM_ENDPOINT` (plus `CRM_PROVIDER=smartrain` when using Smartrain).

---

## 9. Security boundaries

```mermaid
flowchart TB
  subgraph Public_ok
    Pages
    Chat
    Enquiry
  end
  subgraph Staff_only
    Admin["/admin/*"]
  end
  subgraph Secrets
    S1[ADMIN_SESSION_SECRET]
    S2[USER_SESSION_SECRET]
    S3[CHATBOT_SESSION_SECRET]
    S4[OTP_SECRET / SMS keys]
  end

  Admin -->|requires| S1
  Pages -.->|optional accounts| S2
  Chat -.->|optional accounts| S3
```

| Role | Access |
| --- | --- |
| `admin` | Full CMS, leads, team, audit |
| `editor` | Content + all leads; no team management |
| `centre_staff` | Leads for assigned `centreSlug` only |

Production refuses to boot with default admin passwords / missing session secrets.

---

## 10. Key directories

```
src/
├── app/                    # Routes: public, (admin), api
├── components/             # Marketing UI
├── features/jetking-ai/    # Chat orchestration + resolvers
├── features/knowledge/     # Embeddings / index
├── lib/content/            # ContentSource, fixtures, copy
├── lib/cms/                # Admin store, schemas
├── lib/db/                 # Drizzle schema
├── lib/auth/               # Admin sessions & roles
├── persona/                # Legacy helpers only — not a live product feature
└── styles/                 # Design tokens
drizzle/migrations/         # Postgres migrations
data/cms/                   # File-backed CMS when no DB
docs/                       # This documentation set
```

---

## 11. Related docs

- [PUBLIC_WEBSITE.md](./PUBLIC_WEBSITE.md) — page map and rendering
- [ADMIN_CMS.md](./ADMIN_CMS.md) — staff workflows
- [DATA_FLOWS.md](./DATA_FLOWS.md) — end-to-end data
- [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md) — hosting
