/*
 * The consistent-hashing figure's logic, shared with the content verifier.
 * Keys are placed on servers either by hash modulo the number of servers,
 * or on a ring: each server (and each of its virtual nodes) sits at a hash
 * position and owns the keys up to it, clockwise. Adding a server to a ring
 * moves only the keys it takes over; modulo moves most keys.
 */

export type RingMode = 'mod' | 'ring';

export interface RingSpecLike {
  keys: string[];
  /** Servers at the start (the baseline for counting moved keys). */
  servers: number;
  /** Most servers the learner may have. */
  maxServers: number;
  mode: RingMode;
  /** The learner may switch between modulo and ring. */
  switchable?: boolean;
  /** Virtual nodes per server on the ring (1 = none); a list makes it a control. */
  vnodes?: number[];
  goal?: { servers: number; maxMoved: number } | { maxShare: number; servers: number };
}

export interface RingState {
  servers: number;
  mode: RingMode;
  vnodes: number;
}

/** FNV-1a then a mixing step, 32-bit, scaled to [0, 1): a stable position on the ring. */
export function hash01(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // MurmurHash3's finaliser spreads short, similar strings evenly.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 2 ** 32;
}

/** Points on the ring: [position, server index], sorted by position. */
export function ringPoints(servers: number, vnodes: number): [number, number][] {
  const pts: [number, number][] = [];
  for (let s = 0; s < servers; s++) for (let v = 0; v < vnodes; v++) pts.push([hash01(`S${s + 1}#${v}`), s]);
  return pts.sort((a, b) => a[0] - b[0]);
}

/** The server that owns each key. */
export function assign(keys: string[], st: RingState): number[] {
  if (st.mode === 'mod') return keys.map((k) => Math.floor(hash01(k) * 2 ** 32) % st.servers);
  const pts = ringPoints(st.servers, st.vnodes);
  return keys.map((k) => {
    const h = hash01(k);
    const p = pts.find(([pos]) => pos >= h) ?? pts[0];
    return p[1];
  });
}

export const ringStart = (spec: RingSpecLike): RingState => ({ servers: spec.servers, mode: spec.mode, vnodes: spec.vnodes?.[0] ?? 1 });

/** Keys whose server changed from the starting number of servers (same mode and vnodes). */
export function moved(spec: RingSpecLike, st: RingState): number {
  const before = assign(spec.keys, { ...st, servers: spec.servers });
  const after = assign(spec.keys, st);
  return before.filter((s, i) => s !== after[i]).length;
}

/** The largest share of keys any one server holds. */
export function maxShare(spec: RingSpecLike, st: RingState): number {
  const counts = Array(st.servers).fill(0);
  for (const s of assign(spec.keys, st)) counts[s]++;
  return Math.max(...counts) / spec.keys.length;
}

export function ringGoalMet(spec: RingSpecLike, st: RingState): boolean {
  const g = spec.goal;
  if (!g) return false;
  if (st.servers !== g.servers) return false;
  if ('maxMoved' in g) return moved(spec, st) <= g.maxMoved;
  return maxShare(spec, st) <= g.maxShare + 1e-9;
}

/** Every state the learner can reach with the figure's controls. */
export function ringStates(spec: RingSpecLike): RingState[] {
  const modes: RingMode[] = spec.switchable ? ['mod', 'ring'] : [spec.mode];
  const vns = spec.vnodes ?? [1];
  const out: RingState[] = [];
  for (let n = 1; n <= spec.maxServers; n++) for (const mode of modes) for (const vnodes of vns) out.push({ servers: n, mode, vnodes });
  return out;
}
