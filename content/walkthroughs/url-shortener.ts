import type { Walkthrough } from '../schema';

/*
 * Walkthrough 1: a URL shortener, through the seven-step framework.
 * Unlocks after S1-S5. Exercise code runs with the System Design prelude
 * (Numbers page names such as MONTH and TB).
 */
export const urlShortener: Walkthrough = {
  id: 'w-url-shortener',
  title: 'URL shortener',
  question: 'Design a service like a link shortener: paste a long URL, get a short one, and anyone who opens the short one is sent to the long one.',
  needs: ['S1', 'S2', 'S3', 'S4', 'S5'],
  minutes: 18,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "Version 1 creates short links and redirects them; links never expire; custom aliases would be nice; click analytics come later."',
      exercises: [
        {
          id: 'wus-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Create a short link for a long URL', bucket: 0, why: 'The core feature, stated.' },
            { text: 'Redirect a short link', bucket: 0, why: 'The other core feature.' },
            { text: 'Custom aliases', bucket: 0, why: '"Nice to have" in v1: in scope, lower priority.' },
            { text: 'Click analytics dashboards', bucket: 1, why: 'Stated as later.' },
            { text: 'Links that expire', bucket: 1, why: 'Links never expire in v1.' },
            { text: 'User accounts and link lists', bucket: 1, why: 'Not asked for; keep v1 small.' },
          ],
          explain: 'Saying what is out of scope is as useful as saying what is in.',
        },
        {
          id: 'wus-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most here?',
          options: [
            { text: 'Fast, always-on redirects' },
            { text: 'Strong consistency for analytics', why: 'Analytics are not in v1.' },
            { text: 'Fast link creation', why: 'Links are created far less often than they are opened.' },
          ],
          answer: 0,
          explain: 'A broken or slow redirect breaks every page that links to you.',
        },
        {
          id: 'wus-1-3',
          type: 'order-steps',
          prompt: 'Put your opening questions to the interviewer in a sensible order.',
          steps: [
            'Which features are in scope?',
            'How many links are created, and how often are they opened?',
            'How fast must redirects be, and how available?',
            'Anything special: expiry, aliases, abuse?',
          ],
          explain: 'Features, then scale, then quality, then edge cases.',
        },
      ],
      strong: 'Restates the two core features (create, redirect), names aliases as a stretch and analytics and expiry as out of scope, and says the system is read-heavy and that redirects must be fast and highly available.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "100 million new links a month, each opened about 100 times. Keep links for 5 years; a record is about 500 bytes."',
      exercises: [
        {
          id: 'wus-2-1',
          type: 'estimate',
          prompt: 'New links per second, on average?',
          expr: '1e8 / MONTH',
          answer: 38.6,
          tolerance: 2,
          unit: 'writes/s',
          options: [
            { value: 4, why: '10⁸ a month ÷ 2.6 × 10⁶ seconds is about 40.' },
            { value: 40 },
            { value: 400, why: 'One factor of ten too many.' },
          ],
          work: ['A month ≈ 2.6 × 10⁶ s (Numbers page)', '10⁸ ÷ 2.6 × 10⁶ ≈ 39 per second'],
          explain: 'Writes are tiny: one database could take them.',
        },
        {
          id: 'wus-2-2',
          type: 'estimate',
          prompt: 'Redirects per second, on average, at 100 reads per link?',
          expr: '1e8 / MONTH * 100',
          answer: 3858,
          tolerance: 2,
          unit: 'reads/s',
          work: ['39 writes/s × 100 ≈ 3,900 reads/s', 'Peaks perhaps 3× that'],
          explain: 'Reads dominate: design the read path first.',
        },
        {
          id: 'wus-2-3',
          type: 'estimate',
          prompt: 'Storage for 5 years of links at 500 bytes each?',
          expr: '1e8 * 12 * 5 * 500 / TB',
          answer: 3,
          tolerance: 2,
          unit: 'TB',
          options: [
            { value: 0.3, why: '6 × 10⁹ links × 500 B is 3 × 10¹² B.' },
            { value: 3 },
            { value: 300, why: 'Two factors of ten too many.' },
          ],
          work: ['10⁸ × 12 × 5 = 6 × 10⁹ links', '× 500 B = 3 × 10¹² B = 3 TB'],
          explain: 'Small enough for one database server, with replicas for safety.',
        },
      ],
      strong: 'About 40 writes and 4,000 reads a second on average, a few times that at peak, and about 3 TB over five years: read-heavy, modest data, so caching matters more than sharding.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Two endpoints cover version 1.',
      exercises: [
        {
          id: 'wus-3-1',
          type: 'match-pairs',
          prompt: 'Match each request to what it returns.',
          pairs: [
            { left: 'POST /urls', right: '201 with the short code', why: 'Creating a link creates a resource.' },
            { left: 'GET /abc123', right: 'a redirect to the long URL', why: 'Opening the short link sends the browser on.' },
            { left: 'GET /nope99', right: '404 not found', why: 'No such code.' },
            { left: 'POST /urls, bad URL', right: '400 bad request', why: 'Invalid input: the client must fix it.' },
          ],
          explain: 'Status codes from S1.',
        },
        {
          id: 'wus-3-2',
          type: 'scenario',
          prompt: '301 (permanent) or 302 (temporary) for the redirect?',
          situation: 'Browsers cache 301 redirects and may skip your server next time; 302 redirects reach you every time.',
          needs: ['Click analytics will be added later', 'Redirects fast for users'],
          options: [
            {
              text: '302 (temporary)',
              cost: 'More traffic on our servers.',
            },
            {
              text: '301 (permanent)',
              cost: 'Less traffic.',
              why: 'Cached clicks never reach us, so future analytics would miss them.',
            },
          ],
          answer: 0,
          explain: 'A strong answer names both and picks by requirements; without analytics plans, 301 would be fine.',
        },
        {
          id: 'wus-3-3',
          type: 'order-steps',
          prompt: 'Opening a short link. Put the redirect in order.',
          steps: [
            'The browser requests GET /abc123',
            'The service looks up abc123',
            'It finds the long URL',
            'It answers 302 with a Location header',
            'The browser requests the long URL',
          ],
          explain: 'One extra round trip for the user: keep the lookup fast.',
        },
      ],
      strong: 'POST /urls with the long URL (and an optional alias) returns 201 and the code; GET /{code} returns 302 with a Location header, or 404. The choice of 302 over 301 is explained by future analytics.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Each link maps a short code to a long URL, looked up by code.',
      exercises: [
        {
          id: 'wus-4-1',
          type: 'predict-output',
          prompt: 'Codes use 62 characters (0-9, a-z, A-Z). The shortest length that gives 6 billion codes?',
          code: `n, need = 1, 6e9
while 62 ** n < need:
    n += 1
print(n)`,
          answer: '6',
          typedWrong: [{ answer: '7', why: '62⁶ ≈ 57 billion is already enough.' }],
          explain: 'Six characters cover five years with room to spare; seven covers 3.5 trillion.',
        },
        {
          id: 'wus-4-2',
          type: 'predict-output',
          prompt: 'Turning a number into a base-62 code. What does this print?',
          code: `import string
A = (string.digits
     + string.ascii_lowercase
     + string.ascii_uppercase)

def b62(n):
    s = ""
    while n:
        n, r = divmod(n, 62)
        s = A[r] + s
    return s or "0"

print(b62(125), b62(61))`,
          answer: '21 Z',
          typedWrong: [{ answer: '125 61', why: 'Each digit is a base-62 digit: 125 = 2 × 62 + 1.' }],
          explain: 'A counter becomes a short code.',
        },
        {
          id: 'wus-4-3',
          type: 'scenario',
          prompt: 'How do you make codes?',
          situation: 'Codes must be unique. Short codes matter; guessable, sequential codes are acceptable for v1.',
          needs: ['Never two links with one code', 'Simple to build'],
          options: [
            {
              text: 'A counter, written in base 62',
              cost: 'Needs a unique counter across servers; codes are guessable.',
            },
            {
              text: 'Hash the long URL, keep 6 chars',
              cost: 'Collisions must be detected and resolved.',
              why: 'Cut-down hashes collide; handling that is more work.',
            },
            {
              text: 'Random 6 chars, no check',
              cost: 'Nothing to coordinate.',
              why: 'Without a check, two links will eventually get the same code.',
            },
          ],
          answer: 0,
          explain: 'If guessability mattered, random codes with a uniqueness check would win.',
        },
        {
          id: 'wus-4-4',
          type: 'mcq',
          prompt: 'Which store fits the links table?',
          options: [
            { text: 'Key-value or a simple table' },
            { text: 'A graph database', why: 'Links have no relationships to walk.' },
            { text: 'A wide-column event store', why: 'Writes are only about 40 a second.' },
          ],
          answer: 0,
          explain: 'Lookups by one key, 3 TB: a key-value store or one relational table both work.',
        },
      ],
      strong: 'A table (or key-value store) from code to long URL, created time and optional owner; codes of 6 to 7 base-62 characters from a counter; the primary key is the code, so every redirect is one key lookup.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Put the pieces together: stateless servers, a cache for hot links, and the database.',
      exercises: [
        {
          id: 'wus-5-1',
          type: 'diagram',
          prompt: 'Most redirects should not reach the database. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Browser' },
              { id: 'l', kind: 'lb', label: 'Balancer' },
              { id: 's', kind: 'service', label: 'Shortener' },
              { id: 'k', kind: 'cache', label: 'Cache' },
              { id: 'd', kind: 'db', label: 'Links DB' },
            ],
            edges: [
              { from: 'c', to: 'l' },
              { from: 'l', to: 's' },
              { from: 's', to: 'k' },
              { from: 's', to: 'd' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'k',
            options: [
              { kind: 'cache', label: 'Cache' },
              { kind: 'queue', label: 'Queue', why: 'A redirect needs an answer now, not later.' },
              { kind: 'search', label: 'Search index', why: 'Lookups are by exact code, not by text.' },
            ],
            answer: 0,
          },
          explain: 'Cache-aside on the code: hot links are answered from memory.',
        },
        {
          id: 'wus-5-2',
          type: 'diagram',
          prompt: 'A cached link is opened. Tap the path, in order.',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Browser' },
              { id: 'l', kind: 'lb', label: 'Balancer' },
              { id: 's', kind: 'service', label: 'Shortener' },
              { id: 'k', kind: 'cache', label: 'Cache' },
              { id: 'd', kind: 'db', label: 'Links DB' },
            ],
            edges: [
              { from: 'c', to: 'l' },
              { from: 'l', to: 's' },
              { from: 's', to: 'k' },
              { from: 's', to: 'd' },
            ],
          },
          goal: { kind: 'path', answer: ['c', 'l', 's', 'k'] },
          explain: 'The database only sees cache misses and new links.',
        },
        {
          id: 'wus-5-3',
          type: 'mcq',
          prompt: 'Why can the shortener servers scale out easily?',
          options: [
            { text: 'They keep no state' },
            { text: 'They hold the links in memory', why: 'Links live in the cache and database, not in servers.' },
            { text: 'Each owns a slice of codes', why: 'Any server can serve any code.' },
          ],
          answer: 0,
          explain: 'Add servers behind the balancer as traffic grows (S3).',
        },
      ],
      strong: 'Browser → balancer → stateless shortener servers → cache (cache-aside by code) → links database with a standby; the database sees about 40 writes a second plus cache misses.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Browser' },
          { id: 'l', kind: 'lb', label: 'Balancer' },
          { id: 's', kind: 'service', label: 'Shortener' },
          { id: 'k', kind: 'cache', label: 'Cache' },
          { id: 'd', kind: 'db', label: 'Links DB' },
          { id: 'r', kind: 'replica', label: 'Standby' },
        ],
        edges: [
          { from: 'c', to: 'l' },
          { from: 'l', to: 's' },
          { from: 's', to: 'k' },
          { from: 's', to: 'd' },
          { from: 'd', to: 'r', dashed: true },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: making unique codes from many servers at once, fast.',
      exercises: [
        {
          id: 'wus-6-1',
          type: 'scenario',
          prompt: 'Ten servers create links. How does each get unique counter values?',
          situation: 'One shared counter in the database works, but every new link would wait for it.',
          needs: ['Unique codes across all servers', 'Creating a link does not wait on one shared counter'],
          options: [
            {
              text: 'Each server reserves blocks of 1,000',
              cost: 'A crash wastes the rest of a block; codes are not in time order.',
            },
            {
              text: 'Ask the database counter per link',
              cost: 'One shared hot spot.',
              why: 'Every creation waits on the same counter, against the needs.',
            },
            {
              text: 'Each server counts from 1',
              cost: 'Nothing to coordinate.',
              why: 'Ten servers would all hand out code 1.',
            },
          ],
          answer: 0,
          explain: 'One round trip per 1,000 links; gaps in the sequence do not matter.',
        },
        {
          id: 'wus-6-2',
          type: 'estimate',
          prompt: 'Keep the 10 million most-opened links in the cache at 500 bytes each. Cache memory?',
          expr: '10e6 * 500 / GB',
          answer: 5,
          tolerance: 1.5,
          unit: 'GB',
          work: ['10⁷ × 500 B = 5 × 10⁹ B = 5 GB'],
          explain: 'One cache server holds the hot set comfortably.',
        },
        {
          id: 'wus-6-3',
          type: 'predict-output',
          prompt: 'The counter hands a server block number 7. Which counter values may it use?',
          code: `def block(k, size=1000):
    start = k * size
    return start, start + size - 1

print(block(7))`,
          answer: '(7000, 7999)',
          typedWrong: [{ answer: '(7000, 8000)', why: 'The block ends one before the next one starts.' }],
          explain: 'The counter hands out block numbers; servers fill them locally.',
        },
      ],
      strong: 'Codes from a counter handed out in blocks per server (no per-link coordination), encoded in base 62; a 5 GB cache for hot links; optional aliases checked for uniqueness against the same table.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Push the design to ten times the load, and to one link going viral.',
      exercises: [
        {
          id: 'wus-7-1',
          type: 'diagram',
          prompt: 'A celebrity posts one short link: 50,000 clicks a second on one code. Which box takes the heat?',
          diagram: {
            nodes: [
              { id: 'l', kind: 'lb', label: 'Balancer' },
              { id: 's', kind: 'service', label: 'Shortener' },
              { id: 'k', kind: 'cache', label: 'Cache node' },
              { id: 'd', kind: 'db', label: 'Links DB' },
            ],
            edges: [
              { from: 'l', to: 's' },
              { from: 's', to: 'k' },
              { from: 's', to: 'd' },
            ],
          },
          goal: {
            kind: 'tap',
            answer: 'k',
            why: {
              l: 'Balancers spread requests; they handle this rate fine.',
              s: 'Servers are many and stateless; the load spreads across them.',
              d: 'The link is cached, so the database barely sees these clicks.',
            },
          },
          explain: 'Every click asks the one cache node holding that key: a hot key.',
        },
        {
          id: 'wus-7-2',
          type: 'scenario',
          prompt: 'How do you relieve the hot key?',
          situation: 'One cache node is saturated by a single viral code.',
          needs: ['Viral links stay fast', 'Little new infrastructure'],
          options: [
            {
              text: 'Short in-process caches on servers',
              cost: 'Each server holds a copy for a few seconds.',
            },
            {
              text: 'A bigger cache node',
              cost: 'A pricier machine.',
              why: 'One node still serves every request for the key.',
            },
            {
              text: 'Serve the link from the database',
              cost: 'Database load.',
              why: 'Moves the hot spot to the database.',
            },
          ],
          answer: 0,
          explain: 'Links never change, so even long local caching is safe here.',
        },
        {
          id: 'wus-7-3',
          type: 'mcq',
          prompt: 'At ten times today\'s traffic, what do you add first?',
          options: [
            { text: 'More servers and cache' },
            { text: 'Shard the database', why: 'Writes are only about 400 a second at 10×: one database still copes.' },
            { text: 'A message queue in front', why: 'Redirects need answers now; nothing here is deferred work.' },
          ],
          answer: 0,
          explain: 'The read path grows first; the database comes much later.',
        },
      ],
      strong: 'Names the hot-key problem and fixes it with short local caches (links are immutable), scales stateless servers and cache with traffic, and states that sharding the 3 TB database is not needed even at 10×.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'c', kind: 'client', label: 'Browser' },
        { id: 'l', kind: 'lb', label: 'Balancer' },
        { id: 's', kind: 'service', label: 'Shortener' },
        { id: 'k', kind: 'cache', label: 'Cache' },
        { id: 'd', kind: 'db', label: 'Links DB' },
        { id: 'r', kind: 'replica', label: 'Standby' },
      ],
      edges: [
        { from: 'c', to: 'l', label: 'GET' },
        { from: 'l', to: 's' },
        { from: 's', to: 'k', label: 'code' },
        { from: 's', to: 'd', label: 'miss' },
        { from: 'd', to: 'r', dashed: true },
      ],
    },
    decisions: [
      'Read-heavy: about 40 writes and 4,000 reads a second, 3 TB over 5 years.',
      'POST /urls → 201 and a code; GET /{code} → 302 (so future analytics see every click).',
      'Codes: a counter in blocks of 1,000 per server, encoded in base 62, 6 to 7 characters.',
      'Cache-aside by code (about 5 GB for the hot set); local caches for viral links.',
      'One database with a standby; no sharding needed at this size.',
    ],
  },
  blank: {
    requirements: [
      'Create a short code for a long URL',
      'Redirect a short code to its long URL',
      'Links never expire; custom aliases optional',
      'Redirects are fast and highly available',
      'Read-heavy: about 100 opens per link',
    ],
    components: ['client', 'lb', 'service', 'cache', 'db'],
    firstFive: [
      'Ask which features are in scope (create, redirect, aliases, expiry, analytics)',
      'Ask the scale: links per month, opens per link, how long to keep them',
      'Say the priorities: fast, always-available redirects; reads dominate',
      'Estimate writes/s, reads/s and storage out loud',
      'Sketch the two endpoints before drawing boxes',
    ],
  },
};
