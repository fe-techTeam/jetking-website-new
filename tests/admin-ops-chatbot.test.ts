import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ role: 'admin' as string | null, host: 'localhost:3000' as string | null, fetched: [] as string[] }));

vi.mock('next/headers', () => ({
  headers: async () => new Headers(state.host ? { host: state.host } : {}),
}));
vi.mock('@/lib/audit/log', () => ({ recordAudit: vi.fn(async () => undefined) }));
vi.mock('@/lib/chatbot/ops', () => ({ getBuildState: () => ({ canRun: false, running: false, log: '' }), startBuild: () => ({ ok: true }) }));
vi.mock('../src/app/(admin)/admin/actions', () => ({
  requireRole: async (allowed: string[]) => {
    if (!state.role) throw new Error('REDIRECT:/admin/login');
    if (!allowed.includes(state.role)) throw new Error('REDIRECT:/admin');
    return { id: 'u1', name: 'T', role: state.role };
  },
  requireAccess: async (section: string, level: 'view' | 'edit' = 'view') => {
    const { presetAccess, hasAccess } = await import('@/lib/auth/roles');
    if (!state.role) throw new Error('REDIRECT:/admin/login');
    const access = presetAccess(state.role as 'admin' | 'editor' | 'centre_staff');
    if (!hasAccess(access, section as 'content', level)) throw new Error('REDIRECT:/admin');
    return { id: 'u1', name: 'T', role: state.role, access, leadScope: state.role === 'centre_staff' ? 'centre' : 'all' };
  },
}));
vi.mock('@/lib/db/client', () => ({ getDb: () => null, isDatabaseConfigured: () => false }));

const a = await import('../src/app/(admin)/admin/chatbot/actions');

describe('chatbot admin actions role matrix', () => {
  beforeEach(() => {
    state.host = 'localhost:3000';
    state.fetched = [];
    vi.stubGlobal('fetch', async (url: string) => {
      state.fetched.push(url);
      return { json: async () => ({ ok: true, text: 'hi' }) };
    });
  });

  const editorCalls: Array<[string, () => Promise<unknown>]> = [
    ['rebuildKnowledge', () => a.rebuildKnowledge()],
    ['getBuild', () => a.getBuild()],
    ['askTestQuestion', () => a.askTestQuestion('hello')],
    ['listUnanswered', () => a.listUnanswered(false)],
    ['resolveUnanswered', () => a.resolveUnanswered('q')],
    ['listRecentChats', () => a.listRecentChats()],
    ['getUsage', () => a.getUsage(null)],
  ];
  for (const [name, fn] of editorCalls) {
    it(`${name}: admin/editor only`, async () => {
      state.role = null;
      await expect(fn()).rejects.toThrow('REDIRECT:/admin/login');
      for (const role of ['centre', 'viewer', 'counsellor']) {
        state.role = role;
        await expect(fn()).rejects.toThrow('REDIRECT:/admin');
      }
      for (const role of ['admin', 'editor']) {
        state.role = role;
        await expect(fn()).resolves.not.toThrow();
      }
    });
  }

  it('getChatTranscript (full transcripts) is admin only', async () => {
    state.role = 'editor';
    await expect(a.getChatTranscript('x')).rejects.toThrow('REDIRECT:/admin');
    state.role = 'admin';
    await expect(a.getChatTranscript('x')).resolves.toEqual([]);
  });

  it('askTestQuestion only calls the local /api/chat and refuses odd Host headers', async () => {
    state.role = 'admin';
    await a.askTestQuestion('hi');
    expect(state.fetched).toEqual(['http://localhost:3000/api/chat']);
    for (const host of ['evil.com/x', 'a@evil.com', 'evil.com#', null]) {
      state.host = host;
      state.fetched = [];
      const r = await a.askTestQuestion('hi');
      expect(r.ok).toBe(false);
      expect(state.fetched).toHaveLength(0);
    }
  });
});
