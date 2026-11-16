import type { LibraryPage } from '../schema';

/** Unit F8 summary page: unlocked in the Library when the unit is finished. */
export const f8Library: LibraryPage = {
  unit: 'F8',
  ideas: [
    {
      title: 'Neuron and activation',
      text: 'A neuron computes a weighted sum of its inputs plus a bias, w @ x + b, then applies an activation. ReLU, max(0, z), is the usual choice inside a network; sigmoid squashes to 0..1 for a probability.',
    },
    {
      title: 'A layer is a matrix multiply',
      text: 'A layer is many neurons on the same inputs. Store each neuron\'s weights as a row of W, shape (neurons, inputs). For a batch with examples as the rows of X, the layer is X @ W.T + b, shape (examples, neurons). This is exactly nn.Linear in PyTorch.',
    },
    {
      title: 'Depth needs activations',
      text: 'Stacked layers without activations multiply out to one matrix: still a straight line. A ReLU between layers lets the network bend, so two ReLU neurons can already make |x|.',
    },
    {
      title: 'The forward pass and the loss',
      text: 'The forward pass runs input to output and keeps the in-between values (Z1, H) for later. The loss (MSE for numbers) is one number to make smaller. Watch shapes: an output of (n, 1) minus targets of (n,) broadcasts to (n, n).',
    },
    {
      title: 'Backpropagation',
      text: 'The chain rule from the loss backwards. With dout = 2·(out − y)/n: for each layer Z = X @ W.T + b, dW = dZ.T @ X, db = dZ.sum(axis=0), dX = dZ @ W. Through ReLU, dZ = dH * (Z > 0). Every gradient has the shape of what it updates; check one by nudging.',
    },
  ],
  rules: [
    'Neuron: w @ x + b, then an activation.',
    'W is (neurons, inputs); layer = X @ W.T + b.',
    'ReLU between layers, none on a regression output.',
    'dW = dZ.T @ X, db = dZ.sum(axis=0), dX = dZ @ W.',
    'Through ReLU: dZ = dH * (Z > 0).',
    'Gradient shape = parameter shape.',
    'Check backprop once by nudging.',
  ],
  example: {
    code: [
      'x = np.linspace(-1, 1, 16)',
      'X = x.reshape(-1, 1)',
      'y = np.abs(X)',
      'r = np.random.default_rng(0)',
      'W1 = r.normal(0, 1, (8, 1))',
      'b1 = r.normal(0, 0.1, 8)',
      'W2 = r.normal(0, 0.5, (1, 8))',
      'b2 = np.zeros(1)',
      'for _ in range(2000):',
      '    Z1 = X @ W1.T + b1',
      '    H = np.maximum(0, Z1)',
      '    out = H @ W2.T + b2',
      '    dout = 2 * (out - y) / len(y)',
      '    dZ1 = dout @ W2 * (Z1 > 0)',
      '    W2 -= 0.1 * dout.T @ H',
      '    b2 -= 0.1 * dout.sum(axis=0)',
      '    W1 -= 0.1 * dZ1.T @ X',
      '    b1 -= 0.1 * dZ1.sum(axis=0)',
      'print(((out - y) ** 2).mean() < 0.002)',
    ].join('\n'),
    output: 'True',
    notes: [
      'Sixteen points on y = |x|, and a network with 8 hidden ReLU neurons.',
      'Forward: a hidden layer with ReLU, then a linear output.',
      'Backward: dout from the MSE, then each layer\'s dW and db; dZ1 goes back through W2 and the ReLU mask.',
      'dZ1 is computed before W2 changes: gradients first, then every update.',
    ],
  },
  mistakes: [
    { mistake: 'X @ W instead of X @ W.T.', fix: 'W is (neurons, inputs); transpose it for a batch.' },
    { mistake: 'Subtracting y of shape (n,) from out of shape (n, 1).', fix: 'Reshape y to (n, 1) or ravel out.' },
    { mistake: 'Forgetting the activation between layers.', fix: 'Without it the network is a single linear layer.' },
    { mistake: 'Multiplying by Z instead of the mask in ReLU\'s backward.', fix: 'dZ = dH * (Z > 0).' },
    { mistake: 'Updating W2 before computing the gradient that flows through it.', fix: 'Compute every gradient first, then update.' },
  ],
  forReal:
    'Writing backprop by hand once is what makes PyTorch\'s autograd make sense; nobody does it by hand in real work. For real, rebuild this network in PyTorch (unit F9) and train it on a small real dataset, such as scikit-learn\'s digits, watching training and validation loss. The plan\'s exam-period refresh is exactly this loop.',
};
