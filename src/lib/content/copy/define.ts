/**
 * "Page text" — every piece of editable copy on a page, as a flat map of named fields.
 *
 * Each page declares its fields once, with the text it ships with as the default. The admin lists
 * those fields and stores only what an editor changed (the `page_copy` collection); a page loads the
 * defaults merged with any published overrides. Because the default IS the current text, a page
 * renders exactly as before until someone edits it, and a missing or draft record changes nothing.
 *
 * Key conventions (the admin groups and labels fields from them):
 *   - `seo.title`, `seo.description`, `seo.ogImage` — the page's search/share metadata.
 *   - `<section>.<field>` — e.g. `hero.title`, `faq.heading`, `cards.0.body` (repeating blocks use an index).
 *   - Links and image paths are plain fields too (`hero.cta.href`, `hero.image`).
 * This edits text, links and image paths. Adding or reordering whole sections is a code change.
 */

export interface PageCopyDef<T extends Record<string, string> = Record<string, string>> {
  /** CMS id of the page's `page_copy` record. */
  id: string;
  /** Shown in the admin. */
  label: string;
  /** Public path, when the page has one — gives the admin a "view page" link. */
  path?: string;
  /** Sidebar/list grouping in the admin. */
  group: 'Pages' | 'Site';
  /** One-line hint for editors about what this covers. */
  description?: string;
  defaults: T;
}

export function definePageCopy<T extends Record<string, string>>(def: PageCopyDef<T>): PageCopyDef<T> {
  return def;
}

/** The copy a component receives: every declared key, always present. */
export type CopyOf<D extends PageCopyDef<Record<string, string>>> = D['defaults'];

/**
 * Merge stored overrides over a page's defaults. Only keys the page still declares are honoured, and
 * an empty override means "use the default" — so deleting a code field never leaves a stale value
 * behind, and clearing a field in the admin restores the shipped text.
 */
export function mergeCopy<T extends Record<string, string>>(defaults: T, overrides: Record<string, string> | undefined): T {
  if (!overrides) return defaults;
  const merged: Record<string, string> = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const value = overrides[key];
    if (typeof value === 'string' && value.trim() !== '') merged[key] = value;
  }
  return merged as T;
}

/**
 * Fill `{name}` placeholders in a copy field — for text that mixes fixed wording with live values
 * (a count of centres, a course title): `fill(copy['hero.sub'], { centres: 39 })` turns
 * "Across {centres} centres" into "Across 39 centres". Unknown placeholders are left as written so a
 * typo in the admin is visible rather than silently blank.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}
