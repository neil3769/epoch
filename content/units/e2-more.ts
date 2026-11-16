import type { Lesson } from '../schema';

/*
 * E2 lessons 4 to 8: timeouts, an async HTTP client, retries with backoff,
 * testing with a mock transport, and the checkpoint. HTTP calls use the
 * simulated client (`sim.Client` / `sim.AsyncClient`), shaped like httpx
 * (checked against the httpx and asyncio docs on 2026-11-16).
 */
export const e2More: Lesson[] = [
  // ------------------------------------------------------------------ 4
  {
    id: 'e2-04',
    title: 'Timeouts',
    summary: 'Give every wait a limit: wait_for cancels slow work and raises TimeoutError.',
    card: {
      title: 'Timeouts',
      text: 'A network call can hang, so give every wait a limit. `asyncio.wait_for(coro, timeout)` cancels the work and raises `TimeoutError` when time runs out, and httpx clients take a `timeout=` too, defaulting to 5 seconds of inactivity. Then decide what happens next: retry, fall back, or report the failure.',
      code: `async def slow():
    await asyncio.sleep(1)
    return "done"

async def main():
    try:
        r = await asyncio.wait_for(
            slow(), timeout=0.1)
    except TimeoutError:
        r = "timed out"
    print(r)

asyncio.run(main())`,
      output: 'timed out',
    },
    exercises: [
      {
        id: 'e2-4-1',
        type: 'predict-output',
        prompt: 'This one is quick. What does this print?',
        code: `async def quick():
    await asyncio.sleep(0.05)
    return "done"

async def main():
    try:
        r = await asyncio.wait_for(
            quick(), timeout=0.5)
    except TimeoutError:
        r = "timed out"
    print(r)

asyncio.run(main())`,
        answer: 'done',
        options: [
          { text: 'done' },
          { text: 'timed out', why: 'quick takes 0.05 s, well inside the 0.5 s limit.' },
        ],
        explain: 'A timeout only fires when the work runs over the limit.',
      },
      {
        id: 'e2-4-2',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `async def slow():
    print("start")
    await asyncio.sleep(1)
    print("end")

async def main():
    try:
        await asyncio.wait_for(
            slow(), 0.1)
    except TimeoutError:
        print("gave up")

asyncio.run(main())`,
        answer: 'start\ngave up',
        options: [
          { text: 'start\ngave up' },
          { text: 'start\nend\ngave up', why: 'wait_for cancels slow when time runs out, so "end" is never printed.' },
          { text: 'gave up', why: 'slow starts at once and prints "start" before its long sleep.' },
        ],
        explain: 'The slow work is cancelled, not left running in the background.',
      },
      {
        id: 'e2-4-3',
        type: 'mcq',
        prompt: 'You create `httpx.AsyncClient()` with no timeout argument. What happens if the server goes silent?',
        options: [
          { text: 'It raises a timeout error after about 5 seconds' },
          { text: 'It waits forever unless you add a timeout', why: 'httpx has a default: a TimeoutException after 5 seconds of network inactivity.' },
          { text: 'It retries the request three times', why: 'httpx does not retry by itself; you write the retry logic.' },
        ],
        answer: 0,
        explain: 'httpx defaults to 5 s; `timeout=None` would disable it, which is rarely what you want.',
      },
      {
        id: 'e2-4-4',
        type: 'fill-blank',
        prompt: 'Catch the timeout.',
        code: `async def main():
    try:
        await asyncio.wait_for(
            asyncio.sleep(1), 0.05)
    except ___:
        print("too slow")

asyncio.run(main())`,
        answer: ['TimeoutError'],
        distractors: [
          { text: 'ValueError', why: 'A timeout is not a ValueError, so this would not catch it.' },
          { text: 'KeyError', why: 'Nothing is looked up by key; the timeout escapes uncaught.' },
        ],
        expectOutput: 'too slow',
        explain: 'Since Python 3.11, `wait_for` raises the built-in `TimeoutError`.',
      },
      {
        id: 'e2-4-5',
        type: 'spot-bug',
        prompt: 'One slow call crashes the whole program. Which line needs a try/except?',
        code: `async def nap():
    await asyncio.sleep(1)

async def main():
    await asyncio.wait_for(nap(), .1)
    print("next task")

asyncio.run(main())`,
        error: 'TimeoutError: ',
        answer: 4,
        lineWhy: {
          '0': 'A slow coroutine is what a timeout is for.',
          '1': 'Sleeping stands in for a slow network call.',
          '3': 'main is a proper coroutine function.',
          '5': 'Never reached: the timeout escapes first.',
          '7': 'Starting main is correct.',
        },
        explain: 'Wrap it: `try: ... except TimeoutError:` and decide what to do instead of crashing.',
      },
      {
        id: 'e2-4-6',
        type: 'mcq',
        prompt: 'A call to a model API timed out. What should your client usually do?',
        options: [
          { text: 'Retry a few times, then report the failure' },
          { text: 'Wait forever next time with timeout=None', why: 'A hung connection would then block the program indefinitely.' },
          { text: 'Ignore it and return an empty answer', why: 'Silently returning nothing hides the failure from the caller.' },
        ],
        answer: 0,
        explain: 'Timeouts and retries work together: bounded waits, bounded tries.',
      },
      {
        id: 'e2-4-7',
        type: 'predict-output',
        prompt: 'The context-manager form. What does this print?',
        code: `async def work():
    async with asyncio.timeout(0.1):
        await asyncio.sleep(1)
        print("finished")

async def main():
    try:
        await work()
    except TimeoutError:
        print("too slow")

asyncio.run(main())`,
        answer: 'too slow',
        options: [
          { text: 'too slow' },
          { text: 'finished', why: 'The 1 s sleep runs past the 0.1 s limit and is cancelled.' },
          { text: 'finished\ntoo slow', why: 'The sleep is cancelled before "finished" can print.' },
        ],
        explain: '`asyncio.timeout` limits everything inside the block; the TimeoutError is caught outside it.',
      },
      {
        id: 'e2-4-8',
        type: 'run-code',
        prompt: 'Set `r` to the result of `fetch()`, giving up after 0.5 seconds. (Exercises here allow `await` at the top level, as notebooks do.)',
        before: `async def fetch():
    await asyncio.sleep(0.05)
    return 200`,
        solution: 'r = await asyncio.wait_for(\n    fetch(), 0.5)',
        tests: 'assert r == 200, f"fetch finishes in time and returns 200, got {r!r}"',
        maxLines: 2,
        placeholder: 'r = await ...',
        explain: 'In a script this line would sit inside an `async def`.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 'e2-05',
    title: 'An async HTTP client',
    summary: 'One AsyncClient, awaited requests, status codes, json() and raise_for_status().',
    card: {
      title: 'An async HTTP client',
      text: '`httpx.AsyncClient` sends requests without blocking: `async with httpx.AsyncClient() as client:`, then `r = await client.get(url)`. A response has a `status_code`, a body from `r.json()`, and `r.raise_for_status()`, which raises for error codes and otherwise returns the response. Make one client and reuse it, because a new client per request throws away its connection pool.',
      code: `async def main():
    c = sim.AsyncClient(
        body={"temp": 15})
    async with c:
        r = await c.get("/weather")
        print(r.status_code, r.json())

asyncio.run(main())`,
      output: "200 {'temp': 15}",
    },
    exercises: [
      {
        id: 'e2-5-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `async def main():
    c = sim.AsyncClient(
        schedule=[404])
    r = await c.get("/missing")
    print(r.status_code, r.is_success)

asyncio.run(main())`,
        answer: '404 False',
        options: [
          { text: '404 False' },
          { text: '404 True', why: '`is_success` is True only for 2xx codes; 404 means not found.' },
          { text: 'HTTPStatusError', why: 'Nothing raises here: only `raise_for_status()` turns an error code into an exception.' },
        ],
        explain: 'An error status is still a response; you decide what to do with it.',
      },
      {
        id: 'e2-5-2',
        type: 'predict-output',
        prompt: 'Turn an error status into an exception. What does this print?',
        code: `async def main():
    c = sim.AsyncClient(
        schedule=[500])
    r = await c.get("/data")
    try:
        r.raise_for_status()
    except sim.HTTPStatusError as e:
        print(e.response.status_code)

asyncio.run(main())`,
        answer: '500',
        options: [
          { text: '500' },
          { text: 'nothing', why: '500 is an error code, so `raise_for_status` raises and the except prints it.' },
          { text: '200', why: 'The server answered 500, and the error carries that response.' },
        ],
        explain: 'httpx raises `httpx.HTTPStatusError`, which carries the response.',
      },
      {
        id: 'e2-5-3',
        type: 'mcq',
        prompt: 'For which responses does `raise_for_status()` raise?',
        options: [
          { text: 'Error codes: 4xx and 5xx' },
          { text: 'Only for 5xx server errors', why: '4xx client errors such as 404 raise too.' },
          { text: 'For every response that has a body', why: 'A body has nothing to do with it; the status code decides.' },
        ],
        answer: 0,
        explain: 'Successful responses come back unchanged, so you can chain: `r.raise_for_status().json()`.',
      },
      {
        id: 'e2-5-4',
        type: 'fill-blank',
        prompt: 'Send the request.',
        code: `async def main():
    client = sim.AsyncClient()
    r = ___ client.get("/ping")
    print(r.status_code)

asyncio.run(main())`,
        answer: ['await'],
        distractors: [
          { text: 'async', why: '`async` marks a function definition; to run a coroutine and get its result, `await` it.' },
          { text: 'yield', why: '`yield` makes a generator; it does not run the request.' },
        ],
        expectOutput: '200',
        explain: 'Every AsyncClient request is a coroutine: await it.',
      },
      {
        id: 'e2-5-5',
        type: 'predict-output',
        prompt: 'Three requests at once on one client. What does this print?',
        code: `async def main():
    client = sim.AsyncClient(
        schedule=[200, 503, 200])
    rs = await asyncio.gather(
        client.get("/a"),
        client.get("/b"),
        client.get("/c"))
    print([r.status_code for r in rs])

asyncio.run(main())`,
        answer: '[200, 503, 200]',
        options: [
          { text: '[200, 503, 200]' },
          { text: '[200, 200, 200]', why: 'The stand-in replies in its schedule\'s order, and the second reply is a 503.' },
          { text: '[503]', why: 'gather returns one result per request, failures included.' },
        ],
        explain: 'gather keeps the order you passed, so you know which request failed.',
      },
      {
        id: 'e2-5-6',
        type: 'mcq',
        prompt: 'Your code makes `httpx.AsyncClient()` inside a loop, once per request. What is the problem?',
        options: [
          { text: 'Each client discards its connection pool' },
          { text: 'httpx allows only one client per program', why: 'You may create several; the problem is creating one per request in a hot loop.' },
          { text: 'Requests made that way are not async', why: 'They are still async; they just pay to set up new connections every time.' },
        ],
        answer: 0,
        explain: 'httpx\'s docs advise one client, reused, for connection pooling.',
      },
      {
        id: 'e2-5-7',
        type: 'spot-bug',
        prompt: 'Which line forgets something?',
        code: `async def main():
    client = sim.AsyncClient()
    r = client.get("/ping")
    print(r.status_code)

asyncio.run(main())`,
        error: "AttributeError: 'coroutine' object has no attribute 'status_code'",
        answer: 2,
        raiseLine: 3,
        lineWhy: {
          '0': 'main is a proper coroutine function.',
          '1': 'Making the client is fine.',
          '3': 'Python points here, but reading status_code is right; `r` is not a response yet.',
          '5': 'Starting main is correct.',
        },
        explain: 'Without `await`, `r` is an unrun coroutine. Write `r = await client.get("/ping")`.',
      },
      {
        id: 'e2-5-8',
        type: 'run-code',
        prompt: 'Get "/health", raise if the status is an error, and set `data` to the JSON body.',
        before: `client = sim.AsyncClient(
    body={"ok": True})`,
        solution: 'r = await client.get("/health")\ndata = r.raise_for_status().json()',
        tests: 'assert data == {"ok": True}, f"data should be the JSON body, got {data!r}"',
        maxLines: 2,
        placeholder: 'r = await ...\ndata = ...',
        explain: '`raise_for_status()` returns the response when all is well, so `.json()` can follow it.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 'e2-06',
    title: 'Retry with backoff',
    summary: 'Retry 429 and 5xx a few times with growing waits, honour Retry-After, and never retry other 4xx.',
    card: {
      title: 'Retry with backoff',
      text: 'Some failures are temporary: 429 means "slow down", and 5xx codes such as 500 and 503 mean the server had a problem. Retry those a few times, waiting longer each time (exponential backoff: 1, 2, 4 seconds), and honour a `Retry-After` header if the server sends one. Do not retry other 4xx errors such as 400 or 404, because the request itself is wrong and will fail again.',
      code: `c = sim.Client(
    schedule=[503, 503, 200])
for attempt in range(4):
    r = c.get("/data")
    if r.status_code < 500:
        break
    sim.sleep(2 ** attempt)
print(r.status_code, sim.clock.sleeps)`,
      output: '200 [1.0, 2.0]',
    },
    exercises: [
      {
        id: 'e2-6-1',
        type: 'predict-output',
        prompt: 'Backoff delays, starting at half a second. What does this print?',
        code: `base = 0.5
print([base * 2 ** i
       for i in range(4)])`,
        answer: '[0.5, 1.0, 2.0, 4.0]',
        options: [
          { text: '[0.5, 1.0, 2.0, 4.0]' },
          { text: '[0.5, 1.0, 1.5, 2.0]', why: 'That grows by a fixed step. Exponential backoff doubles each time.' },
          { text: '[1.0, 2.0, 4.0, 8.0]', why: 'The first wait is base × 2⁰ = 0.5.' },
        ],
        explain: 'Doubling gives the server more and more room to recover.',
      },
      {
        id: 'e2-6-2',
        type: 'predict-output',
        prompt: 'Which statuses are worth retrying? What does this print?',
        code: `def retryable(s):
    return s == 429 or s >= 500

codes = [200, 400, 404, 429, 503]
print([s for s in codes
       if retryable(s)])`,
        answer: '[429, 503]',
        options: [
          { text: '[429, 503]' },
          { text: '[400, 404, 429, 503]', why: '400 and 404 mean the request itself is wrong; retrying sends the same bad request.' },
          { text: '[503]', why: '429 is temporary too: the server asks you to slow down, then try again.' },
        ],
        explain: 'Retry "try again later" errors, not "your request is wrong" errors.',
      },
      {
        id: 'e2-6-3',
        type: 'mcq',
        prompt: 'A request returns 404 Not Found. Should the client retry it?',
        options: [
          { text: 'No: it will just fail the same way again' },
          { text: 'Yes, with backoff, like any error', why: 'Backoff helps with temporary trouble. A missing resource stays missing.' },
          { text: 'Yes, but without any waiting', why: 'It should not be retried at all: the URL or request is wrong.' },
        ],
        answer: 0,
        explain: 'Fix the request, or report the error.',
      },
      {
        id: 'e2-6-4',
        type: 'fill-blank',
        prompt: 'Double the wait after each failure.',
        code: `c = sim.Client(
    schedule=[500, 500, 200])
base = 0.5
for attempt in range(4):
    r = c.get("/data")
    if r.status_code == 200:
        break
    sim.sleep(base * 2 ** ___)
print(sim.clock.sleeps)`,
        answer: ['attempt'],
        distractors: [
          { text: 'base', why: '2 ** 0.5 is a constant, so every wait would be the same.' },
          { text: '2', why: '2 ** 2 is always 4, so every wait would be 2 seconds: no growth.' },
        ],
        expectOutput: '[0.5, 1.0]',
        explain: 'attempt 0 waits 0.5 s, attempt 1 waits 1 s, then the third call succeeds.',
      },
      {
        id: 'e2-6-5',
        type: 'predict-output',
        prompt: 'The server says how long to wait. What does this print?',
        code: `c = sim.Client(schedule=[429, 200],
               retry_after=3)
for attempt in range(3):
    r = c.get("/data")
    if r.status_code != 429:
        break
    h = r.headers.get("Retry-After")
    w = float(h or 2 ** attempt)
    sim.sleep(w)
print(r.status_code, sim.clock.sleeps)`,
        answer: '200 [3.0]',
        options: [
          { text: '200 [3.0]' },
          { text: '200 [1.0]', why: 'The 429 carried `Retry-After: 3`, which takes priority over the default backoff.' },
          { text: '429 [3.0]', why: 'After waiting, the second call gets 200 and the loop stops.' },
        ],
        explain: 'When the server tells you how long to wait, use that.',
      },
      {
        id: 'e2-6-6',
        type: 'mcq',
        prompt: 'Why cap the number of retries?',
        options: [
          { text: 'A server that stays down needs a clear failure' },
          { text: 'Retries are free, so no cap is needed', why: 'Each retry costs time (and money for paid APIs), and infinite retries never report anything.' },
          { text: 'Python allows only three retries', why: 'There is no such limit; the cap is your design choice.' },
        ],
        answer: 0,
        explain: 'A few tries with backoff, then raise an error the caller can see.',
      },
      {
        id: 'e2-6-7',
        type: 'spot-bug',
        prompt: 'This gives up on a 429 that it should retry. Which line is in the wrong place?',
        code: `c = sim.Client(schedule=[429, 200])
for attempt in range(3):
    r = c.get("/data")
    r.raise_for_status()
    if r.status_code != 429:
        break
    sim.sleep(2 ** attempt)`,
        error: 'HTTPStatusError: HTTP 429',
        answer: 3,
        lineWhy: {
          '0': 'The stand-in server answers 429 first, then 200.',
          '1': 'A bounded loop of attempts is right.',
          '2': 'Sending the request is right.',
          '4': 'Checking for 429 is the retry test; it never gets a chance to run.',
          '5': 'Stopping on success is right.',
          '6': 'Backing off is right; it is never reached.',
        },
        explain: 'Check for retryable codes first; call `raise_for_status()` only after the loop.',
      },
      {
        id: 'e2-6-8',
        type: 'run-code',
        prompt: 'Finish `retryable(s)`: True for the status codes 429 and every 5xx.',
        before: 'def retryable(s):',
        solution: '    return s == 429 or s >= 500',
        tests: [
          'for s in (429, 500, 502, 503, 504):',
          '    assert retryable(s), f"{s} should be retried"',
          'for s in (200, 201, 400, 401, 404):',
          '    assert not retryable(s), f"{s} should not be retried"',
        ].join('\n'),
        placeholder: '    return ...',
        explain: 'Indent the line: it is the body of `retryable`.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 'e2-07',
    title: 'Testing with a mock transport',
    summary: 'Tests swap the network for a handler that returns chosen responses, via transport=.',
    card: {
      title: 'Testing with a mock transport',
      text: 'Tests must not call the real network, which is slow, costs money and fails for reasons unrelated to your code. httpx\'s `MockTransport` takes a handler function that receives each request and returns a response you chose, and you pass it to the client as `transport=`. The stand-in here has the same shape: `sim.MockTransport(handler)` and `sim.Client(transport=...)`.',
      code: `def handler(request):
    if request.url.path == "/users/1":
        return sim.Response(
            200, json={"name": "Ada"})
    return sim.Response(404)

t = sim.MockTransport(handler)
c = sim.Client(transport=t)
print(c.get("/users/1").json())
print(c.get("/users/2").status_code)`,
      output: "{'name': 'Ada'}\n404",
    },
    exercises: [
      {
        id: 'e2-7-1',
        type: 'predict-output',
        prompt: 'The handler can count calls. What does this print?',
        code: `seen = []

def handler(request):
    seen.append(request.url.path)
    return sim.Response(200)

t = sim.MockTransport(handler)
c = sim.Client(transport=t)
c.get("/a")
c.get("/b")
print(seen)`,
        answer: "['/a', '/b']",
        options: [
          { text: "['/a', '/b']" },
          { text: "['/b']", why: 'The handler runs for every request, so both paths are recorded.' },
          { text: '[]', why: 'The client sends each request to the handler, which appends its path.' },
        ],
        explain: 'Recording requests lets a test check what your code actually sent.',
      },
      {
        id: 'e2-7-2',
        type: 'predict-output',
        prompt: 'A handler that fails twice, then succeeds. What does this print?',
        code: `replies = [503, 503, 200]

def handler(request):
    code = replies.pop(0)
    return sim.Response(code)

t = sim.MockTransport(handler)
c = sim.Client(transport=t)
codes = []
for _ in range(3):
    r = c.get("/x")
    codes.append(r.status_code)
print(codes)`,
        answer: '[503, 503, 200]',
        options: [
          { text: '[503, 503, 200]' },
          { text: '[503]', why: 'The loop makes three requests, and each pops the next reply.' },
          { text: '[200, 503, 503]', why: '`pop(0)` takes from the front, in the order written.' },
        ],
        explain: 'Exactly the scenario a retry test needs, with no real server.',
      },
      {
        id: 'e2-7-3',
        type: 'mcq',
        prompt: 'Why test your client against a mock transport instead of the real API?',
        options: [
          { text: 'Fast, free, repeatable, and failures can be staged' },
          { text: 'The real API cannot be called from Python', why: 'It can; but tests that use it are slow, flaky and cost money.' },
          { text: 'Mocks make the client code run faster in production', why: 'Mocks exist only in tests; production uses the real transport.' },
        ],
        answer: 0,
        explain: 'You can stage a 429 or a 503 on demand and check your retry logic.',
      },
      {
        id: 'e2-7-4',
        type: 'fill-blank',
        prompt: 'Plug the handler into the client.',
        code: `def handler(request):
    return sim.Response(204)

t = sim.MockTransport(handler)
c = sim.Client(___=t)
print(c.get("/x").status_code)`,
        answer: ['transport'],
        distractors: [
          { text: 'handler', why: 'The client takes the transport (which wraps the handler), as `transport=`.' },
          { text: 'body', why: '`body=` sets a canned body for the stand-in; it does not route requests to your handler.' },
        ],
        expectOutput: '204',
        explain: '`transport=` swaps the network for your handler, exactly as with httpx.',
      },
      {
        id: 'e2-7-5',
        type: 'predict-output',
        prompt: 'The handler looks at the method. What does this print?',
        code: `def handler(request):
    if request.method == "POST":
        return sim.Response(201)
    return sim.Response(200)

t = sim.MockTransport(handler)
c = sim.Client(transport=t)
print(c.post("/users").status_code)`,
        answer: '201',
        options: [
          { text: '201' },
          { text: '200', why: '`c.post` sends a POST, which the handler answers with 201 Created.' },
        ],
        explain: 'A handler can route on method, path and body, like a tiny fake server.',
      },
      {
        id: 'e2-7-6',
        type: 'spot-bug',
        prompt: 'The test crashes for "/users/2". Which line is missing something?',
        code: `def handler(request):
    if request.url.path == "/users/1":
        return sim.Response(200)

t = sim.MockTransport(handler)
c = sim.Client(transport=t)
print(c.get("/users/2").status_code)`,
        error: "AttributeError: 'NoneType' object has no attribute 'status_code'",
        answer: 2,
        raiseLine: 6,
        lineWhy: {
          '0': 'A handler takes the request: right.',
          '1': 'Checking the path is right.',
          '4': 'Wrapping the handler in a transport is right.',
          '5': 'Passing the transport to the client is right.',
          '6': 'Python points here, but the problem is that the handler returned nothing.',
        },
        explain: 'Every path through a handler must return a response: add `return sim.Response(404)` after the if.',
      },
      {
        id: 'e2-7-7',
        type: 'mcq',
        prompt: 'The mock answers 503, 503, 200. What should the test assert about your retrying client?',
        options: [
          { text: 'It got the 200 on the third call' },
          { text: 'It returned the first 503', why: 'That would mean it did not retry, which is the bug the test should catch.' },
          { text: 'The mock was called at least once', why: 'Too weak: a client that never retries also calls it once.' },
        ],
        answer: 0,
        explain: 'Assert the outcome and the number of calls: that pins down the behaviour.',
      },
      {
        id: 'e2-7-8',
        type: 'run-code',
        prompt: 'Finish the handler so every request gets a 503.',
        before: 'def handler(request):',
        solution: '    return sim.Response(503)',
        tests: [
          'c = sim.Client(transport=sim.MockTransport(handler))',
          'assert c.get("/a").status_code == 503, "every request should get 503"',
          'assert c.post("/b").status_code == 503, "posts too"',
        ].join('\n'),
        placeholder: '    return ...',
        explain: 'A handler that always fails is how you test the give-up path.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'e2-08',
    title: 'Checkpoint',
    checkpoint: true,
    summary: 'You can predict async order, set timeouts, use an async client, retry the right errors with backoff, and test with mocks.',
    card: {
      title: 'Checkpoint',
      text: 'Everything from this unit, mixed together. For each one, ask: what waits for what, what can fail, and what should happen when it does?',
    },
    exercises: [
      {
        id: 'e2-8-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `async def say(x):
    await asyncio.sleep(0.01)
    return x

async def main():
    a = await say("a")
    b, c = await asyncio.gather(
        say("b"), say("c"))
    print(a, b, c)

asyncio.run(main())`,
        answer: 'a b c',
        options: [
          { text: 'a b c' },
          { text: 'a c b', why: 'gather returns results in the order the coroutines were passed.' },
          { text: 'b c a', why: 'a is awaited first, before the gather even starts.' },
        ],
        explain: 'Sequential await first, then two at once; results keep their order.',
      },
      {
        id: 'e2-8-2',
        type: 'mcq',
        prompt: 'Which of these should a client retry?',
        options: [
          { text: '503 Service Unavailable' },
          { text: '401 Unauthorized (bad key)', why: 'A bad or missing key stays bad; retrying sends the same credentials.' },
          { text: '400 Bad Request (bad JSON)', why: 'The request itself is malformed and will fail again.' },
        ],
        answer: 0,
        explain: '429 and 5xx are worth retrying; other 4xx are not.',
      },
      {
        id: 'e2-8-3',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `async def main():
    try:
        await asyncio.wait_for(
            asyncio.sleep(1), 0.05)
        print("ok")
    except TimeoutError:
        print("timeout")
    print("after")

asyncio.run(main())`,
        answer: 'timeout\nafter',
        options: [
          { text: 'timeout\nafter' },
          { text: 'ok\nafter', why: 'The 1 s sleep is cut off at 0.05 s, so "ok" is skipped.' },
          { text: 'timeout', why: 'The error is caught, so the program carries on to "after".' },
        ],
        explain: 'Catching the timeout lets the program continue.',
      },
      {
        id: 'e2-8-4',
        type: 'fill-blank',
        prompt: 'Retry only the right errors.',
        code: `def retryable(s):
    return s == ___ or s >= 500

print(retryable(429), retryable(404))`,
        answer: ['429'],
        distractors: [
          { text: '404', why: 'A missing resource will not appear on retry; 404 is not retryable.' },
          { text: '200', why: '200 is success; there is nothing to retry.' },
        ],
        expectOutput: 'True False',
        explain: '429 says "slow down and try again"; 404 says "this does not exist".',
      },
      {
        id: 'e2-8-5',
        type: 'predict-output',
        prompt: 'Backoff on the virtual clock. What does this print?',
        code: `c = sim.Client(
    schedule=[500, 429, 200])
for attempt in range(5):
    r = c.get("/x")
    if r.status_code == 200:
        break
    sim.sleep(0.25 * 2 ** attempt)
print(len(c.calls), sim.clock.sleeps)`,
        answer: '3 [0.25, 0.5]',
        options: [
          { text: '3 [0.25, 0.5]' },
          { text: '5 [0.25, 0.5, 1.0, 2.0]', why: 'The third call succeeds and the loop breaks.' },
          { text: '3 [0.25, 0.25]', why: 'The wait doubles: 0.25, then 0.5.' },
        ],
        explain: 'Two failures, two growing waits, success on the third try.',
      },
      {
        id: 'e2-8-6',
        type: 'mcq',
        prompt: 'An async function makes 20 independent API calls one `await` at a time, taking 20 s in total. What helps most?',
        options: [
          { text: 'Run them together with asyncio.gather' },
          { text: 'Add a longer timeout to each call', why: 'A timeout limits waits; it does not make them overlap.' },
          { text: 'Retry each one twice when it is slow', why: 'Retries add calls; they do not speed up working ones.' },
        ],
        answer: 0,
        explain: 'Independent waits can overlap: total time drops towards the slowest single call.',
      },
      {
        id: 'e2-8-7',
        type: 'spot-bug',
        prompt: 'Which line is missing something?',
        code: `async def main():
    client = sim.AsyncClient()
    rs = await asyncio.gather(
        client.get("/a"),
        client.get("/b"))
    print(rs[0].json())
    print(rs[1].status_code.upper())

asyncio.run(main())`,
        error: "AttributeError: 'int' object has no attribute 'upper'",
        answer: 6,
        lineWhy: {
          '0': 'main is a proper coroutine function.',
          '1': 'One shared client is right.',
          '2': 'Awaiting gather is right.',
          '3': 'A request coroutine: right.',
          '4': 'Another request coroutine: right.',
          '5': 'Reading the first body is fine.',
          '8': 'Starting main is correct.',
        },
        explain: '`status_code` is an int; `.upper()` is a string method.',
      },
      {
        id: 'e2-8-8',
        type: 'predict-output',
        prompt: 'A mock that fails once. What does this print?',
        code: `replies = [500, 200]

def handler(request):
    code = replies.pop(0)
    return sim.Response(code)

t = sim.MockTransport(handler)
c = sim.Client(transport=t)
r = c.get("/x")
if r.status_code >= 500:
    r = c.get("/x")
print(r.status_code, len(c.calls))`,
        answer: '200 2',
        options: [
          { text: '200 2' },
          { text: '500 1', why: 'The 500 triggers one retry, which gets 200.' },
          { text: '200 1', why: 'Two requests were made: the failed one and the retry.' },
        ],
        explain: 'A staged failure proves the retry path runs.',
      },
      {
        id: 'e2-8-9',
        type: 'match-pairs',
        prompt: 'Match each tool to its job.',
        pairs: [
          { left: 'asyncio.gather', right: 'run calls together', why: 'Overlaps independent waits.' },
          { left: 'asyncio.wait_for', right: 'limit one wait', why: 'Cancels and raises TimeoutError.' },
          { left: 'exponential backoff', right: 'space out retries', why: 'Waits double after each failure.' },
          { left: 'MockTransport', right: 'fake the server in tests', why: 'A handler returns chosen responses.' },
        ],
        explain: 'The four tools behind a robust LLM client.',
      },
      {
        id: 'e2-8-10',
        type: 'run-code',
        prompt: 'Set `rs` to the results of getting "/a" and "/b" at the same time with the client `c`.',
        before: 'c = sim.AsyncClient()',
        solution: 'rs = await asyncio.gather(\n    c.get("/a"), c.get("/b"))',
        tests: [
          'assert len(rs) == 2, f"two responses, got {len(rs)}"',
          'assert [x["url"] for x in c.calls] == ["/a", "/b"], "request /a and /b"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'rs = await asyncio.gather(...)',
        explain: 'gather runs both requests together and returns both responses.',
      },
    ],
  },
];
