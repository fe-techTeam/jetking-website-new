import { definePageCopy } from '../define';

/**
 * About (page text) — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 * (The hero, purpose cards, leaders, timeline, awards and partners are the About document, edited under About.)
 */
export const aboutCopy = definePageCopy({
  id: 'about',
  label: 'About (page text)',
  path: '/about-us',
  group: 'Pages',
  description: 'Section headings and labels around the About document.',
  defaults: {
    'seo.title': 'About {name} — Training IT Talent {since}',
    'seo.description':
      "Jetking is India's foremost IT and networking training institute, training IT talent {sinceLower}, with {centres} centres and placement support across India.",

    'breadcrumb.home': 'Home',
    'breadcrumb.about': 'About Us',

    'hero.image': '/home/journey-explore-v2.jpg',

    'legacy.heading': 'Legacy at a glance',
    'legacy.stats.0.label': 'Year founded',
    'legacy.stats.1.label': 'Learning centres',
    'legacy.stats.2.label': 'Cities across India',
    'legacy.stats.3.label': 'Courses on offer',

    'purpose.eyebrow': 'Purpose',
    'purpose.titleLead': 'Our purpose &',
    'purpose.titleAccent': 'values',
    'purpose.lede': 'What we aim for, how we work, and the standards we hold ourselves to.',
    'purpose.railLabel': 'Our purpose and values',

    'leaders.eyebrow': 'Leadership',
    'leaders.titleLead': 'The leaders who drive our',
    'leaders.titleAccent': 'growth',
    'leaders.lede':
      'Learn from passionate instructors with expertise who believe in practical teaching methodologies.',
    'leaders.managementHeading': 'Management team',
    'leaders.readMore': 'Read more',
    'leaders.closeLabel': 'Close',

    'timeline.eyebrow': 'History',
    'timeline.titleLead': 'A legacy that we take',
    'timeline.titleAccent': 'pride in',
    'timeline.lede':
      'Over the course of decades, we have achieved some glorious feats. Check out the timeline of how our journey unfolded.',
    'timeline.tabsLabel': 'Company history by decade',
    'timeline.band.0': '1940 – 1986',
    'timeline.band.1': '1986 – 2010',
    'timeline.band.2': '2010 – 2020',
    'timeline.band.3': '2020 – {latest}',

    'achievements.eyebrow': 'Recognition',
    'achievements.titleLead': 'Our',
    'achievements.titleAccent': 'achievements',
    'achievements.lede':
      'Over the decades, we’ve accomplished remarkable milestones. Explore the timeline that showcases how our journey has evolved.',
    'achievements.railLabel': 'Awards and achievements',

    'partnerships.eyebrow': 'Alliances',
    'partnerships.titleLead': 'Our',
    'partnerships.titleAccent': 'partnerships',
    'partnerships.railLabel': 'Our partnerships',

    'future.title': 'First Bitcoin Company in India Listed on the Bombay Stock Exchange',
    'future.body':
      'Secure your company’s future with Bitcoin. Unparalleled transparency, unmatched security, and proven value retention. Join the movement!',
    'future.href': 'https://www.jetking.org',
    'future.linkLabel': 'jetking.org',
  },
});
