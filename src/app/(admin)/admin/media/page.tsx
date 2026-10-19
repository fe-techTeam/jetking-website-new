import { requireRole } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { isDatabaseConfigured } from '@/lib/db/client';
import { listMedia } from '@/lib/media/store';
import { MediaGrid } from './MediaLibrary';

export const metadata = { title: 'Media library | Jetking Admin' };

export default async function MediaPage() {
  await requireRole(['admin', 'editor']);
  const items = await listMedia();

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Media"
        title="Media library"
        description="Upload images and PDFs once, then pick them in any image field. Copy a file’s URL to use it anywhere."
      />
      <div className="mt-6">
        {isDatabaseConfigured() ? (
          <MediaGrid initial={items} />
        ) : (
          <p className="adm-card p-5 text-sm text-foreground-secondary">The media library stores files in the database — set DATABASE_URL to enable it.</p>
        )}
      </div>
    </div>
  );
}
