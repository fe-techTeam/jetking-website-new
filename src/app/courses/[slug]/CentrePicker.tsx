'use client';

import { useId, useState } from 'react';
import { ChevronDown, MapPin, Navigation, Phone } from 'lucide-react';
import { fill } from '@/lib/content/copy/define';
import type { coursesCopy } from '@/lib/content/copy/pages/courses';

export interface PickerCentre {
  slug: string;
  name: string;
  locality: string;
  address: string;
  phone?: string;
}

export interface PickerCity {
  slug: string;
  name: string;
  centres: PickerCentre[];
}

/**
 * Centre strip with an inline city picker: the learner chooses a city and sees only that city's
 * centres (address, call, directions) without leaving the course page.
 */
export function CentrePicker({
  cities,
  centreCount,
  fallbackPhone,
  copy,
}: {
  copy: typeof coursesCopy.defaults;
  cities: PickerCity[];
  centreCount: number;
  fallbackPhone: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(cities[0]?.slug ?? '');
  const panelId = useId();
  const active = cities.find((c) => c.slug === selected) ?? cities[0];

  return (
    <div className="cp-card mt-12 p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[1.375rem] leading-tight font-bold text-[var(--cp-ink)]">
            {copy['centrePicker.availablePrefix']} <span className="text-[var(--cp-red)]">{centreCount}</span>{' '}
            {centreCount === 1 ? copy['centrePicker.centreOne'] : copy['centrePicker.centreMany']}
          </p>
          <p className="mt-1 text-[15px] text-[var(--cp-ink-2)]">
            {fill(copy['centrePicker.across'], {
              count: cities.length,
              unit: cities.length === 1 ? copy['centrePicker.cityOne'] : copy['centrePicker.cityMany'],
            })}
          </p>
        </div>
        <button
          type="button"
          className="cp-btn shrink-0"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? copy['centrePicker.hide'] : copy['centrePicker.find']}
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </div>

      <div id={panelId} hidden={!open} className="mt-6 border-t border-[var(--cp-line)] pt-6">
        <div className="sm:hidden">
          <label htmlFor={`${panelId}-city`} className="mb-1.5 block text-[13px] font-bold text-[var(--cp-ink-2)]">
            {copy['centrePicker.cityLabel']}
          </label>
          <div className="relative">
            <select
              id={`${panelId}-city`}
              value={active?.slug}
              onChange={(e) => setSelected(e.target.value)}
              className="min-h-12 w-full appearance-none rounded-xl border border-[var(--cp-line)] bg-[var(--cp-bg)] py-2 pr-10 pl-4 text-[16px] font-bold text-[var(--cp-ink)]"
            >
              {cities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name} ({city.centres.length})
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-[var(--cp-ink-2)]"
              aria-hidden="true"
            />
          </div>
        </div>
        <div role="tablist" aria-label={copy['centrePicker.tabsLabel']} className="-mx-1 hidden gap-2 overflow-x-auto px-1 pb-2 sm:flex">
          {cities.map((city) => {
            const on = city.slug === active?.slug;
            return (
              <button
                key={city.slug}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSelected(city.slug)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[14px] font-bold transition-colors ${
                  on
                    ? 'border-[var(--cp-red-fill)] bg-[var(--cp-red-fill)] text-white'
                    : 'border-[var(--cp-line)] bg-[var(--cp-bg)] text-[var(--cp-ink)] hover:border-[var(--cp-red)]'
                }`}
              >
                {city.name}
                <span className={`text-[12px] ${on ? 'text-white/85' : 'text-[var(--cp-ink-2)]'}`}>{city.centres.length}</span>
              </button>
            );
          })}
        </div>

        {active ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {active.centres.map((centre) => {
              const phone = centre.phone || fallbackPhone;
              const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Jetking ${centre.name} ${centre.address}`)}`;
              return (
                <li key={centre.slug} className="rounded-2xl border border-[var(--cp-line)] bg-[var(--cp-grey)] p-4">
                  <p className="flex items-start gap-2 text-[16px] font-bold text-[var(--cp-ink)]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cp-red)]" aria-hidden="true" />
                    {centre.name}
                  </p>
                  <p className="mt-1.5 text-[14px] leading-snug text-[var(--cp-ink-2)]">{centre.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-[var(--cp-red-fill)] px-4 text-[13.5px] font-bold text-white"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {copy['centrePicker.call']}
                    </a>
                    <a
                      href={maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--cp-line)] bg-[var(--cp-bg)] px-4 text-[13.5px] font-bold text-[var(--cp-ink)]"
                    >
                      <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                      {copy['centrePicker.directions']}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
