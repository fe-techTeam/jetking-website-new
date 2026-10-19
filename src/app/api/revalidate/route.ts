import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { publishContent } from '@/lib/cms/publish';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';

/** Constant-time compare — a fast-exit `!==` leaks the secret one byte at a time. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Admin CMS / CI webhook → ISR revalidation.
 * Authorize with Bearer REVALIDATE_SECRET — required in production; fails closed
 * rather than silently accepting every caller when the secret is unset.
 */
const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
const MAX_PATHS = 50;

export async function POST(req: Request) {
  // Throttle before authenticating, so the secret cannot be brute-forced at wire speed.
  const limit = await limiter.check(clientKey(req));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many revalidate requests.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter || 60) } },
    );
  }

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Revalidate is not configured.' }, { status: 503 });
    }
  } else {
    const auth = req.headers.get('authorization') ?? '';
    if (!secretMatches(auth, `Bearer ${secret}`)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let paths: string[] | undefined;
  try {
    const body = (await req.json()) as { paths?: string[] };
    paths = Array.isArray(body.paths)
      ? body.paths.filter((p): p is string => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && p.length <= 200).slice(0, MAX_PATHS)
      : undefined;
  } catch {
    // empty body is fine
  }

  await publishContent({ paths });
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
