import { useState } from 'react';
import type { CacheFigureSpec } from '../../content/schema';
import { SIZES, TTLS, cacheGoalMet, cacheStart, readKeys, simulateCache, type CacheState } from '../lib/cachesim';

const pct = (x: number) => `${Math.round(x * 100)}%`;
const ttlName = (t: number | null) => (t === null ? 'none' : `${t} s`);

/**
 * A stream of reads against a small cache: one read per second. Change the
 * size, the eviction policy and the TTL; each read shows as a hit, a miss
 * or a stale hit (served from cache after the source changed).
 */
export function CacheFigure({ spec, onGoal }: { spec: CacheFigureSpec; onGoal?: () => void }) {
  const [st, setSt] = useState<CacheState>(() => cacheStart(spec));
  const [met, setMet] = useState(false);
  const ed = new Set(spec.editable ?? []);
  const r = simulateCache(spec, st);
  const keys = readKeys(spec);

  const update = (next: CacheState) => {
    if (met) return;
    setSt(next);
    if (cacheGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };

  const g = spec.goal;
  const goalText = !g
    ? null
    : 'stale' in g
      ? 'Goal: make the cache serve a stale value.'
      : 'noStale' in g
        ? `Goal: no stale reads${g.minHitRate ? `, with a hit rate of at least ${pct(g.minHitRate)}` : ''}.`
        : `Goal: a hit rate of at least ${pct(g.hitRate)}.`;

  return (
    <div className="fig fig-cache">
      {goalText && <p className="goal-line">{goalText}</p>}
      <div className="cache-controls">
        <div className="cache-ctl">
          <span className="cache-ctl-label">Size</span>
          {ed.has('size') ? (
            <div className="stepper-ctl">
              <button type="button" className="btn btn-small" disabled={st.size <= SIZES[0]} onClick={() => update({ ...st, size: st.size - 1 })} aria-label="Smaller cache">
                −
              </button>
              <span className="cache-val">{st.size}</span>
              <button type="button" className="btn btn-small" disabled={st.size >= SIZES[SIZES.length - 1]} onClick={() => update({ ...st, size: st.size + 1 })} aria-label="Bigger cache">
                +
              </button>
            </div>
          ) : (
            <span className="cache-val">{st.size}</span>
          )}
        </div>
        <div className="cache-ctl">
          <span className="cache-ctl-label">Evict</span>
          {ed.has('policy') ? (
            <div className="seg" role="radiogroup" aria-label="Eviction policy">
              {(['lru', 'fifo'] as const).map((p) => (
                <button key={p} type="button" role="radio" aria-checked={st.policy === p} className={`seg-btn${st.policy === p ? ' on' : ''}`} onClick={() => update({ ...st, policy: p })}>
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          ) : (
            <span className="cache-val">{st.policy.toUpperCase()}</span>
          )}
        </div>
        <div className="cache-ctl">
          <span className="cache-ctl-label">TTL</span>
          {ed.has('ttl') ? (
            <div className="seg" role="radiogroup" aria-label="Time to live">
              {TTLS.map((t) => (
                <button key={String(t)} type="button" role="radio" aria-checked={st.ttl === t} className={`seg-btn${st.ttl === t ? ' on' : ''}`} onClick={() => update({ ...st, ttl: t })}>
                  {ttlName(t)}
                </button>
              ))}
            </div>
          ) : (
            <span className="cache-val">{ttlName(st.ttl)}</span>
          )}
        </div>
      </div>
      <div className="cache-reads" aria-label="Reads, one per second">
        {keys.map((k, i) => {
          const changed = (spec.changes ?? []).some((c) => c.at === i);
          return (
            <span key={i} className={`cache-read ev-${r.events[i]}`} title={`t=${i}: ${k}, ${r.events[i]}`}>
              {changed && <span className="cache-change" aria-label="source changed" />}
              {k}
            </span>
          );
        })}
      </div>
      <p className="cache-legend">
        <span className="cache-read ev-hit">hit</span> <span className="cache-read ev-miss">miss</span> <span className="cache-read ev-stale">stale</span>
        {spec.changes?.length ? ' · dot: the source changed then' : ''}
      </p>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {met ? 'Goal reached.' : `Hit rate ${pct(r.hitRate)} · stale reads ${r.stale}`}
      </p>
    </div>
  );
}
