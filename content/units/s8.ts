import { s8Labs } from '../labs/s8';
import { s8Library } from '../library/s8';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s8More } from './s8-more';

/*
 * S8 Queues, streams and async work. Lessons 1-5 here: doing work later,
 * queue versus publish-subscribe versus log, delivery guarantees, exactly
 * once as idempotent handling, retries and dead-letter queues. Lessons 6-10
 * in s8-more.ts: backpressure, ordering, the outbox pattern, sagas,
 * checkpoint. The queue figure appears from lesson 3.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's8-01',
    title: 'Doing work later',
    summary: 'A queue lets a request hand off slow work, absorb bursts and survive a slow dependency.',
    card: {
      title: 'Doing work later',
      text: 'Some work does not need to finish before the user gets an answer: sending an email, resizing a photo, building a report. The request puts a message on a queue and returns; workers take messages off and do the work. The queue absorbs bursts and keeps the request fast even when the email service is slow or down.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'User' },
          { id: 's', kind: 'service', label: 'Signup' },
          { id: 'q', kind: 'queue', label: 'Queue' },
          { id: 'w', kind: 'worker', label: 'Email worker' },
          { id: 'e', kind: 'api', label: 'Email API' },
        ],
        edges: [
          { from: 'c', to: 's' },
          { from: 's', to: 'q', label: 'async' },
          { from: 'q', to: 'w' },
          { from: 'w', to: 'e' },
        ],
      },
    },
    exercises: [
      {
        id: 's8-1-1',
        type: 'bucket-sort',
        prompt: 'Do it in the request, or queue it for later?',
        buckets: ['In the request', 'Queue it'],
        items: [
          { text: 'Checking the password at login', bucket: 0, why: 'The user cannot continue without the answer.' },
          { text: 'Sending the welcome email', bucket: 1, why: 'The user does not wait for it.' },
          { text: 'Resizing an uploaded photo', bucket: 1, why: 'Slow, and the page can show a placeholder.' },
          { text: 'Showing search results', bucket: 0, why: 'The results are the answer.' },
          { text: 'Building a monthly PDF report', bucket: 1, why: 'Slow; notify the user when it is ready.' },
          { text: 'Checking stock before an order', bucket: 0, why: 'The order depends on the answer.' },
        ],
        explain: 'Queue what the caller does not need to continue.',
      },
      {
        id: 's8-1-2',
        type: 'estimate',
        prompt: 'A burst puts 6,000 jobs on the queue at once. Workers finish 20 jobs a second. How many minutes to clear it?',
        expr: '6000 / 20 / MINUTE',
        answer: 5,
        tolerance: 1.5,
        unit: 'min',
        options: [
          { value: 0.5, why: '6000 / 20 = 300 seconds, not 30.' },
          { value: 5 },
          { value: 50, why: '300 seconds is 5 minutes.' },
        ],
        work: ['6000 / 20 = 300 s', '300 s / 60 = 5 min'],
        explain: 'The users who caused the burst got their answers at once; the work trails by minutes.',
      },
      {
        id: 's8-1-3',
        type: 'mcq',
        prompt: 'The welcome email is queued. What does the signup request wait for?',
        options: [
          { text: 'Only adding the message' },
          { text: 'The email to be sent', why: 'That happens later, in a worker.' },
          { text: 'The worker to start', why: 'The request returns as soon as the message is stored.' },
        ],
        answer: 0,
        explain: 'A few milliseconds instead of a slow call to the email provider.',
      },
      {
        id: 's8-1-4',
        type: 'diagram',
        prompt: 'Uploads arrive in bursts far faster than thumbnails can be made. Which part soaks up the burst?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Uploads' },
            { id: 's', kind: 'service', label: 'Upload API' },
            { id: 'q', kind: 'queue', label: 'Queue' },
            { id: 'w', kind: 'worker', label: 'Thumbnailer' },
            { id: 'o', kind: 'store', label: 'Photos' },
          ],
          edges: [
            { from: 'c', to: 's' },
            { from: 's', to: 'q' },
            { from: 'q', to: 'w' },
            { from: 'w', to: 'o' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'q',
          why: {
            c: 'The uploads are the burst itself.',
            s: 'The API only stores a message and returns.',
            w: 'Workers go at their own pace; they do not hold the excess.',
            o: 'The store keeps photos, not pending work.',
          },
        },
        explain: 'Messages wait in the queue until a worker is free.',
      },
      {
        id: 's8-1-5',
        type: 'predict-output',
        prompt: 'A queue hands out messages in the order they arrived. What does this print?',
        code: `from collections import deque
q = deque()
q.append("email:ann")
q.append("resize:7")
print(q.popleft(), len(q))`,
        answer: 'email:ann 1',
        typedWrong: [{ answer: 'resize:7 1', why: '`popleft` takes the oldest message: first in, first out.' }],
        explain: 'First in, first out; one message is still waiting.',
      },
      {
        id: 's8-1-6',
        type: 'scenario',
        prompt: 'The email provider is down for ten minutes. How should signup behave?',
        situation: 'Signup sends a welcome email. Today it calls the email provider inside the request.',
        needs: ['Signups keep working', 'Every new user still gets the email'],
        options: [
          {
            text: 'Queue the email, send it later',
            cost: 'Emails arrive late during the outage.',
          },
          {
            text: 'Keep calling it in the request',
            cost: 'Nothing new to run.',
            why: 'Every signup fails or hangs while the provider is down.',
          },
        ],
        answer: 0,
        explain: 'The queue keeps the messages until the provider is back.',
      },
      {
        id: 's8-1-7',
        type: 'mcq',
        prompt: 'When is a queue the wrong tool?',
        options: [
          { text: 'The caller needs it now' },
          { text: 'The work is slow', why: 'Slow work the caller does not need is the main use.' },
          { text: 'Traffic comes in bursts', why: 'Absorbing bursts is a queue\'s job.' },
        ],
        answer: 0,
        explain: 'A queue adds delay and a moving part; it cannot speed up an answer the user waits for.',
      },
      {
        id: 's8-1-8',
        type: 'fill-blank',
        prompt: 'Signup stores the user and queues the email.',
        code: `q = []
def signup(user):
    q.___("welcome:" + user)
    return "ok"

print(signup("ann"), q)`,
        answer: ['append'],
        distractors: [{ text: 'remove', why: '`remove` takes a message off; there is nothing to remove.' }],
        expectOutput: "ok ['welcome:ann']",
        explain: 'Add the message and return at once.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's8-02',
    title: 'Queue, pub-sub, log',
    summary: 'A work queue gives each message to one worker; pub-sub to every subscriber; a log keeps messages for replay.',
    card: {
      title: 'Queue, pub-sub, log',
      text: 'A work queue gives each message to exactly one of its workers, then deletes it. Publish-subscribe copies each message to every subscriber, so one event can reach email, stock and billing. A log keeps messages in order for a set time, and each reader tracks its own position (offset), so a new reader can start from the beginning.',
    },
    exercises: [
      {
        id: 's8-2-1',
        type: 'match-pairs',
        prompt: 'Match each kind to what it does with a message.',
        pairs: [
          { left: 'Work queue', right: 'one worker gets it', why: 'Workers share the load.' },
          { left: 'Pub-sub', right: 'every subscriber gets it', why: 'One event fans out.' },
          { left: 'Log', right: 'kept; readers track offsets', why: 'Readers can replay.' },
        ],
        explain: 'Share the work, fan out the news, or keep the history.',
      },
      {
        id: 's8-2-2',
        type: 'scenario',
        prompt: 'An order is placed. Email, stock and analytics all need to know. How?',
        situation: 'Today the order service calls the three services one after another.',
        needs: ['Adding a fourth service needs no change to orders', 'A slow service does not slow orders'],
        options: [
          {
            text: 'Publish one "order placed" event',
            cost: 'A broker to run; each service reacts on its own time.',
          },
          {
            text: 'Keep calling each service in turn',
            cost: 'No new parts.',
            why: 'Orders must know every service and wait on the slowest.',
          },
        ],
        answer: 0,
        explain: 'Publishers do not need to know who listens.',
      },
      {
        id: 's8-2-3',
        type: 'predict-output',
        prompt: 'Each reader of a log keeps its own offset. What does the search reader still have to read?',
        code: `log = ["a", "b", "c", "d"]
offset = {"billing": 4, "search": 1}
print(log[offset["search"]:])`,
        answer: "['b', 'c', 'd']",
        typedWrong: [{ answer: '[]', why: 'That is billing: it has read all four.' }],
        explain: 'Readers move at their own pace through the same log.',
      },
      {
        id: 's8-2-4',
        type: 'mcq',
        prompt: 'A new analytics service needs every order from last week. Which keeps them?',
        options: [
          { text: 'A log kept for a week' },
          { text: 'A work queue', why: 'Messages are deleted once a worker handles them.' },
          { text: 'Pub-sub with no storage', why: 'Subscribers get only what is sent after they join.' },
        ],
        answer: 0,
        explain: 'Retention plus offsets make replay possible.',
      },
      {
        id: 's8-2-5',
        type: 'bucket-sort',
        prompt: 'Work queue, pub-sub or log?',
        buckets: ['Queue', 'Pub-sub', 'Log'],
        items: [
          { text: 'Resize each uploaded image once', bucket: 0, why: 'One worker per job.' },
          { text: 'Tell email, stock and billing about an order', bucket: 1, why: 'Every subscriber needs it.' },
          { text: 'Replay last month\'s clicks into a new model', bucket: 2, why: 'Needs kept history.' },
          { text: 'Spread 1,000 PDF jobs over 5 workers', bucket: 0, why: 'Sharing the load.' },
          { text: 'Rebuild a search index from the start', bucket: 2, why: 'Read the log from offset 0.' },
          { text: 'Push a price change to every cache', bucket: 1, why: 'Fan out to all.' },
        ],
        explain: 'Logs can do the other two jobs as well, which is why many systems use one.',
      },
      {
        id: 's8-2-6',
        type: 'predict-output',
        prompt: 'Two workers share a queue, taking turns. Which jobs does worker B get?',
        code: `jobs = ["j1", "j2", "j3", "j4", "j5"]
got = {"A": [], "B": []}
for i, j in enumerate(jobs):
    got["AB"[i % 2]].append(j)
print(got["B"])`,
        answer: "['j2', 'j4']",
        typedWrong: [{ answer: "['j1', 'j3', 'j5']", why: 'Those went to A (even positions).' }],
        explain: 'Each job goes to exactly one worker.',
      },
      {
        id: 's8-2-7',
        type: 'mcq',
        prompt: 'A pub-sub subscriber with no storage is down for a minute. What does it miss?',
        options: [
          { text: 'Everything sent while it was down' },
          { text: 'Nothing: it gets them later', why: 'Only if the messages are kept somewhere.' },
          { text: 'Only the first message', why: 'Every message in that minute is gone for it.' },
        ],
        answer: 0,
        explain: 'Durable subscriptions or a log fix this.',
      },
      {
        id: 's8-2-8',
        type: 'fill-blank',
        prompt: 'Read from your offset, then move the offset past what you read.',
        code: `def read(log, pos):
    msgs = log[pos:]
    return msgs, pos + len(___)

log = ["a", "b", "c"]
print(read(log, 1))`,
        answer: ['msgs'],
        distractors: [{ text: 'log', why: 'That jumps past the end: 1 + 3 = 4.' }],
        expectOutput: "(['b', 'c'], 3)",
        explain: 'The new offset is where the next read starts.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's8-03',
    title: 'Delivery guarantees',
    summary: 'Acknowledge before the work and a failure loses it; acknowledge after and a crash repeats it.',
    card: {
      title: 'Delivery guarantees',
      text: 'A worker takes a message, does the work and acknowledges it; until the ack, the queue keeps the message and hands it out again after a timeout. Acknowledging first means a failed attempt is lost: at most once. Acknowledging after the work means a crash before the ack repeats it: at least once.',
      figure: { kind: 'queue', jobs: '.c.f..', workers: 2, retries: 1, controls: ['ack'] },
    },
    exercises: [
      {
        id: 's8-3-1',
        type: 'figure',
        prompt: 'J3 and J5 fail on their first attempt. Choose when to acknowledge so neither is lost.',
        figure: { kind: 'queue', jobs: '..f.f.', workers: 2, retries: 1, ackAfter: false, controls: ['ack'], goal: { clean: true } },
        explain: 'Acknowledging after the work lets the failed attempts be retried.',
      },
      {
        id: 's8-3-2',
        type: 'bucket-sort',
        prompt: 'Is at most once good enough?',
        buckets: ['Can be lost', 'Must arrive'],
        items: [
          { text: 'A live location ping every second', bucket: 0, why: 'The next ping replaces a lost one.' },
          { text: 'A payment confirmation email', bucket: 1, why: 'The customer must get it.' },
          { text: 'A sample for a metrics graph', bucket: 0, why: 'One missing point does not matter.' },
          { text: 'An order to ship a parcel', bucket: 1, why: 'Losing it loses a sale.' },
          { text: 'A "typing…" indicator', bucket: 0, why: 'Gone in a second anyway.' },
        ],
        explain: 'At most once is cheap and only fits messages that can be lost.',
      },
      {
        id: 's8-3-3',
        type: 'order-steps',
        prompt: 'At least once: how does a job end up done twice?',
        steps: [
          'A worker takes the message',
          'It does the work',
          'It crashes before acknowledging',
          'The timeout passes; the message is visible again',
          'Another worker takes it and does the work again',
        ],
        explain: 'The queue cannot tell "crashed before the work" from "crashed after".',
      },
      {
        id: 's8-3-4',
        type: 'predict-output',
        prompt: 'The first attempt crashes after the work, so the message comes back. What was done?',
        code: `done = []
def handle(msg, crash):
    done.append(msg)
    if crash:
        return None   # no ack
    return "ack"

if handle("pay:42", True) is None:
    handle("pay:42", False)
print(done)`,
        answer: "['pay:42', 'pay:42']",
        typedWrong: [{ answer: "['pay:42']", why: 'The work ran in both attempts.' }],
        explain: 'Paid twice: the next lesson fixes this.',
      },
      {
        id: 's8-3-5',
        type: 'mcq',
        prompt: 'Why does the queue keep a message until it is acknowledged?',
        options: [
          { text: 'The worker may die mid-job' },
          { text: 'To keep messages in order', why: 'Order is a separate concern.' },
          { text: 'To save memory on workers', why: 'It is about not losing work.' },
        ],
        answer: 0,
        explain: 'No ack in time means "try again with someone else".',
      },
      {
        id: 's8-3-6',
        type: 'mcq',
        prompt: 'For important work, what do most systems choose?',
        options: [
          { text: 'At least once, safe repeats' },
          { text: 'At most once', why: 'Failures would silently lose work.' },
          { text: 'Exactly once by the network', why: 'Networks cannot promise it; handlers must.' },
        ],
        answer: 0,
        explain: 'Never lose work, and make repeats harmless.',
      },
      {
        id: 's8-3-7',
        type: 'figure',
        prompt: 'The worker on J2 crashes after the work, before the ack. Using only the ack setting, stop J2 being done twice.',
        figure: { kind: 'queue', jobs: '.c....', workers: 2, retries: 1, controls: ['ack'], goal: { clean: true } },
        explain: 'Acknowledging first avoids the repeat here, but only because no job fails. The next lesson keeps both.',
      },
      {
        id: 's8-3-8',
        type: 'fill-blank',
        prompt: 'Acknowledge after the work.',
        code: `def run(ack_first):
    log = []
    if ack_first:
        log.append("ack")
    log.append("work")
    if not ack_first:
        log.append("ack")
    return log

print(run(___))`,
        answer: ['False'],
        distractors: [{ text: 'True', why: 'That acknowledges before the work: at most once.' }],
        expectOutput: "['work', 'ack']",
        explain: 'Ack last: at least once.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's8-04',
    title: 'Exactly once means idempotent',
    summary: 'Repeats cannot be prevented, so make handling safe to repeat: record each message id with its effect.',
    card: {
      title: 'Exactly once means idempotent',
      text: 'Crashes and timeouts make repeated delivery unavoidable, so "exactly once" in practice means at-least-once delivery plus handling that is safe to repeat (idempotent). Give each message an id and record handled ids together with the effect, in one transaction. A repeat finds its id already recorded and does nothing.',
    },
    exercises: [
      {
        id: 's8-4-1',
        type: 'figure',
        prompt: 'J2 and J5 crash before their ack and are delivered again. Stop them being done twice.',
        figure: { kind: 'queue', jobs: '.c..c.', workers: 2, controls: ['idem'], goal: { clean: true } },
        explain: 'The repeat is delivered, recognised and skipped.',
      },
      {
        id: 's8-4-2',
        type: 'bucket-sort',
        prompt: 'Safe to repeat as it is?',
        buckets: ['Safe to repeat', 'Not safe'],
        items: [
          { text: 'Set order 7\'s status to shipped', bucket: 0, why: 'Setting it again changes nothing.' },
          { text: 'Add 10 to a balance', bucket: 1, why: 'Twice adds 20.' },
          { text: 'Delete row 7', bucket: 0, why: 'Already gone the second time.' },
          { text: 'Send an email', bucket: 1, why: 'The user gets two.' },
          { text: 'Save user 9\'s profile by id', bucket: 0, why: 'Same id, same row, same content.' },
          { text: 'Insert a new payment row', bucket: 1, why: 'Two rows, two payments.' },
        ],
        explain: '"Set to" is naturally safe; "add" and "insert" need an id check.',
      },
      {
        id: 's8-4-3',
        type: 'predict-output',
        prompt: 'm1 is delivered twice. What is the balance?',
        code: `seen, balance = set(), 0
def credit(msg_id, amount):
    global balance
    if msg_id in seen:
        return
    seen.add(msg_id)
    balance += amount

for m in ["m1", "m2", "m1"]:
    credit(m, 10)
print(balance)`,
        answer: '20',
        typedWrong: [{ answer: '30', why: 'The second m1 finds its id in `seen` and returns.' }],
        explain: 'Three deliveries, two effects.',
      },
      {
        id: 's8-4-4',
        type: 'mcq',
        prompt: 'Where must the handled message id be recorded?',
        options: [
          { text: 'With the effect, atomically' },
          { text: 'In the worker\'s memory', why: 'A crash forgets it, and other workers never see it.' },
          { text: 'In a file, afterwards', why: 'A crash between the effect and the file repeats the effect.' },
        ],
        answer: 0,
        explain: 'Same transaction: either both are saved or neither is.',
      },
      {
        id: 's8-4-5',
        type: 'run-code',
        prompt: 'Write `handle(seen, msg_id, do)`: if the id is new, record it, call `do()` and return True; otherwise return False.',
        solution: `def handle(seen, msg_id, do):
    if msg_id in seen:
        return False
    seen.add(msg_id)
    do()
    return True`,
        tests: [
          'calls = []',
          's = set()',
          'r = [handle(s, i, lambda: calls.append(1)) for i in ("a", "b", "a")]',
          'assert r == [True, True, False], f"got {r}"',
          'assert len(calls) == 2, "the repeat must not run the effect"',
        ].join('\n'),
        maxLines: 6,
        placeholder: 'def handle(seen, msg_id, do):',
        explain: 'Check, record, act: the core of every idempotent consumer.',
      },
      {
        id: 's8-4-6',
        type: 'scenario',
        prompt: 'A worker charges a card through a payment API. The call times out. Retry?',
        situation: 'A timeout does not say whether the charge happened.',
        needs: ['Never charge twice', 'Never skip a charge'],
        options: [
          {
            text: 'Retry, same idempotency key',
            cost: 'Generate and store a key per charge.',
          },
          {
            text: 'Never retry a charge',
            cost: 'Simpler code.',
            why: 'If the first call never arrived, the charge is skipped.',
          },
          {
            text: 'Retry with a fresh request',
            cost: 'Nothing extra.',
            why: 'If the first call did arrive, the customer pays twice.',
          },
        ],
        answer: 0,
        explain: 'The provider sees the same key and returns the first result instead of charging again.',
      },
      {
        id: 's8-4-7',
        type: 'mcq',
        prompt: 'How can "add 10 points" be made safe to repeat?',
        options: [
          { text: 'Store the message id' },
          { text: 'Retry it fewer times', why: 'One crash is enough to repeat it.' },
          { text: 'Use a faster queue', why: 'Speed does not stop redelivery.' },
        ],
        answer: 0,
        explain: 'The id turns a repeat into a no-op.',
      },
      {
        id: 's8-4-8',
        type: 'fill-blank',
        prompt: 'Skip a message whose id was already handled.',
        code: `def handle(msg_id, seen):
    if msg_id ___ seen:
        return "skip"
    seen.add(msg_id)
    return "done"

s = set()
print(handle(1, s), handle(1, s))`,
        answer: ['in'],
        distractors: [{ text: 'not in', why: 'That skips every new message and never records one.' }],
        expectOutput: 'done skip',
        explain: 'Same id, second time: skipped.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's8-05',
    title: 'Retries and dead letters',
    summary: 'Retry with growing, jittered delays and a cap; park messages that keep failing in a dead-letter queue.',
    card: {
      title: 'Retries and dead letters',
      text: 'Retry a failed message after a delay that doubles each time, with some randomness (jitter), so a struggling service gets room to recover. Cap the attempts: a message that always fails (a poison message) would otherwise loop forever. After the last attempt, move it to a dead-letter queue, where a person can inspect it and replay it once fixed.',
    },
    exercises: [
      {
        id: 's8-5-1',
        type: 'figure',
        prompt: 'J2 and J6 fail once; J4 always fails. Get every job done once, with J4 parked for a person.',
        figure: { kind: 'queue', jobs: '.f.p.f', workers: 2, idem: true, controls: ['retries', 'dlq'], goal: { clean: true } },
        explain: 'One retry rescues the flaky jobs; the dead-letter queue keeps the poison one.',
      },
      {
        id: 's8-5-2',
        type: 'predict-output',
        prompt: 'Doubling delays, in seconds. What does this print?',
        code: `delays = [2 ** n for n in range(5)]
print(delays, sum(delays))`,
        answer: '[1, 2, 4, 8, 16] 31',
        typedWrong: [{ answer: '[2, 4, 8, 16, 32] 62', why: '`range(5)` starts at 0, and 2 ** 0 = 1.' }],
        explain: 'Five retries spread over half a minute.',
      },
      {
        id: 's8-5-3',
        type: 'mcq',
        prompt: 'A thousand workers fail at the same moment. Why add jitter to their retries?',
        options: [
          { text: 'Spread retries out in time' },
          { text: 'Make retries faster', why: 'Jitter adds a little delay, not speed.' },
          { text: 'Fewer attempts in total', why: 'The count is the same; the timing differs.' },
        ],
        answer: 0,
        explain: 'Without it, all thousand retry at once and knock the service over again.',
      },
      {
        id: 's8-5-4',
        type: 'bucket-sort',
        prompt: 'Retry it, or send it straight to the dead-letter queue?',
        buckets: ['Retry', 'Dead-letter'],
        items: [
          { text: 'Timeout from a busy service', bucket: 0, why: 'Likely fine next time.' },
          { text: '503 Service Unavailable', bucket: 0, why: 'Temporary by definition.' },
          { text: 'Message body is not valid JSON', bucket: 1, why: 'It will fail the same way every time.' },
          { text: '429 Too Many Requests', bucket: 0, why: 'Wait and try again.' },
          { text: 'Refers to a deleted account', bucket: 1, why: 'Retrying cannot bring it back.' },
        ],
        explain: 'Retry what is temporary; park what is permanent.',
      },
      {
        id: 's8-5-5',
        type: 'estimate',
        prompt: 'A poison message with no attempt cap is retried every 100 ms. How many attempts in a day?',
        expr: 'DAY / 0.1',
        answer: 864000,
        tolerance: 1.5,
        unit: 'attempts',
        options: [
          { value: 8640, why: '86,400 seconds × 10 per second.' },
          { value: 864000 },
          { value: 86400000, why: 'Ten a second, not a thousand.' },
        ],
        work: ['86,400 s / 0.1 s = 864,000'],
        explain: 'Close to a million useless attempts, each using a worker.',
      },
      {
        id: 's8-5-6',
        type: 'order-steps',
        prompt: 'A message keeps failing. Put its story in order.',
        steps: [
          'The first attempt fails',
          'Retry after 1 s; it fails',
          'Retry after 2 s; it fails',
          'Attempts used up: it moves to the dead-letter queue',
          'An engineer fixes the bug and replays it',
        ],
        explain: 'Nothing is lost and nothing loops forever.',
      },
      {
        id: 's8-5-7',
        type: 'run-code',
        prompt: 'Write `backoff(n, base, cap)`: the delay before retry `n` (from 0) is `base` doubled `n` times, but never more than `cap`.',
        solution: `def backoff(n, base, cap):
    return min(cap, base * 2 ** n)`,
        tests: [
          'got = [backoff(n, 1, 10) for n in range(6)]',
          'assert got == [1, 2, 4, 8, 10, 10], f"got {got}"',
        ].join('\n'),
        maxLines: 2,
        placeholder: 'def backoff(n, base, cap):',
        explain: 'The cap stops delays growing to hours.',
      },
      {
        id: 's8-5-8',
        type: 'fill-blank',
        prompt: 'After the last allowed attempt, dead-letter it.',
        code: `def route(attempts, limit):
    if attempts ___ limit:
        return "dead-letter"
    return "retry"

print(route(3, 3), route(1, 3))`,
        answer: ['>='],
        distractors: [{ text: '<', why: 'That parks fresh messages and retries exhausted ones.' }],
        expectOutput: 'dead-letter retry',
        explain: 'Three attempts used of three: stop.',
      },
    ],
  },
];

export const s8: Unit = {
  id: 'S8',
  track: 'system-design',
  title: 'Queues, streams and async work',
  blurb: 'Work queues, pub-sub and logs, delivery guarantees and idempotent handling, retries and dead-letter queues, backpressure, ordering, the outbox pattern and sagas.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s8More],
  labs: s8Labs,
  library: s8Library,
};
