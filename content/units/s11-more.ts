import type { Lesson } from '../schema';

/* S11 lessons 7-11: Bloom filters, counting at scale, batch and stream processing, analytical and transactional stores, checkpoint. */
export const s11More: Lesson[] = [
  // ------------------------------------------------------------------ 7
  {
    id: 's11-07',
    title: 'Bloom filters',
    summary: 'A few bits per item answer "definitely not" or "probably yes", to skip expensive lookups.',
    card: {
      title: 'Bloom filters',
      text: 'A Bloom filter answers "have I seen this?" in a few bits per item, with "definitely not" or "probably yes". Adding an item sets k bits chosen by k hash functions; a lookup checks those bits, so a false positive is possible but a false negative never is. About 10 bits per item gives roughly a 1% false-positive rate, enough to skip expensive lookups (a disk read, a network call) for items that are certainly absent.',
    },
    exercises: [
      {
        id: 's11-7-1',
        type: 'predict-output',
        prompt: 'A 16-bit filter with two hashes. "cat" and "dog" were added. What do the three lookups say?',
        code: `bits = [0] * 16
def hashes(s):
    h = sum(map(ord, s))
    return [h % 16, h * 7 % 16]
def add(s):
    for i in hashes(s):
        bits[i] = 1
def maybe(s):
    return all(bits[i]
               for i in hashes(s))

add("cat")
add("dog")
print(maybe("cat"), maybe("cow"),
      maybe("act"))`,
        answer: 'True False True',
        typedWrong: [{ answer: 'True False False', why: '"act" has the same letters as "cat", so the same bits: a false positive.' }],
        explain: '"cow" is definitely absent; "act" was never added but looks present.',
      },
      {
        id: 's11-7-2',
        type: 'mcq',
        prompt: 'Which answer from a Bloom filter can you trust completely?',
        options: [
          { text: '"Definitely not"' },
          { text: '"Probably yes"', why: 'It can be a false positive.' },
          { text: 'Both answers', why: 'Only the negative is certain.' },
        ],
        answer: 0,
        explain: 'An added item always has all its bits set.',
      },
      {
        id: 's11-7-3',
        type: 'estimate',
        prompt: 'A billion items at 10 bits each. How many GB?',
        expr: '1e9 * 10 / 8 / GB',
        answer: 1.25,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 0.125, why: '10 billion bits / 8 = 1.25 billion bytes.' },
          { value: 1.25 },
          { value: 12.5, why: 'Bits, not bytes: divide by 8.' },
        ],
        work: ['10⁹ × 10 bits = 10¹⁰ bits', '/ 8 = 1.25 × 10⁹ bytes = 1.25 GB'],
        explain: 'Storing the keys themselves would take tens of GB.',
      },
      {
        id: 's11-7-4',
        type: 'scenario',
        prompt: 'A storage engine checks disk for keys, and most lookups are for keys that do not exist. How do you cut the disk reads?',
        situation: 'Billions of keys; memory is limited.',
        needs: ['Skip most reads for absent keys', 'Small memory'],
        options: [
          {
            text: 'A Bloom filter in front of disk',
            cost: 'About 1% of absent keys still hit the disk.',
          },
          {
            text: 'Keep every key in memory instead',
            cost: 'Exact answers.',
            why: 'Billions of keys do not fit in limited memory.',
          },
        ],
        answer: 0,
        explain: 'Databases built on log-structured storage do exactly this.',
      },
      {
        id: 's11-7-5',
        type: 'mcq',
        prompt: 'Can you delete an item from a plain Bloom filter?',
        options: [
          { text: 'No: bits are shared' },
          { text: 'Yes: clear its bits', why: 'Other items may share those bits: false negatives.' },
          { text: 'Only the last item', why: 'Order does not matter; bits are shared.' },
        ],
        answer: 0,
        explain: 'Counting Bloom filters keep small counters instead of bits to allow it.',
      },
      {
        id: 's11-7-6',
        type: 'bucket-sort',
        prompt: 'A good use for a Bloom filter?',
        buckets: ['Good use', 'Poor use'],
        items: [
          { text: 'Skip disk reads for absent keys', bucket: 0, why: 'Negatives are certain.' },
          { text: 'Has this URL been crawled?', bucket: 0, why: 'A rare re-crawl is fine.' },
          { text: 'The exact list of a user\'s friends', bucket: 1, why: 'It cannot list items.' },
          { text: 'Looking up a bank balance', bucket: 1, why: 'It stores no values.' },
          { text: 'Do not recommend articles already seen', bucket: 0, why: 'A rare skipped article is fine.' },
        ],
        explain: 'Membership with harmless false positives.',
      },
      {
        id: 's11-7-7',
        type: 'predict-output',
        prompt: '10,000 bits, 1,000 items, 7 hashes. The standard false-positive estimate, in percent?',
        code: `import math
m, n, k = 10_000, 1_000, 7
p = (1 - math.exp(-k * n / m)) ** k
print(round(p * 100, 1))`,
        answer: '0.8',
        typedWrong: [{ answer: '7.0', why: 'With 10 bits per item and 7 hashes it is under 1%.' }],
        explain: '10 bits per item, about 1%.',
      },
      {
        id: 's11-7-8',
        type: 'fill-blank',
        prompt: 'An item may be present only if every one of its bits is set.',
        code: `bits = [0, 1, 1, 0, 1]
def maybe(positions):
    got = [bits[i] for i in positions]
    return ___(got)

print(maybe([1, 2]), maybe([1, 3]))`,
        answer: ['all'],
        distractors: [{ text: 'any', why: 'One set bit proves nothing; all must be set.' }],
        expectOutput: 'True False',
        explain: 'One zero bit means definitely absent.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's11-08',
    title: 'Counting at scale',
    summary: 'HyperLogLog counts distinct items in kilobytes; count-min sketches estimate frequencies.',
    card: {
      title: 'Counting at scale',
      text: 'Exact counts of distinct things (unique visitors, distinct search terms) need memory for every item seen. HyperLogLog estimates distinct counts in the billions using a few kilobytes, with an error around 1%, and two sketches merge by taking the larger value in each register, so per-server counts combine. A count-min sketch estimates how often each item appears in fixed memory, sometimes overcounting but never undercounting.',
    },
    exercises: [
      {
        id: 's11-8-1',
        type: 'estimate',
        prompt: 'Counting unique visitors exactly: 100 million ids of 16 bytes each. How many GB, before any overhead?',
        expr: '100e6 * 16 / GB',
        answer: 1.6,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 0.16, why: '100 million × 16 B = 1.6 billion bytes.' },
          { value: 1.6 },
          { value: 16, why: '1.6 billion bytes is 1.6 GB.' },
        ],
        work: ['10⁸ × 16 B = 1.6 × 10⁹ B = 1.6 GB'],
        explain: 'Per counter. One per page per day multiplies it fast.',
      },
      {
        id: 's11-8-2',
        type: 'mcq',
        prompt: 'What does HyperLogLog trade?',
        options: [
          { text: 'A small error for tiny memory' },
          { text: 'Exact counts for more memory', why: 'The other way round.' },
          { text: 'Merging for speed', why: 'Sketches merge easily.' },
        ],
        answer: 0,
        explain: 'About 1% error in kilobytes, however many items.',
      },
      {
        id: 's11-8-3',
        type: 'predict-output',
        prompt: 'Two days of visitors. Adding the daily counts, or counting the union?',
        code: `day1 = {"ann", "bo", "cy"}
day2 = {"bo", "dee"}
print(len(day1) + len(day2),
      len(day1 | day2))`,
        answer: '5 4',
        typedWrong: [{ answer: '5 5', why: 'Bo visited both days: the union has 4.' }],
        explain: 'Distinct counts do not add; sketches merge instead.',
      },
      {
        id: 's11-8-4',
        type: 'mcq',
        prompt: 'Why not add the seven daily unique-visitor counts to get the weekly one?',
        options: [
          { text: 'Same people visit on many days' },
          { text: 'Days have different lengths', why: 'They do not; repeat visitors are the issue.' },
          { text: 'The numbers would overflow', why: 'They are small enough.' },
        ],
        answer: 0,
        explain: 'A HyperLogLog per day merges into an honest weekly figure.',
      },
      {
        id: 's11-8-5',
        type: 'bucket-sort',
        prompt: 'Must it be exact, or is an estimate fine?',
        buckets: ['Exact', 'Estimate fine'],
        items: [
          { text: 'Unique visitors on a dashboard', bucket: 1, why: '1% off changes no decision.' },
          { text: 'An account balance', bucket: 0, why: 'Money must be exact.' },
          { text: 'Today\'s top 100 search terms', bucket: 1, why: 'Rough frequencies suffice.' },
          { text: 'Seats sold on a flight', bucket: 0, why: 'Overselling has a cost.' },
          { text: 'Distinct IPs hitting an API this hour', bucket: 1, why: 'For monitoring, close is enough.' },
        ],
        explain: 'Approximate where decisions tolerate it; exact where money or promises depend on it.',
      },
      {
        id: 's11-8-6',
        type: 'predict-output',
        prompt: 'A tiny count-min sketch: two rows of 4 counters, estimate = smallest of an item\'s counters. What are the estimates for "a" and "b"?',
        code: `W = 4
rows = [[0] * W, [0] * W]
def idx(r, s):
    h = sum(map(ord, s))
    return h * (r + 2) % W
def add(s):
    for r in range(2):
        rows[r][idx(r, s)] += 1
def est(s):
    return min(rows[r][idx(r, s)]
               for r in range(2))

for s in ["a", "a", "b", "c"]:
    add(s)
print(est("a"), est("b"))`,
        answer: '2 1',
        typedWrong: [{ answer: '3 1', why: 'Row 0 says 3 ("c" collides with "a"), but row 1 says 2: take the minimum.' }],
        explain: 'Collisions only add, so the smallest counter is the best estimate.',
      },
      {
        id: 's11-8-7',
        type: 'scenario',
        prompt: 'Unique users per page per day, across 50 servers and millions of pages. How do you count?',
        situation: 'Each server sees part of the traffic.',
        needs: ['Small memory per page', 'Combine counts from all servers'],
        options: [
          {
            text: 'A HyperLogLog per page, merged',
            cost: 'About 1% error.',
          },
          {
            text: 'Exact sets of user ids per page',
            cost: 'Exact counts.',
            why: 'Memory for every id on every page, and whole sets shipped to merge.',
          },
        ],
        answer: 0,
        explain: 'Merging sketches is a per-register max: cheap and exact.',
      },
      {
        id: 's11-8-8',
        type: 'fill-blank',
        prompt: 'Merge two HyperLogLog sketches register by register.',
        code: `a = [3, 1, 4, 0]
b = [2, 5, 1, 0]
pairs = zip(a, b)
merged = [___(x, y) for x, y in pairs]
print(merged)`,
        answer: ['max'],
        distractors: [{ text: 'min', why: 'Each register keeps the largest value seen by either sketch.' }],
        expectOutput: '[3, 5, 4, 0]',
        explain: 'The merged sketch equals one built from all the data.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's11-09',
    title: 'Batch and stream',
    summary: 'Batch processes complete data on a schedule; streams process events as they come, in windows.',
    card: {
      title: 'Batch and stream',
      text: 'Batch processing runs over a complete, bounded set of data on a schedule (last night\'s orders): simple to rerun and correct, but the results are hours old. Stream processing handles events as they arrive and keeps running results, often per time window, so answers are seconds old, but late and out-of-order events must be handled. Many systems use both: streams for live views, batch to recompute exact results afterwards.',
    },
    exercises: [
      {
        id: 's11-9-1',
        type: 'bucket-sort',
        prompt: 'Batch or stream?',
        buckets: ['Batch', 'Stream'],
        items: [
          { text: 'Monthly invoices', bucket: 0, why: 'Complete data, on a schedule.' },
          { text: 'A fraud check on each card payment', bucket: 1, why: 'Must decide now.' },
          { text: 'A live viewer count', bucket: 1, why: 'Seconds old at most.' },
          { text: 'Retraining a model every night', bucket: 0, why: 'Over the full day\'s data.' },
          { text: 'An alert when errors spike', bucket: 1, why: 'Minutes matter.' },
          { text: 'The yearly tax report', bucket: 0, why: 'Exact, once.' },
        ],
        explain: 'How fresh must the answer be?',
      },
      {
        id: 's11-9-2',
        type: 'predict-output',
        prompt: 'Count events in 10-second windows. What does this print?',
        code: `events = [1, 3, 7, 11, 12, 18]
win = {}
for t in events:
    w = t // 10 * 10
    win[w] = win.get(w, 0) + 1
print(win)`,
        answer: '{0: 3, 10: 3}',
        typedWrong: [{ answer: '{0: 4, 10: 2}', why: '11 starts the second window.' }],
        explain: 'Tumbling windows: fixed, back to back, no overlap.',
      },
      {
        id: 's11-9-3',
        type: 'mcq',
        prompt: 'What does a watermark tell a stream processor?',
        options: [
          { text: 'Events before T have arrived' },
          { text: 'The whole stream has ended', why: 'Streams do not end.' },
          { text: 'Which machine sent it', why: 'It is about time, not sources.' },
        ],
        answer: 0,
        explain: 'Then the windows before T can be closed and reported.',
      },
      {
        id: 's11-9-4',
        type: 'estimate',
        prompt: 'A batch job reads 2 TB with 10 workers, each reading 200 MB a second. How many minutes?',
        expr: '2 * TB / (10 * 200 * MB) / MINUTE',
        answer: 16.7,
        tolerance: 1.5,
        unit: 'min',
        options: [
          { value: 1.7, why: '2 TB at 2 GB/s is 1,000 s.' },
          { value: 16.7 },
          { value: 167, why: 'Ten workers share the work.' },
        ],
        work: ['10 × 200 MB/s = 2 GB/s', '2 TB / 2 GB/s = 1,000 s ≈ 17 min'],
        explain: 'Add workers to finish sooner: batch scales out easily.',
      },
      {
        id: 's11-9-5',
        type: 'scenario',
        prompt: 'Fraud checks must block a bad payment before it is approved, within 100 ms.',
        situation: 'Today a nightly job flags fraud the next morning.',
        needs: ['Decide before approval'],
        options: [
          {
            text: 'Score each payment as it streams',
            cost: 'A streaming system and fast features.',
          },
          {
            text: 'Keep the nightly batch scoring',
            cost: 'Simple to keep.',
            why: 'By morning the money is gone.',
          },
        ],
        answer: 0,
        explain: 'Batch can still retrain the model each night.',
      },
      {
        id: 's11-9-6',
        type: 'mcq',
        prompt: 'What is batch processing\'s main advantage?',
        options: [
          { text: 'Easy to rerun with fixed code' },
          { text: 'Results within a few seconds', why: 'That is streaming.' },
          { text: 'No storage needed', why: 'It reads stored data.' },
        ],
        answer: 0,
        explain: 'Found a bug? Fix it and rerun last month.',
      },
      {
        id: 's11-9-7',
        type: 'order-steps',
        prompt: 'A late event. Put it in order.',
        steps: [
          'A phone records a tap at 10:04',
          'The phone is offline',
          'It reconnects at 10:09 and sends the tap',
          'The stream puts it in the 10:00–10:05 window by its own time',
          'That window\'s count is corrected',
        ],
        explain: 'Event time, not arrival time, decides the window.',
      },
      {
        id: 's11-9-8',
        type: 'fill-blank',
        prompt: 'The start of the window an event falls in.',
        code: `def window(t, size):
    return t ___ size * size

print(window(17, 10), window(9, 10))`,
        answer: ['//'],
        distractors: [{ text: '%', why: 'That is the offset within the window, times the size.' }],
        expectOutput: '10 0',
        explain: '17 s is in the window starting at 10.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's11-10',
    title: 'Analytical and transactional',
    summary: 'Row stores for many small transactions; column stores for scanning a few columns of huge tables.',
    card: {
      title: 'Analytical and transactional',
      text: 'Transactional (OLTP) databases store each row together and are built for many small reads and writes of single records, with strong guarantees. Analytical (OLAP) stores keep each column together, so a query summing one column over a billion rows reads only that column, compressed. Copy data from the transactional database into the analytical one (in batches or as a change stream), and keep heavy reports off the database that serves users.',
      diagram: {
        nodes: [
          { id: 'a', kind: 'service', label: 'Shop' },
          { id: 'd', kind: 'db', label: 'Orders DB' },
          { id: 'w', kind: 'worker', label: 'Copy job' },
          { id: 'o', kind: 'db', label: 'Warehouse' },
          { id: 'r', kind: 'client', label: 'Analysts' },
        ],
        edges: [
          { from: 'a', to: 'd', label: 'OLTP' },
          { from: 'd', to: 'w', label: 'changes' },
          { from: 'w', to: 'o' },
          { from: 'r', to: 'o', label: 'OLAP' },
        ],
      },
    },
    exercises: [
      {
        id: 's11-10-1',
        type: 'bucket-sort',
        prompt: 'Transactional or analytical?',
        buckets: ['OLTP', 'OLAP'],
        items: [
          { text: 'Place an order', bucket: 0, why: 'One record, now.' },
          { text: 'Revenue by country for 3 years', bucket: 1, why: 'Scan and aggregate.' },
          { text: 'Update a user\'s address', bucket: 0, why: 'One record.' },
          { text: 'Average basket size per week', bucket: 1, why: 'Aggregate over history.' },
          { text: 'Check stock for one item', bucket: 0, why: 'A point lookup.' },
        ],
        explain: 'Few rows, many times: OLTP. Many rows, few columns: OLAP.',
      },
      {
        id: 's11-10-2',
        type: 'estimate',
        prompt: 'A billion rows, 20 columns of 8 bytes. A column store sums one column. How many GB does it read (before compression)?',
        expr: '1e9 * 8 / GB',
        answer: 8,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 0.8, why: '10⁹ × 8 bytes = 8 GB.' },
          { value: 8 },
          { value: 160, why: 'That is every column: what a row store reads.' },
        ],
        work: ['10⁹ rows × 8 B = 8 GB', 'A row store reads 20 × that: 160 GB'],
        explain: 'Twenty times less, before compression helps further.',
      },
      {
        id: 's11-10-3',
        type: 'predict-output',
        prompt: 'Turn rows into columns, then sum one column. What does this print?',
        code: `rows = [("ann", "UK", 30),
        ("bo", "FR", 45),
        ("cy", "UK", 25)]
cols = list(zip(*rows))
print(sum(cols[2]))`,
        answer: '100',
        typedWrong: [{ answer: '30', why: '`cols[2]` is the whole third column: 30, 45, 25.' }],
        explain: 'The sum touched one column, not whole rows.',
      },
      {
        id: 's11-10-4',
        type: 'mcq',
        prompt: 'Why do columns compress so well?',
        options: [
          { text: 'Similar values sit together' },
          { text: 'Columns hold less data', why: 'Same data, different layout.' },
          { text: 'Disks prefer columns', why: 'The disk does not care.' },
        ],
        answer: 0,
        explain: 'A country column is mostly repeats: store each value once with a count.',
      },
      {
        id: 's11-10-5',
        type: 'scenario',
        prompt: 'A monthly revenue report slows the production database while customers shop. Fix?',
        situation: 'The report scans three years of orders.',
        needs: ['Shoppers unaffected', 'Reports still run'],
        options: [
          {
            text: 'Copy data to an analytics store',
            cost: 'Another store, data a little behind.',
          },
          {
            text: 'Run it on the primary at night',
            cost: 'Nothing new.',
            why: 'Customers shop at night too, and the report still competes with them.',
          },
        ],
        answer: 0,
        explain: 'Reports read a copy built for scanning.',
      },
      {
        id: 's11-10-6',
        type: 'mcq',
        prompt: 'Why are column stores poor at single-row updates?',
        options: [
          { text: 'One row touches every column file' },
          { text: 'They have no indexes at all', why: 'The layout is the issue.' },
          { text: 'Updates are not allowed', why: 'They are allowed, just costly.' },
        ],
        answer: 0,
        explain: 'They batch writes; that is why the OLTP database takes the live traffic.',
      },
      {
        id: 's11-10-7',
        type: 'predict-output',
        prompt: 'Run-length encoding of a sorted column. What does this print?',
        code: `col = ["UK"] * 4 + ["FR"] * 3
runs = []
for v in col:
    if runs and runs[-1][0] == v:
        runs[-1][1] += 1
    else:
        runs.append([v, 1])
print(runs)`,
        answer: "[['UK', 4], ['FR', 3]]",
        typedWrong: [{ answer: "[['UK', 1], ['FR', 1]]", why: 'Each repeat adds to the current run.' }],
        explain: 'Seven values stored as two pairs.',
      },
      {
        id: 's11-10-8',
        type: 'fill-blank',
        prompt: 'Rows to columns: unpack the rows into `zip`.',
        code: `rows = [("ann", 30), ("bo", 45)]
names, ages = zip(___rows)
print(ages)`,
        answer: ['*'],
        distractors: [{ text: '**', why: '`**` unpacks a dict into keyword arguments.' }],
        expectOutput: '(30, 45)',
        explain: 'Each row becomes one argument; zip pairs up their positions.',
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    id: 's11-11',
    title: 'Checkpoint: specialised blocks',
    summary: 'Search, geo, real-time, objects, ids, approximate structures, batch, stream and analytics, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's11-11-1',
        type: 'fill-blank',
        prompt: 'Documents containing both words.',
        code: `idx = {"warm": {2, 4, 6},
       "coat": {1, 4}}
print(idx["warm"] ___ idx["coat"])`,
        answer: ['&'],
        distractors: [{ text: '|', why: 'Union: documents with either word.' }],
        expectOutput: '{4}',
        explain: 'Intersect the lists.',
      },
      {
        id: 's11-11-2',
        type: 'mcq',
        prompt: 'Which word helps ranking most?',
        options: [
          { text: 'One in 0.1% of documents' },
          { text: 'One in 90% of documents', why: 'Common words carry little information.' },
          { text: 'One in every document', why: 'Its idf is zero.' },
        ],
        answer: 0,
        explain: 'Rare words distinguish documents.',
      },
      {
        id: 's11-11-3',
        type: 'bucket-sort',
        prompt: 'Polling, server-sent events or WebSocket?',
        buckets: ['Polling', 'SSE', 'WebSocket'],
        items: [
          { text: 'Check once an hour for a new invoice', bucket: 0, why: 'It changes rarely.' },
          { text: 'Live election results page', bucket: 1, why: 'One-way stream.' },
          { text: 'Collaborative document cursors', bucket: 2, why: 'Both ways.' },
          { text: 'Build status refreshed each minute', bucket: 0, why: 'Slow-changing.' },
          { text: 'Voice-chat signalling', bucket: 2, why: 'Both ways, low latency.' },
        ],
        explain: 'Direction and freshness decide.',
      },
      {
        id: 's11-11-4',
        type: 'estimate',
        prompt: '2 million photos a day, one 300 KB web size each. TB per year?',
        expr: '2e6 * IMAGE * 365 / TB',
        answer: 219,
        tolerance: 1.5,
        unit: 'TB',
        options: [
          { value: 21.9, why: '0.6 TB a day × 365.' },
          { value: 219 },
          { value: 2190, why: '300 KB each, not 3 MB.' },
        ],
        work: ['2 million × 300 KB = 0.6 TB a day', '× 365 ≈ 219 TB'],
        explain: 'Object storage, served through a CDN.',
      },
      {
        id: 's11-11-5',
        type: 'match-pairs',
        prompt: 'Match each id scheme to its weakness.',
        pairs: [
          { left: 'Auto-increment', right: 'one central bottleneck', why: 'Every insert asks one counter.' },
          { left: 'UUIDv4', right: 'scattered index inserts', why: 'Random order.' },
          { left: 'Snowflake-style', right: 'needs sane clocks', why: 'A clock running backwards can repeat ids.' },
        ],
        explain: 'Every scheme pays somewhere.',
      },
      {
        id: 's11-11-6',
        type: 'mcq',
        prompt: 'A Bloom filter says "probably yes". What do you do?',
        options: [
          { text: 'Check the real store' },
          { text: 'Trust it completely', why: 'It may be a false positive.' },
          { text: 'Treat it as absent', why: 'It may well be present.' },
        ],
        answer: 0,
        explain: 'Only "definitely not" saves the lookup.',
      },
      {
        id: 's11-11-7',
        type: 'predict-output',
        prompt: 'Distinct visitors over two days. What does this print?',
        code: `mon = {"a", "b", "c", "d"}
tue = {"c", "d", "e"}
print(len(mon | tue))`,
        answer: '5',
        typedWrong: [{ answer: '7', why: 'c and d visited both days.' }],
        explain: 'Merge, do not add.',
      },
      {
        id: 's11-11-8',
        type: 'scenario',
        prompt: 'A dashboard must show orders per minute, live. Today a nightly job computes it.',
        situation: 'Managers watch it during sales events.',
        needs: ['Numbers a few seconds old'],
        options: [
          {
            text: 'Count orders in a stream',
            cost: 'Late events need handling.',
          },
          {
            text: 'Run the nightly job hourly',
            cost: 'Small change.',
            why: 'Still up to an hour old.',
          },
        ],
        answer: 0,
        explain: 'Keep the nightly batch for exact, corrected numbers.',
      },
      {
        id: 's11-11-9',
        type: 'mcq',
        prompt: 'Summing one column of a billion-row table. Which store reads least?',
        options: [
          { text: 'A column store' },
          { text: 'A row store', why: 'It reads every column of every row.' },
          { text: 'An object store', why: 'It reads whole files.' },
        ],
        answer: 0,
        explain: 'Only that column, compressed.',
      },
      {
        id: 's11-11-10',
        type: 'mcq',
        prompt: 'Finding places near you with a grid. Which cells do you search?',
        options: [
          { text: 'Yours and its neighbours' },
          { text: 'Only your own cell', why: 'A close place can be across an edge.' },
          { text: 'Every cell on the map', why: 'That is a full scan.' },
        ],
        answer: 0,
        explain: 'Then filter by real distance.',
      },
    ],
  },
];
