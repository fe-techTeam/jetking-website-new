import { describe, expect, it } from 'vitest';
import { asStatus, centreFromRow, centreToRow, cityFromRow, cityToRow } from '@/lib/cms/locations-map';
import { centres, cities } from '@/lib/content/fixtures/locations';
import { validateCmsRecord } from '@/lib/cms/schemas';

/** What Postgres hands back for an inserted row: the insert values plus a real timestamp. */
const asRow = (values: object) => ({ ...values }) as never;

describe('centre row mapping', () => {
  it('round-trips every shipped centre (all fields except the regenerated updatedAt)', () => {
    for (const centre of centres) {
      const record = { ...centre, status: 'published' } as Record<string, unknown>;
      const back = centreFromRow(asRow(centreToRow(record))) as unknown as Record<string, unknown>;
      const { updatedAt: _a, ...expected } = record;
      const { updatedAt: _b, ...actual } = back;
      expect(actual).toEqual(JSON.parse(JSON.stringify(expected)));
    }
  });

  it('folds non-column fields into details and keeps columns out of it', () => {
    const row = centreToRow({
      slug: 's', citySlug: 'c', name: 'n', addressLine: 'a', locality: 'l', state: 'st', pincode: '1',
      coursesOffered: ['x'], seo: { title: 't', description: 'd' }, headline: 'H', gallery: [{ url: '/a.png' }],
      status: 'draft', updatedAt: 'ignored',
    });
    expect(row.details).toEqual({ headline: 'H', gallery: [{ url: '/a.png' }] });
    expect(row.status).toBe('draft');
    expect(row.updatedAt).toBeInstanceOf(Date);
  });

  it('maps geo to lat/lng columns and back; no geo -> nulls -> no geo', () => {
    const base = { slug: 's', citySlug: 'c', name: 'n', addressLine: 'a', locality: 'l', state: 'st', pincode: '1', seo: {} };
    const withGeo = centreToRow({ ...base, geo: { lat: 19.1, lng: 72.8 } });
    expect([withGeo.lat, withGeo.lng]).toEqual([19.1, 72.8]);
    expect(centreFromRow(asRow(withGeo)).geo).toEqual({ lat: 19.1, lng: 72.8 });
    const without = centreToRow(base);
    expect([without.lat, without.lng]).toEqual([null, null]);
    expect(centreFromRow(asRow(without)).geo).toBeUndefined();
  });

  it('a row can never override a column through a hostile details blob', () => {
    const row = asRow({ ...centreToRow({ slug: 'real', citySlug: 'c', name: 'n', addressLine: 'a', locality: 'l', state: 's', pincode: '1', seo: {} }), details: { slug: 'evil', status: 'draft' } });
    const record = centreFromRow(row);
    expect(record.slug).toBe('real');
    expect(record.status).toBe('published');
  });

  it('an unknown / missing status is treated as published only when it is not "draft"', () => {
    expect(asStatus('draft')).toBe('draft');
    expect(asStatus('published')).toBe('published');
    expect(asStatus('whatever')).toBe('published');
  });

  it('a mapped centre still passes the centre schema', () => {
    const record = centreFromRow(asRow(centreToRow({ ...centres[0], status: 'published' } as Record<string, unknown>)));
    expect(validateCmsRecord('centres', { ...record }).ok).toBe(true);
  });
});

describe('city row mapping', () => {
  it('round-trips every shipped city', () => {
    for (const city of cities) {
      const record = { ...city, status: 'published' } as Record<string, unknown>;
      const back = cityFromRow(asRow(cityToRow(record))) as unknown as Record<string, unknown>;
      const { updatedAt: _a, ...expected } = record;
      const { updatedAt: _b, ...actual } = back;
      expect(actual).toEqual(JSON.parse(JSON.stringify(expected)));
    }
  });
  it('keeps draft status', () => {
    expect(cityFromRow(asRow(cityToRow({ ...cities[0], status: 'draft' } as Record<string, unknown>))).status).toBe('draft');
  });
});
