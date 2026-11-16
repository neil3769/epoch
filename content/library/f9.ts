import type { LibraryPage } from '../schema';

/** Unit F9 summary page: unlocked in the Library when the unit is finished. */
export const f9Library: LibraryPage = {
  unit: 'F9',
  ideas: [
    {
      title: 'Tensors',
      text: 'torch.tensor is an array like NumPy\'s, plus gradients and GPUs. Decimal data is float32 (what layers want), labels are int64. NumPy floats come in as float64: add .float(). .item() turns a one-value tensor into a Python number.',
    },
    {
      title: 'Autograd',
      text: 'Tensors created with requires_grad=True (and every layer\'s parameters) are tracked. loss.backward() fills each one\'s .grad. Gradients add up across backward calls, so clear them every step, and change weights only inside torch.no_grad().',
    },
    {
      title: 'Models',
      text: 'nn.Linear(in, out) holds W of shape (out, in) and b, and computes x @ W.T + b. A model subclasses nn.Module: super().__init__() first, layers in __init__, wiring in forward; model(x) calls forward. nn.Sequential chains layers without a class.',
    },
    {
      title: 'Loss and optimiser',
      text: 'nn.MSELoss for numbers; nn.CrossEntropyLoss for classes, given raw scores (examples, classes) and int64 labels. An optimiser such as torch.optim.SGD(model.parameters(), lr=0.1) or Adam does the update: zero_grad() clears, step() moves.',
    },
    {
      title: 'The loop',
      text: 'pred = model(x); loss = loss_fn(pred, y); opt.zero_grad(); loss.backward(); opt.step(). With a DataLoader, those five lines go inside for xb, yb in loader:, inside the epoch loop. Predict under torch.no_grad().',
    },
    {
      title: 'Devices and errors',
      text: 'device = "cuda" if torch.cuda.is_available() else "cpu"; move the model once and each batch with .to(device). Most errors name shapes or dtypes: (32x10 and 20x5) means 10 features against a layer expecting 20; "Double and Float" means NumPy float64 data.',
    },
  ],
  rules: [
    'Inputs float32, class labels int64.',
    'nn.Linear(in, out).weight is (out, in).',
    'super().__init__() before any layer.',
    'predict, loss, zero_grad, backward, step.',
    'CrossEntropyLoss takes raw scores: no softmax first.',
    'Batches inside epochs; .to(device) on each batch.',
    'Evaluate under torch.no_grad().',
  ],
  example: {
    code: [
      'gpu = torch.cuda.is_available()',
      "device = 'cuda' if gpu else 'cpu'",
      'x = torch.linspace(-1, 1, 64)',
      'x = x.reshape(-1, 1)',
      'y = 2 * x + 1',
      'ds = TensorDataset(x, y)',
      'loader = DataLoader(ds, batch_size=16,',
      '                    shuffle=True)',
      'model = nn.Linear(1, 1).to(device)',
      'loss_fn = nn.MSELoss()',
      'opt = torch.optim.SGD(',
      '    model.parameters(), lr=0.1)',
      'for epoch in range(100):',
      '    for xb, yb in loader:',
      '        xb = xb.to(device)',
      '        yb = yb.to(device)',
      '        pred = model(xb)',
      '        loss = loss_fn(pred, yb)',
      '        opt.zero_grad()',
      '        loss.backward()',
      '        opt.step()',
      'w = model.weight.item()',
      'b = model.bias.item()',
      'print(f"{w:.2f} {b:.2f}")',
    ].join('\n'),
    output: '2.00 1.00',
    notes: [
      'Imports: import torch, import torch.nn as nn, from torch.utils.data import TensorDataset, DataLoader.',
      'The device line makes the same script use a GPU where there is one.',
      'Setup: data, a shuffled loader, model, loss, optimiser.',
      'The loop: epochs outside, batches inside, the five lines in the middle.',
    ],
  },
  mistakes: [
    { mistake: 'Forgetting opt.zero_grad().', fix: 'Gradients pile up silently; clear them every step.' },
    { mistake: 'Calling the model once outside the loop.', fix: 'Predict inside the loop; each step needs a new forward pass.' },
    { mistake: 'loss.backward without brackets.', fix: 'It names the method without calling it: nothing learns.' },
    { mistake: 'NumPy float64 data into a float32 layer.', fix: 'torch.from_numpy(a).float().' },
    { mistake: 'Float labels for CrossEntropyLoss.', fix: 'Labels are class indexes: .long().' },
    { mistake: 'Targets of shape (n,) against predictions (n, 1).', fix: 'y.unsqueeze(1), or the loss broadcasts to (n, n).' },
    { mistake: 'Hard-coding .cuda().', fix: 'Choose the device with torch.cuda.is_available().' },
  ],
  forReal:
    'In the app, torch is a small NumPy stand-in; the code is real PyTorch. For real: install PyTorch on your computer (pip install torch, or the command from pytorch.org for a GPU), paste this page\'s example into a script, and run it. Then train the lab\'s classifier on a real dataset, such as scikit-learn\'s digits, with a validation split, and watch both losses. This is the loop the plan asks you to refresh in January.',
};
