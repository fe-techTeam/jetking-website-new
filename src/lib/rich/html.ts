import 'server-only';
import sanitizeHtml from 'sanitize-html';
import * as cheerio from 'cheerio';
import type { BodyBlock } from '@/lib/content/types';

/**
 * Rich article HTML: the editor produces it, the server cleans it on save and again on render, so a
 * pasted script, inline handler or javascript: link can never reach a visitor's browser.
 */

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'strong', 'b', 'em', 'i', 'u', 's', 'a', 'br', 'hr', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'figure', 'figcaption',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height', 'loading'],
    th: ['colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    p: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
  },
  // The only inline style kept is text alignment from the editor's toolbar.
  allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/] } },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tag, attribs) => {
      const href = attribs.href ?? '';
      const external = /^https?:\/\//i.test(href);
      return { tagName: 'a', attribs: { ...attribs, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}) } };
    },
    img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy' } }),
  },
};

export function sanitizeRichHtml(html: string): string {
  // The editor keeps an empty trailing paragraph for the cursor; it is not content.
  return sanitizeHtml(html, OPTIONS).replace(/(<p><\/p>|<p>\s*<br\s*\/?>\s*<\/p>)+$/g, '').trim();
}

export function htmlToText(html: string): string {
  return cheerio.load(`<div>${html}</div>`)('div').text().replace(/\s+/g, ' ').trim();
}

/**
 * The plain structured body derived from rich HTML — what the chatbot index, the article summary and any
 * consumer that predates rich text read. Inline formatting is dropped here (it lives in `bodyHtml`).
 */
export function htmlToBlocks(html: string): BodyBlock[] {
  const $ = cheerio.load(`<div id="r">${html}</div>`);
  const out: BodyBlock[] = [];
  const text = (el: Parameters<typeof $>[0]) => $(el).text().replace(/\s+/g, ' ').trim();

  $('#r')
    .children()
    .each((_, el) => {
      const tag = (el as { tagName?: string }).tagName?.toLowerCase();
      if (!tag) return;
      if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
        const t = text(el);
        if (t) out.push({ type: 'heading', level: tag === 'h2' ? 2 : 3, text: t });
      } else if (tag === 'p') {
        const t = text(el);
        if (t) out.push({ type: 'paragraph', text: t });
      } else if (tag === 'ul' || tag === 'ol') {
        const items = $(el).children('li').map((_i, li) => text(li)).get().filter(Boolean);
        if (items.length) out.push({ type: 'list', ordered: tag === 'ol', items });
      } else if (tag === 'blockquote') {
        const t = text(el);
        if (t) out.push({ type: 'quote', text: t });
      } else if (tag === 'img') {
        const src = $(el).attr('src');
        if (src) out.push({ type: 'image', image: { url: src, alt: $(el).attr('alt') ?? '' } });
      } else if (tag === 'table' || tag === 'pre') {
        const t = text(el);
        if (t) out.push({ type: 'paragraph', text: t });
      }
    });
  return out;
}
