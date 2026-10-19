'use client';

import { useMemo, useState } from 'react';

/** One bookable centre with the place it sits in — the row every location dropdown is built from. */
export interface LocatedCentre {
  slug: string;
  name: string;
  citySlug: string;
  /** Display name of the centre's city. */
  city: string;
  state: string;
}

/**
 * State → City → Centre, kept consistent: the city list follows the chosen state and the centre
 * list follows the chosen city, and a selection that no longer belongs to its parent is dropped
 * — so the submitted triple is always a real one. `null` choices mean "untouched", which lets a
 * signed-in account's (or a Guide handoff's) saved location show through as the default.
 */
export function useEnquiryLocation(
  centres: LocatedCentre[],
  defaults: { state?: string | null; city?: string | null; centre?: string | null } = {},
) {
  const [stateChoice, setStateChoice] = useState<string | null>(null);
  const [cityChoice, setCityChoice] = useState<string | null>(null);
  const [centreChoice, setCentreChoice] = useState<string | null>(null);

  const states = useMemo(
    () => [...new Set(centres.map((c) => c.state).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [centres],
  );

  // A default city with no explicit default state implies its own state.
  const impliedState = useMemo(
    () => centres.find((c) => c.citySlug === defaults.city)?.state ?? '',
    [centres, defaults.city],
  );
  const state = stateChoice ?? defaults.state ?? impliedState;

  const cities = useMemo(() => {
    if (!state) return [];
    const byslug = new Map<string, string>();
    for (const c of centres) if (c.state === state) byslug.set(c.citySlug, c.city);
    return [...byslug]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [centres, state]);
  const wantedCity = cityChoice ?? defaults.city ?? '';
  const city = cities.some((c) => c.slug === wantedCity) ? wantedCity : '';

  const cityCentres = useMemo(
    () => (city ? centres.filter((c) => c.citySlug === city) : []),
    [centres, city],
  );
  const wantedCentre = centreChoice ?? defaults.centre ?? '';
  const centre = cityCentres.some((c) => c.slug === wantedCentre) ? wantedCentre : '';

  return {
    states,
    state,
    cities,
    city,
    centres: cityCentres,
    centre,
    chosenCentre: cityCentres.find((c) => c.slug === centre),
    onState(value: string) {
      setStateChoice(value);
      setCityChoice('');
      setCentreChoice('');
    },
    onCity(value: string) {
      setCityChoice(value);
      setCentreChoice('');
    },
    onCentre: setCentreChoice,
  };
}
