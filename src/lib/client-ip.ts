/**
 * The client's IP as a rate-limit key, taken only from headers a trusted proxy controls.
 *
 * `X-Forwarded-For` is a list each proxy appends to; everything left of the proxies *we* run is whatever the
 * caller chose to send. Trusting the first entry (the old behaviour) lets anyone rotate the key per request
 * and walk past every limiter. So:
 *
 *  - On Vercel, `x-vercel-forwarded-for` is set by the platform and cannot be supplied by the caller.
 *  - Otherwise, `TRUSTED_PROXY_HOPS` is how many proxies of ours append to `X-Forwarded-For` (default 1: one
 *    reverse proxy / load balancer in front of the app). The client is the entry that many from the right.
 *  - `TRUSTED_PROXY_HOPS=0` means the app is reached directly: the header is ignored and everyone shares the
 *    'anonymous' bucket (strict, but cannot be spoofed).
 */

const MAX_KEY_LENGTH = 64;

function clean(value: string | null | undefined): string | null {
  const v = value?.trim();
  if (!v) return null;
  // Keep only characters an IPv4/IPv6 address can contain, so the key is safe to log and store.
  return /^[0-9a-fA-F:.]+$/.test(v) ? v.slice(0, MAX_KEY_LENGTH) : null;
}

function trustedHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (raw === undefined || raw.trim() === '') return 1;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n <= 10 ? n : 1;
}

export function clientIpFromHeaders(headers: Pick<Headers, 'get'>): string {
  if (process.env.VERCEL) {
    const vercel = clean(headers.get('x-vercel-forwarded-for')?.split(',')[0]);
    if (vercel) return vercel;
  }
  const hops = trustedHops();
  if (hops === 0) return 'anonymous';

  const entries = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (entries.length === 0) return 'anonymous';
  // Fewer entries than trusted hops: the request skipped a proxy, so the leftmost entry is the best we have.
  const index = Math.max(0, entries.length - hops);
  return clean(entries[index]) ?? 'anonymous';
}
