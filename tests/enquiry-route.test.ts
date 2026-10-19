import { afterAll, describe, expect, it } from 'vitest';
import { HAS_DB } from './helpers/db';

const run = describe.skipIf(!HAS_DB);

run('POST /api/enquiry', async () => {
  const { POST } = await import('@/app/api/enquiry/route');
  const { getDb } = await import('@/lib/db/client');
  const { leads } = await import('@/lib/db/schema');
  const { eq, like } = await import('drizzle-orm');

  const post = (body: unknown, headers: Record<string, string> = {}) =>
    POST(new Request('http://localhost/api/enquiry', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }));

  afterAll(async () => {
    await getDb()!.delete(leads).where(like(leads.name, '__test_%'));
  });

  it('rejects a malformed enquiry with the failing field names', async () => {
    const res = await post({ name: 'x', phone: 'abc' });
    expect(res.status).toBe(400);
    expect((await res.json()).fields).toEqual(expect.arrayContaining(['name', 'phone']));
  });

  it('rejects cross-site posts', async () => {
    const res = await post({ name: '__test_x', phone: '9000000010' }, { 'sec-fetch-site': 'cross-site' });
    expect(res.status).toBe(403);
  });

  it('drops honeypot posts without storing them', async () => {
    const res = await post({ name: '__test_bot', phone: '9000000011', hp: 'spam', ft: 5000 });
    expect((await res.json()).ok).toBe(true);
    expect(await getDb()!.select().from(leads).where(eq(leads.name, '__test_bot'))).toHaveLength(0);
  });

  it('stores a valid enquiry in the leads table', async () => {
    const res = await post({ name: '__test_ok', phone: '9000000012', source: 'enquiry-page', persona: 'parent', ft: 5000 });
    expect(res.status).toBe(200);
    const [lead] = await getDb()!.select().from(leads).where(eq(leads.name, '__test_ok'));
    expect(lead).toMatchObject({ phone: '9000000012', form: 'enquiry-page', persona: 'parent', status: 'new' });
  });
});
