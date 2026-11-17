import type { Exercise, ExerciseType } from '../../content/schema';
import { Figure } from '../figures/Figure';
import { mcq, predictOutput, predictShape } from './choice';
import { bucketSort, diagram, estimate, orderSteps, scenario } from './design';
import { numberGrid } from './grid';
import { runCode } from './runcode';
import { fillBlank, matchPairs, orderLines, spotBug } from './tap';
import type { ExerciseKind } from './types';

const figure: ExerciseKind<'figure', { done: boolean }> = {
  Component: ({ ex, onChange, value }) => (
    <Figure spec={ex.figure} onGoal={() => !value?.done && onChange({ done: true })} />
  ),
  ready: (_ex, v) => !!v?.done,
  grade: (ex) => ({ correct: true, message: ex.explain }),
  checkLabel: 'Continue',
};

/**
 * Every exercise type, keyed by the `type` field in lesson data. To add a
 * type: add its schema in content/schema.ts, write a kind, register it here.
 */
export const registry: { [T in ExerciseType]: ExerciseKind<T, any> } = {
  mcq,
  'predict-output': predictOutput,
  'predict-shape': predictShape,
  'fill-blank': fillBlank,
  'order-lines': orderLines,
  'spot-bug': spotBug,
  'match-pairs': matchPairs,
  'number-grid': numberGrid,
  'run-code': runCode,
  figure,
  estimate,
  'order-steps': orderSteps,
  'bucket-sort': bucketSort,
  scenario,
  diagram,
};

export const kindOf = (ex: Exercise) => registry[ex.type] as ExerciseKind<ExerciseType, any>;
