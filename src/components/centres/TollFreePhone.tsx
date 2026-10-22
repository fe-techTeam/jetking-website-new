'use client';

import { useSiteCopy } from '@/components/providers/site-copy';
import { TrackedAnchor } from '@/components/TrackedAnchor';

/** The national toll-free number (Page text → Site → Toll-free Call number) as a tap-to-call link. */
export function TollFreePhone({ centreSlug, className }: { centreSlug: string; className?: string }) {
  const phone = useSiteCopy()['contact.phone'];
  if (!phone) return null;
  return (
    <TrackedAnchor
      href={`tel:${phone.replace(/[^\d+]/g, '')}`}
      event="phone_clicked"
      props={{ centre_slug: centreSlug, type: 'toll-free' }}
      className={className}
    >
      {phone}
    </TrackedAnchor>
  );
}
