import 'server-only';
import { normalizeMobile } from '@/lib/phone';
import { OTP_RESEND_SECONDS } from './config';
import { generateCode, issueVerifiedToken, verifyVerifiedToken } from './crypto';
import { isSmsConfigured, sendOtpSms } from './sms';
import { checkChallenge, createChallenge, usingDatabase, type CheckResult } from './store';

/**
 * Mobile-number verification for the enquiry forms: send a code by SMS, check it, and hand back a signed
 * token the form includes with its submission. `/api/enquiry` accepts the lead only when that token is valid
 * for the submitted number (see `otpEnforced`).
 */

/** The server requires a verified number on enquiries only when explicitly switched on. */
export function otpEnforced(): boolean {
  return process.env.OTP_ENABLED === 'true';
}

export type SendOutcome =
  | { ok: true; phone: string; resendIn: number; devCode?: string }
  | { ok: false; status: number; error: string; retryAfter?: number };

export async function sendOtp(rawPhone: unknown): Promise<SendOutcome> {
  const phone = typeof rawPhone === 'string' ? normalizeMobile(rawPhone) : null;
  if (!phone) return { ok: false, status: 400, error: 'Enter a valid 10-digit mobile number.' };

  const production = process.env.NODE_ENV === 'production';
  const smsReady = isSmsConfigured();
  // Local development may run without an SMS gateway: the code is returned to the page instead of texted.
  const devEcho = !production && !smsReady && process.env.OTP_DEV_ECHO === 'true';
  if (!smsReady && !devEcho) return { ok: false, status: 503, error: 'OTP verification is not available right now.' };
  // Without a shared database, attempts and throttles are per instance — unsafe to rely on in production.
  if (production && !usingDatabase()) {
    return { ok: false, status: 503, error: 'OTP verification is not available right now.' };
  }

  const code = generateCode();
  const issued = await createChallenge(phone, code);
  if (!issued.ok) {
    return {
      ok: false,
      status: 429,
      retryAfter: issued.retryAfter,
      error:
        issued.reason === 'resend'
          ? `Please wait ${issued.retryAfter} seconds before requesting another code.`
          : 'Too many codes requested for this number. Please try again later.',
    };
  }

  if (devEcho) return { ok: true, phone, resendIn: OTP_RESEND_SECONDS, devCode: code };

  const sms = await sendOtpSms(phone, code);
  if (!sms.ok) {
    // The reason can name the gateway's complaint; it never contains the code or the key.
    console.error('[otp:sms-failed]', sms.reason);
    return { ok: false, status: 502, error: 'We could not send the code. Please try again in a moment.' };
  }
  return { ok: true, phone, resendIn: OTP_RESEND_SECONDS };
}

export type VerifyOutcome = { ok: true; token: string } | { ok: false; status: number; error: string };

const VERIFY_ERRORS: Record<Exclude<CheckResult, 'ok'>, string> = {
  invalid: 'That code is not correct. Please check it and try again.',
  expired: 'That code has expired. Please request a new one.',
  locked: 'Too many incorrect attempts. Please request a new code.',
  none: 'Please request a code first.',
};

export async function verifyOtp(rawPhone: unknown, rawCode: unknown): Promise<VerifyOutcome> {
  const phone = typeof rawPhone === 'string' ? normalizeMobile(rawPhone) : null;
  const code = typeof rawCode === 'string' ? rawCode.replace(/\s/g, '') : '';
  if (!phone || !/^\d{6}$/.test(code)) return { ok: false, status: 400, error: 'Enter the 6-digit code.' };

  const result = await checkChallenge(phone, code);
  if (result !== 'ok') return { ok: false, status: result === 'invalid' ? 400 : 410, error: VERIFY_ERRORS[result] };
  return { ok: true, token: issueVerifiedToken(phone) };
}

/** True when `token` proves `rawPhone` was verified. Used by `/api/enquiry`. */
export function isVerifiedFor(rawPhone: string, token: unknown): boolean {
  const phone = normalizeMobile(rawPhone);
  return Boolean(phone) && verifyVerifiedToken(token, phone!);
}
