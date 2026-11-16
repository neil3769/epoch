import type { Lab } from '../schema';

/*
 * Unit E4 labs. Lab 1 builds a structured prompt (documents first, task,
 * tagged examples, question last) and sends it; lab 2 starts every step from
 * an empty function and fits a question's context into a token budget.
 */
export const e4Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e4-lab-1',
    title: 'A prompt builder',
    intro:
      'Build prompts the way the guides recommend, in code: tagged examples, tagged documents first, the task, and the question last. Then retrieve the two most relevant pages and send the prompt to the model.',
    summary: 'You built a prompt builder: relevant pages first in tags, the task, tagged examples, and the question last.',
    minutes: 12,
    unlockAfter: 'e4-03',
    given: [
      'TASK = "Answer from the docs only."',
      'SHOTS = [',
      '    ("3-day refund?", "Yes [d2]"),',
      '    ("PDF export?", "Yes [d3]"),',
      ']',
      'EX = "<example>{} -> {}</example>"',
      'DOC = \'<doc id="{}">{}</doc>\'',
      '',
      'def wrap(tag, t):',
      '    return f"<{tag}>\\n{t}\\n</{tag}>"',
    ].join('\n'),
    differs:
      '`sim.FakeLLM` replies from a script, so it shows what you sent rather than a real answer, and its "embeddings" are toy topic counts. With a real model the same prompt structure applies; real retrieval uses an embedding model (unit E6).',
    steps: [
      {
        goal: 'Finish `examples_block(shots)`: one `EX` line per (question, answer) pair, wrapped in `<examples>`.',
        starter: 'def examples_block(shots):\n    rows = [___ for q, a in shots]\n    body = "\\n".join(rows)\n    return wrap("examples", body)',
        solution: 'def examples_block(shots):\n    rows = [EX.format(q, a)\n            for q, a in shots]\n    body = "\\n".join(rows)\n    return wrap("examples", body)',
        tests: [
          'got = examples_block(SHOTS)',
          'want = "<examples>\\n<example>3-day refund? -> Yes [d2]</example>\\n<example>PDF export? -> Yes [d3]</example>\\n</examples>"',
          'assert got == want, f"got {got!r}"',
        ].join('\n'),
        hints: [
          '`EX.format(q, a)` fills the template with one pair.',
          'def examples_block(shots):\n    rows = [EX.___(q, a)\n            for q, a in ___]\n    body = "\\n".join(rows)\n    return wrap("examples", body)',
        ],
      },
      {
        goal: 'Finish `docs_block(docs)`: one `DOC` line per page (its "id" and "text"), wrapped in `<docs>`.',
        starter: 'def docs_block(docs):\n    rows = [___ for d in docs]\n    body = "\\n".join(rows)\n    return wrap("docs", body)',
        solution: 'def docs_block(docs):\n    rows = [DOC.format(d["id"],\n                       d["text"])\n            for d in docs]\n    body = "\\n".join(rows)\n    return wrap("docs", body)',
        tests: [
          'got = docs_block(sim.DOCS[:1])',
          'want = \'<docs>\\n<doc id="d1">\' + sim.DOCS[0]["text"] + "</doc>\\n</docs>"',
          'assert got == want, f"got {got!r}"',
          'assert docs_block(sim.DOCS[:3]).count("<doc id=") == 3, "one line per page"',
        ].join('\n'),
        hints: [
          'Each page is a dict: fill the template with `d["id"]` and `d["text"]`.',
          'def docs_block(docs):\n    rows = [DOC.format(d[___],\n                       d[___])\n            for d in docs]\n    body = "\\n".join(rows)\n    return wrap("docs", body)',
        ],
        explain: 'An id on each page lets the model cite its source, as the examples show: "Yes [d2]".',
      },
      {
        goal: 'Finish `build(question, docs)`: the documents first, then the task, then the examples, and the question in `<q>` tags last.',
        starter: 'def build(question, docs):\n    parts = [___,\n             TASK,\n             examples_block(SHOTS),\n             ___]\n    return "\\n".join(parts)',
        solution: 'def build(question, docs):\n    parts = [docs_block(docs),\n             TASK,\n             examples_block(SHOTS),\n             f"<q>{question}</q>"]\n    return "\\n".join(parts)',
        tests: [
          'p = build("Refund?", sim.DOCS[:2])',
          'assert p.startswith("<docs>"), "the documents come first"',
          'assert p.endswith("<q>Refund?</q>"), "the question comes last, in <q> tags"',
          'assert p.index("</docs>") < p.index(TASK) < p.index("<examples>"), "then the task, then the examples"',
        ].join('\n'),
        hints: [
          'First the docs block for `docs`; last the question wrapped as `<q>...</q>`.',
          'def build(question, docs):\n    parts = [docs_block(___),\n             TASK,\n             examples_block(SHOTS),\n             f"<q>{___}</q>"]\n    return "\\n".join(parts)',
        ],
      },
      {
        goal: 'Finish `ask(client, question, k=2)`: send the prompt built from the `k` most relevant pages as one user message, and return the reply text.',
        starter:
          'def ask(client, question, k=2):\n    q = sim.embed(question)\n    def score(d):\n        e = d["embedding"]\n        return sim.cosine(q, e)\n    top = sorted(sim.DOCS, key=score,\n                 reverse=True)[:k]\n    msg = ___\n    reply = client.messages.create(\n        model="model-small",\n        max_tokens=200,\n        messages=[msg])\n    return reply.content[0].text',
        solution:
          'def ask(client, question, k=2):\n    q = sim.embed(question)\n    def score(d):\n        e = d["embedding"]\n        return sim.cosine(q, e)\n    top = sorted(sim.DOCS, key=score,\n                 reverse=True)[:k]\n    p = build(question, top)\n    msg = {"role": "user",\n           "content": p}\n    reply = client.messages.create(\n        model="model-small",\n        max_tokens=200,\n        messages=[msg])\n    return reply.content[0].text',
        tests: [
          'reply = lambda m: "saw d2" if \'id="d2"\' in m[0]["content"] else "no d2"',
          'c = sim.FakeLLM([reply])',
          'a = ask(c, "refund on annual plan")',
          'assert a == "saw d2", f"the refund page (d2) should be in the prompt; the model replied {a!r}"',
          'sent = c.calls[0]["messages"][0]',
          'assert sent["role"] == "user", "send the prompt as a user message"',
          'assert sent["content"].count("<doc id=") == 2, "send only the top k = 2 pages"',
          'assert sent["content"].endswith("<q>refund on annual plan</q>"), "the question goes last"',
        ].join('\n'),
        hints: [
          'Build the prompt from the top pages, then make it the content of a user message.',
          '    p = build(question, ___)\n    msg = {"role": ___,\n           "content": p}',
        ],
        explain: 'Two relevant pages, not seven: the smallest set that answers the question.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e4-lab-2',
    title: 'Fit the context',
    intro:
      'Decide what goes into the context for a question: rank the help pages, keep the ones that fit a token budget, compact a long chat, and put it all together. Every step starts from an empty function.',
    summary: 'You fitted a context to a budget: relevant pages only, within the tokens left after a compacted chat history.',
    minutes: 12,
    unlockAfter: 'e4-07',
    differs:
      'Token counts here are the stand-in\'s estimate (about 4 characters per token) and the similarity is a toy topic count. Real systems use the provider\'s token counter and an embedding model, but the budgeting logic is the same.',
    steps: [
      {
        goal: 'Write `rank(question)`: the ids of the pages in `sim.DOCS` with similarity above 0 to the question, most similar first.',
        starter: 'def rank(question):\n    pass',
        solution:
          'def rank(question):\n    q = sim.embed(question)\n    scored = []\n    for d in sim.DOCS:\n        e, i = d["embedding"], d["id"]\n        s = sim.cosine(q, e)\n        if s > 0:\n            scored.append((s, i))\n    scored.sort(reverse=True)\n    return [i for s, i in scored]',
        tests: [
          'r = rank("refund annual plan")',
          'assert r == ["d2", "d7"], f"refund policy, then pricing; got {r}"',
          'r = rank("capital of France")',
          'assert r == [], f"nothing is relevant, so nothing is ranked; got {r}"',
        ].join('\n'),
        hints: [
          'Score every page with `sim.cosine(q, d["embedding"])`, keep those above 0, sort best first, return the ids.',
          'def rank(question):\n    q = sim.embed(question)\n    scored = []\n    for d in sim.DOCS:\n        e, i = d["embedding"], d["id"]\n        s = sim.cosine(q, e)\n        if s > ___:\n            scored.append((s, i))\n    scored.sort(reverse=___)\n    return [i for s, i in scored]',
        ],
        explain: 'Pages with nothing in common with the question never make it in, however much room there is.',
      },
      {
        goal: 'Write `pick(question, budget)`: walk the ranked pages and keep each one whose tokens (`sim.count_tokens` of its text) still fit in the budget; skip any that do not.',
        starter: 'def pick(question, budget):\n    pass',
        solution:
          'def pick(question, budget):\n    text = {d["id"]: d["text"]\n            for d in sim.DOCS}\n    kept, used = [], 0\n    for i in rank(question):\n        n = sim.count_tokens(text[i])\n        if used + n <= budget:\n            kept.append(i)\n            used += n\n    return kept',
        tests: [
          'r = pick("refund annual plan", 40)',
          'assert r == ["d2"], f"d2 is 30 tokens; d7 (26) would overflow 40; got {r}"',
          'r = pick("refund annual plan", 60)',
          'assert r == ["d2", "d7"], f"30 + 26 = 56 fits in 60; got {r}"',
          'assert pick("refund annual plan", 10) == [], "nothing fits in 10 tokens"',
        ].join('\n'),
        hints: [
          'Look up each ranked page\'s text, count its tokens, and add it only if `used + n <= budget`.',
          'def pick(question, budget):\n    text = {d["id"]: d["text"]\n            for d in sim.DOCS}\n    kept, used = [], 0\n    for i in rank(question):\n        n = sim.count_tokens(text[i])\n        if used + n <= ___:\n            kept.append(i)\n            used += ___\n    return kept',
        ],
      },
      {
        goal: 'Write `compact(turns, keep=2)`: if there are more than `keep` turns, replace the older ones with one line "[N earlier turns]" followed by the newest `keep`; otherwise return the turns unchanged.',
        starter: 'def compact(turns, keep=2):\n    pass',
        solution:
          'def compact(turns, keep=2):\n    if len(turns) <= keep:\n        return list(turns)\n    n = len(turns) - keep\n    return ([f"[{n} earlier turns]"]\n            + turns[-keep:])',
        tests: [
          'r = compact(["a", "b", "c", "d", "e"])',
          'assert r == ["[3 earlier turns]", "d", "e"], f"got {r}"',
          'r = compact(["a", "b"])',
          'assert r == ["a", "b"], f"two turns fit already; got {r}"',
          'r = compact(["a", "b", "c"], keep=1)',
          'assert r == ["[2 earlier turns]", "c"], f"keep=1 keeps only the newest; got {r}"',
        ].join('\n'),
        hints: [
          'Count the turns being dropped, make the marker line, then add the last `keep` turns.',
          'def compact(turns, keep=2):\n    if len(turns) <= keep:\n        return list(turns)\n    n = len(turns) - ___\n    return ([f"[{n} earlier turns]"]\n            + turns[___:])',
        ],
        explain: 'A real system would put a model-written summary where the marker is.',
      },
      {
        goal: 'Write `fit(q, turns, budget)` for a question `q`: compact the turns, count their tokens, then pick pages with whatever budget is left. Return `(page_ids, compacted_turns)`.',
        starter: 'def fit(q, turns, budget):\n    pass',
        solution:
          'def fit(q, turns, budget):\n    kept = compact(turns)\n    used = sum(sim.count_tokens(t)\n               for t in kept)\n    pages = pick(q, budget - used)\n    return pages, kept',
        tests: [
          'pages, kept = fit("refund annual plan", ["hello there"] * 5, 50)',
          'assert kept == ["[3 earlier turns]", "hello there", "hello there"], f"compact first; got {kept}"',
          'assert pages == ["d2"], f"11 tokens of chat leave 39: d2 (30) fits, d7 does not; got {pages}"',
          'pages, kept = fit("refund annual plan", [], 100)',
          'assert pages == ["d2", "d7"] and kept == [], f"an empty chat leaves the whole budget; got {pages}, {kept}"',
        ].join('\n'),
        hints: [
          'Compact, add up the tokens of what is kept, and pass the remaining budget to `pick`.',
          'def fit(q, turns, budget):\n    kept = compact(turns)\n    used = sum(sim.count_tokens(t)\n               for t in kept)\n    pages = pick(q, budget - ___)\n    return pages, ___',
        ],
        explain: 'History and documents share one budget; compacting the chat leaves room for the pages that answer the question.',
      },
    ],
  },
];
