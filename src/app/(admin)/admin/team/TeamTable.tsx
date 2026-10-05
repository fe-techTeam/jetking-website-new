'use client';

import { useRef, useState, useTransition, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  inviteUser,
  changeUserRole,
  toggleUserStatus,
  adminResetPassword,
  removeUser,
} from './actions';
import { ROLES, ROLE_LABEL, type Role } from '@/lib/auth/roles';
import type { AdminUser } from '@/lib/db/schema';
import type { CentreOption } from '@/lib/leads/centre-scope';
import { AdminConfirmDialog } from '../AdminConfirmDialog';
import { FilterChip } from '../FilterChip';

function formatDate(value: Date | string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function TeamTable({ initialUsers, centres }: { initialUsers: AdminUser[]; centres: CentreOption[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteRole, setInviteRole] = useState<Role>('editor');
  const [pendingRemove, setPendingRemove] = useState<AdminUser | null>(null);
  const [pendingRoleChange, setPendingRoleChange] = useState<{ user: AdminUser; role: Role } | null>(null);
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
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
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
      setMessage(`Invited ${result.user.name}.`);
      setShowInvite(false);
      formRef.current?.reset();
    });
  }

  function handleRoleChange(user: AdminUser, role: Role, centreSlug: string) {
    start(async () => {
      const result = await changeUserRole(user.id, role, centreSlug);
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
    const { user, role } = pendingRoleChange;
    start(async () => {
      const result = await changeUserRole(user.id, role, user.centreSlug ?? '');
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
            Who can sign in, and what they can touch. Centre staff only see their own centre&apos;s
            leads.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowInvite((v) => !v)}
          className="adm-btn-primary font-bold inline-flex h-11 shrink-0 cursor-pointer items-center rounded-[var(--admin-radius)] px-5 text-sm"
        >
          {showInvite ? 'Cancel' : '+ Invite'}
        </button>
      </div>

      {showInvite ? (
        <form
          ref={formRef}
          onSubmit={handleInvite}
          className="mt-8 grid gap-4 adm-card p-5 sm:grid-cols-2"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Name</span>
            <input name="name" required className="admin-input" placeholder="Full name" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Email</span>
            <input name="email" type="email" required className="admin-input" placeholder="name@jetking.example" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Temporary password</span>
            <input name="password" type="text" required minLength={8} className="admin-input" placeholder="At least 8 characters" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="label-mono">Role</span>
            <select
              name="role"
              className="admin-input"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          {inviteRole === 'centre_staff' ? (
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
              disabled={pending}
              className="adm-btn-primary font-bold inline-flex h-11 cursor-pointer items-center rounded-[var(--admin-radius)] px-6 text-sm disabled:opacity-45"
            >
              {pending ? 'Inviting…' : 'Create account'}
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
            {ROLES.map((r) => (
              <FilterChip
                key={r}
                active={roleFilter === r}
                onClick={() => setRoleFilter((prev) => (prev === r ? 'all' : r))}
              >
                {ROLE_LABEL[r]}
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
        <table className="adm-table w-full min-w-[62rem] border-collapse text-sm">
          <thead>
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
              <tr key={user.id} className="border-b border-border last:border-none">
                <td className="px-4 py-3">
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
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    disabled={pending}
                    onChange={(e) => {
                      const role = e.target.value as Role;
                      if (role === user.role) return;
                      setPendingRoleChange({ user, role });
                    }}
                    className="admin-input h-9 w-auto py-0 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {user.role === 'centre_staff' ? (
                    <select
                      value={user.centreSlug ?? ''}
                      disabled={pending}
                      onChange={(e) => handleRoleChange(user, 'centre_staff', e.target.value)}
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
                <td className="px-4 py-3">
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
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                    {user.status}
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                  {formatDate(user.lastActiveAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setResetPasswordFor(user)}
                      className="min-h-11 cursor-pointer rounded-[10px] px-3 text-sm font-semibold text-foreground-secondary transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-[var(--focus-ring)]"
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRemove(user)}
                      className="min-h-11 cursor-pointer rounded-[10px] px-3 text-sm font-semibold text-foreground-muted transition-colors hover:bg-[var(--color-error-50)] hover:text-[#b42318] focus-visible:outline-2 focus-visible:outline-[var(--color-error-600)]"
                    >
                      Remove
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
                {ROLE_LABEL[pendingRoleChange.user.role as Role]}
              </span>{' '}
              to <span className="font-semibold text-foreground">{ROLE_LABEL[pendingRoleChange.role]}</span>?
            </>
          ) : null
        }
        confirmLabel="Change role"
        tone="default"
        pending={pending}
        onConfirm={confirmRoleChange}
      />

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
      onDone(`Password reset for ${user.name}.`);
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
            placeholder="New password (min. 8 characters)"
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
              disabled={pending || password.length < 8}
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
