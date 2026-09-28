/**
 * Turn raw Jetking KB passage text into clean, structured markdown the chat
 * UI can render as headings, lists, and fact rows — instead of a run-on blob.
 */

export interface PassageHit {
  type: string;
  text: string;
}

function cleanSpace(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Undoes two `.text()`-extraction glue artifacts that show up in scraped
 * course content, the same class of bug CENTRE_ITEM below already patches
 * for centre names:
 *
 *   1. A page's <title>/OG-title leaking in front of the real sentence that
 *      follows it, with no separator — "IT Courses — Cloud, Cyber Security &
 *      DevOps | Jetking Any graduate or 10+2 student…" is the SEO title
 *      glued to the actual eligibility text.
 *   2. A numbered step-badge glued to the accordion heading it labels —
 *      "04Semester 4Machine learning…" is the "04" badge, "Semester 4", and
 *      that panel's content with every separator dropped.
 *
 * Exported so route.ts can clean hit text once, before it's used either as
 * LLM context or as input to the formatters below — cleaning only the
 * formatted (fallback) output would leave the glue in the LLM's context.
 */
export function cleanPassageText(text: string): string {
  return text
    // Un-serialised JS objects that leaked into scraped/indexed content.
    .replace(/(?:What students gain:\s*)?(?:\[object Object\](?:,\s*)?)+/g, '')
    .replace(/^[A-Z][\w&,.\-–—' ]{4,70}?\|\s*Jetking\.?\s+(?=[A-Z])/, '')
    .replace(/\b\d{1,2}((?:Semester|Module|Year|Phase|Level)\s*\d+)(?=[A-Z])/g, '$1: ');
}

/** Split "A. B. C." style module lists into bullets (keeps short sentences out). */
function sentenceBullets(text: string): string[] {
  return cleanPassageText(text)
    .split(/(?<=\.)\s+(?=[A-Z0-9])/)
    .map((s) => s.replace(/\.$/, '').trim())
    .filter((s) => s.length >= 8 && s.length <= 160);
}

function splitTitleBody(text: string): { title: string; body: string } {
  const nl = text.indexOf('\n');
  if (nl > 0 && nl <= 100) {
    return { title: cleanSpace(text.slice(0, nl)), body: cleanSpace(text.slice(nl + 1)) };
  }
  // Em-dash / " — " title prefixes common in scraped page titles.
  const em = text.match(/^(.{12,90}?)\s+[—–-]\s+(.+)$/s);
  if (em) {
    let body = cleanSpace(em[2]!);
    // Drop SEO crumbs like "… Courses & Training Institute in Borivali "
    // City is a single token so we do not eat the real module name after it.
    body = body.replace(/^.+?Courses?\s*&\s*Training Institutes?\s+in\s+[A-Za-z]+\s+/i, '');
    return { title: cleanSpace(em[1]!), body };
  }
  return { title: '', body: cleanSpace(text) };
}

function formatFeesChunk(body: string): string {
  const name =
    body.match(/^Fees for\s+(.+?)\s+Course fee:/i)?.[1] ??
    body.match(/^Fees for\s+(.+?)(?:\.|$)/i)?.[1] ??
    '';
  const fee = body
    .match(/Course fee:\s*([^.]+\.?)/i)?.[1]
    ?.trim()
    .replace(/\.$/, '');
  const payment = body
    .match(/Payment:\s*([^.]+\.?)/i)?.[1]
    ?.trim()
    .replace(/\.$/, '');
  const duration =
    body.match(/runs for\s+([\d.]+\s*(?:months?|years?|weeks?))/i)?.[1]?.trim() ??
    body.match(/runs for\s+([^.]+)/i)?.[1]?.trim();

  const lines: string[] = [];
  lines.push(`## ${name ? `Fees — ${name}` : 'Fees & payment'}`);
  if (fee) lines.push(`- **Course fee:** ${fee}`);
  if (payment) lines.push(`- **Payment:** ${payment}`);
  if (duration) lines.push(`- **Duration:** ${duration}`);
  if (!fee && !payment && !duration) lines.push(body);
  return lines.join('\n');
}

function formatFees(text: string): string {
  const body = cleanSpace(text);
  const chunks = body
    .split(/(?=Fees for\s+)/i)
    .map((c) => c.trim())
    .filter((c) => /^Fees for\s+/i.test(c));
  const sections = (chunks.length > 1 ? chunks : [body]).map(formatFeesChunk);
  sections.push('_Exact fees are confirmed by a Jetking counsellor for your centre and intake._');
  return sections.join('\n\n');
}

function formatCurriculum(text: string): string {
  const body = cleanSpace(text);
  const named = body.match(/^What you will study in\s+(.+?)(?=\s+[A-Z][a-z])/);
  // Prefer explicit "What you will study in COURSE Topics…"
  const studyMatch = body.match(/^What you will study in\s+(.+)$/i);
  let course = '';
  let rest = body;

  if (studyMatch) {
    // Course name is usually Title Case words before the first module (often ends before a known topic start).
    // Split after known course-name patterns or take until we hit many short modules.
    const full = studyMatch[1]!;
    // Heuristic: course titles rarely contain "Introduction" / "Fundamentals" as the start of modules.
    const splitAt = full.search(
      /\s(?=(?:Introduction|Fundamentals|Programming|Office|Network|Deploying|Communicative|Inter-Networking|Amazon|AWS|Windows|Linux|Cloud|Cyber|Ethical|Routing)\b)/i,
    );
    if (splitAt > 0) {
      course = full.slice(0, splitAt).trim();
      rest = full.slice(splitAt).trim();
    } else {
      course = named?.[1]?.trim() ?? '';
      rest = full;
    }
  }

  const bullets = sentenceBullets(rest);
  const lines: string[] = [];
  lines.push(`## ${course ? `What you'll learn — ${course}` : "What you'll learn"}`);
  if (bullets.length >= 2) {
    for (const b of bullets.slice(0, 12)) lines.push(`- ${b}`);
  } else {
    lines.push(rest);
  }
  return lines.join('\n');
}

function formatCourse(text: string): string {
  const { title, body } = splitTitleBody(text);
  // Many course rows are "CourseName highlight. highlight. highlight."
  const bullets = sentenceBullets(body || text);
  const heading =
    title ||
    (bullets.length >= 2
      ? (cleanSpace(text)
          .split(/(?<=\.)\s+/)[0]
          ?.replace(/\.$/, '') ?? 'Course overview')
      : 'Course overview');

  // If first sentence was used as heading from body-only, drop it from bullets.
  let items = bullets;
  if (!title && items.length >= 2) {
    const first = items[0]!;
    if (first.length < 80) items = items.slice(1);
  }

  const lines: string[] = [`## ${heading}`];
  if (items.length >= 2) {
    for (const b of items.slice(0, 10)) lines.push(`- ${b}`);
  } else {
    lines.push(body || cleanSpace(text));
  }
  return lines.join('\n');
}

function formatEligibility(text: string): string {
  const body = cleanSpace(text);
  const lines: string[] = ['## Eligibility'];
  const bullets = sentenceBullets(body);
  if (bullets.length >= 2) {
    for (const b of bullets.slice(0, 8)) lines.push(`- ${b}`);
  } else {
    lines.push(body);
  }
  return lines.join('\n');
}

function formatGeneric(text: string, type: string): string {
  const { title, body } = splitTitleBody(text);
  const content = body || cleanSpace(text);
  const bullets = sentenceBullets(content);
  const heading =
    title ||
    (type === 'placement'
      ? 'Placements'
      : type === 'faq'
        ? 'FAQ'
        : type === 'duration'
          ? 'Duration'
          : '');

  const lines: string[] = [];
  if (heading) lines.push(`## ${heading}`);

  // FAQ-style "What will I learn? Answer…"
  const qa = content.match(/^(What[^?]{3,80}\?)\s+(.+)$/i);
  if (qa) {
    lines.push(`### ${qa[1]}`);
    const ansBullets = sentenceBullets(qa[2]!);
    if (ansBullets.length >= 2) {
      for (const b of ansBullets.slice(0, 10)) lines.push(`- ${b}`);
    } else {
      lines.push(qa[2]!);
    }
    return lines.join('\n');
  }

  if (bullets.length >= 3) {
    for (const b of bullets.slice(0, 10)) lines.push(`- ${b}`);
  } else {
    lines.push(content);
  }
  return lines.join('\n');
}

/** "Jetking BorivaliBorivali West" → branch + area */
function splitBranchName(name: string): { branch: string; area: string } {
  const cleaned = name.replace(/\s+/g, ' ').trim();
  const m = cleaned.match(/^(Jetking\s+[A-Za-z]+)([A-Z][A-Za-z\s]*)$/);
  if (m) return { branch: m[1]!.trim(), area: m[2]!.trim() };
  return { branch: cleaned, area: '' };
}

function formatBranchLine(name: string, locality: string): string {
  const { branch, area } = splitBranchName(name);
  const pin = locality.match(/\d{6}/)?.[0];
  const areaFromLoc = locality
    .replace(/\d{6}/g, '')
    .replace(/[·,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const areaFinal = area || areaFromLoc;
  // A type predicate, not `.filter(Boolean)`: `pin` is `string | undefined` and
  // plain `Boolean` does not narrow it away, so the dedupe below cannot call
  // `.toLowerCase()` without tripping strict null checks.
  const bits = [areaFinal, pin].filter((value): value is string => Boolean(value));
  const unique = bits.filter(
    (b, i, arr) => arr.findIndex((x) => x.toLowerCase() === b.toLowerCase()) === i,
  );
  // `**Label**: value` (colon outside bold) → fact rows in AnswerBody (<dl>).
  return `- **${branch}**: ${unique.length ? unique.join(', ') : 'See centre page'}`;
}

/**
 * Structured centre records → chat markdown (branches + programmes).
 */
export function formatCentreRecords(
  centres: Array<{
    city: string;
    summary: string;
    locations: Array<{ name: string; locality: string }>;
    programmes: string[];
  }>,
  title?: string,
  lede?: string,
): string {
  if (!centres.length) return '';

  const lines: string[] = [];
  const heading =
    title?.trim() ||
    (centres.length === 1 ? `Jetking centres in ${centres[0]!.city}` : 'Jetking training centres');
  lines.push(`## ${heading}`, '');

  const intro = (lede || centres[0]?.summary || '').trim();
  if (intro) {
    // Keep one short lead sentence — drop SEO trailers after the first period when long.
    const first = intro.split(/(?<=\.)\s+/)[0] ?? intro;
    // Avoid repeating the heading inside the lede ("Jetking centres in Mumbai offering…")
    const cleaned = first
      .replace(/^Jetking centres?\s+in\s+[A-Za-z\s]+?\s+offering\s+/i, '')
      .replace(/^./, (c) => c.toUpperCase());
    lines.push(
      cleaned.length <= 180 ? cleaned : cleaned.slice(0, 160).replace(/\s+\S*$/, '') + '…',
    );
    lines.push('');
  }

  for (const centre of centres.slice(0, 4)) {
    if (centres.length > 1) {
      lines.push(`### ${centre.city}`, '');
    } else if (centre.locations.length) {
      lines.push('### Branches', '');
    }

    if (centre.locations.length) {
      for (const loc of centre.locations.slice(0, 8)) {
        lines.push(formatBranchLine(loc.name, loc.locality));
      }
      lines.push('');
    } else {
      lines.push(`- Jetking centre in **${centre.city}**`);
      lines.push('');
    }

    if (centre.programmes.length) {
      lines.push(centres.length > 1 ? 'Courses:' : '### Courses commonly offered', '');
      for (const p of centre.programmes.slice(0, 6)) {
        lines.push(`- ${p.replace(/\u2014|\u2013/g, ' - ')}`);
      }
      lines.push('');
    }
  }

  lines.push(
    '_Tell me your locality and a Jetking counsellor can confirm the nearest centre and batch timings._',
  );
  return lines.join('\n').trim();
}

/** Embedding centre SEO blobs → readable markdown (fallback when no structured record). */
function formatCentre(text: string): string {
  const body = cleanSpace(text);
  const cityMatch =
    body.match(
      /^Jetking centres?\s+in\s+([A-Za-z][A-Za-z\s]{1,40}?)(?=\s+(?:offering|Jetking|[A-Z]))/i,
    ) || body.match(/^Jetking centre in\s+([A-Za-z][A-Za-z\s]{1,40}?)(?=\s+)/i);
  const city = cityMatch?.[1]?.trim().replace(/\s+/g, ' ') ?? '';

  let rest = cityMatch ? body.slice(cityMatch[0].length).trim() : body;
  rest = rest
    .replace(/^Jetking centres?\s+in\s+[A-Za-z\s]+?\s+offering\s+/i, '')
    .replace(/\s*Find your nearest\b.+$/i, '')
    .replace(/\s*Jetking\s+[A-Za-z\s]+?\s+branch(?:es)?\b.*$/i, '')
    .replace(/\s*Other centres in\b.+$/i, '')
    .trim();

  const lines: string[] = [];
  lines.push(`## ${city ? `Jetking centres in ${city}` : 'Jetking training centres'}`, '');
  if (rest) {
    const bullets = sentenceBullets(rest);
    if (bullets.length >= 2) {
      for (const b of bullets.slice(0, 6)) lines.push(`- ${b}`);
    } else {
      lines.push(rest.charAt(0).toUpperCase() + rest.slice(1));
    }
  } else if (city) {
    lines.push(`Training centres are available in ${city}.`);
  }
  lines.push('');
  lines.push('_Tell me your locality and I can help narrow to the nearest branch._');
  return lines.join('\n').trim();
}

export function formatPassage(hit: PassageHit): string {
  const t = hit.type;
  if (t === 'fees') return formatFees(hit.text);
  if (t === 'curriculum') return formatCurriculum(hit.text);
  if (t === 'course' || t === 'overview') return formatCourse(hit.text);
  if (t === 'eligibility') return formatEligibility(hit.text);
  if (t === 'centre') return formatCentre(hit.text);
  return formatGeneric(hit.text, t);
}

/** Compose 1–3 hits into a single structured answer string. */
export function formatPassagesAnswer(hits: PassageHit[], max = 2): string {
  const parts: string[] = [];
  const seen = new Set<string>();
  for (const hit of hits.slice(0, max + 1)) {
    const formatted = formatPassage(hit).trim();
    if (!formatted) continue;
    const key = formatted.slice(0, 80).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(formatted);
    if (parts.length >= max) break;
  }
  return parts.join('\n\n') || '';
}
