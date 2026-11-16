# Hand verification, Phase 1

`npm run verify-content` runs every snippet whose output, shape or result is an answer
(155 of 158 exercises). This file records the re-derivation, by hand, of what it cannot
run: the 3 conceptual questions it lists, and whether each figure goal matches the cell
or shape its prompt describes (the script only checks that the goal exists and is
reachable).

No PyTorch content exists yet, so no local PyTorch check was needed.

## Conceptual multiple choice

| Exercise | Answer | Re-derivation |
|---|---|---|
| e2-1-7 | Async lets the program handle other requests while one waits on the network | An API call is mostly I/O wait. Async does not make one request faster, and sync HTTP clients exist, so both distractors are false. Correct. |
| e2-2-6 | "Fetch a user, then that user's orders" must be sequential | The second request needs the user id returned by the first. The weather pair and the two translations have no data dependency. Correct. |
| e2-3-7 | Scoring 20 independent eval questions fits `asyncio.gather` | Independent calls can overlap. Both distractors feed the first result into the second call, so they cannot start together. Correct. |

## Figure goals

| Exercise | Prompt asks for | Goal in data | Check |
|---|---|---|---|
| f3-1-2 | `A * B` cell from 4 × 8 | elementwise (1, 1) | 4 = A[1][1], 8 = B[1][1]. Correct. |
| f3-4-1 | top-right of `A @ B`, stepped to its value | stepper (0, 1) | Row 0, column 1 is top-right; 1·6 + 2·8 = 22. Correct. |
| f3-4-2 | `A @ B` cell from row 2 of A, column 1 of B | matmul (1, 0) | Row index 1, column index 0 = bottom-left. Correct. |
| f3-5-3 | bottom-right via stepper | stepper (1, 1) | (0, 1)·(1, 0) = 0. Correct. |
| f3-6-1 | change B's first number so `A @ B` runs | r0 editable, goal valid | (2, 3) @ (n, 4) needs n = 3; reachable, not met at start (2). Correct. |
| f3-6-5 | make `A @ B` give (4, 6) | r0, r1 editable, result (4, 6) | B must be (2, 6); start is (3, 5). Correct. |
| f3-8-6 | find an order that runs for A (4, 3), B (2, 4) | swappable, goal valid | `A @ B`: 3 ≠ 2; `B @ A`: (2, 4) @ (4, 3) = (2, 3). Correct. |
| f3-9-1 | the cell made from 2 × 6 alone | elementwise (0, 1) | A[0][1] = 2, B[0][1] = 6, single pair means `*`. Correct. |
| f3-9-2 | the cell using all of row 1 and column 2 | matmul (0, 1) | Whole row and column means `@`; row 0, column 1. Correct. |
| f3-12-10 | the cell from row 2 of A and column 1 of B | matmul (1, 0) | Bottom-left of `A @ B`. Correct. |

## Other text not executed

- f3-07 card: the comments `(2, 3) * (2, 3) -> (2, 3)`, `(2, 3) @ (3, 4) -> (2, 4)` and
  `(2, 3) @ (2, 3) -> error` follow the two rules taught; the same cases are executed in
  f3-7-1 to f3-7-8. Correct.
- MCQs with a `check` field run that check, but each check was written by the author, so
  the wording of their distractor explanations was re-read too: f3-2-1, f3-2-8, f3-3-4,
  f3-5-8, f3-6-7, f3-7-10, f3-9-8, f3-10-3, f3-11-5, f3-12-1 to f3-12-3, e2-2-2, e2-3-3.
  No errors found.

# Hand verification, Phase 3

`npm run verify-content` now also runs every lab step (the solution passes its tests; the
starter and the hint-2 structure fail them; the finished program passes every step's tests),
executes the Library example and compares its output, and runs `scripts/sim_selftest.py`
against the simulated services. A mutation check (changing lab 1's `a * b` to `a + b`) made
the build fail at steps 1, 4 and 5, so the lab checks do catch wrong solutions.

What is not executed, re-derived by hand:

## F3 Library page

| Claim | Check |
|---|---|
| `W * W` for `W = [[1, 0, 2], [0, 1, 1]]` is `[[1 0 4] [0 1 1]]` | Squares of each cell. Also executed: the output block is verified. Correct. |
| `W @ x` row 1 = 1·3 + 0·4 + 2·5 = 13, row 2 = 0·3 + 1·4 + 1·5 = 9 | Arithmetic re-done. Matches executed output `[13  9]`. Correct. |
| (2, 3) @ (3,) → (2,) | Inner 3s match; a 1-D right operand gives one value per row. Correct. |
| `np.dot` and `np.matmul` equal `@` for 2-D arrays | True in NumPy 2.x; they differ only for scalars and stacks of matrices, which the page does not claim. Correct. |
| "mismatch in its core dimension" means the inner sizes differ | This is NumPy 2.x's matmul error text (seen in f3-11 and executed there). Correct. |
| A batch `X` (batch × inputs) goes through as `X @ W.T` | (b, n) @ (n, m) = (b, m), with `W` stored as (m, n). This is what lab 2 step 5 tests. Correct. |
| PyTorch follows the same rules | `torch.matmul` on 2-D tensors has the same shape rule. Correct. |
| Mistakes: two (2, 3) arrays with `@` fail (3 ≠ 2); shapes read (rows, columns) | Correct. |

## F3 lab texts

- Lab 1 step 4 explain: rows come from A, columns from B, so (m, n) @ (n, p) → (m, p). Correct.
- Lab 1 step 5 explain: NumPy raises ValueError on an inner-size mismatch. Correct (executed in f3-11).
- Lab 2 step 3 explain: `A @ A` with A (2, 3) fails, inner 3 vs 2. Correct.
- Lab 2 step 5 goal: (4, 3) @ (2, 3) fails; `X @ W.T` gives (4, 2). Correct (tested).
- Lab 3 step 2 explain: NumPy broadcasting stretches some unequal shapes (taught in F4). Correct.
- Lab 3 step 3 explain: same-size square matrices run under both `*` and `@` with different results. Correct.

## Simulated services

`DIFFERENCES` in `src/python/epoch_sim.py` lists what differs from the real libraries
(virtual time, estimated tokens, made-up prices and model names, scripted replies). The
`FakeLLM` interface follows the Anthropic SDK shape (`messages.create`, `content[0].text`,
`usage.input_tokens`, `stop_reason` of `end_turn` / `max_tokens` / `tool_use`); `Client` and
`AsyncClient` follow httpx (`get`, `post`, `status_code`, `json()`, `raise_for_status()`,
`HTTPStatusError`, `TimeoutException`). No engineering lab uses them yet; each lab that does
must state its own differences (`differs` field) and be checked against current docs then.

# Hand verification, Phase 4: unit E5 (Evaluation)

`npm run verify-content` executes every E5 snippet whose output, error or result is an answer,
all three labs (solutions pass, starters and hint-2 structures fail) and the Library example.
The 27 judgement items it cannot run were re-derived by hand. Before this, the multiple-choice
options were rebalanced so the right answer is not simply the longest (checked by script:
no right option is more than about 1.2 times the longest wrong one).

| Exercise | Answer | Re-derivation |
|---|---|---|
| e5-1-2 | Same inputs and expected answers, scored the same way | An eval needs fixed inputs, expected outputs and a scoring rule; more hand tries or another model's opinion supply none of these. Correct. |
| e5-1-7 | A against B | Only A and B were scored on the same items; C's set may be easier. Correct. |
| e5-2-2 | 3, 14 and 15 days, plus one with no day count | Covers a common case, both sides of the 14-day boundary and an under-specified question; the others are all-easy or all-clear. Correct. |
| e5-2-6 | A person who checked each one | Model or old-prompt labels make the eval measure self-agreement or copy old errors. Correct. |
| e5-3-4 | Sorting tickets into billing, bug or other | Closed label set suits exact match; summaries and replies have many valid wordings. Correct. |
| e5-4-1 | Accuracy | One right folder per email; a judge or confidence does not measure correctness more cheaply. Correct. |
| e5-4-2 | One wrong field would fail the whole invoice | All-or-nothing scoring hides which field fails; speed and comparability are not the issue. Correct. |
| e5-4-5 | A rubric or judge | Free-text summary; exact match and a fixed list do not fit. Correct. |
| e5-4-6 | positive/negative → accuracy; extract fields → per-field; explain policy → rubric or judge | Each pairing follows the lesson's rule (closed label, several closed fields, free text). Correct. |
| e5-5-4 | Recall (fraud) | Misses are costly, false alarms cheap; accuracy is inflated by the rare positive class. Correct. |
| e5-5-5 | Precision (spam filter hiding mail) | False alarms (real mail flagged) are the costly error. Correct. |
| e5-6-4 | Mentions the 14-day limit | A literal substring check; tone and intent need judgement. Correct. |
| e5-7-3 | Retry or repair, report how many failed | Inventing a score or dropping items biases the result silently. Correct. |
| e5-7-5 | Compare with your own scores, short answers included | Only comparison with known labels reveals a length bias; a bigger judge or an instruction proves nothing. Correct. |
| e5-7-7 | Judge both orders; count consistent wins | Standard fix for position bias; 70% is far from the 50% of a fair coin. Correct. |
| e5-8-1 | Keep them | Deleting failed items raises the score without improving the system. Correct. |
| e5-8-3 | Fix it and bump the version | Wrong labels should be fixed; versioning stops old and new scores being mixed. Correct. |
| e5-8-7 | In the model's prompt examples | Test items in the prompt are leakage; version control and the eval script must hold the set. Correct. |
| e5-9-2 | The pair helped; not which change did | Two changes at once confound the cause. Correct. |
| e5-9-3 | Maybe noise | A one-item difference on 50 items is within run-to-run variation (e5-9-6 shows two flips with no change). Correct. |
| e5-10-2 | Yes: golden items now sit in the prompt | Few-shot examples taken from the test set are leakage. Correct. |
| e5-10-3 | It tuned on the test | Selecting among 30 versions by test score fits the test; use a dev set for choosing. Correct. |
| e5-10-5 | Tuning on a dev set, reporting once on an untouched golden set | The other two put test items or test-driven fixes into the build. Correct. |
| e5-11-1 | Accuracy, with a count per team | Closed labels; a per-team count shows where errors land. Correct. |
| e5-11-5 | Score a sample yourself and compare | A uniformly high judge must be checked against human labels first. Correct. |
| e5-11-7 | Did any of the 50 come from the golden set? | A large jump after adding examples is the classic leakage sign. Correct. |
| e5-11-9 | two changes → one per run; position bias → both orders; test items in prompt → dev set; "Yes." vs "yes" → normalise | Each fix is taught in lessons 9, 7, 10 and 3. Correct. |

Other E5 text not executed:

- Lesson cards and explanations re-read: precision = tp / (tp + fp), recall = tp / (tp + fn)
  (card output executed); "dicts compare by keys and values, not order" (executed in e5-4-4).
- Lab 2 `differs`: the call shape `client.messages.create(model=..., max_tokens=..., messages=[...])`
  and `reply.content[0].text` matches the Anthropic Python SDK's Messages API as known at
  writing; E3 (calling an LLM) re-checks current provider docs before teaching it directly.
- Library forReal: refers only to the plan's week 3, week 6 and February topics (no personal details).

# Hand verification, Phase 4: unit E3 (Calling an LLM)

Docs checked on 2026-11-16 before writing (via the provider's and Pydantic's own pages):
the Messages API takes `model`, `max_tokens` and `messages` (roles "user" and "assistant"),
with the system prompt as a separate top-level `system` parameter; replies carry `content`
blocks (`text`, `tool_use`), `stop_reason` ("end_turn", "max_tokens", "tool_use", ...) and
`usage.input_tokens` / `usage.output_tokens`; tools are `name`, `description`, `input_schema`,
and results go back as a user message with a `tool_result` block and `tool_use_id`. Prices
are quoted per million tokens. A structured-output mode exists (JSON schema). Pydantic v2:
`model_validate_json`, `model_validate`, `model_dump`, `ValidationError`, `e.errors()`.
`epoch_sim` follows these shapes (it gained `Message.type` and the cache usage fields).
The app now loads Pydantic on demand (`loadPackagesFromImports`) and the verifier preloads it.

All E3 snippets, labs (including Pydantic and the tool loop) and the Library example are
executed. Judgement items re-derived by hand:

| Exercise | Answer | Re-derivation |
|---|---|---|
| e3-1-2 | The separate `system` parameter | Per the Messages API docs, the system prompt is top-level, not a message role. Correct. |
| e3-1-5 | The API keeps no memory between calls | Each call sees only the messages sent with it. Correct. |
| e3-1-7 | user → what you send; assistant → past replies; system → rules for the chat | Matches the API's roles. Correct. |
| e3-2-5 | The first block may be a tool call | Replies can contain `tool_use` (and other) blocks before or instead of text. Correct. |
| e3-3-3 | Raise max_tokens or ask for less | `stop_reason` "max_tokens" means the cap cut the reply. Correct. |
| e3-3-6 | The system prompt and all past turns | Everything sent is input on that call. Correct. |
| e3-4-5 | Drop or summarise the oldest turns | Standard context management; the system prompt carries the rules. Correct. |
| e3-4-6 | Each call resends the growing history | Input tokens grow per turn (e3-4-1 executes the arithmetic). Correct. |
| e3-5-3 | A reply 1,000 tokens shorter | At 3 / 15 per million, 1,000 output tokens cost 0.015, input 0.003. Correct. |
| e3-6-5 | json.loads checks syntax, not the fields | `json.loads` accepts any JSON; the model enforces fields and types (e3-6-2 executes this). Correct. |
| e3-7-3 | The bad reply and the validation error | Standard repair loop (lab 2 tests it). Correct. |
| e3-7-6 | Return a clear failure and log it | Bounded retries; unbounded ones can loop and cost money. Correct. |
| e3-8-3 | Your code runs the tool | For client tools the model only emits a `tool_use` request. Correct. |
| e3-8-7 | Send the error as the tool_result | The docs allow error results (`is_error`); the model can then recover. Correct. |
| e3-9-4 | Most are quick; 1 call in 20 is slow | Definition of p50/p95. Correct. |
| e3-10-2 | The system parameter | `max_tokens` is a hard cap that truncates, not a length instruction. Correct. |
| e3-10-6 | Trim or summarise old turns | The resent history is what grows. Correct. |
| e3-10-9 | max_tokens → raise cap; ValidationError → send error back; tool_use → run tool; slower chats → trim | Each matches the lesson that taught it. Correct. |

Library forReal refers only to the plan's week 2 topics (no personal details).
