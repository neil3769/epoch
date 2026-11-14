import type { Lab } from '../schema';

/*
 * Unit F3 labs. Each step's code is added to the code so far; hidden tests
 * run on the whole program. Scaffolding shrinks from lab to lab, and the last
 * lab starts every step from an empty function.
 */
export const f3Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f3-lab-1',
    title: 'Matrix multiply by hand',
    intro:
      'Build `matmul` from scratch with plain Python lists: first a dot product, then a column, then one cell, then the whole result. No NumPy, so every multiply and add is yours.',
    summary: 'You wrote matrix multiplication from nothing: a dot product for each row-column pair, and a check for shapes that do not fit.',
    minutes: 12,
    unlockAfter: 'f3-04',
    given: 'A = [[1, 2],\n     [3, 4]]\nB = [[5, 6],\n     [7, 8]]',
    steps: [
      {
        goal: 'Write `dot(u, v)`: multiply the pairs and add them up. `dot([1, 2], [3, 4])` should give 11.',
        starter: 'def dot(u, v):\n    total = 0\n    for a, b in zip(u, v):\n        ___\n    return total',
        solution: 'def dot(u, v):\n    total = 0\n    for a, b in zip(u, v):\n        total += a * b\n    return total',
        tests: [
          'assert dot([1, 2], [3, 4]) == 11, "dot([1, 2], [3, 4]) should be 11"',
          'assert dot([2, 0, 1], [5, 9, 3]) == 13, "dot([2, 0, 1], [5, 9, 3]) should be 13"',
          'assert dot([], []) == 0, "dot of two empty lists should be 0"',
        ].join('\n'),
        hints: [
          'Inside the loop, `a` and `b` are one pair. Multiply them, and add the result to `total`.',
          'def dot(u, v):\n    total = 0\n    for a, b in zip(u, v):\n        total += ___ * ___\n    return total',
        ],
        explain: '`zip` walks the two lists side by side, so each turn of the loop is one pair.',
      },
      {
        goal: 'Write `column(M, j)`: column `j` of `M` as a list. `column(B, 0)` should give `[5, 7]`.',
        starter: 'def column(M, j):\n    return [___ for row in M]',
        solution: 'def column(M, j):\n    return [row[j] for row in M]',
        tests: [
          'assert column(B, 0) == [5, 7], "column(B, 0) should be [5, 7]"',
          'assert column(B, 1) == [6, 8], "column(B, 1) should be [6, 8]"',
          'assert column([[1, 2, 3], [4, 5, 6]], 2) == [3, 6], "column of a 2x3 matrix, j=2, should be [3, 6]"',
        ].join('\n'),
        hints: [
          'A column takes one number from every row: the one at position `j`.',
          'def column(M, j):\n    return [row[___] for row in M]',
        ],
        explain: 'Rows are easy to get (`M[i]`); a column has to be collected, one item from each row.',
      },
      {
        goal: 'Write `cell(A, B, i, j)`: row `i` of A dotted with column `j` of B. Use your two functions.',
        starter: 'def cell(A, B, i, j):\n    return ___',
        solution: 'def cell(A, B, i, j):\n    return dot(A[i], column(B, j))',
        tests: [
          'assert cell(A, B, 0, 0) == 19, "cell(A, B, 0, 0) should be 1*5 + 2*7 = 19"',
          'assert cell(A, B, 0, 1) == 22, "cell(A, B, 0, 1) should be 1*6 + 2*8 = 22"',
          'assert cell(A, B, 1, 0) == 43, "cell(A, B, 1, 0) should be 3*5 + 4*7 = 43"',
        ].join('\n'),
        hints: [
          'Row `i` of A is `A[i]`. Column `j` of B comes from your `column` function. Then `dot` them.',
          'def cell(A, B, i, j):\n    return dot(___, column(B, ___))',
        ],
        explain: 'This one line is the whole idea of matrix multiplication: cell (i, j) = row i · column j.',
      },
      {
        goal: 'Write the inner loop of `matmul`: for each column `j` of B, append `cell(A, B, i, j)` to `row`.',
        starter:
          'def matmul(A, B):\n    out = []\n    for i in range(len(A)):\n        row = []\n        # one value per column of B\n        ___\n        out.append(row)\n    return out',
        solution:
          'def matmul(A, B):\n    out = []\n    for i in range(len(A)):\n        row = []\n        for j in range(len(B[0])):\n            v = cell(A, B, i, j)\n            row.append(v)\n        out.append(row)\n    return out',
        tests: [
          'assert matmul(A, B) == [[19, 22], [43, 50]], "matmul(A, B) should be [[19, 22], [43, 50]]"',
          'assert matmul([[1, 2, 3]], [[1], [2], [3]]) == [[14]], "(1, 3) @ (3, 1) should be [[14]]"',
          'assert matmul([[1], [2]], [[3, 4]]) == [[3, 4], [6, 8]], "(2, 1) @ (1, 2) should be [[3, 4], [6, 8]]"',
        ].join('\n'),
        hints: [
          'B has `len(B[0])` columns. Loop `j` over them, and append one cell per column.',
          '        for j in range(___):\n            v = cell(A, B, i, j)\n            row.___(v)',
        ],
        explain: 'Rows of the result come from rows of A, columns from columns of B: that is the shape rule, (m, n) @ (n, p) → (m, p).',
      },
      {
        goal: 'Write `safe_matmul(A, B)`: raise a `ValueError` when a row of A is not as long as a column of B, otherwise return `matmul(A, B)`.',
        starter: 'def safe_matmul(A, B):\n    if ___:\n        raise ValueError("bad shapes")\n    return matmul(A, B)',
        solution: 'def safe_matmul(A, B):\n    if len(A[0]) != len(B):\n        raise ValueError("bad shapes")\n    return matmul(A, B)',
        tests: [
          'assert safe_matmul(A, B) == [[19, 22], [43, 50]], "safe_matmul(A, B) should still work"',
          'assert safe_matmul([[1, 2, 3]], [[1], [1], [1]]) == [[6]], "(1, 3) @ (3, 1) should work"',
          'try:\n    safe_matmul([[1, 2, 3]], A)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError("(1, 3) @ (2, 2) should raise ValueError")',
        ].join('\n'),
        hints: [
          'A row of A has `len(A[0])` numbers. A column of B has one number per row of B: `len(B)`.',
          'def safe_matmul(A, B):\n    if len(A[0]) != ___:\n        raise ValueError("bad shapes")\n    return matmul(A, B)',
        ],
        explain: 'NumPy does the same check: when the inner sizes differ, `@` raises a ValueError instead of guessing.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f3-lab-2',
    title: 'The same in NumPy',
    intro:
      'Do with NumPy in one line what took a page of loops: `@`, `*`, transposes, and a layer of neurons. Less scaffolding this time.',
    summary: 'You used `@` and `*` on real arrays, built a layer as `W @ x + b`, and fixed a shape error with a transpose.',
    minutes: 12,
    unlockAfter: 'f3-11',
    steps: [
      {
        goal: 'Make `A`, a 2×3 array holding 1 to 6 row by row, and `B`, a 3×2 array holding 7 to 12 row by row.',
        starter: 'A = np.array(___)\nB = ___',
        solution: 'A = np.array([[1, 2, 3],\n              [4, 5, 6]])\nB = np.array([[7, 8],\n              [9, 10],\n              [11, 12]])',
        tests: [
          'assert A.shape == (2, 3), f"A should have shape (2, 3), not {A.shape}"',
          'assert A.tolist() == [[1, 2, 3], [4, 5, 6]], "A should hold 1 to 6, row by row"',
          'assert B.shape == (3, 2), f"B should have shape (3, 2), not {B.shape}"',
          'assert B.tolist() == [[7, 8], [9, 10], [11, 12]], "B should hold 7 to 12, row by row"',
        ].join('\n'),
        hints: [
          'A 2-D array is a list of rows: `np.array([[...], [...]])`. A has 2 rows of 3; B has 3 rows of 2.',
          'A = np.array([[1, 2, 3],\n              [___]])\nB = np.array([[7, 8],\n              [___],\n              [___]])',
        ],
        explain: '`np.arange(1, 7).reshape(2, 3)` makes the same A, if you want a shortcut later.',
      },
      {
        goal: 'Set `C` to the matrix product of `A` and `B`, and `shape` to its shape.',
        starter: 'C = ___\nshape = ___',
        solution: 'C = A @ B\nshape = C.shape',
        tests: [
          'assert isinstance(C, np.ndarray), "C should be an array"',
          'assert C.tolist() == [[58, 64], [139, 154]], f"C should be A @ B, got {C.tolist()}"',
          'assert shape == (2, 2), f"shape should be (2, 2), got {shape}"',
        ].join('\n'),
        hints: ['Matrix product is `@`. Every array has a `.shape`.', 'C = A ___ B\nshape = C.___'],
        explain: '(2, 3) @ (3, 2) → (2, 2): the inner 3s match and disappear.',
      },
      {
        goal: 'Set `D` to `A` times itself cell by cell, and `G` to `A` times its transpose `A.T` as a matrix product.',
        starter: 'D = ___\nG = ___',
        solution: 'D = A * A\nG = A @ A.T',
        tests: [
          'assert D.tolist() == [[1, 4, 9], [16, 25, 36]], f"D should square each cell, got {D.tolist()}"',
          'assert G.shape == (2, 2), f"G should be (2, 3) @ (3, 2) = (2, 2), got {G.shape}"',
          'assert G.tolist() == [[14, 32], [32, 77]], f"G should be A @ A.T, got {G.tolist()}"',
        ].join('\n'),
        hints: [
          'Cell by cell is `*`. `A.T` flips rows and columns, so (2, 3) becomes (3, 2).',
          'D = A ___ A\nG = A ___ A.T',
        ],
        explain: '`A @ A` would fail: (2, 3) @ (2, 3) has inner sizes 3 and 2. The transpose makes them line up.',
      },
      {
        goal: 'Write `layer(W, x, b)`: a layer of neurons, which is the matrix product of weights `W` and inputs `x`, plus the bias `b`.',
        starter: 'def layer(W, x, b):\n    ___',
        solution: 'def layer(W, x, b):\n    return W @ x + b',
        tests: [
          'W = np.array([[1, 0, 2], [0, 1, 1]])',
          'x = np.array([3, 4, 5])',
          'b = np.array([1, -1])',
          'out = layer(W, x, b)',
          'assert out is not None, "layer should return its result"',
          'assert np.asarray(out).tolist() == [14, 8], f"layer(W, x, b) should be [14, 8], got {np.asarray(out).tolist()}"',
        ].join('\n'),
        hints: [
          'Each neuron is a weighted sum of all inputs: one row of `W` dotted with `x`. All rows at once is `W @ x`.',
          'def layer(W, x, b):\n    return ___ @ ___ + b',
        ],
        explain: 'Two neurons, three inputs: (2, 3) @ (3,) → (2,), one output per neuron.',
      },
      {
        goal: 'A batch `X` of 4 inputs has shape (4, 3), and `X @ W` fails: (4, 3) @ (2, 3). Write `batch_layer(X, W, b)` returning shape (4, 2).',
        starter: 'def batch_layer(X, W, b):\n    ___',
        solution: 'def batch_layer(X, W, b):\n    return X @ W.T + b',
        tests: [
          'W = np.array([[1, 0, 2], [0, 1, 1]])',
          'b = np.array([1, -1])',
          'X = np.array([[3, 4, 5], [1, 1, 1], [0, 0, 0], [2, 0, 1]])',
          'out = batch_layer(X, W, b)',
          'assert out is not None, "batch_layer should return its result"',
          'out = np.asarray(out)',
          'assert out.shape == (4, 2), f"the result should have shape (4, 2), got {out.shape}"',
          'for row, x in zip(out, X):',
          '    assert row.tolist() == (W @ x + b).tolist(), "each row should be that input\'s layer output"',
        ].join('\n'),
        hints: [
          'For `@` the inner sizes must match: (4, 3) needs a (3, something) on its right. Which flip of `W` is (3, 2)?',
          'def batch_layer(X, W, b):\n    return X @ ___ + b',
        ],
        explain: 'Real models do exactly this: a batch of inputs times the transposed weights. Reading the shapes found the fix.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'f3-lab-3',
    title: 'Shape rules as code',
    intro:
      'Turn the unit\'s rules into functions that predict shapes before anything runs. Every step starts from an empty function: no scaffolding.',
    summary: 'You wrote the shape rules for `@` and `*` as code, and used them to check a whole chain of products.',
    minutes: 12,
    unlockAfter: 'f3-12',
    steps: [
      {
        goal: 'Write `matmul_shape(a, b)` for two shapes like `(2, 3)` and `(3, 4)`: return the shape of `@`, or `None` if `@` cannot run.',
        starter: 'def matmul_shape(a, b):\n    pass',
        solution: 'def matmul_shape(a, b):\n    if a[1] != b[0]:\n        return None\n    return (a[0], b[1])',
        tests: [
          'assert matmul_shape((2, 3), (3, 4)) == (2, 4), "(2, 3) @ (3, 4) should be (2, 4)"',
          'assert matmul_shape((5, 1), (1, 5)) == (5, 5), "(5, 1) @ (1, 5) should be (5, 5)"',
          'assert matmul_shape((2, 3), (2, 3)) is None, "(2, 3) @ (2, 3) cannot run: should be None"',
        ].join('\n'),
        hints: [
          'Inner numbers must match (`a[1]` and `b[0]`); the outer ones survive.',
          'def matmul_shape(a, b):\n    if a[1] != ___:\n        return None\n    return (___, ___)',
        ],
      },
      {
        goal: 'Write `times_shape(a, b)` for `*`: equal shapes give that shape, anything else gives `None`.',
        starter: 'def times_shape(a, b):\n    pass',
        solution: 'def times_shape(a, b):\n    if a != b:\n        return None\n    return a',
        tests: [
          'assert times_shape((2, 3), (2, 3)) == (2, 3), "(2, 3) * (2, 3) should be (2, 3)"',
          'assert times_shape((2, 3), (3, 2)) is None, "(2, 3) * (3, 2) should be None"',
          'assert times_shape((4, 4), (4, 4)) == (4, 4), "(4, 4) * (4, 4) should be (4, 4)"',
        ].join('\n'),
        hints: [
          'Cell by cell needs a partner for every cell, so the shapes must be the same.',
          'def times_shape(a, b):\n    if a != b:\n        return ___\n    return ___',
        ],
        explain: 'NumPy also stretches some unequal shapes (broadcasting, in unit F4). For two matrices, equal shapes is the rule.',
      },
      {
        goal: "Write `which(a, b)`: return `'@'` if only `@` works, `'*'` if only `*` works, `'both'` or `'neither'` otherwise.",
        starter: 'def which(a, b):\n    pass',
        solution:
          "def which(a, b):\n    m = matmul_shape(a, b)\n    t = times_shape(a, b)\n    if m and t:\n        return 'both'\n    if m:\n        return '@'\n    if t:\n        return '*'\n    return 'neither'",
        tests: [
          "assert which((2, 3), (3, 4)) == '@', \"(2, 3) and (3, 4): only @ works\"",
          "assert which((2, 3), (2, 3)) == '*', \"(2, 3) and (2, 3): only * works\"",
          "assert which((3, 3), (3, 3)) == 'both', \"(3, 3) and (3, 3): both work\"",
          "assert which((2, 3), (4, 5)) == 'neither', \"(2, 3) and (4, 5): neither works\"",
        ].join('\n'),
        hints: [
          'Call your two functions first. A shape counts as true and `None` as false, so `if m and t:` tests both.',
          "def which(a, b):\n    m = matmul_shape(a, b)\n    t = times_shape(a, b)\n    if ___:\n        return 'both'\n    if ___:\n        return '@'\n    if ___:\n        return '*'\n    return 'neither'",
        ],
        explain: 'Square matrices of the same size are the trap: both run, and give different answers.',
      },
      {
        goal: 'Write `chain_shape(shapes)`: the shape of multiplying a list of matrices left to right with `@`, or `None` if any step fails.',
        starter: 'def chain_shape(shapes):\n    pass',
        solution:
          'def chain_shape(shapes):\n    out = shapes[0]\n    for s in shapes[1:]:\n        out = matmul_shape(out, s)\n        if out is None:\n            return None\n    return out',
        tests: [
          'assert chain_shape([(2, 3), (3, 4), (4, 5)]) == (2, 5), "(2, 3) @ (3, 4) @ (4, 5) should be (2, 5)"',
          'assert chain_shape([(2, 3), (4, 5), (5, 1)]) is None, "(2, 3) @ (4, 5) fails at the first step: None"',
          'assert chain_shape([(3, 3)]) == (3, 3), "a single matrix keeps its shape"',
          'assert chain_shape([(1, 2), (2, 2), (2, 2), (2, 7)]) == (1, 7), "(1, 2) through to (2, 7) should be (1, 7)"',
        ].join('\n'),
        hints: [
          'Start from the first shape, then fold in the rest one at a time with `matmul_shape`. Stop as soon as it gives `None`.',
          'def chain_shape(shapes):\n    out = shapes[0]\n    for s in shapes[1:]:\n        out = ___\n        if out is None:\n            return ___\n    return out',
        ],
        explain: 'Only the first and last outer numbers survive a chain: this is how you check a whole network\'s shapes on paper.',
      },
    ],
  },
];
