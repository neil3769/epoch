import type { Walkthrough } from '../schema';

/*
 * Walkthrough 10: video streaming, through the seven-step framework.
 * Unlocks after S1-S4 (requests, estimation, scaling, caching and CDNs),
 * S8 (queues) and S11 (object storage and media).
 */
export const video: Walkthrough = {
  id: 'w-video',
  title: 'Video streaming',
  question: 'Design a video platform: creators upload videos, and viewers stream them on phones, laptops and TVs.',
  needs: ['S1', 'S2', 'S3', 'S4', 'S8', 'S11'],
  minutes: 19,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "5 million daily viewers watch about 30 minutes each; creators upload 50,000 videos a day, about 10 minutes long. Playback must start fast and never stall."',
      exercises: [
        {
          id: 'wvs-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Upload a video', bucket: 0, why: 'Half of the system, stated.' },
            { text: 'Stream on any device', bucket: 0, why: 'Phones, laptops and TVs, stated.' },
            { text: 'Quality that adapts', bucket: 0, why: 'Needed so playback does not stall on slow networks.' },
            { text: 'Live streaming', bucket: 1, why: 'A different pipeline with a budget of seconds.' },
            { text: 'Comments and likes', bucket: 1, why: 'Not asked for; a separate service.' },
            { text: 'Recommendations', bucket: 1, why: 'A large system of its own.' },
          ],
          explain: 'Upload, process, stream.',
        },
        {
          id: 'wvs-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most for viewers?',
          options: [
            { text: 'Smooth playback, quick start' },
            { text: 'Uploads finish instantly', why: 'Creators accept minutes of processing; viewers do not accept stalls.' },
            { text: 'Every view counted live', why: 'Counts can lag; playback cannot.' },
          ],
          answer: 0,
          explain: 'Measured as time to first frame and the share of time spent buffering.',
        },
        {
          id: 'wvs-1-3',
          type: 'scenario',
          prompt: 'A creator uploads a video. How soon must it be watchable?',
          situation: 'Turning a 10-minute video into several qualities takes minutes.',
          needs: ['The creator knows when it is ready', 'No upload is lost'],
          options: [
            { text: 'Ready in minutes, then notify', cost: 'Not watchable the moment the upload ends.' },
            {
              text: 'Watchable the moment it lands',
              cost: 'Instant publishing.',
              why: 'The raw file must be processed first; it may not play on every device.',
            },
          ],
          answer: 0,
          explain: 'Processing runs in the background; the creator sees "processing", then "ready".',
        },
      ],
      strong: 'Upload, background processing into several qualities, and streaming to any device with quality that adapts to the network; smooth, fast-starting playback matters most, processing may take minutes. Live, comments and recommendations later.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "Watching uses about 50 MB a minute at high quality. All the qualities of one video together take about twice the original\'s space."',
      exercises: [
        {
          id: 'wvs-2-1',
          type: 'estimate',
          prompt: 'Video data streamed per day?',
          expr: '5e6 * 30 * VIDEO_MINUTE / PB',
          answer: 7.5,
          tolerance: 2,
          unit: 'PB',
          options: [
            { value: 0.75, why: '1.5 × 10⁸ minutes × 50 MB = 7.5 × 10¹⁵ B = 7.5 PB.' },
            { value: 7.5 },
            { value: 75, why: '7.5 × 10¹⁵ bytes is 7.5 PB, not 75.' },
          ],
          work: ['5 × 10⁶ × 30 min = 1.5 × 10⁸ minutes a day', '× 50 MB = 7.5 × 10¹⁵ B = 7.5 PB'],
          explain: 'Petabytes a day: far beyond what any set of app servers should send.',
        },
        {
          id: 'wvs-2-2',
          type: 'estimate',
          prompt: 'Average outgoing bandwidth?',
          expr: '5e6 * 30 * VIDEO_MINUTE / DAY / GB',
          answer: 87,
          tolerance: 2,
          unit: 'GB/s',
          options: [
            { value: 9, why: '7.5 × 10¹⁵ B / 86,400 s ≈ 8.7 × 10¹⁰ B/s.' },
            { value: 90 },
            { value: 900, why: '7.5 PB / 86,400 s is about 87 GB/s.' },
          ],
          work: ['7.5 × 10¹⁵ B / 86,400 s ≈ 8.7 × 10¹⁰ B/s ≈ 87 GB/s'],
          explain: 'Evening peaks are several times this; a CDN carries it.',
        },
        {
          id: 'wvs-2-3',
          type: 'estimate',
          prompt: 'New storage per day, with all qualities at twice the original size?',
          expr: '50000 * 10 * VIDEO_MINUTE * 2 / TB',
          answer: 50,
          tolerance: 2,
          unit: 'TB',
          options: [
            { value: 5, why: '5 × 10⁵ minutes × 50 MB × 2 = 5 × 10¹³ B = 50 TB.' },
            { value: 50 },
            { value: 500, why: '5 × 10¹³ bytes is 50 TB.' },
          ],
          work: ['50,000 × 10 min = 5 × 10⁵ minutes', '× 50 MB × 2 = 5 × 10¹³ B = 50 TB'],
          explain: 'About 18 PB a year: object storage.',
        },
      ],
      strong: 'About 7.5 PB streamed a day, roughly 90 GB/s on average and several times that at peak, so a CDN serves the video; about 50 TB of new storage a day goes to object storage.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Uploads go straight to storage; playback fetches a manifest, then short segments.',
      exercises: [
        {
          id: 'wvs-3-1',
          type: 'order-steps',
          prompt: 'Put an upload in order.',
          steps: [
            'The app asks the API for an upload URL',
            'It uploads the file straight to object storage',
            'Storage signals that the upload finished',
            'A queued job starts processing',
            'The video is marked ready and the creator told',
          ],
          explain: 'Large uploads never pass through the API servers.',
        },
        {
          id: 'wvs-3-2',
          type: 'match-pairs',
          prompt: 'Match each request or file to what it gives.',
          pairs: [
            { left: 'POST /videos', right: 'a new video and an upload URL', why: 'Creates the record and a signed URL.' },
            { left: 'GET /videos/{id}', right: 'title, status, manifest link', why: 'Small metadata from the API.' },
            { left: 'Manifest', right: 'the qualities and their segments', why: 'The player reads it first.' },
            { left: 'Segment', right: 'a few seconds of video', why: 'Fetched one after another from the CDN.' },
          ],
          explain: 'HLS and DASH both work this way.',
        },
        {
          id: 'wvs-3-3',
          type: 'mcq',
          prompt: 'Why does the player fetch short segments rather than one file?',
          options: [
            { text: 'It can switch quality mid-video' },
            { text: 'Short files compress better', why: 'Segment size barely changes compression.' },
            { text: 'Servers cannot send big files', why: 'They can; the point is switching quality and caching.' },
          ],
          answer: 0,
          explain: 'Each segment can come from a different quality as the network changes.',
        },
      ],
      strong: 'POST /videos returns a signed upload URL; the file goes straight to object storage and a queued job processes it. Playback reads a manifest, then fetches segments of a few seconds from the CDN, switching quality between them.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Video bytes and facts about videos live in different places.',
      exercises: [
        {
          id: 'wvs-4-1',
          type: 'bucket-sort',
          prompt: 'Where does each piece of data live?',
          buckets: ['Object store', 'Database'],
          items: [
            { text: 'The original upload', bucket: 0, why: 'A large blob, kept to re-encode later.' },
            { text: 'Encoded segments', bucket: 0, why: 'Many small blobs, served through the CDN.' },
            { text: 'Thumbnails', bucket: 0, why: 'Images: blobs.' },
            { text: 'Title and description', bucket: 1, why: 'Small, searched and edited.' },
            { text: 'Processing status', bucket: 1, why: 'Updated as jobs run; queried by the app.' },
            { text: 'Who uploaded what', bucket: 1, why: 'Queried for channel pages.' },
          ],
          explain: 'Bytes in object storage, facts in a database.',
        },
        {
          id: 'wvs-4-2',
          type: 'predict-output',
          prompt: 'A 10-minute video, 4-second segments, five qualities. How many segments in one quality, and in all?',
          code: `secs, seg = 600, 4
qualities = ["240p", "480p", "720p",
             "1080p", "4k"]
n = secs // seg
print(n, n * len(qualities))`,
          answer: '150 750',
          typedWrong: [{ answer: '150 150', why: 'Each quality has its own 150 segments.' }],
          explain: 'Lots of small objects: the CDN caches the popular ones.',
        },
        {
          id: 'wvs-4-3',
          type: 'mcq',
          prompt: 'Which store for video metadata?',
          options: [
            { text: 'A relational database' },
            { text: 'Inside the video file', why: 'Lists and searches need queries, not file reads.' },
            { text: 'Only the CDN cache', why: 'A cache can evict anything at any time.' },
          ],
          answer: 0,
          explain: 'Small rows, read far more than written: add read replicas and a cache.',
        },
      ],
      strong: 'Originals, segments and thumbnails in object storage; video metadata, status and ownership in a relational database with read replicas and a cache.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Two paths: uploads flow through processing, playback flows through the CDN.',
      exercises: [
        {
          id: 'wvs-5-1',
          type: 'diagram',
          prompt: 'Viewers fetch about 90 GB/s of segments. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'v', kind: 'client', label: 'Viewers' },
              { id: 'n', kind: 'cdn', label: 'CDN' },
              { id: 'a', kind: 'service', label: 'Video API' },
              { id: 's', kind: 'store', label: 'Segments' },
              { id: 'd', kind: 'db', label: 'Metadata' },
            ],
            edges: [
              { from: 'v', to: 'n', label: 'video' },
              { from: 'v', to: 'a' },
              { from: 'n', to: 's', label: 'miss' },
              { from: 'a', to: 'd' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'n',
            options: [
              { kind: 'cdn', label: 'CDN' },
              { kind: 'service', label: 'More API', why: 'App servers in one region cannot send 90 GB/s worldwide.' },
              { kind: 'db', label: 'Database', why: 'Video is bytes for streaming, not rows to query.' },
            ],
            answer: 0,
          },
          explain: 'Edges near viewers serve segments; only misses reach storage.',
        },
        {
          id: 'wvs-5-2',
          type: 'diagram',
          prompt: 'A new upload. Tap its path from the creator to the finished segments.',
          diagram: {
            nodes: [
              { id: 'c', kind: 'client', label: 'Creators' },
              { id: 'a', kind: 'service', label: 'Upload API' },
              { id: 'o', kind: 'store', label: 'Originals' },
              { id: 'q', kind: 'queue', label: 'Jobs' },
              { id: 'w', kind: 'worker', label: 'Encoders' },
              { id: 's', kind: 'store', label: 'Segments' },
            ],
            edges: [
              { from: 'c', to: 'a' },
              { from: 'c', to: 'o' },
              { from: 'o', to: 'q' },
              { from: 'q', to: 'w' },
              { from: 'w', to: 's' },
            ],
          },
          goal: { kind: 'path', answer: ['c', 'o', 'q', 'w', 's'] },
          explain: 'The API only hands out the upload URL; the bytes go straight to storage.',
        },
        {
          id: 'wvs-5-3',
          type: 'mcq',
          prompt: 'Why encode with workers behind a queue?',
          options: [
            { text: 'Encoding is slow and bursty' },
            { text: 'Queues make videos smaller', why: 'The encoders do that; the queue only holds jobs.' },
            { text: 'Players read from queues', why: 'Players read segments from the CDN.' },
          ],
          answer: 0,
          explain: 'Workers scale with the backlog and a crashed job is retried (S8).',
        },
      ],
      strong: 'Creators upload to object storage with a signed URL; a queue feeds encoder workers that write segments. Viewers get metadata from the video API and segments from the CDN, which fills from storage on a miss.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Creators' },
          { id: 'v', kind: 'client', label: 'Viewers' },
          { id: 'o', kind: 'store', label: 'Originals' },
          { id: 'n', kind: 'cdn', label: 'CDN' },
          { id: 'q', kind: 'queue', label: 'Jobs' },
          { id: 'w', kind: 'worker', label: 'Encoders' },
          { id: 's', kind: 'store', label: 'Segments' },
        ],
        edges: [
          { from: 'c', to: 'o' },
          { from: 'v', to: 'n' },
          { from: 'o', to: 'q' },
          { from: 'q', to: 'w' },
          { from: 'w', to: 's' },
          { from: 'n', to: 's', label: 'miss' },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: playback that never stalls, for every viewer, even when a video goes viral.',
      exercises: [
        {
          id: 'wvs-6-1',
          type: 'predict-output',
          prompt: 'The player picks the best quality that fits in 80% of the measured bandwidth (Mbit/s). What does it pick at 5 and at 1?',
          code: `rates = {"480p": 1.5, "720p": 3,
         "1080p": 6}
def pick(mbps):
    ok = [q for q, r in rates.items()
          if r <= mbps * 0.8]
    return ok[-1] if ok else "480p"
print(pick(5), pick(1))`,
          answer: '720p 480p',
          typedWrong: [{ answer: '1080p 480p', why: 'Only 80% of 5, which is 4, is used; 1080p needs 6.' }],
          explain: 'Adaptive bitrate: the headroom absorbs dips without stalling.',
        },
        {
          id: 'wvs-6-2',
          type: 'scenario',
          prompt: 'A new video goes viral: millions start it within minutes.',
          situation: 'None of its segments are in the CDN yet.',
          needs: ['Viewers are served quickly', 'Storage is not overwhelmed'],
          options: [
            { text: 'A shield tier before storage', cost: 'One more hop on a cache miss.' },
            {
              text: 'Each CDN edge reads storage',
              cost: 'Nothing extra to run.',
              why: 'Thousands of edges miss at once and hammer storage: a stampede (S4).',
            },
          ],
          answer: 0,
          explain: 'Edges ask one shield cache; only the shield goes to storage, once per segment.',
        },
        {
          id: 'wvs-6-3',
          type: 'mcq',
          prompt: 'Most videos are watched only a few times. How do you cut encoding cost?',
          options: [
            { text: 'Fewer qualities until popular' },
            { text: 'Skip encoding; play originals', why: 'Originals may not play on every device and cannot adapt.' },
            { text: 'Encode everything in 4K only', why: 'Slow networks then stall; costs rise.' },
          ],
          answer: 0,
          explain: 'Add the remaining qualities once views pass a threshold.',
        },
      ],
      strong: 'The player measures bandwidth and picks each segment\'s quality with headroom; a shield cache tier stops viral videos stampeding storage; rarely watched videos get fewer qualities until they become popular.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Check what still reaches your own servers, then grow to ten times the viewers.',
      exercises: [
        {
          id: 'wvs-7-1',
          type: 'estimate',
          prompt: 'The CDN serves 95% of bytes. Average bandwidth still reaching storage?',
          expr: '5e6 * 30 * VIDEO_MINUTE / DAY / GB * 0.05',
          answer: 4.3,
          tolerance: 2,
          unit: 'GB/s',
          options: [
            { value: 0.4, why: '5% of 87 GB/s is about 4.3 GB/s.' },
            { value: 4 },
            { value: 40, why: 'That would be about half the traffic, not 5%.' },
          ],
          work: ['87 GB/s × 0.05 ≈ 4.3 GB/s'],
          explain: 'The cache hit rate decides your own bandwidth bill.',
        },
        {
          id: 'wvs-7-2',
          type: 'mcq',
          prompt: 'At ten times the viewers, what grows first?',
          options: [
            { text: 'CDN capacity and cost' },
            { text: 'The metadata database', why: 'Metadata reads are small and cache well.' },
            { text: 'Encoding workers', why: 'Encoding grows with uploads, not viewers.' },
          ],
          answer: 0,
          explain: 'Bandwidth is the main cost of a video platform; some build their own CDN.',
        },
        {
          id: 'wvs-7-3',
          type: 'bucket-sort',
          prompt: 'Which costs grow with viewers, and which with uploads?',
          buckets: ['Viewers grow', 'Uploads grow'],
          items: [
            { text: 'CDN bandwidth', bucket: 0, why: 'Every minute watched is bytes sent.' },
            { text: 'Manifest requests', bucket: 0, why: 'One per playback start.' },
            { text: 'Metadata reads', bucket: 0, why: 'Every page view reads them.' },
            { text: 'Encoding workers', bucket: 1, why: 'One job per upload.' },
            { text: 'Storage of originals', bucket: 1, why: 'One original per upload.' },
            { text: 'Segment storage', bucket: 1, why: 'Grows with each video encoded.' },
          ],
          explain: 'Scale each path by its own driver.',
        },
      ],
      strong: 'At a 95% hit rate about 4 GB/s still reaches storage; at 10× viewers the CDN grows first, while encoding and storage grow with uploads, so each path scales on its own.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'c', kind: 'client', label: 'Creators' },
        { id: 'v', kind: 'client', label: 'Viewers' },
        { id: 'o', kind: 'store', label: 'Originals' },
        { id: 'n', kind: 'cdn', label: 'CDN' },
        { id: 'q', kind: 'queue', label: 'Jobs' },
        { id: 'w', kind: 'worker', label: 'Encoders' },
        { id: 's', kind: 'store', label: 'Segments' },
      ],
      edges: [
        { from: 'c', to: 'o', label: 'signed' },
        { from: 'v', to: 'n' },
        { from: 'o', to: 'q' },
        { from: 'q', to: 'w' },
        { from: 'w', to: 's' },
        { from: 'n', to: 's', label: 'miss' },
      ],
    },
    decisions: [
      'Uploads go straight to object storage; a queue feeds encoder workers.',
      'Each video is encoded into several qualities in segments of a few seconds.',
      'Viewers stream segments from a CDN with a shield tier; about 90 GB/s on average.',
      'The player adapts quality per segment to the measured bandwidth.',
      'Rarely watched videos get fewer qualities until they become popular.',
    ],
  },
  blank: {
    requirements: [
      'Creators upload videos; processing may take minutes',
      'Viewers stream on any device',
      'Fast start and no stalls; quality adapts to the network',
      'About 5 million daily viewers, 50,000 uploads a day',
      'Viral videos must not overwhelm storage',
    ],
    components: ['client', 'cdn', 'service', 'store', 'queue', 'worker', 'db'],
    firstFive: [
      'Ask viewers, minutes watched and uploads a day',
      'Say playback smoothness matters most',
      'Estimate bandwidth out loud: it forces the CDN',
      'Split the upload path from the playback path',
      'Explain segments, manifests and adaptive quality',
    ],
  },
};
