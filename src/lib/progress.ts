import { useSyncExternalStore } from 'react';
import { addDays, dayKey } from './dates';

/*
 * All progress lives on the device. The shape is designed so two devices can
 * always be merged without loss (see mergeProgress, used by GitHub sync and
 * by import):
 * - completed lessons, labs and lab steps: a set (merge = union, keep earliest date)
 * - activity: an append-only log with unique ids (merge = union by id);
 *   XP, streak, freezes and today's minutes are always recomputed from it
 * - review items and saved lab code: per-item with updatedAt (newest wins)
 * - settings: one object with updatedAt (newest wins)
 */

export type ActivityKind = 'lesson' | 'review' | 'lab';

export interface Activity {
  id: string;
  /** ISO timestamp. */
  at: string;
  /** Local day YYYY-MM-DD when it happened. */
  day: string;
  kind: ActivityKind;
  /** Lesson id, lab step id, or 'review' / 'quick' for review sessions. */
  ref: string;
  xp: number;
  minutes: number;
}

export interface ReviewItem {
  /** Leitner box: 1 = needs practice soon, RETIRED = learned. */
  box: number;
  /** Day it is next due. */
  due: string;
  updatedAt: string;
}

export interface SavedCode {
  code: string;
  updatedAt: string;
}

export type DailyGoal = 5 | 15 | 30;

export interface Settings {
  dailyGoal: DailyGoal;
  /** When any setting last changed (the name predates other settings). */
  goalUpdatedAt: string;
  sound: boolean;
}

export interface Progress {
  schema: 1;
  /** Lesson ids, lab ids and lab step ids ("<lab>#<n>") -> first completion time. */
  completed: Record<string, string>;
  activity: Activity[];
  /** Exercise ids, or "lab:<lab>#<n>" for lab steps done with a hint. */
  review: Record<string, ReviewItem>;
  /** "<lab>#<n>" -> the learner's code for that step. */
  labCode: Record<string, SavedCode>;
  settings: Settings;
}

const KEY = 'epoch.progress.v1';
const EPOCH0 = new Date(0).toISOString();

export function emptyProgress(): Progress {
  return {
    schema: 1,
    completed: {},
    activity: [],
    review: {},
    labCode: {},
    settings: { dailyGoal: 15, goalUpdatedAt: EPOCH0, sound: false },
  };
}

// ------------------------------------------------------------ normalise ---

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d);
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/**
 * Accept anything that looks like progress (from storage, an imported file or
 * the sync repository) and return a well-formed Progress, dropping bad parts.
 * Throws only if it is not a progress file at all.
 */
export function normalizeProgress(raw: unknown): Progress {
  if (!isObj(raw) || raw.schema !== 1) throw new Error('This is not an Epoch progress file.');
  const out = emptyProgress();
  if (isObj(raw.completed)) for (const [k, v] of Object.entries(raw.completed)) if (typeof v === 'string') out.completed[k] = v;
  if (Array.isArray(raw.activity))
    for (const a of raw.activity) {
      if (!isObj(a) || typeof a.id !== 'string' || typeof a.day !== 'string') continue;
      const kind = a.kind === 'review' || a.kind === 'lab' ? a.kind : 'lesson';
      out.activity.push({ id: a.id, at: str(a.at), day: a.day, kind, ref: str(a.ref), xp: num(a.xp), minutes: num(a.minutes) });
    }
  if (isObj(raw.review))
    for (const [k, v] of Object.entries(raw.review))
      if (isObj(v) && typeof v.due === 'string') out.review[k] = { box: num(v.box, 1), due: v.due, updatedAt: str(v.updatedAt, EPOCH0) };
  if (isObj(raw.labCode))
    for (const [k, v] of Object.entries(raw.labCode))
      if (isObj(v) && typeof v.code === 'string') out.labCode[k] = { code: v.code, updatedAt: str(v.updatedAt, EPOCH0) };
  if (isObj(raw.settings)) {
    const s = raw.settings;
    const g = s.dailyGoal;
    out.settings = {
      dailyGoal: g === 5 || g === 30 ? g : 15,
      goalUpdatedAt: str(s.goalUpdatedAt, EPOCH0),
      sound: s.sound === true,
    };
  }
  return out;
}

// ---------------------------------------------------------------- merge ---

/** Newest updatedAt wins; ties broken by content so the result is the same either way round. */
function newest<T extends { updatedAt: string }>(a: T | undefined, b: T | undefined): T {
  if (!a) return b!;
  if (!b) return a;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  return JSON.stringify(a) >= JSON.stringify(b) ? a : b;
}

/**
 * Merge two copies of progress without losing anything either side did.
 * Commutative and idempotent: merge(a, b) equals merge(b, a), merge(a, a) equals a.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const completed: Record<string, string> = { ...a.completed };
  for (const [k, v] of Object.entries(b.completed)) if (!completed[k] || v < completed[k]) completed[k] = v;

  const byId = new Map<string, Activity>();
  for (const x of [...a.activity, ...b.activity]) {
    const prev = byId.get(x.id);
    byId.set(x.id, prev && JSON.stringify(prev) >= JSON.stringify(x) ? prev : x);
  }
  const activity = [...byId.values()].sort((x, y) => (x.at === y.at ? (x.id < y.id ? -1 : 1) : x.at < y.at ? -1 : 1));

  const review: Record<string, ReviewItem> = {};
  for (const k of new Set([...Object.keys(a.review), ...Object.keys(b.review)])) review[k] = newest(a.review[k], b.review[k]);

  const labCode: Record<string, SavedCode> = {};
  for (const k of new Set([...Object.keys(a.labCode), ...Object.keys(b.labCode)])) labCode[k] = newest(a.labCode[k], b.labCode[k]);

  const sa = { ...a.settings, updatedAt: a.settings.goalUpdatedAt };
  const sb = { ...b.settings, updatedAt: b.settings.goalUpdatedAt };
  const { updatedAt: _drop, ...settings } = newest(sa, sb);

  return { schema: 1, completed, activity, review, labCode, settings };
}

/** Stable JSON (object keys sorted), so equal progress always serialises the same. */
export function canonicalJson(p: Progress): string {
  const sortKeys = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sortKeys);
    if (isObj(v)) return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
    return v;
  };
  return JSON.stringify(sortKeys(p), null, 1);
}

export const sameProgress = (a: Progress, b: Progress) => canonicalJson(a) === canonicalJson(b);

// ---------------------------------------------------------------- store ---

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeProgress(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

let state: Progress = typeof localStorage === 'undefined' ? emptyProgress() : load();
const listeners = new Set<() => void>();
/** Called after the learner changes something (not after a sync pull). */
const changeListeners = new Set<() => void>();

function commit(next: Progress, fromLearner = true) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep working in memory.
  }
  listeners.forEach((l) => l());
  if (fromLearner) changeListeners.forEach((l) => l());
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

export function onLearnerChange(cb: () => void): () => void {
  changeListeners.add(cb);
  return () => changeListeners.delete(cb);
}

/** Merge progress from elsewhere (sync or an imported file). Returns true if anything changed. */
export function mergeIn(other: Progress, fromLearner = false): boolean {
  const merged = mergeProgress(state, other);
  if (sameProgress(merged, state)) return false;
  commit(merged, fromLearner);
  return true;
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ---------------------------------------------------------------- Leitner ---

/** Days until the next review for each box. Box 6 is learned and leaves the queue. */
const INTERVAL: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
export const RETIRED = 6;
const NEVER = '9999-12-31';

export function nextReview(item: ReviewItem | undefined, correct: boolean, now = new Date()): ReviewItem {
  const today = dayKey(now);
  const at = now.toISOString();
  if (!correct) return { box: 1, due: addDays(today, 1), updatedAt: at };
  const box = Math.min(RETIRED, (item?.box ?? 0) + 1);
  return { box, due: box >= RETIRED ? NEVER : addDays(today, INTERVAL[box]), updatedAt: at };
}

/** Review items due today or earlier, most urgent first. */
export function dueItems(p: Progress, today = dayKey(), prefix?: string): string[] {
  return Object.entries(p.review)
    .filter(([id, r]) => r.box < RETIRED && r.due <= today && (prefix === undefined ? !id.startsWith('lab:') : id.startsWith(prefix)))
    .sort(([, a], [, b]) => (a.due === b.due ? a.box - b.box : a.due < b.due ? -1 : 1))
    .map(([id]) => id);
}

// ---------------------------------------------------------------- actions ---

function activity(kind: ActivityKind, ref: string, xp: number, minutes: number, now: Date): Activity {
  return { id: uid(), at: now.toISOString(), day: dayKey(now), kind, ref, xp, minutes };
}

const markDone = (c: Record<string, string>, ids: string[], at: string) => {
  const out = { ...c };
  for (const id of ids) if (!out[id]) out[id] = at;
  return out;
};

/** A finished lesson. `alsoComplete` marks other lessons done too (testing out with a checkpoint). */
export function recordLesson(lessonId: string, xp: number, minutes: number, now = new Date(), alsoComplete: string[] = []) {
  commit({
    ...state,
    completed: markDone(state.completed, [lessonId, ...alsoComplete], now.toISOString()),
    activity: [...state.activity, activity('lesson', lessonId, xp, minutes, now)],
  });
}

/** A wrong answer in a lesson puts the exercise in Leitner box 1, due tomorrow. */
export function recordMistake(exerciseId: string, now = new Date()) {
  commit({ ...state, review: { ...state.review, [exerciseId]: nextReview(undefined, false, now) } });
}

/**
 * A finished review session. `results` maps each exercise to whether it was
 * right first time: right moves it up a box, wrong sends it back to box 1.
 */
export function recordReview(kind: 'review' | 'quick', results: Record<string, boolean>, xp: number, minutes: number, now = new Date()) {
  const review = { ...state.review };
  for (const [id, ok] of Object.entries(results)) {
    // Practice items (padding from finished lessons) only join the queue if missed.
    if (!review[id] && ok) continue;
    review[id] = nextReview(review[id], ok, now);
  }
  commit({ ...state, review, activity: [...state.activity, activity('review', kind, xp, minutes, now)] });
}

/** Save the learner's code for a lab step (as they type, so nothing is lost). */
export function saveLabCode(stepId: string, code: string, now = new Date()) {
  if (state.labCode[stepId]?.code === code) return;
  commit({ ...state, labCode: { ...state.labCode, [stepId]: { code, updatedAt: now.toISOString() } } });
}

/**
 * A lab step passed its tests. A step done with a hint goes in the review
 * queue, to be rewritten later without help. The last step completes the lab.
 */
export function recordLabStep(labId: string, step: number, usedHint: boolean, isLast: boolean, xp: number, minutes: number, now = new Date()) {
  const stepId = `${labId}#${step}`;
  const at = now.toISOString();
  const review = { ...state.review };
  const key = `lab:${stepId}`;
  if (usedHint) review[key] = nextReview(undefined, false, now);
  else if (review[key] && review[key].box < RETIRED) review[key] = nextReview(review[key], true, now);
  commit({
    ...state,
    completed: markDone(state.completed, isLast ? [stepId, labId] : [stepId], at),
    review,
    activity: [...state.activity, activity('lab', stepId, xp, minutes, now)],
  });
}

function setSettings(patch: Partial<Settings>) {
  commit({ ...state, settings: { ...state.settings, ...patch, goalUpdatedAt: new Date().toISOString() } });
}

export const setDailyGoal = (dailyGoal: DailyGoal) => setSettings({ dailyGoal });
export const setSound = (sound: boolean) => setSettings({ sound });

/** Test helper. */
export function replaceProgress(p: Progress) {
  commit(p);
}

// ---------------------------------------------------------------- derived ---

export interface StreakInfo {
  /** Active days in the current streak (frozen days keep it alive but do not add). */
  streak: number;
  /** Freezes banked for future missed days. */
  freezes: number;
  /** Missed days in the current streak covered by a freeze. */
  frozen: string[];
}

/** One freeze is earned for every seven active days in a streak, up to this many banked. */
export const MAX_FREEZES = 2;

/**
 * Walk the calendar from the first active day to today. A missed day uses a
 * banked freeze if there is one, otherwise the streak ends. Today never breaks
 * the streak: the day is not over yet.
 */
export function computeStreakInfo(days: Set<string>, today: string): StreakInfo {
  if (days.size === 0) return { streak: 0, freezes: 0, frozen: [] };
  const first = [...days].sort()[0];
  let streak = 0;
  let run = 0;
  let freezes = 0;
  let frozen: string[] = [];
  for (let d = first; d <= today; d = addDays(d, 1)) {
    if (days.has(d)) {
      streak++;
      run++;
      if (run % 7 === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
    } else if (d === today) {
      // Not over yet.
    } else if (streak > 0 && freezes > 0) {
      freezes--;
      frozen.push(d);
    } else {
      streak = 0;
      run = 0;
      freezes = 0;
      frozen = [];
    }
  }
  return { streak, freezes, frozen };
}

export const computeStreak = (days: Set<string>, today: string) => computeStreakInfo(days, today).streak;

export interface Stats {
  totalXp: number;
  todayXp: number;
  todayMinutes: number;
  streak: number;
  freezes: number;
  /** A freeze covered yesterday. */
  frozeYesterday: boolean;
  activeToday: boolean;
  goal: DailyGoal;
  goalMet: boolean;
}

export function computeStats(p: Progress, today = dayKey()): Stats {
  const days = new Set(p.activity.map((a) => a.day));
  const todays = p.activity.filter((a) => a.day === today);
  const todayMinutes = todays.reduce((s, a) => s + a.minutes, 0);
  const info = computeStreakInfo(days, today);
  return {
    totalXp: p.activity.reduce((s, a) => s + a.xp, 0),
    todayXp: todays.reduce((s, a) => s + a.xp, 0),
    todayMinutes,
    streak: info.streak,
    freezes: info.freezes,
    frozeYesterday: info.frozen.includes(addDays(today, -1)),
    activeToday: todays.length > 0,
    goal: p.settings.dailyGoal,
    goalMet: todayMinutes >= p.settings.dailyGoal,
  };
}

/** Minutes credited for a session: real time spent, within sensible bounds. */
export function creditedMinutes(ms: number, min = 3, max = 12): number {
  const mins = ms / 60000;
  return Math.round(Math.min(max, Math.max(min, mins)) * 10) / 10;
}

/** 10 XP for finishing, plus 2 for each exercise right first time. */
export function lessonXp(firstTryCorrect: number): number {
  return 10 + 2 * firstTryCorrect;
}

/** Reviews: 5 for showing up, plus 1 per item right first time. */
export function reviewXp(firstTryCorrect: number): number {
  return 5 + firstTryCorrect;
}
