/*
 * Gradient descent on f(x) = a·(x − m)² + c, for the descent figure.
 * The learning-rate slider moves through LRS; the verifier uses the same
 * functions to check that a figure's goal can be reached.
 */

export interface DescentSpec {
  a: number;
  m: number;
  c?: number;
  start: number;
  lr: number;
  editableLr?: boolean;
  goal?: { within: number; maxSteps: number };
}

export const LRS = Array.from({ length: 24 }, (_, i) => +(0.05 * (i + 1)).toFixed(2));

export const fAt = (s: DescentSpec, x: number) => s.a * (x - s.m) ** 2 + (s.c ?? 0);
export const slopeAt = (s: DescentSpec, x: number) => 2 * s.a * (x - s.m);
export const stepFrom = (s: DescentSpec, x: number, lr: number) => x - lr * slopeAt(s, x);

/** Positions after 0..n steps. */
export function path(s: DescentSpec, lr: number, n: number): number[] {
  const xs = [s.start];
  for (let i = 0; i < n; i++) xs.push(stepFrom(s, xs[xs.length - 1], lr));
  return xs;
}

/** Steps needed to get within `within` of the minimum, or null if not within maxSteps. */
export function stepsToGoal(s: DescentSpec, lr: number): number | null {
  if (!s.goal) return null;
  const xs = path(s, lr, s.goal.maxSteps);
  const k = xs.findIndex((x) => Math.abs(x - s.m) <= s.goal!.within);
  return k < 0 ? null : k;
}

/** The learning rates the learner can pick. */
export const lrChoices = (s: DescentSpec) => (s.editableLr ? LRS : [s.lr]);

export const goalReachable = (s: DescentSpec) => lrChoices(s).some((lr) => stepsToGoal(s, lr) !== null);
