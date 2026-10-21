import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isCrmMatched, needsCrmPush, CRM_UNMATCHED_STATUSES } from '@/lib/leads/crm-status';
import {
  emptyReconcileCounts,
  filterUnmatchedLeads,
  tallyHandoff,
  leadToCrmHandoffInput,
} from '@/lib/leads/crm-reconcile';
import type { Lead } from '@/lib/db/schema';

vi.mock('@/lib/leads/crm-handoff', () => ({
  handoffLeadToCrm: vi.fn(),
}));

function lead(over: Partial<Lead> & Pick<Lead, 'id' | 'name' | 'crmStatus'>): Lead {
  return {
    phone: '9876543210',
    email: 'a@b.com',
    courseInterest: null,
    courseSlug: null,
    city: 'Mumbai',
    state: null,
    centreSlug: 'dadar',
    centreName: null,
    source: 'form',
    form: null,
    persona: null,
    intent: null,
    qualification: null,
    message: null,
    notes: null,
    status: 'new',
    assignedTo: null,
    followUpAt: null,
    visitorId: null,
    accountId: null,
    journeyStage: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    landingPage: null,
    crmDetail: null,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-01T00:00:00Z'),
    ...over,
  } as Lead;
}

describe('crm-status helpers', () => {
  it('treats only routed as matched; duplicate stays retryable for a separate CRM entry', () => {
    expect(isCrmMatched('routed')).toBe(true);
    expect(needsCrmPush('routed')).toBe(false);
    expect(isCrmMatched('duplicate')).toBe(false);
    expect(needsCrmPush('duplicate')).toBe(true);
  });

  it('treats none/failed/rejected/skipped/duplicate as needing a push', () => {
    for (const s of CRM_UNMATCHED_STATUSES) {
      expect(needsCrmPush(s)).toBe(true);
      expect(isCrmMatched(s)).toBe(false);
    }
  });
});

describe('crm-reconcile helpers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('filters unmatched leads only', () => {
    const rows = [
      lead({ id: '1', name: 'A', crmStatus: 'failed' }),
      lead({ id: '2', name: 'B', crmStatus: 'routed' }),
      lead({ id: '3', name: 'C', crmStatus: 'duplicate' }),
      lead({ id: '4', name: 'D', crmStatus: 'none' }),
    ];
    expect(filterUnmatchedLeads(rows).map((l) => l.id)).toEqual(['1', '3', '4']);
  });

  it('tallies handoff outcomes', () => {
    const c = emptyReconcileCounts();
    tallyHandoff(c, { routed: true, status: 'routed' });
    tallyHandoff(c, { routed: false, status: 'duplicate' });
    tallyHandoff(c, { routed: false, status: 'failed' });
    expect(c).toEqual({ attempted: 3, pushed: 1, blockedSameMobile: 1, stillUnmatched: 1 });
  });

  it('maps a lead row into a CRM hand-off payload', () => {
    const input = leadToCrmHandoffInput(lead({ id: 'abc', name: 'Asha Rao', crmStatus: 'failed', centreSlug: 'dadar' }));
    expect(input).toMatchObject({
      leadId: 'abc',
      name: 'Asha Rao',
      phone: '9876543210',
      email: 'a@b.com',
      centreSlug: 'dadar',
      city: 'Mumbai',
    });
    expect(input.raw).toMatchObject({ reconcile: true, source: 'form' });
  });
});
