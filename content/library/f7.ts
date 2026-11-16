import type { LibraryPage } from '../schema';

/** Unit F7 summary page: unlocked in the Library when the unit is finished. */
export const f7Library: LibraryPage = {
  unit: 'F7',
  ideas: [
    {
      title: 'Model, parameters, loss',
      text: 'A model is a function with adjustable numbers: prediction = w·x + b, or X @ w + b with many features. A loss turns "how wrong" into one number; mean squared error averages the squared misses, so large misses dominate and signs cannot cancel.',
    },
    {
      title: 'Gradients and the loop',
      text: 'With err = prediction − y: ∂L/∂w = mean(2·err·x) (for many features, 2·Xᵀ@err/n) and ∂L/∂b = mean(2·err). Training repeats predict, error, gradients, step against them. One pass over the data is an epoch.',
    },
    {
      title: 'The learning rate',
      text: 'Too small and the loss crawls down; too large and it bounces or grows. Watch the loss every epoch. Features on very different scales make one rate impossible to pick, so standardise them first.',
    },
    {
      title: 'Held-out data',
      text: 'Training scores are optimistic. Shuffle, split off a validation set, and judge the model there. Compute anything learned from data (means, spreads) on the training part only. Keep a test set untouched for one final score.',
    },
    {
      title: 'Overfitting and choosing',
      text: 'A too-flexible model memorises noise: training loss falls while validation loss rises. Use validation loss to pick flexibility (such as polynomial degree) and when to stop (early stopping). More data and simpler models reduce overfitting.',
    },
  ],
  rules: [
    'pred = X @ w + b; err = pred − y.',
    'MSE = mean(err²).',
    'dw = 2·Xᵀ@err/n; db = 2·mean(err).',
    'w −= lr·dw; b −= lr·db.',
    'Rising or jagged loss: lower the rate.',
    'Shuffle, then split; never train on validation data.',
    'Train low, val high: overfitting.',
    'Choose on validation; report on test, once.',
  ],
  example: {
    code: [
      'x = np.array([0.0, 1.0, 2.0, 3.0])',
      'y = np.array([1.0, 3.0, 5.0, 7.0])',
      'w, b, lr = 0.0, 0.0, 0.05',
      'for epoch in range(2000):',
      '    err = w * x + b - y',
      '    w -= lr * (2 * err * x).mean()',
      '    b -= lr * (2 * err).mean()',
      'mse = ((w * x + b - y) ** 2).mean()',
      'print(round(w, 3), round(b, 3))',
      'print(round(mse, 6))',
    ].join('\n'),
    output: '2.0 1.0\n0.0',
    notes: [
      'Four points on the line y = 2x + 1.',
      'Each epoch: compute the error, then step w and b against their gradients.',
      'Gradient descent finds w = 2 and b = 1, and the loss reaches 0.',
    ],
  },
  mistakes: [
    { mistake: 'Averaging errors without squaring.', fix: 'Opposite errors cancel; use MSE.' },
    { mistake: 'Forgetting x in the weight gradient.', fix: 'dw = mean(2·err·x); without x it is db.' },
    { mistake: 'Adding the gradient.', fix: 'Subtract it.' },
    { mistake: 'Judging a model on its training data.', fix: 'Hold out a validation set.' },
    { mistake: 'Splitting sorted data without shuffling.', fix: 'Shuffle first (or split by time for time series).' },
    { mistake: 'Standardising with statistics from all the data.', fix: 'Compute them on the training part only.' },
    { mistake: 'Checking the test set after every change.', fix: 'Use it once, at the end.' },
  ],
  forReal:
    'Fit this on a real dataset (a CSV of house prices, say) with scikit-learn\'s LinearRegression and your own NumPy version side by side, and check they agree. Then plot training and validation loss per epoch for a model that can overfit. Unit F8 swaps the line for a neural network and keeps this exact loop; F9 hands the gradients to PyTorch.',
};
