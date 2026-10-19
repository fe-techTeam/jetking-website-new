'use client';

import { useEffect } from 'react';
import { sendClientError } from '@/lib/client-error';

/**
 * Last resort: the root layout itself failed, so none of the site's styles or providers exist.
 * Self-contained markup with inline styles only.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    sendClientError(error, 'global-error');
  }, [error]);

  return (
    <html lang="en-IN">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif', background: '#fff', color: '#1d2939' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', textAlign: 'center' }}>
          <div style={{ maxWidth: 480 }}>
            <p style={{ color: '#a50d13', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 12 }}>
              Something went wrong
            </p>
            <h1 style={{ fontSize: 30, lineHeight: 1.2, margin: '12px 0' }}>Jetking is having a problem</h1>
            <p style={{ fontSize: 17, lineHeight: 1.6, color: '#344054' }}>
              It is on our side, and we have been told. Please try again in a moment.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 24, minHeight: 48, padding: '0 28px', borderRadius: 999, border: 0, background: '#c7141c', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
