import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requireRole } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { isDatabaseConfigured } from '@/lib/db/client';
import { listRedirects } from './actions';
import { RedirectsManager } from './RedirectsManager';

export const metadata = { title: 'Redirects | Jetking Admin' };

function staticRedirectCount(): number {
  try {
    const parsed = JSON.parse(readFileSync(join(process.cwd(), 'redirects.json'), 'utf8')) as unknown;
    return Array.isArray(parsed) ? parsed.length : Object.keys(parsed as object).length;
  } catch {
    return 0;
  }
}

export default async function RedirectsPage() {
  await requireRole(['admin', 'editor']);
  const items = await listRedirects();

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="SEO"
        title="Redirects"
        description="Send an old or retired URL to its replacement without a deploy. Takes effect within about 30 seconds."
      />
      {isDatabaseConfigured() ? (
        <RedirectsManager initial={items} staticCount={staticRedirectCount()} />
      ) : (
        <p className="adm-card mt-6 p-5 text-sm text-foreground-secondary">Managed redirects are stored in the database — set DATABASE_URL to enable them.</p>
      )}
    </div>
  );
}
