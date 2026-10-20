import { definePageCopy } from '../define';
import { seoFieldDefaults } from '../seo';
import { sectionVisibilityDefaults } from '../sections';

/**
 * Sitemap page — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string. The course,
 * centre and article links below the groups are generated from the CMS and are not editable here.
 */
export const SITEMAP_SECTIONS = [
  'hero',
  'jump',
  'pages',
  'courses',
  'centres',
  'blog',
] as const;

export const sitemapCopy = definePageCopy({
  id: 'sitemap',
  label: 'Sitemap page',
  path: '/sitemap',
  group: 'Pages',
  description: 'The HTML sitemap page. Use Show or hide sections to turn blocks on or off.',
  defaults: {
    ...sectionVisibilityDefaults(SITEMAP_SECTIONS),
    ...seoFieldDefaults(),

    'seo.title': 'Sitemap — All Pages | Jetking',
    'seo.description':
      'Every page on the Jetking website in one place — learner paths, courses, centres by state, company information and the blog.',
    'breadcrumb.label': 'Sitemap',

    // Banner
    'hero.eyebrow': 'Sitemap',
    'hero.titleLead': 'Every page,',
    'hero.titleAccent': 'in one place',
    'hero.body': 'Find a course, a centre or a page without hunting through the menu.',
    'hero.image': '/sitemap/hero.jpg',

    // Page groups — indices are contiguous; the page reads until a gap.
    'groups.0.title': 'Start here',
    'groups.0.links.0.label': 'Home',
    'groups.0.links.0.href': '/',
    'groups.0.links.1.label': 'Courses',
    'groups.0.links.1.href': '/courses',
    'groups.0.links.2.label': 'Centres',
    'groups.0.links.2.href': '/centres',
    'groups.0.links.3.label': 'Franchise',
    'groups.0.links.3.href': '/franchise',
    'groups.0.links.4.label': 'Jetking ABC Labs',
    'groups.0.links.4.href': '/jetking-abc-labs',
    'groups.1.title': 'Company',
    'groups.1.links.0.label': 'About us',
    'groups.1.links.0.href': '/about-us',
    'groups.1.links.1.label': 'Placements',
    'groups.1.links.1.href': '/placements',
    'groups.1.links.2.label': 'Investors',
    'groups.1.links.2.href': '/investors',
    'groups.1.links.3.label': 'Blog',
    'groups.1.links.3.href': '/blog',
    'groups.1.links.4.label': 'FAQ',
    'groups.1.links.4.href': '/faq',
    'groups.2.title': 'Learn more',
    'groups.2.links.0.label': 'Courses',
    'groups.2.links.0.href': '/courses',
    'groups.2.links.1.label': 'Centres',
    'groups.2.links.1.href': '/centres',
    'groups.2.links.2.label': 'Explore programmes',
    'groups.2.links.2.href': '/explore',
    'groups.2.links.3.label': 'Jetking AI assistant',
    'groups.2.links.3.href': '/chatbot',
    'groups.3.title': 'Get in touch',
    'groups.3.links.0.label': 'Enquire now',
    'groups.3.links.0.href': '/enquiry',
    'groups.3.links.1.label': 'Jetking AI assistant',
    'groups.3.links.1.href': '/chatbot',
    'groups.3.links.2.label': 'Log in / My account',
    'groups.3.links.2.href': '/account',
    'groups.4.title': 'Legal',
    'groups.4.links.0.label': 'Privacy Policy',
    'groups.4.links.0.href': '/privacy-policy',
    'groups.4.links.1.label': 'Terms & Conditions',
    'groups.4.links.1.href': '/terms-conditions',
    'groups.4.links.2.label': 'Enrollment Terms',
    'groups.4.links.2.href': '/enrollment-terms-and-conditions',

    // Jump bar and section titles
    'jump.label': 'Sitemap sections',
    'jump.blog': 'Blog',
    'pages.title': 'Main pages',

    // Generated sections
    'courses.title': 'Courses',
    'courses.cta.label': 'All courses →',
    'courses.cta.href': '/courses',
    'centres.title': 'Centres',
    'centres.cta.label': 'All centres →',
    'centres.cta.href': '/centres',
    'blog.title': 'Blog',
    'blog.cta.label': 'Blog home →',
    'blog.cta.href': '/blog',

    // Footer line
    'xml.lead': 'Also available as',
    'xml.label': 'sitemap.xml',
    'xml.href': '/sitemap.xml',
  },
});
