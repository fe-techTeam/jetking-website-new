'use client';

import type { AdminFormConfig } from '@/lib/cms/admin-form-config';
import { BlocksEditor, type Block } from './BlocksEditor';
import { TagListEditor } from './TagListEditor';
import { ParagraphListEditor } from './ParagraphListEditor';
import { LegalBlocksEditor } from './LegalBlocksEditor';
import type { LegalBlock } from '@/lib/content/types';
import { MediaPickerButton } from './MediaPicker';
import { AutoTextarea, MultiRelation, RelationsContext, SpecialField, fieldKind } from './FieldInputs';
import { useContext } from 'react';

/** String fields that hold an image path/URL get a preview and a "Choose image" button. */
const IMAGE_FIELDS = /(^|[a-z])(image|img|photo|logo|thumbnail|avatar|cover|banner|poster)(url|src|path)?$|^ogImage$|^file$/i;

/** Field names whose data key predates the website's wording. The site says "courses" everywhere. */
const LABEL_OVERRIDES: Record<string, string> = {
  featuredProgrammes: 'Featured courses',
  titleLead: 'Heading — first part',
  titleAccent: 'Heading — highlighted part',
  lede: 'Intro line',
  photoUrl: 'Photo path',
  imageSrc: 'Image path',
  recruitersDisclaimer: 'Recruiters note',
  videoId: 'Video ID',
  sourceUrl: 'Original page URL',
  citySlug: 'City',
  coursesOffered: 'Courses offered',
  relatedCourseSlugs: 'Related courses',
  centreSlugs: 'Centres',
  addressLine: 'Address',
  personaRelevance: 'Relevance by audience',
  startsAt: 'Starts',
  endsAt: 'Ends',
  legacyPath: 'Old URL (legacy)',
};

export function humanize(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Fields long enough to deserve a textarea rather than a single-line input,
 *  keyed by name since the value's own current length isn't a reliable signal
 *  for a field that's merely empty right now. */
const LONG_TEXT_FIELDS =
  /summary|answer|bio|intro|note(s)?|description|excerpt|address|eligibility|lede|headline|question|quote|disclaimer|body/i;

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
  function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const copy = [...value];
    [copy[index], copy[target]] = [copy[target]!, copy[index]!];
    onChange(copy);
  }

  return (
    <div className="flex flex-col gap-4">
      {value.map((item, i) => (
        <div key={i} className="rounded-[var(--admin-radius)] border border-border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="label-mono">
              {humanize(fieldKey).replace(/s$/, '')} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${humanize(fieldKey).replace(/s$/, '').toLowerCase()} ${i + 1} up`}
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-[10px] text-base text-foreground-muted transition-colors hover:bg-surface hover:text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label={`Move ${humanize(fieldKey).replace(/s$/, '').toLowerCase()} ${i + 1} down`}
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-[10px] text-base text-foreground-muted transition-colors hover:bg-surface hover:text-[var(--accent-ink)] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                className="min-h-11 cursor-pointer rounded-[10px] px-3 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[var(--color-error-50)] hover:text-[#b42318]"
              >
                Remove
              </button>
            </div>
          </div>
          <ObjectFields
            value={{ ...itemTemplate, ...item }}
            config={config}
            path={`${fieldKey}[]`}
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
        className="min-h-11 cursor-pointer self-start rounded-[var(--admin-radius)] border border-dashed border-border-medium bg-background px-4 text-sm font-bold text-foreground-secondary transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-ink)]"
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
  path,
}: {
  value: Record<string, unknown>;
  config: AdminFormConfig;
  depth: number;
  onChange: (next: Record<string, unknown>) => void;
  path: string;
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
              path={path ? `${path}.${key}` : key}
              context={value}
              asImage={(key === 'url' && ('alt' in value || 'caption' in value)) || (path === 'experiencePhotos')}
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
  asImage = false,
  path = '',
  context,
}: {
  value: unknown;
  fieldKey: string;
  onChange: (next: unknown) => void;
  config: AdminFormConfig;
  depth?: number;
  /** Forces the image treatment — for a bare `url` that sits beside an `alt` (an image reference). */
  asImage?: boolean;
  /** Dotted position in the record (`seo.title`, `personaRelevance.student`) — what lets a field's meaning depend on where it sits. */
  path?: string;
  /** The object this field belongs to, for fields that react to a sibling (a slug follows its title). */
  context?: Record<string, unknown>;
}) {
  const relations = useContext(RelationsContext);
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

  const kind = fieldKind(fieldKey, path || fieldKey, value);
  if ((typeof value === 'string' || value === null || value === undefined) && kind !== 'text' && kind !== 'seo-title' && kind !== 'seo-description' && !asImage) {
    return <SpecialField kind={kind} value={typeof value === 'string' ? value : ''} onChange={onChange as (v: string) => void} context={context} />;
  }
  if (typeof value === 'number' && (kind === 'score' || kind === 'geo')) {
    return <SpecialField kind={kind} value={String(value)} onChange={(v) => onChange(v === '' ? 0 : Number(v))} />;
  }
  if (typeof value === 'string' && (kind === 'seo-title' || kind === 'seo-description')) {
    return kind === 'seo-title' ? (
      <AutoTextarea value={value} onChange={onChange as (v: string) => void} minRows={1} min={20} max={60} />
    ) : (
      <AutoTextarea value={value} onChange={onChange as (v: string) => void} minRows={2} min={70} max={160} />
    );
  }

  if (typeof value === 'string' && (asImage || IMAGE_FIELDS.test(fieldKey))) {
    return (
      <div className="flex items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- admin preview of an arbitrary path
          <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-md border border-border bg-surface object-contain" />
        ) : null}
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="/path/to/image or https://…" className="admin-input min-w-0 flex-1" />
        <MediaPickerButton onPick={(item) => onChange(item.url)} />
      </div>
    );
  }

  if (typeof value === 'string') {
    if (LONG_TEXT_FIELDS.test(fieldKey) || value.length > 80) {
      return <AutoTextarea value={value} onChange={onChange as (v: string) => void} minRows={3} />;
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
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-medium text-foreground-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      >
        <span aria-hidden="true" className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${value ? 'bg-growth-600' : 'bg-border-medium'}`}>
          <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
        {value ? 'Yes' : 'No'}
      </button>
    );
  }

  if (Array.isArray(value)) {
    if (fieldKey === 'body') {
      return <BlocksEditor value={value as Block[]} onChange={onChange as (next: Block[]) => void} />;
    }
    if (fieldKey === 'blocks') {
      return <LegalBlocksEditor value={value as LegalBlock[]} onChange={onChange as (next: LegalBlock[]) => void} />;
    }
    if (config.paragraphFields?.includes(fieldKey)) {
      return <ParagraphListEditor value={value as string[]} onChange={onChange as (next: string[]) => void} />;
    }
    const arrKind = fieldKind(fieldKey, path || fieldKey, value);
    if (arrKind === 'course-multi' || arrKind === 'centre-multi') {
      return (
        <MultiRelation
          value={value as string[]}
          onChange={onChange as (v: string[]) => void}
          options={arrKind === 'course-multi' ? relations.courses : relations.centres}
          noun={arrKind === 'course-multi' ? 'course' : 'centre'}
        />
      );
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
        path={path || fieldKey}
        onChange={onChange as (next: Record<string, unknown>) => void}
      />
    );
  }

  return null;
}
