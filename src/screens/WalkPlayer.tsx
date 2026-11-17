import { useEffect, useRef, useState } from 'react';
import { NODE_KINDS, type NodeKindT, type Walkthrough } from '../../content/schema';
import { SD_PRELUDE } from '../../content/units/s1';
import { CheckIcon, TopBar, go } from '../components/Bits';
import { Inline } from '../components/Text';
import { useBarHeight } from '../components/useBarHeight';
import { DiagramView } from '../figures/Diagram';
import { blankOpensOn, findWalk, walkNextStep, walkUnlocked } from '../lib/curriculum';
import { dayKey, shortDate } from '../lib/dates';
import { creditedMinutes, getProgress, lessonXp, recordBlankPass, recordWalkStep, saveNote, useProgress } from '../lib/progress';
import { ExerciseSession } from './ExerciseSession';

export const KIND_NAMES: Record<NodeKindT, string> = {
  client: 'Client',
  dns: 'DNS',
  cdn: 'CDN',
  lb: 'Load balancer',
  service: 'Service',
  cache: 'Cache',
  db: 'Database',
  replica: 'Replica',
  queue: 'Queue',
  worker: 'Worker',
  store: 'Object store',
  search: 'Search index',
  model: 'Model server',
  vector: 'Vector store',
  api: 'External API',
};

export type WalkMode = { kind: 'resume' } | { kind: 'step'; n: number } | { kind: 'summary' } | { kind: 'blank' };

/** A design walkthrough: seven framework steps, each a few decisions, then a note on what a strong answer says. */
export function WalkPlayer({ walkId, mode }: { walkId: string; mode: WalkMode }) {
  const p = useProgress();
  const w = findWalk(walkId);
  // Decide where to resume once, on opening: finishing a step must not jump
  // straight to the next one before its "strong answer" note is shown.
  const [resume] = useState(() => {
    const now = getProgress();
    return !w ? 0 : now.completed[w.id] ? -1 : walkNextStep(w, now);
  });
  if (!w)
    return (
      <main className="screen">
        <TopBar title="Walkthrough" />
        <p>There is no walkthrough called {walkId}.</p>
      </main>
    );
  if (!walkUnlocked(w, p))
    return (
      <main className="screen">
        <TopBar title={w.title} />
        <p>This walkthrough opens when you have finished {w.needs.join(', ')}: it uses everything in them.</p>
      </main>
    );
  if (mode.kind === 'blank') return <BlankPass w={w} />;
  if (mode.kind === 'summary' || (mode.kind === 'resume' && resume < 0)) return <WalkSummary w={w} />;
  const k = mode.kind === 'step' ? Math.min(Math.max(mode.n - 1, 0), w.steps.length - 1) : resume;
  return <WalkStepView key={`${w.id}-${k}`} w={w} k={k} />;
}

function WalkStepView({ w, k }: { w: Walkthrough; k: number }) {
  const step = w.steps[k];
  const [done, setDone] = useState(false);
  const started = useRef(Date.now());
  const barRef = useBarHeight();
  const last = k === w.steps.length - 1;
  const soFar = [...w.steps.slice(0, k)].reverse().find((s) => s.diagram)?.diagram;

  if (done)
    return (
      <main className="screen walk-strong">
        <TopBar title={`${w.title} · ${step.title}`} />
        <div className="eyebrow">
          Step {k + 1} of {w.steps.length} done
        </div>
        <h2>What a strong answer says here</h2>
        <p className="strong-note">
          <Inline text={step.strong} />
        </p>
        {step.diagram && <DiagramView spec={step.diagram} />}
        <div className="action-bar" ref={barRef}>
          {last ? (
            <button className="btn btn-primary btn-block" onClick={() => go(`#/walk/${w.id}/summary`)}>
              See the finished design
            </button>
          ) : (
            <>
              <button className="btn btn-primary btn-block" onClick={() => go(`#/walk/${w.id}/${k + 2}`)}>
                Step {k + 2}: {w.steps[k + 1].title}
              </button>
              <button className="btn btn-ghost btn-block" onClick={() => go('#/')}>
                Stop here and resume later
              </button>
            </>
          )}
        </div>
      </main>
    );

  const intro = (
    <>
      <div className="eyebrow">
        {w.title} · Step {k + 1} of {w.steps.length}
      </div>
      <h1 className="card-title">{step.title}</h1>
      {k === 0 ? (
        <p className="walk-question">
          <Inline text={w.question} />
        </p>
      ) : (
        <details className="walk-q">
          <summary>The question</summary>
          <p>
            <Inline text={w.question} />
          </p>
        </details>
      )}
      <p className="card-text">
        <Inline text={step.intro} />
      </p>
      {soFar && (
        <>
          <p className="muted small">The design so far:</p>
          <DiagramView spec={soFar} />
        </>
      )}
    </>
  );

  return (
    <ExerciseSession
      items={step.exercises.map((ex) => ({ ex, prelude: SD_PRELUDE, from: `${step.title}` }))}
      intro={intro}
      onFinish={(firstTry) => {
        const right = Object.values(firstTry).filter(Boolean).length;
        recordWalkStep(w.id, k + 1, last, lessonXp(right), creditedMinutes(Date.now() - started.current, 1, 6));
        setDone(true);
      }}
    />
  );
}

/** The finished design: also what the Library shows for this walkthrough. */
export function WalkSummary({ w }: { w: Walkthrough }) {
  const p = useProgress();
  const opens = blankOpensOn(w, p);
  const today = dayKey();
  const blankDone = p.completed[`${w.id}:blank`];
  return (
    <main className="screen lib-page">
      <TopBar title={w.title} />
      <section className="panel">
        <h2>The question</h2>
        <p>
          <Inline text={w.question} />
        </p>
      </section>
      <section className="panel">
        <h2>The design</h2>
        <DiagramView spec={w.final.diagram} />
        <ul className="rules">
          {w.final.decisions.map((d) => (
            <li key={d}>
              <Inline text={d} />
            </li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2>Step by step</h2>
        {w.steps.map((s, i) => (
          <details key={s.title} className="walk-q">
            <summary>
              {i + 1}. {s.title}
            </summary>
            <p>
              <Inline text={s.strong} />
            </p>
          </details>
        ))}
      </section>
      <section className="panel">
        <h2>From a blank page</h2>
        {blankDone ? (
          <p>
            <CheckIcon size={14} /> Done on {shortDate(dayKey(new Date(blankDone)))}. Do it again any time, out loud, with the timer.
          </p>
        ) : !p.completed[w.id] ? (
          <p className="muted">Finish all seven steps first.</p>
        ) : opens && opens > today ? (
          <p className="muted">
            Opens on {shortDate(opens)}: a week after you finished, so it tests memory rather than recall of the last few minutes.
          </p>
        ) : (
          <p>The same question with no options: list the requirements and choose the components yourself, with a 35-minute timer.</p>
        )}
        {(blankDone || (p.completed[w.id] && (!opens || opens <= today))) && (
          <button className="btn btn-primary" onClick={() => go(`#/walk/${w.id}/blank`)}>
            {blankDone ? 'Do the blank-page pass again' : 'Start the blank-page pass'}
          </button>
        )}
        <p className="muted small">
          <button className="link-btn" onClick={() => go(`#/walk/${w.id}/1`)}>
            Replay the guided steps
          </button>
        </p>
      </section>
    </main>
  );
}

const fmtClock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** A 35-minute countdown, started and paused by the learner. */
function Timer({ total = 35 * 60 }: { total?: number }) {
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const endsAt = useRef(0);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const rest = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000));
      setLeft(rest);
      if (rest === 0) setRunning(false);
    }, 500);
    return () => window.clearInterval(id);
  }, [running]);
  const toggle = () => {
    if (!running) endsAt.current = Date.now() + left * 1000;
    setRunning(!running);
  };
  return (
    <div className="timer" role="timer" aria-live="off">
      <span className={`timer-face${left === 0 ? ' over' : ''}`}>{fmtClock(left)}</span>
      <button className="btn btn-small" onClick={toggle}>
        {running ? 'Pause' : left === total ? 'Start' : left === 0 ? 'Time' : 'Resume'}
      </button>
      <button
        className="btn btn-small btn-ghost"
        onClick={() => {
          setRunning(false);
          setLeft(total);
        }}
      >
        Reset
      </button>
    </div>
  );
}

function BlankPass({ w }: { w: Walkthrough }) {
  const p = useProgress();
  const reqKey = `${w.id}:blank:req`;
  const compKey = `${w.id}:blank:comp`;
  const [req, setReq] = useState(() => p.labCode[reqKey]?.code ?? '');
  const [comps, setComps] = useState<Set<NodeKindT>>(() => {
    try {
      return new Set(JSON.parse(p.labCode[compKey]?.code ?? '[]') as NodeKindT[]);
    } catch {
      return new Set();
    }
  });
  const [shown, setShown] = useState(false);
  const started = useRef(Date.now());
  const toggle = (k: NodeKindT) =>
    setComps((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      saveNote(compKey, JSON.stringify([...next]));
      return next;
    });
  const ref = new Set(w.blank.components);

  return (
    <main className="screen lib-page blank-pass">
      <TopBar title={`${w.title} · blank page`} back={`#/walk/${w.id}/summary`} />
      <p className="card-note">
        A real interview also tests talking through the design. Do this pass out loud, as if to an interviewer, with the timer running.
      </p>
      <Timer />
      <section className="panel">
        <h2>The question</h2>
        <p>
          <Inline text={w.question} />
        </p>
      </section>
      <section className="panel">
        <h2>1. Requirements</h2>
        <p className="muted small">One per line: features in and out of scope, scale, what matters most.</p>
        <textarea
          className="notes-input"
          rows={6}
          value={req}
          onChange={(e) => setReq(e.target.value)}
          onBlur={() => saveNote(reqKey, req)}
          aria-label="Your requirements"
        />
      </section>
      <section className="panel">
        <h2>5. Components</h2>
        <p className="muted small">Pick every building block your design needs.</p>
        <div className="palette">
          {NODE_KINDS.map((k) => {
            const on = comps.has(k);
            const mark = !shown ? '' : on && ref.has(k) ? ' right' : on ? ' extra' : ref.has(k) ? ' missed' : '';
            return (
              <button key={k} type="button" className={`chip-toggle${on ? ' on' : ''}${mark}`} aria-pressed={on} onClick={() => !shown && toggle(k)}>
                {KIND_NAMES[k]}
              </button>
            );
          })}
        </div>
      </section>
      {!shown ? (
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            saveNote(reqKey, req);
            setShown(true);
          }}
        >
          Compare with the reference
        </button>
      ) : (
        <>
          <section className="panel">
            <h2>Reference requirements</h2>
            <ul className="rules">
              {w.blank.requirements.map((r) => (
                <li key={r}>
                  <Inline text={r} />
                </li>
              ))}
            </ul>
            <p className="muted small">Tick off the ones you had; the ones you missed are what to say next time.</p>
          </section>
          <section className="panel">
            <h2>Components</h2>
            <p className="muted small">Green: in both. Amber: in the reference but not picked. Struck through: picked but not needed.</p>
          </section>
          <section className="panel">
            <h2>Your first five minutes</h2>
            <ol className="rules">
              {w.blank.firstFive.map((r) => (
                <li key={r}>
                  <Inline text={r} />
                </li>
              ))}
            </ol>
          </section>
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              recordBlankPass(w.id, creditedMinutes(Date.now() - started.current, 5, 35));
              go(`#/walk/${w.id}/summary`);
            }}
          >
            {getProgress().completed[`${w.id}:blank`] ? 'Save this attempt' : 'Mark the pass done'}
          </button>
        </>
      )}
    </main>
  );
}
