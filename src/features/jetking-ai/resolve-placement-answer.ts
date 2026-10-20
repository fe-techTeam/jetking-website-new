import 'server-only';

import { content } from '@/lib/content';
import type { WantFlags } from '@/features/jetking-ai/intent';

/**
 * Placement answers from the published /placements page — never from blog
 * SEO titles like "100% Placement". Outcomes are support, not a guarantee.
 */

const PLACEMENT_ASK =
  /\b(placement|placed|recruiters?|hiring partners?|job support|get (a )?job|will i get|do (i|you) get|after (the )?course.{0,20}job)\b/i;

export async function resolvePlacementAnswer(input: {
  message: string;
  wants: WantFlags;
}): Promise<{ text: string; reason: string } | null> {
  const { message, wants } = input;
  if (!wants.wantPlacement && !PLACEMENT_ASK.test(message)) return null;

  // Course-recommendation asks ("best course for a cyber job") belong to the
  // course catalogue path, not this placement brief.
  if (
    /\b(best|which|recommend|suggest)\b.{0,40}\bcourse/i.test(message) ||
    /\bcourse\b.{0,40}\b(best|recommend|for (a )?job)\b/i.test(message)
  ) {
    return null;
  }

  const page = await content.getPlacementsPage();
  const steps = page.processSteps?.slice(0, 5) ?? [];
  const partners = page.stats?.partners;
  const placed = page.stats?.learnersPlaced;
  const disclaimer =
    page.disclaimer ||
    'Placement support is not a guarantee — outcomes depend on the course, centre, market and the learner.';

  const lines: string[] = [
    '## Placement support at Jetking',
    '',
    page.hero?.lede ||
      "Jetking helps with resume preparation, interview practice and introductions to hiring partners where available.",
    '',
  ];

  if (steps.length) {
    lines.push('**How it works**');
    for (const s of steps) {
      lines.push(`- **${s.title}** — ${s.description}`);
    }
    lines.push('');
  }

  if (partners || placed?.value) {
    lines.push('**Published figures** (from the Jetking placements page)');
    if (partners) lines.push(`- Hiring / placement partners: **${partners}**`);
    if (placed?.value) lines.push(`- ${placed.label || 'Learners placed'}: **${placed.value}**`);
    lines.push('');
  }

  lines.push(`_${disclaimer}_`);
  lines.push('');
  lines.push('_A counsellor can share recent placement records for the course and centre you are considering._');

  return {
    text: lines.join('\n').trim(),
    reason: 'Answered from the published Jetking placements page (support, not a guarantee).',
  };
}
