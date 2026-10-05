import { revalidatePath } from 'next/cache';

/**
 * Called after Admin CMS publish. Invalidates ISR surfaces.
 */
export async function publishContent(opts?: { paths?: string[] }): Promise<void> {
  const paths = opts?.paths ?? [
    '/',
    '/courses',
    '/centres',
    '/blog',
    '/faq',
    '/placements',
    '/about-us',
    '/explore',
    '/student',
    '/parent',
    '/professional',
    '/franchise',
    '/privacy-policy',
    '/terms-conditions',
    '/enrollment-terms-and-conditions',
    '/admin',
  ];
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // ignore outside request context
    }
  }
  // Page text can change copy anywhere (including the header and footer), so refresh the whole site.
  try {
    revalidatePath('/', 'layout');
  } catch {
    // ignore outside request context
  }
  // Every course page shows the placement figures, process and recruiter logos, so a Placements-page
  // save has to refresh them too (a dynamic route needs its pattern, not a concrete path).
  try {
    revalidatePath('/courses/[slug]', 'page');
  } catch {
    // ignore outside request context
  }
}
