import type { LibraryPage } from '../schema';

/** Unit E6 summary page: unlocked in the Library when the unit is finished. */
export const e6Library: LibraryPage = {
  unit: 'E6',
  ideas: [
    {
      title: 'Retrieve, then generate',
      text: 'A model cannot answer from documents it never saw. RAG retrieves the passages most relevant to the question and puts them in the prompt, so the model answers from current, private text, and can say which passage it used. Indexing (chunk, embed, store) happens ahead of time; retrieval and generation happen per question.',
    },
    {
      title: 'Chunking',
      text: 'Split documents into chunks of a few hundred tokens, ideally at paragraph or section boundaries, with a small overlap so a rule is not cut in half. Too large mixes topics and wastes the prompt; too small loses context.',
    },
    {
      title: 'Keyword, vector and hybrid search',
      text: 'Vector search embeds the question and ranks chunks by cosine similarity: it handles paraphrases but blurs exact terms. Keyword search (BM25) scores shared words, weighting rare ones: it nails codes, names and IDs but misses paraphrases. Hybrid search runs both and merges the rankings with reciprocal rank fusion: each result scores 1 / (60 + rank) per list, which needs no score calibration.',
    },
    {
      title: 'Rerank, cite, refuse',
      text: 'Retrieve generously (about 50), then let a slower reranker that reads question and chunk together keep the best few. Label chunks with ids, ask for citations like [d2], and reject answers whose citations are missing or were never sent. Search always returns k results, so refuse below a score floor chosen from real good and bad matches, and tell the model to say when the sources lack the answer.',
    },
    {
      title: 'Which stage failed?',
      text: 'Log the retrieved ids with every answer. If the needed chunk was not retrieved, retrieval failed: fix chunking, search, k or reranking. If it was there and the answer is still wrong, generation failed: fix the prompt or model. Measure the retrieval hit rate separately from answer quality.',
    },
  ],
  rules: [
    'Chunk at structure, a few hundred tokens, with overlap.',
    'Embed chunks once; embed each question at query time.',
    'Exact terms: keyword. Paraphrases: vector. Both: hybrid.',
    'RRF: sum of 1 / (60 + rank) over the lists.',
    'Retrieve ~50, rerank, keep ~5.',
    'Every citation must be an id you sent.',
    'Below the floor, refuse without calling the model.',
    'Needed chunk missing? Retrieval. Present? Generation.',
  ],
  example: {
    code: [
      'def rrf(lists, k=60):',
      '    s = {}',
      '    for L in lists:',
      '        for r, i in enumerate(L, 1):',
      '            old = s.get(i, 0)',
      '            s[i] = old + 1 / (k + r)',
      '    return sorted(s, key=s.get,',
      '                  reverse=True)',
      '',
      'kw = ["d1"]',
      'vec = ["d6", "d1", "d3"]',
      'print(rrf([kw, vec]))',
    ].join('\n'),
    output: "['d1', 'd6', 'd3']",
    notes: [
      'Keyword search found only the password-reset page; vector search put the two-factor page first.',
      'd1 collects a share from both lists (1/61 + 1/62), so it beats d6 (1/61 alone).',
      'Ranks, not raw scores, are combined, so BM25 and cosine never need to be on one scale.',
    ],
  },
  mistakes: [
    { mistake: 'Answering from the top k whatever their scores.', fix: 'Set a floor from real data and refuse below it.' },
    { mistake: 'Calling the model before checking for hits.', fix: 'Refuse first; refusing should cost nothing.' },
    { mistake: 'Trusting citations as given.', fix: 'Check every cited id was sent, and that there is at least one.' },
    { mistake: 'Vector search only, for queries with codes or names.', fix: 'Add keyword search and fuse with RRF.' },
    { mistake: 'Reranking only the top 5.', fix: 'Retrieve more first; a reranker only reorders what search found.' },
    { mistake: 'Tuning the prompt when retrieval missed the page.', fix: 'Check the logged ids first: fix the stage that failed.' },
  ],
  forReal:
    'The app\'s pages and embeddings are toys. For real, build this over your own documents for the plan\'s week 5 flagship: a real embedding model, a vector store (pgvector, or a library such as FAISS or Chroma), BM25 from a search library, and a small golden set of questions with the page each needs. Measure the retrieval hit rate and answer quality separately, change one thing, and measure again (week 6).',
};
