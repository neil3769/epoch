# Build brief: a System Design track for Epoch

This adds a third learning track to the existing Epoch app. Read `BUILD_BRIEF.md` (the original design), then `PHASE1_PROGRESS.md` (what exists and the conventions already settled), then this file. Everything in the original brief still applies: one new idea per lesson, cards of at most three sentences, an explanation for every wrong option, usable with one thumb at 390 px, content that is verified before it ships. This brief only describes what is new.

Work in phases (section 9), one per session unless told otherwise, and append a dated entry to `PHASE1_PROGRESS.md` at the end of each.

## 1. What the learner wants

The same learner now also wants to learn system design, to the same depth as the AI Engineering track: enough to reason about how large systems are built, to hold a system design interview, and to make sensible architecture decisions in their own AI projects. Their six-month plan includes practice system designs and a "whiteboard an LLM system design in 45 minutes" goal in spring, so this track feeds that directly.

They are starting from little. Assume they have used web apps and written scripts, but have never run a service under load, operated a database, or drawn an architecture diagram.

System design differs from the other two tracks in one way that shapes everything below: most answers are judgements, not outputs. There is rarely one correct design, only choices that fit the stated requirements better or worse. The track must therefore train three things in this order:

1. **The building blocks**: what a cache, a load balancer, a replica, a queue each do, and what breaks when it is missing or misused.
2. **The numbers**: rough capacity arithmetic, so a design is sized by calculation and not by feeling.
3. **The decisions**: given requirements, choose between options and say what the choice costs.

A learner who can recite what a message queue is but cannot say when not to use one has not learned system design. Favour exercises of the form "here is a situation, what would you do and what does it cost".

## 2. Reference site and how to use it

The learner pointed to `https://systemdesign-dojo.vercel.app/#/` as a reference for scope. It covers about 55 concepts in three groups (foundations, high-level design, low-level design), a bank of classic design problems worked through a fixed step-by-step framework, a trade-off browser, case studies of real incidents, estimation practice and flashcards.

Use it only as a checklist of topics so nothing important is left out. Do not copy its text, problem write-ups, diagrams, names or visual design. All lesson content is written fresh in Epoch's own voice and format, and broken down much smaller than that site's concept pages: one idea per four-minute lesson.

## 3. How it fits into the app

- A third track, `system-design`, with unit ids `S1` to `S14`. Extend the track enum and the unit id pattern in `content/schema.ts` and the catalogue in `content/index.ts`.
- The home screen gets a "System Design" tab beside Foundations and AI Engineering, with Library after it. Four labels must fit at 390 px without truncation or sideways scrolling of the page; shorten labels or restyle the tab bar if needed and check it on a 393 px phone, an 800 px tablet and desktop, in light and dark.
- Lessons, review queue, streak, XP, daily goal, test-out checkpoints, labs, Library pages, GitHub sync and export all work for the new track with no special cases. New progress records must merge the same way existing ones do.
- "Continue where I left off" keeps resuming whichever track was used last.
- This track has no calendar tie to the learner's plan, so no "this week" marker.

## 4. New exercise types

The existing ten types are built around Python snippets. Keep using them where code is involved (labs, and lessons on algorithms such as hashing or rate limiting). Add these for design content, each registered in the exercise registry, each with per-option or per-item explanations as usual:

| Type | What the learner does | How it is verified |
|---|---|---|
| `estimate` | Answers a sizing question ("how many writes per second?") by picking an order of magnitude or entering a number. Correct if within a stated factor of the reference. Shows the worked arithmetic afterwards. | The reference value is computed by a Python expression stored with the exercise; the verifier evaluates it and checks the stated answer and tolerance. |
| `order-steps` | Puts prose steps in order, such as the path of a request or the stages of a failover. Unlike `order-lines` there is no code to run. | Schema only; the order goes on the hand-verification list. Avoid sets where two orders are defensible. |
| `bucket-sort` | Sorts five to eight items into two or three buckets, for example requirements that favour SQL versus a key-value store. | Schema: every item has exactly one bucket and a reason. |
| `scenario` | Reads a short situation with concrete requirements and picks the best design choice from two to four options. Every option, including the right one, states what it costs. | Schema plus the existing rule that the correct option is not recognisably the longest. Hand-verified. |
| `diagram` | Acts on an architecture diagram (section 5): tap the single point of failure, tap the bottleneck for a described load, tap the nodes a request passes through in order, or choose which component belongs in an empty slot. | Structural: referenced nodes exist, a path goal is a real path in the graph, exactly one answer satisfies the goal. |

Add `estimate`, `order-steps`, `bucket-sort`, `scenario` and `diagram` to the list of producing types only where the learner constructs something (`estimate`, `order-steps`, `diagram`). The rule that at least half of a lesson's exercises are producing types stays.

## 5. Architecture diagrams

Diagrams are to this track what the matrix figures are to Foundations. Build one diagram component driven by data: a list of nodes (client, DNS, CDN, load balancer, service, cache, database, replica, queue, worker, object store, search index, model server, vector store, external API) and directed edges, with optional labels on edges such as "read" or "async".

- Lay nodes out automatically in layers, top to bottom, so content authors never write coordinates. It must stay readable at 390 px: at most about eight nodes visible, each a tappable target of at least 44 px, labels never clipped. Larger designs are shown one region at a time or collapsed into groups.
- Each node type has its own simple icon and shape, drawn in the app's own style, working in light and dark.
- Diagrams can appear on cards, in exercises, in walkthroughs and on Library pages.
- A diagram can be shown as a sequence of stages, each adding or changing nodes, so a lesson can show a design growing: one server, then a load balancer and two servers, then a cache, then a read replica.

## 6. Interactive figures

Build these as the units that need them come up. Each is a small simulator the learner manipulates to reach a goal, on the pattern of the existing figures.

- **Load balancer.** Requests arrive and are routed by a chosen algorithm (round robin, least connections, hashing). Kill a server and watch health checks take it out. Goal examples: find the algorithm that keeps one user on one server.
- **Cache.** A stream of reads against a small cache with a chosen size, eviction policy and TTL; shows hits, misses and stale reads. Goal examples: reach a target hit rate, or produce a stale read and then fix it.
- **Consistent hashing ring.** Keys and nodes on a ring; add or remove a node and see which keys move, compared with plain modulo hashing where nearly all move.
- **Replication and quorum.** N replicas, sliders for W and R, a write followed by a read, with adjustable lag and a node that can be failed. Shows when a read can be stale and why W + R > N prevents it.
- **Rate limiter.** A token bucket filling and draining against a burst of requests; compare with a fixed window and its boundary burst.
- **Queue and workers.** Producers, a queue, workers with a failure rate; shows backlog growth, retries, duplicates and the dead-letter queue. Goal examples: clear a backlog without double-processing.
- **Partition.** Two halves of a system lose contact; the learner chooses to keep accepting writes or to refuse them and sees the consequence of each. This is the CAP theorem made concrete.
- **Sharding.** Rows distributed by a chosen shard key; a skewed key produces a hot shard.

## 7. Code labs for system design

Many building blocks are small algorithms that run perfectly well in Pyodide, and writing them is the fastest way to stop them being abstract. Every unit has one to three labs, following the existing lab format (four to six steps, three hint levels, last lab of the unit from empty functions, saved code).

Lab topics, as a guide: a round-robin and a least-connections balancer; an LRU cache with TTL; cache-aside around a slow fake database; a base-62 short-code generator and collision handling; a B-tree-free demonstration of why an index helps (sorted list plus binary search versus a scan); a consistent hashing ring with virtual nodes; quorum reads and writes over simulated replicas; a token-bucket rate limiter; a work queue with retries, idempotency keys and a dead-letter list; a circuit breaker; an inverted index with ranked search; a Bloom filter; a time-ordered unique id generator; a geohash-style grid lookup; a vector clock.

Extend the simulated-services module `src/python/epoch_sim.py` with what these need, all deterministic so the verifier can run them:

- a controllable clock (advance time by hand, no real sleeping), used by TTL, rate limiting and timeouts;
- a slow, countable fake database and a fake network call that fails on a schedule;
- simulated replicas that can lag or be marked down;
- a small deterministic scheduler that interleaves tasks step by step, so race conditions and locking can be shown without real threads (Pyodide has none).

Each lab states what differs from the real system it imitates.

## 8. Design walkthroughs

This is the new content kind that makes the track add up to an ability. A walkthrough takes one classic design problem through a fixed framework, with the learner making the decisions at every step and the diagram growing as they go. It is the non-code counterpart of a lab.

The framework, used identically every time so it becomes habit:

1. **Requirements**: choose which features are in scope and which non-functional requirements matter most.
2. **Estimation**: size traffic, storage and bandwidth.
3. **API**: pick the endpoints and their shapes.
4. **Data model**: choose the store and the keys.
5. **High-level design**: assemble the diagram from components.
6. **Deep dive**: resolve the one or two hard parts of this particular problem.
7. **Bottlenecks and trade-offs**: find what fails first at ten times the load and say what you would change.

Each step is two to four exercises drawn from the types above, plus a short "what a strong answer says here" note shown after the step. A walkthrough takes 15 to 20 minutes and can be left and resumed at any step. It unlocks when the units it depends on are finished, and its completion counts toward the daily goal. Finishing it adds its final diagram and decisions to the Library.

A second pass, "from a blank page", opens a week after the first: the same problem with no options offered for steps 1 and 5 (the learner lists requirements and picks components unprompted from the full palette), followed by a self-check against the reference. This is as close as a static app gets to a mock interview. Be plain in the app that a real interview also tests talking through the design aloud, and suggest the learner do the blank-page pass speaking out loud with a 35-minute timer, which the app provides.

Walkthroughs to write, in roughly this order: URL shortener; rate limiter; notification service; news feed; key-value store; web crawler; search autocomplete; chat system; file sync; video streaming; payment system; nearby search; assistant over company documents (RAG) at scale; a model gateway that routes, caches and limits LLM calls.

The learner's plan also names four AI system designs for interview practice (a support chatbot over 10,000 documents, a document-extraction pipeline, a data-analysis agent, a code-review assistant). Unit E11 in the original brief covers those. Build them with this same walkthrough player and list them in both tracks, so they are written once.

## 9. Curriculum

About 130 lessons in 14 units, plus 14 walkthroughs and the labs. Each unit ends with a checkpoint lesson and a Library page, as elsewhere.

| # | Unit | Lessons | What the learner can do afterwards |
|---|---|---|---|
| S1 | How a request travels | 9 | Trace a request from browser to database and back: DNS, TCP and TLS in outline, HTTP methods and status codes, client and server roles; tell latency from throughput; read p50 and p99; tell a process from a thread. |
| S2 | Back-of-envelope estimation | 8 | Powers of two and ten; turn daily users into requests per second; size storage and bandwidth; peak versus average; what "three nines" allows in downtime; know the rough cost of a memory read, a disk read and a cross-region round trip. |
| S3 | Scaling out | 8 | Vertical versus horizontal scaling; why stateless servers scale; load-balancing algorithms; health checks; spotting a single point of failure; autoscaling and its lag. |
| S4 | Caching and CDNs | 10 | Where caches sit; cache-aside, write-through and write-back; TTL; eviction policies; invalidation; stampedes and how to prevent them; what a CDN serves and how it is purged. |
| S5 | Databases: modelling and queries | 11 | Relational, key-value, document, wide-column and graph stores and what each is good at; schema and keys; indexes and what they cost on writes; normalised versus denormalised; transactions, ACID and isolation levels through concrete anomalies. |
| S6 | Databases: replication and partitioning | 11 | Leader and follower replication; lag and read-your-writes; failover and split brain; partitioning by range and by hash; choosing a shard key; hot keys; consistent hashing. |
| S7 | Consistency and coordination | 10 | CAP as a choice made during a partition; the latency side of the same trade; strong, eventual and causal consistency by example; quorums; logical clocks; what consensus provides and when it is needed, at the level of intuition; leader election and distributed locks. |
| S8 | Queues, streams and async work | 10 | Queue versus publish-subscribe versus log; at-most-once, at-least-once and why "exactly once" means idempotent handling; retries and dead-letter queues; backpressure; ordering; the outbox pattern; sagas for multi-step work. |
| S9 | APIs and service boundaries | 10 | REST, gRPC and GraphQL and where each fits; pagination; versioning; idempotency keys; rate-limiting algorithms; the API gateway; monolith versus microservices and the cost of each; service discovery. |
| S10 | Reliability and operations | 10 | Timeouts, retries with jitter, circuit breakers, bulkheads, graceful degradation; redundancy and multi-region; safe deployment (rolling, blue-green, canary, feature flags); metrics, logs, traces, SLOs and error budgets; authentication versus authorisation, sessions versus tokens. |
| S11 | Specialised building blocks | 11 | Inverted indexes and search; geospatial indexing; real-time delivery (polling, server-sent events, WebSockets); object storage and media pipelines; unique id generation; Bloom filters and other approximate structures; batch versus stream processing; analytical versus transactional stores. |
| S12 | Designing AI systems | 9 | Serving a model: batching, streaming tokens, queueing for scarce GPUs; vector indexes and approximate search at scale; a retrieval system's ingestion and query paths; exact and semantic caching; a model gateway with routing and fallback; a cost model per request; feedback and evaluation pipelines. Builds on E6 and E9; link to them and do not re-teach their content. |
| S13 | Low-level design in Python | 10 | Model a problem as classes; composition versus inheritance; the SOLID principles by refactoring bad examples; the handful of patterns that matter (strategy, observer, factory, adapter, decorator, state); read a class diagram; shared state, locks and race conditions. Uses Python, not Java, because that is the learner's language. |
| S14 | The design interview | 6 | The seven-step framework; turning a vague prompt into requirements; choosing what to go deep on; defending a trade-off; the common ways candidates fail; pacing 35 minutes. The walkthroughs are the real practice for this unit. |

### Teaching pattern for a building-block unit

Use the pattern that worked for matrix multiplication, adapted: start from a system without the component and the concrete pain that results; introduce the component as the fix; let the learner operate it in a figure; give the rules of thumb; show how it fails and what it costs; then decide when to use it in scenarios; then build a small one in a lab.

Example for S4, caching: a page that takes 800 ms because of one slow query → put the result in memory → cache figure: watch hits and misses → cache-aside in code → the data changes and the cache is now wrong: TTL and invalidation → the cache is full: eviction → the popular key expires and a thousand requests hit the database at once: stampede → CDN as a cache close to the user → scenarios: what to cache and what never to cache → checkpoint.

### Real incidents

Where a well-documented public incident or engineering write-up illustrates a unit's idea, include one lesson that tells it and asks the learner to diagnose and prevent it. Only use cases you can verify against a primary source (the company's own post-mortem or engineering blog) at the time of writing, link the source on the unit's Library page, and state facts and figures only as the source gives them. One per unit at most; leave it out if no source can be confirmed.

### Numbers page

Add one Library page that is available from the start, not unlocked: powers of two, seconds in a day, typical latencies by order of magnitude, availability nines and their downtime, and typical sizes (a tweet-sized record, an image, a minute of video). Present these as rough orders of magnitude, cite where they come from, and use the same values consistently in every `estimate` exercise.

## 10. Verification

Extend `npm run verify-content` so the build still fails on any error:

- Schema validation for the new exercise types, diagrams and walkthroughs, including the structural checks in sections 4 and 5.
- Every `estimate` reference value is recomputed from its stored expression, and every number it uses that appears on the Numbers page must match that page.
- Lab steps and any Python snippets are executed as now.
- Everything not checked by execution goes on the hand-verification list in `reports/hand-verification.md` with the source it was checked against. For this track that list will be long, so take it seriously: check current primary documentation for any claim about how a specific product behaves (for example a particular database's default isolation level or a queue's delivery guarantee), and prefer teaching the general mechanism over product specifics that change.
- Review each unit for the failure this subject invites: questions with two defensible answers. If a strong engineer could reasonably argue for a "wrong" option, rewrite the scenario with requirements that settle it, or change the exercise to ask for the cost of each option.

## 11. Phases

Each phase ends as in the original brief: build passing, verification passing, tests passing, checked in the browser at phone, tablet and desktop widths in light and dark, and a short report of what was built, what was verified and what was not.

This track must not push back the dated work already scheduled in the original brief (unit E7 by 20 December, F9 and exam mode before January). When a session could do either, do the dated work first.

**SD-1: plumbing and the first two units.** The third track in schema, catalogue, home tabs, progress and sync; the five new exercise types; the diagram component; verifier extensions; the Numbers page. Content: S1 and S2 complete with labs and Library pages. Done when the learner can open the System Design tab on their phone, finish S1 and S2, and every new exercise type has been used.

**SD-2: scaling and caching.** S3 and S4, with the load balancer and cache figures and the clock and fake-database additions to the simulated services.

**SD-3: the walkthrough player.** S5, then the walkthrough player with resume, the blank-page pass and its timer, and the first walkthrough (URL shortener). Done when that walkthrough can be completed, resumed mid-way on another device through sync, and reviewed in the Library.

**SD-4 onward: one or two units per session**, in order S6 to S14, each with its figures, labs, Library page and the walkthroughs that unlock at that point. After each unit, re-read it as the learner would and fix any card over three sentences, any exercise answerable by pattern-matching, and any lesson that introduces two ideas.

## 12. Quality bar for this track

- Every scenario states enough requirements that the right answer follows from them.
- Every design choice shown as correct also names its cost.
- No lesson is only definitions: each contains at least one diagram or figure interaction and at least one decision.
- Diagrams are legible and tappable at 390 px without zooming.
- After a walkthrough's blank-page pass, the learner can say out loud, in order, what they would do in the first five minutes of that interview question.
