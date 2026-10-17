import { notFound } from 'next/navigation';
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
  searchParams?: Promise<{ open?: string; question?: string }>;
}) {
  const meta = collectionByKey(collection);
  if (meta.hidden) notFound();
  await requireRole(meta.roles ?? ['admin', 'editor']);
  const hidden = new Set(meta.hiddenRecordIds ?? []);
  const items = (await getAdminCollection(collection)).filter((r) => !hidden.has(String((r as unknown as Record<string, unknown>)[meta.idKey])));
  const sp = await searchParams;
  const open = sp?.open;
  // `?question=` (from Unanswered questions) opens a new Custom answer with the question filled in.
  const prefill =
    collection === 'chatbot_knowledge' && sp?.question
      ? { id: sp.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60), question: sp.question.slice(0, 300), status: 'draft' }
      : undefined;
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
      prefill={prefill}
      relations={relations}
      viewPath={meta.viewPath}
    />
  );
}
