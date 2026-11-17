import type { Lab } from '../schema';

const DIFFERS =
  'Uses `sim.Replicas`, a leader and followers on the virtual clock. Real databases replicate a write-ahead log over the network, report lag in their monitoring, and handle failover with a consensus service; the routing decisions are the same.';

/*
 * Unit S6 labs. Lab 1: reads across replicas, with scaffolding (read a node,
 * choose a node for read-your-writes, read with that rule, fail over on a
 * down node). Lab 2, from empty functions: a consistent-hash ring with
 * virtual nodes, checked by its properties.
 */
export const s6Labs: Lab[] = [
  {
    id: 's6-lab-1',
    title: 'Reads across replicas',
    intro: 'Route reads over a leader and two lagging followers: read one node, send a user to the leader just after their own write, and skip a node that is down.',
    summary: 'You wrote read routing with read-your-writes and simple failover.',
    minutes: 12,
    unlockAfter: 's6-03',
    differs: DIFFERS,
    given: 'sim.clock.reset()\nrs = sim.Replicas(2, lag=1.0)\nlast_write = {}',
    steps: [
      {
        goal: 'Finish `write(user, key, value)`: write to `rs` and remember the time of this user\'s write in `last_write`.',
        starter: 'def write(user, key, value):\n    rs.write(key, value)\n    last_write[user] = ___',
        solution: 'def write(user, key, value):\n    rs.write(key, value)\n    now = sim.clock.time()\n    last_write[user] = now',
        tests: [
          'sim.clock.reset(); last_write.clear()',
          'sim.clock.advance(3); write("ana", "bio", "hi")',
          'assert last_write == {"ana": 3.0}, f"got {last_write}"',
        ].join('\n'),
        hints: ['The virtual clock gives the time.', 'def write(user, key, value):\n    rs.write(key, value)\n    last_write[user] = ___'],
      },
      {
        goal: 'Finish `node_for(user, now)`: the leader (0) if the user wrote less than 2 s ago, else follower 1.',
        starter: 'def node_for(user, now):\n    t = last_write.get(user)\n    if t is None:\n        return 1\n    return 0 if now - t < ___ else 1',
        solution: 'def node_for(user, now):\n    t = last_write.get(user)\n    if t is None:\n        return 1\n    return 0 if now - t < 2 else 1',
        tests: [
          'last_write.clear(); last_write["ana"] = 10.0',
          'assert node_for("ana", 11.0) == 0, "1 s after her write: leader"',
          'assert node_for("ana", 13.0) == 1, "3 s after: follower"',
          'assert node_for("bo", 11.0) == 1, "bo never wrote: follower"',
        ].join('\n'),
        hints: ['The window is 2 seconds.', 'def node_for(user, now):\n    t = last_write.get(user)\n    if t is None:\n        return 1\n    return 0 if now - t < ___ else 1'],
      },
      {
        goal: 'Finish `read_as(user, key)`: read `key` from the node `node_for` chooses at the current time.',
        starter: 'def read_as(user, key):\n    now = sim.clock.time()\n    n = node_for(user, now)\n    return rs.read(key, ___)',
        solution: 'def read_as(user, key):\n    now = sim.clock.time()\n    n = node_for(user, now)\n    return rs.read(key, n)',
        tests: [
          'sim.clock.reset(); last_write.clear()',
          'write("ana", "bio", "new")',
          'sim.clock.advance(0.1)',
          'assert read_as("ana", "bio") == "new", "Ana sees her own write"',
          'assert read_as("bo", "bio") is None, "Bo reads a follower that is still behind"',
        ].join('\n'),
        hints: ['Use the node chosen on the line above.', 'def read_as(user, key):\n    now = sim.clock.time()\n    n = node_for(user, now)\n    return rs.read(key, ___)'],
        explain: 'Bo seeing the old bio for a second is fine; Ana must not.',
      },
      {
        goal: 'Finish `read_any(key, nodes)`: try the nodes in order and return the first answer, skipping nodes that raise `ConnectionError`.',
        starter: 'def read_any(key, nodes):\n    for n in nodes:\n        try:\n            return rs.read(key, n)\n        except ___:\n            continue\n    raise ConnectionError("all down")',
        solution: 'def read_any(key, nodes):\n    for n in nodes:\n        try:\n            return rs.read(key, n)\n        except ConnectionError:\n            continue\n    raise ConnectionError("all down")',
        tests: [
          'sim.clock.reset(); rs.down.clear()',
          'rs.write("k", 1); sim.clock.advance(2)',
          'rs.down.add(1)',
          'assert read_any("k", [1, 2]) == 1, "node 1 is down: use node 2"',
          'rs.down.update({0, 2})',
          'try:',
          '    read_any("k", [0, 1, 2])',
          '    raise AssertionError("all nodes down should raise")',
          'except ConnectionError:',
          '    pass',
          'rs.down.clear()',
        ].join('\n'),
        hints: ['Catch the error a down node raises.', 'def read_any(key, nodes):\n    for n in nodes:\n        try:\n            return rs.read(key, n)\n        except ___:\n            continue\n    raise ConnectionError("all down")'],
        explain: 'Client-side failover for reads.',
      },
    ],
  },
  {
    id: 's6-lab-2',
    title: 'A hash ring',
    intro: 'Build consistent hashing, each piece from an empty function: positions on the ring, a ring with virtual nodes, the owner of a key, and the keys that move when a server joins. Tests check its properties rather than exact numbers.',
    summary: 'You built a consistent-hash ring with virtual nodes and showed it moves few keys.',
    minutes: 18,
    unlockAfter: 's6-10',
    given: 'import bisect\nimport zlib\n\nKEYS = [f"u{i}" for i in range(200)]',
    steps: [
      {
        goal: 'Write `pos(s)`: a position on the ring in [0, 1), from `zlib.crc32` of the string\'s bytes divided by 2³².',
        starter: 'def pos(s):\n    pass',
        solution: 'def pos(s):\n    h = zlib.crc32(s.encode())\n    return h / 2**32',
        tests: [
          'assert 0 <= pos("a") < 1 and pos("a") == pos("a"), "stable and in [0, 1)"',
          'assert pos("a") != pos("b"), "different strings, different positions"',
        ].join('\n'),
        hints: ['crc32 returns a 32-bit unsigned number.', 'def pos(s):\n    h = zlib.crc32(s.encode())\n    return h / ___'],
      },
      {
        goal: 'Write `build(servers, vnodes)`: a sorted list of `(position, server)` with `vnodes` points per server, at `pos(f"{server}#{v}")`.',
        starter: 'def build(servers, vnodes):\n    pass',
        solution: 'def build(servers, vnodes):\n    pts = [(pos(f"{s}#{v}"), s)\n           for s in servers\n           for v in range(vnodes)]\n    return sorted(pts)',
        tests: [
          'r = build(["A", "B"], 3)',
          'assert len(r) == 6 and r == sorted(r), "6 sorted points"',
          'assert {s for _, s in r} == {"A", "B"}, "both servers present"',
        ].join('\n'),
        hints: ['A comprehension over servers and virtual node numbers, then sort.', 'def build(servers, vnodes):\n    pts = [(pos(f"{s}#{v}"), s)\n           for s in servers\n           for v in range(___)]\n    return sorted(pts)'],
      },
      {
        goal: 'Write `owner(ring, key)`: the server of the first point at or after `pos(key)`, wrapping to the first point.',
        starter: 'def owner(ring, key):\n    pass',
        solution: 'def owner(ring, key):\n    ps = [p for p, _ in ring]\n    i = bisect.bisect_left(ps,\n                           pos(key))\n    return ring[i % len(ring)][1]',
        tests: [
          'assert owner(build(["A"], 4), "x") == "A", "one server owns everything"',
          'r = build(["A", "B", "C"], 8)',
          'assert {owner(r, k) for k in KEYS} == {"A", "B", "C"}, "all three get keys"',
        ].join('\n'),
        hints: ['bisect_left on the positions; wrap with % len(ring).', 'def owner(ring, key):\n    ps = [p for p, _ in ring]\n    i = bisect.bisect_left(ps,\n                           pos(key))\n    return ring[i % ___][1]'],
      },
      {
        goal: 'Write `moved(keys, old, new)`: how many keys have a different owner on ring `new` than on ring `old`.',
        starter: 'def moved(keys, old, new):\n    pass',
        solution: 'def moved(keys, old, new):\n    return sum(owner(old, k) !=\n               owner(new, k)\n               for k in keys)',
        tests: [
          'a = build(["A", "B", "C"], 16)',
          'b = build(["A", "B", "C", "D"], 16)',
          'm = moved(KEYS, a, b)',
          'assert moved(KEYS, a, a) == 0, "same ring: nothing moves"',
          'assert 0 < m < len(KEYS) / 2, f"adding one server should move well under half; moved {m}"',
          'assert all(owner(b, k) == "D" for k in KEYS if owner(a, k) != owner(b, k)), "keys only move to the new server"',
        ].join('\n'),
        hints: ['Count keys whose owners differ.', 'def moved(keys, old, new):\n    return sum(owner(old, k) !=\n               owner(___, k)\n               for k in keys)'],
        explain: 'The last test is the defining property: moved keys go only to the newcomer.',
      },
      {
        goal: 'Write `busiest(keys, ring)`: the largest share of keys any one server owns.',
        starter: 'def busiest(keys, ring):\n    pass',
        solution: 'from collections import Counter\n\ndef busiest(keys, ring):\n    c = Counter(owner(ring, k)\n                for k in keys)\n    return max(c.values()) / len(keys)',
        tests: [
          's = ["A", "B", "C", "D"]',
          'one, many = busiest(KEYS, build(s, 1)), busiest(KEYS, build(s, 64))',
          'assert many < one or many < 0.35, f"virtual nodes should even out the load: {one:.2f} vs {many:.2f}"',
          'assert busiest(KEYS, build(["A"], 3)) == 1.0, "one server owns all"',
        ].join('\n'),
        hints: ['Count owners, take the biggest count over the total.', 'from collections import Counter\n\ndef busiest(keys, ring):\n    c = Counter(owner(ring, k)\n                for k in keys)\n    return max(c.values()) / ___'],
        explain: 'With 64 points each, every server ends up close to 25%.',
      },
    ],
  },
];
