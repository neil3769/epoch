import type { Lab } from '../schema';

/*
 * Unit S7 labs. Lab 1: quorums, with scaffolding (majority, overlap rule,
 * quorum read, writable). Lab 2, from empty functions: Lamport clocks and
 * fencing tokens.
 */
export const s7Labs: Lab[] = [
  {
    id: 's7-lab-1',
    title: 'Quorums',
    intro: 'Write the arithmetic of replicated reads and writes: a majority, the overlap rule, a quorum read that keeps the newest version, and whether writes can still succeed with replicas down.',
    summary: 'You can check any quorum setting and read from replicas safely.',
    minutes: 12,
    unlockAfter: 's7-06',
    steps: [
      {
        goal: 'Finish `majority(n)`: the smallest number of replicas that is more than half.',
        starter: 'def majority(n):\n    return n // 2 ___ 1',
        solution: 'def majority(n):\n    return n // 2 + 1',
        tests: 'assert [majority(n) for n in (3, 4, 5)] == [2, 3, 3], f"got {[majority(n) for n in (3, 4, 5)]}"',
        hints: ['Half, rounded down, plus one.', 'def majority(n):\n    return n // 2 ___ 1'],
      },
      {
        goal: 'Finish `overlaps(w, r, n)`: True when every read set must meet every write set.',
        starter: 'def overlaps(w, r, n):\n    return w + r ___ n',
        solution: 'def overlaps(w, r, n):\n    return w + r > n',
        tests: [
          'assert overlaps(2, 2, 3) and not overlaps(1, 2, 3), "N = 3"',
          'assert overlaps(4, 2, 5) and not overlaps(3, 2, 5), "N = 5"',
        ].join('\n'),
        hints: ['Strictly more than N.', 'def overlaps(w, r, n):\n    return w + r ___ n'],
      },
      {
        goal: 'Finish `quorum_read(replies)`: replies are `(version, value)` pairs; return the value with the highest version.',
        starter: 'def quorum_read(replies):\n    version, value = ___(replies)\n    return value',
        solution: 'def quorum_read(replies):\n    version, value = max(replies)\n    return value',
        tests: 'assert quorum_read([(1, "a"), (3, "c"), (2, "b")]) == "c", "newest version wins"',
        hints: ['Tuples compare by their first item.', 'def quorum_read(replies):\n    version, value = ___(replies)\n    return value'],
      },
      {
        goal: 'Finish `writable(n, w, down)`: True if a write needing `w` acknowledgements can succeed with `down` replicas unavailable.',
        starter: 'def writable(n, w, down):\n    return n - down >= ___',
        solution: 'def writable(n, w, down):\n    return n - down >= w',
        tests: [
          'assert writable(3, 2, 1), "2 of 3 up, W = 2"',
          'assert not writable(3, 3, 1), "W = N fails with one down"',
        ].join('\n'),
        hints: ['Enough replicas must be up.', 'def writable(n, w, down):\n    return n - down >= ___'],
        explain: 'Pick W and R that overlap and still work with the failures you plan for.',
      },
    ],
  },
  {
    id: 's7-lab-2',
    title: 'Clocks and fences',
    intro: 'Implement Lamport clocks and fencing tokens, each from an empty function: local events, sending, receiving, ordering a log, and a storage that refuses stale lock holders.',
    summary: 'You built logical clocks and fencing-token checks.',
    minutes: 15,
    unlockAfter: 's7-09',
    steps: [
      {
        goal: 'Write `tick(c)`: a Lamport clock\'s value after a local event.',
        starter: 'def tick(c):\n    pass',
        solution: 'def tick(c):\n    return c + 1',
        tests: 'assert tick(0) == 1 and tick(41) == 42, "add one"',
        hints: ['Every event adds one.', 'def tick(c):\n    return c + ___'],
      },
      {
        goal: 'Write `receive(c, msg)`: the clock after receiving a message stamped `msg`.',
        starter: 'def receive(c, msg):\n    pass',
        solution: 'def receive(c, msg):\n    return max(c, msg) + 1',
        tests: [
          'assert receive(3, 7) == 8, f"got {receive(3, 7)}"',
          'assert receive(9, 2) == 10, "own clock ahead"',
        ].join('\n'),
        hints: ['Larger of the two, plus one.', 'def receive(c, msg):\n    return ___(c, msg) + 1'],
      },
      {
        goal: 'Write `in_order(events)`: events are `(stamp, machine, text)`; return the texts sorted by stamp, then machine name to break ties.',
        starter: 'def in_order(events):\n    pass',
        solution: 'def in_order(events):\n    return [t for _, _, t\n            in sorted(events)]',
        tests: [
          'ev = [(7, "B", "reply"), (5, "A", "question"), (5, "B", "hello")]',
          'assert in_order(ev) == ["question", "hello", "reply"], f"got {in_order(ev)}"',
        ].join('\n'),
        hints: ['Tuples sort by stamp, then by machine.', 'def in_order(events):\n    return [t for _, _, t\n            in ___(events)]'],
        explain: 'A total order that respects causality: the basis of replicated logs.',
      },
      {
        goal: 'Write `fenced(store, token, key, value)`: `store` is a dict with `"highest"`; reject (return False) if `token` is lower than it, otherwise record the token, write the value and return True.',
        starter: 'def fenced(store, token, key, value):\n    pass',
        solution: 'def fenced(store, token, key, value):\n    top = store.get("highest", 0)\n    if token < top:\n        return False\n    store["highest"] = token\n    store[key] = value\n    return True',
        tests: [
          's = {}',
          'assert fenced(s, 33, "x", "A") is True, "first holder writes"',
          'assert fenced(s, 34, "x", "B") is True, "newer holder writes"',
          'assert fenced(s, 33, "x", "A again") is False, "stale holder refused"',
          'assert s["x"] == "B", "B\'s write stands"',
        ].join('\n'),
        hints: [
          'Compare with the highest token seen, then update it.',
          'def fenced(store, token, key, value):\n    top = store.get("highest", 0)\n    if token < top:\n        return ___\n    store["highest"] = token\n    store[key] = value\n    return True',
        ],
      },
      {
        goal: 'Write `grant(state)`: a lock service handing out fencing tokens; `state` is a dict with `"next"` (start at 1). Return the next token and advance the counter.',
        starter: 'def grant(state):\n    pass',
        solution: 'def grant(state):\n    t = state.get("next", 1)\n    state["next"] = t + 1\n    return t',
        tests: [
          'st = {}',
          'assert [grant(st) for _ in range(3)] == [1, 2, 3], "tokens only grow"',
        ].join('\n'),
        hints: ['Return the current number, store the next.', 'def grant(state):\n    t = state.get("next", 1)\n    state["next"] = t + ___\n    return t'],
        explain: 'Ever-increasing tokens are what make the storage check work.',
      },
    ],
  },
];
