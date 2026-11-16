import type { LibraryPage } from '../schema';

/** Unit F11 summary page: unlocked in the Library when the unit is finished. */
export const f11Library: LibraryPage = {
  unit: 'F11',
  ideas: [
    {
      title: 'Attention',
      text: 'Each token builds a new vector as a weighted average of value vectors. The weights are softmax of query · key scores divided by √d: softmax(Q Kᵀ / √d) V. In self-attention Q, K and V are the same tokens times three learned matrices.',
    },
    {
      title: 'Masks, heads, positions',
      text: 'A GPT masks later tokens (score −∞, weight 0) so it cannot see the answer. Several heads attend in smaller slices side by side and are joined and mixed. Attention ignores order, so a position vector is added to each embedding.',
    },
    {
      title: 'The block',
      text: 'x = x + attn(norm(x)); x = x + mlp(norm(x)). Attention moves information between tokens, the MLP works on each token, residual additions keep a path through the stack. Shape in = shape out, so blocks stack.',
    },
    {
      title: 'Generation',
      text: 'The last position times an output matrix gives one score per vocabulary token; softmax gives probabilities. Generation loops: score, pick (greedy or sampled with a temperature), append, until an end token or a length limit.',
    },
  ],
  rules: [
    'attention = softmax(Q Kᵀ / √d) V.',
    'Weights are (n, n); output follows V.',
    'Causal mask: −∞ above the diagonal.',
    'Head size = d / heads.',
    'Add position vectors before the first block.',
    'Block: x + attn(norm(x)), then x + mlp(norm(x)).',
    'Next token from the last row only.',
    'Temperature: divide scores before softmax.',
  ],
  example: {
    code: [
      'X = np.array([[1.0, 0.0],',
      '              [0.0, 1.0],',
      '              [1.0, 1.0]])',
      'd = X.shape[1]',
      'S = X @ X.T / np.sqrt(d)',
      'S = np.where(causal(3), S, -np.inf)',
      'out = softmax(S) @ X',
      'print(out[0], out.shape)',
    ].join('\n'),
    output: '[1. 0.] (3, 2)',
    notes: [
      'Scores for every pair, scaled by √d.',
      'The mask hides later tokens.',
      'Token 0 can only attend to itself.',
    ],
  },
  mistakes: [
    { mistake: 'Softmax along the wrong axis.', fix: 'Each row (one token\'s weights) sums to 1.' },
    { mistake: 'Forgetting the √d scale.', fix: 'Divide scores by √d before softmax.' },
    { mistake: 'Masking with 0 instead of −∞.', fix: 'A score of 0 still gets weight.' },
    { mistake: 'Using all rows to pick the next token.', fix: 'Only the last row.' },
    { mistake: 'Thinking more heads means more weights.', fix: 'Heads split d; the total stays d × d.' },
  ],
  forReal:
    'The app\'s matrices are tiny and the language model is a lookup table. For real: read the GPT-2 forward pass in a short from-scratch implementation such as Andrej Karpathy\'s nanoGPT (its model.py is a few hundred lines) and match each piece to this unit; then load GPT-2 small with the Hugging Face transformers library, generate text at temperatures 0.2 and 1.2, and print the attention weights of one head for a sentence of your own.',
};
