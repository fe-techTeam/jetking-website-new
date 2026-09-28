import { publicEnv } from '@/lib/config/env';

/**
 * Conversation config for the Jetking AI control panel.
 *
 * Topic starters only — persona is inferred from the question (server +
 * utterance cues), not chosen via CTA chips.
 */

export type IntentKey =
  | 'welcome'
  | 'courses'
  | 'locations'
  | 'placements'
  | 'demo'
  | 'fees'
  | 'studentCorner'
  | 'blogs'
  | 'faqs'
  | 'counselor'
  | 'enquire';

export interface Chip {
  label: string;
  /** Sent verbatim to the knowledge engine. */
  query?: string;
  /** Opens another conversation starter instead of querying. */
  intent?: IntentKey;
  /**
   * Triggers the browser's Geolocation API instead of sending `query`
   * directly — see JetkingAiClient's `useMyLocation` handler, which asks for
   * the permission prompt and then sends the resolved coordinates.
   */
  geolocate?: boolean;
}

export interface Starter {
  /** The assistant's opening line when this intent is triggered. */
  message: string;
  chips?: Chip[];
}

const COURSE_CHIPS: Chip[] = [
  { label: '💻 Hardware & Networking', query: 'Tell me about the Hardware and Networking course' },
  { label: '☁️ Cloud Computing', query: 'Tell me about the Cloud Computing course' },
  { label: '🔒 Cyber Security', query: 'Tell me about the Cyber Security course' },
  { label: '🤖 AI & Data Science', query: 'Tell me about the AI and Data Science course' },
];

export const STARTERS: Record<IntentKey, Starter> = {
  welcome: {
    message:
      "👋 Hi, I'm Jetking AI — your career assistant.\n\nAsk me anything about courses, fees, placements or centres. You can type naturally, in English or Hinglish.\n\nWhat's on your mind?",
    chips: [
      { label: '🎓 Explore courses', intent: 'courses' },
      { label: '💰 Fees & EMI', intent: 'fees' },
      { label: '💼 Placements', intent: 'placements' },
      { label: '📍 Nearest centre', intent: 'locations' },
    ],
  },

  courses: {
    message:
      '👋 Looking for the right course? I can help you choose based on your career goals. Which area interests you?',
    chips: COURSE_CHIPS,
  },

  locations: {
    message:
      "📍 Which city are you in? I'll find the nearest Jetking centre and share the contact details.",
    chips: [
      { label: '📌 Use my current location', geolocate: true },
      { label: 'Mumbai', query: 'Jetking centre in Mumbai' },
      { label: 'Delhi', query: 'Jetking centre in Delhi' },
      { label: 'Pune', query: 'Jetking centre in Pune' },
      { label: 'Ahmedabad', query: 'Jetking centre in Ahmedabad' },
    ],
  },

  placements: {
    message:
      "💼 Here's what I can show you about Jetking placements and job support. What would you like to see?",
    chips: [
      { label: 'Placement partners', query: 'Which companies recruit from Jetking?' },
      { label: 'Placement support', query: 'Does Jetking guarantee placement after the course?' },
      { label: 'Career paths', query: 'What jobs can I get after a Jetking course?' },
      { label: 'Success stories', query: 'Jetking student success and placement record' },
    ],
  },

  demo: {
    message:
      "📅 Happy to set up a free demo class for you. Which course would you like to try? I'll share how to book it.",
    chips: [
      { label: 'Cyber Security', query: 'Book a free demo class for Cyber Security' },
      { label: 'Cloud Computing', query: 'Book a free demo class for Cloud Computing' },
      { label: 'Networking', query: 'Book a free demo class for Hardware and Networking' },
      { label: 'Talk to team', intent: 'counselor' },
    ],
  },

  fees: {
    message:
      '💰 Fees vary by course, centre and intake — a counsellor confirms the exact figure. Which track are you asking about? I can also explain EMI options in general.',
    chips: COURSE_CHIPS.map((c) => ({
      label: c.label,
      query: `What are the fees and EMI options for ${c.label.replace(/^[^\w]+/, '').trim()}?`,
    })),
  },

  studentCorner: {
    message:
      '📚 Student Corner covers certifications, learning resources and support. What do you need?',
    chips: [
      { label: 'Certifications', query: 'What certifications does Jetking offer?' },
      { label: 'Eligibility', query: 'What is the eligibility for Jetking courses?' },
      { label: 'Course duration', query: 'How long are Jetking courses?' },
      { label: 'Talk to counsellor', intent: 'counselor' },
    ],
  },

  blogs: {
    message:
      "📰 Jetking's blog articles aren't part of my knowledge base yet, so I can't pull blog posts right now. I can still help you directly with course details, career guidance, placements, fees or centres — what would you like to know?",
  },

  faqs: {
    message: '❓ Ask me anything. Here are some questions people commonly start with:',
    chips: [
      { label: 'Eligibility', query: 'What is the eligibility for Jetking courses?' },
      { label: 'Can I join after 10th?', query: 'Can I join Jetking after 10th?' },
      { label: 'Placement support', query: 'Does Jetking guarantee placement?' },
      { label: 'Fees & EMI', intent: 'fees' },
      { label: 'Study while working?', query: 'Can I study at Jetking while working full time?' },
      { label: 'Franchise enquiry', query: 'How do I enquire about a Jetking franchise?' },
    ],
  },

  counselor: {
    message:
      "📞 I can connect you with a Jetking counsellor. Share your city or preferred course and I'll point you to the right team — or reach out directly below.",
    chips: [
      { label: 'Contact Jetking', query: 'How do I contact Jetking?' },
      { label: 'Enquire now', intent: 'enquire' },
    ],
  },

  enquire: {
    message:
      "🔴 Great — let's get you started. Tell me your city and the course you're interested in, and I'll guide you to the Jetking admissions team.",
    chips: [
      { label: 'Courses after 12th', query: 'Which courses can I do after 12th?' },
      { label: 'Contact Jetking', query: 'How do I contact Jetking?' },
    ],
  },
};

export const WHATSAPP_URL = publicEnv.whatsappUrl;
