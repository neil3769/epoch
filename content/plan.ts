/*
 * The learner's study plan, as dates and topics only (no personal details).
 * The home screen marks the AI Engineering unit for the current week.
 * Weeks run Monday to Sunday; the plan starts on 2 Nov 2026 and ends 9 May 2027.
 */

export interface PlanWeek {
  /** "1".."17", or "break", "jan", "feb" for the pauses. */
  id: string;
  label: string;
  /** First and last day, YYYY-MM-DD (inclusive). */
  start: string;
  end: string;
  focus: string;
}

export const PLAN: PlanWeek[] = [
  { id: '1', label: 'Week 1', start: '2026-11-02', end: '2026-11-08', focus: 'Repo setup, packaging, tests' },
  { id: '2', label: 'Week 2', start: '2026-11-09', end: '2026-11-15', focus: 'Async HTTPX LLM client' },
  { id: '3', label: 'Week 3', start: '2026-11-16', end: '2026-11-22', focus: 'An eval harness' },
  { id: '4', label: 'Week 4', start: '2026-11-23', end: '2026-11-29', focus: 'Compare setups, pick the flagship' },
  { id: '5', label: 'Week 5', start: '2026-11-30', end: '2026-12-06', focus: 'Flagship core loop (retrieval or tools)' },
  { id: '6', label: 'Week 6', start: '2026-12-07', end: '2026-12-13', focus: 'Golden set, one measured improvement' },
  { id: '7', label: 'Week 7', start: '2026-12-14', end: '2026-12-20', focus: 'Limits, injection tests, MCP' },
  { id: 'break', label: 'Break', start: '2026-12-21', end: '2027-01-06', focus: 'Off' },
  { id: 'jan', label: 'Exams (Jan)', start: '2027-01-07', end: '2027-02-01', focus: 'Paused: PyTorch loop refresh' },
  { id: 'feb', label: 'Exams (Feb)', start: '2027-02-02', end: '2027-02-28', focus: 'Paused: leakage and metrics' },
  { id: '8', label: 'Week 8', start: '2027-03-01', end: '2027-03-07', focus: 'FastAPI, Docker' },
  { id: '9', label: 'Week 9', start: '2027-03-08', end: '2027-03-14', focus: 'Tests, evals in CI' },
  { id: '10', label: 'Week 10', start: '2027-03-15', end: '2027-03-21', focus: 'CI/CD, deploy' },
  { id: '11', label: 'Week 11', start: '2027-03-22', end: '2027-03-28', focus: 'Tracing, dashboard' },
  { id: '12', label: 'Week 12', start: '2027-03-29', end: '2027-04-04', focus: 'Routing, caching' },
  { id: '13', label: 'Week 13', start: '2027-04-05', end: '2027-04-11', focus: 'Red-team, guardrails' },
  { id: '14', label: 'Week 14', start: '2027-04-12', end: '2027-04-18', focus: 'Design doc' },
  { id: '15', label: 'Week 15', start: '2027-04-19', end: '2027-04-25', focus: 'Demo video, blog post' },
  { id: '16', label: 'Week 16', start: '2027-04-26', end: '2027-05-02', focus: 'Mock interviews, polish' },
  { id: '17', label: 'Week 17', start: '2027-05-03', end: '2027-05-09', focus: 'Mock interviews, buffer' },
];

/** Plan weeks each AI Engineering unit supports (from the brief). */
export const UNIT_WEEKS: Record<string, string[]> = {
  E1: ['1'],
  E2: ['2'],
  E3: ['2'],
  E4: ['1', '4'],
  E5: ['3', '6', 'feb'],
  E6: ['5'],
  E7: ['5', '6', '7'],
  E8: ['8', '9', '10'],
  E9: ['11', '12'],
  E10: ['13'],
  E11: ['jan', 'feb', '14', '15', '16', '17'],
};

/** The plan week containing `day` (YYYY-MM-DD), if any. */
export const planWeekOn = (day: string): PlanWeek | undefined => PLAN.find((w) => w.start <= day && day <= w.end);

/** Units that match the plan week containing `day`. */
export function unitsThisWeek(day: string): string[] {
  const w = planWeekOn(day);
  if (!w) return [];
  return Object.entries(UNIT_WEEKS)
    .filter(([, weeks]) => weeks.includes(w.id))
    .map(([unit]) => unit);
}
