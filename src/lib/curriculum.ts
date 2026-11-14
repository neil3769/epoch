import { catalog, type Track, type UnitEntry } from '../../content/index';
import type { Exercise, Lab, Lesson, Unit } from '../../content/schema';
import { RETIRED, dueItems, type Progress } from './progress';

export interface LessonRef {
  unit: Unit;
  lesson: Lesson;
  index: number;
}

const index = new Map<string, LessonRef>();
for (const entry of catalog) {
  entry.unit?.lessons.forEach((lesson, i) => index.set(lesson.id, { unit: entry.unit!, lesson, index: i }));
}

export const findLesson = (id: string) => index.get(id);

export const unitsForTrack = (track: Track): UnitEntry[] => catalog.filter((u) => u.track === track);

/** The flagship unit is where a brand-new learner starts. */
const START_UNIT = 'F3';

function firstOpenIn(unit: Unit, p: Progress, after = -1): Lesson | undefined {
  return unit.lessons.find((l, i) => i > after && !p.completed[l.id]) ?? unit.lessons.find((l) => !p.completed[l.id]);
}

/** The lesson the "Continue" button opens. */
export function continueLesson(p: Progress, track?: Track): LessonRef | undefined {
  const lessons = [...p.activity].reverse().filter((a) => a.kind === 'lesson');
  for (const a of lessons) {
    const ref = index.get(a.ref);
    if (!ref || (track && ref.unit.track !== track)) continue;
    const next = firstOpenIn(ref.unit, p, ref.index);
    if (next) return index.get(next.id);
    break;
  }
  const order = [...catalog].sort((a, b) => (a.id === START_UNIT ? -1 : b.id === START_UNIT ? 1 : 0));
  for (const entry of order) {
    if (!entry.unit || (track && entry.track !== track)) continue;
    const next = firstOpenIn(entry.unit, p);
    if (next) return index.get(next.id);
  }
  return undefined;
}

/** After finishing a lesson: the next open lesson in its unit, else anywhere on its track. */
export function nextAfter(lessonId: string, p: Progress): LessonRef | undefined {
  const ref = index.get(lessonId);
  if (!ref) return undefined;
  const next = ref.unit.lessons.find((l, i) => i > ref.index && !p.completed[l.id]);
  if (next) return index.get(next.id);
  return continueLesson(p, ref.unit.track);
}

// ----------------------------------------------------------------- exercises ---

export interface ExerciseRef {
  unit: Unit;
  lesson: Lesson;
  ex: Exercise;
}

const exIndex = new Map<string, ExerciseRef>();
for (const entry of catalog)
  for (const lesson of entry.unit?.lessons ?? [])
    for (const ex of lesson.exercises) exIndex.set(ex.id, { unit: entry.unit!, lesson, ex });

export const findExercise = (id: string) => exIndex.get(id);

/** Figures cannot be answered wrongly, so they are never reviewed. */
const reviewable = (r: ExerciseRef | undefined): r is ExerciseRef => !!r && r.ex.type !== 'figure';

/**
 * The items for a review session of `size`: due items first, then items not
 * yet due (weakest first), then exercises from finished lessons, so there is
 * always something to practise once any lesson is done.
 */
export function buildReviewSet(p: Progress, size: number, today: string, random = Math.random): ExerciseRef[] {
  const picked = new Map<string, ExerciseRef>();
  const take = (id: string) => {
    const r = exIndex.get(id);
    if (picked.size < size && !picked.has(id) && reviewable(r)) picked.set(id, r);
  };
  dueItems(p, today).forEach(take);
  Object.entries(p.review)
    .filter(([id, r]) => !id.startsWith('lab:') && r.box < RETIRED)
    .sort(([, a], [, b]) => a.box - b.box || (a.due < b.due ? -1 : 1))
    .forEach(([id]) => take(id));
  if (picked.size < size) {
    const pool = [...exIndex.values()].filter((r) => p.completed[r.lesson.id] && r.ex.type !== 'run-code' && reviewable(r));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool.forEach((r) => take(r.ex.id));
  }
  return [...picked.values()];
}

// ---------------------------------------------------------------------- units ---

export const checkpointOf = (unit: Unit) => unit.lessons.find((l) => l.checkpoint);

export const unitDone = (unit: Unit, p: Progress) => unit.lessons.every((l) => p.completed[l.id]);

/** Share of exercises right first time needed to test out of a unit with its checkpoint. */
export const TEST_OUT = 0.8;

// ----------------------------------------------------------------------- labs ---

export interface LabRef {
  unit: Unit;
  lab: Lab;
  index: number;
}

const labIndex = new Map<string, LabRef>();
for (const entry of catalog) entry.unit?.labs?.forEach((lab, i) => labIndex.set(lab.id, { unit: entry.unit!, lab, index: i }));

export const findLab = (id: string) => labIndex.get(id);
export const allLabs = () => [...labIndex.values()];

export const labUnlocked = (lab: Lab, p: Progress) => !!p.completed[lab.unlockAfter];

/** Step ids are 1-based: "<lab>#1" is the first step. */
export const stepId = (labId: string, n: number) => `${labId}#${n}`;

/** The code the learner wrote for each step so far (falling back to the reference if missing). */
export function labCodeBefore(lab: Lab, p: Progress, step: number): string {
  const parts = lab.given ? [lab.given] : [];
  for (let i = 0; i < step; i++) parts.push(p.labCode[stepId(lab.id, i + 1)]?.code ?? lab.steps[i].solution);
  return parts.join('\n\n');
}

/** Lab steps done with a hint and due to be rewritten without help. */
export function labRewrites(p: Progress, today: string): { labId: string; step: number }[] {
  return dueItems(p, today, 'lab:')
    .map((key) => key.slice(4).split('#'))
    .filter(([labId]) => labIndex.has(labId))
    .map(([labId, n]) => ({ labId, step: Number(n) }));
}
