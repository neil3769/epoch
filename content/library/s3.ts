import type { LibraryPage } from '../schema';

/** Unit S3 summary page: unlocked in the Library when the unit is finished. */
export const s3Library: LibraryPage = {
  unit: 'S3',
  ideas: [
    {
      title: 'Up or out',
      text: 'Scale up (a bigger machine) while it is cheap and simple; scale out (more machines behind a balancer) for growth without a ceiling and to survive failures. Scaling out needs stateless servers: sessions, carts and uploads live in shared stores.',
    },
    {
      title: 'Balancing',
      text: 'Round robin takes turns and suits even requests; least connections suits uneven ones; hashing keeps a user on one server. Health checks take failing servers out after a few failed checks; capacity to absorb their share must already exist.',
    },
    {
      title: 'Failures and growth',
      text: 'A single point of failure is any one part whose loss stops everything, including shared power, switches or people. Autoscaling adds servers on a load signal but lags by minutes: keep headroom and scale ahead of known peaks.',
    },
  ],
  rules: [
    'Servers = ⌈peak ÷ capacity⌉ + spare.',
    'Nothing a user needs lives in one server\'s memory.',
    'Uneven request costs: least connections.',
    'Ask of every box: if it dies, does everything stop?',
    'Scale on load per server; aim well below 100%.',
    'Hash-mod-n moves most users when n changes.',
  ],
  example: {
    code: [
      'import math',
      'peak, cap = 9000, 1200',
      'n = math.ceil(peak / cap) + 1',
      'up = [True, False, True]',
      'pool = [i for i, ok in enumerate(up)',
      '        if ok]',
      'print(n, [pool[k % len(pool)]',
      '          for k in range(4)])',
    ].join('\n'),
    output: '9 [0, 2, 0, 2]',
    notes: ['Size for the peak plus a spare.', 'Round robin over healthy servers only.'],
  },
  diagram: {
    nodes: [
      { id: 'u', kind: 'client', label: 'Users' },
      { id: 'l', kind: 'lb', label: 'Balancer A' },
      { id: 'm', kind: 'lb', label: 'Balancer B' },
      { id: 'a', kind: 'service', label: 'App pool' },
      { id: 's', kind: 'cache', label: 'Sessions' },
      { id: 'd', kind: 'db', label: 'Primary DB' },
      { id: 'r', kind: 'replica', label: 'Standby DB' },
    ],
    edges: [
      { from: 'u', to: 'l' },
      { from: 'u', to: 'm' },
      { from: 'l', to: 'a' },
      { from: 'm', to: 'a' },
      { from: 'a', to: 's' },
      { from: 'a', to: 'd' },
      { from: 'd', to: 'r', label: 'copy', dashed: true },
    ],
  },
  mistakes: [
    { mistake: 'Sessions in app server memory.', fix: 'A shared store.' },
    { mistake: 'Round robin with very uneven requests.', fix: 'Least connections.' },
    { mistake: '"Process is up" health checks.', fix: 'Check the server\'s own ability to work, briefly.' },
    { mistake: 'Two copies sharing one power feed or switch.', fix: 'Spread across racks and zones.' },
    { mistake: 'Relying on autoscaling for a known spike.', fix: 'Scale ahead on a schedule.' },
  ],
  forReal:
    'Run two copies of a small web app (for example your E8 service) with docker compose behind nginx as a round-robin balancer, add a health check, stop one container and watch requests move. Then read your cloud provider\'s documentation on target groups, health checks and autoscaling policies, and note its default check interval and threshold.',
};
