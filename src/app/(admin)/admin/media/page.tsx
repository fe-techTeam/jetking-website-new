import { requireAccess } from '../actions';
import { AdminPageHeader } from '../AdminPageHeader';
import { isDatabaseConfigured } from '@/lib/db/client';
import { listMedia } from '@/lib/media/store';
import { MediaGrid } from './MediaLibrary';

export const metadata = { title: 'Media library | Jetking Admin' };

export default async function MediaPage() {
  await requireAccess('media', 'view');
  const items = await listMedia();

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        eyebrow="Media"
        title="Media library"
        description="Upload your own images and PDFs, or browse the images already on the website. Pick any of them in an image field."
      />
      <div className="mt-6">
        <MediaGrid initial={items} uploadsEnabled={isDatabaseConfigured()} />
      </div>
    </div>
  );
}
