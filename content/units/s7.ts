import { s7Labs } from '../labs/s7';
import { s7Library } from '../library/s7';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s7More } from './s7-more';

/*
 * S7 Consistency and coordination. Lessons 1-5 here: CAP as a choice during
 * a partition, the latency side, strong consistency, eventual consistency,
 * causal consistency. Lessons 6-10 in s7-more.ts: quorums (quorum figure),
 * logical clocks, what consensus gives, leader election and locks with
 * fencing tokens, checkpoint.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's7-01',
    title: 'CAP: a choice during a partition',
    summary: 'When replicas lose contact, each side either refuses requests (consistent) or answers possibly stale (available).',
    card: {
      title: 'CAP: a choice during a partition',
      text: 'When the network splits replicas into groups that cannot talk, each group must choose: refuse requests it cannot answer safely (consistency), or keep answering and risk stale or conflicting data (availability). That is the CAP theorem: during a partition you cannot have both. When there is no partition, you can have both.',
      diagram: {
        nodes: [
          { id: 'u', kind: 'client', label: 'Users EU' },
          { id: 'v', kind: 'client', label: 'Users US' },
          { id: 'a', kind: 'db', label: 'Replica EU' },
          { id: 'b', kind: 'db', label: 'Replica US' },
        ],
        edges: [
          { from: 'u', to: 'a' },
          { from: 'v', to: 'b' },
          { from: 'a', to: 'b', label: 'cut', dashed: true },
        ],
      },
    },
    exercises: [
      {
        id: 's7-1-9',
        type: 'figure',
        prompt: 'A shop\'s five replicas split 3 and 2. Customers on both sides want the last 3 tickets. Choose what happens during the split so nothing is oversold.',
        figure: {
          kind: 'partition',
          nodes: [3, 2],
          stock: 3,
          ops: [
            { side: 'a', op: 'buy' },
            { side: 'b', op: 'buy' },
            { side: 'a', op: 'buy' },
            { side: 'b', op: 'buy' },
            { side: 'b', op: 'read' },
            { side: 'a', op: 'read' },
          ],
          mode: 'accept',
          goal: { noOversell: true },
        },
        explain: 'Serving on both sides sells 4 of 3 tickets. Refusing on the minority side keeps the count right, at the cost of turning away side B\'s customers: consistency over availability.',
      },
      {
        id: 's7-1-10',
        type: 'figure',
        prompt: 'Plenty of stock this time (9), and the product page must stay up. Keep every customer served.',
        figure: {
          kind: 'partition',
          nodes: [3, 2],
          stock: 9,
          ops: [
            { side: 'b', op: 'read' },
            { side: 'a', op: 'buy' },
            { side: 'b', op: 'read' },
            { side: 'b', op: 'buy' },
            { side: 'a', op: 'read' },
          ],
          mode: 'refuse',
          goal: { allServed: true },
        },
        explain: 'Everyone is answered, but side B shows 9 left when 8 are: a stale read. Harmless with plenty of stock; not with the last few items.',
      },
      {
        id: 's7-1-11',
        type: 'figure',
        prompt: 'Four replicas split 2 and 2. Find the choice that answers anyone at all.',
        figure: {
          kind: 'partition',
          nodes: [2, 2],
          stock: 5,
          ops: [
            { side: 'a', op: 'buy' },
            { side: 'b', op: 'read' },
            { side: 'b', op: 'buy' },
            { side: 'a', op: 'read' },
          ],
          mode: 'refuse',
          goal: { minServed: 1 },
        },
        explain: 'With no majority on either side, a consistent system refuses everywhere. That is why clusters use an odd number of replicas: 3 or 5, so one side can win.',
      },
      {
        id: 's7-1-1',
        type: 'scenario',
        prompt: 'The link between regions is cut. What does a bank\'s US replica do with a withdrawal?',
        situation: 'Accounts are replicated in the EU and the US. The link is down; the US replica cannot see EU withdrawals.',
        needs: ['Never let an account go below zero'],
        options: [
          {
            text: 'Refuse until the link returns',
            cost: 'Some customers cannot withdraw for a while.',
          },
          {
            text: 'Allow it from the local copy',
            cost: 'Nothing visible now.',
            why: 'Both regions could pay out the same money: the balance goes negative.',
          },
        ],
        answer: 0,
        explain: 'Consistency over availability: correct money beats uptime.',
      },
      {
        id: 's7-1-2',
        type: 'scenario',
        prompt: 'Same cut link, a social app\'s likes. What does the US replica do?',
        situation: 'Likes are counted per region and merged later.',
        needs: ['The app keeps working everywhere', 'Counts may be briefly off'],
        options: [
          {
            text: 'Keep accepting likes, merge later',
            cost: 'Counts differ between regions for a while.',
          },
          {
            text: 'Refuse likes until the link returns',
            cost: 'The feature is down in one region.',
            why: 'Nothing bad happens if counts lag: availability wins.',
          },
        ],
        answer: 0,
        explain: 'Availability over consistency: likes can be reconciled.',
      },
      {
        id: 's7-1-3',
        type: 'bucket-sort',
        prompt: 'During a partition, refuse (consistent) or answer (available)?',
        buckets: ['Refuse', 'Answer'],
        items: [
          { text: 'Booking the last seat on a flight', bucket: 0, why: 'Two sides could sell the same seat.' },
          { text: 'Showing a news feed', bucket: 1, why: 'A slightly old feed harms nobody.' },
          { text: 'Transferring money', bucket: 0, why: 'Double spending.' },
          { text: 'Adding an item to a shopping cart', bucket: 1, why: 'Carts can be merged later.' },
          { text: 'Claiming a unique username', bucket: 0, why: 'Two people could get the same name.' },
          { text: 'Counting page views', bucket: 1, why: 'Counts merge fine afterwards.' },
        ],
        explain: 'Ask: can two sides acting alone cause harm that cannot be merged?',
      },
      {
        id: 's7-1-4',
        type: 'mcq',
        prompt: 'When there is no partition, does CAP force a choice?',
        options: [
          { text: 'No: you can have both' },
          { text: 'Yes: always pick two of three', why: 'The choice only bites while the network is split.' },
          { text: 'Yes: availability is impossible', why: 'Healthy systems can be both.' },
        ],
        answer: 0,
        explain: '"Pick two of three" is a common misreading; partitions are not optional.',
      },
      {
        id: 's7-1-5',
        type: 'predict-output',
        prompt: 'Both sides keep accepting during a split. What does each side think the seat count is?',
        code: `eu, us = 1, 1     # seats left
eu -= 1           # EU sells one
us -= 1           # US sells one
print(eu, us, "sold:", 2)`,
        answer: '0 0 sold: 2',
        typedWrong: [{ answer: '0 1 sold: 1', why: 'Neither side saw the other\'s sale.' }],
        explain: 'Two seats sold, one existed: the cost of choosing availability here.',
      },
      {
        id: 's7-1-6',
        type: 'diagram',
        prompt: 'The link between the replicas is cut. Which part of the picture is the partition?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Users EU' },
            { id: 'a', kind: 'db', label: 'Replica EU' },
            { id: 'n', kind: 'api', label: 'Inter-region' },
            { id: 'b', kind: 'db', label: 'Replica US' },
          ],
          edges: [
            { from: 'u', to: 'a' },
            { from: 'a', to: 'n' },
            { from: 'n', to: 'b' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'n',
          why: {
            u: 'The users still reach their own replica.',
            a: 'The EU replica is up; it just cannot reach the US.',
            b: 'The US replica is up; it just cannot reach the EU.',
          },
        },
        explain: 'Both replicas are healthy: the network between them is not.',
      },
      {
        id: 's7-1-7',
        type: 'mcq',
        prompt: 'A system "chooses consistency". What do some users see during a partition?',
        options: [
          { text: 'Errors or timeouts' },
          { text: 'Stale data', why: 'That is the available choice.' },
          { text: 'Nothing different', why: 'Something has to give while the network is split.' },
        ],
        answer: 0,
        explain: 'The side that cannot be sure refuses.',
      },
      {
        id: 's7-1-8',
        type: 'fill-blank',
        prompt: 'A consistent replica refuses when it cannot reach the others.',
        code: `def withdraw(amount, can_reach):
    if not can_reach:
        return ___
    return "ok"

print(withdraw(50, False))`,
        answer: ['"try later"'],
        distractors: [{ text: '"ok"', why: 'That is the available choice: it may double-spend.' }],
        expectOutput: 'try later',
        explain: 'Refuse rather than risk being wrong.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's7-02',
    title: 'The latency side',
    summary: 'Even without partitions, stronger consistency means waiting for other replicas: it costs latency.',
    card: {
      title: 'The latency side',
      text: 'Partitions are rare, but the trade-off has an everyday form too: to be sure a read or write is up to date, a replica must check with others, and that takes round trips. Strong consistency costs latency; weaker consistency answers from the nearest copy at once. This is often called PACELC: during a Partition, Availability or Consistency; Else, Latency or Consistency.',
    },
    exercises: [
      {
        id: 's7-2-1',
        type: 'estimate',
        prompt: 'A write must be confirmed by replicas on two continents (one world round trip). Local work takes 3 ms. How long per write?',
        expr: '3 + WORLD_ROUND_TRIP * 1000',
        answer: 153,
        tolerance: 1.5,
        unit: 'ms',
        options: [
          { value: 3, why: 'Confirming far away adds a round trip.' },
          { value: 153 },
          { value: 1500, why: 'One round trip is about 150 ms.' },
        ],
        work: ['3 ms + 150 ms round trip = 153 ms'],
        explain: 'Fifty times slower than a local-only write.',
      },
      {
        id: 's7-2-2',
        type: 'bucket-sort',
        prompt: 'Low latency or strong consistency?',
        buckets: ['Low latency', 'Consistency'],
        items: [
          { text: 'Showing a product page', bucket: 0, why: 'A slightly old copy is fine; speed matters.' },
          { text: 'Reserving the last ticket', bucket: 1, why: 'Being wrong costs more than waiting.' },
          { text: 'Loading a chat history', bucket: 0, why: 'Fast from the nearest copy.' },
          { text: 'Changing a password', bucket: 1, why: 'Every region must stop accepting the old one.' },
          { text: 'Showing like counts', bucket: 0, why: 'Approximate is fine.' },
        ],
        explain: 'Pay for consistency where it matters.',
      },
      {
        id: 's7-2-3',
        type: 'mcq',
        prompt: 'Why can a nearby replica answer faster than a strongly consistent read?',
        options: [
          { text: 'It asks no other replica' },
          { text: 'It has better hardware', why: 'The difference is round trips, not hardware.' },
          { text: 'It holds less data', why: 'It holds the same data, maybe slightly older.' },
        ],
        answer: 0,
        explain: 'No coordination, no waiting.',
      },
      {
        id: 's7-2-4',
        type: 'scenario',
        prompt: 'A global game shows each player\'s profile. Which reads?',
        situation: 'Players everywhere open profiles constantly; profile edits are rare.',
        needs: ['Profiles open fast worldwide', 'An edit may take seconds to show elsewhere'],
        options: [
          {
            text: 'Read the nearest replica',
            cost: 'Edits appear elsewhere after a short lag.',
          },
          {
            text: 'Strongly consistent reads',
            cost: 'Cross-region round trips on every profile view.',
            why: 'The needs accept a few seconds of lag; speed matters more.',
          },
        ],
        answer: 0,
        explain: 'Latency over consistency, where staleness is harmless.',
      },
      {
        id: 's7-2-5',
        type: 'predict-output',
        prompt: 'Read latency: nearest copy (5 ms) or a check with a far majority (150 ms round trip). What does this print?',
        code: `near = 5
rtt = WORLD_ROUND_TRIP * 1000
strong = near + rtt
print(near, round(strong))`,
        answer: '5 155',
        typedWrong: [{ answer: '5 5', why: 'The strong read waits for the far round trip.' }],
        explain: 'Thirty times slower for the guarantee.',
      },
      {
        id: 's7-2-6',
        type: 'mcq',
        prompt: 'What does the "ELC" in PACELC say?',
        options: [
          { text: 'Else: latency or consistency' },
          { text: 'Every link can fail', why: 'It means: when there is no partition, you still trade latency for consistency.' },
          { text: 'Eventually, latency is constant', why: 'It is about the trade-off in normal operation.' },
        ],
        answer: 0,
        explain: 'The everyday cost that CAP leaves out.',
      },
      {
        id: 's7-2-7',
        type: 'fill-blank',
        prompt: 'Strong reads only for the kinds listed.',
        code: `def read_mode(kind):
    strong = {"password", "balance"}
    return ("strong" if kind in ___
            else "nearest")

print(read_mode("password"),
      read_mode("feed"))`,
        answer: ['strong'],
        distractors: [{ text: 'kind', why: '`kind in kind` checks a string against itself: always true.' }],
        expectOutput: 'strong nearest',
        explain: 'Per-read choices, not one setting for everything.',
      },
      {
        id: 's7-2-8',
        type: 'diagram',
        prompt: 'A user in Lisbon reads a profile. Which replica answers fastest?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Lisbon user' },
            { id: 'e', kind: 'replica', label: 'Madrid copy' },
            { id: 's', kind: 'replica', label: 'Tokyo copy' },
            { id: 'l', kind: 'db', label: 'Leader US' },
          ],
          edges: [
            { from: 'u', to: 'e' },
            { from: 'u', to: 's', dashed: true },
            { from: 'u', to: 'l', dashed: true },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'e',
          why: {
            u: 'The user is the one asking.',
            s: 'Tokyo is on the other side of the world.',
            l: 'The leader is across the Atlantic: a long round trip.',
          },
        },
        explain: 'Nearest copy: fastest, possibly a little stale.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's7-03',
    title: 'Strong consistency',
    summary: 'Every read sees the latest completed write, as if there were one copy.',
    card: {
      title: 'Strong consistency',
      text: 'Strong consistency (linearizability) means the system behaves as if there were a single copy: once a write completes, every later read sees it, wherever it runs. It makes reasoning easy and is what unique usernames, locks and balances need. It costs coordination: every operation must agree with a majority of replicas.',
    },
    exercises: [
      {
        id: 's7-3-1',
        type: 'predict-output',
        prompt: 'A strongly consistent store: a write completes, then two readers in different regions read. What do they see?',
        code: `store = {"name": "old"}
store["name"] = "new"
eu = store["name"]
us = store["name"]
print(eu, us)`,
        answer: 'new new',
        typedWrong: [{ answer: 'new old', why: 'Strong consistency: every later read sees the completed write.' }],
        explain: 'As if there were one copy.',
      },
      {
        id: 's7-3-2',
        type: 'bucket-sort',
        prompt: 'Does it need strong consistency?',
        buckets: ['Needs it', 'Does not'],
        items: [
          { text: 'Unique usernames', bucket: 0, why: 'Two people must never get the same name.' },
          { text: 'A distributed lock', bucket: 0, why: 'Two holders at once break the lock.' },
          { text: 'A follower count', bucket: 1, why: 'Off by a few for a moment is fine.' },
          { text: 'An account balance', bucket: 0, why: 'Overspending must be impossible.' },
          { text: 'A "last seen" time', bucket: 1, why: 'Seconds of lag do not matter.' },
        ],
        explain: 'Uniqueness, exclusivity and money: strong.',
      },
      {
        id: 's7-3-3',
        type: 'mcq',
        prompt: 'A write has completed. Under strong consistency, may a later read return the old value?',
        options: [
          { text: 'Never' },
          { text: 'Yes, from a follower', why: 'Then it would not be strongly consistent.' },
          { text: 'Only within a second', why: 'There is no grace period in the definition.' },
        ],
        answer: 0,
        explain: 'Later in real time means it sees the write.',
      },
      {
        id: 's7-3-4',
        type: 'scenario',
        prompt: 'Two people sign up as "ana" at the same moment in different regions. How do you keep names unique?',
        situation: 'User records are replicated across regions.',
        needs: ['Never two accounts with one name'],
        options: [
          {
            text: 'Strongly consistent claim on the name',
            cost: 'Sign-up waits for cross-region agreement.',
          },
          {
            text: 'Check each region\'s local copy',
            cost: 'Fast sign-up.',
            why: 'Both copies say "free" before either hears of the other: two anas.',
          },
          {
            text: 'Fix duplicates nightly',
            cost: 'A nightly job.',
            why: 'Two users already have the same name, and one must be renamed.',
          },
        ],
        answer: 0,
        explain: 'Pay the latency once, at sign-up.',
      },
      {
        id: 's7-3-5',
        type: 'mcq',
        prompt: 'What does strong consistency cost?',
        options: [
          { text: 'Coordination: round trips' },
          { text: 'More storage space needed', why: 'It needs agreement, not more space.' },
          { text: 'Nothing in practice', why: 'Each operation waits for a majority.' },
        ],
        answer: 0,
        explain: 'And during a partition, the minority side cannot serve.',
      },
      {
        id: 's7-3-6',
        type: 'order-steps',
        prompt: 'A strongly consistent write with three replicas. Put it in order.',
        steps: [
          'The client sends the write to the leader',
          'The leader sends it to the other replicas',
          'A majority acknowledge it',
          'The leader confirms to the client',
          'Every later read returns the new value',
        ],
        explain: 'The majority acknowledgement is what makes later reads safe.',
      },
      {
        id: 's7-3-7',
        type: 'diagram',
        prompt: 'For strong consistency, which box must a read go through?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Client' },
            { id: 'l', kind: 'db', label: 'Leader' },
            { id: 'f', kind: 'replica', label: 'Async copy' },
          ],
          edges: [
            { from: 'c', to: 'l' },
            { from: 'l', to: 'f', dashed: true },
            { from: 'c', to: 'f', dashed: true },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'l',
          why: {
            c: 'The client asks; the question is who answers.',
            f: 'An asynchronous copy may be behind.',
          },
        },
        explain: 'The leader (confirmed by a majority) has every completed write.',
      },
      {
        id: 's7-3-8',
        type: 'fill-blank',
        prompt: 'A majority of 3 replicas.',
        code: `n = 3
majority = n // 2 ___ 1
print(majority)`,
        answer: ['+'],
        distractors: [{ text: '-', why: '3 // 2 − 1 is 0: no agreement at all.' }],
        expectOutput: '2',
        explain: 'Two of three.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's7-04',
    title: 'Eventual consistency',
    summary: 'Replicas may disagree for a while but converge when updates stop; conflicts need a merge rule.',
    card: {
      title: 'Eventual consistency',
      text: 'Eventual consistency promises only this: if updates stop, all replicas end up with the same value. Meanwhile, readers may see older values, and two replicas may take conflicting writes. A merge rule settles conflicts: "last writer wins" is simple but can lose a write; merging, such as uniting two shopping carts, keeps both.',
      code: `a = {"pen"}       # cart on replica A
b = {"ink"}       # cart on replica B
print(sorted(a | b))`,
      output: "['ink', 'pen']",
    },
    exercises: [
      {
        id: 's7-4-1',
        type: 'predict-output',
        prompt: 'Last writer wins: two replicas take conflicting writes with timestamps. What survives?',
        code: `writes = [("blue", 10.2),
          ("red", 10.5)]
by_time = lambda w: w[1]
value, t = max(writes, key=by_time)
print(value)`,
        answer: 'red',
        typedWrong: [{ answer: 'blue', why: 'The later timestamp wins: 10.5.' }],
        explain: 'Blue is silently lost.',
      },
      {
        id: 's7-4-2',
        type: 'predict-output',
        prompt: 'Merge two replicas of a cart by union. What does the cart hold?',
        code: `a = {"pen", "pad"}
b = {"pen", "ink"}
print(sorted(a | b))`,
        answer: "['ink', 'pad', 'pen']",
        typedWrong: [{ answer: "['pen']", why: 'Union keeps every item from both sides.' }],
        explain: 'Nothing lost; a removed item might come back, the classic cart quirk.',
      },
      {
        id: 's7-4-3',
        type: 'scenario',
        prompt: 'Which merge rule for a shared to-do list edited offline on two phones?',
        situation: 'Both phones add and tick items while offline, then sync.',
        needs: ['No added item is lost'],
        options: [
          {
            text: 'Merge item by item',
            cost: 'More complex sync code.',
          },
          {
            text: 'Last writer wins, whole list',
            cost: 'Simple to build.',
            why: 'The phone that synced first loses all its new items.',
          },
        ],
        answer: 0,
        explain: 'Merge at the finest level you can.',
      },
      {
        id: 's7-4-4',
        type: 'mcq',
        prompt: 'What does eventual consistency guarantee?',
        options: [
          { text: 'Agreement once updates stop' },
          { text: 'Agreement within one second', why: 'No time bound is promised.' },
          { text: 'Reads always see the latest write', why: 'That is strong consistency.' },
        ],
        answer: 0,
        explain: 'In practice convergence is usually fast; the definition promises no bound.',
      },
      {
        id: 's7-4-5',
        type: 'bucket-sort',
        prompt: 'Is eventual consistency fine here?',
        buckets: ['Fine', 'Not fine'],
        items: [
          { text: 'Like counts', bucket: 0, why: 'A few seconds off is harmless.' },
          { text: 'A DNS record change', bucket: 0, why: 'DNS is eventually consistent by design (TTLs).' },
          { text: 'Withdrawing cash', bucket: 1, why: 'Two replicas could both allow it.' },
          { text: 'A shopping cart', bucket: 0, why: 'Carts merge.' },
          { text: 'Assigning a unique order number', bucket: 1, why: 'Two replicas could hand out the same number.' },
        ],
        explain: 'Mergeable and harmless when briefly wrong: eventual is fine.',
      },
      {
        id: 's7-4-6',
        type: 'predict-output',
        prompt: 'Two replicas count likes separately, then merge by adding their increments. What is the total?',
        code: `base = 100
inc_a, inc_b = 3, 5
print(base + inc_a + inc_b)`,
        answer: '108',
        typedWrong: [{ answer: '105', why: 'Adding both sides\' increments keeps every like.' }],
        explain: 'Counting increments instead of overwriting totals merges cleanly (a CRDT counter).',
      },
      {
        id: 's7-4-7',
        type: 'mcq',
        prompt: 'Why can "last writer wins" lose data?',
        options: [
          { text: 'One write is dropped' },
          { text: 'It deletes old rows', why: 'It keeps one of two concurrent values and discards the other.' },
          { text: 'Clocks never differ', why: 'They do differ, which makes it worse.' },
        ],
        answer: 0,
        explain: 'And clock skew can make the "later" write the older one.',
      },
      {
        id: 's7-4-8',
        type: 'fill-blank',
        prompt: 'Merge two replicas of a tag set without losing tags.',
        code: `a = {"sql", "db"}
b = {"db", "cache"}
print(sorted(a ___ b))`,
        answer: ['|'],
        distractors: [{ text: '&', why: 'Intersection keeps only tags both sides have.' }],
        expectOutput: "['cache', 'db', 'sql']",
        explain: 'Union: the merge rule for add-only sets.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's7-05',
    title: 'Causal consistency',
    summary: 'If one event caused another, everyone sees them in that order: no reply before its question.',
    card: {
      title: 'Causal consistency',
      text: 'Causal consistency sits between strong and eventual: if one write caused another, every reader sees them in that order. A reply never appears before the question it answers, and a comment never before its post. Unrelated writes may still appear in different orders to different readers.',
    },
    exercises: [
      {
        id: 's7-5-1',
        type: 'predict-output',
        prompt: 'A reader receives these in network order. With causal delivery, a message waits until what it replies to has arrived. What is shown?',
        code: `arrived = [("r1", "q1"),
           ("q1", None)]
shown, wait = [], list(arrived)
while wait:
    for m, p in wait:
        if p is None or p in shown:
            shown.append(m)
            wait.remove((m, p))
            break
print(shown)`,
        answer: "['q1', 'r1']",
        typedWrong: [{ answer: "['r1', 'q1']", why: 'The reply waits until its question has been shown.' }],
        explain: 'Arrival order: reply, question. Display order: question, reply.',
      },
      {
        id: 's7-5-2',
        type: 'bucket-sort',
        prompt: 'Must these be seen in order?',
        buckets: ['Linked', 'Independent'],
        items: [
          { text: 'A post and a comment on it', bucket: 0, why: 'The comment exists because of the post.' },
          { text: 'A question and its reply', bucket: 0, why: 'The reply answers it.' },
          { text: 'Two posts by strangers', bucket: 1, why: 'Neither caused the other.' },
          { text: 'Removing a friend, then posting', bucket: 0, why: 'The post was meant not to reach them.' },
          { text: 'Likes on two different photos', bucket: 1, why: 'Unrelated.' },
        ],
        explain: 'Only cause and effect need ordering.',
      },
      {
        id: 's7-5-3',
        type: 'mcq',
        prompt: 'Ana unfriends Bo, then posts "Bo is annoying". With only eventual consistency, what can go wrong?',
        options: [
          { text: 'Bo sees the post' },
          { text: 'The post is lost', why: 'Nothing is lost; the order of arrival is the problem.' },
          { text: 'Ana is unfriended twice', why: 'The issue is ordering, not duplication.' },
        ],
        answer: 0,
        explain: 'A replica that got the post before the unfriend shows it to Bo.',
      },
      {
        id: 's7-5-4',
        type: 'order-steps',
        prompt: 'Showing a thread with causal consistency. Put it in order.',
        steps: [
          'The reply arrives before its question',
          'The reader sees the reply depends on the question',
          'The reply is held back',
          'The question arrives and is shown',
          'The held reply is shown after it',
        ],
        explain: 'Dependencies travel with each write.',
      },
      {
        id: 's7-5-5',
        type: 'scenario',
        prompt: 'Which consistency for comment threads?',
        situation: 'A global forum. Comments must never appear before what they reply to; speed matters.',
        needs: ['Replies never shown before their parents', 'Low latency worldwide'],
        options: [
          {
            text: 'Causal consistency',
            cost: 'Messages carry their dependencies; some wait briefly.',
          },
          {
            text: 'Strong consistency everywhere',
            cost: 'Cross-region agreement on every comment.',
            why: 'More than needed, and slower worldwide.',
          },
          {
            text: 'Plain eventual consistency',
            cost: 'Fast everywhere.',
            why: 'Replies can show up before their parents.',
          },
        ],
        answer: 0,
        explain: 'Just enough ordering, without global coordination.',
      },
      {
        id: 's7-5-6',
        type: 'mcq',
        prompt: 'Two unrelated posts appear in different orders for two readers. Is that allowed under causal consistency?',
        options: [
          { text: 'Yes' },
          { text: 'No: everyone sees one order', why: 'That stronger guarantee is total order; causal orders only linked events.' },
          { text: 'Only if they are by one author', why: 'Posts by one author are ordered: each follows the last.' },
        ],
        answer: 0,
        explain: 'Only cause-and-effect pairs are ordered.',
      },
      {
        id: 's7-5-7',
        type: 'fill-blank',
        prompt: 'Show a message only once its parent has been shown.',
        code: `seen = {"q1"}

def can_show(parent):
    if parent is None:
        return True
    return parent in ___

print(can_show("q1"), can_show("1"))`,
        answer: ['seen'],
        distractors: [{ text: '"q1"', why: '`in "q1"` searches the characters of a string.' }],
        expectOutput: 'True False',
        explain: 'q9 has not arrived: wait.',
      },
      {
        id: 's7-5-8',
        type: 'mcq',
        prompt: 'Where does causal consistency sit?',
        options: [
          { text: 'Between eventual and strong' },
          { text: 'Stronger than strong ones', why: 'Strong (linearizable) orders everything; causal only linked events.' },
          { text: 'Weaker than eventual ones', why: 'It adds ordering on top of eventual convergence.' },
        ],
        answer: 0,
        explain: 'Often the sweet spot for social and messaging apps.',
      },
    ],
  },
];

export const s7: Unit = {
  id: 'S7',
  track: 'system-design',
  title: 'Consistency and coordination',
  blurb: 'CAP as a choice during a partition and its everyday latency cost, strong, eventual and causal consistency, quorums, logical clocks, consensus, leader election and locks with fencing tokens.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s7More],
  labs: s7Labs,
  library: s7Library,
};
