import type { Lab } from '../schema';

/*
 * Unit S11 labs. Lab 1: an inverted index with AND search and a grid cell
 * lookup, with scaffolding. Lab 2, from empty functions: time-ordered ids
 * and a Bloom filter.
 */
export const s11Labs: Lab[] = [
  {
    id: 's11-lab-1',
    title: 'Search and maps',
    intro: 'Build a small search engine and a map lookup: normalise words, build an inverted index, answer AND queries, and put points in grid cells.',
    summary: 'You built an inverted index with AND search and a grid lookup.',
    minutes: 12,
    unlockAfter: 's11-03',
    steps: [
      {
        goal: 'Finish `words(text)`: lowercase the text, split it, and strip `.,!?` from each word.',
        starter: 'def words(text):\n    low = text.___()\n    return [w.strip(".,!?")\n            for w in low.split()]',
        solution: 'def words(text):\n    low = text.lower()\n    return [w.strip(".,!?")\n            for w in low.split()]',
        tests: 'assert words("Red Shoes, red!") == ["red", "shoes", "red"], f"got {words(\'Red Shoes, red!\')}"',
        hints: ['Lowercase before splitting.', 'def words(text):\n    low = text.___()\n    return [w.strip(".,!?")\n            for w in low.split()]'],
      },
      {
        goal: 'Finish `build(docs)`: `docs` maps id to text; return a dict from each word to the set of ids containing it.',
        starter: 'def build(docs):\n    idx = {}\n    for d, text in docs.items():\n        for w in words(text):\n            idx.setdefault(w, set())\n            idx[w].___(d)\n    return idx',
        solution: 'def build(docs):\n    idx = {}\n    for d, text in docs.items():\n        for w in words(text):\n            idx.setdefault(w, set())\n            idx[w].add(d)\n    return idx',
        tests: [
          'ix = build({1: "Red shoes", 2: "blue shoes", 3: "red hat"})',
          'assert ix["red"] == {1, 3} and ix["shoes"] == {1, 2}, f"got {ix}"',
        ].join('\n'),
        hints: ['A set method that adds one item.', 'def build(docs):\n    idx = {}\n    for d, text in docs.items():\n        for w in words(text):\n            idx.setdefault(w, set())\n            idx[w].___(d)\n    return idx'],
      },
      {
        goal: 'Finish `search(idx, query)`: the ids containing every word of the query (an empty set if any word is unknown).',
        starter: 'def search(idx, query):\n    result = None\n    for w in words(query):\n        found = idx.get(w, set())\n        if result is None:\n            result = found\n        else:\n            result = result ___ found\n    return result or set()',
        solution: 'def search(idx, query):\n    result = None\n    for w in words(query):\n        found = idx.get(w, set())\n        if result is None:\n            result = found\n        else:\n            result = result & found\n    return result or set()',
        tests: [
          'ix = {"red": {1, 3}, "shoes": {1, 2}}',
          'assert search(ix, "Red shoes") == {1}, f"got {search(ix, \'Red shoes\')}"',
          'assert search(ix, "red boots") == set(), "unknown word: nothing"',
        ].join('\n'),
        hints: ['Every word must match: intersect.', 'def search(idx, query):\n    result = None\n    for w in words(query):\n        found = idx.get(w, set())\n        if result is None:\n            result = found\n        else:\n            result = result ___ found\n    return result or set()'],
        explain: 'Real engines intersect sorted lists, smallest first.',
      },
      {
        goal: 'Finish `cell(lat, lon, size)`: the grid cell of a point, as a pair of whole numbers.',
        starter: 'def cell(lat, lon, size):\n    return (int(lat ___ size),\n            int(lon // size))',
        solution: 'def cell(lat, lon, size):\n    return (int(lat // size),\n            int(lon // size))',
        tests: [
          'assert cell(48.85, 2.35, 1.0) == (48, 2), f"got {cell(48.85, 2.35, 1.0)}"',
          'assert cell(48.85, 2.35, 0.5) == (97, 4), "smaller cells"',
        ].join('\n'),
        hints: ['Floor division gives the cell number.', 'def cell(lat, lon, size):\n    return (int(lat ___ size),\n            int(lon // size))'],
        explain: 'Search the cell and its eight neighbours, then filter by distance.',
      },
    ],
  },
  {
    id: 's11-lab-2',
    title: 'Ids and Bloom filters',
    intro: 'From empty functions: pack and unpack time-ordered ids, then build a Bloom filter that never misses an item it was given.',
    summary: 'You built a time-ordered id scheme and a Bloom filter.',
    minutes: 15,
    unlockAfter: 's11-08',
    steps: [
      {
        goal: 'Write `make_id(ms, machine, seq)`: milliseconds shifted left 22 bits, the machine number shifted left 12, and the sequence, combined with `|`.',
        starter: 'def make_id(ms, machine, seq):\n    pass',
        solution: 'def make_id(ms, machine, seq):\n    return ((ms << 22)\n            | (machine << 12) | seq)',
        tests: [
          'assert make_id(1, 0, 0) == 4194304, f"got {make_id(1, 0, 0)}"',
          'assert make_id(1000, 1, 0) < make_id(1000, 2, 0) < make_id(1001, 0, 0), "ordered by time first"',
        ].join('\n'),
        hints: ['Shift each part into its place, then OR them.', 'def make_id(ms, machine, seq):\n    return ((ms << 22)\n            | (machine << ___) | seq)'],
      },
      {
        goal: 'Write `parts(i)`: return `(ms, machine, seq)` from an id made by `make_id` (machine has 10 bits, sequence 12).',
        starter: 'def parts(i):\n    pass',
        solution: 'def parts(i):\n    ms = i >> 22\n    machine = (i >> 12) & 1023\n    seq = i & 4095\n    return (ms, machine, seq)',
        tests: 'assert parts(make_id(1700, 3, 5)) == (1700, 3, 5), f"got {parts(make_id(1700, 3, 5))}"',
        hints: [
          'Shift right, then mask with 1023 (10 bits) or 4095 (12 bits).',
          'def parts(i):\n    ms = i >> 22\n    machine = (i >> 12) & 1023\n    seq = i & ___\n    return (ms, machine, seq)',
        ],
        explain: 'You can read when any id was made.',
      },
      {
        goal: 'Write `positions(item, m, k)`: with `h` the sum of the item\'s character codes, return `[(h * (i + 1) + i) % m for i in range(k)]`.',
        starter: 'def positions(item, m, k):\n    pass',
        solution: 'def positions(item, m, k):\n    h = sum(map(ord, item))\n    return [(h * (i + 1) + i) % m\n            for i in range(k)]',
        tests: 'assert positions("ab", 16, 3) == [3, 7, 11], f"got {positions(\'ab\', 16, 3)}"',
        hints: [
          'Compute h once, then one position per hash.',
          'def positions(item, m, k):\n    h = sum(map(ord, item))\n    return [(h * (i + 1) + i) % ___\n            for i in range(k)]',
        ],
      },
      {
        goal: 'Write `add(bits, item, k)`: set to 1 every position of `item` (with `m = len(bits)`).',
        starter: 'def add(bits, item, k):\n    pass',
        solution: 'def add(bits, item, k):\n    m = len(bits)\n    for p in positions(item, m, k):\n        bits[p] = 1',
        tests: [
          'b = [0] * 16',
          'add(b, "ab", 3)',
          'assert [i for i, x in enumerate(b) if x] == [3, 7, 11], f"got {b}"',
        ].join('\n'),
        hints: ['Loop over the positions.', 'def add(bits, item, k):\n    m = len(bits)\n    for p in positions(item, m, k):\n        bits[p] = ___'],
      },
      {
        goal: 'Write `maybe(bits, item, k)`: True only if every position of `item` is set.',
        starter: 'def maybe(bits, item, k):\n    pass',
        solution: 'def maybe(bits, item, k):\n    ps = positions(item, len(bits), k)\n    return all(bits[p] for p in ps)',
        tests: [
          'b = [0] * 64',
          'for w in ["cat", "dog", "emu"]:',
          '    add(b, w, 3)',
          'assert all(maybe(b, w, 3) for w in ["cat", "dog", "emu"]), "no false negatives"',
          'assert not maybe(b, "yak", 3), "absent item"',
        ].join('\n'),
        hints: ['All of its bits must be set.', 'def maybe(bits, item, k):\n    ps = positions(item, len(bits), k)\n    return ___(bits[p] for p in ps)'],
        explain: 'Added items always pass; some absent ones may too, never the reverse.',
      },
    ],
  },
];
