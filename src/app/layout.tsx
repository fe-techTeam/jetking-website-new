import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Fira_Sans } from 'next/font/google';
import { PersonaProvider } from '@/persona/PersonaProvider';
import { SilentPersonaInfer } from '@/persona/SilentPersonaInfer';
import { SiteChrome, FooterChrome } from '@/components/SiteShell';
import { SiteHeaderServer } from '@/components/SiteHeaderServer';
import { AnnouncementBarServer } from '@/components/AnnouncementBarServer';
import { SiteFooter } from '@/components/SiteFooter';
import { PersonaInspector } from '@/components/PersonaInspector';
import { ExitIntentPopup } from '@/components/ExitIntentPopup';
import { MobileContactBar } from '@/components/MobileContactBar';
import { EnquirySheetServer } from '@/components/EnquirySheetServer';
import { AccountProvider } from '@/components/account/AccountProvider';
import { JsonLd } from '@/components/ui';
import { AppProviders } from '@/components/providers/app-providers';
import { themeScript } from '@/components/providers/theme-script';
import { iosInputZoomGuardScript } from '@/lib/ios-input-zoom-guard';
import { TrackingScripts } from '@/components/TrackingScripts';
import { organizationSchema, websiteSchema } from '@/lib/seo';
import { siteConfig } from '@/lib/site';
import { content } from '@/lib/content';
import { loadCopy } from '@/lib/content/copy/load';
import { siteCopy } from '@/lib/content/copy/pages/site';
import { isSectionVisible } from '@/lib/content/copy/sections';
import { SiteCopyProvider } from '@/components/providers/site-copy';
import { ChatbotEnabledProvider } from '@/components/providers/chatbot-enabled';
import { isChatbotPubliclyEnabled } from '@/lib/chatbot/availability';
import '@/styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const copy = await loadCopy(siteCopy);
  const seo = await content.getSeoSettings();
  return {
    verification: {
      ...(seo.googleVerification ? { google: seo.googleVerification } : {}),
      ...(seo.bingVerification ? { other: { 'msvalidate.01': seo.bingVerification } } : {}),
    },
    metadataBase: new URL(siteConfig.url),
    title: {
      default: copy['seo.title'],
      template: copy['seo.titleTemplate'],
    },
    description: copy['seo.description'],
    formatDetection: { telephone: true },
  };
}

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

/** The one site typeface: chosen to sit with the Jetking wordmark (humanist sans, double-storey g, flat stroke cuts). */
const fira = Fira_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-fira',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const copy = await loadCopy(siteCopy);
  const showChrome = (id: string) => isSectionVisible(copy, id);
  const [seoSettings, chatbotEnabled] = await Promise.all([
    content.getSeoSettings(),
    isChatbotPubliclyEnabled(),
  ]);
  // Demo/debug only — never ship to visitors unless explicitly opted in on staging.
  const showInspector = process.env.NEXT_PUBLIC_SHOW_INSPECTOR === 'true';

  return (
    <html
      lang="en-IN"
      className={fira.variable}
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
        <TrackingScripts />
        <AppProviders>
          <SiteCopyProvider copy={copy}>
            <ChatbotEnabledProvider enabled={chatbotEnabled}>
              <JsonLd data={[organizationSchema(seoSettings.organization), websiteSchema()]} />
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-jk-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
              >
                {copy['a11y.skipToContent']}
              </a>

              <PersonaProvider>
                <AccountProvider>
                  <EnquirySheetServer>
                    <SilentPersonaInfer />
                    {showChrome('announcement') || showChrome('header') ? (
                      <SiteChrome>
                        {showChrome('announcement') ? <AnnouncementBarServer /> : null}
                        {showChrome('header') ? <SiteHeaderServer /> : null}
                      </SiteChrome>
                    ) : null}
                    <main id="main">{children}</main>
                    {showChrome('footer') ? (
                      <FooterChrome>
                        <SiteFooter />
                      </FooterChrome>
                    ) : null}
                    {showChrome('mobileBar') || showChrome('exitIntent') || showInspector ? (
                      <SiteChrome>
                        {showChrome('mobileBar') ? <MobileContactBar /> : null}
                        {showChrome('exitIntent') ? <ExitIntentPopup /> : null}
                        {showInspector ? <PersonaInspector /> : null}
                      </SiteChrome>
                    ) : null}
                  </EnquirySheetServer>
                </AccountProvider>
              </PersonaProvider>
            </ChatbotEnabledProvider>
          </SiteCopyProvider>
        </AppProviders>
      </body>
    </html>
  );
}
