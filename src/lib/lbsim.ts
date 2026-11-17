/*
 * The load-balancer figure's simulation, shared with the content verifier.
 * Requests arrive one per tick; each keeps its server busy for `cost` ticks.
 * The balancer picks among all servers, or only healthy ones when health
 * checks are on; a request sent to a down server fails.
 */

export type LbAlgo = 'round-robin' | 'least-conn' | 'hash';

export interface LbSpecLike {
  servers: number;
  requests: { user: string; cost: number }[];
  algorithm: LbAlgo;
  algorithms?: LbAlgo[];
  down?: number[];
  killable?: boolean;
  health?: boolean;
  toggleHealth?: boolean;
  goal?: { sticky: true } | { maxPeak: number } | { noFailures: true };
}

export interface LbState {
  algorithm: LbAlgo;
  down: number[];
  health: boolean;
}

export interface LbResult {
  /** Server each request went to. */
  assign: number[];
  failed: boolean[];
  /** Most requests each server held at once. */
  peak: number[];
  /** Users whose requests landed on more than one server. */
  split: string[];
}

export const LB_NAMES: Record<LbAlgo, string> = {
  'round-robin': 'Round robin',
  'least-conn': 'Least connections',
  hash: 'Hash user',
};

/** A small stable hash of a user name (sum of character codes). */
export const userHash = (u: string) => [...u].reduce((a, c) => a + c.charCodeAt(0), 0);

export function simulateLb(spec: LbSpecLike, st: LbState): LbResult {
  const n = spec.servers;
  const down = new Set(st.down);
  const busy: number[][] = Array.from({ length: n }, () => []); // end times
  const peak = Array(n).fill(0);
  const assign: number[] = [];
  const failed: boolean[] = [];
  let rr = 0;
  spec.requests.forEach((r, t) => {
    for (const b of busy) for (let i = b.length - 1; i >= 0; i--) if (b[i] <= t) b.splice(i, 1);
    const pool = [...Array(n).keys()].filter((i) => !st.health || !down.has(i));
    let s: number;
    if (pool.length === 0) s = 0;
    else if (st.algorithm === 'round-robin') s = pool[rr++ % pool.length];
    else if (st.algorithm === 'least-conn') s = pool.reduce((best, i) => (busy[i].length < busy[best].length ? i : best), pool[0]);
    else s = pool[userHash(r.user) % pool.length];
    const fail = pool.length === 0 || down.has(s);
    assign.push(s);
    failed.push(fail);
    if (!fail) {
      busy[s].push(t + r.cost);
      peak[s] = Math.max(peak[s], busy[s].length);
    }
  });
  const where = new Map<string, Set<number>>();
  spec.requests.forEach((r, i) => {
    if (failed[i]) return;
    if (!where.has(r.user)) where.set(r.user, new Set());
    where.get(r.user)!.add(assign[i]);
  });
  const split = [...where].filter(([, s]) => s.size > 1).map(([u]) => u);
  return { assign, failed, peak, split };
}

export function lbGoalMet(spec: LbSpecLike, st: LbState): boolean {
  const g = spec.goal;
  if (!g) return false;
  const r = simulateLb(spec, st);
  if (r.failed.some(Boolean)) return false;
  if ('sticky' in g) return r.split.length === 0;
  if ('maxPeak' in g) return Math.max(...r.peak) <= g.maxPeak;
  return true;
}

export const lbStart = (spec: LbSpecLike): LbState => ({ algorithm: spec.algorithm, down: spec.down ?? [], health: spec.health ?? false });

/** Every state the learner can reach with the figure's controls. */
export function lbStates(spec: LbSpecLike): LbState[] {
  const algos = spec.algorithms ?? [spec.algorithm];
  const healths = spec.toggleHealth ? [false, true] : [spec.health ?? false];
  const downs: number[][] = [];
  if (spec.killable) for (let m = 0; m < 1 << spec.servers; m++) downs.push([...Array(spec.servers).keys()].filter((i) => m & (1 << i)));
  else downs.push(spec.down ?? []);
  return algos.flatMap((algorithm) => healths.flatMap((health) => downs.map((down) => ({ algorithm, health, down }))));
}
