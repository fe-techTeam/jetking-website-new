import { z } from 'zod';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { reportError } from '@/lib/error-report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  message: z.string().min(1).max(300),
  stack: z.string().max(2000).optional(),
  source: z.string().max(60).default('client'),
  url: z.string().max(300).default(''),
});

/** Generous enough for a real visitor on a flaky page, tight enough that this cannot be used to flood the log. */
const limiter = createRateLimiter({ windowMs: 10 * 60_000, max: 15 });

export async function POST(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site') return new Response(null, { status: 403 });

  const limit = await limiter.check(clientKey(request));
  if (!limit.allowed) return new Response(null, { status: 429 });

  // Largest legitimate payload is ~3 KB (message + stack + url); refuse anything much bigger before parsing it.
  if (Number(request.headers.get('content-length') ?? 0) > 8_192) return new Response(null, { status: 413 });

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 8_192) return new Response(null, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return new Response(null, { status: 400 });

  const { message, stack, source, url } = parsed.data;
  await reportError('client', { message, stack }, { url, source, ua: (request.headers.get('user-agent') ?? '').slice(0, 160) });
  return new Response(null, { status: 204 });
}
