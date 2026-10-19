import { z } from 'zod';

/**
 * The chatbot's controlled block vocabulary. The LLM (route.ts's systemPrompt)
 * may only choose among these six types and their own text/labels — never a
 * font size, color, or margin. answer-html.tsx owns every visual decision;
 * this file only decides what shape the model is allowed to hand back and
 * validates that it actually did.
 */
export const ContentBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().min(1).max(120),
  }),
  z.object({ type: z.literal('paragraph'), text: z.string().min(1).max(600) }),
  z.object({
    type: z.literal('bullet_list'),
    items: z.array(z.string().min(1).max(200)).min(1).max(10),
  }),
  z.object({
    type: z.literal('numbered_list'),
    items: z.array(z.string().min(1).max(200)).min(1).max(10),
  }),
  z.object({
    type: z.literal('facts'),
    items: z
      .array(z.object({ label: z.string().min(1).max(40), value: z.string().min(1).max(160) }))
      .min(1)
      .max(10),
  }),
  z.object({
    type: z.literal('callout'),
    variant: z.enum(['info', 'tip', 'warning']),
    text: z.string().min(1).max(240),
  }),
]);
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

const StructuredAnswerSchema = z.object({
  blocks: z.array(ContentBlockSchema).min(1).max(10),
});

/**
 * The bare JSON Schema behind both wire formats:
 *  - OpenAI Chat Completions wants it wrapped as `{ name, strict, schema }`
 *    under `response_format: { type: 'json_schema', json_schema: ... }`.
 *  - Ollama's `/api/chat` wants the schema object itself under `format`.
 * Deliberately omits `minItems`/`maxItems`/`minLength` etc. — OpenAI's strict
 * mode 400s on JSON Schema keywords outside its supported subset (type,
 * properties, required, additionalProperties, items, anyOf, enum). Size and
 * length limits are enforced afterwards by the zod schema above instead.
 */
const CONTENT_BLOCK_JSON_SCHEMA = {
  type: 'array',
  items: {
    anyOf: [
      {
        type: 'object',
        properties: {
          type: { enum: ['heading'] },
          level: { enum: [2, 3] },
          text: { type: 'string' },
        },
        required: ['type', 'level', 'text'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: { type: { enum: ['paragraph'] }, text: { type: 'string' } },
        required: ['type', 'text'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          type: { enum: ['bullet_list'] },
          items: { type: 'array', items: { type: 'string' } },
        },
        required: ['type', 'items'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          type: { enum: ['numbered_list'] },
          items: { type: 'array', items: { type: 'string' } },
        },
        required: ['type', 'items'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          type: { enum: ['facts'] },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, value: { type: 'string' } },
              required: ['label', 'value'],
              additionalProperties: false,
            },
          },
        },
        required: ['type', 'items'],
        additionalProperties: false,
      },
      {
        type: 'object',
        properties: {
          type: { enum: ['callout'] },
          variant: { enum: ['info', 'tip', 'warning'] },
          text: { type: 'string' },
        },
        required: ['type', 'variant', 'text'],
        additionalProperties: false,
      },
    ],
  },
} as const;

const STRUCTURED_ANSWER_SCHEMA_BODY = {
  type: 'object',
  properties: { blocks: CONTENT_BLOCK_JSON_SCHEMA },
  required: ['blocks'],
  additionalProperties: false,
} as const;

/** For OpenAI's `response_format: { type: 'json_schema', json_schema: STRUCTURED_ANSWER_JSON_SCHEMA }`. */
export const STRUCTURED_ANSWER_JSON_SCHEMA = {
  name: 'structured_answer',
  strict: true,
  schema: STRUCTURED_ANSWER_SCHEMA_BODY,
} as const;

/** For Ollama's `format` field, which takes the bare schema (no name/strict wrapper). */
export const OLLAMA_ANSWER_FORMAT = STRUCTURED_ANSWER_SCHEMA_BODY;

/**
 * Parses and validates a model's raw reply against the block schema.
 * Never throws — returns null on malformed JSON or a schema mismatch, so the
 * caller can fall back to the legacy free-text pipeline (some local Ollama
 * models ignore `format` entirely and just reply in prose).
 */
export function parseStructuredAnswer(raw: string): ContentBlock[] | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = StructuredAnswerSchema.safeParse(json);
  return result.success ? result.data.blocks : null;
}

/** Flattens blocks back to plain text — for conversation history, titles, and grounding checks. */
export function blocksToPlainText(blocks: ContentBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `${'#'.repeat(b.level)} ${b.text}`;
        case 'paragraph':
          return b.text;
        case 'bullet_list':
          return b.items.map((i) => `- ${i}`).join('\n');
        case 'numbered_list':
          return b.items.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
        case 'facts':
          return b.items.map((i) => `${i.label}: ${i.value}`).join('\n');
        case 'callout':
          return b.text;
      }
    })
    .join('\n\n');
}
