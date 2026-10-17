import { describe, expect, it } from 'vitest';
import { htmlToBlocks, htmlToText, sanitizeRichHtml } from '@/lib/rich/html';
import { blocksToHtml } from '@/lib/rich/blocks';

describe('rich article HTML', () => {
  it('removes scripts, inline handlers and javascript: links', () => {
    const out = sanitizeRichHtml(
      '<p onclick="x()">Hi <a href="javascript:alert(1)">bad</a> <a href="https://e.com">ok</a></p><script>alert(1)</script><img src="x" onerror="alert(1)"><iframe src="https://e.com"></iframe>',
    );
    expect(out).not.toMatch(/script|onclick|onerror|javascript:|iframe/i);
    expect(out).toContain('href="https://e.com"');
    expect(out).toContain('rel="noopener noreferrer"');
  });

  it('keeps formatting, lists, tables and text alignment', () => {
    const out = sanitizeRichHtml('<h2>T</h2><p style="text-align: center; color: red"><strong>b</strong></p><ul><li>a</li></ul><table><tr><td>c</td></tr></table>');
    expect(out).toContain('<h2>T</h2>');
    expect(out).toContain('text-align:center');
    expect(out).not.toContain('color');
    expect(out).toContain('<table>');
  });

  it('drops the editor’s empty trailing paragraph', () => {
    expect(sanitizeRichHtml('<p>Body</p><p></p>')).toBe('<p>Body</p>');
  });

  it('derives the plain structured body from rich HTML', () => {
    const blocks = htmlToBlocks('<h2>Head</h2><p>Some <strong>bold</strong> text</p><ol><li><p>one</p></li><li>two</li></ol><blockquote><p>q</p></blockquote><img src="/a.png" alt="A">');
    expect(blocks).toEqual([
      { type: 'heading', level: 2, text: 'Head' },
      { type: 'paragraph', text: 'Some bold text' },
      { type: 'list', ordered: true, items: ['one', 'two'] },
      { type: 'quote', text: 'q' },
      { type: 'image', image: { url: '/a.png', alt: 'A' } },
    ]);
    expect(htmlToText('<p>a</p><p>b  c</p>')).toBe('ab c');
  });

  it('round-trips the structured body through the editor HTML', () => {
    const blocks = [
      { type: 'heading' as const, level: 3 as const, text: 'A & B' },
      { type: 'paragraph' as const, text: '<not html>' },
      { type: 'list' as const, ordered: false, items: ['x', 'y'] },
    ];
    expect(htmlToBlocks(blocksToHtml(blocks))).toEqual(blocks);
  });
});
