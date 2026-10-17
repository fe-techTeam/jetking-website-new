'use server';

import { getCurrentUser } from '../actions';
import { getUserById, isDatabaseConfigured, resetUserPassword } from '@/lib/auth/users';
import { verifyPassword } from '@/lib/auth/password';
import { recordAudit } from '@/lib/audit/log';

export interface PasswordChangeState {
  ok: boolean;
  error: string | null;
}

export async function changeOwnPassword(
  _prev: PasswordChangeState,
  formData: FormData,
): Promise<PasswordChangeState> {
  const me = await getCurrentUser();
  if (!me) return { ok: false, error: 'Your session has expired. Sign in again.' };
  if (!isDatabaseConfigured()) {
    return { ok: false, error: 'Password changes are only available with individual accounts.' };
  }

  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!current) return { ok: false, error: 'Enter your current password.' };
  if (next.length < 10) return { ok: false, error: 'The new password must be at least 10 characters.' };
  if (next !== confirm) return { ok: false, error: 'The new password and its confirmation do not match.' };
  if (next === current) return { ok: false, error: 'Choose a password different from the current one.' };

  const row = await getUserById(me.id);
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return { ok: false, error: 'Your current password is incorrect.' };
  }

  await resetUserPassword(me.id, next);
  await recordAudit(me, 'team.password_change', 'user', me.id, `${me.name} changed their own password`);
  return { ok: true, error: null };
}
