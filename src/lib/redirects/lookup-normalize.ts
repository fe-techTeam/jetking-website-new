/** Canonical form used for matching: no query, no trailing slash (except root), lower-cased path. */
export function normalizeSource(path: string): string {
  const noQuery = path.split(/[?#]/)[0] ?? '';
  const trimmed = noQuery.length > 1 ? noQuery.replace(/\/+$/, '') : noQuery;
  return trimmed.toLowerCase();
}
