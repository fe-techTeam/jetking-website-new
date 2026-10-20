# Data flows — content, leads, chatbot

End-to-end pictures of how data moves through the Jetking platform.

---

## 1. Content truth diagram

```mermaid
flowchart TB
  subgraph Writers
    Admin[Admin editors]
    Fixtures[Repo fixtures<br/>developers]
  end

  subgraph Stores
    PG[(Postgres CMS + ops)]
    File[data/cms/store.json]
    FixFiles[src/lib/content/fixtures]
  end

  subgraph Readers
    Site[Public pages]
    ChatStruct[resolveCourse / Centre / Placement]
    Index[build:chatbot-index]
  end

  Admin --> PG
  Admin --> File
  Fixtures --> FixFiles
  PG --> Site
  File --> Site
  FixFiles --> Site
  PG --> ChatStruct
  File --> ChatStruct
  FixFiles --> ChatStruct
  Site --> Index
  FixFiles --> Index
```

**Invariant:** chatbot structured answers and marketing pages should agree because both call `content.listCourses()` / `getPlacementsPage()` / centre loaders.

---

## 2. CMS collection write path (detail)

```mermaid
sequenceDiagram
  participant Browser
  participant RSC as Admin page RSC
  participant Action as Server Action
  participant Zod as schemas.ts
  participant Store as cms/store.ts
  participant DB as Postgres or file JSON
  participant Audit as audit_log

  Browser->>RSC: Open /admin/courses/[slug]
  RSC->>Store: load record
  Store->>DB: select
  DB-->>Browser: Editor form
  Browser->>Action: save({...fields, status})
  Action->>Zod: parse
  alt invalid
    Zod-->>Browser: field errors
  else valid
    Action->>Store: upsert
    Store->>DB: write
    Action->>Audit: insert
    Action-->>Browser: success + revalidate tags
  end
```

---

## 3. Enquiry / lead intake

**Dual write:** every live path stores a row in `leads` (admin panel) first, then calls shared [`src/lib/leads/crm-handoff.ts`](../src/lib/leads/crm-handoff.ts) so the same lead is pushed to the external CRM when configured.

```mermaid
flowchart TB
  subgraph Clients
    EF[EnquiryForm]
    HE[HeroEnquiryCard]
    CF[Centre forms]
    LF[Chat lead form]
    JS["POST /api/journey/save"]
    AD[Admin Add lead]
  end

  API["POST /api/enquiry"]
  Val[Zod + rate limit + optional OTP]
  Save[saveEnquiry → leads]
  Act[(lead_activities)]
  Hand["handoffLeadToCrm"]
  Ext[Smartrain / generic CRM_ENDPOINT]
  Log[Server log if no CRM]

  EF --> API
  HE --> API
  CF --> API
  LF --> API
  API --> Val --> Save
  JS --> Save
  AD --> Save
  Save --> Act
  Save --> Hand
  Hand -->|CRM_ENDPOINT set| Ext
  Hand -->|unset| Log
```

| Field group | Examples |
| --- | --- |
| Identity | name, phone, email |
| Intent | courseInterest, courseSlug, qualification |
| Location | city, state, centreSlug |
| Attribution | utm_*, landingPage, form, source |
| Ops | status, assignedTo, followUpAt, crmStatus (`none` / `routed` / `skipped` / `failed` / …) |

| Path | Admin `leads` | CRM hand-off |
| --- | --- | --- |
| `/api/enquiry` (all public forms + chatbot) | Yes | Yes via `handoffLeadToCrm` |
| `/api/journey/save` (soft save) | Yes | Yes when CRM can accept the payload |
| Admin → Add lead | Yes | Yes (same hand-off; centre staff scoped centre used when present) |
| Admin CSV Import | Yes | No — archival only, avoids flooding CRM |

Smartrain (`CRM_PROVIDER=smartrain`) requires email + a CRM-mapped centre; incomplete leads stay in admin with `crmStatus: skipped`.

---

## 4. Chatbot factual answer path

```mermaid
flowchart TB
  Msg[User text]
  Guard[guardMessage]
  Sess[CounsellingSession cookie/state]
  Intent[detectWants + detectSubject]
  R1[resolveCentreAnswer]
  R2[resolveCourseAnswer]
  R3[resolvePlacementAnswer]
  Sem[semanticSearch]
  Rank[rankHits demote SEO chrome]
  Gen[Ollama JSON blocks OR passagesAnswer]

  Msg --> Guard --> Sess --> Intent
  Intent --> R1 --> R2 --> R3 --> Sem --> Rank --> Gen
```

### What each resolver guarantees

| Resolver | Source of truth | Never does |
| --- | --- | --- |
| `resolveCentreAnswer` | Centres / cities CMS | Invent addresses |
| `resolveCourseAnswer` | `listCourses()` | Quote undisclosed fees; list competitor institutes |
| `resolvePlacementAnswer` | `getPlacementsPage()` | Promise job guarantees |
| `guardMessage` guarantee branch | Fixed honest copy | Echo “100% placement” SEO |

Embeddings file: `src/content/jetking-embeddings.json` (rebuild: `npm run build:chatbot-index`).

---

## 5. Auth cookie map

```mermaid
flowchart LR
  subgraph Cookies
    A[jk_admin_session]
    U[jk_user_session]
  end
  A --> Admin[/admin]
  U --> Account[/account + /chatbot]
```

Secrets are **separate** on purpose so rotating one surface does not invalidate the others. Visitor signup/login detail: **[AUTH.md](./AUTH.md)**.

---

## 6. Postgres tables (ops)

```mermaid
erDiagram
  admin_users ||--o{ leads : assigns
  leads ||--|{ lead_activities : has
  admin_users {
    uuid id
    string email
    string role
    string centre_slug
    int session_version
  }
  leads {
    uuid id
    string status
    string centre_slug
    string crm_status
  }
  lead_activities {
    uuid id
    uuid lead_id
    string kind
  }
  otp_challenges {
    uuid id
    string phone
  }
  media_assets {
    uuid id
    bytes data
  }
  redirects {
    string from_path
    string to_path
  }
```

CMS collections may live as JSON documents in Postgres or the file store; the Drizzle schema in `src/lib/db/schema.ts` is authoritative for **ops** tables. Run `npm run db:migrate` after pull.

---

## 7. Revalidation

```mermaid
flowchart LR
  Hook[CMS save / ingest hook]
  API["POST /api/revalidate<br/>REVALIDATE_SECRET"]
  Cache[Next cache tags / paths]
  Hook --> API --> Cache
```

Without calling revalidate, ISR/static pages update on the next natural revalidation or redeploy — dynamic reads still see new CMS data when the store is queried per request.

---

## 8. Related

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AUTH.md](./AUTH.md)
- [CHATBOT.md](./CHATBOT.md)
- [SHARED_DATABASE.md](./SHARED_DATABASE.md)
