import { describe, expect, it } from 'vitest';
import { cacheGoalMet, cacheStart, cacheStates, simulateCache, type CacheSpecLike } from '../src/lib/cachesim';
import { lbGoalMet, lbStart, lbStates, simulateLb, type LbSpecLike } from '../src/lib/lbsim';

const uneven: LbSpecLike = {
  servers: 3,
  requests: [6, 1, 1, 6, 1, 1, 6, 1, 1].map((cost, i) => ({ user: 'ABCDEFGHI'[i], cost })),
  algorithm: 'round-robin',
  algorithms: ['round-robin', 'least-conn'],
  goal: { maxPeak: 1 },
};

describe('load balancer simulation', () => {
  it('round robin stacks long requests; least connections spreads them', () => {
    expect(Math.max(...simulateLb(uneven, lbStart(uneven)).peak)).toBe(2);
    expect(Math.max(...simulateLb(uneven, { ...lbStart(uneven), algorithm: 'least-conn' }).peak)).toBe(1);
    expect(lbGoalMet(uneven, lbStart(uneven))).toBe(false);
    expect(lbStates(uneven).some((s) => lbGoalMet(uneven, s))).toBe(true);
  });
  it('fails requests to a down server unless health checks are on', () => {
    const spec: LbSpecLike = { servers: 3, requests: 'ABCDEF'.split('').map((user) => ({ user, cost: 1 })), algorithm: 'round-robin', down: [1], toggleHealth: true, goal: { noFailures: true } };
    expect(simulateLb(spec, lbStart(spec)).failed.filter(Boolean).length).toBe(2);
    expect(lbGoalMet(spec, { ...lbStart(spec), health: true })).toBe(true);
  });
  it('hashing keeps each user on one server', () => {
    const spec: LbSpecLike = { servers: 3, requests: 'ABACBACC'.split('').map((user) => ({ user, cost: 2 })), algorithm: 'hash' };
    expect(simulateLb(spec, lbStart(spec)).split).toEqual([]);
    expect(simulateLb(spec, { ...lbStart(spec), algorithm: 'round-robin' }).split.length).toBeGreaterThan(0);
  });
});

describe('cache simulation', () => {
  it('counts hits, misses and LRU evictions', () => {
    const spec: CacheSpecLike = { reads: 'a b a a c a b a', size: 2, policy: 'lru', ttl: null };
    const r = simulateCache(spec, cacheStart(spec));
    expect(r.events.join(' ')).toBe('miss miss hit hit miss hit miss hit');
    expect(r.hitRate).toBe(0.5);
  });
  it('LRU beats FIFO when a popular key keeps coming back', () => {
    const spec: CacheSpecLike = { reads: 'a b a c a d a b', size: 2, policy: 'fifo', ttl: null };
    expect(simulateCache(spec, cacheStart(spec)).hitRate).toBe(0.25);
    expect(simulateCache(spec, { ...cacheStart(spec), policy: 'lru' }).hitRate).toBe(0.375);
  });
  it('serves stale values until the TTL expires them', () => {
    const spec: CacheSpecLike = { reads: 'a a a a a a a a', changes: [{ key: 'a', at: 4 }], size: 1, policy: 'lru', ttl: null, editable: ['ttl'], goal: { noStale: true, minHitRate: 0.5 } };
    expect(simulateCache(spec, cacheStart(spec)).stale).toBe(4);
    expect(simulateCache(spec, { ...cacheStart(spec), ttl: 2 }).stale).toBe(0);
    expect(cacheGoalMet(spec, cacheStart(spec))).toBe(false);
    expect(cacheStates(spec).filter((s) => cacheGoalMet(spec, s)).map((s) => s.ttl)).toEqual([2]);
  });
});

import { moved as ringMoved, maxShare, ringGoalMet, ringStart, ringStates, type RingSpecLike } from '../src/lib/ringsim';

describe('consistent hashing ring', () => {
  const keys = Array.from({ length: 16 }, (_, i) => `user${i + 1}`);
  const spec: RingSpecLike = { keys, servers: 3, maxServers: 5, mode: 'mod', switchable: true, goal: { servers: 4, maxMoved: 5 } };
  it('modulo moves most keys when a server joins; the ring moves few', () => {
    expect(ringMoved(spec, { servers: 4, mode: 'mod', vnodes: 1 })).toBeGreaterThan(10);
    expect(ringMoved(spec, { servers: 4, mode: 'ring', vnodes: 1 })).toBeLessThanOrEqual(5);
    expect(ringGoalMet(spec, ringStart(spec))).toBe(false);
    expect(ringStates(spec).some((s) => ringGoalMet(spec, s))).toBe(true);
  });
  it('virtual nodes even out the load', () => {
    const one = maxShare(spec, { servers: 3, mode: 'ring', vnodes: 1 });
    const many = maxShare(spec, { servers: 3, mode: 'ring', vnodes: 16 });
    expect(many).toBeLessThan(one);
  });
});

import { quorumGoalMet, quorumStart, simulateQuorum, type QuorumSpecLike } from '../src/lib/quorum';

describe('quorum figure', () => {
  it('reads are fresh exactly when W + R > N (worst case)', () => {
    const spec: QuorumSpecLike = { n: 3, w: 1, r: 1, goal: { fresh: true } };
    for (let w = 1; w <= 3; w++)
      for (let r = 1; r <= 3; r++) expect(simulateQuorum(spec, { w, r, down: [] }).seen === 2).toBe(w + r > 3);
    expect(quorumGoalMet(spec, quorumStart(spec))).toBe(false);
  });
  it('writes fail when fewer than W replicas are up', () => {
    const spec: QuorumSpecLike = { n: 5, w: 5, r: 1, down: [4] };
    expect(simulateQuorum(spec, quorumStart(spec)).writeOk).toBe(false);
    expect(simulateQuorum(spec, { w: 3, r: 3, down: [4] }).seen).toBe(2);
  });
});

import { queueGoalMet, queueStart, queueStates, simulateQueue, type QueueSpecLike } from '../src/lib/queuesim';

describe('queue figure', () => {
  const base: QueueSpecLike = { jobs: '.f.p.c', workers: 2, controls: ['ack', 'retries', 'idem', 'dlq'], goal: { clean: true } };
  it('ack-first loses failing jobs; ack-after duplicates a crash unless idempotent', () => {
    const first = simulateQueue(base, { ...queueStart(base), ackAfter: false });
    expect(first.outcomes).toEqual(['done', 'lost', 'done', 'lost', 'done', 'done']);
    const after = simulateQueue(base, { ...queueStart(base), retries: 1 });
    expect(after.outcomes).toEqual(['done', 'done', 'done', 'lost', 'done', 'twice']);
    const fixed = simulateQueue(base, { workers: 2, retries: 1, ackAfter: true, idem: true, dlq: true });
    expect(fixed.outcomes).toEqual(['done', 'done', 'done', 'dlq', 'done', 'done']);
    expect(fixed.attempts).toBe(1 + 2 + 1 + 2 + 1 + 2);
    expect(fixed.ticks).toBe(5);
  });
  it('the clean goal needs retries, idempotency and a DLQ together', () => {
    const ok = queueStates(base).filter((s) => queueGoalMet(base, s));
    expect(ok.length).toBeGreaterThan(0);
    for (const s of ok) expect(s.ackAfter && s.idem && s.dlq && s.retries >= 1).toBe(true);
    expect(queueGoalMet(base, queueStart(base))).toBe(false);
  });
  it('the backlog never clears when arrivals match the workers', () => {
    const spec: QueueSpecLike = { jobs: '....', workers: 2, arrive: 2, controls: ['workers'], goal: { clearBy: 2 } };
    expect(simulateQueue(spec, queueStart(spec)).ticks).toBeNull();
    expect(simulateQueue(spec, { ...queueStart(spec), workers: 4 }).ticks).toBe(2);
  });
});

import { limiterGoalMet, limiterStart, limiterStates, simulateLimiter, type LimiterSpecLike } from '../src/lib/limiter';

describe('rate-limiter figure', () => {
  const edge: LimiterSpecLike = { times: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4], algorithm: 'fixed', algorithms: ['fixed', 'sliding'], limit: 5, goal: { maxPerSecond: 5 } };
  it('a fixed window lets twice the limit through across a boundary; a sliding window does not', () => {
    const f = simulateLimiter(edge, limiterStart(edge));
    expect(f.count).toBe(10);
    expect(f.peak).toBe(10);
    const s = simulateLimiter(edge, { ...limiterStart(edge), algorithm: 'sliding' });
    expect(s.allowed).toEqual([true, true, true, true, true, false, false, false, false, false]);
    expect(limiterGoalMet(edge, limiterStart(edge))).toBe(false);
    expect(limiterStates(edge).some((st) => limiterGoalMet(edge, st))).toBe(true);
  });
  it('a token bucket takes a burst up to its size, then the refill rate', () => {
    const burst: LimiterSpecLike = { times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 2, 3, 4, 5], algorithm: 'bucket', limit: 4, rate: 1, controls: ['limit'], goal: { minAllowed: 12 } };
    expect(simulateLimiter(burst, limiterStart(burst)).count).toBe(8);
    expect(simulateLimiter(burst, { ...limiterStart(burst), limit: 7 }).count).toBe(11);
    expect(simulateLimiter(burst, { ...limiterStart(burst), limit: 8 }).count).toBe(12);
  });
});
