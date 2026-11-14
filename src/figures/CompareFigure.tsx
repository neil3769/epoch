import { useState } from 'react';
import type { CompareFigureSpec } from '../../content/schema';
import { Matrix, elementwise, fmt, matmul, type CellTone } from './Matrix';

type Panel = 'elementwise' | 'matmul';
interface Sel {
  panel: Panel;
  cell: [number, number];
}

/**
 * Element-wise vs matrix multiply on the same two matrices. Tapping a result
 * cell highlights exactly the inputs that produced it: one cell from each for
 * `*`, a whole row and a whole column for `@`.
 */
export function CompareFigure({ spec, onGoal }: { spec: CompareFigureSpec; onGoal?: () => void }) {
  const { A, B } = spec;
  const panels = spec.panels ?? ['elementwise', 'matmul'];
  const [sel, setSel] = useState<Sel | null>(null);
  const [met, setMet] = useState(false);

  const pick = (panel: Panel, i: number, j: number) => {
    if (met) return;
    setSel({ panel, cell: [i, j] });
    const g = spec.goal;
    if (g && g.panel === panel && g.cell[0] === i && g.cell[1] === j) {
      setMet(true);
      onGoal?.();
    }
  };

  const toneA = (i: number, j: number): CellTone => {
    if (!sel) return undefined;
    const [r, c] = sel.cell;
    if (sel.panel === 'elementwise') return i === r && j === c ? 'pair' : 'dim';
    return i === r ? 'row' : 'dim';
  };
  const toneB = (i: number, j: number): CellTone => {
    if (!sel) return undefined;
    const [r, c] = sel.cell;
    if (sel.panel === 'elementwise') return i === r && j === c ? 'pair' : 'dim';
    return j === c ? 'col' : 'dim';
  };

  let formula = 'Tap a result cell to see where it came from.';
  if (sel) {
    const [r, c] = sel.cell;
    if (sel.panel === 'elementwise') {
      formula = `A * B, row ${r + 1} col ${c + 1}: ${fmt(A[r][c])} × ${fmt(B[r][c])} = ${fmt(A[r][c] * B[r][c])}`;
    } else {
      const terms = A[r].map((v, k) => `${fmt(v)}×${fmt(B[k][c])}`).join(' + ');
      formula = `A @ B, row ${r + 1} col ${c + 1}: row ${r + 1} of A · column ${c + 1} of B = ${terms} = ${fmt(matmul(A, B)[r][c])}`;
    }
  }
  const wrongTap = spec.goal && sel && !met;

  return (
    <div className="fig fig-compare">
      <div className="fig-row">
        <Matrix values={A} label="A" tone={toneA} />
        <Matrix values={B} label="B" tone={toneB} />
      </div>
      <div className="fig-row">
        {panels.includes('elementwise') && (
          <Matrix
            values={elementwise(A, B)}
            label={<code>A * B</code>}
            onCell={(i, j) => pick('elementwise', i, j)}
            tone={(i, j) => (sel?.panel === 'elementwise' && sel.cell[0] === i && sel.cell[1] === j ? (met ? 'good' : 'pick') : undefined)}
            cellLabel={(i, j) => `A times B element-wise, row ${i + 1}, column ${j + 1}`}
          />
        )}
        {panels.includes('matmul') && (
          <Matrix
            values={matmul(A, B)}
            label={<code>A @ B</code>}
            onCell={(i, j) => pick('matmul', i, j)}
            tone={(i, j) => (sel?.panel === 'matmul' && sel.cell[0] === i && sel.cell[1] === j ? (met ? 'good' : 'pick') : undefined)}
            cellLabel={(i, j) => `A matrix-times B, row ${i + 1}, column ${j + 1}`}
          />
        )}
      </div>
      <p className={`fig-note${met ? ' good' : ''}`} aria-live="polite">
        {wrongTap ? 'Not this one. ' : met ? 'That’s it. ' : ''}
        {formula}
      </p>
    </div>
  );
}
