import type { ChatbotSettings } from '../types';

/** What the assistant says today — so an unedited settings record changes nothing. */
export const chatbotSettingsDefaults: ChatbotSettings = {
  id: 'chatbot',
  enabled: true,
  disabledMessage: 'Jetking AI is taking a short break. Please use the enquiry form and a counsellor will get back to you.',
  name: 'Jetking AI',
  welcomeMessage:
    "👋 Hi, I'm Jetking AI — your career assistant.\n\nAsk me anything about courses, fees, placements or centres. You can type naturally, in English or Hinglish.\n\nWhat's on your mind?",
  welcomeChips: [
    { label: '🎓 Explore courses', query: 'What courses does Jetking offer?' },
    { label: '💰 Fees & EMI', query: 'What are the course fees and EMI options?' },
    { label: '💼 Placements', query: 'Tell me about Jetking placements and recruiters' },
    { label: '📍 Nearest centre', query: 'Where is the nearest Jetking centre?' },
  ],
  inputPlaceholder: 'Ask Jetking AI… English or Hinglish',
  noMatchReply:
    "I don't have verified information about that, so I'd rather not guess. A Jetking counsellor can answer it properly — and meanwhile I can help with courses, fees, eligibility, placements, or finding a centre near you. What would you like to know?",
  offTopicReply:
    "That's outside what I can help with — I'm focused on Jetking career guidance. I can help with Jetking courses, fees, eligibility, placements, centres, demo classes and franchise enquiries. Is there something along those lines I can help you with?",
};
