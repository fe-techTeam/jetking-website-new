import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { clientKey, createRateLimiter } from '@/lib/rate-limit';
import { safeError } from '@/lib/pii';
import { clearSessionHint, endSession, getSessionUser, startSession } from '@/lib/chatbot/session';
import { DuplicateEmailError, createUser, getUserByEmail, type StoredUser } from '@/lib/chatbot/store';
import { isConsistentLocation, loadLocationTree } from '@/lib/chatbot/locations';
import type { ChatUser } from '@/lib/chatbot/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * /chatbot accounts: GET = who am I, POST = sign up / log in, DELETE = log out.
 * Sign-up and login are rate-limited per client — the brake on password guessing
 * and on scripted account creation.
 */

const email = z
  .email()
  .max(200)
  .transform((v) => v.trim().toLowerCase());

/** Spaces, dashes and brackets are stripped, so "+91 98765-43210" is stored as "+919876543210". */
const phone = z
  .string()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .pipe(z.string().regex(/^\+?\d{10,15}$/));

const bodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('signup'),
    name: z.string().trim().min(2).max(80),
    phone,
    state: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(120),
    centre: z.string().trim().max(120).optional(),
    email,
    password: z.string().min(8).max(200),
  }),
  z.object({ action: z.literal('login'), email, password: z.string().min(1).max(200) }),
]);

const signupLimiter = createRateLimiter({ windowMs: 60 * 60_000, max: 10 });
const loginLimiter = createRateLimiter({ windowMs: 10 * 60_000, max: 10 });

const NO_STORE = { 'cache-control': 'no-store' };

/** Verified against when the email is unknown, so "no such account" costs the same time as "wrong password". */
let dummyHash: Promise<string> | undefined;

/** Never send the password hash back to the browser. */
function publicUser(user: StoredUser): ChatUser {
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
  if (field === 'password') return 'Use at least 8 characters for your password.';
  if (field === 'email') return 'Enter a valid email address.';
  if (field === 'name') return 'Enter your name (at least 2 characters).';
  if (field === 'phone') return 'Enter a valid mobile number (10 to 15 digits).';
  if (field === 'state' || field === 'city') return 'Choose your state and city.';
  return 'Please check the form and try again.';
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) await clearSessionHint();
  return NextResponse.json({ user }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: validationMessage(parsed.error.issues[0]) }, { status: 400 });
  }
  const input = parsed.data;

  const limiter = input.action === 'signup' ? signupLimiter : loginLimiter;
  const limit = await limiter.check(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Please try again in a few minutes.' },
      { status: 429, headers: { 'retry-after': String(limit.retryAfter || 600) } },
    );
  }

  if (input.action === 'signup') {
    // The dropdowns keep these consistent, but the server is the authority: never store a
    // city that isn't in the state, or a centre that isn't in the city.
    const centre = input.centre || undefined;
    const tree = await loadLocationTree();
    if (!isConsistentLocation(tree, { state: input.state, city: input.city, centre })) {
      return NextResponse.json({ ok: false, error: 'Choose your state, city and centre from the lists.' }, { status: 400 });
    }
    try {
      const user = await createUser({
        name: input.name,
        email: input.email,
        phone: input.phone,
        state: input.state,
        city: input.city,
        centre,
        passwordHash: await hashPassword(input.password),
      });
      await startSession(user.id);
      return NextResponse.json({ ok: true, user: publicUser(user) });
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        return NextResponse.json(
          { ok: false, error: 'An account with this email already exists. Try logging in instead.' },
          { status: 409 },
        );
      }
      console.error('[chatbot:signup-failed]', safeError(error));
      return NextResponse.json(
        { ok: false, error: 'Could not create your account. Please try again.' },
        { status: 500 },
      );
    }
  }

  try {
    const user = await getUserByEmail(input.email);
    dummyHash ??= hashPassword('jetking-dummy-password');
    const valid = await verifyPassword(input.password, user?.passwordHash ?? (await dummyHash));
    if (!user || !valid) {
      return NextResponse.json({ ok: false, error: 'Incorrect email or password.' }, { status: 401 });
    }
    await startSession(user.id);
    return NextResponse.json({ ok: true, user: publicUser(user) });
  } catch (error) {
    console.error('[chatbot:login-failed]', safeError(error));
    return NextResponse.json({ ok: false, error: 'Could not log you in. Please try again.' }, { status: 500 });
  }
}

export async function DELETE() {
  await endSession();
  return NextResponse.json({ ok: true });
}
