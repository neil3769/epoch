import { useRef, useState } from 'react';
import { go } from '../components/Bits';
import { buildReviewSet } from '../lib/curriculum';
import { dayKey } from '../lib/dates';
import { computeStats, creditedMinutes, getProgress, recordReview, reviewXp } from '../lib/progress';
import { DoneScreen } from './DoneScreen';
import { ExerciseSession } from './ExerciseSession';

export const REVIEW_SIZE = 10;
export const QUICK_SIZE = 5;

/** A review session: 10 items, or 5 in two-minute mode. Counts toward the goal and the streak. */
export function ReviewPlayer({ quick }: { quick: boolean }) {
  const [items] = useState(() =>
    buildReviewSet(getProgress(), quick ? QUICK_SIZE : REVIEW_SIZE, dayKey()).map((r) => ({
      ex: r.ex,
      prelude: r.unit.prelude ?? '',
      from: `${r.unit.id} · ${r.lesson.title}`,
    })),
  );
  const [done, setDone] = useState<{ xp: number; right: number; goalJustMet: boolean } | null>(null);
  const started = useRef(Date.now());

  if (items.length === 0)
    return (
      <main className="screen center">
        <p>Nothing to review yet. Finish a lesson first; anything you get wrong comes back here.</p>
        <button className="btn btn-primary" onClick={() => go('#/')}>
          Home
        </button>
      </main>
    );

  if (done) {
    const missed = items.length - done.right;
    return (
      <DoneScreen
        title={done.goalJustMet ? 'Daily goal reached' : quick ? 'Quick review done' : 'Review done'}
        line={
          `${done.right} of ${items.length} right first time.` +
          (missed ? ` The ${missed === 1 ? 'one you missed comes' : `${missed} you missed come`} back tomorrow.` : ' Those move further apart in the queue.')
        }
        xp={done.xp}
      />
    );
  }

  const finish = (firstTry: Record<string, boolean>) => {
    const before = computeStats(getProgress());
    const right = Object.values(firstTry).filter(Boolean).length;
    const xp = reviewXp(right);
    const ms = Date.now() - started.current;
    recordReview(quick ? 'quick' : 'review', firstTry, xp, quick ? creditedMinutes(ms, 2, 5) : creditedMinutes(ms, 3, 10));
    const after = computeStats(getProgress());
    setDone({ xp, right, goalJustMet: after.goalMet && !before.goalMet });
  };

  return <ExerciseSession items={items} onFinish={finish} />;
}
