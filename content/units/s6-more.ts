import type { Lesson } from '../schema';

/* S6 lessons 6 to 11: why partition, range or hash, choosing a shard key,
 * hot keys, consistent hashing, checkpoint. */

const USERS = Array.from({ length: 16 }, (_, i) => `user${i + 1}`);

export const s6More: Lesson[] = [
  // ------------------------------------------------------------------ 6
  {
    id: 's6-06',
    title: 'Why partition',
    summary: 'When data or writes outgrow one machine, split them into shards, each on its own machines.',
    card: {
      title: 'Why partition',
      text: 'Replication copies all the data to every node, so it cannot help when the data or the write load is too big for one machine. Partitioning, or sharding, splits the data so each shard holds a part of it on its own machines. Each shard is usually replicated too, and something must route every request to the right shard.',
      code: `def shard(user_id, n=4):
    return user_id % n

print([shard(u) for u in (1, 2, 5)])`,
      output: '[1, 2, 1]',
    },
    exercises: [
      {
        id: 's6-6-1',
        type: 'estimate',
        prompt: '40 TB of data; each database machine should hold at most 2 TB to leave headroom. How many shards?',
        expr: '40 / 2',
        answer: 20,
        tolerance: 1.3,
        unit: 'shards',
        options: [
          { value: 2, why: '40 TB at 2 TB each is 20.' },
          { value: 20 },
          { value: 80, why: 'Divide 40 by 2, do not multiply.' },
        ],
        work: ['40 TB ÷ 2 TB per shard = 20 shards', 'Each replicated, say 3 copies: 60 machines'],
        explain: 'Storage is often what forces sharding first.',
      },
      {
        id: 's6-6-2',
        type: 'bucket-sort',
        prompt: 'Which does each solve?',
        buckets: ['Replication', 'Partitioning'],
        items: [
          { text: 'Too many reads for one machine', bucket: 0, why: 'Followers add read capacity.' },
          { text: 'Too much data for one machine', bucket: 1, why: 'Each shard holds part of it.' },
          { text: 'Surviving a machine dying', bucket: 0, why: 'Copies take over.' },
          { text: 'Too many writes for one leader', bucket: 1, why: 'Each shard has its own leader.' },
          { text: 'Faster reads near users abroad', bucket: 0, why: 'Followers in other regions serve local reads.' },
        ],
        explain: 'Big systems use both: shards, each replicated.',
      },
      {
        id: 's6-6-3',
        type: 'scenario',
        prompt: 'Shard now?',
        situation: 'One database holds 300 GB and takes 500 writes/s. It is at 40% CPU and growing 5% a month.',
        needs: ['Room for the next year', 'Least complexity'],
        options: [
          {
            text: 'Not yet: scale up, add replicas',
            cost: 'A bigger machine eventually.',
          },
          {
            text: 'Shard into 8 today',
            cost: 'Routing, cross-shard queries, harder operations.',
            why: 'The numbers fit one machine for a long time; sharding costs a lot.',
          },
          {
            text: 'Move to a key-value store',
            cost: 'A rewrite.',
            why: 'Nothing here needs it.',
          },
        ],
        answer: 0,
        explain: 'Shard when you must, and plan the key early.',
      },
      {
        id: 's6-6-4',
        type: 'predict-output',
        prompt: 'Users routed to 3 shards by id. How many land on each?',
        code: `from collections import Counter
ids = range(1, 10)
c = Counter(i % 3 for i in ids)
print(sorted(c.values()))`,
        answer: '[3, 3, 3]',
        typedWrong: [{ answer: '[9]', why: 'i % 3 spreads ids over 0, 1 and 2.' }],
        explain: 'Even spread for sequential ids.',
      },
      {
        id: 's6-6-5',
        type: 'diagram',
        prompt: 'A request for user 42. Tap the path, in order.',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'r', kind: 'service', label: 'Router' },
            { id: 's1', kind: 'db', label: 'Shard 1' },
            { id: 's2', kind: 'db', label: 'Shard 2' },
            { id: 's3', kind: 'db', label: 'Shard 3' },
          ],
          edges: [
            { from: 'a', to: 'r' },
            { from: 'r', to: 's1' },
            { from: 'r', to: 's2' },
            { from: 'r', to: 's3' },
          ],
        },
        goal: { kind: 'path', answer: ['a', 'r', 's1'] },
        explain: '42 % 3 = 0: the first shard. The router (or a library in the app) applies the rule.',
      },
      {
        id: 's6-6-6',
        type: 'mcq',
        prompt: 'What becomes harder once data is sharded?',
        options: [
          { text: 'Cross-shard queries' },
          { text: 'Reading one user\'s data', why: 'One user lives on one shard: that stays easy.' },
          { text: 'Writing a row', why: 'A write goes to one shard\'s leader as before.' },
        ],
        answer: 0,
        explain: 'A join across shards means asking several machines and combining.',
      },
      {
        id: 's6-6-7',
        type: 'fill-blank',
        prompt: 'Route a user to one of 4 shards.',
        code: `def shard(user_id, n=4):
    return user_id ___ n

print(shard(13))`,
        answer: ['%'],
        distractors: [{ text: '//', why: '13 // 4 is 3, and bigger ids would give shards that do not exist.' }],
        expectOutput: '1',
        explain: 'The remainder is always 0 to n − 1.',
      },
      {
        id: 's6-6-8',
        type: 'order-steps',
        prompt: 'A write to a sharded, replicated database. Put it in order.',
        steps: [
          'The router computes the user\'s shard',
          'The write goes to that shard\'s leader',
          'The leader copies it to its followers',
          'The app gets its confirmation',
        ],
        explain: 'Sharding picks the machine group; replication protects it.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's6-07',
    title: 'Range or hash',
    summary: 'Range partitioning keeps ranges together but can run hot; hash spreads evenly but scatters ranges.',
    card: {
      title: 'Range or hash',
      text: 'Range partitioning gives each shard a range of keys (A to F, G to M, and so on), so range queries stay on few shards, but busy ranges such as today\'s dates make one shard hot. Hash partitioning places keys by a hash, which spreads load evenly, but a range query must then ask every shard. Pick by your most common queries.',
      code: `import bisect
bounds = ["g", "n", "t"]  # 4 shards
for name in ["ana", "kim", "zoe"]:
    i = bisect.bisect(bounds, name)
    print(name, i)`,
      output: 'ana 0\nkim 1\nzoe 3',
    },
    exercises: [
      {
        id: 's6-7-1',
        type: 'predict-output',
        prompt: 'Range shards split at "g", "n" and "t". Which shard holds "olga"?',
        code: `import bisect
bounds = ["g", "n", "t"]
print(bisect.bisect(bounds, "olga"))`,
        answer: '2',
        typedWrong: [{ answer: '1', why: '"olga" sorts after "n" and before "t": shard 2.' }],
        explain: 'Shards 0 to 3: before g, g to n, n to t, after t.',
      },
      {
        id: 's6-7-2',
        type: 'bucket-sort',
        prompt: 'Range or hash partitioning?',
        buckets: ['Range', 'Hash'],
        items: [
          { text: '"All orders from last week" on few shards', bucket: 0, why: 'Neighbouring keys sit together.' },
          { text: 'Even load with no tuning', bucket: 1, why: 'Hashes scatter keys evenly.' },
          { text: 'Today\'s writes all on one shard', bucket: 0, why: 'Time-ordered keys pile onto the newest range.' },
          { text: 'A range query asks every shard', bucket: 1, why: 'Neighbouring keys are scattered.' },
          { text: 'Busy ranges split in two as they grow', bucket: 0, why: 'Range shards are rebalanced by splitting key ranges.' },
        ],
        explain: 'Range keeps order; hash keeps balance.',
      },
      {
        id: 's6-7-3',
        type: 'scenario',
        prompt: 'How do you partition device readings?',
        situation: 'IoT devices write readings constantly. Dashboards show one device\'s last day.',
        needs: ['Writes spread over all shards', 'One device\'s data in one place'],
        options: [
          {
            text: 'Hash of device id, sorted by time',
            cost: 'Queries across all devices touch every shard.',
          },
          {
            text: 'Range-partition by timestamp',
            cost: 'Simple time-range scans.',
            why: 'All current writes hit the newest range: one hot shard.',
          },
          {
            text: 'Range-partition by device name',
            cost: 'Ranges need rebalancing as devices are added.',
            why: 'Defensible, but uneven name prefixes create hot ranges; hashing avoids that.',
          },
        ],
        answer: 0,
        explain: 'The wide-column pattern from S5: partition key device, sort key time.',
      },
      {
        id: 's6-7-4',
        type: 'estimate',
        prompt: 'Data is hash-partitioned over 16 shards. A query for "orders between two dates" must ask how many shards?',
        expr: '16',
        answer: 16,
        tolerance: 1.1,
        unit: 'shards',
        options: [
          { value: 1, why: 'Hashing scatters dates over every shard.' },
          { value: 16 },
          { value: 4, why: 'No way to know which shards hold those dates: all 16.' },
        ],
        work: ['Hash placement ignores order: every shard may hold matching rows'],
        explain: 'Called scatter-gather: the slowest shard sets the speed.',
      },
      {
        id: 's6-7-5',
        type: 'predict-output',
        prompt: 'Order ids that increase over time, range-partitioned in blocks of 1,000. Which shards get today\'s orders 5000 to 5003?',
        code: `today = range(5000, 5004)
print({i // 1000 for i in today})`,
        answer: '{5}',
        typedWrong: [{ answer: '{0, 1, 2, 3}', why: 'Integer division by 1,000 puts all four in block 5.' }],
        explain: 'Every new order lands on the newest shard: hot.',
      },
      {
        id: 's6-7-6',
        type: 'mcq',
        prompt: 'Why can a range partition become unbalanced over time?',
        options: [
          { text: 'Data piles into some ranges' },
          { text: 'Hashes change', why: 'Range partitioning does not use hashes.' },
          { text: 'Shards forget their ranges', why: 'The ranges stay; the data in them grows unevenly.' },
        ],
        answer: 0,
        explain: 'Systems split busy ranges as they grow.',
      },
      {
        id: 's6-7-7',
        type: 'fill-blank',
        prompt: 'Find the range shard.',
        code: `import bisect
bounds = ["g", "n", "t"]
print(bisect.___(bounds, "hugo"))`,
        answer: ['bisect'],
        distractors: [{ text: 'insort', why: 'insort inserts into the list; it does not return a position.' }],
        expectOutput: '1',
        explain: '"hugo" is between "g" and "n".',
      },
      {
        id: 's6-7-8',
        type: 'diagram',
        prompt: 'Orders are range-partitioned by date. Which shard is the busiest right now?',
        diagram: {
          nodes: [
            { id: 'r', kind: 'service', label: 'Router' },
            { id: 'a', kind: 'db', label: 'Jan-Apr' },
            { id: 'b', kind: 'db', label: 'May-Aug' },
            { id: 'c', kind: 'db', label: 'Sep-Dec' },
          ],
          edges: [
            { from: 'r', to: 'a' },
            { from: 'r', to: 'b' },
            { from: 'r', to: 'c' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'c',
          why: {
            r: 'The router only forwards.',
            a: 'Old orders are rarely written or read.',
            b: 'Past months: only occasional reads.',
          },
        },
        explain: 'It is November: every new order goes to Sep-Dec.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's6-08',
    title: 'Choosing a shard key',
    summary: 'A good shard key spreads data and load evenly and keeps each common query on one shard.',
    card: {
      title: 'Choosing a shard key',
      text: 'A good shard key spreads data and traffic evenly and keeps each common query on one shard. For user-centred apps, the user id is the usual choice: one user\'s data lives together. Keys with few values (country) or ever-increasing values (timestamps) make hot shards.',
      code: `from collections import Counter
users = ["PT"] * 6 + ["ES", "FR"]
print(Counter(users).most_common(1))`,
      output: "[('PT', 6)]",
    },
    exercises: [
      {
        id: 's6-8-9',
        type: 'figure',
        prompt: 'Orders from a shop whose customers are mostly in Portugal. Pick the shard key so no shard carries over 40% and each user\'s orders sit on one shard.',
        figure: {
          kind: 'shard',
          fields: ['user', 'country', 'order'],
          rows: [
            ['ana', 'PT', 'o1'], ['ana', 'PT', 'o2'], ['ben', 'PT', 'o3'], ['ben', 'PT', 'o4'],
            ['dev', 'ES', 'o5'], ['dev', 'PT', 'o6'], ['eli', 'PT', 'o7'], ['eli', 'FR', 'o8'],
            ['caz', 'PT', 'o9'], ['caz', 'PT', 'o10'], ['kim', 'PT', 'o11'], ['kim', 'ES', 'o12'],
          ],
          key: 'country',
          shards: 3,
          goal: { maxShare: 0.4, local: 'user' },
        },
        explain: 'Country piles 9 of 12 rows on one shard. Order id spreads them but scatters each user\'s orders. User id does both: 4, 4 and 4, with each user in one place.',
      },
      {
        id: 's6-8-10',
        type: 'figure',
        prompt: 'Most of these orders were placed today. Find the key that makes one shard hot.',
        figure: {
          kind: 'shard',
          fields: ['user', 'day'],
          rows: [
            ['ana', 'today'], ['ana', 'today'], ['ben', 'today'], ['ben', 'today'],
            ['dev', 'today'], ['dev', 'today'], ['eli', 'today'], ['eli', 'today'],
            ['caz', 'today'], ['caz', 'mon'], ['kim', 'tue'], ['kim', 'wed'],
          ],
          key: 'user',
          shards: 3,
          goal: { hot: true },
        },
        explain: 'By date, every one of today\'s writes lands on the same shard while the others sit idle: the timestamp trap from the card.',
      },
      {
        id: 's6-8-1',
        type: 'bucket-sort',
        prompt: 'A good shard key for a social app\'s posts?',
        buckets: ['Good', 'Poor'],
        items: [
          { text: 'Author user id', bucket: 0, why: 'Many values, spread evenly; a user\'s posts together.' },
          { text: 'Country', bucket: 1, why: 'Few values, very uneven sizes.' },
          { text: 'Creation timestamp', bucket: 1, why: 'All new posts go to one shard.' },
          { text: 'Post id (random)', bucket: 0, why: 'Even spread, though a user\'s posts scatter.' },
          { text: 'Is the post public: yes or no', bucket: 1, why: 'Two values: two shards at most.' },
        ],
        explain: 'Many values, even spread, matching your queries.',
      },
      {
        id: 's6-8-2',
        type: 'scenario',
        prompt: 'What is the shard key for a chat app\'s messages?',
        situation: 'The main query is "the last 50 messages in this conversation".',
        needs: ['That query hits one shard', 'Even spread'],
        options: [
          {
            text: 'Conversation id',
            cost: 'A very busy conversation can still run hot.',
          },
          {
            text: 'Sender id',
            cost: 'Even spread.',
            why: 'One conversation\'s messages scatter over many shards.',
          },
          {
            text: 'Message time',
            cost: 'Simple to build.',
            why: 'Every new message goes to the newest shard.',
          },
        ],
        answer: 0,
        explain: 'Shard by what the main query filters on.',
      },
      {
        id: 's6-8-3',
        type: 'predict-output',
        prompt: 'Users sharded by country. What share of users is on the busiest shard?',
        code: `from collections import Counter
users = ["PT"] * 6 + ["ES", "FR"]
top = Counter(users).most_common(1)
print(top[0][1] / len(users))`,
        answer: '0.75',
        typedWrong: [{ answer: '0.33', why: 'Six of eight users are in Portugal.' }],
        explain: 'Three shards, but one does three quarters of the work.',
      },
      {
        id: 's6-8-4',
        type: 'mcq',
        prompt: 'Users are sharded by user id. Which query becomes expensive?',
        options: [
          { text: '"All users who signed up today"' },
          { text: '"This user\'s orders"', why: 'One user lives on one shard: cheap.' },
          { text: '"Update this user\'s email"', why: 'One shard, one row.' },
        ],
        answer: 0,
        explain: 'It must ask every shard, or use a separate index kept elsewhere.',
      },
      {
        id: 's6-8-5',
        type: 'estimate',
        prompt: 'A query must ask all 20 shards; each answers in 30 ms at p50, but the query waits for the slowest. If each shard is slow (300 ms) 1% of the time, how often is the query slow?',
        expr: '(1 - 0.99 ** 20) * 100',
        answer: 18.2,
        tolerance: 1.4,
        unit: '%',
        options: [
          { value: 1, why: 'Waiting on 20 shards makes the tail 20 times more likely.' },
          { value: 18.2 },
          { value: 99, why: '0.99²⁰ ≈ 0.82 of queries see no slow shard.' },
        ],
        work: ['P(no shard slow) = 0.99²⁰ ≈ 0.82', 'P(slow) ≈ 18%'],
        explain: 'The fan-out tail from S1, again.',
      },
      {
        id: 's6-8-6',
        type: 'fill-blank',
        prompt: 'Shard by the user, so their data stays together.',
        code: `def shard(order, n=8):
    return hash(order[___]) % n

o1 = {"user": 7, "id": 1}
o2 = {"user": 7, "id": 2}
print(shard(o1) == shard(o2))`,
        answer: ['"user"'],
        distractors: [{ text: '"id"', why: 'Different order ids send one user\'s orders to different shards.' }],
        expectOutput: 'True',
        explain: 'Both orders of user 7 land together.',
      },
      {
        id: 's6-8-7',
        type: 'scenario',
        prompt: 'A marketplace shards orders by buyer. Sellers want "my orders today". What do you do?',
        situation: 'Buyer pages are the busiest; seller dashboards are used by 2% of users.',
        needs: ['Buyer pages stay on one shard', 'Seller dashboards fast enough'],
        options: [
          {
            text: 'Keep buyer key; add a seller index',
            cost: 'A second copy to keep in step.',
          },
          {
            text: 'Re-shard by seller',
            cost: 'A huge migration.',
            why: 'Then the busiest page, the buyer\'s, scatters.',
          },
          {
            text: 'Seller queries ask every shard',
            cost: 'Slow dashboards and load on all shards.',
            why: 'Works, but against "fast enough".',
          },
        ],
        answer: 0,
        explain: 'Shard for the main access path; serve others from derived data.',
      },
      {
        id: 's6-8-8',
        type: 'mcq',
        prompt: 'Why is changing the shard key later so painful?',
        options: [
          { text: 'Nearly all data must move' },
          { text: 'It needs a new database product', why: 'Same database; the data must be redistributed.' },
          { text: 'Keys cannot be changed', why: 'They can; it just means moving data while serving traffic.' },
        ],
        answer: 0,
        explain: 'Choose carefully, early.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's6-09',
    title: 'Hot keys',
    summary: 'A few giant keys overload one shard; cache them, split them into sub-keys, or isolate them.',
    card: {
      title: 'Hot keys',
      text: 'Even a good shard key has a few giant values: a celebrity\'s account, a viral product. One shard then takes most of the load. Fixes: cache the hot key in front, split it across sub-keys (key#0 to key#9) and combine on read, or give it its own shard.',
      code: `def sub_key(key, i, n=10):
    return f"{key}#{i % n}"

print(sub_key("celebrity", 23))`,
      output: 'celebrity#3',
    },
    exercises: [
      {
        id: 's6-9-9',
        type: 'figure',
        prompt: 'A celebrity\'s posts get six times the traffic of anyone else\'s. Bring the busiest shard down to 40% of the load or less.',
        figure: {
          kind: 'shard',
          fields: ['author', 'post'],
          rows: [['star', 'p1'], ['star', 'p2'], ['star', 'p3'], ['star', 'p4'], ['ana', 'p5'], ['ben', 'p6'], ['caz', 'p7'], ['dev', 'p8']],
          load: [6, 6, 6, 6, 1, 1, 1, 1],
          key: 'author',
          shards: 4,
          goal: { maxShare: 0.4 },
        },
        explain: 'By post id, the celebrity\'s posts spread over every shard. The cost: one author\'s posts are no longer together, so "all posts by star" asks every shard.',
      },
      {
        id: 's6-9-1',
        type: 'predict-output',
        prompt: 'Likes on one viral post, spread over 4 sub-keys. How many writes does each get?',
        code: `from collections import Counter
writes = [f"post9#{i % 4}"
          for i in range(1000)]
print(set(Counter(writes).values()))`,
        answer: '{250}',
        typedWrong: [{ answer: '{1000}', why: 'The writes are spread over 4 sub-keys.' }],
        explain: 'Reading the total means adding 4 counters: a small price.',
      },
      {
        id: 's6-9-2',
        type: 'estimate',
        prompt: 'A post gets 40,000 likes a second; one key can take about 5,000 writes a second. How many sub-keys?',
        expr: '40000 / 5000',
        answer: 8,
        tolerance: 1.3,
        unit: 'sub-keys',
        work: ['40,000 ÷ 5,000 = 8 sub-keys'],
        explain: 'Spread over 8, each takes a manageable 5,000.',
      },
      {
        id: 's6-9-3',
        type: 'scenario',
        prompt: 'A celebrity\'s profile is read 200,000 times a second. What do you do?',
        situation: 'Profiles are sharded by user id. The shard holding this one is overloaded; others are idle.',
        needs: ['Fast profile reads', 'Profiles change rarely'],
        options: [
          {
            text: 'Cache the hot profile in front',
            cost: 'Edits show up after the cache TTL.',
          },
          {
            text: 'Add more shards',
            cost: 'A re-sharding project.',
            why: 'The one key still lives on one shard.',
          },
          {
            text: 'Split the profile across sub-keys',
            cost: 'Reads must combine pieces.',
            why: 'Splitting helps writes; for rarely changing reads a cache is simpler.',
          },
        ],
        answer: 0,
        explain: 'Hot reads: cache. Hot writes: split.',
      },
      {
        id: 's6-9-4',
        type: 'bucket-sort',
        prompt: 'Best first fix for each hot key?',
        buckets: ['Cache it', 'Split it'],
        items: [
          { text: 'A viral video\'s page, read millions of times', bucket: 0, why: 'Hot reads of slow-changing data.' },
          { text: 'A like counter hit 50,000 times a second', bucket: 1, why: 'Hot writes: spread them.' },
          { text: 'The homepage\'s top-10 list', bucket: 0, why: 'Read by everyone, changes rarely.' },
          { text: 'A flash-sale stock counter', bucket: 1, why: 'Write-heavy: split the stock into buckets.' },
          { text: 'A famous user\'s profile', bucket: 0, why: 'Read-heavy, rarely edited.' },
        ],
        explain: 'Reads or writes decide the fix.',
      },
      {
        id: 's6-9-5',
        type: 'run-code',
        prompt: 'Write `total(counts, key, n)`: add up the sub-key counters `key#0` to `key#{n-1}` in the dict `counts` (missing ones count as 0).',
        solution: `def total(counts, key, n):
    t = 0
    for i in range(n):
        k = f"{key}#{i}"
        t += counts.get(k, 0)
    return t`,
        tests: [
          'c = {"p#0": 5, "p#1": 7, "p#3": 1}',
          'assert total(c, "p", 4) == 13, f"got {total(c, \'p\', 4)}"',
          'assert total({}, "p", 4) == 0, "nothing yet"',
        ].join('\n'),
        maxLines: 4,
        placeholder: 'def total(counts, key, n):',
        explain: 'Writes spread out; reads gather.',
      },
      {
        id: 's6-9-6',
        type: 'mcq',
        prompt: 'What does splitting a key into 10 sub-keys cost?',
        options: [
          { text: 'Reads must combine 10 pieces' },
          { text: 'Nothing at all', why: 'Every read now gathers several pieces.' },
          { text: 'Ten times the storage space', why: 'The data is split, not copied.' },
        ],
        answer: 0,
        explain: 'Worth it only for genuinely hot keys.',
      },
      {
        id: 's6-9-7',
        type: 'diagram',
        prompt: 'A celebrity posts; millions of reads follow. Which box takes the heat without protection?',
        diagram: {
          nodes: [
            { id: 'r', kind: 'service', label: 'Router' },
            { id: 'a', kind: 'db', label: 'Shard A' },
            { id: 'b', kind: 'db', label: 'Shard B VIP' },
            { id: 'c', kind: 'db', label: 'Shard C' },
          ],
          edges: [
            { from: 'r', to: 'a' },
            { from: 'r', to: 'b' },
            { from: 'r', to: 'c' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'b',
          why: {
            r: 'The router forwards quickly; the database work is in one shard.',
            a: 'Ordinary users: ordinary load.',
            c: 'Ordinary users: ordinary load.',
          },
        },
        explain: 'Every read of that profile lands on the one shard that holds it.',
      },
      {
        id: 's6-9-8',
        type: 'fill-blank',
        prompt: 'Spread writes over 4 sub-keys.',
        code: `def sub_key(key, i, n=4):
    return f"{key}#{i ___ n}"

print(sub_key("likes", 9))`,
        answer: ['%'],
        distractors: [{ text: '//', why: '9 // 4 = 2 here, but larger i keeps creating new sub-keys.' }],
        expectOutput: 'likes#1',
        explain: '9 % 4 = 1.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's6-10',
    title: 'Consistent hashing',
    summary: 'On a hash ring, adding a server moves only the keys it takes over; virtual nodes even the load.',
    card: {
      title: 'Consistent hashing',
      text: 'With hash % n, adding a server changes n and moves most keys to new servers. Consistent hashing puts servers and keys on a ring: each key belongs to the next server clockwise, so a new server takes keys only from one neighbour. Giving each server many points on the ring (virtual nodes) evens out the load.',
      figure: {
        kind: 'ring',
        keys: USERS,
        servers: 3,
        maxServers: 5,
        mode: 'ring',
        switchable: true,
      },
    },
    exercises: [
      {
        id: 's6-10-1',
        type: 'figure',
        prompt: 'Grow from 3 to 4 servers while moving at most 5 of the 16 keys.',
        figure: {
          kind: 'ring',
          keys: USERS,
          servers: 3,
          maxServers: 5,
          mode: 'mod',
          switchable: true,
          goal: { servers: 4, maxMoved: 5 },
        },
        explain: 'hash % n moves 13 of 16 keys; the ring moves only those the new server takes over.',
      },
      {
        id: 's6-10-2',
        type: 'figure',
        prompt: 'With 3 servers, one server holds far more keys than the others. Even it out to at most 45% each.',
        figure: {
          kind: 'ring',
          keys: USERS,
          servers: 3,
          maxServers: 3,
          mode: 'ring',
          vnodes: [1, 16],
          goal: { servers: 3, maxShare: 0.45 },
        },
        explain: 'Sixteen points per server cut the ring into many small arcs, so luck evens out.',
      },
      {
        id: 's6-10-3',
        type: 'predict-output',
        prompt: 'hash % n: how many of 100 keys change server when n goes from 4 to 5?',
        code: `moved = sum(k % 4 != k % 5
            for k in range(100))
print(moved)`,
        answer: '80',
        typedWrong: [{ answer: '20', why: 'That is what consistent hashing would move; modulo moves most keys.' }],
        explain: 'Only keys with the same remainder for 4 and 5 stay.',
      },
      {
        id: 's6-10-4',
        type: 'estimate',
        prompt: 'A ring with 4 servers holds 1 million keys. A fifth is added. About how many keys move?',
        expr: '1e6 / 5',
        answer: 200000,
        tolerance: 1.5,
        unit: 'keys',
        options: [
          { value: 800000, why: 'That is modulo; the ring moves about 1/5.' },
          { value: 200000 },
          { value: 20000, why: 'That is 2%; the new server takes its fair share, a fifth.' },
        ],
        work: ['The new server takes its fair share: 1/5 of the keys', '10⁶ ÷ 5 = 200,000'],
        explain: 'The minimum possible: only what the new server must own.',
      },
      {
        id: 's6-10-5',
        type: 'mcq',
        prompt: 'Why do caches and key-value stores care so much about moving few keys?',
        options: [
          { text: 'Moved keys must be refilled' },
          { text: 'Moving keys deletes them', why: 'They are copied or refetched, at a cost.' },
          { text: 'Hashes are slow to compute', why: 'Hashing is cheap; moving data is not.' },
        ],
        answer: 0,
        explain: 'For a cache, 80% moved means an 80% miss storm.',
      },
      {
        id: 's6-10-6',
        type: 'fill-blank',
        prompt: 'Find the owner: the first point at or after the key, wrapping round.',
        code: `import bisect
ring = [(0.2, "A"), (0.5, "B"),
        (0.9, "C")]
pos = [p for p, _ in ring]
i = bisect.bisect_left(pos, 0.95)
print(ring[i % ___][1])`,
        answer: ['len(ring)'],
        distractors: [{ text: '2', why: 'Wrapping must use the number of points, 3.' }],
        expectOutput: 'A',
        explain: 'Past the last point, wrap to the first.',
      },
      {
        id: 's6-10-7',
        type: 'scenario',
        prompt: 'Which placement for a cache cluster that grows and shrinks?',
        situation: 'A cache runs on 6 to 12 servers depending on load; servers are added and removed daily.',
        needs: ['Few cache misses when servers change', 'Even load'],
        options: [
          {
            text: 'Hash ring with virtual nodes',
            cost: 'A ring to maintain in every client.',
          },
          {
            text: 'hash % n',
            cost: 'Trivial to code.',
            why: 'Each change moves most keys: a miss storm every day.',
          },
          {
            text: 'Ring without virtual nodes',
            cost: 'A simple ring.',
            why: 'Few points per server give uneven arcs and uneven load.',
          },
        ],
        answer: 0,
        explain: 'Used by Dynamo-style stores and many cache clients.',
      },
      {
        id: 's6-10-8',
        type: 'bucket-sort',
        prompt: 'hash % n or a hash ring?',
        buckets: ['hash % n', 'Hash ring'],
        items: [
          { text: 'Moves most keys when n changes', bucket: 0, why: 'Every remainder changes.' },
          { text: 'A new server takes keys from neighbours only', bucket: 1, why: 'Only its arc changes owner.' },
          { text: 'Simplest to write', bucket: 0, why: 'One line of code.' },
          { text: 'Virtual nodes even out the load', bucket: 1, why: 'Many points per server.' },
          { text: 'Fine when n never changes', bucket: 0, why: 'Then nothing ever moves.' },
        ],
        explain: 'Fixed shard count: modulo is fine. Changing membership: ring.',
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    id: 's6-11',
    title: 'Checkpoint: replication and partitioning',
    summary: 'Replicas, lag, read-your-writes, sync or async, failover, shards, keys, hot keys and rings, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's6-11-1',
        type: 'predict-output',
        prompt: 'What do the leader and the follower return?',
        code: `sim.clock.reset()
rs = sim.Replicas(1, lag=2.0)
rs.write("v", 3)
sim.clock.advance(1)
print(rs.read("v", 0),
      rs.read("v", 1))`,
        answer: '3 None',
        typedWrong: [{ answer: '3 3', why: 'After 1 s the follower, 2 s behind, has nothing yet.' }],
        explain: 'Replication lag.',
      },
      {
        id: 's6-11-2',
        type: 'scenario',
        prompt: 'Users see their old avatar right after uploading a new one. Fix?',
        situation: 'Avatar URLs are read from followers.',
        needs: ['Uploaders see their new avatar at once', 'Most reads stay on followers'],
        options: [
          {
            text: 'Leader reads just after own write',
            cost: 'A little routing logic.',
          },
          {
            text: 'Make all followers synchronous',
            cost: 'Every write waits for every follower.',
            why: 'Heavy-handed; the problem is only the uploader\'s next reads.',
          },
          {
            text: 'Read everything from the leader',
            cost: 'All read load on one machine.',
            why: 'Breaks the second need.',
          },
        ],
        answer: 0,
        explain: 'Read-your-writes, per user.',
      },
      {
        id: 's6-11-3',
        type: 'mcq',
        prompt: 'The leader confirms writes before any follower has them. The leader dies. What can happen?',
        options: [
          { text: 'Confirmed writes are lost' },
          { text: 'Nothing is lost', why: 'Asynchronous followers may lack the newest writes.' },
          { text: 'Followers refuse promotion', why: 'One is promoted; it is just missing data.' },
        ],
        answer: 0,
        explain: 'The price of asynchronous replication.',
      },
      {
        id: 's6-11-4',
        type: 'predict-output',
        prompt: 'Majority of a 7-node cluster?',
        code: 'print(7 // 2 + 1)',
        answer: '4',
        typedWrong: [{ answer: '3', why: '3 of 7 is less than half.' }],
        explain: 'It survives 3 failures.',
      },
      {
        id: 's6-11-5',
        type: 'bucket-sort',
        prompt: 'Replication or partitioning?',
        buckets: ['Replication', 'Partitioning'],
        items: [
          { text: 'More read capacity', bucket: 0, why: 'More copies to read from.' },
          { text: 'More write capacity', bucket: 1, why: 'Each shard has its own leader.' },
          { text: 'Data larger than one disk', bucket: 1, why: 'Split it.' },
          { text: 'Survive a machine dying', bucket: 0, why: 'A copy takes over.' },
          { text: 'Copies in another region', bucket: 0, why: 'Followers far away for local reads and disaster recovery.' },
        ],
        explain: 'Together in practice.',
      },
      {
        id: 's6-11-6',
        type: 'scenario',
        prompt: 'Shard key for an e-commerce orders table?',
        situation: 'The busiest query is "this customer\'s orders". Orders arrive all day.',
        needs: ['The busiest query on one shard', 'Writes spread evenly'],
        options: [
          {
            text: 'Customer id',
            cost: 'Very large customers can run hot.',
          },
          {
            text: 'Order date',
            cost: 'Easy date ranges.',
            why: 'Today\'s shard takes every write.',
          },
          {
            text: 'Product category',
            cost: 'Few, uneven values.',
            why: 'A handful of categories cannot spread evenly.',
          },
        ],
        answer: 0,
        explain: 'Shard by the main query\'s filter.',
      },
      {
        id: 's6-11-7',
        type: 'predict-output',
        prompt: 'Which range shard holds "maria"?',
        code: `import bisect
print(bisect.bisect(["g", "n", "t"],
                    "maria"))`,
        answer: '1',
        typedWrong: [{ answer: '2', why: '"maria" sorts before "n".' }],
        explain: 'Between "g" and "n".',
      },
      {
        id: 's6-11-8',
        type: 'figure',
        prompt: 'Grow from 3 to 4 servers moving at most 5 keys.',
        figure: {
          kind: 'ring',
          keys: USERS,
          servers: 3,
          maxServers: 4,
          mode: 'mod',
          switchable: true,
          goal: { servers: 4, maxMoved: 5 },
        },
        explain: 'Switch to the ring, then add the server.',
      },
      {
        id: 's6-11-9',
        type: 'diagram',
        prompt: 'A viral product\'s stock counter takes 30,000 writes a second. Which box needs splitting?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'Shop API' },
            { id: 'c', kind: 'cache', label: 'Page cache' },
            { id: 's', kind: 'db', label: 'Stock shard' },
            { id: 'o', kind: 'db', label: 'Orders shard' },
          ],
          edges: [
            { from: 'a', to: 'c' },
            { from: 'a', to: 's' },
            { from: 'a', to: 'o' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 's',
          why: {
            a: 'The API servers are stateless and many.',
            c: 'Page reads are cached fine; the problem is writes.',
            o: 'Orders are spread by customer, not one hot key.',
          },
        },
        explain: 'Split the counter into sub-counters (stock buckets).',
      },
      {
        id: 's6-11-10',
        type: 'mcq',
        prompt: 'Why does a network split with 2 database nodes risk split brain?',
        options: [
          { text: 'Each side may think it leads' },
          { text: 'All the data is deleted', why: 'Nothing is deleted; two leaders diverge.' },
          { text: 'Replication speeds up', why: 'Replication stops between the halves.' },
        ],
        answer: 0,
        explain: 'Majorities need an odd number of voters: 3, 5, 7.',
      },
    ],
  },
];
