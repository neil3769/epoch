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
