import { pgTable, text, timestamp, uuid, index, jsonb } from 'drizzle-orm/pg-core';
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
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('leads_status_idx').on(table.status), index('leads_created_at_idx').on(table.createdAt)],
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
