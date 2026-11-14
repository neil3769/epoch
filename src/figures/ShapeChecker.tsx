import { useState } from 'react';
import type { ShapeFigureSpec } from '../../content/schema';
import { DIM_MAX, DIM_MIN, matmulShape, operands, shapeGoalMet, shapeText, type ShapeState } from '../lib/shapes';

type DimKey = 'l0' | 'l1' | 'r0' | 'r1';

/**
 * Two shape tuples as blocks. The inner numbers glow green when they match
 * and red when they do not; when they match, the outer numbers slide
 * together into the result shape.
 */
export function ShapeChecker({ spec, onGoal }: { spec: ShapeFigureSpec; onGoal?: () => void }) {
  const [s, setS] = useState<ShapeState>({ left: [...spec.left], right: [...spec.right], swapped: false });
  const [met, setMet] = useState(false);
  const editable = new Set<DimKey>(spec.editable ?? []);

  const update = (next: ShapeState) => {
    setS(next);
    if (spec.goal && !met && shapeGoalMet(spec, next)) {
      setMet(true);
      onGoal?.();
    }
  };

  const bump = (key: DimKey, d: number) => {
    const side = key[0] === 'l' ? 'left' : 'right';
    const idx = Number(key[1]);
    const arr = [...s[side]] as [number, number];
    arr[idx] = Math.min(DIM_MAX, Math.max(DIM_MIN, arr[idx] + d));
    update({ ...s, [side]: arr });
  };

  const [a, b] = operands(s);
  const names = s.swapped ? ['B', 'A'] : ['A', 'B'];
  const keys: [DimKey, DimKey][] = s.swapped
    ? [
        ['r0', 'r1'],
        ['l0', 'l1'],
      ]
    : [
        ['l0', 'l1'],
        ['r0', 'r1'],
      ];
  const result = matmulShape(a, b);
  const innerOk = a[1] === b[0];

  const dim = (value: number, key: DimKey, role: 'outer' | 'inner') => (
    <div className={`dim dim-${role}${role === 'inner' ? (innerOk ? ' ok' : ' bad') : ''}`}>
      {editable.has(key) && (
        <button type="button" className="dim-btn" aria-label="increase" onClick={() => bump(key, 1)} disabled={met}>
          +
        </button>
      )}
      <span className="dim-val">{value}</span>
      {editable.has(key) && (
        <button type="button" className="dim-btn" aria-label="decrease" onClick={() => bump(key, -1)} disabled={met}>
          −
        </button>
      )}
    </div>
  );

  return (
    <div className="fig fig-shape">
      <div className="shape-eq">
        <div className="shape-block">
          <div className="shape-name">{names[0]}</div>
          <div className="shape-dims">
            {dim(a[0], keys[0][0], 'outer')}
            {dim(a[1], keys[0][1], 'inner')}
          </div>
        </div>
        <div className="shape-op">@</div>
        <div className="shape-block">
          <div className="shape-name">{names[1]}</div>
          <div className="shape-dims">
            {dim(b[0], keys[1][0], 'inner')}
            {dim(b[1], keys[1][1], 'outer')}
          </div>
        </div>
      </div>
      <div className={`shape-result${result ? ' ok' : ' bad'}`} aria-live="polite">
        {result ? (
          <>
            <span className="res-tuple" key={`${result[0]}-${result[1]}`}>
              <span className="slide-l">({result[0]},</span>
              <span className="slide-r">&nbsp;{result[1]})</span>
            </span>
            <span className="shape-res-text">
              inner {a[1]} = {b[0]}, so the outer numbers survive
            </span>
          </>
        ) : (
          <span className="shape-res-text">
            inner {a[1]} ≠ {b[0]}: <code>{names[0]} @ {names[1]}</code> can’t run
          </span>
        )}
      </div>
      {spec.swappable && (
        <button type="button" className="btn btn-small btn-ghost" onClick={() => update({ ...s, swapped: !s.swapped })} disabled={met}>
          Swap order → {names[1]} @ {names[0]}
        </button>
      )}
      {spec.goal && (
        <p className={`fig-note${met ? ' good' : ''}`}>
          {met
            ? 'Goal reached.'
            : spec.goal.result
              ? `Goal: make the result ${shapeText(spec.goal.result)}.`
              : 'Goal: make @ able to run.'}
        </p>
      )}
    </div>
  );
}
