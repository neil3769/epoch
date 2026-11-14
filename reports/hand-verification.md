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
