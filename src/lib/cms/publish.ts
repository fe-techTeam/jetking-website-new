import { revalidatePath } from 'next/cache';

/**
 * Called after Admin CMS publish. Invalidates ISR surfaces.
 */
export async function publishContent(opts?: { paths?: string[] }): Promise<void> {
  const paths = opts?.paths ?? ['/', '/courses', '/centres', '/blog', '/faq', '/placements', '/admin'];
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // ignore outside request context
    }
  }
}
