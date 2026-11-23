import type { Walkthrough } from '../schema';

/*
 * Walkthrough 6: a web crawler, through the seven-step framework. Unlocks
 * after S1-S3, S8 (queues), S9 (rate limiting) and S11 (Bloom filters,
 * object storage).
 */
export const webCrawler: Walkthrough = {
  id: 'w-web-crawler',
  title: 'Web crawler',
  question: 'Design a web crawler that politely downloads a billion web pages a month for a search engine.',
  needs: ['S1', 'S2', 'S3', 'S8', 'S9', 'S11'],
  minutes: 18,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "HTML pages only. Respect robots.txt and never overload one site. Re-crawl pages from time to time."',
      exercises: [
        {
          id: 'wwc-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Download HTML pages', bucket: 0, why: 'The core job, stated.' },
            { text: 'Follow links to new pages', bucket: 0, why: 'How a crawler finds the web.' },
            { text: 'Respect robots.txt', bucket: 0, why: 'Stated, and expected of any crawler.' },
            { text: 'Skip duplicate pages', bucket: 0, why: 'Otherwise mirrors waste the budget.' },
            { text: 'Images and video', bucket: 1, why: 'HTML only, the interviewer said.' },
            { text: 'Running page JavaScript', bucket: 1, why: 'Far costlier per page; a later addition.' },
            { text: 'Ranking search results', bucket: 1, why: 'The search engine\'s job, not the crawler\'s.' },
          ],
          explain: 'A crawler finds, fetches and stores; ranking happens elsewhere.',
        },
        {
          id: 'wwc-1-2',
          type: 'mcq',
          prompt: 'Which requirement shapes the design most?',
          options: [
            { text: 'Politeness to each site' },
            { text: 'Lowest latency per page', why: 'Nobody waits on a single page; total throughput matters.' },
            { text: 'Strong consistency', why: 'Nothing here needs every reader to agree at once.' },
          ],
          answer: 0,
          explain: 'It decides how the frontier is built: work is spread so no site gets more than its share.',
        },
        {
          id: 'wwc-1-3',
          type: 'scenario',
          prompt: 'A calendar site links to "next day" forever: a crawler trap.',
          situation: 'Every page is new, so the crawler would never finish that site.',
          needs: ['Do not crawl forever', 'Still crawl real sites deeply'],
          options: [
            { text: 'Cap pages and depth per site', cost: 'A few deep real pages are missed.' },
            {
              text: 'Follow every link it finds',
              cost: 'Nothing missed.',
              why: 'One infinite site eats the whole budget.',
            },
            {
              text: 'Block any site with dates',
              cost: 'One simple rule.',
              why: 'Blocks news sites and blogs wholesale.',
            },
          ],
          answer: 0,
          explain: 'Limits per site, with higher caps for sites known to be large.',
        },
      ],
      strong: 'HTML only, following links from seed URLs, respecting robots.txt and a per-site rate, skipping duplicates and traps, re-crawling over time; throughput and politeness matter, not per-page latency.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "A billion pages a month, 100 KB each on average. Keep pages for five years."',
      exercises: [
        {
          id: 'wwc-2-1',
          type: 'estimate',
          prompt: 'Pages downloaded per second, on average?',
          expr: '1e9 / MONTH',
          answer: 386,
          tolerance: 2,
          unit: 'pages/s',
          options: [
            { value: 40, why: 'A month is about 2.6 million seconds: 10⁹ / 2.6 × 10⁶ ≈ 400.' },
            { value: 400 },
            { value: 4000, why: 'That would be ten billion pages a month.' },
          ],
          work: ['1 month ≈ 2.6 × 10⁶ s', '10⁹ / 2.6 × 10⁶ ≈ 386 pages/s'],
          explain: 'Plan for peaks above that, and for slow sites holding connections open.',
        },
        {
          id: 'wwc-2-2',
          type: 'estimate',
          prompt: 'Storage added each month?',
          expr: '1e9 * 100 * KB / TB',
          answer: 100,
          tolerance: 2,
          unit: 'TB',
          options: [
            { value: 10, why: '10⁹ × 10⁵ B = 10¹⁴ B = 100 TB.' },
            { value: 100 },
            { value: 1000, why: '10¹⁴ bytes is 100 TB, not a petabyte.' },
          ],
          work: ['10⁹ pages × 100 KB = 10¹⁴ B = 100 TB'],
          explain: 'Before compression, which roughly halves or better for HTML.',
        },
        {
          id: 'wwc-2-3',
          type: 'estimate',
          prompt: 'Storage for five years of monthly crawls?',
          expr: '1e9 * 100 * KB * 12 * 5 / PB',
          answer: 6,
          tolerance: 2,
          unit: 'PB',
          options: [
            { value: 0.6, why: '100 TB × 60 months = 6,000 TB = 6 PB.' },
            { value: 6 },
            { value: 60, why: 'Sixty months of 100 TB is 6 PB, not 60.' },
          ],
          work: ['100 TB × 12 × 5 = 6,000 TB = 6 PB'],
          explain: 'Petabytes: object storage, compressed, not a database.',
        },
      ],
      strong: 'About 400 pages a second on average, 100 TB a month and 6 PB over five years: pages go to object storage, compressed, and fetchers need many connections open at once.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'A crawler has no public API. Its interface is the hand-off between its own parts.',
      exercises: [
        {
          id: 'wwc-3-1',
          type: 'order-steps',
          prompt: 'Put one URL\'s journey through the crawler in order.',
          steps: [
            'Take the next URL from the frontier',
            'Check its site\'s robots.txt (cached)',
            'Download the page',
            'Store the page in object storage',
            'Extract the links on the page',
            'Add unseen links to the frontier',
          ],
          explain: 'Each arrow between steps can be a queue, so parts run at their own pace.',
        },
        {
          id: 'wwc-3-2',
          type: 'match-pairs',
          prompt: 'Match each part to its job.',
          pairs: [
            { left: 'Frontier', right: 'URLs waiting to be fetched', why: 'The crawler\'s to-do list.' },
            { left: 'Fetcher', right: 'downloads pages', why: 'Many run in parallel.' },
            { left: 'Parser', right: 'pulls out links and text', why: 'Turns a page into new URLs.' },
            { left: 'Seen set', right: 'skips URLs already queued', why: 'Stops the same URL being fetched again and again.' },
          ],
          explain: 'Four parts, joined by queues.',
        },
        {
          id: 'wwc-3-3',
          type: 'predict-output',
          prompt: 'URLs are normalised before the seen check. How many distinct pages are left?',
          code: `def norm(u):
    u = u.lower().split("#")[0]
    return u.rstrip("/")
urls = ["HTTP://a.com/x/",
        "http://a.com/x#top",
        "http://a.com/y"]
print(len({norm(u) for u in urls}))`,
          answer: '2',
          typedWrong: [{ answer: '3', why: 'The first two are the same page once normalised.' }],
          explain: 'Without normalising, one page can be fetched many times. (Real normalisers keep the case of the path.)',
        },
      ],
      strong: 'Parts hand URLs and pages through queues: frontier → fetchers → object storage and parser → seen check → frontier, with URLs normalised before the check.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Decide where pages, URL state and the "seen" check live.',
      exercises: [
        {
          id: 'wwc-4-1',
          type: 'scenario',
          prompt: 'How do you check whether a URL was seen before, among 10 billion?',
          situation: 'The check runs for every link found: thousands a second.',
          needs: ['A fast check', 'A few GB of memory, not a terabyte'],
          options: [
            { text: 'A Bloom filter', cost: 'A few new URLs are wrongly skipped.' },
            {
              text: 'A set of every URL in memory',
              cost: 'Exact answers.',
              why: 'At about 100 bytes each, 10 billion URLs need about a terabyte.',
            },
            {
              text: 'A database query per link',
              cost: 'Exact and durable.',
              why: 'Thousands of disk lookups a second, each slow.',
            },
          ],
          answer: 0,
          explain: 'A false positive skips a page now and then; it never fetches one twice (S11).',
        },
        {
          id: 'wwc-4-2',
          type: 'estimate',
          prompt: 'A Bloom filter at 10 bits per URL, for 10 billion URLs. How many GB?',
          expr: '10e9 * 10 / 8 / GB',
          answer: 12.5,
          tolerance: 2,
          unit: 'GB',
          options: [
            { value: 1.25, why: '10¹¹ bits / 8 = 1.25 × 10¹⁰ B = 12.5 GB.' },
            { value: 12.5 },
            { value: 125, why: 'Divide the bits by 8 to get bytes.' },
          ],
          work: ['10¹⁰ URLs × 10 bits = 10¹¹ bits', '10¹¹ / 8 = 1.25 × 10¹⁰ B = 12.5 GB'],
          explain: 'About 1% false positives at 10 bits per item: fits in one machine\'s memory.',
        },
        {
          id: 'wwc-4-3',
          type: 'bucket-sort',
          prompt: 'Where does each piece of data live?',
          buckets: ['Object store', 'Key-value DB', 'Memory cache'],
          items: [
            { text: 'Raw page HTML', bucket: 0, why: 'Large blobs, written once: object storage.' },
            { text: 'Old crawls\' archives', bucket: 0, why: 'Petabytes, rarely read.' },
            { text: 'URL → last fetched time', bucket: 1, why: 'Small rows looked up by URL.' },
            { text: 'URL → content hash', bucket: 1, why: 'Checked on re-crawl to see if a page changed.' },
            { text: 'robots.txt per site', bucket: 2, why: 'Read before every fetch; refreshed daily.' },
            { text: 'DNS answers', bucket: 2, why: 'Looked up constantly; kept until their TTL.' },
          ],
          explain: 'Blobs to object storage, small records by key, hot lookups in memory.',
        },
      ],
      strong: 'Pages in object storage; a key-value table of URL → last fetched time and content hash; a Bloom filter of about 12 GB for "seen"; robots.txt and DNS answers cached in memory.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Connect the frontier, fetchers, storage and parser into a loop.',
      exercises: [
        {
          id: 'wwc-5-1',
          type: 'diagram',
          prompt: 'Every link the parser finds is checked before it joins the frontier. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'f', kind: 'queue', label: 'Frontier' },
              { id: 'w', kind: 'worker', label: 'Fetchers' },
              { id: 's', kind: 'store', label: 'Pages' },
              { id: 'p', kind: 'worker', label: 'Parser' },
              { id: 'b', kind: 'cache', label: 'Seen filter' },
            ],
            edges: [
              { from: 'f', to: 'w' },
              { from: 'w', to: 's' },
              { from: 'w', to: 'p' },
              { from: 'p', to: 'b' },
              { from: 'b', to: 'f', label: 'new' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'b',
            options: [
              { kind: 'cache', label: 'Bloom filter' },
              { kind: 'db', label: 'SQL table', why: 'A disk lookup per link is too slow at thousands a second.' },
              { kind: 'queue', label: 'Queue', why: 'A queue cannot answer "seen before?"' },
            ],
            answer: 0,
          },
          explain: 'In memory, about 12 GB, answering in microseconds.',
        },
        {
          id: 'wwc-5-2',
          type: 'diagram',
          prompt: 'A link found on a page. Tap its path from the fetchers back to the frontier.',
          diagram: {
            nodes: [
              { id: 'f', kind: 'queue', label: 'Frontier' },
              { id: 'w', kind: 'worker', label: 'Fetchers' },
              { id: 's', kind: 'store', label: 'Pages' },
              { id: 'p', kind: 'worker', label: 'Parser' },
              { id: 'b', kind: 'cache', label: 'Seen filter' },
            ],
            edges: [
              { from: 'f', to: 'w' },
              { from: 'w', to: 's' },
              { from: 'w', to: 'p' },
              { from: 'p', to: 'b' },
              { from: 'b', to: 'f' },
            ],
          },
          goal: { kind: 'path', answer: ['w', 'p', 'b', 'f'] },
          explain: 'The page itself goes to storage; its links loop back through the seen check.',
        },
        {
          id: 'wwc-5-3',
          type: 'mcq',
          prompt: 'Why join the parts with queues rather than direct calls?',
          options: [
            { text: 'Parts run at their own pace' },
            { text: 'Queues make pages smaller', why: 'Queues do not change the data, only when it is handled.' },
            { text: 'Calls cannot carry URLs', why: 'They can; the problem is waiting on each other.' },
          ],
          answer: 0,
          explain: 'Fetchers wait on slow sites; the parser should not wait with them (S8).',
        },
      ],
      strong: 'Frontier → fetchers → object storage, and fetchers → parser → seen filter → back to the frontier; queues between every part, robots.txt and DNS cached beside the fetchers.',
      diagram: {
        nodes: [
          { id: 'f', kind: 'queue', label: 'Frontier' },
          { id: 'w', kind: 'worker', label: 'Fetchers' },
          { id: 's', kind: 'store', label: 'Pages' },
          { id: 'p', kind: 'worker', label: 'Parser' },
          { id: 'r', kind: 'cache', label: 'robots, DNS' },
          { id: 'b', kind: 'cache', label: 'Seen filter' },
        ],
        edges: [
          { from: 'f', to: 'w' },
          { from: 'w', to: 's' },
          { from: 'w', to: 'p' },
          { from: 'w', to: 'r' },
          { from: 'p', to: 'b' },
          { from: 'b', to: 'f', label: 'new' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: keep thousands of fetchers busy without hitting any one site too hard.',
      exercises: [
        {
          id: 'wwc-6-1',
          type: 'scenario',
          prompt: 'All 5,000 links on a big site\'s home page land in the frontier together. How do fetchers take them?',
          situation: 'Fetchers take whatever is next as fast as they can.',
          needs: ['At most one request a second per site', 'Fetchers stay busy'],
          options: [
            { text: 'A queue per site, paced', cost: 'More queues to manage; a big site crawls slowly.' },
            {
              text: 'One shared FIFO queue',
              cost: 'Simplest.',
              why: 'Thousands of fetchers would hit that one site at once.',
            },
            {
              text: 'Shuffle the frontier',
              cost: 'Simple and mostly spread out.',
              why: 'Helps on average, but gives no guarantee per site.',
            },
          ],
          answer: 0,
          explain: 'A fetcher picks a site whose next-allowed time has passed, then takes one URL from its queue.',
        },
        {
          id: 'wwc-6-2',
          type: 'predict-output',
          prompt: 'The frontier keeps a next-allowed time per site, one second apart. Which fetches may go ahead?',
          code: `nxt = {}
def may_fetch(host, now, gap=1):
    if now < nxt.get(host, 0):
        return False
    nxt[host] = now + gap
    return True
ts = [("a", 0), ("a", 0.5),
      ("b", 0.5), ("a", 1)]
r = [may_fetch(h, t) for h, t in ts]
print(r)`,
          answer: '[True, False, True, True]',
          typedWrong: [{ answer: '[True, False, True, False]', why: 'At t = 1 the one-second gap for site a has passed.' }],
          explain: 'The same idea as a rate limiter (S9), applied to sites instead of clients.',
        },
        {
          id: 'wwc-6-3',
          type: 'mcq',
          prompt: 'Two URLs serve identical content (a mirror). How do you skip the copy?',
          options: [
            { text: 'Compare a hash of the content' },
            { text: 'Compare the page titles', why: 'Different pages share titles, and copies can differ in title.' },
            { text: 'Compare their URL lengths', why: 'Length says nothing about content.' },
          ],
          answer: 0,
          explain: 'An exact hash catches identical copies; near-duplicates need fingerprints such as SimHash.',
        },
      ],
      strong: 'The frontier keeps a queue per site and a next-allowed time, so each site gets at most one request per delay while fetchers work on other sites; content hashes skip duplicate pages.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Find what slows first, then push it to ten billion pages a month.',
      exercises: [
        {
          id: 'wwc-7-1',
          type: 'scenario',
          prompt: 'Fetchers spend most of their time waiting on DNS lookups.',
          situation: 'Every fetch looks up its site\'s address first.',
          needs: ['Fetchers stay busy', 'Few lookups per site'],
          options: [
            { text: 'Cache DNS in the crawler', cost: 'An address may be stale until its TTL ends.' },
            {
              text: 'Add many more fetchers',
              cost: 'More machines.',
              why: 'They would all wait on the same slow lookups.',
            },
          ],
          answer: 0,
          explain: 'A site\'s address is reused for thousands of its pages.',
        },
        {
          id: 'wwc-7-2',
          type: 'mcq',
          prompt: 'Ten billion pages a month. What do you split first?',
          options: [
            { text: 'Partition the frontier by site' },
            { text: 'One bigger frontier machine', why: 'Ten times the work outgrows one machine.' },
            { text: 'Re-crawl every page less', why: 'Cuts the work, but does not add capacity.' },
          ],
          answer: 0,
          explain: 'Hash the host name to a crawler node; that node owns the site\'s queue and politeness.',
        },
        {
          id: 'wwc-7-3',
          type: 'bucket-sort',
          prompt: 'Which pages should be re-crawled often, and which rarely?',
          buckets: ['Often', 'Rarely'],
          items: [
            { text: 'A news home page', bucket: 0, why: 'Changes every few minutes.' },
            { text: 'An archived research paper', bucket: 1, why: 'Never changes.' },
            { text: 'A shop\'s price page', bucket: 0, why: 'Prices change daily.' },
            { text: 'A company\'s "about us" page', bucket: 1, why: 'Changes once a year at most.' },
            { text: 'Live sports scores', bucket: 0, why: 'Stale within minutes.' },
            { text: 'A page unchanged for a year', bucket: 1, why: 'Its history says it rarely changes.' },
          ],
          explain: 'Re-crawl rate follows how often each page has changed before.',
        },
      ],
      strong: 'DNS caching and many open connections per fetcher come first; at 10× the frontier is partitioned by host so each site\'s politeness lives in one place, and re-crawl rates follow how often each page changes.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'f', kind: 'queue', label: 'Frontier' },
        { id: 'w', kind: 'worker', label: 'Fetchers' },
        { id: 's', kind: 'store', label: 'Pages' },
        { id: 'p', kind: 'worker', label: 'Parser' },
        { id: 'r', kind: 'cache', label: 'robots, DNS' },
        { id: 'b', kind: 'cache', label: 'Seen filter' },
      ],
      edges: [
        { from: 'f', to: 'w', label: 'per site' },
        { from: 'w', to: 's' },
        { from: 'w', to: 'p' },
        { from: 'w', to: 'r' },
        { from: 'p', to: 'b' },
        { from: 'b', to: 'f', label: 'new' },
      ],
    },
    decisions: [
      'A frontier with a queue and a next-allowed time per site: polite by design.',
      'Pages in object storage, compressed: about 100 TB a month, 6 PB over five years.',
      'A Bloom filter of about 12 GB for seen URLs; content hashes skip duplicates.',
      'robots.txt and DNS answers cached beside the fetchers.',
      'At 10×: partition the frontier by host; re-crawl by how often pages change.',
    ],
  },
  blank: {
    requirements: [
      'Download about a billion HTML pages a month',
      'Respect robots.txt and a per-site rate',
      'Skip duplicate URLs and duplicate content',
      'Avoid crawler traps',
      'Re-crawl pages over time',
    ],
    components: ['queue', 'worker', 'store', 'cache'],
    firstFive: [
      'Ask what to crawl (HTML only?) and how many pages a month',
      'Say politeness is the requirement that shapes the design',
      'Estimate pages a second and storage over the retention period',
      'Sketch the loop: frontier, fetchers, storage, parser, seen check',
      'Explain the per-site queues before scaling anything',
    ],
  },
};
