import type { Walkthrough } from '../schema';

/*
 * Walkthrough 3: a notification service (push, SMS, email), through the
 * seven-step framework. Unlocks after S1-S3, S8 (queues) and S10
 * (reliability).
 */
export const notificationService: Walkthrough = {
  id: 'w-notification-service',
  title: 'Notification service',
  question: 'Design a service that other teams call to send notifications to users by push, SMS and email.',
  needs: ['S1', 'S2', 'S3', 'S8', 'S10'],
  minutes: 18,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "Teams send transactional messages, like password resets and order updates, and marketing campaigns. Users can opt out per channel. Messages must not be lost."',
      exercises: [
        {
          id: 'wns-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Send by push, SMS and email', bucket: 0, why: 'The core feature, stated.' },
            { text: 'Respect each user\'s opt-outs', bucket: 0, why: 'Stated, and often a legal duty.' },
            { text: 'Retry when a provider fails', bucket: 0, why: 'Messages must not be lost.' },
            { text: 'Templates with variables', bucket: 0, why: 'Teams need "Hi {name}" without building strings.' },
            { text: 'A/B testing of message wording', bucket: 1, why: 'Useful for marketing, not needed to send.' },
            { text: 'An in-app inbox', bucket: 1, why: 'Another product, not asked for.' },
          ],
          explain: 'Sending reliably and respecting choices come first.',
        },
        {
          id: 'wns-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most?',
          options: [
            { text: 'Never lose a message' },
            { text: 'Deliver within 10 ms', why: 'Providers take seconds; nobody expects 10 ms.' },
            { text: 'Strong consistency', why: 'Little here needs replicas to agree instantly.' },
          ],
          answer: 0,
          explain: 'A lost password reset is a support ticket; a lost two-factor code locks a user out.',
        },
        {
          id: 'wns-1-3',
          type: 'bucket-sort',
          prompt: 'Urgent, or can it wait behind other messages?',
          buckets: ['Urgent', 'Can wait'],
          items: [
            { text: 'A password reset link', bucket: 0, why: 'The user is waiting for it right now.' },
            { text: 'A two-factor login code', bucket: 0, why: 'It expires within minutes.' },
            { text: 'Order shipped', bucket: 0, why: 'Expected promptly, though not to the second.' },
            { text: 'The weekly newsletter', bucket: 1, why: 'An hour late changes nothing.' },
            { text: 'A sale announcement to 5 million', bucket: 1, why: 'Bulk; it can be spread out.' },
          ],
          explain: 'Two kinds of traffic with different needs: keep them apart.',
        },
      ],
      strong: 'Send by push, SMS and email from templates, respect per-channel opt-outs, retry so nothing is lost, and separate urgent transactional messages from bulk marketing so a campaign never delays a password reset.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "10 million notifications a day on average. A campaign can add 5 million within one hour. Each message record is about 1 KB, kept for 30 days."',
      exercises: [
        {
          id: 'wns-2-1',
          type: 'estimate',
          prompt: 'Average notifications per second?',
          expr: '1e7 / DAY',
          answer: 116,
          tolerance: 2,
          unit: 'msg/s',
          options: [
            { value: 12, why: '10⁷ ÷ 86,400 ≈ 116.' },
            { value: 116 },
            { value: 1157, why: 'One factor of ten too many.' },
          ],
          work: ['A day ≈ 86,400 s', '10⁷ ÷ 86,400 ≈ 116 per second'],
          explain: 'Modest on an ordinary day.',
        },
        {
          id: 'wns-2-2',
          type: 'estimate',
          prompt: 'During a campaign, 5 million messages in an hour. Per second?',
          expr: '5e6 / HOUR',
          answer: 1389,
          tolerance: 2,
          unit: 'msg/s',
          options: [
            { value: 139, why: '5 × 10⁶ ÷ 3,600 ≈ 1,400.' },
            { value: 1389 },
            { value: 13889, why: 'One factor of ten too many.' },
          ],
          work: ['5 × 10⁶ ÷ 3,600 s ≈ 1,389 per second'],
          explain: 'Twelve times the average: bursts are what the design must absorb.',
        },
        {
          id: 'wns-2-3',
          type: 'estimate',
          prompt: 'Storage for 30 days of message records at 1 KB each?',
          expr: '1e7 * 30 * KB / GB',
          answer: 300,
          tolerance: 2,
          unit: 'GB',
          options: [
            { value: 30, why: '3 × 10⁸ records × 1 KB = 300 GB.' },
            { value: 300 },
            { value: 3000, why: 'One factor of ten too many.' },
          ],
          work: ['10⁷ × 30 = 3 × 10⁸ records', '× 1 KB = 300 GB'],
          explain: 'One database copes; older records can be archived.',
        },
      ],
      strong: 'About 120 messages a second on average and around 1,400 during a campaign, so bursts dominate the design; about 300 GB of delivery records over 30 days.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Other teams call the service; it answers at once and sends later.',
      exercises: [
        {
          id: 'wns-3-1',
          type: 'match-pairs',
          prompt: 'Match each request to what it does.',
          pairs: [
            { left: 'POST /notifications', right: '202 with a notification id', why: 'Accepted for sending later.' },
            { left: 'GET /notifications/{id}', right: 'its delivery status', why: 'Queued, sent, delivered or failed.' },
            { left: 'PUT /users/{id}/prefs', right: 'updates the opt-outs', why: 'Per user, per channel.' },
          ],
          explain: 'Callers never wait for an SMS provider.',
        },
        {
          id: 'wns-3-2',
          type: 'mcq',
          prompt: 'Why answer 202 rather than 200?',
          options: [
            { text: 'Sending happens later' },
            { text: 'It was delivered already', why: 'Delivery happens later, in a worker.' },
            { text: 'The request was invalid', why: 'That would be a 400.' },
          ],
          answer: 0,
          explain: '202 Accepted: the work is queued, not done.',
        },
        {
          id: 'wns-3-3',
          type: 'scenario',
          prompt: 'A caller times out on POST and retries. The user gets the same SMS twice.',
          situation: 'The first request had actually been accepted.',
          needs: ['A retried request sends only once'],
          options: [
            {
              text: 'An idempotency key on POST',
              cost: 'Callers send a key; the service stores them for a day.',
            },
            {
              text: 'Ask callers never to retry',
              cost: 'No change to the service.',
              why: 'Then a request lost on the network is never sent at all.',
            },
          ],
          answer: 0,
          explain: 'The same key returns the same notification id (S9).',
        },
      ],
      strong: 'POST /notifications with recipient, channel, template, variables, priority and an idempotency key returns 202 and an id; GET gives its status; a preferences endpoint stores opt-outs.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Decide what is stored where: preferences, templates, pending messages and delivery records.',
      exercises: [
        {
          id: 'wns-4-1',
          type: 'bucket-sort',
          prompt: 'Where does each live?',
          buckets: ['Database', 'Queue', 'Cache'],
          items: [
            { text: 'Users\' channel preferences', bucket: 0, why: 'Durable, queried per user.' },
            { text: 'Messages waiting to be sent', bucket: 1, why: 'Work to do, handed to workers.' },
            { text: 'Delivery status of each message', bucket: 0, why: 'Durable records callers can query.' },
            { text: 'Message templates', bucket: 0, why: 'Durable, edited occasionally.' },
            { text: 'Ids sent in the last hour', bucket: 2, why: 'A fast check to skip duplicates.' },
          ],
          explain: 'Durable facts in the database, pending work in queues.',
        },
        {
          id: 'wns-4-2',
          type: 'predict-output',
          prompt: 'Filling a template. What does this print?',
          code: `tpl = "Hi {n}, order {o} shipped"
print(tpl.format(n="Ann", o=42))`,
          answer: 'Hi Ann, order 42 shipped',
          typedWrong: [{ answer: 'Hi {n}, order {o} shipped', why: '`format` replaces each placeholder.' }],
          explain: 'Callers send the variables; the service owns the wording.',
        },
        {
          id: 'wns-4-3',
          type: 'predict-output',
          prompt: 'The caller asks for push and email; Bo allows push and SMS. Which channels are used?',
          code: `prefs = {"ann": {"email"},
         "bo": {"push", "sms"}}
want = ["push", "email"]
print([c for c in want
       if c in prefs["bo"]])`,
          answer: "['push']",
          typedWrong: [{ answer: "['push', 'email']", why: 'Bo has opted out of email.' }],
          explain: 'Check preferences in the service, so no caller can forget.',
        },
      ],
      strong: 'A preferences table per user and channel, a templates table, a notifications table with status and timestamps, queues for pending sends, and a short-lived cache of recently sent ids to catch duplicates.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Accept quickly, queue by priority, and let workers talk to the providers.',
      exercises: [
        {
          id: 'wns-5-1',
          type: 'diagram',
          prompt: 'Password resets must not wait behind a campaign. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'c', kind: 'service', label: 'Callers' },
              { id: 'a', kind: 'service', label: 'Notify API' },
              { id: 'u', kind: 'queue', label: 'Urgent' },
              { id: 'b', kind: 'queue', label: 'Bulk' },
              { id: 'w', kind: 'worker', label: 'Senders' },
              { id: 'p', kind: 'api', label: 'Providers' },
            ],
            edges: [
              { from: 'c', to: 'a' },
              { from: 'a', to: 'u' },
              { from: 'a', to: 'b' },
              { from: 'u', to: 'w' },
              { from: 'b', to: 'w' },
              { from: 'w', to: 'p' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'u',
            options: [
              { kind: 'queue', label: 'Queue' },
              { kind: 'cache', label: 'Cache', why: 'A cache can evict messages: they must not be lost.' },
              { kind: 'db', label: 'Database', why: 'Workers would poll a table: a queue hands work out directly.' },
            ],
            answer: 0,
          },
          explain: 'A separate urgent queue, with workers that always drain it first.',
        },
        {
          id: 'wns-5-2',
          type: 'diagram',
          prompt: 'A password reset is sent. Tap its path, in order.',
          diagram: {
            nodes: [
              { id: 'c', kind: 'service', label: 'Callers' },
              { id: 'a', kind: 'service', label: 'Notify API' },
              { id: 'u', kind: 'queue', label: 'Urgent' },
              { id: 'b', kind: 'queue', label: 'Bulk' },
              { id: 'w', kind: 'worker', label: 'Senders' },
              { id: 'p', kind: 'api', label: 'Providers' },
            ],
            edges: [
              { from: 'c', to: 'a' },
              { from: 'a', to: 'u' },
              { from: 'a', to: 'b' },
              { from: 'u', to: 'w' },
              { from: 'b', to: 'w' },
              { from: 'w', to: 'p' },
            ],
          },
          goal: { kind: 'path', answer: ['c', 'a', 'u', 'w', 'p'] },
          explain: 'It never touches the bulk queue.',
        },
        {
          id: 'wns-5-3',
          type: 'mcq',
          prompt: 'Why two queues instead of one?',
          options: [
            { text: 'Campaigns can\'t delay resets' },
            { text: 'Queues are cheaper in pairs', why: 'Cost is not the reason; isolation is.' },
            { text: 'Providers require two', why: 'Providers see only the sends.' },
          ],
          answer: 0,
          explain: 'Five million campaign messages ahead of a reset would mean an hour\'s wait.',
        },
      ],
      strong: 'Callers → notify API (validates, checks preferences, stores the record, returns 202) → urgent and bulk queues → sender workers per channel → push, SMS and email providers; status is written back to the database.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'service', label: 'Callers' },
          { id: 'a', kind: 'service', label: 'Notify API' },
          { id: 'u', kind: 'queue', label: 'Urgent' },
          { id: 'b', kind: 'queue', label: 'Bulk' },
          { id: 'w', kind: 'worker', label: 'Senders' },
          { id: 'p', kind: 'api', label: 'Providers' },
        ],
        edges: [
          { from: 'c', to: 'a' },
          { from: 'a', to: 'u' },
          { from: 'a', to: 'b' },
          { from: 'u', to: 'w' },
          { from: 'b', to: 'w' },
          { from: 'w', to: 'p' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: providers fail, time out and repeat, and a message must go out once.',
      exercises: [
        {
          id: 'wns-6-1',
          type: 'scenario',
          prompt: 'The SMS provider fails 20% of requests for ten minutes. What do the workers do?',
          situation: 'A second SMS provider is under contract.',
          needs: ['Nothing lost', 'The failing provider is not hammered'],
          options: [
            {
              text: 'Back off, fail over to backup',
              cost: 'A breaker per provider and two integrations.',
            },
            {
              text: 'Retry at once until it works',
              cost: 'No new code.',
              why: 'Instant retries pile onto a struggling provider and slow every send.',
            },
          ],
          answer: 0,
          explain: 'A circuit breaker opens on the failing provider; messages that keep failing go to a dead-letter queue (S8, S10).',
        },
        {
          id: 'wns-6-2',
          type: 'predict-output',
          prompt: 'The same message is delivered to a worker twice. What happens?',
          code: `sent = set()
def send(msg_id, to):
    if msg_id in sent:
        return "skip"
    sent.add(msg_id)
    return "sent to " + to

a = send("m1", "ann")
print(a, send("m1", "ann"))`,
          answer: 'sent to ann skip',
          typedWrong: [{ answer: 'sent to ann sent to ann', why: 'The second delivery finds m1 already sent.' }],
          explain: 'Queues deliver at least once; the check makes it effectively once.',
        },
        {
          id: 'wns-6-3',
          type: 'estimate',
          prompt: 'Each sender handles 50 messages a second. Workers needed for a 1,389-a-second campaign?',
          expr: '1389 / 50',
          answer: 28,
          tolerance: 2,
          unit: 'workers',
          options: [
            { value: 3, why: '1,389 ÷ 50 ≈ 28.' },
            { value: 28 },
            { value: 280, why: 'One factor of ten too many.' },
          ],
          work: ['1,389 ÷ 50 ≈ 28 workers'],
          explain: 'Scale workers on queue length; a handful suffice on normal days.',
        },
      ],
      strong: 'At-least-once delivery from the queues with a dedup check on message id; retries with backoff and jitter, a circuit breaker and a fallback provider per channel, and a dead-letter queue for messages that keep failing.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Push it to a campaign ten times bigger: 50 million messages.',
      exercises: [
        {
          id: 'wns-7-1',
          type: 'mcq',
          prompt: 'At ten times the campaign size, what limits you first?',
          options: [
            { text: 'Provider rate limits' },
            { text: 'The preferences table', why: 'Reads by user id stay cheap.' },
            { text: 'The API servers', why: 'One campaign call queues millions of messages cheaply.' },
          ],
          answer: 0,
          explain: 'Providers cap sends per second; the bulk queue must drain at their pace.',
        },
        {
          id: 'wns-7-2',
          type: 'scenario',
          prompt: 'A 50-million-message campaign is queued. How fast should it go out?',
          situation: 'The SMS provider allows 2,000 a second for your account.',
          needs: ['Urgent messages stay fast', 'Stay within provider limits'],
          options: [
            {
              text: 'Throttle bulk; urgent goes first',
              cost: 'The campaign takes hours.',
            },
            {
              text: 'Send all of it at full speed',
              cost: 'Finishes sooner in theory.',
              why: 'The provider rejects the excess and resets wait behind the flood.',
            },
          ],
          answer: 0,
          explain: 'A rate limiter on the bulk senders (the previous walkthrough).',
        },
        {
          id: 'wns-7-3',
          type: 'mcq',
          prompt: 'A user opts out an hour after a campaign was queued. When must the preference be checked?',
          options: [
            { text: 'Again, just before sending' },
            { text: 'Only when the campaign is queued', why: 'They would still receive it after opting out.' },
            { text: 'Never: campaigns ignore opt-outs', why: 'That breaks the user\'s choice, and often the law.' },
          ],
          answer: 0,
          explain: 'Check at queueing to skip early, and again at sending to be sure.',
        },
      ],
      strong: 'Names provider limits as the first bottleneck, throttles bulk sending while urgent traffic keeps its own fast lane, scales workers on queue length, and re-checks opt-outs at send time.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'c', kind: 'service', label: 'Callers' },
        { id: 'a', kind: 'service', label: 'Notify API' },
        { id: 'u', kind: 'queue', label: 'Urgent' },
        { id: 'b', kind: 'queue', label: 'Bulk' },
        { id: 'w', kind: 'worker', label: 'Senders' },
        { id: 'p', kind: 'api', label: 'Providers' },
      ],
      edges: [
        { from: 'c', to: 'a', label: '202' },
        { from: 'a', to: 'u' },
        { from: 'a', to: 'b' },
        { from: 'u', to: 'w', label: 'first' },
        { from: 'b', to: 'w', label: 'paced' },
        { from: 'w', to: 'p' },
      ],
    },
    decisions: [
      'About 120 messages a second on average, about 1,400 during a campaign; 300 GB of records for 30 days.',
      'POST /notifications → 202 with an id, made safe to retry with an idempotency key.',
      'Separate urgent and bulk queues; sender workers drain urgent first.',
      'At-least-once delivery plus a dedup check; backoff, circuit breakers and a fallback provider per channel.',
      'Opt-outs checked in the service, again just before sending.',
    ],
  },
  blank: {
    requirements: [
      'Send by push, SMS and email from templates',
      'Respect per-channel opt-outs',
      'Never lose a message; never send one twice',
      'Urgent messages are not delayed by campaigns',
      'Absorb campaign bursts within provider limits',
    ],
    components: ['service', 'queue', 'worker', 'api', 'db'],
    firstFive: [
      'Ask which channels, which kinds of message, and whether users can opt out',
      'Ask the volume on a normal day and during a campaign',
      'Say the priorities: nothing lost, urgent first, respect opt-outs',
      'Estimate average and peak messages a second out loud',
      'Sketch POST returning 202 before drawing queues',
    ],
  },
};
