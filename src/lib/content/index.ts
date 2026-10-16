import 'server-only';
import type { ContentSource } from './types';
import { localSource } from './sources/local';
import { adminSource } from './sources/admin';

export * from './types';

/**
 * Content source resolver — the single seam the CMS decision lands on.
 *
 * Marked `server-only` so Node modules (fs via Admin CMS store) never enter
 * the client bundle. Pages and RSC import this; client components must not.
 */
function resolveSource(): ContentSource {
  const configured = process.env.CONTENT_SOURCE ?? 'admin';

  switch (configured) {
    case 'local':
      return localSource;

    case 'admin':
      return adminSource;

    default:
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `CONTENT_SOURCE="${configured}" is not a known content source. ` +
            `Refusing to silently fall back in production.`,
        );
      }
      console.warn(`[content] Unknown CONTENT_SOURCE="${configured}", falling back to "local".`);
      return localSource;
  }
}

export const content: ContentSource = resolveSource();
