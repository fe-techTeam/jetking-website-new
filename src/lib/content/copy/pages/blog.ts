import { definePageCopy } from '../define';

/**
 * Blog — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 * (Article titles, excerpts and bodies are CMS posts, edited under Blog posts.)
 */
export const blogCopy = definePageCopy({
  id: 'blog',
  label: 'Blog',
  path: '/blog',
  group: 'Pages',
  description: 'The blog index and article page chrome.',
  defaults: {
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

    'cta.eyebrow': 'Still deciding',
    'cta.title': 'Talk it through with a counsellor',
    'cta.body':
      'A short conversation about your goals, background and nearest centre — no obligation, no scripted pitch.',
    'cta.primary.label': 'Enquire now',
    'cta.secondary.label': 'Browse courses',
    'cta.secondary.href': '/courses',

    'article.breadcrumbLabel': 'Breadcrumb',
    'article.fallbackImage': '/blog/hero.webp',
    'article.emptyBody':
      'Full article text is being refreshed for this post. The summary above covers the key points for now.',

    'nudge.student.headline': 'Ready to look at actual courses?',
    'nudge.student.body': 'Start with the tracks open to you straight after 12th.',
    'nudge.student.cta.label': 'Browse courses',
    'nudge.student.cta.href': '/courses',
    'nudge.professional.headline': 'Thinking about making the move?',
    'nudge.professional.body': 'Compare the tracks built for working professionals.',
    'nudge.professional.cta.label': 'Compare tracks',
    'nudge.professional.cta.href': '/courses',
    'nudge.parent.headline': 'Want to talk it through with someone?',
    'nudge.parent.body': 'A counsellor can walk you through options, fees and centres.',
    'nudge.parent.cta.label': 'Talk to a counsellor',
    'nudge.parent.cta.href': '/enquiry',
    'nudge.franchise.headline': 'Exploring the franchise opportunity?',
    'nudge.franchise.cta.label': 'Franchise details',
    'nudge.franchise.cta.href': '/franchise',

    'related.eyebrow': 'Keep reading',
    'related.title': 'More in {category}',
    'related.allLabel': 'All articles',

    'articleCta.eyebrow': 'Still deciding',
    'articleCta.title': 'Talk it through with a counsellor',
    'articleCta.body':
      'A short conversation about your goals, background and nearest centre — no obligation, no scripted pitch.',
    'articleCta.primary.label': 'Enquire now',
    'articleCta.secondary.label': 'Browse courses',
    'articleCta.secondary.href': '/courses',
  },
});
