import { beforeEach, describe, expect, it, vi } from 'vitest';

const saveEnquiry = vi.hoisted(() => vi.fn());
vi.mock('@/lib/leads/intake', () => ({ saveEnquiry, setCrmStatus: vi.fn() }));
vi.mock('@/lib/chatbot/session', () => ({ getSessionUser: async () => null }));

const { clientKey, createRateLimiter } = await import('@/lib/rate-limit');

const good = { name: 'Asha Rao', phone: '+91 98000 00001', ft: 5000 };
let ip = 0;
let routeRef: typeof import('@/app/api/enquiry/route');
const post = (body: unknown, headers: Record<string, string> = {}) =>
  routeRef.POST(
    new Request('http://localhost/api/enquiry', {
      method: 'POST',
      headers: { 'content-type': 'application/json', host: 'localhost', 'x-forwarded-for': `10.0.0.${++ip}`, ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

beforeEach(async () => {
  vi.resetModules();
  delete process.env.CRM_ENDPOINT;
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  saveEnquiry.mockReset().mockResolvedValue({ id: 'x', duplicate: false });
  routeRef = await import('@/app/api/enquiry/route');
});

describe('enquiry validation', () => {
  it('accepts a good post and stores it', async () => {
    const res = await post(good);
    expect(res.status).toBe(200);
    expect(saveEnquiry).toHaveBeenCalledOnce();
  });
  it.each([
    ['short name', { ...good, name: 'A' }],
    ['letters in phone', { ...good, phone: 'abcdefghijk' }],
    ['short phone', { ...good, phone: '12345' }],
    ['bad email', { ...good, email: 'nope' }],
    ['bad qualification', { ...good, qualification: 'phd' }],
    ['huge message', { ...good, message: 'x'.repeat(2001) }],
    ['bad visitor id', { ...good, visitorId: 'bad' }],
    ['non-object', 'null'],
  ])('rejects %s with a generic 400', async (_n, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toBe('Please check the form and try again.');
    expect(saveEnquiry).not.toHaveBeenCalled();
  });
  it('rejects malformed JSON', async () => {
    expect((await post('{nope')).status).toBe(400);
  });
  it('does not let unknown fields (status, assignedTo, id) reach storage', async () => {
    await post({ ...good, status: 'enrolled', assignedTo: 'boss', id: 'x' });
    const arg = saveEnquiry.mock.calls[0]![0];
    expect(arg).not.toHaveProperty('status');
    expect(arg).not.toHaveProperty('assignedTo');
    expect(arg).not.toHaveProperty('id');
  });
});

describe('bot protection', () => {
  it('silently drops honeypot hits with a success-looking response', async () => {
    const res = await post({ ...good, hp: 'http://spam' });
    expect(await res.json()).toEqual({ ok: true, routed: false });
    expect(saveEnquiry).not.toHaveBeenCalled();
  });
  it('drops impossibly fast submissions', async () => {
    await post({ ...good, ft: 100 });
    expect(saveEnquiry).not.toHaveBeenCalled();
  });
  it('lets a no-signal post through only twice per window per connection', async () => {
    const h = { 'x-forwarded-for': '9.9.9.9' };
    const body = { name: 'Asha Rao', phone: '9800000001' };
    for (let i = 0; i < 4; i++) await post(body, h);
    expect(saveEnquiry).toHaveBeenCalledTimes(2);
  });
  it('rate-limits to 5 per window then answers 429', async () => {
    const h = { 'x-forwarded-for': '8.8.8.8' };
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) statuses.push((await post(good, h)).status);
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429, 429]);
  });
  it('blocks cross-site browser posts', async () => {
    expect((await post(good, { 'sec-fetch-site': 'cross-site' })).status).toBe(403);
    expect((await post(good, { origin: 'https://evil.example' })).status).toBe(403);
  });
});

describe('rate limit keys', () => {
  const req = (h: Record<string, string>) => new Request('http://x', { headers: h });
  it('keys on the proxy-appended hop, not a client-supplied prefix (see client-ip.test.ts)', () => {
    expect(clientKey(req({ 'x-forwarded-for': 'fake, 5.5.5.5' }))).toBe('5.5.5.5');
    expect(clientKey(req({}))).toBe('anonymous');
  });
  it('memory limiter isolates keys and resets after the window', async () => {
    vi.useFakeTimers();
    const l = createRateLimiter({ windowMs: 1000, max: 1 });
    expect((await l.check('a')).allowed).toBe(true);
    expect((await l.check('a')).allowed).toBe(false);
    expect((await l.check('b')).allowed).toBe(true);
    vi.advanceTimersByTime(1500);
    expect((await l.check('a')).allowed).toBe(true);
    vi.useRealTimers();
  });
});
