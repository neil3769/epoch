import { e9Labs } from '../labs/e9';
import { e9Library } from '../library/e9';
import type { Unit } from '../schema';

/*
 * E9 Cost, latency, observability (plan weeks 11-12). Cost per request,
 * p50 vs p95, traces and spans, what to log, routing to a small model first,
 * caching, before/after tables, checkpoint.
 *
 * Uses the simulated services: LOGS (40 past requests), PRICES
 * (made-up euros per million tokens), FakeLLM (its calls move sim.clock on
 * by its latency). The prelude's span(name) is a tiny tracer on that clock:
 * it appends (name, seconds) to SPANS, the way OpenTelemetry records spans.
 * chat(llm, q, model) sends one question and returns the reply text;
 * LOGS and PRICES are short names for sim.LOGS and sim.PRICES.
 */
const PRELUDE = `import contextlib
import json
import numpy as np
import epoch_sim as sim

LOGS, PRICES = sim.LOGS, sim.PRICES
SPANS = []

def chat(llm, q, model="model-small"):
    r = llm.messages.create(
        model=model, max_tokens=100,
        messages=[{"role": "user",
                   "content": q}])
    return r.content[0].text

@contextlib.contextmanager
def span(name):
    t0 = sim.clock.time()
    try:
        yield
    finally:
        dt = sim.clock.time() - t0
        SPANS.append((name, round(dt, 2)))`;

export const e9: Unit = {
  id: 'E9',
  track: 'engineering',
  title: 'Cost, latency, observability',
  blurb: 'Cost per request from token counts, p50 against p95, traces and spans, what to log, routing to a small model first, caching, and before/after tables.',
  prelude: PRELUDE,
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'e9-01',
      title: 'Cost per request',
      summary: 'Cost = input tokens × input price + output tokens × output price, read from each response\'s usage.',
      card: {
        title: 'Cost per request',
        text: 'Every response reports its token usage, and a model has one price per million input tokens and a higher one for output. Cost per request is input × input price plus output × output price; multiply by requests per day for the bill. Here `PRICES` holds made-up prices in euros per million tokens.',
        code: `pin, pout = PRICES["model-small"]
tin, tout = 1_000, 200
cost = (tin * pin + tout * pout) / 1e6
print(cost)`,
        output: '0.0005',
      },
      exercises: [
        {
          id: 'e9-1-1',
          type: 'predict-output',
          prompt: 'The same request on the large model. Type what this prints.',
          code: `pin, pout = PRICES["model-large"]
tin, tout = 1_000, 200
cost = (tin * pin + tout * pout) / 1e6
print(cost)`,
          answer: '0.006',
          typedWrong: [{ answer: '0.0005', why: 'That was the small model; the large one costs 12 times as much here.' }],
          explain: '1,000 × 3 + 200 × 15 = 6,000 per million: €0.006.',
        },
        {
          id: 'e9-1-2',
          type: 'mcq',
          prompt: 'Why do long answers cost more than long questions?',
          options: [
            { text: 'Output tokens cost several times more' },
            { text: 'Long answers use a bigger model', why: 'Same model; output tokens are simply priced higher.' },
            { text: 'They do not: tokens are tokens', why: 'Input and output have separate prices; here 5× apart.' },
          ],
          answer: 0,
          explain: 'Capping max_tokens and asking for short answers saves money.',
        },
        {
          id: 'e9-1-3',
          type: 'predict-output',
          prompt: 'Read the usage from a reply. What does this print?',
          code: `c = sim.FakeLLM(script=["Paris."])
q = "Capital of France?"
r = c.messages.create(
    model="model-small",
    max_tokens=50,
    messages=[{"role": "user",
               "content": q}])
u = r.usage
print(u.input_tokens, u.output_tokens)`,
          answer: '5 2',
          options: [
            { text: '5 2' },
            { text: '2 5', why: 'The question is the input; "Paris." is the shorter output.' },
            { text: '0 0', why: 'Every response reports the tokens it used.' },
          ],
          explain: 'Log these two numbers for every call.',
        },
        {
          id: 'e9-1-4',
          type: 'run-code',
          prompt: 'Set `cost` to the cost in euros of the first logged request, `r`.',
          before: `r = LOGS[0]
pin, pout = PRICES[r["model"]]`,
          solution: `a = r["input_tokens"] * pin
b = r["output_tokens"] * pout
cost = (a + b) / 1e6`,
          tests: 'assert abs(cost - (1316 * 0.25 + 233 * 1.25) / 1e6) < 1e-12, f"1316 × 0.25 + 233 × 1.25, per million; got {cost}"',
          maxLines: 3,
          placeholder: 'cost = ...',
          explain: 'Prices are per million tokens: divide by 1e6.',
        },
        {
          id: 'e9-1-5',
          type: 'predict-output',
          prompt: 'All 40 logged requests. Type the total cost, rounded to 4 places.',
          code: `def cost(r):
    pin, pout = PRICES[r["model"]]
    a = r["input_tokens"] * pin
    b = r["output_tokens"] * pout
    return (a + b) / 1e6

total = sum(map(cost, LOGS))
print(round(total, 4))`,
          answer: '0.066',
          typedWrong: [{ answer: '66.0', why: 'Prices are per million tokens: divide by 1e6.' }],
          explain: 'About 6.6 cents for 40 requests.',
        },
        {
          id: 'e9-1-6',
          type: 'predict-output',
          prompt: 'How much of that came from the 6 large-model requests? Type the share, rounded to 2 places.',
          code: `def cost(r):
    pin, pout = PRICES[r["model"]]
    a = r["input_tokens"] * pin
    b = r["output_tokens"] * pout
    return (a + b) / 1e6

total = sum(map(cost, LOGS))
big = sum(cost(r) for r in LOGS
          if "large" in r["model"])
print(round(big / total, 2))`,
          answer: '0.69',
          typedWrong: [{ answer: '0.15', why: '6 of 40 requests is 15%, but each large request costs about 12 times more.' }],
          explain: 'A few expensive requests dominate: where routing saves most.',
        },
        {
          id: 'e9-1-7',
          type: 'mcq',
          prompt: 'Costs doubled this week with the same traffic. First thing to check?',
          options: [
            { text: 'Tokens per request' },
            { text: 'The server\'s CPU usage', why: 'The bill is per token; CPU barely matters.' },
            { text: 'The number of users', why: 'Traffic was the same; cost per request changed.' },
          ],
          answer: 0,
          explain: 'A longer prompt or chattier answers show up in usage logs at once.',
        },
        {
          id: 'e9-1-8',
          type: 'fill-blank',
          prompt: 'Cost per day.',
          code: `per_request = 0.0005
requests = 40_000
daily = per_request ___ requests
print(round(daily, 2))`,
          answer: ['*'],
          distractors: [
            { text: '+', why: 'Each request costs per_request: multiply.' },
            { text: '/', why: 'That is cost per request divided by traffic.' },
          ],
          expectOutput: '20.0',
          explain: '€20 a day, €600 a month: say the monthly number in reviews.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'e9-02',
      title: 'p50 and p95',
      summary: 'p50 is the typical request, p95 the slow tail; report both, never only the mean.',
      card: {
        title: 'p50 and p95',
        text: 'The median latency, p50, is what a typical request takes; p95 is the time that 95% of requests beat, the slow tail users remember. A few very slow requests barely move p50 but set p95, and the mean blurs both. Report p50 and p95 together.',
        code: `lat = [r["latency_ms"] for r in LOGS]
p = np.percentile(lat, [50, 95])
print(round(p[0]), round(p[1]))`,
        output: '722 2000',
      },
      exercises: [
        {
          id: 'e9-2-1',
          type: 'predict-output',
          prompt: 'Ten latencies (ms). What does this print?',
          code: `lat = [100, 110, 120, 120, 130,
       140, 150, 160, 900, 1000]
print(np.median(lat), np.mean(lat))`,
          answer: '135.0 293.0',
          options: [
            { text: '135.0 293.0' },
            { text: '293.0 135.0', why: 'The median is the middle value; the mean is pulled up by 900 and 1000.' },
            { text: '135.0 135.0', why: 'The two slow requests raise the mean a lot.' },
          ],
          explain: 'The mean says 293 ms, but no request took about that long.',
        },
        {
          id: 'e9-2-2',
          type: 'mcq',
          prompt: 'p50 is 700 ms and p95 is 2,000 ms. What does that mean?',
          options: [
            { text: '1 in 20 requests takes 2 s or more' },
            { text: 'The average request takes 2 s', why: 'p95 is the tail, not the average.' },
            { text: '95% of requests take 2 s', why: '95% are faster than 2 s.' },
          ],
          answer: 0,
          explain: 'At 1,000 requests an hour, that is 50 slow ones.',
        },
        {
          id: 'e9-2-3',
          type: 'fill-blank',
          prompt: 'Compute p95.',
          code: `lat = [r["latency_ms"] for r in LOGS]
print(round(np.percentile(lat, ___)))`,
          answer: ['95'],
          distractors: [
            { text: '0.95', why: 'np.percentile takes 0 to 100.' },
            { text: '50', why: 'That is p50, the median.' },
          ],
          expectOutput: '2000',
          explain: 'np.quantile(lat, 0.95) is the same.',
        },
        {
          id: 'e9-2-4',
          type: 'predict-output',
          prompt: 'Which requests are in the slow tail? What does this print?',
          code: `lat = [r["latency_ms"] for r in LOGS]
p95 = np.percentile(lat, 95)
slow = [r["request_id"]
        for r in LOGS
        if r["latency_ms"] > p95]
print(slow)`,
          answer: "['r06', 'r23']",
          options: [
            { text: "['r06', 'r23']" },
            { text: '[]', why: 'Two requests are above p95: 5% of 40.' },
            { text: "['r00']", why: 'r00 took 838 ms, a typical request.' },
          ],
          explain: 'Open those two traces next: what was slow inside them?',
        },
        {
          id: 'e9-2-5',
          type: 'mcq',
          prompt: 'Users say the chat "feels slow", but p95 to the full answer is fine. What do you measure?',
          options: [
            { text: 'Time to first token' },
            { text: 'Total tokens per day', why: 'That is cost, not felt speed.' },
            { text: 'p50 of the full answer', why: 'With streaming, the felt wait is until the first words.' },
          ],
          answer: 0,
          explain: 'Streaming users judge speed by when text starts appearing.',
        },
        {
          id: 'e9-2-6',
          type: 'run-code',
          prompt: 'Set `p50` and `p95` to the median and 95th percentile of `lat`.',
          before: 'lat = [r["latency_ms"] for r in LOGS]',
          solution: 'p50, p95 = np.percentile(\n    lat, [50, 95])',
          maxLines: 2,
          tests: 'assert round(p50) == 722 and round(p95) == 2000, f"expected about 722 and 2000; got {p50}, {p95}"',
          placeholder: 'p50, p95 = ...',
          explain: 'np.percentile takes a list of percentiles too.',
        },
        {
          id: 'e9-2-7',
          type: 'predict-output',
          prompt: 'Large-model requests only. Type their median latency (ms).',
          code: `lat = [r["latency_ms"] for r in LOGS
       if r["model"] == "model-large"]
print(round(np.median(lat)))`,
          answer: '1451',
          typedWrong: [{ answer: '722', why: 'That is everyone; the large model adds about 800 ms here.' }],
          explain: 'Break latency down by model before deciding what to fix.',
        },
        {
          id: 'e9-2-8',
          type: 'mcq',
          prompt: 'Why not report the mean latency?',
          options: [
            { text: 'Outliers drag it about' },
            { text: 'It is hard to compute', why: 'It is one line; it just misleads.' },
            { text: 'It is always lower than p50', why: 'With a slow tail it is usually higher.' },
          ],
          answer: 0,
          explain: 'p50 for typical, p95 (or p99) for the tail.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'e9-03',
      title: 'Traces and spans',
      summary: 'A trace is one request; spans time its stages, so you can see which stage was slow.',
      card: {
        title: 'Traces and spans',
        text: 'A trace follows one request through your system, and each stage inside it (retrieval, the model call, a tool) is a span with a start and a duration. When p95 is bad, open a slow trace and look for the longest span. Here `with span("name"):` records a span on the simulated clock, as OpenTelemetry would, and `chat(llm, q)` sends one question.',
        code: `llm = sim.FakeLLM(latency=1.2)
with span("request"):
    with span("retrieve"):
        sim.clock.advance(0.3)
    with span("llm"):
        chat(llm, "hi")
for name, secs in SPANS:
    print(name, secs)`,
        output: 'retrieve 0.3\nllm 1.2\nrequest 1.5',
      },
      exercises: [
        {
          id: 'e9-3-1',
          type: 'mcq',
          prompt: 'The spans above: which stage would you speed up first?',
          options: [
            { text: 'The model call: 1.2 of 1.5 s' },
            { text: 'Retrieval: it runs first', why: 'Order does not matter; the llm span is four times longer.' },
            { text: 'The request span itself', why: 'It is the total; it contains the other two.' },
          ],
          answer: 0,
          explain: 'Fix the biggest span first: a smaller model, fewer tokens, or streaming.',
        },
        {
          id: 'e9-3-2',
          type: 'predict-output',
          prompt: 'Two tool calls in a row. What does this print?',
          code: `with span("request"):
    with span("tool_a"):
        sim.clock.advance(0.5)
    with span("tool_b"):
        sim.clock.advance(0.7)
print(SPANS[-1])`,
          answer: "('request', 1.2)",
          options: [
            { text: "('request', 1.2)" },
            { text: "('tool_b', 0.7)", why: 'The outer span closes last, so it is appended last.' },
            { text: "('request', 0.7)", why: 'The request span covers both tools: 0.5 + 0.7.' },
          ],
          explain: 'In a row, durations add up.',
        },
        {
          id: 'e9-3-3',
          type: 'mcq',
          prompt: 'tool_a and tool_b do not depend on each other. How do you shorten the request?',
          options: [
            { text: 'Run them at the same time' },
            { text: 'Run tool_b first', why: 'Reordering does not change the total of a sequence.' },
            { text: 'Add a span around both', why: 'Measuring changes nothing; overlapping them does.' },
          ],
          answer: 0,
          explain: 'With asyncio.gather the request takes about max(0.5, 0.7) = 0.7 s.',
        },
        {
          id: 'e9-3-4',
          type: 'run-code',
          prompt: 'Set `slowest` to the name of the longest span in `SPANS`, ignoring "request".',
          before: `with span("request"):
    with span("retrieve"):
        sim.clock.advance(0.2)
    with span("rerank"):
        sim.clock.advance(0.9)
    with span("llm"):
        sim.clock.advance(0.6)`,
          solution: `inner = [s for s in SPANS
         if s[0] != "request"]
best = max(inner, key=lambda s: s[1])
slowest = best[0]`,
          tests: 'assert slowest == "rerank", f"rerank took 0.9 s; got {slowest!r}"',
          maxLines: 2,
          placeholder: 'slowest = ...',
          explain: 'A slow reranker is a common surprise: try a smaller one, or fewer candidates.',
        },
        {
          id: 'e9-3-5',
          type: 'predict-output',
          prompt: 'The model call made a tool request, then answered. Type how many spans are recorded.',
          code: `llm = sim.FakeLLM(latency=0.8)
with span("request"):
    for i in range(2):
        with span(f"llm_{i}"):
            chat(llm, "x")
print(len(SPANS))`,
          answer: '3',
          typedWrong: [{ answer: '2', why: 'Two llm spans plus the request span around them.' }],
          explain: 'Agent loops make one span per step: count them to find runaway loops.',
        },
        {
          id: 'e9-3-6',
          type: 'mcq',
          prompt: 'What does a trace give you that a single latency number does not?',
          options: [
            { text: 'Where the time went' },
            { text: 'A lower latency', why: 'It measures; it does not speed anything up.' },
            { text: 'The answer\'s quality', why: 'Quality needs evals; traces show time and flow.' },
          ],
          answer: 0,
          explain: 'Record inputs, outputs and token counts on spans too, to debug bad answers.',
        },
        {
          id: 'e9-3-7',
          type: 'fill-blank',
          prompt: 'Time the retrieval stage.',
          code: `with ___("retrieve"):
    sim.clock.advance(0.4)
print(SPANS)`,
          answer: ['span'],
          distractors: [
            { text: 'print', why: 'print is not a context manager: it cannot time a block.' },
            { text: 'sim.sleep', why: 'That waits; it records nothing.' },
          ],
          expectOutput: "[('retrieve', 0.4)]",
          explain: 'One with-block per stage.',
        },
        {
          id: 'e9-3-8',
          type: 'mcq',
          prompt: 'A slow trace shows the LLM span waited 3 s before its first token. Likely causes?',
          options: [
            { text: 'A long prompt or busy provider' },
            { text: 'Too many spans', why: 'Recording spans costs microseconds.' },
            { text: 'The answer was too short', why: 'Short answers finish sooner, not later.' },
          ],
          answer: 0,
          explain: 'Time to first token grows with prompt length; a provider\'s load adds to it.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'e9-04',
      title: 'What to log',
      summary: 'One structured record per request: id, model, tokens, cost, latency, status. Never secrets or raw personal data.',
      card: {
        title: 'What to log',
        text: 'Log one structured record per request: a request id, the model, input and output tokens, cost, latency and whether it succeeded. Structured (JSON) records can be counted and filtered, which free-text lines cannot. Never log secrets, and avoid raw personal data.',
        code: `rec = {"request_id": "r41",
       "model": "model-small",
       "input_tokens": 812,
       "output_tokens": 95,
       "latency_ms": 640, "ok": True}
print(json.dumps(rec)[:31])`,
        output: '{"request_id": "r41", "model":',
      },
      exercises: [
        {
          id: 'e9-4-1',
          type: 'predict-output',
          prompt: 'Error rate from the logs. Type what this prints.',
          code: `bad = sum(not r["ok"] for r in LOGS)
print(bad, bad / len(LOGS))`,
          answer: '2 0.05',
          typedWrong: [{ answer: '38 0.95', why: 'not r["ok"] counts the failures: 2 of 40.' }],
          explain: 'Alert when the error rate jumps, not on single failures.',
        },
        {
          id: 'e9-4-2',
          type: 'mcq',
          prompt: 'Why a request id in every record?',
          options: [
            { text: 'To find one request\'s trace' },
            { text: 'To count the number of users', why: 'One user makes many requests; ids identify requests.' },
            { text: 'Providers require it', why: 'It is for your own debugging.' },
          ],
          answer: 0,
          explain: 'A user reports a bad answer; the id finds its trace and inputs.',
        },
        {
          id: 'e9-4-3',
          type: 'spot-bug',
          prompt: 'Which line should not be logged as it is?',
          code: `rec = {"request_id": "r41",
       "model": "model-small",
       "api_key": "sk-test-9",
       "latency_ms": 640}
assert "api_key" not in rec, "secret"`,
          error: 'AssertionError: secret',
          answer: 2,
          raiseLine: 4,
          lineWhy: {
            '0': 'Request ids belong in every record.',
            '1': 'The model name explains cost and latency.',
            '3': 'Latency is exactly what logs are for.',
            '4': 'The check is right.',
          },
          explain: 'Keys in logs end up in dashboards, exports and other people\'s hands.',
        },
        {
          id: 'e9-4-4',
          type: 'predict-output',
          prompt: 'Requests per model. What does this print?',
          code: `from collections import Counter
n = Counter(r["model"] for r in LOGS)
print(n["model-small"],
      n["model-large"])`,
          answer: '34 6',
          options: [
            { text: '34 6' },
            { text: '6 34', why: 'Most requests go to the small model.' },
            { text: '40 40', why: 'Each request used one model.' },
          ],
          explain: 'Group by model before averaging anything.',
        },
        {
          id: 'e9-4-5',
          type: 'mcq',
          prompt: 'Should you log full prompts and answers?',
          options: [
            { text: 'Only redacted, for a limited time' },
            { text: 'Always: more data is better', why: 'Prompts hold personal data; storing all of it is a liability.' },
            { text: 'Never: they are useless', why: 'They are invaluable for debugging; handle them carefully.' },
          ],
          answer: 0,
          explain: 'Sample, redact, limit access and delete after a set time.',
        },
        {
          id: 'e9-4-6',
          type: 'run-code',
          prompt: 'Set `tokens` to the total input plus output tokens over all of `LOGS`.',
          solution: 'tokens = sum(r["input_tokens"]\n             + r["output_tokens"]\n             for r in LOGS)',
          tests: 'want = sum(r["input_tokens"] + r["output_tokens"] for r in LOGS)\nassert tokens == want, f"expected {want}; got {tokens}"',
          maxLines: 3,
          placeholder: 'tokens = ...',
          explain: 'A generator inside sum: no list needed.',
        },
        {
          id: 'e9-4-7',
          type: 'fill-blank',
          prompt: 'Keep only the failed requests.',
          code: `failed = [r["request_id"]
          for r in LOGS
          if ___ r["ok"]]
print(failed)`,
          answer: ['not'],
          distractors: [
            { text: 'is', why: 'That is not valid Python here.' },
            { text: 'True ==', why: 'That keeps the successes.' },
          ],
          expectOutput: "['r11', 'r30']",
          explain: 'Then open those two traces.',
        },
        {
          id: 'e9-4-8',
          type: 'mcq',
          prompt: 'Logs say "error" 300 times today, with no other fields. What is missing?',
          options: [
            { text: 'Structured fields' },
            { text: 'More log lines, as text', why: 'More unstructured lines are still unsearchable.' },
            { text: 'Nothing: errors are counted', why: 'You cannot tell which model, prompt or user failed.' },
          ],
          answer: 0,
          explain: 'Structured fields turn logs into answers.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'e9-05',
      title: 'Routing to a small model first',
      summary: 'Send requests to a small model, check the result, and escalate only the ones it gets wrong.',
      card: {
        title: 'Routing to a small model first',
        text: 'Most requests are easy, so send them to a small, cheap, fast model and escalate to the large one only when needed: by a rule (long or hard questions), or by checking the small model\'s answer and retrying the failures. The saving is large if the check is reliable; measure quality on your golden set before and after.',
        code: `small, large = 0.0005, 0.006
escalated = 0.15
cost = small + escalated * large
print(round(cost / large, 2))`,
        output: '0.23',
      },
      exercises: [
        {
          id: 'e9-5-1',
          type: 'predict-output',
          prompt: 'Half the requests escalate. Type the cost relative to always using the large model.',
          code: `small, large = 0.0005, 0.006
cost = small + 0.5 * large
print(round(cost / large, 2))`,
          answer: '0.58',
          typedWrong: [{ answer: '0.5', why: 'Every request also pays for the small model\'s try.' }],
          explain: 'Routing only pays while most requests stay small.',
        },
        {
          id: 'e9-5-2',
          type: 'mcq',
          prompt: 'How do you know when to escalate?',
          options: [
            { text: 'A check on the small model\'s answer' },
            { text: 'Escalate at random', why: 'Random escalation spends money on easy requests.' },
            { text: 'Ask the small model if it is sure', why: 'Self-reported confidence is unreliable; check the output.' },
          ],
          answer: 0,
          explain: 'Schema validation, a citation check, a test passing: something code can verify.',
        },
        {
          id: 'e9-5-3',
          type: 'predict-output',
          prompt: 'A cascade: the small model\'s answer fails validation. What does this print?',
          code: `small = sim.FakeLLM(["not json"])
large = sim.FakeLLM(['{"n": 3}'])
out = chat(small, "count")
try:
    data = json.loads(out)
    used = "small"
except json.JSONDecodeError:
    out = chat(large, "count",
               "model-large")
    data = json.loads(out)
    used = "large"
print(used, data)`,
          answer: "large {'n': 3}",
          options: [
            { text: "large {'n': 3}" },
            { text: "small {'n': 3}", why: '"not json" fails json.loads, so the large model is asked.' },
            { text: 'small not json', why: 'The parse fails and the except branch runs.' },
          ],
          explain: 'Validation decides; the user never sees the failed try.',
        },
        {
          id: 'e9-5-4',
          type: 'mcq',
          prompt: 'Routing cut cost by 60%. What else must the before/after table show?',
          options: [
            { text: 'Quality on the golden set' },
            { text: 'Only cost: that was the goal', why: 'A cheaper wrong answer is not an improvement.' },
            { text: 'The number of routing rules', why: 'Outcomes matter: cost, latency and quality.' },
          ],
          answer: 0,
          explain: 'And latency: escalated requests pay for two calls.',
        },
        {
          id: 'e9-5-5',
          type: 'run-code',
          prompt: 'Set `cost` to the average cost per request when a share `e` of requests escalate.',
          before: `small, large = 0.0005, 0.006
e = 0.2`,
          solution: 'cost = small + e * large',
          tests: 'assert abs(cost - 0.0017) < 1e-12, f"0.0005 + 0.2 × 0.006 = 0.0017; got {cost}"',
          placeholder: 'cost = ...',
          explain: 'Every request pays small; a share e also pays large.',
        },
        {
          id: 'e9-5-6',
          type: 'predict-output',
          prompt: 'Escalated requests make two calls. Type the mean latency (s).',
          code: `t_small, t_large = 0.6, 1.8
e = 0.2
t = t_small + e * t_large
print(round(t, 2))`,
          answer: '0.96',
          typedWrong: [{ answer: '0.6', why: 'The 20% that escalate wait for both calls.' }],
          explain: 'Faster than always-large (1.8 s) on average, but escalated requests are slower than before.',
        },
        {
          id: 'e9-5-7',
          type: 'fill-blank',
          prompt: 'Route long questions straight to the large model.',
          code: `def pick(question):
    if len(question.split()) ___ 50:
        return "model-large"
    return "model-small"

print(pick("short one"),
      pick("w " * 60))`,
          answer: ['>'],
          distractors: [
            { text: '<', why: 'That sends short questions to the large model.' },
            { text: '==', why: 'Only exactly 50 words would escalate.' },
          ],
          expectOutput: 'model-small model-large',
          explain: 'A rule up front saves the wasted small try.',
        },
        {
          id: 'e9-5-8',
          type: 'mcq',
          prompt: 'When is routing not worth it?',
          options: [
            { text: 'When most need the large model' },
            { text: 'When requests are cheap anyway', why: 'Cheap requests still add up at scale; check the numbers.' },
            { text: 'When there is a golden set', why: 'A golden set is how you check routing works.' },
          ],
          answer: 0,
          explain: 'Then nearly every request pays twice.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'e9-06',
      title: 'Caching',
      summary: 'Store answers by a normalised key; a hit costs nothing and returns at once. Expire entries that go stale.',
      card: {
        title: 'Caching',
        text: 'If the same question comes back, return the stored answer: no model call, no cost, almost no latency. Key the cache on everything that changes the answer (normalised question, model, prompt version), and expire entries that can go stale. Providers also cache long repeated prompt prefixes for you, at a discount.',
        code: `cache = {}
llm = sim.FakeLLM(script=["Paris."])

def ask(q):
    key = q.strip().lower()
    if key not in cache:
        r = llm.messages.create(
            model="model-small",
            max_tokens=20,
            messages=[{"role": "user",
                       "content": q}])
        cache[key] = r.content[0].text
    return cache[key]

ask("Capital of France?")
ask("capital of france? ")
print(len(llm.calls))`,
        output: '1',
      },
      exercises: [
        {
          id: 'e9-6-1',
          type: 'predict-output',
          prompt: 'Without normalising the key. Type how many model calls are made.',
          code: `cache = {}
llm = sim.FakeLLM()

def ask(q):
    if q not in cache:
        cache[q] = chat(llm, q)
    return cache[q]

for q in ["Hi?", "hi?", "Hi?"]:
    ask(q)
print(len(llm.calls))`,
          answer: '2',
          typedWrong: [{ answer: '1', why: '"Hi?" and "hi?" are different keys without .lower().' }],
          explain: 'Normalise case and spaces so trivially different questions share an entry.',
        },
        {
          id: 'e9-6-2',
          type: 'predict-output',
          prompt: 'Type the hit rate.',
          code: `hits, misses = 0, 0
seen = set()
for q in ["a", "b", "a", "a", "c"]:
    if q in seen:
        hits += 1
    else:
        misses += 1
        seen.add(q)
print(hits / (hits + misses))`,
          answer: '0.4',
          typedWrong: [{ answer: '0.6', why: 'a, b and c miss the first time; only the two repeats of a hit.' }],
          explain: 'Measure the hit rate on real traffic before building a cache.',
        },
        {
          id: 'e9-6-3',
          type: 'mcq',
          prompt: 'You change the system prompt. What happens to the cache?',
          options: [
            { text: 'Old entries go stale' },
            { text: 'Nothing: the questions are the same', why: 'A new prompt can change every answer.' },
            { text: 'It gets faster', why: 'It gets stale; put the prompt version in the key.' },
          ],
          answer: 0,
          explain: 'Key on everything that changes the answer.',
        },
        {
          id: 'e9-6-4',
          type: 'mcq',
          prompt: 'Which requests should not be cached?',
          options: [
            { text: 'Live data, like order status' },
            { text: 'Common questions from the FAQ', why: 'Those are the best case for a cache.' },
            { text: 'Expensive questions', why: 'Expensive repeats are where caching saves most.' },
          ],
          answer: 0,
          explain: 'Or cache them briefly, with a short expiry.',
        },
        {
          id: 'e9-6-5',
          type: 'fill-blank',
          prompt: 'Normalise the cache key.',
          code: `def key(q):
    return q.strip().___()

print(key("  Refund Policy?"))`,
          answer: ['lower'],
          distractors: [
            { text: 'upper', why: 'Also consistent, but this prints the lower-case form.' },
            { text: 'title', why: 'That capitalises each word: still varies with input.' },
          ],
          expectOutput: 'refund policy?',
          explain: 'Lower case and trimmed spaces.',
        },
        {
          id: 'e9-6-6',
          type: 'run-code',
          prompt: 'Set `saved` to the euros saved per day by the cache.',
          before: `requests = 10_000
hit_rate = 0.3
per_call = 0.002`,
          solution: 'saved = requests * hit_rate * per_call',
          tests: 'assert abs(saved - 6) < 1e-9, f"3,000 hits × €0.002 = €6; got {saved}"',
          placeholder: 'saved = ...',
          explain: 'Each hit is one call not made.',
        },
        {
          id: 'e9-6-7',
          type: 'mcq',
          prompt: 'A "semantic" cache matches questions with similar meaning. The risk?',
          options: [
            { text: 'Close questions, different answers' },
            { text: 'It is too slow to be useful', why: 'An embedding lookup is fast; the risk is wrong matches.' },
            { text: 'It never finds any match at all', why: 'It finds more matches than exact keys, including wrong ones.' },
          ],
          answer: 0,
          explain: '"Cancel my order" and "cannot cancel my order" are close in embedding space.',
        },
        {
          id: 'e9-6-8',
          type: 'predict-output',
          prompt: 'An entry expires after 60 s. What does this print?',
          code: `stored_at = {"q": 0.0}
TTL = 60
now = 75.0
fresh = now - stored_at["q"] < TTL
print(fresh)`,
          answer: 'False',
          options: [{ text: 'False' }, { text: 'True', why: '75 s have passed: more than the 60 s TTL.' }],
          explain: 'A stale entry is a miss: call the model and store the new answer.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'e9-07',
      title: 'Before and after',
      summary: 'Change one thing, measure cost, p50, p95 and quality on the same set, and show both in one table.',
      card: {
        title: 'Before and after',
        text: 'Every optimisation is a claim to measure: change one thing, run the same golden set before and after, and compare cost per request, p50, p95 and quality in one table. A change that saves money but loses quality is a trade-off to state, not a win.',
        code: `rows = [("before", 0.0060, 1.9, .86),
        ("after", 0.0021, 0.9, .85)]
print("run     cost    p95  score")
for name, c, p95, s in rows:
    a = f"{name:<7} {c:.4f}"
    print(a, f"{p95:4.1f} {s:5.2f}")`,
        output: 'run     cost    p95  score\nbefore  0.0060  1.9  0.86\nafter   0.0021  0.9  0.85',
      },
      exercises: [
        {
          id: 'e9-7-1',
          type: 'mcq',
          prompt: 'The card\'s table: what do you conclude?',
          options: [
            { text: 'Cheaper and faster; quality held' },
            { text: 'Worse: the score dropped', why: 'One point on a golden set is within noise; check the changed answers.' },
            { text: 'No change worth reporting here', why: 'Cost fell by 65% and p95 halved.' },
          ],
          answer: 0,
          explain: 'State it with numbers: −65% cost, −53% p95, score 0.86 → 0.85.',
        },
        {
          id: 'e9-7-2',
          type: 'predict-output',
          prompt: 'Type the cost reduction as a percentage, rounded.',
          code: `before, after = 0.0060, 0.0021
saving = (before - after) / before
print(round(saving * 100))`,
          answer: '65',
          typedWrong: [{ answer: '35', why: 'That is after as a share of before; the saving is 65%.' }],
          explain: 'Report the change relative to before.',
        },
        {
          id: 'e9-7-3',
          type: 'mcq',
          prompt: 'You switched to a smaller model and added caching in one release. Problem?',
          options: [
            { text: 'You cannot tell which change did what' },
            { text: 'Two changes are not allowed', why: 'Allowed, but the table can no longer attribute the effects.' },
            { text: 'Caching hides the model\'s cost', why: 'It does affect cost, which is exactly why they need separate runs.' },
          ],
          answer: 0,
          explain: 'One change per measurement, or a run for each combination.',
        },
        {
          id: 'e9-7-4',
          type: 'run-code',
          prompt: 'Set `change` to the relative change in p95 from `before` to `after` (negative means faster).',
          before: 'before, after = 1.9, 0.9',
          solution: 'change = (after - before) / before',
          tests: 'assert abs(change - (-1.0 / 1.9)) < 1e-12, f"(0.9 − 1.9) / 1.9 ≈ −0.53; got {change}"',
          placeholder: 'change = ...',
          explain: 'About −53%.',
        },
        {
          id: 'e9-7-5',
          type: 'fill-blank',
          prompt: 'Line the columns up.',
          code: `for name, c in [("before", 0.006),
                ("after", 0.0021)]:
    print(f"{name:___} {c:.4f}")`,
          answer: ['<7'],
          distractors: [
            { text: '>7', why: 'Right-aligned names look ragged on the left.' },
            { text: '.7', why: 'That limits the length; it does not pad.' },
          ],
          expectOutput: 'before  0.0060\nafter   0.0021',
          explain: 'Left-align text, right-align numbers.',
        },
        {
          id: 'e9-7-6',
          type: 'mcq',
          prompt: 'Why measure on the same golden set before and after?',
          options: [
            { text: 'Else the inputs differ too' },
            { text: 'It is faster to reuse it', why: 'Speed is a bonus; comparability is the point.' },
            { text: 'Providers require a fixed set', why: 'This is your own experimental hygiene.' },
          ],
          answer: 0,
          explain: 'Easier questions after would look like an improvement.',
        },
        {
          id: 'e9-7-7',
          type: 'predict-output',
          prompt: 'Which run is cheapest while keeping a score of at least 0.85? Type what this prints.',
          code: `runs = {"large": (0.0060, 0.86),
        "small": (0.0005, 0.71),
        "routed": (0.0021, 0.85)}
ok = {k: v for k, v in runs.items()
      if v[1] >= 0.85}
print(min(ok, key=lambda k: ok[k][0]))`,
          answer: 'routed',
          typedWrong: [{ answer: 'small', why: 'small scores 0.71, below the 0.85 bar.' }],
          explain: 'Set a quality bar, then minimise cost under it.',
        },
        {
          id: 'e9-7-8',
          type: 'mcq',
          prompt: 'Which belongs in a before/after table for an LLM feature?',
          options: [
            { text: 'Cost, p50, p95 and quality' },
            { text: 'Only the score', why: 'Then cost and speed changes go unnoticed.' },
            { text: 'Only cost and latency', why: 'Then quality losses go unnoticed.' },
          ],
          answer: 0,
          explain: 'Four columns, two rows, one sentence of conclusion.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'e9-08',
      title: 'Checkpoint: cost, latency, observability',
      summary: 'Cost from usage, p50 and p95, spans, logs, routing, caching and before/after, mixed.',
      checkpoint: true,
      card: {
        title: 'Checkpoint',
        text: 'Ten questions across the unit. Get 8 right first time to test out.',
      },
      exercises: [
        {
          id: 'e9-8-1',
          type: 'predict-output',
          prompt: 'Type the cost of 2,000 input and 500 output tokens on the small model.',
          code: `pin, pout = PRICES["model-small"]
print((2000 * pin + 500 * pout) / 1e6)`,
          answer: '0.001125',
          typedWrong: [{ answer: '1125.0', why: 'Divide by a million: prices are per million tokens.' }],
          explain: '500 + 625 = 1,125 per million.',
        },
        {
          id: 'e9-8-2',
          type: 'mcq',
          prompt: 'p50 is fine but p95 doubled after a release. Where do you look?',
          options: [
            { text: 'The slowest traces' },
            { text: 'The mean latency', why: 'The mean blurs the tail you need to see.' },
            { text: 'The cost dashboard', why: 'Latency first: open the slow traces.' },
          ],
          answer: 0,
          explain: 'Find what the slow requests have in common.',
        },
        {
          id: 'e9-8-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `with span("request"):
    with span("retrieve"):
        sim.clock.advance(0.25)
    with span("llm"):
        sim.clock.advance(1.0)
print(SPANS[1], SPANS[2])`,
          answer: "('llm', 1.0) ('request', 1.25)",
          options: [
            { text: "('llm', 1.0) ('request', 1.25)" },
            { text: "('retrieve', 0.25) ('llm', 1.0)", why: 'SPANS[0] is retrieve; [1] and [2] are llm and request.' },
            { text: "('llm', 1.0) ('request', 1.0)", why: 'request covers both stages: 1.25 s.' },
          ],
          explain: 'Inner spans close first.',
        },
        {
          id: 'e9-8-4',
          type: 'fill-blank',
          prompt: 'The slow tail.',
          code: `lat = [100] * 19 + [3000]
print(np.percentile(lat, ___) > 100)`,
          answer: ['99'],
          distractors: [{ text: '50', why: 'The median ignores the single slow request.' }],
          expectOutput: 'True',
          explain: 'With 20 requests, only a high percentile sees the 1 slow one.',
        },
        {
          id: 'e9-8-5',
          type: 'spot-bug',
          prompt: 'Which line is wrong?',
          code: `rec = {"request_id": "r7",
       "prompt": "my card is 4111...",
       "latency_ms": 900}
assert "prompt" not in rec, "raw"`,
          error: 'AssertionError: raw',
          answer: 1,
          raiseLine: 3,
          lineWhy: {
            '0': 'Request ids belong in logs.',
            '2': 'Latency belongs in logs.',
            '3': 'The check is right: this prompt holds card data.',
          },
          explain: 'Redact or drop raw prompts that can contain personal data.',
        },
        {
          id: 'e9-8-6',
          type: 'predict-output',
          prompt: '30% escalate. Type the average cost per request.',
          code: `small, large = 0.0005, 0.006
print(round(small + 0.3 * large, 4))`,
          answer: '0.0023',
          typedWrong: [{ answer: '0.0018', why: 'Add the small call every request makes: 0.0005 + 0.0018.' }],
          explain: 'Still 62% cheaper than always-large.',
        },
        {
          id: 'e9-8-7',
          type: 'mcq',
          prompt: 'Your cache key is the question only. You change the model. Problem?',
          options: [
            { text: 'Old answers come back' },
            { text: 'None: same questions', why: 'Answers from the old model are served as if new.' },
            { text: 'The cache empties itself', why: 'It does not know the model changed.' },
          ],
          answer: 0,
          explain: 'Key on question, model and prompt version.',
        },
        {
          id: 'e9-8-8',
          type: 'run-code',
          prompt: 'Set `rate` to the share of `LOGS` that used the large model.',
          solution: 'n = sum(r["model"] == "model-large"\n        for r in LOGS)\nrate = n / len(LOGS)',
          tests: 'assert rate == 0.15, f"6 of 40; got {rate}"',
          maxLines: 3,
          placeholder: 'rate = ...',
          explain: 'True counts as 1.',
        },
        {
          id: 'e9-8-9',
          type: 'mcq',
          prompt: 'Cost fell 50% and the score fell from 0.86 to 0.74. What do you report?',
          options: [
            { text: 'A trade-off, with both numbers' },
            { text: 'A 50% saving', why: 'Leaving out a 12-point quality drop misleads.' },
            { text: 'Nothing until the score recovers', why: 'Report it; let the decision be explicit.' },
          ],
          answer: 0,
          explain: 'Maybe acceptable for some uses; that is a decision, not a measurement.',
        },
        {
          id: 'e9-8-10',
          type: 'predict-output',
          prompt: 'Type the hit rate.',
          code: `qs = ["a", "a", "b", "a", "b", "c"]
seen, hits = set(), 0
for q in qs:
    hits += q in seen
    seen.add(q)
print(round(hits / len(qs), 2))`,
          answer: '0.5',
          typedWrong: [{ answer: '0.33', why: 'Three hits: the 2nd and 3rd a and the 2nd b.' }],
          explain: 'Half the traffic would skip the model.',
        },
      ],
    },
  ],
  labs: e9Labs,
  library: e9Library,
};
