import type { Lesson } from '../schema';

/* S10 lessons 6-10: safe deployment, metrics, logs and traces, SLOs and error budgets, authentication and authorisation, checkpoint. */
export const s10More: Lesson[] = [
  // ------------------------------------------------------------------ 6
  {
    id: 's10-06',
    title: 'Safe deployment',
    summary: 'Roll out gradually, watch the numbers, and keep a fast way back: rolling, blue-green, canary and feature flags.',
    card: {
      title: 'Safe deployment',
      text: 'Most outages follow a change, so deploy in a way that limits the harm and can be undone fast. Rolling updates replace instances a few at a time, blue-green switches all traffic between two full environments (and back), and a canary sends a small share to the new version while its errors are watched. Feature flags separate deploying code from turning a feature on, so a bad feature is switched off without a redeploy.',
    },
    exercises: [
      {
        id: 's10-6-1',
        type: 'match-pairs',
        prompt: 'Match each strategy to how it rolls out.',
        pairs: [
          { left: 'Rolling', right: 'a few instances at a time', why: 'Old and new run side by side for a while.' },
          { left: 'Blue-green', right: 'switch all traffic, and back', why: 'Two full environments.' },
          { left: 'Canary', right: 'a small share first', why: 'Widened only if the numbers look good.' },
        ],
        explain: 'They combine: a canary inside a rolling update is common.',
      },
      {
        id: 's10-6-2',
        type: 'order-steps',
        prompt: 'A canary release. Put it in order.',
        steps: [
          'Send 1% of traffic to the new version',
          'Compare its errors and latency with the old',
          'Widen to 10%, then 50%',
          'Send all traffic to it',
          'Remove the old version',
        ],
        explain: 'At any step, bad numbers mean sending traffic back.',
      },
      {
        id: 's10-6-3',
        type: 'estimate',
        prompt: 'A canary takes 1% of 2,000 requests a second for 10 minutes. How many requests try the new version?',
        expr: '2000 / 100 * 10 * MINUTE',
        answer: 12000,
        tolerance: 1.5,
        unit: 'requests',
        options: [
          { value: 1200, why: '20 a second for 600 seconds.' },
          { value: 12000 },
          { value: 1200000, why: 'Only 1% of the traffic.' },
        ],
        work: ['1% of 2,000 = 20 requests/s', '20 × 600 s = 12,000'],
        explain: 'Enough to see a real error rate, while 99% of users never notice.',
      },
      {
        id: 's10-6-4',
        type: 'scenario',
        prompt: 'A risky new checkout flow is ready. How do you release it?',
        situation: 'A full deploy takes 25 minutes.',
        needs: ['Turn it off within seconds if it misbehaves'],
        options: [
          {
            text: 'Ship it behind a feature flag',
            cost: 'Old and new code paths both kept for a while.',
          },
          {
            text: 'Deploy, hotfix if needed',
            cost: 'No extra code.',
            why: 'Turning it off takes another 25-minute deploy.',
          },
        ],
        answer: 0,
        explain: 'Flip the flag off; remove the old path once the new one is proven.',
      },
      {
        id: 's10-6-5',
        type: 'predict-output',
        prompt: 'A flag is on for 20% of users, chosen by id. Which of these users get it?',
        code: `def enabled(user_id, percent):
    return user_id % 100 < percent

users = [3, 17, 42, 85, 99]
print([u for u in users
       if enabled(u, 20)])`,
        answer: '[3, 17]',
        typedWrong: [{ answer: '[3]', why: '17 % 100 = 17, which is under 20.' }],
        explain: 'The same users stay in the group as the percentage grows.',
      },
      {
        id: 's10-6-6',
        type: 'mcq',
        prompt: 'What is blue-green\'s main advantage?',
        options: [
          { text: 'Instant switch back' },
          { text: 'Needs fewer servers', why: 'It needs two full environments.' },
          { text: 'No database changes', why: 'Schema changes still need care.' },
        ],
        answer: 0,
        explain: 'The old environment is still running: point traffic back at it.',
      },
      {
        id: 's10-6-7',
        type: 'mcq',
        prompt: 'During a rolling deploy, why must a schema change still work with the old code?',
        options: [
          { text: 'Both versions run at once' },
          { text: 'Old code stops at once', why: 'It keeps running until the roll-out finishes.' },
          { text: 'Databases lock forever', why: 'Unrelated.' },
        ],
        answer: 0,
        explain: 'Expand first (add), deploy, then contract (remove) in a later release.',
      },
      {
        id: 's10-6-8',
        type: 'fill-blank',
        prompt: 'Promote the canary only if its error rate is within 10% of the old version\'s.',
        code: `def promote(canary, base):
    return canary <= base ___ 1.1

print(promote(0.012, 0.010))`,
        answer: ['*'],
        distractors: [{ text: '+', why: 'Adding 1.1 allows any error rate up to 110%.' }],
        expectOutput: 'False',
        explain: '1.2% against 1.0%: 20% worse, so roll back.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's10-07',
    title: 'Metrics, logs and traces',
    summary: 'Metrics for trends and alerts, logs for single events, traces for one request across services.',
    card: {
      title: 'Metrics, logs and traces',
      text: 'Metrics are numbers over time, such as request rate, error rate and latency percentiles: cheap to keep and the basis of dashboards and alerts. Logs are records of single events with their details, for finding out what happened to one request. A trace follows one request through every service it touches and shows where its time went.',
    },
    exercises: [
      {
        id: 's10-7-1',
        type: 'bucket-sort',
        prompt: 'Metric, log or trace?',
        buckets: ['Metric', 'Log', 'Trace'],
        items: [
          { text: 'Error rate over the last hour', bucket: 0, why: 'A number over time.' },
          { text: 'The stack trace of one failed order', bucket: 1, why: 'One event, in detail.' },
          { text: 'Which of six services made a request slow', bucket: 2, why: 'One request across services.' },
          { text: 'p99 latency on a dashboard', bucket: 0, why: 'A number over time.' },
          { text: 'What user 42 did at 10:03', bucket: 1, why: 'Individual events.' },
          { text: 'Time spent in each call of a checkout', bucket: 2, why: 'Spans of one request.' },
        ],
        explain: 'Alert on metrics, investigate with traces and logs.',
      },
      {
        id: 's10-7-2',
        type: 'predict-output',
        prompt: 'Two slow requests among a hundred. Average or p99?',
        code: `lat = [20] * 98 + [2000, 3000]
avg = sum(lat) / len(lat)
p99 = sorted(lat)[98]
print(round(avg), p99)`,
        answer: '70 2000',
        typedWrong: [{ answer: '20 2000', why: 'The two slow ones pull the average up to 70.' }],
        explain: 'The average says 70 ms; the slowest users wait 2 seconds or more.',
      },
      {
        id: 's10-7-3',
        type: 'mcq',
        prompt: 'Why alert on p99 latency rather than the average?',
        options: [
          { text: 'Averages hide the slow tail' },
          { text: 'Averages are hard to compute', why: 'They are the easiest to compute.' },
          { text: 'p99 is always lower', why: 'p99 is usually far higher.' },
        ],
        answer: 0,
        explain: 'At scale, 1% of requests is a lot of unhappy users.',
      },
      {
        id: 's10-7-4',
        type: 'mcq',
        prompt: 'What links one request\'s logs across six services?',
        options: [
          { text: 'A request id passed along' },
          { text: 'The server\'s hostname', why: 'Six services, six hostnames.' },
          { text: 'The log file\'s name', why: 'Each service writes its own files.' },
        ],
        answer: 0,
        explain: 'The same id appears in every log line and every trace span for that request.',
      },
      {
        id: 's10-7-5',
        type: 'estimate',
        prompt: '2,000 requests a second, each writing 1 KB of logs. How much log data a day?',
        expr: '2000 * KB * DAY / GB',
        answer: 172.8,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 1.7, why: '2 MB a second for 86,400 seconds.' },
          { value: 172.8 },
          { value: 17280, why: '173 GB, not 17 TB.' },
        ],
        work: ['2,000 × 1 KB = 2 MB/s', '2 MB × 86,400 s ≈ 173 GB'],
        explain: 'Five TB a month: sample, or keep detailed logs for days, not years.',
      },
      {
        id: 's10-7-6',
        type: 'match-pairs',
        prompt: 'The RED metrics for a service. Match each letter.',
        pairs: [
          { left: 'Rate', right: 'requests per second', why: 'How busy it is.' },
          { left: 'Errors', right: 'requests that fail', why: 'How broken it is.' },
          { left: 'Duration', right: 'time per request', why: 'How slow it is, as percentiles.' },
        ],
        explain: 'Three numbers per service cover most of what users feel.',
      },
      {
        id: 's10-7-7',
        type: 'scenario',
        prompt: 'Checkout is sometimes slow. Eight services are involved. How do you find the culprit?',
        situation: 'Each service logs on its own; nothing connects them.',
        needs: ['See where one slow request spent its time'],
        options: [
          {
            text: 'Distributed tracing',
            cost: 'Instrument services and run a trace store.',
          },
          {
            text: 'More logs in each service',
            cost: 'More log volume.',
            why: 'Without a shared request id they cannot be stitched into one request.',
          },
        ],
        answer: 0,
        explain: 'A trace shows the slow span directly.',
      },
      {
        id: 's10-7-8',
        type: 'fill-blank',
        prompt: 'The error rate as a percentage.',
        code: `total, errors = 4000, 20
rate = errors ___ total
print(f"{rate:.1%}")`,
        answer: ['/'],
        distractors: [{ text: '*', why: 'Multiplying gives 80,000, not a rate.' }],
        expectOutput: '0.5%',
        explain: '20 of 4,000 requests failed.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's10-08',
    title: 'SLOs and error budgets',
    summary: 'Measure what users feel, set a target below 100%, and spend the remainder on change.',
    card: {
      title: 'SLOs and error budgets',
      text: 'An SLI measures what users feel, such as the share of requests answered successfully within 300 ms; an SLO is the target for it over a window, such as 99.9% over 30 days. The error budget is the rest: 0.1% of requests, about 43 minutes of full outage a month, which the team may "spend" on risky changes. While budget remains, ship features; when it runs out, slow releases and fix reliability.',
    },
    exercises: [
      {
        id: 's10-8-1',
        type: 'estimate',
        prompt: 'An SLO of 99.9% over a 30-day month. How many minutes of full outage does the budget allow?',
        expr: '(1 - NINES_3) * MONTH / MINUTE',
        answer: 43.2,
        tolerance: 1.5,
        unit: 'min',
        options: [
          { value: 4.3, why: 'That is 99.99%.' },
          { value: 43.2 },
          { value: 432, why: 'That is 99%.' },
        ],
        work: ['0.1% of 43,200 minutes = 43.2 min'],
        explain: 'Each extra nine divides the budget by ten.',
      },
      {
        id: 's10-8-2',
        type: 'estimate',
        prompt: 'And at 99.99% over the same month?',
        expr: '(1 - NINES_4) * MONTH / MINUTE',
        answer: 4.32,
        tolerance: 1.5,
        unit: 'min',
        options: [
          { value: 0.43, why: 'That is 99.999%.' },
          { value: 4.32 },
          { value: 43.2, why: 'That is 99.9%.' },
        ],
        work: ['0.01% of 43,200 minutes = 4.32 min'],
        explain: 'Four minutes a month: no human can respond that fast; it takes automation.',
      },
      {
        id: 's10-8-3',
        type: 'predict-output',
        prompt: 'Ten million requests this month, 6,000 failed, SLO 99.9%. What is the budget, and what share of it is used (%)?',
        code: `slo = 0.999
requests = 10_000_000
failed = 6_000
budget = (1 - slo) * requests
print(round(budget),
      round(failed / budget * 100))`,
        answer: '10000 60',
        typedWrong: [{ answer: '10000 6', why: '6,000 of 10,000 is 60%.' }],
        explain: '40% of the budget is left for the rest of the month.',
      },
      {
        id: 's10-8-4',
        type: 'mcq',
        prompt: 'Should a service aim for 100%?',
        options: [
          { text: 'No: it leaves no room for change' },
          { text: 'Yes, for important services', why: 'Even they need to deploy, and users\' networks fail anyway.' },
          { text: 'Yes, if servers are good', why: 'Good hardware does not make change risk-free.' },
        ],
        answer: 0,
        explain: 'Users cannot tell 99.99% from 100% through their own unreliable networks.',
      },
      {
        id: 's10-8-5',
        type: 'scenario',
        prompt: 'The month\'s error budget is used up in week two. What now?',
        situation: 'The roadmap has three big launches this month.',
        needs: ['Keep the promise to users'],
        options: [
          {
            text: 'Pause launches; fix reliability',
            cost: 'Launches slip.',
          },
          {
            text: 'Keep shipping all three launches',
            cost: 'Roadmap on time.',
            why: 'Users already get worse service than promised; more change makes it worse.',
          },
        ],
        answer: 0,
        explain: 'The budget turns "reliability or features" into an agreed rule.',
      },
      {
        id: 's10-8-6',
        type: 'bucket-sort',
        prompt: 'A good SLI (what users feel), or not?',
        buckets: ['Good SLI', 'Not an SLI'],
        items: [
          { text: 'Share of checkouts that succeed', bucket: 0, why: 'Users feel failures.' },
          { text: 'CPU use of the database', bucket: 1, why: 'Users do not feel CPU; they feel slowness.' },
          { text: 'Share of searches under 300 ms', bucket: 0, why: 'Users feel latency.' },
          { text: 'Number of servers running', bucket: 1, why: 'An internal detail.' },
          { text: 'Share of pages loading without error', bucket: 0, why: 'Directly felt.' },
        ],
        explain: 'Watch internals too, but set promises on what users experience.',
      },
      {
        id: 's10-8-7',
        type: 'mcq',
        prompt: 'How does an SLA differ from an SLO?',
        options: [
          { text: 'An SLA is a contract with penalties' },
          { text: 'An SLA is an internal target', why: 'That is the SLO.' },
          { text: 'They mean exactly the same thing', why: 'The SLA is external and usually looser than the SLO.' },
        ],
        answer: 0,
        explain: 'Set the internal SLO tighter, so you notice before the contract is broken.',
      },
      {
        id: 's10-8-8',
        type: 'fill-blank',
        prompt: 'Failed requests still allowed this period.',
        code: `def budget_left(slo, total, bad):
    allowed = (1 - slo) * total
    return allowed ___ bad

left = budget_left(0.99, 1000, 4)
print(round(left))`,
        answer: ['-'],
        distractors: [{ text: '+', why: 'Failures use the budget up; they do not add to it.' }],
        expectOutput: '6',
        explain: '10 allowed, 4 used, 6 left.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's10-09',
    title: 'Who you are, what you may do',
    summary: 'Authentication finds the caller, authorisation checks every action; sessions revoke at once, tokens until they expire.',
    card: {
      title: 'Who you are, what you may do',
      text: 'Authentication establishes who the caller is; authorisation decides what that caller may do, and must be checked on every request, for every resource. A session keeps login state on the server and gives the browser only a random id, so logging out takes effect at once. A signed token (such as a JWT) carries the user\'s id and claims inside it, so any service can check it without a lookup, but it stays valid until it expires: keep it short-lived and renew it with a refresh token.',
    },
    exercises: [
      {
        id: 's10-9-1',
        type: 'bucket-sort',
        prompt: 'Authentication or authorisation?',
        buckets: ['Who are you', 'May you do it'],
        items: [
          { text: 'Checking a password', bucket: 0, why: 'Proves identity.' },
          { text: 'Verifying a token\'s signature', bucket: 0, why: 'Proves the token is genuine.' },
          { text: 'Only the owner may delete a post', bucket: 1, why: 'A permission.' },
          { text: 'Admins may see all orders', bucket: 1, why: 'A role\'s permission.' },
          { text: 'Signing in with a passkey', bucket: 0, why: 'Proves identity.' },
          { text: 'Can user 7 read invoice 99?', bucket: 1, why: 'Access to one resource.' },
        ],
        explain: 'First who, then what.',
      },
      {
        id: 's10-9-2',
        type: 'match-pairs',
        prompt: 'Match each to how it works.',
        pairs: [
          { left: 'Session', right: 'state on the server, id in a cookie', why: 'Delete it and the login ends.' },
          { left: 'Signed token', right: 'claims inside, checked without lookup', why: 'Valid until it expires.' },
          { left: 'Refresh token', right: 'long-lived, swapped for new ones', why: 'Revocable on the server.' },
        ],
        explain: 'Short access tokens plus a revocable refresh token combine the strengths.',
      },
      {
        id: 's10-9-3',
        type: 'scenario',
        prompt: 'A user\'s laptop is stolen and they click "log out everywhere". Tokens last 24 hours and the server keeps no state. What should change?',
        situation: 'Any service accepts any unexpired token.',
        needs: ['A stolen login stops working within minutes'],
        options: [
          {
            text: 'Short tokens, revocable refresh',
            cost: 'A refresh call every few minutes.',
          },
          {
            text: 'Keep the 24-hour tokens as they are',
            cost: 'No changes.',
            why: 'The thief\'s token keeps working for up to a day.',
          },
        ],
        answer: 0,
        explain: 'Revoke the refresh token; the access token dies within minutes.',
      },
      {
        id: 's10-9-4',
        type: 'predict-output',
        prompt: 'Ann is logged in. Can she read invoices 99 and 100?',
        code: `invoices = {99: "ann", 100: "bo"}
def can_read(user, inv):
    return invoices[inv] == user

print(can_read("ann", 99),
      can_read("ann", 100))`,
        answer: 'True False',
        typedWrong: [{ answer: 'True True', why: 'Invoice 100 belongs to Bo.' }],
        explain: 'Being logged in is not the same as being allowed.',
      },
      {
        id: 's10-9-5',
        type: 'mcq',
        prompt: 'A logged-in user changes /invoices/99 to /invoices/100 and sees someone else\'s invoice. What failed?',
        options: [
          { text: 'Authorisation' },
          { text: 'Authentication', why: 'The app knew exactly who they were.' },
          { text: 'Encryption', why: 'The data was meant to be hidden from this user, not the network.' },
        ],
        answer: 0,
        explain: 'Check ownership on every request, not just in the menu.',
      },
      {
        id: 's10-9-6',
        type: 'predict-output',
        prompt: 'A token expires at t = 1000. Is it valid at 900 and at 1200?',
        code: `token = {"user": 7, "exp": 1000}
def valid(tok, now):
    return now < tok["exp"]

print(valid(token, 900),
      valid(token, 1200))`,
        answer: 'True False',
        typedWrong: [{ answer: 'True True', why: '1200 is after the expiry.' }],
        explain: 'Until 1000 it works everywhere, even after "log out".',
      },
      {
        id: 's10-9-7',
        type: 'mcq',
        prompt: 'What does a token\'s signature prove?',
        options: [
          { text: 'No one altered it' },
          { text: 'It is still valid', why: 'Expiry is checked separately.' },
          { text: 'The user is online', why: 'It says nothing about the user right now.' },
        ],
        answer: 0,
        explain: 'Anyone can read the claims; only the issuer can sign them.',
      },
      {
        id: 's10-9-8',
        type: 'fill-blank',
        prompt: 'Only the owner may delete the post.',
        code: `post = {"id": 5, "owner": "ann"}
def may_delete(user, p):
    return p[___] == user

print(may_delete("ann", post),
      may_delete("bo", post))`,
        answer: ['"owner"'],
        distractors: [{ text: '"id"', why: 'The post id is 5, never a user name.' }],
        expectOutput: 'True False',
        explain: 'Authorisation compares the caller with the resource.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's10-10',
    title: 'Checkpoint: reliability and operations',
    summary: 'Timeouts, retries, breakers, bulkheads, redundancy, deployment, observability, SLOs and auth, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's10-10-1',
        type: 'mcq',
        prompt: 'A dependency\'s p99 is 80 ms. Which timeout?',
        options: [
          { text: 'About 150 ms' },
          { text: '30 seconds', why: 'A hung dependency would hold threads for 30 s.' },
          { text: '20 ms', why: 'Most normal calls would fail.' },
        ],
        answer: 0,
        explain: 'A little above the normal slow case.',
      },
      {
        id: 's10-10-2',
        type: 'predict-output',
        prompt: 'Two layers, each trying up to 4 times. Calls at the bottom per failing request?',
        code: `tries, layers = 4, 2
print(tries ** layers)`,
        answer: '16',
        typedWrong: [{ answer: '8', why: 'Each of 4 tries above makes 4 below.' }],
        explain: 'Retry at one layer.',
      },
      {
        id: 's10-10-3',
        type: 'order-steps',
        prompt: 'A circuit breaker, in order.',
        steps: ['Closed', 'Failures pass the limit', 'Open: fail at once', 'Half-open: one trial', 'Closed again'],
        explain: 'The trial call decides.',
      },
      {
        id: 's10-10-4',
        type: 'bucket-sort',
        prompt: 'For a streaming video service: must work, or can degrade?',
        buckets: ['Must work', 'Can degrade'],
        items: [
          { text: 'Playing the video', bucket: 0, why: 'The product itself.' },
          { text: 'Personalised rows', bucket: 1, why: 'Show popular titles instead.' },
          { text: 'Signing in', bucket: 0, why: 'Needed to watch.' },
          { text: '"Continue watching" position', bucket: 1, why: 'Start from the beginning for a while.' },
          { text: 'Thumbnail artwork', bucket: 1, why: 'Plain titles work.' },
        ],
        explain: 'Protect the core; plan fallbacks for the rest.',
      },
      {
        id: 's10-10-5',
        type: 'estimate',
        prompt: 'An SLO of 99.5% over a 30-day month. How many hours of full outage does the budget allow?',
        expr: '(1 - 0.995) * MONTH / HOUR',
        answer: 3.6,
        tolerance: 1.5,
        unit: 'h',
        options: [
          { value: 0.36, why: '0.5% of 720 hours.' },
          { value: 3.6 },
          { value: 36, why: '0.5%, not 5%.' },
        ],
        work: ['0.5% of 720 h = 3.6 h'],
        explain: 'A budget a team can actually plan around.',
      },
      {
        id: 's10-10-6',
        type: 'match-pairs',
        prompt: 'Match each deployment to its strength.',
        pairs: [
          { left: 'Canary', right: 'real traffic on a small share', why: 'Errors seen early, by few.' },
          { left: 'Blue-green', right: 'instant switch back', why: 'The old environment still runs.' },
          { left: 'Feature flag', right: 'off without a redeploy', why: 'Deploy and release are separate.' },
        ],
        explain: 'Limit the harm, keep a fast way back.',
      },
      {
        id: 's10-10-7',
        type: 'scenario',
        prompt: 'The search service is failing and every page waits for it. What do you add?',
        situation: 'Pages show a search box with suggestions.',
        needs: ['Pages stay fast', 'Search returns by itself when fixed'],
        options: [
          {
            text: 'A breaker; hide suggestions',
            cost: 'No suggestions for a while.',
          },
          {
            text: 'Longer timeouts on search',
            cost: 'Nothing new.',
            why: 'Pages wait even longer.',
          },
        ],
        answer: 0,
        explain: 'Fail fast, degrade, and let half-open trials restore it.',
      },
      {
        id: 's10-10-8',
        type: 'fill-blank',
        prompt: 'Logged in, but not the owner.',
        code: `def check(logged_in, is_owner):
    if not logged_in:
        return 401
    if not is_owner:
        return ___
    return 200

print(check(True, False))`,
        answer: ['403'],
        distractors: [{ text: '401', why: 'We know who they are; they are just not allowed.' }],
        expectOutput: '403',
        explain: 'Known caller, no permission: 403.',
      },
      {
        id: 's10-10-9',
        type: 'mcq',
        prompt: 'Which tool shows which of six services made one request slow?',
        options: [
          { text: 'A distributed trace' },
          { text: 'An error-rate graph', why: 'It counts failures over time, not one request\'s path.' },
          { text: 'A CPU dashboard', why: 'Internal resource use, not one request.' },
        ],
        answer: 0,
        explain: 'Spans show where the time went.',
      },
      {
        id: 's10-10-10',
        type: 'mcq',
        prompt: 'Why keep signed access tokens short-lived?',
        options: [
          { text: 'They cannot be revoked early' },
          { text: 'They take up disk space', why: 'They are small and stored by the client.' },
          { text: 'Signatures wear out', why: 'Signatures do not age.' },
        ],
        answer: 0,
        explain: 'A stolen token works until it expires.',
      },
    ],
  },
];
