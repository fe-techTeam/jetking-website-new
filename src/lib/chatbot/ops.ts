import 'server-only';
import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { serverEnv } from '@/lib/config/env.server';

/**
 * Chatbot operations behind the admin's Chatbot overview: how big and how fresh the knowledge index is,
 * and rebuilding it. The index is a file the assistant reads at run time, so a rebuild needs a machine
 * that can run the build (a self-hosted server or a developer laptop) — not a serverless function.
 */

const ROOT = process.cwd();
const CORPUS = path.join(ROOT, 'src', 'content', 'website-corpus.json');
const EMBEDDINGS = path.join(ROOT, 'src', 'content', 'jetking-embeddings.json');
const LOG = path.join(ROOT, 'data', 'chatbot-build.log');
const LOCK = path.join(ROOT, 'data', 'chatbot-build.lock');

export interface IndexStatus {
  builtAt: string | null;
  passages: number;
  byType: Record<string, number>;
  corpusItems: number;
  sizeMb: number;
  embedModel: string;
  answerGate: number;
  generalAnswers: boolean;
  ollamaUrl: string;
}

let corpusCache: { mtimeMs: number; items: number; byType: Record<string, number> } | null = null;

export function getIndexStatus(): IndexStatus {
  let builtAt: string | null = null;
  let sizeMb = 0;
  try {
    const stat = statSync(EMBEDDINGS);
    builtAt = stat.mtime.toISOString();
    sizeMb = Math.round((stat.size / 1024 / 1024) * 10) / 10;
  } catch {
    /* no index yet */
  }

  let items = 0;
  let byType: Record<string, number> = {};
  try {
    const { mtimeMs } = statSync(CORPUS);
    if (!corpusCache || corpusCache.mtimeMs !== mtimeMs) {
      const parsed = JSON.parse(readFileSync(CORPUS, 'utf8')) as { items?: Array<{ type: string }> };
      const counts: Record<string, number> = {};
      for (const i of parsed.items ?? []) counts[i.type] = (counts[i.type] ?? 0) + 1;
      corpusCache = { mtimeMs, items: parsed.items?.length ?? 0, byType: counts };
    }
    items = corpusCache.items;
    byType = corpusCache.byType;
  } catch {
    /* no corpus yet */
  }

  // The embeddings file's first bytes carry the item count cheaply: read only the header of the JSON.
  let passages = 0;
  try {
    const fd = openSync(EMBEDDINGS, 'r');
    const buf = Buffer.alloc(400);
    readSync(fd, buf, 0, 400, 0);
    closeSync(fd);
    passages = Number(/"count"\s*:\s*(\d+)/.exec(buf.toString('utf8'))?.[1] ?? 0);
  } catch {
    /* ignore */
  }

  return {
    builtAt,
    passages: passages || items,
    byType,
    corpusItems: items,
    sizeMb,
    embedModel: serverEnv.embedModel,
    answerGate: serverEnv.answerGate,
    generalAnswers: serverEnv.allowGeneralAnswers,
    ollamaUrl: serverEnv.ollamaBaseUrl,
  };
}

/** Probes the local language model host. Answers work without it (retrieval-only), so this is information, not an error. */
export async function probeOllama(): Promise<{ up: boolean; models: string[] }> {
  try {
    const res = await fetch(`${serverEnv.ollamaBaseUrl}/api/tags`, { signal: AbortSignal.timeout(1500), cache: 'no-store' });
    if (!res.ok) return { up: false, models: [] };
    const json = (await res.json()) as { models?: Array<{ name: string }> };
    return { up: true, models: (json.models ?? []).map((m) => m.name) };
  } catch {
    return { up: false, models: [] };
  }
}

export interface BuildState {
  /** Where this deployment can run a rebuild from. */
  canRun: boolean;
  reason?: string;
  running: boolean;
  startedAt?: string;
  log: string;
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function getBuildState(): BuildState {
  const canRun = !process.env.VERCEL && process.env.NODE_ENV !== 'test';
  let running = false;
  let startedAt: string | undefined;
  if (existsSync(LOCK)) {
    try {
      const lock = JSON.parse(readFileSync(LOCK, 'utf8')) as { pid: number; startedAt: string };
      if (pidAlive(lock.pid)) {
        running = true;
        startedAt = lock.startedAt;
      } else unlinkSync(LOCK);
    } catch {
      /* stale lock */
    }
  }
  let log = '';
  try {
    log = readFileSync(LOG, 'utf8').split('\n').slice(-40).join('\n');
  } catch {
    /* no log yet */
  }
  return {
    canRun,
    reason: canRun ? undefined : 'This deployment cannot run the build. Run `npm run build:chatbot-index` on a machine with the repository, then deploy the regenerated files.',
    running,
    startedAt,
    log,
  };
}

/** Starts `npm run build:chatbot-index` in the background (export from the CMS, then embed). One at a time. */
export function startBuild(): { ok: true } | { ok: false; error: string } {
  const state = getBuildState();
  if (!state.canRun) return { ok: false, error: state.reason ?? 'Not available here.' };
  if (state.running) return { ok: false, error: 'A rebuild is already running.' };
  mkdirSync(path.dirname(LOG), { recursive: true });
  const out = openSync(LOG, 'w');
  const child = spawn('npm', ['run', 'build:chatbot-index'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env },
  });
  child.unref();
  writeFileSync(LOCK, JSON.stringify({ pid: child.pid, startedAt: new Date().toISOString() }));
  return { ok: true };
}
