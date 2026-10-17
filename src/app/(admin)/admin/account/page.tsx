import { requireRole } from '../actions';
import { isDatabaseConfigured, ROLE_LABEL } from '@/lib/auth/users';
import { ChangePasswordForm } from './ChangePasswordForm';

export const metadata = { title: 'My account · Jetking Admin' };

export default async function AdminAccountPage() {
  const user = await requireRole(['admin', 'editor', 'centre_staff']);
  const multiUser = isDatabaseConfigured();

  return (
    <div>
      <p className="adm-eyebrow">account</p>
      <h1 className="adm-title mt-3">My account</h1>
      <p className="adm-lede mt-3">
        {user.name} · {user.email} · {ROLE_LABEL[user.role]}
      </p>

      <section className="adm-card mt-8 p-6">
        <h2 className="text-base font-bold text-foreground">Change password</h2>
        {multiUser ? (
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        ) : (
          <p className="mt-3 max-w-xl text-sm text-foreground-secondary">
            This deployment uses a single shared admin password (<code>ADMIN_PASSWORD</code>) rather than
            individual accounts, so there is no personal password to change here. Set{' '}
            <code>DATABASE_URL</code> to switch to individual accounts.
          </p>
        )}
      </section>
    </div>
  );
}
