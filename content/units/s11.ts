import { s11Labs } from '../labs/s11';
import { s11Library } from '../library/s11';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s11More } from './s11-more';

/*
 * S11 Specialised building blocks. Lessons 1-6 here: inverted indexes,
 * ranking, geospatial indexing, real-time delivery, object storage and
 * media pipelines, unique ids. Lessons 7-11 in s11-more.ts: Bloom filters,
 * counting at scale, batch and stream processing, analytical and
 * transactional stores, checkpoint.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's11-01',
    title: 'Inverted indexes',
    summary: 'Map each word to the documents that contain it; a search intersects the lists.',
    card: {
      title: 'Inverted indexes',
      text: 'Finding the documents that contain a word by scanning every document is far too slow at scale. An inverted index maps each word to the list of documents that contain it, built by splitting text into words and normalising them (lowercase, "shoes" to "shoe"). A search for several words looks up each word\'s list and intersects them.',
      diagram: {
        nodes: [
          { id: 'd', kind: 'db', label: 'Products DB' },
          { id: 'w', kind: 'worker', label: 'Indexer' },
          { id: 's', kind: 'search', label: 'Search index' },
          { id: 'a', kind: 'service', label: 'Search API' },
        ],
        edges: [
          { from: 'd', to: 'w', label: 'changes' },
          { from: 'w', to: 's' },
          { from: 'a', to: 's', label: 'query' },
        ],
      },
    },
    exercises: [
      {
        id: 's11-1-1',
        type: 'predict-output',
        prompt: 'Build a tiny inverted index. Which documents contain "red"?',
        code: `from collections import defaultdict
docs = {1: "red shoes",
        2: "blue shoes",
        3: "red hat"}
idx = defaultdict(set)
for d, text in docs.items():
    for w in text.split():
        idx[w].add(d)
print(sorted(idx["red"]))`,
        answer: '[1, 3]',
        typedWrong: [{ answer: '[1]', why: 'Document 3 ("red hat") contains it too.' }],
        explain: 'One lookup, no scanning.',
      },
      {
        id: 's11-1-2',
        type: 'fill-blank',
        prompt: 'Documents containing both "red" and "shoes".',
        code: `idx = {"red": {1, 3},
       "shoes": {1, 2}}
both = idx["red"] ___ idx["shoes"]
print(sorted(both))`,
        answer: ['&'],
        distractors: [{ text: '|', why: 'Union: documents with either word.' }],
        expectOutput: '[1]',
        explain: 'AND is an intersection of the lists; OR is a union.',
      },
      {
        id: 's11-1-3',
        type: 'estimate',
        prompt: '100 million product descriptions of 1 KB each. Scanning them all at 1 GB a second takes how many seconds?',
        expr: '100e6 * RECORD / GB',
        answer: 100,
        tolerance: 1.5,
        unit: 's',
        options: [
          { value: 1, why: '100 million × 1 KB = 100 GB.' },
          { value: 100 },
          { value: 10000, why: '100 GB at 1 GB/s is 100 s.' },
        ],
        work: ['100 million × 1 KB = 100 GB', '100 GB / 1 GB/s = 100 s'],
        explain: 'Per search. The index answers in milliseconds.',
      },
      {
        id: 's11-1-4',
        type: 'mcq',
        prompt: 'Why lowercase words and cut "shoes" to "shoe" when indexing?',
        options: [
          { text: 'So "Shoes" matches "shoe"' },
          { text: 'To make the index smaller', why: 'A side effect; the point is matching.' },
          { text: 'To sort the results faster', why: 'Sorting is unrelated.' },
        ],
        answer: 0,
        explain: 'The query is normalised the same way, so forms of a word meet.',
      },
      {
        id: 's11-1-5',
        type: 'order-steps',
        prompt: 'Indexing one document. Put it in order.',
        steps: [
          'Split the text into words',
          'Lowercase and strip punctuation',
          'Reduce words to stems ("shoes" → "shoe")',
          'Add the document id to each word\'s list',
        ],
        explain: 'Queries go through the same first three steps.',
      },
      {
        id: 's11-1-6',
        type: 'scenario',
        prompt: 'Product search runs `name LIKE \'%shoe%\'` on 50 million rows and takes seconds. Fix?',
        situation: 'Users type words that can appear anywhere in the name.',
        needs: ['Fast word search anywhere in the text'],
        options: [
          {
            text: 'A search index (inverted)',
            cost: 'Another system to keep in sync.',
          },
          {
            text: 'A B-tree index on name',
            cost: 'One line of SQL.',
            why: 'A leading wildcard cannot use it: still a full scan.',
          },
        ],
        answer: 0,
        explain: 'B-trees find prefixes; inverted indexes find words.',
      },
      {
        id: 's11-1-7',
        type: 'mcq',
        prompt: 'How is the search index kept up to date?',
        options: [
          { text: 'Stream DB changes into it' },
          { text: 'Rebuild it on every search', why: 'Far too slow.' },
          { text: 'Users update it themselves', why: 'Users change the database, not the index.' },
        ],
        answer: 0,
        explain: 'The database stays the source of truth; the index lags slightly.',
      },
      {
        id: 's11-1-8',
        type: 'bucket-sort',
        prompt: 'Search index or database?',
        buckets: ['Search index', 'Database'],
        items: [
          { text: 'Full-text search over product names', bucket: 0, why: 'Words anywhere in text.' },
          { text: 'A search box that tolerates typos', bucket: 0, why: 'Fuzzy matching is built in.' },
          { text: 'An order\'s payment status', bucket: 1, why: 'Source of truth, transactional.' },
          { text: 'Counts by brand and size beside results', bucket: 0, why: 'Facets come with search engines.' },
          { text: 'Enforcing unique usernames', bucket: 1, why: 'Needs a transactional constraint.' },
        ],
        explain: 'Search engines are derived views: rebuildable from the database.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's11-02',
    title: 'Ranking results',
    summary: 'Score matches by how often a word appears and how rare it is, then mix in other signals.',
    card: {
      title: 'Ranking results',
      text: 'The index finds matching documents; ranking decides their order. A word counts more the more often it appears in a document (term frequency) and the rarer it is across all documents (inverse document frequency): "the" matches everything and says little, "waterproof" says a lot. Engines refine this (BM25 limits the effect of repeats and allows for document length) and mix in signals such as popularity and freshness.',
    },
    exercises: [
      {
        id: 's11-2-1',
        type: 'predict-output',
        prompt: 'Inverse document frequency over 1,000 documents. What does this print?',
        code: `import math
N = 1000
df = {"the": 1000, "waterproof": 10}
idf = {w: round(math.log(N / n), 2)
       for w, n in df.items()}
print(idf)`,
        answer: "{'the': 0.0, 'waterproof': 4.61}",
        typedWrong: [{ answer: "{'the': 6.91, 'waterproof': 2.3}", why: 'Rare words score high: log(1000 / 10) = log(100).' }],
        explain: 'A word in every document carries no information.',
      },
      {
        id: 's11-2-2',
        type: 'mcq',
        prompt: 'Why does "the" score near zero?',
        options: [
          { text: 'It is in every document' },
          { text: 'It is too short to matter', why: 'Length is irrelevant; "ox" can be rare.' },
          { text: 'Indexes skip all short words', why: 'It scores low because it is common.' },
        ],
        answer: 0,
        explain: 'log(N / N) = 0.',
      },
      {
        id: 's11-2-3',
        type: 'predict-output',
        prompt: 'A document\'s score is the sum of its words\' idf. What does it score?',
        code: `idf = {"red": 0.5, "boots": 2.0}
doc = ["red", "boots", "boots"]
score = sum(idf[w] for w in doc)
print(score)`,
        answer: '4.5',
        typedWrong: [{ answer: '2.5', why: '"boots" appears twice: 0.5 + 2.0 + 2.0.' }],
        explain: 'Frequency times rarity, in its simplest form.',
      },
      {
        id: 's11-2-4',
        type: 'mcq',
        prompt: 'What does BM25 fix in plain frequency scoring?',
        options: [
          { text: 'Repeats stop adding much' },
          { text: 'Long documents always win', why: 'That is the problem; BM25 allows for length.' },
          { text: 'It ignores rare words', why: 'Rare words still count most.' },
        ],
        answer: 0,
        explain: 'Writing "shoe" 50 times should not beat a good match.',
      },
      {
        id: 's11-2-5',
        type: 'scenario',
        prompt: '"iphone case" puts a 2014 listing that says "iphone" 50 times at the top. Fix?',
        situation: 'Ranking uses plain word counts only.',
        needs: ['Relevant, current, popular results first'],
        options: [
          {
            text: 'BM25 plus popularity and freshness',
            cost: 'More signals to tune.',
          },
          {
            text: 'Sort all the results by date only',
            cost: 'Simple to build.',
            why: 'Newest is not the same as relevant.',
          },
        ],
        answer: 0,
        explain: 'Text relevance first, then business signals on top.',
      },
      {
        id: 's11-2-6',
        type: 'order-steps',
        prompt: 'Answering a search. Put it in order.',
        steps: [
          'Normalise the query words',
          'Look up each word\'s list',
          'Combine the lists into candidates',
          'Score each candidate',
          'Return the top 10',
        ],
        explain: 'Only candidates are scored, never the whole collection.',
      },
      {
        id: 's11-2-7',
        type: 'run-code',
        prompt: 'Write `top_k(scores, k)`: the `k` document ids with the highest scores, best first.',
        solution: `def top_k(scores, k):
    by = lambda d: -scores[d]
    return sorted(scores, key=by)[:k]`,
        tests: [
          's = {"a": 1.0, "b": 3.0, "c": 2.0}',
          'assert top_k(s, 2) == ["b", "c"], f"got {top_k(s, 2)}"',
        ].join('\n'),
        maxLines: 3,
        placeholder: 'def top_k(scores, k):',
        explain: 'Engines use a heap so they never sort everything.',
      },
      {
        id: 's11-2-8',
        type: 'fill-blank',
        prompt: 'Inverse document frequency: how rare a word is.',
        code: `import math
N, df = 1000, 10
print(round(math.log(N ___ df), 2))`,
        answer: ['/'],
        distractors: [{ text: '*', why: 'Rarity is total over containing: N / df.' }],
        expectOutput: '4.61',
        explain: 'In 10 of 1,000 documents: log 100.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's11-03',
    title: 'Geospatial indexing',
    summary: 'Split the map into cells with short codes; search your cell and its neighbours.',
    card: {
      title: 'Geospatial indexing',
      text: '"Restaurants within 2 km" cannot use an ordinary index on latitude or longitude alone, because closeness needs both at once. Grid schemes split the map into cells with short codes (in a geohash each extra character makes the cell smaller, and nearby places usually share a prefix), so a query looks up its own cell and the cells around it. Trees such as quadtrees split crowded areas further, so no cell holds too many points.',
    },
    exercises: [
      {
        id: 's11-3-1',
        type: 'predict-output',
        prompt: 'A cell and all its neighbours. How many cells are searched?',
        code: `def around(x, y):
    return [(x + dx, y + dy)
            for dx in (-1, 0, 1)
            for dy in (-1, 0, 1)]

print(len(around(5, 5)))`,
        answer: '9',
        typedWrong: [{ answer: '8', why: 'Its own cell is included: dx = dy = 0.' }],
        explain: 'Then filter the points found by their real distance.',
      },
      {
        id: 's11-3-2',
        type: 'mcq',
        prompt: 'Why search neighbouring cells as well as your own?',
        options: [
          { text: 'Close places can straddle edges' },
          { text: 'Cells always overlap their neighbours', why: 'Cells do not overlap; that is the problem.' },
          { text: 'To make results random', why: 'Results are filtered by distance.' },
        ],
        answer: 0,
        explain: 'A café 50 m away can be in the next cell.',
      },
      {
        id: 's11-3-3',
        type: 'predict-output',
        prompt: 'Places whose geohash shares the first 5 characters with yours. Which are near?',
        code: `places = {"cafe": "u09tvw",
          "bar": "u09tvq",
          "zoo": "u0d2k1"}
me = "u09tvx"
near = [p for p, h in places.items()
        if h[:5] == me[:5]]
print(near)`,
        answer: "['cafe', 'bar']",
        typedWrong: [{ answer: "['cafe', 'bar', 'zoo']", why: '"u0d2k" differs from "u09tv".' }],
        explain: 'A shared prefix means a shared cell.',
      },
      {
        id: 's11-3-4',
        type: 'mcq',
        prompt: 'A longer geohash means…',
        options: [
          { text: 'A smaller cell' },
          { text: 'A larger cell', why: 'Each character narrows it.' },
          { text: 'A different city', why: 'Same area, finer detail.' },
        ],
        answer: 0,
        explain: 'Choose the length to match the search radius.',
      },
      {
        id: 's11-3-5',
        type: 'scenario',
        prompt: 'A ride app must find drivers near a rider. A million drivers report their position every 4 seconds.',
        situation: 'Positions change constantly; queries are constant too.',
        needs: ['Answer in milliseconds', 'Absorb constant position updates'],
        options: [
          {
            text: 'In-memory grid of drivers',
            cost: 'Moving each driver between cells as they drive.',
          },
          {
            text: 'SQL query over all drivers',
            cost: 'Nothing new.',
            why: 'Every request scans a million rows.',
          },
        ],
        answer: 0,
        explain: 'Look up the rider\'s cell and its neighbours only.',
      },
      {
        id: 's11-3-6',
        type: 'mcq',
        prompt: 'What does a quadtree do better than a fixed grid?',
        options: [
          { text: 'Dense areas get smaller cells' },
          { text: 'Every cell is the same size', why: 'That is the fixed grid.' },
          { text: 'It needs no memory at all', why: 'It is a tree in memory.' },
        ],
        answer: 0,
        explain: 'A city centre splits deep; the ocean stays one cell.',
      },
      {
        id: 's11-3-7',
        type: 'estimate',
        prompt: 'A million drivers each send a position every 4 seconds. Updates per second?',
        expr: '1e6 / 4',
        answer: 250000,
        tolerance: 1.5,
        unit: 'updates/s',
        options: [
          { value: 25000, why: '1,000,000 / 4.' },
          { value: 250000 },
          { value: 4000000, why: 'Divide by 4, not multiply.' },
        ],
        work: ['1,000,000 / 4 s = 250,000 per second'],
        explain: 'Write-heavy: keep positions in memory, not in a disk-bound table.',
      },
      {
        id: 's11-3-8',
        type: 'fill-blank',
        prompt: 'The grid cell of a point: whole cells of `size` degrees.',
        code: `def cell(lat, lon, size=1.0):
    return (int(lat ___ size),
            int(lon // size))

print(cell(48.85, 2.35))`,
        answer: ['//'],
        distractors: [{ text: '%', why: 'That is the position inside the cell, not the cell.' }],
        expectOutput: '(48, 2)',
        explain: 'Every point in the same square gets the same pair.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's11-04',
    title: 'Real-time delivery',
    summary: 'Polling asks repeatedly; server-sent events push one way; WebSockets carry messages both ways.',
    card: {
      title: 'Real-time delivery',
      text: 'Polling asks the server every few seconds: simple, but most requests return nothing and updates arrive up to one interval late. Server-sent events keep one HTTP response open and push events to the browser, which reconnects by itself; WebSockets open a two-way channel for messages in both directions. Every open connection uses server memory, so millions of users need many connection servers and a way, often pub-sub, to reach the right one.',
      diagram: {
        nodes: [
          { id: 'a', kind: 'client', label: 'Ann' },
          { id: 'b', kind: 'client', label: 'Bo' },
          { id: 's1', kind: 'service', label: 'Chat srv 1' },
          { id: 's2', kind: 'service', label: 'Chat srv 2' },
          { id: 'q', kind: 'queue', label: 'Pub-sub' },
        ],
        edges: [
          { from: 'a', to: 's1', label: 'socket' },
          { from: 'b', to: 's2', label: 'socket' },
          { from: 's1', to: 'q', label: 'publish' },
          { from: 'q', to: 's2' },
        ],
      },
    },
    exercises: [
      {
        id: 's11-4-1',
        type: 'match-pairs',
        prompt: 'Match each technique to how it works.',
        pairs: [
          { left: 'Polling', right: 'asks again every few seconds', why: 'A new request each time.' },
          { left: 'Server-sent events', right: 'server pushes on one response', why: 'One way, over plain HTTP.' },
          { left: 'WebSocket', right: 'two-way messages, one connection', why: 'Both sides send at any time.' },
        ],
        explain: 'Long polling sits in between: the server holds each request until there is news.',
      },
      {
        id: 's11-4-2',
        type: 'bucket-sort',
        prompt: 'Polling, server-sent events or WebSocket?',
        buckets: ['Polling', 'SSE', 'WebSocket'],
        items: [
          { text: 'Is the nightly report ready?', bucket: 0, why: 'Rare, not urgent.' },
          { text: 'A live sports score in a browser', bucket: 1, why: 'Server to client only.' },
          { text: 'Multiplayer game moves', bucket: 2, why: 'Both ways, constantly.' },
          { text: 'Order status checked every minute', bucket: 0, why: 'Slow-changing.' },
          { text: 'A stock ticker on a page', bucket: 1, why: 'A one-way stream.' },
          { text: 'Chat with typing indicators', bucket: 2, why: 'Both sides send.' },
        ],
        explain: 'Pick the simplest that meets the latency and direction needed.',
      },
      {
        id: 's11-4-3',
        type: 'estimate',
        prompt: 'A million open apps poll every 5 seconds. Requests per second?',
        expr: '1e6 / 5',
        answer: 200000,
        tolerance: 1.5,
        unit: 'requests/s',
        options: [
          { value: 20000, why: '1,000,000 / 5.' },
          { value: 200000 },
          { value: 5000000, why: 'Divide by 5, not multiply.' },
        ],
        work: ['1,000,000 / 5 s = 200,000 per second'],
        explain: 'Most of them answered "nothing new".',
      },
      {
        id: 's11-4-4',
        type: 'mcq',
        prompt: 'What is polling\'s main waste?',
        options: [
          { text: 'Most requests return nothing' },
          { text: 'Browsers block repeated requests', why: 'They allow them.' },
          { text: 'It needs WebSockets', why: 'It is plain HTTP.' },
        ],
        answer: 0,
        explain: 'Plus up to one interval of delay.',
      },
      {
        id: 's11-4-5',
        type: 'scenario',
        prompt: 'Two million users are connected across 40 chat servers. Ann (server 1) messages Bo (server 2). How does it reach him?',
        situation: 'Each server holds only its own users\' connections.',
        needs: ['Deliver within a second', 'Servers can be added freely'],
        options: [
          {
            text: 'Pub-sub between chat servers',
            cost: 'A broker to run.',
          },
          {
            text: 'Each server polls all others',
            cost: 'No broker.',
            why: '40 × 39 polls, constantly, and it grows with every server.',
          },
        ],
        answer: 0,
        explain: 'Server 2 subscribes to Bo\'s channel and pushes to his socket.',
      },
      {
        id: 's11-4-6',
        type: 'estimate',
        prompt: 'Each open connection uses about 20 KB of server memory. How many GB for a million?',
        expr: '1e6 * 20 * KB / GB',
        answer: 20,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 2, why: '1,000,000 × 20 KB = 20 GB.' },
          { value: 20 },
          { value: 200, why: '20 KB each, not 200.' },
        ],
        work: ['1,000,000 × 20 KB = 20 GB'],
        explain: 'Spread over several connection servers.',
      },
      {
        id: 's11-4-7',
        type: 'predict-output',
        prompt: 'Deliver to the server holding the user\'s connection, or store it for later. What does this print?',
        code: `conn = {"ann": "srv-3", "bo": "srv-7"}
def deliver(to, msg):
    srv = conn.get(to)
    if srv is None:
        return f"store for {to}"
    return f"{srv} -> {to}: {msg}"

a = deliver("bo", "hi")
b = deliver("cy", "yo")
print(a, "|", b)`,
        answer: 'srv-7 -> bo: hi | store for cy',
        typedWrong: [{ answer: 'srv-7 -> bo: hi | srv-3 -> cy: yo', why: 'Cy has no connection: the message is stored.' }],
        explain: 'Offline users get stored messages when they reconnect.',
      },
      {
        id: 's11-4-8',
        type: 'fill-blank',
        prompt: 'Requests per second from polling.',
        code: `def poll_rate(users, every):
    return users ___ every

print(poll_rate(1_000_000, 5))`,
        answer: ['/'],
        distractors: [{ text: '*', why: 'Each user sends one request per interval: divide.' }],
        expectOutput: '200000.0',
        explain: 'Halve the interval and the load doubles.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's11-05',
    title: 'Object storage and media',
    summary: 'Files go to an object store, uploaded directly with signed URLs, processed by workers and served by a CDN.',
    card: {
      title: 'Object storage and media',
      text: 'Large files (photos, videos, backups) go in an object store: a flat set of keys mapped to whole files, cheap and very durable, read and written over HTTP. The database keeps only each file\'s key and its details. Clients upload directly with a short-lived signed URL, an event starts workers that make thumbnails or video versions, and a CDN serves the results.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'App' },
          { id: 'a', kind: 'service', label: 'API' },
          { id: 'o', kind: 'store', label: 'Object store' },
          { id: 'q', kind: 'queue', label: 'Events' },
          { id: 'w', kind: 'worker', label: 'Resizer' },
          { id: 't', kind: 'store', label: 'Web sizes' },
          { id: 'n', kind: 'cdn', label: 'CDN' },
        ],
        edges: [
          { from: 'c', to: 'a', label: 'get URL' },
          { from: 'c', to: 'o', label: 'upload' },
          { from: 'o', to: 'q', label: 'new file' },
          { from: 'q', to: 'w' },
          { from: 'w', to: 't' },
          { from: 't', to: 'n', label: 'serve' },
        ],
      },
    },
    exercises: [
      {
        id: 's11-5-1',
        type: 'order-steps',
        prompt: 'A photo upload. Put it in order.',
        steps: [
          'The app asks the API for an upload URL',
          'The API returns a URL signed for 10 minutes',
          'The app uploads straight to the object store',
          'The store announces the new file',
          'A worker makes the thumbnails',
        ],
        explain: 'The API never touches the photo\'s bytes.',
      },
      {
        id: 's11-5-2',
        type: 'bucket-sort',
        prompt: 'Object store or database?',
        buckets: ['Object store', 'Database'],
        items: [
          { text: 'The bytes of a profile photo', bucket: 0, why: 'A large blob.' },
          { text: 'The photo\'s owner and caption', bucket: 1, why: 'Small, queried, updated.' },
          { text: 'Uploaded video files', bucket: 0, why: 'Huge blobs.' },
          { text: 'The nightly backup archive', bucket: 0, why: 'Written once, kept cheaply.' },
          { text: 'A post\'s like count', bucket: 1, why: 'Changes constantly.' },
        ],
        explain: 'Blobs in the store, facts about them in the database.',
      },
      {
        id: 's11-5-3',
        type: 'estimate',
        prompt: '10 million photos a day, each kept in 3 web sizes of about 300 KB. How many TB a day?',
        expr: '10e6 * 3 * IMAGE / TB',
        answer: 9,
        tolerance: 1.5,
        unit: 'TB',
        options: [
          { value: 0.9, why: '30 million × 300 KB = 9 TB.' },
          { value: 9 },
          { value: 90, why: '300 KB each, not 3 MB.' },
        ],
        work: ['10 million × 3 = 30 million files', '× 300 KB = 9 TB a day'],
        explain: 'About 3 PB a year: object storage territory.',
      },
      {
        id: 's11-5-4',
        type: 'mcq',
        prompt: 'Why upload straight to the store with a signed URL?',
        options: [
          { text: 'App servers don\'t relay big files' },
          { text: 'The store compresses it better', why: 'Compression is not the reason.' },
          { text: 'Signed URLs never expire', why: 'They expire in minutes, by design.' },
        ],
        answer: 0,
        explain: 'No bandwidth or memory spent on the API for gigabytes of video.',
      },
      {
        id: 's11-5-5',
        type: 'scenario',
        prompt: 'A video platform. Many viewers are on phones with slow connections. What do you store and serve?',
        situation: 'Uploads arrive in 4K.',
        needs: ['Smooth playback on any connection'],
        options: [
          {
            text: 'Transcode to several bitrates',
            cost: 'Several times the storage and compute.',
          },
          {
            text: 'Serve the original upload',
            cost: 'One file per video.',
            why: 'A 4K stream stalls on a slow phone connection.',
          },
        ],
        answer: 0,
        explain: 'Players switch bitrate as the connection changes (adaptive streaming).',
      },
      {
        id: 's11-5-6',
        type: 'predict-output',
        prompt: 'Keys made from a hash of the file\'s content. What does this print?',
        code: `from hashlib import sha256
def key(data):
    h = sha256(data).hexdigest()
    return "img/" + h[:12]

print(key(b"cat") == key(b"cat"),
      key(b"cat") == key(b"dog"))`,
        answer: 'True False',
        typedWrong: [{ answer: 'False False', why: 'Same bytes, same hash, same key.' }],
        explain: 'Identical uploads share one stored copy.',
      },
      {
        id: 's11-5-7',
        type: 'mcq',
        prompt: 'What does an object store do badly?',
        options: [
          { text: 'Change a few bytes in place' },
          { text: 'Store billions of files', why: 'That is what it is built for.' },
          { text: 'Serve files over HTTP', why: 'Its normal interface.' },
        ],
        answer: 0,
        explain: 'Objects are written whole; a change means writing a new object.',
      },
      {
        id: 's11-5-8',
        type: 'fill-blank',
        prompt: 'A signed URL works only before it expires.',
        code: `def url_ok(expires, now):
    return now ___ expires

print(url_ok(1000, 900),
      url_ok(1000, 1100))`,
        answer: ['<'],
        distractors: [{ text: '>', why: 'That accepts only expired URLs.' }],
        expectOutput: 'True False',
        explain: 'A leaked URL stops working within minutes.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 's11-06',
    title: 'Unique ids',
    summary: 'A central counter, random UUIDs, or time-ordered ids made anywhere.',
    card: {
      title: 'Unique ids',
      text: 'A single database counter gives short, ordered ids, but every insert must go through it, and the ids reveal how many records exist. Random UUIDs (122 random bits) can be made anywhere with no coordination, but they scatter inserts across an index. Time-ordered ids (Snowflake-style: milliseconds, machine number and a sequence, or UUIDv7) are made anywhere and still sort roughly by creation time.',
    },
    exercises: [
      {
        id: 's11-6-1',
        type: 'match-pairs',
        prompt: 'Match each id scheme to its character.',
        pairs: [
          { left: 'Auto-increment', right: 'short, ordered, one counter', why: 'Simple, central.' },
          { left: 'UUIDv4', right: 'random, made anywhere', why: 'No order, no coordination.' },
          { left: 'Snowflake-style', right: 'time + machine + sequence', why: 'Made anywhere, roughly ordered.' },
        ],
        explain: 'UUIDv7 is the standardised time-ordered UUID.',
      },
      {
        id: 's11-6-2',
        type: 'predict-output',
        prompt: 'Ids packed as milliseconds, then machine, then sequence. Do they sort by time?',
        code: `def make_id(ms, machine, seq):
    return ((ms << 22)
            | (machine << 12) | seq)

a = make_id(1000, 1, 0)
b = make_id(1000, 2, 0)
c = make_id(1001, 1, 0)
print(a < b < c)`,
        answer: 'True',
        typedWrong: [{ answer: 'False', why: 'The time sits in the highest bits, so it decides the order first.' }],
        explain: 'Within the same millisecond, machine and sequence break ties.',
      },
      {
        id: 's11-6-3',
        type: 'estimate',
        prompt: 'A 12-bit sequence allows how many ids per second from one machine (1,000 ms)?',
        expr: '2 ** 12 * 1000',
        answer: 4096000,
        tolerance: 1.5,
        unit: 'ids/s',
        options: [
          { value: 4096, why: 'That is per millisecond.' },
          { value: 4096000 },
          { value: 4096000000, why: '1,000 ms in a second, not a million.' },
        ],
        work: ['2¹² = 4,096 per millisecond', '× 1,000 = about 4 million a second'],
        explain: 'Far more than any single machine needs.',
      },
      {
        id: 's11-6-4',
        type: 'mcq',
        prompt: 'Why do random UUID keys slow down inserts in a B-tree index?',
        options: [
          { text: 'Inserts land all over the index' },
          { text: 'UUIDs are slow to generate', why: 'Generating one takes microseconds.' },
          { text: 'UUIDs cannot be indexed', why: 'They can; the pattern of inserts is the problem.' },
        ],
        answer: 0,
        explain: 'Time-ordered ids append near the end, keeping hot pages in memory.',
      },
      {
        id: 's11-6-5',
        type: 'scenario',
        prompt: 'Order URLs look like /orders/1043. A competitor reads your sales volume from them. Fix?',
        situation: 'Ids are a database counter, shown to customers.',
        needs: ['Ids reveal nothing', 'Ids cannot be guessed'],
        options: [
          {
            text: 'Random or time-ordered opaque ids',
            cost: 'Longer ids in URLs.',
          },
          {
            text: 'Keep the sequential ids as they are',
            cost: 'Short URLs.',
            why: 'Two orders a week apart show exactly how many were placed between.',
          },
        ],
        answer: 0,
        explain: 'Keep a counter internally if you like; show something else.',
      },
      {
        id: 's11-6-6',
        type: 'estimate',
        prompt: '41 bits of milliseconds. Roughly how many years until they run out?',
        expr: '2 ** 41 / 1000 / YEAR',
        answer: 69.7,
        tolerance: 1.5,
        unit: 'years',
        options: [
          { value: 7, why: '2⁴¹ ms ≈ 2.2 × 10⁹ s ≈ 70 years.' },
          { value: 69.7 },
          { value: 700, why: '2.2 billion seconds is about 70 years.' },
        ],
        work: ['2⁴¹ ≈ 2.2 × 10¹² ms = 2.2 × 10⁹ s', '/ 3.15 × 10⁷ s ≈ 70 years'],
        explain: 'Counted from a custom start date, not 1970.',
      },
      {
        id: 's11-6-7',
        type: 'fill-blank',
        prompt: 'Recover the milliseconds from a packed id.',
        code: `def ms_of(id_):
    return id_ ___ 22

i = (1700 << 22) | (3 << 12) | 5
print(ms_of(i))`,
        answer: ['>>'],
        distractors: [{ text: '<<', why: 'That shifts further left: a huge number.' }],
        expectOutput: '1700',
        explain: 'Shift the machine and sequence bits away.',
      },
      {
        id: 's11-6-8',
        type: 'bucket-sort',
        prompt: 'One central counter, or ids made on each machine?',
        buckets: ['One counter', 'Made anywhere'],
        items: [
          { text: 'Invoice numbers that must have no gaps', bucket: 0, why: 'Often a legal requirement; needs one sequence.' },
          { text: 'Event ids from 500 servers', bucket: 1, why: 'No bottleneck.' },
          { text: 'Rows in a small internal app', bucket: 0, why: 'Simplest is fine.' },
          { text: 'Message ids in a global chat', bucket: 1, why: 'Made in every region.' },
          { text: 'Orders created in 3 regions', bucket: 1, why: 'No cross-region round trip per order.' },
        ],
        explain: 'Coordinate only when the ids must be gapless.',
      },
    ],
  },
];

export const s11: Unit = {
  id: 'S11',
  track: 'system-design',
  title: 'Specialised building blocks',
  blurb: 'Search indexes and ranking, geospatial indexing, real-time delivery, object storage and media, unique ids, Bloom filters and approximate counting, batch and stream processing, analytical and transactional stores.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s11More],
  labs: s11Labs,
  library: s11Library,
};
