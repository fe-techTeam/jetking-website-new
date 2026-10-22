'use client';

import { KeyRound, Plus, Trash2, UserCheck, UserX, X } from 'lucide-react';
import { useRef, useState, useTransition, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  inviteUser,
  changeUserRole,
  toggleUserStatus,
  adminResetPassword,
  removeUser,
} from './actions';
import {
  PERSONAL_KEY,
  PERSONAL_LABEL,
  ROLES,
  ROLE_DESCRIPTION,
  ROLE_LABEL,
  SECTIONS,
  SECTION_LABEL,
  normalizeAccess,
  normalizeLeadScope,
  type Role,
} from '@/lib/auth/roles';
import { BLANK_PERSONAL, PersonalAccessFields, personalComplete, type PersonalState } from './PersonalAccessFields';
import type { CustomRoleView } from '@/lib/auth/custom-roles';
import type { AdminUser } from '@/lib/db/schema';
import type { CentreOption } from '@/lib/leads/centre-scope';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { FilterChip } from '../FilterChip';
import { RolesPanel } from './RolesPanel';

function formatDate(value: Date | string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** A role is picked as one string: a built-in (`editor`) or `custom:<role id>`. */
function userRoleKey(u: AdminUser): string {
  if (u.role !== 'custom') return u.role;
  return !u.customRoleId && u.personalAccess ? PERSONAL_KEY : `custom:${u.customRoleId ?? ''}`;
}

/** The ticked sections saved on a person who has their own access. */
function personalOf(u: AdminUser): PersonalState {
  return { access: normalizeAccess(u.personalAccess), leadScope: normalizeLeadScope(u.personalLeadScope), label: u.personalLabel ?? '' };
}

/** A person's role name — their own access shows the name it was given. */
function userRoleLabel(u: AdminUser, roles: CustomRoleView[]): string {
  const key = userRoleKey(u);
  return key === PERSONAL_KEY ? u.personalLabel || PERSONAL_LABEL : roleLabelOf(key, roles);
}

const describePersonal = (p: PersonalState) =>
  SECTIONS.filter((s) => p.access[s] !== 'none')
    .map((s) => `${SECTION_LABEL[s]} (${p.access[s]})`)
    .join(', ');

function roleLabelOf(key: string, roles: CustomRoleView[]): string {
  if (key === PERSONAL_KEY) return PERSONAL_LABEL;
  if (key.startsWith('custom:')) return roles.find((r) => `custom:${r.id}` === key)?.name ?? 'No role';
  return ROLE_LABEL[key as Role] ?? key;
}

/** Does this role limit leads to one centre (so the person needs a centre)? */
function needsCentre(key: string, roles: CustomRoleView[], personal?: PersonalState): boolean {
  if (key === 'centre_staff') return true;
  if (key === PERSONAL_KEY) return !!personal && personal.leadScope === 'centre' && personal.access.leads !== 'none';
  const custom = key.startsWith('custom:') ? roles.find((r) => `custom:${r.id}` === key) : undefined;
  return !!custom && custom.leadScope === 'centre' && custom.access.leads !== 'none';
}

function roleDescription(key: string, roles: CustomRoleView[], personal?: PersonalState): string {
  if (key === PERSONAL_KEY) return personal ? describePersonal(personal) || 'Tick what this person can use.' : '';
  if (key.startsWith('custom:')) {
    const role = roles.find((r) => `custom:${r.id}` === key);
    if (!role) return '';
    const parts = SECTIONS.filter((s) => role.access[s] !== 'none').map(
      (s) => `${SECTION_LABEL[s]} (${role.access[s]})`,
    );
    return [role.description, parts.join(', ')].filter(Boolean).join(' — ');
  }
  return ROLE_DESCRIPTION[key as Role] ?? '';
}

function roleCounts(users: AdminUser[], roles: CustomRoleView[]): string {
  const keys = [...ROLES, ...roles.map((r) => `custom:${r.id}`), PERSONAL_KEY];
  const parts = keys
    .map((key) => {
      const n = users.filter((u) => userRoleKey(u) === key).length;
      if (n === 0) return null;
      const label = roleLabelOf(key, roles).toLowerCase();
      return `${n} ${n === 1 ? label : `${label}s`}`;
    })
    .filter(Boolean);
  return parts.length ? parts.join(' · ') : 'No accounts yet';
}

function RoleOptions({ roles }: { roles: CustomRoleView[] }) {
  return (
    <>
      <optgroup label="Built-in">
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </optgroup>
      {roles.length > 0 ? (
        <optgroup label="Custom roles">
          {roles.map((r) => (
            <option key={r.id} value={`custom:${r.id}`}>
              {r.name}
            </option>
          ))}
        </optgroup>
      ) : null}
      <optgroup label="One person only">
        <option value={PERSONAL_KEY}>{PERSONAL_LABEL} — tick sections</option>
      </optgroup>
    </>
  );
}

/** One sentence telling the admin whether the notification email went out. */
function emailNote(status: 'sent' | 'failed' | 'off', address: string): string {
  if (status === 'sent') return `A welcome email with the sign-in details was sent to ${address}.`;
  if (status === 'failed') return `The welcome email to ${address} could not be sent — share the password with them directly.`;
  return 'Email is not set up, so share the password with them directly.';
}

function suggestPassword(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export function TeamTable({
  initialUsers,
  centres,
  initialRoles,
}: {
  initialUsers: AdminUser[];
  centres: CentreOption[];
  initialRoles: CustomRoleView[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(initialRoles);
  const [tab, setTab] = useState<'people' | 'roles'>('people');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState<string>('editor');
  const [invitePersonal, setInvitePersonal] = useState<PersonalState>(BLANK_PERSONAL);
  const [invitePassword, setInvitePassword] = useState('');
  const [pendingRemove, setPendingRemove] = useState<AdminUser | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: AdminUser;
    role: string;
    centreSlug: string;
    personal: PersonalState;
  } | null>(null);
  const [pendingDisable, setPendingDisable] = useState<AdminUser | null>(null);
  const [resetPasswordFor, setResetPasswordFor] = useState<AdminUser | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function upsertUser(next: AdminUser) {
    setUsers((prev) => prev.map((u) => (u.id === next.id ? next : u)));
  }

  const query = search.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && userRoleKey(u) !== roleFilter) return false;
    if (!query) return true;
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });
  const filtersActive = roleFilter !== 'all' || query.length > 0;

  function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    setError(null);
    setMessage(null);
    start(async () => {
      const result = await inviteUser(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUsers((prev) => [result.user, ...prev]);
      setMessage(
        `Created ${result.user.name} as ${userRoleLabel(result.user, roles)}. ${emailNote(result.email, result.user.email)} Add another account below, or close the form.`,
      );
      formRef.current?.reset();
      setInvitePassword('');
      setInviteRole('editor');
      setInvitePersonal(BLANK_PERSONAL);
    });
  }

  function handleRoleChange(user: AdminUser, role: string, centreSlug: string) {
    start(async () => {
      const result = await changeUserRole(user.id, role, centreSlug, role === PERSONAL_KEY ? personalOf(user) : undefined);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      upsertUser(result.user);
      setMessage(`Updated ${result.user.name}.`);
    });
  }

  function handleToggleStatus(user: AdminUser) {
    start(async () => {
      const result = await toggleUserStatus(user.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      upsertUser(result.user);
      setMessage(`${result.user.name} is now ${result.user.status}.`);
    });
  }

  function confirmRoleChange() {
    if (!pendingRoleChange) return;
    const { user, role, centreSlug, personal } = pendingRoleChange;
    start(async () => {
      const result = await changeUserRole(user.id, role, centreSlug, role === PERSONAL_KEY ? personal : undefined);
      if (!result.ok) {
        setError(result.error);
        setPendingRoleChange(null);
        return;
      }
      upsertUser(result.user);
      setMessage(`Updated ${result.user.name}.`);
      setPendingRoleChange(null);
    });
  }

  function confirmDisable() {
    if (!pendingDisable) return;
    const user = pendingDisable;
    start(async () => {
      const result = await toggleUserStatus(user.id);
      if (!result.ok) {
        setError(result.error);
        setPendingDisable(null);
        return;
      }
      upsertUser(result.user);
      setMessage(`${result.user.name} is now ${result.user.status}.`);
      setPendingDisable(null);
    });
  }

  function handleRemove() {
    if (!pendingRemove) return;
    const id = pendingRemove.id;
    const name = pendingRemove.name;
    start(async () => {
      const result = await removeUser(id);
      if (!result.ok) {
        setError(result.error);
        setPendingRemove(null);
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setMessage(`Removed ${name}.`);
      setPendingRemove(null);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="adm-eyebrow">team</p>
          <h1 className="adm-title mt-3">Team &amp; access</h1>
          <p className="adm-lede mt-3">
            Add the people who work on the website and choose what each can do. Everyone signs in with their own email.
          </p>
          <p className="mt-2 text-sm text-foreground-muted">{roleCounts(users, roles)}</p>
        </div>
        {tab === 'people' ? (
        <button
          type="button"
          onClick={() => setShowInvite((v) => !v)}
          className="adm-btn-primary font-bold inline-flex h-11 shrink-0 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm"
        >
          {showInvite ? <X aria-hidden="true" className="mr-2 h-4 w-4" /> : <Plus aria-hidden="true" className="mr-2 h-4 w-4" />}
          {showInvite ? 'Close form' : 'Add team member'}
        </button>
        ) : null}
      </div>

      <div role="tablist" aria-label="Team sections" className="mt-6 flex gap-1 border-b border-border">
        {(['people', 'roles'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px min-h-11 cursor-pointer border-b-2 px-4 text-sm font-semibold transition-colors ${
              tab === t ? 'border-[var(--accent)] text-foreground' : 'border-transparent text-foreground-muted hover:text-foreground'
            }`}
          >
            {t === 'people' ? `People (${users.length})` : `Roles (${ROLES.length + roles.length})`}
          </button>
        ))}
      </div>

      {tab === 'roles' ? (
        <RolesPanel roles={roles} onChange={setRoles} />
      ) : (
      <>
      {showInvite ? (
        <form
          ref={formRef}
          onSubmit={handleInvite}
          className="mt-8 grid gap-4 adm-card p-5 sm:grid-cols-2"
        >
          <p className="sm:col-span-2 text-sm text-foreground-secondary">
            Pick a role for this person. You can invite multiple people with the same role — there is
            no limit per role.
          </p>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Name</span>
            <input name="name" required className="admin-input" placeholder="Full name" autoComplete="off" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Email</span>
            <input
              name="email"
              type="email"
              required
              className="admin-input"
              placeholder="name@jetking.example"
              autoComplete="off"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Temporary password</span>
            <div className="flex gap-2">
              <input
                name="password"
                type="text"
                required
                minLength={10}
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="admin-input min-w-0 flex-1"
                placeholder="At least 10 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setInvitePassword(suggestPassword())}
                className="admin-input h-auto w-auto! shrink-0 cursor-pointer whitespace-nowrap px-4 text-xs font-semibold text-foreground-secondary hover:text-foreground"
              >
                Generate
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Role</span>
            <select
              name="role"
              className="admin-input"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <RoleOptions roles={roles} />
            </select>
            <span className="text-xs text-foreground-muted">{roleDescription(inviteRole, roles, invitePersonal)}</span>
          </label>
          {inviteRole === PERSONAL_KEY ? (
            <div className="sm:col-span-2">
              <input type="hidden" name="personal" value={JSON.stringify(invitePersonal)} />
              <PersonalAccessFields value={invitePersonal} onChange={setInvitePersonal} />
            </div>
          ) : null}
          {needsCentre(inviteRole, roles, invitePersonal) ? (
            <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
              <span className="label-mono">Centre</span>
              {centres.length > 0 ? (
                <select name="centreSlug" required className="admin-input" defaultValue="">
                  <option value="" disabled>
                    Select a centre…
                  </option>
                  {centres.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} — {c.cityName}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-foreground-muted">
                  No centres exist yet — add one under Centres first.
                </p>
              )}
            </label>
          ) : null}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending || (needsCentre(inviteRole, roles, invitePersonal) && centres.length === 0) || (inviteRole === PERSONAL_KEY && !personalComplete(invitePersonal))}
              className="adm-btn-primary font-bold inline-flex h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-6 text-sm disabled:opacity-45"
            >
              {pending ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 text-sm font-medium text-[var(--color-error-600)]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p aria-live="polite" className="mt-6 text-sm text-growth-600">
          {message}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="admin-input h-10 w-full max-w-xs"
            aria-label="Search team members"
          />
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip active={roleFilter === 'all'} onClick={() => setRoleFilter('all')}>
              All roles
            </FilterChip>
            {[...ROLES.map((r) => r as string), ...roles.map((r) => `custom:${r.id}`), PERSONAL_KEY]
              .filter((key) => key !== PERSONAL_KEY || users.some((u) => userRoleKey(u) === PERSONAL_KEY))
              .map((key) => (
              <FilterChip
                key={key}
                active={roleFilter === key}
                onClick={() => setRoleFilter((prev) => (prev === key ? 'all' : key))}
              >
                {roleLabelOf(key, roles)}
              </FilterChip>
            ))}
          </div>
          {filtersActive ? (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRoleFilter('all');
              }}
              className="cursor-pointer text-xs font-semibold text-foreground-muted hover:text-foreground"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        {filtersActive ? (
          <p className="label-mono">
            Showing {filteredUsers.length} of {users.length} people
          </p>
        ) : null}
      </div>

      <div className="mt-3 overflow-x-auto adm-card">
        <table className="adm-table w-full border-collapse text-sm md:min-w-[44rem]">
          <thead className="hidden md:table-header-group">
            <tr className="border-b border-border text-left">
              {['Name', 'Role', 'Centre', 'Status', 'Last active', ''].map((h) => (
                <th key={h} className="label-mono px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-none block px-1 py-2 md:table-row md:p-0">
                <td className="block px-4 py-3 md:table-cell">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent-ink)] ring-1 ring-[var(--accent-border)]/50"
                    >
                      {user.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{user.name}</span>
                      <span className="block text-xs text-foreground-muted">{user.email}</span>
                    </span>
                  </div>
                </td>
                <td className="block px-4 py-3 md:table-cell">
                  <select
                    value={userRoleKey(user)}
                    disabled={pending}
                    onChange={(e) => {
                      const role = e.target.value;
                      if (role === userRoleKey(user)) return;
                      const personal = user.personalAccess ? personalOf(user) : BLANK_PERSONAL;
                      setPendingRoleChange({
                        user,
                        role,
                        centreSlug: needsCentre(role, roles, personal) ? (user.centreSlug ?? '') : '',
                        personal,
                      });
                    }}
                    className="admin-input h-9 w-auto py-0 text-xs"
                    aria-label={`Role for ${user.name}`}
                  >
                    {user.role === 'custom' && !roles.some((x) => x.id === user.customRoleId) ? (
                      <option value={userRoleKey(user)}>No role</option>
                    ) : null}
                    <RoleOptions roles={roles} />
                  </select>
                  {userRoleKey(user) === PERSONAL_KEY ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPendingRoleChange({ user, role: PERSONAL_KEY, centreSlug: user.centreSlug ?? '', personal: personalOf(user) })
                      }
                      className="mt-1 block cursor-pointer text-xs font-semibold text-[var(--accent-ink)] hover:underline"
                      title={describePersonal(personalOf(user))}
                    >
                      {user.personalLabel ? `${user.personalLabel} · ` : ''}Edit access
                    </button>
                  ) : null}
                </td>
                <td className="block px-4 py-3 md:table-cell">
                  {needsCentre(userRoleKey(user), roles, personalOf(user)) ? (
                    <select
                      value={user.centreSlug ?? ''}
                      disabled={pending}
                      onChange={(e) => handleRoleChange(user, userRoleKey(user), e.target.value)}
                      className="admin-input h-9 w-44 py-0 text-xs"
                    >
                      <option value="" disabled>
                        Select a centre…
                      </option>
                      {centres.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name} — {c.cityName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-foreground-muted">All</span>
                  )}
                </td>
                <td className="block px-4 py-3 md:table-cell">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => (user.status === 'active' ? setPendingDisable(user) : handleToggleStatus(user))}
                    className={`tap inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-bold capitalize transition-colors disabled:opacity-45 ${
                      user.status === 'active'
                        ? 'bg-[var(--color-growth-50)] text-[#067647] hover:bg-[var(--color-error-50)] hover:text-[#b42318]'
                        : 'bg-[var(--color-error-50)] text-[#b42318] hover:bg-[var(--color-growth-50)] hover:text-[#067647]'
                    }`}
                    title={user.status === 'active' ? 'Click to disable' : 'Click to re-activate'}
                  >
                    {user.status === 'active' ? <UserCheck aria-hidden="true" className="h-3.5 w-3.5" /> : <UserX aria-hidden="true" className="h-3.5 w-3.5" />}
                    {user.status}
                  </button>
                </td>
                <td className="block px-4 py-3 md:table-cell font-mono text-xs text-foreground-muted">
                  {formatDate(user.lastActiveAt)}
                </td>
                <td className="block px-4 py-3 md:table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setResetPasswordFor(user)}
                      title="Reset password"
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                    >
                      <KeyRound aria-hidden="true" className="h-4 w-4" /><span className="sr-only xl:not-sr-only">Reset password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRemove(user)}
                      title="Remove"
                      className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[var(--color-error-50)] hover:text-[#b42318] focus-visible:outline-2 focus-visible:outline-[var(--color-error-600)]"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" /><span className="sr-only xl:not-sr-only">Remove</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-foreground-muted">
                  No team members match these filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      </>
      )}

      <AdminConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => !open && setPendingRemove(null)}
        title="Remove team member"
        description={
          <>
            Remove <span className="font-semibold text-foreground">{pendingRemove?.name}</span>? They
            will be signed out immediately and can no longer sign in.
          </>
        }
        pending={pending}
        onConfirm={handleRemove}
      />

      <AdminConfirmDialog
        open={pendingRoleChange !== null}
        onOpenChange={(open) => !open && setPendingRoleChange(null)}
        title="Change role"
        description={
          pendingRoleChange ? (
            <>
              Change <span className="font-semibold text-foreground">{pendingRoleChange.user.name}</span>
              &apos;s role from{' '}
              <span className="font-semibold text-foreground">
                {userRoleLabel(pendingRoleChange.user, roles)}
              </span>{' '}
              to <span className="font-semibold text-foreground">{pendingRoleChange.role === PERSONAL_KEY ? pendingRoleChange.personal.label.trim() || PERSONAL_LABEL : roleLabelOf(pendingRoleChange.role, roles)}</span>?
              <span className="mt-2 block text-foreground-muted">
                {pendingRoleChange.role === PERSONAL_KEY ? null : roleDescription(pendingRoleChange.role, roles)}
              </span>
            </>
          ) : null
        }
        confirmLabel="Change role"
        tone="default"
        pending={pending}
        confirmDisabled={
          !!pendingRoleChange &&
          ((needsCentre(pendingRoleChange.role, roles, pendingRoleChange.personal) && !pendingRoleChange.centreSlug) ||
            (pendingRoleChange.role === PERSONAL_KEY && !personalComplete(pendingRoleChange.personal)))
        }
        onConfirm={confirmRoleChange}
      >
        {pendingRoleChange?.role === PERSONAL_KEY ? (
          <div className="mt-4">
            <PersonalAccessFields
              value={pendingRoleChange.personal}
              onChange={(personal) => setPendingRoleChange((prev) => (prev ? { ...prev, personal } : prev))}
            />
          </div>
        ) : null}
        {pendingRoleChange && needsCentre(pendingRoleChange.role, roles, pendingRoleChange.personal) ? (
          <label className="mt-4 flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Centre</span>
            {centres.length > 0 ? (
              <select
                className="admin-input"
                value={pendingRoleChange.centreSlug}
                onChange={(e) =>
                  setPendingRoleChange((prev) => (prev ? { ...prev, centreSlug: e.target.value } : prev))
                }
              >
                <option value="" disabled>
                  Select a centre…
                </option>
                {centres.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name} — {c.cityName}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-foreground-muted">Add a centre first, then assign this role.</p>
            )}
          </label>
        ) : null}
      </AdminConfirmDialog>

      <AdminConfirmDialog
        open={pendingDisable !== null}
        onOpenChange={(open) => !open && setPendingDisable(null)}
        title="Disable account"
        description={
          <>
            Disable <span className="font-semibold text-foreground">{pendingDisable?.name}</span>? They
            won&apos;t be able to sign in until reactivated.
          </>
        }
        confirmLabel="Disable"
        pendingLabel="Disabling…"
        pending={pending}
        onConfirm={confirmDisable}
      />

      <ResetPasswordDialog
        user={resetPasswordFor}
        onOpenChange={(open) => !open && setResetPasswordFor(null)}
        onDone={(msg) => {
          setMessage(msg);
          setResetPasswordFor(null);
        }}
      />
    </div>
  );
}

function ResetPasswordDialog({
  user,
  onOpenChange,
  onDone,
}: {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  onDone: (message: string) => void;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    if (!user) return;
    setError(null);
    start(async () => {
      const result = await adminResetPassword(user.id, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPassword('');
      onDone(
        `Password reset for ${user.name}. ${
          result.email === 'sent'
            ? `The new password was emailed to ${user.email}.`
            : result.email === 'failed'
              ? 'The email could not be sent — share the password with them directly.'
              : 'Email is not set up — share the password with them directly.'
        }`,
      );
    });
  }

  return (
    <Dialog.Root
      open={user !== null}
      onOpenChange={(open) => {
        if (!open) setPassword('');
        onOpenChange(open);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="text-lg font-semibold text-foreground">Reset password</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            Set a new password for <span className="font-semibold text-foreground">{user?.name}</span>.
            They&apos;ll need it next time they sign in.
          </Dialog.Description>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min. 10 characters)"
            className="admin-input mt-4"
          />
          {error ? <p className="mt-2 text-sm font-medium text-[var(--color-error-600)]">{error}</p> : null}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="h-10 cursor-pointer rounded-[var(--admin-radius)] border border-border px-4 text-sm font-semibold text-foreground-secondary transition-colors hover:border-border-strong hover:text-foreground"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              disabled={pending || password.length < 10}
              onClick={submit}
              className="adm-btn-primary font-bold min-h-11 cursor-pointer rounded-[var(--admin-radius)] px-4 text-sm disabled:opacity-45"
            >
              {pending ? 'Saving…' : 'Set password'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
