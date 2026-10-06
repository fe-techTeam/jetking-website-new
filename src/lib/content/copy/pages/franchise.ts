import { definePageCopy } from '../define';
import { SINCE_FOUNDED } from '../../../brand-facts';

/**
 * Franchise — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * `components/franchise/data.ts` rebuilds its arrays from these defaults for the chatbot corpus export,
 * so the shipped wording lives in one place. Item counts (stats, steps, cards) are fixed by the layout.
 */
export const franchiseCopy = definePageCopy({
  id: 'franchise',
  label: 'Franchise',
  path: '/franchise',
  group: 'Pages',
  description: 'The franchise landing page and its enquiry form.',
  defaults: {
    'seo.title': `Own a Jetking Franchise | India's Leading IT Training Brand`,
    'seo.description':
      'Build your future with a Jetking IT training franchise. Established brand, proven business model, end-to-end support, and attractive ROI. Investment from ₹15 Lakhs.',

    'breadcrumb.name': 'Franchise',

    'hero.eyebrow': 'Become A Franchise Partner',
    'hero.title.prefix': 'Transform youth with a Jetking Franchise in your',
    'hero.title.accent': 'City',
    'hero.sub':
      'Join India’s trusted IT training network. Proven model, end-to-end support, and a path to build lasting local impact — and wealth.',
    'hero.cta.label': 'Enquire Now',
    'hero.cta.href': '#enquire',
    'hero.secondary.label': 'Download Brochure',
    'hero.secondary.href': '#enquire',
    'hero.partners': 'Partners across India',
    'hero.capacity': 'Capacity from ₹50L',
    'hero.call': 'Prefer to talk? Call franchise manager',
    'hero.image': '/franchise/hero-building.webp',
    'hero.image.alt': 'Modern Jetking franchise training centre building',

    'orbit.0.label': 'Brand',
    'orbit.0.detail': `Trusted ${SINCE_FOUNDED.toLowerCase()}`,
    'orbit.1.label': 'Support',
    'orbit.1.detail': 'End-to-end ops help',
    'orbit.2.label': 'Growth',
    'orbit.2.detail': 'Local marketing push',
    'orbit.3.label': 'Returns',
    'orbit.3.detail': 'Attractive ROI path',

    'why.eyebrow': 'The Jetking advantage',
    'why.title.prefix': 'Why Partners Choose',
    'why.lede': 'The numbers behind a franchise model built on decades of trust.',
    'why.0.value': 'Proven',
    'why.0.label': 'Centre Operating Model',
    'why.1.value': 'End-to-end',
    'why.1.label': 'Launch Support',
    'why.2.value': 'Pan-India',
    'why.2.label': 'Centre Network',
    'why.3.value': SINCE_FOUNDED,
    'why.3.label': 'Brand Legacy',
    'why.4.value': 'Awarded',
    'why.4.label': 'Franchise Support',

    'stories.label': 'Partner stories',
    'stories.0.quote':
      'The brand opened doors with parents in our city that a standalone centre never would. Within 18 months we broke even and are now expanding.',
    'stories.0.name': 'Rohit Verma',
    'stories.0.role': 'Franchise Partner · Pune',
    'stories.1.quote':
      "Jetking's end-to-end support — from centre setup to marketing — made the move from corporate life to education entrepreneurship smooth.",
    'stories.1.name': 'Priya Nair',
    'stories.1.role': 'Franchise Partner · Bengaluru',
    'stories.2.quote':
      'The proven curriculum and placement partnerships gave us credibility from day one. Parents trust the Jetking name.',
    'stories.2.name': 'Amit Desai',
    'stories.2.role': 'Franchise Partner · Ahmedabad',

    'jump.eyebrow': 'Partner benefits',
    'jump.title': 'Jump-start your centre',
    'jump.lede': 'What you get when you partner with Jetking.',
    'jump.0.title': 'Manpower Support',
    'jump.0.detail': 'Regular training courses keep your team engaged and ready to perform every day.',
    'jump.1.title': 'Hassle-Free Operations',
    'jump.1.detail': 'Online systems cover A–Z of centre management so you always know what needs attention.',
    'jump.2.title': 'Advertising & Marketing',
    'jump.2.detail': 'Local marketing, PR and digital campaigns build strong awareness in your territory.',
    'jump.3.title': 'Start-Up Launch',
    'jump.3.detail': 'Location, design, construction, hiring and training — we help you open at peak readiness.',

    'cta.title': 'Ready to partner?',
    'cta.body':
      'Tell us your preferred city and investment capacity — our franchise team replies within 24 hours.',
    'cta.button.label': 'Start franchise enquiry',
    'cta.button.href': '#enquire',
    'cta.bands': 'Capacity bands: {bands}',

    'launch.eyebrow': 'How it works',
    'launch.title': 'Launch Plan',
    'launch.lede': 'A clear path from territory selection to day-to-day operations.',
    'launch.0.step': '01',
    'launch.0.title': 'Pre-launch',
    'launch.0.body': 'Location, interiors, recruitment, branding and technical setup before you open doors.',
    'launch.1.step': '02',
    'launch.1.title': 'Launch',
    'launch.1.body': 'Kick-starter plan, staff training, launch promotions and media coverage.',
    'launch.2.step': '03',
    'launch.2.title': 'Training',
    'launch.2.body': 'Tech training, quality management, online courses and courseware support.',
    'launch.3.step': '04',
    'launch.3.title': 'Ongoing',
    'launch.3.body': 'Daily sales support, ERP & LMS, recruitment help and annual partner meets.',

    'market.image': '/franchise/centre-interior.webp',
    'market.image.alt': 'Students learning in a modern Jetking-style IT training classroom',
    'market.eyebrow': 'The opportunity',
    'market.title': 'The opportunity is real',
    'market.lede':
      'Skill gaps in cloud, cyber and emerging tech create lasting demand for job-ready training centres in every city.',
    'market.0.value': '3.5M',
    'market.0.label': 'Cloud & cyber talent shortage projected globally',
    'market.1.value': '59%',
    'market.1.label': 'Organisations at risk from cybersecurity staff gaps',
    'market.2.value': '80%',
    'market.2.label': 'Of Indian graduates struggle to become job-ready',
    'market.3.value': '70%',
    'market.3.label': 'Of students say vocational training helps get jobs',

    'courses.eyebrow': 'What you teach',
    'courses.title': 'Courses your centre will deliver',
    'courses.lede': 'Proven courses parents trust and employers recognise.',
    'courses.0.title': 'Career Courses',
    'courses.0.body': 'Diplomas in Cloud Computing, Cyber Security and Metaverse Design.',
    'courses.1.title': 'Graduation Courses',
    'courses.1.body': 'BCA pathways in Cloud, Cyber Security and Blockchain.',
    'courses.2.title': 'Certifications',
    'courses.2.body': 'Ethical Hacking, CCNA, Linux and other in-demand credentials.',

    'faq.eyebrow': 'Questions answered',
    'faq.title': 'Frequently Asked Questions',

    'enquire.image.alt': 'Modern Jetking franchise centre exterior',
    'enquire.tagline': 'Be your own boss. Build lasting wealth with a trusted brand.',
    'enquire.note': 'Our franchise team gets back within 24 hours.',

    'contact.call': 'Speak to Franchise Manager: +91 {phone}',
    'contact.email': 'franchise@jetking.com',
    'contact.web.label': 'www.jetking.com/franchise',
    'contact.web.href': '/franchise',

    'investment.band.0': 'UPTO 50 L',
    'investment.band.1': 'UPTO 1 CR',
    'investment.band.2': 'UPTO 3 CR',

    'form.name.label': 'Name',
    'form.name.placeholder': 'Your full name',
    'form.phone.label': 'Mobile Number',
    'form.phone.placeholder': '+91 98765 43210',
    'form.email.label': 'Email Address',
    'form.email.placeholder': 'you@example.com',
    'form.city.label': 'Preferred Location',
    'form.city.placeholder': 'City or territory',
    'form.investment.label': 'Investment Capacity',
    'form.investment.placeholder': 'Select',
    'form.submit': 'Get Franchise Details',
    'form.submitting': 'Submitting…',
    'form.note': 'Our team will get in touch with you within 24 hours!',
    'form.error': 'Something went wrong. Please try again.',
    'form.success.title': 'Thank you!',
    'form.success.body': 'Our franchise team will get in touch with you within 24 hours.',
  },
});
