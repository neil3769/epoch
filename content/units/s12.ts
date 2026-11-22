import { s12Labs } from '../labs/s12';
import { s12Library } from '../library/s12';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s12More } from './s12-more';

/*
 * S12 Designing AI systems. Builds on E3, E5, E6, E9 and E10: cards link to
 * those lessons instead of re-teaching them. Lessons 1-4 here: batching,
 * streaming and GPU queues, vector indexes at scale, the two paths of a
 * retrieval system. Lessons 5-9 in s12-more.ts: caching, a model gateway,
 * cost per request, feedback and evaluation loops, checkpoint.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's12-01',
    title: 'Serving: batching',
    summary: 'One pass over the weights can serve many requests, so batching multiplies throughput at a small cost in latency.',
    card: {
      title: 'Serving: batching',
      text: 'Producing the next token is limited mostly by reading the model\'s weights from GPU memory, so one pass can serve many requests almost as fast as one. Batching groups requests into each pass: throughput rises steeply while each request waits a little longer per token. Continuous batching lets requests join and leave at every step, so a short answer never waits for a long one to finish.',
      see: ['e3-09', 'e9-02'],
    },
    exercises: [
      {
        id: 's12-1-1',
        type: 'estimate',
        prompt: 'A decoding step takes 30 ms whether it serves 1 request or 32. With batches of 32, how many tokens a second does the GPU produce?',
        expr: '32 / 0.03',
        answer: 1067,
        tolerance: 1.5,
        unit: 'tokens/s',
        options: [
          { value: 33, why: 'That is one request at a time: 1 / 0.03 s.' },
          { value: 1067 },
          { value: 32000, why: 'Each step takes 30 ms, not 1 ms.' },
        ],
        work: ['32 tokens per step', '1 s / 0.03 s ≈ 33 steps', '32 × 33 ≈ 1,067 tokens/s'],
        explain: 'Thirty-two times the throughput from the same GPU.',
      },
      {
        id: 's12-1-2',
        type: 'mcq',
        prompt: 'Why does batching raise throughput so much?',
        options: [
          { text: 'One weight read serves many' },
          { text: 'Each request does less work', why: 'Each request still gets every token it needs.' },
          { text: 'Batches skip some tokens', why: 'Nothing is skipped; the passes are shared.' },
        ],
        answer: 0,
        explain: 'The expensive part, reading the weights, is paid once per pass.',
      },
      {
        id: 's12-1-3',
        type: 'predict-output',
        prompt: 'Static batching keeps a slot busy until the longest answer ends. How many token slots are reserved, and how many used?',
        code: `lens = [20, 400, 35, 50]
reserved = max(lens) * len(lens)
used = sum(lens)
print(reserved, used)`,
        answer: '1600 505',
        typedWrong: [{ answer: '505 505', why: 'Every slot is held until the 400-token answer finishes.' }],
        explain: 'Two thirds of the batch sits idle: continuous batching fills those slots with new requests.',
      },
      {
        id: 's12-1-4',
        type: 'scenario',
        prompt: 'A chat service must keep p95 time to first token under a second. How should it form batches?',
        situation: 'Traffic varies from a trickle at night to bursts at noon.',
        needs: ['Good GPU use at noon', 'No long waits at night'],
        options: [
          {
            text: 'Cap batch size and wait time',
            cost: 'Some batches go out half full.',
          },
          {
            text: 'Always wait for a full batch',
            cost: 'Every batch is full.',
            why: 'At night a request could wait minutes for 31 others to arrive.',
          },
        ],
        answer: 0,
        explain: 'Send the batch when it is full or when the oldest request has waited, say, 20 ms.',
      },
      {
        id: 's12-1-5',
        type: 'bucket-sort',
        prompt: 'Large batches, or small ones for low latency?',
        buckets: ['Large batches', 'Small batches'],
        items: [
          { text: 'Embedding a million documents overnight', bucket: 0, why: 'Nobody waits for one document.' },
          { text: 'A live chat reply', bucket: 1, why: 'A person is watching the screen.' },
          { text: 'A voice assistant answering', bucket: 1, why: 'Pauses in speech are noticed at once.' },
          { text: 'Summarising last week\'s tickets', bucket: 0, why: 'A background job, so throughput matters most.' },
          { text: 'A nightly evaluation run', bucket: 0, why: 'Finishing sooner overall is what counts.' },
        ],
        explain: 'Offline work wants throughput; interactive work wants latency.',
      },
      {
        id: 's12-1-6',
        type: 'mcq',
        prompt: 'What does continuous batching change?',
        options: [
          { text: 'Requests join between steps' },
          { text: 'Requests are split across GPUs', why: 'That is model or tensor parallelism.' },
          { text: 'The batch size never changes', why: 'It changes at every step.' },
        ],
        answer: 0,
        explain: 'A finished request frees its slot for a waiting one straight away.',
      },
      {
        id: 's12-1-7',
        type: 'predict-output',
        prompt: 'Step time grows a little with batch size. Tokens per second for batches of 1, 8 and 32?',
        code: `step_ms = {1: 20, 8: 24, 32: 40}
rates = [round(b * 1000 / ms)
         for b, ms in step_ms.items()]
print(rates)`,
        answer: '[50, 333, 800]',
        typedWrong: [{ answer: '[50, 400, 1600]', why: 'The step itself slows to 24 ms and 40 ms.' }],
        explain: 'Each user\'s tokens come at half speed in the batch of 32, but the GPU makes 16 times as many.',
      },
      {
        id: 's12-1-8',
        type: 'fill-blank',
        prompt: 'Tokens per second for a batch and a step time in milliseconds.',
        code: `def tok_per_s(batch, step_ms):
    return batch * 1000 ___ step_ms

print(tok_per_s(32, 40))`,
        answer: ['/'],
        distractors: [{ text: '*', why: 'More time per step means fewer tokens a second: divide.' }],
        expectOutput: '800.0',
        explain: '32 tokens every 40 ms.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's12-02',
    title: 'Streaming and GPU queues',
    summary: 'Stream tokens so the first words appear fast; queue scarce GPUs with a limit, priorities and early rejection.',
    card: {
      title: 'Streaming and GPU queues',
      text: 'Users judge speed by when the first words appear (time to first token), so stream tokens as they are made, usually over server-sent events, instead of waiting for the whole answer. GPUs are scarce, so requests wait in a queue in front of them: give it a size limit, a maximum wait and priorities, and reject early with 429 or 503 rather than let waits grow. Add GPU replicas based on queue wait, since utilisation alone hides how long people wait.',
      see: ['s11-04', 's8-06'],
    },
    exercises: [
      {
        id: 's12-2-1',
        type: 'estimate',
        prompt: 'The first token comes after 0.3 s, then 25 ms per token for a 500-token answer. Without streaming, how many seconds until the user sees anything?',
        expr: '0.3 + 500 * 0.025',
        answer: 12.8,
        tolerance: 1.5,
        unit: 's',
        options: [
          { value: 0.3, why: 'That is when the first word appears with streaming.' },
          { value: 12.8 },
          { value: 125, why: '25 ms per token, not 250 ms.' },
        ],
        work: ['500 × 0.025 s = 12.5 s', '+ 0.3 s = 12.8 s'],
        explain: 'With streaming the user starts reading after 0.3 s instead.',
      },
      {
        id: 's12-2-2',
        type: 'mcq',
        prompt: 'In a chat app, what shapes how fast it feels?',
        options: [
          { text: 'Time to the first token' },
          { text: 'Total tokens generated', why: 'People read while the rest arrives.' },
          { text: 'The GPU\'s memory size', why: 'Users never see it.' },
        ],
        answer: 0,
        explain: 'Then a steady flow of tokens faster than reading speed.',
      },
      {
        id: 's12-2-3',
        type: 'predict-output',
        prompt: 'The client stops reading after two tokens (the user pressed stop). What did it get?',
        code: `def stream(text):
    for word in text.split():
        yield word

out = []
for tok in stream("hi there you"):
    out.append(tok)
    if len(out) == 2:
        break
print(out)`,
        answer: "['hi', 'there']",
        typedWrong: [{ answer: "['hi', 'there', 'you']", why: 'The loop breaks after the second token.' }],
        explain: 'Stopping early also stops the server generating, and paying for, the rest.',
      },
      {
        id: 's12-2-4',
        type: 'scenario',
        prompt: 'At peak the GPU queue grows without end and some requests wait two minutes. What do you change?',
        situation: 'Adding GPUs takes several minutes; peaks last about twenty.',
        needs: ['Users learn quickly if they will not be served', 'Admitted requests stay fast'],
        options: [
          {
            text: 'Limit the queue, reject with 503',
            cost: 'Some users see "busy, try again".',
          },
          {
            text: 'Let the queue grow without limit',
            cost: 'Nobody is rejected.',
            why: 'Everyone waits longer, and many give up after the work is already done.',
          },
        ],
        answer: 0,
        explain: 'Then scale on queue wait so the limit is hit less often.',
      },
      {
        id: 's12-2-5',
        type: 'bucket-sort',
        prompt: 'High or low priority in the GPU queue?',
        buckets: ['High', 'Low'],
        items: [
          { text: 'A customer typing in chat', bucket: 0, why: 'A person is waiting.' },
          { text: 'Back-filling embeddings for old files', bucket: 1, why: 'It can run whenever GPUs are free.' },
          { text: 'A nightly evaluation run', bucket: 1, why: 'It only needs to finish by morning.' },
          { text: 'A voice assistant\'s reply', bucket: 0, why: 'Silence on a call is noticed at once.' },
          { text: 'Drafting weekly report summaries', bucket: 1, why: 'Nobody reads them for hours.' },
        ],
        explain: 'Batch work fills the gaps that interactive traffic leaves.',
      },
      {
        id: 's12-2-6',
        type: 'predict-output',
        prompt: 'How long does a new request wait if 120 are ahead of it and 40 are served each second?',
        code: `queue = 120   # waiting
rate = 40     # served per second
print(queue / rate, "s wait")`,
        answer: '3.0 s wait',
        typedWrong: [{ answer: '0.3 s wait', why: '120 / 40 = 3.' }],
        explain: 'Queue length divided by service rate: the number to alert on.',
      },
      {
        id: 's12-2-7',
        type: 'mcq',
        prompt: 'What should trigger adding GPU replicas?',
        options: [
          { text: 'Queue wait time' },
          { text: 'Disk usage', why: 'Serving is limited by GPUs, not disks.' },
          { text: 'GPU temperature', why: 'A hardware health signal, not demand.' },
        ],
        answer: 0,
        explain: 'Wait time is what users feel; a busy GPU can still be keeping up.',
      },
      {
        id: 's12-2-8',
        type: 'fill-blank',
        prompt: 'Reject when the queue is at its limit.',
        code: `def admit(queue_len, limit):
    if queue_len ___ limit:
        return 503
    return "queued"

print(admit(120, 100),
      admit(100, 100), admit(5, 100))`,
        answer: ['>='],
        distractors: [
          { text: '<', why: 'That rejects short queues and admits long ones.' },
          { text: '==', why: 'A queue already past the limit would be let in.' },
        ],
        expectOutput: '503 503 queued',
        explain: 'Full means full: reject at once.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's12-03',
    title: 'Vector indexes at scale',
    summary: 'Approximate indexes trade a little recall for speed and memory; measure recall against exact search.',
    card: {
      title: 'Vector indexes at scale',
      text: 'Exact nearest-neighbour search compares the query with every stored vector: fine for a hundred thousand, far too slow for a billion. Approximate indexes trade a little recall for speed: HNSW walks a graph of near neighbours, IVF searches only the clusters closest to the query, and quantisation shrinks each vector to save memory. Measure recall at k against exact search on a sample of queries, and tune the index until it is good enough.',
      see: ['e6-03', 'e6-05'],
    },
    exercises: [
      {
        id: 's12-3-1',
        type: 'estimate',
        prompt: '100 million chunks, each a 1,024-number vector of 4-byte floats. How many GB of vectors?',
        expr: '100e6 * 1024 * 4 / GB',
        answer: 409.6,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 41, why: '10⁸ × 4,096 bytes ≈ 4 × 10¹¹ bytes.' },
          { value: 409.6 },
          { value: 4096, why: '409.6 billion bytes is about 410 GB.' },
        ],
        work: ['1,024 × 4 B = 4 KB per vector', '10⁸ × 4 KB ≈ 410 GB'],
        explain: 'More than one machine\'s memory, before the index itself.',
      },
      {
        id: 's12-3-2',
        type: 'estimate',
        prompt: 'Quantised to 1 byte per number instead of 4, how many GB?',
        expr: '100e6 * 1024 / GB',
        answer: 102.4,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 10.2, why: '10⁸ × 1,024 bytes ≈ 10¹¹ bytes.' },
          { value: 102.4 },
          { value: 409.6, why: 'That is the 4-byte size.' },
        ],
        work: ['10⁸ × 1,024 B ≈ 102 GB'],
        explain: 'A quarter of the memory, for a small loss in recall.',
      },
      {
        id: 's12-3-3',
        type: 'predict-output',
        prompt: 'Recall at 4: how many of the exact top 4 did the approximate index find?',
        code: `exact = {"d1", "d4", "d7", "d9"}
approx = {"d1", "d4", "d9", "d2"}
hit = len(exact & approx)
print(hit / len(exact))`,
        answer: '0.75',
        typedWrong: [{ answer: '1.0', why: 'd7 was missed and d2 found instead.' }],
        explain: 'Average this over a few hundred sample queries.',
      },
      {
        id: 's12-3-4',
        type: 'mcq',
        prompt: 'What does an approximate index give up for speed?',
        options: [
          { text: 'A little recall' },
          { text: 'All of its accuracy', why: 'Good indexes find 95% or more of the true neighbours.' },
          { text: 'Adding new vectors', why: 'Most support inserts.' },
        ],
        answer: 0,
        explain: 'Sometimes a true neighbour is missed; usually the next-best one is close.',
      },
      {
        id: 's12-3-5',
        type: 'match-pairs',
        prompt: 'Match each technique to its idea.',
        pairs: [
          { left: 'HNSW', right: 'walk a graph to nearer points', why: 'Layers of links from coarse to fine.' },
          { left: 'IVF', right: 'search only the closest clusters', why: 'Vectors are grouped around centroids.' },
          { left: 'Quantisation', right: 'fewer bytes per vector', why: 'Approximate numbers, less memory.' },
        ],
        explain: 'Real systems often combine them, such as IVF with quantisation.',
      },
      {
        id: 's12-3-6',
        type: 'predict-output',
        prompt: 'IVF probes the two clusters nearest the query. Which documents are scored?',
        code: `clusters = {"A": ["d1", "d2"],
            "B": ["d3"],
            "C": ["d4", "d5"]}
probe = ["A", "C"]   # nearest two
cands = [d for c in probe
         for d in clusters[c]]
print(cands)`,
        answer: "['d1', 'd2', 'd4', 'd5']",
        typedWrong: [{ answer: "['d1', 'd2', 'd3', 'd4', 'd5']", why: 'Cluster B is not probed.' }],
        explain: 'Probe more clusters for better recall, fewer for speed.',
      },
      {
        id: 's12-3-7',
        type: 'scenario',
        prompt: 'An internal wiki has 5,000 pages. A colleague proposes a tuned HNSW cluster. What do you suggest?',
        situation: 'Searches come a few times a minute.',
        needs: ['Answers in well under a second', 'Little to run'],
        options: [
          {
            text: 'Exact search over all of them',
            cost: 'A few million multiply-adds per query.',
          },
          {
            text: 'A tuned HNSW cluster for it',
            cost: 'Servers, tuning and recall checks.',
            why: '5,000 vectors are compared exactly in milliseconds.',
          },
        ],
        answer: 0,
        explain: 'Reach for approximate indexes when exact search is measurably too slow.',
      },
      {
        id: 's12-3-8',
        type: 'fill-blank',
        prompt: 'The best match is the highest dot product.',
        code: `import numpy as np
docs = np.array([[1, 0], [0, 1],
                 [0.7, 0.7]])
q = np.array([1, 0.1])
scores = docs @ q
print(int(np.___(scores)))`,
        answer: ['argmax'],
        distractors: [{ text: 'argmin', why: 'That finds the least similar document.' }],
        expectOutput: '0',
        explain: 'Scores are 1.0, 0.1 and 0.77: document 0 wins.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's12-04',
    title: 'Retrieval: two paths',
    summary: 'Ingestion runs in the background and must track sources; the query path runs per request and must be fast.',
    card: {
      title: 'Retrieval: two paths',
      text: 'A retrieval system has two paths that scale differently. The ingestion path runs in the background: fetch documents, split them into chunks, embed them in batches and write them to the indexes, recording which source each chunk came from so edits and deletions reach the index. The query path runs on every request and must be fast: embed the question, search, rerank a few dozen candidates and pass the best to the model.',
      see: ['e6-01', 'e6-02', 'e6-06'],
      diagram: {
        nodes: [
          { id: 'd', kind: 'store', label: 'Documents' },
          { id: 'w', kind: 'worker', label: 'Ingest' },
          { id: 'v', kind: 'vector', label: 'Vector index' },
          { id: 'a', kind: 'service', label: 'Query API' },
          { id: 'm', kind: 'model', label: 'LLM' },
        ],
        edges: [
          { from: 'd', to: 'w', label: 'changes' },
          { from: 'w', to: 'v', label: 'chunks' },
          { from: 'a', to: 'v', label: 'search' },
          { from: 'a', to: 'm', label: 'context' },
        ],
      },
    },
    exercises: [
      {
        id: 's12-4-1',
        type: 'bucket-sort',
        prompt: 'Ingestion path or query path?',
        buckets: ['Ingestion', 'Query'],
        items: [
          { text: 'Splitting PDFs into chunks', bucket: 0, why: 'Done once per document, in the background.' },
          { text: 'Embedding the user\'s question', bucket: 1, why: 'It happens on every request.' },
          { text: 'Re-embedding after a model change', bucket: 0, why: 'A background job over every chunk.' },
          { text: 'Reranking the candidates', bucket: 1, why: 'It depends on the question asked.' },
          { text: 'Removing a deleted page\'s chunks', bucket: 0, why: 'It keeps the index in step with the sources.' },
          { text: 'Searching the vector index', bucket: 1, why: 'It runs per question.' },
        ],
        explain: 'Background work can be slow and batched; request work cannot.',
      },
      {
        id: 's12-4-2',
        type: 'estimate',
        prompt: '2 million documents of about 20 chunks each, embedded at 2,000 chunks a second. How many hours?',
        expr: '2e6 * 20 / 2000 / HOUR',
        answer: 5.56,
        tolerance: 1.5,
        unit: 'h',
        options: [
          { value: 0.56, why: '40 million chunks / 2,000 = 20,000 s.' },
          { value: 5.56 },
          { value: 55.6, why: '20,000 s is under 6 hours.' },
        ],
        work: ['2 × 10⁶ × 20 = 4 × 10⁷ chunks', '/ 2,000 per s = 20,000 s ≈ 5.6 h'],
        explain: 'An overnight job, and the cost of every embedding-model change.',
      },
      {
        id: 's12-4-3',
        type: 'order-steps',
        prompt: 'The query path, in order.',
        steps: [
          'Embed the question',
          'Search the vector and keyword indexes',
          'Merge the candidates',
          'Rerank them',
          'Pass the best chunks to the model',
        ],
        explain: 'Each step must fit inside the request\'s latency budget.',
      },
      {
        id: 's12-4-4',
        type: 'scenario',
        prompt: 'A page deleted from the wiki still shows up in answers weeks later. Fix?',
        situation: 'Ingestion only ever adds chunks.',
        needs: ['Edits and deletions reach the index within minutes'],
        options: [
          {
            text: 'Delete its chunks on change',
            cost: 'Track which chunks came from which page.',
          },
          {
            text: 'Rebuild the index each year',
            cost: 'One big job a year.',
            why: 'Deleted pages keep being quoted for months.',
          },
        ],
        answer: 0,
        explain: 'Key chunks by source, so a change replaces exactly that source\'s chunks.',
      },
      {
        id: 's12-4-5',
        type: 'mcq',
        prompt: 'Switching to a new embedding model means re-embedding everything. Why?',
        options: [
          { text: 'Old and new vectors don\'t compare' },
          { text: 'The index file format changes', why: 'Even with the same format, the numbers mean different things.' },
          { text: 'Old chunks become too long', why: 'The text is unchanged; its vectors are the problem.' },
        ],
        answer: 0,
        explain: 'Each model has its own space; a question and a document must be embedded by the same one.',
      },
      {
        id: 's12-4-6',
        type: 'predict-output',
        prompt: 'Chunks are keyed "source#n". Source a is deleted. What is left?',
        code: `index = {"a#1": "...", "a#2": "...",
         "b#1": "..."}
def drop(source):
    for k in list(index):
        if k.split("#")[0] == source:
            del index[k]

drop("a")
print(list(index))`,
        answer: "['b#1']",
        typedWrong: [{ answer: "['a#2', 'b#1']", why: 'Every chunk from source a is removed.' }],
        explain: 'Known sources make updates exact.',
      },
      {
        id: 's12-4-7',
        type: 'diagram',
        prompt: 'Which part splits and embeds new documents?',
        diagram: {
          nodes: [
            { id: 'd', kind: 'store', label: 'Documents' },
            { id: 'w', kind: 'worker', label: 'Ingest' },
            { id: 'v', kind: 'vector', label: 'Vector index' },
            { id: 'a', kind: 'service', label: 'Query API' },
            { id: 'm', kind: 'model', label: 'LLM' },
          ],
          edges: [
            { from: 'd', to: 'w' },
            { from: 'w', to: 'v' },
            { from: 'a', to: 'v' },
            { from: 'a', to: 'm' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'w',
          why: {
            d: 'The documents are the input; they do not process themselves.',
            v: 'The index stores vectors; it does not make them.',
            a: 'The query API handles questions, not new documents.',
            m: 'The LLM writes answers from retrieved chunks.',
          },
        },
        explain: 'The ingest worker runs in the background, apart from user requests.',
      },
      {
        id: 's12-4-8',
        type: 'fill-blank',
        prompt: 'Embed chunks in batches of n.',
        code: `def batches(xs, n):
    starts = range(0, len(xs), ___)
    return [xs[i:i + n]
            for i in starts]

xs = list(range(10))
print(len(batches(xs, 4)))`,
        answer: ['n'],
        distractors: [{ text: '1', why: 'That starts a batch at every item: ten overlapping batches.' }],
        expectOutput: '3',
        explain: 'Batches of 4, 4 and 2.',
      },
    ],
  },
];

export const s12: Unit = {
  id: 'S12',
  track: 'system-design',
  title: 'Designing AI systems',
  blurb: 'Serving models with batching, streaming and GPU queues, vector indexes at scale, the two paths of a retrieval system, exact and semantic caching, a model gateway, cost per request, and feedback and evaluation loops.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s12More],
  labs: s12Labs,
  library: s12Library,
};
