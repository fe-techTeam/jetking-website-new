import { describe, expect, it } from 'vitest';
import { fieldKind, slugify } from '../src/app/(admin)/admin/FieldInputs';

describe('admin field editors', () => {
  it('picks the right editor from a field name and its place in the record', () => {
    expect(fieldKind('startsAt', 'startsAt', '')).toBe('datetime');
    expect(fieldKind('updatedAt', 'updatedAt', '2026-08-07')).toBe('date');
    expect(fieldKind('email', 'company.email', '')).toBe('email');
    expect(fieldKind('helpline', 'helpline', '')).toBe('phone');
    expect(fieldKind('linkHref', 'linkHref', '')).toBe('url');
    expect(fieldKind('pincode', 'pincode', '')).toBe('pincode');
    expect(fieldKind('student', 'personaRelevance.student', 1)).toBe('score');
    expect(fieldKind('lat', 'geo.lat', 0)).toBe('geo');
    expect(fieldKind('citySlug', 'citySlug', '')).toBe('city-select');
    expect(fieldKind('coursesOffered', 'coursesOffered', [])).toBe('course-multi');
    expect(fieldKind('title', 'seo.title', '')).toBe('seo-title');
    expect(fieldKind('description', 'seo.description', '')).toBe('seo-description');
  });

  it('leaves ordinary text fields alone', () => {
    expect(fieldKind('title', 'title', '')).toBe('text');
    expect(fieldKind('question', 'faqs[].question', '')).toBe('text');
  });

  it('makes URL-safe slugs', () => {
    expect(slugify('BCA in Cloud Computing & Cyber Security!')).toBe('bca-in-cloud-computing-and-cyber-security');
    expect(slugify('  Café — Résumé  ')).toBe('cafe-resume');
  });
});
