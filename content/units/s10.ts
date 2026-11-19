import { s10Labs } from '../labs/s10';
import { s10Library } from '../library/s10';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s10More } from './s10-more';

/*
 * S10 Reliability and operations. Lessons 1-5 here: timeouts, retries
 * without storms, circuit breakers, bulkheads and graceful degradation,
 * redundancy and multi-region. Lessons 6-10 in s10-more.ts: safe
 * deployment, metrics, logs and traces, SLOs and error budgets,
 * authentication and authorisation with sessions and tokens, checkpoint.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's10-01',
    title: 'Timeouts',
    summary: 'Every remote call gets a timeout just above its normal slow case, inside one deadline for the whole request.',
    card: {
      title: 'Timeouts',
      text: 'A call with no timeout can wait forever, and while it waits it holds a thread, a connection and a user. Set each timeout a little above the dependency\'s normal slow case (its p99), not at its average. A request has one overall deadline; pass the time remaining down, so inner calls give up once their answer can no longer be used.',
    },
    exercises: [
      {
        id: 's10-1-1',
        type: 'mcq',
        prompt: 'Why is a call with no timeout dangerous?',
        options: [
          { text: 'Stuck calls hold threads forever' },
          { text: 'The call returns wrong data', why: 'The data is fine; the waiting is the problem.' },
          { text: 'Timeouts make calls faster', why: 'They do not speed anything up; they stop the waiting.' },
        ],
        answer: 0,
        explain: 'Enough stuck calls and the caller stops answering too.',
      },
      {
        id: 's10-1-2',
        type: 'estimate',
        prompt: 'A service has 200 worker threads. A dependency hangs; 50 requests a second each wait on it with a 30 s timeout. How many seconds until every thread is stuck?',
        expr: '200 / 50',
        answer: 4,
        tolerance: 1.5,
        unit: 's',
        options: [
          { value: 0.4, why: '50 a second fill 200 threads in 4 seconds.' },
          { value: 4 },
          { value: 40, why: 'The threads fill long before the first timeout fires.' },
        ],
        work: ['200 threads / 50 new stuck calls per second = 4 s'],
        explain: 'Four seconds to a full outage, caused by someone else\'s problem.',
      },
      {
        id: 's10-1-3',
        type: 'predict-output',
        prompt: 'The request has 1 s in total and has used 0.7 s. What does the inner call get?',
        code: `deadline = 1.0     # whole request
spent = 0.7
def call(budget):
    if budget <= 0:
        return "skip"
    return f"call, {budget:.1f}s left"

print(call(deadline - spent))`,
        answer: 'call, 0.3s left',
        typedWrong: [{ answer: 'call, 1.0s left', why: 'Only what is left of the deadline is passed down.' }],
        explain: 'Inner calls inherit the remaining time, not a fresh full timeout.',
      },
      {
        id: 's10-1-4',
        type: 'scenario',
        prompt: 'A dependency answers in 40 ms on average and 120 ms at p99. Choose the timeout.',
        situation: 'The library default is 30 seconds.',
        needs: ['Normal slow calls succeed', 'A hung dependency is abandoned fast'],
        options: [
          {
            text: 'Just above p99, ~200 ms',
            cost: 'The rare call slower than that fails.',
          },
          {
            text: 'The average latency, 40 ms',
            cost: 'Very fast failure.',
            why: 'A large share of perfectly normal calls take longer than the average.',
          },
          {
            text: 'The default, 30 s',
            cost: 'No tuning.',
            why: 'A hung dependency holds threads for 30 s per call.',
          },
        ],
        answer: 0,
        explain: 'Base timeouts on measured percentiles.',
      },
      {
        id: 's10-1-5',
        type: 'order-steps',
        prompt: 'How one hung dependency takes down its callers. Put it in order.',
        steps: [
          'A dependency stops answering',
          'Calls to it wait with no timeout',
          'The caller\'s threads fill up',
          'New requests to the caller queue',
          'The caller stops answering too',
          'Its own callers start waiting',
        ],
        explain: 'A cascading failure. Timeouts break the chain at the first step.',
      },
      {
        id: 's10-1-6',
        type: 'predict-output',
        prompt: 'A 200 ms timeout over five calls. What does this print?',
        code: `def call(latency, timeout):
    if latency > timeout:
        return "timeout"
    return "ok"

lat = [40, 60, 90, 130, 5000]
print([call(l, 200) for l in lat])`,
        answer: "['ok', 'ok', 'ok', 'ok', 'timeout']",
        typedWrong: [{ answer: "['ok', 'ok', 'ok', 'timeout', 'timeout']", why: '130 ms is within 200.' }],
        explain: 'Normal calls pass; the hung one is cut off at 200 ms instead of 5 s.',
      },
      {
        id: 's10-1-7',
        type: 'mcq',
        prompt: 'An inner call normally takes 300 ms, but the request\'s deadline has 50 ms left. What should happen?',
        options: [
          { text: 'Give up on the call' },
          { text: 'Wait the full 300 ms', why: 'The answer would arrive after the user has given up.' },
          { text: 'Retry it twice', why: 'Even less time for even more work.' },
        ],
        answer: 0,
        explain: 'Return a fallback or an error now.',
      },
      {
        id: 's10-1-8',
        type: 'fill-blank',
        prompt: 'Time left before the deadline, in milliseconds, never negative.',
        code: `def remaining(deadline, now):
    return max(0, deadline ___ now)

print(remaining(1000, 940))`,
        answer: ['-'],
        distractors: [{ text: '+', why: 'Time left is the deadline minus now.' }],
        expectOutput: '60',
        explain: '60 ms left: enough for a cached answer, not a slow call.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's10-02',
    title: 'Retries without storms',
    summary: 'Retry only safe, temporary failures, at one layer, with backoff, jitter and a retry budget.',
    card: {
      title: 'Retries without storms',
      text: 'Retry only failures that may succeed next time (timeouts, 503) and only operations safe to repeat. Retries multiply across layers: three layers that each try three times turn one failing request into 27 calls at the bottom. Retry at one layer, with backoff and jitter, and keep a retry budget (say, retries under 10% of calls) so retries cannot bury a struggling service.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'App' },
          { id: 'a', kind: 'service', label: 'API' },
          { id: 'b', kind: 'service', label: 'Orders' },
          { id: 'd', kind: 'db', label: 'Database' },
        ],
        edges: [
          { from: 'c', to: 'a', label: '×3' },
          { from: 'a', to: 'b', label: '×3' },
          { from: 'b', to: 'd', label: '×3' },
        ],
      },
    },
    exercises: [
      {
        id: 's10-2-1',
        type: 'predict-output',
        prompt: 'Each of three layers tries up to 3 times. The database is down. How many calls reach it per user request?',
        code: `tries = 3     # per layer
layers = 3
print(tries ** layers)`,
        answer: '27',
        typedWrong: [{ answer: '9', why: 'Each of the 3 tries at the top makes 3 at the middle, each making 3 at the bottom.' }],
        explain: 'The service that is already failing gets 27 times the load.',
      },
      {
        id: 's10-2-2',
        type: 'estimate',
        prompt: '1,000 requests a second hit the app while the database fails. Three layers each try three times. Calls per second at the database?',
        expr: '1000 * 3 ** 3',
        answer: 27000,
        tolerance: 1.5,
        unit: 'calls/s',
        options: [
          { value: 3000, why: 'Three layers multiply: 3 × 3 × 3.' },
          { value: 27000 },
          { value: 81000, why: 'Three layers, not four.' },
        ],
        work: ['3 × 3 × 3 = 27 calls per request', '1,000 × 27 = 27,000 calls/s'],
        explain: 'Enough to keep it down even after the fault is fixed.',
      },
      {
        id: 's10-2-3',
        type: 'bucket-sort',
        prompt: 'Retry, or not?',
        buckets: ['Retry', 'Do not retry'],
        items: [
          { text: 'Timeout reading a profile', bucket: 0, why: 'Temporary, and reads are safe.' },
          { text: '503 from a busy service', bucket: 0, why: 'Temporary by definition.' },
          { text: '400 Bad Request', bucket: 1, why: 'The same request will fail the same way.' },
          { text: 'POST /payments with no idempotency key', bucket: 1, why: 'A repeat might charge twice.' },
          { text: '404 for a deleted item', bucket: 1, why: 'It will still be gone.' },
          { text: 'Connection reset on a GET', bucket: 0, why: 'Network blip; safe to repeat.' },
        ],
        explain: 'Temporary and safe to repeat: both must hold.',
      },
      {
        id: 's10-2-4',
        type: 'mcq',
        prompt: 'Where should a chain of services retry?',
        options: [
          { text: 'At one layer only' },
          { text: 'At every layer', why: 'Retries multiply down the chain.' },
          { text: 'Only in the browser', why: 'Often fine, but the point is one layer, wherever it is.' },
        ],
        answer: 0,
        explain: 'Usually closest to the failing call, or at the edge, not both.',
      },
      {
        id: 's10-2-5',
        type: 'run-code',
        prompt: 'Write `may_retry(calls, retries, ratio)`: True while retries stay below `ratio` of calls.',
        solution: `def may_retry(calls, retries, ratio):
    return retries < calls * ratio`,
        tests: [
          'assert may_retry(100, 5, 0.1), "5 of 100 is under 10%"',
          'assert not may_retry(100, 10, 0.1), "budget used up"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'def may_retry(calls, retries, ratio):',
        explain: 'When a service is failing, the budget runs out and retries stop adding load.',
      },
      {
        id: 's10-2-6',
        type: 'scenario',
        prompt: 'A service is struggling, and half its traffic is now retries. What do you change?',
        situation: 'Clients retry immediately, up to 5 times.',
        needs: ['Retries stop adding load during the trouble', 'Single blips still recover'],
        options: [
          {
            text: 'Backoff, jitter and a retry budget',
            cost: 'Slower recovery from a single blip.',
          },
          {
            text: 'Raise the limit to 10 retries',
            cost: 'Nothing to build.',
            why: 'Doubles the extra load on a service already failing.',
          },
        ],
        answer: 0,
        explain: 'Spread out, and capped as a share of traffic.',
      },
      {
        id: 's10-2-7',
        type: 'mcq',
        prompt: 'Why retry only operations that are safe to repeat?',
        options: [
          { text: 'A repeat may apply twice' },
          { text: 'They are always slower', why: 'Speed is not the issue; double effects are.' },
          { text: 'Servers reject repeats', why: 'Most servers happily process the repeat.' },
        ],
        answer: 0,
        explain: 'Or make them safe with an idempotency key.',
      },
      {
        id: 's10-2-8',
        type: 'fill-blank',
        prompt: 'Retry only the temporary failures.',
        code: `RETRYABLE = {408, 429, 503}
def should_retry(status):
    return status ___ RETRYABLE

print(should_retry(503),
      should_retry(400))`,
        answer: ['in'],
        distractors: [{ text: 'not in', why: 'That retries the permanent errors and gives up on the temporary ones.' }],
        expectOutput: 'True False',
        explain: '400 means the request itself is wrong.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's10-03',
    title: 'Circuit breakers',
    summary: 'After repeated failures, stop calling for a while; then let one trial call decide whether to resume.',
    card: {
      title: 'Circuit breakers',
      text: 'A circuit breaker wraps calls to a dependency and counts failures. After too many (say, 5 in a row) it opens: calls fail at once without being tried, which spares the failing service and frees the caller. After a cool-down it lets one trial call through (half-open); success closes it again, failure opens it for another cool-down.',
    },
    exercises: [
      {
        id: 's10-3-1',
        type: 'order-steps',
        prompt: 'A breaker\'s life. Put it in order.',
        steps: [
          'Closed: calls go through',
          'Failures pass the threshold',
          'Open: calls fail at once',
          'The cool-down ends: one trial call',
          'The trial succeeds: closed again',
        ],
        explain: 'Closed, open, half-open, closed.',
      },
      {
        id: 's10-3-2',
        type: 'match-pairs',
        prompt: 'Match each state to what happens to a call.',
        pairs: [
          { left: 'Closed', right: 'goes through as normal', why: 'Failures are counted.' },
          { left: 'Open', right: 'fails at once, untried', why: 'The dependency gets a rest.' },
          { left: 'Half-open', right: 'one trial call is allowed', why: 'It decides the next state.' },
        ],
        explain: 'Named after electrical breakers: open means no current flows.',
      },
      {
        id: 's10-3-3',
        type: 'predict-output',
        prompt: 'The breaker opens after 3 failures in a row. What do four calls get?',
        code: `fails, LIMIT = 0, 3
def call(ok):
    global fails
    if fails >= LIMIT:
        return "fast-fail"
    if ok:
        fails = 0
        return "ok"
    fails += 1
    return "err"

r = [call(x) for x in
     [False, False, False, True]]
print(r)`,
        answer: "['err', 'err', 'err', 'fast-fail']",
        typedWrong: [{ answer: "['err', 'err', 'err', 'ok']", why: 'After three failures the breaker is open: the fourth is not tried.' }],
        explain: 'Even though the service might have recovered, the breaker waits for its cool-down.',
      },
      {
        id: 's10-3-4',
        type: 'mcq',
        prompt: 'Why fail at once while the breaker is open?',
        options: [
          { text: 'Spare the failing service' },
          { text: 'Make errors look nicer', why: 'The error is the same; the waiting is gone.' },
          { text: 'Save disk space', why: 'Unrelated.' },
        ],
        answer: 0,
        explain: 'And the caller\'s threads are freed instead of waiting on timeouts.',
      },
      {
        id: 's10-3-5',
        type: 'scenario',
        prompt: 'The recommendations service is down. Every product page waits 2 s for it before timing out. What do you do?',
        situation: 'Product pages are the busiest pages on the site.',
        needs: ['Pages fast during the outage', 'Recommendations return when it recovers'],
        options: [
          {
            text: 'A breaker with a fallback list',
            cost: 'Generic recommendations for a while.',
          },
          {
            text: 'Keep calling it, timing out',
            cost: 'Nothing to build.',
            why: 'Every page pays 2 s while the service is down.',
          },
        ],
        answer: 0,
        explain: 'Open breaker: pages render at once; half-open trials bring it back.',
      },
      {
        id: 's10-3-6',
        type: 'mcq',
        prompt: 'What does a half-open breaker do?',
        options: [
          { text: 'Lets one trial call through' },
          { text: 'Allows half the traffic', why: 'Just a trial call, not half the load.' },
          { text: 'Closes after a fixed time', why: 'Only a successful trial closes it.' },
        ],
        answer: 0,
        explain: 'Testing the water before letting everyone back in.',
      },
      {
        id: 's10-3-7',
        type: 'predict-output',
        prompt: 'The breaker opened at t = 100 s with a 30 s cool-down. What is its state at 110 s and 135 s?',
        code: `opened_at, COOL = 100, 30
def state(now):
    if now - opened_at < COOL:
        return "open"
    return "half-open"

print(state(110), state(135))`,
        answer: 'open half-open',
        typedWrong: [{ answer: 'open open', why: '35 s have passed by 135: the cool-down is over.' }],
        explain: 'The trial call decides what happens next.',
      },
      {
        id: 's10-3-8',
        type: 'fill-blank',
        prompt: 'Open once failures reach the limit.',
        code: `def is_open(fails, limit):
    return fails ___ limit

print(is_open(5, 5), is_open(2, 5))`,
        answer: ['>='],
        distractors: [
          { text: '>', why: '5 > 5 is False: it would need a sixth failure.' },
          { text: '<', why: 'That opens while things are fine.' },
        ],
        expectOutput: 'True False',
        explain: 'Five failures of five allowed: open.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's10-04',
    title: 'Bulkheads and degradation',
    summary: 'Separate pools per dependency contain a failure; planned fallbacks keep the core working.',
    card: {
      title: 'Bulkheads and degradation',
      text: 'A bulkhead gives each dependency its own limited pool of threads or connections, so one slow dependency can use up only its own pool, not the whole service. Graceful degradation means deciding in advance what to show when a part fails: cached results, a simpler version, or the page without that feature. A product page without recommendations is still a page that can sell.',
      diagram: {
        nodes: [
          { id: 'p', kind: 'service', label: 'Product page' },
          { id: 'c', kind: 'db', label: 'Catalogue' },
          { id: 'r', kind: 'service', label: 'Recs' },
          { id: 'v', kind: 'service', label: 'Reviews' },
        ],
        edges: [
          { from: 'p', to: 'c', label: 'pool 50' },
          { from: 'p', to: 'r', label: 'pool 20' },
          { from: 'p', to: 'v', label: 'pool 20' },
        ],
      },
    },
    exercises: [
      {
        id: 's10-4-1',
        type: 'scenario',
        prompt: 'A shared pool of 100 threads serves every dependency. Reviews hangs and takes all 100; checkout dies too. Fix?',
        situation: 'Reviews is a nice-to-have; checkout is the business.',
        needs: ['A slow dependency cannot starve the others'],
        options: [
          {
            text: 'A separate pool per dependency',
            cost: 'Pools to size and watch.',
          },
          {
            text: 'Make the shared pool 200',
            cost: 'More memory.',
            why: 'The hung service fills 200 just as easily.',
          },
        ],
        answer: 0,
        explain: 'Reviews can exhaust its 20 threads; checkout keeps its own.',
      },
      {
        id: 's10-4-2',
        type: 'bucket-sort',
        prompt: 'For an online shop: must keep working, or can degrade?',
        buckets: ['Must work', 'Can degrade'],
        items: [
          { text: 'Taking payment', bucket: 0, why: 'No payment, no business.' },
          { text: 'Recommendations', bucket: 1, why: 'Show bestsellers instead.' },
          { text: 'Reviews', bucket: 1, why: 'Hide them for a while.' },
          { text: 'Adding to the cart', bucket: 0, why: 'Core flow.' },
          { text: 'Recently viewed items', bucket: 1, why: 'Nice, not needed.' },
        ],
        explain: 'Protect the core path; plan a fallback for everything else.',
      },
      {
        id: 's10-4-3',
        type: 'predict-output',
        prompt: 'The recommendations service is down. What does the page show?',
        code: `cache = {"recs": ["mug", "pen"]}
def recs(service_up):
    if service_up:
        return ["fresh", "picks"]
    return cache.get("recs", [])

print(recs(False))`,
        answer: "['mug', 'pen']",
        typedWrong: [{ answer: '[]', why: 'The cache still has the last good list.' }],
        explain: 'Slightly stale recommendations beat an error.',
      },
      {
        id: 's10-4-4',
        type: 'mcq',
        prompt: 'Where does the name "bulkhead" come from?',
        options: [
          { text: 'A ship\'s watertight walls' },
          { text: 'A heavy load balancer', why: 'It is a pattern, not a device.' },
          { text: 'A shared thread pool', why: 'The opposite: pools are kept separate.' },
        ],
        answer: 0,
        explain: 'A hole floods one compartment, not the whole ship.',
      },
      {
        id: 's10-4-5',
        type: 'estimate',
        prompt: 'A service has 200 threads; reviews is limited to a pool of 20. Reviews hangs. What percentage of threads still serve other work?',
        expr: '(200 - 20) / 200 * 100',
        answer: 90,
        tolerance: 1.1,
        unit: '%',
        options: [
          { value: 10, why: 'That is the share reviews can take.' },
          { value: 50, why: '180 of 200 are free.' },
          { value: 90 },
        ],
        work: ['200 − 20 = 180 free', '180 / 200 = 90%'],
        explain: 'Without the bulkhead it would be 0%.',
      },
      {
        id: 's10-4-6',
        type: 'diagram',
        prompt: 'Which dependency can the product page drop and still sell?',
        diagram: {
          nodes: [
            { id: 'p', kind: 'service', label: 'Product page' },
            { id: 'c', kind: 'db', label: 'Catalogue' },
            { id: 'r', kind: 'service', label: 'Recs' },
            { id: 'y', kind: 'service', label: 'Payments' },
          ],
          edges: [
            { from: 'p', to: 'c' },
            { from: 'p', to: 'r' },
            { from: 'p', to: 'y' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'r',
          why: {
            p: 'That is the page itself.',
            c: 'Without the catalogue there is no product to show.',
            y: 'Without payments nothing can be bought.',
          },
        },
        explain: 'Hide the recommendations, or show a cached list.',
      },
      {
        id: 's10-4-7',
        type: 'mcq',
        prompt: 'When should fallbacks be decided?',
        options: [
          { text: 'Ahead of time, tested' },
          { text: 'During the outage', why: 'Decisions under pressure are slow and risky.' },
          { text: 'After the postmortem', why: 'Too late for this outage.' },
        ],
        answer: 0,
        explain: 'Test them, too: switch a dependency off in staging and look.',
      },
      {
        id: 's10-4-8',
        type: 'fill-blank',
        prompt: 'Add the recommendations section only when it works.',
        code: `def page(recs_ok):
    parts = ["product", "buy"]
    if recs_ok:
        parts.___("recs")
    return parts

print(page(False), page(True))`,
        answer: ['append'],
        distractors: [{ text: 'remove', why: 'There is no "recs" to remove.' }],
        expectOutput: "['product', 'buy'] ['product', 'buy', 'recs']",
        explain: 'The page works either way.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's10-05',
    title: 'Redundancy and regions',
    summary: 'Run N+1 of everything; choose active-passive or active-active by the recovery time and data loss you can accept.',
    card: {
      title: 'Redundancy and regions',
      text: 'Remove single points of failure by running at least one more of everything than the load needs (N+1), spread so a machine, zone or region can fail while the rest carry on. Active-passive keeps a standby region that takes over (cheaper, slower to switch); active-active serves from several regions at once (fast failover, but data must be replicated and conflicts handled). Choose by the recovery time (RTO) and the data loss (RPO) the business can accept.',
    },
    exercises: [
      {
        id: 's10-5-1',
        type: 'match-pairs',
        prompt: 'Match each term to its meaning.',
        pairs: [
          { left: 'RTO', right: 'how long until it is back', why: 'Recovery time objective.' },
          { left: 'RPO', right: 'how much recent data may be lost', why: 'Recovery point objective.' },
          { left: 'N+1', right: 'one spare beyond the load', why: 'Survive one failure.' },
        ],
        explain: 'RTO is about time down; RPO is about data lost.',
      },
      {
        id: 's10-5-2',
        type: 'estimate',
        prompt: 'The load needs 6 servers. They are spread over 3 zones, and losing a zone must not hurt. How many servers in total?',
        expr: '6 / (3 - 1) * 3',
        answer: 9,
        tolerance: 1.3,
        unit: 'servers',
        options: [
          { value: 6, why: 'Losing a zone would leave only 4.' },
          { value: 9 },
          { value: 18, why: 'The two surviving zones need 3 each, not 6.' },
        ],
        work: ['2 surviving zones must carry 6: 3 each', '3 per zone × 3 zones = 9'],
        explain: 'More zones means less spare: with 4 zones, 8 servers would do.',
      },
      {
        id: 's10-5-3',
        type: 'predict-output',
        prompt: 'Two independent replicas, each up 99% of the time. How often is at least one up (%)?',
        code: `down = 1 - NINES_2     # one replica
both = down ** 2
print(round((1 - both) * 100, 2))`,
        answer: '99.99',
        typedWrong: [{ answer: '99.0', why: 'Both must be down together: 1% × 1% = 0.01%.' }],
        explain: 'Parallel copies multiply the downtime; chained dependencies multiply the uptime.',
      },
      {
        id: 's10-5-4',
        type: 'scenario',
        prompt: 'A payments database must lose no confirmed payment and be back within 15 minutes if a region fails. What setup?',
        situation: 'Writes are a few hundred a second.',
        needs: ['RPO zero', 'RTO under 15 minutes'],
        options: [
          {
            text: 'Synchronous replica in a 2nd region',
            cost: 'Every write waits for the far region.',
          },
          {
            text: 'Nightly backups to another region',
            cost: 'Cheap to run.',
            why: 'Up to a day of payments lost, and restoring takes hours.',
          },
        ],
        answer: 0,
        explain: 'Zero data loss needs the write confirmed in both places.',
      },
      {
        id: 's10-5-5',
        type: 'bucket-sort',
        prompt: 'Active-active or active-passive?',
        buckets: ['Active-active', 'Active-passive'],
        items: [
          { text: 'A global social feed', bucket: 0, why: 'Users everywhere; reads tolerate lag.' },
          { text: 'An internal HR tool', bucket: 1, why: 'Hours of RTO are fine; keep it simple.' },
          { text: 'Low-latency game lobbies worldwide', bucket: 0, why: 'Must be near players.' },
          { text: 'A small company\'s billing database', bucket: 1, why: 'One writer, a standby for disasters.' },
          { text: 'A read-heavy news site', bucket: 0, why: 'Serve from every region.' },
        ],
        explain: 'Active-active pays for itself when latency or instant failover matter.',
      },
      {
        id: 's10-5-6',
        type: 'mcq',
        prompt: 'What does active-active bring that active-passive avoids?',
        options: [
          { text: 'Write conflicts' },
          { text: 'Idle standby servers', why: 'That is active-passive\'s cost.' },
          { text: 'Slow failover', why: 'Active-active fails over faster.' },
        ],
        answer: 0,
        explain: 'Two regions accepting writes to the same data must reconcile them.',
      },
      {
        id: 's10-5-7',
        type: 'mcq',
        prompt: 'What makes a backup trustworthy?',
        options: [
          { text: 'Restoring it regularly' },
          { text: 'Keeping more copies of it', why: 'Copies of a broken backup are still broken.' },
          { text: 'Compressing it well', why: 'Size says nothing about whether it restores.' },
        ],
        answer: 0,
        explain: 'An untested backup is a hope, not a plan.',
      },
      {
        id: 's10-5-8',
        type: 'fill-blank',
        prompt: 'Servers needed so that losing one zone still leaves enough.',
        code: `need, zones = 6, 3
per_zone = need / (zones ___ 1)
print(per_zone * zones)`,
        answer: ['-'],
        distractors: [{ text: '+', why: 'The survivors are one zone fewer, not more.' }],
        expectOutput: '9.0',
        explain: 'The surviving zones must carry the whole load.',
      },
    ],
  },
];

export const s10: Unit = {
  id: 'S10',
  track: 'system-design',
  title: 'Reliability and operations',
  blurb: 'Timeouts, retries, circuit breakers, bulkheads and graceful degradation, redundancy across zones and regions, safe deployment, metrics, logs and traces, SLOs and error budgets, and authentication with sessions and tokens.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s10More],
  labs: s10Labs,
  library: s10Library,
};
