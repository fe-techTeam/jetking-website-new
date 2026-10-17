import type { BodyBlock } from '@/lib/content/types';

/**
 * Pure (browser-safe) helpers shared by the rich-text editor and the server: turning the structured
 * article body into editable HTML. The reverse (HTML -> blocks) needs an HTML parser and lives in `html.ts`.
 */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function blocksToHtml(blocks: BodyBlock[] | undefined): string {
  return (blocks ?? [])
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `<h${b.level}>${esc(b.text)}</h${b.level}>`;
        case 'paragraph':
          return `<p>${esc(b.text)}</p>`;
        case 'list': {
          const tag = b.ordered ? 'ol' : 'ul';
          return `<${tag}>${b.items.map((i) => `<li><p>${esc(i)}</p></li>`).join('')}</${tag}>`;
        }
        case 'quote':
          return `<blockquote><p>${esc(b.text)}</p></blockquote>${b.attribution ? `<p>— ${esc(b.attribution)}</p>` : ''}`;
        case 'image':
          return `<img src="${esc(b.image.url)}" alt="${esc(b.image.alt)}">`;
      }
    })
    .join('');
}
