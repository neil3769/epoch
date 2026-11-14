import { useRef, useState } from 'react';
import { useBarHeight } from '../components/useBarHeight';
import type { Exercise } from '../../content/schema';
import { CheckIcon, CloseIcon, GoalRing, OrbitIcon, SparkIcon, go } from '../components/Bits';
import { CodeBlock, Inline, OutputBlock } from '../components/Text';
import { kindOf } from '../exercises/registry';
import type { Grade } from '../exercises/types';
import { Figure } from '../figures/Figure';
import { findLesson, nextAfter } from '../lib/curriculum';
import {
  computeStats,
  creditedMinutes,
  getProgress,
  lessonXp,
  recordLesson,
  recordMistake,
  useProgress,
} from '../lib/progress';

interface Done {
  xp: number;
  goalJustMet: boolean;
}

export function LessonPlayer({ lessonId, previewFrom }: { lessonId: string; previewFrom?: number }) {
  const ref = findLesson(lessonId);
  const progress = useProgress();
  const [phase, setPhase] = useState<'card' | 'ex' | 'done'>(previewFrom === undefined ? 'card' : 'ex');
  const [queue, setQueue] = useState<string[]>(() => ref?.lesson.exercises.slice(previewFrom ?? 0).map((e) => e.id) ?? []);
  const [pos, setPos] = useState(0);
  const [value, setValue] = useState<unknown>(undefined);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [checking, setChecking] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const firstTry = useRef<Record<string, boolean>>({});
  const solved = useRef<Set<string>>(new Set());
  const started = useRef(Date.now());
  const barRef = useBarHeight();

  if (!ref) {
    return (
      <main className="screen center">
        <p>That lesson does not exist.</p>
        <button className="btn" onClick={() => go('#/')}>
          Home
        </button>
      </main>
    );
  }
  const { unit, lesson } = ref;
  const prelude = unit.prelude ?? '';
  const total = lesson.exercises.length;
  const ex = lesson.exercises.find((e) => e.id === queue[pos]) as Exercise;
  const kind = kindOf(ex);
  const ready = !checking && (kind.ready ? kind.ready(ex, value) : value !== undefined);

  const check = async () => {
    if (!ready) return;
    setChecking(true);
    const g = await kind.grade(ex, value, { prelude });
    setChecking(false);
    setGrade(g);
    if (g.skipped) {
      solved.current.add(ex.id);
    } else if (g.correct) {
      if (firstTry.current[ex.id] === undefined) firstTry.current[ex.id] = true;
      solved.current.add(ex.id);
    } else {
      firstTry.current[ex.id] = false;
      if (previewFrom === undefined) recordMistake(ex.id);
      setQueue((q) => [...q, ex.id]);
    }
  };

  const finish = () => {
    if (previewFrom !== undefined) return go('#/');
    const before = computeStats(getProgress());
    const right = Object.values(firstTry.current).filter(Boolean).length;
    const xp = lessonXp(right);
    recordLesson(lesson.id, xp, creditedMinutes(Date.now() - started.current));
    const after = computeStats(getProgress());
    setDone({ xp, goalJustMet: after.goalMet && !before.goalMet });
    setPhase('done');
  };

  const next = () => {
    if (pos + 1 >= queue.length) return finish();
    setPos(pos + 1);
    setValue(undefined);
    setGrade(null);
  };

  // ------------------------------------------------------------ done ---
  if (phase === 'done' && done) {
    const stats = computeStats(progress);
    const upNext = nextAfter(lesson.id, progress);
    return (
      <main className="screen done-screen">
        <div className="done-top">
          <div className="done-badge">
            <CheckIcon size={40} />
          </div>
          <h1>{done.goalJustMet ? 'Daily goal reached' : 'Lesson done'}</h1>
          <p className="done-learned">
            <Inline text={lesson.summary} />
          </p>
        </div>
        <div className="done-stats">
          <div className="stat">
            <SparkIcon />
            <strong>+{done.xp}</strong>
            <span>XP</span>
          </div>
          <div className="stat">
            <OrbitIcon />
            <strong>{stats.streak}</strong>
            <span>day streak</span>
          </div>
          <div className="stat">
            <GoalRing value={stats.todayMinutes} goal={stats.goal} size={52}>
              <small>{Math.round(stats.todayMinutes)}</small>
            </GoalRing>
            <span>
              of {stats.goal} min today
            </span>
          </div>
        </div>
        <div className="action-bar" ref={barRef}>
          {upNext ? (
            <>
              <button className="btn btn-primary btn-block" onClick={() => go(`#/lesson/${upNext.lesson.id}`)}>
                Next: {upNext.lesson.title}
              </button>
              <button className="btn btn-ghost btn-block" onClick={() => go('#/')}>
                Home
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-block" onClick={() => go('#/')}>
              Home
            </button>
          )}
        </div>
      </main>
    );
  }

  const pct = phase === 'card' ? 0 : (solved.current.size / total) * 100;
  const isRetry = queue.indexOf(ex.id) !== pos;

  return (
    <main className="screen lesson">
      <header className="lesson-top">
        <button className="icon-btn" aria-label="Leave lesson" onClick={() => go('#/')}>
          <CloseIcon />
        </button>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="lesson-count">
          {Math.min(solved.current.size + (grade ? 0 : 1), total)}/{total}
        </span>
      </header>

      {phase === 'card' ? (
        <section className="card-body" key="card">
          <div className="eyebrow">
            {unit.id} · Lesson {ref.index + 1}
          </div>
          <h1 className="card-title">{lesson.card.title}</h1>
          <p className="card-text">
            <Inline text={lesson.card.text} />
          </p>
          {lesson.card.code && <CodeBlock code={lesson.card.code} />}
          {lesson.card.output !== undefined && <OutputBlock text={lesson.card.output} />}
          {lesson.card.figure && <Figure spec={lesson.card.figure} />}
        </section>
      ) : (
        <section className="ex-body" key={`${ex.id}-${pos}`}>
          {isRetry && <div className="eyebrow retry">Once more</div>}
          <h2 className="prompt">
            <Inline text={ex.prompt} />
          </h2>
          <kind.Component ex={ex} prelude={prelude} value={value} onChange={setValue} locked={!!grade} grade={grade ?? undefined} />
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
            {!grade.correct && !grade.skipped && <p className="feedback-note">It comes back at the end of the lesson.</p>}
          </div>
        )}
        {phase === 'card' ? (
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
