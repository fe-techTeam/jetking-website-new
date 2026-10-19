'use client';

import { useEffect, useRef } from 'react';
import { usePersona } from './PersonaProvider';
import { readBehaviour } from './behaviour';
import { classificationToInferPayload } from './infer';
import { track } from '@/lib/analytics';
import { ADAPTIVE_PERSONALISATION } from './mode';

/**
 * Quietly infers persona from browsing signals + optional model.
 * No “who are you?” UI — the page simply starts adapting once confidence is high enough.
 */
export function SilentPersonaInfer({
  minEvents = 2,
  minConfidence = 0.45,
}: {
  minEvents?: number;
  minConfidence?: number;
} = {}) {
  const { classification, hydrated, overridden, applyInferred } = usePersona();
  const ranRef = useRef(false);
  const lastKeyRef = useRef('');

  useEffect(() => {
    // Off unless adaptive mode is explicitly enabled: no browsing signals are sent anywhere.
    if (!ADAPTIVE_PERSONALISATION) return;
    if (!hydrated || overridden) return;
    if (classification.persona !== 'unknown' && classification.confidence >= minConfidence) {
      return;
    }

    const behaviour = readBehaviour();
    const eventScore =
      behaviour.courseViews.length +
      behaviour.centreViews +
      behaviour.feeDepthViews +
      behaviour.franchiseViews +
      behaviour.categoryViews.length +
      (behaviour.visitCount > 1 ? 1 : 0) +
      behaviour.interests.length;

    if (eventScore < minEvents) return;

    const key = `${behaviour.courseViews.join(',')}:${behaviour.centreViews}:${behaviour.feeDepthViews}:${behaviour.franchiseViews}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    let cancelled = false;

    async function run() {
      if (ranRef.current && eventScore < minEvents + 2) return;
      try {
        const payload = classificationToInferPayload(
          classification,
          behaviour,
          window.location.pathname,
        );
        const res = await fetch('/api/persona/infer', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          persona: string;
          confidence: number;
          reason: string;
        };
        if (cancelled) return;
        if (data.persona === 'unknown' || data.confidence < minConfidence) return;

        ranRef.current = true;
        applyInferred({
          persona: data.persona as 'student' | 'professional' | 'parent' | 'franchise',
          confidence: data.confidence,
          reason: data.reason,
        });
        track('persona_changed', {
          from: classification.persona,
          to: data.persona,
          confidence: data.confidence,
          trigger: 'silent_infer',
          acquisition_channel: classification.acquisitionChannel ?? 'direct',
        });
      } catch {
        // Silent failure — site stays on unknown / rule-based classify.
      }
    }

    const t = window.setTimeout(() => void run(), 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [
    hydrated,
    overridden,
    classification,
    minEvents,
    minConfidence,
    applyInferred,
  ]);

  return null;
}
