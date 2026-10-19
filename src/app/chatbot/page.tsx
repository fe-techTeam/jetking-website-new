import { JetkingAiClient } from '@/features/jetking-ai/jetking-ai-client';
import { content } from '@/lib/content';

export default async function ChatbotPage() {
  const settings = await content.getChatbotSettings();

  if (!settings.enabled) {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-2xl font-extrabold text-ink">{settings.name}</h1>
          <p className="mt-3 text-ink-subtle">{settings.disabledMessage}</p>
          <a href="/enquiry" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-jk-600 px-6 text-sm font-bold text-white">
            Enquire now
          </a>
        </div>
      </main>
    );
  }

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
