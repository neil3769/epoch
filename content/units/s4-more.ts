import type { Lesson } from '../schema';

/* S4 lessons 6 to 10: eviction, stampedes, CDNs, what to cache and what
 * never, checkpoint. */

export const s4More: Lesson[] = [
  // ------------------------------------------------------------------ 6
  {
    id: 's4-06',
    title: 'Eviction',
    summary: 'A full cache must drop something: LRU drops the least recently used, FIFO the oldest inserted.',
    card: {
      title: 'Eviction',
      text: 'A cache has limited memory, so when it is full something must go. LRU (least recently used) drops the entry unused for longest; FIFO drops the oldest inserted, even if it is still popular. LRU usually wins because data used recently tends to be used again.',
    },
    exercises: [
      {
        id: 's4-6-1',
        type: 'figure',
        prompt: 'FIFO keeps throwing out "a", the most popular key. Reach a hit rate of at least 37%.',
        figure: {
          kind: 'cache',
          reads: 'a b a c a d a b',
          size: 2,
          policy: 'fifo',
          ttl: null,
          editable: ['policy'],
          goal: { hitRate: 0.37 },
        },
        explain: 'LRU keeps "a" because it was used recently; FIFO drops it for being old.',
      },
      {
        id: 's4-6-2',
        type: 'predict-output',
        prompt: 'An LRU cache of two entries. What is left after reading a, b, a, c?',
        code: `from collections import OrderedDict

c = OrderedDict()
for k in "abac":
    if k in c:
        c.move_to_end(k)
    c[k] = 1
    if len(c) > 2:
        c.popitem(last=False)
print(list(c))`,
        answer: "['a', 'c']",
        options: [
          { text: "['a', 'c']" },
          { text: "['b', 'c']", why: 'Reading "a" again moved it to the recent end, so "b" was oldest.' },
          { text: "['a', 'b']", why: 'Adding "c" made three entries; one had to go.' },
        ],
        explain: 'move_to_end marks a use; popitem(last=False) drops the least recent.',
      },
      {
        id: 's4-6-3',
        type: 'predict-output',
        prompt: 'The same without move_to_end: a FIFO cache. What is left?',
        code: `from collections import OrderedDict

c = OrderedDict()
for k in "abac":
    c[k] = 1
    if len(c) > 2:
        c.popitem(last=False)
print(list(c))`,
        answer: "['b', 'c']",
        options: [
          { text: "['b', 'c']" },
          { text: "['a', 'c']", why: 'Without move_to_end, "a" stays first and is dropped.' },
          { text: "['a', 'b']", why: 'Adding "c" pushed the count to three.' },
        ],
        explain: 'Setting an existing key does not move it in an OrderedDict.',
      },
      {
        id: 's4-6-4',
        type: 'estimate',
        prompt: 'A cache should hold 1 million entries of about 2 KB each. How much memory?',
        expr: '1e6 * 2 * KB / GB',
        answer: 2,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 0.2, why: '10⁶ × 2 × 10³ bytes is 2 × 10⁹: 2 GB.' },
          { value: 2 },
          { value: 20, why: 'One factor of ten too many.' },
        ],
        work: ['10⁶ × 2 KB = 2 × 10⁹ bytes = 2 GB', 'Plus overhead for keys and bookkeeping'],
        explain: 'Comfortably one cache server.',
      },
      {
        id: 's4-6-5',
        type: 'scenario',
        prompt: 'The hit rate fell from 90% to 60% after the catalogue doubled. What do you do?',
        situation: 'The cache is full all the time and evicts entries that are read again minutes later.',
        needs: ['Hit rate back near 90%', 'Data may stay as fresh as now'],
        options: [
          {
            text: 'Give the cache more memory',
            cost: 'A bigger or second cache server.',
          },
          {
            text: 'Shorten the TTL',
            cost: 'More refetches.',
            why: 'Shorter TTLs cause more misses, not fewer.',
          },
          {
            text: 'Switch from LRU to FIFO',
            cost: 'A config change.',
            why: 'FIFO ignores reuse and usually does worse.',
          },
        ],
        answer: 0,
        explain: 'The hot set no longer fits: grow the cache to fit it.',
      },
      {
        id: 's4-6-6',
        type: 'fill-blank',
        prompt: 'Drop the least recently used entry.',
        code: `from collections import OrderedDict

c = OrderedDict(a=1, b=2, c=3)
c.move_to_end("a")
c.popitem(last=___)
print(list(c))`,
        answer: ['False'],
        distractors: [{ text: 'True', why: 'last=True drops the most recently used entry.' }],
        expectOutput: "['c', 'a']",
        explain: 'The front of the OrderedDict is the least recently used.',
      },
      {
        id: 's4-6-7',
        type: 'mcq',
        prompt: 'When does FIFO do about as well as LRU?',
        options: [
          { text: 'When keys are rarely read twice' },
          { text: 'When a few keys are very popular', why: 'That is where LRU shines: it keeps them.' },
          { text: 'When the cache is too small', why: 'Then both struggle; LRU still keeps the hot keys.' },
        ],
        answer: 0,
        explain: 'With no reuse, nothing is worth keeping and the policy hardly matters.',
      },
      {
        id: 's4-6-8',
        type: 'mcq',
        prompt: 'A full cache with a 30% hit rate. What do you suspect first?',
        options: [
          { text: 'The hot data does not fit' },
          { text: 'The database is slow', why: 'That affects misses, not how many there are.' },
          { text: 'The TTL is too long', why: 'A long TTL raises the hit rate; staleness is its risk.' },
        ],
        answer: 0,
        explain: 'Measure the working set and compare it with the cache size.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's4-07',
    title: 'Stampedes',
    summary: 'When a hot entry expires, many misses hit the database at once; let one rebuild it and spread expiries.',
    card: {
      title: 'Stampedes',
      text: 'When a popular entry expires, every request that misses at that moment goes to the database together: a stampede. Let only one request rebuild the entry while the others wait or get the old value, and refresh hot entries a little before they expire. Add random jitter to TTLs so many entries do not expire at the same moment.',
    },
    exercises: [
      {
        id: 's4-7-1',
        type: 'estimate',
        prompt: 'A key is read 5,000 times a second; rebuilding it takes 0.2 s. Without protection, how many requests hit the database during one rebuild?',
        expr: '5000 * 0.2',
        answer: 1000,
        tolerance: 1.5,
        unit: 'requests',
        options: [
          { value: 10, why: 'Every request in those 0.2 s misses: 5,000 × 0.2.' },
          { value: 1000 },
          { value: 25000, why: 'Multiply by 0.2 s, do not divide.' },
        ],
        work: ['Requests during the rebuild: 5,000/s × 0.2 s = 1,000', 'Each runs the same slow query'],
        explain: 'A thousand copies of the slowest query at once.',
      },
      {
        id: 's4-7-2',
        type: 'predict-output',
        prompt: 'Five requests miss at once, but only the first starts a rebuild. How many database calls?',
        code: `inflight = set()
db_calls = 0
for req in range(5):
    if "k" not in inflight:
        inflight.add("k")
        db_calls += 1
print(db_calls)`,
        answer: '1',
        typedWrong: [{ answer: '5', why: 'After the first, "k" is in flight, so the rest wait.' }],
        explain: 'Called single-flight or request coalescing.',
      },
      {
        id: 's4-7-3',
        type: 'order-steps',
        prompt: 'A hot key expires, with single-flight. Put it in order.',
        steps: [
          'The first request misses and marks the key as being rebuilt',
          'Other requests see the mark and wait (or take the old value)',
          'The first request reads the database',
          'It writes the fresh value to the cache and clears the mark',
          'The waiting requests read the cache',
        ],
        explain: 'One database read instead of a thousand.',
      },
      {
        id: 's4-7-4',
        type: 'predict-output',
        prompt: 'TTLs of 300 s with jitter. When do these four entries expire?',
        code: `jitter = [-20, 5, 17, -8]
ttls = [300 + j for j in jitter]
print(sorted(ttls))`,
        answer: '[280, 292, 305, 317]',
        typedWrong: [{ answer: '[300, 300, 300, 300]', why: 'Each TTL gets its own offset.' }],
        explain: 'Spread over half a minute instead of all at second 300.',
      },
      {
        id: 's4-7-5',
        type: 'scenario',
        prompt: 'Every 10 minutes, at the same second, the database spikes. Why, and what fixes it?',
        situation: 'At each deploy the cache is filled with every product, all with a 10-minute TTL.',
        needs: ['No regular spikes', 'Keep the 10-minute freshness'],
        options: [
          {
            text: 'Add random jitter to each TTL',
            cost: 'Some entries live a little shorter or longer.',
          },
          {
            text: 'Double the TTL',
            cost: 'Data up to 20 minutes old.',
            why: 'The spikes come every 20 minutes instead, and freshness suffers.',
          },
          {
            text: 'Bigger database for the spikes',
            cost: 'A machine sized for a spike that lasts seconds.',
            why: 'It pays for the symptom; the cause is synchronised expiry.',
          },
        ],
        answer: 0,
        explain: 'Entries filled together expire together, unless jitter spreads them.',
      },
      {
        id: 's4-7-6',
        type: 'mcq',
        prompt: 'What does "serve stale while revalidating" mean?',
        options: [
          { text: 'Old value now, refresh behind' },
          { text: 'Never refresh anything', why: 'One request does refresh in the background.' },
          { text: 'Block every reader until fresh', why: 'That is the opposite: nobody waits.' },
        ],
        answer: 0,
        explain: 'Nobody waits, and the database sees one read.',
      },
      {
        id: 's4-7-7',
        type: 'diagram',
        prompt: 'A hot key expires without protection. Which box is overwhelmed?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Users' },
            { id: 'a', kind: 'service', label: 'App servers' },
            { id: 'c', kind: 'cache', label: 'Cache' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'u', to: 'a' },
            { from: 'a', to: 'c' },
            { from: 'a', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'd',
          why: {
            u: 'Users only see slower pages.',
            a: 'They just pass the misses on, waiting.',
            c: 'The cache answers "miss" quickly; it is not the one doing work.',
          },
        },
        explain: 'Every miss becomes the same expensive query.',
      },
      {
        id: 's4-7-8',
        type: 'fill-blank',
        prompt: 'Only the first miss rebuilds.',
        code: `cache, inflight = {}, set()
rebuilds = 0
for req in range(4):
    if "k" in cache or "k" in ___:
        continue
    inflight.add("k")
    rebuilds += 1
print(rebuilds)`,
        answer: ['inflight'],
        distractors: [{ text: 'cache', why: 'The cache is still empty during the rebuild; every request would rebuild.' }],
        expectOutput: '1',
        explain: 'Check the cache, then the in-flight set.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's4-08',
    title: 'CDNs',
    summary: 'Caches near users for files and public pages; Cache-Control says how long, purges remove early.',
    card: {
      title: 'CDNs',
      text: 'A CDN (content delivery network) is a network of caches near users that keeps copies of your files: images, scripts, video, sometimes whole public pages. Your servers, the origin, say how long each file may be kept with a Cache-Control header, and you can purge a file when it changes. Versioned names such as app.3f9c.js can be cached for a year and still update at once.',
      diagram: {
        nodes: [
          { id: 'u', kind: 'client', label: 'User' },
          { id: 'e', kind: 'cdn', label: 'CDN edge' },
          { id: 'o', kind: 'service', label: 'Origin' },
          { id: 's', kind: 'store', label: 'Files' },
        ],
        edges: [
          { from: 'u', to: 'e', label: 'GET' },
          { from: 'e', to: 'o', label: 'miss' },
          { from: 'o', to: 's' },
        ],
      },
    },
    exercises: [
      {
        id: 's4-8-1',
        type: 'diagram',
        prompt: 'The edge does not have the file yet. Tap the path of the request, in order.',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'User' },
            { id: 'e', kind: 'cdn', label: 'CDN edge' },
            { id: 'o', kind: 'service', label: 'Origin' },
            { id: 's', kind: 'store', label: 'Files' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'u', to: 'e' },
            { from: 'e', to: 'o' },
            { from: 'o', to: 's' },
            { from: 'o', to: 'd' },
          ],
        },
        goal: { kind: 'path', answer: ['u', 'e', 'o', 's'] },
        explain: 'Afterwards the edge keeps a copy, and nearby users stop at the edge.',
      },
      {
        id: 's4-8-2',
        type: 'estimate',
        prompt: 'Images go out at 10 Gbit/s and the CDN serves 95% of them from its edges. How much must the origin send?',
        expr: '10 * (1 - 0.95)',
        answer: 0.5,
        tolerance: 1.5,
        unit: 'Gbit/s',
        options: [
          { value: 0.5 },
          { value: 5, why: 'Only the 5% of misses reach the origin.' },
          { value: 9.5, why: 'That is what the CDN serves.' },
        ],
        work: ['Misses: 5% of 10 Gbit/s = 0.5 Gbit/s'],
        explain: 'Twentyfold less traffic leaving your own servers.',
      },
      {
        id: 's4-8-3',
        type: 'bucket-sort',
        prompt: 'Should the CDN cache it?',
        buckets: ['Cache at CDN', 'Do not'],
        items: [
          { text: 'The site logo', bucket: 0, why: 'Public and the same for everyone.' },
          { text: 'app.3f9c.js', bucket: 0, why: 'Versioned: a new name for each release.' },
          { text: 'A product photo', bucket: 0, why: 'Public, large and read often.' },
          { text: 'My account page', bucket: 1, why: 'Private to one user.' },
          { text: 'POST /checkout', bucket: 1, why: 'A write; it must reach the origin every time.' },
          { text: 'A personalised feed', bucket: 1, why: 'Different for every user and changing constantly.' },
        ],
        explain: 'Public, identical for everyone, read often: CDN.',
      },
      {
        id: 's4-8-4',
        type: 'mcq',
        prompt: 'Why can app.3f9c.js be cached for a year?',
        options: [
          { text: 'A change gets a new name' },
          { text: 'Scripts never change', why: 'They change every release; the name changes with them.' },
          { text: 'CDNs ignore long lifetimes', why: 'They honour them; versioning makes it safe.' },
        ],
        answer: 0,
        explain: 'The page points at the new name, so old copies are simply never asked for.',
      },
      {
        id: 's4-8-5',
        type: 'scenario',
        prompt: 'You fixed a typo in logo.png, cached at the CDN for a day. What now?',
        situation: 'The file name is not versioned. Users still see the old logo.',
        needs: ['Users see the new logo within minutes'],
        options: [
          {
            text: 'Purge logo.png at the CDN',
            cost: 'A purge request; edges refetch it from the origin.',
          },
          {
            text: 'Wait a day',
            cost: 'Nothing.',
            why: 'That breaks the "within minutes" need.',
          },
          {
            text: 'Ask users to clear caches',
            cost: 'Annoyed users.',
            why: 'You cannot reach every user, and the CDN would still serve the old file.',
          },
        ],
        answer: 0,
        explain: 'Longer term, version the name (logo.8b1d.png) and skip purges.',
      },
      {
        id: 's4-8-6',
        type: 'predict-output',
        prompt: 'A versioned file name from the content\'s hash. What does this print?',
        code: `import hashlib

body = b"console.log(1)"
h = hashlib.sha256(body).hexdigest()
print(f"app.{h[:6]}.js")`,
        answer: 'app.0a2868.js',
        options: [
          { text: 'app.0a2868.js' },
          { text: 'app.js', why: 'The hash is put into the name.' },
          { text: 'app.console.js', why: 'The name holds a hash of the content, not the content.' },
        ],
        explain: 'Change one byte of the file and the name changes completely.',
      },
      {
        id: 's4-8-7',
        type: 'estimate',
        prompt: 'A new connection takes 3 round trips. From the far origin each is 150 ms; from a nearby edge, 20 ms. How much does the edge save?',
        expr: '3 * (WORLD_ROUND_TRIP - 0.02) * 1000',
        answer: 390,
        tolerance: 1.5,
        unit: 'ms',
        options: [
          { value: 39, why: '3 × (150 − 20) ms is 390 ms.' },
          { value: 390 },
          { value: 3900, why: 'Under half a second, not several.' },
        ],
        work: ['Per round trip: 150 − 20 = 130 ms saved', '× 3 round trips = 390 ms'],
        explain: 'Before a single byte of the file has moved.',
      },
      {
        id: 's4-8-8',
        type: 'mcq',
        prompt: 'Can a CDN cache pages that differ per user?',
        options: [
          { text: 'Not safely by default' },
          { text: 'Yes: caching is always safe', why: 'One user\'s page could be served to another.' },
          { text: 'Yes, if the TTL is short', why: 'Even a second of sharing private pages is a leak.' },
        ],
        answer: 0,
        explain: 'Mark private responses Cache-Control: private (or no-store).',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's4-09',
    title: 'What to cache, and what never',
    summary: 'Cache what is read often, changes rarely and may be a little old; never what must be exact or is private.',
    card: {
      title: 'What to cache, and what never',
      text: 'Cache what is read often, changes rarely and may be a little old: product pages, settings, rendered fragments, expensive results. Do not cache what must be exact right now, such as balances, stock at checkout or permissions, and never cache private data under a key that leaves out the user. A cache is a copy; the database stays the source of truth.',
    },
    exercises: [
      {
        id: 's4-9-1',
        type: 'bucket-sort',
        prompt: 'Cache it, or read it fresh?',
        buckets: ['Cache', 'Read fresh'],
        items: [
          { text: 'A rendered product page fragment', bucket: 0, why: 'Expensive to build, the same for everyone, changes rarely.' },
          { text: 'Whether this user may delete this file', bucket: 1, why: 'A revoked permission must stop working at once.' },
          { text: 'Seats left during booking', bucket: 1, why: 'Overselling costs real money.' },
          { text: 'The site\'s feature flags', bucket: 0, why: 'Read constantly; seconds of delay are fine.' },
          { text: 'Today\'s top 10 articles', bucket: 0, why: 'Expensive to compute, fine a minute old.' },
        ],
        explain: 'Ask: what does it cost if this is a minute old?',
      },
      {
        id: 's4-9-2',
        type: 'scenario',
        prompt: 'Users see each other\'s order history. What went wrong?',
        situation: 'The order-history page was cached under the key "orders_page".',
        needs: ['Each user sees only their own orders', 'Keep pages fast'],
        options: [
          {
            text: 'Put the user id in the key',
            cost: 'One entry per user, so more memory and a lower hit rate.',
          },
          {
            text: 'Shorten the TTL to 5 seconds',
            cost: 'More misses.',
            why: 'For 5 seconds, users still see someone else\'s orders.',
          },
          {
            text: 'Cache it at the CDN instead',
            cost: 'A CDN setup.',
            why: 'Same key, same leak, now at the edge too.',
          },
        ],
        answer: 0,
        explain: 'Private data needs the owner in the key, or no cache at all.',
      },
      {
        id: 's4-9-3',
        type: 'mcq',
        prompt: 'The cache and the database disagree. Which one is right?',
        options: [
          { text: 'The database' },
          { text: 'The cache', why: 'The cache is a copy and can be stale.' },
          { text: 'Whichever is newer', why: 'The database is the source of truth by design.' },
        ],
        answer: 0,
        explain: 'Design so the cache can always be thrown away and rebuilt.',
      },
      {
        id: 's4-9-4',
        type: 'scenario',
        prompt: 'Should stock levels on product pages be cached?',
        situation: 'Product pages show "In stock" or "Sold out". Checkout separately reserves stock in the database.',
        needs: ['Fast product pages', 'Never sell stock that is not there'],
        options: [
          {
            text: 'Brief cache; exact at checkout',
            cost: 'A page may say "In stock" for seconds after selling out.',
          },
          {
            text: 'Never cache the stock levels',
            cost: 'Every product view queries stock.',
            why: 'Checkout already prevents overselling; pages can be a little old.',
          },
          {
            text: 'Cache it for a whole day',
            cost: 'Very few queries.',
            why: 'Pages would say "In stock" all day after selling out.',
          },
        ],
        answer: 0,
        explain: 'Approximate for display, exact where the decision is made.',
      },
      {
        id: 's4-9-5',
        type: 'diagram',
        prompt: 'Which box must answer "may this user delete this?" fresh, not from a cache?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'c', kind: 'cache', label: 'Page cache' },
            { id: 'p', kind: 'db', label: 'Permissions' },
            { id: 'f', kind: 'store', label: 'Files' },
          ],
          edges: [
            { from: 'a', to: 'c' },
            { from: 'a', to: 'p' },
            { from: 'a', to: 'f' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'p',
          why: {
            a: 'The app asks; the question is where the answer comes from.',
            c: 'A page cache may be seconds or minutes old: a revoked user could still delete.',
            f: 'The files are what is protected, not the rule.',
          },
        },
        explain: 'Security checks read the source of truth.',
      },
      {
        id: 's4-9-6',
        type: 'estimate',
        prompt: 'Caching the order page per user: 2 million active users, 5 KB each. How much cache memory?',
        expr: '2e6 * 5 * KB / GB',
        answer: 10,
        tolerance: 1.5,
        unit: 'GB',
        work: ['2 × 10⁶ × 5 KB = 10¹⁰ bytes = 10 GB'],
        explain: 'Per-user keys cost memory: worth checking before you do it.',
      },
      {
        id: 's4-9-7',
        type: 'mcq',
        prompt: 'Which is the safest default for a new endpoint?',
        options: [
          { text: 'No cache until it is needed' },
          { text: 'Cache everything for an hour', why: 'Stale or leaked data is a worse problem than slowness.' },
          { text: 'Cache only errors', why: 'Errors are what you least want repeated.' },
        ],
        answer: 0,
        explain: 'Add caching where measurements show it pays, with a key and TTL chosen on purpose.',
      },
      {
        id: 's4-9-8',
        type: 'fill-blank',
        prompt: 'Private data: the user goes into the key.',
        code: `def key(page, user):
    return f"{page}:{___}"

print(key("orders", "u42"))`,
        answer: ['user'],
        distractors: [{ text: 'page', why: 'That repeats the page name and still leaves out the user.' }],
        expectOutput: 'orders:u42',
        explain: 'Two users, two entries.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's4-10',
    title: 'Checkpoint: caching and CDNs',
    summary: 'Hits, cache-aside, writes, TTL, invalidation, eviction, stampedes, CDNs and what never to cache, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's4-10-1',
        type: 'estimate',
        prompt: '98% hit rate at 2 ms; misses take 500 ms. Average read time?',
        expr: '0.98 * 2 + 0.02 * 500',
        answer: 11.96,
        tolerance: 1.5,
        unit: 'ms',
        options: [
          { value: 2, why: 'The 2% of misses add 10 ms.' },
          { value: 12 },
          { value: 250, why: 'Most reads are fast hits.' },
        ],
        work: ['0.98 × 2 = 1.96 ms', '0.02 × 500 = 10 ms', 'Total ≈ 12 ms'],
        explain: 'Misses still dominate the average.',
      },
      {
        id: 's4-10-2',
        type: 'predict-output',
        prompt: 'How many database queries?',
        code: `db = sim.FakeDB({"x": 1, "y": 2})
cache = {}
for k in "xyxxyx":
    if k not in cache:
        cache[k] = db.get(k)
print(db.queries)`,
        answer: '2',
        typedWrong: [{ answer: '6', why: 'Only the first read of each key misses.' }],
        explain: 'Two keys, two misses.',
      },
      {
        id: 's4-10-3',
        type: 'scenario',
        prompt: 'Likes on posts: millions of updates a second. Losing a few seconds of likes in a crash is fine. How do you write them?',
        situation: 'Each like increments a counter shown under the post.',
        needs: ['Handle the write rate', 'Counts may lag by seconds'],
        options: [
          {
            text: 'Write-back with periodic saves',
            cost: 'A crash loses the last few seconds of likes.',
          },
          {
            text: 'Write-through on every like',
            cost: 'Millions of database writes a second.',
            why: 'The database cannot take that rate.',
          },
        ],
        answer: 0,
        explain: 'Exactly the trade write-back is for.',
      },
      {
        id: 's4-10-4',
        type: 'figure',
        prompt: 'Reach a hit rate of at least 37%.',
        figure: {
          kind: 'cache',
          reads: 'a b a c a d a b',
          size: 1,
          policy: 'fifo',
          ttl: null,
          editable: ['size', 'policy'],
          goal: { hitRate: 0.37 },
        },
        explain: 'Two entries with LRU, or a bigger cache: "a" must survive between its reads.',
      },
      {
        id: 's4-10-5',
        type: 'order-steps',
        prompt: 'Changing a cached value safely. Put it in order.',
        steps: [
          'Write the new value to the database',
          'Delete the cached entry',
          'The next read misses',
          'It reads the database and caches the new value',
        ],
        explain: 'Database first, then delete.',
      },
      {
        id: 's4-10-6',
        type: 'mcq',
        prompt: 'A popular key expires and the database falls over. What was missing?',
        options: [
          { text: 'Single-flight rebuilds' },
          { text: 'A much longer TTL', why: 'It would just fall over less often.' },
          { text: 'Switching to FIFO eviction', why: 'Eviction policy does not stop simultaneous misses.' },
        ],
        answer: 0,
        explain: 'Plus jittered TTLs and early refresh for hot keys.',
      },
      {
        id: 's4-10-7',
        type: 'predict-output',
        prompt: 'Two-entry LRU. What is left after a, b, a, c, b?',
        code: `from collections import OrderedDict

c = OrderedDict()
for k in "abacb":
    if k in c:
        c.move_to_end(k)
    c[k] = 1
    if len(c) > 2:
        c.popitem(last=False)
print(list(c))`,
        answer: "['c', 'b']",
        typedWrong: [{ answer: "['a', 'b']", why: 'Adding "c" dropped "b"; then "b" came back and dropped "a".' }],
        explain: 'Trace it: [a] [a,b] [b,a] [a,c] [c,b].',
      },
      {
        id: 's4-10-8',
        type: 'diagram',
        prompt: 'Users far away load images slowly. What goes in the empty slot?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Users' },
            { id: 'e', kind: 'cdn', label: 'CDN edge' },
            { id: 'o', kind: 'service', label: 'Origin' },
            { id: 's', kind: 'store', label: 'Images' },
          ],
          edges: [
            { from: 'u', to: 'e' },
            { from: 'e', to: 'o' },
            { from: 'o', to: 's' },
          ],
        },
        goal: {
          kind: 'slot',
          slot: 'e',
          options: [
            { kind: 'cdn', label: 'CDN edge' },
            { kind: 'lb', label: 'Balancer', why: 'A balancer spreads load at the origin; it does not move bytes closer to users.' },
            { kind: 'queue', label: 'Queue', why: 'A queue delays work; images must be served now.' },
          ],
          answer: 0,
        },
        explain: 'Copies near users: shorter round trips, less origin traffic.',
      },
      {
        id: 's4-10-9',
        type: 'bucket-sort',
        prompt: 'Cache it, or read fresh?',
        buckets: ['Cache', 'Read fresh'],
        items: [
          { text: 'A help-centre article', bucket: 0, why: 'Public, read often, rarely edited.' },
          { text: 'A bank balance before a transfer', bucket: 1, why: 'Must be exact.' },
          { text: 'A user\'s admin rights', bucket: 1, why: 'Revocation must take effect at once.' },
          { text: 'A list of currencies', bucket: 0, why: 'Almost never changes.' },
          { text: 'A trending-topics list', bucket: 0, why: 'Expensive, fine a minute old.' },
        ],
        explain: 'Exactness and privacy decide; speed is the reward.',
      },
      {
        id: 's4-10-10',
        type: 'mcq',
        prompt: 'Why do versioned file names let you cache scripts for a year?',
        options: [
          { text: 'Each release has a new name' },
          { text: 'Scripts are tiny', why: 'Size is not the reason.' },
          { text: 'Browsers ignore long lifetimes', why: 'They honour them; new names make that safe.' },
        ],
        answer: 0,
        explain: 'Old names are never requested again.',
      },
    ],
  },
];
