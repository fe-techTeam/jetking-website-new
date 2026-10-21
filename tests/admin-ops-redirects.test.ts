import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findRedirectLoop, validateRedirect } from '@/lib/redirects/validate';

describe('validateRedirect', () => {
  const ok = (s: string, d: string) => validateRedirect(s, d).ok;

  it('accepts normal path and https rules', () => {
    expect(ok('/old', '/courses')).toBe(true);
    expect(ok('/old', 'https://example.com/x?y=1')).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>',
    '//evil.com',
    '/\\evil.com',
    '/\t/evil.com',
    '/\n/evil.com',
    'http://evil.com',
    'https://',
    'https:///evil',
    'evil.com',
    '/ has space',
    '',
  ])('rejects dangerous destination %j', (d) => {
    expect(ok('/old', d)).toBe(false);
  });

  it('rejects bad sources and reserved paths in any case', () => {
    for (const s of ['old', '//old', '/a b', '/a?x=1', '/a#x', '/a\\b', '/admin', '/Admin/leads', '/api/chat', '/_next/x', '/media/a.png', '']) {
      expect(ok(s, '/x')).toBe(false);
    }
  });

  it('rejects self redirects (case / trailing slash insensitive) and overlong urls', () => {
    expect(ok('/a', '/A/')).toBe(false);
    expect(ok('/a', '/' + 'x'.repeat(600))).toBe(false);
  });

  it('survives non-string input without throwing', () => {
    expect(validateRedirect(undefined as never, null as never).ok).toBe(false);
  });
});

describe('findRedirectLoop', () => {
  it('detects direct and multi-hop loops', () => {
    expect(findRedirectLoop([{ source: '/b', destination: '/a' }], '/a', '/b')).toBeTruthy();
    const rules = [
      { source: '/b', destination: '/c' },
      { source: '/c', destination: '/a' },
    ];
    expect(findRedirectLoop(rules, '/a', '/b')).toBeTruthy();
  });
  it('allows chains that end', () => {
    expect(findRedirectLoop([{ source: '/b', destination: '/c' }], '/a', '/b')).toBeNull();
  });
  it('terminates on a pre-existing loop elsewhere', () => {
    const rules = [
      { source: '/x', destination: '/y' },
      { source: '/y', destination: '/x' },
    ];
    expect(findRedirectLoop(rules, '/a', '/x')).toBeNull();
  });
});

/* Server actions: role matrix + behaviour with a mocked DB */

const state = vi.hoisted(() => ({ role: 'admin' as string | null, rows: [] as Array<Record<string, unknown>>, inserted: [] as unknown[] }));

vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock('next/headers', () => ({ headers: async () => new Headers({ host: 'localhost:3000' }), cookies: async () => ({ get: () => undefined }) }));
vi.mock('@/lib/audit/log', () => ({ recordAudit: vi.fn(async () => undefined) }));
vi.mock('../src/app/(admin)/admin/actions', () => ({
  requireRole: async (allowed: string[]) => {
    if (!state.role) throw new Error('REDIRECT:/admin/login');
    if (!allowed.includes(state.role)) throw new Error('REDIRECT:/admin');
    return { id: 'u1', name: 'Tester', role: state.role };
  },
  requireAccess: async (section: string, level: 'view' | 'edit' = 'view') => {
    const { presetAccess, hasAccess } = await import('@/lib/auth/roles');
    if (!state.role) throw new Error('REDIRECT:/admin/login');
    const access = presetAccess(state.role as 'admin' | 'editor' | 'centre_staff');
    if (!hasAccess(access, section as 'content', level)) throw new Error('REDIRECT:/admin');
    return { id: 'u1', name: 'Tester', role: state.role, access, leadScope: state.role === 'centre_staff' ? 'centre' : 'all' };
  },
}));
vi.mock('@/lib/db/client', () => {
  const chain = (result: () => unknown) => {
    const c: Record<string, unknown> = {};
    for (const m of ['from', 'where', 'orderBy', 'limit', 'set', 'values', 'returning']) c[m] = () => c;
    c.then = (res: (v: unknown) => unknown) => res(result());
    return c;
  };
  const db = {
    select: () => chain(() => state.rows.map((r) => ({ s: r.source, ...r }))),
    insert: () => ({
      values: (v: unknown) => {
        state.inserted.push(v);
        return chain(() => [{ id: 'new', createdAt: new Date(), note: '', createdBy: 'Tester', permanent: true, ...(v as object) }]);
      },
    }),
    update: () => chain(() => []),
    delete: () => chain(() => []),
  };
  return { getDb: () => db, isDatabaseConfigured: () => true };
});

const actions = await import('../src/app/(admin)/admin/redirects/actions');

describe('redirect actions role matrix', () => {
  beforeEach(() => {
    state.rows = [];
    state.inserted = [];
  });
  const calls: Array<[string, () => Promise<unknown>]> = [
    ['listRedirects', () => actions.listRedirects()],
    ['saveRedirect', () => actions.saveRedirect({ source: '/a', destination: '/b', permanent: true, note: '' })],
    ['removeRedirect', () => actions.removeRedirect('x')],
    ['importRedirects', () => actions.importRedirects('/a,/b')],
  ];
  for (const [name, fn] of calls) {
    it(`${name}: signed out -> login, other roles -> dashboard`, async () => {
      state.role = null;
      await expect(fn()).rejects.toThrow('REDIRECT:/admin/login');
      for (const role of ['centre', 'viewer', 'counsellor']) {
        state.role = role;
        await expect(fn()).rejects.toThrow('REDIRECT:/admin');
      }
    });
    it(`${name}: admin and editor allowed`, async () => {
      for (const role of ['admin', 'editor']) {
        state.role = role;
        await expect(fn()).resolves.not.toThrow();
      }
    });
  }

  it('saveRedirect refuses a multi-hop loop and an open-redirect destination', async () => {
    state.role = 'admin';
    state.rows = [
      { id: '1', source: '/b', destination: '/c' },
      { id: '2', source: '/c', destination: '/a' },
    ];
    const loop = await actions.saveRedirect({ source: '/a', destination: '/b', permanent: true, note: '' });
    expect(loop.ok).toBe(false);
    state.rows = [];
    expect((await actions.saveRedirect({ source: '/a', destination: '/\\evil.com', permanent: true, note: '' })).ok).toBe(false);
    expect(state.inserted).toHaveLength(0);
  });

  it('importRedirects skips hostile, reserved, duplicate and looping lines', async () => {
    state.role = 'editor';
    state.rows = [{ s: '/exists', source: '/exists', destination: '/z' }];
    const r = await actions.importRedirects(
      ['/ok,/fine', '/x,javascript:alert(1)', '/admin,/y', '/exists,/q', '/fine,/ok', '/t -> //evil.com'].join('\n'),
    );
    expect(r.added).toBe(1);
    expect(r.skipped).toHaveLength(5);
    expect(state.inserted).toHaveLength(1);
  });
});
