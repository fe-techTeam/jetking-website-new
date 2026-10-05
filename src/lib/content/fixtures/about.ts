/**
 * About Us content — full text mirrored from jetking.com/about-us (fetched 2026-08-07).
 * These are the in-repo DEFAULTS: they seed the CMS (`about_page`) and are what the page falls back to
 * when the CMS record is missing or unpublished. The live copy is edited in the admin.
 */
import type { AboutPageContent, Achievement, Leader, Milestone, Partnership } from '../types';


export const ABOUT_HERO = {
  eyebrow: 'Since 1947',
  titleLead: 'Decades of legacy moulding',
  titleAccent: 'the innovators of the future',
  lede: 'India’s foremost computer networking institute, committed to creating a better life for students, franchisees, recruiters, and investors.',
} as const;

export const PURPOSE = [
  {
    title: 'Our vision',
    body: 'To provide economic independence to 10 million people in India and overseas.',
  },
  {
    title: 'Our mission',
    body: 'To become a world-class engine for employment generation through an efficient partnership network.',
  },
  {
    title: 'Our values',
    body: 'Quality. Trust. Self-motivation. Innovation. Hands-on. Learning & teaching. Equanimity.',
  },
] as const;

export const VALUES = [
  'Quality',
  'Trust',
  'Self-motivation',
  'Innovation',
  'Hands-on',
  'Learning & teaching',
  'Equanimity',
] as const;

/**
 * Leadership cards show photo + name + designation only — no bio text on the
 * card face. Where real bio copy exists (the three Directors below), it's
 * available behind a "Read more" toggle (`LeaderCard` in AboutLanding.tsx);
 * cards with no `bio` render without the toggle at all.
 *
 * `photoUrl: undefined` renders an initials placeholder (see `LeaderAvatar` in
 * AboutLanding.tsx) instead of a broken image — real photos for the Directors
 * (new ones, replacing the current three), SGB, the Management Team and the
 * Independent Director are not yet supplied.
 */

export const DIRECTORS: Leader[] = [
  {
    name: 'Mr. Suresh G. Bharwani',
    role: 'Chairman Emeritus',
  },
  {
    name: 'Mr. Avinash Bharwani',
    role: 'Chairman and Director',
    photoUrl: '/about/leaders/avinash.jpg',
    bio: [
      'Avinash Bharwani’s focus area is to grow and maintain Jetking’s vast franchising network. He leads all aspects of the Franchising and Government associations that span across education, skill development, IT and recruitment.',
      'He studied Commerce at Jai Hind College from the University of Mumbai.',
    ],
  },
  {
    name: 'Mr. Harsh Bharwani',
    role: 'Managing Director and CEO',
    photoUrl: '/about/leaders/harsh.jpg',
    bio: [
      'Harsh Bharwani is the CEO and Managing Director of Jetking Infotrain Limited, bringing over two decades of experience in education, technology, and business innovation. He has been a driving force behind Jetking’s global expansion—launching two of the company’s largest owned centers and opening more than a dozen international locations.',
      'Recognized by Business Week as one of the top entrepreneurs, Harsh played a pivotal role in revitalizing Jetking post-COVID, delivering an impressive 40% year-on-year growth. With a mission to empower the next generation, he has personally trained over one million students in employability, success, wellness, and personal development.',
      'A certified success coach, neuro-linguistic hypnotherapist, and author of four bestselling books, Harsh is known for blending mindset mastery with business acumen.',
      'A passionate advocate of Bitcoin, Harsh is leading Jetking’s strategic entry into the digital asset space. Under his leadership, the company has outlined an ambitious multi-phase plan to accumulate up to 18,000 BTC by 2030, beginning with an initial target of 180 BTC within six months, scaling to 1,800 BTC in a year. This visionary approach reflects his belief in Bitcoin’s long-term value and reinforces Jetking’s commitment to staying at the forefront of innovation and financial transformation.',
    ],
  },
  {
    name: 'Mr. Siddarth Bharwani',
    role: 'Joint Managing Director and CFO',
    photoUrl: '/about/leaders/siddarth.jpg',
    bio: [
      'Ambitious about taking his family business to new heights and continue to expand overseas, Siddarth Bharwani is a third-generation entrepreneur. He was previously responsible for rejigging Jetking’s brand image and is now leading the charge to triple the business turnover within the next few years.',
      'He completed his studies from Bond University, Australia and has 8 years of experience in the field of Marketing & Brand Management. Siddarth is a true “Apple” devotee and a tech fanatic.',
    ],
  },
  /** Name not yet supplied — listed last, as the board's independent seat. Hidden until named. */
  {
    name: '',
    role: 'Independent Director',
  },
];

/** Names only — add each `role` once job titles are supplied. */
export const MANAGEMENT_TEAM: Leader[] = [
  { name: 'Meghna' },
  { name: 'Keyur' },
  { name: 'Rajashree' },
  { name: 'Akhilesh' },
  { name: 'Shabnam' },
  { name: 'Anand' },
  { name: 'Dhruti' },
];


/** Legacy timeline — full copy from the live about-us page; years from its markers. */
export const TIMELINE: Milestone[] = [
  {
    year: '1947',
    title: 'Birth of a leader',
    body: 'Jetking Electronics was established by late Shri Gordhandas P Bharwani for trading in electronic goods in various cities across India.',
  },
  {
    year: '1962',
    title: 'Pioneered do-it-yourself electronic kits in India',
    body: 'Jetking was the first to bring the “do-it-yourself” kits to India and laid the foundation of training.',
  },
  {
    year: '1972',
    title: 'Introduced Asia 72, Fairchild & Wildcat transistors',
    body: 'The Company introduced Asia 72, Fairchild and Wildcat transistors.',
  },
  {
    year: '1986',
    title: 'Established as a public limited company through an IPO',
    body: 'The Company became Public Limited and also introduced electronics products, T.V. sets & amplifiers.',
  },
  {
    year: '1990',
    title: 'Launched Jetking School of Electronic Technology',
    body: 'The Company launched its first institute for the training of non-technical students.',
  },
  {
    year: '1999',
    title: 'Microsoft recognition',
    body: 'It became a Microsoft Certified Solution Provider and Certified Technical Education Centre (CTEC).',
  },
  {
    year: '2003',
    title: 'Launched Masters in Network Administration (MNA) course',
    body: 'The most advanced MNA course for graduates was introduced.',
  },
  {
    year: '2007',
    title: 'Pike’s Peak Award for implementing SmartLab Plus',
    body: 'Honoured with the prestigious award for implementing the unique teaching methodology, SmartLab Plus.',
  },
  {
    year: '2008',
    title: '“Best Franchisor Award” and launched Heathkit Omnifirm',
    body: 'Jetking was felicitated with the “Best Franchisor Award” and introduced the computer fault simulator kit to develop the troubleshooting skills of IT students.',
  },
  {
    year: '2009',
    title: 'Launched JetEdge',
    body: 'A soft-skills program to equip students with job skills, JetEdge was launched.',
  },
  {
    year: '2010',
    title: 'Launched Smartgrad, Ethical Hacking and Saral courses',
    body: 'A course designed for graduates to give them a leading position in the IT space. Understanding the concerns of misuse of technology, Jetking launched an ethical hacking course to produce skilled professionals in this space. The Saral course was started to teach the basics of computers to lay people.',
  },
  {
    year: '2011',
    title: 'Alliance with Wipro and IBM, and launched the Do-It-Yourself Tablet PC course',
  },
  {
    year: '2012',
    title: 'Launched centres in Vietnam',
    body: 'Jetking started its international operations and launched its first centre in Vietnam.',
  },
  {
    year: '2013',
    title: 'Brand revamp with new identity and FICCI Award',
    body: 'After 65 years we revamped our brand identity, showcasing the legacy of the brand and creating a fresh recall amongst consumers while retaining brand popularity. Jetking was felicitated with the FICCI LEAPVAULT Skills Champion of India Award for its extraordinary contribution to skill development in India. Launched centres in Nepal and Ghana: expanding our footprint in the international market, we launched centres in Nepal and Ghana this year.',
  },
  {
    year: '2014',
    title: 'Brand Trust Award and Lokmat Corporate Excellence Award',
    body: 'Jetking Infotrain has been ranked as the No.1 most trusted brand in computer hardware training in India. It also showed a remarkable increase in overall ranking, coming in at 369 as opposed to 670 in the year 2013. The report is compiled to showcase the trustworthiness and affinity of the general public towards the brands. Jetking bagged the Lokmat Award for Corporate Excellence in IT Training & Placement.',
  },
  {
    year: '2015',
    title: 'ASSOCHAM National Education Summit Excellence Award & Computer Education Institute of the Year',
    body: 'Jetking has been honoured as the Best Vocational Training Institute with Job Placements at the 5th National Awards on Excellence in Education.',
  },
  {
    year: '2018',
    title: 'Launch of technology courses and specialisation in AWS, IoT and Ethical Hacking',
  },
  {
    year: '2019',
    title: 'VR pedagogy and Delhi Capitals partnership',
    body: 'Introduced the concept of Virtual Reality (VR) to understand Jetking course pedagogy. Became the Official IT Skills Training partner of the Delhi Capitals IPL Team.',
  },
  {
    year: '2021',
    title: 'Launched Blockchain Technology courses',
  },
  {
    year: '2022',
    title: 'BW Education Under 40 Award, and launched Metaverse, Gaming and Blockchain courses',
  },
  {
    year: '2023',
    title: 'Franchise Award 2023',
  },
  {
    year: '2024',
    title: 'Launched Chip Design & Semiconductor courses; tie-up with Pearson & Lincoln University',
  },
  {
    year: '2025',
    title: 'Toward the Future',
    body: 'Jetking is charting its next chapter as The First Bitcoin Treasury Company in India, with a multi-phase plan to accumulate up to 18,000 BTC by 2030.',
    link: { href: 'https://www.jetking.org', label: 'jetking.org' },
  },
];


export const ACHIEVEMENTS: Achievement[] = [
  {
    title: 'Limca Book of Records',
    body: 'Jetking received an official entry into the Limca Book of Records by achieving a record number of 11,451 placements.',
    imageSrc: '/about/achievements/limca.png',
  },
  {
    title: 'Best Vocational Training Institute Award',
    body: 'Jetking was honoured with the title Best Vocational Training Institute with Job Placements.',
    imageSrc: '/about/achievements/vocational.png',
  },
  {
    title: 'Great Place to Work Certified',
    body: 'The Great Place to Work certification program is the first step of an organization in its journey to build a high-trust, high-performance culture, and our organization successfully accomplished this milestone in 2019 and 2023 as well.',
    imageSrc: '/about/achievements/gptw.png',
  },
  {
    title: 'Most Trusted Brand in Networking Training',
    body: 'Jetking was awarded the Brand Trust Award. The award is compiled to showcase the trustworthiness and affinity of the general public towards the brand Jetking. We were ranked No. 1 most trusted brand in Networking training.',
    imageSrc: '/about/achievements/brand-trust.png',
  },
  {
    title: 'Largest Training Partner Award',
    body: 'Jetking Infotrain Ltd has been recognized as the Largest Training Partner by Red Hat in India. This recognition once again positions Jetking as the institute committed to building the careers of many young IT aspirants across sectors.',
    imageSrc: '/about/achievements/redhat.png',
  },
  {
    title: 'Skills Champion Awards (FICCI)',
    body: 'Jetking was felicitated with the FICCI LEAPVAULT Skills Champion of India Award for its extraordinary contribution to skill development in India.',
    imageSrc: '/about/achievements/ficci.png',
  },
  {
    title: 'Pike’s Peak Award',
    body: 'Pioneering the SmartLabPlus learning methodology, designed, developed and deployed under Mr. Suresh G Bharwani’s guidance, Jetking won the Pike’s Peak Award in 2007 towards developing the most advanced learning technique in India.',
    imageSrc: '/about/achievements/pikes-peak.png',
  },
  {
    title: 'Best Franchisor Award',
    body: 'Jetking Infotrain Limited was also awarded the Best Franchisor Award by Franchise India.',
    imageSrc: '/about/achievements/franchisor.png',
  },
];


export const PARTNERSHIPS: Partnership[] = [
  {
    name: 'NSDC',
    body: 'National Skill Development Corporation — skilling and certification alignment.',
    logo: '/affiliations/nsdc.png',
  },
  {
    name: 'Lincoln University',
    body: 'Degree and certification tie-up for select courses.',
    logo: '/university-partners/lincoln-university.png',
  },
  {
    name: 'Yenepoya University',
    body: 'UGC-recognised postgraduate degrees, including the MCA in Cloud Computing & Cyber Security.',
    logo: '/university-partners/yenepoya.png',
  },
];

/** The whole page as one CMS document (mutable copies of the constants above). */
export const aboutDefaults: AboutPageContent = {
  id: 'about',
  hero: { ...ABOUT_HERO },
  purpose: PURPOSE.map((p) => ({ ...p })),
  values: [...VALUES],
  directors: DIRECTORS.map((d) => ({ ...d, bio: d.bio ? [...d.bio] : undefined })),
  managementTeam: MANAGEMENT_TEAM.map((m) => ({ ...m })),
  timeline: TIMELINE.map((m) => ({ ...m, link: m.link ? { ...m.link } : undefined })),
  achievements: ACHIEVEMENTS.map((a) => ({ ...a })),
  partnerships: PARTNERSHIPS.map((p) => ({ ...p })),
};
