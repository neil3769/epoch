import { e2Labs } from '../labs/e2';
import { e2Library } from '../library/e2';
import type { Unit } from '../schema';
import { e2More } from './e2-more';

export const e2: Unit = {
  id: 'E2',
  track: 'engineering',
  title: 'Async and HTTP',
  blurb: 'Read async code, predict what runs when, and build a client with timeouts and retries.',
  prelude: 'import asyncio\nimport epoch_sim as sim',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'e2-01',
      title: 'Coroutines and await',
      summary: '`async def` makes a coroutine; `await` runs it and gives back its result.',
      card: {
        title: 'Coroutines and await',
        text: '`async def` makes a coroutine function: calling it gives you a coroutine object, not the result. `await` runs a coroutine and hands back its result. `asyncio.run(main())` starts the first one from ordinary code.',
        code: `import asyncio

async def double(x):
    return x * 2

async def main():
    y = await double(21)
    print(y)

asyncio.run(main())`,
        output: '42',
      },
      exercises: [
        {
          id: 'e2-1-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `async def greet():
    return "hi"

async def main():
    msg = await greet()
    print(msg)

asyncio.run(main())`,
          answer: 'hi',
          options: [
            { text: 'hi' },
            { text: 'coroutine', why: 'Calling `greet()` alone gives a coroutine, but `await` runs it and hands back "hi".' },
            { text: 'nothing', why: '`asyncio.run(main())` runs main, and main prints the awaited result.' },
          ],
          explain: '`await greet()` runs greet and gives back its return value.',
        },
        {
          id: 'e2-1-2',
          type: 'predict-output',
          prompt: 'The `await` is missing. What does this print?',
          code: `async def get_num():
    return 7

async def main():
    n = get_num()
    print(type(n).__name__)

asyncio.run(main())`,
          answer: 'coroutine',
          options: [
            { text: 'coroutine' },
            { text: 'int', why: 'Without `await`, `get_num()` never runs. You hold a coroutine object, not the 7 it would return.' },
            { text: '7', why: 'This prints the type of n, and n is the unrun coroutine, not 7.' },
          ],
          explain: 'Calling an async function only creates a coroutine. Forgetting `await` is the most common async bug.',
        },
        {
          id: 'e2-1-3',
          type: 'fill-blank',
          prompt: 'Make main a coroutine function that waits for fetch.',
          code: `async def fetch():
    return 200

___ def main():
    status = ___ fetch()
    print(status)

asyncio.run(main())`,
          answer: ['async', 'await'],
          distractors: [
            { text: 'def', why: '`def def` is not valid Python. The word before `def` marks the function as a coroutine: `async`.' },
            { text: 'return', why: '`return` ends a function and cannot go in front of `def` or inside an assignment.' },
          ],
          expectOutput: '200',
          explain: '`async def` lets main use `await`; `await fetch()` runs fetch and gives back 200.',
        },
        {
          id: 'e2-1-4',
          type: 'spot-bug',
          prompt: 'Which line needs fixing?',
          code: `async def load():
    return [1, 2]

def main():
    data = await load()
    print(data)`,
          error: "SyntaxError: 'await' outside async function",
          answer: 3,
          raiseLine: 4,
          lineWhy: {
            '0': 'load is a proper coroutine function.',
            '1': 'Returning a list from a coroutine is fine.',
            '4': 'Python points here, and `await load()` is what you want. The problem is the function it sits in.',
            '5': 'Printing is fine; this line is never reached.',
          },
          explain: '`await` is only allowed inside `async def`. Change line 4 to `async def main():`.',
        },
        {
          id: 'e2-1-5',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `async def step(name):
    print("start", name)
    return name

async def main():
    await step("a")
    await step("b")
    print("done")

asyncio.run(main())`,
          answer: 'start a\nstart b\ndone',
          options: [
            { text: 'start a\nstart b\ndone' },
            { text: 'start b\nstart a\ndone', why: 'Each `await` finishes before the next line runs, so they go in the order written.' },
            { text: 'done\nstart a\nstart b', why: '"done" is printed after both awaits, because each await waits for its step to finish.' },
          ],
          explain: 'An `await` waits for its coroutine to finish before moving on.',
        },
        {
          id: 'e2-1-6',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `async def add(a, b):
    return a + b

async def main():
    x = await add(1, 2)
    y = await add(x, 10)
    print(y)

asyncio.run(main())`,
          answer: '13',
          typedWrong: [{ answer: '3', why: 'That is x. y adds 10 to it.' }],
          explain: 'x is 3, then y is 3 + 10.',
        },
        {
          id: 'e2-1-7',
          type: 'mcq',
          prompt: 'Why do LLM clients use async code?',
          options: [
            { text: 'While one request waits, others can be sent or handled.' },
            { text: 'Async makes each request reach the server faster.', why: 'A single request takes just as long. Async helps by not sitting idle while it waits.' },
            { text: 'Async is required to send HTTP requests in Python.', why: 'Ordinary (sync) HTTP clients work fine. Async pays off when there are many requests waiting at once.' },
          ],
          answer: 0,
          explain: 'Most of an API call is waiting. Async uses that waiting time for other work.',
        },
        {
          id: 'e2-1-8',
          type: 'order-lines',
          prompt: 'Order the lines so the program prints "ok".',
          lines: [
            { text: 'async def fetch():', fixed: true },
            { text: '    return "ok"', fixed: true },
            { text: 'async def main():' },
            { text: '    r = await fetch()' },
            { text: '    print(r)' },
            { text: 'asyncio.run(main())' },
          ],
          expectOutput: 'ok',
          explain: 'Define main first, await before printing the result, and start everything with `asyncio.run` at the end.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'e2-02',
      title: 'One after another',
      summary: 'Awaiting one thing after another runs them in sequence, so the waits add up.',
      card: {
        title: 'One after another',
        text: '`await asyncio.sleep(1)` pauses this coroutine for one second, the way a network call waits for a reply. When you await one thing after another, each starts only after the one before has finished. So the waits add up.',
        code: `async def fetch(name, secs):
    await asyncio.sleep(secs)
    print("got", name)

async def main():
    await fetch("a", 0.2)
    await fetch("b", 0.1)

asyncio.run(main())`,
        output: 'got a\ngot b',
      },
      exercises: [
        {
          id: 'e2-2-1',
          type: 'predict-output',
          prompt: 'b waits less than a. What does this print?',
          code: `async def fetch(name, secs):
    await asyncio.sleep(secs)
    print("got", name)

async def main():
    await fetch("a", 0.3)
    await fetch("b", 0.1)

asyncio.run(main())`,
          answer: 'got a\ngot b',
          options: [
            { text: 'got a\ngot b' },
            { text: 'got b\ngot a', why: 'b is quicker, but it does not even start until `await fetch("a", 0.3)` has finished.' },
          ],
          explain: 'Awaited one after another, b starts only after a is done.',
        },
        {
          id: 'e2-2-2',
          type: 'mcq',
          prompt: 'main awaits `fetch("a", 1)` and then `fetch("b", 2)`, where each sleeps for its seconds. About how long does main take?',
          options: [
            { text: '3 seconds' },
            { text: '2 seconds', why: 'That would be true if they ran at the same time. Awaited one after another, the waits add: 1 + 2.' },
            { text: '1 second', why: 'b alone waits 2 seconds, and it only starts after a has waited 1.' },
          ],
          answer: 0,
          check: `import time

async def fetch(name, secs):
    await asyncio.sleep(secs)

async def main():
    await fetch("a", 0.1)
    await fetch("b", 0.2)

t0 = time.perf_counter()
await main()
elapsed = time.perf_counter() - t0
assert 0.28 < elapsed < 0.5, elapsed`,
          explain: 'In sequence, the waits add up: 1 + 2 = 3 seconds.',
        },
        {
          id: 'e2-2-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `async def task(name):
    print(name, "start")
    await asyncio.sleep(0.1)
    print(name, "end")

async def main():
    await task("x")
    await task("y")

asyncio.run(main())`,
          answer: 'x start\nx end\ny start\ny end',
          options: [
            { text: 'x start\nx end\ny start\ny end' },
            { text: 'x start\ny start\nx end\ny end', why: 'That would happen if both ran at the same time. Here `await task("x")` finishes completely before y starts.' },
            { text: 'x start\ny start\ny end\nx end', why: 'y cannot start until main reaches the second await, which happens only after x ends.' },
          ],
          explain: 'main is stuck on the first await until x has printed "end".',
        },
        {
          id: 'e2-2-4',
          type: 'fill-blank',
          prompt: 'Pause main for a tenth of a second without blocking.',
          code: `async def main():
    print("waiting")
    await ___(0.1)
    print("done")

asyncio.run(main())`,
          answer: ['asyncio.sleep'],
          distractors: [
            { text: 'time.sleep', why: '`time.sleep` blocks the whole program, so nothing else can run while it waits, and it cannot be awaited.' },
          ],
          expectOutput: 'waiting\ndone',
          explain: '`asyncio.sleep` pauses only this coroutine and lets others run meanwhile.',
        },
        {
          id: 'e2-2-5',
          type: 'predict-output',
          prompt: 'The second call needs the first one\'s result. What does this print?',
          code: `async def get(x):
    await asyncio.sleep(0.1)
    return x * 10

async def main():
    a = await get(1)
    b = await get(a)
    print(b)

asyncio.run(main())`,
          answer: '100',
          options: [
            { text: '100' },
            { text: '10', why: '10 is a. b is `get(10)`, which is 10 × 10.' },
            { text: '[10, 100]', why: 'Only b is printed, and it is a single number.' },
          ],
          explain: 'a = 10, then b = get(10) = 100. Here waiting in sequence is necessary: b needs a.',
        },
        {
          id: 'e2-2-6',
          type: 'mcq',
          prompt: 'Which pair of requests must run one after the other?',
          options: [
            { text: 'Fetch a user, then fetch that user\'s orders' },
            { text: 'Fetch the weather for Rome and for Paris', why: 'Neither needs the other\'s result, so they could run at the same time.' },
            { text: 'Translate two unrelated sentences', why: 'The two translations are independent, so they could run at the same time.' },
          ],
          answer: 0,
          explain: 'You need the user\'s id before you can ask for their orders.',
        },
        {
          id: 'e2-2-7',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `async def inner():
    print("inner")

async def outer():
    print("outer start")
    await inner()
    print("outer end")

asyncio.run(outer())`,
          answer: 'outer start\ninner\nouter end',
          options: [
            { text: 'outer start\ninner\nouter end' },
            { text: 'outer start\nouter end\ninner', why: '`await inner()` runs inner to the end before outer moves to its next line.' },
            { text: 'inner\nouter start\nouter end', why: 'inner only runs when outer reaches `await inner()`, after printing "outer start".' },
          ],
          explain: 'Lines run top to bottom; `await` runs the inner coroutine in full, then carries on.',
        },
        {
          id: 'e2-2-8',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `async def shout(msg):
    await asyncio.sleep(0.1)
    return msg.upper()

async def main():
    out = await shout("ok")
    print(out)

asyncio.run(main())`,
          answer: 'OK',
          typedWrong: [{ answer: 'ok', why: '`msg.upper()` returns the text in capitals, and that is what main prints.' }],
          explain: 'After the pause, shout returns "OK" and main prints it.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'e2-03',
      title: 'At the same time',
      summary: '`asyncio.gather` runs coroutines concurrently: total time is the longest wait, results in the order passed.',
      card: {
        title: 'At the same time',
        text: '`asyncio.gather(a(), b())` starts both coroutines and waits until both have finished. While one waits, the other runs, so the total time is the longest wait, not the sum. Results come back in the order you passed them, whichever finished first.',
        code: `async def fetch(name, secs):
    await asyncio.sleep(secs)
    print("got", name)
    return name

async def main():
    r = await asyncio.gather(
        fetch("a", 0.2),
        fetch("b", 0.1))
    print(r)

asyncio.run(main())`,
        output: "got b\ngot a\n['a', 'b']",
      },
      exercises: [
        {
          id: 'e2-3-1',
          type: 'predict-output',
          prompt: 'Both run at the same time. What does this print?',
          code: `async def fetch(name, secs):
    await asyncio.sleep(secs)
    print("got", name)

async def main():
    await asyncio.gather(
        fetch("a", 0.3),
        fetch("b", 0.1))

asyncio.run(main())`,
          answer: 'got b\ngot a',
          options: [
            { text: 'got b\ngot a' },
            { text: 'got a\ngot b', why: 'With gather both start together, so the shorter wait (b, 0.1 s) finishes first.' },
          ],
          explain: 'Both sleep at once; b wakes after 0.1 s, a after 0.3 s.',
        },
        {
          id: 'e2-3-2',
          type: 'predict-output',
          prompt: 'Same idea, now with return values. What does this print?',
          code: `async def fetch(name, secs):
    await asyncio.sleep(secs)
    return name

async def main():
    r = await asyncio.gather(
        fetch("a", 0.3),
        fetch("b", 0.1))
    print(r)

asyncio.run(main())`,
          answer: "['a', 'b']",
          options: [
            { text: "['a', 'b']" },
            { text: "['b', 'a']", why: 'b finishes first, but gather returns results in the order you passed the coroutines in.' },
            { text: "b", why: 'gather waits for all of them and returns a list of every result.' },
          ],
          explain: 'Results follow the order of the arguments, so you always know which is which.',
        },
        {
          id: 'e2-3-3',
          type: 'mcq',
          prompt: 'main gathers `fetch("a", 1)` and `fetch("b", 2)`. About how long does it take?',
          options: [
            { text: '2 seconds' },
            { text: '3 seconds', why: 'That is the sequential time. With gather the two waits overlap.' },
            { text: '1 second', why: 'gather waits until every coroutine has finished, and b needs 2 seconds.' },
          ],
          answer: 0,
          check: `import time

async def fetch(name, secs):
    await asyncio.sleep(secs)

t0 = time.perf_counter()
await asyncio.gather(fetch("a", 0.1), fetch("b", 0.2))
elapsed = time.perf_counter() - t0
assert 0.18 < elapsed < 0.28, elapsed`,
          explain: 'The waits overlap, so the total is the longest one: 2 seconds.',
        },
        {
          id: 'e2-3-4',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `async def job(n, secs):
    print("start", n)
    await asyncio.sleep(secs)
    print("end", n)

async def main():
    await asyncio.gather(
        job(1, 0.2), job(2, 0.1))

asyncio.run(main())`,
          answer: 'start 1\nstart 2\nend 2\nend 1',
          options: [
            { text: 'start 1\nstart 2\nend 2\nend 1' },
            { text: 'start 1\nend 1\nstart 2\nend 2', why: 'That is the sequential order. With gather, job 2 starts while job 1 is sleeping.' },
            { text: 'start 1\nstart 2\nend 1\nend 2', why: 'Both start at once, and job 2 sleeps for less time, so it ends first.' },
          ],
          explain: 'Both start immediately; the one with the shorter sleep ends first.',
        },
        {
          id: 'e2-3-5',
          type: 'fill-blank',
          prompt: 'Run both calls at the same time and collect their results.',
          code: `async def sq(x):
    await asyncio.sleep(0.1)
    return x * x

async def main():
    r = await asyncio.___(
        sq(1), sq(2))
    print(r)

asyncio.run(main())`,
          answer: ['gather'],
          distractors: [
            { text: 'sleep', why: '`asyncio.sleep` pauses for a number of seconds; it does not run other coroutines for you.' },
            { text: 'run', why: '`asyncio.run` starts the event loop from ordinary code. Inside a running coroutine it raises an error.' },
          ],
          expectOutput: '[1, 4]',
          explain: '`asyncio.gather` runs both and returns [1, 4] in the order passed.',
        },
        {
          id: 'e2-3-6',
          type: 'predict-output',
          prompt: 'square(3) waits longest. Type what this prints.',
          code: `async def square(x):
    await asyncio.sleep(0.1 * x)
    return x * x

async def main():
    r = await asyncio.gather(
        square(3), square(1))
    print(r)

asyncio.run(main())`,
          answer: '[9, 1]',
          typedWrong: [{ answer: '[1, 9]', why: 'square(1) finishes first, but gather keeps the order you passed: square(3) first.' }],
          explain: 'Results come back in argument order: [9, 1].',
        },
        {
          id: 'e2-3-7',
          type: 'mcq',
          prompt: 'Which of these is a good fit for `asyncio.gather`?',
          options: [
            { text: 'Score 20 test questions with an LLM, each independent' },
            { text: 'Fetch a user, then fetch that user\'s orders', why: 'The second request needs the first one\'s result, so they must run in sequence.' },
            { text: 'Ask an LLM a question, then ask it to shorten its own answer', why: 'The second call needs the first answer, so it cannot start early.' },
          ],
          answer: 0,
          explain: 'gather pays off when the calls do not depend on each other.',
        },
        {
          id: 'e2-3-8',
          type: 'spot-bug',
          prompt: 'Which line needs fixing?',
          code: `async def ping():
    await asyncio.sleep(0.1)
    return "pong"

async def main():
    r = await asyncio.gather(
        ping, ping)
    print(r)

asyncio.run(main())`,
          error: 'TypeError: An asyncio.Future, a coroutine or an awaitable is required',
          answer: 6,
          raiseLine: 5,
          lineWhy: {
            '0': 'ping is a proper coroutine function.',
            '1': 'Sleeping inside a coroutine is fine.',
            '2': 'Returning a value from a coroutine is fine.',
            '4': 'main is a proper coroutine function.',
            '5': 'Python points at the start of the gather call, and gather is the right tool. What you pass to it is wrong.',
            '7': 'Python never gets here: the line before raises.',
            '9': 'Starting main with `asyncio.run` is correct.',
          },
          explain: '`ping` is the function; `ping()` is the coroutine. gather needs coroutines: `gather(ping(), ping())`.',
        },
      ],
    },
    ...e2More,
  ],
  labs: e2Labs,
  library: e2Library,
};
