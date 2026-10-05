import { definePageCopy } from '../define';

/**
 * Explore — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * `{brand}`, `{cities}`, `{centres}`, `{courses}`, `{formats}`, `{count}`, `{title}` and `{name}` are
 * live values filled in by the page — keep them in the text where they appear.
 */
export const exploreCopy = definePageCopy({
  id: 'explore',
  label: 'Explore',
  path: '/explore',
  group: 'Pages',
  description: 'The Explore landing page.',
  defaults: {
    'seo.title': 'Explore {brand} — Courses, Centres & Placements',
    'seo.description':
      'Browse Jetking courses, placement stories and centres across India — no commitment needed, just explore at your own pace.',
    'breadcrumb.label': 'Explore',

    // Hero
    'hero.eyebrow': 'Just Exploring? Welcome!',
    'hero.titleLead': 'See everything',
    'hero.titleTrail': 'has to offer',
    'hero.body':
      'No commitment needed. Browse courses, see why students and franchise partners choose {brand}, and find a centre near you — at your own pace.',
    'hero.cta.primary.label': 'Explore courses',
    'hero.cta.primary.href': '/courses',
    'hero.cta.secondary.label': 'Find a centre',
    'hero.cta.secondary.href': '/centres',
    'hero.citiesLine': 'Centres in {cities} cities',
    'hero.noForm': 'No form, no pressure',
    'hero.image': '/home/journey-explore-v2.jpg',
    'hero.imageAlt': 'Visitor exploring the Jetking campus',

    // Orbit chips around the hero image
    'orbit.0.label': 'Browse Freely',
    'orbit.0.detail': 'No sign-up needed to look around',
    'orbit.1.label': 'Compare Paths',
    'orbit.1.detail': 'Degrees, diplomas & short courses',
    'orbit.2.label': 'Visit a Centre',
    'orbit.2.detail': 'Pan-India network near you',
    'orbit.3.label': 'No Pressure',
    'orbit.3.detail': 'Talk to us only when ready',

    // Quick enquiry
    'enquire.image': '/home/journey-explore-v2.jpg',
    'enquire.title': 'Have a specific question?',
    'enquire.note': 'Leave a note and we’ll get back — entirely optional.',

    // Enquiry form (labels, placeholders, messages)
    'form.name.label': 'Name',
    'form.name.placeholder': 'Your full name',
    'form.phone.label': 'Mobile Number',
    'form.phone.placeholder': '+91 98765 43210',
    'form.email.label': 'Email Address',
    'form.email.placeholder': 'you@example.com',
    'form.state.label': 'State',
    'form.state.placeholder': 'Select state',
    'form.city.label': 'City',
    'form.city.placeholder': 'Select city',
    'form.city.stateFirst': 'State first',
    'form.centre.label': 'Centre',
    'form.centre.placeholder': 'Select centre',
    'form.centre.cityFirst': 'City first',
    'form.qualification.label': 'Highest qualification',
    'form.qualification.placeholder': 'Qualification',
    'form.submit': 'Send a quick note',
    'form.submitting': 'Submitting…',
    'form.optional': 'Optional — only fill this in if you’d like us to reach out.',
    'form.error': 'Something went wrong. Please try again.',
    'form.thanks.title': 'Thank you!',
    'form.thanks.body': 'We’ll reach out only if you want us to — no spam, no pressure.',

    // About strip
    'about.cta.label': 'Read our story',
    'about.cta.href': '/about-us',

    // Courses
    'courses.title': 'Courses to explore',
    'courses.description': '{courses} courses across {formats} formats — tap a card to see full details.',
    'courses.browseLabel': 'Browse by format:',
    'courses.formatHref': '/courses',
    'levels.degree': 'Degree Courses',
    'levels.diploma': 'Diploma Courses',
    'levels.certification': 'Career Courses',
    'levels.short': 'Short Courses',

    // Why people choose + testimonial slider
    'why.titleLead': 'Why People Choose',
    'slider.label': 'Placement stories',
    'slider.play': 'Play video: {title}, {name}',
    'slider.close': 'Close video',
    'slider.videoLabel': '{name}, video',

    // Awards
    'awards.title': 'Awards & recognition',

    // 10 reasons
    'reasons.title': '10 reasons why {brand} is every student’s choice',
    'reasons.0.title': 'Trained & Certified Faculty',
    'reasons.0.detail': 'Award winning and internationally bench-marked training faculty.',
    'reasons.1.title': 'Practical Foundation through Labs',
    'reasons.1.detail': 'One computer per student, so every theory lesson gets hands-on practice.',
    'reasons.2.title': 'Placement Support',
    'reasons.2.detail': 'We take every necessary step to help you get a suitable job on completing the course.',
    'reasons.3.title': 'Scenario Based Learning',
    'reasons.3.detail': 'Case studies and animated scenarios give you real-life problem-solving practice.',
    'reasons.4.title': 'SmartLabPlus Teaching Methodology',
    'reasons.4.detail': 'Innovative methods of teaching that make learning fun and easy to remember.',
    'reasons.5.title': 'Countrywide Network',
    'reasons.5.detail': 'A well-established, nationally recognised institute with centres across India.',
    'reasons.6.title': 'Personality Development',
    'reasons.6.detail': 'Builds confidence and supports better job and salary prospects.',
    'reasons.7.title': 'State-of-the-Art Infrastructure',
    'reasons.7.detail': 'Every centre is equipped for a successful learning environment.',
    'reasons.8.title': 'De-stress with Yoga',
    'reasons.8.detail': 'A relaxed mind finds it easier to learn.',
    'reasons.9.title': 'Partnership with NSDC',
    'reasons.9.detail': 'Associated with the National Skill Development Corporation as a skill development partner.',

    // University partners
    'universities.title': 'Collaboration with top universities & learning entities',
    'universities.0.name': 'Yenepoya (Deemed to be University)',
    'universities.0.image': '/university-partners/yenepoya.png',
    'universities.1.name': 'Tilak Maharashtra Vidyapeeth, Pune',
    'universities.1.image': '/university-partners/tilak-maharashtra-vidyapeeth.png',
    'universities.2.name': 'Pearson',
    'universities.2.image': '/university-partners/pearson.png',
    'universities.3.name': 'Lincoln University College',
    'universities.3.image': '/university-partners/lincoln-university.png',

    // Certifications
    'certs.title': 'Certifications you can train towards',
    'certs.body': 'Industry-recognised technologies built into Jetking’s curriculum.',

    // Alumni
    'alumni.title': 'Where our alumni work',
    'alumni.cta.label': 'See placement records',
    'alumni.cta.href': '/placements',
    'alumni.body': 'Companies from Jetking’s own published placement records.',
    'alumni.showAll': 'Show all {count} companies',

    // Placement partners
    'partners.title': 'Our Placement Partners',
    'partners.showAll': 'Show all {count} partners',
    'partners.note':
      'Note: Placements are subject to recruitment norms. Jetking does not guarantee placements in the above organisations.',

    // Shared by the long logo lists
    'common.showFewer': 'Show fewer',

    // Affiliation
    'affiliation.title': 'Our Affiliation',
    'affiliation.0.name': 'Skill India',
    'affiliation.0.image': '/affiliations/skill-india.png',
    'affiliation.1.name': 'NSDC',
    'affiliation.1.image': '/affiliations/nsdc.png',
    'affiliation.2.name': 'Red Hat',
    'affiliation.2.image': '/affiliations/red-hat.png',
    'affiliation.3.name': 'Delhi Capitals',
    'affiliation.3.image': '/affiliations/delhi-capitals.png',

    // Blog
    'blog.title': 'From the blog',
    'blog.cta.label': 'Read more',
    'blog.cta.href': '/blog',

    // Final CTA
    'cta.title': '{centres} centres across {cities} cities',
    'cta.body':
      'Not ready to talk to anyone yet? Just browse — every centre and every course is listed, no form required.',
    'cta.centres.label': 'Browse centres',
    'cta.centres.href': '/centres',
    'cta.courses.label': 'Browse courses',
    'cta.courses.href': '/courses',
  },
});
