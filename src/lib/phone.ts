/** Ten-digit Indian mobile number: strips spaces, `+91`, a leading 0. `null` when it is not a valid mobile. */
export function normalizeMobile(raw: string): string | null {
  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** `+91 ••••• 62205` — enough to recognise the number without showing it in full. */
export function maskMobile(tenDigits: string): string {
  return `+91 ••••• ${tenDigits.slice(-5)}`;
}
