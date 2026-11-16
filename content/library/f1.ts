import type { LibraryPage } from '../schema';

/** Unit F1 summary page: unlocked in the Library when the unit is finished. */
export const f1Library: LibraryPage = {
  unit: 'F1',
  ideas: [
    {
      title: 'Slices, comprehensions and dicts',
      text: '`xs[a:b]` takes positions a up to (not including) b; negative numbers count from the end, and slicing past the end is safe. `[f(x) for x in xs if cond]` builds a list in one line. Dicts map keys to values; `d.get(k, default)` avoids a KeyError, and `for k, v in d.items()` walks both.',
    },
    {
      title: 'Unpacking, zip and enumerate',
      text: '`a, b = pair` and `first, *rest = xs` unpack. `zip(xs, ys)` walks lists side by side and silently stops at the shortest; `enumerate(xs, 1)` adds a counter. `for i, (x, y) in enumerate(zip(xs, ys))` is in almost every training loop.',
    },
    {
      title: 'Arguments',
      text: 'Defaults make arguments optional and keywords name them, so you change only what you need. `*args` and `**kwargs` collect extras into a tuple and a dict; at a call, `*xs` and `**opts` spread them back out. Never use a mutable default such as `[]`.',
    },
    {
      title: 'Classes, self and super()',
      text: '`__init__` sets up each new object on `self`; methods take `self` first. `__len__` and `__getitem__` make `len(obj)` and `obj[i]` work, which is all a dataset needs. A subclass reuses its parent and calls `super().__init__()` first, as every PyTorch model does with `nn.Module`.',
    },
    {
      title: 'Imports and hints',
      text: '`import numpy as np` is the convention; `from m import name` brings one name in. Code under `if __name__ == "__main__":` runs only when the file is run directly. Hints such as `list[dict[str, int]]` and `Tensor | None` are documentation that tools check; Python does not.',
    },
    {
      title: 'Reading a traceback',
      text: 'Read from the bottom: the error type and message, then the frame that raised. If that frame is inside a library, walk up to the last frame in your own code; the bad value usually came from there.',
    },
  ],
  rules: [
    'Slices stop before the end index.',
    'zip stops at the shortest list: check lengths.',
    'Methods take `self`; subclasses call `super().__init__()` first.',
    '`**cfg` spreads a dict as keyword arguments.',
    'No mutable defaults: use `None` and create inside.',
    'Tracebacks: read bottom up, fix in your own code.',
  ],
  example: {
    code: [
      'class Dataset:',
      '    def __init__(self, xs, ys):',
      '        self.xs, self.ys = xs, ys',
      '',
      '    def __len__(self):',
      '        return len(self.xs)',
      '',
      '    def __getitem__(self, i):',
      '        return self.xs[i], self.ys[i]',
      '',
      'ds = Dataset([1, 2, 3, 4],',
      '             [0, 1, 0, 1])',
      'bs = 2',
      'for i in range(0, len(ds), bs):',
      '    batch = [ds[j] for j in',
      '             range(i, i + bs)]',
      '    print(i // bs, batch)',
    ].join('\n'),
    output: '0 [(1, 0), (2, 1)]\n1 [(3, 0), (4, 1)]',
    notes: [
      '`__len__` and `__getitem__` are the two methods a PyTorch Dataset defines.',
      'Batches come from stepping through the indexes `bs` at a time.',
      'In a real script `bs` comes from the config, and PyTorch\'s DataLoader does this batching for you.',
    ],
  },
  mistakes: [
    { mistake: 'Off-by-one slices.', fix: 'The stop index is excluded: `xs[:3]` is three items.' },
    { mistake: 'zip on lists of different lengths.', fix: 'It silently drops items; check lengths or use `strict=True`.' },
    { mistake: 'Forgetting `self` in a method.', fix: '`def predict(self, x):`.' },
    { mistake: 'Skipping `super().__init__()`.', fix: 'Call it first in a subclass `__init__`.' },
    { mistake: 'Fixing the line where a library raised.', fix: 'Walk up the traceback to your own call.' },
  ],
  forReal:
    'Open any training script on GitHub and read it with this page beside you: every pattern here appears in the first fifty lines. The PyTorch unit (F9) builds on the class and super() lessons directly.',
};
