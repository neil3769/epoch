import type { Lab } from '../schema';

/*
 * Unit E5 labs. Lab 1 is the plan's week 3 build in miniature (an eval
 * harness that scores any model into a results table); lab 2 uses the
 * simulated LLM as a judge; lab 3 starts every step from an empty function.
 */
export const e5Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e5-lab-1',
    title: 'An eval harness',
    intro:
      'Build the harness your plan asks for this week, small: normalise answers, run any model over a labelled set, score it, and print a results table. Then find out why two models with the same score are not the same.',
    summary: 'You built an eval harness: one function scores any model on a labelled set, and another shows exactly which items it misses.',
    minutes: 12,
    unlockAfter: 'e5-03',
    given: [
      'EVALSET = [',
      '    ("Refund after 10 days?", "yes"),',
      '    ("Refund after 20 days?", "no"),',
      '    ("Monthly plan refund?", "no"),',
      '    ("Refund at 14 days?", "yes"),',
      ']',
      '',
      'def model_a(q):',
      '    ok = "10" in q',
      '    return "Yes." if ok else "No"',
      '',
      'def model_b(q):',
      '    ok = "days" in q',
      '    return "yes" if ok else "no"',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `norm(s)`: strip spaces, lower-case, and drop a final full stop. `norm(" Yes.")` should give `"yes"`.',
        starter: 'def norm(s):\n    s = s.strip().___()\n    return s.rstrip(___)',
        solution: 'def norm(s):\n    s = s.strip().lower()\n    return s.rstrip(".")',
        tests: [
          'assert norm(" Yes.") == "yes", f"norm(\' Yes.\') should be \'yes\', got {norm(\' Yes.\')!r}"',
          'assert norm("NO") == "no", "norm(\'NO\') should be \'no\'"',
          'assert norm("no") == "no", "norm(\'no\') should stay \'no\'"',
        ].join('\n'),
        hints: [
          '`lower()` makes it lower-case. `rstrip(".")` removes full stops from the end.',
          'def norm(s):\n    s = s.___().lower()\n    return s.rstrip(___)',
        ],
        explain: 'Every output goes through this before it is compared, so formatting never counts as a wrong answer.',
      },
      {
        goal: 'Write `run(model)`: call `model` on every question in `EVALSET` and return the list of outputs.',
        starter: 'def run(model):\n    qs = [q for q, _ in EVALSET]\n    return [___ for q in qs]',
        solution: 'def run(model):\n    qs = [q for q, _ in EVALSET]\n    return [model(q) for q in qs]',
        tests: [
          'out = run(model_a)',
          'assert out == ["Yes.", "No", "No", "No"], f"run(model_a) should be the raw outputs, got {out}"',
          'assert len(run(model_b)) == 4, "run should return one output per item"',
        ].join('\n'),
        hints: [
          'A model here is just a function of the question: `model(q)` gives its answer.',
          'def run(model):\n    qs = [q for q, _ in EVALSET]\n    return [___(q) for q in qs]',
        ],
        explain: 'Keep the raw outputs: scoring is a separate step, so you can rescore without rerunning the model.',
      },
      {
        goal: 'Finish `score(outputs)`: the share of outputs that match their label after `norm`.',
        starter:
          'def score(outputs):\n    right = 0\n    for i, got in enumerate(outputs):\n        want = EVALSET[i][1]\n        right += ___\n    return right / len(EVALSET)',
        solution:
          'def score(outputs):\n    right = 0\n    for i, got in enumerate(outputs):\n        want = EVALSET[i][1]\n        right += norm(got) == want\n    return right / len(EVALSET)',
        tests: [
          'assert score(["yes", "no", "no", "yes"]) == 1.0, "all four right should score 1.0"',
          'assert score([" YES.", "No", "no", "no"]) == 0.75, "\' YES.\' counts as yes after norm; the last is wrong: 0.75"',
          's = score(run(model_a))',
          'assert s == 0.75, f"model_a should score 0.75, got {s}"',
        ].join('\n'),
        hints: [
          'Normalise the output, then compare it with the label (labels are already clean).',
          '        right += norm(___) == ___',
        ],
        explain: 'Scoring through `norm` means " YES." and "yes" count the same.',
      },
      {
        goal: 'Finish `table(models)`: given names and models, return `(name, score)` rows, best first.',
        starter:
          'def table(models):\n    rows = []\n    for name, model in models.items():\n        s = ___\n        rows.append((name, s))\n    rows.sort(key=lambda r: -r[1])\n    return rows',
        solution:
          'def table(models):\n    rows = []\n    for name, model in models.items():\n        s = score(run(model))\n        rows.append((name, s))\n    rows.sort(key=lambda r: -r[1])\n    return rows',
        tests: [
          'rows = table({"a": model_a, "b": model_b, "c": lambda q: "no"})',
          'assert len(rows) == 3, f"one row per model, got {len(rows)}"',
          'assert rows[-1] == ("c", 0.5), f"always-no gets 2 of 4 and should come last, got {rows[-1]}"',
          'assert [r[1] for r in rows[:2]] == [0.75, 0.75], f"a and b both score 0.75, got {rows[:2]}"',
        ].join('\n'),
        hints: [
          'Run the model to get its outputs, then score those outputs.',
          '        s = score(___(model))',
        ],
        explain: 'This is the "one command that scores any model into a results table" from your plan, in 7 lines.',
      },
      {
        goal: 'model_a and model_b tie. Finish `misses(model)` to list the questions each one gets wrong.',
        starter: 'def misses(model):\n    outs = run(model)\n    return [q for (q, want), got\n            in zip(EVALSET, outs)\n            if ___]',
        solution: 'def misses(model):\n    outs = run(model)\n    return [q for (q, want), got\n            in zip(EVALSET, outs)\n            if norm(got) != want]',
        tests: [
          'm = misses(model_a)',
          'assert m == ["Refund at 14 days?"], f"model_a misses only the 14-day item, got {m}"',
          'm = misses(model_b)',
          'assert m == ["Refund after 20 days?"], f"model_b misses only the 20-day item, got {m}"',
        ].join('\n'),
        hints: [
          'Keep a question when its normalised output is not its label.',
          'def misses(model):\n    outs = run(model)\n    return [q for (q, want), got\n            in zip(EVALSET, outs)\n            if norm(___) != ___]',
        ],
        explain: 'Same score, different failures: model_a gets the 14-day boundary wrong, model_b says yes to everything with "days". The score alone would never show that.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e5-lab-2',
    title: 'A model as judge',
    intro:
      'Use a model to grade answers: send it each answer, read a score out of its JSON reply, cope with replies it garbles, and measure how often it agrees with a person. Less scaffolding this time.',
    summary: 'You built a judge: it asks a model for a score, survives bad replies, and is itself checked against human scores.',
    minutes: 12,
    unlockAfter: 'e5-07',
    given: [
      'import epoch_sim as sim',
      '',
      'ANSWERS = [',
      '    "Annual plans: 14-day refund.",',
      '    "We never give refunds.",',
      '    "Refunds: 14 days, annual only.",',
      ']',
      'HUMAN = [5, 1, 4]',
    ].join('\n'),
    differs:
      '`sim.FakeLLM` replies from a script the tests give it; it does not read the answer, so it is not really judging. A real client needs an API key and costs money per call, but the call has the same shape: `client.messages.create(model=..., max_tokens=..., messages=[...])`, then `reply.content[0].text`.',
    steps: [
      {
        goal: 'Finish `ask_judge(client, answer)`: build the user message holding `text`, so the call sends it.',
        starter:
          'def ask_judge(client, answer):\n    text = "Rate 1-5: " + answer\n    msg = ___\n    reply = client.messages.create(\n        model="model-small",\n        max_tokens=50,\n        messages=[msg])\n    return reply.content[0].text',
        solution:
          'def ask_judge(client, answer):\n    text = "Rate 1-5: " + answer\n    msg = {"role": "user",\n           "content": text}\n    reply = client.messages.create(\n        model="model-small",\n        max_tokens=50,\n        messages=[msg])\n    return reply.content[0].text',
        tests: [
          'c = sim.FakeLLM(script=[\'{"score": 3}\'])',
          'out = ask_judge(c, "Hello")',
          'assert out == \'{"score": 3}\', f"ask_judge should return the reply text, got {out!r}"',
          'm = c.calls[0]["messages"][0]',
          'assert m["role"] == "user", f"the message role should be \'user\', got {m[\'role\']!r}"',
          'assert "Hello" in m["content"], "the message content should include the answer being judged"',
        ].join('\n'),
        hints: [
          'A message is a dict with two keys: "role" (who is speaking: "user") and "content" (the text).',
          'def ask_judge(client, answer):\n    text = "Rate 1-5: " + answer\n    msg = {"role": ___,\n           "content": ___}\n    reply = client.messages.create(\n        model="model-small",\n        max_tokens=50,\n        messages=[msg])\n    return reply.content[0].text',
        ],
        explain: 'Messages are a list of role-and-content dicts, the same shape every chat API uses.',
      },
      {
        goal: 'Finish `parse_score(text)`: return the score if it is a whole number from 1 to 5, otherwise `None`.',
        starter:
          'def parse_score(text):\n    try:\n        data = json.loads(text)\n        score = data["score"]\n    except Exception:\n        return None\n    ___',
        solution:
          'def parse_score(text):\n    try:\n        data = json.loads(text)\n        score = data["score"]\n    except Exception:\n        return None\n    if score in (1, 2, 3, 4, 5):\n        return score\n    return None',
        tests: [
          'assert parse_score(\'{"score": 4}\') == 4, "a clean reply should give its score"',
          'assert parse_score("Score: 4") is None, "a reply that is not JSON should give None"',
          'assert parse_score(\'{"score": 9}\') is None, "9 is outside 1 to 5, so None"',
          'assert parse_score(\'{"rating": 4}\') is None, "a reply without a score key should give None"',
        ].join('\n'),
        hints: [
          'Parsing is done for you. Check the number is one of 1, 2, 3, 4 or 5 before returning it.',
          'def parse_score(text):\n    try:\n        data = json.loads(text)\n        score = data["score"]\n    except Exception:\n        return None\n    if score in ___:\n        return score\n    return ___',
        ],
        explain: 'A judge can reply with text, a missing key or a number out of range. None marks all of them as unreadable instead of crashing.',
      },
      {
        goal: 'Write `judge_all(client)`: the parsed score for every answer in `ANSWERS`, in order (None where unreadable).',
        starter: 'def judge_all(client):\n    ___',
        solution:
          'def judge_all(client):\n    scores = []\n    for a in ANSWERS:\n        text = ask_judge(client, a)\n        s = parse_score(text)\n        scores.append(s)\n    return scores',
        tests: [
          'c = sim.FakeLLM(script=[\'{"score": 5}\', "Great answer!", \'{"score": 3}\'])',
          'got = judge_all(c)',
          'assert got == [5, None, 3], f"expected [5, None, 3], got {got}"',
          'assert len(c.calls) == 3, f"one judge call per answer, got {len(c.calls)}"',
        ].join('\n'),
        hints: [
          'Loop over ANSWERS: ask the judge, parse the reply, collect the result.',
          'def judge_all(client):\n    scores = []\n    for a in ANSWERS:\n        text = ask_judge(client, ___)\n        s = ___(text)\n        scores.append(s)\n    return scores',
        ],
      },
      {
        goal: 'Write `agreement(judge, human)`: the share of items where the judge is within 1 point of the person. An unreadable (None) score counts as disagreeing.',
        starter: 'def agreement(judge, human):\n    ___',
        solution:
          'def agreement(judge, human):\n    ok = 0\n    for j, h in zip(judge, human):\n        if j is None:\n            continue\n        ok += abs(j - h) <= 1\n    return ok / len(human)',
        tests: [
          'a = agreement([5, None, 3], HUMAN)',
          'assert abs(a - 2 / 3) < 1e-9, f"5~5 agrees, None does not, 3~4 agrees: 2/3, got {a}"',
          'a = agreement([1, 1, 1], HUMAN)',
          'assert abs(a - 1 / 3) < 1e-9, f"only the middle item agrees: 1/3, got {a}"',
        ].join('\n'),
        hints: [
          'Skip None (it stays counted in the total), add one when `abs(j - h) <= 1`, and divide by all items.',
          'def agreement(judge, human):\n    ok = 0\n    for j, h in zip(judge, human):\n        if j is None:\n            ___\n        ok += abs(j - h) <= ___\n    return ok / len(human)',
        ],
        explain: 'Dividing by all items, not just the readable ones, keeps a judge that garbles hard cases from looking better than it is.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 'e5-lab-3',
    title: 'Before, after and leaks',
    intro:
      'Write the checks that decide whether a change really helped: count what flipped, call a verdict only when the gap is clear, and refuse to report at all if test items leaked. Every step starts from an empty function.',
    summary: 'You wrote a before-and-after report that counts flips, refuses to call noise a win, and checks for leakage first.',
    minutes: 12,
    unlockAfter: 'e5-11',
    given: 'def norm(s):\n    return s.lower().strip(" ?.")',
    steps: [
      {
        goal: 'Write `flips(old, new)` for two lists of 0s and 1s (one per item): return `(fixed, broke)`, the counts that went 0→1 and 1→0.',
        starter: 'def flips(old, new):\n    pass',
        solution:
          'def flips(old, new):\n    fixed = broke = 0\n    for o, n in zip(old, new):\n        fixed += n > o\n        broke += o > n\n    return fixed, broke',
        tests: [
          'r = flips([1, 1, 0, 0], [1, 0, 1, 1])',
          'assert tuple(r) == (2, 1), f"items 3 and 4 were fixed, item 2 broke: (2, 1), got {r}"',
          'r = flips([1, 0], [1, 0])',
          'assert tuple(r) == (0, 0), f"nothing changed: (0, 0), got {r}"',
        ].join('\n'),
        hints: [
          'Walk both lists together. New 1 over old 0 is a fix; old 1 over new 0 is a break.',
          'def flips(old, new):\n    fixed = broke = 0\n    for o, n in zip(old, new):\n        fixed += n ___ o\n        broke += o ___ n\n    return fixed, broke',
        ],
      },
      {
        goal: 'Write `verdict(old, new, margin=2)`: "better" if fixes beat breaks by at least `margin`, "worse" if breaks beat fixes by that much, otherwise "unclear".',
        starter: 'def verdict(old, new, margin=2):\n    pass',
        solution:
          'def verdict(old, new, margin=2):\n    fixed, broke = flips(old, new)\n    if fixed - broke >= margin:\n        return "better"\n    if broke - fixed >= margin:\n        return "worse"\n    return "unclear"',
        tests: [
          'v = verdict([0, 0, 0, 1], [1, 1, 1, 1])',
          'assert v == "better", f"3 fixed, 0 broke: better, got {v!r}"',
          'v = verdict([1, 1, 0, 1], [1, 0, 1, 1])',
          'assert v == "unclear", f"1 fixed, 1 broke: unclear, got {v!r}"',
          'v = verdict([1, 1, 1], [0, 0, 1])',
          'assert v == "worse", f"0 fixed, 2 broke: worse, got {v!r}"',
          'v = verdict([0, 1], [1, 1], margin=1)',
          'assert v == "better", f"with margin=1, one net fix is enough, got {v!r}"',
        ].join('\n'),
        hints: [
          'Use `flips`, then compare the difference with the margin in each direction.',
          'def verdict(old, new, margin=2):\n    fixed, broke = flips(old, new)\n    if fixed - broke >= ___:\n        return "better"\n    if ___ >= margin:\n        return "worse"\n    return "unclear"',
        ],
        explain: '"Unclear" is an honest answer. A one-item difference on a small set is often noise.',
      },
      {
        goal: 'Write `leaks(examples, golden)`: the golden items that also appear among the examples after `norm`, in golden order.',
        starter: 'def leaks(examples, golden):\n    pass',
        solution: 'def leaks(examples, golden):\n    seen = {norm(e) for e in examples}\n    return [g for g in golden\n            if norm(g) in seen]',
        tests: [
          'r = leaks(["How do I export?", "2FA"], ["how do i export", "Refund?"])',
          'assert list(r) == ["how do i export"], f"the export question leaked (after norm), got {r}"',
          'r = leaks([], ["a"])',
          'assert list(r) == [], f"no examples, no leaks, got {r}"',
        ].join('\n'),
        hints: [
          'Normalise every example into a set, then keep the golden items whose normalised form is in it.',
          'def leaks(examples, golden):\n    seen = {norm(e) for e in ___}\n    return [g for g in golden\n            if norm(g) in ___]',
        ],
      },
      {
        goal: 'Write `report(old, new, shots, golden)`: if any golden item is among the prompt examples (`shots`), return `"leaked N"` (N items); otherwise return the verdict.',
        starter: 'def report(old, new, shots, golden):\n    pass',
        solution:
          'def report(old, new, shots, golden):\n    bad = leaks(shots, golden)\n    if bad:\n        return f"leaked {len(bad)}"\n    return verdict(old, new)',
        tests: [
          'r = report([0, 0, 0], [1, 1, 1], ["a"], ["a", "b"])',
          'assert r == "leaked 1", f"one golden item is in the examples: \'leaked 1\', got {r!r}"',
          'r = report([0, 0, 0], [1, 1, 1], ["x"], ["a", "b"])',
          'assert r == "better", f"no leak and 3 fixes: \'better\', got {r!r}"',
        ].join('\n'),
        hints: [
          'Check for leaks first. Only if there are none does the before-and-after verdict mean anything.',
          'def report(old, new, shots, golden):\n    bad = leaks(shots, golden)\n    if bad:\n        return f"leaked {___}"\n    return ___(old, new)',
        ],
        explain: 'A leak makes any score comparison meaningless, so the report refuses to give a verdict until it is fixed.',
      },
    ],
  },
];
