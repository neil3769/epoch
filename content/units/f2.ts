import { f2Labs } from '../labs/f2';
import { f2Library } from '../library/f2';
import type { Unit } from '../schema';

/*
 * F2 Vectors. Concrete framing first (a list of numbers that describes
 * something), then the operations by hand, then NumPy, then why it matters
 * for AI (embeddings and similarity search). Every answer is executed.
 */
export const f2: Unit = {
  id: 'F2',
  track: 'foundations',
  title: 'Vectors',
  blurb: 'A list of numbers with meaning: add, scale, the dot product as a weighted sum, length, direction and cosine similarity.',
  prelude: 'import numpy as np',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'f2-01',
      title: 'A list with meaning',
      summary: 'A vector is a list of numbers where each position always means the same thing.',
      card: {
        title: 'A list with meaning',
        text: 'A vector is a list of numbers where each position has a fixed meaning, such as a flat described as [price, rooms, floor]. Two vectors can be compared only if their positions mean the same things in the same order. In AI, words, images and users all become vectors like this.',
        code: `# [price in k, rooms, floor]
flat_a = [250, 3, 2]
flat_b = [180, 2, 5]
print(flat_a[1], flat_b[1])`,
        output: '3 2',
      },
      exercises: [
        {
          id: 'f2-1-1',
          type: 'predict-output',
          prompt: 'Positions are [price, rooms, floor]. Type the floor of flat b.',
          code: `flat_b = [180, 2, 5]
print(flat_b[2])`,
          answer: '5',
          explain: 'Position 2 (the third) is the floor.',
        },
        {
          id: 'f2-1-2',
          type: 'mcq',
          prompt: 'One flat is stored as [price, rooms, floor] and another as [rooms, price, floor]. What goes wrong?',
          options: [
            { text: 'Comparing them mixes prices with rooms' },
            { text: 'Nothing: the same numbers are there', why: 'Position carries the meaning, so a swapped order compares price with rooms.' },
            { text: 'Python refuses to compare them', why: 'Python happily compares any two lists; it cannot know the meanings are swapped.' },
          ],
          answer: 0,
          explain: 'Every vector in a set must use the same order of meanings.',
        },
        {
          id: 'f2-1-3',
          type: 'predict-output',
          prompt: 'How many numbers describe each flat? What does this print?',
          code: `flats = [[250, 3, 2],
         [180, 2, 5],
         [320, 4, 1]]
print(len(flats), len(flats[0]))`,
          answer: '3 3',
          options: [
            { text: '3 3' },
            { text: '9 3', why: '`len(flats)` counts the flats (rows), not all the numbers.' },
            { text: '3 9', why: 'Each flat has 3 numbers: price, rooms and floor.' },
          ],
          explain: 'Three flats, each a vector of length 3: its dimension.',
        },
        {
          id: 'f2-1-4',
          type: 'predict-output',
          prompt: 'As a NumPy array. What does this print?',
          code: `flats = np.array([[250, 3, 2],
                  [180, 2, 5]])
print(flats.shape)`,
          answer: '(2, 3)',
          options: [
            { text: '(2, 3)' },
            { text: '(3, 2)', why: 'Shapes are (rows, columns): 2 flats of 3 numbers each.' },
            { text: '(6,)', why: 'The array keeps the rows: 2 by 3, not one long list.' },
          ],
          explain: 'One row per item, one column per feature: the usual layout.',
        },
        {
          id: 'f2-1-5',
          type: 'predict-output',
          prompt: 'Pick one feature for every flat. What does this print?',
          code: `flats = np.array([[250, 3, 2],
                  [180, 2, 5],
                  [320, 4, 1]])
print(flats[:, 1])`,
          answer: '[3 2 4]',
          options: [
            { text: '[3 2 4]' },
            { text: '[180 2 5]', why: '`[:, 1]` takes column 1 from every row; `[1]` would take row 1.' },
            { text: '[250 180 320]', why: 'Column 0 is price. Column 1 is rooms.' },
          ],
          explain: '`[:, j]` is "feature j for every item".',
        },
        {
          id: 'f2-1-6',
          type: 'mcq',
          prompt: 'A model turns each word into a list of 300 numbers. What is that list?',
          options: [
            { text: 'A vector describing the word' },
            { text: 'A list of 300 synonyms', why: 'They are numbers, not words. Each position is a learned feature.' },
            { text: 'The word\'s 300 letters, coded as numbers', why: 'Its length is fixed at 300 whatever the word, so it is not spelling.' },
          ],
          answer: 0,
          explain: 'An embedding: words with similar meanings get similar vectors (unit F10).',
        },
        {
          id: 'f2-1-7',
          type: 'fill-blank',
          prompt: 'Get the rooms of the second flat.',
          code: `flats = [[250, 3, 2],
         [180, 2, 5]]
print(flats[___][___])`,
          answer: ['1', '1'],
          distractors: [
            { text: '2', why: 'Index 2 is past the last row, and in a flat it is the floor, not the rooms.' },
            { text: '0', why: 'Index 0 is the first flat, or the price.' },
          ],
          expectOutput: '2',
          explain: 'Row 1 is the second flat; position 1 is rooms.',
        },
        {
          id: 'f2-1-8',
          type: 'run-code',
          prompt: 'Make `flat` a NumPy vector for a flat costing 200k with 3 rooms on floor 4 (in the order [price, rooms, floor]).',
          solution: 'flat = np.array([200, 3, 4])',
          tests: [
            'assert isinstance(flat, np.ndarray), "make it a NumPy array"',
            'assert flat.tolist() == [200, 3, 4], f"price, rooms, floor: got {flat.tolist()}"',
          ].join('\n'),
          placeholder: 'flat = np.array(...)',
          explain: 'The order of the numbers is the meaning.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'f2-02',
      title: 'Adding vectors',
      summary: 'Adding vectors adds them position by position; both must have the same length.',
      card: {
        title: 'Adding vectors',
        text: 'Adding two vectors adds them position by position, so a change of [+10, 0, +1] applied to [250, 3, 2] gives [260, 3, 3]. Both must have the same length, since each position meets its partner. NumPy does this with `+`; plain Python lists would join instead.',
        code: `a = np.array([250, 3, 2])
change = np.array([10, 0, 1])
print(a + change)`,
        output: '[260   3   3]',
      },
      exercises: [
        {
          id: 'f2-2-1',
          type: 'number-grid',
          prompt: 'Fill in `a + b`.',
          inputs: [
            { name: 'a', value: [[1, 4, 2]] },
            { name: 'b', value: [[3, 0, 5]] },
          ],
          expr: 'a + b',
          answer: [[4, 4, 7]],
          explain: '1 + 3, 4 + 0, 2 + 5: each position with its partner.',
        },
        {
          id: 'f2-2-2',
          type: 'predict-output',
          prompt: 'Plain lists, not arrays. What does this print?',
          code: `a = [1, 2]
b = [3, 4]
print(a + b)`,
          answer: '[1, 2, 3, 4]',
          options: [
            { text: '[1, 2, 3, 4]' },
            { text: '[4, 6]', why: 'For plain lists `+` joins them end to end; NumPy arrays add position by position.' },
          ],
          explain: 'Use NumPy arrays (or a loop) for vector maths.',
        },
        {
          id: 'f2-2-3',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `a = np.array([2, 5])
b = np.array([1, -3])
print(a - b)`,
          answer: '[1 8]',
          explain: '2 − 1 = 1 and 5 − (−3) = 8.',
        },
        {
          id: 'f2-2-4',
          type: 'spot-bug',
          prompt: 'Which line mixes vectors of different lengths?',
          code: `a = np.array([1, 2, 3])
b = np.array([4, 5])
c = a + b`,
          error: 'ValueError: operands could not be broadcast together with shapes (3,) (2,) ',
          answer: 1,
          raiseLine: 2,
          lineWhy: {
            '0': 'A length-3 vector is fine on its own.',
            '2': 'Python raises here, but adding is right; one vector is a different length.',
          },
          explain: 'Each position needs a partner: both vectors must have the same length.',
        },
        {
          id: 'f2-2-5',
          type: 'predict-output',
          prompt: 'Average two vectors. What does this print?',
          code: `a = np.array([2.0, 4.0])
b = np.array([4.0, 8.0])
print((a + b) / 2)`,
          answer: '[3. 6.]',
          options: [
            { text: '[3. 6.]' },
            { text: '[6. 12.]', why: 'That is the sum; dividing by 2 gives the average.' },
            { text: '4.5', why: 'The result is still a vector: one average per position.' },
          ],
          explain: 'Averaging vectors is how you get a "typical" item, such as a centroid.',
        },
        {
          id: 'f2-2-6',
          type: 'fill-blank',
          prompt: 'Add the two vectors position by position.',
          code: `a = [1, 2, 3]
b = [10, 20, 30]
print([x ___ y for x, y in zip(a, b)])`,
          answer: ['+'],
          distractors: [
            { text: '*', why: '`*` multiplies each pair: [10, 40, 90].' },
            { text: '-', why: '`-` subtracts each pair.' },
          ],
          expectOutput: '[11, 22, 33]',
          explain: 'Without NumPy, zip the vectors and add pairs.',
        },
        {
          id: 'f2-2-7',
          type: 'mcq',
          prompt: 'Why can [price, rooms] and [rooms, price] not be added meaningfully, even though both have length 2?',
          options: [
            { text: 'It would add prices to rooms' },
            { text: 'Their lengths differ', why: 'Both have length 2; the problem is the order of meanings.' },
            { text: 'Vectors can only be added to themselves', why: 'Any two vectors with the same meanings in the same order can be added.' },
          ],
          answer: 0,
          explain: 'Same length is necessary but not enough: the meanings must line up too.',
        },
        {
          id: 'f2-2-8',
          type: 'run-code',
          prompt: 'Set `total` to the sum of the two vectors.',
          before: `a = np.array([1, 2, 3])
b = np.array([4, 5, 6])`,
          solution: 'total = a + b',
          tests: 'assert np.asarray(total).tolist() == [5, 7, 9], f"got {total}"',
          placeholder: 'total = ...',
          explain: 'NumPy adds position by position.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'f2-03',
      title: 'Scaling',
      summary: 'Multiplying a vector by a number scales every position by that number.',
      card: {
        title: 'Scaling',
        text: 'Multiplying a vector by a single number scales every position: 2 × [1, 3] is [2, 6]. The vector keeps its direction and only its size changes (a negative number also flips it). Gradient descent does exactly this when it takes a step: learning rate times gradient.',
        code: `v = np.array([1, 3])
print(2 * v)
print(-0.5 * v)`,
        output: '[2 6]\n[-0.5 -1.5]',
      },
      exercises: [
        {
          id: 'f2-3-1',
          type: 'number-grid',
          prompt: 'Fill in `3 * v`.',
          inputs: [{ name: 'v', value: [[2, -1, 4]] }],
          expr: '3 * v',
          answer: [[6, -3, 12]],
          explain: 'Every position times 3.',
        },
        {
          id: 'f2-3-2',
          type: 'predict-output',
          prompt: 'Plain list times a number. What does this print?',
          code: `v = [1, 2]
print(v * 2)`,
          answer: '[1, 2, 1, 2]',
          options: [
            { text: '[1, 2, 1, 2]' },
            { text: '[2, 4]', why: 'For a plain list, `* 2` repeats it. NumPy arrays scale.' },
          ],
          explain: 'Another reason to use NumPy for vectors.',
        },
        {
          id: 'f2-3-3',
          type: 'predict-output',
          prompt: 'A gradient-descent step. What does this print?',
          code: `w = np.array([1.0, 2.0])
grad = np.array([0.5, -1.0])
lr = 0.1
print(w - lr * grad)`,
          answer: '[0.95 2.1 ]',
          options: [
            { text: '[0.95 2.1 ]' },
            { text: '[0.5 3. ]', why: 'The gradient is first scaled by the learning rate 0.1, giving [0.05, -0.1].' },
            { text: '[1.05 1.9 ]', why: 'The step subtracts: w − lr × grad.' },
          ],
          explain: 'Scale the gradient, then subtract: the update at the heart of training (unit F7).',
        },
        {
          id: 'f2-3-4',
          type: 'fill-blank',
          prompt: 'Halve every position.',
          code: `v = np.array([4, 10])
print(v ___ 0.5)`,
          answer: ['*'],
          distractors: [
            { text: '+', why: '`+ 0.5` adds a half to each position instead of halving it.' },
            { text: '@', why: '`@` needs two vectors or matrices, not a single number.' },
          ],
          expectOutput: '[2. 5.]',
          explain: 'Multiplying by 0.5 halves every position.',
        },
        {
          id: 'f2-3-5',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `v = np.array([3, -2])
print(-1 * v)`,
          answer: '[-3  2]',
          explain: 'Scaling by −1 flips the direction: every sign changes.',
        },
        {
          id: 'f2-3-6',
          type: 'mcq',
          prompt: 'What does multiplying a vector by 10 change?',
          options: [
            { text: 'Its size, not its direction' },
            { text: 'Its direction, not its size', why: 'Every position grows by the same factor, so the direction is unchanged.' },
            { text: 'Its number of positions', why: 'It still has the same length (number of positions); each value is 10 times bigger.' },
          ],
          answer: 0,
          explain: 'Scaling stretches; only a negative number flips.',
        },
        {
          id: 'f2-3-7',
          type: 'predict-output',
          prompt: 'Scale then add. What does this print?',
          code: `a = np.array([1, 0])
b = np.array([0, 1])
print(3 * a + 2 * b)`,
          answer: '[3 2]',
          options: [
            { text: '[3 2]' },
            { text: '[5 5]', why: '3 × [1, 0] is [3, 0] and 2 × [0, 1] is [0, 2]; their sum is [3, 2].' },
            { text: '[2 3]', why: 'a points along the first position, so its 3 lands there.' },
          ],
          explain: 'Any vector can be built by scaling and adding simpler ones.',
        },
        {
          id: 'f2-3-8',
          type: 'run-code',
          prompt: 'Set `step` to the gradient scaled by the learning rate.',
          before: `grad = np.array([2.0, -4.0])
lr = 0.25`,
          solution: 'step = lr * grad',
          tests: 'assert np.allclose(step, [0.5, -1.0]), f"0.25 × [2, -4] = [0.5, -1.0], got {step}"',
          placeholder: 'step = ...',
          explain: 'A number times a NumPy vector scales every position.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'f2-04',
      title: 'The dot product',
      summary: 'The dot product multiplies matching positions and adds them up: a weighted sum, one number.',
      card: {
        title: 'The dot product',
        text: 'The dot product multiplies matching positions and adds the results, giving one number. Read it as a weighted sum: quantities times prices is a bill, inputs times weights is a neuron. NumPy writes it `a @ b` or `np.dot(a, b)`.',
        code: `prices = np.array([3, 2, 5])
qty = np.array([2, 1, 0])
print(prices @ qty)`,
        output: '8',
      },
      exercises: [
        {
          id: 'f2-4-1',
          type: 'predict-output',
          prompt: 'Type the dot product.',
          code: `a = np.array([1, 2, 3])
b = np.array([4, 0, 1])
print(a @ b)`,
          answer: '7',
          typedWrong: [{ answer: '[4 0 3]', why: 'That is `a * b`, the products. The dot product also adds them: 4 + 0 + 3.' }],
          explain: '1×4 + 2×0 + 3×1 = 7.',
        },
        {
          id: 'f2-4-2',
          type: 'predict-output',
          prompt: '`*` versus `@`. What does this print?',
          code: `a = np.array([2, 3])
b = np.array([4, 5])
print(a * b, a @ b)`,
          answer: '[ 8 15] 23',
          options: [
            { text: '[ 8 15] 23' },
            { text: '23 [ 8 15]', why: '`a * b` (pairs multiplied) comes first, then `a @ b` (their sum).' },
            { text: '[ 8 15] [ 8 15]', why: '`@` on two vectors adds the products into one number.' },
          ],
          explain: 'The dot product is the element-wise product, summed.',
        },
        {
          id: 'f2-4-3',
          type: 'number-grid',
          prompt: 'A dot product is a 1-by-1 result here. Fill in `w @ x`.',
          inputs: [
            { name: 'w', value: [[2, 1, -1]] },
            { name: 'x', value: [[3], [4], [5]] },
          ],
          expr: 'w @ x',
          answer: [[5]],
          explain: '2×3 + 1×4 + (−1)×5 = 6 + 4 − 5 = 5.',
        },
        {
          id: 'f2-4-4',
          type: 'mcq',
          prompt: 'A neuron has weights [0.5, 2] and gets inputs [4, 1]. What does it compute first?',
          options: [
            { text: 'The weighted sum 0.5×4 + 2×1 = 4' },
            { text: 'The pairs [2, 2], kept separate', why: 'A neuron adds the weighted inputs into one number.' },
            { text: 'The sum of the weights, 2.5', why: 'The weights multiply the inputs before anything is added.' },
          ],
          answer: 0,
          explain: 'A neuron starts with a dot product of its weights and inputs.',
          check: 'assert np.array([0.5, 2]) @ np.array([4, 1]) == 4',
        },
        {
          id: 'f2-4-5',
          type: 'fill-blank',
          prompt: 'Write the dot product by hand.',
          code: `a = [1, 2, 3]
b = [4, 5, 6]
pairs = zip(a, b)
print(___(x * y for x, y in pairs))`,
          answer: ['sum'],
          distractors: [
            { text: 'max', why: '`max` keeps only the largest product (18), not their total.' },
            { text: 'list', why: '`list` keeps the products separate: [4, 10, 18].' },
          ],
          expectOutput: '32',
          explain: 'Multiply pairs, then sum: 4 + 10 + 18 = 32.',
        },
        {
          id: 'f2-4-6',
          type: 'predict-output',
          prompt: 'Perpendicular vectors. What does this print?',
          code: `a = np.array([1, 0])
b = np.array([0, 5])
print(a @ b)`,
          answer: '0',
          options: [
            { text: '0' },
            { text: '5', why: '1×0 + 0×5 = 0: every pair has a zero in it.' },
          ],
          explain: 'A dot product of 0 means the vectors share nothing in common direction.',
        },
        {
          id: 'f2-4-7',
          type: 'spot-bug',
          prompt: 'Which line makes the dot product impossible?',
          code: `w = np.array([0.2, 0.5, 0.3])
x = np.array([1.0, 2.0])
score = w @ x`,
          error: 'ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0, with gufunc signature (n?,k),(k,m?)->(n?,m?) (size 2 is different from 3)',
          answer: 1,
          raiseLine: 2,
          lineWhy: {
            '0': 'Three weights is fine on its own.',
            '2': 'Python raises here, but `@` is right; the inputs have one value too few.',
          },
          explain: 'Each weight needs an input: both vectors must have the same length.',
        },
        {
          id: 'f2-4-8',
          type: 'run-code',
          prompt: 'Set `bill` to the total: prices times quantities, added up.',
          before: `prices = np.array([4, 1, 3])
qty = np.array([2, 5, 1])`,
          solution: 'bill = prices @ qty',
          tests: 'assert bill == 16, f"4×2 + 1×5 + 3×1 = 16, got {bill}"',
          placeholder: 'bill = ...',
          explain: 'A bill is a dot product.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'f2-05',
      title: 'Length',
      summary: 'A vector\'s length is the square root of the sum of its squares; np.linalg.norm computes it.',
      card: {
        title: 'Length',
        text: 'A vector\'s length is the square root of the sum of its squared positions, Pythagoras in any number of dimensions. For [3, 4] that is √(9 + 16) = 5. NumPy computes it with `np.linalg.norm(v)`, which is the same as `np.sqrt(v @ v)`.',
        code: `v = np.array([3, 4])
print(np.linalg.norm(v))
print(np.sqrt(v @ v))`,
        output: '5.0\n5.0',
      },
      exercises: [
        {
          id: 'f2-5-1',
          type: 'predict-output',
          prompt: 'Type the length.',
          code: `v = np.array([6, 8])
print(np.linalg.norm(v))`,
          answer: '10.0',
          typedWrong: [{ answer: '14', why: 'That is 6 + 8. Length squares first: √(36 + 64) = 10.' }],
          explain: '√(36 + 64) = √100 = 10.',
        },
        {
          id: 'f2-5-2',
          type: 'predict-output',
          prompt: 'Three dimensions. What does this print?',
          code: `v = np.array([1, 2, 2])
print(np.linalg.norm(v))`,
          answer: '3.0',
          options: [
            { text: '3.0' },
            { text: '5.0', why: 'That is 1 + 2 + 2. Square first: 1 + 4 + 4 = 9, and √9 = 3.' },
            { text: '9.0', why: '9 is the sum of squares; the length is its square root.' },
          ],
          explain: 'Same rule in any number of dimensions.',
        },
        {
          id: 'f2-5-3',
          type: 'fill-blank',
          prompt: 'Compute the length by hand.',
          code: `v = [3, 4]
print(sum(x ___ 2 for x in v) ** 0.5)`,
          answer: ['**'],
          distractors: [
            { text: '*', why: '`x * 2` doubles each value instead of squaring it.' },
            { text: '+', why: '`x + 2` adds 2 to each value.' },
          ],
          expectOutput: '5.0',
          explain: 'Square each, sum, then square root (`** 0.5`).',
        },
        {
          id: 'f2-5-4',
          type: 'predict-output',
          prompt: 'Scaling changes the length. What does this print?',
          code: `v = np.array([3, 4])
print(np.linalg.norm(2 * v))`,
          answer: '10.0',
          options: [
            { text: '10.0' },
            { text: '5.0', why: 'Doubling every position doubles the length.' },
            { text: '20.0', why: 'The length doubles (5 to 10); it does not quadruple.' },
          ],
          explain: 'Scaling by k multiplies the length by k.',
        },
        {
          id: 'f2-5-5',
          type: 'predict-output',
          prompt: 'Distance between two points is the length of their difference. Type it.',
          code: `a = np.array([1, 1])
b = np.array([4, 5])
print(np.linalg.norm(b - a))`,
          answer: '5.0',
          explain: 'b − a = [3, 4], whose length is 5.',
        },
        {
          id: 'f2-5-6',
          type: 'mcq',
          prompt: 'Which vector is longest?',
          options: [
            { text: '[0, 5]' },
            { text: '[3, 3]', why: '√(9 + 9) ≈ 4.24, less than 5.' },
            { text: '[1, 4]', why: '√(1 + 16) ≈ 4.12, less than 5.' },
          ],
          answer: 0,
          explain: '[0, 5] has length 5; the others are about 4.2.',
          check: 'n = np.linalg.norm\nassert n([0, 5]) > n([3, 3]) > n([1, 4])',
        },
        {
          id: 'f2-5-7',
          type: 'spot-bug',
          prompt: 'Which line computes the wrong thing?',
          code: `v = np.array([3, 4])
length = np.sqrt(v.sum())
assert length == 5, length`,
          error: 'AssertionError: 2.6457513110645907',
          answer: 1,
          raiseLine: 2,
          lineWhy: {
            '0': 'The vector is fine.',
            '2': 'The check is right: [3, 4] has length 5.',
          },
          explain: 'Square before summing: `np.sqrt((v ** 2).sum())`, or `np.linalg.norm(v)`.',
        },
        {
          id: 'f2-5-8',
          type: 'run-code',
          prompt: 'Set `d` to the distance between points `a` and `b`.',
          before: `a = np.array([2, 3])
b = np.array([5, 7])`,
          solution: 'd = np.linalg.norm(b - a)',
          tests: 'assert abs(d - 5) < 1e-9, f"b - a is [3, 4], length 5; got {d}"',
          placeholder: 'd = ...',
          explain: 'Distance is the length of the difference.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'f2-06',
      title: 'Direction',
      summary: 'Dividing a vector by its length gives a unit vector: same direction, length 1.',
      card: {
        title: 'Direction',
        text: 'Dividing a vector by its own length gives a unit vector: the same direction with length 1. Two vectors that point the same way have the same unit vector, however long they are. This separates "which way" from "how much", which is what similarity measures want.',
        code: `v = np.array([3.0, 4.0])
u = v / np.linalg.norm(v)
print(u, np.linalg.norm(u))`,
        output: '[0.6 0.8] 1.0',
      },
      exercises: [
        {
          id: 'f2-6-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `v = np.array([0.0, 5.0])
print(v / np.linalg.norm(v))`,
          answer: '[0. 1.]',
          options: [
            { text: '[0. 1.]' },
            { text: '[0. 5.]', why: 'Dividing by the length (5) shrinks it to length 1.' },
            { text: '[0.  0.2]', why: 'Each position is divided by the length 5: 5 / 5 = 1.' },
          ],
          explain: 'Straight up, length 1.',
        },
        {
          id: 'f2-6-2',
          type: 'predict-output',
          prompt: 'Different lengths, same direction. What does this print?',
          code: `a = np.array([1.0, 2.0])
b = np.array([3.0, 6.0])
ua = a / np.linalg.norm(a)
ub = b / np.linalg.norm(b)
print(np.allclose(ua, ub))`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'b is 3 × a, so it points the same way; their unit vectors match.' },
          ],
          explain: 'Normalising removes size and keeps direction.',
        },
        {
          id: 'f2-6-3',
          type: 'fill-blank',
          prompt: 'Turn `v` into a unit vector.',
          code: `v = np.array([6.0, 8.0])
u = v / np.linalg.___(v)
print(u)`,
          answer: ['norm'],
          distractors: [
            { text: 'det', why: '`det` is for square matrices; a vector has no determinant.' },
            { text: 'inv', why: '`inv` inverts square matrices; it does not give a length.' },
          ],
          expectOutput: '[0.6 0.8]',
          explain: 'Divide by the length.',
        },
        {
          id: 'f2-6-4',
          type: 'mcq',
          prompt: 'Two documents use the same words in the same proportions, but one is ten times longer. After normalising their word-count vectors, what do you get?',
          options: [
            { text: 'The same unit vector for both' },
            { text: 'Unit vectors ten times apart', why: 'Unit vectors all have length 1; length differences are removed.' },
            { text: 'Different directions', why: 'Same proportions means same direction; only the size differed.' },
          ],
          answer: 0,
          explain: 'This is why similarity search compares directions, not raw counts.',
        },
        {
          id: 'f2-6-5',
          type: 'predict-output',
          prompt: 'Type what this prints, to 2 decimals.',
          code: `v = np.array([1.0, 1.0])
u = v / np.linalg.norm(v)
print(round(u[0], 2))`,
          answer: '0.71',
          explain: '1 / √2 ≈ 0.707: both positions shrink by the same factor.',
        },
        {
          id: 'f2-6-6',
          type: 'predict-output',
          prompt: 'Normalising the zero vector. What does this print?',
          code: `v = np.array([0.0, 0.0])
u = v / np.linalg.norm(v)
print(u)`,
          answer: '[nan nan]',
          options: [
            { text: '[nan nan]' },
            { text: '[0. 0.]', why: 'Its length is 0, and 0 / 0 is not a number, so NumPy gives nan.' },
            { text: '[1. 1.]', why: 'Nothing here makes length 1: 0 / 0 is undefined.' },
          ],
          explain: 'The zero vector has no direction. NumPy quietly gives nan (with a warning on most systems), and nan spreads through every later sum: check for zero length before dividing.',
        },
        {
          id: 'f2-6-7',
          type: 'predict-output',
          prompt: 'Normalise many vectors at once. What does this print?',
          code: `X = np.array([[3.0, 4.0],
              [0.0, 2.0]])
n = np.linalg.norm(X, axis=1,
                   keepdims=True)
print(X / n)`,
          answer: '[[0.6 0.8]\n [0.  1. ]]',
          options: [
            { text: '[[0.6 0.8]\n [0.  1. ]]' },
            { text: '[[3. 4.]\n [0. 2.]]', why: 'Each row is divided by its own length (5 and 2).' },
            { text: '[[0.6 0.8]\n [0.  0.4]]', why: 'Row 2 has length 2, so [0, 2] / 2 = [0, 1].' },
          ],
          explain: '`axis=1` gives one length per row; `keepdims` lets each row divide by its own.',
        },
        {
          id: 'f2-6-8',
          type: 'run-code',
          prompt: 'Set `u` to the unit vector of `v`.',
          before: 'v = np.array([5.0, 12.0])',
          solution: 'u = v / np.linalg.norm(v)',
          tests: [
            'assert np.allclose(u, [5 / 13, 12 / 13]), f"[5, 12] has length 13, so u = [5/13, 12/13]; got {u}"',
            'assert abs(np.linalg.norm(u) - 1) < 1e-9, "a unit vector has length 1"',
          ].join('\n'),
          placeholder: 'u = ...',
          explain: 'Divide by the length.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'f2-07',
      title: 'Cosine similarity',
      summary: 'Cosine similarity is the dot product of two unit vectors: 1 same direction, 0 unrelated, -1 opposite.',
      card: {
        title: 'Cosine similarity',
        text: 'Cosine similarity is the dot product of two vectors divided by both their lengths, which is the dot product of their unit vectors. It is 1 when they point the same way, 0 when unrelated, and −1 when opposite, whatever their sizes. Search over embeddings ranks items by exactly this number.',
        code: `def cos(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return (a @ b) / (na * nb)

a = np.array([1.0, 2.0])
b = np.array([2.0, 4.0])
print(round(cos(a, b), 3))`,
        output: '1.0',
      },
      exercises: [
        {
          id: 'f2-7-1',
          type: 'predict-output',
          prompt: 'Perpendicular vectors. What does this print?',
          code: `def cos(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return (a @ b) / (na * nb)

a = np.array([1.0, 0.0])
b = np.array([0.0, 3.0])
print(cos(a, b))`,
          answer: '0.0',
          options: [
            { text: '0.0' },
            { text: '1.0', why: 'The dot product is 0, so the cosine is 0: unrelated directions.' },
            { text: '3.0', why: 'Cosine similarity is always between −1 and 1.' },
          ],
          explain: 'No shared direction at all.',
        },
        {
          id: 'f2-7-2',
          type: 'predict-output',
          prompt: 'Opposite directions. Type what this prints.',
          code: `def cos(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return (a @ b) / (na * nb)

a = np.array([2.0, 1.0])
print(round(cos(a, -3 * a), 3))`,
          answer: '-1.0',
          explain: 'Scaling by −3 flips the direction; the size does not matter.',
        },
        {
          id: 'f2-7-3',
          type: 'mcq',
          prompt: 'Why use cosine similarity rather than the plain dot product to compare documents?',
          options: [
            { text: 'Long documents stop winning by size' },
            { text: 'It is much faster to compute', why: 'It does more work (two lengths). The point is ignoring size.' },
            { text: 'The dot product cannot be negative', why: 'Dot products can be negative; that is not the reason.' },
          ],
          answer: 0,
          explain: 'With raw dot products, longer vectors score higher just for being long.',
        },
        {
          id: 'f2-7-4',
          type: 'predict-output',
          prompt: 'Which item is closest to the query? What does this print?',
          code: `def cos(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return (a @ b) / (na * nb)

q = np.array([1.0, 1.0])
items = {"x": np.array([1.0, 0.0]),
         "y": np.array([2.0, 2.1]),
         "z": np.array([0.0, 5.0])}
best = max(items, key=lambda k:
           cos(q, items[k]))
print(best)`,
          answer: 'y',
          options: [
            { text: 'y' },
            { text: 'z', why: 'z is longest, but cosine ignores length; z points straight up, away from [1, 1].' },
            { text: 'x', why: 'x points along the first axis only; y points almost exactly like q.' },
          ],
          explain: 'Nearest by direction: the core of similarity search.',
        },
        {
          id: 'f2-7-5',
          type: 'fill-blank',
          prompt: 'Complete cosine similarity.',
          code: `a = np.array([3.0, 4.0])
b = np.array([4.0, 3.0])
na = np.linalg.norm(a)
nb = np.linalg.norm(b)
print((a @ b) / (na ___ nb))`,
          answer: ['*'],
          distractors: [
            { text: '+', why: 'Divide by the product of the lengths, not their sum.' },
            { text: '@', why: 'The lengths are plain numbers; multiply them with `*`.' },
          ],
          expectOutput: '0.96',
          explain: '24 / (5 × 5) = 0.96: very similar directions.',
        },
        {
          id: 'f2-7-6',
          type: 'predict-output',
          prompt: 'With unit vectors, cosine is just the dot product. What does this print?',
          code: `a = np.array([0.6, 0.8])
b = np.array([0.8, 0.6])
print(round(a @ b, 2))`,
          answer: '0.96',
          options: [
            { text: '0.96' },
            { text: '1.4', why: 'That adds the positions. The dot product is 0.48 + 0.48.' },
            { text: '0.48', why: 'Both products count: 0.6×0.8 + 0.8×0.6.' },
          ],
          explain: 'Normalise once, then every comparison is a cheap dot product.',
        },
        {
          id: 'f2-7-7',
          type: 'mcq',
          prompt: 'Cosine similarity between two embeddings is 0.92. What does it suggest?',
          options: [
            { text: 'They point in nearly the same direction' },
            { text: 'They are about 92% the same length', why: 'Cosine ignores length; it measures direction only.' },
            { text: 'They differ in about 8% of positions', why: 'It is not a count of positions; it is about the angle between them.' },
          ],
          answer: 0,
          explain: 'For embeddings, close direction usually means close meaning.',
        },
        {
          id: 'f2-7-8',
          type: 'run-code',
          prompt: 'Set `sim` to the cosine similarity of `a` and `b`.',
          before: `a = np.array([1.0, 2.0, 2.0])
b = np.array([2.0, 0.0, 1.0])
norm = np.linalg.norm`,
          solution: 'sim = (a @ b) / (norm(a) * norm(b))',
          tests: 'assert abs(sim - 4 / (3 * 5 ** 0.5)) < 1e-9, f"a·b = 4, |a| = 3, |b| = √5; got {sim}"',
          placeholder: 'sim = ...',
          explain: 'Dot product over the product of the lengths.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'f2-08',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can add, scale, dot, measure and compare vectors, and say what each means.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each one, ask: is the answer a vector (one number per position) or a single number, and what does it mean?',
      },
      exercises: [
        {
          id: 'f2-8-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a = np.array([1, 2])
b = np.array([3, 4])
print(a + b, a @ b)`,
          answer: '[4 6] 11',
          options: [
            { text: '[4 6] 11' },
            { text: '[3 8] 11', why: '`a + b` adds pairs: 1+3, 2+4.' },
            { text: '[4 6] [3 8]', why: '`a @ b` is a single number: 3 + 8.' },
          ],
          explain: 'Adding gives a vector; the dot product gives one number.',
        },
        {
          id: 'f2-8-2',
          type: 'number-grid',
          prompt: 'Fill in `2 * a - b`.',
          inputs: [
            { name: 'a', value: [[3, 1, 0]] },
            { name: 'b', value: [[1, 1, 4]] },
          ],
          expr: '2 * a - b',
          answer: [[5, 1, -4]],
          explain: '2a = [6, 2, 0]; minus b gives [5, 1, −4].',
        },
        {
          id: 'f2-8-3',
          type: 'predict-output',
          prompt: 'Type the length.',
          code: `v = np.array([2, 3, 6])
print(np.linalg.norm(v))`,
          answer: '7.0',
          explain: '4 + 9 + 36 = 49, and √49 = 7.',
        },
        {
          id: 'f2-8-4',
          type: 'mcq',
          prompt: 'You want "how similar in meaning" between two word embeddings. Which measure?',
          options: [
            { text: 'Cosine similarity' },
            { text: 'Sum of the two vectors', why: 'A sum is a vector, not a similarity score.' },
            { text: 'Length of the first vector', why: 'Length says nothing about the other vector.' },
          ],
          answer: 0,
          explain: 'Direction carries meaning; cosine compares direction.',
        },
        {
          id: 'f2-8-5',
          type: 'fill-blank',
          prompt: 'A neuron\'s weighted sum.',
          code: `w = np.array([0.5, -1.0, 2.0])
x = np.array([2.0, 1.0, 0.5])
print(w ___ x)`,
          answer: ['@'],
          distractors: [
            { text: '*', why: '`*` gives the three products separately: [1, -1, 1].' },
            { text: '+', why: '`+` adds positions; there is no weighting.' },
          ],
          expectOutput: '1.0',
          explain: '1 − 1 + 1 = 1: weights times inputs, summed.',
        },
        {
          id: 'f2-8-6',
          type: 'spot-bug',
          prompt: 'Which line is wrong for vector maths?',
          code: `a = [1, 2, 3]
b = [4, 5, 6]
total = a + b
assert total == [5, 7, 9], total`,
          error: 'AssertionError: [1, 2, 3, 4, 5, 6]',
          answer: 2,
          raiseLine: 3,
          lineWhy: {
            '0': 'A list of numbers is fine as data.',
            '1': 'Same length: fine.',
            '3': 'The check is right: the vector sum is [5, 7, 9].',
          },
          explain: 'Plain lists join with `+`. Use `np.array(a) + np.array(b)`.',
        },
        {
          id: 'f2-8-7',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `def cos(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return (a @ b) / (na * nb)

a = np.array([1.0, 1.0])
print(round(cos(a, 5 * a), 3),
      round(cos(a, -a), 3))`,
          answer: '1.0 -1.0',
          options: [
            { text: '1.0 -1.0' },
            { text: '5.0 -1.0', why: 'Cosine ignores length: 5a points exactly like a.' },
            { text: '1.0 1.0', why: '−a points the opposite way, giving −1.' },
          ],
          explain: 'Same direction: 1; opposite: −1; size never matters.',
        },
        {
          id: 'f2-8-8',
          type: 'predict-output',
          prompt: 'One gradient step. What does this print?',
          code: `w = np.array([2.0, -1.0])
g = np.array([1.0, -2.0])
print(w - 0.5 * g)`,
          answer: '[1.5 0. ]',
          options: [
            { text: '[1.5 0. ]' },
            { text: '[2.5 -2. ]', why: 'The step subtracts: w − 0.5 × g.' },
            { text: '[1.  -3. ]', why: 'The gradient is scaled by 0.5 first: [0.5, -1].' },
          ],
          explain: 'Scale, then subtract.',
        },
        {
          id: 'f2-8-9',
          type: 'match-pairs',
          prompt: 'Match each operation to its result.',
          pairs: [
            { left: 'a + b', right: 'a vector, position by position', why: 'Each position adds to its partner.' },
            { left: '3 * a', right: 'a longer vector, same direction', why: 'Scaling stretches.' },
            { left: 'a @ b', right: 'one number, a weighted sum', why: 'Products added up.' },
            { left: 'cosine(a, b)', right: 'a number from -1 to 1', why: 'Direction only.' },
          ],
          explain: 'Know what kind of thing each operation returns.',
        },
        {
          id: 'f2-8-10',
          type: 'run-code',
          prompt: 'Set `best` to the name of the item most similar in direction to `q`.',
          before: `def cos(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return (a @ b) / (na * nb)

q = np.array([1.0, 0.0])
items = {
    "up": np.array([0.0, 1.0]),
    "right": np.array([3.0, 0.2]),
}`,
          solution: 'best = max(items, key=lambda k:\n           cos(q, items[k]))',
          tests: 'assert best == "right", f"[3, 0.2] points nearly along [1, 0]; got {best!r}"',
          maxLines: 2,
          placeholder: 'best = max(items, key=...)',
          explain: 'Rank by cosine and take the best: similarity search in one line.',
        },
      ],
    },
  ],
  labs: f2Labs,
  library: f2Library,
};
