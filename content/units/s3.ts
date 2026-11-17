import { s3Labs } from '../labs/s3';
import { s3Library } from '../library/s3';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s3More } from './s3-more';

/*
 * S3 Scaling out. Lessons 1-4 here: vertical against horizontal, stateless
 * servers, load-balancing algorithms (balancer figure), health checks.
 * Lessons 5-8 in s3-more.ts: single points of failure, autoscaling and its
 * lag, keeping a user on one server (hashing), checkpoint.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's3-01',
    title: 'Bigger or more',
    summary: 'Scale up with a bigger machine until it stops being simple; scale out with more machines behind a balancer.',
    card: {
      title: 'Bigger or more',
      text: 'When one server is not enough, you can buy a bigger one (vertical scaling, or scaling up) or add more of the same behind a load balancer (horizontal scaling, or scaling out). Bigger is simpler but has a ceiling and is still one machine that can fail. More machines grow almost without limit, but only if any of them can handle any request.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Users' },
          { id: 'l', kind: 'lb', label: 'Balancer' },
          { id: 'o', kind: 'service', label: 'Server' },
          { id: 'a', kind: 'service', label: 'App 1' },
          { id: 'b', kind: 'service', label: 'App 2' },
          { id: 'x', kind: 'service', label: 'App 3' },
          { id: 'd', kind: 'db', label: 'Database' },
        ],
        edges: [
          { from: 'c', to: 'l' },
          { from: 'c', to: 'o' },
          { from: 'o', to: 'd' },
          { from: 'l', to: 'a' },
          { from: 'l', to: 'b' },
          { from: 'l', to: 'x' },
          { from: 'a', to: 'd' },
          { from: 'b', to: 'd' },
          { from: 'x', to: 'd' },
        ],
        stages: [
          { nodes: ['c', 'o', 'd'], caption: 'One app server: simple, and one machine to fail.' },
          { nodes: ['c', 'l', 'a', 'b', 'd'], caption: 'A balancer and two servers: either can serve.' },
          { nodes: ['c', 'l', 'a', 'b', 'x', 'd'], caption: 'Add a third when traffic grows.' },
        ],
      },
    },
    exercises: [
      {
        id: 's3-1-1',
        type: 'bucket-sort',
        prompt: 'Vertical or horizontal scaling?',
        buckets: ['Bigger machine', 'More machines'],
        items: [
          { text: 'No code changes needed', bucket: 0, why: 'The same program runs on a bigger box.' },
          { text: 'Has a hard ceiling', bucket: 0, why: 'There is a largest machine you can buy.' },
          { text: 'Survives one machine dying', bucket: 1, why: 'The others keep serving.' },
          { text: 'Needs a load balancer', bucket: 1, why: 'Something must spread requests across the copies.' },
          { text: 'Servers must not keep user state', bucket: 1, why: 'Any copy may get any request.' },
          { text: 'Gets pricier faster than it grows', bucket: 0, why: 'The largest machines cost far more per core.' },
        ],
        explain: 'Most systems scale up first and out later.',
      },
      {
        id: 's3-1-2',
        type: 'scenario',
        prompt: 'The single database server is at 80% CPU. What do you do first?',
        situation: 'A young product, 300 requests/s, one database server with 8 cores. Growth is steady, about 10% a month.',
        needs: ['Headroom for the next year', 'Little engineering time'],
        options: [
          {
            text: 'Move to a bigger database machine',
            cost: 'A higher monthly bill and a short planned switch-over.',
          },
          {
            text: 'Split the data across 4 databases',
            cost: 'Months of work and harder queries.',
            why: 'Far more effort than the needs justify; a bigger machine buys a year.',
          },
          {
            text: 'Do nothing yet',
            cost: 'Nothing today.',
            why: 'At 10% a month it is full within a few months.',
          },
        ],
        answer: 0,
        explain: 'Scale up while it is cheap and simple; split data (S6) when one machine truly cannot cope.',
      },
      {
        id: 's3-1-3',
        type: 'estimate',
        prompt: 'Peak traffic is 9,000 requests/s; one app server handles 1,200/s. How many servers, plus one spare?',
        expr: '-(-9000 // 1200) + 1',
        answer: 9,
        tolerance: 1.2,
        unit: 'servers',
        work: ['9,000 ÷ 1,200 = 7.5, round up to 8', '8 + 1 spare = 9'],
        explain: 'Horizontal scaling turns capacity into simple division.',
      },
      {
        id: 's3-1-4',
        type: 'mcq',
        prompt: 'Why can app servers be scaled out more easily than the database?',
        options: [
          { text: 'They keep no data of their own' },
          { text: 'They use less memory', why: 'Memory is not the issue; shared data is.' },
          { text: 'Databases cannot run on two machines', why: 'They can (S6), but copies of data must be kept in step.' },
        ],
        answer: 0,
        explain: 'Copies of a stateless program are interchangeable; copies of data are not.',
      },
      {
        id: 's3-1-5',
        type: 'diagram',
        prompt: 'Traffic doubles. Which box can you NOT fix just by adding identical copies?',
        diagram: {
          nodes: [
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'App 1' },
            { id: 'b', kind: 'service', label: 'App 2' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'a', to: 'd' },
            { from: 'b', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'd',
          why: {
            l: 'Balancers are simple to run in pairs or as a managed service.',
            a: 'Another identical app server just joins the pool.',
            b: 'Another identical app server just joins the pool.',
          },
        },
        explain: 'Two independent databases would disagree; S6 covers replicas and sharding.',
      },
      {
        id: 's3-1-6',
        type: 'predict-output',
        prompt: 'Servers needed at each traffic level. What does this print?',
        code: `import math

def need(rps, per_server=1000):
    return math.ceil(rps / per_server)

print([need(r) for r in
       (800, 1000, 2500)])`,
        answer: '[1, 1, 3]',
        typedWrong: [{ answer: '[1, 1, 2]', why: '2,500 needs 2.5 servers: round up to 3.' }],
        explain: 'Always round up: half a server does not exist.',
      },
      {
        id: 's3-1-7',
        type: 'mcq',
        prompt: 'The biggest machine you can buy still is not enough. What now?',
        options: [
          { text: 'Scale out' },
          { text: 'Optimise nothing, wait', why: 'Traffic will not wait.' },
          { text: 'Buy two of the biggest and hope', why: 'Two machines need a way to share work: that is scaling out.' },
        ],
        answer: 0,
        explain: 'The ceiling of scaling up is why large systems are built from many ordinary machines.',
      },
      {
        id: 's3-1-8',
        type: 'order-steps',
        prompt: 'A typical growth path. Put it in order.',
        steps: [
          'One server runs the app and the database',
          'The database moves to its own machine',
          'A balancer spreads traffic over several app servers',
          'The database gets read replicas',
          'The data is split across several databases',
        ],
        explain: 'Each step solves the bottleneck the previous one exposed, and costs more complexity.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's3-02',
    title: 'Stateless servers',
    summary: 'Keep user state out of app servers, in a shared store, so any server can handle any request.',
    card: {
      title: 'Stateless servers',
      text: 'If a server keeps your login session in its own memory, the next request may go to another server that has never heard of you. Stateless servers keep nothing between requests: sessions, carts and uploads live in a shared store such as a cache or a database. Then servers can be added, removed or restarted at any time.',
      diagram: {
        nodes: [
          { id: 'l', kind: 'lb', label: 'Balancer' },
          { id: 'a', kind: 'service', label: 'App 1' },
          { id: 'b', kind: 'service', label: 'App 2' },
          { id: 's', kind: 'cache', label: 'Sessions' },
          { id: 'd', kind: 'db', label: 'Database' },
        ],
        edges: [
          { from: 'l', to: 'a' },
          { from: 'l', to: 'b' },
          { from: 'a', to: 's' },
          { from: 'b', to: 's' },
          { from: 'a', to: 'd' },
          { from: 'b', to: 'd' },
        ],
      },
    },
    exercises: [
      {
        id: 's3-2-1',
        type: 'predict-output',
        prompt: 'Each server keeps sessions in its own dict. The second request lands on server 1. What does this print?',
        code: `servers = [{}, {}]

def login(s, user):
    servers[s][user] = "logged in"

def whoami(s, user):
    return servers[s].get(user, "?")

login(0, "ana")
print(whoami(1, "ana"))`,
        answer: '?',
        typedWrong: [{ answer: 'logged in', why: 'Ana logged in on server 0; server 1 has its own empty dict.' }],
        explain: 'To the user it looks like being logged out at random.',
      },
      {
        id: 's3-2-2',
        type: 'predict-output',
        prompt: 'Now both servers share one session store. What does this print?',
        code: `shared = {}

def login(s, user):
    shared[user] = "logged in"

def whoami(s, user):
    return shared.get(user, "?")

login(0, "ana")
print(whoami(1, "ana"))`,
        answer: 'logged in',
        typedWrong: [{ answer: '?', why: 'Both servers read the same shared store.' }],
        explain: 'The server number no longer matters: that is statelessness.',
      },
      {
        id: 's3-2-3',
        type: 'diagram',
        prompt: 'Sessions must survive any app server restarting. What goes in the empty slot?',
        diagram: {
          nodes: [
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'App 1' },
            { id: 'b', kind: 'service', label: 'App 2' },
            { id: 's', kind: 'cache', label: 'Sessions' },
          ],
          edges: [
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'a', to: 's' },
            { from: 'b', to: 's' },
          ],
        },
        goal: {
          kind: 'slot',
          slot: 's',
          options: [
            { kind: 'cache', label: 'Shared cache' },
            { kind: 'queue', label: 'Queue', why: 'A queue hands work on once; it is not looked up by key.' },
            { kind: 'cdn', label: 'CDN', why: 'A CDN caches public files near users, not private sessions.' },
          ],
          answer: 0,
        },
        explain: 'An in-memory store shared by all app servers, often Redis; a database works too, more slowly.',
      },
      {
        id: 's3-2-4',
        type: 'bucket-sort',
        prompt: 'Fine to keep in one app server\'s memory, or must be shared?',
        buckets: ['Per server', 'Shared'],
        items: [
          { text: 'A login session', bucket: 1, why: 'The next request may hit another server.' },
          { text: 'A shopping cart', bucket: 1, why: 'Losing it on a restart loses sales.' },
          { text: 'A compiled template cache', bucket: 0, why: 'Each server can rebuild it; nothing is lost.' },
          { text: 'An uploaded file', bucket: 1, why: 'Other servers must be able to serve it: object storage.' },
          { text: 'Config read at start-up', bucket: 0, why: 'Every server reads the same config itself.' },
        ],
        explain: 'If losing it hurts a user, it does not belong in one server\'s memory.',
      },
      {
        id: 's3-2-5',
        type: 'scenario',
        prompt: 'Users are logged out at random. What is the fix?',
        situation: 'You added a second app server last week. Since then users are sometimes logged out mid-visit.',
        needs: ['Keep both servers', 'Sessions survive restarts and deploys'],
        options: [
          {
            text: 'Move sessions to a shared store',
            cost: 'One more service to run, a little latency per request.',
          },
          {
            text: 'Pin each user to one server',
            cost: 'Uneven load, and a restart still logs those users out.',
            why: 'It breaks the "survive restarts" need.',
          },
          {
            text: 'Go back to one server',
            cost: 'Half the capacity, one machine to fail.',
            why: 'The needs keep both servers.',
          },
        ],
        answer: 0,
        explain: 'Pinning (lesson 7) is a workaround; a shared store is the fix.',
      },
      {
        id: 's3-2-6',
        type: 'mcq',
        prompt: 'What does "stateless" mean for an app server?',
        options: [
          { text: 'Nothing kept between requests' },
          { text: 'It has no database', why: 'It uses databases; it just keeps nothing itself.' },
          { text: 'It never stores anything anywhere', why: 'State exists; it lives in shared stores.' },
        ],
        answer: 0,
        explain: 'Each request carries or looks up everything it needs.',
      },
      {
        id: 's3-2-7',
        type: 'fill-blank',
        prompt: 'Both servers read sessions from the same place.',
        code: `local = [{}, {}]
shared = {}

def save(s, user):
    shared[user] = 1

def logged_in(s, user):
    return user in ___

save(0, "bo")
print(logged_in(1, "bo"))`,
        answer: ['shared'],
        distractors: [{ text: 'local[s]', why: 'Server 1\'s own dict never saw the login.' }],
        expectOutput: 'True',
        explain: 'Write and read the same shared store.',
      },
      {
        id: 's3-2-8',
        type: 'mcq',
        prompt: 'A user uploads a photo to app server 2; a moment later another server must show it. Where should the upload go?',
        options: [
          { text: 'Object storage' },
          { text: 'Server 2\'s local disk', why: 'Other servers cannot read it, and it dies with the server.' },
          { text: 'A session cookie', why: 'Cookies hold a few KB and travel with every request.' },
        ],
        answer: 0,
        explain: 'Any server can then fetch it by its key.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's3-03',
    title: 'Load-balancing algorithms',
    summary: 'Round robin takes turns; least connections sends work to the least busy server.',
    card: {
      title: 'Load-balancing algorithms',
      text: 'A load balancer receives every request and picks a server for it. Round robin simply takes turns, which works when requests cost about the same. When some requests take much longer, least connections sends each new one to the server with the fewest in progress.',
      figure: {
        kind: 'balancer',
        servers: 3,
        requests: [
          { user: 'A', cost: 1 },
          { user: 'B', cost: 1 },
          { user: 'C', cost: 1 },
          { user: 'D', cost: 1 },
          { user: 'E', cost: 1 },
          { user: 'F', cost: 1 },
        ],
        algorithm: 'round-robin',
      },
    },
    exercises: [
      {
        id: 's3-3-1',
        type: 'figure',
        prompt: 'Long requests (the small numbers) keep piling onto one server. Find the algorithm that keeps every server to one request at a time.',
        figure: {
          kind: 'balancer',
          servers: 3,
          requests: [
            { user: 'A', cost: 6 },
            { user: 'B', cost: 1 },
            { user: 'C', cost: 1 },
            { user: 'D', cost: 6 },
            { user: 'E', cost: 1 },
            { user: 'F', cost: 1 },
            { user: 'G', cost: 6 },
            { user: 'H', cost: 1 },
            { user: 'I', cost: 1 },
          ],
          algorithm: 'round-robin',
          algorithms: ['round-robin', 'least-conn'],
          goal: { maxPeak: 1 },
        },
        explain: 'Least connections sees that server 1 is still busy and sends new work elsewhere.',
      },
      {
        id: 's3-3-2',
        type: 'predict-output',
        prompt: 'Round robin over 3 servers. Where do 7 requests go?',
        code: `n = 3
print([i % n for i in range(7)])`,
        answer: '[0, 1, 2, 0, 1, 2, 0]',
        typedWrong: [{ answer: '[1, 2, 3, 1, 2, 3, 1]', why: 'Servers are numbered from 0 here.' }],
        explain: 'Turn after turn, ignoring how busy each server is.',
      },
      {
        id: 's3-3-3',
        type: 'predict-output',
        prompt: 'Least connections. Which server gets the next request?',
        code: `active = [4, 1, 3]
print(active.index(min(active)))`,
        answer: '1',
        typedWrong: [{ answer: '0', why: 'Server 0 has the most requests in progress.' }],
        explain: 'Server 1 has only one request in progress.',
      },
      {
        id: 's3-3-4',
        type: 'scenario',
        prompt: 'Which algorithm for this service?',
        situation: 'A report service: most requests take 50 ms, but some take 30 s. All servers are identical.',
        needs: ['No server buried under slow reports', 'Simple to run'],
        options: [
          {
            text: 'Least connections',
            cost: 'The balancer must track requests in progress.',
          },
          {
            text: 'Plain round robin',
            cost: 'Nothing to track.',
            why: 'It keeps sending turns to a server stuck on 30-second reports.',
          },
          {
            text: 'Pick a random server',
            cost: 'Nothing to track.',
            why: 'Like round robin, it ignores how busy each server is.',
          },
        ],
        answer: 0,
        explain: 'Uneven request costs are exactly what least connections is for.',
      },
      {
        id: 's3-3-5',
        type: 'mcq',
        prompt: 'When is round robin a fine choice?',
        options: [
          { text: 'Requests cost about the same' },
          { text: 'Requests vary from 1 ms to 1 minute', why: 'Then some servers get buried: use least connections.' },
          { text: 'Servers have different sizes', why: 'Then you need weights, or least connections.' },
        ],
        answer: 0,
        explain: 'Simple, stateless and even when the work is even.',
      },
      {
        id: 's3-3-6',
        type: 'fill-blank',
        prompt: 'Pick the least busy server.',
        code: `active = {"s1": 5, "s2": 2, "s3": 4}
best = ___(active, key=active.get)
print(best)`,
        answer: ['min'],
        distractors: [{ text: 'max', why: 'That picks the busiest server.' }],
        expectOutput: 's2',
        explain: 'min over the keys, compared by their counts.',
      },
      {
        id: 's3-3-7',
        type: 'diagram',
        prompt: 'Tap the box that decides which app server gets each request.',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Users' },
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'App 1' },
            { id: 'b', kind: 'service', label: 'App 2' },
          ],
          edges: [
            { from: 'c', to: 'l' },
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'l',
          why: {
            c: 'Users send to one address; they do not know about the servers.',
            a: 'App servers only answer what they receive.',
            b: 'App servers only answer what they receive.',
          },
        },
        explain: 'One public address in front, many servers behind.',
      },
      {
        id: 's3-3-8',
        type: 'mcq',
        prompt: 'One server is twice as powerful as the other two. What should round robin become?',
        options: [
          { text: 'Weighted round robin' },
          { text: 'Plain round robin', why: 'Equal turns leave the big server half idle.' },
          { text: 'Send it everything', why: 'Then the other two do nothing.' },
        ],
        answer: 0,
        explain: 'Weighted round robin gives each server turns in proportion to its size.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's3-04',
    title: 'Health checks',
    summary: 'The balancer pings each server and stops sending traffic to one that fails its checks.',
    card: {
      title: 'Health checks',
      text: 'A balancer that keeps sending requests to a dead server makes users see errors. Health checks fix that: the balancer asks each server "are you OK?" every few seconds and takes a server out of rotation after a few failed answers. When it passes again, it goes back in.',
    },
    exercises: [
      {
        id: 's3-4-1',
        type: 'figure',
        prompt: 'Server 2 is down and a third of the requests fail. Make the failures stop.',
        figure: {
          kind: 'balancer',
          servers: 3,
          requests: [
            { user: 'A', cost: 1 },
            { user: 'B', cost: 1 },
            { user: 'C', cost: 1 },
            { user: 'D', cost: 1 },
            { user: 'E', cost: 1 },
            { user: 'F', cost: 1 },
          ],
          algorithm: 'round-robin',
          down: [1],
          toggleHealth: true,
          goal: { noFailures: true },
        },
        explain: 'With health checks the balancer only picks from servers that answer.',
      },
      {
        id: 's3-4-2',
        type: 'order-steps',
        prompt: 'A server crashes. Put what follows in order.',
        steps: [
          'The server stops answering',
          'Its health checks fail a few times in a row',
          'The balancer takes it out of rotation',
          'Traffic goes only to the other servers',
          'The server restarts and passes its checks again',
          'The balancer puts it back',
        ],
        explain: 'Requests during the first two steps can still fail: detection takes time.',
      },
      {
        id: 's3-4-3',
        type: 'estimate',
        prompt: 'Checks every 5 s; a server is removed after 3 failures. It held a third of 900 requests/s. Roughly how many requests fail before it is removed?',
        expr: '5 * 3 * 900 / 3',
        answer: 4500,
        tolerance: 1.5,
        unit: 'requests',
        options: [
          { value: 450, why: '15 seconds × 300 requests/s is 4,500.' },
          { value: 4500 },
          { value: 45000, why: 'Only a third of the traffic went to that server.' },
        ],
        work: ['Detection: 3 checks × 5 s = 15 s', 'Its share: 900 ÷ 3 = 300 per second', '15 s × 300/s = 4,500 failed requests'],
        explain: 'Faster checks cut this, at the cost of more check traffic and false alarms.',
      },
      {
        id: 's3-4-4',
        type: 'scenario',
        prompt: 'What should the health check test?',
        situation: 'Your app\'s /health endpoint returns 200 as long as the process is running. Last night the database connection broke and every real request failed, yet health checks passed.',
        needs: ['Take broken servers out', 'Do not take every server out when the shared database blips'],
        options: [
          {
            text: 'Check the app\'s own critical parts, briefly',
            cost: 'A slightly slower check and careful timeouts.',
          },
          {
            text: 'Keep "process is running"',
            cost: 'Nothing.',
            why: 'It passed while every request failed.',
          },
          {
            text: 'Run a full order through the system',
            cost: 'Heavy checks every few seconds.',
            why: 'Too slow and heavy; a shared outage would fail every server at once.',
          },
        ],
        answer: 0,
        explain: 'Test this server\'s own ability to work (its connection pool, its disk), with a short timeout.',
      },
      {
        id: 's3-4-5',
        type: 'mcq',
        prompt: 'Why wait for several failed checks before removing a server?',
        options: [
          { text: 'To ignore one-off blips' },
          { text: 'To give users more errors', why: 'The aim is to avoid removing healthy servers.' },
          { text: 'Checks are free to repeat', why: 'They are cheap, but the reason is false alarms.' },
        ],
        answer: 0,
        explain: 'One slow answer should not shrink your capacity.',
      },
      {
        id: 's3-4-6',
        type: 'estimate',
        prompt: 'Three servers share 900 requests/s and each can take 400/s. One is removed. How many requests per second must each survivor now take?',
        expr: '900 / 2',
        answer: 450,
        tolerance: 1.2,
        unit: 'requests/s',
        options: [
          { value: 300, why: 'That was the load before the failure.' },
          { value: 450 },
          { value: 900, why: 'Two servers remain, so they split the 900.' },
        ],
        work: ['900 ÷ 2 servers = 450 each', '450 > 400: the survivors are overloaded'],
        explain: 'Health checks stop the errors from the dead server; only spare capacity stops the overload.',
      },
      {
        id: 's3-4-7',
        type: 'mcq',
        prompt: 'Health checks remove a dead server. What does that NOT give you?',
        options: [
          { text: 'Its lost capacity' },
          { text: 'Fewer errors', why: 'Errors stop once it is removed.' },
          { text: 'Automatic recovery', why: 'It returns automatically when it passes again.' },
        ],
        answer: 0,
        explain: 'The others must have room for its share: keep a spare (S2).',
      },
      {
        id: 's3-4-8',
        type: 'fill-blank',
        prompt: 'Only send to servers that pass their checks.',
        code: `up = {"s1": True, "s2": False,
      "s3": True}
pool = [s for s in up if up[___]]
print(pool)`,
        answer: ['s'],
        distractors: [{ text: '"s2"', why: 'That tests server 2 for every server.' }],
        expectOutput: "['s1', 's3']",
        explain: 'Round robin then takes turns over this pool only.',
      },
    ],
  },
];

export const s3: Unit = {
  id: 'S3',
  track: 'system-design',
  title: 'Scaling out',
  blurb: 'Bigger machines or more of them, stateless servers, load-balancing algorithms, health checks, single points of failure and autoscaling.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s3More],
  labs: s3Labs,
  library: s3Library,
};
