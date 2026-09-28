import type { Faq } from '../types';

/**
 * PLACEHOLDER CONTENT — the FAQ corpus is the single highest-value grounding source
 * for the AI Guide, because it is short, factual and written in answer form.
 *
 * Note what is deliberately absent: no answer states a fee figure, a placement
 * percentage, or a salary. Those route to the deterministic fee component or to a
 * counsellor handoff. See src/guide/guardrails.ts.
 */
export const faqs: Faq[] = [
  {
    id: 'faq-eligibility-bca',
    question: 'What is the eligibility for the BCA in Cloud Computing & Cyber Security?',
    answer:
      'You need to have passed 10+2 in any stream. There is no entrance test for admission to the course.',
    topic: 'admissions',
    personaRelevance: { student: 1, parent: 0.9 },
    relatedCourseSlugs: ['bca-cloud-cyber-security'],
  },
  {
    id: 'faq-entrance-test',
    question: 'Is there an entrance exam?',
    answer:
      'Jetking courses do not require an entrance test. Admission is based on eligibility criteria for the specific course, and a counsellor will confirm your fit during the enquiry conversation.',
    topic: 'admissions',
    personaRelevance: { student: 1, parent: 0.8 },
  },
  {
    id: 'faq-fees-general',
    question: 'How much do the courses cost?',
    answer:
      'Fees vary by course, centre and intake, so they are confirmed by a counsellor rather than published as a single figure. EMI options are available on most courses.',
    topic: 'fees',
    personaRelevance: { parent: 1, student: 0.8, professional: 0.8 },
  },
  {
    id: 'faq-emi',
    question: 'Are instalment or EMI options available?',
    answer:
      'EMI options are available on most courses. The specific arrangements depend on the centre and the course, and a counsellor will walk you through what applies to your case.',
    topic: 'fees',
    personaRelevance: { parent: 1, student: 0.6 },
  },
  {
    id: 'faq-working-professional',
    question: 'Can I study while working full time?',
    answer:
      'Several centres run evening and weekend batches specifically for working professionals. Availability varies by centre, so it is worth checking with the centre nearest you.',
    topic: 'courses',
    personaRelevance: { professional: 1 },
    relatedCourseSlugs: ['cloud-computing-engineer-ai', 'ethical-hacking-specialist', 'cloud-computing-professional-ai'],
  },
  {
    id: 'faq-no-background',
    question: 'Can I join without any technical background?',
    answer:
      'Yes. PC Hardware Support is designed for learners with no prior technical experience, and it leads into the longer diploma and degree tracks.',
    topic: 'courses',
    personaRelevance: { student: 0.9, parent: 0.8, professional: 0.6 },
    relatedCourseSlugs: ['pc-hardware-support'],
  },
  {
    id: 'faq-placement-support',
    question: 'What does placement support include?',
    answer:
      'Placement support covers interview preparation, profile building and introductions to hiring employers. Specific outcomes depend on the course, the centre and the individual learner, so a counsellor can give you the picture for the centre you are considering.',
    topic: 'placement',
    personaRelevance: { parent: 1, student: 0.9, professional: 0.7 },
  },
  {
    id: 'faq-certifications',
    question: 'Which industry certifications are included?',
    answer:
      'Courses are built around recognised industry certifications including Red Hat and CompTIA tracks. The exact certifications included depend on the course you choose.',
    topic: 'courses',
    personaRelevance: { student: 0.8, professional: 0.9, parent: 0.7 },
  },
  {
    id: 'faq-centre-locations',
    question: 'Where are Jetking centres located?',
    answer:
      'Jetking operates centres across India. You can browse centres by city to find the one nearest you, along with the courses each centre offers.',
    topic: 'centres',
    personaRelevance: { student: 0.9, parent: 0.9 },
  },
  {
    id: 'faq-franchise-enquiry',
    question: 'How do I enquire about a Jetking franchise?',
    answer:
      'Franchise enquiries go through a dedicated team. Submitting the franchise enquiry form starts a conversation about territory availability, the operating model and what partnership involves.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-franchise-profile',
    question: 'What is the profile of a Jetking Franchisee?',
    answer:
      'Jetking franchisees typically include: (1) existing entrepreneurs looking for new opportunities in the education business, (2) professionals with 5–7 years of work experience in any industry, and (3) engineers or MBA graduates with a passion to work in the education business.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-franchise-build-centre',
    question: 'Who will build my centre? Can I use my existing centre?',
    answer:
      'We will help you build your centre. You can also use your existing setup, provided it matches Jetking’s specifications.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-franchise-responsibilities',
    question: 'What are the responsibilities of a Franchise?',
    answer:
      'As a Jetking franchise, you will be responsible for: (1) investing to set up the training centre as per Jetking specifications, (2) managing and operating the centre daily, (3) following standard operating procedures and conducting training as per Jetking guidelines, (4) creating strong student word-of-mouth by delivering good quality training and good placements, and (5) generating business through multiple marketing activities in your local area.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-franchise-multiple-centres',
    question: 'Can I own more than one Franchisee?',
    answer:
      'Yes. Depending upon your performance, you can open another Jetking franchise in any location.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-franchise-training',
    question: 'Will I be trained to run a Jetking franchise?',
    answer:
      'Yes. We provide training on A–Z of the education business. This includes training for marketing, branding, technology, delivery, recruitment and other support required for day-to-day operations of your learning centre.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-franchise-technical-training',
    question: 'What kind of technical training will I receive as a franchise?',
    answer:
      'Technical training is provided to your faculty members so they can conduct batches. We also run training programmes to upskill the faculties from time to time.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-franchise-quality',
    question: 'Who enforces quality at Jetking?',
    answer:
      'Jetking is ISO 9001:2015 certified and operates through a comprehensive Quality Management Program. Alongside ISO processes, the QMP supports continual improvement in centre operations and delivers customer satisfaction.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-franchise-start',
    question: 'How do I start a Jetking Franchise?',
    answer:
      'Jetking works according to a quality management system and a comprehensive Quality Management Program that supports continual improvement for centre operations. This helps deliver student satisfaction and centre performance.',
    topic: 'franchise',
    personaRelevance: { franchise: 1 },
  },
  {
    id: 'faq-course-duration',
    question: 'How long do the courses take?',
    answer:
      'Course length ranges from a 4-month foundation course to a 3-year BCA degree. Diploma courses typically run between 9 and 12 months.',
    topic: 'courses',
    personaRelevance: { student: 0.8, professional: 0.9, parent: 0.8 },
  },
  {
    id: 'faq-difference-cloud-cyber',
    question: 'What is the difference between the cloud and cyber security tracks?',
    answer:
      'Cloud courses focus on building and operating infrastructure, while cyber security courses focus on defending it — detecting threats and responding to incidents. Both share networking and operating system fundamentals, and a counsellor can help you decide which suits your goals.',
    topic: 'courses',
    personaRelevance: { student: 0.9, professional: 0.9 },
    relatedCourseSlugs: ['cloud-computing-engineer-ai', 'ethical-hacking-specialist'],
  },
];
