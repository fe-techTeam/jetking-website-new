import { describe, expect, it } from 'vitest';
import { EXPORT_COLUMNS, guessMapping, parseCsv, spreadsheetSafe, toCsv, toJson, toSheet, type ExportableLead } from '@/lib/leads/transfer';

const lead = (over: Partial<ExportableLead> = {}): ExportableLead => ({
  id: 'i', name: 'Asha', phone: '9800000001', email: null, courseInterest: null, courseSlug: null, city: 'Pune', state: null,
  centreName: null, qualification: null, source: 'form', form: null, status: 'new', assignedTo: null, followUpAt: null,
  message: null, notes: null, utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, landingPage: null,
  crmStatus: 'none', createdAt: new Date('2026-01-02T03:04:05Z'), updatedAt: new Date('2026-01-02T03:04:05Z'), ...over,
});
const cols = EXPORT_COLUMNS.filter((c) => c.default);

describe('spreadsheet formula injection', () => {
  it.each(['=1+1', '+cmd|x', '-2+3', '@SUM(A1)', '\t=x', '\r=x'])('neutralises %j', (v) => {
    expect(spreadsheetSafe(v).startsWith("'")).toBe(true);
  });
  it('leaves ordinary text alone', () => {
    expect(spreadsheetSafe('Asha Rao')).toBe('Asha Rao');
    expect(spreadsheetSafe('')).toBe('');
  });
  it('escapes in CSV cells, doubles quotes, uses CRLF and BOM', () => {
    const csv = toCsv([lead({ name: '=HYPERLINK("http://evil","x")' })], cols);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""http://evil"",""x"")"`);
    expect(csv.split('\r\n')).toHaveLength(2);
  });
  it('escapes in every free-text column, including notes/message', () => {
    const evil = '=cmd()';
    const csv = toCsv([lead({ message: evil, notes: evil, assignedTo: evil, landingPage: evil, utmCampaign: evil })], EXPORT_COLUMNS);
    expect(csv).not.toMatch(/(^|,)"=cmd/);
  });
  it('keeps embedded newlines inside a quoted cell', () => {
    expect(toCsv([lead({ name: 'a\nb' })], cols)).toContain('"a\nb"');
  });
  it('JSON export nulls empty values', () => {
    const j = JSON.parse(toJson([lead()], cols));
    expect(j[0].Email).toBeNull();
    expect(j[0].Name).toBe('Asha');
  });
  it('sheet export uses real Date cells and nulls for empty', () => {
    const rows = toSheet([lead()], cols);
    expect(rows).toHaveLength(2);
    expect(rows[1]!.some((c) => c && c.value instanceof Date)).toBe(true);
    expect(rows[1]!.some((c) => c === null)).toBe(true);
  });
});

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, embedded newlines and BOM', () => {
    expect(parseCsv('﻿Name,Note\r\n"A, B","say ""hi""\nthere"\r\n')).toEqual([['Name', 'Note'], ['A, B', 'say "hi"\nthere']]);
  });
  it('detects semicolon and tab separators', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('skips blank lines and tolerates an unterminated quote', () => {
    expect(parseCsv('a,b\n\n1,2')).toEqual([['a', 'b'], ['1', '2']]);
    expect(() => parseCsv('a,b\n"1,2')).not.toThrow();
  });
  it('parses a large file in linear time', () => {
    const big = 'name,phone\n' + Array.from({ length: 50000 }, (_, i) => `n${i},${i}`).join('\n');
    const t = Date.now();
    expect(parseCsv(big)).toHaveLength(50001);
    expect(Date.now() - t).toBeLessThan(2000);
  });
});

describe('guessMapping', () => {
  it('matches headers once each', () => {
    const m = guessMapping(['Full Name', 'Mobile No', 'E-mail', 'Course', 'City', 'Remarks']);
    expect(m).toMatchObject({ name: 0, phone: 1, email: 2, courseInterest: 3, city: 4, notes: 5 });
  });
  it('returns -1 for absent columns', () => {
    expect(guessMapping(['foo']).name).toBe(-1);
  });
});
