import type { Lesson } from '../schema';

/* F9 lessons 8 to 14: the five-line loop, Dataset/DataLoader, devices,
 * reading PyTorch's errors, then the loop rebuilt three times with less help
 * each time, ending (the checkpoint) at a blank editor. */

// Setup shared by several loops below: 4 copies of x = 1 with target 3.
const SETUP = `x = torch.ones(4, 1)
y = 3 * x
model = nn.Linear(1, 1)
loss_fn = nn.MSELoss()
ps = model.parameters()
opt = torch.optim.SGD(ps, lr=0.1)`;

// The same, starting from zero weights so every run gives the same numbers.
const SETUP0 = `x = torch.ones(4, 1)
y = 3 * x
model = nn.Linear(1, 1)
nn.init.zeros_(model.weight)
nn.init.zeros_(model.bias)
loss_fn = nn.MSELoss()
ps = model.parameters()
opt = torch.optim.SGD(ps, lr=0.1)`;

const LOOP = `pred = model(x)
loss = loss_fn(pred, y)
opt.zero_grad()
loss.backward()
opt.step()`;

const fixed = (code: string) => code.split('\n').map((text) => ({ text, fixed: true }));

export const f9More: Lesson[] = [
  // ------------------------------------------------------------------ 8
  {
    id: 'f9-08',
    title: 'The training loop',
    summary: 'Every training loop is five lines: predict, loss, zero_grad, backward, step.',
    card: {
      title: 'The training loop',
      text: 'Every PyTorch training loop is the same five lines: predict, measure the loss, clear old gradients, backpropagate, step. Learn them by heart; everything around them is setup.',
      code: `x = torch.linspace(-1, 1, 20)
x = x.reshape(-1, 1)
y = 2 * x + 1
model = nn.Linear(1, 1)
loss_fn = nn.MSELoss()
ps = model.parameters()
opt = torch.optim.SGD(ps, lr=0.1)
for epoch in range(200):
    pred = model(x)
    loss = loss_fn(pred, y)
    opt.zero_grad()
    loss.backward()
    opt.step()
w = model.weight.item()
b = model.bias.item()
print(f"{w:.2f} {b:.2f}")`,
      output: '2.00 1.00',
    },
    exercises: [
      {
        id: 'f9-8-1',
        type: 'order-lines',
        prompt: 'Put the loop in order. It starts from zero weights and prints w after 3 epochs.',
        lines: [
          ...fixed(SETUP0),
          { text: 'for epoch in range(3):', fixed: true },
          { text: '    pred = model(x)' },
          { text: '    loss = loss_fn(pred, y)' },
          { text: '    opt.zero_grad()', fixed: true },
          { text: '    loss.backward()' },
          { text: '    opt.step()' },
          { text: 'print(round(model.weight.item(), 3))', fixed: true },
        ],
        expectOutput: '1.176',
        explain: 'Predict, loss, zero, backward, step.',
      },
      {
        id: 'f9-8-2',
        type: 'predict-output',
        prompt: 'Two steps on one weight. What does this print?',
        code: `w = nn.Parameter(torch.tensor(0.0))
opt = torch.optim.SGD([w], lr=0.05)
for _ in range(2):
    loss = (2 * w - 6) ** 2
    opt.zero_grad()
    loss.backward()
    opt.step()
    print(round(w.item(), 2))`,
        answer: '1.2\n1.92',
        options: [
          { text: '1.2\n1.92' },
          { text: '1.2\n2.4', why: 'The second gradient is smaller, since w is closer: 4 × (2.4 − 6) = −14.4.' },
          { text: '-1.2\n-1.92', why: 'step moves against the negative gradient, so w rises.' },
        ],
        explain: 'Gradients −24, then −14.4: steps of 1.2 and 0.72 towards w = 3.',
      },
      {
        id: 'f9-8-3',
        type: 'mcq',
        prompt: 'Why does `opt.zero_grad()` come before `loss.backward()`?',
        options: [
          { text: 'So backward fills .grad from zero' },
          { text: 'So the loss is computed again', why: 'The loss line does that; zero_grad only clears .grad.' },
          { text: 'Because step() needs empty gradients', why: 'step needs this step\'s gradients, which backward puts there.' },
        ],
        answer: 0,
        explain: 'Clear, then fill, then use.',
      },
      {
        id: 'f9-8-4',
        type: 'fill-blank',
        prompt: 'Fill the two gaps in the loop.',
        code: `${SETUP}
for epoch in range(200):
    pred = model(x)
    loss = ___(pred, y)
    opt.zero_grad()
    loss.___()
    opt.step()
print(round(loss.item(), 4))`,
        answer: ['loss_fn', 'backward'],
        distractors: [
          { text: 'model', why: 'The model makes predictions; the loss function compares them with y.' },
          { text: 'step', why: 'The loss has no step; it has backward. The optimiser steps.' },
        ],
        expectOutput: '0.0',
        explain: 'The loss reaches 0: w + b = 3.',
      },
      {
        id: 'f9-8-5',
        type: 'spot-bug',
        prompt: 'Which line is in the wrong place?',
        code: `${SETUP}
pred = model(x)
for epoch in range(100):
    loss = loss_fn(pred, y)
    opt.zero_grad()
    loss.backward()
    opt.step()`,
        error: 'RuntimeError: Trying to backward through the graph a second time...',
        answer: 6,
        raiseLine: 10,
        lineWhy: {
          '0': 'The inputs.',
          '1': 'The targets.',
          '2': 'The model.',
          '3': 'The loss function.',
          '4': 'The parameters for the optimiser.',
          '5': 'The optimiser.',
          '7': 'The epoch loop.',
          '8': 'Right, given a fresh prediction.',
          '9': 'Clearing gradients is right.',
          '10': 'This fails on the second pass, because the prediction was made only once.',
          '11': 'The step is right.',
        },
        explain: 'Predict inside the loop: each step needs a new forward pass with the new weights.',
      },
      {
        id: 'f9-8-6',
        type: 'mcq',
        prompt: 'In this loop, one epoch is…',
        options: [
          { text: 'One pass over all the data' },
          { text: 'One weight update for each example', why: 'Here the whole data goes through at once: one update per epoch.' },
          { text: 'The whole of training', why: 'Training runs for many epochs; range(200) is 200 of them.' },
        ],
        answer: 0,
        explain: 'With mini-batches (next lesson) an epoch has several updates.',
      },
      {
        id: 'f9-8-7',
        type: 'predict-output',
        prompt: 'Predicting without training. Type what this prints.',
        code: `model = nn.Linear(2, 1)
x = torch.zeros(3, 2)
with torch.no_grad():
    pred = model(x)
print(pred.requires_grad)`,
        answer: 'False',
        typedWrong: [{ answer: 'True', why: 'Inside no_grad nothing is recorded, so pred tracks no gradient.' }],
        explain: 'Use no_grad when you only predict, after training or for validation: faster and lighter.',
      },
      {
        id: 'f9-8-8',
        type: 'run-code',
        prompt: 'Write the five lines of one training step.',
        before: SETUP0,
        solution: LOOP,
        tests: [
          'assert abs(loss.item() - 9) < 1e-6, f"from zero weights the first loss is (0 − 3)² = 9; got {loss.item()}"',
          'w = model.weight.item()',
          'assert abs(w - 0.6) < 1e-5, f"after one step w should be 0.6 (did you call backward and step?); got {w}"',
        ].join('\n'),
        maxLines: 5,
        placeholder: 'pred = ...',
        explain: 'Predict, loss, zero, backward, step.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'f9-09',
    title: 'Dataset and DataLoader',
    summary: 'TensorDataset pairs inputs and targets; DataLoader serves shuffled mini-batches; the loop gains one line.',
    card: {
      title: 'Dataset and DataLoader',
      text: 'A `TensorDataset(X, y)` pairs inputs with targets, and a `DataLoader` serves them in mini-batches, shuffled each epoch with `shuffle=True`. The loop gains one line, `for xb, yb in loader:`, around the five. Many small steps per epoch usually train faster than one big one.',
      code: `from torch.utils.data import (
    TensorDataset, DataLoader)
X = torch.zeros(10, 3)
y = torch.zeros(10)
ds = TensorDataset(X, y)
loader = DataLoader(ds, batch_size=4)
for xb, yb in loader:
    print(xb.shape, yb.shape)`,
      output: 'torch.Size([4, 3]) torch.Size([4])\ntorch.Size([4, 3]) torch.Size([4])\ntorch.Size([2, 3]) torch.Size([2])',
    },
    exercises: [
      {
        id: 'f9-9-1',
        type: 'predict-output',
        prompt: 'Type how many batches there are.',
        code: `ds = TensorDataset(torch.zeros(10, 2))
loader = DataLoader(ds, batch_size=4)
print(len(loader))`,
        answer: '3',
        typedWrong: [{ answer: '2', why: 'The last 2 examples make a smaller third batch.' }],
        explain: '4 + 4 + 2.',
      },
      {
        id: 'f9-9-2',
        type: 'mcq',
        prompt: 'Why `shuffle=True` for training?',
        options: [
          { text: 'New batches every epoch' },
          { text: 'It makes each epoch faster', why: 'Shuffling costs a little; it helps learning, not speed.' },
          { text: 'It is needed for validation', why: 'Validation needs no shuffling: order does not change a score.' },
        ],
        answer: 0,
        explain: 'Data sorted by label, unshuffled, would teach one class at a time.',
      },
      {
        id: 'f9-9-3',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `X = torch.arange(5).float()
y = X * 2
ds = TensorDataset(X, y)
print(ds[2], len(ds))`,
        answer: '(tensor(2.), tensor(4.)) 5',
        options: [
          { text: '(tensor(2.), tensor(4.)) 5' },
          { text: 'tensor(2.) 5', why: 'Each item is a pair: input and target.' },
          { text: '(tensor(2.), tensor(4.)) 2', why: 'len counts all 5 examples.' },
        ],
        explain: 'A dataset is indexed like a list of (x, y) pairs.',
      },
      {
        id: 'f9-9-4',
        type: 'fill-blank',
        prompt: 'Loop over mini-batches.',
        code: `X = torch.zeros(10, 3)
y = torch.zeros(10)
ds = TensorDataset(X, y)
loader = DataLoader(ds, batch_size=5)
for xb, yb in ___:
    print(xb.shape)`,
        answer: ['loader'],
        distractors: [
          { text: 'ds', why: 'The dataset gives one example at a time; the loader batches them.' },
          { text: 'X', why: 'X has no targets to pair with, and its rows do not split into (xb, yb).' },
        ],
        expectOutput: 'torch.Size([5, 3])\ntorch.Size([5, 3])',
        explain: 'Two batches of 5.',
      },
      {
        id: 'f9-9-5',
        type: 'predict-output',
        prompt: 'Type how many optimiser steps 3 epochs take.',
        code: `X = torch.zeros(10, 2)
y = torch.zeros(10)
ds = TensorDataset(X, y)
loader = DataLoader(ds, batch_size=4)
steps = 0
for epoch in range(3):
    for xb, yb in loader:
        steps += 1
print(steps)`,
        answer: '9',
        typedWrong: [
          { answer: '3', why: 'Each epoch has 3 batches, and each batch is a step.' },
          { answer: '30', why: 'One step per batch, not per example.' },
        ],
        explain: '3 epochs × 3 batches.',
      },
      {
        id: 'f9-9-6',
        type: 'mcq',
        prompt: 'A smaller batch size means…',
        options: [
          { text: 'More, noisier steps per epoch' },
          { text: 'Fewer, smoother steps per epoch', why: 'That is a larger batch.' },
          { text: 'More data in total', why: 'The data is the same; it is just cut into more pieces.' },
        ],
        answer: 0,
        explain: '32 to 256 are common sizes.',
      },
      {
        id: 'f9-9-7',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `X = torch.zeros(10, 3)
y = torch.zeros(8)
ds = TensorDataset(X, y)`,
        error: 'AssertionError: Size mismatch between tensors',
        answer: 1,
        raiseLine: 2,
        lineWhy: {
          '0': '10 examples of 3 features.',
          '2': 'Pairing inputs with targets is right, once there is a target for each.',
        },
        explain: 'Every input needs a target: 10 and 10.',
      },
      {
        id: 'f9-9-8',
        type: 'run-code',
        prompt: 'Set `loader` to a DataLoader over `ds`: batches of 16, shuffled.',
        before: 'X = torch.zeros(40, 2)\nds = TensorDataset(X, torch.zeros(40))',
        solution: 'loader = DataLoader(\n    ds, batch_size=16, shuffle=True)',
        tests: [
          'assert loader.batch_size == 16, f"batch_size=16; got {loader.batch_size}"',
          'assert type(loader.sampler).__name__ == "RandomSampler", "add shuffle=True"',
          'assert len(loader) == 3, f"40 examples in 16s: 3 batches; got {len(loader)}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'loader = DataLoader(...)',
        explain: 'Shuffle the training loader, not the validation one.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 'f9-10',
    title: 'Devices',
    summary: 'Pick the device once; move the model and every batch with .to(device).',
    card: {
      title: 'Devices',
      text: 'PyTorch can run on a GPU, called `cuda`. Pick the device once, then move the model and every batch with `.to(device)`: a model on the GPU cannot read data on the CPU. This app has no GPU, so the device is always `cpu`.',
      code: `gpu = torch.cuda.is_available()
device = 'cuda' if gpu else 'cpu'
model = nn.Linear(3, 1).to(device)
x = torch.zeros(2, 3).to(device)
print(device, model(x).shape)`,
      output: 'cpu torch.Size([2, 1])',
    },
    exercises: [
      {
        id: 'f9-10-1',
        type: 'predict-output',
        prompt: 'Type where this tensor lives.',
        code: `x = torch.zeros(2)
print(x.device)`,
        answer: 'cpu',
        typedWrong: [{ answer: 'cuda', why: 'Tensors start on the CPU until you move them.' }],
        explain: 'New tensors are made on the CPU.',
      },
      {
        id: 'f9-10-2',
        type: 'mcq',
        prompt: 'What does "Expected all tensors to be on the same device, but found at least two devices, cuda:0 and cpu!" mean?',
        options: [
          { text: 'Model and data on different devices' },
          { text: 'The GPU has stopped working', why: 'The GPU works; one tensor was never moved to it.' },
          { text: 'The batch is too big for the GPU', why: 'That is an "out of memory" error.' },
        ],
        answer: 0,
        explain: 'Usually a batch that was not moved: `xb = xb.to(device)`.',
      },
      {
        id: 'f9-10-3',
        type: 'fill-blank',
        prompt: 'Move a batch to the device.',
        code: `device = 'cpu'
xb = torch.zeros(4, 3)
xb = xb.___(device)
print(xb.device)`,
        answer: ['to'],
        distractors: [
          { text: 'cuda', why: '`.cuda()` always means the GPU; `.to(device)` works on any machine.' },
          { text: 'device', why: '`.device` reads where it is; it cannot move it.' },
        ],
        expectOutput: 'cpu',
        explain: '`.to(device)` returns the moved tensor: assign it.',
      },
      {
        id: 'f9-10-4',
        type: 'mcq',
        prompt: 'Where do the `.to(device)` calls go?',
        options: [
          { text: 'Model once; each batch in the loop' },
          { text: 'Only the model, before training', why: 'The data must be on the same device as the model.' },
          { text: 'Each layer inside forward', why: 'Moving the model moves all its layers at once.' },
        ],
        answer: 0,
        explain: '`for xb, yb in loader: xb, yb = xb.to(device), yb.to(device)`.',
      },
      {
        id: 'f9-10-5',
        type: 'spot-bug',
        prompt: 'On a laptop with no GPU, which line fails?',
        code: `model = nn.Linear(3, 1)
model = model.cuda()
x = torch.zeros(2, 3)
print(model(x).shape)`,
        error: 'AssertionError: Torch not compiled with CUDA enabled',
        answer: 1,
        lineWhy: {
          '0': 'Making the model is fine.',
          '2': 'The data is fine.',
          '3': 'Calling the model is fine.',
        },
        explain: 'Use `model.to(device)` with a device chosen by `torch.cuda.is_available()`.',
      },
      {
        id: 'f9-10-6',
        type: 'predict-output',
        prompt: '`.to` can also change the dtype. What does this print?',
        code: `x = torch.zeros(3)
x = x.to(torch.float64)
print(x.dtype)`,
        answer: 'torch.float64',
        options: [
          { text: 'torch.float64' },
          { text: 'torch.float32', why: 'Given a dtype, `.to` converts to it.' },
          { text: 'cpu', why: 'This prints the dtype, not the device.' },
        ],
        explain: '`.to` moves to a device, converts to a dtype, or both.',
      },
      {
        id: 'f9-10-7',
        type: 'mcq',
        prompt: 'Why choose the device with `torch.cuda.is_available()` rather than write `"cuda"`?',
        options: [
          { text: 'It runs with or without a GPU' },
          { text: 'It makes the GPU faster', why: 'It only checks whether there is one.' },
          { text: '"cuda" is not a valid device', why: 'It is valid where there is a GPU; the check keeps CPU machines working.' },
        ],
        answer: 0,
        explain: 'Write once; it uses a GPU where there is one.',
      },
      {
        id: 'f9-10-8',
        type: 'run-code',
        prompt: 'Set `device` to `"cuda"` if a GPU is available, else `"cpu"`.',
        solution: "gpu = torch.cuda.is_available()\ndevice = 'cuda' if gpu else 'cpu'",
        tests: [
          'want = "cuda" if torch.cuda.is_available() else "cpu"',
          'assert device == want, f"expected {want!r}; got {device!r}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'device = ...',
        explain: 'The first line of most training scripts.',
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    id: 'f9-11',
    title: 'Reading PyTorch errors',
    summary: 'Most errors are shapes or dtypes; the message names them, so compare them with what the layer expects.',
    card: {
      title: 'Reading PyTorch errors',
      text: 'Most PyTorch errors are about shapes or dtypes, and the message names them. "mat1 and mat2 shapes cannot be multiplied (32x10 and 20x5)" means the batch has 10 features but the layer expects 20. Print `x.shape` and `x.dtype` just before the failing line and compare.',
      code: `layer = nn.Linear(20, 5)
x = torch.zeros(32, 10)
print(x.shape, layer.in_features)`,
      output: 'torch.Size([32, 10]) 20',
    },
    exercises: [
      {
        id: 'f9-11-1',
        type: 'mcq',
        prompt: '"mat1 and mat2 shapes cannot be multiplied (64x3 and 4x8)". What is wrong?',
        options: [
          { text: 'The batch has 3 features; the layer wants 4' },
          { text: 'The batch has 64 rows; the layer wants 4', why: 'Any number of rows is fine: 64 is the batch size.' },
          { text: 'The layer has 3 outputs; it wants 8', why: '8 is the layer\'s outputs; the clash is 3 against 4.' },
        ],
        answer: 0,
        explain: 'The two inner numbers must match: 3 and 4 do not.',
      },
      {
        id: 'f9-11-2',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `net = nn.Sequential(
    nn.Linear(4, 8),
    nn.ReLU(),
    nn.Linear(4, 1))
x = torch.zeros(16, 4)
out = net(x)`,
        error: 'RuntimeError: mat1 and mat2 shapes cannot be multiplied (16x8 and 4x1)',
        answer: 3,
        raiseLine: 5,
        lineWhy: {
          '0': 'A chain of layers.',
          '1': '4 features in, 8 out: matches the data.',
          '2': 'ReLU keeps the shape.',
          '4': '16 examples of 4 features.',
          '5': 'Calling the network is right.',
        },
        explain: 'The second layer reads the first one\'s 8 outputs: `nn.Linear(8, 1)`.',
      },
      {
        id: 'f9-11-3',
        type: 'spot-bug',
        prompt: 'Data from NumPy. Which line needs a fix?',
        code: `a = np.array([[1.0, 2.0]])
x = torch.from_numpy(a)
layer = nn.Linear(2, 1)
print(layer(x))`,
        error: 'RuntimeError: mat1 and mat2 must have the same dtype, but got Double and Float',
        answer: 1,
        raiseLine: 3,
        lineWhy: {
          '0': 'NumPy data, as you often get it.',
          '2': 'The layer is right: its weights are float32.',
          '3': 'Calling it is right, once x is float32.',
        },
        explain: 'NumPy floats are float64 ("Double"): use `torch.from_numpy(a).float()`.',
      },
      {
        id: 'f9-11-4',
        type: 'predict-shape',
        prompt: 'A silent bug: no error, wrong loss. What is the shape?',
        code: `pred = torch.zeros(4, 1)
y = torch.zeros(4)`,
        target: 'pred - y',
        answer: '(4, 4)',
        options: [
          { text: '(4, 4)' },
          { text: '(4, 1)', why: '(4, 1) and (4,) broadcast against each other.' },
          { text: '(4,)', why: 'Broadcasting stretches both into a 4 × 4 grid.' },
        ],
        explain: 'As in F8. MSELoss only warns about this; make y (4, 1).',
      },
      {
        id: 'f9-11-5',
        type: 'fill-blank',
        prompt: 'Make the targets a column.',
        code: `y = torch.zeros(4)
y = y.___(1)
print(y.shape)`,
        answer: ['unsqueeze'],
        distractors: [
          { text: 'squeeze', why: 'squeeze removes size-1 dimensions; unsqueeze adds one.' },
          { text: 'view', why: '`view(1)` asks for 1 value in total; it needs `view(-1, 1)`.' },
        ],
        expectOutput: 'torch.Size([4, 1])',
        explain: '`y.unsqueeze(1)` and `y.view(-1, 1)` both give (4, 1).',
      },
      {
        id: 'f9-11-6',
        type: 'mcq',
        prompt: '`nn.CrossEntropyLoss` says "expected scalar type Long but found Float". What do you fix?',
        options: [
          { text: 'Make the labels integers: y.long()' },
          { text: 'Make the logits integers too', why: 'Logits must stay float; the labels are the class indexes.' },
          { text: 'Switch the loss to nn.MSELoss', why: 'For classes, cross-entropy is right; only the label dtype is off.' },
        ],
        answer: 0,
        explain: '"Long" is int64.',
      },
      {
        id: 'f9-11-7',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `x = torch.zeros(3, 4)
print(x.view(2, -1).shape)`,
        answer: 'torch.Size([2, 6])',
        typedWrong: [{ answer: 'torch.Size([2, 4])', why: '−1 means "whatever fits": 12 values in 2 rows is 6 each.' }],
        explain: 'view keeps all 12 values; −1 fills in the missing size.',
      },
      {
        id: 'f9-11-8',
        type: 'run-code',
        prompt: '`x` has shape (8,). Set `x2` to the same values as a column, shape (8, 1).',
        before: 'x = torch.arange(8).float()',
        solution: 'x2 = x.unsqueeze(1)',
        tests: [
          'assert tuple(x2.shape) == (8, 1), f"a column: (8, 1); got {tuple(x2.shape)}"',
          'assert x2[3, 0].item() == 3, "keep the values in order"',
        ].join('\n'),
        placeholder: 'x2 = ...',
        explain: '`x.view(-1, 1)` or `x.reshape(-1, 1)` work too.',
      },
    ],
  },

  // ------------------------------------------------------------------ 12
  {
    id: 'f9-12',
    title: 'Rebuild the loop: in order',
    summary: 'The training loop, rebuilt from its five steps with the lines given.',
    card: {
      title: 'Rebuild the loop, 1 of 3',
      text: 'These three lessons rebuild the training loop with less help each time, until you write it in an empty editor. Say the five steps first: predict, loss, zero, backward, step. Here the lines are given; put them together.',
    },
    exercises: [
      {
        id: 'f9-12-1',
        type: 'order-lines',
        prompt: 'One epoch over mini-batches, from zero weights. Put the loop together.',
        lines: [
          { text: 'x = torch.ones(8, 1)', fixed: true },
          { text: 'ds = TensorDataset(x, 3 * x)', fixed: true },
          { text: 'loader = DataLoader(ds, batch_size=2)', fixed: true },
          { text: 'model = nn.Linear(1, 1)', fixed: true },
          { text: 'nn.init.zeros_(model.weight)', fixed: true },
          { text: 'nn.init.zeros_(model.bias)', fixed: true },
          { text: 'loss_fn = nn.MSELoss()', fixed: true },
          { text: 'ps = model.parameters()', fixed: true },
          { text: 'opt = torch.optim.SGD(ps, lr=0.1)', fixed: true },
          { text: 'for xb, yb in loader:', fixed: true },
          { text: '    pred = model(xb)' },
          { text: '    loss = loss_fn(pred, yb)' },
          { text: '    opt.zero_grad()', fixed: true },
          { text: '    loss.backward()' },
          { text: '    opt.step()' },
          { text: 'print(round(model.weight.item(), 3))', fixed: true },
        ],
        expectOutput: '1.306',
        explain: 'The five lines sit inside the batch loop.',
      },
      {
        id: 'f9-12-2',
        type: 'match-pairs',
        prompt: 'Match each line to its job.',
        pairs: [
          { left: 'pred = model(x)', right: 'forward pass', why: 'Inputs through the model.' },
          { left: 'loss = loss_fn(pred, y)', right: 'how wrong, as one number', why: 'Compares predictions with targets.' },
          { left: 'opt.zero_grad()', right: 'clear old gradients', why: 'Otherwise they add up.' },
          { left: 'loss.backward()', right: 'compute gradients', why: 'Autograd fills every .grad.' },
          { left: 'opt.step()', right: 'update the weights', why: 'Each parameter moves against its gradient.' },
        ],
        explain: 'Five lines, five jobs.',
      },
      {
        id: 'f9-12-3',
        type: 'fill-blank',
        prompt: 'Three method names.',
        code: `${SETUP}
for epoch in range(200):
    pred = model(x)
    loss = loss_fn(pred, y)
    opt.___()
    loss.___()
    opt.___()
print(round(loss.item(), 4))`,
        answer: ['zero_grad', 'backward', 'step'],
        distractors: [
          { text: 'grad', why: '`.grad` is an attribute holding a gradient, not a method.' },
          { text: 'forward', why: 'The model\'s forward runs when you call model(x).' },
        ],
        expectOutput: '0.0',
        explain: 'Optimiser, loss, optimiser.',
      },
      {
        id: 'f9-12-4',
        type: 'spot-bug',
        prompt: 'No error, but the model never learns. Which line?',
        code: `${SETUP}
for epoch in range(100):
    pred = model(x)
    loss = loss_fn(pred, y)
    opt.zero_grad()
    loss.backward
    opt.step()
assert loss.item() < 0.01, "stuck"`,
        error: 'AssertionError: stuck',
        answer: 10,
        raiseLine: 12,
        lineWhy: {
          '0': 'The inputs.',
          '1': 'The targets.',
          '2': 'The model.',
          '3': 'The loss function.',
          '4': 'The parameters.',
          '5': 'The optimiser.',
          '6': 'The epoch loop.',
          '7': 'Predicting is right.',
          '8': 'The loss is right.',
          '9': 'Clearing gradients is right.',
          '11': 'The step is right, but it has no gradients to use.',
          '12': 'The check is right: this should fit easily.',
        },
        explain: 'Without the brackets, backward is named but never called: `loss.backward()`.',
      },
      {
        id: 'f9-12-5',
        type: 'mcq',
        prompt: 'Which line comes first in each step?',
        options: [
          { text: 'pred = model(x)' },
          { text: 'loss.backward()', why: 'There is no loss to backpropagate before the forward pass.' },
          { text: 'opt.step()', why: 'Stepping needs gradients, which come last.' },
        ],
        answer: 0,
        explain: 'Forward first; everything else depends on it.',
      },
      {
        id: 'f9-12-6',
        type: 'predict-output',
        prompt: 'Starting from zero weights. What does this print?',
        code: `${SETUP0}
for epoch in range(3):
${LOOP.split('\n').map((l) => '    ' + l).join('\n')}
    print(round(loss.item(), 2))`,
        answer: '9.0\n3.24\n1.17',
        options: [
          { text: '9.0\n3.24\n1.17' },
          { text: '9.0\n9.0\n9.0', why: 'Each step moves w + b closer to 3, so the loss falls.' },
          { text: '3.24\n1.17\n0.42', why: 'The loss is measured before each step: the first one is (0 − 3)² = 9.' },
        ],
        explain: 'w + b goes 0, 1.2, 1.92: each step closes 40% of the gap.',
      },
      {
        id: 'f9-12-7',
        type: 'mcq',
        prompt: 'You leave out `opt.zero_grad()`. What happens?',
        options: [
          { text: 'Gradients pile up across steps' },
          { text: 'An error at the second step', why: 'No error: gradients silently add up.' },
          { text: 'Nothing: step() clears them', why: 'step uses the gradients but never clears them.' },
        ],
        answer: 0,
        explain: 'A silent bug, so it is worth the habit.',
      },
      {
        id: 'f9-12-8',
        type: 'run-code',
        prompt: 'The prediction and loss are done. Write the last three lines of the step.',
        before: `${SETUP0}
pred = model(x)
loss = loss_fn(pred, y)`,
        solution: 'opt.zero_grad()\nloss.backward()\nopt.step()',
        tests: 'w = model.weight.item()\nassert abs(w - 0.6) < 1e-5, f"after one step from zero, w should be 0.6; got {w}"',
        maxLines: 3,
        placeholder: 'opt...',
        explain: 'Zero, backward, step.',
      },
    ],
  },

  // ------------------------------------------------------------------ 13
  {
    id: 'f9-13',
    title: 'Rebuild the loop: fill it in',
    summary: 'The training loop, rebuilt with most lines written by you.',
    card: {
      title: 'Rebuild the loop, 2 of 3',
      text: 'Less help now: you write most of the lines. If you get stuck, say the five steps, then type them.',
    },
    exercises: [
      {
        id: 'f9-13-1',
        type: 'run-code',
        prompt: 'Write the epoch loop: 100 epochs of the five steps.',
        before: SETUP0,
        solution: `for epoch in range(100):
${LOOP.split('\n').map((l) => '    ' + l).join('\n')}`,
        tests: [
          'w, b = model.weight.item(), model.bias.item()',
          'assert abs(w + b - 3) < 1e-3, f"after training, w + b should be 3; got {w + b:.3f}"',
        ].join('\n'),
        maxLines: 6,
        placeholder: 'for epoch in range(100):\n    ...',
        explain: 'The loop header, then the five lines indented.',
      },
      {
        id: 'f9-13-2',
        type: 'fill-blank',
        prompt: 'Whole lines this time.',
        code: `${SETUP}
for epoch in range(200):
    ___
    loss = loss_fn(pred, y)
    ___
    loss.backward()
    ___
print(round(loss.item(), 4))`,
        answer: ['pred = model(x)', 'opt.zero_grad()', 'opt.step()'],
        distractors: [
          { text: 'loss.step()', why: 'The optimiser steps, not the loss.' },
          { text: 'opt.backward()', why: 'The loss backpropagates, not the optimiser.' },
        ],
        expectOutput: '0.0',
        explain: 'Predict, loss, zero, backward, step.',
      },
      {
        id: 'f9-13-3',
        type: 'run-code',
        prompt: 'Write one epoch over the batches: the batch loop around the five steps.',
        before: `x = torch.ones(8, 1)
ds = TensorDataset(x, 3 * x)
loader = DataLoader(ds, batch_size=4)
model = nn.Linear(1, 1)
nn.init.zeros_(model.weight)
nn.init.zeros_(model.bias)
loss_fn = nn.MSELoss()
ps = model.parameters()
opt = torch.optim.SGD(ps, lr=0.1)`,
        solution: `for xb, yb in loader:
    pred = model(xb)
    loss = loss_fn(pred, yb)
    opt.zero_grad()
    loss.backward()
    opt.step()`,
        tests: 'w = model.weight.item()\nassert abs(w - 0.96) < 1e-5, f"two batches from zero should give w = 0.96 (0.6, then 0.96); got {w}"',
        maxLines: 6,
        placeholder: 'for xb, yb in loader:\n    ...',
        explain: 'Use xb and yb inside, not x and y.',
      },
      {
        id: 'f9-13-4',
        type: 'predict-output',
        prompt: 'Train from zero weights, then predict for x = 2. Type what this prints.',
        code: `${SETUP0}
for epoch in range(200):
${LOOP.split('\n').map((l) => '    ' + l).join('\n')}
with torch.no_grad():
    p = model(torch.tensor([[2.0]]))
print(round(p.item(), 2))`,
        answer: '4.5',
        typedWrong: [{ answer: '6.0', why: 'Every x was 1, so the model only learned w + b = 3; from zero, w = b = 1.5.' }],
        explain: 'The data never said how y changes with x: w and b split the 3 evenly. 2 × 1.5 + 1.5 = 4.5.',
      },
      {
        id: 'f9-13-5',
        type: 'mcq',
        prompt: 'Where does `for xb, yb in loader:` go?',
        options: [
          { text: 'Inside the epoch loop' },
          { text: 'Outside the epoch loop', why: 'Then each batch would get all the epochs in a row.' },
          { text: 'Between backward and step', why: 'The five lines run together for each batch.' },
        ],
        answer: 0,
        explain: 'Epochs outside, batches inside.',
      },
      {
        id: 'f9-13-6',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `x = torch.ones(8, 1)
ds = TensorDataset(x, 3 * x)
loader = DataLoader(ds, batch_size=4)
model = nn.Linear(1, 1)
loss_fn = nn.MSELoss()
ps = model.parameters()
opt = torch.optim.SGD(ps, lr=0.1)
for xb, yb in loader:
    pred = model(x)
    loss = loss_fn(pred, yb)
    opt.zero_grad()
    loss.backward()
    opt.step()`,
        error: 'RuntimeError: The size of tensor a (8) must match the size of tensor b (4) at non-singleton dimension 0',
        answer: 8,
        raiseLine: 9,
        lineWhy: {
          '0': 'The inputs.',
          '1': 'Inputs paired with targets.',
          '2': 'Batches of 4.',
          '3': 'The model.',
          '4': 'The loss function.',
          '5': 'The parameters.',
          '6': 'The optimiser.',
          '7': 'The batch loop.',
          '9': 'Right: it compares with the batch\'s targets.',
          '10': 'Clearing gradients.',
          '11': 'Backpropagation.',
          '12': 'The step.',
        },
        explain: 'Predict on the batch, `model(xb)`: all 8 rows against 4 targets cannot line up.',
      },
      {
        id: 'f9-13-7',
        type: 'fill-blank',
        prompt: 'Swap the optimiser for Adam.',
        code: `model = nn.Linear(1, 1)
ps = model.parameters()
opt = torch.optim.___(ps, lr=0.01)
print(type(opt).__name__)`,
        answer: ['Adam'],
        distractors: [
          { text: 'SGD', why: 'That is the one being replaced.' },
          { text: 'MSELoss', why: 'A loss, not an optimiser.' },
        ],
        expectOutput: 'Adam',
        explain: 'One line changes; the loop stays the same.',
      },
      {
        id: 'f9-13-8',
        type: 'run-code',
        prompt: 'Set `pred` to the model\'s predictions for `x_new`, without recording gradients.',
        before: `model = nn.Linear(2, 1)
x_new = torch.zeros(5, 2)`,
        solution: 'with torch.no_grad():\n    pred = model(x_new)',
        tests: [
          'assert tuple(pred.shape) == (5, 1), f"one prediction per row; got {tuple(pred.shape)}"',
          'assert not pred.requires_grad, "predict inside with torch.no_grad():"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'with ...',
        explain: 'Training loop and prediction: the whole cycle.',
      },
    ],
  },

  // ------------------------------------------------------------------ 14
  {
    id: 'f9-14',
    title: 'Checkpoint: the loop from memory',
    summary: 'A model, a loss, an optimiser and the training loop, written from a blank editor.',
    checkpoint: true,
    card: {
      title: 'Rebuild the loop, 3 of 3',
      text: 'The checkpoint: write the whole thing in an empty editor, then a mix from the unit. Get 8 of 10 right first time to test out.',
    },
    exercises: [
      {
        id: 'f9-14-1',
        type: 'run-code',
        prompt: 'Fit a line to `x` and `y`. Make `model` (nn.Linear), `loss_fn` (MSE) and `opt` (SGD, lr 0.1), then train for 200 epochs.',
        before: `x = torch.linspace(-1, 1, 20)
x = x.reshape(-1, 1)
y = 2 * x + 1`,
        solution: `model = nn.Linear(1, 1)
loss_fn = nn.MSELoss()
ps = model.parameters()
opt = torch.optim.SGD(ps, lr=0.1)
for epoch in range(200):
${LOOP.split('\n').map((l) => '    ' + l).join('\n')}`,
        tests: [
          'assert isinstance(model, nn.Linear), "model should be nn.Linear(1, 1)"',
          'w, b = model.weight.item(), model.bias.item()',
          'assert abs(w - 2) < 0.05 and abs(b - 1) < 0.05, f"should learn y = 2x + 1; got w={w:.2f}, b={b:.2f}"',
        ].join('\n'),
        maxLines: 10,
        placeholder: 'model = ...',
        explain: 'Setup, then the five lines. That is the whole of it.',
      },
      {
        id: 'f9-14-2',
        type: 'run-code',
        prompt: 'Write a class `Net` with one layer, `self.fc = nn.Linear(3, 1)`, applied in `forward`.',
        solution: `class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(3, 1)
    def forward(self, x):
        return self.fc(x)`,
        tests: [
          'net = Net()',
          'assert tuple(net(torch.zeros(4, 3)).shape) == (4, 1), "forward should apply self.fc"',
          'names = [n for n, _ in net.named_parameters()]',
          'assert names == ["fc.weight", "fc.bias"], f"one layer called fc; got {names}"',
        ].join('\n'),
        maxLines: 6,
        placeholder: 'class Net(nn.Module):\n    ...',
        explain: 'super().__init__() first; layers in __init__; wiring in forward.',
      },
      {
        id: 'f9-14-3',
        type: 'mcq',
        prompt: 'Which order is a training step?',
        options: [
          { text: 'predict, loss, zero_grad, backward, step' },
          { text: 'predict, loss, step, backward, zero_grad', why: 'step needs the gradients that backward computes.' },
          { text: 'zero_grad, step, predict, loss, backward', why: 'That steps on empty gradients; nothing changes.' },
        ],
        answer: 0,
        explain: 'zero_grad may also go first; step must follow backward.',
      },
      {
        id: 'f9-14-4',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `x = torch.tensor(3.0,
                 requires_grad=True)
y = x ** 2 + 2 * x
y.backward()
print(x.grad)`,
        answer: 'tensor(8.)',
        options: [
          { text: 'tensor(8.)' },
          { text: 'tensor(15.)', why: 'That is y; the gradient is 2x + 2.' },
          { text: 'tensor(6.)', why: 'Add the slope of 2x too: 6 + 2.' },
        ],
        explain: 'd(x² + 2x)/dx = 2x + 2 = 8.',
      },
      {
        id: 'f9-14-5',
        type: 'spot-bug',
        prompt: 'The data has 5 features. Which line is wrong?',
        code: `net = nn.Sequential(
    nn.Linear(3, 8),
    nn.ReLU(),
    nn.Linear(8, 2))
x = torch.zeros(10, 5)
out = net(x)`,
        error: 'RuntimeError: mat1 and mat2 shapes cannot be multiplied (10x5 and 3x8)',
        answer: 1,
        raiseLine: 5,
        lineWhy: {
          '0': 'A chain of layers.',
          '2': 'ReLU keeps the shape.',
          '3': '8 in matches the first layer\'s 8 out.',
          '4': 'The data: 10 examples of 5 features.',
          '5': 'Calling the network is right.',
        },
        explain: 'The first layer must take 5 features: `nn.Linear(5, 8)`.',
      },
      {
        id: 'f9-14-6',
        type: 'fill-blank',
        prompt: 'Batches of 32, shuffled.',
        code: `X = torch.zeros(100, 2)
ds = TensorDataset(X)
loader = DataLoader(ds, ___=32,
                    shuffle=True)
print(len(loader))`,
        answer: ['batch_size'],
        distractors: [
          { text: 'epochs', why: 'A DataLoader serves one epoch at a time; your loop counts epochs.' },
          { text: 'size', why: 'The argument is named batch_size.' },
        ],
        expectOutput: '4',
        explain: '32 + 32 + 32 + 4.',
      },
      {
        id: 'f9-14-7',
        type: 'predict-shape',
        prompt: 'Type the output shape.',
        code: `layer = nn.Linear(16, 4)
x = torch.zeros(8, 16)`,
        target: 'layer(x)',
        answer: '(8, 4)',
        explain: '(examples, out_features).',
      },
      {
        id: 'f9-14-8',
        type: 'mcq',
        prompt: 'A script says `model.cuda()` and crashes on your laptop, which has no GPU. The fix?',
        options: [
          { text: 'Pick the device with is_available()' },
          { text: 'Delete every .to() call', why: 'Then it would never use a GPU, even where there is one.' },
          { text: 'Use .cpu() everywhere instead', why: 'That gives up the GPU on machines that have one.' },
        ],
        answer: 0,
        explain: '`device = "cuda" if torch.cuda.is_available() else "cpu"`, then `.to(device)`.',
      },
      {
        id: 'f9-14-9',
        type: 'spot-bug',
        prompt: 'Which line fails?',
        code: `model = nn.Linear(4, 1)
ps = model.parameters()
n = sum(p.numel() for p in ps)
print(n)
opt = torch.optim.SGD(ps, lr=0.1)`,
        error: 'ValueError: optimizer got an empty parameter list',
        answer: 4,
        lineWhy: {
          '0': 'The model is fine.',
          '1': 'ps is a generator: it can be used only once.',
          '2': 'Counting is fine, but it uses ps up.',
          '3': 'Printing 5 is fine.',
        },
        explain: 'Pass `model.parameters()` again: a used generator gives nothing.',
      },
      {
        id: 'f9-14-10',
        type: 'run-code',
        prompt: 'Write one epoch over `loader`: the batch loop and the five steps.',
        before: `x = torch.ones(8, 1)
ds = TensorDataset(x, 3 * x)
loader = DataLoader(ds, batch_size=4)
model = nn.Linear(1, 1)
nn.init.zeros_(model.weight)
nn.init.zeros_(model.bias)
loss_fn = nn.MSELoss()
ps = model.parameters()
opt = torch.optim.SGD(ps, lr=0.1)`,
        solution: `for xb, yb in loader:
    pred = model(xb)
    loss = loss_fn(pred, yb)
    opt.zero_grad()
    loss.backward()
    opt.step()`,
        tests: 'w = model.weight.item()\nassert abs(w - 0.96) < 1e-5, f"two batches from zero should give w = 0.96; got {w}"',
        maxLines: 6,
        placeholder: 'for xb, yb in loader:\n    ...',
        explain: 'You can write a PyTorch training loop from memory.',
      },
    ],
  },
];
