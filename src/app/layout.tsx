import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from 'next/font/google';
import Script from 'next/script';
import { PersonaProvider } from '@/persona/PersonaProvider';
import { SilentPersonaInfer } from '@/persona/SilentPersonaInfer';
import { SiteChrome, FooterChrome } from '@/components/SiteShell';
import { SiteHeaderServer } from '@/components/SiteHeaderServer';
import { SiteFooter } from '@/components/SiteFooter';
import { PersonaInspector } from '@/components/PersonaInspector';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
import { MobileContactBar } from '@/components/MobileContactBar';
import { AccountProvider } from '@/components/account/AccountProvider';
import { JsonLd } from '@/components/ui';
import { AppProviders } from '@/components/providers/app-providers';
import { themeScript } from '@/components/providers/theme-script';
import { iosInputZoomGuardScript } from '@/lib/ios-input-zoom-guard';
import { organizationSchema, websiteSchema } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import '@/styles/globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display-src',
  display: 'swap',
});

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body-src',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  // Browser chrome can't resolve CSS variables: keep in sync with --color-background and --color-ink-950.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0B111E' },
  ],
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  // `maximum-scale` is deliberately NOT set here — it would apply to every browser,
  // and on Android it genuinely blocks pinch-zoom (unlike iOS 10+, which ignores it
  // for the user's own gesture). It's instead added at runtime, iOS-only, by
  // `iosInputZoomGuardScript` below — see src/lib/ios-input-zoom-guard.ts.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Demo/debug only — never ship to visitors unless explicitly opted in on staging.
  const showInspector = process.env.NEXT_PUBLIC_SHOW_INSPECTOR === 'true';

  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${body.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body>
        <Script
          id="jetking-theme"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <Script
          id="jetking-ios-zoom-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: iosInputZoomGuardScript }}
        />
        <AppProviders>
          <JsonLd data={[organizationSchema(), websiteSchema()]} />
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-jk-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>

          <PersonaProvider>
            <AccountProvider>
              <SilentPersonaInfer />
              <SiteChrome>
                <SiteHeaderServer />
              </SiteChrome>
              <main id="main">{children}</main>
              <FooterChrome>
                <SiteFooter />
              </FooterChrome>
              <SiteChrome>
                <MobileContactBar />
                <ExitIntentPopup />
                {showInspector ? <PersonaInspector /> : null}
              </SiteChrome>
            </AccountProvider>
          </PersonaProvider>
        </AppProviders>
      </body>
    </html>
  );
}
