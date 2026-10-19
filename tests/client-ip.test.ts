import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientIpFromHeaders } from '@/lib/client-ip';

const h = (o: Record<string, string>) => new Headers(o);

afterEach(() => vi.unstubAllEnvs());

describe('clientIpFromHeaders', () => {
  it('trusts one proxy hop by default: the entry the proxy appended, not what the client sent first', () => {
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '9.9.9.9, 1.2.3.4' }))).toBe('1.2.3.4');
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '1.2.3.4' }))).toBe('1.2.3.4');
  });

  it('cannot be rotated by prefixing the header', () => {
    const a = clientIpFromHeaders(h({ 'x-forwarded-for': 'spoof-1, 1.2.3.4' }));
    const b = clientIpFromHeaders(h({ 'x-forwarded-for': 'spoof-2, 1.2.3.4' }));
    expect(a).toBe('1.2.3.4');
    expect(b).toBe(a);
  });

  it('honours TRUSTED_PROXY_HOPS for deployments with more than one proxy', () => {
    vi.stubEnv('TRUSTED_PROXY_HOPS', '2');
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '7.7.7.7, 1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
  });

  it('uses the leftmost entry when there are fewer entries than trusted hops', () => {
    vi.stubEnv('TRUSTED_PROXY_HOPS', '3');
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '1.2.3.4' }))).toBe('1.2.3.4');
  });

  it('ignores the header entirely when the app is reached directly (TRUSTED_PROXY_HOPS=0)', () => {
    vi.stubEnv('TRUSTED_PROXY_HOPS', '0');
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '5.6.7.8' }))).toBe('anonymous');
  });

  it('falls back to the default for an invalid TRUSTED_PROXY_HOPS', () => {
    vi.stubEnv('TRUSTED_PROXY_HOPS', 'lots');
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '9.9.9.9, 1.2.3.4' }))).toBe('1.2.3.4');
  });

  it('does not trust x-real-ip or cf-connecting-ip, which a caller can set when no proxy strips them', () => {
    expect(clientIpFromHeaders(h({ 'x-real-ip': '3.3.3.3' }))).toBe('anonymous');
    expect(clientIpFromHeaders(h({ 'cf-connecting-ip': '4.4.4.4' }))).toBe('anonymous');
  });

  it('on Vercel prefers the platform header, which the caller cannot supply', () => {
    vi.stubEnv('VERCEL', '1');
    expect(clientIpFromHeaders(h({ 'x-vercel-forwarded-for': '8.8.8.8', 'x-forwarded-for': 'spoof, 1.2.3.4' }))).toBe('8.8.8.8');
  });

  it('returns anonymous for missing or non-IP values, so a key is always safe to log', () => {
    expect(clientIpFromHeaders(h({}))).toBe('anonymous');
    expect(clientIpFromHeaders(h({ 'x-forwarded-for': '<script>alert(1)</script>' }))).toBe('anonymous');
  });
});
