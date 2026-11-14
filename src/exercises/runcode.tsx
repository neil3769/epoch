import { useEffect, useRef } from 'react';
import type { ExerciseOf } from '../../content/schema';
import { SymbolKeys, codeInputProps } from '../components/Keys';
import { CodeBlock } from '../components/Text';
import { ensurePython, runPython, usePython } from '../lib/python';
import { normalizeTyped, splitLines } from '../lib/text';
import type { ExProps, ExerciseKind, Grade } from './types';

/** One sentence on how to read each kind of error. Learning to read errors is part of the goal. */
const READ_ERROR: Record<string, string> = {
  NameError: 'A NameError means Python met a name it does not know: check the spelling, and that it was created before this line.',
  SyntaxError: 'A SyntaxError means Python could not read the line at all: look for a missing bracket, colon or quote.',
  IndentationError: 'An IndentationError means the spaces at the start of a line do not fit the code around it.',
  TypeError: 'A TypeError means a value of the wrong kind was used, such as calling something that is not a function.',
  ValueError: 'A ValueError means the kind of value was right but its contents were not, such as shapes that do not line up.',
  IndexError: 'An IndexError means you asked for a position past the end of a list.',
  KeyError: 'A KeyError names a key the dict does not have.',
  AttributeError: 'An AttributeError means the thing before the dot has no such name: check what comes after the dot.',
  AssertionError: 'An AssertionError means your code ran but gave the wrong result; the message says which case failed.',
};
const readError = (type: string | null) =>
  (type && READ_ERROR[type]) ?? 'Read the last line of an error first: it names the problem, and the line number says where.';

function PythonStatus() {
  const py = usePython();
  if (py.status === 'loading')
    return (
      <div className="py-status loading" role="status">
        <div className="py-bar" />
        <span>
          {py.stage || 'Getting Python ready'}… The first time, this downloads about 15 MB; after that Python works offline.
        </span>
      </div>
    );
  if (py.status === 'failed')
    return (
      <div className="py-status failed" role="status">
        Python could not load (no connection?). You can skip this one; it costs nothing.
      </div>
    );
  return null;
}

function RunCode({ ex, value, onChange, locked, grade }: ExProps<ExerciseOf<'run-code'>, string>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const py = usePython();
  // Lazy load: only now, when the learner reaches a run-code exercise.
  useEffect(() => {
    void ensurePython();
  }, []);
  const lines = ex.maxLines ?? 1;
  return (
    <>
      <PythonStatus />
      {ex.before && <CodeBlock code={ex.before} className="code-context" />}
      <textarea
        ref={ref}
        className="code-input code-area"
        rows={lines}
        value={value ?? ''}
        disabled={locked}
        placeholder={ex.placeholder ?? 'your code'}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Your code"
        {...codeInputProps}
      />
      {!locked && <SymbolKeys target={ref} onInsert={onChange} />}
      {!locked && py.status === 'ready' && <p className="hint-line">Hidden tests will run your code.</p>}
      {grade?.detail && (
        <div className="error-box" role="note">
          <div className="error-label">Python said</div>
          <pre>{grade.detail}</pre>
        </div>
      )}
    </>
  );
}

export const runCode: ExerciseKind<'run-code', string> = {
  Component: RunCode,
  ready: (_ex, v) => typeof v === 'string' && v.trim() !== '',
  checkLabel: 'Run',
  grade: async (ex, v, { prelude }): Promise<Grade> => {
    const user = normalizeTyped(v).replace(/\s+$/, '');
    const parts = [prelude, ex.before ?? '', user, ex.tests];
    const counts = parts.map((p) => (p ? splitLines(p).length : 0));
    const src = parts.filter((p) => p).join('\n');
    const r = await runPython(src);
    if (!r) return { correct: false, skipped: true, message: 'Python could not load, so this exercise is skipped. No penalty.' };
    if (r.timedOut)
      return {
        correct: false,
        message: 'Your code ran for more than 8 seconds and was stopped. Look for a loop that never ends.',
        answer: ex.solution,
      };
    if (r.ok) return { correct: true, message: ex.explain };

    const userStart = counts[0] + counts[1] + 1;
    const userEnd = userStart + counts[2] - 1;
    const line = r.line ?? -1;
    const detail = `${r.type}: ${r.msg ?? ''}`.trim();
    let where = '';
    if (line >= userStart && line <= userEnd) where = `Line ${line - userStart + 1} of your code raised it. `;
    else if (line > userEnd && r.type === 'AssertionError') where = 'A hidden test failed. ';
    else if (line > userEnd) where = 'A hidden test could not run your result. ';
    return { correct: false, message: where + readError(r.type), detail, answer: ex.solution };
  },
};
