/*
 * Neurons and layers, for the neuron figure. A layer is W (one row per
 * neuron) times the input x, plus b, then an activation. The verifier uses
 * the same functions to check that a figure's goal can be reached.
 */

export type Act = 'relu' | 'sigmoid' | 'none';

export interface NeuronSpec {
  x: number[];
  W: number[][];
  b?: number[];
  act?: Act;
  editable?: [number, number][];
  step?: number;
  goal?: { tap: number } | { neuron: number; output: number };
}

/** Each editable weight can move this many steps either way. */
export const EDIT_RANGE = 6;

const clean = (v: number) => Math.round(v * 1e9) / 1e9;

export const activate = (act: Act, z: number) => (act === 'relu' ? Math.max(0, z) : act === 'sigmoid' ? 1 / (1 + Math.exp(-z)) : z);

/** Weighted sum for neuron i: W[i] · x + b[i]. */
export const preact = (s: NeuronSpec, W: number[][], i: number) => clean(W[i].reduce((t, w, j) => t + w * s.x[j], 0) + (s.b?.[i] ?? 0));

export const outputs = (s: NeuronSpec, W: number[][]) => W.map((_, i) => clean(activate(s.act ?? 'relu', preact(s, W, i))));

export function outputGoalMet(s: NeuronSpec, W: number[][]): boolean {
  const g = s.goal;
  if (!g || !('neuron' in g)) return false;
  return Math.abs(outputs(s, W)[g.neuron] - g.output) < 1e-9;
}

/** Every weight matrix the learner can reach by moving the editable weights. */
export function* reachableWeights(s: NeuronSpec): Generator<number[][]> {
  const cells = s.editable ?? [];
  const step = s.step ?? 1;
  const ks = cells.map(() => -EDIT_RANGE);
  for (;;) {
    const W = s.W.map((r) => [...r]);
    cells.forEach(([i, j], n) => (W[i][j] = clean(s.W[i][j] + ks[n] * step)));
    yield W;
    let n = 0;
    while (n < ks.length && ks[n] === EDIT_RANGE) ks[n++] = -EDIT_RANGE;
    if (n === ks.length) return;
    ks[n]++;
  }
}

export function neuronGoalReachable(s: NeuronSpec): boolean {
  for (const W of reachableWeights(s)) if (outputGoalMet(s, W)) return true;
  return false;
}
