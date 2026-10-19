import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const SECRET = 'test-session-secret';
process.env.ADMIN_SESSION_SECRET = SECRET;

const h = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  users: {} as Record<string, { id: string; name: string; email: string; role: string; status: string; centreSlug: string | null }>,
  upsertRecord: vi.fn(async () => {}),
  deleteRecord: vi.fn(async () => {}),
  reset: vi.fn(async () => ({})),
  list: vi.fn(async () => [] as unknown[]),
  audit: vi.fn(async () => {}),
  revisions: [] as Array<{ id: string; collection: string; recordId: string; action: string; actorName: string; createdAt: Date; data: Record<string, unknown> }>,
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: (n: string) => (n === 'jk_admin_session' && h.cookie ? { value: h.cookie } : undefined), set: vi.fn(), delete: vi.fn() }),
  headers: async () => ({ get: () => null }),
}));
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth/users', () => ({
  isDatabaseConfigured: () => true,
  getUserById: async (id: string) => h.users[id],
  getUserByEmail: async () => undefined,
  touchLastActive: async () => {},
}));
vi.mock('@/lib/auth/password', () => ({ verifyPassword: async () => false }));
vi.mock('@/lib/audit/log', () => ({ recordAudit: h.audit }));
vi.mock('@/lib/cms/revisions', () => ({
  getRevision: async (id: string) => h.revisions.find((r) => r.id === id) ?? null,
  listDeleted: async () => [],
  listRevisions: async () => h.revisions,
}));
vi.mock('@/lib/cms/store', () => {
  class DuplicateIdError extends Error {}
  return {
    DuplicateIdError,
    upsertRecord: h.upsertRecord,
    deleteRecord: h.deleteRecord,
    resetCmsStoreFromFixtures: h.reset,
    listCollection: h.list,
  };
});

const actions = await import('@/app/(admin)/admin/actions');

function signIn(userId: string) {
  const issuedAt = Date.now();
  const sig = createHmac('sha256', SECRET).update(`${userId}.${issuedAt}.0`).digest('base64url');
  h.cookie = `${userId}.${issuedAt}.0.${sig}`;
}
const user = (id: string, role: string, status = 'active') => ({ id, name: id, email: `${id}@x.com`, role, status, centreSlug: null, sessionVersion: 0 });

const faq = { id: 'f1', question: 'q', answer: 'a', topic: 'fees', personaRelevance: {} };
const legal = { slug: 'privacy-policy', title: 'P', sourceUrl: '', blocks: [{ t: 'p', text: 'x' }] };

beforeEach(() => {
  vi.clearAllMocks();
  h.cookie = undefined;
  h.users = { adm: user('adm', 'admin'), edt: user('edt', 'editor'), cen: user('cen', 'centre_staff'), off: user('off', 'editor', 'disabled') };
  h.list.mockResolvedValue([]);
  h.revisions = [];
});

const asRole = (id: string) => signIn(id);

describe('role matrix', () => {
  it('signed out: every action redirects to login and writes nothing', async () => {
    await expect(actions.saveCollectionItem('faqs', 'id', JSON.stringify(faq))).rejects.toThrow('REDIRECT:/admin/login');
    await expect(actions.removeCollectionItem('faqs', 'id', 'f1')).rejects.toThrow('REDIRECT:/admin/login');
    await expect(actions.seedCmsFromFixtures()).rejects.toThrow('REDIRECT:/admin/login');
    await expect(actions.getAdminCollection('faqs')).rejects.toThrow('REDIRECT:/admin/login');
    await expect(actions.getRecordHistory('faqs', 'f1')).rejects.toThrow('REDIRECT:/admin/login');
    await expect(actions.getRevisionRecord('faqs', 'r')).rejects.toThrow('REDIRECT:/admin/login');
    await expect(actions.setRecordStatus('faqs', 'id', 'f1', 'draft')).rejects.toThrow('REDIRECT:/admin/login');
    expect(h.upsertRecord).not.toHaveBeenCalled();
    expect(h.deleteRecord).not.toHaveBeenCalled();
    expect(h.reset).not.toHaveBeenCalled();
  });

  it('a forged / tampered / disabled-user cookie is not a session', async () => {
    h.cookie = `adm.${Date.now()}.AAAA`;
    await expect(actions.getAdminCollection('faqs')).rejects.toThrow('REDIRECT:/admin/login');
    asRole('off');
    await expect(actions.getAdminCollection('faqs')).rejects.toThrow('REDIRECT:/admin/login');
    asRole('ghost');
    await expect(actions.getAdminCollection('faqs')).rejects.toThrow('REDIRECT:/admin/login');
  });

  it('centre_staff cannot touch any CMS collection', async () => {
    asRole('cen');
    for (const c of ['faqs', 'courses', 'legal_documents', 'seo_settings'] as const) {
      await expect(actions.getAdminCollection(c)).rejects.toThrow('REDIRECT:/admin');
      await expect(actions.removeCollectionItem(c, c === 'legal_documents' ? 'slug' : 'id', 'x')).rejects.toThrow('REDIRECT:/admin');
      await expect(actions.getRecordHistory(c, 'x')).rejects.toThrow('REDIRECT:/admin');
      await expect(actions.getDeletedRecords(c, 'id')).rejects.toThrow('REDIRECT:/admin');
      await expect(actions.getRevisionRecord(c, 'r')).rejects.toThrow('REDIRECT:/admin');
    }
    await expect(actions.saveCollectionItem('faqs', 'id', JSON.stringify(faq))).rejects.toThrow('REDIRECT:/admin');
    await expect(actions.setRecordStatus('faqs', 'id', 'f1', 'draft')).rejects.toThrow('REDIRECT:/admin');
    await expect(actions.seedCmsFromFixtures()).rejects.toThrow('REDIRECT:/admin');
    expect(h.upsertRecord).not.toHaveBeenCalled();
    expect(h.deleteRecord).not.toHaveBeenCalled();
  });

  it('editor may edit ordinary collections but not the admin-only ones (legal, investors)', async () => {
    asRole('edt');
    expect(await actions.saveCollectionItem('faqs', 'id', JSON.stringify(faq))).toEqual({ ok: true });
    await expect(actions.saveCollectionItem('legal_documents', 'slug', JSON.stringify(legal))).rejects.toThrow('REDIRECT:/admin');
    await expect(actions.removeCollectionItem('legal_documents', 'slug', 'privacy-policy')).rejects.toThrow('REDIRECT:/admin');
    await expect(actions.getAdminCollection('investors_page')).rejects.toThrow('REDIRECT:/admin');
    await expect(actions.getRecordHistory('legal_documents', 'privacy-policy')).rejects.toThrow('REDIRECT:/admin');
    await expect(actions.setRecordStatus('legal_documents', 'slug', 'privacy-policy', 'draft')).rejects.toThrow('REDIRECT:/admin');
    expect(h.upsertRecord).toHaveBeenCalledTimes(1);
  });

  it('admin may edit the admin-only collections', async () => {
    asRole('adm');
    expect(await actions.saveCollectionItem('legal_documents', 'slug', JSON.stringify(legal))).toEqual({ ok: true });
    expect(h.upsertRecord).toHaveBeenCalledTimes(1);
  });

  it('reset from fixtures is admin only (an editor could otherwise wipe the admin-only legal pages)', async () => {
    asRole('edt');
    await expect(actions.seedCmsFromFixtures()).rejects.toThrow('REDIRECT:/admin');
    expect(h.reset).not.toHaveBeenCalled();
    asRole('adm');
    await actions.seedCmsFromFixtures();
    expect(h.reset).toHaveBeenCalledTimes(1);
    expect(h.audit).toHaveBeenCalledWith(expect.objectContaining({ id: 'adm' }), 'cms.reset_fixtures', 'cms', null, expect.any(String));
  });

  it('an unknown collection name is refused before anything runs', async () => {
    asRole('adm');
    await expect(actions.saveCollectionItem('__proto__' as never, 'id', '{}')).rejects.toThrow(/Unknown collection/);
    await expect(actions.removeCollectionItem('users' as never, 'id', 'x')).rejects.toThrow(/Unknown collection/);
    await expect(actions.getAdminCollection('constructor' as never)).rejects.toThrow(/Unknown collection/);
  });
});

describe('saveCollectionItem input handling', () => {
  beforeEach(() => asRole('adm'));
  const save = (json: unknown, idKey = 'id', collection: 'faqs' | 'posts' | 'announcements' = 'faqs', prev?: string) =>
    actions.saveCollectionItem(collection, idKey, typeof json === 'string' ? json : JSON.stringify(json), prev);

  it('rejects a client-chosen idKey that is not the collection\'s id field', async () => {
    const r = await save(faq, 'status');
    expect(r.ok).toBe(false);
    expect(h.upsertRecord).not.toHaveBeenCalled();
  });
  it('rejects non-object JSON, bad JSON and oversize payloads without writing', async () => {
    for (const bad of ['null', '[]', '"x"', '5', '{not json']) expect((await save(bad)).ok, bad).toBe(false);
    expect((await save('{"id":"a","pad":"' + 'x'.repeat(2_100_000) + '"}')).ok).toBe(false);
    expect(h.upsertRecord).not.toHaveBeenCalled();
  });
  it('rejects hostile ids (path, markup, non-string, object)', async () => {
    for (const id of ['../etc', 'a/b', '<img>', 'a b', 5, { a: 1 }, ['x']]) {
      expect((await save({ ...faq, id })).ok, JSON.stringify(id)).toBe(false);
    }
    expect((await save(faq, 'id', 'faqs', '../x')).ok).toBe(false);
    expect(h.upsertRecord).not.toHaveBeenCalled();
  });
  it('rejects a schema-invalid record and surfaces the path', async () => {
    const r = await save({ ...faq, topic: 'nope' });
    expect(r).toMatchObject({ ok: false });
    expect((r as { error: string }).error).toMatch(/topic/);
  });
  it('rejects javascript: links and prototype keys even though the schema would strip them', async () => {
    const ann = { id: 'a', message: 'm', linkLabel: 'go', linkHref: 'javascript:alert(1)', tone: 'info', startsAt: '', endsAt: '', dismissible: true };
    expect((await save(ann, 'id', 'announcements')).ok).toBe(false);
    expect((await save('{"id":"f1","question":"q","answer":"a","topic":"fees","personaRelevance":{},"__proto__":{"x":1}}')).ok).toBe(false);
    expect(h.upsertRecord).not.toHaveBeenCalled();
  });
  it('sanitises rich FAQ answers before storing, and defaults status to published', async () => {
    const r = await save({ ...faq, answer: '<p>ok</p><script>alert(1)</script><a href="javascript:x">l</a>' });
    expect(r).toEqual({ ok: true });
    const stored = (h.upsertRecord.mock.calls as unknown as unknown[][])[0]![1] as Record<string, unknown>;
    expect(String(stored.answer)).not.toMatch(/script|javascript:/);
    expect(stored.status).toBe('published');
  });
  it('post: sanitises bodyHtml and derives the plain body from it', async () => {
    const post = {
      slug: 'p1', title: 't', excerpt: 'e', body: [], author: 'a', publishedAt: '2026-01-01', updatedAt: '2026-01-01',
      category: 'c', tags: [], personaRelevance: {}, seo: { title: 't', description: 'd' },
      bodyHtml: '<h2>Head</h2><p onclick="x()">Para</p><script>1</script>',
    };
    expect((await save(post, 'slug', 'posts')).ok).toBe(true);
    const stored = (h.upsertRecord.mock.calls as unknown as unknown[][])[0]![1] as Record<string, unknown>;
    expect(String(stored.bodyHtml)).not.toMatch(/script|onclick/);
    expect(stored.body).toEqual([{ type: 'heading', level: 2, text: 'Head' }, { type: 'paragraph', text: 'Para' }]);
  });
  it('passes the actor and previous id through and audits the write', async () => {
    await save(faq, 'id', 'faqs', 'f1');
    expect(h.upsertRecord).toHaveBeenCalledWith('faqs', expect.objectContaining({ id: 'f1' }), 'id', 'f1', 'adm');
    expect(h.audit).toHaveBeenCalledWith(expect.objectContaining({ id: 'adm' }), 'cms.save', 'faqs', 'f1', expect.stringContaining('Updated'));
  });
  it('a duplicate id comes back as an error, not a throw', async () => {
    const { DuplicateIdError } = await import('@/lib/cms/store');
    h.upsertRecord.mockRejectedValueOnce(new DuplicateIdError('dup'));
    expect((await save(faq)).ok).toBe(false);
  });
});

describe('remove / status / history', () => {
  beforeEach(() => asRole('adm'));
  it('remove refuses a client-chosen idKey (would match unrelated rows) and audits a real delete', async () => {
    await expect(actions.removeCollectionItem('faqs', 'status', 'published')).rejects.toThrow(/Invalid id field/);
    expect(h.deleteRecord).not.toHaveBeenCalled();
    await actions.removeCollectionItem('faqs', 'id', 'f1');
    expect(h.deleteRecord).toHaveBeenCalledWith('faqs', 'id', 'f1', 'adm');
    expect(h.audit).toHaveBeenCalledWith(expect.anything(), 'cms.delete', 'faqs', 'f1', expect.any(String));
  });
  it('setRecordStatus validates the status and idKey', async () => {
    h.list.mockResolvedValue([{ ...faq, status: 'published' }]);
    expect((await actions.setRecordStatus('faqs', 'id', 'f1', 'bogus' as never)).ok).toBe(false);
    expect((await actions.setRecordStatus('faqs', 'status', 'published', 'draft')).ok).toBe(false);
    expect((await actions.setRecordStatus('faqs', 'id', 'missing', 'draft')).ok).toBe(false);
    expect(await actions.setRecordStatus('faqs', 'id', 'f1', 'draft')).toEqual({ ok: true });
    expect(h.upsertRecord).toHaveBeenCalledWith('faqs', expect.objectContaining({ id: 'f1', status: 'draft' }), 'id', 'f1', 'adm');
  });
  it('a revision from another collection cannot be read through a permitted one', async () => {
    h.revisions = [{ id: 'r1', collection: 'legal_documents', recordId: 'privacy-policy', action: 'save', actorName: 'x', createdAt: new Date(), data: { secret: 1 } }];
    asRole('edt');
    expect(await actions.getRevisionRecord('faqs', 'r1')).toMatchObject({ ok: false });
    await expect(actions.getRevisionRecord('legal_documents', 'r1')).rejects.toThrow('REDIRECT:/admin');
  });
});
