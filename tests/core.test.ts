import { describe, expect, it } from 'vitest';
import { f3 } from '../content/units/f3';
import type { ExerciseOf, ExerciseType } from '../content/schema';
import { predictOutput, predictShape } from '../src/exercises/choice';
import { numberGrid } from '../src/exercises/grid';
import { fillBlank, spotBug } from '../src/exercises/tap';
import { continueLesson, nextAfter } from '../src/lib/curriculum';
import { addDays, dayKey } from '../src/lib/dates';
import { computeStats, computeStreak, creditedMinutes, emptyProgress, lessonXp, type Progress } from '../src/lib/progress';
import { canonicalShape, shapeGoalReachable } from '../src/lib/shapes';
import { countSentences, fillGaps, normalizeTyped, outputMatches } from '../src/lib/text';

const exercise = <T extends ExerciseType>(id: string) =>
  f3.lessons.flatMap((l) => l.exercises).find((e) => e.id === id) as ExerciseOf<T>;

describe('dates', () => {
  it('adds days across month ends', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2027-03-01', -1)).toBe('2027-02-28');
  });
  it('uses the local calendar day', () => {
    expect(dayKey(new Date(2026, 10, 14, 23, 59))).toBe('2026-11-14');
  });
});

describe('streak', () => {
  const days = (...d: string[]) => new Set(d);
  it('counts consecutive days ending today', () => {
    expect(computeStreak(days('2026-11-12', '2026-11-13', '2026-11-14'), '2026-11-14')).toBe(3);
  });
  it('stays alive until the day is over', () => {
    expect(computeStreak(days('2026-11-12', '2026-11-13'), '2026-11-14')).toBe(2);
  });
  it('resets after a missed day', () => {
    expect(computeStreak(days('2026-11-11', '2026-11-12'), '2026-11-14')).toBe(0);
  });
});

describe('stats from the activity log', () => {
  const p: Progress = {
    ...emptyProgress(),
    activity: [
      { id: 'a', at: '', day: '2026-11-13', kind: 'lesson', ref: 'f3-01', xp: 20, minutes: 5 },
      { id: 'b', at: '', day: '2026-11-14', kind: 'lesson', ref: 'f3-02', xp: 26, minutes: 4 },
      { id: 'c', at: '', day: '2026-11-14', kind: 'lesson', ref: 'f3-03', xp: 18, minutes: 12 },
    ],
  };
  it('recomputes XP, minutes, goal and streak', () => {
    const s = computeStats(p, '2026-11-14');
    expect(s.totalXp).toBe(64);
    expect(s.todayXp).toBe(44);
    expect(s.todayMinutes).toBe(16);
    expect(s.goalMet).toBe(true);
    expect(s.streak).toBe(2);
  });
  it('credits minutes within bounds and scores XP', () => {
    expect(creditedMinutes(30_000)).toBe(3);
    expect(creditedMinutes(5 * 60_000)).toBe(5);
    expect(creditedMinutes(60 * 60_000)).toBe(12);
    expect(lessonXp(8)).toBe(26);
  });
});

describe('typed answers', () => {
  it('undoes iOS smart punctuation', () => {
    expect(normalizeTyped('cfg[“lr”] — x[‘a’]')).toBe('cfg["lr"] -- x[\'a\']');
  });
  it('accepts spacing differences and equal numbers', () => {
    expect(outputMatches('[1,4,9]', '[1 4 9]')).toBe(false);
    expect(outputMatches('[1  4  9]', '[1 4 9]')).toBe(true);
    expect(outputMatches(' 4 ', '4.0')).toBe(true);
    expect(outputMatches('5', '4.0')).toBe(false);
  });
  it('parses shapes the way Python prints them', () => {
    expect(canonicalShape('2,3')).toBe('(2, 3)');
    expect(canonicalShape('(4,)')).toBe('(4,)');
    expect(canonicalShape('4')).toBe('(4,)');
    expect(canonicalShape('error')).toBe('error');
    expect(canonicalShape('2,x')).toBe(null);
  });
});

describe('content helpers', () => {
  it('counts sentences, ignoring dots in code', () => {
    expect(countSentences('Use `np.dot` here. Then stop. Done!')).toBe(3);
  });
  it('fills gaps in order', () => {
    expect(fillGaps('a ___ b ___ c', ['+', '*'])).toBe('a + b * c');
  });
  it('knows whether a shape goal is reachable', () => {
    expect(shapeGoalReachable({ kind: 'shape-checker', left: [2, 3], right: [2, 4], editable: ['r0'], goal: {} })).toBe(true);
    expect(shapeGoalReachable({ kind: 'shape-checker', left: [2, 3], right: [2, 4], goal: {} })).toBe(false);
    expect(shapeGoalReachable({ kind: 'shape-checker', left: [4, 3], right: [2, 4], swappable: true, goal: {} })).toBe(true);
  });
});

describe('grading', () => {
  it('number grid names the * / @ mix-up', () => {
    const ex = exercise<'number-grid'>('f3-4-4');
    const elementwise = [['2', '3'], ['0', '1']];
    const g = numberGrid.grade(ex, elementwise, { prelude: '' }) as { correct: boolean; message: string };
    expect(g.correct).toBe(false);
    expect(g.message).toMatch(/element-wise/);
    const right = numberGrid.grade(ex, [['4', '7'], ['2', '1']], { prelude: '' }) as { correct: boolean };
    expect(right.correct).toBe(true);
  });
  it('number grid explains the first wrong cell', () => {
    const ex = exercise<'number-grid'>('f3-4-4');
    const g = numberGrid.grade(ex, [['4', '7'], ['2', '9']], { prelude: '' }) as { message: string };
    expect(g.message).toBe('Row 2, column 2: row 2 of A · column 2 of B = 0×3 + 1×1 = 1.');
  });
  it('typed output uses the targeted explanation', () => {
    const ex = exercise<'predict-output'>('f3-4-5');
    const g = predictOutput.grade(ex, '17', { prelude: '' }) as { correct: boolean; message: string };
    expect(g.correct).toBe(false);
    expect(g.message).toMatch(/row 1 of B/);
    expect((predictOutput.grade(ex, '19', { prelude: '' }) as { correct: boolean }).correct).toBe(true);
  });
  it('typed shape accepts "3,1" for (3, 1)', () => {
    const ex = exercise<'predict-shape'>('f3-6-3');
    expect((predictShape.grade(ex, '3,1', { prelude: '' }) as { correct: boolean }).correct).toBe(true);
  });
  it('fill-blank explains the distractor that was used', () => {
    const ex = exercise<'fill-blank'>('f3-1-6');
    const bank = ['@', '*', '+'];
    const g = fillBlank.grade(ex, { bank, slots: [0] }, { prelude: '' }) as { correct: boolean; message: string };
    expect(g.correct).toBe(false);
    expect(g.message).toMatch(/whole bill/);
  });
  it('spot-bug explains the tapped line', () => {
    const ex = exercise<'spot-bug'>('f3-10-7');
    const g = spotBug.grade(ex, 2, { prelude: '' }) as { message: string };
    expect(g.message).toMatch(/right operation/);
  });
});

describe('continue button', () => {
  it('starts a new learner on the flagship unit', () => {
    expect(continueLesson(emptyProgress())?.lesson.id).toBe('f3-01');
  });
  it('goes to the next open lesson after the last one done', () => {
    const p: Progress = {
      ...emptyProgress(),
      completed: { 'f3-01': 'x', 'f3-02': 'x' },
      activity: [{ id: 'a', at: '', day: '2026-11-14', kind: 'lesson', ref: 'f3-02', xp: 10, minutes: 4 }],
    };
    expect(continueLesson(p)?.lesson.id).toBe('f3-03');
    expect(nextAfter('f3-02', p)?.lesson.id).toBe('f3-03');
  });
});

describe('number grid with a scalar or a longer expression', () => {
  it('grades without crashing and explains with the lesson text', async () => {
    const { f2 } = await import('../content/units/f2');
    const all = f2.lessons.flatMap((l) => l.exercises);
    for (const id of ['f2-3-1', 'f2-8-2', 'f2-2-1']) {
      const ex = all.find((e) => e.id === id) as ExerciseOf<'number-grid'>;
      const wrong = ex.answer.map((r) => r.map(() => '0'));
      const g = numberGrid.grade(ex, wrong, { prelude: '' }) as { correct: boolean; message?: string };
      expect(g.correct).toBe(false);
      expect(g.message).toBeTruthy();
      const right = ex.answer.map((r) => r.map(String));
      expect((numberGrid.grade(ex, right, { prelude: '' }) as { correct: boolean }).correct).toBe(true);
    }
  });
});

import { broadcastShape, checkDims, resultGrid, stretch } from '../src/lib/broadcast';

describe('broadcasting helper (matches NumPy rules)', () => {
  it('lines shapes up from the right', () => {
    expect(broadcastShape([2, 3], [3])).toEqual([2, 3]);
    expect(broadcastShape([3, 1], [1, 4])).toEqual([3, 4]);
    expect(broadcastShape([2, 3], [2])).toBeNull();
    expect(broadcastShape([3, 1], [3])).toEqual([3, 3]);
    expect(checkDims([2, 3], [3]).map((d) => d.verdict)).toEqual(['stretchB', 'match']);
    expect(checkDims([2, 3], [2, 2]).map((d) => d.verdict)).toEqual(['match', 'clash']);
  });
  it('stretches grids by copying', () => {
    expect(resultGrid([[1], [2]], [[10, 20, 30]])).toEqual([2, 3]);
    expect(stretch([[1], [2]], 2, 3)).toEqual([[1, 1, 1], [2, 2, 2]]);
    expect(resultGrid([[1, 2]], [[1, 2, 3]])).toBeNull();
  });
});
