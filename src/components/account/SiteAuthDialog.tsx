'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useDialog } from '@/components/useDialog';
import { Button, Field, Input, Select, cx } from '@/components/ui';
import { usePersona } from '@/persona/PersonaProvider';
import { linkVisitorIdentity } from '@/persona/visitor';
import { track } from '@/lib/analytics';
import { maskMobile } from '@/lib/phone';
import { OTP_CODE_LENGTH, OTP_RESEND_SECONDS } from '@/lib/otp/config';
import { verifyOtpCode } from '@/lib/otp/client';
import { OTP_ENABLED } from '@/components/MobileOtpField';
import type { SiteAccount } from './use-site-account';
import { useLocationPicker, useLocations } from '@/features/jetking-ai/account/use-locations';

export type AuthMode = 'login' | 'signup' | 'reset';
type LoginMethod = 'email' | 'mobile';
type OtpStep = 'identify' | 'code' | 'password';

/**
 * Log in / Sign up for the main website. Same account as the Jetking AI chatbot —
 * one sign-in covers both, and the chatbot's saved chats appear under /account.
 * Styled with the site kit (the chatbot has its own dialog, on its own tokens).
 *
 * Signing in also links this browser's anonymous visitor id to the person's phone and
 * email, which is what lets the persona engine carry their browsing history across
 * devices — the same link the enquiry form makes on submit.
 */
export function SiteAuthDialog({
  mode,
  onModeChange,
  onClose,
  account,
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  account: Pick<
    SiteAccount,
    'login' | 'signup' | 'loginOtpSend' | 'loginOtpVerify' | 'resetSend' | 'resetVerify'
  >;
}) {
  const id = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { visitor } = usePersona();
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [pending, setPending] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [otpStep, setOtpStep] = useState<OtpStep>('identify');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [challengePhone, setChallengePhone] = useState<string | null>(null);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [resendIn, setResendIn] = useState(0);

  const isLogin = mode === 'login';
  const isReset = mode === 'reset';
  const isSignup = mode === 'signup';
  // State/city/centre lists are only needed on the Sign up tab, so they load lazily.
  const loc = useLocationPicker(useLocations(isSignup));

  useDialog(true, onClose, dialogRef, { modal: true });

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  function switchMode(next: AuthMode) {
    setError('');
    setInfo('');
    setOtpStep('identify');
    setOtpCode('');
    setNewPassword('');
    setNeedsEmail(false);
    setChallengePhone(null);
    setOtpToken(null);
    setDevCode(undefined);
    if (next === 'reset' && !OTP_ENABLED) {
      setError('Password reset by SMS is not available right now. Ask a counsellor for help, or try email login.');
      onModeChange('login');
      return;
    }
    onModeChange(next);
  }

  function finishSignedIn(user: { phone: string; email: string; name: string }, event: 'account_login' | 'account_signup') {
    track(event, { visitor_id: visitor.id });
    linkVisitorIdentity({
      visitorId: visitor.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
    });
    onClose();
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    const result = await account.signup({
      name: String(form.get('name') ?? ''),
      phone: String(form.get('phone') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      state: loc.state,
      city: loc.city,
      centre: loc.centre,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    finishSignedIn(result.user, 'account_signup');
  }

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError('');
    const result = await account.login(String(form.get('email') ?? ''), String(form.get('password') ?? ''));
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    finishSignedIn(result.user, 'account_login');
  }

  async function sendLoginOtp() {
    if (pending) return;
    setPending(true);
    setError('');
    setInfo('');
    const result = await account.loginOtpSend(phone, needsEmail || email ? email : undefined);
    setPending(false);
    if (!result.ok) {
      if (result.needsEmail) setNeedsEmail(true);
      setError(result.error);
      return;
    }
    setChallengePhone(result.phone);
    setDevCode(result.devCode);
    setResendIn(result.resendIn || OTP_RESEND_SECONDS);
    setOtpStep('code');
    setInfo(
      result.sent && result.phone
        ? `Code sent to ${maskMobile(result.phone)}.`
        : 'If an account exists for that number, we sent a code.',
    );
  }

  async function verifyLoginOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !challengePhone) return;
    setPending(true);
    setError('');
    // Same `/api/otp/verify` proof used by enquiry forms, then open the session.
    const proof = await verifyOtpCode(challengePhone, otpCode);
    if (!proof.ok) {
      setPending(false);
      setError(proof.error);
      return;
    }
    setOtpToken(proof.token);
    const result = await account.loginOtpVerify({
      phone: challengePhone,
      otpToken: proof.token,
      ...(needsEmail || email ? { email } : {}),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    finishSignedIn(result.user, 'account_login');
  }

  async function sendResetOtp() {
    if (pending) return;
    setPending(true);
    setError('');
    setInfo('');
    const result = await account.resetSend({
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    });
    setPending(false);
    if (!result.ok) {
      if (result.needsEmail) setNeedsEmail(true);
      setError(result.error);
      return;
    }
    if (!result.phone) {
      setInfo('If an account exists for that email, we sent a code to the mobile on file. Check your messages, then try again with your mobile number if you did not receive a code.');
      return;
    }
    setChallengePhone(result.phone);
    setDevCode(result.devCode);
    setResendIn(result.resendIn || OTP_RESEND_SECONDS);
    setOtpStep('code');
    setInfo(
      result.sent
        ? `Code sent to ${maskMobile(result.phone)}.`
        : 'If an account exists for that number, we sent a code.',
    );
  }

  async function verifyResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challengePhone || pending) return;
    if (otpCode.replace(/\D/g, '').length !== OTP_CODE_LENGTH) {
      setError(`Enter the ${OTP_CODE_LENGTH}-digit code.`);
      return;
    }
    setPending(true);
    setError('');
    const proof = await verifyOtpCode(challengePhone, otpCode);
    setPending(false);
    if (!proof.ok) {
      setError(proof.error);
      return;
    }
    setOtpToken(proof.token);
    setOtpStep('password');
  }

  async function finishReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !challengePhone || !otpToken) return;
    setPending(true);
    setError('');
    const result = await account.resetVerify({
      phone: challengePhone,
      otpToken,
      newPassword,
      ...(needsEmail || email ? { email } : {}),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    finishSignedIn(result.user, 'account_login');
  }

  const title =
    isReset ? 'Reset your password' : isLogin ? 'Welcome back' : 'Create your Jetking account';
  const lede = isReset
    ? 'We will text a code to your registered mobile. You can start with your email or mobile number.'
    : isLogin
      ? 'Log in with email and password, or a one-time code on your mobile.'
      : 'One account for the website and Jetking AI. Your details pre-fill enquiries, and your chats are saved.';

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
      <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className="sheet-up relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[24px] border border-b-0 border-border bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:max-w-[440px] sm:rounded-[20px] sm:border-b sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-2.5 right-2.5 grid h-11 w-11 cursor-pointer place-items-center rounded-full sm:top-3 sm:right-3 text-foreground-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <p id={`${id}-title`} className="pr-8 font-display text-[22px] font-extrabold text-foreground sm:text-[24px]">
          {title}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-secondary">{lede}</p>

        {!isReset ? (
          <div
            role="tablist"
            aria-label="Account"
            className="mt-5 grid grid-cols-2 gap-1 rounded-full border border-border bg-black/[0.06] p-1 dark:bg-white/10"
          >
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={cx(
                  'h-10 cursor-pointer rounded-full text-sm font-bold transition-colors',
                  mode === m
                    ? 'bg-jk-600 text-white'
                    : 'text-foreground-secondary hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/10',
                )}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>
        ) : null}

        {isLogin && OTP_ENABLED ? (
          <div
            role="tablist"
            aria-label="Login method"
            className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-border bg-black/[0.04] p-1 dark:bg-white/5"
          >
            {([
              ['email', 'Email'],
              ['mobile', 'Mobile OTP'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={loginMethod === key}
                onClick={() => {
                  setLoginMethod(key);
                  setError('');
                  setInfo('');
                  setOtpStep('identify');
                  setOtpCode('');
                  setOtpToken(null);
                }}
                className={cx(
                  'h-9 cursor-pointer rounded-full text-xs font-bold transition-colors',
                  loginMethod === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground-secondary hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {isSignup ? (
          <form key="signup" onSubmit={handleSignup} className="mt-5 space-y-4">
            <Field label="Your name" htmlFor={`${id}-name`} required>
              <Input id={`${id}-name`} name="name" minLength={2} maxLength={80} autoComplete="name" />
            </Field>
            <Field
              label="Mobile number"
              htmlFor={`${id}-phone`}
              required
              hint="A counsellor may call or message you on this."
            >
              <Input
                id={`${id}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                pattern="[\d\s+\(\)\-]{10,20}"
                placeholder="+91 98765 43210"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="State" htmlFor={`${id}-state`} required>
                <Select id={`${id}-state`} value={loc.state} onChange={(e) => loc.setState(e.target.value)}>
                  <option value="">{loc.loading ? 'Loading…' : 'Select state'}</option>
                  {loc.states.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="City" htmlFor={`${id}-city`} required>
                <Select
                  id={`${id}-city`}
                  value={loc.city}
                  onChange={(e) => loc.setCity(e.target.value)}
                  disabled={loc.cities.length === 0}
                >
                  <option value="">{loc.cities.length > 0 ? 'Select city' : 'State first'}</option>
                  {loc.cities.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field
              label="Preferred centre"
              htmlFor={`${id}-centre`}
              hint="Optional. We'll use it to pre-fill your enquiries."
            >
              <Select
                id={`${id}-centre`}
                value={loc.centre}
                onChange={(e) => loc.setCentre(e.target.value)}
                disabled={loc.centres.length === 0}
              >
                <option value="">{loc.centres.length > 0 ? 'No preference' : 'City first'}</option>
                {loc.centres.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Email" htmlFor={`${id}-email`} required>
              <Input id={`${id}-email`} name="email" type="email" maxLength={200} autoComplete="email" />
            </Field>
            <Field label="Password" htmlFor={`${id}-password`} required hint="At least 8 characters.">
              <Input
                id={`${id}-password`}
                name="password"
                type="password"
                maxLength={200}
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            {error ? (
              <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="md" disabled={pending} className="w-full">
              {pending ? 'Please wait…' : 'Create account'}
            </Button>
          </form>
        ) : null}

        {isLogin && (loginMethod === 'email' || !OTP_ENABLED) ? (
          <form key="login-email" onSubmit={handleEmailLogin} className="mt-5 space-y-4">
            <Field label="Email" htmlFor={`${id}-email`} required>
              <Input id={`${id}-email`} name="email" type="email" maxLength={200} autoComplete="email" />
            </Field>
            <Field label="Password" htmlFor={`${id}-password`} required>
              <Input
                id={`${id}-password`}
                name="password"
                type="password"
                maxLength={200}
                autoComplete="current-password"
              />
            </Field>
            {error ? (
              <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                {error}
              </p>
            ) : null}
            <Button type="submit" size="md" disabled={pending} className="w-full">
              {pending ? 'Please wait…' : 'Log in'}
            </Button>
            {OTP_ENABLED ? (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="w-full cursor-pointer text-center text-sm font-semibold text-foreground-secondary hover:text-foreground"
              >
                Forgot password?
              </button>
            ) : null}
          </form>
        ) : null}

        {isLogin && OTP_ENABLED && loginMethod === 'mobile' ? (
          <div className="mt-5 space-y-4">
            {otpStep === 'identify' ? (
              <>
                <Field label="Mobile number" htmlFor={`${id}-mphone`} required>
                  <Input
                    id={`${id}-mphone`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                  />
                </Field>
                {needsEmail ? (
                  <Field label="Email on this account" htmlFor={`${id}-memail`} required>
                    <Input
                      id={`${id}-memail`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </Field>
                ) : null}
                {error ? (
                  <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                    {error}
                  </p>
                ) : null}
                <Button type="button" size="md" disabled={pending || !phone.trim()} className="w-full" onClick={() => void sendLoginOtp()}>
                  {pending ? 'Sending…' : 'Send code'}
                </Button>
              </>
            ) : (
              <form onSubmit={verifyLoginOtp} className="space-y-4">
                {info ? <p className="text-sm text-foreground-secondary">{info}</p> : null}
                {devCode ? (
                  <p className="rounded-lg bg-surface px-3 py-2 font-mono text-xs text-foreground-muted">
                    Dev code: {devCode}
                  </p>
                ) : null}
                <Field label="6-digit code" htmlFor={`${id}-otp`} required>
                  <Input
                    id={`${id}-otp`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_CODE_LENGTH}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
                  />
                </Field>
                {needsEmail ? (
                  <Field label="Email on this account" htmlFor={`${id}-memail2`} required>
                    <Input
                      id={`${id}-memail2`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </Field>
                ) : null}
                {error ? (
                  <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" size="md" disabled={pending || otpCode.length !== OTP_CODE_LENGTH} className="w-full">
                  {pending ? 'Please wait…' : 'Verify & log in'}
                </Button>
                <button
                  type="button"
                  disabled={pending || resendIn > 0}
                  onClick={() => void sendLoginOtp()}
                  className="w-full cursor-pointer text-center text-sm font-semibold text-foreground-secondary hover:text-foreground disabled:opacity-45"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('identify');
                    setOtpCode('');
                    setInfo('');
                    setError('');
                  }}
                  className="w-full cursor-pointer text-center text-sm font-semibold text-foreground-muted hover:text-foreground"
                >
                  Use a different number
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className="w-full cursor-pointer text-center text-sm font-semibold text-foreground-secondary hover:text-foreground"
            >
              Forgot password?
            </button>
          </div>
        ) : null}

        {isReset ? (
          <div className="mt-5 space-y-4">
            {otpStep === 'identify' ? (
              <>
                <Field label="Email" htmlFor={`${id}-remail`} hint="Or leave blank and use mobile below.">
                  <Input
                    id={`${id}-remail`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Field>
                <Field label="Mobile number" htmlFor={`${id}-rphone`} hint="Required if you do not enter an email.">
                  <Input
                    id={`${id}-rphone`}
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="98765 43210"
                  />
                </Field>
                {needsEmail ? (
                  <p className="text-xs text-foreground-muted">
                    Several accounts share this number — email is required.
                  </p>
                ) : null}
                {info ? <p className="text-sm text-foreground-secondary">{info}</p> : null}
                {error ? (
                  <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="button"
                  size="md"
                  disabled={pending || (!email.trim() && !phone.trim())}
                  className="w-full"
                  onClick={() => void sendResetOtp()}
                >
                  {pending ? 'Sending…' : 'Send reset code'}
                </Button>
              </>
            ) : null}

            {otpStep === 'code' ? (
              <form onSubmit={verifyResetCode} className="space-y-4">
                {info ? <p className="text-sm text-foreground-secondary">{info}</p> : null}
                {devCode ? (
                  <p className="rounded-lg bg-surface px-3 py-2 font-mono text-xs text-foreground-muted">
                    Dev code: {devCode}
                  </p>
                ) : null}
                <Field label="6-digit code" htmlFor={`${id}-rotp`} required>
                  <Input
                    id={`${id}-rotp`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_CODE_LENGTH}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
                  />
                </Field>
                {error ? (
                  <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" size="md" disabled={otpCode.length !== OTP_CODE_LENGTH} className="w-full">
                  Continue
                </Button>
                <button
                  type="button"
                  disabled={pending || resendIn > 0}
                  onClick={() => void sendResetOtp()}
                  className="w-full cursor-pointer text-center text-sm font-semibold text-foreground-secondary hover:text-foreground disabled:opacity-45"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </form>
            ) : null}

            {otpStep === 'password' ? (
              <form onSubmit={finishReset} className="space-y-4">
                <Field label="New password" htmlFor={`${id}-npw`} required hint="At least 8 characters.">
                  <Input
                    id={`${id}-npw`}
                    type="password"
                    minLength={8}
                    maxLength={200}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>
                {error ? (
                  <p role="alert" className="text-sm font-medium text-[var(--accent-ink)]">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" size="md" disabled={pending || newPassword.length < 8} className="w-full">
                  {pending ? 'Saving…' : 'Save password & log in'}
                </Button>
              </form>
            ) : null}

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full cursor-pointer text-center text-sm font-semibold text-foreground-secondary hover:text-foreground"
            >
              Back to log in
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
