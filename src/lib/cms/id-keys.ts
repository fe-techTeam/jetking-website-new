import type { CmsCollection } from './types';

/** Which field identifies a record in each collection (a `slug` for page-like records, an `id` otherwise). */
export const CMS_ID_KEYS: Record<CmsCollection, 'slug' | 'id'> = {
  courses: 'slug',
  cities: 'slug',
  centres: 'slug',
  posts: 'slug',
  faqs: 'id',
  policies: 'slug',
  faculty: 'slug',
  placements: 'id',
  trust_signals: 'id',
  homepage_variants: 'id',
  persona_rules: 'id',
  about_page: 'id',
  placements_page: 'id',
  investors_page: 'id',
  legal_documents: 'slug',
  logo_lists: 'id',
  page_copy: 'id',
  announcements: 'id',
};
