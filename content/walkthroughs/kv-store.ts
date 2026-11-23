import type { Walkthrough } from '../schema';

/*
 * Walkthrough 5: a distributed key-value store, through the seven-step
 * framework. Unlocks after S1-S3 and S5-S7 (databases, replication,
 * partitioning, consistency).
 */
export const kvStore: Walkthrough = {
  id: 'w-kv-store',
  title: 'Key-value store',
  question: 'Design a distributed key-value store: put(key, value) and get(key), holding 10 TB, that keeps working when machines fail.',
  needs: ['S1', 'S2', 'S3', 'S5', 'S6', 'S7'],
  minutes: 20,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "Values are up to 10 KB. Reads and writes are about equal. It must keep working with a machine or two down, and answer in a few milliseconds."',
      exercises: [
        {
          id: 'wkv-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'get and put by key', bucket: 0, why: 'The core feature, stated.' },
            { text: 'Delete a key', bucket: 0, why: 'A store that cannot forget is not much use.' },
            { text: 'Survive machine failures', bucket: 0, why: 'Stated by the interviewer.' },
            { text: 'Range scans over keys', bucket: 1, why: 'Not asked for, and hash partitioning makes ranges hard.' },
            { text: 'Secondary indexes', bucket: 1, why: 'Lookups are by key only.' },
            { text: 'Transactions across keys', bucket: 1, why: 'Much harder across machines; not asked for.' },
          ],
          explain: 'Keep v1 to single-key operations that survive failures.',
        },
        {
          id: 'wkv-1-2',
          type: 'mcq',
          prompt: 'The network splits the cluster in two. Which behaviour fits the requirements?',
          options: [
            { text: 'Keep answering on both sides' },
            { text: 'Refuse writes until it heals', why: 'The interviewer asked for it to keep working through failures.' },
            { text: 'Shut the whole cluster down', why: 'That is the opposite of staying available.' },
          ],
          answer: 0,
          explain: 'An AP choice (S7): replicas may briefly disagree and are reconciled later.',
        },
        {
          id: 'wkv-1-3',
          type: 'scenario',
          prompt: 'A shopping-cart team and a bank-ledger team both want to use the store. What consistency do you offer?',
          situation: 'Carts tolerate a stale read for a moment; the ledger does not.',
          needs: ['One store for both teams', 'Each team picks its own trade-off'],
          options: [
            { text: 'Tunable R and W per request', cost: 'More to explain; teams must choose well.' },
            {
              text: 'Always strong consistency',
              cost: 'Every read waits for a majority.',
              why: 'The cart team pays latency and availability it does not need.',
            },
            {
              text: 'Always eventual',
              cost: 'Fast everywhere.',
              why: 'The ledger cannot accept a stale balance.',
            },
          ],
          answer: 0,
          explain: 'Read and write quorums (S7) let each request choose between speed and freshness.',
        },
      ],
      strong: 'get, put and delete by key, values up to 10 KB; stays available through machine failures and network splits, answers in a few milliseconds, and lets each request tune consistency with read and write quorums.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "10 TB of data and 100,000 requests a second at peak. Keep three copies. A machine holds 2 TB of SSD and serves 10,000 requests a second."',
      exercises: [
        {
          id: 'wkv-2-1',
          type: 'estimate',
          prompt: 'Total storage with three copies?',
          expr: '10 * TB * 3 / TB',
          answer: 30,
          tolerance: 2,
          unit: 'TB',
          options: [
            { value: 10, why: 'That is one copy; there are three.' },
            { value: 30 },
            { value: 300, why: '10 TB × 3 is 30 TB, not 300.' },
          ],
          work: ['10 TB × 3 copies = 30 TB'],
          explain: 'Replication multiplies storage by the number of copies.',
        },
        {
          id: 'wkv-2-2',
          type: 'estimate',
          prompt: 'Machines needed for storage alone, at 2 TB each?',
          expr: '10 * TB * 3 / (2 * TB)',
          answer: 15,
          tolerance: 1.5,
          unit: 'machines',
          options: [
            { value: 5, why: 'Five machines hold only one copy of 10 TB.' },
            { value: 15 },
            { value: 150, why: '30 TB / 2 TB is 15, not 150.' },
          ],
          work: ['30 TB / 2 TB per machine = 15 machines'],
          explain: 'Before any headroom for growth or failures.',
        },
        {
          id: 'wkv-2-3',
          type: 'mcq',
          prompt: 'Storage needs 15 machines; traffic (100,000 / 10,000) needs about 10. How many do you plan for?',
          options: [
            { text: 'About 20: storage plus room' },
            { text: 'About 10: traffic decides', why: 'Ten machines of 2 TB cannot hold 30 TB.' },
            { text: 'Exactly 15, none spare', why: 'One failure or a month of growth leaves no room.' },
          ],
          answer: 0,
          explain: 'The larger of the two needs decides, plus headroom for failures and growth.',
        },
      ],
      strong: '30 TB with three copies needs at least 15 machines of 2 TB; traffic needs about 10, so storage decides, and you plan about 20 for headroom and failures.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Three operations, each naming one key; a request may also name a consistency level.',
      exercises: [
        {
          id: 'wkv-3-1',
          type: 'match-pairs',
          prompt: 'Match each operation to what it does.',
          pairs: [
            { left: 'put(key, value)', right: 'stores or overwrites a value', why: 'The write path.' },
            { left: 'get(key)', right: 'returns the value or not found', why: 'The read path.' },
            { left: 'delete(key)', right: 'writes a tombstone', why: 'A replica that missed the delete must not bring the value back.' },
          ],
          explain: 'The tombstone is removed later, once every replica has seen it.',
        },
        {
          id: 'wkv-3-2',
          type: 'predict-output',
          prompt: 'get returns a version, and put can require it, so a write based on a stale read is refused. What does this print?',
          code: `store = {"cart:7": ("socks", 4)}
def put(k, v, expect):
    _, ver = store.get(k, (None, 0))
    if ver != expect:
        return "conflict"
    store[k] = (v, ver + 1)
    return "ok"
print(put("cart:7", "hat", 3),
      put("cart:7", "hat", 4))`,
          answer: 'conflict ok',
          typedWrong: [{ answer: 'ok ok', why: 'Version 3 is stale: the key is at version 4.' }],
          explain: 'A conditional put lets clients read, modify and write without losing each other\'s updates.',
        },
        {
          id: 'wkv-3-3',
          type: 'mcq',
          prompt: 'A client calls get with consistency "quorum". What does that mean with three copies?',
          options: [
            { text: 'Wait for two of three replies' },
            { text: 'Read the nearest copy only', why: 'That is level "one": fast, possibly stale.' },
            { text: 'Wait for all three copies', why: 'That is level "all": one slow machine stalls it.' },
          ],
          answer: 0,
          explain: 'A quorum is a majority: two of three.',
        },
      ],
      strong: 'put, get and delete by key; get returns a version that put can require, deletes write tombstones, and each request may name a consistency level: one, quorum or all.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Choose how keys spread across machines and where each key\'s copies live.',
      exercises: [
        {
          id: 'wkv-4-1',
          type: 'scenario',
          prompt: 'How do you spread keys across 20 machines?',
          situation: 'Machines join as the cluster grows and leave when they fail.',
          needs: ['An even spread', 'Few keys move when a machine is added'],
          options: [
            { text: 'Consistent hashing, virtual nodes', cost: 'A ring to maintain and share.' },
            {
              text: 'hash(key) mod machine count',
              cost: 'One line of code.',
              why: 'Adding a machine moves almost every key (S6).',
            },
            {
              text: 'Key ranges by first letter',
              cost: 'Easy range scans.',
              why: 'Popular letters overload some machines.',
            },
          ],
          answer: 0,
          explain: 'Virtual nodes give each machine many small slices, so load evens out.',
        },
        {
          id: 'wkv-4-2',
          type: 'predict-output',
          prompt: 'With mod-N placement, the cluster grows from 4 to 5 machines. How many of 1,000 keys move?',
          code: `keys = range(1000)
a = [k % 4 for k in keys]
b = [k % 5 for k in keys]
moved = sum(x != y
            for x, y in zip(a, b))
print(moved)`,
          answer: '800',
          typedWrong: [
            { answer: '200', why: '200 is how many stay put; 800 move.' },
            { answer: '250', why: 'Not a quarter: only keys where k % 4 equals k % 5 stay.' },
          ],
          explain: 'Mod-N moves about 80% of keys; consistent hashing moves about a fifth.',
        },
        {
          id: 'wkv-4-3',
          type: 'mcq',
          prompt: 'Where do a key\'s three copies go?',
          options: [
            { text: 'The next three machines on the ring' },
            { text: 'Three machines picked at random', why: 'Then every lookup needs a directory of where copies are.' },
            { text: 'Three copies on one machine', why: 'One machine failing loses all three.' },
          ],
          answer: 0,
          explain: 'Skip virtual nodes of a machine already chosen, and prefer different racks.',
        },
      ],
      strong: 'Consistent hashing with virtual nodes spreads keys and moves few on resize; each key lives on the next three distinct machines on the ring, stored as (value, version), with deletes as tombstones.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Any node can take a request and coordinate it for that key.',
      exercises: [
        {
          id: 'wkv-5-1',
          type: 'diagram',
          prompt: 'Something must find the key\'s replicas and wait for a quorum. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Clients' },
              { id: 'lb', kind: 'lb', label: 'Load bal.' },
              { id: 's', kind: 'service', label: 'Coordinator' },
              { id: 'a', kind: 'db', label: 'Node A' },
              { id: 'b', kind: 'db', label: 'Node B' },
              { id: 'd', kind: 'db', label: 'Node C' },
            ],
            edges: [
              { from: 'c', to: 'lb' },
              { from: 'lb', to: 's' },
              { from: 's', to: 'a' },
              { from: 's', to: 'b' },
              { from: 's', to: 'd' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 's',
            options: [
              { kind: 'service', label: 'Coordinator' },
              { kind: 'queue', label: 'Queue', why: 'A get needs its answer now, not later.' },
              { kind: 'cache', label: 'Cache', why: 'A cache stores values; it does not gather replies from replicas.' },
            ],
            answer: 0,
          },
          explain: 'Any node can coordinate; the one that receives the request does.',
        },
        {
          id: 'wkv-5-2',
          type: 'diagram',
          prompt: 'A put whose first copy belongs on Node A. Tap its path from the client to Node A.',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Clients' },
              { id: 'lb', kind: 'lb', label: 'Load bal.' },
              { id: 's', kind: 'service', label: 'Coordinator' },
              { id: 'a', kind: 'db', label: 'Node A' },
              { id: 'b', kind: 'db', label: 'Node B' },
              { id: 'd', kind: 'db', label: 'Node C' },
            ],
            edges: [
              { from: 'c', to: 'lb' },
              { from: 'lb', to: 's' },
              { from: 's', to: 'a' },
              { from: 's', to: 'b' },
              { from: 's', to: 'd' },
            ],
          },
          goal: { kind: 'path', answer: ['c', 'lb', 's', 'a'] },
          explain: 'The coordinator sends the same put to B and C at the same time.',
        },
        {
          id: 'wkv-5-3',
          type: 'mcq',
          prompt: 'How does the coordinator know which machines hold a key?',
          options: [
            { text: 'Every node keeps the ring map' },
            { text: 'It asks a central directory', why: 'A directory on every request is a bottleneck and a single point of failure.' },
            { text: 'It tries every machine in turn', why: 'Slow, and it gets slower as the cluster grows.' },
          ],
          answer: 0,
          explain: 'Nodes share membership by gossip, so the map spreads without a central server.',
        },
      ],
      strong: 'Clients → load balancer → any node acting as coordinator, which finds the key\'s three replicas from its copy of the ring, sends the request to all three and answers once the quorum replies.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Clients' },
          { id: 'lb', kind: 'lb', label: 'Load bal.' },
          { id: 's', kind: 'service', label: 'Coordinator' },
          { id: 'a', kind: 'db', label: 'Node A' },
          { id: 'b', kind: 'db', label: 'Node B' },
          { id: 'd', kind: 'db', label: 'Node C' },
        ],
        edges: [
          { from: 'c', to: 'lb' },
          { from: 'lb', to: 's' },
          { from: 's', to: 'a' },
          { from: 's', to: 'b' },
          { from: 's', to: 'd' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: copies that disagree, because a replica was down or the network split.',
      exercises: [
        {
          id: 'wkv-6-1',
          type: 'predict-output',
          prompt: 'A read is sure to overlap the latest write when R + W > N. Which settings guarantee it?',
          code: `N = 3
for R, W in [(1, 1), (2, 2), (1, 3)]:
    print(R, W, R + W > N)`,
          answer: '1 1 False\n2 2 True\n1 3 True',
          typedWrong: [{ answer: '1 1 False\n2 2 True\n1 3 False', why: '1 + 3 = 4 > 3: when every copy is written, any one read sees it.' }],
          explain: 'R = W = 2 is the usual balance; W = 3 makes writes fail when any copy is down.',
        },
        {
          id: 'wkv-6-2',
          type: 'scenario',
          prompt: 'Node C is down during a put with W = 2. What happens to its copy?',
          situation: 'Nodes A and B acknowledged the put. C comes back in ten minutes.',
          needs: ['The put succeeds', 'C catches up afterwards'],
          options: [
            { text: 'Hinted handoff, then repair', cost: 'A neighbour holds C\'s writes for a while.' },
            {
              text: 'Fail the put until C is back',
              cost: 'Every copy is always identical.',
              why: 'W = 2 was met; failing the put gives up availability for nothing.',
            },
            {
              text: 'Ignore it; C stays behind',
              cost: 'Nothing extra to build.',
              why: 'C would serve stale values from then on.',
            },
          ],
          answer: 0,
          explain: 'Background anti-entropy, comparing hash trees, catches anything the hints missed.',
        },
        {
          id: 'wkv-6-3',
          type: 'mcq',
          prompt: 'During a split, two clients updated the same cart on different sides. Now two versions exist. What do you do?',
          options: [
            { text: 'Keep both; the app merges' },
            { text: 'Keep the later clock time', why: 'Clocks drift, and last-write-wins can silently drop an item.' },
            { text: 'Delete both, start over', why: 'Losing the cart is the worst outcome.' },
          ],
          answer: 0,
          explain: 'Version vectors show the two are concurrent; a cart merges by taking the union (S7).',
        },
      ],
      strong: 'R + W > N gives overlapping quorums (two and two of three is typical); hinted handoff keeps writes available while a replica is down, anti-entropy repairs it later, and version vectors detect concurrent writes so the app can merge them.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Push it to ten times the data, and to one very hot key.',
      exercises: [
        {
          id: 'wkv-7-1',
          type: 'scenario',
          prompt: 'One key is read 50,000 times a second.',
          situation: 'Its three replicas can serve about 10,000 a second each.',
          needs: ['Serve the hot key', 'Other keys unaffected'],
          options: [
            { text: 'Cache it briefly in front', cost: 'Reads may be a moment stale.' },
            {
              text: 'Add twenty more machines',
              cost: 'More hardware to run.',
              why: 'The key still lives on the same three machines.',
            },
          ],
          answer: 0,
          explain: 'A short cache (S4) or extra read replicas for that key spread the load.',
        },
        {
          id: 'wkv-7-2',
          type: 'mcq',
          prompt: 'The data grows ten times, to 300 TB with copies. What changes?',
          options: [
            { text: 'Add machines; the ring rebalances' },
            { text: 'Buy machines with bigger disks', why: 'Vertical scaling hits a ceiling and makes each failure costlier.' },
            { text: 'Drop to one copy per key', why: 'Saves space, but one failure then loses data.' },
          ],
          answer: 0,
          explain: 'With virtual nodes, each new machine takes a little from many others.',
        },
        {
          id: 'wkv-7-3',
          type: 'bucket-sort',
          prompt: 'Which data suits R = 1, W = 1, and which needs quorums?',
          buckets: ['R=1, W=1', 'Quorum'],
          items: [
            { text: 'Session data', bucket: 0, why: 'A stale session for a moment is harmless.' },
            { text: 'Shopping-cart reads', bucket: 0, why: 'Speed matters more; carts merge later.' },
            { text: 'Account balances', bucket: 1, why: 'A stale balance can let money be spent twice.' },
            { text: 'Feature-flag cache', bucket: 0, why: 'A flag a moment out of date does no harm.' },
            { text: 'Stock left to sell', bucket: 1, why: 'Overselling costs money and trust.' },
            { text: 'Password changes', bucket: 1, why: 'An old password must stop working at once.' },
          ],
          explain: 'Choose R and W by what a stale read would cost.',
        },
      ],
      strong: 'Names hot keys and growth: hot keys get a short cache in front, growth adds machines that take virtual nodes from many others, and each team picks R and W by what a stale read would cost.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'c', kind: 'client', label: 'Clients' },
        { id: 'lb', kind: 'lb', label: 'Load bal.' },
        { id: 's', kind: 'service', label: 'Coordinator' },
        { id: 'a', kind: 'db', label: 'Node A' },
        { id: 'b', kind: 'db', label: 'Node B' },
        { id: 'd', kind: 'db', label: 'Node C' },
      ],
      edges: [
        { from: 'c', to: 'lb' },
        { from: 'lb', to: 's' },
        { from: 's', to: 'a', label: 'N=3' },
        { from: 's', to: 'b' },
        { from: 's', to: 'd' },
      ],
    },
    decisions: [
      'Consistent hashing with virtual nodes; each key on the next three machines on the ring.',
      'Any node coordinates; quorums with R + W > N, usually two and two of three.',
      'Stays available in a split; version vectors detect conflicts and the app merges.',
      'Hinted handoff while a replica is down; anti-entropy repairs it later.',
      'About 20 machines for 30 TB with copies; hot keys get a short cache in front.',
    ],
  },
  blank: {
    requirements: [
      'get, put and delete by key, values up to 10 KB',
      'Stays available when machines fail or the network splits',
      'A few milliseconds per request',
      'Consistency tunable per request',
      'Grows by adding machines',
    ],
    components: ['client', 'lb', 'service', 'db'],
    firstFive: [
      'Ask the value size, read/write mix and total data',
      'Ask whether availability or consistency wins during a split',
      'Estimate storage with copies and the machines it needs',
      'Choose partitioning: consistent hashing with virtual nodes',
      'Choose replication and quorums before drawing boxes',
    ],
  },
};
