import type { Lab } from '../schema';

/*
 * Unit F8 labs. Lab 1 builds a network's forward pass with scaffolding.
 * Lab 2 starts every step from an empty function and builds a two-layer
 * network that learns |x|: forward, loss, the backward pass (checked against
 * nudging in its tests), the update, and the training loop.
 */
export const f8Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f8-lab-1',
    title: 'A forward pass by hand',
    intro: 'Build a small network\'s forward pass from its parts: ReLU, a layer, two layers chained, the loss, and a count of what it learns.',
    summary: 'You built a two-layer network\'s forward pass and measured it.',
    minutes: 10,
    unlockAfter: 'f8-07',
    given: [
      'X = np.array([[1.0, 2.0],',
      '              [-1.0, 0.5]])',
      'y = np.array([[3.0], [0.0]])',
      'W1 = np.array([[1.0, -1.0],',
      '               [0.5, 1.0],',
      '               [-1.0, 0.0]])',
      'b1 = np.array([0.0, 0.5, 0.0])',
      'W2 = np.array([[1.0, 1.0, 2.0]])',
      'b2 = np.array([0.5])',
    ].join('\n'),
    steps: [
      {
        goal: 'Finish `relu(z)`.',
        starter: 'def relu(z):\n    return np.___(0, z)',
        solution: 'def relu(z):\n    return np.maximum(0, z)',
        tests: [
          'assert np.allclose(relu(np.array([-2.0, 0.0, 3.0])), [0, 0, 3]), "negatives become 0"',
          'assert relu(np.array([[-1.0, 1.0]])).shape == (1, 2), "keep the shape"',
        ].join('\n'),
        hints: ['Compare every value with 0 and keep the larger.', 'def relu(z):\n    return np.___(0, z)'],
      },
      {
        goal: 'Finish `dense(X, W, b)`: a layer applied to every row of X, with W stored as (neurons, inputs).',
        starter: 'def dense(X, W, b):\n    return X @ ___ + b',
        solution: 'def dense(X, W, b):\n    return X @ W.T + b',
        tests: [
          'Z = dense(X, W1, b1)',
          'assert Z.shape == (2, 3), f"2 examples, 3 neurons; got {Z.shape}"',
          'assert np.allclose(Z[0], [-1, 3, -1]), f"first example: [-1, 3, -1]; got {Z[0]}"',
        ].join('\n'),
        hints: ['W\'s rows are neurons; the examples need its transpose.', 'def dense(X, W, b):\n    return X @ W.___ + b'],
      },
      {
        goal: 'Finish `forward(X)`: the hidden layer with ReLU, then the output layer.',
        starter: 'def forward(X):\n    H = relu(dense(X, W1, b1))\n    return dense(___, W2, b2)',
        solution: 'def forward(X):\n    H = relu(dense(X, W1, b1))\n    return dense(H, W2, b2)',
        tests: [
          'out = forward(X)',
          'assert out.shape == (2, 1), f"one output per example; got {out.shape}"',
          'assert np.allclose(out, [[3.5], [3.0]]), f"expected [[3.5], [3.0]]; got {out.ravel()}"',
        ].join('\n'),
        hints: ['The output layer reads the activated hidden values.', 'def forward(X):\n    H = relu(dense(X, W1, b1))\n    return dense(___, W2, b2)'],
        explain: 'Example 1: hidden [0, 3, 0], output 3 + 0.5.',
      },
      {
        goal: 'Finish `mse(out, y)`.',
        starter: 'def mse(out, y):\n    return ((out - y) ___ 2).mean()',
        solution: 'def mse(out, y):\n    return ((out - y) ** 2).mean()',
        tests: [
          'assert mse(y, y) == 0, "perfect predictions: 0"',
          'assert abs(mse(forward(X), y) - 4.625) < 1e-9, f"(0.25 + 9) / 2 = 4.625; got {mse(forward(X), y)}"',
        ].join('\n'),
        hints: ['Square the misses, then average.', 'def mse(out, y):\n    return ((out - y) ___ 2).mean()'],
      },
      {
        goal: 'Finish `count_params(*arrays)`: the total number of values in the arrays.',
        starter: 'def count_params(*arrays):\n    return sum(a.___ for a in arrays)',
        solution: 'def count_params(*arrays):\n    return sum(a.size for a in arrays)',
        tests: [
          'n = count_params(W1, b1, W2, b2)',
          'assert n == 13, f"6 + 3 + 3 + 1 = 13; got {n}"',
        ].join('\n'),
        hints: ['Each array knows how many values it holds.', 'def count_params(*arrays):\n    return sum(a.___ for a in arrays)'],
        explain: 'A large language model has billions of these; the counting is the same.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f8-lab-2',
    title: 'Backprop a two-layer network',
    intro:
      'Train a two-layer network to learn y = |x| with gradients you write yourself: the forward pass, the loss, the backward pass (the tests check it against nudging), the update, and the loop. Every step starts from an empty function.',
    summary: 'You wrote backpropagation for a two-layer network and trained it to fit a curve.',
    minutes: 18,
    unlockAfter: 'f8-11',
    given: [
      'x = np.linspace(-1, 1, 16)',
      'X = x.reshape(-1, 1)',
      'y = np.abs(X)',
      '',
      'def init(h, seed=0):',
      '    r = np.random.default_rng(seed)',
      '    p = {}',
      '    p["W1"] = r.normal(0, 1, (h, 1))',
      '    p["b1"] = r.normal(0, 0.1, h)',
      '    p["W2"] = r.normal(0, 0.5, (1, h))',
      '    p["b2"] = np.zeros(1)',
      '    return p',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `forward(X, p)`: hidden layer `Z1 = X @ W1.T + b1`, `H = relu(Z1)`, output `H @ W2.T + b2`. Return `(out, Z1, H)`.',
        starter: 'def forward(X, p):\n    pass',
        solution:
          'def forward(X, p):\n    Z1 = X @ p["W1"].T + p["b1"]\n    H = np.maximum(0, Z1)\n    out = H @ p["W2"].T + p["b2"]\n    return out, Z1, H',
        tests: [
          'q = {"W1": np.array([[1.0], [-1.0]]), "b1": np.zeros(2),',
          '     "W2": np.array([[1.0, 1.0]]), "b2": np.array([0.5])}',
          'out, Z1, H = forward(np.array([[2.0], [-3.0]]), q)',
          'assert out.shape == (2, 1), f"one output per example; got {out.shape}"',
          'assert np.allclose(out.ravel(), [2.5, 3.5]), f"|x| + 0.5 here: [2.5, 3.5]; got {out.ravel()}"',
          'assert np.allclose(Z1, [[2, -2], [-3, 3]]), "return Z1, the sums before ReLU"',
          'assert np.allclose(H, [[2, 0], [0, 3]]), "return H, the values after ReLU"',
        ].join('\n'),
        hints: [
          'Three lines: the sums, ReLU, the output layer. Return all three results.',
          'def forward(X, p):\n    Z1 = X @ p["W1"].___ + p["b1"]\n    H = np.maximum(0, ___)\n    out = H @ p["W2"].T + p["b2"]\n    return out, Z1, H',
        ],
      },
      {
        goal: 'Write `mse(out, y)` and `grad_out(out, y)`: the loss, and its gradient with respect to `out`, which is `2 * (out - y) / out.size`.',
        starter: 'def mse(out, y):\n    pass',
        solution: 'def mse(out, y):\n    return ((out - y) ** 2).mean()\n\ndef grad_out(out, y):\n    return 2 * (out - y) / out.size',
        tests: [
          'a = np.array([[1.0], [3.0]])',
          'b = np.array([[0.0], [1.0]])',
          'assert abs(mse(a, b) - 2.5) < 1e-12, f"(1 + 4) / 2 = 2.5; got {mse(a, b)}"',
          'assert np.allclose(grad_out(a, b), [[1], [2]]), f"2 × [1, 2] / 2 = [1, 2]; got {grad_out(a, b)}"',
        ].join('\n'),
        hints: [
          'The mean divides by the number of values, so the gradient does too.',
          'def mse(out, y):\n    return ((out - y) ** 2).mean()\n\ndef grad_out(out, y):\n    return 2 * (out - y) / ___',
        ],
        explain: 'The /out.size comes from the mean: each example\'s share of the loss.',
      },
      {
        goal: 'Write `backward(X, p, Z1, H, dout)`: return a dict of gradients with the same keys and shapes as `p`.',
        starter: 'def backward(X, p, Z1, H, dout):\n    pass',
        solution:
          'def backward(X, p, Z1, H, dout):\n    dH = dout @ p["W2"]\n    dZ1 = dH * (Z1 > 0)\n    return {"W2": dout.T @ H,\n            "b2": dout.sum(axis=0),\n            "W1": dZ1.T @ X,\n            "b1": dZ1.sum(axis=0)}',
        tests: [
          'q = init(3, seed=1)',
          'Xs = np.array([[0.5], [-1.0], [2.0]])',
          'ys = np.array([[1.0], [0.0], [2.0]])',
          'out, Z1, H = forward(Xs, q)',
          'g = backward(Xs, q, Z1, H, grad_out(out, ys))',
          'assert isinstance(g, dict) and set(g) == set(q), f"return a dict with keys W1, b1, W2, b2; got {g}"',
          'for k in q:',
          '    assert g[k].shape == q[k].shape, f"g[\'{k}\'] should have the shape of {k}, {q[k].shape}; got {g[k].shape}"',
          '    num = np.zeros_like(q[k])',
          '    for i in np.ndindex(q[k].shape):',
          '        old = q[k][i]',
          '        q[k][i] = old + 1e-6',
          '        up = mse(forward(Xs, q)[0], ys)',
          '        q[k][i] = old - 1e-6',
          '        dn = mse(forward(Xs, q)[0], ys)',
          '        q[k][i] = old',
          '        num[i] = (up - dn) / 2e-6',
          '    assert np.allclose(g[k], num, atol=1e-5), f"g[\'{k}\'] disagrees with nudging: {g[k].ravel()} vs {num.ravel()}"',
        ].join('\n'),
        hints: [
          'Output layer first: dW2 = dout.T @ H, db2 = dout summed over examples. Then back through W2 and the ReLU mask to get dZ1, and the same two formulas with X.',
          'def backward(X, p, Z1, H, dout):\n    dH = dout @ p["W2"]\n    dZ1 = dH * (Z1 ___ 0)\n    return {"W2": dout.T @ ___,\n            "b2": dout.sum(axis=0),\n            "W1": dZ1.T @ X,\n            "b1": dZ1.sum(axis=___)}',
        ],
        explain: 'The tests nudged every weight and compared: your backward pass is right.',
      },
      {
        goal: 'Write `step(p, g, lr)`: move every parameter in `p` against its gradient in `g`.',
        starter: 'def step(p, g, lr):\n    pass',
        solution: 'def step(p, g, lr):\n    for k in p:\n        p[k] = p[k] - lr * g[k]',
        tests: [
          'q = {"w": np.array([1.0, 2.0]), "b": np.array([0.0])}',
          'step(q, {"w": np.array([1.0, -1.0]), "b": np.array([2.0])}, 0.5)',
          'assert np.allclose(q["w"], [0.5, 2.5]) and np.allclose(q["b"], [-1]), f"against the gradient; got {q}"',
        ].join('\n'),
        hints: ['Loop over the keys and update each entry of p.', 'def step(p, g, lr):\n    for k in p:\n        p[k] = p[k] - ___ * g[k]'],
      },
      {
        goal: 'Write `train(X, y, h=8, lr=0.1, n=2000)`: `p = init(h)`, then n times: forward, record the loss, backward, step. Return `(p, losses)`.',
        starter: 'def train(X, y, h=8, lr=0.1, n=2000):\n    pass',
        solution:
          'def train(X, y, h=8, lr=0.1, n=2000):\n    p = init(h)\n    losses = []\n    for _ in range(n):\n        out, Z1, H = forward(X, p)\n        losses.append(mse(out, y))\n        d = grad_out(out, y)\n        g = backward(X, p, Z1, H, d)\n        step(p, g, lr)\n    return p, losses',
        tests: [
          'p, losses = train(X, y)',
          'assert len(losses) == 2000, f"one loss per step; got {len(losses)}"',
          'assert losses[-1] < losses[0] / 10, f"the loss should fall a lot: {losses[0]:.3f} → {losses[-1]:.3f}"',
          'assert losses[-1] < 0.002, f"the network should fit |x| closely; final loss {losses[-1]:.4f}"',
          'pred = forward(np.array([[-0.5], [0.5]]), p)[0].ravel()',
          'assert np.allclose(pred, [0.5, 0.5], atol=0.1), f"|±0.5| = 0.5; got {pred}"',
        ].join('\n'),
        hints: [
          'Each pass: out, Z1, H = forward(...); append the loss; d = grad_out(...); g = backward(...); step(...).',
          'def train(X, y, h=8, lr=0.1, n=2000):\n    p = init(h)\n    losses = []\n    for _ in range(n):\n        out, Z1, H = forward(X, p)\n        losses.append(mse(out, y))\n        d = grad_out(___, y)\n        g = backward(X, p, Z1, H, ___)\n        step(p, g, lr)\n    return p, losses',
        ],
        explain: 'Eight ReLU pieces bent into a V. PyTorch writes the backward pass for you, but this is what it computes.',
      },
    ],
  },
];
