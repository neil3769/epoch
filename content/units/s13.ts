import { s13Labs } from '../labs/s13';
import { s13Library } from '../library/s13';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s13More } from './s13-more';

/*
 * S13 Low-level design in Python. Lessons 1-4 here: modelling with classes,
 * composition over inheritance, SOLID part 1 (single responsibility,
 * open/closed), SOLID part 2 (Liskov, interface segregation, dependency
 * inversion). Lessons 5-10 in s13-more.ts: strategy and state, observer and
 * decorator, factory and adapter, reading a class diagram, shared state and
 * locks, checkpoint.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's13-01',
    title: 'Modelling with classes',
    summary: 'Nouns that hold data and rules become classes, verbs become methods, and each class keeps its rules in one place.',
    card: {
      title: 'Modelling with classes',
      text: 'Start from the problem\'s nouns and verbs: nouns that hold data and rules become classes (ParkingLot, Spot, Ticket), and verbs become their methods (park, leave, pay). Give each class one clear job and change its data only through its methods, so each rule lives in one place. Begin with the few classes the main use case needs, and add more only when a requirement asks for them.',
    },
    exercises: [
      {
        id: 's13-1-1',
        type: 'bucket-sort',
        prompt: 'A library lends books to members. Class, method or attribute?',
        buckets: ['Class', 'Method', 'Attribute'],
        items: [
          { text: 'Book', bucket: 0, why: 'A noun with its own data and rules.' },
          { text: 'borrow', bucket: 1, why: 'A verb: something a member does.' },
          { text: 'due date', bucket: 2, why: 'A piece of data on a loan.' },
          { text: 'Member', bucket: 0, why: 'A noun with data (name, loans) and rules.' },
          { text: 'return a book', bucket: 1, why: 'An action that changes state.' },
          { text: 'title', bucket: 2, why: 'A plain value on a book.' },
        ],
        explain: 'Nouns with behaviour become classes; plain values become attributes.',
      },
      {
        id: 's13-1-2',
        type: 'predict-output',
        prompt: 'A lot with two spots. What do three arrivals get?',
        code: `class Lot:
    def __init__(self, size):
        self.free = list(range(size))
        self.cars = {}

    def park(self, plate):
        if not self.free:
            return None
        spot = self.free.pop(0)
        self.cars[plate] = spot
        return spot

lot = Lot(2)
print(lot.park("A1"), lot.park("B2"),
      lot.park("C3"))`,
        answer: '0 1 None',
        typedWrong: [{ answer: '0 1 2', why: 'Only spots 0 and 1 exist; the lot is full.' }],
        explain: 'The rule "no spot, no parking" lives inside the class.',
      },
      {
        id: 's13-1-3',
        type: 'mcq',
        prompt: 'Where should the rule "a member may borrow at most five books" live?',
        options: [
          { text: 'In the Member class' },
          { text: 'In every screen that borrows', why: 'Copies drift apart, and one will forget the check.' },
          { text: 'In a global settings dict', why: 'The limit can live there, but the check belongs with the member.' },
        ],
        answer: 0,
        explain: 'One method checks it; every caller goes through that method.',
      },
      {
        id: 's13-1-4',
        type: 'run-code',
        prompt: 'Write a class `Account`: `balance` starts at 0, `deposit(n)` adds to it, and `withdraw(n)` raises ValueError if `n` is more than the balance, otherwise subtracts it.',
        solution: `class Account:
    def __init__(self):
        self.balance = 0
    def deposit(self, n):
        self.balance += n
    def withdraw(self, n):
        if n > self.balance:
            raise ValueError("no")
        self.balance -= n`,
        tests: [
          'a = Account()',
          'a.deposit(50)',
          'a.withdraw(20)',
          'assert a.balance == 30, f"balance {a.balance}"',
          'try:',
          '    a.withdraw(100)',
          '    assert False, "overdrawing must raise"',
          'except ValueError:',
          '    pass',
          'assert a.balance == 30, "a refused withdrawal changes nothing"',
        ].join('\n'),
        maxLines: 10,
        placeholder: 'class Account:',
        explain: 'The account protects its own rule: no caller can overdraw it.',
      },
      {
        id: 's13-1-5',
        type: 'scenario',
        prompt: 'Design a vending machine for an interview. A teammate starts with one class, Machine, holding every method.',
        situation: 'It must track stock, take coins, give change and report sales.',
        needs: ['Easy to explain', 'Each rule in one place'],
        options: [
          {
            text: 'A few classes, one job each',
            cost: 'More names to introduce.',
          },
          {
            text: 'One Machine class does it all',
            cost: 'Everything in one file.',
            why: 'Stock, payment and reporting rules tangle together and every change risks the rest.',
          },
        ],
        answer: 0,
        explain: 'Inventory, CoinBox and SalesLog, coordinated by Machine.',
      },
      {
        id: 's13-1-6',
        type: 'predict-output',
        prompt: 'The setter refuses impossible values. What does this print?',
        code: `class Temp:
    def __init__(self):
        self._c = 0

    def set_c(self, c):
        if c < -273.15:
            raise ValueError("cold")
        self._c = c

t = Temp()
try:
    t.set_c(-300)
except ValueError as e:
    print(e, t._c)`,
        answer: 'cold 0',
        typedWrong: [{ answer: 'cold -300', why: 'The check raises before the value is stored.' }],
        explain: 'The leading underscore says "change me through the methods".',
      },
      {
        id: 's13-1-7',
        type: 'order-steps',
        prompt: 'Designing classes from a prompt. Put it in order.',
        steps: [
          'List the main use cases',
          'Pick out the nouns and verbs',
          'Choose classes and their data',
          'Give each class its methods',
          'Walk a use case through them',
        ],
        explain: 'The walk-through finds missing methods before any code is written.',
      },
      {
        id: 's13-1-8',
        type: 'fill-blank',
        prompt: 'Store the title on the new object.',
        code: `class Book:
    def __init__(self, title):
        ___.title = title

print(Book("Dune").title)`,
        answer: ['self'],
        distractors: [{ text: 'title', why: 'A string has no attribute to set: this raises an error.' }],
        expectOutput: 'Dune',
        explain: '`self` is the object being created.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's13-02',
    title: 'Composition over inheritance',
    summary: 'Inheritance for a true "is a"; composition for "has a", where parts can be mixed and swapped.',
    card: {
      title: 'Composition over inheritance',
      text: 'Inheritance says a class is a kind of another (a Car is a Vehicle) and reuses its code; composition says a class has another as a part (a Car has an Engine) and passes calls on to it. Deep inheritance trees break when a new case fits two branches, such as a flying car, while composed parts can be mixed freely and swapped at run time. Prefer composition, and keep inheritance for a true "is a" with a small, stable base class.',
    },
    exercises: [
      {
        id: 's13-2-1',
        type: 'bucket-sort',
        prompt: 'Is a, or has a?',
        buckets: ['Is a', 'Has a'],
        items: [
          { text: 'Car and Vehicle', bucket: 0, why: 'A car is a kind of vehicle.' },
          { text: 'Car and Engine', bucket: 1, why: 'An engine is a part of a car.' },
          { text: 'Order and LineItem', bucket: 1, why: 'An order contains line items.' },
          { text: 'Square and Shape', bucket: 0, why: 'A square is a kind of shape.' },
          { text: 'Playlist and Song', bucket: 1, why: 'A playlist holds songs.' },
        ],
        explain: '"Is a" suggests inheritance; "has a" means composition.',
      },
      {
        id: 's13-2-2',
        type: 'predict-output',
        prompt: 'A car gets its engine from outside. What do the two cars say?',
        code: `class Engine:
    def start(self):
        return "vroom"

class Electric:
    def start(self):
        return "hum"

class Car:
    def __init__(self, engine):
        self.engine = engine

    def start(self):
        return self.engine.start()

print(Car(Engine()).start(),
      Car(Electric()).start())`,
        answer: 'vroom hum',
        typedWrong: [{ answer: 'vroom vroom', why: 'The second car was given an Electric engine.' }],
        explain: 'Same Car class, different part: no ElectricCar subclass needed.',
      },
      {
        id: 's13-2-3',
        type: 'mcq',
        prompt: 'Ducks may fly or not, and quack or squeak. Modelling every mix with subclasses needs four of them. What avoids that?',
        options: [
          { text: 'Give each duck a fly and a sound part' },
          { text: 'A deeper tree of duck subclasses', why: 'Each new option doubles the number of classes.' },
          { text: 'One duck class full of if-checks', why: 'Every new option edits the same tangle.' },
        ],
        answer: 0,
        explain: 'Two parts with two choices each cover all four ducks, and a third sound needs one new class.',
      },
      {
        id: 's13-2-4',
        type: 'predict-output',
        prompt: 'Puppy inherits from Dog, which inherits from Animal. What does a puppy say?',
        code: `class Animal:
    def speak(self):
        return "..."

class Dog(Animal):
    def speak(self):
        return "woof"

class Puppy(Dog):
    pass

print(Puppy().speak())`,
        answer: 'woof',
        typedWrong: [{ answer: '...', why: 'Python finds Dog\'s speak first, before Animal\'s.' }],
        explain: 'Lookup goes up the tree and stops at the nearest definition.',
      },
      {
        id: 's13-2-5',
        type: 'scenario',
        prompt: 'A game has Warrior and Mage subclasses. Now designers want a warrior who casts spells.',
        situation: 'More mixed classes are planned.',
        needs: ['New mixes without new subclasses'],
        options: [
          {
            text: 'Give characters ability objects',
            cost: 'A small Ability interface to design.',
          },
          {
            text: 'Add a WarriorMage subclass',
            cost: 'Quick today.',
            why: 'Every new mix needs another class, and code gets copied between them.',
          },
        ],
        answer: 0,
        explain: 'A character has a list of abilities: Sword, Fireball, Heal, in any mix.',
      },
      {
        id: 's13-2-6',
        type: 'match-pairs',
        prompt: 'Match each idea to what it means.',
        pairs: [
          { left: 'Inheritance', right: 'is a kind of', why: 'The subclass reuses and extends the base.' },
          { left: 'Composition', right: 'has a part', why: 'The whole holds other objects.' },
          { left: 'Delegation', right: 'passes the call on', why: 'The whole asks its part to do the work.' },
        ],
        explain: 'Composition plus delegation gives reuse without a fixed tree.',
      },
      {
        id: 's13-2-7',
        type: 'mcq',
        prompt: 'When is inheritance the right choice?',
        options: [
          { text: 'A true, stable "is a"' },
          { text: 'To reuse a few helpers', why: 'Use a function or a part for that; inheritance ties the classes together for good.' },
          { text: 'Whenever classes share a field', why: 'Sharing a field is not being a kind of the other.' },
        ],
        answer: 0,
        explain: 'For example, every Exception subclass really is an exception.',
      },
      {
        id: 's13-2-8',
        type: 'fill-blank',
        prompt: 'The service delegates logging to its part.',
        code: `class Logger:
    def log(self, m):
        return "LOG " + m

class Service:
    def __init__(self):
        self.logger = Logger()

    def run(self):
        return self.___.log("ran")

print(Service().run())`,
        answer: ['logger'],
        distractors: [{ text: 'Logger', why: 'The service has no attribute named Logger.' }],
        expectOutput: 'LOG ran',
        explain: 'The service has a logger and asks it to do the logging.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's13-03',
    title: 'SOLID: one job, open to extension',
    summary: 'One reason to change per class; add behaviour by adding code, not by editing a growing chain.',
    card: {
      title: 'SOLID: one job, open to extension',
      text: 'Single responsibility: a class should have one reason to change, so an invoice that also renders PDFs, sends emails and saves itself is split into parts. Open/closed: add new behaviour by adding code, such as a new class or a new entry in a table, rather than editing a growing if/elif chain every time. Both keep each change small and local, and the rest of SOLID serves the same goal.',
    },
    exercises: [
      {
        id: 's13-3-1',
        type: 'bucket-sort',
        prompt: 'An Invoice class does all of these. Keep each in Invoice, or move it out?',
        buckets: ['Keep', 'Move out'],
        items: [
          { text: 'Computing the total', bucket: 0, why: 'That is what an invoice is about.' },
          { text: 'Applying discount rules to lines', bucket: 0, why: 'Part of working out what is owed.' },
          { text: 'Rendering itself as a PDF', bucket: 1, why: 'Changes when the layout changes, not the maths.' },
          { text: 'Emailing the customer', bucket: 1, why: 'Changes when the mail provider changes.' },
          { text: 'Saving itself to the database', bucket: 1, why: 'Changes when storage changes.' },
        ],
        explain: 'Each moved job has its own reason to change.',
      },
      {
        id: 's13-3-2',
        type: 'predict-output',
        prompt: 'Shipping rules live in a table. A new one is added without touching the others. What does this print?',
        code: `SHIPPING = {
    "standard": lambda kg: 5,
    "express": lambda kg: 5 + 2 * kg,
}
SHIPPING["drone"] = lambda kg: 12

ms = ["standard", "express", "drone"]
print([SHIPPING[m](3) for m in ms])`,
        answer: '[5, 11, 12]',
        typedWrong: [{ answer: '[5, 7, 12]', why: 'Express is 5 + 2 × 3 = 11.' }],
        explain: 'Open for extension (a new entry), closed for modification (no edits to old rules).',
      },
      {
        id: 's13-3-3',
        type: 'mcq',
        prompt: 'What does "single responsibility" mean?',
        options: [
          { text: 'One reason to change' },
          { text: 'Only one method each', why: 'A class can have many methods serving one job.' },
          { text: 'Fewer than 100 lines', why: 'Size is a hint, not the rule.' },
        ],
        answer: 0,
        explain: 'Ask: who would ask for this class to change? One answer is the goal.',
      },
      {
        id: 's13-3-4',
        type: 'scenario',
        prompt: 'Payments go through a long if/elif on the method name. Adding PayPal broke card payments last month.',
        situation: 'Two more payment methods are planned this year.',
        needs: ['New methods without touching old ones'],
        options: [
          {
            text: 'One class per payment method',
            cost: 'A shared interface to define.',
          },
          {
            text: 'Add another elif branch',
            cost: 'Three lines each time.',
            why: 'Every addition edits the code that already works, as last month showed.',
          },
        ],
        answer: 0,
        explain: 'A table maps the method name to its class; adding one touches nothing else.',
      },
      {
        id: 's13-3-5',
        type: 'order-steps',
        prompt: 'Splitting a class that does too much. Put it in order.',
        steps: [
          'Make sure tests cover the class',
          'List its separate jobs',
          'Move one job into its own class',
          'Have the original call the new class',
          'Run the tests, then repeat for the next job',
        ],
        explain: 'Small moves with tests in between keep the refactor safe.',
      },
      {
        id: 's13-3-6',
        type: 'predict-output',
        prompt: 'Report computes; TextFormat renders. What does this print?',
        code: `class Report:
    def __init__(self, rows):
        self.rows = rows

    def total(self):
        return sum(self.rows)

class TextFormat:
    def render(self, r):
        return f"Total: {r.total()}"

r = Report([2, 3])
print(TextFormat().render(r))`,
        answer: 'Total: 5',
        typedWrong: [{ answer: 'Total: [2, 3]', why: '`total()` sums the rows.' }],
        explain: 'A PDF format would be another class; Report never changes for it.',
      },
      {
        id: 's13-3-7',
        type: 'mcq',
        prompt: '"Open for extension, closed for modification" means…',
        options: [
          { text: 'Add new code, don\'t edit old' },
          { text: 'Never change any code again', why: 'Bugs still get fixed; the aim is that features do not need edits.' },
          { text: 'Make every class public', why: 'Unrelated to visibility.' },
        ],
        answer: 0,
        explain: 'New behaviour plugs in beside the old.',
      },
      {
        id: 's13-3-8',
        type: 'fill-blank',
        prompt: 'A decorator registers each reader under its file kind.',
        code: `handlers = {}
def handles(kind):
    def wrap(fn):
        handlers[___] = fn
        return fn
    return wrap

@handles("csv")
def read_csv(t):
    return t.split(",")

@handles("semi")
def read_semi(t):
    return t.split(";")

print(handlers["semi"]("a;b"))`,
        answer: ['kind'],
        distractors: [{ text: '"csv"', why: 'Both readers would be stored under "csv".' }],
        expectOutput: "['a', 'b']",
        explain: 'A new file kind is one new function; nothing else changes.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's13-04',
    title: 'SOLID: substitution and dependencies',
    summary: 'Subclasses keep their base\'s promises, interfaces stay small, and code receives its dependencies.',
    card: {
      title: 'SOLID: substitution and dependencies',
      text: 'Liskov substitution: a subclass must work anywhere its base class is expected, so a Square that breaks Rectangle\'s promise that width and height change separately should not inherit from it. Interface segregation: depend on small interfaces, not one large one that forces classes to fake methods they cannot support. Dependency inversion: high-level code receives what it needs (storage, a clock, a mailer) as parameters instead of creating concrete ones, so tests and new versions can pass in others.',
    },
    exercises: [
      {
        id: 's13-4-1',
        type: 'predict-output',
        prompt: '`stretch` was written for rectangles. What does it return for each?',
        code: `class Rect:
    def __init__(self, w, h):
        self.w, self.h = w, h

    def set_w(self, w):
        self.w = w

class Square(Rect):
    def set_w(self, w):
        self.w = self.h = w

def stretch(r):
    r.set_w(10)
    return r.w * r.h

print(stretch(Rect(2, 3)),
      stretch(Square(3, 3)))`,
        answer: '30 100',
        typedWrong: [{ answer: '30 30', why: 'The square changes its height too: 10 × 10.' }],
        explain: 'Code that trusted Rect\'s promise now gets a surprise: Square is not a safe Rect.',
      },
      {
        id: 's13-4-2',
        type: 'mcq',
        prompt: 'Which breaks Liskov substitution?',
        options: [
          { text: 'Penguin.fly() raises an error' },
          { text: 'Dog adds a fetch() method', why: 'Adding methods keeps every promise of the base.' },
          { text: 'Cat overrides speak()', why: 'Overriding is fine if it still does what speak promises.' },
        ],
        answer: 0,
        explain: 'Code looping over birds and calling fly() now crashes on a penguin.',
      },
      {
        id: 's13-4-3',
        type: 'predict-output',
        prompt: 'The greeter receives its clock. What do the two greet?',
        code: `class Greeter:
    def __init__(self, clock):
        self.clock = clock

    def greet(self):
        if self.clock() < 12:
            return "Morning"
        return "Hi"

print(Greeter(lambda: 9).greet(),
      Greeter(lambda: 15).greet())`,
        answer: 'Morning Hi',
        typedWrong: [{ answer: 'Morning Morning', why: 'The second greeter\'s clock says 15.' }],
        explain: 'A test can pass in any hour; no waiting for the real afternoon.',
      },
      {
        id: 's13-4-4',
        type: 'scenario',
        prompt: 'OrderService creates a real payment client inside its constructor. Tests now need the network and a sandbox account.',
        situation: 'There are 200 order tests.',
        needs: ['Fast tests with no network', 'Real payments in production'],
        options: [
          {
            text: 'Pass the payment client in',
            cost: 'Callers build and pass it.',
          },
          {
            text: 'Patch the network in each test',
            cost: 'Nothing changes in OrderService.',
            why: '200 tests each reach into the internals; any change to them breaks the patches.',
          },
        ],
        answer: 0,
        explain: 'Tests pass a fake client; production passes the real one.',
      },
      {
        id: 's13-4-5',
        type: 'match-pairs',
        prompt: 'Match each principle to its meaning.',
        pairs: [
          { left: 'Liskov', right: 'subclasses keep the promises', why: 'They work wherever the base is used.' },
          { left: 'Interface segregation', right: 'small interfaces', why: 'No class fakes methods it cannot do.' },
          { left: 'Dependency inversion', right: 'receive what you need', why: 'Depend on an interface given to you.' },
        ],
        explain: 'Together with single responsibility and open/closed: SOLID.',
      },
      {
        id: 's13-4-6',
        type: 'mcq',
        prompt: 'A Device interface has print, scan and fax. A simple printer must define fax() just to raise an error. Fix?',
        options: [
          { text: 'Split into small interfaces' },
          { text: 'Make fax() quietly do nothing', why: 'Callers think the fax was sent.' },
          { text: 'Add more methods to Device', why: 'That makes the problem worse.' },
        ],
        answer: 0,
        explain: 'Printer, Scanner and Fax interfaces; a combined machine implements all three.',
      },
      {
        id: 's13-4-7',
        type: 'run-code',
        prompt: 'Write a class `FakeMailer` for tests: it starts with an empty list `sent`, and `send(to, text)` appends the pair `(to, text)` to it.',
        solution: `class FakeMailer:
    def __init__(self):
        self.sent = []

    def send(self, to, text):
        self.sent.append((to, text))`,
        tests: [
          'm = FakeMailer()',
          'm.send("ann@x.io", "Welcome")',
          'assert m.sent == [("ann@x.io", "Welcome")], f"got {m.sent}"',
          'assert FakeMailer().sent == [], "each fake starts empty"',
        ].join('\n'),
        maxLines: 6,
        placeholder: 'class FakeMailer:',
        explain: 'Pass it to the code under test, then check what would have been sent.',
      },
      {
        id: 's13-4-8',
        type: 'fill-blank',
        prompt: 'Notes saves into whatever store it is given.',
        code: `class Notes:
    def __init__(self, store):
        self.store = store

    def add(self, text):
        self.___.append(text)

mem = []
Notes(mem).add("hi")
print(mem)`,
        answer: ['store'],
        distractors: [{ text: 'text', why: '`self.text` does not exist: Notes never stored it.' }],
        expectOutput: "['hi']",
        explain: 'A list in tests, a database wrapper in production.',
      },
    ],
  },
];

export const s13: Unit = {
  id: 'S13',
  track: 'system-design',
  title: 'Low-level design in Python',
  blurb: 'Modelling a problem as classes, composition versus inheritance, SOLID by example, the patterns that matter (strategy, state, observer, decorator, factory, adapter), reading class diagrams, and shared state with locks.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s13More],
  labs: s13Labs,
  library: s13Library,
};
