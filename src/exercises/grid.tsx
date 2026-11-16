import { useState } from 'react';
import type { ExerciseOf } from '../../content/schema';
import { NumberPad } from '../components/Keys';
import { Matrix, elementwise, fmt, matmul } from '../figures/Matrix';
import type { ExProps, ExerciseKind, Grade } from './types';

type GridValue = string[][];

const parse = (s: string) => (s === '' || s === '-' ? NaN : Number(s));

function NumberGrid({ ex, value, onChange, locked }: ExProps<ExerciseOf<'number-grid'>, GridValue>) {
  const rows = ex.answer.length;
  const cols = ex.answer[0].length;
  const cells = value ?? ex.answer.map((r) => r.map(() => ''));
  const [cur, setCur] = useState<[number, number]>([0, 0]);

  const press = (k: string) => {
    const [i, j] = cur;
    const next = cells.map((r) => r.slice());
    const v = next[i][j];
    if (k === 'next') {
      const flat = i * cols + j + 1;
      setCur(flat >= rows * cols ? [0, 0] : [Math.floor(flat / cols), flat % cols]);
      return;
    }
    if (k === '⌫') next[i][j] = v.slice(0, -1);
    else if (k === '-') next[i][j] = v.startsWith('-') ? v.slice(1) : '-' + v;
    else if (v.replace('-', '').length < 4) next[i][j] = v + k;
    onChange(next);
  };

  const byName = Object.fromEntries(ex.inputs.map((x) => [x.name, x.value]));
  // "A @ B" with two named inputs is drawn as an equation; anything else (such as
  // "3 * v" or "2 * a - b") shows the inputs, with the expression as the result label.
  const m = ex.expr.match(/^\s*(\w+)\s*([*@+])\s*(\w+)\s*$/);
  const op = m && byName[m[1]] && byName[m[3]] ? m : null;

  return (
    <>
      <div className="fig-row grid-eq">
        {op ? (
          <>
            <Matrix values={byName[op[1]]} label={op[1]} />
            <span className="grid-op">{op[2]}</span>
            <Matrix values={byName[op[3]]} label={op[3]} />
            <span className="grid-op">=</span>
          </>
        ) : (
          ex.inputs.map((x) => <Matrix key={x.name} values={x.value} label={x.name} />)
        )}
        <Matrix
          values={cells.map((r) => r.map(() => 0))}
          label={<code>{ex.expr}</code>}
          onCell={locked ? undefined : (i, j) => setCur([i, j])}
          tone={(i, j) => {
            if (locked) return parse(cells[i][j]) === ex.answer[i][j] ? 'good' : 'bad';
            return cur[0] === i && cur[1] === j ? 'pick' : undefined;
          }}
          render={(_, i, j) => (cells[i][j] === '' ? ' ' : cells[i][j].replace('-', '−'))}
          cellLabel={(i, j) => `answer row ${i + 1}, column ${j + 1}`}
        />
      </div>
      {!locked && <NumberPad onKey={press} extra={[{ label: 'Next cell →', key: 'next' }]} />}
    </>
  );
}

/** Explain the first wrong cell, and name the classic `*` / `@` mix-up when it happens. */
function explainGrid(ex: ExerciseOf<'number-grid'>, got: number[][]): string {
  const op = ex.expr.match(/^\s*(\w+)\s*([*@])\s*(\w+)\s*$/);
  const same = (m: number[][]) => m.length === got.length && m.every((r, i) => r.every((v, j) => v === got[i][j]));
  const byName = Object.fromEntries(ex.inputs.map((x) => [x.name, x.value]));
  if (op && byName[op[1]] && byName[op[3]]) {
    const L = byName[op[1]];
    const R = byName[op[3]];
    const sameShape = L.length === R.length && L[0].length === R[0].length;
    if (op[2] === '@' && sameShape && same(elementwise(L, R)))
      return `That is the element-wise product (\`*\`), cell by cell. \`@\` dots each row of ${op[1]} with each column of ${op[3]}.`;
    if (op[2] === '*' && L[0].length === R.length && same(matmul(L, R)))
      return `That is the matrix product (\`@\`). \`*\` just multiplies each cell by the one in the same position.`;
    for (let i = 0; i < got.length; i++)
      for (let j = 0; j < got[i].length; j++)
        if (got[i][j] !== ex.answer[i][j]) {
          if (op[2] === '*')
            return `Row ${i + 1}, column ${j + 1}: ${fmt(L[i][j])} × ${fmt(R[i][j])} = ${fmt(ex.answer[i][j])}.`;
          const terms = L[i].map((v, k) => `${fmt(v)}×${fmt(R[k][j])}`).join(' + ');
          return `Row ${i + 1}, column ${j + 1}: row ${i + 1} of ${op[1]} · column ${j + 1} of ${op[3]} = ${terms} = ${fmt(ex.answer[i][j])}.`;
        }
  }
  return ex.explain ?? '';
}

export const numberGrid: ExerciseKind<'number-grid', GridValue> = {
  Component: NumberGrid,
  ready: (_ex, v) => !!v && v.every((r) => r.every((c) => !Number.isNaN(parse(c)))),
  grade: (ex, v): Grade => {
    const got = v.map((r) => r.map(parse));
    const ok = got.every((r, i) => r.every((c, j) => c === ex.answer[i][j]));
    return ok
      ? { correct: true, message: ex.explain }
      : { correct: false, message: explainGrid(ex, got), answer: ex.answer.map((r) => r.map(fmt).join('  ')).join('\n') };
  },
};

