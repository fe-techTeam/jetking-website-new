import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ select: vi.fn() }));

vi.mock('@/lib/db/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db/client')>('@/lib/db/client');
  return { ...actual, getDb: () => ({ select: h.select }) };
});

import { isDbDown, markDbDown, resetDbBreaker } from '@/lib/db/client';
import { listLocationRows } from '@/lib/cms/locations-db';
import { listRecordRows } from '@/lib/cms/records-db';

beforeEach(() => {
  resetDbBreaker();
  h.select.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('shared database breaker (keeps a build/page from waiting on a down database)', () => {
  it('one failed read makes every other reader skip the database instead of waiting out its own timeout', async () => {
    h.select.mockImplementation(() => {
      throw new Error('connect ECONNREFUSED');
    });
    expect(await listLocationRows('centres')).toBeNull();
    expect(isDbDown()).toBe(true);
    const callsAfterFirst = h.select.mock.calls.length;

    // The records layer and the locations layer now return the fallback signal without touching the database.
    expect(await listRecordRows('faqs', { idKey: 'id', seed: async () => [] })).toBeNull();
    expect(await listLocationRows('cities')).toBeNull();
    expect(h.select.mock.calls.length).toBe(callsAfterFirst);
  });

  it('a failure in the records layer also stops the locations layer', async () => {
    h.select.mockImplementation(() => {
      throw new Error('boom');
    });
    expect(await listRecordRows('faqs', { idKey: 'id', seed: async () => [] })).toBeNull();
    h.select.mockClear();
    expect(await listLocationRows('centres')).toBeNull();
    expect(h.select).not.toHaveBeenCalled();
  });

  it('recovers after the retry window', async () => {
    vi.useFakeTimers();
    markDbDown();
    expect(isDbDown()).toBe(true);
    vi.advanceTimersByTime(31_000);
    expect(isDbDown()).toBe(false);
    vi.useRealTimers();
  });
});
