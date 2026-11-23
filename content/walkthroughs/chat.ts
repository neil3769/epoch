import type { Walkthrough } from '../schema';

/*
 * Walkthrough 8: a chat system, through the seven-step framework. Unlocks
 * after S1-S3, S5 (databases), S8 (queues) and S11 (real-time delivery,
 * unique ids).
 */
export const chat: Walkthrough = {
  id: 'w-chat',
  title: 'Chat system',
  question: 'Design a chat app for one-to-one and group chats of up to 100 people, with messages delivered in real time and kept as history.',
  needs: ['S1', 'S2', 'S3', 'S5', 'S8', 'S11'],
  minutes: 20,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "50 million daily users sending about 40 messages a day each. Phones go offline often. Show who is online."',
      exercises: [
        {
          id: 'wch-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'One-to-one chat', bucket: 0, why: 'The core feature, stated.' },
            { text: 'Groups of up to 100', bucket: 0, why: 'Stated by the interviewer.' },
            { text: 'History on every device', bucket: 0, why: 'Messages are kept as history.' },
            { text: 'Online status', bucket: 0, why: 'Asked for explicitly.' },
            { text: 'Voice and video calls', bucket: 1, why: 'A different system with its own media servers.' },
            { text: 'Message reactions', bucket: 1, why: 'Nice to have; not asked for.' },
          ],
          explain: 'Text messages, delivered and kept, plus presence.',
        },
        {
          id: 'wch-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most?',
          options: [
            { text: 'No message lost or out of order' },
            { text: 'The lowest storage cost', why: 'Lost or jumbled messages are what users notice.' },
            { text: 'Instant search over all chats', why: 'Search was not asked for.' },
          ],
          answer: 0,
          explain: 'Then low delay for online users: well under a second.',
        },
        {
          id: 'wch-1-3',
          type: 'scenario',
          prompt: 'A phone is offline for two hours. What happens to messages sent to it?',
          situation: 'The app reconnects when the phone comes back.',
          needs: ['It gets every missed message', 'In order'],
          options: [
            { text: 'Store, then sync from last id', cost: 'The server keeps every message.' },
            {
              text: 'Deliver only while online',
              cost: 'No storage needed.',
              why: 'Offline phones miss messages forever.',
            },
            {
              text: 'Email the missed messages',
              cost: 'Uses an existing channel.',
              why: 'Out of the app, out of order, and not history.',
            },
          ],
          answer: 0,
          explain: 'The phone says "I have everything up to id 1042"; the server sends what follows.',
        },
      ],
      strong: 'One-to-one and groups of up to 100, history on every device, online status; no message lost or reordered, under a second for online users, and missed messages synced on reconnect. Calls and reactions later.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "Messages average 100 bytes. Keep history for five years. At peak, 10 million phones are connected at once."',
      exercises: [
        {
          id: 'wch-2-1',
          type: 'estimate',
          prompt: 'Messages sent per second, on average?',
          expr: '50e6 * 40 / DAY',
          answer: 23148,
          tolerance: 2,
          unit: 'messages/s',
          options: [
            { value: 2300, why: '2 × 10⁹ a day / 86,400 s ≈ 23,000.' },
            { value: 23000 },
            { value: 230000, why: 'That would be 20 billion messages a day.' },
          ],
          work: ['5 × 10⁷ × 40 = 2 × 10⁹ messages a day', '2 × 10⁹ / 86,400 ≈ 23,000 a second'],
          explain: 'Group messages are delivered many times over, so deliveries are higher still.',
        },
        {
          id: 'wch-2-2',
          type: 'estimate',
          prompt: 'Storage for five years of messages?',
          expr: '50e6 * 40 * 100 * 365 * 5 / TB',
          answer: 365,
          tolerance: 2,
          unit: 'TB',
          options: [
            { value: 36, why: '200 GB a day × 1,825 days ≈ 365 TB.' },
            { value: 365 },
            { value: 3650, why: '2 × 10¹¹ B a day × 1,825 is about 3.7 × 10¹⁴ B, 365 TB.' },
          ],
          work: ['2 × 10⁹ × 100 B = 200 GB a day', '200 GB × 365 × 5 ≈ 365 TB'],
          explain: 'Hundreds of terabytes: a store that spreads across many machines.',
        },
        {
          id: 'wch-2-3',
          type: 'estimate',
          prompt: 'One server holds about 100,000 open connections. How many servers for 10 million connected phones?',
          expr: '10e6 / 100e3',
          answer: 100,
          tolerance: 2,
          unit: 'servers',
          options: [
            { value: 10, why: '10⁷ / 10⁵ = 100.' },
            { value: 100 },
            { value: 1000, why: '10⁷ / 10⁵ is 100, not 1,000.' },
          ],
          work: ['10⁷ / 10⁵ = 100 servers'],
          explain: 'Plus spares, since a server failing drops all its connections.',
        },
      ],
      strong: 'About 23,000 messages a second, 365 TB over five years, and 10 million open connections needing about 100 connection servers plus spares.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Phones keep a connection open; messages flow both ways over it.',
      exercises: [
        {
          id: 'wch-3-1',
          type: 'mcq',
          prompt: 'How does the server push a new message to an online phone?',
          options: [
            { text: 'Over a WebSocket kept open' },
            { text: 'The phone polls every second', why: 'Millions of empty requests a second, and up to a second late.' },
            { text: 'A new HTTP request per message', why: 'The server cannot start a request to a phone.' },
          ],
          answer: 0,
          explain: 'One long-lived connection per phone, used in both directions (S11).',
        },
        {
          id: 'wch-3-2',
          type: 'match-pairs',
          prompt: 'Match each message on the connection to its purpose.',
          pairs: [
            { left: 'send(chat, text, client id)', right: 'store and deliver a message', why: 'The client id lets a retry be recognised.' },
            { left: 'ack(message id)', right: 'this device has it', why: 'Until acked, the server will resend.' },
            { left: 'sync(after id)', right: 'everything missed since', why: 'Used on reconnect.' },
            { left: 'heartbeat', right: 'still online', why: 'Keeps presence fresh.' },
          ],
          explain: 'Four message types cover sending, delivery, catching up and presence.',
        },
        {
          id: 'wch-3-3',
          type: 'predict-output',
          prompt: 'The phone retries a send after a timeout, with the same client id. What does this print?',
          code: `seen, log = set(), []
def send(cid, text):
    if cid in seen:
        return "dup"
    seen.add(cid)
    log.append(text)
    return "ok"
print(send("p1-7", "hi"),
      send("p1-7", "hi"), len(log))`,
          answer: 'ok dup 1',
          typedWrong: [{ answer: 'ok ok 2', why: 'The retry carries the same client id, so it is not stored twice.' }],
          explain: 'An idempotency key (S8) makes retries safe: no double messages.',
        },
      ],
      strong: 'A WebSocket per phone carrying send (with a client id for safe retries), ack, sync-after-id on reconnect, and heartbeats for presence.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Store messages so a chat\'s history reads newest first, quickly.',
      exercises: [
        {
          id: 'wch-4-1',
          type: 'scenario',
          prompt: 'Which store for messages?',
          situation: 'About 23,000 writes a second, 365 TB over time; reads are "latest messages in this chat".',
          needs: ['Spreads across machines', 'Fast reads of one chat, newest first'],
          options: [
            { text: 'Wide-column, keyed by chat, id', cost: 'No joins; queries are planned around the key.' },
            {
              text: 'One SQL table for everything',
              cost: 'Familiar, with joins and indexes.',
              why: 'Fine at first, but this write rate and size outgrow one relational database.',
            },
            {
              text: 'One document per chat',
              cost: 'One read gets a whole chat.',
              why: 'A busy chat\'s document grows without limit.',
            },
          ],
          answer: 0,
          explain: 'Partition by chat id, sort by message id within it (S5, S6).',
        },
        {
          id: 'wch-4-2',
          type: 'mcq',
          prompt: 'Message ids must sort by time within a chat. Which ids?',
          options: [
            { text: 'Time-ordered ids, like Snowflake' },
            { text: 'Random UUIDs made by each phone', why: 'They do not sort by time.' },
            { text: 'One counter in a single database', why: 'Every message in the system would pass through one point.' },
          ],
          answer: 0,
          explain: 'Time in the high bits, then machine and sequence (S11).',
        },
        {
          id: 'wch-4-3',
          type: 'predict-output',
          prompt: 'Ids are built as time, then machine, then sequence. Message a has a much larger machine number. What does this print?',
          code: `def mk(ms, m, seq):
    return ms << 22 | m << 12 | seq
a = mk(1000, 900, 5)
b = mk(1001, 1, 0)
print(a < b)`,
          answer: 'True',
          typedWrong: [{ answer: 'False', why: 'Time sits in the high bits, so a later millisecond always sorts after.' }],
          explain: 'Within one millisecond, ids from different machines are not in true order; that is accepted.',
        },
      ],
      strong: 'Messages in a wide-column store partitioned by chat id and sorted by a time-ordered message id; chat membership and users in a relational store; who-is-connected-where in memory.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Phones connect to chat servers; a message may arrive on one server and leave from another.',
      exercises: [
        {
          id: 'wch-5-1',
          type: 'diagram',
          prompt: 'To deliver to Bob, a chat server must find which server holds his connection. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'p', kind: 'client', label: 'Phones' },
              { id: 'w', kind: 'service', label: 'Chat servers' },
              { id: 'm', kind: 'db', label: 'Messages' },
              { id: 's', kind: 'cache', label: 'Who is where' },
            ],
            edges: [
              { from: 'p', to: 'w' },
              { from: 'w', to: 'm' },
              { from: 'w', to: 's' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 's',
            options: [
              { kind: 'cache', label: 'Map in RAM' },
              { kind: 'db', label: 'SQL table', why: 'It changes on every connect and disconnect, and is read on every message.' },
              { kind: 'queue', label: 'Queue', why: 'A queue cannot answer "where is Bob?"' },
            ],
            answer: 0,
          },
          explain: 'User → chat server, updated on connect and expired when heartbeats stop.',
        },
        {
          id: 'wch-5-2',
          type: 'diagram',
          prompt: 'Bob\'s phone is asleep with the app closed. Which box gets the message onto his lock screen?',
          diagram: {
            nodes: [
              { id: 'p', kind: 'client', label: 'Phones' },
              { id: 'w', kind: 'service', label: 'Chat servers' },
              { id: 'm', kind: 'db', label: 'Messages' },
              { id: 's', kind: 'cache', label: 'Who is where' },
              { id: 'q', kind: 'queue', label: 'Fan-out' },
              { id: 'n', kind: 'api', label: 'Phone push' },
            ],
            edges: [
              { from: 'p', to: 'w' },
              { from: 'w', to: 'm' },
              { from: 'w', to: 's' },
              { from: 'w', to: 'q' },
              { from: 'q', to: 'n' },
            ],
          },
          goal: {
            kind: 'tap',
            answer: 'n',
            why: {
              p: 'Bob\'s phone is the destination, but nothing is connected to it now.',
              w: 'Chat servers only reach phones with an open connection.',
              m: 'The message is stored here, but storing does not notify him.',
              s: 'It would say Bob is not connected anywhere.',
              q: 'The queue hands work on; it does not reach phones itself.',
            },
          },
          explain: 'The phone makers\' push services wake the phone; the app then syncs.',
        },
        {
          id: 'wch-5-3',
          type: 'order-steps',
          prompt: 'Alice sends to Bob, who is online on another server. Put the steps in order.',
          steps: [
            'Alice\'s phone sends over its WebSocket',
            'Her chat server stores the message',
            'It looks up which server holds Bob',
            'That server pushes it down Bob\'s WebSocket',
            'Bob\'s phone acks it',
          ],
          explain: 'Store before delivering, so a crash never loses an acknowledged message.',
        },
      ],
      strong: 'Phones hold WebSockets to chat servers; a server stores each message, looks up where each recipient is connected and forwards it there, and hands offline recipients to a push service through a fan-out queue.',
      diagram: {
        nodes: [
          { id: 'p', kind: 'client', label: 'Phones' },
          { id: 'w', kind: 'service', label: 'Chat servers' },
          { id: 'm', kind: 'db', label: 'Messages' },
          { id: 's', kind: 'cache', label: 'Who is where' },
          { id: 'q', kind: 'queue', label: 'Fan-out' },
          { id: 'n', kind: 'api', label: 'Phone push' },
        ],
        edges: [
          { from: 'p', to: 'w', label: 'socket' },
          { from: 'w', to: 'm' },
          { from: 'w', to: 's' },
          { from: 'w', to: 'q' },
          { from: 'q', to: 'n', label: 'offline' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: every member must see the same order, and nobody may miss a message.',
      exercises: [
        {
          id: 'wch-6-1',
          type: 'scenario',
          prompt: 'Two people in a group send at the same moment. How does everyone see the same order?',
          situation: 'Members are connected to different chat servers.',
          needs: ['One order for all members', 'No central bottleneck for the whole app'],
          options: [
            { text: 'A sequence number per chat', cost: 'Each chat\'s numbers come from one place.' },
            {
              text: 'Each phone\'s own clock time',
              cost: 'No coordination at all.',
              why: 'Clocks differ, and some phones are set wrong.',
            },
            {
              text: 'Arrival order at each phone',
              cost: 'Nothing to assign.',
              why: 'Different phones would see different orders.',
            },
          ],
          answer: 0,
          explain: 'One sequencer per chat, not per app, so the load spreads across chats.',
        },
        {
          id: 'wch-6-2',
          type: 'predict-output',
          prompt: 'A phone reconnects and asks for everything after the last id it has, 2. What does it get?',
          code: `chat = [(1, "hi"), (2, "yo"),
        (3, "ok"), (4, "bye")]
def sync(after):
    return [t for i, t in chat
            if i > after]
print(sync(2))`,
          answer: "['ok', 'bye']",
          typedWrong: [{ answer: "['yo', 'ok', 'bye']", why: 'After id 2 means ids above 2; the phone already has 2.' }],
          explain: 'Ordered ids make catching up one range read.',
        },
        {
          id: 'wch-6-3',
          type: 'mcq',
          prompt: 'In a group of 100, how is each message stored?',
          options: [
            { text: 'Once per chat; members read it' },
            { text: 'A copy in each member\'s inbox', why: '100 copies of every group message: storage multiplied many times.' },
            { text: 'Only on the sender\'s phone', why: 'Then history disappears with that phone.' },
          ],
          answer: 0,
          explain: 'Store once; deliver to each member (up to 100 deliveries, not 100 copies).',
        },
      ],
      strong: 'A sequence per chat gives one order to everyone; messages are stored once per chat and delivered to each member; phones ack, and on reconnect sync everything after their last id.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Break a chat server, then grow to ten times the users.',
      exercises: [
        {
          id: 'wch-7-1',
          type: 'scenario',
          prompt: 'A chat server crashes; its 100,000 phones all try to reconnect.',
          situation: 'The other servers are already fairly busy.',
          needs: ['The remaining servers survive the wave'],
          options: [
            { text: 'Random backoff on reconnect', cost: 'Some users wait a few extra seconds.' },
            {
              text: 'Reconnect at once, all together',
              cost: 'Fastest recovery for each phone.',
              why: 'A thundering herd that can knock over the next server too (S10).',
            },
          ],
          answer: 0,
          explain: 'Jitter spreads the wave over several seconds.',
        },
        {
          id: 'wch-7-2',
          type: 'mcq',
          prompt: 'How is online status kept for 10 million connected users?',
          options: [
            { text: 'Heartbeats with a timeout' },
            { text: 'Ask each phone when viewed', why: 'Slow, and a sleeping phone cannot answer.' },
            { text: 'Write SQL on every heartbeat', why: 'Millions of writes a minute for data that expires anyway.' },
          ],
          answer: 0,
          explain: 'Missed heartbeats for 30 seconds or so means offline; status is sent only to people looking.',
        },
        {
          id: 'wch-7-3',
          type: 'bucket-sort',
          prompt: 'Which events go over the open WebSocket, and which as a push notification?',
          buckets: ['WebSocket', 'Push notice'],
          items: [
            { text: 'Bob has the chat open', bucket: 0, why: 'He is connected; deliver directly.' },
            { text: 'Bob\'s phone is locked', bucket: 1, why: 'No open connection; wake the phone.' },
            { text: 'A typing indicator', bucket: 0, why: 'Only worth sending while the chat is open.' },
            { text: 'A message, app closed', bucket: 1, why: 'The push wakes the app to sync.' },
            { text: 'Read receipts in a live chat', bucket: 0, why: 'Both people are connected.' },
          ],
          explain: 'Push notifications are slower and limited; use them only to wake a phone.',
        },
      ],
      strong: 'Reconnect storms are tamed with random backoff, presence uses heartbeats with a timeout, and at 10× you add connection servers and spread the message store across more partitions by chat id.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'p', kind: 'client', label: 'Phones' },
        { id: 'w', kind: 'service', label: 'Chat servers' },
        { id: 'm', kind: 'db', label: 'Messages' },
        { id: 's', kind: 'cache', label: 'Who is where' },
        { id: 'q', kind: 'queue', label: 'Fan-out' },
        { id: 'n', kind: 'api', label: 'Phone push' },
      ],
      edges: [
        { from: 'p', to: 'w', label: 'socket' },
        { from: 'w', to: 'm' },
        { from: 'w', to: 's' },
        { from: 'w', to: 'q' },
        { from: 'q', to: 'n', label: 'offline' },
      ],
    },
    decisions: [
      'A WebSocket per phone; about 100 connection servers for 10 million phones.',
      'Messages in a wide-column store by chat id, sorted by time-ordered id: about 365 TB over five years.',
      'A sequence per chat gives every member the same order.',
      'Client ids make retries safe; phones ack and sync after their last id.',
      'Offline phones are woken by push; reconnects use random backoff.',
    ],
  },
  blank: {
    requirements: [
      'One-to-one and group chats up to 100',
      'Real-time delivery to online phones',
      'No message lost or out of order',
      'History synced to every device',
      'Online status',
    ],
    components: ['client', 'service', 'db', 'cache', 'queue', 'api'],
    firstFive: [
      'Ask group size, users and messages a day, and whether history is kept',
      'Say the priorities: nothing lost, same order for everyone, low delay',
      'Estimate messages a second, storage and open connections',
      'Choose WebSockets and a store partitioned by chat',
      'Explain how a message finds the server holding the recipient',
    ],
  },
};
