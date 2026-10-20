import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AppProviders } from '@/components/providers/app-providers';
import { pathForcedNoindex } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const noindex = await pathForcedNoindex('/chatbot');
  return {
    title: 'Chat with Jetking AI',
    description: 'Your Jetking learning assistant — courses, placements, fees and more.',
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export default function ChatbotLayout({ children }: { children: ReactNode }) {
  return (
    <AppProviders>
      <div className="chatbot-app h-dvh overflow-hidden antialiased">{children}</div>
    </AppProviders>
  );
}
