import { definePageCopy } from '../define';

/**
 * Sitemap page — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string. The course,
 * centre and article links below the groups are generated from the CMS and are not editable here.
 */
export const sitemapCopy = definePageCopy({
  id: 'sitemap',
  label: 'Sitemap page',
  path: '/sitemap',
  group: 'Pages',
  description: 'The HTML sitemap page.',
  defaults: {
    'seo.title': 'Sitemap — All Pages | Jetking',
    'seo.description':
      'Every page on the Jetking website in one place — learner paths, courses, centres by state, company information and the blog.',
    'breadcrumb.label': 'Sitemap',

    // Banner
    'hero.eyebrow': 'Sitemap',
    'hero.titleLead': 'Every page,',
    'hero.titleAccent': 'in one place',
    'hero.body': 'Find a course, a centre or a page without hunting through the menu.',
    'hero.image': '/home/journey-explore-v2.jpg',

    // Page groups (three groups: 4, 5 and 3 links)
    'groups.0.title': 'Start here',
    'groups.0.links.0.label': 'Home',
    'groups.0.links.0.href': '/',
    'groups.0.links.1.label': 'Courses',
    'groups.0.links.1.href': '/courses',
    'groups.0.links.2.label': 'Centres',
    'groups.0.links.2.href': '/centres',
    'groups.0.links.3.label': 'Franchise',
    'groups.0.links.3.href': '/franchise',
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
    'groups.2.title': 'Get in touch',
    'groups.2.links.0.label': 'Enquire now',
    'groups.2.links.0.href': '/enquiry',
    'groups.2.links.1.label': 'Jetking AI assistant',
    'groups.2.links.1.href': '/chatbot',
    'groups.2.links.2.label': 'Log in / My account',
    'groups.2.links.2.href': '/account',

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
    'blog.title': 'Latest from the blog',
    'blog.cta.label': 'All articles →',
    'blog.cta.href': '/blog',

    // Footer line
    'xml.lead': 'Looking for the machine-readable version?',
    'xml.label': 'sitemap.xml',
    'xml.href': '/sitemap.xml',
  },
});
