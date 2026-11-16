import { e5Labs } from '../labs/e5';
import { e5Library } from '../library/e5';
import type { Unit } from '../schema';

/*
 * E5 Evaluation. Plan weeks 3 (eval harness), 6 (golden set, one measured
 * improvement) and February (leakage and metric choice). Everything here is
 * plain Python, so it all runs in Pyodide; judgement questions are listed in
 * reports/hand-verification.md.
 */
export const e5: Unit = {
  id: 'E5',
  track: 'engineering',
  title: 'Evaluation',
  blurb: 'Turn "it seems better" into a number: labelled sets, the right metric, judges, golden sets, before and after, and leakage.',
  prelude: 'import json',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'e5-01',
      title: 'Vibes are not a measurement',
      summary: 'An eval fixes the inputs, the expected answers and a scoring rule, so runs can be compared.',
      card: {
        title: 'Vibes are not a measurement',
        text: 'Trying a few prompts by hand tells you how the model felt today, not whether a change helped. An eval fixes three things: the inputs, the expected answers, and a rule that scores each output. Run it the same way every time and you get a number you can compare.',
        code: `want = ["4", "9", "12"]
got = ["4", "6", "12"]
right = 0
for w, g in zip(want, got):
    right += w == g
print(right, "of", len(want))`,
        output: '2 of 3',
      },
      exercises: [
        {
          id: 'e5-1-1',
          type: 'predict-output',
          prompt: 'What does this eval print?',
          code: `want = ["cat", "dog", "cat", "bird"]
got = ["cat", "cat", "cat", "bird"]
right = 0
for w, g in zip(want, got):
    right += w == g
print(right, "of", len(want))`,
          answer: '3 of 4',
          options: [
            { text: '3 of 4' },
            { text: '2 of 4', why: 'Compare pair by pair: cat=cat, dog≠cat, cat=cat, bird=bird. Three match.' },
            { text: '4 of 4', why: 'The second item wanted "dog" but got "cat", so it does not count.' },
          ],
          explain: '`w == g` is True (1) or False (0), so adding it counts the matches.',
        },
        {
          id: 'e5-1-2',
          type: 'mcq',
          prompt: 'You tried a new prompt on three questions and it "felt better". What do you need before you can say it is better?',
          options: [
            { text: 'The same inputs and expected answers, scored the same way' },
            { text: 'More tries by hand until the difference is clear', why: 'More tries by hand are still different inputs judged by feel each time, so two runs are not comparable.' },
            { text: 'A bigger model asked which prompt is better', why: 'A bigger model is another opinion, not a measurement. Without fixed inputs and expected answers there is nothing to score against.' },
          ],
          answer: 0,
          explain: 'The same inputs, the same expected answers, the same scoring rule: then two numbers mean something side by side.',
        },
        {
          id: 'e5-1-3',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `want = ["a", "b", "c", "d"]
got = ["a", "x", "c", "d"]
right = 0
for w, g in zip(want, got):
    right += w == g
print(right / len(want))`,
          answer: '0.75',
          typedWrong: [{ answer: '3', why: 'That is the count of matches. Dividing by the 4 items gives the share: 0.75.' }],
          explain: 'Three of four match, and 3 / 4 is 0.75: the accuracy.',
        },
        {
          id: 'e5-1-4',
          type: 'fill-blank',
          prompt: 'Complete the scoring loop.',
          code: `want = ["yes", "no", "yes"]
got = ["yes", "yes", "yes"]
right = 0
for w, g in ___(want, got):
    right += w ___ g
print(right)`,
          answer: ['zip', '=='],
          distractors: [
            { text: 'enumerate', why: '`enumerate(want, got)` does not pair the two lists: it numbers one list and treats `got` as the start number.' },
            { text: '!=', why: '`!=` counts the mismatches, not the matches.' },
            { text: '=', why: '`=` assigns; it cannot compare inside an expression. Comparing is `==`.' },
          ],
          expectOutput: '2',
          explain: '`zip` walks the two lists side by side; `==` gives True for each match.',
        },
        {
          id: 'e5-1-5',
          type: 'spot-bug',
          prompt: 'This eval crashes. Which line is the real problem?',
          code: `want = ["a", "b", "c"]
got = ["a", "b"]
right = 0
for i in range(len(want)):
    right += want[i] == got[i]
print(right)`,
          error: 'IndexError: list index out of range',
          answer: 1,
          raiseLine: 4,
          lineWhy: {
            '0': 'Three expected answers is fine: one per item.',
            '2': 'Starting the count at 0 is right.',
            '3': 'Looping over every item is what an eval should do.',
            '4': 'Python points here, but the comparison is right. It fails because there is no third output to compare.',
            '5': 'Printing is never reached.',
          },
          explain: 'Every item needs an output. One is missing, so the model run is broken (or a failed call was dropped): fix the run, do not skip the item.',
        },
        {
          id: 'e5-1-6',
          type: 'predict-output',
          prompt: 'Two prompts, same items. What does this print?',
          code: `want = ["4", "9", "16"]
p1 = ["4", "9", "15"]
p2 = ["4", "8", "15"]

def score(out):
    n = 0
    for w, o in zip(want, out):
        n += w == o
    return n

print(score(p1), score(p2))`,
          answer: '2 1',
          options: [
            { text: '2 1' },
            { text: '1 2', why: 'p1 matches "4" and "9"; p2 only matches "4". The first number is p1.' },
            { text: '2 2', why: 'p2 has "8" where "9" was wanted, so it gets only one right.' },
          ],
          explain: 'Same items, same rule: now the two prompts can be compared.',
        },
        {
          id: 'e5-1-7',
          type: 'mcq',
          prompt: 'Prompt A scored 41/50 and prompt B 43/50 on the same set. Prompt C scored 45/50 on a different set. Which comparison is fair?',
          options: [
            { text: 'A against B' },
            { text: 'B against C', why: 'C was scored on different items, which may simply be easier. Its 45 says nothing about B.' },
            { text: 'All three: they are all out of 50', why: 'The same total does not make the same test. Only A and B saw the same items.' },
          ],
          answer: 0,
          explain: 'Scores are comparable only on the same inputs and the same scoring rule.',
        },
        {
          id: 'e5-1-8',
          type: 'run-code',
          prompt: 'Set `acc` to the share of answers that are right.',
          before: `want = ["a", "b", "b", "a"]
got = ["a", "b", "a", "a"]
pairs = zip(want, got)
right = sum(w == g for w, g in pairs)`,
          solution: 'acc = right / len(want)',
          tests: 'assert acc == 0.75, f"3 of 4 are right, so acc should be 0.75, got {acc}"',
          placeholder: 'acc = ...',
          explain: 'Accuracy is right answers divided by all items.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'e5-02',
      title: 'A labelled set',
      summary: 'A labelled set pairs each input with an answer a person checked, covering common, edge and hard cases.',
      card: {
        title: 'A labelled set',
        text: 'A labelled set is a list of inputs, each with the answer a person checked by hand. Cover the common cases, the edge cases, and the ones that broke before. Fifty careful items beat five hundred sloppy ones.',
        code: `evalset = [
    ("Refund after 10 days?", "yes"),
    ("Refund after 20 days?", "no"),
]
print(len(evalset), "items")`,
        output: '2 items',
      },
      exercises: [
        {
          id: 'e5-2-1',
          type: 'predict-output',
          prompt: 'How many of each label? What does this print?',
          code: `labels = ["yes", "no", "yes", "yes"]
yes = labels.count("yes")
print(yes, len(labels) - yes)`,
          answer: '3 1',
          options: [
            { text: '3 1' },
            { text: '1 3', why: 'The first number is the count of "yes", which appears three times.' },
            { text: '3 4', why: 'The second number is the total minus the yeses: 4 - 3 = 1.' },
          ],
          explain: 'Counting labels is the first check on any set: is it balanced?',
        },
        {
          id: 'e5-2-2',
          type: 'mcq',
          prompt: 'Refunds are allowed within 14 days. Which four items test a refund bot best?',
          options: [
            { text: '3, 14 and 15 days, plus one with no day count' },
            { text: '2, 3, 4 and 5 days: all common cases', why: 'All four are easy "yes" cases. Nothing checks the boundary or a question the rule does not answer directly.' },
            { text: '100, 200, 300 and 400 days: all clear cases', why: 'All clear "no" cases. The interesting answers are near 14 days and when the day count is missing.' },
          ],
          answer: 0,
          explain: 'A common case, both sides of the boundary, and an awkward real question: that is where bots go wrong.',
        },
        {
          id: 'e5-2-3',
          type: 'predict-output',
          prompt: 'This finds labels that are not "yes" or "no". What does it print?',
          code: `allowed = {"yes", "no"}
labels = ["yes", "No", "no", "yes "]
bad = [l for l in labels
       if l not in allowed]
print(bad)`,
          answer: "['No', 'yes ']",
          options: [
            { text: "['No', 'yes ']" },
            { text: '[]', why: '"No" has a capital N and "yes " has a trailing space, so neither is in the set.' },
            { text: "['No']", why: '"yes " with a space at the end is a different string from "yes".' },
          ],
          explain: 'Typos in labels silently mark right answers wrong. Check labels before you trust a score.',
        },
        {
          id: 'e5-2-4',
          type: 'fill-blank',
          prompt: 'What share of the labels is "no"?',
          code: `labels = ["yes"] * 45 + ["no"] * 5
share = labels.___("no") / ___(labels)
print(share)`,
          answer: ['count', 'len'],
          distractors: [
            { text: 'index', why: '`index("no")` is the position of the first "no" (45), not how many there are.' },
            { text: 'sum', why: '`sum` adds numbers; these are strings, so it raises a TypeError.' },
          ],
          expectOutput: '0.1',
          explain: 'Only 10% of items are "no". Keep that in mind for the next exercise.',
        },
        {
          id: 'e5-2-5',
          type: 'predict-output',
          prompt: 'A lazy "model" answers "yes" to everything. What accuracy does it get on this set?',
          code: `labels = ["yes"] * 45 + ["no"] * 5
preds = ["yes"] * 50
same = [p == l for p, l
        in zip(preds, labels)]
print(sum(same) / len(labels))`,
          answer: '0.9',
          options: [
            { text: '0.9' },
            { text: '0.5', why: 'It is right on every "yes" item, and 45 of the 50 are "yes".' },
            { text: '0.1', why: 'That is the share it gets wrong: the 5 "no" items.' },
          ],
          explain: 'A model that never says "no" scores 90% here. Always compare with a dumb baseline like this.',
        },
        {
          id: 'e5-2-6',
          type: 'mcq',
          prompt: 'Where should the labels in your set come from?',
          options: [
            { text: 'A person who checked each one' },
            { text: "The model's own answers", why: 'Then the eval measures whether the model agrees with itself, which it always does.' },
            { text: 'Whatever the old prompt answered', why: 'That copies the old prompt\'s mistakes into the answer key, so fixing them would look like getting worse.' },
          ],
          answer: 0,
          explain: 'Labels are the ground truth. If they are wrong, every score built on them is wrong.',
        },
        {
          id: 'e5-2-7',
          type: 'order-lines',
          prompt: 'Order the lines so the eval prints 1.',
          lines: [
            { text: 'cases = [("hi", "HI"), ("ok", "Ok")]', fixed: true },
            { text: 'right = 0' },
            { text: 'for q, want in cases:' },
            { text: '    got = q.upper()' },
            { text: '    right += got == want' },
            { text: 'print(right)' },
          ],
          expectOutput: '1',
          explain: 'Start the count, loop over items, get an output, score it, report. "OK" is not "Ok", so only one item is right.',
        },
        {
          id: 'e5-2-8',
          type: 'run-code',
          prompt: 'Add the edge case: exactly 14 days, which is still a "yes".',
          before: `evalset = [(3, "yes"), (20, "no")]`,
          solution: 'evalset.append((14, "yes"))',
          tests: [
            'assert (14, "yes") in evalset, "add the item (14, \\"yes\\")"',
            'assert len(evalset) == 3, f"the set should have 3 items, it has {len(evalset)}"',
          ].join('\n'),
          placeholder: 'evalset.append(...)',
          explain: 'The boundary is where the bot is most likely to be wrong, so it belongs in the set.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'e5-03',
      title: 'Exact match',
      summary: 'Exact match compares output and label after normalising both, and suits short closed answers.',
      card: {
        title: 'Exact match',
        text: 'Exact match counts an output right only if it equals the label character for character. Normalise both sides first, so " Yes." and "yes" are not marked wrong for spacing or case. It suits short, closed answers: a class, a number, a name.',
        code: `def norm(s):
    s = s.strip().lower()
    return s.rstrip(".")

print(norm(" Yes.") == "yes")`,
        output: 'True',
      },
      exercises: [
        {
          id: 'e5-3-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `print("Yes" == "yes")`,
          answer: 'False',
          options: [
            { text: 'False' },
            { text: 'True', why: 'String comparison is exact: capital Y and small y are different characters.' },
          ],
          explain: 'Without normalising, a right answer with different case scores as wrong.',
        },
        {
          id: 'e5-3-2',
          type: 'predict-output',
          prompt: 'Type what this prints.',
          code: `print(" Paris \\n".strip())`,
          answer: 'Paris',
          explain: '`strip()` removes spaces and newlines from both ends, which models often add.',
        },
        {
          id: 'e5-3-3',
          type: 'predict-output',
          prompt: 'Scored raw, and scored after normalising. What does this print?',
          code: `want = ["paris", "rome"]
got = ["Paris", " rome"]
raw = 0
fixed = 0
for w, g in zip(want, got):
    raw += w == g
    fixed += w == g.strip().lower()
print(raw, fixed)`,
          answer: '0 2',
          options: [
            { text: '0 2' },
            { text: '2 2', why: 'Raw comparison fails both: "Paris" has a capital and " rome" a leading space.' },
            { text: '1 2', why: 'Neither raw output equals its label exactly, so raw is 0.' },
          ],
          explain: 'Both answers were right; only normalising shows it.',
        },
        {
          id: 'e5-3-4',
          type: 'mcq',
          prompt: 'Which task suits exact match?',
          options: [
            { text: 'Sorting tickets into billing, bug or other' },
            { text: 'Summarising an article in two sentences', why: 'Many different summaries are good. Exact match would mark almost all of them wrong.' },
            { text: 'Writing a polite reply to a customer', why: 'There is no single right wording, so character-by-character comparison does not fit.' },
          ],
          answer: 0,
          explain: 'A fixed list of possible answers means a right answer can be checked exactly.',
        },
        {
          id: 'e5-3-5',
          type: 'fill-blank',
          prompt: 'Make norm lower-case the text.',
          code: `def norm(s):
    return s.strip().___()

print(norm("  Rome "))`,
          answer: ['lower'],
          distractors: [
            { text: 'upper', why: '`upper()` gives "ROME". Labels are usually stored lower-case, so lower both sides.' },
            { text: 'title', why: '`title()` gives "Rome", which keeps a capital.' },
            { text: 'split', why: '`split()` returns a list of words, not a cleaned-up string.' },
          ],
          expectOutput: 'rome',
          explain: 'Strip, then lower: the usual first two steps of normalising.',
        },
        {
          id: 'e5-3-6',
          type: 'spot-bug',
          prompt: 'One model call failed and returned None. Which line should change so it scores as wrong instead of crashing?',
          code: `outputs = ["yes", None, "no"]
for o in outputs:
    print(o.strip())`,
          error: "AttributeError: 'NoneType' object has no attribute 'strip'",
          answer: 2,
          lineWhy: {
            '0': 'The None is real: a call that failed. The eval must cope with it, not hide it.',
            '1': 'Looping over every output is right.',
          },
          explain: 'Use `(o or "").strip()`: a failed call becomes an empty answer, which scores as wrong and stays visible.',
        },
        {
          id: 'e5-3-7',
          type: 'predict-output',
          prompt: 'Numbers as text. What does this print?',
          code: `a, b = "3.0", "3"
print(a == b, float(a) == float(b))`,
          answer: 'False True',
          options: [
            { text: 'False True' },
            { text: 'True True', why: '"3.0" and "3" are different strings. Only converted to numbers are they equal.' },
            { text: 'False False', why: 'As floats both are 3.0, so the second comparison is True.' },
          ],
          explain: 'For numeric answers, compare numbers, not text.',
        },
        {
          id: 'e5-3-8',
          type: 'run-code',
          prompt: 'Finish `norm`: strip spaces, lower-case, and drop a final full stop.',
          before: 'def norm(s):',
          solution: '    s = s.strip().lower()\n    return s.rstrip(".")',
          tests: [
            `assert norm(" Yes.") == "yes", "norm(' Yes.') should be 'yes'"`,
            `assert norm("NO") == "no", "norm('NO') should be 'no'"`,
            `assert norm("rome") == "rome", "norm('rome') should stay 'rome'"`,
          ].join('\n'),
          maxLines: 2,
          placeholder: '    s = ...\n    return ...',
          explain: 'Indent both lines by four spaces: they are the body of `norm`.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'e5-04',
      title: 'Pick the metric',
      summary: 'The metric must match what success means for the task: accuracy, per-field match, or a graded score.',
      card: {
        title: 'Pick the metric',
        text: 'A metric turns "was this output good?" into a number, and the right question depends on the task. Labels from a fixed list: accuracy. Fields pulled out of text: check each field; free text: a graded score or a judge.',
        code: `metric = {
    "pick a label": "accuracy",
    "extract fields": "field match",
    "free text": "graded or judge",
}
print(metric["extract fields"])`,
        output: 'field match',
      },
      exercises: [
        {
          id: 'e5-4-1',
          type: 'mcq',
          prompt: 'The model sorts emails into four folders. Which metric fits?',
          options: [
            { text: 'Accuracy: share in the right folder' },
            { text: 'A judge model scoring each from 1 to 5', why: 'Each email has one right folder, so a simple exact check is cheaper and more reliable than a judge.' },
            { text: 'Average confidence the model reports', why: "The model's confidence says how sure it is, not whether the folder was right." },
          ],
          answer: 0,
          explain: 'A fixed list of answers means exact match, and the share right is accuracy.',
        },
        {
          id: 'e5-4-2',
          type: 'mcq',
          prompt: 'The model pulls name, date and amount out of invoices. Why score each field instead of the whole output?',
          options: [
            { text: 'One wrong field would fail the whole invoice' },
            { text: 'Whole-output scoring is much slower to run', why: 'Speed is not the point. Comparing two dicts is fast; the problem is what the score tells you.' },
            { text: 'Whole outputs cannot be compared exactly', why: 'They can: parse the output into a dict and compare. The problem is what one all-or-nothing score hides.' },
          ],
          answer: 0,
          explain: 'Per-field scores show partial success and point at the field to fix.',
        },
        {
          id: 'e5-4-3',
          type: 'predict-output',
          prompt: 'Per-field match. What does this print?',
          code: `want = {"name": "Ada", "total": 40}
got = {"name": "Ada", "total": 4}
ok = [k for k in want
      if got.get(k) == want[k]]
print(len(ok), "of", len(want))`,
          answer: '1 of 2',
          options: [
            { text: '1 of 2' },
            { text: '0 of 2', why: 'The name matches; only the total (4 instead of 40) is wrong.' },
            { text: '2 of 2', why: '4 is not 40, so the total field does not match.' },
          ],
          explain: 'Half right, and you know which half: the total.',
        },
        {
          id: 'e5-4-4',
          type: 'predict-output',
          prompt: 'Same fields, different order. What does this print?',
          code: `want = {"a": 1, "b": 2}
got = {"b": 2, "a": 1}
print(got == want)`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'Dicts compare by keys and values, not by the order they were written in.' },
          ],
          explain: 'Parse structured output into a dict before comparing, rather than comparing the raw JSON text.',
        },
        {
          id: 'e5-4-5',
          type: 'mcq',
          prompt: 'The model summarises a support ticket in one sentence. Which metric fits?',
          options: [
            { text: 'A rubric or judge: facts present, none invented' },
            { text: 'Exact match with one reference summary', why: 'A good summary can be worded many ways, so exact match would mark good ones wrong.' },
            { text: 'Accuracy over a list of allowed summaries', why: 'There is no fixed list of right summaries to pick from.' },
          ],
          answer: 0,
          explain: 'Free text needs checks on what matters in it, not on its exact wording.',
        },
        {
          id: 'e5-4-6',
          type: 'match-pairs',
          prompt: 'Match each task to the metric that fits.',
          pairs: [
            { left: 'Is this review positive or negative?', right: 'accuracy', why: 'Two fixed labels: exact match, share right.' },
            { left: 'Pull the date and amount from a receipt', right: 'per-field match', why: 'Several closed fields: score each one.' },
            { left: 'Explain a refund policy to a customer', right: 'rubric or judge', why: 'Free text: check it covers the facts and stays polite.' },
          ],
          explain: 'Ask what a good output looks like, then pick the cheapest check that can recognise it.',
        },
        {
          id: 'e5-4-7',
          type: 'fill-blank',
          prompt: 'Score the share of fields that match.',
          code: `want = {"city": "Rome",
        "year": 2024, "eu": True}
got = {"city": "Rome",
       "year": 2023, "eu": True}
hits = sum(got[k] ___ want[k]
           for k in want)
print(hits / ___(want))`,
          answer: ['==', 'len'],
          distractors: [
            { text: '!=', why: '`!=` counts the fields that differ, giving the error rate instead.' },
            { text: 'sum', why: '`sum(want)` tries to add the keys, which are strings, and raises a TypeError.' },
          ],
          expectOutput: '0.6666666666666666',
          explain: 'Two of three fields match: city and eu. The year is off by one.',
        },
        {
          id: 'e5-4-8',
          type: 'run-code',
          prompt: 'Count the fields that match into `right`.',
          before: `want = {"name": "Ada", "age": 36}
got = {"name": "Ada", "age": 63}
right = 0`,
          solution: 'for k in want:\n    right += got[k] == want[k]',
          tests: 'assert right == 1, f"only the name matches, so right should be 1, got {right}"',
          maxLines: 2,
          placeholder: 'for k in want:\n    right += ...',
          explain: 'Loop over the expected keys and add one for each field that matches.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'e5-05',
      title: 'Precision and recall',
      summary: 'Precision: of the items flagged, how many were right. Recall: of the items to flag, how many were caught.',
      card: {
        title: 'Precision and recall',
        text: 'When the thing you care about is rare, accuracy hides failure. Precision asks: of the items flagged, how many were right? Recall asks: of the items that should be flagged, how many were caught?',
        code: `tp, fp, fn = 8, 2, 4
print(tp / (tp + fp))  # precision
print(tp / (tp + fn))  # recall`,
        output: '0.8\n0.6666666666666666',
      },
      exercises: [
        {
          id: 'e5-5-1',
          type: 'predict-output',
          prompt: 'A flagger found 9 real cases and raised 1 false alarm. What is its precision?',
          code: `tp, fp = 9, 1
print(tp / (tp + fp))`,
          answer: '0.9',
          options: [
            { text: '0.9' },
            { text: '0.1', why: 'That is the share of flags that were false alarms. Precision is the share that were right.' },
            { text: '9.0', why: 'Precision divides by all flags raised (9 + 1), so it is between 0 and 1.' },
          ],
          explain: 'Of 10 flags, 9 were right.',
        },
        {
          id: 'e5-5-2',
          type: 'predict-output',
          prompt: 'There were 4 real cases and it caught 3. Type its recall.',
          code: `tp, fn = 3, 1
print(tp / (tp + fn))`,
          answer: '0.75',
          typedWrong: [{ answer: '3', why: 'That is the number caught. Recall divides it by all real cases: 3 / 4.' }],
          explain: 'Recall: caught (3) out of all that should have been caught (4).',
        },
        {
          id: 'e5-5-3',
          type: 'predict-output',
          prompt: 'Count true positives, false positives and false negatives. What does this print?',
          code: `want = [1, 0, 1, 1, 0]
pred = [1, 1, 0, 1, 0]
tp = fp = fn = 0
for w, p in zip(want, pred):
    tp += w == 1 and p == 1
    fp += w == 0 and p == 1
    fn += w == 1 and p == 0
print(tp, fp, fn)`,
          answer: '2 1 1',
          options: [
            { text: '2 1 1' },
            { text: '3 1 0', why: 'Item 3 should be 1 but was predicted 0: that is a miss (a false negative), so only 2 are true positives.' },
            { text: '2 0 1', why: 'Item 2 was predicted 1 but should be 0: one false positive.' },
          ],
          explain: 'Hits at positions 1 and 4, a false alarm at 2, a miss at 3.',
        },
        {
          id: 'e5-5-4',
          type: 'mcq',
          prompt: 'A fraud flagger: missing fraud is expensive, while a false alarm costs a quick human check. Which number matters most?',
          options: [
            { text: 'Recall' },
            { text: 'Precision', why: 'Precision punishes false alarms, which are cheap here. Missed fraud is what costs money.' },
            { text: 'Accuracy', why: 'Fraud is rare, so "never fraud" already scores very high accuracy while catching nothing.' },
          ],
          answer: 0,
          explain: 'When misses are costly, push recall up and accept some false alarms.',
        },
        {
          id: 'e5-5-5',
          type: 'mcq',
          prompt: 'A filter moves mail it thinks is spam out of the inbox, and a real email hidden in spam is costly. Which number matters most?',
          options: [
            { text: 'Precision' },
            { text: 'Recall', why: 'Recall rewards catching more spam, even at the cost of hiding real mail, which is the expensive mistake here.' },
            { text: 'Neither: use the length of the email', why: 'Length is not a measure of whether the filter was right.' },
          ],
          answer: 0,
          explain: 'When false alarms are costly, everything it flags should really be spam: precision.',
        },
        {
          id: 'e5-5-6',
          type: 'predict-output',
          prompt: '1 item in 10 is a real case. A model always answers 0. What is its accuracy?',
          code: `want = [0] * 9 + [1]
pred = [0] * 10
same = [w == p for w, p
        in zip(want, pred)]
print(sum(same) / len(want))`,
          answer: '0.9',
          options: [
            { text: '0.9' },
            { text: '0.0', why: 'It is right on the nine 0 items. What it gets wrong is the one real case.' },
            { text: '0.1', why: 'That is the share it gets wrong.' },
          ],
          explain: 'High accuracy, and it never catches anything. Now check its recall.',
        },
        {
          id: 'e5-5-7',
          type: 'predict-output',
          prompt: 'The same model: it caught 0 of the 1 real case. Type its recall.',
          code: `tp, fn = 0, 1
print(tp / (tp + fn))`,
          answer: '0.0',
          typedWrong: [{ answer: '0', why: 'Dividing in Python gives a float, so it prints 0.0.' }],
          explain: 'Recall 0.0 tells the truth that 90% accuracy hid.',
        },
        {
          id: 'e5-5-8',
          type: 'spot-bug',
          prompt: 'This crashes when the model flags nothing. Which line?',
          code: `tp, fp, fn = 0, 0, 3
recall = tp / (tp + fn)
precision = tp / (tp + fp)
print(precision, recall)`,
          error: 'ZeroDivisionError: division by zero',
          answer: 2,
          lineWhy: {
            '0': 'Flagging nothing is a real result: no hits, no false alarms, three misses.',
            '1': 'Recall divides by 3 here, which is fine.',
            '3': 'Never reached.',
          },
          explain: 'With no flags, tp + fp is 0. Guard it: `precision = tp / (tp + fp) if tp + fp else 0.0`.',
        },
        {
          id: 'e5-5-9',
          type: 'run-code',
          prompt: 'Set `recall`.',
          before: 'tp, fp, fn = 6, 2, 3',
          solution: 'recall = tp / (tp + fn)',
          tests: 'assert abs(recall - 6 / 9) < 1e-9, f"recall is caught / all real cases = 6 / 9, got {recall}"',
          placeholder: 'recall = ...',
          explain: 'Recall uses the misses (fn); precision would use the false alarms (fp).',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'e5-06',
      title: 'Graded scoring',
      summary: 'A rubric of small checks gives free text partial credit, and simple checks can be coded.',
      card: {
        title: 'Graded scoring',
        text: 'Free-text answers are rarely all right or all wrong. Write a rubric of small checks and score the share that pass. Checks you can code, such as "mentions 14 days" or "under 100 characters", are cheap and give the same answer every run.',
        code: `reply = "Refunds within 14 days."
checks = [
    "14 days" in reply,
    len(reply) < 100,
    "sorry" not in reply.lower(),
]
print(sum(checks), "/", len(checks))`,
        output: '3 / 3',
      },
      exercises: [
        {
          id: 'e5-6-1',
          type: 'predict-output',
          prompt: 'What does this rubric print?',
          code: `reply = "Sorry, refunds take 2 weeks."
checks = [
    "14 days" in reply,
    len(reply) < 100,
    "sorry" not in reply.lower(),
]
print(sum(checks), "/", len(checks))`,
          answer: '1 / 3',
          options: [
            { text: '1 / 3' },
            { text: '2 / 3', why: '"2 weeks" is not the text "14 days", and the reply does say sorry. Only the length check passes.' },
            { text: '0 / 3', why: 'The reply is short, so the length check passes.' },
          ],
          explain: 'Coded checks are literal: "2 weeks" means the same, but does not pass "14 days". Word checks carefully.',
        },
        {
          id: 'e5-6-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `checks = [True, False, True]
print(sum(checks) / len(checks))`,
          answer: '0.6666666666666666',
          options: [
            { text: '0.6666666666666666' },
            { text: '2', why: 'That is how many passed. Dividing by the 3 checks gives the share.' },
            { text: '0.3333333333333333', why: 'That is the share that failed. Two of three passed.' },
          ],
          explain: 'True counts as 1, so the sum is the number passed.',
        },
        {
          id: 'e5-6-3',
          type: 'fill-blank',
          prompt: 'Check that the reply mentions cancelling.',
          code: `reply = "You can cancel any time."
ok = "cancel" ___ reply
print(ok)`,
          answer: ['in'],
          distractors: [
            { text: '==', why: '`==` asks if the whole reply is exactly "cancel", which it is not.' },
            { text: 'is', why: '`is` checks for the very same object, not whether text appears inside.' },
          ],
          expectOutput: 'True',
          explain: '`"cancel" in reply` checks whether the word appears anywhere in the text.',
        },
        {
          id: 'e5-6-4',
          type: 'mcq',
          prompt: 'Which rubric check can you write as plain code?',
          options: [
            { text: 'Mentions the 14-day limit' },
            { text: 'Sounds friendly', why: 'Friendliness is a judgement call. Code cannot reliably check tone; that needs a person or a judge model.' },
            { text: 'Answers the question the customer meant', why: 'Knowing what the customer meant needs understanding, not a text check.' },
          ],
          answer: 0,
          explain: 'Code the literal checks; leave judgement calls to a judge model or a person.',
        },
        {
          id: 'e5-6-5',
          type: 'predict-output',
          prompt: 'A numeric answer, checked with a tolerance. What does this print?',
          code: `want = 3.14
got = 3.1416
print(abs(got - want) < 0.01)`,
          answer: 'True',
          options: [
            { text: 'True' },
            { text: 'False', why: 'The difference is 0.0016, which is under the 0.01 tolerance.' },
          ],
          explain: 'For numbers, "close enough" is usually the right check.',
        },
        {
          id: 'e5-6-6',
          type: 'predict-output',
          prompt: 'The fact is worth 2 points, being under 10 characters 1. Type what this prints.',
          code: `reply = "Refunds take 14 days."
score = 0
if "14" in reply:
    score += 2
if len(reply) < 10:
    score += 1
print(score)`,
          answer: '2',
          typedWrong: [{ answer: '3', why: 'The reply is 21 characters long, so the length check (under 10) fails and adds nothing.' }],
          explain: 'Each check adds its own points. The reply has the fact (2 points) but is longer than 10 characters.',
        },
        {
          id: 'e5-6-7',
          type: 'predict-output',
          prompt: 'Weighted rubric. What does this print?',
          code: `pts = {"fact": 2, "short": 1,
       "tone": 1}
passed = ["fact", "tone"]
got = sum(pts[p] for p in passed)
print(got / sum(pts.values()))`,
          answer: '0.75',
          options: [
            { text: '0.75' },
            { text: '0.6666666666666666', why: 'That counts checks (2 of 3). With weights it is points: 3 of 4.' },
            { text: '3', why: 'That is the points earned. Dividing by the 4 available gives 0.75.' },
          ],
          explain: 'Weights let the important check (the fact) count for more.',
        },
        {
          id: 'e5-6-8',
          type: 'run-code',
          prompt: 'Set `ok` to True if `reply` mentions "14 days" and is under 80 characters.',
          before: 'reply = "Refund within 14 days."',
          solution: 'short = len(reply) < 80\nok = "14 days" in reply and short',
          tests: 'assert ok is True, f"the reply mentions 14 days and is short, so ok should be True, got {ok!r}"',
          maxLines: 2,
          placeholder: 'ok = ...',
          explain: 'Two literal checks joined with `and`.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'e5-07',
      title: 'A model as judge',
      summary: 'A judge model grades free text against a rubric in a fixed format, and is itself checked against human labels.',
      card: {
        title: 'A model as judge',
        text: 'When checks in code cannot tell good from bad, ask a model to grade each output against a short rubric. Make it reply in a fixed format, such as JSON with a score from 1 to 5, so code can read it. Then check the judge: score some items yourself and see how often it agrees.',
        code: `reply = '{"score": 4, "why": "clear"}'
grade = json.loads(reply)
print(grade["score"])`,
        output: '4',
      },
      exercises: [
        {
          id: 'e5-7-1',
          type: 'predict-output',
          prompt: 'Three judge replies. What does this print?',
          code: `replies = ['{"score": 4}',
           '{"score": 2}',
           '{"score": 3}']
scores = [json.loads(r)["score"]
          for r in replies]
print(sum(scores) / len(scores))`,
          answer: '3.0',
          options: [
            { text: '3.0' },
            { text: '9', why: 'That is the sum. Dividing by the 3 replies gives the mean.' },
            { text: '3', why: 'Division with `/` always gives a float in Python, so it prints 3.0.' },
          ],
          explain: '`json.loads` turns each reply into a dict, so the score is a real number to average.',
        },
        {
          id: 'e5-7-2',
          type: 'predict-output',
          prompt: 'The judge added words around its JSON. What does this print?',
          code: `reply = 'Score: {"score": 5}'
try:
    print(json.loads(reply)["score"])
except json.JSONDecodeError:
    print("unreadable")`,
          answer: 'unreadable',
          options: [
            { text: 'unreadable' },
            { text: '5', why: '`json.loads` needs the whole string to be JSON. "Score: " in front makes it fail.' },
            { text: 'Score: 5', why: 'Nothing here prints the raw text; parsing fails, so the except branch runs.' },
          ],
          explain: 'Judges do not always follow the format. Ask for JSON only, and handle replies you cannot read.',
        },
        {
          id: 'e5-7-3',
          type: 'mcq',
          prompt: 'Some judge replies cannot be parsed. What should the eval do with them?',
          options: [
            { text: 'Retry or repair, and report how many failed' },
            { text: 'Count each one as a middle score of 3', why: 'That invents scores. An unreadable grade is not an average grade.' },
            { text: 'Drop them from the average quietly', why: 'If the hard answers are the ones the judge garbles, dropping them makes the score look better than it is.' },
          ],
          answer: 0,
          explain: 'Never let a parsing problem change the score silently.',
        },
        {
          id: 'e5-7-4',
          type: 'predict-output',
          prompt: 'Does the judge agree with a person, within one point? What does this print?',
          code: `human = [5, 2, 4, 1]
judge = [4, 2, 5, 3]
pairs = zip(human, judge)
agree = [abs(h - j) <= 1
         for h, j in pairs]
print(sum(agree), "of", len(human))`,
          answer: '3 of 4',
          options: [
            { text: '3 of 4' },
            { text: '1 of 4', why: 'That counts exact matches only. Within one point, 5/4, 2/2 and 4/5 all agree.' },
            { text: '4 of 4', why: 'The last item is 1 versus 3: two points apart.' },
          ],
          explain: 'Checking the judge against your own scores tells you how far to trust it.',
        },
        {
          id: 'e5-7-5',
          type: 'mcq',
          prompt: 'You suspect the judge prefers longer answers even when they are worse. How do you check?',
          options: [
            { text: 'Compare with your own scores, short answers included' },
            { text: 'Switch to a bigger judge model and trust it', why: 'Bigger judges have biases too. Only comparing with known-good labels shows them.' },
            { text: 'Add "be fair to short answers" to its prompt', why: 'An instruction does not prove anything. Measure agreement before and after.' },
          ],
          answer: 0,
          explain: 'A judge is a model under test as well: measure its agreement with people.',
        },
        {
          id: 'e5-7-6',
          type: 'fill-blank',
          prompt: "Read the judge's score.",
          code: `reply = '{"score": 3, "why": "vague"}'
grade = json.___(reply)
print(grade[___])`,
          answer: ['loads', '"score"'],
          distractors: [
            { text: 'dumps', why: '`json.dumps` turns Python into JSON text. Reading JSON text into Python is `loads`.' },
            { text: '"why"', why: 'That key holds the reason ("vague"), not the score.' },
          ],
          expectOutput: '3',
          explain: '`json.loads` parses the reply; the score is under the "score" key.',
        },
        {
          id: 'e5-7-7',
          type: 'mcq',
          prompt: 'Comparing two answers, the judge picks the first one 70% of the time, whichever it is. What helps?',
          options: [
            { text: 'Judge both orders; count only consistent wins' },
            { text: 'Always put the new answer in first position', why: 'That builds the bias into your result: the new answer would win more often for no reason.' },
            { text: 'Nothing: 70% is close enough to random', why: 'Random would be 50%. A 70% first-position rate is a strong bias.' },
          ],
          answer: 0,
          explain: 'Swapping the order cancels position bias.',
        },
        {
          id: 'e5-7-8',
          type: 'run-code',
          prompt: "Set `score` to the number in the judge's reply.",
          before: `reply = '{"score": 4, "why": "ok"}'`,
          solution: 'score = json.loads(reply)["score"]',
          tests: 'assert score == 4 and isinstance(score, int), f"score should be the number 4, got {score!r}"',
          placeholder: 'score = ...',
          explain: 'Parse first, then index: `json.loads(reply)["score"]`.',
        },
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: 'e5-08',
      title: 'The golden set',
      summary: 'A golden set is frozen and versioned, never tuned on, and its score is the one tracked over time.',
      card: {
        title: 'The golden set',
        text: 'A golden set is a labelled set you freeze: the same items and labels on every run. You never edit it to make a change look better, and you never show its items to the model. Because it does not move, its score is the one you track over time.',
        code: `GOLDEN = (("14 days?", "yes"),
          ("20 days?", "no"))
VERSION = "v1"
print(VERSION, len(GOLDEN))`,
        output: 'v1 2',
      },
      exercises: [
        {
          id: 'e5-8-1',
          type: 'mcq',
          prompt: 'Your new prompt fails 3 golden items. A teammate says they are odd questions and should be deleted. What do you do?',
          options: [
            { text: 'Keep them: odd questions are what it is for' },
            { text: 'Delete them and rerun the new prompt', why: 'Removing the items you fail makes the score rise without the system getting better.' },
            { text: 'Replace them with more typical questions', why: 'Same problem: the set would then measure your edits, not the model.' },
          ],
          answer: 0,
          explain: 'A golden set only means something if failures cannot be edited away.',
        },
        {
          id: 'e5-8-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `golden = ("a", "b")
try:
    golden[0] = "z"
except TypeError:
    print("frozen")`,
          answer: 'frozen',
          options: [
            { text: 'frozen' },
            { text: "('z', 'b')", why: 'Tuples cannot be changed after they are made, so the assignment raises a TypeError.' },
          ],
          explain: 'A tuple is a cheap way to keep the set from being edited by accident in code.',
        },
        {
          id: 'e5-8-3',
          type: 'mcq',
          prompt: 'You find a golden item whose label is simply wrong. What do you do?',
          options: [
            { text: 'Fix it and bump the version number' },
            { text: 'Leave it, since the set is frozen', why: 'Frozen means not edited to flatter a change. A wrong label punishes right answers; fix it, as long as the version changes.' },
            { text: 'Fix it and keep comparing with old scores', why: 'Old scores used the wrong label, so mixing them with new ones compares two different tests.' },
          ],
          answer: 0,
          explain: 'Changes are allowed, but each one makes a new version, and scores compare only within a version.',
        },
        {
          id: 'e5-8-4',
          type: 'predict-output',
          prompt: 'Best score on version v1? What does this print?',
          code: `runs = [("v1", 0.82), ("v1", 0.85),
        ("v2", 0.90)]
v1 = [s for v, s in runs if v == "v1"]
print(max(v1))`,
          answer: '0.85',
          options: [
            { text: '0.85' },
            { text: '0.9', why: '0.90 was on v2, a different set, so it is filtered out.' },
            { text: '0.82', why: '`max` gives the highest v1 score, which is 0.85.' },
          ],
          explain: 'Only compare scores from the same version of the set.',
        },
        {
          id: 'e5-8-5',
          type: 'predict-output',
          prompt: 'Which items passed before and fail now? What does this print?',
          code: `old = {"q1": True, "q2": True,
       "q3": False}
new = {"q1": True, "q2": False,
       "q3": True}
broke = [q for q in old
         if old[q] and not new[q]]
print(broke)`,
          answer: "['q2']",
          options: [
            { text: "['q2']" },
            { text: "['q3']", why: 'q3 went from fail to pass: it was fixed, not broken.' },
            { text: '[]', why: 'q2 passed in old and fails in new: that is a regression.' },
          ],
          explain: 'A list of regressions is more useful than the total, which here did not change.',
        },
        {
          id: 'e5-8-6',
          type: 'fill-blank',
          prompt: 'The totals look the same. Find what changed.',
          code: `old = [1, 1, 0, 1]
new = [1, 0, 1, 1]
print(sum(old) ___ sum(new))
fixed = [i for i in range(4)
         if new[i] ___ old[i]]
print(fixed)`,
          answer: ['==', '>'],
          distractors: [
            { text: '<', why: '`new[i] < old[i]` finds items that got worse, not ones that were fixed.' },
            { text: '!=', why: '`!=` lists every item that changed, broken ones included.' },
          ],
          expectOutput: 'True\n[2]',
          explain: 'Same total, but item 1 broke and item 2 was fixed. Totals can hide swaps.',
        },
        {
          id: 'e5-8-7',
          type: 'mcq',
          prompt: 'Where must golden-set items never appear?',
          options: [
            { text: "In the model's prompt examples" },
            { text: 'In version control, with history', why: 'Versioning the set is good: it is how you know which version a score used.' },
            { text: 'In the eval script that scores it', why: 'The eval script has to read the set to score it.' },
          ],
          answer: 0,
          explain: 'If the model sees the test items, it can copy the answers. That is leakage (lesson 10).',
        },
        {
          id: 'e5-8-8',
          type: 'run-code',
          prompt: 'Set `broke` to the items that passed in `old` and fail in `new`.',
          before: `old = {"q1": True, "q2": False,
       "q3": True}
new = {"q1": True, "q2": True,
       "q3": False}`,
          solution: 'broke = [q for q in old\n         if old[q] and not new[q]]',
          tests: 'assert list(broke) == ["q3"], f"only q3 passed before and fails now, got {broke}"',
          maxLines: 2,
          placeholder: 'broke = [q for q in old ...]',
          explain: 'Passed before (`old[q]`) and not now (`not new[q]`).',
        },
      ],
    },

    // ------------------------------------------------------------------ 9
    {
      id: 'e5-09',
      title: 'Before and after',
      summary: 'Change one thing, rerun the same set, and compare item by item, not just the totals.',
      card: {
        title: 'Before and after',
        text: 'To know if a change helped, run the old and new versions on the same set. Change one thing at a time, or you cannot tell which change did it. On a small set look at the items that flipped, not only the total: 41 against 42 out of 50 may be noise.',
        code: `old = [1, 1, 0, 0, 1]
new = [1, 0, 1, 1, 1]
print(sum(old), "->", sum(new))`,
        output: '3 -> 4',
      },
      exercises: [
        {
          id: 'e5-9-1',
          type: 'predict-output',
          prompt: 'How many items were fixed, and how many broke? What does this print?',
          code: `old = [1, 1, 0, 0, 1]
new = [1, 0, 1, 1, 1]
fixed = broke = 0
for o, n in zip(old, new):
    fixed += n > o
    broke += o > n
print(fixed, broke)`,
          answer: '2 1',
          options: [
            { text: '2 1' },
            { text: '1 0', why: 'The total went up by 1, but that is 2 fixed minus 1 broken.' },
            { text: '1 2', why: 'Items 3 and 4 went from 0 to 1 (fixed); item 2 went from 1 to 0 (broke).' },
          ],
          explain: '+1 overall hides that one item got worse. Look at it before shipping.',
        },
        {
          id: 'e5-9-2',
          type: 'mcq',
          prompt: 'You changed the prompt and switched to a bigger model at the same time. The score rose 6 points. What do you know?',
          options: [
            { text: 'The pair helped; not which change did' },
            { text: 'That the new prompt is the better part', why: 'The bigger model alone might explain all 6 points. You changed two things at once.' },
            { text: 'That the bigger model is the better part', why: 'The prompt alone might explain it too. Test one change at a time.' },
          ],
          answer: 0,
          explain: 'One change per run, or you cannot say what caused the difference.',
        },
        {
          id: 'e5-9-3',
          type: 'mcq',
          prompt: 'Old prompt: 41/50. New prompt: 42/50. What is the honest conclusion?',
          options: [
            { text: 'Maybe noise: check flipped items, rerun' },
            { text: 'The new prompt is 2% better: ship it', why: 'One item out of 50 can flip from randomness alone. That is not yet evidence.' },
            { text: 'The new prompt is worse than it looks', why: 'Nothing here says it is worse. The result is just too small to call either way.' },
          ],
          answer: 0,
          explain: 'Small sets give noisy scores; look at the flipped items and repeat runs.',
        },
        {
          id: 'e5-9-4',
          type: 'predict-output',
          prompt: 'The gain in percentage points. Type what this prints.',
          code: `old, new = 41 / 50, 44 / 50
print(round((new - old) * 100))`,
          answer: '6',
          typedWrong: [{ answer: '3', why: 'That is the number of extra items. As a share of 50 it is 6 percentage points.' }],
          explain: '3 more right out of 50 is 6 percentage points.',
        },
        {
          id: 'e5-9-5',
          type: 'order-lines',
          prompt: 'The new score is the old one plus a gain of 7.5% of it. Order the lines so the report can print.',
          lines: [
            { text: 'old = 0.80' },
            { text: 'gain = old * 0.075' },
            { text: 'new = old + gain' },
            { text: 'delta = new - old' },
            { text: 'print(f"{old:.2f} -> {new:.2f}")', fixed: true },
            { text: 'print(f"change {delta:+.2f}")', fixed: true },
          ],
          expectOutput: '0.80 -> 0.86\nchange +0.06',
          explain: 'Each line needs the ones it uses to exist first: old and gain, then new, then the change.',
        },
        {
          id: 'e5-9-6',
          type: 'predict-output',
          prompt: 'The same system run twice on the same set, with no change at all. What does this print?',
          code: `run1 = [1, 1, 0, 1, 0, 1]
run2 = [1, 0, 0, 1, 1, 1]
flips = sum(a != b for a, b
            in zip(run1, run2))
print(sum(run1), sum(run2), flips)`,
          answer: '4 4 2',
          options: [
            { text: '4 4 2' },
            { text: '4 4 0', why: 'The totals match, but items 2 and 5 swapped. Two items flipped.' },
            { text: '4 3 2', why: 'run2 also has four 1s: positions 1, 4, 5 and 6.' },
          ],
          explain: 'Models are not perfectly repeatable. If two items flip with no change, a 1-item gain means little.',
        },
        {
          id: 'e5-9-7',
          type: 'fill-blank',
          prompt: 'Make a trial that changes only the prompt.',
          code: `base = {"model": "small",
        "prompt": "v1"}
trial = dict(base, ___="v2")
print(trial)`,
          answer: ['prompt'],
          distractors: [
            { text: 'model', why: 'That would change the model to "v2" and keep the old prompt.' },
            { text: '"prompt"', why: 'Keyword names are written without quotes: `prompt="v2"`. With quotes it is a syntax error.' },
          ],
          expectOutput: "{'model': 'small', 'prompt': 'v2'}",
          explain: '`dict(base, prompt="v2")` copies the base and changes one key: one change per trial.',
        },
        {
          id: 'e5-9-8',
          type: 'run-code',
          prompt: 'Set `gain` to the change in accuracy in percentage points.',
          before: 'old, new, n = 41, 44, 50',
          solution: 'gain = (new - old) / n * 100',
          tests: 'assert abs(gain - 6) < 1e-9, f"(44 - 41) / 50 is 0.06, which is 6 points, got {gain}"',
          placeholder: 'gain = ...',
          explain: 'Difference in right answers, as a share of the set, times 100.',
        },
      ],
    },

    // ----------------------------------------------------------------- 10
    {
      id: 'e5-10',
      title: 'Data leakage',
      summary: 'Leakage is test answers reaching the system before the test; keep test items out of everything you build with.',
      card: {
        title: 'Data leakage',
        text: 'Leakage is when the answers to your test reach the system before the test: in its prompt, its examples, or the data you tuned on. The score then measures memory, not skill, and falls the day real users arrive. Keep test items out of everything you build with, and check for overlap in code.',
        code: `examples = ["14 days?", "PDF export?"]
golden = ["PDF export?", "2FA?"]
print(set(examples) & set(golden))`,
        output: "{'PDF export?'}",
      },
      exercises: [
        {
          id: 'e5-10-1',
          type: 'predict-output',
          prompt: 'How many test items also appear in the training data? Type the answer.',
          code: `train = ["a", "b", "c"]
test = ["c", "d"]
print(len(set(train) & set(test)))`,
          answer: '1',
          explain: '`&` keeps what is in both sets: just "c". One test item has leaked.',
        },
        {
          id: 'e5-10-2',
          type: 'mcq',
          prompt: 'You chose few-shot examples for your prompt by browsing the golden set for items the model got wrong. Is that a problem?',
          options: [
            { text: 'Yes: golden items now sit in the prompt' },
            { text: 'No: they were hard, so the prompt needs them', why: 'Using hard cases is a good idea, but take them from a separate set. Once in the prompt, they no longer test anything.' },
            { text: 'Only if over half the set was used', why: 'Every leaked item gets an easy right answer. Any overlap inflates the score.' },
          ],
          answer: 0,
          explain: 'Draw examples from a separate dev set, never from the set you report on.',
        },
        {
          id: 'e5-10-3',
          type: 'mcq',
          prompt: 'You tried 30 prompt versions and kept the one with the best golden-set score. What went wrong?',
          options: [
            { text: 'It tuned on the test: choose on a dev set' },
            { text: 'Nothing: picking the best is the point', why: 'Picking is fine, but on the set you report. With 30 tries, the best may just fit those 50 items by luck.' },
            { text: 'Too few versions: try 100 to be sure', why: 'More versions make it worse: more chances to fit those test items by luck.' },
          ],
          answer: 0,
          explain: 'Choosing by test score leaks the test into your decisions. Keep a dev set for choosing.',
        },
        {
          id: 'e5-10-4',
          type: 'predict-output',
          prompt: 'Near-duplicates. What does this print?',
          code: `def norm(s):
    return s.lower().strip(" ?")

a = "How do I export?"
b = "how do I export"
print(a == b, norm(a) == norm(b))`,
          answer: 'False True',
          options: [
            { text: 'False True' },
            { text: 'False False', why: 'After lower-casing and stripping " ?" both become "how do i export".' },
            { text: 'True True', why: 'Raw, they differ in the capital H and the question mark.' },
          ],
          explain: 'Check for leaks after normalising, or near-duplicates slip through.',
        },
        {
          id: 'e5-10-5',
          type: 'mcq',
          prompt: 'Which of these is NOT leakage?',
          options: [
            { text: 'Tuning on a dev set, then reporting once on an untouched golden set' },
            { text: 'Copying golden questions into the system prompt as examples', why: 'The model then sees test items, so it can copy their answers.' },
            { text: 'Fixing the prompt after reading which golden items failed, again and again', why: 'Repeatedly fixing for specific test items tunes the system to the test.' },
          ],
          answer: 0,
          explain: 'Separate sets for building and for measuring keep the measurement honest.',
        },
        {
          id: 'e5-10-6',
          type: 'fill-blank',
          prompt: 'Split 10 items so the dev set and test set do not overlap.',
          code: `items = list(range(10))
dev = items[:___]
test = items[7:]
print(len(dev), len(test))
print(set(dev) & set(test))`,
          answer: ['7'],
          distractors: [
            { text: '8', why: '`items[:8]` includes item 7, which is also in the test set: a leak.' },
            { text: '6', why: '`items[:6]` leaves item 6 out of both sets. No leak, but it wastes an item.' },
          ],
          expectOutput: '7 3\nset()',
          explain: 'Slice at the same point: `[:7]` and `[7:]` share nothing and miss nothing.',
        },
        {
          id: 'e5-10-7',
          type: 'spot-bug',
          prompt: 'This leak check fires. Which line causes the leak?',
          code: `golden = [("14 days?", "yes"),
          ("20 days?", "no")]
shots = golden[:1]
overlap = set(shots) & set(golden)
assert not overlap, "leak"`,
          error: 'AssertionError: leak',
          answer: 2,
          raiseLine: 4,
          lineWhy: {
            '0': 'The golden set itself is fine.',
            '1': 'This is the rest of the golden set.',
            '3': 'This line finds the overlap; it is the check, not the cause.',
            '4': 'The assert is the alarm doing its job.',
          },
          explain: 'The prompt examples are taken from the golden set. Take them from a separate dev set instead.',
        },
        {
          id: 'e5-10-8',
          type: 'run-code',
          prompt: 'Set `leaked` to the golden questions that also appear in `examples`.',
          before: `examples = ["PDF?", "2FA?", "Refund?"]
golden = ["Refund?", "Share?"]`,
          solution: 'leaked = set(examples) & set(golden)',
          tests: 'assert set(leaked) == {"Refund?"}, f"only \\"Refund?\\" is in both, got {leaked}"',
          placeholder: 'leaked = ...',
          explain: 'Set intersection (`&`) finds the items in both lists.',
        },
      ],
    },

    // ----------------------------------------------------------------- 11
    {
      id: 'e5-11',
      title: 'Checkpoint',
      checkpoint: true,
      summary: 'You can pick a metric for a task, score outputs, check a judge, compare runs and spot leakage.',
      card: {
        title: 'Checkpoint',
        text: 'Everything from this unit, mixed together. For each situation, ask first: what does a good output look like, and what is the cheapest honest check for it?',
      },
      exercises: [
        {
          id: 'e5-11-1',
          type: 'mcq',
          prompt: 'The model routes tickets to one of five teams. Which metric?',
          options: [
            { text: 'Accuracy, with a count per team' },
            { text: 'A judge model scoring 1 to 5', why: 'Each ticket has one right team, so an exact check is cheaper and repeatable.' },
            { text: 'Recall for the biggest team only', why: 'All five teams matter here; one team\'s recall ignores the other four.' },
          ],
          answer: 0,
          explain: 'Closed labels: accuracy. A per-team breakdown shows which team the errors land on.',
        },
        {
          id: 'e5-11-2',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `want = ["billing", "bug"]
got = ["Billing ", "bugs"]
right = 0
for w, g in zip(want, got):
    right += w == g.strip().lower()
print(right)`,
          answer: '1',
          options: [
            { text: '1' },
            { text: '2', why: 'Normalising fixes "Billing ", but "bugs" is still not "bug".' },
            { text: '0', why: '"Billing " becomes "billing" after strip and lower, so it matches.' },
          ],
          explain: 'Normalising fixes case and spacing, not a different word.',
        },
        {
          id: 'e5-11-3',
          type: 'predict-output',
          prompt: 'Type its precision.',
          code: `tp, fp, fn = 6, 2, 4
print(tp / (tp + fp))`,
          answer: '0.75',
          typedWrong: [{ answer: '0.6', why: 'That is recall: 6 / (6 + 4). Precision divides by the flags raised: 6 / (6 + 2).' }],
          explain: 'Of 8 flags, 6 were right.',
        },
        {
          id: 'e5-11-4',
          type: 'fill-blank',
          prompt: 'Complete the recall.',
          code: `tp, fp, fn = 6, 4, 2
recall = tp / (tp + ___)
print(recall)`,
          answer: ['fn'],
          distractors: [
            { text: 'fp', why: 'Using false alarms gives precision, not recall.' },
            { text: 'tp', why: '`tp / (tp + tp)` is always 0.5 and measures nothing.' },
          ],
          expectOutput: '0.75',
          explain: 'Recall: caught out of everything that should have been caught.',
        },
        {
          id: 'e5-11-5',
          type: 'mcq',
          prompt: 'Your judge model gives every answer 4 or 5. What do you do first?',
          options: [
            { text: 'Score a sample yourself and compare' },
            { text: 'Celebrate: the answers must be good', why: 'A judge that never gives low scores may just be lenient. Check it against your own scores.' },
            { text: 'Average the scores and report them', why: 'Averaging an unchecked judge gives a precise-looking but meaningless number.' },
          ],
          answer: 0,
          explain: 'The judge is also under test.',
        },
        {
          id: 'e5-11-6',
          type: 'predict-output',
          prompt: 'Before and after. What does this print?',
          code: `old = [1, 0, 1, 1, 0, 1]
new = [1, 1, 0, 1, 1, 1]
fixed = broke = 0
for o, n in zip(old, new):
    fixed += n > o
    broke += o > n
net = sum(new) - sum(old)
print(net, fixed, broke)`,
          answer: '1 2 1',
          options: [
            { text: '1 2 1' },
            { text: '2 2 0', why: 'Item 3 went from 1 to 0, so one item broke and the net gain is 1.' },
            { text: '1 1 0', why: 'Items 2 and 5 were both fixed, and item 3 broke.' },
          ],
          explain: 'Net +1 is really 2 fixed and 1 broken: check the broken one.',
        },
        {
          id: 'e5-11-7',
          type: 'mcq',
          prompt: 'A teammate reports 96% on the golden set after adding "the 50 most useful examples" to the prompt. Which question comes first?',
          options: [
            { text: 'Did any of the 50 come from the golden set?' },
            { text: 'Which model and settings did you use?', why: 'Worth knowing, but leakage would make the 96% meaningless whatever the model.' },
            { text: 'Can we push it to 98% with more examples?', why: 'Pushing a possibly leaked number higher only makes the problem bigger.' },
          ],
          answer: 0,
          explain: 'A big jump after adding examples is the classic sign of leakage.',
        },
        {
          id: 'e5-11-8',
          type: 'predict-output',
          prompt: 'Rubric score. What does this print?',
          code: `reply = "Export from Settings, Data."
checks = [
    "Settings" in reply,
    "PDF" in reply,
    len(reply) < 60,
]
print(sum(checks), "/", len(checks))`,
          answer: '2 / 3',
          options: [
            { text: '2 / 3' },
            { text: '3 / 3', why: 'The reply never mentions "PDF", so that check fails.' },
            { text: '1 / 3', why: 'It mentions Settings and is short: two checks pass.' },
          ],
          explain: 'Each check is literal: the text has "Settings" and is short, but not "PDF".',
        },
        {
          id: 'e5-11-9',
          type: 'match-pairs',
          prompt: 'Match each problem to the fix.',
          pairs: [
            { left: 'Score rose after changing two things', right: 'one change per run', why: 'With two changes at once you cannot tell which helped.' },
            { left: 'Judge favours the first answer', right: 'judge both orders', why: 'Swapping the order cancels position bias.' },
            { left: 'Test items in the prompt', right: 'separate dev set', why: 'Build from a dev set; measure on the untouched golden set.' },
            { left: '"Yes." marked wrong against "yes"', right: 'normalise both sides', why: 'Strip, lower-case and drop punctuation before comparing.' },
          ],
          explain: 'Each common eval mistake has a simple, standard fix.',
        },
        {
          id: 'e5-11-10',
          type: 'run-code',
          prompt: 'Judge scores are 1 to 5. Set `share` to the fraction that scored 4 or more.',
          before: 'scores = [4, 5, 2, 3]',
          solution: 'good = [s for s in scores if s >= 4]\nshare = len(good) / len(scores)',
          tests: 'assert share == 0.5, f"2 of 4 scores are 4 or more, so share should be 0.5, got {share}"',
          maxLines: 2,
          placeholder: 'share = ...',
          explain: 'Count the items that pass the bar, then divide by all items.',
        },
      ],
    },
  ],
  labs: e5Labs,
  library: e5Library,
};
