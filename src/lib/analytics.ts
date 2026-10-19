/**
 * Event layer.
 *
 * Vendor-neutral by design: `track()` is the only call site the app knows about.
 * GA4/GTM already exist at Jetking and carry over; PostHog is added for cohorts and
 * experimentation.
 */

import { readUtmClient, utmToFlat } from '@/lib/utm';

export type EventName =
  | 'persona_classified'
  | 'persona_changed'
  | 'visitor_recognized'
  | 'journey_resumed'
  | 'identity_linked'
  | 'profile_updated'
  | 'journey_discovery_completed'
  | 'journey_course_selected'
  | 'journey_course_detail'
  | 'journey_soft_save'
  | 'journey_soft_save_skipped'
  | 'journey_roadmap_continue'
  | 'journey_counsel_submitted'
  | 'journey_step'
  | 'journey_start_clicked'
  | 'journey_continue_clicked'
  | 'nudge_shown'
  | 'nudge_clicked'
  | 'nudge_dismissed'
  | 'adaptive_slot_rendered'
  | 'enquiry_started'
  | 'enquiry_submitted'
  | 'exit_intent_shown'
  | 'account_signup'
  | 'account_login'
  | 'whatsapp_clicked'
  | 'course_viewed'
  | 'centre_viewed'
  | 'fee_section_viewed'
  | 'article_viewed'
  | 'course_clicked'
  | 'apply_clicked'
  | 'centre_searched'
  | 'blog_searched'
  | 'phone_clicked'
  | 'brochure_downloaded'
  | 'video_played'
  | 'scroll_depth';

export type EventProps = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    posthog?: { capture: (event: string, props?: Record<string, unknown>) => void };
  }
}

const isDev = process.env.NODE_ENV === 'development';

export function track(event: EventName, props: EventProps = {}): void {
  if (typeof window === 'undefined') return;

  // Campaign attribution (utm_source / medium / campaign / content) on every event.
  const payload = { ...utmToFlat(readUtmClient()), ...props, ts: Date.now() };

  // A broken vendor stub (ad-blocker leftovers, a half-loaded GTM script) throwing
  // here must not propagate: several call sites (e.g. Guide.tsx's ask()) call
  // track() before their own try/finally, so an uncaught throw here would skip
  // that finally and leave UI state — the chat's `pending` flag — stuck forever.
  try {
    // GA4 / GTM — the existing Jetking analytics stack.
    window.dataLayer?.push({ event, ...payload });

    // PostHog — cohorts, funnels, experimentation.
    window.posthog?.capture(event, payload);

    if (isDev) {
      console.debug(`[event] ${event}`, payload);
    }
  } catch (err) {
    if (isDev) console.warn('[track] failed', event, err);
  }
}
