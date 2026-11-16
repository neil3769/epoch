import type { Lab } from '../schema';

/*
 * Unit F6 labs. Lab 1 writes the statistics by hand, with scaffolding. Lab 2
 * starts every step from an empty function and builds the classification
 * loss as frameworks compute it: stable softmax, row-wise softmax,
 * cross-entropy, accuracy, and the gradient with respect to the scores.
 */
export const f6Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f6-lab-1',
    title: 'Statistics by hand',
    intro: 'Write variance, standard deviation, log-likelihood and softmax yourself, so none of them is a black box.',
    summary: 'You wrote variance, standard deviation, log-likelihood and softmax from their definitions.',
    minutes: 10,
    unlockAfter: 'f6-05',
    steps: [
      {
        goal: 'Finish `variance(xs)`: the mean of the squared distances from the mean, for a plain list.',
        starter: 'def variance(xs):\n    m = sum(xs) / len(xs)\n    sq = [(x - m) ** 2 for x in xs]\n    return ___',
        solution: 'def variance(xs):\n    m = sum(xs) / len(xs)\n    sq = [(x - m) ** 2 for x in xs]\n    return sum(sq) / len(sq)',
        tests: [
          'assert variance([4, 6]) == 1, f"distances 1 and 1: variance 1; got {variance([4, 6])}"',
          'assert abs(variance([1, 3, 5]) - 8 / 3) < 1e-9, "squares 4, 0, 4: mean 8/3"',
          'assert variance([7, 7, 7]) == 0, "no spread, no variance"',
        ].join('\n'),
        hints: ['Average the squared distances.', 'def variance(xs):\n    m = sum(xs) / len(xs)\n    sq = [(x - m) ** 2 for x in xs]\n    return sum(sq) / ___'],
      },
      {
        goal: 'Finish `std(xs)`: the standard deviation, from `variance`.',
        starter: 'def std(xs):\n    return ___',
        solution: 'def std(xs):\n    return variance(xs) ** 0.5',
        tests: [
          'assert std([2, 4, 4, 4, 5, 5, 7, 9]) == 2, "the classic example has standard deviation 2"',
          'assert std([0, 10]) == 5, "back in the original units"',
        ].join('\n'),
        hints: ['The square root of the variance.', 'def std(xs):\n    return variance(xs) ** ___'],
      },
      {
        goal: 'Finish `log_likelihood(ps)`: the sum of the natural logs of the probabilities, as a plain float.',
        starter: 'def log_likelihood(ps):\n    logs = np.log(ps)\n    return float(___)',
        solution: 'def log_likelihood(ps):\n    logs = np.log(ps)\n    return float(logs.sum())',
        tests: [
          'assert abs(log_likelihood([0.5, 0.5]) + 1.3863) < 1e-4, "two halves: 2 log 0.5"',
          'assert log_likelihood([1.0]) == 0, "certainty costs nothing"',
          'big = log_likelihood([0.3] * 2000)',
          'assert abs(big + 2407.9) < 0.1, f"no underflow even for 2000 examples; got {big}"',
        ].join('\n'),
        hints: ['Add the logs up.', 'def log_likelihood(ps):\n    logs = np.log(ps)\n    return float(logs.___())'],
        explain: 'np.prod of those 2000 numbers would be 0.0.',
      },
      {
        goal: 'Finish `softmax(z)`: exponentiate the scores and divide by their total.',
        starter: 'def softmax(z):\n    e = np.exp(z)\n    return ___',
        solution: 'def softmax(z):\n    e = np.exp(z)\n    return e / e.sum()',
        tests: [
          'p = softmax(np.array([2.0, 1.0, 0.1]))',
          'assert np.allclose(p, [0.659, 0.242, 0.099], atol=1e-3), f"got {p}"',
          'assert abs(softmax(np.array([5.0, -5.0])).sum() - 1) < 1e-12, "always sums to 1"',
        ].join('\n'),
        hints: ['Divide each exponential by the sum of all of them.', 'def softmax(z):\n    e = np.exp(z)\n    return e / e.___()'],
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f6-lab-2',
    title: 'The classification loss',
    intro:
      'Build the loss every classifier trains on, the way frameworks compute it: a softmax that cannot overflow, softmax for a whole batch, mean cross-entropy, accuracy, and the gradient with respect to the scores. Every step starts from an empty function.',
    summary: 'You built stable softmax, batch cross-entropy, accuracy and the softmax-cross-entropy gradient, and checked it by nudging.',
    minutes: 16,
    unlockAfter: 'f6-09',
    steps: [
      {
        goal: 'Write `stable_softmax(z)`: softmax of a 1-D array that subtracts the largest score first, so huge scores do not overflow.',
        starter: 'def stable_softmax(z):\n    pass',
        solution: 'def stable_softmax(z):\n    e = np.exp(z - z.max())\n    return e / e.sum()',
        tests: [
          'p = stable_softmax(np.array([1000.0, 1000.0]))',
          'assert np.allclose(p, [0.5, 0.5]), f"huge equal scores: [0.5, 0.5]; got {p}"',
          'p = stable_softmax(np.array([2.0, 1.0, 0.1]))',
          'assert np.allclose(p, [0.659, 0.242, 0.099], atol=1e-3), "same result as plain softmax"',
        ].join('\n'),
        hints: ['Subtract `z.max()` before exponentiating; the shift cancels in the division.', 'def stable_softmax(z):\n    e = np.exp(z - z.___())\n    return e / e.sum()'],
      },
      {
        goal: 'Write `softmax_rows(Z)`: a stable softmax applied to each row of a 2-D array of scores.',
        starter: 'def softmax_rows(Z):\n    pass',
        solution:
          'def softmax_rows(Z):\n    m = Z.max(axis=1, keepdims=True)\n    e = np.exp(Z - m)\n    s = e.sum(axis=1, keepdims=True)\n    return e / s',
        tests: [
          'Z = np.array([[1000.0, 1000.0], [0.0, np.log(3)]])',
          'P = softmax_rows(Z)',
          'assert P.shape == (2, 2), f"same shape as Z; got {P.shape}"',
          'assert np.allclose(P, [[0.5, 0.5], [0.25, 0.75]]), f"got {P}"',
          'assert np.allclose(P.sum(axis=1), 1), "every row sums to 1"',
        ].join('\n'),
        hints: [
          'The F4 pattern: reduce along axis 1 with keepdims=True, so the results broadcast back across each row.',
          'def softmax_rows(Z):\n    m = Z.max(axis=___, keepdims=True)\n    e = np.exp(Z - m)\n    s = e.sum(axis=1, keepdims=___)\n    return e / s',
        ],
      },
      {
        goal: 'Write `cross_entropy(P, y)`: the mean of −log of each row\'s probability for its label in `y`. Clip the picked probabilities to at least 1e-12 so a 0 does not give infinity.',
        starter: 'def cross_entropy(P, y):\n    pass',
        solution:
          'def cross_entropy(P, y):\n    n = len(y)\n    p = P[np.arange(n), y]\n    p = np.clip(p, 1e-12, 1.0)\n    return -np.log(p).mean()',
        tests: [
          'P = np.array([[0.7, 0.3], [0.4, 0.6], [0.9, 0.1]])',
          'got = cross_entropy(P, np.array([0, 1, 0]))',
          'assert abs(got - 0.3243) < 1e-3, f"mean of -log [0.7, 0.6, 0.9]; got {got}"',
          'got = cross_entropy(np.array([[1.0, 0.0]]), np.array([1]))',
          'assert np.isfinite(got) and got > 20, f"a probability of 0 is clipped, not infinite; got {got}"',
        ].join('\n'),
        hints: [
          'Pick with `P[np.arange(n), y]`, clip, take −log, average.',
          'def cross_entropy(P, y):\n    n = len(y)\n    p = P[np.arange(n), ___]\n    p = np.clip(p, 1e-12, 1.0)\n    return -np.log(p).___()',
        ],
      },
      {
        goal: 'Write `accuracy(P, y)`: the fraction of rows whose most probable class equals the label.',
        starter: 'def accuracy(P, y):\n    pass',
        solution: 'def accuracy(P, y):\n    pred = P.argmax(axis=1)\n    return (pred == y).mean()',
        tests: [
          'P = np.array([[0.7, 0.3], [0.4, 0.6], [0.9, 0.1], [0.2, 0.8]])',
          'got = accuracy(P, np.array([0, 1, 1, 1]))',
          'assert abs(got - 0.75) < 1e-12, f"3 of 4 right; got {got}"',
        ].join('\n'),
        hints: ['argmax along each row, compare with y, average the mask.', 'def accuracy(P, y):\n    pred = P.argmax(axis=___)\n    return (pred == y).mean()'],
      },
      {
        goal: 'Write `grad_scores(Z, y)`: the gradient of the mean cross-entropy (of `softmax_rows(Z)`) with respect to the scores: (P − one-hot) / n. `np.eye(k)[y]` gives the one-hot rows.',
        starter: 'def grad_scores(Z, y):\n    pass',
        solution: 'def grad_scores(Z, y):\n    n, k = Z.shape\n    onehot = np.eye(k)[y]\n    P = softmax_rows(Z)\n    return (P - onehot) / n',
        tests: [
          'Z = np.array([[1.0, 2.0, 0.5], [0.3, 0.2, 0.1]])',
          'y = np.array([2, 0])',
          'G = grad_scores(Z, y)',
          'assert G.shape == Z.shape, f"one entry per score; got {G.shape}"',
          'loss = lambda Z: cross_entropy(softmax_rows(Z), y)',
          'num = np.zeros_like(Z)',
          'for i in range(2):',
          '    for j in range(3):',
          '        D = Z.copy(); D[i, j] += 1e-6',
          '        num[i, j] = (loss(D) - loss(Z)) / 1e-6',
          'assert np.allclose(G, num, atol=1e-4), f"should match nudging each score; got {G} vs {num}"',
        ].join('\n'),
        hints: [
          'Build the one-hot rows, compute P, subtract, divide by the batch size.',
          'def grad_scores(Z, y):\n    n, k = Z.shape\n    onehot = np.eye(k)[___]\n    P = softmax_rows(Z)\n    return (P - onehot) / ___',
        ],
        explain: 'Checked against nudging, as in F5: the formula frameworks use is right.',
      },
    ],
  },
];
