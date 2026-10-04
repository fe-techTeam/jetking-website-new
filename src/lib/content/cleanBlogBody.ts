import type { BodyBlock } from '@/lib/content/types';

/** Legacy migration pulled site chrome into post bodies — drop those blocks. */
const JUNK_PATTERNS: RegExp[] = [
  /\bAmore Building\b/i,
  /\binfo@jetking\.com\b/i,
  /\bAll rights reserved\b/i,
  /\bCopyrights reserved\b/i,
  /\bAbout Us\b.*\bInvestors\b/i,
  /\bEnrollment Terms\b/i,
  /\bInstitutional Alliance\b/i,
  /\bIndia Franchise\b.*\bInternational Franchise\b/i,
  /\bContact Us\b.*\bPrivacy Policy\b/i,
  /\bStudent FAQs\b.*\bTerms & Conditions\b/i,
  /\bCloud Computing Courses\s*\|/i,
  /\bMaharashtra\s*:\s*Dadar\b/i,
  /\bM\s*aharashtra\s*:/i,
  /\bLaxmi Nagar\b.*\bAzadpur\b/i,
  /\bJetking Certified Cloud Computing Engineer\b.*\bBCA In Cloud\b/i,
  /\bRed Hat Professional Routing\b.*\bAWS Solution Specialist\b/i,
  /\bDigital Marketing Training Solutions\b.*\bNetworking Essentials\b/i,
  /^\s*Certification Courses\s*$/i,
  /^\s*\d{1,2}(st|nd|rd|th)?\s+Floor\b/i,
  /^\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+\w+\s+\d{1,2},?\s+\d{4}\s*$/i,
];

/** Major section starts inside migrated dump paragraphs. */
const SECTION_LOOKAHEAD =
  /(?=(?:Introduction|Conclusion|Summary|Key takeaways|What is\b|Why\b|How to\b|The Process\b|Benefits of\b|Essential Tips\b|Steps to\b)[:?\s])/i;

function blockText(block: BodyBlock): string {
  if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'quote') {
    return block.text;
  }
  if (block.type === 'list') return block.items.join(' ');
  return '';
}

function isJunkBlock(block: BodyBlock): boolean {
  const text = blockText(block).trim();
  if (!text) return true;
  if (text.length < 12 && block.type !== 'heading') return true;
  return JUNK_PATTERNS.some((re) => re.test(text));
}

function normalizeSpace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Break a long run into ~2–3 sentence paragraphs. */
function chunkSentences(text: string, maxChars = 380): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z“"])/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return text ? [text] : [];

  const chunks: string[] = [];
  let buf = '';
  for (const sentence of sentences) {
    const next = buf ? `${buf} ${sentence}` : sentence;
    if (buf && next.length > maxChars) {
      chunks.push(buf);
      buf = sentence;
    } else {
      buf = next;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}

function splitItemTitle(item: string): { title: string; body: string } {
  const cleaned = item.replace(/^\d+[.)]\s*/, '').trim();

  // "Avoid Data Breach Incidents Data breaches..." / "Hire Skilled Ethical Hackers Bringing..."
  const titleCase = cleaned.match(
    /^((?:[A-Z][\w']+\s+){1,4}[A-Z][\w']+)\s+([A-Z][a-z][\s\S]{20,})$/,
  );
  if (titleCase) return { title: titleCase[1]!, body: titleCase[2]! };

  // "Identify your weaknesses All businesses..." / "Stick to Rules There are..."
  const softTitle = cleaned.match(
    /^([A-Z][\w']*(?:\s+[a-z][\w']+){1,4}(?:\s+[A-Z][\w']+)?)\s+([A-Z][a-z][\s\S]{20,})$/,
  );
  if (softTitle) return { title: softTitle[1]!, body: softTitle[2]! };

  // "Examining Ethical hackers employ..." / "Getting access Ethical hackers..."
  const gerund = cleaned.match(/^([A-Z][a-z]+ing(?:\s+[A-Za-z][\w']+){0,2})\s+([\s\S]{20,})$/);
  if (gerund && gerund[1]!.length <= 40) {
    return { title: gerund[1]!, body: gerund[2]! };
  }

  // "Documentation Upon finishing their assessments..."
  const noun = cleaned.match(/^([A-Z][a-z]{5,20})\s+([A-Z][a-z][\s\S]{20,})$/);
  if (noun) return { title: noun[1]!, body: noun[2]! };

  const firstSentence = cleaned.match(/^([^.!?]{8,72})[.!?](?:\s+|$)([\s\S]*)$/);
  if (firstSentence && firstSentence[1]!.split(/\s+/).length <= 10) {
    return { title: firstSentence[1]!.trim(), body: (firstSentence[2] || '').trim() };
  }

  const words = cleaned.split(/\s+/);
  if (words.length > 8) {
    return { title: words.slice(0, 4).join(' '), body: words.slice(4).join(' ') };
  }
  return { title: cleaned, body: '' };
}

/**
 * Pull numbered steps out of dump text:
 * "1.Identify weaknesses All businesses... 2. Avoid Data..."
 */
function extractNumberedList(text: string): { lead: string; items: string[] } | null {
  // Normalize "1.Word" → "1. Word" so markers are consistent.
  const normalized = text.replace(/\b(\d{1,2})\.(?=[A-Z])/g, '$1. ');
  const matches = [
    ...normalized.matchAll(/\b(\d{1,2})[.)]\s*([A-Z][\s\S]*?)(?=(?:\s+\d{1,2}[.)]\s*[A-Z])|$)/g),
  ];
  if (matches.length < 2) return null;

  const firstIndex = matches[0]?.index ?? 0;
  const lead = normalized.slice(0, firstIndex).trim();
  const items = matches
    .map((m) => normalizeSpace(m[2] ?? ''))
    .filter((item) => item.length > 8);
  if (items.length < 2) return null;
  return { lead, items };
}

function parseSection(raw: string): BodyBlock[] {
  const text = normalizeSpace(raw);
  if (!text) return [];

  const labeled = text.match(
    /^(Introduction|Conclusion|Summary|Key takeaways)\s*:\s*([\s\S]+)$/i,
  );
  if (labeled) {
    const title = labeled[1]!.replace(/\b\w/g, (c) => c.toUpperCase());
    return [
      { type: 'heading', level: 2, text: title },
      ...bodyFromProse(labeled[2]!),
    ];
  }

  const question = text.match(
    /^(What is [^?]{6,90}\?|Why [^?]{6,90}\?|How to [^?]{6,90}\?)\s*([\s\S]*)$/i,
  );
  if (question) {
    return [
      { type: 'heading', level: 2, text: question[1]!.replace(/\?$/, '').trim() },
      ...bodyFromProse(question[2] || ''),
    ];
  }

  const howTo = text.match(
    /^(How to [\w\s'-]{12,70}?)\s+([A-Z][a-z]+\s+[A-Z][\s\S]+)$/,
  );
  if (howTo) {
    return [
      { type: 'heading', level: 2, text: howTo[1]!.trim() },
      ...bodyFromProse(howTo[2]!),
    ];
  }

  const process = text.match(/^(The Process for [^0-9]{6,80}?)\s+(?=\d+\.)([\s\S]+)$/i);
  if (process) {
    return [
      { type: 'heading', level: 2, text: process[1]!.trim() },
      ...bodyFromProse(process[2]!),
    ];
  }

  const titled = text.match(
    /^((?:Benefits of|Essential Tips|Steps to|Understanding|Getting started)[^.]{4,70})\s+([\s\S]+)$/i,
  );
  if (titled && titled[1]!.length < 80) {
    return [
      { type: 'heading', level: 2, text: titled[1]!.trim() },
      ...bodyFromProse(titled[2]!),
    ];
  }

  return bodyFromProse(text);
}

function bodyFromProse(raw: string): BodyBlock[] {
  const text = normalizeSpace(raw);
  if (!text) return [];

  const numbered = extractNumberedList(text);
  if (numbered) {
    const out: BodyBlock[] = [];
    if (numbered.lead) {
      for (const para of chunkSentences(numbered.lead)) {
        out.push({ type: 'paragraph', text: para });
      }
    }

    const avg = numbered.items.reduce((s, i) => s + i.length, 0) / numbered.items.length;
    if (avg <= 160) {
      out.push({
        type: 'list',
        ordered: true,
        items: numbered.items.map((item) => splitItemTitle(item).title),
      });
      return out;
    }

    for (const item of numbered.items) {
      const { title, body } = splitItemTitle(item);
      out.push({ type: 'heading', level: 3, text: title });
      if (body) {
        for (const para of chunkSentences(body)) {
          out.push({ type: 'paragraph', text: para });
        }
      }
    }
    return out;
  }

  // Bullet dumps
  const bullets = text
    .split(/\s*[•●▪]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bullets.length >= 3) {
    const itemParts = bullets.slice(1);
    const avg = itemParts.reduce((s, p) => s + p.length, 0) / itemParts.length;
    if (avg <= 180 && !itemParts.some((p) => p.length > 280)) {
      const out: BodyBlock[] = [];
      if (bullets[0]!.length > 50) {
        for (const para of chunkSentences(bullets[0]!)) {
          out.push({ type: 'paragraph', text: para });
        }
        out.push({ type: 'list', ordered: false, items: itemParts });
      } else {
        out.push({ type: 'list', ordered: false, items: bullets });
      }
      return out;
    }
  }

  return chunkSentences(text).map((para) => ({ type: 'paragraph' as const, text: para }));
}

/** Turn a single migrated dump paragraph into structured blocks. */
function beautifyDumpParagraph(text: string): BodyBlock[] {
  const normalized = normalizeSpace(text);
  if (normalized.length < 500) return bodyFromProse(normalized);

  const parts = normalized
    .split(SECTION_LOOKAHEAD)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) return bodyFromProse(normalized);

  const blocks: BodyBlock[] = [];
  for (const part of parts) {
    blocks.push(...parseSection(part));
  }
  return blocks.length ? blocks : bodyFromProse(normalized);
}

function expandBlock(block: BodyBlock): BodyBlock[] {
  if (block.type !== 'paragraph') return [block];
  if (block.text.length < 500) return bodyFromProse(block.text);
  return beautifyDumpParagraph(block.text);
}

/**
 * Sanitize + structure migrated BodyBlock[] for article rendering:
 * strip legacy footer chrome and turn dump paragraphs into headings / lists / paras.
 */
const NAMED_ENTITIES: Record<string, string> = {
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  apos: "'",
  nbsp: ' ',
  rsquo: '\u2019',
  lsquo: '\u2018',
  rdquo: '\u201d',
  ldquo: '\u201c',
  ndash: '\u2013',
  mdash: '\u2014',
};

/** Migrated text is sometimes double-encoded ("&amp;#34;"), which would print as literal "&#34;". */
export function decodeEntities(text: string): string {
  let out = text;
  for (let pass = 0; pass < 2; pass += 1) {
    const next = out
      .replace(/&#(\d+);/g, (m, n: string) => {
        const code = Number(n);
        return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : m;
      })
      .replace(/&#x([0-9a-f]+);/gi, (m, h: string) => {
        const code = parseInt(h, 16);
        return code > 0 && code < 0x10ffff ? String.fromCodePoint(code) : m;
      })
      .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
    if (next === out) break;
    out = next;
  }
  return out;
}

function decodeBlock(block: BodyBlock): BodyBlock {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return { ...block, text: decodeEntities(block.text) };
    case 'quote':
      return {
        ...block,
        text: decodeEntities(block.text),
        ...(block.attribution ? { attribution: decodeEntities(block.attribution) } : {}),
      };
    case 'list':
      return { ...block, items: block.items.map(decodeEntities) };
    default:
      return block;
  }
}

export function cleanBlogBody(body: BodyBlock[]): BodyBlock[] {
  const cleaned: BodyBlock[] = [];
  for (const block of body) {
    if (isJunkBlock(block)) continue;
    for (const next of expandBlock(block)) {
      if (isJunkBlock(next)) continue;
      cleaned.push(decodeBlock(next));
    }
  }
  return cleaned;
}
