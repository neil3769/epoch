import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CodeIcon, TopBar, go } from '../components/Bits';
import { CodeEditor, EditorKeys, type CodeEditorHandle } from '../components/CodeEditor';
import { CodeBlock, Inline, OutputBlock } from '../components/Text';
import { useBarHeight } from '../components/useBarHeight';
import { PythonStatus, readError } from '../exercises/runcode';
import { findLab, labCodeBefore, labUnlocked, stepId } from '../lib/curriculum';
import { creditedMinutes, getProgress, recordLabStep, useProgress } from '../lib/progress';
import { ensurePython, runPython, usePython } from '../lib/python';
import { playResult } from '../lib/sound';
import { normalizeTyped, splitLines } from '../lib/text';
import { DoneScreen } from './DoneScreen';

/* Drafts are a per-device convenience: unfinished code survives leaving the lab. */
const draftKey = (id: string) => `epoch.draft.${id}`;
const readDraft = (id: string) => {
  try {
    return localStorage.getItem(draftKey(id));
  } catch {
    return null;
  }
};
const writeDraft = (id: string, code: string | null) => {
  try {
    if (code === null) localStorage.removeItem(draftKey(id));
    else localStorage.setItem(draftKey(id), code);
  } catch {
    /* fine: drafts are optional */
  }
};

interface Result {
  ok: boolean;
  title: string;
  message?: string;
  detail?: string;
  stdout?: string;
}

const STEP_XP = 8;
const HINT_STEP_XP = 5;
const LAB_BONUS = 15;

/** Copy text, with a fallback for browsers without the async clipboard. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="btn btn-small"
      onClick={async () => {
        setDone(await copyText(text));
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? 'Copied' : 'Copy code'}
    </button>
  );
}

/** A finished lab: the learner's own program, to reopen and copy. */
function FinishedLab({ labId }: { labId: string }) {
  const p = useProgress();
  const ref = findLab(labId)!;
  const { lab } = ref;
  const code = labCodeBefore(lab, p, lab.steps.length);
  return (
    <main className="screen lab">
      <TopBar title={lab.title} />
      <p className="lab-summary">
        <Inline text={lab.summary} />
      </p>
      <div className="lab-label">Your program</div>
      <CodeBlock code={code} />
      <div className="row-btns">
        <CopyButton text={code} />
        <button className="btn btn-small btn-ghost" onClick={() => go(`#/lab/${lab.id}/again`)}>
          Write it again
        </button>
      </div>
    </main>
  );
}

/**
 * mode 'normal': continue the lab where it was left.
 * mode 'again': write the whole lab again from step 1 (it keeps the newest code).
 * mode 'single': rewrite one step without help, from the review queue.
 */
export type LabMode = 'normal' | 'again' | 'single';

export function LabPlayer({ labId, mode = 'normal', step }: { labId: string; mode?: LabMode; step?: number }) {
  const ref = findLab(labId);
  const p = getProgress();
  if (!ref)
    return (
      <main className="screen center">
        <p>That lab does not exist.</p>
        <button className="btn" onClick={() => go('#/')}>
          Home
        </button>
      </main>
    );
  if (mode === 'normal' && p.completed[labId]) return <FinishedLab labId={labId} />;
  return <LabSession key={`${labId}-${mode}-${step ?? ''}`} labId={labId} mode={mode} start={step} />;
}

function LabSession({ labId, mode, start }: { labId: string; mode: LabMode; start?: number }) {
  const { unit, lab } = findLab(labId)!;
  const total = lab.steps.length;
  /** Rewriting: the editor starts from the starter, not the saved code. */
  const rewrite = mode !== 'normal';
  const single = mode === 'single';
  const firstOpen = () => {
    const p = getProgress();
    const i = lab.steps.findIndex((_, k) => !p.completed[stepId(lab.id, k + 1)]);
    return i === -1 ? 0 : i;
  };
  const [k, setK] = useState(() => (single ? Math.min(total, Math.max(1, start ?? 1)) - 1 : mode === 'again' ? 0 : firstOpen()));
  const [phase, setPhase] = useState<'intro' | 'step' | 'done'>(rewrite || k > 0 ? 'step' : 'intro');
  const step = lab.steps[k];
  const sid = stepId(lab.id, k + 1);

  const initialCode = () => {
    const draft = readDraft(sid);
    if (draft !== null) return draft;
    if (rewrite) return step.starter;
    return getProgress().labCode[sid]?.code ?? step.starter;
  };
  const [code, setCode] = useState(initialCode);
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [running, setRunning] = useState(false);
  const [earned, setEarned] = useState(0);
  const editor = useRef<CodeEditorHandle>(null);
  const stepStarted = useRef(Date.now());
  const barRef = useBarHeight();
  const py = usePython();
  const p = useProgress();

  useEffect(() => {
    if (phase === 'step') void ensurePython();
  }, [phase]);

  if (!labUnlocked(lab, p) && !rewrite)
    return (
      <main className="screen center">
        <p>This lab opens after the lesson it builds on. Nothing else is locked.</p>
        <button className="btn btn-primary" onClick={() => go('#/')}>
          Home
        </button>
      </main>
    );

  if (phase === 'done')
    return (
      <DoneScreen
        title={single ? 'Step rewritten' : 'Lab done'}
        line={single ? 'You wrote it on your own this time. Rewritten without a hint, it leaves the review queue.' : lab.summary}
        xp={earned}
        extra={
          <div className="done-code">
            <CodeBlock code={labCodeBefore(lab, getProgress(), total)} />
            <CopyButton text={labCodeBefore(lab, getProgress(), total)} />
          </div>
        }
      />
    );

  if (phase === 'intro')
    return (
      <main className="screen lab">
        <TopBar title={lab.title} />
        <div className="eyebrow">
          {unit.id} · Lab {findLab(labId)!.index + 1} · about {lab.minutes} min
        </div>
        <p className="card-text">
          <Inline text={lab.intro} />
        </p>
        <ol className="lab-steps-list">
          {lab.steps.map((s, i) => (
            <li key={i}>
              <Inline text={s.goal.split(/(?<=[.!?])\s/)[0]} />
            </li>
          ))}
        </ol>
        {lab.differs && (
          <div className="note">
            <strong>Not quite the real thing:</strong> <Inline text={lab.differs} />
          </div>
        )}
        <p className="muted small">
          Comfortable on a phone, nicer with a keyboard: Epoch works in any desktop browser, and sync carries your progress across.
        </p>
        <div className="action-bar" ref={barRef}>
          <button className="btn btn-primary btn-block" onClick={() => setPhase('step')} autoFocus>
            Start
          </button>
        </div>
      </main>
    );

  const before = labCodeBefore(lab, p, k);
  const isLast = k === total - 1;

  const onEdit = (v: string) => {
    setCode(v);
    writeDraft(sid, v);
    if (result && !result.ok) setResult(null);
  };

  const runTests = async () => {
    setRunning(true);
    const prelude = unit.prelude ?? '';
    const mine = normalizeTyped(code).replace(/\s+$/, '');
    const parts = [prelude, before, mine, step.tests];
    const lineCount = (s: string) => (s ? splitLines(s).length : 0);
    const src = parts.filter((x) => x).join('\n');
    const r = await runPython(src);
    setRunning(false);
    if (!r) {
      setResult({ ok: false, title: 'Python could not load', message: 'Labs need Python. Try again when you are online; your code is kept.' });
      return;
    }
    if (r.timedOut) {
      setResult({ ok: false, title: 'Stopped after 8 seconds', message: 'Look for a loop that never ends.' });
      playResult(false);
      return;
    }
    if (r.ok) {
      const xp = (hints > 0 ? HINT_STEP_XP : STEP_XP) + (isLast ? LAB_BONUS : 0);
      recordLabStep(lab.id, k + 1, mine, hints > 0, isLast, xp, creditedMinutes(Date.now() - stepStarted.current, 1, 6));
      writeDraft(sid, null);
      setEarned((e) => e + xp);
      setResult({
        ok: true,
        title: 'Tests passed',
        message: [step.explain, hints > 0 ? 'You used a hint, so this step comes back later to write without help.' : '']
          .filter(Boolean)
          .join(' '),
        stdout: r.stdout || undefined,
      });
      playResult(true);
      return;
    }
    // Which part raised: the code so far, the learner's lines, or a hidden test?
    const startMine = [prelude, before].filter((x) => x).reduce((n, x) => n + lineCount(x), 0) + 1;
    const endMine = startMine + lineCount(mine) - 1;
    const line = r.line ?? -1;
    let where = '';
    if (line >= startMine && line <= endMine) where = `Line ${line - startMine + 1} of your code raised it. `;
    else if (line > endMine && r.type === 'AssertionError') where = 'A hidden test failed: its message says which case. ';
    else if (line > endMine) where = 'A hidden test could not use your code. ';
    setResult({
      ok: false,
      title: r.type === 'AssertionError' ? 'Not yet' : 'Python raised an error',
      message: where + readError(r.type),
      detail: `${r.type}: ${r.msg ?? ''}`.trim(),
      stdout: r.stdout || undefined,
    });
    playResult(false);
  };

  const nextStep = () => {
    // A rewrite from the review queue is one step; otherwise walk on to the last.
    if (single || isLast) return setPhase('done');
    const n = k + 1;
    const nid = stepId(lab.id, n + 1);
    const draft = readDraft(nid);
    const next = draft ?? (rewrite ? lab.steps[n].starter : getProgress().labCode[nid]?.code ?? lab.steps[n].starter);
    setK(n);
    // The editor is keyed by step, so it remounts with this text.
    setCode(next);
    setHints(0);
    setResult(null);
    stepStarted.current = Date.now();
    window.scrollTo(0, 0);
  };

  return (
    <main className="screen lab">
      <TopBar title={lab.title} />
      <div className="lab-progress" aria-label={`Step ${k + 1} of ${total}`}>
        {lab.steps.map((_, i) => (
          <span key={i} className={`lab-dot${i < k || (i === k && result?.ok) ? ' done' : i === k ? ' on' : ''}`} />
        ))}
        <span className="lab-step-label">
          Step {k + 1} of {total}
          {single ? ' · rewrite without help' : ''}
        </span>
      </div>

      <p className="lab-goal">
        <Inline text={step.goal} />
      </p>

      {before && (
        <details className="lab-sofar">
          <summary>
            <CodeIcon size={16} /> Code so far ({splitLines(before).length} lines)
          </summary>
          <CodeBlock code={before} className="code-context" />
        </details>
      )}

      <PythonStatus />
      <div className="lab-label">Your code</div>
      <CodeEditor key={sid} ref={editor} value={code} onChange={onEdit} label={`Code for step ${k + 1}`} />
      {!result?.ok && <EditorKeys onKey={(s) => editor.current?.insert(s)} />}

      {result && !result.ok && (
        <div className="error-box" role="status">
          <div className="error-label">{result.title}</div>
          {result.detail && <pre>{result.detail}</pre>}
          {result.message && (
            <p className="error-read">
              <Inline text={result.message} />
            </p>
          )}
        </div>
      )}
      {result?.stdout && <OutputBlock text={result.stdout.replace(/\n$/, '')} label="Your code printed" />}

      {!result?.ok && (
        <div className="hints">
          {hints >= 1 && (
            <div className="hint">
              <span className="hint-tag">Hint 1</span> <Inline text={step.hints[0]} />
            </div>
          )}
          {hints >= 2 && (
            <div className="hint">
              <span className="hint-tag">Hint 2 · the structure</span>
              <CodeBlock code={step.hints[1]} />
            </div>
          )}
          {hints >= 3 && (
            <div className="hint">
              <span className="hint-tag">Hint 3 · a solution</span>
              <CodeBlock code={step.solution} />
              <button
                className="btn btn-small"
                onClick={() => {
                  editor.current?.set(step.solution);
                  onEdit(step.solution);
                }}
              >
                Put it in the editor
              </button>
            </div>
          )}
          {hints < 3 && (
            <button className="btn btn-small btn-ghost" onClick={() => setHints(hints + 1)}>
              {hints === 0 ? 'Hint' : hints === 1 ? 'Show the structure' : 'Show a solution'}
            </button>
          )}
          {hints === 0 && <p className="muted small">Hints cost nothing; the step just comes back later to write on your own.</p>}
        </div>
      )}

      <div className="action-bar" ref={barRef}>
        {result?.ok && (
          <div className="feedback good" role="status" aria-live="polite">
            <div className="feedback-title">
              <CheckIcon /> {result.title}
            </div>
            {result.message && (
              <p>
                <Inline text={result.message} />
              </p>
            )}
          </div>
        )}
        {result?.ok ? (
          <button className="btn btn-good btn-block" onClick={nextStep} autoFocus>
            {isLast || single ? 'Finish' : 'Next step'}
          </button>
        ) : (
          <button className="btn btn-primary btn-block" disabled={running || py.status === 'loading' || !code.trim()} onClick={() => void runTests()}>
            {running ? 'Running…' : py.status === 'loading' ? 'Getting Python ready…' : 'Run tests'}
          </button>
        )}
      </div>
    </main>
  );
}
