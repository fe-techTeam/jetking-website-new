/**
 * Browser helpers that call the existing `/api/otp/*` routes (same as enquiry forms).
 * Auth send still goes through `/api/users/auth` so SMS is only fired for real accounts.
 */

export async function verifyOtpCode(
  phone: string,
  code: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  try {
    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data: { ok?: boolean; error?: string; token?: string } = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok || !data.token) {
      return { ok: false, error: data.error ?? 'That code is not correct. Please check it and try again.' };
    }
    return { ok: true, token: data.token };
  } catch {
    return { ok: false, error: 'We could not reach the server. Please check your connection and try again.' };
  }
}
