'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { siteCopy, type SiteCopy } from '@/lib/content/copy/pages/site';

/**
 * The site-wide copy (`site` page text) for client components — the header, the enquiry forms, the
 * mobile bar. The root layout loads it on the server and mounts this; the defaults are the context
 * default, so a component rendered outside the provider still shows the shipped wording.
 */
const SiteCopyContext = createContext<SiteCopy>(siteCopy.defaults);

export function SiteCopyProvider({ copy, children }: { copy: SiteCopy; children: ReactNode }) {
  return <SiteCopyContext.Provider value={copy}>{children}</SiteCopyContext.Provider>;
}

export function useSiteCopy(): SiteCopy {
  return useContext(SiteCopyContext);
}
