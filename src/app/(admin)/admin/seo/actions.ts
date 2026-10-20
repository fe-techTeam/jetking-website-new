'use server';

import { requireRole } from '../actions';
import { listCollection, upsertRecord } from '@/lib/cms/store';
import { publishContent } from '@/lib/cms/publish';
import { recordAudit } from '@/lib/audit/log';
import { COPY_PAGES } from '@/lib/content/copy/registry';

const ROLES = ['admin', 'editor'] as const;
const RECORD_COLLECTIONS = ['courses', 'posts', 'centres', 'cities'] as const;
type RecordCollection = (typeof RECORD_COLLECTIONS)[number];

export interface SeoValues {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage: string;
  noindex: boolean;
}

export type SeoTarget =
  | { kind: 'page'; id: string; /** Dot prefix — `seo` or `privacy.seo`. */ fieldPrefix?: string }
  | { kind: 'record'; collection: RecordCollection; id: string };

function check(values: SeoValues): string | null {
  if (!values.title.trim()) return 'The title cannot be empty.';
  if (!values.description.trim()) return 'The description cannot be empty.';
  if (values.canonicalPath && !/^\/[^\s]*$|^https:\/\/\S+$/.test(values.canonicalPath)) {
    return 'The canonical URL must be a path like /courses or an https:// link.';
  }
  return null;
}

/** Saves one page's or record's SEO fields — the same fields the Page text and record editors write. */
export async function saveSeo(target: SeoTarget, values: SeoValues): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireRole([...ROLES]);
  const problem = check(values);
  if (problem) return { ok: false, error: problem };

  try {
    if (target.kind === 'page') {
      const page = COPY_PAGES.find((p) => p.id === target.id);
      if (!page) return { ok: false, error: 'Unknown page.' };
      const prefix = target.fieldPrefix ?? 'seo';
      const titleKey = `${prefix}.title`;
      const descKey = `${prefix}.description`;
      const ogKey = `${prefix}.ogImage`;
      const noindexKey = `${prefix}.noindex`;
      const canonicalKey = `${prefix}.canonicalPath`;
      // Only write keys the page still declares — matches mergeCopy.
      const declared = page.defaults as Record<string, string>;
      for (const key of [titleKey, descKey, ogKey, noindexKey, canonicalKey]) {
        if (!(key in declared)) {
          return { ok: false, error: `This page does not declare ${key}, so the change would not apply.` };
        }
      }
      const rows = (await listCollection('page_copy')) as unknown as Array<{
        id: string;
        entries: Record<string, string>;
        status: string;
      }>;
      const existing = rows.find((r) => r.id === target.id);
      const entries = {
        ...(existing?.entries ?? {}),
        [titleKey]: values.title.trim(),
        [descKey]: values.description.trim(),
        [ogKey]: values.ogImage.trim(),
        [noindexKey]: values.noindex ? 'true' : 'false',
        [canonicalKey]: values.canonicalPath.trim(),
      };
      await upsertRecord(
        'page_copy',
        { id: target.id, entries, status: 'published' },
        'id',
        existing ? target.id : undefined,
        user.name,
      );
    } else {
      if (!(RECORD_COLLECTIONS as readonly string[]).includes(target.collection)) {
        return { ok: false, error: 'Unknown collection.' };
      }
      const rows = (await listCollection(target.collection)) as unknown as Array<
        Record<string, unknown> & { slug: string; seo: Record<string, unknown> }
      >;
      const current = rows.find((r) => r.slug === target.id);
      if (!current) return { ok: false, error: 'Record not found.' };
      const seo = {
        ...current.seo,
        title: values.title.trim(),
        description: values.description.trim(),
        canonicalPath: values.canonicalPath.trim() || undefined,
        ogImage: values.ogImage.trim() || undefined,
        noindex: values.noindex || undefined,
      };
      await upsertRecord(target.collection, { ...current, seo }, 'slug', target.id, user.name);
    }
    await publishContent();
    void recordAudit(
      user,
      'cms.seo',
      target.kind === 'page' ? 'page_copy' : target.collection,
      target.id,
      `Updated SEO for ${target.id}`,
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Save failed.' };
  }
}
