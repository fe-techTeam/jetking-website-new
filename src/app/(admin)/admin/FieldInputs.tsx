'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

/** Options for fields that point at other records (a course's slug, a centre's city…). Loaded once by the server page. */
export interface RelationOption {
  value: string;
  label: string;
}
export interface Relations {
  courses: RelationOption[];
  centres: RelationOption[];
  cities: RelationOption[];
}
export const RelationsContext = createContext<Relations>({ courses: [], centres: [], cities: [] });

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
  'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha',
  'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
];

export type FieldKind =
  | 'date' | 'datetime' | 'email' | 'phone' | 'url' | 'pincode' | 'score' | 'geo' | 'slug' | 'state'
  | 'course-multi' | 'centre-multi' | 'city-select' | 'provider' | 'seo-title' | 'seo-description' | 'text';

/** Which specialised editor a field gets, from its name, its place in the record and its current value. */
export function fieldKind(key: string, path: string, value: unknown): FieldKind {
  if (path.endsWith('seo.title') && path.split('.').length === 2) return 'seo-title';
  if (path === 'seo.description') return 'seo-description';
  if (path.startsWith('personaRelevance.')) return 'score';
  if (path === 'geo.lat' || path === 'geo.lng') return 'geo';
  if (/^(startsAt|endsAt)$/.test(key)) return 'datetime';
  if (/^(updatedAt|publishedAt|syncedAt|createdAt|date)$/.test(key) || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))) return 'date';
  if (/email$/i.test(key)) return 'email';
  if (/(phone|helpline|fax|mobile)$/i.test(key)) return 'phone';
  if (/^(href|website|stockLive|latestNews|linkHref|sourceUrl|link)$/i.test(key)) return 'url';
  if (key === 'pincode') return 'pincode';
  if (key === 'slug') return 'slug';
  if (key === 'state') return 'state';
  if (key === 'relatedCourseSlugs' || key === 'coursesOffered') return 'course-multi';
  if (key === 'centreSlugs') return 'centre-multi';
  if (key === 'citySlug') return 'city-select';
  if (key === 'provider') return 'provider';
  return 'text';
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const plural = (noun: string) => (noun.endsWith('y') ? `${noun.slice(0, -1)}ies` : `${noun}s`);

const hint = (text: string) => <p className="mt-1 text-xs text-foreground-muted">{text}</p>;

/** A textarea that grows with its content (no inner scrollbar to hunt through) and, optionally, counts characters. */
export function AutoTextarea({
  value,
  onChange,
  minRows = 3,
  max,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  minRows?: number;
  max?: number;
  min?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  const n = value.trim().length;
  const ok = (min === undefined || n >= min) && (max === undefined || n <= max);
  return (
    <div>
      <textarea ref={ref} value={value} rows={minRows} onChange={(e) => onChange(e.target.value)} className="admin-input resize-none overflow-hidden" />
      {max !== undefined ? <p className={`mt-1 text-right text-xs ${ok ? 'text-foreground-muted' : 'text-[#b54708]'}`}>{n} / {max}</p> : null}
    </div>
  );
}

/** Local date-time <-> ISO string (with offset) so an editor picks a time in their own zone and the site gets an unambiguous instant. */
function isoToLocalInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SpecialField({
  kind,
  value,
  onChange,
  context,
}: {
  kind: FieldKind;
  value: string;
  onChange: (v: string) => void;
  /** The object the field sits in — the slug field reads the sibling title from it. */
  context?: Record<string, unknown>;
}) {
  const relations = useContext(RelationsContext);

  switch (kind) {
    case 'date':
      return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="admin-input" />;
    case 'datetime':
      return (
        <div>
          <input
            type="datetime-local"
            value={isoToLocalInput(value)}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')}
            className="admin-input"
          />
          {hint('Your local time. Leave empty for no limit.')}
        </div>
      );
    case 'email':
      return <input type="email" inputMode="email" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} placeholder="name@jetking.com" className="admin-input" />;
    case 'phone':
      return <input type="tel" inputMode="tel" value={value} onChange={(e) => onChange(e.target.value)} placeholder="+91 …" className="admin-input" />;
    case 'pincode':
      return <input inputMode="numeric" maxLength={6} pattern="\d{6}" value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 digits" className="admin-input" />;
    case 'url': {
      const bad = value !== '' && !/^(\/|https?:\/\/|mailto:|tel:|#)/.test(value);
      return (
        <div>
          <div className="flex items-center gap-2">
            <input inputMode="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder="/page or https://…" aria-invalid={bad} className="admin-input min-w-0 flex-1" />
            {value && !bad && /^https?:\/\//.test(value) ? (
              <a href={value} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold text-[var(--accent-ink)] hover:underline">
                Open ↗
              </a>
            ) : null}
          </div>
          {bad ? <p className="mt-1 text-xs text-[var(--color-error-600)]">Start with / for a page on this site, or https:// for another site.</p> : null}
        </div>
      );
    }
    case 'score': {
      const n = Number(value) || 0;
      return (
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={1} step={0.05} value={n} onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 accent-[var(--accent)]" aria-label="Relevance" />
          <span className="numeral w-10 text-right text-sm font-bold text-foreground">{n.toFixed(2)}</span>
        </div>
      );
    }
    case 'geo':
      return <input type="number" step="any" value={value} onChange={(e) => onChange(e.target.value)} placeholder="e.g. 19.0760" className="admin-input" />;
    case 'state':
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="admin-input">
          <option value="">Choose a state…</option>
          {value && !INDIAN_STATES.includes(value) ? <option value={value}>{value}</option> : null}
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      );
    case 'city-select':
      return <SearchSelect value={value} onChange={onChange} options={relations.cities} placeholder="Choose a city…" noun="city" />;
    case 'provider':
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="admin-input">
          {['youtube', 'vimeo'].map((p) => (
            <option key={p} value={p}>
              {p === 'youtube' ? 'YouTube' : 'Vimeo'}
            </option>
          ))}
        </select>
      );
    case 'slug': {
      const source = String(context?.title ?? context?.name ?? '');
      return (
        <div>
          <div className="flex items-center gap-2">
            <input value={value} onChange={(e) => onChange(slugify(e.target.value))} placeholder="lowercase-with-hyphens" className="admin-input min-w-0 flex-1" />
            {source ? (
              <button type="button" onClick={() => onChange(slugify(source))} className="min-h-11 shrink-0 cursor-pointer rounded-[var(--admin-radius)] border border-border px-3 text-xs font-semibold text-foreground-secondary hover:border-[var(--accent)] hover:text-[var(--accent-ink)]">
                From title
              </button>
            ) : null}
          </div>
          {hint('Part of the page address. Changing it changes the URL (add a redirect from the old one).')}
        </div>
      );
    }
    default:
      return null;
  }
}

/** Pick several related records (courses, centres) from a searchable list, shown as removable chips. */
export function MultiRelation({
  value,
  onChange,
  options,
  noun,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: RelationOption[];
  noun: string;
}) {
  const [query, setQuery] = useState('');
  const label = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const q = query.trim().toLowerCase();
  const available = options.filter((o) => !value.includes(o.value) && (!q || `${o.label} ${o.value}`.toLowerCase().includes(q)));
  return (
    <div className="rounded-[var(--admin-radius)] border border-border p-2">
      {value.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {value.map((v) => (
            <li key={v} className="inline-flex items-center gap-1.5 rounded-full bg-surface py-1 pr-1.5 pl-3 text-xs font-semibold text-foreground ring-1 ring-border">
              {label(v)}
              <button type="button" aria-label={`Remove ${label(v)}`} onClick={() => onChange(value.filter((x) => x !== v))} className="grid h-5 w-5 cursor-pointer place-items-center rounded-full text-foreground-muted hover:bg-[var(--color-error-50)] hover:text-[#b42318]">
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Add a ${noun}…`} aria-label={`Search ${plural(noun)}`} className="admin-input h-10 text-sm" />
      {q || available.length <= 8 ? (
        <ul className="mt-1.5 max-h-44 overflow-auto">
          {available.slice(0, 40).map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange([...value, o.value]);
                  setQuery('');
                }}
                className="block min-h-9 w-full cursor-pointer rounded-md px-2 text-left text-sm text-foreground-secondary hover:bg-surface"
              >
                + {o.label}
              </button>
            </li>
          ))}
          {available.length === 0 ? <li className="px-2 py-2 text-xs text-foreground-muted">No {plural(noun)} left to add.</li> : null}
        </ul>
      ) : (
        <p className="mt-1.5 px-1 text-xs text-foreground-muted">Type to search {available.length} {plural(noun)}.</p>
      )}
    </div>
  );
}

/** A single-choice dropdown with a search box — for lists too long to scan (cities, centres). */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder,
  noun,
}: {
  value: string;
  onChange: (v: string) => void;
  options: RelationOption[];
  placeholder: string;
  noun: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const q = query.trim().toLowerCase();
  const list = options.filter((o) => !q || `${o.label} ${o.value}`.toLowerCase().includes(q));
  const current = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setQuery('');
        }}
        className="admin-input flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 text-left"
      >
        <span className={current ? 'text-foreground' : 'text-foreground-muted'}>{current || placeholder}</span>
        <span aria-hidden="true" className="text-foreground-muted">▾</span>
      </button>
      {open ? (
        <div className="absolute z-20 mt-1 w-full rounded-[var(--admin-radius)] border border-border bg-background p-2 shadow-[var(--adm-shadow-lift)]">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${plural(noun)}…`}
            aria-label={`Search ${plural(noun)}`}
            className="admin-input h-10 text-sm"
          />
          <ul role="listbox" className="mt-1.5 max-h-56 overflow-auto">
            {list.length === 0 ? <li className="px-2 py-2 text-xs text-foreground-muted">No {noun} matches.</li> : null}
            {list.map((o) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`block min-h-9 w-full cursor-pointer rounded-md px-2 text-left text-sm hover:bg-surface ${o.value === value ? 'font-bold text-[var(--accent-ink)]' : 'text-foreground-secondary'}`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
