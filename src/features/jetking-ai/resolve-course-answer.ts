import 'server-only';

import { content } from '@/lib/content';
import type { Course, CourseLevel } from '@/lib/content/types';
import { FEES_COUNSELLOR_ANSWER } from '@/features/jetking-ai/format-passage';
import type { WantFlags } from '@/features/jetking-ai/intent';

/**
 * Deterministic course answers from published catalogue records — the same
 * source the /courses pages use. Semantic search over scraped SEO/blog blobs
 * kept winning "what courses / fees / BCA vs MCA" questions with chrome like
 * "HELP — … Contact Us" or competitor pages; this path never invents and never
 * quotes undisclosed fees.
 */

const LEVEL_LABEL: Record<CourseLevel, string> = {
  degree: 'Degree',
  diploma: 'Diploma / Career',
  certification: 'Certification',
  short: 'Short course',
};

const CATALOGUE_RE =
  /\b(what courses|which courses|which course|about (the )?courses|list (all )?(the )?(courses|diplomas?|programmes?|programs?)|courses (do you|does (jetking|jk)|are|available)|jetking offer|all courses|course (list|catalogue|catalog)|explore courses|show (me )?courses)\b/i;

const COMPARE_RE = /\b(difference|differ|vs\.?|versus|compare|comparison|ya|aur|or)\b/i;

const AFTER_12TH_RE = /\bafter\s*(12th|twelfth|10\s*\+?\s*2|hsc|intermediate)\b/i;

const RECOMMEND_RE =
  /\b(best|recommend|suggest|suitable|which course|good (course|option)|karna hai|for (a )?(job|career))\b/i;

function openAfter12th(c: Course): boolean {
  return /\b(10\s*\+?\s*2|12th|twelfth|hsc|any stream|recognised board)\b/i.test(c.eligibility);
}

function levelFilter(message: string): CourseLevel | null {
  if (/\bdiplomas?\b/i.test(message)) return 'diploma';
  if (/\bdegrees?\b|\bbca\b|\bmca\b/i.test(message) && /\b(list|offer|courses?)\b/i.test(message)) {
    if (/\bdiplomas?\b/i.test(message)) return 'diploma';
    if (/\bdegrees?\b/i.test(message)) return 'degree';
  }
  if (/\bdegrees?\b/i.test(message) && CATALOGUE_RE.test(message)) return 'degree';
  if (/\bcertifications?\b/i.test(message) && CATALOGUE_RE.test(message)) return 'certification';
  if (/\bshort courses?\b/i.test(message)) return 'short';
  return null;
}

function techFilter(message: string): RegExp | null {
  const m = message.toLowerCase();
  if (/\bcloud\b/.test(m)) return /cloud/i;
  if (/\bcyber|security|hacking|ethical\b/.test(m)) return /cyber|security|hacking|ethical/i;
  if (/\bnetwork|ccna|routing\b/.test(m)) return /network|routing|switching|ccna/i;
  if (/\bdata\b|\banalyst\b/.test(m)) return /data|analyst/i;
  if (/\bgaming|metaverse|animation|multimedia\b/.test(m)) return /gaming|metaverse|animation|multimedia/i;
  if (/\baws\b/.test(m)) return /\baws\b/i;
  if (/\blinux|red ?hat|rhcsa\b/.test(m)) return /linux|red.?hat|rhcsa/i;
  if (/\bhardware\b/.test(m)) return /hardware/i;
  if (/\bmarketing\b/.test(m)) return /marketing/i;
  return null;
}

function matchCourses(all: Course[], subject: string | null, message: string): Course[] {
  const m = message.toLowerCase();
  const out: Course[] = [];

  const push = (c: Course) => {
    if (!out.some((x) => x.slug === c.slug)) out.push(c);
  };

  if (/\bbca\b/.test(m)) all.filter((c) => c.slug.startsWith('bca-')).forEach(push);
  if (/\bmca\b/.test(m)) all.filter((c) => c.slug.startsWith('mca-')).forEach(push);

  if (subject) {
    const key = subject.toLowerCase();
    for (const c of all) {
      // Title / shortTitle / slug only — summaries often name adjacent topics
      // ("ethical hacking" inside a cloud degree) and would over-match.
      const hay = `${c.title} ${c.shortTitle} ${c.slug}`.toLowerCase();
      if (key === 'bca' && c.slug.startsWith('bca-')) push(c);
      else if (key === 'mca' && c.slug.startsWith('mca-')) push(c);
      else if (key === 'ethical hacking' && /ethical.?hacking|hacking.?specialist/.test(hay)) push(c);
      else if (key === 'cloud computing' && /cloud/.test(hay)) push(c);
      else if (key === 'cyber security' && /cyber|security/.test(hay)) push(c);
      else if (key === 'networking' && /network|routing|switching/.test(hay)) push(c);
      else if (key === 'animation & gaming') {
        if (/\bmetaverse\b/i.test(message) && /metaverse|gaming/.test(hay)) push(c);
        else if (/\banimation\b/i.test(message) && /animation|multimedia/.test(hay)) push(c);
        else if (/gaming|metaverse|animation|multimedia/.test(hay)) push(c);
      }
      else if (key === 'ai & data science' && /data|analyst|\bai\b/.test(hay)) push(c);
      else if (key === 'hardware & networking' && /hardware|network/.test(hay)) push(c);
      else if (key === 'blockchain' && /blockchain/.test(hay)) push(c);
    }
  }

  const tech = techFilter(message);
  if (tech && out.length === 0) {
    all.filter((c) => tech.test(`${c.title} ${c.slug} ${c.summary}`)).forEach(push);
  }

  // Exact short-title / title contains for phrases like "Ethical Hacking course"
  if (out.length === 0) {
    for (const c of all) {
      if (m.includes(c.shortTitle.toLowerCase().replace(/—/g, ' ').trim())) push(c);
      else if (m.includes(c.title.toLowerCase())) push(c);
    }
  }

  return out;
}

function formatCatalogue(courses: Course[], heading: string): string {
  const byLevel = new Map<CourseLevel, Course[]>();
  for (const c of courses) {
    const list = byLevel.get(c.level) ?? [];
    list.push(c);
    byLevel.set(c.level, list);
  }
  const order: CourseLevel[] = ['degree', 'diploma', 'certification', 'short'];
  const lines: string[] = [`## ${heading}`, ''];
  for (const level of order) {
    const group = byLevel.get(level);
    if (!group?.length) continue;
    lines.push(`### ${LEVEL_LABEL[level]}`);
    for (const c of group) {
      lines.push(`- **${c.title}** — ${c.duration}`);
    }
    lines.push('');
  }
  lines.push('_Ask about any course for eligibility, curriculum, duration or fees._');
  return lines.join('\n').trim();
}

function formatCourseCard(c: Course, facet: 'overview' | 'eligibility' | 'duration' | 'curriculum'): string {
  if (facet === 'eligibility') {
    return [`## Eligibility — ${c.shortTitle}`, c.eligibility].join('\n');
  }
  if (facet === 'duration') {
    return [`## Duration — ${c.shortTitle}`, `**${c.title}** runs for **${c.duration}**.`].join('\n');
  }
  if (facet === 'curriculum') {
    const lines = [`## What you'll learn — ${c.shortTitle}`, ''];
    for (const mod of c.modules.slice(0, 8)) lines.push(`- ${mod}`);
    if (c.certifications.length) {
      lines.push('', `**Certifications prepared for:** ${c.certifications.join(', ')}`);
    }
    return lines.join('\n');
  }
  const lines = [
    `## ${c.title}`,
    '',
    c.summary,
    '',
    `- **Level:** ${LEVEL_LABEL[c.level]}`,
    `- **Duration:** ${c.duration}`,
    `- **Eligibility:** ${c.eligibility}`,
  ];
  if (c.outcomes.length) {
    lines.push('', '**Outcomes**');
    for (const o of c.outcomes.slice(0, 4)) lines.push(`- ${o}`);
  }
  return lines.join('\n');
}

function formatCompare(a: Course, b: Course): string {
  return [
    `## ${a.shortTitle} vs ${b.shortTitle}`,
    '',
    `### ${a.title}`,
    `- **Duration:** ${a.duration}`,
    `- **Eligibility:** ${a.eligibility}`,
    `- **Focus:** ${a.summary}`,
    '',
    `### ${b.title}`,
    `- **Duration:** ${b.duration}`,
    `- **Eligibility:** ${b.eligibility}`,
    `- **Focus:** ${b.summary}`,
    '',
    '_A counsellor can help pick the right track for your background and goals._',
  ].join('\n');
}

function formatFeesFor(courses: Course[]): string {
  if (courses.length === 1) {
    const c = courses[0]!;
    const note =
      c.fees.note ??
      'Fees vary by centre and intake. Confirmed by a counsellor.';
    return [
      `## Fees — ${c.shortTitle}`,
      `- ${note}`,
      c.fees.emiAvailable ? '- EMI / instalment options are available on this course.' : null,
      '',
      '_Ask a Jetking counsellor for the exact fee for your centre and intake._',
    ]
      .filter(Boolean)
      .join('\n');
  }
  return FEES_COUNSELLOR_ANSWER;
}

export async function resolveCourseAnswer(input: {
  message: string;
  subject: string | null;
  wants: WantFlags;
}): Promise<{ text: string; reason: string } | null> {
  const { message, subject, wants } = input;
  const all = await content.listCourses();
  if (!all.length) return null;

  const matched = matchCourses(all, subject, message);
  const isCatalogue = CATALOGUE_RE.test(message) || /\b(diploma|degree|certification|short)\s+courses?\b/i.test(message);
  const isCompare =
    COMPARE_RE.test(message) &&
    ((/\bbca\b/i.test(message) && /\bmca\b/i.test(message)) || matched.length >= 2);

  // Fees are never published as a single figure on the live site.
  if (wants.wantFees) {
    return {
      text: formatFeesFor(matched),
      reason: matched.length
        ? 'Answered fees from the published catalogue note (fees are not disclosed as a fixed figure).'
        : 'Answered fees from the published policy — exact amounts are confirmed by a counsellor.',
    };
  }

  if (isCompare) {
    const a = matched.find((c) => c.slug.startsWith('bca-')) ?? matched[0];
    const b = matched.find((c) => c.slug.startsWith('mca-')) ?? matched[1];
    if (a && b && a.slug !== b.slug) {
      return {
        text: formatCompare(a, b),
        reason: 'Compared verified course records from the Jetking catalogue.',
      };
    }
  }

  // "courses after 12th" / "best course for cyber security job" — catalogue only.
  if (AFTER_12TH_RE.test(message) || (RECOMMEND_RE.test(message) && (subject || techFilter(message)))) {
    const tech = techFilter(message);
    let list = matched.length ? matched : all;
    if (AFTER_12TH_RE.test(message)) list = list.filter(openAfter12th);
    if (tech) list = list.filter((c) => tech.test(`${c.title} ${c.slug}`));
    if (!list.length) list = AFTER_12TH_RE.test(message) ? all.filter(openAfter12th) : matched;
    if (list.length) {
      const heading = AFTER_12TH_RE.test(message)
        ? 'Courses open after 12th / 10+2'
        : subject
          ? `Jetking courses for ${subject}`
          : 'Matching Jetking courses';
      return {
        text: [
          formatCatalogue(list, heading),
          '',
          '_A counsellor can help pick the best fit for your stream, city and goals — Jetking does not guarantee a specific job outcome._',
        ].join('\n'),
        reason: 'Recommended programmes from the published Jetking course catalogue.',
      };
    }
  }

  if (isCatalogue) {
    const level = levelFilter(message);
    const tech = techFilter(message);
    let list = all;
    if (level) list = list.filter((c) => c.level === level);
    if (tech) list = list.filter((c) => tech.test(`${c.title} ${c.slug} ${c.summary}`));
    if (matched.length && (tech || level)) {
      list = matched.filter((c) => list.some((x) => x.slug === c.slug));
    } else if (matched.length && tech) {
      list = matched;
    }
    if (!list.length) list = matched.length ? matched : all;
    const heading =
      level && tech
        ? `${LEVEL_LABEL[level]} courses — filtered`
        : level
          ? `${LEVEL_LABEL[level]} courses at Jetking`
          : tech
            ? 'Matching Jetking courses'
            : 'Courses Jetking offers';
    return {
      text: formatCatalogue(list, heading),
      reason: 'Listed programmes from the published Jetking course catalogue.',
    };
  }

  // Subject / named course with a facet — answer from the structured record.
  if (matched.length === 1) {
    const c = matched[0]!;
    if (wants.wantEligibility) {
      return { text: formatCourseCard(c, 'eligibility'), reason: 'Answered eligibility from the published course page.' };
    }
    if (wants.wantDuration) {
      return { text: formatCourseCard(c, 'duration'), reason: 'Answered duration from the published course page.' };
    }
    if (wants.wantCurriculum) {
      return { text: formatCourseCard(c, 'curriculum'), reason: 'Answered curriculum from the published course modules.' };
    }
    if (wants.wantCourse || subject) {
      return { text: formatCourseCard(c, 'overview'), reason: 'Answered from the published course record.' };
    }
  }

  // "cloud computing courses" / "diploma courses in cyber" without catalogue phrasing
  if (wants.wantCourse && !wants.wantCurriculum && !wants.wantEligibility && !wants.wantDuration) {
    const level = levelFilter(message);
    const tech = techFilter(message);
    if (tech || level) {
      let list = matched.length ? matched : all;
      if (level) list = list.filter((c) => c.level === level);
      if (tech) list = list.filter((c) => tech.test(`${c.title} ${c.slug}`));
      if (!list.length && matched.length) list = matched;
      if (list.length) {
        return {
          text: formatCatalogue(
            list,
            tech ? 'Matching Jetking courses' : `${LEVEL_LABEL[level!]} courses at Jetking`,
          ),
          reason: 'Listed matching programmes from the published catalogue.',
        };
      }
    }
  }

  if (matched.length > 1 && (wants.wantCourse || subject) && !wants.wantEligibility && !wants.wantDuration && !wants.wantCurriculum) {
    return {
      text: formatCatalogue(matched, `Jetking courses related to ${subject ?? 'your question'}`),
      reason: 'Listed matching programmes from the published catalogue.',
    };
  }

  // Several matches (e.g. two BCA tracks) — list each rather than picking one at random.
  if (matched.length > 1 && wants.wantEligibility) {
    const lines = ['## Eligibility', ''];
    for (const c of matched) {
      lines.push(`### ${c.shortTitle}`, c.eligibility, '');
    }
    return {
      text: lines.join('\n').trim(),
      reason: 'Answered eligibility from the published course pages.',
    };
  }
  if (matched.length > 1 && wants.wantDuration) {
    // Prefer the programme the question names (e.g. metaverse over a broad BCA).
    const preferred =
      (/\bmetaverse\b/i.test(message) && matched.find((c) => /metaverse/i.test(c.slug))) ||
      (/\bgaming\b/i.test(message) && matched.find((c) => /gaming|metaverse/i.test(c.slug))) ||
      (/\banimation\b/i.test(message) && matched.find((c) => /animation|multimedia/i.test(c.slug))) ||
      null;
    if (preferred) {
      return {
        text: formatCourseCard(preferred, 'duration'),
        reason: 'Answered duration from the published course page.',
      };
    }
    const lines = ['## Duration', ''];
    for (const c of matched) {
      lines.push(`- **${c.shortTitle}:** ${c.duration}`);
    }
    return {
      text: lines.join('\n'),
      reason: 'Answered duration from the published course pages.',
    };
  }

  return null;
}
