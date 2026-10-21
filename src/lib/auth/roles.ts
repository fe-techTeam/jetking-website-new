/**
 * Pure constants — no `server-only` import, no DB driver — so client
 * components (the Team & Access table's role `<select>`) can import this
 * directly without pulling `users.ts` (and `pg`) into the browser bundle.
 */
export const ROLES = ['admin', 'editor', 'centre_staff'] as const;
export type Role = (typeof ROLES)[number];

/** What `admin_users.role` can hold: a built-in preset, or `custom` (the permissions then come from the user's custom role). */
export type UserRole = Role | 'custom';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  editor: 'Editor',
  centre_staff: 'Centre staff',
};

/** One-line capability summary shown when inviting or changing roles. */
export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: 'Full panel access — content, leads, team invites, audit log.',
  editor: 'Edit website content and all leads. Cannot manage team accounts.',
  centre_staff: 'Leads for one centre only. No content editors.',
};

/**
 * The parts of the panel a role can be given. Team accounts, the audit log, the legal pages and "reset content"
 * are deliberately NOT sections: they stay admin-only, so no custom role can ever grant itself more power.
 */
export const SECTIONS = ['content', 'leads', 'media', 'seo', 'redirects', 'chatbot'] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABEL: Record<Section, string> = {
  content: 'Website content',
  leads: 'Leads',
  media: 'Media library',
  seo: 'SEO',
  redirects: 'Redirects',
  chatbot: 'Chatbot',
};

export const SECTION_HINT: Record<Section, string> = {
  content: 'Courses, centres, blog, pages, FAQs, announcements and the other content editors (not the legal pages).',
  leads: 'The enquiries inbox: view, update status, notes and assignment.',
  media: 'Upload and manage images and files.',
  seo: 'SEO overview and per-page search settings.',
  redirects: 'URL redirects.',
  chatbot: 'Assistant settings, answers, policies and unanswered questions.',
};

export type AccessLevel = 'none' | 'view' | 'edit';
export const ACCESS_LEVELS: readonly AccessLevel[] = ['none', 'view', 'edit'];
export type Access = Record<Section, AccessLevel>;

/** Whether a member sees every lead, or only their own centre's. */
export type LeadScope = 'all' | 'centre';

const RANK: Record<AccessLevel, number> = { none: 0, view: 1, edit: 2 };

function uniform(level: AccessLevel): Access {
  return { content: level, leads: level, media: level, seo: level, redirects: level, chatbot: level };
}

/** What each built-in role can do — the same rules the panel enforced before custom roles existed. */
export function presetAccess(role: Role): Access {
  if (role === 'admin' || role === 'editor') return uniform('edit');
  if (role === 'centre_staff') return { ...uniform('none'), leads: 'edit' };
  return uniform('none'); // an unrecognised role string grants nothing
}

/** Clamps anything (database JSON, a form) to a complete, valid access map; unknown sections/levels become `none`. */
export function normalizeAccess(input: unknown): Access {
  const out = uniform('none');
  if (input && typeof input === 'object') {
    for (const section of SECTIONS) {
      if (!Object.hasOwn(input, section)) continue;
      const value = (input as Record<string, unknown>)[section];
      if (value === 'view' || value === 'edit') out[section] = value;
    }
  }
  return out;
}

export function hasAccess(access: Access, section: Section, level: Exclude<AccessLevel, 'none'>): boolean {
  return RANK[access[section]] >= RANK[level];
}

export function normalizeLeadScope(value: unknown): LeadScope {
  return value === 'centre' ? 'centre' : 'all';
}
