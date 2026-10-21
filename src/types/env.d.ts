/**
 * Environment variables this app reads.
 *
 * Declaring them as real properties (rather than leaning on ProcessEnv's index
 * signature) does two things: `process.env.NEXT_PUBLIC_SITE_URL` becomes legal
 * under `noPropertyAccessFromIndexSignature`, and Next can statically find and
 * inline the NEXT_PUBLIC_* reads into the client bundle. Bracket access is not
 * reliably inlined, so a client component would silently fall back to defaults.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /* ---- Public: safe to expose, inlined into the browser bundle ---------- */

    /** Public origin of the Jetking website that answers link to. */
    NEXT_PUBLIC_SITE_URL?: string;
    /** WhatsApp contact number in international format, digits only. */
    NEXT_PUBLIC_WHATSAPP_NUMBER?: string;
    /** Pre-filled WhatsApp message. */
    NEXT_PUBLIC_WHATSAPP_MESSAGE?: string;
    /** National enquiry line, E.164. */
    NEXT_PUBLIC_PHONE?: string;
    /** National toll-free helpline; defaults to the published Jetking number. */
    NEXT_PUBLIC_HELPLINE?: string;
    /** Social profile URLs; each defaults to the official Jetking profile. */
    NEXT_PUBLIC_SOCIAL_FACEBOOK?: string;
    NEXT_PUBLIC_SOCIAL_INSTAGRAM?: string;
    NEXT_PUBLIC_SOCIAL_YOUTUBE?: string;
    NEXT_PUBLIC_SOCIAL_LINKEDIN?: string;
    NEXT_PUBLIC_SOCIAL_TWITTER?: string;
    /** 'true' shows "email me a reset link" in the visitor password-reset dialog (needs MAIL_* on the server). */
    NEXT_PUBLIC_EMAIL_RESET_ENABLED?: string;
    /** Analytics/ad tags (default: the ones jetking.com runs); empty switches one off. Production + indexable builds only. */
    NEXT_PUBLIC_TRACKING_ENABLED?: string;
    NEXT_PUBLIC_GTM_ID?: string;
    NEXT_PUBLIC_GA_IDS?: string;
    NEXT_PUBLIC_META_PIXEL_IDS?: string;
    /** Public Supabase project URL, used by the browser Supabase client. */
    NEXT_PUBLIC_SUPABASE_URL?: string;
    /** Shows the debug/dev inspector UI when set. */
    NEXT_PUBLIC_SHOW_INSPECTOR?: string;
    /** 'adaptive' turns on silent persona inference; unset (default) = audiences apply only when a visitor picks one. */
    NEXT_PUBLIC_PERSONA_MODE?: string;
    /** Allows search-engine indexing when set (off by default on non-prod deploys). */
    NEXT_PUBLIC_ALLOW_INDEXING?: string;

    /* ---- Server only ------------------------------------------------------ */

    /** Private origin fallback some server code still reads directly; prefer
     *  NEXT_PUBLIC_SITE_URL for anything reachable from client components. */
    SITE_URL?: string;
    /** 'local' (repo fixtures) | 'admin' (data/cms/store.json / Supabase). */
    CONTENT_SOURCE?: string;
    /** HMAC signing key for the persona cookie — required in production. */
    PERSONA_COOKIE_SECRET?: string;
    /** Model used for silent LLM-assisted persona inference. */
    PERSONA_INFER_MODEL?: string;
    /** Staff/admin CMS login password — required in production. */
    ADMIN_PASSWORD?: string;
    /** Bearer token required by /api/revalidate in production. */
    REVALIDATE_SECRET?: string;
    /** Supabase service-role key — full-privilege, server-only. */
    SUPABASE_SERVICE_ROLE_KEY?: string;
    /** Outgoing SMTP email — see src/lib/mail. Off unless MAIL_DRIVER is 'smtp'. */
    MAIL_DRIVER?: string;
    MAIL_HOST?: string;
    MAIL_PORT?: string;
    MAIL_USERNAME?: string;
    MAIL_PASSWORD?: string;
    MAIL_FROM_NAME?: string;
    MAIL_FROM_ADDRESS?: string;
    /** 'TLS' (STARTTLS), 'SSL' (implicit) or 'NONE'. */
    MAIL_ENCRYPTION?: string;
    /** OpenAI-compatible API base URL (proxy / gateway); defaults to https://api.openai.com/v1. */
    OPENAI_BASE_URL?: string;
    /** Extra CSP sources (space/comma separated) and next/image remote hosts — see next.config.ts. */
    CSP_SCRIPT_SRC?: string;
    CSP_CONNECT_SRC?: string;
    CSP_FRAME_SRC?: string;
    CSP_IMG_SRC?: string;
    IMAGE_REMOTE_HOSTS?: string;
    /** OpenAI key — only used when GUIDE_PROVIDER is `openai` or `auto`. */
    OPENAI_API_KEY?: string;
    /**
     * Chat / planner backend: `local` (default, no OpenAI), `openai`, or `auto`
     * (Ollama then OpenAI).
     */
    GUIDE_PROVIDER?: string;
    /** Default OpenAI chat model for /api/chat, the planner and persona inference. */
    GUIDE_MODEL?: string;
    /** Disables model-based persona inference when set to 'false'. */
    GUIDE_ENABLED?: string;
    /** CRM webhook that enquiry/journey submissions are forwarded to. */
    CRM_ENDPOINT?: string;
    /** Bearer token for the CRM webhook. */
    CRM_API_KEY?: string;
    /** 'memory' (default) | a shared store name — see lib/rate-limit.ts. */
    RATE_LIMIT_STORE?: string;
    /** Explicitly accepts in-memory (per-instance) rate limiting in production. */
    RATE_LIMIT_ALLOW_MEMORY?: string;
    /** Shared rate-limit store connection string, once wired. */
    REDIS_URL?: string;
    /** Emits a standalone Next.js build output when set to 'true'. */
    BUILD_STANDALONE?: string;

    /** Base URL of the local Ollama server. */
    OLLAMA_BASE_URL?: string;
    /** Ollama model used to write the final answer. */
    OLLAMA_MODEL?: string;
    /** Let Ollama answer questions outside the Jetking knowledge base. */
    JK_ALLOW_GENERAL_ANSWERS?: string;

    /** Minimum cosine similarity before the assistant will answer at all. */
    JK_ANSWER_GATE?: string;
    /** Sentence-transformer used for both indexing and querying. */
    JK_EMBED_MODEL?: string;
    /** How far the BM25 signal may move a dense result. */
    JK_LEXICAL_WEIGHT?: string;
    /** Lexical hits past this rank contribute nothing. */
    JK_LEXICAL_DEPTH?: string;
    /** Boost for a centre row whose city the question names. */
    JK_CITY_BOOST?: string;
    /** 'auto' | 'dense' | 'lexical' — see env.server.ts. */
    JK_RETRIEVAL_MODE?: string;
    /** BM25 half-saturation constant used when there is no model. */
    JK_LEXICAL_SATURATION?: string;
    /** Confidence floor for an exact city match in lexical mode. */
    JK_CITY_MATCH_FLOOR?: string;
    /** Absolute path to the embedding index, if not under the project root. */
    JK_INDEX_PATH?: string;
    /** Abort the local LLM call after this many milliseconds. */
    OLLAMA_TIMEOUT_MS?: string;

    /* ---- Build scripts (scripts/*.mjs) ------------------------------------- */

    /** Embedding vector dimension the build scripts expect. */
    JK_EMBED_DIM?: string;
    /** Batch size for embedding requests during corpus builds. */
    JK_EMBED_BATCH?: string;
  }
}
