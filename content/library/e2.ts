import type { LibraryPage } from '../schema';

/** Unit E2 summary page: unlocked in the Library when the unit is finished. */
export const e2Library: LibraryPage = {
  unit: 'E2',
  ideas: [
    {
      title: 'Coroutines run when awaited',
      text: 'Calling an `async def` function gives a coroutine; `await` runs it and hands back its result. Forgetting `await` leaves you holding a coroutine object. `asyncio.run(main())` starts the first coroutine from ordinary code.',
    },
    {
      title: 'Sequential versus concurrent',
      text: 'Awaiting one thing after another adds the waits up. `asyncio.gather(a(), b())` runs them together: the total is about the longest single wait, and results come back in the order passed. Only independent calls can overlap.',
    },
    {
      title: 'Every wait gets a limit',
      text: '`asyncio.wait_for(coro, t)` or `async with asyncio.timeout(t):` cancels slow work and raises `TimeoutError`. httpx clients time out after 5 seconds of inactivity by default; set `timeout=` deliberately.',
    },
    {
      title: 'One async client, read the status',
      text: 'Create one `httpx.AsyncClient` and reuse it. A response has `status_code`, `json()` and `raise_for_status()`, which raises `HTTPStatusError` for 4xx and 5xx and otherwise returns the response for chaining.',
    },
    {
      title: 'Retry the temporary errors with backoff',
      text: 'Retry 429 and 5xx a few times, doubling the wait (0.5, 1, 2 s), and prefer the server\'s `Retry-After` when given. Do not retry other 4xx: the request is wrong. After the cap, fail clearly.',
    },
    {
      title: 'Test against a fake server',
      text: '`httpx.MockTransport(handler)` sends every request to your function, which returns chosen responses; pass it as `transport=`. Stage 503s and 429s to prove the retry path, and assert both the outcome and the number of calls.',
    },
  ],
  rules: [
    'No `await`, no result: `r = await client.get(url)`.',
    'Independent calls: `asyncio.gather`; dependent ones: one after another.',
    'Retry 429 and 5xx; never 400, 401, 403 or 404.',
    'Backoff wait = base × 2 ** attempt; honour Retry-After.',
    'Cap retries, then raise.',
    'Tests use a mock transport, never the real network.',
  ],
  example: {
    code: [
      'replies = [503, 429, 200]',
      '',
      'def handler(request):',
      '    code = replies.pop(0)',
      '    return sim.Response(',
      '        code, json={"ok": 1})',
      '',
      'async def fetch(client, url):',
      '    for attempt in range(4):',
      '        r = await client.get(url)',
      '        s = r.status_code',
      '        if s == 429 or s >= 500:',
      '            await sim.async_sleep(',
      '                0.5 * 2 ** attempt)',
      '            continue',
      '        r.raise_for_status()',
      '        return r.json()',
      '    raise RuntimeError("gave up")',
      '',
      'async def main():',
      '    t = sim.MockTransport(handler)',
      '    c = sim.AsyncClient(transport=t)',
      '    print(await fetch(c, "/x"))',
      '    print(sim.clock.sleeps)',
      '',
      'asyncio.run(main())',
    ].join('\n'),
    output: "{'ok': 1}\n[0.5, 1.0]",
    notes: [
      'The mock stages two temporary failures, then success: no network needed.',
      'Waits double (0.5 s, then 1 s); a 404 would have been returned at once and then raised by raise_for_status.',
      'With httpx, swap `sim` for `httpx` and the virtual sleep for `asyncio.sleep`.',
    ],
  },
  mistakes: [
    { mistake: 'Forgetting `await` on a request.', fix: 'You get a coroutine, not a response; await it.' },
    { mistake: 'Awaiting independent calls one by one.', fix: 'Use `asyncio.gather` to overlap them.' },
    { mistake: 'Retrying every error.', fix: 'Retry 429 and 5xx only; 4xx means fix the request.' },
    { mistake: 'Retrying immediately and forever.', fix: 'Exponential backoff with a cap, then a clear error.' },
    { mistake: 'Tests that call the real API.', fix: 'Use a mock transport with staged responses.' },
  ],
  forReal:
    'What the app cannot give you: real network failures and a real provider. In your plan this is week 2: build the async LLM client on httpx.AsyncClient with explicit timeouts, retries with exponential backoff on 429 and 5xx, Pydantic schemas (unit E3), token and cost logging, and tests against a mock transport.',
};
