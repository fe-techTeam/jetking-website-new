/**
 * Placements content — mirrored from jetking.com/placements (fetched 2026-08-18).
 * These are the in-repo DEFAULTS: they seed the CMS (`placements_page`) and are what the pages fall back
 * to when the CMS record is missing or unpublished. The live copy is edited in the admin.
 * Names, companies and quotes are Jetking's own published placement records;
 * nothing here is invented. No figure implies a guarantee — see the summary
 * disclaimer, which is load-bearing, not decorative.
 */

import type {
  PlacedCandidate,
  PlacementProcessStep as ProcessStep,
  PlacementsPageRecord,
  PlacementTestimonial as Testimonial,
  StudentBenefit,
  VideoTestimonial,
} from '../types';

export const PLACEMENTS_HERO = {
  eyebrow: 'Placements',
  titleLead: 'Career growth begins with',
  titleAccent: 'the right placement',
  lede: "Gain the upper hand through Jetking's network of industry and placement partners — real preparation, real introductions to hiring companies.",
} as const;

/** Deliberately no promised numbers here — see design-system/MASTER.md, "unverified claims stay unpublished". */
export const PLACEMENT_DISCLAIMER =
  'Placement support is real work Jetking does on a learner’s behalf: resume preparation, interview practice and introductions to hiring partners where available. It is not a guarantee — outcomes depend on the course, the centre, the local employer market and the individual learner.';


export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    title: 'Complete the training',
    description: 'Build strong technical and practical skills.',
  },
  {
    step: '02',
    title: 'Biodata preparation',
    description: 'Create a professional resume with guidance.',
  },
  {
    step: '03',
    title: 'Mock interviews',
    description: 'Practice with industry-style interview rounds.',
  },
  {
    step: '04',
    title: 'Student interviews',
    description: 'Get introduced to hiring partners where available.',
  },
  {
    step: '05',
    title: 'Appointment letter',
    description: 'Start the next step of your career journey.',
  },
];


export const STUDENT_BENEFITS: StudentBenefit[] = [
  { title: 'Learn practically', description: 'Hands-on training with real-world tools.' },
  { title: 'English speaking', description: 'Improve communication for the workplace.' },
  {
    title: 'Interview skills',
    description: 'Build confidence and learn interview techniques.',
  },
  { title: 'Get jobs', description: 'Explore opportunities through our hiring network.' },
  { title: 'Mock Interviews', description: 'Practice with structured feedback.' },
  { title: 'AI Bot Interviews', description: 'Experience realistic interview scenarios with AI.' },
  { title: 'Presentation', description: 'Learn to present your skills effectively.' },
];


/** A sample of Jetking's own published placement records — not an exhaustive list. */
export const PLACED_CANDIDATES: PlacedCandidate[] = [
  { name: 'Abhay Singh', company: 'Reisnet' },
  { name: 'Niloy Saha', company: 'Laundryheap' },
  { name: 'Vaibhav Mishra', company: 'Futwork' },
  { name: 'Umang Tiwari', company: 'Vishwada Enterprises' },
  { name: 'Amit Gupta', company: 'Meenakshi Infotech' },
  { name: 'Suresh Hansda', company: 'Bharti Airtel Limited' },
  { name: 'Pavan T', company: 'Oraiyan Groups' },
  { name: 'Ravi Kumar', company: 'Birla Corp' },
  { name: 'Aravind Andugula', company: 'Sai Hadya Hospital' },
  { name: 'Soumyajeet Mandal', company: 'Cygnus Group' },
  { name: 'Saurav Sarma', company: 'ICICI Insurance' },
  { name: 'Mohd Qasim', company: 'Wipro' },
];


export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Ashwani Jaiswal',
    role: 'Support Engineer, Apple',
    quote:
      'After completing my course from Jetking in 2015, I joined Apple Inc. as a Service Engineer, and now I am a Sr. Service Engineer with them.',
  },
  {
    name: 'Prakhar Dixit',
    role: 'Service Engineer, Apple',
    quote: 'This course helped me acquire thorough knowledge of hardware and networking.',
  },
  {
    name: 'Mr. Satish Dhiman',
    role: 'Chief Business Manager, PNB MetLife',
    quote: "It's a really good approach to meet employers and encourage job seekers.",
  },
  // The following three are mirrored from the jetking.com homepage (fetched 2026-08-21), not /placements.
  {
    name: 'Preeti Madan',
    role: 'Quatrro',
    quote:
      "Before joining Jetking, I was not sure what to do with my career. But after completing the course, I got the right platform to start my career. It's been nearly 5 years and I have never looked back. I am very satisfied with my decision to join Jetking which has proved that there is no disadvantage of being a girl in technical domain.",
  },
  {
    name: 'Nikhil Pathare',
    role: 'Tata Consultancy Services',
    quote:
      'Without Jetking, I don’t know where I would be. You made a major difference in my life. All those times that you have gone the extra mile for me, I really did notice. Your belief in me makes me believe in myself.',
  },
  {
    name: 'Abhishek',
    role: 'IBM-Collabera',
    quote:
      'I am very happy with Jetking for the placement assistance, even after my first job. I am grateful for all the guidance and technical knowledge provided. At Jetking we are not only trained in the technical domain as well as I have also improved my communication skills and confidence in appearing for interviews.',
  },
];


/**
 * Video placement testimonials — real videos embedded live on jetking.com,
 * confirmed via YouTube/Vimeo oEmbed (fetched 2026-08-21): one from Jetking's
 * official YouTube channel (embedded on /placements), three from Jetking's
 * official Vimeo account (embedded on the jetking.com homepage). No video
 * content or thumbnail here is generated or guessed — every id resolves to a
 * currently-live Jetking-published video.
 */
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  {
    name: 'Prajwal',
    title: 'Placement testimonial — Jetking Blockchain',
    provider: 'youtube',
    videoId: 'Q4-k5emEc54',
    thumbnail: '/media/video/youtube-Q4-k5emEc54.webp',
  },
  {
    name: 'Shivam Thakur',
    title: 'Placement testimonial — Jetking Blockchain',
    provider: 'vimeo',
    videoId: '662754940',
    thumbnail: '/media/video/vimeo-662754940.webp',
  },
  {
    name: 'Srinivas Balaji',
    title: 'Placement testimonial — Jetking Blockchain',
    provider: 'vimeo',
    videoId: '662750796',
    thumbnail: '/media/video/vimeo-662750796.webp',
  },
  {
    name: 'Anandhu Krishnan',
    title: 'Placement testimonial — Jetking Blockchain',
    provider: 'vimeo',
    videoId: '672638981',
    thumbnail: '/media/video/vimeo-672638981.webp',
  },
];

export const PLACEMENTS_CONTACT = {
  phone: '07666830000',
  tel: 'tel:07666830000',
  email: 'info@jetking.com',
} as const;

/**
 * Illustrative offer letters, one per sector. They use a placeholder company ("Company Name"),
 * carry a SAMPLE watermark and name no real employer, logo or salary — the same honesty rule as
 * the rest of this page. To show a real letter, drop a consented image or PDF page under
 * public/placements/offers and point `src` at it.
 */
export const OFFER_LETTER_SAMPLES = [
  { src: '/placements/offers/sample-offer-it-services.svg', title: 'Associate Systems Engineer', sector: 'IT services & consulting' },
  { src: '/placements/offers/sample-offer-cloud-hosting.svg', title: 'Cloud Support Engineer', sector: 'Cloud & hosting' },
  { src: '/placements/offers/sample-offer-banking.svg', title: 'IT Support Executive', sector: 'Banking & financial services' },
  { src: '/placements/offers/sample-offer-telecom.svg', title: 'Network Administrator', sector: 'Telecom & networking' },
  { src: '/placements/offers/sample-offer-ecommerce.svg', title: 'Technical Support Engineer', sector: 'Retail & e-commerce' },
  { src: '/placements/offers/sample-offer-security.svg', title: 'Junior Security Analyst', sector: 'Managed security services' },
].map((letter) => ({ ...letter, alt: `Sample offer letter for a ${letter.title}, for illustration only` }));

/**
 * Recruiter logos, as shown under "Brands that are our placement partners" on the live
 * jetking.com/placements page (cropped from that page's logo collage). Order follows the live page.
 * Logos are the owners' trademarks, shown as published by Jetking; the disclaimer below is the
 * note Jetking prints with its own recruiter collage.
 */
export const RECRUITERS = [
  { name: 'Microsoft', src: '/logos/employers/microsoft.svg' },
  { name: 'Tech Mahindra', src: '/logos/employers/tech-mahindra.svg' },
  { name: 'IBM', src: '/logos/employers/ibm.svg' },
  { name: 'Amazon', src: '/logos/employers/amazon.svg' },
  { name: 'Samsung', src: '/logos/employers/samsung.svg' },
  { name: 'The Times of India', src: '/logos/employers/times-of-india.svg' },
  { name: 'Infosys', src: '/logos/employers/infosys.svg' },
  { name: 'Wipro', src: '/placements/partners/wipro.svg' },
  { name: 'Tikona Digital Networks', src: '/placements/recruiters/tikona.png' },
] as const;

export const RECRUITERS_DISCLAIMER =
  'Placements are subject to recruitment norms. Jetking does not guarantee placements in the above organisations.';

/** Headline placement figures shown on the home and course pages. */
export const PLACEMENT_STATS = {
  partners: '5000+',
  learnersPlaced: { value: '3586', label: 'Learners placed in 2025' },
} as const;

/** The whole page as one CMS document (mutable copies of the constants above). */
export const placementsDefaults: PlacementsPageRecord = {
  id: 'placements',
  hero: { ...PLACEMENTS_HERO },
  disclaimer: PLACEMENT_DISCLAIMER,
  processSteps: PROCESS_STEPS.map((x) => ({ ...x })),
  studentBenefits: STUDENT_BENEFITS.map((x) => ({ ...x })),
  placedCandidates: PLACED_CANDIDATES.map((x) => ({ ...x })),
  testimonials: TESTIMONIALS.map((x) => ({ ...x })),
  videoTestimonials: VIDEO_TESTIMONIALS.map((x) => ({ ...x })),
  contact: { phone: PLACEMENTS_CONTACT.phone, email: PLACEMENTS_CONTACT.email },
  offerLetters: OFFER_LETTER_SAMPLES.map(({ src, title, sector }) => ({ src, title, sector })),
  recruiters: RECRUITERS.map((x) => ({ ...x })),
  recruitersDisclaimer: RECRUITERS_DISCLAIMER,
  stats: { partners: PLACEMENT_STATS.partners, learnersPlaced: { ...PLACEMENT_STATS.learnersPlaced } },
};
