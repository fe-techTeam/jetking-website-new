import 'server-only';
import type { Metadata } from 'next';
import { content } from '@/lib/content';
import { buildMetadata } from '@/lib/seo';
import { mergeCopy, type PageCopyDef } from './define';

/** A page's copy: its declared defaults with any published CMS overrides applied. */
export async function loadCopy<T extends Record<string, string>>(def: PageCopyDef<T>): Promise<T> {
  return mergeCopy(def.defaults, await content.getPageCopyOverrides(def.id));
}

/**
 * Metadata for a page from its `seo.*` copy fields — the one place a page's title, description and
 * share image are decided, so the admin's SEO fields and the page can't disagree. `seo.noindex` set to
 * "true" keeps the page out of search.
 */
export async function pageMetadata<T extends Record<string, string>>(
  def: PageCopyDef<T>,
  path: string,
  extra?: { canonicalPath?: string },
): Promise<Metadata> {
  const c = (await loadCopy(def)) as Record<string, string>;
  return buildMetadata(
    {
      title: c['seo.title'] ?? '',
      description: c['seo.description'] ?? '',
      ogImage: c['seo.ogImage'] || undefined,
      noindex: c['seo.noindex'] === 'true',
      canonicalPath: extra?.canonicalPath,
    },
    path,
  );
}
