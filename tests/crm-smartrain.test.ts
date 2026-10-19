import { describe, expect, it, vi } from 'vitest';
import ids from '@/lib/crm/centre-ids.json';
import { centres } from '@/lib/content/fixtures/locations';
import { crmIdsForCentre, normalizeMobile, sendToCrm, splitName, toCrmPayload } from '@/lib/crm/smartrain';
import { crmStatusLabel } from '@/lib/leads/transfer';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

describe('centre id map', () => {
  it('covers every site centre exactly once, with numeric ids', () => {
    const map = ids as Record<string, { center: number; city: number; state: number }>;
    for (const c of centres) {
      const m = map[c.slug];
      expect(m, `no CRM mapping for ${c.slug}`).toBeTruthy();
      expect([m!.center, m!.city, m!.state].every((n) => Number.isInteger(n) && n > 0)).toBe(true);
    }
    const branchIds = Object.values(map).map((m) => m.center);
    expect(new Set(branchIds).size).toBe(branchIds.length);
  });

  it('knows the renamed legacy branches', () => {
    expect(crmIdsForCentre('ameerpet')?.center).toBe(172); // "New Ameerpeth"
    expect(crmIdsForCentre('kanpur')?.center).toBe(34); // "New Kanpur"
    expect(crmIdsForCentre('ghaziabad')?.center).toBe(179);
    expect(crmIdsForCentre('nope')).toBeNull();
    expect(crmIdsForCentre(undefined)).toBeNull();
  });
});

describe('field mapping', () => {
  it('normalises Indian mobile numbers', () => {
    expect(normalizeMobile('+91 98765 43210')).toBe('9876543210');
    expect(normalizeMobile('09876543210')).toBe('9876543210');
    expect(normalizeMobile('919876543210')).toBe('9876543210');
    expect(normalizeMobile('1234567890')).toBeNull(); // does not start 6-9
    expect(normalizeMobile('98765')).toBeNull();
  });

  it('splits a name into first and last', () => {
    expect(splitName('Asha Verma')).toEqual({ first: 'Asha', last: 'Verma' });
    expect(splitName('  Asha  Devi  Verma ')).toEqual({ first: 'Asha', last: 'Devi Verma' });
    expect(splitName('Asha')).toEqual({ first: 'Asha' });
  });

  it('builds the CRM payload with numeric ids and omits optional fields it does not have', () => {
    const r = toCrmPayload({ name: 'Asha Verma', phone: '+91 98765 43210', email: 'a@b.in', centreSlug: 'ghaziabad' });
    expect(r).toEqual({
      ok: true,
      payload: {
        mobile: '9876543210',
        email: 'a@b.in',
        first_name: 'Asha',
        last_name: 'Verma',
        state: expect.any(Number),
        city: expect.any(Number),
        center: 179,
      },
    });
    const one = toCrmPayload({ name: 'Asha', phone: '9876543210', email: 'a@b.in', centreSlug: 'ghaziabad' });
    expect(one.ok && 'last_name' in one.payload).toBe(false);
    expect(one.ok && 'course' in one.payload).toBe(false);
  });

  it('refuses to invent values for the CRM-required fields', () => {
    const base = { name: 'Asha Verma', phone: '9876543210', email: 'a@b.in', centreSlug: 'ghaziabad' };
    expect(toCrmPayload({ ...base, email: '' })).toMatchObject({ ok: false, reason: expect.stringContaining('email') });
    expect(toCrmPayload({ ...base, centreSlug: undefined })).toMatchObject({ ok: false, reason: expect.stringContaining('centre') });
    expect(toCrmPayload({ ...base, centreSlug: 'new-unmapped-centre' })).toMatchObject({
      ok: false,
      reason: expect.stringContaining('mapping'),
    });
    expect(toCrmPayload({ ...base, phone: '12345' })).toMatchObject({ ok: false, reason: expect.stringContaining('mobile') });
  });
});

describe('sendToCrm', () => {
  const payload = { mobile: '9876543210', email: 'a@b.in', first_name: 'A', state: 22, city: 2707, center: 177 };
  const throwing = (e: Error) => (async () => {
    throw e;
  }) as never;

  it('posts JSON and reads the outcome from the body, not the status code', async () => {
    const f = vi.fn(async () => json({ action: 'success' }));
    expect(await sendToCrm('https://crm.example/x', payload, f as never)).toEqual({ status: 'routed', detail: 'success' });
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://crm.example/x');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['content-type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it('HTTP 200 with action=error is not a success (the CRM always answers 200)', async () => {
    const f = async () => json({ action: 'error', messages: { email: ['The email must be a valid email address.'] } });
    const out = await sendToCrm('https://crm.example/x', payload, f as never);
    expect(out.status).toBe('rejected');
    expect(out.detail).toContain('email');
  });

  it('a mobile the CRM already has is a duplicate, not a failure (nothing is lost, retrying cannot help)', async () => {
    const f = async () => json({ action: 'error', messages: { mobile: ['The mobile has already been taken.'] } });
    expect(await sendToCrm('https://crm.example/x', payload, f as never)).toEqual({
      status: 'duplicate',
      detail: 'mobile already in the CRM',
    });
  });

  it('network errors, timeouts, bad HTTP and non-JSON are failures', async () => {
    expect((await sendToCrm('u', payload, throwing(new TypeError('fetch failed')))).status).toBe('failed');
    const timeout = Object.assign(new Error('t'), { name: 'TimeoutError' });
    expect(await sendToCrm('u', payload, throwing(timeout))).toEqual({ status: 'failed', detail: 'timed out' });
    expect((await sendToCrm('u', payload, (async () => new Response('x', { status: 502 })) as never)).detail).toBe('HTTP 502');
    expect((await sendToCrm('u', payload, (async () => new Response('<html>', { status: 200 })) as never)).detail).toBe(
      'response was not JSON',
    );
  });

  it('the outcome detail never carries the submitted values', async () => {
    const f = async () => json({ action: 'error', messages: { mobile: ['The mobile has already been taken.'], email: ['bad'] } });
    const out = await sendToCrm('u', payload, f as never);
    expect(JSON.stringify(out)).not.toContain('9876543210');
    expect(JSON.stringify(out)).not.toContain('a@b.in');
  });
});

describe('status labels', () => {
  it('has a readable label for every hand-off status', () => {
    expect(crmStatusLabel('routed')).toBe('Sent');
    expect(crmStatusLabel('duplicate')).toBe('Already in CRM');
    expect(crmStatusLabel('rejected')).toBe('Rejected by CRM');
    expect(crmStatusLabel('skipped')).toContain('missing');
    expect(crmStatusLabel('none')).toBe('Not configured');
  });
});
