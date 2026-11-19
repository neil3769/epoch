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

# Hand verification, Phase 4: unit E8 (Shipping a service)

Docs checked 2026-11-16: uv Docker guide (uv 0.13.8; `uv sync --locked`; copy lock files before the
code for caching), uv GitHub Actions guide (actions/checkout v7, astral-sh/setup-uv v9,
`uv sync --locked`, `enable-cache`), FastAPI async tests (`AsyncClient(transport=ASGITransport(app=app))`),
Compose (compose.yaml preferred; top-level `version` obsolete; short `depends_on` does not wait for
health), docker/build-push-action v7. FastAPI 0.136.1, Pydantic 2.12 and PyYAML run in Pyodide, so every
endpoint, test, setting and YAML exercise is executed; handlers are `async def` (no threads in Pyodide).
The Docker cache model `rebuilt()` is a simplification (COPY sources only). Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| e8-1-2 | Sending a question: POST | HTTP semantics. Correct. |
| e8-1-6 | 404: nothing at that path or id | RFC 9110. Correct. |
| e8-1-7 | 200 OK, 404 not found, 422 invalid, 500 server error | FastAPI conventions. Correct. |
| e8-2-4 | response_model: only declared fields leave | Executed in e8-2-3. Correct. |
| e8-2-7 | Validation before the handler runs | FastAPI docs. Correct. |
| e8-3-2 | Provider down: 503 | RFC 9110 (502/504 also defensible; 503 offered). Correct. |
| e8-3-6 | Valid but empty: 400 (or min_length → 422) | Convention. Correct. |
| e8-3-7 | order 404, missing field 422, provider 503, bug 500 | As taught. Correct. |
| e8-4-2 | Test valid, missing field, blank | Coverage of each outcome. Correct. |
| e8-4-6 | ASGITransport: fast, no ports or network | FastAPI docs. Correct. |
| e8-5-2 | Production key in the host's secrets | Standard practice. Correct. |
| e8-5-3 | .env in .gitignore | Standard practice. Correct. |
| e8-5-7 | Model choice from an env var | Twelve-factor config. Correct. |
| e8-6-1 | python:3.12-slim: small image with Python | Docker Hub image docs. Correct. |
| e8-6-2 | RUN at build, CMD at start | Dockerfile reference. Correct. |
| e8-6-3 | FROM base, COPY files, RUN build, CMD start | Dockerfile reference. Correct. |
| e8-6-5 | Unreachable: port not published or bound to 127.0.0.1 | Docker networking. Correct. |
| e8-6-6 | ModuleNotFoundError: code never copied | The Dockerfile shown copies only lock files. Correct. |
| e8-6-7 | Pin versions for repeatable builds | uv docs pin uv. Correct. |
| e8-7-3 | Lock files first: code edits skip install | Executed with rebuilt() in e8-7-1/2. Correct. |
| e8-7-5 | .dockerignore: .venv, .git, .env | uv docs recommend .venv. Correct. |
| e8-7-7 | .env in image via COPY . . | Build context. Correct. |
| e8-8-1 | "8080:8000": host 8080 | Compose ports HOST:CONTAINER. Correct. |
| e8-8-3 | Reach the db by service name | Compose networking. Correct. |
| e8-8-4 | `version:` obsolete | Compose spec page. Correct. |
| e8-8-6 | Short depends_on waits for start, not health | Compose spec page. Correct. |
| e8-8-8 | Password from untracked .env | Compose interpolation. Correct. |
| e8-9-1 | checkout first: runner starts empty | Actions docs. Correct. |
| e8-9-3 | @v7 pins the major version | Actions docs. Correct. |
| e8-9-4 | secrets.* from repository secrets | Actions docs. Correct. |
| e8-9-6 | A failing step fails the job | Actions default. Correct. |
| e8-9-8 | on / runs-on / uses / run | Actions syntax. Correct. |
| e8-10-1 | Lint and test before the slow build | Fail fast. Correct. |
| e8-10-3 | CI ModuleNotFoundError: dependency not declared | Clean environment. Correct. |
| e8-10-5 | Push images only from main after tests | Standard practice. Correct. |
| e8-10-7 | Slow installs: cache uv downloads | setup-uv enable-cache. Correct. |
| e8-11-1 | Ignoring $PORT: health checks fail | Render/Cloud Run docs pattern. Correct. |
| e8-11-3 | Health endpoint: readiness for the host | Standard practice. Correct. |
| e8-11-5 | Broken deploy: roll back first | Standard practice. Correct. |
| e8-11-7 | Errors after deploy: the host's logs | Standard practice. Correct. |
| e8-11-8 | Managed host saves OS updates, TLS, scaling | Trade-off. Correct. |
| e8-12-2 | Missing order: HTTPException(404) | As e8-3. Correct. |
| e8-12-6 | Compose: db:5432, not localhost | As e8-8-3. Correct. |
| e8-12-8 | Key in the host's secret settings | As e8-5-2. Correct. |
| e8-12-10 | Errors after deploy: roll back, then investigate | As e8-11-5. Correct. |

# Hand verification, Phase 4: unit E9 (Cost, latency, observability)

All cost, percentile, span, log, routing, cache and table exercises run against the simulated services
(sim.LOGS, sim.PRICES, FakeLLM on the virtual clock; prelude span() and chat()). Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| e9-1-2 | Output tokens cost several times more | Provider price lists (here 5×). Correct. |
| e9-1-7 | Costs doubled, same traffic: check tokens per request | Cost = tokens × price. Correct. |
| e9-2-2 | p95 2 s: 1 in 20 requests ≥ 2 s | Definition. Correct. |
| e9-2-5 | Feels slow with streaming: time to first token | Perceived latency. Correct. |
| e9-2-8 | Mean dragged by outliers | Executed in e9-2-1. Correct. |
| e9-3-1 | Fix the 1.2 s llm span first | Largest span. Correct. |
| e9-3-3 | Independent tools: run concurrently | max instead of sum. Correct. |
| e9-3-6 | Traces show where the time went | Definition. Correct. |
| e9-3-8 | Slow first token: long prompt or busy provider | Prefill time grows with prompt length. Correct. |
| e9-4-2 | Request id finds one request's trace | Correlation ids. Correct. |
| e9-4-5 | Log prompts only redacted, time-limited | Privacy practice (OWASP LLM02). Correct. |
| e9-4-8 | "error" ×300 without fields: needs structure | Structured logging. Correct. |
| e9-5-2 | Escalate on a check code can verify | Self-confidence unreliable. Correct. |
| e9-5-4 | Before/after needs quality too | As taught. Correct. |
| e9-5-8 | Routing not worth it when most need large | Every request pays twice. Correct. |
| e9-6-3 | New system prompt: old entries stale; version the key | Cache invalidation. Correct. |
| e9-6-4 | Do not cache live data (or short TTL) | Staleness. Correct. |
| e9-6-7 | Semantic cache: close questions, different answers | Embedding near-misses. Correct. |
| e9-7-1 | −65% cost, −53% p95, score 0.86→0.85 holds | Executed numbers. Correct. |
| e9-7-3 | Two changes at once: effects not attributable | Experimental design. Correct. |
| e9-7-6 | Same golden set so only the change differs | Experimental design. Correct. |
| e9-7-8 | Table: cost, p50, p95, quality | As taught. Correct. |
| e9-8-2 | p95 doubled: open the slowest traces | As e9-3. Correct. |
| e9-8-7 | Key only on question: old model's answers return | As e9-6-3. Correct. |
| e9-8-9 | Cheaper but worse: report the trade-off | As taught. Correct. |

# Hand verification, Phase 4: unit E10 (Safety)

Injection demos run against the prelude's toy model `gullible()` (FakeLLM replying with whatever
follows the last "Instruction: say"); redaction, allowlist, validation, escaping, rate-limit and
fallback exercises all run. Risk names checked against the OWASP Top 10 for LLM Applications
(2025 edition on genai.owasp.org; a 2026 update reorders it, reported by one secondary source,
so the unit never asks for rank numbers). Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| e10-1-1 | Planted page instructions obeyed: prompt injection | OWASP LLM01 (indirect). Correct. |
| e10-1-2 | Another customer's address in a reply: sensitive information disclosure | OWASP LLM02. Correct. |
| e10-1-3 | 300 refunds from one message: excessive agency | OWASP excessive agency (permissions/autonomy). Correct. |
| e10-1-4 | Reply inserted as raw HTML: improper output handling | OWASP improper output handling (XSS). Correct. |
| e10-1-5 | Thousands of huge requests: unbounded consumption | OWASP unbounded consumption (denial of wallet). Correct. |
| e10-1-6 | "Repeat everything above": system prompt leakage | OWASP system prompt leakage. Correct. |
| e10-1-7 | Risk → first defence pairs | OWASP mitigations for each entry. Correct. |
| e10-1-8 | False docs uploaded to the index: data poisoning | OWASP data poisoning / vector and embedding weaknesses. Correct. |
| e10-2-2 | Hidden text in an email: indirect injection | Definition (content, not the user). Correct. |
| e10-2-4 | Defence that survives a fooled model: limited tools | Least privilege. Correct. |
| e10-2-7 | No tools, public docs only: little risk | Impact bounded by reach. Correct. |
| e10-3-2 | API key in the server environment | Secrets never in context. Correct. |
| e10-3-3 | Secret code in the system prompt can leak | Prompt is not a secret store. Correct. |
| e10-3-7 | Leaked prompt: keep nothing secret in it | As OWASP system prompt leakage guidance. Correct. |
| e10-4-2 | Draft-only assistant: read and draft tools | Least privilege. Correct. |
| e10-4-3 | Approval threshold in the tool's code | Enforcement outside the model. Correct. |
| e10-4-7 | 400 paid calls: step and spend limits | Unbounded consumption / agent loop caps. Correct. |
| e10-5-3 | Model-written arithmetic: strict pattern, not eval | Simulator calculator does exactly this. Correct. |
| e10-5-5 | Invented policy: ground and cite | Misinformation mitigation. Correct. |
| e10-5-8 | Validate before anything acts | As taught. Correct. |
| e10-6-2 | 400: do not fall back | Client error repeats anywhere. Correct. |
| e10-6-5 | Backup's different JSON: one schema for both | Shared contract. Correct. |
| e10-6-7 | Both down: short message, details in logs | Error-handling practice. Correct. |
| e10-6-8 | Main failing for 10 min: skip it for a while | Circuit breaker. Correct. |
| e10-7-1 | README told agent to upload .env: injection + excessive agency | Both entries. Correct. |
| e10-7-3 | System prompt holds tone and scope only | As e10-3. Correct. |
| e10-7-5 | Summariser asking to send email: refuse | Least privilege; sends are irreversible. Correct. |
| e10-7-10 | "Filter solves injection": helps, still limit tools | Defence in depth. Correct. |

# Hand verification, Phase 4: unit F10 (Text as numbers)

Every tokenizer, vocabulary, BPE, embedding, cosine and search exercise is executed (prelude:
VOCAB/IDS, merge, pieces, toy table E with columns animal/fruit/vehicle, N, cos). Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| f10-1-5 | "cat" vs "cat.": one word learned twice | Separate vocabulary entries share nothing. Correct. |
| f10-2-4 | <unk> exists because text holds words the vocabulary lacks | Definition. Correct. |
| f10-2-7 | A token's id is its position in the vocabulary | As built in IDS. Correct. |
| f10-3-5 | Subwords: any word can still be spelled | BPE / byte-level fallback. Correct. |
| f10-3-7 | 4,000 English characters ≈ 1,000 tokens | ~4 chars/token rule of thumb for English BPE tokenizers. Correct. |
| f10-3-8 | Rare words cost more tokens | Split into more pieces. Correct. |
| f10-4-4 | Ids are arbitrary labels, so look up embeddings | As taught. Correct. |
| f10-4-8 | Real embedding tables are learned by training | Embedding layer is a weight matrix. Correct. |
| f10-5-3 | apple–pear most similar | Executed in its code (0.99 vs 0.12 vs 0.12). Correct. |
| f10-5-7 | Cosine so length does not count | As taught (f10-5-2 executed). Correct. |
| f10-6-7 | Simplest sentence vector: average token embeddings | Mean pooling. Correct. |
| f10-6-8 | 10 M rows: exhaustive scoring too slow; approximate indexes | ANN indexes (HNSW, IVF). Correct. |
| f10-7-4 | Never <unk>: falls back to characters/bytes | Byte-level BPE. Correct. |
| f10-7-7 | Id → embedding is a row lookup | As f10-4-5. Correct. |
| f10-7-10 | RAG retrieval uses embeddings and search | Unit E6. Correct. |

# Hand verification, Phase 4: unit F11 (Attention and transformers)

All weighted-average, score, softmax, attention, mask, head-shape, position, block, logit and
generation exercises are executed (prelude: softmax, causal, attention, norm, and the stand-in
next_logits lookup over TOK). Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| f11-1-4 | "it" should weight "cat" most | Coreference; the classic attention example. Correct. |
| f11-1-6 | Weights sum to 1 so the result stays a blend | Convex combination. Correct. |
| f11-2-4 | S[i, j]: query i against key j | Q @ K.T definition. Correct. |
| f11-2-8 | Separate query and key: seeking ≠ offering | Vaswani et al. 2017 roles. Correct. |
| f11-3-4 | √d because dot products grow with d | Vaswani et al. 2017 §3.2.1. Correct. |
| f11-3-8 | Zero weight only from −∞ | exp is positive everywhere. Correct. |
| f11-4-5 | V holds what each token passes on | Definition. Correct. |
| f11-4-7 | Doubling length → 4× weight matrix | n × n. Correct. |
| f11-5-2 | Wq, Wk, Wv set by training | Learned projections. Correct. |
| f11-5-5 | "Self": Q, K, V from one text (cross-attention otherwise) | Definition. Correct. |
| f11-6-3 | Mask stops reading the answer during training | Next-token objective. Correct. |
| f11-6-8 | BERT-style encoders need no causal mask | Bidirectional encoders. Correct. |
| f11-7-4 | Several heads track several relations | Multi-head attention rationale. Correct. |
| f11-7-8 | Joined heads mixed by an output matrix Wo | Vaswani et al. 2017 MultiHead. Correct. |
| f11-8-2 | Without positions, word order is lost | Permutation equivariance (card executes it). Correct. |
| f11-8-7 | 1,024-row learned table: no vectors past 1,024 | GPT-2 n_ctx = 1024; RoPE rotates Q/K. Correct. |
| f11-9-2 | Residual gives a direct path through the stack | He et al. 2016; gradient flow. Correct. |
| f11-9-4 | MLP works on each token alone | Position-wise FFN (f11-9-5 executes it). Correct. |
| f11-9-8 | Each block has its own weights | GPT-2: 12 distinct blocks. Correct. |
| f11-10-3 | Last position alone has seen every token | Causal mask. Correct. |
| f11-10-7 | Trained by predicting next tokens of real text | Language-model objective, cross-entropy. Correct. |
| f11-11-2 | Stop at an end token or length limit | max_tokens / EOS. Correct. |
| f11-11-7 | Sampling avoids repetitive greedy text | Holtzman et al. 2020 (degeneration). Correct. |
| f11-11-8 | One model run per generated token | Autoregressive decoding; KV cache. Correct. |
| f11-12-3 | Key decides weight, value is passed on | As taught. Correct. |
| f11-12-5 | Scores 40, 10 with d = 1600 become 1 and 0.25 | √1600 = 40. Correct. |
| f11-12-7 | No positions: order lost | As f11-8-2. Correct. |
| f11-12-10 | Dull repeated answers: raise temperature | As f11-11-4. Correct. |

# Hand verification, System Design SD-1: units S1 (How a request travels) and S2 (Estimation)

Estimates are recomputed by the verifier from their Python expressions with the Numbers page values
(content/numbers.ts; latency rows from the Dean/Norvig table, video from Netflix's "about 3 GB per
hour for HD"). Diagram goals are checked structurally (nodes exist, paths follow edges, slot kind
matches). Python snippets are executed. Judgement items below re-derived from the stated
requirements; sources are general mechanisms (RFC 9110 HTTP semantics, RFC 8446 TLS 1.3,
RFC 9293 TCP, RFC 1034/1035 DNS) rather than product behaviour.

| Exercise | Answer | Re-derivation |
|---|---|---|
| s1-1-2 | Client: draw page, scroll position, play video; server: password check, store order, email | Trust and durability live server side. Correct. |
| s1-1-3 | Browser not to DB: anyone could read/change everything | Server enforces authorisation. Correct. |
| s1-1-5 | Request → check → write → respond → show | Respond after durable write. Unique order. Correct. |
| s1-1-7 | One-phone offline to-do: keep on device | Needs exclude server (offline, no sharing). Correct. |
| s1-1-8 | Server = program answering requests | Role definition. Correct. |
| s1-2-1 | Resolver → root → TLD → authoritative → cache | RFC 1034 iterative resolution. Correct. |
| s1-2-3 | Old address served from caches until TTL | RFC 1035 TTL semantics. Correct. |
| s1-2-4 | Lower TTL days ahead | Standard migration practice; other options violate a stated need. Correct. |
| s1-2-8 | Cache because lookups cost round trips | As taught. Correct. |
| s1-3-3 | DNS → TCP → TLS → request → response | RFC 9293 / RFC 8446 ordering. Correct. |
| s1-3-4 | Keep-alive skips setup round trips | RFC 9112 persistent connections. Correct. |
| s1-3-6 | Edge servers near users | Handshakes over short distance; server time is only 50 ms. Correct. |
| s1-3-8 | TLS 1.3 saves one round trip per new connection | RFC 8446 1-RTT full handshake vs 2-RTT in TLS 1.2. Correct. |
| s1-4-1 | GET, PUT, DELETE idempotent; POST, POST, PATCH-add not | RFC 9110 §9.2.2. Correct. |
| s1-4-2 | Create order: POST | RFC 9110 §9.3.3. Correct. |
| s1-4-5 | Idempotency key for retried payments | Other options break a stated need. Correct. |
| s1-4-8 | GET must be safe: caches/prefetchers repeat it | RFC 9110 §9.2.1. Correct. |
| s1-5-1 | 200/301/404/429/503 meanings | RFC 9110, RFC 6585 (429). Correct. |
| s1-5-2 | Retry later: 429, 503, 504; fix: 400, 404, 422 | Transient vs request errors. Correct. |
| s1-5-4 | Honour Retry-After 30 | RFC 9110 §10.2.3. Correct. |
| s1-5-5 | Wrong password: 401 | RFC 9110 §15.5.2. Correct. |
| s1-5-8 | 500 on emoji: server bug | 5xx = server failure; bad input deserves 4xx. Correct. |
| s1-6-3 | Latency: closer servers, fewer round trips, TLS 1.3; throughput: more servers, batches, workers | Definitions. Correct. |
| s1-6-4 | More servers, not overloaded: same latency | Per-request work unchanged. Correct. |
| s1-6-6 | Arrivals 500 > capacity 400: add capacity | Queueing: backlog grows otherwise. Correct. |
| s1-6-8 | "Slow": look at time per request | Latency complaint. Correct. |
| s1-7-4 | 1% of a million = 10,000 slow a day | Arithmetic. Correct. |
| s1-7-6 | B (p99 300 ms) for 20 calls/page | 1 − 0.99²⁰ ≈ 18% of pages hit A's tail. Correct. |
| s1-8-1 | Process: own memory, survives sibling crash; thread: shares memory, cheaper, can corrupt sibling | OS definitions. Correct. |
| s1-8-3 | CPU-bound Python on 8 cores: 8 processes | Default CPython GIL (free-threaded build optional). Correct. |
| s1-8-4 | Async: switches while each waits | Event loop. Correct. |
| s1-8-7 | Threads share the process memory | Definition. Correct. |
| s1-8-8 | Read, read, write, write: lost update | Matches executed s1-8-2. Correct. |
| s1-9-1 | DNS → TCP/TLS → GET → DB → 200 | As s1-3-3 plus server work. Correct. |
| s1-9-4 | Blind retry: GET, PUT, DELETE yes; POST messages/transfers no | RFC 9110 idempotency. Correct. |
| s1-9-5 | 503 from partner: retry with growing waits | Backoff (E2); others break a need. Correct. |
| s1-9-8 | TTL 6 h: caches may keep old record | As s1-2-3. Correct. |
| s1-9-10 | Several processes: crash isolation | As s1-8. Correct. |
| s2-1-1 | 2¹⁰…2⁴⁰ → thousand…trillion | Arithmetic. Correct. |
| s2-1-4 | 8 GB packed array in 16 GB RAM: keep in memory | Fits; disk breaks latency need. Correct. |
| s2-1-5 | 1 TB ≈ 10¹² bytes | SI prefixes. Correct. |
| s2-1-8 | 3.7 vs 4.4 TB: useful, same magnitude | Estimation purpose. Correct. |
| s2-2-3 | Day ≈ 10⁵ s: easy maths, ~16% off | 86,400 vs 100,000. Correct. |
| s2-2-5 | Reads: feed, search, profile; writes: post, like, message | Definitions. Correct. |
| s2-2-8 | 100:1 read-heavy, rare changes: cache reads | Others target 1% of load or are far costlier. Correct. |
| s2-3-3 | Average sizing fails at peak | As taught. Correct. |
| s2-3-4 | 7 servers (peak 6 + 1 spare) | Needs: peak and one failure. Correct. |
| s2-3-7 | Users → per day → average → peak → servers | Unique dependency chain. Correct. |
| s2-4-4 | ~1 KB: bio, chat, order; 100s KB+: photo, voice note, clip | Typical sizes (Numbers page). Correct. |
| s2-4-6 | 100 TB/yr photos: object storage, ids in DB | Standard split; others break a need. Correct. |
| s2-4-8 | 3 copies: hardware fails | Durability. Correct. |
| s2-5-4 | 1 Gbps ≈ 125 MB/s | ÷ 8. Correct. |
| s2-5-6 | 80 GB/s worldwide HD: CDN | Others break a stated need. Correct. |
| s2-6-6 | Standby DB that takes over | Redundancy; others do not prevent failures. Correct. |
| s2-6-7 | 2 h outage vs 99.9%/month (43 min): missed | Arithmetic. Correct. |
| s2-7-3 | Under 1 ms: RAM, SSD, DC RTT; over: seek, world RTT, 1 MB @ 1 Gbit (8 ms) | Numbers page. Correct. |
| s2-7-5 | 5 sequential cross-ocean queries: move app beside DB | 5 × 150 ms dominates. Correct. |
| s2-7-7 | Memory ~1,000× faster than SSD | 100 ns vs 150 µs. Correct. |
| s2-8-8 | 8 sequential calls 100 ms away: one batched call | 800 ms → ~100 ms. Correct. |
| s2-8-9 | 2³⁰ ≈ a gigabyte | Arithmetic. Correct. |
| s2-8-10 | Items → bytes → days → copies → units | Unique chain. Correct. |

# Hand verification, System Design SD-2: units S3 (Scaling out) and S4 (Caching and CDNs)

Balancer and cache figure goals are checked by the verifier against every state the controls can
reach (goal reachable, not met at the start); the same simulators are unit-tested
(tests/figures-sd.test.ts). Estimates are recomputed from their expressions; code runs in Pyodide
with sim.FakeDB on the virtual clock. Judgement items, re-derived from the stated requirements and
the general mechanisms (HTTP caching per RFC 9111 and MDN's HTTP caching guide for CDN items):

| Exercise | Answer | Re-derivation |
|---|---|---|
| s3-1-1 | Vertical: no code change, ceiling, pricier per core; horizontal: survives a failure, needs a balancer, needs statelessness | Definitions. Correct. |
| s3-1-2 | 80% CPU, 10%/month growth: bigger DB machine first | Cheapest option meeting "a year of headroom, little effort". Correct. |
| s3-1-4 | App servers scale out easily: they keep no data | Statelessness. Correct. |
| s3-1-7 | Beyond the biggest machine: scale out | Only remaining option. Correct. |
| s3-1-8 | One box, separate DB, balancer and app servers, read replicas, sharding | Common growth order; each step depends on the previous. Correct. |
| s3-2-4 | Shared: session, cart, upload; per server: template cache, start-up config | Loss test. Correct. |
| s3-2-5 | Random logouts after adding a server: shared session store | Pinning breaks "survive restarts". Correct. |
| s3-2-6 | Stateless: nothing kept between requests | Definition. Correct. |
| s3-2-8 | Upload on one server, shown by another: object storage | Shared, durable. Correct. |
| s3-3-4 | 50 ms vs 30 s reports: least connections | Uneven costs (figure s3-3-1 demonstrates). Correct. |
| s3-3-5 | Round robin fine when requests cost the same | As taught. Correct. |
| s3-3-8 | Server twice as powerful: weighted round robin | Standard balancer feature. Correct. |
| s3-4-2 | Crash, failed checks, removed, others serve, passes, back | Health-check lifecycle. Correct. |
| s3-4-4 | Health check tests the server's own critical parts briefly | Avoids false passes and fleet-wide removal on shared outages. Correct. |
| s3-4-5 | Several failures before removal: ignore blips | Threshold rationale. Correct. |
| s3-4-7 | Removal does not restore lost capacity | As taught (s3-4-6 estimate). Correct. |
| s3-5-3 | SPOF: single DB, shared power feed, one person; not: 3 app servers, 3-node queue | SPOF definition incl. shared dependencies. Correct. |
| s3-5-5 | Minutes after machine fault: standby to promote | Backups take hours; reliable hardware still fails. Correct. |
| s3-5-6 | Primary dies, heartbeats missed, promote, reconnect, new standby | Failover order. Correct. |
| s3-5-7 | Two servers, one switch: partly redundant | Shared switch is a SPOF. Correct. |
| s3-5-8 | Cost of removing a SPOF: another copy plus switching logic | As taught. Correct. |
| s3-6-3 | Known 20:00 spike, 5-minute autoscale lag: pre-scale at 19:45 | Others break a stated need. Correct. |
| s3-6-4 | Do not scale down at once: load bounces (flapping) | Cool-down rationale. Correct. |
| s3-6-5 | Good signals: CPU, requests per server, backlog per worker; poor: registered users, log size | Current load per unit. Correct. |
| s3-6-8 | Target 60% CPU: headroom during start-up | Lag coverage. Correct. |
| s3-7-4 | Pinning downsides: uneven load, fragile state | As taught. Correct. |
| s3-7-5 | Chat connections: route by user with a hash ring | Message must reach the connection's server; servers added later. Correct. |
| s3-7-6 | Sticky: chat connection, per-user cache shard; any: stateless API, image, shared-session login | As taught. Correct. |
| s3-7-8 | Prefer stateless: any server can take over | As taught. Correct. |
| s3-8-1 | Full stateless app servers, growth, survive a failure: scale out | Cheaper and no ceiling; browser caching adds no capacity. Correct. |
| s3-8-5 | 10 ms to 20 s requests: least connections | As s3-3-4. Correct. |
| s3-8-7 | Threshold, start, boot, health checks, traffic | Autoscaling order. Correct. |
| s3-8-10 | Black Friday: autoscaling too slow; scale ahead | As s3-6-3. Correct. |
| s4-1-5 | A miss costs the full slow path | Definition. Correct. |
| s4-1-6 | Good: product page, countries, exchange rates (short TTL); poor: one-off report, balance in transfer | Read often, changes rarely, tolerates age. Correct. |
| s4-1-8 | Indexed 800 ms aggregate, 500 views/min, minutes-old fine: cache 5 minutes | Others fail the needs. Correct. |
| s4-2-1 | Look, miss, read DB, store, return | Cache-aside. Correct. |
| s4-2-5 | Cache down in cache-aside: reads slower via DB | App falls back. Correct. |
| s4-2-6 | Bot misses: cache "not found" for 60 s | Negative caching; forever breaks the new-user need. Correct. |
| s4-3-1 | Write-through: waits for DB, never behind; write-back: fastest, can lose, coalesces | Definitions. Correct. |
| s4-3-2 | View counters: count in cache, save often | Write-back; loss tolerated by need. Correct. |
| s4-3-3 | Balances: write-through or no cache | "No lost money, current balances". Correct. |
| s4-3-6 | Fresh after every write: write-through | As taught (delete-on-write noted). Correct. |
| s4-3-7 | Write cache, mark dirty, acknowledge, flush later | Write-back order. Correct. |
| s4-4-4 | Short: stock price, weather; long: description, countries, published article | Rate of change. Correct. |
| s4-4-6 | TTL limits staleness, no guarantee | RFC 9111 freshness lifetime. Correct. |
| s4-4-8 | Checkout reads price fresh | Exact where money changes hands. Correct. |
| s4-5-3 | Write DB, delete, miss, read, store | Delete after write avoids re-caching the old value. Correct. |
| s4-5-6 | TTL as safety net for missed deletes | Crash between write and delete. Correct. |
| s4-5-7 | 20 local caches, stale prices: one shared cache | Meets "everywhere within seconds" and fast reads. Correct. |
| s4-6-5 | Hit rate fell after catalogue doubled: more cache memory | Working set outgrew cache. Correct. |
| s4-6-7 | FIFO about equals LRU when keys are rarely reread | No reuse to exploit. Correct. |
| s4-6-8 | Full cache, 30% hits: hot data does not fit | Working set vs size. Correct. |
| s4-7-3 | First miss marks, others wait, read DB, write and clear, others read | Single-flight. Correct. |
| s4-7-5 | Synchronised 10-minute expiry spikes: jitter | Cause is aligned expiry. Correct. |
| s4-7-6 | Stale-while-revalidate: old value now, refresh behind | RFC 5861 semantics. Correct. |
| s4-8-3 | CDN: logo, versioned script, product photo; not: account page, POST checkout, personalised feed | Public and identical vs private or writes. Correct. |
| s4-8-4 | Versioned names cache for a year | Content-hashed names change per release. Correct. |
| s4-8-5 | Unversioned logo fix within minutes: purge | Others fail the need. Correct. |
| s4-8-8 | Per-user pages not safely cached at a CDN by default | Cache-Control: private (RFC 9111). Correct. |
| s4-9-1 | Cache: fragment, feature flags, top 10; fresh: permission check, seats during booking | Exactness. Correct. |
| s4-9-2 | Order history under a shared key: user id in the key | Privacy. Correct. |
| s4-9-3 | Cache vs DB disagree: DB is right | Source of truth. Correct. |
| s4-9-4 | Stock on pages: brief cache, exact at checkout | Checkout enforces correctness. Correct. |
| s4-9-7 | Default for a new endpoint: no cache until needed | Correctness before speed. Correct. |
| s4-10-3 | Likes at millions a second, loss tolerated: write-back | As s4-3-2. Correct. |
| s4-10-5 | Write DB, delete, miss, refill | As s4-5-3. Correct. |
| s4-10-6 | Hot key expiry knocked DB over: single-flight missing | As s4-7. Correct. |
| s4-10-9 | Cache: help article, currencies, trending; fresh: balance, admin rights | As s4-9-1. Correct. |
| s4-10-10 | Versioned names: each release has a new name | As s4-8-4. Correct. |

# Hand verification, System Design SD-3: S5 (Databases) and the URL shortener walkthrough

SQL exercises run against real SQLite (Python's sqlite3 in Pyodide 314.0.8, SQLite 3.39); query
plans are SQLite's own EXPLAIN QUERY PLAN output. Product-specific claims kept to one: PostgreSQL's
default isolation level is Read Committed (PostgreSQL documentation, "Transaction Isolation").
Judgement items:

| Exercise | Answer | Re-derivation |
|---|---|---|
| s5-1-4 | Good user key: a generated id | Names repeat; emails change. Correct. |
| s5-1-6 | Good keys: auto-increment, UUID, shop order number; poor: full name, phone | Unique, non-null, immutable. Correct. |
| s5-1-8 | Placeholders: values cannot change the query | SQL injection prevention. Correct. |
| s5-2-3 | user_id instead of copies: each fact in one place | Normalisation. Correct. |
| s5-2-8 | 51 queries for 50 rows: one join | N+1 problem. Correct. |
| s5-3-1 | KV: sessions, page cache; document: varying products, post with comments; relational: payments, inventory | Access patterns. Correct. |
| s5-3-3 | Sessions: key-value store with TTLs | Sub-ms lookups, expiry. Correct. |
| s5-3-4 | KV gives up queries by anything but the key | Definition. Correct. |
| s5-3-6 | Varying attributes, one read per page: a document per product | Schema flexibility. Correct. |
| s5-3-8 | Joins, constraints, transactions: relational | As taught. Correct. |
| s5-4-1 | Wide-column: sensor readings, chat history, click events; graph: friends of friends, fraud rings | Partition+sort vs traversal. Correct. |
| s5-4-4 | 200,000 writes/s by sensor and time: wide-column | Beyond one relational node; no relationships. Correct. |
| s5-4-6 | Each hop is another self-join | Relational traversal cost. Correct. |
| s5-4-8 | Start with one store, add specialists for proven needs | Operational cost. Correct. |
| s5-5-5 | Index maps values to locations | Book-index analogy. Correct. |
| s5-5-6 | 40 M-row SCAN on user_id: add an index | Plan shows SCAN. Correct. |
| s5-5-8 | Do not index everything: each slows writes | Write amplification. Correct. |
| s5-6-2 | (user_id, day) helps user_id, user_id+day, user_id order by day; not day alone or total | Leftmost prefix (SQLite plans in s5-6 executed). Correct. |
| s5-6-4 | Busy query user_id+day: one index (user_id, day) | Serves the busy query with one index; rationale for column order stated. Correct. |
| s5-6-5 | (surname, first name) cannot find all Anas | Leftmost prefix. Correct. |
| s5-6-7 | Write-heavy table read by key: no extra indexes | Primary key suffices. Correct. |
| s5-7-3 | Normalised: once, one-row update; denormalised: no join, copies disagree, author name in post | Definitions. Correct. |
| s5-7-4 | Feed join bottleneck, names rarely change: copy names with background update | Measured hot read path; staleness allowed. Correct. |
| s5-7-5 | New schema: normalised by default | As taught. Correct. |
| s5-7-8 | Price paid stored in the order: a different fact | Historical value. Correct. |
| s5-8-3 | A/C/I/D meanings | Standard ACID definitions. Correct. |
| s5-8-4 | Begin, check, debit, credit, commit | Transaction order. Correct. |
| s5-8-6 | Order + stock change in one transaction | Atomicity requirement. Correct. |
| s5-8-7 | Committed then power loss: kept (durability) | Write-ahead log before commit acknowledgement. Correct. |
| s5-9-2 | Dirty read / non-repeatable read / lost update meanings | Standard anomaly definitions. Correct. |
| s5-9-3 | Uncommitted 0, read 0, charge 0, rollback | Dirty read sequence. Correct. |
| s5-9-4 | Read committed: no dirty reads but allows lost updates and non-repeatable reads; serializable: one-at-a-time, may abort | SQL standard levels. Correct. |
| s5-9-5 | Last seat race: serializable with retries | Prevents oversell; retries acceptable per need. Correct. |
| s5-9-7 | Strongest level costs waiting and retries | As taught. Correct. |
| s5-10-4 | Atomic: stock count, like counter, balance payment; version: wiki edit, long form | Short vs long changes. Correct. |
| s5-10-5 | Long admin edits: version column checked on save | Optimistic locking without blocking. Correct. |
| s5-10-6 | select … for update locks the rows it reads | Row-level locking semantics. Correct. |
| s5-10-8 | Read v7, other save v8, write where v7 matches 0 rows, reload, reapply | Optimistic retry. Correct. |
| s5-11-2 | KV: carts, flags; relational: invoices, users/orders/payments; wide-column: billion log events | Access patterns. Correct. |
| s5-11-6 | Last 100 tickets under load: atomic "where left > 0" | No oversell, no retries. Correct. |
| s5-11-7 | Email index, transaction, atomic update, version check | Problem to tool. Correct. |
| s5-11-10 | Unit price at purchase is not harmful denormalisation | As s5-7-8. Correct. |
| wus-1-1 | v1: create, redirect, aliases; later: analytics, expiry, accounts | From the interviewer's statement. Correct. |
| wus-1-2 | Most important NFR: fast, always-on redirects | Read path is the product. Correct. |
| wus-1-3 | Features, scale, quality, edge cases | Framework order. Correct. |
| wus-3-1 | POST 201; GET redirect; unknown 404; bad URL 400 | RFC 9110. Correct. |
| wus-3-2 | 302 because analytics come later | 301 is cacheable by browsers (RFC 9110 §15.4.2). Correct. |
| wus-3-3 | Request, lookup, found, 302 with Location, follow | Redirect flow. Correct. |
| wus-4-3 | Counter in base 62 (guessable acceptable) | Unique by construction; others collide. Correct. |
| wus-4-4 | Key-value or a simple table | Lookups by one key, 3 TB. Correct. |
| wus-5-3 | Stateless servers scale out | As S3. Correct. |
| wus-6-1 | Per-server blocks of 1,000 ids | No per-link coordination, unique. Correct. |
| wus-7-2 | Hot key: short in-process caches | Links immutable; one node otherwise saturated. Correct. |
| wus-7-3 | At 10×: more servers and cache first | Writes ~400/s still fine on one DB. Correct. |

# Hand verification, System Design SD-4: S6 (Databases: replication and partitioning)

Replication exercises run against sim.Replicas (leader plus followers on the virtual clock, unit
self-tested); the ring figure is checked against every state its controls reach and unit-tested;
the hash-ring lab is tested by its properties (moved keys go only to the new server, virtual nodes
lower the busiest share). Judgement items, re-derived from the general mechanisms (as described in
Kleppmann, Designing Data-Intensive Applications, chapters 5 and 6, and the Dynamo paper):

| Exercise | Answer | Re-derivation |
|---|---|---|
| s6-1-3 | Leader at its write limit: followers do not help | All writes go through the leader. Correct. |
| s6-1-4 | Leader: accepts writes, one per set; follower: applies, can be stale, can be promoted | Definitions. Correct. |
| s6-1-5 | Heavy reports: run them on a follower | Isolates read load; staleness allowed. Correct. |
| s6-2-3 | Follower OK: listings, old reports, public profiles; leader only: balance check, username check | Exactness per read. Correct. |
| s6-2-4 | Lag grows when followers fall behind under load | Load-dependent lag. Correct. |
| s6-2-5 | Change on leader, in flight, read on follower, old value, applied | Stale-read sequence. Correct. |
| s6-2-6 | Pages from followers; checkout on the leader | Approximate to show, exact to decide. Correct. |
| s6-3-3 | Leader reads just after the user's own write | Read-your-writes, per user. Correct. |
| s6-3-4 | Only the writer needs read-your-writes | Per-user guarantee. Correct. |
| s6-3-6 | Note time, request in window, read leader, sees write, back to followers | Time-window routing. Correct. |
| s6-3-8 | Cross-device: keep last-write time per user | Session-scoped state misses other devices. Correct. |
| s6-4-2 | Sync: no confirmed loss, slow follower slows writes; async: fastest, can lose, fine far away | Definitions. Correct. |
| s6-4-3 | Payments: sync near follower, async far | Semi-synchronous; meets both needs. Correct. |
| s6-4-5 | Not all sync: one slow follower stalls writes | Availability/latency cost. Correct. |
| s6-4-6 | Send, write locally, send to follower, confirm, tell app | Synchronous order. Correct. |
| s6-5-1 | Missed heartbeats, majority agrees, promote, fence, switch | Failover with fencing. Correct. |
| s6-5-4 | 2 nodes: no majority when split | Quorum arithmetic. Correct. |
| s6-5-6 | Three nodes with majority vote | Survives one failure without split brain. Correct. |
| s6-5-8 | Promote the most up-to-date follower | Least data lost. Correct. |
| s6-6-2 | Replication: reads, survival, regional copies; partitioning: data size, writes | As taught. Correct. |
| s6-6-3 | 300 GB at 40% CPU: not yet, scale up and add replicas | Sharding cost not justified. Correct. |
| s6-6-6 | Harder after sharding: cross-shard queries | Scatter-gather and distributed transactions. Correct. |
| s6-6-8 | Router picks shard, leader write, copy, confirm | Sharded + replicated write. Correct. |
| s6-7-2 | Range: ordered queries, hot newest range, splitting; hash: even load, ranges scatter | Definitions. Correct. |
| s6-7-3 | IoT: hash device id, sort by time | Spreads writes, keeps a device together. Correct. |
| s6-7-6 | Ranges unbalance as data piles into some | As taught. Correct. |
| s6-8-1 | Good: author id, random post id; poor: country, timestamp, boolean | Cardinality and spread. Correct. |
| s6-8-2 | Chat: shard by conversation id | Main query on one shard. Correct. |
| s6-8-4 | Sharded by user: "signed up today" is expensive | Not keyed by user. Correct. |
| s6-8-7 | Keep buyer key; add a seller index | Main path on one shard; derived data for the other. Correct. |
| s6-8-8 | Changing the shard key moves nearly all data | Redistribution. Correct. |
| s6-9-3 | Hot profile reads: cache in front | Reads of rarely changing data. Correct. |
| s6-9-4 | Cache: viral page, top 10, famous profile; split: like counter, flash-sale stock | Reads vs writes. Correct. |
| s6-9-6 | Splitting costs: reads combine pieces | As taught (s6-9-5 executed). Correct. |
| s6-10-5 | Moved keys must be refilled or copied | Cache miss storms. Correct. |
| s6-10-7 | Changing cache cluster: ring with virtual nodes | Few moves, even load (figure executed). Correct. |
| s6-10-8 | Modulo: moves most, simplest, fine if n fixed; ring: neighbours only, virtual nodes | As taught. Correct. |
| s6-11-2 | Old avatar after upload: leader reads after own write | Read-your-writes. Correct. |
| s6-11-3 | Async leader dies: confirmed writes can be lost | As s6-4. Correct. |
| s6-11-5 | Replication: reads, survival, regions; partitioning: writes, size | As s6-6-2. Correct. |
| s6-11-6 | Orders: shard by customer id | Main query; even writes. Correct. |
| s6-11-10 | 2 nodes split: each may think it leads | Split brain. Correct. |

# Hand verification, System Design SD-5: S7 (Consistency and coordination)

Quorum figure goals checked against every reachable W, R and down set (worst-case overlap: write on
the first W up replicas, read from the last R), unit-tested. Lamport, fencing and merge examples are
executed. Judgement items, re-derived from the mechanisms (Brewer/Gilbert-Lynch CAP, Abadi's
PACELC, Lamport 1978, Raft paper, Kleppmann's DDIA chapter 8-9 on leases and fencing tokens):

| Exercise | Answer | Re-derivation |
|---|---|---|
| s7-1-1 | Bank withdrawal during a split: refuse | Never negative: consistency. Correct. |
| s7-1-2 | Likes during a split: keep accepting, merge | Mergeable, harmless: availability. Correct. |
| s7-1-3 | Refuse: last seat, money, unique name; answer: feed, cart, page views | Unmergeable harm vs mergeable. Correct. |
| s7-1-4 | No partition: both possible | CAP applies only during a partition. Correct. |
| s7-1-7 | Consistent choice: some users see errors | The side that cannot be sure refuses. Correct. |
| s7-2-2 | Latency: product page, chat history, likes; consistency: last ticket, password change | Cost of being wrong. Correct. |
| s7-2-3 | Nearby replica is fast because it asks no other replica | No coordination. Correct. |
| s7-2-4 | Global profiles, lag allowed: nearest replica | Needs accept staleness. Correct. |
| s7-2-6 | ELC: else, latency or consistency | PACELC definition. Correct. |
| s7-3-2 | Strong: usernames, locks, balances; not: follower count, last seen | As taught. Correct. |
| s7-3-3 | Completed write: later reads never return the old value | Linearizability. Correct. |
| s7-3-4 | Unique names across regions: strongly consistent claim | Local checks race. Correct. |
| s7-3-5 | Strong consistency costs coordination round trips | As taught. Correct. |
| s7-3-6 | Send to leader, replicate, majority acks, confirm, later reads see it | Majority-replicated write. Correct. |
| s7-4-3 | Offline to-do edits: merge item by item | LWW on the whole list loses items. Correct. |
| s7-4-4 | Eventual: agreement once updates stop | Definition. Correct. |
| s7-4-5 | Fine: likes, DNS, cart; not: cash withdrawal, unique order number | Mergeability. Correct. |
| s7-4-7 | LWW drops one concurrent write | Definition (plus clock skew). Correct. |
| s7-5-2 | Linked: post/comment, question/reply, unfriend then post; independent: strangers' posts, unrelated likes | Causality. Correct. |
| s7-5-3 | Unfriend then post, eventual only: Bo may see the post | Classic causal anomaly. Correct. |
| s7-5-4 | Reply arrives first, held, question shown, reply after | Causal delivery. Correct. |
| s7-5-5 | Global forum threads: causal consistency | Enough ordering without global coordination. Correct. |
| s7-5-6 | Unrelated posts in different orders: allowed | Causal orders only linked events. Correct. |
| s7-5-8 | Causal sits between eventual and strong | Consistency hierarchy. Correct. |
| s7-6-4 | W1R3 cheap writes; W3R1 cheap reads; W2R2 majority both | Quorum trade-offs. Correct. |
| s7-6-5 | N3 W3 with one down: writes fail | Too few acknowledgements. Correct. |
| s7-6-7 | 5 replicas, read-heavy, survive one down: W4 R2 | 4 + 2 > 5; both work with 4 up. Correct. |
| s7-7-2 | Wall clocks drift apart | Clock skew. Correct. |
| s7-7-4 | Send 5, receive 6, reply 7: question before reply | Lamport rules. Correct. |
| s7-7-6 | Counter 8 vs 5: not necessarily later | Lamport clocks give cause ⇒ smaller only. Correct. |
| s7-7-8 | Wall: "5 minutes ago", cache expiry; logical: reply order, concurrent writes, replicated log | As taught. Correct. |
| s7-8-2 | Consensus: leader election, exclusive lock, membership; not: page views, cached page | Agreement on one value. Correct. |
| s7-8-3 | Leader election: use etcd or ZooKeeper | Proven implementations. Correct. |
| s7-8-5 | Survive one failure, three zones: three nodes | 2f + 1. Correct. |
| s7-8-6 | Consensus costs round trips to a majority | As taught. Correct. |
| s7-8-7 | Timeout, request votes, majority, leader heartbeats | Raft election (simplified). Correct. |
| s7-9-1 | Token 33, pause, expiry, token 34 writes, 33 tries, refused | Fencing tokens. Correct. |
| s7-9-3 | Leases free a dead holder's lock | As taught. Correct. |
| s7-9-5 | Exactly-one nightly job: lease plus fencing tokens | Meets both needs. Correct. |
| s7-9-7 | 15 s pause, 10 s lease, no fencing: two writers | Paused holder anomaly. Correct. |
| s7-10-1 | Last seat during split: refuse on the minority side | As s7-1. Correct. |
| s7-10-4 | Strong: usernames, withdrawals; causal: threads, chat; eventual: counters, review averages | As taught. Correct. |
| s7-10-5 | Worldwide strong writes wait on a far majority | Latency side. Correct. |
| s7-10-8 | Fencing order | As s7-9-1. Correct. |
| s7-10-10 | Wall clocks drift | As s7-7-2. Correct. |

# Hand verification, System Design SD-6: S8 (Queues, streams and async work)

Queue figure goals checked against every reachable state of each figure's controls (src/lib/queuesim.ts,
unit-tested: ack-first loses failing jobs, ack-after repeats crashed ones unless idempotent, poison jobs
end in the DLQ only if there is one, the backlog drains at workers − arrivals per tick). Code examples
are executed (including the outbox rollback in real SQLite). Judgement items, re-derived from the
mechanisms (Kleppmann, DDIA ch. 11; RFC 9110 §15.6.4 and RFC 6585 §4 for 503/429 with Retry-After;
Richardson, microservices.io, for the transactional outbox and saga patterns; Garcia-Molina & Salem 1987
for sagas). No product-specific delivery guarantee is taught; the Library page tells the learner to check
their own queue's documentation.

| Exercise | Answer | Re-derivation |
|---|---|---|
| s8-1-1 | Request: password, search results, stock check; queue: welcome email, photo resize, monthly PDF | Caller needs the answer to continue or not. Correct. |
| s8-1-3 | Queued email: request waits only for adding the message | Enqueue returns at once. Correct. |
| s8-1-4 | The queue absorbs the burst | Messages wait until a worker is free. Correct. |
| s8-1-6 | Provider down: queue the email, send later | Signups keep working; delivery delayed. Correct. |
| s8-1-7 | Queue is wrong when the caller needs the result now | Adds delay, cannot speed an awaited answer. Correct. |
| s8-2-1 | Queue: one worker; pub-sub: every subscriber; log: kept, offsets | Definitions. Correct. |
| s8-2-2 | Order event to many services: publish one event | Decoupling; no waiting on the slowest. Correct. |
| s8-2-4 | Last week's orders: a log kept for a week | Queues delete handled messages; non-durable pub-sub has no history. Correct. |
| s8-2-5 | Queue: resize, PDF jobs; pub-sub: order fan-out, price change; log: replay clicks, rebuild index | As taught. Correct. |
| s8-2-7 | Non-durable subscriber down: misses everything sent meanwhile | No storage. Correct. |
| s8-3-2 | Can be lost: location ping, metrics sample, typing indicator; must arrive: payment email, ship order | Cost of loss. Correct. |
| s8-3-3 | Take, work, crash before ack, timeout, redelivered and done again | Visibility timeout / redelivery. Correct. |
| s8-3-5 | Queue keeps message until ack because the worker may die mid-job | As taught. Correct. |
| s8-3-6 | Important work: at least once with safe repeats | Standard practice. Correct. |
| s8-4-2 | Safe: set status, delete row 7, save profile by id; not: add 10, send email, insert payment | Idempotence. Correct. |
| s8-4-4 | Record handled id with the effect, atomically | A crash between them repeats or loses. Correct. |
| s8-4-6 | Charge timed out: retry with the same idempotency key | Provider returns the first result for a repeated key; never retry skips, fresh retry double-charges. Correct. |
| s8-4-7 | "Add 10" safe to repeat: store the message id | Turns repeat into no-op. Correct. |
| s8-5-3 | Jitter spreads retries in time | Avoids synchronized retry storms. Correct. |
| s8-5-4 | Retry: timeout, 503, 429; dead-letter: invalid JSON, deleted account | Transient vs permanent. Correct. |
| s8-5-6 | Fail, retry 1 s, retry 2 s, DLQ, fix and replay | Capped backoff then DLQ. Correct. |
| s8-6-4 | Sale overload: pause the email queue | Protect checkout; delay what can wait. Correct. |
| s8-6-5 | Unbounded queue hides that workers cannot keep up | Growth is silent. Correct. |
| s8-6-6 | Add workers: lasting doubling, tripled steady volume; absorb: 5-min burst, nightly import, monthly invoices | Average rate vs spike. Correct. |
| s8-6-7 | Push back with 429 (503 also, both with Retry-After) | RFC 6585 §4, RFC 9110 §15.6.4. Correct. |
| s8-7-2 | Created/cancelled reorder: two workers run in parallel | Competing consumers. Correct. |
| s8-7-3 | Account events: partition by account id | Per-key order, parallel across keys. Correct. |
| s8-7-4 | Order matters: one document's edits, one account, one order's status; not: different photos, different users | Per entity. Correct. |
| s8-7-6 | One dominant key: that partition is overloaded | Hot partition. Correct. |
| s8-7-7 | Order between different keys: not kept, rarely matters | Partitions independent. Correct. |
| s8-8-1 | Begin, insert order, insert outbox, commit, relay reads, publishes then marks sent | Transactional outbox. Correct. |
| s8-8-2 | Crash after commit: relay sends it later | Row is durable. Correct. |
| s8-8-4 | Fix missing events: outbox in the same transaction | Publish-first creates phantom events. Correct. |
| s8-8-5 | Relay double-publish acceptable because consumers are idempotent | Outbox is at least once. Correct. |
| s8-8-6 | Inside: order row, outbox row; after: publish, mark sent, email | Only DB writes in the transaction. Correct. |
| s8-8-7 | The relay publishes | As drawn. Correct. |
| s8-9-1 | Stock, card, courier fails, refund, release | Compensate in reverse. Correct. |
| s8-9-2 | Charge/refund, reserve/release, book/cancel | Compensating actions. Correct. |
| s8-9-4 | A saga gives up hiding half-done states (isolation) | Each step commits locally. Correct. |
| s8-9-6 | Can undo: seat, card, points; cannot: email, parcel handed over | Reversibility. Correct. |
| s8-9-7 | Irreversible step goes last | Nothing after it can fail. Correct. |
| s8-10-2 | Ack after, crash: work done twice | At least once. Correct. |
| s8-10-3 | Queue: encode video; pub-sub: signup fan-out, setting change; log: last week's events, rebuild cache | As taught. Correct. |
| s8-10-6 | Outbox order | As s8-8-1. Correct. |
| s8-10-7 | Flight full after hotel: cancel the hotel booking | Saga compensation. Correct. |
| s8-10-9 | Poison message without a cap: retried forever | As taught. Correct. |
| s8-10-10 | Jitter: retries spread out | As s8-5-3. Correct. |

# Hand verification, System Design SD-7: S9 (APIs and service boundaries)

Rate-limiter figure goals checked against every reachable state (src/lib/limiter.ts, exact arithmetic in
tenths of a second; unit-tested: a fixed window lets 2 × limit through across a boundary, a sliding
window does not, a token bucket takes a burst up to its size and then the refill rate). Code examples
are executed. Judgement items, re-derived from primary sources: RFC 9110 (method idempotency §9.2.2;
201 §15.3.2; 401 §15.5.2 vs 403 §15.5.4; 405 §15.5.6; 503 + Retry-After §15.6.4), RFC 6585 §4 (429),
the IETF httpapi Idempotency-Key header draft (still a draft, so the lesson says "often an
Idempotency-Key header"), gRPC docs (HTTP/2, protobuf; browsers need gRPC-Web), GraphQL spec, Fowler's
"MonolithFirst" and "Microservices" articles, and Kubernetes Service/DNS docs for discovery.

| Exercise | Answer | Re-derivation |
|---|---|---|
| s9-1-1 | REST: public API; gRPC: service-to-service; GraphQL: app picks fields | Typical fit. Correct. |
| s9-1-2 | Idempotent: GET, PUT full replace, DELETE; not: POST orders, POST payments | RFC 9110 §9.2.2. Correct. |
| s9-1-3 | 11 calls on mobile: one GraphQL query for the screen | Collapses round trips; gRPC keeps 11 calls. Correct. |
| s9-1-4 | Created: 201 | RFC 9110 §15.3.2. Correct. |
| s9-1-5 | 401: no token, expired, malformed; 403: not admin, another user's file | RFC 9110 §15.5.2/§15.5.4. Correct. |
| s9-1-7 | gRPC not for browsers: they cannot speak it directly | Needs gRPC-Web proxy. Correct. |
| s9-2-3 | Large OFFSET reads and discards the skipped rows | Standard DB behaviour. Correct. |
| s9-2-4 | Infinite changing feed: cursor | Stable and fast at depth. Correct. |
| s9-2-5 | Cursor: feed, partner sync, chat; offset: admin table, first search pages | As taught. Correct. |
| s9-2-7 | Opaque cursor: free to change its contents | Encapsulation. Correct. |
| s9-3-1 | Safe: optional field, new endpoint; breaking: rename, required input, unit change | Compatibility rules. Correct. |
| s9-3-3 | Euros to cents: add v2, keep v1 a year | Non-breaking path. Correct. |
| s9-3-4 | Release v2, announce, measure, contact, switch off | Deprecation practice. Correct. |
| s9-3-5 | Unknown request field: ignore (tolerant reader) | Robustness; strict 400 noted. Correct. |
| s9-3-6 | Mobile harder: old app versions stay installed | As taught. Correct. |
| s9-4-2 | Client creates the key before trying | Server-made key lost with the reply. Correct. |
| s9-4-3 | Key, send, charge + store, reply lost, retry same key, replay | Idempotency-Key flow. Correct. |
| s9-4-4 | Concurrent retries: claim the key atomically first | Check-then-act race. Correct. |
| s9-4-5 | Same key, different body: reject as misuse | Draft recommends a request fingerprint and an error. Correct. |
| s9-4-6 | Needs key: POST payments, orders, emails; safe: GET, PUT | As s9-1-2. Correct. |
| s9-5-3 | Limited client gets 429 with Retry-After | RFC 6585 §4. Correct. |
| s9-5-4 | API key: paid plans, partners, tenants; IP: login form, anonymous signup | Identity when known. Correct. |
| s9-5-5 | 10 servers, local counters: up to 10× the limit; use a shared store | As taught. Correct. |
| s9-5-7 | Sliding log costs memory growing with the limit | One timestamp per allowed request. Correct. |
| s9-6-4 | Bucket size controls the largest burst | Token bucket definition. Correct. |
| s9-6-5 | Fixed: cheap, edge bursts; sliding: exact; bucket: bursts up to size | As taught. Correct. |
| s9-6-6 | Start-up bursts of 40, average 10/s: bucket 50, refill 10/s | Fixed 10/s rejects bursts. Correct. |
| s9-7-1 | Gateway: API key, rate limit, routing; service: discount, refund rule | Cross-cutting vs business. Correct. |
| s9-7-2 | API key checked at the gateway | Every request passes it. Correct. |
| s9-7-3 | Gateway risk: every request depends on it | Run several, keep thin. Correct. |
| s9-7-5 | Twelve token checks: check once at the gateway | Consistency; services still authorise. Correct. |
| s9-7-6 | TLS termination: HTTPS decrypted at the edge | Definition. Correct. |
| s9-7-7 | Decrypt, key, rate limit, route, log | Cheap rejections first. Correct. |
| s9-8-1 | Monolith: small team, one transaction, unclear product; micro: 200 engineers, GPU part | Fowler, MonolithFirst. Correct. |
| s9-8-3 | Service call adds network failures and latency | Fallacies of distributed computing. Correct. |
| s9-8-4 | Five-person startup: modular monolith | As taught. Correct. |
| s9-8-5 | Split by business capability | Not layers, not tables. Correct. |
| s9-8-7 | Microservices mainly solve teams blocking each other | Independent deploys and scaling. Correct. |
| s9-9-1 | Start, register, pass health checks, lookup, pick | Registry flow. Correct. |
| s9-9-3 | No hard-coded IPs: instances move | Autoscaling, redeploys. Correct. |
| s9-9-4 | Client-side: caller asks registry; server-side: balancer asks; DNS: name resolves | Discovery patterns. Correct. |
| s9-9-5 | DNS drawback: cached answers go stale | TTL caching. Correct. |
| s9-9-6 | Hung instance: health check a real endpoint | Liveness by response. Correct. |
| s9-9-7 | The registry knows where instances are | As drawn. Correct. |
| s9-10-2 | Internal fast typed calls: gRPC | As s9-1-1. Correct. |
| s9-10-4 | Safe: optional field, endpoint; breaking: remove field, date type, required header | As s9-3-1. Correct. |
| s9-10-5 | Retry safely with the same key | As s9-4-2. Correct. |
| s9-10-7 | Team of six, unsettled domain: modular monolith | As s9-8-4. Correct. |
| s9-10-8 | Decrypt, key, limit, route | As s9-7-7. Correct. |
| s9-10-10 | Fixed 100/min: up to 200 in one real minute | Boundary burst. Correct. |

# Hand verification, System Design SD-8: S10 (Reliability and operations)

No new figure. Code examples, estimates and both labs are executed. Judgement items, re-derived from:
Google SRE book (chapters on SLOs, handling overload, addressing cascading failures) and SRE workbook
(error budget policy); Nygard, Release It! (timeouts, circuit breaker, bulkhead); AWS Builders' Library
("Timeouts, retries and backoff with jitter"); RFC 9110 (401 vs 403); RFC 7519 (JWT: signed claims,
`exp`); OWASP Top 10 A01 Broken Access Control; Martin Fowler on blue-green, canary and feature toggles.

| Exercise | Answer | Re-derivation |
|---|---|---|
| s10-1-1 | No timeout: stuck calls hold threads | Resource exhaustion. Correct. |
| s10-1-4 | Timeout just above p99 (~200 ms vs p99 120) | Builders' Library: pick from latency percentiles. Correct. |
| s10-1-5 | Hang, wait, threads fill, queue, caller stops, its callers wait | Cascading failure. Correct. |
| s10-1-7 | 50 ms left of deadline for a 300 ms call: give up | Deadline propagation. Correct. |
| s10-2-3 | Retry: timeout GET, 503, reset GET; not: 400, POST payments without key, 404 | Transient and idempotent. Correct. |
| s10-2-4 | Retry at one layer only | Amplification. Correct. |
| s10-2-6 | Retries half the traffic: backoff, jitter, budget | SRE "Handling overload" retry budget. Correct. |
| s10-2-7 | Only safe-to-repeat: a repeat may apply twice | Idempotency. Correct. |
| s10-3-1 | Closed, threshold, open, trial, closed | Breaker state machine. Correct. |
| s10-3-2 | Closed: through; open: fail at once; half-open: one trial | As taught. Correct. |
| s10-3-4 | Fail fast to spare the failing service | And free caller resources. Correct. |
| s10-3-5 | Recs down, 2 s waits: breaker plus fallback list | Degrade gracefully. Correct. |
| s10-3-6 | Half-open lets a trial call through | Definition. Correct. |
| s10-4-1 | Shared pool exhausted: separate pool per dependency | Bulkhead. Correct. |
| s10-4-2 | Must: payment, cart; degrade: recs, reviews, recently viewed | Core path. Correct. |
| s10-4-4 | Bulkhead from ship compartments | Etymology. Correct. |
| s10-4-6 | Drop recommendations | Non-core. Correct. |
| s10-4-7 | Fallbacks decided ahead and tested | As taught. Correct. |
| s10-5-1 | RTO time to recover; RPO data loss; N+1 one spare | Definitions. Correct. |
| s10-5-4 | RPO 0, RTO 15 min: synchronous replica in a second region | Zero loss needs synchronous ack. Correct. |
| s10-5-5 | AA: global feed, game lobbies, news; AP: HR tool, small billing DB | Latency/failover vs cost. Correct. |
| s10-5-6 | Active-active brings write conflicts | Multi-writer. Correct. |
| s10-5-7 | Backups trustworthy when restored regularly | Restore testing. Correct. |
| s10-6-1 | Rolling few at a time; blue-green switch all and back; canary small share | Fowler. Correct. |
| s10-6-2 | 1%, compare, widen, all, remove old | Canary. Correct. |
| s10-6-4 | Risky checkout: feature flag | Off without deploy. Correct. |
| s10-6-6 | Blue-green: instant switch back | Old environment still up. Correct. |
| s10-6-7 | Schema works with old code because both versions run | Expand/contract. Correct. |
| s10-7-1 | Metric: error rate, p99; log: stack trace, user 42; trace: slow service, call timings | As taught. Correct. |
| s10-7-3 | Alert on p99: averages hide the tail | SRE monitoring chapter. Correct. |
| s10-7-4 | Request id links logs across services | Correlation id. Correct. |
| s10-7-6 | RED: rate, errors, duration | Wilkie's RED method. Correct. |
| s10-7-7 | Find slow service among eight: tracing | As taught. Correct. |
| s10-8-4 | Not 100%: no room for change | SRE "Embracing risk". Correct. |
| s10-8-5 | Budget gone: pause launches, fix reliability | Error budget policy. Correct. |
| s10-8-6 | Good SLI: checkouts, searches < 300 ms, pages without error; not: DB CPU, server count | User-facing. Correct. |
| s10-8-7 | SLA is a contract with penalties | SRE book. Correct. |
| s10-9-1 | AuthN: password, signature, passkey; AuthZ: owner delete, admin orders, invoice access | Definitions. Correct. |
| s10-9-2 | Session server state; signed token self-contained; refresh token long-lived, revocable | RFC 7519, OAuth 2.0 (RFC 6749 §1.5). Correct. |
| s10-9-3 | Log out everywhere with 24 h stateless tokens: short tokens plus revocable refresh | As taught. Correct. |
| s10-9-5 | Changing an id shows another's invoice: authorisation failed | OWASP A01 (IDOR). Correct. |
| s10-9-7 | Signature proves it was not altered | RFC 7515/7519. Correct. |
| s10-10-1 | p99 80 ms: timeout ~150 ms | As s10-1-4. Correct. |
| s10-10-3 | Breaker order | As s10-3-1. Correct. |
| s10-10-4 | Must: playback, sign-in; degrade: personalised rows, resume position, artwork | Core path. Correct. |
| s10-10-6 | Canary small share; blue-green switch back; flag off without deploy | As taught. Correct. |
| s10-10-7 | Failing search: breaker, hide suggestions | As s10-3-5. Correct. |
| s10-10-9 | Trace shows which service was slow | As s10-7-7. Correct. |
| s10-10-10 | Short tokens because they cannot be revoked early | Stateless validation. Correct. |
