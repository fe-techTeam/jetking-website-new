import { normalizeSource } from './lookup-normalize';

/** Paths the proxy never redirects (or must never be shadowed by a rule). */
export const RESERVED_SOURCE = /^\/(admin|api|_next|media)(\/|$)/i;
export const MAX_URL_LENGTH = 500;
export const MAX_IMPORT_LINES = 2000;

export type RedirectValidation = { ok: true; source: string; destination: string } | { ok: false; error: string };

/** Control characters, whitespace and backslashes: browsers strip or rewrite them, so `/\evil.com` or `/<TAB>/evil.com` become `//evil.com`. */
const UNSAFE_CHARS = /[\s\u0000-\u001f\u007f\\]/;
const UNSAFE_SOURCE = /[\s?#\u0000-\u001f\u007f\\]/;

export function validateRedirect(sourceRaw: string, destinationRaw: string): RedirectValidation {
  const source = String(sourceRaw ?? '').trim();
  const destination = String(destinationRaw ?? '').trim();
  if (source.length > MAX_URL_LENGTH || destination.length > MAX_URL_LENGTH) return { ok: false, error: 'URLs can be at most 500 characters.' };
  if (!source.startsWith('/') || source.startsWith('//') || UNSAFE_SOURCE.test(source)) {
    return { ok: false, error: 'The old URL must be a path like /old-page (no spaces, query or #).' };
  }
  if (RESERVED_SOURCE.test(source)) return { ok: false, error: 'Admin, API and media paths cannot be redirected.' };
  const isPath = destination.startsWith('/') && !destination.startsWith('//');
  if (UNSAFE_CHARS.test(destination) || (!isPath && !/^https:\/\/[^\s/]+/i.test(destination))) {
    return { ok: false, error: 'The new URL must be a path like /courses or a full https:// link.' };
  }
  if (normalizeSource(source) === normalizeSource(destination)) return { ok: false, error: 'The old and new URL are the same.' };
  return { ok: true, source, destination };
}

/**
 * Follows `destination` through the existing rules. Returns the rule that closes a cycle back to
 * `source` (so a → b → c → a is caught, not only a ↔ b), or null. Bounded, so bad data cannot spin.
 */
export function findRedirectLoop(
  rules: Array<{ source: string; destination: string }>,
  source: string,
  destination: string,
): { source: string; destination: string } | null {
  const bySource = new Map(rules.map((r) => [normalizeSource(r.source), r]));
  const start = normalizeSource(source);
  let current = normalizeSource(destination);
  for (let hops = 0; hops < 25; hops++) {
    if (current === start) return hops === 0 ? { source, destination } : null;
    const rule = bySource.get(current);
    if (!rule) return null;
    if (normalizeSource(rule.destination) === start) return rule;
    current = normalizeSource(rule.destination);
  }
  return null;
}
