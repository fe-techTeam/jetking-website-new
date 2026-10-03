/**
 * Vendor-free error reporting.
 *
 * Every report is written to the server log as one JSON line prefixed `[error:<kind>]` (Vercel Logs,
 * a log drain or `grep` pick it up), and, when `ERROR_WEBHOOK_URL` is set, posted to that URL as a
 * Slack-compatible `{ text }` message. The same error is reported at most once per five minutes so a
 * hot loop cannot flood the channel.
 *
 * Swapping in Sentry later means calling `Sentry.captureException` from `reportError`; callers do not change.
 */

export type ErrorKind = 'server' | 'client' | 'render';

export interface ReportedError {
  message: string;
  stack?: string;
  digest?: string;
}

const THROTTLE_MS = 5 * 60_000;
const recent = new Map<string, number>();

export async function reportError(kind: ErrorKind, error: ReportedError, context: Record<string, unknown> = {}): Promise<void> {
  const now = Date.now();
  const signature = `${kind}:${error.message}`.slice(0, 200);
  const last = recent.get(signature);
  if (last && now - last < THROTTLE_MS) return;
  recent.set(signature, now);
  if (recent.size > 500) for (const [key, at] of recent) if (now - at > THROTTLE_MS) recent.delete(key);

  const record = {
    at: new Date(now).toISOString(),
    kind,
    message: error.message.slice(0, 500),
    stack: error.stack?.split('\n').slice(0, 12).join('\n'),
    digest: error.digest,
    ...context,
  };
  console.error(`[error:${kind}]`, JSON.stringify(record));

  const hook = process.env.ERROR_WEBHOOK_URL;
  if (!hook) return;
  try {
    await fetch(hook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: `Jetking ${kind} error: ${record.message}\n${String(context.path ?? context.url ?? '')}` }),
      signal: AbortSignal.timeout(4_000),
    });
  } catch {
    // Reporting must never throw into the request that triggered it.
  }
}
