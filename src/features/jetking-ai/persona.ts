/**
 * Persona inference for answer framing — not a UI picker.
 *
 * Detect who is asking from the question text, then bias tone/emphasis.
 * Aligned with jetking-platform PERSONAS.md playbooks.
 */

export const PERSONA_IDS = ['student', 'parent', 'professional', 'franchise'] as const;
export type KnownPersonaId = (typeof PERSONA_IDS)[number];
export type PersonaId = KnownPersonaId | 'unknown';

/** System-prompt framing for the local LLM. */
export const PERSONA_FRAMING: Record<KnownPersonaId, string> = {
  student:
    'The question sounds like a student / school-leaver. Be encouraging and concrete. Emphasise eligibility, duration, labs, certifications, and employability. Avoid jargon. Do not invent fees, salary, or placement guarantees.',
  parent:
    'The question sounds like a parent deciding for their child. Be reassuring and factual. Emphasise trust, placement support (honestly — no guarantees), EMI/fee clarity, campus/centre, and value. Never overstate outcomes.',
  professional:
    'The question sounds like a working professional. Be direct and respect their time. Emphasise evening/weekend batches, certifications, practical skills, and career switch/upskill fit. Do not invent salary hikes.',
  franchise:
    'The question sounds like a franchise / business enquiry. Be businesslike. Cover operating model, support, training, and how to start a conversation with the franchise team. Never invent investment or ROI figures.',
};

export interface PersonaUtteranceHit {
  persona: KnownPersonaId;
  reason: string;
  cueId: string;
}

const UTTERANCE_CUES: Array<{
  cueId: string;
  persona: KnownPersonaId;
  pattern: RegExp;
  reason: string;
}> = [
  {
    cueId: 'parent:my-child',
    persona: 'parent',
    pattern: /\b(my|our)\s+(son|daughter|child|kid|beta|beti)\b/i,
    reason: 'Mentioned their child',
  },
  {
    cueId: 'parent:for-child',
    persona: 'parent',
    pattern:
      /\b(for\s+(my|our)\s+(son|daughter|child)|deciding\s+for\s+(him|her|them)|as\s+a\s+parent|i\s+am\s+a\s+parent|good\s+for\s+(my|our)\s+(son|daughter|child))\b/i,
    reason: 'Described deciding as a parent',
  },
  {
    cueId: 'student:self',
    persona: 'student',
    pattern:
      /\b(i\s+am\s+(a\s+)?student|i'?m\s+in\s+(class|engineering|college|12th|10th|diploma)|after\s+(10th|12th)|12th\s+ke\s+baad|10th\s+ke\s+baad|which\s+course\s+(should|can)\s+i\s+(do|join|take))\b/i,
    reason: 'Identified as a student',
  },
  {
    cueId: 'professional:work',
    persona: 'professional',
    pattern:
      /\b(\d+\s*\+?\s*years?\s+(of\s+)?(experience|exp)|working\s+professional|career\s+switch|i\s+work\s+(as|in)|upskill(ing)?|while\s+working|evening\s+batch|weekend\s+batch|full\s*time\s+job)\b/i,
    reason: 'Described working-professional context',
  },
  {
    cueId: 'franchise:invest',
    persona: 'franchise',
    pattern:
      /\b(franchise|open\s+a\s+(centre|center)|business\s+opportunity|want\s+to\s+invest\s+in\s+(education|jetking)|franchisee)\b/i,
    reason: 'Described franchise / investment interest',
  },
];

/** Infer persona from a single question (and optional prior user text). */
export function inferPersonaFromQuestion(
  question: string,
  priorUserText?: string,
): PersonaUtteranceHit | null {
  const combined = [priorUserText, question].filter(Boolean).join('\n');
  return detectPersonaFromUtterance(combined);
}

function detectPersonaFromUtterance(text: string): PersonaUtteranceHit | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  for (const cue of UTTERANCE_CUES) {
    if (cue.pattern.test(trimmed)) {
      return { persona: cue.persona, reason: cue.reason, cueId: cue.cueId };
    }
  }
  return null;
}

/**
 * Answer-style guidance embedded in the system prompt when persona is unknown.
 * The model must still adapt from question cues on each turn.
 */
export const QUESTION_ADAPTATION_RULES = `ANSWER STYLE — adapt to the question, not a menu:
- If they mention son/daughter/child / "for my kid" → answer like a parent advisor (trust, placements honesty, EMI, centre visit).
- If they say after 10th/12th, "I am a student", eligibility for themselves → answer like a student counsellor (course fit, duration, labs, certifications).
- If they mention years of experience, career switch, evening/weekend, study while working → answer like a professional coach (batches, certs, time fit).
- If they mention franchise, invest, open a centre → answer like a franchise partner desk (process, support; no invented investment/ROI numbers).
- If unclear, answer neutrally and briefly; you may ask one clarifying question only when it materially changes the advice.
- Never push a "choose your path" menu. Just answer the question.`;
