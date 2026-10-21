import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  setCrmStatus: vi.fn(),
  noteCrmPersonExists: vi.fn(),
  sendToCrm: vi.fn(),
  toCrmPayload: vi.fn(),
  listCities: vi.fn(),
  listCentres: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/leads/intake', () => ({
  setCrmStatus: (...a: unknown[]) => {
    h.setCrmStatus(...a);
    return Promise.resolve();
  },
  noteCrmPersonExists: (...a: unknown[]) => {
    h.noteCrmPersonExists(...a);
    return Promise.resolve();
  },
}));
vi.mock('@/lib/crm/smartrain', () => ({
  crmIdsForCentre: (slug: string | undefined) => (slug === 'dadar' ? { center: 1, city: 2, state: 3, crm: 'Dadar' } : null),
  toCrmPayload: (...a: unknown[]) => h.toCrmPayload(...a),
  sendToCrm: (...a: unknown[]) => h.sendToCrm(...a),
}));
vi.mock('@/lib/content', () => ({
  content: {
    listCities: () => h.listCities(),
    listCentres: (q?: { citySlug?: string }) => h.listCentres(q),
  },
}));

import { handoffLeadToCrm, resolveCentreForCrm } from '@/lib/leads/crm-handoff';

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  delete process.env.CRM_ENDPOINT;
  delete process.env.CRM_PROVIDER;
  h.listCities.mockResolvedValue([{ slug: 'mumbai', name: 'Mumbai' }]);
  h.listCentres.mockResolvedValue([{ slug: 'dadar', name: 'Dadar', citySlug: 'mumbai' }]);
  h.toCrmPayload.mockReturnValue({
    ok: true,
    payload: { mobile: '9876543210', email: 'a@b.com', first_name: 'A', state: 3, city: 2, center: 1 },
  });
  h.sendToCrm.mockResolvedValue({ status: 'routed', detail: 'ok' });
});

describe('resolveCentreForCrm', () => {
  it('keeps a mapped centre slug', async () => {
    expect(await resolveCentreForCrm('dadar', undefined)).toBe('dadar');
  });

  it('picks the first mapped centre in a city when none was chosen', async () => {
    expect(await resolveCentreForCrm(undefined, 'Mumbai')).toBe('dadar');
    expect(h.listCentres).toHaveBeenCalledWith({ citySlug: 'mumbai' });
  });
});

describe('handoffLeadToCrm', () => {
  it('returns none when CRM_ENDPOINT is unset', async () => {
    const r = await handoffLeadToCrm({ name: 'A', phone: '9876543210', leadId: 'l1' });
    expect(r).toMatchObject({ routed: false, status: 'none' });
    expect(h.sendToCrm).not.toHaveBeenCalled();
  });

  it('sends via Smartrain and updates crm_status', async () => {
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    vi.stubEnv('CRM_PROVIDER', 'smartrain');
    const r = await handoffLeadToCrm({
      leadId: 'l1',
      name: 'Asha Rao',
      phone: '9876543210',
      email: 'asha@example.com',
      centreSlug: 'dadar',
    });
    expect(r.routed).toBe(true);
    expect(h.sendToCrm).toHaveBeenCalledOnce();
    expect(h.setCrmStatus).toHaveBeenCalledWith('l1', 'routed', null);
  });

  it('marks duplicate and notes the panel when CRM already has the mobile', async () => {
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    vi.stubEnv('CRM_PROVIDER', 'smartrain');
    h.sendToCrm.mockResolvedValueOnce({ status: 'duplicate', detail: 'mobile already in the CRM' });
    const r = await handoffLeadToCrm({
      leadId: 'l-dup',
      name: 'Asha',
      phone: '9876543210',
      email: 'a@b.com',
      centreSlug: 'dadar',
      city: 'Mumbai',
    });
    expect(r).toMatchObject({ routed: false, status: 'duplicate' });
    expect(h.setCrmStatus).toHaveBeenCalledWith('l-dup', 'duplicate', expect.stringMatching(/unique:users/i));
    expect(h.noteCrmPersonExists).toHaveBeenCalledWith('l-dup', expect.stringContaining('dadar'));
  });

  it('marks skipped when Smartrain cannot build a payload', async () => {
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/save');
    vi.stubEnv('CRM_PROVIDER', 'smartrain');
    h.toCrmPayload.mockReturnValueOnce({ ok: false, reason: 'email missing (required by the CRM)' });
    const r = await handoffLeadToCrm({
      leadId: 'l2',
      name: 'Asha',
      phone: '9876543210',
      centreSlug: 'dadar',
    });
    expect(r).toMatchObject({ routed: false, status: 'skipped' });
    expect(h.setCrmStatus).toHaveBeenCalledWith('l2', 'skipped', 'email missing (required by the CRM)');
    expect(h.sendToCrm).not.toHaveBeenCalled();
  });

  it('posts JSON to a generic CRM_ENDPOINT', async () => {
    vi.stubEnv('CRM_ENDPOINT', 'https://crm.example/hooks');
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchImpl);
    const r = await handoffLeadToCrm({
      leadId: 'l3',
      name: 'Asha',
      phone: '9876543210',
      email: 'a@b.com',
      raw: { name: 'Asha', phone: '9876543210' },
    });
    expect(r.routed).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://crm.example/hooks',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(h.setCrmStatus).toHaveBeenCalledWith('l3', 'routed', null);
  });
});
