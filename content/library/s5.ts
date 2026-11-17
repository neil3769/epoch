import type { LibraryPage } from '../schema';

/** Unit S5 summary page: unlocked in the Library when the unit is finished. */
export const s5Library: LibraryPage = {
  unit: 'S5',
  ideas: [
    {
      title: 'Choosing a store',
      text: 'Relational for related records, constraints and transactions (the default); key-value for fast lookups by one key; documents for whole nested records with varying fields; wide-column for huge write volumes read by key and time; graph for walking relationships. Add specialists for proven needs.',
    },
    {
      title: 'Keys, joins, indexes',
      text: 'Primary keys never repeat or change; foreign keys point at other rows and joins bring them together. An index turns a scan into a search; a composite index helps queries on its leftmost columns; every index slows every write.',
    },
    {
      title: 'Correctness',
      text: 'Normalise by default; denormalise measured hot read paths and own the update job. Transactions make related changes all-or-nothing (ACID). Overlapping read-then-write cycles lose updates: use one atomic statement, a row lock, or a version check with retries.',
    },
  ],
  rules: [
    'Use ? placeholders, never string-built SQL.',
    'Read the query plan: SCAN on a big table is a warning.',
    'Index what you filter by; leftmost columns first.',
    'Changes that must agree go in one transaction.',
    'Counters and stock: `set n = n - 1 where n > 0`.',
    'Long human edits: optimistic locking with a version.',
  ],
  example: {
    code: [
      'con = store(1)',
      'sql = ("update stock set n = n - 1"',
      '       " where sku = \'pen\' and n > 0")',
      'sold = [con.execute(sql).rowcount',
      '        for _ in range(3)]',
      'print(sold)',
    ].join('\n'),
    output: '[1, 0, 0]',
    notes: ['One pen, three buyers: exactly one sale.', 'rowcount says whether the conditional update matched.'],
  },
  diagram: {
    nodes: [
      { id: 'a', kind: 'service', label: 'App' },
      { id: 'r', kind: 'db', label: 'Relational' },
      { id: 'k', kind: 'cache', label: 'Key-value' },
      { id: 'w', kind: 'db', label: 'Wide-column' },
    ],
    edges: [
      { from: 'a', to: 'r', label: 'orders' },
      { from: 'a', to: 'k', label: 'sessions' },
      { from: 'a', to: 'w', label: 'events' },
    ],
  },
  mistakes: [
    { mistake: 'Emails or names as primary keys.', fix: 'A generated id; a unique constraint on email.' },
    { mistake: 'One query per row (N+1).', fix: 'One join.' },
    { mistake: 'Indexing every column.', fix: 'Index what queries use; each index slows writes.' },
    { mistake: 'Read, compute, write without protection.', fix: 'Atomic update, lock, or version check.' },
    { mistake: 'Related changes as separate commits.', fix: 'One transaction.' },
  ],
  forReal:
    'Install PostgreSQL (or run it in Docker), load a table with a million rows, and compare EXPLAIN ANALYZE before and after adding an index. Then open two psql sessions and reproduce a lost update by hand, and fix it with `select … for update`. The PostgreSQL documentation\'s chapter on transaction isolation explains each level with examples.',
};
