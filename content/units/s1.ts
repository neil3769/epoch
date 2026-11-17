import { NUMBERS_PY } from '../numbers';
import { s1Labs } from '../labs/s1';
import { s1Library } from '../library/s1';
import type { Lesson, Unit } from '../schema';
import { s1More } from './s1-more';

/*
 * S1 How a request travels. Lessons 1-5 here: client and server, DNS,
 * connections (TCP and TLS), HTTP methods, status codes. Lessons 6-9 in
 * s1-more.ts: latency and throughput, percentiles, processes and threads,
 * checkpoint. The prelude holds the Numbers page values (DAY, MB,
 * WORLD_ROUND_TRIP, ...) so code can use the same names as the estimates.
 */
export const SD_PRELUDE = NUMBERS_PY + '\nimport numpy as np';

const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's1-01',
    title: 'Client and server',
    summary: 'A client sends a request; a server does the work, often asking other servers, and responds.',
    card: {
      title: 'Client and server',
      text: 'A client, such as your browser or a phone app, sends a request; a server, a program running on a computer elsewhere, does the work and sends back a response. The server often asks other servers in turn, such as a database. Every design in this track is a picture of who asks whom.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Browser' },
          { id: 's', kind: 'service', label: 'App server' },
          { id: 'd', kind: 'db', label: 'Database' },
        ],
        edges: [
          { from: 'c', to: 's', label: 'request' },
          { from: 's', to: 'd', label: 'query' },
        ],
      },
    },
    exercises: [
      {
        id: 's1-1-1',
        type: 'diagram',
        prompt: 'Which box keeps the data safe when the app server restarts?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Browser' },
            { id: 's', kind: 'service', label: 'App server' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'c', to: 's' },
            { from: 's', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'd',
          why: {
            c: 'The browser belongs to one user and can be closed or cleared at any time.',
            s: 'The app server\'s memory is wiped when it restarts; it should hold nothing that must last.',
          },
        },
        explain: 'Servers come and go; the database is where lasting data lives.',
      },
      {
        id: 's1-1-2',
        type: 'bucket-sort',
        prompt: 'Who does each job in an online shop?',
        buckets: ['Client', 'Server'],
        items: [
          { text: 'Draw the product page on screen', bucket: 0, why: 'Drawing happens on the user\'s device.' },
          { text: 'Check the password is right', bucket: 1, why: 'Only the server can be trusted with the stored password check.' },
          { text: 'Store the order', bucket: 1, why: 'Orders must outlive the user\'s device: the server writes them to the database.' },
          { text: 'Remember where you scrolled to', bucket: 0, why: 'A per-screen detail: the device keeps it.' },
          { text: 'Send the receipt email', bucket: 1, why: 'The server holds the mail credentials and the order record.' },
          { text: 'Play the product video', bucket: 0, why: 'The device decodes and shows it; servers only send the bytes.' },
        ],
        explain: 'Anything that must be trusted or must last belongs on the server.',
      },
      {
        id: 's1-1-3',
        type: 'mcq',
        prompt: 'Why does the browser not talk to the database directly?',
        options: [
          { text: 'Anyone could then read or change all of it' },
          { text: 'Browsers cannot send network requests', why: 'They can; the problem is trust.' },
          { text: 'Databases only accept Python', why: 'Databases speak their own protocols, not a language.' },
        ],
        answer: 0,
        explain: 'The server checks who is asking and what they may do before touching the data.',
      },
      {
        id: 's1-1-4',
        type: 'predict-output',
        prompt: 'A server as a function. What does this print?',
        code: `def server(req):
    if req["path"] == "/hello":
        return {"status": 200,
                "body": "hi"}
    return {"status": 404, "body": ""}

r = server({"path": "/bye"})
print(r["status"])`,
        answer: '404',
        typedWrong: [{ answer: '200', why: 'The path is /bye, not /hello.' }],
        explain: 'Request in, response out: every server, however large, has this shape.',
      },
      {
        id: 's1-1-5',
        type: 'order-steps',
        prompt: 'A user taps "Buy". Put what happens in order.',
        steps: [
          'The app sends a request to the server',
          'The server checks the basket and the payment',
          'The server writes the order to the database',
          'The server sends back a response',
          'The app shows "Order placed"',
        ],
        explain: 'The response goes back only after the order is safely stored.',
      },
      {
        id: 's1-1-6',
        type: 'diagram',
        prompt: 'Tap the boxes a "show my orders" request passes through, in order.',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Phone app' },
            { id: 's', kind: 'service', label: 'App server' },
            { id: 'd', kind: 'db', label: 'Database' },
            { id: 'm', kind: 'api', label: 'Email API' },
          ],
          edges: [
            { from: 'c', to: 's' },
            { from: 's', to: 'd' },
            { from: 's', to: 'm', dashed: true },
          ],
        },
        goal: { kind: 'path', answer: ['c', 's', 'd'] },
        explain: 'Reading orders needs the database, not the email service.',
      },
      {
        id: 's1-1-7',
        type: 'scenario',
        prompt: 'Where should the data live?',
        situation: 'You are building a personal to-do list app for one phone.',
        needs: ['Works with no internet', 'Nothing is shared with anyone', 'No accounts'],
        options: [
          {
            text: 'Keep the list on the phone',
            cost: 'If the phone is lost, so is the list; no sync to other devices.',
          },
          {
            text: 'Run a server and a database',
            cost: 'Hosting, accounts and privacy work, and it fails offline.',
            why: 'Nothing needs sharing, and the app must work with no internet.',
          },
          {
            text: 'Store it in browser cookies',
            cost: 'About 4 KB per cookie, sent with every request.',
            why: 'Cookies are tiny and travel to servers; local storage on the device fits better.',
          },
        ],
        answer: 0,
        explain: 'A server earns its cost when data must be shared, trusted or kept beyond one device.',
      },
      {
        id: 's1-1-8',
        type: 'mcq',
        prompt: 'In this track, what is a "server"?',
        options: [
          { text: 'A program that answers requests' },
          { text: 'A big computer in a data centre', why: 'One machine can run many server programs, and a laptop can run one.' },
          { text: 'Anything with a database', why: 'A server may use no database at all.' },
        ],
        answer: 0,
        explain: 'It is a role: whoever answers is the server for that request.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's1-02',
    title: 'DNS: names to addresses',
    summary: 'DNS turns a name into an IP address; resolvers cache answers for as long as the TTL says.',
    card: {
      title: 'DNS: names to addresses',
      text: 'Computers reach each other by IP address, but people type names like shop.example. DNS turns a name into an address: your device asks a resolver, which asks the name\'s own servers and caches the answer for as long as its TTL (time to live) says. A cached answer is nearly free; an uncached one costs round trips.',
      diagram: {
        nodes: [
          { id: 'c', kind: 'client', label: 'Browser' },
          { id: 'n', kind: 'dns', label: 'Resolver' },
          { id: 's', kind: 'service', label: 'Web server' },
        ],
        edges: [
          { from: 'c', to: 'n', label: '1 name?' },
          { from: 'c', to: 's', label: '2 fetch' },
        ],
      },
    },
    exercises: [
      {
        id: 's1-2-1',
        type: 'order-steps',
        prompt: 'A first visit to shop.example, nothing cached. Put the lookup in order.',
        steps: [
          'The device asks its resolver for shop.example',
          'The resolver asks a root server who handles .example',
          'The resolver asks the .example servers who handles shop.example',
          'The resolver asks shop.example\'s own name server for the address',
          'The resolver caches the answer and returns it',
        ],
        explain: 'From the top of the tree down; next time the cached answer skips all of it.',
      },
      {
        id: 's1-2-2',
        type: 'predict-output',
        prompt: 'A cache with a 300-second TTL. What does this print?',
        code: `cache = {}

def lookup(name, now):
    hit = cache.get(name)
    if hit and hit[1] > now:
        return "cache"
    exp = now + 300
    cache[name] = ("1.2.3.4", exp)
    return "asked"

lookup("shop.example", 0)
print(lookup("shop.example", 100),
      lookup("shop.example", 400))`,
        answer: 'cache asked',
        options: [
          { text: 'cache asked' },
          { text: 'cache cache', why: 'At 400 s the entry stored at 0 s has expired (TTL 300).' },
          { text: 'asked asked', why: 'At 100 s the answer from 0 s is still fresh.' },
        ],
        explain: 'Fresh until the TTL runs out, then asked again.',
      },
      {
        id: 's1-2-3',
        type: 'mcq',
        prompt: 'You moved your site to a new server and updated DNS. The record\'s TTL is one day. Why do some users still reach the old server hours later?',
        options: [
          { text: 'Their resolvers cached the old address' },
          { text: 'DNS updates take a week to spread', why: 'There is no fixed delay: each cache keeps the answer until its TTL ends.' },
          { text: 'The old server is redirecting them', why: 'Nothing redirects; they are given the old address from a cache.' },
        ],
        answer: 0,
        explain: 'Caches may keep the old answer for up to the TTL.',
      },
      {
        id: 's1-2-4',
        type: 'scenario',
        prompt: 'How do you prepare the move?',
        situation: 'Next Tuesday you move the site to a new server. The DNS record\'s TTL is one day.',
        needs: ['Almost all users on the new server within minutes of the switch', 'No errors for anyone'],
        options: [
          {
            text: 'Lower the TTL to 5 minutes days ahead',
            cost: 'More DNS lookups for a while, slightly slower first loads.',
          },
          {
            text: 'Keep the one-day TTL',
            cost: 'Some users reach the old server for up to a day.',
            why: 'That breaks the "within minutes" need.',
          },
          {
            text: 'Switch off the old server at once',
            cost: 'Users with a cached old address get errors until the TTL ends.',
            why: 'That breaks the "no errors" need.',
          },
        ],
        answer: 0,
        explain: 'Lower the TTL at least one old TTL in advance, switch, keep the old server up briefly, then raise the TTL again.',
      },
      {
        id: 's1-2-5',
        type: 'diagram',
        prompt: 'Which box answers "what is the address of shop.example?"',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Browser' },
            { id: 'n', kind: 'dns', label: 'Resolver' },
            { id: 's', kind: 'service', label: 'Web server' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'c', to: 'n' },
            { from: 'c', to: 's' },
            { from: 's', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'n',
          why: {
            c: 'The browser is the one asking.',
            s: 'The browser cannot reach the web server until it knows the address.',
            d: 'The database sits behind the web server and knows nothing about names.',
          },
        },
        explain: 'DNS comes before the request itself.',
      },
      {
        id: 's1-2-6',
        type: 'estimate',
        prompt: 'A page loads files from 4 different domains. Each uncached lookup takes 50 ms and they happen one after another. How long is spent on DNS?',
        expr: '4 * 50',
        answer: 200,
        tolerance: 1.5,
        unit: 'ms',
        options: [
          { value: 50, why: 'That is one lookup; there are four domains.' },
          { value: 200 },
          { value: 2000, why: 'Four lookups of 50 ms is 200 ms, not 2 seconds.' },
        ],
        work: ['4 lookups × 50 ms = 200 ms', 'Fewer domains, or cached answers, remove most of it.'],
        explain: 'Every extra domain on a page can cost a lookup.',
      },
      {
        id: 's1-2-7',
        type: 'fill-blank',
        prompt: 'An entry is fresh while its expiry time is still ahead.',
        code: `cache = {"a.com": ("1.2.3.4", 300)}

def fresh(name, now):
    hit = cache.get(name)
    ok = hit and hit[1] ___ now
    return bool(ok)

print(fresh("a.com", 100),
      fresh("a.com", 500))`,
        answer: ['>'],
        distractors: [{ text: '<', why: 'That calls an entry fresh only after it has expired.' }],
        expectOutput: 'True False',
        explain: 'Expiry 300: fresh at 100, stale at 500.',
      },
      {
        id: 's1-2-8',
        type: 'mcq',
        prompt: 'Why do resolvers cache DNS answers at all?',
        options: [
          { text: 'Uncached lookups cost round trips' },
          { text: 'Name servers forget addresses', why: 'They keep their records; caching saves trips to them.' },
          { text: 'It is required for HTTPS', why: 'HTTPS works the same with or without a cache.' },
        ],
        answer: 0,
        explain: 'Most lookups are answered from a cache close by.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's1-03',
    title: 'Connections cost round trips',
    summary: 'A new connection needs a TCP and a TLS round trip before the request; reusing one skips both.',
    card: {
      title: 'Connections cost round trips',
      text: 'Before the first byte of a request, the client opens a TCP connection (one round trip) and sets up encryption with TLS (one more round trip in TLS 1.3, two in TLS 1.2). Only then does the request go, costing another round trip. Reusing an open connection skips the setup, which is why far-away users feel every new connection.',
      code: `trips = 1 + 1 + 1  # TCP, TLS, request
ms = trips * WORLD_ROUND_TRIP * 1000
print(round(ms))`,
      output: '450',
    },
    exercises: [
      {
        id: 's1-3-1',
        type: 'estimate',
        prompt: 'A user on the far side of the world opens a new HTTPS connection (TLS 1.3) and sends one request. Roughly how long until the response starts?',
        expr: '3 * WORLD_ROUND_TRIP * 1000',
        answer: 450,
        tolerance: 2,
        unit: 'ms',
        options: [
          { value: 45, why: 'A round trip across the world alone is about 150 ms.' },
          { value: 450 },
          { value: 4500, why: 'Three round trips of 150 ms is under half a second.' },
        ],
        work: ['TCP 1 + TLS 1 + request 1 = 3 round trips', '3 × 150 ms = 450 ms (Numbers page: world round trip)'],
        explain: 'Before the server has done any work at all.',
      },
      {
        id: 's1-3-2',
        type: 'estimate',
        prompt: 'The same user sends a second request on the connection that is already open. How long until the response starts?',
        expr: 'WORLD_ROUND_TRIP * 1000',
        answer: 150,
        tolerance: 1.5,
        unit: 'ms',
        work: ['The connection exists: only the request\'s own round trip', '1 × 150 ms = 150 ms'],
        explain: 'Reuse cuts the wait to a third.',
      },
      {
        id: 's1-3-3',
        type: 'order-steps',
        prompt: 'A first HTTPS request to a new site. Put the steps in order.',
        steps: [
          'Look up the address with DNS',
          'Open a TCP connection',
          'Set up encryption with TLS',
          'Send the HTTP request',
          'Receive the response',
        ],
        explain: 'Each of the middle three costs at least one round trip.',
      },
      {
        id: 's1-3-4',
        type: 'mcq',
        prompt: 'Why do browsers keep connections open after a response?',
        options: [
          { text: 'To skip the setup round trips next time' },
          { text: 'To keep the server\'s memory warm', why: 'It is about the network handshakes, not memory.' },
          { text: 'Because closing one is slow', why: 'Closing is cheap; opening is what costs round trips.' },
        ],
        answer: 0,
        explain: 'HTTP keep-alive and HTTP/2 reuse one connection for many requests.',
      },
      {
        id: 's1-3-5',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def first_byte(rtt, reuse):
    trips = 1 if reuse else 3
    return trips * rtt

print(first_byte(150, False),
      first_byte(150, True))`,
        answer: '450 150',
        typedWrong: [{ answer: '150 450', why: 'reuse=False is the new connection: 3 trips.' }],
        explain: 'Setup triples the wait for a far-away user.',
      },
      {
        id: 's1-3-6',
        type: 'scenario',
        prompt: 'Pages feel slow for users in Australia. What do you change first?',
        situation: 'Your servers are in Europe. Australian users wait over a second for the first page; the server itself answers in 50 ms.',
        needs: ['Faster first load for Australian users', 'No rewrite of the app'],
        options: [
          {
            text: 'Use edge servers near users',
            cost: 'Another provider (a CDN), certificates at the edge.',
          },
          {
            text: 'Buy faster servers in Europe',
            cost: 'More money every month.',
            why: 'The server takes 50 ms; the wait is round trips across the world.',
          },
          {
            text: 'Compress the responses more',
            cost: 'A little CPU on both ends.',
            why: 'That saves bytes, not handshake round trips.',
          },
        ],
        answer: 0,
        explain: 'The handshakes then cross a short distance; only the request travels to Europe, over a connection the edge keeps open.',
      },
      {
        id: 's1-3-7',
        type: 'diagram',
        prompt: 'TLS now ends at an edge server near the user. Tap the path of a request, in order.',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Phone' },
            { id: 'e', kind: 'cdn', label: 'Edge' },
            { id: 's', kind: 'service', label: 'App server' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'c', to: 'e', label: 'TLS' },
            { from: 'e', to: 's', label: 'kept' },
            { from: 's', to: 'd' },
          ],
        },
        goal: { kind: 'path', answer: ['c', 'e', 's', 'd'] },
        explain: 'The phone\'s handshakes go only as far as the edge.',
      },
      {
        id: 's1-3-8',
        type: 'mcq',
        prompt: 'What does moving from TLS 1.2 to TLS 1.3 save?',
        options: [
          { text: 'A round trip per new connection' },
          { text: 'Half the bytes of every response', why: 'Response size is unchanged; the handshake is shorter.' },
          { text: 'The TCP handshake', why: 'TCP still connects first; TLS 1.3 needs one round trip instead of two.' },
        ],
        answer: 0,
        explain: 'On a 150 ms path that is 150 ms off every new connection.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's1-04',
    title: 'HTTP methods',
    summary: 'GET reads and is safe; GET, PUT and DELETE are idempotent; POST is neither.',
    card: {
      title: 'HTTP methods',
      text: 'A request names a method: GET reads, POST creates or triggers something, PUT replaces, PATCH changes part, DELETE removes. GET must change nothing (it is safe), and GET, PUT and DELETE are idempotent: sending one twice leaves the same result as sending it once. That matters because networks fail and clients retry.',
    },
    exercises: [
      {
        id: 's1-4-1',
        type: 'bucket-sort',
        prompt: 'Is it safe to send each request twice?',
        buckets: ['Same as once', 'Changes more'],
        items: [
          { text: 'GET /orders/7', bucket: 0, why: 'Reading twice changes nothing.' },
          { text: 'PUT /users/3 with a name', bucket: 0, why: 'Setting the same name twice leaves the same name.' },
          { text: 'DELETE /carts/9', bucket: 0, why: 'Deleted once or twice, the cart is gone (the second may say 404).' },
          { text: 'POST /orders', bucket: 1, why: 'Each POST creates another order.' },
          { text: 'POST /payments', bucket: 1, why: 'Each one charges again unless the server deduplicates.' },
          { text: 'PATCH /counter with "add 1"', bucket: 1, why: 'Adding 1 twice adds 2.' },
        ],
        explain: 'Idempotent requests can be retried blindly; the others need care.',
      },
      {
        id: 's1-4-2',
        type: 'mcq',
        prompt: 'Which method creates a new order?',
        options: [
          { text: 'POST' },
          { text: 'GET', why: 'GET only reads.' },
          { text: 'DELETE', why: 'DELETE removes.' },
        ],
        answer: 0,
        explain: 'POST /orders: the server picks the new order\'s id.',
      },
      {
        id: 's1-4-3',
        type: 'predict-output',
        prompt: 'The first POST timed out, so the client sent it again. What does this print?',
        code: `orders = []

def post_order(item):
    orders.append(item)

for attempt in range(2):
    post_order("book")
print(len(orders))`,
        answer: '2',
        typedWrong: [{ answer: '1', why: 'The first request did arrive; only its response was lost.' }],
        explain: 'A timeout does not mean the request failed: it may have worked.',
      },
      {
        id: 's1-4-4',
        type: 'predict-output',
        prompt: 'The same retry with PUT. What does this print?',
        code: `users = {}

def put_user(uid, name):
    users[uid] = name

put_user(3, "Ada")
put_user(3, "Ada")
print(len(users), users[3])`,
        answer: '1 Ada',
        typedWrong: [{ answer: '2 Ada', why: 'The second PUT overwrites user 3 with the same value.' }],
        explain: 'Idempotent: safe to retry.',
      },
      {
        id: 's1-4-5',
        type: 'scenario',
        prompt: 'The "Pay" request sometimes times out, and the app retries. What do you do?',
        situation: 'A mobile app sends POST /payments. On a timeout it retries once automatically.',
        needs: ['Never charge a customer twice', 'Keep the automatic retry'],
        options: [
          {
            text: 'Add an idempotency key',
            cost: 'The server stores keys and checks each request against them.',
          },
          {
            text: 'Never retry payments',
            cost: 'Users see failures for payments that went through.',
            why: 'That drops the retry the needs keep.',
          },
          {
            text: 'Use GET for payments',
            cost: 'Caches and link previews may repeat it.',
            why: 'GET must not change anything; it makes double charges more likely.',
          },
        ],
        answer: 0,
        explain: 'The server remembers each key\'s result and returns it again for a repeat: unit S9 builds one.',
      },
      {
        id: 's1-4-6',
        type: 'diagram',
        prompt: 'Which box may answer a repeated GET without bothering the app server?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Browser' },
            { id: 'e', kind: 'cdn', label: 'CDN' },
            { id: 's', kind: 'service', label: 'App server' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'c', to: 'e' },
            { from: 'e', to: 's' },
            { from: 's', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'e',
          why: {
            c: 'The browser is the one asking (though it has its own cache too).',
            s: 'The point is to spare the app server.',
            d: 'The database is behind the app server.',
          },
        },
        explain: 'Because GET is safe, a cache in between may answer it: unit S4.',
      },
      {
        id: 's1-4-7',
        type: 'fill-blank',
        prompt: 'Only safe methods may be answered from a cache.',
        code: `safe = {"GET", "HEAD"}
writes = {"POST", "PUT"}

def may_cache(method):
    return method in ___

print(may_cache("GET"),
      may_cache("POST"))`,
        answer: ['safe'],
        distractors: [{ text: 'writes', why: 'Caching a write would skip the change itself.' }],
        expectOutput: 'True False',
        explain: 'HEAD is GET without the body.',
      },
      {
        id: 's1-4-8',
        type: 'mcq',
        prompt: 'Why must GET never change anything?',
        options: [
          { text: 'Caches may repeat it' },
          { text: 'GET cannot carry any data', why: 'It carries a URL and headers; the rule is about meaning.' },
          { text: 'Servers ignore its body', why: 'The rule exists because GETs get repeated and prefetched.' },
        ],
        answer: 0,
        explain: 'A "delete" link done with GET can be triggered by a link preview.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's1-05',
    title: 'Status codes',
    summary: '2xx worked, 3xx elsewhere, 4xx the request was wrong, 5xx the server failed; 429 and 503 mean later.',
    card: {
      title: 'Status codes',
      text: 'Every response starts with a three-digit status: 2xx worked, 3xx look elsewhere, 4xx the request was wrong, 5xx the server failed. The first digit says whose problem it is and whether retrying can help. 429 (too many requests) and 503 (unavailable) mean "try again later"; most other 4xx fail the same way again.',
      code: `def kind(code):
    return {2: "ok", 3: "redirect",
            4: "client", 5: "server"
            }[code // 100]

print(kind(201), kind(503))`,
      output: 'ok server',
    },
    exercises: [
      {
        id: 's1-5-1',
        type: 'match-pairs',
        prompt: 'Match each status to its meaning.',
        pairs: [
          { left: '200', right: 'OK', why: 'The request worked.' },
          { left: '301', right: 'moved for good', why: 'Use the new URL from now on.' },
          { left: '404', right: 'not found', why: 'No such thing at that URL.' },
          { left: '429', right: 'too many requests', why: 'Slow down and try later.' },
          { left: '503', right: 'unavailable', why: 'The server cannot serve right now.' },
        ],
        explain: 'Learn the first digit; look up the rest.',
      },
      {
        id: 's1-5-2',
        type: 'bucket-sort',
        prompt: 'Retry later, or fix the request?',
        buckets: ['Retry later', 'Fix request'],
        items: [
          { text: '429 Too Many Requests', bucket: 0, why: 'A limit was hit; it resets with time.' },
          { text: '503 Service Unavailable', bucket: 0, why: 'Overloaded or restarting: often fine soon.' },
          { text: '504 Gateway Timeout', bucket: 0, why: 'Something upstream was slow; the next try may be fast.' },
          { text: '400 Bad Request', bucket: 1, why: 'The same malformed request fails again.' },
          { text: '404 Not Found', bucket: 1, why: 'It will not appear by retrying.' },
          { text: '422 Unprocessable', bucket: 1, why: 'The data failed validation; send different data.' },
        ],
        explain: 'Retrying a 4xx (other than 429) only adds load.',
      },
      {
        id: 's1-5-3',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `def kind(code):
    return {2: "ok", 3: "redirect",
            4: "client", 5: "server"
            }[code // 100]

print(kind(404), kind(301))`,
        answer: 'client redirect',
        typedWrong: [{ answer: 'server redirect', why: '404 starts with 4: the client asked for something missing.' }],
        explain: 'Integer division by 100 keeps the first digit.',
      },
      {
        id: 's1-5-4',
        type: 'scenario',
        prompt: 'An API answers 429 with "Retry-After: 30". What does your client do?',
        situation: 'Your nightly job calls a partner\'s API and has just received 429 Too Many Requests, Retry-After: 30.',
        needs: ['Get the data tonight', 'Do not make the partner\'s overload worse'],
        options: [
          {
            text: 'Wait 30 seconds, then retry',
            cost: 'The job runs a little longer.',
          },
          {
            text: 'Retry at once in a loop',
            cost: 'Many wasted calls, each answered 429.',
            why: 'It adds load and keeps hitting the limit.',
          },
          {
            text: 'Stop and report a failure',
            cost: 'Tonight\'s data is missing.',
            why: 'The server said when it would work again; giving up loses the data for nothing.',
          },
        ],
        answer: 0,
        explain: 'Retry-After says exactly how long to wait.',
      },
      {
        id: 's1-5-5',
        type: 'mcq',
        prompt: 'A login with the wrong password. Which status fits?',
        options: [
          { text: '401 Unauthorized' },
          { text: '500 Internal Server Error', why: 'Nothing failed on the server; the credentials were wrong.' },
          { text: '200 OK with "wrong password"', why: 'Clients, logs and monitors read the status, so it should say failure.' },
        ],
        answer: 0,
        explain: '401: not authenticated. 403: authenticated but not allowed.',
      },
      {
        id: 's1-5-6',
        type: 'diagram',
        prompt: 'The database is down. Which box should turn that into a 503 for the client?',
        diagram: {
          nodes: [
            { id: 'c', kind: 'client', label: 'Browser' },
            { id: 'l', kind: 'lb', label: 'Balancer' },
            { id: 's', kind: 'service', label: 'App server' },
            { id: 'd', kind: 'db', label: 'Database' },
          ],
          edges: [
            { from: 'c', to: 'l' },
            { from: 'l', to: 's' },
            { from: 's', to: 'd' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 's',
          why: {
            c: 'The browser receives the status; it does not choose it.',
            l: 'The balancer only sees what the app server answers.',
            d: 'The database is down: it cannot answer anything.',
          },
        },
        explain: 'The app server catches the database error and answers 503 with a friendly message.',
      },
      {
        id: 's1-5-7',
        type: 'fill-blank',
        prompt: 'Retry on 429 and on any 5xx.',
        code: `def retry(code):
    return code == 429 or code ___ 500

print(retry(503), retry(404))`,
        answer: ['>='],
        distractors: [{ text: '<', why: 'That retries every success and client error, but not 503.' }],
        expectOutput: 'True False',
        explain: 'E2 built exactly this rule into a retrying client.',
      },
      {
        id: 's1-5-8',
        type: 'mcq',
        prompt: 'Your API returns 500 for any request with an emoji in the name. Whose bug is it?',
        options: [
          { text: 'The server\'s' },
          { text: 'The client\'s', why: 'If the input were invalid, the server should answer 400 or 422, not crash.' },
          { text: 'Nobody\'s: emoji are invalid', why: 'Either accept them or reject them with a 4xx; a 500 is a crash.' },
        ],
        answer: 0,
        explain: 'A 5xx means the server failed; bad input deserves a 4xx.',
      },
    ],
  },
];

export const s1: Unit = {
  id: 'S1',
  track: 'system-design',
  title: 'How a request travels',
  blurb: 'From browser to database and back: DNS, connections, HTTP methods and status codes, latency against throughput, p50 and p99, processes and threads.',
  prelude: SD_PRELUDE,
  lessons: [...lessons, ...s1More],
  labs: s1Labs,
  library: s1Library,
};
