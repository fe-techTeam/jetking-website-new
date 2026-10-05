import { definePageCopy } from '../define';

/**
 * Students — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 * `{siteName}`, `{intent}`, `{cities}`, `{n}`, `{total}`, `{label}`, `{status}` are live values filled in by the page.
 */
export const studentCopy = definePageCopy({
  id: 'student',
  label: 'Students',
  path: '/student',
  group: 'Pages',
  description: 'The student landing page.',
  defaults: {
    'seo.title': 'Student Path — Courses & Career Start | {siteName}',
    'seo.description':
      'Explore Jetking courses for students after 10th or 12th — cloud, cyber security and IT tracks with labs, certifications and placement support.',

    'breadcrumb.home': 'Home',
    'breadcrumb.current': 'Student',

    'hero.eyebrow': 'Welcome Future Tech Leader!',
    'hero.title': 'Your Dream Career in Tech',
    'hero.titleAccent': 'Starts Now',
    'hero.body':
      'Explore courses, placement support and labs — then get a personalised career path when you’re ready. No login required to browse.',
    'hero.cta.label': 'Explore Courses',
    'hero.cta.href': '/courses',
    'hero.pathCta.label': 'Find my career path',
    'hero.cities': 'Centres in {cities} cities',
    'hero.trust': 'Placement support included',
    'hero.call': 'Prefer to talk? Call a counsellor',
    'hero.image': '/student/hero.webp',
    'hero.imageAlt': '{siteName} student ready for a tech career',
    'hero.avatar.0': '/student/avatar-1.webp',
    'hero.avatar.1': '/student/avatar-2.webp',
    'hero.avatar.2': '/student/avatar-3.webp',
    'hero.avatar.3': '/student/avatar-4.webp',

    'orbit.0.label': 'Learn',
    'orbit.0.detail': 'Industry relevant skills',
    'orbit.1.label': 'Practice',
    'orbit.1.detail': 'Hands-on labs & projects',
    'orbit.2.label': 'Get Certified',
    'orbit.2.detail': 'Industry-recognised certs',
    'orbit.3.label': 'Get Placed',
    'orbit.3.detail': 'Interview & placement support',

    'courses.title': 'Recommended for You',
    'courses.description': 'Popular courses for students — tap a card to explore details.',
    'courses.viewAll.label': 'View all',
    'courses.viewAll.href': '/courses',
    'courses.badge': 'Best match',
    'courses.trackLabel': 'recommended courses',

    'journey.ariaLabel': 'Guided career journey',
    'journey.eyebrow': 'Personalised path',
    'journey.title': 'Your guided career journey',
    'journey.body':
      'Answer a few questions — we’ll recommend courses, build your roadmap, and connect you with a counsellor.',
    'journey.complete.title': 'Journey complete',
    'journey.complete.body':
      'Your counsellor will follow up soon. Keep exploring below or start a new path anytime.',
    'journey.complete.restart': 'Start a new journey',

    'progress.ariaLabel': 'Student journey progress',
    'progress.step': 'Step {n} of {total}: {label} — {status}',
    'progress.done': 'completed',
    'progress.current': 'current step',
    'progress.pending': 'not started',

    'discover.eyebrow': 'Step 1 · Discover',
    'discover.title': 'Let’s find your tech career path',
    'discover.body':
      'Two quick questions — no login needed. We’ll recommend courses that fit your background and goals.',
    'discover.education.legend': 'Where are you in your education?',
    'discover.interest.legend': 'Which career path interests you?',
    'discover.submit': 'See my recommendations',

    'recommend.eyebrow': 'Step 2 · Recommended for you',
    'recommend.title': 'Courses matched to your {intent} goal',
    'recommend.body':
      'Pick one to build your career roadmap. You can explore details or continue with your top match.',
    'recommend.badge': 'Best match',
    'recommend.badgeSr': 'Best match for you',
    'recommend.select': 'Select for roadmap',
    'recommend.selected': 'Selected',
    'recommend.continue': 'Continue with selected course',
    'recommend.details': 'View full course details',
    'recommend.prompt': 'Select a course above to continue.',

    'save.eyebrow': 'Step 3 · Save your path',
    'save.title': 'Save your {intent} recommendations',
    'save.body':
      'We’ll text or WhatsApp your matched courses and career roadmap. No spam — just your saved path.',
    'save.phone.label': 'Mobile number',
    'save.phone.hint': "We'll send your recommendations here.",
    'save.name.label': 'First name',
    'save.name.hint': 'Optional — personalises your roadmap.',
    'save.submit': 'Save my recommendations',
    'save.submitting': 'Saving…',
    'save.skip': 'Skip for now — show my roadmap',
    'save.error': 'Could not save. Please try again.',
    'save.errorNetwork': 'Connection issue — please try again.',

    'roadmap.eyebrow': 'Step 4 · Your career roadmap',
    'roadmap.title': 'Your path to a {intent} career',
    'roadmap.body.before': 'Based on',
    'roadmap.body.after': '— here is how Jetking takes you from learning to employment.',
    'roadmap.cta': 'Book free counselling for this path',

    'counsel.eyebrow': 'Step 5 · Book counselling',
    'counsel.title': 'Talk to a counsellor about {course}',
    'counsel.body':
      'Free session — we’ll help you confirm the course, nearest centre, and next steps. No obligation.',
    'counsel.name.label': 'Your name',
    'counsel.phone.label': 'Mobile number',
    'counsel.phone.hint': 'A counsellor will call or message you on this number.',
    'counsel.email.label': 'Email',
    'counsel.email.hint': 'Optional.',
    'counsel.message.label': 'Anything you would like to ask?',
    'counsel.message.placeholder': 'e.g. weekend batches, nearest centre in Mumbai…',
    'counsel.submit': 'Book free counselling',
    'counsel.submitting': 'Sending…',
    'counsel.privacy': 'We use your details only to arrange this counselling session.',
    'counsel.error': 'Something went wrong. Please try again.',
    'counsel.errorNetwork': 'We could not send that. Please check your connection and try again.',
    'counsel.done.title': 'You’re booked in',
    'counsel.done.before': 'A counsellor will reach out about',
    'counsel.done.after': ', usually within one working day.',
    'counsel.done.whatsapp': 'Prefer WhatsApp? Message us now',
    'counsel.done.newTab': '(opens in a new tab)',

    'why.title': 'Why Students Choose',
    'why.stats.0.label': 'Learning Centres',
    'why.stats.1.value': 'Support',
    'why.stats.1.label': 'Placement Assistance',
    'why.stats.2.label': 'Cities Across India',
    'why.stats.3.label': 'Courses On Offer',
    'why.stats.4.value': 'In Person',
    'why.stats.4.label': 'Labs & Assessment',

    'stories.label': 'Student stories',
    'stories.avatar.0': '/student/testimonial.webp',
    'stories.avatar.1': '/student/avatar-1.webp',
    'stories.avatar.2': '/student/avatar-2.webp',
    'stories.avatar.3': '/student/avatar-3.webp',

    'benefits.title': 'Student Benefits',
    'benefits.body': 'What you get when you join a Jetking course.',
    'benefits.0.title': 'Live Projects',
    'benefits.0.detail': 'Build portfolio-ready work in guided labs, not slide decks.',
    'benefits.1.title': 'Expert Trainers',
    'benefits.1.detail': 'Learn from faculty who teach what centres actually run.',
    'benefits.2.title': 'Flexible Batches',
    'benefits.2.detail': 'Weekday and weekend options so study fits your schedule.',
    'benefits.3.title': '100% Support',
    'benefits.3.detail': 'Counsellors guide courses, centres and next steps — no pressure.',

    'cta.title': 'Ready to start?',
    'cta.body':
      'Use the guided journey above — discover your path, get recommendations, and book counselling when you’re ready.',
    'cta.label': 'Start your career journey',
    'cta.href': '#start-journey',
  },
});

/** The student page's copy as components receive it. */
export type StudentCopy = typeof studentCopy.defaults;
