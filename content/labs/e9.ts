import type { Lab } from '../schema';

const DIFFERS =
  'Uses the simulated services: LOGS and PRICES are made-up data, FakeLLM replies from a script, and time is virtual (sim.clock). Real systems read the same fields from provider responses and from tracing tools such as OpenTelemetry or Langfuse.';

/*
 * Unit E9 labs. Lab 1: read the logs, with scaffolding (cost, percentiles,
 * error rate, a per-model summary). Lab 2, from empty functions: a cache, a
 * routed call with a check, a traced request, and a before/after report.
 */
export const e9Labs: Lab[] = [
  {
    id: 'e9-lab-1',
    title: 'Read the logs',
    intro: 'Turn 40 logged requests into the numbers a review asks for: cost per request, p50 and p95, the error rate, and a summary per model.',
    summary: 'You computed cost, latency percentiles and error rates from request logs.',
    minutes: 12,
    unlockAfter: 'e9-04',
    differs: DIFFERS,
    steps: [
      {
        goal: 'Finish `cost(r)`: the cost in euros of one logged request.',
        starter: 'def cost(r):\n    pin, pout = PRICES[r["model"]]\n    t = (r["input_tokens"] * pin\n         + r["output_tokens"] * ___)\n    return t / 1e6',
        solution: 'def cost(r):\n    pin, pout = PRICES[r["model"]]\n    t = (r["input_tokens"] * pin\n         + r["output_tokens"] * pout)\n    return t / 1e6',
        tests: 'assert abs(cost(LOGS[0]) - (1316 * 0.25 + 233 * 1.25) / 1e6) < 1e-12, f"got {cost(LOGS[0])}"',
        hints: ['Output tokens have their own price.', 'def cost(r):\n    pin, pout = PRICES[r["model"]]\n    t = (r["input_tokens"] * pin\n         + r["output_tokens"] * ___)\n    return t / 1e6'],
      },
      {
        goal: 'Finish `pct(logs, q)`: the q-th percentile of latency_ms.',
        starter: 'def pct(logs, q):\n    lat = [r["latency_ms"]\n           for r in logs]\n    v = np.percentile(lat, ___)\n    return float(v)',
        solution: 'def pct(logs, q):\n    lat = [r["latency_ms"]\n           for r in logs]\n    v = np.percentile(lat, q)\n    return float(v)',
        tests: 'assert round(pct(LOGS, 50)) == 722 and round(pct(LOGS, 95)) == 2000, f"p50 ≈ 722, p95 ≈ 2000; got {pct(LOGS, 50)}, {pct(LOGS, 95)}"',
        hints: ['Pass q straight through.', 'def pct(logs, q):\n    lat = [r["latency_ms"]\n           for r in logs]\n    v = np.percentile(lat, ___)\n    return float(v)'],
      },
      {
        goal: 'Finish `error_rate(logs)`: the share of requests that failed.',
        starter: 'def error_rate(logs):\n    bad = sum(___ r["ok"]\n              for r in logs)\n    return bad / len(logs)',
        solution: 'def error_rate(logs):\n    bad = sum(not r["ok"]\n              for r in logs)\n    return bad / len(logs)',
        tests: 'assert error_rate(LOGS) == 0.05, f"2 of 40; got {error_rate(LOGS)}"',
        hints: ['Count the requests that were not ok.', 'def error_rate(logs):\n    bad = sum(___ r["ok"]\n              for r in logs)\n    return bad / len(logs)'],
      },
      {
        goal: 'Finish `by_model(logs)`: for each model, a dict with its request count, total cost and p95.',
        starter:
          'def by_model(logs):\n    out = {}\n    ms = {r["model"] for r in logs}\n    for m in sorted(ms):\n        rs = [r for r in logs\n              if r["model"] == ___]\n        c = sum(map(cost, rs))\n        out[m] = {"n": len(rs),\n                  "cost": c,\n                  "p95": pct(rs, 95)}\n    return out',
        solution:
          'def by_model(logs):\n    out = {}\n    ms = {r["model"] for r in logs}\n    for m in sorted(ms):\n        rs = [r for r in logs\n              if r["model"] == m]\n        c = sum(map(cost, rs))\n        out[m] = {"n": len(rs),\n                  "cost": c,\n                  "p95": pct(rs, 95)}\n    return out',
        tests: [
          's = by_model(LOGS)',
          'assert set(s) == {"model-small", "model-large"}, f"one entry per model; got {set(s)}"',
          'assert s["model-small"]["n"] == 34 and s["model-large"]["n"] == 6, "34 small, 6 large"',
          'assert s["model-large"]["cost"] > s["model-small"]["cost"], "6 large requests cost more than 34 small ones"',
        ].join('\n'),
        hints: ['Filter the logs to one model at a time, then reuse cost and pct.', 'def by_model(logs):\n    out = {}\n    ms = {r["model"] for r in logs}\n    for m in sorted(ms):\n        rs = [r for r in logs\n              if r["model"] == ___]\n        c = sum(map(cost, rs))\n        out[m] = {"n": len(rs),\n                  "cost": c,\n                  "p95": pct(rs, 95)}\n    return out'],
        explain: 'Breaking numbers down by model is usually the first useful view.',
      },
    ],
  },
  {
    id: 'e9-lab-2',
    title: 'Cheaper and faster',
    intro: 'Build the three standard optimisations and the report that proves them, each from an empty function: a cache, a routed call with a check, a traced request, and a before/after table.',
    summary: 'You built caching, routing and tracing, and reported their effect.',
    minutes: 18,
    unlockAfter: 'e9-07',
    differs: DIFFERS,
    given: 'LARGE = "model-large"',
    steps: [
      {
        goal: 'Write `cached(llm, cache, q)`: return the cached answer for `q` (key: stripped, lower case), or call `chat(llm, q)` and store it.',
        starter: 'def cached(llm, cache, q):\n    pass',
        solution: 'def cached(llm, cache, q):\n    key = q.strip().lower()\n    if key not in cache:\n        cache[key] = chat(llm, q)\n    return cache[key]',
        tests: [
          'llm = sim.FakeLLM(script=["A1", "A2"])',
          'c = {}',
          'assert cached(llm, c, "Hi?") == "A1", "first time: call the model"',
          'assert cached(llm, c, " hi? ") == "A1", "same question after normalising: from the cache"',
          'assert len(llm.calls) == 1, f"one model call; got {len(llm.calls)}"',
          'assert cached(llm, c, "Other") == "A2", "a new question calls the model"',
        ].join('\n'),
        hints: ['Normalise into a key; call only on a miss.', 'def cached(llm, cache, q):\n    key = q.strip().___()\n    if key not in cache:\n        cache[key] = chat(llm, q)\n    return cache[___]'],
      },
      {
        goal: 'Write `routed(small, large, q)`: ask the small model; if its reply is not valid JSON, ask the large one. Return `(parsed, model_used)`.',
        starter: 'def routed(small, large, q):\n    pass',
        solution:
          'def routed(small, large, q):\n    out = chat(small, q)\n    try:\n        data = json.loads(out)\n        return data, "small"\n    except json.JSONDecodeError:\n        out = chat(large, q, LARGE)\n        data = json.loads(out)\n        return data, "large"',
        tests: [
          's, l = sim.FakeLLM(script=[\'{"n": 1}\']), sim.FakeLLM()',
          'assert routed(s, l, "q") == ({"n": 1}, "small"), "valid JSON from the small model: keep it"',
          'assert len(l.calls) == 0, "the large model is not called when the small one succeeds"',
          's, l = sim.FakeLLM(script=["oops"]), sim.FakeLLM(script=[\'{"n": 2}\'])',
          'assert routed(s, l, "q") == ({"n": 2}, "large"), "invalid JSON: escalate"',
        ].join('\n'),
        hints: [
          'Try json.loads on the small reply; in the except branch, call the large model.',
          'def routed(small, large, q):\n    out = chat(small, q)\n    try:\n        data = json.loads(out)\n        return data, "small"\n    except json.___:\n        out = chat(large, q, LARGE)\n        data = json.loads(out)\n        return data, ___',
        ],
      },
      {
        goal: 'Write `traced(llm, q)`: inside `span("request")`, run `span("retrieve")` (advance the clock 0.3 s) then `span("llm")` around `chat(llm, q)`. Return the reply.',
        starter: 'def traced(llm, q):\n    pass',
        solution:
          'def traced(llm, q):\n    with span("request"):\n        with span("retrieve"):\n            sim.clock.advance(0.3)\n        with span("llm"):\n            out = chat(llm, q)\n    return out',
        tests: [
          'SPANS.clear()',
          'out = traced(sim.FakeLLM(script=["ok"], latency=1.0), "q")',
          'assert out == "ok", "return the reply"',
          'assert SPANS == [("retrieve", 0.3), ("llm", 1.0), ("request", 1.3)], f"got {SPANS}"',
        ].join('\n'),
        hints: [
          'Nest the two inner spans inside the request span.',
          'def traced(llm, q):\n    with span("request"):\n        with span("retrieve"):\n            sim.clock.advance(___)\n        with span("llm"):\n            out = chat(llm, q)\n    return ___',
        ],
      },
      {
        goal: 'Write `report(before, after)`: each is a dict with cost, p95 and score. Return a dict of relative changes, `(after − before) / before`, rounded to 2 places, for each key.',
        starter: 'def report(before, after):\n    pass',
        solution: 'def report(before, after):\n    out = {}\n    for k in before:\n        d = after[k] - before[k]\n        r = d / before[k]\n        out[k] = round(r, 2)\n    return out',
        tests: [
          'b = {"cost": 0.006, "p95": 2.0, "score": 0.86}',
          'a = {"cost": 0.0021, "p95": 0.9, "score": 0.85}',
          'got = report(b, a)',
          'assert got == {"cost": -0.65, "p95": -0.55, "score": -0.01}, f"got {got}"',
        ].join('\n'),
        hints: ['A dict comprehension over the keys of before.', 'def report(before, after):\n    out = {}\n    for k in before:\n        d = after[k] - before[k]\n        r = d / before[___]\n        out[k] = round(r, 2)\n    return out'],
        explain: '−65% cost, −55% p95, −1% score: one line for the review.',
      },
    ],
  },
];
