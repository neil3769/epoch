import type { Lab } from '../schema';

/*
 * Unit F4 labs. Lab 1 answers questions about a small grade book with axis
 * reductions and masks; lab 2 starts every step from an empty function and
 * vectorises a small data pipeline: standardise, normalise rows, pairwise
 * distances by broadcasting, nearest neighbours and one-hot labels.
 */
export const f4Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f4-lab-1',
    title: 'Grade book',
    intro:
      'Four students, three tests: one row per student, one column per test. Answer questions about it with axis reductions and masks, and no loops.',
    summary: 'You answered per-test, per-student and pass/fail questions with `axis`, `argmax` and masks.',
    minutes: 10,
    unlockAfter: 'f4-09',
    given: [
      'NAMES = np.array(["Ana", "Ben",',
      '                  "Cy", "Dee"])',
      'S = np.array([[70, 85, 90],',
      '              [40, 65, 55],',
      '              [88, 92, 79],',
      '              [60, 45, 72]])',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `test_means(S)`: the average of each test (each column).',
        starter: 'def test_means(S):\n    return S.mean(axis=___)',
        solution: 'def test_means(S):\n    return S.mean(axis=0)',
        tests: [
          'm = test_means(S)',
          'assert np.shape(m) == (3,), f"one average per test: shape (3,), got {np.shape(m)}"',
          'assert np.allclose(m, [64.5, 71.75, 74]), f"got {m}"',
        ].join('\n'),
        hints: ['One result per column means the rows collapse.', 'def test_means(S):\n    return S.___(axis=___)'],
      },
      {
        goal: 'Write `top_student(S)`: the name of the student with the highest average.',
        starter: 'def top_student(S):\n    avg = S.mean(axis=1)\n    return NAMES[___]',
        solution: 'def top_student(S):\n    avg = S.mean(axis=1)\n    return NAMES[avg.argmax()]',
        tests: 'got = top_student(S)\nassert got == "Cy", f"Cy averages 86.3, the highest; got {got!r}"',
        hints: [
          '`argmax` gives the position of the largest average; use it to index `NAMES`.',
          'def top_student(S):\n    avg = S.mean(axis=1)\n    return NAMES[avg.___()]',
        ],
      },
      {
        goal: 'Write `count_passed(S, mark=50)`: how many students scored at least `mark` on every test. Return an `int`.',
        starter: 'def count_passed(S, mark=50):\n    low = S.min(axis=1)\n    return ___',
        solution: 'def count_passed(S, mark=50):\n    low = S.min(axis=1)\n    return int((low >= mark).sum())',
        tests: [
          'assert count_passed(S) == 2, f"Ana and Cy never drop below 50; got {count_passed(S)}"',
          'assert count_passed(S, 40) == 4, "with mark 40 everyone passes (40 counts)"',
          'assert count_passed(S, 80) == 0, "Cy\'s lowest is 79, so nobody passes 80"',
        ].join('\n'),
        hints: [
          'Each student\'s lowest score is in `low`. Compare it with `mark` to get a mask, then count the Trues.',
          'def count_passed(S, mark=50):\n    low = S.min(axis=1)\n    return int((low ___ mark).sum())',
        ],
        explain: 'Passing every test is the same as the lowest score passing.',
      },
      {
        goal: 'Write `below(S, mark=50)`: the names (as a list) of students with any score under `mark`.',
        starter: 'def below(S, mark=50):\n    ___',
        solution: 'def below(S, mark=50):\n    bad = S.min(axis=1) < mark\n    return NAMES[bad].tolist()',
        tests: [
          'got = below(S)',
          'assert got == ["Ben", "Dee"], f"Ben has a 40 and Dee a 45; got {got}"',
          'assert below(S, 0) == [], "nobody is below 0"',
        ].join('\n'),
        hints: [
          'Build a mask from each student\'s lowest score, index `NAMES` with it, and turn the result into a list.',
          'def below(S, mark=50):\n    bad = S.min(axis=1) < mark\n    return NAMES[___].tolist()',
        ],
        explain: 'A mask built from one array can index another, as long as they line up.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f4-lab-2',
    title: 'Vectorise the pipeline',
    intro:
      'Write the array steps a small ML pipeline needs, each without a Python loop: standardise features, turn rows into proportions, compute every pairwise distance by broadcasting, find nearest neighbours, and one-hot encode labels. Every step starts from an empty function.',
    summary: 'You wrote a loop-free pipeline: standardise, normalise rows, pairwise distances, nearest neighbours and one-hot labels.',
    minutes: 16,
    unlockAfter: 'f4-14',
    steps: [
      {
        goal: 'Write `standardize(X)`: each column minus its mean, divided by its spread. `X.std(axis=0)` gives the spread of each column.',
        starter: 'def standardize(X):\n    pass',
        solution: 'def standardize(X):\n    mu = X.mean(axis=0)\n    sd = X.std(axis=0)\n    return (X - mu) / sd',
        tests: [
          'X = np.array([[1.0, 100.0], [2.0, 300.0], [3.0, 500.0]])',
          'Z = standardize(X)',
          'assert Z.shape == X.shape, f"same shape as X, got {Z.shape}"',
          'assert np.allclose(Z.mean(axis=0), 0), "every column should average 0"',
          'assert np.allclose(Z.std(axis=0), 1), "every column should have spread 1"',
        ].join('\n'),
        hints: [
          'Per-column statistics use `axis=0`; they broadcast back across the rows.',
          'def standardize(X):\n    mu = X.mean(axis=___)\n    sd = X.std(axis=___)\n    return (X - mu) / sd',
        ],
        explain: 'Now age and income sit on the same scale, which gradient descent needs.',
      },
      {
        goal: 'Write `normalize_rows(P)`: each row divided by its own sum, so every row adds up to 1.',
        starter: 'def normalize_rows(P):\n    pass',
        solution: 'def normalize_rows(P):\n    s = P.sum(axis=1, keepdims=True)\n    return P / s',
        tests: [
          'P = np.array([[1.0, 3.0], [1.0, 1.0]])',
          'R = normalize_rows(P)',
          'assert np.allclose(R, [[0.25, 0.75], [0.5, 0.5]]), f"each row over its own sum; got {R}"',
          'Q = np.array([[2.0, 2.0, 4.0], [1.0, 0.0, 3.0]])',
          'assert np.allclose(normalize_rows(Q).sum(axis=1), 1), "every row should sum to 1"',
        ].join('\n'),
        hints: [
          'Sum along `axis=1` with `keepdims=True`, so the sums form a column that lines up with the rows.',
          'def normalize_rows(P):\n    s = P.sum(axis=1, ___=True)\n    return P / s',
        ],
        explain: 'The square test case would pass silently without keepdims; the second one would not.',
      },
      {
        goal: 'Write `pairwise_dist(A, B)`: an (n, m) array whose cell (i, j) is the distance from row i of A to row j of B. Reshape A to (n, 1, d) and B to (1, m, d) so their difference broadcasts to (n, m, d).',
        starter: 'def pairwise_dist(A, B):\n    pass',
        solution:
          'def pairwise_dist(A, B):\n    n, d = A.shape\n    m = B.shape[0]\n    a = A.reshape(n, 1, d)\n    b = B.reshape(1, m, d)\n    D = a - b\n    sq = (D ** 2).sum(axis=2)\n    return np.sqrt(sq)',
        tests: [
          'A = np.array([[0.0, 0.0], [3.0, 4.0]])',
          'B = np.array([[0.0, 0.0], [6.0, 8.0], [3.0, 0.0]])',
          'D = pairwise_dist(A, B)',
          'assert D.shape == (2, 3), f"one distance per pair: (2, 3), got {D.shape}"',
          'assert np.allclose(D, [[0, 10, 3], [5, 5, 4]]), f"got {D}"',
        ].join('\n'),
        hints: [
          'After reshaping, `a - b` has shape (n, m, d): every row of A minus every row of B. Square, sum over the last axis (2), then take the square root.',
          'def pairwise_dist(A, B):\n    n, d = A.shape\n    m = B.shape[0]\n    a = A.reshape(n, 1, d)\n    b = B.reshape(1, m, d)\n    D = a - b\n    sq = (D ** 2).sum(axis=___)\n    return np.___(sq)',
        ],
        explain: 'Broadcasting replaced two nested loops: (n, 1, d) against (1, m, d) pairs every row with every row.',
      },
      {
        goal: 'Write `nearest(A, B)`: for each row of A, the index of the closest row of B. Use `pairwise_dist`; `argmin` is the smallest-value version of `argmax`.',
        starter: 'def nearest(A, B):\n    pass',
        solution: 'def nearest(A, B):\n    D = pairwise_dist(A, B)\n    return D.argmin(axis=1)',
        tests: [
          'A = np.array([[0.0, 0.0], [3.0, 4.0]])',
          'B = np.array([[0.0, 0.0], [6.0, 8.0], [3.0, 0.0]])',
          'got = np.asarray(nearest(A, B)).tolist()',
          'assert got == [0, 2], f"row 0 is closest to B[0], row 1 to B[2] (distance 4); got {got}"',
        ].join('\n'),
        hints: [
          'Each row of the distance matrix belongs to one row of A; find the column with the smallest value in each row.',
          'def nearest(A, B):\n    D = pairwise_dist(A, B)\n    return D.argmin(axis=___)',
        ],
        explain: 'This is k-nearest-neighbours with k = 1, and the same shape of work as vector search.',
      },
      {
        goal: 'Write `one_hot(y, k)`: an (n, k) float array with a 1 in column `y[i]` of row i and 0 elsewhere. Compare `y` as a column with `np.arange(k)`.',
        starter: 'def one_hot(y, k):\n    pass',
        solution: 'def one_hot(y, k):\n    col = y.reshape(-1, 1)\n    hit = col == np.arange(k)\n    return hit.astype(float)',
        tests: [
          'got = one_hot(np.array([0, 2, 1]), 3)',
          'assert got.shape == (3, 3), f"shape (n, k), got {got.shape}"',
          'assert np.array_equal(got, [[1, 0, 0], [0, 0, 1], [0, 1, 0]]), f"got {got}"',
          'assert got.dtype == np.float64, "return floats"',
          'assert one_hot(np.array([1]), 4).tolist() == [[0.0, 1.0, 0.0, 0.0]], "k sets the number of columns"',
        ].join('\n'),
        hints: [
          'A (n, 1) column compared with a (k,) row broadcasts to an (n, k) mask; convert it with `astype(float)`.',
          'def one_hot(y, k):\n    col = y.reshape(___, 1)\n    hit = col == np.arange(___)\n    return hit.astype(float)',
        ],
        explain: 'One-hot labels are what cross-entropy compares predictions against (unit F6).',
      },
    ],
  },
];
