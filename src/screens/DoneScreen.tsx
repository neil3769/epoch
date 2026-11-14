import type { ReactNode } from 'react';
import { CheckIcon, GoalRing, OrbitIcon, SparkIcon, go } from '../components/Bits';
import { Inline } from '../components/Text';
import { useBarHeight } from '../components/useBarHeight';
import { computeStats, useProgress } from '../lib/progress';

/** Completion screen: XP, streak, today's goal ring, one line on what was learned. */
export function DoneScreen({
  title,
  line,
  xp,
  extra,
  next,
}: {
  title: string;
  line: string;
  xp: number;
  extra?: ReactNode;
  next?: { label: string; href: string };
}) {
  const stats = computeStats(useProgress());
  const barRef = useBarHeight();
  return (
    <main className="screen done-screen">
      <div className="done-top">
        <div className="done-badge">
          <CheckIcon size={40} />
        </div>
        <h1>{title}</h1>
        <p className="done-learned">
          <Inline text={line} />
        </p>
        {extra}
      </div>
      <div className="done-stats">
        <div className="stat">
          <SparkIcon />
          <strong>+{xp}</strong>
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
          <span>of {stats.goal} min today</span>
        </div>
      </div>
      <div className="action-bar" ref={barRef}>
        {next ? (
          <>
            <button className="btn btn-primary btn-block" onClick={() => go(next.href)}>
              {next.label}
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
