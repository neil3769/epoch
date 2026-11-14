import type { LibraryPage } from '../schema';

/** Unit F3 summary page: unlocked in the Library when the unit is finished. */
export const f3Library: LibraryPage = {
  unit: 'F3',
  ideas: [
    {
      title: 'Two operations share the word "multiply"',
      text: 'Element-wise multiply (`*`) pairs each cell with the cell in the same place in the other matrix: same shapes in, same shape out, one multiplication per cell. Matrix multiply (`@`) asks a different question: for each row on the left and column on the right, multiply the pairs and add them up, giving one number (a dot product, like prices times quantities giving a bill).',
    },
    {
      title: 'Cell (i, j) of A @ B is row i of A dotted with column j of B',
      text: 'That one sentence is all of matrix multiplication. Matrix times vector is the same thing with a single column: one dot product per row, so several weighted sums at once.',
    },
    {
      title: 'Shapes decide what can run',
      text: '`*` needs equal shapes (or shapes NumPy can stretch, which comes in F4). `@` needs the inner numbers to match: (m, n) @ (n, p) gives (m, p). Check shapes before values: most bugs in model code are shape bugs.',
    },
    {
      title: 'Order matters',
      text: '`A @ B` and `B @ A` are different matrices, and often only one of them exists. Element-wise `*` does not care about order.',
    },
    {
      title: 'Why AI is built on it',
      text: 'A layer of neurons is "every neuron takes a weighted sum of all inputs": weights `W` (neurons × inputs) times inputs `x` is exactly `W @ x`. A batch of inputs `X` (batch × inputs) goes through as `X @ W.T`.',
    },
  ],
  rules: [
    '`*`: same shape in, same shape out; cell meets cell.',
    '`@`: (m, n) @ (n, p) → (m, p); inner numbers must match and vanish.',
    '`A @ B` is usually not `B @ A`.',
    '`np.dot` and `np.matmul` do the same as `@` for 2-D arrays; prefer `@`.',
    '"mismatch in its core dimension": the inner numbers of an `@` differ. Print both shapes.',
  ],
  example: {
    code: [
      'W = np.array([[1, 0, 2],',
      '              [0, 1, 1]])',
      'x = np.array([3, 4, 5])',
      'print(W * W)    # cell by cell',
      'print(W @ x)    # 2 weighted sums',
      'print(W.shape, x.shape)',
    ].join('\n'),
    output: '[[1 0 4]\n [0 1 1]]\n[13  9]\n(2, 3) (3,)',
    notes: [
      '`W * W` squares each cell: shape stays (2, 3).',
      '`W @ x`: row 1 is 1·3 + 0·4 + 2·5 = 13, row 2 is 0·3 + 1·4 + 1·5 = 9.',
      '(2, 3) @ (3,) → (2,): one output per row, which is one per neuron.',
    ],
  },
  mistakes: [
    { mistake: 'Using `*` when you meant a weighted sum.', fix: 'If each output should mix a whole row of inputs, you want `@`.' },
    { mistake: 'Multiplying two (2, 3) arrays with `@`.', fix: 'Inner numbers 3 and 2 differ. Transpose one (`B.T`) if that is what the maths means.' },
    { mistake: 'Swapping the order to make shapes fit.', fix: '`B @ A` may run but means something else. Decide which side is which first.' },
    { mistake: 'Reading (2, 3) as 2 columns.', fix: 'Shapes are (rows, columns): (2, 3) is 2 rows of 3.' },
  ],
  forReal:
    'In real code, print `.shape` at every step until the shapes are second nature, and write the expected shape in a comment next to each `@`. PyTorch (unit F9) follows exactly the same rules.',
};
