# Phase 1 checkpoint (resume from here after a session reset)

Read BUILD_BRIEF.md, then this file. Do not redo items marked done.

## Decisions already made
- Pyodide pinned to **314.0.8** (latest stable on 2026-11-14; bugfix release incl. a Safari iOS fix).
  CDN: `https://cdn.jsdelivr.net/pyodide/v314.0.8/full/`. 314.x needs a **module worker**
  (classic `importScripts` workers are no longer supported). numpy 2.4.6, pydantic 2.12.5, pytest 9.0.2 available.
- Node verification uses npm `pyodide@314.0.8`; packages fetched from CDN.
- Plan doc read: week 2 = 9-15 Nov (async httpx). E2 first three lessons = coroutines/await,
  sequential awaits + asyncio.sleep, gather. No personal details from the plan go in the repo.
- Content lives in `content/` (TS files, zod schema). Unit prelude (e.g. `import numpy as np`) is hidden and
  prepended when running. Verifier rewrites a top-level `asyncio.run(x)` line to `await x` (Pyodide has no blocking run).
- Order-lines exercises: verifier runs every permutation of movable lines and requires a unique correct output.
- Progress data: completed set + activity log (XP/streak derived) + review map + labCode; merge-friendly.
- No git commit unless the user asks (git init only).

## Status: PHASE 1 COMPLETE (2026-11-14), not committed (user to approve)
- build, verify-content (158 ex, 155 executed, 3 hand-checked in reports/hand-verification.md), 21 unit tests: all pass
- browser checked at 390x844 and 393x852 (iPhone 15) light + dark, 800px tablet via DOM metrics; all 10 exercise types,
  3 figures, completion screen, streak/XP/goal, Pyodide lazy load + timeout + offline caching (incl. first visit)
- added on user request: light/dark toggle (src/lib/theme.ts, sun/moon chip on home)
- not verified: real iPhone/Android device, true offline mode (browser tool cannot go offline), install to home screen
- next: Phase 2 (deploy to GitHub Pages) needs the user's GitHub account; ask before creating repo or pushing

## Phase 2 (deploy), started 2026-11-14
- Phase 1 committed as 496fb8a. Workflow: .github/workflows/deploy.yml (checkout@v7, setup-node@v7, configure-pages@v6,
  upload-pages-artifact@v5, deploy-pages@v5; runs npm test + npm run build).
- User chose: public repo neil3769/epoch, keep Gmail as commit author. Site: https://neil3769.github.io/epoch/
- DONE: repo https://github.com/neil3769/epoch created and pushed (main @ 64da30e), Pages source = GitHub Actions,
  first deploy run 43638445794 succeeded; live site verified (sub-path, SW scope /epoch/, manifest, icons).
- Next: Phase 3 (review system, settings, GitHub sync, code labs, Library, F3 labs + summary).

## Phase 3a (retention + sync), 2026-11-14 — DONE
- progress.ts: Leitner boxes 1-5 (1,3,7,14,30 days), box 6 = retired; streak freezes derived from activity
  (1 per 7 active days, max 2 banked); mergeProgress (union/earliest, union-by-id, newest-wins) + normalizeProgress;
  recordReview / recordLabStep / saveLabCode; onLearnerChange for sync.
- curriculum.ts: findExercise, buildReviewSet (due -> not-yet-due -> padding from finished lessons, no figure/run-code),
  checkpointOf, TEST_OUT = 0.8 (f3-12 has `checkpoint: true`).
- screens: ExerciseSession (shared loop), DoneScreen, LessonPlayer (thin), ReviewPlayer (#/review, #/review/quick),
  Settings (#/settings: goal, theme, sound, GitHub sync, export/import, reminder steps), SyncBadge.
- sync.ts: contents API (X-GitHub-Api-Version 2026-03-10), cache no-store, 409/422 -> pull/merge/retry, fixed error
  messages, token only in localStorage key epoch.sync.v1. Tests: tests/progress.test.ts, tests/sync.test.ts (fake API).
- Browser-checked: quick review flow, connect/pull/push/disconnect/bad-token against an in-page fake API, dark mode.

## Phase 3b (labs, sim, Library), 2026-11-15 — DONE (committed, pushed)
- CodeMirror 6 (pinned: state 6.7.6, view 6.43.15, commands 6.11.1, language 6.13.1, lang-python 6.2.1,
  autocomplete 6.20.4, @lezer/highlight 1.2.5). src/components/CodeEditor.tsx (+ EditorKeys with indent key).
- content/schema.ts: LabSchema, LibraryPageSchema; Unit.labs / Unit.library. content/labs/f3.ts (3 labs, 14 steps),
  content/library/f3.ts. Lab ids f3-lab-1..3; step ids "<lab>#<n>"; review key "lab:<lab>#<n>".
- src/screens/LabPlayer.tsx (lazy chunk): routes #/lab/<id>, #/lab/<id>/again, #/lab/<id>/<n> (single rewrite).
  Drafts per device in localStorage epoch.draft.<step>. Editor keyed by step (fixes a stale-draft bug).
- src/screens/Library.tsx: Library tab on home (3rd tab), search, #/library/<unit>.
- src/python/epoch_sim.py installed to /epoch in worker + verifier; scripts/sim_selftest.py run by verify-content.
- Browser-checked: lab 1 end to end, hints 1-3, error line mapping, rewrite card -> single step -> retired, Library
  unlock/search/page, dark mode, `import epoch_sim` in the app worker. Next: Phase 4 (content: E unit for current plan week).

## Phase 4, unit E5 (Evaluation), 2026-11-16 — DONE
- content/plan.ts: plan weeks (dates + topics only) and UNIT_WEEKS; Home shows "Week N of your plan" on the
  AI Engineering tab and a "This week in your plan" tag on matching units. Checkpoint done screen shows the
  unit's Library `forReal` ("To do this for real").
- content/units/e5.ts (11 lessons, 89 exercises, prelude `import json`), content/labs/e5.ts (3 labs: eval harness,
  judge with sim.FakeLLM, before/after + leaks from empty functions), content/library/e5.ts.
- MCQ option lengths rebalanced (right answer not the longest by >1.2x). Hand checks in reports/hand-verification.md.
- Gotcha: in this shell, bash heredocs turn `\` into `\`; write helper Python files with the Write tool instead.
- Next unit (user asked to continue): E3 Calling an LLM (week 2). Check current Anthropic SDK / Pydantic docs first.

## Phase 4, unit E3 (Calling an LLM), 2026-11-16 — DONE
- Docs checked (Messages API, tool use, pricing format, structured outputs, Pydantic v2, SDK errors/retries);
  summary in reports/hand-verification.md. epoch_sim: Message.type, usage cache fields.
- App worker now runs `loadPackagesFromImports` before each run (pydantic loads on first use, cached by the SW);
  verifier preloads numpy + pydantic.
- content/units/e3.ts (10 lessons, prelude `import json` + `import epoch_sim as sim`), labs/e3.ts (logged call,
  schema-valid repair loop, tool loop from empty functions), library/e3.ts. MCQ lengths balanced.
- Fixed: preview route past the last exercise crashed the app; now shows a message.
- Next per brief order: remaining past-week units (E1, rest of E2, E4 for week 4), then F1, F2, F4...

## Phase 4, unit E4 (Prompts and context), 2026-11-16 — DONE
- Sources: provider prompting best practices + "Effective context engineering" article (summary in hand-verification).
- content/units/e4.ts (7 lessons), labs/e4.ts (prompt builder; fit-the-context from empty functions), library/e4.ts.
- verify-content now fails an MCQ whose right option is >1.25x longer than every wrong one.
- User asked for 3-4 more units after E4: plan E1, rest of E2 (lessons 4-8), rest of F1 (lessons 4-12), F2.

## Phase 4, unit E1 (A real Python project), 2026-11-16 — DONE
- Sources: uv, packaging guide, pytest, ruff, pre-commit, typing docs (hand-verification has the table).
- content/units/e1.ts (8 lessons; tomllib + pytest executed in Pyodide; verifier preloads pytest),
  labs/e1.ts (tests that must fail on a broken function; pyproject checker from empty functions), library/e1.ts.
- Next: rest of E2 (lessons 4-8 + labs + library), rest of F1 (lessons 4-12), F2.

## Phase 4, unit E2 completed (lessons 4-8, labs, Library), 2026-11-16 — DONE
- content/units/e2-more.ts (timeouts, async client, retry/backoff, mock transport, checkpoint), labs/e2.ts, library/e2.ts.
- epoch_sim: MockTransport, Request, URL, Response(json=); E2 prelude now imports epoch_sim as sim.
- verify-content: last-lab empty-function rule accepts `async def`.
- Next: F1 lessons 4-12 (+ labs, Library), then F2.

## Phase 4, unit F1 completed (lessons 4-12, labs, Library), 2026-11-16 — DONE
- content/units/f1-more.ts (unpacking/zip/enumerate, defaults/keywords, *args/**kwargs, classes, inheritance/super,
  imports, type hints, tracebacks, checkpoint), labs/f1.ts (dataset class; helpers from empty functions), library/f1.ts.
- Next: F2 Vectors (8 lessons + labs + Library).

## Phase 4, unit F2 (Vectors), 2026-11-16 — DONE
- content/units/f2.ts (8 lessons), labs/f2.ts (vectors by hand; similarity search from empty functions), library/f2.ts.
- Fixed: number-grid crashed for a scalar expression like `3 * v` (display and wrong-answer explanation); test added.
- Note: NumPy in Pyodide (wasm) cannot raise floating-point errors (errstate / warnings-as-errors do nothing).
- Written units now: F1, F2, F3, E1, E2, E3, E4, E5. Next per brief: F4 (NumPy), then E6 (week 5, 30 Nov), F5...

## Phase 4, units F4 (NumPy) and E6 (Retrieval), 2026-11-16 — DONE
- New figure: broadcasting visualiser (src/figures/BroadcastFigure.tsx, src/lib/broadcast.ts; schema kind
  `broadcast` with A, B, optional oneD/op/goal; verifier checks shapes and goal; unit tests vs NumPy rules).
- content/units/f4.ts + f4-more.ts (14 lessons), labs/f4.ts (grade book; vectorised pipeline from empty
  functions), library/f4.ts. Integer dtype names kept out of printed answers (Pyodide is wasm32: int32).
- content/units/e6.ts + e6-more.ts (10 lessons: planned count raised from 9 to give "which stage failed?"
  its own lesson before the checkpoint), labs/e6.ts (chunk + keyword/vector/hybrid search; answer-or-refuse
  pipeline with citation check and hit rate from empty functions), library/e6.ts.
- Browser: 196 F4/E6 exercises swept at 390 px (no overflow); broadcast figure stretch/tap checked;
  E6 lab 2 step 3 passed in the app.
- Written units now: F1-F4, E1-E6. Next per brief: E7 Agents (weeks 5-7, by 20 Dec), F5..F11 (F9 before
  January), exam mode before January.

## Phase 4, units E7, F5, F6, F7, 2026-11-16 — DONE
- E7 Agents (10 lessons): unit prelude defines ask(c, msgs) and tool_turns(r) (introduced in lesson 3).
  Labs: sturdier loop (error results, repeat stop, step limit, error count); guarded agent from empty
  functions (cost, tripwire, allowlist, step and spend limits). MCP checked against the 2026-07-28 spec.
- New figure: gradient descent on a curve (src/figures/DescentFigure.tsx, src/lib/descent.ts; schema kind
  `descent`; verifier checks each goal is reachable with some slider rate and not at the start rate).
- F5 Change and gradients (9), F6 Probability and loss (9), F7 ML from scratch (10), each with two labs
  (the last from empty functions) and a Library page.
- Browser: 312 new exercises swept at 390 px (no overflow); descent figure goal, overshoot and reset
  checked; E7 lab 2 step 1 passed in the app.
- Written units now: F1-F7, E1-E7. Next per brief: F8 Neural networks (neuron/layer figure), F9 PyTorch
  (before January), exam mode (before January), E11 Interview practice (January), then F10, F11, E8-E10.

## Phase 4, units F8 and F9, 2026-11-16 — DONE (exam mode next)
- New figure: neuron and layer (src/figures/NeuronFigure.tsx, src/lib/neuron.ts; schema kind `neuron`:
  inputs, W with one row per neuron, b, activation, optional W @ x + b matrix view, goals "tap a neuron"
  or "nudge a weight until a neuron outputs N"; verifier checks reachability; unit tests).
- F8 Neural networks (12 lessons; weights stored PyTorch-style, layer = X @ W.T + b). Labs: forward pass
  with scaffolding; two-layer network learning |x| from empty functions (backward checked against
  nudging in the tests). Library page.
- F9 PyTorch (14 lessons; 12-14 rebuild the five-line loop with less help each time, ending at a blank
  editor in the checkpoint). Labs: first model with scaffolding; classifier with DataLoader from empty
  functions. Library page.
- PyTorch in the app: src/python/epoch_torch.py, a NumPy stand-in with PyTorch's interface (tensors,
  autograd, nn, optim, utils.data), loaded as `torch` by src/python/torch_facade.py in the worker and
  the verifier. verify-content records every torch run (reports/torch-runs.json, not committed);
  `npm run verify-torch` replays them with real PyTorch (local 2.7.1): 383 runs, 0 differences
  (reports/torch-crosscheck.md). Wrong variants are only required to stay wrong.
- Schema: run-code maxLines now 1-10 (whole-loop exercises); order-lines up to 16 lines.
- Fixed an old control character in verify-content's lab-starter regex (/\bpass$/).
- Browser at 390 px: 238 F8/F9 screens, no overflow (the symbol-key row scrolls by design); both neuron
  figure goals checked; an F9 run-code exercise graded correct in the app's worker; labs open cleanly.
- Written units now: F1-F9, E1-E7. Next: exam mode (before January), then E11 (January), F10, F11, E8-E10,
  then the System Design track.

## Phase 4, exam mode, 2026-11-16 — DONE
- Settings → Exams: a switch and a date range (default 7 Jan to 28 Feb 2027, the plan's exam weeks).
  Stored in settings.exam, so sync and import merge it like the other settings (newest wins); old
  progress files get the default (off).
- While on and inside the dates: the daily goal is one review (quick or full; the ring shows 0/1), any
  review keeps the streak, and Home, Continue, "next lesson" and lab rewrites offer only F9, E5 and
  E11 (the plan's PyTorch-loop, leakage-and-metrics and interview-practice weeks), plus review. Home
  says which units are paused and when they return; the done screen shows the review goal.
- Tests: active range, review goal, streak on one review a day, allowed units, Continue after a paused
  unit, lab rewrites, import defaults. Checked in the browser at 390 px (settings, home, both tabs).
- Next: E11 Interview practice (needed in January), then F10, F11, E8-E10, then System Design.

## Phase 4, unit E11 (Interview practice), 2026-11-16 — DONE
- 12 lessons from the plan's interview-prep list: RAG vs fine-tuning vs long context, evaluating an LLM
  app, hallucinations, latency and cost, prompt injection, when not to use an agent; the four practice
  designs (support chatbot over 10,000 docs, document extraction, data-analysis agent, code-review
  assistant), built by ordering stages written with the prelude's step(name, *inputs) so data flow fixes
  the order; coding patterns; checkpoint. Numbers in every answer (cost, p95, compounding reliability).
- Labs: interview numbers (scaffolded); coding patterns from empty functions (backoff, chunking with
  overlap, batching, cosine top-k, JSON from a reply, retry wrapper). Library page.
- Browser at 390 px: 112 E11 screens and both labs, no overflow.
- Written units now: F1-F9, E1-E7, E11. Next: F10 Text as numbers, F11 Attention and transformers,
  E8-E10 (weeks 8-13, March), then the System Design track.

## Phase 4, unit E8 (Shipping a service), 2026-11-16 — DONE
- 12 lessons: FastAPI endpoints, request/response models, status codes, API tests, settings and
  secrets, reading a Dockerfile, layers and caching, docker compose, GitHub Actions, a CI pipeline,
  deploying to a managed host, checkpoint. Versions checked against current docs (uv 0.13.8,
  actions/checkout@v7, astral-sh/setup-uv@v9, docker/build-push-action@v7, compose.yaml).
- FastAPI 0.136, Pydantic and PyYAML run in Pyodide: endpoints are executed through httpx's
  ASGITransport (prelude `send`), with `async def` handlers (no threads in Pyodide). Dockerfiles and
  workflows are read as strings/YAML; `rebuilt()` models Docker's layer cache. verify-content now
  preloads fastapi, httpx and pyyaml.
- Labs: an /ask endpoint with tests (scaffolded); ready-to-ship pieces from empty functions (settings,
  app factory, smoke test, Dockerfile checker, CI commands, image tags). Library page.
- Browser at 390 px: 113 E8 screens and labs, no overflow; a FastAPI run-code exercise graded correct
  in the app's worker.
- Written units now: F1-F9, E1-E8, E11. Next: E9 (weeks 11-12), E10 (week 13), F10, F11, then System
  Design.

## Phase 4, unit E9 (Cost, latency, observability), 2026-11-16 — DONE
- 8 lessons: cost per request, p50 and p95, traces and spans, what to log, routing to a small model
  first, caching, before/after tables, checkpoint. All executed against sim.LOGS / sim.PRICES / FakeLLM;
  the prelude adds span() (a tracer on the virtual clock), chat(llm, q), and LOGS/PRICES short names.
- Labs: read the logs (scaffolded); cache, routed call with a JSON check, traced request and a
  before/after report from empty functions. Library page.
- Browser at 390 px: 76 E9 screens and labs, no overflow.
- Written units now: F1-F9, E1-E9, E11. Next: E10 Safety (week 13), F10, F11, then System Design.

## Phase 4, unit E10 (Safety), 2026-11-17 — DONE
- 7 lessons: the OWASP risk list (scenario → risk), prompt injection, data leakage, excessive agency,
  guardrails on output, provider fallback, checkpoint. Risk names follow the OWASP Top 10 for LLM
  Applications; the official site still shows the 2025 edition and a 2026 reordering is reported by
  secondary sources, so no exercise asks for a rank number and the Library page says to check
  genai.owasp.org.
- The prelude's `gullible()` is a toy FakeLLM that obeys the last "Instruction: say ..." it reads, so
  direct/indirect injection and the limits of fencing and phrase filters actually run. Redaction,
  allowlists, approval rules, Pydantic validation, html.escape, per-user limits and fallback all run.
- Labs: guard the way in (filter, redaction, fencing, per-user rows; scaffolded); guard the way out
  (tool runner with allowlist and approval, validated refund, safe render, fallback; empty functions).
- Browser at 390 px: 66 E10 screens and labs, no overflow.
- Written units now: F1-F9, E1-E11 (engineering track complete). Next: F10, F11, then System Design.

## Phase 4, unit F10 (Text as numbers), 2026-11-17 — DONE
- 7 lessons: tokens, vocabulary and ids, subword tokens (one BPE merge step by hand, greedy longest
  match), embeddings as a lookup table (= one-hot @ table), cosine similarity, similarity search
  (normalise rows, one matrix-vector product, argsort top k), checkpoint. Prelude: a tiny VOCAB/IDS,
  merge/pieces helpers, a hand-made 6×3 embedding table E (animal, fruit, vehicle), N, cos.
- Labs: a word-level tokenizer (scaffolded); search by meaning from empty functions (words,
  sentence vector, safe cosine, ranked search).
- App fix: predict-shape exercises now show "Shape of <target>" under the code (the target
  expression was never displayed before, in any unit), and hide an empty code block.
- Browser at 390 px: 66 F10 screens and labs, no overflow.
- Written units now: F1-F10, E1-E11. Next: F11 Attention and transformers, then System Design.

## Phase 4, unit F11 (Attention and transformers), 2026-11-17 — DONE
- 12 lessons: a weighted average of vectors, scores from dot products (Q @ K.T), softmax and the √d
  scale, attention in one line, self-attention (Wq, Wk, Wv), the causal mask, multiple heads,
  position information (permutation test executed with and without positions), the transformer
  block (norm, residuals, per-token MLP), next-token scores, generating text (greedy, temperature),
  checkpoint. Prelude: softmax, causal, attention, norm, and a stand-in next_logits lookup over a
  tiny TOK vocabulary for the generation loop (stated plainly as not a transformer).
- Labs: attention by hand (scaffolded); a tiny untrained GPT forward pass end to end plus a greedy
  generation loop, each from an empty function.
- Browser at 390 px: 107 F11 screens and labs, no overflow.
- Written units now: F1-F11 and E1-E11 — both tracks complete. Next: the System Design track.

## System Design SD-1: plumbing, S1 and S2, 2026-11-17 — DONE
- Third track `system-design` (unit ids S1-S14) in the schema and catalogue (all 14 units planned);
  home tabs Foundations / AI Eng / Systems / Library (full names in aria-label and title) fit at
  390 px; checked at 390 px, 800 px and desktop, light and dark. Progress, review, sync and export
  need no special cases (records are keyed by lesson and exercise id as before).
- Five new exercise types, registered and graded: `estimate` (options or typed with k/M/B, within a
  factor; shows the worked arithmetic), `order-steps`, `bucket-sort`, `scenario` (every option shows
  its cost), `diagram` (tap one node, tap a path in order, or fill an empty slot).
- Diagram component (src/figures/Diagram.tsx + src/lib/diagram.ts): data-driven nodes and edges with
  automatic top-to-bottom layering (no coordinates), return arrows on the right, an icon and shape per
  kind (15 kinds), dashed/labelled edges, stages that grow a design step by step, light and dark.
  Nodes are at least 44 px tall at 390 px; at most 3 nodes per layer and 6 layers (verified).
- Numbers page (content/numbers.ts): open from the start in the Library; the same values are exposed
  to Python by name, and the verifier runs them before every estimate expression and rejects time
  and latency constants written as literals. Sources listed on the page.
- verify-content: structural checks for all new types and diagrams (paths follow edges, slot kind
  matches, every wrong node/option explained, right scenario option not the longest), estimate
  reference values recomputed in Pyodide; scenario/order/bucket items go on the hand-check list.
  Card and Library pages accept a diagram; Library pages accept sources.
- S1 How a request travels (9 lessons) and S2 Back-of-envelope estimation (8 lessons), each with two
  labs (the second from empty functions) and a Library page. Every new type and all three diagram
  goal kinds are used. 61 judgement items hand-verified (reports/hand-verification.md).
- Fixed in passing: the Library route now also opens #/library/numbers.
- Browser at 390 px: 176 S1/S2 screens, labs and the Numbers page: no overflow, no clipped node
  labels, every tappable node ≥ 44 px. Tap, path, estimate, order-steps and bucket-sort graded in the
  app. Tests: 77 pass (new tests for estimate parsing, diagram layout, paths and problems).
- Not done yet from SD-1's brief: nothing; walkthroughs start in SD-3. Next: SD-2 (S3 Scaling out,
  S4 Caching and CDNs, with the load-balancer and cache figures and simulator additions).


## System Design SD-2: S3 Scaling out and S4 Caching and CDNs, 2026-11-17 — DONE
- Two new figures, both data-driven and verified against every state their controls can reach:
  `balancer` (2-4 servers; round robin, least connections or hash; tap servers down; health checks;
  goals: every user sticky, a maximum per-server peak, no failures with a server down) and `cache`
  (reads one per second; size, LRU/FIFO and TTL controls; changes to the source show stale hits;
  goals: hit rate, no stale reads with a minimum hit rate, or produce a stale read). Shared logic in
  src/lib/lbsim.ts and src/lib/cachesim.ts, unit-tested.
- Simulated services: `sim.FakeDB` (slow, countable, on the virtual clock) for cache labs; the
  System Design prelude now imports `epoch_sim as sim`.
- S3 Scaling out (8 lessons: bigger or more, stateless servers, load-balancing algorithms, health
  checks, single points of failure, autoscaling and its lag, keeping a user on one server,
  checkpoint) with labs Balancers and Scaling decisions; S4 Caching and CDNs (10 lessons: why cache,
  cache-aside, write-through and write-back, TTL and stale data, invalidation, eviction, stampedes,
  CDNs, what to cache and what never, checkpoint) with labs Cache-aside and An LRU cache. Library
  pages with reference diagrams. 70 judgement items hand-verified.
- Fixed: the cache figure's "hit" class collided with the Library search's `.hit` style.
- Browser at 390 px: 184 S3/S4 screens and labs, no overflow, controls at least 44 px, no clipped
  labels; every figure goal reached in the app. Tests: 83 pass.
- Next: SD-3 (S5 Databases: modelling and queries, then the walkthrough player and the URL shortener
  walkthrough).


## System Design SD-3: S5 Databases, the walkthrough player and the URL shortener, 2026-11-17 — DONE
- S5 Databases: modelling and queries (11 lessons: tables and keys, joins and foreign keys, key-value
  and document stores, wide-column and graph stores, indexes, composite indexes and their cost,
  normalised or denormalised, transactions and ACID, isolation anomalies, preventing lost updates,
  checkpoint) with real SQL in SQLite (Python's sqlite3 works in Pyodide with no extra package;
  checked in the app's worker). Prelude helpers: shop(), q(), plan() (EXPLAIN QUERY PLAN without
  details), bank()/move()/bal(), store(). Labs: Query the shop; Safe money and stock (empty
  functions: checked transfer, atomic multi-unit sale, optimistic save with retry).
- Walkthrough player: schema (FRAMEWORK of seven steps, 2-4 exercises each, a "what a strong answer
  says" note and the design so far), content/walkthroughs/, verify-content checks (framework order,
  exercises verified like lessons, diagrams, needed units exist). Routes #/walk/<id> (resume at the
  first unfinished step; the resume point is fixed on opening so the strong-answer note always
  shows), /<n>, /summary, /blank. Progress: steps are completions "<walk>#<n>" logged as lab
  activity (count toward the daily goal, merge across devices, so resuming on another device works);
  finishing adds the walkthrough to the Library (final diagram, decisions, step notes).
- Blank-page pass: opens a week after finishing; 35-minute timer, requirements textarea and component
  palette saved as notes (synced), then a self-check against the reference with matched, missed and
  extra components, and "your first five minutes"; the app says plainly to do it out loud.
- First walkthrough: URL shortener (unlocks after S1-S5). Home shows a "Design walkthroughs" section
  on the Systems tab; the Library lists finished designs.
- Checked in the browser at 390 px with temporarily injected progress (restored afterwards): steps
  1-2 played and graded, strong-answer screens, summary, blank pass and Home section. Fixed: a
  stale-state bug in the component palette. S5 sweep: 110 screens, no overflow. Tests: 87 pass.
- Next: SD-4 onward, S6 (replication and partitioning) with the consistent-hashing and quorum
  figures, then S7.


## System Design SD-4: S6 Databases: replication and partitioning, 2026-11-17 — DONE
- New figure `ring` (consistent hashing): 6-20 keys on servers by hash % n or on a hash ring; add or
  remove servers, switch placement, choose virtual nodes; moved keys are outlined; goals: grow to n
  servers moving at most k keys, or keep the busiest server under a share. Shared logic in
  src/lib/ringsim.ts (FNV-1a with MurmurHash3's finaliser, so short similar keys spread evenly),
  verified against every reachable state and unit-tested.
- Simulated services: `sim.Replicas(followers, lag)`, a leader and followers on the virtual clock,
  with nodes that can be marked down; self-tested.
- S6 (11 lessons: leader and followers, replication lag, reading your own writes, synchronous or
  asynchronous, failover and split brain, why partition, range or hash, choosing a shard key, hot
  keys, consistent hashing, checkpoint). Labs: Reads across replicas (scaffolded); A hash ring (empty
  functions, tested by properties). Library page with a reference diagram. 42 judgement items
  hand-verified.
- Browser at 390 px: 110 S6 screens and labs, no overflow; both ring goals reached in the app.
  Tests: 89 pass.
- Not built yet from the brief: the sharding figure (S6 teaches hot shards with code and diagrams
  instead), the quorum and partition figures (S7), the rate-limiter and queue figures (S8/S9).
- Next: S7 Consistency and coordination (quorum and partition figures), then S8 onward and the
  remaining walkthroughs.


## System Design SD-5: S7 Consistency and coordination, 2026-11-17 — DONE
- New figure `quorum`: N replicas with W and R steppers (and optionally replicas down); the write
  lands on the first W up replicas and the read asks the last R, so the read is fresh exactly when
  W + R > N; goals: fresh read, or fresh with replicas down. src/lib/quorum.ts, verified against
  every reachable state and unit-tested.
- S7 (10 lessons: CAP as a choice during a partition, the latency side (PACELC), strong, eventual and
  causal consistency, quorums, logical clocks, what consensus gives, leader election and locks with
  fencing tokens, checkpoint). Labs: Quorums (scaffolded); Clocks and fences (empty functions).
  Library page. 45 judgement items hand-verified.
- Browser at 390 px: 101 S7 screens and labs, no overflow; both quorum goals reached in the app.
  Tests: 91 pass.
- Still to build from the brief: the partition (CAP) figure, rate-limiter, queue and sharding
  figures; units S8 to S14; walkthroughs 2 to 14 and the four AI designs in the walkthrough player.
  Next session: S8 Queues, streams and async work (queue figure), then S9 (rate-limiter figure).

## System Design SD-6: S8 Queues, streams and async work, 2026-11-19 — DONE
- New figure `queue`: a backlog of jobs (normal, fails once, always fails, crashes before the ack) with
  optional steady arrivals; controls chosen per figure from workers, retries, ack first/after,
  idempotent handling and a dead-letter queue; shows each job's outcome (done, twice, lost, DLQ) and
  when the backlog clears. Goals: every job done once (poison jobs parked), and/or clear within N
  ticks. src/lib/queuesim.ts, verified against every reachable state and unit-tested.
- S8 (10 lessons: doing work later, queue vs pub-sub vs log, delivery guarantees, exactly once as
  idempotent handling, retries and dead letters, backpressure, ordering, the outbox pattern (with real
  SQLite rollback), sagas, checkpoint). Labs: A queue with acks (scaffolded); Retries, partitions and
  sagas (empty functions). Library page. 47 judgement items hand-verified.
- Browser at 390 px: 95 S8 screens, 9 lab steps and the Library page, no overflow; the checkpoint's
  four-control queue goal reached in the app. Tests: 94 pass.
- Still to build: partition (CAP), rate-limiter and sharding figures; units S9 to S14; walkthroughs 2
  to 14 and the four AI designs in the walkthrough player. Next: S9 (rate-limiter figure).

## System Design SD-7: S9 APIs and service boundaries, 2026-11-19 — DONE
- New figure `limiter`: requests over up to 6 seconds, grouped by second and marked allowed or 429,
  under a fixed window, a sliding window or a token bucket (size and refill controls); shows the
  busiest one-second span. Goals: never more than N in any second, and/or at least M allowed.
  src/lib/limiter.ts (exact, in tenths of a second), verified against every reachable state, unit-tested.
- S9 (10 lessons: REST, gRPC and GraphQL, pagination, versioning, idempotency keys, rate-limit windows,
  the token bucket, the API gateway, monolith or microservices, service discovery, checkpoint). Labs:
  Pages, versions and keys (scaffolded); Rate limiters and routing (empty functions). Library page.
  50 judgement items hand-verified.
- Browser at 390 px: 101 S9 screens and lab steps plus the Library page, no overflow; bucket-size and
  sliding-window goals reached in the app. Tests: 96 pass.
- Still to build: partition (CAP) and sharding figures; units S10 to S14; walkthroughs 2 to 14 and the
  four AI designs in the walkthrough player. Next: S10 Reliability and operations.

## System Design SD-8: S10 Reliability and operations, 2026-11-19 — DONE
- S10 (10 lessons: timeouts, retries without storms, circuit breakers, bulkheads and degradation,
  redundancy and regions, safe deployment, metrics, logs and traces, SLOs and error budgets,
  authentication and authorisation with sessions and tokens, checkpoint). No new figure. Labs: Deadlines
  and retries (scaffolded); A circuit breaker (empty functions: breaker states on a passed-in clock,
  error budget, ownership check). Library page. 49 judgement items hand-verified.
- Browser at 390 px: 101 S10 screens and lab steps plus the Library page, no overflow or error
  screens; S10 lists after S9 on the Systems tab. Tests: 96 pass.
- Still to build: partition (CAP) and sharding figures; units S11 to S14; walkthroughs 2 to 14 and
  the four AI designs in the walkthrough player. Next: S11 Specialised building blocks (11 lessons).

## System Design SD-9: S11 Specialised building blocks, 2026-11-19 — DONE
- S11 (11 lessons: inverted indexes, ranking, geospatial indexing, real-time delivery, object storage
  and media, unique ids, Bloom filters, counting at scale, batch and stream, analytical and
  transactional, checkpoint). No new figure. Labs: Search and maps (scaffolded); Ids and Bloom filters
  (empty functions). Library page. 50 judgement items hand-verified.
- Browser at 390 px: 110 S11 screens and lab steps plus the Library page, no overflow or error
  screens. Tests: 96 pass.
- Still to build: partition (CAP) and sharding figures; units S12 to S14; walkthroughs 2 to 14 and
  the four AI designs in the walkthrough player. Next: S12 Designing AI systems (9 lessons).

## System Design SD-10: S12 Designing AI systems, 2026-11-22 — DONE
- New optional `see` field on concept cards: a "Builds on:" row of links to earlier lessons (the brief
  says S12 links to E6 and E9 rather than re-teaching them). The verifier checks every link exists.
- S12 (9 lessons: batching, streaming and GPU queues, vector indexes at scale, the two paths of a
  retrieval system, exact and semantic caching, a model gateway, cost per request, feedback and
  evaluation loops, checkpoint). No new figure. Labs: Costs, batches and recall (scaffolded); Cache and
  gateway (empty functions: cosine, semantic lookup, budget, fallback routing, gateway). Library page.
  38 judgement items hand-verified.
- Browser at 390 px: 92 S12 screens and lab steps plus the Library page, no overflow or error screens;
  "Builds on" links open the linked E lessons. Tests: 96 pass.
- Next: S13 Low-level design in Python, then S14 The design interview.

## System Design SD-11: S13 Low-level design in Python, 2026-11-22 — DONE
- S13 (10 lessons: modelling with classes, composition over inheritance, SOLID in two lessons, strategy
  and state, observer and decorator, factory and adapter, reading a class diagram, shared state and
  locks, checkpoint). Class diagrams reuse the diagram component (boxes plus "is a", "has 1", "uses"
  edges; subclasses are listed before their base so the arrows point down). Race conditions are shown
  as hand-interleaved steps because Pyodide cannot start threads; Lock and Queue themselves run.
  Labs: A parking lot (scaffolded); States, events and locks (empty functions). Library page.
  49 judgement items hand-verified.
- Browser at 390 px: 101 S13 screens and lab steps plus the Library page, no overflow or error
  screens. Tests: 96 pass.
- Next: S14 The design interview (6 lessons).

## System Design SD-12: S14 The design interview, 2026-11-22 — DONE
- S14 (6 lessons: the seven steps, from a vague prompt to requirements, choosing the deep dive,
  defending a trade-off, pacing and pitfalls with a 35-minute budget, checkpoint). One lab from empty
  functions: Interview arithmetic (per-second rate, peak, storage, servers with a spare, pacing check).
  Library page. 46 judgement items hand-verified.
- Browser at 390 px: 61 S14 screens and lab steps plus the Library page, no overflow or error screens;
  S11 to S14 list in order on the Systems tab. Tests: 96 pass.
- All 14 System Design units now exist. Still to build from the brief: the partition (CAP) and sharding
  figures (for S6/S7), walkthroughs 2 to 14, and the four E11 AI designs in the walkthrough player.

## Walkthroughs 2–4, 2026-11-22 — DONE
- Rate limiter (needs S1–S4, S9), notification service (needs S1–S3, S8, S10) and news feed (needs
  S1–S6), each through the seven steps with a strong-answer note, a growing diagram, a final diagram and
  decisions for the Library, and blank-page references. Listed in unlock order: URL shortener, news
  feed, rate limiter, notification service.
- Diagram layout: a downward edge whose straight line would cross a box in a middle layer is now routed
  round the right-hand margin (unit-tested). Nine existing diagrams in S3, S6, S7, S11 and S12 had
  such crossings and now read cleanly.
- Browser at 390 px with temporary S1–S10 progress (removed afterwards): every step intro, first
  exercise, summary and blank page of the three walkthroughs, no overflow or error screens; the
  news-feed slot diagram checked visually. Tests: 97 pass. 42 judgement items hand-verified.
- Still to build: walkthroughs 5–14 (key-value store next), the four E11 AI designs in the walkthrough
  player, and the partition and sharding figures.

## Walkthroughs 5–9, 2026-11-23 — DONE
- Key-value store (needs S1–S3, S5–S7), web crawler (needs S1–S3, S8, S9, S11), search autocomplete
  (needs S1–S4, S11), chat system (needs S1–S3, S5, S8, S11) and file sync (needs S1–S3, S5, S8, S11),
  each through the seven steps with strong-answer notes, a step-5 diagram, a final diagram and
  decisions, and blank-page references. Unlock order: URL shortener, news feed, key-value store, rate
  limiter, notification service, web crawler, autocomplete, chat, file sync.
- Browser at 390 px with temporary S1–S11 progress (removed afterwards): every step intro, the summary
  and the blank page of all five, no overflow or error screens; all five final diagrams and the chat
  step-5 slot and tap exercises checked visually (a "gossip" edge that pushed Node B down a row was
  removed from the key-value final diagram). verify-content: 3114 exercises. Tests: 97 pass.
  77 judgement items hand-verified.
- Still to build: walkthroughs 10–14 (video streaming next), the four E11 AI designs in the
  walkthrough player, and the partition and sharding figures.

## Walkthroughs 10–14, 2026-11-23 — DONE
- Video streaming (needs S1–S4, S8, S11), payment system (needs S1–S3, S5, S7, S8, S10), nearby
  search (needs S1–S4, S6, S11), document assistant at scale (needs S1–S4, S8, S11, S12) and model
  gateway (needs S1–S4, S9, S10, S12). All 14 walkthroughs from the brief now exist. Unlock order:
  URL shortener, news feed, key-value store, rate limiter, notification service, payment system, web
  crawler, autocomplete, chat, file sync, video streaming, nearby search, document assistant, model
  gateway.
- Browser at 390 px with temporary S1–S12 progress (removed afterwards): every step intro, the summary
  and the blank page of all five, no overflow or error screens; all five final diagrams checked
  visually (LLM and Vectors swapped in the document-assistant diagrams so two edges no longer cross).
  verify-content: 3219 exercises. Tests: 97 pass. 77 judgement items hand-verified.
- Still to build: the four E11 AI designs in the walkthrough player, and the partition (CAP) and
  sharding figures for S6/S7.
