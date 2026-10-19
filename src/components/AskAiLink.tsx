'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Sparkles } from 'lucide-react';
import { useSiteCopy } from '@/components/providers/site-copy';

/** "Not sure which course?" nudge into Jetking AI. The caller sets an AA-safe text colour. */
export function AskAiLink({ className = '' }: { className?: string }) {
  const copy = useSiteCopy();
  return (
    <Link
      href={copy['askAi.href'] as Route}
      className={`group/ai inline-flex min-h-11 w-fit items-center gap-1.5 text-[13.5px] font-bold sm:text-[14px] ${className}`}
    >
      <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      <span>
        {copy['askAi.prompt']}{' '}
        <span className="underline-offset-4 group-hover/ai:underline">{copy['askAi.link']}</span>
      </span>
    </Link>
  );
}
