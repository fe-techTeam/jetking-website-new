import type { CmsCollection } from '@/lib/cms/types';
import { getAdminCollection, requireRole } from './actions';
import { RecordEditor } from './RecordEditor';
import { listCollection } from '@/lib/cms/store';
import { collectionByKey } from './registry';

/**
 * The page every CMS collection route renders. The collection's label, id field, description
 * and "where this appears on the website" all come from `registry.ts`, so a collection route is
 * a one-liner and can't disagree with the sidebar or the Website map.
 */
export async function AdminCollectionPage({
  collection,
  searchParams,
}: {
  collection: CmsCollection;
  /** `?open=<id>` opens that record first (used by the admin search). */
  searchParams?: Promise<{ open?: string }>;
}) {
  const meta = collectionByKey(collection);
  await requireRole(meta.roles ?? ['admin', 'editor']);
  const hidden = new Set(meta.hiddenRecordIds ?? []);
  const items = (await getAdminCollection(collection)).filter((r) => !hidden.has(String((r as unknown as Record<string, unknown>)[meta.idKey])));
  const open = (await searchParams)?.open;
  const [courses, centres, cities] = await Promise.all([listCollection('courses'), listCollection('centres'), listCollection('cities')]);
  const relations = {
    courses: courses.map((c) => ({ value: c.slug, label: c.title })),
    centres: centres.map((c) => ({ value: c.slug, label: c.name })),
    cities: cities.map((c) => ({ value: c.slug, label: c.name })),
  };

  return (
    <RecordEditor
      collection={collection}
      idKey={meta.idKey}
      initial={items}
      title={meta.label}
      description={meta.description}
      live={meta.live}
      appearsOn={meta.appearsOn}
      note={meta.note}
      mode={meta.mode}
      openId={open}
      relations={relations}
      viewPath={meta.viewPath}
    />
  );
}
