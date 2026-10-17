import { definePageCopy } from '../define';

/**
 * Placements (page text) — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 * (The hero lede, disclaimers, steps, recruiters, benefits, testimonials and contact details are the
 * Placements document, edited under Placements.)
 */
export const placementsCopy = definePageCopy({
  id: 'placements',
  label: 'Placements (page text)',
  path: '/placements',
  group: 'Pages',
  description: 'Section headings and labels around the Placements document.',
  defaults: {
    'seo.title': 'Placement Support at Jetking — What It Includes',
    'seo.description':
      'What Jetking placement support covers: interview preparation, profile building and employer introductions. Written for students and parents evaluating the course.',

    'breadcrumb.home': 'Home',
    'breadcrumb.placements': 'Placements',

    'hero.image': '/placements/photos/hero-male.webp',
    'benefits.image': '/home/counsellor.jpg',
    'testimonials.avatars.0.avatar': '/student/testimonial.webp',
    'testimonials.avatars.1.avatar': '/student/avatar-1.webp',
    'testimonials.avatars.2.avatar': '/student/avatar-2.webp',
    'testimonials.avatars.3.avatar': '/student/avatar-3.webp',
    'centre.image': '/home/centre-exterior.jpg',
    'icons.0.image': '/placements/icons/01_hiring_partners.svg',
    'icons.1.image': '/placements/icons/02_placement_support.svg',
    'icons.2.image': '/placements/icons/03_realworld_preparation.svg',
    'icons.3.image': '/placements/icons/04_complete_training.svg',
    'icons.4.image': '/placements/icons/05_biodata_preparation.svg',
    'icons.5.image': '/placements/icons/06_mock_interviews.svg',
    'icons.6.image': '/placements/icons/07_student_interviews.svg',
    'icons.7.image': '/placements/icons/08_appointment_letter.svg',
    'icons.8.image': '/placements/icons/09_learn_practically.svg',
    'icons.9.image': '/placements/icons/10_english_speaking.svg',
    'icons.10.image': '/placements/icons/11_interview_skills.svg',
    'icons.11.image': '/placements/icons/12_get_jobs.svg',
    'icons.12.image': '/placements/icons/13_mock_interviews_feature.svg',
    'icons.13.image': '/placements/icons/14_ai_bot_interviews.svg',
    'icons.14.image': '/placements/icons/15_presentation.svg',
    'icons.15.image': '/placements/icons/16_personalised_guidance.svg',
    'icons.16.image': '/placements/icons/17_centre_information.svg',
    'icons.17.image': '/placements/icons/18_quick_response.svg',
    'icons.18.image': '/placements/icons/25_process_arrow.svg',
    'hero.cta.label': 'Talk to a counsellor',
    'hero.call.ariaLabel': 'Call {phone}',
    'hero.call.shortLabel': 'Call now',
    'hero.call.longLabel': 'Call {phone}',
    'hero.checklist.0': 'Industry connected',
    'hero.checklist.1': 'Personalised support',
    'hero.checklist.2': 'Real career opportunities',
    'hero.highlights.0': 'Hiring partner network',
    'hero.highlights.1': 'Real-world interview prep',
    'hero.highlights.2': 'Dedicated placement support',

    'process.eyebrow': 'How it works',
    'process.titleLead': 'Five steps from',
    'process.titleAccent': 'classroom to offer',

    'recruiters.eyebrow': 'Our recruiters',
    'recruiters.titleLead': 'Brands that are our',
    'recruiters.titleAccent': 'placement partners',
    'recruiters.pauseLabel': 'Pause scrolling recruiter logos',
    'recruiters.resumeLabel': 'Resume scrolling recruiter logos',
    'recruiters.pause': 'Pause',
    'recruiters.play': 'Play',

    'benefits.eyebrow': 'What you build',
    'benefits.title': 'What placement preparation covers',
    'benefits.lede': 'More than training — a complete career readiness course.',
    'benefits.railLabel': 'What placement preparation covers',

    'offers.eyebrow': 'What an offer looks like',
    'offers.titleLead': 'Sample',
    'offers.titleAccent': 'offer letters',
    'offers.lede':
      'Illustrative samples across sectors and roles. They show the shape of a typical offer — not a promise of any employer, role or package.',
    'offers.carouselLabel': 'Offer letter samples, carousel',
    'offers.note': 'Illustrative sample — actual offer letters vary by employer.',
    'offers.hint': 'Tap a letter to view it full size',
    'offers.prevLabel': 'Previous sample offer letter',
    'offers.nextLabel': 'Next sample offer letter',
    'offers.slideLabel': '{n} of {total}: {title}',
    'offers.viewLabel': 'View {title} sample offer letter full size',
    'offers.gallery.closeLabel': 'Close gallery',
    'offers.gallery.prevLabel': 'Previous letter',
    'offers.gallery.nextLabel': 'Next letter',
    'offers.gallery.thumbsLabel': 'Choose a letter',
    'offers.gallery.showLabel': 'Show {title}',

    'testimonials.eyebrow': 'In their words',
    'testimonials.titleLead': 'What placed learners',
    'testimonials.titleAccent': 'say',
    'testimonials.carouselLabel': 'Placement stories',

    'cta.eyebrow': 'Next step',
    'cta.titleLead': 'Ask about a',
    'cta.titleAccent': 'specific centre',
    'cta.body':
      'A counsellor can tell you what your nearest centre has actually achieved — not a sitewide average.',
    'cta.features.0': 'Personalised guidance',
    'cta.features.1': 'Centre-wise information',
    'cta.features.2': 'Quick response',
    'cta.primary.label': 'Talk to a counsellor',
  },
});
