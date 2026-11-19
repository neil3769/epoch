import type { Lesson } from '../schema';

/* S9 lessons 6-10: the token bucket, the API gateway, monolith versus microservices, service discovery, checkpoint. */
const BURST = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 2, 3, 4, 5];
const STEADY = [0, 0.3, 0.6, 1, 1.3, 1.6, 2, 2.3, 2.6, 3, 3.3, 3.6];

export const s9More: Lesson[] = [
  // ------------------------------------------------------------------ 6
  {
    id: 's9-06',
    title: 'The token bucket',
    summary: 'A bucket of tokens refilled at a steady rate: bursts up to its size, the refill rate on average.',
    card: {
      title: 'The token bucket',
      text: 'A token bucket holds up to B tokens and gains r tokens a second; each request takes one, and a request finding the bucket empty is rejected. A client that has been quiet can burst up to B requests at once, but over time it cannot average more than r a second. Two numbers, little memory per client, and it matches how real clients behave, which is why it is the most common choice.',
      figure: { kind: 'limiter', times: BURST, algorithm: 'bucket', limit: 4, rate: 1, controls: ['limit', 'rate'] },
    },
    exercises: [
      {
        id: 's9-6-1',
        type: 'figure',
        prompt: 'An app sends 8 requests at start-up, then one a second. Refill is fixed at 1 a second. Size the bucket so none is rejected.',
        figure: { kind: 'limiter', times: BURST, algorithm: 'bucket', limit: 4, rate: 1, controls: ['limit'], goal: { minAllowed: 12 } },
        explain: 'A bucket of 8 takes the whole start-up burst; one a second is within the refill.',
      },
      {
        id: 's9-6-2',
        type: 'figure',
        prompt: 'A client sends a steady 3 requests a second. The bucket holds 2. Set the refill so all get through.',
        figure: { kind: 'limiter', times: STEADY, algorithm: 'bucket', limit: 2, rate: 1, controls: ['rate'], goal: { minAllowed: 12 } },
        explain: 'Over time the refill rate is the limit: it must be at least 3 a second.',
      },
      {
        id: 's9-6-3',
        type: 'predict-output',
        prompt: 'A bucket of 2 tokens, refilled at 1 a second. Requests at 0, 0.1, 0.2 and 1.5 s. Which are allowed?',
        code: `cap, rate = 2, 1
tokens, last = cap, 0.0
def allow(t):
    global tokens, last
    gained = (t - last) * rate
    tokens = min(cap, tokens + gained)
    last = t
    if tokens >= 1:
        tokens -= 1
        return True
    return False

ts = (0, 0.1, 0.2, 1.5)
print([allow(t) for t in ts])`,
        answer: '[True, True, False, True]',
        typedWrong: [{ answer: '[True, True, True, True]', why: 'After two, only 0.2 tokens have refilled by 0.2 s.' }],
        explain: 'A burst of two, then wait for the refill.',
      },
      {
        id: 's9-6-4',
        type: 'mcq',
        prompt: 'What does the bucket\'s size control?',
        options: [
          { text: 'The largest burst allowed' },
          { text: 'The long-run average rate', why: 'That is the refill rate.' },
          { text: 'How long a request waits', why: 'Rejected requests do not wait in a token bucket.' },
        ],
        answer: 0,
        explain: 'Size for bursts, refill for the average.',
      },
      {
        id: 's9-6-5',
        type: 'match-pairs',
        prompt: 'Match each algorithm to its character.',
        pairs: [
          { left: 'Fixed window', right: 'cheap; double bursts at edges', why: 'One counter per window.' },
          { left: 'Sliding window', right: 'exact over any second', why: 'Looks back from each request.' },
          { left: 'Token bucket', right: 'bursts up to its size', why: 'Average held to the refill rate.' },
        ],
        explain: 'All three are common; the token bucket is the usual default.',
      },
      {
        id: 's9-6-6',
        type: 'scenario',
        prompt: 'Apps sync about 40 requests at start-up, then a few a second. The fair average is 10 a second. Which limit?',
        situation: 'Users complain the app fails while starting up.',
        needs: ['Start-up bursts succeed', 'Average held to 10 a second'],
        options: [
          {
            text: 'Token bucket: size 50, refill 10/s',
            cost: 'A client can briefly send 50 at once.',
          },
          {
            text: 'Fixed window: 10 requests a second',
            cost: 'Simplest counter.',
            why: 'Rejects 30 of every 40-request start-up burst.',
          },
        ],
        answer: 0,
        explain: 'Bursts are normal client behaviour; limit the average instead.',
      },
      {
        id: 's9-6-7',
        type: 'estimate',
        prompt: 'A bucket of 20 refilled at 5 a second. A client sends as fast as it is allowed for one minute, starting full. How many get through?',
        expr: '20 + 5 * MINUTE',
        answer: 320,
        tolerance: 1.5,
        unit: 'requests',
        options: [
          { value: 32, why: '5 a second for 60 seconds is 300, plus the 20 stored.' },
          { value: 320 },
          { value: 1200, why: 'The refill, not the bucket size, sets the rate.' },
        ],
        work: ['20 stored + 5 × 60 refilled = 320'],
        explain: 'The burst is a one-off; the refill is what lasts.',
      },
      {
        id: 's9-6-8',
        type: 'fill-blank',
        prompt: 'Refill the bucket for the time that passed, never above its size.',
        code: `cap, rate = 5, 2
def refill(tokens, elapsed):
    return min(cap,
               tokens + elapsed * ___)

print(refill(1, 1.5), refill(4, 3))`,
        answer: ['rate'],
        distractors: [{ text: 'cap', why: 'That refills at 5 a second, not 2.' }],
        expectOutput: '4.0 5',
        explain: '1 + 1.5 × 2 = 4; 4 + 6 is capped at 5.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's9-07',
    title: 'The API gateway',
    summary: 'One entry point handles TLS, authentication, rate limits and routing; business logic stays in services.',
    card: {
      title: 'The API gateway',
      text: 'An API gateway is the single entry point in front of many services. It does the work every request needs once: decrypting HTTPS, checking who the caller is, applying rate limits, routing by path, and logging. Keep business rules out of it, and run several instances, because every request now passes through it.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Apps' },
          { id: 'g', kind: 'lb', label: 'Gateway' },
          { id: 'o', kind: 'service', label: 'Orders' },
          { id: 'u', kind: 'service', label: 'Users' },
          { id: 'p', kind: 'service', label: 'Payments' },
        ],
        edges: [
          { from: 'c', to: 'g', label: 'HTTPS' },
          { from: 'g', to: 'o', label: '/orders' },
          { from: 'g', to: 'u', label: '/users' },
          { from: 'g', to: 'p', label: '/pay' },
        ],
      },
    },
    exercises: [
      {
        id: 's9-7-1',
        type: 'bucket-sort',
        prompt: 'Gateway or service?',
        buckets: ['Gateway', 'Service'],
        items: [
          { text: 'Check the API key', bucket: 0, why: 'Same for every request.' },
          { text: 'Rate limit per key', bucket: 0, why: 'Before any service does work.' },
          { text: 'Route /orders to the orders service', bucket: 0, why: 'Routing is its job.' },
          { text: 'Compute an order\'s discount', bucket: 1, why: 'Business logic.' },
          { text: 'Decide whether a refund is allowed', bucket: 1, why: 'Business rule.' },
        ],
        explain: 'Cross-cutting concerns at the edge; rules in the services.',
      },
      {
        id: 's9-7-2',
        type: 'diagram',
        prompt: 'Where can the API key be checked once for every service?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Apps' },
            { id: 'g', kind: 'lb', label: 'Gateway' },
            { id: 'o', kind: 'service', label: 'Orders' },
            { id: 'u', kind: 'service', label: 'Users' },
          ],
          edges: [
            { from: 'c', to: 'g' },
            { from: 'g', to: 'o' },
            { from: 'g', to: 'u' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'g',
          why: {
            c: 'Clients cannot be trusted to check themselves.',
            o: 'Only orders traffic reaches it.',
            u: 'Only users traffic reaches it.',
          },
        },
        explain: 'Every request passes the gateway.',
      },
      {
        id: 's9-7-3',
        type: 'mcq',
        prompt: 'What is the main risk of a gateway?',
        options: [
          { text: 'Every request depends on it' },
          { text: 'Services become insecure', why: 'Security improves; availability is the risk.' },
          { text: 'It makes URLs longer', why: 'URLs stay the same.' },
        ],
        answer: 0,
        explain: 'Run several instances behind a load balancer, and keep it thin.',
      },
      {
        id: 's9-7-4',
        type: 'predict-output',
        prompt: 'The gateway routes by path prefix. What does this print?',
        code: `routes = {"/orders": "orders-svc",
          "/users": "users-svc"}
def upstream(path):
    for prefix, svc in routes.items():
        if path.startswith(prefix):
            return svc
    return 404

a = upstream("/users/9")
print(a, upstream("/cart"))`,
        answer: 'users-svc 404',
        typedWrong: [{ answer: 'users-svc None', why: 'No prefix matches, so the loop ends and 404 is returned.' }],
        explain: 'Unknown paths stop at the gateway.',
      },
      {
        id: 's9-7-5',
        type: 'scenario',
        prompt: 'Twelve services each check login tokens their own way; two had security bugs this year. What do you do?',
        situation: 'Teams copy the token check between services.',
        needs: ['One correct check for all services'],
        options: [
          {
            text: 'Check tokens once at the gateway',
            cost: 'The gateway must be highly available.',
          },
          {
            text: 'Fix the two buggy services',
            cost: 'Little work now.',
            why: 'Twelve copies drift; the next one will have a bug too.',
          },
        ],
        answer: 0,
        explain: 'The gateway passes the verified user id downstream; services still decide what that user may do.',
      },
      {
        id: 's9-7-6',
        type: 'mcq',
        prompt: 'What does "TLS termination at the gateway" mean?',
        options: [
          { text: 'HTTPS is decrypted at the edge' },
          { text: 'HTTPS is switched off', why: 'Clients still use HTTPS to the gateway.' },
          { text: 'Certificates live in every service', why: 'The point is to manage them in one place.' },
        ],
        answer: 0,
        explain: 'Inside, traffic may be re-encrypted (mutual TLS) or sent on a private network.',
      },
      {
        id: 's9-7-7',
        type: 'order-steps',
        prompt: 'A request passes through the gateway. Put it in order.',
        steps: [
          'Decrypt the HTTPS connection',
          'Check the API key',
          'Check the rate limit for that key',
          'Route to the orders service',
          'Log the response and return it',
        ],
        explain: 'Cheap rejections first: no key, no work.',
      },
      {
        id: 's9-7-8',
        type: 'fill-blank',
        prompt: 'An unknown API key: we do not know who this is.',
        code: `KEYS = {"k-123": "acme"}
def gateway(key):
    if key not in KEYS:
        return ___
    return "forward: " + KEYS[key]

print(gateway("bad"))`,
        answer: ['401'],
        distractors: [
          { text: '403', why: 'Forbidden means a known caller who may not do this.' },
          { text: '200', why: 'The request was not accepted.' },
        ],
        expectOutput: '401',
        explain: 'Not authenticated: 401.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's9-08',
    title: 'Monolith or microservices',
    summary: 'A monolith is simplest to build and run; microservices buy independent teams at a large operational cost.',
    card: {
      title: 'Monolith or microservices',
      text: 'A monolith is one deployable application: simple to build, test and deploy, with in-process calls and single database transactions. Microservices split it into services that teams deploy and scale on their own, paid for with network calls that fail, data spread over many databases and far more to operate. Start with a well-structured monolith, and split out a service when a team or a scaling need clearly demands it.',
    },
    exercises: [
      {
        id: 's9-8-1',
        type: 'bucket-sort',
        prompt: 'Which does each situation favour?',
        buckets: ['Monolith', 'Microservices'],
        items: [
          { text: 'Four engineers building a new product', bucket: 0, why: 'Speed matters; the overhead would dominate.' },
          { text: '200 engineers waiting on one release', bucket: 1, why: 'Teams need to ship independently.' },
          { text: 'One part needs GPUs, the rest does not', bucket: 1, why: 'Scale and host that part separately.' },
          { text: 'Orders and stock need one transaction', bucket: 0, why: 'One database makes it simple.' },
          { text: 'Nobody knows yet what the product is', bucket: 0, why: 'Boundaries drawn now will be wrong.' },
        ],
        explain: 'Microservices solve organisational and scaling problems you may not have yet.',
      },
      {
        id: 's9-8-2',
        type: 'estimate',
        prompt: 'A page makes 20 service calls one after another, each a data-centre round trip. How much time do the calls add?',
        expr: '20 * DC_ROUND_TRIP * 1000',
        answer: 10,
        tolerance: 1.5,
        unit: 'ms',
        options: [
          { value: 1, why: 'Each round trip is 0.5 ms: 20 × 0.5.' },
          { value: 10 },
          { value: 100, why: '0.5 ms each, not 5 ms.' },
        ],
        work: ['20 × 0.5 ms = 10 ms'],
        explain: 'In a monolith those were function calls costing nanoseconds. Make independent calls in parallel.',
      },
      {
        id: 's9-8-3',
        type: 'mcq',
        prompt: 'What does a service call have that a function call never had?',
        options: [
          { text: 'Network failures and latency' },
          { text: 'Shared memory between parts', why: 'Services share no memory.' },
          { text: 'One deploy for everything', why: 'That is the monolith.' },
        ],
        answer: 0,
        explain: 'Every call needs a timeout and a plan for failure.',
      },
      {
        id: 's9-8-4',
        type: 'scenario',
        prompt: 'A five-person startup plans twenty microservices from day one. What do you suggest?',
        situation: 'They must ship features weekly to find customers.',
        needs: ['Ship features fast', 'Room to split later'],
        options: [
          {
            text: 'A modular monolith',
            cost: 'Discipline about module boundaries.',
          },
          {
            text: 'Twenty microservices now',
            cost: 'Pipelines, monitoring and tracing for each.',
            why: 'Five people spend their time running services, not building product.',
          },
        ],
        answer: 0,
        explain: 'Clean modules inside one app can become services later, once boundaries are known.',
      },
      {
        id: 's9-8-5',
        type: 'mcq',
        prompt: 'Along which lines should services be split?',
        options: [
          { text: 'Business capabilities' },
          { text: 'Technical layers of the code', why: 'A UI, logic and database split makes every feature touch every service.' },
          { text: 'One per table', why: 'Chatty calls, and transactions across services.' },
        ],
        answer: 0,
        explain: 'Orders, payments, catalogue: each owned by one team with its own data.',
      },
      {
        id: 's9-8-6',
        type: 'predict-output',
        prompt: 'A request needs 5 services in a chain, each up 99.9% of the time. How available is the request (%)?',
        code: `a = 0.999 ** 5
print(round(a * 100, 2))`,
        answer: '99.5',
        typedWrong: [{ answer: '99.9', why: 'All five must be up: the availabilities multiply.' }],
        explain: 'Each dependency in the chain takes a little off.',
      },
      {
        id: 's9-8-7',
        type: 'mcq',
        prompt: 'What problem do microservices mainly solve?',
        options: [
          { text: 'Teams blocking each other' },
          { text: 'Code that runs slowly', why: 'Network calls usually make it slower.' },
          { text: 'Too few servers', why: 'A monolith can run on many servers too.' },
        ],
        answer: 0,
        explain: 'Independent deploys per team, and scaling parts separately.',
      },
      {
        id: 's9-8-8',
        type: 'fill-blank',
        prompt: 'Five dependencies at 99.9% each: multiply them.',
        code: `services = 5
avail = 0.999 ___ services
print(round(avail, 4))`,
        answer: ['**'],
        distractors: [{ text: '*', why: '0.999 × 5 = 4.995: not a probability.' }],
        expectOutput: '0.995',
        explain: 'About 3.6 hours down a month instead of 43 minutes.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's9-09',
    title: 'Service discovery',
    summary: 'Instances register under a name; health checks remove dead ones; callers look up live addresses.',
    card: {
      title: 'Service discovery',
      text: 'Instances come and go as they scale, crash and redeploy, so their addresses cannot be written into configuration. Each instance registers under a service name (or the platform registers it), health checks remove the ones that stop answering, and callers look up live addresses by name. The lookup can be DNS, a client library that asks the registry, or a load balancer that asks on the caller\'s behalf.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'service', label: 'Checkout' },
          { id: 'r', kind: 'service', label: 'Registry' },
          { id: 'a', kind: 'service', label: 'Orders A' },
          { id: 'b', kind: 'service', label: 'Orders B' },
        ],
        edges: [
          { from: 'c', to: 'r', label: 'lookup' },
          { from: 'a', to: 'r', label: 'register', dashed: true },
          { from: 'b', to: 'r', label: 'register', dashed: true },
          { from: 'c', to: 'a', label: 'call' },
        ],
      },
    },
    exercises: [
      {
        id: 's9-9-1',
        type: 'order-steps',
        prompt: 'A new instance joins and gets traffic. Put it in order.',
        steps: [
          'A new orders instance starts',
          'It registers "orders" with its address',
          'It passes its health checks',
          'Checkout looks up "orders"',
          'Checkout gets the live addresses and picks one',
        ],
        explain: 'No configuration was edited.',
      },
      {
        id: 's9-9-2',
        type: 'predict-output',
        prompt: 'The registry marks each instance healthy or not. What does the lookup return?',
        code: `registry = {
    "orders": [("10.0.0.5", True),
               ("10.0.0.6", False),
               ("10.0.0.7", True)],
}
def lookup(name):
    xs = registry[name]
    return [a for a, up in xs if up]

print(lookup("orders"))`,
        answer: "['10.0.0.5', '10.0.0.7']",
        typedWrong: [{ answer: "['10.0.0.5', '10.0.0.6', '10.0.0.7']", why: '10.0.0.6 failed its health check.' }],
        explain: 'Callers only see instances that answer.',
      },
      {
        id: 's9-9-3',
        type: 'mcq',
        prompt: 'Why not write the orders service\'s IP addresses into checkout\'s config?',
        options: [
          { text: 'Instances move and change' },
          { text: 'IP addresses are secret', why: 'They are not; they are just not stable.' },
          { text: 'Configs cannot hold lists', why: 'They can; the list would go out of date.' },
        ],
        answer: 0,
        explain: 'Autoscaling and redeploys change addresses many times a day.',
      },
      {
        id: 's9-9-4',
        type: 'match-pairs',
        prompt: 'Match each discovery style to how it works.',
        pairs: [
          { left: 'Client-side', right: 'caller asks the registry, picks', why: 'A library in the caller does it.' },
          { left: 'Server-side', right: 'a balancer looks up for it', why: 'The caller just calls one address.' },
          { left: 'DNS', right: 'the name resolves to live IPs', why: 'Familiar, but answers are cached.' },
        ],
        explain: 'Platforms like Kubernetes give you DNS names backed by health-checked endpoints.',
      },
      {
        id: 's9-9-5',
        type: 'mcq',
        prompt: 'What is the main drawback of DNS-based discovery?',
        options: [
          { text: 'Cached answers go stale' },
          { text: 'DNS cannot hold IPs', why: 'Holding IPs is what DNS does.' },
          { text: 'It only works for websites', why: 'Any client can resolve names.' },
        ],
        answer: 0,
        explain: 'Callers may keep using a dead address until the cached answer expires (its TTL).',
      },
      {
        id: 's9-9-6',
        type: 'scenario',
        prompt: 'An orders instance hangs: its process is alive but it never answers. Callers keep getting it. Fix?',
        situation: 'The registry only checks that the process exists.',
        needs: ['Hung instances stop getting traffic'],
        options: [
          {
            text: 'Health check a real endpoint',
            cost: 'A small /health handler and check traffic.',
          },
          {
            text: 'Restart instances every hour',
            cost: 'Brief capacity dips.',
            why: 'Up to an hour of failed calls each time one hangs.',
          },
        ],
        answer: 0,
        explain: 'Check that it answers, not just that it exists.',
      },
      {
        id: 's9-9-7',
        type: 'diagram',
        prompt: 'Which part tells checkout where the orders instances are?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'service', label: 'Checkout' },
            { id: 'r', kind: 'service', label: 'Registry' },
            { id: 'a', kind: 'service', label: 'Orders A' },
            { id: 'b', kind: 'service', label: 'Orders B' },
          ],
          edges: [
            { from: 'c', to: 'r' },
            { from: 'a', to: 'r' },
            { from: 'b', to: 'r' },
            { from: 'c', to: 'a' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'r',
          why: {
            c: 'Checkout is the one asking.',
            a: 'An instance knows only its own address.',
            b: 'An instance knows only its own address.',
          },
        },
        explain: 'The registry holds every live instance.',
      },
      {
        id: 's9-9-8',
        type: 'fill-blank',
        prompt: 'Round robin over the live addresses.',
        code: `ips = ["10.0.0.5", "10.0.0.7"]
def pick(n):
    return ips[n ___ len(ips)]

print(pick(0), pick(2), pick(3))`,
        answer: ['%'],
        distractors: [{ text: '//', why: 'That sticks on one address for long stretches.' }],
        expectOutput: '10.0.0.5 10.0.0.5 10.0.0.7',
        explain: 'Requests alternate across instances.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's9-10',
    title: 'Checkpoint: APIs and service boundaries',
    summary: 'API styles, pagination, versioning, idempotency keys, rate limits, gateways, service boundaries and discovery, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's9-10-1',
        type: 'figure',
        prompt: 'The limit is 4 a second, but 8 slip through around the 1 s mark. Pick the algorithm that holds the limit.',
        figure: { kind: 'limiter', times: [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3], algorithm: 'fixed', algorithms: ['fixed', 'sliding'], limit: 4, goal: { maxPerSecond: 4 } },
        explain: 'A sliding window counts the last second from each request.',
      },
      {
        id: 's9-10-2',
        type: 'mcq',
        prompt: 'Internal calls between your own services, where speed and types matter. Which style?',
        options: [
          { text: 'gRPC' },
          { text: 'GraphQL', why: 'Built for clients choosing fields, not service-to-service speed.' },
          { text: 'HTML forms', why: 'For browsers and people.' },
        ],
        answer: 0,
        explain: 'Binary messages, generated typed clients.',
      },
      {
        id: 's9-10-3',
        type: 'predict-output',
        prompt: 'Offset paging while two new posts arrive. What does page 2 show?',
        code: `posts = [6, 5, 4, 3, 2, 1]
page1 = posts[0:2]
posts[:0] = [8, 7]   # 2 new posts
print(posts[2:4])`,
        answer: '[6, 5]',
        typedWrong: [{ answer: '[4, 3]', why: 'Two new posts pushed everything down by two.' }],
        explain: 'Page 2 repeats page 1: use a cursor.',
      },
      {
        id: 's9-10-4',
        type: 'bucket-sort',
        prompt: 'Safe or breaking for existing clients?',
        buckets: ['Safe', 'Breaking'],
        items: [
          { text: 'Add an optional response field', bucket: 0, why: 'Ignored by old clients.' },
          { text: 'Remove a response field', bucket: 1, why: 'Old clients expect it.' },
          { text: 'Add a new endpoint', bucket: 0, why: 'Nobody depends on it yet.' },
          { text: 'Change a date from text to a number', bucket: 1, why: 'Old parsers fail.' },
          { text: 'Require a header that was optional', bucket: 1, why: 'Old requests are rejected.' },
        ],
        explain: 'Add freely; anything else needs a new version.',
      },
      {
        id: 's9-10-5',
        type: 'mcq',
        prompt: 'A POST times out and the app retries. What makes the retry safe?',
        options: [
          { text: 'The same idempotency key' },
          { text: 'A fresh idempotency key', why: 'A new key looks like a new request.' },
          { text: 'Waiting a little longer', why: 'Timing does not prevent a double charge.' },
        ],
        answer: 0,
        explain: 'The server replays the stored result.',
      },
      {
        id: 's9-10-6',
        type: 'figure',
        prompt: 'A client sends 2 requests a second. The bucket holds 1 token. Set the refill so none is rejected.',
        figure: { kind: 'limiter', times: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5], algorithm: 'bucket', limit: 1, rate: 1, controls: ['rate'], goal: { minAllowed: 10 } },
        explain: 'The refill must match the client\'s average rate.',
      },
      {
        id: 's9-10-7',
        type: 'scenario',
        prompt: 'A team of six builds a new marketplace. Monolith or microservices?',
        situation: 'Features change weekly; the domain is not settled.',
        needs: ['Move fast', 'Split later if needed'],
        options: [
          {
            text: 'Modular monolith',
            cost: 'Care to keep modules separate.',
          },
          {
            text: 'Microservices',
            cost: 'Infrastructure per service.',
            why: 'The boundaries will be wrong and expensive to move.',
          },
        ],
        answer: 0,
        explain: 'Split when teams or scaling demand it.',
      },
      {
        id: 's9-10-8',
        type: 'order-steps',
        prompt: 'Through the gateway, in order.',
        steps: ['Decrypt HTTPS', 'Check the API key', 'Check the rate limit', 'Route to the service'],
        explain: 'Cheap rejections first.',
      },
      {
        id: 's9-10-9',
        type: 'fill-blank',
        prompt: 'Return only healthy instances.',
        code: `insts = [("a", True), ("b", False)]
live = [n for n, ok in insts if ___]
print(live)`,
        answer: ['ok'],
        distractors: [{ text: 'n', why: 'Every name is truthy: the dead instance is included.' }],
        expectOutput: "['a']",
        explain: 'Health checks keep dead instances out of the lookup.',
      },
      {
        id: 's9-10-10',
        type: 'mcq',
        prompt: 'A fixed window of 100 a minute. At most how many can pass in one real minute?',
        options: [
          { text: '200' },
          { text: '100', why: '100 just before a boundary and 100 just after.' },
          { text: '101', why: 'A full window either side of the boundary.' },
        ],
        answer: 0,
        explain: 'Twice the limit, straddling the boundary.',
      },
    ],
  },
];
