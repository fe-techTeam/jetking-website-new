'use client';

import { SECTIONS, SECTION_HINT, SECTION_LABEL, type Access, type LeadScope, type Section } from '@/lib/auth/roles';

/** What gets ticked for one person: a View and an Edit box per section (Edit includes View). */
export interface PersonalState {
  access: Access;
  leadScope: LeadScope;
  /** What to call this access, e.g. "Blog writer". */
  label: string;
}

export const BLANK_PERSONAL: PersonalState = {
  access: { content: 'none', leads: 'none', media: 'none', seo: 'none', redirects: 'none', chatbot: 'none' },
  leadScope: 'all',
  label: '',
};

export const hasAnySection = (p: PersonalState) => SECTIONS.some((s) => p.access[s] !== 'none');

/** Ready to save: named and at least one section ticked. */
export const personalComplete = (p: PersonalState) => hasAnySection(p) && p.label.trim().length >= 2;

export function PersonalAccessFields({
  value,
  onChange,
}: {
  value: PersonalState;
  onChange: (next: PersonalState) => void;
}) {
  const set = (section: Section, level: 'none' | 'view' | 'edit') =>
    onChange({ ...value, access: { ...value.access, [section]: level } });

  return (
    <fieldset className="rounded-[var(--admin-radius)] border border-border p-4">
      <legend className="label-mono px-1">What can this person do?</legend>
      <label className="mb-3 flex flex-col gap-1.5 text-sm">
        <span className="label-mono">Name for this access</span>
        <input
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          maxLength={40}
          required
          placeholder="e.g. Blog writer"
          className="admin-input"
        />
      </label>
      <ul className="divide-y divide-border">
        {SECTIONS.map((section) => {
          const level = value.access[section];
          return (
            <li key={section} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2.5">
              <div className="min-w-0 flex-1 basis-56">
                <p className="text-sm font-semibold text-foreground">{SECTION_LABEL[section]}</p>
                <p className="text-xs text-foreground-muted">{SECTION_HINT[section]}</p>
              </div>
              <div className="flex shrink-0 items-center gap-5 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={level !== 'none'}
                    disabled={level === 'edit'}
                    onChange={(e) => set(section, e.target.checked ? 'view' : 'none')}
                    className="h-4 w-4 cursor-pointer"
                  />
                  View
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={level === 'edit'}
                    onChange={(e) => set(section, e.target.checked ? 'edit' : 'view')}
                    className="h-4 w-4 cursor-pointer"
                  />
                  Edit
                </label>
              </div>
            </li>
          );
        })}
      </ul>
      {value.access.leads !== 'none' ? (
        <label className="mt-3 flex cursor-pointer items-center gap-2 border-t border-border pt-3 text-sm">
          <input
            type="checkbox"
            checked={value.leadScope === 'centre'}
            onChange={(e) => onChange({ ...value, leadScope: e.target.checked ? 'centre' : 'all' })}
            className="h-4 w-4 cursor-pointer"
          />
          Only show leads for one centre (you’ll pick the centre next)
        </label>
      ) : null}
      <p className="mt-3 text-xs text-foreground-muted">
        Team accounts, the activity log and the legal pages always stay admin-only.
      </p>
    </fieldset>
  );
}
