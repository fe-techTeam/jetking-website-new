import type { NextConfig } from 'next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Legacy → new URL map lives in `redirects.json` (build-time) and Admin → Redirects (runtime DB).
 * Generated/reviewed via `scripts/build-redirects.ts`. Edit the panel or that file — not next.config.
 * Wildcard-to-homepage redirects are forbidden (see DEVELOPMENT-PLAN §6).
 */
type RedirectEntry = { source: string; destination: string; permanent?: boolean };

function loadRedirects(): RedirectEntry[] {
  try {
    const raw = readFileSync(join(process.cwd(), 'redirects.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RedirectEntry[];
  } catch {
    return [];
  }
}

/**
 * Content Security Policy.
 *
 * A static header, not the per-request nonce variant: nonces need every page rendered dynamically, which
 * would break this site's contract of one cacheable, persona-neutral HTML document per URL (DEVELOPMENT-PLAN
 * §2.1). The cost is `'unsafe-inline'` for scripts and styles (Next's hydration scripts and React style
 * attributes), so this does not stop an injected inline script by itself — XSS stays controlled by
 * sanitising (src/lib/rich) — but it does close the rest of the surface: no plugins, no <base> or form hijack,
 * no framing by other sites, and images/fonts/XHR/frames only from the origins the site actually uses.
 *
 * To add a third-party script (analytics, chat widget), add its host to `script-src` and `connect-src`
 * here — and nowhere else.
 */
const isProd = process.env.NODE_ENV === 'production';
const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-eval' only in development: React uses eval there to rebuild server stacks in the browser.
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://www.jetking.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  // Course and testimonial videos are YouTube / Vimeo embeds.
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // geolocation=(self) — not fully disabled like camera/microphone (never
  // used anywhere on the site): the chatbot's "Use my current location"
  // nearest-centre chip calls navigator.geolocation, and geolocation=()
  // blocks that outright for every visitor, with no permission prompt ever
  // shown, regardless of what they'd have clicked. Confirmed live: the
  // feature always fell through to "I couldn't access your location" — this
  // header, not a user declining permission, was the entire cause.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  outputFileTracingExcludes: {
    '/api/**/*': [
      'node_modules/@xenova/**',
      'node_modules/onnxruntime-node/**',
      'node_modules/onnxruntime-common/**',
      'node_modules/onnxruntime-web/**',
      'node_modules/sharp/**',
    ],
  },

  serverExternalPackages: ['@xenova/transformers'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Media-library uploads travel through a server action (6 MB per file, several at a time).
    serverActions: { bodySizeLimit: '24mb' },
  },

  // Hosting-agnostic: no platform-specific adapters in the core build.
  // `output: 'standalone'` keeps a self-hosted Node/Docker deploy open as an option.
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,

  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: 'www.jetking.com' }],
  },

  typedRoutes: true,

  async redirects() {
    // Next.js matches redirect sources without regard to case, so a rule like "/Courses" -> "/courses" also
    // matches "/courses" and sends it to itself: an endless redirect on a live page. Drop any such rule.
    const path = (p: string) => (p.split(/[?#]/)[0] ?? '').toLowerCase().replace(/\/+$/, '') || '/';
    return loadRedirects()
      .filter((entry) => path(entry.source) !== path(entry.destination))
      .map((entry) => ({
        source: entry.source,
        destination: entry.destination,
        permanent: entry.permanent ?? true,
      }));
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
