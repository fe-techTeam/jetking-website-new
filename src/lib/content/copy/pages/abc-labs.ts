import { definePageCopy } from '../define';
import { seoFieldDefaults } from '../seo';
import { sectionVisibilityDefaults } from '../sections';

/**
 * Jetking ABC Labs — editable text. Fields are added here with their current wording as the default; the
 * page component reads them from the copy it is given instead of hard-coding the string.
 *
 * `sections.*.visible` toggles (Page text → Show or hide sections) control which blocks render.
 */
export const ABC_LABS_SECTIONS = ['hero', 'sites', 'ai', 'blockchain', 'enquire'] as const;

export const abcLabsCopy = definePageCopy({
  id: 'abc-labs',
  label: 'Jetking ABC Labs',
  path: '/jetking-abc-labs',
  group: 'Pages',
  description:
    'AI, Blockchain and Cyberspace labs landing. Use Show or hide sections to turn blocks on or off.',
  defaults: {
    ...sectionVisibilityDefaults(ABC_LABS_SECTIONS),
    ...seoFieldDefaults({ noindex: true }),

    'seo.title': 'Jetking ABC Labs — AI, Blockchain & Cyberspace | Jetking',
    'seo.description': 'Building future-ready skills to power the next generation of digital innovation.',

    'breadcrumb.label': 'Jetking ABC Labs',

    'hero.image': '/abc-labs/hero.jpg',
    'hero.eyebrow': 'Jetking ABC Labs',
    'hero.titleLead': 'Jetking is working on the ABC of the Digital Future:',
    'hero.titleAccent': 'AI, Blockchain & Cyberspace',
    'hero.body': 'Building future-ready skills to power the next generation of digital innovation.',
    'hero.cta': 'Enquire Now',

    'sites.0.host': 'Jetking.ai',
    'sites.0.href': 'https://www.jetking.ai',
    'sites.0.note': 'AI & Humanoid Robotics',
    'sites.1.host': 'Jetking.org',
    'sites.1.href': 'https://www.jetking.org',
    'sites.1.note': 'Bitcoin treasury',
    'sites.2.host': 'Jetking.finance',
    'sites.2.href': 'https://www.jetking.finance',
    'sites.2.note': 'Asset tokenization',

    'ai.eyebrow': 'AI & Robotics Lab',
    'ai.title': 'Build the Future with Humanoid Robotics & AI',
    'ai.body': "India's first masterclass that turns beginners into job-ready Humanoid Robotics Engineers.",
    'ai.benefitsTitle': 'What you get',
    'ai.benefits.0': 'Master 29 humanoid robotics-related subjects',
    'ai.benefits.1': 'Build your own human-size humanoid robot',
    'ai.benefits.2': 'Practice with simulated humanoid robots',
    'ai.benefits.3': 'Practice with a real industrial humanoid robot',
    'ai.benefits.4': '1-on-1 tutoring sessions every month',
    'ai.benefits.5': 'Dedicated technical mentor support',
    'ai.benefits.6': 'Industry-recognised completion certificate',
    'ai.phasesTitle': '4 phases to truly understand how humanoid robots work',
    'ai.phases.0': 'Mechanical Design & Simulation',
    'ai.phases.1': 'Electronics of Humanoid Robots',
    'ai.phases.2': 'Control Systems',
    'ai.phases.3': 'AI Algorithm Systems',
    'ai.careersTitle': 'High-paying roles in the robotics economy',
    'ai.careers.0': 'Robotics Engineer',
    'ai.careers.1': 'AI Engineer',
    'ai.careers.2': 'Automation Engineer',
    'ai.careers.3': 'R&D Specialist',
    'ai.linkLabel': 'Visit jetking.ai',
    'ai.linkHref': 'https://www.jetking.ai',

    'blockchain.eyebrow': 'Blockchain',
    'blockchain.title': 'Blockchain at Jetking',
    'blockchain.bitcoin.label': 'jetking.org',
    'blockchain.bitcoin.title': "India's First Bitcoin Treasury Company",
    'blockchain.bitcoin.body': "Our Mission: India's Path to Financial Sovereignty.",
    'blockchain.bitcoin.0': 'Decentralized Collaboration',
    'blockchain.bitcoin.1': 'Lightning-Fast Innovation',
    'blockchain.bitcoin.2': 'Secure Asset Management',
    'blockchain.bitcoin.linkLabel': 'Visit jetking.org',
    'blockchain.bitcoin.linkHref': 'https://www.jetking.org',
    'blockchain.finance.label': 'jetking.finance',
    'blockchain.finance.title': 'Tokenize the World.',
    'blockchain.finance.body':
      'A real-world asset tokenization platform that bridges traditional finance and DeFi. Built for Enterprise:',
    'blockchain.finance.0': 'Tokenization as a Service',
    'blockchain.finance.1': 'Fund Administration',
    'blockchain.finance.2': 'Regulatory Compliance',
    'blockchain.finance.3': 'Multi-Chain Infrastructure',
    'blockchain.finance.4': 'Secondary Trading',
    'blockchain.finance.5': 'Institutional Custody',
    'blockchain.finance.linkLabel': 'Visit jetking.finance',
    'blockchain.finance.linkHref': 'https://www.jetking.finance',

    'enquire.title': 'Want to know more about Jetking ABC Labs?',
    'enquire.cta': 'Enquire Now',
  },
});
