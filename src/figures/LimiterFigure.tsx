import { useState } from 'react';
import type { LimiterFigureSpec } from '../../content/schema';
import { MAX_LIMIT, MAX_RATE, limiterGoalMet, limiterStart, simulateLimiter, type LimiterAlgo, type LimiterState } from '../lib/limiter';

const ALGO_NAME: Record<LimiterAlgo, string> = { fixed: 'Fixed', sliding: 'Sliding', bucket: 'Bucket' };

/**
 * Requests arriving over a few seconds, grouped by second, each allowed or
 * rejected by the chosen rate-limiting algorithm. Shows the busiest
 * one-second span, where the fixed window's boundary burst appears.
 */
export function LimiterFigure({ spec, onGoal }: { spec: LimiterFigureSpec; onGoal?: () => void }) {
  const [st, setSt] = useState<LimiterState>(() => limiterStart(spec));
  const [met, setMet] = useState(false);
  const res = simulateLimiter(spec, st);
  const has = (c: 'limit' | 'rate') => (spec.controls ?? []).includes(c);

  const update = (next: LimiterState) => {
    if (met) return;
    setSt(next);
    if (limiterGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };

  const g = spec.goal;
  const goalParts = [
    g?.maxPerSecond !== undefined ? `never more than ${g.maxPerSecond} in any one second` : null,
    g?.minAllowed !== undefined ? `at least ${g.minAllowed} of ${spec.times.length} allowed` : null,
  ].filter(Boolean);
  const isBucket = st.algorithm === 'bucket';
  const stepper = (label: string, key: 'limit' | 'rate', hi: number) => (
    <div className="cache-ctl">
      <span className="cache-ctl-label">{label}</span>
      <div className="stepper-ctl">
        <button type="button" className="btn btn-small" disabled={st[key] <= 1} onClick={() => update({ ...st, [key]: st[key] - 1 })} aria-label={`Lower ${label.toLowerCase()}`}>
          −
        </button>
        <span className="cache-val">{st[key]}</span>
        <button type="button" className="btn btn-small" disabled={st[key] >= hi} onClick={() => update({ ...st, [key]: st[key] + 1 })} aria-label={`Raise ${label.toLowerCase()}`}>
          +
        </button>
      </div>
    </div>
  );

  const seconds = Math.floor(Math.max(...spec.times)) + 1;
  const rows = [...Array(seconds).keys()].map((s) => spec.times.map((t, i) => ({ t, i })).filter(({ t }) => Math.floor(t) === s));

  return (
    <div className="fig fig-limiter">
      {goalParts.length > 0 && <p className="goal-line">Goal: {goalParts.join(', ')}.</p>}
      <div className="cache-controls">
        {(spec.algorithms ?? []).length > 1 && (
          <div className="cache-ctl">
            <span className="cache-ctl-label">Algo</span>
            <div className="seg" role="radiogroup" aria-label="Algorithm">
              {spec.algorithms!.map((a) => (
                <button key={a} type="button" role="radio" aria-checked={st.algorithm === a} className={`seg-btn${st.algorithm === a ? ' on' : ''}`} onClick={() => update({ ...st, algorithm: a })}>
                  {ALGO_NAME[a]}
                </button>
              ))}
            </div>
          </div>
        )}
        {has('limit') ? stepper(isBucket ? 'Size' : 'Limit', 'limit', MAX_LIMIT) : null}
        {has('rate') && isBucket ? stepper('Refill', 'rate', MAX_RATE) : null}
      </div>
      <p className="muted small">
        {isBucket
          ? `Bucket of ${st.limit} tokens, starts full, refills ${st.rate} a second; each request takes one.`
          : `${ALGO_NAME[st.algorithm]} window: at most ${st.limit} a second${st.algorithm === 'fixed' ? ', counted per clock second' : ', counted over the last second'}.`}
      </p>
      <div className="lim-rows" aria-label="Requests by second">
        {rows.map((row, s) => (
          <div key={s} className="lim-row">
            <span className="lim-sec">{s} s</span>
            <div className="lim-reqs">
              {row.map(({ t, i }) => (
                <span key={i} className={`cache-read ${res.allowed[i] ? 'ev-hit' : 'ev-stale'}`} aria-label={`Request at ${t.toFixed(1)} s, ${res.allowed[i] ? 'allowed' : 'rejected'}`}>
                  {t.toFixed(1)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="cache-legend">
        <span className="cache-read ev-hit">ok</span> allowed <span className="cache-read ev-stale">429</span> rejected
      </p>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {met ? 'Goal reached.' : `${res.count} of ${spec.times.length} allowed · busiest second: ${res.peak} (from ${res.peakAt.toFixed(1)} s)`}
      </p>
    </div>
  );
}
