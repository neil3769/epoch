import { describe, expect, it } from 'vitest';
import { fnv1a, isLocal, shardGoalMet, shardStates, simulateShards, type ShardSpecLike } from '../src/lib/shard';
import { majorityOf, partitionGoalMet, simulatePartition, type PartitionSpecLike } from '../src/lib/partition';

describe('sharding figure', () => {
  it('uses a fixed FNV-1a hash', () => {
    expect(fnv1a('')).toBe(0x811c9dc5);
    expect(fnv1a('a')).toBe(0xe40c292c);
  });
  const users = ['ana', 'ben', 'dev', 'eli', 'caz', 'kim'];
  const country = ['PT', 'PT', 'PT', 'PT', 'ES', 'PT', 'PT', 'FR', 'PT', 'PT', 'PT', 'ES'];
  const rows = users.flatMap((u, i) => [0, 1].map((j) => [u, country[i * 2 + j], `o${i * 2 + j + 1}`]));
  const spec: ShardSpecLike = { fields: ['user', 'country', 'order'], rows, key: 'country', shards: 3, goal: { maxShare: 0.4, local: 'user' } };
  it('makes a hot shard from a skewed key and spreads a good one', () => {
    const byCountry = simulateShards(spec, { key: 'country', shards: 3 });
    expect(Math.max(...byCountry.load)).toBe(9);
    const byUser = simulateShards(spec, { key: 'user', shards: 3 });
    expect(byUser.load).toEqual([4, 4, 4]);
    expect(isLocal(spec, byUser, 'user')).toBe(true);
    expect(isLocal(spec, simulateShards(spec, { key: 'order', shards: 3 }), 'user')).toBe(false);
  });
  it('checks goals over every reachable state', () => {
    expect(shardGoalMet(spec, { key: 'country', shards: 3 })).toBe(false);
    expect(shardStates(spec).filter((s) => shardGoalMet(spec, s)).map((s) => s.key)).toEqual(['user']);
  });
  it('weights rows by load', () => {
    const celeb: ShardSpecLike = {
      fields: ['author', 'post'],
      rows: ['star', 'star', 'star', 'star', 'ana', 'ben', 'caz', 'dev'].map((a, i) => [a, `p${i + 1}`]),
      load: [6, 6, 6, 6, 1, 1, 1, 1],
      key: 'author',
      shards: 4,
    };
    expect(Math.max(...simulateShards(celeb, { key: 'author', shards: 4 }).load)).toBeGreaterThanOrEqual(24);
    expect(simulateShards(celeb, { key: 'post', shards: 4 }).load).toEqual([7, 7, 7, 7]);
  });
});

describe('partition figure', () => {
  const tickets: PartitionSpecLike = {
    nodes: [3, 2],
    stock: 3,
    ops: [
      { side: 'a', op: 'buy' },
      { side: 'b', op: 'buy' },
      { side: 'a', op: 'buy' },
      { side: 'b', op: 'buy' },
      { side: 'b', op: 'read' },
      { side: 'a', op: 'read' },
    ],
    mode: 'accept',
    goal: { noOversell: true },
  };
  it('finds the majority side, or none on an even split', () => {
    expect(majorityOf([3, 2])).toBe('a');
    expect(majorityOf([1, 2])).toBe('b');
    expect(majorityOf([2, 2])).toBeNull();
  });
  it('oversells and shows stale stock when both sides keep serving', () => {
    const r = simulatePartition(tickets, 'accept');
    expect(r.sold).toEqual({ a: 2, b: 2 });
    expect(r.oversold).toBe(1);
    expect(r.stale).toBe(2);
    expect(r.refused).toBe(0);
  });
  it('stays correct when the minority side refuses', () => {
    const r = simulatePartition(tickets, 'refuse');
    expect(r.oversold).toBe(0);
    expect(r.stale).toBe(0);
    expect(r.refused).toBe(3);
    expect(r.shown[5]).toBe(1);
    expect(partitionGoalMet(tickets, 'accept')).toBe(false);
    expect(partitionGoalMet(tickets, 'refuse')).toBe(true);
  });
  it('refuses everything with no majority', () => {
    const even = { ...tickets, nodes: [2, 2] as [number, number] };
    expect(simulatePartition(even, 'refuse').served).toBe(0);
  });
});
