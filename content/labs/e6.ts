import type { Lab } from '../schema';

/*
 * Unit E6 labs, against sim.DOCS (a seven-page help centre with toy
 * embeddings). Lab 1 builds chunking and three kinds of search with
 * scaffolding; lab 2 starts every step from an empty function and builds
 * retrieval with a floor, a citing prompt, a citation check, the full
 * answer-or-refuse pipeline, and a retrieval hit rate.
 */

const DIFFERS =
  'sim.DOCS has seven short pages, and sim.embed gives toy 8-number topic vectors, so scores are much cleaner than real ones. Real embeddings come from a model (hundreds of dimensions), real keyword search uses BM25 from a library or search engine, and real collections are stored in an index (a vector database) instead of being scored one by one. The code shape is the same.';

export const e6Labs: Lab[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 'e6-lab-1',
    title: 'Three ways to search',
    intro:
      'Write a chunker, then keyword search, vector search and hybrid search over the help pages, and see hybrid search fix the cases where one kind alone gets it wrong.',
    summary: 'You chunked text with overlap and built keyword, vector and hybrid (RRF) search.',
    minutes: 14,
    unlockAfter: 'e6-05',
    differs: DIFFERS,
    given: [
      'import re',
      'STOP = {"how", "do", "i", "my", "a",',
      '        "the", "can", "what", "does",',
      '        "is", "much", "to"}',
      '',
      'def words(text):',
      '    ws = re.findall(r"[a-z0-9-]+",',
      '                    text.lower())',
      '    return [w for w in ws',
      '            if w not in STOP]',
    ].join('\n'),
    steps: [
      {
        goal: 'Finish `chunk(text, size, overlap)`: windows of `size` words, each starting `size - overlap` words after the last, stopping once a window reaches the end.',
        starter:
          'def chunk(text, size, overlap):\n    ws = text.split()\n    step = ___\n    out = []\n    for i in range(0, len(ws), step):\n        part = ws[i:i + size]\n        out.append(" ".join(part))\n        if ___:\n            break\n    return out',
        solution:
          'def chunk(text, size, overlap):\n    ws = text.split()\n    step = size - overlap\n    out = []\n    for i in range(0, len(ws), step):\n        part = ws[i:i + size]\n        out.append(" ".join(part))\n        if i + size >= len(ws):\n            break\n    return out',
        tests: [
          'got = chunk("a b c d e", 3, 1)',
          'assert got == ["a b c", "c d e"], f"size 3, overlap 1: got {got}"',
          'got = chunk("a b c d", 2, 0)',
          'assert got == ["a b", "c d"], f"no overlap: got {got}"',
          'assert chunk("a b", 5, 1) == ["a b"], "short text: one chunk"',
        ].join('\n'),
        hints: [
          'The step is the size minus the overlap. Stop when this window\'s end (`i + size`) reaches the number of words.',
          'def chunk(text, size, overlap):\n    ws = text.split()\n    step = size ___ overlap\n    out = []\n    for i in range(0, len(ws), step):\n        part = ws[i:i + size]\n        out.append(" ".join(part))\n        if i + size >= ___:\n            break\n    return out',
        ],
        explain: 'Without the stop, the last window would be a short tail made only of overlap.',
      },
      {
        goal: 'Finish `keyword_rank(query)`: the ids of pages whose text shares at least one word with the query (using `words`), most shared words first.',
        starter:
          'def keyword_rank(query):\n    q = set(words(query))\n    scored = []\n    for d in sim.DOCS:\n        ws = set(words(d["text"]))\n        n = ___\n        scored.append((n, d["id"]))\n    scored.sort(key=lambda t: -t[0])\n    return [i for n, i in scored if n]',
        solution:
          'def keyword_rank(query):\n    q = set(words(query))\n    scored = []\n    for d in sim.DOCS:\n        ws = set(words(d["text"]))\n        n = len(q & ws)\n        scored.append((n, d["id"]))\n    scored.sort(key=lambda t: -t[0])\n    return [i for n, i in scored if n]',
        tests: [
          'got = keyword_rank("How do I reset my password?")',
          'assert got == ["d1"], f"only d1 has reset and password; got {got}"',
          'got = keyword_rank("How much does the paid plan cost?")',
          'assert got == ["d7"], f"only d7 says paid plan; got {got}"',
          'got = keyword_rank("get my money back")',
          'assert got == [], f"no page uses these words; got {got}"',
        ].join('\n'),
        hints: ['Count the words in both sets: the size of their intersection `q & ws`.', 'n = len(q ___ ws)'],
        explain: 'Exact words: precise when they match, blind to "money back" meaning "refund".',
      },
      {
        goal: 'Write `vector_rank(query)`: the ids of pages with cosine similarity above 0 to the query, most similar first.',
        starter: 'def vector_rank(query):\n    e = sim.embed(query)\n    ___',
        solution:
          'def vector_rank(query):\n    e = sim.embed(query)\n    def s(d):\n        v = d["embedding"]\n        return sim.cosine(e, v)\n    ranked = sorted(sim.DOCS, key=s,\n                    reverse=True)\n    return [d["id"] for d in ranked\n            if s(d) > 0]',
        tests: [
          'got = vector_rank("How do I reset my password?")',
          'assert got[:2] == ["d6", "d1"], f"vector search puts two-factor first here; got {got}"',
          'got = vector_rank("get my money back")',
          'assert got[0] == "d2", f"meaning finds the refund page; got {got}"',
          'assert vector_rank("capital of France") == [], "nothing related: empty"',
        ].join('\n'),
        hints: [
          'Score each page by cosine with the query embedding, sort highest first, and keep the ids with a score above 0.',
          'def vector_rank(query):\n    e = sim.embed(query)\n    def s(d):\n        v = d["embedding"]\n        return sim.cosine(e, v)\n    ranked = sorted(sim.DOCS, key=s,\n                    reverse=___)\n    return [d["id"] for d in ranked\n            if s(d) > ___]',
        ],
        explain: 'Note the password case: vector search ranks the wrong account page first.',
      },
      {
        goal: 'Write `rrf(rankings, k=60)`: reciprocal rank fusion. Each id gets 1 / (k + rank) from every list it is in (ranks from 1); return the ids by total, highest first.',
        starter: 'def rrf(rankings, k=60):\n    s = {}\n    ___',
        solution:
          'def rrf(rankings, k=60):\n    s = {}\n    for L in rankings:\n        for r, i in enumerate(L, 1):\n            old = s.get(i, 0)\n            s[i] = old + 1 / (k + r)\n    return sorted(s, key=s.get,\n                  reverse=True)',
        tests: [
          'got = rrf([["a", "b"], ["b", "c"]])',
          'assert got == ["b", "a", "c"], f"b is in both lists; got {got}"',
          'assert rrf([]) == [], "no rankings: empty"',
          'got = rrf([["x"], ["y"]], k=0)',
          'assert got[0] in ("x", "y") and len(got) == 2, "k is a parameter"',
        ].join('\n'),
        hints: [
          'Loop over each ranking with `enumerate(L, 1)`, add 1 / (k + rank) to that id\'s total, then sort the ids by total.',
          'def rrf(rankings, k=60):\n    s = {}\n    for L in rankings:\n        for r, i in enumerate(L, ___):\n            old = s.get(i, 0)\n            s[i] = old + 1 / (k + r)\n    return sorted(s, key=s.get,\n                  reverse=___)',
        ],
      },
      {
        goal: 'Write `hybrid(query)`: the RRF fusion of `keyword_rank(query)` and `vector_rank(query)`.',
        starter: 'def hybrid(query):\n    ___',
        solution: 'def hybrid(query):\n    kw = keyword_rank(query)\n    vec = vector_rank(query)\n    return rrf([kw, vec])',
        tests: [
          'got = hybrid("How do I reset my password?")',
          'assert got[0] == "d1", f"keyword search lifts the reset page; got {got}"',
          'got = hybrid("How much does the paid plan cost?")',
          'assert got[0] == "d7", f"keyword search lifts the pricing page; got {got}"',
          'got = hybrid("get my money back")',
          'assert got[0] == "d2", f"vector search alone still finds refunds; got {got}"',
        ].join('\n'),
        hints: ['Call both searches and pass their two lists to `rrf`.', 'def hybrid(query):\n    kw = keyword_rank(query)\n    vec = vector_rank(query)\n    return rrf([___, ___])'],
        explain: 'Each search covers the other\'s misses: all three questions now find the right page.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 'e6-lab-2',
    title: 'Answer with sources, or refuse',
    intro:
      'Build the retrieval half of a help bot that cites its sources and refuses when it cannot answer: retrieve with a floor, build a citing prompt, parse citations, run the whole pipeline with a checked answer, and measure retrieval on its own. Every step starts from an empty function.',
    summary: 'You built a RAG pipeline that refuses below a floor, cites sources, rejects made-up citations, and measures its retrieval hit rate.',
    minutes: 18,
    unlockAfter: 'e6-10',
    differs: DIFFERS + ' sim.FakeLLM replies from a script instead of reading the prompt.',
    given: [
      'import re',
      'REFUSE = "Not in the help pages."',
      'PAT = r"\\[(d\\d+)\\]"',
    ].join('\n'),
    steps: [
      {
        goal: 'Write `retrieve(q, k=2, floor=0.5)`: the pages (dicts from `sim.DOCS`) whose cosine similarity to `q` is at least `floor`, most similar first, at most `k` of them.',
        starter: 'def retrieve(q, k=2, floor=0.5):\n    pass',
        solution:
          'def retrieve(q, k=2, floor=0.5):\n    e = sim.embed(q)\n    def s(d):\n        v = d["embedding"]\n        return sim.cosine(e, v)\n    ranked = sorted(sim.DOCS, key=s,\n                    reverse=True)\n    hits = [d for d in ranked\n            if s(d) >= floor]\n    return hits[:k]',
        tests: [
          'ids = [d["id"] for d in retrieve("reset password")]',
          'assert ids == ["d6", "d1"], f"the two account pages, best first; got {ids}"',
          'ids = [d["id"] for d in retrieve("refund", k=1)]',
          'assert ids == ["d2"], f"k=1 keeps one; got {ids}"',
          'assert retrieve("capital of France") == [], "nothing clears the floor: empty list"',
          'assert retrieve("reset password", floor=0.9)[0]["id"] == "d6", "floor is a parameter"',
        ].join('\n'),
        hints: [
          'Score with cosine against the query embedding, sort highest first, keep those at or above the floor, then slice to k.',
          'def retrieve(q, k=2, floor=0.5):\n    e = sim.embed(q)\n    def s(d):\n        v = d["embedding"]\n        return sim.cosine(e, v)\n    ranked = sorted(sim.DOCS, key=s,\n                    reverse=True)\n    hits = [d for d in ranked\n            if s(d) ___ floor]\n    return hits[:___]',
        ],
      },
      {
        goal: 'Write `build_prompt(q, hits)`: a prompt with one line `[id] text` per hit, the question, and an instruction to use only the sources, cite them like [d1], and say it does not know if they lack the answer.',
        starter: 'def build_prompt(q, hits):\n    pass',
        solution:
          'def build_prompt(q, hits):\n    ls = [f"[{d[\'id\']}] {d[\'text\']}"\n          for d in hits]\n    src = "\\n".join(ls)\n    rule = ("Use only the sources. "\n            "Cite them like [d1]. "\n            "If they lack it, say "\n            "you don\'t know.")\n    return (f"Sources:\\n{src}\\n\\n"\n            f"Question: {q}\\n{rule}")',
        tests: [
          'hits = [sim.DOCS[1], sim.DOCS[6]]',
          'p = build_prompt("Refund?", hits)',
          'for d in hits:',
          '    line = f"[{d[\'id\']}] {d[\'text\']}"',
          '    assert line in p, f"missing the labelled line for {d[\'id\']}"',
          'assert "Refund?" in p, "include the question"',
          'assert "[d1]" in p or "cite" in p.lower(), "ask for citations"',
          'assert "know" in p.lower(), "tell the model it may say it does not know"',
        ].join('\n'),
        hints: [
          'Make one `[id] text` line per hit, join them with newlines, and add the question and the rule.',
          'def build_prompt(q, hits):\n    ls = [f"[{d[\'id\']}] {d[___]}"\n          for d in hits]\n    src = "\\n".___(ls)\n    rule = ("Use only the sources. "\n            "Cite them like [d1]. "\n            "If they lack it, say "\n            "you don\'t know.")\n    return (f"Sources:\\n{src}\\n\\n"\n            f"Question: {q}\\n{rule}")',
        ],
      },
      {
        goal: 'Write `cited(text)`: the ids cited in `text` (use `PAT`), each once, in order of first appearance.',
        starter: 'def cited(text):\n    pass',
        solution: 'def cited(text):\n    found = re.findall(PAT, text)\n    return list(dict.fromkeys(found))',
        tests: [
          'got = cited("See [d3], then [d1] and [d3].")',
          'assert got == ["d3", "d1"], f"in order, no repeats; got {got}"',
          'assert cited("No sources here.") == [], "no citations: empty list"',
        ].join('\n'),
        hints: ['`re.findall(PAT, text)` gives every id; `dict.fromkeys` drops repeats and keeps the order.', 'def cited(text):\n    found = re.findall(___, text)\n    return list(dict.fromkeys(___))'],
      },
      {
        goal: 'Write `answer(client, q)`: return `(text, ids)`. With no hits, return `(REFUSE, [])` without calling the model. Otherwise call `client.messages.create` with the prompt; if the reply cites nothing, or cites an id you did not send, return `(REFUSE, [])`.',
        starter: 'def answer(client, q):\n    pass',
        solution:
          'def answer(client, q):\n    hits = retrieve(q)\n    if not hits:\n        return REFUSE, []\n    p = build_prompt(q, hits)\n    msg = {"role": "user",\n           "content": p}\n    r = client.messages.create(\n        model="model-small",\n        max_tokens=300,\n        messages=[msg])\n    text = r.content[0].text\n    ids = cited(text)\n    sent = {d["id"] for d in hits}\n    ok = ids and set(ids) <= sent\n    if not ok:\n        return REFUSE, []\n    return text, ids',
        tests: [
          'c = sim.FakeLLM(["Within 14 days [d2]."])',
          't, s = answer(c, "Can I get a refund?")',
          'assert s == ["d2"], f"a good cited answer comes back; got {s}"',
          'assert "[d2]" in c.calls[0]["messages"][0]["content"], "the prompt should contain the labelled pages"',
          'c = sim.FakeLLM(["Paris."])',
          'assert answer(c, "capital of France?") == (REFUSE, []), "refuse off-topic questions"',
          'assert len(c.calls) == 0, "refusing must not call the model"',
          'c = sim.FakeLLM(["Yes [d9]."])',
          'assert answer(c, "refund?") == (REFUSE, []), "d9 was never sent: reject the answer"',
          'c = sim.FakeLLM(["Yes, you can."])',
          'assert answer(c, "refund?") == (REFUSE, []), "an answer with no citation is unsupported"',
        ].join('\n'),
        hints: [
          'Retrieve first and refuse early. After the call, parse the citations and check they are non-empty and all among the ids you sent.',
          'def answer(client, q):\n    hits = retrieve(q)\n    if not hits:\n        return REFUSE, []\n    p = build_prompt(q, hits)\n    msg = {"role": "user",\n           "content": p}\n    r = client.messages.create(\n        model="model-small",\n        max_tokens=300,\n        messages=[msg])\n    text = r.content[0].text\n    ids = cited(text)\n    sent = {d["id"] for d in hits}\n    ok = ids and set(ids) ___ sent\n    if not ok:\n        return ___, []\n    return text, ids',
        ],
        explain: 'Two guards around the model: a floor before the call and a citation check after it.',
      },
      {
        goal: 'Write `hit_rate(cases, k=2)`: `cases` is a list of `(question, needed_id)` pairs; return the fraction whose needed id is among `retrieve(question, k)`.',
        starter: 'def hit_rate(cases, k=2):\n    pass',
        solution:
          'def hit_rate(cases, k=2):\n    hits = 0\n    for q, need in cases:\n        got = retrieve(q, k)\n        ids = [d["id"] for d in got]\n        hits += need in ids\n    return hits / len(cases)',
        tests: [
          'cases = [("reset password", "d1"),',
          '         ("refund", "d2")]',
          'assert hit_rate(cases) == 1.0, f"with k=2 both are found; got {hit_rate(cases)}"',
          'assert hit_rate(cases, k=1) == 0.5, f"with k=1, two-factor beats the reset page; got {hit_rate(cases, k=1)}"',
        ].join('\n'),
        hints: [
          'For each pair, retrieve, collect the ids, and count whether the needed one is there; divide by the number of cases.',
          'def hit_rate(cases, k=2):\n    hits = 0\n    for q, need in cases:\n        got = retrieve(q, k)\n        ids = [d["id"] for d in got]\n        hits += need ___ ids\n    return hits / len(___)',
        ],
        explain: 'Measured on its own, retrieval tells you which stage to fix (lesson 9).',
      },
    ],
  },
];
