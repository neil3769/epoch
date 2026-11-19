import type { LibraryPage } from '../schema';

/** Unit S10 summary page: unlocked in the Library when the unit is finished. */
export const s10Library: LibraryPage = {
  unit: 'S10',
  ideas: [
    {
      title: 'Containing failure',
      text: 'Every remote call gets a timeout a little above its p99, inside one deadline passed down the chain. Retry only temporary failures of safe operations, at one layer, with backoff, jitter and a retry budget. Circuit breakers fail fast while a dependency is down; bulkheads give each dependency its own pool; planned fallbacks keep the core working.',
    },
    {
      title: 'Surviving and changing',
      text: 'Run N+1 across zones or regions; choose active-passive or active-active by the RTO and RPO the business accepts, and restore backups regularly. Ship changes gradually (rolling, blue-green, canary) and behind feature flags, with schema changes that work for old and new code at once.',
    },
    {
      title: 'Knowing and promising',
      text: 'Metrics for trends and alerts (rate, errors, duration as percentiles), logs for single events, traces for one request across services, joined by a request id. An SLO on what users feel leaves an error budget: ship while it lasts, fix reliability when it is gone. Authenticate once, authorise every request; sessions revoke at once, signed tokens only when they expire.',
    },
  ],
  rules: [
    'Timeout just above p99; pass the deadline down.',
    'Retries multiply per layer: retry at one.',
    'Breaker: closed → open → half-open → closed.',
    'Parallel copies multiply downtime; chains multiply uptime.',
    '99.9% a month ≈ 43 minutes; each nine ÷ 10.',
    'Alert on p99, not the average.',
    '401: who are you? 403: not allowed.',
  ],
  example: {
    code: [
      'fails, LIMIT = 0, 3',
      'def call(ok):',
      '    global fails',
      '    if fails >= LIMIT:',
      '        return "fast-fail"',
      '    if ok:',
      '        fails = 0',
      '        return "ok"',
      '    fails += 1',
      '    return "error"',
      '',
      'print([call(x) for x in',
      '       [True, False, False,',
      '        False, True]])',
    ].join('\n'),
    output: "['ok', 'error', 'error', 'error', 'fast-fail']",
    notes: ['Three failures open the breaker.', 'The last call is not tried at all, even though it would have worked: a cool-down and a trial decide when to resume.'],
  },
  diagram: {
    nodes: [
      { id: 'c', kind: 'client', label: 'Users' },
      { id: 'g', kind: 'lb', label: 'Gateway' },
      { id: 'p', kind: 'service', label: 'Product page' },
      { id: 'r', kind: 'service', label: 'Recs' },
      { id: 'y', kind: 'service', label: 'Payments' },
    ],
    edges: [
      { from: 'c', to: 'g', label: 'auth' },
      { from: 'g', to: 'p', label: 'deadline' },
      { from: 'p', to: 'r', label: 'breaker', dashed: true },
      { from: 'p', to: 'y', label: 'timeout' },
    ],
  },
  mistakes: [
    { mistake: 'Library default timeouts (or none).', fix: 'Set each from the dependency\'s p99.' },
    { mistake: 'Retrying at every layer.', fix: 'One layer, with backoff, jitter and a budget.' },
    { mistake: 'Alerting on average latency.', fix: 'Alert on p99 and error rate.' },
    { mistake: 'Aiming for 100%.', fix: 'Pick an SLO and spend the budget on change.' },
    { mistake: 'Checking login but not ownership.', fix: 'Authorise every request against the resource.' },
  ],
  forReal:
    'Read the chapters on service level objectives and on handling overload in Google\'s free Site Reliability Engineering book (sre.google), then the OWASP page on broken access control. In your own project, write down one SLO and the fallback for each dependency.',
};
