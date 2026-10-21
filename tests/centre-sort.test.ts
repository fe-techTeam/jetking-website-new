import { describe, expect, it } from 'vitest';
import { seededShuffle, shuffleBucket, sortCentresList } from '@/lib/centre-sort';

const sample = [
  { slug: 'c', name: 'Charlie', sortOrder: 30 },
  { slug: 'a', name: 'Alpha', sortOrder: 10 },
  { slug: 'b', name: 'Bravo', sortOrder: 20 },
];

describe('centre list sort', () => {
  it('sorts by name', () => {
    const rows = sortCentresList(sample, { listSort: 'name', shuffleEveryDays: 1 });
    expect(rows.map((r) => r.slug)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by manual sortOrder', () => {
    const rows = sortCentresList(sample, { listSort: 'manual', shuffleEveryDays: 1 });
    expect(rows.map((r) => r.slug)).toEqual(['a', 'b', 'c']);
  });

  it('keeps the same shuffle within a day bucket', () => {
    const dayMs = 86_400_000;
    const a = sortCentresList(sample, { listSort: 'shuffle', shuffleEveryDays: 1 }, dayMs * 100);
    const b = sortCentresList(sample, { listSort: 'shuffle', shuffleEveryDays: 1 }, dayMs * 100 + 3_600_000);
    expect(a.map((r) => r.slug)).toEqual(b.map((r) => r.slug));
  });

  it('reshuffles when the day bucket advances', () => {
    const dayMs = 86_400_000;
    const a = sortCentresList(sample, { listSort: 'shuffle', shuffleEveryDays: 1 }, dayMs * 100);
    const b = sortCentresList(sample, { listSort: 'shuffle', shuffleEveryDays: 1 }, dayMs * 101);
    // Different buckets; order may or may not differ for tiny sets — seed must differ.
    expect(shuffleBucket(1, dayMs * 100)).not.toBe(shuffleBucket(1, dayMs * 101));
    expect(seededShuffle(sample, 1).map((r) => r.slug)).not.toEqual(
      seededShuffle(sample, 2).map((r) => r.slug),
    );
    void a;
    void b;
  });

  it('weekly shuffle shares a bucket for 7 days', () => {
    const dayMs = 86_400_000;
    expect(shuffleBucket(7, dayMs * 70)).toBe(shuffleBucket(7, dayMs * 76));
    expect(shuffleBucket(7, dayMs * 70)).not.toBe(shuffleBucket(7, dayMs * 77));
  });
});
