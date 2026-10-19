import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const jar = new Map<string, string>();
  return {
    jar,
    setCalls: [] as Array<{ name: string; value: string; opts: Record<string, unknown> }>,
    headers: new Map<string, string>(),
    limit: { allowed: true, retryAfter: 0 },
    dbConfigured: true,
    users: new Map<string, Record<string, unknown>>(),
    verify: vi.fn(),
  };
});

class Redirect extends Error {
  constructor(public to: string) {
    super(`REDIRECT:${to}`);
  }
}

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (n: string) => (h.jar.has(n) ? { value: h.jar.get(n) } : undefined),
    set: (name: string, value: string, opts: Record<string, unknown>) => {
      h.jar.set(name, value);
      h.setCalls.push({ name, value, opts });
    },
    delete: (n: string) => void h.jar.delete(n),
  }),
  headers: async () => ({ get: (n: string) => h.headers.get(n) ?? null }),
}));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Redirect(to);
  },
}));
vi.mock('@/lib/rate-limit', () => ({ createRateLimiter: () => ({ check: async () => h.limit }) }));
vi.mock('@/lib/auth/users', () => ({
  isDatabaseConfigured: () => h.dbConfigured,
  getUserByEmail: async (e: string) => [...h.users.values()].find((u) => u.email === e.trim().toLowerCase()),
  getUserById: async (id: string) => h.users.get(id),
  touchLastActive: vi.fn(async () => {}),
  revokeUserSessions: async (id: string) => {
    const u = h.users.get(id);
    if (!u) return null;
    u.sessionVersion = (u.sessionVersion as number) + 1;
    return u.sessionVersion as number;
  },
}));
vi.mock('@/lib/auth/password', () => ({
  hashPassword: async (p: string) => `hash:${p}`,
  verifyPassword: (p: string, stored: string) => h.verify(p, stored),
}));
vi.mock('@/lib/audit/log', () => ({ recordAudit: vi.fn() }));
vi.mock('@/lib/cms/store', () => ({
  DuplicateIdError: class extends Error {},
  deleteRecord: vi.fn(),
  listCollection: vi.fn(),
  resetCmsStoreFromFixtures: vi.fn(),
  upsertRecord: vi.fn(),
}));
vi.mock('@/lib/cms/publish', () => ({ publishContent: vi.fn() }));
vi.mock('@/lib/cms/schemas', () => ({ CMS_COLLECTIONS: ['courses'], validateCmsRecord: () => ({ ok: true }) }));
vi.mock('@/lib/rich/html', () => ({ htmlToBlocks: () => [], sanitizeRichHtml: (s: string) => s }));
vi.mock('@/lib/rich/text', () => ({ isRichHtml: () => false }));
vi.mock('@/lib/cms/revisions', () => ({ getRevision: vi.fn(), listDeleted: vi.fn(), listRevisions: vi.fn() }));
vi.mock('@/app/(admin)/admin/registry', () => ({ collectionByKey: () => ({ roles: ['admin'] }) }));

import { adminLogin, adminLogout, getCurrentUser, requireRole } from '@/app/(admin)/admin/actions';
import { recordAudit } from '@/lib/audit/log';

const COOKIE = 'jk_admin_session';
const SECRET = 'test-secret';

async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(msg)));
  return Buffer.from(sig).toString('base64url');
}
const sessionFor = async (id: string, at = Date.now(), key = SECRET, version = 0) =>
  `${id}.${at}.${version}.${await hmac(key, `${id}.${at}.${version}`)}`;
const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};
const addUser = (id: string, role: string, extra: Record<string, unknown> = {}) =>
  h.users.set(id, { id, name: id, email: `${id}@x.com`, role, status: 'active', centreSlug: null, passwordHash: 'hash:pw', sessionVersion: 0, ...extra });

beforeEach(() => {
  h.jar.clear();
  h.setCalls.length = 0;
  h.users.clear();
  h.headers.clear();
  h.limit = { allowed: true, retryAfter: 0 };
  h.dbConfigured = true;
  h.verify.mockReset().mockImplementation(async (p: string, s: string) => s === `hash:${p}`);
  vi.unstubAllEnvs();
  vi.stubEnv('ADMIN_SESSION_SECRET', SECRET);
  vi.stubEnv('ADMIN_PASSWORD', 'legacy-pass');
});

describe('multi-user getCurrentUser', () => {
  it('returns null with no cookie', async () => {
    expect(await getCurrentUser()).toBeNull();
  });
  it('accepts a valid signed session and reads role fresh from the DB', async () => {
    addUser('u1', 'editor');
    h.jar.set(COOKIE, await sessionFor('u1'));
    expect(await getCurrentUser()).toMatchObject({ id: 'u1', role: 'editor' });
    addUser('u1', 'admin');
    expect((await getCurrentUser())?.role).toBe('admin');
  });
  it('rejects tampered signature, wrong key, swapped user id, malformed and expired cookies', async () => {
    addUser('u1', 'editor');
    addUser('u2', 'admin');
    const good = await sessionFor('u1');
    for (const bad of [
      good.slice(0, -2) + 'xx',
      await sessionFor('u1', Date.now(), 'other-key'),
      good.replace('u1.', 'u2.'),
      'garbage',
      'a.b',
      'u1.notanumber.sig',
      await sessionFor('u1', Date.now() - 13 * 3600_000),
    ]) {
      h.jar.set(COOKIE, bad);
      expect(await getCurrentUser(), bad).toBeNull();
    }
  });
  it('rejects disabled or deleted users immediately', async () => {
    addUser('u1', 'admin', { status: 'disabled' });
    h.jar.set(COOKIE, await sessionFor('u1'));
    expect(await getCurrentUser()).toBeNull();
    h.users.clear();
    expect(await getCurrentUser()).toBeNull();
  });
  it('does not accept a legacy-format cookie in multi-user mode', async () => {
    h.jar.set(COOKIE, `${Date.now()}.${await hmac('legacy-pass', String(Date.now()))}`);
    expect(await getCurrentUser()).toBeNull();
  });
  it('never falls back to the dev secret in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_SESSION_SECRET', '');
    addUser('u1', 'admin');
    h.jar.set(COOKIE, await sessionFor('u1', Date.now(), 'dev-only-insecure-session-secret'));
    expect(await getCurrentUser()).toBeNull();
  });
});

describe('legacy (no DB) mode', () => {
  beforeEach(() => {
    h.dbConfigured = false;
  });
  it('login with the right password yields the synthetic admin', async () => {
    await expect(adminLogin({ error: null }, form({ password: 'legacy-pass' }))).rejects.toThrow('REDIRECT:/admin');
    expect(await getCurrentUser()).toMatchObject({ id: 'local-admin', role: 'admin' });
  });
  it('wrong password is rejected and sets no cookie', async () => {
    const r = await adminLogin({ error: null }, form({ password: 'nope' }));
    expect(r.error).toMatch(/Incorrect/);
    expect(h.jar.size).toBe(0);
  });
  it('rejects a forged or expired legacy cookie', async () => {
    h.jar.set(COOKIE, `${Date.now()}.forged`);
    expect(await getCurrentUser()).toBeNull();
    const old = Date.now() - 13 * 3600_000;
    h.jar.set(COOKIE, `${old}.${await hmac('legacy-pass', String(old))}`);
    expect(await getCurrentUser()).toBeNull();
  });
  it('throws in production when ADMIN_PASSWORD is unset instead of using the default', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ADMIN_PASSWORD', '');
    await expect(adminLogin({ error: null }, form({ password: 'changeme' }))).rejects.toThrow(/ADMIN_PASSWORD/);
  });
});

describe('adminLogin (multi-user)', () => {
  it('sets an httpOnly, sameSite=lax, 12h cookie (secure in production) and redirects', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    addUser('u1', 'editor');
    await expect(adminLogin({ error: null }, form({ email: ' U1@X.com ', password: 'pw' }))).rejects.toThrow('REDIRECT:/admin');
    expect(h.setCalls[0]).toMatchObject({
      name: COOKIE,
      opts: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 43200 },
    });
    expect(h.setCalls[0]!.value.startsWith('u1.')).toBe(true);
  });
  it('gives the same message for unknown email, wrong password and disabled user', async () => {
    addUser('u1', 'editor');
    addUser('u2', 'editor', { status: 'disabled' });
    const msgs = await Promise.all([
      adminLogin({ error: null }, form({ email: 'ghost@x.com', password: 'pw' })),
      adminLogin({ error: null }, form({ email: 'u1@x.com', password: 'bad' })),
      adminLogin({ error: null }, form({ email: 'u2@x.com', password: 'pw' })),
    ]);
    expect(new Set(msgs.map((m) => m.error)).size).toBe(1);
    expect(h.jar.size).toBe(0);
  });
  it('runs a password verification even for an unknown email (timing equalisation)', async () => {
    await adminLogin({ error: null }, form({ email: 'ghost@x.com', password: 'pw' }));
    expect(h.verify).toHaveBeenCalledTimes(1);
  });
  it('blocks when rate limited, before touching the password check', async () => {
    h.limit = { allowed: false, retryAfter: 60 };
    addUser('u1', 'editor');
    const r = await adminLogin({ error: null }, form({ email: 'u1@x.com', password: 'pw' }));
    expect(r.error).toMatch(/Too many/);
    expect(h.verify).not.toHaveBeenCalled();
  });
});

describe('requireRole / logout', () => {
  it('redirects signed-out visitors to login', async () => {
    await expect(requireRole(['admin'])).rejects.toThrow('REDIRECT:/admin/login');
  });
  it.each([
    ['admin', ['admin'], true],
    ['editor', ['admin'], false],
    ['centre_staff', ['admin'], false],
    ['editor', ['admin', 'editor'], true],
    ['centre_staff', ['admin', 'editor'], false],
    ['centre_staff', ['admin', 'editor', 'centre_staff'], true],
  ] as const)('%s vs %j -> allowed=%s', async (role, allowed, ok) => {
    addUser('u1', role);
    h.jar.set(COOKIE, await sessionFor('u1'));
    if (ok) await expect(requireRole([...allowed])).resolves.toMatchObject({ id: 'u1' });
    else await expect(requireRole([...allowed])).rejects.toThrow('REDIRECT:/admin');
  });
  it('an unknown role value in the DB is denied everywhere', async () => {
    addUser('u1', 'superuser');
    h.jar.set(COOKIE, await sessionFor('u1'));
    await expect(requireRole(['admin', 'editor', 'centre_staff'])).rejects.toThrow('REDIRECT');
  });
  it('logout clears the cookie', async () => {
    h.jar.set(COOKIE, 'x');
    await expect(adminLogout()).rejects.toThrow('REDIRECT:/admin/login');
    expect(h.jar.has(COOKIE)).toBe(false);
  });
});

describe('session revocation', () => {
  it('rejects a cookie issued before the session version was bumped', async () => {
    addUser('u1', 'editor', { sessionVersion: 2 });
    h.jar.set(COOKIE, await sessionFor('u1', Date.now(), SECRET, 1));
    expect(await getCurrentUser()).toBeNull();
    h.jar.set(COOKIE, await sessionFor('u1', Date.now(), SECRET, 2));
    expect((await getCurrentUser())?.id).toBe('u1');
  });

  it('cannot be defeated by editing the version in the cookie (it is signed)', async () => {
    addUser('u1', 'editor', { sessionVersion: 5 });
    const old = await sessionFor('u1', Date.now(), SECRET, 1);
    const [id, at, , sig] = old.split('.');
    h.jar.set(COOKIE, [id, at, '5', sig].join('.'));
    expect(await getCurrentUser()).toBeNull();
  });

  it('login issues a cookie at the current version', async () => {
    addUser('u1', 'editor', { sessionVersion: 4 });
    await expect(adminLogin({ error: null }, form({ email: 'u1@x.com', password: 'pw' }))).rejects.toThrow('REDIRECT:/admin');
    const value = h.setCalls[0]!.value;
    expect(value.split('.')[2]).toBe('4');
    expect((await getCurrentUser())?.id).toBe('u1');
  });

  it('logout revokes the cookie everywhere: a copy of it stops working', async () => {
    addUser('u1', 'editor');
    const stolen = await sessionFor('u1');
    h.jar.set(COOKIE, stolen);
    await expect(adminLogout()).rejects.toThrow('REDIRECT:/admin/login');
    h.jar.set(COOKIE, stolen); // an attacker replaying the copied cookie
    expect(await getCurrentUser()).toBeNull();
  });
});

describe('auth audit trail', () => {
  const calls = () => vi.mocked(recordAudit).mock.calls.map((c) => c[1]);
  beforeEach(() => vi.mocked(recordAudit).mockClear());

  it('records a successful sign-in', async () => {
    addUser('u1', 'editor');
    await expect(adminLogin({ error: null }, form({ email: 'u1@x.com', password: 'pw' }))).rejects.toThrow('REDIRECT:/admin');
    expect(calls()).toEqual(['auth.login']);
  });

  it('records failed sign-ins with the reason, without telling the visitor', async () => {
    addUser('u2', 'editor', { status: 'disabled' });
    addUser('u1', 'editor');
    await adminLogin({ error: null }, form({ email: 'ghost@x.com', password: 'pw' }));
    await adminLogin({ error: null }, form({ email: 'u1@x.com', password: 'bad' }));
    await adminLogin({ error: null }, form({ email: 'u2@x.com', password: 'pw' }));
    expect(calls()).toEqual(['auth.login_failed', 'auth.login_failed', 'auth.login_failed']);
    const summaries = vi.mocked(recordAudit).mock.calls.map((c) => c[4]);
    expect(summaries[0]).toContain('unknown email');
    expect(summaries[1]).toContain('wrong password');
    expect(summaries[2]).toContain('account disabled');
    // The password itself never reaches the log.
    expect(JSON.stringify(vi.mocked(recordAudit).mock.calls)).not.toContain('"bad"');
  });

  it('records sign-out', async () => {
    addUser('u1', 'editor');
    h.jar.set(COOKIE, await sessionFor('u1'));
    await expect(adminLogout()).rejects.toThrow('REDIRECT:/admin/login');
    expect(calls()).toEqual(['auth.logout']);
  });
});
