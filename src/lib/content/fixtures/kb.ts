import type { Faculty, PlacementPage, Policy, HomepageVariant, PersonaRule } from '../types';

export const policies: Policy[] = [
  {
    slug: 'admissions',
    title: 'Admissions policy',
    summary: 'How Jetking evaluates eligibility and enrols students across centres.',
    body: [
      {
        type: 'paragraph',
        text: 'Admissions are handled at the centre level. Counsellors verify eligibility against the published course requirements and guide applicants through documentation and batch selection.',
      },
      {
        type: 'heading',
        level: 2,
        text: 'Eligibility',
      },
      {
        type: 'paragraph',
        text: 'Each course lists its own eligibility on the course page. Degree tracks typically require completion of Class 12; short certifications may accept working professionals with relevant experience.',
      },
    ],
    seo: {
      title: 'Admissions policy',
      description: 'How Jetking handles admissions and eligibility across centres.',
    },
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    slug: 'refund',
    title: 'Refund & fee policy',
    summary: 'High-level fee and refund guidance. Exact figures are centre-specific.',
    body: [
      {
        type: 'paragraph',
        text: 'Course fees vary by centre and batch. Published fee figures on the site are structured data only when Jetking has authorised disclosure. For a quote, speak to a counsellor at your nearest centre.',
      },
    ],
    seo: {
      title: 'Refund and fee policy',
      description: 'Fee and refund guidance for Jetking courses.',
    },
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

export const faculty: Faculty[] = [
  {
    slug: 'ananya-sharma',
    name: 'Ananya Sharma',
    title: 'Lead Instructor — Cloud & Cyber Security',
    bio: 'Ananya teaches cloud architecture and defensive security modules across degree and professional tracks, with a focus on lab-led certification prep.',
    specialisations: ['Cloud', 'Cyber Security', 'AWS'],
    centreSlugs: ['andheri'],
    seo: {
      title: 'Ananya Sharma — Faculty',
      description: 'Lead instructor for cloud and cyber security at Jetking.',
    },
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

export const placements: PlacementPage[] = [
  {
    id: 'main',
    title: 'Placement support',
    summary:
      'Jetking counsellors and placement teams help students prepare for interviews and connect with hiring partners. Outcomes vary by course, centre, and student effort — no placement is guaranteed.',
    body: [
      {
        type: 'paragraph',
        text: 'Placement support includes resume workshops, mock interviews, and introductions to hiring partners where available. Results depend on the student, the market, and the course.',
      },
    ],
    stats: [
      {
        label: 'Hiring partners (illustrative)',
        value: 'See counsellor',
        verified: false,
      },
    ],
    seo: {
      title: 'Placement support',
      description: 'How Jetking supports students with placement preparation.',
    },
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

export const homepageVariants: HomepageVariant[] = [
  {
    id: 'default',
    label: 'Default / unknown',
    banner: {
      eyebrow: "India's trusted IT training brand",
      headline: 'Build a career in cloud, cyber security and IT infrastructure.',
      lede: 'Degree, diploma and certification courses built around industry certifications — taught in person at centres across India.',
    },
    cta: { label: 'Explore courses', href: '/courses' },
    testimonials: [
      {
        id: 't1',
        quote: 'The lab sessions made certification prep feel practical, not theoretical.',
        name: 'Student (placeholder)',
        role: 'Cloud track',
      },
    ],
    stories: [
      {
        id: 's1',
        title: 'From Class 12 to a cloud classroom',
        summary: 'How degree tracks combine study with early employability.',
        href: '/blog',
      },
    ],
    video: {
      title: 'Inside a Jetking classroom',
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      poster: undefined,
    },
  },
  {
    id: 'ai-mumbai',
    label: 'AI Mumbai returning',
    banner: {
      eyebrow: 'Mumbai · AI & emerging tech',
      headline: 'Continue your AI and cloud journey in Mumbai.',
      lede: 'Pick up where you left off — courses and centres near you, with counsellors who know the local batches.',
    },
    cta: { label: 'Explore AI courses in Mumbai', href: '/courses' },
    courseBoost: ['bca-cloud-cyber-security'],
    centreBoost: ['andheri'],
    testimonials: [
      {
        id: 't-mum',
        quote: 'Evening batches made it possible to study while working in Mumbai.',
        name: 'Professional (placeholder)',
        role: 'Mumbai centre',
      },
    ],
    stories: [
      {
        id: 's-mum',
        title: 'Upskilling without leaving your job',
        summary: 'Weekend and evening options at Mumbai centres.',
        href: '/centres/mumbai',
      },
    ],
    video: {
      title: 'Mumbai centre walkthrough',
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
  },
  {
    id: 'student',
    label: 'Student',
    banner: {
      eyebrow: 'After 12th',
      headline: 'Find a degree track that gets you earning while you learn.',
      lede: 'BCA and diploma courses built around industry certifications — no entrance-test gatekeeping.',
    },
    cta: { label: 'Find a course after 12th', href: '/courses' },
    courseBoost: ['bca-cloud-cyber-security', 'pc-hardware-support'],
    testimonials: [
      {
        id: 't-stu-1',
        quote: 'I wanted a degree that was not just theory — the labs made certifications feel achievable.',
        name: 'Riya M.',
        role: 'BCA track · Class of 2025',
      },
      {
        id: 't-stu-2',
        quote: 'Counsellors helped me pick between cloud and cyber without pressure to enrol the same day.',
        name: 'Aarav K.',
        role: 'Diploma track',
      },
    ],
    stories: [
      {
        id: 's-stu-1',
        title: 'From Class 12 to a cloud classroom',
        summary: 'How degree tracks combine study with early employability.',
        href: '/blog',
      },
      {
        id: 's-stu-2',
        title: 'Choosing a track without an entrance-test maze',
        summary: 'What eligibility really looks like after 12th.',
        href: '/courses/bca-cloud-cyber-security',
      },
    ],
    video: {
      title: 'A day in a Jetking classroom',
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
  },
  {
    id: 'professional',
    label: 'Professional',
    banner: {
      eyebrow: 'Upskill',
      headline: 'Compare certification tracks that fit around a full-time job.',
      lede: 'Short and professional courses with evening and weekend options at many centres.',
    },
    cta: { label: 'Compare upskilling tracks', href: '/professional' },
    courseBoost: ['cloud-computing-engineer-ai', 'ethical-hacking-specialist'],
    testimonials: [
      {
        id: 't-pro-1',
        quote: 'Evening batches meant I did not have to quit my job to reskill into cloud.',
        name: 'Neha S.',
        role: 'Working professional · Mumbai',
      },
      {
        id: 't-pro-2',
        quote: 'The DevOps track mapped cleanly to what hiring managers were asking for.',
        name: 'Vikram P.',
        role: 'IT operations → cloud',
      },
    ],
    stories: [
      {
        id: 's-pro-1',
        title: 'Upskilling without leaving your job',
        summary: 'Weekend and evening options at centres near you.',
        href: '/courses',
      },
      {
        id: 's-pro-2',
        title: 'Cloud or cyber — which switch fits your role?',
        summary: 'A practical comparison for mid-career professionals.',
        href: '/blog',
      },
    ],
    video: {
      title: 'Professional track overview',
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
  },
  {
    id: 'parent',
    label: 'Parent',
    banner: {
      eyebrow: 'For parents',
      headline: 'See placement support, fee clarity, and what to ask any institute.',
      lede: 'Trust signals, counsellor conversations, and transparent next steps before you decide.',
    },
    cta: { label: 'Explore the parent path', href: '/parent' },
    courseBoost: ['bca-cloud-cyber-security'],
    testimonials: [
      {
        id: 't-par-1',
        quote: 'We needed fee clarity and a real conversation about placements — not marketing slogans.',
        name: 'Parent of a BCA student',
        role: 'Pune',
      },
      {
        id: 't-par-2',
        quote: 'Visiting the centre and meeting faculty mattered more than any brochure.',
        name: 'Meera D.',
        role: 'Parent · Delhi NCR',
      },
    ],
    stories: [
      {
        id: 's-par-1',
        title: 'Seven questions worth asking any IT institute',
        summary: 'A parent checklist before you commit fees.',
        href: '/blog/what-parents-should-ask-it-institute',
      },
      {
        id: 's-par-2',
        title: 'What placement support actually includes',
        summary: 'Preparation, partners, and what no one can honestly guarantee.',
        href: '/placements',
      },
    ],
    video: {
      title: 'For parents: how Jetking works',
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
  },
  {
    id: 'franchise',
    label: 'Franchise',
    banner: {
      eyebrow: 'Franchise',
      headline: 'Explore the Jetking centre model and unit economics.',
      lede: 'Brand strength, territory guidance, and an honest look at what running a centre involves.',
    },
    cta: { label: 'Explore the franchise model', href: '/franchise' },
    testimonials: [
      {
        id: 't-fra-1',
        quote:
          'We have been running our Jetking centre successfully for the last 26 years and even today we still possess the same enthusiasm, freshness, energy and motivation. This is because of the able support of Jetking — they have always been just one phone call away.',
        name: 'Mr. Rakesh Bharadwaj',
        role: 'Centre Director, Jetking Vikas Puri Centre',
      },
      {
        id: 't-fra-2',
        quote:
          'Being a new franchise partner I needed all the help and support I could get. The franchise team at Jetking not only provided a road map to success, but also guided me at every step of the way.',
        name: 'Mr. C B Rai',
        role: 'Centre Director, Jetking Allahbad Learning Centre',
      },
      {
        id: 't-fra-3',
        quote:
          'Association with Jetking is a matter of pride for me. By becoming a Jetking Affiliate, not only is the career of students in safer hands, but also our future.',
        name: 'Mr. Naveen Sharma',
        role: 'Centre Director, Jetking Jammu, Noida, South Ex., Kanpur Learning Centre',
      },
    ],
    stories: [
      {
        id: 's-fra-1',
        title: 'What running a Jetking centre actually involves',
        summary: 'Territory, operations, and the support model — without the pitch deck gloss.',
        href: '/franchise',
      },
    ],
    video: {
      title: 'Franchise opportunity overview',
      src: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    },
  },
];

export const personaRules: PersonaRule[] = [
  {
    id: 'ai-mumbai-returning',
    label: 'AI Mumbai returning visitor',
    priority: 100,
    matchAll: true,
    conditions: [
      { field: 'location.city', op: 'eq', value: 'Mumbai' },
      { field: 'interest', op: 'contains', value: 'AI' },
      { field: 'returning', op: 'eq', value: true },
    ],
    homepageVariantId: 'ai-mumbai',
    enabled: true,
  },
  {
    id: 'persona-student',
    label: 'Student persona',
    priority: 10,
    matchAll: true,
    conditions: [{ field: 'persona', op: 'eq', value: 'student' }],
    homepageVariantId: 'student',
    enabled: true,
  },
  {
    id: 'persona-professional',
    label: 'Professional persona',
    priority: 10,
    matchAll: true,
    conditions: [{ field: 'persona', op: 'eq', value: 'professional' }],
    homepageVariantId: 'professional',
    enabled: true,
  },
  {
    id: 'persona-parent',
    label: 'Parent persona',
    priority: 10,
    matchAll: true,
    conditions: [{ field: 'persona', op: 'eq', value: 'parent' }],
    homepageVariantId: 'parent',
    enabled: true,
  },
  {
    id: 'persona-franchise',
    label: 'Franchise persona',
    priority: 10,
    matchAll: true,
    conditions: [{ field: 'persona', op: 'eq', value: 'franchise' }],
    homepageVariantId: 'franchise',
    enabled: true,
  },
];
