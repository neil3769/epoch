import type { Walkthrough } from '../schema';

/*
 * Walkthrough 11: a payment system, through the seven-step framework.
 * Unlocks after S1-S3, S5 (databases, transactions), S7 (consistency),
 * S8 (queues, idempotency) and S10 (reliability).
 */
export const payments: Walkthrough = {
  id: 'w-payments',
  title: 'Payment system',
  question: 'Design the payment system for an online shop: charge customers through a card processor and keep an exact record of every movement of money.',
  needs: ['S1', 'S2', 'S3', 'S5', 'S7', 'S8', 'S10'],
  minutes: 20,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "About a million orders a day. We use an external card processor. Money must never be charged twice or lost."',
      exercises: [
        {
          id: 'wps-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Charge a card for an order', bucket: 0, why: 'The core feature.' },
            { text: 'Refunds', bucket: 0, why: 'A shop cannot run without them.' },
            { text: 'A ledger of every movement', bucket: 0, why: 'The exact record asked for.' },
            { text: 'Storing card numbers ourselves', bucket: 1, why: 'Let the processor hold them; storing cards brings heavy compliance rules.' },
            { text: 'Many currencies', bucket: 1, why: 'Not asked for; adds exchange rates and rounding rules.' },
            { text: 'Our own fraud model', bucket: 1, why: 'Processors offer fraud checks; build later if needed.' },
          ],
          explain: 'Charge, refund, record; the processor handles the cards.',
        },
        {
          id: 'wps-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most?',
          options: [
            { text: 'Exactly-once effect on money' },
            { text: 'The lowest possible latency', why: 'A payment may take a second or two; it must never be wrong.' },
            { text: 'Availability over correctness', why: 'An available system that double-charges is worse than a brief outage.' },
          ],
          answer: 0,
          explain: 'Retries will happen; their effect on money must happen once.',
        },
        {
          id: 'wps-1-3',
          type: 'scenario',
          prompt: 'A network fault splits the ledger database\'s replicas. What should payments do?',
          situation: 'Each side can still reach some customers.',
          needs: ['No money recorded twice or lost'],
          options: [
            { text: 'Refuse payments until healed', cost: 'Some sales fail for a few minutes.' },
            {
              text: 'Keep accepting on both sides',
              cost: 'No lost sales.',
              why: 'Two sides could record conflicting movements of the same money.',
            },
          ],
          answer: 0,
          explain: 'A CP choice (S7): for money, consistency wins during a partition.',
        },
      ],
      strong: 'Charge, refund and record every movement in a ledger; the processor holds card numbers. Correctness first: each payment affects money exactly once, even with retries, and the ledger stays consistent even at the cost of brief unavailability.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "Peak is five times the average. Each payment writes about five ledger rows of 200 bytes. Keep records for ten years."',
      exercises: [
        {
          id: 'wps-2-1',
          type: 'estimate',
          prompt: 'Payments per second, on average?',
          expr: '1e6 / DAY',
          answer: 11.6,
          tolerance: 2,
          unit: 'payments/s',
          options: [
            { value: 1.2, why: '10⁶ / 86,400 ≈ 12.' },
            { value: 12 },
            { value: 120, why: 'That would be ten million orders a day.' },
          ],
          work: ['10⁶ / 86,400 s ≈ 12 a second'],
          explain: 'Small numbers: scale is not the hard part here.',
        },
        {
          id: 'wps-2-2',
          type: 'estimate',
          prompt: 'Payments per second at peak?',
          expr: '1e6 / DAY * 5',
          answer: 58,
          tolerance: 2,
          unit: 'payments/s',
          options: [
            { value: 6, why: 'Peak is five times the average of about 12.' },
            { value: 60 },
            { value: 600, why: '12 × 5 is 60, not 600.' },
          ],
          work: ['12 × 5 ≈ 60 a second'],
          explain: 'Easily within one relational database.',
        },
        {
          id: 'wps-2-3',
          type: 'estimate',
          prompt: 'Ledger storage over ten years?',
          expr: '1e6 * 5 * 200 * 365 * 10 / TB',
          answer: 3.65,
          tolerance: 2,
          unit: 'TB',
          options: [
            { value: 0.4, why: '1 GB a day × 3,650 days ≈ 3.7 TB.' },
            { value: 4 },
            { value: 40, why: '10⁹ B a day for 3,650 days is about 3.7 TB.' },
          ],
          work: ['10⁶ × 5 rows × 200 B = 1 GB a day', '1 GB × 3,650 days ≈ 3.7 TB'],
          explain: 'Fits on one machine, with old years archived.',
        },
      ],
      strong: 'About 12 payments a second, 60 at peak, and under 4 TB of ledger over ten years: small. The difficulty is correctness under failures, not scale.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Every request that moves money carries an idempotency key.',
      exercises: [
        {
          id: 'wps-3-1',
          type: 'predict-output',
          prompt: 'Checkout retries a payment with the same key after a timeout. What does this print?',
          code: `done = {}
def pay(key, amount):
    if key in done:
        return done[key]
    done[key] = f"charged {amount}"
    return done[key]
print(pay("ord-9", 30))
print(pay("ord-9", 30), len(done))`,
          answer: 'charged 30\ncharged 30 1',
          typedWrong: [{ answer: 'charged 30\ncharged 30 2', why: 'The retry finds the key and returns the saved result.' }],
          explain: 'The retry gets the first answer back instead of a second charge (S8).',
        },
        {
          id: 'wps-3-2',
          type: 'match-pairs',
          prompt: 'Match each call to its job.',
          pairs: [
            { left: 'POST /payments with a key', right: 'charge once for an order', why: 'The key makes retries safe.' },
            { left: 'GET /payments/{id}', right: 'its current status', why: 'Pending, succeeded or failed.' },
            { left: 'POST /refunds', right: 'return money for a payment', why: 'Also with an idempotency key.' },
            { left: 'Processor webhook', right: 'the processor reports an outcome', why: 'Arrives later, sometimes more than once.' },
          ],
          explain: 'Webhooks need idempotent handling too: the same event can arrive twice.',
        },
        {
          id: 'wps-3-3',
          type: 'mcq',
          prompt: 'The processor\'s reply times out. What does the customer see?',
          options: [
            { text: 'Pending; status confirmed later' },
            { text: 'Failed, so please pay again', why: 'It may have succeeded: paying again could charge twice.' },
            { text: 'Succeeded, to be safe', why: 'It may have failed: the shop would ship unpaid orders.' },
          ],
          answer: 0,
          explain: 'Unknown is a real state: resolve it by asking the processor or waiting for the webhook.',
        },
      ],
      strong: 'POST /payments and /refunds with an idempotency key, GET for status, and a webhook from the processor; a timeout leaves the payment pending, never guessed as failed or succeeded.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Record payments and a double-entry ledger, where every movement has two sides.',
      exercises: [
        {
          id: 'wps-4-1',
          type: 'scenario',
          prompt: 'Which store for payments and the ledger?',
          situation: 'A payment writes several rows that must all be recorded or none.',
          needs: ['Transactions across rows', 'Strict consistency'],
          options: [
            { text: 'A relational database', cost: 'Harder to spread across many machines.' },
            {
              text: 'An eventually consistent KV',
              cost: 'Scales out easily.',
              why: 'No multi-row transactions, and reads may be stale.',
            },
            {
              text: 'A cache, backed up nightly',
              cost: 'Very fast.',
              why: 'A crash loses the day\'s money movements.',
            },
          ],
          answer: 0,
          explain: 'ACID transactions (S5); the load is small enough for one primary.',
        },
        {
          id: 'wps-4-2',
          type: 'predict-output',
          prompt: 'A double-entry ledger: a sale of 30, then a refund of 5. What are the cash balance and the sum of all accounts?',
          code: `ledger = [
    ("cash", +30), ("sales", -30),
    ("sales", +5), ("cash", -5),
]
bal = {}
for acct, amt in ledger:
    bal[acct] = bal.get(acct, 0) + amt
print(bal["cash"], sum(bal.values()))`,
          answer: '25 0',
          typedWrong: [{ answer: '25 25', why: 'Every entry has an equal and opposite partner, so all accounts sum to zero.' }],
          explain: 'If the total is ever not zero, something is wrong: a built-in check.',
        },
        {
          id: 'wps-4-3',
          type: 'mcq',
          prompt: 'A ledger entry turns out to be wrong. How do you fix it?',
          options: [
            { text: 'Add a reversing entry' },
            { text: 'Edit the row in place', why: 'The ledger is append-only: its history must show what happened.' },
            { text: 'Delete the bad row', why: 'Deleting hides the mistake from auditors.' },
          ],
          answer: 0,
          explain: 'Append-only: corrections are new entries.',
        },
      ],
      strong: 'A relational database: a payments table with status and idempotency key, and an append-only double-entry ledger where every movement has two entries summing to zero; corrections are new entries.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'One payment service owns the money logic; the processor moves the actual funds.',
      exercises: [
        {
          id: 'wps-5-1',
          type: 'diagram',
          prompt: 'The payment service asks something outside the company to charge the card. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Checkout' },
              { id: 'p', kind: 'service', label: 'Payment svc' },
              { id: 'd', kind: 'db', label: 'Ledger DB' },
              { id: 'x', kind: 'api', label: 'Processor' },
            ],
            edges: [
              { from: 'c', to: 'p' },
              { from: 'p', to: 'd' },
              { from: 'p', to: 'x', label: 'charge' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'x',
            options: [
              { kind: 'api', label: 'Processor' },
              { kind: 'service', label: 'In-house', why: 'Handling card numbers ourselves brings heavy compliance work.' },
              { kind: 'db', label: 'Card table', why: 'Storing card numbers is exactly what we avoid.' },
            ],
            answer: 0,
          },
          explain: 'The processor talks to the card networks and banks.',
        },
        {
          id: 'wps-5-2',
          type: 'diagram',
          prompt: 'A charge. Tap its path from checkout to the processor.',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Checkout' },
              { id: 'p', kind: 'service', label: 'Payment svc' },
              { id: 'd', kind: 'db', label: 'Ledger DB' },
              { id: 'x', kind: 'api', label: 'Processor' },
              { id: 'q', kind: 'queue', label: 'Events' },
            ],
            edges: [
              { from: 'c', to: 'p' },
              { from: 'p', to: 'd' },
              { from: 'p', to: 'x' },
              { from: 'p', to: 'q' },
            ],
          },
          goal: { kind: 'path', answer: ['c', 'p', 'x'] },
          explain: 'The ledger and events are written by the payment service around the charge.',
        },
        {
          id: 'wps-5-3',
          type: 'order-steps',
          prompt: 'Put one payment in order.',
          steps: [
            'Checkout sends the order with an idempotency key',
            'The payment service records it as pending',
            'It asks the processor to charge',
            'The processor replies, or later calls the webhook',
            'The service writes ledger entries and marks it paid',
          ],
          explain: 'Record "pending" first, so a crash mid-charge leaves a trace to resolve.',
        },
      ],
      strong: 'Checkout → payment service, which records the payment as pending, charges through the processor, takes the result by reply or webhook, writes the ledger in one transaction and publishes an event for receipts and reports.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Checkout' },
          { id: 'p', kind: 'service', label: 'Payment svc' },
          { id: 'd', kind: 'db', label: 'Ledger DB' },
          { id: 'x', kind: 'api', label: 'Processor' },
          { id: 'q', kind: 'queue', label: 'Events' },
        ],
        edges: [
          { from: 'c', to: 'p', label: 'key' },
          { from: 'p', to: 'd' },
          { from: 'p', to: 'x', label: 'charge' },
          { from: 'p', to: 'q', dashed: true },
          { from: 'x', to: 'p', label: 'webhook', dashed: true },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: failures between us and the processor, and proving the books agree.',
      exercises: [
        {
          id: 'wps-6-1',
          type: 'scenario',
          prompt: 'The charge call times out. Did the money move?',
          situation: 'The processor accepts idempotency keys on charges.',
          needs: ['Find out without charging twice'],
          options: [
            { text: 'Retry with the same key', cost: 'Needs the processor to support keys.' },
            {
              text: 'Retry as a new charge',
              cost: 'Works with any processor.',
              why: 'If the first went through, the customer pays twice.',
            },
            {
              text: 'Mark it failed',
              cost: 'Simple to build.',
              why: 'It may have succeeded: money taken with no order.',
            },
          ],
          answer: 0,
          explain: 'The processor sees the same key and returns the first result.',
        },
        {
          id: 'wps-6-2',
          type: 'predict-output',
          prompt: 'Nightly reconciliation compares our records with the processor\'s report. Which payments disagree?',
          code: `ours = {"p1": 30, "p2": 15, "p3": 8}
theirs = {"p1": 30, "p2": 12,
          "p4": 9}
ids = sorted(ours | theirs)
o, t = ours.get, theirs.get
bad = [i for i in ids if o(i) != t(i)]
print(bad)`,
          answer: "['p2', 'p3', 'p4']",
          typedWrong: [{ answer: "['p2']", why: 'p3 is missing at the processor and p4 is missing from ours: both disagree.' }],
          explain: 'Missing on either side counts as a mismatch.',
        },
        {
          id: 'wps-6-3',
          type: 'mcq',
          prompt: 'Reconciliation finds p4: charged by the processor, missing from our ledger. What next?',
          options: [
            { text: 'Flag it; fix with new entries' },
            { text: 'Ignore it; totals are close', why: 'A customer was charged for nothing recorded.' },
            { text: 'Delete it at the processor', why: 'You cannot quietly undo a real charge; refund it if needed.' },
          ],
          answer: 0,
          explain: 'Someone investigates; the fix is new ledger entries or a refund, never edits.',
        },
      ],
      strong: 'Timeouts are retried with the same idempotency key, so the processor charges at most once; the payment stays pending until resolved; nightly reconciliation against the processor\'s report flags every mismatch for correction by new entries.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Break the processor, then grow to ten times the orders.',
      exercises: [
        {
          id: 'wps-7-1',
          type: 'scenario',
          prompt: 'The card processor is down for 20 minutes.',
          situation: 'You have a contract with a second processor.',
          needs: ['Sales continue', 'No double charges'],
          options: [
            { text: 'Fail over to a backup processor', cost: 'Two integrations to build and reconcile.' },
            {
              text: 'Keep retrying the same one',
              cost: 'Nothing new to build.',
              why: 'Retries during an outage add load and leave customers waiting (S10).',
            },
          ],
          answer: 0,
          explain: 'A circuit breaker notices the outage; pending payments stay with the processor that got them.',
        },
        {
          id: 'wps-7-2',
          type: 'mcq',
          prompt: 'Ten times the orders: about 600 payments a second at peak. What changes?',
          options: [
            { text: 'One good database still copes' },
            { text: 'Shard everything immediately', why: 'A few thousand rows a second fit one well-sized relational database.' },
            { text: 'Switch to an eventual store', why: 'Gives up the consistency money needs.' },
          ],
          answer: 0,
          explain: 'Add a replica for reports and failover; shard by merchant only when truly needed.',
        },
        {
          id: 'wps-7-3',
          type: 'bucket-sort',
          prompt: 'Which work happens while the customer waits, and which in the background?',
          buckets: ['Synchronous', 'In background'],
          items: [
            { text: 'Checking the idempotency key', bucket: 0, why: 'Must happen before charging.' },
            { text: 'Recording the pending payment', bucket: 0, why: 'Must exist before the charge starts.' },
            { text: 'Charging the card', bucket: 0, why: 'The customer waits for the outcome.' },
            { text: 'Sending the receipt email', bucket: 1, why: 'From the events queue; a delay is fine.' },
            { text: 'Daily reconciliation', bucket: 1, why: 'A nightly batch job.' },
            { text: 'Updating sales reports', bucket: 1, why: 'Reads a replica or events, later.' },
          ],
          explain: 'Keep only what decides the outcome on the customer\'s path.',
        },
      ],
      strong: 'A circuit breaker and a backup processor keep sales going; at 10× one well-sized database with a replica still copes, and everything that does not decide the outcome runs in the background from events.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'c', kind: 'client', label: 'Checkout' },
        { id: 'p', kind: 'service', label: 'Payment svc' },
        { id: 'd', kind: 'db', label: 'Ledger DB' },
        { id: 'x', kind: 'api', label: 'Processor' },
        { id: 'q', kind: 'queue', label: 'Events' },
      ],
      edges: [
        { from: 'c', to: 'p', label: 'key' },
        { from: 'p', to: 'd' },
        { from: 'p', to: 'x', label: 'charge' },
        { from: 'p', to: 'q', dashed: true },
        { from: 'x', to: 'p', label: 'webhook', dashed: true },
      ],
    },
    decisions: [
      'Idempotency keys on every money-moving request, passed on to the processor.',
      'The processor holds card numbers; we never store them.',
      'A relational database with an append-only double-entry ledger; fixes are new entries.',
      'Timeouts leave payments pending; nightly reconciliation flags every mismatch.',
      'Consistency over availability for money; a backup processor for outages.',
    ],
  },
  blank: {
    requirements: [
      'Charge cards through an external processor',
      'Refunds',
      'Never charge twice or lose money, even with retries',
      'An exact, auditable ledger kept for ten years',
      'About a million orders a day',
    ],
    components: ['client', 'service', 'db', 'api', 'queue'],
    firstFive: [
      'Ask the volume, who holds card numbers and what must never happen',
      'Say correctness beats latency and availability for money',
      'Estimate rates and ledger size: small, so correctness is the problem',
      'Put idempotency keys on every request that moves money',
      'Choose a relational, double-entry, append-only ledger',
    ],
  },
};
