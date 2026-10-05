import { PERSONA_IDS, type KnownPersonaId } from './types';

/**
 * A visitor's own audience pick ("I'm a student"), remembered in their browser so the choice
 * survives a reload or a later visit. It never leaves the device and is only ever written when the
 * visitor makes the choice. Clearing it returns the site to its neutral view.
 */
const KEY = 'jk_persona_choice';

export function readPersonaChoice(): KnownPersonaId | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const persona = (JSON.parse(raw) as { persona?: unknown }).persona;
    return (PERSONA_IDS as readonly unknown[]).includes(persona) ? (persona as KnownPersonaId) : null;
  } catch {
    return null;
  }
}

export function writePersonaChoice(persona: KnownPersonaId): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ persona, at: new Date().toISOString() }));
  } catch {
    // Storage can be blocked (private mode); the pick still applies for this visit.
  }
}

export function clearPersonaChoice(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
