import type { Lab } from '../schema';

/*
 * Unit S10 labs. Lab 1: deadlines, retry rules, a retry budget and a
 * fallback, with scaffolding. Lab 2, from empty functions: a circuit
 * breaker, an error budget and an ownership check.
 */
export const s10Labs: Lab[] = [
  {
    id: 's10-lab-1',
    title: 'Deadlines and retries',
    intro: 'Write the small rules that keep one slow dependency from taking a service down: time left before a deadline, when to retry, a retry budget, and a fallback when a call fails.',
    summary: 'You wrote deadline, retry and fallback rules.',
    minutes: 12,
    unlockAfter: 's10-04',
    steps: [
      {
        goal: 'Finish `remaining(deadline, now)`: milliseconds left, never below 0.',
        starter: 'def remaining(deadline, now):\n    return max(___, deadline - now)',
        solution: 'def remaining(deadline, now):\n    return max(0, deadline - now)',
        tests: [
          'assert remaining(1000, 940) == 60, f"got {remaining(1000, 940)}"',
          'assert remaining(1000, 1200) == 0, "past the deadline"',
        ].join('\n'),
        hints: ['Clamp at zero.', 'def remaining(deadline, now):\n    return max(___, deadline - now)'],
      },
      {
        goal: 'Finish `should_retry(status, n, limit)`: retry only 408, 429 or 503, and only while attempt `n` is below `limit`.',
        starter: 'RETRYABLE = {408, 429, 503}\n\ndef should_retry(status, n, limit):\n    ok = status in RETRYABLE\n    return ok ___ n < limit',
        solution: 'RETRYABLE = {408, 429, 503}\n\ndef should_retry(status, n, limit):\n    ok = status in RETRYABLE\n    return ok and n < limit',
        tests: [
          'assert should_retry(503, 1, 3), "temporary, tries left"',
          'assert not should_retry(503, 3, 3), "out of tries"',
          'assert not should_retry(400, 1, 3), "permanent error"',
        ].join('\n'),
        hints: ['Both conditions must hold.', 'RETRYABLE = {408, 429, 503}\n\ndef should_retry(status, n, limit):\n    ok = status in RETRYABLE\n    return ok ___ n < limit'],
      },
      {
        goal: 'Finish `may_retry(calls, retries, ratio)`: True while retries stay below `ratio` of calls.',
        starter: 'def may_retry(calls, retries, ratio):\n    return retries ___ calls * ratio',
        solution: 'def may_retry(calls, retries, ratio):\n    return retries < calls * ratio',
        tests: [
          'assert may_retry(100, 5, 0.1), "under budget"',
          'assert not may_retry(100, 10, 0.1), "budget used"',
        ].join('\n'),
        hints: ['Strictly below the budget.', 'def may_retry(calls, retries, ratio):\n    return retries ___ calls * ratio'],
        explain: 'When most calls fail, the budget stops retries from piling on.',
      },
      {
        goal: 'Finish `with_fallback(fn, default)`: return `fn()`, or `default` if it raises.',
        starter: 'def with_fallback(fn, default):\n    try:\n        return fn()\n    ___ Exception:\n        return default',
        solution: 'def with_fallback(fn, default):\n    try:\n        return fn()\n    except Exception:\n        return default',
        tests: [
          'def boom():',
          '    raise TimeoutError("recs")',
          'assert with_fallback(lambda: ["fresh"], []) == ["fresh"], "working call"',
          'assert with_fallback(boom, ["mug"]) == ["mug"], "fallback on failure"',
        ].join('\n'),
        hints: ['Catch the failure.', 'def with_fallback(fn, default):\n    try:\n        return fn()\n    ___ Exception:\n        return default'],
        explain: 'Graceful degradation in four lines.',
      },
    ],
  },
  {
    id: 's10-lab-2',
    title: 'A circuit breaker',
    intro: 'From empty functions: a circuit breaker with closed, open and half-open states on a clock you pass in, then an error budget and an ownership check.',
    summary: 'You built a circuit breaker, an error-budget calculation and an authorisation check.',
    minutes: 15,
    unlockAfter: 's10-09',
    steps: [
      {
        goal: 'Write `state(b, now)`: `b` has `"opened"` (None or a time) and `"cool"`. Return `"closed"` if never opened, `"open"` within the cool-down, else `"half-open"`.',
        starter: 'def state(b, now):\n    pass',
        solution: 'def state(b, now):\n    if b["opened"] is None:\n        return "closed"\n    if now - b["opened"] < b["cool"]:\n        return "open"\n    return "half-open"',
        tests: [
          'b = {"opened": None, "cool": 30}',
          'assert state(b, 5) == "closed", "never opened"',
          'b["opened"] = 100',
          'assert state(b, 110) == "open", "cooling down"',
          'assert state(b, 135) == "half-open", "time for a trial"',
        ].join('\n'),
        hints: [
          'Check None first, then the time since opening.',
          'def state(b, now):\n    if b["opened"] is None:\n        return "closed"\n    if now - b["opened"] < b["cool"]:\n        return ___\n    return "half-open"',
        ],
      },
      {
        goal: 'Write `record(b, ok, now)`: on success reset `"fails"` to 0 and `"opened"` to None; on failure add one to `"fails"`, and if it reaches `"limit"`, set `"opened"` to `now`.',
        starter: 'def record(b, ok, now):\n    pass',
        solution: 'def record(b, ok, now):\n    if ok:\n        b["fails"] = 0\n        b["opened"] = None\n        return\n    b["fails"] += 1\n    if b["fails"] >= b["limit"]:\n        b["opened"] = now',
        tests: [
          'b = {"fails": 0, "limit": 2, "opened": None, "cool": 30}',
          'record(b, False, 1)',
          'assert b["opened"] is None, "one failure: still closed"',
          'record(b, False, 2)',
          'assert b["opened"] == 2, "limit reached: open"',
          'record(b, True, 40)',
          'assert b["fails"] == 0 and b["opened"] is None, "success closes it"',
        ].join('\n'),
        hints: [
          'Success resets both; failure counts and maybe opens.',
          'def record(b, ok, now):\n    if ok:\n        b["fails"] = 0\n        b["opened"] = None\n        return\n    b["fails"] += 1\n    if b["fails"] >= b["limit"]:\n        b["opened"] = ___',
        ],
      },
      {
        goal: 'Write `call(b, fn, now)`: if `state` is `"open"` return `"fast-fail"` without calling. Otherwise call `fn()`: on success record it and return the result; if it raises, record a failure and return `"error"`.',
        starter: 'def call(b, fn, now):\n    pass',
        solution: 'def call(b, fn, now):\n    if state(b, now) == "open":\n        return "fast-fail"\n    try:\n        result = fn()\n    except Exception:\n        record(b, False, now)\n        return "error"\n    record(b, True, now)\n    return result',
        tests: [
          'b = {"fails": 0, "limit": 2, "opened": None, "cool": 30}',
          'tried = []',
          'def down():',
          '    tried.append(1)',
          '    raise ConnectionError("down")',
          'got = [call(b, down, t) for t in (1, 2, 3)]',
          'assert got == ["error", "error", "fast-fail"], f"got {got}"',
          'assert len(tried) == 2, "the open breaker must not call"',
          'assert call(b, lambda: "ok", 40) == "ok", "half-open trial succeeds"',
          'assert state(b, 41) == "closed", "and closes the breaker"',
        ].join('\n'),
        hints: [
          'Check the state, then try the call and record the outcome.',
          'def call(b, fn, now):\n    if state(b, now) == "open":\n        return "fast-fail"\n    try:\n        result = fn()\n    except Exception:\n        record(b, False, now)\n        return ___\n    record(b, True, now)\n    return result',
        ],
        explain: 'Fail fast while open; let one call test the water after the cool-down.',
      },
      {
        goal: 'Write `budget_minutes(slo, days)`: minutes of full outage the SLO allows over `days` days.',
        starter: 'def budget_minutes(slo, days):\n    pass',
        solution: 'def budget_minutes(slo, days):\n    return (1 - slo) * days * 24 * 60',
        tests: [
          'got = round(budget_minutes(0.999, 30), 1)',
          'assert got == 43.2, f"got {got}"',
        ].join('\n'),
        hints: ['The unreliable share times the minutes in the window.', 'def budget_minutes(slo, days):\n    return (1 - slo) * days * ___ * 60'],
      },
      {
        goal: 'Write `can_read(user, doc)`: True if `user` is the doc\'s `"owner"` or appears in its `"shared"` list (which may be missing).',
        starter: 'def can_read(user, doc):\n    pass',
        solution: 'def can_read(user, doc):\n    if doc["owner"] == user:\n        return True\n    shared = doc.get("shared", [])\n    return user in shared',
        tests: [
          'd = {"owner": "ann", "shared": ["bo"]}',
          'assert can_read("ann", d) and can_read("bo", d), "owner and shared"',
          'assert not can_read("cy", d), "a stranger"',
          'assert not can_read("bo", {"owner": "ann"}), "nothing shared"',
        ].join('\n'),
        hints: [
          'Owner first, then the shared list with a default.',
          'def can_read(user, doc):\n    if doc["owner"] == user:\n        return True\n    shared = doc.get("shared", ___)\n    return user in shared',
        ],
        explain: 'Run on every request: authorisation is per resource.',
      },
    ],
  },
];
