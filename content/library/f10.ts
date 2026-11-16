import type { LibraryPage } from '../schema';

/** Unit F10 summary page: unlocked in the Library when the unit is finished. */
export const f10Library: LibraryPage = {
  unit: 'F10',
  ideas: [
    {
      title: 'Tokens and ids',
      text: 'Text is cut into tokens; each token\'s position in the vocabulary is its id. Encoding maps text to ids, decoding maps them back. Ids are labels with no meaning of their own.',
    },
    {
      title: 'Subwords',
      text: 'Real tokenizers use word pieces learned by byte-pair encoding: start from characters and repeatedly merge the most common neighbouring pair. Common words become one token, rare ones several, and nothing is ever unknown. English runs at about four characters per token.',
    },
    {
      title: 'Embeddings',
      text: 'Each id looks up a row of a learned table. Lookup is a one-hot vector times the table. A batch of ids of shape (batch, tokens) becomes (batch, tokens, embedding size).',
    },
    {
      title: 'Similarity and search',
      text: 'Cosine similarity compares directions: dot product divided by both lengths. Normalise the rows once, score them all with one matrix-vector product, and argsort for the top k.',
    },
  ],
  rules: [
    'Lower-case and split off punctuation, or use learned pieces.',
    'Reserve id 0 for <unk> in a word-level vocabulary.',
    'Tokens ≈ characters / 4 in English.',
    'Embedding lookup = one-hot @ table.',
    'cos(a, b) = a·b / (|a| |b|).',
    'Top k: np.argsort(scores)[::-1][:k].',
  ],
  example: {
    code: [
      'q = N[ID["cat"]]',
      'scores = N @ q',
      'top = np.argsort(scores)[::-1][:3]',
      'print([WORDS[i] for i in top])',
    ].join('\n'),
    output: "['cat', 'dog', 'apple']",
    notes: [
      'N is the embedding table with every row scaled to length 1.',
      'One matrix-vector product gives every cosine.',
      'Reverse the argsort for highest first.',
    ],
  },
  mistakes: [
    { mistake: 'Treating ids as quantities.', fix: 'Look up embeddings; ids are labels.' },
    { mistake: 'Counting words to estimate cost.', fix: 'Count tokens; rare words are several.' },
    { mistake: 'Ranking by plain dot product.', fix: 'Normalise first, or use cosine.' },
    { mistake: 'argsort taken as highest first.', fix: 'It is lowest first: reverse it.' },
    { mistake: 'norm with axis=0 for row lengths.', fix: 'axis=1, keepdims=True.' },
  ],
  forReal:
    'The app\'s embedding table is six hand-made rows. For real: install tiktoken and count the tokens in a page of your own writing, then embed a few hundred sentences with a sentence-embedding model (for example from the sentence-transformers library) and run the same argsort search over them. Unit E6 builds this into retrieval for a RAG system.',
};
