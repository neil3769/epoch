import type { Lab } from '../schema';

/*
 * Unit E11 labs. Lab 1: the back-of-envelope numbers interviews ask for,
 * with scaffolding. Lab 2: the common coding patterns, each from an empty
 * function.
 */
export const e11Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e11-lab-1',
    title: 'Interview numbers',
    intro: 'Write the small functions behind the numbers interviewers ask for: cost per call and per day, p95 latency, the saving from routing, and how reliability compounds.',
    summary: 'You can now put numbers on cost, latency and reliability in a design discussion.',
    minutes: 10,
    unlockAfter: 'e11-06',
    steps: [
      {
        goal: 'Finish `call_cost(tin, tout, pin, pout)`: input tokens × input price plus output tokens × output price.',
        starter: 'def call_cost(tin, tout, pin, pout):\n    return tin * ___ + tout * pout',
        solution: 'def call_cost(tin, tout, pin, pout):\n    return tin * pin + tout * pout',
        tests: 'c = call_cost(2000, 300, 3e-6, 15e-6)\nassert abs(c - 0.0105) < 1e-12, f"0.006 + 0.0045 = 0.0105; got {c}"',
        hints: ['Each kind of token has its own price.', 'def call_cost(tin, tout, pin, pout):\n    return tin * ___ + tout * pout'],
      },
      {
        goal: 'Finish `daily_cost(calls, per, hit)`: the daily cost of `calls` at `per` each, when a share `hit` are cache hits, which cost nothing.',
        starter: 'def daily_cost(calls, per, hit):\n    return calls * (___) * per',
        solution: 'def daily_cost(calls, per, hit):\n    return calls * (1 - hit) * per',
        tests: [
          'assert abs(daily_cost(10_000, 0.01, 0.0) - 100) < 1e-9, "no cache: 10,000 × $0.01"',
          'assert abs(daily_cost(10_000, 0.01, 0.4) - 60) < 1e-9, f"40% hits: 6,000 paid calls; got {daily_cost(10_000, 0.01, 0.4)}"',
        ].join('\n'),
        hints: ['The share of calls that miss the cache is 1 − hit.', 'def daily_cost(calls, per, hit):\n    return calls * (1 - ___) * per'],
      },
      {
        goal: 'Finish `p95(lat)`: the 95th percentile, as a float.',
        starter: 'def p95(lat):\n    v = np.percentile(lat, ___)\n    return float(v)',
        solution: 'def p95(lat):\n    v = np.percentile(lat, 95)\n    return float(v)',
        tests: 'v = p95([100] * 18 + [900, 1000])\nassert abs(v - 905) < 1e-9, f"expected 905.0; got {v}"',
        hints: ['NumPy percentiles run from 0 to 100.', 'def p95(lat):\n    v = np.percentile(lat, ___)\n    return float(v)'],
      },
      {
        goal: 'Finish `routed_cost(share, small, big)`: the average cost per request when a fraction `share` of requests go to the small model.',
        starter: 'def routed_cost(share, small, big):\n    rest = ___\n    return share * small + rest * big',
        solution: 'def routed_cost(share, small, big):\n    rest = 1 - share\n    return share * small + rest * big',
        tests: [
          'v = routed_cost(0.7, 0.1, 1.0)',
          'assert abs(v - 0.37) < 1e-12, f"0.07 + 0.3 = 0.37; got {v}"',
          'assert routed_cost(0.0, 0.1, 1.0) == 1.0, "nothing routed: the big model\'s price"',
        ].join('\n'),
        hints: ['The rest of the requests still go to the big model.', 'def routed_cost(share, small, big):\n    rest = 1 - ___\n    return share * small + rest * big'],
      },
      {
        goal: 'Finish `max_steps(p, target)`: the most steps you can chain, each succeeding with probability `p`, so that all succeed with probability at least `target`.',
        starter: 'def max_steps(p, target):\n    n = 0\n    while p ** (n + 1) >= ___:\n        n += 1\n    return n',
        solution: 'def max_steps(p, target):\n    n = 0\n    while p ** (n + 1) >= target:\n        n += 1\n    return n',
        tests: [
          'assert max_steps(0.99, 0.9) == 10, f"0.99^10 ≈ 0.904; got {max_steps(0.99, 0.9)}"',
          'assert max_steps(0.95, 0.6) == 9, f"0.95^9 ≈ 0.63, 0.95^10 ≈ 0.599; got {max_steps(0.95, 0.6)}"',
        ].join('\n'),
        hints: ['Add steps while the chance that all succeed stays at or above the target.', 'def max_steps(p, target):\n    n = 0\n    while p ** (n + 1) >= ___:\n        n += 1\n    return n'],
        explain: 'A strong argument for short workflows over long agent runs.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e11-lab-2',
    title: 'Coding patterns from memory',
    intro: 'Write the patterns interviews ask for, each from an empty function: backoff delays, chunking with overlap, batching, top-k by cosine similarity, JSON from a reply, and a retry wrapper.',
    summary: 'You wrote six interview coding patterns from scratch.',
    minutes: 18,
    unlockAfter: 'e11-11',
    steps: [
      {
        goal: 'Write `backoff(tries, base)`: the list of waits `base`, `2·base`, `4·base`, … with one per try.',
        starter: 'def backoff(tries, base):\n    pass',
        solution: 'def backoff(tries, base):\n    return [base * 2 ** i\n            for i in range(tries)]',
        tests: 'assert backoff(4, 0.5) == [0.5, 1.0, 2.0, 4.0], f"got {backoff(4, 0.5)}"\nassert backoff(0, 1) == [], "no tries, no waits"',
        hints: ['Each wait is base × 2 to the power of the try number.', 'def backoff(tries, base):\n    return [base * 2 ** ___\n            for i in range(tries)]'],
      },
      {
        goal: 'Write `chunk(text, size, overlap)`: pieces of length `size`, each starting `size - overlap` after the last. Drop a final piece that is only overlap.',
        starter: 'def chunk(text, size, overlap):\n    pass',
        solution:
          'def chunk(text, size, overlap):\n    step = size - overlap\n    n = len(text)\n    out = []\n    for i in range(0, n, step):\n        out.append(text[i:i + size])\n        if i + size >= n:\n            break\n    return out',
        tests: [
          'assert chunk("abcdefghij", 4, 1) == ["abcd", "defg", "ghij"], f"got {chunk(\'abcdefghij\', 4, 1)}"',
          'assert chunk("abcdef", 3, 0) == ["abc", "def"], "no overlap: plain pieces"',
          'assert chunk("ab", 5, 2) == ["ab"], "short text: one piece"',
        ].join('\n'),
        hints: [
          'Step by size − overlap, and stop once a piece reaches the end of the text.',
          'def chunk(text, size, overlap):\n    step = size - ___\n    n = len(text)\n    out = []\n    for i in range(0, n, step):\n        out.append(text[i:i + size])\n        if i + size >= ___:\n            break\n    return out',
        ],
      },
      {
        goal: 'Write `batched(items, n)`: consecutive lists of up to `n` items.',
        starter: 'def batched(items, n):\n    pass',
        solution: 'def batched(items, n):\n    starts = range(0, len(items), n)\n    return [items[i:i + n]\n            for i in starts]',
        tests: 'assert batched(list(range(7)), 3) == [[0, 1, 2], [3, 4, 5], [6]], f"got {batched(list(range(7)), 3)}"\nassert batched([], 3) == [], "nothing to batch"',
        hints: ['Start a batch every n items and slice n at a time.', 'def batched(items, n):\n    starts = range(0, len(items), ___)\n    return [items[i:i + n]\n            for i in starts]'],
      },
      {
        goal: 'Write `top_k(q, M, k)`: indexes of the `k` rows of `M` with the highest cosine similarity to `q`, best first. Vectors are not unit length.',
        starter: 'def top_k(q, M, k):\n    pass',
        solution:
          'def top_k(q, M, k):\n    norms = np.linalg.norm(M, axis=1)\n    qn = np.linalg.norm(q)\n    sims = M @ q / (norms * qn)\n    order = np.argsort(-sims)\n    return list(order[:k])',
        tests: [
          'M = np.array([[2.0, 0.0], [3.0, 4.0], [0.0, 5.0]])',
          'q = np.array([4.0, 3.0])',
          'got = [int(i) for i in top_k(q, M, 2)]',
          'assert got == [1, 0], f"cosines 0.8, 0.96, 0.6: best are rows 1 then 0; got {got}"',
        ].join('\n'),
        hints: [
          'Divide each dot product by both lengths, then sort from highest.',
          'def top_k(q, M, k):\n    norms = np.linalg.norm(M, axis=1)\n    qn = np.linalg.norm(q)\n    sims = M @ q / (norms * ___)\n    order = np.argsort(-sims)\n    return list(order[:___])',
        ],
        explain: 'Lengths matter: row 0 is shorter than row 1 but points nearly the same way as q.',
      },
      {
        goal: 'Write `extract_json(s)`: the JSON object inside the reply `s` as a dict, or None if there is none or it does not parse.',
        starter: 'def extract_json(s):\n    pass',
        solution:
          'def extract_json(s):\n    i = s.find("{")\n    j = s.rfind("}")\n    if i < 0 or j < i:\n        return None\n    try:\n        return json.loads(s[i:j + 1])\n    except json.JSONDecodeError:\n        return None',
        tests: [
          'assert extract_json(\'Sure! {"total": 42} :)\') == {"total": 42}, "parse the part between the braces"',
          'assert extract_json("no json here") is None, "no braces: None"',
          'assert extract_json("{oops}") is None, "invalid JSON: None, not an exception"',
        ].join('\n'),
        hints: [
          'Find the first "{" and the last "}", parse that slice, and catch JSONDecodeError.',
          'def extract_json(s):\n    i = s.find("{")\n    j = s.rfind("}")\n    if i < 0 or j < i:\n        return ___\n    try:\n        return json.loads(s[i:j + 1])\n    except json.___:\n        return None',
        ],
      },
      {
        goal: 'Write `with_retry(call, tries)`: call `call()` until it returns without raising, up to `tries` times. Return `(result, attempts)`; if every try raises, raise the last error.',
        starter: 'def with_retry(call, tries):\n    pass',
        solution:
          'def with_retry(call, tries):\n    for n in range(1, tries + 1):\n        try:\n            return call(), n\n        except Exception as e:\n            err = e\n    raise err',
        tests: [
          'n = {"calls": 0}',
          'def flaky():',
          '    n["calls"] += 1',
          '    if n["calls"] < 3:',
          '        raise TimeoutError("slow")',
          '    return "ok"',
          'assert with_retry(flaky, 5) == ("ok", 3), "succeeds on the third try"',
          'n["calls"] = 0',
          'try:',
          '    with_retry(flaky, 2)',
          '    raise AssertionError("two tries should not be enough: re-raise the last error")',
          'except TimeoutError:',
          '    pass',
        ].join('\n'),
        hints: [
          'Loop over the tries; return on success; remember the error; raise it after the loop.',
          'def with_retry(call, tries):\n    for n in range(1, tries + 1):\n        try:\n            return call(), ___\n        except Exception as e:\n            err = e\n    raise ___',
        ],
        explain: 'In real code, sleep with backoff between tries and retry only temporary errors.',
      },
    ],
  },
];
