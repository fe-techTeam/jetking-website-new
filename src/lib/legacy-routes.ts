/**
 * @deprecated Redirect pairs live in `redirects.json` (build-time, via next.config)
 * and Admin → Redirects (runtime DB, via `src/proxy.ts`). This module is kept only so
 * older docs/imports do not break — it exports nothing useful.
 */
export interface LegacyRedirect {
  source: string;
  destination: string;
  permanent?: boolean;
}

/** Empty — do not add pairs here. */
export const legacyRedirects: LegacyRedirect[] = [];
