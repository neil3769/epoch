import type { Lesson } from '../schema';

/* S1 lessons 6 to 9: latency and throughput, percentiles, processes and
 * threads, checkpoint. */

export const s1More: Lesson[] = [
  // ------------------------------------------------------------------ 6
  {
    id: 's1-06',
    title: 'Latency and throughput',
    summary: 'Latency is time per request, throughput is requests per second; in progress = throughput × latency.',
    card: {
      title: 'Latency and throughput',
      text: 'Latency is how long one request takes; throughput is how many requests finish per second. They are different things: a motorway carries thousands of cars an hour while each trip still takes an hour. Little\'s law ties them: requests in progress = throughput × latency.',
      code: `throughput = 200   # requests/s
latency = 0.5      # seconds each
print(throughput * latency)`,
      output: '100.0',
    },
    exercises: [
      {
        id: 's1-6-1',
        type: 'estimate',
        prompt: 'A service answers 400 requests per second, each taking 0.25 s. How many requests are in progress at any moment?',
        expr: '400 * 0.25',
        answer: 100,
        tolerance: 1.5,
        unit: 'requests',
        work: ['In progress = throughput × latency', '400/s × 0.25 s = 100'],
        explain: 'If each one holds a database connection, you need about 100 connections.',
      },
      {
        id: 's1-6-2',
        type: 'estimate',
        prompt: 'A server can work on 8 requests at once, and each takes 0.2 s. What is its most throughput?',
        expr: '8 / 0.2',
        answer: 40,
        tolerance: 1.5,
        unit: 'requests/s',
        options: [
          { value: 1.6, why: 'That multiplies; throughput = in progress ÷ latency.' },
          { value: 40 },
          { value: 400, why: '8 slots each finishing 5 times a second is 40.' },
        ],
        work: ['Throughput = in progress ÷ latency', '8 ÷ 0.2 s = 40 per second'],
        explain: 'More slots or faster requests raise it.',
      },
      {
        id: 's1-6-3',
        type: 'bucket-sort',
        prompt: 'Which does each change mainly improve?',
        buckets: ['Latency', 'Throughput'],
        items: [
          { text: 'Add more identical servers', bucket: 1, why: 'Each request is as fast as before; more run in parallel.' },
          { text: 'Move servers closer to users', bucket: 0, why: 'Shorter round trips make each request quicker.' },
          { text: 'Process jobs in bigger batches', bucket: 1, why: 'More work per second, while each job waits for its batch.' },
          { text: 'Cut round trips per page from 5 to 2', bucket: 0, why: 'Each page finishes sooner.' },
          { text: 'Run more worker processes', bucket: 1, why: 'More requests at once, each just as long.' },
          { text: 'Switch from TLS 1.2 to 1.3', bucket: 0, why: 'One round trip less per new connection.' },
        ],
        explain: 'Batching even trades latency away for throughput.',
      },
      {
        id: 's1-6-4',
        type: 'mcq',
        prompt: 'You double the number of app servers. What happens to a single request\'s latency, if the old servers were not overloaded?',
        options: [
          { text: 'About the same' },
          { text: 'It roughly halves', why: 'Each request still runs on one server at the same speed.' },
          { text: 'It roughly doubles', why: 'More servers do not slow a request down.' },
        ],
        answer: 0,
        explain: 'You doubled throughput, not speed. It helps latency only if requests were queueing.',
      },
      {
        id: 's1-6-5',
        type: 'predict-output',
        prompt: 'Little\'s law the other way round. What does this print?',
        code: `in_progress = 120
latency = 0.3
print(round(in_progress / latency))`,
        answer: '400',
        typedWrong: [{ answer: '36', why: 'Throughput = in progress ÷ latency, not times.' }],
        explain: '400 requests per second.',
      },
      {
        id: 's1-6-6',
        type: 'scenario',
        prompt: 'Requests arrive faster than they finish. What do you do?',
        situation: 'Traffic is 500 requests/s. Your servers finish at most 400/s, and the queue grows every minute.',
        needs: ['Stop the queue growing', 'Keep serving everyone'],
        options: [
          {
            text: 'Add servers to finish 500/s',
            cost: 'About a quarter more servers to pay for.',
          },
          {
            text: 'Raise the clients\' timeouts',
            cost: 'Users wait longer.',
            why: 'The queue still grows by 100 a second.',
          },
          {
            text: 'Restart the servers',
            cost: 'A short outage.',
            why: 'After the restart they still finish only 400/s.',
          },
        ],
        answer: 0,
        explain: 'When arrivals beat throughput, only more capacity (or less work per request) stops the queue.',
      },
      {
        id: 's1-6-7',
        type: 'diagram',
        prompt: 'The app servers sit at 20% CPU; the database is at 100%. Which box limits throughput?',
        diagram: {
          nodes: [
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'App 1' },
            { id: 'b', kind: 'service', label: 'App 2' },
            { id: 'c', kind: 'service', label: 'App 3' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'l', to: 'c' },
            { from: 'a', to: 'd' },
            { from: 'b', to: 'd' },
            { from: 'c', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'd',
          why: {
            l: 'A balancer only forwards; it is rarely the limit.',
            a: 'At 20% CPU it has spare room.',
            b: 'At 20% CPU it has spare room.',
            c: 'At 20% CPU it has spare room.',
          },
        },
        explain: 'Adding app servers would not help: every one of them waits on the same database.',
      },
      {
        id: 's1-6-8',
        type: 'mcq',
        prompt: 'Users say pages are slow. The dashboard shows only 10 requests/s. Which number do you look at next?',
        options: [
          { text: 'Time per request' },
          { text: 'Requests per second', why: 'Low traffic says nothing about how long each request takes.' },
          { text: 'Number of servers', why: 'First find where the time goes.' },
        ],
        answer: 0,
        explain: 'Slow is a latency complaint: measure latency.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's1-07',
    title: 'p50 and p99',
    summary: 'Percentiles describe latency: p50 is typical, p99 the tail; fan-out makes the tail common.',
    card: {
      title: 'p50 and p99',
      text: 'Latencies vary, so they are described with percentiles: p50, the median, is what a typical request sees, and p99 is slower than 99% of requests. A page that calls many services waits for the slowest, so rare slow calls become common slow pages. Watch p99, not the mean.',
      code: `lat = [20] * 98 + [900, 1000]
print(np.percentile(lat, [50, 99]))`,
      output: '[ 20. 901.]',
    },
    exercises: [
      {
        id: 's1-7-1',
        type: 'predict-output',
        prompt: 'Nine fast requests and one slow one. What does this print?',
        code: `lat = [10] * 9 + [1000]
print(np.percentile(lat, 50))`,
        answer: '10.0',
        typedWrong: [{ answer: '109.0', why: 'That is the mean; the median ignores the one slow request.' }],
        explain: 'The typical request took 10 ms.',
      },
      {
        id: 's1-7-2',
        type: 'predict-output',
        prompt: 'The same requests. Type the mean.',
        code: `lat = [10] * 9 + [1000]
print(np.mean(lat))`,
        answer: '109.0',
        typedWrong: [{ answer: '10.0', why: 'The mean includes the 1,000 ms request: 1,090 ÷ 10.' }],
        explain: 'No request took 109 ms: the mean describes nobody.',
      },
      {
        id: 's1-7-3',
        type: 'estimate',
        prompt: 'A page calls 100 services at once and waits for all. Each is slow on 1% of calls. On what share of page loads is at least one call slow?',
        expr: '(1 - 0.99 ** 100) * 100',
        answer: 63.4,
        tolerance: 1.4,
        unit: '%',
        options: [
          { value: 1, why: 'That is one service; the page needs all 100 to be fast.' },
          { value: 10, why: 'All 100 fast happens only 0.99¹⁰⁰ ≈ 37% of the time.' },
          { value: 63.4 },
        ],
        work: ['P(one call fast) = 0.99', 'P(all 100 fast) = 0.99¹⁰⁰ ≈ 0.366', 'P(at least one slow) ≈ 63%'],
        explain: 'A rare tail for each service is the common case for the page.',
      },
      {
        id: 's1-7-4',
        type: 'mcq',
        prompt: 'Your p99 is 3 s at a million requests a day. Why care about "only 1%"?',
        options: [
          { text: 'That is 10,000 slow requests a day' },
          { text: 'It does not matter at that size', why: '1% of a million is a lot of unhappy people.' },
          { text: 'p99 is always 3 s anyway', why: 'It depends on the system; good services keep it low.' },
        ],
        answer: 0,
        explain: 'And heavy users, who make the most requests, hit the tail most often.',
      },
      {
        id: 's1-7-5',
        type: 'run-code',
        prompt: 'Set `p99` to the 99th percentile of `lat`.',
        before: 'lat = list(range(1, 101))',
        solution: 'p99 = np.percentile(lat, 99)',
        tests: 'assert abs(p99 - 99.01) < 1e-9, f"got {p99}"',
        maxLines: 1,
        placeholder: 'p99 = ...',
        explain: 'NumPy interpolates between the 99th and 100th values.',
      },
      {
        id: 's1-7-6',
        type: 'scenario',
        prompt: 'Which version of the search service do you ship?',
        situation: 'Each product page calls the search service 20 times. Two versions are on test.',
        needs: ['Pages must rarely be slow', 'Typical speed matters less than the worst cases'],
        options: [
          {
            text: 'B: p50 120 ms, p99 300 ms',
            cost: 'Typical calls 40 ms slower.',
          },
          {
            text: 'A: p50 80 ms, p99 2 s',
            cost: 'Many pages hit a 2 s call.',
            why: 'With 20 calls a page, about 18% of pages meet A\'s tail.',
          },
        ],
        answer: 0,
        explain: '1 − 0.99²⁰ ≈ 18% of pages would include a 2-second call with A.',
      },
      {
        id: 's1-7-7',
        type: 'diagram',
        prompt: 'The page waits for all three calls. Which one decides how slow the page is?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Browser' },
            { id: 'p', kind: 'service', label: 'Page' },
            { id: 's', kind: 'search', label: 'Search 120ms' },
            { id: 'a', kind: 'service', label: 'Ads 900ms' },
            { id: 'r', kind: 'service', label: 'Recs 200ms' },
          ],
          edges: [
            { from: 'c', to: 'p' },
            { from: 'p', to: 's' },
            { from: 'p', to: 'a' },
            { from: 'p', to: 'r' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'a',
          why: {
            c: 'The browser waits for the page.',
            p: 'The page waits for its slowest call.',
            s: 'Search finishes long before ads.',
            r: 'Recommendations finish before ads.',
          },
        },
        explain: 'Calls in parallel cost the slowest one: fix ads, or stop waiting for them.',
      },
      {
        id: 's1-7-8',
        type: 'fill-blank',
        prompt: 'The tail.',
        code: `lat = [20] * 99 + [5000]
print(np.percentile(lat, ___) > 20)`,
        answer: ['99'],
        distractors: [{ text: '50', why: 'The median is 20: one slow request never moves it.' }],
        expectOutput: 'True',
        explain: 'With 100 requests, only the very top percentiles see the one slow request.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's1-08',
    title: 'Processes and threads',
    summary: 'A process has its own memory; threads inside it share memory; servers mix both.',
    card: {
      title: 'Processes and threads',
      text: 'A process is a running program with its own memory; a thread is one line of work inside a process, and the threads of a process share its memory. Web servers usually run several processes, so one crash leaves the others serving, each with threads or an async loop inside. Shared memory makes threads cheap to talk to and easy to get wrong.',
      diagram: {
        nodes: [
          { id: 'l', kind: 'lb', label: 'Balancer' },
          { id: 'a', kind: 'service', label: 'Process 1' },
          { id: 'b', kind: 'service', label: 'Process 2' },
          { id: 'd', kind: 'db', label: 'Database' },
        ],
        edges: [
          { from: 'l', to: 'a' },
          { from: 'l', to: 'b' },
          { from: 'a', to: 'd' },
          { from: 'b', to: 'd' },
        ],
      },
    },
    exercises: [
      {
        id: 's1-8-1',
        type: 'bucket-sort',
        prompt: 'Process or thread?',
        buckets: ['Process', 'Thread'],
        items: [
          { text: 'Has its own memory', bucket: 0, why: 'The operating system gives each process its own memory.' },
          { text: 'Shares memory with its siblings', bucket: 1, why: 'Threads of one process see the same variables.' },
          { text: 'Cheaper to start', bucket: 1, why: 'No new memory space to set up.' },
          { text: 'Keeps running if a sibling crashes', bucket: 0, why: 'A crashing thread usually takes its whole process down.' },
          { text: 'Can overwrite a sibling\'s data by mistake', bucket: 1, why: 'Shared memory: two threads can change one variable.' },
        ],
        explain: 'Isolation costs memory; sharing costs care.',
      },
      {
        id: 's1-8-2',
        type: 'predict-output',
        prompt: 'Two threads each add 1 to a shared counter, interleaved like this. What does it print?',
        code: `count = 0
a = count      # thread A reads 0
b = count      # thread B reads 0
count = a + 1  # A writes 1
count = b + 1  # B writes 1
print(count)`,
        answer: '1',
        typedWrong: [{ answer: '2', why: 'Both read 0 before either wrote: one update is lost.' }],
        explain: 'A lost update: the classic race condition. S13 fixes it with a lock.',
      },
      {
        id: 's1-8-3',
        type: 'scenario',
        prompt: 'How do you use all 8 cores?',
        situation: 'A Python service resizes images: pure CPU work. The machine has 8 cores and one is busy.',
        needs: ['Use all 8 cores', 'Plenty of memory to spare'],
        options: [
          {
            text: 'Run 8 processes',
            cost: 'About 8 times the memory of one.',
          },
          {
            text: 'Run 8 threads in one process',
            cost: 'Little extra memory.',
            why: 'In standard CPython one lock (the GIL) lets only one thread run Python code at a time.',
          },
          {
            text: 'Use one async loop',
            cost: 'Little extra memory.',
            why: 'Async overlaps waiting; it still runs one thing at a time on one core.',
          },
        ],
        answer: 0,
        explain: 'Python\'s free-threaded build lifts the GIL, but the default build still has it.',
      },
      {
        id: 's1-8-4',
        type: 'mcq',
        prompt: 'An async server handles 1,000 slow requests on one thread. How?',
        options: [
          { text: 'It switches while each one waits' },
          { text: 'It runs them all at the same instant', why: 'One thread runs one thing at a time.' },
          { text: 'It makes 1,000 hidden threads', why: 'No: one loop switches between waiting tasks.' },
        ],
        answer: 0,
        explain: 'Good for waiting on networks and databases (E2); no help for CPU-heavy work.',
      },
      {
        id: 's1-8-5',
        type: 'diagram',
        prompt: 'Process 1 crashes. Which box keeps answering requests?',
        diagram: {
          nodes: [
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'Process 1' },
            { id: 'b', kind: 'service', label: 'Process 2' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'a', to: 'd' },
            { from: 'b', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'b',
          why: {
            l: 'The balancer forwards requests; it does not answer them.',
            a: 'Process 1 is the one that crashed.',
            d: 'The database stores data; the app process answers requests.',
          },
        },
        explain: 'Separate memory: Process 2 never saw the crash.',
      },
      {
        id: 's1-8-6',
        type: 'estimate',
        prompt: 'A server runs 8 worker processes of 300 MB each. How much memory do they need?',
        expr: '8 * 300 * MB / GB',
        answer: 2.4,
        tolerance: 1.3,
        unit: 'GB',
        work: ['8 × 300 MB = 2,400 MB', '2,400 MB = 2.4 GB'],
        explain: 'The price of isolation: each process has its own copy.',
      },
      {
        id: 's1-8-7',
        type: 'mcq',
        prompt: 'What do the threads of one process share?',
        options: [
          { text: 'Its memory' },
          { text: 'Nothing', why: 'They share the whole memory of their process.' },
          { text: 'Only the database', why: 'Every process can use the database; threads share memory.' },
        ],
        answer: 0,
        explain: 'Fast to share data, and the source of race conditions.',
      },
      {
        id: 's1-8-8',
        type: 'order-steps',
        prompt: 'Two threads lose an update. Put what happens in order.',
        steps: [
          'Thread A reads the counter: 5',
          'Thread B reads the counter: 5',
          'Thread A writes 6',
          'Thread B writes 6, over A\'s write',
        ],
        explain: 'Two increments, one result: the reads came before either write.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's1-09',
    title: 'Checkpoint: how a request travels',
    summary: 'DNS, connections, methods, statuses, latency, percentiles and processes, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's1-9-1',
        type: 'order-steps',
        prompt: 'A first visit to a page. Put the whole trip in order.',
        steps: [
          'DNS turns the name into an address',
          'TCP and TLS set up a connection',
          'The browser sends GET /',
          'The app server queries the database',
          'The server responds 200 with the page',
        ],
        explain: 'Name, connection, request, work, response.',
      },
      {
        id: 's1-9-2',
        type: 'diagram',
        prompt: 'Tap the path of a request through this system, in order.',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Browser' },
            { id: 'n', kind: 'dns', label: 'Resolver' },
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 's', kind: 'service', label: 'App server' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'c', to: 'n', dashed: true },
            { from: 'c', to: 'l' },
            { from: 'l', to: 's' },
            { from: 's', to: 'd' },
          ],
        },
        goal: { kind: 'path', answer: ['c', 'l', 's', 'd'] },
        explain: 'DNS is asked first, but the request itself goes balancer, app, database.',
      },
      {
        id: 's1-9-3',
        type: 'estimate',
        prompt: 'A new HTTPS connection with TLS 1.2 (two round trips) plus the request, for a user 150 ms away. How long before the response starts?',
        expr: '4 * WORLD_ROUND_TRIP * 1000',
        answer: 600,
        tolerance: 1.3,
        unit: 'ms',
        options: [
          { value: 450, why: 'That is TLS 1.3; TLS 1.2 needs one more round trip.' },
          { value: 600 },
          { value: 150, why: 'Only a reused connection gets away with one round trip.' },
        ],
        work: ['TCP 1 + TLS 1.2 2 + request 1 = 4 round trips', '4 × 150 ms = 600 ms'],
        explain: 'TLS 1.3 would save 150 ms of it.',
      },
      {
        id: 's1-9-4',
        type: 'bucket-sort',
        prompt: 'Can the client retry this blindly after a timeout?',
        buckets: ['Yes', 'Needs care'],
        items: [
          { text: 'GET /profile', bucket: 0, why: 'Reading changes nothing.' },
          { text: 'PUT /settings/theme dark', bucket: 0, why: 'Setting the same value twice is the same as once.' },
          { text: 'POST /messages', bucket: 1, why: 'A second POST sends the message twice.' },
          { text: 'POST /transfers', bucket: 1, why: 'It could move the money twice.' },
          { text: 'DELETE /photos/12', bucket: 0, why: 'Gone after one or two.' },
        ],
        explain: 'POST needs an idempotency key to be retried safely.',
      },
      {
        id: 's1-9-5',
        type: 'scenario',
        prompt: 'A partner API answers 503. What does your service do?',
        situation: 'Your checkout calls a shipping-price API. It has just answered 503 Service Unavailable.',
        needs: ['Checkout should usually still work', 'Do not hammer a struggling service'],
        options: [
          {
            text: 'Retry with growing waits',
            cost: 'Checkout takes a few seconds more when it happens.',
          },
          {
            text: 'Retry immediately until it works',
            cost: 'A burst of extra calls.',
            why: 'That piles load onto a service that is already failing.',
          },
          {
            text: 'Fail the checkout at once',
            cost: 'Lost sales on every blip.',
            why: '503 usually passes; a short wait often succeeds.',
          },
        ],
        answer: 0,
        explain: 'Backoff with a cap (E2); S10 adds circuit breakers for long outages.',
      },
      {
        id: 's1-9-6',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `lat = [100] * 95 + [3000] * 5
print(np.percentile(lat, 50),
      np.percentile(lat, 99))`,
        answer: '100.0 3000.0',
        typedWrong: [{ answer: '100.0 100.0', why: 'Five slow requests out of 100 put p99 in the slow group.' }],
        explain: 'A healthy median can hide a painful tail.',
      },
      {
        id: 's1-9-7',
        type: 'estimate',
        prompt: '2,000 requests per second, each holding a database connection for 50 ms. How many connections are busy at once?',
        expr: '2000 * 0.05',
        answer: 100,
        tolerance: 1.5,
        unit: 'connections',
        work: ['Little\'s law: in progress = throughput × time', '2,000/s × 0.05 s = 100'],
        explain: 'Size the connection pool from this, with some headroom.',
      },
      {
        id: 's1-9-8',
        type: 'mcq',
        prompt: 'You changed a DNS record an hour ago; its TTL was 6 hours. Some users still reach the old address. Is DNS broken?',
        options: [
          { text: 'No: caches may keep it 6 hours' },
          { text: 'Yes: changes are instant', why: 'Resolvers keep answers until their TTL ends.' },
          { text: 'Yes: the TTL is ignored', why: 'The TTL is exactly why they still have it.' },
        ],
        answer: 0,
        explain: 'Lower the TTL before planned moves.',
      },
      {
        id: 's1-9-9',
        type: 'diagram',
        prompt: 'Workers are idle while jobs pile up in the queue; the database shows 100% CPU. Which box is the bottleneck?',
        diagram: {
          nodes: [
            { id: 'q', kind: 'queue', label: 'Job queue' },
            { id: 'w', kind: 'worker', label: 'Workers' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'q', to: 'w' },
            { from: 'w', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'd',
          why: {
            q: 'The queue just holds jobs; its growth is a symptom.',
            w: 'Idle workers are waiting on something else.',
          },
        },
        explain: 'More workers would make it worse: more queries on a full database.',
      },
      {
        id: 's1-9-10',
        type: 'mcq',
        prompt: 'Why run a web app as several processes rather than one with many threads?',
        options: [
          { text: 'One crash takes down only one' },
          { text: 'Processes share memory more easily', why: 'Threads share memory; processes do not.' },
          { text: 'Processes use less memory', why: 'They use more: each has its own.' },
        ],
        answer: 0,
        explain: 'Isolation, paid for in memory.',
      },
    ],
  },
];
