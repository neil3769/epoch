import type { LibraryPage } from '../schema';

/** Unit F2 summary page: unlocked in the Library when the unit is finished. */
export const f2Library: LibraryPage = {
  unit: 'F2',
  ideas: [
    {
      title: 'A vector is a list of numbers with meaning',
      text: 'Each position always means the same thing, such as [price, rooms, floor]. Vectors can be compared or combined only when their positions mean the same things in the same order. Words, images and users all become vectors (embeddings) in AI.',
    },
    {
      title: 'Add and scale, position by position',
      text: '`a + b` adds matching positions (same length required); `k * a` scales every position, keeping the direction (a negative k flips it). Use NumPy arrays: for plain lists `+` joins and `*` repeats. A gradient step is scale-then-subtract: `w - lr * grad`.',
    },
    {
      title: 'The dot product is a weighted sum',
      text: 'Multiply matching positions and add: `a @ b`, one number. Prices times quantities is a bill; weights times inputs is a neuron. 0 means the vectors share no direction.',
    },
    {
      title: 'Length and direction',
      text: 'Length is √(sum of squares) = `np.linalg.norm(v)` = `np.sqrt(v @ v)`; the distance between points is the length of their difference. Dividing by the length gives a unit vector: direction only. The zero vector has no direction, so check before dividing.',
    },
    {
      title: 'Cosine similarity',
      text: 'cos(a, b) = (a @ b) / (|a| |b|): 1 same direction, 0 unrelated, −1 opposite, whatever the lengths. Normalise all vectors once, and similarity is one dot product; a whole collection is scored with one matrix product. Return nothing when the best score is below a floor.',
    },
  ],
  rules: [
    'Same length and same meaning per position, or the maths is meaningless.',
    'Vector maths on NumPy arrays, not plain lists.',
    '`a * b` is pairs; `a @ b` is their sum.',
    '|v| = np.linalg.norm(v); distance = norm(b - a).',
    'cos = (a @ b) / (norm(a) * norm(b)).',
    'Normalise rows with `axis=1, keepdims=True`.',
  ],
  example: {
    code: [
      'docs = np.array([[3.0, 0.0, 1.0],',
      '                 [0.0, 2.0, 2.0],',
      '                 [6.0, 1.5, 1.0]])',
      'q = np.array([1.0, 0.0, 0.3])',
      '',
      'n = np.linalg.norm(docs, axis=1,',
      '                   keepdims=True)',
      'U = docs / n',
      'u = q / np.linalg.norm(q)',
      'scores = U @ u',
      'print(np.round(scores, 2))',
      'print(np.argsort(-scores)[:2])',
    ].join('\n'),
    output: '[1.   0.2  0.96]\n[0 2]',
    notes: [
      'Each row is a document vector; the query points mostly along the first feature.',
      'Rows are normalised once, so one matrix-vector product gives every cosine score.',
      'Documents 0 and 2 win; document 2 is longer, but cosine ignores length.',
    ],
  },
  mistakes: [
    { mistake: 'Adding plain lists.', fix: 'They join; convert to NumPy arrays first.' },
    { mistake: 'Confusing `*` with `@`.', fix: '`*` keeps pairs separate; `@` sums them into one number.' },
    { mistake: 'Summing before squaring for length.', fix: 'Square first: `np.sqrt((v ** 2).sum())`.' },
    { mistake: 'Ranking by raw dot product.', fix: 'Normalise, or longer vectors win just for being long.' },
    { mistake: 'Normalising the zero vector.', fix: 'Its length is 0; check before dividing.' },
  ],
  forReal:
    'Vectors are everywhere from here on: matrices are stacks of them (F3), gradients are vectors (F5), and embeddings plus cosine similarity are the core of retrieval (F10 and E6).',
};
