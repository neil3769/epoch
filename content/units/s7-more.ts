import type { Lesson } from '../schema';

/* S7 lessons 6 to 10: quorums, logical clocks, what consensus gives,
 * leader election and locks, checkpoint. */

export const s7More: Lesson[] = [
  // ------------------------------------------------------------------ 6
  {
    id: 's7-06',
    title: 'Quorums',
    summary: 'Write to W replicas, read from R; if W + R > N, every read overlaps the latest write.',
    card: {
      title: 'Quorums',
      text: 'With N replicas, a write waits for W of them and a read asks R of them and keeps the newest version it sees. If W + R > N, any read set overlaps any write set, so a read always meets at least one replica with the latest write. The figure shows the unlucky case: the write lands on the first replicas, the read asks the last.',
      figure: { kind: 'quorum', n: 3, w: 2, r: 2 },
    },
    exercises: [
      {
        id: 's7-6-1',
        type: 'figure',
        prompt: 'With W = 1 and R = 1 the read can miss the write. Change W and R so the read sees version 2.',
        figure: { kind: 'quorum', n: 3, w: 1, r: 1, goal: { fresh: true } },
        explain: 'Any W and R with W + R ≥ 4 works with N = 3.',
      },
      {
        id: 's7-6-2',
        type: 'figure',
        prompt: 'Five replicas, one is down. Make the write succeed and the read see version 2.',
        figure: { kind: 'quorum', n: 5, w: 5, r: 1, down: [4], goal: { freshWithDown: 1 } },
        explain: 'W = 5 cannot succeed with a replica down; W = 3, R = 3 can.',
      },
      {
        id: 's7-6-3',
        type: 'predict-output',
        prompt: 'Does every read overlap every write?',
        code: `def overlap(w, r, n):
    return w + r > n

a = overlap(2, 2, 3)
print(a, overlap(1, 2, 3))`,
        answer: 'True False',
        typedWrong: [{ answer: 'True True', why: '1 + 2 = 3 is not more than 3: they can miss.' }],
        explain: 'Strictly greater than N.',
      },
      {
        id: 's7-6-4',
        type: 'match-pairs',
        prompt: 'With N = 3, match each setting to what it favours.',
        pairs: [
          { left: 'W = 1, R = 3', right: 'cheap writes, costly reads', why: 'Writes wait for one; reads ask all three.' },
          { left: 'W = 3, R = 1', right: 'cheap reads, costly writes', why: 'Reads ask one; writes wait for all.' },
          { left: 'W = 2, R = 2', right: 'both wait for a majority', why: 'Balanced, and survives one replica down.' },
        ],
        explain: 'All three satisfy W + R > N; they move the cost around.',
      },
      {
        id: 's7-6-5',
        type: 'mcq',
        prompt: 'N = 3 with W = 3. One replica dies. What happens to writes?',
        options: [
          { text: 'They fail' },
          { text: 'They still succeed', why: 'Only 2 replicas can acknowledge; W needs 3.' },
          { text: 'They become stale', why: 'They cannot complete at all.' },
        ],
        answer: 0,
        explain: 'W = N gives fast reads but no tolerance for a failed replica on writes.',
      },
      {
        id: 's7-6-6',
        type: 'fill-blank',
        prompt: 'The quorum rule.',
        code: `def safe(w, r, n):
    return w + r ___ n

print(safe(3, 3, 5), safe(2, 3, 5))`,
        answer: ['>'],
        distractors: [{ text: '>=', why: '2 + 3 = 5 would pass, yet a read of 3 can miss a write of 2 out of 5.' }],
        expectOutput: 'True False',
        explain: 'Strictly more than N.',
      },
      {
        id: 's7-6-7',
        type: 'scenario',
        prompt: 'Which quorum for a read-heavy store with 5 replicas?',
        situation: 'Reads outnumber writes 100 to 1. The store must keep working with any one replica down.',
        needs: ['Reads see the latest write', 'Survive one replica down for reads and writes'],
        options: [
          {
            text: 'W = 4, R = 2',
            cost: 'Writes wait for four replicas.',
          },
          {
            text: 'W = 5, R = 1',
            cost: 'Fastest reads.',
            why: 'With one replica down, no write can reach W = 5.',
          },
          {
            text: 'W = 2, R = 2',
            cost: 'Fast both ways.',
            why: '2 + 2 = 4 is not more than 5: reads can be stale.',
          },
        ],
        answer: 0,
        explain: '4 + 2 = 6 > 5, and both work with 4 replicas up.',
      },
      {
        id: 's7-6-8',
        type: 'predict-output',
        prompt: 'A read asks two replicas and keeps the newest version. What does it return?',
        code: `replies = [(1, "old"), (2, "new")]
version, value = max(replies)
print(value)`,
        answer: 'new',
        typedWrong: [{ answer: 'old', why: 'max compares versions first: 2 wins.' }],
        explain: 'Versions let the reader tell which copy is newer.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's7-07',
    title: 'Logical clocks',
    summary: 'Wall clocks drift; a Lamport counter orders events so causes always come before effects.',
    card: {
      title: 'Logical clocks',
      text: 'Machines\' clocks drift apart by milliseconds or more, so timestamps cannot be trusted to order events across machines. A Lamport clock is a counter instead: add 1 at each event, send the counter with each message, and on receiving set it to the larger of the two plus 1. Then if A caused B, A\'s number is smaller.',
      code: `def receive(mine, theirs):
    return max(mine, theirs) + 1

print(receive(3, 7), receive(9, 2))`,
      output: '8 10',
    },
    exercises: [
      {
        id: 's7-7-1',
        type: 'predict-output',
        prompt: 'Machine A is at 5 and sends a message (counting the send as an event). B, at 2, receives it. What are the two counters?',
        code: `a, b = 5, 2
a += 1          # A sends: event
msg = a
b = max(b, msg) + 1   # B receives
print(a, b)`,
        answer: '6 7',
        typedWrong: [{ answer: '6 3', why: 'B jumps past the message\'s counter: max(2, 6) + 1.' }],
        explain: 'The receive is always numbered after the send.',
      },
      {
        id: 's7-7-2',
        type: 'mcq',
        prompt: 'Why not order events across machines by their wall-clock timestamps?',
        options: [
          { text: 'Clocks drift apart' },
          { text: 'Timestamps are too long', why: 'Size is not the problem; accuracy is.' },
          { text: 'Machines have no clocks', why: 'They do; they just disagree slightly.' },
        ],
        answer: 0,
        explain: 'A reply could get an earlier timestamp than its question.',
      },
      {
        id: 's7-7-3',
        type: 'run-code',
        prompt: 'Write `receive(mine, theirs)`: a Lamport clock\'s new value after receiving a message.',
        solution: `def receive(mine, theirs):
    return max(mine, theirs) + 1`,
        tests: [
          'assert receive(3, 7) == 8, f"got {receive(3, 7)}"',
          'assert receive(9, 2) == 10, "own clock ahead: still +1"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'def receive(mine, theirs):',
        explain: 'Larger of the two, plus one for the receive event.',
      },
      {
        id: 's7-7-4',
        type: 'order-steps',
        prompt: 'A question and its reply across two machines with Lamport clocks. Put it in order.',
        steps: [
          'A is at 4 and sends the question with counter 5',
          'B, at 2, receives it and moves to 6',
          'B writes the reply and sends it with counter 7',
          'Any reader sorting by counter sees the question (5) before the reply (7)',
        ],
        explain: 'Cause before effect, guaranteed by the counter rule.',
      },
      {
        id: 's7-7-5',
        type: 'predict-output',
        prompt: 'Machine B\'s wall clock runs 2 s behind A\'s. A posts at 10:00:05; B replies 1 s later. Which timestamp does the reply get?',
        code: `a_post = 5   # s past 10:00
b_clock_offset = -2
reply = a_post + 1 + b_clock_offset
print(reply, reply < a_post)`,
        answer: '4 True',
        typedWrong: [{ answer: '6 False', why: 'B\'s clock is 2 s behind, so its stamp is 4.' }],
        explain: 'Sorted by wall time, the reply comes first: the reason for logical clocks.',
      },
      {
        id: 's7-7-6',
        type: 'mcq',
        prompt: 'A has counter 8, B has counter 5. Did A\'s event happen after B\'s?',
        options: [
          { text: 'Not necessarily' },
          { text: 'Yes: 8 > 5', why: 'Unrelated events can have any counters; only causes are guaranteed smaller.' },
          { text: 'No: B came later', why: 'Nothing says that either.' },
        ],
        answer: 0,
        explain: 'Lamport clocks: cause ⇒ smaller number, not the reverse. Vector clocks can tell.',
      },
      {
        id: 's7-7-7',
        type: 'fill-blank',
        prompt: 'Receiving a message.',
        code: `def receive(mine, theirs):
    return ___(mine, theirs) + 1

print(receive(4, 9))`,
        answer: ['max'],
        distractors: [{ text: 'min', why: 'min(4, 9) + 1 is 5: before the send at 9.' }],
        expectOutput: '10',
        explain: 'Always after what you heard about.',
      },
      {
        id: 's7-7-8',
        type: 'bucket-sort',
        prompt: 'Wall clock or logical clock?',
        buckets: ['Wall clock', 'Logical clock'],
        items: [
          { text: 'Showing "posted 5 minutes ago"', bucket: 0, why: 'People want real time, roughly.' },
          { text: 'Ordering a reply after its question', bucket: 1, why: 'Must follow cause and effect exactly.' },
          { text: 'Deciding which concurrent write is newer', bucket: 1, why: 'Wall clocks can disagree; counters or versions decide.' },
          { text: 'Expiring a cache entry after 60 s', bucket: 0, why: 'A local duration on one machine.' },
          { text: 'Ordering events in a replicated log', bucket: 1, why: 'Positions in the log, not timestamps.' },
        ],
        explain: 'Real time for people; logical order for correctness.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's7-08',
    title: 'What consensus gives',
    summary: 'Consensus lets machines agree on one value, such as the leader, even when some fail.',
    card: {
      title: 'What consensus gives',
      text: 'Consensus algorithms such as Raft and Paxos let a group of machines agree on one value, such as who the leader is or the next entry in a log, even if some crash. They need a majority to make progress, so 2f + 1 machines tolerate f failures. You rarely write one: you use a service built on one (etcd, ZooKeeper) for leaders, configuration and locks.',
    },
    exercises: [
      {
        id: 's7-8-1',
        type: 'estimate',
        prompt: 'A consensus group of 5 machines. How many can fail while it still makes progress?',
        expr: '(5 - 1) // 2',
        answer: 2,
        tolerance: 1.1,
        unit: 'machines',
        options: [
          { value: 1, why: 'A majority of 5 is 3, so 2 can fail.' },
          { value: 2 },
          { value: 4, why: 'One machine alone is not a majority.' },
        ],
        work: ['Majority of 5 = 3', '5 − 3 = 2 failures tolerated'],
        explain: 'Groups are 3 or 5 machines in practice.',
      },
      {
        id: 's7-8-2',
        type: 'bucket-sort',
        prompt: 'Does it need consensus?',
        buckets: ['Consensus', 'Does not'],
        items: [
          { text: 'Electing a single database leader', bucket: 0, why: 'All nodes must agree on exactly one.' },
          { text: 'A lock only one worker may hold', bucket: 0, why: 'Agreement on the holder.' },
          { text: 'Counting page views', bucket: 1, why: 'Counts can be merged.' },
          { text: 'The cluster\'s list of members', bucket: 0, why: 'Everyone must agree who is in.' },
          { text: 'Caching a product page', bucket: 1, why: 'Any copy is as good as another.' },
        ],
        explain: 'Agreement on one thing across machines: consensus.',
      },
      {
        id: 's7-8-3',
        type: 'mcq',
        prompt: 'Your app needs a leader election. What do you use?',
        options: [
          { text: 'A service like etcd or ZooKeeper' },
          { text: 'Write Paxos yourself', why: 'Consensus is notoriously hard to get right; use a proven service.' },
          { text: 'Pick the machine with the lowest IP', why: 'Without agreement, a split network can produce two "lowest".' },
        ],
        answer: 0,
        explain: 'Managed databases do this for you internally.',
      },
      {
        id: 's7-8-4',
        type: 'predict-output',
        prompt: 'A 5-node group splits into 3 and 2. Which side can elect a leader?',
        code: `n = 5
sides = {"left": 3, "right": 2}
need = n // 2 + 1
print([s for s, k in sides.items()
       if k >= need])`,
        answer: "['left']",
        typedWrong: [{ answer: "['left', 'right']", why: 'The right side has 2 of 5: not a majority.' }],
        explain: 'At most one side can ever have a majority: no split brain.',
      },
      {
        id: 's7-8-5',
        type: 'scenario',
        prompt: 'How many nodes for the coordination service?',
        situation: 'Your configuration service must survive one node failing, and you can run nodes in three zones.',
        needs: ['Survive one failure', 'Fewest nodes'],
        options: [
          {
            text: 'Three nodes, one per zone',
            cost: 'Three machines; a zone outage takes one.',
          },
          {
            text: 'Two nodes, two zones',
            cost: 'Cheaper.',
            why: 'With one down, the survivor is not a majority: no progress.',
          },
          {
            text: 'Four nodes, three zones',
            cost: 'Four machines.',
            why: 'Still survives only one failure, and costs more than three.',
          },
        ],
        answer: 0,
        explain: 'Odd sizes: 3 for one failure, 5 for two.',
      },
      {
        id: 's7-8-6',
        type: 'mcq',
        prompt: 'What does consensus cost?',
        options: [
          { text: 'Round trips to a majority' },
          { text: 'Nothing once running', why: 'Every decision waits for a majority.' },
          { text: 'Losing committed data', why: 'It is designed never to lose committed decisions.' },
        ],
        answer: 0,
        explain: 'Keep it for the few decisions that need it.',
      },
      {
        id: 's7-8-7',
        type: 'order-steps',
        prompt: 'A Raft-style leader election, simplified. Put it in order.',
        steps: [
          'Followers stop hearing from the leader',
          'One times out and asks the others for votes',
          'A majority vote for it',
          'It becomes leader and starts sending heartbeats',
        ],
        explain: 'Randomised timeouts make it unlikely that two candidates start together.',
      },
      {
        id: 's7-8-8',
        type: 'fill-blank',
        prompt: 'Failures a group of n can survive.',
        code: `def tolerates(n):
    return (n - 1) ___ 2

print(tolerates(3), tolerates(5))`,
        answer: ['//'],
        distractors: [{ text: '/', why: 'That gives 1.0 and 2.0: failures are whole machines.' }],
        expectOutput: '1 2',
        explain: '2f + 1 nodes tolerate f failures.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's7-09',
    title: 'Leader election and locks',
    summary: 'Leases expire so a dead holder cannot block forever; fencing tokens stop a paused holder writing.',
    card: {
      title: 'Leader election and locks',
      text: 'A distributed lock or leadership is usually a lease: it expires unless renewed, so a crashed holder cannot block everyone forever. But a holder can pause (a long garbage collection, say), lose its lease, wake up and still believe it holds the lock. Fencing tokens fix that: each grant carries a higher number, and storage rejects writes with a lower one than it has seen.',
      code: `highest = 0

def write(token):
    global highest
    if token < highest:
        return "rejected"
    highest = token
    return "ok"

print(write(33), write(34), write(33))`,
      output: 'ok ok rejected',
    },
    exercises: [
      {
        id: 's7-9-1',
        type: 'order-steps',
        prompt: 'The paused-holder problem. Put it in order.',
        steps: [
          'Worker A gets the lock with token 33',
          'A pauses for a long garbage collection',
          'A\'s lease expires; B gets the lock with token 34',
          'B writes with token 34',
          'A wakes up and writes with token 33',
          'Storage rejects A\'s write: 33 is older than 34',
        ],
        explain: 'Without the token check, A would overwrite B\'s work.',
      },
      {
        id: 's7-9-2',
        type: 'predict-output',
        prompt: 'Writes arrive with tokens 5, 7, 6. Which are accepted?',
        code: `highest = 0
results = []
for t in [5, 7, 6]:
    if t >= highest:
        highest = t
        results.append("ok")
    else:
        results.append("no")
print(results)`,
        answer: "['ok', 'ok', 'no']",
        typedWrong: [{ answer: "['ok', 'ok', 'ok']", why: '6 is older than 7, which was already seen.' }],
        explain: 'The stale holder\'s write is fenced off.',
      },
      {
        id: 's7-9-3',
        type: 'mcq',
        prompt: 'Why give locks an expiry (a lease)?',
        options: [
          { text: 'So a dead holder frees it' },
          { text: 'To make locks faster', why: 'Expiry is about failures, not speed.' },
          { text: 'So two can hold it', why: 'Expiry plus fencing aims for exactly one at a time.' },
        ],
        answer: 0,
        explain: 'Otherwise a crashed holder blocks everyone forever.',
      },
      {
        id: 's7-9-4',
        type: 'run-code',
        prompt: 'Write `accept(seen, token)`: return `(True, token)` if the token is at least the highest seen so far, else `(False, seen)`.',
        solution: `def accept(seen, token):
    if token >= seen:
        return True, token
    return False, seen`,
        tests: [
          'assert accept(33, 34) == (True, 34), "newer token: accept"',
          'assert accept(34, 33) == (False, 34), "older token: reject, keep 34"',
          'assert accept(0, 1) == (True, 1), "first write"',
        ].join('\n'),
        maxLines: 4,
        placeholder: 'def accept(seen, token):',
        explain: 'The storage, not the lock holder, enforces it.',
      },
      {
        id: 's7-9-5',
        type: 'scenario',
        prompt: 'A nightly job must run on exactly one of three servers. How?',
        situation: 'Running it twice double-charges customers. A server can crash mid-run.',
        needs: ['Never two runs at once', 'A crashed run does not block tomorrow\'s'],
        options: [
          {
            text: 'Lease plus fencing tokens',
            cost: 'A coordination service and token checks in the job\'s writes.',
          },
          {
            text: 'Run it on server 1 only',
            cost: 'Simple to set up.',
            why: 'If server 1 is down, the job never runs.',
          },
          {
            text: 'A lock with no expiry',
            cost: 'Simple to build.',
            why: 'A crashed holder keeps the lock forever.',
          },
        ],
        answer: 0,
        explain: 'Plus make the job idempotent (S8) as a second line of defence.',
      },
      {
        id: 's7-9-6',
        type: 'diagram',
        prompt: 'Which box must check the fencing token?',
        diagram: {
          nodes: [
            { id: 'l', kind: 'service', label: 'Lock service' },
            { id: 'a', kind: 'worker', label: 'Worker A' },
            { id: 'b', kind: 'worker', label: 'Worker B' },
            { id: 's', kind: 'db', label: 'Storage' },
          ],
          edges: [
            { from: 'l', to: 'a', label: 'token' },
            { from: 'l', to: 'b', label: 'token' },
            { from: 'a', to: 's', label: 'write' },
            { from: 'b', to: 's', label: 'write' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 's',
          why: {
            l: 'The lock service hands out tokens; it does not see the writes.',
            a: 'A paused worker cannot know its lease expired.',
            b: 'Workers cannot police each other.',
          },
        },
        explain: 'Only the storage sees every write and their tokens.',
      },
      {
        id: 's7-9-7',
        type: 'mcq',
        prompt: 'A lease lasts 10 s. A worker pauses for 15 s. What happens without fencing?',
        options: [
          { text: 'Two writers at once' },
          { text: 'The pause is impossible', why: 'Garbage collection or a stalled VM can pause any process.' },
          { text: 'The lock renews itself', why: 'A paused worker cannot renew.' },
        ],
        answer: 0,
        explain: 'The old holder wakes believing it still holds the lock.',
      },
      {
        id: 's7-9-8',
        type: 'fill-blank',
        prompt: 'Reject writes from an older lock holder.',
        code: `highest = 34

def ok(token):
    return token ___ highest

print(ok(33), ok(35))`,
        answer: ['>='],
        distractors: [{ text: '<=', why: 'That accepts the old holder and rejects the new one.' }],
        expectOutput: 'False True',
        explain: '33 is stale; 35 is a newer grant.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's7-10',
    title: 'Checkpoint: consistency and coordination',
    summary: 'CAP, latency, strong, eventual and causal consistency, quorums, clocks, consensus and fencing, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's7-10-1',
        type: 'scenario',
        prompt: 'During a partition, what should a ticketing system do with the last seat?',
        situation: 'Two regions each think one seat is left.',
        needs: ['Never sell a seat twice'],
        options: [
          {
            text: 'Refuse on the minority side',
            cost: 'Some buyers see errors for a while.',
          },
          {
            text: 'Sell on both sides anyway',
            cost: 'No errors.',
            why: 'Two buyers get one seat.',
          },
        ],
        answer: 0,
        explain: 'Consistency over availability.',
      },
      {
        id: 's7-10-2',
        type: 'figure',
        prompt: 'Make the read see version 2.',
        figure: { kind: 'quorum', n: 5, w: 2, r: 2, goal: { fresh: true } },
        explain: 'W + R must exceed 5.',
      },
      {
        id: 's7-10-3',
        type: 'predict-output',
        prompt: 'Lamport clocks: B at 3 receives a message stamped 8. What is B\'s counter now?',
        code: 'print(max(3, 8) + 1)',
        answer: '9',
        typedWrong: [{ answer: '4', why: 'Jump past the message: max, then +1.' }],
        explain: 'After everything you have heard about.',
      },
      {
        id: 's7-10-4',
        type: 'bucket-sort',
        prompt: 'Which consistency is enough?',
        buckets: ['Strong', 'Causal', 'Eventual'],
        items: [
          { text: 'Unique usernames', bucket: 0, why: 'Two claims at once must not both win.' },
          { text: 'Comment threads', bucket: 1, why: 'Replies after questions; nothing more.' },
          { text: 'View counters', bucket: 2, why: 'Merge later.' },
          { text: 'Account withdrawals', bucket: 0, why: 'Money must never be double-spent.' },
          { text: 'Chat messages in a conversation', bucket: 1, why: 'Order within a conversation matters.' },
          { text: 'Product review averages', bucket: 2, why: 'Approximate is fine.' },
        ],
        explain: 'The weakest that is still correct.',
      },
      {
        id: 's7-10-5',
        type: 'mcq',
        prompt: 'Why does strong consistency make worldwide writes slow?',
        options: [
          { text: 'Waiting on a far majority' },
          { text: 'It writes more data', why: 'Same data; more waiting.' },
          { text: 'It uses older hardware', why: 'Round trips, not hardware.' },
        ],
        answer: 0,
        explain: 'The latency side of the trade-off.',
      },
      {
        id: 's7-10-6',
        type: 'predict-output',
        prompt: 'Merge two replicas\' increments of a counter that started at 50.',
        code: 'print(50 + 4 + 6)',
        answer: '60',
        typedWrong: [{ answer: '56', why: 'Both sides\' increments count.' }],
        explain: 'Merging increments loses nothing.',
      },
      {
        id: 's7-10-7',
        type: 'estimate',
        prompt: 'Smallest consensus group that survives 2 failures?',
        expr: '2 * 2 + 1',
        answer: 5,
        tolerance: 1.1,
        unit: 'nodes',
        work: ['2f + 1 with f = 2 gives 5'],
        explain: 'A majority of 5 is 3.',
      },
      {
        id: 's7-10-8',
        type: 'order-steps',
        prompt: 'Fencing in action. Put it in order.',
        steps: [
          'A holds the lock with token 10 and pauses',
          'The lease expires; B gets token 11',
          'B writes with token 11',
          'A wakes and tries to write with 10',
          'Storage refuses token 10',
        ],
        explain: 'Older tokens never overwrite newer work.',
      },
      {
        id: 's7-10-9',
        type: 'fill-blank',
        prompt: 'The quorum rule for fresh reads.',
        code: `n, w, r = 5, 3, 3
print(w + r ___ n)`,
        answer: ['>'],
        distractors: [{ text: '<', why: '6 < 5 is False; the rule is W + R > N.' }],
        expectOutput: 'True',
        explain: '3 + 3 = 6 > 5.',
      },
      {
        id: 's7-10-10',
        type: 'mcq',
        prompt: 'Why not order events across machines by wall-clock time?',
        options: [
          { text: 'Clocks drift apart' },
          { text: 'It is far too slow', why: 'Reading a clock is fast; it is just not reliable across machines.' },
          { text: 'Different time zones', why: 'Systems use UTC; drift is the problem.' },
        ],
        answer: 0,
        explain: 'Logical clocks or a single log give a trustworthy order.',
      },
    ],
  },
];
