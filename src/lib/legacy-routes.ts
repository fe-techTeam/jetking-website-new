/**
 * Legacy URL aliases from jetking.com → new site routes.
 *
 * Reviewed 1:1 mappings only — no wildcard-to-homepage redirects (see DEVELOPMENT-PLAN §6).
 * Merged into next.config.ts alongside redirects.json at build time.
 */
export interface LegacyRedirect {
  source: string;
  destination: string;
  permanent?: boolean;
}

/** Navigation and section aliases that differ on the live site. */
const legacyNavRedirects: LegacyRedirect[] = [
  { source: '/our-courses', destination: '/courses', permanent: true },
  { source: '/our-courses/:path*', destination: '/courses/:path*', permanent: true },
  { source: '/contact-us', destination: '/enquiry', permanent: true },
  { source: '/faqs', destination: '/faq', permanent: true },
  { source: '/student-faqs', destination: '/faq', permanent: true },
  /** Singular — older links and ads sometimes use this form. */
  { source: '/centre/:slug', destination: '/centres/:slug', permanent: true },
  /** WordPress blog posts shipped with .html extensions. */
  { source: '/blog/:slug.html', destination: '/blog/:slug', permanent: true },
  { source: '/sitemap-xml', destination: '/sitemap.xml', permanent: true },
];

/**
 * Root-level course landing pages from the live site.
 * Each maps to the nearest equivalent programme in the new catalogue.
 */
const legacyCourseLandings: LegacyRedirect[] = [
  {
    source: '/diploma-in-cloud-computing-and-cyber-security',
    destination: '/courses/cloud-cyber-security-professional',
    permanent: true,
  },
  {
    source: '/masters-in-blockchain-course-registration-page',
    destination: '/courses',
    permanent: true,
  },
  {
    source: '/masters-in-blockchain-development-course-brochure',
    destination: '/courses',
    permanent: true,
  },
  {
    source: '/courses/diploma-cloud-computing-cyber-security',
    destination: '/courses/cloud-cyber-security-professional',
    permanent: true,
  },
  /*
   * `/courses/aws-solution-specialist` used to redirect to a placeholder course
   * slug. The real catalogue now has an actual `aws-solution-specialist`
   * course, so the legacy URL and the live route are the same string — no
   * redirect needed; removing the entry lets the real page serve directly.
   */
  {
    source: '/courses/red-hat-certification-rhcsa',
    destination: '/courses/red-hat-professional',
    permanent: true,
  },
  {
    source: '/courses/microsoft-server-technology-specialist-mcts',
    destination: '/courses/microsoft-server-specialist',
    permanent: true,
  },
  {
    source: '/courses/mcts-windows-10',
    destination: '/courses/windows-10-specialist',
    permanent: true,
  },
  {
    source: '/courses/mbd',
    destination: '/courses',
    permanent: true,
  },
];

const permanent = (pairs: [string, string][]): LegacyRedirect[] =>
  pairs.map(([source, destination]) => ({ source, destination, permanent: true }));

/**
 * Live-site landing pages (some are ClickFunnels brochure sign-up funnels) that map cleanly to a
 * programme in the new catalogue. Found by requesting every URL in the live sitemap.
 */
const legacyProgrammeLandings: LegacyRedirect[] = permanent([
  ['/bca-degree-in-cloud-computing-cyber-security', '/courses/bca-cloud-cyber-security'],
  ['/bca-cloud-computing-cyber-security-brochure-signup', '/courses/bca-cloud-cyber-security'],
  ['/bca-cloud-computing-cyber-security-brochure-mumbai-signup', '/courses/bca-cloud-cyber-security'],
  ['/mca-in-cloud-computing-cyber-security-master-degree', '/courses/mca-cloud-cyber-security'],
  ['/mca-in-cloud-computing-cyber-security-brochure-signup', '/courses/mca-cloud-cyber-security'],
  ['/program/bca-in-multimedia-and-animation', '/courses/bca-multimedia-animation'],
  ['/bca-multimedia-animation-brochure-signup-page', '/courses/bca-multimedia-animation'],
  ['/animation-graphics-metaverse-design-course', '/courses/gaming-metaverse-design'],
  ['/courses/masters-in-gaming-metaverse', '/courses/gaming-metaverse-design'],
  ['/metaverse-course--67d25', '/courses/gaming-metaverse-design'],
  ['/metaverse-course-brochure-signup', '/courses/gaming-metaverse-design'],
  ['/courses/networking-essentials-specialist', '/courses/networking-essentials'],
  ['/networking-essentials-specialist', '/courses/networking-essentials'],
  ['/courses/digital-marketing-training', '/courses/digital-marketing'],
  ['/courses/best-data-analytics-course', '/courses/data-analyst'],
  ['/data-analyst-professional-program', '/courses/data-analyst'],
  /*
   * Judgement calls: the live page is a "Masters" or AI-branded cloud programme and the new
   * catalogue has no page of that exact name. These go to the closest programme.
   */
  ['/masters-in-cloud-computing-cyber-security-brochure-signup', '/courses/cloud-cyber-security-engineer'],
  ['/courses/master-cloud-computing-cyber-security', '/courses/cloud-cyber-security-engineer'],
  ['/courses/masters-cloud-computing-artificial-intelligence-course', '/courses/cloud-computing-engineer-ai'],
  ['/courses/cloud-computing-and-cloud-ai-certification-training', '/courses/cloud-computing-professional-ai'],
  /* Programmes the new catalogue does not offer (yet): the catalogue is the honest landing page. */
  ['/program/bca-in-data-science-degree', '/courses'],
  ['/bca-data-science-brochure-signup-page', '/courses'],
  ['/courses/best-semiconductor-chip-design-courses', '/courses'],
  ['/diploma-in-fintech', '/courses'],
  ['/graphics-design-and-audio-video-editor', '/courses'],
  ['/motion-graphics-and-animation-professional', '/courses'],
  ['/masters-in-blockchain-development--5da35', '/courses'],
]);

/** Company and utility pages that exist under another name on the new site. */
const legacyCompanyPages: LegacyRedirect[] = permanent([
  ['/franchise-opportunities', '/franchise'],
  ['/core-plus', '/franchise'],
  ['/coreplus-brochure-signup', '/franchise'],
  ['/corporate-training', '/franchise'],
  ['/institution-alliance', '/franchise'],
  ['/board-of-directors', '/about-us'],
  ['/jetking-reviews', '/placements'],
  ['/sitemap-html', '/sitemap'],
]);

/**
 * The live blog had category archives at `/blog/{category}`. The new blog filters by category on
 * `/blog` instead, so those URLs go to the blog index (never to the homepage).
 */
const legacyBlogArchives: LegacyRedirect[] = [
  'uncategorized',
  'blockchain',
  'cloud-computing',
  'digital-marketing',
  'ethical-hacking',
  'emerging-technology',
  'technology',
  'getting-started-with-your-blog',
].map((slug) => ({ source: `/blog/${slug}`, destination: '/blog', permanent: true }));

/**
 * `/centres/prayagraj` was a real centre page on the live site. The centre's slug here is
 * `allahabad`, and `prayagraj` alone would otherwise be read as a city and sent to a search.
 */
const legacyCentres: LegacyRedirect[] = [
  { source: '/centres/prayagraj', destination: '/centres/allahabad', permanent: true },
];

export const legacyRedirects: LegacyRedirect[] = [
  ...legacyNavRedirects,
  ...legacyCourseLandings,
  ...legacyProgrammeLandings,
  ...legacyCompanyPages,
  ...legacyBlogArchives,
  ...legacyCentres,
];
