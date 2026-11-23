import type { Walkthrough } from '../schema';

/*
 * Walkthrough 13: an assistant over company documents (retrieval-augmented
 * generation) at scale, through the seven-step framework. Unlocks after
 * S1-S4, S8 (queues), S11 (search) and S12 (AI systems).
 */
export const rag: Walkthrough = {
  id: 'w-rag',
  title: 'Document assistant at scale',
  question: 'Design an assistant that answers employees\' questions from the company\'s documents, citing its sources, for a company of 50,000 people.',
  needs: ['S1', 'S2', 'S3', 'S4', 'S8', 'S11', 'S12'],
  minutes: 20,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "10 million documents across wikis, tickets and shared drives. Answers must cite sources and respect who may read what."',
      exercises: [
        {
          id: 'wrg-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Answers with citations', bucket: 0, why: 'Stated by the interviewer.' },
            { text: 'Respect document permissions', bucket: 0, why: 'Stated; leaking HR files would be serious.' },
            { text: 'Keep the index current', bucket: 0, why: 'Answers from last month\'s documents mislead.' },
            { text: 'Taking actions like filing tickets', bucket: 1, why: 'An agent with tools is a bigger, riskier step.' },
            { text: 'Voice questions', bucket: 1, why: 'Not asked for; text first.' },
            { text: 'Training a model on the docs', bucket: 1, why: 'Retrieval keeps answers current without retraining.' },
          ],
          explain: 'Ask, retrieve what you may read, answer with sources.',
        },
        {
          id: 'wrg-1-2',
          type: 'mcq',
          prompt: 'Which requirement is hardest to add later?',
          options: [
            { text: 'Permission checks on every answer' },
            { text: 'A friendlier answer style', why: 'Prompt changes are cheap at any time.' },
            { text: 'Support for more file types', why: 'Add a parser when needed.' },
          ],
          answer: 0,
          explain: 'Every chunk must carry its permissions from the start; adding them later means re-indexing everything.',
        },
        {
          id: 'wrg-1-3',
          type: 'scenario',
          prompt: 'A document is edited. How soon must answers reflect it?',
          situation: 'Thousands of documents change every hour.',
          needs: ['Answers stay reasonably current', 'Indexing cost stays sensible'],
          options: [
            { text: 'Within about an hour', cost: 'Briefly stale answers after edits.' },
            {
              text: 'Before anyone asks again',
              cost: 'Always current.',
              why: 'Re-indexing in the save path slows every edit and couples two systems.',
            },
          ],
          answer: 0,
          explain: 'Changes flow through a queue to background indexers.',
        },
      ],
      strong: 'Answers grounded in company documents with citations, filtered by each user\'s permissions, from an index that follows edits within about an hour; actions and fine-tuning later.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "Documents split into about 50 chunks each. An embedding is 1,024 numbers of 4 bytes. Each employee asks about five questions a day."',
      exercises: [
        {
          id: 'wrg-2-1',
          type: 'estimate',
          prompt: 'Size of all chunk embeddings?',
          expr: '10e6 * 50 * 1024 * 4 / TB',
          answer: 2.05,
          tolerance: 2,
          unit: 'TB',
          options: [
            { value: 0.2, why: '5 × 10⁸ chunks × 4 KB ≈ 2 × 10¹² B = 2 TB.' },
            { value: 2 },
            { value: 20, why: '5 × 10⁸ × 4,096 B is about 2 TB.' },
          ],
          work: ['10⁷ docs × 50 = 5 × 10⁸ chunks', '× 1,024 × 4 B ≈ 2 × 10¹² B = 2 TB'],
          explain: 'Too big for one machine\'s memory without compression or sharding (S12).',
        },
        {
          id: 'wrg-2-2',
          type: 'estimate',
          prompt: 'Questions per second if they all arrive within an 8-hour working day?',
          expr: '50000 * 5 / (8 * HOUR)',
          answer: 8.7,
          tolerance: 2,
          unit: 'questions/s',
          options: [
            { value: 1, why: '250,000 / 28,800 s ≈ 9.' },
            { value: 9 },
            { value: 90, why: '250,000 questions over 8 hours is about 9 a second.' },
          ],
          work: ['50,000 × 5 = 250,000 a day', '250,000 / (8 × 3,600 s) ≈ 9 a second'],
          explain: 'A light query rate; each query is expensive, though.',
        },
        {
          id: 'wrg-2-3',
          type: 'mcq',
          prompt: '2 TB of vectors and about 9 questions a second. Which is the harder problem?',
          options: [
            { text: 'Index size, not query rate' },
            { text: 'Query rate, not index size', why: 'Nine a second is light; 2 TB of vectors does not fit one machine\'s memory.' },
            { text: 'Neither: one laptop will do', why: '2 TB of vectors does not fit a laptop\'s memory.' },
          ],
          answer: 0,
          explain: 'Compress the vectors (quantise) or shard the index.',
        },
      ],
      strong: 'About 500 million chunks and 2 TB of raw embeddings, but only about 9 questions a second: the index size drives the design, while each question\'s model call drives cost.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'One endpoint to ask, one to give feedback, and change events from the document sources.',
      exercises: [
        {
          id: 'wrg-3-1',
          type: 'mcq',
          prompt: 'How should the answer reach the user?',
          options: [
            { text: 'Streamed token by token' },
            { text: 'All at once after 10 seconds', why: 'Users stare at a spinner; streaming shows words in about a second (S12).' },
            { text: 'By email when finished', why: 'Far too slow for a question asked in a chat box.' },
          ],
          answer: 0,
          explain: 'Citations can follow at the end of the stream.',
        },
        {
          id: 'wrg-3-2',
          type: 'order-steps',
          prompt: 'Put the work for one question in order.',
          steps: [
            'Check who the user is and what they may read',
            'Embed the question',
            'Search for similar chunks the user may read',
            'Build a prompt from the best chunks',
            'Stream the model\'s answer with citations',
          ],
          explain: 'Identity comes first, so the search can filter by it.',
        },
        {
          id: 'wrg-3-3',
          type: 'match-pairs',
          prompt: 'Match each part of the interface to what it carries.',
          pairs: [
            { left: 'POST /ask', right: 'a streamed answer', why: 'The main call.' },
            { left: 'Citation', right: 'the document and chunk used', why: 'Lets users check the answer.' },
            { left: 'POST /feedback', right: 'thumbs up or down', why: 'Feeds the evaluation set.' },
            { left: 'Change event', right: 'a document was edited', why: 'Triggers re-indexing.' },
          ],
          explain: 'The feedback and change events keep quality and freshness up.',
        },
      ],
      strong: 'POST /ask streams an answer with citations; POST /feedback records ratings; document sources emit change events that drive re-indexing. Identity travels with every question.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Each chunk carries its text, its embedding, its source and who may read it.',
      exercises: [
        {
          id: 'wrg-4-1',
          type: 'bucket-sort',
          prompt: 'Where does each piece of data live?',
          buckets: ['Vector index', 'Object store', 'Database'],
          items: [
            { text: 'Chunk embeddings', bucket: 0, why: 'Searched by similarity.' },
            { text: 'Groups allowed per chunk', bucket: 0, why: 'Stored beside each vector so the search can filter.' },
            { text: 'Original files', bucket: 1, why: 'Large blobs, kept for citations and re-parsing.' },
            { text: 'Raw PDFs and slides', bucket: 1, why: 'Large binary files.' },
            { text: 'Source version of each document', bucket: 2, why: 'Tells indexers what changed.' },
            { text: 'Questions and feedback', bucket: 2, why: 'Queried for evaluation.' },
          ],
          explain: 'Permissions go with the vectors, so filtering happens inside the search.',
        },
        {
          id: 'wrg-4-2',
          type: 'predict-output',
          prompt: 'Search results with their scores and groups. This user is in "eng" and "all". Which two chunks may be used?',
          code: `chunks = [("c1", 0.91, "hr"),
          ("c2", 0.88, "eng"),
          ("c3", 0.80, "all")]
groups = {"eng", "all"}
ok = [c for c, s, g in chunks
      if g in groups]
print(ok[:2])`,
          answer: "['c2', 'c3']",
          typedWrong: [{ answer: "['c1', 'c2']", why: 'c1 belongs to HR; this user is not in that group.' }],
          explain: 'Filter inside the search, or the top results might all be filtered away afterwards.',
        },
        {
          id: 'wrg-4-3',
          type: 'mcq',
          prompt: 'Where must permissions be enforced?',
          options: [
            { text: 'In the retrieval search itself' },
            { text: 'In the prompt: "do not reveal"', why: 'Models can be talked out of instructions; never rely on the prompt.' },
            { text: 'Only on the document links', why: 'The answer text would already contain the content.' },
          ],
          answer: 0,
          explain: 'A chunk the user may not read must never reach the model.',
        },
      ],
      strong: 'Chunks in a vector index with their text, source, version and allowed groups; originals in object storage; document versions, questions and feedback in a database. Permissions are enforced in the search itself.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'A query path that must be fast, and an ingestion path that runs in the background.',
      exercises: [
        {
          id: 'wrg-5-1',
          type: 'diagram',
          prompt: 'The ask API finds chunks similar to the question. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'u', kind: 'client', label: 'Employees' },
              { id: 'a', kind: 'service', label: 'Ask API' },
              { id: 'm', kind: 'model', label: 'LLM' },
              { id: 'v', kind: 'vector', label: 'Vectors' },
            ],
            edges: [
              { from: 'u', to: 'a' },
              { from: 'a', to: 'v', label: 'search' },
              { from: 'a', to: 'm', label: 'prompt' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'v',
            options: [
              { kind: 'vector', label: 'Vector index' },
              { kind: 'db', label: 'SQL LIKE', why: 'Keyword matching misses questions phrased differently.' },
              { kind: 'cache', label: 'Answer cache', why: 'Holds past answers; it cannot find relevant chunks.' },
            ],
            answer: 0,
          },
          explain: 'An approximate nearest-neighbour index, filtered by permission (S12).',
        },
        {
          id: 'wrg-5-2',
          type: 'diagram',
          prompt: 'A wiki page changes. Tap the path that updates the index.',
          diagram: {
            nodes: [
              { id: 'u', kind: 'client', label: 'Employees' },
              { id: 'q', kind: 'queue', label: 'Changes' },
              { id: 'a', kind: 'service', label: 'Ask API' },
              { id: 'w', kind: 'worker', label: 'Indexers' },
              { id: 'm', kind: 'model', label: 'LLM' },
              { id: 'v', kind: 'vector', label: 'Vectors' },
            ],
            edges: [
              { from: 'u', to: 'a' },
              { from: 'q', to: 'w' },
              { from: 'a', to: 'v' },
              { from: 'w', to: 'v' },
              { from: 'a', to: 'm' },
            ],
          },
          goal: { kind: 'path', answer: ['q', 'w', 'v'] },
          explain: 'Indexers parse, chunk, embed and replace the document\'s old chunks.',
        },
        {
          id: 'wrg-5-3',
          type: 'mcq',
          prompt: 'Why keep ingestion apart from the query path?',
          options: [
            { text: 'Indexing is slow; questions must be fast' },
            { text: 'Models cannot read new documents', why: 'They read whatever chunks the prompt includes.' },
            { text: 'Queues make answers more accurate', why: 'The queue affects timing, not answer quality.' },
          ],
          answer: 0,
          explain: 'A burst of edits must never slow down questions (S12).',
        },
      ],
      strong: 'Query path: employees → ask API → permission-filtered vector search → LLM, streamed back with citations. Ingestion path: change events → queue → indexers that parse, chunk and embed into the same index.',
      diagram: {
        nodes: [
          { id: 'u', kind: 'client', label: 'Employees' },
          { id: 'q', kind: 'queue', label: 'Changes' },
          { id: 'a', kind: 'service', label: 'Ask API' },
          { id: 'w', kind: 'worker', label: 'Indexers' },
          { id: 'm', kind: 'model', label: 'LLM' },
          { id: 'v', kind: 'vector', label: 'Vectors' },
        ],
        edges: [
          { from: 'u', to: 'a' },
          { from: 'q', to: 'w' },
          { from: 'a', to: 'v', label: 'search' },
          { from: 'w', to: 'v', label: 'embed', dashed: true },
          { from: 'a', to: 'm', label: 'prompt' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: retrieving the right chunks, and answering only from them.',
      exercises: [
        {
          id: 'wrg-6-1',
          type: 'predict-output',
          prompt: 'Vector search and keyword search results are merged by reciprocal rank fusion. Which two come first?',
          code: `vec = ["d1", "d2", "d3"]
kw = ["d3", "d1", "d4"]
score = {}
for ranks in (vec, kw):
    for i, d in enumerate(ranks):
        s = score.get(d, 0)
        score[d] = s + 1 / (60 + i)
top = sorted(score, key=score.get)
print(top[::-1][:2])`,
          answer: "['d1', 'd3']",
          typedWrong: [{ answer: "['d1', 'd2']", why: 'd3 is found by both searches, so it beats d2, found by one.' }],
          explain: 'Hybrid retrieval (S12): keywords catch exact names and codes that embeddings blur.',
        },
        {
          id: 'wrg-6-2',
          type: 'scenario',
          prompt: 'The retrieved chunks do not contain the answer.',
          situation: 'The model could still produce a fluent reply.',
          needs: ['No invented company facts', 'Users can still find help'],
          options: [
            { text: 'Say it does not know; show sources', cost: 'Some questions get no answer.' },
            {
              text: 'Answer from the model\'s memory',
              cost: 'Every question gets an answer.',
              why: 'Invents company facts with confidence.',
            },
          ],
          answer: 0,
          explain: 'The prompt says to answer only from the given chunks and cite them.',
        },
        {
          id: 'wrg-6-3',
          type: 'mcq',
          prompt: 'How do you know a change to chunking made answers better?',
          options: [
            { text: 'Score it on a golden set first' },
            { text: 'Ask a few colleagues to try it', why: 'A handful of opinions misses regressions.' },
            { text: 'Ship it and watch complaints', why: 'Users find regressions for you, slowly and angrily.' },
          ],
          answer: 0,
          explain: 'A fixed set of questions with known good sources, scored before every change (S12).',
        },
      ],
      strong: 'Hybrid retrieval (vectors plus keywords, fused by rank) filtered by permission; the model answers only from the retrieved chunks with citations and says when it does not know; every change is gated on a golden set.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Look at what it costs, then at what grows.',
      exercises: [
        {
          id: 'wrg-7-1',
          type: 'estimate',
          prompt: 'Each answer uses about 4,000 input tokens at $3 per million and 300 output tokens at $15 per million. Daily cost for 250,000 questions?',
          expr: '250000 * (4000 * 3 + 300 * 15) / 1e6',
          answer: 4125,
          tolerance: 2,
          unit: '$/day',
          options: [
            { value: 400, why: '$0.0165 per answer × 250,000 ≈ $4,100.' },
            { value: 4000 },
            { value: 40000, why: '250,000 × $0.0165 is about $4,100, not $40,000.' },
          ],
          work: ['4,000 × $3/M = $0.012; 300 × $15/M = $0.0045', '$0.0165 × 250,000 ≈ $4,125 a day'],
          explain: 'Input tokens from retrieved chunks are most of it.',
        },
        {
          id: 'wrg-7-2',
          type: 'scenario',
          prompt: 'Finance asks you to halve the cost.',
          situation: 'Many questions are simple or repeated.',
          needs: ['Half the cost', 'Answers stay good'],
          options: [
            { text: 'Cache, and route easy ones small', cost: 'Some answers a little weaker.' },
            {
              text: 'Use the biggest model for all',
              cost: 'Best answers.',
              why: 'Raises cost instead of cutting it.',
            },
            {
              text: 'Retrieve 50 chunks, not 5',
              cost: 'More context.',
              why: 'Ten times the input tokens: cost rises.',
            },
          ],
          answer: 0,
          explain: 'Check the cheaper route on the golden set before switching.',
        },
        {
          id: 'wrg-7-3',
          type: 'bucket-sort',
          prompt: 'Which work is on the query path, and which on ingestion?',
          buckets: ['Query path', 'Ingestion'],
          items: [
            { text: 'Embedding the question', bucket: 0, why: 'Needed for each search.' },
            { text: 'Permission filter in search', bucket: 0, why: 'Per user, per question.' },
            { text: 'Streaming the answer', bucket: 0, why: 'The user is waiting.' },
            { text: 'Embedding new chunks', bucket: 1, why: 'Done when documents change.' },
            { text: 'Parsing PDFs into text', bucket: 1, why: 'Slow; never while a user waits.' },
            { text: 'Re-indexing an edited page', bucket: 1, why: 'Triggered by change events.' },
          ],
          explain: 'Keep the query path short; push the slow work to ingestion.',
        },
      ],
      strong: 'About $4,000 a day, mostly input tokens: cut it with caching, a smaller model for easy questions and fewer, better chunks, each change checked on the golden set; the index grows with documents and is sharded or compressed.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'u', kind: 'client', label: 'Employees' },
        { id: 'q', kind: 'queue', label: 'Changes' },
        { id: 'a', kind: 'service', label: 'Ask API' },
        { id: 'w', kind: 'worker', label: 'Indexers' },
        { id: 'm', kind: 'model', label: 'LLM' },
        { id: 'v', kind: 'vector', label: 'Vectors' },
      ],
      edges: [
        { from: 'u', to: 'a' },
        { from: 'q', to: 'w' },
        { from: 'a', to: 'v', label: 'search' },
        { from: 'w', to: 'v', label: 'embed', dashed: true },
        { from: 'a', to: 'm', label: 'prompt' },
      ],
    },
    decisions: [
      'Permissions stored with every chunk and enforced inside the search.',
      'Hybrid retrieval: vectors plus keywords, merged by rank.',
      'Answers only from retrieved chunks, with citations; "I don\'t know" otherwise.',
      'Ingestion in the background from change events; about 2 TB of embeddings.',
      'Golden-set evaluation gates every change; caching and routing cut cost.',
    ],
  },
  blank: {
    requirements: [
      'Answer questions from company documents with citations',
      'Never reveal what the user may not read',
      'Index follows edits within about an hour',
      '10 million documents, 50,000 employees',
      'Cost under control',
    ],
    components: ['client', 'service', 'vector', 'model', 'queue', 'worker'],
    firstFive: [
      'Ask the document count, sources and permission rules',
      'Say permissions are enforced in retrieval, never in the prompt',
      'Estimate chunks, index size and questions a second',
      'Split the query path from the ingestion path',
      'Say how answer quality will be measured',
    ],
  },
};
