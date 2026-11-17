import type { Lab } from '../schema';

/*
 * Unit S3 labs. Lab 1: balancers, with scaffolding (round robin, least
 * connections, health filtering, round robin over healthy servers). Lab 2,
 * from empty functions: scaling decisions (servers for a peak, hashing a
 * user, counting moved users, autoscaling lag).
 */
export const s3Labs: Lab[] = [
  {
    id: 's3-lab-1',
    title: 'Balancers',
    intro: 'Write the decisions a load balancer makes for every request: take turns, pick the least busy server, and skip servers that fail their health checks.',
    summary: 'You built round robin, least connections and health-aware routing.',
    minutes: 12,
    unlockAfter: 's3-04',
    differs: 'Real balancers (nginx, HAProxy, cloud balancers) do this per connection or request in fast native code, with weights, timeouts and retries on top. The decisions are the same.',
    steps: [
      {
        goal: 'Finish `rr(servers, k)`: the server for the k-th request (k from 0), taking turns.',
        starter: 'def rr(servers, k):\n    return servers[k % ___]',
        solution: 'def rr(servers, k):\n    return servers[k % len(servers)]',
        tests: 'assert [rr(["a", "b", "c"], k) for k in range(5)] == ["a", "b", "c", "a", "b"], "turns wrap around"',
        hints: ['Wrap around after the last server.', 'def rr(servers, k):\n    return servers[k % ___]'],
      },
      {
        goal: 'Finish `least(active)`: the server with the fewest requests in progress (`active` maps server to count).',
        starter: 'def least(active):\n    return ___(active, key=active.get)',
        solution: 'def least(active):\n    return min(active, key=active.get)',
        tests: 'assert least({"a": 3, "b": 1, "c": 2}) == "b", f"got {least({\'a\': 3, \'b\': 1, \'c\': 2})}"',
        hints: ['The smallest count wins.', 'def least(active):\n    return ___(active, key=active.get)'],
      },
      {
        goal: 'Finish `healthy(up)`: the servers whose health check passed (`up` maps server to True or False).',
        starter: 'def healthy(up):\n    return [s for s in up if ___]',
        solution: 'def healthy(up):\n    return [s for s in up if up[s]]',
        tests: [
          'assert healthy({"a": True, "b": False, "c": True}) == ["a", "c"], "skip b"',
          'assert healthy({"a": False}) == [], "none healthy"',
        ].join('\n'),
        hints: ['Keep a server when its value is True.', 'def healthy(up):\n    return [s for s in up if ___]'],
      },
      {
        goal: 'Finish `route(up, k)`: round robin over the healthy servers only, or `None` if none is healthy.',
        starter: 'def route(up, k):\n    pool = healthy(up)\n    if not pool:\n        return None\n    return rr(___, k)',
        solution: 'def route(up, k):\n    pool = healthy(up)\n    if not pool:\n        return None\n    return rr(pool, k)',
        tests: [
          'up = {"a": True, "b": False, "c": True}',
          'assert [route(up, k) for k in range(4)] == ["a", "c", "a", "c"], "b is skipped"',
          'assert route({"a": False}, 0) is None, "nothing healthy: None"',
        ].join('\n'),
        hints: ['Take turns over the pool, not over every server.', 'def route(up, k):\n    pool = healthy(up)\n    if not pool:\n        return None\n    return rr(___, k)'],
        explain: 'A balancer with nothing healthy should answer 503 quickly.',
      },
    ],
  },
  {
    id: 's3-lab-2',
    title: 'Scaling decisions',
    intro: 'The arithmetic behind scaling, each piece from an empty function: servers for a peak, hashing a user to a server, how many users move when you add one, and what autoscaling lag costs.',
    summary: 'You can size a pool, route by hash and measure autoscaling lag in code.',
    minutes: 15,
    unlockAfter: 's3-07',
    steps: [
      {
        goal: 'Write `servers_for(peak, cap, spare=1)`: servers of capacity `cap` for the peak, rounded up, plus spares.',
        starter: 'def servers_for(peak, cap, spare=1):\n    pass',
        solution: 'import math\n\ndef servers_for(peak, cap, spare=1):\n    n = math.ceil(peak / cap)\n    return n + spare',
        tests: [
          'assert servers_for(9000, 1200) == 9, f"got {servers_for(9000, 1200)}"',
          'assert servers_for(2000, 1000, spare=0) == 2, "exact fit, no spare"',
        ].join('\n'),
        hints: ['Divide, round up, add the spares.', 'import math\n\ndef servers_for(peak, cap, spare=1):\n    n = math.ceil(peak / cap)\n    return n + ___'],
      },
      {
        goal: 'Write `by_hash(user, n)`: the sum of the user name\'s character codes, modulo `n`.',
        starter: 'def by_hash(user, n):\n    pass',
        solution: 'def by_hash(user, n):\n    return sum(map(ord, user)) % n',
        tests: [
          'assert by_hash("ana", 3) == 1, f"got {by_hash(\'ana\', 3)}"',
          'assert by_hash("bo", 2) == 1, "209 is odd"',
        ].join('\n'),
        hints: ['ord gives a character\'s code.', 'def by_hash(user, n):\n    return sum(map(ord, user)) % ___'],
        explain: 'Real systems use a proper hash such as MD5 or MurmurHash; the idea is the same.',
      },
      {
        goal: 'Write `moved(users, old, new)`: how many users change server when the pool grows from `old` to `new` servers.',
        starter: 'def moved(users, old, new):\n    pass',
        solution: 'def moved(users, old, new):\n    return sum(by_hash(u, old) !=\n               by_hash(u, new)\n               for u in users)',
        tests: [
          'us = ["ana", "bo", "cy", "di", "ed", "flo"]',
          'assert moved(us, 3, 4) == 5, f"got {moved(us, 3, 4)}"',
          'assert moved(us, 3, 3) == 0, "same pool: nobody moves"',
        ].join('\n'),
        hints: ['Count users whose two picks differ.', 'def moved(users, old, new):\n    return sum(by_hash(u, old) !=\n               by_hash(u, ___)\n               for u in users)'],
      },
      {
        goal: 'Write `with_lag(need, lag)`: the servers available at each step, if each step gets what was needed `lag` steps earlier (the first value before that).',
        starter: 'def with_lag(need, lag):\n    pass',
        solution: 'def with_lag(need, lag):\n    return [need[max(t - lag, 0)]\n            for t in range(len(need))]',
        tests: 'assert with_lag([2, 2, 6, 6, 6, 6], 2) == [2, 2, 2, 2, 6, 6], f"got {with_lag([2, 2, 6, 6, 6, 6], 2)}"',
        hints: ['Index back by lag, never below 0.', 'def with_lag(need, lag):\n    return [need[max(t - ___, 0)]\n            for t in range(len(need))]'],
      },
      {
        goal: 'Write `short_steps(need, lag)`: how many steps have fewer servers than needed.',
        starter: 'def short_steps(need, lag):\n    pass',
        solution: 'def short_steps(need, lag):\n    have = with_lag(need, lag)\n    return sum(n > h for n, h\n               in zip(need, have))',
        tests: [
          'assert short_steps([2, 2, 6, 6, 6, 6], 2) == 2, f"got {short_steps([2, 2, 6, 6, 6, 6], 2)}"',
          'assert short_steps([2, 2, 6, 6, 6, 6], 0) == 0, "no lag, never short"',
        ].join('\n'),
        hints: ['Compare need with what with_lag gives.', 'def short_steps(need, lag):\n    have = with_lag(need, lag)\n    return sum(n > h for n, h\n               in zip(need, ___))'],
        explain: 'Try a longer lag or a steeper jump and watch the shortfall grow.',
      },
    ],
  },
];
