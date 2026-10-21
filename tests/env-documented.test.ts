import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every environment variable the code reads must be documented in `.env.production.example`, so what a deployment
 * can configure is always written down in one place (and a new setting cannot ship unannounced). When this fails:
 * add the variable to the template, with a comment saying what it does and whether it is required.
 */
const ROOT = process.cwd();

/** Provided by Node, Next.js or the host, not configured by us. */
const PLATFORM = new Set(['NODE_ENV', 'NEXT_PHASE', 'NEXT_RUNTIME', 'VERCEL', 'LOCALAPPDATA', 'CI']);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|mts|mjs)$/.test(entry) && !entry.endsWith('.d.ts')) out.push(path);
  }
  return out;
}

function envReads(): Map<string, string> {
  const found = new Map<string, string>();
  const files = [...walk(join(ROOT, 'src')), ...walk(join(ROOT, 'scripts')), join(ROOT, 'next.config.ts')];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) {
      const name = match[1]!;
      // A bare `NEXT_PUBLIC_` is a prefix mentioned in prose, not a variable.
      if (name === 'NEXT_PUBLIC_' || name.endsWith('_')) continue;
      if (!found.has(name)) found.set(name, file.slice(ROOT.length + 1).split('\\').join('/'));
    }
    // process.env[name] with a literal list, e.g. cspSources('CSP_SCRIPT_SRC')
    for (const match of text.matchAll(/(?:cspSources|envSources)\(\s*'([A-Z][A-Z0-9_]*)'/g)) {
      if (!found.has(match[1]!)) found.set(match[1]!, file.slice(ROOT.length + 1).split('\\').join('/'));
    }
  }
  return found;
}

describe('environment variables', () => {
  const template = readFileSync(join(ROOT, '.env.production.example'), 'utf8');
  const reads = envReads();

  it('every variable the code reads is documented in .env.production.example', () => {
    const missing = [...reads]
      .filter(([name]) => !PLATFORM.has(name))
      .filter(([name]) => !new RegExp(`(^|[^A-Z0-9_])${name}([^A-Z0-9_]|$)`).test(template))
      .map(([name, file]) => `${name}  (read in ${file})`)
      .sort();
    expect(missing, 'add these to .env.production.example').toEqual([]);
  });

  it('the template contains placeholders only, never a real-looking secret', () => {
    expect(template).not.toMatch(/sk-[A-Za-z0-9]{20,}/);
    expect(template).not.toMatch(/(?<![A-Za-z0-9])[0-9a-f]{40,}(?![A-Za-z0-9])/);
    expect(template).not.toMatch(/postgres:\/\/[^\s:]+:(?!PASSWORD)[^\s@]{6,}@/);
  });
});
