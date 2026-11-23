import type { Walkthrough } from '../schema';

/*
 * Walkthrough 7: search autocomplete, through the seven-step framework.
 * Unlocks after S1-S4 (requests, estimation, scaling, caching) and S11
 * (indexes, counting at scale, batch processing).
 */
export const autocomplete: Walkthrough = {
  id: 'w-autocomplete',
  title: 'Search autocomplete',
  question: 'Design search autocomplete: as someone types, show the five most popular searches that start with what they have typed so far.',
  needs: ['S1', 'S2', 'S3', 'S4', 'S11'],
  minutes: 17,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "10 million daily users, about 10 searches each, roughly 20 characters a search. Suggestions must appear while typing."',
      exercises: [
        {
          id: 'wac-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Top 5 by popularity', bucket: 0, why: 'The core feature, stated.' },
            { text: 'Lowercase English only', bucket: 0, why: 'Keeps v1 simple; other languages later.' },
            { text: 'Popularity updated daily', bucket: 0, why: 'Suggestions must follow what people search.' },
            { text: 'Spelling correction', bucket: 1, why: 'A separate feature with its own model.' },
            { text: 'Suggestions per user', bucket: 1, why: 'Personalisation needs each user\'s history.' },
            { text: 'Many languages', bucket: 1, why: 'Each language needs its own data.' },
          ],
          explain: 'Prefix in, five popular searches out.',
        },
        {
          id: 'wac-1-2',
          type: 'mcq',
          prompt: 'How fast must suggestions come back?',
          options: [
            { text: 'Within about 100 ms' },
            { text: 'Within about 2 seconds', why: 'The user has typed several more letters by then.' },
            { text: 'As slow as full search', why: 'Suggestions must keep up with typing.' },
          ],
          answer: 0,
          explain: 'Faster than the gap between keystrokes, or the list lags behind.',
        },
        {
          id: 'wac-1-3',
          type: 'scenario',
          prompt: 'How fresh must popularity be?',
          situation: 'A news event can make a new search popular within an hour.',
          needs: ['Trending searches show up', 'Building stays cheap'],
          options: [
            { text: 'Daily rebuild, hourly trends', cost: 'Two paths to build and merge.' },
            {
              text: 'Recount on every keystroke',
              cost: 'Always exact.',
              why: 'Counting billions of searches per keystroke is impossible.',
            },
            {
              text: 'Rebuild once a month',
              cost: 'The cheapest to run.',
              why: 'Misses news and trends entirely.',
            },
          ],
          answer: 0,
          explain: 'Most popularity changes slowly; only a small trending set needs fast updates.',
        },
      ],
      strong: 'The five most popular searches for a prefix, lowercase English, under about 100 ms; popularity rebuilt daily with a small trending set updated hourly; spelling and personalisation later.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "Assume one request per keystroke unless you say otherwise."',
      exercises: [
        {
          id: 'wac-2-1',
          type: 'estimate',
          prompt: 'Searches per second, on average?',
          expr: '10e6 * 10 / DAY',
          answer: 1157,
          tolerance: 2,
          unit: 'searches/s',
          options: [
            { value: 120, why: '10⁸ a day / 86,400 s ≈ 1,160 a second.' },
            { value: 1200 },
            { value: 12000, why: 'That would be a billion searches a day.' },
          ],
          work: ['10⁷ users × 10 = 10⁸ searches a day', '10⁸ / 86,400 ≈ 1,160 a second'],
          explain: 'Each search is typed letter by letter, which multiplies this.',
        },
        {
          id: 'wac-2-2',
          type: 'estimate',
          prompt: 'Autocomplete requests per second, one per keystroke?',
          expr: '10e6 * 10 * 20 / DAY',
          answer: 23000,
          tolerance: 2,
          unit: 'requests/s',
          options: [
            { value: 2300, why: 'Multiply the 1,160 searches by 20 keystrokes each.' },
            { value: 23000 },
            { value: 230000, why: '1,160 × 20 is about 23,000, not 230,000.' },
          ],
          work: ['1,160 searches/s × 20 keystrokes ≈ 23,000/s'],
          explain: 'Peak is perhaps twice that: about 50,000 a second.',
        },
        {
          id: 'wac-2-3',
          type: 'mcq',
          prompt: 'About 50,000 requests a second at peak. What does that suggest?',
          options: [
            { text: 'Answer from memory; cache hard' },
            { text: 'One SQL query per keystroke', why: 'Tens of thousands of prefix queries a second would swamp a database.' },
            { text: 'One request per whole word', why: 'Suggestions are needed in the middle of a word.' },
          ],
          answer: 0,
          explain: 'Precompute the answers so each request is a memory lookup.',
        },
      ],
      strong: 'About 1,200 searches a second become about 23,000 autocomplete requests a second, 50,000 at peak: answers must come from memory, precomputed, and cached close to users.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'One read endpoint, called while the user types.',
      exercises: [
        {
          id: 'wac-3-1',
          type: 'mcq',
          prompt: 'Which request shape?',
          options: [
            { text: 'GET /suggest?q=pyth' },
            { text: 'POST /suggest with JSON', why: 'A GET can be cached by browsers and CDNs; reading needs no body.' },
            { text: 'A new WebSocket per key', why: 'Far more machinery than a cached GET needs.' },
          ],
          answer: 0,
          explain: 'The same prefix gives the same answer, so caches can share it.',
        },
        {
          id: 'wac-3-2',
          type: 'order-steps',
          prompt: 'Put the client\'s work for one keystroke in order.',
          steps: [
            'The user types a character',
            'The client waits briefly for more typing',
            'It sends GET /suggest with the prefix',
            'The reply arrives',
            'It drops the reply if the prefix has changed',
            'It shows the five suggestions',
          ],
          explain: 'Waiting (debouncing) cuts requests; dropping late replies stops old lists flashing up.',
        },
        {
          id: 'wac-3-3',
          type: 'predict-output',
          prompt: 'The client sends only when the user pauses for more than 100 ms (or stops). Keystroke times in ms: how many requests?',
          code: `times = [0, 50, 90, 400, 450, 900]
sent = 0
for i, t in enumerate(times):
    last = i == len(times) - 1
    if last or times[i + 1] - t > 100:
        sent += 1
print(sent)`,
          answer: '3',
          typedWrong: [{ answer: '6', why: 'Only pauses over 100 ms (and the last keystroke) send.' }],
          explain: 'Six keystrokes, three requests: debouncing halves the load or better.',
        },
      ],
      strong: 'GET /suggest?q=prefix returning five strings, cacheable by browsers and CDNs; the client debounces keystrokes and ignores replies for a prefix it has moved past.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Choose a structure that answers "top five for this prefix" in one step.',
      exercises: [
        {
          id: 'wac-4-1',
          type: 'scenario',
          prompt: 'How do you find the top five for a prefix quickly?',
          situation: 'About 50,000 lookups a second at peak.',
          needs: ['One quick lookup per request', 'Ordered by popularity'],
          options: [
            { text: 'A trie, top 5 stored per node', cost: 'More memory, and a rebuild to update.' },
            {
              text: 'Scan all searches each time',
              cost: 'No extra structure.',
              why: 'Millions of searches scanned per keystroke.',
            },
            {
              text: 'SQL LIKE \'prefix%\' query',
              cost: 'Uses an existing database.',
              why: 'A database query and sort per keystroke at 50,000 a second.',
            },
          ],
          answer: 0,
          explain: 'Walk down the trie to the prefix\'s node; its top five are already there.',
        },
        {
          id: 'wac-4-2',
          type: 'predict-output',
          prompt: 'Build each prefix\'s list of searches, then sort the "pi" list by count. What are the top two?',
          code: `counts = {"pizza": 9, "pie": 5,
          "pixel": 7, "pine": 2}
top = {}
for q in counts:
    for i in range(1, len(q) + 1):
        p = q[:i]
        top[p] = top.get(p, []) + [q]
pi = top["pi"]
pi.sort(key=counts.get, reverse=True)
print(pi[:2])`,
          answer: "['pizza', 'pixel']",
          typedWrong: [{ answer: "['pizza', 'pie']", why: 'By count, pixel (7) comes before pie (5).' }],
          explain: 'A real build sorts once and keeps only the top five per prefix, so a lookup never sorts.',
        },
        {
          id: 'wac-4-3',
          type: 'estimate',
          prompt: 'An upper bound: 10 million distinct searches of 20 characters, one node per character, 100 bytes per node with its top-five list. How many GB?',
          expr: '10e6 * 20 * 100 / GB',
          answer: 20,
          tolerance: 2,
          unit: 'GB',
          options: [
            { value: 2, why: '10⁷ × 20 × 100 B = 2 × 10¹⁰ B = 20 GB.' },
            { value: 20 },
            { value: 200, why: '2 × 10¹⁰ bytes is 20 GB.' },
          ],
          work: ['10⁷ × 20 nodes = 2 × 10⁸ nodes', '× 100 B = 2 × 10¹⁰ B = 20 GB'],
          explain: 'Shared prefixes make the real trie much smaller: it fits in memory.',
        },
      ],
      strong: 'A trie of popular searches where each node stores its top five, at most about 20 GB and in practice less because prefixes are shared; held in memory, rebuilt from counts.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'A serving path that reads the trie, and a building path that makes it.',
      exercises: [
        {
          id: 'wac-5-1',
          type: 'diagram',
          prompt: 'The suggest service answers from a structure held in memory. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Browsers' },
              { id: 'n', kind: 'cdn', label: 'CDN' },
              { id: 's', kind: 'service', label: 'Suggest API' },
              { id: 't', kind: 'cache', label: 'Trie (RAM)' },
            ],
            edges: [
              { from: 'c', to: 'n' },
              { from: 'n', to: 's' },
              { from: 's', to: 't' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 't',
            options: [
              { kind: 'cache', label: 'Trie in RAM' },
              { kind: 'db', label: 'SQL table', why: 'A database query per keystroke is too slow at this rate.' },
              { kind: 'search', label: 'Full search', why: 'A full-text index ranks documents, not search popularity by prefix.' },
            ],
            answer: 0,
          },
          explain: 'Each suggest server holds a copy of the trie in memory.',
        },
        {
          id: 'wac-5-2',
          type: 'diagram',
          prompt: 'A prefix the CDN has not cached. Tap its path from the browser to the trie.',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Browsers' },
              { id: 'n', kind: 'cdn', label: 'CDN' },
              { id: 's', kind: 'service', label: 'Suggest API' },
              { id: 't', kind: 'cache', label: 'Trie (RAM)' },
              { id: 'l', kind: 'queue', label: 'Search log' },
              { id: 'b', kind: 'worker', label: 'Builder' },
            ],
            edges: [
              { from: 'c', to: 'n' },
              { from: 'n', to: 's' },
              { from: 's', to: 't' },
              { from: 'l', to: 'b' },
              { from: 'b', to: 't', dashed: true },
            ],
          },
          goal: { kind: 'path', answer: ['c', 'n', 's', 't'] },
          explain: 'The builder path runs beside it, daily, and never on a user\'s request.',
        },
        {
          id: 'wac-5-3',
          type: 'mcq',
          prompt: 'Why can a CDN cache suggestions?',
          options: [
            { text: 'Same prefix, same answer for all' },
            { text: 'CDNs store every possible prefix', why: 'They cache only what was asked recently.' },
            { text: 'Suggestions never change at all', why: 'They change daily; a short cache lifetime handles that.' },
          ],
          answer: 0,
          explain: 'Popular prefixes are answered at the edge, near the user.',
        },
      ],
      strong: 'Browser → CDN → suggest API → trie in memory; separately, logged searches → a daily builder that makes a new trie and ships it to the suggest servers.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Browsers' },
          { id: 'n', kind: 'cdn', label: 'CDN' },
          { id: 's', kind: 'service', label: 'Suggest API' },
          { id: 't', kind: 'cache', label: 'Trie (RAM)' },
          { id: 'l', kind: 'queue', label: 'Search log' },
          { id: 'b', kind: 'worker', label: 'Builder' },
        ],
        edges: [
          { from: 'c', to: 'n' },
          { from: 'n', to: 's' },
          { from: 's', to: 't' },
          { from: 'l', to: 'b' },
          { from: 'b', to: 't', label: 'daily', dashed: true },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: keeping popularity up to date without slowing the serving path.',
      exercises: [
        {
          id: 'wac-6-1',
          type: 'order-steps',
          prompt: 'Put the daily build in order.',
          steps: [
            'Searches are logged as they happen',
            'A batch job counts each search for the day',
            'It drops rare and blocked searches',
            'It builds a new trie with the top five per node',
            'Suggest servers load the new trie and swap it in',
          ],
          explain: 'Batch processing (S11): count once a day, serve all day.',
        },
        {
          id: 'wac-6-2',
          type: 'scenario',
          prompt: 'How does a suggest server switch to the new counts?',
          situation: 'It serves thousands of lookups a second the whole time.',
          needs: ['No pause in serving', 'No half-updated answers'],
          options: [
            { text: 'Load a new trie, then swap', cost: 'Twice the memory during the switch.' },
            {
              text: 'Update counts in place live',
              cost: 'Always current.',
              why: 'Readers see half-updated top-five lists, and writes compete with reads.',
            },
            {
              text: 'Restart with the new file',
              cost: 'Simple to run.',
              why: 'The server stops answering while it loads.',
            },
          ],
          answer: 0,
          explain: 'Build the new trie beside the old, then switch one pointer.',
        },
        {
          id: 'wac-6-3',
          type: 'mcq',
          prompt: 'An offensive search becomes popular. Where do you stop it?',
          options: [
            { text: 'A blocklist at build time' },
            { text: 'Wait for it to stop trending', why: 'It would be shown to millions meanwhile.' },
            { text: 'Delete it from search logs', why: 'Logs are needed elsewhere; filtering the suggestions is enough.' },
          ],
          answer: 0,
          explain: 'Plus a small blocklist checked when serving, for urgent removals between builds.',
        },
      ],
      strong: 'Searches are logged, counted in a daily batch, filtered against a blocklist and built into a new trie that servers load beside the old one and swap in; trending searches are merged in hourly from a smaller stream count.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Find the hot spots, then grow the data past one machine\'s memory.',
      exercises: [
        {
          id: 'wac-7-1',
          type: 'scenario',
          prompt: 'One- and two-letter prefixes like "s" and "th" are asked constantly.',
          situation: 'They are a tiny set but a large share of traffic.',
          needs: ['Serve them cheaply', 'Keep answers current'],
          options: [
            { text: 'Precompute and cache them', cost: 'A small list to refresh each build.' },
            {
              text: 'Shard by the first letter',
              cost: 'Spreads the trie.',
              why: 'The "s" shard is far busier than the "x" shard.',
            },
          ],
          answer: 0,
          explain: 'A few thousand short prefixes, cached at the CDN and in the browser.',
        },
        {
          id: 'wac-7-2',
          type: 'mcq',
          prompt: 'The trie outgrows one machine\'s memory. How do you split it?',
          options: [
            { text: 'Prefix ranges, balanced by load' },
            { text: 'By first letter, one per shard', why: 'Letters are very uneven: far more searches start with s than x.' },
            { text: 'A full copy on every server', why: 'It no longer fits on one, so a full copy cannot either.' },
          ],
          answer: 0,
          explain: 'Ranges such as "a–ca", "cb–f" chosen so each shard gets similar traffic.',
        },
        {
          id: 'wac-7-3',
          type: 'bucket-sort',
          prompt: 'Which work is on the serving path, and which on the building path?',
          buckets: ['Serve path', 'Build path'],
          items: [
            { text: 'Answering a prefix', bucket: 0, why: 'Done on every request, in memory.' },
            { text: 'Counting a day of searches', bucket: 1, why: 'A batch job, once a day.' },
            { text: 'Browser debouncing', bucket: 0, why: 'Cuts requests as the user types.' },
            { text: 'Filtering blocked searches', bucket: 1, why: 'Done once, when the trie is built.' },
            { text: 'CDN caching of answers', bucket: 0, why: 'Answers popular prefixes at the edge.' },
            { text: 'Writing the new trie file', bucket: 1, why: 'Shipped to servers after the build.' },
          ],
          explain: 'Keep the serving path tiny; put the heavy work in the build.',
        },
      ],
      strong: 'Short prefixes are precomputed and cached at the edge; at 10× the trie is split into prefix ranges balanced by traffic, and all heavy counting stays on the batch building path.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'c', kind: 'client', label: 'Browsers' },
        { id: 'n', kind: 'cdn', label: 'CDN' },
        { id: 's', kind: 'service', label: 'Suggest API' },
        { id: 't', kind: 'cache', label: 'Trie (RAM)' },
        { id: 'l', kind: 'queue', label: 'Search log' },
        { id: 'b', kind: 'worker', label: 'Builder' },
      ],
      edges: [
        { from: 'c', to: 'n', label: 'GET' },
        { from: 'n', to: 's' },
        { from: 's', to: 't' },
        { from: 'l', to: 'b' },
        { from: 'b', to: 't', label: 'daily', dashed: true },
      ],
    },
    decisions: [
      'A trie in memory with the top five stored at each node: one lookup per request.',
      'GET /suggest?q=, cached by browser and CDN; the client debounces keystrokes.',
      'Daily batch build from logged searches, filtered by a blocklist, swapped in whole.',
      'Trending searches merged hourly from a smaller stream count.',
      'At 10×: split the trie into prefix ranges balanced by traffic.',
    ],
  },
  blank: {
    requirements: [
      'Top five popular searches for a prefix',
      'Under about 100 ms while typing',
      'Popularity updated daily, trends faster',
      'About 50,000 requests a second at peak',
      'Offensive suggestions can be removed',
    ],
    components: ['client', 'cdn', 'service', 'cache', 'queue', 'worker'],
    firstFive: [
      'Ask how many users and searches, and how fresh popularity must be',
      'Say the latency target: faster than typing',
      'Estimate requests a second, one per keystroke, and say debouncing cuts it',
      'Choose the trie with top five per node',
      'Separate the serving path from the building path',
    ],
  },
};
