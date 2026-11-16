/// <reference lib="webworker" />
// Module worker that hosts Pyodide. Pyodide 314.x ships as an ES module, so
// this must be a module worker (classic importScripts workers are no longer
// supported). Loaded only when a run-code exercise is reached.
import SIM_PY from './epoch_sim.py?raw';
import { HARNESS_PY, installSim } from './harness';
import { PYODIDE_INDEX_URL } from './version';

type Msg = { type: 'init' } | { type: 'run'; id: number; code: string };

declare const self: DedicatedWorkerGlobalScope;

let py: any = null;
let ready: Promise<void> | null = null;

const post = (m: unknown) => self.postMessage(m);

async function init() {
  post({ type: 'stage', stage: 'Downloading Python' });
  const mod = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
  py = await mod.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  post({ type: 'stage', stage: 'Loading NumPy' });
  await py.loadPackage('numpy', { messageCallback: () => {} });
  installSim(py, SIM_PY);
  await py.runPythonAsync(HARNESS_PY);
  // Import once now so the learner's first Run is not slowed by it.
  await py.runPythonAsync('import numpy');
}

self.onmessage = async (e: MessageEvent<Msg>) => {
  const msg = e.data;
  if (msg.type === 'init') {
    ready ??= init();
    try {
      await ready;
      post({ type: 'ready' });
    } catch (err) {
      post({ type: 'failed', error: String(err) });
    }
    return;
  }
  if (msg.type === 'run') {
    try {
      await (ready ??= init());
      // Packages beyond NumPy (e.g. pydantic) load the first time code imports them,
      // then come from the service-worker cache.
      await py.loadPackagesFromImports(msg.code, { messageCallback: () => {} });
      py.globals.set('_EPOCH_SRC', msg.code);
      const out = await py.runPythonAsync('await _epoch_run_json(_EPOCH_SRC)');
      post({ type: 'result', id: msg.id, result: JSON.parse(out) });
    } catch (err) {
      post({ type: 'result', id: msg.id, result: { ok: false, type: 'InternalError', msg: String(err), stdout: '', line: null } });
    }
  }
};
