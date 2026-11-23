import { useState } from 'react';
import type { PartitionFigureSpec } from '../../content/schema';
import { partitionGoalMet, simulatePartition, type OpOutcome, type PartitionMode } from '../lib/partition';

const MODE_NAME: Record<PartitionMode, string> = { accept: 'Keep serving', refuse: 'Refuse' };
const OUTCOME: Record<OpOutcome, { text: string; cls: string }> = {
  sold: { text: 'sold', cls: 'ev-hit' },
  'sold-out': { text: 'sold out', cls: '' },
  read: { text: 'shown', cls: 'ev-hit' },
  stale: { text: 'stale', cls: 'ev-stale' },
  refused: { text: 'refused', cls: 'ev-off' },
};

/**
 * A shop's replicas split into two sides that cannot talk. The learner
 * chooses to keep serving on both sides or to refuse on the minority side,
 * and sees each request's outcome and, when the split heals, what was oversold.
 */
export function PartitionFigure({ spec, onGoal }: { spec: PartitionFigureSpec; onGoal?: () => void }) {
  const [mode, setMode] = useState<PartitionMode>(spec.mode);
  const [met, setMet] = useState(false);
  const r = simulatePartition(spec, mode);

  const choose = (m: PartitionMode) => {
    if (met) return;
    setMode(m);
    if (partitionGoalMet(spec, m)) {
      setMet(true);
      onGoal?.();
    }
  };

  const g = spec.goal;
  const goalParts = [
    g?.noOversell ? 'nothing oversold' : null,
    g?.noStale ? 'no stale stock shown' : null,
    g?.allServed ? 'no customer refused' : null,
    g?.minServed !== undefined ? `at least ${g.minServed} requests answered` : null,
  ].filter(Boolean);
  const side = (s: 'a' | 'b', i: 0 | 1) => {
    const serving = mode === 'accept' || r.majority === s;
    return (
      <div className={`part-side${serving ? '' : ' off'}`}>
        <span className="lb-name">Side {s.toUpperCase()}</span>
        <span className="part-dots" aria-label={`${spec.nodes[i]} replicas`}>
          {'●'.repeat(spec.nodes[i])}
        </span>
        <span className="lb-state">
          {spec.nodes[i]} of {spec.nodes[0] + spec.nodes[1]}
          {r.majority === s ? ' · majority' : ''} · {serving ? 'serving' : 'refusing'}
        </span>
      </div>
    );
  };

  return (
    <div className="fig fig-partition">
      {goalParts.length > 0 && <p className="goal-line">Goal: {goalParts.join(', ')}.</p>}
      <div className="cache-controls">
        <div className="cache-ctl">
          <span className="cache-ctl-label">Split</span>
          <div className="seg" role="radiogroup" aria-label="What to do during the split">
            {(['accept', 'refuse'] as PartitionMode[]).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={`seg-btn${mode === m ? ' on' : ''}`} onClick={() => choose(m)}>
                {MODE_NAME[m]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="muted small">
        {mode === 'accept'
          ? 'Both sides keep selling from their own copy of the stock.'
          : r.majority
            ? `Only side ${r.majority.toUpperCase()}, which holds a majority of replicas, serves; the other refuses.`
            : 'Neither side holds a majority, so both refuse.'}{' '}
        Stock before the split: {spec.stock}.
      </p>
      <div className="part-sides">
        {side('a', 0)}
        <span className="part-cut" aria-label="Network cut">
          ✕
        </span>
        {side('b', 1)}
      </div>
      <ol className="part-ops" aria-label="Requests in order">
        {spec.ops.map((o, i) => {
          const out = OUTCOME[r.outcome[i]];
          return (
            <li key={i} className="part-op">
              <span className="part-who">
                {o.side.toUpperCase()} · {o.op}
              </span>
              <span className={`cache-read ${out.cls}`}>
                {o.op === 'read' && r.shown[i] !== null ? `${r.shown[i]} ` : ''}
                {out.text}
              </span>
            </li>
          );
        })}
      </ol>
      <p className={`fig-note${met ? ' good' : r.oversold > 0 ? ' bad' : ''}`} aria-live="polite">
        {met
          ? 'Goal reached.'
          : `After the split heals: sold ${r.sold.a + r.sold.b} of ${spec.stock}${r.oversold ? `, oversold by ${r.oversold}` : ''} · stale reads ${r.stale} · refused ${r.refused}`}
      </p>
    </div>
  );
}
