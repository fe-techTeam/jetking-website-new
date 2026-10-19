/** Shared OTP limits. Pure constants: imported by the server code and by the form component (countdown). */
export const OTP_CODE_LENGTH = 6;
/** How long a code stays valid. */
export const OTP_TTL_MS = 5 * 60_000;
/** Wrong guesses allowed per code before it is locked. */
export const OTP_MAX_ATTEMPTS = 5;
/** Minimum gap between two codes to the same number (also the resend countdown). */
export const OTP_RESEND_SECONDS = 30;
/** Codes per number per hour — bounds SMS cost and harassment of one number. */
export const OTP_MAX_SENDS_PER_HOUR = 5;
/** How long a verified number stays verified for form submission. */
export const OTP_TOKEN_TTL_MS = 20 * 60_000;
