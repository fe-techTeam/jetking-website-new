import { describe, expect, it } from 'vitest';
import { htmlToBlocks, htmlToText, sanitizeRichHtml } from '@/lib/rich/html';
import { sanitizePublicRows } from '@/lib/cms/store';
import { isRichHtml, plainText } from '@/lib/rich/text';

const ABUSE = [
  '<p>hi</p><script>alert(1)</script>',
  '<p onclick="alert(1)">x</p>',
  '<a href="javascript:alert(1)">x</a>',
  '<a href="JaVa&#x09;Script:alert(1)">x</a>',
  '<a href="&#106;avascript:alert(1)">x</a>',
  '<a href=" javascript:alert(1)">x</a>',
  '<a href="data:text/html;base64,PHNjcmlwdD4=">x</a>',
  '<a href="vbscript:msgbox(1)">x</a>',
  '<img src=x onerror=alert(1)>',
  '<img src="javascript:alert(1)">',
  '<img src="data:image/svg+xml,<svg onload=alert(1)>">',
  '<svg><script>alert(1)</script></svg>',
  '<svg onload=alert(1)>',
  '<iframe src="https://evil.example"></iframe>',
  '<object data="x"></object><embed src="x">',
  '<form action="https://evil"><input name=a></form>',
  '<style>@import "x"</style>',
  '<p style="background:url(javascript:alert(1))">x</p>',
  '<p style="position:fixed;top:0;left:0;width:100%">x</p>',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  '<base href="https://evil/">',
  '<meta http-equiv="refresh" content="0;url=https://evil">',
  '<a href="//evil.example/x">x</a>',
];

describe('sanitizeRichHtml abuse strings', () => {
  for (const input of ABUSE) {
    it(`neutralises ${input.slice(0, 50)}`, () => {
      const out = sanitizeRichHtml(input);
      expect(out).not.toMatch(/<script|<iframe|<object|<embed|<form|<style|<svg|<math|<base|<meta|<input/i);
      expect(out).not.toMatch(/\son\w+\s*=/i);
      expect(out).not.toMatch(/javascript:|vbscript:|data:/i);
      expect(out).not.toMatch(/href="\/\//);
      expect(out).not.toMatch(/position|url\(/i);
    });
  }

  it('keeps normal formatting and text-align only', () => {
    const out = sanitizeRichHtml('<h2 style="text-align:center">T</h2><p><strong>b</strong> <em>i</em></p><ul><li>x</li></ul>');
    expect(out).toContain('<h2 style="text-align:center">T</h2>');
    expect(out).toContain('<strong>b</strong>');
    expect(out).toContain('<li>x</li>');
  });
  it('forces external links to open safely, leaves mailto/tel/relative alone', () => {
    const out = sanitizeRichHtml('<a href="https://a.com">a</a><a href="mailto:a@b.com">m</a><a href="/courses">c</a>');
    expect(out).toContain('href="https://a.com" target="_blank" rel="noopener noreferrer"');
    expect(out).toContain('href="mailto:a@b.com"');
    expect(out).toContain('href="/courses"');
  });
  it('overrides an attacker-supplied rel on external links', () => {
    const out = sanitizeRichHtml('<a href="https://a.com" target="_blank" rel="opener">a</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).not.toContain('rel="opener"');
  });
  it('only allows http(s) images and lazy-loads them', () => {
    expect(sanitizeRichHtml('<img src="https://a.com/x.png" alt="x">')).toContain('loading="lazy"');
    expect(sanitizeRichHtml('<img src="mailto:a@b.com">')).not.toContain('src=');
  });
  it('is idempotent (sanitising twice changes nothing)', () => {
    for (const input of ABUSE) {
      const once = sanitizeRichHtml(input);
      expect(sanitizeRichHtml(once)).toBe(once);
    }
  });
  it('strips the editor\'s empty trailing paragraph', () => {
    expect(sanitizeRichHtml('<p>x</p><p></p>')).toBe('<p>x</p>');
  });
});

describe('derived text and blocks never carry markup', () => {
  it('htmlToText / htmlToBlocks return plain text only', () => {
    expect(htmlToText('<p>a <b>b</b></p><script>x()</script>')).not.toContain('<');
    const blocks = htmlToBlocks('<h2>H</h2><p>P <b>q</b></p><ul><li>1</li></ul><img src="https://a.com/x.png" alt="t">');
    expect(blocks).toEqual([
      { type: 'heading', level: 2, text: 'H' },
      { type: 'paragraph', text: 'P q' },
      { type: 'list', ordered: false, items: ['1'] },
      { type: 'image', image: { url: 'https://a.com/x.png', alt: 't' } },
    ]);
  });
});

describe('rich-text detection (decides whether a field is rendered as HTML)', () => {
  it('a value that does not start with a block/inline tag is plain text and is NOT rendered as HTML', () => {
    expect(isRichHtml('<img src=x onerror=alert(1)>')).toBe(false);
    expect(isRichHtml('<script>alert(1)</script>')).toBe(false);
    expect(isRichHtml('<p>ok</p>')).toBe(true);
    expect(plainText('<p>a &amp; b</p>')).toBe('a & b');
  });
});

describe('sanitizePublicRows (render-side defence for FAQ HTML)', () => {
  const dirty = '<p>ok</p><script>alert(1)</script><a href="javascript:x">l</a>';
  it('cleans rich faq answers, leaves plain ones untouched', () => {
    const rows = sanitizePublicRows('faqs', [
      { id: '1', answer: dirty },
      { id: '2', answer: 'plain <b>text</b>' },
    ]);
    expect(rows[0]!.answer).not.toMatch(/script|javascript:/);
    expect(rows[0]!.answer).toContain('<p>ok</p>');
    expect(rows[1]!.answer).toBe('plain <b>text</b>');
  });
  it('cleans nested course/centre faqs', () => {
    for (const collection of ['courses', 'centres'] as const) {
      const [row] = sanitizePublicRows(collection, [{ slug: 's', faqs: [{ question: 'q', answer: dirty }] }]);
      expect(row!.faqs[0]!.answer).not.toMatch(/script|javascript:/);
    }
  });
  it('leaves other collections and rows without faqs alone (same reference)', () => {
    const rows = [{ id: 'x', answer: dirty }];
    expect(sanitizePublicRows('chatbot_knowledge', rows)).toBe(rows);
    const noFaqs = { slug: 's' };
    expect(sanitizePublicRows('courses', [noFaqs])[0]).toBe(noFaqs);
  });
});
