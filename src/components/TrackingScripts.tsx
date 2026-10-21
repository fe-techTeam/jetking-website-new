import Script from 'next/script';
import { tracking } from '@/lib/tracking';

/**
 * Loads the site's analytics and ad tags (see `lib/tracking.ts` for what, and when). Everything loads after the
 * page is interactive, so none of it delays first paint. Ids are validated against strict patterns before they
 * are placed in the inline snippets, so an environment value can never inject script.
 *
 * Custom events from `track()` are pushed to `window.dataLayer`, which Tag Manager (and gtag) read.
 */
export function TrackingScripts() {
  const { enabled, gtmId, googleTagIds, metaPixelIds } = tracking;
  if (!enabled) return null;

  const gtag = googleTagIds.length
    ? `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${googleTagIds
        .map((id) => `gtag('config','${id}');`)
        .join('')}`
    : '';
  const pixel = metaPixelIds.length
    ? `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');${metaPixelIds
        .map((id) => `fbq('init','${id}');`)
        .join('')}fbq('track','PageView');`
    : '';

  return (
    <>
      {gtmId ? (
        <Script
          id="jk-gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
          }}
        />
      ) : null}
      {googleTagIds[0] ? (
        <>
          <Script id="jk-gtag-src" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${googleTagIds[0]}`} />
          <Script id="jk-gtag" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: gtag }} />
        </>
      ) : null}
      {pixel ? <Script id="jk-meta-pixel" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: pixel }} /> : null}
      {metaPixelIds.length ? (
        <noscript>
          {metaPixelIds.map((id) => (
            // eslint-disable-next-line @next/next/no-img-element -- 1px tracking beacon for visitors without JavaScript
            <img key={id} height="1" width="1" alt="" style={{ display: 'none' }} src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`} />
          ))}
        </noscript>
      ) : null}
    </>
  );
}
