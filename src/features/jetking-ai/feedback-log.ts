import 'server-only';
import { getSupabase } from '@/lib/supabase';
import { getDb } from '@/lib/db/client';
import { chatbotUnanswered } from '@/lib/db/schema';

export interface UnansweredEntry {
  /** The visitor's own message text, verbatim. */
  question: string;
  /** Human-readable topic label already computed by route.ts (intentLabel). */
  intent: string;
  persona: string;
  reason: 'low-confidence' | 'no-centre-match';
  /** Best retrieval score for a low-confidence refusal; absent for a centre-match miss. */
  topScore?: number;
}

/**
 * Records a question the chatbot could not answer from verified Jetking
 * data — the "unanswered-question feedback loop": every refusal is a
 * knowledge-base gap someone can fill, not just a model limitation, but only
 * if it's visible anywhere. Without this, a gate refusal vanished the moment
 * the response was sent.
 *
 * Always logs a structured line to the server console — this alone is
 * immediately useful with zero setup, since Vercel retains function logs
 * (`vercel logs`) and already served as the debugging tool for the
 * OPENAI_API_KEY/Ollama issues earlier in this project's history. When
 * Supabase is configured (see src/lib/supabase.ts — same env vars the admin
 * CMS falls back without), each entry is additionally persisted to an
 * `unanswered_questions` table for a real queryable history — see
 * scripts/unanswered-report.mts and the table's schema in that script's
 * header comment. Never throws: a logging failure must never break the
 * chat response it's attached to.
 */
export async function logUnanswered(entry: UnansweredEntry): Promise<void> {
  console.warn(
    '[jetking-ai:unanswered]',
    JSON.stringify({ ...entry, at: new Date().toISOString() }),
  );

  // The admin's "Unanswered questions" screen reads this table.
  const db = getDb();
  if (db) {
    try {
      await db.insert(chatbotUnanswered).values({
        question: entry.question.slice(0, 2000),
        intent: entry.intent,
        reason: entry.reason,
        topScore: entry.topScore ?? null,
      });
    } catch (error) {
      console.warn('[jetking-ai:unanswered] database insert failed:', error);
    }
  }

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('unanswered_questions').insert({
      question: entry.question.slice(0, 2000),
      intent: entry.intent,
      persona: entry.persona,
      reason: entry.reason,
      top_score: entry.topScore ?? null,
    });
    if (error) console.warn('[jetking-ai:unanswered] Supabase insert failed:', error.message);
  } catch (error) {
    console.warn('[jetking-ai:unanswered] Supabase insert threw:', error);
  }
}
