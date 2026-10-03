import { sendClientError } from '@/lib/client-error';

/**
 * Runs in the browser before the app hydrates: report uncaught errors and unhandled promise rejections.
 * Noise from browser extensions, cross-origin scripts and benign observer warnings is ignored.
 */
const IGNORED = /ResizeObserver loop|Script error|chrome-extension:|moz-extension:|safari-extension:|Non-Error promise rejection/i;

window.addEventListener('error', (event) => {
  if (IGNORED.test(event.message) || IGNORED.test(event.filename || '')) return;
  sendClientError(event.error ?? event.message, 'window.onerror');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const text = reason instanceof Error ? reason.message : String(reason);
  if (IGNORED.test(text)) return;
  sendClientError(reason, 'unhandledrejection');
});
