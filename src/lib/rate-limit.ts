/**
 * Rate limiting, behind an interface.
 *
 * ── The constraint that matters ────────────────────────────────────────────
 * The in-memory limiter counts per process. On a multi-instance deployment
 * (serverless, autoscaled containers, multiple regions) a visitor spread across
 * N instances gets N× the intended allowance. That is acceptable for development,
 * for staging, and for a single always-on Node process. It is NOT acceptable for a
 * production deployment that scales horizontally while `/api/chat` spends real
 * money per request.
 *
 * `assertProductionReady()` turns that from tribal knowledge into a startup failure:
 * set RATE_LIMIT_STORE=memory to explicitly accept the single-instance behaviour, or
 * wire a shared store. A production build refuses to start otherwise.
 *
 * Adding a shared store later is one class implementing `RateLimiter` plus a case in
 * `createRateLimiter()`. No route changes.
 */

interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the window resets. Sent as `retry-after`. */
  retryAfter: number;
}

export interface RateLimiter {
  readonly name: string;
  check(key: string): Promise<RateLimitResult>;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

/* ────────────────────────────────────────────────────────────────────────── */

class MemoryRateLimiter implements RateLimiter {
  readonly name = 'memory';
  private buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private config: RateLimitConfig) {}

  async check(key: string): Promise<RateLimitResult> {
    this.sweep();

    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      this.buckets.set(key, { count: 1, resetAt: now + this.config.windowMs });
      return { allowed: true, retryAfter: 0 };
    }

    if (bucket.count >= this.config.max) {
      return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
    }

    bucket.count += 1;
    return { allowed: true, retryAfter: 0 };
  }

  /** Opportunistic cleanup so a long-lived process cannot grow unbounded. */
  private sweep(): void {
    if (this.buckets.size < 5000) return;
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now > bucket.resetAt) this.buckets.delete(key);
    }
  }
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Fails a production server at boot rather than silently under-limiting.
 *
 * Deliberately NOT enforced during `next build`: the build does not know the
 * deployment topology, and failing there would break a fresh clone for no safety
 * gain. The decision belongs to whoever deploys, so that is where it is demanded.
 */
function assertProductionReady(store: string): void {
  if (process.env.NODE_ENV !== 'production') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  if (store !== 'memory') return;
  if (process.env.RATE_LIMIT_ALLOW_MEMORY === 'true') return;

  throw new Error(
    'Rate limiting is in-memory, which under-limits on a multi-instance deployment ' +
      'while /api/chat spends real money per request. Either wire a shared store ' +
      '(RATE_LIMIT_STORE=<store>) or, if this deploys as a single always-on instance, ' +
      'set RATE_LIMIT_ALLOW_MEMORY=true to accept the behaviour explicitly.',
  );
}

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const store = process.env.RATE_LIMIT_STORE ?? 'memory';
  assertProductionReady(store);

  switch (store) {
    case 'memory':
      return new MemoryRateLimiter(config);

    // case 'redis':
    //   return new RedisRateLimiter(config, process.env.REDIS_URL);

    default:
      throw new Error(`Unknown RATE_LIMIT_STORE="${store}".`);
  }
}

/** Best-effort client identity. Behind a proxy, the first XFF hop is the client. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return (
    forwarded?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    'anonymous'
  );
}
