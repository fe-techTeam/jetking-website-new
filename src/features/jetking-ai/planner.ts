import { z } from 'zod';

import { serverEnv } from '@/lib/config/env.server';

import { needsGuidance, type WantFlags } from './intent';
import type { CounsellingSession } from './session';

/**
 * Structured LLM fallback for messages the deterministic layer (intent.ts)
 * can't classify — e.g. "12th commerce kiya hai but coding nahi aata and job
 * jaldi chahiye". Only runs when needsPlanner() gates it in; every other
 * turn stays fully deterministic.
 *
 * Hard boundary: the planner may infer the user's intent/profile, never a
 * Jetking fact. This is structural, not just prompted — PlannerOutput has no
 * field capable of holding a fact (no eligibility/duration/fees), and its
 * output never reaches the user directly; it only widens the retrieval query
 * and updates session profile fields. Facts still come only from retrieval,
 * verified the same way as every other turn (grounding.ts).
 */

export function needsPlanner(input: {
  subject: string | null;
  wants: WantFlags;
  isLocation: boolean;
  message: string;
}): boolean {
  if (input.isLocation || input.message.trim().length === 0) return false;
  if (needsGuidance(input.message)) return true;

  const explicitFacet =
    input.wants.wantFees ||
    input.wants.wantEligibility ||
    input.wants.wantCurriculum ||
    input.wants.wantDuration ||
    input.wants.wantPlacement ||
    input.wants.wantDemo;
  return !input.subject && !explicitFacet;
}

const INTENTS = [
  'course_discovery',
  'course_comparison',
  'eligibility',
  'duration',
  'curriculum',
  'career_outcomes',
  'placement',
  'fees',
  'admission',
  'course_recommendation',
  'objection',
  'general_question',
] as const;
const COURSE_TYPES = ['degree', 'career', 'short-course'] as const;
const NEXT_QUESTIONS = ['course_type', 'education_level', 'career_goal', 'timeline', 'city'] as const;

/**
 * A small local model reliably produces useful free-text fields (education,
 * stream, retrievalNeeds) but does not reliably pick from a closed enum —
 * it writes "Career Guidance" instead of "general_question", or a full
 * question instead of the "course_type" key. Rejecting the whole object for
 * one off-vocabulary field would throw away the useful parts, so these three
 * fields degrade to undefined on a mismatch instead of failing validation —
 * safe either way, since they're process/meta fields, never a place a
 * Jetking fact could hide (see module doc comment).
 */
function looseEnum<T extends readonly string[]>(allowed: T) {
  return z
    .string()
    .nullable()
    .optional()
    .transform((v): T[number] | undefined => {
      const match = allowed.find((option) => option === v?.trim());
      return match;
    });
}

/**
 * The model reliably writes "educationLevel": null instead of omitting a
 * field it has no answer for — a plain z.string().optional() only tolerates
 * undefined, not null, and rejecting the whole object for one such field
 * threw away otherwise-good data (confirmed live: this was silently making
 * runPlanner() return null on every single-turn, no-prior-message request).
 * Coerce null to undefined instead of failing.
 */
function nullableOptional<T extends z.ZodTypeAny>(schema: T) {
  return schema
    .nullable()
    .optional()
    .transform((v) => v ?? undefined);
}

const PROFILE_UPDATES_SCHEMA = z
  .object({
    educationLevel: nullableOptional(z.string().max(60)),
    stream: nullableOptional(z.string().max(60)),
    careerGoal: nullableOptional(z.string().max(120)),
    interests: nullableOptional(z.array(z.string().max(60)).max(5)),
    concerns: nullableOptional(z.array(z.string().max(60)).max(5)),
    preferredCourseType: looseEnum(COURSE_TYPES),
  })
  .partial();

const PLANNER_OUTPUT_SCHEMA = z.object({
  intent: looseEnum(INTENTS),
  profileUpdates: nullableOptional(PROFILE_UPDATES_SCHEMA),
  retrievalNeeds: nullableOptional(z.array(z.string().max(80)).max(6)),
  nextBestQuestion: looseEnum(NEXT_QUESTIONS),
});

export type PlannerOutput = z.infer<typeof PLANNER_OUTPUT_SCHEMA>;

function buildPlannerPrompt(input: {
  message: string;
  session: CounsellingSession;
  prevUserMessage?: string;
}): string {
  return [
    "You are an intent/profile classifier for Jetking's career-counselling chatbot.",
    'The message below did not match any known course subject or clear facet — figure out what the visitor actually needs.',
    '',
    'Rules:',
    '- Infer ONLY the visitor\'s intent and profile (education, stream, goals, concerns). NEVER state a Jetking fact (no fees, eligibility rules, durations, placement numbers, course names as facts) — you have no verified data to draw on.',
    '- retrievalNeeds are short search phrases (not answers) that will be used to search a real Jetking knowledge base afterwards.',
    '- Omit any field you are not confident about.',
    `- intent must be exactly one of: ${INTENTS.join(', ')}`,
    `- preferredCourseType must be exactly one of: ${COURSE_TYPES.join(', ')}`,
    `- nextBestQuestion must be exactly one of: ${NEXT_QUESTIONS.join(', ')} (the TOPIC only, never the actual question text)`,
    '',
    'Example output for a different message:',
    '{"intent":"course_discovery","profileUpdates":{"educationLevel":"12th","stream":"science","careerGoal":"job in IT"},"retrievalNeeds":["short IT courses after 12th science"],"nextBestQuestion":"course_type"}',
    '',
    `Prior turn: ${input.prevUserMessage ?? '(none — first message)'}`,
    `Known so far: education=${input.session.educationLevel ?? 'unknown'}, stream=${input.session.stream ?? 'unknown'}, careerGoal=${input.session.careerGoal ?? 'unknown'}, lastSubject=${input.session.lastSubject ?? 'none'}`,
    `Current message: "${input.message}"`,
    '',
    'Now output ONLY the JSON object for the current message, complete and valid, ending with a closing brace. No other text.',
  ].join('\n');
}

function extractJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function callOpenAiPlanner(apiKey: string, prompt: string): Promise<string | null> {
  const model = process.env.PLANNER_MODEL ?? process.env.GUIDE_MODEL ?? 'gpt-4o-mini';
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              "You classify Jetking chatbot visitors' intent and profile from their message. Return JSON only.",
          },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`[planner] OpenAI got HTTP ${response.status}: ${body.slice(0, 300)}`);
      return null;
    }
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (error) {
    console.warn(
      `[planner] OpenAI call failed: ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`,
    );
    return null;
  }
}

async function callOllamaPlanner(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(serverEnv.ollamaChatUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // The planner only widens retrieval — never worth a full answer-sized wait
      // on a slow local CPU model; on timeout the turn proceeds ungrounded.
      signal: AbortSignal.timeout(Math.min(serverEnv.ollamaTimeoutMs, 8_000)),
      body: JSON.stringify({
        model: serverEnv.ollamaModel,
        stream: false,
        options: { temperature: 0, num_predict: 400 },
        messages: [
          {
            role: 'system',
            content:
              'Reply with ONLY a single valid JSON object. Nothing else — no other text, no markdown fences.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { message?: { content?: string } };
    let text = data.message?.content?.trim() ?? '';
    const thinkTag = text.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkTag) text = text.replace(thinkTag[0], '').trim();
    return text || null;
  } catch {
    return null;
  }
}

/** Never throws — any failure (timeout, bad JSON, schema mismatch) resolves to null. */
export async function runPlanner(input: {
  message: string;
  session: CounsellingSession;
  prevUserMessage?: string;
}): Promise<PlannerOutput | null> {
  const prompt = buildPlannerPrompt(input);
  const apiKey = process.env.OPENAI_API_KEY;
  // Match /api/chat: default local (Ollama only). OpenAI is opt-in via
  // GUIDE_PROVIDER=openai|auto so the chatbot can run without a paid key.
  const provider = (process.env.GUIDE_PROVIDER ?? 'local').toLowerCase();
  let raw: string | null = null;
  let backend = 'none';
  if (provider === 'openai') {
    backend = 'OpenAI';
    raw = apiKey ? await callOpenAiPlanner(apiKey, prompt) : null;
  } else if (provider === 'auto') {
    raw = await callOllamaPlanner(prompt);
    backend = raw ? 'Ollama' : 'OpenAI';
    if (!raw && apiKey) raw = await callOpenAiPlanner(apiKey, prompt);
  } else {
    backend = 'Ollama';
    raw = await callOllamaPlanner(prompt);
  }
  if (!raw) {
    console.warn(`[planner] no reply from ${backend} — falling through ungrounded`);
    return null;
  }

  const parsed = extractJson(raw);
  if (parsed === null) {
    console.warn('[planner] reply was not valid JSON:', raw.slice(0, 300));
    return null;
  }

  const result = PLANNER_OUTPUT_SCHEMA.safeParse(parsed);
  if (!result.success) {
    console.warn('[planner] reply failed schema validation:', JSON.stringify(parsed).slice(0, 300));
  }
  return result.success ? result.data : null;
}
