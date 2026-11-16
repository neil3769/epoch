import { f5Labs } from '../labs/f5';
import { f5Library } from '../library/f5';
import type { Unit } from '../schema';

/*
 * F5 Change and gradients. Slope of a line, the derivative as "nudge the
 * input, see how far the output moves", rules, downhill, gradient descent on
 * a curve (with the descent figure), partial derivatives, the gradient, the
 * chain rule with numbers. Every numeric answer is executed.
 */
export const f5: Unit = {
  id: 'F5',
  track: 'foundations',
  title: 'Change and gradients',
  blurb: 'Slope, the derivative as a nudge, which way is downhill, gradient descent, partial derivatives, the gradient and the chain rule, all with numbers.',
  prelude: 'import numpy as np',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'f5-01',
      title: 'Slope',
      summary: 'Slope is rise over run: how much the output changes for each step of 1 in the input.',
      card: {
        title: 'Slope',
        text: 'The slope of a straight line is how much the output rises for each step of 1 in the input: rise over run. For y = 3x + 1, going from x = 2 to x = 4 raises y from 7 to 13, so the slope is 6 / 2 = 3. A negative slope means the output falls as the input grows.',
        code: `def f(x):
    return 3 * x + 1

print((f(4) - f(2)) / (4 - 2))`,
        output: '3.0',
      },
      exercises: [
        {
          id: 'f5-1-1',
          type: 'predict-output',
          prompt: 'Type the slope.',
          code: `def f(x):
    return 2 * x + 5

print((f(3) - f(1)) / (3 - 1))`,
          answer: '2.0',
          typedWrong: [{ answer: '4.0', why: 'That is the rise (11 − 7). Divide by the run, 2.' }],
          explain: 'The number in front of x is the slope of a line.',
        },
        {
          id: 'f5-1-2',
          type: 'mcq',
          prompt: 'What is the slope of y = 5 − 2x?',
          options: [
            { text: '−2' },
            { text: '+5', why: '5 is where the line starts (at x = 0); it does not change with x.' },
            { text: '+2', why: 'y falls as x grows, so the slope is negative.' },
          ],
          answer: 0,
          explain: 'Each step of 1 in x lowers y by 2.',
        },
        {
          id: 'f5-1-3',
          type: 'predict-output',
          prompt: 'From the point (1, 10) to (5, 2). What does this print?',
          code: `x1, y1 = 1, 10
x2, y2 = 5, 2
print((y2 - y1) / (x2 - x1))`,
          answer: '-2.0',
          options: [
            { text: '-2.0' },
            { text: '2.0', why: 'y falls from 10 to 2, so the slope is negative.' },
            { text: '-8.0', why: '−8 is the rise; the run is 4.' },
          ],
          explain: '−8 over 4.',
        },
        {
          id: 'f5-1-4',
          type: 'fill-blank',
          prompt: 'Rise over run.',
          code: `x1, y1 = 1, 3
x2, y2 = 3, 7
print((y2 - y1) ___ (x2 - x1))`,
          answer: ['/'],
          distractors: [
            { text: '*', why: 'Rise times run is 8; slope divides them.' },
            { text: '-', why: 'Rise minus run is 2 only by luck here; slope is a ratio.' },
          ],
          expectOutput: '2.0',
          explain: '4 / 2 = 2.',
        },
        {
          id: 'f5-1-5',
          type: 'mcq',
          prompt: 'A weight goes from 1.0 to 1.2 and the loss goes from 4.0 to 3.4. What is the slope?',
          options: [
            { text: '−3' },
            { text: '−0.6', why: 'That is the change in loss; divide by the change in weight, 0.2.' },
            { text: '3', why: 'The loss fell, so the slope is negative.' },
          ],
          answer: 0,
          explain: '−0.6 / 0.2 = −3: raising this weight lowers the loss.',
          check: 'assert abs((3.4 - 4.0) / (1.2 - 1.0) + 3) < 1e-9',
        },
        {
          id: 'f5-1-6',
          type: 'predict-output',
          prompt: 'On a curve, the slope depends on where you look. What does this print?',
          code: `def f(x):
    return x ** 2

a = (f(2) - f(1)) / (2 - 1)
b = (f(4) - f(3)) / (4 - 3)
print(a, b)`,
          answer: '3.0 7.0',
          options: [
            { text: '3.0 7.0' },
            { text: '3.0 3.0', why: 'A curve gets steeper: from 9 to 16 is a rise of 7.' },
            { text: '1.0 1.0', why: 'The run is 1, but the rises are 3 and 7.' },
          ],
          explain: 'Steeper further out. The next lesson measures the slope at a single point.',
        },
        {
          id: 'f5-1-7',
          type: 'run-code',
          prompt: 'Set `m` to the slope of `f` between x = 0 and x = 2.',
          before: `def f(x):
    return 4 * x - 3`,
          solution: 'm = (f(2) - f(0)) / (2 - 0)',
          tests: 'assert abs(m - 4) < 1e-9, f"f rises 8 over a run of 2; got {m}"',
          placeholder: 'm = ...',
          explain: 'Rise over run: 8 / 2.',
        },
        {
          id: 'f5-1-8',
          type: 'mcq',
          prompt: 'What does a slope of 0 mean?',
          options: [
            { text: 'The output does not change' },
            { text: 'The output is always 0', why: 'A flat line can sit at any height, such as y = 5.' },
            { text: 'The input is always 0', why: 'Slope is about change, not about where x is.' },
          ],
          answer: 0,
          explain: 'Flat: nudging the input does nothing to the output.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'f5-02',
      title: 'Nudge the input',
      summary: 'The derivative is the slope at one point: nudge x by a tiny h and divide the change in output by h.',
      card: {
        title: 'Nudge the input',
        text: 'On a curve the slope changes from place to place, so measure it at one spot: nudge the input by a tiny h and see how far the output moves. The derivative is that ratio, (f(x + h) − f(x)) / h, as h shrinks towards 0. It answers: if I nudge this input a little, how much does the output move?',
        code: `def f(x):
    return x ** 2

h = 1e-6
print(round((f(3 + h) - f(3)) / h, 3))`,
        output: '6.0',
      },
      exercises: [
        {
          id: 'f5-2-1',
          type: 'predict-output',
          prompt: 'The same curve at x = 5. What does this print?',
          code: `def f(x):
    return x ** 2

h = 1e-6
print(round((f(5 + h) - f(5)) / h, 3))`,
          answer: '10.0',
          options: [
            { text: '10.0' },
            { text: '25.0', why: 'That is f(5), the height. The slope at 5 is 10.' },
            { text: '6.0', why: '6 was the slope at x = 3; it is steeper at 5.' },
          ],
          explain: 'For x², the slope at x is 2x.',
        },
        {
          id: 'f5-2-2',
          type: 'predict-output',
          prompt: 'A cube this time. Type what this prints.',
          code: `def f(x):
    return x ** 3

h = 1e-6
print(round((f(2 + h) - f(2)) / h, 2))`,
          answer: '12.0',
          typedWrong: [{ answer: '8.0', why: 'That is f(2) = 8, the height. The derivative is how fast it changes there.' }],
          explain: 'For x³ the slope at x is 3x², so 12 at x = 2.',
        },
        {
          id: 'f5-2-3',
          type: 'mcq',
          prompt: 'The derivative of the loss with respect to a weight is 8. You raise the weight by 0.01. Roughly what happens to the loss?',
          options: [
            { text: 'It rises by about 0.08' },
            { text: 'It falls by about 0.08', why: 'A positive derivative means the loss moves the same way as the weight.' },
            { text: 'It rises by about 8', why: 'The change scales with the nudge: 8 × 0.01.' },
          ],
          answer: 0,
          explain: 'Change in output ≈ derivative × nudge.',
          check: 'assert abs(8 * 0.01 - 0.08) < 1e-12',
        },
        {
          id: 'f5-2-4',
          type: 'fill-blank',
          prompt: 'The nudge estimate of the derivative.',
          code: `def f(x):
    return x ** 2

x, h = 1.0, 1e-6
d = (f(x + h) - f(x)) ___ h
print(round(d, 3))`,
          answer: ['/'],
          distractors: [
            { text: '*', why: 'The change times h is tiny; the rate divides by h.' },
            { text: '-', why: 'Subtracting h is not a rate.' },
          ],
          expectOutput: '2.0',
          explain: 'Change in output per unit of nudge.',
        },
        {
          id: 'f5-2-5',
          type: 'predict-output',
          prompt: 'A big nudge and a small one. What does this print?',
          code: `def f(x):
    return x ** 2

big = (f(3 + 1) - f(3)) / 1
small = (f(3.001) - f(3)) / 0.001
print(big, round(small, 3))`,
          answer: '7.0 6.001',
          options: [
            { text: '7.0 6.001' },
            { text: '6.0 6.0', why: 'A nudge of 1 measures the slope between 3 and 4, which is 7.' },
            { text: '7.0 7.0', why: 'The small nudge stays close to 3, so it is close to the true slope, 6.' },
          ],
          explain: 'The smaller the nudge, the closer to the slope at exactly 3.',
        },
        {
          id: 'f5-2-6',
          type: 'spot-bug',
          prompt: 'The estimate is far from 6. Which line is wrong?',
          code: `def f(x):
    return x ** 2
h = 10
d = (f(3 + h) - f(3)) / h
assert abs(d - 6) < 0.01, d`,
          error: 'AssertionError: 16.0',
          answer: 2,
          raiseLine: 4,
          lineWhy: {
            '0': 'The function is fine.',
            '1': 'x squared, as intended.',
            '3': 'The formula is right; the nudge is not small.',
            '4': 'The check is right: the slope of x² at 3 is 6.',
          },
          explain: 'A nudge of 10 measures a long stretch of curve. Use something tiny, such as 1e-6.',
        },
        {
          id: 'f5-2-7',
          type: 'mcq',
          prompt: 'Which sentence describes a derivative?',
          options: [
            { text: 'Output change per tiny input nudge' },
            { text: 'The value of the output at x', why: 'That is f(x) itself, not how it changes.' },
            { text: 'The average of all the outputs', why: 'A derivative is about change at one point.' },
          ],
          answer: 0,
          explain: 'A rate, measured at one point.',
        },
        {
          id: 'f5-2-8',
          type: 'run-code',
          prompt: 'Set `d` to the nudge estimate of the derivative of `f` at `x`.',
          before: `def f(x):
    return 3 * x ** 2

x, h = 2.0, 1e-6`,
          solution: 'd = (f(x + h) - f(x)) / h',
          tests: 'assert abs(d - 12) < 1e-3, f"the slope of 3x² at 2 is 12; got {d}"',
          placeholder: 'd = ...',
          explain: 'Nudge, measure, divide.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'f5-03',
      title: 'Derivative rules',
      summary: 'xⁿ has derivative n·xⁿ⁻¹; constants give 0; sums add. Check any rule with a nudge.',
      card: {
        title: 'Derivative rules',
        text: 'Common shapes have rules, so you rarely nudge by hand. The power rule says xⁿ has derivative n·xⁿ⁻¹ (x² gives 2x, x³ gives 3x²), a constant has derivative 0, and the derivative of a sum is the sum of the derivatives. A nudge checks any rule.',
        code: `def nudge(f, x, h=1e-6):
    return (f(x + h) - f(x)) / h

f = lambda x: x ** 3
d = nudge(f, 2)
print(round(d, 3), 3 * 2 ** 2)`,
        output: '12.0 12',
      },
      exercises: [
        {
          id: 'f5-3-1',
          type: 'mcq',
          prompt: 'What is the derivative of x⁴?',
          options: [
            { text: '4x³' },
            { text: '3x³', why: 'The number in front is the old power, 4.' },
            { text: '4x²', why: 'The power drops by one, to 3, not by two.' },
          ],
          answer: 0,
          explain: 'n·xⁿ⁻¹ with n = 4.',
        },
        {
          id: 'f5-3-2',
          type: 'mcq',
          prompt: 'What is the derivative of 5x² + 7?',
          options: [
            { text: '10x' },
            { text: '10x + 7', why: 'A constant does not change, so its derivative is 0.' },
            { text: '5x', why: 'The 2 comes down and multiplies the 5: 10x.' },
          ],
          answer: 0,
          explain: '5 × 2x, plus 0 for the constant.',
        },
        {
          id: 'f5-3-3',
          type: 'predict-output',
          prompt: 'Check 3x² + 2x at x = 1. What does this print?',
          code: `def nudge(f, x, h=1e-6):
    return (f(x + h) - f(x)) / h

f = lambda x: 3 * x ** 2 + 2 * x
print(round(nudge(f, 1), 3))`,
          answer: '8.0',
          options: [
            { text: '8.0' },
            { text: '5.0', why: 'That is f(1), the height. The derivative is 6x + 2.' },
            { text: '6.0', why: 'The 2x term adds 2 to the slope: 6 + 2.' },
          ],
          explain: '6x + 2 at x = 1.',
        },
        {
          id: 'f5-3-4',
          type: 'fill-blank',
          prompt: 'The power rule as code.',
          code: `def d_power(n, x):
    return n * x ** (n ___ 1)

print(d_power(3, 2))`,
          answer: ['-'],
          distractors: [
            { text: '+', why: 'The power goes down by one, not up: 3 × 2⁴ would be 48.' },
            { text: '*', why: 'The power becomes n − 1, not n × 1.' },
          ],
          expectOutput: '12',
          explain: '3 × 2² = 12.',
        },
        {
          id: 'f5-3-5',
          type: 'match-pairs',
          prompt: 'Match each function to its derivative.',
          pairs: [
            { left: 'x²', right: '2x', why: 'Power rule with n = 2.' },
            { left: 'x³', right: '3x²', why: 'Power rule with n = 3.' },
            { left: '7x', right: '7', why: 'A straight line has a constant slope.' },
            { left: '4', right: '0', why: 'A constant never changes.' },
          ],
          explain: 'Four rules cover most of what you will meet.',
        },
        {
          id: 'f5-3-6',
          type: 'mcq',
          prompt: 'A loss is a + b, where da/dw = 2 and db/dw = −5. What is the derivative of the loss with respect to w?',
          options: [
            { text: '−3' },
            { text: '−10', why: 'For a sum, the derivatives add; they do not multiply.' },
            { text: '7', why: 'Keep the sign: 2 + (−5).' },
          ],
          answer: 0,
          explain: 'Sums add their rates.',
        },
        {
          id: 'f5-3-7',
          type: 'predict-output',
          prompt: 'A straight line, checked far out. What does this print?',
          code: `def nudge(f, x, h=1e-6):
    return (f(x + h) - f(x)) / h

print(round(nudge(lambda x: 7 * x,
                  100), 3))`,
          answer: '7.0',
          options: [
            { text: '7.0' },
            { text: '700.0', why: 'That is the height at 100; the slope of 7x is 7 everywhere.' },
          ],
          explain: 'A line\'s slope is the same at every point.',
        },
        {
          id: 'f5-3-8',
          type: 'run-code',
          prompt: 'Set `df` to a function returning the derivative of x³ − 2x.',
          solution: 'df = lambda x: 3 * x ** 2 - 2',
          tests: [
            'assert df(0) == -2, f"at 0 the slope is -2; got {df(0)}"',
            'assert df(2) == 10, f"at 2 the slope is 3·4 − 2 = 10; got {df(2)}"',
          ].join('\n'),
          placeholder: 'df = lambda x: ...',
          explain: 'Power rule on x³, and 2x has slope 2.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'f5-04',
      title: 'Which way is down',
      summary: 'A positive derivative means smaller x goes downhill; a negative one, larger x. At the bottom it is 0.',
      card: {
        title: 'Which way is down',
        text: 'The derivative\'s sign says which way is downhill: positive means the function rises to the right, so smaller x goes down; negative means larger x goes down. At the bottom of a valley the derivative is 0. Training a model searches for where the loss\'s derivative is 0.',
        code: `def df(x):
    return 2 * (x - 3)  # f = (x - 3)²

for x in [1, 3, 5]:
    print(x, df(x))`,
        output: '1 -4\n3 0\n5 4',
      },
      exercises: [
        {
          id: 'f5-4-1',
          type: 'mcq',
          prompt: 'The derivative of the loss at the current weight is −2.5. To lower the loss, which way should the weight move?',
          options: [
            { text: 'Up' },
            { text: 'Down', why: 'A negative slope means the loss falls as the weight rises.' },
          ],
          answer: 0,
          explain: 'Move against the sign of the derivative.',
        },
        {
          id: 'f5-4-2',
          type: 'mcq',
          prompt: 'f(x) = x² − 6x has derivative 2x − 6. Where is its minimum?',
          options: [
            { text: 'x = 3' },
            { text: 'x = 6', why: 'At 6 the derivative is 6, not 0.' },
            { text: 'x = 0', why: 'At 0 the derivative is −6: still going down to the right.' },
          ],
          answer: 0,
          explain: '2x − 6 = 0 at x = 3.',
        },
        {
          id: 'f5-4-3',
          type: 'predict-output',
          prompt: 'Which way is downhill from x = 5? What does this print?',
          code: `def df(x):
    return 2 * x - 4

d = df(5)
step = "left" if d > 0 else "right"
print(step)`,
          answer: 'left',
          options: [
            { text: 'left' },
            { text: 'right', why: 'The derivative at 5 is 6, positive: the function rises to the right.' },
          ],
          explain: 'Positive slope: go to smaller x.',
        },
        {
          id: 'f5-4-4',
          type: 'fill-blank',
          prompt: 'Find where the derivative is zero.',
          code: `def df(x):
    return 2 * (x - 7)

xs = [x for x in range(10)
      if df(x) ___ 0]
print(xs)`,
          answer: ['=='],
          distractors: [
            { text: '>', why: 'That lists where the function is rising: 8 and 9.' },
            { text: '<', why: 'That lists where the function is falling: 0 to 6.' },
          ],
          expectOutput: '[7]',
          explain: 'The bottom of (x − 7)² is at 7.',
        },
        {
          id: 'f5-4-5',
          type: 'predict-output',
          prompt: 'At the bottom. What does this print?',
          code: `f = lambda x: (x - 1) ** 2 + 2
df = lambda x: 2 * (x - 1)
print(f(1), df(1))`,
          answer: '2 0',
          options: [
            { text: '2 0' },
            { text: '0 0', why: 'The lowest height is 2, because of the + 2; the slope there is 0.' },
            { text: '2 2', why: 'At the bottom the slope is 0.' },
          ],
          explain: 'The minimum value is 2, at x = 1, where the slope is flat.',
        },
        {
          id: 'f5-4-6',
          type: 'mcq',
          prompt: 'The derivative is 0 at some point. Is that point always a minimum?',
          options: [
            { text: 'No: it can be a peak or a flat spot' },
            { text: 'Yes: zero slope is always a minimum', why: 'The top of a hill is flat too, and so is the middle of x³ at 0.' },
          ],
          answer: 0,
          explain: 'Zero slope means flat; whether it is a bottom depends on the sides.',
        },
        {
          id: 'f5-4-7',
          type: 'predict-output',
          prompt: 'From x = 6, does a small step left lower f? What does this print?',
          code: `f = lambda x: (x - 4) ** 2
x = 6
print(f(x - 0.1) < f(x))`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'The bottom is at 4, to the left of 6, so stepping left goes down.' },
          ],
          explain: 'The derivative at 6 is +4: downhill is to the left.',
        },
        {
          id: 'f5-4-8',
          type: 'run-code',
          prompt: 'Set `x_min` to the value in `xs` where `abs(df(x))` is smallest. `np.argmin` is `argmax` for the smallest value.',
          before: `xs = np.linspace(-5, 5, 101)
def df(x):
    return 2 * (x + 2)`,
          solution: 'x_min = xs[np.argmin(np.abs(df(xs)))]',
          tests: 'assert abs(x_min + 2) < 1e-9, f"the slope of (x + 2)² is 0 at -2; got {x_min}"',
          placeholder: 'x_min = ...',
          explain: 'Searching a grid for a zero slope works in one dimension; with many weights you need gradient descent.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'f5-05',
      title: 'Walking downhill',
      summary: 'Gradient descent repeats x ← x − lr × slope; too large a learning rate overshoots.',
      card: {
        title: 'Walking downhill',
        text: 'Gradient descent finds the bottom by walking: repeat x ← x − lr × slope, where the learning rate lr sets the size of each step. Steps shrink near the bottom because the slope does. Too large a rate overshoots the valley and can bounce further out each time.',
        figure: { kind: 'descent', a: 1, m: 2, start: 6, lr: 0.1, editableLr: true },
      },
      exercises: [
        {
          id: 'f5-5-1',
          type: 'figure',
          prompt: 'Pick a learning rate, then step. Reach the bottom in at most 3 steps.',
          figure: { kind: 'descent', a: 1, m: 2, start: 6, lr: 0.1, editableLr: true, goal: { within: 0.1, maxSteps: 3 } },
          explain: 'For this curve, a rate near 0.5 jumps almost straight to the bottom.',
        },
        {
          id: 'f5-5-2',
          type: 'figure',
          prompt: 'This rate is too large. Step a couple of times and watch, then reset, choose a better rate, and reach the bottom in 6 steps.',
          figure: { kind: 'descent', a: 1, m: 0, start: 3, lr: 1.1, editableLr: true, goal: { within: 0.1, maxSteps: 6 } },
          explain: 'Each step overshot by more than it corrected, so the ball flew outwards.',
        },
        {
          id: 'f5-5-3',
          type: 'predict-output',
          prompt: 'One step by hand. Type what this prints.',
          code: `def df(x):
    return 2 * (x - 2)

x = 6.0
x = x - 0.25 * df(x)
print(x)`,
          answer: '4.0',
          typedWrong: [{ answer: '8.0', why: 'The step subtracts: 6 − 0.25 × 8.' }],
          explain: 'The slope at 6 is 8; a quarter of it is 2.',
        },
        {
          id: 'f5-5-4',
          type: 'predict-output',
          prompt: 'Three small steps. What does this print?',
          code: `def df(x):
    return 2 * (x - 2)

x = 6.0
for _ in range(3):
    x = x - 0.1 * df(x)
print(round(x, 3))`,
          answer: '4.048',
          options: [
            { text: '4.048' },
            { text: '2.0', why: 'With a rate of 0.1 each step closes only a fifth of the gap.' },
            { text: '3.6', why: 'The steps shrink as the slope shrinks: 6, 5.2, 4.56, 4.048.' },
          ],
          explain: 'Steady progress, slowing as it nears the bottom.',
        },
        {
          id: 'f5-5-5',
          type: 'predict-output',
          prompt: 'A rate of 1.5. What does this print?',
          code: `def df(x):
    return 2 * (x - 2)

xs = [6.0]
for _ in range(2):
    x = xs[-1]
    xs.append(x - 1.5 * df(x))
print(xs)`,
          answer: '[6.0, -6.0, 18.0]',
          options: [
            { text: '[6.0, -6.0, 18.0]' },
            { text: '[6.0, 4.0, 3.0]', why: 'That is a rate of 0.25. At 1.5, the first step jumps 12 to the left.' },
          ],
          explain: 'Each jump overshoots the bottom (2) by more than before: divergence.',
        },
        {
          id: 'f5-5-6',
          type: 'fill-blank',
          prompt: 'Step downhill 50 times.',
          code: `def df(x):
    return 2 * (x - 2)

x = 6.0
for _ in range(50):
    x = x ___ 0.1 * df(x)
print(round(x, 3))`,
          answer: ['-'],
          distractors: [{ text: '+', why: 'Adding the slope walks uphill, away from the bottom.' }],
          expectOutput: '2.0',
          explain: 'Against the slope, every time.',
        },
        {
          id: 'f5-5-7',
          type: 'mcq',
          prompt: 'The loss goes down, but only a tiny bit each step. What do you try?',
          options: [
            { text: 'Raise the learning rate a little' },
            { text: 'Lower the learning rate a lot', why: 'Smaller steps would be slower still.' },
            { text: 'Step uphill instead of down', why: 'That raises the loss.' },
          ],
          answer: 0,
          explain: 'Raise it in small amounts and watch for overshooting.',
        },
        {
          id: 'f5-5-8',
          type: 'run-code',
          prompt: 'Take 100 steps of gradient descent on `x` with rate `lr`.',
          before: `def df(x):
    return 2 * (x - 2)

x, lr = 10.0, 0.1`,
          solution: 'for _ in range(100):\n    x = x - lr * df(x)',
          tests: 'assert abs(x - 2) < 1e-6, f"100 steps should reach the bottom at 2; got {x}"',
          maxLines: 2,
          placeholder: 'for _ in range(100):',
          explain: 'The whole of gradient descent, in two lines.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'f5-06',
      title: 'Partial derivatives',
      summary: 'With several inputs, nudge one and hold the others still: that is a partial derivative.',
      card: {
        title: 'Partial derivatives',
        text: 'With two inputs, f(x, y), nudge one input at a time and hold the other still. The result is a partial derivative: ∂f/∂x says how f moves when only x moves. For f = x² + 3y, ∂f/∂x is 2x and ∂f/∂y is 3.',
        code: `def f(x, y):
    return x ** 2 + 3 * y

h = 1e-6
dx = (f(2 + h, 5) - f(2, 5)) / h
dy = (f(2, 5 + h) - f(2, 5)) / h
print(round(dx, 3), round(dy, 3))`,
        output: '4.0 3.0',
      },
      exercises: [
        {
          id: 'f5-6-1',
          type: 'mcq',
          prompt: 'f(x, y) = x · y. What is ∂f/∂x?',
          options: [
            { text: 'y' },
            { text: 'x', why: 'Holding y still, f is y times x: its slope in x is y.' },
            { text: 'x · y', why: 'That is f itself.' },
          ],
          answer: 0,
          explain: 'Treat y as a fixed number.',
        },
        {
          id: 'f5-6-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `def f(x, y):
    return x * y

h = 1e-6
dx = (f(2 + h, 7) - f(2, 7)) / h
dy = (f(2, 7 + h) - f(2, 7)) / h
print(round(dx, 3), round(dy, 3))`,
          answer: '7.0 2.0',
          options: [
            { text: '7.0 2.0' },
            { text: '2.0 7.0', why: '∂(xy)/∂x is y, which is 7 here.' },
            { text: '14.0 14.0', why: '14 is f(2, 7); the partials are y and x.' },
          ],
          explain: 'Each partial is the other input.',
        },
        {
          id: 'f5-6-3',
          type: 'mcq',
          prompt: 'The loss depends on weights w1 and w2, with ∂L/∂w1 = 0.5 and ∂L/∂w2 = −2. Which weight\'s small change moves the loss more right now?',
          options: [
            { text: 'w2: its partial is larger in size' },
            { text: 'w1: its partial is positive', why: 'The sign says the direction; the size says how much.' },
            { text: 'Both move it equally', why: '2 is four times 0.5.' },
          ],
          answer: 0,
          explain: 'A nudge to w2 moves the loss four times as much (in the other direction).',
        },
        {
          id: 'f5-6-4',
          type: 'fill-blank',
          prompt: 'Nudge only y.',
          code: `def f(x, y):
    return x ** 2 + 3 * y

x, y, h = 2.0, 5.0, 1e-6
dy = (f(x, y ___ h) - f(x, y)) / h
print(round(dy, 3))`,
          answer: ['+'],
          distractors: [
            { text: '-', why: 'Nudging y down but dividing by +h flips the sign: −3.' },
            { text: '*', why: 'y × h is almost 0, not a nudge of y.' },
          ],
          expectOutput: '3.0',
          explain: 'Only y moves; x stays at 2.',
        },
        {
          id: 'f5-6-5',
          type: 'predict-output',
          prompt: 'f = x² · y at (3, 2). What does this print?',
          code: `def f(x, y):
    return x ** 2 * y

h = 1e-6
dx = (f(3 + h, 2) - f(3, 2)) / h
print(round(dx, 2))`,
          answer: '12.0',
          options: [
            { text: '12.0' },
            { text: '9.0', why: 'That is ∂f/∂y = x². ∂f/∂x is 2xy = 12.' },
            { text: '18.0', why: '18 is f(3, 2), the value, not the slope.' },
          ],
          explain: 'y is held at 2: f = 2x², slope 4x = 12.',
        },
        {
          id: 'f5-6-6',
          type: 'match-pairs',
          prompt: 'Match each partial derivative to its value.',
          pairs: [
            { left: '∂(5x + 2y²)/∂x', right: '5', why: 'y is held still, so only 5x changes.' },
            { left: '∂(5x + 2y²)/∂y', right: '4y', why: 'x is held still; 2y² has slope 4y.' },
            { left: '∂(xy)/∂y', right: 'x', why: 'Holding x, xy is x times y.' },
            { left: '∂(x² + y²)/∂x', right: '2x', why: 'y² is a constant when only x moves.' },
          ],
          explain: 'Everything except the nudged input is a constant.',
        },
        {
          id: 'f5-6-7',
          type: 'spot-bug',
          prompt: 'This should be ∂f/∂x, which is 4 here. Which line is wrong?',
          code: `def f(x, y):
    return x ** 2 + 3 * y
h = 1e-6
dx = (f(2 + h, 5 + h) - f(2, 5)) / h
assert abs(dx - 4) < 1e-3, dx`,
          error: 'AssertionError: 7.0...',
          answer: 3,
          raiseLine: 4,
          lineWhy: {
            '0': 'The function is fine.',
            '1': 'x² + 3y, as intended.',
            '2': 'A tiny nudge is right.',
            '4': 'The check is right: ∂f/∂x = 2x = 4.',
          },
          explain: 'Both inputs were nudged, so it measured 4 + 3. Hold y at 5.',
        },
        {
          id: 'f5-6-8',
          type: 'run-code',
          prompt: 'Set `dy` to the nudge estimate of ∂f/∂y at (x, y).',
          before: `def f(x, y):
    return x * y + y ** 2

x, y, h = 1.0, 2.0, 1e-6`,
          solution: 'dy = (f(x, y + h) - f(x, y)) / h',
          tests: 'assert abs(dy - 5) < 1e-3, f"∂f/∂y = x + 2y = 5; got {dy}"',
          placeholder: 'dy = ...',
          explain: 'Move y, keep x.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'f5-07',
      title: 'The gradient',
      summary: 'The gradient is the vector of all partial derivatives; it points uphill, so step against it.',
      card: {
        title: 'The gradient',
        text: 'The gradient collects all the partial derivatives into one vector, such as [∂f/∂x, ∂f/∂y]. It points the way f rises fastest, so stepping against it, p − lr × gradient, goes downhill. A model with a million weights has a gradient with a million entries, and every training step moves against it.',
        code: `def grad(p):  # f = x² + 3y²
    x, y = p
    return np.array([2 * x, 6 * y])

p = np.array([3.0, 1.0])
p = p - 0.1 * grad(p)
print(p)`,
        output: '[2.4 0.4]',
      },
      exercises: [
        {
          id: 'f5-7-1',
          type: 'predict-output',
          prompt: 'The gradient of x² + y² at (1, −2). What does this print?',
          code: `x, y = 1, -2
print(np.array([2 * x, 2 * y]))`,
          answer: '[ 2 -4]',
          options: [
            { text: '[ 2 -4]' },
            { text: '[ 1 -2]', why: 'The partials are 2x and 2y, not x and y.' },
            { text: '[1 4]', why: '[1, 4] are the squares; the partials are 2x and 2y.' },
          ],
          explain: 'One partial per input, in a vector.',
        },
        {
          id: 'f5-7-2',
          type: 'mcq',
          prompt: 'The gradient of the loss at the current weights is [3, −1]. Which step lowers the loss?',
          options: [
            { text: 'Subtract a small multiple of [3, −1]' },
            { text: 'Add a small multiple of [3, −1]', why: 'The gradient points uphill; adding it raises the loss.' },
            { text: 'Set the weights to [3, −1]', why: 'The gradient is a direction, not a destination.' },
          ],
          answer: 0,
          explain: 'w ← w − lr × gradient: the first weight goes down, the second up.',
        },
        {
          id: 'f5-7-3',
          type: 'predict-output',
          prompt: 'One step on x² + y². What does this print?',
          code: `p = np.array([2.0, 4.0])
g = 2 * p
print(p - 0.5 * g)`,
          answer: '[0. 0.]',
          options: [
            { text: '[0. 0.]' },
            { text: '[1. 2.]', why: 'The gradient is 2p = [4, 8]; half of it is [2, 4], the whole way to 0.' },
            { text: '[4. 8.]', why: 'That is p + 0.5 × g: a step uphill.' },
          ],
          explain: 'For this bowl a rate of 0.5 lands exactly on the bottom.',
        },
        {
          id: 'f5-7-4',
          type: 'mcq',
          prompt: 'A layer\'s weights have shape (3, 4). What shape is the gradient of the loss with respect to them?',
          options: [
            { text: '(3, 4)' },
            { text: '(4, 3)', why: 'One partial per weight, in the same place as its weight.' },
            { text: '(1,)', why: 'There is one partial for every one of the 12 weights.' },
          ],
          answer: 0,
          explain: 'The gradient always has the shape of the thing it is taken with respect to.',
        },
        {
          id: 'f5-7-5',
          type: 'fill-blank',
          prompt: 'Step against the gradient 100 times.',
          code: `def grad(p):
    return 2 * p   # f = x² + y²

p = np.array([3.0, 1.0])
for _ in range(100):
    p = p ___ 0.1 * grad(p)
print(np.round(p, 3))`,
          answer: ['-'],
          distractors: [{ text: '+', why: 'Adding the gradient climbs: the numbers explode.' }],
          expectOutput: '[0. 0.]',
          explain: 'The bottom of the bowl is at (0, 0).',
        },
        {
          id: 'f5-7-6',
          type: 'predict-output',
          prompt: 'A gradient by nudging each input. What does this print?',
          code: `def f(p):
    return p[0] ** 2 + 3 * p[1]

def num_grad(f, p, h=1e-6):
    g = np.zeros_like(p)
    for i in range(len(p)):
        q = p.copy()
        q[i] += h
        g[i] = (f(q) - f(p)) / h
    return g

p = np.array([2.0, 1.0])
print(np.round(num_grad(f, p), 3))`,
          answer: '[4. 3.]',
          options: [
            { text: '[4. 3.]' },
            { text: '[7. 7.]', why: 'Each input is nudged on its own (q is a fresh copy), so the partials stay separate.' },
            { text: '[2. 3.]', why: '∂(x²)/∂x is 2x = 4 at x = 2.' },
          ],
          explain: 'This is how gradient code is checked: compare it with nudging.',
        },
        {
          id: 'f5-7-7',
          type: 'mcq',
          prompt: 'Why step against the gradient rather than along it?',
          options: [
            { text: 'It points the way f rises fastest' },
            { text: 'It is always a negative number', why: 'Its entries can have either sign.' },
            { text: 'Steps along it are too small', why: 'Size is set by the rate; the gradient\'s direction is uphill.' },
          ],
          answer: 0,
          explain: 'The opposite direction is the steepest way down.',
        },
        {
          id: 'f5-7-8',
          type: 'run-code',
          prompt: 'Set `p` to the result of 200 steps of `p - 0.1 * grad(p)`.',
          before: `def grad(p):  # (x-1)² + (y+2)²
    return 2 * (p - np.array([1, -2]))

p = np.array([5.0, 5.0])`,
          solution: 'for _ in range(200):\n    p = p - 0.1 * grad(p)',
          tests: 'assert np.allclose(p, [1, -2]), f"the bowl\'s bottom is at (1, -2); got {p}"',
          maxLines: 2,
          placeholder: 'for _ in range(200):',
          explain: 'Two weights now, but the same two lines as in one dimension.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'f5-08',
      title: 'The chain rule',
      summary: 'When one quantity feeds another, the rates multiply: dy/dx = dy/du × du/dx.',
      card: {
        title: 'The chain rule',
        text: 'When one thing feeds another, rates multiply. If u = 3x and y = u², nudging x moves u three times as much, and each bit of u moves y by 2u, so dy/dx = 2u × 3. Backpropagation (unit F8) is this rule applied layer by layer.',
        code: `x = 2.0
u = 3 * x      # du/dx = 3
y = u ** 2     # dy/du = 2u
print(2 * u * 3)`,
        output: '36.0',
      },
      exercises: [
        {
          id: 'f5-8-1',
          type: 'predict-output',
          prompt: 'u = 2x + 1 and y = u². Type dy/dx at x = 1.',
          code: `x = 1.0
u = 2 * x + 1   # du/dx = 2
y = u ** 2      # dy/du = 2u
print(2 * u * 2)`,
          answer: '12.0',
          typedWrong: [{ answer: '6.0', why: 'That is dy/du alone; multiply by du/dx = 2.' }],
          explain: 'u = 3, so dy/du = 6, times 2.',
        },
        {
          id: 'f5-8-2',
          type: 'mcq',
          prompt: 'It gets 2 °C colder per km you climb, and you climb 0.5 km per hour. How fast does it get colder per hour?',
          options: [
            { text: '1 °C per hour' },
            { text: '4 °C per hour', why: 'That divides 2 by 0.5; the rates multiply.' },
            { text: '2.5 °C per hour', why: 'Rates in a chain multiply, they do not add.' },
          ],
          answer: 0,
          explain: '2 °C per km × 0.5 km per hour.',
        },
        {
          id: 'f5-8-3',
          type: 'predict-output',
          prompt: 'Check the card\'s answer by nudging. What does this print?',
          code: `def y(x):
    return (3 * x) ** 2

h = 1e-6
print(round((y(2 + h) - y(2)) / h, 2))`,
          answer: '36.0',
          options: [
            { text: '36.0' },
            { text: '12.0', why: 'That is 2u alone; the inner 3x adds a factor of 3.' },
            { text: '6.0', why: '6 is u, not a rate.' },
          ],
          explain: 'The nudge agrees with 2u × 3.',
        },
        {
          id: 'f5-8-4',
          type: 'fill-blank',
          prompt: 'Combine the two rates.',
          code: `dy_du = 4.0
du_dx = 5.0
dy_dx = dy_du ___ du_dx
print(dy_dx)`,
          answer: ['*'],
          distractors: [
            { text: '+', why: 'Adding gives 9; rates in a chain multiply.' },
            { text: '/', why: 'Dividing gives 0.8; rates in a chain multiply.' },
          ],
          expectOutput: '20.0',
          explain: 'A nudge in x is scaled by 5, then by 4.',
        },
        {
          id: 'f5-8-5',
          type: 'mcq',
          prompt: 'dz/dy = 2, dy/dx = 3 and dx/dw = 0.5. What is dz/dw?',
          options: [
            { text: '3' },
            { text: '5.5', why: 'The links multiply: 2 × 3 × 0.5.' },
            { text: '6', why: 'Include the last link, 0.5.' },
          ],
          answer: 0,
          explain: 'A longer chain just multiplies more links.',
        },
        {
          id: 'f5-8-6',
          type: 'predict-output',
          prompt: 'The smallest possible network: a = w·x, loss = (a − t)². What does this print?',
          code: `x, t, w = 2.0, 1.0, 1.0
a = w * x
dL_da = 2 * (a - t)
da_dw = x
print(dL_da * da_dw)`,
          answer: '4.0',
          options: [
            { text: '4.0' },
            { text: '2.0', why: 'That is dL/da only; multiply by da/dw = x = 2.' },
            { text: '1.0', why: 'The loss is (2 − 1)² = 1; its slope in w is 4.' },
          ],
          explain: 'The gradient for this weight: backprop in miniature.',
        },
        {
          id: 'f5-8-7',
          type: 'spot-bug',
          prompt: 'dy/dx should be 36. Which line is wrong?',
          code: `x = 2.0
u = 3 * x
dy_du = 2 * u
du_dx = 3
dy_dx = dy_du + du_dx
assert dy_dx == 36, dy_dx`,
          error: 'AssertionError: 15.0',
          answer: 4,
          raiseLine: 5,
          lineWhy: {
            '0': 'The input is fine.',
            '1': 'u = 3x, as in the card.',
            '2': 'dy/du = 2u is right.',
            '3': 'du/dx = 3 is right.',
            '5': 'The check is right.',
          },
          explain: 'Chained rates multiply: `dy_du * du_dx`.',
        },
        {
          id: 'f5-8-8',
          type: 'run-code',
          prompt: 'u = x² and y = 4u. Set `dy_dx` with the chain rule: dy/du = 4 and du/dx = 2x.',
          before: `x = 1.5
u = x ** 2
y = 4 * u`,
          solution: 'dy_dx = 4 * 2 * x',
          tests: 'assert abs(dy_dx - 12) < 1e-9, f"4 × 2 × 1.5 = 12; got {dy_dx}"',
          placeholder: 'dy_dx = ...',
          explain: 'Multiply the links.',
        },
      ],
    },

    // ------------------------------------------------------------------ 9
    {
      id: 'f5-09',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can measure slopes, take derivatives, walk downhill and chain rates together.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each one, ask: what is being nudged, and what moves as a result?',
      },
      exercises: [
        {
          id: 'f5-9-1',
          type: 'predict-output',
          prompt: 'From (2, 1) to (6, 9). Type the slope.',
          code: 'print((9 - 1) / (6 - 2))',
          answer: '2.0',
          explain: 'A rise of 8 over a run of 4.',
        },
        {
          id: 'f5-9-2',
          type: 'mcq',
          prompt: 'What is the derivative of 3x² + x?',
          options: [
            { text: '6x + 1' },
            { text: '6x', why: 'The x term has slope 1.' },
            { text: '3x + 1', why: 'The power comes down: 3 × 2x = 6x.' },
          ],
          answer: 0,
          explain: 'Power rule, plus the sum rule.',
        },
        {
          id: 'f5-9-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `f = lambda x: x ** 2 + x
h = 1e-6
print(round((f(2 + h) - f(2)) / h, 3))`,
          answer: '5.0',
          options: [
            { text: '5.0' },
            { text: '6.0', why: '6 is f(2), the height. The slope 2x + 1 is 5.' },
            { text: '4.0', why: 'Include the slope of the x term: 4 + 1.' },
          ],
          explain: '2x + 1 at x = 2.',
        },
        {
          id: 'f5-9-4',
          type: 'figure',
          prompt: 'A shallower curve. Choose a rate and reach the bottom in at most 4 steps.',
          figure: { kind: 'descent', a: 0.5, m: -1, start: 4, lr: 0.1, editableLr: true, goal: { within: 0.2, maxSteps: 4 } },
          explain: 'A flatter curve has smaller slopes, so it needs a larger rate for the same progress.',
        },
        {
          id: 'f5-9-5',
          type: 'predict-output',
          prompt: 'One step on x² + y² with rate 0.25. What does this print?',
          code: `p = np.array([1.0, 2.0])
g = 2 * p
print(p - 0.25 * g)`,
          answer: '[0.5 1. ]',
          options: [
            { text: '[0.5 1. ]' },
            { text: '[1.5 3. ]', why: 'That steps along the gradient, uphill.' },
            { text: '[0. 0.]', why: 'A rate of 0.25 goes half way; 0.5 would land on the bottom.' },
          ],
          explain: 'Half way to the bottom.',
        },
        {
          id: 'f5-9-6',
          type: 'mcq',
          prompt: 'f(x, y) = x² · y. What is ∂f/∂y at (1, 3)?',
          options: [
            { text: '1' },
            { text: '6', why: 'That is ∂f/∂x = 2xy. Holding x still, f is x² times y: slope x² = 1.' },
            { text: '3', why: '3 is f(1, 3), the value.' },
          ],
          answer: 0,
          explain: 'x is held at 1, so f = y: slope 1.',
        },
        {
          id: 'f5-9-7',
          type: 'fill-blank',
          prompt: 'The gradient for w in a = w·x, loss = (a − t)².',
          code: `x, t, w = 3.0, 1.0, 1.0
a = w * x
dL_da = 2 * (a - t)
dL_dw = dL_da ___ x
print(dL_dw)`,
          answer: ['*'],
          distractors: [
            { text: '+', why: 'The chain multiplies: dL/da times da/dw.' },
            { text: '-', why: 'Rates in a chain multiply.' },
          ],
          expectOutput: '12.0',
          explain: 'dL/da = 4, da/dw = x = 3.',
        },
        {
          id: 'f5-9-8',
          type: 'spot-bug',
          prompt: 'x should shrink towards 0, the bottom of x². Which line is wrong?',
          code: `def df(x):
    return 2 * x
x = 1.0
for _ in range(3):
    x = x + 0.1 * df(x)
assert abs(x) < 1, x`,
          error: 'AssertionError: 1.72...',
          answer: 4,
          raiseLine: 5,
          lineWhy: {
            '0': 'The derivative function is fine.',
            '1': 'The slope of x² is 2x.',
            '2': 'Starting at 1 is fine.',
            '3': 'Three steps is fine.',
            '5': 'The check is right: x should get closer to 0.',
          },
          explain: 'It steps uphill. Use `x - 0.1 * df(x)`.',
        },
        {
          id: 'f5-9-9',
          type: 'mcq',
          prompt: 'The loss gets larger every step, and faster each time. What do you change?',
          options: [
            { text: 'Lower the learning rate' },
            { text: 'Raise the learning rate', why: 'Bigger steps overshoot even more.' },
            { text: 'Take more steps', why: 'More steps of a diverging run go further out.' },
          ],
          answer: 0,
          explain: 'Growing loss is the sign of overshooting.',
        },
        {
          id: 'f5-9-10',
          type: 'run-code',
          prompt: 'Set `g` to the gradient [∂f/∂x, ∂f/∂y] at `p`, using `part(i)`, which nudges input i.',
          before: `def f(p):
    return p[0] ** 2 + 3 * p[1] ** 2

p, h = np.array([1.0, 1.0]), 1e-6
def part(i):
    q = p.copy()
    q[i] += h
    return (f(q) - f(p)) / h`,
          solution: 'g = np.array([part(0), part(1)])',
          tests: 'assert np.allclose(g, [2, 6], atol=1e-3), f"2x = 2 and 6y = 6; got {g}"',
          placeholder: 'g = ...',
          explain: 'One nudge per input, collected into a vector.',
        },
      ],
    },
  ],
  labs: f5Labs,
  library: f5Library,
};
