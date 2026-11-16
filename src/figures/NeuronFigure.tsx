import { useState } from 'react';
import type { NeuronFigureSpec } from '../../content/schema';
import { outputGoalMet, outputs, preact } from '../lib/neuron';
import { Matrix, fmt } from './Matrix';

const W = 320;
const ROW = 50;
const IN_X = 34;
const N_X = 196;

const ACT_NAME = { relu: 'ReLU', sigmoid: 'sigmoid', none: 'no activation' } as const;

/**
 * A neuron, or a layer of them. Inputs on the left, each joined to each
 * neuron by a weight; a neuron adds up input × weight plus its bias, then
 * applies the activation. Tapping a neuron shows its sum. With `matrix`,
 * the same layer is shown as W @ x + b: each neuron is one row of W.
 */
export function NeuronFigure({ spec, onGoal }: { spec: NeuronFigureSpec; onGoal?: () => void }) {
  const act = spec.act ?? 'relu';
  const n = spec.W.length;
  const m = spec.x.length;
  const b = spec.b ?? spec.W.map(() => 0);
  const goal = spec.goal;
  const tapGoal = goal && 'tap' in goal ? goal.tap : null;
  const [w, setW] = useState(() => spec.W.map((r) => [...r]));
  const [sel, setSel] = useState<number | null>(tapGoal !== null ? null : goal && 'neuron' in goal ? goal.neuron : 0);
  const [met, setMet] = useState(false);
  const [wrong, setWrong] = useState(false);

  const out = outputs(spec, w);
  const H = Math.max(m, n) * ROW + 16;
  const yOf = (k: number, count: number) => H / 2 + (k - (count - 1) / 2) * ROW;

  const select = (i: number) => {
    setSel(i);
    if (met || tapGoal === null) return;
    if (i === tapGoal) {
      setMet(true);
      setWrong(false);
      onGoal?.();
    } else setWrong(true);
  };

  const nudge = (i: number, j: number, d: number) => {
    if (met) return;
    const next = w.map((r) => [...r]);
    next[i][j] = Math.round((next[i][j] + d) * 1e9) / 1e9;
    setW(next);
    setSel(i);
    if (outputGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };

  const sum = (i: number) => {
    const terms = spec.x.map((v, j) => `${fmt(v)}×${w[i][j] < 0 ? `(${fmt(w[i][j])})` : fmt(w[i][j])}`);
    if (b[i] !== 0) terms.push(b[i] < 0 ? `(${fmt(b[i])})` : fmt(b[i]));
    const z = preact(spec, w, i);
    const tail = act === 'none' ? '' : ` → ${ACT_NAME[act]} → ${fmt(out[i])}`;
    return `${n > 1 ? `neuron ${i + 1}: ` : ''}${terms.join(' + ')} = ${fmt(z)}${tail}`;
  };

  let note = sel === null ? 'Tap a neuron to see its sum.' : sum(sel);
  if (wrong && !met) note = `Not this one. ${note}`;
  if (met) note = `That’s it. ${note}`;

  return (
    <div className="fig fig-neuron">
      <svg viewBox={`0 0 ${W} ${H}`} className="nf-plot" role="group" aria-label={n > 1 ? `A layer of ${n} neurons` : 'One neuron'}>
        {spec.x.map((_, j) =>
          w.map((row, i) => {
            const on = sel === i;
            const x1 = IN_X + 16;
            const y1 = yOf(j, m);
            const x2 = N_X - 20;
            const y2 = yOf(i, n);
            const t = 0.42;
            return (
              <g key={`${i}-${j}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className={`nf-edge${on ? ' on' : sel !== null ? ' off' : ''}`} />
                {(on || n === 1) && (
                  <text x={x1 + (x2 - x1) * t} y={y1 + (y2 - y1) * t - 5} className="nf-w" textAnchor="middle">
                    {fmt(row[j])}
                  </text>
                )}
              </g>
            );
          }),
        )}
        {spec.x.map((v, j) => (
          <g key={j}>
            <circle cx={IN_X} cy={yOf(j, m)} r={16} className="nf-in" />
            <text x={IN_X} y={yOf(j, m) + 5} className="nf-val" textAnchor="middle">
              {fmt(v)}
            </text>
          </g>
        ))}
        {w.map((_, i) => {
          const y = yOf(i, n);
          const cls = `nf-node${sel === i ? (met ? ' good' : wrong ? ' bad' : ' on') : ''}`;
          return (
            <g
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`neuron ${i + 1}`}
              className="nf-tap"
              onClick={() => select(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  select(i);
                }
              }}
            >
              <circle cx={N_X} cy={y} r={20} className={cls} />
              <text x={N_X} y={y + 5} className="nf-val" textAnchor="middle">
                Σ
              </text>
              <line x1={N_X + 20} y1={y} x2={N_X + 44} y2={y} className="nf-edge" />
              <text x={N_X + 50} y={y + 5} className="nf-out">
                {tapGoal !== null && !met ? '?' : fmt(out[i])}
              </text>
            </g>
          );
        })}
      </svg>
      {spec.matrix && (
        <div className="fig-row grid-eq">
          <Matrix
            values={w}
            label="W"
            onCell={(i) => select(i)}
            tone={(i) => (sel === i ? 'row' : undefined)}
            cellLabel={(i, j) => `W row ${i + 1}, column ${j + 1}`}
          />
          <span className="grid-op">@</span>
          <Matrix values={spec.x.map((v) => [v])} label="x" tone={() => (sel !== null ? 'col' : undefined)} />
          <span className="grid-op">+</span>
          <Matrix values={b.map((v) => [v])} label="b" tone={(i) => (sel === i ? 'row' : undefined)} />
          <span className="grid-op">=</span>
          <Matrix values={w.map((_, i) => [preact(spec, w, i)])} label="z" tone={(i) => (sel === i ? 'pick' : undefined)} />
        </div>
      )}
      {(spec.editable ?? []).map(([i, j]) => (
        <div key={`${i}-${j}`} className="nf-edit">
          <span>
            weight {n > 1 ? `neuron ${i + 1}, ` : ''}input {j + 1}
          </span>
          <button type="button" className="btn btn-small btn-ghost" aria-label="lower the weight" onClick={() => nudge(i, j, -(spec.step ?? 1))} disabled={met}>
            −
          </button>
          <b>{fmt(w[i][j])}</b>
          <button type="button" className="btn btn-small btn-ghost" aria-label="raise the weight" onClick={() => nudge(i, j, spec.step ?? 1)} disabled={met}>
            +
          </button>
        </div>
      ))}
      <p className={`fig-note${met ? ' good' : wrong ? ' bad' : ''}`} aria-live="polite">
        {note}
      </p>
    </div>
  );
}
