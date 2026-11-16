import type { Lab } from '../schema';

/*
 * Unit F11 labs. Lab 1: attention by hand, with scaffolding (scaled scores,
 * row softmax, attention, causal attention). Lab 2, from empty functions:
 * a tiny GPT forward pass with random weights (embed + positions, causal
 * self-attention, a block, next-token choice) and a greedy generation loop
 * around the prelude's stand-in model.
 */
const TINY = [
  'rng = np.random.default_rng(0)',
  'd, n_tok = 4, len(TOK)',
  'E = rng.normal(size=(n_tok, d))',
  'P = rng.normal(size=(16, d)) * 0.1',
  'Wq, Wk, Wv = rng.normal(',
  '    size=(3, d, d))',
  'W1 = rng.normal(size=(d, 8))',
  'W2 = rng.normal(size=(8, d))',
  'W_out = rng.normal(size=(d, n_tok))',
  '',
  'def mlp(x):',
  '    return np.maximum(0, x @ W1) @ W2',
].join('\n');

export const f11Labs: Lab[] = [
  {
    id: 'f11-lab-1',
    title: 'Attention by hand',
    intro: 'Build attention from its parts: scaled scores, a softmax along each row, the weighted average, and the causal mask.',
    summary: 'You built scaled dot-product attention and its causal version.',
    minutes: 12,
    unlockAfter: 'f11-06',
    steps: [
      {
        goal: 'Finish `scores(Q, K)`: `Q @ K.T` divided by √d, where d is the size of each query.',
        starter: 'def scores(Q, K):\n    d = Q.shape[-1]\n    return Q @ K.T / np.sqrt(___)',
        solution: 'def scores(Q, K):\n    d = Q.shape[-1]\n    return Q @ K.T / np.sqrt(d)',
        tests: [
          'Q = np.array([[2.0, 0.0, 0.0, 0.0]])',
          'K = np.array([[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]])',
          'assert np.allclose(scores(Q, K), [[1.0, 0.0]]), f"2 / √4 = 1; got {scores(Q, K)}"',
        ].join('\n'),
        hints: ['d is already computed: take its square root.', 'def scores(Q, K):\n    d = Q.shape[-1]\n    return Q @ K.T / np.sqrt(___)'],
      },
      {
        goal: 'Finish `row_softmax(S)`: softmax along each row, after subtracting each row\'s largest value.',
        starter: 'def row_softmax(S):\n    m = S.max(axis=1, keepdims=True)\n    e = np.exp(S - m)\n    return e / e.sum(axis=___,\n                     keepdims=True)',
        solution: 'def row_softmax(S):\n    m = S.max(axis=1, keepdims=True)\n    e = np.exp(S - m)\n    return e / e.sum(axis=1,\n                     keepdims=True)',
        tests: [
          'W = row_softmax(np.array([[0.0, 0.0], [1000.0, 0.0]]))',
          'assert np.allclose(W, [[0.5, 0.5], [1.0, 0.0]]), f"got {W}"',
        ].join('\n'),
        hints: ['Each row must add to 1, so sum along axis 1.', 'def row_softmax(S):\n    m = S.max(axis=1, keepdims=True)\n    e = np.exp(S - m)\n    return e / e.sum(axis=___,\n                     keepdims=True)'],
        explain: 'Subtracting the maximum stops exp(1000) from overflowing.',
      },
      {
        goal: 'Finish `attend(Q, K, V)`: the weights from `row_softmax(scores(Q, K))`, times `V`.',
        starter: 'def attend(Q, K, V):\n    W = row_softmax(scores(Q, K))\n    return W @ ___',
        solution: 'def attend(Q, K, V):\n    W = row_softmax(scores(Q, K))\n    return W @ V',
        tests: [
          'X = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])',
          'assert np.allclose(attend(X, X, X), attention(X, X, X)), "should match the prelude\'s attention"',
        ].join('\n'),
        hints: ['The weights average the values.', 'def attend(Q, K, V):\n    W = row_softmax(scores(Q, K))\n    return W @ ___'],
      },
      {
        goal: 'Finish `causal_attend(Q, K, V)`: like `attend`, but scores above the diagonal become minus infinity first.',
        starter: 'def causal_attend(Q, K, V):\n    S = scores(Q, K)\n    m = causal(len(Q))\n    S = np.where(m, S, ___)\n    return row_softmax(S) @ V',
        solution: 'def causal_attend(Q, K, V):\n    S = scores(Q, K)\n    m = causal(len(Q))\n    S = np.where(m, S, -np.inf)\n    return row_softmax(S) @ V',
        tests: [
          'X = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])',
          'out = causal_attend(X, X, X)',
          'assert np.allclose(out[0], X[0]), "token 0 sees only itself"',
          'assert np.allclose(out, attention(X, X, X, mask=causal(3))), "should match masked attention"',
        ].join('\n'),
        hints: ['Masked scores must get zero weight.', 'def causal_attend(Q, K, V):\n    S = scores(Q, K)\n    m = causal(len(Q))\n    S = np.where(m, S, ___)\n    return row_softmax(S) @ V'],
        explain: 'This is the attention inside every GPT.',
      },
    ],
  },
  {
    id: 'f11-lab-2',
    title: 'A tiny GPT, end to end',
    intro: 'Wire up a whole (untrained, random) GPT forward pass in 4-number vectors, each piece from an empty function, then write the generation loop around the stand-in model.',
    summary: 'You built a GPT forward pass and a generation loop from scratch.',
    minutes: 20,
    unlockAfter: 'f11-11',
    given: TINY,
    steps: [
      {
        goal: 'Write `embed(ids)`: the rows of `E` for the ids plus the first `len(ids)` rows of `P`.',
        starter: 'def embed(ids):\n    pass',
        solution: 'def embed(ids):\n    n = len(ids)\n    return E[ids] + P[:n]',
        tests: [
          'h = embed([1, 2, 1])',
          'assert h.shape == (3, d), f"shape {h.shape}"',
          'assert np.allclose(h[0], E[1] + P[0]) and np.allclose(h[2], E[1] + P[2]), "token row plus position row"',
        ].join('\n'),
        hints: ['Look up the token rows, add the position rows.', 'def embed(ids):\n    n = len(ids)\n    return E[ids] + P[:___]'],
      },
      {
        goal: 'Write `self_attn(x)`: causal attention with `Q = x @ Wq`, `K = x @ Wk`, `V = x @ Wv`.',
        starter: 'def self_attn(x):\n    pass',
        solution: 'def self_attn(x):\n    Q, K = x @ Wq, x @ Wk\n    V = x @ Wv\n    m = causal(len(x))\n    return attention(Q, K, V, mask=m)',
        tests: [
          'x = embed([0, 1, 2])',
          'want = attention(x @ Wq, x @ Wk, x @ Wv, mask=causal(3))',
          'assert np.allclose(self_attn(x), want), "project with Wq, Wk, Wv, then masked attention"',
        ].join('\n'),
        hints: [
          'Three projections, a causal mask, then attention.',
          'def self_attn(x):\n    Q, K = x @ Wq, x @ Wk\n    V = x @ Wv\n    m = causal(len(x))\n    return attention(Q, K, V,\n                     mask=___)',
        ],
      },
      {
        goal: 'Write `block(x)`: `x + self_attn(norm(x))`, then add `mlp(norm(...))` of that result.',
        starter: 'def block(x):\n    pass',
        solution: 'def block(x):\n    x = x + self_attn(norm(x))\n    x = x + mlp(norm(x))\n    return x',
        tests: [
          'x = embed([0, 1, 2])',
          'y = x + self_attn(norm(x))',
          'assert np.allclose(block(x), y + mlp(norm(y))), "attention step, then MLP step, each added back"',
          'assert block(x).shape == x.shape, "shape is kept"',
        ].join('\n'),
        hints: ['Two residual steps, each normalising first.', 'def block(x):\n    x = x + self_attn(norm(x))\n    x = x + mlp(norm(___))\n    return x'],
      },
      {
        goal: 'Write `next_id(ids)`: run `embed`, then `block`, take the last row, multiply by `W_out`, and return the index of the highest score as an int.',
        starter: 'def next_id(ids):\n    pass',
        solution: 'def next_id(ids):\n    h = block(embed(ids))\n    z = h[-1] @ W_out\n    return int(np.argmax(z))',
        tests: [
          'ids = [0, 1, 2]',
          'want = int(np.argmax(block(embed(ids))[-1] @ W_out))',
          'assert next_id(ids) == want, f"expected {want}, got {next_id(ids)}"',
          'assert isinstance(next_id(ids), int), "return a plain int"',
        ].join('\n'),
        hints: ['Only the last position predicts the next token.', 'def next_id(ids):\n    h = block(embed(ids))\n    z = h[___] @ W_out\n    return int(np.argmax(z))'],
        explain: 'Untrained, so its choice is random; training would tune every matrix above.',
      },
      {
        goal: 'Write `generate(words, n)`: start from the list of words, append the greedy choice of the stand-in `next_logits` `n` times, and return the words joined with spaces.',
        starter: 'def generate(words, n):\n    pass',
        solution: 'def generate(words, n):\n    ids = [TOK.index(w)\n           for w in words]\n    for _ in range(n):\n        z = next_logits(ids)\n        ids.append(int(np.argmax(z)))\n    out = [TOK[i] for i in ids]\n    return " ".join(out)',
        tests: [
          'got = generate(["<s>", "the"], 5)',
          'assert got == "<s> the cat sat on the mat", f"got {got!r}"',
        ].join('\n'),
        hints: [
          'Words to ids, loop, ids back to words.',
          'def generate(words, n):\n    ids = [TOK.index(w)\n           for w in words]\n    for _ in range(n):\n        z = next_logits(ids)\n        ids.append(int(np.argmax(z)))\n    out = [TOK[i] for i in ___]\n    return " ".join(out)',
        ],
        explain: 'Swap next_logits for next_id and you generate from your own (untrained) GPT.',
      },
    ],
  },
];
