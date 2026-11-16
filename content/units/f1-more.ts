import type { Lesson } from '../schema';

/*
 * F1 lessons 4 to 12: the rest of "Python you will see in ML code".
 * Every snippet is plain Python and runs in Pyodide.
 */
export const f1More: Lesson[] = [
  // ------------------------------------------------------------------ 4
  {
    id: 'f1-04',
    title: 'Unpacking, zip and enumerate',
    summary: 'Unpack tuples into names; zip walks lists side by side; enumerate adds a counter.',
    card: {
      title: 'Unpacking, zip and enumerate',
      text: '`a, b = pair` unpacks a pair into two names. `zip(xs, ys)` walks two lists side by side, and `enumerate(xs)` adds a counter, so `for i, (x, y) in enumerate(zip(xs, ys))` gives the step number and both items. You will meet that last line in almost every training loop.',
      code: `xs = ["a", "b"]
ys = [1, 2]
pairs = zip(xs, ys)
for i, (x, y) in enumerate(pairs):
    print(i, x, y)`,
      output: '0 a 1\n1 b 2',
    },
    exercises: [
      {
        id: 'f1-4-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `pair = (3, 4)
a, b = pair
print(b, a)`,
        answer: '4 3',
        options: [
          { text: '4 3' },
          { text: '3 4', why: 'a is 3 and b is 4, and the print puts b first.' },
          { text: '(3, 4)', why: 'Unpacking splits the pair into two names; nothing prints the tuple.' },
        ],
        explain: 'The names on the left take the items in order.',
      },
      {
        id: 'f1-4-2',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `first, *rest = [1, 2, 3, 4]
print(rest)`,
        answer: '[2, 3, 4]',
        typedWrong: [{ answer: '2', why: '`*rest` collects everything after the first item into a list.' }],
        explain: 'A starred name gathers the leftovers.',
      },
      {
        id: 'f1-4-3',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `names = ["x", "y", "z"]
for i, n in enumerate(names):
    if n == "y":
        print(i)`,
        answer: '1',
        options: [
          { text: '1' },
          { text: '2', why: 'enumerate counts from 0: x is 0, y is 1.' },
          { text: 'y', why: 'The print shows `i`, the counter, not the name.' },
        ],
        explain: '`enumerate` gives (index, item) pairs starting at 0.',
      },
      {
        id: 'f1-4-4',
        type: 'predict-output',
        prompt: 'The lists have different lengths. What does this print?',
        code: `xs = [1, 2, 3]
ys = ["a", "b"]
print(list(zip(xs, ys)))`,
        answer: "[(1, 'a'), (2, 'b')]",
        options: [
          { text: "[(1, 'a'), (2, 'b')]" },
          { text: "[(1, 'a'), (2, 'b'), (3, None)]", why: 'zip stops at the shortest list; it never pads with None.' },
          { text: 'ValueError', why: 'zip does not complain about different lengths by default; it just stops early.' },
        ],
        explain: 'Silently dropping the extra item is a classic bug: check lengths match (or use `strict=True`).',
      },
      {
        id: 'f1-4-5',
        type: 'fill-blank',
        prompt: 'Print each step number with its loss.',
        code: `losses = [0.9, 0.5, 0.3]
for step, loss in ___(losses):
    print(step, loss)`,
        answer: ['enumerate'],
        distractors: [
          { text: 'zip', why: '`zip(losses)` gives one-item tuples, which cannot unpack into step and loss.' },
          { text: 'range', why: '`range` needs a number, not a list.' },
        ],
        expectOutput: '0 0.9\n1 0.5\n2 0.3',
        explain: 'enumerate adds the counter for you.',
      },
      {
        id: 'f1-4-6',
        type: 'spot-bug',
        prompt: 'Which line unpacks the wrong number of items?',
        code: `batch = [(1, 0), (2, 1), (3, 0)]
for x, y, w in batch:
    print(x, y)`,
        error: 'ValueError: not enough values to unpack (expected 3, got 2)',
        answer: 1,
        lineWhy: {
          '0': 'Each item is an (x, y) pair: fine.',
          '2': 'Never reached.',
        },
        explain: 'Each pair has 2 items, so unpack into 2 names: `for x, y in batch:`.',
      },
      {
        id: 'f1-4-7',
        type: 'predict-output',
        prompt: 'Swap without a temporary variable. What does this print?',
        code: `a, b = 1, 2
a, b = b, a
print(a, b)`,
        answer: '2 1',
        options: [
          { text: '2 1' },
          { text: '1 2', why: 'The right side is built first (2, 1), then unpacked into a and b.' },
          { text: '2 2', why: 'Both values are read before either name changes.' },
        ],
        explain: 'Tuple packing then unpacking: a common Python idiom.',
      },
      {
        id: 'f1-4-8',
        type: 'run-code',
        prompt: 'Set `pairs` to a list of (name, score) tuples by zipping the two lists.',
        before: `names = ["ada", "bo"]
scores = [90, 75]`,
        solution: 'pairs = list(zip(names, scores))',
        tests: 'assert pairs == [("ada", 90), ("bo", 75)], f"got {pairs}"',
        placeholder: 'pairs = ...',
        explain: '`zip` pairs items up; `list` collects the pairs.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'f1-05',
    title: 'Default and keyword arguments',
    summary: 'Defaults make arguments optional; keyword arguments name them, so order stops mattering.',
    card: {
      title: 'Default and keyword arguments',
      text: 'A default makes an argument optional: `def train(lr=0.01, epochs=10)`. Calling with keywords, such as `train(epochs=3)`, names the argument, so you can skip some and order stops mattering. ML libraries have dozens of options like this, and you change only the ones you need.',
      code: `def train(lr=0.01, epochs=10):
    return f"lr={lr} epochs={epochs}"

print(train(epochs=3))`,
      output: 'lr=0.01 epochs=3',
    },
    exercises: [
      {
        id: 'f1-5-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def train(lr=0.01, epochs=10):
    return f"lr={lr} epochs={epochs}"

print(train(0.1))`,
        answer: 'lr=0.1 epochs=10',
        options: [
          { text: 'lr=0.1 epochs=10' },
          { text: 'lr=0.01 epochs=0.1', why: 'A positional argument fills the first parameter, lr.' },
          { text: 'lr=0.1 epochs=None', why: 'epochs keeps its default, 10.' },
        ],
        explain: 'Positional arguments fill parameters left to right; the rest keep their defaults.',
      },
      {
        id: 'f1-5-2',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `def scale(x, factor=2):
    return x * factor

print(scale(5, factor=3))`,
        answer: '15',
        typedWrong: [{ answer: '10', why: '`factor=3` overrides the default 2.' }],
        explain: 'A keyword argument replaces the default for that call only.',
      },
      {
        id: 'f1-5-3',
        type: 'spot-bug',
        prompt: 'Which line breaks the rule about argument order?',
        code: `def fit(x, epochs=5):
    return epochs

print(fit(epochs=2, 3))`,
        error: 'SyntaxError: positional argument follows keyword argument',
        answer: 3,
        lineWhy: {
          '0': 'A required argument then an optional one: correct order.',
          '1': 'Returning a value is fine.',
        },
        explain: 'Positional arguments come first: `fit(3, epochs=2)`.',
      },
      {
        id: 'f1-5-4',
        type: 'fill-blank',
        prompt: 'Change only the number of epochs.',
        code: `def train(lr=0.01, epochs=10):
    return lr, epochs

print(train(___=3))`,
        answer: ['epochs'],
        distractors: [
          { text: 'lr', why: 'That would set lr to 3 and leave epochs at 10.' },
          { text: 'steps', why: 'There is no parameter called steps, so Python raises a TypeError.' },
        ],
        expectOutput: '(0.01, 3)',
        explain: 'Name the argument you want to change.',
      },
      {
        id: 'f1-5-5',
        type: 'predict-output',
        prompt: 'A default list is created once. What does this print?',
        code: `def add(x, seen=[]):
    seen.append(x)
    return seen

add(1)
print(add(2))`,
        answer: '[1, 2]',
        options: [
          { text: '[1, 2]' },
          { text: '[2]', why: 'The default list is made once, when the function is defined, and shared by every call.' },
          { text: '[1]', why: 'The second call appends 2 to the same list.' },
        ],
        explain: 'Use `seen=None` and create the list inside the function instead.',
      },
      {
        id: 'f1-5-6',
        type: 'mcq',
        prompt: 'Why do ML libraries call functions with keywords, like `Adam(params, lr=1e-3)`?',
        options: [
          { text: 'It is clear which option each value sets' },
          { text: 'Keywords make the code run faster', why: 'Speed is the same; it is about clarity and skipping options.' },
          { text: 'Positional arguments are not allowed in libraries', why: 'They are allowed; keywords are just clearer when there are many options.' },
        ],
        answer: 0,
        explain: '`lr=1e-3` reads clearly; a bare `1e-3` in fourth position does not.',
      },
      {
        id: 'f1-5-7',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def report(x, *, digits=2):
    return f"{x:.{digits}f}"

print(report(3.14159, digits=3))`,
        answer: '3.142',
        options: [
          { text: '3.142' },
          { text: '3.14', why: '`digits=3` asks for three decimal places.' },
          { text: '3.14159', why: 'The format rounds to `digits` decimal places.' },
        ],
        explain: 'The bare `*` means everything after it must be passed by keyword.',
      },
      {
        id: 'f1-5-8',
        type: 'run-code',
        prompt: 'Call `train` with a learning rate of 0.1, keeping its default epochs, and save the result in `r`.',
        before: `def train(lr=0.01, epochs=10):
    return (lr, epochs)`,
        solution: 'r = train(lr=0.1)',
        tests: 'assert r == (0.1, 10), f"lr 0.1 with the default 10 epochs, got {r}"',
        placeholder: 'r = train(...)',
        explain: 'Change just the option you need.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'f1-06',
    title: '*args and **kwargs',
    summary: '*args collects extra positional arguments in a tuple; **kwargs collects keyword ones in a dict.',
    card: {
      title: '*args and **kwargs',
      text: '`*args` collects any extra positional arguments into a tuple, and `**kwargs` collects extra keyword arguments into a dict. Wrappers use them to pass everything through to another function untouched. The same stars at a call unpack: `f(*xs)` spreads a list into arguments and `f(**opts)` spreads a dict.',
      code: `def show(*args, **kwargs):
    print(args, kwargs)

show(1, 2, lr=0.1)`,
      output: "(1, 2) {'lr': 0.1}",
    },
    exercises: [
      {
        id: 'f1-6-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def total(*args):
    return sum(args)

print(total(1, 2, 3))`,
        answer: '6',
        options: [
          { text: '6' },
          { text: '(1, 2, 3)', why: 'args is the tuple (1, 2, 3), but the function returns its sum.' },
          { text: 'TypeError', why: '`*args` accepts any number of positional arguments.' },
        ],
        explain: 'Inside the function, `args` is an ordinary tuple.',
      },
      {
        id: 'f1-6-2',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `def opts(**kwargs):
    return sorted(kwargs)

print(opts(lr=0.1, bs=32))`,
        answer: "['bs', 'lr']",
        typedWrong: [{ answer: "['lr', 'bs']", why: '`sorted` puts the keys in alphabetical order: bs before lr.' }],
        explain: '`kwargs` is a dict; sorting it sorts its keys.',
      },
      {
        id: 'f1-6-3',
        type: 'predict-output',
        prompt: 'Unpacking at the call. What does this print?',
        code: `def area(w, h):
    return w * h

dims = [3, 4]
print(area(*dims))`,
        answer: '12',
        options: [
          { text: '12' },
          { text: 'TypeError', why: '`*dims` spreads the list into two arguments, w=3 and h=4.' },
          { text: '[3, 4]', why: 'The function multiplies the two values it receives.' },
        ],
        explain: '`area(*dims)` is the same as `area(3, 4)`.',
      },
      {
        id: 'f1-6-4',
        type: 'fill-blank',
        prompt: 'Pass the config dict as keyword arguments.',
        code: `def train(lr, epochs):
    return f"{lr} x {epochs}"

cfg = {"lr": 0.1, "epochs": 5}
print(train(___cfg))`,
        answer: ['**'],
        distractors: [
          { text: '*', why: 'One star spreads the dict\'s keys as positional arguments: train("lr", "epochs").' },
          { text: '&', why: '`&cfg` is not valid syntax for passing arguments.' },
        ],
        expectOutput: '0.1 x 5',
        explain: '`**cfg` turns each key into a keyword argument.',
      },
      {
        id: 'f1-6-5',
        type: 'predict-output',
        prompt: 'A wrapper that passes everything through. What does this print?',
        code: `def log_call(fn, *args, **kwargs):
    print("calling", fn.__name__)
    return fn(*args, **kwargs)

def add(a, b=0):
    return a + b

print(log_call(add, 2, b=5))`,
        answer: 'calling add\n7',
        options: [
          { text: 'calling add\n7' },
          { text: 'calling add\n2', why: 'b=5 is passed through via **kwargs, so add returns 2 + 5.' },
          { text: '7', why: 'The wrapper prints a line before calling add.' },
        ],
        explain: 'Decorators and training wrappers use exactly this pattern.',
      },
      {
        id: 'f1-6-6',
        type: 'mcq',
        prompt: 'A library function is `def fit(model, data, **kwargs)`. What can you pass in `**kwargs`?',
        options: [
          { text: 'Any extra named options, collected in a dict' },
          { text: 'Only exactly one extra option', why: '`**kwargs` takes any number of keyword arguments.' },
          { text: 'Extra positional values such as 32 or 0.1', why: 'Positional extras go to `*args`; `**kwargs` takes named ones.' },
        ],
        answer: 0,
        explain: 'Check the docs for which keyword options it actually uses.',
      },
      {
        id: 'f1-6-7',
        type: 'spot-bug',
        prompt: 'Which line passes an option the function does not take?',
        code: `def train(lr, epochs):
    return lr * epochs

cfg = {"lr": 0.1, "steps": 5}
train(**cfg)`,
        error: "TypeError: train() got an unexpected keyword argument 'steps'",
        answer: 3,
        raiseLine: 4,
        lineWhy: {
          '0': 'The function takes lr and epochs: fine.',
          '1': 'The body is fine.',
          '4': 'Spreading the dict is right; one of its keys is wrong.',
        },
        explain: 'The dict says "steps" where the function expects "epochs".',
      },
      {
        id: 'f1-6-8',
        type: 'run-code',
        prompt: 'Finish `count_args`: return how many positional and keyword arguments it got, as a tuple.',
        before: 'def count_args(*args, **kwargs):',
        solution: '    return len(args), len(kwargs)',
        tests: [
          'assert count_args(1, 2, a=3) == (2, 1), "two positional, one keyword"',
          'assert count_args() == (0, 0), "none at all"',
        ].join('\n'),
        placeholder: '    return ...',
        explain: '`args` is a tuple and `kwargs` a dict; both have a length.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 'f1-07',
    title: 'Classes, __init__ and self',
    summary: 'A class bundles data and functions; __init__ sets up each object, and self is that object.',
    card: {
      title: 'Classes, __init__ and self',
      text: 'A class bundles data with the functions (methods) that use it. `__init__` runs when you create an object and stores its starting data on `self`, which is the object itself. Each method takes `self` first, so it can read and change that object\'s data.',
      code: `class Counter:
    def __init__(self, start=0):
        self.n = start

    def add(self, k=1):
        self.n += k

c = Counter(5)
c.add()
print(c.n)`,
      output: '6',
    },
    exercises: [
      {
        id: 'f1-7-1',
        type: 'predict-output',
        prompt: 'Two separate objects. What does this print?',
        code: `class Counter:
    def __init__(self):
        self.n = 0

    def add(self):
        self.n += 1

a = Counter()
b = Counter()
a.add()
a.add()
print(a.n, b.n)`,
        answer: '2 0',
        options: [
          { text: '2 0' },
          { text: '2 2', why: 'Each object has its own `self.n`; only a was changed.' },
          { text: '1 1', why: 'add was called twice on a and never on b.' },
        ],
        explain: 'Each object keeps its own data.',
      },
      {
        id: 'f1-7-2',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(3, 4)
print(p.x + p.y)`,
        answer: '7',
        explain: '`Point(3, 4)` calls `__init__` with x=3, y=4; you never pass self yourself.',
      },
      {
        id: 'f1-7-3',
        type: 'spot-bug',
        prompt: 'Which line forgets `self`?',
        code: `class Model:
    def __init__(self, w):
        self.w = w

    def predict(x):
        return self.w * x

m = Model(2)
print(m.predict(3))`,
        error: 'TypeError: Model.predict() takes 1 positional argument but 2 were given',
        answer: 4,
        raiseLine: 8,
        lineWhy: {
          '0': 'Defining the class is fine.',
          '1': '__init__ takes self first: correct.',
          '2': 'Storing w on the object is right.',
          '5': 'This line would also fail without self, but the call fails first.',
          '7': 'Creating the model is fine.',
          '8': 'Python points at the call: `m.predict(3)` passes m and 3, but predict accepts only one.',
        },
        explain: 'Methods take `self` first: `def predict(self, x):`.',
      },
      {
        id: 'f1-7-4',
        type: 'fill-blank',
        prompt: 'Store the learning rate on the object.',
        code: `class Optim:
    def __init__(self, lr):
        ___.lr = lr

o = Optim(0.1)
print(o.lr)`,
        answer: ['self'],
        distractors: [
          { text: 'lr', why: '`lr` is the number passed in, and you cannot set attributes on a number.' },
          { text: 'o', why: 'The name `o` does not exist yet while `__init__` runs.' },
        ],
        expectOutput: '0.1',
        explain: '`self` is the object being created.',
      },
      {
        id: 'f1-7-5',
        type: 'mcq',
        prompt: 'When does `__init__` run?',
        options: [
          { text: 'When you create an object, like Model(2)' },
          { text: 'When you call any method on the object', why: 'It runs once, at creation. Methods run when called.' },
          { text: 'When the class is defined', why: 'Defining a class runs nothing inside `__init__`; creating an object does.' },
        ],
        answer: 0,
        explain: 'It sets up each new object\'s starting data.',
      },
      {
        id: 'f1-7-6',
        type: 'predict-output',
        prompt: 'A method that changes state and returns a value. What does this print?',
        code: `class Avg:
    def __init__(self):
        self.total = 0
        self.count = 0

    def add(self, x):
        self.total += x
        self.count += 1
        return self.total / self.count

a = Avg()
a.add(4)
print(a.add(8))`,
        answer: '6.0',
        options: [
          { text: '6.0' },
          { text: '8.0', why: 'The running average uses both values: (4 + 8) / 2.' },
          { text: '12', why: 'add returns the average, total / count.' },
        ],
        explain: 'A running average: the kind of object that tracks loss during training.',
      },
      {
        id: 'f1-7-7',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `class Box:
    def __init__(self, items):
        self.items = items

    def __len__(self):
        return len(self.items)

print(len(Box([1, 2, 3])))`,
        answer: '3',
        options: [
          { text: '3' },
          { text: 'TypeError', why: 'Defining `__len__` is what makes `len(obj)` work.' },
          { text: '1', why: 'len calls Box.__len__, which counts the items.' },
        ],
        explain: 'Special methods like `__len__` and `__getitem__` make objects act like built-ins: datasets use both.',
      },
      {
        id: 'f1-7-8',
        type: 'run-code',
        prompt: 'Finish `__init__` so the object stores `name` and starts `steps` at 0.',
        before: `class Run:
    def __init__(self, name):`,
        solution: '        self.name = name\n        self.steps = 0',
        tests: [
          'r = Run("exp1")',
          'assert r.name == "exp1", "store name on self"',
          'assert r.steps == 0, "steps should start at 0"',
        ].join('\n'),
        maxLines: 2,
        placeholder: '        self.name = ...\n        self.steps = ...',
        explain: 'Indent both lines eight spaces: they are inside `__init__`, inside the class.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'f1-08',
    title: 'Inheritance and super()',
    summary: 'A subclass reuses its parent; super().__init__() runs the parent setup first, as in PyTorch modules.',
    card: {
      title: 'Inheritance and super()',
      text: 'A subclass reuses everything from its parent class and adds or replaces methods. In its own `__init__`, it calls `super().__init__()` first so the parent sets itself up too. This is exactly the shape of every PyTorch model: `class Net(nn.Module)`, with `super().__init__()` as its first line.',
      code: `class Base:
    def __init__(self):
        self.ready = True

class Net(Base):
    def __init__(self, size):
        super().__init__()
        self.size = size

n = Net(4)
print(n.ready, n.size)`,
      output: 'True 4',
    },
    exercises: [
      {
        id: 'f1-8-1',
        type: 'predict-output',
        prompt: 'The subclass replaces one method. What does this print?',
        code: `class Animal:
    def sound(self):
        return "..."

    def speak(self):
        return "I say " + self.sound()

class Dog(Animal):
    def sound(self):
        return "woof"

print(Dog().speak())`,
        answer: 'I say woof',
        options: [
          { text: 'I say woof' },
          { text: 'I say ...', why: 'speak calls `self.sound()`, and self is a Dog, so Dog\'s sound is used.' },
          { text: 'AttributeError', why: 'Dog inherits speak from Animal.' },
        ],
        explain: 'Parents can call methods that subclasses fill in, which is how `forward` works in PyTorch.',
      },
      {
        id: 'f1-8-2',
        type: 'spot-bug',
        prompt: 'Which line is missing?',
        code: `class Base:
    def __init__(self):
        self.layers = []

class Net(Base):
    def __init__(self):
        self.size = 4

n = Net()
print(len(n.layers))`,
        error: "AttributeError: 'Net' object has no attribute 'layers'",
        answer: 5,
        raiseLine: 9,
        lineWhy: {
          '0': 'The parent class is fine.',
          '1': 'The parent\'s __init__ is fine.',
          '2': 'It sets layers, but only if it runs.',
          '4': 'Subclassing Base is right.',
          '6': 'Setting size is fine.',
          '8': 'Creating the object is fine.',
          '9': 'Python fails here because layers was never set.',
        },
        explain: 'Net\'s `__init__` must start with `super().__init__()`, or Base never sets `layers`.',
      },
      {
        id: 'f1-8-3',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `class A:
    def hi(self):
        return "A"

class B(A):
    pass

print(B().hi(), isinstance(B(), A))`,
        answer: 'A True',
        options: [
          { text: 'A True' },
          { text: 'A False', why: 'A B is also an A, because B inherits from A.' },
          { text: 'AttributeError', why: 'B has no hi of its own, so it uses A\'s.' },
        ],
        explain: 'A subclass is a kind of its parent.',
      },
      {
        id: 'f1-8-4',
        type: 'fill-blank',
        prompt: 'Run the parent\'s setup first.',
        code: `class Base:
    def __init__(self):
        self.params = {}

class Net(Base):
    def __init__(self):
        ___().__init__()
        self.params["w"] = 1

print(Net().params)`,
        answer: ['super'],
        distractors: [
          { text: 'self', why: '`self.__init__()` would call Net\'s own `__init__` again, forever.' },
          { text: 'Net', why: '`Net().__init__()` creates another Net inside Net\'s setup: infinite recursion.' },
        ],
        expectOutput: "{'w': 1}",
        explain: '`super()` refers to the parent class\'s version of the method.',
      },
      {
        id: 'f1-8-5',
        type: 'mcq',
        prompt: 'Why does every PyTorch model call `super().__init__()` first?',
        options: [
          { text: 'nn.Module sets itself up there' },
          { text: 'Python requires it in every class', why: 'Plain classes do not need it; subclasses need it when the parent has setup to do.' },
          { text: 'It makes the model train faster', why: 'It is about setup, not speed: without it the parent\'s bookkeeping is missing.' },
        ],
        answer: 0,
        explain: 'nn.Module keeps track of layers and parameters; skipping its setup breaks that tracking.',
      },
      {
        id: 'f1-8-6',
        type: 'predict-output',
        prompt: 'Extending a parent method with super(). What does this print?',
        code: `class Logger:
    def log(self, msg):
        return f"[log] {msg}"

class Timed(Logger):
    def log(self, msg):
        base = super().log(msg)
        return base + " (0.2s)"

print(Timed().log("step"))`,
        answer: '[log] step (0.2s)',
        options: [
          { text: '[log] step (0.2s)' },
          { text: 'step (0.2s)', why: '`super().log(msg)` runs the parent\'s version, which adds "[log] ".' },
          { text: '[log] step', why: 'Timed adds " (0.2s)" after calling the parent.' },
        ],
        explain: 'super() lets a subclass add to a parent\'s behaviour instead of rewriting it.',
      },
      {
        id: 'f1-8-7',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `class Shape:
    def area(self):
        return 0

class Square(Shape):
    def __init__(self, s):
        self.s = s

    def area(self):
        return self.s ** 2

shapes = [Shape(), Square(3)]
print(sum(x.area() for x in shapes))`,
        answer: '9',
        explain: 'Each object uses its own class\'s area: 0 + 9.',
      },
      {
        id: 'f1-8-8',
        type: 'run-code',
        prompt: 'Finish `Net.__init__`: run the parent setup, then store `size` on the object.',
        before: `class Base:
    def __init__(self):
        self.ready = True

class Net(Base):
    def __init__(self, size):`,
        solution: '        super().__init__()\n        self.size = size',
        tests: [
          'n = Net(8)',
          'assert n.ready is True, "call super().__init__() so Base sets ready"',
          'assert n.size == 8, "store size on self"',
        ].join('\n'),
        maxLines: 2,
        placeholder: '        super()...\n        self.size = ...',
        explain: 'Parent first, then your own setup: the PyTorch model pattern.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'f1-09',
    title: 'Imports and modules',
    summary: 'import brings in a module; from-import and as name what you use; __name__ tells a script from an import.',
    card: {
      title: 'Imports and modules',
      text: '`import math` gives you the module, so you write `math.sqrt`, while `from math import sqrt` brings in one name directly. `import numpy as np` sets a short alias that the whole field agrees on. A file\'s code under `if __name__ == "__main__":` runs only when you run that file, not when you import it.',
      code: `import math
from math import sqrt
import statistics as st

print(math.sqrt(16), sqrt(9))
print(st.mean([1, 2, 3]))`,
      output: '4.0 3.0\n2',
    },
    exercises: [
      {
        id: 'f1-9-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `from math import pi
print(round(pi, 2))`,
        answer: '3.14',
        options: [
          { text: '3.14' },
          { text: 'NameError', why: '`from math import pi` brings `pi` in directly, so plain `pi` works.' },
          { text: '3.141592653589793', why: '`round(pi, 2)` keeps two decimal places.' },
        ],
        explain: 'From-imports put the name straight into your file.',
      },
      {
        id: 'f1-9-2',
        type: 'spot-bug',
        prompt: 'Which line uses a name that was never imported?',
        code: `import math

print(math.floor(2.7))
print(sqrt(16))`,
        error: "NameError: name 'sqrt' is not defined",
        answer: 3,
        lineWhy: {
          '0': 'Importing the module is fine.',
          '2': '`math.floor` uses the module name: correct.',
        },
        explain: 'After `import math`, use `math.sqrt`; or add `from math import sqrt`.',
      },
      {
        id: 'f1-9-3',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `import collections as c
counts = c.Counter("banana")
print(counts["a"])`,
        answer: '3',
        explain: 'The alias `c` is just another name for the collections module.',
      },
      {
        id: 'f1-9-4',
        type: 'mcq',
        prompt: 'Which import style does almost all ML code use for NumPy?',
        options: [
          { text: 'import numpy as np' },
          { text: 'from numpy import *', why: 'Star imports flood your file with names and hide where each came from.' },
          { text: 'import numpy as numerical', why: 'It works, but no one will recognise it; `np` is the convention.' },
        ],
        answer: 0,
        explain: 'Likewise `import torch` and `import torch.nn as nn`.',
      },
      {
        id: 'f1-9-5',
        type: 'predict-output',
        prompt: 'This file is run directly. What does this print?',
        code: `def main():
    print("training")

if __name__ == "__main__":
    main()`,
        answer: 'training',
        options: [
          { text: 'training' },
          { text: 'nothing', why: 'Run directly, `__name__` is "__main__", so main() runs.' },
        ],
        explain: 'If another file imported this one, `__name__` would be the module name and nothing would run.',
      },
      {
        id: 'f1-9-6',
        type: 'fill-blank',
        prompt: 'Bring in just one function.',
        code: `___ statistics import median
print(median([5, 1, 3]))`,
        answer: ['from'],
        distractors: [
          { text: 'import', why: '`import statistics import median` is not valid Python.' },
          { text: 'use', why: 'Python has no `use` keyword.' },
        ],
        expectOutput: '3',
        explain: '`from module import name`.',
      },
      {
        id: 'f1-9-7',
        type: 'mcq',
        prompt: 'Why put training code under `if __name__ == "__main__":`?',
        options: [
          { text: 'So importing it does not start training' },
          { text: 'Python cannot run code outside that block', why: 'Code at the top level runs fine; the guard just stops it running on import.' },
          { text: 'It makes the whole file run faster', why: 'It is about when code runs, not how fast.' },
        ],
        answer: 0,
        explain: 'Other files (and tests) can then import your functions safely.',
      },
      {
        id: 'f1-9-8',
        type: 'run-code',
        prompt: 'Import `sqrt` from `math` and set `r` to the square root of 49.',
        solution: 'from math import sqrt\nr = sqrt(49)',
        tests: 'assert r == 7.0, f"sqrt(49) is 7.0, got {r!r}"',
        maxLines: 2,
        placeholder: 'from math import ...\nr = ...',
        explain: 'Import the name, then use it directly.',
      },
    ],
  },

  // ----------------------------------------------------------------- 10
  {
    id: 'f1-10',
    title: 'Type hints in ML code',
    summary: 'Hints such as list[float], dict[str, int] and Tensor | None document inputs and outputs; Python does not enforce them.',
    card: {
      title: 'Type hints in ML code',
      text: 'Library code is full of hints like `def forward(self, x: Tensor) -> Tensor` and `batch: list[dict[str, int]]`. Read them as documentation: what goes in and what comes out. Python does not check them while running; tools like mypy and your editor do.',
      code: `def accuracy(p: list[int],
             y: list[int]) -> float:
    right = sum(a == b for a, b
                in zip(p, y))
    return right / len(y)

print(accuracy([1, 0, 1], [1, 1, 1]))`,
      output: '0.6666666666666666',
    },
    exercises: [
      {
        id: 'f1-10-1',
        type: 'mcq',
        prompt: '`def collate(batch: list[dict[str, int]]) -> dict[str, list[int]]` takes what?',
        options: [
          { text: 'A list of dicts mapping strings to ints' },
          { text: 'A dict mapping strings to lists of ints', why: 'That is what it returns (after the arrow). The input is before it.' },
          { text: 'A single int', why: 'The hint says a list, whose items are dicts.' },
        ],
        answer: 0,
        explain: 'Read hints outside in: a list, of dicts, from str to int.',
      },
      {
        id: 'f1-10-2',
        type: 'predict-output',
        prompt: 'The hint says int, but Python does not check. What does this print?',
        code: `def double(x: int) -> int:
    return x * 2

print(double([1]))`,
        answer: '[1, 1]',
        options: [
          { text: '[1, 1]' },
          { text: 'TypeError', why: 'Hints are not enforced at run time; a list times 2 repeats the list.' },
          { text: '[2]', why: 'Multiplying a list by 2 repeats it; it does not double the items.' },
        ],
        explain: 'A type checker would flag this call; Python runs it anyway.',
      },
      {
        id: 'f1-10-3',
        type: 'predict-output',
        prompt: 'An optional argument. What does this print?',
        code: `def load(p: str | None = None) -> str:
    return p or "default.pt"

print(load())`,
        answer: 'default.pt',
        options: [
          { text: 'default.pt' },
          { text: 'None', why: '`path or "default.pt"` picks the default when path is None.' },
        ],
        explain: '`str | None` says None is allowed, so the function must handle it.',
      },
      {
        id: 'f1-10-4',
        type: 'fill-blank',
        prompt: 'Hint a function that returns a dict of floats keyed by strings.',
        code: `def metrics() -> dict[str, ___]:
    return {"acc": 0.9}

hints = metrics.__annotations__
print(hints["return"])`,
        answer: ['float'],
        distractors: [
          { text: 'str', why: 'The values (0.9) are floats; the keys are the strings.' },
          { text: 'list', why: 'Each value is one number, not a list.' },
        ],
        expectOutput: 'dict[str, float]',
        explain: '`dict[KeyType, ValueType]`.',
      },
      {
        id: 'f1-10-5',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `def shapes() -> tuple[int, int]:
    return (32, 10)

batch, classes = shapes()
print(classes)`,
        answer: '10',
        explain: '`tuple[int, int]` promises exactly two ints, so unpacking into two names is safe.',
      },
      {
        id: 'f1-10-6',
        type: 'mcq',
        prompt: 'What checks type hints?',
        options: [
          { text: 'Type checkers like mypy, and editors' },
          { text: 'Python itself, every time the function runs', why: 'Python stores hints but does not check them while running.' },
          { text: 'Nothing: hints are only comments', why: 'They are real annotations that tools read and check.' },
        ],
        answer: 0,
        explain: 'Run a type checker to get the benefit.',
      },
      {
        id: 'f1-10-7',
        type: 'spot-bug',
        prompt: 'The hint warned the result may be None. Which line ignores that?',
        code: `def top(xs: list[int]) -> int | None:
    return max(xs) if xs else None

score = top([])
print(score * 100)`,
        error: "TypeError: unsupported operand type(s) for *: 'NoneType' and 'int'",
        answer: 4,
        lineWhy: {
          '0': 'The hint honestly says None is possible.',
          '1': 'Returning None for an empty list is a reasonable choice.',
          '3': 'Calling top is fine; using its result unchecked is not.',
        },
        explain: 'Check `if score is not None:` first.',
      },
      {
        id: 'f1-10-8',
        type: 'run-code',
        prompt: 'Write the first line of `mean`: it takes `xs`, a list of floats, and returns a float. Then return the mean.',
        solution: 'def mean(xs: list[float]) -> float:\n    return sum(xs) / len(xs)',
        tests: [
          'assert mean([1.0, 2.0, 3.0]) == 2.0, "mean of 1, 2, 3 is 2.0"',
          'h = mean.__annotations__',
          'assert str(h["xs"]) == "list[float]" and h["return"] is float, f"hint xs as list[float] and the result as float, got {h}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'def mean(xs: ...) -> ...:\n    return ...',
        explain: '`def mean(xs: list[float]) -> float:`.',
      },
    ],
  },

  // ----------------------------------------------------------------- 11
  {
    id: 'f1-11',
    title: 'Reading a traceback',
    summary: 'Read a traceback from the bottom: the error type and message, then the last frame in your own code.',
    card: {
      title: 'Reading a traceback',
      text: 'When Python crashes it prints a traceback: the chain of calls that led to the error, oldest first. Read it from the bottom: the last line names the error and says what went wrong, and the frame above it shows the line that raised. If that line is inside a library, walk up to the last frame in your own code.',
      code: `tb = """\\
Traceback (most recent call last):
  File "t.py", line 12, in <module>
    step(batch)
  File "t.py", line 7, in step
    loss = out / count
ZeroDivisionError: division by zero"""
print(tb.splitlines()[-1])`,
      output: 'ZeroDivisionError: division by zero',
    },
    exercises: [
      {
        id: 'f1-11-1',
        type: 'predict-output',
        prompt: 'Which line raised? Type the line number.',
        code: `tb = """\\
  File "t.py", line 12, in <module>
  File "t.py", line 7, in step
ZeroDivisionError: division by zero"""
frame = tb.splitlines()[-2]
part = frame.split("line ")[1]
print(part.split(",")[0])`,
        answer: '7',
        explain: 'The frame just above the error message is where it was raised: line 7, inside `step`.',
      },
      {
        id: 'f1-11-2',
        type: 'mcq',
        prompt: 'A traceback ends with frames inside numpy, then `ValueError: shapes (2,3) and (2,3) not aligned`. Where do you look first?',
        options: [
          { text: 'The last frame from your own file' },
          { text: 'The numpy file at the very bottom', why: 'numpy only raised the error; the bad shapes came from your call.' },
          { text: 'The first line of the traceback', why: 'The top is where the program started, furthest from the error.' },
        ],
        answer: 0,
        explain: 'Libraries report the problem; your code usually caused it.',
      },
      {
        id: 'f1-11-3',
        type: 'spot-bug',
        prompt: 'Read the error, then tap the line to fix.',
        code: `cfg = {"lr": 0.1, "epochs": 5}

def train(cfg):
    return cfg["batch_size"] * 2

train(cfg)`,
        error: "KeyError: 'batch_size'",
        answer: 0,
        raiseLine: 3,
        lineWhy: {
          '2': 'Taking the config as an argument is fine.',
          '3': 'Python raises here, but reading batch_size is reasonable; the config is what lacks it.',
          '5': 'Calling train is fine.',
        },
        explain: 'The KeyError names the missing key: add "batch_size" to the config (or use `cfg.get("batch_size", 32)`).',
      },
      {
        id: 'f1-11-4',
        type: 'predict-output',
        prompt: 'Catch an error and print what Python would have said. What does this print?',
        code: `try:
    [1, 2, 3][5]
except IndexError as e:
    print(type(e).__name__, "-", e)`,
        answer: 'IndexError - list index out of range',
        options: [
          { text: 'IndexError - list index out of range' },
          { text: 'KeyError - 5', why: 'Lists are indexed by position, which raises IndexError; KeyError is for dicts.' },
          { text: 'IndexError - 5', why: 'The message says what went wrong, not the bad index.' },
        ],
        explain: 'The type tells you the kind of mistake; the message gives the detail.',
      },
      {
        id: 'f1-11-5',
        type: 'match-pairs',
        prompt: 'Match each error to its usual cause.',
        pairs: [
          { left: 'NameError', right: 'a name never defined', why: 'Typo, or used before it was created or imported.' },
          { left: 'KeyError', right: 'missing dict key', why: 'The message names the key.' },
          { left: 'IndexError', right: 'position past the end', why: 'A list is shorter than you thought.' },
          { left: 'TypeError', right: 'wrong kind of value', why: 'Such as None where a number was needed.' },
        ],
        explain: 'The error type alone usually narrows the search a lot.',
      },
      {
        id: 'f1-11-6',
        type: 'spot-bug',
        prompt: 'Which line is the real cause?',
        code: `def mean(xs):
    return sum(xs) / len(xs)

scores = []
print(mean(scores))`,
        error: 'ZeroDivisionError: division by zero',
        answer: 3,
        raiseLine: 1,
        lineWhy: {
          '0': 'The function signature is fine.',
          '1': 'Python raises here, but the formula is right for any non-empty list.',
          '4': 'Calling mean is fine; what it is given is the problem.',
        },
        explain: 'An empty list reached mean. Fix where the empty list came from, or guard against it.',
      },
      {
        id: 'f1-11-7',
        type: 'predict-output',
        prompt: 'How many calls deep was the error? What does this print?',
        code: `tb = """\\
Traceback (most recent call last):
  File "r.py", line 20, in <module>
  File "r.py", line 14, in train
  File "r.py", line 9, in step
TypeError: bad operand"""
frames = [l for l in tb.splitlines()
          if "File" in l]
print(len(frames))`,
        answer: '3',
        options: [
          { text: '3' },
          { text: '5', why: 'Only lines starting with "File" are frames; there are three.' },
          { text: '1', why: 'Each "File" line is one call in the chain: <module>, train, step.' },
        ],
        explain: '<module> called train, which called step, which raised.',
      },
      {
        id: 'f1-11-8',
        type: 'run-code',
        prompt: 'Set `kind` to the error type from the last line of `tb`.',
        before: `tb = """\\
Traceback (most recent call last):
  File "x.py", line 3, in <module>
KeyError: 'lr'"""`,
        solution: 'last = tb.splitlines()[-1]\nkind = last.split(":")[0]',
        maxLines: 2,
        tests: 'assert kind == "KeyError", f"the error type is before the colon on the last line, got {kind!r}"',
        placeholder: 'kind = ...',
        explain: 'Last line, then everything before the first colon.',
      },
    ],
  },

  // ----------------------------------------------------------------- 12
  {
    id: 'f1-12',
    title: 'Checkpoint',
    checkpoint: true,
    summary: 'You can read the Python patterns that fill ML code: slices, comprehensions, dicts, arguments, classes, imports and tracebacks.',
    card: {
      title: 'Checkpoint',
      text: 'Everything from this unit, mixed together. Each snippet looks like a line or two from real training code: predict exactly what it does.',
    },
    exercises: [
      {
        id: 'f1-12-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `data = list(range(10))
train, val = data[:8], data[8:]
print(len(train), val)`,
        answer: '8 [8, 9]',
        options: [
          { text: '8 [8, 9]' },
          { text: '8 [9]', why: '`data[8:]` starts at position 8, which holds 8.' },
          { text: '9 [9]', why: '`data[:8]` stops before position 8: eight items.' },
        ],
        explain: 'A train/validation split with slices.',
      },
      {
        id: 'f1-12-2',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `losses = [0.9, 0.4, 0.6]
print([round(l * 10) for l in losses
       if l < 0.8])`,
        answer: '[4, 6]',
        explain: 'Keep the items under 0.8, then scale each: a filter and a transform in one line.',
      },
      {
        id: 'f1-12-3',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `cfg = {"lr": 0.1}
cfg["epochs"] = cfg.get("epochs", 5)
print(cfg)`,
        answer: "{'lr': 0.1, 'epochs': 5}",
        options: [
          { text: "{'lr': 0.1, 'epochs': 5}" },
          { text: "{'lr': 0.1}", why: 'The second line adds "epochs", using the default 5 from `.get`.' },
          { text: 'KeyError', why: '`.get` with a default never raises for a missing key.' },
        ],
        explain: 'Fill in a default only if the key is missing.',
      },
      {
        id: 'f1-12-4',
        type: 'fill-blank',
        prompt: 'Spread the options into the call.',
        code: `def make(lr, bs):
    return f"lr={lr} bs={bs}"

opts = {"lr": 0.01, "bs": 64}
print(make(___opts))`,
        answer: ['**'],
        distractors: [
          { text: '*', why: 'One star spreads a dict\'s keys as positional arguments.' },
          { text: '...', why: '`...` is the Ellipsis object, not an unpacking operator.' },
        ],
        expectOutput: 'lr=0.01 bs=64',
        explain: '`**opts` passes each key as a keyword argument.',
      },
      {
        id: 'f1-12-5',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `class Meter:
    def __init__(self):
        self.vals = []

    def update(self, v):
        self.vals.append(v)
        v = self.vals
        return sum(v) / len(v)

m = Meter()
m.update(2)
print(m.update(4))`,
        answer: '3.0',
        options: [
          { text: '3.0' },
          { text: '4.0', why: 'The meter averages everything so far: (2 + 4) / 2.' },
          { text: '6', why: 'update returns the average, not the sum.' },
        ],
        explain: 'An average meter, as in many training loops.',
      },
      {
        id: 'f1-12-6',
        type: 'spot-bug',
        prompt: 'Which line is missing something?',
        code: `class Base:
    def __init__(self):
        self.step = 0

class Trainer(Base):
    def __init__(self, lr):
        self.lr = lr

t = Trainer(0.1)
print(t.step)`,
        error: "AttributeError: 'Trainer' object has no attribute 'step'",
        answer: 5,
        raiseLine: 9,
        lineWhy: {
          '0': 'The parent class is fine.',
          '1': 'The parent setup is fine, if it runs.',
          '2': 'It sets step, but only when Base.__init__ runs.',
          '4': 'Subclassing is right.',
          '6': 'Storing lr is right.',
          '8': 'Creating the trainer is fine.',
          '9': 'Python fails here because step was never set.',
        },
        explain: 'Add `super().__init__()` as the first line of Trainer\'s `__init__`.',
      },
      {
        id: 'f1-12-7',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `pairs = [("a", 3), ("b", 1), ("c", 2)]
best = max(pairs, key=lambda p: p[1])
name, score = best
print(name, score)`,
        answer: 'a 3',
        options: [
          { text: 'a 3' },
          { text: 'c 2', why: '`key=lambda p: p[1]` compares by score, and 3 is the largest.' },
          { text: 'c 3', why: 'max returns a whole pair, ("a", 3), which unpacks into name and score.' },
        ],
        explain: '`key=` says what to compare; unpacking splits the winner.',
      },
      {
        id: 'f1-12-8',
        type: 'mcq',
        prompt: 'A traceback ends `File "model.py", line 42, in forward` then `RuntimeError: mat1 and mat2 shapes cannot be multiplied`. What does it tell you?',
        options: [
          { text: 'Line 42 of forward multiplied mismatched shapes' },
          { text: 'model.py has 42 lines in total', why: '"line 42" is where the error was raised, not the file\'s length.' },
          { text: 'The traceback is unreadable, so rerun it', why: 'It names the file, line, function and the problem: everything you need to start.' },
        ],
        answer: 0,
        explain: 'File, line and function from the frame; the problem from the last line.',
      },
      {
        id: 'f1-12-9',
        type: 'match-pairs',
        prompt: 'Match each pattern to what it does.',
        pairs: [
          { left: 'xs[-2:]', right: 'the last two items', why: 'Negative start, no stop.' },
          { left: 'enumerate(xs)', right: 'adds a counter', why: '(index, item) pairs from 0.' },
          { left: '**kwargs', right: 'extra named arguments', why: 'Collected in a dict.' },
          { left: 'super().__init__()', right: 'runs the parent setup', why: 'First line of a subclass\'s __init__.' },
        ],
        explain: 'Four patterns you will meet on almost every page of ML code.',
      },
      {
        id: 'f1-12-10',
        type: 'run-code',
        prompt: 'Set `steps` to a list of (step number, loss) pairs from `losses`, numbered from 1.',
        before: 'losses = [0.9, 0.5, 0.3]',
        solution: 'steps = list(enumerate(losses, 1))',
        tests: 'assert steps == [(1, 0.9), (2, 0.5), (3, 0.3)], f"got {steps}"',
        placeholder: 'steps = ...',
        explain: '`enumerate(xs, 1)` starts counting at 1.',
      },
    ],
  },
];
