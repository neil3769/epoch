/*
 * npm run verify-content
 *
 * 1. Validates every unit against the schema plus rules zod cannot express
 *    (unique ids, answer indexes in range, an explanation for every wrong
 *    option, cards of at most three sentences, snippets at most 38 chars wide).
 * 2. Runs every Python snippet whose output or shape is used as an answer in
 *    Pyodide (the same runtime as the app) and fails if the recorded answer
 *    differs from the real result.
 * 3. Writes reports/content-verification.md, listing every exercise that could
 *    not be verified by execution so it can be re-derived by hand.
 *
 * Exit code 1 on any failure, so `npm run build` fails too.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPyodide, type PyodideInterface } from 'pyodide';
import { writtenUnits } from '../content/index';
import {
  UnitSchema,
  EXERCISE_TYPES,
  PRODUCING_TYPES,
  type Exercise,
  type FigureSpec,
  type Unit,
  type Card,
  type Lab,
  type LibraryPage,
} from '../content/schema';
import { HARNESS_PY, installSim } from '../src/python/harness';
import { fillGaps, countGaps, countSentences, splitLines } from '../src/lib/text';
import { shapeGoalReachable } from '../src/lib/shapes';

const MAX_WIDTH = 38;
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const errors: string[] = [];
const manual: { where: string; reason: string; detail: string }[] = [];
const structural: string[] = [];
let executed = 0;
let runs = 0;

const fail = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

// ---------------------------------------------------------------- python ---

const VERIFY_PY = String.raw`
import json
import numpy as np

def _eq(a, b):
    if isinstance(a, (np.ndarray, np.generic)) or isinstance(b, (np.ndarray, np.generic)):
        a2, b2 = np.asarray(a), np.asarray(b)
        return a2.shape == b2.shape and bool(np.array_equal(a2, b2))
    if isinstance(a, bool) or isinstance(b, bool):
        return a is b
    return bool(a == b)

async def _v_run(a):
    res, g = await _epoch_exec(a["src"])
    return json.dumps(res)

async def _v_shape(a):
    res, g = await _epoch_exec(a["src"])
    if not res["ok"]:
        return json.dumps({"shape": "error", "res": res})
    try:
        s = str(tuple(eval(a["target"], g).shape))
    except Exception as e:
        return json.dumps({"shape": "error", "res": res, "evalError": repr(e)})
    return json.dumps({"shape": s, "res": res})

async def _v_pairs(a):
    res, g = await _epoch_exec(a["src"])
    if not res["ok"]:
        return json.dumps({"error": res})
    lefts = [eval(l, g) for l in a["lefts"]]
    if a["mode"] == "shape":
        return json.dumps({"shapes": [str(tuple(np.shape(x))) for x in lefts]})
    rights = [eval(r, g) for r in a["rights"]]
    return json.dumps({"matrix": [[_eq(l, r) for r in rights] for l in lefts]})

def _v_grid(a):
    g = {"np": np}
    for name, v in a["inputs"].items():
        g[name] = np.array(v)
    r = np.asarray(eval(a["expr"], g))
    ans = np.asarray(a["answer"])
    return json.dumps({"result": r.tolist(), "ok": r.shape == ans.shape and bool(np.array_equal(r, ans))})
`;

let py: PyodideInterface;

async function call(fn: string, arg: unknown): Promise<any> {
  runs++;
  py.globals.set('_ARG', JSON.stringify(arg));
  const out = await py.runPythonAsync(`${fn}(json.loads(_ARG))`);
  const text = typeof out === 'string' ? out : await out;
  return JSON.parse(text as string);
}

interface RunResult {
  stdout: string;
  ok: boolean;
  type: string | null;
  msg: string | null;
  line: number | null;
}

const run = (src: string): Promise<RunResult> => call('await _v_run', { src });

const cleanOut = (s: string) =>
  s
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');

// ------------------------------------------------------------- structure ---

function checkWidth(where: string, label: string, code: string | undefined, max = MAX_WIDTH) {
  if (!code) return;
  splitLines(code).forEach((line, i) => {
    if (line.length > max) fail(where, `${label} line ${i + 1} is ${line.length} chars (max ${max}): ${line}`);
  });
}

function checkFigure(where: string, f: FigureSpec, needGoal: boolean) {
  const rect = (m: number[][]) => m.every((r) => r.length === m[0].length);
  if (f.kind === 'compare' || f.kind === 'stepper') {
    if (!rect(f.A) || !rect(f.B)) return fail(where, 'figure matrices must be rectangular');
    const [m, n] = [f.A.length, f.A[0].length];
    const [n2, p] = [f.B.length, f.B[0].length];
    if (n !== n2) fail(where, 'figure: A columns must equal B rows');
    if (f.kind === 'compare' && (m !== n2 || n !== p) && (f.panels ?? ['elementwise', 'matmul']).includes('elementwise'))
      fail(where, 'compare figure with an element-wise panel needs A and B of the same shape');
    if (needGoal && !f.goal) fail(where, 'figure exercise needs a goal');
    if (f.goal) {
      const [i, j] = f.goal.cell;
      if (i >= m || j >= p) fail(where, 'goal cell outside the result');
      if (f.kind === 'compare' && !(f.panels ?? ['elementwise', 'matmul']).includes(f.goal.panel))
        fail(where, 'goal panel is not shown');
    }
  } else {
    if (needGoal && !f.goal) fail(where, 'figure exercise needs a goal');
    if (f.goal && !shapeGoalReachable(f)) fail(where, 'shape-checker goal is not reachable with the editable dims');
    if (f.goal && shapeGoalReachable(f, true)) fail(where, 'shape-checker goal is already met at the start');
  }
}

function checkOptions(where: string, options: { text: string; why?: string }[], answerText: string, mono = true) {
  const texts = options.map((o) => o.text);
  if (new Set(texts).size !== texts.length) fail(where, 'duplicate option texts');
  const hits = texts.filter((t) => t === answerText).length;
  if (hits !== 1) fail(where, `answer must match exactly one option (matches ${hits})`);
  options.forEach((o) => {
    if (o.text !== answerText && !o.why) fail(where, `wrong option "${o.text}" has no explanation`);
  });
  if (mono) options.forEach((o) => checkWidth(where, "option", o.text));
}

function checkCard(where: string, card: Card) {
  const n = countSentences(card.text);
  if (n > 3) fail(where, `concept card has ${n} sentences (max 3)`);
  checkWidth(where, 'card code', card.code);
  checkWidth(where, 'card output', card.output);
  if (card.figure) checkFigure(where, card.figure, false);
}

function checkStructure(ex: Exercise, where: string) {
  checkWidth(where, 'code', 'code' in ex ? (ex.code as string | undefined) : undefined);
  switch (ex.type) {
    case 'mcq':
      if (ex.answer >= ex.options.length) return fail(where, 'answer index out of range');
      checkOptions(where, ex.options, ex.options[ex.answer].text, false);
      break;
    case 'predict-output':
    case 'predict-shape':
      if (ex.options) checkOptions(where, ex.options, ex.answer);
      else if (!ex.explain) fail(where, 'typed exercises need an explanation');
      if (ex.type === 'predict-shape' && !/^(error|\(\)|\(\d+,\)|\(\d+(, \d+)+\))$/.test(ex.answer))
        fail(where, `shape answer "${ex.answer}" is not a Python tuple or "error"`);
      checkWidth(where, 'answer', ex.answer);
      break;
    case 'fill-blank': {
      const gaps = countGaps(ex.code);
      if (gaps !== ex.answer.length) fail(where, `${gaps} gaps but ${ex.answer.length} answers`);
      ex.distractors.forEach((d) => {
        if (ex.answer.includes(d.text)) fail(where, `distractor "${d.text}" is also an answer`);
      });
      checkWidth(where, 'filled code', fillGaps(ex.code, ex.answer), MAX_WIDTH + 2);
      if (!ex.explain) fail(where, 'fill-blank needs an explanation for wrong placements');
      break;
    }
    case 'order-lines':
      checkWidth(where, 'line', ex.lines.map((l) => l.text).join('\n'));
      if (ex.lines.filter((l) => !l.fixed).length < 3) fail(where, 'needs at least 3 movable lines');
      break;
    case 'spot-bug': {
      const lines = splitLines(ex.code);
      if (ex.answer >= lines.length) return fail(where, 'answer line out of range');
      lines.forEach((l, i) => {
        if (i !== ex.answer && l.trim() && !ex.lineWhy[String(i)]) fail(where, `line ${i} has no explanation`);
      });
      Object.keys(ex.lineWhy).forEach((k) => {
        if (+k >= lines.length || +k === ex.answer) fail(where, `lineWhy key ${k} is invalid`);
      });
      break;
    }
    case 'match-pairs': {
      const l = ex.pairs.map((p) => p.left);
      const r = ex.pairs.map((p) => p.right);
      if (new Set(l).size !== l.length || new Set(r).size !== r.length) fail(where, 'pairs must be unique on both sides');
      break;
    }
    case 'number-grid': {
      const w = ex.answer[0].length;
      if (!ex.answer.every((row) => row.length === w)) fail(where, 'answer grid not rectangular');
      if (!ex.explain) fail(where, 'number-grid needs an explanation');
      break;
    }
    case 'run-code':
      checkWidth(where, 'before', ex.before);
      checkWidth(where, 'solution', ex.solution);
      break;
    case 'figure':
      checkFigure(where, ex.figure, true);
      break;
  }
}

// ------------------------------------------------------------- execution ---

function* permutations<T>(xs: T[]): Generator<T[]> {
  if (xs.length <= 1) {
    yield xs.slice();
    return;
  }
  for (let i = 0; i < xs.length; i++) {
    const rest = xs.slice(0, i).concat(xs.slice(i + 1));
    for (const p of permutations(rest)) yield [xs[i], ...p];
  }
}

const describe = (ex: Exercise): string => {
  const parts = [`Prompt: ${ex.prompt}`];
  if ('code' in ex && ex.code) parts.push('```\n' + ex.code + '\n```');
  if (ex.type === 'mcq') parts.push(`Answer: ${ex.options[ex.answer].text}`);
  else if (ex.type === 'match-pairs') parts.push('Pairs: ' + ex.pairs.map((p) => `${p.left} -> ${p.right}`).join('; '));
  else if (ex.type === 'fill-blank') parts.push(`Answer: ${ex.answer.join(', ')}`);
  return parts.join('\n\n');
};

async function verifyExercise(ex: Exercise, where: string, prelude: string) {
  const P = prelude ? prelude + '\n' : '';
  const offset = prelude ? splitLines(prelude).length : 0;
  let verified = false;

  if (ex.check) {
    const r = await run(P + ('code' in ex && ex.code ? ex.code + '\n' : '') + ex.check);
    if (!r.ok) fail(where, `check failed: ${r.type}: ${r.msg}`);
    verified = true;
  }

  switch (ex.type) {
    case 'mcq':
      if (ex.verifyOutput) {
        if (!ex.code) fail(where, 'verifyOutput needs code');
        else {
          const r = await run(P + ex.code);
          if (!r.ok) fail(where, `code raised ${r.type}: ${r.msg}`);
          else if (cleanOut(r.stdout) !== ex.options[ex.answer].text)
            fail(where, `prints ${JSON.stringify(cleanOut(r.stdout))}, answer says ${JSON.stringify(ex.options[ex.answer].text)}`);
          verified = true;
        }
      }
      break;
    case 'predict-output': {
      const r = await run(P + ex.code);
      if (!r.ok) fail(where, `code raised ${r.type}: ${r.msg}`);
      else if (cleanOut(r.stdout) !== ex.answer)
        fail(where, `prints ${JSON.stringify(cleanOut(r.stdout))}, answer says ${JSON.stringify(ex.answer)}`);
      for (const tw of ex.typedWrong ?? [])
        if (tw.answer === ex.answer) fail(where, `typedWrong "${tw.answer}" equals the answer`);
      verified = true;
      break;
    }
    case 'predict-shape': {
      const r = await call('await _v_shape', { src: P + ex.code, target: ex.target });
      if (r.shape !== ex.answer) fail(where, `real shape is ${r.shape}, answer says ${ex.answer}`);
      verified = true;
      break;
    }
    case 'fill-blank': {
      if (!ex.expectOutput) break;
      const r = await run(P + fillGaps(ex.code, ex.answer));
      if (!r.ok) fail(where, `filled code raised ${r.type}: ${r.msg}`);
      else if (cleanOut(r.stdout) !== ex.expectOutput)
        fail(where, `filled code prints ${JSON.stringify(cleanOut(r.stdout))}, expected ${JSON.stringify(ex.expectOutput)}`);
      // No other single-token swap may give the same output (the answer must be unique).
      const bank = [...new Set([...ex.answer, ...ex.distractors.map((d) => d.text)])];
      for (let gi = 0; gi < ex.answer.length; gi++) {
        for (const tok of bank) {
          if (tok === ex.answer[gi]) continue;
          const alt = ex.answer.slice();
          alt[gi] = tok;
          const ra = await run(P + fillGaps(ex.code, alt));
          if (ra.ok && cleanOut(ra.stdout) === ex.expectOutput)
            fail(where, `also correct with "${tok}" in gap ${gi + 1}: the answer is not unique`);
        }
      }
      verified = true;
      break;
    }
    case 'order-lines': {
      const texts = ex.lines.map((l) => l.text);
      const r = await run(P + texts.join('\n'));
      if (!r.ok) fail(where, `correct order raised ${r.type}: ${r.msg}`);
      else if (cleanOut(r.stdout) !== ex.expectOutput)
        fail(where, `correct order prints ${JSON.stringify(cleanOut(r.stdout))}`);
      const slots = ex.lines.map((l, i) => (l.fixed ? -1 : i)).filter((i) => i >= 0);
      const movable = slots.map((i) => texts[i]);
      const seen = new Set<string>([movable.join('\n')]);
      for (const perm of permutations(movable)) {
        const key = perm.join('\n');
        if (seen.has(key)) continue;
        seen.add(key);
        const prog = texts.slice();
        slots.forEach((slot, k) => (prog[slot] = perm[k]));
        const ra = await run(P + prog.join('\n'));
        if (ra.ok && cleanOut(ra.stdout) === ex.expectOutput) {
          fail(where, `another order also works:\n${prog.join('\n')}`);
          break;
        }
      }
      verified = true;
      break;
    }
    case 'spot-bug': {
      const r = await run(P + ex.code);
      if (r.ok) {
        fail(where, 'code ran without an error');
        break;
      }
      const actual = `${r.type}: ${r.msg}`.trim();
      const shown = ex.error.trim();
      const matches = shown.includes('...') ? actual.startsWith(shown.split('...')[0].trim()) : actual === shown;
      if (!matches) fail(where, `real error is ${JSON.stringify(actual)}`);
      const raise = ex.raiseLine ?? ex.answer;
      if (r.line === null || r.line - offset - 1 !== raise)
        fail(where, `error raised on line index ${r.line === null ? '?' : r.line - offset - 1}, content says ${raise}`);
      verified = true;
      break;
    }
    case 'match-pairs': {
      if (!ex.verify) break;
      const r = await call('await _v_pairs', {
        src: P + (ex.setup ?? ''),
        lefts: ex.pairs.map((p) => p.left),
        rights: ex.pairs.map((p) => p.right),
        mode: ex.verify,
      });
      if (r.error) {
        fail(where, `setup raised ${r.error.type}: ${r.error.msg}`);
        break;
      }
      if (ex.verify === 'shape') {
        ex.pairs.forEach((p, i) => {
          if (r.shapes[i] !== p.right) fail(where, `${p.left} has shape ${r.shapes[i]}, not ${p.right}`);
        });
      } else {
        (r.matrix as boolean[][]).forEach((row, i) =>
          row.forEach((eq, j) => {
            if (i === j && !eq) fail(where, `${ex.pairs[i].left} is not equal to ${ex.pairs[j].right}`);
            if (i !== j && eq) fail(where, `${ex.pairs[i].left} also equals ${ex.pairs[j].right}: ambiguous`);
          }),
        );
      }
      verified = true;
      break;
    }
    case 'number-grid': {
      const inputs = Object.fromEntries(ex.inputs.map((i) => [i.name, i.value]));
      const r = await call('_v_grid', { inputs, expr: ex.expr, answer: ex.answer });
      if (!r.ok) fail(where, `${ex.expr} is ${JSON.stringify(r.result)}, answer says ${JSON.stringify(ex.answer)}`);
      verified = true;
      break;
    }
    case 'run-code': {
      const before = ex.before ? ex.before + '\n' : '';
      const good = await run(P + before + ex.solution + '\n' + ex.tests);
      if (!good.ok) fail(where, `reference solution fails the tests: ${good.type}: ${good.msg}`);
      const empty = await run(P + before + 'pass\n' + ex.tests);
      if (empty.ok) fail(where, 'tests pass even with no learner code');
      verified = true;
      break;
    }
    case 'figure':
      structural.push(`${where} (${ex.figure.kind}): goal checked against the figure's data`);
      verified = true;
      break;
  }

  if (verified) executed++;
  else
    manual.push({
      where,
      reason: ex.type === 'mcq' ? 'conceptual multiple choice without a check' : `${ex.type} without executable expectation`,
      detail: describe(ex),
    });
}

async function verifyCard(card: Card, where: string, prelude: string) {
  if (!card.code) return;
  const r = await run((prelude ? prelude + '\n' : '') + card.code);
  if (!r.ok) fail(where, `card code raised ${r.type}: ${r.msg}`);
  else if (card.output !== undefined && cleanOut(r.stdout) !== card.output)
    fail(where, `card code prints ${JSON.stringify(cleanOut(r.stdout))}, card says ${JSON.stringify(card.output)}`);
}

// ------------------------------------------------------------------ labs ---

let labSteps = 0;

function checkLabStructure(lab: Lab, where: string, unit: Unit, isLast: boolean) {
  if (!unit.lessons.some((l) => l.id === lab.unlockAfter)) fail(where, `unlockAfter "${lab.unlockAfter}" is not a lesson of ${unit.id}`);
  if (countSentences(lab.intro) > 3) fail(where, 'intro is more than three sentences');
  checkWidth(where, 'given', lab.given);
  lab.steps.forEach((st, i) => {
    const w = `${where}/step ${i + 1}`;
    checkWidth(w, 'starter', st.starter);
    checkWidth(w, 'solution', st.solution);
    checkWidth(w, 'hint 2', st.hints[1]);
    if (countSentences(st.goal) > 3) fail(w, 'goal is more than three sentences');
    if (!st.hints[1].includes('___')) fail(w, 'hint 2 should show the structure with ___ blanks');
    // The last lab of a unit starts every step from an empty function.
    if (isLast && !/^def [^\n]+:\n {4}pass$/.test(st.starter)) fail(w, 'the last lab of a unit should start each step from an empty function');
    if (!isLast && st.starter.trim() !== 'pass' && !st.starter.includes('___') && !/pass$/.test(st.starter))
      fail(w, 'starter should leave something to write (___ gaps or an empty function)');
  });
}

async function verifyLab(lab: Lab, where: string, prelude: string) {
  const P = prelude ? prelude + '\n' : '';
  let soFar = P + (lab.given ? lab.given + '\n' : '');
  for (const [i, st] of lab.steps.entries()) {
    const w = `${where}/step ${i + 1}`;
    labSteps++;
    const good = await run(soFar + st.solution + '\n' + st.tests);
    if (!good.ok) fail(w, `solution fails its tests: ${good.type}: ${good.msg}`);
    const start = await run(soFar + st.starter + '\n' + st.tests);
    if (start.ok) fail(w, 'tests already pass with the starter code');
    const hinted = await run(soFar + st.hints[1] + '\n' + st.tests);
    if (hinted.ok) fail(w, 'tests pass with the hint-2 structure (its blanks give the answer away)');
    soFar += st.solution + '\n';
  }
  // Later steps must not break earlier ones.
  const all = await run(soFar + lab.steps.map((st) => st.tests).join('\n'));
  if (!all.ok) fail(where, `finished program fails an earlier step's tests: ${all.type}: ${all.msg}`);
}

async function verifyLibrary(page: LibraryPage, where: string, prelude: string) {
  checkWidth(where, 'example', page.example.code);
  const r = await run((prelude ? prelude + '\n' : '') + page.example.code);
  if (!r.ok) fail(where, `example raised ${r.type}: ${r.msg}`);
  else if (cleanOut(r.stdout) !== page.example.output)
    fail(where, `example prints ${JSON.stringify(cleanOut(r.stdout))}, page says ${JSON.stringify(page.example.output)}`);
}

// ------------------------------------------------------------------ main ---

async function main() {
  const t0 = Date.now();
  const units: Unit[] = [];
  for (const u of writtenUnits) {
    const parsed = UnitSchema.safeParse(u);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) fail(`unit ${u.id}`, `${issue.path.join('.')}: ${issue.message}`);
    } else units.push(parsed.data);
  }

  const ids = new Map<string, string>();
  const claim = (id: string, where: string) => {
    if (ids.has(id)) fail(where, `duplicate id "${id}" (also ${ids.get(id)})`);
    ids.set(id, where);
  };
  const typeCount = new Map<string, number>();
  let total = 0;
  let producing = 0;

  for (const u of units) {
    claim(u.id, `unit ${u.id}`);
    for (const l of u.lessons) {
      const lw = `${u.id}/${l.id}`;
      claim(l.id, lw);
      checkCard(lw + '/card', l.card);
      for (const ex of l.exercises) {
        const w = `${lw}/${ex.id}`;
        claim(ex.id, w);
        checkStructure(ex, w);
        total++;
        typeCount.set(ex.type, (typeCount.get(ex.type) ?? 0) + 1);
        if (PRODUCING_TYPES.includes(ex.type) || (ex.type === 'mcq' && ex.code)) producing++;
      }
    }
    const labs = u.labs ?? [];
    labs.forEach((lab, i) => {
      claim(lab.id, `${u.id}/${lab.id}`);
      checkLabStructure(lab, `${u.id}/${lab.id}`, u, i === labs.length - 1);
    });
    if (u.library && u.library.unit !== u.id) fail(`${u.id}/library`, `page is for unit ${u.library.unit}`);
  }
  for (const t of EXERCISE_TYPES) if (!typeCount.get(t)) fail('coverage', `exercise type "${t}" is never used`);

  py = await loadPyodide();
  await py.loadPackage(['numpy', 'pydantic'], { messageCallback: () => {} });
  installSim(py, readFileSync(join(root, 'src', 'python', 'epoch_sim.py'), 'utf8'));
  await py.runPythonAsync(HARNESS_PY);
  await py.runPythonAsync(VERIFY_PY);

  // The simulated services must support everything the engineering labs ask for.
  const sim = await run(readFileSync(join(root, 'scripts', 'sim_selftest.py'), 'utf8'));
  if (!sim.ok) fail('epoch_sim self-test', `line ${sim.line}: ${sim.type}: ${sim.msg}`);

  for (const u of units) {
    const prelude = u.prelude ?? '';
    for (const l of u.lessons) {
      await verifyCard(l.card, `${u.id}/${l.id}/card`, prelude);
      for (const ex of l.exercises) await verifyExercise(ex, `${u.id}/${l.id}/${ex.id}`, prelude);
    }
    for (const lab of u.labs ?? []) await verifyLab(lab, `${u.id}/${lab.id}`, prelude);
    if (u.library) await verifyLibrary(u.library, `${u.id}/library`, prelude);
  }

  const ratio = total ? producing / total : 0;
  if (ratio < 0.5) fail('quality', `only ${(ratio * 100).toFixed(0)}% of exercises ask to produce or predict (need 50%)`);

  const lines: string[] = [
    '# Content verification report',
    '',
    `Generated by \`npm run verify-content\` with Pyodide ${py.version}.`,
    '',
    `- Units: ${units.length}, lessons: ${units.reduce((n, u) => n + u.lessons.length, 0)}, exercises: ${total}`,
    `- Verified by execution or data check: ${executed}`,
    `- Not verifiable by execution (listed below for hand checking): ${manual.length}`,
    `- Exercises that produce or predict: ${producing} (${(ratio * 100).toFixed(0)}%)`,
    `- Labs: ${units.reduce((n, u) => n + (u.labs?.length ?? 0), 0)} (${labSteps} steps; each solution passes its tests, each starter and hint-2 structure fails them)`,
    `- Library pages: ${units.filter((u) => u.library).map((u) => u.id).join(', ') || 'none'} (example code executed)`,
    `- Simulated services self-test: ${errors.some((e) => e.startsWith('epoch_sim')) ? 'FAILED' : 'passed'}`,
    `- Python runs: ${runs}`,
    `- Result: ${errors.length ? `**FAILED** (${errors.length} problems)` : 'passed'}`,
    '',
    '## Exercise types used',
    '',
    ...EXERCISE_TYPES.map((t) => `- ${t}: ${typeCount.get(t) ?? 0}`),
    '',
    '## Figure goals (checked against the figure data, not by running Python)',
    '',
    ...structural.map((s) => `- ${s}`),
    '',
    '## Not verified by execution: re-derive by hand',
    '',
    ...manual.flatMap((m) => [`### ${m.where}`, '', `Reason: ${m.reason}`, '', m.detail, '']),
  ];
  if (errors.length) lines.push('## Problems', '', ...errors.map((e) => `- ${e}`), '');
  mkdirSync(join(root, 'reports'), { recursive: true });
  writeFileSync(join(root, 'reports', 'content-verification.md'), lines.join('\n'));

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (errors.length) {
    console.error(`verify-content FAILED (${errors.length} problems, ${secs}s):`);
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  console.log(
    `verify-content passed: ${total} exercises, ${executed} verified, ${manual.length} listed for hand checking, ${runs} Python runs, ${secs}s`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
