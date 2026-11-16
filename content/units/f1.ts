import { f1Labs } from '../labs/f1';
import { f1Library } from '../library/f1';
import type { Unit } from '../schema';
import { f1More } from './f1-more';

export const f1: Unit = {
  id: 'F1',
  track: 'foundations',
  title: 'Python you will see in ML code',
  blurb: 'The Python patterns that fill ML code: slicing, comprehensions, dicts, classes, tracebacks.',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'f1-01',
      title: 'Slicing',
      summary: '`xs[a:b]` takes items from position a up to, but not including, b.',
      card: {
        title: 'Slicing',
        text: '`xs[a:b]` takes the items from position a up to, but not including, position b. Leave out a to start at the beginning, or b to run to the end. Negative numbers count from the end.',
        code: `xs = [10, 20, 30, 40, 50]
print(xs[1:3])
print(xs[:2])
print(xs[-2:])`,
        output: '[20, 30]\n[10, 20]\n[40, 50]',
      },
      exercises: [
        {
          id: 'f1-1-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `xs = [5, 6, 7, 8, 9]
print(xs[2:4])`,
          answer: '[7, 8]',
          options: [
            { text: '[7, 8]' },
            { text: '[6, 7, 8]', why: 'Positions count from 0, so position 2 is 7, not 6.' },
            { text: '[7, 8, 9]', why: 'The end position is not included: `2:4` stops before position 4 (the 9).' },
          ],
          explain: 'Positions 2 and 3 are 7 and 8; position 4 is the stop and is left out.',
        },
        {
          id: 'f1-1-2',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `xs = [5, 6, 7, 8, 9]
print(xs[:3])`,
          answer: '[5, 6, 7]',
          typedWrong: [{ answer: '[5, 6, 7, 8]', why: 'The stop is not included: `:3` gives positions 0, 1 and 2.' }],
          explain: 'Start at the beginning, stop before position 3: three items.',
        },
        {
          id: 'f1-1-3',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `xs = [5, 6, 7, 8, 9]
print(xs[-3:])`,
          answer: '[7, 8, 9]',
          typedWrong: [
            { answer: '[5, 6, 7]', why: 'Negative numbers count from the end: -3 is the third item from the end, the 7.' },
            { answer: '[8, 9]', why: '-3 is three from the end (7), and the slice runs to the end, so you get three items.' },
          ],
          explain: '-3 is the third from the end (7), and with no stop it runs to the end.',
        },
        {
          id: 'f1-1-4',
          type: 'fill-blank',
          prompt: 'Take the first two items.',
          code: `xs = [5, 6, 7, 8, 9]
first_two = xs[___]
print(first_two)`,
          answer: [':2'],
          distractors: [
            { text: '0:1', why: '`0:1` stops before position 1, so it gives only one item: [5].' },
            { text: '1:2', why: 'Position 1 is the second item. `1:2` gives just [6].' },
            { text: '2:', why: '`2:` starts at position 2 and runs to the end: [7, 8, 9].' },
          ],
          expectOutput: '[5, 6]',
          explain: '`:2` starts at the beginning and stops before position 2.',
        },
        {
          id: 'f1-1-5',
          type: 'spot-bug',
          prompt: 'Which line raises this error?',
          code: `xs = [3, 1, 4]
first = xs[0]
last = xs[3]
print(first, last)`,
          error: 'IndexError: list index out of range',
          answer: 2,
          lineWhy: {
            '0': 'Making a list cannot fail.',
            '1': 'Position 0 is the first item (3), which exists.',
            '3': 'Python never gets here: the program stops at the line before.',
          },
          explain: 'Three items sit at positions 0, 1 and 2. Position 3 does not exist; `xs[-1]` is the safe way to get the last.',
        },
        {
          id: 'f1-1-6',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `xs = [5, 6, 7]
print(xs[1:1])`,
          answer: '[]',
          options: [
            { text: '[]' },
            { text: '[6]', why: 'The slice stops before position 1, and it also starts there, so it takes nothing.' },
            { text: 'IndexError', why: 'Slices never raise IndexError. A slice that covers nothing is just an empty list.' },
          ],
          explain: 'Start and stop are equal, so the slice is empty.',
        },
        {
          id: 'f1-1-7',
          type: 'match-pairs',
          prompt: 'Match each slice to its result.',
          setup: `xs = ['a', 'b', 'c', 'd']`,
          pairs: [
            { left: 'xs[1:]', right: "['b', 'c', 'd']", why: 'From position 1 to the end.' },
            { left: 'xs[:1]', right: "['a']", why: 'From the start, stopping before position 1.' },
            { left: 'xs[-1:]', right: "['d']", why: 'From the last item to the end.' },
            { left: 'xs[1:3]', right: "['b', 'c']", why: 'Positions 1 and 2; 3 is the stop.' },
          ],
          verify: 'equal',
        },
        {
          id: 'f1-1-8',
          type: 'run-code',
          prompt: 'Store the last three items of `xs` in `tail`.',
          before: 'xs = [4, 8, 15, 16, 23, 42]',
          solution: 'tail = xs[-3:]',
          tests: `assert tail == [16, 23, 42], f"tail is {tail}, expected the last three items [16, 23, 42]"`,
          placeholder: 'tail = ',
          explain: '`xs[-3:]` starts three from the end and runs to the end. `xs[3:]` also works for this list.',
        },
        {
          id: 'f1-1-9',
          type: 'predict-output',
          prompt: 'Strings slice the same way. Type what this prints.',
          code: `word = "python"
print(word[1:4])`,
          answer: 'yth',
          typedWrong: [
            { answer: 'pyt', why: 'Positions start at 0, so position 1 is the "y".' },
            { answer: 'ytho', why: 'The stop (position 4, the "o") is not included.' },
          ],
          explain: 'Positions 1, 2, 3 are y, t, h.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'f1-02',
      title: 'List comprehensions',
      summary: '`[expr for x in xs]` builds a new list by computing `expr` for each item.',
      card: {
        title: 'List comprehensions',
        text: '`[expr for x in xs]` builds a new list by computing `expr` once for each item. It is a for-loop that appends, written in one line.',
        code: `xs = [1, 2, 3]
print([x * 10 for x in xs])`,
        output: '[10, 20, 30]',
      },
      exercises: [
        {
          id: 'f1-2-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `print([x + 1 for x in [3, 5]])`,
          answer: '[4, 6]',
          options: [
            { text: '[4, 6]' },
            { text: '[3, 5, 1]', why: 'A comprehension does not add an item; it computes `x + 1` for each x.' },
            { text: '10', why: 'You get a list, one result per item, not a single total.' },
          ],
          explain: '3 + 1 and 5 + 1.',
        },
        {
          id: 'f1-2-2',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `print([x * x for x in range(4)])`,
          answer: '[0, 1, 4, 9]',
          typedWrong: [{ answer: '[1, 4, 9, 16]', why: '`range(4)` is 0, 1, 2, 3: it starts at 0 and stops before 4.' }],
          explain: 'Squares of 0, 1, 2, 3.',
        },
        {
          id: 'f1-2-3',
          type: 'order-lines',
          prompt: 'Order the lines into the loop that does the same as `[x * 2 for x in [1, 2, 3]]`.',
          lines: [
            { text: 'out = []' },
            { text: 'for x in [1, 2, 3]:' },
            { text: '    out.append(x * 2)' },
            { text: 'print(out)' },
          ],
          expectOutput: '[2, 4, 6]',
          explain: 'The list must exist before appending, the append goes inside the loop, and the print comes after it.',
        },
        {
          id: 'f1-2-4',
          type: 'fill-blank',
          prompt: 'Get the length of each word.',
          code: `words = ["cat", "horse"]
lengths = [___ for w in words]
print(lengths)`,
          answer: ['len(w)'],
          distractors: [
            { text: 'len(words)', why: 'That is the length of the whole list (2), computed again for each word: [2, 2].' },
            { text: 'w', why: 'That copies the words themselves: [\'cat\', \'horse\'].' },
          ],
          expectOutput: '[3, 5]',
          explain: 'The expression uses the loop variable w, the current word.',
        },
        {
          id: 'f1-2-5',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `print([str(n) for n in [1, 2]])`,
          answer: "['1', '2']",
          options: [
            { text: "['1', '2']" },
            { text: '[1, 2]', why: '`str(n)` turns each number into text, and Python shows text in quotes inside a list.' },
            { text: "'12'", why: 'A comprehension builds a list, one item per input; it does not join them.' },
          ],
          explain: 'Each number becomes a string.',
        },
        {
          id: 'f1-2-6',
          type: 'spot-bug',
          prompt: 'Which line raises this error?',
          code: `xs = [1, 2, 3]
ys = [x * 2 for x in xs]
print(x)`,
          error: "NameError: name 'x' is not defined",
          answer: 2,
          lineWhy: {
            '0': 'Making a list cannot fail.',
            '1': 'The comprehension works; x exists only inside it.',
          },
          explain: 'The loop variable of a comprehension does not exist after it. Print `ys` instead.',
        },
        {
          id: 'f1-2-7',
          type: 'run-code',
          prompt: 'Make `squares` hold the square of every number in `nums`.',
          before: 'nums = [2, 3, 4]',
          solution: 'squares = [n * n for n in nums]',
          tests: `assert squares == [4, 9, 16], f"squares is {squares}, expected [4, 9, 16]"`,
          placeholder: 'squares = ',
          explain: '`[n * n for n in nums]` computes n × n once for each n.',
        },
        {
          id: 'f1-2-8',
          type: 'match-pairs',
          prompt: 'Match each comprehension to its result.',
          pairs: [
            { left: '[x * 2 for x in [1, 2]]', right: '[2, 4]', why: 'Each item doubled.' },
            { left: '[x - 1 for x in [1, 2]]', right: '[0, 1]', why: 'One taken from each item.' },
            { left: '[0 for x in [1, 2]]', right: '[0, 0]', why: 'The expression ignores x, so every result is 0.' },
            { left: '[x for x in [1, 2]]', right: '[1, 2]', why: 'Each item unchanged: a copy of the list.' },
          ],
          verify: 'equal',
        },
        {
          id: 'f1-2-9',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `print(len([x for x in range(5)]))`,
          answer: '5',
          typedWrong: [{ answer: '4', why: '`range(5)` is 0 to 4: that is five numbers.' }],
          explain: 'One item per number in `range(5)`: five items.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'f1-03',
      title: 'Dictionaries',
      summary: '`d[key]` reads a value; `d[key] = value` adds or replaces one.',
      card: {
        title: 'Dictionaries',
        text: 'A dict stores values under names called keys. `d[key]` reads a value, and `d[key] = value` adds or replaces one. ML code keeps settings and results this way.',
        code: `cfg = {"lr": 0.01, "epochs": 5}
cfg["epochs"] = 10
print(cfg["lr"], cfg["epochs"])`,
        output: '0.01 10',
      },
      exercises: [
        {
          id: 'f1-3-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `scores = {"a": 3, "b": 7}
print(scores["b"])`,
          answer: '7',
          options: [
            { text: '7' },
            { text: '3', why: '3 is stored under "a". The lookup asks for "b".' },
            { text: 'b', why: '`scores["b"]` gives the value stored under the key, not the key.' },
          ],
          explain: 'The value stored under "b" is 7.',
        },
        {
          id: 'f1-3-2',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `d = {"x": 1}
d["x"] = 5
print(d["x"])`,
          answer: '5',
          typedWrong: [{ answer: '1', why: 'Assigning to an existing key replaces its value.' }],
          explain: 'The second line replaces the value under "x".',
        },
        {
          id: 'f1-3-3',
          type: 'spot-bug',
          prompt: 'Which line raises this error?',
          code: `cfg = {"lr": 0.1, "batch": 32}
size = cfg["batch_size"]
print(size)`,
          error: "KeyError: 'batch_size'",
          answer: 1,
          lineWhy: {
            '0': 'Making a dict cannot fail.',
            '2': 'Python never gets here: the program stops at the line before.',
          },
          explain: 'A KeyError names the missing key. The dict has "batch", not "batch_size".',
        },
        {
          id: 'f1-3-4',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `d = {"a": 1}
d["b"] = 2
print(d)`,
          answer: "{'a': 1, 'b': 2}",
          options: [
            { text: "{'a': 1, 'b': 2}" },
            { text: "{'b': 2}", why: 'Assigning a new key adds it; the existing "a" stays.' },
            { text: 'KeyError', why: 'Reading a missing key raises KeyError, but assigning to one simply adds it.' },
          ],
          explain: 'A new key is added next to the old one.',
        },
        {
          id: 'f1-3-5',
          type: 'predict-output',
          prompt: 'The same key appears twice. Type what this prints.',
          code: `d = {"k": 1, "k": 2}
print(d["k"])`,
          answer: '2',
          typedWrong: [{ answer: '1', why: 'A key can only hold one value. The later "k": 2 replaces the earlier one.' }],
          explain: 'Each key appears once in a dict; the last value written wins.',
        },
        {
          id: 'f1-3-6',
          type: 'fill-blank',
          prompt: 'Add an "epochs" setting of 3.',
          code: `cfg = {"lr": 0.1}
cfg[___] = ___
print(cfg)`,
          answer: ['"epochs"', '3'],
          distractors: [
            { text: 'epochs', why: 'Without quotes Python looks for a variable named epochs and raises NameError. Keys here are strings.' },
            { text: '"3"', why: 'That stores the text "3", not the number 3, and it prints with quotes.' },
          ],
          expectOutput: "{'lr': 0.1, 'epochs': 3}",
          explain: 'The key is the string "epochs"; the value is the number 3.',
        },
        {
          id: 'f1-3-7',
          type: 'run-code',
          prompt: 'Add one to the count stored under "dog".',
          before: 'counts = {"cat": 2, "dog": 1}',
          solution: 'counts["dog"] += 1',
          tests: `assert counts["dog"] == 2, f"counts['dog'] is {counts['dog']}, expected 2"
assert counts["cat"] == 2, "counts['cat'] should not change"`,
          placeholder: 'counts["dog"]',
          explain: '`counts["dog"] += 1` reads the value, adds one, and stores it back.',
        },
        {
          id: 'f1-3-8',
          type: 'match-pairs',
          prompt: 'Match each expression to its value.',
          setup: `d = {"a": 1, "b": 2}`,
          pairs: [
            { left: 'd["a"]', right: '1', why: 'The value stored under "a".' },
            { left: 'd["b"] * 5', right: '10', why: 'The value under "b" (2), times 5.' },
            { left: 'd["a"] + d["b"]', right: '3', why: 'The two values added: 1 + 2.' },
            { left: 'list(d)', right: "['a', 'b']", why: 'Turning a dict into a list gives its keys.' },
          ],
          verify: 'equal',
        },
      ],
    },
    ...f1More,
  ],
  labs: f1Labs,
  library: f1Library,
};
