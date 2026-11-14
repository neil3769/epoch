import type { ShapeFigureSpec } from '../../content/schema';

export type Shape = number[];

/** Python's str() of a shape tuple: (2, 3), (4,), (). */
export function shapeText(shape: Shape): string {
  if (shape.length === 0) return '()';
  if (shape.length === 1) return `(${shape[0]},)`;
  return `(${shape.join(', ')})`;
}

/** Parse what a learner entered ("2,3", "(2, 3)", "4", "error") into canonical text. */
export function canonicalShape(input: string): string | null {
  const s = input.trim().toLowerCase();
  if (s === 'error') return 'error';
  const nums = s.replace(/[()\s]/g, '').split(',').filter((x) => x !== '');
  if (!nums.length || !nums.every((n) => /^\d+$/.test(n))) return null;
  return shapeText(nums.map(Number));
}

/** Result shape of (m, n) @ (n2, p), or null if the inner numbers differ. */
export function matmulShape(left: Shape, right: Shape): Shape | null {
  return left[1] === right[0] ? [left[0], right[1]] : null;
}

export const DIM_MIN = 1;
export const DIM_MAX = 9;

export interface ShapeState {
  left: [number, number];
  right: [number, number];
  swapped: boolean;
}

/** The operands in the order they are multiplied. */
export function operands(s: ShapeState): [Shape, Shape] {
  return s.swapped ? [s.right, s.left] : [s.left, s.right];
}

export function shapeGoalMet(spec: ShapeFigureSpec, s: ShapeState): boolean {
  const [a, b] = operands(s);
  const r = matmulShape(a, b);
  if (!r) return false;
  const want = spec.goal?.result;
  return !want || (r[0] === want[0] && r[1] === want[1]);
}

/** Can the goal be reached by changing the editable dims (and swapping, if allowed)? */
export function shapeGoalReachable(spec: ShapeFigureSpec, atStartOnly = false): boolean {
  const start: ShapeState = { left: [...spec.left], right: [...spec.right], swapped: false };
  if (atStartOnly) return shapeGoalMet(spec, start);
  const ed = new Set(spec.editable ?? []);
  const range = (on: boolean, v: number) => (on ? Array.from({ length: DIM_MAX }, (_, i) => i + 1) : [v]);
  for (const l0 of range(ed.has('l0'), spec.left[0]))
    for (const l1 of range(ed.has('l1'), spec.left[1]))
      for (const r0 of range(ed.has('r0'), spec.right[0]))
        for (const r1 of range(ed.has('r1'), spec.right[1]))
          for (const swapped of spec.swappable ? [false, true] : [false])
            if (shapeGoalMet(spec, { left: [l0, l1], right: [r0, r1], swapped })) return true;
  return false;
}
