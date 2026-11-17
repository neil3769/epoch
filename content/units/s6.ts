import { s6Labs } from '../labs/s6';
import { s6Library } from '../library/s6';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s6More } from './s6-more';

/*
 * S6 Databases: replication and partitioning. Lessons 1-5 here: leader and
 * followers, replication lag, reading your own writes, synchronous or
 * asynchronous, failover and split brain. Lessons 6-11 in s6-more.ts: why
 * partition, range or hash, choosing a shard key, hot keys, consistent
 * hashing (ring figure), checkpoint.
 *
 * sim.Replicas(followers, lag) is a leader (node 0) and followers that see
 * each write `lag` seconds later on the virtual clock; read(key, node).
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's6-01',
    title: 'Leader and followers',
    summary: 'All writes go to the leader, which copies each change to followers; reads can use any copy.',
    card: {
      title: 'Leader and followers',
      text: 'Replication keeps copies of the same data on several machines. In leader-follower replication every write goes to one leader, which sends each change on to its followers; reads can go to any copy. More copies give more read capacity and survive a machine dying, but not more write capacity.',
      code: `sim.clock.reset()
rs = sim.Replicas(2, lag=0)
rs.write("x", 1)
print([rs.read("x", n)
       for n in range(3)])`,
      output: '[1, 1, 1]',
    },
    exercises: [
      {
        id: 's6-1-1',
        type: 'diagram',
        prompt: 'Tap the path of a write, in order.',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'l', kind: 'db', label: 'Leader' },
            { id: 'f', kind: 'replica', label: 'Follower 1' },
            { id: 'g', kind: 'replica', label: 'Follower 2' },
          ],
          edges: [
            { from: 'a', to: 'l', label: 'write' },
            { from: 'l', to: 'f', label: 'copy' },
            { from: 'l', to: 'g', label: 'copy' },
            { from: 'a', to: 'f', label: 'read', dashed: true },
          ],
        },
        goal: { kind: 'path', answer: ['a', 'l', 'f'] },
        explain: 'The app writes to the leader; the leader copies to the followers.',
      },
      {
        id: 's6-1-2',
        type: 'estimate',
        prompt: 'A leader and 3 followers each serve 5,000 reads/s. Total read capacity?',
        expr: '4 * 5000',
        answer: 20000,
        tolerance: 1.5,
        unit: 'reads/s',
        options: [
          { value: 5000, why: 'Every copy can serve reads, not only the leader.' },
          { value: 20000 },
          { value: 10000, why: 'That is two copies\' worth; there are four.' },
        ],
        work: ['4 copies × 5,000 = 20,000 reads/s'],
        explain: 'Writes stay at what the one leader can take.',
      },
      {
        id: 's6-1-3',
        type: 'mcq',
        prompt: 'The leader is at its write limit. Will adding followers help?',
        options: [
          { text: 'No: every write still hits the leader' },
          { text: 'Yes: followers share the writes', why: 'Followers only copy writes; they do not take them.' },
          { text: 'Yes: fewer reads on the leader', why: 'That frees a little room, but writes still all go through one machine.' },
        ],
        answer: 0,
        explain: 'Write capacity needs partitioning (lesson 6) or a bigger leader.',
      },
      {
        id: 's6-1-4',
        type: 'bucket-sort',
        prompt: 'Leader or follower?',
        buckets: ['Leader', 'Follower'],
        items: [
          { text: 'Accepts every write', bucket: 0, why: 'Only the leader takes writes.' },
          { text: 'Applies changes it is sent', bucket: 1, why: 'It copies the leader\'s changes.' },
          { text: 'Can serve stale reads', bucket: 1, why: 'It may be behind the leader.' },
          { text: 'One per replica set', bucket: 0, why: 'There is exactly one leader at a time.' },
          { text: 'Can be promoted if the other dies', bucket: 1, why: 'Failover makes a follower the new leader.' },
        ],
        explain: 'One writer, many readers.',
      },
      {
        id: 's6-1-5',
        type: 'scenario',
        prompt: 'Heavy reports slow the main database. What do you do?',
        situation: 'Analysts run long reporting queries on the production database every afternoon, and the app slows down.',
        needs: ['The app stays fast', 'Reports may use data a few seconds old'],
        options: [
          {
            text: 'Run reports on a follower',
            cost: 'Another machine; reports may lag slightly.',
          },
          {
            text: 'Run reports at night only',
            cost: 'Analysts wait a day.',
            why: 'It avoids the slowdown by delaying the work, which the needs do not ask for.',
          },
          {
            text: 'Give the leader more CPU',
            cost: 'A pricier machine.',
            why: 'Reports and app still compete on one machine.',
          },
        ],
        answer: 0,
        explain: 'A read replica isolates heavy reads from the app.',
      },
      {
        id: 's6-1-6',
        type: 'predict-output',
        prompt: 'Followers here lag by 1 s. Right after the write, what do the three nodes return?',
        code: `sim.clock.reset()
rs = sim.Replicas(2, lag=1.0)
rs.write("x", 1)
print([rs.read("x", n)
       for n in range(3)])`,
        answer: '[1, None, None]',
        typedWrong: [{ answer: '[1, 1, 1]', why: 'The followers get the write only after 1 s.' }],
        explain: 'Next lesson: that gap is replication lag.',
      },
      {
        id: 's6-1-7',
        type: 'diagram',
        prompt: 'Which box must every write go through?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'l', kind: 'db', label: 'Leader' },
            { id: 'f', kind: 'replica', label: 'Follower 1' },
            { id: 'g', kind: 'replica', label: 'Follower 2' },
          ],
          edges: [
            { from: 'a', to: 'l' },
            { from: 'l', to: 'f' },
            { from: 'l', to: 'g' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'l',
          why: {
            a: 'The app sends writes; it does not store them.',
            f: 'Followers receive copies; they do not accept writes.',
            g: 'Followers receive copies; they do not accept writes.',
          },
        },
        explain: 'One leader orders all writes, so every copy applies them in the same order.',
      },
      {
        id: 's6-1-8',
        type: 'fill-blank',
        prompt: 'Read from follower 2.',
        code: `sim.clock.reset()
rs = sim.Replicas(2, lag=0)
rs.write("y", 7)
print(rs.read("y", ___))`,
        answer: ['2'],
        distractors: [{ text: '3', why: 'Nodes are 0 (leader), 1 and 2: there is no node 3.' }],
        expectOutput: '7',
        explain: 'Node 0 is the leader; 1 and 2 are followers.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's6-02',
    title: 'Replication lag',
    summary: 'Followers apply changes slightly after the leader, so a follower read can return old data.',
    card: {
      title: 'Replication lag',
      text: 'Followers apply changes a little after the leader: usually milliseconds, sometimes seconds under load. A read from a follower during that gap returns old data. Most reads can live with that; some cannot.',
      code: `sim.clock.reset()
rs = sim.Replicas(1, lag=0.5)
rs.write("likes", 10)
before = rs.read("likes", 1)
sim.clock.advance(0.5)
print(before, rs.read("likes", 1))`,
      output: 'None 10',
    },
    exercises: [
      {
        id: 's6-2-1',
        type: 'predict-output',
        prompt: 'A price changes from 5 to 8. What does the follower say 0.2 s later, and 1 s later?',
        code: `sim.clock.reset()
rs = sim.Replicas(1, lag=0.5)
rs.write("price", 5)
sim.clock.advance(1)
rs.write("price", 8)
sim.clock.advance(0.2)
a = rs.read("price", 1)
sim.clock.advance(0.8)
print(a, rs.read("price", 1))`,
        answer: '5 8',
        typedWrong: [{ answer: '8 8', why: 'At 0.2 s the follower has not yet applied the new price.' }],
        explain: 'Stale for half a second, then correct.',
      },
      {
        id: 's6-2-2',
        type: 'estimate',
        prompt: 'The leader takes 2,000 writes/s and followers lag 0.5 s. About how many writes has a follower not yet applied at any moment?',
        expr: '2000 * 0.5',
        answer: 1000,
        tolerance: 1.5,
        unit: 'writes',
        options: [
          { value: 4, why: '2,000 per second for half a second is 1,000.' },
          { value: 1000 },
          { value: 4000, why: 'Multiply by the lag, do not divide.' },
        ],
        work: ['2,000/s × 0.5 s = 1,000 writes in flight'],
        explain: 'Little\'s law again: in flight = rate × time.',
      },
      {
        id: 's6-2-3',
        type: 'bucket-sort',
        prompt: 'Fine to read from a follower?',
        buckets: ['Follower OK', 'Leader only'],
        items: [
          { text: 'A product listing page', bucket: 0, why: 'A second-old price list is fine; checkout re-reads.' },
          { text: 'A balance before a withdrawal', bucket: 1, why: 'Must be exact right now.' },
          { text: 'Yesterday\'s sales report', bucket: 0, why: 'Old data by design.' },
          { text: 'A username check before sign-up', bucket: 1, why: 'A stale "free" answer allows duplicates.' },
          { text: 'A public profile page', bucket: 0, why: 'Seconds of lag do not matter.' },
        ],
        explain: 'Decide per read, not per app.',
      },
      {
        id: 's6-2-4',
        type: 'mcq',
        prompt: 'Lag is usually milliseconds. When does it grow to seconds or more?',
        options: [
          { text: 'When followers fall behind on load' },
          { text: 'Only when the network is down', why: 'Heavy write load or slow followers grow lag too.' },
          { text: 'Never: lag is fixed', why: 'It varies with load and with the follower\'s health.' },
        ],
        answer: 0,
        explain: 'Monitor replication lag and alert on it.',
      },
      {
        id: 's6-2-5',
        type: 'order-steps',
        prompt: 'Put a stale read in order.',
        steps: [
          'A user changes their display name on the leader',
          'The change is still on its way to the follower',
          'Another user reads the profile from the follower',
          'They see the old name',
          'The follower applies the change',
        ],
        explain: 'Harmless here; a problem when the reader is the writer (next lesson).',
      },
      {
        id: 's6-2-6',
        type: 'scenario',
        prompt: 'Where do stock-level reads go?',
        situation: 'Product pages show "in stock". Checkout reserves stock with an atomic update on the leader.',
        needs: ['Product pages fast', 'Never oversell'],
        options: [
          {
            text: 'Pages: follower; checkout: leader',
            cost: 'A page may say "in stock" for a moment after the last sale.',
          },
          {
            text: 'Every read goes to the leader',
            cost: 'All read load on one machine.',
            why: 'Checkout already prevents overselling; pages can lag.',
          },
          {
            text: 'Checkout reads a follower too',
            cost: 'Less leader load.',
            why: 'A stale count at checkout can oversell.',
          },
        ],
        answer: 0,
        explain: 'The same split as with caches (S4): approximate to show, exact to decide.',
      },
      {
        id: 's6-2-7',
        type: 'fill-blank',
        prompt: 'Wait until the follower has the write.',
        code: `sim.clock.reset()
rs = sim.Replicas(1, lag=0.3)
rs.write("k", "v")
sim.clock.advance(___)
print(rs.read("k", 1))`,
        answer: ['0.3'],
        distractors: [{ text: '0.1', why: 'After 0.1 s the follower still has nothing.' }],
        expectOutput: 'v',
        explain: 'After the lag, the copy has caught up.',
      },
      {
        id: 's6-2-8',
        type: 'diagram',
        prompt: 'A user saw an old price. Which box most likely served it?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'l', kind: 'db', label: 'Leader' },
            { id: 'f', kind: 'replica', label: 'Follower' },
          ],
          edges: [
            { from: 'a', to: 'l', label: 'writes' },
            { from: 'l', to: 'f', label: 'copy' },
            { from: 'a', to: 'f', label: 'reads' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'f',
          why: {
            a: 'The app passes on what a database returned.',
            l: 'The leader always has the newest committed price.',
          },
        },
        explain: 'Reads from a lagging follower.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's6-03',
    title: 'Reading your own writes',
    summary: 'A user must see their own change: read from the leader for a short while after they write.',
    card: {
      title: 'Reading your own writes',
      text: 'The most confusing lag is a user not seeing their own change: they edit their profile, reload, and the old one is back. The usual fix is to read from the leader for a short time after that user writes, or always for data the user can edit. Other users can keep reading followers.',
    },
    exercises: [
      {
        id: 's6-3-1',
        type: 'predict-output',
        prompt: 'Ana saves a new bio, then her page reloads from a follower. What does she see?',
        code: `sim.clock.reset()
rs = sim.Replicas(1, lag=1.0)
rs.write("bio", "old")
sim.clock.advance(5)
rs.write("bio", "new")
sim.clock.advance(0.1)
print(rs.read("bio", 1))`,
        answer: 'old',
        typedWrong: [{ answer: 'new', why: 'The follower is 1 s behind; only 0.1 s has passed.' }],
        explain: 'To Ana it looks as if her save failed.',
      },
      {
        id: 's6-3-2',
        type: 'run-code',
        prompt: 'Write `node_for(wrote_at, now)`: read from the leader (0) if the user wrote less than 2 s ago, otherwise from follower 1.',
        solution: `def node_for(wrote_at, now):
    if wrote_at is not None and \\
            now - wrote_at < 2:
        return 0
    return 1`,
        tests: [
          'assert node_for(10.0, 10.5) == 0, "just wrote: leader"',
          'assert node_for(10.0, 13.0) == 1, "3 s later: follower"',
          'assert node_for(None, 5.0) == 1, "never wrote: follower"',
        ].join('\n'),
        maxLines: 6,
        placeholder: 'def node_for(wrote_at, now):',
        explain: 'Pick the window longer than the usual lag.',
      },
      {
        id: 's6-3-3',
        type: 'scenario',
        prompt: 'How do you fix "my edit disappeared"?',
        situation: 'Profile reads go to followers. Users who just saved sometimes see their old profile.',
        needs: ['Users always see their own edits', 'Most reads stay on followers'],
        options: [
          {
            text: 'Leader reads after own write',
            cost: 'Routing logic, and a little more leader load.',
          },
          {
            text: 'All profile reads from the leader',
            cost: 'All profile load back on the leader.',
            why: 'It breaks the "most reads on followers" need.',
          },
          {
            text: 'Tell users to wait and reload',
            cost: 'Confused users.',
            why: 'It does not meet the first need.',
          },
        ],
        answer: 0,
        explain: 'Only the writer needs the guarantee, and only briefly.',
      },
      {
        id: 's6-3-4',
        type: 'mcq',
        prompt: 'Who needs read-your-writes for Ana\'s new bio?',
        options: [
          { text: 'Ana' },
          { text: 'Everyone who views it', why: 'Others do not know it changed; a second\'s delay is invisible to them.' },
          { text: 'Nobody', why: 'Ana thinks her edit failed: she needs it.' },
        ],
        answer: 0,
        explain: 'The guarantee is per user.',
      },
      {
        id: 's6-3-5',
        type: 'fill-blank',
        prompt: 'Route Ana to the leader right after her write.',
        code: `def node_for(wrote_at, now):
    if now - wrote_at < 2:
        return ___
    return 1

print(node_for(10.0, 10.5))`,
        answer: ['0'],
        distractors: [{ text: '1', why: 'Node 1 is the lagging follower.' }],
        expectOutput: '0',
        explain: 'Node 0 is the leader.',
      },
      {
        id: 's6-3-6',
        type: 'order-steps',
        prompt: 'Read-your-writes with a time window. Put it in order.',
        steps: [
          'Ana saves her bio; the app notes the time',
          'Ana\'s next request arrives within the window',
          'The app reads from the leader',
          'Ana sees her new bio',
          'After the window, her reads go back to followers',
        ],
        explain: 'Store "last write time" in the session.',
      },
      {
        id: 's6-3-7',
        type: 'predict-output',
        prompt: 'The same edit, read from the leader. What does Ana see?',
        code: `sim.clock.reset()
rs = sim.Replicas(1, lag=1.0)
rs.write("bio", "old")
sim.clock.advance(5)
rs.write("bio", "new")
sim.clock.advance(0.1)
print(rs.read("bio", 0))`,
        answer: 'new',
        typedWrong: [{ answer: 'old', why: 'The leader applied the write immediately.' }],
        explain: 'The leader is never behind.',
      },
      {
        id: 's6-3-8',
        type: 'mcq',
        prompt: 'Ana edits on her laptop, then opens her phone. Does a per-session "last write" time help the phone?',
        options: [
          { text: 'No: store it per user instead' },
          { text: 'Yes: sessions are shared', why: 'The phone has its own session, without the laptop\'s write time.' },
          { text: 'It does not matter', why: 'She would see her old bio on the phone.' },
        ],
        answer: 0,
        explain: 'Cross-device read-your-writes needs the write time kept per user, server side.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's6-04',
    title: 'Synchronous or asynchronous',
    summary: 'Synchronous waits for a follower before confirming: safer, slower; asynchronous confirms at once and copies later.',
    card: {
      title: 'Synchronous or asynchronous',
      text: 'With synchronous replication the leader waits until a follower confirms before saying a write is done: nothing confirmed is lost if the leader dies, but every write waits. Asynchronous replication confirms at once and copies later: fast, but the newest writes can be lost if the leader dies first. Many systems wait for one follower and copy to the rest asynchronously.',
    },
    exercises: [
      {
        id: 's6-4-1',
        type: 'estimate',
        prompt: 'A write takes 2 ms on the leader. With synchronous replication to a follower in another region (one world round trip), how long until the write is confirmed?',
        expr: '2 + WORLD_ROUND_TRIP * 1000',
        answer: 152,
        tolerance: 1.5,
        unit: 'ms',
        options: [
          { value: 2, why: 'Synchronous means waiting for the far follower too.' },
          { value: 152 },
          { value: 1500, why: 'One round trip is 150 ms, not 1.5 s.' },
        ],
        work: ['2 ms local + 150 ms to the far follower and back = 152 ms'],
        explain: 'Why synchronous followers usually sit in the same region.',
      },
      {
        id: 's6-4-2',
        type: 'bucket-sort',
        prompt: 'Synchronous or asynchronous?',
        buckets: ['Synchronous', 'Asynchronous'],
        items: [
          { text: 'No confirmed write lost when the leader dies', bucket: 0, why: 'A follower already had it.' },
          { text: 'Fastest writes', bucket: 1, why: 'The leader answers without waiting.' },
          { text: 'A slow follower slows every write', bucket: 0, why: 'Writes wait for it.' },
          { text: 'Recent writes can vanish in a failover', bucket: 1, why: 'They may not have reached any follower.' },
          { text: 'Fine for a far-away backup copy', bucket: 1, why: 'Nobody waits on the ocean crossing.' },
        ],
        explain: 'Durability against latency.',
      },
      {
        id: 's6-4-3',
        type: 'scenario',
        prompt: 'How should the payments database replicate?',
        situation: 'Payments must never be lost once confirmed. There is a follower in the same region and one on another continent.',
        needs: ['No confirmed payment lost if the leader dies', 'Write latency stays low'],
        options: [
          {
            text: 'Sync near, async far',
            cost: 'A few ms per write; the far copy can lag.',
          },
          {
            text: 'Async to both followers',
            cost: 'Fastest writes.',
            why: 'A leader crash can lose payments already confirmed to customers.',
          },
          {
            text: 'Sync to both followers',
            cost: 'Every write waits for the far continent.',
            why: 'About 150 ms on every payment: against the latency need.',
          },
        ],
        answer: 0,
        explain: 'Often called semi-synchronous replication.',
      },
      {
        id: 's6-4-4',
        type: 'predict-output',
        prompt: 'Async replication, then the leader dies 0.2 s after a write and a follower (lag 0.5 s) is promoted. Which writes survive?',
        code: `sim.clock.reset()
rs = sim.Replicas(1, lag=0.5)
rs.write("a", 1)
sim.clock.advance(1)
rs.write("b", 2)
sim.clock.advance(0.2)  # leader dies
print(rs.read("a", 1),
      rs.read("b", 1))`,
        answer: '1 None',
        typedWrong: [{ answer: '1 2', why: '"b" had not reached the follower when the leader died.' }],
        explain: 'The customer was told "b" succeeded; it is gone.',
      },
      {
        id: 's6-4-5',
        type: 'mcq',
        prompt: 'Why not make every follower synchronous?',
        options: [
          { text: 'One slow follower stalls writes' },
          { text: 'Synchronous loses data', why: 'It loses less; the cost is latency and availability.' },
          { text: 'Followers cannot be synchronous', why: 'They can; it is a configuration choice.' },
        ],
        answer: 0,
        explain: 'If a synchronous follower is down, writes must wait or fail.',
      },
      {
        id: 's6-4-6',
        type: 'order-steps',
        prompt: 'A synchronous write. Put it in order.',
        steps: [
          'The app sends the write to the leader',
          'The leader writes it locally',
          'The leader sends it to the follower',
          'The follower confirms',
          'The leader tells the app it is done',
        ],
        explain: 'The confirmation waits for the follower.',
      },
      {
        id: 's6-4-7',
        type: 'diagram',
        prompt: 'Which follower should be synchronous for low-latency, safe writes?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'l', kind: 'db', label: 'Leader EU' },
            { id: 'n', kind: 'replica', label: 'Follower EU' },
            { id: 'f', kind: 'replica', label: 'Follower US' },
          ],
          edges: [
            { from: 'a', to: 'l' },
            { from: 'l', to: 'n' },
            { from: 'l', to: 'f' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'n',
          why: {
            a: 'The app is the client, not a copy.',
            l: 'The leader is the one waiting.',
            f: 'Waiting on another continent adds about 150 ms to every write.',
          },
        },
        explain: 'Near and synchronous for safety; far and asynchronous for disaster recovery.',
      },
      {
        id: 's6-4-8',
        type: 'fill-blank',
        prompt: 'A synchronous write waits for the follower. Wait long enough.',
        code: `sim.clock.reset()
rs = sim.Replicas(1, lag=0.01)
rs.write("p", 1)
sim.clock.advance(___)
print(rs.read("p", 1) == 1)`,
        answer: ['0.01'],
        distractors: [{ text: '0.005', why: 'The follower is 0.01 s behind: not there yet.' }],
        expectOutput: 'True',
        explain: 'Synchronous: confirmed once the follower holds it.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's6-05',
    title: 'Failover and split brain',
    summary: 'Promote a follower when the leader dies; never let two leaders accept writes at once.',
    card: {
      title: 'Failover and split brain',
      text: 'When the leader dies, a follower is promoted to leader and the apps switch to it. If the old leader was only cut off rather than dead and keeps accepting writes, there are two leaders: split brain, and their data diverges. Systems prevent it by needing a majority of nodes to agree on the leader and by fencing off the old one.',
    },
    exercises: [
      {
        id: 's6-5-1',
        type: 'order-steps',
        prompt: 'An automatic failover. Put it in order.',
        steps: [
          'The leader stops answering heartbeats',
          'A majority of nodes agree it is gone',
          'The most up-to-date follower is promoted',
          'The old leader is fenced off',
          'Apps send writes to the new leader',
        ],
        explain: 'Fencing before switching keeps the old leader from writing.',
      },
      {
        id: 's6-5-2',
        type: 'predict-output',
        prompt: 'How many nodes form a majority in a cluster of 5?',
        code: `n = 5
print(n // 2 + 1)`,
        answer: '3',
        typedWrong: [{ answer: '2', why: 'A majority is more than half: 3 of 5.' }],
        explain: 'Two groups cannot both have 3 of 5: at most one side can elect a leader.',
      },
      {
        id: 's6-5-3',
        type: 'predict-output',
        prompt: 'Split brain: both sides accept a write to the same key. What do the two copies hold?',
        code: `left = {"stock": 5}
right = {"stock": 5}
left["stock"] -= 1    # old leader
right["stock"] -= 2   # new leader
print(left["stock"], right["stock"])`,
        answer: '4 3',
        typedWrong: [{ answer: '2 2', why: 'Each side applied only its own write: they now disagree.' }],
        explain: 'Neither is right; the true answer is 2. Reconciling this is painful.',
      },
      {
        id: 's6-5-4',
        type: 'mcq',
        prompt: 'Why does a 2-node cluster struggle to fail over safely?',
        options: [
          { text: 'No majority when they lose contact' },
          { text: 'Two nodes are too slow', why: 'Speed is not the problem; agreeing is.' },
          { text: 'Followers cannot be promoted', why: 'They can; the question is who decides.' },
        ],
        answer: 0,
        explain: 'Each side sees 1 of 2: neither has a majority. Use 3 nodes, or a third tie-breaker.',
      },
      {
        id: 's6-5-5',
        type: 'diagram',
        prompt: 'The network splits. The old leader is cut off but alive. Which box must be fenced?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'Apps' },
            { id: 'o', kind: 'db', label: 'Old leader' },
            { id: 'n', kind: 'db', label: 'New leader' },
            { id: 'f', kind: 'replica', label: 'Follower' },
          ],
          edges: [
            { from: 'a', to: 'n' },
            { from: 'n', to: 'f' },
            { from: 'a', to: 'o', dashed: true },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'o',
          why: {
            a: 'The apps must stop using the old leader, but it is the old leader that must be stopped.',
            n: 'The new leader, elected by a majority, should keep writing.',
            f: 'The follower copies from the new leader; it accepts no writes.',
          },
        },
        explain: 'Fencing: revoke its right to write (a token, a storage lock, or power).',
      },
      {
        id: 's6-5-6',
        type: 'scenario',
        prompt: 'How many database nodes for automatic failover?',
        situation: 'You want automatic, safe failover if any one node dies.',
        needs: ['Survive one node failing', 'Never two leaders'],
        options: [
          {
            text: 'Three nodes, majority vote',
            cost: 'A third node to run.',
          },
          {
            text: 'Two nodes',
            cost: 'Cheaper.',
            why: 'When they lose contact neither has a majority, so it is unsafe or stuck.',
          },
          {
            text: 'Two nodes, each may promote itself',
            cost: 'Cheaper.',
            why: 'A network split creates two leaders.',
          },
        ],
        answer: 0,
        explain: '3 nodes survive 1 failure; 5 survive 2.',
      },
      {
        id: 's6-5-7',
        type: 'estimate',
        prompt: 'A cluster must survive 2 nodes failing at once with a majority left. Smallest cluster?',
        expr: '2 * 2 + 1',
        answer: 5,
        tolerance: 1.1,
        unit: 'nodes',
        options: [
          { value: 3, why: 'With 2 of 3 down, 1 is not a majority.' },
          { value: 5 },
          { value: 4, why: '2 of 4 left is not more than half.' },
        ],
        work: ['To survive f failures you need 2f + 1 nodes', '2 × 2 + 1 = 5'],
        explain: 'The 2f + 1 rule comes back in S7.',
      },
      {
        id: 's6-5-8',
        type: 'mcq',
        prompt: 'Which follower should be promoted?',
        options: [
          { text: 'The most up to date' },
          { text: 'The newest machine', why: 'Hardware age matters less than missing data.' },
          { text: 'Any one, at random', why: 'A lagging one would lose more recent writes.' },
        ],
        answer: 0,
        explain: 'It has applied the most of the old leader\'s writes.',
      },
    ],
  },
];

export const s6: Unit = {
  id: 'S6',
  track: 'system-design',
  title: 'Databases: replication and partitioning',
  blurb: 'Leaders and followers, replication lag and reading your own writes, synchronous or asynchronous copies, failover and split brain, sharding by range or hash, shard keys, hot keys and consistent hashing.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s6More],
  labs: s6Labs,
  library: s6Library,
};
