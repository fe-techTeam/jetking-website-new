import { beforeEach, describe, expect, it, vi } from 'vitest';

type L = { id: string; name: string; city: string | null; centreSlug: string | null; status: string; crmStatus: string; phone?: string | null; email?: string | null };
const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const LEADS: L[] = [
  { id: ID(1), name: 'Pune A', city: 'Pune', centreSlug: 'pune-shivajinagar', status: 'new', crmStatus: 'failed', phone: '9800000001', email: 'a@pune.test' },
  { id: ID(2), name: 'Mumbai B', city: 'Mumbai', centreSlug: 'mumbai-andheri', status: 'new', crmStatus: 'none', phone: '9800000002', email: 'b@mum.test' },
  { id: ID(3), name: 'Pune other centre', city: ' pune ', centreSlug: null, status: 'contacted', crmStatus: 'routed', phone: '9800000003', email: 'c@pune.test' },
  { id: ID(4), name: 'Chennai via centre', city: 'Chennai', centreSlug: 'pune-shivajinagar', status: 'lost', crmStatus: 'skipped', phone: '9800000004', email: null },
];

let currentUser: { name: string; role: string; centreSlug: string | null };
const store = vi.hoisted(() => ({
  listLeads: vi.fn(),
  getLead: vi.fn(),
  deleteLead: vi.fn(),
  deleteLeads: vi.fn(),
  updateLeadStatus: vi.fn(),
  addLeadNote: vi.fn(),
  assignLead: vi.fn(),
  setLeadFollowUp: vi.fn(),
  logLeadCall: vi.fn(),
  listLeadActivities: vi.fn(),
  createLead: vi.fn(),
  importLeadRows: vi.fn(),
  getLeadStats: vi.fn(),
  listLeadsByCrmStatus: vi.fn(),
}));
const crm = vi.hoisted(() => ({
  pushLeadRowToCrm: vi.fn(),
  handoffLeadToCrm: vi.fn(),
  sleep: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/app/(admin)/admin/actions', () => ({
  requireRole: async (roles: string[]) => {
    if (!roles.includes(currentUser.role)) throw new Error('REDIRECT');
    return currentUser;
  },
  requireAccess: async (section: string, level: 'view' | 'edit' = 'view') => {
    const { presetAccess, hasAccess } = await import('@/lib/auth/roles');
    const access = presetAccess(currentUser.role as 'admin' | 'editor' | 'centre_staff');
    if (!hasAccess(access, section as 'leads', level)) throw new Error('REDIRECT');
    return { ...currentUser, access, leadScope: currentUser.role === 'centre_staff' ? 'centre' : 'all' };
  },
}));
vi.mock('@/lib/leads/store', () => ({ ...store, CALL_OUTCOMES: ['connected', 'no_answer', 'busy', 'wrong_number', 'call_back_later'] }));
vi.mock('@/lib/leads/crm-handoff', () => ({
  handoffLeadToCrm: (...a: unknown[]) => crm.handoffLeadToCrm(...a),
}));
vi.mock('@/lib/leads/crm-reconcile', async () => {
  const actual = await vi.importActual<typeof import('@/lib/leads/crm-reconcile')>('@/lib/leads/crm-reconcile');
  return {
    ...actual,
    pushLeadRowToCrm: (...a: unknown[]) => crm.pushLeadRowToCrm(...a),
    sleep: (...a: unknown[]) => crm.sleep(...a),
  };
});
vi.mock('@/lib/cms/store', () => ({
  listCollection: async (c: string) =>
    c === 'centres'
      ? [{ slug: 'pune-shivajinagar', name: 'Pune Shivajinagar', citySlug: 'pune' }]
      : [{ slug: 'pune', name: 'Pune' }],
}));
vi.mock('@/lib/audit/log', () => ({ recordAudit: vi.fn() }));
vi.mock('@/lib/auth/users', () => ({ listUsers: async () => [] }));

const actions = await import('@/app/(admin)/admin/leads/actions');

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  store.listLeads.mockResolvedValue(LEADS);
  store.getLead.mockImplementation(async (id: string) => LEADS.find((l) => l.id === id));
  store.assignLead.mockImplementation(async (id: string) => LEADS.find((l) => l.id === id));
  store.updateLeadStatus.mockImplementation(async (id: string) => LEADS.find((l) => l.id === id));
  store.createLead.mockImplementation(async (d: unknown) => ({ id: ID(9), name: 'x', ...(d as object) }));
  store.importLeadRows.mockResolvedValue({ added: 1, duplicates: 0 });
  store.listLeadActivities.mockResolvedValue([]);
  store.listLeadsByCrmStatus.mockImplementation(async (statuses: string[]) =>
    LEADS.filter((l) => statuses.includes(l.crmStatus)),
  );
  crm.pushLeadRowToCrm.mockResolvedValue({ routed: true, status: 'routed' });
  crm.handoffLeadToCrm.mockResolvedValue({ routed: true, status: 'routed' });
  crm.sleep.mockResolvedValue(undefined);
});

const as = (role: string, centreSlug: string | null = null) => (currentUser = { name: 'Tester', role, centreSlug });

describe('role x centre scoping matrix', () => {
  it('admin and editor see every lead', async () => {
    for (const role of ['admin', 'editor']) {
      as(role);
      expect(await actions.getLeads()).toHaveLength(4);
    }
  });

  it('centre_staff sees own city (case/space-insensitive) plus leads enquired for the exact centre', async () => {
    as('centre_staff', 'pune-shivajinagar');
    const names = (await actions.getLeads()).map((l) => l.name);
    expect(names).toEqual(['Pune A', 'Pune other centre', 'Chennai via centre']);
  });

  it('centre_staff with a stale/unknown centre sees NOTHING (fail closed)', async () => {
    as('centre_staff', 'deleted-centre');
    expect(await actions.getLeads()).toEqual([]);
    expect((await actions.getLeadsSummary()).total).toBe(0);
  });

  it('centre_staff with no centre assigned sees NOTHING', async () => {
    as('centre_staff', null);
    expect(await actions.getLeads()).toEqual([]);
  });

  it('summary counts only in-scope leads for centre_staff', async () => {
    as('centre_staff', 'pune-shivajinagar');
    const s = await actions.getLeadsSummary();
    expect(s.total).toBe(3);
    expect(s.byStatus).toMatchObject({ new: 1, contacted: 1, lost: 1 });
  });

  it('unknown roles are rejected', async () => {
    as('viewer');
    await expect(actions.getLeads()).rejects.toThrow('REDIRECT');
  });
});

describe('IDOR: centre_staff cannot touch another centre lead by id', () => {
  beforeEach(() => as('centre_staff', 'pune-shivajinagar'));

  it('timeline read throws not found', async () => {
    await expect(actions.getLeadTimeline(ID(2))).rejects.toThrow('Lead not found.');
    expect(store.listLeadActivities).not.toHaveBeenCalled();
  });

  it('status change, note, follow-up, call, delete are refused and never write', async () => {
    expect((await actions.moveLeadStatus(ID(2), 'enrolled')).ok).toBe(false);
    expect((await actions.addNote(ID(2), 'hi')).ok).toBe(false);
    expect((await actions.scheduleFollowUp(ID(2), new Date().toISOString())).ok).toBe(false);
    expect((await actions.recordCall(ID(2), 'connected', '')).ok).toBe(false);
    await expect(actions.removeLead(ID(2))).rejects.toThrow();
    expect(store.updateLeadStatus).not.toHaveBeenCalled();
    expect(store.addLeadNote).not.toHaveBeenCalled();
    expect(store.setLeadFollowUp).not.toHaveBeenCalled();
    expect(store.logLeadCall).not.toHaveBeenCalled();
    expect(store.deleteLead).not.toHaveBeenCalled();
  });

  it('bulk assign/delete silently drop out-of-scope ids', async () => {
    const res = await actions.assignLeads([ID(1), ID(2)], 'Me');
    expect(res.ok && res.leads.map((l) => l.id)).toEqual([ID(1)]);
    expect(store.assignLead).toHaveBeenCalledTimes(1);
    const del = await actions.removeLeads([ID(2), ID(1)]);
    expect(del.deleted).toBe(1);
    expect(store.deleteLeads).toHaveBeenCalledWith([ID(1)]);
  });

  it('non-uuid ids never reach the database (no driver error leaks)', async () => {
    const r = await actions.moveLeadStatus("1' OR '1'='1", 'new');
    expect(r).toEqual({ ok: false, error: 'Lead not found.' });
    expect(store.getLead).not.toHaveBeenCalled();
  });

  it('import is admin/editor only', async () => {
    await expect(actions.importLeads([{ name: 'a', phone: '1234567890' }])).rejects.toThrow();
  });

  it('creating a lead is pinned to the staff member city even if the form says otherwise', async () => {
    const fd = new FormData();
    fd.set('name', 'New Person');
    fd.set('city', 'Mumbai');
    await actions.submitLead(fd);
    expect(store.createLead.mock.calls[0]![0].city).toBe('Pune');
  });

  it('assignees list is limited to self', async () => {
    expect(await actions.listAssignees()).toEqual(['Tester']);
  });
});

describe('validation', () => {
  beforeEach(() => as('admin'));

  it('rejects statuses outside the vocabulary', async () => {
    expect((await actions.moveLeadStatus(ID(1), 'hacked')).ok).toBe(false);
    expect(store.updateLeadStatus).not.toHaveBeenCalled();
    expect((await actions.moveLeadStatus(ID(1), 'enrolled')).ok).toBe(true);
  });

  it('rejects unknown call outcomes, bad dates, empty/oversized notes, long assignee names', async () => {
    expect((await actions.recordCall(ID(1), 'nope', '')).ok).toBe(false);
    expect((await actions.scheduleFollowUp(ID(1), 'not-a-date')).ok).toBe(false);
    expect((await actions.addNote(ID(1), '   ')).ok).toBe(false);
    expect((await actions.addNote(ID(1), 'x'.repeat(5001))).ok).toBe(false);
    expect((await actions.assignLeads([ID(1)], 'n'.repeat(121))).ok).toBe(false);
  });

  it('import drops malformed rows, caps at 2000 and reports invalid', async () => {
    const rows = [
      { name: 'Ok', phone: '9800000001' },
      { name: '', phone: '9800000002' },
      { name: 'No contact' },
      { name: 123 as unknown as string, phone: '1' },
      ...Array.from({ length: 2500 }, (_, i) => ({ name: `n${i}`, phone: `98${String(i).padStart(8, '0')}` })),
    ];
    await actions.importLeads(rows);
    const passed = store.importLeadRows.mock.calls[0]![0];
    expect(passed.length).toBeLessThanOrEqual(2000);
    expect(passed.every((r: { name: string }) => typeof r.name === 'string' && r.name.trim())).toBe(true);
  });
});

describe('CRM reconcile / push', () => {
  it('pushLeadToCrm refuses out-of-scope leads for centre_staff', async () => {
    as('centre_staff', 'pune-shivajinagar');
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    expect((await actions.pushLeadToCrm(ID(2))).ok).toBe(false);
    expect(crm.pushLeadRowToCrm).not.toHaveBeenCalled();
  });

  it('pushLeadToCrm skips leads already matched in CRM', async () => {
    as('admin');
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    const r = await actions.pushLeadToCrm(ID(3));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/already saved/i);
    expect(crm.pushLeadRowToCrm).not.toHaveBeenCalled();
  });

  it('pushLeadToCrm pushes an unmatched in-scope lead', async () => {
    as('admin');
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    crm.pushLeadRowToCrm.mockResolvedValueOnce({ routed: true, status: 'routed', detail: 'ok' });
    store.getLead.mockResolvedValueOnce(LEADS[0]).mockResolvedValueOnce({ ...LEADS[0], crmStatus: 'routed' });
    const r = await actions.pushLeadToCrm(ID(1));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.status).toBe('routed');
      expect(r.lead.crmStatus).toBe('routed');
    }
    expect(crm.pushLeadRowToCrm).toHaveBeenCalledOnce();
  });

  it('reconcileLeadsWithCrm on selected ids only pushes unmatched in-scope leads', async () => {
    as('centre_staff', 'pune-shivajinagar');
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    crm.pushLeadRowToCrm
      .mockResolvedValueOnce({ routed: true, status: 'routed' })
      .mockResolvedValueOnce({ routed: false, status: 'duplicate', detail: 'mobile already in the CRM' });

    const r = await actions.reconcileLeadsWithCrm([ID(1), ID(2), ID(3), ID(4)]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      // ID(2) out of scope; ID(3) already routed — only 1 and 4.
      expect(r.counts.attempted).toBe(2);
      expect(r.counts.pushed).toBe(1);
      expect(r.counts.blockedSameMobile).toBe(1);
    }
    expect(crm.pushLeadRowToCrm).toHaveBeenCalledTimes(2);
  });

  it('full reconcile without ids is admin/editor only', async () => {
    as('centre_staff', 'pune-shivajinagar');
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    const r = await actions.reconcileLeadsWithCrm();
    expect(r.ok).toBe(false);
    expect(crm.pushLeadRowToCrm).not.toHaveBeenCalled();
  });

  it('full reconcile pushes unmatched backlog for admin', async () => {
    as('admin');
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    crm.pushLeadRowToCrm.mockResolvedValue({ routed: true, status: 'routed' });
    const r = await actions.reconcileLeadsWithCrm();
    expect(r.ok).toBe(true);
    if (r.ok) {
      // LEADS unmatched: 1 failed, 2 none, 4 skipped (3 is routed)
      expect(r.counts.attempted).toBe(3);
      expect(r.counts.pushed).toBe(3);
    }
    expect(store.listLeadsByCrmStatus).toHaveBeenCalled();
  });
});
