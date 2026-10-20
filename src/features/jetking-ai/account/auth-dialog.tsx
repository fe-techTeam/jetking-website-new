'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OTP_ENABLED } from '@/components/MobileOtpField';
import { maskMobile } from '@/lib/phone';
import { OTP_CODE_LENGTH, OTP_RESEND_SECONDS } from '@/lib/otp/config';
import { verifyOtpCode } from '@/lib/otp/client';
import { cn } from '@/lib/utils';

import type { ChatAccount } from './use-chat-account';
import { useLocationPicker, useLocations } from './use-locations';

type Mode = 'login' | 'signup' | 'reset';
type LoginMethod = 'email' | 'mobile';
type OtpStep = 'identify' | 'code' | 'password';

const fieldClass =
  'h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-[14px] text-gray-900 outline-none transition-[border-color,box-shadow] placeholder:text-gray-400 hover:border-jk-300 focus:border-jk-500 focus:ring-3 focus:ring-jk-500/15 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-400 dark:hover:border-jk-400';

/**
 * Log in / Sign up for the optional chatbot account. The whole point of the account
 * is keeping chat history, so the copy says exactly that — and closing the dialog
 * costs the visitor nothing.
 */
export function AuthDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Pick<
    ChatAccount,
    'login' | 'signup' | 'loginOtpSend' | 'loginOtpVerify' | 'resetSend' | 'resetVerify'
  >;
}) {
  const id = useId();
  const [mode, setMode] = useState<Mode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [otpStep, setOtpStep] = useState<OtpStep>('identify');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [challengePhone, setChallengePhone] = useState<string | null>(null);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [resendIn, setResendIn] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [pending, setPending] = useState(false);
  const loc = useLocationPicker(useLocations(open && mode === 'signup'));

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  function switchMode(next: Mode) {
    if (next === 'reset' && !OTP_ENABLED) {
      setError('Password reset by SMS is not available right now.');
      setMode('login');
      return;
    }
    setMode(next);
    setError('');
    setInfo('');
    setOtpStep('identify');
    setOtpCode('');
    setNewPassword('');
    setNeedsEmail(false);
    setChallengePhone(null);
    setOtpToken(null);
    setDevCode(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPassword('');
      setOtpCode('');
      setNewPassword('');
      setError('');
      setInfo('');
    }
    onOpenChange(next);
  }

  async function handleEmailLoginOrSignup(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    const result =
      mode === 'login'
        ? await account.login(email, password)
        : await account.signup({
            name,
            phone,
            email,
            password,
            state: loc.state,
            city: loc.city,
            centre: loc.centre,
          });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPassword('');
    onOpenChange(false);
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

  async function verifyLoginOtp(event: React.FormEvent) {
    event.preventDefault();
    if (pending || !challengePhone) return;
    setPending(true);
    setError('');
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
    onOpenChange(false);
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
      setInfo(
        'If an account exists for that email, we sent a code to the mobile on file. Check your messages, or try again with your mobile number.',
      );
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

  async function finishReset(event: React.FormEvent) {
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
    onOpenChange(false);
  }

  const isLogin = mode === 'login';
  const isReset = mode === 'reset';
  const isSignup = mode === 'signup';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="chatbot-app border-gray-200 bg-white text-gray-900 dark:border-white/15 dark:bg-[#101828] dark:text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-[20px] font-extrabold text-gray-900 dark:text-white">
            {isReset ? 'Reset your password' : isLogin ? 'Log in to Jetking AI' : 'Create your account'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-300">
            {isReset
              ? 'We text a code to your registered mobile. Start with email or mobile.'
              : isLogin
                ? 'Log in with email and password, or a one-time code on your mobile.'
                : 'Save your chats with Jetking AI and continue them any time.'}
          </DialogDescription>
        </DialogHeader>

        {!isReset ? (
          <div
            role="tablist"
            aria-label="Account"
            className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-black/[0.06] p-1 dark:bg-white/10"
          >
            {(['login', 'signup'] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchMode(m)}
                  style={active ? { backgroundColor: '#c7141c', color: '#ffffff' } : undefined}
                  className={cn(
                    'min-h-11 cursor-pointer rounded-lg px-3 text-[13px] font-bold transition-colors',
                    active
                      ? 'shadow-sm'
                      : 'text-gray-600 hover:bg-black/[0.04] hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white',
                  )}
                >
                  {m === 'login' ? 'Log in' : 'Sign up'}
                </button>
              );
            })}
          </div>
        ) : null}

        {isLogin && OTP_ENABLED ? (
          <div
            role="tablist"
            aria-label="Login method"
            className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-black/[0.04] p-1 dark:bg-white/5"
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
                className={cn(
                  'min-h-9 cursor-pointer rounded-lg px-3 text-[12px] font-bold transition-colors',
                  loginMethod === key
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-white/15 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {isSignup || (isLogin && (loginMethod === 'email' || !OTP_ENABLED)) ? (
          <form onSubmit={handleEmailLoginOrSignup} className="space-y-4">
            {isSignup ? (
              <>
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-name`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    Your name
                  </label>
                  <input
                    id={`${id}-name`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                    autoComplete="name"
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-phone`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    Mobile number
                  </label>
                  <input
                    id={`${id}-phone`}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    pattern="[\d\s+\(\)\-]{10,20}"
                    placeholder="e.g. 98765 43210"
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor={`${id}-state`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                      State
                    </label>
                    <select
                      id={`${id}-state`}
                      value={loc.state}
                      onChange={(e) => loc.setState(e.target.value)}
                      required
                      className={fieldClass}
                    >
                      <option value="">{loc.loading ? 'Loading…' : 'Select state'}</option>
                      {loc.states.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor={`${id}-city`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                      City
                    </label>
                    <select
                      id={`${id}-city`}
                      value={loc.city}
                      onChange={(e) => loc.setCity(e.target.value)}
                      required
                      disabled={loc.cities.length === 0}
                      className={fieldClass}
                    >
                      <option value="">{loc.cities.length > 0 ? 'Select city' : 'State first'}</option>
                      {loc.cities.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-centre`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    Preferred centre <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                  </label>
                  <select
                    id={`${id}-centre`}
                    value={loc.centre}
                    onChange={(e) => loc.setCentre(e.target.value)}
                    disabled={loc.centres.length === 0}
                    className={fieldClass}
                  >
                    <option value="">{loc.centres.length > 0 ? 'No preference' : 'City first'}</option>
                    {loc.centres.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor={`${id}-email`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                Email
              </label>
              <input
                id={`${id}-email`}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={200}
                autoComplete="email"
                className={fieldClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`${id}-password`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                Password
              </label>
              <input
                id={`${id}-password`}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isLogin ? undefined : 8}
                maxLength={200}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className={fieldClass}
              />
              {!isLogin ? (
                <p className="text-[12px] text-gray-500 dark:text-gray-400">At least 8 characters.</p>
              ) : null}
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-jk-200 bg-jk-50 px-3.5 py-2.5 text-[13px] font-medium text-jk-700 dark:border-jk-500/40 dark:bg-jk-500/15 dark:text-jk-200"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-jk-600 text-[14px] font-bold tracking-wide text-white shadow-sm transition-colors hover:bg-jk-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {pending ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
            </button>

            {isLogin && OTP_ENABLED ? (
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="w-full text-center text-[13px] font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Forgot password?
              </button>
            ) : null}
          </form>
        ) : null}

        {isLogin && OTP_ENABLED && loginMethod === 'mobile' ? (
          <div className="space-y-4">
            {otpStep === 'identify' ? (
              <>
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-mphone`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    Mobile number
                  </label>
                  <input
                    id={`${id}-mphone`}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    className={fieldClass}
                    placeholder="98765 43210"
                  />
                </div>
                {needsEmail ? (
                  <div className="space-y-1.5">
                    <label htmlFor={`${id}-memail`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                      Email on this account
                    </label>
                    <input
                      id={`${id}-memail`}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                ) : null}
                {error ? (
                  <p role="alert" className="rounded-xl border border-jk-200 bg-jk-50 px-3.5 py-2.5 text-[13px] font-medium text-jk-700">
                    {error}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={pending || !phone.trim()}
                  onClick={() => void sendLoginOtp()}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-jk-600 text-[14px] font-bold text-white disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {pending ? 'Sending…' : 'Send code'}
                </button>
              </>
            ) : (
              <form onSubmit={verifyLoginOtp} className="space-y-4">
                {info ? <p className="text-[13px] text-gray-600 dark:text-gray-300">{info}</p> : null}
                {devCode ? (
                  <p className="rounded-lg bg-black/[0.04] px-3 py-2 font-mono text-[12px] text-gray-500">Dev code: {devCode}</p>
                ) : null}
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-otp`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    6-digit code
                  </label>
                  <input
                    id={`${id}-otp`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_CODE_LENGTH}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
                    className={fieldClass}
                  />
                </div>
                {error ? (
                  <p role="alert" className="rounded-xl border border-jk-200 bg-jk-50 px-3.5 py-2.5 text-[13px] font-medium text-jk-700">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={pending || otpCode.length !== OTP_CODE_LENGTH}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-jk-600 text-[14px] font-bold text-white disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {pending ? 'Please wait…' : 'Verify & log in'}
                </button>
                <button
                  type="button"
                  disabled={pending || resendIn > 0}
                  onClick={() => void sendLoginOtp()}
                  className="w-full text-center text-[13px] font-semibold text-gray-600 disabled:opacity-45 dark:text-gray-300"
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={() => switchMode('reset')}
              className="w-full text-center text-[13px] font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300"
            >
              Forgot password?
            </button>
          </div>
        ) : null}

        {isReset ? (
          <div className="space-y-4">
            {otpStep === 'identify' ? (
              <>
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-remail`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    Email
                  </label>
                  <input
                    id={`${id}-remail`}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldClass}
                    placeholder="Optional if you use mobile"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-rphone`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    Mobile number
                  </label>
                  <input
                    id={`${id}-rphone`}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={fieldClass}
                    placeholder="Required if no email"
                  />
                </div>
                {info ? <p className="text-[13px] text-gray-600 dark:text-gray-300">{info}</p> : null}
                {error ? (
                  <p role="alert" className="rounded-xl border border-jk-200 bg-jk-50 px-3.5 py-2.5 text-[13px] font-medium text-jk-700">
                    {error}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={pending || (!email.trim() && !phone.trim())}
                  onClick={() => void sendResetOtp()}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-jk-600 text-[14px] font-bold text-white disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {pending ? 'Sending…' : 'Send reset code'}
                </button>
              </>
            ) : null}

            {otpStep === 'code' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pending || !challengePhone || otpCode.length !== OTP_CODE_LENGTH) return;
                  setPending(true);
                  setError('');
                  void verifyOtpCode(challengePhone, otpCode).then((proof) => {
                    setPending(false);
                    if (!proof.ok) {
                      setError(proof.error);
                      return;
                    }
                    setOtpToken(proof.token);
                    setOtpStep('password');
                  });
                }}
                className="space-y-4"
              >
                {info ? <p className="text-[13px] text-gray-600 dark:text-gray-300">{info}</p> : null}
                {devCode ? (
                  <p className="rounded-lg bg-black/[0.04] px-3 py-2 font-mono text-[12px] text-gray-500">Dev code: {devCode}</p>
                ) : null}
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-rotp`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    6-digit code
                  </label>
                  <input
                    id={`${id}-rotp`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={OTP_CODE_LENGTH}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, OTP_CODE_LENGTH))}
                    className={fieldClass}
                  />
                </div>
                {error ? (
                  <p role="alert" className="rounded-xl border border-jk-200 bg-jk-50 px-3.5 py-2.5 text-[13px] font-medium text-jk-700">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={pending || otpCode.length !== OTP_CODE_LENGTH}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-jk-600 text-[14px] font-bold text-white disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {pending ? 'Checking…' : 'Continue'}
                </button>
              </form>
            ) : null}

            {otpStep === 'password' ? (
              <form onSubmit={finishReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor={`${id}-npw`} className="block text-[13px] font-semibold text-gray-900 dark:text-white">
                    New password
                  </label>
                  <input
                    id={`${id}-npw`}
                    type="password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={fieldClass}
                    autoComplete="new-password"
                  />
                  <p className="text-[12px] text-gray-500">At least 8 characters.</p>
                </div>
                {error ? (
                  <p role="alert" className="rounded-xl border border-jk-200 bg-jk-50 px-3.5 py-2.5 text-[13px] font-medium text-jk-700">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={pending || newPassword.length < 8}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-jk-600 text-[14px] font-bold text-white disabled:opacity-60"
                >
                  {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {pending ? 'Saving…' : 'Save password & log in'}
                </button>
              </form>
            ) : null}

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full text-center text-[13px] font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300"
            >
              Back to log in
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => handleOpenChange(false)}
          className="mt-3 w-full rounded-lg py-2 text-center text-[13px] font-semibold text-gray-600 transition-colors hover:bg-black/[0.04] hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          Continue without an account
        </button>
      </DialogContent>
    </Dialog>
  );
}
