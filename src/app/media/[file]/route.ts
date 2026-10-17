import { getMediaBytes, MEDIA_TYPES } from '@/lib/media/store';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Serves an uploaded media-library file. The id is a UUID, so a URL never changes meaning: cache it hard. */
export async function GET(_req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const id = file.replace(/\.[a-z0-9]+$/i, '');
  if (!UUID.test(id)) return new Response('Not found', { status: 404 });
  const asset = await getMediaBytes(id);
  if (!asset || !(asset.mime in MEDIA_TYPES)) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(asset.data), {
    headers: {
      'Content-Type': asset.mime,
      'Content-Length': String(asset.data.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `inline; filename="${asset.filename.replace(/"/g, '')}"`,
    },
  });
}
