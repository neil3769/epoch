import type { LibraryPage } from '../schema';

/** Unit S8 summary page: unlocked in the Library when the unit is finished. */
export const s8Library: LibraryPage = {
  unit: 'S8',
  ideas: [
    {
      title: 'Kinds',
      text: 'Queue work the caller does not need to continue. A work queue gives each message to one worker; pub-sub copies it to every subscriber; a log keeps messages in order and each reader tracks its own offset, so new readers can replay.',
    },
    {
      title: 'Delivery',
      text: 'Ack before the work: at most once, failures are lost. Ack after: at least once, crashes repeat work. "Exactly once" is at-least-once delivery plus idempotent handling: record each message id with its effect in one transaction. Retry with capped, jittered exponential backoff; park poison messages in a dead-letter queue.',
    },
    {
      title: 'Flow and structure',
      text: 'If arrivals beat capacity the backlog grows without limit: bound the queue, push back (429/503), shed what can wait, add workers for lasting load. Partition by key for per-entity order. Outbox: write the event in the data\'s transaction, a relay publishes it. Saga: local steps with compensations run in reverse.',
    },
  ],
  rules: [
    'Queue only what the caller does not wait for.',
    'Ack after the work; make handlers idempotent.',
    'Retries: capped, exponential, with jitter.',
    'Poison messages go to a dead-letter queue.',
    'Backlog grows by (arrivals − capacity) per second.',
    'Order per key, not globally.',
    'Never save and publish in two separate steps.',
  ],
  example: {
    code: [
      'seen = set()',
      'def handle(msg_id):',
      '    if msg_id in seen:',
      '        return "skip"',
      '    seen.add(msg_id)',
      '    return "done"',
      '',
      'print([handle(m) for m in "aba"])',
    ].join('\n'),
    output: "['done', 'done', 'skip']",
    notes: ['The repeated "a" finds its id and is skipped.', 'In a real system the id is saved in the same transaction as the effect.'],
  },
  diagram: {
    nodes: [
      { id: 's', kind: 'service', label: 'Orders' },
      { id: 'd', kind: 'db', label: 'DB + outbox' },
      { id: 'r', kind: 'worker', label: 'Relay' },
      { id: 'q', kind: 'queue', label: 'Broker' },
      { id: 'w', kind: 'worker', label: 'Consumer' },
    ],
    edges: [
      { from: 's', to: 'd', label: 'one txn' },
      { from: 'r', to: 'd', label: 'read' },
      { from: 'r', to: 'q', label: 'publish' },
      { from: 'q', to: 'w', label: 'ack' },
    ],
  },
  mistakes: [
    { mistake: 'Queuing work the user is waiting for.', fix: 'Do it in the request; queue only what can finish later.' },
    { mistake: 'Trusting a queue for "exactly once".', fix: 'Assume repeats; make handlers idempotent.' },
    { mistake: 'Retrying forever, all at once.', fix: 'Cap attempts, back off with jitter, dead-letter the rest.' },
    { mistake: 'An unbounded queue as the overload plan.', fix: 'Bound it, push back, and watch the oldest message\'s age.' },
    { mistake: 'Saving a row, then publishing separately.', fix: 'Outbox in the same transaction.' },
  ],
  forReal:
    'Read the delivery-guarantee and dead-letter sections of the documentation for the queue you actually use (for example Amazon SQS, RabbitMQ or Kafka), since defaults differ. Then read Chris Richardson\'s pages on the transactional outbox and saga patterns at microservices.io.',
};
