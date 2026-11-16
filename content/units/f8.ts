import { f8Labs } from '../labs/f8';
import { f8Library } from '../library/f8';
import type { Lesson, Unit } from '../schema';
import { f8More } from './f8-more';

/*
 * F8 Neural networks. A neuron, activations, a layer as one matrix multiply
 * (the neuron figure), a batch through a layer, stacking layers, why the
 * activation matters; then (f8-more) the forward pass in code, the loss,
 * backpropagation on a tiny network, through a linear layer and through
 * ReLU, and training a two-layer network in NumPy. Every numeric answer is
 * executed. Weights are stored as PyTorch stores them: one row per neuron,
 * so a layer is X @ W.T + b.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f8-01',
    title: 'A neuron',
    summary: 'A neuron multiplies inputs by weights, adds them, and adds a bias: w @ x + b.',
    card: {
      title: 'A neuron',
      text: 'A neuron multiplies each input by its own weight, adds the results, and adds a bias. That weighted sum is a dot product: `w @ x + b`. Tap the neuron to see its sum.',
      figure: { kind: 'neuron', x: [2, 1, 3], W: [[0.5, -1, 1]], b: [0.5], act: 'none' },
      code: `x = np.array([2.0, 1.0, 3.0])
w = np.array([0.5, -1.0, 1.0])
b = 0.5
print(w @ x + b)`,
      output: '3.5',
    },
    exercises: [
      {
        id: 'f8-1-1',
        type: 'predict-output',
        prompt: 'Type what the neuron outputs.',
        code: `x = np.array([1.0, 2.0])
w = np.array([3.0, -1.0])
b = 1.0
print(w @ x + b)`,
        answer: '2.0',
        typedWrong: [
          { answer: '1.0', why: 'Add the bias: 3 − 2 = 1, plus 1.' },
          { answer: '[3. -2.]', why: '`@` adds the products up into one number.' },
        ],
        explain: '1×3 + 2×(−1) + 1 = 2.',
      },
      {
        id: 'f8-1-2',
        type: 'mcq',
        prompt: 'What does the bias do?',
        options: [
          { text: 'Shifts the sum, whatever the inputs' },
          { text: 'Scales every input by the same amount', why: 'Scaling is the weights\' job; the bias is added once.' },
          { text: 'Chooses which of the inputs count most', why: 'The weights do that: a zero weight ignores an input.' },
        ],
        answer: 0,
        explain: 'With all inputs at 0, the neuron outputs its bias.',
      },
      {
        id: 'f8-1-3',
        type: 'figure',
        prompt: 'Change the second weight until the neuron outputs 3.',
        figure: { kind: 'neuron', x: [2, 1], W: [[1, -1]], b: [0], act: 'none', editable: [[0, 1]], goal: { neuron: 0, output: 3 } },
        explain: '2×1 + 1×w = 3 needs w = 1.',
      },
      {
        id: 'f8-1-4',
        type: 'fill-blank',
        prompt: 'Compute the neuron\'s weighted sum.',
        code: `x = np.array([1.0, 2.0])
w = np.array([2.0, 1.0])
b = 0.0
z = w ___ x + b
print(z)`,
        answer: ['@'],
        distractors: [
          { text: '*', why: 'That multiplies pair by pair but never adds up: two numbers, not one.' },
          { text: '+', why: 'Inputs are scaled by weights, not added to them.' },
        ],
        expectOutput: '4.0',
        explain: '`@` multiplies pairs and sums them: 2 + 2.',
      },
      {
        id: 'f8-1-5',
        type: 'predict-output',
        prompt: 'One weight is 0. What does this print?',
        code: `x = np.array([5.0, 7.0])
w = np.array([0.0, 1.0])
b = -2.0
print(w @ x + b)`,
        answer: '5.0',
        options: [
          { text: '5.0' },
          { text: '10.0', why: 'The first input is multiplied by 0, so it adds nothing.' },
          { text: '7.0', why: 'Remember the bias, −2.' },
        ],
        explain: 'A zero weight makes the neuron ignore that input.',
      },
      {
        id: 'f8-1-6',
        type: 'mcq',
        prompt: 'A neuron reads 4 inputs. How many numbers does it learn?',
        options: [
          { text: '5: four weights and a bias' },
          { text: '4: one weight per input', why: 'It also learns a bias.' },
          { text: '1: a single weight', why: 'Each input gets its own weight.' },
        ],
        answer: 0,
        explain: 'One weight per input, plus one bias.',
      },
      {
        id: 'f8-1-7',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `x = np.array([1.0, 2.0, 3.0])
w = np.array([0.5, 0.5])
b = 1.0
print(w @ x + b)`,
        error: 'ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0...',
        answer: 1,
        raiseLine: 3,
        lineWhy: {
          '0': 'Three inputs is fine.',
          '2': 'One bias per neuron is right.',
          '3': 'The sum is right, once there is a weight per input.',
        },
        explain: 'Three inputs need three weights.',
      },
      {
        id: 'f8-1-8',
        type: 'run-code',
        prompt: 'Set `z` to the neuron\'s weighted sum plus its bias.',
        before: `x = np.array([4.0, 1.0])
w = np.array([0.5, 3.0])
b = -1.0`,
        solution: 'z = w @ x + b',
        tests: 'assert abs(z - 4) < 1e-9, f"0.5×4 + 3×1 − 1 = 4; got {z}"',
        placeholder: 'z = ...',
        explain: 'Dot product, plus bias.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f8-02',
    title: 'Activation functions',
    summary: 'After the sum, a neuron applies an activation: ReLU keeps positives, sigmoid squashes to 0..1.',
    card: {
      title: 'Activation functions',
      text: 'After its sum, a neuron applies an activation function. ReLU keeps positive values and turns negative ones into 0: `np.maximum(0, z)`. Sigmoid, `1 / (1 + np.exp(-z))`, squashes any number into the range 0 to 1.',
      code: `z = np.array([-2.0, 0.0, 3.0])
print(np.maximum(0, z))`,
      output: '[0. 0. 3.]',
    },
    exercises: [
      {
        id: 'f8-2-1',
        type: 'predict-output',
        prompt: 'What does ReLU give?',
        code: `z = np.array([-1.5, 2.0, -0.1])
print(np.maximum(0, z))`,
        answer: '[0. 2. 0.]',
        options: [
          { text: '[0. 2. 0.]' },
          { text: '[1.5 2.  0.1]', why: 'That is the absolute value; ReLU sets negatives to 0.' },
          { text: '2.0', why: '`np.maximum` compares each value with 0; `np.max` would give one number.' },
        ],
        explain: 'Negatives become 0; positives stay.',
      },
      {
        id: 'f8-2-2',
        type: 'predict-output',
        prompt: 'Type the sigmoid of 0.',
        code: 'print(1 / (1 + np.exp(-0.0)))',
        answer: '0.5',
        typedWrong: [
          { answer: '0.0', why: 'exp(0) is 1, so it is 1 / (1 + 1).' },
          { answer: '1.0', why: 'exp(0) is 1, so it is 1 / 2.' },
        ],
        explain: 'Sigmoid is 0.5 at 0: halfway between 0 and 1.',
      },
      {
        id: 'f8-2-3',
        type: 'figure',
        prompt: 'This ReLU neuron outputs 0. Raise the first weight until it outputs 2.',
        figure: { kind: 'neuron', x: [1, 2], W: [[-1, -1]], b: [0], act: 'relu', editable: [[0, 0]], goal: { neuron: 0, output: 2 } },
        explain: 'The sum is w − 2; ReLU passes it once it is positive, so w = 4.',
      },
      {
        id: 'f8-2-4',
        type: 'mcq',
        prompt: 'A neuron should output a probability. Which activation?',
        options: [
          { text: 'Sigmoid' },
          { text: 'ReLU', why: 'ReLU can output any positive number, such as 7.' },
          { text: 'No activation', why: 'A raw sum can be negative or above 1.' },
        ],
        answer: 0,
        explain: 'Sigmoid for a yes/no probability; ReLU inside the network.',
      },
      {
        id: 'f8-2-5',
        type: 'fill-blank',
        prompt: 'Write ReLU.',
        code: `def relu(z):
    return np.___(0, z)

print(relu(np.array([-1.0, 3.0])))`,
        answer: ['maximum'],
        distractors: [
          { text: 'max', why: '`np.max(0, z)` reads z as an axis: it fails. `np.maximum` compares element by element.' },
          { text: 'minimum', why: 'That keeps negatives and caps positives at 0: the opposite.' },
        ],
        expectOutput: '[0. 3.]',
        explain: '`np.maximum(0, z)` compares each value with 0.',
      },
      {
        id: 'f8-2-6',
        type: 'predict-output',
        prompt: 'Sigmoid of very negative, zero and very positive values. What does this print?',
        code: `z = np.array([-10.0, 0.0, 10.0])
s = 1 / (1 + np.exp(-z))
print(s.round(3))`,
        answer: '[0.  0.5 1. ]',
        options: [
          { text: '[0.  0.5 1. ]' },
          { text: '[-1.  0.  1.]', why: 'Sigmoid never goes below 0.' },
          { text: '[ 0.  0. 10.]', why: 'That is ReLU.' },
        ],
        explain: 'Far below 0 it is nearly 0, far above nearly 1.',
      },
      {
        id: 'f8-2-7',
        type: 'match-pairs',
        prompt: 'Match each call to its value.',
        setup: `def relu(z):
    return np.maximum(0, z)
def sig(z):
    return 1 / (1 + np.exp(-z))`,
        pairs: [
          { left: 'relu(-3.0)', right: '0.0', why: 'Negative in, 0 out.' },
          { left: 'relu(2.5)', right: '2.5', why: 'Positive values pass unchanged.' },
          { left: 'sig(0.0)', right: '0.5', why: 'Sigmoid is halfway at 0.' },
        ],
        verify: 'equal',
        explain: 'Two activations, two jobs.',
      },
      {
        id: 'f8-2-8',
        type: 'run-code',
        prompt: 'Set `a` to the ReLU of `z`.',
        before: 'z = np.array([-4.0, 0.5, 2.0])',
        solution: 'a = np.maximum(0, z)',
        tests: 'assert np.allclose(a, [0, 0.5, 2]), f"negatives become 0; got {a}"',
        placeholder: 'a = ...',
        explain: 'Element by element against 0.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'f8-03',
    title: 'A layer is a matrix multiply',
    summary: 'A layer is several neurons on the same inputs; their weights are the rows of W, so the layer is W @ x + b.',
    card: {
      title: 'A layer is a matrix multiply',
      text: 'A layer is several neurons reading the same inputs, each with its own weights and bias. Put each neuron\'s weights in a row of a matrix W, and the whole layer is `W @ x + b`: one matrix multiply. Tap a neuron, then find its row in W.',
      figure: { kind: 'neuron', x: [1, 2], W: [[1, 0], [0.5, -1], [-1, 1]], b: [0, 1, 0], act: 'relu', matrix: true },
    },
    exercises: [
      {
        id: 'f8-3-1',
        type: 'figure',
        prompt: 'Work it out from W, x and b: tap the neuron whose ReLU output is 0.',
        figure: { kind: 'neuron', x: [2, 1], W: [[1, 1], [-1, 0.5], [0.5, 0.5]], b: [0, 0, 0], act: 'relu', matrix: true, goal: { tap: 1 } },
        explain: 'Row 2: −1×2 + 0.5×1 = −1.5, and ReLU makes it 0.',
      },
      {
        id: 'f8-3-2',
        type: 'predict-shape',
        prompt: 'A layer of 4 neurons on 3 inputs. Shape of `W @ x`?',
        code: `W = np.zeros((4, 3))
x = np.zeros(3)`,
        target: 'W @ x',
        answer: '(4,)',
        options: [
          { text: '(4,)' },
          { text: '(3,)', why: 'One output per neuron, and there are 4 neurons.' },
          { text: '(4, 3)', why: '`@` sums over the 3 inputs, leaving one number per neuron.' },
        ],
        explain: 'One sum per neuron.',
      },
      {
        id: 'f8-3-3',
        type: 'predict-output',
        prompt: 'A layer of two neurons. What does this print?',
        code: `x = np.array([1.0, 2.0])
W = np.array([[1.0, 1.0],
              [2.0, -1.0]])
b = np.array([0.0, 1.0])
print(W @ x + b)`,
        answer: '[3. 1.]',
        options: [
          { text: '[3. 1.]' },
          { text: '[3. 0.]', why: 'The second neuron\'s bias is 1: 2 − 2 + 1.' },
          { text: '[5. 0.]', why: 'That pairs x with the columns (W.T @ x); each neuron is a row.' },
        ],
        explain: 'Row 1: 1 + 2 = 3. Row 2: 2 − 2 + 1 = 1.',
      },
      {
        id: 'f8-3-4',
        type: 'mcq',
        prompt: 'A layer has 5 neurons reading 3 inputs. What is the shape of W?',
        options: [
          { text: '(5, 3)' },
          { text: '(3, 5)', why: 'Each neuron is a row of W, so there are 5 rows of 3 weights.' },
          { text: '(5,)', why: 'That is the shape of b: one bias per neuron.' },
        ],
        answer: 0,
        explain: '(neurons, inputs): PyTorch stores layer weights this way too.',
      },
      {
        id: 'f8-3-5',
        type: 'number-grid',
        prompt: 'Three neurons, x written as a column. Fill in each neuron\'s sum, W @ x.',
        inputs: [
          { name: 'W', value: [[1, 2], [0, 1], [3, -1]] },
          { name: 'x', value: [[2], [1]] },
        ],
        expr: 'W @ x',
        answer: [[4], [1], [5]],
        explain: 'Each row of W against the column x: 2 + 2, 0 + 1, 6 − 1.',
      },
      {
        id: 'f8-3-6',
        type: 'fill-blank',
        prompt: 'Compute only the second neuron\'s sum.',
        code: `x = np.array([1.0, 1.0])
W = np.array([[1.0, 2.0],
              [3.0, 4.0]])
print(W[___] @ x)`,
        answer: ['1'],
        distractors: [
          { text: '0', why: 'Index 0 is the first neuron.' },
          { text: ':, 1', why: 'That is the second column: one input\'s weights across neurons.' },
        ],
        expectOutput: '7.0',
        explain: 'Neuron 2 is row 1 of W: 3 + 4.',
      },
      {
        id: 'f8-3-7',
        type: 'spot-bug',
        prompt: 'Two neurons on three inputs. Which line is wrong?',
        code: `x = np.array([1.0, 2.0, 3.0])
W = np.ones((3, 2))
b = np.zeros(2)
z = W @ x + b`,
        error: 'ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0...',
        answer: 1,
        raiseLine: 3,
        lineWhy: {
          '0': 'Three inputs, as described.',
          '2': 'Two neurons, two biases: right.',
          '3': 'This is the layer, once W has the right shape.',
        },
        explain: 'Two neurons need W of shape (2, 3): one row per neuron.',
      },
      {
        id: 'f8-3-8',
        type: 'run-code',
        prompt: 'Set `z` to the layer\'s sums, before any activation.',
        before: `x = np.array([1.0, -1.0])
W = np.array([[2.0, 1.0],
              [0.0, 3.0]])
b = np.array([1.0, 1.0])`,
        solution: 'z = W @ x + b',
        tests: 'assert np.allclose(z, [2, -2]), f"[2 − 1 + 1, 0 − 3 + 1] = [2, −2]; got {z}"',
        placeholder: 'z = ...',
        explain: 'One line computes every neuron.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'f8-04',
    title: 'Many examples at once',
    summary: 'With examples as the rows of X, a layer is X @ W.T + b: one row of outputs per example.',
    card: {
      title: 'Many examples at once',
      text: 'To push many examples through a layer at once, make them the rows of X. Then `X @ W.T + b` gives one row of outputs per example, shape (examples, neurons). PyTorch\'s `nn.Linear` computes exactly this.',
      code: `X = np.ones((5, 3))  # 5 examples
W = np.ones((4, 3))  # 4 neurons
b = np.zeros(4)
print((X @ W.T + b).shape)`,
      output: '(5, 4)',
    },
    exercises: [
      {
        id: 'f8-4-1',
        type: 'predict-shape',
        prompt: '8 examples with 2 features, a layer of 3 neurons. Shape of the output?',
        code: `X = np.zeros((8, 2))
W = np.zeros((3, 2))
b = np.zeros(3)`,
        target: 'X @ W.T + b',
        answer: '(8, 3)',
        options: [
          { text: '(8, 3)' },
          { text: '(3, 8)', why: 'Examples stay as rows: (8, 2) @ (2, 3).' },
          { text: '(8, 2)', why: 'The layer turns 2 features into 3 outputs.' },
        ],
        explain: '(examples, neurons).',
      },
      {
        id: 'f8-4-2',
        type: 'mcq',
        prompt: 'X is (32, 10) and W is (64, 10). What is the shape of `X @ W.T + b`?',
        options: [
          { text: '(32, 64)' },
          { text: '(64, 32)', why: 'Rows are examples: 32 of them, each with 64 outputs.' },
          { text: '(32, 10)', why: 'The 10 inputs are summed away; 64 neurons give 64 outputs.' },
        ],
        answer: 0,
        explain: '(32, 10) @ (10, 64) = (32, 64).',
      },
      {
        id: 'f8-4-3',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `X = np.ones((5, 3))
W = np.ones((4, 3))
b = np.zeros(4)
Z = X @ W + b`,
        error: 'ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0...',
        answer: 3,
        lineWhy: {
          '0': '5 examples, 3 features: fine.',
          '1': '4 neurons on 3 inputs: W is (neurons, inputs), as it should be.',
          '2': 'One bias per neuron.',
        },
        explain: 'W is (4, 3); the examples need `W.T`, (3, 4).',
      },
      {
        id: 'f8-4-4',
        type: 'predict-output',
        prompt: 'Two examples, one neuron. What does this print?',
        code: `X = np.array([[1.0, 0.0],
              [0.0, 1.0]])
W = np.array([[2.0, 3.0]])
print(X @ W.T)`,
        answer: '[[2.]\n [3.]]',
        options: [
          { text: '[[2.]\n [3.]]' },
          { text: '[[2. 3.]]', why: 'One row per example: two rows, each with one output.' },
          { text: '[5.]', why: 'Each example gets its own output.' },
        ],
        explain: 'Example 1 picks the first weight, example 2 the second.',
      },
      {
        id: 'f8-4-5',
        type: 'fill-blank',
        prompt: 'Run the whole batch through the layer.',
        code: `X = np.ones((5, 3))
W = np.ones((4, 3))
b = np.zeros(4)
Z = X @ ___ + b
print(Z.shape)`,
        answer: ['W.T'],
        distractors: [
          { text: 'W', why: '(5, 3) @ (4, 3) does not line up: the inner sizes 3 and 4 differ.' },
          { text: 'X.T', why: 'That multiplies the examples by each other, not by the weights.' },
        ],
        expectOutput: '(5, 4)',
        explain: 'Transpose W so its inputs line up with X\'s features.',
      },
      {
        id: 'f8-4-6',
        type: 'predict-output',
        prompt: '10 examples through a layer of 2 neurons. Type how many numbers come out.',
        code: `X = np.ones((10, 3))
W = np.ones((2, 3))
b = np.zeros(2)
print((X @ W.T + b).size)`,
        answer: '20',
        typedWrong: [
          { answer: '30', why: 'The 3 inputs are summed: 2 outputs for each of 10 examples.' },
          { answer: '2', why: 'Every example gets its own 2 outputs.' },
        ],
        explain: '10 × 2.',
      },
      {
        id: 'f8-4-7',
        type: 'match-pairs',
        prompt: 'Match each expression to its shape.',
        setup: `X = np.ones((6, 4))
W1 = np.ones((5, 4))
W2 = np.ones((2, 5))`,
        pairs: [
          { left: 'X @ W1.T', right: '(6, 5)', why: '6 examples, 5 neurons.' },
          { left: 'X @ W1.T @ W2.T', right: '(6, 2)', why: 'A second layer of 2 neurons.' },
          { left: 'W1 @ X.T', right: '(5, 6)', why: 'The same numbers transposed: neurons as rows.' },
        ],
        verify: 'shape',
        explain: 'Keep examples as rows: X @ W.T.',
      },
      {
        id: 'f8-4-8',
        type: 'run-code',
        prompt: 'Set `Z` to the layer\'s outputs for every row of `X`.',
        before: `X = np.array([[1.0, 2.0],
              [0.0, 1.0],
              [1.0, 1.0]])
W = np.array([[1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0],
              [1.0, -1.0]])
b = np.zeros(4)`,
        solution: 'Z = X @ W.T + b',
        tests: [
          'assert Z.shape == (3, 4), f"3 examples, 4 neurons; got shape {Z.shape}"',
          'assert np.allclose(Z[0], [1, 2, 3, -1]), f"first example: [1, 2, 3, −1]; got {Z[0]}"',
        ].join('\n'),
        placeholder: 'Z = ...',
        explain: 'A whole batch in one line.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'f8-05',
    title: 'Stacking layers',
    summary: 'A network feeds one layer\'s outputs into the next; computing input to output is the forward pass.',
    card: {
      title: 'Stacking layers',
      text: 'A network feeds one layer\'s outputs into the next: a hidden layer `H = relu(X @ W1.T + b1)`, then `out = H @ W2.T + b2`. W1 is (hidden, inputs) and W2 is (outputs, hidden), so the shapes chain. Computing from input to output like this is the forward pass.',
      code: `X = np.ones((5, 3))
W1, b1 = np.ones((4, 3)), np.zeros(4)
W2, b2 = np.ones((1, 4)), np.zeros(1)
H = np.maximum(0, X @ W1.T + b1)
print(H.shape, (H @ W2.T + b2).shape)`,
      output: '(5, 4) (5, 1)',
    },
    exercises: [
      {
        id: 'f8-5-1',
        type: 'predict-shape',
        prompt: '10 examples, 2 features, 8 hidden neurons, 3 outputs. Shape of the output?',
        code: `X = np.zeros((10, 2))
W1 = np.zeros((8, 2))
W2 = np.zeros((3, 8))
H = np.maximum(0, X @ W1.T)`,
        target: 'H @ W2.T',
        answer: '(10, 3)',
        options: [
          { text: '(10, 3)' },
          { text: '(10, 8)', why: 'That is H, the hidden layer; the output layer has 3 neurons.' },
          { text: '(3, 10)', why: 'Examples stay as rows all the way through.' },
        ],
        explain: '(10, 2) → (10, 8) → (10, 3).',
      },
      {
        id: 'f8-5-2',
        type: 'mcq',
        prompt: 'W1 is (16, 4). What shape must W2 have to produce 1 output?',
        options: [
          { text: '(1, 16)' },
          { text: '(16, 1)', why: 'W is (outputs, inputs): 1 neuron reading 16 hidden values.' },
          { text: '(1, 4)', why: 'The output layer reads the 16 hidden values, not the 4 inputs.' },
        ],
        answer: 0,
        explain: 'Its inputs are the previous layer\'s outputs.',
      },
      {
        id: 'f8-5-3',
        type: 'predict-output',
        prompt: 'A tiny network on one example. What does this print?',
        code: `x = np.array([1.0, -1.0])
W1 = np.array([[1.0, 1.0],
               [1.0, -1.0]])
W2 = np.array([[1.0, 2.0]])
h = np.maximum(0, W1 @ x)
print(h, W2 @ h)`,
        answer: '[0. 2.] [4.]',
        options: [
          { text: '[0. 2.] [4.]' },
          { text: '[0. 2.] [2.]', why: 'The second hidden value is multiplied by its weight, 2.' },
          { text: '[ 0. -2.] [-4.]', why: 'W1 @ x is [0, 2]: 1 − (−1) = 2.' },
        ],
        explain: 'Hidden: [0, 2]. Output: 0×1 + 2×2 = 4.',
      },
      {
        id: 'f8-5-4',
        type: 'order-lines',
        prompt: 'Put the forward pass in order.',
        lines: [
          { text: 'X = np.array([[1.0, 2.0]])', fixed: true },
          { text: 'W1, b1 = np.eye(2), np.zeros(2)', fixed: true },
          { text: 'W2, b2 = np.ones((1, 2)), 1.0', fixed: true },
          { text: 'Z1 = X @ W1.T + b1' },
          { text: 'H = np.maximum(0, Z1)' },
          { text: 'out = H @ W2.T + b2' },
          { text: 'print(out)' },
        ],
        expectOutput: '[[4.]]',
        explain: 'Sum, activation, next layer: each step needs the one before.',
      },
      {
        id: 'f8-5-5',
        type: 'fill-blank',
        prompt: 'Feed the hidden layer into the output layer.',
        code: `X = np.array([[1.0, -2.0]])
W1, b1 = np.eye(2), np.zeros(2)
W2, b2 = np.ones((1, 2)), 0.0
Z1 = X @ W1.T + b1
H = np.maximum(0, Z1)
print(___ @ W2.T + b2)`,
        answer: ['H'],
        distractors: [
          { text: 'Z1', why: 'That skips the activation: the −2 would get through.' },
          { text: 'X', why: 'That skips the whole hidden layer.' },
        ],
        expectOutput: '[[1.]]',
        explain: 'The output layer reads the activated hidden values.',
      },
      {
        id: 'f8-5-6',
        type: 'mcq',
        prompt: 'What is the forward pass?',
        options: [
          { text: 'Input to output, layer by layer' },
          { text: 'Updating the weights after a step', why: 'That is the training step, after the backward pass.' },
          { text: 'Computing every gradient, output first', why: 'That is the backward pass, coming later in this unit.' },
        ],
        answer: 0,
        explain: 'Input in, prediction out.',
      },
      {
        id: 'f8-5-7',
        type: 'predict-output',
        prompt: 'Type how many numbers this network learns.',
        code: `W1, b1 = np.ones((4, 3)), np.zeros(4)
W2, b2 = np.ones((1, 4)), np.zeros(1)
n = W1.size + b1.size
n += W2.size + b2.size
print(n)`,
        answer: '21',
        typedWrong: [
          { answer: '16', why: 'Count the biases too: 4 and 1.' },
          { answer: '8', why: '`.size` counts every entry: W1 alone has 12.' },
        ],
        explain: '12 + 4 + 4 + 1.',
      },
      {
        id: 'f8-5-8',
        type: 'run-code',
        prompt: 'Set `out` to the network\'s output: the hidden layer with ReLU, then the output layer.',
        before: `X = np.array([[1.0, 2.0],
              [-1.0, 0.0]])
W1 = np.array([[1.0, 1.0],
               [-1.0, 1.0]])
b1 = np.zeros(2)
W2 = np.array([[1.0, -1.0]])
b2 = np.array([0.5])`,
        solution: `H = np.maximum(0, X @ W1.T + b1)
out = H @ W2.T + b2`,
        tests: [
          'assert out.shape == (2, 1), f"2 examples, 1 output; got shape {out.shape}"',
          'assert np.allclose(out.ravel(), [2.5, -0.5]), f"expected [[2.5], [-0.5]]; got {out.ravel()}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'H = ...\nout = ...',
        explain: 'Two lines: hidden layer, output layer.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'f8-06',
    title: 'Why the activation matters',
    summary: 'Without activations, stacked layers collapse into one linear layer; ReLU lets a network bend.',
    card: {
      title: 'Why the activation matters',
      text: 'Without an activation, two layers collapse into one: `W2 @ (W1 @ x)` equals `(W2 @ W1) @ x`, still a straight-line model. The activation bends the values between layers, so stacked layers can fit curves. That is why every hidden layer has one.',
      code: `x = np.array([1.0, 2.0])
W1 = np.array([[1.0, 2.0],
               [0.0, 1.0]])
W2 = np.array([[3.0, -1.0]])
print(W2 @ (W1 @ x), (W2 @ W1) @ x)`,
      output: '[13.] [13.]',
    },
    exercises: [
      {
        id: 'f8-6-1',
        type: 'mcq',
        prompt: 'Which can fit y = |x| exactly?',
        options: [
          { text: 'Two layers with a ReLU between them' },
          { text: 'Two layers with no activation', why: 'They collapse into one linear layer: a straight line.' },
          { text: 'One layer', why: 'One layer is a straight line; |x| has a bend.' },
        ],
        answer: 0,
        explain: 'Next exercise shows how: relu(x) + relu(−x).',
      },
      {
        id: 'f8-6-2',
        type: 'predict-output',
        prompt: 'With and without the ReLU. What does this print?',
        code: `x = np.array([1.0, -1.0])
W1 = np.eye(2)
W2 = np.array([[1.0, 1.0]])
a = W2 @ (W1 @ x)
r = W2 @ np.maximum(0, W1 @ x)
print(a, r)`,
        answer: '[0.] [1.]',
        options: [
          { text: '[0.] [1.]' },
          { text: '[0.] [0.]', why: 'ReLU turns the −1 into 0, so the sum is 1.' },
          { text: '[1.] [1.]', why: 'Without ReLU, 1 + (−1) = 0.' },
        ],
        explain: 'The activation changed the answer: the layers no longer merge.',
      },
      {
        id: 'f8-6-3',
        type: 'number-grid',
        prompt: 'Two linear layers with no activation merge into one. Fill in its weight matrix, W2 @ W1.',
        inputs: [
          { name: 'W2', value: [[1, 2]] },
          { name: 'W1', value: [[1, 0], [3, 1]] },
        ],
        expr: 'W2 @ W1',
        answer: [[7, 2]],
        explain: '[1×1 + 2×3, 1×0 + 2×1]: one layer doing the work of two.',
      },
      {
        id: 'f8-6-4',
        type: 'mcq',
        prompt: 'A network predicts house prices. Where does the ReLU go?',
        options: [
          { text: 'After the hidden layer only' },
          { text: 'After the output layer too', why: 'Then it could never predict below 0, and its gradient dies there.' },
          { text: 'Nowhere: prices are just numbers', why: 'Without it, the layers collapse into one straight line.' },
        ],
        answer: 0,
        explain: 'Hidden layers bend; a regression output can be any number.',
      },
      {
        id: 'f8-6-5',
        type: 'predict-output',
        prompt: 'Two ReLU neurons, weights 1 and −1. What does this print?',
        code: `x = np.array([[-2.0], [0.5], [3.0]])
W1 = np.array([[1.0], [-1.0]])
W2 = np.array([[1.0, 1.0]])
H = np.maximum(0, x @ W1.T)
print((H @ W2.T).ravel())`,
        answer: '[2.  0.5 3. ]',
        options: [
          { text: '[2.  0.5 3. ]' },
          { text: '[-2.   0.5  3. ]', why: 'For −2, the second neuron gives relu(2) = 2.' },
          { text: '[0. 0. 0.]', why: 'Each x makes one of the two neurons positive.' },
        ],
        explain: 'relu(x) + relu(−x) = |x|: a bend from two straight pieces.',
      },
      {
        id: 'f8-6-6',
        type: 'spot-bug',
        prompt: 'This should compute |x| but gives 0 for x = −1. Which line?',
        code: `x = np.array([[-1.0], [1.0]])
W1 = np.array([[1.0], [-1.0]])
W2 = np.array([[1.0, 1.0]])
H = x @ W1.T
out = H @ W2.T
assert out[0, 0] == 1.0, out[0, 0]`,
        error: 'AssertionError: 0.0',
        answer: 3,
        raiseLine: 5,
        lineWhy: {
          '0': 'Two examples, −1 and 1.',
          '1': 'Weights 1 and −1, as in the previous exercise.',
          '2': 'The output adds the two hidden values.',
          '4': 'Right, given activated hidden values.',
          '5': 'The check is right: |−1| is 1.',
        },
        explain: 'The hidden layer needs its ReLU: `np.maximum(0, x @ W1.T)`.',
      },
      {
        id: 'f8-6-7',
        type: 'mcq',
        prompt: 'You delete every ReLU from a 10-layer network. What can it now represent?',
        options: [
          { text: 'Only what a single linear layer could' },
          { text: 'The same as before, just faster', why: 'Without activations the ten layers multiply out to one matrix.' },
          { text: 'Ten times more than one layer', why: 'Depth only adds power with activations between layers.' },
        ],
        answer: 0,
        explain: 'A product of matrices is one matrix.',
      },
      {
        id: 'f8-6-8',
        type: 'run-code',
        prompt: 'Set `W` to the single matrix that does the same as layer W1 followed by layer W2 (no activation).',
        before: `W1 = np.array([[1.0, 2.0],
               [0.0, 1.0],
               [1.0, 0.0]])
W2 = np.array([[1.0, 1.0, 1.0]])`,
        solution: 'W = W2 @ W1',
        tests: [
          'x = np.array([2.0, -1.0])',
          'assert np.allclose(W @ x, W2 @ (W1 @ x)), "W @ x should equal W2 @ (W1 @ x)"',
          'assert W.shape == (1, 2), f"one output, two inputs; got shape {W.shape}"',
        ].join('\n'),
        placeholder: 'W = ...',
        explain: 'Later layer on the left: W2 @ W1.',
      },
    ],
  },
];

export const f8: Unit = {
  id: 'F8',
  track: 'foundations',
  title: 'Neural networks',
  blurb: 'Neurons, activations, layers as matrix multiplies, the forward pass, and backpropagation, written by hand in NumPy.',
  prelude: 'import numpy as np',
  lessons: [...lessons, ...f8More],
  labs: f8Labs,
  library: f8Library,
};
