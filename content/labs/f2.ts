import type { Lab } from '../schema';

/*
 * Unit F2 labs. Lab 1 writes the vector operations with plain lists (no
 * NumPy), so every multiply and add is the learner's; lab 2 starts every step
 * from an empty function and builds cosine-similarity search with NumPy.
 */
export const f2Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f2-lab-1',
    title: 'Vectors by hand',
    intro:
      'Write the core vector operations with plain Python lists: add, scale, dot product and length. No NumPy, so every step of the arithmetic is yours.',
    summary: 'You wrote vector addition, scaling, the dot product and length from scratch.',
    minutes: 10,
    unlockAfter: 'f2-05',
    steps: [
      {
        goal: 'Write `add(u, v)`: the vectors added position by position.',
        starter: 'def add(u, v):\n    return [___ for a, b\n            in zip(u, v)]',
        solution: 'def add(u, v):\n    return [a + b for a, b\n            in zip(u, v)]',
        tests: [
          'assert add([1, 2], [3, 4]) == [4, 6], "add([1, 2], [3, 4]) should be [4, 6]"',
          'assert add([0.5, -1, 2], [0.5, 1, 0]) == [1.0, 0, 2], "works for any length"',
        ].join('\n'),
        hints: ['zip gives you matching pairs; add each pair.', 'def add(u, v):\n    return [a ___ b for a, b\n            in zip(u, v)]'],
      },
      {
        goal: 'Write `scale(k, v)`: every position multiplied by the number `k`.',
        starter: 'def scale(k, v):\n    return ___',
        solution: 'def scale(k, v):\n    return [k * x for x in v]',
        tests: [
          'assert scale(2, [1, 3]) == [2, 6], "scale(2, [1, 3]) should be [2, 6]"',
          'assert scale(-1, [4, -5]) == [-4, 5], "a negative number flips every sign"',
        ].join('\n'),
        hints: ['A list comprehension over v, multiplying each item by k.', 'def scale(k, v):\n    return [___ * x for x in ___]'],
      },
      {
        goal: 'Write `dot(u, v)`: multiply matching positions and add the products.',
        starter: 'def dot(u, v):\n    ___',
        solution: 'def dot(u, v):\n    pairs = zip(u, v)\n    prods = [a * b for a, b in pairs]\n    return sum(prods)',
        tests: [
          'assert dot([3, 2, 5], [2, 1, 0]) == 8, "prices times quantities: 8"',
          'assert dot([1, 0], [0, 7]) == 0, "perpendicular vectors give 0"',
        ].join('\n'),
        hints: ['Multiply each pair, then sum.', 'def dot(u, v):\n    pairs = zip(u, v)\n    prods = [a * b for a, b in pairs]\n    return ___(prods)'],
        explain: 'The same weighted sum that a neuron computes, and that every cell of a matrix product is.',
      },
      {
        goal: 'Write `length(v)`: the square root of the vector dotted with itself. Reuse `dot`.',
        starter: 'def length(v):\n    ___',
        solution: 'def length(v):\n    return dot(v, v) ** 0.5',
        tests: [
          'assert length([3, 4]) == 5, "length of [3, 4] is 5"',
          'assert length([1, 2, 2]) == 3, "length of [1, 2, 2] is 3"',
          'assert length([0, 0]) == 0, "the zero vector has length 0"',
        ].join('\n'),
        hints: ['v · v is the sum of the squares; take its square root with `** 0.5`.', 'def length(v):\n    return dot(___, ___) ** 0.5'],
        explain: 'Length is a dot product in disguise: |v|² = v · v.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f2-lab-2',
    title: 'Similarity search',
    intro:
      'Build the search behind embeddings: cosine similarity, normalising many vectors at once, ranking items for a query, and refusing when nothing is close enough. Every step starts from an empty function.',
    summary: 'You built cosine-similarity search: normalise once, score with one matrix product, return the top matches above a floor.',
    minutes: 14,
    unlockAfter: 'f2-08',
    given: [
      'NAMES = ["cat", "dog", "car", "bus"]',
      'VECS = np.array([',
      '    [0.9, 0.8, 0.1],',
      '    [0.8, 0.9, 0.2],',
      '    [0.1, 0.2, 0.9],',
      '    [0.2, 0.1, 0.8],',
      '])',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `cosine(a, b)`: the dot product divided by the product of the two lengths.',
        starter: 'def cosine(a, b):\n    pass',
        solution: 'def cosine(a, b):\n    na = np.linalg.norm(a)\n    nb = np.linalg.norm(b)\n    return (a @ b) / (na * nb)',
        tests: [
          'a = np.array([1.0, 2.0])',
          'assert abs(cosine(a, 3 * a) - 1) < 1e-9, "same direction: 1"',
          'assert abs(cosine(a, -a) + 1) < 1e-9, "opposite: -1"',
          'assert abs(cosine(np.array([1.0, 0]), np.array([0, 2.0]))) < 1e-9, "perpendicular: 0"',
        ].join('\n'),
        hints: [
          'Compute both lengths with `np.linalg.norm`, then divide `a @ b` by their product.',
          'def cosine(a, b):\n    na = np.linalg.norm(a)\n    nb = np.linalg.norm(b)\n    return (a @ b) / (___ * ___)',
        ],
      },
      {
        goal: 'Write `normalize_rows(M)`: every row divided by its own length, so each row has length 1.',
        starter: 'def normalize_rows(M):\n    pass',
        solution: 'def normalize_rows(M):\n    n = np.linalg.norm(M, axis=1,\n                       keepdims=True)\n    return M / n',
        tests: [
          'U = normalize_rows(VECS)',
          'assert U.shape == VECS.shape, f"same shape as the input, got {U.shape}"',
          'assert np.allclose(np.linalg.norm(U, axis=1), 1), "every row should have length 1"',
          'assert np.allclose(U[0], VECS[0] / np.linalg.norm(VECS[0])), "each row keeps its direction"',
        ].join('\n'),
        hints: [
          '`np.linalg.norm(M, axis=1, keepdims=True)` gives one length per row, shaped so it divides each row.',
          'def normalize_rows(M):\n    n = np.linalg.norm(M, axis=___,\n                       keepdims=True)\n    return M / ___',
        ],
        explain: 'Normalise once, and every comparison afterwards is a plain dot product.',
      },
      {
        goal: 'Write `rank(query, k=2)`: the names of the `k` items most similar to `query`, best first. Score all items at once with `normalize_rows(VECS) @ unit_query`.',
        starter: 'def rank(query, k=2):\n    pass',
        solution:
          'def rank(query, k=2):\n    q = query / np.linalg.norm(query)\n    U = normalize_rows(VECS)\n    scores = U @ q\n    order = np.argsort(-scores)[:k]\n    return [NAMES[i] for i in order]',
        tests: [
          'got = rank(np.array([1.0, 0.9, 0.0]))',
          'assert got == ["cat", "dog"], f"animals come first, got {got}"',
          'got = rank(np.array([0.0, 0.1, 1.0]), k=3)',
          'assert got == ["car", "bus", "dog"], f"vehicles first, then the closest animal; got {got}"',
        ].join('\n'),
        hints: [
          'Normalise the query, multiply the normalised matrix by it to get one score per item, then sort the scores from high to low with `np.argsort(-scores)`.',
          'def rank(query, k=2):\n    q = query / np.linalg.norm(query)\n    U = normalize_rows(VECS)\n    scores = U @ ___\n    order = np.argsort(-scores)[:___]\n    return [NAMES[i] for i in order]',
        ],
        explain: 'One matrix-vector product scores every item: this is how vector search scales.',
      },
      {
        goal: 'Write `search(query, floor=0.8)`: the best-matching name if its similarity is at least `floor`, otherwise `None` (nothing is close enough).',
        starter: 'def search(query, floor=0.8):\n    pass',
        solution:
          'def search(query, floor=0.8):\n    q = query / np.linalg.norm(query)\n    scores = normalize_rows(VECS) @ q\n    i = int(np.argmax(scores))\n    if scores[i] < floor:\n        return None\n    return NAMES[i]',
        tests: [
          'assert search(np.array([1.0, 1.0, 0.1])) in ("cat", "dog"), "a clear animal query finds an animal"',
          'assert search(np.array([0.1, 0.2, 0.9])) == "car", "a query matching car exactly finds car"',
          'q = np.array([1.0, -1.0, 0.0])',
          'assert search(q) is None, "nothing points that way: refuse with None"',
          'assert search(q, floor=-1.0) is not None, "with no floor something is always returned"',
        ].join('\n'),
        hints: [
          'Score as in `rank`, take the best index with `np.argmax`, and compare its score with the floor.',
          'def search(query, floor=0.8):\n    q = query / np.linalg.norm(query)\n    scores = normalize_rows(VECS) @ q\n    i = int(np.argmax(scores))\n    if scores[i] < ___:\n        return ___\n    return NAMES[i]',
        ],
        explain: 'Refusing when nothing is close is what keeps retrieval from feeding junk to a model (unit E6).',
      },
    ],
  },
];
