import type { LibraryPage } from '../schema';

/** Unit S4 summary page: unlocked in the Library when the unit is finished. */
export const s4Library: LibraryPage = {
  unit: 'S4',
  ideas: [
    {
      title: 'Reading',
      text: 'Cache-aside: check the cache, read the database on a miss, store the result. Average time = hit rate × hit time + miss rate × miss time, so misses dominate. Cache what is read often, changes rarely and may be a little old.',
    },
    {
      title: 'Writing and freshness',
      text: 'Write-through keeps the cache fresh at the cost of slower writes; write-back is fast but loses unsaved writes in a crash. A TTL bounds how old an answer can be; deleting the entry on every write shows changes at once, with the TTL as a safety net.',
    },
    {
      title: 'Under pressure',
      text: 'Full caches evict: LRU keeps what was used recently. When a hot key expires, single-flight lets one request rebuild it; jittered TTLs stop many keys expiring together. CDNs are caches near users for public files; version file names, purge when you must.',
    },
  ],
  rules: [
    'The database is the source of truth; the cache is a copy.',
    'Write the database, then delete the cache entry.',
    'TTL = how old an answer may be.',
    'Private data: the user in the key, or no cache.',
    'Exact-now data (money, permissions, stock at checkout): read fresh.',
    'Hot keys: single-flight and jitter.',
  ],
  example: {
    code: [
      'db = sim.FakeDB({"p": 10})',
      'cache = {}',
      '',
      'def get(k):',
      '    if k not in cache:',
      '        cache[k] = db.get(k)',
      '    return cache[k]',
      '',
      'get("p"); get("p")',
      'db.put("p", 12)',
      'cache.pop("p", None)',
      'print(get("p"), db.queries)',
    ].join('\n'),
    output: '12 3',
    notes: ['Two reads, one query.', 'Write, delete, and the next read sees 12.'],
  },
  diagram: {
    nodes: [
      { id: 'u', kind: 'client', label: 'Users' },
      { id: 'e', kind: 'cdn', label: 'CDN edge' },
      { id: 'a', kind: 'service', label: 'App' },
      { id: 'c', kind: 'cache', label: 'Cache' },
      { id: 'd', kind: 'db', label: 'Database' },
      { id: 's', kind: 'store', label: 'Files' },
    ],
    edges: [
      { from: 'u', to: 'e', label: 'files' },
      { from: 'u', to: 'a', label: 'API' },
      { from: 'e', to: 's', label: 'miss' },
      { from: 'a', to: 'c' },
      { from: 'a', to: 'd' },
    ],
  },
  mistakes: [
    { mistake: 'Updating the cache on write and racing.', fix: 'Delete it; let the next read refill.' },
    { mistake: 'No TTL because "we invalidate".', fix: 'Keep a TTL as a safety net.' },
    { mistake: 'Same TTL for everything filled at once.', fix: 'Add jitter.' },
    { mistake: 'Caching a private page under a shared key.', fix: 'Include the user, or do not cache.' },
    { mistake: 'Trusting a cached price at checkout.', fix: 'Read the source of truth where it matters.' },
  ],
  forReal:
    'Run Redis in Docker, put it in front of a slow query in your E8 service with cache-aside and a TTL, and measure p50 and p99 before and after (E9). Then read the Cache-Control section of MDN\'s HTTP caching guide and check the headers your own site sends for its scripts and images.',
};
