import { useSyncExternalStore } from 'react';
import { addDays, dayKey } from './dates';

/*
 * All progress lives on the device. The shape is designed so two devices can
 * later be merged without loss (Phase 3 sync):
 * - completed lessons: a set (merge = union, keep earliest date)
 * - activity: an append-only log with unique ids (merge = union by id);
 *   XP, streak and today's minutes are always recomputed from it
 * - review items and saved lab code: per-item with updatedAt (newest wins)
 */

export type ActivityKind = 'lesson' | 'review' | 'lab';

export interface Activity {
  id: string;
  /** ISO timestamp. */
  at: string;
  /** Local day YYYY-MM-DD when it happened. */
  day: string;
  kind: ActivityKind;
  /** Lesson / lab id. */
  ref: string;
  xp: number;
  minutes: number;
}

export interface ReviewItem {
  /** Leitner box, 1 = needs practice soon. */
  box: number;
  /** Day it is next due. */
  due: string;
  updatedAt: string;
}

export type DailyGoal = 5 | 15 | 30;

export interface Progress {
  schema: 1;
  completed: Record<string, string>;
  activity: Activity[];
  review: Record<string, ReviewItem>;
  labCode: Record<string, { code: string; updatedAt: string }>;
  settings: { dailyGoal: DailyGoal; goalUpdatedAt: string; sound: boolean };
}

const KEY = 'epoch.progress.v1';

export function emptyProgress(): Progress {
  return {
    schema: 1,
    completed: {},
    activity: [],
    review: {},
    labCode: {},
    settings: { dailyGoal: 15, goalUpdatedAt: new Date(0).toISOString(), sound: false },
  };
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const p = JSON.parse(raw) as Partial<Progress>;
    const base = emptyProgress();
    return { ...base, ...p, settings: { ...base.settings, ...(p.settings ?? {}) } } as Progress;
  } catch {
    return emptyProgress();
  }
}

let state: Progress = typeof localStorage === 'undefined' ? emptyProgress() : load();
const listeners = new Set<() => void>();

function commit(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
  listeners.forEach((l) => l());
}

export const getProgress = () => state;

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ---------------------------------------------------------------- actions ---

export function recordLesson(lessonId: string, xp: number, minutes: number, now = new Date()) {
  const at = now.toISOString();
  const entry: Activity = { id: uid(), at, day: dayKey(now), kind: 'lesson', ref: lessonId, xp, minutes };
  commit({
    ...state,
    completed: state.completed[lessonId] ? state.completed : { ...state.completed, [lessonId]: at },
    activity: [...state.activity, entry],
  });
}

/** A wrong answer puts the exercise in Leitner box 1, due tomorrow. */
export function recordMistake(exerciseId: string, now = new Date()) {
  commit({
    ...state,
    review: { ...state.review, [exerciseId]: { box: 1, due: addDays(dayKey(now), 1), updatedAt: now.toISOString() } },
  });
}

export function setDailyGoal(goal: DailyGoal) {
  commit({ ...state, settings: { ...state.settings, dailyGoal: goal, goalUpdatedAt: new Date().toISOString() } });
}

/** Test helper. */
export function replaceProgress(p: Progress) {
  commit(p);
}

// ---------------------------------------------------------------- derived ---

export interface Stats {
  totalXp: number;
  todayXp: number;
  todayMinutes: number;
  streak: number;
  activeToday: boolean;
  goal: DailyGoal;
  goalMet: boolean;
}

/** Consecutive active days ending today, or ending yesterday if today is not done yet. */
export function computeStreak(days: Set<string>, today: string): number {
  let start = today;
  if (!days.has(today)) {
    start = addDays(today, -1);
    if (!days.has(start)) return 0;
  }
  let n = 0;
  for (let d = start; days.has(d); d = addDays(d, -1)) n++;
  return n;
}

export function computeStats(p: Progress, today = dayKey()): Stats {
  const days = new Set(p.activity.map((a) => a.day));
  const todays = p.activity.filter((a) => a.day === today);
  const todayMinutes = todays.reduce((s, a) => s + a.minutes, 0);
  return {
    totalXp: p.activity.reduce((s, a) => s + a.xp, 0),
    todayXp: todays.reduce((s, a) => s + a.xp, 0),
    todayMinutes,
    streak: computeStreak(days, today),
    activeToday: todays.length > 0,
    goal: p.settings.dailyGoal,
    goalMet: todayMinutes >= p.settings.dailyGoal,
  };
}

/** Minutes credited for a lesson: real time spent, within sensible bounds. */
export function creditedMinutes(ms: number): number {
  const mins = ms / 60000;
  return Math.round(Math.min(12, Math.max(3, mins)) * 10) / 10;
}

/** 10 XP for finishing, plus 2 for each exercise right first time. */
export function lessonXp(firstTryCorrect: number): number {
  return 10 + 2 * firstTryCorrect;
}
