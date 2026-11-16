import type { Lab } from '../schema';

/*
 * Unit F5 labs. Lab 1 measures slopes by nudging, with scaffolding. Lab 2
 * starts every step from an empty function and builds gradient descent in
 * NumPy: a numerical gradient, descent, a loss history, a divergence check
 * and a learning-rate search.
 */
export const f5Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f5-lab-1',
    title: 'Slopes by nudging',
    intro:
      'Measure slopes with nothing but nudges: between two points, at one point, which way is downhill, and the straight line that touches a curve.',
    summary: 'You measured slopes by nudging, found the downhill direction, and built a tangent line.',
    minutes: 10,
    unlockAfter: 'f5-04',
    steps: [
      {
        goal: 'Finish `slope(p, q)`: the slope between points `p` and `q`, each an `(x, y)` pair.',
        starter: 'def slope(p, q):\n    (x1, y1), (x2, y2) = p, q\n    return ___',
        solution: 'def slope(p, q):\n    (x1, y1), (x2, y2) = p, q\n    return (y2 - y1) / (x2 - x1)',
        tests: [
          'assert slope((1, 3), (3, 7)) == 2, f"rise 4 over run 2; got {slope((1, 3), (3, 7))}"',
          'assert slope((0, 5), (5, 0)) == -1, "a falling line has a negative slope"',
        ].join('\n'),
        hints: ['Rise over run: the change in y divided by the change in x.', 'def slope(p, q):\n    (x1, y1), (x2, y2) = p, q\n    return (y2 - y1) / (___ - ___)'],
      },
      {
        goal: 'Finish `nudge(f, x, h=1e-5)`: the derivative of `f` at `x`, nudging both ways: (f(x + h) − f(x − h)) / 2h.',
        starter: 'def nudge(f, x, h=1e-5):\n    up = f(x + h)\n    down = f(x - h)\n    return (up - down) / ___',
        solution: 'def nudge(f, x, h=1e-5):\n    up = f(x + h)\n    down = f(x - h)\n    return (up - down) / (2 * h)',
        tests: [
          'assert abs(nudge(lambda x: x ** 2, 3) - 6) < 1e-6, "slope of x² at 3 is 6"',
          'assert abs(nudge(lambda x: x ** 3, 2) - 12) < 1e-6, "slope of x³ at 2 is 12"',
          'assert abs(nudge(lambda x: 5.0, 9) - 0) < 1e-9, "a constant has slope 0"',
        ].join('\n'),
        hints: ['The two points are 2h apart.', 'def nudge(f, x, h=1e-5):\n    up = f(x + h)\n    down = f(x - h)\n    return (up - down) / (___ * h)'],
        explain: 'Nudging both ways is much more accurate than nudging one way, for the same h.',
      },
      {
        goal: 'Finish `downhill(f, x)`: "left" if the slope at x is positive, "right" if negative, "flat" if its size is below 1e-6.',
        starter: 'def downhill(f, x):\n    d = nudge(f, x)\n    if abs(d) < 1e-6:\n        return ___\n    if d > 0:\n        return ___\n    return "right"',
        solution: 'def downhill(f, x):\n    d = nudge(f, x)\n    if abs(d) < 1e-6:\n        return "flat"\n    if d > 0:\n        return "left"\n    return "right"',
        tests: [
          'f = lambda x: (x - 2) ** 2',
          'assert downhill(f, 5) == "left", "at 5 the bowl rises to the right: go left"',
          'assert downhill(f, -1) == "right", "at -1 go right, towards 2"',
          'assert downhill(f, 2) == "flat", "at the bottom it is flat"',
        ].join('\n'),
        hints: ['Positive slope: the function rises to the right, so downhill is left.', 'def downhill(f, x):\n    d = nudge(f, x)\n    if abs(d) < 1e-6:\n        return "flat"\n    if d ___ 0:\n        return "left"\n    return "right"'],
      },
      {
        goal: 'Finish `tangent(f, x)`: the line y = m·t + b that touches f at x, as `(m, b)`: m is the slope there, and the line passes through (x, f(x)).',
        starter: 'def tangent(f, x):\n    m = nudge(f, x)\n    b = ___\n    return m, b',
        solution: 'def tangent(f, x):\n    m = nudge(f, x)\n    b = f(x) - m * x\n    return m, b',
        tests: [
          'm, b = tangent(lambda x: x ** 2, 3)',
          'assert abs(m - 6) < 1e-6 and abs(b + 9) < 1e-5, f"the tangent to x² at 3 is y = 6t - 9; got m={m}, b={b}"',
          'm, b = tangent(lambda x: 2 * x + 1, 10)',
          'assert abs(m - 2) < 1e-6 and abs(b - 1) < 1e-4, "a line is its own tangent"',
        ].join('\n'),
        hints: ['The line must give f(x) at x: f(x) = m·x + b, so solve for b.', 'def tangent(f, x):\n    m = nudge(f, x)\n    b = f(x) - ___ * x\n    return m, b'],
        explain: 'Near x the curve and this line are almost the same: that is what a derivative means.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f5-lab-2',
    title: 'Gradient descent from scratch',
    intro:
      'Build gradient descent in NumPy for any function of several inputs: a gradient by nudging, the descent loop, a loss history, a divergence check, and a search for the best learning rate. Every step starts from an empty function.',
    summary: 'You built gradient descent from scratch and used it to compare learning rates.',
    minutes: 16,
    unlockAfter: 'f5-09',
    given: [
      'def bowl(p):',
      '    x, y = p',
      '    return ((x - 3) ** 2',
      '            + 2 * (y + 1) ** 2)',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `grad(f, p, h=1e-6)`: the gradient of `f` at the NumPy array `p`, nudging one entry at a time.',
        starter: 'def grad(f, p, h=1e-6):\n    pass',
        solution:
          'def grad(f, p, h=1e-6):\n    g = np.zeros_like(p)\n    for i in range(len(p)):\n        q = p.copy()\n        q[i] += h\n        g[i] = (f(q) - f(p)) / h\n    return g',
        tests: [
          'g = grad(bowl, np.array([0.0, 0.0]))',
          'assert g.shape == (2,), f"one partial per input; got shape {g.shape}"',
          'assert np.allclose(g, [-6, 4], atol=1e-3), f"at (0, 0): 2(x-3) = -6, 4(y+1) = 4; got {g}"',
        ].join('\n'),
        hints: [
          'Make an array of zeros like p; for each index, copy p, nudge that entry, and store the change divided by h.',
          'def grad(f, p, h=1e-6):\n    g = np.zeros_like(p)\n    for i in range(len(p)):\n        q = p.___()\n        q[i] += h\n        g[i] = (f(q) - f(p)) / ___\n    return g',
        ],
        explain: 'Copying matters: nudging p itself would leave every later partial off by h.',
      },
      {
        goal: 'Write `descend(f, p, lr, steps)`: take `steps` steps of p ← p − lr × grad, and return the final p.',
        starter: 'def descend(f, p, lr, steps):\n    pass',
        solution: 'def descend(f, p, lr, steps):\n    for _ in range(steps):\n        p = p - lr * grad(f, p)\n    return p',
        tests: [
          'p = descend(bowl, np.array([0.0, 0.0]), 0.1, 200)',
          'assert np.allclose(p, [3, -1], atol=1e-3), f"the bottom of the bowl is (3, -1); got {p}"',
        ].join('\n'),
        hints: ['Loop `steps` times, stepping against the gradient.', 'def descend(f, p, lr, steps):\n    for _ in range(steps):\n        p = p ___ lr * grad(f, p)\n    return p'],
      },
      {
        goal: 'Write `history(f, p, lr, steps)`: the list of f values at the start and after each step (so `steps + 1` numbers).',
        starter: 'def history(f, p, lr, steps):\n    pass',
        solution: 'def history(f, p, lr, steps):\n    out = [f(p)]\n    for _ in range(steps):\n        p = p - lr * grad(f, p)\n        out.append(f(p))\n    return out',
        tests: [
          'h = history(bowl, np.array([0.0, 0.0]), 0.1, 10)',
          'assert len(h) == 11, f"start plus 10 steps; got {len(h)} values"',
          'assert abs(h[0] - 11) < 1e-9, f"bowl(0, 0) = 9 + 2 = 11; got {h[0]}"',
          'assert all(a > b for a, b in zip(h, h[1:])), "with a good rate the loss falls every step"',
        ].join('\n'),
        hints: ['Record f(p) before the loop and after each step.', 'def history(f, p, lr, steps):\n    out = [f(p)]\n    for _ in range(steps):\n        p = p - lr * grad(f, p)\n        out.___(f(p))\n    return out'],
        explain: 'This is the loss curve you will plot for every model you train.',
      },
      {
        goal: 'Write `diverges(f, p, lr, steps=20)`: True if the last value in the history is larger than the first.',
        starter: 'def diverges(f, p, lr, steps=20):\n    pass',
        solution: 'def diverges(f, p, lr, steps=20):\n    h = history(f, p, lr, steps)\n    return h[-1] > h[0]',
        tests: [
          'p0 = np.array([0.0, 0.0])',
          'assert not diverges(bowl, p0, 0.1), "0.1 converges on the bowl"',
          'assert diverges(bowl, p0, 0.6), "0.6 overshoots the steep y direction"',
        ].join('\n'),
        hints: ['Compare the last loss with the first.', 'def diverges(f, p, lr, steps=20):\n    h = history(f, p, lr, steps)\n    return h[___] > h[0]'],
        explain: 'The y direction is twice as steep, so it is the first to overshoot.',
      },
      {
        goal: 'Write `best_lr(f, p, lrs, steps=10)`: the rate in `lrs` whose history ends with the lowest value.',
        starter: 'def best_lr(f, p, lrs, steps=10):\n    pass',
        solution:
          'def best_lr(f, p, lrs, steps=10):\n    def final(lr):\n        h = history(f, p, lr, steps)\n        return h[-1]\n    return min(lrs, key=final)',
        tests: [
          'p0 = np.array([0.0, 0.0])',
          'got = best_lr(bowl, p0, [0.01, 0.1, 0.25, 0.6])',
          'assert got == 0.25, f"0.25 lands on the bottom fastest here; got {got}"',
        ].join('\n'),
        hints: ['Score each rate by its final loss and take the smallest with `min(..., key=...)`.', 'def best_lr(f, p, lrs, steps=10):\n    def final(lr):\n        h = history(f, p, lr, steps)\n        return h[___]\n    return min(lrs, key=___)'],
        explain: 'Too small is slow, too large diverges: the best rate sits just below where overshooting starts.',
      },
    ],
  },
];
