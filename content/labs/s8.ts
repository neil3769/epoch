import type { Lab } from '../schema';

/*
 * Unit S8 labs. Lab 1: a work queue with acknowledgements, redelivery and
 * idempotent handling, with scaffolding. Lab 2, from empty functions:
 * backoff, retries with a dead-letter list, partitioning and sagas.
 */
export const s8Labs: Lab[] = [
  {
    id: 's8-lab-1',
    title: 'A queue with acks',
    intro: 'Build the core of a work queue: taking a message, acknowledging it, handing unacknowledged messages out again after a timeout, and a consumer that is safe to repeat.',
    summary: 'You built at-least-once delivery and an idempotent consumer.',
    minutes: 12,
    unlockAfter: 's8-04',
    steps: [
      {
        goal: 'Finish `take(q, inflight)`: remove the oldest message from `q`, add it to `inflight` and return it.',
        starter: 'def take(q, inflight):\n    msg = q.pop(___)\n    inflight.append(msg)\n    return msg',
        solution: 'def take(q, inflight):\n    msg = q.pop(0)\n    inflight.append(msg)\n    return msg',
        tests: [
          'q, f = ["a", "b"], []',
          'assert take(q, f) == "a", "oldest first"',
          'assert q == ["b"] and f == ["a"], f"q={q}, inflight={f}"',
        ].join('\n'),
        hints: ['The oldest message is at position 0.', 'def take(q, inflight):\n    msg = q.pop(___)\n    inflight.append(msg)\n    return msg'],
      },
      {
        goal: 'Finish `ack(inflight, msg)`: the work is done, so forget the message for good.',
        starter: 'def ack(inflight, msg):\n    inflight.___(msg)',
        solution: 'def ack(inflight, msg):\n    inflight.remove(msg)',
        tests: [
          'f = ["a", "b"]',
          'ack(f, "a")',
          'assert f == ["b"], f"got {f}"',
        ].join('\n'),
        hints: ['A list method that deletes a given value.', 'def ack(inflight, msg):\n    inflight.___(msg)'],
      },
      {
        goal: 'Finish `expire(q, inflight)`: the timeout passed, so every unacknowledged message goes back on the queue.',
        starter: 'def expire(q, inflight):\n    q.___(inflight)\n    inflight.clear()',
        solution: 'def expire(q, inflight):\n    q.extend(inflight)\n    inflight.clear()',
        tests: [
          'q, f = ["c"], ["a"]',
          'expire(q, f)',
          'assert q == ["c", "a"] and f == [], f"q={q}, inflight={f}"',
        ].join('\n'),
        hints: ['Add all of one list to the end of another.', 'def expire(q, inflight):\n    q.___(inflight)\n    inflight.clear()'],
        explain: 'This is why a crash before the ack means the work can run twice.',
      },
      {
        goal: 'Finish `consume(seen, msg, log)`: append `msg` to `log` only the first time its id is seen; return True if it ran.',
        starter: 'def consume(seen, msg, log):\n    if msg ___ seen:\n        return False\n    seen.add(msg)\n    log.append(msg)\n    return True',
        solution: 'def consume(seen, msg, log):\n    if msg in seen:\n        return False\n    seen.add(msg)\n    log.append(msg)\n    return True',
        tests: [
          's, log = set(), []',
          'r = [consume(s, m, log) for m in ["a", "a", "b"]]',
          'assert r == [True, False, True], f"got {r}"',
          'assert log == ["a", "b"], "each message runs once"',
        ].join('\n'),
        hints: ['Skip ids already in the set.', 'def consume(seen, msg, log):\n    if msg ___ seen:\n        return False\n    seen.add(msg)\n    log.append(msg)\n    return True'],
        explain: 'At-least-once delivery plus this check gives effectively-once processing.',
      },
    ],
  },
  {
    id: 's8-lab-2',
    title: 'Retries, partitions and sagas',
    intro: 'From empty functions: capped exponential backoff, a retry loop that parks poison messages, a partitioner that keeps each key in order, and a saga that compensates in reverse.',
    summary: 'You wrote retries with a dead-letter list, key partitioning and saga compensation.',
    minutes: 15,
    unlockAfter: 's8-09',
    steps: [
      {
        goal: 'Write `backoff(n, base, cap)`: `base` doubled `n` times, but at most `cap`.',
        starter: 'def backoff(n, base, cap):\n    pass',
        solution: 'def backoff(n, base, cap):\n    return min(cap, base * 2 ** n)',
        tests: 'assert [backoff(n, 1, 10) for n in range(6)] == [1, 2, 4, 8, 10, 10], f"got {[backoff(n, 1, 10) for n in range(6)]}"',
        hints: ['The smaller of the cap and base × 2ⁿ.', 'def backoff(n, base, cap):\n    return ___(cap, base * 2 ** n)'],
      },
      {
        goal: 'Write `attempt(msg, handler, limit)`: call `handler(msg)` up to `limit` times until it does not raise. Return `("done", tries)` or, if every try raised, `("dead", limit)`.',
        starter: 'def attempt(msg, handler, limit):\n    pass',
        solution: 'def attempt(msg, handler, limit):\n    for tries in range(1, limit + 1):\n        try:\n            handler(msg)\n            return ("done", tries)\n        except Exception:\n            pass\n    return ("dead", limit)',
        tests: [
          'calls = []',
          'def flaky(m):',
          '    calls.append(m)',
          '    if len(calls) < 2:',
          '        raise ValueError("busy")',
          'def poison(m):',
          '    raise ValueError("bad")',
          'assert attempt("a", flaky, 3) == ("done", 2), "fails once, then works"',
          'assert attempt("b", poison, 3) == ("dead", 3), "always fails"',
        ].join('\n'),
        hints: [
          'Loop over the tries; return as soon as the handler does not raise.',
          'def attempt(msg, handler, limit):\n    for tries in range(1, limit + 1):\n        try:\n            handler(msg)\n            return ("done", ___)\n        except Exception:\n            pass\n    return ("dead", limit)',
        ],
      },
      {
        goal: 'Write `run_all(msgs, handler, limit)`: run `attempt` on each message; return a dict with lists `"done"` and `"dead"` of the messages.',
        starter: 'def run_all(msgs, handler, limit):\n    pass',
        solution: 'def run_all(msgs, handler, limit):\n    out = {"done": [], "dead": []}\n    for m in msgs:\n        r = attempt(m, handler, limit)\n        out[r[0]].append(m)\n    return out',
        tests: [
          'def h(m):',
          '    if m.startswith("bad"):',
          '        raise ValueError(m)',
          'got = run_all(["a", "bad1", "b"], h, 2)',
          'assert got == {"done": ["a", "b"], "dead": ["bad1"]}, f"got {got}"',
        ].join('\n'),
        hints: [
          'The status `attempt` returns first names the list to use.',
          'def run_all(msgs, handler, limit):\n    out = {"done": [], "dead": []}\n    for m in msgs:\n        r = attempt(m, handler, limit)\n        out[___].append(m)\n    return out',
        ],
        explain: 'The poison message is parked; the rest carry on.',
      },
      {
        goal: 'Write `partition(key, n)`: the sum of the key\'s character codes, modulo `n`.',
        starter: 'def partition(key, n):\n    pass',
        solution: 'def partition(key, n):\n    return sum(map(ord, key)) % n',
        tests: [
          'assert partition("acct7", 4) == 2, f"got {partition(\'acct7\', 4)}"',
          'assert all(partition("o9", 3) == partition("o9", 3) for _ in range(3)), "same key, same partition"',
        ].join('\n'),
        hints: ['`ord` gives a character\'s code.', 'def partition(key, n):\n    return sum(map(ord, key)) ___ n'],
      },
      {
        goal: 'Write `saga(steps, fail_at)`: run the steps in order; if a step equals `fail_at`, return `"undo "` plus each completed step, last first. Otherwise return the completed steps.',
        starter: 'def saga(steps, fail_at):\n    pass',
        solution: 'def saga(steps, fail_at):\n    done = []\n    for s in steps:\n        if s == fail_at:\n            back = reversed(done)\n            return ["undo " + d\n                    for d in back]\n        done.append(s)\n    return done',
        tests: [
          'st = ["stock", "card", "ship"]',
          'assert saga(st, "ship") == ["undo card", "undo stock"], f"got {saga(st, \'ship\')}"',
          'assert saga(st, None) == st, "no failure: all done"',
        ].join('\n'),
        hints: [
          'Keep a list of completed steps; on failure, walk it backwards.',
          'def saga(steps, fail_at):\n    done = []\n    for s in steps:\n        if s == fail_at:\n            back = ___(done)\n            return ["undo " + d\n                    for d in back]\n        done.append(s)\n    return done',
        ],
        explain: 'Each completed step is undone by a new action, in reverse order.',
      },
    ],
  },
];
