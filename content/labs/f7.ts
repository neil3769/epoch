import type { Lab } from '../schema';

/*
 * Unit F7 labs. Lab 1 fits a line by hand, with scaffolding. Lab 2 starts
 * every step from an empty function and runs the whole workflow: split,
 * fit with gradient descent in NumPy, measure, build polynomial features,
 * and choose a degree by validation loss.
 */
export const f7Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f7-lab-1',
    title: 'Fit a line by hand',
    intro: 'Write linear regression one piece at a time: predictions, the loss, its gradients, and the training loop, then watch it find the line.',
    summary: 'You wrote linear regression from scratch: predict, MSE, gradients and the training loop.',
    minutes: 12,
    unlockAfter: 'f7-04',
    given: [
      'x = np.array([0.0, 1.0, 2.0, 3.0])',
      'y = np.array([1.0, 3.0, 5.0, 7.0])',
    ].join('\n'),
    steps: [
      {
        goal: 'Finish `predict(w, b, x)`: the line\'s predictions.',
        starter: 'def predict(w, b, x):\n    return ___',
        solution: 'def predict(w, b, x):\n    return w * x + b',
        tests: 'assert np.allclose(predict(2, 1, x), y), "w = 2, b = 1 is the true line"\nassert np.allclose(predict(0, 0, x), 0), "all zeros"',
        hints: ['Slope times input, plus the bias.', 'def predict(w, b, x):\n    return w ___ x + b'],
      },
      {
        goal: 'Finish `mse(pred, y)`: the mean squared error.',
        starter: 'def mse(pred, y):\n    return ___',
        solution: 'def mse(pred, y):\n    return ((pred - y) ** 2).mean()',
        tests: 'assert mse(y, y) == 0, "perfect predictions: 0"\nassert abs(mse(np.zeros(4), y) - 21) < 1e-9, f"(1 + 9 + 25 + 49) / 4 = 21; got {mse(np.zeros(4), y)}"',
        hints: ['Difference, square, mean.', 'def mse(pred, y):\n    return ((pred - y) ** ___).mean()'],
      },
      {
        goal: 'Finish `grads(w, b, x, y)`: return `(dw, db)`, the gradients of the MSE.',
        starter: 'def grads(w, b, x, y):\n    err = predict(w, b, x) - y\n    dw = ___\n    db = ___\n    return dw, db',
        solution: 'def grads(w, b, x, y):\n    err = predict(w, b, x) - y\n    dw = (2 * err * x).mean()\n    db = (2 * err).mean()\n    return dw, db',
        tests: [
          'dw, db = grads(0.0, 0.0, x, y)',
          'assert abs(dw + 17) < 1e-9 and abs(db + 8) < 1e-9, f"at w = b = 0: dw = -17, db = -8; got {dw}, {db}"',
          'assert np.allclose(grads(2.0, 1.0, x, y), (0, 0)), "zero at the true line"',
        ].join('\n'),
        hints: ['mean(2·err·x) for w; mean(2·err) for b.', 'def grads(w, b, x, y):\n    err = predict(w, b, x) - y\n    dw = (2 * err * ___).mean()\n    db = (2 * err).mean()\n    return dw, db'],
        explain: 'Check them by nudging if in doubt: they agree.',
      },
      {
        goal: 'Finish `train(x, y, lr, epochs)`: start from w = b = 0, run gradient descent, and return `(w, b)`.',
        starter: 'def train(x, y, lr, epochs):\n    w, b = 0.0, 0.0\n    for _ in range(epochs):\n        dw, db = grads(w, b, x, y)\n        w = ___\n        b = ___\n    return w, b',
        solution: 'def train(x, y, lr, epochs):\n    w, b = 0.0, 0.0\n    for _ in range(epochs):\n        dw, db = grads(w, b, x, y)\n        w = w - lr * dw\n        b = b - lr * db\n    return w, b',
        tests: [
          'w, b = train(x, y, 0.05, 2000)',
          'assert abs(w - 2) < 1e-3 and abs(b - 1) < 1e-3, f"should find y = 2x + 1; got w={w}, b={b}"',
          'w, b = train(x, y, 0.05, 1)',
          'assert abs(w - 0.85) < 1e-9, f"one epoch from 0 gives w = 0.85; got {w}"',
        ].join('\n'),
        hints: ['Each parameter steps against its own gradient.', 'def train(x, y, lr, epochs):\n    w, b = 0.0, 0.0\n    for _ in range(epochs):\n        dw, db = grads(w, b, x, y)\n        w = w - lr * ___\n        b = b - lr * ___\n    return w, b'],
        explain: 'That is the whole of training: the rest of ML adds bigger models and better data handling.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f7-lab-2',
    title: 'Train, validate, choose',
    intro:
      'Run the real workflow: split the data, fit a model with many features by gradient descent, measure it, build polynomial features, and pick the polynomial degree by validation loss. Every step starts from an empty function.',
    summary: 'You split data, trained a multi-feature model, and chose its flexibility on held-out data.',
    minutes: 18,
    unlockAfter: 'f7-10',
    given: [
      'rng = np.random.default_rng(0)',
      'xs = np.linspace(-1, 1, 30)',
      'noise = rng.normal(0, 0.1, 30)',
      'ys = 1 + 2 * xs - 3 * xs ** 2 + noise',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `split(n, frac, seed=0)`: shuffle the indices 0..n−1 with `np.random.default_rng(seed).permutation(n)` and return `(train_idx, val_idx)`, with the first `int(frac * n)` for training.',
        starter: 'def split(n, frac, seed=0):\n    pass',
        solution:
          'def split(n, frac, seed=0):\n    rng = np.random.default_rng(seed)\n    idx = rng.permutation(n)\n    k = int(frac * n)\n    return idx[:k], idx[k:]',
        tests: [
          'tr, va = split(30, 0.8)',
          'assert len(tr) == 24 and len(va) == 6, f"24 and 6; got {len(tr)}, {len(va)}"',
          'assert len(set(tr) | set(va)) == 30 and not set(tr) & set(va), "every index once, in one part"',
          'assert list(split(30, 0.8)[0]) == list(tr), "the same seed gives the same split"',
        ].join('\n'),
        hints: [
          'Make the generator, permute, cut at k.',
          'def split(n, frac, seed=0):\n    rng = np.random.default_rng(seed)\n    idx = rng.permutation(___)\n    k = int(frac * n)\n    return idx[:k], idx[___:]',
        ],
        explain: 'A fixed seed makes runs repeatable: essential when comparing settings.',
      },
      {
        goal: 'Write `fit(X, y, lr=0.1, epochs=3000)`: gradient descent for `X @ w + b` with MSE, starting from zeros; return `(w, b)`.',
        starter: 'def fit(X, y, lr=0.1, epochs=3000):\n    pass',
        solution:
          'def fit(X, y, lr=0.1, epochs=3000):\n    n, d = X.shape\n    w, b = np.zeros(d), 0.0\n    for _ in range(epochs):\n        err = X @ w + b - y\n        dw = 2 * X.T @ err / n\n        w = w - lr * dw\n        b = b - lr * 2 * err.mean()\n    return w, b',
        tests: [
          'X = np.column_stack([xs, xs ** 2])',
          'w, b = fit(X, ys)',
          'assert w.shape == (2,), f"one weight per feature; got {w.shape}"',
          'assert np.allclose(w, [2, -3], atol=0.15) and abs(b - 1) < 0.1, f"the data is 1 + 2x - 3x²; got w={w}, b={b}"',
        ].join('\n'),
        hints: [
          'Same loop as with one feature: err = X @ w + b − y; the weight gradient is 2·Xᵀ@err/n; the bias gradient 2·mean(err).',
          'def fit(X, y, lr=0.1, epochs=3000):\n    n, d = X.shape\n    w, b = np.zeros(d), 0.0\n    for _ in range(epochs):\n        err = X @ w + b - y\n        dw = 2 * X.___ @ err / n\n        w = w - lr * dw\n        b = b - lr * 2 * err.mean()\n    return w, ___',
        ],
      },
      {
        goal: 'Write `loss(X, y, w, b)`: the MSE of the model on `X` and `y`.',
        starter: 'def loss(X, y, w, b):\n    pass',
        solution: 'def loss(X, y, w, b):\n    err = X @ w + b - y\n    return (err ** 2).mean()',
        tests: [
          'X = np.column_stack([xs, xs ** 2])',
          'assert abs(loss(X, ys, np.zeros(2), 0.0) - (ys ** 2).mean()) < 1e-12, "with zero weights the loss is mean(y²)"',
          'w, b = fit(X, ys)',
          'assert loss(X, ys, w, b) < 0.02, f"a good fit leaves only the noise (about 0.01); got {loss(X, ys, w, b)}"',
        ].join('\n'),
        hints: ['Predict, subtract, square, mean.', 'def loss(X, y, w, b):\n    err = X @ w + b - y\n    return (err ** ___).mean()'],
      },
      {
        goal: 'Write `poly(x, d)`: an (n, d) array whose columns are x, x², …, xᵈ.',
        starter: 'def poly(x, d):\n    pass',
        solution: 'def poly(x, d):\n    ks = range(1, d + 1)\n    cols = [x ** k for k in ks]\n    return np.column_stack(cols)',
        tests: [
          'P = poly(np.array([2.0, 3.0]), 3)',
          'assert P.shape == (2, 3), f"two examples, three columns; got {P.shape}"',
          'assert np.allclose(P, [[2, 4, 8], [3, 9, 27]]), f"got {P}"',
        ].join('\n'),
        hints: [
          'Build a list of powers from 1 to d and stack them as columns with `np.column_stack`.',
          'def poly(x, d):\n    ks = range(1, ___)\n    cols = [x ** k for k in ks]\n    return np.column_stack(cols)',
        ],
        explain: 'A "linear" model on these columns fits curves: the model is linear in w, not in x.',
      },
      {
        goal: 'Write `best_degree(x, y, degrees)`: split with `split(len(x), 0.7)`, fit `poly(x, d)` on the training part for each degree, and return the degree with the lowest validation loss.',
        starter: 'def best_degree(x, y, degrees):\n    pass',
        solution:
          'def best_degree(x, y, degrees):\n    tr, va = split(len(x), 0.7)\n    def val_loss(d):\n        X = poly(x, d)\n        w, b = fit(X[tr], y[tr])\n        Xv, yv = X[va], y[va]\n        return loss(Xv, yv, w, b)\n    return min(degrees, key=val_loss)',
        tests: [
          'got = best_degree(xs, ys, [1, 2])',
          'assert got == 2, f"the data is quadratic: degree 2 beats a straight line; got {got}"',
        ].join('\n'),
        hints: [
          'For each degree: build features, fit on the training rows, score on the validation rows; take the degree with the smallest score.',
          'def best_degree(x, y, degrees):\n    tr, va = split(len(x), 0.7)\n    def val_loss(d):\n        X = poly(x, d)\n        w, b = fit(X[___], y[tr])\n        Xv, yv = X[___], y[va]\n        return loss(Xv, yv, w, b)\n    return min(degrees, key=val_loss)',
        ],
        explain: 'Chosen on validation data, never on training data: a straight line underfits, and the training loss alone would always favour the most flexible model.',
      },
    ],
  },
];
