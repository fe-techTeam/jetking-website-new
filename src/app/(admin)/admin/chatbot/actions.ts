'use server';

import { headers } from 'next/headers';
import { and, desc, eq, sql } from 'drizzle-orm';
import { requireRole } from '../actions';
import { getBuildState, startBuild, type BuildState } from '@/lib/chatbot/ops';
import { getDb } from '@/lib/db/client';
import { chatConversations, chatbotUnanswered, chatUsers } from '@/lib/db/schema';
import { recordAudit } from '@/lib/audit/log';

const ROLES = ['admin', 'editor'] as const;

export async function rebuildKnowledge(): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole([...ROLES]);
  const result = startBuild();
  if (result.ok) void recordAudit(user, 'chatbot.rebuild', 'chatbot', null, 'Started a knowledge rebuild');
  return result;
}

export async function getBuild(): Promise<BuildState> {
  await requireRole([...ROLES]);
  return getBuildState();
}

export interface TestAnswer {
  ok: boolean;
  text: string;
  source?: string;
  reasoning: string[];
  gated: boolean;
}

/** Asks the live assistant a question exactly as a visitor would, so an editor can try a change before it matters. */
export async function askTestQuestion(question: string): Promise<TestAnswer> {
  await requireRole([...ROLES]);
  const q = question.trim().slice(0, 500);
  if (!q) return { ok: false, text: 'Type a question first.', reasoning: [], gated: false };
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  // The host comes from a request header: accept only a plain host[:port] so it cannot be steered at another target.
  if (!host || !/^[a-z0-9.-]+(:\d{1,5})?$/i.test(host)) return { ok: false, text: 'Could not work out this site’s address.', reasoning: [], gated: false };
  const proto = h.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https');
  try {
    const res = await fetch(`${proto}://${host}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: `${proto}://${host}` },
      body: JSON.stringify({ messages: [{ role: 'user', content: q }] }),
      signal: AbortSignal.timeout(60_000),
      cache: 'no-store',
    });
    const data = (await res.json()) as { text?: string; source?: string; reasoning?: string[]; gated?: boolean; ok?: boolean };
    return { ok: Boolean(data.ok), text: data.text ?? 'No answer.', source: data.source, reasoning: data.reasoning ?? [], gated: Boolean(data.gated) };
  } catch (e) {
    return { ok: false, text: e instanceof Error ? e.message : 'The assistant did not respond.', reasoning: [], gated: false };
  }
}

/* ── Unanswered questions ─────────────────────────────────────────────── */

export interface UnansweredGroup {
  question: string;
  count: number;
  lastAsked: string;
  reason: string;
  avgScore: number | null;
}

export async function listUnanswered(showResolved: boolean): Promise<UnansweredGroup[]> {
  await requireRole([...ROLES]);
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      question: sql<string>`min(${chatbotUnanswered.question})`,
      count: sql<number>`count(*)::int`,
      lastAsked: sql<string>`max(${chatbotUnanswered.createdAt})`,
      reason: sql<string>`min(${chatbotUnanswered.reason})`,
      avgScore: sql<number | null>`avg(${chatbotUnanswered.topScore})`,
    })
    .from(chatbotUnanswered)
    .where(showResolved ? undefined : eq(chatbotUnanswered.resolved, false))
    .groupBy(sql`lower(trim(${chatbotUnanswered.question}))`)
    .orderBy(desc(sql`count(*)`), desc(sql`max(${chatbotUnanswered.createdAt})`))
    .limit(200);
  return rows.map((r) => ({ ...r, lastAsked: new Date(r.lastAsked).toISOString(), avgScore: r.avgScore === null ? null : Number(r.avgScore) }));
}

export async function resolveUnanswered(question: string, resolved = true): Promise<void> {
  const user = await requireRole([...ROLES]);
  const db = getDb();
  if (!db) return;
  await db
    .update(chatbotUnanswered)
    .set({ resolved })
    .where(sql`lower(trim(${chatbotUnanswered.question})) = lower(trim(${question}))`);
  void recordAudit(user, 'chatbot.question', 'chatbot', null, `${resolved ? 'Dismissed' : 'Reopened'} the question “${question.slice(0, 80)}”`);
}

/* ── Conversations ────────────────────────────────────────────────────── */

export interface ChatSummary {
  id: string;
  title: string;
  who: string;
  messages: number;
  updatedAt: string;
}

export async function listRecentChats(limit = 15): Promise<ChatSummary[]> {
  await requireRole([...ROLES]);
  const db = getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: chatConversations.id,
      title: chatConversations.title,
      messages: chatConversations.messages,
      updatedAt: chatConversations.updatedAt,
      name: chatUsers.name,
    })
    .from(chatConversations)
    .leftJoin(chatUsers, eq(chatUsers.id, chatConversations.userId))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(limit);
  return rows.map((r) => ({ id: r.id, title: r.title, who: r.name ?? 'Visitor', messages: r.messages.length, updatedAt: r.updatedAt.toISOString() }));
}

export async function getChatTranscript(id: string): Promise<Array<{ role: string; text: string }>> {
  await requireRole(['admin']);
  const db = getDb();
  if (!db) return [];
  const [row] = await db.select({ messages: chatConversations.messages }).from(chatConversations).where(eq(chatConversations.id, id)).limit(1);
  return (row?.messages ?? []).map((m) => ({ role: m.role, text: m.text }));
}

export interface ChatbotUsage {
  conversations: number;
  conversationsWeek: number;
  chatLeads: number;
  unanswered: number;
  contentChangedSinceBuild: boolean;
}

export async function getUsage(indexBuiltAt: string | null): Promise<ChatbotUsage> {
  await requireRole([...ROLES]);
  const db = getDb();
  if (!db) return { conversations: 0, conversationsWeek: 0, chatLeads: 0, unanswered: 0, contentChangedSinceBuild: false };
  const week = new Date(Date.now() - 7 * 86_400_000);
  const [conv, convWeek, leadCount, un, changed] = await Promise.all([
    db.execute(sql`select count(*)::int as n from chat_conversations`),
    db.execute(sql`select count(*)::int as n from chat_conversations where updated_at >= ${week}`),
    db.execute(sql`select count(*)::int as n from leads where source = 'chatbot'`),
    db.select({ n: sql<number>`count(distinct lower(trim(${chatbotUnanswered.question})))::int` }).from(chatbotUnanswered).where(and(eq(chatbotUnanswered.resolved, false))),
    indexBuiltAt
      ? db.execute(sql`select (select count(*) from cms_records where updated_at > ${new Date(indexBuiltAt)})::int as n`)
      : Promise.resolve({ rows: [{ n: 0 }] }),
  ]);
  const n = (r: { rows: unknown[] }) => Number((r.rows[0] as { n: number }).n ?? 0);
  return {
    conversations: n(conv),
    conversationsWeek: n(convWeek),
    chatLeads: n(leadCount),
    unanswered: un[0]?.n ?? 0,
    contentChangedSinceBuild: n(changed) > 0,
  };
}
