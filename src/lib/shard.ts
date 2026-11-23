/*
 * The sharding figure's logic, shared with the content verifier.
 * Rows have a few named fields; each row also carries a load (requests a
 * second, default 1). The learner picks which field is the shard key and,
 * optionally, how many shards; each row goes to hash(value) % shards.
 * The hash is FNV-1a (32-bit), so placement is fixed and reproducible.
 */

export interface ShardSpecLike {
  fields: string[];
  /** One value per field, in field order. */
  rows: string[][];
  /** Load per row (requests a second); default 1 each. */
  load?: number[];
  key: string;
  /** Fields the learner may pick as the key; default all fields. */
  keys?: string[];
  shards: number;
  maxShards?: number;
  /**
   * maxShare: the busiest shard carries at most this share of the load;
   * local: every row with the same value of this field is on one shard;
   * hot: some shard carries more than half the load (to see the problem).
   */
  goal?: { maxShare?: number; local?: string; hot?: true };
}

export interface ShardState {
  key: string;
  shards: number;
}

export interface ShardResult {
  /** Shard of each row. */
  shard: number[];
  /** Load on each shard, and its share of the total. */
  load: number[];
  share: number[];
  busiest: number;
}

export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export const rowLoad = (spec: ShardSpecLike, i: number) => spec.load?.[i] ?? 1;

export function simulateShards(spec: ShardSpecLike, st: ShardState): ShardResult {
  const col = spec.fields.indexOf(st.key);
  const shard = spec.rows.map((r) => fnv1a(r[col]) % st.shards);
  const load = Array<number>(st.shards).fill(0);
  shard.forEach((s, i) => (load[s] += rowLoad(spec, i)));
  const total = load.reduce((a, b) => a + b, 0);
  const share = load.map((l) => (total ? l / total : 0));
  const busiest = share.indexOf(Math.max(...share));
  return { shard, load, share, busiest };
}

/** True when every row sharing a value of `field` sits on one shard. */
export function isLocal(spec: ShardSpecLike, res: ShardResult, field: string): boolean {
  const col = spec.fields.indexOf(field);
  const where = new Map<string, number>();
  return spec.rows.every((r, i) => {
    const seen = where.get(r[col]);
    if (seen === undefined) where.set(r[col], res.shard[i]);
    return seen === undefined || seen === res.shard[i];
  });
}

export function shardGoalMet(spec: ShardSpecLike, st: ShardState): boolean {
  const g = spec.goal;
  if (!g || (g.maxShare === undefined && g.local === undefined && !g.hot)) return false;
  const res = simulateShards(spec, st);
  const top = res.share[res.busiest];
  if (g.maxShare !== undefined && top > g.maxShare + 1e-9) return false;
  if (g.local !== undefined && !isLocal(spec, res, g.local)) return false;
  if (g.hot && top <= 0.5) return false;
  return true;
}

export const shardStart = (spec: ShardSpecLike): ShardState => ({ key: spec.key, shards: spec.shards });
export const shardKeys = (spec: ShardSpecLike) => spec.keys ?? spec.fields;

/** Every state the learner can reach with the figure's controls. */
export function shardStates(spec: ShardSpecLike): ShardState[] {
  const hi = Math.max(spec.maxShards ?? spec.shards, spec.shards);
  const out: ShardState[] = [];
  for (const key of shardKeys(spec)) for (let n = spec.maxShards ? 2 : spec.shards; n <= hi; n++) out.push({ key, shards: n });
  return out;
}
