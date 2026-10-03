/** Browser side of error reporting: a small, deduplicated beacon to `/api/client-error`. */

const sent = new Set<string>();
let count = 0;
const MAX_PER_PAGE_VIEW = 5;

export function sendClientError(error: unknown, source: string): void {
  if (typeof window === 'undefined') return;
  const e = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
  const message = (e.message || 'Unknown error').slice(0, 300);
  const key = `${source}:${message}`;
  if (sent.has(key) || count >= MAX_PER_PAGE_VIEW) return;
  sent.add(key);
  count += 1;

  const body = JSON.stringify({
    message,
    stack: e.stack?.slice(0, 2000),
    source,
    url: window.location.pathname + window.location.search,
  });
  try {
    if (!navigator.sendBeacon?.('/api/client-error', new Blob([body], { type: 'application/json' }))) {
      void fetch('/api/client-error', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true });
    }
  } catch {
    // Never let the reporter itself raise.
  }
}
