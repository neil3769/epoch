import { e6Labs } from '../labs/e6';
import { e6Library } from '../library/e6';
import type { Unit } from '../schema';
import { e6More } from './e6-more';

/*
 * E6 Retrieval (RAG). Lessons 1 to 5: retrieve then generate, chunking,
 * vector search, keyword search, hybrid search with reciprocal rank fusion.
 * Lessons 6 to 10 are in e6-more.ts. Examples run against sim.DOCS, a small
 * help centre with toy 8-number topic embeddings.
 */
export const e6: Unit = {
  id: 'E6',
  track: 'engineering',
  title: 'Retrieval (RAG)',
  blurb: 'Chunk, embed and search your documents; combine keyword and vector search, rerank, cite sources, refuse when nothing fits, and tell retrieval failures from generation ones.',
  prelude: 'import epoch_sim as sim',
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'e6-01',
      title: 'Retrieve, then generate',
      summary: 'RAG finds the passages relevant to a question and puts them in the prompt, so the model answers from them.',
      card: {
        title: 'Retrieve, then generate',
        text: 'A model knows only its training data, so it cannot answer from your private or recent documents. Retrieval-augmented generation (RAG) finds the passages most relevant to the question and puts them in the prompt, so the model answers from them. This unit is about doing those two steps well.',
        code: `q = "Can I get a refund?"
e = sim.embed(q)
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
top = max(sim.DOCS, key=score)
print(top["id"], top["title"])`,
        output: 'd2 Refund policy',
      },
      exercises: [
        {
          id: 'e6-1-1',
          type: 'mcq',
          prompt: 'A support bot must answer from your help pages, which change every week. What is the best first approach?',
          options: [
            { text: 'Retrieve the relevant pages into the prompt' },
            { text: 'Fine-tune the model on the help pages', why: 'Weekly changes would mean weekly retraining, and the model could not show which page it used.' },
            { text: 'Paste every page into every prompt', why: 'That costs tokens on every call, may not fit, and buries the relevant page in noise.' },
          ],
          answer: 0,
          explain: 'Retrieval reads the current pages at question time; updating a page updates the answers.',
        },
        {
          id: 'e6-1-2',
          type: 'match-pairs',
          prompt: 'Match each stage of a RAG pipeline to its job.',
          pairs: [
            { left: 'chunk', right: 'split pages into passages', why: 'Done once, when documents are added.' },
            { left: 'embed', right: 'turn text into a vector', why: 'For every chunk ahead of time, and for each question.' },
            { left: 'retrieve', right: 'find the closest passages', why: 'Search over the stored vectors (and keywords).' },
            { left: 'generate', right: 'answer from the passages', why: 'The model reads the question and the retrieved text.' },
          ],
          explain: 'Two halves: indexing (chunk, embed) ahead of time, then retrieve and generate per question.',
        },
        {
          id: 'e6-1-3',
          type: 'predict-output',
          prompt: 'Which page does search pick? What does this print?',
          code: `q = "Can I work without internet?"
e = sim.embed(q)
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
best = max(sim.DOCS, key=score)
print(best["title"])`,
          answer: 'Offline mode',
          options: [
            { text: 'Offline mode' },
            { text: 'Exporting your data', why: 'Nothing about exports is asked; "internet" is an offline-topic word.' },
            { text: 'Sharing a notebook', why: 'The question shares no topic with sharing.' },
          ],
          explain: '"internet" belongs to the offline topic, so the offline page points the same way as the question.',
        },
        {
          id: 'e6-1-4',
          type: 'mcq',
          prompt: 'What does putting retrieved passages in the prompt change?',
          options: [
            { text: 'The model can answer from your text' },
            { text: 'The model is retrained on them', why: 'Nothing is learned: the weights are unchanged, and the next call starts fresh.' },
            { text: 'The model answers faster', why: 'A longer prompt takes slightly longer, if anything.' },
          ],
          answer: 0,
          explain: 'The passages are context for this one call only.',
        },
        {
          id: 'e6-1-5',
          type: 'fill-blank',
          prompt: 'Take the page\'s text, to put in the prompt.',
          code: `doc = sim.DOCS[1]
src = doc[___]
print(src[:12])`,
          answer: ['"text"'],
          distractors: [
            { text: '"embedding"', why: 'That is the vector used for search, not words for the model.' },
            { text: '"id"', why: 'The id labels the page; the model needs its text.' },
          ],
          expectOutput: 'Annual plans',
          explain: 'Search uses the embedding; the prompt gets the text (and the id, for citing).',
        },
        {
          id: 'e6-1-6',
          type: 'mcq',
          prompt: 'Which request does retrieval not help with?',
          options: [
            { text: 'Rewrite this sentence more politely' },
            { text: 'How long is our refund window?', why: 'That depends on your refund page, which only retrieval can supply.' },
            { text: 'Which plan has no note limit?', why: 'That fact lives on your pricing page.' },
          ],
          answer: 0,
          explain: 'Retrieval adds facts. A task that needs no outside facts gains nothing.',
        },
        {
          id: 'e6-1-7',
          type: 'mcq',
          prompt: 'Your documents total 2 million tokens; the model\'s context holds 200,000. What does retrieval do here?',
          options: [
            { text: 'Picks the few passages that matter' },
            { text: 'Compresses all documents into the window', why: 'Retrieval selects; it does not compress.' },
            { text: 'Nothing: the model reads the rest itself', why: 'The model sees only what is in its prompt.' },
          ],
          answer: 0,
          explain: 'Even when everything fits, sending only the relevant part is cheaper and usually more accurate.',
        },
        {
          id: 'e6-1-8',
          type: 'run-code',
          prompt: 'Set `best` to the id of the page most similar to the question.',
          before: `e = sim.embed("Can I share notes?")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)`,
          solution: 'best = max(sim.DOCS, key=score)["id"]',
          tests: 'assert best == "d5", f"the sharing page is d5, got {best!r}"',
          placeholder: 'best = ...',
          explain: 'The highest cosine score wins.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'e6-02',
      title: 'Chunking',
      summary: 'Documents are split into overlapping chunks of a few hundred tokens; each chunk is searched on its own.',
      card: {
        title: 'Chunking',
        text: 'Long documents are split into chunks of a few hundred tokens, and each chunk is embedded and retrieved on its own. Too large and a chunk mixes topics and wastes the prompt; too small and it loses the context needed to answer. A small overlap between neighbouring chunks keeps an answer from being cut in half.',
        code: `def chunk(ws, size, step):
    starts = range(0, len(ws), step)
    return [ws[i:i + size]
            for i in starts]

w = "a b c d e f g".split()
for c in chunk(w, 3, 2):
    print(" ".join(c))`,
        output: 'a b c\nc d e\ne f g\ng',
      },
      exercises: [
        {
          id: 'e6-2-1',
          type: 'predict-output',
          prompt: 'No overlap this time. What does this print?',
          code: `def chunk(ws, size, step):
    starts = range(0, len(ws), step)
    return [ws[i:i + size]
            for i in starts]

w = "a b c d e f g".split()
for c in chunk(w, 3, 3):
    print(" ".join(c))`,
          answer: 'a b c\nd e f\ng',
          options: [
            { text: 'a b c\nd e f\ng' },
            { text: 'a b c\nc d e\ne f g\ng', why: 'That is a step of 2. With the step equal to the size, chunks meet end to end.' },
            { text: 'a b c\nd e f', why: 'The last chunk can be short: "g" is still kept.' },
          ],
          explain: 'Step = size means no overlap.',
        },
        {
          id: 'e6-2-2',
          type: 'predict-output',
          prompt: 'How many chunks? Type the number.',
          code: `def chunk(ws, size, step):
    starts = range(0, len(ws), step)
    return [ws[i:i + size]
            for i in starts]

print(len(chunk(list(range(10)),
                4, 2)))`,
          answer: '5',
          typedWrong: [{ answer: '3', why: 'Chunks start every 2 words (0, 2, 4, 6, 8), not every 4.' }],
          explain: 'One chunk per start position: 0, 2, 4, 6 and 8.',
        },
        {
          id: 'e6-2-3',
          type: 'mcq',
          prompt: 'You make every chunk 5,000 tokens. What goes wrong?',
          options: [
            { text: 'Chunks mix topics and fill the prompt' },
            { text: 'The embeddings get more precise', why: 'One vector for many topics is less precise: it averages them.' },
            { text: 'Nothing: bigger chunks are safer', why: 'Each retrieved chunk brings mostly irrelevant text, costing tokens and attention.' },
          ],
          answer: 0,
          explain: 'A few hundred tokens, around one idea per chunk, is the usual starting point.',
        },
        {
          id: 'e6-2-4',
          type: 'mcq',
          prompt: 'A rule says "refunds within 14 days" and the next sentence adds "except plans bought in a sale". Chunking splits between them. What helps most?',
          options: [
            { text: 'Overlap, or splitting at paragraph ends' },
            { text: 'Smaller chunks, so each holds one rule', why: 'Smaller chunks split related sentences apart more often, not less.' },
            { text: 'A lower temperature for the model', why: 'Temperature affects generation; the exception never reached the model.' },
          ],
          answer: 0,
          explain: 'Keep ideas together: split on structure, and let neighbours overlap.',
        },
        {
          id: 'e6-2-5',
          type: 'fill-blank',
          prompt: 'Chunks of 200 words that overlap by 50. How far apart do they start?',
          code: `size, overlap = 200, 50
step = size ___ overlap
print(step)`,
          answer: ['-'],
          distractors: [
            { text: '+', why: 'A step of 250 is longer than a chunk: 50 words between chunks would be skipped.' },
            { text: '//', why: '200 // 50 is 4: chunks would almost entirely repeat each other.' },
          ],
          expectOutput: '150',
          explain: 'Each chunk starts 150 words after the last, so 50 words are shared.',
        },
        {
          id: 'e6-2-6',
          type: 'spot-bug',
          prompt: 'Some words never land in any chunk. Which line causes it?',
          code: `words = list(range(10))
size, step = 3, 4
chunks = [words[i:i + size]
          for i in range(0, 10, step)]
flat = sum(chunks, [])
assert 3 in flat, chunks`,
          error: 'AssertionError: [[0, 1, 2], [4, 5, 6], [8, 9]]',
          answer: 1,
          raiseLine: 5,
          lineWhy: {
            '0': 'Ten words is fine.',
            '2': 'Slicing size words from each start is right.',
            '3': 'Starting every `step` words is right; the step itself is too big.',
            '4': 'Flattening the chunks is just for the check.',
            '5': 'The check is right: every word should be in some chunk.',
          },
          explain: 'A step larger than the size leaves gaps. The step must be at most the size.',
        },
        {
          id: 'e6-2-7',
          type: 'predict-output',
          prompt: 'Splitting on structure. What does this print?',
          code: `text = "Intro.\\n\\nRefunds: 14 days."
parts = text.split("\\n\\n")
print(len(parts), parts[1])`,
          answer: '2 Refunds: 14 days.',
          options: [
            { text: '2 Refunds: 14 days.' },
            { text: '1 Intro.', why: 'The blank line between paragraphs splits the text in two.' },
            { text: '3 Refunds: 14 days.', why: 'One blank line, so two parts.' },
          ],
          explain: 'Paragraph breaks are natural chunk boundaries: they keep each idea whole.',
        },
        {
          id: 'e6-2-8',
          type: 'run-code',
          prompt: 'Set `chunks` to lists of 4 words starting every 2 words (at 0, 2 and 4).',
          before: 'text = "one two three four five six"\nwords = text.split()',
          solution: 'chunks = [words[i:i + 4]\n          for i in range(0, 6, 2)]',
          tests: [
            'assert len(chunks) == 3, f"three chunks, got {len(chunks)}"',
            'assert chunks[0] == ["one", "two", "three", "four"], f"first chunk: {chunks[0]}"',
            'assert chunks[1][0] == "three", "the second chunk starts at word 2"',
            'assert chunks[2] == ["five", "six"], f"the last chunk is short: {chunks[2]}"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'chunks = [...]',
          explain: 'Size 4, step 2: each pair of neighbours shares two words.',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'e6-03',
      title: 'Vector search',
      summary: 'Embed every chunk once; at question time embed the question and keep the k chunks with the highest cosine.',
      card: {
        title: 'Vector search',
        text: 'Every chunk is embedded once, ahead of time, and stored; at question time only the question is embedded. Scoring the stored vectors by cosine similarity and keeping the top k is vector search. It matches meaning, so "get my money back" finds the refund page with no words in common.',
        code: `e = sim.embed("get my money back")
for d in sim.DOCS[:3]:
    v = d["embedding"]
    s = sim.cosine(e, v)
    print(d["id"], round(s, 2))`,
        output: 'd1 0.0\nd2 1.0\nd3 0.0',
      },
      exercises: [
        {
          id: 'e6-3-1',
          type: 'predict-output',
          prompt: 'The top two. What does this print?',
          code: `e = sim.embed("security key")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
top = sorted(sim.DOCS, key=score,
             reverse=True)[:2]
print([d["id"] for d in top])`,
          answer: "['d6', 'd1']",
          options: [
            { text: "['d6', 'd1']" },
            { text: "['d1', 'd6']", why: 'Both are account pages, but d6 (two-factor) is more purely about security.' },
            { text: "['d6']", why: '`[:2]` keeps two results.' },
          ],
          explain: 'The two account pages; two-factor first.',
        },
        {
          id: 'e6-3-2',
          type: 'mcq',
          prompt: 'When are the chunks\' embeddings computed?',
          options: [
            { text: 'Once, when the documents are added' },
            { text: 'Again for every question', why: 'Chunks do not change between questions, so that would waste time and money.' },
            { text: 'Never: only questions are embedded', why: 'Chunks need vectors too, or there is nothing to compare with.' },
          ],
          answer: 0,
          explain: 'Store them; re-embed a chunk only when it changes.',
        },
        {
          id: 'e6-3-3',
          type: 'fill-blank',
          prompt: 'Most similar first.',
          code: `e = sim.embed("work offline")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
top = sorted(sim.DOCS, key=score,
             reverse=___)
print(top[0]["id"])`,
          answer: ['True'],
          distractors: [{ text: 'False', why: 'Ascending order puts the least similar page first.' }],
          expectOutput: 'd4',
          explain: 'Highest score first, then take the first k.',
        },
        {
          id: 'e6-3-4',
          type: 'predict-output',
          prompt: 'What is an embedding, as data? What does this print?',
          code: `e = sim.embed("export notes as pdf")
total = sum(x * x for x in e)
print(len(e), round(total, 2))`,
          answer: '8 1.0',
          options: [
            { text: '8 1.0' },
            { text: '4 1.0', why: 'The length is the number of dimensions (8 here), not the number of words.' },
            { text: '8 8.0', why: 'The vector is scaled to length 1, so its squares add up to 1.' },
          ],
          explain: 'A fixed-length unit vector. Real embeddings have hundreds of dimensions.',
        },
        {
          id: 'e6-3-5',
          type: 'mcq',
          prompt: 'You keep the top k = 3 chunks, but the answer needs facts from 5 chunks. What happens?',
          options: [
            { text: 'Facts from 2 chunks never reach the model' },
            { text: 'The model fetches the other 2 itself', why: 'The model sees only the prompt; it cannot search.' },
            { text: 'The scores rise to make up for it', why: 'Scores depend on the question and chunks, not on k.' },
          ],
          answer: 0,
          explain: 'k is a trade-off: too small misses facts, too large adds noise and cost.',
        },
        {
          id: 'e6-3-6',
          type: 'predict-output',
          prompt: 'A question the help centre cannot answer. What does this print?',
          code: `e = sim.embed("capital of France")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
print(max(score(d) for d in sim.DOCS))`,
          answer: '0.0',
          options: [
            { text: '0.0' },
            { text: '1.0', why: 'No topic word appears, so the question shares no direction with any page.' },
          ],
          explain: 'Yet `sorted(...)[:k]` would still return k pages. Lesson 8 deals with that.',
        },
        {
          id: 'e6-3-7',
          type: 'mcq',
          prompt: 'What is a vector database\'s main job?',
          options: [
            { text: 'Finding the nearest vectors quickly' },
            { text: 'Writing the answer from the chunks', why: 'That is the model\'s job; the database only finds chunks.' },
            { text: 'Training the embedding model', why: 'Embedding models are trained elsewhere; the database stores and searches vectors.' },
          ],
          answer: 0,
          explain: 'With millions of chunks, scoring every one is too slow; an index finds the nearest ones fast.',
        },
        {
          id: 'e6-3-8',
          type: 'run-code',
          prompt: 'Set `scores` to a dict from each page id to its score.',
          before: `e = sim.embed("invite editors")
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)`,
          solution: 'scores = {d["id"]: score(d)\n          for d in sim.DOCS}',
          tests: [
            'assert len(scores) == 7, f"one score per page, got {len(scores)}"',
            'assert max(scores, key=scores.get) == "d5", "the sharing page should score highest"',
          ].join('\n'),
          maxLines: 2,
          placeholder: 'scores = {...}',
          explain: 'A dict comprehension: id to score.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'e6-04',
      title: 'Keyword search',
      summary: 'Keyword search scores chunks by the query words they contain (BM25); it wins on exact terms that embeddings blur.',
      card: {
        title: 'Keyword search',
        text: 'Keyword search scores a chunk by the query words it contains, giving more weight to rare words; BM25 is the standard formula. It wins on exact terms that embeddings blur, such as product names, error codes and IDs. It fails when the question and the page use different words for the same thing.',
        code: `def kw(q, d):
    t = d["text"].lower()
    ws = q.lower().split()
    return sum(w in t for w in ws)

print(kw("paid plan", sim.DOCS[6]))`,
        output: '2',
      },
      exercises: [
        {
          id: 'e6-4-1',
          type: 'predict-output',
          prompt: 'Vector search on a pricing question. What does this print?',
          code: `q = "What does the paid plan cost?"
e = sim.embed(q)
def score(d):
    v = d["embedding"]
    return sim.cosine(e, v)
best = max(sim.DOCS, key=score)
print(best["title"])`,
          answer: 'Refund policy',
          options: [
            { text: 'Refund policy' },
            { text: 'Plans and pricing', why: 'The embedding sees only "billing", and the refund page is the purest billing page.' },
          ],
          explain: 'Embeddings blur nearby topics. Keyword search on "paid plan" pins the pricing page (d7).',
        },
        {
          id: 'e6-4-2',
          type: 'mcq',
          prompt: 'Users search for the error code `E-4012`. Which search finds the page that mentions it?',
          options: [
            { text: 'Keyword search' },
            { text: 'Vector search', why: 'A code like E-4012 carries little meaning, so its embedding lands near any error page.' },
            { text: 'Either one, equally well', why: 'Exact strings are what keyword search is for.' },
          ],
          answer: 0,
          explain: 'Codes, names and IDs need exact matching.',
        },
        {
          id: 'e6-4-3',
          type: 'mcq',
          prompt: 'The question is "how do I stop paying?" and the page says "you can cancel at any time". Which search finds it?',
          options: [
            { text: 'Vector search' },
            { text: 'Keyword search', why: 'They share no words: "stop paying" and "cancel" mean the same but are spelled differently.' },
          ],
          answer: 0,
          explain: 'Paraphrases are what embeddings are for.',
        },
        {
          id: 'e6-4-4',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `def kw(q, d):
    t = d["text"].lower()
    ws = q.lower().split()
    return sum(w in t for w in ws)

q = "reset password"
print(kw(q, sim.DOCS[0]),
      kw(q, sim.DOCS[5]))`,
          answer: '2 0',
          options: [
            { text: '2 0' },
            { text: '1 1', why: 'd1 (index 0) has both words; the two-factor page (index 5) has neither.' },
            { text: '0 2', why: 'Index 0 is d1, the password page.' },
          ],
          explain: 'Vector search ranked the two-factor page above this one; keyword search gets it right.',
        },
        {
          id: 'e6-4-5',
          type: 'mcq',
          prompt: 'Why does BM25 count a match on "refund" for more than a match on "the"?',
          options: [
            { text: '"the" is in almost every page' },
            { text: '"refund" is a longer word', why: 'Length does not matter; rarity across the collection does.' },
            { text: '"refund" appears earlier in the query', why: 'Word order in the query does not matter to BM25.' },
          ],
          answer: 0,
          explain: 'A rare word says much more about which page is relevant.',
        },
        {
          id: 'e6-4-6',
          type: 'fill-blank',
          prompt: 'Match words whatever their case.',
          code: `d = sim.DOCS[1]
t = d["text"].___()
print("annual" in t)`,
          answer: ['lower'],
          distractors: [
            { text: 'upper', why: '"ANNUAL PLANS..." does not contain the lower-case "annual".' },
            { text: 'strip', why: '`strip` removes outer spaces; the text still starts with "Annual".' },
          ],
          expectOutput: 'True',
          explain: 'Lower-case both sides before comparing.',
        },
        {
          id: 'e6-4-7',
          type: 'match-pairs',
          prompt: 'Which search suits each query better?',
          pairs: [
            { left: 'error E-4012', right: 'keyword: an exact code', why: 'A code has to match letter for letter.' },
            { left: 'my notes vanished offline', right: 'vector: a described problem', why: 'The page may say "sync" and "reconnect" instead.' },
            { left: 'order 88213', right: 'keyword: an exact ID', why: 'An ID carries no meaning for an embedding.' },
            { left: 'how do I stop paying', right: 'vector: a paraphrase', why: 'The page says "cancel".' },
          ],
          explain: 'Most real queries mix both kinds, which is why the next lesson combines them.',
        },
        {
          id: 'e6-4-8',
          type: 'run-code',
          prompt: 'Set `best` to the id of the page with the highest keyword score.',
          before: `def kw(q, d):
    t = d["text"].lower()
    ws = q.lower().split()
    return sum(w in t for w in ws)

def s(d):
    return kw("reset password", d)`,
          solution: 'best = max(sim.DOCS, key=s)["id"]',
          tests: 'assert best == "d1", f"the password page is d1, got {best!r}"',
          placeholder: 'best = ...',
          explain: 'Same `max` as vector search; only the score changes.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'e6-05',
      title: 'Hybrid search',
      summary: 'Run keyword and vector search and merge their rankings with reciprocal rank fusion.',
      card: {
        title: 'Hybrid search',
        text: 'Hybrid search runs keyword and vector search and merges their rankings, so each covers the other\'s misses. Reciprocal rank fusion (RRF) gives each result 1 / (60 + rank) from every list it appears in, and sorts by the total. It uses ranks, not raw scores, so the two very different score scales never need to be matched.',
        code: `def rrf(lists, k=60):
    s = {}
    for L in lists:
        for r, i in enumerate(L, 1):
            old = s.get(i, 0)
            s[i] = old + 1 / (k + r)
    return sorted(s, key=s.get,
                  reverse=True)

print(rrf([["d7"], ["d2", "d7"]]))`,
        output: "['d7', 'd2']",
      },
      exercises: [
        {
          id: 'e6-5-1',
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

print(rrf([["a", "b"], ["b", "c"]]))`,
          answer: "['b', 'a', 'c']",
          options: [
            { text: "['b', 'a', 'c']" },
            { text: "['a', 'b', 'c']", why: 'a is first in one list only; b appears in both, so its two shares add up to more.' },
            { text: "['b', 'c', 'a']", why: 'a and c each appear once, but a ranks 1st (1/61) and c 2nd (1/62).' },
          ],
          explain: 'b: 1/62 + 1/61. a: 1/61. c: 1/62.',
        },
        {
          id: 'e6-5-2',
          type: 'mcq',
          prompt: 'Why does RRF combine ranks instead of adding the raw scores?',
          options: [
            { text: 'The two scores are on different scales' },
            { text: 'Ranks are faster to add up and sort', why: 'Both are cheap; the problem is that BM25 and cosine scores cannot be compared.' },
            { text: 'Raw scores are always negative', why: 'Neither BM25 nor cosine scores are always negative.' },
          ],
          answer: 0,
          explain: 'A BM25 score of 12 and a cosine of 0.8 cannot be added meaningfully; ranks can.',
        },
        {
          id: 'e6-5-3',
          type: 'fill-blank',
          prompt: 'RRF counts ranks from 1. What is y\'s share?',
          code: `s = 0
L = ["x", "y"]
for r, i in enumerate(L, ___):
    if i == "y":
        s = 1 / (60 + r)
print(round(s, 4))`,
          answer: ['1'],
          distractors: [
            { text: '0', why: 'Counting from 0 makes y rank 1 instead of 2: 1/61.' },
            { text: '2', why: 'Starting at 2 makes y rank 3: 1/63.' },
          ],
          expectOutput: '0.0161',
          explain: 'y is 2nd: 1 / (60 + 2).',
        },
        {
          id: 'e6-5-4',
          type: 'mcq',
          prompt: 'Keyword search finds only d1. Vector search ranks d6 first and d1 second. Which comes first after RRF?',
          options: [
            { text: 'd1, found by both' },
            { text: 'd6, the top vector result', why: 'd6 gets only 1/61; d1 gets 1/61 + 1/62.' },
            { text: 'A tie between them', why: 'd1 has a share from each list, so it is ahead.' },
          ],
          answer: 0,
          explain: 'This is the "reset my password" case: hybrid search fixes vector search\'s miss.',
          check: 'assert 1 / 61 + 1 / 62 > 1 / 61',
        },
        {
          id: 'e6-5-5',
          type: 'predict-output',
          prompt: 'Three lists. What does this print?',
          code: `def rrf(lists, k=60):
    s = {}
    for L in lists:
        for r, i in enumerate(L, 1):
            old = s.get(i, 0)
            s[i] = old + 1 / (k + r)
    return sorted(s, key=s.get,
                  reverse=True)

print(rrf([["a", "b"], ["b", "c"],
           ["c", "b"]]))`,
          answer: "['b', 'c', 'a']",
          options: [
            { text: "['b', 'c', 'a']" },
            { text: "['a', 'b', 'c']", why: 'a is in one list only; b is in all three.' },
            { text: "['b', 'a', 'c']", why: 'c is in two lists (1/62 + 1/61), a in only one (1/61).' },
          ],
          explain: 'Appearing in many lists beats one top spot.',
        },
        {
          id: 'e6-5-6',
          type: 'spot-bug',
          prompt: 'The fused ranking comes out worst first. Which line is wrong?',
          code: `def rrf(lists, k=60):
    s = {}
    for L in lists:
        for r, i in enumerate(L, 1):
            old = s.get(i, 0)
            s[i] = old + 1 / (k + r)
    return sorted(s, key=s.get)

top = rrf([["a"], ["a", "b"]])[0]
assert top == "a", top`,
          error: 'AssertionError: b',
          answer: 6,
          raiseLine: 9,
          lineWhy: {
            '0': 'k = 60 is the usual constant.',
            '1': 'An empty dict of totals is right.',
            '2': 'Looping over every ranking is right.',
            '3': 'Ranks from 1 are right.',
            '4': 'Reading the running total is right.',
            '5': 'Adding 1 / (k + rank) is the RRF formula.',
            '8': 'Taking the first id is right once the order is.',
            '9': 'The check is right: a is in both lists.',
          },
          explain: 'Higher totals are better: sort with `reverse=True`.',
        },
        {
          id: 'e6-5-7',
          type: 'mcq',
          prompt: 'Hybrid search costs more than vector search alone. When is it most worth it?',
          options: [
            { text: 'When queries mix meaning and exact terms' },
            { text: 'When every document is very short', why: 'Length is not the point; the kinds of queries are.' },
            { text: 'When there is only one document', why: 'With one document there is nothing to rank.' },
          ],
          answer: 0,
          explain: 'Product names, codes and plain-language questions together: the usual case in support and docs search.',
        },
        {
          id: 'e6-5-8',
          type: 'run-code',
          prompt: 'Set `top` to the first id of the fused ranking of `kw_ids` and `vec_ids`.',
          before: `def rrf(lists, k=60):
    s = {}
    for L in lists:
        for r, i in enumerate(L, 1):
            old = s.get(i, 0)
            s[i] = old + 1 / (k + r)
    return sorted(s, key=s.get,
                  reverse=True)

kw_ids = ["d7"]
vec_ids = ["d2", "d7"]`,
          solution: 'top = rrf([kw_ids, vec_ids])[0]',
          tests: 'assert top == "d7", f"d7 is in both lists, so it wins; got {top!r}"',
          placeholder: 'top = ...',
          explain: 'The pricing question: hybrid search finds the pricing page.',
        },
      ],
    },

    ...e6More,
  ],
  labs: e6Labs,
  library: e6Library,
};
