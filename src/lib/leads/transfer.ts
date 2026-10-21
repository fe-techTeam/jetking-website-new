/**
 * Moving leads in and out of the admin: the column catalogue for exports, a spreadsheet-safe CSV writer and a
 * forgiving CSV reader for imports. Pure functions (no React, no server code) so both screens and tests can use them.
 */

export interface ExportableLead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  courseInterest: string | null;
  courseSlug: string | null;
  city: string | null;
  state: string | null;
  centreName: string | null;
  qualification: string | null;
  source: string;
  form: string | null;
  status: string;
  assignedTo: string | null;
  followUpAt: Date | string | null;
  message: string | null;
  notes: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  landingPage: string | null;
  crmStatus: string;
  crmDetail?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const SOURCE_LABEL: Record<string, string> = { form: 'Website form', chatbot: 'Chatbot', centre: 'Centre', franchise: 'Franchise' };

/** Short status for the CRM sync column / exports. */
export function crmStatusLabel(status: string): string {
  switch (status) {
    case 'routed':
      return 'Synced';
    case 'duplicate':
      return 'Not synced';
    case 'rejected':
      return 'Not synced';
    case 'failed':
      return 'Not synced';
    case 'skipped':
      return 'Not synced';
    default:
      return 'Not synced';
  }
}

/** Fallback reason when `crm_detail` was never stored (older rows). */
export function crmStatusFallbackReason(status: string): string | null {
  switch (status) {
    case 'routed':
      return null;
    case 'duplicate':
      return 'Mobile already exists in CRM (unique:users) — changing centre does not create a second user';
    case 'rejected':
      return 'CRM rejected the enquiry (validation error)';
    case 'failed':
      return 'CRM request failed (network, timeout, or bad response)';
    case 'skipped':
      return 'Not sent — missing email or CRM centre mapping';
    case 'none':
      return 'Not pushed yet — CRM not configured or hand-off not attempted';
    default:
      return 'Not synced to CRM';
  }
}

/** Synced badge + why (for table cells and detail). */
export function crmSyncDisplay(status: string, detail?: string | null): { synced: boolean; label: string; reason: string | null } {
  const synced = status === 'routed';
  const reason = synced ? null : (detail?.trim() || crmStatusFallbackReason(status));
  return { synced, label: synced ? 'Synced' : 'Not synced', reason };
}

export const STATUS_LABEL: Record<string, string> = { new: 'New', contacted: 'Contacted', enrolled: 'Enrolled', lost: 'Lost' };

export interface ExportColumn {
  key: string;
  label: string;
  /** Pre-selected in the export dialog. */
  default: boolean;
  get: (l: ExportableLead) => string | Date | null;
}

const date = (d: Date | string | null) => (d ? new Date(d) : null);

export const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'createdAt', label: 'Received', default: true, get: (l) => date(l.createdAt) },
  { key: 'name', label: 'Name', default: true, get: (l) => l.name },
  { key: 'phone', label: 'Phone', default: true, get: (l) => l.phone },
  { key: 'email', label: 'Email', default: true, get: (l) => l.email },
  { key: 'course', label: 'Course interest', default: true, get: (l) => l.courseInterest },
  { key: 'city', label: 'City', default: true, get: (l) => l.city },
  { key: 'state', label: 'State', default: false, get: (l) => l.state },
  { key: 'centre', label: 'Centre', default: true, get: (l) => l.centreName },
  { key: 'qualification', label: 'Qualification', default: false, get: (l) => (l.qualification === 'graduate' ? 'Graduate or above' : l.qualification) },
  { key: 'source', label: 'Source', default: true, get: (l) => SOURCE_LABEL[l.source] ?? l.source },
  { key: 'form', label: 'Form / page', default: false, get: (l) => l.form },
  { key: 'status', label: 'Status', default: true, get: (l) => STATUS_LABEL[l.status] ?? l.status },
  { key: 'assignedTo', label: 'Owner', default: true, get: (l) => l.assignedTo },
  { key: 'followUpAt', label: 'Follow-up', default: false, get: (l) => date(l.followUpAt) },
  { key: 'message', label: 'Visitor message', default: false, get: (l) => l.message },
  { key: 'notes', label: 'Notes', default: false, get: (l) => l.notes },
  { key: 'utmSource', label: 'Campaign source', default: false, get: (l) => l.utmSource },
  { key: 'utmMedium', label: 'Campaign medium', default: false, get: (l) => l.utmMedium },
  { key: 'utmCampaign', label: 'Campaign name', default: false, get: (l) => l.utmCampaign },
  { key: 'landingPage', label: 'Landing page', default: false, get: (l) => l.landingPage },
  { key: 'crm', label: 'CRM sync', default: true, get: (l) => crmSyncDisplay(l.crmStatus, l.crmDetail).label },
  {
    key: 'crmDetail',
    label: 'CRM sync reason',
    default: true,
    get: (l) => crmSyncDisplay(l.crmStatus, l.crmDetail).reason,
  },
  { key: 'updatedAt', label: 'Last updated', default: false, get: (l) => date(l.updatedAt) },
  { key: 'id', label: 'Lead ID', default: false, get: (l) => l.id },
];

/** A spreadsheet runs text that starts with = + - @ as a formula; a leading apostrophe keeps it text. */
export function spreadsheetSafe(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

const text = (v: string | Date | null): string => (v === null ? '' : v instanceof Date ? v.toISOString() : v);

export function toCsv(leads: ExportableLead[], columns: ExportColumn[]): string {
  const cell = (v: string) => `"${spreadsheetSafe(v).replace(/"/g, '""')}"`;
  const head = columns.map((c) => cell(c.label)).join(',');
  const rows = leads.map((l) => columns.map((c) => cell(text(c.get(l)))).join(','));
  // BOM so Excel opens non-English names correctly.
  return `﻿${[head, ...rows].join('\r\n')}`;
}

export function toJson(leads: ExportableLead[], columns: ExportColumn[]): string {
  return JSON.stringify(
    leads.map((l) => Object.fromEntries(columns.map((c) => [c.label, text(c.get(l)) || null]))),
    null,
    2,
  );
}

/** Rows for `write-excel-file`: bold header, real dates, text for everything else. */
export function toSheet(leads: ExportableLead[], columns: ExportColumn[]) {
  const header = columns.map((c) => ({ value: c.label, fontWeight: 'bold' as const }));
  const rows = leads.map((l) =>
    columns.map((c) => {
      const v = c.get(l);
      if (v instanceof Date) return { value: v, format: 'dd-mmm-yyyy hh:mm' };
      return v === null || v === '' ? null : { value: v };
    }),
  );
  return [header, ...rows];
}

/* ── CSV import ───────────────────────────────────────────────────────── */

/** Parses CSV text with quoted fields, escaped quotes and embedded line breaks. Comma, semicolon or tab separated. */
export function parseCsv(input: string): string[][] {
  const src = input.replace(/^﻿/, '');
  const first = src.split(/\r?\n/, 1)[0] ?? '';
  const sep = [',', ';', '\t'].map((s) => [s, first.split(s).length] as const).sort((a, b) => b[1] - a[1])[0]![0];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

export const IMPORT_FIELDS = [
  { key: 'name', label: 'Name', match: /^(full ?name|name|student|lead|candidate)/i },
  { key: 'phone', label: 'Phone', match: /(phone|mobile|contact|whatsapp|number)/i },
  { key: 'email', label: 'Email', match: /(e-?mail)/i },
  { key: 'courseInterest', label: 'Course', match: /(course|programme|program|interest)/i },
  { key: 'city', label: 'City', match: /^(city|location|town)/i },
  { key: 'source', label: 'Source', match: /^source/i },
  { key: 'notes', label: 'Notes', match: /(note|remark|comment|message)/i },
] as const;
export type ImportKey = (typeof IMPORT_FIELDS)[number]['key'];

/** Guesses which CSV column feeds each lead field from the header row. */
export function guessMapping(headers: string[]): Record<ImportKey, number> {
  const out = {} as Record<ImportKey, number>;
  const used = new Set<number>();
  for (const f of IMPORT_FIELDS) {
    const idx = headers.findIndex((h, i) => !used.has(i) && f.match.test(h.trim()));
    out[f.key] = idx;
    if (idx >= 0) used.add(idx);
  }
  return out;
}
