import type { Lesson } from '../schema';

/* S3 lessons 5 to 8: single points of failure, autoscaling and its lag,
 * keeping a user on one server, checkpoint. */

export const s3More: Lesson[] = [
  // ------------------------------------------------------------------ 5
  {
    id: 's3-05',
    title: 'Single points of failure',
    summary: 'Any one part whose failure stops everything; remove it with a second copy that can take over.',
    card: {
      title: 'Single points of failure',
      text: 'A single point of failure is any one part whose failure takes the whole system down. Find them by asking of every box: if this dies, does everything stop? The fix is a second copy that can take over, which costs money and the work of switching over.',
    },
    exercises: [
      {
        id: 's3-5-1',
        type: 'diagram',
        prompt: 'Which box is a single point of failure?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Users' },
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'App 1' },
            { id: 'b', kind: 'service', label: 'App 2' },
            { id: 'd', kind: 'db', label: 'Primary DB' },
            { id: 's', kind: 'replica', label: 'Standby DB' },
          ],
          edges: [
            { from: 'u', to: 'l' },
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'a', to: 'd' },
            { from: 'b', to: 'd' },
            { from: 'd', to: 's', label: 'copy', dashed: true },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'l',
          why: {
            u: 'Users are not part of the system.',
            a: 'App 2 keeps serving if App 1 dies.',
            b: 'App 1 keeps serving if App 2 dies.',
            d: 'The standby can take over.',
            s: 'It is the spare; losing it removes protection, not service.',
          },
        },
        explain: 'Every request passes through the one balancer. Run two, or use a managed one.',
      },
      {
        id: 's3-5-2',
        type: 'diagram',
        prompt: 'The balancers are now a pair. Which box is still a single point of failure?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Users' },
            { id: 'l', kind: 'lb', label: 'Balancer A' },
            { id: 'm', kind: 'lb', label: 'Balancer B' },
            { id: 'a', kind: 'service', label: 'App 1' },
            { id: 'b', kind: 'service', label: 'App 2' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'u', to: 'l' },
            { from: 'u', to: 'm' },
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'm', to: 'a' },
            { from: 'm', to: 'b' },
            { from: 'a', to: 'd' },
            { from: 'b', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'd',
          why: {
            u: 'Users are not part of the system.',
            l: 'Balancer B takes over.',
            m: 'Balancer A takes over.',
            a: 'App 2 takes over.',
            b: 'App 1 takes over.',
          },
        },
        explain: 'One database, no standby: when it dies, everything stops.',
      },
      {
        id: 's3-5-3',
        type: 'bucket-sort',
        prompt: 'Single point of failure, or not?',
        buckets: ['SPOF', 'Not a SPOF'],
        items: [
          { text: 'One database, no standby', bucket: 0, why: 'Its failure stops every request that needs data.' },
          { text: 'Three app servers behind a balancer', bucket: 1, why: 'Two remain if one dies.' },
          { text: 'Two balancers on one power feed', bucket: 0, why: 'The shared power feed takes both down together.' },
          { text: 'A queue run as 3 nodes', bucket: 1, why: 'A cluster survives losing a node.' },
          { text: 'Only one person can deploy', bucket: 0, why: 'People are parts of the system too.' },
        ],
        explain: 'Look for shared dependencies, not just single boxes.',
      },
      {
        id: 's3-5-4',
        type: 'estimate',
        prompt: 'One balancer at 99.9% is down about 526 minutes a year. Two independent ones, either enough: how many minutes a year are both down?',
        expr: '(1 - NINES_3) ** 2 * YEAR / MINUTE',
        answer: 0.53,
        tolerance: 2,
        unit: 'minutes',
        options: [
          { value: 0.5 },
          { value: 50, why: 'Both down needs 0.1% × 0.1% = 0.0001%, not 0.01%.' },
          { value: 263, why: 'Two copies do far better than halving the downtime.' },
        ],
        work: ['Both down: 0.001 × 0.001 = 10⁻⁶ of the time', '10⁻⁶ × 525,600 minutes ≈ 0.5 minutes'],
        explain: 'If failures are independent; shared power or software bugs break that.',
      },
      {
        id: 's3-5-5',
        type: 'scenario',
        prompt: 'What do you do about the single database?',
        situation: 'An online shop runs one database server. A hardware fault would take hours to repair.',
        needs: ['Back within minutes after a machine fault', 'Budget allows a second database server'],
        options: [
          {
            text: 'Add a standby to promote',
            cost: 'A second server and a tested failover procedure.',
          },
          {
            text: 'Take nightly backups only',
            cost: 'Cheap storage.',
            why: 'Restoring takes hours and loses the day\'s orders since the backup.',
          },
          {
            text: 'Buy a more reliable server',
            cost: 'A pricier machine.',
            why: 'It still fails sometimes, and then it takes hours.',
          },
        ],
        answer: 0,
        explain: 'Backups still matter, for mistakes and corruption; they just are not failover.',
      },
      {
        id: 's3-5-6',
        type: 'order-steps',
        prompt: 'The primary database dies. Put the failover in order.',
        steps: [
          'The primary stops answering',
          'Monitoring notices the missed heartbeats',
          'The standby is promoted to primary',
          'The apps connect to the new primary',
          'A fresh standby is set up',
        ],
        explain: 'Until the last step you have no spare: get it back quickly.',
      },
      {
        id: 's3-5-7',
        type: 'mcq',
        prompt: 'Two app servers run in the same rack with one network switch. Are they redundant?',
        options: [
          { text: 'Partly: the switch is shared' },
          { text: 'Yes: there are two servers', why: 'The shared switch can take both out at once.' },
          { text: 'No: two is never enough', why: 'Two can be enough, if they share no single part.' },
        ],
        answer: 0,
        explain: 'Spread copies across racks, and for bigger risks across zones.',
      },
      {
        id: 's3-5-8',
        type: 'mcq',
        prompt: 'What does removing a single point of failure cost?',
        options: [
          { text: 'Another copy, and switching logic' },
          { text: 'Nothing: it is free reliability', why: 'You pay for the copy and for failover.' },
          { text: 'Slower requests', why: 'Usually not; the costs are money and complexity.' },
        ],
        answer: 0,
        explain: 'Spend it where an outage costs most.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 's3-06',
    title: 'Autoscaling and its lag',
    summary: 'Add servers when load rises, remove them when it falls; new servers take minutes, so keep headroom.',
    card: {
      title: 'Autoscaling and its lag',
      text: 'Autoscaling adds servers when a measure such as CPU or requests per server rises, and removes them when it falls. New servers take minutes to start and warm up, so scale at a threshold that leaves headroom, and add capacity before peaks you can predict. Scaling down too eagerly makes the group grow and shrink back and forth.',
      code: `need = [2, 2, 6, 6, 6, 6]
lag = 2
have = [need[max(t - lag, 0)]
        for t in range(len(need))]
print(have)`,
      output: '[2, 2, 2, 2, 6, 6]',
    },
    exercises: [
      {
        id: 's3-6-1',
        type: 'predict-output',
        prompt: 'Servers arrive two steps after they are needed. For how many steps is the group short?',
        code: `need = [2, 2, 6, 6, 6, 6]
lag = 2
have = [need[max(t - lag, 0)]
        for t in range(len(need))]
short = sum(n > h for n, h
            in zip(need, have))
print(short)`,
        answer: '2',
        typedWrong: [{ answer: '0', why: 'At steps 2 and 3 the group still has 2 servers while 6 are needed.' }],
        explain: 'The lag is exactly how long users suffer after a jump.',
      },
      {
        id: 's3-6-2',
        type: 'estimate',
        prompt: 'Traffic can rise by 1,000 requests/s each minute; a new server takes 4 minutes to be ready and handles 500/s. How many servers of headroom do you keep?',
        expr: '4 * 1000 / 500',
        answer: 8,
        tolerance: 1.5,
        unit: 'servers',
        options: [
          { value: 2, why: 'In 4 minutes traffic can rise by 4,000/s: 8 servers\' worth.' },
          { value: 8 },
          { value: 32, why: '4,000 ÷ 500 is 8.' },
        ],
        work: ['Rise during start-up: 4 min × 1,000/s = 4,000/s', '4,000 ÷ 500 per server = 8 servers'],
        explain: 'Headroom covers the gap until new servers are ready.',
      },
      {
        id: 's3-6-3',
        type: 'scenario',
        prompt: 'A TV advert airs at 20:00 and traffic jumps tenfold within a minute. What do you do?',
        situation: 'Autoscaling reacts in about 5 minutes. The advert is booked for tonight at 20:00.',
        needs: ['No errors during the spike', 'Do not pay for peak capacity all day'],
        options: [
          {
            text: 'Pre-scale at 19:45',
            cost: 'A quarter of an hour of extra servers.',
          },
          {
            text: 'Rely on autoscaling',
            cost: 'Nothing extra.',
            why: 'Five minutes of tenfold traffic on the old capacity means errors.',
          },
          {
            text: 'Run at peak size all day',
            cost: 'Ten times the servers, all day.',
            why: 'That breaks the cost need.',
          },
        ],
        answer: 0,
        explain: 'Predictable peaks: scale ahead. Unpredictable ones: headroom plus autoscaling.',
      },
      {
        id: 's3-6-4',
        type: 'mcq',
        prompt: 'Why not remove servers the moment load drops?',
        options: [
          { text: 'Load often bounces back' },
          { text: 'Removing servers is slow', why: 'It is quick; the problem is needing them again minutes later.' },
          { text: 'It costs more to remove them', why: 'Removing saves money; the risk is flapping.' },
        ],
        answer: 0,
        explain: 'A cool-down period stops the group growing and shrinking back and forth.',
      },
      {
        id: 's3-6-5',
        type: 'bucket-sort',
        prompt: 'A good signal to scale web servers on?',
        buckets: ['Good signal', 'Poor signal'],
        items: [
          { text: 'CPU use per server', bucket: 0, why: 'It tracks how busy the servers are now.' },
          { text: 'Requests per second per server', bucket: 0, why: 'Directly measures load against capacity.' },
          { text: 'Jobs waiting per worker', bucket: 0, why: 'A growing backlog means too few workers.' },
          { text: 'Total registered users', bucket: 1, why: 'It only grows, and says nothing about load right now.' },
          { text: 'Size of the log files', bucket: 1, why: 'Unrelated to how busy the servers are.' },
        ],
        explain: 'Scale on a measure of current load per server.',
      },
      {
        id: 's3-6-6',
        type: 'diagram',
        prompt: 'Which box suits autoscaling best?',
        diagram: {
          nodes: [
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'App servers' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'l', to: 'a' },
            { from: 'a', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'a',
          why: {
            l: 'Managed balancers scale themselves; you rarely add balancers by load.',
            d: 'A database holds data: new copies need syncing, not just starting.',
          },
        },
        explain: 'Stateless servers can be started and stopped freely.',
      },
      {
        id: 's3-6-7',
        type: 'fill-blank',
        prompt: 'How many servers does the autoscaler want?',
        code: `import math
rps, per_server = 2600, 500
want = math.ceil(rps / ___)
print(want)`,
        answer: ['per_server'],
        distractors: [{ text: 'rps', why: 'rps ÷ rps is always 1.' }],
        expectOutput: '6',
        explain: '5.2 servers, rounded up to 6.',
      },
      {
        id: 's3-6-8',
        type: 'mcq',
        prompt: 'Why aim autoscaling at 60% CPU rather than 90%?',
        options: [
          { text: 'Headroom during start-up' },
          { text: 'Servers break above 60%', why: 'They do not; the gap absorbs rises during the lag.' },
          { text: 'It uses fewer servers', why: 'It uses more; the price of headroom.' },
        ],
        answer: 0,
        explain: 'At 90% a spike overloads everything before help arrives.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's3-07',
    title: 'Keeping a user on one server',
    summary: 'Hash the user id to pick a server: the same user always lands on the same one.',
    card: {
      title: 'Keeping a user on one server',
      text: 'Some work wants the same user on the same server every time, such as a long-lived chat connection or a per-user cache. Hashing the user id picks a server the same way every time. Plain hash-modulo-n moves most users when servers are added; consistent hashing (S6) moves few.',
    },
    exercises: [
      {
        id: 's3-7-1',
        type: 'figure',
        prompt: 'Make every user stay on one server.',
        figure: {
          kind: 'balancer',
          servers: 3,
          requests: [
            { user: 'A', cost: 2 },
            { user: 'B', cost: 2 },
            { user: 'A', cost: 2 },
            { user: 'C', cost: 2 },
            { user: 'B', cost: 2 },
            { user: 'A', cost: 2 },
            { user: 'C', cost: 2 },
            { user: 'C', cost: 2 },
          ],
          algorithm: 'round-robin',
          algorithms: ['round-robin', 'least-conn', 'hash'],
          goal: { sticky: true },
        },
        explain: 'Hashing ignores load and looks only at who is asking.',
      },
      {
        id: 's3-7-2',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def pick(user, n):
    return sum(map(ord, user)) % n

print(pick("ana", 3), pick("ana", 3))`,
        answer: '1 1',
        typedWrong: [{ answer: '1 2', why: 'Same input, same hash: the same server every time.' }],
        explain: '97 + 110 + 97 = 304, and 304 % 3 = 1.',
      },
      {
        id: 's3-7-3',
        type: 'predict-output',
        prompt: 'A fourth server is added. How many of the six users move?',
        code: `users = ["ana", "bo", "cy",
         "di", "ed", "flo"]

def pick(u, n):
    return sum(map(ord, u)) % n

moved = sum(pick(u, 3) != pick(u, 4)
            for u in users)
print(moved)`,
        answer: '5',
        typedWrong: [{ answer: '1', why: 'Changing n changes almost every remainder.' }],
        explain: 'Each moved user loses their server-side state: consistent hashing fixes this (S6).',
      },
      {
        id: 's3-7-4',
        type: 'mcq',
        prompt: 'What is the main downside of pinning users to servers?',
        options: [
          { text: 'Uneven load, fragile state' },
          { text: 'Requests get slower', why: 'Routing by hash costs almost nothing.' },
          { text: 'Users must log in twice', why: 'Pinning keeps them on one server; it does not log them out.' },
        ],
        answer: 0,
        explain: 'A few heavy users can overload their server, and its crash hurts exactly them.',
      },
      {
        id: 's3-7-5',
        type: 'scenario',
        prompt: 'How do messages reach the right connection?',
        situation: 'A chat service keeps each user\'s live connection (a WebSocket) open on one of 10 servers.',
        needs: ['A message for a user reaches the server holding their connection', 'Servers can be added later'],
        options: [
          {
            text: 'Route by user (hash ring)',
            cost: 'A routing layer to build and keep in step.',
          },
          {
            text: 'Round robin',
            cost: 'Nothing to build.',
            why: 'The message lands on a random server, which may not hold the connection.',
          },
          {
            text: 'Send every message to all 10',
            cost: 'Ten times the traffic.',
            why: 'Wasteful, and it grows with every server added.',
          },
        ],
        answer: 0,
        explain: 'S11 returns to real-time delivery; S6 builds the hash ring.',
      },
      {
        id: 's3-7-6',
        type: 'bucket-sort',
        prompt: 'Does this need the same server each time?',
        buckets: ['Sticky', 'Any server'],
        items: [
          { text: 'A live chat connection', bucket: 0, why: 'The connection exists on one server only.' },
          { text: 'A per-user in-memory cache shard', bucket: 0, why: 'Only one server has that user\'s cached data.' },
          { text: 'A stateless JSON API call', bucket: 1, why: 'Any copy can answer it.' },
          { text: 'A product image', bucket: 1, why: 'Every server or CDN edge can serve the same file.' },
          { text: 'A login with sessions in a shared store', bucket: 1, why: 'The shared store makes the server irrelevant.' },
        ],
        explain: 'Prefer "any server"; be sticky only where something truly lives on one server.',
      },
      {
        id: 's3-7-7',
        type: 'diagram',
        prompt: 'Which box applies the hash that picks the server?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Users' },
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'Chat 1' },
            { id: 'b', kind: 'service', label: 'Chat 2' },
            { id: 'c', kind: 'service', label: 'Chat 3' },
          ],
          edges: [
            { from: 'u', to: 'l' },
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'l', to: 'c' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'l',
          why: {
            u: 'Users do not know which servers exist.',
            a: 'A chat server receives what is routed to it.',
            b: 'A chat server receives what is routed to it.',
            c: 'A chat server receives what is routed to it.',
          },
        },
        explain: 'The balancer hashes the user id (or a cookie) to choose.',
      },
      {
        id: 's3-7-8',
        type: 'mcq',
        prompt: 'For an ordinary web app, why prefer stateless servers over sticky sessions?',
        options: [
          { text: 'Any server can take over' },
          { text: 'Sticky sessions are not allowed', why: 'They are allowed; they are just fragile.' },
          { text: 'Stateless servers need no database', why: 'They still use databases.' },
        ],
        answer: 0,
        explain: 'Restarts, deploys and autoscaling then cost users nothing.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's3-08',
    title: 'Checkpoint: scaling out',
    summary: 'Scaling up or out, statelessness, algorithms, health checks, SPOFs, autoscaling and hashing, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's3-8-1',
        type: 'scenario',
        prompt: 'The app servers are full. What do you do?',
        situation: 'Two stateless app servers run at 90% CPU at peak. Traffic is growing steadily.',
        needs: ['Room for growth', 'Survive one server failing'],
        options: [
          {
            text: 'Add servers behind the balancer',
            cost: 'More servers to pay for.',
          },
          {
            text: 'Replace both with bigger machines',
            cost: 'Pricier machines and a switch-over.',
            why: 'Possible, but stateless servers scale out more cheaply and without a ceiling.',
          },
          {
            text: 'Cache everything in the browser',
            cost: 'Stale pages for users.',
            why: 'It does not add capacity for the requests that remain.',
          },
        ],
        answer: 0,
        explain: 'Stateless servers are the easy case for scaling out.',
      },
      {
        id: 's3-8-2',
        type: 'predict-output',
        prompt: 'Sessions kept per server; the user logs in on server 0, then hits server 2. What does this print?',
        code: `mem = [{}, {}, {}]
mem[0]["ana"] = "cart: 2 items"
print(mem[2].get("ana", "empty cart"))`,
        answer: 'empty cart',
        typedWrong: [{ answer: 'cart: 2 items', why: 'Server 2 has its own memory.' }],
        explain: 'Shared store, or the cart vanishes.',
      },
      {
        id: 's3-8-3',
        type: 'estimate',
        prompt: 'Peak is 14,000 requests/s; one server takes 2,000/s. Servers needed with one spare?',
        expr: '-(-14000 // 2000) + 1',
        answer: 8,
        tolerance: 1.2,
        unit: 'servers',
        work: ['14,000 ÷ 2,000 = 7', '7 + 1 spare = 8'],
        explain: 'Peak ÷ capacity, rounded up, plus a spare.',
      },
      {
        id: 's3-8-4',
        type: 'diagram',
        prompt: 'Which box is the single point of failure?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Users' },
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'App 1' },
            { id: 'b', kind: 'service', label: 'App 2' },
            { id: 'q', kind: 'queue', label: 'Queue' },
            { id: 'w', kind: 'worker', label: 'Workers' },
          ],
          edges: [
            { from: 'u', to: 'l' },
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'a', to: 'q' },
            { from: 'b', to: 'q' },
            { from: 'q', to: 'w' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'l',
          why: {
            u: 'Users are not part of the system.',
            a: 'App 2 covers for it.',
            b: 'App 1 covers for it.',
            q: 'If it dies, background jobs stop, but users can still be served.',
            w: 'Workers are a group; one dying slows jobs, it does not stop them.',
          },
        },
        explain: 'Every user request passes through the single balancer.',
      },
      {
        id: 's3-8-5',
        type: 'mcq',
        prompt: 'Requests take from 10 ms to 20 s. Which algorithm keeps servers evenly busy?',
        options: [
          { text: 'Least connections' },
          { text: 'Round robin', why: 'It ignores how many slow requests each server already holds.' },
          { text: 'Hash of the user', why: 'Hashing keeps users in place; it ignores load.' },
        ],
        answer: 0,
        explain: 'It counts what is in progress.',
      },
      {
        id: 's3-8-6',
        type: 'estimate',
        prompt: 'Checks every 10 s, removal after 2 failures; the dead server had 200 requests/s. Failed requests before removal?',
        expr: '10 * 2 * 200',
        answer: 4000,
        tolerance: 1.5,
        unit: 'requests',
        work: ['Detection: 2 × 10 s = 20 s', '20 s × 200/s = 4,000 failed requests'],
        explain: 'Clients that retry other servers hide most of these from users.',
      },
      {
        id: 's3-8-7',
        type: 'order-steps',
        prompt: 'Load rises. Put the autoscaling steps in order.',
        steps: [
          'Load passes the scaling threshold',
          'The autoscaler starts new servers',
          'The new servers boot and warm up',
          'They pass their health checks',
          'The balancer sends them traffic',
        ],
        explain: 'Steps two to four are the lag that headroom must cover.',
      },
      {
        id: 's3-8-8',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def pick(user, n):
    return sum(map(ord, user)) % n

print(pick("bo", 2), pick("bo", 2))`,
        answer: '1 1',
        typedWrong: [{ answer: '0 1', why: 'The same user hashes the same way every time.' }],
        explain: '98 + 111 = 209, which is odd: server 1.',
      },
      {
        id: 's3-8-9',
        type: 'diagram',
        prompt: 'Any app server must be able to read any user\'s session. What goes in the empty slot?',
        diagram: {
          nodes: [
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 'a', kind: 'service', label: 'App 1' },
            { id: 'b', kind: 'service', label: 'App 2' },
            { id: 'c', kind: 'service', label: 'App 3' },
            { id: 's', kind: 'cache', label: 'Sessions' },
          ],
          edges: [
            { from: 'l', to: 'a' },
            { from: 'l', to: 'b' },
            { from: 'l', to: 'c' },
            { from: 'a', to: 's' },
            { from: 'b', to: 's' },
            { from: 'c', to: 's' },
          ],
        },
        goal: {
          kind: 'slot',
          slot: 's',
          options: [
            { kind: 'cache', label: 'Shared cache' },
            { kind: 'lb', label: 'Balancer', why: 'A balancer routes requests; it does not store sessions.' },
            { kind: 'worker', label: 'Worker', why: 'Workers run background jobs; they are not a lookup store.' },
          ],
          answer: 0,
        },
        explain: 'A shared in-memory store makes the app servers stateless.',
      },
      {
        id: 's3-8-10',
        type: 'mcq',
        prompt: 'Black Friday starts at midnight. Why not just rely on autoscaling?',
        options: [
          { text: 'New servers take minutes' },
          { text: 'Autoscaling stops at night', why: 'It runs all the time; the issue is how fast.' },
          { text: 'It cannot add many servers', why: 'It can; it cannot add them instantly.' },
        ],
        answer: 0,
        explain: 'Scale ahead of known peaks.',
      },
    ],
  },
];
