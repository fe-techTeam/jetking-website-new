'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { GraduationCap, Target, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePersona } from '@/persona/PersonaProvider';
import { track } from '@/lib/analytics';
import type { EventName } from '@/lib/analytics';

/**
 * The dark three-up action bar that closes the v2 lead.
 *
 * Carries the hero promise: Industry-Relevant Training. Real-World Projects.
 * Placement Support That Delivers.
 */

interface Action {
  icon: LucideIcon;
  label: string;
  href: string;
  event?: EventName;
}

export function ActionBar() {
  const { classification } = usePersona();

  const actions: Action[] = [
    {
      icon: Wrench,
      label: 'Industry-Relevant Training',
      href: '/courses',
    },
    {
      icon: GraduationCap,
      label: 'Real-World Projects',
      href: '/courses?level=degree',
    },
    {
      icon: Target,
      label: 'Placement Support That Delivers',
      href: '/placements',
    },
  ];

  return (
    <nav
      aria-label="Next steps"
      className="v2-bar-glow overflow-hidden rounded-[12px] border border-[var(--v2-accent)]/28 bg-[var(--v2-ink-bar)] text-white xs:rounded-[14px] lg:rounded-[12px]"
    >
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:h-[68px] lg:grid-cols-none lg:flex-row lg:items-stretch 3xl:h-[72px]">
        {actions.map((action, index) => (
          <li
            key={action.label}
            className="flex-1 border-t border-white/12 first:border-t-0 sm:border-t-0 sm:border-l sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(2n+1)]:border-l-0 lg:border-t-0 lg:border-l lg:first:border-l-0"
          >
            <Link
              href={action.href as Route}
              onClick={() =>
                action.event
                  ? track(action.event, {
                      persona: classification.persona,
                      source: 'home-v2-action-bar',
                      position: index + 1,
                    })
                  : undefined
              }
              className="flex min-h-[56px] items-center justify-start gap-3.5 px-4 py-3.5 transition-colors duration-200 hover:bg-[var(--v2-accent)]/12 xs:gap-4 xs:px-5 lg:h-full lg:justify-center lg:px-5 lg:py-0 xl:px-6"
            >
              <action.icon
                className="h-5 w-5 shrink-0 text-[var(--v2-accent-soft)] xs:h-6 xs:w-6"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="min-w-0 text-[14px] font-bold xs:text-[15px]">{action.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
