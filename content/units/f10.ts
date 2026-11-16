import { f10Labs } from '../labs/f10';
import { f10Library } from '../library/f10';
import type { Unit } from '../schema';

/*
 * F10 Text as numbers. Tokens, vocabularies and ids, subword tokens and one
 * byte-pair-encoding step by hand, embeddings as a lookup table, cosine
 * similarity, similarity search, checkpoint.
 *
 * The prelude holds a tiny vocabulary (VOCAB, IDS), the BPE helpers
 * merge(toks, pair) and pieces(word, vocab) (greedy longest match), and a
 * hand-made embedding table E for six words: columns are animal, fruit,
 * vehicle. N is E with every row scaled to length 1; cos(a, b) is cosine
 * similarity. Real embeddings are learned and have hundreds of columns.
 */
const PRELUDE = `import re
from collections import Counter
import numpy as np

VOCAB = ["<unk>", "the", "a", "cat", "dog",
         "sat", "on", "mat", "."]
IDS = {t: i for i, t in enumerate(VOCAB)}

def merge(toks, pair):
    out, i = [], 0
    while i < len(toks):
        if tuple(toks[i:i + 2]) == pair:
            out.append(toks[i] + toks[i + 1])
            i += 2
        else:
            out.append(toks[i])
            i += 1
    return out

def pieces(word, vocab):
    out = []
    while word:
        for n in range(len(word), 0, -1):
            if word[:n] in vocab or n == 1:
                out.append(word[:n])
                word = word[n:]
                break
    return out

WORDS = ["cat", "dog", "apple", "pear", "car", "bus"]
E = np.array([[0.9, 0.1, 0.0],
              [0.8, 0.2, 0.1],
              [0.1, 0.9, 0.0],
              [0.0, 0.8, 0.1],
              [0.0, 0.1, 0.9],
              [0.1, 0.0, 0.8]])
ID = {w: i for i, w in enumerate(WORDS)}
N = E / np.linalg.norm(E, axis=1, keepdims=True)

def cos(a, b):
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    return float(a @ b / (na * nb))`;

export const f10: Unit = {
  id: 'F10',
  track: 'foundations',
  title: 'Text as numbers',
  blurb: 'How text becomes numbers a model can use: tokens, vocabularies and ids, subword pieces, embeddings, and finding similar things with cosine similarity.',
  prelude: PRELUDE,
  lessons: [
    // ------------------------------------------------------------------ 1
    {
      id: 'f10-01',
      title: 'Tokens',
      summary: 'A model reads text as a list of pieces called tokens; how you split matters.',
      card: {
        title: 'Tokens',
        text: 'A model cannot read letters on a page; it reads a list of pieces called tokens. The simplest tokenizer splits on spaces, but then "Cat", "cat" and "cat." become three different tokens. Lower-casing and splitting off punctuation fix the worst of that.',
        code: `text = "The cat sat."
print(text.split())`,
        output: "['The', 'cat', 'sat.']",
      },
      exercises: [
        {
          id: 'f10-1-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: 'print("I like it. I do".split())',
          answer: "['I', 'like', 'it.', 'I', 'do']",
          options: [
            { text: "['I', 'like', 'it.', 'I', 'do']" },
            { text: "['I', 'like', 'it', 'I', 'do']", why: 'split only cuts at spaces: the full stop stays on "it".' },
            { text: "['I like it.', 'I do']", why: 'split with no argument cuts at every space, not at full stops.' },
          ],
          explain: 'Spaces are the only cut points.',
        },
        {
          id: 'f10-1-2',
          type: 'predict-output',
          prompt: 'How many tokens, and how many different ones?',
          code: `t = "the cat and the dog".split()
print(len(t), len(set(t)))`,
          answer: '5 4',
          typedWrong: [{ answer: '5 5', why: '"the" appears twice; a set keeps one copy.' }],
          explain: 'The different tokens are what a vocabulary must hold.',
        },
        {
          id: 'f10-1-3',
          type: 'predict-output',
          prompt: 'This pattern takes runs of letters, or single punctuation marks. What does it print?',
          code: `p = r"\\w+|[^\\w\\s]"
print(re.findall(p, "Hi, cat!"))`,
          answer: "['Hi', ',', 'cat', '!']",
          options: [
            { text: "['Hi', ',', 'cat', '!']" },
            { text: "['Hi,', 'cat!']", why: 'That is split(); the pattern cuts punctuation off.' },
            { text: "['Hi', 'cat']", why: 'Punctuation marks are kept, as tokens of their own.' },
          ],
          explain: 'Now "cat" is the same token wherever a comma follows it.',
        },
        {
          id: 'f10-1-4',
          type: 'fill-blank',
          prompt: 'Make "The" and "the" the same token.',
          code: `text = "The cat saw the cat"
print(sorted(set(text.___().split())))`,
          answer: ['lower'],
          distractors: [{ text: 'strip', why: 'strip removes outer spaces; the capital T stays.' }],
          expectOutput: "['cat', 'saw', 'the']",
          explain: 'Three different tokens instead of four.',
        },
        {
          id: 'f10-1-5',
          type: 'mcq',
          prompt: 'Why is it a problem when "cat" and "cat." are different tokens?',
          options: [
            { text: 'It must learn one word twice' },
            { text: 'Full stops cannot be stored', why: 'They can: as tokens of their own.' },
            { text: 'Text becomes longer', why: 'The length is the same; the waste is in what must be learned.' },
          ],
          answer: 0,
          explain: 'Everything learned about "cat" would not carry over to "cat.".',
        },
        {
          id: 'f10-1-6',
          type: 'run-code',
          prompt: 'Set `tokens` to the lower-case words and punctuation marks of `text`.',
          before: 'text = "Stop! The Cat."',
          solution: 'p = r"\\w+|[^\\w\\s]"\ntokens = re.findall(p, text.lower())',
          tests: 'assert tokens == ["stop", "!", "the", "cat", "."], f"got {tokens}"',
          maxLines: 2,
          placeholder: 'tokens = ...',
          explain: 'Lower-case first, then cut.',
        },
        {
          id: 'f10-1-7',
          type: 'predict-output',
          prompt: 'Which token is most common?',
          code: `t = "a b a c a b".split()
print(Counter(t).most_common(1))`,
          answer: "[('a', 3)]",
          typedWrong: [{ answer: "[('a', 2)]", why: 'Count again: a appears three times.' }],
          explain: 'Frequent tokens matter for the next lesson\'s vocabulary.',
        },
        {
          id: 'f10-1-8',
          type: 'predict-output',
          prompt: 'The pattern from above on "don\'t stop". What does it print?',
          code: `p = r"\\w+|[^\\w\\s]"
print(re.findall(p, "don't stop"))`,
          answer: '[\'don\', "\'", \'t\', \'stop\']',
          options: [
            { text: '[\'don\', "\'", \'t\', \'stop\']' },
            { text: '["don\'t", \'stop\']', why: 'The apostrophe is punctuation, so it is cut out.' },
            { text: "['dont', 'stop']", why: 'Nothing is deleted: the apostrophe becomes its own token.' },
          ],
          explain: 'Every rule has odd cases; real tokenizers settle them with learned pieces.',
        },
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: 'f10-02',
      title: 'Vocabulary and ids',
      summary: 'Each known token has a number, its position in the vocabulary; unknown tokens become <unk>.',
      card: {
        title: 'Vocabulary and ids',
        text: 'The vocabulary is the list of every token a model knows, and a token\'s position in it is its id. Encoding turns text into a list of ids and decoding turns ids back into text. Here `VOCAB` is a tiny vocabulary and `IDS` maps each token to its id.',
        code: `print(VOCAB[:5])
words = "the cat sat".split()
print([IDS[w] for w in words])`,
        output: "['<unk>', 'the', 'a', 'cat', 'dog']\n[1, 3, 5]",
      },
      exercises: [
        {
          id: 'f10-2-1',
          type: 'predict-output',
          prompt: 'Encode. What does this print?',
          code: `words = "a dog sat".split()
print([IDS[w] for w in words])`,
          answer: '[2, 4, 5]',
          typedWrong: [{ answer: '[1, 3, 4]', why: 'Ids start at 0, which is <unk>: "a" is at position 2.' }],
          explain: 'Count from 0 along VOCAB.',
        },
        {
          id: 'f10-2-2',
          type: 'predict-output',
          prompt: 'Decode. What does this print?',
          code: `ids = [3, 5, 6, 1, 7]
print(" ".join(VOCAB[i] for i in ids))`,
          answer: 'cat sat on the mat',
          typedWrong: [{ answer: 'dog on the mat .', why: 'Id 3 is "cat": position 3 counting from 0.' }],
          explain: 'Decoding is just indexing the list.',
        },
        {
          id: 'f10-2-3',
          type: 'predict-output',
          prompt: '"cow" is not in the vocabulary. What does this print?',
          code: `words = "the cow sat".split()
print([IDS.get(w, 0) for w in words])`,
          answer: '[1, 0, 5]',
          options: [
            { text: '[1, 0, 5]' },
            { text: '[1, 5]', why: 'Unknown words are not dropped: they get id 0.' },
            { text: 'KeyError', why: 'get with a default never raises.' },
          ],
          explain: 'Id 0 is <unk>, the unknown token.',
        },
        {
          id: 'f10-2-4',
          type: 'mcq',
          prompt: 'Why does a vocabulary need an <unk> token?',
          options: [
            { text: 'Text can hold words it lacks' },
            { text: 'To mark the end of a sentence', why: 'That is a different special token.' },
            { text: 'Every list must start with one', why: 'It is a design choice for unknown words.' },
          ],
          answer: 0,
          explain: 'Without it, encoding new text would crash.',
        },
        {
          id: 'f10-2-5',
          type: 'run-code',
          prompt: 'Write `encode(text)`: lower-case, split on spaces, and return the ids, using 0 for unknown words.',
          solution: `def encode(text):
    words = text.lower().split()
    return [IDS.get(w, 0)
            for w in words]`,
          tests: [
            'assert encode("The cat sat") == [1, 3, 5], f"got {encode(\'The cat sat\')}"',
            'assert encode("a cow") == [2, 0], "unknown words are 0"',
          ].join('\n'),
          maxLines: 3,
          placeholder: 'def encode(text):',
          explain: 'Real tokenizers do the same with 50,000 or more entries.',
        },
        {
          id: 'f10-2-6',
          type: 'predict-output',
          prompt: 'Encode, then decode. What does this print?',
          code: `words = "the cow sat".split()
ids = [IDS.get(w, 0) for w in words]
print(" ".join(VOCAB[i] for i in ids))`,
          answer: 'the <unk> sat',
          typedWrong: [{ answer: 'the cow sat', why: '"cow" became id 0; decoding gives <unk>.' }],
          explain: 'Information is lost; subword tokens, next lesson, avoid that.',
        },
        {
          id: 'f10-2-7',
          type: 'mcq',
          prompt: 'In a vocabulary of 50,000 tokens, what is a token\'s id?',
          options: [
            { text: 'Its position in the list' },
            { text: 'How often it appears', why: 'The id is just where it sits in the list.' },
            { text: 'A measure of its meaning', why: 'Ids are labels; meaning comes later, in embeddings.' },
          ],
          answer: 0,
          explain: 'Id 4 is not "twice" id 2: the numbers carry no meaning.',
        },
        {
          id: 'f10-2-8',
          type: 'predict-shape',
          prompt: 'Two sentences of three tokens each, as ids. What shape?',
          code: `ids = np.array([[1, 3, 5],
                [2, 4, 5]])`,
          target: 'ids',
          answer: '(2, 3)',
          options: [
            { text: '(2, 3)' },
            { text: '(3, 2)', why: 'One row per sentence: 2 rows of 3 ids.' },
            { text: '(6,)', why: 'The nested lists make two rows.' },
          ],
          explain: 'A batch of token ids is (sentences, tokens).',
        },
      ],
    },

    // ------------------------------------------------------------------ 3
    {
      id: 'f10-03',
      title: 'Subword tokens',
      summary: 'Real tokenizers use pieces of words, learned by repeatedly merging the most common pair.',
      card: {
        title: 'Subword tokens',
        text: 'Real tokenizers use pieces of words, so a fixed vocabulary can spell any word: "unhappy" might be "un" + "happy". Byte-pair encoding learns the pieces by starting from single characters and merging the most common neighbouring pair, again and again. Common words end up as one token and rare words as several.',
        code: `w = list("banana")
pairs = Counter(zip(w, w[1:]))
print(pairs.most_common(1))`,
        output: "[(('a', 'n'), 2)]",
      },
      exercises: [
        {
          id: 'f10-3-1',
          type: 'predict-output',
          prompt: '`merge(toks, pair)` joins every place the pair appears side by side. What does this print?',
          code: `w = list("banana")
print(merge(w, ("a", "n")))`,
          answer: "['b', 'an', 'an', 'a']",
          options: [
            { text: "['b', 'an', 'an', 'a']" },
            { text: "['b', 'an', 'ana']", why: 'Only the pair "a"+"n" is merged.' },
            { text: "['ban', 'an', 'a']", why: 'b was not part of the pair.' },
          ],
          explain: 'One merge step: the vocabulary gains "an".',
        },
        {
          id: 'f10-3-2',
          type: 'fill-blank',
          prompt: 'One BPE step: find the commonest pair, then merge it.',
          code: `w = list("aaab")
pairs = Counter(zip(w, w[1:]))
pair = pairs.most_common(1)[0][___]
print(merge(w, pair))`,
          answer: ['0'],
          distractors: [{ text: '1', why: 'Position 1 holds the count, not the pair.' }],
          expectOutput: "['aa', 'a', 'b']",
          explain: '"a a" appears twice; it becomes "aa" from the left.',
        },
        {
          id: 'f10-3-3',
          type: 'predict-output',
          prompt: '`pieces(word, vocab)` takes the longest known piece from the front each time. What does this print?',
          code: `v = {"un", "happy", "hap", "py"}
print(pieces("unhappy", v))`,
          answer: "['un', 'happy']",
          options: [
            { text: "['un', 'happy']" },
            { text: "['un', 'hap', 'py']", why: 'The longest match wins: "happy" beats "hap".' },
            { text: "['unhappy']", why: '"unhappy" is not in the vocabulary.' },
          ],
          explain: 'Longest first keeps the token count low.',
        },
        {
          id: 'f10-3-4',
          type: 'predict-output',
          prompt: 'A word with an unknown piece. What does this print?',
          code: `v = {"un", "help", "ful"}
print(pieces("unhelpfulz", v))`,
          answer: "['un', 'help', 'ful', 'z']",
          typedWrong: [{ answer: "['un', 'help', 'ful', '<unk>']", why: 'Single characters are always allowed, so nothing is unknown.' }],
          explain: 'Falling back to characters means no word is ever <unk>.',
        },
        {
          id: 'f10-3-5',
          type: 'mcq',
          prompt: 'Why do real tokenizers use subword pieces instead of whole words?',
          options: [
            { text: 'Any word can still be spelled' },
            { text: 'Pieces carry no meaning', why: 'They do; that is not the reason.' },
            { text: 'Whole words are too short', why: 'The problem is the unlimited number of words.' },
          ],
          answer: 0,
          explain: 'A fixed list of pieces covers new words, names and typos.',
        },
        {
          id: 'f10-3-6',
          type: 'run-code',
          prompt: 'Write `bpe_step(toks)`: merge the most common neighbouring pair.',
          solution: `def bpe_step(toks):
    c = Counter(zip(toks, toks[1:]))
    pair = c.most_common(1)[0][0]
    return merge(toks, pair)`,
          tests: [
            'assert bpe_step(list("abab")) == ["ab", "ab"], f"got {bpe_step(list(\'abab\'))}"',
            'assert bpe_step(["ab", "ab", "c"]) == ["abab", "c"], "pieces merge further"',
          ].join('\n'),
          maxLines: 4,
          placeholder: 'def bpe_step(toks):',
          explain: 'Run it a few thousand times over a big text and you have a tokenizer.',
        },
        {
          id: 'f10-3-7',
          type: 'mcq',
          prompt: 'An English page has 4,000 characters. Roughly how many tokens is that for a typical tokenizer?',
          options: [
            { text: 'About 1,000' },
            { text: 'About 4,000', why: 'Most tokens are longer than one character.' },
            { text: 'About 100', why: 'That would be 40 characters per token.' },
          ],
          answer: 0,
          explain: 'About four characters per token in English; more tokens per word in many other languages.',
        },
        {
          id: 'f10-3-8',
          type: 'mcq',
          prompt: 'A rare surname splits into 5 tokens; "the" is 1. What follows?',
          options: [
            { text: 'Rare words cost more tokens' },
            { text: 'Rare words are cheaper', why: 'More pieces means more tokens to pay for.' },
            { text: 'The name cannot be read', why: 'It can: as 5 pieces.' },
          ],
          answer: 0,
          explain: 'Token counts drive price and how much fits in the context window.',
        },
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: 'f10-04',
      title: 'Embeddings',
      summary: 'Each id looks up a row of numbers, its embedding; similar tokens get similar rows.',
      card: {
        title: 'Embeddings',
        text: 'Ids are only labels, so each id looks up a row in a table of numbers, its embedding, and training makes similar tokens get similar rows. Here `E` has one row per word in `WORDS` and three columns we chose by hand: animal, fruit, vehicle. Real tables are learned, with a row per token and hundreds of columns.',
        code: 'print(ID["cat"], E[ID["cat"]])',
        output: '0 [0.9 0.1 0. ]',
      },
      exercises: [
        {
          id: 'f10-4-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: 'print(E[ID["bus"]])',
          answer: '[0.1 0.  0.8]',
          options: [
            { text: '[0.1 0.  0.8]' },
            { text: '[0.  0.1 0.9]', why: 'That is "car", row 4; "bus" is row 5.' },
            { text: '5', why: 'ID gives 5; E[5] is the row of numbers.' },
          ],
          explain: 'Mostly vehicle, a little animal: our made-up numbers.',
        },
        {
          id: 'f10-4-2',
          type: 'predict-shape',
          prompt: 'The whole table. What shape?',
          code: '',
          target: 'E',
          answer: '(6, 3)',
          options: [
            { text: '(6, 3)' },
            { text: '(3, 6)', why: 'One row per word: 6 rows of 3 numbers.' },
            { text: '(6,)', why: 'Each word has a whole row.' },
          ],
          explain: '(vocabulary size, embedding size).',
        },
        {
          id: 'f10-4-3',
          type: 'predict-shape',
          prompt: 'Look up a three-token sentence at once. What shape?',
          code: `ids = [ID[w] for w in
       ["cat", "dog", "cat"]]`,
          target: 'E[ids]',
          answer: '(3, 3)',
          options: [
            { text: '(3, 3)' },
            { text: '(2, 3)', why: 'cat appears twice, and is looked up twice.' },
            { text: '(6, 3)', why: 'Only the three rows asked for come back.' },
          ],
          explain: 'One row per token: (tokens, embedding size).',
        },
        {
          id: 'f10-4-4',
          type: 'mcq',
          prompt: 'Why not feed the id numbers straight into the network?',
          options: [
            { text: 'Ids are arbitrary labels' },
            { text: 'They are too large', why: 'Size is not the issue; 4 is not "twice" 2 in meaning.' },
            { text: 'Networks cannot take integers', why: 'They could; the numbers would just mean nothing.' },
          ],
          answer: 0,
          explain: 'A row of learned numbers can carry meaning; a position in a list cannot.',
        },
        {
          id: 'f10-4-5',
          type: 'predict-output',
          prompt: 'A one-hot vector times the table. What does this print?',
          code: `x = np.zeros(6)
x[ID["pear"]] = 1
print(x @ E)`,
          answer: '[0.  0.8 0.1]',
          options: [
            { text: '[0.  0.8 0.1]' },
            { text: '[0. 0. 0. 1. 0. 0.]', why: 'That is x itself; x @ E picks a row of E.' },
            { text: '0.9', why: 'A vector times a matrix gives a vector.' },
          ],
          explain: 'Looking up a row is the same as multiplying by a one-hot vector: a matrix multiply.',
        },
        {
          id: 'f10-4-6',
          type: 'fill-blank',
          prompt: 'The vehicle column for "cat" and "bus".',
          code: `ids = [ID[w] for w in ["cat", "bus"]]
print(E[___][:, 2])`,
          answer: ['ids'],
          distractors: [{ text: '0', why: 'E[0] is one row; it has no second axis.' }],
          expectOutput: '[0.  0.8]',
          explain: 'Rows by ids, then column 2.',
        },
        {
          id: 'f10-4-7',
          type: 'run-code',
          prompt: 'Set `sent` to the mean of the embeddings of the words in `words`.',
          before: 'words = ["cat", "dog"]',
          solution: 'rows = E[[ID[w] for w in words]]\nsent = rows.mean(axis=0)',
          tests: 'assert np.allclose(sent, [0.85, 0.15, 0.05]), f"got {sent}"',
          maxLines: 2,
          placeholder: 'sent = ...',
          explain: 'Averaging is the simplest way to get one vector for a sentence.',
        },
        {
          id: 'f10-4-8',
          type: 'mcq',
          prompt: 'In a real model, who chooses the numbers in the embedding table?',
          options: [
            { text: 'Training, like any weights' },
            { text: 'Linguists, word by word', why: 'Only in this toy; real tables are learned.' },
            { text: 'The token ids', why: 'Ids pick the row; training fills it.' },
          ],
          answer: 0,
          explain: 'The table is a weight matrix, updated by backpropagation.',
        },
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: 'f10-05',
      title: 'Similarity',
      summary: 'Cosine similarity compares directions: 1 for the same way, 0 for unrelated.',
      card: {
        title: 'Similarity',
        text: 'Words used alike get embeddings that point the same way. Cosine similarity measures that: the dot product divided by both lengths, 1 for the same direction and 0 for unrelated. The prelude\'s `cos(a, b)` computes it.',
        code: `a = E[ID["cat"]]
b = E[ID["dog"]]
print(round(cos(a, b), 2))`,
        output: '0.98',
      },
      exercises: [
        {
          id: 'f10-5-1',
          type: 'predict-output',
          prompt: 'Cat and car. Type the similarity, rounded to 2 places.',
          code: `a = E[ID["cat"]]
b = E[ID["car"]]
print(round(cos(a, b), 2))`,
          answer: '0.01',
          typedWrong: [{ answer: '0.98', why: 'That was cat and dog; cat and car share almost nothing.' }],
          explain: 'Animal against vehicle: nearly at right angles.',
        },
        {
          id: 'f10-5-2',
          type: 'predict-output',
          prompt: 'Same direction, different lengths; then right angles. What does this print?',
          code: `a = np.array([1.0, 0.0])
b = np.array([3.0, 0.0])
c = np.array([0.0, 2.0])
print(cos(a, b), cos(a, c))`,
          answer: '1.0 0.0',
          options: [
            { text: '1.0 0.0' },
            { text: '3.0 0.0', why: 'Cosine divides by both lengths, so length cancels.' },
            { text: '0.33 2.0', why: 'Cosine is at most 1.' },
          ],
          explain: 'Cosine ignores length and measures direction only.',
        },
        {
          id: 'f10-5-3',
          type: 'mcq',
          prompt: 'In `E`, which pair is most similar?',
          options: [
            { text: 'apple and pear' },
            { text: 'apple and car', why: 'Fruit and vehicle columns barely overlap.' },
            { text: 'pear and bus', why: 'Fruit against vehicle again.' },
          ],
          answer: 0,
          code: `print(round(cos(E[2], E[3]), 2),
      round(cos(E[2], E[4]), 2),
      round(cos(E[3], E[5]), 2))`,
          explain: 'Both rows are mostly in the fruit column.',
        },
        {
          id: 'f10-5-4',
          type: 'fill-blank',
          prompt: 'Cosine by hand.',
          code: `def cosine(a, b):
    na = np.linalg.norm(a)
    nb = np.linalg.norm(b)
    return a @ b / (na ___ nb)

v = np.array([3.0, 4.0])
print(cosine(v, v))`,
          answer: ['*'],
          distractors: [{ text: '+', why: 'Divide by the product of the lengths: 25 / 25.' }],
          expectOutput: '1.0',
          explain: 'A vector is perfectly similar to itself.',
        },
        {
          id: 'f10-5-5',
          type: 'predict-output',
          prompt: 'A vector\'s length. What does this print?',
          code: 'print(np.linalg.norm([3.0, 4.0]))',
          answer: '5.0',
          typedWrong: [{ answer: '7.0', why: 'Length is the square root of 9 + 16.' }],
          explain: 'Pythagoras, in any number of dimensions.',
        },
        {
          id: 'f10-5-6',
          type: 'run-code',
          prompt: 'Set `best` to the word in `WORDS`, other than "apple", most similar to "apple".',
          solution: `a = E[ID["apple"]]
rest = [w for w in WORDS
        if w != "apple"]
best = max(rest, key=lambda w:
           cos(a, E[ID[w]]))`,
          tests: 'assert best == "pear", f"got {best}"',
          maxLines: 6,
          placeholder: 'best = ...',
          explain: 'max with a key picks the highest score.',
        },
        {
          id: 'f10-5-7',
          type: 'mcq',
          prompt: 'Why compare embeddings with cosine rather than the plain dot product?',
          options: [
            { text: 'Length should not count' },
            { text: 'Cosine is faster', why: 'It is slower: two extra lengths.' },
            { text: 'Dot products can be negative', why: 'So can cosines.' },
          ],
          answer: 0,
          explain: 'A long vector would score high with everything under a plain dot product.',
        },
        {
          id: 'f10-5-8',
          type: 'predict-output',
          prompt: 'Scale a vector to length 1. What does this print?',
          code: `a = np.array([3.0, 4.0])
u = a / np.linalg.norm(a)
print(u, round(u @ u, 6))`,
          answer: '[0.6 0.8] 1.0',
          typedWrong: [{ answer: '[3. 4.] 25.0', why: 'u is a divided by its length, 5.' }],
          explain: 'For unit vectors, the dot product is the cosine.',
        },
      ],
    },

    // ------------------------------------------------------------------ 6
    {
      id: 'f10-06',
      title: 'Similarity search',
      summary: 'Normalise the rows once; one matrix-vector product scores them all; argsort finds the top k.',
      card: {
        title: 'Similarity search',
        text: 'To find the rows most like a query, scale every row to length 1 once; then one matrix-vector product gives all the cosines. `np.argsort` orders the scores from low to high, so reverse it and take the first k. The prelude\'s `N` is `E` with its rows already scaled.',
        code: `q = N[ID["cat"]]
scores = N @ q
top = np.argsort(scores)[::-1][:3]
print([WORDS[i] for i in top])`,
        output: "['cat', 'dog', 'apple']",
      },
      exercises: [
        {
          id: 'f10-6-1',
          type: 'predict-output',
          prompt: 'The two nearest to "bus". What does this print?',
          code: `q = N[ID["bus"]]
top = np.argsort(N @ q)[::-1][:2]
print([WORDS[i] for i in top])`,
          answer: "['bus', 'car']",
          options: [
            { text: "['bus', 'car']" },
            { text: "['car', 'bus']", why: 'bus is most similar to itself: cosine 1.' },
            { text: "['bus', 'dog']", why: 'car shares the vehicle column.' },
          ],
          explain: 'The query always finds itself first if it is in the table.',
        },
        {
          id: 'f10-6-2',
          type: 'predict-shape',
          prompt: 'One score per word. What shape?',
          code: 'q = N[ID["cat"]]',
          target: 'N @ q',
          answer: '(6,)',
          options: [
            { text: '(6,)' },
            { text: '(3,)', why: '(6, 3) @ (3,): the 3 is summed away.' },
            { text: '(6, 3)', why: 'A matrix times a vector gives a vector.' },
          ],
          explain: 'Six dot products in one go.',
        },
        {
          id: 'f10-6-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: 'print(np.argsort([0.2, 0.9, 0.5]))',
          answer: '[0 2 1]',
          typedWrong: [{ answer: '[1 2 0]', why: 'argsort goes from smallest to largest: 0.2 is at index 0.' }],
          explain: 'argsort returns positions, smallest score first.',
        },
        {
          id: 'f10-6-4',
          type: 'fill-blank',
          prompt: 'The positions of the two highest scores, best first.',
          code: `s = np.array([0.2, 0.9, 0.5, 0.7])
top = np.argsort(s)[___][:2]
print(top)`,
          answer: ['::-1'],
          distractors: [{ text: '::1', why: 'That keeps the order lowest first.' }],
          expectOutput: '[1 3]',
          explain: '0.9 at position 1, then 0.7 at position 3.',
        },
        {
          id: 'f10-6-5',
          type: 'run-code',
          prompt: 'Write `search(qvec, k)`: the `k` words whose rows are most similar to `qvec`, best first. Use `N`.',
          solution: `def search(qvec, k):
    q = qvec / np.linalg.norm(qvec)
    s = N @ q
    top = np.argsort(s)[::-1][:k]
    return [WORDS[i] for i in top]`,
          tests: [
            'got = search(np.array([0.0, 1.0, 0.0]), 2)',
            'assert got == ["apple", "pear"], f"pure fruit; got {got}"',
            'assert search(np.array([0.0, 0.0, 5.0]), 1) == ["car"], "length must not matter"',
          ].join('\n'),
          maxLines: 5,
          placeholder: 'def search(qvec, k):',
          explain: 'This is the core of every vector database.',
        },
        {
          id: 'f10-6-6',
          type: 'predict-output',
          prompt: 'The nearest word to "pear", other than itself.',
          code: `s = N @ N[ID["pear"]]
i = np.argsort(s)[::-1][1]
print(WORDS[i])`,
          answer: 'apple',
          typedWrong: [{ answer: 'pear', why: 'Index [1] skips the first place, which is pear itself.' }],
          explain: 'Skip position 0 when the query is in the table.',
        },
        {
          id: 'f10-6-7',
          type: 'mcq',
          prompt: 'A query is a sentence, not one word. The simplest way to get one vector for it?',
          options: [
            { text: 'Average its token embeddings' },
            { text: 'Use the first token only', why: 'That ignores the rest of the sentence.' },
            { text: 'Add up its token ids', why: 'Ids are labels; their sum means nothing.' },
          ],
          answer: 0,
          explain: 'Real systems use a model trained to embed whole sentences, but the idea is the same.',
        },
        {
          id: 'f10-6-8',
          type: 'mcq',
          prompt: 'With ten million rows, why not score every row for each query?',
          options: [
            { text: 'Too slow per query' },
            { text: 'Cosine stops working', why: 'It works; it is just a lot of dot products.' },
            { text: 'Rows run out of memory', why: 'The cost is time per query.' },
          ],
          answer: 0,
          explain: 'Vector databases use approximate indexes that check only promising rows.',
        },
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: 'f10-07',
      title: 'Checkpoint: text as numbers',
      summary: 'Tokens, ids, subwords, embeddings, cosine and search, mixed.',
      checkpoint: true,
      card: {
        title: 'Checkpoint',
        text: 'Ten questions across the unit. Get 8 right first time to test out.',
      },
      exercises: [
        {
          id: 'f10-7-1',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `p = r"\\w+|[^\\w\\s]"
print(re.findall(p, "Go, dog."))`,
          answer: "['Go', ',', 'dog', '.']",
          typedWrong: [{ answer: "['Go,', 'dog.']", why: 'The pattern cuts punctuation off.' }],
          explain: 'Words and punctuation, separately.',
        },
        {
          id: 'f10-7-2',
          type: 'predict-output',
          prompt: 'Encode with <unk> as 0.',
          code: `words = "the bird sat".split()
print([IDS.get(w, 0) for w in words])`,
          answer: '[1, 0, 5]',
          typedWrong: [{ answer: '[1, 5]', why: 'Unknown words get id 0; they are not dropped.' }],
          explain: '"bird" is not in VOCAB.',
        },
        {
          id: 'f10-7-3',
          type: 'predict-output',
          prompt: 'What does this print?',
          code: `w = list("abcab")
print(merge(w, ("a", "b")))`,
          answer: "['ab', 'c', 'ab']",
          typedWrong: [{ answer: "['ab', 'c', 'a', 'b']", why: 'Every occurrence of the pair is merged.' }],
          explain: 'One BPE merge.',
        },
        {
          id: 'f10-7-4',
          type: 'mcq',
          prompt: 'A tokenizer never produces <unk>, even for made-up words. Why?',
          options: [
            { text: 'It falls back to characters' },
            { text: 'It knows every word', why: 'No list holds every word.' },
            { text: 'It deletes unknown words', why: 'Nothing is deleted; it uses smaller pieces.' },
          ],
          answer: 0,
          explain: 'Byte-level tokenizers can spell anything.',
        },
        {
          id: 'f10-7-5',
          type: 'predict-shape',
          prompt: 'A batch of 4 sentences, 10 tokens each, looked up in a table with 512 columns. What shape?',
          code: `table = np.zeros((1000, 512))
ids = np.zeros((4, 10), dtype=int)`,
          target: 'table[ids]',
          answer: '(4, 10, 512)',
          options: [
            { text: '(4, 10, 512)' },
            { text: '(4, 512)', why: 'Each of the 40 ids gets its own row.' },
            { text: '(1000, 512)', why: 'Only the rows asked for come back.' },
          ],
          explain: 'Each id becomes a row: (batch, tokens, embedding size).',
        },
        {
          id: 'f10-7-6',
          type: 'predict-output',
          prompt: 'Type the similarity, rounded to 2 places.',
          code: `a = np.array([1.0, 1.0])
b = np.array([1.0, 0.0])
print(round(cos(a, b), 2))`,
          answer: '0.71',
          typedWrong: [{ answer: '1.0', why: 'The dot product is 1, but a has length √2.' }],
          explain: '1 / √2: a 45-degree angle.',
        },
        {
          id: 'f10-7-7',
          type: 'mcq',
          prompt: 'Which operation turns a token id into its embedding?',
          options: [
            { text: 'Looking up a row of a table' },
            { text: 'Dividing by the vocabulary size', why: 'That still treats the id as a quantity.' },
            { text: 'Taking a cosine', why: 'Cosine compares two embeddings you already have.' },
          ],
          answer: 0,
          explain: 'Equivalent to a one-hot vector times the table.',
        },
        {
          id: 'f10-7-8',
          type: 'fill-blank',
          prompt: 'Scale every row of `E` to length 1.',
          code: `n = np.linalg.norm(E, axis=___,
                   keepdims=True)
print(np.allclose(E / n, N))`,
          answer: ['1'],
          distractors: [{ text: '0', why: 'axis=0 gives one length per column, not per row.' }],
          expectOutput: 'True',
          explain: 'One length per row, kept as a column so it broadcasts.',
        },
        {
          id: 'f10-7-9',
          type: 'run-code',
          prompt: 'Set `top2` to the two words nearest to "dog", best first, not counting "dog" itself.',
          solution: `s = N @ N[ID["dog"]]
order = np.argsort(s)[::-1]
top2 = [WORDS[i] for i in order[1:3]]`,
          tests: 'assert top2 == ["cat", "apple"], f"got {top2}"',
          maxLines: 4,
          placeholder: 'top2 = ...',
          explain: 'Skip position 0: the query itself.',
        },
        {
          id: 'f10-7-10',
          type: 'mcq',
          prompt: 'A RAG system finds documents for a question. Which part of this unit does it use?',
          options: [
            { text: 'Embeddings and search' },
            { text: 'BPE merges and decoding', why: 'Tokenising happens, but finding documents is search.' },
            { text: 'The <unk> token and ids', why: 'Retrieval compares vectors.' },
          ],
          answer: 0,
          explain: 'Embed the question, score every chunk, return the top k: unit E6.',
        },
      ],
    },
  ],
  labs: f10Labs,
  library: f10Library,
};
