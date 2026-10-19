import type { Post } from '../types';
import migratedPosts from './posts.migrated.json';

/**
 * PLACEHOLDER CONTENT — stands in for the ~136 legacy blog posts migrated in Week 4.
 * `legacyPath` is populated by the migration script and is what
 * `scripts/verify-redirects.ts` asserts against.
 */
const placeholderPosts: Post[] = [
  {
    slug: 'cloud-computing-career-after-12th',
    title: 'Starting a cloud computing career after 12th: what the first three years look like',
    excerpt:
      'A realistic walkthrough of the path from finishing school to a first cloud role — what you study, when you start applying, and what employers actually check.',
    body: [
      {
        type: 'paragraph',
        text: 'Choosing a technical path straight after 12th is less about picking the trendiest term and more about understanding what the first job actually asks of you. Cloud roles at entry level are operational: you are keeping systems running, responding to alerts, and learning the specific environment your employer uses.',
      },
      { type: 'heading', level: 2, text: 'Year one: fundamentals that do not go out of date' },
      {
        type: 'paragraph',
        text: 'Networking and operating systems are the foundation. Every cloud platform is an abstraction over these, and troubleshooting almost always resolves down to them. Learners who skip this stage tend to stall when something breaks in a way the tutorial did not cover.',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'How networks route traffic, and how to read what went wrong',
          'Linux command line fluency — not memorised commands, but comfort',
          'How virtualisation underpins everything a cloud provider sells you',
        ],
      },
      { type: 'heading', level: 2, text: 'Year two: specialisation and certification' },
      {
        type: 'paragraph',
        text: 'This is where the cloud and security tracks separate. Both remain employable; they suit different temperaments. Cloud work rewards people who enjoy building and automating. Security work rewards people who enjoy investigating.',
      },
      { type: 'heading', level: 2, text: 'Year three: the job search starts before you finish' },
      {
        type: 'paragraph',
        text: 'The most common mistake is treating placement as something that begins after the final exam. Internships, project work and certification all carry more weight with employers than the completion date on a certificate.',
      },
    ],
    author: 'Jetking Editorial',
    publishedAt: '2026-06-12',
    updatedAt: '2026-06-12',
    category: 'Careers',
    tags: ['cloud computing', 'after 12th', 'career planning'],
    personaRelevance: { student: 1, parent: 0.8 },
    seo: {
      title: 'Cloud Computing Career After 12th | Jetking',
      description:
        'What a cloud computing career actually looks like in the first three years after 12th — fundamentals, specialisation, certification and when to start job hunting.',
    },
    legacyPath: '/blog/cloud-computing-career-after-12th',
  },
  {
    slug: 'cyber-security-vs-cloud-computing',
    title: 'Cyber security or cloud computing: how to tell which one suits you',
    excerpt:
      'These two tracks look similar from outside and feel very different from inside. A practical way to choose, based on the work rather than the job title.',
    body: [
      {
        type: 'paragraph',
        text: 'Prospective students routinely ask which of these two pays more. It is the wrong question — the pay bands overlap heavily at entry level. The better question is which kind of day you want.',
      },
      { type: 'heading', level: 2, text: 'The shape of the work' },
      {
        type: 'paragraph',
        text: 'Cloud engineering is constructive. You are building, automating and improving systems, and the feedback loop is that something works better than it did. Security is investigative and adversarial. You are looking for what is wrong, often under time pressure, and the feedback loop is that nothing bad happened.',
      },
      {
        type: 'quote',
        text: 'People who enjoy finishing things tend to prefer cloud. People who enjoy finding things tend to prefer security.',
      },
      { type: 'heading', level: 2, text: 'What both require' },
      {
        type: 'list',
        ordered: false,
        items: [
          'Solid networking fundamentals — non-negotiable for either',
          'Comfort with Linux',
          'Willingness to keep learning after the certification is signed',
        ],
      },
    ],
    author: 'Jetking Editorial',
    publishedAt: '2026-05-28',
    updatedAt: '2026-05-28',
    category: 'Course Guidance',
    tags: ['cyber security', 'cloud computing', 'course selection'],
    personaRelevance: { student: 0.9, professional: 0.9, parent: 0.5 },
    seo: {
      title: 'Cyber Security vs Cloud Computing | Jetking',
      description:
        'A practical comparison of cyber security and cloud computing careers — the shape of the daily work, shared fundamentals, and how to choose between them.',
    },
    legacyPath: '/blog/cyber-security-vs-cloud-computing',
  },
  {
    slug: 'switching-to-it-career-at-30',
    title: 'Switching into IT in your thirties: what actually transfers',
    excerpt:
      'Career changers consistently underestimate how much of their existing experience counts. A look at what transfers, what does not, and how to sequence the change.',
    body: [
      {
        type: 'paragraph',
        text: 'The anxiety most career changers bring is that they are starting from zero. In practice, they are not — but the things that transfer are rarely the things they expect.',
      },
      { type: 'heading', level: 2, text: 'What transfers' },
      {
        type: 'list',
        ordered: false,
        items: [
          'Working professionally: meeting deadlines, escalating clearly, handling a difficult stakeholder',
          'Domain knowledge — a banking background is a genuine advantage in BFSI security roles',
          'Judgement about what matters, which is the hardest thing to teach a fresh graduate',
        ],
      },
      { type: 'heading', level: 2, text: 'What does not' },
      {
        type: 'paragraph',
        text: 'Technical fundamentals have to be built properly. There is no shortcut here, and attempting one produces the most common failure mode: a candidate who can operate a tool but cannot diagnose why it stopped working.',
      },
      { type: 'heading', level: 2, text: 'Sequencing the change' },
      {
        type: 'paragraph',
        text: 'Most successful changers do not resign first. Evening or weekend batches, then a period of overlap, then the move. It takes longer and it works more often.',
      },
    ],
    author: 'Jetking Editorial',
    publishedAt: '2026-05-14',
    updatedAt: '2026-05-14',
    category: 'Careers',
    tags: ['career change', 'upskilling', 'working professionals'],
    personaRelevance: { professional: 1 },
    seo: {
      title: 'Switching to IT in Your Thirties | Jetking',
      description:
        'What transfers when you move into IT mid-career, what has to be built from scratch, and how to sequence a career change without resigning first.',
    },
    legacyPath: '/blog/switching-to-it-career-at-30',
  },
  {
    slug: 'what-parents-should-ask-it-institute',
    title: 'Seven questions parents should ask any IT training institute',
    excerpt:
      'A checklist for families evaluating technical training — the questions that separate a substantive course from a well-marketed one.',
    body: [
      {
        type: 'paragraph',
        text: 'Parents funding a technical course are making a significant decision with limited technical context. These questions are designed to be answerable by any institute acting in good faith.',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'What is the recognition status of the qualification, and who recognises it?',
          'What proportion of the last completed batch was placed, and where?',
          'What is the total cost, including certification and examination fees?',
          'Who teaches, and what is their industry background?',
          'What does placement support actually consist of — is it introductions, or is it training?',
          'What happens if my child struggles partway through?',
          'Can I speak to a recent graduate?',
        ],
      },
      { type: 'heading', level: 2, text: 'On placement claims' },
      {
        type: 'paragraph',
        text: 'Ask for the denominator. A placement percentage is only meaningful alongside how many students it was calculated from and whether it counts students who did not complete the course.',
      },
      {
        type: 'paragraph',
        text: 'A serious institute will answer all seven without hesitation. Reluctance on any of them is itself information.',
      },
    ],
    author: 'Jetking Editorial',
    publishedAt: '2026-04-30',
    updatedAt: '2026-04-30',
    category: 'For Parents',
    tags: ['parents', 'choosing a course', 'placement'],
    personaRelevance: { parent: 1, student: 0.4 },
    seo: {
      title: '7 Questions to Ask an IT Institute | Jetking',
      description:
        'A practical checklist for parents evaluating IT training institutes — recognition, placement records, total cost, faculty and support.',
    },
    legacyPath: '/blog/what-parents-should-ask-it-institute',
  },
  {
    slug: 'devops-skills-in-demand',
    title: 'The DevOps skills employers are actually screening for',
    excerpt:
      'Job descriptions list twenty tools. Interviews test about four things. Here is the gap, and what to prioritise.',
    body: [
      {
        type: 'paragraph',
        text: 'DevOps job descriptions have become inventories of every tool the team has ever touched. Interview processes are far narrower, and understanding that difference saves months of misdirected study.',
      },
      { type: 'heading', level: 2, text: 'What gets tested' },
      {
        type: 'list',
        ordered: false,
        items: [
          'Can you debug a failing pipeline you did not write?',
          'Do you understand what a container actually is, beyond the commands?',
          'Can you reason about a production incident under questioning?',
          'Do you write automation that someone else can maintain?',
        ],
      },
      { type: 'heading', level: 2, text: 'What rarely gets tested' },
      {
        type: 'paragraph',
        text: 'Tool-specific syntax recall. Interviewers assume documentation exists. Depth in one toolchain consistently beats shallow familiarity with six.',
      },
    ],
    author: 'Jetking Editorial',
    publishedAt: '2026-04-16',
    updatedAt: '2026-04-16',
    category: 'Industry',
    tags: ['devops', 'hiring', 'skills'],
    personaRelevance: { professional: 1, student: 0.3 },
    seo: {
      title: 'DevOps Skills Employers Screen For | Jetking',
      description:
        'What DevOps interviews really test versus what job descriptions list — pipeline debugging, container fundamentals, incident reasoning and maintainable automation.',
    },
    legacyPath: '/blog/devops-skills-in-demand',
  },
  {
    slug: 'it-training-franchise-india',
    title: 'What running an IT training franchise involves',
    excerpt:
      'An honest look at the operating reality of a training centre — the work, the local dynamics, and where new franchise partners typically underestimate effort.',
    body: [
      {
        type: 'paragraph',
        text: 'Prospective franchise partners generally arrive with a financial model and an underdeveloped picture of the operating work. The model matters, but the operating work determines whether the model holds.',
      },
      { type: 'heading', level: 2, text: 'The work is local' },
      {
        type: 'paragraph',
        text: 'Enrolment is driven by relationships with schools, colleges and local employers in your catchment. National brand recognition opens the conversation; it does not close the admission.',
      },
      { type: 'heading', level: 2, text: 'Where partners underestimate' },
      {
        type: 'list',
        ordered: false,
        items: [
          'Faculty recruitment and retention in a competitive local market',
          'Counsellor capability — it is a specialist skill, not general sales',
          'The seasonality of admissions cycles and the cash-flow discipline it requires',
        ],
      },
      {
        type: 'paragraph',
        text: 'Partners who treat the centre as an operating business rather than a passive investment consistently perform better.',
      },
    ],
    author: 'Jetking Editorial',
    publishedAt: '2026-03-25',
    updatedAt: '2026-03-25',
    category: 'Franchise',
    tags: ['franchise', 'business', 'operations'],
    personaRelevance: { franchise: 1 },
    seo: {
      title: 'Running an IT Training Franchise | Jetking',
      description:
        'The operating reality of an IT training franchise — local enrolment work, faculty retention, counsellor capability and admissions seasonality.',
    },
    legacyPath: '/blog/it-training-franchise-india',
  },
];

/**
 * The blog: the placeholder posts above plus the posts migrated from jetking.com (410, kept under
 * their live slugs, images already local under /media). posts.migrated.json is exported from the
 * admin CMS store, so the deployed site has the same articles whichever CONTENT_SOURCE it runs.
 */
export const posts: Post[] = [...placeholderPosts, ...(migratedPosts as unknown as Post[])];
