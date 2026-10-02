import { z } from 'zod';
import type { AcquisitionChannel } from './channel';
import type { BehaviourInput, Classification, KnownPersonaId, SignalHit } from './types';
import { PERSONA_IDS } from './types';

/**
 * Silent persona inference — model-assisted, no user-facing “who are you?”.
 *
 * Input is anonymised signal summary only (no name/phone/email).
 * Output is a structured persona guess the client applies quietly after hydration.
 */

export interface InferPayload {
  signals: Array<{ id: string; persona: KnownPersonaId; weight: number; detail: string }>;
  behaviour: Pick<
    BehaviourInput,
    | 'courseViews'
    | 'levelViews'
    | 'feeDepthViews'
    | 'centreViews'
    | 'franchiseViews'
    | 'categoryViews'
    | 'visitCount'
    | 'interests'
  >;
  acquisitionChannel?: AcquisitionChannel;
  path?: string;
}

export interface InferResult {
  persona: KnownPersonaId | 'unknown';
  confidence: number;
  reason: string;
}

const InferResponseSchema = z.object({
  persona: z.enum(['student', 'professional', 'parent', 'franchise', 'unknown']),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(240),
});

function buildInferPrompt(payload: InferPayload): string {
  return [
    'Classify this Jetking website visitor into exactly one persona.',
    'Personas: student (after 12th / degree seeker), professional (working / upskill), parent (deciding for child), franchise (investor), unknown (not enough evidence).',
    'Use ONLY the signals below. Do not invent facts. If unsure, return unknown with low confidence.',
    '',
    `Acquisition channel: ${payload.acquisitionChannel ?? 'unknown'}`,
    `Current path: ${payload.path ?? '/'}`,
    `Visit count: ${payload.behaviour.visitCount}`,
    `Course views: ${payload.behaviour.courseViews.join(', ') || 'none'}`,
    `Levels: ${payload.behaviour.levelViews.join(', ') || 'none'}`,
    `Interests: ${payload.behaviour.interests.join(', ') || 'none'}`,
    `Fee depth views: ${payload.behaviour.feeDepthViews}`,
    `Centre views: ${payload.behaviour.centreViews}`,
    `Franchise views: ${payload.behaviour.franchiseViews}`,
    `Categories: ${payload.behaviour.categoryViews.join(', ') || 'none'}`,
    `Signals: ${JSON.stringify(payload.signals.slice(0, 12))}`,
    '',
    'Respond with JSON only: {"persona":"...","confidence":0-1,"reason":"short"}',
  ].join('\n');
}

export async function inferPersonaWithModel(payload: InferPayload): Promise<InferResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.GUIDE_ENABLED === 'false') {
    return heuristicInfer(payload);
  }

  const model = process.env.PERSONA_INFER_MODEL ?? process.env.GUIDE_MODEL ?? 'gpt-4o-mini';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 120,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You classify anonymous website visitors for an IT training brand. Return JSON only.',
          },
          { role: 'user', content: buildInferPrompt(payload) },
        ],
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) return heuristicInfer(payload);

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return heuristicInfer(payload);

    const parsed = InferResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return heuristicInfer(payload);
    return parsed.data;
  } catch {
    return heuristicInfer(payload);
  }
}

/** Offline / no-key fallback — weighted vote from existing signals + behaviour. */
export function heuristicInfer(payload: InferPayload): InferResult {
  const scores: Record<KnownPersonaId, number> = {
    student: 0,
    professional: 0,
    parent: 0,
    franchise: 0,
  };

  for (const s of payload.signals) {
    if (s.persona in scores) scores[s.persona] += s.weight;
  }

  const degree = payload.behaviour.levelViews.filter((l) => l === 'degree').length;
  const short = payload.behaviour.levelViews.filter((l) => l === 'certification' || l === 'short').length;
  scores.student += Math.min(degree * 0.35, 0.7);
  scores.professional += Math.min(short * 0.3, 0.6);
  scores.parent += Math.min(payload.behaviour.feeDepthViews * 0.28, 0.65);
  scores.parent += Math.min(payload.behaviour.centreViews * 0.15, 0.35);
  scores.franchise += Math.min(payload.behaviour.franchiseViews * 0.5, 0.9);

  // No topic-interest boost here: subject tags like "cloud"/"cyber"/"ai" are
  // shared across degree and short/certification programmes alike, so they
  // don't discriminate between student and professional — level (above)
  // already carries that signal. A blanket student-only nudge on these tags
  // was misclassifying working professionals researching the same subjects.

  const ranked = PERSONA_IDS.map((p) => ({ p, score: scores[p] })).sort((a, b) => b.score - a.score);
  const top = ranked[0];
  if (!top || top.score < 0.35) {
    return { persona: 'unknown', confidence: top?.score ?? 0, reason: 'Insufficient behavioural evidence' };
  }

  return {
    persona: top.p,
    confidence: Math.min(1, Number(top.score.toFixed(3))),
    reason: `Heuristic from signals/behaviour (top=${top.p})`,
  };
}

export function classificationToInferPayload(
  classification: Classification,
  behaviour: BehaviourInput,
  path?: string,
): InferPayload {
  return {
    signals: classification.signals.map((s: SignalHit) => ({
      id: s.id,
      persona: s.persona,
      weight: s.weight,
      detail: s.detail,
    })),
    behaviour: {
      courseViews: behaviour.courseViews,
      levelViews: behaviour.levelViews,
      feeDepthViews: behaviour.feeDepthViews,
      centreViews: behaviour.centreViews,
      franchiseViews: behaviour.franchiseViews,
      categoryViews: behaviour.categoryViews,
      visitCount: behaviour.visitCount,
      interests: behaviour.interests,
    },
    acquisitionChannel: classification.acquisitionChannel,
    path,
  };
}
