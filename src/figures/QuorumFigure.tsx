import { useState } from 'react';
import type { QuorumFigureSpec } from '../../content/schema';
import { quorumGoalMet, quorumStart, simulateQuorum, type QuorumState } from '../lib/quorum';

/**
 * N replicas, a write that needs W acknowledgements and a read that asks R
 * replicas. The write lands on the first W replicas that are up and the read
 * asks the last R (the unlucky case), so the read is fresh only when they
 * overlap: W + R > N.
 */
export function QuorumFigure({ spec, onGoal }: { spec: QuorumFigureSpec; onGoal?: () => void }) {
  const [st, setSt] = useState<QuorumState>(() => quorumStart(spec));
  const [met, setMet] = useState(false);
  const res = simulateQuorum(spec, st);

  const update = (next: QuorumState) => {
    if (met) return;
    setSt(next);
    if (quorumGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };
  const toggle = (i: number) => update({ ...st, down: st.down.includes(i) ? st.down.filter((x) => x !== i) : [...st.down, i].sort() });

  const g = spec.goal;
  const goalText = !g ? null : 'fresh' in g ? 'Goal: the read must see version 2.' : `Goal: with ${g.freshWithDown} replica${g.freshWithDown === 1 ? '' : 's'} down, the write succeeds and the read sees version 2.`;
  const stepper = (label: string, key: 'w' | 'r') => (
    <div className="cache-ctl">
      <span className="cache-ctl-label">{label}</span>
      <div className="stepper-ctl">
        <button type="button" className="btn btn-small" disabled={st[key] <= 1} onClick={() => update({ ...st, [key]: st[key] - 1 })} aria-label={`Lower ${label}`}>
          −
        </button>
        <span className="cache-val">{st[key]}</span>
        <button type="button" className="btn btn-small" disabled={st[key] >= spec.n} onClick={() => update({ ...st, [key]: st[key] + 1 })} aria-label={`Raise ${label}`}>
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="fig fig-quorum">
      {goalText && <p className="goal-line">{goalText}</p>}
      <div className="cache-controls">
        {stepper('W', 'w')}
        {stepper('R', 'r')}
      </div>
      <div className="lb-servers">
        {[...Array(spec.n).keys()].map((i) => {
          const isDown = st.down.includes(i);
          const v = res.written.includes(i) ? 2 : 1;
          return (
            <button
              key={i}
              type="button"
              className={`lb-server q-node${isDown ? ' down' : ''}${res.readFrom.includes(i) ? ' read' : ''}`}
              disabled={!spec.killable}
              onClick={() => toggle(i)}
              aria-label={`Replica ${i + 1}, ${isDown ? 'down' : `version ${v}`}${res.readFrom.includes(i) ? ', read' : ''}`}
            >
              <span className="lb-name">R{i + 1}</span>
              <span className="lb-state">{isDown ? 'down' : `v${v}`}</span>
            </button>
          );
        })}
      </div>
      <p className="muted small">Outlined: the replicas the read asks.</p>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {met
          ? 'Goal reached.'
          : `W + R = ${st.w + st.r}, N = ${spec.n} · write ${res.writeOk ? 'ok' : 'failed'} · read ${!res.readOk ? 'failed' : res.seen === 2 ? 'sees v2' : res.writeOk ? 'sees v1 (stale)' : 'sees v1'}`}
      </p>
    </div>
  );
}
