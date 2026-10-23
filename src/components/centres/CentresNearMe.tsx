'use client';

import { useState } from 'react';
import { LocateFixed, Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics';
import { rankCentresByDistance } from '@/lib/centre-distance';
import { getAccurateUserPosition } from '@/lib/geolocation';
import type { centresCopy } from '@/lib/content/copy/pages/centres';
import { usePersona } from '@/persona/PersonaProvider';

const EVENT = 'centres:near-me';

export type NearMeCentre = {
  slug: string;
  name: string;
  citySlug: string;
  cityName: string;
  locality: string;
  state: string;
  geo?: { lat: number; lng: number } | null;
};

export type NearMeDetail = {
  slug: string;
  name: string;
  citySlug: string;
  state: string;
  distanceKm: number;
};

export function dispatchCentresNearMe(detail: NearMeDetail) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail }));
}

export function subscribeCentresNearMe(handler: (detail: NearMeDetail) => void) {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<NearMeDetail>).detail;
    if (detail?.slug) handler(detail);
  };
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

type Status = 'idle' | 'locating' | 'denied' | 'unavailable' | 'error' | 'none';

/**
 * Hero CTA — asks for a high-accuracy GPS fix, finds the nearest mapped centre,
 * then notifies CentresIndex to filter/open/scroll to it.
 */
export function CentresNearMe({
  centres,
  copy,
}: {
  centres: NearMeCentre[];
  copy: typeof centresCopy.defaults;
}) {
  const { classification } = usePersona();
  const [status, setStatus] = useState<Status>('idle');

  async function locate() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }

    setStatus('locating');

    try {
      const origin = await getAccurateUserPosition();
      const ranked = rankCentresByDistance(centres, {
        lat: origin.lat,
        lng: origin.lng,
      });
      const nearest = ranked[0];
      if (!nearest) {
        setStatus('none');
        return;
      }

      setStatus('idle');
      track('centre_near_me', {
        centre: nearest.slug,
        distance_km: Math.round(nearest.distanceKm * 10) / 10,
        accuracy_m: Math.round(origin.accuracyM),
        persona: classification.persona,
      });

      dispatchCentresNearMe({
        slug: nearest.slug,
        name: nearest.name,
        citySlug: nearest.citySlug,
        state: nearest.state,
        distanceKm: nearest.distanceKm,
      });

      document
        .getElementById('centres-index')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? Number((error as { code: number }).code)
          : NaN;
      if (code === 1) setStatus('denied');
      else if (code === 0) setStatus('unavailable');
      else setStatus('error');
    }
  }

  const statusMessage =
    status === 'denied'
      ? copy['directoryNearMe.denied']
      : status === 'unavailable'
        ? copy['directoryNearMe.unavailable']
        : status === 'error'
          ? copy['directoryNearMe.error']
          : status === 'none'
            ? copy['directoryNearMe.none']
            : null;

  return (
    <div className="mt-3.5">
      <button
        type="button"
        onClick={locate}
        disabled={status === 'locating'}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--dc-hairline-strong)] bg-[var(--dc-card)] px-4 py-2.5 text-[13.5px] font-bold text-[var(--dc-ink)] shadow-sm transition-colors hover:border-[var(--dc-accent-soft)]/55 hover:bg-[var(--dc-accent-tint)] hover:text-[var(--dc-accent-soft)] disabled:cursor-wait disabled:opacity-80"
      >
        {status === 'locating' ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} aria-hidden="true" />
        ) : (
          <LocateFixed className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        )}
        {status === 'locating' ? copy['directoryNearMe.locating'] : copy['directoryNearMe.label']}
      </button>

      {statusMessage ? (
        <p role="status" className="mt-2.5 max-w-[42ch] text-[13px] leading-snug text-[var(--dc-ink-muted)]">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
