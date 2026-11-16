import type { Lab } from '../schema';

/*
 * Unit F1 labs. Lab 1 builds a tiny dataset class (the shape PyTorch's
 * Dataset uses: __len__ and __getitem__) and a subclass with super();
 * lab 2 starts every step from an empty function: training-loop helpers.
 */
export const f1Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'f1-lab-1',
    title: 'A tiny dataset class',
    intro:
      'Build the kind of class every training script starts with: a dataset that knows its length and hands out examples by index, then batches, a subclass that cleans the text, and a label count.',
    summary: 'You built a dataset class with __len__ and __getitem__, batched it, extended it with a subclass, and counted its labels.',
    minutes: 12,
    unlockAfter: 'f1-08',
    given: [
      'DATA = [',
      '    ("Good movie", 1),',
      '    ("Bad plot", 0),',
      '    ("Great CAST", 1),',
      '    ("Dull", 0),',
      '    ("Loved it", 1),',
      ']',
    ].join('\n'),
    steps: [
      {
        goal: 'Finish `TextDataset`: store the pairs on `self`, report how many there are, and return pair `i` by index.',
        starter:
          'class TextDataset:\n    def __init__(self, pairs):\n        ___\n\n    def __len__(self):\n        return len(self.pairs)\n\n    def __getitem__(self, i):\n        return ___',
        solution:
          'class TextDataset:\n    def __init__(self, pairs):\n        self.pairs = pairs\n\n    def __len__(self):\n        return len(self.pairs)\n\n    def __getitem__(self, i):\n        return self.pairs[i]',
        tests: [
          'ds = TextDataset(DATA)',
          'assert len(ds) == 5, f"5 examples, got {len(ds)}"',
          'assert ds[0] == ("Good movie", 1), f"ds[0] should be the first pair, got {ds[0]!r}"',
          'assert ds[-1] == ("Loved it", 1), "negative indexes work too"',
        ].join('\n'),
        hints: [
          'Save the list as `self.pairs` in `__init__`; `__getitem__` indexes into it.',
          'class TextDataset:\n    def __init__(self, pairs):\n        self.___ = pairs\n\n    def __len__(self):\n        return len(self.pairs)\n\n    def __getitem__(self, i):\n        return self.pairs[___]',
        ],
        explain: '`len(ds)` calls `__len__` and `ds[i]` calls `__getitem__`: the same two methods a PyTorch Dataset needs.',
      },
      {
        goal: 'Write `batches(ds, k)`: the dataset\'s pairs in lists of `k` (the last batch may be shorter).',
        starter: 'def batches(ds, k):\n    n = len(ds)\n    return [___\n            for i in range(0, n, k)]',
        solution: 'def batches(ds, k):\n    n = len(ds)\n    return [ds.pairs[i:i + k]\n            for i in range(0, n, k)]',
        tests: [
          'b = batches(TextDataset(DATA), 2)',
          'assert len(b) == 3, f"5 items in batches of 2: 3 batches, got {len(b)}"',
          'assert b[0] == [("Good movie", 1), ("Bad plot", 0)], f"first batch wrong: {b[0]}"',
          'assert b[-1] == [("Loved it", 1)], f"the last batch holds the leftover item, got {b[-1]}"',
        ].join('\n'),
        hints: [
          'Each batch is a slice of the pairs from i to i + k.',
          'def batches(ds, k):\n    n = len(ds)\n    return [ds.pairs[i:___]\n            for i in range(0, n, ___)]',
        ],
        explain: 'Slicing past the end is safe, so the last short batch needs no special case.',
      },
      {
        goal: 'Write `class Lowercase(TextDataset)`: its `__getitem__` gets the pair from the parent with `super()`, and returns the text lower-cased.',
        starter: 'class Lowercase(TextDataset):\n    def __getitem__(self, i):\n        pair = ___\n        text, label = pair\n        return text.lower(), label',
        solution: 'class Lowercase(TextDataset):\n    def __getitem__(self, i):\n        pair = super().__getitem__(i)\n        text, label = pair\n        return text.lower(), label',
        tests: [
          'ds = Lowercase(DATA)',
          'assert ds[2] == ("great cast", 1), f"text should be lower-cased, got {ds[2]!r}"',
          'assert len(ds) == 5, "__len__ is inherited from TextDataset"',
          'assert isinstance(ds, TextDataset), "a Lowercase is a TextDataset"',
        ].join('\n'),
        hints: [
          '`super().__getitem__(i)` runs TextDataset\'s version and gives back the (text, label) pair.',
          'class Lowercase(TextDataset):\n    def __getitem__(self, i):\n        pair = super().___(i)\n        text, label = pair\n        return text.lower(), ___',
        ],
        explain: 'The subclass reuses the parent and changes one thing: the same move as building a model on nn.Module.',
      },
      {
        goal: 'Write `label_counts(ds)`: a dict from each label to how many examples have it.',
        starter: 'def label_counts(ds):\n    ___',
        solution: 'def label_counts(ds):\n    counts = {}\n    for i in range(len(ds)):\n        _, label = ds[i]\n        n = counts.get(label, 0)\n        counts[label] = n + 1\n    return counts',
        tests: [
          'c = label_counts(TextDataset(DATA))',
          'assert c == {1: 3, 0: 2}, f"three 1s and two 0s, got {c}"',
          'assert label_counts(TextDataset([])) == {}, "an empty dataset has no labels"',
        ].join('\n'),
        hints: [
          'Loop over the indexes, unpack each pair, and add one to that label\'s count with `.get(label, 0)`.',
          'def label_counts(ds):\n    counts = {}\n    for i in range(len(ds)):\n        _, label = ds[___]\n        n = counts.get(label, ___)\n        counts[label] = n + 1\n    return counts',
        ],
        explain: 'Checking the label balance is the first thing to do with any new dataset (unit E5).',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'f1-lab-2',
    title: 'Training-loop helpers',
    intro:
      'Write the small helpers every training script grows: a config merge that rejects typos, a log line, a train/validation split, and a traceback reader. Every step starts from an empty function.',
    summary: 'You wrote training-loop helpers with **kwargs, f-strings, slicing and string parsing: the everyday Python of ML code.',
    minutes: 12,
    unlockAfter: 'f1-12',
    steps: [
      {
        goal: 'Write `merge(defaults, **overrides)`: a new dict with the overrides applied; raise `KeyError` for any override that is not in the defaults (a typo).',
        starter: 'def merge(defaults, **overrides):\n    pass',
        solution:
          'def merge(defaults, **overrides):\n    for k in overrides:\n        if k not in defaults:\n            raise KeyError(k)\n    return {**defaults, **overrides}',
        tests: [
          'base = {"lr": 0.01, "epochs": 10}',
          'got = merge(base, lr=0.1)',
          'assert got == {"lr": 0.1, "epochs": 10}, f"got {got}"',
          'assert base == {"lr": 0.01, "epochs": 10}, "do not change the defaults dict"',
          'try:',
          '    merge(base, epocs=3)',
          '    raise AssertionError("a misspelt option should raise KeyError")',
          'except KeyError:',
          '    pass',
        ].join('\n'),
        hints: [
          'Check every override key is known, then build a new dict: `{**defaults, **overrides}`.',
          'def merge(defaults, **overrides):\n    for k in overrides:\n        if k not in ___:\n            raise KeyError(k)\n    return {**defaults, **___}',
        ],
        explain: 'Catching a typo like `epocs=3` early beats training for an hour with the default.',
      },
      {
        goal: 'Write `log_line(step, **metrics)`: like "step 3: acc=0.90 loss=0.12", metrics in alphabetical order with 2 decimals.',
        starter: 'def log_line(step, **metrics):\n    pass',
        solution:
          'def log_line(step, **metrics):\n    items = sorted(metrics.items())\n    parts = [f"{k}={v:.2f}"\n             for k, v in items]\n    head = f"step {step}: "\n    return head + " ".join(parts)',
        tests: [
          'got = log_line(3, loss=0.1234, acc=0.9)',
          'assert got == "step 3: acc=0.90 loss=0.12", f"got {got!r}"',
          'assert log_line(1) == "step 1: ", "no metrics: just the prefix"',
        ].join('\n'),
        hints: [
          'Sort the metric items, format each as `name=value` with `:.2f`, and join them with spaces.',
          'def log_line(step, **metrics):\n    items = sorted(metrics.___())\n    parts = [f"{k}={v:___}"\n             for k, v in items]\n    head = f"step {step}: "\n    return head + " ".join(parts)',
        ],
      },
      {
        goal: 'Write `split(xs, frac)`: the first `int(len(xs) * frac)` items as training data and the rest as validation, returned as a tuple.',
        starter: 'def split(xs, frac):\n    pass',
        solution: 'def split(xs, frac):\n    k = int(len(xs) * frac)\n    return xs[:k], xs[k:]',
        tests: [
          'tr, va = split(list(range(10)), 0.8)',
          'assert tr == list(range(8)) and va == [8, 9], f"got {tr}, {va}"',
          'tr, va = split([1, 2, 3], 0.5)',
          'assert tr == [1] and va == [2, 3], f"int(1.5) is 1; got {tr}, {va}"',
          'assert not set(tr) & set(va), "the two parts must not overlap"',
        ].join('\n'),
        hints: [
          'Work out the cut point, then slice up to it and from it.',
          'def split(xs, frac):\n    k = int(len(xs) * ___)\n    return xs[:k], xs[___:]',
        ],
        explain: 'Slicing at one point guarantees no overlap: no leakage between training and validation (unit E5).',
      },
      {
        goal: 'Write `failing_line(tb)`: from a traceback\'s text, the file name and line number (an int) of its last frame.',
        starter: 'def failing_line(tb):\n    pass',
        solution:
          'def failing_line(tb):\n    lines = tb.splitlines()\n    frames = [l.strip() for l in lines\n              if "File" in l]\n    last = frames[-1]\n    name = last.split(\'"\')[1]\n    tail = last.split("line ")[1]\n    num = tail.split(",")[0]\n    return name, int(num)',
        tests: [
          'tb = """Traceback (most recent call last):',
          '  File "train.py", line 30, in <module>',
          '    main()',
          '  File "model.py", line 12, in forward',
          '    return x @ self.w',
          'ValueError: shapes not aligned"""',
          'got = failing_line(tb)',
          'assert got == ("model.py", 12), f"the last frame is model.py line 12, got {got!r}"',
        ].join('\n'),
        hints: [
          'Keep the lines that contain "File", take the last, and pull out the quoted name and the number after "line ".',
          'def failing_line(tb):\n    lines = tb.splitlines()\n    frames = [l.strip() for l in lines\n              if ___ in l]\n    last = frames[-1]\n    name = last.split(\'"\')[1]\n    tail = last.split("line ")[1]\n    num = tail.split(",")[0]\n    return name, ___(num)',
        ],
        explain: 'The last frame is where the error was raised; walk up from it to your own code.',
      },
    ],
  },
];
