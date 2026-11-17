/*
 * The cache figure's simulation, shared with the content verifier. One read
 * per second, in order. A hit within the TTL is served from the cache; if
 * the source changed since the entry was stored, that hit is stale. Full
 * caches drop expired entries first, then evict by policy.
 */

export type CachePolicy = 'lru' | 'fifo';
export type CacheEvent = 'hit' | 'miss' | 'stale';

export interface CacheSpecLike {
  /** Keys read, one per second, separated by spaces: "a b a c". */
  reads: string;
  /** The source value of `key` changes at second `at`. */
  changes?: { key: string; at: number }[];
  size: number;
  policy: CachePolicy;
  /** Seconds an entry stays fresh; null keeps it forever. */
  ttl: number | null;
  editable?: ('size' | 'policy' | 'ttl')[];
  goal?: { hitRate: number } | { noStale: true; minHitRate?: number } | { stale: true };
}

export interface CacheState {
  size: number;
  policy: CachePolicy;
  ttl: number | null;
}

export interface CacheResult {
  events: CacheEvent[];
  hitRate: number;
  stale: number;
}

export const SIZES = [1, 2, 3, 4, 5];
export const TTLS: (number | null)[] = [null, 10, 5, 2];

export const readKeys = (spec: CacheSpecLike) => spec.reads.trim().split(/\s+/);

export function simulateCache(spec: CacheSpecLike, st: CacheState): CacheResult {
  const keys = readKeys(spec);
  const version = (k: string, t: number) => (spec.changes ?? []).filter((c) => c.key === k && c.at <= t).length;
  const entries = new Map<string, { at: number; used: number; v: number }>();
  const fresh = (e: { at: number }, t: number) => st.ttl === null || t - e.at < st.ttl;
  const events: CacheEvent[] = keys.map((k, t) => {
    const e = entries.get(k);
    if (e && fresh(e, t)) {
      e.used = t;
      return e.v === version(k, t) ? 'hit' : 'stale';
    }
    if (e) entries.delete(k);
    if (entries.size >= st.size) {
      for (const [kk, ee] of entries) if (!fresh(ee, t)) entries.delete(kk);
      if (entries.size >= st.size) {
        let victim = '';
        let best = Infinity;
        for (const [kk, ee] of entries) {
          const score = st.policy === 'lru' ? ee.used : ee.at;
          if (score < best) {
            best = score;
            victim = kk;
          }
        }
        entries.delete(victim);
      }
    }
    entries.set(k, { at: t, used: t, v: version(k, t) });
    return 'miss';
  });
  const served = events.filter((e) => e !== 'miss').length;
  return { events, hitRate: served / events.length, stale: events.filter((e) => e === 'stale').length };
}

export function cacheGoalMet(spec: CacheSpecLike, st: CacheState): boolean {
  const g = spec.goal;
  if (!g) return false;
  const r = simulateCache(spec, st);
  if ('stale' in g) return r.stale > 0;
  if ('noStale' in g) return r.stale === 0 && r.hitRate >= (g.minHitRate ?? 0) - 1e-9;
  return r.hitRate >= g.hitRate - 1e-9;
}

export const cacheStart = (spec: CacheSpecLike): CacheState => ({ size: spec.size, policy: spec.policy, ttl: spec.ttl });

/** Every state the learner can reach with the figure's controls. */
export function cacheStates(spec: CacheSpecLike): CacheState[] {
  const ed = new Set(spec.editable ?? []);
  const sizes = ed.has('size') ? SIZES : [spec.size];
  const pols: CachePolicy[] = ed.has('policy') ? ['lru', 'fifo'] : [spec.policy];
  const ttls = ed.has('ttl') ? TTLS : [spec.ttl];
  return sizes.flatMap((size) => pols.flatMap((policy) => ttls.map((ttl) => ({ size, policy, ttl }))));
}
