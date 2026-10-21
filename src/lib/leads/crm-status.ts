/**
 * Shared CRM hand-off status helpers for the admin panel and reconcile path.
 * Safe for client components (no server-only imports).
 *
 * Matched = this panel enquiry was saved as its own CRM entry (`routed`).
 * `duplicate` means the CRM API rejected the save (unique mobile today) — the
 * panel row may still need a separate CRM entry (other centre/course), so it
 * stays eligible for retry once the CRM allows multi-entry for the same number.
 */

/** This panel enquiry was successfully created in the CRM. */
export const CRM_MATCHED_STATUSES = ['routed'] as const;

/** Not yet saved as its own CRM entry — eligible for reconcile / push. */
export const CRM_UNMATCHED_STATUSES = ['none', 'failed', 'rejected', 'skipped', 'duplicate'] as const;

export type CrmMatchedStatus = (typeof CRM_MATCHED_STATUSES)[number];
export type CrmUnmatchedStatus = (typeof CRM_UNMATCHED_STATUSES)[number];

export function isCrmMatched(crmStatus: string): boolean {
  return (CRM_MATCHED_STATUSES as readonly string[]).includes(crmStatus);
}

/** True when the panel row should be pushed (or re-pushed) to the CRM. */
export function needsCrmPush(crmStatus: string): boolean {
  return !isCrmMatched(crmStatus);
}
