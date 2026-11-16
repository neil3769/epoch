import { useState } from 'react';
import type { DescentFigureSpec } from '../../content/schema';
import { LRS, fAt, slopeAt, stepFrom } from '../lib/descent';
import { fmt } from './Matrix';

const W = 320;
const H = 170;
const PAD = 14;

/**
 * Gradient descent on a curve: a ball on f(x) = a(x − m)² + c, a Step
 * button, and (optionally) a learning-rate slider. Each step moves the ball
 * by −lr × slope; too large a rate overshoots and can fly off.
 */
export function DescentFigure({ spec, onGoal }: { spec: DescentFigureSpec; onGoal?: () => void }) {
  const [lr, setLr] = useState(spec.lr);
  const [xs, setXs] = useState<number[]>([spec.start]);
  const [met, setMet] = useState(false);
  const x = xs[xs.length - 1];
  const steps = xs.length - 1;

  const span = Math.max(Math.abs(spec.start - spec.m) * 1.6, 1);
  const x0 = spec.m - span;
  const x1 = spec.m + span;
  const yMax = fAt(spec, x0);
  const yMin = spec.c ?? 0;
  const sx = (v: number) => PAD + ((v - x0) / (x1 - x0)) * (W - 2 * PAD);
  const sy = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD);
  const curve = Array.from({ length: 81 }, (_, i) => {
    const v = x0 + ((x1 - x0) * i) / 80;
    return `${i ? 'L' : 'M'}${sx(v).toFixed(1)},${sy(fAt(spec, v)).toFixed(1)}`;
  }).join(' ');
  const off = x < x0 || x > x1;
  const clampX = Math.min(x1, Math.max(x0, x));

  const goal = spec.goal;
  const outOfSteps = !!goal && !met && steps >= goal.maxSteps;

  const step = () => {
    if (met || outOfSteps) return;
    const nx = stepFrom(spec, x, lr);
    const next = [...xs, nx];
    setXs(next);
    if (goal && Math.abs(nx - spec.m) <= goal.within && next.length - 1 <= goal.maxSteps) {
      setMet(true);
      onGoal?.();
    }
  };
  const reset = () => {
    if (met) return;
    setXs([spec.start]);
  };

  const slope = slopeAt(spec, x);
  const r = (v: number) => fmt(+v.toFixed(3));
  let note = `x = ${r(x)}, slope = ${r(slope)}. Next step: −${r(lr)} × ${r(slope)} = ${r(-lr * slope)}.`;
  if (off) note = `x = ${r(x)}: off the chart. The rate is too large, so each step overshoots further.`;
  if (outOfSteps) note = `${goal!.maxSteps} steps used and not there yet. Reset and try another rate.`;

  return (
    <div className="fig fig-descent">
      <svg viewBox={`0 0 ${W} ${H}`} className="gd-plot" role="img" aria-label="Loss curve with a ball">
        <line x1={sx(spec.m)} x2={sx(spec.m)} y1={PAD} y2={H - PAD} className="gd-min" />
        <path d={curve} className="gd-curve" />
        {xs.slice(0, -1).map((v, i) =>
          v >= x0 && v <= x1 ? <circle key={i} cx={sx(v)} cy={sy(fAt(spec, v))} r={3} className="gd-trail" /> : null,
        )}
        <circle cx={sx(clampX)} cy={off ? PAD : sy(fAt(spec, x))} r={8} className={`gd-ball${met ? ' good' : off ? ' bad' : ''}`} />
      </svg>
      {spec.editableLr && (
        <label className="gd-lr">
          <span>
            learning rate <b>{r(lr)}</b>
          </span>
          <input
            type="range"
            aria-label="learning rate"
            min={0}
            max={LRS.length - 1}
            step={1}
            value={Math.max(0, LRS.indexOf(lr))}
            disabled={met || steps > 0}
            onChange={(e) => setLr(LRS[Number(e.target.value)])}
          />
        </label>
      )}
      <div className="gd-buttons">
        <button type="button" className="btn btn-small" onClick={step} disabled={met || outOfSteps}>
          Step
        </button>
        <button type="button" className="btn btn-small btn-ghost" onClick={reset} disabled={met || steps === 0}>
          Reset
        </button>
        <span className="gd-count">
          {goal ? `step ${steps} of ${goal.maxSteps}` : `step ${steps}`}
        </span>
      </div>
      <p className={`fig-note${met ? ' good' : off || outOfSteps ? ' bad' : ''}`} aria-live="polite">
        {met ? `That’s it: within ${goal!.within} of the bottom in ${steps} step${steps === 1 ? '' : 's'}.` : note}
      </p>
      {goal && !met && (
        <p className="fig-note">
          Goal: get within {goal.within} of the bottom (x = {fmt(spec.m)}) in at most {goal.maxSteps} steps.
          {spec.editableLr ? ' Set the rate before the first step.' : ''}
        </p>
      )}
    </div>
  );
}
