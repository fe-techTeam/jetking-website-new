import { afterEach, describe, expect, it, vi } from 'vitest';
import { leadForLog, maskEmail, maskPhone, redactLead, safeError } from '@/lib/pii';

afterEach(() => vi.unstubAllEnvs());

const lead = {
  name: 'Asha Verma',
  phone: '+91 98765 43210',
  email: 'asha.verma@example.com',
  message: 'Please call me about the BCA course after 6pm',
  city: 'pune',
  source: 'enquiry-page',
  courseSlug: 'bca',
  receivedAt: '2026-10-19T00:00:00.000Z',
};

describe('redactLead', () => {
  it('masks identifying fields and keeps the routing fields support needs', () => {
    const out = redactLead(lead);
    expect(out.name).toBe('A***');
    expect(out.phone).toBe('*********210');
    expect(out.email).toBe('a***@example.com');
    expect(out.message).toBe(`[${lead.message.length} chars]`);
    expect(out).toMatchObject({ city: 'pune', source: 'enquiry-page', courseSlug: 'bca', receivedAt: lead.receivedAt });
    const text = JSON.stringify(out);
    for (const secret of ['Asha', 'Verma', '98765', 'asha.verma', 'call me']) expect(text).not.toContain(secret);
  });

  it('copes with odd values', () => {
    expect(maskPhone('12')).toBe('***');
    expect(maskEmail('not-an-email')).toBe('***');
    expect(redactLead({ name: 5, phone: undefined })).toEqual({ name: 5, phone: undefined });
  });
});

describe('leadForLog policy', () => {
  it('redacts in production by default', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(leadForLog(lead)).not.toContain('98765');
    expect(leadForLog(lead)).toContain('pune');
  });

  it('logs the full payload outside production (the only record when no database or CRM is configured)', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(leadForLog(lead)).toContain('+91 98765 43210');
  });

  it('LOG_LEAD_PAYLOADS overrides in both directions', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LOG_LEAD_PAYLOADS', 'true');
    expect(leadForLog(lead)).toContain('98765');
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LOG_LEAD_PAYLOADS', 'false');
    expect(leadForLog(lead)).not.toContain('98765');
  });
});

describe('safeError', () => {
  it('drops the bound query parameters that ORM errors append (they are the lead)', () => {
    const e = new Error('Failed query: insert into "leads" (name, phone) values ($1, $2)\nparams: Asha Verma,9876543210');
    e.name = 'DrizzleQueryError';
    (e as unknown as { cause: unknown }).cause = { code: '08006' };
    const out = safeError(e);
    expect(out).toContain('DrizzleQueryError');
    expect(out).toContain('08006');
    expect(out).not.toContain('Asha');
    expect(out).not.toContain('9876543210');
  });

  it('handles single-line messages that embed params and non-errors', () => {
    expect(safeError(new Error('Failed query: x params: 9876543210'))).not.toContain('9876543210');
    expect(safeError('weird')).toBe('unknown error');
  });
});
