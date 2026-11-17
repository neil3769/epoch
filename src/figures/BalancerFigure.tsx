import { useState } from 'react';
import type { BalancerFigureSpec } from '../../content/schema';
import { LB_NAMES, lbGoalMet, lbStart, simulateLb, type LbAlgo, type LbState } from '../lib/lbsim';

const COLOURS = ['var(--row-ink)', 'var(--col-ink)', 'var(--good)', 'var(--accent)'];

/**
 * A load balancer in front of 2 to 4 servers. Requests from users A, B, C…
 * arrive one per tick, each busy for a few ticks. Choose the algorithm, take
 * servers down, turn health checks on, and watch where each request goes.
 */
export function BalancerFigure({ spec, onGoal }: { spec: BalancerFigureSpec; onGoal?: () => void }) {
  const [st, setSt] = useState<LbState>(() => lbStart(spec));
  const [met, setMet] = useState(false);
  const r = simulateLb(spec, st);
  const algos = spec.algorithms ?? [spec.algorithm];

  const update = (next: LbState) => {
    if (met) return;
    setSt(next);
    if (lbGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };
  const toggleDown = (i: number) =>
    update({ ...st, down: st.down.includes(i) ? st.down.filter((x) => x !== i) : [...st.down, i].sort() });

  const failed = r.failed.filter(Boolean).length;
  const goalText = !spec.goal
    ? null
    : 'sticky' in spec.goal
      ? 'Goal: every user stays on one server, with no failed requests.'
      : 'maxPeak' in spec.goal
        ? `Goal: no server ever holds more than ${spec.goal.maxPeak} request${spec.goal.maxPeak === 1 ? '' : 's'} at once.`
        : 'Goal: no failed requests while a server is down.';

  return (
    <div className="fig fig-lb">
      {goalText && <p className="goal-line">{goalText}</p>}
      {algos.length > 1 && (
        <div className="seg" role="radiogroup" aria-label="Algorithm">
          {algos.map((a: LbAlgo) => (
            <button key={a} type="button" role="radio" aria-checked={st.algorithm === a} className={`seg-btn${st.algorithm === a ? ' on' : ''}`} onClick={() => update({ ...st, algorithm: a })}>
              {LB_NAMES[a]}
            </button>
          ))}
        </div>
      )}
      {spec.toggleHealth && (
        <label className="lb-toggle">
          <input type="checkbox" checked={st.health} onChange={() => update({ ...st, health: !st.health })} /> Health checks
        </label>
      )}
      <div className="lb-servers">
        {[...Array(spec.servers).keys()].map((i) => {
          const isDown = st.down.includes(i);
          return (
            <button
              key={i}
              type="button"
              className={`lb-server${isDown ? ' down' : ''}`}
              style={{ borderColor: COLOURS[i] }}
              disabled={!spec.killable}
              onClick={() => toggleDown(i)}
              aria-label={`Server ${i + 1}, ${isDown ? 'down' : 'up'}${spec.killable ? ', tap to switch' : ''}`}
            >
              <span className="lb-name" style={{ color: COLOURS[i] }}>
                S{i + 1}
              </span>
              <span className="lb-state">{isDown ? 'down' : `peak ${r.peak[i]}`}</span>
            </button>
          );
        })}
      </div>
      <div className="lb-reqs" aria-label="Requests in order">
        {spec.requests.map((q, i) => (
          <span key={i} className={`lb-req${r.failed[i] ? ' failed' : ''}`} style={{ background: r.failed[i] ? undefined : COLOURS[r.assign[i]] }} title={`${q.user}, ${q.cost} ticks`}>
            {q.user}
            {q.cost > 1 && <sub>{q.cost}</sub>}
          </span>
        ))}
      </div>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {met
          ? 'Goal reached.'
          : `Failed ${failed} · users split across servers: ${r.split.length ? r.split.join(', ') : 'none'} · busiest peak ${Math.max(...r.peak)}`}
      </p>
    </div>
  );
}
