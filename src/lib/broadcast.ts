/*
 * Broadcasting for the figure, on arrays drawn as 2-D grids. A 1-D array of
 * length n is drawn as one row, which is exactly how NumPy treats it when it
 * meets a 2-D array: shape (n,) lines up as (1, n).
 */

export type Op = '+' | '-' | '*';

export const shapeOf = (m: number[][], oneD: boolean): number[] => (oneD ? [m[0].length] : [m.length, m[0].length]);

export const shapeText = (s: number[]) => (s.length === 1 ? `(${s[0]},)` : `(${s.join(', ')})`);

export interface DimCheck {
  /** "rows" or "columns" (dims compared from the right). */
  name: string;
  a: number | null;
  b: number | null;
  /** match: equal; stretchA / stretchB: that side is 1 (or missing) and is copied; clash: cannot broadcast. */
  verdict: 'match' | 'stretchA' | 'stretchB' | 'clash';
  size: number;
}

/** Compare two shapes from the right, as NumPy does. A missing dim counts as 1. */
export function checkDims(sa: number[], sb: number[]): DimCheck[] {
  const n = Math.max(sa.length, sb.length);
  const out: DimCheck[] = [];
  for (let k = 1; k <= n; k++) {
    const a = sa.length >= k ? sa[sa.length - k] : null;
    const b = sb.length >= k ? sb[sb.length - k] : null;
    const av = a ?? 1;
    const bv = b ?? 1;
    const name = k === 1 ? 'columns' : 'rows';
    let verdict: DimCheck['verdict'];
    if (av === bv) verdict = a === null || b === null ? (a === null ? 'stretchA' : 'stretchB') : 'match';
    else if (av === 1) verdict = 'stretchA';
    else if (bv === 1) verdict = 'stretchB';
    else verdict = 'clash';
    out.unshift({ name, a, b, verdict, size: Math.max(av, bv) });
  }
  return out;
}

/** The broadcast result shape, or null when some dim clashes. */
export function broadcastShape(sa: number[], sb: number[]): number[] | null {
  const dims = checkDims(sa, sb);
  return dims.some((d) => d.verdict === 'clash') ? null : dims.map((d) => d.size);
}

/** Where cell (i, j) of the stretched grid comes from in the original grid. */
export const sourceCell = (m: number[][], i: number, j: number): [number, number] => [
  m.length === 1 ? 0 : i,
  m[0].length === 1 ? 0 : j,
];

/** The 2-D grid stretched to rows × cols (only valid when broadcastable). */
export const stretch = (m: number[][], rows: number, cols: number): number[][] =>
  Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      const [r, c] = sourceCell(m, i, j);
      return m[r][c];
    }),
  );

export const apply = (op: Op, x: number, y: number) => (op === '+' ? x + y : op === '-' ? x - y : x * y);

/** Rows and columns of the result as a 2-D grid, or null when the arrays cannot broadcast. */
export function resultGrid(A: number[][], B: number[][]): [number, number] | null {
  const ok = (p: number, q: number) => p === q || p === 1 || q === 1;
  if (!ok(A.length, B.length) || !ok(A[0].length, B[0].length)) return null;
  return [Math.max(A.length, B.length), Math.max(A[0].length, B[0].length)];
}
