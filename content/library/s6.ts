import type { LibraryPage } from '../schema';

/** Unit S6 summary page: unlocked in the Library when the unit is finished. */
export const s6Library: LibraryPage = {
  unit: 'S6',
  ideas: [
    {
      title: 'Replication',
      text: 'One leader takes writes and copies them to followers; reads can use any copy. Followers lag, so route a user to the leader just after their own write. Synchronous copies lose nothing on failover but slow every write; asynchronous ones are fast but can lose the newest writes. Usually: one near follower synchronous, the rest asynchronous.',
    },
    {
      title: 'Failover',
      text: 'Promote the most up-to-date follower when a majority agrees the leader is gone, and fence the old leader so two leaders never write at once (split brain). Use an odd number of voters: 2f + 1 nodes survive f failures.',
    },
    {
      title: 'Partitioning',
      text: 'Shard when data or writes outgrow one machine. Range partitioning keeps ranges together but runs hot on busy ranges; hash partitioning spreads evenly but scatters ranges. Choose a key with many values that matches the main query; cache hot reads, split hot writes. Consistent hashing moves only about 1/n of keys when a server joins.',
    },
  ],
  rules: [
    'Followers add read capacity, not write capacity.',
    'Read-your-writes: leader reads for the writer, briefly.',
    'Majority = n // 2 + 1; survive f failures with 2f + 1 nodes.',
    'Never shard by timestamp or by a field with few values.',
    'Hot reads: cache. Hot writes: split into sub-keys.',
    'Changing membership: a hash ring with virtual nodes.',
  ],
  example: {
    code: [
      'sim.clock.reset()',
      'rs = sim.Replicas(1, lag=1.0)',
      'rs.write("bio", "new")',
      'sim.clock.advance(0.2)',
      'print(rs.read("bio", 0),',
      '      rs.read("bio", 1))',
      'print(sum(k % 4 != k % 5',
      '          for k in range(100)))',
    ].join('\n'),
    output: 'new None\n80',
    notes: ['The follower is still behind: route the writer to the leader.', 'hash % n moves 80% of keys from 4 to 5 servers; a ring moves about 20%.'],
  },
  diagram: {
    nodes: [
      { id: 'a', kind: 'service', label: 'App' },
      { id: 'r', kind: 'service', label: 'Router' },
      { id: 's1', kind: 'db', label: 'Shard 1' },
      { id: 's2', kind: 'db', label: 'Shard 2' },
      { id: 'f1', kind: 'replica', label: 'Followers' },
      { id: 'f2', kind: 'replica', label: 'Followers' },
    ],
    edges: [
      { from: 'a', to: 'r' },
      { from: 'r', to: 's1' },
      { from: 'r', to: 's2' },
      { from: 's1', to: 'f1', dashed: true },
      { from: 's2', to: 'f2', dashed: true },
    ],
  },
  mistakes: [
    { mistake: 'Reading your own write from a follower.', fix: 'Leader reads for the writer, briefly.' },
    { mistake: 'Two-node automatic failover.', fix: 'Three voters, majority rule, fencing.' },
    { mistake: 'Sharding before it is needed.', fix: 'Scale up and add replicas first.' },
    { mistake: 'Shard key = created_at.', fix: 'A key with many evenly used values.' },
    { mistake: 'hash % n for a changing cache cluster.', fix: 'Consistent hashing with virtual nodes.' },
  ],
  forReal:
    'Set up PostgreSQL streaming replication with one replica in Docker, watch `pg_stat_replication` for lag while you write in a loop, and read from the replica right after a write to see stale data. Then read the Amazon Dynamo paper\'s section on partitioning, which introduced consistent hashing with virtual nodes to many engineers.',
};
