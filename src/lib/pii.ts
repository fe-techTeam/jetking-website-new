/**
 * Keeping personal data out of server logs.
 *
 * Lead payloads (name, phone, email, free-text message) used to be logged in full whenever storing or
 * forwarding failed. Logs are retained, shipped and read by people who have no business reading a
 * visitor's phone number, and a database error from the ORM also echoes the bound parameters (the same
 * data) in its message. Log lines now carry a redacted copy and a scrubbed error.
 *
 * The full payload is still logged outside production (it is the only record when no database or CRM is
 * wired up, which is the normal local setup), and in production only when `LOG_LEAD_PAYLOADS=true` is set
 * deliberately — for example as a last-resort recovery channel on a host whose logs are access-controlled.
 */

const MASK = '***';

export function maskName(value: string): string {
  const t = value.trim();
  return t ? `${t[0]}${MASK}` : '';
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length > 3 ? `${'*'.repeat(digits.length - 3)}${digits.slice(-3)}` : MASK;
}

export function maskEmail(value: string): string {
  const [local, domain] = value.trim().split('@');
  if (!domain) return MASK;
  return `${local?.[0] ?? ''}${MASK}@${domain}`;
}

/** Fields that identify a person, and how to mask each. Everything else (source, course, city, UTM…) is kept. */
const MASKERS: Record<string, (v: string) => string> = {
  name: maskName,
  phone: maskPhone,
  email: maskEmail,
  message: (v) => `[${v.length} chars]`,
  qualification: () => MASK,
};

export function redactLead<T extends Record<string, unknown>>(lead: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(lead)) {
    const mask = MASKERS[key];
    out[key] = mask && typeof value === 'string' ? mask(value) : value;
  }
  return out;
}

function logFullPayloads(): boolean {
  const flag = process.env.LOG_LEAD_PAYLOADS;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

/** What to put in a log line for a lead: the payload itself when policy allows, otherwise a redacted copy. */
export function leadForLog<T extends Record<string, unknown>>(lead: T): string {
  return JSON.stringify(logFullPayloads() ? lead : redactLead(lead));
}

/**
 * A log-safe description of an error. ORM errors (Drizzle) append the bound query parameters to their
 * message, which for a lead insert is the lead; keep the first line and the driver error code only.
 */
export function safeError(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown error';
  const firstLine = error.message.split('\n')[0] ?? '';
  const head = firstLine.replace(/\s*params:.*$/is, '').slice(0, 300);
  const cause = (error as { cause?: { code?: unknown } }).cause;
  const code = typeof cause?.code === 'string' ? ` (${cause.code})` : '';
  return `${error.name}: ${head}${code}`;
}
