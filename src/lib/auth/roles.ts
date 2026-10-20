/**
 * Pure constants — no `server-only` import, no DB driver — so client
 * components (the Team & Access table's role `<select>`) can import this
 * directly without pulling `users.ts` (and `pg`) into the browser bundle.
 */
export const ROLES = ['admin', 'editor', 'centre_staff'] as const;
export type Role = (typeof ROLES)[number];

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
