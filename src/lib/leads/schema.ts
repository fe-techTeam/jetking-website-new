import { z } from 'zod';

const LEAD_SOURCES = ['chatbot', 'form', 'centre'] as const;
const LEAD_PERSONAS = ['student', 'parent', 'professional', 'franchise'] as const;
export const LEAD_STATUSES = ['new', 'contacted', 'enrolled', 'lost'] as const;

export const leadInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  courseInterest: z.string().optional(),
  city: z.string().optional(),
  source: z.enum(LEAD_SOURCES).default('form'),
  persona: z.enum(LEAD_PERSONAS).optional(),
  notes: z.string().optional(),
});

export const leadStatusSchema = z.enum(LEAD_STATUSES);
