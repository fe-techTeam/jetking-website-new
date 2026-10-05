import type {
  AboutPageContent,
  Leader,
  Milestone,
  PlacementsPageContent,
  PlacementsPageRecord,
} from './types';
import { aboutDefaults } from './fixtures/about';
import { placementsDefaults } from './fixtures/placements-page';

/**
 * Shape a stored About/Placements record into what the page components expect.
 *
 * The admin form can only submit "empty" values for optional fields ('' instead of absent, an empty
 * link object, an empty bio list). Pages decide what to render from presence — a leader with no
 * `photoUrl` gets an initials avatar, a milestone with no `link` shows none — so empties are folded
 * back into "absent" here, once, for both content sources.
 */
const text = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

function cleanLeader(leader: Leader): Leader {
  const bio = (leader.bio ?? []).map((p) => p.trim()).filter(Boolean);
  return {
    name: leader.name.trim(),
    role: text(leader.role),
    photoUrl: text(leader.photoUrl),
    bio: bio.length > 0 ? bio : undefined,
  };
}

function cleanMilestone(m: Milestone): Milestone {
  const href = text(m.link?.href);
  const label = text(m.link?.label);
  return {
    year: m.year.trim(),
    title: m.title.trim(),
    body: text(m.body),
    link: href && label ? { href, label } : undefined,
  };
}

export function normalizeAbout(record: AboutPageContent): AboutPageContent {
  return {
    ...record,
    directors: record.directors.map(cleanLeader),
    managementTeam: record.managementTeam.map(cleanLeader),
    timeline: record.timeline.map(cleanMilestone),
    values: record.values.map((v) => v.trim()).filter(Boolean),
  };
}

export function normalizePlacements(record: PlacementsPageRecord): PlacementsPageContent {
  const phone = record.contact.phone.trim();
  return {
    ...record,
    contact: { phone, tel: `tel:${phone.replace(/\s+/g, '')}`, email: record.contact.email.trim() },
    offerLetters: record.offerLetters.map((letter) => ({
      ...letter,
      alt: `Sample offer letter for a ${letter.title}, for illustration only`,
    })),
  };
}

/** The in-repo copy, shaped exactly like a CMS record that was published unchanged. */
export const aboutFallback = (): AboutPageContent => normalizeAbout(aboutDefaults);
export const placementsFallback = (): PlacementsPageContent => normalizePlacements(placementsDefaults);
