import { s14Labs } from '../labs/s14';
import { s14Library } from '../library/s14';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';

/*
 * S14 The design interview. Six lessons: the seven-step framework, from a
 * vague prompt to requirements, choosing what to go deep on, defending a
 * trade-off, how candidates fail and pacing 35 minutes, checkpoint. The
 * design walkthroughs are the real practice; these lessons teach the moves.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's14-01',
    title: 'The seven steps',
    summary: 'Requirements, estimation, API, data model, high-level design, deep dive, bottlenecks and trade-offs, in that order.',
    card: {
      title: 'The seven steps',
      text: 'A system design interview rewards a visible, orderly process more than a clever final picture. Work through seven steps: requirements, estimation, API, data model, high-level design, a deep dive, then bottlenecks and trade-offs, saying each step aloud as you start it. The design walkthroughs in this app follow the same steps, and they are where you practise them.',
    },
    exercises: [
      {
        id: 's14-1-1',
        type: 'order-steps',
        prompt: 'Put the seven steps in order.',
        steps: [
          'Requirements',
          'Estimation',
          'API',
          'Data model',
          'High-level design',
          'Deep dive',
          'Bottlenecks and trade-offs',
        ],
        explain: 'Each step uses what the earlier ones settled.',
      },
      {
        id: 's14-1-2',
        type: 'match-pairs',
        prompt: 'Match each early step to what it settles.',
        pairs: [
          { left: 'Requirements', right: 'what it must do, and how well', why: 'Features plus latency, availability and scale.' },
          { left: 'Estimation', right: 'rough numbers for scale', why: 'Requests a second, storage, bandwidth.' },
          { left: 'API', right: 'the calls clients make', why: 'Names, inputs and outputs.' },
        ],
        explain: 'Settle these before drawing a single box.',
      },
      {
        id: 's14-1-3',
        type: 'match-pairs',
        prompt: 'Match each later step to what it settles.',
        pairs: [
          { left: 'Data model', right: 'what is stored, keyed how', why: 'Tables or documents and their keys.' },
          { left: 'Deep dive', right: 'one hard part in detail', why: 'Where the interesting problem is.' },
          { left: 'Bottlenecks', right: 'what breaks first, and the fix', why: 'Shows you can see the limits.' },
        ],
        explain: 'The high-level design sits between them: the boxes and arrows.',
      },
      {
        id: 's14-1-4',
        type: 'mcq',
        prompt: 'Why settle requirements before drawing any boxes?',
        options: [
          { text: 'Boxes depend on the needs' },
          { text: 'Interviewers ask for it', why: 'They do, but because the design depends on it.' },
          { text: 'Drawing takes too long', why: 'Drawing is quick; drawing the wrong thing is costly.' },
        ],
        answer: 0,
        explain: 'A read-heavy link shortener and a write-heavy chat app need different boxes.',
      },
      {
        id: 's14-1-5',
        type: 'bucket-sort',
        prompt: 'A URL shortener interview. Which step does each question belong to?',
        buckets: ['Requirements', 'Estimation', 'Deep dive'],
        items: [
          { text: 'Do links ever expire?', bucket: 0, why: 'A question about what the system must do.' },
          { text: '100 million new links a month: writes a second?', bucket: 1, why: 'Turning scale into numbers.' },
          { text: 'How are codes made without collisions?', bucket: 2, why: 'The hard core of this problem.' },
          { text: 'Who uses it, and for what?', bucket: 0, why: 'Users and use cases come first.' },
          { text: 'How much storage over five years?', bucket: 1, why: 'Back-of-envelope sizing.' },
          { text: 'How does the cache survive a viral link?', bucket: 2, why: 'A detailed look at one part.' },
        ],
        explain: 'The same system, asked about at three depths.',
      },
      {
        id: 's14-1-6',
        type: 'scenario',
        prompt: 'A candidate hears "design a photo-sharing app" and starts drawing load balancers in the first minute.',
        situation: 'Nothing has been said about users, features or scale.',
        needs: ['A design that fits the problem'],
        options: [
          {
            text: 'Ask about requirements first',
            cost: 'Two or three minutes before any drawing.',
          },
          {
            text: 'Keep drawing, ask later on',
            cost: 'Looks fast.',
            why: 'The boxes may solve the wrong problem, and the interviewer sees no process.',
          },
        ],
        answer: 0,
        explain: 'The first minutes are for questions.',
      },
      {
        id: 's14-1-7',
        type: 'mcq',
        prompt: 'What should you do when moving from one step to the next?',
        options: [
          { text: 'Say which step you start' },
          { text: 'Wait to be told to move', why: 'Driving the interview yourself is part of what is assessed.' },
          { text: 'Erase the earlier work', why: 'Earlier notes justify later choices: keep them visible.' },
        ],
        answer: 0,
        explain: '"Requirements are settled; let me estimate the scale." The interviewer can follow, or steer.',
      },
      {
        id: 's14-1-8',
        type: 'predict-output',
        prompt: 'The steps as a list. What does this print?',
        code: `STEPS = ["requirements",
         "estimation", "api",
         "data model", "high level",
         "deep dive", "trade-offs"]
print(len(STEPS),
      STEPS.index("api") + 1)`,
        answer: '7 3',
        typedWrong: [{ answer: '7 2', why: '`index` counts from 0, so api is at 2; plus one makes it step 3.' }],
        explain: 'API comes third, once you know what and how much.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's14-02',
    title: 'From a vague prompt',
    summary: 'Split requirements into what users can do and how well it must work; agree a short core and say what is out.',
    card: {
      title: 'From a vague prompt',
      text: 'Prompts such as "design a chat app" are vague on purpose, to see whether you ask before you build. Split requirements into functional ones (what users can do: send messages, see history) and non-functional ones (how well: latency, availability, consistency, scale), then agree a short list of core features and say what you are leaving out. Write the list where the interviewer can see it, and use it to justify every later choice.',
      see: ['s1-01', 's2-01'],
    },
    exercises: [
      {
        id: 's14-2-1',
        type: 'bucket-sort',
        prompt: 'A chat app. Functional or non-functional requirement?',
        buckets: ['Functional', 'Non-functional'],
        items: [
          { text: 'Users can send a message to a group', bucket: 0, why: 'Something a user can do.' },
          { text: 'Messages arrive within a second', bucket: 1, why: 'How fast: latency.' },
          { text: 'Users can see their chat history', bucket: 0, why: 'A feature.' },
          { text: 'The service is up 99.9% of the time', bucket: 1, why: 'How reliably: availability.' },
          { text: 'Users can block another user', bucket: 0, why: 'A feature.' },
          { text: 'It supports 50 million daily users', bucket: 1, why: 'How much: scale.' },
        ],
        explain: 'Functional: what. Non-functional: how well.',
      },
      {
        id: 's14-2-2',
        type: 'order-steps',
        prompt: 'The first five minutes. Put them in order.',
        steps: [
          'Restate the problem in one sentence',
          'Ask who the users are and what they do',
          'Agree the three or four core features',
          'Ask about scale and latency targets',
          'Say what you are leaving out',
        ],
        explain: 'By minute five there is a written list both of you agree on.',
      },
      {
        id: 's14-2-3',
        type: 'scenario',
        prompt: '"Design a news feed." The candidate lists fifteen features and starts on all of them.',
        situation: 'There are 35 minutes in total.',
        needs: ['A complete design of what matters'],
        options: [
          {
            text: 'Agree three core features',
            cost: 'Twelve features only mentioned.',
          },
          {
            text: 'Design all fifteen features',
            cost: 'Nothing left out.',
            why: 'None of them gets designed properly in 35 minutes.',
          },
        ],
        answer: 0,
        explain: 'Post, follow and read the feed; mention the rest as out of scope.',
      },
      {
        id: 's14-2-4',
        type: 'mcq',
        prompt: 'Which is a useful clarifying question?',
        options: [
          { text: 'How many reads per write?' },
          { text: 'Which database should I use?', why: 'That asks the interviewer for your answer.' },
          { text: 'Should I draw the boxes now?', why: 'Drive the process yourself.' },
        ],
        answer: 0,
        explain: 'The read/write ratio shapes caching, replication and storage.',
      },
      {
        id: 's14-2-5',
        type: 'mcq',
        prompt: 'You ask about scale and the interviewer says "you decide". What now?',
        options: [
          { text: 'State an assumption and go on' },
          { text: 'Refuse until they decide', why: 'Making reasonable assumptions is part of the test.' },
          { text: 'Skip the requirement', why: 'Then later choices have nothing to rest on.' },
        ],
        answer: 0,
        explain: '"Say 10 million daily users, reads ten times writes." Write it down.',
      },
      {
        id: 's14-2-6',
        type: 'bucket-sort',
        prompt: 'A 35-minute URL shortener. Core, or leave out?',
        buckets: ['Core', 'Leave out'],
        items: [
          { text: 'Shorten a long URL', bucket: 0, why: 'The point of the product.' },
          { text: 'Redirect a short link quickly', bucket: 0, why: 'The busiest path by far.' },
          { text: 'An account settings page', bucket: 1, why: 'Ordinary, and says nothing about the design.' },
          { text: 'Billing plans', bucket: 1, why: 'A separate system.' },
          { text: 'Marketing emails', bucket: 1, why: 'Unrelated to the core problem.' },
        ],
        explain: 'Saying "I am leaving billing out" is a strength, not a gap.',
      },
      {
        id: 's14-2-7',
        type: 'match-pairs',
        prompt: 'Match each non-functional requirement to its question.',
        pairs: [
          { left: 'Latency', right: 'how fast is one request?', why: 'Often as a p99 target.' },
          { left: 'Availability', right: 'what share of time does it work?', why: 'Nines: 99.9% and so on.' },
          { left: 'Consistency', right: 'do reads see the latest write?', why: 'Strong, causal or eventual.' },
        ],
        explain: 'Ask for numbers where you can.',
      },
      {
        id: 's14-2-8',
        type: 'mcq',
        prompt: 'Why write the requirements where the interviewer can see them?',
        options: [
          { text: 'To justify later choices' },
          { text: 'To look busy and organised', why: 'The point is to point back at them later.' },
          { text: 'Interviewers grade handwriting', why: 'They grade reasoning.' },
        ],
        answer: 0,
        explain: '"We said reads dominate, so the cache goes here."',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's14-03',
    title: 'Choosing the deep dive',
    summary: 'Go deep on the part that is hardest or most specific to this problem, and say why you chose it.',
    card: {
      title: 'Choosing the deep dive',
      text: 'After the high-level design there is time to go deep on one or two parts, so choose the part that is hardest or most specific to this problem: making codes for a URL shortener, fan-out for a news feed, matching for a ride app. Say why you chose it, and offer the interviewer the choice if they have a preference. Skip deep dives into parts every system has, such as a generic load balancer, unless this problem makes them hard.',
    },
    exercises: [
      {
        id: 's14-3-1',
        type: 'match-pairs',
        prompt: 'Match each problem to its best deep dive.',
        pairs: [
          { left: 'URL shortener', right: 'making short codes unique', why: 'Collisions and coordination are the core.' },
          { left: 'News feed', right: 'fan-out of posts to followers', why: 'Write-time or read-time, and celebrities.' },
          { left: 'Ride app', right: 'matching nearby drivers', why: 'Geospatial lookup with constant updates.' },
        ],
        explain: 'The part that makes this problem different from every other.',
      },
      {
        id: 's14-3-2',
        type: 'match-pairs',
        prompt: 'And for these problems?',
        pairs: [
          { left: 'Chat app', right: 'delivering to online users', why: 'Connections spread across servers.' },
          { left: 'Rate limiter', right: 'counting across servers', why: 'A shared, fast counter.' },
          { left: 'Video site', right: 'transcoding and delivery', why: 'Huge files, many formats, a CDN.' },
        ],
        explain: 'Lessons S8 to S11 hold the material for each.',
      },
      {
        id: 's14-3-3',
        type: 'mcq',
        prompt: 'Which deep dive shows least about a chat app?',
        options: [
          { text: 'A standard load balancer' },
          { text: 'Delivering to offline users', why: 'That is specific and interesting: stored messages, push.' },
          { text: 'Keeping message order', why: 'That is specific and interesting: per-chat ordering.' },
        ],
        answer: 0,
        explain: 'Every web system has one; it says nothing about chat.',
      },
      {
        id: 's14-3-4',
        type: 'scenario',
        prompt: 'You planned to go deep on storage. The interviewer asks, "what happens when a celebrity with 50 million followers posts?"',
        situation: 'Twelve minutes are left.',
        needs: ['Show what the interviewer wants to see'],
        options: [
          {
            text: 'Follow the hint: go deep',
            cost: 'Storage gets only a summary.',
          },
          {
            text: 'Stick to your planned dive',
            cost: 'Your prepared material.',
            why: 'The interviewer has told you what they want to assess.',
          },
        ],
        answer: 0,
        explain: 'Hints are gifts: fan-out on read for celebrities, on write for everyone else.',
      },
      {
        id: 's14-3-5',
        type: 'bucket-sort',
        prompt: 'A ride-hailing app. Worth a deep dive, or mention briefly?',
        buckets: ['Deep dive', 'Mention only'],
        items: [
          { text: 'Matching riders to nearby drivers', bucket: 0, why: 'The heart of the product.' },
          { text: 'Driver positions every 4 seconds', bucket: 0, why: '250,000 updates a second at scale.' },
          { text: 'Login and sessions', bucket: 1, why: 'Standard; nothing special here.' },
          { text: 'Sending receipt emails', bucket: 1, why: 'A queue and a worker: say so and move on.' },
          { text: 'App settings storage', bucket: 1, why: 'A small table.' },
        ],
        explain: 'Spend the minutes where this problem is hard.',
      },
      {
        id: 's14-3-6',
        type: 'order-steps',
        prompt: 'Running a deep dive. Put it in order.',
        steps: [
          'Name the part and why it matters',
          'Describe the simplest version',
          'Show where it breaks at this scale',
          'Propose the better design',
          'State what the better design costs',
        ],
        explain: 'Starting simple shows you only add complexity when it is needed.',
      },
      {
        id: 's14-3-7',
        type: 'mcq',
        prompt: 'In a 35-minute interview, how long goes on the deep dive?',
        options: [
          { text: 'About 8 to 10 minutes' },
          { text: 'The first 20 minutes', why: 'Then requirements and the overall design never happen.' },
          { text: 'Only the last minute', why: 'Too short to show any depth.' },
        ],
        answer: 0,
        explain: 'Enough for one part done properly.',
      },
      {
        id: 's14-3-8',
        type: 'mcq',
        prompt: 'The high-level design is done with 12 minutes left, and two parts look interesting. What do you do?',
        options: [
          { text: 'Pick one, say why, go deep' },
          { text: 'Skim both at the surface', why: 'Depth is what this part of the interview tests.' },
          { text: 'Redraw the whole design', why: 'It is already done; spend the time going deeper.' },
        ],
        answer: 0,
        explain: 'Or ask: "I could go deep on fan-out or on storage; which interests you?"',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's14-04',
    title: 'Defending a trade-off',
    summary: 'Say what you chose, what it costs, why that cost is fine here, and what would change your mind.',
    card: {
      title: 'Defending a trade-off',
      text: 'Every design choice gives something up, and interviewers probe your choices to see whether you know what. Defend one in four parts: what you chose, what it costs, why that cost is acceptable for these requirements, and what would make you choose differently. If the interviewer pushes back with a good point, agree and adjust: changing your mind for a reason is a strength.',
    },
    exercises: [
      {
        id: 's14-4-1',
        type: 'order-steps',
        prompt: 'Defending a choice. Put the parts in order.',
        steps: [
          'State the choice',
          'Name what it costs',
          'Tie the cost to the requirements',
          'Say when you would choose otherwise',
        ],
        explain: '"A cache; reads may be a minute stale; the requirements allow that; for balances I would skip it."',
      },
      {
        id: 's14-4-2',
        type: 'scenario',
        prompt: 'The interviewer asks, "why a cache here? It can serve stale data."',
        situation: 'Your requirements say reads are 100 times writes and a minute of staleness is fine.',
        needs: ['A defence tied to the requirements'],
        options: [
          {
            text: 'Reads dwarf writes; staleness is OK',
            cost: 'Some users see an old value for a minute.',
          },
          {
            text: 'Caches are always faster anyway',
            cost: 'Sounds confident.',
            why: 'It ignores the staleness they raised and the requirements you agreed.',
          },
        ],
        answer: 0,
        explain: 'Point at the requirement you wrote down earlier.',
      },
      {
        id: 's14-4-3',
        type: 'bucket-sort',
        prompt: 'Strong or weak defence?',
        buckets: ['Strong', 'Weak'],
        items: [
          { text: '"It costs joins, which our queries never need"', bucket: 0, why: 'Names the cost and why it does not matter here.' },
          { text: '"Everyone uses it"', bucket: 1, why: 'Popularity is not a reason for this design.' },
          { text: '"Big companies do it this way"', bucket: 1, why: 'Their requirements are not yours.' },
          { text: '"If writes grew 10×, I would switch to sharding"', bucket: 0, why: 'Shows you know the limit.' },
          { text: '"It\'s simply the best database"', bucket: 1, why: 'Best for what?' },
        ],
        explain: 'Costs and conditions, not reputations.',
      },
      {
        id: 's14-4-4',
        type: 'mcq',
        prompt: 'The interviewer points out a real flaw in your design. What do you do?',
        options: [
          { text: 'Agree, and adjust the design' },
          { text: 'Defend the design to the end', why: 'Defending a real flaw shows you cannot take feedback.' },
          { text: 'Move quickly to another topic', why: 'They will notice, and the flaw stays.' },
        ],
        answer: 0,
        explain: '"Good point: the counter is a single point of failure. Let me replicate it."',
      },
      {
        id: 's14-4-5',
        type: 'match-pairs',
        prompt: 'Match each choice to what it costs.',
        pairs: [
          { left: 'Cache', right: 'stale reads', why: 'Copies lag behind the source.' },
          { left: 'Read replicas', right: 'replication lag', why: 'Followers apply writes late.' },
          { left: 'Sharding', right: 'hard cross-shard queries', why: 'Data no longer sits in one place.' },
        ],
        explain: 'Know the cost of each box you draw.',
      },
      {
        id: 's14-4-6',
        type: 'match-pairs',
        prompt: 'And these?',
        pairs: [
          { left: 'Queue', right: 'delay and possible repeats', why: 'Work happens later, at least once.' },
          { left: 'Strong consistency', right: 'higher latency', why: 'Replicas must agree first.' },
          { left: 'Denormalising', right: 'writes in several places', why: 'Each copy must be updated.' },
        ],
        explain: 'Units S4 to S8 covered each of these.',
      },
      {
        id: 's14-4-7',
        type: 'mcq',
        prompt: 'Why say what would change your mind?',
        options: [
          { text: 'It shows you know the limits' },
          { text: 'It avoids taking any position', why: 'You still choose; you also show the boundary.' },
          { text: 'It lengthens your answer', why: 'Length is not the point.' },
        ],
        answer: 0,
        explain: 'A choice with known limits is a decision; without them it is a guess.',
      },
      {
        id: 's14-4-8',
        type: 'scenario',
        prompt: '"SQL or NoSQL for user profiles?" There are about 10 million users, and profiles link to orders and addresses.',
        situation: 'Profiles change rarely.',
        needs: ['A defensible choice'],
        options: [
          {
            text: 'SQL: it fits, and needs joins',
            cost: 'Sharding later if it grows a hundredfold.',
          },
          {
            text: 'NoSQL, because it scales better',
            cost: 'Flexible schema.',
            why: '10 million rows fit one SQL database easily; "scales better" with no numbers is not a reason.',
          },
        ],
        answer: 0,
        explain: 'Then say when you would revisit it.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's14-05',
    title: 'Pacing and pitfalls',
    summary: 'Budget the 35 minutes, think aloud, give reasons for each technology, and always name what breaks.',
    card: {
      title: 'Pacing and pitfalls',
      text: 'The usual failures are drawing before asking, going silent while thinking, spending twenty minutes on one box, naming technologies without saying why, and never mentioning what breaks. A 35-minute budget keeps you honest: about 5 minutes on requirements, 3 on estimates, 5 on API and data model, 10 on the high-level design, 8 on a deep dive and 4 on bottlenecks. Practise the walkthroughs\' blank-page pass aloud with the app\'s 35-minute timer, because a real interview also tests explaining as you go.',
    },
    exercises: [
      {
        id: 's14-5-1',
        type: 'predict-output',
        prompt: 'The suggested budget. What does it add up to?',
        code: `plan = {
    "requirements": 5,
    "estimates": 3,
    "api + data": 5,
    "high level": 10,
    "deep dive": 8,
    "bottlenecks": 4,
}
print(sum(plan.values()))`,
        answer: '35',
        typedWrong: [{ answer: '30', why: 'High level is 10 and the deep dive 8: 5 + 3 + 5 + 10 + 8 + 4.' }],
        explain: 'Glance at the clock at each step change.',
      },
      {
        id: 's14-5-2',
        type: 'bucket-sort',
        prompt: 'Strong signal or red flag?',
        buckets: ['Strong signal', 'Red flag'],
        items: [
          { text: 'Asks about scale before drawing', bucket: 0, why: 'Design follows the numbers.' },
          { text: 'Silent for three minutes', bucket: 1, why: 'The interviewer cannot assess thinking they cannot hear.' },
          { text: '"I\'d use Kafka", with no reason', bucket: 1, why: 'A name is not a reason.' },
          { text: 'Names what breaks first at 10×', bucket: 0, why: 'Shows you see the limits.' },
          { text: 'Twenty minutes on the login page', bucket: 1, why: 'Time spent where nothing is hard.' },
          { text: 'Checks the design against the requirements', bucket: 0, why: 'Closes the loop.' },
        ],
        explain: 'Interviewers assess the process as much as the picture.',
      },
      {
        id: 's14-5-3',
        type: 'scenario',
        prompt: 'Twenty minutes in, you are still refining the data model.',
        situation: 'No high-level design is drawn yet.',
        needs: ['A complete design by the end'],
        options: [
          {
            text: 'Summarise and move on now',
            cost: 'Some columns left undecided.',
          },
          {
            text: 'Finish every column first',
            cost: 'A perfect data model.',
            why: 'There will be no time for the design, the deep dive or the trade-offs.',
          },
        ],
        answer: 0,
        explain: '"I\'ll leave indexes for later; here is the overall design."',
      },
      {
        id: 's14-5-4',
        type: 'mcq',
        prompt: 'What should you do while you think?',
        options: [
          { text: 'Think aloud' },
          { text: 'Stay silent', why: 'The interviewer cannot follow or help.' },
          { text: 'Change topic', why: 'The question is still waiting.' },
        ],
        answer: 0,
        explain: '"I am weighing a queue against a direct call; a queue helps because…"',
      },
      {
        id: 's14-5-5',
        type: 'order-steps',
        prompt: 'The 35-minute plan, in order.',
        steps: [
          'Requirements (5 min)',
          'Estimates (3 min)',
          'API and data model (5 min)',
          'High-level design (10 min)',
          'Deep dive (8 min)',
          'Bottlenecks (4 min)',
        ],
        explain: 'Spend the biggest blocks on the design and the deep dive.',
      },
      {
        id: 's14-5-6',
        type: 'predict-output',
        prompt: 'A candidate\'s first three steps ran long. How many minutes are left?',
        code: `budget = 35
spent = {"requirements": 9,
         "estimates": 6,
         "api + data": 10}
left = budget - sum(spent.values())
print(left)`,
        answer: '10',
        typedWrong: [{ answer: '22', why: '9 + 6 + 10 = 25 minutes are gone.' }],
        explain: 'The design, deep dive and bottlenecks needed 22: something must be cut short.',
      },
      {
        id: 's14-5-7',
        type: 'mcq',
        prompt: 'How should you name a technology in a design?',
        options: [
          { text: 'Say what it gives you here' },
          { text: 'List as many as you can', why: 'A list of names shows no reasoning.' },
          { text: 'Avoid naming any at all', why: 'Naming one with a reason is fine and concrete.' },
        ],
        answer: 0,
        explain: '"A log like Kafka, because three consumers replay the same events."',
      },
      {
        id: 's14-5-8',
        type: 'mcq',
        prompt: 'How should you do a walkthrough\'s blank-page pass?',
        options: [
          { text: 'Aloud, with a 35-minute timer' },
          { text: 'Silently, with no time limit', why: 'A real interview is spoken and timed.' },
          { text: 'Only reading the reference', why: 'Reading is not the same as producing it yourself.' },
        ],
        answer: 0,
        explain: 'Then compare with the reference and note what you missed.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 's14-06',
    title: 'Checkpoint: the interview',
    summary: 'The framework, requirements, deep dives, trade-offs and pacing, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's14-6-1',
        type: 'order-steps',
        prompt: 'The seven steps, in order.',
        steps: ['Requirements', 'Estimation', 'API', 'Data model', 'High-level design', 'Deep dive', 'Bottlenecks and trade-offs'],
        explain: 'Say each one aloud as you start it.',
      },
      {
        id: 's14-6-2',
        type: 'bucket-sort',
        prompt: 'A ride app. Functional or non-functional?',
        buckets: ['Functional', 'Non-functional'],
        items: [
          { text: 'Riders can request a ride', bucket: 0, why: 'Something a user does.' },
          { text: 'A match within 10 seconds', bucket: 1, why: 'How fast.' },
          { text: 'Drivers can accept or decline', bucket: 0, why: 'A feature.' },
          { text: 'Works in 300 cities', bucket: 1, why: 'That is about scale.' },
          { text: 'Riders see the driver on a map', bucket: 0, why: 'A feature.' },
        ],
        explain: 'What, then how well.',
      },
      {
        id: 's14-6-3',
        type: 'mcq',
        prompt: 'You hear "design a chat app". What comes first?',
        options: [
          { text: 'Ask what it must do' },
          { text: 'Draw the servers', why: 'Boxes before requirements may solve the wrong problem.' },
          { text: 'Pick a database', why: 'Too early: nothing is known about the data yet.' },
        ],
        answer: 0,
        explain: 'Users, core features, scale.',
      },
      {
        id: 's14-6-4',
        type: 'match-pairs',
        prompt: 'Match each problem to its deep dive.',
        pairs: [
          { left: 'News feed', right: 'fan-out to followers', why: 'The hard part of feeds.' },
          { left: 'URL shortener', right: 'unique short codes', why: 'The hard part of shorteners.' },
          { left: 'Chat app', right: 'delivery to online users', why: 'The hard part of chat.' },
        ],
        explain: 'Go deep where this problem is different.',
      },
      {
        id: 's14-6-5',
        type: 'scenario',
        prompt: '"Why replicas? Reads can be stale." Your requirements allow a few seconds of lag on profiles.',
        situation: 'Reads are 50 times writes.',
        needs: ['A defence tied to the requirements'],
        options: [
          {
            text: 'Reads dominate; lag is allowed',
            cost: 'A profile edit shows up seconds late elsewhere.',
          },
          {
            text: 'Replicas are standard practice',
            cost: 'Sounds safe.',
            why: 'It answers neither the cost they raised nor your requirements.',
          },
        ],
        answer: 0,
        explain: 'And read your own writes from the leader, so editors see their changes.',
      },
      {
        id: 's14-6-6',
        type: 'mcq',
        prompt: 'The interviewer shows your counter is a single point of failure. What do you say?',
        options: [
          { text: '"Good catch: I\'ll replicate it."' },
          { text: '"It won\'t fail in practice."', why: 'Every component fails eventually.' },
          { text: '"Let\'s talk about the cache."', why: 'Changing the subject leaves the flaw in place.' },
        ],
        answer: 0,
        explain: 'Adjusting for a good reason is a strong signal.',
      },
      {
        id: 's14-6-7',
        type: 'predict-output',
        prompt: 'Minutes left after these steps?',
        code: `spent = [5, 3, 5, 10]
print(35 - sum(spent))`,
        answer: '12',
        typedWrong: [{ answer: '17', why: '5 + 3 + 5 + 10 = 23; 35 − 23 = 12.' }],
        explain: 'Right on plan: 8 for the deep dive, 4 for bottlenecks.',
      },
      {
        id: 's14-6-8',
        type: 'bucket-sort',
        prompt: 'Strong signal or red flag?',
        buckets: ['Strong signal', 'Red flag'],
        items: [
          { text: 'States an assumption and writes it down', bucket: 0, why: 'Keeps moving with a visible basis.' },
          { text: 'Names five databases, no reasons', bucket: 1, why: 'Names without reasons.' },
          { text: 'Says what breaks first at 10×', bucket: 0, why: 'Sees the limits.' },
          { text: 'Silent while drawing for minutes', bucket: 1, why: 'Nothing for the interviewer to assess.' },
          { text: 'Leaves billing out, and says so', bucket: 0, why: 'A scoped design.' },
        ],
        explain: 'Visible reasoning, scoped to the requirements.',
      },
      {
        id: 's14-6-9',
        type: 'mcq',
        prompt: 'The interviewer says "you decide" about the number of users. What do you do?',
        options: [
          { text: 'Assume a number aloud, go on' },
          { text: 'Insist on being given one', why: 'Choosing a sensible number is part of the test.' },
          { text: 'Design for any scale at all', why: 'Without numbers no choice can be justified.' },
        ],
        answer: 0,
        explain: 'Write it down so later choices can refer to it.',
      },
      {
        id: 's14-6-10',
        type: 'mcq',
        prompt: 'What belongs in the last four minutes?',
        options: [
          { text: 'What breaks first, and fixes' },
          { text: 'A brand-new feature', why: 'Too late to design it well.' },
          { text: 'Re-reading the requirements', why: 'Check against them briefly; spend the time on limits.' },
        ],
        answer: 0,
        explain: 'Bottlenecks and trade-offs close the design.',
      },
    ],
  },
];

export const s14: Unit = {
  id: 'S14',
  track: 'system-design',
  title: 'The design interview',
  blurb: 'The seven-step framework, turning a vague prompt into requirements, choosing what to go deep on, defending a trade-off, the common ways candidates fail and pacing 35 minutes. The design walkthroughs are the real practice.',
  prelude: SD_PRELUDE,
  lessons,
  labs: s14Labs,
  library: s14Library,
};
