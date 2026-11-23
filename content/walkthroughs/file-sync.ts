import type { Walkthrough } from '../schema';

/*
 * Walkthrough 9: a file sync service, through the seven-step framework.
 * Unlocks after S1-S3, S5 (databases), S8 (queues) and S11 (object storage).
 */
export const fileSync: Walkthrough = {
  id: 'w-file-sync',
  title: 'File sync',
  question: 'Design a file sync service: a folder stays the same on all of a user\'s devices, and folders can be shared with other people.',
  needs: ['S1', 'S2', 'S3', 'S5', 'S8', 'S11'],
  minutes: 19,
  steps: [
    // ------------------------------------------------------------------ 1
    {
      title: 'Requirements',
      intro: 'The interviewer adds: "50 million users storing 10 GB each on average. Files up to 10 GB. Edits made offline sync later."',
      exercises: [
        {
          id: 'wfs-1-1',
          type: 'bucket-sort',
          prompt: 'Which features are in scope for version 1?',
          buckets: ['In scope', 'Later'],
          items: [
            { text: 'Upload and download files', bucket: 0, why: 'The core feature.' },
            { text: 'Sync across devices', bucket: 0, why: 'Stated in the question.' },
            { text: 'Share a folder', bucket: 0, why: 'Stated in the question.' },
            { text: 'Old versions for 30 days', bucket: 0, why: 'Cheap with blocks, and it rescues mistakes.' },
            { text: 'Live co-editing', bucket: 1, why: 'A different problem: merging keystrokes in real time.' },
            { text: 'Search inside files', bucket: 1, why: 'Needs text extraction and an index; not asked for.' },
          ],
          explain: 'Files in, files out, the same everywhere, shareable.',
        },
        {
          id: 'wfs-1-2',
          type: 'mcq',
          prompt: 'Which non-functional requirement matters most?',
          options: [
            { text: 'Never lose or corrupt a file' },
            { text: 'Sync within 10 milliseconds', why: 'A few seconds is fine for sync.' },
            { text: 'The lowest price per byte', why: 'Cheap storage that loses files is worthless.' },
          ],
          answer: 0,
          explain: 'Durability first; then sync that finishes in seconds.',
        },
        {
          id: 'wfs-1-3',
          type: 'scenario',
          prompt: 'Two laptops edit the same file offline, then both reconnect.',
          situation: 'Neither edit is wrong; they simply happened apart.',
          needs: ['No one\'s work is lost', 'The user can tell what happened'],
          options: [
            { text: 'Keep both as conflicted copies', cost: 'The user merges by hand.' },
            {
              text: 'Last upload wins silently',
              cost: 'Nothing for the user to do.',
              why: 'One person\'s work disappears.',
            },
            {
              text: 'Block offline editing',
              cost: 'Conflicts become impossible.',
              why: 'Offline edits were asked for.',
            },
          ],
          answer: 0,
          explain: 'The second file is saved as "report (Ana\'s conflicted copy)".',
        },
      ],
      strong: 'Upload, download and sync across devices, sharing, 30 days of versions; never lose a file, sync in seconds, offline edits allowed and conflicts kept as copies. Co-editing and search later.',
    },

    // ------------------------------------------------------------------ 2
    {
      title: 'Estimation',
      intro: 'The interviewer says: "Files are split into 4 MB blocks. About 0.1% of stored data changes each day."',
      exercises: [
        {
          id: 'wfs-2-1',
          type: 'estimate',
          prompt: 'Total data stored?',
          expr: '50e6 * 10 * GB / PB',
          answer: 500,
          tolerance: 2,
          unit: 'PB',
          options: [
            { value: 50, why: '5 × 10⁷ × 10 GB = 5 × 10⁸ GB = 500 PB.' },
            { value: 500 },
            { value: 5000, why: '5 × 10¹⁷ bytes is 500 PB, not 5 EB.' },
          ],
          work: ['5 × 10⁷ users × 10 GB = 5 × 10⁸ GB', '= 5 × 10¹⁷ B = 500 PB'],
          explain: 'Before copies for durability: object storage at its largest scale.',
        },
        {
          id: 'wfs-2-2',
          type: 'estimate',
          prompt: 'New data uploaded each day?',
          expr: '50e6 * 10 * GB / 1000 / TB',
          answer: 500,
          tolerance: 2,
          unit: 'TB',
          options: [
            { value: 50, why: '0.1% of 500 PB is 0.5 PB = 500 TB.' },
            { value: 500 },
            { value: 5000, why: 'That would be 1% a day, not 0.1%.' },
          ],
          work: ['500 PB × 0.001 = 0.5 PB = 500 TB a day'],
          explain: 'If only changed blocks are sent; whole files would be far more.',
        },
        {
          id: 'wfs-2-3',
          type: 'estimate',
          prompt: 'Average upload bandwidth for 500 TB a day?',
          expr: '500 * TB / DAY / GB',
          answer: 5.8,
          tolerance: 2,
          unit: 'GB/s',
          options: [
            { value: 0.6, why: '5 × 10¹⁴ B / 86,400 s ≈ 5.8 × 10⁹ B/s.' },
            { value: 6 },
            { value: 60, why: '5 × 10¹⁴ / 86,400 is about 6 GB/s.' },
          ],
          work: ['5 × 10¹⁴ B / 86,400 s ≈ 5.8 × 10⁹ B/s ≈ 6 GB/s'],
          explain: 'Too much to pass through API servers: devices should upload to storage directly.',
        },
      ],
      strong: '500 PB stored, about 500 TB of changed blocks a day and about 6 GB/s of uploads on average: blocks go straight to object storage, and only changed blocks are sent.',
    },

    // ------------------------------------------------------------------ 3
    {
      title: 'API',
      intro: 'Files travel as blocks named by their hash; a file version is a list of block hashes.',
      exercises: [
        {
          id: 'wfs-3-1',
          type: 'order-steps',
          prompt: 'Put the upload of an edited file in order.',
          steps: [
            'Split the file into 4 MB blocks',
            'Hash each block',
            'Ask the server which hashes it lacks',
            'Upload only those blocks',
            'Commit the new version as a list of hashes',
          ],
          explain: 'Commit last, so a version never points at a block that is not stored yet.',
        },
        {
          id: 'wfs-3-2',
          type: 'match-pairs',
          prompt: 'Match each endpoint to its job.',
          pairs: [
            { left: 'POST /blocks/missing', right: 'which hashes to upload', why: 'Skips blocks the server already has.' },
            { left: 'PUT /blocks/{hash}', right: 'upload one block', why: 'Named by content, so safe to retry.' },
            { left: 'POST /files/commit', right: 'a new version of a file', why: 'Records the list of block hashes.' },
            { left: 'GET /changes?cursor=', right: 'what changed since last sync', why: 'Each device keeps its own cursor.' },
          ],
          explain: 'Blocks and metadata travel separately.',
        },
        {
          id: 'wfs-3-3',
          type: 'mcq',
          prompt: 'How does a device learn about changes made on another device?',
          options: [
            { text: 'Long-poll for changes, then fetch' },
            { text: 'Re-download every file hourly', why: 'Petabytes moved for nothing, and up to an hour late.' },
            { text: 'Rehash every file every minute', why: 'Finds local edits, not edits made elsewhere.' },
          ],
          answer: 0,
          explain: 'The server answers when something changes; the device then asks GET /changes.',
        },
      ],
      strong: 'Blocks are uploaded by hash after asking which are missing, then a commit records the version; devices wait on a change notification and pull GET /changes from their cursor.',
    },

    // ------------------------------------------------------------------ 4
    {
      title: 'Data model',
      intro: 'Split the data in two: the bytes, and the facts about them.',
      exercises: [
        {
          id: 'wfs-4-1',
          type: 'bucket-sort',
          prompt: 'Where does each piece of data live?',
          buckets: ['Object store', 'Metadata DB'],
          items: [
            { text: 'File blocks, 4 MB each', bucket: 0, why: 'Large, immutable blobs.' },
            { text: 'File names and folders', bucket: 1, why: 'Small, queried, renamed often.' },
            { text: 'A version\'s block hashes', bucket: 1, why: 'Small lists, read on every sync.' },
            { text: 'Sharing permissions', bucket: 1, why: 'Checked with transactions and queries.' },
            { text: 'Blocks of old versions', bucket: 0, why: 'Still blobs, kept for 30 days.' },
            { text: 'Each device\'s sync cursor', bucket: 1, why: 'A small row per device.' },
          ],
          explain: 'Bytes to object storage; everything you query to a database.',
        },
        {
          id: 'wfs-4-2',
          type: 'predict-output',
          prompt: 'One block of a three-block file changed. How many blocks are uploaded?',
          code: `from hashlib import sha256
def h(b):
    return sha256(b).hexdigest()
v1 = [b"aaaa", b"bbbb", b"cccc"]
v2 = [b"aaaa", b"BBBB", b"cccc"]
have = {h(b) for b in v1}
up = [b for b in v2
      if h(b) not in have]
print(len(up))`,
          answer: '1',
          typedWrong: [{ answer: '3', why: 'Blocks already stored, matched by hash, are not sent again.' }],
          explain: 'Content-addressed blocks also deduplicate identical files across users.',
        },
        {
          id: 'wfs-4-3',
          type: 'mcq',
          prompt: 'Which store for metadata (names, versions, sharing)?',
          options: [
            { text: 'Relational, sharded by user' },
            { text: 'JSON files in the object store', why: 'Renames and permission checks need transactions and queries.' },
            { text: 'An in-memory cache only', why: 'Metadata must survive restarts.' },
          ],
          answer: 0,
          explain: 'A rename or a move is a small transaction on a few rows.',
        },
      ],
      strong: 'Blocks in object storage named by their hash; metadata (files, versions as lists of hashes, sharing, device cursors) in a relational database sharded by user or shared folder.',
    },

    // ------------------------------------------------------------------ 5
    {
      title: 'High-level design',
      intro: 'Separate the heavy path for bytes from the light path for metadata.',
      exercises: [
        {
          id: 'wfs-5-1',
          type: 'diagram',
          prompt: 'Devices upload 4 MB blocks here, about 6 GB/s in total. What goes in the empty slot?',
          diagram: {
            nodes: [
              { id: 'd', kind: 'client', label: 'Devices' },
              { id: 'a', kind: 'service', label: 'Sync API' },
              { id: 'b', kind: 'store', label: 'Blocks' },
              { id: 'm', kind: 'db', label: 'Metadata' },
            ],
            edges: [
              { from: 'd', to: 'a' },
              { from: 'd', to: 'b', label: 'blocks' },
              { from: 'a', to: 'm' },
            ],
          },
          goal: {
            kind: 'slot',
            slot: 'b',
            options: [
              { kind: 'store', label: 'Object store' },
              { kind: 'db', label: 'SQL rows', why: 'Petabytes of binary blocks belong in object storage.' },
              { kind: 'cache', label: 'Cache', why: 'Files must be stored durably, not just kept in memory.' },
            ],
            answer: 0,
          },
          explain: 'Cheap, durable, and it scales to exabytes.',
        },
        {
          id: 'wfs-5-2',
          type: 'diagram',
          prompt: 'After its blocks are uploaded, a device commits the new version. Tap the commit\'s path.',
          diagram: {
            nodes: [
              { id: 'd', kind: 'client', label: 'Devices' },
              { id: 'a', kind: 'service', label: 'Sync API' },
              { id: 'b', kind: 'store', label: 'Blocks' },
              { id: 'm', kind: 'db', label: 'Metadata' },
              { id: 'n', kind: 'queue', label: 'Change feed' },
            ],
            edges: [
              { from: 'd', to: 'a' },
              { from: 'd', to: 'b' },
              { from: 'a', to: 'm' },
              { from: 'a', to: 'n' },
            ],
          },
          goal: { kind: 'path', answer: ['d', 'a', 'm'] },
          explain: 'The API then posts to the change feed so other devices hear of it.',
        },
        {
          id: 'wfs-5-3',
          type: 'mcq',
          prompt: 'Why do devices upload blocks straight to the object store?',
          options: [
            { text: 'Big uploads skip the API servers' },
            { text: 'Object stores need no login', why: 'Uploads use short-lived signed URLs issued by the API.' },
            { text: 'It makes the blocks smaller', why: 'The bytes are the same either way.' },
          ],
          answer: 0,
          explain: 'API servers handle small metadata calls; 6 GB/s of blocks never touch them.',
        },
      ],
      strong: 'Devices upload blocks directly to object storage with signed URLs and commit versions through the sync API to the metadata database; the API posts each change to a feed that notifies the user\'s other devices.',
      diagram: {
        nodes: [
          { id: 'd', kind: 'client', label: 'Devices' },
          { id: 'a', kind: 'service', label: 'Sync API' },
          { id: 'b', kind: 'store', label: 'Blocks' },
          { id: 'm', kind: 'db', label: 'Metadata' },
          { id: 'n', kind: 'queue', label: 'Change feed' },
        ],
        edges: [
          { from: 'd', to: 'a' },
          { from: 'd', to: 'b', label: 'blocks' },
          { from: 'a', to: 'm' },
          { from: 'a', to: 'n' },
          { from: 'n', to: 'd', label: 'notify', dashed: true },
        ],
      },
    },

    // ------------------------------------------------------------------ 6
    {
      title: 'Deep dive',
      intro: 'The hard part: sending little when files change, and noticing when two edits collide.',
      exercises: [
        {
          id: 'wfs-6-1',
          type: 'estimate',
          prompt: 'A 1 GB file is edited in one place. How many 4 MB blocks does it have?',
          expr: 'GB / (4 * MB)',
          answer: 250,
          tolerance: 2,
          unit: 'blocks',
          options: [
            { value: 25, why: '1,000 MB / 4 MB = 250.' },
            { value: 250 },
            { value: 2500, why: '1,000 MB / 4 MB is 250, not 2,500.' },
          ],
          work: ['1,000 MB / 4 MB = 250 blocks'],
          explain: 'One block changed: 4 MB sent instead of 1 GB, 250 times less.',
        },
        {
          id: 'wfs-6-2',
          type: 'predict-output',
          prompt: 'Each commit says which version it was based on. Two devices both edited version 7. What does this print?',
          code: `server = {"v": 7}
def commit(base):
    if base != server["v"]:
        return "conflict"
    server["v"] += 1
    return "ok"
print(commit(7), commit(7))`,
          answer: 'ok conflict',
          typedWrong: [{ answer: 'ok ok', why: 'The first commit moved the file to version 8, so the second is based on an old version.' }],
          explain: 'The loser keeps its edit as a conflicted copy, as decided in step 1.',
        },
        {
          id: 'wfs-6-3',
          type: 'scenario',
          prompt: 'A shared folder with 1,000 members changes. How are their devices told?',
          situation: 'Members have several devices each; many are offline.',
          needs: ['Devices learn quickly', 'No wasted transfers'],
          options: [
            { text: 'Notify; devices pull changes', cost: 'One extra round trip per device.' },
            {
              text: 'Push whole files to all devices',
              cost: 'Files arrive without asking.',
              why: 'Sends gigabytes to devices that may not need them now.',
            },
            {
              text: 'Devices poll every few seconds',
              cost: 'Simple, no notifications.',
              why: 'Millions of idle devices polling: huge waste.',
            },
          ],
          answer: 0,
          explain: 'A small "something changed" message; each device fetches what it needs.',
        },
      ],
      strong: 'Only changed blocks are uploaded (4 MB, not the whole file); commits name their base version so collisions are detected and kept as conflicted copies; shared-folder changes notify devices, which pull from their cursor.',
    },

    // ------------------------------------------------------------------ 7
    {
      title: 'Bottlenecks and trade-offs',
      intro: 'Look at cost and at the database, then grow to ten times the users.',
      exercises: [
        {
          id: 'wfs-7-1',
          type: 'scenario',
          prompt: 'Storage cost dominates at 500 PB. What do you do?',
          situation: 'Most files are not opened for months after they are saved.',
          needs: ['Lower cost', 'No file lost'],
          options: [
            { text: 'Move cold blocks to cheaper tiers', cost: 'Old files take longer to open.' },
            {
              text: 'Delete files unopened a year',
              cost: 'Big savings.',
              why: 'Users expect their files to be kept.',
            },
            {
              text: 'Keep a single copy of each',
              cost: 'Saves the replicas.',
              why: 'One disk failure would then lose files.',
            },
          ],
          answer: 0,
          explain: 'Plus erasure coding instead of full copies, and deduplication of identical blocks.',
        },
        {
          id: 'wfs-7-2',
          type: 'mcq',
          prompt: 'At ten times the users, the metadata database is the hot spot. What do you do?',
          options: [
            { text: 'Shard metadata by user or folder' },
            { text: 'Move metadata into the blocks', why: 'Blocks are immutable blobs; renames and lists would be slow.' },
            { text: 'Buy one larger database', why: 'Hits a ceiling, and stays a single point of failure.' },
          ],
          answer: 0,
          explain: 'A shared folder lives on one shard, so its changes stay in one place.',
        },
        {
          id: 'wfs-7-3',
          type: 'bucket-sort',
          prompt: 'Which work runs on the device, and which on servers?',
          buckets: ['Device', 'Servers'],
          items: [
            { text: 'Splitting files into blocks', bucket: 0, why: 'The file is on the device.' },
            { text: 'Hashing blocks', bucket: 0, why: 'So only missing blocks are sent.' },
            { text: 'Checking sharing permissions', bucket: 1, why: 'Never trust a device to enforce access.' },
            { text: 'Storing blocks durably', bucket: 1, why: 'Object storage keeps the copies.' },
            { text: 'Watching the folder for edits', bucket: 0, why: 'Only the device sees local changes.' },
            { text: 'Ordering versions of a file', bucket: 1, why: 'One place must decide which commit won.' },
          ],
          explain: 'Devices do the heavy local work; servers keep the truth and the rules.',
        },
      ],
      strong: 'Cold blocks move to cheaper tiers with erasure coding and deduplication; at 10× the metadata database is sharded by user or shared folder, while devices keep doing the splitting and hashing.',
    },
  ],
  final: {
    diagram: {
      nodes: [
        { id: 'd', kind: 'client', label: 'Devices' },
        { id: 'a', kind: 'service', label: 'Sync API' },
        { id: 'b', kind: 'store', label: 'Blocks' },
        { id: 'm', kind: 'db', label: 'Metadata' },
        { id: 'n', kind: 'queue', label: 'Change feed' },
      ],
      edges: [
        { from: 'd', to: 'a', label: 'commit' },
        { from: 'd', to: 'b', label: 'blocks' },
        { from: 'a', to: 'm' },
        { from: 'a', to: 'n' },
        { from: 'n', to: 'd', label: 'notify', dashed: true },
      ],
    },
    decisions: [
      'Files split into 4 MB blocks named by hash; only missing blocks are uploaded.',
      'Blocks go straight to object storage (500 PB) with signed URLs.',
      'Metadata in a relational database: versions are lists of block hashes.',
      'Commits name their base version; collisions become conflicted copies.',
      'Changes notify devices, which pull from their own cursor; metadata shards by user at 10×.',
    ],
  },
  blank: {
    requirements: [
      'Upload, download and sync across devices',
      'Share folders with other people',
      'Never lose a file; keep 30 days of versions',
      'Offline edits sync later; conflicts kept',
      'Files up to 10 GB',
    ],
    components: ['client', 'service', 'store', 'db', 'queue'],
    firstFive: [
      'Ask users, data per user, file sizes and whether offline edits matter',
      'Say durability comes first, then sync in seconds',
      'Estimate total storage and daily upload bandwidth',
      'Choose blocks named by hash, split from metadata',
      'Explain how other devices learn of a change',
    ],
  },
};
