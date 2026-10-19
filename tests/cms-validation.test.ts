import { describe, expect, it } from 'vitest';
import { validateCmsRecord } from '@/lib/cms/schemas';
import { fill, mergeCopy } from '@/lib/content/copy/define';
import { COPY_PAGES } from '@/lib/content/copy/registry';

describe('record validation', () => {
  it('rejects a record missing required fields with a readable path', () => {
    const r = validateCmsRecord('faqs', { id: 'x' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/question|answer|topic/);
  });
  it('rejects an unknown topic', () => {
    expect(validateCmsRecord('faqs', { id: 'x', question: 'q', answer: 'a', topic: 'nope', personaRelevance: {} }).ok).toBe(false);
  });
});

describe('page copy', () => {
  it('uses the shipped text unless a non-empty override exists', () => {
    expect(mergeCopy({ a: 'x', b: 'y' }, { a: 'new', b: '  ' })).toEqual({ a: 'new', b: 'y' });
  });
  it('ignores overrides for keys the page no longer declares', () => {
    expect(mergeCopy({ a: 'x' }, { gone: 'z' })).toEqual({ a: 'x' });
  });
  it('fills {placeholders} and leaves unknown ones visible', () => {
    expect(fill('{n} centres in {x}', { n: 40 })).toBe('40 centres in {x}');
  });
  it('gives every page a unique id and an SEO title (legal takes it from the document)', () => {
    const ids = COPY_PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of COPY_PAGES.filter((p) => p.path && p.id !== 'legal')) expect(p.defaults['seo.title'], p.id).toBeTruthy();
  });
});
