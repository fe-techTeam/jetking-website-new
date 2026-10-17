'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Public chrome gate.
 *
 *   · /admin, /chatbot — no header, footer, or Guide
 *
 * Everywhere else — including `/` — renders the header and Guide.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin') || pathname.startsWith('/chatbot')) return null;
  return <>{children}</>;
}

/**
 * Footer-specific chrome gate — same admin/chatbot exclusion as SiteChrome.
 *
 * `/` used to be excluded too: the homepage was a full-viewport hero (see HomeHero)
 * designed to end at the fold. It now continues into a full section stack
 * (`HomeSections`, `sections/`) below that hero, so it hands off into the footer like
 * every other route.
 */
export function FooterChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin') || pathname.startsWith('/chatbot')) return null;
  return <>{children}</>;
}
