import type { Lab } from '../schema';

/*
 * Unit S9 labs. Lab 1: cursor pagination, tolerant reading and idempotency
 * keys, with scaffolding. Lab 2, from empty functions: three rate limiters,
 * gateway routing and a health-checked lookup.
 */
export const s9Labs: Lab[] = [
  {
    id: 's9-lab-1',
    title: 'Pages, versions and keys',
    intro: 'Write the server side of three API habits: cursor pagination that stays correct while data changes, reading responses tolerantly, and replaying stored results for repeated idempotency keys.',
    summary: 'You built cursor pages, a tolerant reader and an idempotent POST handler.',
    minutes: 12,
    unlockAfter: 's9-04',
    steps: [
      {
        goal: 'Finish `page_after(ids, cursor, n)`: ids are newest first; return the next `n` ids smaller than `cursor`.',
        starter: 'def page_after(ids, cursor, n):\n    rest = [i for i in ids\n            if i ___ cursor]\n    return rest[:n]',
        solution: 'def page_after(ids, cursor, n):\n    rest = [i for i in ids\n            if i < cursor]\n    return rest[:n]',
        tests: [
          'ids = [9, 8, 7, 6, 5]',
          'assert page_after(ids, 8, 2) == [7, 6], f"got {page_after(ids, 8, 2)}"',
          'ids.insert(0, 10)',
          'assert page_after(ids, 8, 2) == [7, 6], "a new post does not shift the page"',
        ].join('\n'),
        hints: ['Older items have smaller ids.', 'def page_after(ids, cursor, n):\n    rest = [i for i in ids\n            if i ___ cursor]\n    return rest[:n]'],
      },
      {
        goal: 'Finish `next_cursor(page)`: the cursor for the following page, or None when the page is empty.',
        starter: 'def next_cursor(page):\n    return page[___] if page else None',
        solution: 'def next_cursor(page):\n    return page[-1] if page else None',
        tests: [
          'assert next_cursor([7, 6]) == 6, "last item seen"',
          'assert next_cursor([]) is None, "no more pages"',
        ].join('\n'),
        hints: ['Continue after the last item.', 'def next_cursor(page):\n    return page[___] if page else None'],
      },
      {
        goal: 'Finish `display_name(resp)`: use `"nickname"` if present, otherwise `"name"`, without failing when either is missing.',
        starter: 'def display_name(resp):\n    nick = resp.get("nickname")\n    name = resp.___("name", "?")\n    return nick or name',
        solution: 'def display_name(resp):\n    nick = resp.get("nickname")\n    name = resp.get("name", "?")\n    return nick or name',
        tests: [
          'assert display_name({"name": "Ann"}) == "Ann", "old response"',
          'assert display_name({"name": "Ann", "nickname": "A"}) == "A", "new field"',
          'assert display_name({}) == "?", "nothing at all"',
        ].join('\n'),
        hints: ['Read with a default instead of indexing.', 'def display_name(resp):\n    nick = resp.get("nickname")\n    name = resp.___("name", "?")\n    return nick or name'],
      },
      {
        goal: 'Finish `pay(store, key, amount, charges)`: for a key seen before, return the stored result; otherwise append the amount to `charges`, store and return `"paid <amount>"`.',
        starter: 'def pay(store, key, amount, charges):\n    if key in store:\n        return store[___]\n    charges.append(amount)\n    store[key] = f"paid {amount}"\n    return store[key]',
        solution: 'def pay(store, key, amount, charges):\n    if key in store:\n        return store[key]\n    charges.append(amount)\n    store[key] = f"paid {amount}"\n    return store[key]',
        tests: [
          's, c = {}, []',
          'assert pay(s, "k1", 50, c) == "paid 50", "first call pays"',
          'assert pay(s, "k1", 50, c) == "paid 50", "retry gets the same answer"',
          'assert c == [50], f"charged {c}"',
        ].join('\n'),
        hints: ['Look the result up by the key.', 'def pay(store, key, amount, charges):\n    if key in store:\n        return store[___]\n    charges.append(amount)\n    store[key] = f"paid {amount}"\n    return store[key]'],
        explain: 'In production the key is claimed atomically first, so two concurrent retries cannot both pay.',
      },
    ],
  },
  {
    id: 's9-lab-2',
    title: 'Rate limiters and routing',
    intro: 'From empty functions: a fixed-window counter, a sliding window, a token bucket, then the routing and lookup a gateway does before forwarding a request.',
    summary: 'You wrote three rate limiters, a prefix router and a health-checked lookup.',
    minutes: 15,
    unlockAfter: 's9-09',
    steps: [
      {
        goal: 'Write `fixed_allow(counts, t, limit)`: count the request in window `int(t)` in the dict `counts`; return True if that window\'s count is still within `limit`.',
        starter: 'def fixed_allow(counts, t, limit):\n    pass',
        solution: 'def fixed_allow(counts, t, limit):\n    w = int(t)\n    counts[w] = counts.get(w, 0) + 1\n    return counts[w] <= limit',
        tests: [
          'c = {}',
          'got = [fixed_allow(c, t, 2) for t in (0.1, 0.5, 0.9, 1.0)]',
          'assert got == [True, True, False, True], f"got {got}"',
        ].join('\n'),
        hints: ['One counter per whole second.', 'def fixed_allow(counts, t, limit):\n    w = int(t)\n    counts[w] = counts.get(w, 0) + ___\n    return counts[w] <= limit'],
      },
      {
        goal: 'Write `sliding_allow(log, t, limit)`: `log` holds times of allowed requests. Allow (and record `t`) if fewer than `limit` of them are within the last second, that is `t - x < 1`.',
        starter: 'def sliding_allow(log, t, limit):\n    pass',
        solution: 'def sliding_allow(log, t, limit):\n    recent = [x for x in log\n              if t - x < 1]\n    if len(recent) >= limit:\n        return False\n    log.append(t)\n    return True',
        tests: [
          'lg = []',
          'got = [sliding_allow(lg, t, 2) for t in (0.5, 0.9, 1.0, 1.6)]',
          'assert got == [True, True, False, True], f"got {got}"',
        ].join('\n'),
        hints: [
          'Count the recent ones; only record allowed requests.',
          'def sliding_allow(log, t, limit):\n    recent = [x for x in log\n              if t - x < 1]\n    if len(recent) >= ___:\n        return False\n    log.append(t)\n    return True',
        ],
      },
      {
        goal: 'Write `bucket_allow(b, t)`: `b` is a dict with `cap`, `rate`, `tokens` and `last`. Refill for the time since `last` (never above `cap`), then take one token if there is one.',
        starter: 'def bucket_allow(b, t):\n    pass',
        solution: 'def bucket_allow(b, t):\n    gain = (t - b["last"]) * b["rate"]\n    full = b["tokens"] + gain\n    b["tokens"] = min(b["cap"], full)\n    b["last"] = t\n    if b["tokens"] >= 1:\n        b["tokens"] -= 1\n        return True\n    return False',
        tests: [
          'b = {"cap": 2, "rate": 1, "tokens": 2, "last": 0}',
          'got = [bucket_allow(b, t) for t in (0, 0.1, 0.2, 1.5)]',
          'assert got == [True, True, False, True], f"got {got}"',
        ].join('\n'),
        hints: [
          'Refill first, then try to spend.',
          'def bucket_allow(b, t):\n    gain = (t - b["last"]) * b["rate"]\n    full = b["tokens"] + gain\n    b["tokens"] = min(b["cap"], full)\n    b["last"] = t\n    if b["tokens"] >= 1:\n        b["tokens"] -= ___\n        return True\n    return False',
        ],
        explain: 'Bursts up to the bucket size, the refill rate on average.',
      },
      {
        goal: 'Write `upstream(routes, path)`: return the service of the first prefix in `routes` that `path` starts with, or 404.',
        starter: 'def upstream(routes, path):\n    pass',
        solution: 'def upstream(routes, path):\n    for prefix, svc in routes.items():\n        if path.startswith(prefix):\n            return svc\n    return 404',
        tests: [
          'r = {"/orders": "orders", "/users": "users"}',
          'assert upstream(r, "/users/9") == "users", "prefix match"',
          'assert upstream(r, "/cart") == 404, "unknown path"',
        ].join('\n'),
        hints: ['`str.startswith` checks a prefix.', 'def upstream(routes, path):\n    for prefix, svc in routes.items():\n        if path.___(prefix):\n            return svc\n    return 404'],
      },
      {
        goal: 'Write `pick(registry, name, n)`: the `n`-th live address (round robin) among the healthy instances of `name`; `registry[name]` is a list of `(address, healthy)` pairs. Return None if none is healthy.',
        starter: 'def pick(registry, name, n):\n    pass',
        solution: 'def pick(registry, name, n):\n    pairs = registry[name]\n    live = [a for a, up in pairs\n            if up]\n    if not live:\n        return None\n    return live[n % len(live)]',
        tests: [
          'reg = {"orders": [("a", True), ("b", False), ("c", True)], "x": [("d", False)]}',
          'got = [pick(reg, "orders", n) for n in range(3)]',
          'assert got == ["a", "c", "a"], f"got {got}"',
          'assert pick(reg, "x", 0) is None, "no healthy instance"',
        ].join('\n'),
        hints: [
          'Filter the healthy ones, then index with a modulo.',
          'def pick(registry, name, n):\n    pairs = registry[name]\n    live = [a for a, up in pairs\n            if up]\n    if not live:\n        return None\n    return live[n ___ len(live)]',
        ],
        explain: 'Discovery plus a simple balancing rule, as a client-side library does it.',
      },
    ],
  },
];
