import type { Lab } from '../schema';

const DIFFERS =
  'In the app, `torch` is a small stand-in built on NumPy with the same interface for everything this unit uses, so this code runs unchanged on real PyTorch. Random numbers (initial weights, shuffling) differ from real PyTorch, so exact losses can differ slightly; there is no GPU.';

/*
 * Unit F9 labs. Lab 1 builds a first PyTorch model with scaffolding: tensors,
 * a Module, an optimiser, the loop, prediction. Lab 2 starts every step from
 * an empty function and trains a small classifier with a DataLoader.
 */
export const f9Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f9-lab-1',
    title: 'Your first PyTorch model',
    intro: 'Fit the line from F7 again, the PyTorch way: tensors, a model class, an optimiser, the training loop, and a prediction.',
    summary: 'You trained a PyTorch model: tensors, nn.Module, SGD, the loop, and no_grad prediction.',
    minutes: 12,
    unlockAfter: 'f9-08',
    differs: DIFFERS,
    given: ['x_np = np.array([0.0, 1.0, 2.0, 3.0])', 'y_np = np.array([1.0, 3.0, 5.0, 7.0])'].join('\n'),
    steps: [
      {
        goal: 'Finish `as_column(a)`: a NumPy array as a float32 tensor of shape (n, 1).',
        starter: 'def as_column(a):\n    t = torch.from_numpy(a).___()\n    return t.reshape(-1, 1)',
        solution: 'def as_column(a):\n    t = torch.from_numpy(a).float()\n    return t.reshape(-1, 1)',
        tests: [
          't = as_column(x_np)',
          'assert tuple(t.shape) == (4, 1), f"a column of 4; got {tuple(t.shape)}"',
          'assert t.dtype == torch.float32, f"layers need float32; got {t.dtype}"',
        ].join('\n'),
        hints: ['NumPy floats are float64; layers use float32.', 'def as_column(a):\n    t = torch.from_numpy(a).___()\n    return t.reshape(-1, 1)'],
      },
      {
        goal: 'Finish `LineModel`: one `nn.Linear(1, 1)` layer called `fc`.',
        starter:
          'class LineModel(nn.Module):\n    def __init__(self):\n        super().___()\n        self.fc = nn.Linear(1, 1)\n\n    def forward(self, x):\n        return self.___(x)',
        solution:
          'class LineModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc = nn.Linear(1, 1)\n\n    def forward(self, x):\n        return self.fc(x)',
        tests: [
          'm = LineModel()',
          'assert tuple(m(torch.zeros(3, 1)).shape) == (3, 1), "forward should apply self.fc"',
          'assert [n for n, _ in m.named_parameters()] == ["fc.weight", "fc.bias"], "one layer called fc"',
        ].join('\n'),
        hints: ['Set up nn.Module first; forward calls the layer.', 'class LineModel(nn.Module):\n    def __init__(self):\n        super().___()\n        self.fc = nn.Linear(1, 1)\n\n    def forward(self, x):\n        return self.___(x)'],
      },
      {
        goal: 'Finish `make_opt(model, lr)`: an SGD optimiser over the model\'s parameters.',
        starter: 'def make_opt(model, lr):\n    ps = model.___()\n    return torch.optim.SGD(ps, lr=lr)',
        solution: 'def make_opt(model, lr):\n    ps = model.parameters()\n    return torch.optim.SGD(ps, lr=lr)',
        tests: [
          'opt = make_opt(LineModel(), 0.1)',
          'assert len(opt.param_groups[0]["params"]) == 2, "the weight and the bias"',
          'assert opt.param_groups[0]["lr"] == 0.1, "use the lr argument"',
        ].join('\n'),
        hints: ['Every Module can list its parameters.', 'def make_opt(model, lr):\n    ps = model.___()\n    return torch.optim.SGD(ps, lr=lr)'],
      },
      {
        goal: 'Finish `train(model, x, y, epochs, lr)`: the loop, returning the loss of every epoch.',
        starter:
          'def train(model, x, y, epochs, lr):\n    opt = make_opt(model, lr)\n    loss_fn = nn.MSELoss()\n    losses = []\n    for _ in range(epochs):\n        pred = model(x)\n        loss = loss_fn(pred, y)\n        opt.___()\n        loss.___()\n        opt.step()\n        losses.append(loss.item())\n    return losses',
        solution:
          'def train(model, x, y, epochs, lr):\n    opt = make_opt(model, lr)\n    loss_fn = nn.MSELoss()\n    losses = []\n    for _ in range(epochs):\n        pred = model(x)\n        loss = loss_fn(pred, y)\n        opt.zero_grad()\n        loss.backward()\n        opt.step()\n        losses.append(loss.item())\n    return losses',
        tests: [
          'model = LineModel()',
          'losses = train(model, as_column(x_np), as_column(y_np), 500, 0.1)',
          'assert len(losses) == 500, f"one loss per epoch; got {len(losses)}"',
          'assert losses[-1] < 1e-4, f"the loss should reach about 0; got {losses[-1]:.5f}"',
          'w, b = model.fc.weight.item(), model.fc.bias.item()',
          'assert abs(w - 2) < 0.01 and abs(b - 1) < 0.01, f"y = 2x + 1; got w={w:.3f}, b={b:.3f}"',
        ].join('\n'),
        hints: ['Clear old gradients, then backpropagate, then step.', 'def train(model, x, y, epochs, lr):\n    opt = make_opt(model, lr)\n    loss_fn = nn.MSELoss()\n    losses = []\n    for _ in range(epochs):\n        pred = model(x)\n        loss = loss_fn(pred, y)\n        opt.___()\n        loss.___()\n        opt.step()\n        losses.append(loss.item())\n    return losses'],
        explain: 'F7\'s lab took a page of NumPy; this is the same model in PyTorch.',
      },
      {
        goal: 'Finish `predict(model, x)`: the model\'s outputs, without recording gradients.',
        starter: 'def predict(model, x):\n    with torch.___():\n        return model(x)',
        solution: 'def predict(model, x):\n    with torch.no_grad():\n        return model(x)',
        tests: [
          'model = LineModel()',
          'train(model, as_column(x_np), as_column(y_np), 500, 0.1)',
          'p = predict(model, as_column(np.array([10.0])))',
          'assert not p.requires_grad, "predict inside torch.no_grad()"',
          'assert abs(p.item() - 21) < 0.1, f"2 × 10 + 1 = 21; got {p.item():.2f}"',
        ].join('\n'),
        hints: ['Turn recording off for predictions.', 'def predict(model, x):\n    with torch.___():\n        return model(x)'],
        explain: 'Train with the loop, predict under no_grad.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f9-lab-2',
    title: 'Train a classifier',
    intro:
      'Train a small network to sort points into two classes (same sign of x₁ and x₂, or not): tensors, a model, a shuffled DataLoader, an epoch of training, accuracy, and the whole fit. Every step starts from an empty function.',
    summary: 'You trained a PyTorch classifier end to end: data, model, DataLoader, loop, accuracy.',
    minutes: 18,
    unlockAfter: 'f9-11',
    differs: DIFFERS,
    given: [
      'rng = np.random.default_rng(0)',
      'Xn = rng.normal(0, 1, (120, 2))',
      'yn = (Xn[:, 0] * Xn[:, 1] > 0) * 1',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `to_tensors(X, y)`: X as a float32 tensor and y as an int64 tensor. Return both.',
        starter: 'def to_tensors(X, y):\n    pass',
        solution: 'def to_tensors(X, y):\n    Xt = torch.from_numpy(X).float()\n    yt = torch.from_numpy(y).long()\n    return Xt, yt',
        tests: [
          'Xt, yt = to_tensors(Xn, yn)',
          'assert Xt.dtype == torch.float32 and tuple(Xt.shape) == (120, 2), f"X: float32, (120, 2); got {Xt.dtype}, {tuple(Xt.shape)}"',
          'assert yt.dtype == torch.int64 and tuple(yt.shape) == (120,), f"y: int64 labels, (120,); got {yt.dtype}, {tuple(yt.shape)}"',
          'assert yt.sum().item() == int(yn.sum()), "keep the labels\' values"',
        ].join('\n'),
        hints: [
          'Inputs must be float32 for the layers; labels must be int64 for cross-entropy.',
          'def to_tensors(X, y):\n    Xt = torch.from_numpy(X).___()\n    yt = torch.from_numpy(y).___()\n    return Xt, yt',
        ],
      },
      {
        goal: 'Write `make_model(d, h, k)`: `nn.Sequential` of Linear(d, h), ReLU, Linear(h, k).',
        starter: 'def make_model(d, h, k):\n    pass',
        solution: 'def make_model(d, h, k):\n    return nn.Sequential(\n        nn.Linear(d, h),\n        nn.ReLU(),\n        nn.Linear(h, k))',
        tests: [
          'm = make_model(2, 16, 2)',
          'assert tuple(m(torch.zeros(5, 2)).shape) == (5, 2), "2 inputs in, 2 class scores out"',
          'n = sum(p.numel() for p in m.parameters())',
          'assert n == 82, f"2×16 + 16 + 16×2 + 2 = 82 numbers; got {n}"',
          'assert any(isinstance(x, nn.ReLU) for x in m.modules()), "put a ReLU between the layers"',
        ].join('\n'),
        hints: ['Three pieces in a row; no softmax at the end (the loss applies it).', 'def make_model(d, h, k):\n    return nn.Sequential(\n        nn.Linear(d, ___),\n        nn.ReLU(),\n        nn.Linear(h, ___))'],
      },
      {
        goal: 'Write `make_loader(X, y, bs)`: a shuffled DataLoader over `TensorDataset(X, y)` with batches of `bs`.',
        starter: 'def make_loader(X, y, bs):\n    pass',
        solution: 'def make_loader(X, y, bs):\n    ds = TensorDataset(X, y)\n    dl = DataLoader(ds, batch_size=bs,\n                    shuffle=True)\n    return dl',
        tests: [
          'Xt, yt = to_tensors(Xn, yn)',
          'loader = make_loader(Xt, yt, 20)',
          'assert len(loader) == 6, f"120 examples in 20s: 6 batches; got {len(loader)}"',
          'assert type(loader.sampler).__name__ == "RandomSampler", "shuffle the training data"',
          'xb, yb = next(iter(loader))',
          'assert tuple(xb.shape) == (20, 2) and tuple(yb.shape) == (20,), "each batch: 20 inputs and their 20 labels"',
        ].join('\n'),
        hints: ['Pair X with y in a TensorDataset, then batch it.', 'def make_loader(X, y, bs):\n    ds = TensorDataset(___, y)\n    dl = DataLoader(ds, batch_size=bs,\n                    shuffle=___)\n    return dl'],
      },
      {
        goal: 'Write `train_epoch(model, loader, opt)`: one pass over the batches with cross-entropy loss. Return the mean batch loss as a float.',
        starter: 'def train_epoch(model, loader, opt):\n    pass',
        solution:
          'def train_epoch(model, loader, opt):\n    loss_fn = nn.CrossEntropyLoss()\n    total = 0.0\n    for xb, yb in loader:\n        pred = model(xb)\n        loss = loss_fn(pred, yb)\n        opt.zero_grad()\n        loss.backward()\n        opt.step()\n        total += loss.item()\n    return total / len(loader)',
        tests: [
          'torch.manual_seed(0)',
          'Xt, yt = to_tensors(Xn, yn)',
          'm = make_model(2, 16, 2)',
          'opt = torch.optim.Adam(m.parameters(), lr=0.05)',
          'loader = make_loader(Xt, yt, 20)',
          'first = train_epoch(m, loader, opt)',
          'assert isinstance(first, float), f"return a float (use .item()); got {type(first).__name__}"',
          'for _ in range(15):',
          '    last = train_epoch(m, loader, opt)',
          'assert last < first, f"the loss should fall over epochs: {first:.3f} → {last:.3f}"',
        ].join('\n'),
        hints: [
          'The five lines inside `for xb, yb in loader:`, adding up `loss.item()` as you go.',
          'def train_epoch(model, loader, opt):\n    loss_fn = nn.CrossEntropyLoss()\n    total = 0.0\n    for xb, yb in loader:\n        pred = model(___)\n        loss = loss_fn(pred, ___)\n        opt.zero_grad()\n        loss.backward()\n        opt.step()\n        total += loss.item()\n    return total / len(loader)',
        ],
      },
      {
        goal: 'Write `accuracy(model, X, y)`: the share of examples whose highest score is the true class, as a float. Use `torch.no_grad()`.',
        starter: 'def accuracy(model, X, y):\n    pass',
        solution: 'def accuracy(model, X, y):\n    with torch.no_grad():\n        scores = model(X)\n        pred = scores.argmax(dim=1)\n    hits = (pred == y).float()\n    return hits.mean().item()',
        tests: [
          'scores = torch.tensor([[1.0, 0.0], [0.0, 1.0], [1.0, 0.0]])',
          'acc = accuracy(lambda X: scores, None, torch.tensor([0, 1, 1]))',
          'assert isinstance(acc, float), f"return a float; got {type(acc).__name__}"',
          'assert abs(acc - 2 / 3) < 1e-6, f"2 of 3 right; got {acc}"',
        ].join('\n'),
        hints: [
          'argmax over the class axis gives each prediction; compare with y, then average.',
          'def accuracy(model, X, y):\n    with torch.no_grad():\n        scores = model(X)\n        pred = scores.argmax(dim=___)\n    hits = (pred == y).float()\n    return hits.mean().___()',
        ],
      },
      {
        goal: 'Write `fit(X, y, epochs=60)`: tensors, a loader with batches of 20, `make_model(2, 16, 2)`, Adam with lr 0.05, then `epochs` epochs. Return the model.',
        starter: 'def fit(X, y, epochs=60):\n    pass',
        solution:
          'def fit(X, y, epochs=60):\n    Xt, yt = to_tensors(X, y)\n    loader = make_loader(Xt, yt, 20)\n    net = make_model(2, 16, 2)\n    p = net.parameters()\n    opt = torch.optim.Adam(p, lr=0.05)\n    for _ in range(epochs):\n        train_epoch(net, loader, opt)\n    return net',
        tests: [
          'model = fit(Xn, yn)',
          'acc = accuracy(model, *to_tensors(Xn, yn))',
          'assert acc > 0.9, f"should sort over 90% of the points; got {acc:.0%}"',
        ].join('\n'),
        hints: [
          'Call the pieces in order: tensors, loader, model, optimiser, then a loop of train_epoch.',
          'def fit(X, y, epochs=60):\n    Xt, yt = to_tensors(X, y)\n    loader = make_loader(Xt, yt, 20)\n    net = make_model(2, 16, 2)\n    p = net.parameters()\n    opt = torch.optim.Adam(p, lr=___)\n    for _ in range(___):\n        train_epoch(net, loader, opt)\n    return net',
        ],
        explain: 'A straight line cannot separate these classes; 16 ReLU neurons can. Next: check it on held-out data, as in F7.',
      },
    ],
  },
];
