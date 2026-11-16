import type { Lab } from '../schema';

/*
 * Unit F10 labs. Lab 1: a word-level tokenizer, with scaffolding (split,
 * build a vocabulary, encode, decode). Lab 2, from empty functions: search
 * by meaning over the toy embedding table (tokens, a sentence vector,
 * a safe cosine, ranked search).
 */
export const f10Labs: Lab[] = [
  {
    id: 'f10-lab-1',
    title: 'A tokenizer',
    intro: 'Build a word-level tokenizer from scratch: split text into tokens, build a vocabulary from some example sentences, then encode and decode.',
    summary: 'You built a tokenizer: splitting, a vocabulary with <unk>, encoding and decoding.',
    minutes: 12,
    unlockAfter: 'f10-02',
    steps: [
      {
        goal: 'Finish `tokenize(text)`: lower-case words and single punctuation marks.',
        starter: 'def tokenize(text):\n    p = r"\\w+|[^\\w\\s]"\n    return re.findall(p, text.___())',
        solution: 'def tokenize(text):\n    p = r"\\w+|[^\\w\\s]"\n    return re.findall(p, text.lower())',
        tests: 'assert tokenize("Hi, Cat!") == ["hi", ",", "cat", "!"], f"got {tokenize(\'Hi, Cat!\')}"',
        hints: ['Lower-case the text before finding tokens.', 'def tokenize(text):\n    p = r"\\w+|[^\\w\\s]"\n    return re.findall(p, text.___())'],
      },
      {
        goal: 'Finish `build_vocab(texts)`: `"<unk>"` first, then every different token in the texts, sorted.',
        starter: 'def build_vocab(texts):\n    seen = set()\n    for t in texts:\n        seen.update(tokenize(t))\n    return ["<unk>"] + ___(seen)',
        solution: 'def build_vocab(texts):\n    seen = set()\n    for t in texts:\n        seen.update(tokenize(t))\n    return ["<unk>"] + sorted(seen)',
        tests: [
          'v = build_vocab(["The cat.", "the dog"])',
          'assert v == ["<unk>", ".", "cat", "dog", "the"], f"got {v}"',
        ].join('\n'),
        hints: ['Sets have no order: turn it into a sorted list.', 'def build_vocab(texts):\n    seen = set()\n    for t in texts:\n        seen.update(tokenize(t))\n    return ["<unk>"] + ___(seen)'],
        explain: 'Sorting makes the ids the same every time you build it.',
      },
      {
        goal: 'Finish `encode(text, vocab)`: the id of each token, 0 for unknown ones.',
        starter: 'def encode(text, vocab):\n    ids = {t: i for i, t\n           in enumerate(vocab)}\n    return [ids.get(t, ___)\n            for t in tokenize(text)]',
        solution: 'def encode(text, vocab):\n    ids = {t: i for i, t\n           in enumerate(vocab)}\n    return [ids.get(t, 0)\n            for t in tokenize(text)]',
        tests: [
          'v = ["<unk>", ".", "cat", "dog", "the"]',
          'assert encode("The dog.", v) == [4, 3, 1], f"got {encode(\'The dog.\', v)}"',
          'assert encode("a cat", v) == [0, 2], "unknown words are 0"',
        ].join('\n'),
        hints: ['<unk> sits at position 0.', 'def encode(text, vocab):\n    ids = {t: i for i, t\n           in enumerate(vocab)}\n    return [ids.get(t, ___)\n            for t in tokenize(text)]'],
      },
      {
        goal: 'Finish `decode(ids, vocab)`: the tokens joined with spaces.',
        starter: 'def decode(ids, vocab):\n    return " ".join(vocab[i]\n                    for i in ___)',
        solution: 'def decode(ids, vocab):\n    return " ".join(vocab[i]\n                    for i in ids)',
        tests: [
          'v = ["<unk>", ".", "cat", "dog", "the"]',
          'assert decode([4, 2, 1], v) == "the cat .", f"got {decode([4, 2, 1], v)!r}"',
          'assert decode([0], v) == "<unk>", "id 0 decodes to <unk>"',
        ].join('\n'),
        hints: ['Look up each id in the vocabulary.', 'def decode(ids, vocab):\n    return " ".join(vocab[i]\n                    for i in ___)'],
        explain: 'Decoding loses the original spacing; real tokenizers store spaces inside tokens to avoid that.',
      },
    ],
  },
  {
    id: 'f10-lab-2',
    title: 'Search by meaning',
    intro: 'Use the toy embedding table `E` (columns: animal, fruit, vehicle) to rank words by how close they are to a whole sentence, each piece from an empty function.',
    summary: 'You built sentence vectors and a similarity search from scratch.',
    minutes: 15,
    unlockAfter: 'f10-06',
    steps: [
      {
        goal: 'Write `words(text)`: the lower-case runs of letters in the text.',
        starter: 'def words(text):\n    pass',
        solution: 'def words(text):\n    t = text.lower()\n    return re.findall(r"[a-z]+", t)',
        tests: 'assert words("A Cat, a BUS!") == ["a", "cat", "a", "bus"], f"got {words(\'A Cat, a BUS!\')}"',
        hints: ['re.findall with a pattern for letters.', 'def words(text):\n    t = text.lower()\n    return re.findall(r"[a-z]___", t)'],
      },
      {
        goal: 'Write `embed_text(text)`: the mean of the rows of `E` for the words that are in `ID`; `np.zeros(3)` if there are none.',
        starter: 'def embed_text(text):\n    pass',
        solution: 'def embed_text(text):\n    ws = [w for w in words(text)\n          if w in ID]\n    if not ws:\n        return np.zeros(3)\n    rows = E[[ID[w] for w in ws]]\n    return rows.mean(axis=0)',
        tests: [
          'assert np.allclose(embed_text("a cat and a dog"), [0.85, 0.15, 0.05]), f"got {embed_text(\'a cat and a dog\')}"',
          'assert np.allclose(embed_text("hello"), [0, 0, 0]), "no known words: zeros"',
        ].join('\n'),
        hints: [
          'Keep the known words, look up their rows, average with axis=0.',
          'def embed_text(text):\n    ws = [w for w in words(text)\n          if w in ID]\n    if not ws:\n        return np.zeros(3)\n    rows = E[[ID[w] for w in ws]]\n    return rows.mean(axis=___)',
        ],
      },
      {
        goal: 'Write `cosine(a, b)`: cosine similarity, or `0.0` if either vector has length 0.',
        starter: 'def cosine(a, b):\n    pass',
        solution: 'def cosine(a, b):\n    na = np.linalg.norm(a)\n    nb = np.linalg.norm(b)\n    if na == 0 or nb == 0:\n        return 0.0\n    return float(a @ b / (na * nb))',
        tests: [
          'assert abs(cosine(np.array([1.0, 0.0]), np.array([2.0, 0.0])) - 1.0) < 1e-9, "same direction: 1"',
          'assert cosine(np.zeros(2), np.array([1.0, 0.0])) == 0.0, "zero vector: 0.0, not a division error"',
        ].join('\n'),
        hints: [
          'Compute both lengths; return 0.0 early if either is 0.',
          'def cosine(a, b):\n    na = np.linalg.norm(a)\n    nb = np.linalg.norm(b)\n    if na == 0 or nb == 0:\n        return ___\n    return float(a @ b / (na * nb))',
        ],
        explain: 'A text with no known words must not crash the search.',
      },
      {
        goal: 'Write `rank(text, k)`: the `k` words of `WORDS` closest to `embed_text(text)` by cosine, best first.',
        starter: 'def rank(text, k):\n    pass',
        solution: 'def rank(text, k):\n    q = embed_text(text)\n    return sorted(\n        WORDS,\n        key=lambda w: -cosine(\n            q, E[ID[w]]))[:k]',
        tests: [
          'assert rank("my pet cat", 2) == ["cat", "dog"], f"got {rank(\'my pet cat\', 2)}"',
          'assert rank("a pear, an apple", 2) == ["apple", "pear"] or rank("a pear, an apple", 2) == ["pear", "apple"], f"got {rank(\'a pear, an apple\', 2)}"',
          'assert rank("the bus", 1) == ["bus"], "bus first"',
        ].join('\n'),
        hints: [
          'sorted with a key; a minus sign puts the highest first.',
          'def rank(text, k):\n    q = embed_text(text)\n    return sorted(\n        WORDS,\n        key=lambda w: -cosine(\n            q, E[ID[w]]))[:___]',
        ],
        explain: 'Swap the words for document chunks and you have the retrieval step of RAG.',
      },
    ],
  },
];
