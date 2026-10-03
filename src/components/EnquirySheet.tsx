'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { EnquiryModal, type EnquiryCentre } from '@/components/EnquiryModal';
import { track } from '@/lib/analytics';

/**
 * One enquiry sheet for the whole site. Any "Talk to a counsellor / Enquire now" call to action
 * opens it in place (bottom sheet on phones) so the learner never leaves the page they were reading.
 * `EnquiryLink` keeps a real `/enquiry` href, so it still works without JavaScript and for crawlers.
 */
const EnquiryContext = createContext<((source: string) => void) | null>(null);

export function EnquirySheetProvider({
  centres,
  children,
}: {
  centres: EnquiryCentre[];
  children: React.ReactNode;
}) {
  const [source, setSource] = useState<string | null>(null);
  const open = useCallback((s: string) => {
    track('enquiry_started', { surface: s });
    setSource(s);
  }, []);
  const value = useMemo(() => open, [open]);

  return (
    <EnquiryContext.Provider value={value}>
      {children}
      <EnquiryModal open={source !== null} onClose={() => setSource(null)} centres={centres} source={source ?? 'sheet'} />
    </EnquiryContext.Provider>
  );
}

type LinkProps = Omit<ComponentProps<typeof Link>, 'href'>;

export function EnquiryLink({
  source,
  onClick,
  ...props
}: LinkProps & {
  /** Which surface opened the sheet, recorded with the lead, e.g. `student-hero`. */
  source: string;
}) {
  const open = useContext(EnquiryContext);
  return (
    <Link
      {...props}
      href="/enquiry"
      aria-haspopup={open ? 'dialog' : undefined}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          !open ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        )
          return;
        event.preventDefault();
        open(source);
      }}
    />
  );
}
