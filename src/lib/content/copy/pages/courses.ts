import { definePageCopy } from '../define';

/**
 * Courses — editable text for the catalogue (`/courses`) and the fixed text on every course page
 * (`/courses/{slug}`). A course's own title, summary, outcomes, FAQs and SEO come from the course
 * record; everything here is the wording around them. `{name}` tokens are live values the page fills in.
 */
export const coursesCopy = definePageCopy({
  id: 'courses',
  label: 'Courses',
  path: '/courses',
  group: 'Pages',
  description: 'The course catalogue and the fixed text on every course page.',
  defaults: {
    'seo.title': 'IT Courses in Cloud, Cyber Security, AI & DevOps | Jetking',
    'seo.description':
      'Jetking IT courses in cloud, cyber security, AI, DevOps, gaming and networking — short-term courses to UG and PG degrees for students, graduates and professionals.',

    // ── Catalogue: trail, banner, closing ───────────────────────────────
    'breadcrumb.home': 'Home',
    'breadcrumb.courses': 'Courses',

    'hero.image': '/home/journey-student-v2.jpg',
    'hero.eyebrow': 'Courses',
    'hero.title': 'The Most In-Demand',
    'hero.titleAccent': 'Job-Ready Courses.',
    'hero.domainsLabel': 'Domains we offer courses in',
    'hero.domains.0': 'Cloud Computing',
    'hero.domains.1': 'Cyber Security',
    'hero.domains.2': 'AI Engineering',
    'hero.domains.3': 'DevOps',
    'hero.domains.4': 'Gaming & Metaverse',
    'hero.domains.5': 'Networking',
    'hero.sub': 'Short term to UG & PG Degree Programs for 10+2 Students, Graduates & Young Professionals',
    'hero.stats': '{courses} courses · {levels} levels',

    // ── Catalogue: filters and results ──────────────────────────────────
    'explorer.filtersTitle': 'Filters',
    'explorer.clearAll': 'Clear all',
    'explorer.filterAria': 'Filter courses',
    'explorer.searchLabel': 'Search courses',
    'explorer.searchPlaceholder': 'Search courses...',
    'explorer.clearSearch': 'Clear search',
    'explorer.levelLabel': 'Level',
    'explorer.technologyLabel': 'Technology',
    'explorer.allLevels': 'All levels',
    'explorer.allTechnologies': 'All technologies',
    'explorer.sheetTitle': 'Filter courses',
    'explorer.showResults': 'Show {count} {unit}',
    'explorer.courseOne': 'course',
    'explorer.courseMany': 'courses',
    'explorer.matching': 'matching',
    'explorer.viewCourse': 'View course',
    'explorer.emptyTitle': 'No course matches those filters',
    'explorer.emptyBody': 'Try a different level, technology, or search term.',
    'explorer.clearFilters': 'Clear all filters',

    // ── Catalogue: persona-adaptive next step ───────────────────────────
    'guidance.student.headline': 'Comparing the cloud and cyber tracks?',
    'guidance.student.body': 'They look similar and suit different people. This explains the difference.',
    'guidance.student.ctaLabel': 'Read the comparison',
    'guidance.student.ctaHref': '/blog/cyber-security-vs-cloud-computing',
    'guidance.professional.headline': 'Changing careers rather than starting one?',
    'guidance.professional.body': 'What transfers from your current role, and what does not.',
    'guidance.professional.ctaLabel': 'Chat with Jetking',
    'guidance.parent.headline': 'Evaluating on your child’s behalf?',
    'guidance.parent.body': 'Seven questions worth asking any training institute — including us.',
    'guidance.parent.ctaLabel': 'See the checklist',
    'guidance.parent.ctaHref': '/blog/what-parents-should-ask-it-institute',
    'guidance.franchise.headline': 'Here about the franchise opportunity?',
    'guidance.franchise.body': 'The franchise section covers the operating model.',
    'guidance.franchise.ctaLabel': 'Go to franchise',
    'guidance.franchise.ctaHref': '/franchise',

    'cta.eyebrow': 'Still deciding',
    'cta.title': 'Not sure which course fits?',
    'cta.body': 'Talk to a counsellor about your goals, eligibility and the right track — no commitment needed.',
    'cta.button': 'Talk to a counsellor',

    // ── Course page: banner ─────────────────────────────────────────────
    'courseBanner.centresOne': '{count} centre',
    'courseBanner.centresMany': '{count} centres',
    'courseBanner.prefixIn': '{prefix} in',
    'courseBanner.degreeCta': 'Brochure',
    'courseBanner.counsellorCta': 'Talk to a Counsellor',
    'courseBanner.brochureCta': 'Download Brochure',

    'courseForm.title': 'Sign up for a free career counselling session!',

    // ── Course page: at a glance ────────────────────────────────────────
    'courseFacts.aria': 'Course at a glance',
    'courseFacts.degreeTitle': 'Degree',
    'courseFacts.degreeBody': 'From Top University',
    'courseFacts.learnTitle': 'Learn',
    'courseFacts.learnBody': 'In demand skills & Tech Tools',
    'courseFacts.handsOnTitle': 'Hands on Skills',
    'courseFacts.handsOnBody': 'with Lab & Project Works',
    'courseFacts.placementTitle': 'Placement',
    'courseFacts.placementBody': 'in Top Companies, {partners} partners',
    'courseFacts.durationBody': 'Course duration',
    'courseFacts.eligibilityTitle': 'Eligibility',
    'courseFacts.labsTitle': 'Hands-on labs',
    'courseFacts.labsBody': 'Practical learning at your centre',
    'courseFacts.supportTitle': 'Placement support',
    'courseFacts.supportBody': 'Career assistance',

    // ── Course page: why this course, careers, placement prompt ─────────
    'courseWhy.degreeKicker': 'Why now',
    'courseWhy.degreeTitle': 'Why {degree} and why now',
    'courseWhy.degreeLead': '{degree} is one of the most in-demand degrees for India’s tech workforce.',
    'courseWhy.shortKicker': 'Industry demand',
    'courseWhy.shortTitle': 'Industry demand for {label} professionals',

    'courseCareers.kicker': 'Careers',
    'courseCareers.title': 'What career this Program can provide',

    'coursePlacementPrompt.kicker': 'Placement',
    'coursePlacementPrompt.title': 'Want to know how our Placement works?',
    'coursePlacementPrompt.cta': 'See placement support',

    // ── Course page: photo band ─────────────────────────────────────────
    'coursePhoto.aria': 'Learn by doing',
    'coursePhoto.image': '/home/journey-student-v2.jpg',
    'coursePhoto.kicker': 'Learn by doing',
    'coursePhoto.text': 'Labs with mentors beside you, and a placement team behind you.',
    'coursePhoto.cta': 'Talk to a counsellor',

    // ── Course page: degree-only sections ───────────────────────────────
    'courseHighlights.kicker': 'Course highlights',
    'courseHighlights.title': 'What makes this degree different',
    'courseHighlights.internshipTitle': 'Internship & placement opportunities',

    'courseUniversity.kicker': 'About the university',
    'courseUniversity.titleWith': 'Your degree from {university}',
    'courseUniversity.titleWithout': 'A degree from our university partner',
    'courseUniversity.logoAlt': '{university} logo',
    'courseUniversity.bodyWith':
      "You study at a Jetking centre and graduate with a university-awarded degree from {university}, with Jetking's lab work, certifications and placement support built in.",
    'courseUniversity.bodyWithout':
      'You study at a Jetking centre and graduate with a UGC-recognised degree awarded by our university partner, with Jetking’s lab work, certifications and placement support built in.',
    'courseUniversity.points.0': 'Recognised degree awarded by the university',
    'courseUniversity.points.1': 'Jetking labs, mentors and master sessions at your centre',
    'courseUniversity.specimenImage': '/courses/sample-degree.svg',
    'courseUniversity.specimenAlt': 'Sample degree certificate',
    'courseUniversity.specimenCaption': 'Illustrative sample — the actual degree is issued by the university.',

    'courseJourney.kicker': 'Your learning journey',
    'courseJourney.title': 'From first lab to first job',

    // ── Course page: the Jetking centre advantage and centre picker ─────
    'courseCentres.kicker': 'The Jetking centre advantage',
    'courseCentres.degreeTitle': 'A mini campus near your home',
    'courseCentres.shortTitle': 'Your learning journey, with a mini campus near your home',
    'courseCentres.image': '/courses/centre-advantage.jpg',
    'courseCentres.imageAlt': 'Learners and a mentor working together in a Jetking lab',
    'courseCentres.advantages.0.title': 'Instructor-led physical labs',
    'courseCentres.advantages.0.body': 'Practise on real hardware, networks and cloud set-ups with an instructor beside you.',
    'courseCentres.advantages.1.title': 'Faculty access 7 days a week',
    'courseCentres.advantages.1.body': 'Walk in or book a slot any day to clear doubts before they pile up.',
    'courseCentres.advantages.2.title': 'Career guidance from your Centre Manager',
    'courseCentres.advantages.2.body': 'One-on-one planning for electives, certifications, internships and interview readiness.',
    'courseCentres.advantages.3.title': 'In-person master sessions',
    'courseCentres.advantages.3.body': 'Sessions at the centre with industry practitioners and university faculty.',
    'courseCentres.advantages.4.title': 'Meet and learn with peers',
    'courseCentres.advantages.4.body': 'Study groups, project teams and hackathons with batchmates from your own city.',

    'centrePicker.availablePrefix': 'Available at',
    'centrePicker.centreOne': 'centre',
    'centrePicker.centreMany': 'centres',
    'centrePicker.across': 'Across {count} {unit} — pick a location that works for you.',
    'centrePicker.cityOne': 'city',
    'centrePicker.cityMany': 'cities',
    'centrePicker.hide': 'Hide centres',
    'centrePicker.find': 'Find your centre',
    'centrePicker.cityLabel': 'City',
    'centrePicker.tabsLabel': 'Choose a city',
    'centrePicker.call': 'Call',
    'centrePicker.directions': 'Directions',

    // ── Course page: curriculum, tools, certifications ──────────────────
    'courseCurriculum.kicker': 'Curriculum',
    'courseCurriculum.title': 'What you will study',
    'courseCurriculum.topics': '{count} topics',
    'courseCurriculum.modules': '{count} modules',
    'courseCurriculum.moduleLabel': 'Module {number}',
    'courseCurriculum.moduleBody': 'Taught in person at your centre, with lab work and assessment built into the module.',
    'courseCurriculum.statTerm': 'Term',
    'courseCurriculum.statTerms': 'Terms',
    'courseCurriculum.statModules': 'Modules',
    'courseCurriculum.statTopics': 'Topics',
    'courseCurriculum.statDuration': 'Duration',
    'courseCurriculum.statProjects': 'Projects',
    'courseCurriculum.statTools': 'Tools',
    'courseCurriculum.statCertifications': 'Certifications',

    'courseTools.kicker': 'Tools & technologies',
    'courseTools.title': 'Tools you will work with',

    'courseCerts.kicker': 'Industry certifications',
    'courseCerts.title': 'Certifications you can prepare for',
    'courseCerts.specimenCaption': 'Jetking certificate specimen',
    'courseCerts.cardTitle': 'Jetking Certificate',
    'courseCerts.cardBody':
      'Awarded in your name on successful completion of the programme. Select the specimen to see it at full size.',
    'courseCerts.enlarge': 'Enlarge',
    'courseCerts.enlargeLabel': 'Enlarge: {alt}',
    'courseCerts.close': 'Close',

    // ── Course page: placement ──────────────────────────────────────────
    'coursePlacement.kicker': 'How placement works',
    'coursePlacement.title': '{steps} steps from classroom to offer',

    'courseRecords.kicker': 'Placement records',
    'courseRecords.title': 'Our alumni are in top companies & growing fast',
    'courseRecords.carouselLabel': 'Placed learners',
    'courseRecords.placedAt': 'Placed at',
    'courseRecords.imageAlt': '{name}, placed at {company}',
    'courseRecords.partnersTitle': 'Brands that are our placement partners',

    // ── Course page: closing, FAQs, similar courses, phone bar ──────────
    'courseClosing.title': 'Got more questions? Talk to us',
    'courseClosing.body': 'Connect with our advisors and get your queries resolved.',
    'courseClosing.cta': 'Contact us',
    'courseClosing.speak': 'Speak with our expert',
    'courseClosing.orEmail': 'or email',
    'courseClosing.email': 'info@jetking.com',

    'courseFaq.kicker': 'FAQs',
    'courseFaq.title': 'Frequently asked questions',

    'courseRelated.kicker': 'Similar courses',
    'courseRelated.title': 'Explore more courses',
    'courseRelated.catalogueLink': 'Full catalogue',
    'courseRelated.viewCourse': 'View course',

    'courseJump.overview': 'Overview',
    'courseJump.centres': 'Centres',
    'courseJump.curriculum': 'Curriculum',
    'courseJump.tools': 'Tools',
    'courseJump.certifications': 'Certifications',
    'courseJump.placement': 'Placement',
    'courseJump.faqs': 'FAQs',

    'courseSticky.callLabel': 'Call Jetking',
    'courseSticky.cta': 'Enquire now',
  },
});
