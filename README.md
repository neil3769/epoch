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

- `content/` lessons as data: `schema.ts` (zod), `index.ts` (catalogue), `units/*.ts` (one file per unit)
- `scripts/verify-content.ts` content checks; writes `reports/content-verification.md`
- `src/exercises/` exercise types, registered in `registry.tsx`
- `src/figures/` interactive figures (compare, stepper, shape checker)
- `src/lib/` progress storage, curriculum navigation, Python runner, theme
- `src/python/` Pyodide worker and the shared Python harness

## Adding a lesson

Add a lesson object to the unit file in `content/units/`, then run `npm run verify-content`.
Snippets must be 38 characters wide or less, cards three sentences or less, and every wrong
option needs a `why`. Preview any exercise at `#/lesson/<lesson-id>/<exercise-index>`.

Python runs in Pyodide 314.0.8 (pinned in `src/python/version.ts` and `package.json`).
