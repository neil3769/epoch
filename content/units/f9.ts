import { f9Labs } from '../labs/f9';
import { f9Library } from '../library/f9';
import type { Lesson, Unit } from '../schema';
import { f9More } from './f9-more';

/*
 * F9 PyTorch. Tensors, autograd, gradients that accumulate and no_grad,
 * nn.Linear, nn.Module, losses, optimisers; then (f9-more) the five-line
 * training loop, Dataset/DataLoader, devices, reading PyTorch's errors, and
 * three lessons that rebuild the loop with less help each time, ending at a
 * blank editor.
 *
 * In the app `import torch` loads the NumPy stand-in (src/python/epoch_torch.py).
 * verify-content runs every snippet there, and scripts/verify_torch.py runs
 * the same code with real PyTorch and compares (reports/torch-crosscheck.md).
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f9-01',
    title: 'Tensors',
    summary: 'A tensor is PyTorch\'s array: shapes, indexing and @ work as in NumPy, with float32 as the usual dtype.',
    card: {
      title: 'Tensors',
      text: 'A PyTorch tensor is an array like NumPy\'s that can also track gradients and run on a GPU. Make one with `torch.tensor`; shapes, indexing, `@` and broadcasting work as in NumPy. Decimal numbers become `float32`, the dtype networks use, and whole numbers `int64`.',
      code: `import torch
x = torch.tensor([[1.0, 2.0],
                  [3.0, 4.0]])
print(x.shape, x.dtype)
print(x @ x)`,
      output: 'torch.Size([2, 2]) torch.float32\ntensor([[ 7., 10.],\n        [15., 22.]])',
    },
    exercises: [
      {
        id: 'f9-1-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `x = torch.tensor([1.0, 2.0])
print(x * 2)`,
        answer: 'tensor([2., 4.])',
        options: [
          { text: 'tensor([2., 4.])' },
          { text: '[2. 4.]', why: 'That is how NumPy prints; a tensor prints as tensor(...).' },
          { text: 'tensor([1., 2., 1., 2.])', why: 'Tensors multiply element by element, unlike Python lists.' },
        ],
        explain: 'Element-wise, as in NumPy.',
      },
      {
        id: 'f9-1-2',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `x = torch.zeros(3, 4)
print(x.shape)`,
        answer: 'torch.Size([3, 4])',
        typedWrong: [{ answer: '(3, 4)', why: 'A tensor\'s shape prints as torch.Size([3, 4]); it behaves like the tuple (3, 4).' }],
        explain: '`torch.zeros(3, 4)` takes the sizes directly, no extra brackets.',
      },
      {
        id: 'f9-1-3',
        type: 'mcq',
        prompt: 'What is the dtype of `torch.tensor([1, 2, 3])`?',
        options: [
          { text: 'torch.int64' },
          { text: 'torch.float32', why: 'Whole numbers give an integer tensor; write 1.0 for floats.' },
          { text: 'torch.int32', why: 'PyTorch\'s default integer type is 64-bit.' },
        ],
        answer: 0,
        explain: 'Class labels are int64; inputs and weights are float32.',
      },
      {
        id: 'f9-1-4',
        type: 'fill-blank',
        prompt: 'Make a tensor from a nested list.',
        code: `x = torch.___([[1.0, 2.0]])
print(x.shape)`,
        answer: ['tensor'],
        distractors: [
          { text: 'array', why: 'That is NumPy\'s name; PyTorch\'s is `torch.tensor`.' },
          { text: 'zeros', why: '`torch.zeros` takes sizes, not values.' },
        ],
        expectOutput: 'torch.Size([1, 2])',
        explain: 'One row, two columns.',
      },
      {
        id: 'f9-1-5',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `x = torch.tensor([[1, 2],
                  [3, 4]])
print(x[1], x.sum())`,
        answer: 'tensor([3, 4]) tensor(10)',
        options: [
          { text: 'tensor([3, 4]) tensor(10)' },
          { text: 'tensor([1, 2]) tensor(10)', why: 'Index 1 is the second row.' },
          { text: 'tensor([3, 4]) 10', why: 'A sum is still a tensor, with no dimensions: tensor(10).' },
        ],
        explain: 'Indexing as in NumPy; a single value prints as tensor(10).',
      },
      {
        id: 'f9-1-6',
        type: 'predict-shape',
        prompt: 'What is the shape of the result?',
        code: `A = torch.zeros(5, 3)
B = torch.zeros(3, 2)`,
        target: 'A @ B',
        answer: '(5, 2)',
        options: [
          { text: '(5, 2)' },
          { text: '(3, 3)', why: 'The shared 3 is summed away: (5, 3) @ (3, 2).' },
          { text: '(5, 3)', why: 'B changes the 3 columns into 2.' },
        ],
        explain: 'Same rule as F3: (m, n) @ (n, p) = (m, p).',
      },
      {
        id: 'f9-1-7',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `t = torch.tensor([2.5, 3.5])
print(t.mean().item())`,
        answer: '3.0',
        typedWrong: [{ answer: 'tensor(3.)', why: '`.item()` turns a one-value tensor into a plain Python number.' }],
        explain: '`.item()` is how you get the loss out as a number to print or log.',
      },
      {
        id: 'f9-1-8',
        type: 'run-code',
        prompt: 'Set `x` to a float tensor with rows [1, 2] and [3, 4].',
        solution: 'x = torch.tensor([[1., 2.], [3., 4.]])',
        tests: [
          'assert x.shape == (2, 2), f"two rows of two; got {x.shape}"',
          'assert x.dtype == torch.float32, f"use decimals (1.0) for a float tensor; got {x.dtype}"',
          'assert x.sum().item() == 10, f"values 1, 2, 3, 4; got {x}"',
        ].join('\n'),
        placeholder: 'x = torch.tensor(...)',
        explain: 'Writing 1. or 1.0 makes the values floats.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f9-02',
    title: 'Autograd',
    summary: 'With requires_grad=True, PyTorch records the operations; .backward() fills .grad.',
    card: {
      title: 'Autograd',
      text: 'Create a tensor with `requires_grad=True` and PyTorch records every operation on it. Calling `.backward()` on a one-value result runs backpropagation for you, and the gradient lands in `.grad`. This replaces all the backward code you wrote in F8.',
      code: `w = torch.tensor(3.0,
                 requires_grad=True)
loss = (w * 2 - 10) ** 2
loss.backward()
print(w.grad)`,
      output: 'tensor(-16.)',
    },
    exercises: [
      {
        id: 'f9-2-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `x = torch.tensor(2.0,
                 requires_grad=True)
y = x ** 3
y.backward()
print(x.grad)`,
        answer: 'tensor(12.)',
        options: [
          { text: 'tensor(12.)' },
          { text: 'tensor(8.)', why: 'That is y itself, 2³; the gradient is 3x² = 12.' },
          { text: 'tensor(6.)', why: 'The slope of x³ is 3x², and x² is 4.' },
        ],
        explain: 'd(x³)/dx = 3x² = 12 at x = 2.',
      },
      {
        id: 'f9-2-2',
        type: 'mcq',
        prompt: 'What does `loss.backward()` compute?',
        options: [
          { text: 'Gradients for tracked tensors' },
          { text: 'The loss value itself, again', why: 'The loss was computed in the forward pass; backward computes its gradients.' },
          { text: 'A step that updates the weights', why: 'It only fills `.grad`; changing the weights is a separate step.' },
        ],
        answer: 0,
        explain: 'Every tensor with requires_grad=True that the loss depends on gets a .grad.',
      },
      {
        id: 'f9-2-3',
        type: 'predict-output',
        prompt: 'A gradient for each value. What does this print?',
        code: `w = torch.tensor([1.0, 2.0],
                 requires_grad=True)
loss = (w * w).sum()
loss.backward()
print(w.grad)`,
        answer: 'tensor([2., 4.])',
        options: [
          { text: 'tensor([2., 4.])' },
          { text: 'tensor(5.)', why: '5 is the loss; .grad has one value per entry of w.' },
          { text: 'tensor([1., 4.])', why: 'That is w², the forward values; the slope of w² is 2w.' },
        ],
        explain: '.grad has the same shape as w: 2w for each entry.',
      },
      {
        id: 'f9-2-4',
        type: 'fill-blank',
        prompt: 'Compute the gradient.',
        code: `w = torch.tensor(3.0,
                 requires_grad=True)
loss = w ** 2
loss.___()
print(w.grad)`,
        answer: ['backward'],
        distractors: [
          { text: 'grad', why: '`.grad` is where the result lands; `.backward()` computes it.' },
          { text: 'step', why: 'Tensors have no step; optimisers do (lesson 7).' },
        ],
        expectOutput: 'tensor(6.)',
        explain: 'd(w²)/dw = 2w = 6.',
      },
      {
        id: 'f9-2-5',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `w = torch.tensor(2.0)
loss = (w - 5) ** 2
loss.backward()
print(w.grad)`,
        error: 'RuntimeError: element 0 of tensors does not require grad and does not have a grad_fn',
        answer: 0,
        raiseLine: 2,
        lineWhy: {
          '1': 'The loss is fine.',
          '2': 'This is where it fails: nothing was tracked, so there is nothing to backpropagate.',
          '3': 'Reading .grad is right, once there is one.',
        },
        explain: 'Nothing was tracked: create w with `requires_grad=True`.',
      },
      {
        id: 'f9-2-6',
        type: 'predict-output',
        prompt: 'The F7 model, with autograd. What does this print?',
        code: `x = torch.tensor([1.0, 2.0])
y = torch.tensor([3.0, 5.0])
w = torch.tensor(1.0,
                 requires_grad=True)
loss = ((w * x - y) ** 2).mean()
loss.backward()
print(w.grad)`,
        answer: 'tensor(-8.)',
        options: [
          { text: 'tensor(-8.)' },
          { text: 'tensor(8.)', why: 'The predictions are too low, so raising w lowers the loss: the slope is negative.' },
          { text: 'tensor(-16.)', why: 'That is the sum; the loss is a mean, so divide by 2.' },
        ],
        explain: 'mean(2 · err · x) = mean(2·(−2)·1, 2·(−3)·2) = −8: F7\'s formula, done for you.',
      },
      {
        id: 'f9-2-7',
        type: 'mcq',
        prompt: 'In F8 you wrote `dW = dZ.T @ X` by hand. With PyTorch you…',
        options: [
          { text: 'Call loss.backward() and read W.grad' },
          { text: 'Still write each layer\'s gradient', why: 'Autograd records the forward pass and works the gradients out itself.' },
          { text: 'Compute gradients by nudging', why: 'Nudging is slow; autograd gives exact gradients in one pass.' },
        ],
        answer: 0,
        explain: 'Same mathematics, computed for you.',
      },
      {
        id: 'f9-2-8',
        type: 'run-code',
        prompt: 'Run backpropagation, then set `g` to the gradient of `loss` with respect to `w`.',
        before: `w = torch.tensor(4.0,
                 requires_grad=True)
loss = w ** 2`,
        solution: 'loss.backward()\ng = w.grad',
        tests: [
          'assert g is not None, "call loss.backward() first, then read w.grad"',
          'assert g.item() == 8, f"d(w²)/dw = 2w = 8; got {g}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'loss...\ng = ...',
        explain: 'Backward first, then read .grad.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'f9-03',
    title: 'Gradients add up',
    summary: '.backward() adds to .grad, so clear it each step; update weights inside torch.no_grad().',
    card: {
      title: 'Gradients add up',
      text: '`.backward()` adds to `.grad` instead of replacing it, so clear the gradient before each new step. Change weights inside `with torch.no_grad():`, so the update itself is not recorded. These two habits are what an optimiser will do for you in lesson 7.',
      code: `w = torch.tensor(1.0,
                 requires_grad=True)
for _ in range(2):
    (w * 3).backward()
print(w.grad)`,
      output: 'tensor(6.)',
    },
    exercises: [
      {
        id: 'f9-3-1',
        type: 'predict-output',
        prompt: 'Three backward calls in a row. What does this print?',
        code: `w = torch.tensor(1.0,
                 requires_grad=True)
for _ in range(3):
    (w * 2).backward()
    print(w.grad.item())`,
        answer: '2.0\n4.0\n6.0',
        options: [
          { text: '2.0\n4.0\n6.0' },
          { text: '2.0\n2.0\n2.0', why: 'Nothing clears .grad here, so each backward adds 2 more.' },
          { text: '2.0\n4.0\n8.0', why: 'It adds 2 each time; it does not double.' },
        ],
        explain: 'Gradients accumulate until you clear them.',
      },
      {
        id: 'f9-3-2',
        type: 'mcq',
        prompt: 'Why clear gradients before each training step?',
        options: [
          { text: 'Otherwise new gradients add to old ones' },
          { text: 'To save memory', why: 'The point is correctness: stale gradients would be added in.' },
          { text: 'backward() fails if .grad is set', why: 'It does not fail; it silently adds, which is worse.' },
        ],
        answer: 0,
        explain: 'Each step should use only this step\'s gradient.',
      },
      {
        id: 'f9-3-3',
        type: 'fill-blank',
        prompt: 'Clear the gradient after each use.',
        code: `w = torch.tensor(1.0,
                 requires_grad=True)
for _ in range(3):
    (w * 2).backward()
    print(w.grad.item())
    w.grad.___()`,
        answer: ['zero_'],
        distractors: [
          { text: 'item', why: '`.item()` reads the value; it changes nothing.' },
          { text: 'zero', why: 'In-place methods end in an underscore: `zero_`.' },
        ],
        expectOutput: '2.0\n2.0\n2.0',
        explain: 'The trailing underscore means "change this tensor in place".',
      },
      {
        id: 'f9-3-4',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `w = torch.tensor(1.0,
                 requires_grad=True)
loss = (w - 3) ** 2
loss.backward()
w -= 0.1 * w.grad`,
        error: 'RuntimeError: a leaf Variable that requires grad is being used in an in-place operation.',
        answer: 4,
        lineWhy: {
          '0': 'Creating w is fine.',
          '1': 'Part of creating w: it tracks gradients.',
          '2': 'The loss is fine.',
          '3': 'Backward fills w.grad, as it should.',
        },
        explain: 'Wrap the update in `with torch.no_grad():` so it is not recorded.',
      },
      {
        id: 'f9-3-5',
        type: 'predict-output',
        prompt: 'One step of gradient descent by hand. What does this print?',
        code: `w = torch.tensor(1.0,
                 requires_grad=True)
loss = (w - 3) ** 2
loss.backward()
with torch.no_grad():
    w -= 0.25 * w.grad
print(w)`,
        answer: 'tensor(2., requires_grad=True)',
        options: [
          { text: 'tensor(2., requires_grad=True)' },
          { text: 'tensor(2.)', why: 'w still tracks gradients; no_grad only paused the recording.' },
          { text: 'tensor(0., requires_grad=True)', why: 'The gradient is −4, so subtracting 0.25 × (−4) adds 1.' },
        ],
        explain: 'grad = 2(1 − 3) = −4; w = 1 + 1 = 2.',
      },
      {
        id: 'f9-3-6',
        type: 'order-lines',
        prompt: 'Put one step of gradient descent in order.',
        lines: [
          { text: 'w = torch.tensor(1.0,', fixed: true },
          { text: '                 requires_grad=True)', fixed: true },
          { text: 'loss = (w - 3) ** 2' },
          { text: 'loss.backward()' },
          { text: 'with torch.no_grad():' },
          { text: '    w -= 0.5 * w.grad' },
          { text: 'print(w.item())' },
        ],
        expectOutput: '3.0',
        explain: 'Loss, gradient, then an unrecorded update.',
      },
      {
        id: 'f9-3-7',
        type: 'mcq',
        prompt: 'What does `with torch.no_grad():` do?',
        options: [
          { text: 'Runs the code without recording it' },
          { text: 'Deletes all the stored gradients', why: 'It leaves .grad alone; it pauses recording new operations.' },
          { text: 'Turns requires_grad off for good', why: 'Only inside the block; afterwards recording resumes.' },
        ],
        answer: 0,
        explain: 'Use it for weight updates, and for predictions when you are not training.',
      },
      {
        id: 'f9-3-8',
        type: 'run-code',
        prompt: 'Take one step: inside `torch.no_grad()`, subtract 0.1 times the gradient from `w`.',
        before: `w = torch.tensor(1.0,
                 requires_grad=True)
loss = (w - 2) ** 2
loss.backward()`,
        solution: 'with torch.no_grad():\n    w -= 0.1 * w.grad',
        tests: [
          'assert abs(w.item() - 1.2) < 1e-6, f"grad is 2(1 − 2) = −2, so w = 1 + 0.2 = 1.2; got {w.item()}"',
          'assert w.requires_grad and w.grad_fn is None, "change w in place (w -= ...), inside no_grad"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'with torch.no_grad():\n    w -= ...',
        explain: 'In place, unrecorded: w is still the same tracked tensor.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 'f9-04',
    title: 'nn.Linear',
    summary: 'nn.Linear(in, out) holds a weight of shape (out, in) and a bias, and computes x @ W.T + b.',
    card: {
      title: 'nn.Linear',
      text: '`nn.Linear(in_features, out_features)` is a layer: it holds a weight of shape (out, in) and a bias, both tracking gradients, and computes `x @ W.T + b`, the layer you built in F8. Call it like a function on a batch whose rows are examples.',
      code: `import torch.nn as nn
layer = nn.Linear(3, 2)
W, b = layer.weight, layer.bias
print(W.shape, b.shape)
x = torch.zeros(5, 3)
print(layer(x).shape)`,
      output: 'torch.Size([2, 3]) torch.Size([2])\ntorch.Size([5, 2])',
    },
    exercises: [
      {
        id: 'f9-4-1',
        type: 'predict-shape',
        prompt: 'What shape comes out?',
        code: `layer = nn.Linear(4, 8)
x = torch.zeros(10, 4)`,
        target: 'layer(x)',
        answer: '(10, 8)',
        options: [
          { text: '(10, 8)' },
          { text: '(10, 4)', why: 'The layer turns 4 features into 8 outputs.' },
          { text: '(8, 10)', why: 'Examples stay as rows.' },
        ],
        explain: '(examples, out_features).',
      },
      {
        id: 'f9-4-2',
        type: 'mcq',
        prompt: 'What is the shape of `nn.Linear(4, 8).weight`?',
        options: [
          { text: '(8, 4)' },
          { text: '(4, 8)', why: 'PyTorch stores one row per output neuron: (out, in).' },
          { text: '(8,)', why: 'That is the bias.' },
        ],
        answer: 0,
        explain: 'As in F8: W is (neurons, inputs), and the layer uses W.T.',
      },
      {
        id: 'f9-4-3',
        type: 'predict-output',
        prompt: 'Weights set by hand. Type what this prints.',
        code: `layer = nn.Linear(2, 1)
with torch.no_grad():
    layer.weight.copy_(
        torch.tensor([[2.0, -1.0]]))
    layer.bias.fill_(0.5)
x = torch.tensor([[3.0, 1.0]])
print(layer(x).item())`,
        answer: '5.5',
        typedWrong: [
          { answer: '5.0', why: 'Add the bias: 2×3 − 1×1 + 0.5.' },
          { answer: '7.5', why: 'The second weight is −1.' },
        ],
        explain: 'A neuron, exactly as in F8.',
      },
      {
        id: 'f9-4-4',
        type: 'spot-bug',
        prompt: 'The data has 4 features. Which line is wrong?',
        code: `layer = nn.Linear(3, 2)
x = torch.zeros(5, 4)
out = layer(x)`,
        error: 'RuntimeError: mat1 and mat2 shapes cannot be multiplied (5x4 and 3x2)',
        answer: 0,
        raiseLine: 2,
        lineWhy: {
          '1': 'This is the data: 5 examples of 4 features.',
          '2': 'Calling the layer is right, once it expects 4 inputs.',
        },
        explain: 'The message shows the batch (5x4) against the layer\'s W.T (3x2): 4 ≠ 3.',
      },
      {
        id: 'f9-4-5',
        type: 'predict-output',
        prompt: 'Type how many numbers this layer learns.',
        code: `layer = nn.Linear(10, 3)
ps = layer.parameters()
print(sum(p.numel() for p in ps))`,
        answer: '33',
        typedWrong: [
          { answer: '30', why: 'Count the 3 biases too.' },
          { answer: '13', why: 'Every output has a weight for every input: 10 × 3.' },
        ],
        explain: '`.parameters()` yields the weight and the bias.',
      },
      {
        id: 'f9-4-6',
        type: 'fill-blank',
        prompt: 'Make a layer that turns each example\'s 3 features into 2 outputs.',
        code: `x = torch.zeros(5, 3)
layer = nn.Linear(___, ___)
print(layer(x).shape)`,
        answer: ['3', '2'],
        distractors: [{ text: '5', why: 'There are 5 examples, but the layer never depends on how many.' }],
        expectOutput: 'torch.Size([5, 2])',
        explain: 'in_features first, then out_features.',
      },
      {
        id: 'f9-4-7',
        type: 'mcq',
        prompt: 'What does `layer(x)` compute for `layer = nn.Linear(...)`?',
        options: [
          { text: 'x @ W.T + b' },
          { text: 'W @ x + b', why: 'Rows of x are examples, so the weights are transposed: x @ W.T.' },
          { text: 'x * W + b', why: 'It is a matrix multiply, not element-wise.' },
        ],
        answer: 0,
        explain: 'F8\'s layer, with W and b created and tracked for you.',
      },
      {
        id: 'f9-4-8',
        type: 'run-code',
        prompt: 'Set `layer` to a layer that turns 6 features into 2 outputs.',
        solution: 'layer = nn.Linear(6, 2)',
        tests: [
          'assert isinstance(layer, nn.Linear), "use nn.Linear"',
          'assert tuple(layer.weight.shape) == (2, 6), f"in_features 6, out_features 2; weight is {tuple(layer.weight.shape)}"',
        ].join('\n'),
        placeholder: 'layer = ...',
        explain: 'nn.Linear(in, out).',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'f9-05',
    title: 'Your own nn.Module',
    summary: 'A model is a class: layers in __init__ (after super().__init__()), their wiring in forward.',
    card: {
      title: 'Your own nn.Module',
      text: 'Build a model by subclassing `nn.Module`: create its layers in `__init__`, after `super().__init__()`, and connect them in `forward`. Every layer stored on `self` is registered, so `model.parameters()` finds all their weights.',
      code: `class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.hidden = nn.Linear(2, 8)
        self.out = nn.Linear(8, 1)

    def forward(self, x):
        h = torch.relu(self.hidden(x))
        return self.out(h)

net = Net()
print(net(torch.zeros(4, 2)).shape)`,
      output: 'torch.Size([4, 1])',
    },
    exercises: [
      {
        id: 'f9-5-1',
        type: 'predict-output',
        prompt: 'Type how many numbers this model learns.',
        code: `class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.hidden = nn.Linear(2, 8)
        self.out = nn.Linear(8, 1)

net = Net()
ps = net.parameters()
print(sum(p.numel() for p in ps))`,
        answer: '33',
        typedWrong: [
          { answer: '24', why: 'Count the biases: 8 and 1.' },
          { answer: '25', why: 'hidden has 2 × 8 weights and 8 biases; out has 8 weights and 1 bias.' },
        ],
        explain: '16 + 8 + 8 + 1: both layers were registered.',
      },
      {
        id: 'f9-5-2',
        type: 'spot-bug',
        prompt: 'Which line fails?',
        code: `class Net(nn.Module):
    def __init__(self):
        self.fc = nn.Linear(2, 1)

    def forward(self, x):
        return self.fc(x)

net = Net()`,
        error: 'AttributeError: cannot assign module before Module.__init__() call',
        answer: 2,
        lineWhy: {
          '0': 'Subclassing nn.Module is right.',
          '1': 'The constructor is right; its first line is missing.',
          '4': 'forward is fine.',
          '5': 'Calling the layer is fine.',
          '7': 'Creating the model is what runs __init__.',
        },
        explain: 'Call `super().__init__()` first, so nn.Module can register layers.',
      },
      {
        id: 'f9-5-3',
        type: 'mcq',
        prompt: 'What goes in `forward`?',
        options: [
          { text: 'How the layers connect, in to out' },
          { text: 'Creating the layers and weights', why: 'Create layers once in __init__; forward runs on every call.' },
          { text: 'The training loop for the model', why: 'Training happens outside the model.' },
        ],
        answer: 0,
        explain: '`net(x)` calls `forward(x)` for you.',
      },
      {
        id: 'f9-5-4',
        type: 'fill-blank',
        prompt: 'Set up nn.Module before adding layers.',
        code: `class Net(nn.Module):
    def __init__(self):
        super().___()
        self.fc = nn.Linear(3, 1)

    def forward(self, x):
        return self.fc(x)

print(Net()(torch.zeros(2, 3)).shape)`,
        answer: ['__init__'],
        distractors: [
          { text: 'forward', why: 'Running forward before setup fails; set up nn.Module with `__init__`.' },
          { text: 'parameters', why: 'That lists parameters; it does not set nn.Module up.' },
        ],
        expectOutput: 'torch.Size([2, 1])',
        explain: 'Always the first line of __init__.',
      },
      {
        id: 'f9-5-5',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.hidden = nn.Linear(2, 4)
        self.out = nn.Linear(4, 1)

net = Net()
names = [n for n, _ in
         net.named_parameters()]
print(names[:2])`,
        answer: "['hidden.weight', 'hidden.bias']",
        options: [
          { text: "['hidden.weight', 'hidden.bias']" },
          { text: "['hidden', 'out']", why: 'Those are the layers; each holds two parameters.' },
          { text: "['weight', 'bias']", why: 'Each layer has its own, named after the attribute.' },
        ],
        explain: 'Names follow the attributes you chose in __init__.',
      },
      {
        id: 'f9-5-6',
        type: 'predict-output',
        prompt: '`nn.Sequential` chains layers without writing a class. Type what this prints.',
        code: `net = nn.Sequential(
    nn.Linear(2, 4),
    nn.ReLU(),
    nn.Linear(4, 1))
print(len(list(net.parameters())))`,
        answer: '4',
        typedWrong: [
          { answer: '3', why: 'ReLU has no parameters; each Linear has two.' },
          { answer: '17', why: 'This counts parameter tensors, not the numbers inside them.' },
        ],
        explain: 'Two weights and two biases.',
      },
      {
        id: 'f9-5-7',
        type: 'order-lines',
        prompt: 'Finish the class.',
        lines: [
          { text: 'class Net(nn.Module):', fixed: true },
          { text: '    def __init__(self):' },
          { text: '        super().__init__()' },
          { text: '        self.fc = nn.Linear(3, 1)' },
          { text: '    def forward(self, x):', fixed: true },
          { text: '        return self.fc(x)', fixed: true },
          { text: 'print(Net()(torch.zeros(2, 3)).shape)', fixed: true },
        ],
        expectOutput: 'torch.Size([2, 1])',
        explain: 'super().__init__() first, then the layers.',
      },
      {
        id: 'f9-5-8',
        type: 'run-code',
        prompt: 'Write `forward` for this class: apply `self.fc`, then `torch.relu`. Indent it inside the class.',
        before: `class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Linear(2, 2)`,
        solution: `    def forward(self, x):
        return torch.relu(self.fc(x))`,
        tests: [
          'net = Net()',
          'with torch.no_grad():',
          '    net.fc.weight.copy_(torch.tensor([[1.0, 0.0], [0.0, -1.0]]))',
          '    net.fc.bias.zero_()',
          'out = net(torch.tensor([[2.0, 3.0]]))',
          'assert torch.allclose(out, torch.tensor([[2.0, 0.0]])), f"relu of [2, −3] is [2, 0]; got {out}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: '    def forward(self, x):\n        return ...',
        explain: 'forward is a method: four spaces in, inside the class.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'f9-06',
    title: 'Loss functions',
    summary: 'nn.MSELoss for numbers; nn.CrossEntropyLoss for classes, given raw scores and int64 labels.',
    card: {
      title: 'Loss functions',
      text: 'PyTorch has the usual losses ready-made: `nn.MSELoss()` for numbers and `nn.CrossEntropyLoss()` for classes. Cross-entropy takes raw scores (logits) of shape (examples, classes) and the true class indexes as `int64`; it applies softmax itself.',
      code: `loss_fn = nn.CrossEntropyLoss()
logits = torch.tensor([[2., 0., 0.]])
y = torch.tensor([0])
print(loss_fn(logits, y))`,
      output: 'tensor(0.2395)',
    },
    exercises: [
      {
        id: 'f9-6-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `loss_fn = nn.MSELoss()
pred = torch.tensor([1.0, 2.0])
y = torch.tensor([0.0, 0.0])
print(loss_fn(pred, y))`,
        answer: 'tensor(2.5000)',
        options: [
          { text: 'tensor(2.5000)' },
          { text: 'tensor(5.)', why: 'That is the sum of squares; MSE takes the mean.' },
          { text: 'tensor(1.5000)', why: 'The misses are squared: 1 and 4.' },
        ],
        explain: '(1 + 4) / 2. Tensors print 4 decimals when values are not whole.',
      },
      {
        id: 'f9-6-2',
        type: 'mcq',
        prompt: 'A model reads a handwritten digit and says which of 0–9 it is. Which loss?',
        options: [
          { text: 'nn.CrossEntropyLoss()' },
          { text: 'nn.MSELoss()', why: 'The digit is a class, not a quantity: 7 is not "more" than 3.' },
          { text: 'nn.BCEWithLogitsLoss()', why: 'That is for one yes/no output; ten classes need cross-entropy.' },
        ],
        answer: 0,
        explain: 'Ten classes, ten logits per image.',
      },
      {
        id: 'f9-6-3',
        type: 'spot-bug',
        prompt: 'Which line is wrong?',
        code: `loss_fn = nn.CrossEntropyLoss()
logits = torch.zeros(2, 3)
y = torch.tensor([0.0, 2.0])
loss = loss_fn(logits, y)`,
        error: 'RuntimeError: expected scalar type Long but found Float',
        answer: 2,
        raiseLine: 3,
        lineWhy: {
          '0': 'The right loss for classes.',
          '1': 'Two examples, three classes: fine.',
          '3': 'The call is right, once the labels are integers.',
        },
        explain: 'Class labels are int64: `torch.tensor([0, 2])`.',
      },
      {
        id: 'f9-6-4',
        type: 'predict-output',
        prompt: 'All logits equal: no idea. Type what this prints.',
        code: `loss_fn = nn.CrossEntropyLoss()
logits = torch.zeros(4, 3)
y = torch.tensor([0, 1, 2, 0])
loss = loss_fn(logits, y)
print(round(loss.item(), 4))`,
        answer: '1.0986',
        typedWrong: [{ answer: '0.0', why: 'Equal logits give each class ⅓, and −log(⅓) is not 0.' }],
        explain: '−log(1/3) = log 3 ≈ 1.0986: the loss of a pure guess among 3 classes.',
      },
      {
        id: 'f9-6-5',
        type: 'predict-shape',
        prompt: 'What shape is the loss?',
        code: `loss_fn = nn.MSELoss()
pred = torch.zeros(4, 1)
y = torch.ones(4, 1)
loss = loss_fn(pred, y)`,
        target: 'loss',
        answer: '()',
        options: [
          { text: '()' },
          { text: '(4, 1)', why: 'The loss averages over every example: one number.' },
          { text: '(4,)', why: 'It is a single value, with no dimensions.' },
        ],
        explain: 'One number, so `.backward()` can start from it.',
      },
      {
        id: 'f9-6-6',
        type: 'fill-blank',
        prompt: 'Choose the loss for predicting numbers.',
        code: `pred = torch.tensor([[2.0], [4.0]])
y = torch.tensor([[1.0], [1.0]])
loss_fn = nn.___()
print(loss_fn(pred, y))`,
        answer: ['MSELoss'],
        distractors: [
          { text: 'L1Loss', why: 'That averages the absolute misses: (1 + 3) / 2 = 2, not squared.' },
          { text: 'ReLU', why: 'An activation, not a loss: it takes one input.' },
        ],
        expectOutput: 'tensor(5.)',
        explain: '(1 + 9) / 2.',
      },
      {
        id: 'f9-6-7',
        type: 'mcq',
        prompt: 'Should the model apply softmax before `nn.CrossEntropyLoss`?',
        options: [
          { text: 'No: it applies softmax itself' },
          { text: 'Yes: it needs probabilities', why: 'It takes logits and applies (log-)softmax itself; doing it twice is wrong.' },
          { text: 'Only for two classes', why: 'Never: the loss always does it.' },
        ],
        answer: 0,
        explain: 'Apply softmax only when you want probabilities to show.',
      },
      {
        id: 'f9-6-8',
        type: 'run-code',
        prompt: 'Set `loss` to the cross-entropy of the scores `z` against the labels `y`.',
        before: `z = torch.tensor([[2.0, 0.5],
                  [0.1, 1.0]])
y = torch.tensor([0, 1])`,
        solution: 'loss = nn.CrossEntropyLoss()(z, y)',
        tests: [
          'ref = -torch.log_softmax(z, dim=1)[torch.arange(2), y].mean()',
          'assert abs(loss.item() - ref.item()) < 1e-6, f"expected {ref.item():.4f}; got {loss}"',
        ].join('\n'),
        placeholder: 'loss = ...',
        explain: 'Make the loss object, then call it on scores and labels.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 'f9-07',
    title: 'Optimisers',
    summary: 'An optimiser holds the parameters: zero_grad() clears gradients, step() moves each one against its gradient.',
    card: {
      title: 'Optimisers',
      text: 'An optimiser does the update for you. Give it the parameters and a learning rate, `torch.optim.SGD(model.parameters(), lr=0.1)`; then `opt.zero_grad()` clears old gradients and `opt.step()` moves every parameter against its gradient.',
      code: `w = nn.Parameter(torch.tensor(1.0))
opt = torch.optim.SGD([w], lr=0.25)
loss = (w - 3) ** 2
opt.zero_grad()
loss.backward()
opt.step()
print(w.item())`,
      output: '2.0',
    },
    exercises: [
      {
        id: 'f9-7-1',
        type: 'predict-output',
        prompt: 'Rate 0.5 this time. Type what this prints.',
        code: `w = nn.Parameter(torch.tensor(1.0))
opt = torch.optim.SGD([w], lr=0.5)
loss = (w - 3) ** 2
opt.zero_grad()
loss.backward()
opt.step()
print(w.item())`,
        answer: '3.0',
        typedWrong: [
          { answer: '2.0', why: 'grad is −4; 0.5 × 4 = 2, so w goes from 1 to 3.' },
          { answer: '-1.0', why: 'step moves against the gradient: w − 0.5 × (−4).' },
        ],
        explain: 'One step lands exactly on the minimum here.',
      },
      {
        id: 'f9-7-2',
        type: 'mcq',
        prompt: 'What does `opt.step()` do?',
        options: [
          { text: 'Moves each parameter downhill' },
          { text: 'Computes all the gradients', why: 'That is loss.backward(); step uses the gradients it left.' },
          { text: 'Clears all the old gradients', why: 'That is opt.zero_grad().' },
        ],
        answer: 0,
        explain: 'For SGD: p -= lr * p.grad, for every parameter.',
      },
      {
        id: 'f9-7-3',
        type: 'spot-bug',
        prompt: 'After two steps w should be 0.36. Which line needs a fix before it?',
        code: `w = nn.Parameter(torch.tensor(0.0))
opt = torch.optim.SGD([w], lr=0.1)
for _ in range(2):
    loss = (w - 1) ** 2
    loss.backward()
    opt.step()
v = round(w.item(), 2)
assert v == 0.36, v`,
        error: 'AssertionError: 0.56',
        answer: 4,
        raiseLine: 7,
        lineWhy: {
          '0': 'A parameter, as nn.Linear makes them.',
          '1': 'The optimiser is set up right.',
          '2': 'Two steps.',
          '3': 'The loss is right.',
          '5': 'The step is right, given a fresh gradient.',
          '6': 'Reading the result.',
          '7': 'The check is right: 0.2, then 0.36.',
        },
        explain: 'Call `opt.zero_grad()` before backward: step 2 used −2 − 1.6 instead of −1.6.',
      },
      {
        id: 'f9-7-4',
        type: 'fill-blank',
        prompt: 'Give the optimiser the model\'s weights.',
        code: `model = nn.Linear(1, 1)
opt = torch.optim.SGD(
    model.___(), lr=0.1)
print(type(opt).__name__)`,
        answer: ['parameters'],
        distractors: [
          { text: 'forward', why: 'forward computes outputs; the optimiser needs the parameters.' },
          { text: 'weight', why: '`model.weight` is a tensor, not a method to call; and it would miss the bias.' },
        ],
        expectOutput: 'SGD',
        explain: '`model.parameters()` yields every weight and bias.',
      },
      {
        id: 'f9-7-5',
        type: 'order-lines',
        prompt: 'The loss is computed. Finish the step.',
        lines: [
          { text: 'w = nn.Parameter(torch.tensor(1.0))', fixed: true },
          { text: 'opt = torch.optim.SGD([w], lr=0.25)', fixed: true },
          { text: 'loss = (w - 3) ** 2', fixed: true },
          { text: 'opt.zero_grad()', fixed: true },
          { text: 'loss.backward()' },
          { text: 'opt.step()' },
          { text: 'print(w.item())' },
        ],
        expectOutput: '2.0',
        explain: 'Gradients first, then the step.',
      },
      {
        id: 'f9-7-6',
        type: 'mcq',
        prompt: 'What does Adam do differently from SGD?',
        options: [
          { text: 'Adapts each parameter\'s step size' },
          { text: 'It skips the gradients entirely', why: 'Adam uses gradients too, with running averages.' },
          { text: 'Needs no learning rate', why: 'It has one (often 0.001); it is just less touchy.' },
        ],
        answer: 0,
        explain: '`torch.optim.Adam(model.parameters(), lr=1e-3)` is a common default.',
      },
      {
        id: 'f9-7-7',
        type: 'predict-output',
        prompt: 'A huge gradient, one Adam step. What does this print?',
        code: `w = nn.Parameter(torch.tensor(1.0))
opt = torch.optim.Adam([w], lr=0.1)
loss = (w - 100) ** 2
opt.zero_grad()
loss.backward()
opt.step()
print(round(w.item(), 3))`,
        answer: '1.1',
        options: [
          { text: '1.1' },
          { text: '20.8', why: 'That is what SGD would do: 1 + 0.1 × 198. Adam scales the step.' },
          { text: '1.0', why: 'The step does move w.' },
        ],
        explain: 'Adam\'s first step is about lr in size, however big the gradient.',
      },
      {
        id: 'f9-7-8',
        type: 'run-code',
        prompt: 'Set `opt` to an SGD optimiser for `model` with learning rate 0.01.',
        before: 'model = nn.Linear(3, 1)',
        solution: 'ps = model.parameters()\nopt = torch.optim.SGD(ps, lr=0.01)',
        tests: [
          'assert isinstance(opt, torch.optim.SGD), "use torch.optim.SGD"',
          'assert opt.param_groups[0]["lr"] == 0.01, f"learning rate 0.01; got {opt.param_groups[0][\'lr\']}"',
          'assert len(opt.param_groups[0]["params"]) == 2, "give it model.parameters(): the weight and the bias"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'opt = ...',
        explain: 'One line is fine too: `torch.optim.SGD(model.parameters(), lr=0.01)`.',
      },
    ],
  },
];

export const f9: Unit = {
  id: 'F9',
  track: 'foundations',
  title: 'PyTorch',
  blurb:
    'Tensors, autograd, nn.Module, losses, optimisers and the five-line training loop, until you can write it from memory. In the app, torch is a small NumPy stand-in with the same interface; the code runs unchanged on real PyTorch.',
  prelude: 'import numpy as np\nimport torch\nimport torch.nn as nn\nfrom torch.utils.data import TensorDataset, DataLoader',
  lessons: [...lessons, ...f9More],
  labs: f9Labs,
  library: f9Library,
};
