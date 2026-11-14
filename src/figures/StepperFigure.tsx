import { useState } from 'react';
import type { StepperFigureSpec } from '../../content/schema';
import { Matrix, fmt, matmul, type CellTone } from './Matrix';

const STEPS = ['Pick a result cell', 'Its row of A', 'Its column of B', 'Multiply the pairs', 'Add them up'];

/** Walks one cell of a matrix product: row, column, pairwise products, sum. */
export function StepperFigure({ spec, onGoal }: { spec: StepperFigureSpec; onGoal?: () => void }) {
  const { A, B } = spec;
  const C = matmul(A, B);
  const [cell, setCell] = useState<[number, number] | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [met, setMet] = useState(false);

  const choose = (i: number, j: number) => {
    setCell([i, j]);
    setStep(1);
  };

  const next = () => {
    if (!cell) return;
    const s = Math.min(4, step + 1);
    setStep(s);
    if (s === 4) {
      setDone((d) => new Set(d).add(`${cell[0]}-${cell[1]}`));
      const g = spec.goal;
      if (g && !met && g.cell[0] === cell[0] && g.cell[1] === cell[1]) {
        setMet(true);
        onGoal?.();
      }
    }
  };

  const [r, c] = cell ?? [-1, -1];
  const toneA = (i: number): CellTone => (step >= 1 && i === r ? 'row' : step >= 1 ? 'dim' : undefined);
  const toneB = (_: number, j: number): CellTone => (step >= 2 && j === c ? 'col' : step >= 2 ? 'dim' : undefined);

  const products = cell ? A[r].map((v, k) => ({ a: v, b: B[k][c], p: v * B[k][c] })) : [];

  let note = 'Tap a ? cell of A @ B to start.';
  if (cell) {
    if (step === 1) note = `Row ${r + 1} of A: ${A[r].map(fmt).join(', ')}`;
    if (step === 2) note = `Column ${c + 1} of B: ${B.map((row) => fmt(row[c])).join(', ')}`;
    if (step === 3) note = products.map((x) => `${fmt(x.a)}×${fmt(x.b)} = ${fmt(x.p)}`).join(',  ');
    if (step === 4) note = `${products.map((x) => fmt(x.p)).join(' + ')} = ${fmt(C[r][c])}`;
  }
  const goalCell = spec.goal?.cell;

  return (
    <div className="fig fig-stepper">
      <div className="fig-row">
        <Matrix values={A} label="A" tone={toneA} />
        <Matrix values={B} label="B" tone={toneB} />
        <Matrix
          values={C.map((row, i) => row.map((v, j) => (done.has(`${i}-${j}`) || (i === r && j === c && step === 4) ? v : null)))}
          label={<code>A @ B</code>}
          onCell={choose}
          tone={(i, j) => (i === r && j === c ? (step === 4 ? 'good' : 'pick') : undefined)}
          cellLabel={(i, j) => `Result row ${i + 1}, column ${j + 1}`}
        />
      </div>
      <div className="stepper-bar">
        <span className="stepper-step">
          {cell ? `Step ${step} of 4 · ${STEPS[step]}` : STEPS[0]}
          {goalCell && !met && ` · goal: row ${goalCell[0] + 1}, column ${goalCell[1] + 1}`}
        </span>
        <div className="stepper-btns">
          <button type="button" className="btn btn-small btn-ghost" disabled={!cell || step <= 1} onClick={() => setStep(step - 1)}>
            Back
          </button>
          <button type="button" className="btn btn-small" disabled={!cell || step >= 4} onClick={next}>
            Next step
          </button>
        </div>
      </div>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {note}
      </p>
    </div>
  );
}
