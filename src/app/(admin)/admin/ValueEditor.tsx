'use client';

import type { AdminFormConfig } from '@/lib/cms/admin-form-config';
import { BlocksEditor, type Block } from './BlocksEditor';
import { TagListEditor } from './TagListEditor';

export function humanize(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Fields long enough to deserve a textarea rather than a single-line input,
 *  keyed by name since the value's own current length isn't a reliable signal
 *  for a field that's merely empty right now. */
const LONG_TEXT_FIELDS =
  /summary|answer|bio|intro|note(s)?|description|excerpt|address|eligibility|lede|headline|question/i;

function ObjectListEditor({
  value,
  itemTemplate,
  onChange,
  config,
  depth,
  fieldKey,
}: {
  value: Record<string, unknown>[];
  itemTemplate: Record<string, unknown>;
  onChange: (next: Record<string, unknown>[]) => void;
  config: AdminFormConfig;
  depth: number;
  fieldKey: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {value.map((item, i) => (
        <div key={i} className="rounded-[var(--admin-radius)] border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-mono">
              {humanize(fieldKey).replace(/s$/, '')} {i + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="cursor-pointer text-xs font-semibold text-foreground-muted hover:text-[var(--color-error-600)]"
            >
              Remove
            </button>
          </div>
          <ObjectFields
            value={item}
            config={config}
            depth={depth + 1}
            onChange={(next) => {
              const copy = [...value];
              copy[i] = next;
              onChange(copy);
            }}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, itemTemplate])}
        className="cursor-pointer self-start rounded-[var(--admin-radius)] border border-dashed border-border-medium px-3.5 py-1.5 text-xs font-semibold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
      >
        + Add {humanize(fieldKey).replace(/s$/, '')}
      </button>
    </div>
  );
}

/** Renders every key of a plain object as a labeled field, two-up for short
 *  scalars and full width for anything nested — the building block both the
 *  top-level record form and each repeatable list item share. */
function ObjectFields({
  value,
  config,
  depth,
  onChange,
}: {
  value: Record<string, unknown>;
  config: AdminFormConfig;
  depth: number;
  onChange: (next: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
      {Object.keys(value).map((key) => {
        const fieldValue = value[key];
        const isWide =
          Array.isArray(fieldValue) || (typeof fieldValue === 'object' && fieldValue !== null);
        return (
          <div key={key} className={isWide ? 'sm:col-span-2' : ''}>
            <label className="mb-1.5 block text-xs font-medium text-foreground-muted">
              {config.selectFields?.[key]?.label ?? humanize(key)}
            </label>
            <ValueEditor
              value={fieldValue}
              fieldKey={key}
              config={config}
              depth={depth}
              onChange={(next) => onChange({ ...value, [key]: next })}
            />
          </div>
        );
      })}
    </div>
  );
}

export function ValueEditor({
  value,
  fieldKey,
  onChange,
  config,
  depth = 0,
}: {
  value: unknown;
  fieldKey: string;
  onChange: (next: unknown) => void;
  config: AdminFormConfig;
  depth?: number;
}) {
  const select = config.selectFields?.[fieldKey];
  if (select) {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input"
      >
        {select.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (value === null || value === undefined) {
    return (
      <input
        value=""
        placeholder="—"
        onChange={(e) => onChange(e.target.value)}
        className="admin-input"
      />
    );
  }

  if (typeof value === 'string') {
    if (LONG_TEXT_FIELDS.test(fieldKey) || value.length > 80) {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="admin-input resize-y"
        />
      );
    }
    return <input value={value} onChange={(e) => onChange(e.target.value)} className="admin-input" />;
  }

  if (typeof value === 'number') {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="admin-input"
      />
    );
  }

  if (typeof value === 'boolean') {
    return (
      <label className="flex h-[calc(2*0.5rem+1.25rem)] cursor-pointer items-center gap-2 text-sm text-foreground-secondary">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-border-medium accent-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
        />
        {value ? 'Yes' : 'No'}
      </label>
    );
  }

  if (Array.isArray(value)) {
    if (fieldKey === 'body') {
      return <BlocksEditor value={value as Block[]} onChange={onChange as (next: Block[]) => void} />;
    }
    const itemTemplate = config.itemTemplates?.[fieldKey];
    if (itemTemplate) {
      return (
        <ObjectListEditor
          value={value as Record<string, unknown>[]}
          itemTemplate={itemTemplate}
          onChange={onChange as (next: Record<string, unknown>[]) => void}
          config={config}
          depth={depth}
          fieldKey={fieldKey}
        />
      );
    }
    return <TagListEditor value={value as string[]} onChange={onChange as (next: string[]) => void} />;
  }

  if (typeof value === 'object') {
    // No wrapping box: the label already rendered by the parent `ObjectFields`
    // is enough framing — a filled, bordered box around every nested object
    // (fees, SEO, persona relevance…) is exactly the "box inside a box inside
    // a box" clutter the TailAdmin reference avoids. Its own form pages read
    // as one flat card with spaced-out fields, not nested panels.
    return (
      <ObjectFields
        value={value as Record<string, unknown>}
        config={config}
        depth={depth + 1}
        onChange={onChange as (next: Record<string, unknown>) => void}
      />
    );
  }

  return null;
}
