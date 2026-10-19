import { describe, expect, it } from 'vitest';
import { CMS_COLLECTIONS, CMS_ID_PATTERN, findUnsafeContent, validateCmsRecord } from '@/lib/cms/schemas';
import { CMS_ID_KEYS } from '@/lib/cms/id-keys';
import { courses } from '@/lib/content/fixtures/courses';
import { centres, cities } from '@/lib/content/fixtures/locations';
import { posts } from '@/lib/content/fixtures/posts';
import { faqs } from '@/lib/content/fixtures/faqs';
import { trustSignals } from '@/lib/content/fixtures/trust';
import { faculty, homepageVariants, personaRules, placements, policies } from '@/lib/content/fixtures/kb';
import { chatbotSettingsDefaults } from '@/lib/content/fixtures/chatbot';
import { seoSettingsDefaults } from '@/lib/content/fixtures/seo-settings';
import { aboutDefaults } from '@/lib/content/fixtures/about';
import { legalDefaults } from '@/lib/content/fixtures/legal';
import { logoListDefaults } from '@/lib/content/fixtures/logo-lists';
import { placementsDefaults } from '@/lib/content/fixtures/placements-page';
import { investorsDefaults } from '@/lib/content/fixtures/investors-page';
import { collectionByKey } from '@/app/(admin)/admin/registry';

const seeds: Record<string, unknown[]> = {
  courses,
  cities,
  centres,
  posts,
  faqs,
  trust_signals: trustSignals,
  policies,
  faculty,
  placements,
  homepage_variants: homepageVariants,
  persona_rules: personaRules,
  about_page: [aboutDefaults],
  placements_page: [placementsDefaults],
  investors_page: [investorsDefaults],
  legal_documents: legalDefaults,
  logo_lists: logoListDefaults,
  seo_settings: [seoSettingsDefaults],
  chatbot_settings: [chatbotSettingsDefaults],
};

describe('schemas accept every shipped fixture (schema vs content/types drift)', () => {
  for (const [collection, rows] of Object.entries(seeds)) {
    it(`${collection}: ${rows.length} fixture record(s) validate, are not flagged unsafe, and use safe ids`, () => {
      const idKey = CMS_ID_KEYS[collection as keyof typeof CMS_ID_KEYS];
      for (const row of rows) {
        const record = { ...(row as object), status: 'published' };
        const result = validateCmsRecord(collection as never, record);
        const id = String((row as Record<string, unknown>)[idKey]);
        expect(result.ok, `${collection}/${id}: ${result.ok ? '' : result.error}`).toBe(true);
        expect(findUnsafeContent(record), `${collection}/${id}`).toBeNull();
        expect(CMS_ID_PATTERN.test(id), id).toBe(true);
      }
    });
  }
});

describe('id keys', () => {
  it('registry and CMS_ID_KEYS agree for every collection', () => {
    for (const key of CMS_COLLECTIONS) expect(collectionByKey(key).idKey, key).toBe(CMS_ID_KEYS[key]);
  });
  it('covers every collection', () => {
    expect(Object.keys(CMS_ID_KEYS).sort()).toEqual([...CMS_COLLECTIONS].sort());
  });
  it('id pattern rejects traversal, slashes, spaces, markup and over-long ids', () => {
    for (const bad of ['', '../x', 'a/b', 'a b', '<script>', '-lead', 'a'.repeat(201), '.hidden']) {
      expect(CMS_ID_PATTERN.test(bad), bad).toBe(false);
    }
    for (const good of ['mca-2025', 'faq_1', 'v1.2', 'ABC']) expect(CMS_ID_PATTERN.test(good), good).toBe(true);
  });
});

describe('per-collection rejection', () => {
  const faq = { id: 'f1', question: 'q', answer: 'a', topic: 'fees', personaRelevance: {} };
  it('faqs: bad topic, missing field and bad status', () => {
    expect(validateCmsRecord('faqs', faq).ok).toBe(true);
    expect(validateCmsRecord('faqs', { ...faq, topic: 'x' }).ok).toBe(false);
    expect(validateCmsRecord('faqs', { ...faq, question: '' }).ok).toBe(false);
    expect(validateCmsRecord('faqs', { ...faq, status: 'archived' }).ok).toBe(false);
  });
  it('singletons are pinned to their literal id', () => {
    expect(validateCmsRecord('seo_settings', { ...seoSettingsDefaults, id: 'other' }).ok).toBe(false);
    expect(validateCmsRecord('about_page', { ...aboutDefaults, id: 'x' }).ok).toBe(false);
    expect(validateCmsRecord('chatbot_settings', { ...chatbotSettingsDefaults, id: 'x' }).ok).toBe(false);
  });
  it('announcements: tone enum and required message', () => {
    const a = { id: 'a', message: 'm', linkLabel: '', linkHref: '', tone: 'info', startsAt: '', endsAt: '', dismissible: true };
    expect(validateCmsRecord('announcements', a).ok).toBe(true);
    expect(validateCmsRecord('announcements', { ...a, tone: 'loud' }).ok).toBe(false);
    expect(validateCmsRecord('announcements', { ...a, message: '' }).ok).toBe(false);
  });
  it('persona_rules: unknown condition field/op rejected', () => {
    const rule = { id: 'r', label: 'l', priority: 1, matchAll: true, homepageVariantId: 'v', enabled: true, conditions: [{ field: 'interest', op: 'eq', value: 'x' }] };
    expect(validateCmsRecord('persona_rules', rule).ok).toBe(true);
    expect(validateCmsRecord('persona_rules', { ...rule, conditions: [{ field: 'cookie', op: 'eq', value: 'x' }] }).ok).toBe(false);
    expect(validateCmsRecord('persona_rules', { ...rule, conditions: [{ field: 'device', op: 'regex', value: 'x' }] }).ok).toBe(false);
  });
  it('page_copy entries must be string -> string', () => {
    expect(validateCmsRecord('page_copy', { id: 'home', entries: { 'hero.title': 'x' } }).ok).toBe(true);
    expect(validateCmsRecord('page_copy', { id: 'home', entries: { 'hero.title': 5 } }).ok).toBe(false);
  });
  it('posts: body blocks are a discriminated union', () => {
    const post = { ...posts[0], status: 'published' };
    expect(validateCmsRecord('posts', post).ok).toBe(true);
    expect(validateCmsRecord('posts', { ...post, body: [{ type: 'script', text: 'x' }] }).ok).toBe(false);
  });
  it('a non-object is rejected, not thrown', () => {
    for (const bad of [null, 'x', 5, []]) expect(validateCmsRecord('faqs', bad).ok).toBe(false);
  });
});

describe('findUnsafeContent', () => {
  it('flags javascript:/vbscript:/html data URLs in link-like fields, including nested and arrays', () => {
    expect(findUnsafeContent({ linkHref: 'javascript:alert(1)' })).toMatch(/linkHref/);
    expect(findUnsafeContent({ cta: { href: '  JaVaScRiPt:alert(1)' } })).toMatch(/cta\.href/);
    expect(findUnsafeContent({ organization: { sameAs: ['https://a.com'], logoUrl: 'vbscript:x' } })).toBeTruthy();
    expect(findUnsafeContent({ sameAs: ['javascript:1'] })).toBeTruthy();
    expect(findUnsafeContent({ entries: { 'hero.cta.href': 'javascript:1' } })).toBeTruthy();
    expect(findUnsafeContent({ imageUrl: 'data:text/html;base64,AAAA' })).toBeTruthy();
    expect(findUnsafeContent({ image: { url: 'data:image/svg+xml,<svg onload=1>' } })).toBeTruthy();
  });
  it('flags markdown links with a script scheme anywhere', () => {
    expect(findUnsafeContent({ text: 'see [here](javascript:alert(1))' })).toBeTruthy();
    expect(findUnsafeContent({ text: 'see [here]( vbscript:x)' })).toBeTruthy();
  });
  it('flags prototype-pollution keys', () => {
    expect(findUnsafeContent(JSON.parse('{"a":{"__proto__":{"admin":true}}}'))).toMatch(/__proto__/);
    expect(findUnsafeContent(JSON.parse('{"constructor":1}'))).toBeTruthy();
  });
  it('lets ordinary content through', () => {
    expect(findUnsafeContent({ title: 'JavaScript: the basics', href: '/courses', url: 'https://x.com/a?b=c', ogImage: '/media/a.png', body: 'data: 5 rows' })).toBeNull();
    expect(findUnsafeContent({ linkHref: 'mailto:a@b.com', logo: 'data:image/png;base64,AAAA' })).toBeNull();
  });
  it('bounds recursion depth', () => {
    let deep: Record<string, unknown> = {};
    const root = deep;
    for (let i = 0; i < 40; i++) {
      deep.n = {};
      deep = deep.n as Record<string, unknown>;
    }
    expect(findUnsafeContent(root)).toMatch(/too deeply/);
  });
});
