/*
 * The partition figure's logic, shared with the content verifier.
 * A shop's replicas are split into two sides, A and B, that cannot talk.
 * Both start with the same stock. Customers on each side buy (take one
 * item) or read the stock, in order. The learner chooses what the system
 * does during the split:
 *   accept: every side keeps serving from its own copy (available);
 *   refuse: only a side holding a majority of the replicas serves; the
 *           other side refuses (consistent). With no majority, both refuse.
 * When the split heals, sales from both sides are added up: anything over
 * the stock was oversold. A read is stale when it shows a number other
 * than the true stock left at that moment.
 */

export type PartitionMode = 'accept' | 'refuse';
export type Side = 'a' | 'b';

export interface PartitionSpecLike {
  /** Replicas on side A and side B. */
  nodes: [number, number];
  stock: number;
  ops: { side: Side; op: 'buy' | 'read' }[];
  mode: PartitionMode;
  /**
   * noOversell: nothing sold beyond stock; noStale: no read shows a wrong number;
   * allServed: no request refused; minServed: at least this many answered.
   */
  goal?: { noOversell?: true; noStale?: true; allServed?: true; minServed?: number };
}

export type OpOutcome = 'sold' | 'sold-out' | 'read' | 'stale' | 'refused';

export interface PartitionResult {
  outcome: OpOutcome[];
  /** What each read showed (null for buys and refusals). */
  shown: (number | null)[];
  sold: { a: number; b: number };
  oversold: number;
  stale: number;
  refused: number;
  served: number;
  majority: Side | null;
}

export function majorityOf(nodes: [number, number]): Side | null {
  const total = nodes[0] + nodes[1];
  if (nodes[0] * 2 > total) return 'a';
  if (nodes[1] * 2 > total) return 'b';
  return null;
}

export function simulatePartition(spec: PartitionSpecLike, mode: PartitionMode): PartitionResult {
  const majority = majorityOf(spec.nodes);
  const sold = { a: 0, b: 0 };
  const outcome: OpOutcome[] = [];
  const shown: (number | null)[] = [];
  for (const { side, op } of spec.ops) {
    const trueLeft = spec.stock - sold.a - sold.b;
    if (mode === 'refuse' && side !== majority) {
      outcome.push('refused');
      shown.push(null);
      continue;
    }
    // In accept mode a side sees only its own sales; in refuse mode the serving side sees them all.
    const seen = mode === 'accept' ? spec.stock - sold[side] : trueLeft;
    if (op === 'buy') {
      if (seen > 0) {
        sold[side]++;
        outcome.push('sold');
      } else outcome.push('sold-out');
      shown.push(null);
    } else {
      outcome.push(seen === trueLeft ? 'read' : 'stale');
      shown.push(seen);
    }
  }
  const refused = outcome.filter((o) => o === 'refused').length;
  return {
    outcome,
    shown,
    sold,
    oversold: Math.max(0, sold.a + sold.b - spec.stock),
    stale: outcome.filter((o) => o === 'stale').length,
    refused,
    served: outcome.length - refused,
    majority,
  };
}

export function partitionGoalMet(spec: PartitionSpecLike, mode: PartitionMode): boolean {
  const g = spec.goal;
  if (!g || (!g.noOversell && !g.noStale && !g.allServed && g.minServed === undefined)) return false;
  const r = simulatePartition(spec, mode);
  if (g.noOversell && r.oversold > 0) return false;
  if (g.noStale && r.stale > 0) return false;
  if (g.allServed && r.refused > 0) return false;
  if (g.minServed !== undefined && r.served < g.minServed) return false;
  return true;
}

export const PARTITION_MODES: PartitionMode[] = ['accept', 'refuse'];
