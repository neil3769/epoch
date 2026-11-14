import { useSyncExternalStore } from 'react';

/*
 * Lazy Python runtime. Nothing is downloaded until a run-code exercise calls
 * ensurePython(). Runs happen in a Web Worker; a run that exceeds its time
 * limit terminates the worker, so an infinite loop cannot freeze the app.
 */

export type PyStatus = 'idle' | 'loading' | 'ready' | 'failed';

export interface PyState {
  status: PyStatus;
  stage: string;
  error?: string;
}

export interface RunResult {
  ok: boolean;
  stdout: string;
  type: string | null;
  msg: string | null;
  line: number | null;
  timedOut?: boolean;
}

const LOAD_TIMEOUT_MS = 180_000;
const RUN_TIMEOUT_MS = 8_000;

let state: PyState = { status: 'idle', stage: '' };
const listeners = new Set<() => void>();
const set = (s: Partial<PyState>) => {
  state = { ...state, ...s };
  listeners.forEach((l) => l());
};

export const usePython = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );

let worker: Worker | null = null;
let readyPromise: Promise<boolean> | null = null;
let nextId = 1;
const pending = new Map<number, (r: RunResult) => void>();

function spawn(): Worker {
  const w = new Worker(new URL('../python/py.worker.ts', import.meta.url), { type: 'module' });
  w.onmessage = (e) => {
    const m = e.data;
    if (m.type === 'stage') set({ stage: m.stage });
    if (m.type === 'result') {
      pending.get(m.id)?.(m.result);
      pending.delete(m.id);
    }
  };
  return w;
}

/**
 * On the very first visit the service worker may not control the page yet,
 * and a worker started now would bypass it, so Python would not be cached
 * for offline use. Wait (briefly) for control first.
 */
function swControl(timeoutMs = 4000): Promise<void> {
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
  if (!sw || sw.controller) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    sw.addEventListener('controllerchange', done, { once: true });
    setTimeout(done, timeoutMs);
  });
}

/** Start (or reuse) the Python runtime. Resolves false if it cannot load. */
export function ensurePython(): Promise<boolean> {
  if (readyPromise) return readyPromise;
  set({ status: 'loading', stage: 'Starting', error: undefined });
  readyPromise = swControl().then(() => startWorker());
  return readyPromise;
}

function startWorker(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let w: Worker;
    try {
      w = spawn();
    } catch (err) {
      set({ status: 'failed', error: String(err) });
      resolve(false);
      return;
    }
    worker = w;
    const timer = setTimeout(() => finish(false, 'Timed out while downloading Python'), LOAD_TIMEOUT_MS);
    const finish = (ok: boolean, error?: string) => {
      clearTimeout(timer);
      w.removeEventListener('message', onMsg);
      if (!ok) {
        w.terminate();
        worker = null;
        readyPromise = null;
      }
      set({ status: ok ? 'ready' : 'failed', error });
      resolve(ok);
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data.type === 'ready') finish(true);
      if (e.data.type === 'failed') finish(false, e.data.error);
    };
    w.addEventListener('message', onMsg);
    w.addEventListener('error', (e) => finish(false, e.message || 'Worker failed to start'));
    w.postMessage({ type: 'init' });
  });
}

/** Run Python source. Resolves with a timed-out result if it runs too long. */
export async function runPython(code: string, timeoutMs = RUN_TIMEOUT_MS): Promise<RunResult | null> {
  const ok = await ensurePython();
  if (!ok || !worker) return null;
  const w = worker;
  const id = nextId++;
  return new Promise<RunResult>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      // Kill the stuck interpreter; the next run starts a fresh one (from cache).
      w.terminate();
      worker = null;
      readyPromise = null;
      set({ status: 'idle', stage: '' });
      resolve({ ok: false, stdout: '', type: 'Timeout', msg: null, line: null, timedOut: true });
    }, timeoutMs);
    pending.set(id, (r) => {
      clearTimeout(timer);
      resolve(r);
    });
    w.postMessage({ type: 'run', id, code });
  });
}
