import { useState } from 'react';
import type { Track } from '../../content/index';
import { CheckIcon, GearIcon, GoalRing, MoonIcon, OrbitIcon, SparkIcon, SunIcon, go } from '../components/Bits';
import { toggleTheme, useTheme } from '../lib/theme';
import { useBarHeight } from '../components/useBarHeight';
import { checkpointOf, continueLesson, findExercise, unitDone, unitsForTrack } from '../lib/curriculum';
import { computeStats, dueItems, setDailyGoal, useProgress, type DailyGoal } from '../lib/progress';
import { SyncBadge } from './SyncBadge';

const TRACK_KEY = 'epoch.track';
const readTrack = (): Track => {
  try {
    return localStorage.getItem(TRACK_KEY) === 'engineering' ? 'engineering' : 'foundations';
  } catch {
    return 'foundations';
  }
};

const GOALS: DailyGoal[] = [5, 15, 30];

export function Home() {
  const p = useProgress();
  const stats = computeStats(p);
  const [track, setTrackState] = useState<Track>(readTrack);
  const barRef = useBarHeight();
  const theme = useTheme();
  const setTrack = (t: Track) => {
    setTrackState(t);
    try {
      localStorage.setItem(TRACK_KEY, t);
    } catch {
      /* per-device convenience only */
    }
  };

  const cont = continueLesson(p);
  const units = unitsForTrack(track);
  const hasHistory = p.activity.length > 0;
  const due = dueItems(p).filter((id) => findExercise(id)).length;
  const canReview = Object.keys(p.completed).length > 0 || Object.keys(p.review).length > 0;

  return (
    <main className="screen home">
      <header className="home-top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <OrbitIcon size={22} />
          </span>
          Epoch
        </div>
        <div className="chips">
          <SyncBadge />
          <button type="button" className="chip chip-btn" onClick={() => go('#/settings')} aria-label="Settings" title="Settings">
            <GearIcon />
          </button>
          <button
            type="button"
            className="chip chip-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <span
            className={`chip${stats.activeToday ? ' chip-on' : ''}`}
            title={`Day streak${stats.freezes ? `, ${stats.freezes} freeze${stats.freezes > 1 ? 's' : ''} banked` : ''}`}
          >
            <OrbitIcon /> {stats.streak}
            {stats.freezes > 0 && <span className="freeze-pip" aria-hidden="true" />}
            <span className="sr-only">
              {' '}
              day streak{stats.freezes ? `, ${stats.freezes} streak freeze${stats.freezes > 1 ? 's' : ''} banked` : ''}
            </span>
          </span>
          <span className="chip" title="Total XP">
            <SparkIcon /> {stats.totalXp}
            <span className="sr-only"> XP</span>
          </span>
        </div>
      </header>

      <section className="goal-card" aria-label="Daily goal">
        <GoalRing value={stats.todayMinutes} goal={stats.goal} size={72}>
          {stats.goalMet ? <CheckIcon size={26} /> : <strong>{Math.round(stats.todayMinutes)}</strong>}
        </GoalRing>
        <div className="goal-text">
          <div className="goal-line">
            {stats.goalMet ? 'Goal reached today' : `${Math.round(stats.todayMinutes)} of ${stats.goal} min today`}
          </div>
          <div className="seg" role="radiogroup" aria-label="Daily goal in minutes">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={stats.goal === g}
                className={`seg-btn${stats.goal === g ? ' on' : ''}`}
                onClick={() => setDailyGoal(g)}
              >
                {g} min
              </button>
            ))}
          </div>
        </div>
      </section>

      {canReview && (
        <section className="review-card" aria-label="Review">
          <div className="review-text">
            <strong>Review</strong>
            <span>{due ? `${due} item${due > 1 ? 's' : ''} due` : 'Nothing due · practise anyway'}</span>
          </div>
          <button className="btn btn-small" onClick={() => go('#/review/quick')}>
            2 min
          </button>
          <button className="btn btn-small btn-primary" onClick={() => go('#/review')}>
            Review
          </button>
        </section>
      )}

      {cont && hasHistory && !stats.activeToday && (
        <p className="pickup">
          {stats.frozeYesterday && 'A streak freeze covered yesterday. '}
          Pick up at <strong>{cont.lesson.title}</strong> ({cont.unit.id}).
        </p>
      )}

      <div className="tabs" role="tablist">
        {(['foundations', 'engineering'] as Track[]).map((t) => (
          <button key={t} role="tab" aria-selected={track === t} className={`tab${track === t ? ' on' : ''}`} onClick={() => setTrack(t)}>
            {t === 'foundations' ? 'Foundations' : 'AI Engineering'}
          </button>
        ))}
      </div>

      <div className="path">
        {units.map((u) => {
          if (!u.unit)
            return (
              <section key={u.id} className="unit unit-soon">
                <div className="unit-head">
                  <span className="unit-id">{u.id}</span>
                  <div>
                    <h3>{u.title}</h3>
                    <span className="unit-meta">{u.planned} lessons · coming soon</span>
                  </div>
                </div>
              </section>
            );
          const lessons = u.unit.lessons;
          const doneCount = lessons.filter((l) => p.completed[l.id]).length;
          const checkpoint = checkpointOf(u.unit);
          const canTestOut = checkpoint && !unitDone(u.unit, p);
          return (
            <section key={u.id} className="unit">
              <div className="unit-head">
                <span className="unit-id">{u.id}</span>
                <div>
                  <h3>{u.title}</h3>
                  <span className="unit-meta">
                    {doneCount}/{lessons.length} done
                    {lessons.length < u.planned ? ` · ${u.planned - lessons.length} more lessons coming` : ''}
                  </span>
                </div>
                {canTestOut && (
                  <button className="btn btn-small btn-ghost test-out" onClick={() => go(`#/lesson/${checkpoint.id}`)}>
                    Test out
                  </button>
                )}
              </div>
              <ol className="lessons">
                {lessons.map((l, i) => {
                  const isDone = !!p.completed[l.id];
                  const isNext = cont?.lesson.id === l.id;
                  return (
                    <li key={l.id}>
                      <button className={`lesson-row${isDone ? ' done' : ''}${isNext ? ' next' : ''}`} onClick={() => go(`#/lesson/${l.id}`)}>
                        <span className="dot" aria-hidden="true">
                          {isDone ? <CheckIcon size={14} /> : i + 1}
                        </span>
                        <span className="lesson-title">{l.title}</span>
                        {isNext && <span className="next-tag">next</span>}
                        <span className="sr-only">{isDone ? ' (done)' : ''}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="action-bar" ref={barRef}>
        {cont ? (
          <button className="btn btn-primary btn-block btn-big" onClick={() => go(`#/lesson/${cont.lesson.id}`)}>
            <span className="btn-kicker">{hasHistory ? 'Continue' : 'Start'}</span>
            {cont.lesson.title}
          </button>
        ) : (
          <button className="btn btn-block" disabled>
            Everything written so far is done
          </button>
        )}
      </div>
    </main>
  );
}
