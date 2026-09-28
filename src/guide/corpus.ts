import { content } from '@/lib/content';
import { centrePath } from '@/lib/centre-path';
import type { BodyBlock } from '@/lib/content/types';
import type { Chunk } from './types';

/**
 * Builds the grounding corpus from the content source.
 *
 * Fees are deliberately excluded from chunk text — risk R4.
 */

let cache: { chunks: Chunk[]; builtAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function blocksToText(blocks: BodyBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
        case 'heading':
        case 'quote':
          return block.text;
        case 'list':
          return block.items.join('. ');
        case 'image':
          return '';
      }
    })
    .filter(Boolean)
    .join(' ');
}

export async function buildCorpus(): Promise<Chunk[]> {
  if (cache && Date.now() - cache.builtAt < CACHE_TTL_MS) return cache.chunks;

  const [courses, faqs, posts, centres, cities, policies, facultyMembers, placements] =
    await Promise.all([
      content.listCourses(),
      content.listFaqs(),
      content.listPosts(),
      content.listCentres(),
      content.listCities(),
      content.listPolicies(),
      content.listFaculty(),
      content.listPlacements(),
    ]);

  const chunks: Chunk[] = [];

  for (const course of courses) {
    chunks.push({
      id: `course:${course.slug}`,
      type: 'course',
      title: course.title,
      url: `/courses/${course.slug}`,
      sourceSlug: course.slug,
      text: [
        `Course: ${course.title}.`,
        `Level: ${course.level}. Duration: ${course.duration}.`,
        `Eligibility: ${course.eligibility}`,
        course.summary,
        `What you can do after it: ${course.outcomes.join('; ')}.`,
        `Modules covered: ${course.modules.join('; ')}.`,
        course.certifications.length
          ? `Industry certifications: ${course.certifications.join(', ')}.`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
    });
  }

  for (const faq of faqs) {
    chunks.push({
      id: `faq:${faq.id}`,
      type: 'faq',
      title: faq.question,
      url: '/faq',
      text: `Question: ${faq.question} Answer: ${faq.answer}`,
    });
  }

  for (const post of posts) {
    let currentHeading = post.title;
    let buffer: string[] = [post.excerpt];
    let sectionIndex = 0;
    const kind = post.kind === 'news' ? 'news' : 'post';

    const flush = () => {
      const text = buffer.join(' ').trim();
      if (text.length > 80) {
        chunks.push({
          id: `${kind}:${post.slug}:${sectionIndex}`,
          type: kind,
          title: `${post.title} — ${currentHeading}`,
          url: `/blog/${post.slug}`,
          sourceSlug: post.slug,
          text,
        });
        sectionIndex += 1;
      }
      buffer = [];
    };

    for (const block of post.body) {
      switch (block.type) {
        case 'heading':
          flush();
          currentHeading = block.text;
          break;
        case 'paragraph':
          buffer.push(block.text);
          break;
        case 'list':
          buffer.push(block.items.join('. '));
          break;
        case 'quote':
          buffer.push(block.text);
          break;
        case 'image':
          break;
      }
    }
    flush();
  }

  const cityNames = new Map(cities.map((c) => [c.slug, c.name]));

  // A few place names coincide with their own city/state (Balasore, Orai,
  // Delhi) — join only the distinct ones so the corpus text never reads
  // "Balasore, Balasore, Odisha" or "...in Delhi, Delhi."
  const joinPlace = (...parts: string[]) => {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const part of parts) {
      const key = part.trim().toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(part);
    }
    return unique.join(', ');
  };

  for (const centre of centres) {
    const cityName = cityNames.get(centre.citySlug) ?? centre.citySlug;
    chunks.push({
      id: `centre:${centre.citySlug}:${centre.slug}`,
      type: 'centre',
      title: centre.name,
      url: centrePath(centre.slug),
      sourceSlug: centre.slug,
      text: `${centre.name} is a Jetking centre in ${joinPlace(centre.locality, cityName, centre.state)}. It offers these courses: ${centre.coursesOffered.join(', ')}.`,
    });
  }

  for (const city of cities) {
    chunks.push({
      id: `city:${city.slug}`,
      type: 'city',
      title: `Jetking centres in ${city.name}`,
      url: `/centres?q=${encodeURIComponent(city.name)}`,
      sourceSlug: city.slug,
      text: `${city.intro} Jetking has centres in ${joinPlace(city.name, city.state)}.`,
    });
  }

  for (const policy of policies) {
    chunks.push({
      id: `policy:${policy.slug}`,
      type: 'policy',
      title: policy.title,
      url: `/faq`,
      sourceSlug: policy.slug,
      text: `${policy.title}. ${policy.summary} ${blocksToText(policy.body)}`,
    });
  }

  for (const member of facultyMembers) {
    chunks.push({
      id: `faculty:${member.slug}`,
      type: 'faculty',
      title: member.name,
      url: `/`,
      sourceSlug: member.slug,
      text: `${member.name}, ${member.title}. ${member.bio} Specialisations: ${member.specialisations.join(', ')}.`,
    });
  }

  for (const placement of placements) {
    const verifiedStats = placement.stats
      .filter((s) => s.verified && s.source)
      .map((s) => `${s.label}: ${s.value}`)
      .join('; ');
    chunks.push({
      id: `placement:${placement.id}`,
      type: 'placement',
      title: placement.title,
      url: '/placements',
      sourceSlug: placement.id,
      text: `${placement.title}. ${placement.summary} ${blocksToText(placement.body)}${
        verifiedStats ? ` ${verifiedStats}` : ''
      }`,
    });
  }

  cache = { chunks, builtAt: Date.now() };
  return chunks;
}

/** Called by the CMS webhook once content changes. */
export function invalidateCorpus(): void {
  cache = null;
}
