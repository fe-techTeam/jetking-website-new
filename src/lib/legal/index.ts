/**
 * The legal pages' wording is CMS content now (`legal_documents`, read through
 * `content.getLegalDocument(slug)`); the JSON in this folder is only the default copy that seeds the CMS
 * and is served if a record is missing or unpublished (see `content/fixtures/legal.ts`). What stays in
 * code here is the cross-link list and the document shape.
 */
export type { LegalBlock, LegalDoc } from '@/lib/content/types';

/** Footer / cross-link entries, in the order they read best. */
export const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-conditions' },
  { label: 'Enrollment Terms', href: '/enrollment-terms-and-conditions' },
] as const;
