import { definePageCopy } from '../define';
import { seoFieldDefaults } from '../seo';
import { sectionVisibilityDefaults } from '../sections';

/**
 * FAQ — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * `sections.*.visible` toggles (Page text → Show or hide sections) control which blocks render.
 */
export const FAQ_SECTIONS = ['hero', 'topics', 'list', 'more'] as const;

export const faqCopy = definePageCopy({
  id: 'faq',
  label: 'FAQ',
  path: '/faq',
  group: 'Pages',
  description:
    'The FAQ page heading and intro. Use Show or hide sections to turn blocks on or off. The Ask Jetking AI link appears only when Chatbot → Assistant settings → Show on website is on.',
  defaults: {
    ...sectionVisibilityDefaults(FAQ_SECTIONS),
    ...seoFieldDefaults(),

    'seo.title': 'Frequently Asked Questions | Jetking',
    'seo.description':
      'Answers about Jetking admissions, eligibility, fees policy, course durations, centres and placement support.',
    'breadcrumb.label': 'FAQ',

    // Banner
    'hero.eyebrow': 'FAQ',
    'hero.titleLead': 'Questions people',
    'hero.titleAccent': 'ask us most',
    'hero.body':
      'These answers are also what the Jetking Guide draws on — it answers from this content, not from general knowledge.',
    'hero.image': '/faq/hero.jpg',

    // Topic jump links (the questions themselves come from the CMS FAQ list)
    'topics.navLabel': 'FAQ topics',
    'topics.admissions': 'Admissions',
    'topics.courses': 'Courses',
    'topics.fees': 'Fees',
    'topics.placement': 'Placement',
    'topics.centres': 'Centres',
    'topics.franchise': 'Franchise',

    // Closing call to action
    'more.eyebrow': 'Need more help?',
    'more.title': 'Still have a question?',
    'more.body': 'A counsellor can answer what depends on your background and nearest centre.',
    'more.image': '/home/counsellor.jpg',
    'more.cta.label': 'Talk to a counsellor',
    'more.chat.label': 'Ask Jetking AI',
    'more.chat.href': '/chatbot',
  },
});
