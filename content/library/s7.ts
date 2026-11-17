import type { LibraryPage } from '../schema';

/** Unit S7 summary page: unlocked in the Library when the unit is finished. */
export const s7Library: LibraryPage = {
  unit: 'S7',
  ideas: [
    {
      title: 'Trade-offs',
      text: 'During a partition each side either refuses what it cannot answer safely (consistency) or answers and risks being wrong (availability): CAP. Without a partition the same trade appears as latency: being sure means asking others.',
    },
    {
      title: 'Levels',
      text: 'Strong: every read sees the latest completed write (usernames, locks, money). Causal: effects never before causes (threads, chat). Eventual: replicas converge once updates stop, with a merge rule (counters, carts, likes).',
    },
    {
      title: 'Coordination',
      text: 'Quorums: W + R > N makes reads meet the latest write. Lamport clocks order cause before effect without trusting wall clocks. Consensus (Raft, Paxos, via etcd or ZooKeeper) agrees on one value with a majority: 2f + 1 nodes tolerate f failures. Locks are leases plus fencing tokens checked by storage.',
    },
  ],
  rules: [
    'Partitions happen: decide per operation, refuse or answer.',
    'Use the weakest consistency that is still correct.',
    'Quorum: W + R > N; majority = n // 2 + 1.',
    'Lamport: receive = max(mine, theirs) + 1.',
    'Odd group sizes: 3 or 5.',
    'Locks expire; storage rejects older tokens.',
  ],
  example: {
    code: [
      'def overlaps(w, r, n):',
      '    return w + r > n',
      '',
      'def receive(mine, theirs):',
      '    return max(mine, theirs) + 1',
      '',
      'print(overlaps(2, 2, 3),',
      '      overlaps(2, 3, 5),',
      '      receive(3, 8))',
    ].join('\n'),
    output: 'True False 9',
    notes: ['2 + 2 > 3: reads meet writes; 2 + 3 = 5 is not enough.', 'A receive is numbered after the send.'],
  },
  diagram: {
    nodes: [
      { id: 'c', kind: 'client', label: 'Client' },
      { id: 'l', kind: 'db', label: 'Leader' },
      { id: 'a', kind: 'replica', label: 'Replica 2' },
      { id: 'b', kind: 'replica', label: 'Replica 3' },
      { id: 'z', kind: 'service', label: 'etcd' },
    ],
    edges: [
      { from: 'c', to: 'l', label: 'write' },
      { from: 'l', to: 'a', label: 'ack' },
      { from: 'l', to: 'b', label: 'ack' },
      { from: 'z', to: 'l', label: 'lease', dashed: true },
    ],
  },
  mistakes: [
    { mistake: '"Pick two of C, A and P".', fix: 'Partitions are not optional: choose C or A while one lasts.' },
    { mistake: 'Strong consistency everywhere.', fix: 'Only where wrong answers do harm.' },
    { mistake: 'Ordering events by server timestamps.', fix: 'Logical clocks or a single log.' },
    { mistake: 'Two-node consensus.', fix: 'Three or five nodes.' },
    { mistake: 'Locks without expiry or fencing.', fix: 'Leases plus tokens checked by storage.' },
  ],
  forReal:
    'Read Martin Kleppmann\'s chapter on consistency and consensus in Designing Data-Intensive Applications, then try the Raft visualisation on raft.github.io to watch an election and a partition. If you use a lock in a real project, check that the storage your workers write to enforces fencing tokens.',
};
