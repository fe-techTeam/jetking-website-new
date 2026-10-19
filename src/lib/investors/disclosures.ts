import data from './disclosures.json';

interface DisclosureItem {
  label: string;
  href: string;
}

export interface DisclosureSection {
  id: string;
  title: string;
  items: DisclosureItem[];
}

interface DisclosureData {
  source: string;
  /** ISO date the lists were last pulled from jetking.com/investors. */
  syncedAt: string;
  links: { stockLive?: string; latestNews?: string; boardOfDirectors?: string };
  sections: DisclosureSection[];
}

/**
 * Live-site pages that now exist on this site. The sync copies live URLs as they are; the live
 * /board-of-directors page is placeholder text, so the row points at the real leadership section.
 */
const OWN_PAGES: Record<string, string> = {
  'https://www.jetking.com/board-of-directors': '/about-us#about-leaders',
};

const own = (href: string) => OWN_PAGES[href] ?? href;
const raw = data as DisclosureData;

/** Document lists synced from jetking.com/investors — regenerate with `npm run sync:investors`. */
export const disclosures: DisclosureData = {
  ...raw,
  links: { ...raw.links, boardOfDirectors: raw.links.boardOfDirectors ? own(raw.links.boardOfDirectors) : undefined },
  sections: raw.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item, href: own(item.href) })),
  })),
};

/** What kind of target a row links to — the file type when the URL gives it away. The page maps it to the button's wording (`docs.link.*` copy). */
export function linkKind(href: string): 'page' | 'pdf' | 'drive' | 'other' {
  if (href.startsWith('/')) return 'page';
  if (/\.pdf($|\?)/i.test(href)) return 'pdf';
  if (/drive\.google\.com\/file/i.test(href)) return 'drive';
  return 'other';
}
