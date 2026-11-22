import type { Walkthrough } from '../schema';

/*
 * Walkthrough 2: a rate limiter for a public API, through the seven-step
 * framework. Unlocks after S1-S4 and S9 (rate-limiting algorithms).
 */
export const rateLimiter: Walkthrough = {
  id: 'w-rate-limiter',
  title: 'Rate limiter',
  question: 'Design a rate limiter for a public API: each API key may make at most a set number of requests per minute, and requests over the limit are rejected.',
  needs: ['S1', 'S2', 'S3', 'S4', 'S9'],
  minutes: 18,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "Limits are per API key, for example 1,000 a minute, and differ by plan. The API runs on 50 servers. The limiter must not slow the API down."',
      exercises: [
        {
          id: 'wrl-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'A limit per API key', bucket: 0, why: 'The core feature, stated.' },
            { text: 'Different limits per plan', bucket: 0, why: 'Stated by the interviewer.' },
            { text: 'A clear 429 with Retry-After', bucket: 0, why: 'Clients need to know when to try again.' },
            { text: 'Per-IP limits for anonymous users', bucket: 1, why: 'Every request here carries a key.' },
            { text: 'Billing for extra usage', bucket: 1, why: 'A separate system, not asked for.' },
            { text: 'A usage dashboard', bucket: 1, why: 'Useful later; not part of limiting.' },
          ],
          explain: 'Keep v1 to limiting and telling clients about it.',
        },
        {
          id: 'wrl-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most?',
          options: [
            { text: 'It adds almost no latency' },
            { text: 'Exact to the very last request', why: 'Letting a few extra through briefly is usually acceptable.' },
            { text: 'It keeps every request forever', why: 'The limiter only needs recent counts.' },
          ],
          answer: 0,
          explain: 'Every API call pays the limiter\'s cost, so it must be tiny.',
        },
        {
          id: 'wrl-1-3',
          type: 'scenario',
          prompt: 'The store that holds the counters goes down. What should the limiter do?',
          situation: 'Limits protect the API from overuse; the API itself is still healthy.',
          needs: ['The API stays available if the limiter breaks'],
          options: [
            {
              text: 'Fail open: let requests through',
              cost: 'For a while, nobody is limited.',
            },
            {
              text: 'Fail closed: reject everything',
              cost: 'No key can exceed its limit.',
              why: 'A limiter fault becomes a full API outage, against the need.',
            },
          ],
          answer: 0,
          explain: 'For login attempts or SMS sending, failing closed would be the safer choice.',
        },
      ],
      strong: 'Limits per API key, configurable per plan, with 429 and Retry-After when exceeded; the limiter must add well under a millisecond, may be slightly inexact, and fails open so a limiter fault does not take the API down.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "1 million active API keys, 20,000 requests a second at peak across 50 servers. A counter is about 100 bytes."',
      exercises: [
        {
          id: 'wrl-2-1',
          type: 'estimate',
          prompt: 'Memory for one counter per active key?',
          expr: '1e6 * 100 / MB',
          answer: 100,
          tolerance: 2,
          unit: 'MB',
          options: [
            { value: 10, why: '10⁶ × 100 B = 10⁸ B = 100 MB.' },
            { value: 100 },
            { value: 10000, why: '10⁸ bytes is 100 MB, not 10 GB.' },
          ],
          work: ['10⁶ keys × 100 B = 10⁸ B = 100 MB'],
          explain: 'It fits in the memory of one small machine.',
        },
        {
          id: 'wrl-2-2',
          type: 'estimate',
          prompt: 'Limit checks per API server per second at peak?',
          expr: '20000 / 50',
          answer: 400,
          tolerance: 2,
          unit: 'checks/s',
          options: [
            { value: 40, why: '20,000 spread over 50 servers is 400 each.' },
            { value: 400 },
            { value: 20000, why: 'That is the total, not per server.' },
          ],
          work: ['20,000 / 50 = 400 per server'],
          explain: 'Easy for each server; the shared store sees all 20,000.',
        },
        {
          id: 'wrl-2-3',
          type: 'mcq',
          prompt: 'An in-memory store node handles about 100,000 simple operations a second. Is one node enough for 20,000 checks a second?',
          options: [
            { text: 'Yes, about five times over' },
            { text: 'No, it needs sharding now', why: '20,000 is a fifth of what one node can do.' },
            { text: 'No, use the database instead', why: 'A disk-backed database is slower, not faster.' },
          ],
          answer: 0,
          explain: 'Add a replica for failover; shard only when traffic grows several times.',
        },
      ],
      strong: 'About 100 MB of counters and 20,000 checks a second at peak: one in-memory store node with a replica handles it, and each of the 50 servers makes about 400 checks a second.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'The limiter sits in front of every API call; clients only see its answers.',
      exercises: [
        {
          id: 'wrl-3-1',
          type: 'match-pairs',
          prompt: 'Match each case to what the client sees.',
          pairs: [
            { left: 'Under the limit', right: 'the API\'s normal answer', why: 'The request passes through untouched.' },
            { left: 'Over the limit', right: '429 Too Many Requests', why: 'RFC 6585\'s status for rate limiting.' },
            { left: 'Retry-After header', right: 'seconds until it may retry', why: 'Tells well-behaved clients when to come back.' },
          ],
          explain: 'Status codes from S9.',
        },
        {
          id: 'wrl-3-2',
          type: 'order-steps',
          prompt: 'A request reaches the API. Put the limiter\'s work in order.',
          steps: [
            'The gateway receives the request',
            'It reads the API key',
            'It checks and updates that key\'s counter',
            'Under the limit: forward to the API',
            'Over the limit: reply 429 with Retry-After',
          ],
          explain: 'Reject before any expensive work is done.',
        },
        {
          id: 'wrl-3-3',
          type: 'predict-output',
          prompt: 'The response also tells clients how many requests they have left. What does this print?',
          code: `limit, used = 1000, 997
left = limit - used
headers = {
    "RateLimit-Limit": limit,
    "RateLimit-Remaining": left,
}
print(headers["RateLimit-Remaining"])`,
          answer: '3',
          typedWrong: [{ answer: '997', why: 'Remaining is the limit minus what was used.' }],
          explain: 'Header names vary by provider; an IETF draft standardises RateLimit fields.',
        },
      ],
      strong: 'The limiter is invisible until a key runs out: then 429 with Retry-After, and on every response headers saying the limit and what remains, so good clients slow down before they are rejected.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Choose the algorithm and what it stores per key.',
      exercises: [
        {
          id: 'wrl-4-1',
          type: 'scenario',
          prompt: 'Which algorithm per key?',
          situation: 'Clients often send short bursts after being idle; 1,000 a minute is the fair average.',
          needs: ['Allow short bursts', 'Hold the average', 'Small memory per key'],
          options: [
            {
              text: 'A token bucket per key',
              cost: 'Two numbers per key and a little arithmetic.',
            },
            {
              text: 'A fixed window counter',
              cost: 'One number per key.',
              why: 'Allows twice the limit across a window boundary (S9).',
            },
            {
              text: 'A sliding log of every request',
              cost: 'Exact counts.',
              why: 'Stores up to 1,000 timestamps per key: memory grows with the limit.',
            },
          ],
          answer: 0,
          explain: 'Bucket size sets the burst, refill rate sets the average.',
        },
        {
          id: 'wrl-4-2',
          type: 'predict-output',
          prompt: 'A token bucket per key: tokens and last time, stored together. Four requests at t = 0, then one at t = 2?',
          code: `db = {}
def take(key, now, cap=3, rate=1):
    t, last = db.get(key, (cap, now))
    gain = (now - last) * rate
    t = min(cap, t + gain)
    if t < 1:
        db[key] = (t, now)
        return False
    db[key] = (t - 1, now)
    return True

ks = [take("k1", 0) for _ in range(4)]
print(ks, take("k1", 2))`,
          answer: '[True, True, True, False] True',
          typedWrong: [{ answer: '[True, True, True, True] True', why: 'The bucket holds 3 tokens; the fourth request finds it empty.' }],
          explain: 'Two seconds later, two tokens have dripped back in.',
        },
        {
          id: 'wrl-4-3',
          type: 'mcq',
          prompt: 'Where do the counters live?',
          options: [
            { text: 'A shared in-memory store' },
            { text: 'Each API server\'s memory', why: 'With 50 servers, each would allow the full limit: 50 times too much.' },
            { text: 'The main SQL database', why: 'Too slow per request, and it adds load to the database.' },
          ],
          answer: 0,
          explain: 'Keyed by API key, with an expiry so idle keys disappear.',
        },
      ],
      strong: 'A token bucket per key (tokens and last refill time), in a shared in-memory store keyed by API key with an expiry; plan limits come from a small config table cached in the gateways.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Put the limiter where every request passes, with its counters beside it.',
      exercises: [
        {
          id: 'wrl-5-1',
          type: 'diagram',
          prompt: 'The gateway checks each key\'s bucket before forwarding. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Clients' },
              { id: 'g', kind: 'lb', label: 'Gateway' },
              { id: 'k', kind: 'cache', label: 'Counters' },
              { id: 'a', kind: 'service', label: 'API' },
            ],
            edges: [
              { from: 'c', to: 'g' },
              { from: 'g', to: 'k', label: 'check' },
              { from: 'g', to: 'a' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'k',
            options: [
              { kind: 'cache', label: 'In-memory' },
              { kind: 'db', label: 'SQL table', why: 'A disk-backed write on every request is too slow.' },
              { kind: 'queue', label: 'Queue', why: 'The decision is needed now, not later.' },
            ],
            answer: 0,
          },
          explain: 'An in-memory store answers in well under a millisecond.',
        },
        {
          id: 'wrl-5-2',
          type: 'diagram',
          prompt: 'An allowed request. Tap its path from the client to the API.',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Clients' },
              { id: 'g', kind: 'lb', label: 'Gateway' },
              { id: 'k', kind: 'cache', label: 'Counters' },
              { id: 'a', kind: 'service', label: 'API' },
            ],
            edges: [
              { from: 'c', to: 'g' },
              { from: 'g', to: 'k' },
              { from: 'g', to: 'a' },
            ],
          },
          goal: { kind: 'path', answer: ['c', 'g', 'a'] },
          explain: 'The counter check is a side trip from the gateway; the request itself goes on to the API.',
        },
        {
          id: 'wrl-5-3',
          type: 'mcq',
          prompt: 'Why put the limiter in the gateway rather than in each API service?',
          options: [
            { text: 'One check for all services' },
            { text: 'Gateways have more memory', why: 'Memory is not the reason; one shared place is.' },
            { text: 'Services cannot read keys', why: 'They can; the point is not to repeat the logic.' },
          ],
          answer: 0,
          explain: 'And rejected requests never reach the services at all.',
        },
      ],
      strong: 'Clients → gateway (several instances) → API services; the gateway checks a token bucket per key in a shared in-memory store with a replica, and caches plan limits locally.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Clients' },
          { id: 'g', kind: 'lb', label: 'Gateway' },
          { id: 'k', kind: 'cache', label: 'Counters' },
          { id: 'a', kind: 'service', label: 'API' },
          { id: 'r', kind: 'replica', label: 'Replica' },
        ],
        edges: [
          { from: 'c', to: 'g' },
          { from: 'g', to: 'k', label: 'check' },
          { from: 'g', to: 'a' },
          { from: 'k', to: 'r', dashed: true },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: many gateways update the same key\'s counter at the same moment.',
      exercises: [
        {
          id: 'wrl-6-1',
          type: 'predict-output',
          prompt: 'Two gateways read the same counter, then each writes it back. What happens at the limit?',
          code: `count, LIMIT = 999, 1000
a = count < LIMIT    # gateway A reads
b = count < LIMIT    # gateway B reads
count += a + b       # both write
print(a, b, count)`,
          answer: 'True True 1001',
          typedWrong: [{ answer: 'True False 1000', why: 'Both read 999 before either wrote.' }],
          explain: 'Read-then-write lets requests slip past the limit (S13\'s lost update).',
        },
        {
          id: 'wrl-6-2',
          type: 'scenario',
          prompt: 'How do you stop gateways racing on the same key?',
          situation: 'The counter store supports atomic operations and small server-side scripts.',
          needs: ['No overshoot from races', 'One round trip per check'],
          options: [
            {
              text: 'Atomic update in the store',
              cost: 'The bucket logic runs inside the store as one step.',
            },
            {
              text: 'Read, then write the count back',
              cost: 'Simple code in the gateway.',
              why: 'Two gateways can read the same value and both allow.',
            },
          ],
          answer: 0,
          explain: 'One atomic call per request: check, update and answer together.',
        },
        {
          id: 'wrl-6-3',
          type: 'estimate',
          prompt: 'Each check is one round trip inside the data centre. How many milliseconds does it add?',
          expr: 'DC_ROUND_TRIP * 1000',
          answer: 0.5,
          tolerance: 2,
          unit: 'ms',
          options: [
            { value: 0.05, why: 'A round trip inside a data centre is about 0.5 ms.' },
            { value: 0.5 },
            { value: 50, why: 'That is closer to a cross-continent trip.' },
          ],
          work: ['Numbers page: data-centre round trip ≈ 0.5 ms'],
          explain: 'Small next to the API\'s own work, as required.',
        },
      ],
      strong: 'The token-bucket update runs atomically in the store (one script per check), so concurrent gateways cannot both take the last token; each check costs about one data-centre round trip.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Push it to ten times the traffic, and to one abusive key.',
      exercises: [
        {
          id: 'wrl-7-1',
          type: 'scenario',
          prompt: 'One abusive key sends 50,000 requests a second. Every one still costs a trip to the same store node.',
          situation: 'Almost all of them are rejected anyway.',
          needs: ['The store survives', 'Other keys are unaffected'],
          options: [
            {
              text: 'Gateways cache "blocked" briefly',
              cost: 'A key may stay blocked a second too long.',
            },
            {
              text: 'A bigger counter-store node',
              cost: 'A pricier machine.',
              why: 'One key still hammers one node, and the next abuser can send more.',
            },
          ],
          answer: 0,
          explain: 'Once a key is over its limit, the gateway can reject locally until Retry-After.',
        },
        {
          id: 'wrl-7-2',
          type: 'mcq',
          prompt: 'At ten times today\'s traffic, what do you change first?',
          options: [
            { text: 'Shard counters by API key' },
            { text: 'Move counters into SQL tables', why: 'Slower, and it adds load where it hurts most.' },
            { text: 'Drop the rate limits entirely', why: 'The limits protect the API; they matter more at scale.' },
          ],
          answer: 0,
          explain: '200,000 checks a second outgrows one node; keys spread evenly across shards.',
        },
        {
          id: 'wrl-7-3',
          type: 'bucket-sort',
          prompt: 'If the counter store were down, fail open or fail closed?',
          buckets: ['Fail open', 'Fail closed'],
          items: [
            { text: 'Reading product pages', bucket: 0, why: 'Overuse for a while is harmless.' },
            { text: 'Login attempts', bucket: 1, why: 'Unlimited guessing helps attackers.' },
            { text: 'Search queries', bucket: 0, why: 'Better slow than down.' },
            { text: 'Sending SMS codes', bucket: 1, why: 'Each one costs money and can be abused.' },
            { text: 'Password reset emails', bucket: 1, why: 'Floods annoy users and can be abused.' },
          ],
          explain: 'Decide per endpoint, by what overuse would cost.',
        },
      ],
      strong: 'Names the single store node as the first limit, shards counters by key at 10×, caches "blocked" decisions in gateways to absorb abusive keys, and chooses fail-open or fail-closed per endpoint by the cost of overuse.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'c', kind: 'client', label: 'Clients' },
        { id: 'g', kind: 'lb', label: 'Gateway' },
        { id: 'k', kind: 'cache', label: 'Counters' },
        { id: 'a', kind: 'service', label: 'API' },
        { id: 'r', kind: 'replica', label: 'Replica' },
      ],
      edges: [
        { from: 'c', to: 'g', label: 'key' },
        { from: 'g', to: 'k', label: 'atomic' },
        { from: 'g', to: 'a', label: 'allowed' },
        { from: 'k', to: 'r', dashed: true },
      ],
    },
    decisions: [
      'Token bucket per API key: bursts up to the bucket size, the plan\'s rate on average.',
      'Counters in a shared in-memory store (about 100 MB), updated atomically in one round trip.',
      'Checked in the gateway; 429 with Retry-After and remaining-requests headers.',
      'Fails open for ordinary endpoints, closed for logins and SMS.',
      'At 10×: shard counters by key; gateways cache "blocked" keys briefly.',
    ],
  },
  blank: {
    requirements: [
      'A limit per API key, set by plan',
      'Reject over-limit requests with 429 and Retry-After',
      'Adds well under a millisecond per request',
      'Works across many API servers',
      'Keeps the API up if the limiter fails',
    ],
    components: ['client', 'lb', 'cache', 'service'],
    firstFive: [
      'Ask what is limited (per key, per IP, per user) and the limits per plan',
      'Ask the scale: keys, requests a second, number of servers',
      'Say the priorities: tiny latency, slight inexactness acceptable, fail open',
      'Estimate counter memory and checks a second out loud',
      'Pick the algorithm (token bucket) before drawing boxes',
    ],
  },
};
