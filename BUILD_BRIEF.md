# Build brief: a daily-lesson web app that takes one learner from "Python basics" to AI engineer

You are building this app for one specific person. Read the whole brief before starting. It is split into phases; do one phase per session unless told otherwise, and stop at the end of each phase with a short report.

## 1. Who this is for and why it exists

The learner wants to become an AI engineer. They know basic Python (loops, functions, lists) but get stuck on anything bigger. Their real problem is not ability, it is follow-through: they keep planning to study and never start. They also "go blank" on concepts they have been told many times. Their own example: they cannot reliably explain or apply the difference between ordinary multiplication and matrix multiplication.

So the app has two jobs, in this order:

The learner is in a heavy university semester abroad and has little time for long coding sessions at a computer. They want this app to be a real route to competence, not only a reminder between study sessions: if most of what they learn this semester comes through the app, it should still get them to a solid level, including some actual coding. They will give it up to 30 minutes a day when they can.

1. **Get them to show up every day.** Sessions run from 2 to 30 minutes, on an iPhone, usually with one thumb. Starting a lesson must take one tap from the home screen. Anything that adds friction before the first exercise is a defect.
2. **Make concepts stick by making them do things, not read things.** Every idea is introduced in two or three sentences at most and then practised immediately. Understanding is tested by application (predict this output, fix this shape error, fill in this cell), never by recalling a definition.

The format is the familiar bite-sized-lesson pattern: a path of units, short lessons, instant feedback, a streak, review of weak items. Borrow those mechanics. Do not copy any existing product's name, mascot, colours, sounds or artwork; give this app its own visual identity. Working name: **Epoch** (one day, one pass through the material). The learner can rename it.

## 2. Hard constraints

- **Static site, no backend, no accounts, no paid services.** It will be hosted free on GitHub Pages and added to the iPhone home screen as a PWA. All progress lives on the device.
- **iPhone Safari is the primary target.** Design at 390 x 844 first. It must also work on a desktop browser, but that is secondary.
- **Works offline** after the first load (service worker caches the app shell and all lesson content).
- **Must work under a sub-path** (`https://<user>.github.io/<repo>/`). Use a relative base and hash-based routing so no server rewrites are needed.
- **Lesson content must be correct.** A wrong answer key in a teaching app is worse than a missing lesson. See section 7 for the required verification.

## 3. Stack

Vite + React + TypeScript, plain CSS (CSS variables, no UI framework), `vite-plugin-pwa` for the manifest and service worker. Keep dependencies few. Choose the small details yourself.

Python execution in the browser uses **Pyodide** (CPython compiled to WebAssembly, includes NumPy). Look up the current stable Pyodide version and its loading instructions rather than relying on memory, and pin the version. Rules for it:

- Load it lazily, only when the learner reaches the first exercise that runs code, inside a Web Worker, with a visible one-time download indicator. It is several megabytes.
- Enforce a timeout by terminating the worker, so an infinite loop cannot freeze the app.
- Cache it through the service worker so it works offline afterwards.
- If it fails to load, skip run-code exercises without penalty. A lesson must never be blocked by it.
- PyTorch does not run in Pyodide. PyTorch lessons therefore use non-executing exercise types only (predict the shape, order the lines, fill the blank, spot the bug).

## 4. iPhone details that are easy to get wrong

- `viewport-fit=cover` and safe-area insets, so nothing sits under the notch or home indicator. The primary action button is fixed at the bottom within thumb reach.
- Touch targets at least 44 px. No interaction may depend on hover.
- Text inputs at 16 px or larger, otherwise Safari zooms the page on focus.
- Code inputs: turn off autocorrect, autocapitalize and spellcheck. iOS replaces straight quotes with curly quotes and `--` with a dash; normalise these before checking or running any typed answer.
- Typing code on a phone is unpleasant. Prefer tap-based exercises (see section 5). Typed code is limited to one or two short lines, and gets a row of symbol keys above the keyboard (`[ ] ( ) : = @ * . _ "`).
- Manifest with `display: standalone`, an `apple-touch-icon`, and theme colours for light and dark mode. Support both colour schemes.
- `navigator.vibrate` does not exist on iOS; do not rely on haptics. Sounds are optional and off by default.
- Web push on iOS needs a server, so there are no push reminders. Instead, the settings screen explains in three steps how to set a daily iPhone reminder or Shortcuts automation that opens the app.

## 5. How a lesson works

A lesson is 8 to 12 exercises and takes about 4 minutes. The daily goal is chosen by time: 5, 15 (default) or 30 minutes. It can be changed from the home screen in one tap, because the learner's free time varies day to day. A 30-minute day is typically three or four lessons, a review, and one code lab (section 5b).

Flow: a concept card (at most three sentences plus one diagram or code snippet) → exercises that rise in difficulty → any exercise answered wrongly returns at the end of the lesson until answered correctly → a completion screen showing XP, streak and one line on what was learned.

Feedback after every answer is immediate and specific. A wrong answer shows why that particular choice is wrong, not just the correct one. Write a targeted explanation for each common wrong option.

No lives or hearts system. Running out of attempts gives a person who already struggles to start a reason to close the app. Mistakes cost nothing except the repeat at the end.

### Exercise types (build these as a registry so new types are easy to add)

| Type | What the learner does |
|---|---|
| Multiple choice | Pick one answer. Used sparingly, and mostly for "what does this print" rather than definitions. |
| Predict the output | Read a snippet, choose or type what it prints. |
| Predict the shape | Given array or tensor operations, pick or enter the resulting shape, or "error". |
| Fill the blank | Tap tokens from a bank into gaps in a code snippet. |
| Order the lines | Drag or tap shuffled lines of code into a working order. |
| Spot the bug | Tap the line that causes the error shown. |
| Match pairs | Match terms to code, or operations to results. |
| Number grid | Fill cells of a vector or matrix result using steppers or a number pad. |
| Run code | Write one or two lines; hidden tests run in Pyodide. |
| Interactive figure | Manipulate a figure until a goal is met (section 6). |

## 5b. Code labs: real coding inside the app

Lessons build recognition and understanding. Labs build the ability to write code. Each unit has one to three labs, unlocked as its lessons are completed. A lab takes 10 to 15 minutes and has the learner build one small working thing in four to six steps, each step adding a few lines and passing hidden tests in Pyodide before the next opens.

- Each step shows the goal, the code so far, and an editor for the new lines. Use a proper code editor component that works on mobile (CodeMirror 6 or similar) with Python highlighting, auto-indent and the symbol key row from section 4.
- Hints come in three levels: a nudge in words, then the structure with blanks, then the full solution. Using a hint costs nothing except that the step is added to the review queue to be rewritten later without help.
- When tests fail, show the real Python error or the failing case, and one sentence on how to read it. Learning to read errors is part of the goal.
- Later labs in a unit give less scaffolding. The last lab of a unit starts from an empty function.
- A lab's finished code is saved and can be reopened and copied, so the learner collects a set of small programs they wrote themselves.
- Labs are comfortable on a phone but nicer with a keyboard. The app works in any desktop browser too; say so in the lab intro, and rely on export and import of progress to move between devices.

Lab topics, as a guide: matrix multiply with plain loops, then with NumPy; cosine similarity search over a handful of vectors; gradient descent fitting a line; softmax and cross-entropy; a two-layer network forward and backward pass in NumPy; a tiny tokenizer; attention scores for a four-word sentence.

**Engineering labs run against simulated services.** Pyodide has no network, so ship a small Python helper module with the app that provides stand-ins: a `fake_llm()` that returns canned and sometimes malformed responses with token counts, a flaky endpoint that returns 429 and 500 on a schedule, a small document set with precomputed embeddings, and a set of callable tools. With these the learner can really write retry with exponential backoff, validate and repair structured output, compute cost and p95 latency from logs, score an eval set, build retrieval with citations and refusal, and write an agent loop with step and spend limits. Make the stand-ins' interfaces resemble the real libraries' closely enough that the code transfers, and state in each lab what differs from the real thing.

## 5c. Library

Finishing a unit unlocks a one-page summary of it in a Library tab: the key ideas, the rules, a short annotated code example, and the common mistakes. It is searchable. This is the reference the learner returns to when building for real, and it is the one place where longer explanation is allowed.

## 5d. Sync between devices through GitHub

The learner uses an iPhone and a PC and does not want to export and import files by hand. Sync progress through a **private GitHub repository that the learner owns**, called directly from the browser with the GitHub REST API (it allows cross-origin requests). This keeps the app a static site with no backend and no new service.

- One-time setup per device, in settings: the learner creates a private repository (for example `epoch-progress`) and a fine-grained personal access token limited to that one repository with only "Contents: read and write", then pastes the token and repository name into the app. Give step-by-step instructions with the exact GitHub menu names; check the current GitHub UI and API docs when writing them. The learner creates and pastes the token themselves.
- The token is stored only in that device's local storage. It must never appear in the app's source, the public repository, logs, error messages or the exported progress file. Show it masked, with a "disconnect" button that deletes it.
- After setup, sync is automatic and invisible: pull when the app opens or returns to the foreground, push after each completed lesson, lab step or review (debounced). A small indicator shows synced, syncing or offline. Offline changes queue and push when the connection returns.
- Progress is a single JSON file in the repository, updated through the contents API using the file's current `sha`. On a conflict response, pull, merge and retry.
- Design the progress data so two devices can always be merged without loss: completed lessons and labs as sets (union), per-item review state and saved lab code with timestamps (newest wins), XP and streak recomputed from a dated activity log rather than stored as totals. A lesson done on the phone and another done on the PC while offline must both survive.
- Sync is optional. Without it the app works exactly as before on one device, and manual export and import stay available as a backup.
- Test the merge logic with unit tests covering both-devices-offline edits, and test the sync flow against a mocked API. Do not use a real token in tests.

## 6. Interactive figures

These are the heart of the "make it click" goal. Build them as reusable components that lessons configure with data.

- **Element-wise vs matrix multiply, side by side.** Same two matrices, two results. Tapping a result cell highlights exactly which input cells produced it. For element-wise that is one cell from each; for matrix multiply it is a whole row from the left and a whole column from the right.
- **Row-times-column stepper.** Walks one cell of a matrix product: highlight row, highlight column, show the pairwise products, show the sum.
- **Shape checker.** Two shape tuples as blocks; the inner dimensions glow green if they match and red if they do not, and the outer dimensions slide together to form the result shape.
- **Broadcasting visualiser.** Shows how a smaller array is stretched to match a larger one, or why it cannot be.
- **Gradient descent on a curve.** A ball on a loss curve, a learning-rate slider, a step button. Too large a rate visibly overshoots.
- **Neuron and layer.** Inputs, weights, a weighted sum, an activation; then a layer shown as the same thing done several times at once, which is a matrix multiply.
- **Attention heat map.** A short sentence, tap a word, see how strongly it attends to every other word.

## 7. Content: format and verification

Lessons are data, not code. Store them as typed files under `content/`, one file per unit, validated against a schema at build time. A lesson author should be able to add a lesson without touching any component.

**Verification is mandatory.** Write `npm run verify-content`, which:

1. Validates every lesson against the schema (ids unique, answer indexes in range, every wrong option has an explanation).
2. Executes every Python snippet whose output or shape is used as an answer, using Pyodide in Node, and fails if the recorded answer differs from the real result. This uses the same runtime as the app and needs no local Python install.
3. Lists every exercise it could not verify by execution (PyTorch snippets, conceptual questions) in a report file. Re-derive each of those by hand before finishing a phase. If a local Python with PyTorch is available, use it to check the PyTorch ones.

The build must fail if verification fails.

For lessons about LLM APIs, check current provider documentation before writing code samples. Teach the ideas that hold across providers (messages, tokens, context window, tool calls, structured output) and keep sample code minimal.

## 8. Curriculum

There are two tracks, shown as two tabs on the home screen, and the learner can do lessons from either on any day:

- **Foundations** (units F1 to F11, about 120 lessons): the Python, maths and model internals underneath everything.
- **AI Engineering** (units E1 to E11, about 100 lessons): building, evaluating and shipping LLM applications. This track mirrors the learner's own six-month study plan (section 8b).

The tracks run in parallel on purpose. The learner's plan has them building LLM applications right now, so the engineering lessons cannot wait behind 120 foundations lessons.

Each unit ends with a checkpoint lesson that mixes everything in it. A learner can "test out" of a unit by passing its checkpoint, since this learner already knows some of the material.

### Foundations track

Unit numbers below are F1 to F11 in order; "Unit 3" elsewhere in this brief means F3.

| # | Unit | Lessons | What the learner can do afterwards |
|---|---|---|---|
| 1 | Python you will see in ML code | 12 | Read list comprehensions, slicing, dicts, `*args`/`**kwargs`, classes with `__init__` and `self`, imports, type hints; read a traceback and find the failing line. |
| 2 | Vectors | 8 | Treat a list of numbers as a thing with meaning; add, scale, dot product as "weighted sum", length, cosine similarity. |
| 3 | Matrices and matrix multiplication | 12 | The flagship unit. See below. |
| 4 | NumPy | 14 | Create arrays; shape, dtype, indexing, boolean masks, `axis`, reshape, broadcasting; `*` vs `@`; replace a loop with a vectorised expression. |
| 5 | Change and gradients | 9 | Slope, derivative as "how much the output moves when I nudge the input", partial derivatives, the gradient, the chain rule with numbers. |
| 6 | Probability and loss | 9 | Mean and variance, distributions, logarithms, softmax, cross-entropy and why it is the loss for classification. |
| 7 | Machine learning from scratch | 10 | Linear regression, loss, gradient descent by hand and in NumPy, train/validation split, overfitting. |
| 8 | Neural networks | 12 | Neuron, activation, layer as a matrix multiply, forward pass, backpropagation on a tiny network, a two-layer network in NumPy. |
| 9 | PyTorch | 14 | Tensors, autograd, `nn.Module`, optimiser, the five-line training loop, `Dataset`/`DataLoader`, devices, debugging shape errors. The plan's goal is writing the training loop from memory, so the last three lessons rebuild it from a blank screen with fewer hints each time. |
| 10 | Text as numbers | 7 | Tokens, vocabularies, embeddings, similarity search. |
| 11 | Attention and transformers | 12 | Attention as dot products plus softmax, self-attention, multiple heads, position information, the transformer block, how a GPT-style model generates text. |

### Unit 3 in detail

This unit is the learner's stated pain point and sets the standard for all others. The confusion to dissolve: they treat "multiply" as one operation. Teach that there are two different operations that happen to share a word, and when each is used.

1. **Cell by cell.** Element-wise multiply: same shapes, each cell times its partner. This is the "normal" multiplication they already know, done many times. In NumPy: `*`.
2. **A different question.** The dot product: one row of weights, one column of values, multiply pairs, add up, get one number. Framed as a score (prices times quantities gives a total bill).
3. **Many scores at once.** Matrix times vector is several dot products stacked, one per row.
4. **Row meets column.** Matrix times matrix: cell (i, j) is row i of the left dotted with column j of the right. Uses the stepper figure.
5. **Fill it in.** Number-grid exercises computing 2x2 and 2x3 products by hand.
6. **The shape rule.** `(m, n) @ (n, p) → (m, p)`. Inner numbers must match, outer numbers survive. Uses the shape checker.
7. **Will it run?** Rapid-fire: given two shapes, does `*` work, does `@` work, what is the result shape?
8. **Order matters.** `A @ B` is not `B @ A`; sometimes one of them does not even exist.
9. **Same inputs, two answers.** Side-by-side figure; predict both results for the same pair.
10. **Why AI uses it.** A layer of neurons is "every neuron takes a weighted sum of all inputs", which is exactly a matrix multiply. Preview of unit 8.
11. **In code.** `*` vs `@` vs `np.dot` vs `np.matmul` in NumPy; read and fix the common `shapes not aligned` error.
12. **Checkpoint.** Mixed, with an emphasis on choosing the right operation for a described situation.

Use the same pattern everywhere: concrete everyday framing first, then the mechanics by hand, then the rule, then the code, then the reason it matters for AI.

## 8b. AI Engineering track

The learner is following a written plan, `Zero to AI Engineer in 6 Months.docx`, in this folder. Read it before writing this track. It schedules about six hours a week of study and project building from November to May, with a pause for exams in January and February. The learner may not manage all of those hours this semester. So this track has to stand on its own: someone who did only the app's lessons and labs should understand each topic well enough to discuss it in an interview and to write the core of it (a retrying client, an eval script, a retrieval step, an agent loop) without looking it up. What the app cannot give is the experience of a full project, real deployment and real debugging; say so plainly at the end of each unit, with a one-paragraph "to do this for real" pointer to the matching step in the plan.

Each unit is tagged with the plan weeks it supports. Put the plan's week dates in one data file, and have the home screen mark the unit that matches the current week as "this week in your plan". Nothing is locked: the learner can go ahead or catch up freely.

| # | Unit | Lessons | Plan weeks | What the learner can do afterwards |
|---|---|---|---|---|
| E1 | A real Python project | 8 | 1 | Lay out a project with `pyproject.toml` and a `src/` folder using uv; read and write type hints; write a pytest test and read its failure output; know what ruff and pre-commit are for. |
| E2 | Async and HTTP | 8 | 2 | Read `async`/`await` code and predict the order things run in; make a request with `httpx.AsyncClient`; set timeouts; retry with exponential backoff on 429 and 5xx; test against a mock transport. |
| E3 | Calling an LLM | 10 | 2 | Messages and roles, tokens, context window; compute the cost of a call from token counts; get schema-valid output with Pydantic; define and handle a tool call; log cost and latency and read a p95. |
| E4 | Prompts and context | 7 | 1, 4 | Write clear instructions, use examples, structure long context, decide what belongs in the context window and what does not. |
| E5 | Evaluation | 11 | 3, 6, Feb | Build a labelled set; choose a metric that fits the task; exact match vs graded vs model-as-judge; golden sets; measure one change before and after; spot data leakage in a described setup. |
| E6 | Retrieval (RAG) | 9 | 5 | Chunking, embeddings, keyword vs vector vs hybrid search, reranking, citing sources, refusing when nothing relevant is found; diagnose whether a bad answer came from retrieval or generation. |
| E7 | Agents | 10 | 5 to 7 | Workflow vs agent and when not to use an agent; the tool-calling loop written by hand; step and spend limits; what MCP is and what a server exposes; recognise a prompt injection. |
| E8 | Shipping a service | 12 | 8 to 10 | A FastAPI endpoint with request and response models; read a Dockerfile line by line; docker compose; API tests; a GitHub Actions workflow for lint, tests and image build; what deploying to a managed host involves. |
| E9 | Cost, latency, observability | 8 | 11, 12 | Traces and spans; cost per request; p50 vs p95; routing to a small model first; caching; before/after tables. |
| E10 | Safety | 7 | 13 | The OWASP Top 10 for LLM applications; prompt injection, data leakage, excessive agency; guardrails; provider fallback. |
| E11 | Interview practice | 12 | Jan onwards | Short-answer drills on the standard questions (RAG vs fine-tuning vs long context, reducing hallucinations, when not to use an agent); the four system designs from the plan, built up piece by piece by ordering and choosing components; common coding patterns. |

Notes for writing this track:

- These topics are tools and APIs that change. Check the current documentation for uv, pytest, httpx, Pydantic, FastAPI, Docker, GitHub Actions, MCP and the OWASP list before writing code samples, and keep samples small.
- Real network calls and Docker cannot run in Pyodide. Use the simulated services from section 5b for labs in E2, E3, E5, E6, E7 and E9, and check whether Pydantic and pytest load in the pinned Pyodide version (use them if they do). E1, E8 and E10 are mostly read-and-decide: reading a `pyproject.toml`, a Dockerfile or a CI workflow line by line and predicting what it does or finding what is wrong. Every exercise not verified by execution goes on the hand-verification list from section 7.
- Favour judgement exercises: "this RAG answer is wrong, here is the trace, which stage failed?", "this agent spent 40 steps, which limit was missing?", "which metric fits this task?". The plan's interviews probe decisions, not syntax.
- The repository will be public. Do not copy personal details from the plan document (names, university, paper title, application targets) into the app or the repository. Only the week dates and topic names go in.

## 9. Keeping the learner coming back

- **Streak** with the current count on the home screen. One automatic "streak freeze" is earned per seven-day run, so a single missed day does not wipe out weeks of effort and trigger giving up.
- **XP and a daily goal ring.** Hitting the daily goal is the celebrated event, not finishing a unit.
- **The home screen has one obvious button**: continue where I left off. The path of units is below it.
- **Review.** Every exercise answered wrongly enters a spaced-repetition queue (a simple Leitner box scheme is enough). A "Review" session of 10 due items is offered each day and counts toward the goal. Older units resurface this way.
- **Two-minute mode.** A "just one quick review" option of five items, for days with no energy. It still keeps the streak. Lowering the bar to start matters more than session length.
- **Exam mode.** The learner's plan pauses for exams from early January to the end of February. A switch in settings drops the daily goal to one short review for a chosen date range, keeps the streak alive on that reduced goal, and offers only review, F9 (PyTorch loop), E5 (leakage and metrics) and E11 (interview practice), which are what the plan allows in that period.
- **Progress backup.** Export and import progress as a JSON file from settings, because on-device storage can be lost.

Avoid guilt-based messaging. After a missed day the app says where to pick up, nothing more.

## 10. Phases

Each phase ends with: `npm run build` passing, `npm run verify-content` passing, the app checked in a browser at 390 x 844 in light and dark mode, and a short report of what was built, what was verified, and what was not.

**Phase 1: the engine and the flagship unit.**
Project scaffold, `git init`, PWA setup, design system, home screen, lesson player, all exercise types, the first three interactive figures, progress storage, streak and XP, content schema and verification script. Content: **Unit F3 complete**, plus the first three lessons of F1 and the first three of E2. Unit 3 first because it is the learner's own example and proves the approach. Done when a learner can install it, finish Unit 3 offline, and every exercise type has been used at least once.

**Phase 2: deploy.**
A GitHub Actions workflow that builds and publishes to GitHub Pages. Creating the repository and pushing need the learner's GitHub account: ask them before doing either, and walk them through anything only they can do. Then give them the steps to open the URL in Safari and use Share → Add to Home Screen. Do this early so they start using it while the rest is written.

**Phase 3: review system and retention features.**
Spaced-repetition queue, review and two-minute sessions, streak freeze, test-out checkpoints, settings, export and import. Also GitHub sync (section 5d); structure the progress data for merging from Phase 1 so nothing has to be migrated. Also the code lab player with its editor, hints and saved code, the simulated-services module, the Library tab, and the labs and summary page for Unit F3 as the first examples. From here on, every unit ships with its labs and its Library page.

**Phase 4 onward: content, one or two units per session.**
The engineering track is tied to calendar weeks, so it sets the order: always build next whichever E unit the plan reaches soonest and that is not yet written, starting from the current week (check today's date against the plan). Units for weeks already past are still built, right after the current one, so the learner can catch up. Fill the gaps with Foundations units in the order F1, F2, F4, then F5 to F11, making sure F9 exists before January. Add the two-track home screen and the "this week in your plan" marker with the first E unit, and exam mode before January. Build the remaining figures when the unit that needs them comes up. After each unit, re-read it as the learner would: is any card more than three sentences, is any exercise answerable by pattern-matching without understanding, does any lesson introduce two new ideas at once? Fix those before reporting.

## 11. Quality bar

- Opening the installed app to answering the first exercise: two taps or fewer.
- No lesson teaches more than one new idea.
- At least half of all exercises require producing or predicting something, not recognising a definition.
- Every wrong option has its own explanation.
- Nothing scrolls horizontally on a 390 px screen, including code snippets (wrap or shrink them; keep snippets under about 38 characters wide).
- The app is usable with one thumb.
