import 'server-only';

/**
 * Sends the OTP text through the SMS gateway (an HTTP GET API: `http-tokenkeyapi.php`).
 *
 * The auth key travels in the query string because that is how the gateway works, so the request URL is a
 * secret: it is never logged, never put in an error, and never returned to the browser. The message must
 * match the DLT-registered template word for word (only the code varies), or the operator drops it:
 *   "Your OTP code is {#var#} - Jetking Infotrain Ltd"
 *
 * Configuration (all server-side env):
 *   SMS_AUTH_KEY            required — without it SMS is "not configured"
 *   SMS_ENDPOINT            default https://msg.clickconnectmedia.in/http-tokenkeyapi.php
 *   SMS_SENDER_ID           default JTKING
 *   SMS_ROUTE               default 1
 *   SMS_OTP_TEMPLATE_ID     the DLT template id for the OTP message
 */

const DEFAULT_ENDPOINT = 'https://msg.clickconnectmedia.in/http-tokenkeyapi.php';
const TIMEOUT_MS = 8_000;

export function isSmsConfigured(): boolean {
  return Boolean(process.env.SMS_AUTH_KEY && process.env.SMS_OTP_TEMPLATE_ID);
}

export function otpMessage(code: string): string {
  return `Your OTP code is ${code} - Jetking Infotrain Ltd`;
}

export type SmsResult = { ok: true } | { ok: false; reason: string };

/** `phone` is the ten-digit mobile number; the gateway wants it with the 91 country code. */
export async function sendOtpSms(phone: string, code: string, fetchImpl: typeof fetch = fetch): Promise<SmsResult> {
  if (!isSmsConfigured()) return { ok: false, reason: 'sms not configured' };

  const url = new URL(process.env.SMS_ENDPOINT || DEFAULT_ENDPOINT);
  url.search = new URLSearchParams({
    'authentic-key': process.env.SMS_AUTH_KEY!,
    senderid: process.env.SMS_SENDER_ID || 'JTKING',
    route: process.env.SMS_ROUTE || '1',
    number: `91${phone}`,
    message: otpMessage(code),
    templateid: process.env.SMS_OTP_TEMPLATE_ID!,
  }).toString();

  try {
    const response = await fetchImpl(url, { method: 'GET', signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store' });
    const body = (await response.text().catch(() => '')).slice(0, 300);
    if (!response.ok) return { ok: false, reason: `gateway HTTP ${response.status}` };
    // The gateway answers 200 with a text/JSON body; an error is spelled out in it.
    if (/\b(error|fail(ed|ure)?|invalid|unauthori[sz]ed|insufficient)\b/i.test(body)) {
      // The gateway may echo the request back: scrub the key and any long digit run (the code, the number).
      const key = process.env.SMS_AUTH_KEY ?? '';
      const scrubbed = (key ? body.split(key).join('***') : body).replace(/\d{6,}/g, '***');
      return { ok: false, reason: `gateway said: ${scrubbed.slice(0, 120)}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.name === 'TimeoutError' ? 'gateway timed out' : 'gateway unreachable' };
  }
}
