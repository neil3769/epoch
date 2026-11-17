import { useState } from 'react';
import type { RingFigureSpec } from '../../content/schema';
import { assign, hash01, maxShare, moved, ringGoalMet, ringPoints, ringStart, type RingState } from '../lib/ringsim';

const COLOURS = ['var(--row-ink)', 'var(--col-ink)', 'var(--good)', 'var(--accent)', 'var(--bad)'];
const R = 92;
const C = 110;

const at = (pos: number, r = R): [number, number] => {
  const a = pos * 2 * Math.PI - Math.PI / 2;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

/**
 * Keys spread over servers, by hash modulo the server count or on a hash
 * ring. Add or remove servers and see which keys move; virtual nodes even
 * out the ring.
 */
export function RingFigure({ spec, onGoal }: { spec: RingFigureSpec; onGoal?: () => void }) {
  const [st, setSt] = useState<RingState>(() => ringStart(spec));
  const [met, setMet] = useState(false);
  const owner = assign(spec.keys, st);
  const before = assign(spec.keys, { ...st, servers: spec.servers });
  const mv = moved(spec, st);
  const share = maxShare(spec, st);

  const update = (next: RingState) => {
    if (met) return;
    setSt(next);
    if (ringGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };

  const g = spec.goal;
  const goalText = !g
    ? null
    : 'maxMoved' in g
      ? `Goal: grow to ${g.servers} servers while moving at most ${g.maxMoved} keys.`
      : `Goal: with ${g.servers} servers, no server holds more than ${Math.round(g.maxShare * 100)}% of the keys.`;

  return (
    <div className="fig fig-ring">
      {goalText && <p className="goal-line">{goalText}</p>}
      <div className="cache-controls">
        <div className="cache-ctl">
          <span className="cache-ctl-label">Servers</span>
          <div className="stepper-ctl">
            <button type="button" className="btn btn-small" disabled={st.servers <= 1} onClick={() => update({ ...st, servers: st.servers - 1 })} aria-label="Remove a server">
              −
            </button>
            <span className="cache-val">{st.servers}</span>
            <button type="button" className="btn btn-small" disabled={st.servers >= spec.maxServers} onClick={() => update({ ...st, servers: st.servers + 1 })} aria-label="Add a server">
              +
            </button>
          </div>
        </div>
        {spec.switchable && (
          <div className="cache-ctl">
            <span className="cache-ctl-label">Place by</span>
            <div className="seg" role="radiogroup" aria-label="Placement">
              {(['mod', 'ring'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={st.mode === m} className={`seg-btn${st.mode === m ? ' on' : ''}`} onClick={() => update({ ...st, mode: m })}>
                  {m === 'mod' ? 'hash % n' : 'Ring'}
                </button>
              ))}
            </div>
          </div>
        )}
        {(spec.vnodes?.length ?? 0) > 1 && (
          <div className="cache-ctl">
            <span className="cache-ctl-label">Virtual</span>
            <div className="seg" role="radiogroup" aria-label="Virtual nodes per server">
              {spec.vnodes!.map((v) => (
                <button key={v} type="button" role="radio" aria-checked={st.vnodes === v} className={`seg-btn${st.vnodes === v ? ' on' : ''}`} onClick={() => update({ ...st, vnodes: v })}>
                  {v === 1 ? 'none' : `${v} each`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <svg className="ring-svg" viewBox="0 0 220 220" role="img" aria-label="Hash ring with servers and keys">
        <circle cx={C} cy={C} r={R} className="ring-circle" />
        {st.mode === 'ring' &&
          ringPoints(st.servers, st.vnodes).map(([pos, s], i) => {
            const [x, y] = at(pos);
            return <rect key={i} x={x - 6} y={y - 6} width={12} height={12} rx={2} style={{ fill: COLOURS[s] }} className="ring-server" />;
          })}
        {spec.keys.map((k, i) => {
          const [x, y] = at(hash01(k), R - 16);
          return <circle key={k} cx={x} cy={y} r={5} style={{ fill: COLOURS[owner[i]] }} className={before[i] !== owner[i] ? 'ring-key moved' : 'ring-key'} />;
        })}
      </svg>
      <div className="lb-reqs" aria-label="Keys and their servers">
        {spec.keys.map((k, i) => (
          <span key={k} className={`ring-chip${before[i] !== owner[i] ? ' moved' : ''}`} style={{ borderColor: COLOURS[owner[i]], color: COLOURS[owner[i]] }}>
            {k}
          </span>
        ))}
      </div>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {met ? 'Goal reached.' : `Moved since ${spec.servers} servers: ${mv} of ${spec.keys.length} · busiest server ${Math.round(share * 100)}%`}
      </p>
    </div>
  );
}
