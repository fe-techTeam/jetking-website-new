import { definePageCopy } from '../define';

/**
 * Centres — editable text for the centre directory (`/centres`) and the fixed text on every centre
 * page (`/centres/{slug}`). A centre's own name, address, programmes, faculty, FAQs and SEO come from
 * the centre record; everything here is the wording around them. `{name}` tokens are live values the
 * page fills in.
 */
export const centresCopy = definePageCopy({
  id: 'centres',
  label: 'Centres',
  path: '/centres',
  group: 'Pages',
  description: 'The centre directory, city pages and centre pages.',
  defaults: {
    'seo.title': 'Jetking Centres Across India | Find Your Nearest',
    'seo.description':
      'Find Jetking IT training centres by city. Browse centres across India offering cloud computing, cyber security, DevOps and networking courses.',

    // ── Shared wording ──────────────────────────────────────────────────
    'breadcrumb.home': 'Home',
    'breadcrumb.centres': 'Centres',
    'units.cityOne': 'city',
    'units.cityMany': 'cities',
    'units.centreOne': 'centre',
    'units.centreMany': 'centres',

    // ── Directory: banner and search ────────────────────────────────────
    'directoryHero.image': '/home/journey-explore-v2.jpg',
    'directoryHero.eyebrow': '{centres} Centres · Nationwide',
    'directoryHero.title': 'Find a Jetking centre',
    'directoryHero.titleAccent': 'near you.',
    'directoryHero.sub':
      'Jetking teaches in classrooms across India. Browse by city to see centres in your area and the courses each one runs.',
    'directoryHero.stats': '{brand} · {cities} {cityUnit} · {centres} {centreUnit}',

    'directorySearch.label': 'Search cities',
    'directorySearch.placeholder': 'Search cities, states, localities...',
    'directorySearch.submitLabel': 'Search centres',

    // ── Directory: filters and results ──────────────────────────────────
    'directoryIndex.eyebrow': 'Browse by city',
    'directoryIndex.title': 'Centres across India',
    'directoryIndex.filterAria': 'Filter centres',
    'directoryIndex.filtersTitle': 'Filters',
    'directoryIndex.clearAll': 'Clear all',
    'directoryIndex.searchLabel': 'Search centres',
    'directoryIndex.searchPlaceholder': 'Search cities, states...',
    'directoryIndex.clearSearch': 'Clear search',
    'directoryIndex.stateLabel': 'State',
    'directoryIndex.cityLabel': 'City',
    'directoryIndex.allStates': 'All states',
    'directoryIndex.allCities': 'All cities',
    'directoryIndex.allShort': 'All',
    'directoryIndex.selected': 'selected',
    'directoryIndex.sheetTitle': 'Filter centres',
    'directoryIndex.showResults': 'Show {count} {unit}',
    'directoryIndex.cityInState': 'City in {state}',
    'directoryIndex.matching': 'matching',
    'directoryIndex.showing': 'Showing',
    'directoryIndex.emptyTitle': 'No centres match your filters',
    'directoryIndex.emptyBody': 'Try a different city, state, or search term.',
    'directoryIndex.clearFilters': 'Clear all filters',
    'directoryIndex.viewDetails': 'View details',
    'directoryIndex.enquire': 'Enquire',
    'directoryIndex.phone': 'Phone',

    // ── Directory: closing band ─────────────────────────────────────────
    'directoryCta.eyebrow': 'Need help choosing?',
    'directoryCta.title': 'Talk to a counsellor about your nearest centre',
    'directoryCta.body':
      'A short conversation about your goals, background and nearest {brand} centre — no obligation, no scripted pitch.',
    'directoryCta.phoneLabel': '07666830000',
    'directoryCta.phoneHref': 'tel:07666830000',
    'directoryCta.point1': 'Free career counselling',
    'directoryCta.point2': 'Centre visits arranged on request',
    'directoryCta.enquire': 'Enquire now',
    'directoryCta.browse': 'Browse courses',
    'directoryCta.browseHref': '/courses',

    // ── Centre page: banner ─────────────────────────────────────────────
    'centreHero.image': '/home/journey-explore-v2.jpg',
    'centreHero.introFallback':
      'IT training centre in {place}. Cloud, cyber security and BCA courses with placement support.',
    'centreHero.enquire': 'Enquire at this centre',
    'centreHero.call': 'Call {phone}',
    'centreHero.courses': '{count} courses',

    // ── Centre page: sections ───────────────────────────────────────────
    'centreStats.eyebrow': 'Why Jetking',
    'centreStats.title': 'Learn where industry',
    'centreStats.titleAccent': 'actually trains',

    'centreCourses.eyebrow': 'At this centre',
    'centreCourses.title': 'Courses at this centre',
    'centreCourses.lede':
      'Classroom and lab training, with placement support. Pick a course to see its curriculum, fees and certifications.',
    'centreCourses.featuredTitle': 'Featured courses',
    'centreCourses.featuredBadge': 'Featured',
    'centreCourses.moreTitle': 'More courses at this centre',
    'centreCourses.offeredTitle': 'Courses offered',
    'centreCourses.viewCourse': 'View course',
    'centreCourses.enquire': 'Enquire now',
    'centreCourses.empty': 'Ask a counsellor which courses run at this centre.',

    'centreAdmissions.eyebrow': 'Admissions',
    'centreAdmissions.eligibilityTitle': 'Who can apply',
    'centreAdmissions.journeyTitle': 'Your transformation journey',
    'centreAdmissions.journeyLede': 'From beginner to job-ready, step by step.',

    'centreFaculty.eyebrow': 'Mentors',
    'centreFaculty.title': 'Our faculty',
    'centreFaculty.label': 'Faculty',

    'centrePlacements.eyebrow': 'Outcomes',
    'centrePlacements.title': 'Recent placements',
    'centrePlacements.label': 'Recent placements',

    'centreStories.eyebrow': 'Voices',
    'centreStories.title': 'Student stories',
    'centreStories.label': 'Student stories',

    'centreFaq.eyebrow': 'Help',
    'centreFaq.title': 'Frequently asked questions',

    'centreVisit.eyebrow': 'Visit',
    'centreVisit.title': 'Visit {locality}',
    'centreVisit.mapsLink': 'Open in Google Maps',
    'centreVisit.newTab': '(opens in a new tab)',
    'centreVisit.phone': 'Phone',
    'centreVisit.helpline': 'Admissions helpline',
    'centreVisit.email': 'Email',
    'centreVisit.enquire': 'Enquire about this centre',
    'centreVisit.back': 'Back to all centres',
    'centreVisit.backHref': '/centres',
    'centreVisit.siblingsTitle': 'Other centres in {city}',
    'centreVisit.onlyTitle': 'Centres in {city}',
    'centreVisit.onlyText': 'This is the only Jetking centre in {city}.',
    'centreVisit.viewAll': 'View all {city} centres',

    'centreClosing.title': 'Ready to visit {locality}?',
    'centreClosing.body': 'Talk to a counsellor about batches, fees and the right course for your goals at this centre.',
    'centreClosing.cta': 'Book a counselling call',

    'centreJump.courses': 'Courses',
    'centreJump.admissions': 'Admissions',
    'centreJump.faculty': 'Faculty',
    'centreJump.placements': 'Placements',
    'centreJump.stories': 'Stories',
    'centreJump.faqs': 'FAQs',
    'centreJump.visit': 'Visit',

    'centreBar.callLabel': 'Call this centre',
    'centreBar.call': 'Call',
    'centreBar.enquire': 'Enquire now',
  },
});
