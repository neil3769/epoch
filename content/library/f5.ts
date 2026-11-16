import type { LibraryPage } from '../schema';

/** Unit F5 summary page: unlocked in the Library when the unit is finished. */
export const f5Library: LibraryPage = {
  unit: 'F5',
  ideas: [
    {
      title: 'Slope and derivative',
      text: 'Slope is rise over run. On a curve it changes from place to place, so the derivative measures it at one point: nudge x by a tiny h and divide the change in output by h. Read it as "how much the output moves per small nudge of the input": change ≈ derivative × nudge.',
    },
    {
      title: 'Rules',
      text: 'xⁿ → n·xⁿ⁻¹; a constant → 0; a sum → the sum of the derivatives. Check any rule (or any gradient code) by nudging.',
    },
    {
      title: 'Downhill and gradient descent',
      text: 'A positive derivative means the function rises to the right, so downhill is to the left; at a minimum the derivative is 0. Gradient descent repeats x ← x − lr × slope. The learning rate sets the step: too small is slow, too large overshoots and can diverge.',
    },
    {
      title: 'Partial derivatives and the gradient',
      text: 'With several inputs, nudge one and hold the rest: a partial derivative. The gradient is the vector of all of them, with the same shape as the inputs; it points uphill, so training steps p ← p − lr × gradient.',
    },
    {
      title: 'The chain rule',
      text: 'When x feeds u and u feeds y, the rates multiply: dy/dx = dy/du × du/dx. For a = w·x and loss = (a − t)², dL/dw = 2(a − t) × x. Backpropagation is this, applied layer by layer.',
    },
  ],
  rules: [
    'Derivative ≈ (f(x + h) − f(x)) / h, h tiny.',
    'xⁿ → n·xⁿ⁻¹; constant → 0; sums add.',
    'Positive slope: go left. Negative: go right.',
    'Update: x = x − lr * slope.',
    'Loss growing every step: lower the rate.',
    'The gradient has the shape of the weights.',
    'Chained rates multiply.',
  ],
  example: {
    code: [
      'def grad(p):  # f = (x-3)² + 2(y+1)²',
      '    x, y = p',
      '    return np.array([2 * (x - 3),',
      '                     4 * (y + 1)])',
      '',
      'p = np.array([0.0, 0.0])',
      'for _ in range(100):',
      '    p = p - 0.1 * grad(p)',
      'print(np.round(p, 3))',
    ].join('\n'),
    output: '[ 3. -1.]',
    notes: [
      'Each partial comes from the power rule and the chain rule: (y + 1)² has slope 2(y + 1), times the 2 in front.',
      'Each step moves against the gradient, by a tenth of it.',
      'After 100 steps p is at the bottom, (3, −1), where the gradient is 0.',
    ],
  },
  mistakes: [
    { mistake: 'Using a large nudge h.', fix: 'Use something tiny (1e-5 or 1e-6) so it measures one point.' },
    { mistake: 'Adding the gradient.', fix: 'Subtract it: the gradient points uphill.' },
    { mistake: 'A learning rate that is too large.', fix: 'If the loss grows, lower the rate.' },
    { mistake: 'Nudging all inputs at once for a partial.', fix: 'Copy the inputs and nudge one entry.' },
    { mistake: 'Adding chained rates.', fix: 'Multiply them.' },
  ],
  forReal:
    'Real frameworks compute exact gradients for you (automatic differentiation, unit F9), but they are checked exactly as here, by comparing with nudges. To go further, work through the derivative of a small function by hand and confirm it with a nudge, then watch a loss curve while you change the learning rate in a real training run.',
};
