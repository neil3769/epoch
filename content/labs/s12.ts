import type { Lab } from '../schema';

/*
 * Unit S12 labs. Lab 1: request cost, batching, cache keys and recall, with
 * scaffolding. Lab 2, from empty functions: a semantic cache lookup and a
 * small model gateway with budgets and fallback.
 */
export const s12Labs: Lab[] = [
  {
    id: 's12-lab-1',
    title: 'Costs, batches and recall',
    intro: 'Write the arithmetic behind an AI system\'s design: what a request costs, how chunks are batched for embedding, an exact cache key and recall at k for a vector index.',
    summary: 'You can cost a request, batch work, key a cache and measure recall.',
    minutes: 12,
    unlockAfter: 's12-04',
    steps: [
      {
        goal: 'Finish `cost(t_in, t_out, p_in, p_out)`: dollars for one call, with prices per million tokens.',
        starter: 'def cost(t_in, t_out, p_in, p_out):\n    return (t_in * p_in\n            + t_out * p_out) ___ 1e6',
        solution: 'def cost(t_in, t_out, p_in, p_out):\n    return (t_in * p_in\n            + t_out * p_out) / 1e6',
        tests: 'assert round(cost(4000, 500, 3, 15), 4) == 0.0195, f"got {cost(4000, 500, 3, 15)}"',
        hints: ['Prices are per million tokens.', 'def cost(t_in, t_out, p_in, p_out):\n    return (t_in * p_in\n            + t_out * p_out) ___ 1e6'],
      },
      {
        goal: 'Finish `batches(xs, n)`: split a list into batches of at most `n` items, in order.',
        starter: 'def batches(xs, n):\n    starts = range(0, len(xs), ___)\n    return [xs[i:i + n]\n            for i in starts]',
        solution: 'def batches(xs, n):\n    starts = range(0, len(xs), n)\n    return [xs[i:i + n]\n            for i in starts]',
        tests: [
          'got = batches(list(range(10)), 4)',
          'assert got == [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]], f"got {got}"',
        ].join('\n'),
        hints: ['Each batch starts n items after the last.', 'def batches(xs, n):\n    starts = range(0, len(xs), ___)\n    return [xs[i:i + n]\n            for i in starts]'],
      },
      {
        goal: 'Finish `cache_key(model, version, prompt)`: a tuple of everything that changes the answer.',
        starter: 'def cache_key(model, version, prompt):\n    return (model, ___, prompt)',
        solution: 'def cache_key(model, version, prompt):\n    return (model, version, prompt)',
        tests: [
          'a = cache_key("m1", "v1", "Hi")',
          'assert a == cache_key("m1", "v1", "Hi"), "same request, same key"',
          'assert a != cache_key("m1", "v2", "Hi"), "new prompt version, new key"',
        ].join('\n'),
        hints: ['The prompt version changes answers too.', 'def cache_key(model, version, prompt):\n    return (model, ___, prompt)'],
        explain: 'Leave anything out and a change keeps serving stale answers.',
      },
      {
        goal: 'Finish `recall(exact, found)`: the share of the true neighbours that the index found.',
        starter: 'def recall(exact, found):\n    both = set(exact) ___ set(found)\n    return len(both) / len(exact)',
        solution: 'def recall(exact, found):\n    both = set(exact) & set(found)\n    return len(both) / len(exact)',
        tests: 'assert recall(["a", "b", "c", "d"], ["a", "b", "x", "d"]) == 0.75, "three of four"',
        hints: ['Count the items in both.', 'def recall(exact, found):\n    both = set(exact) ___ set(found)\n    return len(both) / len(exact)'],
        explain: 'Average it over sample queries while tuning the index.',
      },
    ],
  },
  {
    id: 's12-lab-2',
    title: 'Cache and gateway',
    intro: 'From empty functions: cosine similarity, a semantic cache that only answers above a threshold, then a gateway that checks budgets, falls back between models and records spend.',
    summary: 'You built a semantic cache and a model gateway with budgets and fallback.',
    minutes: 15,
    unlockAfter: 's12-07',
    steps: [
      {
        goal: 'Write `cosine(a, b)`: the dot product of two lists divided by the product of their lengths (square root of the sum of squares).',
        starter: 'def cosine(a, b):\n    pass',
        solution: 'def cosine(a, b):\n    dot = sum(x * y\n              for x, y in zip(a, b))\n    na = sum(x * x for x in a) ** 0.5\n    nb = sum(y * y for y in b) ** 0.5\n    return dot / (na * nb)',
        tests: [
          'assert round(cosine([1, 0], [1, 0]), 6) == 1.0, "same direction"',
          'assert round(cosine([1, 0], [0, 1]), 6) == 0.0, "at right angles"',
          'assert round(cosine([1, 1], [2, 2]), 6) == 1.0, "length does not matter"',
        ].join('\n'),
        hints: [
          'Dot product over both lengths.',
          'def cosine(a, b):\n    dot = sum(x * y\n              for x, y in zip(a, b))\n    na = sum(x * x for x in a) ** 0.5\n    nb = sum(y * y for y in b) ** 0.5\n    return dot / (na ___ nb)',
        ],
      },
      {
        goal: 'Write `lookup(cache, vec, threshold)`: `cache` is a list of `(vector, answer)`. Return the answer of the most similar entry if its cosine is at least `threshold`, else None.',
        starter: 'def lookup(cache, vec, threshold):\n    pass',
        solution: 'def lookup(cache, vec, threshold):\n    best, answer = -1, None\n    for v, a in cache:\n        s = cosine(v, vec)\n        if s > best:\n            best, answer = s, a\n    if best >= threshold:\n        return answer\n    return None',
        tests: [
          'c = [([1, 0], "hours: 9-5"), ([0, 1], "ships in 2 days")]',
          'assert lookup(c, [0.99, 0.05], 0.95) == "hours: 9-5", "close enough"',
          'assert lookup(c, [0.7, 0.7], 0.95) is None, "too far from both"',
          'assert lookup([], [1, 0], 0.95) is None, "empty cache"',
        ].join('\n'),
        hints: [
          'Track the best score and its answer, then check the threshold.',
          'def lookup(cache, vec, threshold):\n    best, answer = -1, None\n    for v, a in cache:\n        s = cosine(v, vec)\n        if s > best:\n            best, answer = s, a\n    if best ___ threshold:\n        return answer\n    return None',
        ],
        explain: 'A miss falls through to the model; the threshold sets the risk.',
      },
      {
        goal: 'Write `allow(spent, team, cost, limit)`: True if `spent[team]` (0 when missing) plus `cost` stays within `limit`.',
        starter: 'def allow(spent, team, cost, limit):\n    pass',
        solution: 'def allow(spent, team, cost, limit):\n    now = spent.get(team, 0)\n    return now + cost <= limit',
        tests: [
          's = {"search": 480}',
          'assert allow(s, "search", 20, 500), "exactly at the limit"',
          'assert not allow(s, "search", 30, 500), "over the limit"',
          'assert allow(s, "new-team", 5, 500), "no spend yet"',
        ].join('\n'),
        hints: ['Use `get` with a default of 0.', 'def allow(spent, team, cost, limit):\n    now = spent.get(team, ___)\n    return now + cost <= limit'],
      },
      {
        goal: 'Write `route(models, call)`: try each model name in order with `call(name)`; return `(name, answer)` for the first that does not raise, or `(None, "busy")` if all fail.',
        starter: 'def route(models, call):\n    pass',
        solution: 'def route(models, call):\n    for m in models:\n        try:\n            return (m, call(m))\n        except Exception:\n            continue\n    return (None, "busy")',
        tests: [
          'def call(m):',
          '    if m == "big-a":',
          '        raise TimeoutError(m)',
          '    return "ok from " + m',
          'assert route(["big-a", "big-b"], call) == ("big-b", "ok from big-b"), "falls back"',
          'assert route(["big-a"], call) == (None, "busy"), "nothing left"',
        ].join('\n'),
        hints: [
          'Return inside the try; continue on failure.',
          'def route(models, call):\n    for m in models:\n        try:\n            return (m, call(m))\n        except Exception:\n            ___\n    return (None, "busy")',
        ],
      },
      {
        goal: 'Write `gateway(s, team, cost, call)`: if `allow(s, team, cost, 500)` fails return `"over budget"`. Otherwise `route` over `["big-a", "big-b"]`; if a model answered, add `cost` to `s[team]` and return the answer, else return `"busy"`.',
        starter: 'def gateway(s, team, cost, call):\n    pass',
        solution: 'def gateway(s, team, cost, call):\n    if not allow(s, team, cost, 500):\n        return "over budget"\n    models = ["big-a", "big-b"]\n    name, answer = route(models, call)\n    if name is None:\n        return "busy"\n    s[team] = s.get(team, 0) + cost\n    return answer',
        tests: [
          'def call(m):',
          '    if m == "big-a":',
          '        raise TimeoutError(m)',
          '    return "ok from " + m',
          'def down(m):',
          '    raise TimeoutError(m)',
          'sp = {"search": 490}',
          'assert gateway(sp, "search", 5, call) == "ok from big-b", "served by the fallback"',
          'assert sp["search"] == 495, f"spend recorded: {sp}"',
          'assert gateway(sp, "search", 10, call) == "over budget", "budget enforced"',
          'assert gateway(sp, "x", 1, down) == "busy" and "x" not in sp, "nothing charged when all fail"',
        ].join('\n'),
        hints: [
          'Budget first, then route, then record spend only on success.',
          'def gateway(s, team, cost, call):\n    if not allow(s, team, cost, 500):\n        return "over budget"\n    models = ["big-a", "big-b"]\n    name, answer = route(models, call)\n    if name is None:\n        return ___\n    s[team] = s.get(team, 0) + cost\n    return answer',
        ],
        explain: 'Keys, budgets, fallback and accounting in one place, for every team.',
      },
    ],
  },
];
