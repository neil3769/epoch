import { z } from 'zod';

/*
 * Lesson content schema. Lessons are data: a lesson author adds an object to
 * a unit file under content/units/ and never touches a component.
 *
 * Conventions
 * - Code snippets are at most 38 characters wide (checked by verify-content).
 * - A unit's `prelude` (e.g. `import numpy as np`) is run before every snippet
 *   of that unit but not shown.
 * - In fill-blank code, each gap is written as three underscores: ___
 * - Text fields accept `inline code` in backticks and **bold**.
 */

const Why = z.string().min(8, 'explanations must be real sentences');
const Matrix = z.array(z.array(z.number())).min(1);
const Cell = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
const Shape2 = z.tuple([z.number().int().min(1), z.number().int().min(1)]);

export const OptionSchema = z.object({
  text: z.string().min(1),
  /** Required for every wrong option: why this particular choice is wrong. */
  why: Why.optional(),
});

const TypedWrong = z.object({ answer: z.string(), why: Why });

const base = {
  id: z.string().regex(/^[a-z0-9.-]+$/),
  prompt: z.string().min(3),
  /** Why the correct answer is correct. Shown after answering. */
  explain: z.string().optional(),
  /** Python assertions run by verify-content (after the prelude and `code`). */
  check: z.string().optional(),
};

// ---- figures ---------------------------------------------------------------

export const CompareFigureSchema = z.object({
  kind: z.literal('compare'),
  A: Matrix,
  B: Matrix,
  panels: z.array(z.enum(['elementwise', 'matmul'])).min(1).optional(),
  /** Goal for exercises: tap this result cell in this panel. */
  goal: z.object({ panel: z.enum(['elementwise', 'matmul']), cell: Cell }).optional(),
});

export const StepperFigureSchema = z.object({
  kind: z.literal('stepper'),
  A: Matrix,
  B: Matrix,
  /** Goal: walk this result cell through to its sum. */
  goal: z.object({ cell: Cell }).optional(),
});

export const ShapeFigureSchema = z.object({
  kind: z.literal('shape-checker'),
  left: Shape2,
  right: Shape2,
  /** Which dims the learner can change: l0, l1 (left) and r0, r1 (right). */
  editable: z.array(z.enum(['l0', 'l1', 'r0', 'r1'])).optional(),
  /** Show a button that swaps the order of the two operands. */
  swappable: z.boolean().optional(),
  /** Goal: make `@` valid, optionally with this result shape. */
  goal: z.object({ result: Shape2.optional() }).optional(),
});

export const FigureSchema = z.discriminatedUnion('kind', [
  CompareFigureSchema,
  StepperFigureSchema,
  ShapeFigureSchema,
]);

// ---- exercises -------------------------------------------------------------

export const McqSchema = z.object({
  ...base,
  type: z.literal('mcq'),
  code: z.string().optional(),
  options: z.array(OptionSchema).min(2).max(4),
  answer: z.number().int().min(0),
  /** If true, verify-content runs `code` and checks stdout equals the answer option. */
  verifyOutput: z.boolean().optional(),
});

export const PredictOutputSchema = z.object({
  ...base,
  type: z.literal('predict-output'),
  code: z.string(),
  /** Exactly what the code prints (verified by running it). */
  answer: z.string(),
  /** Present: the learner chooses. Absent: the learner types the output. */
  options: z.array(OptionSchema).min(2).max(4).optional(),
  typedWrong: z.array(TypedWrong).optional(),
});

export const PredictShapeSchema = z.object({
  ...base,
  type: z.literal('predict-shape'),
  code: z.string(),
  /** Expression whose `.shape` is asked for, evaluated after `code`. */
  target: z.string(),
  /** Python tuple text such as "(2, 3)" or "(4,)", or "error". */
  answer: z.string(),
  options: z.array(OptionSchema).min(2).max(4).optional(),
  typedWrong: z.array(TypedWrong).optional(),
});

export const FillBlankSchema = z.object({
  ...base,
  type: z.literal('fill-blank'),
  code: z.string(),
  /** The token that goes into each gap, in order. */
  answer: z.array(z.string()).min(1),
  /** Extra tokens in the bank, each with why it does not fit. */
  distractors: z.array(z.object({ text: z.string(), why: Why })),
  /** What the completed code prints (verified). */
  expectOutput: z.string().optional(),
});

export const OrderLinesSchema = z.object({
  ...base,
  type: z.literal('order-lines'),
  /** Lines in the correct order. `fixed` lines stay in place and are not shuffled. */
  lines: z.array(z.object({ text: z.string(), fixed: z.boolean().optional() })).min(3).max(8),
  /** Output of the correct program. verify-content also checks no other order gives it. */
  expectOutput: z.string(),
  explain: z.string(),
});

export const SpotBugSchema = z.object({
  ...base,
  type: z.literal('spot-bug'),
  code: z.string(),
  /** The error shown to the learner. "..." truncates; verify-content checks the prefix. */
  error: z.string(),
  /** 0-based index of the line to tap. */
  answer: z.number().int().min(0),
  /** 0-based line where Python raises the error, if different from `answer`. */
  raiseLine: z.number().int().min(0).optional(),
  /** Why each other non-blank line is not the answer, keyed by 0-based index. */
  lineWhy: z.record(z.string(), Why),
});

export const MatchPairsSchema = z.object({
  ...base,
  type: z.literal('match-pairs'),
  setup: z.string().optional(),
  pairs: z.array(z.object({ left: z.string(), right: z.string(), why: Why })).min(3).max(5),
  /** equal: eval(left) equals eval(right). shape: str(eval(left).shape) == right. */
  verify: z.enum(['equal', 'shape']).optional(),
});

export const NumberGridSchema = z.object({
  ...base,
  type: z.literal('number-grid'),
  inputs: z.array(z.object({ name: z.string(), value: Matrix })).min(1).max(2),
  /** NumPy expression over the inputs, e.g. "A @ B". The result is the answer. */
  expr: z.string(),
  answer: Matrix,
});

export const RunCodeSchema = z.object({
  ...base,
  type: z.literal('run-code'),
  /** Code shown above the learner's lines and run first. */
  before: z.string().optional(),
  /** Reference solution (verified to pass the tests). */
  solution: z.string(),
  /** Hidden tests: Python asserts with a message describing the failing case. */
  tests: z.string(),
  maxLines: z.union([z.literal(1), z.literal(2)]).optional(),
  placeholder: z.string().optional(),
  explain: z.string(),
});

export const FigureExerciseSchema = z.object({
  ...base,
  type: z.literal('figure'),
  figure: FigureSchema,
});

export const ExerciseSchema = z.discriminatedUnion('type', [
  McqSchema,
  PredictOutputSchema,
  PredictShapeSchema,
  FillBlankSchema,
  OrderLinesSchema,
  SpotBugSchema,
  MatchPairsSchema,
  NumberGridSchema,
  RunCodeSchema,
  FigureExerciseSchema,
]);

export const CardSchema = z.object({
  title: z.string(),
  /** At most three sentences (checked by verify-content). */
  text: z.string(),
  code: z.string().optional(),
  /** What `code` prints, shown under it (verified). */
  output: z.string().optional(),
  figure: FigureSchema.optional(),
});

export const LessonSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  /** One line on what was learned, shown on the completion screen. */
  summary: z.string(),
  /** The unit's last lesson: mixes everything, and passing it tests out of the unit. */
  checkpoint: z.boolean().optional(),
  card: CardSchema,
  exercises: z.array(ExerciseSchema).min(8).max(12),
});



// ------------------------------------------------------------------ labs ---

export const LabStepSchema = z.object({
  /** What to build in this step. */
  goal: z.string(),
  /** What the editor starts with: scaffolding with ___ gaps, or an empty function. */
  starter: z.string(),
  /** New lines that complete the step (verified to pass the tests). */
  solution: z.string(),
  /** Hidden asserts, run after the code so far plus this step. Messages say which case failed. */
  tests: z.string(),
  /** Hint 1: a nudge in words. Hint 2: the structure with ___ blanks. Hint 3 is the solution. */
  hints: z.tuple([z.string(), z.string()]),
  /** Shown once the step passes. */
  explain: z.string().optional(),
});

export const LabSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  /** What the learner will build, shown before step 1. */
  intro: z.string(),
  /** One line on what they built, shown at the end. */
  summary: z.string(),
  minutes: z.number().int().min(5).max(20),
  /** The lab opens once this lesson is done. */
  unlockAfter: z.string(),
  /** Visible code the lab starts from (not edited). */
  given: z.string().optional(),
  /** For labs using simulated services: what differs from the real library. */
  differs: z.string().optional(),
  steps: z.array(LabStepSchema).min(4).max(6),
});

// --------------------------------------------------------------- library ---

export const LibraryPageSchema = z.object({
  unit: z.string(),
  /** The key ideas, one short paragraph each. */
  ideas: z.array(z.object({ title: z.string(), text: z.string() })).min(2),
  /** Rules worth remembering, one line each. */
  rules: z.array(z.string()).min(1),
  /** A short annotated example: code, what it prints (verified), and notes. */
  example: z.object({ code: z.string(), output: z.string(), notes: z.array(z.string()) }),
  mistakes: z.array(z.object({ mistake: z.string(), fix: z.string() })).min(2),
  /** "To do this for real": what the app cannot give, and where to go next. */
  forReal: z.string().optional(),
});

export const UnitSchema = z.object({
  id: z.string().regex(/^[FE]\d+$/),
  track: z.enum(['foundations', 'engineering']),
  title: z.string(),
  blurb: z.string(),
  prelude: z.string().optional(),
  lessons: z.array(LessonSchema).min(1),
  /** Code labs, unlocked as lessons are done. */
  labs: z.array(LabSchema).optional(),
  /** The unit's Library page, unlocked when the unit is finished. */
  library: LibraryPageSchema.optional(),
});

export type LabStep = z.infer<typeof LabStepSchema>;
export type Lab = z.infer<typeof LabSchema>;
export type LibraryPage = z.infer<typeof LibraryPageSchema>;

export type Option = z.infer<typeof OptionSchema>;
export type FigureSpec = z.infer<typeof FigureSchema>;
export type CompareFigureSpec = z.infer<typeof CompareFigureSchema>;
export type StepperFigureSpec = z.infer<typeof StepperFigureSchema>;
export type ShapeFigureSpec = z.infer<typeof ShapeFigureSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseType = Exercise['type'];
export type ExerciseOf<T extends ExerciseType> = Extract<Exercise, { type: T }>;
export type Card = z.infer<typeof CardSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Unit = z.infer<typeof UnitSchema>;

export const EXERCISE_TYPES: ExerciseType[] = [
  'mcq',
  'predict-output',
  'predict-shape',
  'fill-blank',
  'order-lines',
  'spot-bug',
  'match-pairs',
  'number-grid',
  'run-code',
  'figure',
];

/** Types that ask the learner to produce or predict, rather than recognise. */
export const PRODUCING_TYPES: ExerciseType[] = [
  'predict-output',
  'predict-shape',
  'fill-blank',
  'order-lines',
  'spot-bug',
  'number-grid',
  'run-code',
  'figure',
];
