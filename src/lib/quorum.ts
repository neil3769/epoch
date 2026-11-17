/*
 * The quorum figure's logic, shared with the content verifier. N replicas
 * hold version 1 of a value. A write of version 2 must be acknowledged by
 * W replicas that are up; a read asks R replicas that are up and returns
 * the newest version it sees. To show the worst case, the write reaches
 * the first W up replicas and the read asks the last R: the read is fresh
 * only if those overlap, which W + R > N guarantees.
 */

export interface QuorumSpecLike {
  n: number;
  w: number;
  r: number;
  down?: number[];
  /** Replicas can be tapped down or up. */
  killable?: boolean;
  goal?: { fresh: true } | { freshWithDown: number };
}

export interface QuorumState {
  w: number;
  r: number;
  down: number[];
}

export interface QuorumResult {
  writeOk: boolean;
  readOk: boolean;
  written: number[];
  readFrom: number[];
  /** Version the read returns (0 when it failed). */
  seen: number;
}

export function simulateQuorum(spec: QuorumSpecLike, st: QuorumState): QuorumResult {
  const up = [...Array(spec.n).keys()].filter((i) => !st.down.includes(i));
  const writeOk = up.length >= st.w;
  const readOk = up.length >= st.r;
  const written = writeOk ? up.slice(0, st.w) : [];
  const readFrom = readOk ? up.slice(up.length - st.r) : [];
  const seen = !readOk ? 0 : readFrom.some((i) => written.includes(i)) ? 2 : 1;
  return { writeOk, readOk, written, readFrom, seen };
}

export function quorumGoalMet(spec: QuorumSpecLike, st: QuorumState): boolean {
  const g = spec.goal;
  if (!g) return false;
  const res = simulateQuorum(spec, st);
  const fresh = res.writeOk && res.readOk && res.seen === 2;
  if ('fresh' in g) return fresh;
  return fresh && st.down.length >= g.freshWithDown;
}

export const quorumStart = (spec: QuorumSpecLike): QuorumState => ({ w: spec.w, r: spec.r, down: spec.down ?? [] });

/** Every state the learner can reach with the figure's controls. */
export function quorumStates(spec: QuorumSpecLike): QuorumState[] {
  const downs: number[][] = [];
  if (spec.killable) for (let m = 0; m < 1 << spec.n; m++) downs.push([...Array(spec.n).keys()].filter((i) => m & (1 << i)));
  else downs.push(spec.down ?? []);
  const out: QuorumState[] = [];
  for (let w = 1; w <= spec.n; w++) for (let r = 1; r <= spec.n; r++) for (const down of downs) out.push({ w, r, down });
  return out;
}
