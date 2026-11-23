import type { Walkthrough } from '../schema';

/*
 * Walkthrough 12: nearby search, through the seven-step framework. Unlocks
 * after S1-S4, S6 (replication and partitioning) and S11 (geospatial
 * indexing).
 */
export const nearby: Walkthrough = {
  id: 'w-nearby',
  title: 'Nearby search',
  question: 'Design "places near me": given a location and a radius, return nearby restaurants and shops, nearest first.',
  needs: ['S1', 'S2', 'S3', 'S4', 'S6', 'S11'],
  minutes: 18,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "200 million places worldwide. 100 million daily users, about five searches each. Places change rarely, but owners can edit their details."',
      exercises: [
        {
          id: 'wnb-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Search by location and radius', bucket: 0, why: 'The core feature, stated.' },
            { text: 'A details page per place', bucket: 0, why: 'What users open from the results.' },
            { text: 'Owners edit their places', bucket: 0, why: 'Stated by the interviewer.' },
            { text: 'Live travel times', bucket: 1, why: 'Needs traffic data: a separate system.' },
            { text: 'Reviews and photos', bucket: 1, why: 'Not asked for; their own services.' },
            { text: 'Tracking moving drivers', bucket: 1, why: 'Moving points need constant location writes: a different design.' },
          ],
          explain: 'Static places, searched by position.',
        },
        {
          id: 'wnb-1-2',
          type: 'mcq',
          prompt: 'What is the balance of reads and writes?',
          options: [
            { text: 'Mostly reads; edits are rare' },
            { text: 'Mostly writes from owners', why: 'Owners edit occasionally; users search all day.' },
            { text: 'About equal reads and writes', why: 'Searches outnumber edits by thousands to one.' },
          ],
          answer: 0,
          explain: 'A read-heavy system: precompute, replicate and cache.',
        },
        {
          id: 'wnb-1-3',
          type: 'scenario',
          prompt: 'An owner changes opening hours. How soon must searches show it?',
          situation: 'Places are indexed for fast search.',
          needs: ['Edits appear reasonably soon', 'Search stays fast'],
          options: [
            { text: 'Within a day is fine', cost: 'A short window of old details.' },
            {
              text: 'At once, everywhere',
              cost: 'Always current.',
              why: 'Every cache and index updates on each edit, for little gain.',
            },
          ],
          answer: 0,
          explain: 'The details page can read the database directly; the search index can lag.',
        },
      ],
      strong: 'Search places by location and radius, nearest first, with details pages and owner edits; read-heavy, fast searches, and edits may take up to a day to reach the search index. Moving objects and reviews later.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "A place record is about 1 KB. Peak is three times the average."',
      exercises: [
        {
          id: 'wnb-2-1',
          type: 'estimate',
          prompt: 'Searches per second, on average?',
          expr: '100e6 * 5 / DAY',
          answer: 5787,
          tolerance: 2,
          unit: 'searches/s',
          options: [
            { value: 600, why: '5 × 10⁸ a day / 86,400 s ≈ 5,800.' },
            { value: 6000 },
            { value: 60000, why: 'That would be five billion searches a day.' },
          ],
          work: ['10⁸ × 5 = 5 × 10⁸ a day', '5 × 10⁸ / 86,400 ≈ 5,800 a second'],
          explain: 'Several thousand a second: many servers, but not a hard number.',
        },
        {
          id: 'wnb-2-2',
          type: 'estimate',
          prompt: 'Searches per second at peak?',
          expr: '100e6 * 5 / DAY * 3',
          answer: 17361,
          tolerance: 2,
          unit: 'searches/s',
          options: [
            { value: 1700, why: '5,800 × 3 is about 17,000.' },
            { value: 17000 },
            { value: 170000, why: 'Three times 5,800 is 17,000, not 170,000.' },
          ],
          work: ['5,800 × 3 ≈ 17,000 a second'],
          explain: 'Plan servers for the peak.',
        },
        {
          id: 'wnb-2-3',
          type: 'estimate',
          prompt: 'Storage for all places?',
          expr: '200e6 * RECORD / GB',
          answer: 200,
          tolerance: 2,
          unit: 'GB',
          options: [
            { value: 20, why: '2 × 10⁸ × 1 KB = 2 × 10¹¹ B = 200 GB.' },
            { value: 200 },
            { value: 2000, why: '2 × 10¹¹ bytes is 200 GB, not 2 TB.' },
          ],
          work: ['2 × 10⁸ places × 1 KB = 2 × 10¹¹ B = 200 GB'],
          explain: 'It fits on one machine: copies for reads, not shards.',
        },
      ],
      strong: 'About 6,000 searches a second, 17,000 at peak, over 200 GB of places: the data fits one machine, so read replicas and caches handle the load without sharding.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'A search endpoint, a details endpoint and an edit endpoint.',
      exercises: [
        {
          id: 'wnb-3-1',
          type: 'mcq',
          prompt: 'Which request shape for search?',
          options: [
            { text: 'GET /nearby?lat=&lng=&radius=' },
            { text: 'POST /nearby with a map image', why: 'The server needs coordinates, not pictures.' },
            { text: 'GET /places/all, filter on phone', why: 'That sends 200 GB to the phone.' },
          ],
          answer: 0,
          explain: 'A GET with coordinates, radius and optional filters such as category.',
        },
        {
          id: 'wnb-3-2',
          type: 'match-pairs',
          prompt: 'Match each call to what it returns or does.',
          pairs: [
            { left: 'GET /nearby', right: 'place ids and distances', why: 'A short list, nearest first.' },
            { left: 'GET /places/{id}', right: 'one place\'s details', why: 'Opened from the list.' },
            { left: 'PUT /places/{id}', right: 'an owner\'s edit', why: 'Checked: only the owner may edit.' },
            { left: 'next_page token', right: 'the following results', why: 'Pages through a long list.' },
          ],
          explain: 'Search returns little; details are fetched on demand.',
        },
        {
          id: 'wnb-3-3',
          type: 'predict-output',
          prompt: 'How far apart, in km, are two points one degree of longitude apart on the equator?',
          code: `from math import radians, cos, hypot
def km(a, b):
    dx = radians(b[1] - a[1]) * cos(
        radians(a[0]))
    dy = radians(b[0] - a[0])
    return 6371 * hypot(dx, dy)
print(round(km((0, 0), (0, 1))))`,
          answer: '111',
          typedWrong: [{ answer: '1', why: 'Degrees are not kilometres: one degree is about 111 km here.' }],
          explain: 'Away from the equator a degree of longitude shrinks; the cos term handles that.',
        },
      ],
      strong: 'GET /nearby with latitude, longitude, radius and filters returns place ids and distances, nearest first, with a page token; GET /places/{id} for details; PUT for owner edits.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Choose an index that finds points near a point.',
      exercises: [
        {
          id: 'wnb-4-1',
          type: 'scenario',
          prompt: 'How do you find places near a point quickly?',
          situation: '200 million places; about 17,000 searches a second at peak.',
          needs: ['Look at only a small area', 'Fast at peak'],
          options: [
            { text: 'A grid index of geohash cells', cost: 'Edge cases at cell borders to handle.' },
            {
              text: 'Scan all 200 million places',
              cost: 'No index needed.',
              why: 'Measures 200 million distances per search.',
            },
            {
              text: 'Separate lat and lng indexes',
              cost: 'Ordinary database indexes.',
              why: 'Each finds a long strip; intersecting two strips is slow.',
            },
          ],
          answer: 0,
          explain: 'Each place is filed under the cell that contains it (S11).',
        },
        {
          id: 'wnb-4-2',
          type: 'predict-output',
          prompt: 'Places are filed in a grid of 0.1-degree cells. Are these two nearby points in the same cell?',
          code: `def cell(lat, lng, size=0.1):
    return (int(lat // size),
            int(lng // size))
a = cell(51.507, -0.127)
b = cell(51.513, -0.099)
print(a == b, a)`,
          answer: 'False (515, -2)',
          typedWrong: [{ answer: 'True (515, -2)', why: 'The second point falls in the next cell east: close points can straddle a border.' }],
          explain: 'So a search checks the point\'s own cell and the cells around it.',
        },
        {
          id: 'wnb-4-3',
          type: 'mcq',
          prompt: 'A search point sits near a cell border. Which cells do you check?',
          options: [
            { text: 'Its cell and the eight around it' },
            { text: 'Only the cell the user is in', why: 'Places just across the border would be missed.' },
            { text: 'Every cell in the city', why: 'Far more work than a small radius needs.' },
          ],
          answer: 0,
          explain: 'Then measure exact distances to the places found and keep those within the radius.',
        },
      ],
      strong: 'A grid of geohash cells maps each cell to its places; a search reads the point\'s cell and its neighbours, then filters by exact distance and sorts. Place details live in a relational database.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'The search path reads an index held in memory; details come from the database.',
      exercises: [
        {
          id: 'wnb-5-1',
          type: 'diagram',
          prompt: 'The nearby API looks up cells in an index held in memory. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'u', kind: 'client', label: 'Users' },
              { id: 'lb', kind: 'lb', label: 'Load bal.' },
              { id: 's', kind: 'service', label: 'Nearby API' },
              { id: 'g', kind: 'cache', label: 'Geo index' },
              { id: 'd', kind: 'db', label: 'Places DB' },
            ],
            edges: [
              { from: 'u', to: 'lb' },
              { from: 'lb', to: 's' },
              { from: 's', to: 'g', label: 'cells' },
              { from: 's', to: 'd', label: 'details' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'g',
            options: [
              { kind: 'cache', label: 'Grid in RAM' },
              { kind: 'db', label: 'SQL scan', why: 'Scanning rows per search is far too slow.' },
              { kind: 'search', label: 'Text search', why: 'Text search matches words, not distance.' },
            ],
            answer: 0,
          },
          explain: '200 GB of places, but the index of ids and coordinates is much smaller.',
        },
        {
          id: 'wnb-5-2',
          type: 'diagram',
          prompt: 'A search. Tap its path from the user to the geo index.',
          diagram: {
            nodes: [
              { id: 'u', kind: 'client', label: 'Users' },
              { id: 'lb', kind: 'lb', label: 'Load bal.' },
              { id: 's', kind: 'service', label: 'Nearby API' },
              { id: 'g', kind: 'cache', label: 'Geo index' },
              { id: 'd', kind: 'db', label: 'Places DB' },
            ],
            edges: [
              { from: 'u', to: 'lb' },
              { from: 'lb', to: 's' },
              { from: 's', to: 'g' },
              { from: 's', to: 'd' },
            ],
          },
          goal: { kind: 'path', answer: ['u', 'lb', 's', 'g'] },
          explain: 'The database is read only for the details shown in the list.',
        },
        {
          id: 'wnb-5-3',
          type: 'mcq',
          prompt: 'Why can the geo index be rebuilt overnight?',
          options: [
            { text: 'Places rarely move or appear' },
            { text: 'Users search only at night', why: 'They search all day; the index is swapped in while serving.' },
            { text: 'Indexes cannot be updated', why: 'They can; it is just rarely needed.' },
          ],
          answer: 0,
          explain: 'A nightly job builds a new index from the database and servers swap it in.',
        },
      ],
      strong: 'Users → load balancer → nearby API servers, each with the geo index in memory; details from a places database with read replicas; a nightly job rebuilds the index from the database.',
      diagram: {
        nodes: [
          { id: 'u', kind: 'client', label: 'Users' },
          { id: 'lb', kind: 'lb', label: 'Load bal.' },
          { id: 's', kind: 'service', label: 'Nearby API' },
          { id: 'g', kind: 'cache', label: 'Geo index' },
          { id: 'd', kind: 'db', label: 'Places DB' },
          { id: 'r', kind: 'replica', label: 'Replicas' },
        ],
        edges: [
          { from: 'u', to: 'lb' },
          { from: 'lb', to: 's' },
          { from: 's', to: 'g', label: 'cells' },
          { from: 's', to: 'd', label: 'details' },
          { from: 'd', to: 'r', dashed: true },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: places are packed tightly in cities and sparse everywhere else.',
      exercises: [
        {
          id: 'wnb-6-1',
          type: 'scenario',
          prompt: 'One 1 km cell in a city centre holds 5,000 places; one in the desert holds none.',
          situation: 'A fixed grid uses one cell size everywhere.',
          needs: ['Few places read per search', 'No huge searches in empty areas'],
          options: [
            { text: 'Cells that split when crowded', cost: 'More complex to build and query.' },
            {
              text: 'One cell size everywhere',
              cost: 'Simple to build.',
              why: 'Dense cells return thousands; sparse ones force wide searches.',
            },
          ],
          answer: 0,
          explain: 'A quadtree, or geohashes of varying length (S11).',
        },
        {
          id: 'wnb-6-2',
          type: 'predict-output',
          prompt: 'A quadtree splits a cell into four whenever it holds more than 100 places (assume they spread evenly). How many leaf cells for 50 and for 1,600 places?',
          code: `def leaves(n, cap=100):
    if n <= cap:
        return 1
    return sum(leaves(n // 4, cap)
               for _ in range(4))
print(leaves(50), leaves(1600))`,
          answer: '1 16',
          typedWrong: [{ answer: '1 4', why: '400 per quarter is still over 100, so each quarter splits again.' }],
          explain: 'Real places are uneven, so the tree is deeper where it is crowded.',
        },
        {
          id: 'wnb-6-3',
          type: 'mcq',
          prompt: 'A search finds 3,000 places within 2 km. How are results returned?',
          options: [
            { text: 'Nearest 20, with a next page' },
            { text: 'All 3,000 in one response', why: 'A huge response for a list people scroll a little.' },
            { text: 'A random 20 of the 3,000', why: 'Users asked for the nearest first.' },
          ],
          answer: 0,
          explain: 'Search outward ring by ring until 20 are found.',
        },
      ],
      strong: 'Cells adapt to density (a quadtree or variable-length geohash), so each search reads a small number of places; results come back nearest first, 20 at a time, searching outward until enough are found.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Handle the peak, then the busiest areas.',
      exercises: [
        {
          id: 'wnb-7-1',
          type: 'mcq',
          prompt: 'About 17,000 searches a second at peak. What do you scale?',
          options: [
            { text: 'More API servers and index copies' },
            { text: 'Shard the 200 GB by region now', why: 'The data fits one machine; the load is reads, which copies handle.' },
            { text: 'One bigger single server', why: 'A single point of failure, and a ceiling.' },
          ],
          answer: 0,
          explain: 'Stateless servers each holding the index scale out simply (S3).',
        },
        {
          id: 'wnb-7-2',
          type: 'scenario',
          prompt: 'City centres are searched over and over.',
          situation: 'Thousands of people search the same few cells each minute.',
          needs: ['Cheaper repeated searches'],
          options: [
            { text: 'Cache results per cell and radius', cost: 'Results may be minutes old.' },
            {
              text: 'Recompute every single search',
              cost: 'Always fresh.',
              why: 'Repeats the same work thousands of times a minute.',
            },
          ],
          answer: 0,
          explain: 'Round the location to the cell so nearby users share one cache entry.',
        },
        {
          id: 'wnb-7-3',
          type: 'bucket-sort',
          prompt: 'Which changes can wait for the nightly rebuild, and which must apply at once?',
          buckets: ['Nightly', 'At once'],
          items: [
            { text: 'A new café opens', bucket: 0, why: 'A day before it appears is acceptable.' },
            { text: 'New opening hours', bucket: 0, why: 'Shown from the database on the details page anyway.' },
            { text: 'A typo fixed in a name', bucket: 0, why: 'Harmless to wait.' },
            { text: 'A place removed for fraud', bucket: 1, why: 'Should stop appearing right away.' },
            { text: 'Closed today for an emergency', bucket: 1, why: 'Sending people to a closed shop is the harm.' },
          ],
          explain: 'A small "hide now" list checked at search time covers the urgent cases.',
        },
      ],
      strong: 'Scale out stateless API servers that each hold the index; cache popular cells; let most edits wait for the nightly rebuild, with a small "hide now" list for urgent removals.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'u', kind: 'client', label: 'Users' },
        { id: 'lb', kind: 'lb', label: 'Load bal.' },
        { id: 's', kind: 'service', label: 'Nearby API' },
        { id: 'g', kind: 'cache', label: 'Geo index' },
        { id: 'd', kind: 'db', label: 'Places DB' },
        { id: 'r', kind: 'replica', label: 'Replicas' },
      ],
      edges: [
        { from: 'u', to: 'lb' },
        { from: 'lb', to: 's' },
        { from: 's', to: 'g', label: 'cells' },
        { from: 's', to: 'd', label: 'details' },
        { from: 'd', to: 'r', dashed: true },
      ],
    },
    decisions: [
      'A geospatial index of cells that split where places are dense, held in memory.',
      'Search the point\'s cell and its neighbours, filter by exact distance, nearest 20 first.',
      '200 GB fits one machine: replicas and copies of the index, not shards.',
      'The index is rebuilt nightly; a "hide now" list handles urgent removals.',
      'Results cached per cell for busy areas.',
    ],
  },
  blank: {
    requirements: [
      'Find places within a radius, nearest first',
      'Details for each place; owners can edit',
      'About 17,000 searches a second at peak',
      'Edits may take up to a day to appear',
      '200 million places worldwide',
    ],
    components: ['client', 'lb', 'service', 'cache', 'db', 'replica'],
    firstFive: [
      'Ask whether places move, and how fresh edits must be',
      'Say it is read-heavy and latency-sensitive',
      'Estimate searches a second and total data: it fits one machine',
      'Choose a geospatial index and explain neighbour cells',
      'Explain dense versus sparse areas before scaling',
    ],
  },
};
