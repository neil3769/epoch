import { f11Labs } from '../labs/f11';
import { f11Library } from '../library/f11';
import type { Lesson, Unit } from '../schema';
import { f11More } from './f11-more';

/*
 * F11 Attention and transformers. Lessons 1-6 here: a weighted average of
 * vectors, scores from dot products, softmax and the √d scale, attention in
 * one line, self-attention (Q, K, V from X), the causal mask. Lessons 7-12
 * in f11-more.ts: heads, positions, the block, next-token scores,
 * generation, checkpoint.
 *
 * The prelude gives softmax (row-wise, stable), causal(n), attention(Q, K,
 * V, mask), norm (layer norm without learned scale), step (as in E11), and
 * a stand-in language model: next_logits(ids) scores the next token in TOK
 * from the last two tokens. It is a lookup table, not a transformer; the
 * generation loop around it is the real thing.
 */
const PRELUDE = `import numpy as np

def softmax(x, axis=-1):
    x = np.asarray(x, dtype=float)
    e = np.exp(x - x.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def causal(n):
    return np.tril(np.ones((n, n), dtype=bool))

def attention(Q, K, V, mask=None):
    S = Q @ K.T / np.sqrt(Q.shape[-1])
    if mask is not None:
        S = np.where(mask, S, -np.inf)
    return softmax(S) @ V

def norm(x):
    m = x.mean(axis=-1, keepdims=True)
    s = x.std(axis=-1, keepdims=True)
    return (x - m) / (s + 1e-5)

def step(name, *inputs):
    return f"{name}({', '.join(inputs)})"

TOK = ["<s>", "the", "cat", "dog", "sat", "on", "mat", "."]
_NEXT = {("<s>", "the"): "cat", ("the", "cat"): "sat",
         ("the", "dog"): "sat", ("cat", "sat"): "on",
         ("dog", "sat"): "on", ("sat", "on"): "the",
         ("on", "the"): "mat", ("the", "mat"): "."}

def next_logits(ids):
    z = np.zeros(len(TOK))
    key = tuple(TOK[i] for i in ids[-2:])
    nxt = _NEXT.get(key, ".")
    z[TOK.index(nxt)] = 3.0
    if nxt == "cat":
        z[TOK.index("dog")] = 2.0
    return z`;

const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f11-01',
    title: 'A weighted average',
    summary: 'Attention builds each token\'s new vector as a weighted average of other tokens\' vectors.',
    card: {
      title: 'A weighted average',
      text: 'In "the cat sat because it was tired", the word "it" needs information from "cat". Attention lets each token build a new vector as a weighted average of the tokens\' vectors, with weights that add up to 1. Weights `w` times the rows of `V` is just `w @ V`.',
      code: `V = np.array([[1.0, 0.0],
              [0.0, 1.0]])
w = np.array([0.75, 0.25])
print(w @ V)`,
      output: '[0.75 0.25]',
    },
    exercises: [
      {
        id: 'f11-1-1',
        type: 'predict-output',
        prompt: 'Equal weights. What does this print?',
        code: `V = np.array([[1.0, 0.0],
              [0.0, 1.0]])
w = np.array([0.5, 0.5])
print(w @ V)`,
        answer: '[0.5 0.5]',
        typedWrong: [{ answer: '1.0', why: 'A weighted average of rows is a row, not a number.' }],
        explain: 'Half of each row.',
      },
      {
        id: 'f11-1-2',
        type: 'predict-output',
        prompt: 'All the weight on one row. What does this print?',
        code: `V = np.array([[1.0, 0.0],
              [0.0, 1.0]])
w = np.array([0.0, 1.0])
print(w @ V)`,
        answer: '[0. 1.]',
        options: [
          { text: '[0. 1.]' },
          { text: '[1. 0.]', why: 'Weight 1 is on the second row.' },
          { text: '[0. 0.]', why: 'The second row comes through whole.' },
        ],
        explain: 'Weight 1 on a row copies it.',
      },
      {
        id: 'f11-1-3',
        type: 'predict-output',
        prompt: 'Three rows. Type the result.',
        code: `V = np.array([[2.0, 0.0],
              [0.0, 2.0],
              [1.0, 1.0]])
w = np.array([0.5, 0.25, 0.25])
print(w @ V)`,
        answer: '[1.25 0.75]',
        typedWrong: [{ answer: '[1. 1.]', why: 'The first row has twice the weight of the others.' }],
        explain: '0.5 × 2 + 0.25 × 1 = 1.25; 0.25 × 2 + 0.25 × 1 = 0.75.',
      },
      {
        id: 'f11-1-4',
        type: 'mcq',
        prompt: 'In "the cat sat because it was tired", which token should "it" weight most?',
        options: [
          { text: 'cat' },
          { text: 'sat', why: 'Nothing sits; "it" refers to a thing.' },
          { text: 'the', why: 'Small words carry little meaning of their own.' },
        ],
        answer: 0,
        explain: 'A trained model learns weights like this from data.',
      },
      {
        id: 'f11-1-5',
        type: 'fill-blank',
        prompt: 'The weighted average of the rows.',
        code: `V = np.array([[4.0, 0.0],
              [0.0, 4.0]])
w = np.array([0.25, 0.75])
print(w ___ V)`,
        answer: ['@'],
        distractors: [{ text: '*', why: 'That scales column by column and keeps both rows.' }],
        expectOutput: '[1. 3.]',
        explain: '@ multiplies and adds down the rows: a weighted sum.',
      },
      {
        id: 'f11-1-6',
        type: 'mcq',
        prompt: 'Why must the weights add up to 1?',
        options: [
          { text: 'So the result stays a blend' },
          { text: 'So the result is always 1', why: 'The result is a vector, a mix of the rows.' },
          { text: 'NumPy needs it for @', why: '@ works with any numbers.' },
        ],
        answer: 0,
        explain: 'With weights summing to 1 the output stays on the same scale as the inputs.',
      },
      {
        id: 'f11-1-7',
        type: 'run-code',
        prompt: 'Set `out` to the average of the rows of `V` weighted by `w`.',
        before: `V = np.array([[1.0, 2.0],
              [3.0, 0.0],
              [0.0, 1.0]])
w = np.array([0.2, 0.3, 0.5])`,
        solution: 'out = w @ V',
        tests: 'assert np.allclose(out, [1.1, 0.9]), f"got {out}"',
        maxLines: 1,
        placeholder: 'out = ...',
        explain: '0.2 + 0.9 + 0 = 1.1; 0.4 + 0 + 0.5 = 0.9.',
      },
      {
        id: 'f11-1-8',
        type: 'predict-shape',
        prompt: 'Weights for 3 tokens, each with a 4-number vector. What shape comes out?',
        code: `w = np.ones(3) / 3
V = np.ones((3, 4))`,
        target: 'w @ V',
        answer: '(4,)',
        options: [
          { text: '(4,)' },
          { text: '(3,)', why: 'The 3 tokens are averaged away.' },
          { text: '(3, 4)', why: 'One blended row comes out.' },
        ],
        explain: 'One new vector, the same size as each token\'s.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f11-02',
    title: 'Scores from dot products',
    summary: 'A query dotted with each key scores how well they match; Q @ K.T gives all scores at once.',
    card: {
      title: 'Scores from dot products',
      text: 'The weights come from scores. Each token has a query vector (what it looks for) and a key vector (what it offers), and the dot product of a query with a key scores how well they match. All scores at once are `Q @ K.T`: row i holds token i\'s scores for every token.',
      code: `q = np.array([1.0, 0.0])
K = np.array([[2.0, 0.0],
              [0.0, 3.0],
              [1.0, 1.0]])
print(K @ q)`,
      output: '[2. 0. 1.]',
    },
    exercises: [
      {
        id: 'f11-2-1',
        type: 'predict-output',
        prompt: 'A different query. What does this print?',
        code: `q = np.array([0.0, 1.0])
K = np.array([[2.0, 0.0],
              [0.0, 3.0],
              [1.0, 1.0]])
print(K @ q)`,
        answer: '[0. 3. 1.]',
        typedWrong: [{ answer: '[2. 0. 1.]', why: 'That was the query [1, 0]; this one picks the second column.' }],
        explain: 'The query [0, 1] reads each key\'s second number.',
      },
      {
        id: 'f11-2-2',
        type: 'predict-output',
        prompt: 'Which key matches the query best? Type its index.',
        code: `q = np.array([1.0, 1.0])
K = np.array([[2.0, 0.0],
              [0.0, 3.0],
              [1.0, 1.0]])
print(np.argmax(K @ q))`,
        answer: '1',
        typedWrong: [{ answer: '0', why: 'Scores are 2, 3 and 2: key 1 wins.' }],
        explain: 'The highest score will get the most weight.',
      },
      {
        id: 'f11-2-3',
        type: 'predict-shape',
        prompt: '4 tokens, vectors of size 8. What shape are the scores?',
        code: `Q = np.ones((4, 8))
K = np.ones((4, 8))`,
        target: 'Q @ K.T',
        answer: '(4, 4)',
        options: [
          { text: '(4, 4)' },
          { text: '(8, 8)', why: '(4, 8) @ (8, 4): the 8s are summed away.' },
          { text: '(4, 8)', why: 'One score per pair of tokens.' },
        ],
        explain: 'Every token scores every token.',
      },
      {
        id: 'f11-2-4',
        type: 'mcq',
        prompt: 'In the score matrix `S = Q @ K.T`, what is `S[i, j]`?',
        options: [
          { text: 'How well query i matches key j' },
          { text: 'How well key i matches key j', why: 'Rows come from queries, columns from keys.' },
          { text: 'The distance from token i to j', why: 'Position plays no part in the score.' },
        ],
        answer: 0,
        explain: 'Row i: everything token i is looking at.',
      },
      {
        id: 'f11-2-5',
        type: 'fill-blank',
        prompt: 'All the scores at once.',
        code: `Q = np.array([[1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0]])
K = Q.copy()
S = Q @ ___
print(S.shape)`,
        answer: ['K.T'],
        distractors: [{ text: 'K', why: '(3, 2) @ (3, 2): the inner numbers do not match.' }],
        expectOutput: '(3, 3)',
        explain: 'Transpose the keys so each column is one key.',
      },
      {
        id: 'f11-2-6',
        type: 'predict-output',
        prompt: 'Queries and keys are the same here. What does this print?',
        code: `X = np.array([[1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0]])
print(X @ X.T)`,
        answer: '[[1. 0. 1.]\n [0. 1. 1.]\n [1. 1. 2.]]',
        options: [
          { text: '[[1. 0. 1.]\n [0. 1. 1.]\n [1. 1. 2.]]' },
          { text: '[[1. 0.]\n [0. 1.]]', why: 'Three tokens give a 3 × 3 matrix.' },
          { text: '[[2. 1.]\n [1. 2.]]', why: 'That is X.T @ X, (2, 2).' },
        ],
        explain: 'The third token, [1, 1], overlaps with both others.',
      },
      {
        id: 'f11-2-7',
        type: 'run-code',
        prompt: 'Set `S` to the score matrix for queries `Q` and keys `K`.',
        before: `Q = np.array([[1.0, 2.0],
              [0.0, 1.0]])
K = np.array([[1.0, 0.0],
              [1.0, 1.0]])`,
        solution: 'S = Q @ K.T',
        tests: 'assert np.allclose(S, [[1, 3], [0, 1]]), f"got {S}"',
        maxLines: 1,
        placeholder: 'S = ...',
        explain: 'Row 0: [1, 2]·[1, 0] = 1 and [1, 2]·[1, 1] = 3.',
      },
      {
        id: 'f11-2-8',
        type: 'mcq',
        prompt: 'Why give each token a separate query and key, instead of one vector for both?',
        options: [
          { text: 'What it seeks is not what it offers' },
          { text: 'It halves the computing work', why: 'Two vectors are more work, not less.' },
          { text: 'Keys must be longer than queries', why: 'They have the same length, so they can be dotted.' },
        ],
        answer: 0,
        explain: '"it" looks for a noun; "cat" offers being a noun. Different roles, different vectors.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'f11-03',
    title: 'Softmax and the √d scale',
    summary: 'Softmax turns scores into weights that sum to 1; dividing by √d stops one score taking everything.',
    card: {
      title: 'Softmax and the √d scale',
      text: 'Scores can be any numbers, but weights must be positive and add up to 1: softmax does that, as in F6. Before softmax the scores are divided by √d, where d is the vector size. Without it, long vectors give huge scores and softmax puts nearly all the weight on one token.',
      code: `s = np.array([2.0, 0.0, 1.0])
w = softmax(s)
print(w.round(2), w.sum().round(6))`,
      output: '[0.67 0.09 0.24] 1.0',
    },
    exercises: [
      {
        id: 'f11-3-1',
        type: 'predict-output',
        prompt: 'Equal scores. What does this print?',
        code: 'w = softmax([1.0, 1.0, 1.0])\nprint(w.round(2))',
        answer: '[0.33 0.33 0.33]',
        typedWrong: [{ answer: '[1. 1. 1.]', why: 'Weights add up to 1: a third each.' }],
        explain: 'Equal scores, equal weights.',
      },
      {
        id: 'f11-3-2',
        type: 'predict-output',
        prompt: 'One big gap. What does this print?',
        code: 'print(softmax([10.0, 0.0]).round(3))',
        answer: '[1. 0.]',
        options: [
          { text: '[1. 0.]' },
          { text: '[0.909 0.091]', why: 'Softmax uses e to the score: e¹⁰ dwarfs e⁰.' },
          { text: '[10. 0.]', why: 'Softmax outputs add up to 1.' },
        ],
        explain: 'A gap of 10 already sends all the weight to one token.',
      },
      {
        id: 'f11-3-3',
        type: 'predict-output',
        prompt: 'Scores from 64-number vectors, scaled. What does this print?',
        code: `s = np.array([16.0, 8.0])
print(s / np.sqrt(64))`,
        answer: '[2. 1.]',
        typedWrong: [{ answer: '[0.25 0.125]', why: 'Divide by the square root of 64, which is 8.' }],
        explain: 'Smaller gaps keep softmax from going all-or-nothing.',
      },
      {
        id: 'f11-3-4',
        type: 'mcq',
        prompt: 'Why divide the scores by √d?',
        options: [
          { text: 'Long vectors give big scores' },
          { text: 'To make the weights add to 1', why: 'Softmax already does that.' },
          { text: 'To make every score positive', why: 'Dividing by a positive number keeps the sign.' },
        ],
        answer: 0,
        explain: 'Dot products grow with d; huge gaps make softmax nearly one-hot and training stalls.',
      },
      {
        id: 'f11-3-5',
        type: 'predict-output',
        prompt: 'Shift every score by 100. Do the weights change?',
        code: `a = softmax([1.0, 2.0])
b = softmax([101.0, 102.0])
print(np.allclose(a, b))`,
        answer: 'True',
        typedWrong: [{ answer: 'False', why: 'Softmax depends only on the gaps between scores.' }],
        explain: 'Only differences matter; the prelude\'s softmax subtracts the largest score for that reason.',
      },
      {
        id: 'f11-3-6',
        type: 'fill-blank',
        prompt: 'One set of weights per row: each row should add up to 1.',
        code: `S = np.array([[1.0, 0.0],
              [0.0, 3.0]])
W = softmax(S, axis=___)
print(W.sum(axis=1).round(6))`,
        answer: ['1'],
        distractors: [{ text: '0', why: 'axis=0 makes each column add to 1, not each row.' }],
        expectOutput: '[1. 1.]',
        explain: 'Row i holds token i\'s weights.',
      },
      {
        id: 'f11-3-7',
        type: 'run-code',
        prompt: 'Set `W` to the attention weights: scale `S` by √`d`, then softmax along each row.',
        before: `S = np.array([[2.0, 0.0],
              [0.0, 2.0]])
d = 4`,
        solution: 'W = softmax(S / np.sqrt(d), axis=1)',
        tests: [
          'assert W.shape == (2, 2), f"shape {W.shape}"',
          'assert np.allclose(W[0], softmax([1.0, 0.0])), f"row 0 should be softmax([1, 0]); got {W[0]}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'W = ...',
        explain: '√4 = 2, so the scores become [1, 0] and [0, 1].',
      },
      {
        id: 'f11-3-8',
        type: 'mcq',
        prompt: 'Can a token get exactly zero weight from softmax?',
        options: [
          { text: 'Only with a score of minus infinity' },
          { text: 'Yes, with a score of 0', why: 'e⁰ = 1: a score of 0 still gets weight.' },
          { text: 'Yes, with any negative score', why: 'e to a negative number is small but positive.' },
        ],
        answer: 0,
        explain: 'Lesson 6 uses exactly that trick to hide tokens.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'f11-04',
    title: 'Attention in one line',
    summary: 'softmax(Q K.T / √d) V: scores, scale, weights, weighted average.',
    card: {
      title: 'Attention in one line',
      text: 'Put the pieces together: scores `Q @ K.T`, divided by √d, softmax along each row, then the weights average the value vectors `V`. That is attention, softmax(Q Kᵀ / √d) V, and the prelude\'s `attention(Q, K, V)` computes it. With n tokens the weights are (n, n) and the output has one new vector per token.',
      code: `Q = K = V = np.eye(2)
print(attention(Q, K, V).round(2))`,
      output: '[[0.67 0.33]\n [0.33 0.67]]',
    },
    exercises: [
      {
        id: 'f11-4-1',
        type: 'predict-shape',
        prompt: '5 tokens, vectors of size 8. What shape is the output?',
        code: 'Q = K = V = np.ones((5, 8))',
        target: 'attention(Q, K, V)',
        answer: '(5, 8)',
        options: [
          { text: '(5, 8)' },
          { text: '(5, 5)', why: 'Those are the weights; they then average V.' },
          { text: '(8,)', why: 'Each of the 5 tokens gets its own new vector.' },
        ],
        explain: '(5, 5) weights @ (5, 8) values.',
      },
      {
        id: 'f11-4-2',
        type: 'order-lines',
        prompt: 'Put attention in order.',
        lines: [
          { text: 'Q = K = V = np.eye(2); d = 2', fixed: true },
          { text: 'S = Q @ K.T' },
          { text: 'S = S / np.sqrt(d)' },
          { text: 'W = softmax(S)' },
          { text: 'out = W @ V' },
          { text: 'print(out.round(2))', fixed: true },
        ],
        expectOutput: '[[0.67 0.33]\n [0.33 0.67]]',
        explain: 'Score, scale, softmax, average.',
      },
      {
        id: 'f11-4-3',
        type: 'predict-output',
        prompt: 'Every token looks the same to every query. What is the first output row?',
        code: `Q = K = np.ones((3, 2))
V = np.array([[3.0, 0.0],
              [0.0, 3.0],
              [0.0, 0.0]])
print(attention(Q, K, V)[0])`,
        answer: '[1. 1.]',
        typedWrong: [{ answer: '[3. 0.]', why: 'Equal scores give equal weights: the mean of all three rows.' }],
        explain: 'Equal scores, a plain average.',
      },
      {
        id: 'f11-4-4',
        type: 'run-code',
        prompt: 'Write `attn(Q, K, V)` yourself, without the prelude\'s `attention`.',
        solution: `def attn(Q, K, V):
    d = Q.shape[-1]
    S = Q @ K.T / np.sqrt(d)
    return softmax(S, axis=1) @ V`,
        tests: [
          'X = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])',
          'assert np.allclose(attn(X, X, X), attention(X, X, X)), "should match attention()"',
        ].join('\n'),
        maxLines: 4,
        placeholder: 'def attn(Q, K, V):',
        explain: 'Three lines that sit at the heart of every transformer.',
      },
      {
        id: 'f11-4-5',
        type: 'mcq',
        prompt: 'What do the value vectors `V` hold?',
        options: [
          { text: 'What each token passes on' },
          { text: 'What each token looks for', why: 'That is the query.' },
          { text: 'The attention weights', why: 'The weights come from Q and K; they average V.' },
        ],
        answer: 0,
        explain: 'Keys decide who gets attention; values are what gets mixed.',
      },
      {
        id: 'f11-4-6',
        type: 'fill-blank',
        prompt: 'Average the right vectors.',
        code: `Q = K = np.eye(2)
V = np.array([[2.0, 0.0],
              [0.0, 0.0]])
W = softmax(Q @ K.T / np.sqrt(2))
print((W @ ___).round(2))`,
        answer: ['V'],
        distractors: [{ text: 'K', why: 'Keys are only for scoring; the values are what is averaged.' }],
        expectOutput: '[[1.34 0.  ]\n [0.66 0.  ]]',
        explain: 'Weights from Q and K, average of V.',
      },
      {
        id: 'f11-4-7',
        type: 'mcq',
        prompt: 'Doubling the text length multiplies the size of the weight matrix by…',
        options: [
          { text: '4' },
          { text: '2', why: 'It is n × n: both sides double.' },
          { text: '1: it stays the same', why: 'Every token scores every token.' },
        ],
        answer: 0,
        explain: 'Attention costs grow with the square of the length: one reason context windows have limits.',
      },
      {
        id: 'f11-4-8',
        type: 'predict-output',
        prompt: 'Rows of the weight matrix. What does this print?',
        code: `X = np.array([[1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0]])
W = softmax(X @ X.T / np.sqrt(2))
print(W.sum(axis=1).round(6))`,
        answer: '[1. 1. 1.]',
        typedWrong: [{ answer: '[3. 3. 3.]', why: 'Each row is one token\'s weights: they add up to 1.' }],
        explain: 'One set of weights per token.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'f11-05',
    title: 'Self-attention',
    summary: 'Q, K and V all come from the same tokens through three learned weight matrices.',
    card: {
      title: 'Self-attention',
      text: 'In self-attention the queries, keys and values all come from the same tokens: `Q = X @ Wq`, `K = X @ Wk`, `V = X @ Wv`. The three weight matrices are learned, so the model learns what to look for, what to offer and what to pass on. Every token attends to every token in the text, itself included.',
      code: `X = np.array([[1.0, 0.0],
              [0.0, 1.0]])
Wq = np.array([[0.0, 1.0],
               [1.0, 0.0]])
print(X @ Wq)`,
      output: '[[0. 1.]\n [1. 0.]]',
    },
    exercises: [
      {
        id: 'f11-5-1',
        type: 'predict-shape',
        prompt: '4 tokens of size 16, projected to queries of size 8. What shape?',
        code: `X = np.ones((4, 16))
Wq = np.ones((16, 8))`,
        target: 'X @ Wq',
        answer: '(4, 8)',
        options: [
          { text: '(4, 8)' },
          { text: '(16, 8)', why: 'One query per token: 4 rows.' },
          { text: '(4, 16)', why: 'Wq turns 16 numbers into 8.' },
        ],
        explain: 'Each token\'s 16 numbers become an 8-number query.',
      },
      {
        id: 'f11-5-2',
        type: 'mcq',
        prompt: 'Who sets the numbers in Wq, Wk and Wv?',
        options: [
          { text: 'Training' },
          { text: 'The programmer', why: 'They are weights, learned like any others.' },
          { text: 'The input text', why: 'The text gives X; the matrices are fixed after training.' },
        ],
        answer: 0,
        explain: 'Backpropagation adjusts them so the attention patterns help predict the next token.',
      },
      {
        id: 'f11-5-3',
        type: 'predict-output',
        prompt: 'Three matrices of shape (512, 64). How many learned numbers in total?',
        code: 'print(3 * 512 * 64)',
        answer: '98304',
        typedWrong: [{ answer: '32768', why: 'That is one matrix; there are three.' }],
        explain: 'Per attention head, per layer.',
      },
      {
        id: 'f11-5-4',
        type: 'run-code',
        prompt: 'Set `out` to the self-attention output for `X` with the weights given.',
        before: `X = np.array([[1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0]])
Wq = np.eye(2)
Wk = np.array([[1.0, 1.0],
               [0.0, 1.0]])
Wv = 2 * np.eye(2)`,
        solution: 'Q, K = X @ Wq, X @ Wk\nV = X @ Wv\nout = attention(Q, K, V)',
        tests: [
          'want = attention(X @ Wq, X @ Wk, X @ Wv)',
          'assert out.shape == (3, 2), f"shape {out.shape}"',
          'assert np.allclose(out, want), "Q, K and V each use their own matrix"',
        ].join('\n'),
        maxLines: 4,
        placeholder: 'out = ...',
        explain: 'Project three times, then attend.',
      },
      {
        id: 'f11-5-5',
        type: 'mcq',
        prompt: 'What does "self" mean in self-attention?',
        options: [
          { text: 'Q, K and V come from one text' },
          { text: 'Each token attends only to itself', why: 'It attends to all tokens, itself included.' },
          { text: 'The model trains itself', why: 'It is about where Q, K and V come from.' },
        ],
        answer: 0,
        explain: 'In cross-attention, used in translation, the keys and values come from another text.',
      },
      {
        id: 'f11-5-6',
        type: 'predict-output',
        prompt: 'With identity weights, how much does token 0 attend to itself?',
        code: `X = np.array([[3.0, 0.0],
              [0.0, 3.0]])
S = X @ X.T / np.sqrt(2)
print(softmax(S)[0].round(2))`,
        answer: '[1. 0.]',
        typedWrong: [{ answer: '[0.5 0.5]', why: 'Scores are 6.4 for itself and 0 for the other: almost all weight on itself.' }],
        explain: 'Learned Wq and Wk are what let tokens look past themselves.',
      },
      {
        id: 'f11-5-7',
        type: 'fill-blank',
        prompt: 'Keys come from their own matrix.',
        code: `X = np.eye(2)
Wq = np.eye(2)
Wk = np.array([[0.0, 1.0],
               [1.0, 0.0]])
K = X @ ___
print(K[0])`,
        answer: ['Wk'],
        distractors: [{ text: 'Wq', why: 'Each of Q, K and V has its own matrix.' }],
        expectOutput: '[0. 1.]',
        explain: 'Separate matrices let queries and keys differ.',
      },
      {
        id: 'f11-5-8',
        type: 'predict-shape',
        prompt: 'Queries and keys of size 16, values of size 32, 10 tokens. What shape comes out?',
        code: `Q = K = np.ones((10, 16))
V = np.ones((10, 32))`,
        target: 'attention(Q, K, V)',
        answer: '(10, 32)',
        options: [
          { text: '(10, 32)' },
          { text: '(10, 16)', why: 'The output averages V, whose rows have 32 numbers.' },
          { text: '(10, 10)', why: 'Those are the weights.' },
        ],
        explain: 'Output size follows V.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'f11-06',
    title: 'The causal mask',
    summary: 'A GPT must not see later tokens: their scores become minus infinity before softmax.',
    card: {
      title: 'The causal mask',
      text: 'A GPT-style model learns to predict the next token, so token i must not see the tokens after it. Before softmax, the scores for later tokens are set to minus infinity, which softmax turns into weight 0. The allowed pairs form a lower triangle, which `causal(n)` builds.',
      code: 'print(causal(3))',
      output: '[[ True False False]\n [ True  True False]\n [ True  True  True]]',
    },
    exercises: [
      {
        id: 'f11-6-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: 'print(softmax([1.0, -np.inf]))',
        answer: '[1. 0.]',
        typedWrong: [{ answer: '[0.5 0.5]', why: 'e to minus infinity is 0.' }],
        explain: 'Minus infinity means "no weight at all".',
      },
      {
        id: 'f11-6-2',
        type: 'predict-output',
        prompt: 'Equal scores, masked. Type token 1\'s weights.',
        code: `S = np.zeros((3, 3))
S = np.where(causal(3), S, -np.inf)
print(softmax(S)[1])`,
        answer: '[0.5 0.5 0. ]',
        typedWrong: [{ answer: '[0.33 0.33 0.33]', why: 'Token 1 cannot see token 2: it splits between 0 and 1.' }],
        explain: 'Token 0 sees only itself; token 2 sees all three.',
      },
      {
        id: 'f11-6-3',
        type: 'mcq',
        prompt: 'Why mask while training a model to predict the next token?',
        options: [
          { text: 'Otherwise it reads the answer' },
          { text: 'To make training faster', why: 'It costs the same; it stops cheating.' },
          { text: 'To save memory on the GPU', why: 'The weight matrix is the same size.' },
        ],
        answer: 0,
        explain: 'Without the mask, token i could look at token i + 1, the very thing it must predict.',
      },
      {
        id: 'f11-6-4',
        type: 'predict-output',
        prompt: 'How many (token, token) pairs are allowed with 4 tokens?',
        code: 'print(causal(4).sum())',
        answer: '10',
        typedWrong: [{ answer: '16', why: 'Only the lower triangle with its diagonal: 1 + 2 + 3 + 4.' }],
        explain: 'Token i sees i + 1 tokens.',
      },
      {
        id: 'f11-6-5',
        type: 'fill-blank',
        prompt: 'Hide the future.',
        code: `S = np.zeros((3, 3))
S = np.where(causal(3), S, ___)
print(softmax(S)[0])`,
        answer: ['-np.inf'],
        distractors: [{ text: '0', why: 'A score of 0 still gets weight: token 0 would see the future.' }],
        expectOutput: '[1. 0. 0.]',
        explain: 'Token 0 attends only to itself.',
      },
      {
        id: 'f11-6-6',
        type: 'run-code',
        prompt: 'Set `out` to causal self-attention of `X` with itself as queries, keys and values.',
        before: `X = np.array([[1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0]])`,
        solution: 'm = causal(len(X))\nout = attention(X, X, X, mask=m)',
        tests: [
          'assert np.allclose(out[0], X[0]), f"token 0 sees only itself; got {out[0]}"',
          'assert not np.allclose(out, attention(X, X, X)), "use the mask"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'out = ...',
        explain: 'causal(len(X)) gives the triangle for any length.',
      },
      {
        id: 'f11-6-7',
        type: 'predict-output',
        prompt: 'With the mask, does the first token\'s output change if the last token changes?',
        code: `X = np.array([[1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0]])
Y = X.copy()
Y[2] = [9.0, 9.0]
m = causal(3)
a = attention(X, X, X, mask=m)
b = attention(Y, Y, Y, mask=m)
print(np.allclose(a[0], b[0]))`,
        answer: 'True',
        typedWrong: [{ answer: 'False', why: 'Token 0 cannot see token 2, so changing it changes nothing for token 0.' }],
        explain: 'Earlier outputs never depend on later tokens: that is what lets a GPT generate left to right.',
      },
      {
        id: 'f11-6-8',
        type: 'mcq',
        prompt: 'BERT-style models read the whole text to classify it or tag it. Do they need the causal mask?',
        options: [
          { text: 'No: they may see both sides' },
          { text: 'Yes: every transformer does', why: 'Only models that generate left to right need it.' },
          { text: 'Yes, but reversed', why: 'They use no mask; each token sees all others.' },
        ],
        answer: 0,
        explain: 'Encoders see everything; decoders (GPT) see only the past.',
      },
    ],
  },
];

export const f11: Unit = {
  id: 'F11',
  track: 'foundations',
  title: 'Attention and transformers',
  blurb: 'Attention as dot products plus softmax, self-attention, the causal mask, multiple heads, position information, the transformer block, and how a GPT-style model generates text.',
  prelude: PRELUDE,
  lessons: [...lessons, ...f11More],
  labs: f11Labs,
  library: f11Library,
};
