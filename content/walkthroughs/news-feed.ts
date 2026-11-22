import type { Walkthrough } from '../schema';

/*
 * Walkthrough 4: a social news feed, through the seven-step framework.
 * Unlocks after S1-S6 (caching, databases, partitioning).
 */
export const newsFeed: Walkthrough = {
  id: 'w-news-feed',
  title: 'News feed',
  question: 'Design the home feed of a social app: users follow others and see recent posts from the people they follow, newest first.',
  needs: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
  minutes: 20,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "Users post text and photos, follow others, and open a feed of followed users\' posts, newest first. Ranking can come later."',
      exercises: [
        {
          id: 'wnf-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Create a post with text or a photo', bucket: 0, why: 'Feeds need posts.' },
            { text: 'Follow another user', bucket: 0, why: 'Follows decide what a feed shows.' },
            { text: 'Home feed, newest first', bucket: 0, why: 'The core feature, stated.' },
            { text: 'Ranking by engagement', bucket: 1, why: 'Stated as later.' },
            { text: 'Comments and likes', bucket: 1, why: 'Not asked for; keep v1 small.' },
            { text: 'Ads in the feed', bucket: 1, why: 'A separate system, not asked for.' },
          ],
          explain: 'Post, follow, read: three features to design properly.',
        },
        {
          id: 'wnf-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most?',
          options: [
            { text: 'Fast feed loads; slight lag OK' },
            { text: 'Posts show up everywhere at once', why: 'A few seconds\' delay before followers see a post is fine.' },
            { text: 'Strict global ordering of posts', why: 'Newest-first per feed is enough; global order costs coordination.' },
          ],
          answer: 0,
          explain: 'Availability and read latency over strong consistency (S7).',
        },
        {
          id: 'wnf-1-3',
          type: 'order-steps',
          prompt: 'Put your opening questions in a sensible order.',
          steps: [
            'Which features are in scope?',
            'How many daily users, feed opens and posts?',
            'How many accounts does a user follow, and what is the largest follower count?',
            'How fresh must the feed be, and how fast must it load?',
          ],
          explain: 'The largest follower count hints at the hard part, which comes in the deep dive.',
        },
      ],
      strong: 'Post, follow and a reverse-time home feed are in; ranking, comments and ads are out. The feed must load fast and stay available; a few seconds of delay before followers see a post is acceptable.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "200 million daily users open the feed 10 times and post 0.5 times a day on average. A user follows about 200 accounts; some accounts have 50 million followers."',
      exercises: [
        {
          id: 'wnf-2-1',
          type: 'estimate',
          prompt: 'Feed reads per second, on average?',
          expr: '200e6 * 10 / DAY',
          answer: 23148,
          tolerance: 2,
          unit: 'reads/s',
          options: [
            { value: 2315, why: '2 × 10⁹ a day ÷ 86,400 ≈ 23,000.' },
            { value: 23148 },
            { value: 231481, why: 'One factor of ten too many.' },
          ],
          work: ['200 million × 10 = 2 × 10⁹ a day', '÷ 86,400 ≈ 23,000 per second'],
          explain: 'Peaks perhaps three times that.',
        },
        {
          id: 'wnf-2-2',
          type: 'estimate',
          prompt: 'New posts per second, on average?',
          expr: '200e6 * 0.5 / DAY',
          answer: 1157,
          tolerance: 2,
          unit: 'posts/s',
          options: [
            { value: 116, why: '10⁸ a day ÷ 86,400 ≈ 1,160.' },
            { value: 1157 },
            { value: 11574, why: 'One factor of ten too many.' },
          ],
          work: ['200 million × 0.5 = 10⁸ a day', '÷ 86,400 ≈ 1,160 per second'],
          explain: 'Twenty times fewer posts than feed reads.',
        },
        {
          id: 'wnf-2-3',
          type: 'estimate',
          prompt: 'If every post is copied into each follower\'s feed (200 on average), feed writes per second?',
          expr: '200e6 * 0.5 / DAY * 200',
          answer: 231481,
          tolerance: 2,
          unit: 'writes/s',
          options: [
            { value: 23148, why: '1,160 posts × 200 followers ≈ 230,000.' },
            { value: 231481 },
            { value: 2314815, why: 'One factor of ten too many.' },
          ],
          work: ['1,157 posts/s × 200 followers ≈ 231,000 feed writes/s'],
          explain: 'Large but spread out: feed entries are small and go to many shards.',
        },
      ],
      strong: 'About 23,000 feed reads and 1,200 posts a second on average; copying each post to followers\' feeds costs about 230,000 small writes a second, which buys cheap reads. Celebrity accounts are the outlier to plan for.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Three endpoints cover version 1.',
      exercises: [
        {
          id: 'wnf-3-1',
          type: 'match-pairs',
          prompt: 'Match each request to what it does.',
          pairs: [
            { left: 'POST /posts', right: '201 with the post id', why: 'Creates a post.' },
            { left: 'GET /feed?cursor=…', right: 'a page of posts, newest first', why: 'Reads the home feed a page at a time.' },
            { left: 'POST /follows', right: 'follows another user', why: 'Changes what the feed will show.' },
          ],
          explain: 'Photos upload straight to object storage with a signed URL (S11).',
        },
        {
          id: 'wnf-3-2',
          type: 'mcq',
          prompt: 'How should the feed be paged?',
          options: [
            { text: 'A cursor from the last post' },
            { text: 'Page numbers with offsets', why: 'New posts shift every page, so posts repeat or vanish (S9).' },
            { text: 'Every post in one reply', why: 'Feeds are endless; send a page at a time.' },
          ],
          answer: 0,
          explain: '"Posts older than this one" stays correct while new posts arrive.',
        },
      ],
      strong: 'POST /posts returns 201; GET /feed takes a cursor and a page size and returns posts newest first with the next cursor; POST and DELETE /follows change the graph.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Posts, the follow graph, feeds and photos each have a natural home.',
      exercises: [
        {
          id: 'wnf-4-1',
          type: 'bucket-sort',
          prompt: 'Where does each live?',
          buckets: ['Database', 'Cache', 'Object store'],
          items: [
            { text: 'Posts (text, author, time)', bucket: 0, why: 'Durable, looked up by id.' },
            { text: 'Who follows whom', bucket: 0, why: 'Durable, queried both ways.' },
            { text: 'Each user\'s recent feed ids', bucket: 1, why: 'Precomputed, rebuildable, read constantly.' },
            { text: 'Photo files', bucket: 2, why: 'Large blobs, served through a CDN.' },
            { text: 'Hot posts\' contents', bucket: 1, why: 'Read millions of times; cache them.' },
          ],
          explain: 'The cache holds derived data that can be rebuilt from the database.',
        },
        {
          id: 'wnf-4-2',
          type: 'predict-output',
          prompt: 'Building a feed at read time: merge the followed users\' posts, newest first. What are the top three?',
          code: `by = {"ann": [(9, "a9"), (3, "a3")],
      "bo": [(7, "b7"), (5, "b5")]}
follows = ["ann", "bo"]
feed = sorted((p for u in follows
               for p in by[u]),
              reverse=True)
print([t for _, t in feed[:3]])`,
          answer: "['a9', 'b7', 'b5']",
          typedWrong: [{ answer: "['a9', 'a3', 'b7']", why: 'Posts are sorted by time across both users.' }],
          explain: 'Fine for 2 users; with 200 followed users on every open, it is slow.',
        },
        {
          id: 'wnf-4-3',
          type: 'mcq',
          prompt: 'Shard the posts table by what?',
          options: [
            { text: 'The author\'s user id' },
            { text: 'The post\'s timestamp', why: 'Every new post would land on the same shard (S6).' },
            { text: 'The country of the post', why: 'Countries differ wildly in size: hot shards.' },
          ],
          answer: 0,
          explain: 'One author\'s posts sit together; load spreads evenly across authors.',
        },
      ],
      strong: 'Posts sharded by author id; a follows table indexed both ways; each user\'s feed as a list of recent post ids in a cache; photos in object storage behind a CDN.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Precompute feeds when posts are written, so reading a feed is one cache lookup.',
      exercises: [
        {
          id: 'wnf-5-1',
          type: 'diagram',
          prompt: 'Posting must not wait while 200 feeds are updated. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'App' },
              { id: 'a', kind: 'service', label: 'Post API' },
              { id: 'q', kind: 'queue', label: 'Fan-out q' },
              { id: 'w', kind: 'worker', label: 'Fan-out' },
              { id: 'k', kind: 'cache', label: 'Feed cache' },
              { id: 'f', kind: 'service', label: 'Feed API' },
            ],
            edges: [
              { from: 'c', to: 'a' },
              { from: 'c', to: 'f' },
              { from: 'a', to: 'q' },
              { from: 'q', to: 'w' },
              { from: 'w', to: 'k' },
              { from: 'f', to: 'k' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'q',
            options: [
              { kind: 'queue', label: 'Queue' },
              { kind: 'cache', label: 'Cache', why: 'Pending work in a cache can be evicted and lost.' },
              { kind: 'search', label: 'Search index', why: 'Nothing here is searched by text.' },
            ],
            answer: 0,
          },
          explain: 'The post is saved and the user gets their answer; workers copy it to followers\' feeds.',
        },
        {
          id: 'wnf-5-2',
          type: 'diagram',
          prompt: 'A user opens their feed. Tap the path, in order.',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'App' },
              { id: 'a', kind: 'service', label: 'Post API' },
              { id: 'q', kind: 'queue', label: 'Fan-out q' },
              { id: 'w', kind: 'worker', label: 'Fan-out' },
              { id: 'k', kind: 'cache', label: 'Feed cache' },
              { id: 'f', kind: 'service', label: 'Feed API' },
            ],
            edges: [
              { from: 'c', to: 'a' },
              { from: 'c', to: 'f' },
              { from: 'a', to: 'q' },
              { from: 'q', to: 'w' },
              { from: 'w', to: 'k' },
              { from: 'f', to: 'k' },
            ],
          },
          goal: { kind: 'path', answer: ['c', 'f', 'k'] },
          explain: 'One lookup for the post ids, then their contents from the post cache.',
        },
        {
          id: 'wnf-5-3',
          type: 'mcq',
          prompt: 'What does fan-out on write (copying posts into feeds) buy?',
          options: [
            { text: 'Fast feed reads' },
            { text: 'Cheaper posting', why: 'Posting gets more expensive: one write per follower.' },
            { text: 'Less storage', why: 'Each post id is stored in every follower\'s feed.' },
          ],
          answer: 0,
          explain: 'Reads outnumber posts 20 to 1, so moving work to the write side pays.',
        },
      ],
      strong: 'Posts are saved by the post API and queued; fan-out workers push the post id into each follower\'s feed list in the cache; the feed API reads that list and fills in post contents from a post cache backed by the posts database.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'App' },
          { id: 'a', kind: 'service', label: 'Post API' },
          { id: 'q', kind: 'queue', label: 'Fan-out q' },
          { id: 'w', kind: 'worker', label: 'Fan-out' },
          { id: 'k', kind: 'cache', label: 'Feed cache' },
          { id: 'f', kind: 'service', label: 'Feed API' },
        ],
        edges: [
          { from: 'c', to: 'a' },
          { from: 'c', to: 'f' },
          { from: 'a', to: 'q' },
          { from: 'q', to: 'w' },
          { from: 'w', to: 'k' },
          { from: 'f', to: 'k' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: an account with 50 million followers posts.',
      exercises: [
        {
          id: 'wnf-6-1',
          type: 'estimate',
          prompt: 'Fan-out workers write 100,000 feed entries a second in total. How long to push one celebrity post to 50 million feeds?',
          expr: '50e6 / 100000',
          answer: 500,
          tolerance: 2,
          unit: 's',
          options: [
            { value: 50, why: '5 × 10⁷ ÷ 10⁵ = 500.' },
            { value: 500 },
            { value: 5000, why: 'One factor of ten too many.' },
          ],
          work: ['5 × 10⁷ ÷ 10⁵ = 500 s ≈ 8 minutes'],
          explain: 'Eight minutes of all workers on one post, while everyone else\'s posts wait.',
        },
        {
          id: 'wnf-6-2',
          type: 'scenario',
          prompt: 'How do you handle accounts with millions of followers?',
          situation: 'Fewer than 0.01% of accounts have over a million followers.',
          needs: ['Celebrity posts appear quickly', 'Ordinary posts are not delayed'],
          options: [
            {
              text: 'Pull celebrity posts at read time',
              cost: 'Feed reads merge in a few extra lists.',
            },
            {
              text: 'Push to all 50 million anyway',
              cost: 'One code path for everyone.',
              why: 'Minutes of fan-out per post, delaying everyone else\'s posts.',
            },
          ],
          answer: 0,
          explain: 'A hybrid: push for ordinary accounts, pull for the few huge ones.',
        },
        {
          id: 'wnf-6-3',
          type: 'predict-output',
          prompt: 'At read time, merge the pushed feed with a followed celebrity\'s recent posts. What does the feed show?',
          code: `pushed = [(8, "x8"), (4, "x4")]
celeb = [(9, "c9"), (2, "c2")]
feed = sorted(pushed + celeb,
              reverse=True)
print([t for _, t in feed])`,
          answer: "['c9', 'x8', 'x4', 'c2']",
          typedWrong: [{ answer: "['x8', 'x4', 'c9', 'c2']", why: 'Both lists are sorted together by time.' }],
          explain: 'The reader cannot tell which posts were pushed and which were pulled.',
        },
      ],
      strong: 'Fan-out on write for ordinary accounts and fan-out on read for accounts above a follower threshold; the feed API merges the pushed list with the few followed celebrities\' recent posts (themselves cached).',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Check the feed cache\'s size and what to do at ten times the users.',
      exercises: [
        {
          id: 'wnf-7-1',
          type: 'estimate',
          prompt: 'Keep the latest 500 post ids (8 bytes each) for each of 200 million users. Cache memory?',
          expr: '200e6 * 500 * 8 / GB',
          answer: 800,
          tolerance: 2,
          unit: 'GB',
          options: [
            { value: 80, why: '10¹¹ ids × 8 B = 8 × 10¹¹ B = 800 GB.' },
            { value: 800 },
            { value: 8000, why: 'One factor of ten too many.' },
          ],
          work: ['2 × 10⁸ × 500 = 10¹¹ ids', '× 8 B = 800 GB'],
          explain: 'A cache cluster sharded by user id; bigger if contents were stored too.',
        },
        {
          id: 'wnf-7-2',
          type: 'mcq',
          prompt: 'What should each user\'s feed entry hold?',
          options: [
            { text: 'Only recent post ids' },
            { text: 'Every post ever, in full', why: 'Unbounded memory, and edits would need updating everywhere.' },
            { text: 'Nothing: always pull', why: 'Then every feed open merges 200 users\' posts.' },
          ],
          answer: 0,
          explain: 'Ids are small and contents are fetched from a shared post cache.',
        },
        {
          id: 'wnf-7-3',
          type: 'scenario',
          prompt: 'Many registered users have not opened the app in months, yet their feeds are kept up to date.',
          situation: 'Only 200 million of 1 billion accounts are active each day.',
          needs: ['Stop spending on idle users', 'Returning users still get a feed'],
          options: [
            {
              text: 'Keep feeds for active users only',
              cost: 'A returning user\'s first open is built by pulling.',
            },
            {
              text: 'Keep feeds for all 1 billion',
              cost: 'Every feed is always ready.',
              why: 'Five times the memory and fan-out writes, mostly for people who never look.',
            },
          ],
          answer: 0,
          explain: 'Fan-out skips inactive followers; their feed is rebuilt when they return.',
        },
      ],
      strong: 'About 800 GB of feed lists in a cache sharded by user id, holding only recent post ids for active users; posts cached separately; celebrity posts pulled at read time; at 10× add cache and fan-out workers, which shard cleanly by user.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'c', kind: 'client', label: 'App' },
        { id: 'a', kind: 'service', label: 'Post API' },
        { id: 'q', kind: 'queue', label: 'Fan-out q' },
        { id: 'w', kind: 'worker', label: 'Fan-out' },
        { id: 'k', kind: 'cache', label: 'Feed cache' },
        { id: 'f', kind: 'service', label: 'Feed API' },
      ],
      edges: [
        { from: 'c', to: 'a', label: 'post' },
        { from: 'c', to: 'f', label: 'read' },
        { from: 'a', to: 'q' },
        { from: 'q', to: 'w' },
        { from: 'w', to: 'k', label: 'push ids' },
        { from: 'f', to: 'k' },
      ],
    },
    decisions: [
      'About 23,000 feed reads and 1,200 posts a second: read-heavy, so precompute feeds.',
      'GET /feed pages with a cursor; posts sharded by author id; photos in object storage.',
      'Fan-out on write via a queue and workers into per-user lists of recent post ids.',
      'Celebrity accounts are pulled at read time and merged (the hybrid).',
      'Feeds kept only for active users: about 800 GB of ids in a sharded cache.',
    ],
  },
  blank: {
    requirements: [
      'Post, follow, and a home feed newest first',
      'Feed loads fast; a few seconds of lag is fine',
      'Read-heavy: about 20 reads per post',
      'Handle accounts with millions of followers',
      'Ranking, comments and ads are out of scope',
    ],
    components: ['client', 'service', 'queue', 'worker', 'cache', 'db', 'store'],
    firstFive: [
      'Ask which features are in scope (post, follow, feed; ranking later?)',
      'Ask daily users, feed opens and posts per user, follows per user',
      'Ask for the largest follower count: it shapes the deep dive',
      'Estimate feed reads, posts and fan-out writes a second out loud',
      'Sketch GET /feed with a cursor before drawing boxes',
    ],
  },
};
