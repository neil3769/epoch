import type { Lesson } from '../schema';

/* S8 lessons 6-10: backpressure, ordering, the outbox pattern, sagas, checkpoint. */
export const s8More: Lesson[] = [
  // ------------------------------------------------------------------ 6
  {
    id: 's8-06',
    title: 'Backpressure',
    summary: 'When work arrives faster than it is done, the backlog grows without limit; push back at the edge.',
    card: {
      title: 'Backpressure',
      text: 'If producers add work faster than workers finish it, the backlog grows without limit: waits get longer and memory runs out. Backpressure pushes back: a bounded queue rejects or slows producers when it is full, so overload shows up at the edge instead of everywhere. Add workers when the load lasts; let the queue absorb a short spike.',
      figure: { kind: 'queue', jobs: '........', workers: 2, arrive: 2, controls: ['workers'] },
    },
    exercises: [
      {
        id: 's8-6-1',
        type: 'figure',
        prompt: 'Two new jobs arrive every tick and the backlog never clears. Add workers until it clears within 4 ticks.',
        figure: { kind: 'queue', jobs: '........', workers: 2, arrive: 2, controls: ['workers'], goal: { clearBy: 4 } },
        explain: 'Only the workers beyond the arrival rate drain the backlog: 4 workers drain 2 jobs a tick.',
      },
      {
        id: 's8-6-2',
        type: 'estimate',
        prompt: '500 jobs a second arrive; workers finish 400 a second. How big is the backlog after an hour?',
        expr: '(500 - 400) * HOUR',
        answer: 360000,
        tolerance: 1.5,
        unit: 'jobs',
        options: [
          { value: 3600, why: '100 extra jobs every second, not one.' },
          { value: 360000 },
          { value: 1800000, why: 'Only the 100 a second that workers miss pile up.' },
        ],
        work: ['500 − 400 = 100 jobs/s left over', '100 × 3,600 s = 360,000'],
        explain: 'And it keeps growing: a job joining now waits 15 minutes.',
      },
      {
        id: 's8-6-3',
        type: 'predict-output',
        prompt: 'A bounded queue holds 3 jobs. What do four offers get?',
        code: `q, LIMIT = [], 3
def offer(job):
    if len(q) >= LIMIT:
        return "busy"
    q.append(job)
    return "ok"

print([offer(j) for j in "abcd"])`,
        answer: "['ok', 'ok', 'ok', 'busy']",
        typedWrong: [{ answer: "['ok', 'ok', 'ok', 'ok']", why: 'The fourth finds 3 jobs waiting and is refused.' }],
        explain: 'The producer learns at once that it must slow down.',
      },
      {
        id: 's8-6-4',
        type: 'scenario',
        prompt: 'A sale doubles traffic. Workers handle checkouts and marketing emails from shared queues. What do you do?',
        situation: 'Checkout jobs and marketing emails both wait behind a growing backlog.',
        needs: ['Checkouts stay fast', 'Emails may be late'],
        options: [
          {
            text: 'Pause the email queue for now',
            cost: 'Marketing emails go out hours late.',
          },
          {
            text: 'Let every queue grow without limit',
            cost: 'Nothing to change.',
            why: 'Checkouts wait behind the same overloaded workers.',
          },
        ],
        answer: 0,
        explain: 'Shed or delay what can wait; protect what earns the money.',
      },
      {
        id: 's8-6-5',
        type: 'mcq',
        prompt: 'What does a queue with no size limit hide?',
        options: [
          { text: 'That workers cannot keep up' },
          { text: 'That messages are lost', why: 'Nothing is lost; it just waits longer and longer.' },
          { text: 'That producers are slow', why: 'The producers are the fast side.' },
        ],
        answer: 0,
        explain: 'Watch the queue\'s length and the age of its oldest message.',
      },
      {
        id: 's8-6-6',
        type: 'bucket-sort',
        prompt: 'Add workers, or let the queue absorb it?',
        buckets: ['Add workers', 'Let it absorb'],
        items: [
          { text: 'Traffic doubled for good after a launch', bucket: 0, why: 'Lasting load needs lasting capacity.' },
          { text: 'A 5-minute burst at 9:00', bucket: 1, why: 'It drains soon after.' },
          { text: 'A nightly import of a million rows', bucket: 1, why: 'Hours to finish before morning is fine.' },
          { text: 'A new customer triples steady volume', bucket: 0, why: 'The average rate now beats the workers.' },
          { text: 'Invoices run on the first of each month', bucket: 1, why: 'A once-a-month peak that drains in hours.' },
        ],
        explain: 'Queues smooth spikes; they cannot fix an average rate above capacity.',
      },
      {
        id: 's8-6-7',
        type: 'mcq',
        prompt: 'An HTTP service is overloaded. What reply tells callers to back off?',
        options: [
          { text: '429 Too Many Requests' },
          { text: '200 OK, then drop it', why: 'The caller thinks the work will be done.' },
          { text: '404 Not Found', why: 'That says the thing does not exist.' },
        ],
        answer: 0,
        explain: '503 Service Unavailable also works; both can carry a Retry-After header.',
      },
      {
        id: 's8-6-8',
        type: 'fill-blank',
        prompt: 'Workers needed for a rate: divide, rounding up.',
        code: `def needed(rate, per_worker):
    return -(-rate ___ per_worker)

print(needed(500, 120))`,
        answer: ['//'],
        distractors: [{ text: '/', why: 'That gives 4.17 workers; you cannot run a fraction.' }],
        expectOutput: '5',
        explain: '4 workers manage 480 a second: one short. Round up.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 's8-07',
    title: 'Ordering',
    summary: 'Parallel workers lose order; send each entity\'s messages to one partition by key.',
    card: {
      title: 'Ordering',
      text: 'One queue with many workers does not keep order: two workers run side by side and finish in any order. When order matters per entity, send all of its messages to one partition chosen by a key, such as the order id, and have one consumer read each partition in order. Order across different keys is not kept, and is rarely needed.',
      diagram: {
        nodes: [
          { id: 'p', kind: 'service', label: 'Orders' },
          { id: 'a', kind: 'queue', label: 'Partition 0' },
          { id: 'b', kind: 'queue', label: 'Partition 1' },
          { id: 'x', kind: 'worker', label: 'Consumer A' },
          { id: 'y', kind: 'worker', label: 'Consumer B' },
        ],
        edges: [
          { from: 'p', to: 'a', label: 'key' },
          { from: 'p', to: 'b', label: 'key' },
          { from: 'a', to: 'x' },
          { from: 'b', to: 'y' },
        ],
      },
    },
    exercises: [
      {
        id: 's8-7-1',
        type: 'predict-output',
        prompt: 'Messages are split by the order id\'s number. What does partition 1 hold?',
        code: `m = [("o1", "paid"), ("o2", "paid"),
     ("o1", "shipped")]
parts = {0: [], 1: []}
for key, ev in m:
    parts[int(key[1]) % 2].append(ev)
print(parts[1])`,
        answer: "['paid', 'shipped']",
        typedWrong: [{ answer: "['paid']", why: 'Both of o1\'s events go to partition 1.' }],
        explain: 'Same key, same partition, original order.',
      },
      {
        id: 's8-7-2',
        type: 'mcq',
        prompt: '"Created" and "cancelled" for one order go to a shared queue. Why can "cancelled" be handled first?',
        options: [
          { text: 'Two workers run in parallel' },
          { text: 'Queues reverse the order', why: 'The queue hands them out in order; workers finish in any order.' },
          { text: 'The clocks are wrong', why: 'No clocks involved: just parallel work.' },
        ],
        answer: 0,
        explain: 'Worker 1 is slow on "created"; worker 2 finishes "cancelled" first.',
      },
      {
        id: 's8-7-3',
        type: 'scenario',
        prompt: 'Account events (deposits, withdrawals) must apply in order. How do you partition?',
        situation: 'Millions of accounts; events per account are few.',
        needs: ['Each account\'s events in order', 'Many consumers in parallel'],
        options: [
          {
            text: 'Partition by account id',
            cost: 'Order holds only within an account.',
          },
          {
            text: 'One partition for everything',
            cost: 'A single consumer for all accounts.',
            why: 'Order across accounts is not needed, and one consumer cannot scale.',
          },
        ],
        answer: 0,
        explain: 'Order where it matters, parallelism everywhere else.',
      },
      {
        id: 's8-7-4',
        type: 'bucket-sort',
        prompt: 'Does order matter?',
        buckets: ['Order matters', 'Any order'],
        items: [
          { text: 'Edits to one document', bucket: 0, why: 'Applying them out of order corrupts it.' },
          { text: 'Thumbnails for different photos', bucket: 1, why: 'Independent jobs.' },
          { text: 'Deposits and withdrawals on one account', bucket: 0, why: 'A withdrawal before a deposit can bounce.' },
          { text: 'Welcome emails to different users', bucket: 1, why: 'Unrelated.' },
          { text: 'Status changes of one order', bucket: 0, why: 'Shipped must not come before paid.' },
        ],
        explain: 'Order matters within one entity, rarely between them.',
      },
      {
        id: 's8-7-5',
        type: 'predict-output',
        prompt: 'Each message carries a version. Version 3 arrives before version 2. What happens?',
        code: `current = {"o1": 0}
def apply(key, version):
    if version <= current[key]:
        return "ignored"
    current[key] = version
    return "applied"

print(apply("o1", 3), apply("o1", 2))`,
        answer: 'applied ignored',
        typedWrong: [{ answer: 'applied applied', why: 'Version 2 is older than the 3 already applied.' }],
        explain: 'Versions let a consumer drop stale updates when order cannot be guaranteed.',
      },
      {
        id: 's8-7-6',
        type: 'mcq',
        prompt: 'Most messages share one key (one huge customer). What happens?',
        options: [
          { text: 'One partition is overloaded' },
          { text: 'Messages are lost on the way', why: 'Nothing is lost; one consumer just falls behind.' },
          { text: 'Order between events breaks', why: 'Order holds; throughput suffers.' },
        ],
        answer: 0,
        explain: 'A hot partition: pick keys that spread the load.',
      },
      {
        id: 's8-7-7',
        type: 'mcq',
        prompt: 'Messages are partitioned by order id. Is the order between two different orders kept?',
        options: [
          { text: 'No, and it rarely matters' },
          { text: 'Yes, always', why: 'Different partitions are read independently.' },
          { text: 'Only within one broker', why: 'Partitions are read independently wherever they live.' },
        ],
        answer: 0,
        explain: 'Global order means one partition and one consumer: rarely worth it.',
      },
      {
        id: 's8-7-8',
        type: 'fill-blank',
        prompt: 'The same key must always land on the same partition.',
        code: `def partition(key, n):
    return sum(map(ord, key)) ___ n

print(partition("acct7", 4))`,
        answer: ['%'],
        distractors: [{ text: '//', why: 'That gives 116: there are only 4 partitions.' }],
        expectOutput: '2',
        explain: 'A hash of the key, modulo the partition count.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's8-08',
    title: 'The outbox pattern',
    summary: 'Write the event in the same transaction as the data; a relay publishes it afterwards.',
    card: {
      title: 'The outbox pattern',
      text: 'A service that saves a row and then publishes an event can crash in between: the order is saved but nobody hears about it. The outbox pattern writes the event into an outbox table in the same database transaction as the data. A separate relay reads the outbox and publishes each event, retrying until it succeeds: at least once.',
      diagram: {
        nodes: [
          { id: 's', kind: 'service', label: 'Orders' },
          { id: 'd', kind: 'db', label: 'Orders DB' },
          { id: 'r', kind: 'worker', label: 'Relay' },
          { id: 'q', kind: 'queue', label: 'Broker' },
        ],
        edges: [
          { from: 's', to: 'd', label: 'one txn' },
          { from: 'r', to: 'd', label: 'read' },
          { from: 'r', to: 'q', label: 'publish' },
        ],
      },
    },
    exercises: [
      {
        id: 's8-8-1',
        type: 'order-steps',
        prompt: 'Put the outbox flow in order.',
        steps: [
          'Begin a transaction',
          'Insert the order row',
          'Insert "order placed" into the outbox',
          'Commit',
          'The relay reads unsent outbox rows',
          'The relay publishes, then marks the row sent',
        ],
        explain: 'Data and event are saved together; publishing happens after.',
      },
      {
        id: 's8-8-2',
        type: 'mcq',
        prompt: 'With an outbox, the service crashes right after the commit. What happens to the event?',
        options: [
          { text: 'The relay sends it later' },
          { text: 'It is lost', why: 'It is saved in the outbox table.' },
          { text: 'The order is rolled back', why: 'The commit already happened.' },
        ],
        answer: 0,
        explain: 'The outbox row waits until the relay picks it up.',
      },
      {
        id: 's8-8-3',
        type: 'predict-output',
        prompt: 'One transaction saves an order and its outbox row; a second crashes midway. How many rows in each table?',
        code: `import sqlite3
db = sqlite3.connect(":memory:")
q = db.execute
q("create table orders(id)")
q("create table outbox(id)")

def put(t):
    q(f"insert into {t} values(1)")

def place(crash):
    with db:
        put("orders")
        if crash:
            raise RuntimeError
        put("outbox")

def count(t):
    sql = f"select count(*) from {t}"
    return q(sql).fetchone()[0]

place(False)
try:
    place(True)
except RuntimeError:
    pass
n = count("orders"), count("outbox")
print(*n)`,
        answer: '1 1',
        typedWrong: [{ answer: '2 1', why: 'The crashed transaction is rolled back, order row included.' }],
        explain: 'All or nothing: never an order without its event.',
      },
      {
        id: 's8-8-4',
        type: 'scenario',
        prompt: 'Orders are saved, then an event is published. Sometimes the event goes missing. Fix?',
        situation: 'The service crashes now and then between the save and the publish.',
        needs: ['Never a saved order without its event'],
        options: [
          {
            text: 'Outbox row in the same transaction',
            cost: 'A table and a relay to run.',
          },
          {
            text: 'Publish first, then save the row',
            cost: 'Nothing new.',
            why: 'A crash in between now sends an event for an order that does not exist.',
          },
        ],
        answer: 0,
        explain: 'Two separate writes can always be split by a crash; one transaction cannot.',
      },
      {
        id: 's8-8-5',
        type: 'mcq',
        prompt: 'The relay may publish an event twice (crash before marking it sent). Why is that acceptable?',
        options: [
          { text: 'Consumers handle repeats safely' },
          { text: 'Brokers always delete repeats', why: 'Do not rely on it; consumers must be idempotent.' },
          { text: 'It never happens', why: 'A crash between publish and mark makes it happen.' },
        ],
        answer: 0,
        explain: 'Outbox gives at least once; idempotent consumers make it effectively once.',
      },
      {
        id: 's8-8-6',
        type: 'bucket-sort',
        prompt: 'Inside the order transaction, or after it?',
        buckets: ['Inside', 'After it'],
        items: [
          { text: 'Insert the order row', bucket: 0, why: 'The data itself.' },
          { text: 'Insert the outbox row', bucket: 0, why: 'Saved with the data, or not at all.' },
          { text: 'Publish to the broker', bucket: 1, why: 'The relay does it later.' },
          { text: 'Mark the outbox row sent', bucket: 1, why: 'Only after publishing succeeds.' },
          { text: 'Email the customer', bucket: 1, why: 'A network call: never inside a database transaction.' },
        ],
        explain: 'Only database writes go in the transaction; the network call does not.',
      },
      {
        id: 's8-8-7',
        type: 'diagram',
        prompt: 'Which part sends the events to the broker?',
        diagram: {
          nodes: [
            { id: 's', kind: 'service', label: 'Orders' },
            { id: 'd', kind: 'db', label: 'Orders DB' },
            { id: 'r', kind: 'worker', label: 'Relay' },
            { id: 'q', kind: 'queue', label: 'Broker' },
          ],
          edges: [
            { from: 's', to: 'd' },
            { from: 'r', to: 'd' },
            { from: 'r', to: 'q' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'r',
          why: {
            s: 'The service only writes to its database.',
            d: 'The database stores the outbox; it does not publish.',
            q: 'The broker receives the events.',
          },
        },
        explain: 'The relay is the only part that talks to the broker.',
      },
      {
        id: 's8-8-8',
        type: 'fill-blank',
        prompt: 'The relay picks the rows not yet sent.',
        code: `box = [{"ev": "new", "sent": False},
       {"ev": "paid", "sent": True}]
todo = [r["ev"] for r in box
        if not r[___]]
print(todo)`,
        answer: ['"sent"'],
        distractors: [{ text: '"ev"', why: 'Every event name is truthy, so nothing is picked.' }],
        expectOutput: "['new']",
        explain: '"paid" went out already.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's8-09',
    title: 'Sagas',
    summary: 'Multi-service work runs as local steps, each with a compensating action run in reverse on failure.',
    card: {
      title: 'Sagas',
      text: 'Work across several services (reserve stock, charge the card, book a courier) cannot share one database transaction. A saga runs it as a sequence of local steps, each with a compensating action that undoes it: release the stock, refund the card. If a step fails, the saga runs the compensations for the steps already done, in reverse order.',
    },
    exercises: [
      {
        id: 's8-9-1',
        type: 'order-steps',
        prompt: 'Booking the courier fails. Put the saga in order.',
        steps: [
          'Reserve the stock',
          'Charge the card',
          'Booking the courier fails',
          'Refund the card',
          'Release the stock',
        ],
        explain: 'Compensations run in reverse: last done, first undone.',
      },
      {
        id: 's8-9-2',
        type: 'match-pairs',
        prompt: 'Match each step to its compensation.',
        pairs: [
          { left: 'Charge the card', right: 'refund it', why: 'A new action that cancels the effect.' },
          { left: 'Reserve stock', right: 'release it', why: 'Back on the shelf.' },
          { left: 'Book a courier', right: 'cancel the booking', why: 'Before the pickup.' },
        ],
        explain: 'A compensation is a new forward action, not a rollback.',
      },
      {
        id: 's8-9-3',
        type: 'run-code',
        prompt: 'Write `compensate(done, undo)`: the undo actions for the steps in `done`, last step first.',
        solution: `def compensate(done, undo):
    order = reversed(done)
    return [undo[s] for s in order]`,
        tests: [
          'u = {"stock": "release", "card": "refund"}',
          'got = compensate(["stock", "card"], u)',
          'assert got == ["refund", "release"], f"got {got}"',
          'assert compensate([], u) == [], "nothing done, nothing to undo"',
        ].join('\n'),
        maxLines: 3,
        placeholder: 'def compensate(done, undo):',
        explain: 'Reverse order unwinds dependencies safely.',
      },
      {
        id: 's8-9-4',
        type: 'mcq',
        prompt: 'What does a saga give up compared with one transaction?',
        options: [
          { text: 'Hiding half-done states' },
          { text: 'Durability of each step', why: 'Each local step commits durably.' },
          { text: 'Any way to undo steps', why: 'Compensations undo them.' },
        ],
        answer: 0,
        explain: 'Others can see the card charged before the courier is booked.',
      },
      {
        id: 's8-9-5',
        type: 'predict-output',
        prompt: 'The "ship" step fails. What does the saga return?',
        code: `def saga(steps, fail_at):
    done = []
    for s in steps:
        if s == fail_at:
            back = reversed(done)
            return ["undo " + d
                    for d in back]
        done.append(s)
    return done

steps = ["stock", "card", "ship"]
print(saga(steps, "ship"))`,
        answer: "['undo card', 'undo stock']",
        typedWrong: [{ answer: "['undo stock', 'undo card']", why: 'Reversed: the card was charged last, so it is undone first.' }],
        explain: 'The failed step itself did nothing, so it needs no undo.',
      },
      {
        id: 's8-9-6',
        type: 'bucket-sort',
        prompt: 'Can the step be cleanly undone?',
        buckets: ['Can undo', 'Cannot undo'],
        items: [
          { text: 'Reserve a seat', bucket: 0, why: 'Release it.' },
          { text: 'Charge a card', bucket: 0, why: 'Refund it.' },
          { text: 'Send an email', bucket: 1, why: 'You can only send another one.' },
          { text: 'Hand a parcel to a courier', bucket: 1, why: 'It is on the road.' },
          { text: 'Add loyalty points', bucket: 0, why: 'Remove them.' },
        ],
        explain: 'Steps that cannot be undone go last.',
      },
      {
        id: 's8-9-7',
        type: 'mcq',
        prompt: 'Where in a saga should the step that cannot be undone go?',
        options: [
          { text: 'Last, once the rest work' },
          { text: 'First, to get it done', why: 'If a later step fails, it cannot be taken back.' },
          { text: 'Anywhere in the middle', why: 'Any step after it could fail and need it undone.' },
        ],
        answer: 0,
        explain: 'Send the confirmation email only when everything else worked.',
      },
      {
        id: 's8-9-8',
        type: 'fill-blank',
        prompt: 'Undo the steps, last one first.',
        code: `done = ["card", "stock"]
undo = {"stock": "release",
        "card": "refund"}
print([undo[s] for s in ___(done)])`,
        answer: ['reversed'],
        distractors: [
          { text: 'sorted', why: 'Alphabetical order puts the card first.' },
          { text: 'list', why: 'That keeps the original order.' },
        ],
        expectOutput: "['release', 'refund']",
        explain: 'The stock was reserved last, so it is released first.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's8-10',
    title: 'Checkpoint: queues and async work',
    summary: 'Queues, pub-sub and logs, delivery, idempotency, retries, backpressure, ordering, outbox and sagas, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's8-10-1',
        type: 'figure',
        prompt: 'J2 crashes before its ack, J3 fails once, J5 always fails. Get every job done once, with J5 parked.',
        figure: { kind: 'queue', jobs: '.cf.p.', workers: 2, ackAfter: false, controls: ['ack', 'retries', 'idem', 'dlq'], goal: { clean: true } },
        explain: 'Ack after the work, one retry, idempotent handling and a dead-letter queue: all four.',
      },
      {
        id: 's8-10-2',
        type: 'mcq',
        prompt: 'A worker acknowledges after the work. What can happen if it crashes?',
        options: [
          { text: 'The work is done twice' },
          { text: 'The message is lost', why: 'Not acknowledged, so the queue hands it out again.' },
          { text: 'The queue stops', why: 'Other workers carry on.' },
        ],
        answer: 0,
        explain: 'At least once: handle repeats safely.',
      },
      {
        id: 's8-10-3',
        type: 'bucket-sort',
        prompt: 'Work queue, pub-sub or log?',
        buckets: ['Queue', 'Pub-sub', 'Log'],
        items: [
          { text: 'Encode each uploaded video once', bucket: 0, why: 'One worker per job.' },
          { text: 'Notify three services of a signup', bucket: 1, why: 'Fan out.' },
          { text: 'Let a new service read last week\'s events', bucket: 2, why: 'Kept history, replay from an offset.' },
          { text: 'Tell every server a setting changed', bucket: 1, why: 'Every subscriber needs it.' },
          { text: 'Rebuild a cache from the beginning', bucket: 2, why: 'Replay from offset 0.' },
        ],
        explain: 'Share work, fan out, or keep history.',
      },
      {
        id: 's8-10-4',
        type: 'predict-output',
        prompt: 'Message "a" arrives three times. How many times does the effect run?',
        code: `seen, runs = set(), 0
for m in ["a", "b", "a", "a"]:
    if m not in seen:
        seen.add(m)
        runs += 1
print(runs)`,
        answer: '2',
        typedWrong: [{ answer: '4', why: 'Repeats of "a" are skipped.' }],
        explain: 'Idempotent: one effect per message id.',
      },
      {
        id: 's8-10-5',
        type: 'estimate',
        prompt: 'Jobs arrive at 300 a second; workers finish 250 a second. Backlog after 10 minutes?',
        expr: '(300 - 250) * 10 * MINUTE',
        answer: 30000,
        tolerance: 1.5,
        unit: 'jobs',
        options: [
          { value: 500, why: '50 a second for 600 seconds.' },
          { value: 30000 },
          { value: 180000, why: 'Only the 50 a second that are not handled pile up.' },
        ],
        work: ['50 jobs/s left over', '50 × 600 s = 30,000'],
        explain: 'Add workers: the average rate is above capacity.',
      },
      {
        id: 's8-10-6',
        type: 'order-steps',
        prompt: 'The outbox pattern, in order.',
        steps: [
          'Save the row and the outbox entry in one transaction',
          'Commit',
          'The relay publishes the outbox entry',
          'The relay marks it sent',
        ],
        explain: 'Saved together, published after.',
      },
      {
        id: 's8-10-7',
        type: 'scenario',
        prompt: 'A trip booking reserves a hotel, then a flight. The flight is full. What now?',
        situation: 'The hotel and the airline are separate services with separate databases.',
        needs: ['No hotel booked without a flight'],
        options: [
          {
            text: 'Cancel the hotel booking',
            cost: 'Users may briefly see a held room.',
          },
          {
            text: 'Leave the hotel booked',
            cost: 'Nothing to run.',
            why: 'The customer pays for a hotel on a trip that is not happening.',
          },
        ],
        answer: 0,
        explain: 'A saga: undo the steps already done.',
      },
      {
        id: 's8-10-8',
        type: 'fill-blank',
        prompt: 'One customer\'s events must stay in order: choose the key.',
        code: `ev = {"customer": "c42",
      "type": "paid"}
key = ev[___]
print(key)`,
        answer: ['"customer"'],
        distractors: [{ text: '"type"', why: 'Partitioning by type splits one customer\'s events.' }],
        expectOutput: 'c42',
        explain: 'Same customer, same partition, in order.',
      },
      {
        id: 's8-10-9',
        type: 'mcq',
        prompt: 'A message fails every time it is handled. With no attempt cap, what happens?',
        options: [
          { text: 'It is retried forever' },
          { text: 'It is dropped after a while', why: 'Only if something caps the attempts.' },
          { text: 'It fixes itself', why: 'A bad message stays bad.' },
        ],
        answer: 0,
        explain: 'Cap the attempts and move it to a dead-letter queue.',
      },
      {
        id: 's8-10-10',
        type: 'mcq',
        prompt: 'Why spread retries with jitter?',
        options: [
          { text: 'So retries spread out' },
          { text: 'So they finish sooner', why: 'Jitter adds a little delay.' },
          { text: 'So fewer are needed', why: 'The count stays the same.' },
        ],
        answer: 0,
        explain: 'A thundering herd of retries knocks a recovering service over again.',
      },
    ],
  },
];
