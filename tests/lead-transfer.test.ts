import { describe, expect, it } from 'vitest';
import { EXPORT_COLUMNS, guessMapping, parseCsv, spreadsheetSafe, toCsv, toJson, type ExportableLead } from '@/lib/leads/transfer';

const lead = (over: Partial<ExportableLead> = {}): ExportableLead => ({
  id: 'x', name: 'Asha Rao', phone: '+919800000001', email: null, courseInterest: 'BCA', courseSlug: null, city: 'Pune', state: null,
  centreName: null, qualification: '10+2', source: 'form', form: 'home', status: 'new', assignedTo: 'Admin', followUpAt: null,
  message: null, notes: null, utmSource: null, utmMedium: null, utmCampaign: null, utmContent: null, landingPage: null,
  crmStatus: 'none', createdAt: new Date('2026-10-17T10:00:00Z'), updatedAt: new Date('2026-10-17T10:00:00Z'), ...over,
});

describe('lead export', () => {
  const cols = EXPORT_COLUMNS.filter((c) => ['name', 'phone', 'status'].includes(c.key));
  it('writes a header, escapes quotes and keeps spreadsheet formulas inert', () => {
    const csv = toCsv([lead({ name: '=HYPERLINK("x")' }), lead({ name: 'Say "hi", ok' })], cols);
    expect(csv.startsWith('﻿"Name","Phone","Status"')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).toContain('"Say ""hi"", ok"');
    expect(spreadsheetSafe('plain')).toBe('plain');
  });
  it('labels statuses and exports JSON by column label', () => {
    expect(JSON.parse(toJson([lead()], cols))[0]).toEqual({ Name: 'Asha Rao', Phone: '+919800000001', Status: 'New' });
  });
});

describe('lead import', () => {
  it('reads quoted fields, escaped quotes, multi-line cells and any common separator', () => {
    const csv = 'Name;Mobile;Notes\r\n"Rao, Asha";98000;"line1\nline2"\r\nVik;97000;"say ""hi"""';
    expect(parseCsv(csv)).toEqual([
      ['Name', 'Mobile', 'Notes'],
      ['Rao, Asha', '98000', 'line1\nline2'],
      ['Vik', '97000', 'say "hi"'],
    ]);
  });
  it('maps columns from their headers', () => {
    const m = guessMapping(['Full Name', 'Mobile No', 'E-mail', 'Course Interested', 'City', 'Remarks']);
    expect(m).toMatchObject({ name: 0, phone: 1, email: 2, courseInterest: 3, city: 4, notes: 5, source: -1 });
  });
});
