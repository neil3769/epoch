import type { Lab } from '../schema';

/*
 * Unit S13 labs. Lab 1: a small parking lot with composition, a pricing
 * strategy and an injected clock, with scaffolding. Lab 2, from empty
 * functions: a state table, an event bus, a counting decorator and a
 * locked update.
 */
export const s13Labs: Lab[] = [
  {
    id: 's13-lab-1',
    title: 'A parking lot',
    intro: 'Build the classic interview design in small pieces: a lot that hands out spots, a ticket that holds an injected clock, and pricing rules passed in as strategies.',
    summary: 'You built a parking lot with composition, strategies and an injected clock.',
    minutes: 12,
    unlockAfter: 's13-05',
    steps: [
      {
        goal: 'Finish `Lot.park(plate)`: take the first free spot, remember it for the plate, and return it; return None when full.',
        starter: 'class Lot:\n    def __init__(self, size):\n        self.free = list(range(size))\n        self.cars = {}\n\n    def park(self, plate):\n        if not self.free:\n            return ___\n        spot = self.free.pop(0)\n        self.cars[plate] = spot\n        return spot',
        solution: 'class Lot:\n    def __init__(self, size):\n        self.free = list(range(size))\n        self.cars = {}\n\n    def park(self, plate):\n        if not self.free:\n            return None\n        spot = self.free.pop(0)\n        self.cars[plate] = spot\n        return spot',
        tests: [
          'lot = Lot(1)',
          'assert lot.park("A1") == 0, "first spot"',
          'assert lot.park("B2") is None, "full"',
        ].join('\n'),
        hints: ['A full lot gives no spot.', 'class Lot:\n    def __init__(self, size):\n        self.free = list(range(size))\n        self.cars = {}\n\n    def park(self, plate):\n        if not self.free:\n            return ___\n        spot = self.free.pop(0)\n        self.cars[plate] = spot\n        return spot'],
      },
      {
        goal: 'Finish `leave(lot, plate)`: free the plate\'s spot (put it back in `lot.free`) and return it.',
        starter: 'def leave(lot, plate):\n    spot = lot.cars.pop(plate)\n    lot.free.___(spot)\n    return spot',
        solution: 'def leave(lot, plate):\n    spot = lot.cars.pop(plate)\n    lot.free.append(spot)\n    return spot',
        tests: [
          'lot = Lot(1)',
          'lot.park("A1")',
          'assert leave(lot, "A1") == 0 and lot.free == [0], f"free {lot.free}"',
          'assert lot.park("B2") == 0, "the spot can be reused"',
        ].join('\n'),
        hints: ['Add the spot back to the free list.', 'def leave(lot, plate):\n    spot = lot.cars.pop(plate)\n    lot.free.___(spot)\n    return spot'],
      },
      {
        goal: 'Finish `Ticket`: it is given a `clock` function; `start` is the time when the ticket is made, and `hours()` is the time since then.',
        starter: 'class Ticket:\n    def __init__(self, clock):\n        self.clock = clock\n        self.start = clock()\n\n    def hours(self):\n        now = self.clock()\n        return now ___ self.start',
        solution: 'class Ticket:\n    def __init__(self, clock):\n        self.clock = clock\n        self.start = clock()\n\n    def hours(self):\n        now = self.clock()\n        return now - self.start',
        tests: [
          'now = [9]',
          't = Ticket(lambda: now[0])',
          'now[0] = 12',
          'assert t.hours() == 3, f"got {t.hours()}"',
        ].join('\n'),
        hints: ['Time now minus time at the start.', 'class Ticket:\n    def __init__(self, clock):\n        self.clock = clock\n        self.start = clock()\n\n    def hours(self):\n        now = self.clock()\n        return now ___ self.start'],
        explain: 'Because the clock is passed in, the test controls time.',
      },
      {
        goal: 'Finish `price(ticket, rule)`: apply a pricing strategy (a function of hours) to the ticket.',
        starter: 'def hourly(h):\n    return 2 * h\n\ndef flat(h):\n    return 10\n\ndef price(ticket, rule):\n    return ___(ticket.hours())',
        solution: 'def hourly(h):\n    return 2 * h\n\ndef flat(h):\n    return 10\n\ndef price(ticket, rule):\n    return rule(ticket.hours())',
        tests: [
          'now = [9]',
          't = Ticket(lambda: now[0])',
          'now[0] = 12',
          'assert price(t, hourly) == 6, "3 hours at 2"',
          'assert price(t, flat) == 10, "flat rate"',
        ].join('\n'),
        hints: ['Call the rule you were given.', 'def hourly(h):\n    return 2 * h\n\ndef flat(h):\n    return 10\n\ndef price(ticket, rule):\n    return ___(ticket.hours())'],
        explain: 'A weekend rate is one new function; price() never changes.',
      },
    ],
  },
  {
    id: 's13-lab-2',
    title: 'States, events and locks',
    intro: 'From empty functions: a state machine as a transition table, an event bus with subscribers, a decorator that counts calls, and an update guarded by a lock.',
    summary: 'You wrote a state machine, an event bus, a decorator and a locked update.',
    minutes: 15,
    unlockAfter: 's13-09',
    steps: [
      {
        goal: 'Write `transition(state, action)`: use the table below; raise ValueError for an action not allowed in the state. `T = {("placed", "pay"): "paid", ("paid", "ship"): "shipped", ("placed", "cancel"): "void"}` is defined for you in the tests; define it above your function too.',
        starter: 'def transition(state, action):\n    pass',
        solution: 'T = {("placed", "pay"): "paid",\n     ("paid", "ship"): "shipped",\n     ("placed", "cancel"): "void"}\n\ndef transition(state, action):\n    key = (state, action)\n    if key not in T:\n        raise ValueError(key)\n    return T[key]',
        tests: [
          'assert transition("placed", "pay") == "paid", "pay a placed order"',
          'assert transition("paid", "ship") == "shipped", "ship a paid order"',
          'try:',
          '    transition("placed", "ship")',
          '    assert False, "shipping before paying must raise"',
          'except ValueError:',
          '    pass',
        ].join('\n'),
        hints: [
          'Look the pair up; refuse if it is missing.',
          'T = {("placed", "pay"): "paid",\n     ("paid", "ship"): "shipped",\n     ("placed", "cancel"): "void"}\n\ndef transition(state, action):\n    key = (state, action)\n    if key not in T:\n        raise ___(key)\n    return T[key]',
        ],
      },
      {
        goal: 'Write `subscribe(bus, event, fn)`: `bus` is a dict from event name to a list of functions; add `fn` to the list for `event`, creating it if needed.',
        starter: 'def subscribe(bus, event, fn):\n    pass',
        solution: 'def subscribe(bus, event, fn):\n    subs = bus.setdefault(event, [])\n    subs.append(fn)',
        tests: [
          'b = {}',
          'subscribe(b, "paid", print)',
          'subscribe(b, "paid", len)',
          'assert b == {"paid": [print, len]}, f"got {b}"',
        ].join('\n'),
        hints: ['`setdefault` creates the list the first time.', 'def subscribe(bus, event, fn):\n    subs = bus.setdefault(event, [])\n    subs.___(fn)'],
      },
      {
        goal: 'Write `publish(bus, event, data)`: call every subscriber of `event` with `data` and return their results in order (an empty list if there are none).',
        starter: 'def publish(bus, event, data):\n    pass',
        solution: 'def publish(bus, event, data):\n    subs = bus.get(event, [])\n    return [fn(data) for fn in subs]',
        tests: [
          'b = {}',
          'subscribe(b, "paid", lambda d: "email " + d)',
          'subscribe(b, "paid", lambda d: "stock " + d)',
          'assert publish(b, "paid", "o7") == ["email o7", "stock o7"], "both called"',
          'assert publish(b, "refund", "o7") == [], "nobody listening"',
        ].join('\n'),
        hints: ['Get the list with a default, then call each.', 'def publish(bus, event, data):\n    subs = bus.get(event, ___)\n    return [fn(data) for fn in subs]'],
        explain: 'The publisher never knows who is listening.',
      },
      {
        goal: 'Write `counted(fn)`: a decorator whose wrapper calls `fn` and adds one to `wrapper.calls` (starting at 0) on every call.',
        starter: 'def counted(fn):\n    pass',
        solution: 'def counted(fn):\n    def wrapper(*args):\n        wrapper.calls += 1\n        return fn(*args)\n    wrapper.calls = 0\n    return wrapper',
        tests: [
          '@counted',
          'def add(a, b):',
          '    return a + b',
          'assert add(2, 3) == 5, "still adds"',
          'add(1, 1)',
          'assert add.calls == 2, f"calls {add.calls}"',
        ].join('\n'),
        hints: [
          'Functions can carry attributes; set it before returning.',
          'def counted(fn):\n    def wrapper(*args):\n        wrapper.calls += 1\n        return fn(*args)\n    wrapper.calls = ___\n    return wrapper',
        ],
      },
      {
        goal: 'Write `add_safely(lock, box, n)`: inside `with lock:`, add `n` to `box["total"]` and return the new total.',
        starter: 'def add_safely(lock, box, n):\n    pass',
        solution: 'def add_safely(lock, box, n):\n    with lock:\n        box["total"] += n\n        return box["total"]',
        tests: [
          'import threading',
          'lk = threading.Lock()',
          'bx = {"total": 100}',
          'assert add_safely(lk, bx, 20) == 120, "first deposit"',
          'assert add_safely(lk, bx, 50) == 170, "second deposit"',
          'assert not lk.locked(), "the lock must be released"',
        ].join('\n'),
        hints: [
          'Read, add and write inside one with block.',
          'def add_safely(lock, box, n):\n    with ___:\n        box["total"] += n\n        return box["total"]',
        ],
        explain: 'Returning inside the block still releases the lock.',
      },
    ],
  },
];
