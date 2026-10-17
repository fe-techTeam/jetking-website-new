/**
 * Browser-safe helpers for fields that may hold either plain text (what every record started as) or the
 * rich-text editor's HTML. A field is "rich" only when it starts with a block/inline tag, so existing plain
 * values keep rendering exactly as before.
 */

const RICH_START = /^\s*<(p|ul|ol|h[2-4]|blockquote|strong|em|u|s|a|br|table|hr)\b/i;

export const isRichHtml = (value: string | undefined | null): boolean => Boolean(value && RICH_START.test(value));

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/** What a plain-text consumer (search snippets, structured data, the chatbot, llms.txt) should read from a field. */
export function plainText(value: string): string {
  if (!isRichHtml(value)) return value;
  return value
    .replace(/<\/(p|li|h[2-4]|blockquote|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Starting point for the editor when a field still holds plain text: blank-line separated paragraphs. */
export function plainToHtml(value: string): string {
  if (!value.trim() || isRichHtml(value)) return value;
  return value
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** Removes the editor's tags from text that merely CONTAINS rich fields (a passage built from several fields). */
export function stripRichTags(text: string): string {
  if (!/<\/?(p|ul|ol|li|h[2-4]|strong|em|u|s|a|br|table|tr|td|th|blockquote|hr)\b/i.test(text)) return text;
  return text
    .replace(/<\/(p|li|h[2-4]|blockquote|tr)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?(p|ul|ol|li|h[2-4]|strong|em|u|s|a|br|table|thead|tbody|tr|td|th|blockquote|hr)\b[^>]*>/gi, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
}
