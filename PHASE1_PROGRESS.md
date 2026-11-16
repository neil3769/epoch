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
