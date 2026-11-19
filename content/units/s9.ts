import { s9Labs } from '../labs/s9';
import { s9Library } from '../library/s9';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s9More } from './s9-more';

/*
 * S9 APIs and service boundaries. Lessons 1-5 here: REST, gRPC and GraphQL,
 * pagination, versioning, idempotency keys, rate-limiting windows (limiter
 * figure). Lessons 6-10 in s9-more.ts: the token bucket, the API gateway,
 * monolith versus microservices, service discovery, checkpoint.
 */
const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's9-01',
    title: 'REST, gRPC, GraphQL',
    summary: 'REST for public resource APIs, gRPC for fast typed calls between services, GraphQL for clients that pick their fields.',
    card: {
      title: 'REST, gRPC, GraphQL',
      text: 'REST exposes resources at URLs and uses HTTP methods on them (GET /orders/7); it is simple, cacheable and what public APIs usually offer. gRPC sends compact binary messages over HTTP/2 with generated, typed clients, which suits fast calls between your own services. GraphQL gives one endpoint where the client asks for exactly the fields it needs, which suits apps that need data from many places in one round trip.',
    },
    exercises: [
      {
        id: 's9-1-1',
        type: 'match-pairs',
        prompt: 'Match each style to where it fits best.',
        pairs: [
          { left: 'REST', right: 'a public API for any client', why: 'Plain HTTP and JSON, cacheable GETs.' },
          { left: 'gRPC', right: 'fast calls between services', why: 'Binary, typed, generated clients.' },
          { left: 'GraphQL', right: 'an app picking its own fields', why: 'One query, exactly the data needed.' },
        ],
        explain: 'Many systems use all three in different places.',
      },
      {
        id: 's9-1-2',
        type: 'bucket-sort',
        prompt: 'Safe to repeat (idempotent) by the HTTP rules?',
        buckets: ['Idempotent', 'Not'],
        items: [
          { text: 'GET /orders/7', bucket: 0, why: 'Reading changes nothing.' },
          { text: 'PUT /users/9 with a full profile', bucket: 0, why: 'Same body, same final state.' },
          { text: 'DELETE /photos/3', bucket: 0, why: 'Gone after the first; still gone after the second.' },
          { text: 'POST /orders', bucket: 1, why: 'Each call can create another order.' },
          { text: 'POST /payments', bucket: 1, why: 'Twice can mean paying twice.' },
        ],
        explain: 'GET, PUT and DELETE are idempotent by definition; POST is not.',
      },
      {
        id: 's9-1-3',
        type: 'scenario',
        prompt: 'A phone app\'s home screen needs the user, five orders and each order\'s first item. Today it makes 11 REST calls. What helps?',
        situation: 'Mobile networks add 100 ms or more per round trip.',
        needs: ['One round trip', 'Only the fields the screen shows'],
        options: [
          {
            text: 'A GraphQL query for the screen',
            cost: 'A GraphQL server and care with slow resolvers.',
          },
          {
            text: 'Switch the app to gRPC calls',
            cost: 'A proxy for clients that cannot speak it directly.',
            why: 'Faster encoding, but still 11 calls and fixed response shapes.',
          },
        ],
        answer: 0,
        explain: 'GraphQL (or one screen-specific endpoint) collapses the calls.',
      },
      {
        id: 's9-1-4',
        type: 'mcq',
        prompt: 'Which status code says "created"?',
        options: [
          { text: '201' },
          { text: '200', why: 'Plain OK; 201 says a new resource exists.' },
          { text: '204', why: 'No content: success with an empty body.' },
        ],
        answer: 0,
        explain: 'Usually with a Location header pointing at the new resource.',
      },
      {
        id: 's9-1-5',
        type: 'bucket-sort',
        prompt: '401 or 403?',
        buckets: ['401', '403'],
        items: [
          { text: 'No login token sent', bucket: 0, why: 'Not authenticated: who are you?' },
          { text: 'Token expired', bucket: 0, why: 'Log in again.' },
          { text: 'Logged in, but not an admin', bucket: 1, why: 'Known user, not allowed.' },
          { text: 'Reading another user\'s private file', bucket: 1, why: 'Authenticated, not authorised.' },
          { text: 'Malformed token', bucket: 0, why: 'Cannot tell who you are.' },
        ],
        explain: '401: we do not know who you are. 403: we do, and the answer is no.',
      },
      {
        id: 's9-1-6',
        type: 'predict-output',
        prompt: 'A tiny router maps method and path to a handler. What does this print?',
        code: `routes = {
    ("GET", "/orders"): "list",
    ("POST", "/orders"): "create",
}
def route(method, path):
    key = (method, path)
    return routes.get(key, 404)

print(route("POST", "/orders"),
      route("DELETE", "/orders"))`,
        answer: 'create 404',
        typedWrong: [{ answer: 'create None', why: '`get` returns the default given, 404.' }],
        explain: 'Strictly, a known path with an unsupported method is 405 Method Not Allowed.',
      },
      {
        id: 's9-1-7',
        type: 'mcq',
        prompt: 'Why is gRPC usually kept between services rather than offered to browsers?',
        options: [
          { text: 'Browsers cannot speak it directly' },
          { text: 'It is much slower than JSON', why: 'Binary messages are usually faster.' },
          { text: 'It has no types or schema at all', why: 'It is strongly typed by its schema.' },
        ],
        answer: 0,
        explain: 'Browsers need a proxy such as gRPC-Web.',
      },
      {
        id: 's9-1-8',
        type: 'fill-blank',
        prompt: 'A GraphQL-style request: return only the fields asked for.',
        code: `user = {"id": 7, "name": "Ann",
        "email": "a@x.io", "bio": "…"}
def query(fields):
    return {f: user[f] for f in ___}

print(query(["name", "id"]))`,
        answer: ['fields'],
        distractors: [{ text: 'user', why: 'That returns every field, the opposite of the point.' }],
        expectOutput: "{'name': 'Ann', 'id': 7}",
        explain: 'Clients get what they ask for and nothing more.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's9-02',
    title: 'Pagination',
    summary: 'Offset pages get slow and skip rows as data changes; cursors continue from the last item seen.',
    card: {
      title: 'Pagination',
      text: 'Lists are returned a page at a time. Offset pagination (page 500 = skip 9,980 rows) gets slower the deeper you go and skips or repeats items when rows are added meanwhile. Cursor pagination returns a token for the last item seen and asks for items after it, which an index finds directly and which stays correct as data changes.',
    },
    exercises: [
      {
        id: 's9-2-1',
        type: 'predict-output',
        prompt: 'Page 2 is fetched by offset, but a new post arrived at the top in between. What does page 2 show?',
        code: `posts = [9, 8, 7, 6, 5, 4]
page1 = posts[0:3]
posts.insert(0, 10)    # new post
page2 = posts[3:6]
print(page1, page2)`,
        answer: '[9, 8, 7] [7, 6, 5]',
        typedWrong: [{ answer: '[9, 8, 7] [6, 5, 4]', why: 'Everything shifted down by one: 7 appears again.' }],
        explain: 'The reader sees post 7 twice. Deletions make it skip instead.',
      },
      {
        id: 's9-2-2',
        type: 'predict-output',
        prompt: 'The same, with a cursor: "items older than the last one I saw".',
        code: `posts = [9, 8, 7, 6, 5, 4]
page1 = posts[0:3]
posts.insert(0, 10)
cursor = page1[-1]
page2 = [p for p in posts
         if p < cursor][:3]
print(page2)`,
        answer: '[6, 5, 4]',
        typedWrong: [{ answer: '[7, 6, 5]', why: 'Only items below 7 are taken.' }],
        explain: 'The new post does not disturb the next page.',
      },
      {
        id: 's9-2-3',
        type: 'mcq',
        prompt: 'Why does `OFFSET 100000` get slow?',
        options: [
          { text: 'It reads and discards 100,000 rows' },
          { text: 'It sorts the whole table twice', why: 'With an index the order is free; skipping is the cost.' },
          { text: 'Offsets cannot use the network', why: 'The work happens in the database.' },
        ],
        answer: 0,
        explain: 'A cursor (`WHERE id < 12345`) jumps straight there through the index.',
      },
      {
        id: 's9-2-4',
        type: 'scenario',
        prompt: 'A feed scrolls forever and gets new posts every second. Which pagination?',
        situation: 'Users scroll hundreds of pages deep; nobody jumps to "page 731".',
        needs: ['No repeated or missing posts', 'Fast at any depth'],
        options: [
          {
            text: 'A cursor from the last post',
            cost: 'No jumping to an arbitrary page number.',
          },
          {
            text: 'Page numbers with offsets',
            cost: 'Easy to build.',
            why: 'Deep pages are slow and new posts shift everything.',
          },
        ],
        answer: 0,
        explain: 'Offsets suit small, stable lists with numbered pages (an admin table).',
      },
      {
        id: 's9-2-5',
        type: 'bucket-sort',
        prompt: 'Offset or cursor?',
        buckets: ['Offset', 'Cursor'],
        items: [
          { text: 'An infinite social feed', bucket: 1, why: 'Changes constantly; scrolls deep.' },
          { text: 'An admin table with page numbers', bucket: 0, why: 'Small, needs "go to page 4".' },
          { text: 'Syncing a million records to a partner', bucket: 1, why: 'Deep and must not skip any.' },
          { text: 'Search results, first few pages', bucket: 0, why: 'Few pages, numbered.' },
          { text: 'A chat history scrolling back', bucket: 1, why: 'New messages arrive while reading.' },
        ],
        explain: 'Cursors for deep or changing lists; offsets for small numbered pages.',
      },
      {
        id: 's9-2-6',
        type: 'run-code',
        prompt: 'Write `page_after(items, cursor, n)`: items are ids, newest first; return the next `n` ids smaller than `cursor` (or the first `n` when `cursor` is None).',
        solution: `def page_after(items, cursor, n):
    if cursor is None:
        return items[:n]
    rest = [i for i in items
            if i < cursor]
    return rest[:n]`,
        tests: [
          'ids = [9, 8, 7, 6, 5]',
          'assert page_after(ids, None, 2) == [9, 8], "first page"',
          'assert page_after(ids, 8, 2) == [7, 6], f"got {page_after(ids, 8, 2)}"',
          'assert page_after(ids, 5, 2) == [], "end of the list"',
        ].join('\n'),
        maxLines: 5,
        placeholder: 'def page_after(items, cursor, n):',
        explain: 'In SQL: WHERE id < :cursor ORDER BY id DESC LIMIT :n.',
      },
      {
        id: 's9-2-7',
        type: 'mcq',
        prompt: 'Why make the cursor an opaque token instead of a raw id?',
        options: [
          { text: 'You can change what it encodes' },
          { text: 'Tokens are faster to send', why: 'Size hardly matters; flexibility does.' },
          { text: 'Ids are secret', why: 'Ids are often visible anyway.' },
        ],
        answer: 0,
        explain: 'Later it may hold a timestamp and an id; clients do not need to know.',
      },
      {
        id: 's9-2-8',
        type: 'fill-blank',
        prompt: 'The next cursor is the last item of this page.',
        code: `page = [42, 41, 40]
next_cursor = page[___]
print(next_cursor)`,
        answer: ['-1'],
        distractors: [{ text: '0', why: 'That is the newest item: the next page would repeat this one.' }],
        expectOutput: '40',
        explain: 'Continue after the last item seen.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's9-03',
    title: 'Versioning',
    summary: 'Add without breaking; when you must break, publish a new version and retire the old one slowly.',
    card: {
      title: 'Versioning',
      text: 'Once clients depend on an API, changing it can break apps you do not control and cannot update. Adding an optional field or a new endpoint is safe; removing, renaming or changing the meaning of a field breaks clients. For breaking changes, publish a new version (/v2/ or a header), run both, and retire the old one after a long announced period.',
    },
    exercises: [
      {
        id: 's9-3-1',
        type: 'bucket-sort',
        prompt: 'Safe change, or breaking?',
        buckets: ['Safe', 'Breaking'],
        items: [
          { text: 'Add an optional "nickname" field', bucket: 0, why: 'Old clients ignore it.' },
          { text: 'Rename "name" to "full_name"', bucket: 1, why: 'Old clients find no "name".' },
          { text: 'Add a new endpoint', bucket: 0, why: 'Nobody calls it yet.' },
          { text: 'Make an optional input required', bucket: 1, why: 'Old requests now fail.' },
          { text: 'Change "price" from euros to cents', bucket: 1, why: 'Same name, new meaning: silently wrong.' },
        ],
        explain: 'Adding is safe; removing, renaming and redefining are not.',
      },
      {
        id: 's9-3-2',
        type: 'predict-output',
        prompt: 'An old client reads a response that gained a field. What does it print?',
        code: `resp = {"id": 7, "name": "Ann",
        "nickname": "A"}   # new
def old_client(r):
    return f"{r['id']}: {r['name']}"

print(old_client(resp))`,
        answer: '7: Ann',
        typedWrong: [{ answer: '7: A', why: 'The old client never reads "nickname".' }],
        explain: 'Clients should ignore fields they do not know.',
      },
      {
        id: 's9-3-3',
        type: 'scenario',
        prompt: 'Prices must change from euros to cents. Thousands of apps use the API. How?',
        situation: 'Some partner apps update once a year.',
        needs: ['No partner app breaks without warning'],
        options: [
          {
            text: 'Add v2 with cents; keep v1 for a year',
            cost: 'Two versions to run and test.',
          },
          {
            text: 'Change the field in place today',
            cost: 'One version to run.',
            why: 'Every app that has not updated now shows prices 100 times too high.',
          },
        ],
        answer: 0,
        explain: 'Or add a new "price_cents" field and keep "price": also non-breaking.',
      },
      {
        id: 's9-3-4',
        type: 'order-steps',
        prompt: 'Retiring v1. Put the steps in order.',
        steps: [
          'Release v2 alongside v1',
          'Announce v1\'s end date',
          'Measure which clients still call v1',
          'Contact the remaining clients',
          'Switch v1 off on the announced date',
        ],
        explain: 'Measure before you switch anything off.',
      },
      {
        id: 's9-3-5',
        type: 'mcq',
        prompt: 'A client sends a field the server does not know. What should the server usually do?',
        options: [
          { text: 'Ignore it' },
          { text: 'Crash', why: 'Never: one odd request should not take the service down.' },
          { text: 'Store it unchecked', why: 'Unknown input should not be trusted or kept.' },
        ],
        answer: 0,
        explain: 'Tolerant readers make evolving both sides easier (rejecting with a 400 is the strict alternative).',
      },
      {
        id: 's9-3-6',
        type: 'mcq',
        prompt: 'Why is a mobile app harder to keep compatible than a website?',
        options: [
          { text: 'Old app versions stay installed' },
          { text: 'Phones cannot read JSON', why: 'They read it fine.' },
          { text: 'Mobile networks are slower', why: 'Speed is not the compatibility problem.' },
        ],
        answer: 0,
        explain: 'A website updates on reload; some phones run a two-year-old app.',
      },
      {
        id: 's9-3-7',
        type: 'predict-output',
        prompt: 'Requests are routed by the version in the path. What does this print?',
        code: `def handle(path):
    version = path.split("/")[1]
    if version == "v2":
        return {"price_cents": 1999}
    return {"price": 19.99}

print(handle("/v1/item/3"))`,
        answer: "{'price': 19.99}",
        typedWrong: [{ answer: "{'price_cents': 1999}", why: 'The path says v1.' }],
        explain: 'Old clients keep the old shape until they move.',
      },
      {
        id: 's9-3-8',
        type: 'fill-blank',
        prompt: 'A tolerant reader uses a default when an optional field is missing.',
        code: `resp = {"id": 7}
nick = resp.___("nickname", "-")
print(nick)`,
        answer: ['get'],
        distractors: [{ text: 'items', why: '`items` takes no arguments: it lists every pair.' }],
        expectOutput: '-',
        explain: 'Missing optional fields should never crash a client.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's9-04',
    title: 'Idempotency keys',
    summary: 'The client sends a unique key with a POST; the server stores the first result and replays it for repeats.',
    card: {
      title: 'Idempotency keys',
      text: 'A client that times out on POST /payments cannot tell whether the payment happened, so it needs to retry safely. It sends a unique key with the request (often an Idempotency-Key header) and reuses it on every retry. The server stores the key with the first result and, for a repeat, returns that stored result instead of doing the work again.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'App' },
          { id: 's', kind: 'service', label: 'Payments' },
          { id: 'k', kind: 'db', label: 'Keys' },
          { id: 'p', kind: 'api', label: 'Card network' },
        ],
        edges: [
          { from: 'c', to: 's', label: 'key' },
          { from: 's', to: 'k', label: 'seen?' },
          { from: 's', to: 'p', label: 'once' },
        ],
      },
    },
    exercises: [
      {
        id: 's9-4-1',
        type: 'predict-output',
        prompt: 'The app retries with the same key. How many charges are made?',
        code: `results, charges = {}, []
def pay(key, amount):
    if key in results:
        return results[key]
    charges.append(amount)
    results[key] = f"paid {amount}"
    return results[key]

pay("k1", 50)
print(pay("k1", 50), len(charges))`,
        answer: 'paid 50 1',
        typedWrong: [{ answer: 'paid 50 2', why: 'The retry returns the stored result.' }],
        explain: 'Same key: same answer, no second charge.',
      },
      {
        id: 's9-4-2',
        type: 'mcq',
        prompt: 'Who creates the idempotency key?',
        options: [
          { text: 'The client, before trying' },
          { text: 'The server, in its reply', why: 'If the reply is lost, the client never learns it.' },
          { text: 'A new one on every retry', why: 'Then every retry looks like a new payment.' },
        ],
        answer: 0,
        explain: 'A random UUID per operation, reused for all its retries.',
      },
      {
        id: 's9-4-3',
        type: 'order-steps',
        prompt: 'A payment with a key, a timeout and a retry. Put it in order.',
        steps: [
          'The app makes a key for this payment',
          'It sends POST /payments with the key',
          'The server charges and stores key → result',
          'The reply is lost; the app times out',
          'The app retries with the same key',
          'The server finds the key and returns the stored result',
        ],
        explain: 'The customer is charged once and the app gets its answer.',
      },
      {
        id: 's9-4-4',
        type: 'scenario',
        prompt: 'Two retries with the same key arrive at the same moment, before either finishes. What must the server do?',
        situation: 'Both see "key not found" if they just check and then act.',
        needs: ['Exactly one charge'],
        options: [
          {
            text: 'Claim the key atomically first',
            cost: 'A unique constraint or lock on the key.',
          },
          {
            text: 'Check the key, then charge',
            cost: 'Nothing extra.',
            why: 'Both checks pass before either stores the key: two charges.',
          },
        ],
        answer: 0,
        explain: 'Insert the key first (unique); the loser waits or gets "in progress" (409).',
      },
      {
        id: 's9-4-5',
        type: 'mcq',
        prompt: 'The same key arrives with a different amount. What should the server do?',
        options: [
          { text: 'Reject it as a misuse' },
          { text: 'Charge the new amount', why: 'The key promised "the same request".' },
          { text: 'Return a success silently', why: 'The client thinks the new amount was charged.' },
        ],
        answer: 0,
        explain: 'Store a fingerprint of the request with the key and compare.',
      },
      {
        id: 's9-4-6',
        type: 'bucket-sort',
        prompt: 'Does this request need an idempotency key?',
        buckets: ['Needs a key', 'Already safe'],
        items: [
          { text: 'POST /payments', bucket: 0, why: 'A repeat pays twice.' },
          { text: 'GET /orders/7', bucket: 1, why: 'Reads are safe.' },
          { text: 'POST /orders', bucket: 0, why: 'A repeat orders twice.' },
          { text: 'PUT /users/9 (full replace)', bucket: 1, why: 'Same body, same result.' },
          { text: 'POST /emails/send', bucket: 0, why: 'A repeat sends twice.' },
        ],
        explain: 'Keys make unsafe POSTs retryable.',
      },
      {
        id: 's9-4-7',
        type: 'estimate',
        prompt: 'Keys are kept for a day. 50 payments a second, 1 KB stored per key. How much storage?',
        expr: '50 * DAY * KB / GB',
        answer: 4.32,
        tolerance: 1.5,
        unit: 'GB',
        options: [
          { value: 0.0432, why: '50 × 86,400 = 4.3 million keys.' },
          { value: 4.32 },
          { value: 432, why: '4.3 million × 1 KB = 4.3 GB.' },
        ],
        work: ['50 × 86,400 = 4.32 million keys', '× 1 KB = 4.32 GB'],
        explain: 'Small: keep keys for a day or so, then expire them.',
      },
      {
        id: 's9-4-8',
        type: 'fill-blank',
        prompt: 'Replay the stored result for a known key.',
        code: `stored = {"k1": "paid 50"}
def pay(key):
    if key in stored:
        return stored[___]
    return "charged"

print(pay("k1"), pay("k2"))`,
        answer: ['key'],
        distractors: [{ text: '"k2"', why: 'That looks up a key that was never stored.' }],
        expectOutput: 'paid 50 charged',
        explain: 'Known key: replay. New key: do the work.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's9-05',
    title: 'Rate limits: windows',
    summary: 'Count requests per client per window; fixed windows let a double burst through at the boundary, sliding windows do not.',
    card: {
      title: 'Rate limits: windows',
      text: 'A rate limiter caps how many requests each client (user, API key or IP) may make per time window, and answers 429 Too Many Requests beyond it. A fixed window counts per clock second or minute: cheap, but a client can send the full limit just before a boundary and again just after, twice the limit in one second. A sliding window counts over the last second at every request, which prevents that at a little more cost.',
      figure: { kind: 'limiter', times: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4], algorithm: 'fixed', algorithms: ['fixed', 'sliding'], limit: 5 },
    },
    exercises: [
      {
        id: 's9-5-1',
        type: 'figure',
        prompt: 'The limit is 5 a second, yet 10 get through between 0.5 s and 1.5 s. Pick the algorithm that stops it.',
        figure: { kind: 'limiter', times: [0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4], algorithm: 'fixed', algorithms: ['fixed', 'sliding'], limit: 5, goal: { maxPerSecond: 5 } },
        explain: 'The sliding window looks back one second from each request, whatever the clock says.',
      },
      {
        id: 's9-5-2',
        type: 'predict-output',
        prompt: 'A fixed-window counter, limit 3 per second. What does this print?',
        code: `counts = {}
def allow(t, limit=3):
    w = int(t)
    counts[w] = counts.get(w, 0) + 1
    return counts[w] <= limit

ts = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2]
print(sum(allow(t) for t in ts))`,
        answer: '6',
        typedWrong: [{ answer: '3', why: 'Three in second 0 and three in second 1: all six pass.' }],
        explain: 'Six requests in half a second, all allowed: the boundary burst.',
      },
      {
        id: 's9-5-3',
        type: 'mcq',
        prompt: 'What should a limited client receive?',
        options: [
          { text: '429 with Retry-After' },
          { text: '500 Internal Error', why: 'Nothing broke: the client sent too much.' },
          { text: '200 with no data', why: 'The client cannot tell it was limited.' },
        ],
        answer: 0,
        explain: 'Retry-After tells a well-behaved client how long to wait.',
      },
      {
        id: 's9-5-4',
        type: 'bucket-sort',
        prompt: 'Limit by what?',
        buckets: ['API key', 'IP address'],
        items: [
          { text: 'A paid API with plans per customer', bucket: 0, why: 'Limits follow what the customer pays for.' },
          { text: 'A login form before anyone signs in', bucket: 1, why: 'No key yet; slow down password guessing per IP.' },
          { text: 'Partner apps with their own quotas', bucket: 0, why: 'Each partner has a key.' },
          { text: 'An anonymous signup page', bucket: 1, why: 'The only thing known is the address.' },
          { text: 'Fair use between logged-in tenants', bucket: 0, why: 'Per account, not per network.' },
        ],
        explain: 'IPs are shared (offices, mobile carriers), so prefer identities when you have them.',
      },
      {
        id: 's9-5-5',
        type: 'scenario',
        prompt: 'The API runs on 10 servers behind a balancer. Each keeps its own counter. A key\'s limit is 100 a minute. What goes wrong?',
        situation: 'Requests are spread evenly across the servers.',
        needs: ['The limit holds across all servers'],
        options: [
          {
            text: 'Keep counters in a shared store',
            cost: 'A fast round trip (e.g. to Redis) per request.',
          },
          {
            text: 'Keep local counters on each',
            cost: 'No extra calls.',
            why: 'Each server allows 100: up to 1,000 a minute in total.',
          },
        ],
        answer: 0,
        explain: 'Or give each server 1/10 of the limit and accept some unevenness.',
      },
      {
        id: 's9-5-6',
        type: 'estimate',
        prompt: 'A shared counter store holds one 100-byte counter per active key per window. 2 million active keys. How much memory?',
        expr: '2e6 * 100 / MB',
        answer: 200,
        tolerance: 1.5,
        unit: 'MB',
        options: [
          { value: 2, why: '2 million × 100 bytes = 200 million bytes.' },
          { value: 200 },
          { value: 20000, why: '200 million bytes is 200 MB, not 20 GB.' },
        ],
        work: ['2,000,000 × 100 B = 200,000,000 B', '= 200 MB'],
        explain: 'Fits easily in one in-memory store.',
      },
      {
        id: 's9-5-7',
        type: 'mcq',
        prompt: 'A sliding log keeps every request\'s timestamp for the last window. What is its cost?',
        options: [
          { text: 'Memory grows with the limit' },
          { text: 'It lets bursts through', why: 'It is exact: no boundary burst.' },
          { text: 'It needs synchronized clocks', why: 'One store\'s clock is enough.' },
        ],
        answer: 0,
        explain: 'A limit of 10,000 a minute stores 10,000 timestamps per key; counters approximate it cheaply.',
      },
      {
        id: 's9-5-8',
        type: 'fill-blank',
        prompt: 'A sliding window: count allowed requests in the last second.',
        code: `log = [0.2, 0.5, 0.9]
def allow(t, limit=3):
    recent = [x for x in log
              if t - x < ___]
    return len(recent) < limit

print(allow(1.1), allow(1.6))`,
        answer: ['1'],
        distractors: [{ text: '10', why: 'That looks back ten seconds: everything counts.' }],
        expectOutput: 'False True',
        explain: 'At 1.1 s, 0.2 s is still inside the last second; at 1.6 s, only 0.9 is.',
      },
    ],
  },
];

export const s9: Unit = {
  id: 'S9',
  track: 'system-design',
  title: 'APIs and service boundaries',
  blurb: 'REST, gRPC and GraphQL, pagination, versioning, idempotency keys, rate-limiting algorithms, the API gateway, monolith versus microservices and service discovery.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s9More],
  labs: s9Labs,
  library: s9Library,
};
