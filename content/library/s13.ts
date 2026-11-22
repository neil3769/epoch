import type { LibraryPage } from '../schema';

/** Unit S13 summary page: unlocked in the Library when the unit is finished. */
export const s13Library: LibraryPage = {
  unit: 'S13',
  ideas: [
    {
      title: 'Classes',
      text: 'Nouns with data and rules become classes, verbs become methods, and each rule lives in one class. Prefer composition ("has a", delegate to a part that can be swapped) over inheritance, which suits only a true, stable "is a". SOLID: one reason to change; extend by adding code; subclasses keep their base\'s promises; small interfaces; receive dependencies instead of creating them.',
    },
    {
      title: 'Patterns',
      text: 'Strategy: interchangeable algorithms behind one interface, often a function passed in. State: one class per mode, each deciding the next. Observer: announce events to subscribers. Decorator: wrap to add behaviour with the same interface. Factory: one place chooses the class to create. Adapter: make an existing class fit your interface.',
    },
    {
      title: 'Diagrams and threads',
      text: 'In class diagrams a triangle arrow is "is a", a diamond is "has a" (filled when the part dies with its whole), a dashed arrow is "uses", and numbers say how many. Shared data written by several threads needs a lock around each read-modify-write; use `with lock:`, take locks in one order, and prefer not sharing at all.',
    },
  ],
  rules: [
    'One reason to change per class.',
    'Has a → composition; is a → inheritance, rarely.',
    'New behaviour = new code, not a new elif.',
    'Pass in clocks, stores and clients.',
    'Name the problem, then pick the pattern.',
    'Read a diagram back as sentences.',
    'Read-modify-write on shared data: lock it.',
  ],
  example: {
    code: [
      'def regular(p):',
      '    return p',
      '',
      'def sale(p):',
      '    return p * 0.8',
      '',
      'def checkout(prices, rule):',
      '    return sum(map(rule, prices))',
      '',
      'print(checkout([10, 20], regular),',
      '      checkout([10, 20], sale))',
    ].join('\n'),
    output: '30 24.0',
    notes: ['The pricing rule is a strategy passed in.', 'A new rule is a new function; checkout never changes (open/closed).'],
  },
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
  mistakes: [
    { mistake: 'One class that does everything.', fix: 'Split by reason to change.' },
    { mistake: 'Subclassing to reuse a helper.', fix: 'Compose, or call a function.' },
    { mistake: 'Creating dependencies inside constructors.', fix: 'Pass them in; tests pass fakes.' },
    { mistake: 'Naming patterns before the problem.', fix: 'Describe the change you need, then choose.' },
    { mistake: 'Check-then-act on shared data.', fix: 'Lock the whole section, or use a database constraint.' },
  ],
  forReal:
    'Read the Python standard library\'s functools and threading pages, and Brandon Rhodes\'s "Python Patterns" site, which shows which classic patterns Python makes unnecessary. Then sketch the classes for a parking lot or an elevator and read your diagram back as sentences.',
};
