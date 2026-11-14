import { f3Labs } from '../labs/f3';
import { f3Library } from '../library/f3';
import type { Unit } from '../schema';

const MATMUL_ERR =
  'ValueError: matmul: Input operand 1 has a mismatch in its core dimension 0, with gufunc signature (n?,k),(k,m?)->(n?,m?)';

export const f3: Unit = {
  id: 'F3',
  track: 'foundations',
  title: 'Matrices and matrix multiplication',
  blurb: 'Two different operations share the word "multiply". Learn when each one is used.',
  prelude: 'import numpy as np',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'f3-01',
      title: 'Cell by cell',
      summary: 'Element-wise multiply (`*`) pairs up cells in the same position and multiplies each pair.',
      card: {
        title: 'Cell by cell',
        text: 'Element-wise multiply pairs up the cells in the same position and multiplies each pair. It is the multiplication you already know, done once per cell. In NumPy it is written `A * B`, and every cell needs a partner, so here both arrays have the same shape.',
        figure: { kind: 'compare', A: [[1, 2], [3, 4]], B: [[5, 6], [7, 8]], panels: ['elementwise'] },
      },
      exercises: [
        {
          id: 'f3-1-1',
          type: 'number-grid',
          prompt: 'Fill in `A * B`, cell by cell.',
          inputs: [
            { name: 'A', value: [[1, 2], [3, 4]] },
            { name: 'B', value: [[2, 0], [1, 3]] },
          ],
          expr: 'A * B',
          answer: [[2, 0], [3, 12]],
          explain: 'Each cell is its two partners multiplied: 1×2, 2×0, 3×1, 4×3.',
        },
        {
          id: 'f3-1-2',
          type: 'figure',
          prompt: 'Tap the cell of `A * B` that came from 4 × 8.',
          figure: {
            kind: 'compare',
            A: [[1, 2], [3, 4]],
            B: [[5, 6], [7, 8]],
            panels: ['elementwise'],
            goal: { panel: 'elementwise', cell: [1, 1] },
          },
          explain: '4 and 8 both sit bottom-right, so their product lands bottom-right.',
        },
        {
          id: 'f3-1-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a = np.array([2, 3, 4])
b = np.array([10, 0, 1])
print(a * b)`,
          answer: '[20  0  4]',
          options: [
            { text: '[20  0  4]' },
            { text: '24', why: '24 is what you get if you also add the products up. `*` keeps every cell separate, so you get three numbers.' },
            { text: '[12  3  5]', why: 'Those are the sums 2+10, 3+0, 4+1. `*` multiplies each pair.' },
          ],
          explain: '2×10 = 20, 3×0 = 0, 4×1 = 4, kept as three separate numbers.',
        },
        {
          id: 'f3-1-4',
          type: 'predict-shape',
          prompt: 'What is the shape of `C`?',
          code: `A = np.ones((2, 3))
B = np.ones((2, 3))
C = A * B`,
          target: 'C',
          answer: '(2, 3)',
          options: [
            { text: '(2, 3)' },
            { text: '(3, 2)', why: 'Element-wise multiply never flips anything: each cell stays where it is, so the shape stays (2, 3).' },
            { text: '(2, 2)', why: 'That is what the other kind of multiply (`@`) does with some shapes. `*` keeps the shape of its inputs.' },
            { text: 'error', why: 'Both arrays are (2, 3), so every cell has a partner. Nothing is missing.' },
          ],
          explain: 'Same shapes in, same shape out: one result per cell.',
        },
        {
          id: 'f3-1-5',
          type: 'predict-shape',
          prompt: 'What happens here?',
          code: `A = np.ones((2, 3))
B = np.ones((3, 2))
C = A * B`,
          target: 'C',
          answer: 'error',
          options: [
            { text: 'error' },
            { text: '(2, 2)', why: '(2, 2) is what `A @ B` would give. `*` needs a partner for every cell, and these shapes do not line up.' },
            { text: '(2, 3)', why: 'B has 3 rows and 2 columns, so most cells of A have no partner in the same position.' },
            { text: '(3, 3)', why: 'No rule makes (3, 3) here. With mismatched shapes, `*` cannot pair the cells up at all.' },
          ],
          explain: 'A is 2 by 3 and B is 3 by 2: the cells do not line up, so NumPy raises a ValueError.',
        },
        {
          id: 'f3-1-6',
          type: 'fill-blank',
          prompt: 'Each item has a price and a quantity. Get the cost of each line on the receipt.',
          code: `price = np.array([3, 5, 2])
qty = np.array([2, 1, 4])
cost = price ___ qty
print(cost)`,
          answer: ['*'],
          distractors: [
            { text: '+', why: '`+` adds price and quantity, giving [5 6 6], which means nothing on a receipt.' },
            { text: '@', why: '`@` multiplies and then adds everything into one number, the whole bill (19). You want one cost per line.' },
          ],
          expectOutput: '[6 5 8]',
          explain: 'Each line cost is its own price times its own quantity: element-wise `*`.',
        },
        {
          id: 'f3-1-7',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `x = np.array([1, 2, 3])
print(x * x)`,
          answer: '[1 4 9]',
          typedWrong: [
            { answer: '14', why: '14 is 1 + 4 + 9: you added the squares. `*` keeps each square in its own cell.' },
            { answer: '[2 4 6]', why: 'That is x + x. Multiplying each cell by itself squares it: 1, 4, 9.' },
          ],
          explain: 'Each cell is multiplied by its partner, which here is itself: 1×1, 2×2, 3×3.',
        },
        {
          id: 'f3-1-8',
          type: 'spot-bug',
          prompt: 'Which line raises this error?',
          code: `a = np.array([1, 2, 3])
b = np.array([4, 5])
c = a * b
print(c)`,
          error: 'ValueError: operands could not be broadcast together with shapes (3,) (2,)',
          answer: 2,
          lineWhy: {
            '0': 'Creating `a` is fine. Python only complains when the arrays are combined.',
            '1': '`b` is too short, which is the cause, but making a short array is allowed. The error appears where the two meet.',
            '3': 'Python never gets here: the program stops at the line before.',
          },
          explain: 'Line 3 tries to pair 3 cells with 2. The fix belongs on line 2, but the error is raised on line 3.',
        },
        {
          id: 'f3-1-9',
          type: 'match-pairs',
          prompt: 'Match each expression to its result.',
          setup: `a = np.array([2, 3])
b = np.array([4, 5])`,
          pairs: [
            { left: 'a * b', right: '[8, 15]', why: 'Cell by cell: 2×4 and 3×5.' },
            { left: 'a + b', right: '[6, 8]', why: 'Cell by cell, but adding: 2+4 and 3+5.' },
            { left: 'a * 2', right: '[4, 6]', why: 'One number multiplies every cell: 2×2 and 3×2.' },
            { left: 'b * b', right: '[16, 25]', why: 'Each cell of b times itself: 4×4 and 5×5.' },
          ],
          verify: 'equal',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'f3-02',
      title: 'A different question',
      summary: 'The dot product multiplies pairs and adds them up into one number, like a total bill.',
      card: {
        title: 'A different question',
        text: 'The dot product asks a different question: multiply each pair, then add everything up into one number. Prices times quantities, added up, is the total bill. In NumPy, `a @ b` on two lists of numbers gives that one number.',
        code: `price = np.array([3, 5, 2])
qty = np.array([2, 1, 4])
print(price @ qty)`,
        output: '19',
      },
      exercises: [
        {
          id: 'f3-2-1',
          type: 'mcq',
          prompt: 'Coffee costs 3 and cake costs 4. You buy 2 coffees and 1 cake. Which calculation is the total bill?',
          options: [
            { text: '3×2 + 4×1 = 10' },
            { text: '(3+4) × (2+1) = 21', why: 'This charges every item at every quantity, as if you bought 3 coffees and 3 cakes. Pair each price with its own quantity first.' },
            { text: '[3×2, 4×1] = [6, 4]', why: 'These are the two line costs (element-wise). The bill adds them into one number.' },
          ],
          answer: 0,
          check: 'assert np.array([3, 4]) @ np.array([2, 1]) == 10',
          explain: 'Pair, multiply, add: that is the dot product.',
        },
        {
          id: 'f3-2-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(a @ b)`,
          answer: '32',
          options: [
            { text: '32' },
            { text: '[ 4 10 18]', why: 'Those are the pair products, which is what `a * b` prints. `@` also adds them: 4 + 10 + 18.' },
            { text: '21', why: '21 is all six numbers added. The dot product multiplies pairs first: 1×4 + 2×5 + 3×6.' },
          ],
          explain: '1×4 + 2×5 + 3×6 = 4 + 10 + 18 = 32.',
        },
        {
          id: 'f3-2-3',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `w = np.array([2, 0, 1])
x = np.array([5, 9, 3])
print(w @ x)`,
          answer: '13',
          typedWrong: [
            { answer: '[10 0 3]', why: 'Those are the pair products (`w * x`). `@` adds them into one number.' },
            { answer: '17', why: '17 is 5 + 9 + 3. The weights matter: 2×5 + 0×9 + 1×3.' },
          ],
          explain: 'Weights 2, 0, 1 mean "twice the first, ignore the second, once the third": 10 + 0 + 3 = 13.',
        },
        {
          id: 'f3-2-4',
          type: 'run-code',
          prompt: 'Write one line that stores the total bill in `total`.',
          before: `price = np.array([4, 2, 5])
qty = np.array([1, 3, 2])`,
          solution: 'total = price @ qty',
          tests: `assert np.ndim(total) == 0, "total should be one number, not an array"
assert total == 20, "total should be 4*1 + 2*3 + 5*2 = 20"`,
          placeholder: 'total = ',
          explain: '`price @ qty` multiplies each price by its quantity and adds: 4 + 6 + 10 = 20.',
        },
        {
          id: 'f3-2-5',
          type: 'fill-blank',
          prompt: 'Finish this dot product written as a loop.',
          code: `a = [1, 2, 3]
b = [4, 5, 6]
total = 0
for i in range(3):
    total ___ a[i] ___ b[i]
print(total)`,
          answer: ['+=', '*'],
          distractors: [
            { text: '=', why: '`=` overwrites total each time, so you would end with only the last product, 18.' },
            { text: '+', why: 'In the first gap `+` computes a sum but never stores it. In the second it adds a pair instead of multiplying it.' },
          ],
          expectOutput: '32',
          explain: 'Multiply each pair (`*`), and keep a running total (`+=`).',
        },
        {
          id: 'f3-2-6',
          type: 'match-pairs',
          prompt: 'Match each expression to its result.',
          setup: `a = np.array([1, 2])
b = np.array([3, 4])`,
          pairs: [
            { left: 'a @ b', right: '11', why: 'Pairs multiplied and added: 1×3 + 2×4.' },
            { left: 'a * b', right: '[3, 8]', why: 'Pairs multiplied, kept separate: 1×3 and 2×4.' },
            { left: 'a + b', right: '[4, 6]', why: 'Pairs added, kept separate.' },
            { left: 'b @ b', right: '25', why: '3×3 + 4×4 = 9 + 16.' },
          ],
          verify: 'equal',
        },
        {
          id: 'f3-2-7',
          type: 'predict-output',
          prompt: 'A dot product is "multiply cell by cell, then add up". What does this print?',
          code: `w = np.array([1, 2, 3])
x = np.array([4, 5, 6])
print(w @ x == (w * x).sum())`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: '`(w * x).sum()` multiplies the pairs, then adds them up. That is exactly what `@` does, so both are 32.' },
          ],
          explain: 'Both sides are 4 + 10 + 18 = 32.',
        },
        {
          id: 'f3-2-8',
          type: 'mcq',
          prompt: 'A film score is 2×action + 1×comedy + 3×drama. A film rates action 4, comedy 1, drama 2. What is its score?',
          options: [
            { text: '15' },
            { text: '[8 1 6]', why: 'Those are the three weighted parts. The score adds them into one number.' },
            { text: '7', why: '7 adds the ratings and ignores the weights. Each rating is multiplied by its weight first.' },
          ],
          answer: 0,
          check: 'assert np.array([2, 1, 3]) @ np.array([4, 1, 2]) == 15',
          explain: '2×4 + 1×1 + 3×2 = 8 + 1 + 6 = 15. A weighted score is a dot product.',
        },
        {
          id: 'f3-2-9',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `a = np.array([3, 1])
print(a @ a)`,
          answer: '10',
          typedWrong: [
            { answer: '[9 1]', why: 'That is `a * a`. `@` also adds: 9 + 1.' },
            { answer: '4', why: '4 is 3 + 1. Each number is multiplied by its partner (itself) first: 9 + 1.' },
          ],
          explain: '3×3 + 1×1 = 10.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'f3-03',
      title: 'Many scores at once',
      summary: 'A matrix times a vector is one dot product per row: several scores at once.',
      card: {
        title: 'Many scores at once',
        text: 'Put several rows of weights in a matrix and multiply by one vector: you get one dot product per row. Two shops with different prices and one shopping list give two bills.',
        code: `prices = np.array([[3, 5],  # shop A
                   [4, 4]]) # shop B
qty = np.array([2, 1])
print(prices @ qty)`,
        output: '[11 12]',
      },
      exercises: [
        {
          id: 'f3-3-1',
          type: 'number-grid',
          prompt: 'Fill in `M @ v`: one dot product per row of M.',
          inputs: [
            { name: 'M', value: [[1, 2], [3, 4]] },
            { name: 'v', value: [[5], [6]] },
          ],
          expr: 'M @ v',
          answer: [[17], [39]],
          explain: 'Row 1: 1×5 + 2×6 = 17. Row 2: 3×5 + 4×6 = 39.',
        },
        {
          id: 'f3-3-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `W = np.array([[1, 0],
              [0, 2]])
x = np.array([3, 4])
print(W @ x)`,
          answer: '[3 8]',
          options: [
            { text: '[3 8]' },
            { text: '11', why: 'One number would need one row of weights. W has two rows, so you get two scores.' },
            { text: '[[3 0]\n [0 8]]', why: 'That keeps the products in a grid. `@` adds along each row, so each row becomes one number.' },
          ],
          explain: 'Row 1: 1×3 + 0×4 = 3. Row 2: 0×3 + 2×4 = 8.',
        },
        {
          id: 'f3-3-3',
          type: 'predict-shape',
          prompt: 'What is the shape of `y`?',
          code: `W = np.ones((4, 3))
x = np.ones(3)
y = W @ x`,
          target: 'y',
          answer: '(4,)',
          options: [
            { text: '(4,)' },
            { text: '(3,)', why: 'Each row of W gives one score, and W has 4 rows, so there are 4 scores, not 3.' },
            { text: '(4, 3)', why: 'Each row collapses to one number (its dot product with x), so the 3 disappears.' },
            { text: 'error', why: 'Each row of W has 3 numbers and x has 3 numbers, so every dot product works.' },
          ],
          explain: '4 rows, so 4 dot products. `(4,)` is how Python writes a 1-D shape of length 4.',
        },
        {
          id: 'f3-3-4',
          type: 'mcq',
          prompt: '`scores` holds 3 students × 2 tests, shape (3, 2). `w = [0.4, 0.6]` weights the tests. How many numbers does `scores @ w` give?',
          options: [
            { text: '3, one per student' },
            { text: '2, one per test', why: 'Each row (a student) is dotted with w, so you get one number per student, not per test.' },
            { text: '6, one per score', why: '6 would be keeping every product separately (element-wise). `@` adds each row up.' },
            { text: '1, the class total', why: 'One number would need a single row. With 3 rows you get 3 weighted totals.' },
          ],
          answer: 0,
          check: 'assert (np.ones((3, 2)) @ np.array([0.4, 0.6])).shape == (3,)',
          explain: 'One dot product per row: one weighted total per student.',
        },
        {
          id: 'f3-3-5',
          type: 'fill-blank',
          prompt: 'Build `W @ x` one row at a time. Both prints should match.',
          code: `W = np.array([[1, 2],
              [3, 4]])
x = np.array([1, 1])
y = np.array([W[0] ___ x,
              W[1] ___ x])
print(y)
print(W @ x)`,
          answer: ['@', '@'],
          distractors: [
            { text: '*', why: '`*` would keep the row as two separate products. Each row needs to become one score, so multiply and add with `@`.' },
            { text: '+', why: '`+` adds the row and x cell by cell. A score multiplies pairs and adds them.' },
          ],
          expectOutput: '[3 7]\n[3 7]',
          explain: '`W[0]` is the first row. Row 1 dotted with x is 3, row 2 is 7: exactly `W @ x`.',
        },
        {
          id: 'f3-3-6',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `M = np.array([[2, 1],
              [0, 3]])
v = np.array([1, 2])
print(M @ v)`,
          answer: '[4 6]',
          typedWrong: [
            { answer: '10', why: 'You added all the products together. Each row gives its own score, so there are two numbers.' },
            { answer: '[2 6]', why: 'That uses only the diagonal (2×1 and 3×2). Each row uses every number in it: 2×1 + 1×2 = 4.' },
          ],
          explain: 'Row 1: 2×1 + 1×2 = 4. Row 2: 0×1 + 3×2 = 6.',
        },
        {
          id: 'f3-3-7',
          type: 'order-lines',
          prompt: 'Put the lines in order so the loop computes `W @ x`, one row at a time.',
          lines: [
            { text: 'W = np.array([[1, 2], [3, 4]])', fixed: true },
            { text: 'x = np.array([5, 6])', fixed: true },
            { text: 'y = []' },
            { text: 'for row in W:' },
            { text: '    y.append(row @ x)' },
            { text: 'print(np.array(y))' },
          ],
          expectOutput: '[17 39]',
          explain: 'Start with an empty list, loop over the rows, add one score per row inside the loop, and print once the loop is done.',
        },
        {
          id: 'f3-3-8',
          type: 'match-pairs',
          prompt: 'Match each product to its shape.',
          setup: `W = np.ones((2, 3))
V = np.ones((5, 3))
A = np.ones((4, 2))
x = np.ones(3)
u = np.ones(2)`,
          pairs: [
            { left: 'W @ x', right: '(2,)', why: 'W has 2 rows, so 2 scores.' },
            { left: 'V @ x', right: '(5,)', why: 'V has 5 rows, so 5 scores.' },
            { left: 'A @ u', right: '(4,)', why: 'A has 4 rows, so 4 scores.' },
            { left: 'x * x', right: '(3,)', why: 'Element-wise keeps the shape of x: 3 cells.' },
          ],
          verify: 'shape',
        },
        {
          id: 'f3-3-9',
          type: 'spot-bug',
          prompt: 'Which line raises this error?',
          code: `W = np.array([[1, 2, 3],
              [4, 5, 6]])
x = np.array([1, 2])
y = W @ x
print(y)`,
          error: `${MATMUL_ERR} (size 2 is different from 3)`,
          answer: 3,
          lineWhy: {
            '0': 'This starts defining W, which is a valid 2 × 3 matrix.',
            '1': 'This is the second row of W. Nothing is computed yet.',
            '2': 'x is the cause (it has 2 numbers, the rows have 3), but creating it is allowed.',
            '4': 'Python never gets here: the program stops at the line before.',
          },
          explain: 'Each row of W has 3 weights but x has 2 values. The mismatch is detected when `W @ x` runs.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'f3-04',
      title: 'Row meets column',
      summary: 'In `A @ B`, cell (i, j) is row i of A dotted with column j of B.',
      card: {
        title: 'Row meets column',
        text: 'To multiply two matrices, cell (i, j) of the result is row i of the left matrix dotted with column j of the right one. Every cell is its own little bill. Pick a cell below and step through it.',
        figure: { kind: 'stepper', A: [[1, 2], [3, 4]], B: [[5, 6], [7, 8]] },
      },
      exercises: [
        {
          id: 'f3-4-1',
          type: 'figure',
          prompt: 'Pick the top-right cell of the result and step through until its value appears.',
          figure: { kind: 'stepper', A: [[1, 2], [3, 4]], B: [[5, 6], [7, 8]], goal: { cell: [0, 1] } },
          explain: 'Top-right is row 1 of A with column 2 of B: 1×6 + 2×8 = 22.',
        },
        {
          id: 'f3-4-2',
          type: 'figure',
          prompt: 'Tap the cell of `A @ B` that is built from row 2 of A and column 1 of B.',
          figure: {
            kind: 'compare',
            A: [[2, 1], [0, 3]],
            B: [[1, 4], [2, 1]],
            panels: ['matmul'],
            goal: { panel: 'matmul', cell: [1, 0] },
          },
          explain: 'Row number picks the result row, column number picks the result column: row 2, column 1 is bottom-left.',
        },
        {
          id: 'f3-4-3',
          type: 'predict-output',
          prompt: 'B is special: ones on the diagonal, zeros elsewhere. What does this print?',
          code: `A = np.array([[1, 2],
              [3, 4]])
B = np.array([[1, 0],
              [0, 1]])
print(A @ B)`,
          answer: '[[1 2]\n [3 4]]',
          options: [
            { text: '[[1 2]\n [3 4]]' },
            { text: '[[1 0]\n [0 4]]', why: 'That is `A * B`: cell by cell, the zeros wipe out two cells. `@` dots rows with columns instead.' },
            { text: '[[2 2]\n [3 5]]', why: 'That is `A + B`. Matrix multiply dots each row of A with each column of B.' },
          ],
          explain: 'Row 1 · column 1 = 1×1 + 2×0 = 1, row 1 · column 2 = 1×0 + 2×1 = 2, and so on: A comes back unchanged.',
        },
        {
          id: 'f3-4-4',
          type: 'number-grid',
          prompt: 'Fill in `A @ B`. Each cell: row of A dotted with column of B.',
          inputs: [
            { name: 'A', value: [[2, 1], [0, 1]] },
            { name: 'B', value: [[1, 3], [2, 1]] },
          ],
          expr: 'A @ B',
          answer: [[4, 7], [2, 1]],
          explain: 'Top-left: 2×1 + 1×2 = 4. Top-right: 2×3 + 1×1 = 7. Bottom-left: 0×1 + 1×2 = 2. Bottom-right: 0×3 + 1×1 = 1.',
        },
        {
          id: 'f3-4-5',
          type: 'predict-output',
          prompt: '`C[0, 0]` is the top-left cell. Type what this prints.',
          code: `A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])
C = A @ B
print(C[0, 0])`,
          answer: '19',
          typedWrong: [
            { answer: '5', why: '1×5 is the element-wise top-left. With `@` the top-left uses all of row 1 and column 1: 1×5 + 2×7.' },
            { answer: '17', why: 'You used row 1 of B (5, 6). Matrix multiply uses a column of B: 5 and 7.' },
          ],
          explain: 'Row 1 of A is (1, 2), column 1 of B is (5, 7): 1×5 + 2×7 = 19.',
        },
        {
          id: 'f3-4-6',
          type: 'fill-blank',
          prompt: 'Cell (row 2, column 1) of `A @ B` is row 2 of A dotted with column 1 of B. Fill in column 1.',
          code: `B = np.array([[5, 6],
              [7, 8]])
row = np.array([3, 4])
col = np.array([___, ___])
print(row @ col)`,
          answer: ['5', '7'],
          distractors: [
            { text: '6', why: '6 is in column 2 of B. Column 1 is the left column: 5 and 7.' },
            { text: '8', why: '8 is in column 2 of B. Column 1 is the left column: 5 and 7.' },
          ],
          expectOutput: '43',
          explain: 'A column reads top to bottom: 5 then 7. So 3×5 + 4×7 = 43.',
        },
        {
          id: 'f3-4-7',
          type: 'predict-shape',
          prompt: 'What is the shape of `C`?',
          code: `A = np.ones((2, 3))
B = np.ones((3, 2))
C = A @ B`,
          target: 'C',
          answer: '(2, 2)',
          options: [
            { text: '(2, 2)' },
            { text: '(3, 3)', why: '(3, 3) is `B @ A`. Here A comes first, so the result has A\'s 2 rows and B\'s 2 columns.' },
            { text: '(2, 3)', why: 'Each row of A is used once per column of B. B has 2 columns, so the result has 2 columns.' },
            { text: 'error', why: 'Rows of A have 3 numbers and columns of B have 3 numbers, so every dot product works.' },
          ],
          explain: 'One result cell per (row of A, column of B): 2 rows × 2 columns.',
        },
        {
          id: 'f3-4-8',
          type: 'match-pairs',
          prompt: 'B swaps things around. Match each expression to its result.',
          setup: `A = np.array([[1, 2], [3, 4]])
B = np.array([[0, 1], [1, 0]])`,
          pairs: [
            { left: 'A @ B', right: '[[2, 1], [4, 3]]', why: 'Each row of A dotted with B\'s columns: the two columns of A swap.' },
            { left: 'B @ A', right: '[[3, 4], [1, 2]]', why: 'With B on the left, its rows pick rows of A: the two rows swap.' },
            { left: 'A * B', right: '[[0, 2], [3, 0]]', why: 'Cell by cell: the zeros in B wipe out two cells.' },
            { left: 'A + B', right: '[[1, 3], [4, 4]]', why: 'Cell by cell, adding.' },
          ],
          verify: 'equal',
        },
        {
          id: 'f3-4-9',
          type: 'predict-output',
          prompt: '`[1, 1]` means row 2, column 2 (counting from 0). Type what this prints.',
          code: `A = np.array([[1, 1],
              [2, 0]])
B = np.array([[3, 1],
              [4, 2]])
print((A @ B)[1, 1])`,
          answer: '2',
          typedWrong: [
            { answer: '0', why: '0×2 is the element-wise bottom-right. With `@` it is row 2 of A (2, 0) dotted with column 2 of B (1, 2).' },
            { answer: '8', why: 'You used row 2 of B (4, 2). Use column 2 of B: 1 and 2.' },
          ],
          explain: 'Row 2 of A is (2, 0), column 2 of B is (1, 2): 2×1 + 0×2 = 2.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'f3-05',
      title: 'Fill it in',
      summary: 'Any matrix product by hand: one row-times-column sum per cell.',
      card: {
        title: 'Fill it in',
        text: 'Now do whole products by hand, one cell at a time. Pick a row on the left and a column on the right, multiply the pairs, and add. A 2 × 2 result needs four of these little sums.',
        figure: { kind: 'stepper', A: [[1, 2], [0, 1]], B: [[3, 0, 1], [1, 2, 0]] },
      },
      exercises: [
        {
          id: 'f3-5-1',
          type: 'number-grid',
          prompt: 'Fill in `A @ B`.',
          inputs: [
            { name: 'A', value: [[1, 0], [2, 1]] },
            { name: 'B', value: [[3, 1], [0, 2]] },
          ],
          expr: 'A @ B',
          answer: [[3, 1], [6, 4]],
          explain: 'Row 1 (1, 0) with the columns: 3, 1. Row 2 (2, 1): 2×3 + 1×0 = 6 and 2×1 + 1×2 = 4.',
        },
        {
          id: 'f3-5-2',
          type: 'number-grid',
          prompt: 'A is 1 × 2 and B is 2 × 3. Fill in `A @ B`.',
          inputs: [
            { name: 'A', value: [[2, 3]] },
            { name: 'B', value: [[1, 0, 2], [4, 1, 0]] },
          ],
          expr: 'A @ B',
          answer: [[14, 3, 4]],
          explain: 'One row, three columns: 2×1 + 3×4 = 14, 2×0 + 3×1 = 3, 2×2 + 3×0 = 4.',
        },
        {
          id: 'f3-5-3',
          type: 'figure',
          prompt: 'Work out the bottom-right cell with the stepper.',
          figure: { kind: 'stepper', A: [[1, 2], [0, 1]], B: [[1, 1], [1, 0]], goal: { cell: [1, 1] } },
          explain: 'Row 2 of A is (0, 1), column 2 of B is (1, 0): 0×1 + 1×0 = 0.',
        },
        {
          id: 'f3-5-4',
          type: 'number-grid',
          prompt: 'A is 2 × 2 and B is 2 × 3. Fill in all six cells of `A @ B`.',
          inputs: [
            { name: 'A', value: [[1, 2], [3, 4]] },
            { name: 'B', value: [[2, 0, 1], [1, 3, 0]] },
          ],
          expr: 'A @ B',
          answer: [[4, 6, 1], [10, 12, 3]],
          explain: 'Row 1 (1, 2): 2+2 = 4, 0+6 = 6, 1+0 = 1. Row 2 (3, 4): 6+4 = 10, 0+12 = 12, 3+0 = 3.',
        },
        {
          id: 'f3-5-5',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `A = np.array([[1, 2],
              [3, 4]])
print(A @ A)`,
          answer: '[[ 7 10]\n [15 22]]',
          options: [
            { text: '[[ 7 10]\n [15 22]]' },
            { text: '[[ 1  4]\n [ 9 16]]', why: 'That squares each cell, which is `A * A`. `@` dots rows of A with columns of A.' },
            { text: '[[ 5 11]\n [11 25]]', why: 'That dots rows with rows (1×1 + 2×2 = 5). The right-hand side is read by columns: (1, 3) and (2, 4).' },
          ],
          explain: 'Top-left: row (1, 2) · column (1, 3) = 1 + 6 = 7. Top-right: (1, 2) · (2, 4) = 2 + 8 = 10.',
        },
        {
          id: 'f3-5-6',
          type: 'number-grid',
          prompt: 'Negative numbers work the same way. Fill in `A @ B`.',
          inputs: [
            { name: 'A', value: [[1, -1], [2, 0]] },
            { name: 'B', value: [[3, 2], [1, 4]] },
          ],
          expr: 'A @ B',
          answer: [[2, -2], [6, 4]],
          explain: 'Row 1 (1, −1): 3 − 1 = 2 and 2 − 4 = −2. Row 2 (2, 0): 6 and 4.',
        },
        {
          id: 'f3-5-7',
          type: 'predict-output',
          prompt: '`[1, 0]` means row 2, column 1. Type what this prints.',
          code: `A = np.array([[2, 0],
              [1, 3]])
B = np.array([[1, 2],
              [5, 1]])
print((A @ B)[1, 0])`,
          answer: '16',
          typedWrong: [
            { answer: '5', why: '1×5 is the element-wise cell. With `@`, row 2 of A (1, 3) meets column 1 of B (1, 5).' },
            { answer: '7', why: 'You used row 1 of B (1, 2). Use column 1 of B: 1 and 5.' },
          ],
          explain: 'Row 2 of A is (1, 3), column 1 of B is (1, 5): 1×1 + 3×5 = 16.',
        },
        {
          id: 'f3-5-8',
          type: 'mcq',
          prompt: 'Sam worked out `A @ B` by hand for A = [[1, 2], [3, 4]] and B = [[2, 1], [1, 2]] and got [[4, 5], [10, 10]]. Which cell is wrong?',
          options: [
            { text: 'Bottom-right' },
            { text: 'Top-left', why: 'Top-left is (1, 2) · (2, 1) = 2 + 2 = 4. Sam got that right.' },
            { text: 'Top-right', why: 'Top-right is (1, 2) · (1, 2) = 1 + 4 = 5. Sam got that right.' },
            { text: 'Bottom-left', why: 'Bottom-left is (3, 4) · (2, 1) = 6 + 4 = 10. Sam got that right.' },
          ],
          answer: 0,
          check: `C = np.array([[1, 2], [3, 4]]) @ np.array([[2, 1], [1, 2]])
assert C.tolist() == [[4, 5], [10, 11]]`,
          explain: 'Bottom-right is row (3, 4) · column (1, 2) = 3 + 8 = 11, not 10.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'f3-06',
      title: 'The shape rule',
      summary: '`(m, n) @ (n, p)` gives `(m, p)`: the inner numbers must match, the outer ones survive.',
      card: {
        title: 'The shape rule',
        text: '`(m, n) @ (n, p)` gives `(m, p)`. The inner numbers must match, because each row on the left needs one partner for every number in a column on the right. The outer numbers survive into the result.',
        figure: { kind: 'shape-checker', left: [2, 3], right: [3, 4], editable: ['l0', 'l1', 'r0', 'r1'] },
      },
      exercises: [
        {
          id: 'f3-6-1',
          type: 'figure',
          prompt: 'Change B\'s first number until `A @ B` can run.',
          figure: { kind: 'shape-checker', left: [2, 3], right: [2, 4], editable: ['r0'], goal: {} },
          explain: 'The inner numbers must match: A has 3 columns, so B needs 3 rows.',
        },
        {
          id: 'f3-6-2',
          type: 'predict-shape',
          prompt: 'What is the shape of `C`?',
          code: `A = np.ones((5, 2))
B = np.ones((2, 3))
C = A @ B`,
          target: 'C',
          answer: '(5, 3)',
          options: [
            { text: '(5, 3)' },
            { text: '(2, 2)', why: 'Those are the inner numbers. They must match and then disappear; the outer ones survive.' },
            { text: '(5, 2)', why: 'The 2 is an inner number: it is used up by the dot products. B\'s 3 columns survive instead.' },
            { text: 'error', why: 'The inner numbers are 2 and 2. They match, so it runs.' },
          ],
          explain: '(5, 2) @ (2, 3): inner 2s match, outer 5 and 3 survive.',
        },
        {
          id: 'f3-6-3',
          type: 'predict-shape',
          prompt: 'Enter the shape of `C`, or "error".',
          code: `A = np.ones((3, 4))
B = np.ones((4, 1))
C = A @ B`,
          target: 'C',
          answer: '(3, 1)',
          typedWrong: [
            { answer: '(4, 4)', why: '4 is the inner number. It must match and is then used up. The outer numbers are 3 and 1.' },
            { answer: '(3, 4)', why: 'The 4 is used up by the dot products. B has 1 column, so the result has 1 column.' },
          ],
          explain: '(3, 4) @ (4, 1): inner 4s match, the result is (3, 1).',
        },
        {
          id: 'f3-6-4',
          type: 'predict-shape',
          prompt: 'What happens here?',
          code: `A = np.ones((2, 3))
B = np.ones((2, 3))
C = A @ B`,
          target: 'C',
          answer: 'error',
          options: [
            { text: 'error' },
            { text: '(2, 3)', why: 'Same shapes is the rule for `*`. For `@` the inner numbers (3 and 2) must match, and they do not.' },
            { text: '(2, 2)', why: 'Rows of A have 3 numbers but columns of B have only 2, so no dot product can be formed.' },
            { text: '(3, 3)', why: 'No rule gives (3, 3) here. The inner numbers 3 and 2 differ, so `@` refuses.' },
          ],
          explain: 'Inner numbers 3 and 2 differ: NumPy raises a ValueError.',
        },
        {
          id: 'f3-6-5',
          type: 'figure',
          prompt: 'A is (4, 2). Change B\'s shape so `A @ B` gives (4, 6).',
          figure: {
            kind: 'shape-checker',
            left: [4, 2],
            right: [3, 5],
            editable: ['r0', 'r1'],
            goal: { result: [4, 6] },
          },
          explain: 'B needs 2 rows to match A\'s 2 columns, and 6 columns to give 6 result columns: (2, 6).',
        },
        {
          id: 'f3-6-6',
          type: 'predict-shape',
          prompt: 'Enter the shape of `C`, or "error".',
          code: `A = np.ones((1, 3))
B = np.ones((3, 7))
C = A @ B`,
          target: 'C',
          answer: '(1, 7)',
          typedWrong: [{ answer: '(3, 3)', why: '3 is the inner number: it must match and is then used up. The outer numbers are 1 and 7.' }],
          explain: 'Inner 3s match; outer 1 and 7 survive.',
        },
        {
          id: 'f3-6-7',
          type: 'mcq',
          prompt: 'A has shape (10, 64). Which shape must B have so that `A @ B` gives (10, 32)?',
          options: [
            { text: '(64, 32)' },
            { text: '(32, 64)', why: 'B\'s first number must match A\'s last (64), so B starts with 64.' },
            { text: '(10, 32)', why: 'That is the result shape. B must start with 64 to match A\'s inner number.' },
            { text: '(64, 10)', why: 'B\'s last number becomes the result\'s last number, which should be 32.' },
          ],
          answer: 0,
          check: 'assert (np.ones((10, 64)) @ np.ones((64, 32))).shape == (10, 32)',
          explain: '(10, 64) @ (64, 32) → (10, 32).',
        },
        {
          id: 'f3-6-8',
          type: 'match-pairs',
          prompt: 'A is (2, 3), B is (3, 5), C is (5, 2). Match each product to its shape.',
          setup: `A = np.ones((2, 3))
B = np.ones((3, 5))
C = np.ones((5, 2))`,
          pairs: [
            { left: 'A @ B', right: '(2, 5)', why: '(2, 3) @ (3, 5): inner 3s match, (2, 5) survives.' },
            { left: 'B @ C', right: '(3, 2)', why: '(3, 5) @ (5, 2): inner 5s match, (3, 2) survives.' },
            { left: 'C @ A', right: '(5, 3)', why: '(5, 2) @ (2, 3): inner 2s match, (5, 3) survives.' },
            { left: 'A @ B @ C', right: '(2, 2)', why: '(2, 5) from A @ B, then (2, 5) @ (5, 2) gives (2, 2).' },
          ],
          verify: 'shape',
        },
        {
          id: 'f3-6-9',
          type: 'fill-blank',
          prompt: 'Choose B\'s shape so the result is (4, 2).',
          code: `A = np.ones((4, 3))
B = np.ones((___, ___))
print((A @ B).shape)`,
          answer: ['3', '2'],
          distractors: [{ text: '4', why: 'B\'s first number must equal A\'s last (3), and its last number becomes the result\'s last (2). Neither is 4.' }],
          expectOutput: '(4, 2)',
          explain: 'Inner numbers must match (3), and B\'s last number becomes the result\'s last (2).',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'f3-07',
      title: 'Will it run?',
      summary: 'Two quick tests: `*` needs the same shape, `@` needs matching inner numbers.',
      card: {
        title: 'Will it run?',
        text: 'Two quick tests decide everything in this unit. `*` needs both shapes to be the same, and `@` needs the inner numbers to match. Check both before you run anything.',
        code: `# (2, 3) * (2, 3) -> (2, 3)
# (2, 3) @ (3, 4) -> (2, 4)
# (2, 3) @ (2, 3) -> error`,
      },
      exercises: [
        {
          id: 'f3-7-1',
          type: 'predict-shape',
          prompt: 'A and B are both (2, 2). Shape of `A * B`?',
          code: `A = np.ones((2, 2))
B = np.ones((2, 2))
C = A * B`,
          target: 'C',
          answer: '(2, 2)',
          options: [
            { text: '(2, 2)' },
            { text: 'error', why: 'Same shapes, so every cell has a partner.' },
            { text: '(4,)', why: '`*` never flattens anything. Same shape in, same shape out.' },
          ],
          explain: 'Same shape in, same shape out.',
        },
        {
          id: 'f3-7-2',
          type: 'predict-shape',
          prompt: 'Same A and B, both (2, 2). Shape of `A @ B`?',
          code: `A = np.ones((2, 2))
B = np.ones((2, 2))
C = A @ B`,
          target: 'C',
          answer: '(2, 2)',
          options: [
            { text: '(2, 2)' },
            { text: 'error', why: 'The inner numbers are 2 and 2. They match.' },
            { text: '(4, 4)', why: 'The result takes the outer numbers, 2 and 2, so it is (2, 2).' },
          ],
          explain: 'Square matrices of the same size work with both `*` and `@`, which is why the two are easy to mix up.',
        },
        {
          id: 'f3-7-3',
          type: 'predict-shape',
          prompt: 'A is (2, 3), B is (3, 2). Shape of `A * B`?',
          code: `A = np.ones((2, 3))
B = np.ones((3, 2))
C = A * B`,
          target: 'C',
          answer: 'error',
          options: [
            { text: 'error' },
            { text: '(2, 2)', why: 'That is `A @ B`. `*` needs the same shape, and (2, 3) is not (3, 2).' },
            { text: '(2, 3)', why: 'B is (3, 2), so the cells do not line up with A\'s.' },
          ],
          explain: 'Different shapes: element-wise has no partner for most cells.',
        },
        {
          id: 'f3-7-4',
          type: 'predict-shape',
          prompt: 'Same A (2, 3) and B (3, 2). Shape of `A @ B`?',
          code: `A = np.ones((2, 3))
B = np.ones((3, 2))
C = A @ B`,
          target: 'C',
          answer: '(2, 2)',
          options: [
            { text: '(2, 2)' },
            { text: 'error', why: 'Inner numbers 3 and 3 match, so `@` works here even though `*` does not.' },
            { text: '(3, 3)', why: '(3, 3) would be `B @ A`. With A first, the outer numbers are 2 and 2.' },
          ],
          explain: '(2, 3) @ (3, 2): inner 3s match, outer 2 and 2 survive.',
        },
        {
          id: 'f3-7-5',
          type: 'predict-shape',
          prompt: 'A and B are both (3, 4). Shape of `A @ B`?',
          code: `A = np.ones((3, 4))
B = np.ones((3, 4))
C = A @ B`,
          target: 'C',
          answer: 'error',
          options: [
            { text: 'error' },
            { text: '(3, 4)', why: 'Same shapes is the test for `*`. For `@` the inner numbers 4 and 3 must match, and they do not.' },
            { text: '(3, 3)', why: 'Rows of A have 4 numbers but columns of B have 3, so no dot product works.' },
          ],
          explain: 'Inner numbers 4 and 3 differ.',
        },
        {
          id: 'f3-7-6',
          type: 'predict-shape',
          prompt: 'Same A and B, both (3, 4). Enter the shape of `A * B`, or "error".',
          code: `A = np.ones((3, 4))
B = np.ones((3, 4))
C = A * B`,
          target: 'C',
          answer: '(3, 4)',
          typedWrong: [{ answer: 'error', why: 'That is true for `@`. For `*` the shapes only need to be the same, and they are.' }],
          explain: 'Same shape in, same shape out.',
        },
        {
          id: 'f3-7-7',
          type: 'predict-shape',
          prompt: 'A is (2, 5), B is (5, 5). Enter the shape of `A @ B`, or "error".',
          code: `A = np.ones((2, 5))
B = np.ones((5, 5))
C = A @ B`,
          target: 'C',
          answer: '(2, 5)',
          typedWrong: [{ answer: 'error', why: 'The inner numbers are 5 and 5. They match, so `@` runs.' }],
          explain: 'Inner 5s match; outer 2 and 5 survive.',
        },
        {
          id: 'f3-7-8',
          type: 'predict-shape',
          prompt: 'Same A (2, 5) and B (5, 5). What about `A * B`?',
          code: `A = np.ones((2, 5))
B = np.ones((5, 5))
C = A * B`,
          target: 'C',
          answer: 'error',
          options: [
            { text: 'error' },
            { text: '(2, 5)', why: 'That is `A @ B`. For `*` the shapes must be the same, and (2, 5) is not (5, 5).' },
            { text: '(5, 5)', why: 'A has only 2 rows, so 3 of B\'s rows have no partner.' },
          ],
          explain: 'Different shapes, so element-wise cannot pair the cells.',
        },
        {
          id: 'f3-7-9',
          type: 'match-pairs',
          prompt: 'A is (2, 3), B is (3, 4), C is (2, 3), D is (4, 1). Match each to its shape.',
          setup: `A = np.ones((2, 3))
B = np.ones((3, 4))
C = np.ones((2, 3))
D = np.ones((4, 1))`,
          pairs: [
            { left: 'A * C', right: '(2, 3)', why: 'Same shapes: element-wise keeps (2, 3).' },
            { left: 'A @ B', right: '(2, 4)', why: '(2, 3) @ (3, 4): inner 3s match, outer (2, 4) survives.' },
            { left: 'B * B', right: '(3, 4)', why: 'Same shapes: element-wise keeps (3, 4).' },
            { left: 'B @ D', right: '(3, 1)', why: '(3, 4) @ (4, 1): inner 4s match, outer (3, 1) survives.' },
          ],
          verify: 'shape',
        },
        {
          id: 'f3-7-10',
          type: 'mcq',
          prompt: 'You have a 3 × 3 grid of prices and a 3 × 3 grid of discount factors (0.9 means 10% off) for the same items. You want each item\'s discounted price. Which operation?',
          options: [
            { text: 'prices * discounts' },
            { text: 'prices @ discounts', why: '`@` would mix rows of prices with columns of discounts, combining different items. Each item only needs its own discount.' },
            { text: 'prices + discounts', why: 'A discount factor multiplies a price; adding them gives a meaningless number.' },
          ],
          answer: 0,
          check: `p = np.array([[10, 20], [30, 40]])
d = np.array([[0.5, 1], [1, 0.5]])
assert (p * d).tolist() == [[5, 20], [30, 20]]`,
          explain: 'Each cell pairs with the cell in the same position: element-wise.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'f3-08',
      title: 'Order matters',
      summary: '`A @ B` and `B @ A` are different questions; sometimes only one of them can run.',
      card: {
        title: 'Order matters',
        text: 'Swapping the two sides of `@` changes the question, so `A @ B` and `B @ A` usually give different answers. Sometimes only one of them can run at all.',
        code: `A = np.array([[1, 2],
              [0, 1]])
B = np.array([[1, 0],
              [3, 1]])
print(A @ B)
print(B @ A)`,
        output: '[[7 2]\n [3 1]]\n[[1 2]\n [3 7]]',
      },
      exercises: [
        {
          id: 'f3-8-1',
          type: 'predict-shape',
          prompt: 'A is (2, 3) and B is (3, 4), so `A @ B` works. What about `B @ A`?',
          code: `A = np.ones((2, 3))
B = np.ones((3, 4))
C = B @ A`,
          target: 'C',
          answer: 'error',
          options: [
            { text: 'error' },
            { text: '(2, 4)', why: '(2, 4) is `A @ B`. In `B @ A` the inner numbers are B\'s 4 and A\'s 2, which differ.' },
            { text: '(4, 2)', why: 'Swapping the order does not just flip the result. The inner numbers (4 and 2) must match, and they do not.' },
          ],
          explain: '(3, 4) @ (2, 3): inner numbers 4 and 2 differ, so only `A @ B` exists here.',
        },
        {
          id: 'f3-8-2',
          type: 'predict-shape',
          prompt: 'A is (2, 3), B is (3, 2). `A @ B` is (2, 2). What is the shape of `B @ A`?',
          code: `A = np.ones((2, 3))
B = np.ones((3, 2))
C = B @ A`,
          target: 'C',
          answer: '(3, 3)',
          options: [
            { text: '(3, 3)' },
            { text: '(2, 2)', why: 'That is `A @ B`. With B first, the outer numbers are B\'s 3 and A\'s 3.' },
            { text: 'error', why: 'In `B @ A` the inner numbers are 2 and 2. They match.' },
          ],
          explain: '(3, 2) @ (2, 3): inner 2s match, outer (3, 3). Same matrices, different order, different size of answer.',
        },
        {
          id: 'f3-8-3',
          type: 'number-grid',
          prompt: 'Fill in `B @ A`. Careful: B is on the left.',
          inputs: [
            { name: 'A', value: [[0, 1], [1, 0]] },
            { name: 'B', value: [[1, 2], [3, 4]] },
          ],
          expr: 'B @ A',
          answer: [[2, 1], [4, 3]],
          explain: 'Rows come from B, columns from A. Row 1 of B (1, 2) · column 1 of A (0, 1) = 2, and so on.',
        },
        {
          id: 'f3-8-4',
          type: 'predict-output',
          prompt: '`np.array_equal` checks whether two arrays are the same. What does this print?',
          code: `A = np.array([[1, 2],
              [3, 4]])
B = np.array([[0, 1],
              [1, 0]])
print(np.array_equal(A @ B, B @ A))`,
          answer: 'False',
          options: [
            { text: 'False' },
            { text: 'True', why: '`A @ B` uses rows of A with columns of B; `B @ A` uses rows of B with columns of A. Here one swaps A\'s columns, the other swaps its rows.' },
          ],
          explain: '`A @ B` is [[2, 1], [4, 3]] and `B @ A` is [[3, 4], [1, 2]].',
        },
        {
          id: 'f3-8-5',
          type: 'predict-output',
          prompt: 'Same A and B. What does this print?',
          code: `A = np.array([[1, 2],
              [3, 4]])
B = np.array([[0, 1],
              [1, 0]])
print(np.array_equal(A * B, B * A))`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'Element-wise multiplies pairs of single numbers, and 3 × 5 is the same as 5 × 3. Order only matters for `@`.' },
          ],
          explain: 'Each cell is just two numbers multiplied, and that does not care about order.',
        },
        {
          id: 'f3-8-6',
          type: 'figure',
          prompt: 'A is (4, 3) and B is (2, 4). `A @ B` fails. Find an order that runs.',
          figure: { kind: 'shape-checker', left: [4, 3], right: [2, 4], swappable: true, goal: {} },
          explain: '`B @ A` is (2, 4) @ (4, 3): inner 4s match, result (2, 3).',
        },
        {
          id: 'f3-8-7',
          type: 'predict-shape',
          prompt: 'A is (5, 2) and B is (3, 5). Enter the shape of `B @ A`, or "error".',
          code: `A = np.ones((5, 2))
B = np.ones((3, 5))
C = B @ A`,
          target: 'C',
          answer: '(3, 2)',
          typedWrong: [
            { answer: 'error', why: '`A @ B` fails (2 vs 3), but here B comes first: (3, 5) @ (5, 2) has matching 5s.' },
            { answer: '(5, 5)', why: 'The 5s are the inner numbers: they must match and are then used up.' },
          ],
          explain: '(3, 5) @ (5, 2) → (3, 2).',
        },
        {
          id: 'f3-8-8',
          type: 'fill-blank',
          prompt: '8 inputs with 4 features each, and weights that turn 4 features into 16. Put them in the order that runs.',
          code: `X = np.ones((8, 4))
W = np.ones((4, 16))
Y = ___ @ ___
print(Y.shape)`,
          answer: ['X', 'W'],
          distractors: [],
          expectOutput: '(8, 16)',
          explain: '(8, 4) @ (4, 16): the inner 4s match. `W @ X` would be (4, 16) @ (8, 4), and 16 is not 8.',
        },
        {
          id: 'f3-8-9',
          type: 'spot-bug',
          prompt: 'Which line raises this error?',
          code: `X = np.ones((8, 4))
W = np.ones((4, 16))
Y = W @ X
print(Y.shape)`,
          error: `${MATMUL_ERR} (size 8 is different from 16)`,
          answer: 2,
          lineWhy: {
            '0': 'X is a valid (8, 4) array. Creating it cannot fail.',
            '1': 'W is a valid (4, 16) array. Creating it cannot fail.',
            '3': 'Python never gets here: the program stops at the line before.',
          },
          explain: '`W @ X` puts (4, 16) before (8, 4): inner 16 and 8 differ. `X @ W` would work.',
        },
      ],
    },

    // ------------------------------------------------------------------ 9
    {
      id: 'f3-09',
      title: 'Same inputs, two answers',
      summary: 'The same two matrices give one answer with `*` and a different one with `@`.',
      card: {
        title: 'Same inputs, two answers',
        text: 'Here is the whole unit in one picture: the same two matrices give one answer with `*` and another with `@`. Tap any result cell to see which inputs made it.',
        figure: { kind: 'compare', A: [[1, 2], [3, 4]], B: [[5, 6], [7, 8]] },
      },
      exercises: [
        {
          id: 'f3-9-1',
          type: 'figure',
          prompt: 'Tap the cell, in either result, that came from 2 × 6 alone.',
          figure: {
            kind: 'compare',
            A: [[1, 2], [3, 4]],
            B: [[5, 6], [7, 8]],
            goal: { panel: 'elementwise', cell: [0, 1] },
          },
          explain: 'Only element-wise uses a single pair. 2 and 6 are both top-right, so it is the top-right cell of `A * B`.',
        },
        {
          id: 'f3-9-2',
          type: 'figure',
          prompt: 'Tap the cell, in either result, that used all of row 1 of A and column 2 of B.',
          figure: {
            kind: 'compare',
            A: [[2, 0], [1, 3]],
            B: [[1, 2], [4, 1]],
            goal: { panel: 'matmul', cell: [0, 1] },
          },
          explain: 'Whole rows and columns mean `@`. Row 1, column 2 is the top-right cell of `A @ B`.',
        },
        {
          id: 'f3-9-3',
          type: 'number-grid',
          prompt: 'Fill in `A * B` (element-wise).',
          inputs: [
            { name: 'A', value: [[2, 1], [0, 3]] },
            { name: 'B', value: [[4, 2], [5, 1]] },
          ],
          expr: 'A * B',
          answer: [[8, 2], [0, 3]],
          explain: 'Partners in the same position: 2×4, 1×2, 0×5, 3×1.',
        },
        {
          id: 'f3-9-4',
          type: 'number-grid',
          prompt: 'Same A and B. Now fill in `A @ B`.',
          inputs: [
            { name: 'A', value: [[2, 1], [0, 3]] },
            { name: 'B', value: [[4, 2], [5, 1]] },
          ],
          expr: 'A @ B',
          answer: [[13, 5], [15, 3]],
          explain: 'Row 1 (2, 1): 2×4 + 1×5 = 13 and 2×2 + 1×1 = 5. Row 2 (0, 3): 15 and 3.',
        },
        {
          id: 'f3-9-5',
          type: 'predict-output',
          prompt: 'I has ones on the diagonal. What does this print?',
          code: `I = np.array([[1, 0],
              [0, 1]])
B = np.array([[2, 3],
              [4, 5]])
print(I * B)`,
          answer: '[[2 0]\n [0 5]]',
          options: [
            { text: '[[2 0]\n [0 5]]' },
            { text: '[[2 3]\n [4 5]]', why: 'That is `I @ B`: with `@`, this I gives B back unchanged. With `*`, the zeros in I wipe out two cells.' },
            { text: '[[3 3]\n [4 6]]', why: 'That is `I + B`. `*` multiplies each pair.' },
          ],
          explain: 'Cell by cell: 1×2, 0×3, 0×4, 1×5.',
        },
        {
          id: 'f3-9-6',
          type: 'predict-output',
          prompt: 'Same I and B, with `@` this time. Type what this prints.',
          code: `I = np.array([[1, 0],
              [0, 1]])
B = np.array([[2, 3],
              [4, 5]])
print((I @ B)[0, 1])`,
          answer: '3',
          typedWrong: [{ answer: '0', why: '0 is the element-wise answer (0×3). With `@`, row 1 of I (1, 0) · column 2 of B (3, 5) = 3.' }],
          explain: 'Row 1 of I is (1, 0) and column 2 of B is (3, 5): 1×3 + 0×5 = 3.',
        },
        {
          id: 'f3-9-7',
          type: 'match-pairs',
          prompt: 'Match each expression to its result.',
          setup: `A = np.array([[1, 2], [3, 4]])
B = np.array([[2, 0], [1, 1]])`,
          pairs: [
            { left: 'A * B', right: '[[2, 0], [3, 4]]', why: 'Cell by cell: 1×2, 2×0, 3×1, 4×1.' },
            { left: 'A @ B', right: '[[4, 2], [10, 4]]', why: 'Rows of A with columns of B: (1, 2) · (2, 1) = 4, and so on.' },
            { left: 'B @ A', right: '[[2, 4], [4, 6]]', why: 'Rows of B with columns of A: (2, 0) · (1, 3) = 2, and so on.' },
            { left: 'A + B', right: '[[3, 2], [4, 5]]', why: 'Cell by cell, adding.' },
          ],
          verify: 'equal',
        },
        {
          id: 'f3-9-8',
          type: 'mcq',
          prompt: '`scores` holds each student\'s mark in each test. `weights` has the same shape and says how much each mark counts. You want every weighted mark kept separately. Which one?',
          options: [
            { text: 'scores * weights' },
            { text: 'scores @ weights', why: '`@` adds marks together across tests and mixes rows with columns. You want each mark kept in its own cell.' },
            { text: 'scores + weights', why: 'A weight scales a mark, so it multiplies. Adding gives a meaningless number.' },
          ],
          answer: 0,
          check: `s = np.array([[50, 80], [70, 60]])
w = np.array([[0.5, 1.0], [1.0, 0.5]])
assert (s * w).shape == s.shape`,
          explain: 'Each mark meets only its own weight: element-wise.',
        },
        {
          id: 'f3-9-9',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `a = np.array([[2, 2],
              [2, 2]])
print((a @ a)[0, 0])`,
          answer: '8',
          typedWrong: [{ answer: '4', why: '4 is the element-wise answer (2×2). With `@`, the top-left is (2, 2) · (2, 2) = 4 + 4.' }],
          explain: 'Row 1 (2, 2) · column 1 (2, 2) = 2×2 + 2×2 = 8.',
        },
      ],
    },

    // ----------------------------------------------------------------- 10
    {
      id: 'f3-10',
      title: 'Why AI uses it',
      summary: 'A layer of neurons is a matrix of weights times the input vector: one `@` does it all.',
      card: {
        title: 'Why AI uses it',
        text: 'A neuron takes a weighted sum of all its inputs, which is one dot product. A layer is many neurons reading the same inputs, so it is a matrix of weights times the input vector. One `@` computes the whole layer at once.',
        code: `x = np.array([1.0, 2.0])
W = np.array([[0.5, -1.0],  # neuron 1
              [2.0, 0.0],   # neuron 2
              [1.0, 1.0]])  # neuron 3
print(W @ x)`,
        output: '[-1.5  2.   3. ]',
      },
      exercises: [
        {
          id: 'f3-10-1',
          type: 'predict-output',
          prompt: 'One neuron with two inputs. Type what this prints.',
          code: `w = np.array([0.5, 2.0])
x = np.array([4.0, 1.0])
print(w @ x)`,
          answer: '4.0',
          typedWrong: [{ answer: '[2. 2.]', why: 'Those are the two weighted inputs. A neuron adds them into one number: 2 + 2.' }],
          explain: '0.5×4 + 2×1 = 2 + 2 = 4.0.',
        },
        {
          id: 'f3-10-2',
          type: 'predict-shape',
          prompt: 'A layer with weights W and input x. What is the shape of `h`?',
          code: `W = np.ones((3, 2))
x = np.ones(2)
h = W @ x`,
          target: 'h',
          answer: '(3,)',
          options: [
            { text: '(3,)' },
            { text: '(2,)', why: '2 is the number of inputs. The output has one number per neuron, and W has 3 rows (neurons).' },
            { text: '(3, 2)', why: 'Each neuron adds its weighted inputs into one number, so the 2 disappears.' },
          ],
          explain: '3 neurons, so 3 outputs.',
        },
        {
          id: 'f3-10-3',
          type: 'mcq',
          prompt: 'A layer has 4 inputs and 10 neurons, computed as `W @ x`. What shape is W?',
          options: [
            { text: '(10, 4)' },
            { text: '(4, 10)', why: 'In `W @ x`, W\'s last number must match x\'s 4 inputs, so W ends in 4.' },
            { text: '(10,)', why: 'Each of the 10 neurons needs one weight per input: a row of 4 numbers, not one number.' },
            { text: '(4, 4)', why: 'The rows of W are neurons, and there are 10 of them.' },
          ],
          answer: 0,
          check: 'assert (np.ones((10, 4)) @ np.ones(4)).shape == (10,)',
          explain: 'One row per neuron (10), one column per input (4).',
        },
        {
          id: 'f3-10-4',
          type: 'number-grid',
          prompt: 'Three neurons, two inputs. Fill in the layer output `W @ x`.',
          inputs: [
            { name: 'W', value: [[1, 0], [1, 1], [0, 2]] },
            { name: 'x', value: [[3], [1]] },
          ],
          expr: 'W @ x',
          answer: [[3], [4], [2]],
          explain: 'Neuron 1: 1×3 + 0×1 = 3. Neuron 2: 3 + 1 = 4. Neuron 3: 0 + 2 = 2.',
        },
        {
          id: 'f3-10-5',
          type: 'fill-blank',
          prompt: 'A layer of 5 neurons reading 3 inputs. Put the pieces in the order that runs.',
          code: `x = np.array([1.0, 0.0, 2.0])
W = np.ones((5, 3))
h = ___ @ ___
print(h.shape)`,
          answer: ['W', 'x'],
          distractors: [],
          expectOutput: '(5,)',
          explain: '(5, 3) @ (3,): inner 3s match. `x @ W` would be (3,) @ (5, 3), and 3 is not 5.',
        },
        {
          id: 'f3-10-6',
          type: 'predict-shape',
          prompt: 'Real models push many examples through at once: 32 rows of 3 inputs. Enter the shape of `H`.',
          code: `X = np.ones((32, 3))
W = np.ones((3, 8))
H = X @ W`,
          target: 'H',
          answer: '(32, 8)',
          typedWrong: [{ answer: '(3, 3)', why: 'The 3s are the inner numbers: they match and are used up. 32 examples and 8 outputs survive.' }],
          explain: '(32, 3) @ (3, 8) → (32, 8): 8 outputs for each of 32 examples.',
        },
        {
          id: 'f3-10-7',
          type: 'spot-bug',
          prompt: '32 examples with 10 features go into a layer of 4 neurons. Which line needs fixing?',
          code: `X = np.ones((32, 10))
W = np.ones((32, 4))
H = X @ W`,
          error: `${MATMUL_ERR} (size 32 is different from 10)`,
          answer: 1,
          raiseLine: 2,
          lineWhy: {
            '0': 'X is 32 examples with 10 features each, which is what the task describes.',
            '2': 'This line raises the error, but `X @ W` is the right operation. The shape fed into it is wrong.',
          },
          explain: 'W needs one row per input feature: (10, 4). The error appears on line 3, but the fix is on line 2.',
        },
        {
          id: 'f3-10-8',
          type: 'match-pairs',
          prompt: 'Match each layer to the shape of W in `W @ x`.',
          pairs: [
            { left: '4 inputs, 2 neurons', right: '(2, 4)', why: 'One row per neuron (2), one column per input (4).' },
            { left: '2 inputs, 4 neurons', right: '(4, 2)', why: 'One row per neuron (4), one column per input (2).' },
            { left: '3 inputs, 3 neurons', right: '(3, 3)', why: 'One row per neuron, one column per input: both 3.' },
            { left: '1 input, 5 neurons', right: '(5, 1)', why: 'One row per neuron (5), one column per input (1).' },
          ],
          check: `for n_in, n_out in [(4, 2), (2, 4), (3, 3), (1, 5)]:
    W = np.ones((n_out, n_in))
    assert (W @ np.ones(n_in)).shape == (n_out,)`,
        },
      ],
    },

    // ----------------------------------------------------------------- 11
    {
      id: 'f3-11',
      title: 'In code',
      summary: '`@`, `np.matmul` and `np.dot` multiply matrices; `*` is element-wise. Read the error, check the inner numbers.',
      card: {
        title: 'In code',
        text: '`A @ B`, `np.matmul(A, B)` and, for 2-D arrays, `np.dot(A, B)` all do matrix multiply; only `A * B` is element-wise. When the inner numbers differ, `np.dot` says `shapes not aligned` and `@` says `mismatch in its core dimension`. Both errors mean the same thing: check the inner numbers.',
        code: `A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
print(np.dot(A, B))
print(np.matmul(A, B))`,
        output: '[[19 22]\n [43 50]]\n[[19 22]\n [43 50]]',
      },
      exercises: [
        {
          id: 'f3-11-1',
          type: 'match-pairs',
          prompt: 'Match each call to its result.',
          setup: `A = np.array([[1, 2], [3, 4]])
B = np.array([[0, 1], [1, 0]])`,
          pairs: [
            { left: 'np.dot(A, B)', right: '[[2, 1], [4, 3]]', why: '`np.dot` on 2-D arrays is matrix multiply: rows of A with columns of B.' },
            { left: 'A * B', right: '[[0, 2], [3, 0]]', why: '`*` is element-wise: the zeros in B wipe out two cells.' },
            { left: 'np.matmul(B, A)', right: '[[3, 4], [1, 2]]', why: '`np.matmul(B, A)` is `B @ A`: rows of B pick rows of A.' },
            { left: 'A + B', right: '[[1, 3], [4, 4]]', why: 'Cell by cell, adding.' },
          ],
          verify: 'equal',
        },
        {
          id: 'f3-11-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])
same = np.array_equal(np.dot(A, B),
                      A @ B)
print(same)`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'For 2-D arrays `np.dot` is matrix multiply, exactly like `@`. Only `*` is element-wise.' },
          ],
          explain: 'Two spellings of the same operation for 2-D arrays.',
        },
        {
          id: 'f3-11-3',
          type: 'spot-bug',
          prompt: 'Which line raises this error?',
          code: `A = np.ones((3, 2))
B = np.ones((3, 2))
C = A * B
D = np.dot(A, B)
E = C + D`,
          error: 'ValueError: shapes (3,2) and (3,2) not aligned: 2 (dim 1) != 3 (dim 0)',
          answer: 3,
          lineWhy: {
            '0': 'Creating A cannot fail.',
            '1': 'Creating B cannot fail.',
            '2': '`A * B` is element-wise, and both are (3, 2), so it works.',
            '4': 'Python never gets here: the program stops at the line before.',
          },
          explain: '"not aligned" is `np.dot`\'s message: the inner numbers (2 and 3) differ.',
        },
        {
          id: 'f3-11-4',
          type: 'fill-blank',
          prompt: 'Fix B so `np.dot(A, B)` runs and gives (3, 4).',
          code: `A = np.ones((3, 2))
B = np.ones((___, 4))
C = np.dot(A, B)
print(C.shape)`,
          answer: ['2'],
          distractors: [
            { text: '3', why: 'B\'s first number must match A\'s last number (2), not its first.' },
            { text: '4', why: 'B\'s first number must match A\'s last number, which is 2.' },
          ],
          expectOutput: '(3, 4)',
          explain: 'The inner numbers must match: A ends in 2, so B starts with 2.',
        },
        {
          id: 'f3-11-5',
          type: 'mcq',
          prompt: '`np.dot(A, B)` fails with: shapes (4,5) and (6,2) not aligned: 5 (dim 1) != 6 (dim 0). What is A\'s shape?',
          options: [
            { text: '(4, 5)' },
            { text: '(6, 2)', why: 'The error lists the shapes in the order they were passed: A first, then B. (6, 2) is B.' },
            { text: '(5, 6)', why: '5 and 6 are the two inner numbers that failed to match, one from each array.' },
            { text: '(4, 2)', why: '(4, 2) is what the result would have been if the inner numbers matched.' },
          ],
          answer: 0,
          check: `try:
    np.dot(np.ones((4, 5)), np.ones((6, 2)))
    msg = "no error"
except ValueError as e:
    msg = str(e)
assert msg == "shapes (4,5) and (6,2) not aligned: 5 (dim 1) != 6 (dim 0)"`,
          explain: 'The first shape in the message is the first argument: A is (4, 5).',
        },
        {
          id: 'f3-11-6',
          type: 'run-code',
          prompt: 'Someone wrote `C = A * B` but meant a matrix product. Write the fixed line.',
          before: `A = np.array([[1, 2], [3, 4]])
B = np.array([[2, 0], [1, 2]])`,
          solution: 'C = A @ B',
          tests: `assert not np.array_equal(C, A * B), "C is still the element-wise product. Use @ for a matrix product."
assert np.array_equal(C, np.array([[4, 4], [10, 8]])), "Top-left should be row 1 of A times column 1 of B: 1*2 + 2*1 = 4"`,
          placeholder: 'C = ',
          explain: '`A @ B` (or `np.matmul(A, B)` or `np.dot(A, B)`) is the matrix product.',
        },
        {
          id: 'f3-11-7',
          type: 'predict-shape',
          prompt: 'What is the shape of `C`?',
          code: `A = np.ones((2, 4))
B = np.ones((4, 3))
C = np.matmul(A, B)`,
          target: 'C',
          answer: '(2, 3)',
          options: [
            { text: '(2, 3)' },
            { text: '(2, 4)', why: '`np.matmul` is `@`: the inner 4s are used up, and B\'s 3 columns survive.' },
            { text: 'error', why: 'The inner numbers are 4 and 4. They match.' },
          ],
          explain: '`np.matmul(A, B)` is `A @ B`: (2, 4) @ (4, 3) → (2, 3).',
        },
        {
          id: 'f3-11-8',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a = np.array([1, 2, 3])
print(np.dot(a, a), a * a)`,
          answer: '14 [1 4 9]',
          options: [
            { text: '14 [1 4 9]' },
            { text: '[1 4 9] 14', why: 'The values are right but in the wrong order: `np.dot` is printed first, and it gives the single number.' },
            { text: '14 14', why: '`a * a` is element-wise and keeps the three squares separate.' },
          ],
          explain: '`np.dot(a, a)` = 1 + 4 + 9 = 14. `a * a` keeps the squares: [1 4 9].',
        },
      ],
    },

    // ----------------------------------------------------------------- 12
    {
      id: 'f3-12',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can pick `*` or `@` for a situation, predict shapes, and compute products by hand.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each situation, ask first: does each cell meet only its partner (`*`), or does each row meet each column (`@`)?',
      },
      exercises: [
        {
          id: 'f3-12-1',
          type: 'mcq',
          prompt: '`price` holds the price of each item and `qty` how many of each you bought. You want the total bill. Which one?',
          options: [
            { text: 'price @ qty' },
            { text: 'price * qty', why: 'That gives the cost of each item separately. The bill also adds them up.' },
            { text: 'price + qty', why: 'Adding a price to a quantity means nothing.' },
          ],
          answer: 0,
          check: 'assert np.array([2, 5]) @ np.array([3, 1]) == 11',
          explain: 'Multiply pairs and add: the dot product.',
        },
        {
          id: 'f3-12-2',
          type: 'mcq',
          prompt: '`img` is a grid of pixel brightness and `mask` a grid of the same size holding 1 (keep) or 0 (hide). You want the masked image. Which one?',
          options: [
            { text: 'img * mask' },
            { text: 'img @ mask', why: '`@` mixes each row of pixels with each column of the mask, blending pixels from different places. Each pixel only needs its own mask value.' },
            { text: 'img + mask', why: 'Adding 0 or 1 just brightens some pixels by 1; it hides nothing.' },
          ],
          answer: 0,
          check: `img = np.array([[10, 20], [30, 40]])
mask = np.array([[1, 0], [0, 1]])
assert (img * mask).tolist() == [[10, 0], [0, 40]]`,
          explain: 'Each pixel meets only its own mask value: element-wise.',
        },
        {
          id: 'f3-12-3',
          type: 'mcq',
          prompt: '5 neurons each take a weighted sum of the same 3 inputs `x`. Which computes all five?',
          options: [
            { text: 'W @ x, with W of shape (5, 3)' },
            { text: 'W * x, with W of shape (5, 3)', why: '`*` keeps every weighted input separate; a neuron adds them up.' },
            { text: 'x @ W, with W of shape (5, 3)', why: '(3,) @ (5, 3): the inner numbers 3 and 5 differ, so this fails.' },
            { text: 'W @ x, with W of shape (3, 5)', why: 'W needs one row per neuron and one column per input: (5, 3).' },
          ],
          answer: 0,
          check: 'assert (np.ones((5, 3)) @ np.ones(3)).shape == (5,)',
          explain: 'One row of weights per neuron, one `@` for the whole layer.',
        },
        {
          id: 'f3-12-4',
          type: 'number-grid',
          prompt: 'A is 2 × 3 and B is 3 × 2. Fill in `A @ B`.',
          inputs: [
            { name: 'A', value: [[1, 0, 2], [0, 1, 1]] },
            { name: 'B', value: [[1, 2], [0, 1], [3, 0]] },
          ],
          expr: 'A @ B',
          answer: [[7, 2], [3, 1]],
          explain: 'Row 1 (1, 0, 2): 1 + 0 + 6 = 7 and 2 + 0 + 0 = 2. Row 2 (0, 1, 1): 0 + 0 + 3 = 3 and 0 + 1 + 0 = 1.',
        },
        {
          id: 'f3-12-5',
          type: 'predict-shape',
          prompt: 'Enter the shape of `C`, or "error".',
          code: `A = np.ones((6, 4))
B = np.ones((4, 2))
C = A @ B`,
          target: 'C',
          answer: '(6, 2)',
          typedWrong: [{ answer: '(4, 4)', why: 'The 4s are the inner numbers: they match and are used up.' }],
          explain: '(6, 4) @ (4, 2) → (6, 2).',
        },
        {
          id: 'f3-12-6',
          type: 'predict-shape',
          prompt: 'What happens here?',
          code: `A = np.ones((4, 2))
B = np.ones((2, 4))
C = A * B`,
          target: 'C',
          answer: 'error',
          options: [
            { text: 'error' },
            { text: '(4, 4)', why: '(4, 4) is `A @ B`. `*` needs the same shapes, and (4, 2) is not (2, 4).' },
            { text: '(2, 2)', why: '(2, 2) is `B @ A`. `*` needs the same shapes.' },
            { text: '(4, 2)', why: 'B is (2, 4), so most cells of A have no partner.' },
          ],
          explain: 'Different shapes, so element-wise fails, even though both `@` orders would run.',
        },
        {
          id: 'f3-12-7',
          type: 'spot-bug',
          prompt: '16 examples with 5 features go into a layer of 3 neurons. Which line needs fixing?',
          code: `X = np.ones((16, 5))
W = np.ones((16, 3))
H = X @ W
print(H.shape)`,
          error: `${MATMUL_ERR} (size 16 is different from 5)`,
          answer: 1,
          raiseLine: 2,
          lineWhy: {
            '0': 'X matches the task: 16 examples, 5 features.',
            '2': 'This is where the error is raised, but `X @ W` is the right operation. W\'s shape is the problem.',
            '3': 'Python never gets here, and printing a shape cannot cause this error.',
          },
          explain: 'W needs one row per input feature: (5, 3). The error shows on line 3; the fix is on line 2.',
        },
        {
          id: 'f3-12-8',
          type: 'predict-output',
          prompt: 'Type what this prints (two numbers).',
          code: `a = np.array([[1, 2],
              [3, 4]])
b = np.array([[2, 0],
              [0, 2]])
print((a * b)[0, 1], (a @ b)[0, 1])`,
          answer: '0 4',
          typedWrong: [{ answer: '4 0', why: 'Swapped: `a * b` comes first, and its top-right is 2×0 = 0.' }],
          explain: '`a * b` top-right: 2×0 = 0. `a @ b` top-right: row (1, 2) · column (0, 2) = 4.',
        },
        {
          id: 'f3-12-9',
          type: 'order-lines',
          prompt: 'Order the lines: compute a layer, then square each output.',
          lines: [
            { text: 'x = np.array([1, 2])', fixed: true },
            { text: 'W = np.array([[1, 0], [2, 1]])' },
            { text: 'h = W @ x' },
            { text: 'y = h * h' },
            { text: 'print(y)' },
          ],
          expectOutput: '[ 1 16]',
          explain: 'W must exist before the layer, the layer output h before squaring it, and y before printing.',
        },
        {
          id: 'f3-12-10',
          type: 'figure',
          prompt: 'Tap the cell, in either result, built from row 2 of A and column 1 of B.',
          figure: {
            kind: 'compare',
            A: [[1, 2], [3, 4]],
            B: [[2, 1], [0, 1]],
            goal: { panel: 'matmul', cell: [1, 0] },
          },
          explain: 'A whole row with a whole column is `@`; row 2, column 1 is bottom-left of `A @ B`.',
        },
        {
          id: 'f3-12-11',
          type: 'fill-blank',
          prompt: 'Compute a layer, then switch its second output off with a mask.',
          code: `x = np.array([1.0, 2.0])
W = np.array([[1.0, 1.0],
              [2.0, 0.5]])
mask = np.array([1.0, 0.0])
h = W ___ x
out = h ___ mask
print(out)`,
          answer: ['@', '*'],
          distractors: [{ text: '+', why: 'Neither step adds. A layer multiplies and sums (`@`); a mask multiplies each output by 1 or 0 (`*`).' }],
          expectOutput: '[3. 0.]',
          explain: 'The layer is `@` (rows of weights meet the inputs); the mask is `*` (each output meets its own 1 or 0).',
        },
      ],
    },
  ],
  labs: f3Labs,
  library: f3Library,
};
