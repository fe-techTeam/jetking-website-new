

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
