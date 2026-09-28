/**
 * Suppresses iOS Safari's auto-zoom-on-focus for form fields under 16px, without
 * disabling zoom anywhere else and without forcing every platform to 16px text.
 *
 * iOS Safari zooms the viewport when a focused `<input>`/`<select>`/`<textarea>`
 * has a computed font-size under 16px. Since iOS 10, `maximum-scale=1` on the
 * viewport suppresses exactly that zoom-on-focus — but, unlike older iOS, it does
 * NOT block the user's own pinch-zoom gesture, which iOS keeps available
 * regardless of what the viewport meta says. Android has no such override:
 * `maximum-scale=1` there genuinely blocks pinch-zoom, so this must never run
 * outside iOS. Scoped to iOS via `isIosWebKit()`, applied once, before hydration.
 *
 * Pairs with the `.is-ios-webkit` CSS floor in globals.css, which is the ONLY
 * thing that pins form-field font-size to 16px, and only on iOS — every other
 * platform keeps the smaller size `fieldControl` actually declares.
 */

/**
 * True on iOS / iPadOS WebKit.
 *
 * `CSS.supports('-webkit-touch-callout: none')` is the canonical iOS test, but
 * that property compiles only into WebKit's iOS port — desktop WebKit builds
 * report false, so the CSS test alone can't be exercised off-device. The
 * user-agent checks make the result verifiable outside a real iOS device and
 * additionally cover iPadOS 13+, which requests the desktop site and reports
 * itself as "Macintosh"; macOS Safari reports `maxTouchPoints` 0, so it's
 * correctly excluded.
 */
export function isIosWebKit(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const supportsCss = typeof window.CSS?.supports === 'function';
  if (supportsCss && window.CSS.supports('(-webkit-touch-callout: none)')) return true;

  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
}

/**
 * Inline `<script>` source, run `beforeInteractive` — must land before any field
 * can be focused. Re-implements `isIosWebKit()` inline rather than calling it:
 * this has to execute as raw script text embedded in HTML before React (and any
 * module import) exists on the page, so it can't reference the function above —
 * keep the two detection checks in sync if either one changes.
 */
export const iosInputZoomGuardScript = `(function(){try{
var ios = (window.CSS && window.CSS.supports && window.CSS.supports('(-webkit-touch-callout: none)'))
  || /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
if(!ios) return;
document.documentElement.classList.add('is-ios-webkit');
var v=document.querySelector('meta[name="viewport"]');
if(!v) return;
var c=v.getAttribute('content')||'';
if(/\\bmaximum-scale\\s*=/i.test(c)) return;
var t=c.trim().replace(/,\\s*$/,'');
v.setAttribute('content', t ? t+', maximum-scale=1' : 'maximum-scale=1');
}catch(_){}})();`;
