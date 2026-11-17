import type { LibraryPage } from '../schema';

/** Unit S1 summary page: unlocked in the Library when the unit is finished. */
export const s1Library: LibraryPage = {
  unit: 'S1',
  ideas: [
    {
      title: 'The trip',
      text: 'DNS turns the name into an address (cached for its TTL); TCP and TLS set up a connection (a round trip each with TLS 1.3); the request goes through a balancer to an app server, which asks the database; the response comes back. Reused connections skip the setup.',
    },
    {
      title: 'Methods and statuses',
      text: 'GET is safe; GET, PUT and DELETE are idempotent and can be retried; POST needs an idempotency key. 2xx worked, 3xx elsewhere, 4xx the request was wrong, 5xx the server failed; retry 429 and 5xx later, fix other 4xx.',
    },
    {
      title: 'Latency, throughput, tails',
      text: 'Latency is time per request, throughput requests per second, and in progress = throughput × latency. Describe latency by p50 and p99; a page that waits on many calls meets the tail often.',
    },
    {
      title: 'Processes and threads',
      text: 'Processes have their own memory and survive each other\'s crashes; threads share memory and can race. Servers run several processes, each with threads or an async loop.',
    },
  ],
  rules: [
    'A new far-away HTTPS connection costs about 3 round trips before any work.',
    'Lower DNS TTLs before a planned move.',
    'Retry only idempotent requests, and only on 429 or 5xx.',
    'In progress = throughput × latency.',
    'Report p50 and p99, never only the mean.',
    'CPU-bound Python: processes, not threads.',
  ],
  example: {
    code: [
      'lat = [20] * 98 + [900, 1000]',
      'p50, p99 = np.percentile(',
      '    lat, [50, 99])',
      'busy = 400 * np.mean(lat) / 1000',
      'print(p50, round(p99), round(busy, 1))',
    ].join('\n'),
    output: '20.0 901 15.4',
    notes: [
      'Two slow requests in a hundred: invisible in p50, plain in p99.',
      'Little\'s law with the mean latency in seconds gives requests in progress.',
    ],
  },
  diagram: {
    nodes: [
      { id: 'c', kind: 'client', label: 'Browser' },
      { id: 'n', kind: 'dns', label: 'Resolver' },
      { id: 'l', kind: 'lb', label: 'Balancer' },
      { id: 's', kind: 'service', label: 'App server' },
      { id: 'd', kind: 'db', label: 'Database' },
    ],
    edges: [
      { from: 'c', to: 'n', label: 'name?', dashed: true },
      { from: 'c', to: 'l', label: 'HTTPS' },
      { from: 'l', to: 's' },
      { from: 's', to: 'd', label: 'query' },
    ],
  },
  mistakes: [
    { mistake: 'Treating a timeout as "it failed".', fix: 'It may have worked: retry only idempotent requests.' },
    { mistake: 'Retrying 400s and 404s.', fix: 'They fail the same way; fix the request.' },
    { mistake: 'Reporting mean latency.', fix: 'p50 and p99.' },
    { mistake: 'Adding app servers when the database is full.', fix: 'Find the bottleneck first.' },
    { mistake: 'Threads for CPU-heavy Python.', fix: 'Processes (the GIL).' },
  ],
  forReal:
    'Open your browser\'s developer tools, Network tab, and load a site you use: each request shows its DNS, connection, TLS and waiting times, and the status code. Then run `curl -w "%{time_namelookup} %{time_connect} %{time_appconnect} %{time_starttransfer}\\n" -o /dev/null -s https://example.com` twice and compare.',
};
