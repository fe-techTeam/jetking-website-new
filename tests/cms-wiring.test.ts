import { describe, expect, it } from 'vitest';
import { CMS_COLLECTIONS } from '@/lib/cms/schemas';
import { CMS_ID_KEYS } from '@/lib/cms/id-keys';
import { ADMIN_FORM_CONFIG } from '@/lib/cms/admin-form-config';
import { COLLECTIONS, collectionByKey } from '../src/app/(admin)/admin/registry';

/**
 * A collection is wired in five places (schema, id key, form config, admin registry, store). A new
 * collection that misses one only fails at runtime in the admin, so check the wiring statically.
 */
describe('CMS collection wiring', () => {
  it('has an id key for every collection', () => {
    for (const key of CMS_COLLECTIONS) expect(CMS_ID_KEYS[key], key).toMatch(/^(slug|id)$/);
  });

  it('has a form config with a blank record for every collection', () => {
    for (const key of CMS_COLLECTIONS) {
      expect(ADMIN_FORM_CONFIG[key], key).toBeDefined();
      expect(typeof ADMIN_FORM_CONFIG[key].blank(), key).toBe('object');
    }
  });

  it('has an admin registry entry whose id key matches the store', () => {
    for (const key of CMS_COLLECTIONS) expect(collectionByKey(key).idKey, key).toBe(CMS_ID_KEYS[key]);
  });

  it('registers no admin collection the CMS does not know', () => {
    for (const c of COLLECTIONS) expect(CMS_COLLECTIONS, c.key).toContain(c.key);
  });

  it('gives every collection its own admin route', () => {
    const routes = COLLECTIONS.map((c) => c.route);
    expect(new Set(routes).size).toBe(routes.length);
  });
});
