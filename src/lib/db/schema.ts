import { pgTable, text, timestamp, uuid, index, jsonb, doublePrecision, integer, primaryKey, customType, boolean } from 'drizzle-orm/pg-core';
import type { StoredMessage } from '@/lib/chatbot/types';

/**
 * Leads live in plain Postgres via Drizzle — reached directly through
 * `DATABASE_URL`, never through @supabase/supabase-js. This table has no file-store
 * fallback like the content collections in `src/lib/cms`: a lead is live operational
 * data staff act on, not editorial content that needs to keep working offline.
 */
export const leads = pgTable(
  'leads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    courseInterest: text('course_interest'),
    city: text('city'),
    source: text('source').notNull().default('form'), // 'chatbot' | 'form' | 'centre'
    persona: text('persona'), // 'student' | 'parent' | 'professional' | 'franchise'
    status: text('status').notNull().default('new'), // 'new' | 'contacted' | 'enrolled' | 'lost'
    notes: text('notes'),
    /** Which form/surface sent it (`home-final-cta-form`, `franchise-landing`, `jetking-ai-chat`, a page path…). `source` above is the channel. */
    form: text('form'),
    state: text('state'),
    /** Centre the visitor picked, resolved against the CMS centres. */
    centreSlug: text('centre_slug'),
    centreName: text('centre_name'),
    courseSlug: text('course_slug'),
    qualification: text('qualification'), // '10+2' | 'graduate'
    /** What the visitor typed in the enquiry's message box — kept apart from staff `notes`. */
    message: text('message'),
    visitorId: text('visitor_id'),
    accountId: text('account_id'),
    journeyStage: text('journey_stage'),
    intent: text('intent'),
    utmSource: text('utm_source'),
    utmMedium: text('utm_medium'),
    utmCampaign: text('utm_campaign'),
    utmContent: text('utm_content'),
    landingPage: text('landing_page'),
    /** Staff member working this lead (their display name — stays readable if the account is later removed). */
    assignedTo: text('assigned_to'),
    /** When the next follow-up is due; the Leads screen flags it once it passes. */
    followUpAt: timestamp('follow_up_at', { withTimezone: true }),
    /** Hand-off to the external CRM: 'none' (not configured) | 'routed' | 'failed'. The lead is stored here regardless. */
    crmStatus: text('crm_status').notNull().default('none'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('leads_status_idx').on(table.status), index('leads_created_at_idx').on(table.createdAt), index('leads_phone_idx').on(table.phone), index('leads_centre_idx').on(table.centreSlug), index('leads_follow_up_idx').on(table.followUpAt)],
);

/** One row per timeline entry shown in the lead detail drawer (call logged, chatbot handoff, note added). */
export const leadActivities = pgTable(
  'lead_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    leadId: uuid('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(), // 'chatbot' | 'call' | 'note' | 'status_change'
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('lead_activities_lead_id_idx').on(table.leadId)],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type NewLeadActivity = typeof leadActivities.$inferInsert;

/**
 * Staff accounts for the admin panel — reached the same way as `leads`, direct
 * Postgres via Drizzle. Replaces the single shared `ADMIN_PASSWORD` cookie with
 * real per-user login when `DATABASE_URL` is set; that legacy single-password
 * path stays as the fallback when it isn't (see `admin/actions.ts`).
 */
export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').notNull().default('editor'), // 'admin' | 'editor' | 'centre_staff'
    /** Only meaningful for role='centre_staff' — scopes their lead visibility. */
    centreSlug: text('centre_slug'),
    status: text('status').notNull().default('active'), // 'active' | 'disabled'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    /** Embedded in the session cookie; bumping it signs the user out everywhere (logout, password change/reset). */
    sessionVersion: integer('session_version').notNull().default(0),
  },
  (table) => [index('admin_users_role_idx').on(table.role)],
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

/**
 * One row per mutating action taken in the admin panel — content saved or
 * deleted, a lead's status changed, a team member invited or removed, and so
 * on. `actorId` is nullable because the legacy single-`ADMIN_PASSWORD` path
 * (no `DATABASE_URL`, see `admin/actions.ts`) has no real user row to point
 * at; `actorName` is captured at write time (not joined at read time) so a
 * later-deleted user's history stays readable.
 */
export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id'),
    actorName: text('actor_name').notNull(),
    action: text('action').notNull(), // e.g. 'cms.save', 'lead.status_change', 'team.invite'
    targetType: text('target_type').notNull(), // e.g. 'course', 'lead', 'user'
    targetId: text('target_id'),
    summary: text('summary').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('admin_audit_log_created_at_idx').on(table.createdAt)],
);

export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert;

/**
 * Website register/login accounts — the main site's own account system,
 * deliberately separate from both `admin_users` (staff) and `chat_users`
 * (the /chatbot widget's accounts, kept independent for now; unifying the two
 * — so a chat account and a website account can be the same person — is
 * future work, not done here). Same PBKDF2 hashing (`src/lib/auth/password.ts`).
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  /** Normalised mobile number (digits with an optional leading +). Not unique — family members share numbers. */
  phone: text('phone').notNull(),
  /** Where the person is, for personalisation: state name, city slug, preferred centre slug. Nullable so the form can evolve. */
  state: text('state'),
  city: text('city'),
  centre: text('centre'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

/**
 * /chatbot's own accounts — visitors who log in there to keep their chat
 * history. Same PBKDF2 hashing (`src/lib/auth/password.ts`).
 */
export const chatUsers = pgTable('chat_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  /** Normalised mobile number (digits with an optional leading +). Not unique — family members share numbers. */
  phone: text('phone').notNull(),
  /** Where the person is, for personalisation: state name, city slug, preferred centre slug. Nullable so the form can evolve. */
  state: text('state'),
  city: text('city'),
  centre: text('centre'),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One row per saved chat. The transcript is a single jsonb array rather than a
 * messages table: the client model (chips, follow-ups, reasoning) round-trips as-is,
 * and a chat is always read and written whole. `id` is client-generated so the first
 * autosave needs no round trip; writes are always scoped to `user_id`, so a guessed
 * id can never touch another user's chat.
 */
export const chatConversations = pgTable(
  'chat_conversations',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => chatUsers.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    messages: jsonb('messages').$type<StoredMessage[]>().notNull(),
    session: jsonb('session').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('chat_conversations_user_updated_idx').on(table.userId, table.updatedAt)],
);

export type ChatUserRow = typeof chatUsers.$inferSelect;
export type ChatConversationRow = typeof chatConversations.$inferSelect;

/**
 * Cities and centres — the location catalogue behind /centres and /centres/{slug}.
 *
 * Fields the directory filters, sorts and searches on are real columns; every richer
 * section of a centre page (programmes, gallery, faculty, FAQs, updates…) lives in one
 * `details` jsonb blob, since a centre page is always read and written whole and those
 * sections evolve with the page design. `status` mirrors the CMS publish flag, so only
 * 'published' rows reach the public site. See `src/lib/cms/locations-db.ts`.
 */
export const cities = pgTable('cities', {
  slug: text('slug').primaryKey(),
  name: text('name').notNull(),
  state: text('state').notNull(),
  intro: text('intro').notNull(),
  seo: jsonb('seo').$type<Record<string, unknown>>().notNull(),
  status: text('status').notNull().default('published'), // 'published' | 'draft'
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const centres = pgTable(
  'centres',
  {
    slug: text('slug').primaryKey(),
    citySlug: text('city_slug').notNull(),
    name: text('name').notNull(),
    addressLine: text('address_line').notNull(),
    locality: text('locality').notNull(),
    state: text('state').notNull(),
    pincode: text('pincode').notNull(),
    phone: text('phone'),
    email: text('email'),
    helpline: text('helpline'),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    coursesOffered: jsonb('courses_offered').$type<string[]>().notNull().default([]),
    seo: jsonb('seo').$type<Record<string, unknown>>().notNull(),
    /** Everything else on the Centre record (headline, intro, body, gallery, faculty, faqs, updates…). */
    details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
    status: text('status').notNull().default('published'), // 'published' | 'draft'
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('centres_city_slug_idx').on(table.citySlug), index('centres_status_idx').on(table.status)],
);

export type CityRow = typeof cities.$inferSelect;
export type CentreRow = typeof centres.$inferSelect;

/**
 * Every CMS collection except cities/centres (own tables above), one row per record.
 *
 * `data` is the whole record exactly as the public site reads it (including `status`), so a record
 * is always read and written whole and a new field never needs a migration. `status` and `position`
 * are real columns: the public site filters on the first and keeps editors' list order with the second.
 */
export const cmsRecords = pgTable(
  'cms_records',
  {
    collection: text('collection').notNull(),
    recordId: text('record_id').notNull(),
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    status: text('status').notNull().default('published'), // 'published' | 'draft'
    position: integer('position').notNull().default(0),
    updatedBy: text('updated_by'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.collection, table.recordId] }),
    index('cms_records_collection_idx').on(table.collection, table.position),
  ],
);

/** Collections whose in-repo seed has already been copied into `cms_records` — so emptying one is not undone by a reseed. */
export const cmsSeeded = pgTable('cms_seeded', {
  collection: text('collection').primaryKey(),
  seededAt: timestamp('seeded_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Version history: a snapshot of a record after each save, and of its last state when deleted, so an
 * editor can compare and restore. Pruned to the newest few per record by `cms/revisions.ts`.
 */
export const cmsRevisions = pgTable(
  'cms_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collection: text('collection').notNull(),
    recordId: text('record_id').notNull(),
    action: text('action').notNull(), // 'save' | 'delete' | 'restore'
    data: jsonb('data').$type<Record<string, unknown>>().notNull(),
    actorName: text('actor_name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('cms_revisions_record_idx').on(table.collection, table.recordId, table.createdAt)],
);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/** Uploaded images/documents (the media library). Bytes live in the database so uploads survive a redeploy on any host. */
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    filename: text('filename').notNull(),
    mime: text('mime').notNull(),
    size: integer('size').notNull(),
    alt: text('alt').notNull().default(''),
    data: bytea('data').notNull(),
    uploadedBy: text('uploaded_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('media_assets_created_idx').on(table.createdAt)],
);

export type CmsRecordRow = typeof cmsRecords.$inferSelect;
export type CmsRevisionRow = typeof cmsRevisions.$inferSelect;
export type MediaAssetRow = typeof mediaAssets.$inferSelect;

/**
 * Redirects managed in the admin (moved pages, retired campaign URLs). The reviewed legacy list in
 * `redirects.json` is baked into the build; these are looked up per request by the proxy
 * (`src/lib/redirects/lookup.ts`), so an editor can add a 301 without a deploy.
 */
export const redirects = pgTable(
  'redirects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Path being redirected, e.g. `/old-course`. Matched exactly, ignoring a trailing slash and the query string. */
    source: text('source').notNull().unique(),
    /** A path on this site (`/courses`) or an absolute https URL. */
    destination: text('destination').notNull(),
    permanent: boolean('permanent').notNull().default(true),
    note: text('note').notNull().default(''),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('redirects_created_idx').on(table.createdAt)],
);

export type RedirectRow = typeof redirects.$inferSelect;

/**
 * Questions the assistant could not answer from website content — one row per ask. The panel groups them
 * ("asked 14 times") so an editor can write a Custom answer or fix the page the answer should have come from.
 */
export const chatbotUnanswered = pgTable(
  'chatbot_unanswered',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    question: text('question').notNull(),
    intent: text('intent').notNull().default(''),
    reason: text('reason').notNull(), // 'low-confidence' | 'no-centre-match'
    topScore: doublePrecision('top_score'),
    /** Set when an editor dismissed it or answered it with a Custom answer. */
    resolved: boolean('resolved').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('chatbot_unanswered_created_idx').on(table.createdAt), index('chatbot_unanswered_resolved_idx').on(table.resolved)],
);
export type ChatbotUnanswered = typeof chatbotUnanswered.$inferSelect;

/**
 * One row per OTP sent to verify a mobile number before an enquiry is accepted. Only a keyed hash of the code is
 * stored (never the code), rows expire after minutes, and `attempts` caps guessing. See `src/lib/otp`.
 */
export const otpChallenges = pgTable(
  'otp_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Ten-digit Indian mobile number the code was sent to. */
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    attempts: integer('attempts').notNull().default(0),
    /** Set once verified, so one code can never be redeemed twice. */
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('otp_challenges_phone_created_idx').on(table.phone, table.createdAt)],
);

export type OtpChallengeRow = typeof otpChallenges.$inferSelect;
