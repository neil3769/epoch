import type { Lesson } from '../schema';

/*
 * E6 lessons 6 to 10: reranking, citing sources, refusing, telling
 * retrieval failures from generation failures, and the checkpoint.
 */
export const e6More: Lesson[] = [
  // ------------------------------------------------------------------ 6
  {
    id: 'e6-06',
    title: 'Reranking',
    summary: 'Retrieve generously with fast search, then let a slower, more accurate reranker pick the best few.',
    card: {
      title: 'Reranking',
      text: 'Fast search is approximate, so retrieve generously (say 50 chunks), then rerank: a slower, more accurate model reads the question and each chunk together and scores how well the chunk answers it. Keep only the top few after reranking. You pay for the slow model on 50 chunks, not on the whole collection.',
      code: `hits = ["d2", "d7", "d5"]
judge = {"d2": 0.3, "d7": 0.9,
         "d5": 0.1}
best = sorted(hits, key=judge.get,
              reverse=True)[:1]
print(best)`,
      output: "['d7']",
    },
    exercises: [
      {
        id: 'e6-6-1',
        type: 'mcq',
        prompt: 'Why not run the reranker over every chunk in the collection?',
        options: [
          { text: 'It is far too slow for every chunk' },
          { text: 'Rerankers cannot read long text', why: 'They read chunks fine; the issue is one slow model call per chunk.' },
          { text: 'It gives the same order as search', why: 'It usually gives a better order; that is why it is used.' },
        ],
        answer: 0,
        explain: 'Cheap search narrows millions to 50; the expensive reranker picks from those.',
      },
      {
        id: 'e6-6-2',
        type: 'mcq',
        prompt: 'What makes a reranker more accurate than comparing embeddings?',
        options: [
          { text: 'It reads question and chunk together' },
          { text: 'It uses longer embedding vectors', why: 'A reranker does not compare vectors at all; it reads both texts at once.' },
          { text: 'It searches more of the documents', why: 'It sees fewer: only what search returned.' },
        ],
        answer: 0,
        explain: 'Embeddings squeeze each text into a vector separately; a reranker sees how they relate.',
      },
      {
        id: 'e6-6-3',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `judge = {"a": 0.2, "b": 0.7,
         "c": 0.5}
print(sorted(judge, key=judge.get,
             reverse=True)[:2])`,
        answer: "['b', 'c']",
        typedWrong: [{ answer: "['a', 'b']", why: 'Sorting is by score, highest first: b (0.7), then c (0.5).' }],
        explain: 'Keep the two the reranker likes best.',
      },
      {
        id: 'e6-6-4',
        type: 'mcq',
        prompt: 'You retrieve 5 chunks and rerank to 3, and the right chunk is often missing. What should change?',
        options: [
          { text: 'Retrieve more first, such as 50' },
          { text: 'Rerank to fewer, such as 1', why: 'Keeping fewer cannot bring back a chunk search never returned.' },
          { text: 'Drop the reranker', why: 'The chunk is lost before the reranker sees it.' },
        ],
        answer: 0,
        explain: 'A reranker can only reorder what search found.',
      },
      {
        id: 'e6-6-5',
        type: 'fill-blank',
        prompt: 'Keep the top `keep` after reranking.',
        code: `judge = {"d1": 0.9, "d6": 0.4,
         "d3": 0.1}
keep = 2
top = sorted(judge, key=judge.get,
             reverse=True)[:___]
print(top)`,
        answer: ['keep'],
        distractors: [
          { text: '-keep', why: '`[:-2]` drops the last two, leaving one.' },
          { text: '1', why: 'That keeps only the best one.' },
        ],
        expectOutput: "['d1', 'd6']",
        explain: 'Retrieve many, keep a few.',
      },
      {
        id: 'e6-6-6',
        type: 'predict-output',
        prompt: 'How many reranker calls? What does this print?',
        code: `calls = 0
def judge(q, chunk):
    global calls
    calls += 1
    return len(chunk)

hits = ["ab", "abc", "a"] * 10
top = sorted(hits, key=lambda c:
             judge("q", c))[-5:]
print(calls)`,
        answer: '30',
        options: [
          { text: '30' },
          { text: '5', why: 'Every retrieved chunk is scored before the best 5 are kept.' },
          { text: '1', why: 'The reranker scores each chunk separately: one call per chunk.' },
        ],
        explain: 'Reranking cost grows with how many you retrieve, so 50 is a common compromise.',
      },
      {
        id: 'e6-6-7',
        type: 'mcq',
        prompt: 'Where does a reranker sit in the pipeline?',
        options: [
          { text: 'Between search and the prompt' },
          { text: 'Before chunking the documents', why: 'There is nothing to rank before chunks exist and a question arrives.' },
          { text: 'After the model answers', why: 'By then the chunks have already been used.' },
        ],
        answer: 0,
        explain: 'Search, rerank, then build the prompt from the survivors.',
      },
      {
        id: 'e6-6-8',
        type: 'run-code',
        prompt: 'Set `top2` to the two ids with the highest reranker scores, best first.',
        before: 'scores = {"d2": 0.2, "d7": 0.8,\n          "d4": 0.5}',
        solution: 'top2 = sorted(scores, key=scores.get,\n              reverse=True)[:2]',
        tests: 'assert list(top2) == ["d7", "d4"], f"0.8 then 0.5; got {top2}"',
        maxLines: 2,
        placeholder: 'top2 = sorted(...)',
        explain: 'Sort by score, highest first, then slice.',
      },
    ],
  },

  // ------------------------------------------------------------------ 7
  {
    id: 'e6-07',
    title: 'Citing sources',
    summary: 'Label chunks with ids, ask for citations like [d2], and check in code that every citation was really sent.',
    card: {
      title: 'Citing sources',
      text: 'Label every chunk in the prompt with its id and ask the model to cite the ids it used, like [d2]. Then check the citations in code: every cited id must be one you sent, and an answer with no citation is unsupported. Citations let users check the answer and let you trace mistakes.',
      code: `import re
ans = "Within 14 days [d2]."
ids = re.findall(r"\\[(d\\d+)\\]", ans)
print(ids)`,
      output: "['d2']",
    },
    exercises: [
      {
        id: 'e6-7-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `import re
ans = "See [d1] and [d6]."
print(re.findall(r"\\[(d\\d+)\\]", ans))`,
        answer: "['d1', 'd6']",
        options: [
          { text: "['d1', 'd6']" },
          { text: "['[d1]', '[d6]']", why: 'The brackets in the pattern are outside the group, so only "d1" and "d6" are kept.' },
          { text: "['d1']", why: '`findall` returns every match, not just the first.' },
        ],
        explain: 'The group `(d\\d+)` is what comes back.',
      },
      {
        id: 'e6-7-2',
        type: 'predict-output',
        prompt: 'Were all the citations sent? What does this print?',
        code: `sent = {"d2", "d7"}
cited = ["d2", "d9"]
print(set(cited) <= sent)`,
        answer: 'False',
        options: [
          { text: 'False' },
          { text: 'True', why: 'd9 was never sent, so the cited set is not inside the sent set.' },
        ],
        explain: '`<=` on sets asks "is every item on the left also on the right?"',
      },
      {
        id: 'e6-7-3',
        type: 'fill-blank',
        prompt: 'Label a page for the prompt.',
        code: `d = sim.DOCS[3]
line = f"[{d[___]}] {d['title']}"
print(line)`,
        answer: ["'id'"],
        distractors: [
          { text: "'title'", why: 'The label should be the short id the model can cite, not the title.' },
          { text: "'text'", why: 'The label is the id; the text follows it.' },
        ],
        expectOutput: '[d4] Offline mode',
        explain: 'Short ids are easy for the model to copy exactly.',
      },
      {
        id: 'e6-7-4',
        type: 'mcq',
        prompt: 'The answer cites [d5], but you sent only d2 and d7. What do you do?',
        options: [
          { text: 'Treat the answer as unsupported' },
          { text: 'Trust it: the model must know d5', why: 'The model never saw d5 in this call, so the citation is made up.' },
          { text: 'Add d5 to the sources you show', why: 'That shows the user a source the answer did not come from.' },
        ],
        answer: 0,
        explain: 'A made-up citation is a strong sign the answer is made up too: refuse or retry.',
      },
      {
        id: 'e6-7-5',
        type: 'spot-bug',
        prompt: 'The citation parser returns single characters. Which line is wrong?',
        code: `import re
ans = "Yes [d2]."
ids = re.findall(r"[(d\\d+)]", ans)
assert ids == ["d2"], ids`,
        error: "AssertionError: ['d', '2']",
        answer: 2,
        raiseLine: 3,
        lineWhy: {
          '0': 'The `re` module is the right tool.',
          '1': 'The answer has one citation.',
          '3': 'The check is right: the result should be ["d2"].',
        },
        explain: 'Unescaped `[...]` is a character class: it matches one character. Escape the brackets: `\\[(d\\d+)\\]`.',
      },
      {
        id: 'e6-7-6',
        type: 'mcq',
        prompt: 'What do citations give the user?',
        options: [
          { text: 'A way to check the answer' },
          { text: 'A shorter, simpler answer', why: 'Citations add a little text; they do not shorten anything.' },
          { text: 'Better search results next time', why: 'Search is already done; citations come after.' },
        ],
        answer: 0,
        explain: 'And they give you a trace: which page led to a wrong answer.',
      },
      {
        id: 'e6-7-7',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `import re
PAT = r"\\[(d\\d+)\\]"
def supported(ans, sent):
    ids = set(re.findall(PAT, ans))
    return bool(ids) and ids <= sent

print(supported("Yes.", {"d2"}),
      supported("Yes [d2].", {"d2"}))`,
        answer: 'False True',
        options: [
          { text: 'False True' },
          { text: 'True True', why: 'With no citation, `ids` is empty, and `bool(ids)` is False.' },
          { text: 'False False', why: 'The second answer cites d2, which was sent.' },
        ],
        explain: 'No citation means no support.',
      },
      {
        id: 'e6-7-8',
        type: 'run-code',
        prompt: 'Set `ids` to the cited ids, each once, in order of first appearance.',
        before: `import re
PAT = r"\\[(d\\d+)\\]"
ans = "See [d3] or [d1], then [d3]."`,
        solution: 'found = re.findall(PAT, ans)\nids = list(dict.fromkeys(found))',
        tests: 'assert list(ids) == ["d3", "d1"], f"d3 first, d1 second, no repeats; got {ids}"',
        maxLines: 2,
        placeholder: 'found = re.findall(PAT, ans)',
        explain: '`dict.fromkeys` keeps the first appearance of each key, in order.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 'e6-08',
    title: 'Refusing',
    summary: 'Search always returns something; refuse when the best score is below a floor, and let the model say it does not know.',
    card: {
      title: 'Refusing',
      text: 'Search always returns its top k, even when nothing is relevant, and a model given irrelevant passages tends to make an answer up. So set a floor: if the best score is below it, say you cannot answer without calling the model, and tell the model to say so too when the passages lack the answer. Pick the floor by looking at the scores of good and bad matches on real questions.',
      code: `e = sim.embed("capital of France")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
best = max(score(d) for d in sim.DOCS)
if best < 0.5:
    print("refuse")`,
      output: 'refuse',
    },
    exercises: [
      {
        id: 'e6-8-1',
        type: 'mcq',
        prompt: 'A notes-app help bot is asked "what\'s the weather?". Search returns 3 pages. What should the bot do?',
        options: [
          { text: 'Say it cannot answer that from its pages' },
          { text: 'Answer from the top 3 pages anyway', why: 'None of them is about weather, so any answer would be made up.' },
          { text: 'Quote the highest-scoring page', why: 'The best of three irrelevant pages is still irrelevant.' },
        ],
        answer: 0,
        explain: 'A clear "I can\'t help with that" beats a confident wrong answer.',
      },
      {
        id: 'e6-8-2',
        type: 'predict-output',
        prompt: 'A floor of 0.9. What does this print?',
        code: `e = sim.embed("login link expired")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
best = max(score(d) for d in sim.DOCS)
print(round(best, 2), best >= 0.9)`,
        answer: '0.81 False',
        options: [
          { text: '0.81 False' },
          { text: '0.81 True', why: '0.81 is below the floor of 0.9.' },
          { text: '0.0 False', why: '"login" and "link" match the password page, so the best score is well above 0.' },
        ],
        explain: 'A fair question refused: this floor is too high. Choose it from data.',
      },
      {
        id: 'e6-8-3',
        type: 'mcq',
        prompt: 'On test questions, good matches score 0.6 to 0.9 and off-topic questions 0.0 to 0.3. Which floor?',
        options: [
          { text: 'About 0.45' },
          { text: 'About 0.95', why: 'That refuses every good match too.' },
          { text: 'About 0.1', why: 'That lets most off-topic questions through.' },
        ],
        answer: 0,
        explain: 'Between the two groups. Recheck it when documents or the embedding model change.',
      },
      {
        id: 'e6-8-4',
        type: 'fill-blank',
        prompt: 'Refuse below the floor.',
        code: `def reply(best, floor=0.5):
    if best ___ floor:
        return "I don't know."
    return "answer"

print(reply(0.2), reply(0.8))`,
        answer: ['<'],
        distractors: [
          { text: '>', why: 'That refuses the good matches and answers the bad ones.' },
          { text: '==', why: 'That refuses only an exact score of 0.5.' },
        ],
        expectOutput: "I don't know. answer",
        explain: 'Low best score: refuse.',
      },
      {
        id: 'e6-8-5',
        type: 'mcq',
        prompt: 'The best score clears the floor, but the passages do not actually contain the answer. What catches this?',
        options: [
          { text: 'Telling the model to say it does not know' },
          { text: 'Retrieving a larger top-k of chunks', why: 'More passages may still lack the answer, and add noise.' },
          { text: 'Making the chunks much shorter', why: 'Chunk size does not create a missing fact.' },
        ],
        answer: 0,
        explain: 'Two guards: a score floor before the call, and an instruction (plus a citation check) after.',
      },
      {
        id: 'e6-8-6',
        type: 'spot-bug',
        prompt: 'The bot must not call the model when nothing was retrieved. Which line breaks that?',
        code: `calls = []
def llm(q):
    calls.append(q)
    return "Paris"

def answer(q, hits):
    text = llm(q)
    if not hits:
        return "I don't know."
    return text

answer("capital?", [])
assert not calls, calls`,
        error: "AssertionError: ['capital?']",
        answer: 6,
        raiseLine: 12,
        lineWhy: {
          '0': 'A list to record calls is just for the check.',
          '1': 'A stand-in model is fine.',
          '2': 'Recording the call is how the check works.',
          '3': 'The stand-in reply does not matter.',
          '5': 'The function signature is fine.',
          '7': 'Checking for no hits is right, but it comes too late.',
          '8': 'Refusing is right.',
          '9': 'Returning the model\'s text is right when there are hits.',
          '11': 'Calling with no hits is the case being tested.',
          '12': 'The check is right: no model call should happen.',
        },
        explain: 'Check for hits first, then call the model: refusing should cost nothing.',
      },
      {
        id: 'e6-8-7',
        type: 'predict-output',
        prompt: 'Top 2 for an off-topic question. What does this print?',
        code: `e = sim.embed("capital of France")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
top = sorted(sim.DOCS, key=score)[-2:]
print(len(top))`,
        answer: '2',
        options: [
          { text: '2' },
          { text: '0', why: 'Sorting and slicing always returns k items, however low their scores.' },
        ],
        explain: 'Top-k has no notion of "nothing relevant": that is what the floor adds.',
      },
      {
        id: 'e6-8-8',
        type: 'run-code',
        prompt: 'Set `hits` to the ids of the pages that score at least `floor` (any order).',
        before: `e = sim.embed("reset my password")
floor = 0.5
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)`,
        solution: 'hits = [d["id"] for d in sim.DOCS\n        if score(d) >= floor]',
        tests: 'assert sorted(hits) == ["d1", "d6"], f"the two account pages clear 0.5; got {hits}"',
        maxLines: 2,
        placeholder: 'hits = [...]',
        explain: 'Filter by the floor first; then sort and keep k.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 'e6-09',
    title: 'Which stage failed?',
    summary: 'If the right chunk was not retrieved, retrieval failed; if it was there and the answer is still wrong, generation failed.',
    card: {
      title: 'Which stage failed?',
      text: 'When a RAG answer is wrong, first check whether the right chunk was retrieved. If it was missing, retrieval failed (fix chunking, search or k); if it was there and the answer is still wrong, generation failed (fix the prompt or the model). Log the retrieved ids with every answer so you can tell.',
      code: `log = {"q": "Refund on monthly?",
       "retrieved": ["d7", "d5"],
       "needed": "d2"}
ok = log["needed"] in log["retrieved"]
if ok:
    print("generation")
else:
    print("retrieval")`,
      output: 'retrieval',
    },
    exercises: [
      {
        id: 'e6-9-1',
        type: 'mcq',
        prompt: 'Q: "Can I get a refund on my monthly plan?" Retrieved: d2, the refund page ("Monthly plans are not refunded"). Answer: "Yes, within 14 days." Which stage failed?',
        options: [
          { text: 'Generation: the page says no' },
          { text: 'Retrieval: the wrong page', why: 'd2 is exactly the right page, and it was retrieved.' },
          { text: 'Chunking: the rule was split', why: 'The page states the monthly rule plainly in one passage.' },
        ],
        answer: 0,
        explain: 'The model had the answer and got it wrong: work on the prompt (or model), not on search.',
      },
      {
        id: 'e6-9-2',
        type: 'mcq',
        prompt: 'Q: "How do I reset my password?" Retrieved: d6, the two-factor page. Answer: "Use an authenticator app." Which stage failed?',
        options: [
          { text: 'Retrieval: the reset page was missed' },
          { text: 'Generation: the model ignored the page', why: 'It answered faithfully from what it was given; it was given the wrong page.' },
          { text: 'Neither: the answer is fine', why: 'An authenticator app does not reset a password.' },
        ],
        answer: 0,
        explain: 'Garbage in, garbage out. Hybrid search would have found d1.',
      },
      {
        id: 'e6-9-3',
        type: 'mcq',
        prompt: 'Retrieval keeps missing pages that contain the exact product name asked about. What is the fix?',
        options: [
          { text: 'Add keyword search (hybrid)' },
          { text: 'Use a larger language model', why: 'The model never sees the page; the miss happens before it.' },
          { text: 'Raise the temperature', why: 'Temperature affects generation, not which pages are found.' },
        ],
        answer: 0,
        explain: 'Exact names are keyword search\'s strength.',
      },
      {
        id: 'e6-9-4',
        type: 'mcq',
        prompt: 'The right chunk is retrieved, but at rank 9, and you keep k = 5. Which stage, and what fix?',
        options: [
          { text: 'Retrieval: raise k or add a reranker' },
          { text: 'Generation: improve the prompt', why: 'The chunk never reaches the prompt, so prompt changes cannot help.' },
        ],
        answer: 0,
        explain: 'Retrieve more, rerank, keep the best 5.',
      },
      {
        id: 'e6-9-5',
        type: 'predict-output',
        prompt: 'Measure retrieval on its own. What does this print?',
        code: `cases = [("d2", ["d2", "d7"]),
         ("d1", ["d6", "d5"]),
         ("d4", ["d4", "d3"])]
hit = [n in got for n, got in cases]
print(sum(hit), "of", len(hit))`,
        answer: '2 of 3',
        options: [
          { text: '2 of 3' },
          { text: '3 of 3', why: 'd1 was needed, but only d6 and d5 were retrieved.' },
          { text: '1 of 3', why: 'd2 and d4 were both retrieved.' },
        ],
        explain: 'Retrieval hit rate: did the needed page make it into the results? Measure it apart from answer quality.',
      },
      {
        id: 'e6-9-6',
        type: 'fill-blank',
        prompt: 'Name the stage that failed.',
        code: `def stage(needed, retrieved):
    if needed ___ retrieved:
        return "retrieval"
    return "generation"

print(stage("d1", ["d6"]))`,
        answer: ['not in'],
        distractors: [
          { text: 'in', why: 'Found means retrieval worked, so a wrong answer is generation\'s fault.' },
          { text: '==', why: 'That compares an id with a whole list.' },
        ],
        expectOutput: 'retrieval',
        explain: 'Missing from the results means retrieval failed.',
      },
      {
        id: 'e6-9-7',
        type: 'mcq',
        prompt: 'Why log the retrieved ids with every answer?',
        options: [
          { text: 'To tell retrieval failures from generation ones' },
          { text: 'To make the next search faster', why: 'Logs are for diagnosis, not caching.' },
          { text: 'Because the model needs them next time', why: 'Each call starts fresh; the model never reads your logs.' },
        ],
        answer: 0,
        explain: 'Without the ids, a wrong answer could have come from either stage.',
      },
      {
        id: 'e6-9-8',
        type: 'run-code',
        prompt: 'Set `misses` to the questions whose needed page was not retrieved.',
        before: `logs = [
    {"q": "refund?", "need": "d2",
     "got": ["d2", "d7"]},
    {"q": "reset?", "need": "d1",
     "got": ["d6"]},
]`,
        solution: 'misses = [L["q"] for L in logs\n    if L["need"] not in L["got"]]',
        tests: 'assert misses == ["reset?"], f"only the reset question missed its page; got {misses}"',
        maxLines: 2,
        placeholder: 'misses = [...]',
        explain: 'These are the retrieval failures to work on.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 'e6-10',
    title: 'Checkpoint',
    checkpoint: true,
    summary: 'You can build each stage of retrieval and say which stage a bad answer came from.',
    card: {
      title: 'Checkpoint',
      text: 'Everything from this unit, mixed together. For each one, ask which stage it is about: chunking, search, reranking, the floor, citing, or generation.',
    },
    exercises: [
      {
        id: 'e6-10-1',
        type: 'mcq',
        prompt: 'Q: "Refund on an annual plan?" Retrieved: d2. Answer: "Within 14 days of purchase [d2]." Which stage failed?',
        options: [
          { text: 'Neither: it is right and cited' },
          { text: 'Retrieval: it found the wrong page', why: 'd2 is the refund page, and it was retrieved.' },
          { text: 'Generation: the model misread it', why: 'The page says annual plans can be refunded within 14 days, and the answer cites it.' },
        ],
        answer: 0,
        explain: 'Not every trace is a failure: check before fixing.',
      },
      {
        id: 'e6-10-2',
        type: 'predict-output',
        prompt: 'Type how many chunks.',
        code: `def chunk(ws, size, step):
    starts = range(0, len(ws), step)
    return [ws[i:i + size]
            for i in starts]

print(len(chunk(list(range(12)),
                4, 4)))`,
        answer: '3',
        typedWrong: [{ answer: '4', why: 'With step 4, chunks start at 0, 4 and 8: three of them.' }],
        explain: 'No overlap: 12 words in chunks of 4.',
      },
      {
        id: 'e6-10-3',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def rrf(lists, k=60):
    s = {}
    for L in lists:
        for r, i in enumerate(L, 1):
            old = s.get(i, 0)
            s[i] = old + 1 / (k + r)
    return sorted(s, key=s.get,
                  reverse=True)

print(rrf([["x"], ["y", "x"]])[0])`,
        answer: 'x',
        options: [
          { text: 'x' },
          { text: 'y', why: 'y is first in one list (1/61); x gets 1/61 + 1/62.' },
        ],
        explain: 'Found by both searches beats found by one.',
      },
      {
        id: 'e6-10-4',
        type: 'mcq',
        prompt: 'Users ask the same thing many ways: "stop paying", "end my subscription", "quit the plan". Which search handles that best?',
        options: [
          { text: 'Vector search' },
          { text: 'Keyword search', why: 'The phrasings share few words with each other or with the page.' },
        ],
        answer: 0,
        explain: 'Paraphrases are where embeddings shine.',
      },
      {
        id: 'e6-10-5',
        type: 'fill-blank',
        prompt: 'Keep the pages that clear the floor.',
        code: `e = sim.embed("work offline")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
ok = [d["id"] for d in sim.DOCS
      if score(d) ___ 0.5]
print(ok)`,
        answer: ['>='],
        distractors: [
          { text: '<', why: 'That keeps the pages that fail the floor.' },
          { text: '==', why: 'Hardly any score is exactly 0.5.' },
        ],
        expectOutput: "['d4']",
        explain: 'Only the offline page clears 0.5.',
      },
      {
        id: 'e6-10-6',
        type: 'spot-bug',
        prompt: 'The citation check rejects a good answer. Which line is wrong?',
        code: `sent = {"d2", "d7"}
ids = {"d2"}
ok = sent <= ids
assert ok, "d2 was sent"`,
        error: 'AssertionError: d2 was sent',
        answer: 2,
        raiseLine: 3,
        lineWhy: {
          '0': 'Two pages were sent.',
          '1': 'The answer cites one of them.',
          '3': 'The check is right: citing d2 is fine.',
        },
        explain: 'Cited must be inside sent: `ids <= sent`. Citing fewer pages than were sent is normal.',
      },
      {
        id: 'e6-10-7',
        type: 'predict-output',
        prompt: 'Type what this prints.',
        code: `judge = {"d1": 0.2, "d4": 0.6,
         "d6": 0.9}
print(sorted(judge, key=judge.get,
             reverse=True)[0])`,
        answer: 'd6',
        explain: 'The reranker\'s favourite: 0.9.',
      },
      {
        id: 'e6-10-8',
        type: 'mcq',
        prompt: 'Your eval shows the needed page is retrieved 95% of the time, but 30% of answers are wrong. Where do you work first?',
        options: [
          { text: 'Generation: the prompt and model' },
          { text: 'Retrieval: search and chunking', why: 'Retrieval is nearly always finding the page; most errors happen after.' },
        ],
        answer: 0,
        explain: 'Measure the stages separately, then fix the one that fails most.',
      },
      {
        id: 'e6-10-9',
        type: 'match-pairs',
        prompt: 'Match each problem to its fix.',
        pairs: [
          { left: 'exact error codes missed', right: 'add keyword search', why: 'Codes need exact matching.' },
          { left: 'right chunk at rank 20', right: 'retrieve more, then rerank', why: 'Get it into the pool, then let the reranker lift it.' },
          { left: 'answers to off-topic questions', right: 'a score floor', why: 'Refuse when nothing scores well.' },
          { left: 'rules cut mid-sentence', right: 'chunk overlap', why: 'Neighbours share text, so nothing is cut off.' },
        ],
        explain: 'Each stage has its own typical failure and fix.',
      },
      {
        id: 'e6-10-10',
        type: 'run-code',
        prompt: 'Set `ok` to True if the best page scores at least `floor`, else False.',
        before: `e = sim.embed("capital of France")
floor = 0.5
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)`,
        solution: 'top = max(map(score, sim.DOCS))\nok = top >= floor',
        tests: 'assert ok is False or ok == False, f"nothing scores above 0 for this question; got {ok}"\nassert isinstance(ok, bool), "make ok a bool"',
        maxLines: 2,
        placeholder: 'top = ...',
        explain: 'False: refuse without calling the model.',
      },
    ],
  },
];
