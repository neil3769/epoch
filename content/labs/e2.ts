import type { Lab } from '../schema';

/*
 * Unit E2 labs: the plan's week 2 client in miniature. Lab 1 builds retry
 * with exponential backoff (and Retry-After) on the simulated HTTP client and
 * virtual clock; lab 2 starts every step from an empty function and tests an
 * async client against a mock transport.
 */
const DIFFERS =
  'The stand-in `sim.Client` / `sim.AsyncClient` mirror httpx\'s `get`, `post`, `status_code`, `json()`, `raise_for_status()`, `MockTransport` and `transport=`, but nothing goes over a network and `sim.sleep` moves a virtual clock instead of waiting. In real code use `httpx`, `time.sleep` or `asyncio.sleep`, and a real timeout.';

export const e2Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e2-lab-1',
    title: 'A client that retries',
    intro:
      'Build the retry logic from your plan\'s week 2 client: decide which errors to retry, compute exponential backoff, retry with a cap, and honour Retry-After. Time is virtual, so a 4-second wait takes no time at all.',
    summary: 'You built retry with exponential backoff: only 429 and 5xx are retried, waits double, Retry-After wins, and it gives up clearly.',
    minutes: 12,
    unlockAfter: 'e2-06',
    differs: DIFFERS,
    steps: [
      {
        goal: 'Write `retryable(s)`: True for the status 429 and any 5xx status.',
        starter: 'def retryable(s):\n    return ___',
        solution: 'def retryable(s):\n    return s == 429 or s >= 500',
        tests: [
          'for s in (429, 500, 502, 503, 504):',
          '    assert retryable(s), f"{s} should be retried"',
          'for s in (200, 400, 401, 403, 404):',
          '    assert not retryable(s), f"{s} should not be retried"',
        ].join('\n'),
        hints: ['429 asks you to slow down; 500 and up are server errors.', 'def retryable(s):\n    return s == ___ or s >= ___'],
      },
      {
        goal: 'Write `backoff(attempt, base=0.5)`: the wait before the next try, doubling each attempt (0.5, 1, 2, 4, ...).',
        starter: 'def backoff(attempt, base=0.5):\n    return ___',
        solution: 'def backoff(attempt, base=0.5):\n    return base * 2 ** attempt',
        tests: [
          'got = [backoff(i) for i in range(4)]',
          'assert got == [0.5, 1.0, 2.0, 4.0], f"got {got}"',
          'assert backoff(2, base=1) == 4, "base 1, attempt 2: 4 seconds"',
        ].join('\n'),
        hints: ['Multiply the base by 2 raised to the attempt number.', 'def backoff(attempt, base=0.5):\n    return base * 2 ** ___'],
      },
      {
        goal: 'Finish `get_with_retry(client, url, n=4)`: retry retryable statuses with backoff; return the first other response; raise `RuntimeError` when the tries run out.',
        starter:
          'def get_with_retry(client, url, n=4):\n    for attempt in range(n):\n        r = client.get(url)\n        s = r.status_code\n        if not retryable(s):\n            return r\n        ___\n    raise RuntimeError("gave up")',
        solution:
          'def get_with_retry(client, url, n=4):\n    for attempt in range(n):\n        r = client.get(url)\n        s = r.status_code\n        if not retryable(s):\n            return r\n        sim.sleep(backoff(attempt))\n    raise RuntimeError("gave up")',
        tests: [
          'sim.clock.reset()',
          'c = sim.Client(schedule=[503, 429, 200])',
          'r = get_with_retry(c, "/data")',
          'assert r.status_code == 200, f"should end on the 200, got {r.status_code}"',
          'assert sim.clock.sleeps == [0.5, 1.0], f"waits should be 0.5 then 1.0, got {sim.clock.sleeps}"',
          'c = sim.Client(schedule=[404])',
          'r = get_with_retry(c, "/missing")',
          'assert r.status_code == 404 and len(c.calls) == 1, "404 is returned at once, without retrying"',
          'c = sim.Client(schedule=[500])',
          'try:',
          '    get_with_retry(c, "/down", n=3)',
          '    raise AssertionError("should raise RuntimeError when all tries fail")',
          'except RuntimeError:',
          '    pass',
          'assert len(c.calls) == 3, f"exactly 3 tries, got {len(c.calls)}"',
        ].join('\n'),
        hints: [
          'When the status is retryable, wait `backoff(attempt)` seconds on the virtual clock before looping.',
          '        sim.sleep(___(attempt))',
        ],
        explain: 'Bounded, spaced-out retries for temporary errors only; everything else returns at once.',
      },
      {
        goal: 'Write `wait_for_retry(r, attempt)`: the server\'s `Retry-After` header as a float if present, otherwise `backoff(attempt)`. Then `get_with_retry` can use it.',
        starter: 'def wait_for_retry(r, attempt):\n    ___',
        solution:
          'def wait_for_retry(r, attempt):\n    h = r.headers.get("Retry-After")\n    if h is not None:\n        return float(h)\n    return backoff(attempt)',
        tests: [
          'c = sim.Client(schedule=[429], retry_after=7)',
          'r = c.get("/x")',
          'assert wait_for_retry(r, 0) == 7.0, f"use Retry-After when given, got {wait_for_retry(r, 0)}"',
          'c = sim.Client(schedule=[503])',
          'r = c.get("/x")',
          'assert wait_for_retry(r, 2) == 2.0, "no header: fall back to backoff(2) = 2.0"',
        ].join('\n'),
        hints: [
          'Read the header with `r.headers.get("Retry-After")`; None means it was not sent.',
          'def wait_for_retry(r, attempt):\n    h = r.headers.get(___)\n    if h is not None:\n        return float(h)\n    return ___(attempt)',
        ],
        explain: 'Retry-After can also be an HTTP date; real clients handle both forms.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e2-lab-2',
    title: 'An async client, tested',
    intro:
      'Write an async client and test it without a network: a mock handler that stages failures, an async fetch with retries, fetching many URLs at once, and a fallback across mirrors. Every step starts from an empty function.',
    summary: 'You wrote an async, retrying client and tested it against a mock transport with staged failures.',
    minutes: 14,
    unlockAfter: 'e2-08',
    differs: DIFFERS,
    steps: [
      {
        goal: 'Write `make_handler(codes)`: a handler that answers each request with the next status in the list (repeating the last one when the list runs out), with JSON body `{"n": <request number>}` starting at 1.',
        starter: 'def make_handler(codes):\n    pass',
        solution:
          'def make_handler(codes):\n    count = [0]\n    def handler(request):\n        count[0] += 1\n        i = min(count[0], len(codes))\n        return sim.Response(\n            codes[i - 1],\n            json={"n": count[0]})\n    return handler',
        tests: [
          'h = make_handler([503, 200])',
          'c = sim.Client(transport=sim.MockTransport(h))',
          'got = [c.get("/x").status_code for _ in range(3)]',
          'assert got == [503, 200, 200], f"next status each time, repeating the last; got {got}"',
          'assert c.get("/x").json() == {"n": 4}, "the body counts requests from 1"',
        ].join('\n'),
        hints: [
          'Keep a counter the inner function can change (a one-item list works), and clamp the index to the end of the list.',
          'def make_handler(codes):\n    count = [0]\n    def handler(request):\n        count[0] += 1\n        i = min(count[0], len(___))\n        return sim.Response(\n            codes[i - 1],\n            json={"n": ___})\n    return handler',
        ],
        explain: 'A closure keeps state between calls: your fake server remembers how many requests it has seen.',
      },
      {
        goal: 'Write `async def fetch(client, url, tries=3)`: await `client.get`, retry 429 and 5xx after `await sim.async_sleep(0.5 * 2 ** attempt)`, and return the JSON of the first good response; raise `RuntimeError` if all tries fail.',
        starter: 'async def fetch(client, url, tries=3):\n    pass',
        solution:
          'async def fetch(client, url, tries=3):\n    for attempt in range(tries):\n        r = await client.get(url)\n        s = r.status_code\n        if s == 429 or s >= 500:\n            await sim.async_sleep(\n                0.5 * 2 ** attempt)\n            continue\n        r.raise_for_status()\n        return r.json()\n    raise RuntimeError("gave up")',
        tests: [
          'sim.clock.reset()',
          'c = sim.AsyncClient(transport=sim.MockTransport(make_handler([503, 429, 200])))',
          'data = await fetch(c, "/x")',
          'assert data == {"n": 3}, f"third request succeeds, got {data}"',
          'assert sim.clock.sleeps == [0.5, 1.0], f"waits 0.5 then 1.0, got {sim.clock.sleeps}"',
          'c = sim.AsyncClient(transport=sim.MockTransport(make_handler([500])))',
          'try:',
          '    await fetch(c, "/x")',
          '    raise AssertionError("should raise RuntimeError after 3 failures")',
          'except RuntimeError:',
          '    pass',
        ].join('\n'),
        hints: [
          'Same loop as lab 1, with `await` on the request and on the sleep.',
          'async def fetch(client, url, tries=3):\n    for attempt in range(tries):\n        r = await client.get(url)\n        s = r.status_code\n        if s == 429 or s >= 500:\n            await sim.async_sleep(\n                0.5 * 2 ** ___)\n            continue\n        r.raise_for_status()\n        return r.___()\n    raise RuntimeError("gave up")',
        ],
      },
      {
        goal: 'Write `async def fetch_all(c, urls)` for a client `c`: fetch every URL at the same time with `asyncio.gather` and return the list of results in order.',
        starter: 'async def fetch_all(c, urls):\n    pass',
        solution: 'async def fetch_all(c, urls):\n    jobs = [fetch(c, u) for u in urls]\n    return await asyncio.gather(*jobs)',
        tests: [
          'def h(request):',
          '    return sim.Response(200, json={"path": request.url.path})',
          'c = sim.AsyncClient(transport=sim.MockTransport(h))',
          'got = await fetch_all(c, ["/a", "/b", "/c"])',
          'assert got == [{"path": "/a"}, {"path": "/b"}, {"path": "/c"}], f"results in order, got {got}"',
        ].join('\n'),
        hints: [
          'Make one `fetch(...)` coroutine per URL and unpack them into gather with `*`.',
          'async def fetch_all(c, urls):\n    jobs = [___(c, u) for u in urls]\n    return await asyncio.gather(*jobs)',
        ],
        explain: 'Each fetch keeps its own retries; gather runs them together.',
      },
      {
        goal: 'Write `async def first_working(c, urls)` for a client `c`: try the URLs in order (each with `fetch`) and return the first result that works; return `None` if every one raises.',
        starter: 'async def first_working(c, urls):\n    pass',
        solution:
          'async def first_working(c, urls):\n    for u in urls:\n        try:\n            return await fetch(c, u)\n        except Exception:\n            continue\n    return None',
        tests: [
          'def h(request):',
          '    if request.url.path == "/mirror2":',
          '        return sim.Response(200, json={"ok": 2})',
          '    return sim.Response(503)',
          'c = sim.AsyncClient(transport=sim.MockTransport(h))',
          'got = await first_working(c, ["/mirror1", "/mirror2", "/mirror3"])',
          'assert got == {"ok": 2}, f"mirror1 always fails; mirror2 works; got {got}"',
          'assert await first_working(c, ["/m1", "/m3"]) is None, "all fail: None"',
        ].join('\n'),
        hints: [
          'Loop over the URLs; return as soon as `fetch` succeeds; on an exception move to the next.',
          'async def first_working(c, urls):\n    for u in urls:\n        try:\n            return await ___(c, u)\n        except Exception:\n            ___\n    return None',
        ],
        explain: 'A fallback across mirrors (or providers) is the same pattern as a provider fallback in unit E10.',
      },
    ],
  },
];
