import { useState } from 'react';
import type { BroadcastFigureSpec } from '../../content/schema';
import { apply, checkDims, resultGrid, shapeOf, shapeText, sourceCell, stretch } from '../lib/broadcast';
import { Matrix, fmt, type CellTone } from './Matrix';

/**
 * Broadcasting visualiser. Shows both shapes compared from the right; when
 * they fit, "Stretch" draws the copies NumPy makes (faded), and tapping a
 * result cell lights the two input cells that produced it. When they do not
 * fit, it names the dimension that clashes.
 */
export function BroadcastFigure({ spec, onGoal }: { spec: BroadcastFigureSpec; onGoal?: () => void }) {
  const { A, B } = spec;
  const op = spec.op ?? '+';
  const oneD = new Set(spec.oneD ?? []);
  const sa = shapeOf(A, oneD.has('A'));
  const sb = shapeOf(B, oneD.has('B'));
  const dims = checkDims(sa, sb);
  const grid = resultGrid(A, B);
  const [stretched, setStretched] = useState(false);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [met, setMet] = useState(false);

  const pick = (i: number, j: number) => {
    if (met) return;
    setSel([i, j]);
    const g = spec.goal?.cell;
    if (g && g[0] === i && g[1] === j) {
      setMet(true);
      onGoal?.();
    }
  };

  const dimText = (d: (typeof dims)[number]) => {
    const show = (v: number | null) => (v === null ? 'none' : String(v));
    const head = `${d.name}: ${show(d.a)} and ${show(d.b)}`;
    if (d.verdict === 'match') return `${head}, equal`;
    if (d.verdict === 'clash') return `${head}, clash: neither is 1`;
    const who = d.verdict === 'stretchA' ? 'A' : 'B';
    return `${head}, ${who} is copied to ${d.size}`;
  };

  // A grid drawn stretched: original cells solid, copies faded; the source of the picked cell lit.
  const side = (m: number[][], name: string) => {
    const label = `${name} ${shapeText(name === 'A' ? sa : sb)}`;
    if (!grid || !stretched) return <Matrix values={m} label={label} />;
    const [rows, cols] = grid;
    const grows = m.length !== rows || m[0].length !== cols;
    const tone = (i: number, j: number): CellTone => {
      const [r, c] = sourceCell(m, i, j);
      const copy = r !== i || c !== j;
      if (sel) {
        if (sel[0] === i && sel[1] === j) return 'pair';
        const [sr, sc] = sourceCell(m, sel[0], sel[1]);
        if (!copy && sr === i && sc === j) return 'row';
      }
      return copy ? 'copy' : undefined;
    };
    return <Matrix values={stretch(m, rows, cols)} label={grows ? `${name} stretched` : label} tone={tone} />;
  };

  let note = '';
  if (!grid) note = `Shapes ${shapeText(sa)} and ${shapeText(sb)} cannot broadcast.`;
  else if (!stretched) note = 'Compare the shapes from the right, then stretch.';
  else if (!sel) note = 'Tap a result cell to see which two cells made it.';
  else {
    const [i, j] = sel;
    const [ar, ac] = sourceCell(A, i, j);
    const [br, bc] = sourceCell(B, i, j);
    const x = A[ar][ac];
    const y = B[br][bc];
    const sign = op === '*' ? '×' : op === '-' ? '−' : '+';
    note = `row ${i + 1} col ${j + 1}: ${fmt(x)} ${sign} ${fmt(y)} = ${fmt(apply(op, x, y))}`;
  }
  const wrongTap = spec.goal && sel && !met;

  return (
    <div className="fig fig-broadcast">
      <ul className="bc-dims">
        {dims.map((d) => (
          <li key={d.name} className={`bc-dim ${d.verdict === 'clash' ? 'bad' : d.verdict === 'match' ? 'ok' : 'stretch'}`}>
            {dimText(d)}
          </li>
        ))}
      </ul>
      <div className="fig-row grid-eq">
        {side(A, 'A')}
        <span className="grid-op">{op === '*' ? '*' : op}</span>
        {side(B, 'B')}
        {grid && stretched && (
          <>
            <span className="grid-op">=</span>
            <Matrix
              values={stretch(A, ...grid).map((r, i) => r.map((v, j) => apply(op, v, stretch(B, ...grid)[i][j])))}
              label={<code>A {op} B</code>}
              onCell={pick}
              tone={(i, j) => (sel && sel[0] === i && sel[1] === j ? (met ? 'good' : 'pick') : undefined)}
              cellLabel={(i, j) => `result row ${i + 1}, column ${j + 1}`}
            />
          </>
        )}
      </div>
      {grid && !stretched && (
        <button type="button" className="btn btn-small btn-ghost" onClick={() => setStretched(true)}>
          Stretch to {shapeText(grid[0] === 1 && sa.length === 1 && sb.length === 1 ? [grid[1]] : grid)}
        </button>
      )}
      <p className={`fig-note${met ? ' good' : !grid ? ' bad' : ''}`} aria-live="polite">
        {wrongTap ? 'Not this one. ' : met ? 'That’s it. ' : ''}
        {note}
      </p>
    </div>
  );
}
