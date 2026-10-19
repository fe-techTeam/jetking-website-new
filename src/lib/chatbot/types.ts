/**
 * Shapes shared by the /chatbot client and its API routes. Pure types plus one zod
 * schema — no `server-only`, no DB driver — so client components can import this.
 */
import { z } from 'zod';
import { ContentBlockSchema } from '@/features/jetking-ai/answer-schema';
import { MAX_STORED_MESSAGES } from './limits';

const chipSchema = z.object({
  label: z.string().max(200),
  query: z.string().max(1000).optional(),
  intent: z.string().max(40).optional(),
  geolocate: z.boolean().optional(),
});

const userMessageSchema = z.object({
  id: z.string().max(40),
  role: z.literal('user'),
  text: z.string().max(4000),
});

const assistantMessageSchema = z.object({
  id: z.string().max(40),
  role: z.literal('assistant'),
  kind: z.literal('text'),
  text: z.string().max(20_000),
  title: z.string().max(300).optional(),
  source: z.enum(['kb', 'llm']).optional(),
  /** The model's own structured content, when the LLM's JSON reply parsed cleanly (see answer-schema.ts). `text` above is always kept too, as its plain-text flattening — for history sent back to the LLM and for chats saved before this field existed. */
  blocks: z.array(ContentBlockSchema).max(10).optional(),
  reasoning: z.array(z.string().max(2000)).max(50).optional(),
  followUps: z
    .array(z.object({ label: z.string().max(400), query: z.string().max(2000) }))
    .max(30)
    .optional(),
  chips: z.array(chipSchema).max(40).optional(),
});

/** A transcript entry as persisted. "Thinking" placeholders are never stored. */
const storedMessageSchema = z.union([userMessageSchema, assistantMessageSchema]);
export type StoredMessage = z.infer<typeof storedMessageSchema>;

export const saveConversationSchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(120),
  messages: z.array(storedMessageSchema).min(1).max(MAX_STORED_MESSAGES),
  /** The planner's carried profile — opaque to the store, round-tripped so a resumed chat keeps its context. */
  session: z.record(z.string(), z.unknown()).optional(),
});
export type SaveConversationInput = z.infer<typeof saveConversationSchema>;

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** State name, e.g. "Gujarat". Null for accounts created before location was collected. */
  state: string | null;
  /** City slug, e.g. "ahmedabad". */
  city: string | null;
  /** Centre slug the person prefers, if they picked one. */
  centre: string | null;
}

/** State → city → centre, as served by /api/locations. */
export interface LocationTree {
  states: {
    name: string;
    cities: { slug: string; name: string; centres: { slug: string; name: string }[] }[];
  }[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface ConversationRecord extends ConversationSummary {
  messages: StoredMessage[];
  session?: Record<string, unknown>;
}
