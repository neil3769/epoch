import { s4Labs } from '../labs/s4';
import { s4Library } from '../library/s4';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s4More } from './s4-more';

/*
 * S4 Caching and CDNs. Lessons 1-5 here: why cache (cache figure),
 * cache-aside (code against sim.FakeDB), write-through and write-back, TTL
 * and stale data (cache figure), invalidation. Lessons 6-10 in s4-more.ts:
 * eviction, stampedes, CDNs, what to cache and what never, checkpoint.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's4-01',
    title: 'Why cache',
    summary: 'Keep the result of slow work in memory; hits are fast, misses pay the full cost once.',
    card: {
      title: 'Why cache',
      text: 'A page takes 800 ms because of one slow database query, and thousands of people load it every hour. A cache keeps the result in memory: the first request misses and pays the 800 ms, and the next ones hit and take about a millisecond. The figure plays reads one per second against a cache of a chosen size.',
      figure: {
        kind: 'cache',
        reads: 'a b a a c a b a',
        size: 2,
        policy: 'lru',
        ttl: null,
      },
    },
    exercises: [
      {
        id: 's4-1-1',
        type: 'figure',
        prompt: 'A one-entry cache keeps throwing out the popular key. Reach a hit rate of 50%.',
        figure: {
          kind: 'cache',
          reads: 'a b a a c a b a',
          size: 1,
          policy: 'lru',
          ttl: null,
          editable: ['size'],
          goal: { hitRate: 0.5 },
        },
        explain: 'Two entries hold "a" and one other key, and "a" is most of the reads.',
      },
      {
        id: 's4-1-2',
        type: 'estimate',
        prompt: '90% of reads hit the cache (1 ms); misses take 800 ms. Average time per read?',
        expr: '0.9 * 1 + 0.1 * 800',
        answer: 80.9,
        tolerance: 1.5,
        unit: 'ms',
        options: [
          { value: 8, why: 'The 10% of misses alone add 80 ms.' },
          { value: 81 },
          { value: 400, why: 'Most reads are hits: 0.9 × 1 + 0.1 × 800.' },
        ],
        work: ['Hits: 0.9 × 1 ms = 0.9 ms', 'Misses: 0.1 × 800 ms = 80 ms', 'Average ≈ 81 ms, ten times faster'],
        explain: 'The misses dominate: raising the hit rate to 99% gives about 9 ms.',
      },
      {
        id: 's4-1-3',
        type: 'predict-output',
        prompt: 'Five reads of the same product. How many database queries?',
        code: `db = sim.FakeDB({"p1": "Pizza"})
cache = {}
for _ in range(5):
    if "p1" not in cache:
        cache["p1"] = db.get("p1")
print(db.queries)`,
        answer: '1',
        typedWrong: [{ answer: '5', why: 'Only the first read misses; the rest come from the dict.' }],
        explain: '`sim.FakeDB` counts every query and adds 50 ms of simulated time to each.',
      },
      {
        id: 's4-1-4',
        type: 'diagram',
        prompt: 'The app should check something fast before the database. What goes in the empty slot?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'c', kind: 'cache', label: 'Cache' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'a', to: 'c', label: '1 look' },
            { from: 'a', to: 'd', label: '2 miss' },
          ],
        },
        goal: {
          kind: 'slot',
          slot: 'c',
          options: [
            { kind: 'cache', label: 'Cache' },
            { kind: 'replica', label: 'DB replica', why: 'A replica runs the same slow query; it spreads load but does not make it fast.' },
            { kind: 'queue', label: 'Queue', why: 'A queue delays work; it does not answer reads.' },
          ],
          answer: 0,
        },
        explain: 'Memory first; the database only on a miss.',
      },
      {
        id: 's4-1-5',
        type: 'mcq',
        prompt: 'What does a cache miss cost?',
        options: [
          { text: 'The full slow path' },
          { text: 'Nothing: misses are free', why: 'A miss does the full slow work and then stores it.' },
          { text: 'An error for the user', why: 'A miss is just slower; the result is still correct.' },
        ],
        answer: 0,
        explain: 'Caches help only when entries are read again before they go.',
      },
      {
        id: 's4-1-6',
        type: 'bucket-sort',
        prompt: 'A good thing to cache?',
        buckets: ['Good fit', 'Poor fit'],
        items: [
          { text: 'A product page viewed 10,000 times an hour, edited daily', bucket: 0, why: 'Read constantly, changes rarely.' },
          { text: 'The list of countries', bucket: 0, why: 'Almost never changes.' },
          { text: 'A report run once by one person', bucket: 1, why: 'Nobody reads it again: every read is a miss.' },
          { text: 'An account balance during a transfer', bucket: 1, why: 'It must be exact right now.' },
          { text: 'Exchange rates read 1,000 times a second, updated each minute', bucket: 0, why: 'Hot and tolerant of a few seconds\' age: a short TTL.' },
        ],
        explain: 'Read often, changes rarely, can be a little old.',
      },
      {
        id: 's4-1-7',
        type: 'estimate',
        prompt: 'The app does 2,000 reads/s with a 95% hit rate. How many reads per second reach the database?',
        expr: '2000 * (1 - 0.95)',
        answer: 100,
        tolerance: 1.5,
        unit: 'reads/s',
        options: [
          { value: 100 },
          { value: 1000, why: 'Only the 5% of misses reach the database.' },
          { value: 1900, why: 'That is the hits; the misses go to the database.' },
        ],
        work: ['Misses: 5% of 2,000 = 100 per second'],
        explain: 'A twentyfold cut in database load.',
      },
      {
        id: 's4-1-8',
        type: 'scenario',
        prompt: 'A dashboard query takes 800 ms. What do you do?',
        situation: 'The query is already indexed; it adds up 2 million rows of sales. 500 people open the dashboard each minute.',
        needs: ['Fast loads for everyone', 'Totals a few minutes old are fine'],
        options: [
          {
            text: 'Cache the totals for 5 minutes',
            cost: 'Totals up to 5 minutes old.',
          },
          {
            text: 'Buy a bigger database',
            cost: 'A pricier machine.',
            why: 'Every view still runs an expensive query: 500 a minute.',
          },
          {
            text: 'Add up the rows in the browser',
            cost: 'Sends 2 million rows to every visitor.',
            why: 'Far slower, and it exposes the raw data.',
          },
        ],
        answer: 0,
        explain: 'One query every 5 minutes instead of 500 a minute.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's4-02',
    title: 'Cache-aside',
    summary: 'The app checks the cache, reads the database on a miss, and stores the result.',
    card: {
      title: 'Cache-aside',
      text: 'In cache-aside the app does the work: look in the cache, and on a miss read the database and put the result in the cache. The cache never talks to the database itself. If the cache goes down, reads still work, just slower.',
      code: `db = sim.FakeDB({"u1": "Ana"})
cache = {}

def get(key):
    v = cache.get(key)
    if v is None:
        v = db.get(key)
        cache[key] = v
    return v

a, b = get("u1"), get("u1")
print(a, b, db.queries)`,
      output: 'Ana Ana 1',
    },
    exercises: [
      {
        id: 's4-2-1',
        type: 'order-steps',
        prompt: 'A read with cache-aside. Put it in order.',
        steps: [
          'The app looks up the key in the cache',
          'The cache has no entry: a miss',
          'The app reads the value from the database',
          'The app stores the value in the cache',
          'The app returns the value',
        ],
        explain: 'Next time the first step finds it.',
      },
      {
        id: 's4-2-2',
        type: 'predict-output',
        prompt: 'How many database queries for these reads?',
        code: `rows = {"a": 1, "b": 2, "c": 3}
db = sim.FakeDB(rows)
cache = {}

def get(key):
    if key not in cache:
        cache[key] = db.get(key)
    return cache[key]

for k in "abaabc":
    get(k)
print(db.queries)`,
        answer: '3',
        typedWrong: [{ answer: '6', why: 'Each key misses only the first time.' }],
        explain: 'Three distinct keys, three misses.',
      },
      {
        id: 's4-2-3',
        type: 'run-code',
        prompt: 'Write `get(key)` with cache-aside around `db`, using the dict `cache`.',
        before: `db = sim.FakeDB({"u1": "Ana",
                 "u2": "Bo"})
cache = {}`,
        solution: `def get(key):
    if key not in cache:
        cache[key] = db.get(key)
    return cache[key]`,
        tests: [
          'assert get("u1") == "Ana" and get("u2") == "Bo", "returns the values"',
          'get("u1"); get("u1")',
          'assert db.queries == 2, f"one query per key; got {db.queries}"',
        ].join('\n'),
        maxLines: 6,
        placeholder: 'def get(key):',
        explain: 'Four reads, two queries.',
      },
      {
        id: 's4-2-4',
        type: 'predict-output',
        prompt: 'Simulated time: each query takes 50 ms. What does this print?',
        code: `sim.clock.reset()
db = sim.FakeDB({"a": 1}, delay=0.05)
cache = {}
for _ in range(4):
    if "a" not in cache:
        cache["a"] = db.get("a")
print(round(sim.clock.time(), 2))`,
        answer: '0.05',
        typedWrong: [{ answer: '0.2', why: 'Only the first of the four reads goes to the database.' }],
        explain: 'Without the cache: 0.2 s.',
      },
      {
        id: 's4-2-5',
        type: 'mcq',
        prompt: 'With cache-aside, the cache server crashes. What happens to reads?',
        options: [
          { text: 'Slower, via the database' },
          { text: 'They all fail', why: 'The app falls back to the database on every miss.' },
          { text: 'They return old values', why: 'With no cache, every read is fresh from the database.' },
        ],
        answer: 0,
        explain: 'Make sure the database can survive that extra load for a while.',
      },
      {
        id: 's4-2-6',
        type: 'scenario',
        prompt: 'Bots ask for user ids that do not exist, thousands a second. What do you do?',
        situation: 'Cache-aside stores only users that exist, so every unknown id goes to the database.',
        needs: ['Protect the database', 'A new user should appear within a minute'],
        options: [
          {
            text: 'Cache "not found" for 60 s',
            cost: 'A new user may look missing for up to a minute.',
          },
          {
            text: 'Never cache misses',
            cost: 'Nothing to build.',
            why: 'Every bot request keeps hitting the database.',
          },
          {
            text: 'Cache "not found" forever',
            cost: 'Nothing to expire.',
            why: 'New users with those ids would never be found.',
          },
        ],
        answer: 0,
        explain: 'Negative caching with a short TTL.',
      },
      {
        id: 's4-2-7',
        type: 'fill-blank',
        prompt: 'Read the database only on a miss.',
        code: `db = sim.FakeDB({"k": 7})
cache = {}

def get(key):
    v = cache.get(key)
    if v is ___:
        v = cache[key] = db.get(key)
    return v

get("k"); get("k")
print(db.queries)`,
        answer: ['None'],
        distractors: [{ text: '7', why: 'That reads the database on every hit instead.' }],
        expectOutput: '1',
        explain: 'dict.get returns None for a missing key.',
      },
      {
        id: 's4-2-8',
        type: 'diagram',
        prompt: 'With cache-aside, which box reads the database on a miss?',
        diagram: {
          nodes: [
            { id: 'u', kind: 'client', label: 'Browser' },
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'c', kind: 'cache', label: 'Cache' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'u', to: 'a' },
            { from: 'a', to: 'c' },
            { from: 'a', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'a',
          why: {
            u: 'The browser only talks to the app.',
            c: 'In cache-aside the cache never calls the database.',
            d: 'The database is what gets read.',
          },
        },
        explain: 'The app holds the logic; the cache is a plain key-value store.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's4-03',
    title: 'Write-through and write-back',
    summary: 'Write-through updates cache and database together; write-back saves to the database later.',
    card: {
      title: 'Write-through and write-back',
      text: 'Writes need a choice too. Write-through writes to the database and the cache together, so the cache stays fresh but every write pays for both. Write-back writes only to the cache and saves to the database later: fast, but anything not yet saved is lost if the cache dies.',
    },
    exercises: [
      {
        id: 's4-3-1',
        type: 'bucket-sort',
        prompt: 'Write-through or write-back?',
        buckets: ['Write-through', 'Write-back'],
        items: [
          { text: 'Every write waits for the database', bucket: 0, why: 'It writes both before answering.' },
          { text: 'Fastest writes', bucket: 1, why: 'It answers once memory has the value.' },
          { text: 'Can lose recent writes in a crash', bucket: 1, why: 'Unsaved changes live only in the cache.' },
          { text: 'The cache is never behind the database', bucket: 0, why: 'Both are updated together.' },
          { text: 'Many updates to one key become one save', bucket: 1, why: 'Only the latest value is flushed.' },
        ],
        explain: 'Safety or speed: decide per kind of data.',
      },
      {
        id: 's4-3-2',
        type: 'scenario',
        prompt: 'How do you write view counters?',
        situation: 'A video site counts views: millions of increments a second. Losing a few seconds of counts in a crash is acceptable.',
        needs: ['Handle the write rate', 'Approximate counts are fine'],
        options: [
          {
            text: 'Count in cache, save often',
            cost: 'A crash loses the last few seconds of counts.',
          },
          {
            text: 'Write every increment to the database',
            cost: 'Millions of database writes a second.',
            why: 'The database would melt under that rate.',
          },
          {
            text: 'Do not count views',
            cost: 'No view counts.',
            why: 'The product needs them.',
          },
        ],
        answer: 0,
        explain: 'Batching turns millions of writes into one save per video every few seconds.',
      },
      {
        id: 's4-3-3',
        type: 'scenario',
        prompt: 'How do you write account balances?',
        situation: 'A payments app caches balances for fast display.',
        needs: ['No lost money, ever', 'Balances shown are current'],
        options: [
          {
            text: 'Write-through (or no cache)',
            cost: 'Every payment waits for the database.',
          },
          {
            text: 'Write-back every 10 seconds',
            cost: 'Up to 10 seconds of payments only in memory.',
            why: 'A crash would lose real money.',
          },
          {
            text: 'Cache balances for an hour',
            cost: 'Very few database reads.',
            why: 'Shown balances would be up to an hour old.',
          },
        ],
        answer: 0,
        explain: 'The database stays the source of truth for money.',
      },
      {
        id: 's4-3-4',
        type: 'predict-output',
        prompt: 'Write-back: "b" is written but not yet saved when the cache crashes. What is in the database?',
        code: `db, cache, dirty = {}, {}, set()

def write(k, v):
    cache[k] = v
    dirty.add(k)

def flush():
    for k in dirty:
        db[k] = cache[k]
    dirty.clear()

write("a", 1)
flush()
write("b", 2)
cache.clear()   # the cache crashes
print(db)`,
        answer: "{'a': 1}",
        typedWrong: [{ answer: "{'a': 1, 'b': 2}", why: '"b" was never flushed before the crash.' }],
        explain: 'The window between write and flush is the risk.',
      },
      {
        id: 's4-3-5',
        type: 'predict-output',
        prompt: 'The same with write-through. What is in the database?',
        code: `db, cache = {}, {}

def write(k, v):
    db[k] = v
    cache[k] = v

write("a", 1)
write("b", 2)
cache.clear()   # the cache crashes
print(db)`,
        answer: "{'a': 1, 'b': 2}",
        typedWrong: [{ answer: "{'a': 1}", why: 'Write-through saved "b" before answering.' }],
        explain: 'Nothing lost; each write paid for both stores.',
      },
      {
        id: 's4-3-6',
        type: 'mcq',
        prompt: 'Which keeps the cache fresh right after every write?',
        options: [
          { text: 'Write-through' },
          { text: 'Cache-aside with no invalidation', why: 'Writes go to the database only; the cache keeps the old value.' },
          { text: 'A long TTL', why: 'That makes stale entries last longer.' },
        ],
        answer: 0,
        explain: 'Cache-aside plus deleting on write (lesson 5) also works.',
      },
      {
        id: 's4-3-7',
        type: 'order-steps',
        prompt: 'A write-back write. Put it in order.',
        steps: [
          'The app writes the new value to the cache',
          'The cache marks the key as not yet saved',
          'The app tells the user it is done',
          'Later, the cache saves the value to the database',
        ],
        explain: 'The user hears "done" before the database knows.',
      },
      {
        id: 's4-3-8',
        type: 'diagram',
        prompt: 'With write-back, which box holds changes that are not yet safe?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'c', kind: 'cache', label: 'Cache' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'a', to: 'c', label: 'write' },
            { from: 'c', to: 'd', label: 'later', dashed: true },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'c',
          why: {
            a: 'The app has handed the write over and moved on.',
            d: 'The database has not received it yet.',
          },
        },
        explain: 'Until the flush, the cache is the only copy.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's4-04',
    title: 'TTL and stale data',
    summary: 'Entries expire after a time to live: no answer is older than the TTL, at the cost of more misses.',
    card: {
      title: 'TTL and stale data',
      text: 'A cached copy goes out of date when the source changes: a stale read. A TTL (time to live) makes each entry expire after a set time, so no answer is older than the TTL. Shorter TTLs mean fresher answers and more misses.',
    },
    exercises: [
      {
        id: 's4-4-1',
        type: 'figure',
        prompt: 'The value of "a" changes at second 4 (the dot), and the cache keeps serving the old one. Remove the stale reads while keeping a hit rate of 50%.',
        figure: {
          kind: 'cache',
          reads: 'a a a a a a a a',
          changes: [{ key: 'a', at: 4 }],
          size: 1,
          policy: 'lru',
          ttl: null,
          editable: ['ttl'],
          goal: { noStale: true, minHitRate: 0.5 },
        },
        explain: 'A 2-second TTL refetches "a" exactly when it changed; longer TTLs serve the old value.',
      },
      {
        id: 's4-4-2',
        type: 'figure',
        prompt: 'Now the other way round: choose a TTL that makes the cache serve a stale value.',
        figure: {
          kind: 'cache',
          reads: 'a a a a a a',
          changes: [{ key: 'a', at: 4 }],
          size: 1,
          policy: 'lru',
          ttl: 2,
          editable: ['ttl'],
          goal: { stale: true },
        },
        explain: 'Any TTL longer than the time since the last fetch serves the old value after the change.',
      },
      {
        id: 's4-4-3',
        type: 'estimate',
        prompt: '1,000 popular keys, each refetched once per TTL of 10 s. How many database reads per second do the refetches cause?',
        expr: '1000 / 10',
        answer: 100,
        tolerance: 1.5,
        unit: 'reads/s',
        options: [
          { value: 10, why: '1,000 keys each once every 10 s is 100 a second.' },
          { value: 100 },
          { value: 10000, why: 'Divide by the TTL, do not multiply.' },
        ],
        work: ['Each key: 1 read every 10 s = 0.1/s', '1,000 keys × 0.1 = 100 reads/s'],
        explain: 'Halve the TTL and this doubles.',
      },
      {
        id: 's4-4-4',
        type: 'bucket-sort',
        prompt: 'Short TTL (seconds) or long TTL (hours)?',
        buckets: ['Short', 'Long'],
        items: [
          { text: 'A stock price', bucket: 0, why: 'Changes constantly; old values mislead.' },
          { text: 'A product description', bucket: 1, why: 'Edited rarely.' },
          { text: 'Current weather', bucket: 0, why: 'Changes through the day; minutes at most.' },
          { text: 'The list of countries', bucket: 1, why: 'Almost never changes.' },
          { text: 'An article published yesterday', bucket: 1, why: 'Stable once published.' },
        ],
        explain: 'TTL = how old an answer may be.',
      },
      {
        id: 's4-4-5',
        type: 'predict-output',
        prompt: 'An entry stored at second 100 with a TTL of 30. Is it fresh at 120 and at 140?',
        code: `def fresh(stored, now, ttl=30):
    return now - stored < ttl

a = fresh(100, 120)
print(a, fresh(100, 140))`,
        answer: 'True False',
        typedWrong: [{ answer: 'True True', why: '140 − 100 = 40 seconds, past the 30-second TTL.' }],
        explain: 'Expired entries are treated as misses.',
      },
      {
        id: 's4-4-6',
        type: 'mcq',
        prompt: 'Does a TTL guarantee users never see old data?',
        options: [
          { text: 'No: it limits how old' },
          { text: 'Yes: entries expire', why: 'Until they expire, a changed value is served old.' },
          { text: 'Only for short TTLs', why: 'Any TTL above zero allows some staleness.' },
        ],
        answer: 0,
        explain: 'To show changes immediately, invalidate on write (next lesson).',
      },
      {
        id: 's4-4-7',
        type: 'fill-blank',
        prompt: 'Fresh while younger than the TTL.',
        code: `ttl, stored, now = 60, 0, 45
fresh = now - stored < ___
print(fresh)`,
        answer: ['ttl'],
        distractors: [{ text: 'now', why: 'Comparing the age with now itself means nothing.' }],
        expectOutput: 'True',
        explain: '45 seconds old, TTL 60: still fresh.',
      },
      {
        id: 's4-4-8',
        type: 'scenario',
        prompt: 'Prices are cached for 10 minutes. What happens at checkout?',
        situation: 'Product pages show cached prices (TTL 10 minutes). Prices change a few times a day.',
        needs: ['Fast product pages', 'Customers pay exactly the current price'],
        options: [
          {
            text: 'Read the price fresh at checkout',
            cost: 'One database read per order.',
          },
          {
            text: 'Use the cached price at checkout',
            cost: 'No extra reads.',
            why: 'It can be 10 minutes out of date when money changes hands.',
          },
          {
            text: 'Stop caching product pages',
            cost: 'Every page view hits the database.',
            why: 'That gives up the fast pages the needs ask for.',
          },
        ],
        answer: 0,
        explain: 'Cache for display; read the source of truth where it matters.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's4-05',
    title: 'Invalidation',
    summary: 'Delete the cached entry when the data changes; keep a TTL as a safety net.',
    card: {
      title: 'Invalidation',
      text: 'Instead of waiting for a TTL, the app deletes the cached entry whenever it changes the data, so the next read fetches the new value. Deleting is safer than writing the new value into the cache, because two writers racing can leave the older value behind. Keep a TTL too, as a safety net for a delete that was missed.',
      code: `db = sim.FakeDB({"p": 10})
cache = {"p": 10}

def update(key, value):
    db.put(key, value)
    cache.pop(key, None)

update("p", 12)
print(cache.get("p"), db.rows["p"])`,
      output: 'None 12',
    },
    exercises: [
      {
        id: 's4-5-1',
        type: 'predict-output',
        prompt: 'The price changes in the database but nobody touches the cache. What does the next read return?',
        code: `db = {"p": 10}
cache = {"p": 10}

db["p"] = 12   # price change

def get(k):
    if k not in cache:
        cache[k] = db[k]
    return cache[k]

print(get("p"))`,
        answer: '10',
        typedWrong: [{ answer: '12', why: 'The cache still has "p" and is never asked to drop it.' }],
        explain: 'Stale until a TTL or an invalidation removes it.',
      },
      {
        id: 's4-5-2',
        type: 'predict-output',
        prompt: 'Now the update deletes the cache entry. What does the next read return?',
        code: `db = {"p": 10}
cache = {"p": 10}

db["p"] = 12
cache.pop("p", None)

def get(k):
    if k not in cache:
        cache[k] = db[k]
    return cache[k]

print(get("p"))`,
        answer: '12',
        typedWrong: [{ answer: '10', why: 'The entry was deleted, so the read misses and fetches 12.' }],
        explain: 'The next read refills the cache with the new value.',
      },
      {
        id: 's4-5-3',
        type: 'order-steps',
        prompt: 'A price change with invalidation. Put it in order.',
        steps: [
          'The app writes the new price to the database',
          'The app deletes the price from the cache',
          'The next read misses',
          'That read fetches the new price from the database',
          'It stores the new price in the cache',
        ],
        explain: 'Database first, then delete: the other order can let a reader re-cache the old value.',
      },
      {
        id: 's4-5-4',
        type: 'run-code',
        prompt: 'Write `update(key, value)`: save to `db`, then remove `key` from `cache` if it is there.',
        before: `db = sim.FakeDB({"p": 10})
cache = {"p": 10}`,
        solution: `def update(key, value):
    db.put(key, value)
    cache.pop(key, None)`,
        tests: [
          'update("p", 12)',
          'assert db.rows["p"] == 12, "the database has the new value"',
          'assert "p" not in cache, "the stale entry is gone"',
          'update("q", 1)',
          'assert db.rows["q"] == 1, "keys not in the cache work too"',
        ].join('\n'),
        maxLines: 4,
        placeholder: 'def update(key, value):',
        explain: 'pop with a default does nothing for keys that are not cached.',
      },
      {
        id: 's4-5-5',
        type: 'predict-output',
        prompt: 'Two writers update the cache directly, and the slower one finishes last. What is left?',
        code: `db = None
cache = {}

db = 2          # B's write lands last
cache["x"] = 2  # B updates the cache
cache["x"] = 1  # A's late update

print(db, cache["x"])`,
        answer: '2 1',
        typedWrong: [{ answer: '2 2', why: 'A\'s slower cache write came after B\'s.' }],
        explain: 'Deleting instead avoids this: the next read fetches 2 from the database.',
      },
      {
        id: 's4-5-6',
        type: 'mcq',
        prompt: 'Why keep a TTL when you already invalidate on every write?',
        options: [
          { text: 'A safety net for missed deletes' },
          { text: 'To make reads faster', why: 'A TTL causes misses; it is insurance, not speed.' },
          { text: 'Invalidation needs a TTL to work', why: 'Deleting works alone; the TTL covers its failures.' },
        ],
        answer: 0,
        explain: 'A crash between the database write and the delete would otherwise leave stale data forever.',
      },
      {
        id: 's4-5-7',
        type: 'scenario',
        prompt: 'Each of 20 app servers keeps its own in-memory cache. Prices go stale. What do you change?',
        situation: 'An update deletes the entry only in the cache of the server that handled it; the other 19 keep the old price.',
        needs: ['A price change shows everywhere within seconds', 'Keep fast reads'],
        options: [
          {
            text: 'Use one shared cache for all servers',
            cost: 'A network hop per read instead of local memory.',
          },
          {
            text: 'Keep local caches with a 1-hour TTL',
            cost: 'Nothing new.',
            why: 'Other servers would show the old price for up to an hour.',
          },
          {
            text: 'Remove caching',
            cost: 'Every read hits the database.',
            why: 'That gives up the fast reads.',
          },
        ],
        answer: 0,
        explain: 'Or keep local caches with a very short TTL, or broadcast deletes; each has its cost.',
      },
      {
        id: 's4-5-8',
        type: 'diagram',
        prompt: 'A price is updated. Which box\'s entry must be deleted?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'Admin app' },
            { id: 'd', kind: 'db', label: 'Database' },
            { id: 'c', kind: 'cache', label: 'Shared cache' },
            { id: 's', kind: 'service', label: 'Shop app' },
          ],
          edges: [
            { from: 'a', to: 'd', label: 'write' },
            { from: 'a', to: 'c', label: 'delete' },
            { from: 's', to: 'c' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'c',
          why: {
            a: 'The admin app performs the update; it holds no copy.',
            d: 'The database gets the new value; nothing to delete there.',
            s: 'The shop app reads through the shared cache; it keeps no copy itself.',
          },
        },
        explain: 'One shared cache, one delete.',
      },
    ],
  },
];

export const s4: Unit = {
  id: 'S4',
  track: 'system-design',
  title: 'Caching and CDNs',
  blurb: 'Where caches sit, cache-aside, write-through and write-back, TTLs and stale data, invalidation, eviction, stampedes, CDNs, and what never to cache.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s4More],
  labs: s4Labs,
  library: s4Library,
};
