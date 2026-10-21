import { notFound } from 'next/navigation';
import { JetkingAiClient } from '@/features/jetking-ai/jetking-ai-client';
import { isChatbotPubliclyEnabled } from '@/lib/chatbot/availability';
import { content } from '@/lib/content';

export default async function ChatbotPage() {
  // CMS Availability off = gone from the public site (no page, no API chat).
  if (!(await isChatbotPubliclyEnabled())) notFound();

  const settings = await content.getChatbotSettings();
  return (
    <JetkingAiClient
      config={{
        welcomeMessage: settings.welcomeMessage,
        welcomeChips: settings.welcomeChips,
        inputPlaceholder: settings.inputPlaceholder,
      }}
    />
  );
}
