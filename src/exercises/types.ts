import type { FC } from 'react';
import type { Exercise, ExerciseOf, ExerciseType } from '../../content/schema';

export interface Grade {
  correct: boolean;
  /** Not counted either way (e.g. Python could not load). */
  skipped?: boolean;
  /** Why this particular answer is right or wrong. */
  message?: string;
  /** The correct answer, shown after a wrong attempt. */
  answer?: string;
  /** Extra detail such as a Python error. */
  detail?: string;
}

export interface ExProps<E extends Exercise, V> {
  ex: E;
  /** Hidden code (e.g. `import numpy as np`) run before any snippet of this unit. */
  prelude: string;
  value: V | undefined;
  onChange: (v: V | undefined) => void;
  /** True once the answer has been checked. */
  locked: boolean;
  grade?: Grade;
}

export interface ExerciseKind<T extends ExerciseType, V> {
  Component: FC<ExProps<ExerciseOf<T>, V>>;
  /** Can the learner press Check? Defaults to "an answer exists". */
  ready?: (ex: ExerciseOf<T>, v: V | undefined) => boolean;
  grade: (ex: ExerciseOf<T>, v: V, ctx: { prelude: string }) => Grade | Promise<Grade>;
  /** Label for the check button. */
  checkLabel?: string;
}
