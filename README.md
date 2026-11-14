# Epoch

Daily bite-sized lessons, from Python basics to AI engineering. A static PWA: no
backend, no accounts, progress stored on the device. Built from `BUILD_BRIEF.md`.

## Commands

```bash
npm install
npm run dev              # local dev server
npm run verify-content   # validate lessons and run every answer in Pyodide
npm test                 # unit tests (vitest)
npm run build            # verify-content + typecheck + production build (fails if content is wrong)
npm run preview          # serve the production build
npm run icons            # regenerate the app icons
```

## Layout

- `content/` lessons as data: `schema.ts` (zod), `index.ts` (catalogue), `units/*.ts` (one file per unit),
  `labs/*.ts` (code labs), `library/*.ts` (unit summary pages)
- `scripts/verify-content.ts` content checks; writes `reports/content-verification.md`
- `src/exercises/` exercise types, registered in `registry.tsx`
- `src/figures/` interactive figures (compare, stepper, shape checker)
- `src/lib/` progress storage, curriculum navigation, Python runner, theme
- `src/python/` Pyodide worker, the shared Python harness, and `epoch_sim.py` (simulated LLM, HTTP,
  documents, tools and logs for the engineering labs; `import epoch_sim`)
- `src/lib/sync.ts` optional GitHub sync (contents API); `src/lib/progress.ts` merge-safe progress

## Adding a lab

Add a lab to the unit's file in `content/labs/` (4 to 6 steps; each step has a goal, a
starter, a solution, hidden `assert` tests with messages, and two hints: a nudge and the
structure with `___` blanks). The unit's last lab starts each step from an empty function.
`npm run verify-content` checks each solution passes, and each starter and hint fails.
Labs that use `epoch_sim` must say what differs from the real library in `differs`.

## Adding a lesson

Add a lesson object to the unit file in `content/units/`, then run `npm run verify-content`.
Snippets must be 38 characters wide or less, cards three sentences or less, and every wrong
option needs a `why`. Preview any exercise at `#/lesson/<lesson-id>/<exercise-index>`.

Python runs in Pyodide 314.0.8 (pinned in `src/python/version.ts` and `package.json`).
