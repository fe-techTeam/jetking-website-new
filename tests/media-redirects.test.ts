import { afterAll, describe, expect, it } from 'vitest';
import { HAS_DB } from './helpers/db';
import { normalizeSource } from '@/lib/redirects/lookup';

describe('redirect matching', () => {
  it('ignores query, hash, trailing slash and case', () => {
    expect(normalizeSource('/Old-Page/?a=1#x')).toBe('/old-page');
    expect(normalizeSource('/')).toBe('/');
  });
});

describe.skipIf(!HAS_DB)('media library (Postgres)', async () => {
  const { saveMedia, getMediaBytes, deleteMedia, listMedia, MEDIA_MAX_BYTES } = await import('@/lib/media/store');
  const ids: string[] = [];
  // 1x1 PNG
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

  afterAll(async () => {
    for (const id of ids) await deleteMedia(id);
  });

  it('accepts a real PNG and serves the same bytes back', async () => {
    const r = await saveMedia({ name: '__test pic.png', bytes: png }, 'tester');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    ids.push(r.item.id);
    expect(r.item.url).toMatch(/^\/media\/[0-9a-f-]{36}\.png$/);
    const got = await getMediaBytes(r.item.id);
    expect(got?.mime).toBe('image/png');
    expect(got?.data.equals(png)).toBe(true);
    expect((await listMedia()).some((m) => m.id === r.item.id)).toBe(true);
  });

  it('rejects scripts disguised as images, SVG, empty and oversized files', async () => {
    expect((await saveMedia({ name: 'a.png', bytes: Buffer.from('<script>alert(1)</script>') }, 't')).ok).toBe(false);
    expect((await saveMedia({ name: 'a.svg', bytes: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') }, 't')).ok).toBe(false);
    expect((await saveMedia({ name: 'e.png', bytes: Buffer.alloc(0) }, 't')).ok).toBe(false);
    expect((await saveMedia({ name: 'big.png', bytes: Buffer.concat([png, Buffer.alloc(MEDIA_MAX_BYTES)]) }, 't')).ok).toBe(false);
  });
});
