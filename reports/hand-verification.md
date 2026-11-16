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

# Hand verification, Phase 4: unit E4 (Prompts and context)

Sources read on 2026-11-16: the provider's prompt-engineering overview and "prompting best
practices" page, and its engineering article "Effective context engineering for AI agents".
All snippets, both labs and the Library example are executed. `verify-content` now also
fails any multiple-choice question whose right option is more than 1.25 times longer than
every wrong one (this caught one old E2 question, rewritten).

| Exercise | Answer | Source / re-derivation |
|---|---|---|
| e4-1-1 | Task, reader and format stated | "Be clear and direct": state the task and the context. Correct. |
| e4-1-3 | Give the reason (read aloud, so no ellipses) | The guide's own example: explaining why generalises better than "NEVER". Correct. |
| e4-1-5 | Write in plain paragraphs | Guide: say what to do rather than what not to do. Correct. |
| e4-2-2 | So it copies the pattern, not a quirk | Guide: examples should be diverse so unintended patterns are not learned. Correct. |
| e4-2-3 | About three to five | Guide's tip: include 3 to 5 examples. Correct. |
| e4-2-7 | one label → vary; read as input → tags; from test set → dev set | Guide (diverse, tagged) and E5 (leakage). Correct. |
| e4-3-2 | Question at the end | Guide: long documents at the top, query at the end (reported up to 30% better). Correct. |
| e4-3-6 | Quote the relevant passages first | Guide: for long documents ask for relevant quotes first. Correct. |
| e4-4-1 | Specific job and limits | Article: the "right altitude" between brittle if-else logic and vague guidance. Correct. |
| e4-4-2 | Trim to essentials and add a few examples | Article: avoid laundry lists of edge-case rules; use canonical examples. Correct. |
| e4-4-7 | Start minimal, test, fix observed failures | Article: start with a minimal prompt, add for observed failure modes. Correct. |
| e4-5-2 | Send the parts the question needs | Article: smallest set of high-signal tokens. Correct. |
| e4-5-5 | Low-signal text dilutes attention | Article: context rot, the attention budget. Correct. |
| e4-5-7 | policy → include; catalogue → leave out; old chat → summary at most | Follows from the high-signal principle for that question. Correct. |
| e4-6-2 | Old tool results already used | Article: clearing old tool results is the safest light form of compaction. Correct. |
| e4-6-4 | Notes it writes and rereads | Article: structured note-taking for iterative work with milestones. Correct. |
| e4-6-6 | Search tools; open files as needed | Article: just-in-time retrieval with lightweight references. Correct. |
| e4-7-1 | Classify as bug, billing or other; label only | Task, allowed answers and format. Correct. |
| e4-7-4 | In the system prompt | Role and lasting rules go in the system prompt (guide; Messages API `system`). Correct. |
| e4-7-7 | Summarise old turns, drop used results | Compaction, as in the article. Correct. |
| e4-7-9 | examples → format; docs first → long inputs; compaction → near the window; just-in-time → huge bases | Each from the guide or article. Correct. |

Also checked: the e4-4-4 note says the stand-in rejects a "system" role in the list and that the
provider's docs recommend the separate `system` parameter (which they do); it does not claim the
real API's behaviour for that role. Library forReal refers only to plan weeks 1 and 4.

# Hand verification, Phase 4: unit E1 (A real Python project)

Sources read on 2026-11-16: uv "Working on projects" and "Creating projects" guides, the
Python Packaging guide "Writing your pyproject.toml", pytest "Get Started", the Ruff tutorial
and configuration pages, pre-commit.com and the ruff-pre-commit README, and the `typing` docs.
TOML snippets run through `tomllib`, pytest snippets run with pytest in Pyodide (now preloaded
by the verifier; the app loads it on first import), and both labs are executed, including
checks that each learner-written test fails on a deliberately broken function.

| Exercise | Answer | Source / re-derivation |
|---|---|---|
| e1-1-1 | pyproject → describes; uv.lock → exact versions; .python-version → which Python; src/notes → package | uv project guide. Correct. |
| e1-1-2 | Commit uv.lock | uv guide: the lockfile "should be checked into version control". Correct. |
| e1-1-3 | Do not commit .venv | uv rebuilds it (`uv sync`); it is machine-specific. Correct. |
| e1-1-5 | Tests import the installed package | Standard src-layout rationale (packaging guides). Correct. |
| e1-1-7 | `uv run pytest` | uv guide and pytest Get Started both use `uv run pytest`. Correct. |
| e1-2-3 | `notes` command runs `main()` from `notes/cli.py` | Packaging guide, `[project.scripts]`. Correct. |
| e1-2-7 | `name` cannot be dynamic | Packaging guide: name is the only field that cannot be marked dynamic. Correct. |
| e1-3-2 | `--dev` puts tools in the dev group | pytest's own install line is `uv add --dev pytest`; uv writes development dependencies to `[dependency-groups]` `dev` (the doc fetch did not quote this line from a uv page; it matches uv's documented behaviour and the packaging guide's description of dependency groups). Correct, flagged for a recheck if uv changes. |
| e1-3-3 | Commit uv.lock and install from it | Lockfile purpose. Correct. |
| e1-3-4 | add / add --dev / run / sync | uv guide. Correct. |
| e1-3-7 | `uv run` uses the locked project environment | uv guide: uv run checks lock and environment before running. Correct. |
| e1-4-5 | Hints are not enforced; checkers flag them | typing docs: the runtime does not enforce annotations. Correct. |
| e1-5-6 | One behaviour, known input, exact expected output | Standard unit-test practice. Correct. |
| e1-5-7 | `notes_tests.py` matches no default pattern | pytest: `test_*.py` or `*_test.py`. Correct. |
| e1-6-2 | add(2, 3) returned 4; 5 was expected | pytest assert rewriting shows `where 4 = add(2, 3)`. Correct. |
| e1-6-4 | The test is wrong (2 × 3 = 6) | Arithmetic. Correct. |
| e1-6-7 | Read from the bottom | Summary and FAILED lines come last in pytest output. Correct. |
| e1-7-2 | check → bugs; format → layout; pre-commit → before commits; pytest → tests | Ruff tutorial, pre-commit docs. Correct. |
| e1-7-3 | F401 = imported but unused | Ruff tutorial example. Correct. |
| e1-7-4 | On each git commit, once installed | pre-commit: `pre-commit install` sets up the git hook. Correct. |
| e1-7-6 | Linter finds problems, formatter fixes layout | Ruff docs. Correct. |
| e1-7-7 | `pre-commit install` | pre-commit docs. Correct. |
| e1-8-2 | `uv sync` | Installs from the lockfile. Correct. |
| e1-8-5 | `uv add --dev pytest ruff` | As e1-3-2. Correct. |
| e1-8-8 | The code (spec says 10 s, test expects 10) | The test matches the spec. Correct. |
| e1-8-9 | unused import → ruff; wrong sum → pytest; wrong type → mypy; versions → uv.lock | Each tool's job. Correct. |

TOML error texts shown in e1-2-4 and e1-8-6 are checked by prefix against the real error.
Library forReal refers only to plan week 1.

# Hand verification, Phase 4: unit E2 lessons 4 to 8, labs and Library

Sources read on 2026-11-16: httpx "Async Support", "Timeouts", "Exceptions", "QuickStart" and
"Transports" pages; Python's asyncio "Coroutines and Tasks" (timeouts); MDN on 429.
`epoch_sim` gained `MockTransport`, `Request` (`.method`, `.url.path`, `.json`), `URL` and
`Response(..., json=...)`, mirroring httpx; the sim self-test now covers them. The unit prelude
adds `import epoch_sim as sim`. All snippets and both labs run (real `asyncio.wait_for` /
`asyncio.timeout` in Pyodide; HTTP on the simulated client and virtual clock).

| Exercise | Answer | Source / re-derivation |
|---|---|---|
| e2-4-3 | httpx times out after about 5 s by default | httpx Timeouts: TimeoutException after 5 seconds of network inactivity. Correct. |
| e2-4-6 | Retry a few times, then report | Standard practice; consistent with lessons 6. Correct. |
| e2-5-3 | raise_for_status raises for 4xx and 5xx | httpx Exceptions: "error HTTP status of 4xx or 5xx" (the quickstart says non-2xx; both include these). Correct. |
| e2-5-6 | A client per request discards its connection pool | httpx Async page warning about creating clients in a hot loop. Correct. |
| e2-6-3 | Do not retry 404 | The request is wrong and will fail the same way. Not stated on the pages read; standard HTTP semantics. Correct. |
| e2-6-6 | Cap retries so a persistent outage fails clearly | Standard practice. Correct. |
| e2-7-3 | Mocks are fast, free, repeatable and can stage failures | httpx Transports: MockTransport for testing. Correct. |
| e2-7-7 | Assert the 200 arrived on the third call | Outcome plus call count pins the retry behaviour. Correct. |
| e2-8-2 | Retry 503; not 401 or 400 | 503 is temporary; 400/401 mean fix the request or credentials. Correct. |
| e2-8-6 | asyncio.gather for 20 independent calls | Lesson 3 (gather overlaps waits). Correct. |
| e2-8-9 | gather / wait_for / backoff / MockTransport | Each tool's job as taught. Correct. |

Not confirmed from the pages read (stated as practice, not as a quoted rule): which 4xx/5xx
codes to retry beyond 429 and 5xx, and the HTTP-date form of Retry-After (lab 1 notes it).

# Hand verification, Phase 4: unit F1 lessons 4 to 12, labs and Library

All snippets are plain Python and are executed, including both labs and the Library example.
Judgement items re-derived by hand (Python language facts):

| Exercise | Answer | Re-derivation |
|---|---|---|
| f1-5-6 | Keywords make clear which option each value sets | Keyword arguments name parameters; no speed effect. Correct. |
| f1-6-6 | `**kwargs` takes any extra named options, as a dict | Language semantics. Correct. |
| f1-7-5 | `__init__` runs when an object is created | Called by the class call `Model(2)`. Correct. |
| f1-8-5 | nn.Module sets itself up in `super().__init__()` | PyTorch requires calling the parent initialiser before assigning submodules (it sets up parameter/module registries). Correct. |
| f1-9-4 | `import numpy as np` | Universal convention. Correct. |
| f1-9-7 | The guard stops training from starting on import | `__name__ == "__main__"` only when run directly. Correct. |
| f1-10-1 | The input is a list of dicts from str to int | Reading the hint before `->`. Correct. |
| f1-10-6 | Type checkers and editors check hints | Python stores but does not enforce annotations (typing docs). Correct. |
| f1-11-2 | Look first at the last frame in your own file | The library raised; the bad arguments came from the caller. Correct. |
| f1-11-5 | NameError/KeyError/IndexError/TypeError causes | Standard meanings of the built-in exceptions. Correct. |
| f1-12-8 | Line 42 of forward multiplied mismatched shapes | Frame gives file/line/function; message gives the problem. Correct. |
| f1-12-9 | `xs[-2:]`, `enumerate`, `**kwargs`, `super().__init__()` | As taught in lessons 1, 4, 6 and 8. Correct. |

# Hand verification, Phase 4: unit F2 (Vectors)

All snippets, number grids, both labs and the Library example are executed (two multiple-choice
questions, f2-4-4 and f2-5-6, also carry executed `check`s). Note: NumPy compiled to WebAssembly
cannot raise floating-point errors, so the zero-vector exercise (f2-6-6) asks for the `nan`
result instead of an error. Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| f2-1-2 | Swapped feature order compares prices with rooms | Position carries meaning. Correct. |
| f2-1-6 | A 300-number list per word is a vector describing it (an embedding) | Fixed length regardless of the word; learned features. Correct. |
| f2-2-7 | [price, rooms] + [rooms, price] adds prices to rooms | Same reasoning as f2-1-2. Correct. |
| f2-3-6 | Scaling by 10 changes size, not direction | k·v is parallel to v for k > 0. Correct. |
| f2-6-4 | Same proportions → same unit vector | Normalising removes the length factor. Correct. |
| f2-7-3 | Cosine stops long documents winning by size | Cosine divides out both lengths. Correct. |
| f2-7-7 | Cosine 0.92 → nearly the same direction | cos θ = 0.92 ⇒ θ ≈ 23°. Correct. |
| f2-8-4 | Cosine similarity for meaning | Direction comparison, standard for embeddings. Correct. |
| f2-8-9 | a+b vector; 3a longer same direction; a@b one number; cosine in [-1, 1] | Definitions. Correct. |

# Hand verification, Phase 4: unit F4 (NumPy)

Every snippet, shape, number grid, fill-in, spot-the-bug error, both labs and the Library example
are executed; f4-11-7 also carries an executed `check` (the right pair broadcasts, both wrong pairs
raise ValueError). Integer dtype names are kept out of printed answers because Pyodide (wasm32)
uses int32 where 64-bit computers use int64; f4-3-4's wrong option "int64" is wrong on both.
The broadcasting figure's rules are unit-tested against NumPy's (tests/core.test.ts), and each
figure goal is checked against its arrays. Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| f4-1-7 | Arrays let maths apply to every number at once | Vectorised ufuncs; the commas are cosmetic. Correct. |
| f4-2-4 | 32 greyscale 28×28 images: (32, 28, 28) | Batch-first convention (NumPy/PyTorch data loaders). Correct. |
| f4-6-4 | `batch = X[:32]; batch /= 10` changes X's first 32 rows | Basic slicing returns a view; in-place ops write through. Correct. |
| f4-7-7 | `&` combines masks item by item; `and` needs one truth value | `and` calls `bool()` on the array → ambiguous-truth ValueError. Correct. |
| f4-9-6 | `P.argmax(axis=1)` is the predicted class per example | Column index of each row's max. Correct. |
| f4-11-1/2, f4-14-3 | Figure goals: A[1,2]+b[2] = 6+30; A[1,1]+B[1,0] = 5+200; c[2,0]+b[1] = 3+20 | Cells (1,2), (1,1), (2,1) of the stretched results. Correct. |
| f4-12-7 | Standardise with axis=0 (per feature) | Each column has its own units/range. Correct. |
| f4-13-6 | Vectorised code is faster because the loop runs in compiled code | Python per-iteration overhead vs one C loop. Correct. |
| f4-14-9 | Replace the per-row loop with `X @ w` | Matrix-vector product = all row dot products. Correct. |

# Hand verification, Phase 4: unit E6 (Retrieval)

Sources used: standard RAG practice as described in provider and library documentation
(chunking with overlap; BM25 for keyword search; reciprocal rank fusion with k = 60, from
Cormack, Clarke and Büttcher 2009; cross-encoder rerankers applied to a retrieved candidate set).
No provider-specific API is taught, so nothing here depends on an SDK version. All code runs
against `sim.DOCS` and `sim.embed` and is executed; the probe of the toy embeddings that the
lessons rely on: "reset my password" ranks d6 (0.949) above d1 (0.889); "What does the paid plan
cost?" ranks d2 (1.0) above d7 (0.97); "capital of France" scores 0 everywhere; "login link
expired" peaks at 0.808 (d1). Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| e6-1-1 | Weekly-changing help pages: retrieve into the prompt | Fine-tuning needs retraining per change and gives no sources; full paste costs tokens and dilutes. Correct. |
| e6-1-2 | chunk/embed/retrieve/generate jobs | Pipeline definitions. Correct. |
| e6-1-4 | Passages in the prompt let the model answer from your text | In-context only; weights unchanged. Correct. |
| e6-1-6 | Rewording a sentence gains nothing from retrieval | Needs no outside facts. Correct. |
| e6-1-7 | 2M tokens of docs vs 200k context: retrieval picks the relevant passages | Selection, not compression. Correct. |
| e6-2-3 | 5,000-token chunks mix topics and fill the prompt | One vector averages many topics; irrelevant text per hit. Correct. |
| e6-2-4 | Split rule: overlap or split at paragraph ends | Keeps the exception with its rule. Correct. |
| e6-3-2 | Chunk embeddings computed once, at indexing | Re-embed only on change. Correct. |
| e6-3-5 | k = 3 when 5 chunks are needed: two chunks' facts never reach the model | Model sees only the prompt. Correct. |
| e6-3-7 | A vector database finds nearest vectors fast | ANN indexes (HNSW, IVF). Correct. |
| e6-4-2 | Error code E-4012: keyword search | Exact token match; embeddings blur codes. Correct. |
| e6-4-3 | "stop paying" vs "cancel": vector search | No shared words; paraphrase. Correct. |
| e6-4-5 | BM25 weights "refund" over "the": "the" is in almost every page | IDF term. Correct. |
| e6-4-7 | codes/IDs → keyword; described problems/paraphrases → vector | As above. Correct. |
| e6-5-2 | RRF uses ranks because BM25 and cosine scales differ | RRF needs no score normalisation. Correct. |
| e6-5-4 | d1 (both lists) beats d6 (vector top only) | 1/61 + 1/62 > 1/61 (executed check). Correct. |
| e6-5-7 | Hybrid worth it when queries mix meaning and exact terms | Covers both failure modes. Correct. |
| e6-6-1 | Reranking everything is too slow | One model call per chunk. Correct. |
| e6-6-2 | Rerankers read question and chunk together | Cross-encoder vs bi-encoder. Correct. |
| e6-6-4 | Right chunk often missing after retrieve 5 / rerank 3: retrieve more first | Reranker only reorders candidates. Correct. |
| e6-6-7 | Reranker sits between search and the prompt | Pipeline order. Correct. |
| e6-7-4 | Citation of an id never sent: treat as unsupported | The model did not see it in this call. Correct. |
| e6-7-6 | Citations let the user check the answer | Traceability. Correct. |
| e6-8-1 | Off-topic question: say it cannot answer | Top-k always returns something; refuse. Correct. |
| e6-8-3 | Good 0.6–0.9, off-topic 0.0–0.3: floor about 0.45 | Between the two groups. Correct. |
| e6-8-5 | Floor passed but answer absent: instruct the model to say it does not know | Second guard after retrieval. Correct. |
| e6-9-1 | Right page retrieved, wrong answer: generation failed | d2 says monthly plans are not refunded. Correct. |
| e6-9-2 | Reset page not retrieved: retrieval failed | d6 retrieved instead of d1. Correct. |
| e6-9-3 | Exact product names missed: add keyword search | Keyword strength. Correct. |
| e6-9-4 | Right chunk at rank 9 with k = 5: retrieval; raise k or rerank | Never reaches the prompt. Correct. |
| e6-9-7 | Log retrieved ids to tell the stages apart | Diagnosis. Correct. |
| e6-10-1 | Annual refund within 14 days citing d2: no failure | d2: "Annual plans can be refunded within 14 days of purchase." Correct. |
| e6-10-4 | Many phrasings of one intent: vector search | Paraphrases. Correct. |
| e6-10-8 | 95% retrieval hit rate, 30% wrong answers: work on generation first | Most errors happen after retrieval. Correct. |
| e6-10-9 | codes → keyword; rank 20 → retrieve more then rerank; off-topic → floor; cut rules → overlap | As taught. Correct. |

# Hand verification, Phase 4: unit E7 (Agents)

Sources: MCP specification (latest version 2026-07-28: server features tools, resources and
prompts, controlled by the model, the application and the user respectively; JSON-RPC 2.0;
`tools/list` and `tools/call`; stdio and Streamable HTTP transports); Anthropic, "Building
effective agents" (workflows vs agents; start simple; agents trade cost and latency for
flexibility and compound errors); Anthropic Messages API tool use (tool_result blocks with
`tool_use_id` and `is_error`, all results for one reply in the next user turn); OWASP Top 10 for
LLM Applications 2025 (LLM06 Excessive Agency, LLM02 Sensitive Information Disclosure).
Every loop, cost and MCP-handler snippet runs against `sim.FakeLLM` and `sim.call_tool`, both labs
included. Judgement items, each re-derived:

| Exercise | Answer | Re-derivation |
|---|---|---|
| e7-1-1 | Classify-then-route emails: a workflow | Fixed steps (routing pattern). Correct. |
| e7-1-2 | Fix a test in an unknown codebase: an agent | Steps depend on findings. Correct. |
| e7-1-3 | chaining / routing / parallel / agent definitions | As in the source article. Correct. |
| e7-1-6 | Agents cost latency, money, predictability | Source article's trade-off. Correct. |
| e7-2-2 | Invoice extraction: one call with a schema | Single fixed step. Correct. |
| e7-2-3 | Refund-issuing agent: wrong steps cost money | Irreversible action without review. Correct. |
| e7-2-4 | 80% at 5x cost vs 78%: ship the workflow | "Add complexity only when it measurably improves outcomes". Correct. |
| e7-2-5 | call / +retrieval / workflow / agent ladder | Source article's progression. Correct. |
| e7-3-5 | Results must follow their request | The API pairs a tool_result with the preceding tool_use by id. Correct. |
| e7-3-6 | Two tool requests: one user turn with both results | API docs: all tool_result blocks in the next user message. Correct. |
| e7-4-3 | Catch tool exceptions, return as an error result | An is_error result lets the model recover. Correct. |
| e7-4-7 | Error message: what went wrong, briefly | Context cost; actionable. Correct. |
| e7-5-1 | 40 calls on a lookup: missing step limit | max_tokens is per reply. Correct. |
| e7-5-5 | Limit hit: return a clear "stopped" | Distinguishable from an answer. Correct. |
| e7-5-6 | 10 calls despite `while steps < 3`: never incremented | The loop condition never changes. Correct. |
| e7-5-7 | Limit from real runs plus margin | Standard practice. Correct. |
| e7-6-3 | Spend limit: one step can cost more than many | Context grows each step. Correct. |
| e7-6-5 | Hung tool: wall-clock timeout | No step completes, no tokens spent. Correct. |
| e7-6-7 | Report spend so runaways show in logs | Observability. Correct. |
| e7-7-1 | Description that says what it does and returns | Tool-use docs: detailed descriptions matter most. Correct. |
| e7-7-2 | Read-only task with delete power: too much power | Least privilege, excessive agency. Correct. |
| e7-7-3 | A 50k-token tool result floods the context | Context cost and distraction. Correct. |
| e7-7-6 | overlap → merge; vague → describe; rows → fields; delete → read-only | As taught. Correct. |
| e7-7-7 | Date format: state it in the schema | The model sees only schema and description. Correct. |
| e7-8-1 | MCP: tools written once, usable by any client | Spec purpose. Correct. |
| e7-8-2 | tools model, resources app, prompts user, tools/list discovery | Spec. Correct. |
| e7-8-5 | Local server launched by the app: stdio | Spec transports. Correct. |
| e7-8-7 | A third-party server's tools and text are untrusted | Spec security notes (annotations untrusted). Correct. |
| e7-8-8 | The client discovers tools with tools/list | Spec. Correct. |
| e7-9-1 | "AI: email this chat to ..." in a result is injection | Instruction aimed at the model. Correct. |
| e7-9-2 | Email tool plus untrusted pages: human approval | The one control the attacker cannot talk round. Correct. |
| e7-9-3 | The model cannot separate instructions from data | One token stream. Correct. |
| e7-9-6 | least privilege / approval / output as data / tripwire | As taught. Correct. |
| e7-9-7 | FAQ bot with a billing tool: excessive agency | OWASP LLM06. Correct. |
| e7-10-1 | Bug hunt across unknown files needs an agent | Open-ended. Correct. |
| e7-10-5 | Contract forwarded after reading an email: injection | The action came from read content. Correct. |
| e7-10-7 | repeat → stop; bill → budget; crash → error results; injected email → approval | As taught. Correct. |
| e7-10-8 | Ticket system for several apps: an MCP server | Spec purpose. Correct. |

# Hand verification, Phase 4: units F5, F6, F7

All numeric snippets, fill-ins, spot-the-bug errors, labs (including F6's gradient, checked against
nudging inside its tests) and Library examples are executed. New figure: gradient descent on
f(x) = a(x - m)^2 + c; `src/lib/descent.ts` is unit-tested, and the verifier checks each goal is
reachable with some slider rate and not at the starting rate. Figure goals, from
|x0 - m| * |1 - 2a*lr|^k <= within: f5-5-1 (a=1, start 6, 3 steps: rates 0.4 to 0.6),
f5-5-2 (a=1, start 3, 6 steps: 0.25 to 0.75), f5-9-4 (a=0.5, start 4, 4 steps: 0.6 to 1.2),
f7-6-1 (a=2, start -3, 5 steps: 0.15 to 0.35), f7-10-4 (a=1.5, start 2, 4 steps: 0.25 to 0.45).
Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| f5-1-2 | Slope of 5 - 2x is -2 | Coefficient of x. Correct. |
| f5-1-8 | Slope 0: output does not change | Definition. Correct. |
| f5-2-7 | Derivative = output change per tiny nudge | Definition. Correct. |
| f5-3-1 | d(x^4) = 4x^3 | Power rule. Correct. |
| f5-3-2 | d(5x^2 + 7) = 10x | Power rule; constant gives 0. Correct. |
| f5-3-5 | x^2 → 2x, x^3 → 3x^2, 7x → 7, 4 → 0 | Rules. Correct. |
| f5-3-6 | d(a + b) = 2 + (-5) = -3 | Sum rule. Correct. |
| f5-4-1 | Derivative -2.5: raise the weight | Move against the sign. Correct. |
| f5-4-2 | x^2 - 6x has its minimum at 3 | 2x - 6 = 0. Correct. |
| f5-4-6 | Zero slope can be a peak or a flat spot | -x^2 at 0; x^3 at 0. Correct. |
| f5-5-7 | Slow steady fall: raise the rate a little | Steps too small. Correct. |
| f5-6-1 | d(xy)/dx = y | Hold y. Correct. |
| f5-6-3 | Partial 2 in size beats 0.5: w2 moves the loss more | Magnitude. Correct. |
| f5-6-6 | 5; 4y; x; 2x | Partial rules. Correct. |
| f5-7-2 | Gradient [3, -1]: subtract a multiple | Descent direction. Correct. |
| f5-7-4 | Gradient of (3, 4) weights has shape (3, 4) | One partial per weight. Correct. |
| f5-7-7 | Step against: the gradient points uphill | Steepest ascent. Correct. |
| f5-8-2 | 2 C/km times 0.5 km/h = 1 C/h | Chain rule. Correct. |
| f5-8-5 | 2 * 3 * 0.5 = 3 | Chain rule. Correct. |
| f5-9-2 | d(3x^2 + x) = 6x + 1 | Rules. Correct. |
| f5-9-6 | d(x^2 y)/dy at (1, 3) = x^2 = 1 | Hold x. Correct. |
| f5-9-9 | Loss growing faster each step: lower the rate | Divergence. Correct. |
| f6-1-5 | Variance 49 cm^2 → std 7 cm | Square root. Correct. |
| f6-2-1 | [0.5, 0.3, 0.2] valid; a negative entry or a sum of 0.9 is not | Axioms. Correct. |
| f6-2-6 | Says 90%, right 60%: overconfident | Calibration. Correct. |
| f6-3-3 | log 0.9 > log 0.1 | log is increasing. Correct. |
| f6-3-6 | Logs turn products into sums | Identity. Correct. |
| f6-4-3 | -95 beats -120 | Higher log-likelihood. Correct. |
| f6-4-6 | Minimise NLL: same optimum, no underflow | log is monotone. Correct. |
| f6-5-3 | softmax [5,5,5] = softmax [1,1,1] | Shift invariance. Correct. |
| f6-6-1 | Factual answers: low temperature | Concentrates on the top token. Correct. |
| f6-6-5 | Temperature never changes the order | Positive scaling preserves order. Correct. |
| f6-6-7 | Dull text: raise the temperature | Flatter distribution. Correct. |
| f6-7-3 | p = 1 on the correct class: loss 0 | -log 1 = 0. Correct. |
| f6-7-6 | 1 → 0, 0.5 → 0.69, 0.1 → 2.3, 0.001 → 6.9 | -log values. Correct. |
| f6-8-1 | 0.95 has lower cross-entropy than 0.55 | -log 0.95 < -log 0.55. Correct. |
| f6-8-2 | Accuracy is piecewise constant: zero gradient | Standard argument. Correct. |
| f6-8-6 | House prices: MSE | Regression. Correct. |
| f6-9-2 | [0.1, 0.6, 0.3] could be a softmax output | Positive, sums to 1. Correct. |
| f6-9-6 | Invented names: lower the temperature | Less sampling of unlikely tokens. Correct. |
| f6-9-9 | variance / softmax / cross-entropy / temperature | Definitions. Correct. |
| f7-1-2 | w = price per extra square metre | Slope. Correct. |
| f7-1-5 | w x + b has two parameters | x is the input. Correct. |
| f7-1-7 | Training adjusts parameters | Definition. Correct. |
| f7-2-7 | MSE of euros is in euros squared | Squared units. Correct. |
| f7-3-1 | dL/dw = -9.3: raise w | Against the sign. Correct. |
| f7-3-6 | x appears in dL/dw because dpred/dw = x | Chain rule. Correct. |
| f7-4-4 | Epoch = one pass over the data | Definition. Correct. |
| f7-4-5 | Flat, low loss: converged | Standard. Correct. |
| f7-5-5 | X^T @ err: per feature, the sum of err times that feature | Matrix product. Correct. |
| f7-6-3 | Slow steady fall: raise the rate | As F5. Correct. |
| f7-6-4 | Jagged, growing loss: lower the rate | Overshoot. Correct. |
| f7-6-7 | Unscaled features need different step sizes | Ill-conditioned loss surface. Correct. |
| f7-7-1 | 99% on training data says little | Memorisation. Correct. |
| f7-7-3 | Sorted by label, no shuffle: validation all dogs | Order. Correct (time-series caveat in the explanation). |
| f7-7-6 | Standardising on all the data leaks validation | Leakage. Correct. |
| f7-8-1 | Train 0.01, validation 0.9: overfitting | Gap. Correct. |
| f7-8-2 | Both high and close: underfitting | Definition. Correct. |
| f7-8-4 | More data reduces overfitting | Standard. Correct. |
| f7-8-7 | Patterns → overfit / underfit / good / early stop | As taught. Correct. |
| f7-9-2 | Best of 50 on validation is optimistic | Selection bias. Correct. |
| f7-9-3 | Test set used once, at the end | Standard. Correct. |
| f7-9-6 | Validation rising from epoch 12: keep epoch 12 | Early stopping. Correct. |
| f7-9-7 | train / validation / test / shuffle jobs | Standard. Correct. |
| f7-10-5 | Overfitting: keep the best epoch | Early stopping. Correct. |
| f7-10-8 | Final score on the test set | Standard. Correct. |

# Hand verification, Phase 4: units F8 and F9

All numeric snippets, fill-ins, spot-the-bug errors, labs (F8 lab 2's backward pass is checked
against nudging inside its tests) and Library examples are executed. New figure: neuron and layer;
`src/lib/neuron.ts` is unit-tested, and the verifier checks each output goal is reachable with the
editable weights and not met at the start. Figure goals: f8-1-3 (2·1 + 1·w = 3 at w = 1, from −1),
f8-2-3 (relu(w − 2) = 2 at w = 4, from −1), f8-3-1 (row 2: −2 + 0.5 = −1.5 → 0; rows 1 and 3 give
3 and 1.5), f8-12-2 (relu(w + 2) = 3 at w = 1, from −1).

F9 runs on a NumPy stand-in for PyTorch (`src/python/epoch_torch.py`), since Pyodide has no PyTorch.
`npm run verify-torch` replays every run that uses torch (383) with real PyTorch 2.7.1 on this
machine: all printed output, error types and messages agree. Wrong variants (fill-in distractors,
other line orders) are checked only to stay wrong on real PyTorch, since their random-weight
results differ. Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| f8-1-2 | Bias shifts the sum | Added once, independent of inputs. Correct. |
| f8-1-6 | 4 inputs: 4 weights + 1 bias | Definition. Correct. |
| f8-2-4 | Probability output: sigmoid | Range (0, 1). Correct. |
| f8-3-4 | 5 neurons on 3 inputs: W is (5, 3) | One row per neuron. Correct. |
| f8-4-2 | (32, 10) @ (10, 64) = (32, 64) | Shapes. Correct. |
| f8-5-2 | W2 for 1 output after 16 hidden: (1, 16) | (outputs, inputs). Correct. |
| f8-5-6 | Forward pass: input to output | Definition. Correct. |
| f8-6-1 | \|x\| needs a ReLU between layers | relu(x) + relu(−x). Correct. |
| f8-6-4 | ReLU after hidden only, for prices | Output must reach any value. Correct. |
| f8-6-7 | No activations: one linear layer | Product of matrices. Correct. |
| f8-7-2 | forward returns Z1, H for backward | Used in dW1 and the ReLU mask. Correct. |
| f8-7-7 | Loss is one number to minimise | Gradient descent on a scalar. Correct. |
| f8-8-2 | dL/dw = −16: raise w | Step against the sign. Correct. |
| f8-8-6 | Backwards: each step needs the gradient above | Chain rule. Correct. |
| f8-9-2 | db sums over examples | b broadcast to every row. Correct. |
| f8-10-2 | ReLU slope 1 if positive, else 0 | Definition (0 at 0, as in PyTorch). Correct. |
| f8-10-5 | Always-negative input: weights stop changing | Dead ReLU. Correct. |
| f8-11-2 | Rising loss after new backward: nudge-check | Gradient check. Correct. |
| f8-11-6 | Nudge 6 vs backprop 3: bug | Central differences are accurate to ~1e-8. Correct. |
| f8-12-4 | 10 neurons × 20 inputs: 200 weights, 10 biases | Counting. Correct. |
| f8-12-6 | Activations stop layers merging | As f8-6-7. Correct. |
| f9-1-3 | torch.tensor([1, 2, 3]) is int64 | PyTorch docs; executed in f9-02 card. Correct. |
| f9-2-2 | backward: gradients for tracked tensors | Autograd docs. Correct. |
| f9-2-7 | Autograd replaces hand-written dW | Same mathematics. Correct. |
| f9-3-2 | Clear grads: they accumulate | Executed in f9-3-1. Correct. |
| f9-3-7 | no_grad: not recorded | Docs. Correct. |
| f9-4-2 | Linear(4, 8).weight is (8, 4) | Docs; executed in the f9-04 card. Correct. |
| f9-4-7 | Linear computes x @ W.T + b | Docs. Correct. |
| f9-5-3 | forward wires the layers | Docs. Correct. |
| f9-6-2 | Digits: CrossEntropyLoss | Multi-class. Correct. |
| f9-6-7 | No softmax before CrossEntropyLoss | It applies log-softmax (docs). Correct. |
| f9-7-2 | step moves parameters downhill | SGD: p −= lr·grad. Correct. |
| f9-7-6 | Adam adapts per-parameter steps | Kingma & Ba. Correct. |
| f9-8-3 | zero_grad before backward | Accumulation. Correct. |
| f9-8-6 | Full-batch epoch: one pass | Definition. Correct. |
| f9-9-2 | Shuffle: new batches each epoch | Standard. Correct. |
| f9-9-6 | Smaller batches: more, noisier steps | Standard. Correct. |
| f9-10-2 | "same device" error: model and data apart | Message text. Correct. |
| f9-10-4 | .to: model once, every batch | Standard. Correct. |
| f9-10-7 | is_available keeps code portable | Standard. Correct. |
| f9-11-1 | (64x3 and 4x8): 3 features, layer wants 4 | mat1 is the batch, mat2 is W.T. Correct. |
| f9-11-6 | "expected Long": labels .long() | Executed in f9-6-3. Correct. |
| f9-12-2 | five lines ↔ five jobs | As taught. Correct. |
| f9-12-5 | First line: pred = model(x) | Everything depends on it. Correct. |
| f9-12-7 | No zero_grad: gradients pile up | Executed in f9-7-3. Correct. |
| f9-13-5 | Batch loop inside the epoch loop | Standard. Correct. |
| f9-14-3 | predict, loss, zero_grad, backward, step | As taught (zero_grad may come first). Correct. |
| f9-14-8 | No GPU: choose the device with is_available | As f9-10-7. Correct. |

# Hand verification, Phase 4: unit E11 (Interview practice)

Sources: the plan document's interview-prep list (topics only: RAG vs fine-tuning vs long context,
evaluating an LLM app, reducing hallucinations, latency and cost, prompt injection, when not to use an
agent; four practice designs: support chatbot over 10,000 documents, document extraction, data-analysis
agent, code-review assistant); Anthropic, "Building effective agents"; OWASP Top 10 for LLM Applications
2025 (LLM01 prompt injection, LLM06 excessive agency); units E3-E7 of this app. All arithmetic, design
pipelines (written with step(), so a wrong order fails when run), coding patterns, labs and the Library
example are executed. Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| e11-1-1 | 10,000 changing pages: RAG | Large, changing, needs citations. Correct. |
| e11-1-2 | Style still wrong after prompting, 5,000 examples: fine-tune | Behaviour, prompting exhausted. Correct. |
| e11-1-3 | One fixed 40-page contract: long context | Fits the window (~30k tokens). Correct. |
| e11-1-5 | changing → RAG; short manual → long context; style → fine-tuning | As taught. Correct. |
| e11-2-1 | Start with a golden set of real questions | Standard practice. Correct. |
| e11-2-2 | total → exact; answer → rubric judge; retrieval → hit rate; spam → P/R | E5. Correct. |
| e11-2-5 | Check a judge against your own labels | Judge biases are documented. Correct. |
| e11-2-8 | 82 → 84% on 50 is one question: look closer | 1/50 is within noise. Correct. |
| e11-3-1 | Answer only from retrieved policy text | Grounding. Correct. |
| e11-3-4 | Temperature: consistency, not truth | Greedy decoding still errs. Correct. |
| e11-3-5 | Check claims against the cited text | Citation existence ≠ support. Correct. |
| e11-3-8 | Uncovered questions: say so, offer a human | Refusal. Correct. |
| e11-4-2 | p95: the mean hides the slow tail | Executed numbers in e11-4-3. Correct. |
| e11-4-4 | Streaming improves time to first token | Same total generation. Correct. |
| e11-4-7 | Repeated preamble: prompt caching, trim | Provider prompt caching. Correct. |
| e11-4-8 | Routing: check quality on routed traffic | Before/after. Correct. |
| e11-5-1 | Fetched page with instructions: injection | Indirect injection. Correct. |
| e11-5-2 | Email-sending agent: human approval | Control outside the model. Correct. |
| e11-5-4 | Indirect: arrives via fetched content | OWASP LLM01. Correct. |
| e11-5-7 | Read-only DB user | Least privilege (LLM06). Correct. |
| e11-5-8 | System prompts help but cannot be relied on | One token stream. Correct. |
| e11-6-2 | Invoice fields: one structured call | Fixed steps. Correct. |
| e11-6-3 | Unknown repo bug: agent | Steps depend on findings. Correct. |
| e11-6-4 | Classify then route: workflow | Routing pattern. Correct. |
| e11-6-6 | form → one call; summarise+translate → chain; web research → agent | As taught. Correct. |
| e11-6-7 | Why no agent: fixed steps, cost and risk | Trade-off. Correct. |
| e11-7-3 | Chunks of a few hundred tokens | Common default; tune on golden set. Correct. |
| e11-7-4 | Error codes: hybrid search | Exact tokens + meaning (E6). Correct. |
| e11-7-5 | Passage not retrieved: fix retrieval | Generation never saw it. Correct. |
| e11-7-8 | Daily changes: re-embed changed pages | Incremental indexing. Correct. |
| e11-8-2 | Schema checks shape, not truth | Business rules. Correct. |
| e11-8-5 | Still failing after retry: human queue | Bounded retries. Correct. |
| e11-8-7 | 50,000/day: small model, escalate failures | Routing on validation. Correct. |
| e11-9-2 | Read-only with row and time limits | Least privilege. Correct. |
| e11-9-3 | Schemas and sample rows in the prompt | Code reads the data. Correct. |
| e11-9-6 | Show the query and result table | Verifiability. Correct. |
| e11-9-8 | Injected cell: results are data, no email tool | Least privilege. Correct. |
| e11-10-2 | Precision (comments acted on) | Noise gets ignored. Correct. |
| e11-10-4 | Huge diff: per file, skip generated | Context limits. Correct. |
| e11-10-5 | Bot can comment, never approve | Excessive agency. Correct. |
| e11-10-8 | Same issue 12 times: one grouped comment | Noise. Correct. |
| e11-11-8 | Retry 429 and 5xx | E2. Correct. |
| e11-12-1 | 2 million pages, citations: RAG | As e11-1-1. Correct. |
| e11-12-3 | Hallucinations: ground in sources | As e11-3-1. Correct. |
| e11-12-10 | Five categories: one classification call | Fixed step. Correct. |
