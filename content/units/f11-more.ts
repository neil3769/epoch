import type { Lesson } from '../schema';

/* F11 lessons 7 to 12: multiple heads, position information, the
 * transformer block, from vectors to next-token scores, generating text,
 * checkpoint. Uses the prelude in f11.ts. */

export const f11More: Lesson[] = [
  // ------------------------------------------------------------------ 7
  {
    id: 'f11-07',
    title: 'Multiple heads',
    summary: 'Several smaller attentions run side by side; their outputs are joined and mixed.',
    card: {
      title: 'Multiple heads',
      text: 'One set of weights can only blend the tokens one way, so a transformer runs several attention heads side by side, each with its own smaller Wq, Wk and Wv. With d = 512 and 8 heads, each head works in 512 / 8 = 64 numbers; the head outputs are joined back to 512 and mixed by one more matrix. One head might track what "it" refers to while another tracks the previous word.',
      code: `d, h = 512, 8
print(d // h)`,
      output: '64',
    },
    exercises: [
      {
        id: 'f11-7-1',
        type: 'predict-output',
        prompt: 'GPT-2 small: d = 768 with 12 heads. Type the size per head.',
        code: `d, h = 768, 12
print(d // h)`,
        answer: '64',
        typedWrong: [{ answer: '9216', why: 'Divide: each head gets a slice of the 768.' }],
        explain: '64 per head is a common choice.',
      },
      {
        id: 'f11-7-2',
        type: 'predict-shape',
        prompt: 'Eight head outputs for 10 tokens, joined side by side. What shape?',
        code: 'heads = [np.ones((10, 64))] * 8',
        target: 'np.concatenate(heads, axis=1)',
        answer: '(10, 512)',
        options: [
          { text: '(10, 512)' },
          { text: '(80, 64)', why: 'axis=1 joins columns, not rows.' },
          { text: '(8, 10, 64)', why: 'concatenate joins along an existing axis.' },
        ],
        explain: 'Back to the model size, one row per token.',
      },
      {
        id: 'f11-7-3',
        type: 'predict-shape',
        prompt: 'Split each token\'s 512 numbers into 8 heads of 64. What shape?',
        code: 'X = np.ones((10, 512))',
        target: 'X.reshape(10, 8, 64)',
        answer: '(10, 8, 64)',
        options: [
          { text: '(10, 8, 64)' },
          { text: '(80, 64)', why: 'reshape gives exactly the shape asked for.' },
          { text: '(10, 512)', why: 'reshape changes the shape.' },
        ],
        explain: 'Same numbers, grouped by head.',
      },
      {
        id: 'f11-7-4',
        type: 'mcq',
        prompt: 'Why run several heads instead of one big one?',
        options: [
          { text: 'To track several relations at once' },
          { text: 'One head would not fit in memory', why: 'Same total size; the gain is variety.' },
          { text: 'Heads remove the need for softmax', why: 'Each head does its own softmax.' },
        ],
        answer: 0,
        explain: 'Each head has its own weights, so it can learn its own pattern.',
      },
      {
        id: 'f11-7-5',
        type: 'run-code',
        prompt: 'Set `heads` to `X` split into 2 heads of 3 numbers each, shape (4, 2, 3).',
        before: 'X = np.arange(24.0).reshape(4, 6)',
        solution: 'heads = X.reshape(4, 2, 3)',
        tests: [
          'assert heads.shape == (4, 2, 3), f"shape {heads.shape}"',
          'assert np.allclose(heads[0, 1], X[0, 3:]), "head 1 of token 0 is its last 3 numbers"',
        ].join('\n'),
        maxLines: 1,
        placeholder: 'heads = ...',
        explain: 'Each token\'s row is cut into equal slices.',
      },
      {
        id: 'f11-7-6',
        type: 'fill-blank',
        prompt: 'Join two head outputs back together.',
        code: `a = np.ones((4, 3))
b = np.zeros((4, 3))
out = np.concatenate([a, b], axis=___)
print(out.shape)`,
        answer: ['1'],
        distractors: [{ text: '0', why: 'That stacks rows: 8 tokens instead of 4.' }],
        expectOutput: '(4, 6)',
        explain: 'Side by side, per token.',
      },
      {
        id: 'f11-7-7',
        type: 'predict-output',
        prompt: 'Do 8 heads of 64 cost more weights than one head of 512?',
        code: `eight = 8 * (512 * 64)
one = 512 * 512
print(eight == one)`,
        answer: 'True',
        typedWrong: [{ answer: 'False', why: '8 × 64 = 512: the same number of weights.' }],
        explain: 'Heads split the work rather than adding to it.',
      },
      {
        id: 'f11-7-8',
        type: 'mcq',
        prompt: 'After the heads are joined, what happens to the result?',
        options: [
          { text: 'One more matrix mixes them' },
          { text: 'Softmax is applied again', why: 'Softmax was inside each head.' },
          { text: 'They are averaged', why: 'They are joined, then multiplied by an output matrix.' },
        ],
        answer: 0,
        explain: 'The output matrix Wo, (512, 512), lets heads combine what they found.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'f11-08',
    title: 'Position information',
    summary: 'Attention ignores order, so a position vector is added to each token\'s embedding.',
    card: {
      title: 'Position information',
      text: 'Attention compares every pair of tokens but never looks at where they sit, so reordering the tokens just reorders the outputs. "Dog bites man" and "man bites dog" would look alike. The fix is to add a position vector to each token\'s embedding before the first block.',
      code: `X = np.array([[1.0, 0.0],
              [0.0, 2.0],
              [1.0, 1.0]])
p = [2, 0, 1]
a = attention(X, X, X)[p]
b = attention(X[p], X[p], X[p])
print(np.allclose(a, b))`,
      output: 'True',
    },
    exercises: [
      {
        id: 'f11-8-1',
        type: 'predict-output',
        prompt: 'Now add a position vector to each row first. Same test: what does this print?',
        code: `X = np.array([[1.0, 0.0],
              [0.0, 2.0],
              [1.0, 1.0]])
P = np.array([[0.0, 0.0],
              [0.5, 0.0],
              [1.0, 0.0]])
p = [2, 0, 1]
A = X + P
B = X[p] + P
a = attention(A, A, A)[p]
b = attention(B, B, B)
print(np.allclose(a, b))`,
        answer: 'False',
        typedWrong: [{ answer: 'True', why: 'Each token now carries its place: moving it changes its vector.' }],
        explain: 'Order now matters to the model.',
      },
      {
        id: 'f11-8-2',
        type: 'mcq',
        prompt: 'Without position information, which pair could a transformer not tell apart?',
        options: [
          { text: '"dog bites man" and "man bites dog"' },
          { text: '"the dog barks" and "dogs bark"', why: 'Different tokens: their embeddings differ.' },
          { text: '"a dog sat" and "the dog sat"', why: 'Different tokens again.' },
        ],
        answer: 0,
        explain: 'Same tokens in a different order look like the same set.',
      },
      {
        id: 'f11-8-3',
        type: 'predict-shape',
        prompt: 'A learned position table for 1,024 positions in a model with d = 768. What shape?',
        code: 'P = np.zeros((1024, 768))',
        target: 'P',
        answer: '(1024, 768)',
        options: [
          { text: '(1024, 768)' },
          { text: '(768, 1024)', why: 'One row per position, like the token table.' },
          { text: '(1024,)', why: 'Each position gets a whole vector, added to the token\'s.' },
        ],
        explain: 'GPT-2 learns one vector per position, just like token embeddings.',
      },
      {
        id: 'f11-8-4',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `tok = np.array([[1.0, 1.0],
                [1.0, 1.0]])
P = np.array([[0.0, 0.1],
              [0.0, 0.2]])
print(tok + P)`,
        answer: '[[1.  1.1]\n [1.  1.2]]',
        options: [
          { text: '[[1.  1.1]\n [1.  1.2]]' },
          { text: '[[1. 1.]\n [1. 1.]]', why: 'The positions are added, so the rows now differ.' },
          { text: '[[0.  0.1]\n [0.  0.2]]', why: 'The token vectors are kept and P is added on top.' },
        ],
        explain: 'The same token at two places now has two different vectors.',
      },
      {
        id: 'f11-8-5',
        type: 'fill-blank',
        prompt: 'Add the vector for each position.',
        code: `E = np.array([[1.0, 0.0],
              [0.0, 1.0]])
P = np.array([[0.0, 0.0],
              [0.0, 0.5]])
ids = [1, 0]
pos = [0, 1]
print((E[ids] + P[___])[1])`,
        answer: ['pos'],
        distractors: [{ text: 'ids', why: 'Ids are not positions: token 0 here sits at position 1.' }],
        expectOutput: '[1.  0.5]',
        explain: 'Positions count 0, 1, 2… whatever the tokens are.',
      },
      {
        id: 'f11-8-6',
        type: 'run-code',
        prompt: 'Set `H` to the token embeddings of `ids` plus the position embeddings for positions 0, 1, 2.',
        before: `E = np.arange(10.0).reshape(5, 2)
P = np.ones((4, 2)) / 10
ids = [3, 1, 3]`,
        solution: 'H = E[ids] + P[:len(ids)]',
        tests: [
          'assert H.shape == (3, 2), f"shape {H.shape}"',
          'assert np.allclose(H[1], E[1] + P[1]), "token 1 gets position 1"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'H = ...',
        explain: 'P[:n] takes the first n position vectors.',
      },
      {
        id: 'f11-8-7',
        type: 'mcq',
        prompt: 'The position table has 1,024 rows. What happens with a 2,000-token input?',
        options: [
          { text: 'No vectors exist past 1,024' },
          { text: 'It wraps around to the start', why: 'Nothing wraps; there is simply no row.' },
          { text: 'Nothing: positions are optional', why: 'Every token needs its position vector.' },
        ],
        answer: 0,
        explain: 'One reason for a context limit. Newer schemes such as RoPE rotate Q and K instead.',
      },
      {
        id: 'f11-8-8',
        type: 'predict-output',
        prompt: 'The same token at positions 0 and 2. Equal vectors?',
        code: `E = np.arange(10.0).reshape(5, 2)
P = np.array([[0., 0.], [1., 1.],
              [2., 2.], [3., 3.]])
H = E[[3, 1, 3]] + P[:3]
print(np.allclose(H[0], H[2]))`,
        answer: 'False',
        typedWrong: [{ answer: 'True', why: 'Same token, but positions 0 and 2 add different vectors.' }],
        explain: 'Now "the" at the start and "the" later are different inputs.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'f11-09',
    title: 'The transformer block',
    summary: 'Attention, then a per-token MLP, each added back to its input and normalised first.',
    card: {
      title: 'The transformer block',
      text: 'A block does two things to the (n, d) array: attention lets tokens share information, then a small two-layer network (an MLP) works on each token alone. Each step\'s output is added to its input (a residual connection), and the input is normalised first to keep numbers in range: x = x + attn(norm(x)), then x = x + mlp(norm(x)). The shape stays (n, d), so blocks stack.',
      code: `x = np.array([[1.0, 3.0]])
print(norm(x).round(3))`,
      output: '[[-1.  1.]]',
    },
    exercises: [
      {
        id: 'f11-9-1',
        type: 'predict-output',
        prompt: 'Normalise one token. What does this print?',
        code: `x = np.array([[2.0, 4.0, 6.0]])
print(norm(x).round(2))`,
        answer: '[[-1.22  0.    1.22]]',
        options: [
          { text: '[[-1.22  0.    1.22]]' },
          { text: '[[0.17 0.33 0.5 ]]', why: 'norm subtracts the mean and divides by the spread; it does not divide by the sum.' },
          { text: '[[2. 4. 6.]]', why: 'The values are centred on 0 and rescaled.' },
        ],
        explain: 'Mean 0, spread 1, per token.',
      },
      {
        id: 'f11-9-2',
        type: 'mcq',
        prompt: 'What does a residual connection, x = x + f(x), give a deep stack of blocks?',
        options: [
          { text: 'A direct path for x' },
          { text: 'Fewer weights to learn', why: 'It adds no weights and removes none.' },
          { text: 'A way to skip softmax', why: 'Attention keeps its softmax.' },
        ],
        answer: 0,
        explain: 'Each block only has to learn a change, and gradients flow back through the additions.',
      },
      {
        id: 'f11-9-3',
        type: 'predict-shape',
        prompt: 'A block takes 10 tokens of size 768. What shape comes out?',
        code: `def block(x):
    x = x + attention(x, x, x)
    return x + np.maximum(0, x)

x = np.ones((10, 768))`,
        target: 'block(x)',
        answer: '(10, 768)',
        options: [
          { text: '(10, 768)' },
          { text: '(10, 10)', why: 'That is attention\'s weight matrix, inside the block.' },
          { text: '(768,)', why: 'Every token keeps its own vector.' },
        ],
        explain: 'Same shape in and out, so the output feeds the next block.',
      },
      {
        id: 'f11-9-4',
        type: 'mcq',
        prompt: 'How does the MLP differ from attention?',
        options: [
          { text: 'It works on each token alone' },
          { text: 'It looks at all tokens at once', why: 'That is attention; the MLP is per token.' },
          { text: 'It has no weights', why: 'It has two weight matrices.' },
        ],
        answer: 0,
        explain: 'Attention moves information between tokens; the MLP processes it within each one.',
      },
      {
        id: 'f11-9-5',
        type: 'predict-output',
        prompt: 'The MLP on the whole array, or on one token alone: same result for that token?',
        code: `W1 = np.array([[1.0, -1.0],
               [2.0, 1.0]])
W2 = np.array([[1.0], [1.0]])

def mlp(x):
    return np.maximum(0, x @ W1) @ W2

x = np.array([[1.0, 2.0],
              [3.0, 0.0]])
print(np.allclose(mlp(x)[1:],
                  mlp(x[1:])))`,
        answer: 'True',
        typedWrong: [{ answer: 'False', why: 'Each row is multiplied on its own: other tokens never mix in.' }],
        explain: 'Row by row: the MLP never mixes tokens.',
      },
      {
        id: 'f11-9-6',
        type: 'run-code',
        prompt: 'Write `block(x)`: add `attend(norm(x))` to `x`, then add `mlp(norm(x))` to the result.',
        before: `def attend(x):
    m = causal(len(x))
    return attention(x, x, x, mask=m)

def mlp(x):
    return np.maximum(0, x) * 0.5`,
        solution: `def block(x):
    x = x + attend(norm(x))
    x = x + mlp(norm(x))
    return x`,
        tests: [
          'x = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]])',
          'y = x + attend(norm(x))',
          'want = y + mlp(norm(y))',
          'assert np.allclose(block(x), want), "attention step first, then the MLP step on its result"',
        ].join('\n'),
        maxLines: 4,
        placeholder: 'def block(x):',
        explain: 'The second step uses the x that came out of the first.',
      },
      {
        id: 'f11-9-7',
        type: 'fill-blank',
        prompt: 'The residual connection.',
        code: `def f(x):
    return 0.5 * x

x = np.array([2.0, 4.0])
x = x ___ f(x)
print(x)`,
        answer: ['+'],
        distractors: [{ text: '*', why: 'The output is added to the input, not multiplied.' }],
        expectOutput: '[3. 6.]',
        explain: 'The input passes through unchanged, plus the change f made.',
      },
      {
        id: 'f11-9-8',
        type: 'mcq',
        prompt: 'GPT-2 small stacks 12 blocks. What differs between them?',
        options: [
          { text: 'Each has its own weights' },
          { text: 'Nothing: they share weights', why: 'Each block learns its own matrices.' },
          { text: 'Their shapes', why: 'Every block maps (n, 768) to (n, 768).' },
        ],
        answer: 0,
        explain: 'Early blocks tend to handle nearby words; later ones more abstract patterns.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 'f11-10',
    title: 'Next-token scores',
    summary: 'The last vector times an output matrix gives a score per vocabulary token; softmax gives probabilities.',
    card: {
      title: 'Next-token scores',
      text: 'After the last block each position has a vector of size d. Multiplying by an output matrix of shape (d, vocabulary size) gives one score, a logit, per token in the vocabulary, and softmax turns the scores into probabilities for the next token. Only the last position is needed to continue the text.',
      code: `h = np.array([1.0, 0.0])
W_out = np.array([[2.0, 0.0, 1.0],
                  [0.0, 1.0, 0.0]])
print(softmax(h @ W_out).round(2))`,
      output: '[0.67 0.09 0.24]',
    },
    exercises: [
      {
        id: 'f11-10-1',
        type: 'predict-shape',
        prompt: '10 positions of size 768, a vocabulary of 50,257 tokens. What shape are the logits?',
        code: `H = np.ones((10, 768))
W_out = np.ones((768, 50257))`,
        target: 'H @ W_out',
        answer: '(10, 50257)',
        options: [
          { text: '(10, 50257)' },
          { text: '(50257,)', why: 'Every position gets its own scores.' },
          { text: '(10, 768)', why: 'W_out turns 768 numbers into one score per token.' },
        ],
        explain: 'One row of scores per position.',
      },
      {
        id: 'f11-10-2',
        type: 'predict-output',
        prompt: 'Which token wins?',
        code: `vocab = ["cat", "dog", "mat"]
z = np.array([0.5, 2.0, 1.0])
print(vocab[np.argmax(z)])`,
        answer: 'dog',
        typedWrong: [{ answer: '1', why: 'argmax gives 1; vocab[1] is the word.' }],
        explain: 'The highest score is the most likely next token.',
      },
      {
        id: 'f11-10-3',
        type: 'mcq',
        prompt: 'To continue the text, why use only the last position\'s scores?',
        options: [
          { text: 'It alone has seen every token' },
          { text: 'The others are always wrong', why: 'They predict tokens already in the text.' },
          { text: 'It has the largest numbers', why: 'Size has nothing to do with it.' },
        ],
        answer: 0,
        explain: 'Position i predicts token i + 1; in training all positions are used at once.',
      },
      {
        id: 'f11-10-4',
        type: 'predict-output',
        prompt: '`next_logits(ids)` stands in for a trained GPT. What comes after "<s> the"?',
        code: `ids = [TOK.index("<s>"),
       TOK.index("the")]
z = next_logits(ids)
print(TOK[np.argmax(z)])`,
        answer: 'cat',
        typedWrong: [{ answer: 'dog', why: 'dog scores 2, cat scores 3.' }],
        explain: 'The most likely token. Lesson 11 turns this into a loop.',
      },
      {
        id: 'f11-10-5',
        type: 'predict-output',
        prompt: 'Type the probability of "cat", rounded to 2 places.',
        code: `ids = [TOK.index("<s>"),
       TOK.index("the")]
p = softmax(next_logits(ids))
print(p[TOK.index("cat")].round(2))`,
        answer: '0.6',
        typedWrong: [{ answer: '1.0', why: 'dog and the other tokens keep some probability.' }],
        explain: 'Scores 3 and 2 and six 0s: e³ / (e³ + e² + 6) ≈ 0.6.',
      },
      {
        id: 'f11-10-6',
        type: 'fill-blank',
        prompt: 'Scores for the next token only.',
        code: `H = np.array([[1.0, 0.0],
              [0.0, 1.0]])
W_out = np.array([[1.0, 0.0],
                  [0.0, 5.0]])
print(H[___] @ W_out)`,
        answer: ['-1'],
        distractors: [{ text: '0', why: 'That is the first position, which predicts the second token.' }],
        expectOutput: '[0. 5.]',
        explain: 'The last row predicts what comes next.',
      },
      {
        id: 'f11-10-7',
        type: 'mcq',
        prompt: 'How does a GPT learn the weights for all of this?',
        options: [
          { text: 'Predicting next tokens in text' },
          { text: 'People label every sentence', why: 'The next token in the text is the label.' },
          { text: 'It copies a dictionary', why: 'It learns patterns from huge amounts of text.' },
        ],
        answer: 0,
        explain: 'Cross-entropy (F6) against the true next token, at every position.',
      },
      {
        id: 'f11-10-8',
        type: 'run-code',
        prompt: 'Set `best` to the most likely next token (a string) after `ids`.',
        before: 'ids = [TOK.index(w) for w in\n       ["the", "cat", "sat"]]',
        solution: 'z = next_logits(ids)\nbest = TOK[int(np.argmax(z))]',
        tests: 'assert best == "on", f"got {best!r}"',
        maxLines: 2,
        placeholder: 'best = ...',
        explain: 'Scores, argmax, look up the token.',
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    id: 'f11-11',
    title: 'Generating text',
    summary: 'A loop: score, pick a token, append, repeat; greedy or sampled with a temperature.',
    card: {
      title: 'Generating text',
      text: 'Generation is a loop: run the model on the tokens so far, pick the next token, append it and repeat, until an end token or a length limit. Greedy decoding always takes the most likely token; sampling draws at random from the probabilities. Each new token costs one more run of the model.',
      code: `ids = [0, 1]
for _ in range(5):
    z = next_logits(ids)
    ids.append(int(np.argmax(z)))
print(" ".join(TOK[i] for i in ids))`,
      output: '<s> the cat sat on the mat',
    },
    exercises: [
      {
        id: 'f11-11-1',
        type: 'predict-output',
        prompt: 'One more step. What does this print?',
        code: `ids = [0, 1]
for _ in range(6):
    z = next_logits(ids)
    ids.append(int(np.argmax(z)))
print(" ".join(TOK[i] for i in ids))`,
        answer: '<s> the cat sat on the mat .',
        typedWrong: [{ answer: '<s> the cat sat on the mat', why: 'Six steps add six tokens: the last is ".".' }],
        explain: 'A real model would stop at an end token.',
      },
      {
        id: 'f11-11-2',
        type: 'mcq',
        prompt: 'When does the generation loop stop?',
        options: [
          { text: 'End token or length limit' },
          { text: 'When the model is unsure', why: 'It always produces some scores.' },
          { text: 'After exactly one sentence', why: 'Only if an end token or limit says so.' },
        ],
        answer: 0,
        explain: 'max_tokens in an API call is that length limit.',
      },
      {
        id: 'f11-11-3',
        type: 'predict-output',
        prompt: 'Temperature 0.5: divide the scores by it. What does this print?',
        code: `z = np.array([2.0, 1.0])
print(softmax(z / 0.5).round(2))`,
        answer: '[0.88 0.12]',
        typedWrong: [{ answer: '[0.73 0.27]', why: 'That is temperature 1; dividing by 0.5 widens the gap.' }],
        explain: 'Low temperature: safer, more predictable choices.',
      },
      {
        id: 'f11-11-4',
        type: 'predict-output',
        prompt: 'Temperature 10. What does this print?',
        code: `z = np.array([2.0, 1.0])
print(softmax(z / 10).round(2))`,
        answer: '[0.52 0.48]',
        typedWrong: [{ answer: '[0.88 0.12]', why: 'A high temperature shrinks the gap: nearly a coin toss.' }],
        explain: 'High temperature: more varied, more surprising, more mistakes.',
      },
      {
        id: 'f11-11-5',
        type: 'fill-blank',
        prompt: 'Apply the temperature.',
        code: `z = np.array([2.0, 1.0])
T = 0.5
print(softmax(z / ___).round(2))`,
        answer: ['T'],
        distractors: [{ text: '1', why: 'That ignores the temperature.' }],
        expectOutput: '[0.88 0.12]',
        explain: 'Divide the scores, then softmax.',
      },
      {
        id: 'f11-11-6',
        type: 'run-code',
        prompt: 'Write `generate(ids, n)`: append the most likely next token `n` times (greedy) and return the list.',
        solution: `def generate(ids, n):
    ids = list(ids)
    for _ in range(n):
        z = next_logits(ids)
        ids.append(int(np.argmax(z)))
    return ids`,
        tests: [
          'out = generate([0, 1], 3)',
          'assert [TOK[i] for i in out] == ["<s>", "the", "cat", "sat", "on"], f"got {[TOK[i] for i in out]}"',
          'start = [0, 1]',
          'generate(start, 2)',
          'assert start == [0, 1], "copy the list instead of changing the caller\'s"',
        ].join('\n'),
        maxLines: 6,
        placeholder: 'def generate(ids, n):',
        explain: 'The whole of text generation, around a model call.',
      },
      {
        id: 'f11-11-7',
        type: 'mcq',
        prompt: 'Why sample at all instead of always taking the top token?',
        options: [
          { text: 'Greedy text gets repetitive' },
          { text: 'Sampling is always more accurate', why: 'For exact answers, greedy is often better.' },
          { text: 'Greedy is slower', why: 'It is just as fast.' },
        ],
        answer: 0,
        explain: 'Low temperature for code and facts, higher for brainstorming.',
      },
      {
        id: 'f11-11-8',
        type: 'mcq',
        prompt: 'Why does a 1,000-token answer take much longer than a 10-token one?',
        options: [
          { text: 'One model run per token' },
          { text: 'Long answers use a bigger model', why: 'Same model; more steps.' },
          { text: 'Tokens are sent in one batch', why: 'Each token depends on the ones before it.' },
        ],
        answer: 0,
        explain: 'Models cache earlier keys and values to make each step cheaper, but steps stay one by one.',
      },
    ],
  },

  // ------------------------------------------------------------------ 12
  {
    id: 'f11-12',
    title: 'Checkpoint: attention and transformers',
    summary: 'Weighted averages, scores, softmax, masks, heads, positions, blocks and generation, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 'f11-12-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `V = np.array([[4.0, 0.0],
              [0.0, 4.0]])
print(np.array([0.75, 0.25]) @ V)`,
        answer: '[3. 1.]',
        typedWrong: [{ answer: '[0.75 0.25]', why: 'The rows are 4s, not 1s.' }],
        explain: 'A weighted average of the rows.',
      },
      {
        id: 'f11-12-2',
        type: 'predict-shape',
        prompt: '6 tokens, size 32. What shape are the attention weights?',
        code: 'Q = K = np.ones((6, 32))',
        target: 'softmax(Q @ K.T)',
        answer: '(6, 6)',
        options: [
          { text: '(6, 6)' },
          { text: '(32, 32)', why: 'One weight per pair of tokens.' },
          { text: '(6, 32)', why: 'That is the output after averaging V.' },
        ],
        explain: 'n × n.',
      },
      {
        id: 'f11-12-3',
        type: 'mcq',
        prompt: 'Which vector decides how much attention a token receives, and which is passed on?',
        options: [
          { text: 'Key decides; value is passed on' },
          { text: 'Value decides; key is passed on', why: 'Scores use keys; outputs average values.' },
          { text: 'Query does both', why: 'The query belongs to the token that is looking.' },
        ],
        answer: 0,
        explain: 'Query · key → weight; weight × value → output.',
      },
      {
        id: 'f11-12-4',
        type: 'predict-output',
        prompt: 'Masked, equal scores. Type token 2\'s weights.',
        code: `S = np.zeros((4, 4))
S = np.where(causal(4), S, -np.inf)
print(softmax(S)[2].round(2))`,
        answer: '[0.33 0.33 0.33 0.  ]',
        typedWrong: [{ answer: '[0.25 0.25 0.25 0.25]', why: 'Token 2 sees tokens 0, 1 and 2 only.' }],
        explain: 'Three visible tokens, a third each.',
      },
      {
        id: 'f11-12-5',
        type: 'mcq',
        prompt: 'Scores of 40 and 10 come out of 1,600-number vectors. What does √d do here?',
        options: [
          { text: 'Shrinks them to 1 and 0.25' },
          { text: 'Nothing: they are already small', why: '40 against 10 makes softmax all-or-nothing.' },
          { text: 'Makes them add up to 1', why: 'Softmax does that afterwards.' },
        ],
        answer: 0,
        explain: '√1600 = 40.',
      },
      {
        id: 'f11-12-6',
        type: 'predict-output',
        prompt: 'Type the size per head.',
        code: 'print(1024 // 16)',
        answer: '64',
        typedWrong: [{ answer: '16384', why: 'd is split across heads: divide.' }],
        explain: '16 heads of 64.',
      },
      {
        id: 'f11-12-7',
        type: 'mcq',
        prompt: 'What breaks if you remove the position embeddings?',
        options: [
          { text: 'Word order is lost' },
          { text: 'Attention stops working', why: 'It works; it just ignores order.' },
          { text: 'The vocabulary shrinks', why: 'The vocabulary is unchanged.' },
        ],
        answer: 0,
        explain: 'Attention alone treats the input as a set.',
      },
      {
        id: 'f11-12-8',
        type: 'fill-blank',
        prompt: 'The first half of a block.',
        code: `x = np.array([[1.0, 3.0]])
y = x ___ norm(x)
print(y.round(2))`,
        answer: ['+'],
        distractors: [{ text: '-', why: 'The residual adds the step\'s output to its input.' }],
        expectOutput: '[[0. 4.]]',
        explain: 'Here norm stands in for the attention step: x + f(norm(x)).',
      },
      {
        id: 'f11-12-9',
        type: 'run-code',
        prompt: 'Set `text` to the greedy continuation of "<s> the dog" for 3 more tokens, as one string with spaces.',
        before: 'ids = [0, 1, TOK.index("dog")]',
        solution: `for _ in range(3):
    z = next_logits(ids)
    ids.append(int(np.argmax(z)))
text = " ".join(TOK[i] for i in ids)`,
        tests: 'assert text == "<s> the dog sat on the", f"got {text!r}"',
        maxLines: 5,
        placeholder: 'for _ in range(3):',
        explain: 'Score, pick, append, three times.',
      },
      {
        id: 'f11-12-10',
        type: 'mcq',
        prompt: 'A chatbot gives the same dull answer every time. Which setting would you raise?',
        options: [
          { text: 'Temperature' },
          { text: 'max_tokens', why: 'That only allows longer answers.' },
          { text: 'The number of heads', why: 'That is fixed when the model is trained.' },
        ],
        answer: 0,
        explain: 'Higher temperature flattens the probabilities: more varied output.',
      },
    ],
  },
];
