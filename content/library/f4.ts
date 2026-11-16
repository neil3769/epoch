import type { LibraryPage } from '../schema';

/** Unit F4 summary page: unlocked in the Library when the unit is finished. */
export const f4Library: LibraryPage = {
  unit: 'F4',
  ideas: [
    {
      title: 'An array is one block of same-typed numbers',
      text: 'Make one with `np.array(list)`, `np.zeros(shape)`, `np.ones(shape)` or `np.arange(n)`. Its `shape` has one size per dimension, so (2, 3) is 2 rows of 3, and (3,) is 1-D, which is not (1, 3). Every item shares one `dtype`; mixing ints and floats gives floats, writing a float into an int array cuts it, and `astype` converts.',
    },
    {
      title: 'Indexing, slicing, views and masks',
      text: '`a[i]`, `a[-1]` and `a[start:stop:step]` work as for lists; in 2-D, `M[i, j]`, `M[i]` (a row) and `M[:, j]` (a column). A slice is a view that shares memory, so writing to it writes to the original: use `.copy()`. A comparison gives a mask of True and False; `a[mask]` keeps the True items, `mask.sum()` counts them and `mask.mean()` gives the fraction.',
    },
    {
      title: 'Element-wise maths and reductions',
      text: 'Operators and NumPy functions (`np.sqrt`, `np.exp`, `np.maximum`) act on every item and keep the shape. `sum`, `mean`, `max` and `argmax` reduce; `axis=k` names the dimension that disappears, so `axis=0` gives one result per column and `axis=1` one per row.',
    },
    {
      title: 'Reshape and broadcasting',
      text: '`reshape` lays the same numbers out in a new shape, row by row, with `-1` for "work it out"; `.T` swaps rows and columns. Broadcasting compares shapes from the right: sizes must be equal or 1, and a 1 is stretched by copying. Per-column work broadcasts naturally; per-row work needs `keepdims=True` so results come back as a column.',
    },
    {
      title: 'Replace the loop',
      text: 'Say what a loop does to one item, then write that once for the whole array: it runs in compiled code, often 10 to 100 times faster. For a batch, `X @ w` gives every row\'s weighted sum and `X * w` scales every row.',
    },
  ],
  rules: [
    'Check `.shape` before anything else.',
    '(3,) is not (1, 3) and not (3, 1).',
    'A slice is a view: `.copy()` before changing it.',
    'Masks: `(a > 2) & (a < 9)`, brackets on each.',
    '`axis=0` collapses rows: one result per column.',
    'Per-row maths: `keepdims=True`.',
    'Shapes broadcast from the right: equal or 1.',
  ],
  example: {
    code: [
      'X = np.array([[1.0, 200.0],',
      '              [2.0, 300.0],',
      '              [3.0, 400.0]])',
      'mu = X.mean(axis=0)',
      'Z = X - mu',
      'print(mu)',
      'print(Z.shape, Z[:, 1])',
      'print((Z[:, 1] > 0).sum())',
    ].join('\n'),
    output: '[  2. 300.]\n(3, 2) [-100.    0.  100.]\n1',
    notes: [
      'Three examples (rows), two features (columns) with very different scales.',
      '`axis=0` gives one mean per feature, shape (2,), which broadcasts across the rows.',
      'Every column of Z now averages 0; a mask counts the examples above average.',
    ],
  },
  mistakes: [
    { mistake: '`np.zeros(2, 3)`.', fix: 'The shape is one tuple: `np.zeros((2, 3))`.' },
    { mistake: 'Changing a slice and expecting the original to stay put.', fix: 'Slices are views; take `.copy()` first.' },
    { mistake: '`a > 2 & a < 9` or `and` on arrays.', fix: '`(a > 2) & (a < 9)`.' },
    { mistake: 'Mixing up `axis=0` and `axis=1`.', fix: 'The axis you name is the one that disappears.' },
    { mistake: 'Dividing rows by `X.sum(axis=1)`.', fix: 'Use `keepdims=True`; on square arrays the bug gives no error, just wrong numbers.' },
    { mistake: '`math.sqrt` or `max` on an array.', fix: 'Use `np.sqrt` and `np.maximum`.' },
    { mistake: 'Doing maths on `uint8` pixels.', fix: 'They wrap past 255; convert with `astype(float)` first.' },
  ],
  forReal:
    'Fluency comes from using NumPy on real data: load a CSV with `np.loadtxt` or pandas, check shapes at every step, and rewrite one of your own loops as an array expression. Every later Foundations unit (gradients, ML from scratch, neural networks) is written in this NumPy, and PyTorch tensors (F9) behave the same way.',
};
