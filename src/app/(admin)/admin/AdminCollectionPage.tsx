import type { CmsCollection } from '@/lib/cms/types';
import { getAdminCollection, requireRole } from './actions';
import { RecordEditor } from './RecordEditor';
import { collectionByKey } from './registry';

/**
 * The page every CMS collection route renders. The collection's label, id field, description
 * and "where this appears on the website" all come from `registry.ts`, so a collection route is
 * a one-liner and can't disagree with the sidebar or the Website map.
 */
export async function AdminCollectionPage({ collection }: { collection: CmsCollection }) {
  const meta = collectionByKey(collection);
  await requireRole(meta.roles ?? ['admin', 'editor']);
  const items = await getAdminCollection(collection);

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
    />
  );
}
