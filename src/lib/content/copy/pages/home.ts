import { definePageCopy } from '../define';

/**
 * Home — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * Live values stay in code and are filled into `{placeholder}` tokens: `{siteName}` (SEO title),
 * `{centres}` / `{cities}` (network counts), `{city}` and `{query}` (centre finder).
 */
export const homeCopy = definePageCopy({
  id: 'home',
  label: 'Home',
  path: '/',
  group: 'Pages',
  description: 'Hero, journey, programmes, centres, proof, FAQ and calls to action on the home page.',
  defaults: {
    'seo.title': '{siteName} — Cloud, Cyber Security & IT Courses',
    'seo.description':
      'Degree, diploma and certification courses in cloud computing, cyber security and IT infrastructure — taught at Jetking centres across India.',

    // ── Hero ──────────────────────────────────────────────────────────────
    'hero.eyebrow': 'India’s No.1 Technology Training Institute',
    'hero.title.line1': 'The Power of Three',
    'hero.title.line2': 'with',
    'hero.sub.line1': 'Industry-relevant training. Real-world projects.',
    'hero.sub.line2': 'Placement support that delivers.',
    'hero.proof.centres': '{centres} centres',
    'hero.proof.cities': '{cities} cities',
    'hero.cta.label': 'Explore Courses',
    'hero.cta.href': '/courses',
    'hero.enquire.label': 'Enquire Now',

    // ── Journey chooser ───────────────────────────────────────────────────
    'chooser.title': 'What brings you here today?',
    'chooser.sub': 'Choose one option. We’ll personalize your experience.',
    'journeys.0.title': 'I\'m a Student',
    'journeys.0.detail': 'Explore courses and start my career',
    'journeys.0.href': '/student',
    'journeys.0.image': '/home/journey-student-v2.jpg',
    'journeys.1.title': 'I\'m a Working Professional',
    'journeys.1.detail': 'Upgrade my skills and advance my career',
    'journeys.1.href': '/professional',
    'journeys.1.image': '/home/journey-professional-v3.jpg',
    'journeys.2.title': 'I\'m Just Browsing',
    'journeys.2.detail': 'Browse around and learn more',
    'journeys.2.href': '/explore',
    'journeys.2.image': '/home/journey-explore-v2.jpg',

    // ── Action bar ────────────────────────────────────────────────────────
    'actions.ariaLabel': 'Next steps',
    'actions.0.label': 'Industry-Relevant Training',
    'actions.0.href': '#home-programs-heading',
    'actions.1.label': 'Real-World Projects',
    'actions.1.href': '#home-how-heading',
    'actions.2.label': 'Placement Support That Delivers',
    'actions.2.href': '#home-proof-heading',

    // ── Logo marquee ──────────────────────────────────────────────────────
    'marquee.heading': 'Trusted by top companies. Our learners work at',
    'marquee.certs.label': 'Certification tracks',
    'marquee.alumni.label': 'Where alumni work',
    'marquee.pause.label': 'Pause',
    'marquee.play.label': 'Play',
    'marquee.pause.aria': 'Pause scrolling logos',
    'marquee.play.aria': 'Resume scrolling logos',

    // ── Courses ───────────────────────────────────────────────────────────
    'programs.eyebrow': 'Courses',
    'programs.title': 'Explore our courses',
    'programs.lede':
      'Industry-aligned, certification-focused courses for real-world careers — from a first certification to a full degree.',
    'programs.cta.label': 'View all courses',
    'programs.cta.href': '/courses',
    'programs.filter.aria': 'Filter courses by technology',
    'programs.tab.featured': 'Featured',

    // ── How it works ──────────────────────────────────────────────────────
    'how.title': 'Build your career, step by step',
    'how.lede': 'From beginner to job-ready professional — we guide you at every stage.',
    'how.steps.0.title': 'Learn',
    'how.steps.0.points.0': 'Learn practically with real-world tools',
    'how.steps.0.points.1': 'Trained & certified faculty',
    'how.steps.0.points.2': 'Scenario based learning',
    'how.steps.1.title': 'Practice',
    'how.steps.1.points.0': 'One computer per student in the lab',
    'how.steps.1.points.1': 'Mock interviews',
    'how.steps.1.points.2': 'AI bot interviews and presentation practice',
    'how.steps.2.title': 'Get certified',
    'how.steps.2.points.0': 'Industry certifications such as CCNA, AWS and CEH',
    'how.steps.2.points.1': 'Jetking certificates for every course',
    'how.steps.2.points.2': 'Partnership with NSDC',
    'how.steps.3.title': 'Get placement support',
    'how.steps.3.points.0': 'Biodata preparation',
    'how.steps.3.points.1': 'Student interviews with hiring partners',
    'how.steps.3.points.2': 'Appointment letter',

    // ── Placement stories ─────────────────────────────────────────────────
    'proof.title': 'Our learners, our pride',
    'proof.lede':
      'Real stories from students who trained at Jetking and now work at organisations across industries.',
    'proof.cta.label': 'Watch success stories',
    'proof.cta.href': '/placements',
    'proof.rail.aria': 'Placement stories',

    // ── Recognition ───────────────────────────────────────────────────────
    'recognition.eyebrow': 'Recognition',
    'recognition.title': 'Recognised by industry, regulators and peers',
    'recognition.rail.aria': 'Recognitions',
    'recognition.items.0.badge': '1999',
    'recognition.items.0.title': 'Microsoft Certified Solution Provider',
    'recognition.items.0.detail':
      'Recognised as a Microsoft Certified Solution Provider and Certified Technical Education Centre (CTEC).',
    'recognition.items.1.badge': '2007',
    'recognition.items.1.title': 'Pike\'s Peak Award',
    'recognition.items.1.detail': 'Honoured for implementing SmartLab Plus, Jetking’s lab-first teaching methodology.',
    'recognition.items.2.badge': '2008',
    'recognition.items.2.title': 'Best Franchisor Award',
    'recognition.items.2.detail':
      'Felicitated as Best Franchisor, alongside the launch of a computer fault-simulator kit for troubleshooting practice.',
    'recognition.items.3.badge': '2011',
    'recognition.items.3.title': 'Alliance with Wipro and IBM',
    'recognition.items.3.detail': 'Industry alliances that shaped the curriculum and placement network.',
    'recognition.items.4.badge': 'Degrees',
    'recognition.items.4.title': 'UGC-approved BCA and MCA',
    'recognition.items.4.detail':
      'Cloud Computing & Cyber Security degrees, with the MCA offered with Yenepoya Deemed University.',
    'recognition.items.5.badge': 'Skill India',
    'recognition.items.5.title': 'NSDC / Skill India recognition',
    'recognition.items.5.detail': 'The Certified Data Analyst course is NSDC / Skill India recognised.',
    'recognition.universities.label': 'Collaboration with top universities & learning entities',
    'recognition.universities.aria': 'University and learning partners',

    // ── Centre network ────────────────────────────────────────────────────
    'network.eyebrow': 'Centre network',
    'network.title': '{centres} centres across {cities} cities',
    'network.lede':
      'In-person classes and labs, not a remote-only course. Find a Jetking centre near you and start your journey today.',
    'network.cta.label': 'Find your centre',
    'network.cta.href': '/centres',
    'network.map.aria': 'Map of India with pins for {centres} Jetking centres in {cities} cities',
    'network.finder.title': 'Find a centre near you',
    'network.finder.placeholder': 'Search city, e.g. Mumbai',
    'network.finder.select.aria': 'Choose a city',
    'network.finder.list.aria': 'Cities with a Jetking centre',
    'network.finder.empty.select': 'No centre found for “{query}”',
    'network.finder.empty.list': 'No centre found for “{query}”.',
    'network.city.one': '{count} centre',
    'network.city.many': '{count} centres',
    'network.city.all': 'All centres in {city}',
    'network.all.label': 'View all {centres} centres',
    'network.all.href': '/centres',

    // ── Why Jetking ───────────────────────────────────────────────────────
    'why.eyebrow': 'Why Jetking',
    'why.title': 'What makes Jetking different?',
    'why.cta.label': 'Our story',
    'why.cta.href': '/about-us',
    'why.rail.aria': 'Reasons to choose Jetking',
    'why.items.0.title': 'Trained & Certified Faculty',
    'why.items.0.detail': 'Award winning and internationally bench-marked training faculty.',
    'why.items.1.title': 'Practical Foundation through Labs',
    'why.items.1.detail': 'One computer per student, so every theory lesson gets hands-on practice.',
    'why.items.2.title': 'Scenario Based Learning',
    'why.items.2.detail': 'Case studies and animated scenarios give you real-life problem-solving practice.',
    'why.items.3.title': 'SmartLabPlus Teaching Methodology',
    'why.items.3.detail': 'Innovative methods of teaching that make learning fun and easy to remember.',
    'why.items.4.title': 'Placement Support',
    'why.items.4.detail': 'We take every necessary step to help you get a suitable job on completing the course.',

    // ── Blog ──────────────────────────────────────────────────────────────
    'blog.eyebrow': 'From the blog',
    'blog.title': 'Career guidance and industry notes',
    'blog.cta.label': 'Visit the blog',
    'blog.cta.href': '/blog',
    'blog.nav.label': 'articles',
    'blog.list.aria': 'Latest articles',

    // ── Franchise band ────────────────────────────────────────────────────
    'franchise.srHeading': 'Franchise opportunities',
    'franchise.title': 'Run a Jetking centre in your city',
    'franchise.body':
      'Partner with India’s most trusted brand — 78 years of brand equity, a countrywide network and end-to-end support.',
    'franchise.cta.label': 'Explore franchise',
    'franchise.cta.href': '/franchise',

    // ── Closing call to action ────────────────────────────────────────────
    'cta.title': 'Ready to start? Talk to a counsellor today.',
    'cta.body': 'Tell us what you want to study and where. Leave your number and we will call you back.',
    'cta.points.0': 'A counsellor from your nearest centre calls you back',
    'cta.points.1': 'Eligibility, fees and batch options — no entrance test',
    'cta.points.2': 'No obligation to enrol on the call',
    'cta.form.title': 'Request a callback',
  },
});

/** The home copy object every home component receives. */
export type HomeCopy = typeof homeCopy.defaults;
