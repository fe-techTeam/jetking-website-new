'use server';

import { requireAccess } from '../actions';
import { recordAudit } from '@/lib/audit/log';
import { deleteMedia, listMedia, saveMedia, updateMediaAlt, type MediaItem } from '@/lib/media/store';

export async function uploadMedia(formData: FormData): Promise<{ items: MediaItem[]; errors: string[] }> {
  const user = await requireAccess('media', 'edit');
  const items: MediaItem[] = [];
  const errors: string[] = [];
  for (const entry of formData.getAll('files')) {
    if (!(entry instanceof File)) continue;
    const result = await saveMedia({ name: entry.name, bytes: Buffer.from(await entry.arrayBuffer()) }, user.name);
    if (result.ok) {
      items.push(result.item);
      void recordAudit(user, 'media.upload', 'media', result.item.id, `Uploaded ${result.item.filename}`);
    } else errors.push(result.error);
  }
  return { items, errors };
}

export async function getMediaLibrary(): Promise<MediaItem[]> {
  await requireAccess('media', 'view');
  return listMedia();
}

export async function setMediaAlt(id: string, alt: string): Promise<void> {
  await requireAccess('media', 'edit');
  await updateMediaAlt(id, alt);
}

export async function removeMedia(id: string): Promise<void> {
  const user = await requireAccess('media', 'edit');
  await deleteMedia(id);
  void recordAudit(user, 'media.delete', 'media', id, 'Deleted a media file');
}
