import { afterAll, describe, expect, it } from 'vitest';
import { HAS_DB } from './helpers/db';

const run = describe.skipIf(!HAS_DB);

run('CMS store (Postgres)', async () => {
  const { DuplicateIdError, deleteRecord, listCollection, upsertRecord } = await import('@/lib/cms/store');
  const { listDeleted, listRevisions } = await import('@/lib/cms/revisions');
  const { getDb } = await import('@/lib/db/client');
  const { cmsRecords, cmsRevisions } = await import('@/lib/db/schema');
  const { like } = await import('drizzle-orm');

  const faq = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    question: 'Q?',
    answer: 'A.',
    topic: 'admissions',
    personaRelevance: {},
    status: 'published',
    ...extra,
  });

  afterAll(async () => {
    const db = getDb()!;
    await db.delete(cmsRecords).where(like(cmsRecords.recordId, '__test_%'));
    await db.delete(cmsRevisions).where(like(cmsRevisions.recordId, '__test_%'));
  });

  it('creates, lists, and filters drafts out of the published view', async () => {
    await upsertRecord('faqs', faq('__test_a'), 'id', undefined, 'tester');
    await upsertRecord('faqs', faq('__test_draft', { status: 'draft' }), 'id', undefined, 'tester');
    const all = await listCollection('faqs');
    const published = await listCollection('faqs', { publishedOnly: true });
    expect(all.some((r) => r.id === '__test_draft')).toBe(true);
    expect(published.some((r) => r.id === '__test_a')).toBe(true);
    expect(published.some((r) => r.id === '__test_draft')).toBe(false);
  });

  it('refuses to create over an existing id, but allows editing it', async () => {
    await expect(upsertRecord('faqs', faq('__test_a'), 'id', undefined, 'tester')).rejects.toBeInstanceOf(DuplicateIdError);
    await upsertRecord('faqs', faq('__test_a', { answer: 'Changed.' }), 'id', '__test_a', 'tester');
    const row = (await listCollection('faqs')).find((r) => r.id === '__test_a');
    expect(row?.answer).toBe('Changed.');
  });

  it('renames a record in place and keeps its list position', async () => {
    const before = (await listCollection('faqs')).findIndex((r) => r.id === '__test_a');
    await upsertRecord('faqs', faq('__test_b'), 'id', '__test_a', 'tester');
    const rows = await listCollection('faqs');
    expect(rows.some((r) => r.id === '__test_a')).toBe(false);
    expect(rows.findIndex((r) => r.id === '__test_b')).toBe(before);
    await expect(upsertRecord('faqs', faq('__test_draft'), 'id', '__test_b', 'tester')).rejects.toBeInstanceOf(DuplicateIdError);
  });

  it('records a revision per save and keeps deleted records restorable', async () => {
    const history = await listRevisions('faqs', '__test_b');
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history[0]!.actorName).toBe('tester');

    await deleteRecord('faqs', 'id', '__test_b', 'tester');
    expect((await listCollection('faqs')).some((r) => r.id === '__test_b')).toBe(false);
    const trash = await listDeleted('faqs');
    const entry = trash.find((r) => r.recordId === '__test_b');
    expect(entry?.data.id).toBe('__test_b');
  });
});
