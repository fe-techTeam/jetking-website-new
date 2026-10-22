'use client';

import { Pencil, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { useState, useTransition, type FormEvent } from 'react';
import { createRole, deleteRole, updateRole } from './actions';
import {
  ROLES,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  SECTIONS,
  SECTION_HINT,
  SECTION_LABEL,
  type Access,
  type AccessLevel,
  type LeadScope,
} from '@/lib/auth/roles';
import type { CustomRoleView } from '@/lib/auth/custom-roles';
import { AdminConfirmDialog } from '../AdminConfirmDialog';

const LEVELS: { value: AccessLevel; label: string }[] = [
  { value: 'none', label: 'No access' },
  { value: 'view', label: 'View' },
  { value: 'edit', label: 'View & edit' },
];

const EMPTY_ACCESS: Access = { content: 'none', leads: 'none', media: 'none', seo: 'none', redirects: 'none', chatbot: 'none' };

interface Draft {
  /** Set when editing an existing role. */
  id: string | null;
  name: string;
  description: string;
  access: Access;
  leadScope: LeadScope;
}

const BLANK: Draft = { id: null, name: '', description: '', access: EMPTY_ACCESS, leadScope: 'all' };

/** Ready-made starting points for "New role" — each fills the form, which can be changed before saving. */
const TEMPLATES: { name: string; description: string; access: Access; leadScope: LeadScope }[] = [
  {
    name: 'Sub admin',
    description: 'Runs the whole panel day to day, except team accounts, the activity log and legal pages.',
    access: { content: 'edit', leads: 'edit', media: 'edit', seo: 'edit', redirects: 'edit', chatbot: 'edit' },
    leadScope: 'all',
  },
  {
    name: 'Content manager',
    description: 'Edits the website, images and SEO. No leads.',
    access: { content: 'edit', leads: 'none', media: 'edit', seo: 'edit', redirects: 'none', chatbot: 'none' },
    leadScope: 'all',
  },
  {
    name: 'Sales manager',
    description: 'Works every enquiry in Leads. Can view website content.',
    access: { content: 'view', leads: 'edit', media: 'none', seo: 'none', redirects: 'none', chatbot: 'none' },
    leadScope: 'all',
  },
  {
    name: 'Marketing',
    description: 'SEO, redirects, images and chatbot answers.',
    access: { content: 'view', leads: 'none', media: 'edit', seo: 'edit', redirects: 'edit', chatbot: 'edit' },
    leadScope: 'all',
  },
  {
    name: 'Viewer',
    description: 'Can look at everything but change nothing.',
    access: { content: 'view', leads: 'view', media: 'view', seo: 'view', redirects: 'view', chatbot: 'view' },
    leadScope: 'all',
  },
];

function summary(role: CustomRoleView): string[] {
  return SECTIONS.filter((s) => role.access[s] !== 'none').map(
    (s) => `${SECTION_LABEL[s]} · ${role.access[s] === 'edit' ? 'edit' : 'view'}`,
  );
}

export function RolesPanel({
  roles,
  onChange,
}: {
  roles: CustomRoleView[];
  onChange: (next: CustomRoleView[]) => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomRoleView | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    setMessage(null);
    const input = { name: draft.name, description: draft.description, access: draft.access, leadScope: draft.leadScope };
    start(async () => {
      const result = draft.id ? await updateRole(draft.id, input) : await createRole(input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onChange(
        draft.id
          ? roles.map((r) => (r.id === result.role.id ? result.role : r))
          : [...roles, result.role].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setMessage(draft.id ? `Saved "${result.role.name}". Members get the new access straight away.` : `Created "${result.role.name}". You can now give it to people.`);
      setDraft(null);
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const role = pendingDelete;
    start(async () => {
      const result = await deleteRole(role.id);
      if (!result.ok) {
        setError(result.error);
        setPendingDelete(null);
        return;
      }
      onChange(roles.filter((r) => r.id !== role.id));
      setMessage(`Deleted "${role.name}".`);
      setPendingDelete(null);
    });
  }

  const setLevel = (section: (typeof SECTIONS)[number], level: AccessLevel) =>
    setDraft((d) => (d ? { ...d, access: { ...d.access, [section]: level } } : d));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-foreground-secondary">
          A role is a named set of permissions. For each part of the panel choose{' '}
          <strong className="text-foreground">No access</strong>, <strong className="text-foreground">View</strong> or{' '}
          <strong className="text-foreground">View &amp; edit</strong>. Team accounts, the audit log and the legal
          pages always stay admin-only.
        </p>
        {!draft ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMessage(null);
              setDraft(BLANK);
            }}
            className="adm-btn-primary font-bold inline-flex h-11 shrink-0 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm"
          >
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            New role
          </button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm font-medium text-[var(--color-error-600)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p aria-live="polite" className="mt-4 text-sm text-growth-600">
          {message}
        </p>
      ) : null}

      {draft ? (
        <form onSubmit={save} className="adm-card mt-6 grid gap-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-foreground">{draft.id ? 'Edit role' : 'New role'}</h2>
            <button
              type="button"
              onClick={() => setDraft(null)}
              aria-label="Close"
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-foreground-muted hover:bg-surface hover:text-foreground"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {!draft.id ? (
            <div>
              <p className="label-mono mb-2">Start from a template (optional)</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    title={t.description}
                    onClick={() => setDraft({ id: null, ...t })}
                    className="min-h-9 cursor-pointer rounded-full border border-border px-3 text-xs font-semibold text-foreground-secondary transition-colors hover:border-border-strong hover:text-foreground"
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="label-mono">Role name</span>
              <input
                required
                minLength={2}
                maxLength={40}
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="admin-input"
                placeholder="e.g. Content writer, Marketing, Counsellor"
                autoComplete="off"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="label-mono">Description (optional)</span>
              <input
                maxLength={200}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                className="admin-input"
                placeholder="What this role is for"
                autoComplete="off"
              />
            </label>
          </div>

          <fieldset className="min-w-0">
            <legend className="label-mono mb-2">Permissions</legend>
            <ul className="divide-y divide-border rounded-[var(--admin-radius)] border border-border">
              {SECTIONS.map((section) => (
                <li key={section} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{SECTION_LABEL[section]}</p>
                    <p className="text-xs text-foreground-muted">{SECTION_HINT[section]}</p>
                  </div>
                  <div role="radiogroup" aria-label={`${SECTION_LABEL[section]} access`} className="inline-flex shrink-0 overflow-hidden rounded-[var(--admin-radius)] border border-border">
                    {LEVELS.map((level) => {
                      const active = draft.access[section] === level.value;
                      return (
                        <button
                          key={level.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setLevel(section, level.value)}
                          className={`min-h-10 cursor-pointer whitespace-nowrap px-3 text-xs font-semibold transition-colors ${
                            active
                              ? level.value === 'none'
                                ? 'bg-surface text-foreground'
                                : 'bg-[var(--accent)] text-white'
                              : 'bg-card text-foreground-muted hover:text-foreground'
                          }`}
                        >
                          {level.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </fieldset>

          {draft.access.leads !== 'none' ? (
            <label className="flex flex-col gap-1.5 text-sm sm:max-w-md">
              <span className="label-mono">Which leads can they see?</span>
              <select
                value={draft.leadScope}
                onChange={(e) => setDraft({ ...draft, leadScope: e.target.value as LeadScope })}
                className="admin-input"
              >
                <option value="all">Every lead</option>
                <option value="centre">Only their own centre&apos;s leads</option>
              </select>
              {draft.leadScope === 'centre' ? (
                <span className="text-xs text-foreground-muted">
                  Each person with this role is assigned one centre when you add them.
                </span>
              ) : null}
            </label>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="adm-btn-primary font-bold inline-flex h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-6 text-sm disabled:opacity-45"
            >
              {pending ? 'Saving…' : draft.id ? 'Save role' : 'Create role'}
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="h-11 cursor-pointer rounded-[var(--admin-radius)] border border-border px-5 text-sm font-semibold text-foreground-secondary hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <h2 className="label-mono mt-8">Your roles</h2>
      {roles.length === 0 ? (
        <p className="mt-3 rounded-[var(--admin-radius)] border border-dashed border-border p-5 text-sm text-foreground-muted">
          No custom roles yet. Create one, for example “Content writer” with edit access to Website content and
          nothing else.
        </p>
      ) : (
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {roles.map((role) => (
            <li key={role.id} className="adm-card flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <ShieldCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--accent)]" />
                    <span className="truncate">{role.name}</span>
                  </p>
                  {role.description ? <p className="mt-1 text-xs text-foreground-muted">{role.description}</p> : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMessage(null);
                      setDraft({ id: role.id, name: role.name, description: role.description, access: role.access, leadScope: role.leadScope });
                    }}
                    aria-label={`Edit ${role.name}`}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] text-foreground-secondary hover:bg-surface hover:text-foreground"
                  >
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setPendingDelete(role);
                    }}
                    aria-label={`Delete ${role.name}`}
                    className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] text-foreground-muted hover:bg-[var(--color-error-50)] hover:text-[#b42318]"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {summary(role).map((chip) => (
                  <li key={chip} className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground-secondary">
                    {chip}
                  </li>
                ))}
                {role.access.leads !== 'none' && role.leadScope === 'centre' ? (
                  <li className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium text-foreground-secondary">Own centre&apos;s leads only</li>
                ) : null}
              </ul>
              <p className="text-xs text-foreground-muted">
                {role.memberCount} {role.memberCount === 1 ? 'person' : 'people'}
              </p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="label-mono mt-8">Built-in roles</h2>
      <ul className="mt-3 grid gap-3 lg:grid-cols-3">
        {ROLES.map((r) => (
          <li key={r} className="rounded-[var(--admin-radius)] border border-border p-4">
            <p className="text-sm font-bold text-foreground">{ROLE_LABEL[r]}</p>
            <p className="mt-1 text-xs text-foreground-muted">{ROLE_DESCRIPTION[r]}</p>
          </li>
        ))}
      </ul>

      <AdminConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete role"
        description={
          <>
            Delete <span className="font-semibold text-foreground">{pendingDelete?.name}</span>? This can&apos;t be
            undone. A role that people still have can&apos;t be deleted.
          </>
        }
        pending={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
