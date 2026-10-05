'use client';

import { TagListEditor } from './TagListEditor';

export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'image'; image: { url: string; alt: string; width?: number; height?: number } };

const BLOCK_TYPES: Block['type'][] = ['paragraph', 'heading', 'list', 'quote', 'image'];

function blankBlock(type: Block['type']): Block {
  switch (type) {
    case 'paragraph':
      return { type, text: '' };
    case 'heading':
      return { type, level: 2, text: '' };
    case 'list':
      return { type, ordered: false, items: [] };
    case 'quote':
      return { type, text: '', attribution: '' };
    case 'image':
      return { type, image: { url: '', alt: '' } };
  }
}

/** Editor for `body`: an ordered array of rich-text blocks (paragraph, heading,
 *  list, quote, image) — the one field shape common to posts, policies, and
 *  placements that's too structured for a generic object/array form to handle
 *  well, so it gets its own purpose-built editor instead. */
export function BlocksEditor({ value, onChange }: { value: Block[]; onChange: (next: Block[]) => void }) {
  function update(i: number, block: Block) {
    const next = [...value];
    next[i] = block;
    onChange(next);
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    const a = next[i];
    const b = next[j];
    if (!a || !b) return;
    next[i] = b;
    next[j] = a;
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {value.map((block, i) => (
        <div key={i} className="rounded-[var(--admin-radius)] border border-border p-4">
          <div className="mb-2.5 flex items-center gap-2">
            <select
              value={block.type}
              onChange={(e) => update(i, blankBlock(e.target.value as Block['type']))}
              className="admin-input w-auto! min-w-32 shrink-0 py-0 text-sm capitalize"
            >
              {BLOCK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-[10px] text-base text-foreground-muted transition-colors hover:bg-surface hover:text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="Move down"
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-[10px] text-base text-foreground-muted transition-colors hover:bg-surface hover:text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="min-h-11 cursor-pointer rounded-[10px] px-3 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[var(--color-error-50)] hover:text-[#b42318]"
              >
                Remove
              </button>
            </div>
          </div>

          {block.type === 'paragraph' ? (
            <textarea
              value={block.text}
              onChange={(e) => update(i, { ...block, text: e.target.value })}
              rows={3}
              className="admin-input resize-y"
              placeholder="Paragraph text"
            />
          ) : block.type === 'heading' ? (
            <div className="flex gap-2">
              <select
                value={block.level}
                onChange={(e) => update(i, { ...block, level: Number(e.target.value) as 2 | 3 })}
                className="admin-input w-24! shrink-0"
              >
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              <input
                value={block.text}
                onChange={(e) => update(i, { ...block, text: e.target.value })}
                placeholder="Heading text"
                className="admin-input min-w-0 flex-1"
              />
            </div>
          ) : block.type === 'list' ? (
            <div className="flex flex-col gap-2.5">
              <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-foreground-secondary">
                <input
                  type="checkbox"
                  checked={block.ordered}
                  onChange={(e) => update(i, { ...block, ordered: e.target.checked })}
                  className="h-5 w-5 cursor-pointer rounded border-border-medium accent-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
                />
                Ordered (numbered) list
              </label>
              <TagListEditor
                value={block.items}
                onChange={(items) => update(i, { ...block, items })}
                placeholder="Add list item…"
              />
            </div>
          ) : block.type === 'quote' ? (
            <div className="flex flex-col gap-2.5">
              <textarea
                value={block.text}
                onChange={(e) => update(i, { ...block, text: e.target.value })}
                rows={2}
                className="admin-input resize-y"
                placeholder="Quote text"
              />
              <input
                value={block.attribution ?? ''}
                onChange={(e) => update(i, { ...block, attribution: e.target.value })}
                placeholder="Attribution (optional)"
                className="admin-input"
              />
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <input
                value={block.image.url}
                onChange={(e) => update(i, { ...block, image: { ...block.image, url: e.target.value } })}
                placeholder="Image URL"
                className="admin-input"
              />
              <input
                value={block.image.alt}
                onChange={(e) => update(i, { ...block, image: { ...block.image, alt: e.target.value } })}
                placeholder="Alt text"
                className="admin-input"
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {BLOCK_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange([...value, blankBlock(t)])}
            className="min-h-11 cursor-pointer rounded-[var(--admin-radius)] border border-dashed border-border-medium bg-background px-4 text-sm font-bold capitalize text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
          >
            + {t}
          </button>
        ))}
      </div>
    </div>
  );
}
