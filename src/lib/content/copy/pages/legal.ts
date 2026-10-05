import { definePageCopy } from '../define';

/**
 * Legal pages (SEO & intros) — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 * (The legal wording itself is in `legal_documents`, edited under Legal documents.)
 */
export const legalCopy = definePageCopy({
  id: 'legal',
  label: 'Legal pages (SEO & intros)',
  path: '/privacy-policy',
  group: 'Pages',
  description: 'Titles, descriptions and intro lines of the legal pages.',
  defaults: {
    'privacy.seo.title': 'Privacy Policy | Jetking',
    'privacy.seo.description':
      'How Jetking Infotrain Limited collects, uses and protects the personal information you share through the Jetking website and services.',
    'privacy.breadcrumb': 'Privacy Policy',
    'privacy.intro':
      'How Jetking collects, uses and protects the information you share with us through this website and our services.',

    'terms.seo.title': 'Terms and Conditions | Jetking',
    'terms.seo.description':
      'The terms of use for the Jetking website and services, including disclaimers, intellectual property, governing law, and the cancellation and refund policy.',
    'terms.breadcrumb': 'Terms and Conditions',
    'terms.intro': 'The terms that apply when you use the Jetking website and its services.',

    'enrollment.seo.title': 'Enrollment Terms and Conditions | Jetking',
    'enrollment.seo.description':
      'The Jetking student passport: academic policies, attendance, exams, fees, refunds, placement rules and the student code of conduct that apply once you enrol.',
    'enrollment.breadcrumb': 'Enrollment Terms and Conditions',
    'enrollment.intro':
      'The student passport: the policies, procedures and rules that apply once you enrol at a Jetking centre.',

    'labels.breadcrumbHome': 'Home',
    'labels.eyebrow': 'Legal',
    'labels.alsoRead': 'Also read',
    'labels.otherPagesNav': 'Other legal pages',
    'labels.talkToCounsellor': 'Questions? Talk to a counsellor',
    'labels.tableFallback': 'Table',
  },
});
