import type { Lab } from '../schema';

const DIFFERS =
  'Uses the simulated services: `sim.FakeDB` counts queries and adds 50 ms of virtual time to each (`sim.clock`), and the cache is a Python dict. A real cache is a separate server such as Redis or Memcached, reached over the network, with eviction and TTLs built in.';

/*
 * Unit S4 labs. Lab 1: cache-aside around a slow fake database, with
 * scaffolding (read path, TTL on the virtual clock, invalidation, hit rate).
 * Lab 2, from empty functions: an LRU cache on an OrderedDict, with TTL and
 * a hit-rate simulation.
 */
export const s4Labs: Lab[] = [
  {
    id: 's4-lab-1',
    title: 'Cache-aside',
    intro: 'Put a cache in front of a slow, countable database and measure what it saves: the read path, expiry on the virtual clock, invalidation on writes, and the hit rate.',
    summary: 'You built cache-aside with TTL and invalidation and measured its hit rate.',
    minutes: 14,
    unlockAfter: 's4-05',
    differs: DIFFERS,
    given: 'rows = {"u1": "Ana", "u2": "Bo",\n        "u3": "Cy"}\ndb = sim.FakeDB(rows, delay=0.05)\ncache = {}',
    steps: [
      {
        goal: 'Finish `get(key)`: return the cached value, or read `db`, cache it and return it.',
        starter: 'def get(key):\n    if key not in cache:\n        cache[key] = db.___(key)\n    return cache[key]',
        solution: 'def get(key):\n    if key not in cache:\n        cache[key] = db.get(key)\n    return cache[key]',
        tests: [
          'cache.clear(); db.queries = 0',
          'assert get("u1") == "Ana" and get("u1") == "Ana", "returns the value"',
          'assert db.queries == 1, f"second read is a hit; got {db.queries} queries"',
        ].join('\n'),
        hints: ['Read the database only on a miss.', 'def get(key):\n    if key not in cache:\n        cache[key] = db.___(key)\n    return cache[key]'],
      },
      {
        goal: 'Finish `get_ttl(key, ttl)`: like `get`, but entries are `(value, stored_at)` and expire after `ttl` seconds of `sim.clock`.',
        starter: 'def get_ttl(key, ttl):\n    now = sim.clock.time()\n    hit = cache.get(key)\n    if hit and now - hit[1] < ___:\n        return hit[0]\n    v = db.get(key)\n    cache[key] = (v, now)\n    return v',
        solution: 'def get_ttl(key, ttl):\n    now = sim.clock.time()\n    hit = cache.get(key)\n    if hit and now - hit[1] < ttl:\n        return hit[0]\n    v = db.get(key)\n    cache[key] = (v, now)\n    return v',
        tests: [
          'cache.clear(); db.queries = 0; sim.clock.reset()',
          'get_ttl("u2", 10); get_ttl("u2", 10)',
          'assert db.queries == 1, f"fresh entry is a hit; got {db.queries}"',
          'sim.clock.advance(11)',
          'assert get_ttl("u2", 10) == "Bo" and db.queries == 2, "expired after 10 s: refetch"',
        ].join('\n'),
        hints: ['Compare the entry\'s age with the TTL.', 'def get_ttl(key, ttl):\n    now = sim.clock.time()\n    hit = cache.get(key)\n    if hit and now - hit[1] < ___:\n        return hit[0]\n    v = db.get(key)\n    cache[key] = (v, now)\n    return v'],
        explain: 'Each query also moved the clock on by 50 ms: the cost the cache avoids.',
      },
      {
        goal: 'Finish `update(key, value)`: write to `db`, then delete the cached entry.',
        starter: 'def update(key, value):\n    db.put(key, value)\n    cache.___(key, None)',
        solution: 'def update(key, value):\n    db.put(key, value)\n    cache.pop(key, None)',
        tests: [
          'cache.clear()',
          'get("u3"); update("u3", "Cyd")',
          'assert get("u3") == "Cyd", "the next read sees the new value"',
        ].join('\n'),
        hints: ['dict.pop with a default removes a key if present.', 'def update(key, value):\n    db.put(key, value)\n    cache.___(key, None)'],
      },
      {
        goal: 'Finish `hit_rate(keys)`: read every key with `get` and return the share that did not query the database.',
        starter: 'def hit_rate(keys):\n    before = db.queries\n    for k in keys:\n        get(k)\n    misses = db.queries - ___\n    return 1 - misses / len(keys)',
        solution: 'def hit_rate(keys):\n    before = db.queries\n    for k in keys:\n        get(k)\n    misses = db.queries - before\n    return 1 - misses / len(keys)',
        tests: [
          'cache.clear()',
          'r = hit_rate(["u1", "u2", "u1", "u1", "u2", "u1"])',
          'assert abs(r - 4 / 6) < 1e-9, f"2 misses in 6; got {r}"',
        ].join('\n'),
        hints: ['Count queries before and after.', 'def hit_rate(keys):\n    before = db.queries\n    for k in keys:\n        get(k)\n    misses = db.queries - ___\n    return 1 - misses / len(keys)'],
        explain: 'Measure, then decide: hit rate is the number that justifies a cache.',
      },
    ],
  },
  {
    id: 's4-lab-2',
    title: 'An LRU cache',
    intro: 'Build the eviction logic of a real cache, each piece from an empty function: LRU reads and writes on an OrderedDict, expiry, and a hit-rate simulation over a stream of keys.',
    summary: 'You built an LRU cache with TTL and measured its hit rate.',
    minutes: 16,
    unlockAfter: 's4-07',
    given: 'from collections import OrderedDict',
    steps: [
      {
        goal: 'Write `lru_get(c, key)`: the value for `key` (marking it most recently used), or `None`.',
        starter: 'def lru_get(c, key):\n    pass',
        solution: 'def lru_get(c, key):\n    if key not in c:\n        return None\n    c.move_to_end(key)\n    return c[key]',
        tests: [
          'c = OrderedDict(a=1, b=2)',
          'assert lru_get(c, "a") == 1, "returns the value"',
          'assert list(c) == ["b", "a"], f"a is now most recent; got {list(c)}"',
          'assert lru_get(c, "z") is None, "missing: None"',
        ].join('\n'),
        hints: ['move_to_end marks a use.', 'def lru_get(c, key):\n    if key not in c:\n        return None\n    c.move_to_end(___)\n    return c[key]'],
      },
      {
        goal: 'Write `lru_put(c, key, value, size)`: store the value as most recent, then drop the least recent entries while there are more than `size`.',
        starter: 'def lru_put(c, key, value, size):\n    pass',
        solution: 'def lru_put(c, key, value, size):\n    c[key] = value\n    c.move_to_end(key)\n    while len(c) > size:\n        c.popitem(last=False)',
        tests: [
          'c = OrderedDict()',
          'for k in "abac":',
          '    lru_get(c, k) or lru_put(c, k, 1, 2)',
          'assert list(c) == ["a", "c"], f"got {list(c)}"',
        ].join('\n'),
        hints: ['Insert, mark as recent, then trim from the front.', 'def lru_put(c, key, value, size):\n    c[key] = value\n    c.move_to_end(key)\n    while len(c) > size:\n        c.popitem(last=___)'],
      },
      {
        goal: 'Write `ttl_get(c, key, now, ttl)`: entries are `(value, stored_at)`; return the value if younger than `ttl`, otherwise delete it and return `None`.',
        starter: 'def ttl_get(c, key, now, ttl):\n    pass',
        solution: 'def ttl_get(c, key, now, ttl):\n    hit = c.get(key)\n    if hit is None:\n        return None\n    if now - hit[1] >= ttl:\n        del c[key]\n        return None\n    return hit[0]',
        tests: [
          'c = OrderedDict(k=("v", 100))',
          'assert ttl_get(c, "k", 120, 30) == "v", "fresh at 120"',
          'assert ttl_get(c, "k", 130, 30) is None and "k" not in c, "expired at 130: removed"',
          'assert ttl_get(c, "zz", 0, 30) is None, "missing: None"',
        ].join('\n'),
        hints: [
          'Missing, expired (delete it), or fresh.',
          'def ttl_get(c, key, now, ttl):\n    hit = c.get(key)\n    if hit is None:\n        return None\n    if now - hit[1] >= ___:\n        del c[key]\n        return None\n    return hit[0]',
        ],
      },
      {
        goal: 'Write `simulate(keys, size)`: run the keys through an empty LRU cache of `size` (put on every miss) and return the hit rate.',
        starter: 'def simulate(keys, size):\n    pass',
        solution: 'def simulate(keys, size):\n    c, hits = OrderedDict(), 0\n    for k in keys:\n        if lru_get(c, k) is not None:\n            hits += 1\n        else:\n            lru_put(c, k, True, size)\n    return hits / len(keys)',
        tests: [
          'assert simulate(list("abacadab"), 2) == 3 / 8, f"got {simulate(list(\'abacadab\'), 2)}"',
          'assert simulate(list("abacadab"), 1) == 0, "one slot: always evicted"',
          'assert simulate(list("aaaa"), 1) == 3 / 4, "one key: 3 hits"',
        ].join('\n'),
        hints: [
          'Count hits; on a miss, put the key.',
          'def simulate(keys, size):\n    c, hits = OrderedDict(), 0\n    for k in keys:\n        if lru_get(c, k) is not None:\n            hits += ___\n        else:\n            lru_put(c, k, True, size)\n    return hits / len(keys)',
        ],
        explain: 'Same numbers as the figure in lesson 6: LRU with two slots gets 3 of 8.',
      },
      {
        goal: 'Write `best_size(keys, target)`: the smallest size from 1 to 10 whose hit rate reaches `target`, or `None`.',
        starter: 'def best_size(keys, target):\n    pass',
        solution: 'def best_size(keys, target):\n    for n in range(1, 11):\n        r = simulate(keys, n)\n        if r >= target:\n            return n\n    return None',
        tests: [
          'assert best_size(list("abacadab"), 0.37) == 2, f"got {best_size(list(\'abacadab\'), 0.37)}"',
          'assert best_size(list("abcd"), 0.5) is None, "no repeats: no size helps"',
        ].join('\n'),
        hints: ['Try sizes in order and stop at the first good one.', 'def best_size(keys, target):\n    for n in range(1, 11):\n        r = simulate(keys, n)\n        if r >= ___:\n            return n\n    return None'],
        explain: 'Sizing a cache from a sample of real keys is a common, practical exercise.',
      },
    ],
  },
];
