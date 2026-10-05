import { definePageCopy } from '../define';

/**
 * Parents — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 * `{siteName}`, `{centres}`, `{cities}`, `{since}` are live values filled in by the page.
 */
export const parentCopy = definePageCopy({
  id: 'parent',
  label: 'Parents',
  path: '/parent',
  group: 'Pages',
  description: 'The parent landing page.',
  defaults: {
    'seo.title': 'Parent Path — Placements, Fees & Trust | {siteName}',
    'seo.description':
      'For parents evaluating Jetking: placement support explained honestly, fee clarity, centre visits, and counsellor conversations before you decide.',

    'breadcrumb.home': 'Home',
    'breadcrumb.current': 'Parent',

    'hero.eyebrow': 'Welcome Parent!',
    'hero.title': 'Your Child’s Future Starts with the',
    'hero.titleAccent': 'Right Education',
    'hero.titleEnd': 'Today',
    'hero.body':
      'Help your child build a future-ready IT career with industry-aligned courses, practical labs, and placement support — with fee clarity before you commit.',
    'hero.cta.label': 'Explore Courses for Your Child',
    'hero.cta.href': '#courses',
    'hero.guidance.label': 'Book Free Career Guidance',
    'hero.image': '/parent/hero.jpg',
    'hero.imageAlt': 'Parent and student exploring career options together',

    'features.0.label': 'Industry Relevant Courses',
    'features.1.label': 'Practical Learning',
    'features.2.label': 'Placement Assistance',
    'features.3.label': 'Trusted by Parents',

    'trust.title': 'Why Parents Trust {siteName}',
    'trust.0.label': 'Centres to visit in person',
    'trust.1.value': 'Support',
    'trust.1.label': 'Placement Assistance',
    'trust.2.value': 'Industry',
    'trust.2.label': 'Aligned Curriculum',
    'trust.3.label': 'Trusted Brand Legacy',

    'journey.title': 'We’re with you at every step',
    'journey.0.title': 'Career Guidance',
    'journey.0.detail': '& Counselling',
    'journey.1.title': 'Choose the',
    'journey.1.detail': 'Right Course',
    'journey.2.title': 'Hands-on Training',
    'journey.2.detail': '& Projects',
    'journey.3.title': 'Placement',
    'journey.3.detail': 'Support',
    'journey.4.title': 'Successful',
    'journey.4.detail': 'Career',

    'courses.title': 'Top Career Options Your Child Can Build',
    'courses.description': 'Proven courses parents compare — labs, certifications, and support.',
    'courses.viewAll.label': 'View all',
    'courses.viewAll.href': '/courses',
    'courses.badge': 'Best match',
    'courses.trackLabel': 'recommended courses',

    'help.title': 'Let Us Help You',
    'help.0.label': 'Talk to Parent Advisor',
    'help.1.label': 'Download Course Brochure',
    'help.2.label': 'Find a Centre Near You',
    'help.3.label': 'Fee & Scholarship Options',
    'help.centres': '{centres} centres across {cities} cities — visit before you decide.',
    'help.question': 'Have questions? We’re here to help you!',
    'help.chat.label': 'Chat with Us',
    'help.chat.href': '/chatbot',

    'stories.title': 'Real Success Stories.',
    'stories.titleAccent': 'Real Parents.',
    'stories.titleEnd': 'Real Results.',
    'stories.foundedLabel': 'Training IT talent since',
    'stories.citiesLabel': 'Cities with a Jetking centre',
    'stories.caption': 'Parents & learners across India',
    'stories.avatar.0': '/student/avatar-1.webp',
    'stories.avatar.1': '/student/avatar-2.webp',
    'stories.avatar.2': '/student/avatar-3.webp',
    'stories.label': 'Parent stories',
    'stories.slider.0': '/student/avatar-1.webp',
    'stories.slider.1': '/student/avatar-2.webp',
    'stories.slider.2': '/student/avatar-3.webp',
    'stories.slider.3': '/student/testimonial.webp',

    'loves.title': 'Things Parents Love About {siteName}',
    'loves.0.label': 'Safe & Secure Learning Environment',
    'loves.1.label': 'Dedicated Mentors',
    'loves.2.label': 'Hands-on Labs',
    'loves.3.label': 'Career Counselling',
    'loves.4.label': 'Trusted Legacy {since}',

    'cta.title': 'Not sure which course is right for your child?',
    'cta.body':
      'Book a free counselling session with a parent advisor. Compare tracks, fees, and centres — no pressure to enrol.',
    'cta.label': 'Book Free Career Counselling',
    'cta.badge': 'No obligation · 100% free',
    'cta.image': '/parent/hero.jpg',
    'cta.imageAlt': 'Parent researching {siteName} career guidance for their child',
  },
});

/** The parent page's copy as components receive it. */
export type ParentCopy = typeof parentCopy.defaults;
