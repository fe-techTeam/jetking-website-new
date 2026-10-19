import { beforeEach, describe, expect, it, vi } from 'vitest';

const publish = vi.hoisted(() => vi.fn(async (_opts?: unknown) => undefined));
const report = vi.hoisted(() => vi.fn(async (..._args: unknown[]) => undefined));
vi.mock('@/lib/cms/publish', () => ({ publishContent: publish }));
vi.mock('@/lib/error-report', () => ({ reportError: report }));

const post = (url: string, body: unknown, headers: Record<string, string> = {}, raw = false) =>
  new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: raw ? (body as string) : JSON.stringify(body),
  });

describe('/api/revalidate', () => {
  beforeEach(() => {
    publish.mockClear();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('rejects missing and wrong secrets, accepts the right one', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'sekret');
    const { POST } = await import('../src/app/api/revalidate/route');
    expect((await POST(post('/api/revalidate', {}))).status).toBe(401);
    expect((await POST(post('/api/revalidate', {}, { authorization: 'Bearer nope' }))).status).toBe(401);
    expect((await POST(post('/api/revalidate', {}, { authorization: 'Bearer sekre' }))).status).toBe(401);
    expect(publish).not.toHaveBeenCalled();
    expect((await POST(post('/api/revalidate', { paths: ['/courses'] }, { authorization: 'Bearer sekret' }))).status).toBe(200);
    expect(publish).toHaveBeenCalledWith({ paths: ['/courses'] });
  });

  it('fails closed in production when the secret is unset', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RATE_LIMIT_ALLOW_MEMORY', 'true');
    vi.stubEnv('REVALIDATE_SECRET', '');
    const { POST } = await import('../src/app/api/revalidate/route');
    expect((await POST(post('/api/revalidate', {}))).status).toBe(503);
    expect(publish).not.toHaveBeenCalled();
  });

  it('filters non-string / protocol-relative paths and caps the count', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 's');
    const { POST } = await import('../src/app/api/revalidate/route');
    const paths = ['/a', 5, null, '//evil', 'nope', ...Array.from({ length: 80 }, (_, i) => `/p${i}`)];
    await POST(post('/api/revalidate', { paths }, { authorization: 'Bearer s' }));
    const sent = (publish.mock.calls[0]![0] as { paths: string[] }).paths;
    expect(sent).toHaveLength(50);
    expect(sent.every((p) => p.startsWith('/') && !p.startsWith('//'))).toBe(true);
  });

  it('rate limits before checking the secret', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 's');
    const { POST } = await import('../src/app/api/revalidate/route');
    let last = 0;
    for (let i = 0; i < 12; i++) last = (await POST(post('/api/revalidate', {}, { authorization: 'Bearer bad', 'x-forwarded-for': '9.9.9.9' }))).status;
    expect(last).toBe(429);
  });
});

describe('/api/client-error', () => {
  beforeEach(() => {
    report.mockClear();
    vi.resetModules();
  });

  it('accepts a valid report and truncates the user agent', async () => {
    const { POST } = await import('../src/app/api/client-error/route');
    const res = await POST(post('/api/client-error', { message: 'boom' }, { 'user-agent': 'x'.repeat(500), 'x-forwarded-for': '1.1.1.1' }));
    expect(res.status).toBe(204);
    const ctx = report.mock.calls[0]![2] as { ua: string };
    expect(ctx.ua).toHaveLength(160);
  });

  it('rejects cross-site, invalid, oversized and over-limit fields', async () => {
    const { POST } = await import('../src/app/api/client-error/route');
    const h = { 'x-forwarded-for': '2.2.2.2' };
    expect((await POST(post('/api/client-error', { message: 'a' }, { ...h, 'sec-fetch-site': 'cross-site' }))).status).toBe(403);
    expect((await POST(post('/api/client-error', 'not json', h, true))).status).toBe(400);
    expect((await POST(post('/api/client-error', { message: '' }, h))).status).toBe(400);
    expect((await POST(post('/api/client-error', { message: 'x'.repeat(301) }, h))).status).toBe(400);
    expect((await POST(post('/api/client-error', { message: 'a', stack: 'y'.repeat(2001) }, h))).status).toBe(400);
    expect((await POST(post('/api/client-error', { message: 'a', pad: 'z'.repeat(20_000) }, h))).status).toBe(413);
    expect(report).not.toHaveBeenCalled();
  });

  it('rate limits floods per client', async () => {
    const { POST } = await import('../src/app/api/client-error/route');
    let last = 0;
    for (let i = 0; i < 17; i++) last = (await POST(post('/api/client-error', { message: `m${i}` }, { 'x-forwarded-for': '3.3.3.3' }))).status;
    expect(last).toBe(429);
    expect(report.mock.calls.length).toBe(15);
  });
});
