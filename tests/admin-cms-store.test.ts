import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CMS_COLLECTIONS } from '@/lib/cms/schemas';

/** In-memory stand-in for data/cms/store.json — the real file is never touched. */
const disk = vi.hoisted(() => ({ content: '' as string, writes: 0 }));

vi.mock('node:fs', () => {
  const promises = {
    readFile: vi.fn(async () => {
      if (!disk.content) throw Object.assign(new Error('nope'), { code: 'ENOENT' });
      return disk.content;
    }),
    writeFile: vi.fn(async (_p: string, data: string) => {
      disk.content = data;
      disk.writes++;
    }),
    rename: vi.fn(async () => {}),
    mkdir: vi.fn(async () => {}),
  };
  return { promises, default: { promises } };
});

const { DuplicateIdError, deleteRecord, listCollection, resetCmsStoreFromFixtures, upsertRecord } = await import('@/lib/cms/store');

const faq = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  question: 'Q?',
  answer: 'A.',
  topic: 'fees',
  personaRelevance: {},
  status: 'published',
  ...extra,
});

function seedDisk(faqs: unknown[]) {
  const store: Record<string, unknown[]> = {};
  for (const key of CMS_COLLECTIONS) store[key] = [];
  store.faqs = faqs;
  disk.content = JSON.stringify(store);
  disk.writes = 0;
}

beforeEach(() => {
  delete process.env.DATABASE_URL;
  seedDisk([faq('a'), faq('b', { status: 'draft' }), faq('c')]);
});

describe('file store: publish filtering', () => {
  it('publishedOnly hides drafts; the admin view shows them', async () => {
    const all = await listCollection('faqs');
    const pub = await listCollection('faqs', { publishedOnly: true });
    expect(all.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(pub.map((r) => r.id)).toEqual(['a', 'c']);
  });
  it('a row with a missing or unknown status is not public', async () => {
    seedDisk([faq('x', { status: undefined }), faq('y', { status: 'archived' }), faq('z')]);
    expect((await listCollection('faqs', { publishedOnly: true })).map((r) => r.id)).toEqual(['z']);
  });
  it('publishedOnly sanitises rich FAQ answers on the way out', async () => {
    seedDisk([faq('x', { answer: '<p>ok</p><script>alert(1)</script>' })]);
    const [row] = await listCollection('faqs', { publishedOnly: true });
    expect(row!.answer).toBe('<p>ok</p>');
  });
});

describe('file store: create, rename, duplicate', () => {
  it('creating over an existing id is refused and nothing is written', async () => {
    await expect(upsertRecord('faqs', faq('a'), 'id')).rejects.toBeInstanceOf(DuplicateIdError);
    expect(disk.writes).toBe(0);
  });
  it('creates a new record at the end', async () => {
    await upsertRecord('faqs', faq('d'), 'id');
    expect((await listCollection('faqs')).map((r) => r.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('editing keeps the position and replaces the content', async () => {
    await upsertRecord('faqs', faq('b', { answer: 'New' }), 'id', 'b');
    const rows = await listCollection('faqs');
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(rows[1]!.answer).toBe('New');
  });
  it('renaming moves the row in place and leaves no stale original', async () => {
    await upsertRecord('faqs', faq('b2'), 'id', 'b');
    expect((await listCollection('faqs')).map((r) => r.id)).toEqual(['a', 'b2', 'c']);
  });
  it('renaming onto another record\'s id is refused', async () => {
    await expect(upsertRecord('faqs', faq('c'), 'id', 'a')).rejects.toBeInstanceOf(DuplicateIdError);
    expect((await listCollection('faqs')).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
  it('deleting removes only the matching id', async () => {
    await deleteRecord('faqs', 'id', 'a');
    expect((await listCollection('faqs')).map((r) => r.id)).toEqual(['b', 'c']);
  });
  it('deleting an unknown id changes nothing', async () => {
    await deleteRecord('faqs', 'id', 'zzz');
    expect((await listCollection('faqs')).length).toBe(3);
  });
  it('concurrent saves are serialised, none is lost', async () => {
    await Promise.all([upsertRecord('faqs', faq('n1'), 'id'), upsertRecord('faqs', faq('n2'), 'id'), upsertRecord('faqs', faq('n3'), 'id')]);
    expect((await listCollection('faqs')).map((r) => r.id)).toEqual(['a', 'b', 'c', 'n1', 'n2', 'n3']);
  });
  it('a missing collection key in an older store file is filled from the defaults, not crashed on', async () => {
    disk.content = JSON.stringify({ faqs: [faq('a')] });
    expect(Array.isArray(await listCollection('courses'))).toBe(true);
  });
  it('reset from fixtures rewrites the whole store', async () => {
    const seeded = await resetCmsStoreFromFixtures();
    expect(seeded.faqs.length).toBeGreaterThan(3);
    expect(JSON.parse(disk.content).faqs.length).toBe(seeded.faqs.length);
  });
  it('a corrupt store file is never silently reseeded', async () => {
    disk.content = '{not json';
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(listCollection('faqs')).rejects.toThrow();
    spy.mockRestore();
    expect(disk.content).toBe('{not json');
  });
});

describe('file store: parse cache', () => {
  it('parses the store file once for repeated reads, and still sees any change on disk', async () => {
    const parse = vi.spyOn(JSON, 'parse');
    const big = (n: number) => parse.mock.calls.filter(([s]) => typeof s === 'string' && s.length > 200).length - n;

    seedDisk([faq('a'), faq('b')]);
    await listCollection('faqs');
    const afterFirst = big(0);
    await listCollection('faqs');
    await listCollection('faqs', { publishedOnly: true });
    await listCollection('courses');
    expect(big(0)).toBe(afterFirst); // no further parsing of the same file text

    seedDisk([faq('a'), faq('b'), faq('c')]); // changed on disk (another instance, a hand edit)
    expect((await listCollection('faqs')).map((r) => r.id)).toEqual(['a', 'b', 'c']);
    parse.mockRestore();
  });

  it('a cached read cannot be corrupted by a caller that mutates what it got back', async () => {
    seedDisk([faq('a')]);
    const first = await listCollection('faqs');
    first.push(faq('intruder') as never);
    expect((await listCollection('faqs')).map((r) => r.id)).toEqual(['a']);
  });
});
