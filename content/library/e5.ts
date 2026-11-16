import type { LibraryPage } from '../schema';

/** Unit E5 summary page: unlocked in the Library when the unit is finished. */
export const e5Library: LibraryPage = {
  unit: 'E5',
  ideas: [
    {
      title: 'An eval is fixed inputs, expected answers and a scoring rule',
      text: 'Trying prompts by hand tells you how one run felt. An eval runs the same labelled items through the system and scores every output the same way, so two versions get numbers you can compare. Keep the raw outputs, so you can rescore without paying for the model again.',
    },
    {
      title: 'The labelled set is the ground truth',
      text: 'Each item is an input with an answer a person checked. Cover the common cases, both sides of every boundary (13, 14 and 15 days), and the inputs that broke before. Check the labels themselves: a typo in a label marks right answers wrong. Compare every score with a dumb baseline, such as always giving the most common label.',
    },
    {
      title: 'Pick the cheapest check that recognises a good output',
      text: 'Closed answers (a class, a number, a name): exact match after normalising, and accuracy. Several fields: score each field. Free text: a rubric of small checks, coded where they are literal ("mentions 14 days") and given to a judge model where they need judgement ("sounds polite").',
    },
    {
      title: 'Precision and recall when the target is rare',
      text: 'If 1 item in 10 matters, "never" scores 90% accuracy and catches nothing. Precision is the share of flags that were right; recall is the share of real cases caught. Push recall when misses are costly (fraud), precision when false alarms are (hiding real email as spam).',
    },
    {
      title: 'A judge is a model under test too',
      text: 'Ask for a fixed format (JSON with a 1 to 5 score), handle replies you cannot parse without changing the score silently, and measure agreement with your own labels on a sample. Watch for position bias (judge both orders) and a taste for long answers.',
    },
    {
      title: 'Golden set, before and after, and leakage',
      text: 'Freeze a golden set and version it; never edit it to make a change look good. Change one thing per run, compare item by item, and treat a one-item gain on 50 items as noise. Leakage is test items reaching the system first (in the prompt, the examples, or by choosing the version with the best test score): build on a dev set and report on the untouched golden set.',
    },
  ],
  rules: [
    'Same items, same labels, same scoring rule, or the scores are not comparable.',
    'Normalise before exact match: `s.strip().lower()`, and drop trailing punctuation.',
    'Precision = tp / (tp + fp). Recall = tp / (tp + fn).',
    'Unreadable judge replies are reported, never dropped or guessed.',
    'One change per run; look at what flipped, not just the total.',
    'Tune on a dev set; report once on the golden set.',
  ],
  example: {
    code: [
      'want = ["yes", "no", "no", "yes"]',
      'old = ["Yes", "no", "yes", "no"]',
      'new = ["yes", "No.", "no", "no"]',
      '',
      'def score(out):',
      '    pairs = zip(want, out)',
      '    hits = [w == o.lower().strip(".")',
      '            for w, o in pairs]',
      '    return sum(hits) / len(want)',
      '',
      'print(score(old), score(new))',
    ].join('\n'),
    output: '0.5 0.75',
    notes: [
      'Normalising makes "Yes" and "No." count as the labels they mean.',
      'old gets items 1 and 2; new gets items 1, 2 and 3. Both miss item 4.',
      'On 4 items, one extra right answer is not proof: look at item 3, and rerun on a bigger set.',
    ],
  },
  mistakes: [
    { mistake: 'Comparing scores from different sets.', fix: 'Only compare runs on the same items, labels and version.' },
    { mistake: 'Reporting accuracy on a rare-target task.', fix: 'Also report precision and recall, and the always-no baseline.' },
    { mistake: 'Trusting a judge model without checking it.', fix: 'Score a sample yourself and measure agreement first.' },
    { mistake: 'Deleting golden items the new version fails.', fix: 'Those are the items doing their job. Fix a wrong label only, and bump the version.' },
    { mistake: 'Picking few-shot examples from the test set.', fix: 'Take examples from a separate dev set, and check overlap in code.' },
  ],
  forReal:
    'What the app cannot give you: a real model\'s quirks and costs, and the slow work of labelling items yourself. In your plan, week 3 is the real build: about 50 labelled items and one command that scores any model or prompt into a results table (the first lab here, at full size). Week 6 adds a frozen golden set for the flagship and one improvement measured before and after. In February, write half a page on one of your own projects: where leakage could have crept in, and why the metric fit.',
};
