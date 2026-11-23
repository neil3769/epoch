import { describe, expect, it } from 'vitest';
import { walkthroughs } from '../content/walkthroughs/index';
import { FRAMEWORK, WalkthroughSchema } from '../content/schema';
import { blankOpensOn, walkNextStep, walkRoute, walksForTrack, walkStepsDone, walkUnlocked } from '../src/lib/curriculum';
import { emptyProgress, mergeProgress } from '../src/lib/progress';
import { catalog } from '../content/index';

const w = walkthroughs[0];

describe('design walkthroughs', () => {
  it('follow the seven-step framework', () => {
    for (const wt of walkthroughs) {
      expect(WalkthroughSchema.safeParse(wt).success).toBe(true);
      expect(wt.steps.map((s) => s.title)).toEqual([...FRAMEWORK]);
    }
  });
  it('unlock when the needed units are finished', () => {
    const p = emptyProgress();
    expect(walkUnlocked(w, p)).toBe(false);
    for (const id of w.needs) for (const l of catalog.find((c) => c.id === id)!.unit!.lessons) p.completed[l.id] = '2026-11-17T00:00:00Z';
    expect(walkUnlocked(w, p)).toBe(true);
  });
  it('open by either route when they have two, and list on the right tabs', () => {
    const both = walkthroughs.filter((x) => x.orNeeds);
    expect(both.length).toBeGreaterThan(0);
    for (const x of both) {
      const p = emptyProgress();
      expect(walkUnlocked(x, p)).toBe(false);
      for (const id of x.orNeeds!) for (const l of catalog.find((c) => c.id === id)!.unit!.lessons) p.completed[l.id] = '2026-11-17T00:00:00Z';
      expect(walkUnlocked(x, p)).toBe(true);
      expect(walkRoute(x, 'engineering')).toEqual(x.orNeeds);
      expect(walkRoute(x, 'system-design')).toEqual(x.needs);
    }
    expect(walksForTrack('engineering').every((x) => x.tracks?.includes('engineering'))).toBe(true);
    expect(walksForTrack('system-design')).toContain(w);
    expect(walksForTrack('engineering')).not.toContain(w);
  });
  it('resume at the first unfinished step, merged across devices', () => {
    const a = emptyProgress();
    const b = emptyProgress();
    a.completed[`${w.id}#1`] = '2026-11-17T08:00:00Z';
    b.completed[`${w.id}#2`] = '2026-11-17T09:00:00Z';
    expect(walkNextStep(w, a)).toBe(1);
    const m = mergeProgress(a, b);
    expect(walkStepsDone(w, m)).toBe(2);
    expect(walkNextStep(w, m)).toBe(2);
  });
  it('open the blank-page pass a week after finishing', () => {
    const p = emptyProgress();
    expect(blankOpensOn(w, p)).toBeNull();
    p.completed[w.id] = new Date(2026, 10, 17, 12).toISOString();
    expect(blankOpensOn(w, p)).toBe('2026-11-24');
  });
});
