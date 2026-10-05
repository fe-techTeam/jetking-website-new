'use client';

import { GraduationCap, Target, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePersona } from '@/persona/PersonaProvider';
import { track } from '@/lib/analytics';
import type { EventName } from '@/lib/analytics';
import type { HomeCopy } from '@/lib/content/copy/pages/home';

/**
 * The light three-up promise bar that closes the v2 lead. Each item jumps to its section on this page (no page exits).
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

export function ActionBar({ copy }: { copy: HomeCopy }) {
  const { classification } = usePersona();

  const actions: Action[] = [
    {
      icon: Wrench,
      label: copy['actions.0.label'],
      href: copy['actions.0.href'],
    },
    {
      icon: GraduationCap,
      label: copy['actions.1.label'],
      href: copy['actions.1.href'],
    },
    {
      icon: Target,
      label: copy['actions.2.label'],
      href: copy['actions.2.href'],
    },
  ];

  return (
    <nav
      aria-label={copy['actions.ariaLabel']}
      className="overflow-hidden rounded-[16px] border border-[var(--v2-hairline)] bg-[var(--v2-card)] text-[var(--v2-ink)] shadow-[0_8px_24px_-16px_rgb(16_16_24/0.25)]"
    >
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:h-[68px] lg:grid-cols-none lg:flex-row lg:items-stretch 3xl:h-[72px]">
        {actions.map((action, index) => (
          <li
            key={action.label}
            className="flex-1 border-t border-[var(--v2-hairline)] first:border-t-0 sm:border-t-0 sm:border-l sm:[&:nth-child(-n+2)]:border-t-0 sm:[&:nth-child(2n+1)]:border-l-0 lg:border-t-0 lg:border-l lg:first:border-l-0"
          >
            <a
              href={action.href}
              onClick={() =>
                action.event
                  ? track(action.event, {
                      persona: classification.persona,
                      source: 'home-v2-action-bar',
                      position: index + 1,
                    })
                  : undefined
              }
              className="flex min-h-[56px] items-center justify-start gap-3.5 px-4 py-3.5 transition-colors duration-200 hover:bg-[var(--v2-accent)]/8 xs:gap-4 xs:px-5 lg:h-full lg:justify-center lg:px-5 lg:py-0 xl:px-6"
            >
              <span
                aria-hidden="true"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--v2-accent)]/10 text-[var(--v2-accent-soft)]"
              >
                <action.icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <span className="min-w-0 text-[14px] font-bold xs:text-[15px]">{action.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
