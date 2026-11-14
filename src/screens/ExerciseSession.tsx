import { useRef, useState, type ReactNode } from 'react';
import type { Exercise } from '../../content/schema';
import { CloseIcon, go } from '../components/Bits';
import { Inline } from '../components/Text';
import { useBarHeight } from '../components/useBarHeight';
import { kindOf } from '../exercises/registry';
import type { Grade } from '../exercises/types';
import { playResult } from '../lib/sound';

export interface SessionItem {
  ex: Exercise;
  /** Hidden code of the exercise's unit (e.g. `import numpy as np`). */
  prelude: string;
  /** Small label above the prompt, e.g. the lesson it comes from in a review. */
  from?: string;
}

/**
 * The exercise loop shared by lessons and reviews: answer, get specific
 * feedback, and any wrong answer comes back at the end until it is right.
 */
export function ExerciseSession({
  items,
  intro,
  onMistake,
  onFinish,
}: {
  items: SessionItem[];
  /** Shown before the first exercise (a lesson's concept card). */
  intro?: ReactNode;
  onMistake?: (exerciseId: string) => void;
  /** Called once every item has been answered correctly (or skipped). Maps id -> right first time. */
  onFinish: (firstTry: Record<string, boolean>) => void;
}) {
  const [phase, setPhase] = useState<'intro' | 'ex'>(intro ? 'intro' : 'ex');
  const [queue, setQueue] = useState<number[]>(() => items.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [value, setValue] = useState<unknown>(undefined);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [checking, setChecking] = useState(false);
  const firstTry = useRef<Record<string, boolean>>({});
  const solved = useRef<Set<number>>(new Set());
  const barRef = useBarHeight();

  const total = items.length;
  const item = items[queue[pos]];
  const ex = item.ex;
  const kind = kindOf(ex);
  const ready = !checking && (kind.ready ? kind.ready(ex, value) : value !== undefined);

  const check = async () => {
    if (!ready) return;
    setChecking(true);
    const g = await kind.grade(ex, value, { prelude: item.prelude });
    setChecking(false);
    setGrade(g);
    if (g.skipped) {
      solved.current.add(queue[pos]);
    } else if (g.correct) {
      if (firstTry.current[ex.id] === undefined) firstTry.current[ex.id] = true;
      solved.current.add(queue[pos]);
      playResult(true);
    } else {
      firstTry.current[ex.id] = false;
      onMistake?.(ex.id);
      setQueue((q) => [...q, queue[pos]]);
      playResult(false);
    }
  };

  const next = () => {
    if (pos + 1 >= queue.length) return onFinish(firstTry.current);
    setPos(pos + 1);
    setValue(undefined);
    setGrade(null);
  };

  const pct = phase === 'intro' ? 0 : (solved.current.size / total) * 100;
  const isRetry = queue.indexOf(queue[pos]) !== pos;

  return (
    <main className="screen lesson">
      <header className="lesson-top">
        <button className="icon-btn" aria-label="Leave" onClick={() => go('#/')}>
          <CloseIcon />
        </button>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="lesson-count">
          {Math.min(solved.current.size + (grade ? 0 : 1), total)}/{total}
        </span>
      </header>

      {phase === 'intro' ? (
        <section className="card-body" key="intro">
          {intro}
        </section>
      ) : (
        <section className="ex-body" key={`${ex.id}-${pos}`}>
          {isRetry ? <div className="eyebrow retry">Once more</div> : item.from && <div className="eyebrow">{item.from}</div>}
          <h2 className="prompt">
            <Inline text={ex.prompt} />
          </h2>
          <kind.Component ex={ex} prelude={item.prelude} value={value} onChange={setValue} locked={!!grade} grade={grade ?? undefined} />
        </section>
      )}

      <div className="action-bar" ref={barRef}>
        {grade && (
          <div className={`feedback ${grade.skipped ? 'skip' : grade.correct ? 'good' : 'bad'}`} role="status" aria-live="polite">
            <div className="feedback-title">{grade.skipped ? 'Skipped' : grade.correct ? 'Correct' : 'Not quite'}</div>
            {grade.message && (
              <p>
                <Inline text={grade.message} />
              </p>
            )}
            {!grade.correct && !grade.skipped && grade.answer && (
              <div className="feedback-answer">
                <span>Answer</span>
                <pre>{grade.answer}</pre>
              </div>
            )}
            {!grade.correct && !grade.skipped && <p className="feedback-note">It comes back at the end.</p>}
          </div>
        )}
        {phase === 'intro' ? (
          <button className="btn btn-primary btn-block" onClick={() => setPhase('ex')} autoFocus>
            Start
          </button>
        ) : grade ? (
          <button className={`btn btn-block ${grade.correct || grade.skipped ? 'btn-good' : 'btn-primary'}`} onClick={next} autoFocus>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary btn-block" disabled={!ready} onClick={check}>
            {checking ? 'Checking…' : kind.checkLabel ?? 'Check'}
          </button>
        )}
      </div>
    </main>
  );
}
