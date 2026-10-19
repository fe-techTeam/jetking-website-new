import { describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

const dbMock = vi.hoisted(() => ({ db: null as unknown }));
vi.mock('@/lib/db/client', () => ({ getDb: () => dbMock.db, isDatabaseConfigured: () => !!dbMock.db }));

import { listAuditLog, recordAudit } from '@/lib/audit/log';

describe('password hashing', () => {
  it('round-trips, salts uniquely, and rejects wrong / malformed input', async () => {
    const a = await hashPassword('correct horse');
    const b = await hashPassword('correct horse');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^pbkdf2\$210000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    expect(await verifyPassword('correct horse', a)).toBe(true);
    expect(await verifyPassword('correct horsf', a)).toBe(false);
    for (const bad of ['', 'plain', 'pbkdf2$0$aa$bb', 'pbkdf2$x$aa$bb', 'bcrypt$1$aa$bb', 'pbkdf2$1000$$']) {
      expect(await verifyPassword('x', bad)).toBe(false);
    }
  });
});

describe('recordAudit', () => {
  it('no-ops without a database', async () => {
    dbMock.db = null;
    await expect(recordAudit({ id: 'u', name: 'U' }, 'cms.save', 'course', 'x', 's')).resolves.toBeUndefined();
  });
  it('writes the server-side actor and maps the legacy local-admin to a null id', async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    dbMock.db = { insert: () => ({ values }) };
    await recordAudit({ id: 'local-admin', name: 'Admin' }, 'cms.save', 'course', 'c1', 'Saved');
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ actorId: null, actorName: 'Admin', action: 'cms.save' }));
    const uuid = '11111111-1111-4111-8111-111111111111';
    await recordAudit({ id: uuid, name: 'Asha' }, 'team.invite', 'user', 'u2', 'Invited');
    expect(values).toHaveBeenLastCalledWith(expect.objectContaining({ actorId: uuid }));
    // A failed sign-in by someone with no account is recorded by name, with no actor id.
    await recordAudit({ id: 'anonymous', name: 'x@y.com' }, 'auth.login_failed', 'session', null, 'Failed');
    expect(values).toHaveBeenLastCalledWith(expect.objectContaining({ actorId: null, action: 'auth.login_failed' }));
  });
  it('never throws when the write fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    dbMock.db = { insert: () => ({ values: () => Promise.reject(new Error('down')) }) };
    await expect(recordAudit({ id: 'u', name: 'U' }, 'a.b', 't', null, 's')).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
  it('listAuditLog returns empty without a database', async () => {
    dbMock.db = null;
    expect(await listAuditLog({ group: 'team' })).toEqual({ entries: [], total: 0 });
  });
});
