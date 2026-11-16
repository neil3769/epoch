import { useRef, useState } from 'react';
import { go } from '../components/Bits';
import { CodeBlock, Inline, OutputBlock } from '../components/Text';
import { Figure } from '../figures/Figure';
import { TEST_OUT, findLesson, labUnlocked, nextAfter } from '../lib/curriculum';
import { computeStats, creditedMinutes, getProgress, lessonXp, recordLesson, recordMistake } from '../lib/progress';
import { DoneScreen } from './DoneScreen';
import { ExerciseSession } from './ExerciseSession';

interface Done {
  xp: number;
  goalJustMet: boolean;
  right: number;
  testedOut: boolean;
}

export function LessonPlayer({ lessonId, previewFrom }: { lessonId: string; previewFrom?: number }) {
  const ref = findLesson(lessonId);
  const [done, setDone] = useState<Done | null>(null);
  const started = useRef(Date.now());

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
  const preview = previewFrom !== undefined;
  const total = lesson.exercises.length;

  if (done) {
    const upNext = nextAfter(lesson.id, getProgress());
    // Labs this lesson just opened (and not yet built).
    const newLabs = (unit.labs ?? []).filter((l) => l.unlockAfter === lesson.id && labUnlocked(l, getProgress()) && !getProgress().completed[l.id]);
    const checkpointLine = lesson.checkpoint
      ? done.testedOut
        ? `${done.right} of ${total} right first time: you tested out of ${unit.id}. Every lesson in it is marked done.`
        : `${done.right} of ${total} right first time. ${Math.ceil(TEST_OUT * total)} tests out of the whole unit; try again whenever you like.`
      : undefined;
    return (
      <DoneScreen
        title={done.goalJustMet ? 'Daily goal reached' : lesson.checkpoint ? 'Checkpoint done' : 'Lesson done'}
        line={lesson.summary}
        xp={done.xp}
        extra={
          <>
            {checkpointLine && <p className="done-note">{checkpointLine}</p>}
            {lesson.checkpoint && unit.library?.forReal && (
              <div className="done-note done-real">
                <strong>To do this for real</strong>
                <p>
                  <Inline text={unit.library.forReal} />
                </p>
              </div>
            )}
            {newLabs.map((lab) => (
              <button key={lab.id} className="rewrite-card" onClick={() => go(`#/lab/${lab.id}`)}>
                <span>
                  <strong>New lab: {lab.title}</strong>
                  <span className="unit-meta">{lab.minutes} min of real code, when you have time</span>
                </span>
              </button>
            ))}
          </>
        }
        next={upNext && { label: `Next: ${upNext.lesson.title}`, href: `#/lesson/${upNext.lesson.id}` }}
      />
    );
  }

  const finish = (firstTry: Record<string, boolean>) => {
    if (preview) return go('#/');
    const before = computeStats(getProgress());
    const right = Object.values(firstTry).filter(Boolean).length;
    const xp = lessonXp(right);
    // Passing the checkpoint well enough tests out of the unit: all its lessons count as done.
    const testedOut = !!lesson.checkpoint && right >= Math.ceil(TEST_OUT * total);
    recordLesson(lesson.id, xp, creditedMinutes(Date.now() - started.current), new Date(), testedOut ? unit.lessons.map((l) => l.id) : []);
    const after = computeStats(getProgress());
    setDone({ xp, goalJustMet: after.goalMet && !before.goalMet, right, testedOut });
  };

  const items = lesson.exercises.slice(previewFrom ?? 0).map((ex) => ({ ex, prelude: unit.prelude ?? '' }));

  const intro = preview ? undefined : (
    <>
      <div className="eyebrow">
        {unit.id} · {lesson.checkpoint ? 'Checkpoint' : `Lesson ${ref.index + 1}`}
      </div>
      <h1 className="card-title">{lesson.card.title}</h1>
      <p className="card-text">
        <Inline text={lesson.card.text} />
      </p>
      {lesson.card.code && <CodeBlock code={lesson.card.code} />}
      {lesson.card.output !== undefined && <OutputBlock text={lesson.card.output} />}
      {lesson.card.figure && <Figure spec={lesson.card.figure} />}
      {lesson.checkpoint && (
        <p className="card-note">
          Get {Math.ceil(TEST_OUT * total)} of {total} right first time to test out of {unit.id}: every lesson in it then counts as done.
        </p>
      )}
    </>
  );

  return <ExerciseSession items={items} intro={intro} onMistake={preview ? undefined : recordMistake} onFinish={finish} />;
}
