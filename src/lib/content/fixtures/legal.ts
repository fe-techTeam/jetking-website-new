import type { LegalDoc } from '../types';
import privacy from '@/lib/legal/privacy-policy.json';
import terms from '@/lib/legal/terms-conditions.json';
import enrollment from '@/lib/legal/enrollment-terms.json';

/**
 * Legal documents, copied from jetking.com. The JSON keeps each page's wording as published; only
 * layout was cleaned up (real headings and lists, tables typed out instead of screenshots). Each file
 * records the page it came from in `sourceUrl`.
 *
 * These are the in-repo DEFAULTS: they seed the CMS (`legal_documents`) and are what a legal page falls
 * back to when its CMS record is missing or unpublished. The live wording is edited in the admin.
 */
export const legalDefaults: LegalDoc[] = [privacy as LegalDoc, terms as LegalDoc, enrollment as LegalDoc];
