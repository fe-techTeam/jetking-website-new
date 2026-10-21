'use client';

import { createContext, useContext, type ReactNode } from 'react';

/**
 * Whether Jetking AI is on for visitors (Admin → Assistant settings → Availability).
 * When false, every public entry point is hidden and `/chatbot` / chat APIs are unavailable.
 */
const ChatbotEnabledContext = createContext(true);

export function ChatbotEnabledProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return <ChatbotEnabledContext.Provider value={enabled}>{children}</ChatbotEnabledContext.Provider>;
}

export function useChatbotEnabled(): boolean {
  return useContext(ChatbotEnabledContext);
}
