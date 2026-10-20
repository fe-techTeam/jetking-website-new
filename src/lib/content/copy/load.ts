import 'server-only';
import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { mergeCopy, type PageCopyDef } from './define';
import { seoFromCopy } from './seo';

/** A page's copy: its declared defaults with any published CMS overrides applied. */
export async function loadCopy<T extends Record<string, string>>(def: PageCopyDef<T>): Promise<T> {
  return mergeCopy(def.defaults, await content.getPageCopyOverrides(def.id));
}

/**
 * Metadata for a page from its `seo.*` copy fields — the one place a page's title, description,
 * share image, canonical and noindex are decided, so the admin's SEO fields and the page can't
 * disagree. `seo.noindex` set to "true" keeps the page out of search.
 */
export async function pageMetadata<T extends Record<string, string>>(
  def: PageCopyDef<T>,
  path: string,
  extra?: { canonicalPath?: string; fill?: Record<string, string | number> },
): Promise<Metadata> {
  const c = (await loadCopy(def)) as Record<string, string>;
  const seo = seoFromCopy(c, extra?.fill);
  return buildMetadata(
    {
      ...seo,
      canonicalPath: extra?.canonicalPath || seo.canonicalPath,
    },
    path,
  );
}
