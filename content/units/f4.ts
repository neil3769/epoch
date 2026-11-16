import { f4Labs } from '../labs/f4';
import { f4Library } from '../library/f4';
import type { Unit } from '../schema';
import { f4More } from './f4-more';

/*
 * F4 NumPy. Lessons 1 to 7: making arrays, shape, dtype, indexing (1-D and
 * 2-D), views and copies, boolean masks. Lessons 8 to 14 are in f4-more.ts.
 * Integer dtype names are avoided in printed answers: Pyodide (wasm32) uses
 * int32 where most computers use int64.
 */
export const f4: Unit = {
  id: 'F4',
  track: 'foundations',
  title: 'NumPy',
  blurb: 'Arrays: make them, read their shape and dtype, index and mask them, reduce along an axis, reshape and broadcast, and replace loops.',
  prelude: 'import numpy as np',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'f4-01',
      title: 'Making arrays',
      summary: 'np.array turns lists into arrays; np.zeros, np.ones and np.arange make common ones.',
      card: {
        title: 'Making arrays',
        text: '`np.array` turns a list, or a list of lists, into an array: one block of numbers that all have the same type. `np.zeros(3)`, `np.ones((2, 2))` and `np.arange(5)` make common arrays without typing them out. Arrays, not lists, are what ML code passes around.',
        code: `a = np.array([1, 2, 3])
print(a)
print(np.zeros(3))
print(np.arange(5))`,
        output: '[1 2 3]\n[0. 0. 0.]\n[0 1 2 3 4]',
      },
      exercises: [
        {
          id: 'f4-1-1',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: 'print(np.arange(4))',
          answer: '[0 1 2 3]',
          typedWrong: [{ answer: '[1 2 3 4]', why: '`arange` starts at 0 and stops before 4, like `range`.' }],
          explain: '`np.arange(n)` is `range(n)` as an array: 0 up to n − 1.',
        },
        {
          id: 'f4-1-2',
          type: 'predict-output',
          prompt: 'Start, stop and step. What does this print?',
          code: 'print(np.arange(2, 10, 3))',
          answer: '[2 5 8]',
          options: [
            { text: '[2 5 8]' },
            { text: '[2 5 8 11]', why: 'It stops before 10, so 11 is never reached.' },
            { text: '[3 6 9]', why: 'It starts at 2, the first argument, and steps by 3.' },
          ],
          explain: 'Same arguments as `range`: start 2, stop before 10, step 3.',
        },
        {
          id: 'f4-1-3',
          type: 'predict-output',
          prompt: 'The size is given as a tuple. What does this print?',
          code: 'print(np.ones((2, 3)))',
          answer: '[[1. 1. 1.]\n [1. 1. 1.]]',
          options: [
            { text: '[[1. 1. 1.]\n [1. 1. 1.]]' },
            { text: '[[1. 1.]\n [1. 1.]\n [1. 1.]]', why: 'The tuple is (rows, columns): 2 rows of 3.' },
            { text: '[1. 1. 1. 1. 1. 1.]', why: 'A tuple of two sizes makes a 2-D array, not one long row.' },
          ],
          explain: 'Rows first, then columns. The dots show the ones are floats.',
        },
        {
          id: 'f4-1-4',
          type: 'predict-output',
          prompt: 'A list and an array of the same numbers. What does this print?',
          code: `a = [1, 2, 3]
b = np.array(a)
print(a, b)`,
          answer: '[1, 2, 3] [1 2 3]',
          options: [
            { text: '[1, 2, 3] [1 2 3]' },
            { text: '[1 2 3] [1, 2, 3]', why: 'Lists print with commas; arrays print without them.' },
            { text: '[1, 2, 3] [1, 2, 3]', why: 'An array prints without commas, which is how to tell them apart.' },
          ],
          explain: 'No commas means an array: a quick way to tell what you are holding.',
        },
        {
          id: 'f4-1-5',
          type: 'fill-blank',
          prompt: 'Make a 3 by 3 array of zeros.',
          code: `Z = np.___((3, 3))
print(Z.sum())`,
          answer: ['zeros'],
          distractors: [
            { text: 'ones', why: 'That makes nine ones, which add up to 9.' },
            { text: 'array', why: '`np.array((3, 3))` makes the two numbers 3 and 3, not a 3 by 3 block.' },
          ],
          expectOutput: '0.0',
          explain: '`np.zeros(shape)` is the usual way to start an array you fill later.',
        },
        {
          id: 'f4-1-6',
          type: 'spot-bug',
          prompt: 'Which line is wrong?',
          code: `n_rows, n_cols = 2, 3
Z = np.zeros(n_rows, n_cols)
print(Z.shape)`,
          error: "TypeError: Cannot interpret '3' as a data type",
          answer: 1,
          lineWhy: {
            '0': 'Two sizes in two names is fine.',
            '2': 'Printing the shape is fine once the array exists.',
          },
          explain: 'The sizes go in one tuple: `np.zeros((n_rows, n_cols))`. A second argument is read as the type.',
        },
        {
          id: 'f4-1-7',
          type: 'mcq',
          prompt: 'Why does ML code turn lists of numbers into arrays?',
          options: [
            { text: 'Maths then applies to every number at once' },
            { text: 'Lists cannot hold decimal numbers', why: 'Lists hold decimals fine; they just do not do maths on all of them at once.' },
            { text: 'Arrays print with fewer commas than lists', why: 'That is a side effect, not the reason.' },
          ],
          answer: 0,
          explain: '`a * 2` doubles every item of an array, and runs in fast compiled code.',
        },
        {
          id: 'f4-1-8',
          type: 'run-code',
          prompt: 'Set `a` to an array of the whole numbers 0 to 9.',
          solution: 'a = np.arange(10)',
          tests: [
            'assert isinstance(a, np.ndarray), "make it a NumPy array"',
            'assert a.tolist() == list(range(10)), f"0 to 9, got {a.tolist()}"',
          ].join('\n'),
          placeholder: 'a = ...',
          explain: '`np.arange(10)` stops before 10.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'f4-02',
      title: 'Shape',
      summary: 'shape lists the size of each dimension; ndim counts them; size counts all the numbers.',
      card: {
        title: 'Shape',
        text: 'Every array has a `shape`: a tuple with one number per dimension, so a table of 2 rows and 3 columns has shape (2, 3). `ndim` is how many dimensions there are and `size` how many numbers in total. A 1-D array of 3 numbers has shape (3,), which is not the same as (1, 3).',
        code: `M = np.array([[1, 2, 3],
              [4, 5, 6]])
print(M.shape, M.ndim, M.size)`,
        output: '(2, 3) 2 6',
      },
      exercises: [
        {
          id: 'f4-2-1',
          type: 'predict-shape',
          prompt: 'Type the shape of `a`.',
          code: 'a = np.array([5, 6, 7, 8])',
          target: 'a',
          answer: '(4,)',
          typedWrong: [{ answer: '(1, 4)', why: 'One pair of brackets makes a 1-D array: shape (4,).' }],
          explain: 'A 1-D shape is written with a trailing comma: (4,).',
        },
        {
          id: 'f4-2-2',
          type: 'predict-shape',
          prompt: 'Two pairs of brackets. What is the shape of `x`?',
          code: 'x = np.array([[1, 2]])',
          target: 'x',
          answer: '(1, 2)',
          options: [
            { text: '(1, 2)' },
            { text: '(2,)', why: 'The outer brackets add a dimension: one row of two.' },
            { text: '(2, 1)', why: 'There is one inner list (one row) holding two numbers (two columns).' },
          ],
          explain: 'Count the brackets: two levels, two dimensions.',
        },
        {
          id: 'f4-2-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `M = np.zeros((4, 3))
print(M.ndim, M.size)`,
          answer: '2 12',
          options: [
            { text: '2 12' },
            { text: '2 7', why: '`size` multiplies the dimensions: 4 × 3.' },
            { text: '4 3', why: 'That is the shape. `ndim` counts dimensions (2) and `size` counts numbers (12).' },
          ],
          explain: 'Two dimensions, twelve numbers.',
        },
        {
          id: 'f4-2-4',
          type: 'mcq',
          prompt: 'A batch of 32 greyscale images, each 28 by 28 pixels, is stored the usual way. What is its shape?',
          options: [
            { text: '(32, 28, 28)' },
            { text: '(28, 28, 32)', why: 'The batch dimension comes first by convention.' },
            { text: '(32, 28)', why: 'Each image needs two dimensions of its own, so three in total.' },
          ],
          answer: 0,
          explain: 'Batch first, then the shape of one item.',
        },
        {
          id: 'f4-2-5',
          type: 'match-pairs',
          prompt: 'Match each array to its shape.',
          pairs: [
            { left: 'np.zeros(5)', right: '(5,)', why: 'One size: 1-D.' },
            { left: 'np.zeros((1, 5))', right: '(1, 5)', why: 'One row of five.' },
            { left: 'np.zeros((5, 1))', right: '(5, 1)', why: 'Five rows of one.' },
            { left: 'np.array([[1], [2]])', right: '(2, 1)', why: 'Two inner lists of one number each.' },
          ],
          verify: 'shape',
          explain: 'Same numbers, different shapes: the shape decides what operations work.',
        },
        {
          id: 'f4-2-6',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a = np.array([1, 2, 3])
b = np.array([[1, 2, 3]])
print(a.ndim, b.ndim)`,
          answer: '1 2',
          options: [
            { text: '1 2' },
            { text: '1 1', why: 'b has two levels of brackets, so two dimensions.' },
            { text: '3 3', why: '`ndim` counts dimensions, not numbers.' },
          ],
          explain: 'Same three numbers, but b is a 2-D table with one row.',
        },
        {
          id: 'f4-2-7',
          type: 'fill-blank',
          prompt: 'Unpack the number of rows and columns.',
          code: `M = np.zeros((2, 5))
rows, cols = M.___
print(rows, cols)`,
          answer: ['shape'],
          distractors: [
            { text: 'size', why: '`size` is one number (10), which cannot be unpacked into two names.' },
            { text: 'ndim', why: '`ndim` is one number (2), the count of dimensions.' },
          ],
          expectOutput: '2 5',
          explain: '`rows, cols = X.shape` is a line you will see constantly.',
        },
        {
          id: 'f4-2-8',
          type: 'run-code',
          prompt: '`X` holds one example per row. Set `n` to the number of examples, read from its shape.',
          before: 'X = np.ones((6, 3))',
          solution: 'n = X.shape[0]',
          tests: 'assert n == 6, f"X has 6 rows, got {n}"',
          placeholder: 'n = ...',
          explain: '`shape[0]` is the number of rows; `shape[1]` the number of features.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'f4-03',
      title: 'dtype',
      summary: 'All items share one dtype; mixing ints and floats gives floats; astype converts.',
      card: {
        title: 'dtype',
        text: 'Every item in an array has the same type, its `dtype`: whole numbers (such as `int64`) or decimals (such as `float64`). Mixing the two gives floats, and `astype` converts an array to another type. Models compute in floats, so integer data usually gets converted first.',
        code: `b = np.array([1, 2.5])
print(b, b.dtype)
print(b.astype(int))`,
        output: '[1.  2.5] float64\n[1 2]',
      },
      exercises: [
        {
          id: 'f4-3-1',
          type: 'predict-output',
          prompt: 'One float among ints. What does this print?',
          code: `a = np.array([1, 2, 3.0])
print(a)`,
          answer: '[1. 2. 3.]',
          options: [
            { text: '[1. 2. 3.]' },
            { text: '[1 2 3.]', why: 'All items share one dtype, so every item becomes a float.' },
            { text: '[1 2 3]', why: 'The one float turns the whole array into floats.' },
          ],
          explain: 'One float is enough to make the whole array float.',
        },
        {
          id: 'f4-3-2',
          type: 'predict-output',
          prompt: 'Putting a decimal into an integer array. What does this print?',
          code: `a = np.array([1, 2, 3])
a[0] = 2.9
print(a)`,
          answer: '[2 2 3]',
          options: [
            { text: '[2 2 3]' },
            { text: '[2.9 2.  3. ]', why: 'The array keeps its integer dtype; it does not change to fit the new value.' },
            { text: '[3 2 3]', why: 'Converting to int cuts off the decimals; it does not round.' },
          ],
          explain: 'The dtype is fixed when the array is made. 2.9 is cut to 2, silently.',
        },
        {
          id: 'f4-3-3',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `x = np.array([2.7, -1.5])
print(x.astype(int))`,
          answer: '[ 2 -1]',
          typedWrong: [{ answer: '[ 3 -2]', why: '`astype(int)` cuts toward zero; it does not round.' }],
          explain: '2.7 becomes 2 and −1.5 becomes −1: the decimals are dropped.',
        },
        {
          id: 'f4-3-4',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a = np.array([1, 2])
print((a / 2).dtype)`,
          answer: 'float64',
          options: [
            { text: 'float64' },
            { text: 'int64', why: '`/` always gives floats, even from integers (`//` keeps integers).' },
          ],
          explain: '1 / 2 is 0.5, so the result has to be float.',
        },
        {
          id: 'f4-3-5',
          type: 'fill-blank',
          prompt: 'Convert the counts to floats.',
          code: `x = np.array([1, 2, 3])
y = x.___(float)
print(y)`,
          answer: ['astype'],
          distractors: [
            { text: 'dtype', why: '`dtype` is an attribute you read, not a method you call.' },
            { text: 'reshape', why: '`reshape` changes the shape, not the type.' },
          ],
          expectOutput: '[1. 2. 3.]',
          explain: '`astype` returns a new array of the given type.',
        },
        {
          id: 'f4-3-6',
          type: 'predict-output',
          prompt: 'Image pixels are often stored as `uint8`: whole numbers from 0 to 255. What does this print?',
          code: `px = np.array([200, 100],
              dtype=np.uint8)
print(px + 100)`,
          answer: '[ 44 200]',
          options: [
            { text: '[ 44 200]' },
            { text: '[300 200]', why: '`uint8` cannot hold 300. It wraps around past 255 and starts again from 0.' },
            { text: '[255 200]', why: 'It wraps around (300 − 256 = 44); it does not stop at 255.' },
          ],
          explain: 'Convert to a wider type first, such as `px.astype(float)`, before doing maths on pixels.',
        },
        {
          id: 'f4-3-7',
          type: 'spot-bug',
          prompt: 'Which line causes the wrong value?',
          code: `w = np.zeros(3, dtype=int)
w[0] = 0.5
assert w[0] == 0.5, w`,
          error: 'AssertionError: [0 0 0]',
          answer: 0,
          raiseLine: 2,
          lineWhy: {
            '1': 'Setting a weight to 0.5 is the intent; the integer array cuts it to 0.',
            '2': 'The check is right: the weight should be 0.5.',
          },
          explain: 'Weights need floats: `np.zeros(3)` is float by default.',
        },
        {
          id: 'f4-3-8',
          type: 'run-code',
          prompt: 'Set `f` to `counts` converted to floats.',
          before: 'counts = np.array([3, 1, 4])',
          solution: 'f = counts.astype(float)',
          tests: [
            'assert f.dtype == np.float64, f"dtype should be float64, got {f.dtype}"',
            'assert f.tolist() == [3.0, 1.0, 4.0], f"same values, got {f.tolist()}"',
          ].join('\n'),
          placeholder: 'f = ...',
          explain: '`astype(float)` gives float64.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'f4-04',
      title: 'Indexing and slicing',
      summary: 'a[i] picks one item; a[start:stop:step] picks a run, stopping before stop.',
      card: {
        title: 'Indexing and slicing',
        text: '`a[i]` picks one item, counting from 0, and `a[-1]` is the last. `a[start:stop]` picks a run of items from start up to, but not including, stop; leave either out to go from the beginning or to the end. A third number is the step, so `a[::2]` takes every second item.',
        code: `a = np.array([10, 20, 30, 40, 50])
print(a[0], a[-1])
print(a[1:3], a[::2])`,
        output: '10 50\n[20 30] [10 30 50]',
      },
      exercises: [
        {
          id: 'f4-4-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a = np.array([4, 8, 15, 16, 23])
print(a[1:4])`,
          answer: '[ 8 15 16]',
          options: [
            { text: '[ 8 15 16]' },
            { text: '[ 8 15 16 23]', why: 'The stop index 4 is not included.' },
            { text: '[ 4  8 15 16]', why: 'Index 1 is the second item, 8; counting starts at 0.' },
          ],
          explain: 'Indexes 1, 2 and 3.',
        },
        {
          id: 'f4-4-2',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `a = np.array([4, 8, 15, 16, 23])
print(a[-2])`,
          answer: '16',
          typedWrong: [{ answer: '8', why: 'Negative indexes count from the end: −1 is 23, −2 is 16.' }],
          explain: 'The second from the end.',
        },
        {
          id: 'f4-4-3',
          type: 'predict-output',
          prompt: 'Split in two. What does this print?',
          code: `a = np.arange(6)
print(a[:3], a[3:])`,
          answer: '[0 1 2] [3 4 5]',
          options: [
            { text: '[0 1 2] [3 4 5]' },
            { text: '[0 1 2 3] [3 4 5]', why: '`:3` stops before index 3, so the halves do not overlap.' },
            { text: '[0 1 2] [4 5]', why: '`3:` starts at index 3, which is the value 3.' },
          ],
          explain: 'Because the stop is excluded, `a[:k]` and `a[k:]` split cleanly.',
        },
        {
          id: 'f4-4-4',
          type: 'fill-blank',
          prompt: 'Take the last three items, whatever the length.',
          code: `a = np.arange(10)
print(a[___:])`,
          answer: ['-3'],
          distractors: [
            { text: '3', why: '`3:` starts at index 3 and gives seven items.' },
            { text: '-4', why: '`-4:` gives the last four items.' },
          ],
          expectOutput: '[7 8 9]',
          explain: 'A negative start counts from the end, so it works for any length.',
        },
        {
          id: 'f4-4-5',
          type: 'predict-output',
          prompt: 'A step. What does this print?',
          code: `a = np.arange(8)
print(a[::3])`,
          answer: '[0 3 6]',
          options: [
            { text: '[0 3 6]' },
            { text: '[0 1 2]', why: 'The third slot is the step, not the stop: every third item.' },
            { text: '[3 6]', why: 'With no start given it begins at index 0.' },
          ],
          explain: 'Start at 0 and jump by 3.',
        },
        {
          id: 'f4-4-6',
          type: 'predict-output',
          prompt: 'A negative step. Type what this prints.',
          code: `a = np.array([1, 2, 3])
print(a[::-1])`,
          answer: '[3 2 1]',
          explain: 'A step of −1 walks backwards: the array reversed.',
        },
        {
          id: 'f4-4-7',
          type: 'spot-bug',
          prompt: 'Which line goes past the end?',
          code: `a = np.array([5, 6, 7])
n = len(a)
last = a[n]`,
          error: 'IndexError: index 3 is out of bounds for axis 0 with size 3',
          answer: 2,
          lineWhy: {
            '0': 'Three items is fine.',
            '1': '`len(a)` is 3, which is right; it is the count, not the last index.',
          },
          explain: 'The last index is `n - 1`, or simply `a[-1]`.',
        },
        {
          id: 'f4-4-8',
          type: 'run-code',
          prompt: 'Set `train` to the first 80 items of `xs` and `val` to the rest.',
          before: 'xs = np.arange(100)',
          solution: 'train = xs[:80]\nval = xs[80:]',
          tests: [
            'assert len(train) == 80, f"train should have 80 items, got {len(train)}"',
            'assert len(val) == 20, f"val should have the other 20, got {len(val)}"',
            'assert train[-1] == 79 and val[0] == 80, "no overlap and nothing missing"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'train = ...',
          explain: 'The same index as stop and start: a split with no gap and no overlap.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'f4-05',
      title: 'Rows and columns',
      summary: 'M[i, j] is row i, column j; M[i] is a row and M[:, j] a column.',
      card: {
        title: 'Rows and columns',
        text: 'In 2-D, `M[i, j]` is the item in row i, column j, and each slot can take a slice. `M[i]` is a whole row and `M[:, j]` a whole column, where `:` means every row. A data table usually has one row per example and one column per feature.',
        code: `M = np.array([[1, 2, 3],
              [4, 5, 6]])
print(M[1, 2], M[0])
print(M[:, 1])`,
        output: '6 [1 2 3]\n[2 5]',
      },
      exercises: [
        {
          id: 'f4-5-1',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `M = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])
print(M[2, 0])`,
          answer: '7',
          typedWrong: [{ answer: '3', why: 'The row comes first: row 2, then column 0.' }],
          explain: 'Row 2 is [7, 8, 9]; its column 0 is 7.',
        },
        {
          id: 'f4-5-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `M = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])
print(M[:, 2])`,
          answer: '[3 6 9]',
          options: [
            { text: '[3 6 9]' },
            { text: '[7 8 9]', why: 'That is row 2, `M[2]`. `M[:, 2]` is column 2 from every row.' },
            { text: '[[3]\n [6]\n [9]]', why: 'A single number in a slot removes that dimension, so the column comes back 1-D.' },
          ],
          explain: '`:` keeps every row; `2` picks the third column.',
        },
        {
          id: 'f4-5-3',
          type: 'predict-output',
          prompt: 'Slices in both slots. What does this print?',
          code: `M = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])
print(M[:2, 1:])`,
          answer: '[[2 3]\n [5 6]]',
          options: [
            { text: '[[2 3]\n [5 6]]' },
            { text: '[[1 2]\n [4 5]]', why: '`1:` starts at column 1, so column 0 is left out.' },
            { text: '[[2 3]\n [5 6]\n [8 9]]', why: '`:2` stops before row 2.' },
          ],
          explain: 'Rows 0 and 1, columns 1 to the end.',
        },
        {
          id: 'f4-5-4',
          type: 'predict-shape',
          prompt: '100 examples with 5 features. What is the shape of the first feature for every example?',
          code: 'X = np.zeros((100, 5))',
          target: 'X[:, 0]',
          answer: '(100,)',
          options: [
            { text: '(100,)' },
            { text: '(100, 1)', why: 'A single number in a slot removes that dimension, leaving 1-D.' },
            { text: '(5,)', why: 'That is one example, `X[0]`.' },
          ],
          explain: 'One value per example.',
        },
        {
          id: 'f4-5-5',
          type: 'predict-shape',
          prompt: 'What is the shape of the first ten examples?',
          code: 'X = np.zeros((100, 5))',
          target: 'X[:10]',
          answer: '(10, 5)',
          options: [
            { text: '(10, 5)' },
            { text: '(10,)', why: 'Leaving out the column slot keeps every column.' },
            { text: '(100, 10)', why: 'The first slot is rows, so `:10` takes ten rows.' },
          ],
          explain: 'A slice keeps the dimension; ten rows of five features.',
        },
        {
          id: 'f4-5-6',
          type: 'fill-blank',
          prompt: 'Take column 0 from every row.',
          code: `M = np.array([[1, 2],
              [3, 4]])
print(M[___, 0])`,
          answer: [':'],
          distractors: [
            { text: '0', why: '`M[0, 0]` is the single item in row 0, column 0.' },
            { text: '1', why: '`M[1, 0]` is the single item 3.' },
          ],
          expectOutput: '[1 3]',
          explain: '`:` means "every row".',
        },
        {
          id: 'f4-5-7',
          type: 'spot-bug',
          prompt: 'Which line asks for a column that does not exist?',
          code: `X = np.zeros((4, 3))
ages = X[:, 3]
print(ages.mean())`,
          error: 'IndexError: index 3 is out of bounds for axis 1 with size 3',
          answer: 1,
          lineWhy: {
            '0': 'Four examples with three features is fine.',
            '2': 'Averaging a column is fine once the index is right.',
          },
          explain: 'Three columns are numbered 0, 1 and 2. "axis 1" in the error means the column slot.',
        },
        {
          id: 'f4-5-8',
          type: 'run-code',
          prompt: 'Set `last_feature` to the last column of `X`.',
          before: `X = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])`,
          solution: 'last_feature = X[:, -1]',
          tests: 'assert np.asarray(last_feature).tolist() == [3, 6, 9], f"column 2 for every row is [3, 6, 9], got {last_feature}"',
          placeholder: 'last_feature = ...',
          explain: '`-1` works in any slot.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'f4-06',
      title: 'Views and copies',
      summary: 'A slice shares memory with its array; change one and the other changes. .copy() makes it independent.',
      card: {
        title: 'Views and copies',
        text: 'A slice of an array is a view: it shares memory with the original, so changing the slice changes the original too. Call `.copy()` when you want an independent array. Slices of plain Python lists are copies, which is why this catches people out.',
        code: `a = np.array([1, 2, 3, 4])
s = a[:2]
s[0] = 99
print(a)`,
        output: '[99  2  3  4]',
      },
      exercises: [
        {
          id: 'f4-6-1',
          type: 'predict-output',
          prompt: 'With `.copy()`. What does this print?',
          code: `a = np.array([1, 2, 3])
s = a[1:].copy()
s[0] = 0
print(a)`,
          answer: '[1 2 3]',
          options: [
            { text: '[1 2 3]' },
            { text: '[1 0 3]', why: '`.copy()` made s independent, so a is untouched.' },
            { text: '[0 2 3]', why: 's started at index 1, and anyway it is a copy.' },
          ],
          explain: 'A copy has its own memory.',
        },
        {
          id: 'f4-6-2',
          type: 'predict-output',
          prompt: 'Plain lists this time. What does this print?',
          code: `a = [1, 2, 3]
s = a[:2]
s[0] = 9
print(a)`,
          answer: '[1, 2, 3]',
          options: [
            { text: '[1, 2, 3]' },
            { text: '[9, 2, 3]', why: 'List slices are copies; only NumPy slices are views.' },
          ],
          explain: 'The same line behaves differently for lists and arrays.',
        },
        {
          id: 'f4-6-3',
          type: 'predict-output',
          prompt: 'A row is a view too. Type what this prints.',
          code: `M = np.zeros((2, 2))
row = M[0]
row[:] = 5
print(M.sum())`,
          answer: '10.0',
          typedWrong: [{ answer: '0.0', why: '`row` is a view of M\'s first row, so filling it fills M.' }],
          explain: 'Row 0 became [5, 5]: the sum is 10.',
        },
        {
          id: 'f4-6-4',
          type: 'mcq',
          prompt: '`batch = X[:32]`, then `batch /= 10` scales the batch in place. What happens to `X`?',
          options: [
            { text: 'Its first 32 rows change too' },
            { text: 'Nothing: batch is a separate array', why: 'A slice is a view, so it shares X\'s memory.' },
            { text: 'An error: views cannot be changed', why: 'Views can be written to, and the writes land in X.' },
          ],
          answer: 0,
          explain: 'In-place changes through a view change the original data.',
        },
        {
          id: 'f4-6-5',
          type: 'spot-bug',
          prompt: 'Which line should make a copy?',
          code: `orig = np.array([5, 6, 7])
work = orig[:]
work[0] = 0
assert orig[0] == 5, orig`,
          error: 'AssertionError: [0 6 7]',
          answer: 1,
          raiseLine: 3,
          lineWhy: {
            '0': 'The original data is fine.',
            '2': 'Changing the working array is the point; it should not reach orig.',
            '3': 'The check is right: orig should be untouched.',
          },
          explain: '`orig[:]` is a view in NumPy. Use `orig.copy()`.',
        },
        {
          id: 'f4-6-6',
          type: 'fill-blank',
          prompt: 'Make `b` independent of `a`.',
          code: `a = np.array([1, 2, 3])
b = a.___()
b[0] = 7
print(a[0], b[0])`,
          answer: ['copy'],
          distractors: [
            { text: 'view', why: '`view()` shares memory, so a would change to 7 too.' },
            { text: 'ravel', why: '`ravel()` flattens, and for an array like this returns a view.' },
          ],
          expectOutput: '1 7',
          explain: 'Only the copy leaves a alone.',
        },
        {
          id: 'f4-6-7',
          type: 'predict-output',
          prompt: 'Plain assignment. What does this print?',
          code: `a = np.array([1, 2])
b = a
b += 1
print(a)`,
          answer: '[2 3]',
          options: [
            { text: '[2 3]' },
            { text: '[1 2]', why: '`b = a` gives the same array a second name; nothing is copied.' },
          ],
          explain: 'Assignment never copies, for any Python object.',
        },
        {
          id: 'f4-6-8',
          type: 'run-code',
          prompt: 'Set `Y` to an independent copy of `X`, then set `Y[0]` to 0. `X` must not change.',
          before: 'X = np.array([3.0, 4.0])',
          solution: 'Y = X.copy()\nY[0] = 0',
          tests: [
            'assert X[0] == 3.0, f"X changed: {X}"',
            'assert Y.tolist() == [0.0, 4.0], f"Y should be [0, 4], got {Y}"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'Y = ...',
          explain: 'Copy first, then change.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'f4-07',
      title: 'Boolean masks',
      summary: 'A comparison gives a mask of True/False; indexing with it keeps the True items.',
      card: {
        title: 'Boolean masks',
        text: 'Comparing an array with a value gives an array of True and False, one per item: a mask. Indexing with the mask keeps the items where it is True, and `mask.sum()` counts them. Combine masks with `&` (and) or `|` (or), with brackets around each comparison.',
        code: `a = np.array([3, 8, 1, 9])
mask = a > 5
print(mask)
print(a[mask], mask.sum())`,
        output: '[False  True False  True]\n[8 9] 2',
      },
      exercises: [
        {
          id: 'f4-7-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `a = np.array([4, 7, 2, 9])
print(a[a > 4])`,
          answer: '[7 9]',
          options: [
            { text: '[7 9]' },
            { text: '[False  True False  True]', why: 'That is the mask itself; indexing with it keeps the values.' },
            { text: '[4 7 9]', why: '`>` is strict: 4 is not greater than 4.' },
          ],
          explain: 'Keep the items where the mask is True.',
        },
        {
          id: 'f4-7-2',
          type: 'predict-output',
          prompt: 'Count with a mask. Type what this prints.',
          code: `p = np.array([0.2, 0.9, 0.7])
print((p > 0.5).sum())`,
          answer: '2',
          explain: 'True counts as 1 and False as 0, so the sum counts the Trues.',
        },
        {
          id: 'f4-7-3',
          type: 'predict-output',
          prompt: 'Two conditions. What does this print?',
          code: `a = np.array([1, 5, 8, 12])
print(a[(a > 2) & (a < 10)])`,
          answer: '[5 8]',
          options: [
            { text: '[5 8]' },
            { text: '[ 5  8 12]', why: '`&` needs both: 12 fails `a < 10`.' },
            { text: '[ 1  5  8 12]', why: '`&` keeps only items passing both tests; `|` would keep either.' },
          ],
          explain: 'Between 2 and 10.',
        },
        {
          id: 'f4-7-4',
          type: 'spot-bug',
          prompt: 'Which line is wrong?',
          code: `a = np.array([1, 5, 8])
keep = a > 2 & a < 10
print(a[keep])`,
          error: 'ValueError: The truth value of an array with more than one element is ambiguous. Use a.any() or a.all()',
          answer: 1,
          lineWhy: {
            '0': 'The data is fine.',
            '2': 'Indexing with a mask is right once the mask is built.',
          },
          explain: '`&` binds tighter than `>`, so it runs `2 & a` first. Write `(a > 2) & (a < 10)`.',
        },
        {
          id: 'f4-7-5',
          type: 'fill-blank',
          prompt: 'Replace the negative values with 0.',
          code: `a = np.array([3, -1, 4, -5])
a[a ___ 0] = 0
print(a)`,
          answer: ['<'],
          distractors: [
            { text: '>', why: 'That zeroes the positive values instead.' },
            { text: '==', why: 'That only touches values already equal to 0.' },
          ],
          expectOutput: '[3 0 4 0]',
          explain: 'Assigning through a mask changes only the selected items.',
        },
        {
          id: 'f4-7-6',
          type: 'predict-output',
          prompt: 'Accuracy in one line. What does this print?',
          code: `pred = np.array([1, 0, 1, 1])
y = np.array([1, 1, 1, 0])
print((pred == y).mean())`,
          answer: '0.5',
          options: [
            { text: '0.5' },
            { text: '2', why: '`mean`, not `sum`: 2 right out of 4.' },
            { text: '0.75', why: 'Only positions 0 and 2 match: 2 out of 4.' },
          ],
          explain: 'The mean of a mask is the fraction that is True.',
        },
        {
          id: 'f4-7-7',
          type: 'mcq',
          prompt: '`(a > 2) and (a < 10)` raises an error on an array. Why does `&` work?',
          options: [
            { text: '`&` combines the masks item by item' },
            { text: '`and` is too slow for arrays', why: 'Speed is not the issue: `and` needs one True or False, and an array has many.' },
            { text: '`&` sorts the arrays first', why: '`&` sorts nothing; it pairs up the two masks item by item.' },
          ],
          answer: 0,
          explain: '`and` asks "is this whole array true?", which has no single answer.',
        },
        {
          id: 'f4-7-8',
          type: 'run-code',
          prompt: 'Set `adults` to the ages that are 18 or over.',
          before: 'ages = np.array([15, 22, 37, 9, 41])',
          solution: 'adults = ages[ages >= 18]',
          tests: 'assert np.asarray(adults).tolist() == [22, 37, 41], f"got {adults}"',
          placeholder: 'adults = ...',
          explain: 'Compare, then index with the mask.',
        },
      ],
    },

    ...f4More,
  ],
  labs: f4Labs,
  library: f4Library,
};
