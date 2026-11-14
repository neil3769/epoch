import type { ReactNode } from 'react';

export type CellTone = 'row' | 'col' | 'pair' | 'pick' | 'good' | 'bad' | 'dim' | undefined;

export const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2))).replace('-', '−');

export function Matrix({
  values,
  label,
  tone,
  onCell,
  render,
  cellLabel,
}: {
  values: (number | null)[][];
  label?: ReactNode;
  tone?: (i: number, j: number) => CellTone;
  onCell?: (i: number, j: number) => void;
  render?: (v: number | null, i: number, j: number) => ReactNode;
  cellLabel?: (i: number, j: number) => string;
}) {
  const cols = values[0]?.length ?? 0;
  return (
    <div className="mx">
      {label !== undefined && <div className="mx-label">{label}</div>}
      <div className="mx-body" style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
        {values.map((row, i) =>
          row.map((v, j) => {
            const t = tone?.(i, j);
            const content = render ? render(v, i, j) : v === null ? '?' : fmt(v);
            const cls = `mx-cell${t ? ` tone-${t}` : ''}${onCell ? ' tappable' : ''}`;
            return onCell ? (
              <button
                key={`${i}-${j}`}
                type="button"
                className={cls}
                onClick={() => onCell(i, j)}
                aria-label={cellLabel?.(i, j) ?? `row ${i + 1}, column ${j + 1}`}
              >
                {content}
              </button>
            ) : (
              <div key={`${i}-${j}`} className={cls}>
                {content}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

export const elementwise = (A: number[][], B: number[][]) => A.map((r, i) => r.map((v, j) => v * B[i][j]));

export const matmul = (A: number[][], B: number[][]) =>
  A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
