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
    '/franchise',
    '/privacy-policy',
    '/terms-conditions',
    '/enrollment-terms-and-conditions',
    '/chatbot',
    '/faq',
    '/sitemap',
    '/account',
    '/admin',
  ];
  for (const p of paths) {
    try {
      revalidatePath(p);
    } catch {
      // ignore outside request context
    }
  }
  // Page text and chatbot Availability change chrome site-wide (header, Ask links, layout provider).
  try {
    revalidatePath('/', 'layout');
  } catch {
    // ignore outside request context
  }
  // Centre pages (/centres/{slug}) are a dynamic route too: refresh them when a centre or city changes.
  try {
    revalidatePath('/centres/[city]', 'page');
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
