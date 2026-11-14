import { catalog, type Track, type UnitEntry } from '../../content/index';
import type { Lesson, Unit } from '../../content/schema';
import type { Progress } from './progress';

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
