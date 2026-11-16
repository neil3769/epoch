import { f7Labs } from '../labs/f7';
import { f7Library } from '../library/f7';
import type { Unit } from '../schema';

/*
 * F7 Machine learning from scratch. A model with parameters, MSE, its
 * gradients, the training loop, many features in NumPy, the learning rate
 * (descent figure), train/validation split, overfitting, and choosing with
 * validation. Every numeric answer is executed.
 */
export const f7: Unit = {
  id: 'F7',
  track: 'foundations',
  title: 'Machine learning from scratch',
  blurb: 'Linear regression trained by gradient descent, by hand and in NumPy; learning rates, train/validation splits, overfitting, and choosing with validation.',
  prelude: 'import numpy as np',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'f7-01',
      title: 'A model with parameters',
      summary: 'A model is a function with adjustable numbers; the line w·x + b has two.',
      card: {
        title: 'A model with parameters',
        text: 'A model is a function with adjustable numbers, its parameters. The simplest is a line, prediction = w·x + b, where the weight w sets the slope and the bias b the starting height. Training means finding the w and b that make the predictions match the data.',
        code: `x = np.array([1.0, 2.0, 3.0])
w, b = 2.0, 1.0
print(w * x + b)`,
        output: '[3. 5. 7.]',
      },
      exercises: [
        {
          id: 'f7-1-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `x = np.array([0.0, 1.0, 2.0])
w, b = 3.0, -1.0
print(w * x + b)`,
          answer: '[-1.  2.  5.]',
          options: [
            { text: '[-1.  2.  5.]' },
            { text: '[ 3.  6.  9.]', why: 'That is w × (x + 1); the bias is added after multiplying.' },
            { text: '[0. 3. 6.]', why: 'The bias −1 is added to each prediction.' },
          ],
          explain: 'Each x times 3, minus 1.',
        },
        {
          id: 'f7-1-2',
          type: 'mcq',
          prompt: 'A model predicts price = w · area + b. What does w mean?',
          options: [
            { text: 'Price added per extra square metre' },
            { text: 'Price of a house with no area', why: 'That is b, the prediction at area 0.' },
            { text: 'How many houses there are', why: 'w is a rate: price per unit of area.' },
          ],
          answer: 0,
          explain: 'A weight is a slope: change in output per unit of input.',
        },
        {
          id: 'f7-1-3',
          type: 'predict-output',
          prompt: 'Type the prediction.',
          code: `w, b = 0.5, 10.0
print(w * 40 + b)`,
          answer: '30.0',
          explain: '0.5 × 40 + 10.',
        },
        {
          id: 'f7-1-4',
          type: 'fill-blank',
          prompt: 'Predict for every x.',
          code: `x = np.array([1.0, 2.0, 3.0])
w, b = 2.0, 1.0
print(w ___ x + b)`,
          answer: ['*'],
          distractors: [
            { text: '+', why: 'That adds w instead of scaling by it.' },
            { text: '-', why: 'That subtracts x from w.' },
          ],
          expectOutput: '[3. 5. 7.]',
          explain: 'Scale, then shift.',
        },
        {
          id: 'f7-1-5',
          type: 'mcq',
          prompt: 'How many parameters does the model w · x + b have?',
          options: [
            { text: 'Two' },
            { text: 'Three', why: 'x is the input, not a parameter: the model learns only w and b.' },
            { text: 'One', why: 'Both w and b are learned.' },
          ],
          answer: 0,
          explain: 'Large models have billions, but the idea is the same.',
        },
        {
          id: 'f7-1-6',
          type: 'predict-output',
          prompt: 'Two candidate lines against the data. What does this print?',
          code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([2.0, 4.0, 6.0])
a = np.abs(2 * x + 0 - y).sum()
c = np.abs(1 * x + 1 - y).sum()
print(a, c)`,
          answer: '0.0 3.0',
          options: [
            { text: '0.0 3.0' },
            { text: '3.0 0.0', why: 'w = 2, b = 0 hits every point exactly.' },
            { text: '0.0 0.0', why: 'x + 1 gives [2, 3, 4], which misses by 0, 1 and 2.' },
          ],
          explain: 'Measuring how wrong a model is: next lesson\'s topic.',
        },
        {
          id: 'f7-1-7',
          type: 'mcq',
          prompt: 'What does training a model mean?',
          options: [
            { text: 'Adjusting its parameters to fit data' },
            { text: 'Writing more code for the model', why: 'The code stays the same; the numbers in it change.' },
            { text: 'Collecting more input features', why: 'That changes the data, not the training.' },
          ],
          answer: 0,
          explain: 'Find the numbers that make the predictions right.',
        },
        {
          id: 'f7-1-8',
          type: 'run-code',
          prompt: 'Set `pred` to the model\'s predictions for `x`.',
          before: `x = np.array([10.0, 20.0])
w, b = 0.1, 5.0`,
          solution: 'pred = w * x + b',
          tests: 'assert np.allclose(pred, [6, 7]), f"0.1 × 10 + 5 = 6 and 0.1 × 20 + 5 = 7; got {pred}"',
          placeholder: 'pred = ...',
          explain: 'One line for all predictions.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'f7-02',
      title: 'Measuring wrong',
      summary: 'Mean squared error averages the squared misses: one number to make smaller.',
      card: {
        title: 'Measuring wrong',
        text: 'A loss turns "how wrong" into one number to make smaller. Mean squared error (MSE) averages the squared differences between predictions and targets, so big misses count far more than small ones and errors in opposite directions cannot cancel. It is the usual loss for predicting numbers.',
        code: `pred = np.array([3.0, 5.0, 7.0])
y = np.array([2.0, 5.0, 9.0])
print(((pred - y) ** 2).mean())`,
        output: '1.6666666666666667',
      },
      exercises: [
        {
          id: 'f7-2-1',
          type: 'predict-output',
          prompt: 'Type the MSE.',
          code: `pred = np.array([1.0, 2.0])
y = np.array([3.0, 2.0])
print(((pred - y) ** 2).mean())`,
          answer: '2.0',
          typedWrong: [{ answer: '-1.0', why: 'That is the mean error; square each miss before averaging.' }],
          explain: 'Misses −2 and 0; squares 4 and 0; mean 2.',
        },
        {
          id: 'f7-2-2',
          type: 'predict-output',
          prompt: 'Why square? What does this print?',
          code: `e = np.array([2.0, -2.0])
print(e.mean(), (e ** 2).mean())`,
          answer: '0.0 4.0',
          options: [
            { text: '0.0 4.0' },
            { text: '2.0 4.0', why: 'The plain mean lets +2 and −2 cancel to 0.' },
            { text: '0.0 0.0', why: 'Squares are positive, so they cannot cancel.' },
          ],
          explain: 'Two misses of 2 look perfect without squaring.',
        },
        {
          id: 'f7-2-3',
          type: 'mcq',
          prompt: 'Model A misses one of ten points by 10 and hits the rest. Model B misses all ten by 1. How do their MSEs compare?',
          options: [
            { text: 'A\'s is ten times B\'s' },
            { text: 'They are exactly equal', why: 'Both miss by 10 in total, but squaring makes the single big miss count 100.' },
            { text: 'A\'s is the smaller one', why: 'A: 100 / 10 = 10. B: 10 / 10 = 1.' },
          ],
          answer: 0,
          explain: 'MSE hates big misses.',
          check: 'a = np.array([10.0] + [0.0] * 9)\nassert np.mean(a ** 2) == 10 * np.mean(np.ones(10) ** 2)',
        },
        {
          id: 'f7-2-4',
          type: 'fill-blank',
          prompt: 'Mean squared error.',
          code: `pred = np.array([2.0, 4.0])
y = np.array([1.0, 1.0])
print(((pred - y) ___ 2).mean())`,
          answer: ['**'],
          distractors: [
            { text: '*', why: 'That doubles the misses instead of squaring them.' },
            { text: '+', why: 'That adds 2 to each miss.' },
          ],
          expectOutput: '5.0',
          explain: 'Misses 1 and 3; squares 1 and 9.',
        },
        {
          id: 'f7-2-5',
          type: 'predict-output',
          prompt: 'Perfect predictions. What does this print?',
          code: `y = np.array([1.5, 2.5])
print(((y - y) ** 2).mean())`,
          answer: '0.0',
          options: [
            { text: '0.0' },
            { text: '1.0', why: 'Every miss is 0, so the loss is 0.' },
          ],
          explain: 'The smallest possible MSE.',
        },
        {
          id: 'f7-2-6',
          type: 'spot-bug',
          prompt: 'Both predictions miss by 2, yet the loss is 0. Which line?',
          code: `pred = np.array([3.0, 1.0])
y = np.array([1.0, 3.0])
mse = (pred - y).mean()
assert mse > 0, mse`,
          error: 'AssertionError: 0.0',
          answer: 2,
          raiseLine: 3,
          lineWhy: {
            '0': 'The predictions are fine.',
            '1': 'The targets are fine.',
            '3': 'The check is right: these predictions are wrong.',
          },
          explain: 'Square before averaging: `((pred - y) ** 2).mean()`.',
        },
        {
          id: 'f7-2-7',
          type: 'mcq',
          prompt: 'You predict prices in euros. What unit is the MSE in?',
          options: [
            { text: 'Euros squared' },
            { text: 'Euros', why: 'The misses are squared, so the unit is too.' },
            { text: 'No unit at all', why: 'It has one: euros squared.' },
          ],
          answer: 0,
          explain: 'Its square root (RMSE) is back in euros, easier to report.',
        },
        {
          id: 'f7-2-8',
          type: 'run-code',
          prompt: 'Set `mse` to the mean squared error of `pred` against `y`.',
          before: `pred = np.array([2.0, 3.0, 4.0])
y = np.array([1.0, 3.0, 6.0])`,
          solution: 'mse = ((pred - y) ** 2).mean()',
          tests: 'assert abs(mse - 5 / 3) < 1e-9, f"squares 1, 0, 4: mean 5/3; got {mse}"',
          placeholder: 'mse = ...',
          explain: 'Difference, square, mean.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'f7-03',
      title: 'Gradients of the loss',
      summary: 'For MSE with w·x + b: ∂L/∂w = mean(2·err·x) and ∂L/∂b = mean(2·err), where err = pred − y.',
      card: {
        title: 'Gradients of the loss',
        text: 'To improve w and b, you need how the loss moves when each is nudged. For MSE with pred = w·x + b, the chain rule gives ∂L/∂w = mean(2·(pred − y)·x) and ∂L/∂b = mean(2·(pred − y)). The error drives both: no error, no change.',
        code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([2.0, 4.0, 6.0])
w, b = 1.0, 0.0
err = w * x + b - y
print((2 * err * x).mean(),
      (2 * err).mean())`,
        output: '-9.333333333333334 -4.0',
      },
      exercises: [
        {
          id: 'f7-3-1',
          type: 'mcq',
          prompt: '∂L/∂w = −9.3 at the current w. Which way should w move to lower the loss?',
          options: [
            { text: 'Up' },
            { text: 'Down', why: 'A negative slope means the loss falls as w rises.' },
          ],
          answer: 0,
          explain: 'The line is too shallow (w = 1, but the data has slope 2).',
        },
        {
          id: 'f7-3-2',
          type: 'predict-output',
          prompt: 'At the perfect line. What does this print?',
          code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([2.0, 4.0, 6.0])
err = 2.0 * x + 0.0 - y
print((2 * err * x).mean(),
      (2 * err).mean())`,
          answer: '0.0 0.0',
          options: [
            { text: '0.0 0.0' },
            { text: '2.0 0.0', why: 'Every error is 0, so both gradients are 0.' },
          ],
          explain: 'At the minimum the gradient is zero: nothing to fix.',
        },
        {
          id: 'f7-3-3',
          type: 'predict-output',
          prompt: 'Check the formula by nudging w. What does this print?',
          code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([2.0, 4.0, 6.0])
def loss(w, b):
    e = w * x + b - y
    return (e ** 2).mean()

h = 1e-6
d = (loss(1 + h, 0) - loss(1, 0)) / h
print(round(d, 3))`,
          answer: '-9.333',
          options: [
            { text: '-9.333' },
            { text: '-4.0', why: 'That is ∂L/∂b. Nudging w gives the w gradient.' },
            { text: '4.667', why: 'Nudging w gives the same −9.333 as the formula.' },
          ],
          explain: 'The formula and the nudge agree.',
        },
        {
          id: 'f7-3-4',
          type: 'fill-blank',
          prompt: 'The gradient for b.',
          code: `err = np.array([-1.0, -2.0, -3.0])
db = (2 * err).___()
print(db)`,
          answer: ['mean'],
          distractors: [
            { text: 'sum', why: 'The loss is a mean, so its gradient is too: −12 is three times too big.' },
            { text: 'max', why: 'Every example contributes, not just one.' },
          ],
          expectOutput: '-4.0',
          explain: 'Average over the examples, just like the loss.',
        },
        {
          id: 'f7-3-5',
          type: 'predict-output',
          prompt: 'One example: x = 2, y = 5, w = 1, b = 0. What does this print?',
          code: `x, y, w, b = 2.0, 5.0, 1.0, 0.0
err = w * x + b - y
print(2 * err * x, 2 * err)`,
          answer: '-12.0 -6.0',
          options: [
            { text: '-12.0 -6.0' },
            { text: '-6.0 -12.0', why: 'The w gradient includes x = 2, so it is the larger one.' },
            { text: '12.0 6.0', why: 'The prediction 2 is below 5, so the error is negative.' },
          ],
          explain: 'Both say "go up"; w more strongly, because x is 2.',
        },
        {
          id: 'f7-3-6',
          type: 'mcq',
          prompt: 'Why does x appear in ∂L/∂w but not in ∂L/∂b?',
          options: [
            { text: 'w is multiplied by x; b is not' },
            { text: 'b does not affect the loss', why: 'It does: it shifts every prediction.' },
            { text: 'x is always 1 for the bias', why: 'Not for the data; for b the "input" is effectively 1.' },
          ],
          answer: 0,
          explain: 'Chain rule: ∂pred/∂w = x, ∂pred/∂b = 1.',
        },
        {
          id: 'f7-3-7',
          type: 'spot-bug',
          prompt: 'The w gradient disagrees with nudging (−9.333). Which line?',
          code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([2.0, 4.0, 6.0])
err = 1.0 * x + 0.0 - y
dw = (2 * err).mean()
assert abs(dw + 9.333) < 1e-3, dw`,
          error: 'AssertionError: -4.0',
          answer: 3,
          raiseLine: 4,
          lineWhy: {
            '0': 'The inputs are fine.',
            '1': 'The targets are fine.',
            '2': 'The error with w = 1, b = 0 is right.',
            '4': 'The check is right: nudging gives −9.333.',
          },
          explain: 'Multiply by x: `(2 * err * x).mean()`. Without it, that is the b gradient.',
        },
        {
          id: 'f7-3-8',
          type: 'run-code',
          prompt: 'Set `dw` and `db`, the gradients of the MSE.',
          before: `x = np.array([1.0, 2.0])
y = np.array([3.0, 5.0])
w, b = 1.0, 1.0
err = w * x + b - y`,
          solution: 'dw = (2 * err * x).mean()\ndb = (2 * err).mean()',
          tests: 'assert abs(dw + 5) < 1e-9 and abs(db + 3) < 1e-9, f"errors are -1 and -2: dw = -5, db = -3; got {dw}, {db}"',
          maxLines: 2,
          placeholder: 'dw = ...',
          explain: 'Both negative: raise w and b.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'f7-04',
      title: 'The training loop',
      summary: 'Repeat: predict, measure the error, compute gradients, step each parameter against its gradient.',
      card: {
        title: 'The training loop',
        text: 'Training repeats four steps: predict, measure the error, compute the gradients, and step each parameter against its gradient. Each pass over the data is an epoch, and the loss should fall from one to the next. This loop, with bigger models and other losses, is how every neural network is trained.',
        code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([3.0, 5.0, 7.0])
w, b, lr = 0.0, 0.0, 0.05
for epoch in range(2000):
    err = w * x + b - y
    w -= lr * (2 * err * x).mean()
    b -= lr * (2 * err).mean()
print(round(w, 2), round(b, 2))`,
        output: '2.0 1.0',
      },
      exercises: [
        {
          id: 'f7-4-1',
          type: 'predict-output',
          prompt: 'One epoch from w = b = 0. What does this print?',
          code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([3.0, 5.0, 7.0])
w, b, lr = 0.0, 0.0, 0.05
err = w * x + b - y
w -= lr * (2 * err * x).mean()
b -= lr * (2 * err).mean()
print(round(w, 3), round(b, 3))`,
          answer: '1.133 0.5',
          options: [
            { text: '1.133 0.5' },
            { text: '-1.133 -0.5', why: 'The errors are negative, so subtracting the gradients raises w and b.' },
            { text: '2.0 1.0', why: 'One step only moves part of the way.' },
          ],
          explain: 'dw = −22.7 and db = −10, times 0.05.',
        },
        {
          id: 'f7-4-2',
          type: 'predict-output',
          prompt: 'The loss before and after that epoch. What does this print?',
          code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([3.0, 5.0, 7.0])
def loss(w, b):
    e = w * x + b - y
    return (e ** 2).mean()

print(round(loss(0, 0), 2),
      round(loss(17 / 15, 0.5), 2))`,
          answer: '27.67 5.49',
          options: [
            { text: '27.67 5.49' },
            { text: '27.67 27.67', why: 'The step moved w and b, and the loss fell a lot.' },
            { text: '5.49 27.67', why: 'The loss falls: from 27.67 to 5.49.' },
          ],
          explain: 'One step, a fifth of the loss.',
        },
        {
          id: 'f7-4-3',
          type: 'fill-blank',
          prompt: 'Update the weight.',
          code: `w, lr = 1.0, 0.1
dw, db = -4.0, 2.0
w -= lr * ___
print(w)`,
          answer: ['dw'],
          distractors: [
            { text: 'db', why: 'Each parameter steps against its own gradient.' },
            { text: 'w', why: 'The step uses the gradient, not the weight.' },
          ],
          expectOutput: '1.4',
          explain: 'w − 0.1 × (−4).',
        },
        {
          id: 'f7-4-4',
          type: 'mcq',
          prompt: 'What is an epoch?',
          options: [
            { text: 'One pass over all the training data' },
            { text: 'One parameter of the model', why: 'Parameters are w and b; an epoch is a unit of training time.' },
            { text: 'One prediction for one example', why: 'An epoch covers every example once.' },
          ],
          answer: 0,
          explain: 'Training runs for many epochs.',
        },
        {
          id: 'f7-4-5',
          type: 'mcq',
          prompt: 'The loss falls for 300 epochs, then stays flat at a low value. What now?',
          options: [
            { text: 'Stop: it has converged' },
            { text: 'Raise the learning rate', why: 'Flat and low means it is at the bottom; bigger steps would only bounce.' },
            { text: 'Start again from zero', why: 'Nothing is wrong: it found the minimum.' },
          ],
          answer: 0,
          explain: 'Then measure it on held-out data (lesson 7).',
        },
        {
          id: 'f7-4-6',
          type: 'predict-output',
          prompt: 'After training. What does this print?',
          code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([3.0, 5.0, 7.0])
w, b, lr = 0.0, 0.0, 0.05
for _ in range(2000):
    err = w * x + b - y
    w -= lr * (2 * err * x).mean()
    b -= lr * (2 * err).mean()
print(round(((w * x + b - y) ** 2)
            .mean(), 4))`,
          answer: '0.0',
          options: [
            { text: '0.0' },
            { text: '27.6667', why: 'That was the loss before training.' },
          ],
          explain: 'The data lies on a line, so the loss can reach 0.',
        },
        {
          id: 'f7-4-7',
          type: 'spot-bug',
          prompt: 'b never reaches 1. Which line is wrong?',
          code: `x = np.array([1.0, 2.0, 3.0])
y = np.array([3.0, 5.0, 7.0])
w, b, lr = 0.0, 0.0, 0.05
for _ in range(2000):
    err = w * x + b - y
    dw = (2 * err * x).mean()
    db = (2 * err).mean()
    w -= lr * dw
    b -= lr * dw
assert abs(b - 1) < 0.01, b`,
          error: 'AssertionError: ...',
          answer: 8,
          raiseLine: 9,
          lineWhy: {
            '0': 'The inputs are fine.',
            '1': 'The targets (y = 2x + 1) are fine.',
            '2': 'Starting values and rate are fine.',
            '3': 'Plenty of epochs.',
            '4': 'The error is right.',
            '5': 'The w gradient is right.',
            '6': 'The b gradient is right, but never used.',
            '7': 'The w update is right.',
            '9': 'The check is right: the best b is 1.',
          },
          explain: 'b must step with its own gradient: `b -= lr * db`.',
        },
        {
          id: 'f7-4-8',
          type: 'run-code',
          prompt: '`step(w, b)` does one epoch and returns the new `(w, b)`. Run 1000 epochs.',
          before: `x = np.array([0.0, 1.0, 2.0])
y = np.array([1.0, 3.0, 5.0])
def step(w, b, lr=0.1):
    err = w * x + b - y
    w = w - lr * (2 * err * x).mean()
    b = b - lr * (2 * err).mean()
    return w, b

w, b = 0.0, 0.0`,
          solution: 'for _ in range(1000):\n    w, b = step(w, b)',
          tests: 'assert abs(w - 2) < 1e-3 and abs(b - 1) < 1e-3, f"the data is y = 2x + 1; got w={w}, b={b}"',
          maxLines: 2,
          placeholder: 'for _ in range(1000):',
          explain: 'Training is just this, repeated.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'f7-05',
      title: 'Many features',
      summary: 'With a feature matrix X, predictions are X @ w + b and the weight gradient is 2 · Xᵀ @ err / n.',
      card: {
        title: 'Many features',
        text: 'With several features, X has one row per example and w one weight per feature, so every prediction is X @ w + b, in one line. The weight gradient becomes 2 · Xᵀ @ err / n: the same formula as before, done for every feature at once. Nothing else about the loop changes.',
        code: `X = np.array([[1.0, 2.0],
              [3.0, 4.0]])
w = np.array([0.5, -1.0])
b = 1.0
print(X @ w + b)`,
        output: '[-0.5 -1.5]',
      },
      exercises: [
        {
          id: 'f7-5-1',
          type: 'predict-shape',
          prompt: '100 examples, 3 features. What shape are the predictions?',
          code: `X = np.zeros((100, 3))
w = np.zeros(3)
b = 0.0`,
          target: 'X @ w + b',
          answer: '(100,)',
          options: [
            { text: '(100,)' },
            { text: '(3,)', why: 'One prediction per example, not per feature.' },
            { text: '(100, 3)', why: '`@` adds up each row\'s products: one number per row.' },
          ],
          explain: 'One prediction per row.',
        },
        {
          id: 'f7-5-2',
          type: 'predict-shape',
          prompt: 'What shape is the weight gradient?',
          code: `X = np.zeros((100, 3))
err = np.zeros(100)`,
          target: '2 * X.T @ err / 100',
          answer: '(3,)',
          options: [
            { text: '(3,)' },
            { text: '(100,)', why: 'That is the error\'s shape. The gradient has one entry per weight.' },
            { text: 'error', why: '(3, 100) @ (100,) works: the inner sizes match.' },
          ],
          explain: 'Same shape as w, as every gradient is.',
        },
        {
          id: 'f7-5-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `X = np.array([[1.0, 0.0],
              [0.0, 1.0],
              [1.0, 1.0]])
w = np.array([2.0, 3.0])
print(X @ w + 1)`,
          answer: '[3. 4. 6.]',
          options: [
            { text: '[3. 4. 6.]' },
            { text: '[2. 3. 5.]', why: 'The bias 1 is added to every prediction.' },
            { text: '[[3. 1.]\n [1. 4.]\n [3. 4.]]', why: 'That is X * w + 1; `@` sums each row.' },
          ],
          explain: 'Row 3 uses both features: 2 + 3 + 1.',
        },
        {
          id: 'f7-5-4',
          type: 'fill-blank',
          prompt: 'The weight gradient for every feature at once.',
          code: `X = np.ones((4, 3))
err = np.ones(4)
n = 4
print(2 * X.___ @ err / n)`,
          answer: ['T'],
          distractors: [
            { text: 'shape', why: '`X.shape` is a tuple; it cannot be matrix-multiplied.' },
            { text: 'ndim', why: '`X.ndim` is the number 2, not a matrix.' },
          ],
          expectOutput: '[2. 2. 2.]',
          explain: '(3, 4) @ (4,): one sum over examples per feature.',
        },
        {
          id: 'f7-5-5',
          type: 'mcq',
          prompt: 'What does Xᵀ @ err compute?',
          options: [
            { text: 'Per feature, the sum of err × feature' },
            { text: 'For each example, its prediction', why: 'That is X @ w.' },
            { text: 'The total error over all examples', why: 'It weights the error by each feature, once per feature.' },
          ],
          answer: 0,
          explain: 'Exactly the 1-D formula sum(err · x), for each column of X.',
        },
        {
          id: 'f7-5-6',
          type: 'predict-output',
          prompt: 'The vectorised gradient against a loop. What does this print?',
          code: `X = np.array([[1.0, 2.0],
              [3.0, 5.0]])
err = np.array([0.5, -1.0])
fast = 2 * X.T @ err / 2
slow = [(2 * err * X[:, j]).mean()
        for j in range(2)]
print(np.allclose(fast, slow))`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'Column j of Xᵀ @ err is the sum of err × X[:, j]; divided by n it is the mean.' },
          ],
          explain: 'One matrix product replaces the loop over features.',
        },
        {
          id: 'f7-5-7',
          type: 'spot-bug',
          prompt: 'Which line has the wrong shape?',
          code: `X = np.ones((5, 3))
w = np.zeros(2)
pred = X @ w`,
          error: 'ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0, with gufunc signature (n?,k),(k,m?)->(n?,m?) (size 2 is different from 3)',
          answer: 1,
          raiseLine: 2,
          lineWhy: {
            '0': 'Five examples with three features is fine.',
            '2': 'Python raises here, but `X @ w` is right; w needs one weight per feature.',
          },
          explain: '`np.zeros(X.shape[1])` always matches.',
        },
        {
          id: 'f7-5-8',
          type: 'run-code',
          prompt: 'Set `pred` to the predictions and `err` to `pred - y`.',
          before: `X = np.array([[1.0, 2.0],
              [2.0, 0.0]])
y = np.array([5.0, 3.0])
w = np.array([1.0, 1.0])
b = 0.5`,
          solution: 'pred = X @ w + b\nerr = pred - y',
          tests: 'assert np.allclose(pred, [3.5, 2.5]) and np.allclose(err, [-1.5, -0.5]), f"got {pred}, {err}"',
          maxLines: 2,
          placeholder: 'pred = ...',
          explain: 'The first two lines of every training step.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'f7-06',
      title: 'The learning rate',
      summary: 'Too small a rate crawls; too large bounces or explodes. Watch the loss curve.',
      card: {
        title: 'The learning rate',
        text: 'The learning rate decides how far each step goes: too small and training crawls, too large and the loss bounces or explodes. Plot the loss after every epoch; a smooth fall is right, and a jagged or rising curve means lower the rate. Here the curve is the loss as one weight changes.',
        figure: { kind: 'descent', a: 2, m: 1, start: -3, lr: 0.05, editableLr: true },
      },
      exercises: [
        {
          id: 'f7-6-1',
          type: 'figure',
          prompt: 'A steep loss curve. Choose a rate and reach the bottom within 5 steps.',
          figure: { kind: 'descent', a: 2, m: 1, start: -3, lr: 0.05, editableLr: true, goal: { within: 0.05, maxSteps: 5 } },
          explain: 'Steeper curves need smaller rates; around 0.25 is best here.',
        },
        {
          id: 'f7-6-2',
          type: 'predict-output',
          prompt: 'Loss (w − 3)², rate 1.1. What does this print?',
          code: `w, losses = 0.0, []
for _ in range(4):
    L = (w - 3) ** 2
    losses.append(round(L, 1))
    w -= 1.1 * 2 * (w - 3)
print(losses)`,
          answer: '[9.0, 13.0, 18.7, 26.9]',
          options: [
            { text: '[9.0, 13.0, 18.7, 26.9]' },
            { text: '[9.0, 5.8, 3.7, 2.4]', why: 'At 1.1 each step overshoots 3 by more than it started: the loss grows.' },
          ],
          explain: 'A rising loss curve: lower the rate.',
        },
        {
          id: 'f7-6-3',
          type: 'mcq',
          prompt: 'The loss goes 5.00, 4.98, 4.96, 4.94... and is still 3.1 after 1000 epochs. What do you try?',
          options: [
            { text: 'Raise the learning rate' },
            { text: 'Lower the learning rate', why: 'It is already crawling; smaller steps crawl slower.' },
            { text: 'Stop: it has converged', why: 'It is still falling steadily; it has not reached a bottom.' },
          ],
          answer: 0,
          explain: 'Smooth but slow: the steps are too small.',
        },
        {
          id: 'f7-6-4',
          type: 'mcq',
          prompt: 'The loss goes 5, 2, 9, 1, 14... What do you try?',
          options: [
            { text: 'Lower the learning rate' },
            { text: 'Raise the learning rate', why: 'The steps already overshoot; larger ones overshoot more.' },
            { text: 'Train for more epochs', why: 'More epochs of a bouncing run do not settle it.' },
          ],
          answer: 0,
          explain: 'Jagged and growing: overshooting.',
        },
        {
          id: 'f7-6-5',
          type: 'predict-output',
          prompt: 'Rate 0.01, ten steps on (w − 3)². What does this print?',
          code: `w = 0.0
for _ in range(10):
    w -= 0.01 * 2 * (w - 3)
print(round(w, 2))`,
          answer: '0.55',
          options: [
            { text: '0.55' },
            { text: '3.0', why: 'Each step closes only 2% of the gap: after 10 steps w is far from 3.' },
            { text: '0.06', why: 'The steps add up: about 0.06 each at first, shrinking slowly.' },
          ],
          explain: 'Too small: right direction, slow progress.',
        },
        {
          id: 'f7-6-6',
          type: 'fill-blank',
          prompt: 'Spot a diverging run from its losses.',
          code: `losses = [9.0, 13.0, 18.7, 26.9]
if losses[-1] ___ losses[0]:
    print("diverging")
else:
    print("ok")`,
          answer: ['>'],
          distractors: [
            { text: '<', why: 'That would flag a run whose loss went down.' },
            { text: '==', why: 'A loss exactly equal to the first is rare and not the sign.' },
          ],
          expectOutput: 'diverging',
          explain: 'Ending higher than it started.',
        },
        {
          id: 'f7-6-7',
          type: 'mcq',
          prompt: 'Age (20 to 80) and income (20,000 to 80,000) are both features. Why is the learning rate hard to pick?',
          options: [
            { text: 'One weight needs tiny steps, one big' },
            { text: 'Large numbers cannot be learned', why: 'They can, but they make the loss far steeper along one weight.' },
            { text: 'The rate must equal the feature size', why: 'There is no such rule; the scales just clash.' },
          ],
          answer: 0,
          explain: 'Standardise features first (F4, F6), and one rate suits them all.',
        },
        {
          id: 'f7-6-8',
          type: 'run-code',
          prompt: 'Set `ok` to True if every loss is lower than the one before.',
          before: 'losses = [5.0, 3.2, 2.1, 1.5, 1.2]',
          solution: 'pairs = zip(losses, losses[1:])\nok = all(a > b for a, b in pairs)',
          tests: 'assert ok is True, f"every loss falls; got {ok!r}"',
          maxLines: 2,
          placeholder: 'pairs = ...',
          explain: 'A healthy loss curve falls every epoch (for full-batch training like this).',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'f7-07',
      title: 'Hold data back',
      summary: 'Train on one part, measure on a held-out validation part; shuffle before splitting.',
      card: {
        title: 'Hold data back',
        text: 'A model can score well on data it has seen simply by memorising it, so hold some examples back. Train on one part and measure on the other, the validation set, which tells you how the model does on new data. Shuffle before splitting, so both parts look alike.',
        code: `rng = np.random.default_rng(0)
idx = rng.permutation(10)
train, val = idx[:8], idx[8:]
print(len(train), len(val))`,
        output: '8 2',
      },
      exercises: [
        {
          id: 'f7-7-1',
          type: 'mcq',
          prompt: 'A model scores 99% on the data it was trained on. What does that say about new data?',
          options: [
            { text: 'Little: measure it on held-out data' },
            { text: 'It will score 99% on new data too', why: 'It may have memorised the training data; only unseen data shows.' },
            { text: 'It will score about 50%', why: 'There is no way to know without testing on held-out data.' },
          ],
          answer: 0,
          explain: 'Training scores are optimistic by design.',
        },
        {
          id: 'f7-7-2',
          type: 'predict-output',
          prompt: 'An 80/20 split of 25 examples. Type what this prints.',
          code: `idx = np.arange(25)
k = int(0.8 * len(idx))
print(len(idx[:k]), len(idx[k:]))`,
          answer: '20 5',
          typedWrong: [{ answer: '80 20', why: 'Those are percentages; with 25 examples it is 20 and 5.' }],
          explain: 'k = 20.',
        },
        {
          id: 'f7-7-3',
          type: 'mcq',
          prompt: 'The data is sorted by label: all the cats, then all the dogs. You take the first 80% for training without shuffling. What goes wrong?',
          options: [
            { text: 'Validation holds only dogs' },
            { text: 'Nothing: 80% is the usual size', why: 'The size is fine; the parts no longer look alike.' },
            { text: 'Training gets too little data', why: 'Training gets 80%; the problem is what is in each part.' },
          ],
          answer: 0,
          explain: 'Shuffle first. (For data over time, split by time instead, so you never train on the future.)',
        },
        {
          id: 'f7-7-4',
          type: 'fill-blank',
          prompt: 'Split with no gap and no overlap.',
          code: `idx = np.arange(10)
k = 7
train, val = idx[:k], idx[___:]
print(len(train), len(val))`,
          answer: ['k'],
          distractors: [
            { text: 'k + 1', why: 'That skips example 7: it lands in neither part.' },
            { text: '0', why: 'Then validation is all the data, including the training part.' },
          ],
          expectOutput: '7 3',
          explain: 'Stop and start at the same index.',
        },
        {
          id: 'f7-7-5',
          type: 'predict-output',
          prompt: 'How many examples are in both parts? What does this print?',
          code: `rng = np.random.default_rng(1)
idx = rng.permutation(20)
train, val = idx[:15], idx[15:]
print(len(set(train) & set(val)))`,
          answer: '0',
          options: [
            { text: '0' },
            { text: '5', why: 'A permutation lists each index once, so the parts share nothing.' },
          ],
          explain: 'Any overlap would let the model be tested on what it trained on.',
        },
        {
          id: 'f7-7-6',
          type: 'mcq',
          prompt: 'You standardise every feature with the mean and spread of all the data, then split. What is wrong?',
          options: [
            { text: 'Validation data leaked into training' },
            { text: 'Nothing: the same numbers are used', why: 'The training step used statistics computed partly from validation examples.' },
            { text: 'Standardising is not allowed', why: 'It is fine, if computed on the training part only.' },
          ],
          answer: 0,
          explain: 'Split first; compute the mean and spread on training data; apply them to both (unit E5 on leakage).',
        },
        {
          id: 'f7-7-7',
          type: 'predict-output',
          prompt: 'A shuffle keeps every item. What does this print?',
          code: `rng = np.random.default_rng(2)
print(np.sort(rng.permutation(5)))`,
          answer: '[0 1 2 3 4]',
          options: [
            { text: '[0 1 2 3 4]' },
            { text: '[1 2 3 4 5]', why: '`permutation(5)` shuffles 0 to 4.' },
          ],
          explain: 'Shuffling changes the order, never the contents.',
        },
        {
          id: 'f7-7-8',
          type: 'run-code',
          prompt: 'Set `X_train` to the rows of `X` at the first 8 indices in `idx`, and `X_val` to the rest. `X[some_indices]` picks those rows.',
          before: `X = np.arange(20).reshape(10, 2)
rng = np.random.default_rng(0)
idx = rng.permutation(10)`,
          solution: 'X_train = X[idx[:8]]\nX_val = X[idx[8:]]',
          tests: [
            'assert X_train.shape == (8, 2) and X_val.shape == (2, 2), f"8 and 2 rows; got {X_train.shape}, {X_val.shape}"',
            'rows = {tuple(r) for r in X_train} | {tuple(r) for r in X_val}',
            'assert len(rows) == 10, "every row in exactly one part"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'X_train = ...',
          explain: 'Split the indices, then use them for X and y alike, so rows stay matched.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'f7-08',
      title: 'Overfitting',
      summary: 'A too-flexible model memorises noise: training loss falls while validation loss rises.',
      card: {
        title: 'Overfitting',
        text: 'A flexible enough model can thread through every training point, noise included. Then training loss keeps falling while validation loss rises: overfitting, which is memorising instead of learning the pattern. A widening gap between the two losses is the warning sign.',
        code: `x = np.linspace(0, 1, 6)
noise = np.tile([1, -1], 3)
y = 2 * x + 0.1 * noise
for d in [1, 5]:
    c = np.polyfit(x, y, d)
    err = np.polyval(c, x) - y
    mse = (err ** 2).mean()
    print(d, round(mse, 4))`,
        output: '1 0.0091\n5 0.0',
      },
      exercises: [
        {
          id: 'f7-8-1',
          type: 'mcq',
          prompt: 'Training loss 0.01, validation loss 0.9. What is happening?',
          options: [
            { text: 'Overfitting' },
            { text: 'Underfitting', why: 'Underfitting shows a high training loss too.' },
            { text: 'A good fit', why: 'A good fit does about as well on new data as on training data.' },
          ],
          answer: 0,
          explain: 'Great on what it has seen, poor on what it has not.',
        },
        {
          id: 'f7-8-2',
          type: 'mcq',
          prompt: 'Training loss 0.80, validation loss 0.82, and both are high. What is happening?',
          options: [
            { text: 'Underfitting' },
            { text: 'Overfitting', why: 'There is no gap: it has not even fit the training data.' },
            { text: 'A good fit', why: 'Both losses are high: the model is too simple or undertrained.' },
          ],
          answer: 0,
          explain: 'Try a richer model or more training.',
        },
        {
          id: 'f7-8-3',
          type: 'predict-output',
          prompt: 'The same two fits, measured between the training points. What does this print?',
          code: `x = np.linspace(0, 1, 6)
noise = np.tile([1, -1], 3)
y = 2 * x + 0.1 * noise
xv = x[:-1] + 0.1
yv = 2 * xv
for d in [1, 5]:
    c = np.polyfit(x, y, d)
    err = np.polyval(c, xv) - yv
    print(d, (err ** 2).mean() < 0.01)`,
          answer: '1 True\n5 False',
          options: [
            { text: '1 True\n5 False' },
            { text: '1 False\n5 True', why: 'The degree-5 curve bends to hit every noisy point, so it is off in between.' },
          ],
          explain: 'Perfect on training points, worse on new ones: overfitting.',
        },
        {
          id: 'f7-8-4',
          type: 'mcq',
          prompt: 'Which of these usually reduces overfitting?',
          options: [
            { text: 'More training data' },
            { text: 'Training for more epochs', why: 'Longer training lets it memorise more.' },
            { text: 'A more flexible model', why: 'More flexibility means more room to memorise noise.' },
          ],
          answer: 0,
          explain: 'More data makes noise harder to memorise. A simpler model or stopping earlier also help.',
        },
        {
          id: 'f7-8-5',
          type: 'predict-output',
          prompt: 'The gap per epoch. What does this print?',
          code: `train = np.array([.5, .2, .08, .02])
val = np.array([.52, .25, .18, .3])
print(np.round(val - train, 2))`,
          answer: '[0.02 0.05 0.1  0.28]',
          options: [
            { text: '[0.02 0.05 0.1  0.28]' },
            { text: '[-0.02 -0.05 -0.1  -0.28]', why: 'Validation loss is the larger one: val − train is positive.' },
          ],
          explain: 'A gap that keeps widening: overfitting has started.',
        },
        {
          id: 'f7-8-6',
          type: 'fill-blank',
          prompt: 'The gap at the last epoch.',
          code: `train_loss = [0.4, 0.1, 0.03]
val_loss = [0.45, 0.2, 0.35]
gap = val_loss[-1] ___ train_loss[-1]
print(round(gap, 2))`,
          answer: ['-'],
          distractors: [
            { text: '+', why: 'The gap is the difference, not the sum.' },
            { text: '/', why: 'A ratio is another measure; the gap is the difference.' },
          ],
          expectOutput: '0.32',
          explain: '0.35 − 0.03.',
        },
        {
          id: 'f7-8-7',
          type: 'match-pairs',
          prompt: 'Match each pattern to its diagnosis.',
          pairs: [
            { left: 'train low, validation high', right: 'overfitting', why: 'Memorised, not learned.' },
            { left: 'both high', right: 'underfitting', why: 'Too simple or too little training.' },
            { left: 'both low and close', right: 'a good fit', why: 'It works on new data too.' },
            { left: 'validation falls, then rises', right: 'stop at its lowest point', why: 'Early stopping (next lesson).' },
          ],
          explain: 'Always look at both curves.',
        },
        {
          id: 'f7-8-8',
          type: 'run-code',
          prompt: 'Set `gap` to the validation loss minus the training loss at the last epoch.',
          before: `train_loss = [0.6, 0.3, 0.1, 0.05]
val_loss = [0.62, 0.35, 0.3, 0.4]`,
          solution: 'gap = val_loss[-1] - train_loss[-1]',
          tests: 'assert abs(gap - 0.35) < 1e-9, f"0.4 − 0.05; got {gap}"',
          placeholder: 'gap = ...',
          explain: 'Track it every epoch.',
        },
      ],
    },

    // ------------------------------------------------------------------ 9
    {
      id: 'f7-09',
      title: 'Choose with validation',
      summary: 'Use validation loss to choose settings and when to stop; keep a test set for one final, honest score.',
      card: {
        title: 'Choose with validation',
        text: 'Use the validation set to make choices: which model, how flexible, how many epochs. Stopping when the validation loss stops improving (early stopping) and picking the setting with the lowest validation loss are the everyday tools. Keep a separate test set untouched until the very end, so its score stays honest.',
        code: `val = [0.52, 0.25, 0.18, 0.30, 0.55]
best = int(np.argmin(val))
print(best, val[best])`,
        output: '2 0.18',
      },
      exercises: [
        {
          id: 'f7-9-1',
          type: 'predict-output',
          prompt: 'Validation loss per epoch. Type the best epoch.',
          code: `val = [0.9, 0.6, 0.41, 0.44, 0.6]
print(int(np.argmin(val)))`,
          answer: '2',
          typedWrong: [{ answer: '0.41', why: 'That is the loss; argmin gives its position, the epoch.' }],
          explain: 'Keep the model from that epoch.',
        },
        {
          id: 'f7-9-2',
          type: 'mcq',
          prompt: 'You tried 50 settings and picked the one with the best validation score. Why is that score now a bit optimistic?',
          options: [
            { text: 'It was picked partly for its luck on that set' },
            { text: 'Validation data is always easy', why: 'It is not easier; choosing among many lets chance favour one.' },
            { text: 'The model trained on validation data', why: 'It did not; the choosing is what bends the score.' },
          ],
          answer: 0,
          explain: 'That is what the untouched test set is for.',
        },
        {
          id: 'f7-9-3',
          type: 'mcq',
          prompt: 'When do you use the test set?',
          options: [
            { text: 'Once, at the very end' },
            { text: 'After every change you try', why: 'Then it becomes another validation set, and its score is no longer honest.' },
            { text: 'As extra training data', why: 'Training on it ruins it as a measure.' },
          ],
          answer: 0,
          explain: 'One honest number to report.',
        },
        {
          id: 'f7-9-4',
          type: 'fill-blank',
          prompt: 'Early stopping: stop after 2 epochs with no improvement.',
          code: `val = [0.5, 0.3, 0.32, 0.35, 0.4]
best, wait = float("inf"), 0
for i, v in enumerate(val):
    if v ___ best:
        best, wait = v, 0
    else:
        wait += 1
    if wait == 2:
        break
print(i, best)`,
          answer: ['<'],
          distractors: [
            { text: '>', why: 'Nothing is larger than infinity, so it never records a best.' },
            { text: '==', why: 'No loss equals infinity, so nothing is recorded.' },
          ],
          expectOutput: '3 0.3',
          explain: 'Best at epoch 1; epochs 2 and 3 did not improve, so it stops at 3.',
        },
        {
          id: 'f7-9-5',
          type: 'predict-output',
          prompt: 'Validation loss for each polynomial degree. What does this print?',
          code: `val = {1: 0.30, 3: 0.10, 9: 0.60}
print(min(val, key=val.get))`,
          answer: '3',
          options: [
            { text: '3' },
            { text: '9', why: 'Degree 9 has the highest validation loss: it overfits.' },
            { text: '0.1', why: '`min` with `key` returns the key (the degree), not the value.' },
          ],
          explain: 'Flexible enough, not too flexible.',
        },
        {
          id: 'f7-9-6',
          type: 'mcq',
          prompt: 'From epoch 12, validation loss rises while training loss keeps falling. What do you keep?',
          options: [
            { text: 'The model from epoch 12' },
            { text: 'The model from the last epoch', why: 'Its training loss is lowest, but it does worse on new data.' },
            { text: 'Nothing: start again', why: 'Epoch 12 is a good model; just keep that one.' },
          ],
          answer: 0,
          explain: 'Save a copy at each new validation best.',
        },
        {
          id: 'f7-9-7',
          type: 'match-pairs',
          prompt: 'Match each part of the data to its job.',
          pairs: [
            { left: 'training set', right: 'fit the parameters', why: 'Gradient descent sees only this.' },
            { left: 'validation set', right: 'choose settings and when to stop', why: 'Measured often, never trained on.' },
            { left: 'test set', right: 'one final, honest score', why: 'Used once, at the end.' },
            { left: 'shuffling first', right: 'makes the parts alike', why: 'So each part looks like the whole.' },
          ],
          explain: 'Three parts, three jobs.',
        },
        {
          id: 'f7-9-8',
          type: 'run-code',
          prompt: 'Set `best` to the degree with the lowest validation loss.',
          before: 'val = {1: 0.42, 2: 0.15,\n       4: 0.12, 8: 0.70}',
          solution: 'best = min(val, key=val.get)',
          tests: 'assert best == 4, f"degree 4 has the lowest validation loss (0.12); got {best}"',
          placeholder: 'best = ...',
          explain: 'Choose by validation; report on test.',
        },
      ],
    },

    // ------------------------------------------------------------------ 10
    {
      id: 'f7-10',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can train a linear model by gradient descent and judge it honestly on held-out data.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each one, ask: is this about fitting the training data, or about how the model does on new data?',
      },
      exercises: [
        {
          id: 'f7-10-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `x = np.array([1.0, 3.0])
print(4 * x - 2)`,
          answer: '[ 2. 10.]',
          options: [
            { text: '[ 2. 10.]' },
            { text: '[ 4. 12.]', why: 'Subtract the bias 2 from each.' },
          ],
          explain: 'w = 4, b = −2.',
        },
        {
          id: 'f7-10-2',
          type: 'predict-output',
          prompt: 'Type the MSE.',
          code: `pred = np.array([1.0, 1.0])
y = np.array([2.0, 4.0])
print(((pred - y) ** 2).mean())`,
          answer: '5.0',
          explain: 'Misses −1 and −3; squares 1 and 9; mean 5.',
        },
        {
          id: 'f7-10-3',
          type: 'predict-output',
          prompt: 'The bias gradient. What does this print?',
          code: `err = np.array([1.0, -3.0])
print((2 * err).mean())`,
          answer: '-2.0',
          options: [
            { text: '-2.0' },
            { text: '-4.0', why: 'That is the sum of 2 × err; the gradient of a mean is a mean.' },
            { text: '2.0', why: 'The errors average −1, so the gradient is −2.' },
          ],
          explain: 'Negative: raise b.',
        },
        {
          id: 'f7-10-4',
          type: 'figure',
          prompt: 'Choose a rate and reach the bottom within 4 steps.',
          figure: { kind: 'descent', a: 1.5, m: 0, start: 2, lr: 0.05, editableLr: true, goal: { within: 0.05, maxSteps: 4 } },
          explain: 'Between crawling and overshooting there is a band of good rates.',
        },
        {
          id: 'f7-10-5',
          type: 'mcq',
          prompt: 'Training loss keeps falling; validation loss has risen for 10 epochs. What is it, and what do you do?',
          options: [
            { text: 'Overfitting: keep the best epoch' },
            { text: 'Underfitting: train it for longer', why: 'Training loss is low; it is memorising, so longer makes it worse.' },
            { text: 'A bad learning rate: raise it', why: 'The training loss falls smoothly, so the rate is fine.' },
          ],
          answer: 0,
          explain: 'Early stopping.',
        },
        {
          id: 'f7-10-6',
          type: 'spot-bug',
          prompt: 'The loss grows every epoch. Which line?',
          code: `x = np.array([1.0, 2.0])
y = np.array([2.0, 4.0])
w = 0.0
for _ in range(5):
    err = w * x - y
    w += 0.1 * (2 * err * x).mean()
assert abs(w - 2) < 1, w`,
          error: 'AssertionError: ...',
          answer: 5,
          raiseLine: 6,
          lineWhy: {
            '0': 'The inputs are fine.',
            '1': 'The targets (y = 2x) are fine.',
            '2': 'Starting at 0 is fine.',
            '3': 'Five epochs is enough to get close.',
            '4': 'The error is right.',
            '6': 'The check is right: w should head to 2.',
          },
          explain: 'Step against the gradient: `w -= ...`.',
        },
        {
          id: 'f7-10-7',
          type: 'fill-blank',
          prompt: 'Weight gradient for many features.',
          code: `X = np.array([[1.0, 2.0],
              [3.0, 4.0]])
err = np.array([1.0, -1.0])
print(2 * X.___ @ err / 2)`,
          answer: ['T'],
          distractors: [
            { text: 'shape', why: 'A shape tuple cannot be multiplied with `@`.' },
            { text: 'size', why: '`X.size` is the number 4, not a matrix.' },
          ],
          expectOutput: '[-2. -2.]',
          explain: 'Each feature\'s column weighted by the errors: (1 − 3) and (2 − 4).',
        },
        {
          id: 'f7-10-8',
          type: 'mcq',
          prompt: 'After choosing your model with validation data, you report a final score. Which data?',
          options: [
            { text: 'The test set, used just once' },
            { text: 'The validation set you chose by', why: 'You chose by it, so its score is optimistic.' },
            { text: 'The training set the model saw', why: 'The model has seen it: the most optimistic of all.' },
          ],
          answer: 0,
          explain: 'Untouched until now.',
        },
        {
          id: 'f7-10-9',
          type: 'predict-output',
          prompt: 'One epoch on two points. What does this print?',
          code: `x = np.array([1.0, 2.0])
y = np.array([2.0, 4.0])
w, b = 0.0, 0.0
err = w * x + b - y
w -= 0.1 * (2 * err * x).mean()
b -= 0.1 * (2 * err).mean()
print(round(w, 2), round(b, 2))`,
          answer: '1.0 0.6',
          options: [
            { text: '1.0 0.6' },
            { text: '2.0 0.0', why: 'One step moves part of the way: dw = −10, db = −6, times 0.1.' },
            { text: '-1.0 -0.6', why: 'The errors are negative, so the parameters go up.' },
          ],
          explain: 'A tenth of each gradient.',
        },
        {
          id: 'f7-10-10',
          type: 'run-code',
          prompt: 'Take one gradient step on `w` (leave `b` alone).',
          before: `X = np.array([[1.0, 0.0],
              [0.0, 1.0]])
y = np.array([2.0, 4.0])
w = np.zeros(2)
b, lr = 0.0, 0.25
err = X @ w + b - y`,
          solution: 'w = w - lr * 2 * X.T @ err / len(y)',
          tests: 'assert np.allclose(w, [0.5, 1.0]), f"the gradient is [-2, -4]; a quarter of it is [0.5, 1.0]; got {w}"',
          placeholder: 'w = ...',
          explain: 'The whole update, vectorised.',
        },
      ],
    },
  ],
  labs: f7Labs,
  library: f7Library,
};
