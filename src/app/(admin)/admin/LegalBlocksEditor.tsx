'use client';

import type { LegalBlock } from '@/lib/content/types';

/**
 * Editor for a legal document's `blocks` — headings, paragraphs, numbered/bulleted lists (each item
 * with its own optional marker like "a." or "3."), tables and images. Mirrors `LegalBlock`, the shape
 * `components/legal/LegalDocument.tsx` renders, so what is edited here is exactly what the page shows.
 */

type BlockType = LegalBlock['t'];

const TYPES: Array<{ value: BlockType; label: string }> = [
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'p', label: 'Paragraph' },
  { value: 'ol', label: 'Numbered list' },
  { value: 'ul', label: 'Bulleted list' },
  { value: 'table', label: 'Table' },
  { value: 'img', label: 'Image' },
];

function blank(t: BlockType): LegalBlock {
  switch (t) {
    case 'h2':
    case 'h3':
      return { t, text: '' };
    case 'p':
      return { t: 'p', text: '' };
    case 'ul':
    case 'ol':
      return { t, items: [{ m: null, text: '' }] };
    case 'table':
      return { t: 'table', head: ['', ''], rows: [['', '']] };
    case 'img':
      return { t: 'img', src: '', alt: '', w: 0, h: 0 };
  }
}

/** Changing a block's type keeps its words where the two types can share them. */
function convert(block: LegalBlock, next: BlockType): LegalBlock {
  const textual = (b: LegalBlock) => ('text' in b ? b.text : '');
  if (next === 'h2' || next === 'h3' || next === 'p') {
    return { t: next, text: textual(block) } as LegalBlock;
  }
  if ((next === 'ul' || next === 'ol') && (block.t === 'ul' || block.t === 'ol')) {
    return { t: next, items: block.items };
  }
  if ((next === 'ul' || next === 'ol') && 'text' in block && block.text) {
    return { t: next, items: [{ m: null, text: block.text }] };
  }
  return blank(next);
}

const input = 'admin-input min-w-0';
const ghostButton =
  'min-h-11 cursor-pointer rounded-[10px] px-3 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-30';
const dangerButton =
  'min-h-11 cursor-pointer rounded-[10px] px-3 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[var(--color-error-50)] hover:text-[#b42318] focus-visible:outline-2 focus-visible:outline-[var(--color-error-600)]';
const addButton =
  'min-h-11 cursor-pointer self-start rounded-[var(--admin-radius)] border border-dashed border-border-medium bg-background px-4 text-sm font-bold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)] focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]';

function ListBody({
  block,
  onChange,
}: {
  block: Extract<LegalBlock, { t: 'ul' | 'ol' }>;
  onChange: (next: LegalBlock) => void;
}) {
  const setItems = (items: typeof block.items) => onChange({ ...block, items });
  return (
    <div className="flex flex-col gap-2.5">
      {block.items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            value={item.m ?? ''}
            onChange={(e) => {
              const copy = [...block.items];
              copy[i] = { ...item, m: e.target.value.trim() === '' ? null : e.target.value };
              setItems(copy);
            }}
            placeholder="a."
            aria-label={`Item ${i + 1} marker (optional)`}
            className={`${input} w-16! shrink-0 text-center`}
          />
          <textarea
            value={item.text}
            onChange={(e) => {
              const copy = [...block.items];
              copy[i] = { ...item, text: e.target.value };
              setItems(copy);
            }}
            rows={2}
            aria-label={`Item ${i + 1} text`}
            className={`${input} flex-1 resize-y`}
          />
          <button
            type="button"
            onClick={() => setItems(block.items.filter((_, idx) => idx !== i))}
            aria-label={`Remove item ${i + 1}`}
            className={dangerButton}
          >
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => setItems([...block.items, { m: null, text: '' }])} className={addButton}>
        + Add item
      </button>
    </div>
  );
}

function TableBody({
  block,
  onChange,
}: {
  block: Extract<LegalBlock, { t: 'table' }>;
  onChange: (next: LegalBlock) => void;
}) {
  const set = (patch: Partial<typeof block>) => onChange({ ...block, ...patch });
  const columns = block.head.length;

  return (
    <div className="flex flex-col gap-3">
      <input
        value={block.caption ?? ''}
        onChange={(e) => set({ caption: e.target.value })}
        placeholder="Caption (optional)"
        aria-label="Table caption"
        className={input}
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-separate border-spacing-1.5">
          <thead>
            <tr>
              {block.head.map((cell, c) => (
                <th key={c} className="font-normal">
                  <div className="flex items-center gap-1">
                    <input
                      value={cell}
                      onChange={(e) => {
                        const head = [...block.head];
                        head[c] = e.target.value;
                        set({ head });
                      }}
                      aria-label={`Column ${c + 1} heading`}
                      placeholder={`Heading ${c + 1}`}
                      className={`${input} font-bold`}
                    />
                    <button
                      type="button"
                      disabled={columns <= 1}
                      onClick={() =>
                        set({
                          head: block.head.filter((_, i) => i !== c),
                          rows: block.rows.map((row) => row.filter((_, i) => i !== c)),
                        })
                      }
                      aria-label={`Remove column ${c + 1}`}
                      className={`${dangerButton} px-2`}
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>
                    <textarea
                      value={cell}
                      onChange={(e) => {
                        const rows = block.rows.map((x) => [...x]);
                        rows[r]![c] = e.target.value;
                        set({ rows });
                      }}
                      rows={2}
                      aria-label={`Row ${r + 1}, column ${c + 1}`}
                      className={`${input} w-full resize-y`}
                    />
                  </td>
                ))}
                <td>
                  <button
                    type="button"
                    onClick={() => set({ rows: block.rows.filter((_, i) => i !== r) })}
                    aria-label={`Remove row ${r + 1}`}
                    className={dangerButton}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => set({ rows: [...block.rows, Array.from({ length: columns }, () => '')] })}
          className={addButton}
        >
          + Add row
        </button>
        <button
          type="button"
          onClick={() => set({ head: [...block.head, ''], rows: block.rows.map((row) => [...row, '']) })}
          className={addButton}
        >
          + Add column
        </button>
      </div>
    </div>
  );
}

function BlockBody({ block, onChange }: { block: LegalBlock; onChange: (next: LegalBlock) => void }) {
  switch (block.t) {
    case 'h2':
    case 'h3':
      return (
        <input
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Heading text"
          aria-label="Heading text"
          className={`${input} w-full`}
        />
      );
    case 'p':
      return (
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          rows={4}
          placeholder="Paragraph text"
          aria-label="Paragraph text"
          className={`${input} w-full resize-y`}
        />
      );
    case 'ul':
    case 'ol':
      return <ListBody block={block} onChange={onChange} />;
    case 'table':
      return <TableBody block={block} onChange={onChange} />;
    case 'img':
      return (
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input
            value={block.src}
            onChange={(e) => onChange({ ...block, src: e.target.value })}
            placeholder="Image path, e.g. /legal/fees.png"
            aria-label="Image path"
            className={input}
          />
          <input
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
            placeholder="Alt text"
            aria-label="Alt text"
            className={input}
          />
          <input
            type="number"
            value={block.w}
            onChange={(e) => onChange({ ...block, w: Number(e.target.value) || 0 })}
            placeholder="Width (px)"
            aria-label="Image width in pixels"
            className={input}
          />
          <input
            type="number"
            value={block.h}
            onChange={(e) => onChange({ ...block, h: Number(e.target.value) || 0 })}
            placeholder="Height (px)"
            aria-label="Image height in pixels"
            className={input}
          />
        </div>
      );
  }
}

export function LegalBlocksEditor({
  value,
  onChange,
}: {
  value: LegalBlock[];
  onChange: (next: LegalBlock[]) => void;
}) {
  function update(index: number, next: LegalBlock) {
    const copy = [...value];
    copy[index] = next;
    onChange(copy);
  }
  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const copy = [...value];
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
    onChange(copy);
  }
  function insertAfter(index: number, t: BlockType) {
    const copy = [...value];
    copy.splice(index + 1, 0, blank(t));
    onChange(copy);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground-muted">
        {value.length} block{value.length === 1 ? '' : 's'}. Edits appear on the page in this order.
      </p>

      {value.map((block, i) => (
        <div key={i} className="rounded-[var(--admin-radius)] border border-border p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="numeral w-8 shrink-0 text-xs font-bold text-foreground-muted">{i + 1}</span>
            <select
              value={block.t}
              onChange={(e) => update(i, convert(block, e.target.value as BlockType))}
              aria-label={`Block ${i + 1} type`}
              className="admin-input w-auto! min-w-40 py-0 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="ml-auto flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move block ${i + 1} up`}
                className={`${ghostButton} grid w-11 place-items-center px-0 text-base`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label={`Move block ${i + 1} down`}
                className={`${ghostButton} grid w-11 place-items-center px-0 text-base`}
              >
                ↓
              </button>
              <button type="button" onClick={() => insertAfter(i, 'p')} className={ghostButton}>
                + Below
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                aria-label={`Remove block ${i + 1}`}
                className={dangerButton}
              >
                Remove
              </button>
            </div>
          </div>
          <BlockBody block={block} onChange={(next) => update(i, next)} />
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button key={t.value} type="button" onClick={() => onChange([...value, blank(t.value)])} className={addButton}>
            + {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
