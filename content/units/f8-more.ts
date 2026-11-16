import type { Lesson } from '../schema';

/* F8 lessons 7 to 12: the forward pass in code and its loss, backpropagation
 * on a tiny network, through a linear layer and through ReLU, training, and
 * the checkpoint. */
export const f8More: Lesson[] = [
  // ------------------------------------------------------------------ 7
  {
    id: 'f8-07',
    title: 'The forward pass in code',
    summary: 'A forward function returns the output and the values the backward pass will need; the loss is measured on the output.',
    card: {
      title: 'The forward pass in code',
      text: 'Write the forward pass as a function that also returns its in-between values, Z1 and H: the backward pass will need them. The loss is then measured on the output, as in F7.',
      code: `def forward(X, W1, b1, W2, b2):
    Z1 = X @ W1.T + b1
    H = np.maximum(0, Z1)
    return H @ W2.T + b2, Z1, H

X = np.array([[1.0, -1.0]])
W1, b1 = np.eye(2), np.zeros(2)
W2, b2 = np.ones((1, 2)), 0.0
out, Z1, H = forward(
    X, W1, b1, W2, b2)
print(Z1, H, out)`,
      output: '[[ 1. -1.]] [[1. 0.]] [[1.]]',
    },
    exercises: [
      {
        id: 'f8-7-1',
        type: 'predict-output',
        prompt: 'Type the MSE.',
        code: `out = np.array([[2.0], [0.0]])
y = np.array([[1.0], [0.0]])
print(((out - y) ** 2).mean())`,
        answer: '0.5',
        typedWrong: [
          { answer: '1.0', why: 'That is the sum; the mean divides by the 2 examples.' },
          { answer: '0.25', why: 'The miss of 1 squared is 1, averaged over 2 examples.' },
        ],
        explain: 'Misses 1 and 0; squares 1 and 0; mean 0.5.',
      },
      {
        id: 'f8-7-2',
        type: 'mcq',
        prompt: 'Why does `forward` also return Z1 and H?',
        options: [
          { text: 'The backward pass needs them' },
          { text: 'To print them for debugging', why: 'Useful, but the real reason is the gradients: they are built from these values.' },
          { text: 'Python functions must return everything', why: 'They return only what you ask for.' },
        ],
        answer: 0,
        explain: 'Gradients use the inputs and sums seen on the way forward.',
      },
      {
        id: 'f8-7-3',
        type: 'fill-blank',
        prompt: 'Measure the network with MSE.',
        code: `out = np.array([[3.0], [2.0]])
y = np.array([[1.0], [1.0]])
loss = ((out - y) ___ 2).mean()
print(loss)`,
        answer: ['**'],
        distractors: [
          { text: '*', why: 'That doubles the misses; MSE squares them.' },
          { text: '//', why: 'Floor division is not squaring.' },
        ],
        expectOutput: '2.5',
        explain: 'Misses 2 and 1, squares 4 and 1, mean 2.5.',
      },
      {
        id: 'f8-7-4',
        type: 'predict-shape',
        prompt: 'The network outputs (5, 1); the targets are (5,). Shape of `out - y`?',
        code: `out = np.zeros((5, 1))
y = np.zeros(5)`,
        target: 'out - y',
        answer: '(5, 5)',
        options: [
          { text: '(5, 5)' },
          { text: '(5, 1)', why: 'The column (5, 1) and the row (5,) broadcast against each other.' },
          { text: '(5,)', why: 'Broadcasting stretches both: every output minus every target.' },
        ],
        explain: 'A silent bug: reshape y to (5, 1) first.',
      },
      {
        id: 'f8-7-5',
        type: 'spot-bug',
        prompt: 'Perfect predictions, yet the loss is not 0. Which line?',
        code: `out = np.array([[1.0], [2.0], [3.0]])
y = np.array([1.0, 2.0, 3.0])
loss = ((out - y) ** 2).mean()
assert loss == 0, loss`,
        error: 'AssertionError: 1.33...',
        answer: 2,
        raiseLine: 3,
        lineWhy: {
          '0': 'Three predictions in a column, as a network gives them.',
          '1': 'The target values are right; the shapes meet on the next line.',
          '3': 'The check is right: the predictions are perfect.',
        },
        explain: '(3, 1) − (3,) broadcasts to (3, 3). Use `out.ravel() - y`, or reshape y.',
      },
      {
        id: 'f8-7-6',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def layer(X, W, b):
    return X @ W.T + b

X = np.array([[2.0, 1.0]])
W = np.array([[1.0, -3.0]])
Z = layer(X, W, 0.0)
print(Z, np.maximum(0, Z))`,
        answer: '[[-1.]] [[0.]]',
        options: [
          { text: '[[-1.]] [[0.]]' },
          { text: '[[5.]] [[5.]]', why: '1×2 + (−3)×1 = −1.' },
          { text: '[[-1.]] [[-1.]]', why: 'ReLU turns −1 into 0.' },
        ],
        explain: 'The sum is −1; ReLU makes it 0.',
      },
      {
        id: 'f8-7-7',
        type: 'mcq',
        prompt: 'Why is the loss a single number rather than one per example?',
        options: [
          { text: 'One number to make smaller' },
          { text: 'It takes less memory to store', why: 'Memory is not the reason: gradient descent minimises one number.' },
          { text: 'Because the errors cancel out', why: 'Squaring stops them cancelling; the mean just summarises.' },
        ],
        answer: 0,
        explain: 'Every gradient is "how this one number changes".',
      },
      {
        id: 'f8-7-8',
        type: 'run-code',
        prompt: 'Set `loss` to the mean squared error between `out` and `y`.',
        before: `out = np.array([[1.0], [4.0], [2.0]])
y = np.array([[1.0], [2.0], [3.0]])`,
        solution: 'loss = ((out - y) ** 2).mean()',
        tests: 'assert abs(loss - 5 / 3) < 1e-9, f"(0 + 4 + 1) / 3 ≈ 1.667; got {loss}"',
        placeholder: 'loss = ...',
        explain: 'Same shapes, so no broadcasting surprise.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'f8-08',
    title: 'Backpropagation',
    summary: 'Backpropagation is the chain rule run from the loss backwards, one local slope per step.',
    card: {
      title: 'Backpropagation',
      text: 'Backpropagation is the chain rule run backwards from the loss. For out = w·x and L = (out − y)²: first dL/dout = 2(out − y), then dL/dw = dL/dout · x. Each step multiplies the gradient arriving from above by one local slope.',
      code: `x, y, w = 2.0, 10.0, 3.0
out = w * x
dout = 2 * (out - y)
dw = dout * x
print(out, dout, dw)`,
      output: '6.0 -8.0 -16.0',
    },
    exercises: [
      {
        id: 'f8-8-1',
        type: 'predict-output',
        prompt: 'Type dw.',
        code: `x, y, w = 3.0, 0.0, 1.0
out = w * x
dout = 2 * (out - y)
dw = dout * x
print(dw)`,
        answer: '18.0',
        typedWrong: [
          { answer: '6.0', why: 'That is dout; multiply by x = 3 for dw.' },
          { answer: '9.0', why: 'Do not forget the 2 from the square: 2 × 3 × 3.' },
        ],
        explain: 'dout = 2 × 3 = 6, dw = 6 × 3 = 18.',
      },
      {
        id: 'f8-8-2',
        type: 'mcq',
        prompt: 'dL/dw = −16. To lower the loss, w should…',
        options: [
          { text: 'Go up' },
          { text: 'Go down', why: 'A negative slope means the loss falls as w rises.' },
          { text: 'Stay: the gradient is not 0', why: 'A non-zero gradient says there is still downhill to go.' },
        ],
        answer: 0,
        explain: 'Step against the gradient: w − lr × (−16) is larger.',
      },
      {
        id: 'f8-8-3',
        type: 'predict-output',
        prompt: 'Two weights in a chain. What does this print?',
        code: `x, y = 1.0, 5.0
w1, w2 = 2.0, 3.0
h = w1 * x
out = w2 * h
dout = 2 * (out - y)
dh = dout * w2
dw1 = dh * x
print(dout, dh, dw1)`,
        answer: '2.0 6.0 6.0',
        options: [
          { text: '2.0 6.0 6.0' },
          { text: '2.0 4.0 4.0', why: 'dh multiplies by w2 = 3, the slope of out with respect to h.' },
          { text: '1.0 3.0 3.0', why: 'dout = 2 × (6 − 5) = 2: keep the 2 from the square.' },
        ],
        explain: 'h = 2, out = 6. Back: 2, then × 3, then × 1.',
      },
      {
        id: 'f8-8-4',
        type: 'fill-blank',
        prompt: 'The gradient for the second weight.',
        code: `x, y = 1.0, 5.0
w1, w2 = 2.0, 3.0
h = w1 * x
out = w2 * h
dout = 2 * (out - y)
dw2 = dout * ___
print(dw2)`,
        answer: ['h'],
        distractors: [
          { text: 'w2', why: 'dout × w2 is dh, the gradient flowing back to h.' },
          { text: 'x', why: 'w2 multiplies h, not x; its slope is h.' },
        ],
        expectOutput: '4.0',
        explain: 'A weight\'s gradient is the gradient above times its input: 2 × 2.',
      },
      {
        id: 'f8-8-5',
        type: 'order-lines',
        prompt: 'The forward pass is done. Put the backward pass in order.',
        lines: [
          { text: 'x, y, w1, w2 = 1.0, 5.0, 2.0, 3.0', fixed: true },
          { text: 'h = w1 * x', fixed: true },
          { text: 'out = w2 * h', fixed: true },
          { text: 'dout = 2 * (out - y)' },
          { text: 'dh = dout * w2' },
          { text: 'dw1 = dh * x' },
          { text: 'print(dw1)' },
        ],
        expectOutput: '6.0',
        explain: 'From the loss backwards: each line uses the one before.',
      },
      {
        id: 'f8-8-6',
        type: 'mcq',
        prompt: 'Why does backpropagation start at the loss and go backwards?',
        options: [
          { text: 'Each step needs the gradient above it' },
          { text: 'Because the forward pass is slow', why: 'Speed is not the reason: the chain rule needs the outer gradient first.' },
          { text: 'Either order gives the same result', why: 'dh needs dout, and dw1 needs dh: the order is fixed.' },
        ],
        answer: 0,
        explain: 'The chain rule multiplies from the outside in.',
      },
      {
        id: 'f8-8-7',
        type: 'predict-output',
        prompt: 'Check the gradient by nudging w. Type what this prints.',
        code: `x, y, w = 2.0, 10.0, 3.0
def loss(w):
    return (w * x - y) ** 2
e = 1e-4
up, dn = loss(w + e), loss(w - e)
g = (up - dn) / (2 * e)
print(round(g, 3))`,
        answer: '-16.0',
        typedWrong: [
          { answer: '16.0', why: 'Raising w lowers the loss here, so the slope is negative.' },
          { answer: '-8.0', why: 'That is dout; the chain rule multiplies by x = 2.' },
        ],
        explain: 'It matches backprop\'s −16: the gradient is right.',
      },
      {
        id: 'f8-8-8',
        type: 'run-code',
        prompt: 'Set `dw` to dL/dw for out = w·x and L = (out − y)².',
        before: `x, y, w = 4.0, 3.0, 1.0
out = w * x`,
        solution: 'dw = 2 * (out - y) * x',
        tests: 'assert abs(dw - 8) < 1e-9, f"2 × (4 − 3) × 4 = 8; got {dw}"',
        placeholder: 'dw = ...',
        explain: 'Loss slope times the local slope x.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'f8-09',
    title: 'Backprop through a layer',
    summary: 'For Z = X @ W.T + b: dW = dZ.T @ X, db = dZ.sum(axis=0), dX = dZ @ W.',
    card: {
      title: 'Backprop through a layer',
      text: 'For a layer `Z = X @ W.T + b`, let dZ hold the loss\'s gradient for every output. Then `dW = dZ.T @ X`, `db = dZ.sum(axis=0)` and `dX = dZ @ W`. Each gradient has the same shape as the thing it belongs to: use that as a check.',
      code: `X = np.ones((5, 3))
W = np.ones((4, 3))
dZ = np.ones((5, 4))
dW, dX = dZ.T @ X, dZ @ W
print(dW.shape, dX.shape)`,
      output: '(4, 3) (5, 3)',
    },
    exercises: [
      {
        id: 'f8-9-1',
        type: 'predict-shape',
        prompt: 'X is (8, 2), W is (3, 2). Shape of dW?',
        code: `X = np.zeros((8, 2))
W = np.zeros((3, 2))
dZ = np.zeros((8, 3))`,
        target: 'dZ.T @ X',
        answer: '(3, 2)',
        options: [
          { text: '(3, 2)' },
          { text: '(2, 3)', why: 'dW must match W, which is (3, 2).' },
          { text: '(8, 8)', why: 'dZ.T @ X sums over the 8 examples, leaving (3, 2).' },
        ],
        explain: 'Same shape as W, so `W -= lr * dW` works.',
      },
      {
        id: 'f8-9-2',
        type: 'mcq',
        prompt: 'Why is db = dZ.sum(axis=0)?',
        options: [
          { text: 'Every example used the same b' },
          { text: 'To make it a single number', why: 'db has one value per neuron, like b.' },
          { text: 'axis=0 is the neuron axis', why: 'Axis 0 is the examples; summing it leaves one value per neuron.' },
        ],
        answer: 0,
        explain: 'Every example nudges the same bias, so the nudges add.',
      },
      {
        id: 'f8-9-3',
        type: 'number-grid',
        prompt: 'Two examples, one neuron. Fill in dW = dZ.T @ X.',
        inputs: [
          { name: 'dZ', value: [[1], [2]] },
          { name: 'X', value: [[1, 0], [3, 1]] },
        ],
        expr: 'dZ.T @ X',
        answer: [[7, 2]],
        explain: 'Each weight\'s gradient sums gradient × input over the examples: 1×1 + 2×3 and 1×0 + 2×1.',
      },
      {
        id: 'f8-9-4',
        type: 'predict-output',
        prompt: 'What is db?',
        code: `dZ = np.array([[1.0, -1.0],
               [2.0, 0.5]])
print(dZ.sum(axis=0))`,
        answer: '[ 3.  -0.5]',
        options: [
          { text: '[ 3.  -0.5]' },
          { text: '[0.  2.5]', why: 'That sums each row (axis=1): one per example, not per neuron.' },
          { text: '2.5', why: 'With an axis, the sum keeps one value per neuron.' },
        ],
        explain: 'Down each column: one value per neuron.',
      },
      {
        id: 'f8-9-5',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `X = np.ones((5, 3))
W = np.ones((4, 3))
dZ = np.ones((5, 4))
dW = X.T @ dZ
W -= 0.1 * dW`,
        error: 'ValueError: operands could not be broadcast together...',
        answer: 3,
        raiseLine: 4,
        lineWhy: {
          '0': '5 examples, 3 inputs.',
          '1': 'A layer of 4 neurons.',
          '2': 'One gradient per example and neuron: (5, 4).',
          '4': 'The step is right once dW has W\'s shape.',
        },
        explain: '`X.T @ dZ` is (3, 4); W is (4, 3). Use `dZ.T @ X`.',
      },
      {
        id: 'f8-9-6',
        type: 'fill-blank',
        prompt: 'The gradient flowing back to the layer\'s inputs.',
        code: `X = np.ones((5, 3))
W = np.ones((4, 3))
dZ = np.ones((5, 4))
dX = dZ @ ___
print(dX.shape)`,
        answer: ['W'],
        distractors: [
          { text: 'W.T', why: '(5, 4) @ (3, 4) does not line up.' },
          { text: 'X', why: 'dX uses the weights: each input reached the outputs through them.' },
        ],
        expectOutput: '(5, 3)',
        explain: 'Same shape as X: one gradient per example and input.',
      },
      {
        id: 'f8-9-7',
        type: 'match-pairs',
        prompt: 'Match each gradient to its shape.',
        setup: `X = np.ones((6, 4))
W = np.ones((2, 4))
dZ = np.ones((6, 2))`,
        pairs: [
          { left: 'dZ.T @ X', right: '(2, 4)', why: 'dW: the shape of W.' },
          { left: 'dZ @ W', right: '(6, 4)', why: 'dX: the shape of X.' },
          { left: 'dZ.sum(axis=0)', right: '(2,)', why: 'db: one per neuron, like b.' },
        ],
        verify: 'shape',
        explain: 'Every gradient matches the shape of what it updates.',
      },
      {
        id: 'f8-9-8',
        type: 'run-code',
        prompt: 'Set `dW` and `db` for this layer.',
        before: `X = np.array([[1.0, 2.0],
              [3.0, 4.0]])
dZ = np.array([[1.0],
               [-1.0]])`,
        solution: `dW = dZ.T @ X
db = dZ.sum(axis=0)`,
        tests: [
          'assert np.allclose(dW, [[-2, -2]]), f"[[1 − 3, 2 − 4]] = [[-2, -2]]; got {dW}"',
          'assert np.allclose(db, [0]) and db.shape == (1,), f"one bias, gradient 1 − 1 = 0; got {db}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'dW = ...\ndb = ...',
        explain: 'Two lines cover every weight and bias in the layer.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 'f8-10',
    title: 'Backprop through ReLU',
    summary: 'ReLU passes the gradient where its input was positive and blocks it elsewhere: dZ = dH * (Z > 0).',
    card: {
      title: 'Backprop through ReLU',
      text: 'ReLU lets the gradient through where its input was positive and blocks it where it was not: `dZ = dH * (Z > 0)`. That is why the forward pass keeps Z. A neuron whose input is negative for every example gets no gradient at all, a "dead" ReLU.',
      code: `Z = np.array([[-1.0, 2.0, 0.5]])
dH = np.array([[3.0, 3.0, 3.0]])
print(dH * (Z > 0))`,
      output: '[[0. 3. 3.]]',
    },
    exercises: [
      {
        id: 'f8-10-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `Z = np.array([2.0, -3.0, 0.0])
dH = np.array([1.0, 1.0, 1.0])
print(dH * (Z > 0))`,
        answer: '[1. 0. 0.]',
        options: [
          { text: '[1. 0. 0.]' },
          { text: '[1. 0. 1.]', why: '0 is not greater than 0, so its gradient is blocked too.' },
          { text: '[ 2. -3.  0.]', why: 'The mask is True/False; it does not multiply by Z itself.' },
        ],
        explain: 'Only the positive input passes its gradient.',
      },
      {
        id: 'f8-10-2',
        type: 'mcq',
        prompt: 'What is ReLU\'s slope?',
        options: [
          { text: '1 if positive, else 0' },
          { text: 'Always 1, like a line', why: 'For negative inputs ReLU is flat at 0, so its slope is 0.' },
          { text: 'The input value itself', why: 'ReLU(z) = z for positive z, whose slope is 1.' },
        ],
        answer: 0,
        explain: 'Flat on the left, a 45° line on the right.',
      },
      {
        id: 'f8-10-3',
        type: 'fill-blank',
        prompt: 'Pass the gradient back through ReLU.',
        code: `Z = np.array([-1.0, 4.0])
dH = np.array([5.0, 5.0])
dZ = dH * (Z ___ 0)
print(dZ)`,
        answer: ['>'],
        distractors: [
          { text: '<', why: 'That passes the gradient exactly where ReLU blocked the value.' },
          { text: '==', why: 'Only inputs above 0 passed through ReLU.' },
        ],
        expectOutput: '[0. 5.]',
        explain: 'The gradient flows where the value flowed.',
      },
      {
        id: 'f8-10-4',
        type: 'predict-output',
        prompt: 'A neuron with a negative input. What does this print?',
        code: `x, w = 3.0, -1.0
z = w * x
h = max(0.0, z)
dh = 1.0
dz = dh * (z > 0)
print(z, h, dz * x)`,
        answer: '-3.0 0.0 0.0',
        options: [
          { text: '-3.0 0.0 0.0' },
          { text: '-3.0 0.0 3.0', why: 'ReLU blocked the gradient, so dz is 0 and so is dw.' },
          { text: '-3.0 -3.0 3.0', why: 'ReLU turns −3 into 0.' },
        ],
        explain: 'No gradient reaches w: it will not change this step.',
      },
      {
        id: 'f8-10-5',
        type: 'mcq',
        prompt: 'A hidden neuron\'s input is negative for every training example. What happens in training?',
        options: [
          { text: 'Its weights stop changing' },
          { text: 'It learns faster than the rest', why: 'ReLU blocks every gradient to it: it cannot learn at all.' },
          { text: 'Its output becomes negative', why: 'ReLU outputs 0 for negative inputs, never below.' },
        ],
        answer: 0,
        explain: 'A dead ReLU: one reason a too-high learning rate hurts.',
      },
      {
        id: 'f8-10-6',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `Z = np.array([2.0, -1.0])
H = np.maximum(0, Z)
dH = np.array([1.0, 1.0])
dZ = dH * Z
assert np.allclose(dZ, [1, 0]), dZ`,
        error: 'AssertionError: [ 2. -1.]',
        answer: 3,
        raiseLine: 4,
        lineWhy: {
          '0': 'The layer\'s sums.',
          '1': 'ReLU, as in the forward pass.',
          '2': 'The gradient arriving from above.',
          '4': 'The check is right: slope 1 then slope 0.',
        },
        explain: 'Multiply by the mask `(Z > 0)`, not by Z itself.',
      },
      {
        id: 'f8-10-7',
        type: 'predict-output',
        prompt: 'Back through ReLU, then to the weights. What does this print?',
        code: `X = np.array([[1.0, 2.0]])
Z = np.array([[-0.5, 1.5]])
dH = np.array([[2.0, 2.0]])
dZ = dH * (Z > 0)
print(dZ.T @ X)`,
        answer: '[[0. 0.]\n [2. 4.]]',
        options: [
          { text: '[[0. 0.]\n [2. 4.]]' },
          { text: '[[2. 4.]\n [2. 4.]]', why: 'The first neuron\'s input was negative, so its gradient is 0.' },
          { text: '[[0. 2.]\n [0. 4.]]', why: 'dW has one row per neuron: (2, 2) with neuron 1 on top.' },
        ],
        explain: 'The dead neuron\'s weights get nothing.',
      },
      {
        id: 'f8-10-8',
        type: 'run-code',
        prompt: 'Set `dZ` to the gradient before the ReLU.',
        before: `Z = np.array([[1.0, -2.0],
              [-0.5, 3.0]])
dH = np.array([[0.5, 0.5],
               [1.0, 1.0]])`,
        solution: 'dZ = dH * (Z > 0)',
        tests: 'assert np.allclose(dZ, [[0.5, 0], [0, 1]]), f"keep dH where Z > 0; got {dZ}"',
        placeholder: 'dZ = ...',
        explain: 'One mask, the same shape as Z.',
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    id: 'f8-11',
    title: 'Training the network',
    summary: 'A training step is forward, loss, backward, then a step on every parameter; check backprop once by nudging.',
    card: {
      title: 'Training the network',
      text: 'One training step runs forward, measures the loss, runs backward through every layer, and steps each parameter against its gradient. Repeat it and the loss falls. Check your backward pass once by nudging a weight: if the two numbers disagree, there is a bug.',
      code: `def loss(w):
    return (w * 2.0 - 10.0) ** 2
w, e = 3.0, 1e-4
up, dn = loss(w + e), loss(w - e)
nudge = (up - dn) / (2 * e)
backprop = 2 * (w * 2.0 - 10.0) * 2.0
print(round(nudge, 3), backprop)`,
      output: '-16.0 -16.0',
    },
    exercises: [
      {
        id: 'f8-11-1',
        type: 'order-lines',
        prompt: 'Put one training step in order.',
        lines: [
          { text: 'x, y, lr = 1.0, 5.0, 0.1', fixed: true },
          { text: 'w1, w2 = 2.0, 3.0', fixed: true },
          { text: 'h = w1 * x' },
          { text: 'out = w2 * h' },
          { text: 'dout = 2 * (out - y)' },
          { text: 'dw1 = dout * w2 * x' },
          { text: 'w1 -= lr * dw1' },
          { text: 'print(round(w1, 2))' },
        ],
        expectOutput: '1.4',
        explain: 'Forward, backward, step: always in that order.',
      },
      {
        id: 'f8-11-2',
        type: 'mcq',
        prompt: 'After writing the backward pass, the loss goes up every step. What do you check first?',
        options: [
          { text: 'One gradient against nudging' },
          { text: 'Whether more layers would help', why: 'A bigger network will not fix a wrong gradient.' },
          { text: 'Whether training longer helps', why: 'If the gradients are wrong, more steps go further the wrong way.' },
        ],
        answer: 0,
        explain: 'A wrong sign or a missing factor shows up at once.',
      },
      {
        id: 'f8-11-3',
        type: 'predict-output',
        prompt: 'Three steps of training one weight. What does this print?',
        code: `x, y, w, lr = 1.0, 4.0, 0.0, 0.25
for step in range(3):
    out = w * x
    w -= lr * 2 * (out - y) * x
    print(w)`,
        answer: '2.0\n3.0\n3.5',
        options: [
          { text: '2.0\n3.0\n3.5' },
          { text: '2.0\n4.0\n4.0', why: 'Each step covers half of the remaining gap to 4, not all of it.' },
          { text: '-2.0\n-3.0\n-3.5', why: 'out − y is negative, so subtracting the step raises w.' },
        ],
        explain: 'w heads for 4, halving the gap each step.',
      },
      {
        id: 'f8-11-4',
        type: 'fill-blank',
        prompt: 'Step the first layer\'s weights.',
        code: `W1 = np.array([[1.0, 2.0]])
dW1 = np.array([[0.5, -0.5]])
lr = 0.1
W1 -= lr * ___
print(W1)`,
        answer: ['dW1'],
        distractors: [
          { text: 'W1', why: 'That shrinks the weights towards 0, ignoring the loss.' },
          { text: 'lr', why: 'Every parameter steps by its own gradient.' },
        ],
        expectOutput: '[[0.95 2.05]]',
        explain: 'Against the gradient: 1 − 0.05 and 2 + 0.05.',
      },
      {
        id: 'f8-11-5',
        type: 'predict-output',
        prompt: 'Nudge-check w1 in a ReLU network. Type what this prints.',
        code: `x, y, w1, w2 = 1.0, 5.0, 2.0, 3.0
def loss(w1):
    h = max(0.0, w1 * x)
    return (w2 * h - y) ** 2
e = 1e-4
up, dn = loss(w1 + e), loss(w1 - e)
num = (up - dn) / (2 * e)
print(round(num, 3))`,
        answer: '6.0',
        typedWrong: [
          { answer: '2.0', why: 'That is dout; multiply by w2 = 3 and by x = 1 (ReLU passes it).' },
          { answer: '0.0', why: 'w1 × x = 2 is positive, so ReLU passes the gradient.' },
        ],
        explain: 'Backprop gives 2 × 3 × 1 × 1 = 6: they agree.',
      },
      {
        id: 'f8-11-6',
        type: 'mcq',
        prompt: 'Nudging gives 6.0 for a weight; your backward pass gives 3.0. What now?',
        options: [
          { text: 'Fix the backward pass: it has a bug' },
          { text: 'Trust backprop: nudging is approximate', why: 'Nudging is accurate to many decimals; a factor of 2 is a bug.' },
          { text: 'Average the two', why: 'One of them is wrong; averaging hides it.' },
        ],
        answer: 0,
        explain: 'A missing factor of 2 often means the square\'s 2 was dropped.',
      },
      {
        id: 'f8-11-7',
        type: 'predict-output',
        prompt: 'Gradients for parameters in a dict. What does this print?',
        code: `p = {"W1": np.ones((8, 2)),
     "b1": np.zeros(8)}
g = {k: np.zeros_like(v)
     for k, v in p.items()}
print([g[k].shape for k in g])`,
        answer: '[(8, 2), (8,)]',
        options: [
          { text: '[(8, 2), (8,)]' },
          { text: '[(2, 8), (8,)]', why: '`zeros_like` copies the shape exactly.' },
          { text: '[(), ()]', why: 'Each gradient is a whole array, like its parameter.' },
        ],
        explain: 'One gradient per parameter, the same shape.',
      },
      {
        id: 'f8-11-8',
        type: 'run-code',
        prompt: 'Step every parameter in `p` against its gradient in `g`, with rate `lr`.',
        before: `p = {"W": np.array([[1.0, 2.0]]),
     "b": np.array([0.5])}
g = {"W": np.array([[2.0, -2.0]]),
     "b": np.array([1.0])}
lr = 0.5`,
        solution: `for k in p:
    p[k] -= lr * g[k]`,
        tests: [
          'assert np.allclose(p["W"], [[0, 3]]), f"W: [[1 − 1, 2 + 1]]; got {p[\'W\']}"',
          'assert np.allclose(p["b"], [0]), f"b: 0.5 − 0.5 = 0; got {p[\'b\']}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'for k in p:\n    ...',
        explain: 'Keeping parameters in a dict makes the step one loop.',
      },
    ],
  },

  // ------------------------------------------------------------------ 12
  {
    id: 'f8-12',
    title: 'Checkpoint: neural networks',
    summary: 'Neurons, layers as matrix multiplies, the forward pass and backpropagation, all together.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions from the whole unit: neurons, layers, the forward pass and backpropagation. Get 8 right first time to test out of the unit.',
    },
    exercises: [
      {
        id: 'f8-12-1',
        type: 'predict-output',
        prompt: 'Type what the neuron outputs after ReLU.',
        code: `x = np.array([2.0, 3.0])
w = np.array([1.0, -1.0])
b = 0.5
print(max(0.0, w @ x + b))`,
        answer: '0.0',
        typedWrong: [
          { answer: '-0.5', why: 'ReLU turns the negative sum into 0.' },
          { answer: '5.5', why: 'The second weight is −1: 2 − 3 + 0.5.' },
        ],
        explain: '2 − 3 + 0.5 = −0.5, and ReLU gives 0.',
      },
      {
        id: 'f8-12-2',
        type: 'figure',
        prompt: 'Raise neuron 2\'s first weight until neuron 2 outputs 3.',
        figure: { kind: 'neuron', x: [1, 2], W: [[1, 1], [-1, 1]], b: [0, 0], act: 'relu', matrix: true, editable: [[1, 0]], goal: { neuron: 1, output: 3 } },
        explain: 'w × 1 + 1 × 2 = 3 needs w = 1.',
      },
      {
        id: 'f8-12-3',
        type: 'predict-shape',
        prompt: '64 examples with 20 features, a layer of 10 neurons. Shape of the output?',
        code: `X = np.zeros((64, 20))
W = np.zeros((10, 20))
b = np.zeros(10)`,
        target: 'X @ W.T + b',
        answer: '(64, 10)',
        explain: '(examples, neurons).',
      },
      {
        id: 'f8-12-4',
        type: 'mcq',
        prompt: 'A layer has 10 neurons reading 20 inputs. How many weights and biases?',
        options: [
          { text: '200 weights, 10 biases' },
          { text: '30 weights, 10 biases', why: 'Every neuron has a weight for every input: 10 × 20.' },
          { text: '200 weights, 20 biases', why: 'One bias per neuron, not per input.' },
        ],
        answer: 0,
        explain: 'W is (10, 20) and b is (10,).',
      },
      {
        id: 'f8-12-5',
        type: 'predict-output',
        prompt: 'A two-layer forward pass. What does this print?',
        code: `x = np.array([2.0, 1.0])
W1 = np.array([[1.0, -1.0],
               [-1.0, 1.0]])
W2 = np.array([[2.0, 2.0]])
h = np.maximum(0, W1 @ x)
print(h, W2 @ h)`,
        answer: '[1. 0.] [2.]',
        options: [
          { text: '[1. 0.] [2.]' },
          { text: '[ 1. -1.] [0.]', why: 'ReLU turns the −1 into 0.' },
          { text: '[1. 0.] [4.]', why: 'Only the first hidden value is 1: 2 × 1 + 2 × 0.' },
        ],
        explain: 'Hidden [1, 0]; output 2.',
      },
      {
        id: 'f8-12-6',
        type: 'mcq',
        prompt: 'Why does a network need activations between its layers?',
        options: [
          { text: 'Without them, layers merge into one' },
          { text: 'To make it run faster', why: 'They add work; their job is to let the network bend.' },
          { text: 'To keep the outputs between 0 and 1', why: 'ReLU outputs are not capped at 1; the point is non-linearity.' },
        ],
        answer: 0,
        explain: 'W2 @ W1 is one matrix.',
      },
      {
        id: 'f8-12-7',
        type: 'predict-output',
        prompt: 'Type dw.',
        code: `x, y, w = 2.0, 1.0, 2.0
out = w * x
dw = 2 * (out - y) * x
print(dw)`,
        answer: '12.0',
        typedWrong: [
          { answer: '6.0', why: 'That is dout; multiply by x = 2.' },
          { answer: '3.0', why: 'Keep the 2 from the square and the x: 2 × 3 × 2.' },
        ],
        explain: 'out = 4; 2 × (4 − 1) × 2 = 12.',
      },
      {
        id: 'f8-12-8',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `X = np.ones((4, 3))
W = np.ones((2, 3))
dZ = np.ones((4, 2))
dW = dZ @ X.T
W -= 0.1 * dW`,
        error: 'ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0...',
        answer: 3,
        lineWhy: {
          '0': '4 examples, 3 inputs.',
          '1': '2 neurons on 3 inputs.',
          '2': 'One gradient per example and neuron.',
          '4': 'The step is right once dW has W\'s shape.',
        },
        explain: 'dW = dZ.T @ X, shape (2, 3) like W.',
      },
      {
        id: 'f8-12-9',
        type: 'fill-blank',
        prompt: 'Back through the ReLU, then to the weights.',
        code: `X = np.array([[1.0, 1.0]])
Z = np.array([[2.0, -2.0]])
dH = np.array([[1.0, 1.0]])
dZ = dH * (Z ___ 0)
print(dZ.T @ X)`,
        answer: ['>'],
        distractors: [
          { text: '<', why: 'The gradient flows where ReLU let the value through: Z > 0.' },
          { text: '!=', why: 'Negative inputs were blocked by ReLU, so their gradient is 0.' },
        ],
        expectOutput: '[[1. 1.]\n [0. 0.]]',
        explain: 'Only the first neuron gets a gradient.',
      },
      {
        id: 'f8-12-10',
        type: 'run-code',
        prompt: 'Set `dW` to the weight gradient of the layer Z = X @ W.T + b.',
        before: `X = np.array([[1.0, 0.0],
              [0.0, 2.0]])
dZ = np.array([[3.0],
               [1.0]])`,
        solution: 'dW = dZ.T @ X',
        tests: 'assert np.allclose(dW, [[3, 2]]), f"[[3×1 + 1×0, 3×0 + 1×2]] = [[3, 2]]; got {dW}"',
        placeholder: 'dW = ...',
        explain: 'The same shape as W: (1, 2).',
      },
    ],
  },
];
