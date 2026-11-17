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
