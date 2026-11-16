import { f6Labs } from '../labs/f6';
import { f6Library } from '../library/f6';
import type { Unit } from '../schema';

/*
 * F6 Probability and loss. Mean and spread, distributions and expected
 * value, logarithms, log-likelihood, softmax, temperature, cross-entropy
 * and why it is the classification loss. Every numeric answer is executed.
 */
export const f6: Unit = {
  id: 'F6',
  track: 'foundations',
  title: 'Probability and loss',
  blurb: 'Mean and variance, distributions, logarithms, softmax and temperature, and cross-entropy: the loss every classifier and language model is trained on.',
  prelude: 'import numpy as np',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'f6-01',
      title: 'Mean and spread',
      summary: 'The mean is the balance point; the variance is the mean squared distance from it, and its square root is the standard deviation.',
      card: {
        title: 'Mean and spread',
        text: 'The mean is the balance point of some numbers: their sum divided by how many there are. The variance measures spread as the mean of the squared distances from the mean, and its square root, the standard deviation, is back in the original units. Two sets can share a mean and differ wildly in spread.',
        code: `a = np.array([4.0, 6.0])
b = np.array([0.0, 10.0])
print(a.mean(), b.mean())
print(a.var(), b.var())`,
        output: '5.0 5.0\n1.0 25.0',
      },
      exercises: [
        {
          id: 'f6-1-1',
          type: 'predict-output',
          prompt: 'Type the mean.',
          code: 'print(np.array([2, 4, 9]).mean())',
          answer: '5.0',
          explain: '15 / 3.',
        },
        {
          id: 'f6-1-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `x = np.array([2, 4, 4, 4,
              5, 5, 7, 9])
print(x.std())`,
          answer: '2.0',
          options: [
            { text: '2.0' },
            { text: '4.0', why: 'That is the variance; the standard deviation is its square root.' },
            { text: '5.0', why: '5 is the mean, the centre, not the spread.' },
          ],
          explain: 'Variance 4, so the standard deviation is 2.',
        },
        {
          id: 'f6-1-3',
          type: 'fill-blank',
          prompt: 'The variance by hand.',
          code: `x = np.array([1.0, 3.0, 5.0])
d = x - x.mean()
print(round((d ___ 2).mean(), 3))`,
          answer: ['**'],
          distractors: [
            { text: '*', why: 'Doubling the distances keeps their signs, so they average to 0.' },
            { text: '+', why: 'Adding 2 to each distance is not squaring.' },
          ],
          expectOutput: '2.667',
          explain: 'Distances −2, 0, 2; squares 4, 0, 4; mean 8 / 3.',
        },
        {
          id: 'f6-1-4',
          type: 'mcq',
          prompt: 'Model A\'s errors are [5, 5, 5]; model B\'s are [0, 0, 15]. Both average 5. Which has the larger variance?',
          options: [
            { text: 'Model B' },
            { text: 'Model A', why: 'A\'s errors never move from 5: variance 0.' },
            { text: 'They are the same', why: 'Same mean, very different spread.' },
          ],
          answer: 0,
          explain: 'B is usually perfect and sometimes very wrong; the mean hides that.',
          check: 'assert np.var([0, 0, 15]) > np.var([5, 5, 5]) == 0',
        },
        {
          id: 'f6-1-5',
          type: 'mcq',
          prompt: 'Heights in cm have a variance of 49. What is the standard deviation?',
          options: [
            { text: '7 cm' },
            { text: '49 cm', why: 'Variance is in cm²; take the square root to get back to cm.' },
            { text: '7 cm²', why: 'The square root brings it back to cm.' },
          ],
          answer: 0,
          explain: 'That is why the standard deviation is the one people quote.',
        },
        {
          id: 'f6-1-6',
          type: 'predict-output',
          prompt: 'One extreme value. The median is the middle value. What does this print?',
          code: `x = np.array([1, 2, 3, 100])
print(x.mean(), np.median(x))`,
          answer: '26.5 2.5',
          options: [
            { text: '26.5 2.5' },
            { text: '2.5 2.5', why: 'The 100 drags the mean up: 106 / 4.' },
            { text: '26.5 26.5', why: 'The median ignores how far out the 100 is.' },
          ],
          explain: 'The mean is pulled by outliers; check the spread before trusting it.',
        },
        {
          id: 'f6-1-7',
          type: 'spot-bug',
          prompt: 'The standard deviation is wrong. Which line?',
          code: `x = np.array([2.0, 4.0, 6.0])
var = ((x - x.mean()) ** 2).mean()
sd = var
assert abs(sd - 1.633) < 0.01, sd`,
          error: 'AssertionError: 2.66...',
          answer: 2,
          raiseLine: 3,
          lineWhy: {
            '0': 'The data is fine.',
            '1': 'That is the variance, correctly.',
            '3': 'The check is right: the standard deviation is about 1.633.',
          },
          explain: 'Take the square root: `sd = var ** 0.5`.',
        },
        {
          id: 'f6-1-8',
          type: 'run-code',
          prompt: 'Set `z` to `x` standardised: minus its mean, divided by its standard deviation.',
          before: 'x = np.array([10.0, 20.0, 30.0, 40.0])',
          solution: 'z = (x - x.mean()) / x.std()',
          tests: [
            'assert abs(z.mean()) < 1e-9, f"standardised data has mean 0; got {z.mean()}"',
            'assert abs(z.std() - 1) < 1e-9, f"and standard deviation 1; got {z.std()}"',
          ].join('\n'),
          placeholder: 'z = ...',
          explain: 'The same standardising as in F4, now with its name.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'f6-02',
      title: 'Distributions',
      summary: 'A distribution gives every outcome a probability from 0 to 1, summing to 1; the expected value weights each outcome by its probability.',
      card: {
        title: 'Distributions',
        text: 'A probability distribution gives each possible outcome a probability between 0 and 1, and the probabilities add up to 1. A classifier\'s output is one, such as 0.5 cat, 0.25 dog, 0.25 fox. The expected value, each outcome times its probability, summed, is the average you would see over many tries.',
        code: `p = np.array([0.5, 0.25, 0.25])
print(p.sum())
values = np.array([0, 10])
probs = np.array([0.9, 0.1])
print((values * probs).sum())`,
        output: '1.0\n1.0',
      },
      exercises: [
        {
          id: 'f6-2-1',
          type: 'mcq',
          prompt: 'Which is a valid probability distribution over three classes?',
          options: [
            { text: '[0.5, 0.3, 0.2]' },
            { text: '[0.5, 0.6, -0.1]', why: 'It sums to 1, but a probability cannot be negative.' },
            { text: '[0.4, 0.4, 0.1]', why: 'It sums to 0.9, not 1.' },
          ],
          answer: 0,
          explain: 'All between 0 and 1, and a total of 1.',
        },
        {
          id: 'f6-2-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `p = np.array([0.2, 0.5, 0.3])
print(np.isclose(p.sum(), 1),
      (p >= 0).all())`,
          answer: 'True True',
          options: [
            { text: 'True True' },
            { text: 'False True', why: '0.2 + 0.5 + 0.3 is 1 (`isclose` allows for rounding).' },
          ],
          explain: 'Both checks pass: a valid distribution.',
        },
        {
          id: 'f6-2-3',
          type: 'predict-output',
          prompt: 'A bet: lose 1 with probability 0.6, win 2 with probability 0.4. What does this print?',
          code: `values = np.array([-1, 2])
probs = np.array([0.6, 0.4])
ev = (values * probs).sum()
print(round(ev, 2))`,
          answer: '0.2',
          options: [
            { text: '0.2' },
            { text: '0.5', why: 'That is the plain average of −1 and 2; weight each by its probability.' },
            { text: '1.4', why: 'The loss counts as −0.6, not +0.6.' },
          ],
          explain: '−0.6 + 0.8: on average you win 0.2 a bet.',
        },
        {
          id: 'f6-2-4',
          type: 'predict-output',
          prompt: 'The model\'s top class. Type what this prints.',
          code: `classes = ["cat", "dog", "fox"]
p = np.array([0.2, 0.7, 0.1])
print(classes[p.argmax()])`,
          answer: 'dog',
          explain: 'The prediction is the most probable class.',
        },
        {
          id: 'f6-2-5',
          type: 'fill-blank',
          prompt: 'Turn counts into a distribution.',
          code: `counts = np.array([3, 1, 4])
p = counts ___ counts.sum()
print(p.sum())`,
          answer: ['/'],
          distractors: [
            { text: '*', why: 'Multiplying by the total makes the numbers bigger, not a distribution.' },
            { text: '-', why: 'Subtracting the total gives negative numbers.' },
          ],
          expectOutput: '1.0',
          explain: 'Each count over the total: 3/8, 1/8, 4/8.',
        },
        {
          id: 'f6-2-6',
          type: 'mcq',
          prompt: 'On the days a weather model says "90% rain", it rains 60% of the time. What is wrong with it?',
          options: [
            { text: 'It is overconfident' },
            { text: 'It is underconfident', why: 'It claims 90% but is right 60%: too sure, not too unsure.' },
            { text: 'Nothing: 60% is still likely', why: 'A model\'s probabilities should match how often things happen.' },
          ],
          answer: 0,
          explain: 'Probabilities that match reality are called calibrated.',
        },
        {
          id: 'f6-2-7',
          type: 'predict-output',
          prompt: 'The expected roll of a fair die. What does this print?',
          code: 'print(np.arange(1, 7).mean())',
          answer: '3.5',
          options: [
            { text: '3.5' },
            { text: '3.0', why: 'The faces are 1 to 6: their average is 21 / 6.' },
            { text: '6.0', why: '6 is the largest face, not the average.' },
          ],
          explain: 'Equal probabilities make the expected value a plain mean. No roll ever shows 3.5.',
        },
        {
          id: 'f6-2-8',
          type: 'run-code',
          prompt: 'Set `ev` to the expected value of `values` with probabilities `probs`.',
          before: `values = np.array([1, 5, 10])
probs = np.array([0.5, 0.3, 0.2])`,
          solution: 'ev = (values * probs).sum()',
          tests: 'assert abs(ev - 4.0) < 1e-9, f"0.5 + 1.5 + 2.0 = 4.0; got {ev}"',
          placeholder: 'ev = ...',
          explain: 'A dot product of values and probabilities: `values @ probs` works too.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'f6-03',
      title: 'Logarithms',
      summary: 'log undoes exp, turns products into sums, and is 0 or negative for probabilities.',
      card: {
        title: 'Logarithms',
        text: 'The logarithm undoes the exponential: log(eˣ) = x, and `np.log` uses base e. It turns multiplying into adding, log(a·b) = log a + log b, and log 1 = 0. For probabilities, which are at most 1, the log is 0 or negative, and it heads towards minus infinity as p shrinks to 0.',
        code: `print(np.log(1.0), np.log(np.e))
print(round(np.log(0.5), 3))
print(round(np.log(0.01), 3))`,
        output: '0.0 1.0\n-0.693\n-4.605',
      },
      exercises: [
        {
          id: 'f6-3-1',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: 'print(np.log(np.exp(3.0)))',
          answer: '3.0',
          typedWrong: [{ answer: '20.09', why: 'That is e³; the log undoes it, giving back 3.' }],
          explain: 'log and exp undo each other.',
        },
        {
          id: 'f6-3-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a, b = 0.5, 0.25
x = np.log(a * b)
y = np.log(a) + np.log(b)
print(round(x, 3), round(y, 3))`,
          answer: '-2.079 -2.079',
          options: [
            { text: '-2.079 -2.079' },
            { text: '-2.079 -0.481', why: 'The log of a product is the sum of the logs, so both are equal.' },
          ],
          explain: 'Products become sums: the reason logs are everywhere in ML.',
        },
        {
          id: 'f6-3-3',
          type: 'mcq',
          prompt: 'Which is larger: log(0.9) or log(0.1)?',
          options: [
            { text: 'log(0.9)' },
            { text: 'log(0.1)', why: 'log grows with its input: log(0.9) ≈ −0.1, log(0.1) ≈ −2.3.' },
          ],
          answer: 0,
          explain: 'Both are negative; the smaller the probability, the more negative.',
        },
        {
          id: 'f6-3-4',
          type: 'fill-blank',
          prompt: 'Write log(2 × 3) without multiplying.',
          code: `a, b = 2.0, 3.0
x = np.log(a) ___ np.log(b)
print(round(x, 3))`,
          answer: ['+'],
          distractors: [
            { text: '*', why: 'Multiplying logs gives 0.761, not log 6.' },
            { text: '-', why: 'Subtracting logs gives log(2/3).' },
          ],
          expectOutput: '1.792',
          explain: 'log 6 = log 2 + log 3.',
        },
        {
          id: 'f6-3-5',
          type: 'predict-output',
          prompt: 'The log of zero. What does this print?',
          code: 'print(np.log(0.0))',
          answer: '-inf',
          options: [
            { text: '-inf' },
            { text: '0.0', why: 'log 1 is 0; log 0 falls without limit.' },
          ],
          explain: 'A model that gives the right answer probability 0 gets an infinite loss, so code clips probabilities away from 0.',
        },
        {
          id: 'f6-3-6',
          type: 'mcq',
          prompt: 'Why do ML losses use logs of probabilities?',
          options: [
            { text: 'Products of many terms become sums' },
            { text: 'Logs of probabilities are positive', why: 'They are 0 or negative.' },
            { text: 'They push probabilities above 1', why: 'Logs do not change the probabilities themselves.' },
          ],
          answer: 0,
          explain: 'Sums are stable to compute and easy to differentiate.',
        },
        {
          id: 'f6-3-7',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: 'print(round(np.exp(np.log(5)), 6))',
          answer: '5.0',
          options: [
            { text: '5.0' },
            { text: '1.609438', why: 'That is log 5; exp undoes it.' },
          ],
          explain: 'Round trip.',
        },
        {
          id: 'f6-3-8',
          type: 'run-code',
          prompt: 'Set `logs` to the natural log of every probability in `p`.',
          before: 'p = np.array([0.5, 0.25, 0.125])',
          solution: 'logs = np.log(p)',
          tests: 'assert np.allclose(logs, [-0.6931, -1.3863, -2.0794], atol=1e-4), f"got {logs}"',
          placeholder: 'logs = ...',
          explain: 'Each halving subtracts the same amount, log 2.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'f6-04',
      title: 'Log-likelihood',
      summary: 'A dataset\'s probability is a product that underflows; the sum of logs, the log-likelihood, does not.',
      card: {
        title: 'Log-likelihood',
        text: 'The probability a model gives a whole dataset is the product of the probabilities of each example, and multiplying thousands of numbers below 1 underflows to 0.0. Taking logs turns the product into a sum, which stays in range: the log-likelihood. Higher (closer to 0) means the model fits the data better.',
        code: `p = np.full(1000, 0.3)
print(np.prod(p))
print(round(np.log(p).sum(), 1))`,
        output: '0.0\n-1204.0',
      },
      exercises: [
        {
          id: 'f6-4-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: 'print(np.prod(np.full(500, 0.1)))',
          answer: '0.0',
          options: [
            { text: '0.0' },
            { text: '1e-500', why: 'Floats cannot go that small: anything below about 1e-308 becomes 0.' },
          ],
          explain: 'Underflow: the true answer is not 0, but a float cannot hold it.',
        },
        {
          id: 'f6-4-2',
          type: 'predict-output',
          prompt: 'Type the log-likelihood, to 3 decimals.',
          code: `p = np.array([0.5, 0.5])
print(round(np.log(p).sum(), 3))`,
          answer: '-1.386',
          explain: 'Twice log 0.5.',
        },
        {
          id: 'f6-4-3',
          type: 'mcq',
          prompt: 'On the test set, model A\'s log-likelihood is −120 and model B\'s is −95. Which fits better?',
          options: [
            { text: 'Model B' },
            { text: 'Model A', why: '−95 is higher than −120: B gave the data more probability.' },
            { text: 'Neither: both are negative', why: 'Log-likelihoods are almost always negative; compare which is higher.' },
          ],
          answer: 0,
          explain: 'Closer to 0 is better.',
        },
        {
          id: 'f6-4-4',
          type: 'fill-blank',
          prompt: 'The log-likelihood.',
          code: `p = np.array([0.5, 0.25])
print(round(np.log(p).___(), 3))`,
          answer: ['sum'],
          distractors: [
            { text: 'prod', why: 'Multiplying logs has no meaning here; the logs are summed.' },
            { text: 'max', why: 'That keeps only the best example.' },
          ],
          expectOutput: '-2.079',
          explain: 'log 0.5 + log 0.25.',
        },
        {
          id: 'f6-4-5',
          type: 'predict-output',
          prompt: 'One example the model got badly wrong. What does this print?',
          code: `p = np.array([0.9, 0.9, 0.001])
print(np.round(np.log(p), 3))`,
          answer: '[-0.105 -0.105 -6.908]',
          options: [
            { text: '[-0.105 -0.105 -6.908]' },
            { text: '[0.105 0.105 6.908]', why: 'Logs of probabilities below 1 are negative.' },
          ],
          explain: 'One confident miss outweighs many good answers.',
        },
        {
          id: 'f6-4-6',
          type: 'mcq',
          prompt: 'Training minimises the negative log-likelihood instead of maximising the likelihood. Why?',
          options: [
            { text: 'Same goal; sums of logs do not underflow' },
            { text: 'It picks a different best model', why: 'log is increasing, so the best model is the same.' },
            { text: 'Likelihood cannot be computed at all', why: 'It can, for small data; it underflows for large data.' },
          ],
          answer: 0,
          explain: 'And optimisers are written to minimise, so the sign is flipped.',
        },
        {
          id: 'f6-4-7',
          type: 'spot-bug',
          prompt: 'The score comes out as minus infinity. Which line causes it?',
          code: `p = np.full(2000, 0.5)
lik = np.prod(p)
score = np.log(lik)
assert score > -2000, score`,
          error: 'AssertionError: -inf',
          answer: 1,
          raiseLine: 3,
          lineWhy: {
            '0': 'The probabilities are fine.',
            '2': 'Taking a log is right, but too late: the product has already become 0.',
            '3': 'The check is right: the true value is about −1386.',
          },
          explain: 'Sum the logs instead: `np.log(p).sum()`.',
        },
        {
          id: 'f6-4-8',
          type: 'run-code',
          prompt: 'Set `nll` to the negative log-likelihood of `p`: minus the sum of the logs.',
          before: 'p = np.array([0.8, 0.5, 0.25])',
          solution: 'nll = -np.log(p).sum()',
          tests: 'assert abs(nll - 2.3026) < 1e-3, f"-(log 0.8 + log 0.5 + log 0.25) ≈ 2.303; got {nll}"',
          placeholder: 'nll = ...',
          explain: 'Lower is better: this is what training minimises.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'f6-05',
      title: 'Softmax',
      summary: 'Softmax turns any scores into a distribution: exponentiate, then divide by the total.',
      card: {
        title: 'Softmax',
        text: 'A classifier\'s last layer gives raw scores (logits) of any size or sign. Softmax turns them into a distribution: raise e to each score, then divide by the total, so every output is positive and they sum to 1. Bigger scores get bigger probabilities, and the order never changes.',
        code: `z = np.array([2.0, 1.0, 0.1])
e = np.exp(z)
p = e / e.sum()
print(np.round(p, 3))`,
        output: '[0.659 0.242 0.099]',
      },
      exercises: [
        {
          id: 'f6-5-1',
          type: 'predict-output',
          prompt: 'Equal scores. What does this print?',
          code: `z = np.array([0.0, 0.0])
e = np.exp(z)
print(e / e.sum())`,
          answer: '[0.5 0.5]',
          options: [
            { text: '[0.5 0.5]' },
            { text: '[0. 0.]', why: 'e⁰ is 1, not 0: two equal parts of the whole.' },
            { text: '[1. 1.]', why: 'Dividing by the total makes them sum to 1.' },
          ],
          explain: 'Equal scores, equal probabilities.',
        },
        {
          id: 'f6-5-2',
          type: 'predict-output',
          prompt: 'Negative scores. What does this print?',
          code: `z = np.array([-1.0, -1.0, -1.0])
e = np.exp(z)
print(np.round(e / e.sum(), 3))`,
          answer: '[0.333 0.333 0.333]',
          options: [
            { text: '[0.333 0.333 0.333]' },
            { text: '[-0.333 -0.333 -0.333]', why: 'e to any power is positive, so softmax never gives negatives.' },
          ],
          explain: 'Only the differences between scores matter.',
        },
        {
          id: 'f6-5-3',
          type: 'mcq',
          prompt: 'How does softmax of [5, 5, 5] compare with softmax of [1, 1, 1]?',
          options: [
            { text: 'They are identical' },
            { text: 'The first is sharper', why: 'Adding 4 to every score changes no difference between them.' },
            { text: 'The first sums to more', why: 'Every softmax sums to 1.' },
          ],
          answer: 0,
          explain: 'Both are [1/3, 1/3, 1/3]: softmax ignores a shift added to all scores.',
        },
        {
          id: 'f6-5-4',
          type: 'fill-blank',
          prompt: 'Normalise so the probabilities sum to 1.',
          code: `z = np.array([1.0, 2.0])
e = np.exp(z)
p = e / e.___()
print(round(p.sum(), 6))`,
          answer: ['sum'],
          distractors: [
            { text: 'max', why: 'Dividing by the largest gives a top value of 1, and a total above 1.' },
            { text: 'mean', why: 'Dividing by the mean makes the total equal the number of classes.' },
          ],
          expectOutput: '1.0',
          explain: 'Divide by the total.',
        },
        {
          id: 'f6-5-5',
          type: 'predict-output',
          prompt: 'Shift every score by 100. What does this print?',
          code: `def softmax(z):
    e = np.exp(z)
    return e / e.sum()

z = np.array([1.0, 3.0])
print(np.allclose(softmax(z),
                  softmax(z + 100)))`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'e^(z+100) = e^z · e^100, and the e^100 cancels in the division.' },
          ],
          explain: 'That is why subtracting the largest score first is safe, and avoids overflow.',
        },
        {
          id: 'f6-5-6',
          type: 'spot-bug',
          prompt: 'The "probabilities" include a negative. Which line is wrong?',
          code: `z = np.array([2.0, -1.0])
p = z / z.sum()
assert (p >= 0).all(), p`,
          error: 'AssertionError: [ 2. -1.]',
          answer: 1,
          raiseLine: 2,
          lineWhy: {
            '0': 'Scores can be any sign.',
            '2': 'The check is right: probabilities cannot be negative.',
          },
          explain: 'Exponentiate first: `e = np.exp(z); p = e / e.sum()`.',
        },
        {
          id: 'f6-5-7',
          type: 'predict-output',
          prompt: 'Huge scores. What does this print?',
          code: `z = np.array([1000.0, 1000.0])
e = np.exp(z)
print(e / e.sum())`,
          answer: '[nan nan]',
          options: [
            { text: '[nan nan]' },
            { text: '[0.5 0.5]', why: 'e¹⁰⁰⁰ overflows to inf, and inf / inf is not a number.' },
          ],
          explain: 'Subtract the largest score first: `np.exp(z - z.max())` gives [0.5 0.5].',
        },
        {
          id: 'f6-5-8',
          type: 'run-code',
          prompt: 'Set `p` to the softmax of `z`.',
          before: 'z = np.array([0.0, 1.0, 2.0])',
          solution: 'e = np.exp(z)\np = e / e.sum()',
          tests: [
            'assert abs(p.sum() - 1) < 1e-9, "probabilities sum to 1"',
            'assert np.allclose(p, [0.0900, 0.2447, 0.6652], atol=1e-4), f"got {p}"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'e = np.exp(z)',
          explain: 'Exponentiate, then normalise.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'f6-06',
      title: 'Temperature',
      summary: 'Dividing scores by a temperature before softmax sharpens (T < 1) or flattens (T > 1) the distribution.',
      card: {
        title: 'Temperature',
        text: 'Dividing the scores by a temperature T before softmax changes how sure the result looks: T below 1 sharpens it towards the top choice, and T above 1 flattens it towards equal chances. Language models sample each next token from such a distribution. That is why a low temperature gives more predictable text.',
        code: `def softmax(z):
    e = np.exp(z)
    return e / e.sum()

z = np.array([2.0, 1.0])
for T in [0.5, 1, 2]:
    p = softmax(z / T)
    print(T, np.round(p, 2))`,
        output: '0.5 [0.88 0.12]\n1 [0.73 0.27]\n2 [0.62 0.38]',
      },
      exercises: [
        {
          id: 'f6-6-1',
          type: 'mcq',
          prompt: 'A factual assistant should give the same, most likely answer each time. Which temperature?',
          options: [
            { text: 'Low, such as 0.2' },
            { text: 'High, such as 1.5', why: 'High temperature spreads probability to less likely tokens: more variety, more mistakes.' },
          ],
          answer: 0,
          explain: 'Low temperature concentrates on the top choice.',
        },
        {
          id: 'f6-6-2',
          type: 'predict-output',
          prompt: 'A very low temperature. What does this print?',
          code: `def softmax(z):
    e = np.exp(z)
    return e / e.sum()

z = np.array([2.0, 1.0])
print(np.round(softmax(z / 0.1), 2))`,
          answer: '[1. 0.]',
          options: [
            { text: '[1. 0.]' },
            { text: '[0.73 0.27]', why: 'That is T = 1. Dividing by 0.1 makes the gap 10 times larger.' },
            { text: '[0.5 0.5]', why: 'That is what a very high temperature tends to.' },
          ],
          explain: 'Near 0, softmax becomes "pick the top one".',
        },
        {
          id: 'f6-6-3',
          type: 'predict-output',
          prompt: 'A very high temperature. What does this print?',
          code: `def softmax(z):
    e = np.exp(z)
    return e / e.sum()

z = np.array([2.0, 1.0])
print(np.round(softmax(z / 100), 2))`,
          answer: '[0.5 0.5]',
          options: [
            { text: '[0.5 0.5]' },
            { text: '[1. 0.]', why: 'Dividing by 100 shrinks the gap between scores to 0.01.' },
          ],
          explain: 'Very high T makes every choice almost equally likely.',
        },
        {
          id: 'f6-6-4',
          type: 'fill-blank',
          prompt: 'Apply temperature T = 2.',
          code: `def softmax(z):
    e = np.exp(z)
    return e / e.sum()

z, T = np.array([2.0, 1.0]), 2
print(np.round(softmax(z ___ T), 2))`,
          answer: ['/'],
          distractors: [
            { text: '*', why: 'Multiplying by 2 sharpens it: [0.88 0.12].' },
            { text: '+', why: 'Adding to every score changes nothing in softmax.' },
          ],
          expectOutput: '[0.62 0.38]',
          explain: 'Divide by T: above 1, flatter.',
        },
        {
          id: 'f6-6-5',
          type: 'mcq',
          prompt: 'Can changing the temperature change which class is most likely?',
          options: [
            { text: 'No: the order stays the same' },
            { text: 'Yes, at high temperatures', why: 'Dividing every score by the same positive T keeps their order.' },
            { text: 'Yes, at low temperatures', why: 'Low T makes the top choice more dominant, never different.' },
          ],
          answer: 0,
          explain: 'It changes how sure, not which.',
        },
        {
          id: 'f6-6-6',
          type: 'predict-output',
          prompt: 'The top class at three temperatures. What does this print?',
          code: `def softmax(z):
    e = np.exp(z)
    return e / e.sum()

z = np.array([3.0, 1.0, 2.0])
print([int(softmax(z / T).argmax())
       for T in [0.5, 1, 5]])`,
          answer: '[0, 0, 0]',
          options: [
            { text: '[0, 0, 0]' },
            { text: '[0, 0, 2]', why: 'Temperature never reorders the scores.' },
          ],
          explain: 'The order of scores survives any positive T.',
        },
        {
          id: 'f6-6-7',
          type: 'mcq',
          prompt: 'A story generator\'s text is repetitive and dull. What do you try?',
          options: [
            { text: 'Raise the temperature' },
            { text: 'Lower the temperature', why: 'That makes it pick the most likely words even more often.' },
            { text: 'Remove the softmax step', why: 'Then there is no distribution to sample from.' },
          ],
          answer: 0,
          explain: 'More spread, more variety (and more odd choices).',
        },
        {
          id: 'f6-6-8',
          type: 'run-code',
          prompt: 'Set `p` to the softmax of `z` at temperature 0.5.',
          before: `def softmax(z):
    e = np.exp(z)
    return e / e.sum()

z = np.array([1.0, 0.0])`,
          solution: 'p = softmax(z / 0.5)',
          tests: 'assert np.allclose(p, [0.8808, 0.1192], atol=1e-4), f"z / 0.5 = [2, 0]; got {p}"',
          placeholder: 'p = ...',
          explain: 'Sharper than plain softmax ([0.73, 0.27]).',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'f6-07',
      title: 'Cross-entropy',
      summary: 'Cross-entropy is −log of the probability the model gave the correct class, averaged over the batch.',
      card: {
        title: 'Cross-entropy',
        text: 'To score a classifier on one example, look only at the probability p it gave the correct class, and take −log p. That is the cross-entropy loss: 0 when the model put probability 1 on the right answer, and larger the less it gave. Over a batch, take the mean.',
        code: `p = np.array([0.7, 0.2, 0.1])
y = 0   # the correct class
print(round(-np.log(p[y]), 3))`,
        output: '0.357',
      },
      exercises: [
        {
          id: 'f6-7-1',
          type: 'predict-output',
          prompt: 'Type the loss, to 3 decimals.',
          code: `p = np.array([0.5, 0.5])
y = 1
print(round(-np.log(p[y]), 3))`,
          answer: '0.693',
          explain: 'A coin-flip guess: −log 0.5.',
        },
        {
          id: 'f6-7-2',
          type: 'predict-output',
          prompt: 'The correct class is 2 this time. What does this print?',
          code: `p = np.array([0.7, 0.2, 0.1])
y = 2
print(round(-np.log(p[y]), 3))`,
          answer: '2.303',
          options: [
            { text: '2.303' },
            { text: '0.357', why: 'That is the loss if class 0 were right. Class 2 got only 0.1.' },
            { text: '0.1', why: 'The loss is −log of 0.1, not 0.1 itself.' },
          ],
          explain: 'A confident wrong prediction costs a lot.',
        },
        {
          id: 'f6-7-3',
          type: 'mcq',
          prompt: 'The model gives the correct class probability 1.0. What is the loss?',
          options: [
            { text: '0' },
            { text: '1', why: '−log 1 is 0: nothing to improve.' },
            { text: 'Infinity', why: 'Infinity is for probability 0 on the correct class.' },
          ],
          answer: 0,
          explain: 'Perfect and certain: zero loss.',
        },
        {
          id: 'f6-7-4',
          type: 'fill-blank',
          prompt: 'Pick each row\'s correct-class probability. `P[rows, cols]` picks one item per row.',
          code: `P = np.array([[0.7, 0.3],
              [0.4, 0.6],
              [0.9, 0.1]])
y = np.array([0, 1, 0])
print(P[np.arange(3), ___])`,
          answer: ['y'],
          distractors: [
            { text: '0', why: 'That takes column 0 from every row, ignoring the labels.' },
            { text: '1', why: 'That takes column 1 from every row.' },
          ],
          expectOutput: '[0.7 0.6 0.9]',
          explain: 'Row i, column y[i]: the probability of the true label.',
        },
        {
          id: 'f6-7-5',
          type: 'predict-output',
          prompt: 'The batch loss. What does this print?',
          code: `picked = np.array([0.7, 0.6, 0.9])
loss = -np.log(picked).mean()
print(round(loss, 3))`,
          answer: '0.324',
          options: [
            { text: '0.324' },
            { text: '0.973', why: 'That is the sum; the batch loss is the mean.' },
            { text: '-0.324', why: 'The minus sign makes the loss positive.' },
          ],
          explain: 'Average −log p over the batch.',
        },
        {
          id: 'f6-7-6',
          type: 'match-pairs',
          prompt: 'Match the probability on the correct class to its loss.',
          pairs: [
            { left: '1.0', right: '0', why: '−log 1 = 0.' },
            { left: '0.5', right: 'about 0.69', why: '−log 0.5 ≈ 0.693.' },
            { left: '0.1', right: 'about 2.3', why: '−log 0.1 ≈ 2.303.' },
            { left: '0.001', right: 'about 6.9', why: '−log 0.001 ≈ 6.908.' },
          ],
          explain: 'Every tenfold drop in probability adds about 2.3.',
        },
        {
          id: 'f6-7-7',
          type: 'spot-bug',
          prompt: 'The loss is high although the model was right. Which line?',
          code: `p = np.array([0.1, 0.8, 0.1])
y = 1
loss = -np.log(p[0])
assert loss < 1, loss`,
          error: 'AssertionError: 2.30...',
          answer: 2,
          raiseLine: 3,
          lineWhy: {
            '0': 'The model gives class 1 a probability of 0.8.',
            '1': 'The label is class 1.',
            '3': 'The check is right: −log 0.8 ≈ 0.22.',
          },
          explain: 'Use the label: `p[y]`.',
        },
        {
          id: 'f6-7-8',
          type: 'run-code',
          prompt: 'Set `loss` to the cross-entropy for this example.',
          before: `p = np.array([0.25, 0.25, 0.5])
y = 2`,
          solution: 'loss = -np.log(p[y])',
          tests: 'assert abs(loss - 0.6931) < 1e-4, f"-log 0.5 ≈ 0.693; got {loss}"',
          placeholder: 'loss = ...',
          explain: 'Only the correct class\'s probability counts.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'f6-08',
      title: 'Why cross-entropy',
      summary: 'Cross-entropy punishes confident mistakes, changes smoothly, and with softmax has the simple gradient p − one-hot.',
      card: {
        title: 'Why cross-entropy',
        text: 'Cross-entropy punishes confident mistakes hard: giving the right class 0.01 costs 4.6, against 0.69 for a 50/50 guess. Unlike accuracy, it changes smoothly as the probabilities move, so it gives a useful gradient even when the top prediction stays the same. With softmax, its gradient with respect to the scores is simply the predicted probabilities minus the one-hot answer.',
        code: `for p in [0.9, 0.5, 0.1, 0.01]:
    print(p, round(-np.log(p), 2))`,
        output: '0.9 0.11\n0.5 0.69\n0.1 2.3\n0.01 4.61',
      },
      exercises: [
        {
          id: 'f6-8-1',
          type: 'mcq',
          prompt: 'Two models are both always right. A gives the correct class 0.55; B gives it 0.95. Which has the lower cross-entropy?',
          options: [
            { text: 'Model B' },
            { text: 'Model A', why: '−log 0.55 ≈ 0.6 is more than −log 0.95 ≈ 0.05.' },
            { text: 'Equal: same accuracy', why: 'Accuracy is equal; cross-entropy also rewards confidence in the right answer.' },
          ],
          answer: 0,
          explain: 'Cross-entropy still has something to say when accuracy does not.',
        },
        {
          id: 'f6-8-2',
          type: 'mcq',
          prompt: 'Why not train on accuracy directly?',
          options: [
            { text: 'It moves in jumps: zero gradient' },
            { text: 'It is far too slow to compute', why: 'Accuracy is cheap; the problem is that tiny weight changes do not move it.' },
            { text: 'It can be larger than 1', why: 'Accuracy is between 0 and 1.' },
          ],
          answer: 0,
          explain: 'A small nudge to a weight rarely flips a prediction, so accuracy\'s slope is almost always 0.',
        },
        {
          id: 'f6-8-3',
          type: 'predict-output',
          prompt: 'The gradient with respect to the scores, for true class 2. What does this print?',
          code: `p = np.array([0.7, 0.2, 0.1])
onehot = np.array([0.0, 0.0, 1.0])
print(p - onehot)`,
          answer: '[ 0.7  0.2 -0.9]',
          options: [
            { text: '[ 0.7  0.2 -0.9]' },
            { text: '[-0.7 -0.2  0.9]', why: 'It is p minus the one-hot, so the true class gets p − 1 = −0.9.' },
          ],
          explain: 'Stepping against it raises the true class\'s score and lowers the others.',
        },
        {
          id: 'f6-8-4',
          type: 'predict-output',
          prompt: 'A confident miss and an unsure guess. What does this print?',
          code: `a = -np.log(0.01)
b = -np.log(0.5)
print(round(a, 2), round(b, 2))`,
          answer: '4.61 0.69',
          options: [
            { text: '4.61 0.69' },
            { text: '0.69 4.61', why: 'The 0.01 on the true class is the confident miss: the larger loss.' },
          ],
          explain: 'Saying "I am sure it is not that" and being wrong is what costs most.',
        },
        {
          id: 'f6-8-5',
          type: 'fill-blank',
          prompt: 'Make the one-hot vector for class 2 of 3.',
          code: `y = 2
onehot = np.zeros(3)
onehot[y] = ___
print(onehot)`,
          answer: ['1'],
          distractors: [
            { text: '0', why: 'Then every entry is 0: no class is marked.' },
            { text: 'y', why: 'That writes 2, not 1, into the true class.' },
          ],
          expectOutput: '[0. 0. 1.]',
          explain: 'All the probability on the true class.',
        },
        {
          id: 'f6-8-6',
          type: 'mcq',
          prompt: 'You are predicting house prices, a number. Which loss fits?',
          options: [
            { text: 'Mean squared error' },
            { text: 'Cross-entropy loss', why: 'Cross-entropy needs a probability for each class; a price is a number.' },
            { text: 'Accuracy', why: 'A predicted price is almost never exactly right.' },
          ],
          answer: 0,
          explain: 'Classes: cross-entropy. Numbers: squared error (unit F7).',
        },
        {
          id: 'f6-8-7',
          type: 'predict-output',
          prompt: 'Accuracy cannot see this improvement. What does this print?',
          code: `before, after = 0.55, 0.9
print(before > 0.5, after > 0.5)
print(round(-np.log(before), 2),
      round(-np.log(after), 2))`,
          answer: 'True True\n0.6 0.11',
          options: [
            { text: 'True True\n0.6 0.11' },
            { text: 'True True\n0.6 0.6', why: 'The loss falls as the true class gets more probability.' },
          ],
          explain: 'Both are "right", so accuracy is unchanged; the loss still improves.',
        },
        {
          id: 'f6-8-8',
          type: 'run-code',
          prompt: 'Set `loss` to the mean cross-entropy over the batch. `P[np.arange(n), y]` picks each row\'s correct probability.',
          before: `P = np.array([[0.5, 0.5],
              [0.9, 0.1],
              [0.2, 0.8]])
y = np.array([0, 0, 1])
n = len(y)`,
          solution: 'picked = P[np.arange(n), y]\nloss = -np.log(picked).mean()',
          tests: 'assert abs(loss - 0.3405) < 1e-3, f"mean of -log [0.5, 0.9, 0.8] ≈ 0.340; got {loss}"',
          maxLines: 2,
          placeholder: 'picked = ...',
          explain: 'This is the loss PyTorch\'s CrossEntropyLoss computes (from the scores).',
        },
      ],
    },

    // ------------------------------------------------------------------ 9
    {
      id: 'f6-09',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can describe spread, work with distributions and logs, apply softmax and temperature, and compute cross-entropy.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each one, ask: is this a probability, a log of one, or a loss?',
      },
      exercises: [
        {
          id: 'f6-9-1',
          type: 'predict-output',
          prompt: 'Type the variance.',
          code: 'print(np.array([2.0, 4.0]).var())',
          answer: '1.0',
          explain: 'Each value is 1 from the mean of 3.',
        },
        {
          id: 'f6-9-2',
          type: 'mcq',
          prompt: 'Which could be a softmax output?',
          options: [
            { text: '[0.1, 0.6, 0.3]' },
            { text: '[0.0, 1.2, -0.2]', why: 'Softmax outputs are positive.' },
            { text: '[0.5, 0.5, 0.5]', why: 'Softmax outputs sum to 1.' },
          ],
          answer: 0,
          explain: 'Positive, summing to 1.',
        },
        {
          id: 'f6-9-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: 'print(round(np.log(4) - np.log(2), 3))',
          answer: '0.693',
          options: [
            { text: '0.693' },
            { text: '1.386', why: 'Subtracting logs divides: log(4 / 2) = log 2.' },
            { text: '2.0', why: 'log 4 − log 2 is log 2, not 4 − 2.' },
          ],
          explain: 'Differences of logs are logs of ratios.',
        },
        {
          id: 'f6-9-4',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `z = np.array([0.0, np.log(3)])
e = np.exp(z)
print(e / e.sum())`,
          answer: '[0.25 0.75]',
          options: [
            { text: '[0.25 0.75]' },
            { text: '[0. 1.]', why: 'e⁰ is 1 and e^(log 3) is 3: one part to three.' },
          ],
          explain: '1 / 4 and 3 / 4.',
        },
        {
          id: 'f6-9-5',
          type: 'predict-output',
          prompt: 'The correct class got 0.25. Type the loss, to 3 decimals.',
          code: 'print(round(-np.log(0.25), 3))',
          answer: '1.386',
          explain: 'Twice the coin-flip loss.',
        },
        {
          id: 'f6-9-6',
          type: 'mcq',
          prompt: 'A code assistant sometimes invents unusual function names. What do you lower?',
          options: [
            { text: 'The sampling temperature' },
            { text: 'The number of classes', why: 'A language model\'s vocabulary is fixed; temperature controls how adventurous it samples.' },
          ],
          answer: 0,
          explain: 'Lower temperature, more likely tokens.',
        },
        {
          id: 'f6-9-7',
          type: 'fill-blank',
          prompt: 'Softmax that cannot overflow.',
          code: `z = np.array([1000.0, 0.0])
e = np.exp(z ___ z.max())
print(e / e.sum())`,
          answer: ['-'],
          distractors: [
            { text: '+', why: 'That doubles the largest score: e²⁰⁰⁰ overflows to inf.' },
            { text: '*', why: 'Multiplying makes the scores even larger.' },
          ],
          expectOutput: '[1. 0.]',
          explain: 'Subtracting the max leaves the result unchanged and the largest exponent at 0.',
        },
        {
          id: 'f6-9-8',
          type: 'spot-bug',
          prompt: 'The probabilities do not sum to 1. Which line?',
          code: `z = np.array([1.0, 2.0])
e = np.exp(z)
p = e / e.max()
assert abs(p.sum() - 1) < 1e-9, p`,
          error: 'AssertionError: [0.36787944 1.        ]',
          answer: 2,
          raiseLine: 3,
          lineWhy: {
            '0': 'The scores are fine.',
            '1': 'Exponentiating first is right.',
            '3': 'The check is right: a distribution sums to 1.',
          },
          explain: 'Divide by the sum: `e / e.sum()`.',
        },
        {
          id: 'f6-9-9',
          type: 'match-pairs',
          prompt: 'Match each idea to what it does.',
          pairs: [
            { left: 'variance', right: 'mean squared distance from the mean', why: 'Spread, in squared units.' },
            { left: 'softmax', right: 'turns scores into probabilities', why: 'Exponentiate and normalise.' },
            { left: 'cross-entropy', right: '−log p of the right class', why: 'The classification loss.' },
            { left: 'temperature', right: 'sharpens or flattens softmax', why: 'Divides the scores first.' },
          ],
          explain: 'The vocabulary of every classifier and language model.',
        },
        {
          id: 'f6-9-10',
          type: 'run-code',
          prompt: 'Set `nll` to the mean cross-entropy of the batch.',
          before: `P = np.array([[0.8, 0.2],
              [0.3, 0.7]])
y = np.array([0, 1])
n = len(y)`,
          solution: 'p = P[np.arange(n), y]\nnll = -np.log(p).mean()',
          tests: 'assert abs(nll - 0.2899) < 1e-3, f"mean of -log 0.8 and -log 0.7 ≈ 0.290; got {nll}"',
          maxLines: 2,
          placeholder: 'p = ...',
          explain: 'Pick, log, negate, average.',
        },
      ],
    },
  ],
  labs: f6Labs,
  library: f6Library,
};
