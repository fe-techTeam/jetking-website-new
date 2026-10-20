import { definePageCopy } from '../define';
import { seoFieldDefaults } from '../seo';
import { sectionVisibilityDefaults } from '../sections';

/**
 * Blog — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 * (Article titles, excerpts and bodies are CMS posts, edited under Blog posts.)
 */
export const BLOG_SECTIONS = [
  'hero',
  'index',
  'cta',
] as const;

export const blogCopy = definePageCopy({
  id: 'blog',
  label: 'Blog',
  path: '/blog',
  group: 'Pages',
  description:
    'Blog index and article chrome. article.fallbackImage is used when a post’s hero/og image is a scraped marketing share card. Use Show or hide sections to turn blocks on or off.',
  defaults: {
    ...sectionVisibilityDefaults(BLOG_SECTIONS),
    ...seoFieldDefaults(),

    'seo.title': 'Career Guidance & IT Insights | Jetking Blog',
    'seo.description':
      'Guidance on choosing an IT course, switching careers, and what employers look for — written for students, working professionals and parents.',

    'breadcrumb.home': 'Home',
    'breadcrumb.blog': 'Blog',

    'hero.image': '/blog/hero.webp',
    'hero.eyebrow': 'Blogs & Insights',
    'hero.titleLead': 'Ideas. Insights. Impact.',
    'hero.titleAccent': 'For Your Future.',
    'hero.lede':
      'Actionable insights on technology, careers, industry trends and learning — crafted to help you stay ahead.',
    'hero.searchLabel': 'Search articles',
    'hero.searchPlaceholder': 'Search articles, topics, skills...',
    'hero.searchButtonLabel': 'Search articles',
    'hero.articleSingular': 'article',
    'hero.articlePlural': 'articles',
    'hero.topics': '{count} topics',

    'index.eyebrow': 'Index',
    'index.allHeading': 'All writing',
    'index.countFiltered': '{visible} of {total} {unit}',
    'index.countRange': '{from}–{to} of {total}',
    'index.countTotal': '{total} {unit}',
    'index.searchLabel': 'Search articles',
    'index.searchPlaceholder': 'Search titles, topics, keywords…',
    'index.clearSearch': 'Clear search',
    'index.topicsNavLabel': 'Topics',
    'index.allTopics': 'All topics',
    'index.filterLabel': 'Filter by topic',
    'index.emptyTopic': 'No articles in this topic yet.',
    'index.viewAll': 'View all writing',
    'index.noMatch': 'No articles match “{query}”.',

    'pagination.label': 'Blog pages',
    'pagination.pageOf': 'Page {current} of {total}',
    'pagination.prev': 'Prev',
    'pagination.next': 'Next',
    'pagination.pageLabel': 'Page {page}',

    'card.latestBadge': 'Latest',
    'card.readArticle': 'Read article',

    'cta.image': '/home/counsellor.jpg',
    'cta.eyebrow': 'Still deciding',
    'cta.title': 'Talk it through with a counsellor',
    'cta.body':
      'A short conversation about your goals, background and nearest centre — no obligation, no scripted pitch.',
    'cta.primary.label': 'Enquire now',
    'cta.secondary.label': 'Browse courses',
    'cta.secondary.href': '/courses',

    'article.breadcrumbLabel': 'Breadcrumb',
    'article.fallbackImage': '/blog/article-fallback.jpg',
    'article.emptyBody':
      'Full article text is being refreshed for this post. The summary above covers the key points for now.',

    'nudge.fallback.headline': 'Ready to look at courses?',
    'nudge.fallback.body': 'Browse the catalogue or talk to a counsellor about the right track for you.',
    'nudge.fallback.cta.label': 'Browse courses',
    'nudge.fallback.cta.href': '/courses',

    'related.eyebrow': 'Keep reading',
    'related.title': 'More in {category}',
    'related.allLabel': 'All articles',

    'articleCta.image': '/home/counsellor.jpg',
    'articleCta.eyebrow': 'Still deciding',
    'articleCta.title': 'Talk it through with a counsellor',
    'articleCta.body':
      'A short conversation about your goals, background and nearest centre — no obligation, no scripted pitch.',
    'articleCta.primary.label': 'Enquire now',
    'articleCta.secondary.label': 'Browse courses',
    'articleCta.secondary.href': '/courses',
  },
});
