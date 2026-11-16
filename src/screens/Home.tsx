import { useState } from 'react';
import type { Track } from '../../content/index';
import { CheckIcon, CodeIcon, GearIcon, GoalRing, LockIcon, MoonIcon, OrbitIcon, SparkIcon, SunIcon, go } from '../components/Bits';
import { toggleTheme, useTheme } from '../lib/theme';
import { useBarHeight } from '../components/useBarHeight';
import { allowedUnits, checkpointOf, continueLesson, findExercise, findLab, labRewrites, labUnlocked, unitDone, unitsForTrack } from '../lib/curriculum';
import { addDays, dayKey, shortDate } from '../lib/dates';
import { LibraryList } from './Library';
import { planWeekOn, unitsThisWeek } from '../../content/plan';
import { EXAM_UNITS, computeStats, dueItems, setDailyGoal, useProgress, type DailyGoal } from '../lib/progress';
import { SyncBadge } from './SyncBadge';

type Tab = Track | 'library';
const TABS: { id: Tab; label: string }[] = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'engineering', label: 'AI Engineering' },
  { id: 'library', label: 'Library' },
];

const TRACK_KEY = 'epoch.track';
const readTrack = (): Tab => {
  try {
    const v = localStorage.getItem(TRACK_KEY);
    return v === 'engineering' || v === 'library' ? v : 'foundations';
  } catch {
    return 'foundations';
  }
};

const GOALS: DailyGoal[] = [5, 15, 30];

export function Home() {
  const p = useProgress();
  const stats = computeStats(p);
  const [track, setTrackState] = useState<Tab>(readTrack);
  const barRef = useBarHeight();
  const theme = useTheme();
  const setTrack = (t: Tab) => {
    setTrackState(t);
    try {
      localStorage.setItem(TRACK_KEY, t);
    } catch {
      /* per-device convenience only */
    }
  };

  const cont = continueLesson(p);
  const only = allowedUnits(p);
  const units = track === 'library' ? [] : unitsForTrack(track).filter((u) => !only || only.has(u.id));
  const examEnd = shortDate(p.settings.exam.end);
  const rewrites = labRewrites(p, dayKey());
  const week = planWeekOn(dayKey());
  const thisWeek = new Set(unitsThisWeek(dayKey()));
  const weekTag = (id: string) => thisWeek.has(id) && <span className="week-tag">This week in your plan</span>;
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

      {stats.exam ? (
        <section className="goal-card" aria-label="Daily goal">
          <GoalRing value={stats.reviewedToday ? 1 : 0} goal={1} size={72}>
            {stats.goalMet ? <CheckIcon size={26} /> : <strong>0/1</strong>}
          </GoalRing>
          <div className="goal-text">
            <div className="goal-line">{stats.goalMet ? 'Review done: streak kept' : 'One short review today'}</div>
            <p className="exam-note">
              Exam mode until {examEnd}.{' '}
              <button type="button" className="link-btn" onClick={() => go('#/settings')}>
                Change
              </button>
            </p>
          </div>
        </section>
      ) : (
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
      )}

      {(canReview || stats.exam) && (
        <section className="review-card" aria-label="Review">
          <div className="review-text">
            <strong>Review</strong>
            <span>{due ? `${due} item${due > 1 ? 's' : ''} due` : 'Nothing due · practise anyway'}</span>
          </div>
          <button className={`btn btn-small${stats.exam ? ' btn-primary' : ''}`} onClick={() => go('#/review/quick')}>
            2 min
          </button>
          <button className={`btn btn-small${stats.exam ? '' : ' btn-primary'}`} onClick={() => go('#/review')}>
            Review
          </button>
        </section>
      )}

      {rewrites.length > 0 && (
        <button className="rewrite-card" onClick={() => go(`#/lab/${rewrites[0].labId}/${rewrites[0].step}`)}>
          <CodeIcon />
          <span>
            <strong>Rewrite a lab step on your own</strong>
            <span className="unit-meta">
              {rewrites.length} step{rewrites.length > 1 ? 's' : ''} you finished with a hint · {findLab(rewrites[0].labId)?.lab.title}
            </span>
          </span>
        </button>
      )}

      {cont && hasHistory && !stats.activeToday && (
        <p className="pickup">
          {stats.frozeYesterday && 'A streak freeze covered yesterday. '}
          Pick up at <strong>{cont.lesson.title}</strong> ({cont.unit.id}).
        </p>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={track === t.id} className={`tab${track === t.id ? ' on' : ''}`} onClick={() => setTrack(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {only && track !== 'library' && (
        <p className="plan-line">
          <strong>Paused for exams</strong> until {examEnd}: only {EXAM_UNITS.join(', ')} and review are on. The rest come back on{' '}
          {shortDate(addDays(p.settings.exam.end, 1))}.
        </p>
      )}
      {track === 'library' && <LibraryList />}
      {track === 'engineering' && week && (
        <p className="plan-line">
          <strong>{week.label}</strong> of your plan: {week.focus}.
        </p>
      )}

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
                    {weekTag(u.id)}
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
                  {weekTag(u.id)}
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
              {(u.unit.labs ?? []).length > 0 && (
                <ol className="lessons labs" aria-label={`${u.id} labs`}>
                  {u.unit.labs!.map((lab) => {
                    const open = labUnlocked(lab, p);
                    const isDone = !!p.completed[lab.id];
                    const after = findLab(lab.id) && u.unit!.lessons.findIndex((l) => l.id === lab.unlockAfter) + 1;
                    return (
                      <li key={lab.id}>
                        <button className={`lesson-row lab-row${isDone ? ' done' : ''}${open ? '' : ' locked'}`} disabled={!open} onClick={() => go(`#/lab/${lab.id}`)}>
                          <span className="dot" aria-hidden="true">
                            {isDone ? <CheckIcon size={14} /> : open ? <CodeIcon size={14} /> : <LockIcon size={12} />}
                          </span>
                          <span className="lesson-title">
                            Lab: {lab.title}
                            <span className="unit-meta">{open ? `${lab.minutes} min · write real code` : `Opens after lesson ${after}`}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
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
