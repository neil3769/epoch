import { useState } from 'react';
import type { ShardFigureSpec } from '../../content/schema';
import { isLocal, rowLoad, shardGoalMet, shardKeys, shardStart, simulateShards, type ShardState } from '../lib/shard';

/**
 * Rows placed on shards by the hash of the chosen key. Each shard shows its
 * rows (labelled by the first field) and its share of the load, so a key
 * with few or uneven values shows up as one hot shard.
 */
export function ShardFigure({ spec, onGoal }: { spec: ShardFigureSpec; onGoal?: () => void }) {
  const [st, setSt] = useState<ShardState>(() => shardStart(spec));
  const [met, setMet] = useState(false);
  const res = simulateShards(spec, st);
  const keys = shardKeys(spec);

  const update = (next: ShardState) => {
    if (met) return;
    setSt(next);
    if (shardGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };

  const g = spec.goal;
  const goalParts = [
    g?.maxShare !== undefined ? `no shard over ${Math.round(g.maxShare * 100)}% of the load` : null,
    g?.local !== undefined ? `each ${g.local}'s rows on one shard` : null,
    g?.hot ? 'one shard carrying over half the load' : null,
  ].filter(Boolean);
  const top = res.share[res.busiest];
  const together = g?.local !== undefined ? isLocal(spec, res, g.local) : null;
  const who = spec.fields[0];

  return (
    <div className="fig fig-shard">
      {goalParts.length > 0 && <p className="goal-line">Goal: {goalParts.join(', ')}.</p>}
      <div className="cache-controls">
        {keys.length > 1 && (
          <div className="cache-ctl">
            <span className="cache-ctl-label">Key</span>
            <div className="seg" role="radiogroup" aria-label="Shard key">
              {keys.map((k) => (
                <button key={k} type="button" role="radio" aria-checked={st.key === k} className={`seg-btn${st.key === k ? ' on' : ''}`} onClick={() => update({ ...st, key: k })}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
        {spec.maxShards !== undefined && spec.maxShards > 2 && (
          <div className="cache-ctl">
            <span className="cache-ctl-label">Shards</span>
            <div className="stepper-ctl">
              <button type="button" className="btn btn-small" disabled={st.shards <= 2} onClick={() => update({ ...st, shards: st.shards - 1 })} aria-label="Fewer shards">
                −
              </button>
              <span className="cache-val">{st.shards}</span>
              <button type="button" className="btn btn-small" disabled={st.shards >= spec.maxShards} onClick={() => update({ ...st, shards: st.shards + 1 })} aria-label="More shards">
                +
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="muted small">
        Each row goes to shard hash({st.key}) % {st.shards}. Rows are labelled by {who}
        {spec.load ? '; a number is that row’s requests a second' : ''}.
      </p>
      <div className="shard-cols">
        {res.load.map((l, s) => (
          <div key={s} className={`shard-col${s === res.busiest && top > 0.5 ? ' hot' : ''}`} aria-label={`Shard ${s}: ${Math.round(res.share[s] * 100)}% of the load`}>
            <span className="shard-name">Shard {s}</span>
            <span className="shard-bar" aria-hidden="true">
              <span style={{ width: `${Math.round(res.share[s] * 100)}%` }} />
            </span>
            <span className="shard-pct">{Math.round(res.share[s] * 100)}%</span>
            <div className="shard-rows">
              {spec.rows.map((r, i) =>
                res.shard[i] === s ? (
                  <span key={i} className="cache-read" title={spec.fields.map((f, j) => `${f} ${r[j]}`).join(', ')}>
                    {r[0]}
                    {rowLoad(spec, i) > 1 ? <sub>{rowLoad(spec, i)}</sub> : null}
                  </span>
                ) : null,
              )}
            </div>
            {l === 0 && <span className="muted small">empty</span>}
          </div>
        ))}
      </div>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {met
          ? 'Goal reached.'
          : `Busiest shard: ${Math.round(top * 100)}% of the load${together === null ? '' : ` · each ${g!.local} on one shard: ${together ? 'yes' : 'no'}`}`}
      </p>
    </div>
  );
}
