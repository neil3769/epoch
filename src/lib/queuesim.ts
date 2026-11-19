/*
 * The queue figure's logic, shared with the content verifier. A backlog of
 * jobs waits in a queue; workers take one attempt each per tick while new
 * jobs keep arriving at a steady rate. Each job in the backlog has a kind:
 *   '.' normal: succeeds first time;
 *   'f' flaky: the first attempt fails, a retry succeeds;
 *   'p' poison: every attempt fails;
 *   'c' crash: the worker does the work, then crashes before acknowledging.
 * Acknowledging first (at-most-once) loses any job whose attempt fails;
 * acknowledging after the work (at-least-once) retries failures up to the
 * retry limit and redelivers crashed jobs, which repeats the work unless
 * handling is idempotent. Jobs that run out of retries go to the dead-letter
 * queue if there is one, and are lost otherwise.
 */

export type QueueControl = 'workers' | 'retries' | 'ack' | 'idem' | 'dlq';
export type JobOutcome = 'done' | 'twice' | 'lost' | 'dlq';

export interface QueueSpecLike {
  /** One character per job in the backlog: . f p c */
  jobs: string;
  workers: number;
  maxWorkers?: number;
  /** New (normal) jobs arriving per tick. */
  arrive?: number;
  retries?: number;
  ackAfter?: boolean;
  idem?: boolean;
  dlq?: boolean;
  controls: QueueControl[];
  goal?: { clean?: boolean; clearBy?: number };
}

export interface QueueState {
  workers: number;
  retries: number;
  ackAfter: boolean;
  idem: boolean;
  dlq: boolean;
}

export interface QueueResult {
  outcomes: JobOutcome[];
  attempts: number;
  /** Ticks until the backlog is empty; null when it never empties. */
  ticks: number | null;
  done: number;
  twice: number;
  lost: number;
  dead: number;
}

export const MAX_RETRIES = 3;

function runJob(kind: string, st: QueueState): { outcome: JobOutcome; attempts: number } {
  const parked: JobOutcome = st.dlq ? 'dlq' : 'lost';
  if (!st.ackAfter) {
    // Acknowledged before the work: one attempt, whatever happens.
    if (kind === 'f' || kind === 'p') return { outcome: 'lost', attempts: 1 };
    return { outcome: 'done', attempts: 1 };
  }
  if (kind === 'f') return st.retries >= 1 ? { outcome: 'done', attempts: 2 } : { outcome: parked, attempts: 1 };
  if (kind === 'p') return { outcome: parked, attempts: st.retries + 1 };
  if (kind === 'c') return { outcome: st.idem ? 'done' : 'twice', attempts: 2 };
  return { outcome: 'done', attempts: 1 };
}

export function simulateQueue(spec: QueueSpecLike, st: QueueState): QueueResult {
  const runs = [...spec.jobs].map((k) => runJob(k, st));
  const outcomes = runs.map((r) => r.outcome);
  const attempts = runs.reduce((a, r) => a + r.attempts, 0);
  const drain = st.workers - (spec.arrive ?? 0);
  const ticks = drain > 0 ? Math.ceil(attempts / drain) : null;
  const count = (o: JobOutcome) => outcomes.filter((x) => x === o).length;
  return { outcomes, attempts, ticks, done: count('done'), twice: count('twice'), lost: count('lost'), dead: count('dlq') };
}

export function queueGoalMet(spec: QueueSpecLike, st: QueueState): boolean {
  const g = spec.goal;
  if (!g || (g.clean === undefined && g.clearBy === undefined)) return false;
  const res = simulateQueue(spec, st);
  // Clean: nothing lost or repeated, and only poison jobs end in the DLQ.
  const poison = [...spec.jobs].filter((k) => k === 'p').length;
  if (g.clean && (res.lost > 0 || res.twice > 0 || res.dead > poison)) return false;
  if (g.clearBy !== undefined && (res.ticks === null || res.ticks > g.clearBy)) return false;
  return true;
}

export const queueStart = (spec: QueueSpecLike): QueueState => ({
  workers: spec.workers,
  retries: spec.retries ?? 0,
  ackAfter: spec.ackAfter ?? true,
  idem: spec.idem ?? false,
  dlq: spec.dlq ?? false,
});

export const maxWorkers = (spec: QueueSpecLike) => spec.maxWorkers ?? 6;

/** Every state the learner can reach with the figure's controls. */
export function queueStates(spec: QueueSpecLike): QueueState[] {
  const s0 = queueStart(spec);
  const has = (c: QueueControl) => spec.controls.includes(c);
  const range = (lo: number, hi: number) => [...Array(hi - lo + 1).keys()].map((i) => lo + i);
  const out: QueueState[] = [];
  for (const workers of has('workers') ? range(1, maxWorkers(spec)) : [s0.workers])
    for (const retries of has('retries') ? range(0, MAX_RETRIES) : [s0.retries])
      for (const ackAfter of has('ack') ? [false, true] : [s0.ackAfter])
        for (const idem of has('idem') ? [false, true] : [s0.idem])
          for (const dlq of has('dlq') ? [false, true] : [s0.dlq]) out.push({ workers, retries, ackAfter, idem, dlq });
  return out;
}
