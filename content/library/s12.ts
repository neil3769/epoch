import type { LibraryPage } from '../schema';

/** Unit S12 summary page: unlocked in the Library when the unit is finished. */
export const s12Library: LibraryPage = {
  unit: 'S12',
  ideas: [
    {
      title: 'Serving',
      text: 'One pass over the weights serves a whole batch, so batching multiplies throughput; continuous batching lets requests join and leave each step. Stream tokens so the first words appear fast. Put a bounded, prioritised queue in front of scarce GPUs, reject early when it is full, and scale on queue wait.',
    },
    {
      title: 'Retrieval at scale',
      text: 'Approximate indexes (HNSW, IVF, quantisation) trade a little recall for speed and memory; measure recall at k against exact search, and use exact search while the collection is small. Ingestion runs in the background and tracks which source each chunk came from; the query path embeds, searches, reranks and stays within its latency budget.',
    },
    {
      title: 'Running it',
      text: 'Exact caches are always right; semantic caches hit more but can answer a different question, so never cache personal answers by meaning. A gateway holds keys, budgets, routing, fallbacks and logs for every team. Cost = tokens in × input price + tokens out × output price, over every call. Log everything, turn failures into golden-set cases, gate changes on them and judge a live sample.',
    },
  ],
  rules: [
    'Batch for throughput; cap batch wait for latency.',
    'Stream; measure time to first token.',
    'Bounded GPU queue, reject early, scale on wait.',
    'Exact search until it is measurably too slow.',
    'Chunks keyed by source, so deletions reach the index.',
    'Never cache personal answers by meaning.',
    'Check fallbacks on the eval set.',
  ],
  example: {
    code: [
      'IN, OUT = 3.00, 15.00  # $/1M',
      'def cost(t_in, t_out):',
      '    return (t_in * IN',
      '            + t_out * OUT) / 1e6',
      '',
      'per_req = cost(8000, 300)',
      'month = per_req * 50_000 * 30',
      'print(round(per_req, 4), round(month))',
    ].join('\n'),
    output: '0.0285 42750',
    notes: ['8,000 input tokens cost $0.024; 300 output tokens $0.0045.', 'At 50,000 requests a day, that is about $43,000 a month.'],
  },
  diagram: {
    nodes: [
      { id: 'c', kind: 'client', label: 'App' },
      { id: 'g', kind: 'lb', label: 'Gateway' },
      { id: 'k', kind: 'cache', label: 'Cache' },
      { id: 'v', kind: 'vector', label: 'Vector index' },
      { id: 'm', kind: 'model', label: 'Model' },
    ],
    edges: [
      { from: 'c', to: 'g' },
      { from: 'g', to: 'k', label: 'hit?' },
      { from: 'g', to: 'v', label: 'search' },
      { from: 'g', to: 'm', label: 'stream' },
    ],
  },
  mistakes: [
    { mistake: 'Waiting for the whole answer before showing it.', fix: 'Stream tokens.' },
    { mistake: 'An unbounded queue in front of GPUs.', fix: 'Limit it, prioritise, reject early.' },
    { mistake: 'A vector database for 5,000 documents.', fix: 'Exact search in memory.' },
    { mistake: 'Ingestion that only ever adds chunks.', fix: 'Key chunks by source; replace on change.' },
    { mistake: 'Shipping a prompt change on two examples.', fix: 'Run the golden set and read the regressions.' },
  ],
  forReal:
    'Read the vLLM documentation on continuous batching and the FAISS wiki page on choosing an index, then write a one-page cost model for an AI feature you use: tokens per call, calls per request, requests per day.',
};
