/**
 * True when the browser says the request comes from another site's page. The site's own forms are same-origin,
 * so a public POST endpoint can refuse cross-site posts outright (a cheap CSRF / hot-linking guard).
 */
export function isCrossSite(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  let originHost: string | null = null;
  try {
    originHost = origin && origin !== 'null' ? new URL(origin).host : null;
  } catch {
    originHost = null;
  }
  return fetchSite === 'cross-site' || Boolean(originHost && host && originHost !== host);
}
