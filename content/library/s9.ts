import type { LibraryPage } from '../schema';

/** Unit S9 summary page: unlocked in the Library when the unit is finished. */
export const s9Library: LibraryPage = {
  unit: 'S9',
  ideas: [
    {
      title: 'Shape of an API',
      text: 'REST for public resource APIs (GET, PUT and DELETE are idempotent, POST is not), gRPC for fast typed calls between services, GraphQL for clients choosing fields in one round trip. Page with cursors for deep or changing lists. Add fields freely; for breaking changes publish a new version and retire the old one slowly.',
    },
    {
      title: 'Protecting it',
      text: 'Idempotency keys: the client makes one key per operation and reuses it on retries; the server claims it atomically and replays the stored result. Rate limits per key or IP: fixed windows allow double bursts at the boundary, sliding windows are exact, token buckets allow bursts up to their size and the refill rate on average. Answer 429 with Retry-After.',
    },
    {
      title: 'Boundaries',
      text: 'A gateway handles TLS, authentication, rate limits, routing and logging once; business rules stay in services. Start with a modular monolith; split by business capability when teams or scaling demand it, and pay for network failures, distributed data and operations. Services find each other through a registry with health checks, via DNS, a client library or a load balancer.',
    },
  ],
  rules: [
    '201 created, 401 who are you, 403 not allowed, 429 slow down.',
    'Cursor = last item seen; ask for items after it.',
    'Add, never rename or remove, within a version.',
    'One idempotency key per operation, reused on retry.',
    'Token bucket: size = burst, refill = average.',
    'Chained availability multiplies: 0.999⁵ ≈ 99.5%.',
    'Health checks must call the service, not just see the process.',
  ],
  example: {
    code: [
      'cap, rate = 2, 1',
      'tokens, last = cap, 0.0',
      'def allow(t):',
      '    global tokens, last',
      '    gained = (t - last) * rate',
      '    tokens = min(cap, tokens + gained)',
      '    last = t',
      '    if tokens >= 1:',
      '        tokens -= 1',
      '        return True',
      '    return False',
      '',
      'ts = (0, 0.1, 0.2, 1.5)',
      'print([allow(t) for t in ts])',
    ].join('\n'),
    output: '[True, True, False, True]',
    notes: ['A burst of two empties the bucket; 0.2 s later only 0.2 tokens are back.', 'By 1.5 s it has refilled enough for one more.'],
  },
  diagram: {
    nodes: [
      { id: 'c', kind: 'client', label: 'Apps' },
      { id: 'g', kind: 'lb', label: 'Gateway' },
      { id: 'k', kind: 'cache', label: 'Counters' },
      { id: 'r', kind: 'service', label: 'Registry' },
      { id: 'o', kind: 'service', label: 'Orders' },
    ],
    edges: [
      { from: 'c', to: 'g', label: 'HTTPS' },
      { from: 'g', to: 'k', label: 'limit' },
      { from: 'g', to: 'r', label: 'lookup' },
      { from: 'g', to: 'o', label: 'route' },
    ],
  },
  mistakes: [
    { mistake: 'Offset pagination on a live feed.', fix: 'Cursor from the last item seen.' },
    { mistake: 'Renaming a field in place.', fix: 'Add the new field, or publish a new version.' },
    { mistake: 'Retrying a POST with a new key.', fix: 'Reuse the same key for every retry.' },
    { mistake: 'Per-server rate-limit counters.', fix: 'A shared counter store, or split the limit.' },
    { mistake: 'Microservices from day one.', fix: 'A modular monolith; split when there is a reason.' },
  ],
  forReal:
    'Read the Idempotency-Key header draft in the IETF HTTP APIs working group and one real payment API\'s idempotency docs, then the rate-limit headers your gateway or cloud provider documents. Martin Fowler\'s "MonolithFirst" essay is a short, useful read on when to split.',
};
