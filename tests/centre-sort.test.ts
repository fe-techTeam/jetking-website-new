import { describe, expect, it } from 'vitest';
import { seededShuffle, shuffleBucket, sortCentresList } from '@/lib/centre-sort';

const sample = [
  { slug: 'c', name: 'Charlie', sortOrder: 30 },
  { slug: 'a', name: 'Alpha', sortOrder: 10 },
  { slug: 'b', name: 'Bravo', sortOrder: 20 },
];

const byCity = [
  { slug: 'delhi-south', name: 'Delhi South', citySlug: 'delhi' },
  { slug: 'mumbai-dadar', name: 'Dadar', citySlug: 'mumbai' },
  { slug: 'delhi-north', name: 'Delhi North', citySlug: 'delhi' },
  { slug: 'mumbai-andheri', name: 'Andheri', citySlug: 'mumbai' },
  { slug: 'delhi-east', name: 'Delhi East', citySlug: 'delhi' },
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

  it('shuffles centres within each city without mixing cities', () => {
    const dayMs = 86_400_000;
    const rows = sortCentresList(byCity, { listSort: 'shuffle', shuffleEveryDays: 1 }, dayMs * 100);
    const cities = rows.map((r) => r.citySlug);
    // Cities stay contiguous and A–Z by slug (delhi before mumbai).
    expect(cities).toEqual(['delhi', 'delhi', 'delhi', 'mumbai', 'mumbai']);
    expect(rows.filter((r) => r.citySlug === 'delhi').map((r) => r.slug).sort()).toEqual([
      'delhi-east',
      'delhi-north',
      'delhi-south',
    ]);
    expect(rows.filter((r) => r.citySlug === 'mumbai').map((r) => r.slug).sort()).toEqual([
      'mumbai-andheri',
      'mumbai-dadar',
    ]);
  });

  it('keeps city-wise shuffle stable within a bucket', () => {
    const dayMs = 86_400_000;
    const a = sortCentresList(byCity, { listSort: 'shuffle', shuffleEveryDays: 1 }, dayMs * 200);
    const b = sortCentresList(byCity, { listSort: 'shuffle', shuffleEveryDays: 1 }, dayMs * 200 + 60_000);
    expect(a.map((r) => r.slug)).toEqual(b.map((r) => r.slug));
  });
});
