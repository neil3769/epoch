import type { Lesson } from '../schema';

/* S13 lessons 5-10: strategy and state, observer and decorator, factory and adapter, class diagrams, shared state and locks, checkpoint. */
export const s13More: Lesson[] = [
  // ------------------------------------------------------------------ 5
  {
    id: 's13-05',
    title: 'Strategy and state',
    summary: 'Strategy swaps an algorithm behind one interface; State gives each mode its own class and transitions.',
    card: {
      title: 'Strategy and state',
      text: 'Strategy puts interchangeable algorithms (a pricing rule, a sort order, a route planner) behind the same small interface and lets the caller choose one; in Python that is often just a function passed in. State gives an object one class per mode, such as Draft, Review and Published for a document, and each mode decides what an action does and which mode comes next. Both replace long if/elif chains that test a type or a status.',
    },
    exercises: [
      {
        id: 's13-5-1',
        type: 'predict-output',
        prompt: 'The pricing rule is passed in. What is the total in the sale?',
        code: `def regular(p):
    return p

def sale(p):
    return p * 0.8

def checkout(prices, rule):
    return sum(map(rule, prices))

print(checkout([10, 20], sale))`,
        answer: '24.0',
        typedWrong: [{ answer: '30', why: 'The sale rule takes 20% off each price.' }],
        explain: 'A new rule is a new function; checkout never changes.',
      },
      {
        id: 's13-5-2',
        type: 'predict-output',
        prompt: 'Each state returns the next one. Where does the document end up?',
        code: `class Published:
    pass

class Review:
    def approve(self):
        return Published()

class Draft:
    def submit(self):
        return Review()

s = Draft().submit().approve()
print(type(s).__name__)`,
        answer: 'Published',
        typedWrong: [{ answer: 'Review', why: 'approve() moves it on from Review to Published.' }],
        explain: 'Draft has no approve(): skipping review is impossible, not just discouraged.',
      },
      {
        id: 's13-5-3',
        type: 'mcq',
        prompt: 'With the State pattern, who decides what "approve" does to a draft?',
        options: [
          { text: 'The Draft state class' },
          { text: 'A big if/elif on the status', why: 'That is exactly what the pattern replaces.' },
          { text: 'Whoever calls approve()', why: 'Callers just call; the current state decides.' },
        ],
        answer: 0,
        explain: 'Each state holds its own rules, so adding a state touches one class.',
      },
      {
        id: 's13-5-4',
        type: 'bucket-sort',
        prompt: 'Strategy or State?',
        buckets: ['Strategy', 'State'],
        items: [
          { text: 'Choosing a shipping cost rule', bucket: 0, why: 'Interchangeable algorithms, chosen by the caller.' },
          { text: 'Order: placed, paid, shipped', bucket: 1, why: 'Modes with transitions between them.' },
          { text: 'Sorting by price or by rating', bucket: 0, why: 'The same job done different ways.' },
          { text: 'A traffic light cycling', bucket: 1, why: 'Each colour knows the next.' },
          { text: 'Picking a compression method', bucket: 0, why: 'Swap the algorithm, same interface.' },
          { text: 'Vending machine: idle or has coin', bucket: 1, why: 'Buttons behave differently per mode.' },
        ],
        explain: 'Strategy: chosen from outside. State: changes itself as events happen.',
      },
      {
        id: 's13-5-5',
        type: 'scenario',
        prompt: 'Order status checks are spread across 12 methods. Adding "on hold" means editing all of them.',
        situation: 'Two more statuses are planned.',
        needs: ['A new status touches one place'],
        options: [
          {
            text: 'One class per order state',
            cost: 'Several small classes.',
          },
          {
            text: 'Add "on hold" to every if',
            cost: 'Twelve small edits.',
            why: 'Miss one, and an order on hold ships anyway.',
          },
        ],
        answer: 0,
        explain: 'OnHold decides what pay, ship and cancel do while it is current.',
      },
      {
        id: 's13-5-6',
        type: 'run-code',
        prompt: 'Write `next_light(colour)`: green → yellow → red → green.',
        solution: `def next_light(colour):
    order = {"green": "yellow",
             "yellow": "red",
             "red": "green"}
    return order[colour]`,
        tests: [
          'got = [next_light(c) for c in ("green", "yellow", "red")]',
          'assert got == ["yellow", "red", "green"], f"got {got}"',
        ].join('\n'),
        maxLines: 5,
        placeholder: 'def next_light(colour):',
        explain: 'A transition table is the smallest State machine.',
      },
      {
        id: 's13-5-7',
        type: 'mcq',
        prompt: 'In Python, a strategy is often…',
        options: [
          { text: 'Just a function passed in' },
          { text: 'A class with ten methods', why: 'One method is usually all a strategy needs.' },
          { text: 'A global setting', why: 'Then every caller shares one choice.' },
        ],
        answer: 0,
        explain: 'Functions are objects: `sorted(xs, key=price)` is the strategy pattern.',
      },
      {
        id: 's13-5-8',
        type: 'fill-blank',
        prompt: 'An action not allowed in the current state leaves it unchanged.',
        code: `NEXT = {("draft", "submit"): "review",
        ("review", "approve"): "live"}

def step(state, action):
    return NEXT.get((state, action),
                    ___)

print(step("draft", "submit"),
      step("draft", "approve"))`,
        answer: ['state'],
        distractors: [{ text: '"live"', why: 'That would publish a draft that was never reviewed.' }],
        expectOutput: 'review draft',
        explain: 'A draft cannot be approved: it stays a draft.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 's13-06',
    title: 'Observer and decorator',
    summary: 'Observer announces events to subscribers; decorator wraps something to add behaviour with the same interface.',
    card: {
      title: 'Observer and decorator',
      text: 'Observer lets an object announce events to any number of subscribed listeners without knowing who they are: an order announces "paid", and email, stock and analytics each react. Decorator wraps an object or function in another with the same interface that adds something before or after, such as logging, caching or retries. In Python the @ syntax applies function decorators, and functools.wraps keeps the wrapped function\'s name and docstring.',
    },
    exercises: [
      {
        id: 's13-6-1',
        type: 'predict-output',
        prompt: 'Two listeners subscribe to an order. What does paying return?',
        code: `class Order:
    def __init__(self):
        self.subs = []

    def on_paid(self, fn):
        self.subs.append(fn)

    def pay(self):
        return [fn("paid")
                for fn in self.subs]

o = Order()
o.on_paid(lambda e: "email " + e)
o.on_paid(lambda e: "stock " + e)
print(o.pay())`,
        answer: "['email paid', 'stock paid']",
        typedWrong: [{ answer: "['paid']", why: 'Each subscriber is called and returns its own text.' }],
        explain: 'A third listener needs no change to Order.',
      },
      {
        id: 's13-6-2',
        type: 'predict-output',
        prompt: 'A decorator records each call. What does this print?',
        code: `calls = []

def logged(fn):
    def wrapper(*args):
        calls.append(fn.__name__)
        return fn(*args)
    return wrapper

@logged
def add(a, b):
    return a + b

print(add(2, 3), add(1, 1), calls)`,
        answer: "5 2 ['add', 'add']",
        typedWrong: [{ answer: '5 2 []', why: 'The wrapper records the name before calling add.' }],
        explain: '`@logged` is shorthand for `add = logged(add)`.',
      },
      {
        id: 's13-6-3',
        type: 'mcq',
        prompt: 'What does Observer buy you?',
        options: [
          { text: 'Senders need not know listeners' },
          { text: 'Listeners run in a fixed order', why: 'Order is not the point and should not be relied on.' },
          { text: 'Events can never be lost', why: 'In-process observers lose events if the process dies.' },
        ],
        answer: 0,
        explain: 'Across services, the same idea becomes publish-subscribe (S8).',
      },
      {
        id: 's13-6-4',
        type: 'bucket-sort',
        prompt: 'Observer or Decorator?',
        buckets: ['Observer', 'Decorator'],
        items: [
          { text: 'Notify watchers when a price changes', bucket: 0, why: 'One event, many listeners.' },
          { text: 'Add caching to a slow function', bucket: 1, why: 'Wrap it with the same interface.' },
          { text: 'Retry a flaky call up to 3 times', bucket: 1, why: 'Behaviour added around the call.' },
          { text: 'Redraw the screen when data changes', bucket: 0, why: 'The screen subscribes to the data.' },
          { text: 'Time how long a function takes', bucket: 1, why: 'Work before and after the call.' },
        ],
        explain: 'Observer: "tell others". Decorator: "wrap me".',
      },
      {
        id: 's13-6-5',
        type: 'predict-output',
        prompt: 'A caching decorator from the standard library. How many times does the body run?',
        code: `from functools import lru_cache
calls = 0

@lru_cache
def square(n):
    global calls
    calls += 1
    return n * n

square(4); square(4); square(5)
print(calls)`,
        answer: '2',
        typedWrong: [{ answer: '3', why: 'The second square(4) is answered from the cache.' }],
        explain: 'Caching added without touching the function\'s code.',
      },
      {
        id: 's13-6-6',
        type: 'scenario',
        prompt: 'Thirty functions call an unreliable API and each needs retries with backoff.',
        situation: 'The retry rules may change later.',
        needs: ['One place to change the retry rules'],
        options: [
          {
            text: 'A @retry decorator',
            cost: 'Write and test it once.',
          },
          {
            text: 'Copy a retry loop into each',
            cost: 'No new abstraction.',
            why: 'Thirty copies to keep in step whenever the rules change.',
          },
        ],
        answer: 0,
        explain: 'Each function stays about its own job.',
      },
      {
        id: 's13-6-7',
        type: 'mcq',
        prompt: 'Why use functools.wraps inside a decorator?',
        options: [
          { text: 'Keeps the original name and doc' },
          { text: 'Makes the wrapper run faster', why: 'It only copies metadata.' },
          { text: 'Retries the function on errors', why: 'It adds no behaviour.' },
        ],
        answer: 0,
        explain: 'Otherwise every decorated function is called "wrapper" in logs and help().',
      },
      {
        id: 's13-6-8',
        type: 'fill-blank',
        prompt: 'A decorator must return the wrapper.',
        code: `def shout(fn):
    def wrapper(s):
        return fn(s).upper()
    return ___

@shout
def hi(name):
    return "hi " + name

print(hi("bo"))`,
        answer: ['wrapper'],
        distractors: [{ text: 'fn', why: 'Returning the original means nothing was wrapped.' }],
        expectOutput: 'HI BO',
        explain: '`hi` now names the wrapper, which calls the original.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's13-07',
    title: 'Factory and adapter',
    summary: 'A factory decides which class to create; an adapter makes an existing class fit the interface you need.',
    card: {
      title: 'Factory and adapter',
      text: 'A factory is one place that decides which class to create from some input, such as a file extension or a config value, so callers ask for "a parser for .csv" without naming classes. An adapter wraps an existing class whose interface does not fit, such as a third-party SDK, and offers the interface your code expects. Both let the rest of the code depend on one stable interface while the concrete classes vary.',
    },
    exercises: [
      {
        id: 's13-7-1',
        type: 'predict-output',
        prompt: 'The factory picks a parser by extension. What does this print?',
        code: `class CsvParser:
    def parse(self, t):
        return t.split(",")

class PipeParser:
    def parse(self, t):
        return t.split("|")

PARSERS = {".csv": CsvParser,
           ".psv": PipeParser}

def parser_for(name):
    ext = name[name.rfind("."):]
    return PARSERS[ext]()

p = parser_for("a.psv")
print(p.parse("x|y"))`,
        answer: "['x', 'y']",
        typedWrong: [{ answer: "['x|y']", why: 'The .psv extension picks the pipe parser.' }],
        explain: 'Callers never name a parser class.',
      },
      {
        id: 's13-7-2',
        type: 'predict-output',
        prompt: 'An adapter makes a vendor\'s SMS class fit your `send(to, text)` interface. What does it return?',
        code: `class VendorSms:     # third-party
    def sms(self, num, body):
        return f"sms {num}: {body}"

class SmsAdapter:
    def __init__(self, vendor):
        self.vendor = vendor

    def send(self, to, text):
        v = self.vendor
        return v.sms(to, text)

a = SmsAdapter(VendorSms())
print(a.send("555", "hi"))`,
        answer: 'sms 555: hi',
        typedWrong: [{ answer: 'send 555: hi', why: 'The adapter passes the call on to the vendor\'s sms().' }],
        explain: 'Switching vendors means a new adapter, not edits across the code.',
      },
      {
        id: 's13-7-3',
        type: 'bucket-sort',
        prompt: 'Factory or Adapter?',
        buckets: ['Factory', 'Adapter'],
        items: [
          { text: 'Choose a storage class from config', bucket: 0, why: 'It decides what to create.' },
          { text: 'Wrap a payment SDK in your interface', bucket: 1, why: 'Makes an existing class fit.' },
          { text: 'Pick a parser by file extension', bucket: 0, why: 'It decides what to create.' },
          { text: 'Make a legacy logger fit logging', bucket: 1, why: 'Translates one interface to another.' },
          { text: 'Create the right sender per channel', bucket: 0, why: 'Chooses the class from input.' },
        ],
        explain: 'Factory: which object. Adapter: make it fit.',
      },
      {
        id: 's13-7-4',
        type: 'mcq',
        prompt: 'Why wrap a third-party SDK in an adapter?',
        options: [
          { text: 'Swap vendors in one place' },
          { text: 'The SDK runs faster', why: 'An extra call layer never speeds it up.' },
          { text: 'It adds new features', why: 'It translates; it adds nothing.' },
        ],
        answer: 0,
        explain: 'Tests can also use a fake behind the same interface.',
      },
      {
        id: 's13-7-5',
        type: 'scenario',
        prompt: 'Code calls a vendor\'s SDK directly in 40 places. The vendor is being replaced next quarter.',
        situation: 'The new vendor\'s methods have different names and arguments.',
        needs: ['Switch vendors with a small change'],
        options: [
          {
            text: 'An adapter behind your interface',
            cost: 'Change 40 call sites once, now.',
          },
          {
            text: 'Edit all 40 calls next quarter',
            cost: 'No work now.',
            why: 'And again for the vendor after that.',
          },
        ],
        answer: 0,
        explain: 'Next time, only the adapter changes.',
      },
      {
        id: 's13-7-6',
        type: 'run-code',
        prompt: 'Write `make_sender(channel)`: for "email" or "sms" return a function that takes `text` and returns `"<channel>: <text>"`; for anything else raise ValueError.',
        solution: `def make_sender(channel):
    known = ("sms", "email")
    if channel not in known:
        raise ValueError(channel)
    def send(text):
        return f"{channel}: {text}"
    return send`,
        tests: [
          'assert make_sender("sms")("hi") == "sms: hi", "sms sender"',
          'assert make_sender("email")("yo") == "email: yo", "email sender"',
          'try:',
          '    make_sender("fax")',
          '    assert False, "unknown channels must raise"',
          'except ValueError:',
          '    pass',
        ].join('\n'),
        maxLines: 7,
        placeholder: 'def make_sender(channel):',
        explain: 'A factory can hand back a function as easily as an object.',
      },
      {
        id: 's13-7-7',
        type: 'mcq',
        prompt: 'What does a factory hide from callers?',
        options: [
          { text: 'Which class gets created' },
          { text: 'How objects are deleted', why: 'Factories are about creation.' },
          { text: 'The class\'s data', why: 'The object\'s interface is still visible.' },
        ],
        answer: 0,
        explain: 'Callers depend on the interface, not on the concrete classes.',
      },
      {
        id: 's13-7-8',
        type: 'fill-blank',
        prompt: 'Look up the sender for the requested kind.',
        code: `SENDERS = {"email": "E", "sms": "S"}

def make(kind):
    if kind not in SENDERS:
        raise ValueError(kind)
    return SENDERS[___]

print(make("sms"))`,
        answer: ['kind'],
        distractors: [{ text: '"email"', why: 'That returns the email sender whatever was asked.' }],
        expectOutput: 'S',
        explain: 'Unknown kinds fail loudly, at the moment of creation.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's13-08',
    title: 'Reading a class diagram',
    summary: 'Boxes are classes; lines say is a, has a or uses; numbers say how many.',
    card: {
      title: 'Reading a class diagram',
      text: 'A class diagram shows classes as boxes and relationships as lines: a hollow-triangle arrow means "is a" (inheritance), a line with a diamond means "has a" (composition, with a filled diamond when the part cannot exist without its whole), and a dashed arrow means "uses" (a dependency). Numbers at the ends give how many: 1, 0..1, or * for many. To read one, turn it into sentences: a Library has many Books; a Car is a Vehicle.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'service', label: 'Car' },
          { id: 't', kind: 'service', label: 'Truck' },
          { id: 'v', kind: 'service', label: 'Vehicle' },
          { id: 'e', kind: 'service', label: 'Engine' },
        ],
        edges: [
          { from: 'c', to: 'v', label: 'is a' },
          { from: 't', to: 'v', label: 'is a' },
          { from: 'c', to: 'e', label: 'has 1' },
        ],
      },
    },
    exercises: [
      {
        id: 's13-8-1',
        type: 'match-pairs',
        prompt: 'Match each line to its meaning.',
        pairs: [
          { left: 'Hollow-triangle arrow', right: 'is a (inheritance)', why: 'Points from subclass to base.' },
          { left: 'Line with a diamond', right: 'has a (composition)', why: 'The diamond sits at the whole.' },
          { left: 'Dashed arrow', right: 'uses (dependency)', why: 'One class calls another without owning it.' },
        ],
        explain: 'Three line types cover most interview diagrams.',
      },
      {
        id: 's13-8-2',
        type: 'diagram',
        prompt: 'Car and Truck both inherit from one class. Which?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'service', label: 'Car' },
            { id: 't', kind: 'service', label: 'Truck' },
            { id: 'v', kind: 'service', label: 'Vehicle' },
            { id: 'e', kind: 'service', label: 'Engine' },
          ],
          edges: [
            { from: 'c', to: 'v', label: 'is a' },
            { from: 't', to: 'v', label: 'is a' },
            { from: 'c', to: 'e', label: 'has 1' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'v',
          why: {
            c: 'Car is one of the subclasses.',
            t: 'Truck is one of the subclasses.',
            e: 'Car has an Engine as a part; nothing inherits from it.',
          },
        },
        explain: 'Both "is a" arrows point at Vehicle.',
      },
      {
        id: 's13-8-3',
        type: 'mcq',
        prompt: '"Order 1 ◆—— * LineItem". What does it say?',
        options: [
          { text: 'An order has many items' },
          { text: 'An item has many orders', why: 'The * sits at the LineItem end: many items per order.' },
          { text: 'Exactly one item each', why: '* means any number.' },
        ],
        answer: 0,
        explain: 'And each line item belongs to exactly one order.',
      },
      {
        id: 's13-8-4',
        type: 'predict-output',
        prompt: '"Library has * Books" in code. What does this print?',
        code: `class Library:
    def __init__(self):
        self.books = []   # has *

lib = Library()
lib.books += ["Dune", "Emma"]
print(len(lib.books))`,
        answer: '2',
        typedWrong: [{ answer: '1', why: 'Two titles were added to the list.' }],
        explain: '"Has many" usually becomes a list or a dict of parts.',
      },
      {
        id: 's13-8-5',
        type: 'bucket-sort',
        prompt: 'Is a, has a, or uses?',
        buckets: ['Is a', 'Has a', 'Uses'],
        items: [
          { text: 'Admin and User', bucket: 0, why: 'An admin is a kind of user.' },
          { text: 'Cart and Item', bucket: 1, why: 'A cart holds items.' },
          { text: 'Report and the mailer it is given', bucket: 2, why: 'It calls the mailer but does not own it.' },
          { text: 'Circle and Shape', bucket: 0, why: 'A circle is a kind of shape.' },
          { text: 'Team and Player', bucket: 1, why: 'A team has players.' },
          { text: 'Checkout and a tax calculator', bucket: 2, why: 'A dependency passed in to use.' },
        ],
        explain: 'Owning a part is "has"; borrowing one for a call is "uses".',
      },
      {
        id: 's13-8-6',
        type: 'diagram',
        prompt: 'Checkout depends on an interface that two classes implement. Which box is the interface?',
        diagram: {
          nodes: [
            { id: 'k', kind: 'service', label: 'Checkout' },
            { id: 'c', kind: 'service', label: 'CardPay' },
            { id: 'w', kind: 'service', label: 'WalletPay' },
            { id: 'p', kind: 'service', label: 'Payments' },
          ],
          edges: [
            { from: 'k', to: 'p', label: 'uses', dashed: true },
            { from: 'c', to: 'p', label: 'is a' },
            { from: 'w', to: 'p', label: 'is a' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'p',
          why: {
            k: 'Checkout is the one depending on it.',
            c: 'CardPay is one implementation.',
            w: 'WalletPay is one implementation.',
          },
        },
        explain: 'Dependency inversion in a picture: Checkout never names CardPay.',
      },
      {
        id: 's13-8-7',
        type: 'order-steps',
        prompt: 'Drawing a class diagram from requirements. Put it in order.',
        steps: [
          'Draw a box for each key noun',
          'Add the "is a" arrows',
          'Add the "has a" lines with numbers',
          'Add the "uses" arrows',
          'Read it back as sentences',
        ],
        explain: 'Reading it back catches missing or wrong links.',
      },
      {
        id: 's13-8-8',
        type: 'mcq',
        prompt: 'What does a filled diamond say that a hollow one does not?',
        options: [
          { text: 'The part dies with its whole' },
          { text: 'The part is a subclass of it', why: 'Subclassing is the triangle arrow.' },
          { text: 'The link is optional', why: 'Optional is shown by 0..1.' },
        ],
        answer: 0,
        explain: 'Rooms die with their house; players outlive their team (hollow).',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's13-09',
    title: 'Shared state and locks',
    summary: 'Interleaved read-modify-write loses updates; a lock makes the section one step, or avoid sharing.',
    card: {
      title: 'Shared state and locks',
      text: 'When two threads update the same data, their steps can interleave: both read a counter of 5, both write 6, and one increment is lost, which is a race condition. A lock lets only one thread at a time run the read-modify-write section; keep that section short and always release the lock, which `with lock:` does even when an error is raised. Better still, avoid sharing: give each thread its own data, or pass work through a thread-safe queue.',
    },
    exercises: [
      {
        id: 's13-9-1',
        type: 'predict-output',
        prompt: 'Two threads each add 1 to `count`, with their steps interleaved like this. What is `count`?',
        code: `count = 5
a = count       # thread A reads
b = count       # thread B reads
count = a + 1   # A writes
count = b + 1   # B writes
print(count)`,
        answer: '6',
        typedWrong: [{ answer: '7', why: 'B read 5 before A wrote, so B also writes 6.' }],
        explain: 'Two increments, one effect: a lost update.',
      },
      {
        id: 's13-9-2',
        type: 'order-steps',
        prompt: 'A lost update. Put the interleaving in order.',
        steps: [
          'A reads the balance: 100',
          'B reads the balance: 100',
          'A writes 100 + 20 = 120',
          'B writes 100 + 50 = 150',
          'A\'s deposit of 20 is gone',
        ],
        explain: 'The final balance should be 170.',
      },
      {
        id: 's13-9-3',
        type: 'predict-output',
        prompt: '`with lock:` holds the lock only inside the block. What does this print?',
        code: `import threading
lock = threading.Lock()
count = 0

def inc():
    global count
    with lock:
        count += 1
    return lock.locked()

print(inc(), count)`,
        answer: 'False 1',
        typedWrong: [{ answer: 'True 1', why: 'Leaving the with block released the lock.' }],
        explain: 'Released even if the block raises: no forgotten unlocks.',
      },
      {
        id: 's13-9-4',
        type: 'mcq',
        prompt: 'Why prefer `with lock:` to calling acquire and release yourself?',
        options: [
          { text: 'It releases even on errors' },
          { text: 'It makes the code run faster', why: 'Speed is the same; safety differs.' },
          { text: 'It locks every variable', why: 'It guards only the code in the block.' },
        ],
        answer: 0,
        explain: 'An exception between acquire and release would leave everyone else waiting forever.',
      },
      {
        id: 's13-9-5',
        type: 'bucket-sort',
        prompt: 'Two threads run this. Needs a lock, or safe as it is?',
        buckets: ['Needs a lock', 'Safe as is'],
        items: [
          { text: 'Incrementing a shared counter', bucket: 0, why: 'Read-modify-write can interleave.' },
          { text: 'Each summing its own list', bucket: 1, why: 'Nothing is shared.' },
          { text: 'If key missing, insert it', bucket: 0, why: 'Check-then-act: both can see it missing.' },
          { text: 'Reading a constant set at start-up', bucket: 1, why: 'Nobody writes it.' },
          { text: 'Each writing its own log file', bucket: 1, why: 'Separate files, separate data.' },
          { text: 'Reading then updating a shared balance', bucket: 0, why: 'A lost update waiting to happen.' },
        ],
        explain: 'Shared and written by someone: protect it.',
      },
      {
        id: 's13-9-6',
        type: 'scenario',
        prompt: 'A booking method checks that a seat is free, then books it. Two users sometimes get the same seat.',
        situation: 'Requests are handled by several threads in one process.',
        needs: ['One seat, one booking'],
        options: [
          {
            text: 'Lock around check and book',
            cost: 'Bookings wait for each other briefly.',
          },
          {
            text: 'Check twice before booking',
            cost: 'One more line.',
            why: 'Both threads can still pass both checks before either books.',
          },
        ],
        answer: 0,
        explain: 'Across several processes the lock moves to the database: a unique constraint.',
      },
      {
        id: 's13-9-7',
        type: 'mcq',
        prompt: 'Thread 1 holds lock A and waits for B; thread 2 holds B and waits for A. What prevents this?',
        options: [
          { text: 'Take locks in one fixed order' },
          { text: 'Add more locks to the code', why: 'More locks, more ways to deadlock.' },
          { text: 'Hold each lock for longer', why: 'Longer holds make deadlocks likelier.' },
        ],
        answer: 0,
        explain: 'If everyone takes A before B, nobody can hold B while waiting for A.',
      },
      {
        id: 's13-9-8',
        type: 'fill-blank',
        prompt: 'A thread-safe queue hands work over without sharing a list.',
        code: `from queue import Queue
q = Queue()
q.put("job1")
q.put("job2")
print(q.___(), q.qsize())`,
        answer: ['get'],
        distractors: [{ text: 'put', why: '`put` needs an item and adds rather than takes.' }],
        expectOutput: 'job1 1',
        explain: 'Queue does its own locking: producers put, workers get.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's13-10',
    title: 'Checkpoint: low-level design',
    summary: 'Classes, composition, SOLID, patterns, class diagrams and locks, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's13-10-1',
        type: 'bucket-sort',
        prompt: 'Is a, or has a?',
        buckets: ['Is a', 'Has a'],
        items: [
          { text: 'Invoice and LineItem', bucket: 1, why: 'An invoice holds line items.' },
          { text: 'Truck and Vehicle', bucket: 0, why: 'A truck is a kind of vehicle.' },
          { text: 'House and Room', bucket: 1, why: 'Rooms are parts of a house.' },
          { text: 'Savings and Account', bucket: 0, why: 'A savings account is an account.' },
          { text: 'Album and Track', bucket: 1, why: 'An album contains tracks.' },
        ],
        explain: 'Composition for parts; inheritance for kinds.',
      },
      {
        id: 's13-10-2',
        type: 'predict-output',
        prompt: 'The robot\'s mover is swapped at run time. What does it print?',
        code: `class Wheels:
    def move(self):
        return "roll"

class Legs:
    def move(self):
        return "walk"

class Robot:
    def __init__(self, mover):
        self.mover = mover

r = Robot(Wheels())
a = r.mover.move()
r.mover = Legs()
print(a, r.mover.move())`,
        answer: 'roll walk',
        typedWrong: [{ answer: 'roll roll', why: 'The mover was replaced by Legs.' }],
        explain: 'Composition can change behaviour at run time; inheritance cannot.',
      },
      {
        id: 's13-10-3',
        type: 'mcq',
        prompt: 'A class formats reports, emails them and saves them. Which principle does it break?',
        options: [
          { text: 'Single responsibility' },
          { text: 'Liskov substitution', why: 'No subclass is involved.' },
          { text: 'Interface segregation', why: 'The issue is jobs in one class, not interface size.' },
        ],
        answer: 0,
        explain: 'Three reasons to change: three classes.',
      },
      {
        id: 's13-10-4',
        type: 'match-pairs',
        prompt: 'Match each pattern to its purpose.',
        pairs: [
          { left: 'Strategy', right: 'swap an algorithm', why: 'Same interface, different method.' },
          { left: 'Observer', right: 'notify subscribers', why: 'One event, many listeners.' },
          { left: 'Adapter', right: 'fit another interface', why: 'Wraps an existing class.' },
        ],
        explain: 'Name the problem first; the pattern follows.',
      },
      {
        id: 's13-10-5',
        type: 'scenario',
        prompt: 'Discounts are an if/elif chain that grows each month, and changes keep breaking old discounts.',
        situation: 'Marketing adds a discount type every few weeks.',
        needs: ['New discounts without edits to old ones'],
        options: [
          {
            text: 'A table of discount functions',
            cost: 'Refactor the chain once.',
          },
          {
            text: 'Keep adding elif branches',
            cost: 'Nothing up front.',
            why: 'Every addition edits code that already works.',
          },
        ],
        answer: 0,
        explain: 'Open/closed plus strategy.',
      },
      {
        id: 's13-10-6',
        type: 'fill-blank',
        prompt: 'Return the wrapper so the decorator takes effect.',
        code: `def twice(fn):
    def wrapper(x):
        return fn(fn(x))
    return ___

@twice
def inc(x):
    return x + 1

print(inc(5))`,
        answer: ['wrapper'],
        distractors: [{ text: 'fn', why: 'Then inc is unchanged and returns 6.' }],
        expectOutput: '7',
        explain: 'inc now runs twice.',
      },
      {
        id: 's13-10-7',
        type: 'predict-output',
        prompt: 'Interleaved increments without a lock. What is `n`?',
        code: `n = 10
x = n          # A reads
y = n          # B reads
n = y + 1      # B writes
n = x + 1      # A writes
print(n)`,
        answer: '11',
        typedWrong: [{ answer: '12', why: 'Both read 10 before either wrote.' }],
        explain: 'One update lost: the section needs a lock.',
      },
      {
        id: 's13-10-8',
        type: 'mcq',
        prompt: '"Team 1 ◇—— * Player". What does it say?',
        options: [
          { text: 'A team has many players' },
          { text: 'A player is a kind of team', why: 'Inheritance would be a triangle arrow.' },
          { text: 'Each team has one player', why: '* means many.' },
        ],
        answer: 0,
        explain: 'Hollow diamond: players exist without the team too.',
      },
      {
        id: 's13-10-9',
        type: 'mcq',
        prompt: 'What does passing dependencies in (instead of creating them inside) make easy?',
        options: [
          { text: 'Testing with fakes' },
          { text: 'Writing fewer classes', why: 'The number of classes is about the same.' },
          { text: 'Skipping the tests', why: 'The point is that tests become easy.' },
        ],
        answer: 0,
        explain: 'And swapping implementations in production.',
      },
      {
        id: 's13-10-10',
        type: 'mcq',
        prompt: 'A subclass overrides a method to raise "not supported". Which principle suffers?',
        options: [
          { text: 'Liskov substitution' },
          { text: 'Open/closed', why: 'Adding a subclass is fine; breaking the promise is not.' },
          { text: 'Single responsibility', why: 'The class may still have one job.' },
        ],
        answer: 0,
        explain: 'Code using the base class now crashes on this subclass.',
      },
    ],
  },
];
