import { definePageCopy } from '../define';

/**
 * Enquiry — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * `{name}` in `form.signedIn` is the signed-in visitor's name, filled in by the form.
 */
export const enquiryCopy = definePageCopy({
  id: 'enquiry',
  label: 'Enquiry',
  path: '/enquiry',
  group: 'Pages',
  description: 'The enquiry page and form text.',
  defaults: {
    'seo.title': 'Enquire About a Jetking Course',
    'seo.description':
      'Send an enquiry and a Jetking counsellor will get in touch about courses, fees, centres and admissions.',
    // Thin, transactional and duplicated in intent across the funnel — kept out of the index
    // deliberately. Set to anything other than "true" to let search engines index it.
    'seo.noindex': 'true',

    // Hero
    'hero.eyebrow': '💬 Enquiry',
    'hero.title': 'Talk to a counsellor',
    'hero.body':
      'Tell us a little about what you are looking for. A counsellor from your nearest centre will get in touch — usually within one working day.',

    // "What happens next" panel
    'next.title': 'What happens next',
    'next.0.title': 'We read your enquiry',
    'next.0.detail': 'Routed to a counsellor at your nearest centre.',
    'next.1.title': 'A counsellor reaches out',
    'next.1.detail': 'Usually a call or WhatsApp within one working day.',
    'next.2.title': 'Get clear answers',
    'next.2.detail': 'Fees, eligibility and batch timings — no pressure.',
    'next.eta': 'Usually within one working day.',
    'next.whatsapp.label': 'Prefer WhatsApp? Message us now',
    'next.whatsapp.newTab': '(opens in a new tab)',

    // Form
    'form.loading': 'Loading form…',
    'form.intro.student': 'Tell us where you are in your studies and we will point you to the right track.',
    'form.intro.professional': 'Tell us your current role and what you want to move into.',
    'form.intro.parent': 'Tell us a little about your child’s situation and what you would like to know.',
    'form.intro.unknown': 'Tell us what you are looking for.',
    'form.intro.franchise.lead': 'This form reaches a course counsellor. Looking to open a Jetking centre?',
    'form.intro.franchise.link': 'Use the franchise enquiry form',
    'form.intro.franchise.href': '/franchise#enquire',
    'form.signedIn': 'Signed in as {name} — your details are filled in below.',
    'form.login.lead': 'Have a Jetking account?',
    'form.login.button': 'Log in',
    'form.login.trail': 'to fill in your details.',
    'form.name.label': 'Your name',
    'form.phone.label': 'Phone number',
    'form.phone.hint': 'A counsellor will call or message you on this.',
    'form.email.label': 'Email',
    'form.email.hint': 'Optional.',
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
    'form.course.label': 'Course of interest',
    'form.course.none': 'Not sure yet',
    'form.message.label': 'Anything you would like to ask?',
    'form.submit': 'Send enquiry',
    'form.submitting': 'Sending…',
    'form.privacy': 'We use your details only to respond to this enquiry.',
    'form.error': 'Something went wrong. Please try again.',
    'form.errorNetwork': 'We could not send that. Please check your connection and try again.',
    'form.thanks.title': 'Thank you — that has reached us.',
    'form.thanks.body': 'A counsellor from your nearest centre will be in touch, usually within one working day.',
    'form.thanks.whatsapp': 'Prefer WhatsApp? Message us now',
    'form.thanks.newTab': '(opens in a new tab)',
  },
});
