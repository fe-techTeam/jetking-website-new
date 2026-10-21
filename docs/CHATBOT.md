# Jetking Assistant

> Platform context: [ARCHITECTURE.md](./ARCHITECTURE.md) §7 · [DATA_FLOWS.md](./DATA_FLOWS.md) §4 · [docs/INDEX.md](./INDEX.md)

A search-and-answer entry point for the Jetking website. Ask a question in plain language and
get back a **structured answer page** — headline, summary, matching course cards, centre
cards, key-details tables, FAQs, contact actions, and citations to the exact site pages the
answer came from.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4, styled with
the Jetking website's own design tokens and type pairing.

**Fully local. No paid model API and no request-time site fetching.** A hybrid dense/BM25
retriever grounds Jetking answers in a committed site snapshot, while a local Ollama model
writes the response. Questions outside the Jetking corpus can use the same local model's
general knowledge; Jetking-specific facts are never allowed to come from that fallback.

### Show / hide on the live site (CMS)

**Admin → Assistant settings → Show on website** (`chatbot_settings.enabled`) is the single
switch (helper: `src/lib/chatbot/availability.ts`). When off:

- every public link is hidden (header, Ask Jetking AI, FAQ, sitemap, account chats)
- courses “guidance” nudges fall back to enquiry instead of `/chatbot`
- `/chatbot` returns 404
- `/api/chat` and conversation APIs return 404

Greeting copy and custom answers stay editable in the admin even while the assistant is hidden.
Publish after changing the switch so the site layout refreshes.

---

## Getting started

```bash
npm install
npm run sync:content    # crawl the site -> src/content/jetking-kb.json  (required once)
npm run build:index     # rebuild the local retrieval index
npm run model:setup     # pull and create the Ollama jetking-assistant model
npm run model:check     # smoke-test general, grounded, and Hinglish answers
npm run dev             # http://localhost:3000
```

`sync:content` defaults to `http://localhost:3000` — the Jetking site running locally. Point
it anywhere with `JK_ORIGIN`:

```bash
JK_ORIGIN=https://www.jetking.com npm run sync:content
```

| Script                  | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `npm run dev`           | Dev server (Turbopack)                                   |
| `npm run build`         | Production build; fails on any type error                |
| `npm run sync:content`  | Crawl the site and rebuild the knowledge base            |
| `npm run check:answers` | Print composed answers for sample questions, no browser  |
| `npm run model:setup`   | Pull and create the local `jetking-assistant` model       |
| `npm run model:check`   | Smoke-test general, grounded, and Hinglish model replies  |
| `npm run eval:retrieval` | Measure retrieval and off-topic gating quality          |
| `npm run typecheck`     | `tsc --noEmit`                                           |
| `npm run lint`          | ESLint (flat config, Next + React Compiler rules)        |
| `npm run verify`        | typecheck + lint + format check                          |

---

## How an answer is produced

```
  user question
       |
       +-- infer intent, subject, persona, and follow-up context
       |
       +-- hybridSearch()       multilingual embeddings + BM25 + city entities
       |
       +-- confidence gate
              |
              +-- verified Jetking match -> focused passages -> local Ollama
              |                                |
              |                                +-- sensitive-fact validation
              |                                      |
              |                                      +-- valid -> model answer
              |                                      +-- invalid -> passage fallback
              |
              +-- no verified match -> local general model
                                       (or honest no-match if Ollama is offline)
```

The sensitive-fact validator does not rely on prompt obedience. Currency amounts, percentages,
durations, phone numbers, placement guarantees, and headline counts in a generated Jetking
answer must also exist in the retrieved context. Unsupported claims are discarded and replaced
with deterministic passage formatting.

---

## Local model and answer coverage

Install Ollama first, then run `npm run model:setup`. The setup creates a reproducible
`jetking-assistant` profile from `llama3.2:3b`. Factual Jetking knowledge deliberately stays
in the retrieval index instead of being baked into model weights, so content updates remain
fast, inspectable, and reversible.

The API uses two answer paths:

1. **Verified Jetking match:** retrieve the strongest local passages and ask Ollama to answer
   only from that context.
2. **No verified Jetking match:** when `JK_ALLOW_GENERAL_ANSWERS=true`, ask Ollama for a general
   answer while explicitly forbidding unverified Jetking claims. If Ollama is unavailable, the
   assistant keeps the honest no-match response.

The local model is not available inside a standard Vercel function at `localhost`. A deployed
app needs a private, reachable Ollama host in `OLLAMA_BASE_URL`; otherwise Vercel continues to
serve retrieval-only answers.

---

## Content sync

`scripts/sync-content.mts` crawls the site and writes a typed knowledge base to
`src/content/jetking-kb.json`, which is committed. The app never fetches the site at build or
request time.

```bash
npm run sync:content                # incremental
npm run sync:content -- --no-cache  # force re-fetch of every page
npm run sync:content -- --force     # write even if the crawl looks degraded
```

It crawls the section pages, then discovers and crawls every course and centre page — with a
second pass for centres, because centre pages cross-link to cities the section pages never
mention. From ~79 pages it extracts:

| Record    | Extracted from                                                    |
| --------- | ----------------------------------------------------------------- |
| `courses` | `<h1>` + the `dt`/`dd` list (Duration, Eligibility, Fees, Payment) |
| `centres` | Centre list items and programme lists, both page templates        |
| `faqs`    | Accordion `<button>` questions paired with the answer that follows |
| `chunks`  | Every `p`/`li`/`dt`/`dd` in document order, tagged with its heading |
| `stats`   | Headline numbers, e.g. "100% Job guarantee"                        |

Three behaviours exist because of how the site actually renders:

- **FAQ questions live in accordion buttons**, not headings, so `button` is part of the
  document-order walk — filtered to text ending in `?`.
- **Centre names concatenate with their locality** (`"Jetking BhawaniporeBhawanipore"`)
  because `.text()` joins adjacent inline elements with no separator. `splitCentreName()`
  finds the split point where the tail is also a suffix of the head.
- **A degraded crawl refuses to write.** If a run returns no courses, or loses more than 40%
  of the previous run's pages/chunks/courses, the script exits non-zero and leaves the
  committed file untouched. Without this, one failed run silently empties the knowledge base.

Remote origins are crawled slowly (1 request at a time, 2.5s apart, exponential backoff on
429) and cached to `.cache/crawl/`, so a rate-limited crawl makes forward progress across
several attempts instead of restarting from zero.

---

## Architecture

Organised by **feature**, not by file type.

```
src/
├── app/                          # routing only
│   ├── layout.tsx                #   fonts, metadata, providers, no-flash theme script
│   ├── globals.css               #   the whole design token system
│   └── (app)/                    #   page shell: /, /c/[id], /projects, /artifacts
│
├── components/
│   ├── ui/                       # Button, Dialog, DropdownMenu, Tooltip, ConfirmDialog…
│   ├── layout/                   # AppShell, PlaceholderPage
│   ├── providers/                # theme store + provider composition root
│   └── brand/                    # JetkingMark
│
├── features/
│   ├── knowledge/                # the answer engine
│   │   ├── components/           #   AnswerPageView, blocks, CourseCard, SyncStatus
│   │   ├── lib/                  #   bm25 · tokenize · index-builder · intent · answer · engine
│   │   └── types/                #   KnowledgeBase + AnswerPage schemas
│   ├── chat/                     # conversation shell: store, composer, message list
│   └── sidebar/                  # history, search, navigation
│
├── content/jetking-kb.json       # the crawled knowledge base (generated, committed)
├── hooks/                        # useMounted, useMediaQuery, useHotkey, useAutosizeTextarea
└── lib/                          # config · constants · storage · utils

scripts/
├── sync-content.mts              # the crawler
├── check-answers.mts             # answer-quality harness
├── fixtures/sample-kb.json       # regression fixture (NOT the knowledge base)
└── alias-hooks.mjs               # teaches Node the `@/*` alias so scripts can import app code
```

### Design tokens

`globals.css` defines three layers; components may only touch the third:

1. **Primitives** — `--color-jk-*` (the brand red, `#ea1c24`) and `--color-gray-*`, copied
   from the Jetking site's own stylesheet along with its radii and shadow scale.
2. **Semantic** — `--canvas`, `--surface`, `--ink`, `--brand`, `--line`…, redefined under
   `.dark` (canvas `#0b111e`, cards `#101828`).
3. **Utilities** — the semantic layer re-exported through `@theme inline`, so components
   write `bg-canvas` / `text-ink-muted` / `border-line` and get both themes for free.

Type is the site's pairing: **Bricolage Grotesque** for headings, **Plus Jakarta Sans** for
body. Theme is a `.dark` class on `<html>`, applied by a blocking script in `<head>` before
first paint, so dark-mode users never see a white flash.

### State

`zustand` with a **normalised** shape — `conversations` and `messages` are keyed maps, and a
conversation holds an ordered `messageIds` array. Reads go through `store/selectors.ts`.

- **Selectors return store objects, never freshly built ones.** `useShallow` compares
  element-by-element with `Object.is`; a selector that constructed new objects would never
  compare equal and would re-render in a loop under zustand v5. Derived shapes go in
  `useMemo` at the call site.
- **Persistence is batched.** `lib/storage/debounced-storage.ts` coalesces `localStorage`
  writes onto a trailing timer and flushes on `pagehide`.
- The in-flight `AbortController` lives at module scope — it is neither serialisable nor
  comparable, so it must never reach persistence or a render.

---

## What works

- Plain-language questions answered as structured pages, with per-answer confidence
- Course cards with duration, category and eligibility, linking to the real course page
- Centre cards covering all 51 city and branch pages, matched by city name
- Key-details tables carrying the site's own Duration / Eligibility / Fees / Payment values
- FAQ, statistics and contact blocks composed per intent, with an "Enquire now" action
- Source citations to the exact site paths used
- Suggested follow-up questions, asked in the same thread on click
- General local-model answers for off-topic questions, with an honest no-match fallback when
  Ollama is unavailable
- Conversation history: auto-derived titles, recency grouping, starring, rename, delete,
  full-text search
- Copy an answer as plain text; edit a question to re-ask and truncate the thread
- Collapsible sidebar with icon rail, off-canvas drawer on mobile
- Light / dark / system themes, `⌘\` sidebar toggle, `⌘K` new chat

## Deliberately out of scope

Auth, a paid/cloud LLM API, file upload/parsing (attachments capture metadata only), and the Projects
and Artifacts surfaces, which render honest empty states rather than pretending to work.
