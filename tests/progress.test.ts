import { describe, expect, it } from 'vitest';
import { buildReviewSet } from '../src/lib/curriculum';
import { addDays } from '../src/lib/dates';
import {
  RETIRED,
  canonicalJson,
  computeStats,
  computeStreakInfo,
  dueItems,
  emptyProgress,
  mergeProgress,
  nextReview,
  normalizeProgress,
  sameProgress,
  type Activity,
  type Progress,
} from '../src/lib/progress';

const act = (id: string, day: string, ref = 'f3-01', kind: Activity['kind'] = 'lesson'): Activity => ({
  id,
  at: `${day}T10:00:00.000Z`,
  day,
  kind,
  ref,
  xp: 20,
  minutes: 5,
});

/** A run of consecutive active days starting at `from`. */
const run = (from: string, n: number) => Array.from({ length: n }, (_, i) => addDays(from, i));

describe('merge: two devices offline', () => {
  const base: Progress = {
    ...emptyProgress(),
    completed: { 'f3-01': '2026-11-10T10:00:00.000Z' },
    activity: [act('a0', '2026-11-10')],
  };
  // Phone: lesson f3-02, a mistake on f3-2-3, saved lab code.
  const phone: Progress = {
    ...base,
    completed: { ...base.completed, 'f3-02': '2026-11-12T08:00:00.000Z' },
    activity: [...base.activity, act('p1', '2026-11-12', 'f3-02')],
    review: { 'f3-2-3': { box: 1, due: '2026-11-13', updatedAt: '2026-11-12T08:05:00.000Z' } },
    labCode: { 'f3-lab-1#1': { code: 'phone', updatedAt: '2026-11-12T08:10:00.000Z' } },
  };
  // PC, same day, offline: lesson e2-01, f3-2-3 reviewed later and promoted, newer lab code.
  const pc: Progress = {
    ...base,
    completed: { ...base.completed, 'e2-01': '2026-11-12T20:00:00.000Z' },
    activity: [...base.activity, act('c1', '2026-11-12', 'e2-01'), act('c2', '2026-11-12', 'review', 'review')],
    review: { 'f3-2-3': { box: 2, due: '2026-11-15', updatedAt: '2026-11-12T21:00:00.000Z' } },
    labCode: { 'f3-lab-1#1': { code: 'pc', updatedAt: '2026-11-12T21:30:00.000Z' } },
    settings: { dailyGoal: 30, goalUpdatedAt: '2026-11-12T19:00:00.000Z', sound: false },
  };

  const merged = mergeProgress(phone, pc);

  it('keeps lessons done on either device', () => {
    expect(Object.keys(merged.completed).sort()).toEqual(['e2-01', 'f3-01', 'f3-02']);
  });
  it('keeps every activity once, so XP adds up and nothing is double counted', () => {
    expect(merged.activity.map((a) => a.id).sort()).toEqual(['a0', 'c1', 'c2', 'p1']);
    expect(computeStats(merged, '2026-11-12').totalXp).toBe(80);
  });
  it('takes the newest review state and lab code', () => {
    expect(merged.review['f3-2-3'].box).toBe(2);
    expect(merged.labCode['f3-lab-1#1'].code).toBe('pc');
  });
  it('takes the newest settings', () => {
    expect(merged.settings.dailyGoal).toBe(30);
  });
  it('is the same whichever device merges first, and merging again changes nothing', () => {
    expect(canonicalJson(mergeProgress(pc, phone))).toBe(canonicalJson(merged));
    expect(sameProgress(mergeProgress(merged, pc), merged)).toBe(true);
    expect(sameProgress(mergeProgress(merged, merged), merged)).toBe(true);
  });
  it('keeps the earliest completion date', () => {
    const later = { ...pc, completed: { ...pc.completed, 'f3-02': '2026-11-13T00:00:00.000Z' } };
    expect(mergeProgress(phone, later).completed['f3-02']).toBe('2026-11-12T08:00:00.000Z');
  });
  it('rebuilds the streak from both logs', () => {
    const a = { ...emptyProgress(), activity: [act('x', '2026-11-12'), act('y', '2026-11-14')] };
    const b = { ...emptyProgress(), activity: [act('z', '2026-11-13')] };
    expect(computeStats(a, '2026-11-14').streak).toBe(1);
    expect(computeStats(mergeProgress(a, b), '2026-11-14').streak).toBe(3);
  });
});

describe('normalising imported or synced files', () => {
  it('rejects files that are not progress', () => {
    expect(() => normalizeProgress({ hello: 1 })).toThrow();
    expect(() => normalizeProgress([])).toThrow();
  });
  it('drops malformed parts and keeps the rest', () => {
    const p = normalizeProgress({
      schema: 1,
      completed: { 'f3-01': '2026-11-10', bad: 3 },
      activity: [act('a', '2026-11-10'), { nonsense: true }],
      settings: { dailyGoal: 999 },
    });
    expect(Object.keys(p.completed)).toEqual(['f3-01']);
    expect(p.activity).toHaveLength(1);
    expect(p.settings.dailyGoal).toBe(15);
  });
  it('never carries anything but progress (no token can ride along)', () => {
    const p = normalizeProgress({ schema: 1, token: 'secret', settings: { token: 'secret' } });
    expect(canonicalJson(p)).not.toContain('secret');
  });
});

describe('streak freezes', () => {
  const today = '2026-11-20';
  it('a seven-day run earns a freeze that covers one missed day', () => {
    const days = new Set([...run('2026-11-10', 7), '2026-11-18', '2026-11-19', today]); // missed 17th
    const s = computeStreakInfo(days, today);
    expect(s.streak).toBe(10);
    expect(s.frozen).toEqual(['2026-11-17']);
    expect(s.freezes).toBe(0);
  });
  it('without a freeze, a missed day ends the streak', () => {
    const days = new Set([...run('2026-11-12', 5), '2026-11-18', '2026-11-19']); // missed 17th, only 5-day run
    expect(computeStreakInfo(days, today).streak).toBe(2);
  });
  it('two missed days need two freezes', () => {
    const days = new Set([...run('2026-11-01', 14), '2026-11-17', '2026-11-18']); // missed 15th and 16th
    const s = computeStreakInfo(days, '2026-11-18');
    expect(s.streak).toBe(16);
    expect(s.frozen).toEqual(['2026-11-15', '2026-11-16']);
  });
  it('today not done yet never breaks it, and yesterday can be frozen', () => {
    const days = new Set(run('2026-11-11', 7)); // last active 17th; 18th missed; today 19th
    const s = computeStreakInfo(days, '2026-11-19');
    expect(s.streak).toBe(7);
    expect(s.frozen).toEqual(['2026-11-18']);
  });
  it('banks at most two', () => {
    expect(computeStreakInfo(new Set(run('2026-10-01', 35)), '2026-11-04').freezes).toBe(2);
  });
});

describe('Leitner review queue', () => {
  const now = new Date(2026, 10, 14, 12);
  it('a wrong answer goes to box 1, due tomorrow', () => {
    expect(nextReview({ box: 4, due: '2026-11-14', updatedAt: '' }, false, now)).toMatchObject({ box: 1, due: '2026-11-15' });
  });
  it('right answers move items up and further apart, then out of the queue', () => {
    let r = nextReview(undefined, false, now);
    const dues: string[] = [];
    for (let i = 0; i < 5; i++) {
      r = nextReview(r, true, now);
      dues.push(r.due);
    }
    expect(dues).toEqual(['2026-11-17', '2026-11-21', '2026-11-28', '2026-12-14', '9999-12-31']);
    expect(r.box).toBe(RETIRED);
  });
  it('lists due items most overdue first and leaves lab steps to the labs', () => {
    const p: Progress = {
      ...emptyProgress(),
      review: {
        'f3-1-2': { box: 2, due: '2026-11-14', updatedAt: '' },
        'f3-1-3': { box: 1, due: '2026-11-12', updatedAt: '' },
        'f3-1-4': { box: 1, due: '2026-11-20', updatedAt: '' },
        'lab:f3-lab-1#2': { box: 1, due: '2026-11-12', updatedAt: '' },
      },
    };
    expect(dueItems(p, '2026-11-14')).toEqual(['f3-1-3', 'f3-1-2']);
    expect(dueItems(p, '2026-11-14', 'lab:')).toEqual(['lab:f3-lab-1#2']);
  });
  it('a review session starts with due items, then pads from finished lessons', () => {
    const p: Progress = {
      ...emptyProgress(),
      completed: { 'f3-01': '2026-11-10T00:00:00.000Z' },
      review: { 'f3-2-3': { box: 1, due: '2026-11-13', updatedAt: '' } },
    };
    const set = buildReviewSet(p, 5, '2026-11-14', () => 0.5);
    expect(set).toHaveLength(5);
    expect(set[0].ex.id).toBe('f3-2-3');
    for (const r of set.slice(1)) expect(r.lesson.id).toBe('f3-01');
    expect(set.some((r) => r.ex.type === 'figure' || r.ex.type === 'run-code')).toBe(false);
  });
  it('offers nothing before any lesson is done', () => {
    expect(buildReviewSet(emptyProgress(), 10, '2026-11-14')).toHaveLength(0);
  });
});

describe('recording a review', () => {
  it('promotes queued items, demotes misses, and leaves practice items it got right out of the queue', async () => {
    const { replaceProgress, recordReview, getProgress } = await import('../src/lib/progress');
    replaceProgress({ ...emptyProgress(), review: { 'f3-2-3': { box: 1, due: '2026-11-14', updatedAt: '' } } });
    const now = new Date(2026, 10, 14, 12);
    recordReview('quick', { 'f3-2-3': true, 'f3-1-3': true, 'f3-1-5': false }, 7, 2, now);
    const p = getProgress();
    expect(p.review['f3-2-3']).toMatchObject({ box: 2, due: '2026-11-17' });
    expect(p.review['f3-1-3']).toBeUndefined();
    expect(p.review['f3-1-5']).toMatchObject({ box: 1, due: '2026-11-15' });
    expect(p.activity.at(-1)).toMatchObject({ kind: 'review', ref: 'quick', xp: 7, minutes: 2, day: '2026-11-14' });
  });
});

describe('testing out with a checkpoint', () => {
  it('marks every lesson passed to it as done, once, in a single activity', async () => {
    const { replaceProgress, recordLesson, getProgress } = await import('../src/lib/progress');
    const { f3 } = await import('../content/units/f3');
    replaceProgress({ ...emptyProgress(), completed: { 'f3-01': '2026-11-01T00:00:00.000Z' } });
    recordLesson('f3-12', 30, 6, new Date(2026, 10, 14, 12), f3.lessons.map((l) => l.id));
    const p = getProgress();
    expect(Object.keys(p.completed)).toHaveLength(12);
    expect(p.completed['f3-01']).toBe('2026-11-01T00:00:00.000Z');
    expect(p.activity).toHaveLength(1);
    expect(f3.lessons.at(-1)?.checkpoint).toBe(true);
  });
});

describe('labs', () => {
  it('saves step code, queues hinted steps, completes the lab on the last step, and a clean rewrite retires the step', async () => {
    const { replaceProgress, recordLabStep, getProgress } = await import('../src/lib/progress');
    const { findLab, labCodeBefore, labRewrites } = await import('../src/lib/curriculum');
    const lab = findLab('f3-lab-1')!.lab;
    const now = new Date(2026, 10, 14, 12);
    replaceProgress(emptyProgress());
    lab.steps.forEach((st, i) => recordLabStep(lab.id, i + 1, st.solution, i === 1, i === lab.steps.length - 1, 8, 2, now));
    let p = getProgress();
    expect(p.completed[lab.id]).toBeTruthy();
    expect(p.labCode['f3-lab-1#1'].code).toBe(lab.steps[0].solution);
    expect(p.review['lab:f3-lab-1#2']).toMatchObject({ box: 1, due: '2026-11-15' });
    // Not due today, due tomorrow; and lab steps never appear in exercise reviews.
    expect(labRewrites(p, '2026-11-14')).toEqual([]);
    expect(labRewrites(p, '2026-11-15')).toEqual([{ labId: 'f3-lab-1', step: 2 }]);
    expect(buildReviewSet(p, 10, '2026-11-15').some((r) => r.ex.id.startsWith('lab'))).toBe(false);
    // The program so far is the given code plus the learner's steps.
    expect(labCodeBefore(lab, p, 2)).toBe([lab.given, lab.steps[0].solution, lab.steps[1].solution].join('\n\n'));
    recordLabStep(lab.id, 2, 'def column(M, j):\n    return [r[j] for r in M]', false, false, 8, 2, now);
    p = getProgress();
    expect(p.review['lab:f3-lab-1#2'].box).toBe(RETIRED);
    expect(labCodeBefore(lab, p, 2)).toContain('[r[j] for r in M]');
  });
});

describe('plan weeks', () => {
  it('marks the unit for the current plan week', async () => {
    const { planWeekOn, unitsThisWeek, PLAN } = await import('../content/plan');
    expect(planWeekOn('2026-11-16')?.id).toBe('3');
    expect(unitsThisWeek('2026-11-22')).toEqual(['E5']);
    expect(unitsThisWeek('2026-11-23').sort()).toEqual(['E4']);
    expect(unitsThisWeek('2027-02-10').sort()).toEqual(['E11', 'E5']);
    expect(unitsThisWeek('2027-06-01')).toEqual([]);
    // Weeks are contiguous and do not overlap.
    for (let i = 1; i < PLAN.length; i++) expect(PLAN[i].start > PLAN[i - 1].end).toBe(true);
  });
});
