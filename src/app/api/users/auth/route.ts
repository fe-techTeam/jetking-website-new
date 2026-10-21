import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { clearSessionHint, endSession, getSessionUser, startSession } from '@/lib/users/session';
import {
  DuplicateEmailError,
  createUser,
  getUserByEmail,
  getUserById,
  getUsersByPhone,
  updatePassword,
  type StoredUser,
} from '@/lib/users/store';
import { isConsistentLocation, loadLocationTree } from '@/lib/chatbot/locations';
import type { SiteUser } from '@/lib/users/types';
import { normalizeMobile } from '@/lib/phone';
import { OTP_RESEND_SECONDS } from '@/lib/otp/config';
import { isVerifiedFor, sendOtp, verifyOtp } from '@/lib/otp/service';
import { isMailConfigured, sendMail } from '@/lib/mail';
import { visitorResetEmail } from '@/lib/mail/templates';
import { RESET_TTL_MINUTES, createResetToken, fingerprintMatches, readResetToken } from '@/lib/users/reset-token';
import { absoluteUrl } from '@/lib/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Shared visitor accounts: GET = who am I, POST = sign up / log in / OTP / reset, DELETE = log out.
 * Same table and session for the website and /chatbot (`/api/chatbot/auth` re-exports
 * these handlers). Sign-up and login are rate-limited per client — the brake on
 * password guessing and scripted signup.
 */

const emailSchema = z
  .email()
  .max(200)
  .transform((v) => v.trim().toLowerCase());

/** Spaces, dashes and brackets are stripped, so "+91 98765-43210" is stored as "+919876543210". */
const phoneSchema = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^\+?\d{10,15}$/));

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(200)
  .optional();

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('signup'),
    name: z.string().trim().min(2).max(80),
    phone: phoneSchema,
    state: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(120),
    centre: z.string().trim().max(120).optional(),
    email: emailSchema,
    password: z.string().min(8).max(200),
  }),
  z.object({ action: z.literal('login'), email: emailSchema, password: z.string().min(1).max(200) }),
  z.object({ action: z.literal('login_otp_send'), phone: z.string().min(1).max(20), email: optionalEmail }),
  z.object({
    action: z.literal('login_otp_verify'),
    phone: z.string().min(1).max(20),
    /** Prefer the token from `/api/otp/verify` (same proof enquiry forms use). */
    otpToken: z.string().min(8).max(500).optional(),
    /** Fallback: verify the code here via the shared OTP store. */
    code: z.string().min(4).max(8).optional(),
    email: optionalEmail,
  }),
  z.object({
    action: z.literal('reset_send'),
    email: optionalEmail,
    phone: z.string().min(1).max(20).optional(),
  }),
  /** Email a single-use reset link (works without SMS). The answer never reveals whether the account exists. */
  z.object({ action: z.literal('reset_email_send'), email: emailSchema }),
  z.object({ action: z.literal('reset_email_confirm'), token: z.string().min(20).max(400), newPassword: z.string().min(8).max(200) }),
  z.object({
    action: z.literal('reset_verify'),
    phone: z.string().min(1).max(20),
    otpToken: z.string().min(8).max(500).optional(),
    code: z.string().min(4).max(8).optional(),
    newPassword: z.string().min(8).max(200),
    email: optionalEmail,
  }),
]);

const signupLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 10 });
const loginLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 10 });
const otpLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 15 });
/** Per mailbox, so one address cannot be flooded with reset emails from many clients. */
const resetEmailLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 3 });

const NO_STORE = { 'cache-control': 'no-store' };

/** Verified against when the email is unknown, so "no such account" costs the same time as "wrong password". */
let dummyHash: Promise<string> | undefined;

/** Never send the password hash back to the browser. */
function publicUser(user: StoredUser): SiteUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    state: user.state ?? null,
    city: user.city ?? null,
    centre: user.centre ?? null,
  };
}

/** One readable message for the first invalid field, instead of a generic "check the form". */
function validationMessage(issue: z.core.$ZodIssue | undefined): string {
  const field = issue?.path[issue.path.length - 1];
  if (field === 'password' || field === 'newPassword') return 'Use at least 8 characters for your password.';
  if (field === 'email') return 'Enter a valid email address.';
  if (field === 'name') return 'Enter your name (at least 2 characters).';
  if (field === 'phone') return 'Enter a valid mobile number (10 to 15 digits).';
  if (field === 'state' || field === 'city') return 'Choose your state and city.';
  if (field === 'code') return 'Enter the 6-digit code.';
  return 'Please check the form and try again.';
}

function json(data: unknown, status = 200, extraHeaders?: HeadersInit) {
  return NextResponse.json(data, { status, headers: { ...NO_STORE, ...extraHeaders } });
}

/**
 * Resolve which account a mobile OTP should act on.
 * Phone is not unique — multiple matches without an email need disambiguation.
 */
async function resolveAccountByPhone(
  tenDigits: string,
  email?: string,
): Promise<{ kind: 'none' } | { kind: 'ambiguous' } | { kind: 'one'; user: StoredUser }> {
  let matches = await getUsersByPhone(tenDigits);
  if (email) {
    const lowered = email.trim().toLowerCase();
    matches = matches.filter((u) => u.email === lowered);
  }
  if (matches.length === 0) return { kind: 'none' };
  if (matches.length > 1) return { kind: 'ambiguous' };
  return { kind: 'one', user: matches[0]! };
}

/** OTP send payload. `sent: false` when no matching account (anti-enumeration — same outer shape). */
function otpSentPayload(phone: string, sent: { resendIn: number; devCode?: string } | null) {
  return {
    ok: true as const,
    phone,
    sent: Boolean(sent),
    resendIn: sent?.resendIn ?? OTP_RESEND_SECONDS,
    ...(sent?.devCode ? { devCode: sent.devCode } : {}),
  };
}

/**
 * Proof the mobile was verified — same stack as enquiry forms.
 * Prefer `otpToken` from `/api/otp/verify`; otherwise check `code` via `verifyOtp`.
 */
async function assertMobileVerified(
  tenDigits: string,
  opts: { otpToken?: string; code?: string },
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (opts.otpToken) {
    if (!isVerifiedFor(tenDigits, opts.otpToken)) {
      return { ok: false, status: 400, error: 'Mobile verification expired. Please request a new code.' };
    }
    return { ok: true };
  }
  if (opts.code) {
    const verified = await verifyOtp(tenDigits, opts.code);
    if (!verified.ok) return { ok: false, status: verified.status, error: verified.error };
    return { ok: true };
  }
  return { ok: false, status: 400, error: 'Enter the 6-digit code.' };
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) await clearSessionHint();
  return json({ user });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return json({ ok: false, error: validationMessage(parsed.error.issues[0]) }, 400);
  }
  const input = parsed.data;

  const limiter =
    input.action === 'signup'
      ? signupLimiter
      : input.action === 'login'
        ? loginLimiter
        : otpLimiter;
  const limit = await limiter.check(clientKey(request));
  if (!limit.allowed) {
    return json(
      { ok: false, error: 'Too many attempts. Please try again in a few minutes.' },
      429,
      { 'retry-after': String(limit.retryAfter || 600) },
    );
  }

  if (input.action === 'signup') {
    // Prefer the canonical 10-digit form so OTP login/reset can find this account reliably.
    const normalised = normalizeMobile(input.phone);
    const phone = normalised ?? input.phone;
    const centre = input.centre || undefined;
    const tree = await loadLocationTree();
    if (!isConsistentLocation(tree, { state: input.state, city: input.city, centre })) {
      return json({ ok: false, error: 'Choose your state, city and centre from the lists.' }, 400);
    }
    try {
      const user = await createUser({
        name: input.name,
        email: input.email,
        phone,
        state: input.state,
        city: input.city,
        centre,
        passwordHash: await hashPassword(input.password),
      });
      await startSession(user.id);
      return json({ ok: true, user: publicUser(user) });
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return json(
          { ok: false, error: 'An account with this email already exists. Try logging in instead.' },
          409,
        );
      }
      console.error('[users:signup-failed]', error);
      return json({ ok: false, error: 'Could not create your account. Please try again.' }, 500);
    }
  }

  if (input.action === 'login') {
    try {
      const user = await getUserByEmail(input.email);
      dummyHash ??= hashPassword('jetking-dummy-password');
      const valid = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash));
      if (!user || !valid) {
        return json({ ok: false, error: 'Incorrect email or password.' }, 401);
      }
      await startSession(user.id);
      return json({ ok: true, user: publicUser(user) });
    } catch (error) {
      console.error('[users:login-failed]', error);
      return json({ ok: false, error: 'Could not log you in. Please try again.' }, 500);
    }
  }

  if (input.action === 'login_otp_send') {
    const ten = normalizeMobile(input.phone);
    if (!ten) return json({ ok: false, error: 'Enter a valid 10-digit mobile number.' }, 400);

    const resolved = await resolveAccountByPhone(ten, input.email);
    if (resolved.kind === 'ambiguous') {
      return json(
        {
          ok: false,
          needsEmail: true,
          error: 'More than one account uses this number. Enter the email for your account.',
        },
        409,
      );
    }

    let sent: { resendIn: number; devCode?: string } | null = null;
    if (resolved.kind === 'one') {
      const outcome = await sendOtp(ten);
      if (!outcome.ok) {
        return json(
          { ok: false, error: outcome.error, ...(outcome.retryAfter ? { retryAfter: outcome.retryAfter } : {}) },
          outcome.status,
          outcome.retryAfter ? { 'retry-after': String(outcome.retryAfter) } : undefined,
        );
      }
      sent = { resendIn: outcome.resendIn, ...(outcome.devCode ? { devCode: outcome.devCode } : {}) };
    }

    return json(otpSentPayload(ten, sent));
  }

  if (input.action === 'login_otp_verify') {
    const ten = normalizeMobile(input.phone);
    if (!ten) return json({ ok: false, error: 'Enter a valid 10-digit mobile number.' }, 400);

    const resolved = await resolveAccountByPhone(ten, input.email);
    if (resolved.kind === 'ambiguous') {
      return json(
        {
          ok: false,
          needsEmail: true,
          error: 'More than one account uses this number. Enter the email for your account.',
        },
        409,
      );
    }
    if (resolved.kind === 'none') {
      return json({ ok: false, error: 'That code is not correct. Please check it and try again.' }, 400);
    }

    const proof = await assertMobileVerified(ten, { otpToken: input.otpToken, code: input.code });
    if (!proof.ok) return json({ ok: false, error: proof.error }, proof.status);

    await startSession(resolved.user.id);
    return json({ ok: true, user: publicUser(resolved.user) });
  }

  if (input.action === 'reset_send') {
    const hasEmail = Boolean(input.email);
    const hasPhone = Boolean(input.phone?.trim());
    if (!hasEmail && !hasPhone) {
      return json({ ok: false, error: 'Enter your email or mobile number.' }, 400);
    }

    // Email path: OTP goes to the mobile stored on that account.
    if (hasEmail && input.email) {
      const user = await getUserByEmail(input.email);
      const ten = user ? normalizeMobile(user.phone) : null;
      if (!user || !ten) {
        // Same outer shape whether or not the email exists.
        return json({ ok: true, phone: null, sent: false, resendIn: OTP_RESEND_SECONDS });
      }
      const outcome = await sendOtp(ten);
      if (!outcome.ok) {
        return json(
          { ok: false, error: outcome.error, ...(outcome.retryAfter ? { retryAfter: outcome.retryAfter } : {}) },
          outcome.status,
          outcome.retryAfter ? { 'retry-after': String(outcome.retryAfter) } : undefined,
        );
      }
      return json(
        otpSentPayload(ten, {
          resendIn: outcome.resendIn,
          ...(outcome.devCode ? { devCode: outcome.devCode } : {}),
        }),
      );
    }

    const ten = normalizeMobile(input.phone!);
    if (!ten) return json({ ok: false, error: 'Enter a valid 10-digit mobile number.' }, 400);

    const resolved = await resolveAccountByPhone(ten, input.email);
    if (resolved.kind === 'ambiguous') {
      return json(
        {
          ok: false,
          needsEmail: true,
          error: 'More than one account uses this number. Enter the email for your account.',
        },
        409,
      );
    }

    let sent: { resendIn: number; devCode?: string } | null = null;
    if (resolved.kind === 'one') {
      const outcome = await sendOtp(ten);
      if (!outcome.ok) {
        return json(
          { ok: false, error: outcome.error, ...(outcome.retryAfter ? { retryAfter: outcome.retryAfter } : {}) },
          outcome.status,
          outcome.retryAfter ? { 'retry-after': String(outcome.retryAfter) } : undefined,
        );
      }
      sent = { resendIn: outcome.resendIn, ...(outcome.devCode ? { devCode: outcome.devCode } : {}) };
    }

    return json(otpSentPayload(ten, sent));
  }

  if (input.action === 'reset_email_send') {
    // Identical response in every case (unknown email, mail off, rate-limited) so this cannot be used to probe
    // which emails have accounts; the work happens after the response, so timing does not give it away either.
    const generic = { ok: true as const, emailed: true as const };
    const mailbox = await resetEmailLimiter.check(`reset-email:${input.email}`);
    if (!mailbox.allowed || !isMailConfigured()) return json(generic);
    after(async () => {
      try {
        const user = await getUserByEmail(input.email);
        if (!user) return;
        const resetUrl = absoluteUrl(`/account/reset-password?token=${encodeURIComponent(createResetToken(user))}`);
        await sendMail({ to: user.email, ...visitorResetEmail({ name: user.name, resetUrl, minutes: RESET_TTL_MINUTES }) });
      } catch (error) {
        console.error('[users:reset-email-failed]', error instanceof Error ? error.message : 'unknown error');
      }
    });
    return json(generic);
  }

  if (input.action === 'reset_email_confirm') {
    const invalid = json({ ok: false, error: 'This reset link is invalid or has expired. Please request a new one.' }, 400);
    const token = readResetToken(input.token);
    if (!token) return invalid;
    const user = await getUserById(token.userId);
    // The fingerprint ties the link to the password it was issued for, so it works exactly once.
    if (!user || !fingerprintMatches(user.passwordHash, token.fingerprint)) return invalid;
    const updated = await updatePassword(user.id, await hashPassword(input.newPassword));
    if (!updated) return json({ ok: false, error: 'Could not update your password. Please try again.' }, 500);
    await startSession(updated.id);
    return json({ ok: true, user: publicUser(updated) });
  }

  if (input.action === 'reset_verify') {
    const ten = normalizeMobile(input.phone);
    if (!ten) return json({ ok: false, error: 'Enter a valid 10-digit mobile number.' }, 400);

    const resolved = await resolveAccountByPhone(ten, input.email);
    if (resolved.kind === 'ambiguous') {
      return json(
        {
          ok: false,
          needsEmail: true,
          error: 'More than one account uses this number. Enter the email for your account.',
        },
        409,
      );
    }
    if (resolved.kind === 'none') {
      return json({ ok: false, error: 'That code is not correct. Please check it and try again.' }, 400);
    }

    const proof = await assertMobileVerified(ten, { otpToken: input.otpToken, code: input.code });
    if (!proof.ok) return json({ ok: false, error: proof.error }, proof.status);

    const updated = await updatePassword(resolved.user.id, await hashPassword(input.newPassword));
    if (!updated) return json({ ok: false, error: 'Could not update your password. Please try again.' }, 500);

    await startSession(updated.id);
    return json({ ok: true, user: publicUser(updated) });
  }

  return json({ ok: false, error: 'Unknown action.' }, 400);
}

export async function DELETE() {
  await endSession();
  return json({ ok: true });
}
