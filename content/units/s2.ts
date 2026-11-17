import { s2Labs } from '../labs/s2';
import { s2Library } from '../library/s2';
import type { Lesson, Unit } from '../schema';
import { s2More } from './s2-more';
import { SD_PRELUDE } from './s1';

/*
 * S2 Back-of-envelope estimation. Lessons 1-4 here: powers of two and ten,
 * users to requests per second, peak against average, storage. Lessons 5-8
 * in s2-more.ts: bandwidth, nines and downtime, latency numbers,
 * checkpoint. Every estimate uses the Numbers page values by name.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's2-01',
    title: 'Powers of two and ten',
    summary: '2¹⁰ ≈ 10³: kilo, mega, giga, tera are each about a thousand times the last.',
    card: {
      title: 'Powers of two and ten',
      text: 'Computers count in powers of two, people in powers of ten, and luckily 2¹⁰ = 1,024 is about 10³. So 2²⁰ is about a million, 2³⁰ about a billion and 2⁴⁰ about a trillion: KB, MB, GB and TB, each a thousand times the last. Estimates only need the right power of ten, so round freely.',
      code: `print(2 ** 10, 2 ** 30)
print(round(GIB / GB, 2))`,
      output: '1024 1073741824\n1.07',
    },
    exercises: [
      {
        id: 's2-1-1',
        type: 'match-pairs',
        prompt: 'Match each power of two to its rough size.',
        pairs: [
          { left: '2¹⁰', right: 'a thousand', why: '2¹⁰ is 1,024.' },
          { left: '2²⁰', right: 'a million', why: '2²⁰ is 1,048,576.' },
          { left: '2³⁰', right: 'a billion', why: 'About 1.07 billion.' },
          { left: '2⁴⁰', right: 'a trillion', why: 'About 1.1 trillion.' },
        ],
        explain: 'Every 10 in the exponent adds three zeros.',
      },
      {
        id: 's2-1-2',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: 'n = 2 ** 20\nprint(n, round(n / 1e6, 2))',
        answer: '1048576 1.05',
        typedWrong: [{ answer: '1048576 1.0', why: 'It is 5% over a million: 1.05.' }],
        explain: 'Close enough to a million for any estimate.',
      },
      {
        id: 's2-1-3',
        type: 'estimate',
        prompt: 'A billion ids of 8 bytes each, packed in an array. How much memory?',
        expr: '1e9 * 8 / GB',
        answer: 8,
        tolerance: 2,
        unit: 'GB',
        options: [
          { value: 0.8, why: 'A billion bytes is 1 GB; eight bytes each makes 8 GB.' },
          { value: 8 },
          { value: 80, why: 'Count the zeros again: 8 × 10⁹ bytes is 8 GB.' },
        ],
        work: ['10⁹ ids × 8 bytes = 8 × 10⁹ bytes', '10⁹ bytes = 1 GB, so 8 GB'],
        explain: 'A packed array; Python sets of ints would take many times more.',
      },
      {
        id: 's2-1-4',
        type: 'scenario',
        prompt: 'Where do the ids go?',
        situation: 'A fraud check must test whether an id is on a list of one billion 8-byte ids, packed in a sorted array. One server has 16 GB of memory.',
        needs: ['Each lookup under a millisecond', 'One server if possible'],
        options: [
          {
            text: 'Keep the array in memory',
            cost: 'Half the server\'s memory; a restart reloads 8 GB.',
          },
          {
            text: 'Spread it over a cluster',
            cost: 'Several machines and the code to route between them.',
            why: '8 GB fits on the one server.',
          },
          {
            text: 'Keep it on disk only',
            cost: 'Little memory.',
            why: 'Disk reads are a thousand times slower than memory; lookups would miss the target.',
          },
        ],
        answer: 0,
        explain: 'Binary search over 10⁹ sorted ids takes about 30 steps in memory: microseconds.',
      },
      {
        id: 's2-1-5',
        type: 'mcq',
        prompt: 'About how many bytes is 1 TB?',
        options: [
          { text: '10¹²' },
          { text: '10⁹', why: 'That is a gigabyte.' },
          { text: '10¹⁵', why: 'That is a petabyte.' },
        ],
        answer: 0,
        explain: 'Kilo 10³, mega 10⁶, giga 10⁹, tera 10¹², peta 10¹⁵.',
      },
      {
        id: 's2-1-6',
        type: 'diagram',
        prompt: 'Which box holds about 2 × 10¹² bytes?',
        diagram: {
          nodes: [
            { id: 's', kind: 'service', label: 'App' },
            { id: 'c', kind: 'cache', label: 'Cache 64 GB' },
            { id: 'd', kind: 'db', label: 'DB 2 TB' },
            { id: 'x', kind: 'search', label: 'Index 300GB' },
          ],
          edges: [
            { from: 's', to: 'c' },
            { from: 's', to: 'd' },
            { from: 's', to: 'x' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'd',
          why: {
            s: 'The app holds almost nothing itself.',
            c: '64 GB is 6.4 × 10¹⁰ bytes.',
            x: '300 GB is 3 × 10¹¹ bytes.',
          },
        },
        explain: '2 TB = 2 × 10¹² bytes.',
      },
      {
        id: 's2-1-7',
        type: 'fill-blank',
        prompt: 'Convert 5 TB to gigabytes.',
        code: 'print(5 * TB / ___)',
        answer: ['GB'],
        distractors: [{ text: 'MB', why: 'That gives megabytes: five million.' }],
        expectOutput: '5000.0',
        explain: 'A thousand gigabytes to a terabyte.',
      },
      {
        id: 's2-1-8',
        type: 'mcq',
        prompt: 'An estimate says 3.7 TB; the real answer is 4.4 TB. Was the estimate useful?',
        options: [
          { text: 'Yes: same order of magnitude' },
          { text: 'No: it is 16% off', why: 'Estimates decide between designs; 16% never changes that choice.' },
          { text: 'No: it should use 1,024', why: 'Powers of ten are fine; the gap is about 10%.' },
        ],
        answer: 0,
        explain: 'The question is "one disk, ten disks or a thousand?", not the exact byte.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's2-02',
    title: 'Users to requests per second',
    summary: 'Daily users × actions each ÷ seconds in a day = average requests per second.',
    card: {
      title: 'Users to requests per second',
      text: 'Sizing starts from people: daily active users × actions each per day ÷ seconds in a day gives average requests per second. A day is about 10⁵ seconds, so a million requests a day is only about 12 a second. Count reads and writes separately; most apps read far more than they write.',
      code: `per_day = 1e6
print(round(per_day / DAY, 1))`,
      output: '11.6',
    },
    exercises: [
      {
        id: 's2-2-1',
        type: 'estimate',
        prompt: '10 million daily users each make 20 requests a day. Average requests per second?',
        expr: '10e6 * 20 / DAY',
        answer: 2315,
        tolerance: 2,
        unit: 'requests/s',
        options: [
          { value: 23, why: 'Ten million times 20 is 2 × 10⁸ a day; divide by 10⁵, not 10⁷.' },
          { value: 2300 },
          { value: 230000, why: 'That divides by 1,000 instead of the seconds in a day.' },
        ],
        work: ['10⁷ users × 20 = 2 × 10⁸ requests a day', '2 × 10⁸ ÷ 86,400 s ≈ 2,300 per second'],
        explain: 'With a day as 10⁵ seconds: 2 × 10⁸ ÷ 10⁵ = 2,000. Close enough.',
      },
      {
        id: 's2-2-2',
        type: 'estimate',
        prompt: '500,000 daily users each post 2 messages a day. Average writes per second?',
        expr: '500e3 * 2 / DAY',
        answer: 11.6,
        tolerance: 2,
        unit: 'writes/s',
        work: ['5 × 10⁵ × 2 = 10⁶ writes a day', '10⁶ ÷ 86,400 ≈ 12 per second'],
        explain: 'A million a day is about a dozen a second: one small database copes easily.',
      },
      {
        id: 's2-2-3',
        type: 'mcq',
        prompt: 'Why treat a day as 10⁵ seconds?',
        options: [
          { text: 'Easy maths, about 16% off' },
          { text: 'It is exactly right', why: 'A day is 86,400 seconds; 10⁵ is a convenient overestimate.' },
          { text: 'Servers sleep at night', why: 'It is a rounding trick, nothing more.' },
        ],
        answer: 0,
        explain: 'Dividing by 10⁵ is moving a decimal point.',
      },
      {
        id: 's2-2-4',
        type: 'run-code',
        prompt: 'Write `rps(dau, per_user)`: average requests per second.',
        solution: 'def rps(dau, per_user):\n    return dau * per_user / DAY',
        tests: [
          'assert abs(rps(10e6, 20) - 2314.8) < 0.1, f"got {rps(10e6, 20)}"',
          'assert abs(rps(86_400, 1) - 1) < 1e-9, "86,400 a day is one a second"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'def rps(dau, per_user):',
        explain: 'DAY comes from the Numbers page.',
      },
      {
        id: 's2-2-5',
        type: 'bucket-sort',
        prompt: 'In a social app, does each action read or write?',
        buckets: ['Read', 'Write'],
        items: [
          { text: 'Open the feed', bucket: 0, why: 'It fetches posts.' },
          { text: 'Post a photo', bucket: 1, why: 'It stores something new.' },
          { text: 'Like a post', bucket: 1, why: 'It records the like.' },
          { text: 'Search for a person', bucket: 0, why: 'It looks things up.' },
          { text: 'View a profile', bucket: 0, why: 'It fetches the profile.' },
          { text: 'Send a message', bucket: 1, why: 'It stores the message.' },
        ],
        explain: 'Then count how often each happens: feeds are opened far more than photos are posted.',
      },
      {
        id: 's2-2-6',
        type: 'estimate',
        prompt: 'An app has 100 reads for every write and 50 writes per second. Reads per second?',
        expr: '50 * 100',
        answer: 5000,
        tolerance: 2,
        unit: 'reads/s',
        options: [
          { value: 500, why: '50 × 100 is 5,000.' },
          { value: 5000 },
          { value: 50000, why: 'One zero too many.' },
        ],
        work: ['50 writes/s × 100 = 5,000 reads/s'],
        explain: 'Read-heavy: the read path is where caches pay off (S4).',
      },
      {
        id: 's2-2-7',
        type: 'diagram',
        prompt: 'Each page view makes 1 app request, 5 cache reads and, on average, 0.1 database queries. Which box sees the most requests?',
        diagram: {
          nodes: [
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 's', kind: 'service', label: 'App' },
            { id: 'c', kind: 'cache', label: 'Cache' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'l', to: 's' },
            { from: 's', to: 'c' },
            { from: 's', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'c',
          why: {
            l: 'One request per page view, like the app.',
            s: 'One request per page view.',
            d: 'Only one page view in ten reaches it.',
          },
        },
        explain: 'Five times the page rate: size the cache for that.',
      },
      {
        id: 's2-2-8',
        type: 'scenario',
        prompt: 'What do you speed up first?',
        situation: 'A recipe site has 100 reads per write. The database is getting busy.',
        needs: ['Cut database load a lot', 'Recipes change rarely'],
        options: [
          {
            text: 'Cache the reads',
            cost: 'Readers may see a recipe edit a little late.',
          },
          {
            text: 'Speed up the writes',
            cost: 'Engineering time on rare operations.',
            why: 'Writes are 1% of the load.',
          },
          {
            text: 'Split the database by recipe',
            cost: 'A big, risky change.',
            why: 'Far more work than a cache for a read-heavy load.',
          },
        ],
        answer: 0,
        explain: 'Rarely changing, often read: the ideal cache case.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's2-03',
    title: 'Peak versus average',
    summary: 'Traffic peaks at several times the average; size for the peak and let queues absorb bursts.',
    card: {
      title: 'Peak versus average',
      text: 'Traffic is not flat: evenings, launches and holidays run at several times the daily average. Size for the peak (often 2 to 5 times the average, more for big events) and let queues absorb short bursts. A system sized for the average fails exactly when most people are watching.',
      code: `avg = 10e6 * 20 / DAY
print(round(avg), round(3 * avg))`,
      output: '2315 6944',
    },
    exercises: [
      {
        id: 's2-3-1',
        type: 'estimate',
        prompt: 'The average is 2,315 requests/s and the evening peak runs at 3 times the average. Peak requests per second?',
        expr: '2315 * 3',
        answer: 6945,
        tolerance: 1.5,
        unit: 'requests/s',
        options: [
          { value: 2300, why: 'That is the average.' },
          { value: 7000 },
          { value: 70000, why: 'Three times, not thirty.' },
        ],
        work: ['2,315 × 3 ≈ 6,900 per second'],
        explain: 'Plan servers for about 7,000 per second, not 2,300.',
      },
      {
        id: 's2-3-2',
        type: 'estimate',
        prompt: 'A shop averages 500 requests/s; a sale day runs at 10 times that. Sale-day peak?',
        expr: '500 * 10',
        answer: 5000,
        tolerance: 1.5,
        unit: 'requests/s',
        work: ['500 × 10 = 5,000 per second'],
        explain: 'Known events: scale up before they start.',
      },
      {
        id: 's2-3-3',
        type: 'mcq',
        prompt: 'Why not size servers for the average?',
        options: [
          { text: 'Peaks would overload them' },
          { text: 'Averages cost more', why: 'Sizing for the average is cheaper; it just fails at peak.' },
          { text: 'Averages are hard to measure', why: 'They are easy; they hide the busy hours.' },
        ],
        answer: 0,
        explain: 'The busiest hour is when failure costs most.',
      },
      {
        id: 's2-3-4',
        type: 'scenario',
        prompt: 'How many servers?',
        situation: 'Each server handles 1,000 requests/s. Average traffic is 2,000/s; the peak is 6,000/s.',
        needs: ['No errors at peak', 'Survive one server failing at peak'],
        options: [
          {
            text: '7 servers',
            cost: 'Most of the day, more than half the capacity sits idle.',
          },
          {
            text: '2 servers',
            cost: 'Cheapest.',
            why: 'That covers the average; the peak needs three times as many.',
          },
          {
            text: '6 servers',
            cost: 'One fewer server to pay for.',
            why: 'Exactly the peak, so one failure at peak overloads the rest.',
          },
        ],
        answer: 0,
        explain: 'Peak ÷ capacity, rounded up, plus a spare. Autoscaling (S3) trims the idle part.',
      },
      {
        id: 's2-3-5',
        type: 'diagram',
        prompt: 'Uploads arrive in bursts of 10 times the average. Which box lets the workers be sized for the average instead?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'App' },
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 's', kind: 'service', label: 'Upload API' },
            { id: 'q', kind: 'queue', label: 'Job queue' },
            { id: 'w', kind: 'worker', label: 'Workers' },
          ],
          edges: [
            { from: 'c', to: 'l' },
            { from: 'l', to: 's' },
            { from: 's', to: 'q' },
            { from: 'q', to: 'w' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'q',
          why: {
            c: 'The clients create the bursts.',
            l: 'The balancer must pass the burst straight through.',
            s: 'The API must accept every upload as it comes.',
            w: 'The workers are what we want to size for the average.',
          },
        },
        explain: 'The queue stores the burst; workers drain it at their own pace (S8).',
      },
      {
        id: 's2-3-6',
        type: 'predict-output',
        prompt: 'Requests per hour over a day, in thousands. Type the peak-to-average ratio.',
        code: `hours = [1, 1, 1, 2, 4, 6, 9, 6]
peak = max(hours)
avg = sum(hours) / len(hours)
print(peak / avg)`,
        answer: '2.4',
        typedWrong: [{ answer: '9', why: 'Divide the peak by the average (30 ÷ 8 = 3.75).' }],
        explain: 'Measure this from your own logs when you have them.',
      },
      {
        id: 's2-3-7',
        type: 'order-steps',
        prompt: 'Put the sizing steps in order.',
        steps: [
          'Start from daily active users',
          'Multiply by actions per user per day',
          'Divide by seconds in a day for the average',
          'Multiply by a peak factor',
          'Divide by one server\'s capacity and add a spare',
        ],
        explain: 'Users → requests a day → average per second → peak → servers.',
      },
      {
        id: 's2-3-8',
        type: 'fill-blank',
        prompt: 'Servers for the peak, plus one spare.',
        code: `import math
peak, per_server = 6000, 1000
n = math.ceil(peak / per_server) ___ 1
print(n)`,
        answer: ['+'],
        distractors: [{ text: '-', why: 'The spare is added, not taken away.' }],
        expectOutput: '7',
        explain: 'Round up first: half a server does not exist.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's2-04',
    title: 'Storage',
    summary: 'Items per day × size × days kept × copies; media outweighs text by hundreds of times.',
    card: {
      title: 'Storage',
      text: 'Storage = items per day × bytes per item × days kept × copies, and stores usually keep 3 copies for safety. Media dwarfs text: one web photo weighs as much as 300 short posts. Work out text and media separately; the bigger one decides the design.',
      code: `per_day = 10e6 * RECORD
print(round(per_day * 365 / TB, 2))`,
      output: '3.65',
    },
    exercises: [
      {
        id: 's2-4-1',
        type: 'estimate',
        prompt: '10 million short posts a day at 1 KB each, kept 5 years (one copy). How much storage?',
        expr: '10e6 * RECORD * 365 * 5 / TB',
        answer: 18.25,
        tolerance: 2,
        unit: 'TB',
        options: [
          { value: 1.8, why: 'Five years of 3.65 TB is about 18 TB.' },
          { value: 18 },
          { value: 180, why: 'One factor of ten too many.' },
        ],
        work: ['10⁷ × 1 KB = 10 GB a day', '× 365 days ≈ 3.65 TB a year', '× 5 years ≈ 18 TB'],
        explain: 'Text alone fits on a few disks.',
      },
      {
        id: 's2-4-2',
        type: 'estimate',
        prompt: '1 million photos a day at the Numbers page\'s web-photo size, kept one year (one copy). How much storage?',
        expr: '1e6 * IMAGE * 365 / TB',
        answer: 109.5,
        tolerance: 2,
        unit: 'TB',
        work: ['10⁶ × 300 KB = 300 GB a day', '× 365 ≈ 110 TB a year'],
        explain: 'Six times the text above, from a tenth as many items.',
      },
      {
        id: 's2-4-3',
        type: 'estimate',
        prompt: 'The same photos kept as 3 copies. How much a year?',
        expr: '1e6 * IMAGE * 365 * 3 / TB',
        answer: 328.5,
        tolerance: 2,
        unit: 'TB',
        options: [
          { value: 33, why: 'Three copies triple the 110 TB, they do not divide it.' },
          { value: 330 },
          { value: 3300, why: 'Three times, not thirty.' },
        ],
        work: ['110 TB a year × 3 copies ≈ 330 TB'],
        explain: 'Object stores handle the copies for you, and bill for them.',
      },
      {
        id: 's2-4-4',
        type: 'bucket-sort',
        prompt: 'Text-sized or media-sized?',
        buckets: ['About 1 KB', '100s of KB+'],
        items: [
          { text: 'A profile bio', bucket: 0, why: 'A few hundred characters.' },
          { text: 'A product photo', bucket: 1, why: 'Hundreds of KB even when compressed.' },
          { text: 'A chat message', bucket: 0, why: 'Short text plus a little metadata.' },
          { text: 'A one-minute voice note', bucket: 1, why: 'Audio runs to hundreds of KB a minute.' },
          { text: 'An order record', bucket: 0, why: 'A few fields: well under a few KB.' },
          { text: 'A short video clip', bucket: 1, why: 'Megabytes per minute.' },
        ],
        explain: 'Spot the media early: it sets your storage and bandwidth.',
      },
      {
        id: 's2-4-5',
        type: 'diagram',
        prompt: 'A photo-sharing app. Which box will hold the most bytes?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'App' },
            { id: 's', kind: 'service', label: 'API' },
            { id: 'd', kind: 'db', label: 'Posts DB' },
            { id: 'o', kind: 'store', label: 'Photo store' },
            { id: 'k', kind: 'cache', label: 'Cache' },
          ],
          edges: [
            { from: 'c', to: 's' },
            { from: 's', to: 'd' },
            { from: 's', to: 'o' },
            { from: 's', to: 'k' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'o',
          why: {
            c: 'Phones keep a few recent photos at most.',
            s: 'The API passes data through; it stores nothing.',
            d: 'Captions and ids: about 1 KB per post.',
            k: 'A cache holds only the hot fraction.',
          },
        },
        explain: 'Photos at hundreds of KB each outweigh everything else.',
      },
      {
        id: 's2-4-6',
        type: 'scenario',
        prompt: 'Where do the photos live?',
        situation: 'Your app will store about 100 TB of photos a year, shown in browsers worldwide.',
        needs: ['Grows without limit', 'Cheap per GB', 'Survives server failures'],
        options: [
          {
            text: 'Object storage, ids in the DB',
            cost: 'A second system and URLs to manage.',
          },
          {
            text: 'Blobs inside the database',
            cost: 'Database storage is far dearer per GB.',
            why: 'Backups, replicas and queries all slow down under 100 TB of images.',
          },
          {
            text: 'On the app servers\' disks',
            cost: 'Disks you already have.',
            why: 'A dead server takes its photos with it, and other servers cannot see them.',
          },
        ],
        answer: 0,
        explain: 'The standard split: bytes in an object store, metadata in the database.',
      },
      {
        id: 's2-4-7',
        type: 'run-code',
        prompt: 'Write `storage_tb(per_day, size, years, copies=3)`: terabytes needed.',
        solution: 'def storage_tb(per_day, size, years,\n               copies=3):\n    n = per_day * 365 * years\n    return n * size * copies / TB',
        tests: [
          'assert abs(storage_tb(1e6, IMAGE, 1) - 328.5) < 1e-6, f"got {storage_tb(1e6, IMAGE, 1)}"',
          'assert abs(storage_tb(10e6, RECORD, 5, copies=1) - 18.25) < 1e-6, "copies=1"',
        ].join('\n'),
        maxLines: 5,
        placeholder: 'def storage_tb(per_day, size, years,',
        explain: 'Items × size × time × copies.',
      },
      {
        id: 's2-4-8',
        type: 'mcq',
        prompt: 'Why keep 3 copies of stored data?',
        options: [
          { text: 'Disks and machines fail' },
          { text: 'To make reads 3 times faster', why: 'Copies can help reads, but the reason is surviving failures.' },
          { text: 'The law requires it', why: 'It is an engineering choice.' },
        ],
        answer: 0,
        explain: 'With 3 copies, two can fail before data is lost.',
      },
    ],
  },
];

export const s2: Unit = {
  id: 'S2',
  track: 'system-design',
  title: 'Back-of-envelope estimation',
  blurb: 'Size a design by arithmetic: powers of two, users to requests per second, peaks, storage, bandwidth, nines of availability, and the latency numbers worth knowing.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s2More],
  labs: s2Labs,
  library: s2Library,
};
