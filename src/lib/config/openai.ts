import { envText, stripTrailingSlash } from './env';

/**
 * The chat-completions endpoint every OpenAI call goes through (the assistant, its planner and persona inference).
 *
 * Default is OpenAI itself. Set `OPENAI_BASE_URL` to route through a proxy, a gateway, or an OpenAI-compatible
 * provider without touching code (e.g. `https://my-gateway.example.com/v1`). Read per call, server-side only: a
 * non-public variable is simply undefined in the browser bundle.
 */
export function openaiChatUrl(): string {
  return `${stripTrailingSlash(envText(process.env.OPENAI_BASE_URL, 'https://api.openai.com/v1'))}/chat/completions`;
}
