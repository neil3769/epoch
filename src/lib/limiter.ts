/*
 * The rate-limiter figure's logic, shared with the content verifier.
 * Requests arrive at fixed times (seconds, one decimal). Three algorithms,
 * each with a limit per one-second window:
 *   fixed:   count per calendar second [n, n + 1); allow while under the limit;
 *   sliding: allow while fewer than `limit` allowed in the last second;
 *   bucket:  a token bucket holding up to `limit` tokens, starting full,
 *            refilled at `rate` tokens a second; each request takes one.
 * Times are handled in tenths of a second so the arithmetic is exact.
 */

export type LimiterAlgo = 'fixed' | 'sliding' | 'bucket';
export type LimiterControl = 'limit' | 'rate';

export interface LimiterSpecLike {
  times: number[];
  algorithm: LimiterAlgo;
  algorithms?: LimiterAlgo[];
  limit: number;
  rate?: number;
  controls?: LimiterControl[];
  /** maxPerSecond: no one-second span lets more through; minAllowed: at least this many get through. */
  goal?: { maxPerSecond?: number; minAllowed?: number };
}

export interface LimiterState {
  algorithm: LimiterAlgo;
  limit: number;
  rate: number;
}

export interface LimiterResult {
  allowed: boolean[];
  count: number;
  /** Most requests allowed in any one-second span, and where that span starts (seconds). */
  peak: number;
  peakAt: number;
}

export const MAX_LIMIT = 10;
export const MAX_RATE = 5;
const tenths = (t: number) => Math.round(t * 10);

export function simulateLimiter(spec: LimiterSpecLike, st: LimiterState): LimiterResult {
  const ts = spec.times.map(tenths);
  const allowed: boolean[] = [];
  const kept: number[] = [];
  // Token bucket in hundredths of a token per tenth of a second: rate r/s adds 10r hundredths per tenth.
  let tokens = st.limit * 100;
  let last = 0;
  ts.forEach((t, i) => {
    let ok: boolean;
    if (st.algorithm === 'fixed') {
      const win = Math.floor(t / 10);
      ok = kept.filter((k) => Math.floor(k / 10) === win).length < st.limit;
    } else if (st.algorithm === 'sliding') {
      ok = kept.filter((k) => t - k < 10).length < st.limit;
    } else {
      tokens = Math.min(st.limit * 100, tokens + (t - last) * st.rate * 10);
      last = t;
      ok = tokens >= 100;
      if (ok) tokens -= 100;
    }
    allowed[i] = ok;
    if (ok) kept.push(t);
  });
  let peak = 0;
  let peakAt = 0;
  for (const s of kept) {
    const n = kept.filter((k) => k >= s && k < s + 10).length;
    if (n > peak) {
      peak = n;
      peakAt = s / 10;
    }
  }
  return { allowed, count: kept.length, peak, peakAt };
}

export function limiterGoalMet(spec: LimiterSpecLike, st: LimiterState): boolean {
  const g = spec.goal;
  if (!g || (g.maxPerSecond === undefined && g.minAllowed === undefined)) return false;
  const res = simulateLimiter(spec, st);
  if (g.maxPerSecond !== undefined && res.peak > g.maxPerSecond) return false;
  if (g.minAllowed !== undefined && res.count < g.minAllowed) return false;
  return true;
}

export const limiterStart = (spec: LimiterSpecLike): LimiterState => ({ algorithm: spec.algorithm, limit: spec.limit, rate: spec.rate ?? 1 });

/** Every state the learner can reach with the figure's controls. */
export function limiterStates(spec: LimiterSpecLike): LimiterState[] {
  const s0 = limiterStart(spec);
  const has = (c: LimiterControl) => (spec.controls ?? []).includes(c);
  const range = (hi: number) => [...Array(hi).keys()].map((i) => i + 1);
  const out: LimiterState[] = [];
  for (const algorithm of spec.algorithms ?? [s0.algorithm])
    for (const limit of has('limit') ? range(MAX_LIMIT) : [s0.limit])
      for (const rate of has('rate') ? range(MAX_RATE) : [s0.rate]) out.push({ algorithm, limit, rate });
  return out;
}
