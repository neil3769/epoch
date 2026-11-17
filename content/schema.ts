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

export const BroadcastFigureSchema = z.object({
  kind: z.literal('broadcast'),
  A: Matrix,
  B: Matrix,
  /** Operands that are 1-D arrays, drawn as one row: shape (n,). */
  oneD: z.array(z.enum(['A', 'B'])).optional(),
  op: z.enum(['+', '-', '*']).optional(),
  /** Goal for exercises: tap this result cell (after stretching). */
  goal: z.object({ cell: Cell }).optional(),
});

export const DescentFigureSchema = z.object({
  kind: z.literal('descent'),
  /** The curve f(x) = a (x - m)^2 + c. */
  a: z.number().positive(),
  m: z.number(),
  c: z.number().optional(),
  start: z.number(),
  /** Starting learning rate; must be one of the slider's values when editable. */
  lr: z.number().positive(),
  editableLr: z.boolean().optional(),
  /** Goal: get within `within` of the minimum in at most `maxSteps` steps. */
  goal: z.object({ within: z.number().positive(), maxSteps: z.number().int().min(1) }).optional(),
});

export const NeuronFigureSchema = z.object({
  kind: z.literal('neuron'),
  /** Input values. */
  x: z.array(z.number()).min(1).max(4),
  /** One row of weights per neuron (1 to 3 neurons). */
  W: Matrix,
  /** One bias per neuron (default 0). */
  b: z.array(z.number()).optional(),
  act: z.enum(['relu', 'sigmoid', 'none']).optional(),
  /** Also show the layer as W @ x + b = z. */
  matrix: z.boolean().optional(),
  /** Weights the learner can nudge up and down by `step`, as [neuron, input]. */
  editable: z.array(Cell).optional(),
  step: z.number().positive().optional(),
  /** Goal: tap this neuron, or get this neuron's output to this value. */
  goal: z.union([z.object({ tap: z.number().int().min(0) }), z.object({ neuron: z.number().int().min(0), output: z.number() })]).optional(),
});

const LbAlgo = z.enum(['round-robin', 'least-conn', 'hash']);

/** Load balancer: requests from users routed to 2-4 servers by a chosen algorithm. */
export const BalancerFigureSchema = z.object({
  kind: z.literal('balancer'),
  servers: z.number().int().min(2).max(4),
  /** One request per tick; `cost` is how many ticks it keeps its server busy. */
  requests: z.array(z.object({ user: z.string().regex(/^[A-Z]$/), cost: z.number().int().min(1).max(6) })).min(4).max(12),
  algorithm: LbAlgo,
  /** Algorithms the learner may choose between. */
  algorithms: z.array(LbAlgo).min(2).optional(),
  down: z.array(z.number().int().min(0)).optional(),
  /** Servers can be tapped to take them down or bring them back. */
  killable: z.boolean().optional(),
  health: z.boolean().optional(),
  toggleHealth: z.boolean().optional(),
  goal: z
    .union([z.object({ sticky: z.literal(true) }), z.object({ maxPeak: z.number().int().min(1) }), z.object({ noFailures: z.literal(true) })])
    .optional(),
});

/** Cache: a stream of reads against a small cache with a size, policy and TTL. */
export const CacheFigureSchema = z.object({
  kind: z.literal('cache'),
  reads: z.string().regex(/^[a-z]( [a-z])*$/),
  changes: z.array(z.object({ key: z.string(), at: z.number().int().min(0) })).optional(),
  size: z.number().int().min(1).max(5),
  policy: z.enum(['lru', 'fifo']),
  ttl: z.union([z.literal(10), z.literal(5), z.literal(2), z.null()]),
  editable: z.array(z.enum(['size', 'policy', 'ttl'])).optional(),
  goal: z
    .union([
      z.object({ hitRate: z.number().gt(0).max(1) }),
      z.object({ noStale: z.literal(true), minHitRate: z.number().gt(0).max(1).optional() }),
      z.object({ stale: z.literal(true) }),
    ])
    .optional(),
});

/** Consistent hashing: keys on servers by hash % n or on a ring, with servers added or removed. */
export const RingFigureSchema = z.object({
  kind: z.literal('ring'),
  keys: z.array(z.string().regex(/^[a-z0-9]{1,8}$/)).min(6).max(20),
  servers: z.number().int().min(1).max(5),
  maxServers: z.number().int().min(2).max(5),
  mode: z.enum(['mod', 'ring']),
  switchable: z.boolean().optional(),
  vnodes: z.array(z.number().int().min(1).max(32)).min(1).max(3).optional(),
  goal: z
    .union([
      z.object({ servers: z.number().int().min(1), maxMoved: z.number().int().min(0) }),
      z.object({ servers: z.number().int().min(1), maxShare: z.number().gt(0).max(1) }),
    ])
    .optional(),
});

export const FigureSchema = z.discriminatedUnion('kind', [
  CompareFigureSchema,
  StepperFigureSchema,
  ShapeFigureSchema,
  BroadcastFigureSchema,
  DescentFigureSchema,
  NeuronFigureSchema,
  BalancerFigureSchema,
  CacheFigureSchema,
  RingFigureSchema,
]);


// ------------------------------------------------------------- diagrams ---

/** Building blocks an architecture diagram can show. */
export const NODE_KINDS = [
  'client',
  'dns',
  'cdn',
  'lb',
  'service',
  'cache',
  'db',
  'replica',
  'queue',
  'worker',
  'store',
  'search',
  'model',
  'vector',
  'api',
] as const;
export const NodeKind = z.enum(NODE_KINDS);

/**
 * An architecture diagram. Authors list nodes in the order a request meets
 * them and never give coordinates: the component lays them out in layers,
 * top to bottom (an edge to an earlier node is drawn as a return arrow).
 */
export const DiagramSchema = z.object({
  nodes: z
    .array(z.object({ id: z.string().regex(/^[a-z0-9_]+$/), kind: NodeKind, label: z.string().min(1).max(12) }))
    .min(1)
    .max(8),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      label: z.string().max(8).optional(),
      /** Drawn dashed: asynchronous or background traffic. */
      dashed: z.boolean().optional(),
    }),
  ),
  /** A design growing: each stage lists the node ids shown, with a caption. */
  stages: z.array(z.object({ nodes: z.array(z.string()).min(1), caption: z.string() })).min(2).max(6).optional(),
});

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
  lines: z.array(z.object({ text: z.string(), fixed: z.boolean().optional() })).min(3).max(16),
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
  /** Rows in the editor: 1 or 2 for most exercises; up to 10 for writing a whole loop from memory. */
  maxLines: z.number().int().min(1).max(10).optional(),
  placeholder: z.string().optional(),
  explain: z.string(),
});

export const FigureExerciseSchema = z.object({
  ...base,
  type: z.literal('figure'),
  figure: FigureSchema,
});


// ---- system design exercises ---------------------------------------------

/** A sizing question, checked against a reference computed in Python. */
export const EstimateSchema = z.object({
  ...base,
  type: z.literal('estimate'),
  /** Python expression for the reference value; may use the Numbers page names (DAY, MB, ...). */
  expr: z.string(),
  /** The reference value as stated (verified: within 2% of expr). */
  answer: z.number().positive(),
  /** Correct when within this factor of the answer (2 = from half to double). */
  tolerance: z.number().min(1.1).max(10),
  /** Unit shown after the number, e.g. "requests/s". */
  unit: z.string(),
  /** Order-of-magnitude choices; without them the learner types a number. */
  options: z.array(z.object({ value: z.number().positive(), why: Why.optional() })).min(2).max(4).optional(),
  /** The worked arithmetic, one line each, shown after answering. */
  work: z.array(z.string()).min(1).max(6),
});

/** Prose steps to put in order (no code to run). Listed in the right order. */
export const OrderStepsSchema = z.object({
  ...base,
  type: z.literal('order-steps'),
  steps: z.array(z.string()).min(3).max(8),
  explain: z.string(),
});

/** Sort items into two or three buckets. */
export const BucketSortSchema = z.object({
  ...base,
  type: z.literal('bucket-sort'),
  buckets: z.array(z.string().max(14)).min(2).max(3),
  items: z.array(z.object({ text: z.string(), bucket: z.number().int().min(0), why: Why })).min(5).max(8),
});

/** A situation with concrete needs; every option says what it costs. */
export const ScenarioSchema = z.object({
  ...base,
  type: z.literal('scenario'),
  situation: z.string(),
  needs: z.array(z.string()).min(1).max(5),
  diagram: DiagramSchema.optional(),
  options: z.array(z.object({ text: z.string(), cost: z.string().min(8), why: Why.optional() })).min(2).max(4),
  answer: z.number().int().min(0),
});

const DiagramGoalSchema = z.discriminatedUnion('kind', [
  /** Tap the one node that answers the question; every other node says why not. */
  z.object({ kind: z.literal('tap'), answer: z.string(), why: z.record(z.string(), Why) }),
  /** Tap the nodes a request passes through, in order (a real path in the graph). */
  z.object({ kind: z.literal('path'), answer: z.array(z.string()).min(2) }),
  /** Choose the component for the empty slot. */
  z.object({
    kind: z.literal('slot'),
    slot: z.string(),
    options: z.array(z.object({ kind: NodeKind, label: z.string().max(12), why: Why.optional() })).min(2).max(4),
    answer: z.number().int().min(0),
  }),
]);

export const DiagramExerciseSchema = z.object({
  ...base,
  type: z.literal('diagram'),
  diagram: DiagramSchema,
  goal: DiagramGoalSchema,
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
  EstimateSchema,
  OrderStepsSchema,
  BucketSortSchema,
  ScenarioSchema,
  DiagramExerciseSchema,
]);

export const CardSchema = z.object({
  title: z.string(),
  /** At most three sentences (checked by verify-content). */
  text: z.string(),
  code: z.string().optional(),
  /** What `code` prints, shown under it (verified). */
  output: z.string().optional(),
  figure: FigureSchema.optional(),
  diagram: DiagramSchema.optional(),
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
  /** A reference diagram for the unit. */
  diagram: DiagramSchema.optional(),
  /** Primary sources for facts on the page. */
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })).optional(),
});

export const UnitSchema = z.object({
  id: z.string().regex(/^[FES]\d+$/),
  track: z.enum(['foundations', 'engineering', 'system-design']),
  title: z.string(),
  blurb: z.string(),
  prelude: z.string().optional(),
  lessons: z.array(LessonSchema).min(1),
  /** Code labs, unlocked as lessons are done. */
  labs: z.array(LabSchema).optional(),
  /** The unit's Library page, unlocked when the unit is finished. */
  library: LibraryPageSchema.optional(),
});

// ---------------------------------------------------------- walkthroughs ---

/** The fixed framework every design walkthrough follows, in order. */
export const FRAMEWORK = [
  'Requirements',
  'Estimation',
  'API',
  'Data model',
  'High-level design',
  'Deep dive',
  'Bottlenecks and trade-offs',
] as const;

export const WalkStepSchema = z.object({
  title: z.enum(FRAMEWORK),
  /** One or two sentences framing this step for this problem. */
  intro: z.string(),
  exercises: z.array(ExerciseSchema).min(2).max(4),
  /** "What a strong answer says here", shown after the step. */
  strong: z.string(),
  /** The design so far, shown with the strong-answer note. */
  diagram: DiagramSchema.optional(),
});

/** A classic design problem taken through the framework, the learner deciding at each step. */
export const WalkthroughSchema = z.object({
  id: z.string().regex(/^w-[a-z0-9-]+$/),
  title: z.string(),
  /** The interview question, as an interviewer would put it. */
  question: z.string(),
  /** Units that must be finished first. */
  needs: z.array(z.string()).min(1),
  minutes: z.number().int().min(10).max(25),
  steps: z.array(WalkStepSchema).length(7),
  /** Added to the Library when finished. */
  final: z.object({ diagram: DiagramSchema, decisions: z.array(z.string()).min(3) }),
  /** The reference for the blank-page pass. */
  blank: z.object({
    requirements: z.array(z.string()).min(4),
    components: z.array(NodeKind).min(3),
    firstFive: z.array(z.string()).min(3).max(6),
  }),
});

export type LabStep = z.infer<typeof LabStepSchema>;
export type Lab = z.infer<typeof LabSchema>;
export type LibraryPage = z.infer<typeof LibraryPageSchema>;

export type Option = z.infer<typeof OptionSchema>;
export type FigureSpec = z.infer<typeof FigureSchema>;
export type CompareFigureSpec = z.infer<typeof CompareFigureSchema>;
export type StepperFigureSpec = z.infer<typeof StepperFigureSchema>;
export type ShapeFigureSpec = z.infer<typeof ShapeFigureSchema>;
export type BroadcastFigureSpec = z.infer<typeof BroadcastFigureSchema>;
export type DescentFigureSpec = z.infer<typeof DescentFigureSchema>;
export type NeuronFigureSpec = z.infer<typeof NeuronFigureSchema>;
export type BalancerFigureSpec = z.infer<typeof BalancerFigureSchema>;
export type CacheFigureSpec = z.infer<typeof CacheFigureSchema>;
export type RingFigureSpec = z.infer<typeof RingFigureSchema>;
export type DiagramSpec = z.infer<typeof DiagramSchema>;
export type NodeKindT = (typeof NODE_KINDS)[number];
export type Exercise = z.infer<typeof ExerciseSchema>;
export type ExerciseType = Exercise['type'];
export type ExerciseOf<T extends ExerciseType> = Extract<Exercise, { type: T }>;
export type Card = z.infer<typeof CardSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type Walkthrough = z.infer<typeof WalkthroughSchema>;
export type WalkStep = z.infer<typeof WalkStepSchema>;

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
  'estimate',
  'order-steps',
  'bucket-sort',
  'scenario',
  'diagram',
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
  'estimate',
  'order-steps',
  'diagram',
];
