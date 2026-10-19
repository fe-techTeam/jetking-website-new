import { beforeEach, describe, expect, it, vi } from 'vitest';

/** A fake drizzle client that records what the location helpers write, so no Postgres is needed. */
const state = { existing: [] as unknown[], inserted: [] as { slug: string; overwrite: boolean }[], deletes: 0 };

function fakeTx() {
  return {
    select: () => ({ from: () => ({ limit: async () => state.existing }) }),
    delete: () => ({
      where: async () => {
        state.deletes++;
      },
      then: (resolve: () => void) => {
        state.deletes++;
        resolve();
      },
    }),
    insert: () => ({
      values: (row: { slug: string }) => {
        const record = (overwrite: boolean) => Promise.resolve(state.inserted.push({ slug: row.slug, overwrite }));
        return { onConflictDoUpdate: () => record(true), onConflictDoNothing: () => record(false) };
      },
    }),
  };
}

vi.mock('@/lib/db/client', () => ({
  getDb: () => ({ transaction: async (fn: (tx: unknown) => Promise<void>) => fn(fakeTx()) }),
}));

import { resetLocationRows, upsertLocationRow } from '@/lib/cms/locations-db';

const centre = (slug: string) => ({
  slug,
  name: `Jetking ${slug}`,
  citySlug: 'pune',
  addressLine: 'addr',
  locality: 'loc',
  state: 'Maharashtra',
  pincode: '411001',
  coursesOffered: [],
  seo: { title: 't', description: 'd' },
  status: 'published',
});

describe('location rows (Postgres helpers, mocked client)', () => {
  beforeEach(() => {
    state.existing = [];
    state.inserted = [];
    state.deletes = 0;
  });

  it('copies the baseline in first when the table is still empty, so one edit cannot shrink the directory', async () => {
    await upsertLocationRow('centres', centre('a'), 'a', [centre('a'), centre('b'), centre('c')]);
    const slugs = state.inserted.map((i) => i.slug);
    expect(slugs).toEqual(['a', 'b', 'c', 'a']);
    // baseline rows never overwrite; the edited record does.
    expect(state.inserted.slice(0, 3).every((i) => !i.overwrite)).toBe(true);
    expect(state.inserted[3]).toEqual({ slug: 'a', overwrite: true });
  });

  it('does not re-copy the baseline once the table has rows', async () => {
    state.existing = [{ slug: 'x' }];
    await upsertLocationRow('centres', centre('a'), 'a', [centre('a'), centre('b')]);
    expect(state.inserted).toEqual([{ slug: 'a', overwrite: true }]);
  });

  it('deletes the old row on a rename', async () => {
    state.existing = [{ slug: 'x' }];
    await upsertLocationRow('centres', centre('new'), 'old');
    expect(state.deletes).toBe(1);
    expect(state.inserted).toEqual([{ slug: 'new', overwrite: true }]);
  });

  it('reset replaces every row with the given records', async () => {
    await resetLocationRows('centres', [centre('a'), centre('b')]);
    expect(state.deletes).toBe(1);
    expect(state.inserted.map((i) => i.slug)).toEqual(['a', 'b']);
  });
});
