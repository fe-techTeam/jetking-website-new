/**
 * Shapes shared by the site's account client and its API routes. Pure types —
 * no `server-only`, no DB driver — so client components can import this.
 */

export interface SiteUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  /** State name, e.g. "Gujarat". Null for accounts created before location was collected. */
  state: string | null;
  /** City slug, e.g. "ahmedabad". */
  city: string | null;
  /** Centre slug the person prefers, if they picked one. */
  centre: string | null;
}
