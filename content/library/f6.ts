import type { LibraryPage } from '../schema';

/** Unit F6 summary page: unlocked in the Library when the unit is finished. */
export const f6Library: LibraryPage = {
  unit: 'F6',
  ideas: [
    {
      title: 'Mean and spread',
      text: 'The mean is the balance point. The variance is the mean squared distance from the mean; the standard deviation is its square root, in the original units. The mean alone hides spread and is pulled by outliers.',
    },
    {
      title: 'Distributions and expected value',
      text: 'A distribution gives each outcome a probability from 0 to 1, summing to 1; a classifier outputs one per example. The expected value is the sum of each outcome times its probability. Good probabilities are calibrated: things said to happen 90% of the time do.',
    },
    {
      title: 'Logs and log-likelihood',
      text: 'log undoes exp, turns products into sums and is 0 or negative for probabilities. A dataset\'s probability is a product that underflows, so use the sum of logs (the log-likelihood); training minimises its negative.',
    },
    {
      title: 'Softmax and temperature',
      text: 'Softmax turns scores into a distribution: exp, then divide by the sum. Only differences between scores matter, so subtract the max first to avoid overflow. Dividing scores by a temperature T sharpens (T < 1) or flattens (T > 1) the result without changing the order.',
    },
    {
      title: 'Cross-entropy',
      text: 'The loss for one example is −log of the probability given to the correct class; average over the batch. It punishes confident mistakes, changes smoothly where accuracy jumps, and with softmax its gradient with respect to the scores is (P − one-hot) / n.',
    },
  ],
  rules: [
    'Variance: mean of squared distances; std = √variance.',
    'Probabilities: 0 to 1, summing to 1.',
    'Sum logs; never multiply many probabilities.',
    'softmax(z) = exp(z − max) / sum.',
    'T < 1 sharper, T > 1 flatter; order unchanged.',
    'Cross-entropy = −log p[correct], averaged.',
    'Gradient w.r.t. scores: P − one-hot.',
  ],
  example: {
    code: [
      'Z = np.array([[2.0, 1.0, 0.1],',
      '              [0.5, 2.5, 0.0]])',
      'y = np.array([0, 2])',
      'e = np.exp(Z - Z.max(axis=1,',
      '                     keepdims=True))',
      'P = e / e.sum(axis=1, keepdims=True)',
      'p = P[np.arange(2), y]',
      'print(np.round(p, 3))',
      'print(round(-np.log(p).mean(), 3))',
    ].join('\n'),
    output: '[0.659 0.067]\n1.557',
    notes: [
      'Two examples, three classes: one row of scores each.',
      'A stable softmax per row (keepdims makes the max and the sum line up with the rows).',
      'The first is right and fairly sure (0.659); the second gives its true class only 0.067, which dominates the mean loss.',
    ],
  },
  mistakes: [
    { mistake: 'Quoting the variance as a spread in the original units.', fix: 'Take the square root: the standard deviation.' },
    { mistake: 'Multiplying many probabilities.', fix: 'Sum their logs.' },
    { mistake: 'Dividing raw scores by their sum.', fix: 'Exponentiate first: softmax.' },
    { mistake: 'np.exp on large scores.', fix: 'Subtract the max first.' },
    { mistake: 'Taking −log of the wrong class.', fix: 'Index with the label: p[y].' },
    { mistake: 'Training on accuracy.', fix: 'Train on cross-entropy; report accuracy.' },
  ],
  forReal:
    'In PyTorch, `nn.CrossEntropyLoss` takes the raw scores and the labels and does the stable softmax and the log in one step (unit F9). Language models use exactly this loss over their vocabulary, and the temperature setting you pass to an LLM API is the T from this unit.',
};
