import { content } from '@/lib/content';

/**
 * Public Jetking AI on/off — single CMS switch (`chatbot_settings.enabled`,
 * Admin → Assistant settings → Availability). When false, entry points stay
 * hidden and `/chatbot` + chat APIs are unavailable.
 */
export async function isChatbotPubliclyEnabled(): Promise<boolean> {
  const settings = await content.getChatbotSettings();
  return settings.enabled;
}
