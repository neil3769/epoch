import type { Lesson } from '../schema';

/*
 * F4 lessons 8 to 14: element-wise maths, reductions along an axis, reshape,
 * broadcasting (with the broadcasting figure), per-row and per-column work,
 * replacing loops, and the checkpoint.
 */
export const f4More: Lesson[] = [
  // ------------------------------------------------------------------ 8
  {
    id: 'f4-08',
    title: 'Element-wise maths',
    summary: 'Operators and NumPy functions work on every item at once and keep the shape.',
    card: {
      title: 'Element-wise maths',
      text: 'Arithmetic on arrays happens item by item: `a * 2`, `a ** 2` and `a + b` each give a new array of the same shape. NumPy functions such as `np.sqrt` and `np.exp` work the same way, on every item at once. That is why `*` between two arrays pairs the items up, while `@` (unit F3) also adds them.',
      code: `a = np.array([1.0, 4.0, 9.0])
print(a * 2)
print(np.sqrt(a))`,
      output: '[ 2.  8. 18.]\n[1. 2. 3.]',
    },
    exercises: [
      {
        id: 'f4-8-1',
        type: 'number-grid',
        prompt: 'Fill in `a ** 2`.',
        inputs: [{ name: 'a', value: [[1, -2, 3]] }],
        expr: 'a ** 2',
        answer: [[1, 4, 9]],
        explain: 'Each item squared; −2 squared is 4.',
      },
      {
        id: 'f4-8-2',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `a = np.array([1, 2, 3])
print(a * a)`,
        answer: '[1 4 9]',
        typedWrong: [{ answer: '14', why: 'That is `a @ a`. `*` keeps the products separate.' }],
        explain: 'Item times item.',
      },
      {
        id: 'f4-8-3',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `x = np.array([0.0, 1.0])
print(np.exp(x))`,
        answer: '[1.         2.71828183]',
        options: [
          { text: '[1.         2.71828183]' },
          { text: '[0.         2.71828183]', why: 'e to the power 0 is 1, not 0.' },
          { text: '2.718281828459045', why: '`np.exp` returns one result per item: two numbers.' },
        ],
        explain: '`np.exp` is applied to each item: e⁰ = 1 and e¹ ≈ 2.718.',
      },
      {
        id: 'f4-8-4',
        type: 'predict-output',
        prompt: 'Comparisons are element-wise too. What does this print?',
        code: `a = np.array([1, 2, 3])
b = np.array([3, 2, 1])
print(a == b)`,
        answer: '[False  True False]',
        options: [
          { text: '[False  True False]' },
          { text: 'False', why: '`==` on arrays compares each pair and gives one answer per item.' },
          { text: '[ True False  True]', why: 'Only the middle pair (2 and 2) is equal.' },
        ],
        explain: 'Use `np.array_equal(a, b)` for a single yes or no.',
      },
      {
        id: 'f4-8-5',
        type: 'fill-blank',
        prompt: 'ReLU: keep each value, or 0 if it is negative.',
        code: `x = np.array([-2.0, 0.5, 3.0])
print(np.___(x, 0))`,
        answer: ['maximum'],
        distractors: [
          { text: 'max', why: '`np.max(x, 0)` reads 0 as an axis and returns the single largest value.' },
          { text: 'minimum', why: 'That keeps the smaller of each pair: every positive value becomes 0.' },
        ],
        expectOutput: '[0.  0.5 3. ]',
        explain: '`np.maximum` compares item by item; `np.max` reduces to one value.',
      },
      {
        id: 'f4-8-6',
        type: 'predict-output',
        prompt: 'A function written for one number, given an array. What does this print?',
        code: `def f(x):
    return 3 * x ** 2 + 1

xs = np.array([0, 1, 2])
print(f(xs))`,
        answer: '[ 1  4 13]',
        options: [
          { text: '[ 1  4 13]' },
          { text: '13', why: 'Every operation is element-wise, so the function runs on each item.' },
          { text: '[ 1  4 7]', why: 'Powers come before multiplying: 3 × 2² + 1 = 13.' },
        ],
        explain: 'Arithmetic-only functions work on arrays for free.',
      },
      {
        id: 'f4-8-7',
        type: 'spot-bug',
        prompt: 'Which line cannot take an array?',
        code: `import math
a = np.array([4.0, 9.0])
r = math.sqrt(a)`,
        error: 'TypeError: only ...',
        answer: 2,
        lineWhy: {
          '0': 'Importing math is fine.',
          '1': 'The array is fine.',
        },
        explain: '`math` works on one number at a time. Use `np.sqrt(a)` for arrays.',
      },
      {
        id: 'f4-8-8',
        type: 'run-code',
        prompt: 'Set `sq` to every item of `x` squared.',
        before: 'x = np.array([-1.0, 2.0, -3.0])',
        solution: 'sq = x ** 2',
        tests: 'assert np.allclose(sq, [1, 4, 9]), f"got {sq}"',
        placeholder: 'sq = ...',
        explain: 'One expression, every item.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'f4-09',
    title: 'Reducing along an axis',
    summary: 'sum, mean, max and argmax reduce an array; axis says which dimension disappears.',
    card: {
      title: 'Reducing along an axis',
      text: '`sum`, `mean`, `max` and `argmax` reduce many numbers to fewer; with no axis they reduce the whole array. `axis=0` collapses the rows, giving one result per column, and `axis=1` collapses the columns, giving one result per row. Read `axis=k` as "dimension k disappears".',
      code: `M = np.array([[1, 2, 3],
              [4, 5, 6]])
print(M.sum())
print(M.sum(axis=0))
print(M.sum(axis=1))`,
      output: '21\n[5 7 9]\n[ 6 15]',
    },
    exercises: [
      {
        id: 'f4-9-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `M = np.array([[2, 4],
              [6, 8]])
print(M.mean(axis=1))`,
        answer: '[3. 7.]',
        options: [
          { text: '[3. 7.]' },
          { text: '[4. 6.]', why: 'That is `axis=0`, one mean per column. `axis=1` gives one per row.' },
          { text: '5.0', why: 'With an axis there is one mean per row, not one overall.' },
        ],
        explain: 'Row means: (2 + 4) / 2 and (6 + 8) / 2.',
      },
      {
        id: 'f4-9-2',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `s = np.array([0.1, 0.7, 0.2])
print(s.argmax())`,
        answer: '1',
        typedWrong: [{ answer: '0.7', why: '`argmax` gives the position of the largest value; `max` gives the value.' }],
        explain: 'The largest value, 0.7, is at index 1.',
      },
      {
        id: 'f4-9-3',
        type: 'predict-output',
        prompt: 'One prediction per row, two classes. What does this print?',
        code: `P = np.array([[0.1, 0.9],
              [0.8, 0.2],
              [0.4, 0.6]])
print(P.argmax(axis=1))`,
        answer: '[1 0 1]',
        options: [
          { text: '[1 0 1]' },
          { text: '[1 0]', why: 'That is `axis=0`: one answer per column. `axis=1` gives one per row (3).' },
          { text: '[0.9 0.8 0.6]', why: 'That is `max`. `argmax` gives the column index of each maximum.' },
        ],
        explain: 'The predicted class of each example.',
      },
      {
        id: 'f4-9-4',
        type: 'predict-shape',
        prompt: '100 examples, 5 features. What is the shape of the per-feature means?',
        code: `X = np.zeros((100, 5))
mu = X.mean(axis=0)`,
        target: 'mu',
        answer: '(5,)',
        options: [
          { text: '(5,)' },
          { text: '(100,)', why: 'Axis 0 (the 100 examples) is the one that disappears.' },
          { text: '(1, 5)', why: 'The reduced axis is removed, not kept as 1 (unless you pass keepdims=True).' },
        ],
        explain: 'One mean per feature.',
      },
      {
        id: 'f4-9-5',
        type: 'fill-blank',
        prompt: 'The mean of each column.',
        code: `X = np.array([[1.0, 10.0],
              [3.0, 30.0]])
print(X.mean(axis=___))`,
        answer: ['0'],
        distractors: [
          { text: '1', why: 'Axis 1 averages across each row: [5.5, 16.5].' },
          { text: '-1', why: '−1 is the last axis, which here is axis 1: the row means.' },
        ],
        expectOutput: '[ 2. 20.]',
        explain: 'Collapse the rows to get one value per column.',
      },
      {
        id: 'f4-9-6',
        type: 'mcq',
        prompt: 'Predictions `P` have shape (examples, classes). Which gives the predicted class of every example?',
        options: [
          { text: '`P.argmax(axis=1)`' },
          { text: '`P.argmax(axis=0)`', why: 'That gives, for each class, which example scored highest.' },
          { text: '`P.max(axis=1)`', why: 'That gives the highest score, not which class it belongs to.' },
        ],
        answer: 0,
        explain: 'The class is the column with the highest score in each row.',
      },
      {
        id: 'f4-9-7',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `M = np.array([[3, 9],
              [7, 1]])
print(M.max(axis=0), M.max())`,
        answer: '[7 9] 9',
        options: [
          { text: '[7 9] 9' },
          { text: '[9 7] 9', why: '`axis=0` gives one maximum per column: 7 for column 0, 9 for column 1.' },
          { text: '[7 9] [7 9]', why: 'With no axis, `max` reduces the whole array to one number.' },
        ],
        explain: 'Per column, then overall.',
      },
      {
        id: 'f4-9-8',
        type: 'run-code',
        prompt: 'Each row is a student, each column a test. Set `avg` to each student\'s average.',
        before: `scores = np.array([[50, 70, 90],
                   [80, 80, 80]])`,
        solution: 'avg = scores.mean(axis=1)',
        tests: 'assert np.allclose(avg, [70, 80]), f"one average per student (row): [70, 80], got {avg}"',
        placeholder: 'avg = ...',
        explain: 'Per row means collapsing the columns: `axis=1`.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 'f4-10',
    title: 'Reshape',
    summary: 'reshape rearranges the same numbers into a new shape; -1 fills in one size.',
    card: {
      title: 'Reshape',
      text: '`reshape` lays the same numbers out in a new shape, filling row by row, as long as the total count stays the same. One size can be `-1`, meaning "whatever makes the count work". `.T` swaps rows and columns instead, and `ravel()` flattens to 1-D.',
      code: `a = np.arange(6)
print(a.reshape(2, 3))
print(a.reshape(3, -1).shape)`,
      output: '[[0 1 2]\n [3 4 5]]\n(3, 2)',
    },
    exercises: [
      {
        id: 'f4-10-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: 'print(np.arange(6).reshape(3, 2))',
        answer: '[[0 1]\n [2 3]\n [4 5]]',
        options: [
          { text: '[[0 1]\n [2 3]\n [4 5]]' },
          { text: '[[0 3]\n [1 4]\n [2 5]]', why: 'Reshape fills row by row, so the first row is 0, 1.' },
          { text: '[[0 1 2]\n [3 4 5]]', why: 'That is 2 rows of 3. (3, 2) is 3 rows of 2.' },
        ],
        explain: 'Same order, new rows.',
      },
      {
        id: 'f4-10-2',
        type: 'predict-shape',
        prompt: 'Type the shape.',
        code: 'a = np.zeros(12)',
        target: 'a.reshape(4, -1)',
        answer: '(4, 3)',
        typedWrong: [{ answer: '(4, -1)', why: '−1 is worked out: 12 items in 4 rows is 3 per row.' }],
        explain: '12 / 4 = 3.',
      },
      {
        id: 'f4-10-3',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `pixels = np.arange(12)
img = pixels.reshape(4, 4)
print(img[0])`,
        error: 'ValueError: cannot reshape array of size 12 into shape (4,4)',
        answer: 1,
        lineWhy: {
          '0': 'Twelve pixel values is fine.',
          '2': 'Printing the first row is fine once the reshape works.',
        },
        explain: '4 × 4 is 16, not 12. Use (3, 4) or (4, 3).',
      },
      {
        id: 'f4-10-4',
        type: 'predict-shape',
        prompt: 'Flatten each image into one row. What shape?',
        code: 'imgs = np.zeros((32, 28, 28))',
        target: 'imgs.reshape(32, -1)',
        answer: '(32, 784)',
        options: [
          { text: '(32, 784)' },
          { text: '(32, 28)', why: '−1 takes everything left over: 28 × 28 = 784.' },
          { text: '(784, 32)', why: 'The 32 stays first, as asked; −1 is the second size.' },
        ],
        explain: 'One row of 784 pixels per image: the input a simple network expects.',
      },
      {
        id: 'f4-10-5',
        type: 'predict-output',
        prompt: 'Transpose is not reshape. What does this print?',
        code: `M = np.array([[1, 2, 3],
              [4, 5, 6]])
print(M.T)`,
        answer: '[[1 4]\n [2 5]\n [3 6]]',
        options: [
          { text: '[[1 4]\n [2 5]\n [3 6]]' },
          { text: '[[1 2]\n [3 4]\n [5 6]]', why: 'That is `reshape(3, 2)`. `.T` turns each row into a column.' },
        ],
        explain: 'Both give shape (3, 2), but only `.T` swaps rows and columns.',
      },
      {
        id: 'f4-10-6',
        type: 'fill-blank',
        prompt: 'Make `a` a column: shape (3, 1).',
        code: `a = np.array([1, 2, 3])
col = a.reshape(___, 1)
print(col.shape)`,
        answer: ['-1'],
        distractors: [
          { text: '1', why: '(1, 1) holds one number, but there are three.' },
          { text: '0', why: 'A size of 0 holds no numbers at all.' },
        ],
        expectOutput: '(3, 1)',
        explain: '`reshape(-1, 1)` makes a column of any length.',
      },
      {
        id: 'f4-10-7',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `M = np.array([[1, 2],
              [3, 4]])
print(M.ravel())`,
        answer: '[1 2 3 4]',
        options: [
          { text: '[1 2 3 4]' },
          { text: '[1 3 2 4]', why: 'It reads row by row: all of row 0, then row 1.' },
          { text: '[[1 2 3 4]]', why: '`ravel` returns a 1-D array: one pair of brackets.' },
        ],
        explain: 'Flattened in reading order.',
      },
      {
        id: 'f4-10-8',
        type: 'run-code',
        prompt: 'Set `X` to `x` as a single column, shape (10, 1).',
        before: 'x = np.arange(10)',
        solution: 'X = x.reshape(-1, 1)',
        tests: [
          'assert X.shape == (10, 1), f"shape should be (10, 1), got {X.shape}"',
          'assert X[:, 0].tolist() == list(range(10)), "same numbers in the same order"',
        ].join('\n'),
        placeholder: 'X = ...',
        explain: 'Libraries such as scikit-learn want features as a 2-D (n, 1) array.',
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    id: 'f4-11',
    title: 'Broadcasting',
    summary: 'Shapes are compared from the right; equal sizes or a 1 work, and a 1 is stretched by copying.',
    card: {
      title: 'Broadcasting',
      text: 'When shapes differ, NumPy compares them from the right: each pair of sizes must be equal, or one of them must be 1 (a missing size counts as 1). A size of 1 is stretched to match by copying, without using extra memory. So (2, 3) + (3,) adds the 1-D array to every row, but (2, 3) + (2,) fails.',
      figure: { kind: 'broadcast', A: [[1, 2, 3], [4, 5, 6]], B: [[10, 20, 30]], oneD: ['B'] },
    },
    exercises: [
      {
        id: 'f4-11-1',
        type: 'figure',
        prompt: 'Compare the shapes, stretch, then tap the result cell that adds 6 and 30.',
        figure: { kind: 'broadcast', A: [[1, 2, 3], [4, 5, 6]], B: [[10, 20, 30]], oneD: ['B'], goal: { cell: [1, 2] } },
        explain: 'B\'s single row is copied down, so every row of A meets [10, 20, 30].',
      },
      {
        id: 'f4-11-2',
        type: 'figure',
        prompt: 'B is a column this time. Stretch, then tap the cell that adds 5 and 200.',
        figure: { kind: 'broadcast', A: [[1, 2, 3], [4, 5, 6]], B: [[100], [200]], goal: { cell: [1, 1] } },
        explain: 'A (2, 1) column is copied across: each row gets its own number.',
      },
      {
        id: 'f4-11-3',
        type: 'predict-shape',
        prompt: 'What is the shape of `a + b`?',
        code: `a = np.zeros((4, 3))
b = np.zeros(3)`,
        target: 'a + b',
        answer: '(4, 3)',
        options: [
          { text: '(4, 3)' },
          { text: '(3,)', why: 'The smaller array is stretched to the larger, not the other way round.' },
          { text: 'error', why: 'From the right, 3 meets 3 (equal) and 4 meets nothing (counts as 1): it works.' },
        ],
        explain: 'b is added to each of the 4 rows.',
      },
      {
        id: 'f4-11-4',
        type: 'predict-shape',
        prompt: 'What is the shape of `a + b`?',
        code: `a = np.zeros((4, 3))
b = np.zeros(4)`,
        target: 'a + b',
        answer: 'error',
        options: [
          { text: 'error' },
          { text: '(4, 3)', why: 'Shapes line up from the right: b\'s 4 meets a\'s 3, and neither is 1.' },
          { text: '(4, 4)', why: 'Stretching only copies a size of 1; 3 and 4 clash.' },
        ],
        explain: 'To add one number per row, b must be a column: `b.reshape(-1, 1)`, shape (4, 1).',
      },
      {
        id: 'f4-11-5',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `a = np.array([[1, 2],
              [3, 4]])
print(a + np.array([10, 20]))`,
        answer: '[[11 22]\n [13 24]]',
        options: [
          { text: '[[11 22]\n [13 24]]' },
          { text: '[[11 12]\n [23 24]]', why: 'A 1-D array lines up with the columns, so each row gets [10, 20].' },
        ],
        explain: '[10, 20] is copied to every row.',
      },
      {
        id: 'f4-11-6',
        type: 'predict-shape',
        prompt: 'A column and a row. What is the shape of `c + r`?',
        code: `c = np.zeros((3, 1))
r = np.zeros((1, 4))`,
        target: 'c + r',
        answer: '(3, 4)',
        options: [
          { text: '(3, 4)' },
          { text: 'error', why: 'In each pair one size is 1, so both stretch.' },
          { text: '(3, 1)', why: 'r\'s 4 columns stretch c across; the result takes the larger size each time.' },
        ],
        explain: 'Both are stretched: every row number meets every column number, like a times table.',
      },
      {
        id: 'f4-11-7',
        type: 'mcq',
        prompt: 'Which pair of shapes can be added?',
        options: [
          { text: '(5, 3) and (5, 1)' },
          { text: '(5, 3) and (5,)', why: 'From the right, 3 meets 5: neither is 1.' },
          { text: '(5, 3) and (3, 5)', why: '3 meets 5 and 5 meets 3: both pairs clash.' },
        ],
        answer: 0,
        explain: '3 meets 1 (stretched) and 5 meets 5 (equal).',
        check: [
          'assert (np.zeros((5, 3)) + np.zeros((5, 1))).shape == (5, 3)',
          'for s in [(5,), (3, 5)]:',
          '    try:',
          '        np.zeros((5, 3)) + np.zeros(s)',
          '        raise SystemExit("should fail")',
          '    except ValueError:',
          '        pass',
        ].join('\n'),
      },
      {
        id: 'f4-11-8',
        type: 'run-code',
        prompt: 'Set `Y` to `X` with `shift` added to every row.',
        before: `X = np.array([[1.0, 2.0],
              [3.0, 4.0],
              [5.0, 6.0]])
shift = np.array([10.0, -1.0])`,
        solution: 'Y = X + shift',
        tests: 'assert np.allclose(Y, [[11, 1], [13, 3], [15, 5]]), f"got {Y}"',
        placeholder: 'Y = ...',
        explain: 'No loop needed: shift is broadcast across the rows.',
      },
    ],
  },

  // ------------------------------------------------------------------ 12
  {
    id: 'f4-12',
    title: 'Per column, per row',
    summary: 'Reduce along an axis, then broadcast back; keepdims=True makes per-row results line up.',
    card: {
      title: 'Per column, per row',
      text: 'Reduce along an axis, then broadcast the result back: that is how per-column and per-row operations are written. `X - X.mean(axis=0)` centres every column, because the per-column means line up with the columns. For per-row results, pass `keepdims=True` so they come back as a (rows, 1) column that lines up with the rows.',
      code: `X = np.array([[1.0, 10.0],
              [3.0, 30.0]])
print(X - X.mean(axis=0))
s = X.sum(axis=1, keepdims=True)
print(s.shape)`,
      output: '[[ -1. -10.]\n [  1.  10.]]\n(2, 1)',
    },
    exercises: [
      {
        id: 'f4-12-1',
        type: 'predict-output',
        prompt: 'Centre each column. What does this print?',
        code: `X = np.array([[2.0, 0.0],
              [4.0, 2.0]])
print(X - X.mean(axis=0))`,
        answer: '[[-1. -1.]\n [ 1.  1.]]',
        options: [
          { text: '[[-1. -1.]\n [ 1.  1.]]' },
          { text: '[[ 1. -1.]\n [ 1. -1.]]', why: 'That subtracts each row\'s mean. `axis=0` gives the column means, 3 and 1.' },
          { text: '[[ 0. -2.]\n [ 2.  0.]]', why: 'That subtracts the overall mean, 2. `axis=0` gives one mean per column.' },
        ],
        explain: 'Column means are [3, 1]; each column now averages 0.',
      },
      {
        id: 'f4-12-2',
        type: 'predict-shape',
        prompt: 'What is the shape of `s`?',
        code: `X = np.zeros((3, 4))
s = X.sum(axis=1, keepdims=True)`,
        target: 's',
        answer: '(3, 1)',
        options: [
          { text: '(3, 1)' },
          { text: '(3,)', why: '`keepdims=True` keeps the reduced axis as a size of 1.' },
          { text: '(1, 4)', why: '`axis=1` collapses the columns, so it is the 4 that becomes 1.' },
        ],
        explain: 'One sum per row, kept as a column.',
      },
      {
        id: 'f4-12-3',
        type: 'spot-bug',
        prompt: 'Each row should be divided by its own sum. Which line is wrong?',
        code: `X = np.ones((3, 2))
s = X.sum(axis=1)
P = X / s`,
        error: 'ValueError: operands could not be broadcast together with shapes (3,2) (3,) ',
        answer: 1,
        raiseLine: 2,
        lineWhy: {
          '0': 'The data is fine.',
          '2': 'Python raises here, but dividing by the row sums is right; s has the wrong shape.',
        },
        explain: 'Write `X.sum(axis=1, keepdims=True)`: shape (3, 1) lines up with the rows.',
      },
      {
        id: 'f4-12-4',
        type: 'predict-output',
        prompt: 'Turn each row into proportions. What does this print?',
        code: `X = np.array([[1.0, 3.0],
              [2.0, 2.0]])
s = X.sum(axis=1, keepdims=True)
print(X / s)`,
        answer: '[[0.25 0.75]\n [0.5  0.5 ]]',
        options: [
          { text: '[[0.25 0.75]\n [0.5  0.5 ]]' },
          { text: '[[0.33333333 0.6       ]\n [0.66666667 0.4       ]]', why: 'That divides by the column sums (3 and 5). Here each row is divided by its own sum, 4.' },
        ],
        explain: 'Each row now sums to 1: the same step softmax ends with.',
      },
      {
        id: 'f4-12-5',
        type: 'predict-output',
        prompt: 'The silent version of the bug. What does this print?',
        code: `X = np.array([[1.0, 3.0],
              [1.0, 1.0]])
s = X.sum(axis=1)
print(X / s)`,
        answer: '[[0.25 1.5 ]\n [0.25 0.5 ]]',
        options: [
          { text: '[[0.25 1.5 ]\n [0.25 0.5 ]]' },
          { text: '[[0.25 0.75]\n [0.5  0.5 ]]', why: 'Without keepdims, s = [4, 2] lines up with the columns: column 1 is divided by 2, not each row by its sum.' },
        ],
        explain: 'Square arrays hide this bug: no error, just wrong numbers. Use keepdims for per-row work.',
      },
      {
        id: 'f4-12-6',
        type: 'fill-blank',
        prompt: 'Keep the reduced axis so each row divides by its own sum.',
        code: `X = np.array([[2.0, 2.0],
              [1.0, 3.0]])
s = X.sum(axis=1, ___=True)
print(X / s)`,
        answer: ['keepdims'],
        distractors: [
          { text: 'copy', why: '`sum` has no `copy` argument: TypeError.' },
          { text: 'initial', why: '`initial=True` adds 1 to each sum; it does not keep the axis.' },
        ],
        expectOutput: '[[0.5  0.5 ]\n [0.25 0.75]]',
        explain: 'keepdims turns shape (2,) into (2, 1).',
      },
      {
        id: 'f4-12-7',
        type: 'mcq',
        prompt: 'You standardise features: `(X - mu) / sd`, where X has one row per example. How should `mu` and `sd` be computed?',
        options: [
          { text: 'With `axis=0`: one per feature' },
          { text: 'With `axis=1`: one per example', why: 'Each feature has its own units and range, so each column gets its own mean and spread.' },
          { text: 'With no axis: one overall', why: 'That mixes features with different units, such as age and income.' },
        ],
        answer: 0,
        explain: 'Per-feature statistics, broadcast across the rows.',
      },
      {
        id: 'f4-12-8',
        type: 'run-code',
        prompt: 'Set `Z` to `X` with each column\'s mean subtracted.',
        before: `X = np.array([[1.0, 5.0],
              [3.0, 7.0],
              [5.0, 9.0]])`,
        solution: 'Z = X - X.mean(axis=0)',
        tests: [
          'assert np.allclose(Z.mean(axis=0), 0), "every column of Z should average 0"',
          'assert np.allclose(Z, [[-2, -2], [0, 0], [2, 2]]), f"got {Z}"',
        ].join('\n'),
        placeholder: 'Z = ...',
        explain: 'Reduce, then broadcast back.',
      },
    ],
  },

  // ------------------------------------------------------------------ 13
  {
    id: 'f4-13',
    title: 'Replace the loop',
    summary: 'Rewrite a loop over items as one array expression; X @ w does every row at once.',
    card: {
      title: 'Replace the loop',
      text: 'A Python loop over items can usually be rewritten as one array expression, which runs in compiled code and is often 10 to 100 times faster. Ask what the loop does to one item, then write that once for the whole array. For a batch of inputs, `X @ w` gives every row\'s weighted sum at once.',
      code: `xs = np.array([1.0, 2.0, 3.0])
out = []
for x in xs:
    out.append(2 * x + 1)
print(np.array(out))
print(2 * xs + 1)`,
      output: '[3. 5. 7.]\n[3. 5. 7.]',
    },
    exercises: [
      {
        id: 'f4-13-1',
        type: 'fill-blank',
        prompt: 'Replace a loop that counts the positive numbers.',
        code: `a = np.array([3, -1, 2, -4, 5])
print((a ___ 0).sum())`,
        answer: ['>'],
        distractors: [
          { text: '<', why: 'That counts the negative numbers.' },
          { text: '==', why: 'That counts the zeros.' },
        ],
        expectOutput: '3',
        explain: 'A mask, summed: the count without a loop.',
      },
      {
        id: 'f4-13-2',
        type: 'predict-output',
        prompt: 'A batch of three inputs and one set of weights. What does this print?',
        code: `X = np.array([[1, 2],
              [3, 4],
              [5, 6]])
w = np.array([1, 10])
print(X @ w)`,
        answer: '[21 43 65]',
        options: [
          { text: '[21 43 65]' },
          { text: '[[ 1 20]\n [ 3 40]\n [ 5 60]]', why: 'That is `X * w`. `@` also adds each row\'s products.' },
          { text: '[ 9 120]', why: 'Each row of X is dotted with w: 1 + 20, 3 + 40, 5 + 60.' },
        ],
        explain: 'One weighted sum per row: a whole batch in one line.',
      },
      {
        id: 'f4-13-3',
        type: 'predict-output',
        prompt: 'Same arrays, `*` this time. What does this print?',
        code: `X = np.array([[1, 2],
              [3, 4],
              [5, 6]])
w = np.array([1, 10])
print(X * w)`,
        answer: '[[ 1 20]\n [ 3 40]\n [ 5 60]]',
        options: [
          { text: '[[ 1 20]\n [ 3 40]\n [ 5 60]]' },
          { text: '[21 43 65]', why: 'That is `X @ w`. `*` broadcasts w across the rows and keeps the products.' },
        ],
        explain: '`*` scales each column; `@` then would add across the row.',
      },
      {
        id: 'f4-13-4',
        type: 'match-pairs',
        prompt: 'Match each loop to the array expression that gives the same result.',
        setup: 'a = np.array([3, -1, 2])',
        pairs: [
          { left: 'sum(x * x for x in a)', right: 'a @ a', why: 'Squares summed is the dot product with itself: 14.' },
          { left: 'sum(1 for x in a if x > 0)', right: '(a > 0).sum()', why: 'Counting the True items of a mask: 2.' },
          { left: 'sum(a) / len(a)', right: 'a.mean()', why: 'The mean: 4 / 3.' },
          { left: 'sum(abs(x) for x in a)', right: 'np.abs(a).sum()', why: 'Element-wise abs, then sum: 6.' },
        ],
        verify: 'equal',
        explain: 'Say what the loop computes, then find the array operation for it.',
      },
      {
        id: 'f4-13-5',
        type: 'run-code',
        prompt: 'Without a loop, set `out` to the same result as `[max(x, 0) for x in xs]`.',
        before: 'xs = np.array([1.0, -2.0, 3.0])',
        solution: 'out = np.maximum(xs, 0)',
        tests: 'assert np.allclose(out, [1, 0, 3]), f"negatives become 0: [1, 0, 3], got {out}"',
        placeholder: 'out = ...',
        explain: '`np.maximum` is the element-wise `max`.',
      },
      {
        id: 'f4-13-6',
        type: 'mcq',
        prompt: 'Why is `2 * xs + 1` much faster than the loop for a million items?',
        options: [
          { text: 'The work runs in NumPy\'s compiled code' },
          { text: 'It skips items that do not change', why: 'Every item is computed; the loop itself just runs in C, not Python.' },
          { text: 'It uses less precise arithmetic', why: 'It uses the same float64 arithmetic as the loop.' },
        ],
        answer: 0,
        explain: 'Python pays a cost per loop step; NumPy pays it once per call.',
      },
      {
        id: 'f4-13-7',
        type: 'spot-bug',
        prompt: 'Which line uses a one-number function on an array?',
        code: `xs = np.array([-1.0, 2.0])
out = max(xs, 0)
print(out)`,
        error: 'ValueError: The truth value of an array with more than one element is ambiguous. Use a.any() or a.all()',
        answer: 1,
        lineWhy: {
          '0': 'The data is fine.',
          '2': 'Printing is fine once `out` is computed.',
        },
        explain: 'Python\'s `max` compares whole objects. Use `np.maximum(xs, 0)`.',
      },
      {
        id: 'f4-13-8',
        type: 'predict-shape',
        prompt: '100 inputs of 3 features and one weight per feature. What is the shape of `X @ w`?',
        code: `X = np.zeros((100, 3))
w = np.zeros(3)`,
        target: 'X @ w',
        answer: '(100,)',
        options: [
          { text: '(100,)' },
          { text: '(100, 3)', why: 'That is `X * w`. `@` adds each row\'s products into one number.' },
          { text: '(3,)', why: 'There is one sum per row (input), not per feature.' },
        ],
        explain: 'One prediction per input.',
      },
    ],
  },

  // ------------------------------------------------------------------ 14
  {
    id: 'f4-14',
    title: 'Checkpoint',
    checkpoint: true,
    summary: 'You can make, index, mask, reduce, reshape and broadcast arrays, and replace loops with them.',
    card: {
      title: 'Checkpoint',
      text: 'Everything from this unit, mixed together. For each one, work out the shape of the answer first, then the values.',
    },
    exercises: [
      {
        id: 'f4-14-1',
        type: 'predict-shape',
        prompt: 'Type the shape.',
        code: 'X = np.zeros((50, 4))',
        target: 'X[:, 1:3]',
        answer: '(50, 2)',
        typedWrong: [{ answer: '(50, 3)', why: '`1:3` stops before 3: columns 1 and 2.' }],
        explain: 'Every row, two columns.',
      },
      {
        id: 'f4-14-2',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `a = np.array([2, 9, 5, 7])
print(a[a > 3].mean())`,
        answer: '7.0',
        options: [
          { text: '7.0' },
          { text: '5.75', why: 'That is the mean of all four. The mask keeps 9, 5 and 7.' },
          { text: '21', why: '`mean`, not `sum`: 21 / 3.' },
        ],
        explain: 'Mask, then reduce.',
      },
      {
        id: 'f4-14-3',
        type: 'figure',
        prompt: 'A column plus a 1-D array. Stretch, then tap the cell that adds 3 and 20.',
        figure: { kind: 'broadcast', A: [[1], [2], [3]], B: [[10, 20]], oneD: ['B'], goal: { cell: [2, 1] } },
        explain: '(3, 1) and (2,) both stretch, giving (3, 2).',
      },
      {
        id: 'f4-14-4',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `M = np.array([[1, 5],
              [7, 3]])
print(M.max(axis=0), M.argmax(axis=1))`,
        answer: '[7 5] [1 0]',
        options: [
          { text: '[7 5] [1 0]' },
          { text: '[5 7] [1 0]', why: '`max(axis=0)` is per column: 7 for column 0, 5 for column 1.' },
          { text: '[7 5] [5 7]', why: '`argmax` gives positions, not values: column 1 in row 0, column 0 in row 1.' },
        ],
        explain: 'Per-column maxima, then the position of each row\'s maximum.',
      },
      {
        id: 'f4-14-5',
        type: 'spot-bug',
        prompt: 'Each column should be centred. Which line is wrong?',
        code: `X = np.ones((4, 3))
mu = X.mean(axis=1)
Z = X - mu`,
        error: 'ValueError: operands could not be broadcast together with shapes (4,3) (4,) ',
        answer: 1,
        raiseLine: 2,
        lineWhy: {
          '0': 'The data is fine.',
          '2': 'Subtracting the means is right; mu holds row means, the wrong ones.',
        },
        explain: 'Column means need `axis=0`, shape (3,), which lines up with the columns.',
      },
      {
        id: 'f4-14-6',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `a = np.arange(4)
b = a[::2]
b *= 10
print(a)`,
        answer: '[ 0  1 20  3]',
        options: [
          { text: '[ 0  1 20  3]' },
          { text: '[0 1 2 3]', why: 'A slice is a view, so changing b changes a.' },
          { text: '[ 0 10 20 30]', why: 'b holds only items 0 and 2; 0 × 10 is still 0.' },
        ],
        explain: 'Items 0 and 2 were multiplied in place, through the view.',
      },
      {
        id: 'f4-14-7',
        type: 'fill-blank',
        prompt: 'Flatten each 4 by 4 image into a row.',
        code: `imgs = np.zeros((8, 4, 4))
flat = imgs.reshape(8, ___)
print(flat.shape)`,
        answer: ['-1'],
        distractors: [
          { text: '4', why: '(8, 4) holds 32 numbers, but there are 128.' },
          { text: '8', why: '(8, 8) holds 64 numbers, but there are 128.' },
        ],
        expectOutput: '(8, 16)',
        explain: '−1 works out the 16.',
      },
      {
        id: 'f4-14-8',
        type: 'number-grid',
        prompt: 'Fill in `X - X.mean(axis=0)`.',
        inputs: [{ name: 'X', value: [[1, 4], [3, 8]] }],
        expr: 'X - X.mean(axis=0)',
        answer: [[-1, -2], [1, 2]],
        explain: 'Column means are [2, 6], subtracted from every row.',
      },
      {
        id: 'f4-14-9',
        type: 'mcq',
        prompt: 'A loop computes `row @ w` for each of a million rows of `X`. What is the fix?',
        options: [
          { text: 'One expression: `X @ w`' },
          { text: 'Convert X to a list first', why: 'Lists are slower: every item becomes a Python object.' },
          { text: 'Sort the rows of X first', why: 'Order does not change the work; the loop itself is the cost.' },
        ],
        answer: 0,
        explain: 'Every row\'s weighted sum, in one call.',
      },
      {
        id: 'f4-14-10',
        type: 'run-code',
        prompt: 'Set `acc` to the accuracy: the fraction of rows whose highest column is the label in `y`.',
        before: `P = np.array([[0.1, 0.7, 0.2],
              [0.5, 0.3, 0.2],
              [0.2, 0.2, 0.6]])
y = np.array([1, 0, 0])`,
        solution: 'acc = (P.argmax(axis=1) == y).mean()',
        tests: 'assert abs(acc - 2 / 3) < 1e-9, f"predicted [1, 0, 2] vs labels [1, 0, 0]: 2 of 3 right; got {acc}"',
        placeholder: 'acc = ...',
        explain: 'argmax per row, compare, mean of the mask: accuracy in one line.',
      },
    ],
  },
];
