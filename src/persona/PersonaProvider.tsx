'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { classify } from './classify';
import { markVisit, readBehaviour, recordBehaviour, type BehaviourEvent } from './behaviour';
import { PERSONA_COOKIE, decodePersonaCookieUnverified, payloadToSignals } from './cookie';
import type { AcquisitionChannel } from './channel';
import {
  UNKNOWN_CLASSIFICATION,
  type Classification,
  type KnownPersonaId,
  type SignalHit,
} from './types';
import {
  ensureVisitorId,
  type VisitorProfile,
  type VisitorState,
} from './visitor';
import {
  EMPTY_USER_PROFILE,
  buildUserProfile,
  cacheUserProfile,
  clearIntentLock,
  lockIntent,
  readIntentLock,
  type UserProfile,
} from './profile';
import { track } from '@/lib/analytics';
import { ADAPTIVE_PERSONALISATION } from './mode';
import { clearPersonaChoice, readPersonaChoice, writePersonaChoice } from './choice';

/**
 * Client persona engine — hydration-safe.
 * Silent inference can apply a model/heuristic guess without a “who are you?” UI.
 * Anonymous visitor ID is minted/restored here for same-browser journey resume.
 * UserProfile (persona + intent + stage + next best action) is rebuilt on every
 * meaningful change so personalization can go beyond persona alone.
 */

interface PersonaContextValue {
  classification: Classification;
  hydrated: boolean;
  /** Anonymous first-party visitor ID (`JK_…`) — same browser only. */
  visitor: VisitorProfile;
  /**
   * Rich adaptive profile. Prefer this over `classification` alone when choosing
   * CTAs, homepage blocks, or resume prompts.
   */
  profile: UserProfile;
  record: (event: BehaviourEvent) => void;
  override: (persona: Classification['persona'] | null) => void;
  /** Quiet model/heuristic result — does not set overridden (engine can keep learning). */
  applyInferred: (result: {
    persona: KnownPersonaId;
    confidence: number;
    reason: string;
  }) => void;
  /** Lock a career/topic intent (AI save flow, roadmap, etc.). */
  setIntent: (intent: string, intentKey?: string) => void;
  clearIntent: () => void;
  overridden: boolean;
}

const EMPTY_VISITOR: VisitorProfile = {
  id: '',
  state: 'new' as VisitorState,
  minted: true,
};

const PersonaContext = createContext<PersonaContextValue>({
  classification: UNKNOWN_CLASSIFICATION,
  hydrated: false,
  visitor: EMPTY_VISITOR,
  profile: EMPTY_USER_PROFILE,
  record: () => {},
  override: () => {},
  applyInferred: () => {},
  setIntent: () => {},
  clearIntent: () => {},
  overridden: false,
});

function readCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

/** A classification that exists only because the visitor chose it. */
function manualClassification(
  persona: Classification['persona'],
  channel: AcquisitionChannel | undefined,
): Classification {
  return {
    persona,
    confidence: 1,
    signals: [
      {
        id: 'manual:override',
        persona: persona === 'unknown' ? 'student' : persona,
        weight: 1,
        detail: 'Manually selected — engine inference bypassed',
        source: 'first-touch',
      },
    ],
    version: 'override',
    classifiedAt: new Date().toISOString(),
    acquisitionChannel: channel ?? 'direct',
  };
}

function rebuildProfile(
  visitorId: string,
  returning: boolean,
  classification: Classification,
): UserProfile {
  const profile = buildUserProfile({
    visitorId,
    returning,
    classification,
    behaviour: readBehaviour(),
    intentLock: readIntentLock(),
  });
  cacheUserProfile(profile);
  return profile;
}

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [classification, setClassification] = useState<Classification>(UNKNOWN_CLASSIFICATION);
  const [hydrated, setHydrated] = useState(false);
  const [overridden, setOverridden] = useState(false);
  const [visitor, setVisitor] = useState<VisitorProfile>(EMPTY_VISITOR);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_USER_PROFILE);
  const priorSignalsRef = useRef<SignalHit[]>([]);
  const priorChannelRef = useRef<AcquisitionChannel | undefined>(undefined);
  const lastReportedRef = useRef<string>('');
  const lastProfileKeyRef = useRef<string>('');
  /** Soft lock after silent model/heuristic apply — keeps UX stable while browsing. */
  const inferredLockRef = useRef(false);
  const visitorRef = useRef<VisitorProfile>(EMPTY_VISITOR);

  const publishProfile = useCallback((visitorId: string, returning: boolean, next: Classification) => {
    const built = rebuildProfile(visitorId, returning, next);
    setProfile(built);
    const key = `${built.persona}:${built.stage}:${built.intent ?? ''}:${built.nextBestAction.id}`;
    if (lastProfileKeyRef.current !== key) {
      lastProfileKeyRef.current = key;
      track('profile_updated', {
        visitor_id: built.visitorId,
        persona: built.persona,
        stage: built.stage,
        intent: built.intent ?? '',
        confidence: built.confidence,
        returning: built.returning,
        nba: built.nextBestAction.id,
      });
    }
    return built;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const visitorProfile = ensureVisitorId();
      if (cancelled) return;
      visitorRef.current = visitorProfile;
      setVisitor(visitorProfile);
      track('visitor_recognized', {
        visitor_id: visitorProfile.id,
        state: visitorProfile.state,
        minted: visitorProfile.minted,
      });

      // Explicit mode (the default): nothing about the visitor is inferred. The only thing restored
      // is an audience the visitor picked themselves on an earlier visit.
      if (!ADAPTIVE_PERSONALISATION) {
        const choice = readPersonaChoice();
        if (choice && !cancelled) {
          const picked = manualClassification(choice, undefined);
          setOverridden(true);
          setClassification(picked);
          publishProfile(visitorProfile.id, visitorProfile.state === 'known', picked);
        }
        if (!cancelled) setHydrated(true);
        return;
      }

      const payload = decodePersonaCookieUnverified(readCookieValue(PERSONA_COOKIE));
      if (cancelled) return;

      priorSignalsRef.current = payload ? payloadToSignals(payload) : [];
      priorChannelRef.current = payload?.ch;
      markVisit();
      const behaviour = readBehaviour();
      const next = classify({
        priorSignals: priorSignalsRef.current,
        priorChannel: priorChannelRef.current,
        behaviour,
      });
      setClassification(next);
      publishProfile(visitorProfile.id, visitorProfile.state === 'known', next);
      setHydrated(true);

      const key = `${next.persona}:${next.version}:${next.acquisitionChannel ?? ''}`;
      if (lastReportedRef.current !== key) {
        lastReportedRef.current = key;
        track('persona_classified', {
          persona: next.persona,
          confidence: next.confidence,
          rules_version: next.version,
          signal_count: next.signals.length,
          top_signal: next.signals[0]?.id ?? 'none',
          acquisition_channel: next.acquisitionChannel ?? 'direct',
          visitor_id: visitorProfile.id,
        });
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [publishProfile]);

  const record = useCallback(
    (event: BehaviourEvent) => {
      // Explicit mode: no behaviour is collected or learned from until the visitor has picked an audience.
      if (!ADAPTIVE_PERSONALISATION && !overridden) return;
      recordBehaviour(event);
      const v = visitorRef.current;
      if (overridden) {
        publishProfile(v.id, v.state === 'known', classification);
        return;
      }
      if (inferredLockRef.current) {
        publishProfile(v.id, v.state === 'known', classification);
        return;
      }
      const previous = classification.persona;
      const behaviour = readBehaviour();
      const next = classify({
        priorSignals: priorSignalsRef.current,
        priorChannel: priorChannelRef.current,
        behaviour,
      });
      setClassification(next);
      publishProfile(v.id, v.state === 'known', next);
      if (next.persona !== previous) {
        track('persona_changed', {
          from: previous,
          to: next.persona,
          confidence: next.confidence,
          trigger: event.kind,
          acquisition_channel: next.acquisitionChannel ?? 'direct',
        });
      }
    },
    [classification, overridden, publishProfile],
  );

  const applyInferred = useCallback(
    (result: { persona: KnownPersonaId; confidence: number; reason: string }) => {
      if (overridden) return;
      inferredLockRef.current = true;
      const next: Classification = {
        persona: result.persona,
        confidence: result.confidence,
        signals: [
          {
            id: 'infer:silent-model',
            persona: result.persona,
            weight: result.confidence,
            detail: result.reason,
            source: 'behaviour',
          },
          ...priorSignalsRef.current,
        ],
        version: classification.version,
        classifiedAt: new Date().toISOString(),
        acquisitionChannel: priorChannelRef.current ?? classification.acquisitionChannel,
      };
      setClassification(next);
      const v = visitorRef.current;
      publishProfile(v.id, v.state === 'known', next);
    },
    [overridden, classification.version, classification.acquisitionChannel, publishProfile],
  );

  const override = useCallback(
    (persona: Classification['persona'] | null) => {
      const v = visitorRef.current;
      if (persona === null || (persona === 'unknown' && !ADAPTIVE_PERSONALISATION)) {
        setOverridden(false);
        inferredLockRef.current = false;
        clearPersonaChoice();
        // Adaptive mode goes back to inferring; explicit mode goes back to the neutral site.
        const next = ADAPTIVE_PERSONALISATION
          ? classify({
              priorSignals: priorSignalsRef.current,
              priorChannel: priorChannelRef.current,
              behaviour: readBehaviour(),
            })
          : UNKNOWN_CLASSIFICATION;
        setClassification(next);
        publishProfile(v.id, v.state === 'known', next);
        return;
      }
      setOverridden(true);
      inferredLockRef.current = false;
      if (persona !== 'unknown') writePersonaChoice(persona);
      const next = manualClassification(persona, priorChannelRef.current);
      setClassification(next);
      publishProfile(v.id, v.state === 'known', next);
    },
    [publishProfile],
  );

  const setIntent = useCallback(
    (intent: string, intentKey?: string) => {
      lockIntent(intent, intentKey);
      const v = visitorRef.current;
      publishProfile(v.id, v.state === 'known', classification);
    },
    [classification, publishProfile],
  );

  const clearIntent = useCallback(() => {
    clearIntentLock();
    const v = visitorRef.current;
    publishProfile(v.id, v.state === 'known', classification);
  }, [classification, publishProfile]);

  const value = useMemo<PersonaContextValue>(
    () => ({
      classification,
      hydrated,
      visitor,
      profile,
      record,
      override,
      applyInferred,
      setIntent,
      clearIntent,
      overridden,
    }),
    [
      classification,
      hydrated,
      visitor,
      profile,
      record,
      override,
      applyInferred,
      setIntent,
      clearIntent,
      overridden,
    ],
  );

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona(): PersonaContextValue {
  return useContext(PersonaContext);
}
