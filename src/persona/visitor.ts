

/**
 * Anonymous visitor identity.
 *
 * Honest contract: a first-party cookie (mirrored in localStorage) is enough to
 * resume a journey on the *same browser*. It is not enough to claim a name or
 * recognise someone on another device. That requires mobile/email/OTP later.
 *
 * Cookie found  → known (may resume)
 * Cookie absent → new (mint ID, start fresh)
 */

export const VISITOR_COOKIE = 'jk_visitor_id';
export const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const STORAGE_KEY = 'jk_visitor_id_v1';
const IDENTITY_KEY = 'jk_identity_link_v1';

export type VisitorState = 'new' | 'known';

export interface VisitorProfile {
  id: string;
  state: VisitorState;
  /** True when this call created the ID (first touch on this browser). */
  minted: boolean;
}

export interface LinkedIdentity {
  visitorId: string;
  phone?: string;
  email?: string;
  /** Volunteered first name — used to personalise, never inferred. */
  name?: string;
  linkedAt: string;
}

function readCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function writeVisitorCookie(id: string): void {
  if (typeof document === 'undefined') return;
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${VISITOR_COOKIE}=${encodeURIComponent(id)}; Max-Age=${VISITOR_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

function readStoredId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const fromCookie = readCookieValue(VISITOR_COOKIE);
    if (fromCookie && isValidVisitorId(fromCookie)) return fromCookie;
    const fromStorage = window.localStorage.getItem(STORAGE_KEY);
    if (fromStorage && isValidVisitorId(fromStorage)) return fromStorage;
  } catch {
    // Storage disabled — treat as new.
  }
  return undefined;
}

function persistId(id: string): void {
  writeVisitorCookie(id);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Quota / private mode — cookie alone is still enough for same-browser resume.
  }
}

/** `JK_` + 10 base36 chars from CSPRNG — e.g. JK_A7K2M9QX1P */
export function mintVisitorId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  const body = n.toString(36).toUpperCase().padStart(10, '0').slice(0, 10);
  return `JK_${body}`;
}

export function isValidVisitorId(value: string): boolean {
  return /^JK_[A-Z0-9]{6,16}$/i.test(value);
}

/**
 * Ensure a visitor ID exists. Restores from localStorage → cookie, else mints.
 *
 * `known` only when localStorage already held the ID (prior visit on this browser).
 * An edge-minted cookie alone on first paint is still `new` — we have not yet
 * accumulated a same-browser history the visitor would recognise.
 */
export function ensureVisitorId(): VisitorProfile {
  if (typeof window === 'undefined') {
    return { id: '', state: 'new', minted: true };
  }

  let fromStorage: string | undefined;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && isValidVisitorId(raw)) fromStorage = raw;
  } catch {
    fromStorage = undefined;
  }

  if (fromStorage) {
    persistId(fromStorage);
    return { id: fromStorage, state: 'known', minted: false };
  }

  const fromCookie = readCookieValue(VISITOR_COOKIE);
  if (fromCookie && isValidVisitorId(fromCookie)) {
    persistId(fromCookie);
    return { id: fromCookie, state: 'new', minted: false };
  }

  const id = mintVisitorId();
  persistId(id);
  return { id, state: 'new', minted: true };
}

/** Server/edge: reuse existing cookie value or mint a new one. */
export function resolveVisitorId(existing: string | undefined): { id: string; minted: boolean } {
  if (existing && isValidVisitorId(existing)) {
    return { id: existing, minted: false };
  }
  return { id: mintVisitorId(), minted: true };
}

/**
 * After brochure / counselling / enquiry: bind anonymous ID to phone/email locally
 * so the CRM payload can carry both. Cross-device reclaim still needs OTP later.
 */
export function linkVisitorIdentity(input: {
  phone?: string;
  email?: string;
  name?: string;
  visitorId?: string;
}): LinkedIdentity | null {
  if (typeof window === 'undefined') return null;
  const visitorId = input.visitorId ?? readStoredId();
  if (!visitorId) return null;

  const phone = input.phone?.replace(/\s+/g, '').trim() || undefined;
  const email = input.email?.trim().toLowerCase() || undefined;
  const name = input.name?.trim() || undefined;
  // A name alone is not an identity link — it cannot be reconciled with a CRM row.
  if (!phone && !email) return null;

  const linked: LinkedIdentity = {
    visitorId,
    phone,
    email,
    name,
    linkedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(IDENTITY_KEY, JSON.stringify(linked));
  } catch {
    // Best-effort — CRM still receives visitorId on the request body.
  }
  return linked;
}
