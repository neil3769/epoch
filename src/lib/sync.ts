import { useSyncExternalStore } from 'react';
import { dayKey } from './dates';
import { canonicalJson, getProgress, mergeIn, normalizeProgress, onLearnerChange, sameProgress, type Progress } from './progress';

/*
 * Optional sync between devices through a private GitHub repository the
 * learner owns, using the REST contents API directly from the browser.
 *
 * The token lives only in this device's localStorage under CONFIG_KEY. It is
 * never part of progress (so never exported or synced), never logged, and no
 * error message includes it: errors are fixed sentences chosen by status code.
 */

export interface SyncConfig {
  token: string;
  owner: string;
  repo: string;
  /** File in the repository holding the progress JSON. */
  path: string;
}

export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

const API = 'https://api.github.com';
const API_VERSION = '2026-03-10';
export const DEFAULT_PATH = 'progress.json';

export type SyncErrorKind = 'auth' | 'forbidden' | 'not-found' | 'public' | 'network' | 'conflict' | 'bad-file' | 'server';

const MESSAGES: Record<SyncErrorKind, string> = {
  auth: 'GitHub did not accept the token. It may have expired: create a new one and connect again.',
  forbidden: 'The token cannot write to this repository. Check it has "Contents: Read and write" for this repository.',
  'not-found': 'Repository not found. Check the name, and that the token was given access to this repository.',
  public: 'This repository is public. Make it private (Settings → General → Danger Zone → Change visibility) or use a private one.',
  network: 'Could not reach GitHub. Changes stay on this device and sync when you are back online.',
  conflict: 'Another device kept saving at the same moment. It will try again shortly.',
  'bad-file': 'The progress file in the repository is not readable. Delete it on GitHub and sync again to recreate it.',
  server: 'GitHub had a problem. It will try again later.',
};

export class SyncError extends Error {
  constructor(public kind: SyncErrorKind) {
    super(MESSAGES[kind]);
  }
}

const headers = (cfg: SyncConfig, json = false): HeadersInit => ({
  Authorization: `Bearer ${cfg.token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': API_VERSION,
  ...(json ? { 'Content-Type': 'application/json' } : {}),
});

const enc = (s: string) => encodeURIComponent(s);
const contentsUrl = (cfg: SyncConfig) => `${API}/repos/${enc(cfg.owner)}/${enc(cfg.repo)}/contents/${cfg.path.split('/').map(enc).join('/')}`;

function errorFor(status: number): SyncError {
  if (status === 401) return new SyncError('auth');
  if (status === 403) return new SyncError('forbidden');
  if (status === 404) return new SyncError('not-found');
  if (status === 409 || status === 422) return new SyncError('conflict');
  return new SyncError('server');
}

async function call(fetchFn: FetchFn, url: string, init: RequestInit): Promise<Response> {
  try {
    // no-store: a cached copy would carry a stale sha and every write would conflict.
    return await fetchFn(url, { ...init, cache: 'no-store' });
  } catch {
    throw new SyncError('network');
  }
}

export function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Check a new connection: the repository exists, the token can see it, and it is private. */
export async function checkRepo(cfg: SyncConfig, fetchFn: FetchFn): Promise<void> {
  const res = await call(fetchFn, `${API}/repos/${enc(cfg.owner)}/${enc(cfg.repo)}`, { headers: headers(cfg) });
  if (!res.ok) throw errorFor(res.status);
  const repo = (await res.json()) as { private?: boolean };
  if (repo.private !== true) throw new SyncError('public');
}

/** The progress file in the repository, or null if it does not exist yet. */
export async function readRemote(cfg: SyncConfig, fetchFn: FetchFn): Promise<{ progress: Progress; sha: string } | null> {
  const res = await call(fetchFn, contentsUrl(cfg), { headers: headers(cfg) });
  if (res.status === 404) return null;
  if (!res.ok) throw errorFor(res.status);
  const body = (await res.json()) as { content?: string; sha?: string; encoding?: string };
  if (!body.sha || typeof body.content !== 'string' || body.encoding === 'none') throw new SyncError('bad-file');
  try {
    return { progress: normalizeProgress(JSON.parse(fromBase64(body.content))), sha: body.sha };
  } catch {
    throw new SyncError('bad-file');
  }
}

/** Write progress. Returns false on a conflict (someone else wrote first). */
export async function writeRemote(cfg: SyncConfig, fetchFn: FetchFn, progress: Progress, sha?: string): Promise<boolean> {
  const res = await call(fetchFn, contentsUrl(cfg), {
    method: 'PUT',
    headers: headers(cfg, true),
    body: JSON.stringify({
      message: `Epoch progress, ${dayKey()}`,
      content: toBase64(canonicalJson(progress)),
      ...(sha ? { sha } : {}),
    }),
  });
  if (res.status === 409 || res.status === 422) return false;
  if (!res.ok) throw errorFor(res.status);
  return true;
}

/**
 * One full sync: pull, merge into local, push if the repository is behind.
 * On a conflict (the file changed between our read and write), pull, merge and retry.
 */
export async function syncOnce(
  cfg: SyncConfig,
  fetchFn: FetchFn,
  local: { get: () => Progress; merge: (p: Progress) => void },
  attempts = 4,
): Promise<'pulled' | 'pushed' | 'unchanged'> {
  let pulled = false;
  for (let i = 0; i < attempts; i++) {
    const remote = await readRemote(cfg, fetchFn);
    if (remote) {
      const before = local.get();
      local.merge(remote.progress);
      if (!sameProgress(before, local.get())) pulled = true;
      if (sameProgress(local.get(), remote.progress)) return pulled ? 'pulled' : 'unchanged';
    }
    if (await writeRemote(cfg, fetchFn, local.get(), remote?.sha)) return 'pushed';
  }
  throw new SyncError('conflict');
}

// ------------------------------------------------------------ app runtime ---

export const CONFIG_KEY = 'epoch.sync.v1';

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  message?: string;
  lastSynced?: string;
}

let syncState: SyncState = { status: 'off' };
const listeners = new Set<() => void>();
const setState = (s: SyncState) => {
  syncState = s;
  listeners.forEach((l) => l());
};

export const useSync = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => syncState,
  );

export function loadConfig(): SyncConfig | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<SyncConfig>;
    if (!c.token || !c.owner || !c.repo) return null;
    return { token: c.token, owner: c.owner, repo: c.repo, path: c.path || DEFAULT_PATH };
  } catch {
    return null;
  }
}

/** "owner/repo", or a github.com URL, -> parts. */
export function parseRepo(input: string): { owner: string; repo: string } | null {
  const s = input
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '');
  const m = s.match(/^([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}

/** Show only the start and the last four characters. */
export function maskToken(token: string): string {
  const prefix = token.startsWith('github_pat_') ? 'github_pat_' : token.slice(0, 4);
  return `${prefix}••••••••${token.slice(-4)}`;
}

const browserFetch: FetchFn = (url, init) => fetch(url, init);
const localStore = { get: getProgress, merge: (p: Progress) => void mergeIn(p) };

let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let dirty = false;

/** Sync now (or right after the sync already running). */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  const cfg = loadConfig();
  if (!cfg) {
    setState({ status: 'off' });
    return Promise.resolve();
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    setState({ ...syncState, status: 'offline', message: MESSAGES.network });
    return Promise.resolve();
  }
  setState({ ...syncState, status: 'syncing', message: undefined });
  dirty = false;
  running = syncOnce(cfg, browserFetch, localStore)
    .then(() => setState({ status: dirty ? 'syncing' : 'synced', lastSynced: new Date().toISOString() }))
    .catch((err: unknown) => {
      const e = err instanceof SyncError ? err : new SyncError('server');
      setState({ ...syncState, status: e.kind === 'network' ? 'offline' : 'error', message: e.message });
      // Passing problems retry by themselves; a bad token or repository waits for the learner.
      if (e.kind === 'conflict') schedule(5_000);
      if (e.kind === 'server' || e.kind === 'network') schedule(60_000);
    })
    .finally(() => {
      running = null;
      if (again) {
        again = false;
        void syncNow();
      }
    });
  return running;
}

/** Push changes a moment after the learner makes them, batching quick bursts. */
function schedule(delay = 2500) {
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

/** Validate and save a new connection, then sync. Throws SyncError with a readable message. */
export async function connect(token: string, repoInput: string): Promise<void> {
  const parsed = parseRepo(repoInput);
  if (!parsed) throw new Error('Enter the repository as owner/name, for example yourname/epoch-progress.');
  const cfg: SyncConfig = { token: token.trim(), ...parsed, path: DEFAULT_PATH };
  if (!/^[A-Za-z0-9_]+$/.test(cfg.token)) throw new Error('That does not look like a GitHub token. Copy it again from GitHub.');
  await checkRepo(cfg, browserFetch);
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  await syncNow();
}

/** Delete the token and settings from this device. Progress stays. */
export function disconnect() {
  clearTimeout(timer);
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch {
    /* nothing to remove */
  }
  setState({ status: 'off' });
}

let started = false;

/** Pull on open and on return to the foreground; push after changes; retry when back online. */
export function startSync() {
  if (started || typeof window === 'undefined') return;
  started = true;
  onLearnerChange(() => loadConfig() && schedule());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && loadConfig()) void syncNow();
  });
  window.addEventListener('online', () => loadConfig() && void syncNow());
  window.addEventListener('offline', () => loadConfig() && setState({ ...syncState, status: 'offline', message: MESSAGES.network }));
  if (loadConfig()) void syncNow();
}
