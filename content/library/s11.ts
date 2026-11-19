import type { LibraryPage } from '../schema';

/** Unit S11 summary page: unlocked in the Library when the unit is finished. */
export const s11Library: LibraryPage = {
  unit: 'S11',
  ideas: [
    {
      title: 'Finding things',
      text: 'An inverted index maps each normalised word to the documents containing it; AND queries intersect the lists, and ranking weighs frequency against rarity (TF-IDF, BM25) plus popularity and freshness. For places, split the map into cells (geohash, quadtree) and search your cell and its neighbours.',
    },
    {
      title: 'Moving things',
      text: 'Polling asks repeatedly; server-sent events push one way; WebSockets carry both ways, and connection servers find each other through pub-sub. Files go to an object store, uploaded directly with signed URLs and processed by workers. Ids come from a central counter, random UUIDs, or time-ordered schemes made anywhere.',
    },
    {
      title: 'Counting and analysing',
      text: 'Bloom filters say "definitely not" or "probably yes" in about 10 bits per item. HyperLogLog counts distinct items in kilobytes and merges by max; count-min sketches estimate frequencies. Batch for exact, rerunnable results; streams for fresh ones, windowed by event time. Row stores for transactions, column stores for analysis.',
    },
  ],
  rules: [
    'Search: intersect word lists, then rank.',
    'Geo: your cell plus its neighbours.',
    'Polling load = users ÷ interval.',
    'Blobs in the object store, facts in the database.',
    'Snowflake id: 41 bits ms, 10 machine, 12 sequence.',
    'Bloom: ~10 bits per item ≈ 1% false positives.',
    'Distinct counts merge; they do not add.',
  ],
  example: {
    code: [
      'from collections import defaultdict',
      'docs = {1: "red shoes",',
      '        2: "blue shoes",',
      '        3: "red hat"}',
      'idx = defaultdict(set)',
      'for d, text in docs.items():',
      '    for w in text.split():',
      '        idx[w].add(d)',
      'print(idx["red"] & idx["shoes"])',
    ].join('\n'),
    output: '{1}',
    notes: ['Each word maps to the set of documents containing it.', 'An AND query is an intersection of those sets.'],
  },
  diagram: {
    nodes: [
      { id: 'c', kind: 'client', label: 'App' },
      { id: 'a', kind: 'service', label: 'API' },
      { id: 'd', kind: 'db', label: 'Database' },
      { id: 's', kind: 'search', label: 'Search' },
      { id: 'o', kind: 'store', label: 'Objects' },
      { id: 'w', kind: 'db', label: 'Warehouse' },
    ],
    edges: [
      { from: 'c', to: 'a' },
      { from: 'a', to: 'd', label: 'truth' },
      { from: 'a', to: 's', label: 'query' },
      { from: 'a', to: 'o', label: 'files' },
      { from: 'd', to: 'w', label: 'copy' },
    ],
  },
  mistakes: [
    { mistake: 'LIKE \'%word%\' as a search engine.', fix: 'An inverted index, fed from the database.' },
    { mistake: 'Searching only your own map cell.', fix: 'Include the neighbouring cells.' },
    { mistake: 'Relaying uploads through app servers.', fix: 'Signed URLs straight to the object store.' },
    { mistake: 'Adding daily unique counts.', fix: 'Merge sets or HyperLogLog sketches.' },
    { mistake: 'Heavy reports on the production database.', fix: 'Copy to a column store.' },
  ],
  forReal:
    'Read the "Inverted index" and "Okapi BM25" pages in the Elasticsearch or Lucene documentation, RFC 9562 for UUIDv7, and Redis\'s documentation on HyperLogLog and Bloom filters. Then estimate, for one app you use, how much object storage its photos need per year.',
};
