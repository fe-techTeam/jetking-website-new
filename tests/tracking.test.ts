import { describe, expect, it } from 'vitest';
import { resolveTracking } from '@/lib/tracking';

const prod = { production: true };

describe('resolveTracking', () => {
  it('uses the tags jetking.com already runs, once each, in production', () => {
    const t = resolveTracking(prod);
    expect(t.enabled).toBe(true);
    expect(t.gtmId).toBe('GTM-NS3S5GL');
    expect(t.googleTagIds).toEqual(['G-0X1JFRD2CY', 'G-W63BK7Z7N8', 'AW-16690495274']);
    expect(t.metaPixelIds).toEqual(['712749829308803', '982141604187576']);
  });

  it('never includes the shut-down Universal Analytics property', () => {
    expect(JSON.stringify(resolveTracking(prod))).not.toContain('UA-');
  });

  it('is off outside production, on staging/preview, and with the master switch', () => {
    for (const env of [{ production: false }, { ...prod, allowIndexing: 'false' }, { ...prod, enabled: 'false' }]) {
      expect(resolveTracking(env)).toEqual({ enabled: false, gtmId: null, googleTagIds: [], metaPixelIds: [] });
    }
  });

  it('lets the environment replace a tag, or switch one off with an empty value', () => {
    const t = resolveTracking({ ...prod, gtmId: 'GTM-ABCD123', googleTagIds: 'G-AAAAAAAAAA', metaPixelIds: '' });
    expect(t.gtmId).toBe('GTM-ABCD123');
    expect(t.googleTagIds).toEqual(['G-AAAAAAAAAA']);
    expect(t.metaPixelIds).toEqual([]);
    expect(resolveTracking({ ...prod, gtmId: '' }).gtmId).toBeNull();
  });

  it('drops duplicates and anything that is not a well-formed id, so nothing can be injected into the inline snippets', () => {
    const t = resolveTracking({
      ...prod,
      gtmId: "GTM-X');alert(1);//",
      googleTagIds: "G-AAAAAAAAAA, G-AAAAAAAAAA, G-BBBBBBBBBB');alert(1);//, UA-12345-1, <script>",
      metaPixelIds: '123456789012, 12ab, 1;alert(1)',
    });
    expect(t.gtmId).toBeNull();
    expect(t.googleTagIds).toEqual(['G-AAAAAAAAAA']);
    expect(t.metaPixelIds).toEqual(['123456789012']);
  });
});
