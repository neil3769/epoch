import { useState } from 'react';
import type { QueueFigureSpec } from '../../content/schema';
import { MAX_RETRIES, maxWorkers, queueGoalMet, queueStart, simulateQueue, type QueueState } from '../lib/queuesim';

const KIND_TEXT: Record<string, string> = { f: 'fails once', p: 'always fails', c: 'crashes before ack' };
const OUT_TEXT = { done: 'done', twice: 'twice', lost: 'lost', dlq: 'DLQ' } as const;

/**
 * A backlog of jobs and the workers draining it. The learner sets the
 * workers, the retry limit, when to acknowledge, idempotent handling and a
 * dead-letter queue, and sees each job's outcome and when the backlog clears.
 */
export function QueueFigure({ spec, onGoal }: { spec: QueueFigureSpec; onGoal?: () => void }) {
  const [st, setSt] = useState<QueueState>(() => queueStart(spec));
  const [met, setMet] = useState(false);
  const res = simulateQueue(spec, st);
  const has = (c: QueueFigureSpec['controls'][number]) => spec.controls.includes(c);

  const update = (next: QueueState) => {
    if (met) return;
    setSt(next);
    if (queueGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };

  const g = spec.goal;
  const goalParts = [g?.clean ? 'every job done once (poison jobs parked)' : null, g?.clearBy ? `backlog clear within ${g.clearBy} ticks` : null].filter(Boolean);
  const n = spec.jobs.length;
  const cols = n <= 6 ? n : Math.ceil(n / 2);
  const special = [...spec.jobs].map((k, i) => (KIND_TEXT[k] ? `J${i + 1} ${KIND_TEXT[k]}` : null)).filter(Boolean);
  const stepper = (label: string, key: 'workers' | 'retries', lo: number, hi: number) => (
    <div className="cache-ctl">
      <span className="cache-ctl-label">{label}</span>
      <div className="stepper-ctl">
        <button type="button" className="btn btn-small" disabled={st[key] <= lo} onClick={() => update({ ...st, [key]: st[key] - 1 })} aria-label={`Fewer ${label.toLowerCase()}`}>
          −
        </button>
        <span className="cache-val">{st[key]}</span>
        <button type="button" className="btn btn-small" disabled={st[key] >= hi} onClick={() => update({ ...st, [key]: st[key] + 1 })} aria-label={`More ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );
  const drainText =
    res.ticks === null
      ? `arrivals (${spec.arrive ?? 0}/tick) keep up with workers: the backlog never clears`
      : `backlog clear in ${res.ticks} tick${res.ticks === 1 ? '' : 's'}`;

  return (
    <div className="fig fig-queue">
      {goalParts.length > 0 && <p className="goal-line">Goal: {goalParts.join(', ')}.</p>}
      <div className="cache-controls">
        {has('workers') && stepper('Workers', 'workers', 1, maxWorkers(spec))}
        {has('retries') && stepper('Retries', 'retries', 0, MAX_RETRIES)}
        {has('ack') && (
          <div className="cache-ctl">
            <span className="cache-ctl-label">Ack</span>
            <div className="seg" role="radiogroup" aria-label="When to acknowledge">
              {[false, true].map((after) => (
                <button key={String(after)} type="button" role="radio" aria-checked={st.ackAfter === after} className={`seg-btn${st.ackAfter === after ? ' on' : ''}`} onClick={() => update({ ...st, ackAfter: after })}>
                  {after ? 'After work' : 'First'}
                </button>
              ))}
            </div>
          </div>
        )}
        {has('idem') && (
          <label className="lb-toggle">
            <input type="checkbox" checked={st.idem} onChange={() => update({ ...st, idem: !st.idem })} /> Idempotent handling
          </label>
        )}
        {has('dlq') && (
          <label className="lb-toggle">
            <input type="checkbox" checked={st.dlq} onChange={() => update({ ...st, dlq: !st.dlq })} /> Dead-letter queue
          </label>
        )}
      </div>
      {special.length > 0 && <p className="muted small">{special.join(' · ')}</p>}
      <div className="q-jobs" aria-label="Jobs in the backlog" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {res.outcomes.map((o, i) => (
          <div key={i} className={`q-job ev-${o}`} aria-label={`Job ${i + 1}: ${OUT_TEXT[o]}`}>
            <b>J{i + 1}</b>
            <span>{OUT_TEXT[o]}</span>
          </div>
        ))}
      </div>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {met ? 'Goal reached.' : `${res.attempts} attempts on ${st.workers} worker${st.workers === 1 ? '' : 's'} · ${drainText} · lost ${res.lost}, twice ${res.twice}, DLQ ${res.dead}`}
      </p>
    </div>
  );
}
