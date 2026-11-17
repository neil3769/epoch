import { s5Labs } from '../labs/s5';
import { s5Library } from '../library/s5';
import type { Lesson, Unit } from '../schema';
import { SD_PRELUDE } from './s1';
import { s5More } from './s5-more';

/*
 * S5 Databases: modelling and queries. Lessons 1-6 here: tables and keys,
 * joins, key-value and document stores, wide-column and graph stores,
 * indexes, composite indexes and their cost. Lessons 7-11 in s5-more.ts:
 * normalising, transactions, isolation anomalies, preventing lost updates,
 * checkpoint.
 *
 * Real SQL runs in SQLite (Python's sqlite3, in the browser). The prelude's
 * shop() returns a fresh in-memory database with users and orders;
 * q(con, sql, *args) runs a query and returns the rows; plan(con, sql)
 * returns SQLite's query plan without its details ("SCAN orders",
 * "SEARCH orders USING INDEX by_user").
 */
const PRELUDE = `${SD_PRELUDE}
import sqlite3

def shop():
    con = sqlite3.connect(":memory:")
    con.executescript("""
    create table users (id integer primary key, name text, city text);
    create table orders (id integer primary key,
        user_id integer references users(id), total real, day text);
    insert into users values (1, 'Ana', 'Lisbon'), (2, 'Bo', 'Porto'), (3, 'Cy', 'Lisbon');
    insert into orders values (1, 1, 20.0, 'mon'), (2, 1, 35.5, 'tue'),
        (3, 2, 12.0, 'tue'), (4, 3, 8.0, 'wed');
    """)
    return con

def q(con, sql, *args):
    return con.execute(sql, args).fetchall()

def plan(con, sql):
    rows = con.execute("explain query plan " + sql).fetchall()
    return " / ".join(r[3].split(" (")[0] for r in rows)

def bank():
    con = sqlite3.connect(":memory:")
    con.execute("create table acct (id text primary key, bal int)")
    con.execute("insert into acct values ('a', 100), ('b', 0)")
    con.commit()
    return con

def move(con, acct, delta):
    con.execute("update acct set bal = bal + ? where id = ?", (delta, acct))

def bal(con):
    return dict(con.execute("select id, bal from acct order by id"))

def store(n):
    con = sqlite3.connect(":memory:")
    con.execute("create table stock (sku text primary key, n int, version int)")
    con.execute("insert into stock values ('pen', ?, 1)", (n,))
    con.commit()
    return con`;

const lessons: Lesson[] = [
  // ------------------------------------------------------------------ 1
  {
    id: 's5-01',
    title: 'Tables, rows and keys',
    summary: 'A relational database stores rows in tables; each row has a primary key that never repeats.',
    card: {
      title: 'Tables, rows and keys',
      text: 'A relational database keeps data in tables of rows and columns, and you ask for it in SQL. Every row has a primary key, a value no other row in the table shares, so it can be found and referred to. Here `shop()` makes a small database with `users` and `orders`, and `q` runs a query.',
      code: `con = shop()
rows = q(con, "select * from users")
for row in rows:
    print(row)`,
      output: "(1, 'Ana', 'Lisbon')\n(2, 'Bo', 'Porto')\n(3, 'Cy', 'Lisbon')",
    },
    exercises: [
      {
        id: 's5-1-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `con = shop()
print(q(con, "select name from users"
             " where id = ?", 2))`,
        answer: "[('Bo',)]",
        options: [
          { text: "[('Bo',)]" },
          { text: "Bo", why: 'q returns a list of row tuples, even for one value.' },
          { text: "[('Ana',)]", why: 'Ana has id 1; id 2 is Bo.' },
        ],
        explain: 'The `?` is filled with 2 safely: never paste values into SQL text.',
      },
      {
        id: 's5-1-2',
        type: 'predict-output',
        prompt: 'Who lives in Lisbon?',
        code: `con = shop()
rows = q(con, "select name from users"
         " where city = 'Lisbon'")
print([r[0] for r in rows])`,
        answer: "['Ana', 'Cy']",
        typedWrong: [{ answer: "['Ana']", why: 'Cy lives in Lisbon too.' }],
        explain: 'WHERE filters rows; SELECT picks columns.',
      },
      {
        id: 's5-1-3',
        type: 'predict-output',
        prompt: 'Insert a user with an id that already exists. What happens?',
        code: `con = shop()
try:
    con.execute("insert into users"
        " values (2, 'Di', 'Faro')")
    print("added")
except sqlite3.IntegrityError:
    print("rejected")`,
        answer: 'rejected',
        options: [
          { text: 'rejected' },
          { text: 'added', why: 'Id 2 is taken: a primary key never repeats.' },
        ],
        explain: 'The database itself enforces the key, whatever bug the app has.',
      },
      {
        id: 's5-1-4',
        type: 'mcq',
        prompt: 'What makes a good primary key for users?',
        options: [
          { text: 'A generated id' },
          { text: 'Their full name', why: 'Two people can share a name.' },
          { text: 'Their email address', why: 'Emails change; every reference would have to change too.' },
        ],
        answer: 0,
        explain: 'Keep emails unique with a separate constraint, but do not use them as the key.',
      },
      {
        id: 's5-1-5',
        type: 'run-code',
        prompt: 'Set `total` to the sum of all order totals, using SQL.',
        before: 'con = shop()',
        solution: 'total = q(con, "select sum(total)"\n             " from orders")[0][0]',
        tests: 'assert total == 75.5, f"20 + 35.5 + 12 + 8; got {total}"',
        maxLines: 3,
        placeholder: 'total = ...',
        explain: 'The database adds them up; only one number crosses the wire.',
      },
      {
        id: 's5-1-6',
        type: 'bucket-sort',
        prompt: 'Is each a good primary key?',
        buckets: ['Good key', 'Poor key'],
        items: [
          { text: 'An auto-incrementing number', bucket: 0, why: 'Unique and never changes.' },
          { text: 'A random UUID', bucket: 0, why: 'Unique, and can be made on any machine.' },
          { text: 'A person\'s full name', bucket: 1, why: 'Not unique.' },
          { text: 'A phone number', bucket: 1, why: 'People change numbers and numbers get reused.' },
          { text: 'An order number made by the shop', bucket: 0, why: 'Unique by design and never edited.' },
        ],
        explain: 'Unique, never empty, never changing.',
      },
      {
        id: 's5-1-7',
        type: 'fill-blank',
        prompt: 'Count the orders from Tuesday.',
        code: `con = shop()
n = q(con, "select count(*)"
    " from orders where day = ?", ___)
print(n[0][0])`,
        answer: ['"tue"'],
        distractors: [{ text: '"mon"', why: 'That counts Monday: one order.' }],
        expectOutput: '2',
        explain: 'Orders 2 and 3 were on Tuesday.',
      },
      {
        id: 's5-1-8',
        type: 'mcq',
        prompt: 'Why use `?` placeholders instead of putting values into the SQL text?',
        options: [
          { text: 'Values cannot change the query' },
          { text: 'It makes queries shorter', why: 'The reason is safety: SQL injection.' },
          { text: 'SQLite requires it', why: 'It allows both; only one is safe.' },
        ],
        answer: 0,
        explain: 'A name like `x\'; drop table users; --` stays a name.',
      },
    ],
  },

  // ------------------------------------------------------------------ 2
  {
    id: 's5-02',
    title: 'Joins and foreign keys',
    summary: 'Rows refer to other rows by key; a join brings them back together in one query.',
    card: {
      title: 'Joins and foreign keys',
      text: 'An order does not repeat the user\'s name; it stores `user_id`, a foreign key pointing at a row in `users`. A join puts the two back together: for each order, find the user whose id matches. This keeps each fact in one place.',
      code: `con = shop()
print(q(con, """
  select u.name, o.total
  from orders o join users u
    on u.id = o.user_id
  where o.day = 'tue'"""))`,
      output: "[('Ana', 35.5), ('Bo', 12.0)]",
    },
    exercises: [
      {
        id: 's5-2-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `con = shop()
print(q(con, """
  select u.name from orders o
  join users u on u.id = o.user_id
  where o.total > 30"""))`,
        answer: "[('Ana',)]",
        options: [
          { text: "[('Ana',)]" },
          { text: "[(1,)]", why: 'The join replaces the id with the user\'s name.' },
          { text: "[('Ana',), ('Bo',)]", why: 'Only order 2, 35.5, is over 30.' },
        ],
        explain: 'The order has user_id 1; the join finds Ana.',
      },
      {
        id: 's5-2-2',
        type: 'predict-output',
        prompt: 'Total spent per user. What does this print?',
        code: `con = shop()
for row in q(con, """
  select u.name, sum(o.total)
  from users u join orders o
    on o.user_id = u.id
  group by u.name
  order by u.name"""):
    print(*row)`,
        answer: 'Ana 55.5\nBo 12.0\nCy 8.0',
        options: [
          { text: 'Ana 55.5\nBo 12.0\nCy 8.0' },
          { text: 'Ana 20.0\nBo 12.0\nCy 8.0', why: 'Ana has two orders: 20 + 35.5.' },
          { text: '75.5', why: 'group by gives one row per user.' },
        ],
        explain: 'GROUP BY folds each user\'s orders into one row.',
      },
      {
        id: 's5-2-3',
        type: 'mcq',
        prompt: 'Why store `user_id` in orders rather than the user\'s name and city?',
        options: [
          { text: 'Each fact lives in one place' },
          { text: 'Ids are always faster to read', why: 'Speed is not the point; consistency is.' },
          { text: 'Names cannot be stored twice', why: 'They can; then every copy must be updated on a change.' },
        ],
        answer: 0,
        explain: 'If Ana moves, one row changes, not every order.',
      },
      {
        id: 's5-2-4',
        type: 'diagram',
        prompt: 'Tap the path a "show my orders with product names" query follows: orders refer to users and to products.',
        diagram: {
          nodes: [
            { id: 'q', kind: 'service', label: 'Query' },
            { id: 'o', kind: 'db', label: 'orders' },
            { id: 'u', kind: 'db', label: 'users' },
            { id: 'p', kind: 'db', label: 'products' },
          ],
          edges: [
            { from: 'q', to: 'o' },
            { from: 'o', to: 'u', label: 'user_id' },
            { from: 'o', to: 'p', label: 'prod_id' },
          ],
        },
        goal: { kind: 'path', answer: ['q', 'o', 'p'] },
        explain: 'Start from the orders, follow product_id to products.',
      },
      {
        id: 's5-2-5',
        type: 'run-code',
        prompt: 'Set `names` to the names of users with at least one order on Tuesday, sorted.',
        before: 'con = shop()',
        solution: 'rows = q(con, """\n  select distinct u.name\n  from users u join orders o\n    on o.user_id = u.id\n  where o.day = \'tue\'\n  order by u.name""")\nnames = [r[0] for r in rows]',
        tests: 'assert names == ["Ana", "Bo"], f"got {names}"',
        maxLines: 8,
        placeholder: 'names = ...',
        explain: 'distinct removes repeats when one user has several matching orders.',
      },
      {
        id: 's5-2-6',
        type: 'predict-output',
        prompt: 'Foreign keys are enforced here. An order for user 9, who does not exist?',
        code: `con = shop()
con.execute("pragma foreign_keys=on")
try:
    con.execute("insert into orders"
        " values (5, 9, 1.0, 'thu')")
    print("added")
except sqlite3.IntegrityError:
    print("rejected")`,
        answer: 'rejected',
        options: [
          { text: 'rejected' },
          { text: 'added', why: 'No user 9 exists, so the reference is invalid.' },
        ],
        explain: 'SQLite needs that pragma; most databases enforce foreign keys by default.',
      },
      {
        id: 's5-2-7',
        type: 'fill-blank',
        prompt: 'Join each order to its user.',
        code: `con = shop()
print(q(con, """
  select u.name, o.total
  from orders o join users u
    on u.id = o.___
  where o.id = 3"""))`,
        answer: ['user_id'],
        distractors: [{ text: 'id', why: 'That matches the order\'s own id to a user id: order 3 to user 3.' }],
        expectOutput: "[('Bo', 12.0)]",
        explain: 'Order 3 belongs to user 2, Bo.',
      },
      {
        id: 's5-2-8',
        type: 'scenario',
        prompt: 'A page shows 50 orders, each with its user\'s name. How should the app fetch them?',
        situation: 'The app currently runs one query for the orders, then one query per order for the user.',
        needs: ['Fewer database round trips', 'Same page content'],
        options: [
          {
            text: 'One query with a join',
            cost: 'A slightly more complex query.',
          },
          {
            text: 'Keep 51 queries',
            cost: 'Nothing to change.',
            why: '51 round trips (the "N+1 query" problem) make the page slow.',
          },
          {
            text: 'Copy names into every order',
            cost: 'Every name change must update every order.',
            why: 'A join already gives the names in one query.',
          },
        ],
        answer: 0,
        explain: 'One round trip instead of 51.',
      },
    ],
  },

  // ------------------------------------------------------------------ 3
  {
    id: 's5-03',
    title: 'Key-value and document stores',
    summary: 'Key-value stores fetch a value by its key, fast; document stores keep a whole record as one nested document.',
    card: {
      title: 'Key-value and document stores',
      text: 'A key-value store does one thing: give it a key, get the value, very fast and easy to spread over many machines. A document store keeps each record as one nested document (like JSON), so an order and its lines come back together without a join. Both give up some of what SQL offers, such as joins across records and flexible queries.',
    },
    exercises: [
      {
        id: 's5-3-1',
        type: 'bucket-sort',
        prompt: 'Which store fits best?',
        buckets: ['Key-value', 'Document', 'Relational'],
        items: [
          { text: 'Sessions looked up by session id', bucket: 0, why: 'One key, one value, read constantly.' },
          { text: 'A product with varying attributes', bucket: 1, why: 'Shoes and laptops have different fields; documents allow that.' },
          { text: 'Payments joined with accounts for reports', bucket: 2, why: 'Joins, constraints and transactions.' },
          { text: 'A cache of rendered pages', bucket: 0, why: 'Fetched whole by key.' },
          { text: 'A blog post with its comments', bucket: 1, why: 'Read together as one document.' },
          { text: 'Inventory with strict stock counts', bucket: 2, why: 'Transactions keep counts correct.' },
        ],
        explain: 'Match the store to how the data is read and changed.',
      },
      {
        id: 's5-3-2',
        type: 'predict-output',
        prompt: 'A document: one order with its lines nested. What does this print?',
        code: `order = {"id": 7, "user": "ana",
  "lines": [{"sku": "pen", "n": 2},
            {"sku": "ink", "n": 1}]}
lines = order["lines"]
print(sum(l["n"] for l in lines))`,
        answer: '3',
        typedWrong: [{ answer: '2', why: 'Two lines: 2 pens and 1 ink, 3 items.' }],
        explain: 'Everything about the order arrives in one read.',
      },
      {
        id: 's5-3-3',
        type: 'scenario',
        prompt: 'Where do login sessions go?',
        situation: 'Every request looks up a session by its id. There are millions of sessions, each a small blob, and they expire.',
        needs: ['Lookups under a millisecond', 'Automatic expiry'],
        options: [
          {
            text: 'A key-value store with TTLs',
            cost: 'Another system; data can be lost if it is memory-only.',
          },
          {
            text: 'A table in the relational DB',
            cost: 'Slower lookups and manual clean-up of old rows.',
            why: 'It works, but it is slower and has no built-in expiry.',
          },
          {
            text: 'A graph database',
            cost: 'A store built for traversing relationships.',
            why: 'Sessions have no relationships to traverse.',
          },
        ],
        answer: 0,
        explain: 'Redis-style stores are the usual home for sessions.',
      },
      {
        id: 's5-3-4',
        type: 'mcq',
        prompt: 'What does a pure key-value store give up?',
        options: [
          { text: 'Queries by anything but the key' },
          { text: 'Speed when reading by key', why: 'Speed by key is its strength.' },
          { text: 'Storing large values at all', why: 'Values can be large; you just cannot query inside them.' },
        ],
        answer: 0,
        explain: '"All orders over €30" means reading everything.',
      },
      {
        id: 's5-3-5',
        type: 'predict-output',
        prompt: 'A key-value store as a dict. How many keys must be read to find users in Lisbon?',
        code: `kv = {"user:1": {"city": "Lisbon"},
      "user:2": {"city": "Porto"},
      "user:3": {"city": "Lisbon"}}
reads = 0
for k in kv:
    reads += 1
print(reads)`,
        answer: '3',
        typedWrong: [{ answer: '2', why: 'Without an index on city, every key is read.' }],
        explain: 'Searching by value means reading every value.',
      },
      {
        id: 's5-3-6',
        type: 'scenario',
        prompt: 'Where do product listings go?',
        situation: 'A marketplace sells shoes, laptops and sofas. Each category has its own attributes; a product page reads one product with all its attributes.',
        needs: ['Attributes vary by category', 'One fast read per product page'],
        options: [
          {
            text: 'A document per product',
            cost: 'Cross-product reports and joins are harder.',
          },
          {
            text: 'One table, a column per attribute',
            cost: 'Hundreds of mostly empty columns.',
            why: 'Every new attribute changes the table for all products.',
          },
          {
            text: 'A key-value store of strings',
            cost: 'No structure at all.',
            why: 'Filtering by size or brand would need reading everything.',
          },
        ],
        answer: 0,
        explain: 'Many relational databases also store JSON columns: a middle way.',
      },
      {
        id: 's5-3-7',
        type: 'fill-blank',
        prompt: 'Key-value access: the key decides everything.',
        code: `kv = {"session:a1": "ana",
      "session:b2": "bo"}
sid = "b2"
print(kv[f"session:{___}"])`,
        answer: ['sid'],
        distractors: [{ text: '"ana"', why: 'The key is built from the session id, not the user.' }],
        expectOutput: 'bo',
        explain: 'Keys are often namespaced: "session:…", "user:…".',
      },
      {
        id: 's5-3-8',
        type: 'mcq',
        prompt: 'Your app needs joins, constraints and transactions across many kinds of records. Default choice?',
        options: [
          { text: 'A relational database' },
          { text: 'A key-value store', why: 'It has none of those three.' },
          { text: 'A document store', why: 'Joins and multi-record transactions are its weaker side.' },
        ],
        answer: 0,
        explain: 'Start relational unless a clear need says otherwise.',
      },
    ],
  },

  // ------------------------------------------------------------------ 4
  {
    id: 's5-04',
    title: 'Wide-column and graph stores',
    summary: 'Wide-column stores write huge volumes keyed by partition and time; graph stores follow relationships.',
    card: {
      title: 'Wide-column and graph stores',
      text: 'Wide-column stores (Cassandra-style) spread enormous write volumes over many machines: rows are grouped by a partition key and sorted within it, ideal for "all readings of sensor 42 this week". Graph stores keep relationships as first-class links, so "friends of friends who like jazz" is a walk instead of many joins. Both are specialists: great at their one shape, awkward at others.',
    },
    exercises: [
      {
        id: 's5-4-1',
        type: 'bucket-sort',
        prompt: 'Wide-column or graph?',
        buckets: ['Wide-column', 'Graph'],
        items: [
          { text: 'Millions of sensor readings a second', bucket: 0, why: 'Huge write volume, read by sensor and time.' },
          { text: 'Friends of friends', bucket: 1, why: 'A walk along relationships.' },
          { text: 'A chat app\'s message history per channel', bucket: 0, why: 'Partition by channel, sort by time.' },
          { text: 'Fraud rings sharing cards and devices', bucket: 1, why: 'Finding connected groups is a graph walk.' },
          { text: 'Click events kept for a year', bucket: 0, why: 'Write-heavy, read by key and time range.' },
        ],
        explain: 'Wide-column for volume by key and time; graph for connections.',
      },
      {
        id: 's5-4-2',
        type: 'predict-output',
        prompt: 'Readings grouped by sensor and sorted by time. What does this print?',
        code: `rows = {"s42": [(1, 20.1), (2, 20.4),
               (3, 21.0)],
        "s7": [(1, 18.0)]}
week = [v for t, v in rows["s42"]
        if t >= 2]
print(week)`,
        answer: '[20.4, 21.0]',
        typedWrong: [{ answer: '[20.1, 20.4, 21.0]', why: 'Only times from 2 on are kept.' }],
        explain: 'One partition, one sorted slice: exactly what wide-column stores serve fast.',
      },
      {
        id: 's5-4-3',
        type: 'predict-output',
        prompt: 'Friends of friends in a tiny graph. What does this print?',
        code: `friends = {"ana": ["bo", "cy"],
           "bo": ["ana", "di"],
           "cy": ["ana", "ed"]}
fof = {f2 for f in friends["ana"]
       for f2 in friends.get(f, [])
       if f2 != "ana"}
print(sorted(fof))`,
        answer: "['di', 'ed']",
        typedWrong: [{ answer: "['bo', 'cy']", why: 'Those are friends; friends of friends are one step further.' }],
        explain: 'Each step follows links instead of running a join.',
      },
      {
        id: 's5-4-4',
        type: 'scenario',
        prompt: 'Where do the IoT readings go?',
        situation: '2 million sensors each send a reading every 10 seconds. Dashboards show one sensor\'s last 24 hours.',
        needs: ['200,000 writes a second', 'Reads by sensor and time range'],
        options: [
          {
            text: 'A wide-column store by sensor',
            cost: 'Only queries by sensor and time are fast; others are not.',
          },
          {
            text: 'One big relational database',
            cost: 'One machine must take every write.',
            why: '200,000 writes a second is far beyond one ordinary database server.',
          },
          {
            text: 'A graph database',
            cost: 'Built for relationships.',
            why: 'Readings have no relationships to walk.',
          },
        ],
        answer: 0,
        explain: '2 × 10⁶ ÷ 10 s = 2 × 10⁵ writes a second.',
      },
      {
        id: 's5-4-5',
        type: 'estimate',
        prompt: '2 million sensors, one reading every 10 s, 50 bytes each. Storage per day?',
        expr: '2e6 / 10 * DAY * 50 / GB',
        answer: 864,
        tolerance: 2,
        unit: 'GB',
        options: [
          { value: 86, why: '2 × 10⁵ writes/s × 86,400 s × 50 B is about 860 GB.' },
          { value: 864 },
          { value: 8640, why: 'One factor of ten too many.' },
        ],
        work: ['2 × 10⁶ ÷ 10 s = 2 × 10⁵ readings/s', '× 86,400 s ≈ 1.7 × 10¹⁰ readings a day', '× 50 B ≈ 860 GB a day'],
        explain: 'About a third of a petabyte a year before copies.',
      },
      {
        id: 's5-4-6',
        type: 'mcq',
        prompt: 'Why is "friends of friends of friends" slow in a relational database?',
        options: [
          { text: 'Each hop is another self-join' },
          { text: 'Relational databases cannot store friendships', why: 'They can: a table of pairs.' },
          { text: 'SQL has no WHERE clause for it', why: 'It does; the cost is the repeated joins.' },
        ],
        answer: 0,
        explain: 'Graph stores follow stored links per hop instead.',
      },
      {
        id: 's5-4-7',
        type: 'diagram',
        prompt: 'A social app: profiles in a relational DB, friendships in a graph store, posts in a wide-column store. Which store answers "who could Ana know?"',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'r', kind: 'db', label: 'Profiles' },
            { id: 'g', kind: 'db', label: 'Friend graph' },
            { id: 'w', kind: 'db', label: 'Posts' },
          ],
          edges: [
            { from: 'a', to: 'r' },
            { from: 'a', to: 'g' },
            { from: 'a', to: 'w' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'g',
          why: {
            a: 'The app asks; the question is which store answers.',
            r: 'Profiles hold names and settings, not the web of friendships.',
            w: 'Posts are stored by author and time, not by connection.',
          },
        },
        explain: 'Friends of friends: a walk in the graph.',
      },
      {
        id: 's5-4-8',
        type: 'mcq',
        prompt: 'A team wants to use five different databases from day one. Your advice?',
        options: [
          { text: 'One now; more when needed' },
          { text: 'Use all five for flexibility', why: 'Each store is more to run, back up and keep consistent.' },
          { text: 'Never use more than one', why: 'Specialists earn their place once a real need appears.' },
        ],
        answer: 0,
        explain: 'Every extra store costs operations and consistency work.',
      },
    ],
  },

  // ------------------------------------------------------------------ 5
  {
    id: 's5-05',
    title: 'Indexes',
    summary: 'Without an index, finding rows by a column means scanning every row; an index makes it a quick lookup.',
    card: {
      title: 'Indexes',
      text: 'To find orders for user 3, the database must look at every row unless it has an index on `user_id`: a sorted structure from values to rows, like the index of a book. With it, the lookup is a quick search instead of a scan. `plan` shows which one SQLite chose.',
      code: `con = shop()
sql = ("select * from orders"
       " where user_id = 3")
print(plan(con, sql))
con.execute("create index by_user"
            " on orders(user_id)")
print(plan(con, sql))`,
      output: 'SCAN orders\nSEARCH orders USING INDEX by_user',
    },
    exercises: [
      {
        id: 's5-5-1',
        type: 'predict-output',
        prompt: 'Searching by the primary key, with no extra index. What plan?',
        code: `con = shop()
print(plan(con, "select * from users"
                " where id = 2"))`,
        answer: 'SEARCH users USING INTEGER PRIMARY KEY',
        options: [
          { text: 'SEARCH users USING INTEGER PRIMARY KEY' },
          { text: 'SCAN users', why: 'The primary key is already an index.' },
        ],
        explain: 'Lookups by primary key are always fast.',
      },
      {
        id: 's5-5-2',
        type: 'predict-output',
        prompt: 'Searching by city, with no index on it. What plan?',
        code: `con = shop()
print(plan(con, "select * from users"
           " where city = 'Porto'"))`,
        answer: 'SCAN users',
        options: [
          { text: 'SCAN users' },
          { text: 'SEARCH users USING INDEX', why: 'There is no index on city.' },
        ],
        explain: 'A scan reads every row: fine for 3 rows, terrible for 30 million.',
      },
      {
        id: 's5-5-3',
        type: 'estimate',
        prompt: 'A scan of 30 million rows at about 10 million rows per second, against an index lookup of about 1 ms. How many times slower is the scan?',
        expr: '(30e6 / 10e6) / 0.001',
        answer: 3000,
        tolerance: 2,
        unit: '× slower',
        options: [
          { value: 3, why: 'The scan takes 3 seconds; the lookup 1 ms.' },
          { value: 3000 },
          { value: 3000000, why: '3 s ÷ 1 ms is 3,000.' },
        ],
        work: ['Scan: 30 × 10⁶ ÷ 10⁷ per second = 3 s', '3 s ÷ 0.001 s = 3,000 times'],
        explain: 'Why a missing index can take a site down as data grows.',
      },
      {
        id: 's5-5-4',
        type: 'run-code',
        prompt: 'Add an index so the query below becomes a SEARCH, then set `p` to its plan.',
        before: `con = shop()
sql = ("select * from users"
       " where city = 'Lisbon'")`,
        solution: 'con.execute("create index by_city"\n            " on users(city)")\np = plan(con, sql)',
        tests: 'assert p.startswith("SEARCH users USING INDEX"), f"got {p!r}"',
        maxLines: 4,
        placeholder: 'con.execute("create index ...")',
        explain: 'Index the columns you filter by often.',
      },
      {
        id: 's5-5-5',
        type: 'mcq',
        prompt: 'An index is like the index at the back of a book because…',
        options: [
          { text: 'It maps values to locations' },
          { text: 'It holds a copy of every page', why: 'It holds values and locations, not whole rows.' },
          { text: 'It is read from start to end', why: 'It is searched, not read through.' },
        ],
        answer: 0,
        explain: 'Look up "jazz", get page numbers.',
      },
      {
        id: 's5-5-6',
        type: 'scenario',
        prompt: 'The orders page got slow as the table grew. What do you do?',
        situation: 'The page runs `select * from orders where user_id = ?`. The table has 40 million rows; the plan says SCAN.',
        needs: ['The page fast again', 'No change to what it shows'],
        options: [
          {
            text: 'Index orders(user_id)',
            cost: 'Slightly slower inserts and some disk space.',
          },
          {
            text: 'Cache the page for an hour',
            cost: 'New orders show up to an hour late.',
            why: 'Every miss still scans 40 million rows, and users see old data.',
          },
          {
            text: 'A bigger database server',
            cost: 'A pricier machine.',
            why: 'A scan of 40 million rows stays slow on any machine.',
          },
        ],
        answer: 0,
        explain: 'The plan said SCAN: the fix is an index.',
      },
      {
        id: 's5-5-7',
        type: 'fill-blank',
        prompt: 'Index the column you filter by.',
        code: `con = shop()
con.execute("create index ix"
            " on orders(___)")
print(plan(con, "select * from orders"
                " where day = 'tue'"))`,
        answer: ['day'],
        distractors: [{ text: 'total', why: 'An index on total does not help a filter on day.' }],
        expectOutput: 'SEARCH orders USING INDEX ix',
        explain: 'The plan now uses the index.',
      },
      {
        id: 's5-5-8',
        type: 'mcq',
        prompt: 'Should you index every column, just in case?',
        options: [
          { text: 'No: each one slows writes' },
          { text: 'Yes: indexes are free', why: 'Every insert and update must change every index too.' },
          { text: 'Yes, but only on small tables', why: 'Small tables barely need indexes at all.' },
        ],
        answer: 0,
        explain: 'Index what your queries filter and sort by; next lesson counts the cost.',
      },
    ],
  },

  // ------------------------------------------------------------------ 6
  {
    id: 's5-06',
    title: 'Composite indexes and their cost',
    summary: 'An index on (a, b) helps queries on a, or a and b, but not b alone; every index slows writes.',
    card: {
      title: 'Composite indexes and their cost',
      text: 'An index can cover several columns, such as (user_id, day): it sorts by user first, then by day within each user. It helps queries that filter by user, or by user and day, but not by day alone, just as a phone book sorted by surname cannot find everyone called Ana. Every index must be updated on every insert, so each one makes writes slower.',
      code: `con = shop()
con.execute("create index ud on"
    " orders(user_id, day)")
print(plan(con, "select * from orders"
                " where day = 'tue'"))`,
      output: 'SCAN orders',
    },
    exercises: [
      {
        id: 's5-6-1',
        type: 'predict-output',
        prompt: 'Same index, filtering by user and day. What plan?',
        code: `con = shop()
con.execute("create index ud on"
    " orders(user_id, day)")
print(plan(con, "select * from orders"
  " where user_id = 1"
  " and day = 'tue'"))`,
        answer: 'SEARCH orders USING INDEX ud',
        options: [
          { text: 'SEARCH orders USING INDEX ud' },
          { text: 'SCAN orders', why: 'Both columns of the index are given: it can be used fully.' },
        ],
        explain: 'Left column first, then the next: exactly the index order.',
      },
      {
        id: 's5-6-2',
        type: 'bucket-sort',
        prompt: 'Can an index on (user_id, day) help this filter?',
        buckets: ['Helps', 'Does not'],
        items: [
          { text: 'user_id = 3', bucket: 0, why: 'The leftmost column.' },
          { text: 'user_id = 3 and day = \'tue\'', bucket: 0, why: 'Both columns, in index order.' },
          { text: 'day = \'tue\'', bucket: 1, why: 'Day alone skips the leftmost column.' },
          { text: 'total > 10', bucket: 1, why: 'Not in the index at all.' },
          { text: 'user_id = 3 order by day', bucket: 0, why: 'Within one user, rows are already sorted by day.' },
        ],
        explain: 'The leftmost-prefix rule.',
      },
      {
        id: 's5-6-3',
        type: 'estimate',
        prompt: 'A table gets 5,000 inserts a second and has 4 indexes. How many index updates per second?',
        expr: '5000 * 4',
        answer: 20000,
        tolerance: 1.5,
        unit: 'updates/s',
        options: [
          { value: 5000, why: 'Each insert updates all 4 indexes.' },
          { value: 20000 },
          { value: 1250, why: 'Multiply by the indexes, do not divide.' },
        ],
        work: ['5,000 inserts × 4 indexes = 20,000 index updates a second', 'Plus the table write itself'],
        explain: 'Unused indexes are pure cost.',
      },
      {
        id: 's5-6-4',
        type: 'scenario',
        prompt: 'Which index for this query?',
        situation: 'The busiest query is `where user_id = ? and day = ?`. Another, rarer one filters by `day` alone.',
        needs: ['The busiest query fast', 'As few indexes as possible'],
        options: [
          {
            text: 'One index on (user_id, day)',
            cost: 'The rare day-only query still scans.',
          },
          {
            text: 'One index on (day, user_id)',
            cost: 'It also serves day-only queries.',
            why: 'Defensible too, but most days have many users: (user_id, day) narrows faster for the busy query.',
          },
          {
            text: 'Separate indexes on each column',
            cost: 'Two indexes to update on every write.',
            why: 'Two indexes where one serves the busy query.',
          },
        ],
        answer: 0,
        explain: 'Put the column that narrows the search most, and is always given, first.',
      },
      {
        id: 's5-6-5',
        type: 'mcq',
        prompt: 'Why does an index on (surname, first name) not help find everyone called Ana?',
        options: [
          { text: 'It is sorted by surname first' },
          { text: 'First names are not stored', why: 'They are stored, but only sorted within each surname.' },
          { text: 'Indexes only hold one column', why: 'This one holds two.' },
        ],
        answer: 0,
        explain: 'The Anas are scattered across every surname.',
      },
      {
        id: 's5-6-6',
        type: 'predict-output',
        prompt: 'Filtering by user only, with the (user_id, day) index. What plan?',
        code: `con = shop()
con.execute("create index ud on"
    " orders(user_id, day)")
print(plan(con, "select * from orders"
                " where user_id = 1"))`,
        answer: 'SEARCH orders USING INDEX ud',
        options: [
          { text: 'SEARCH orders USING INDEX ud' },
          { text: 'SCAN orders', why: 'user_id is the leftmost column: the index helps.' },
        ],
        explain: 'A prefix of the index is enough.',
      },
      {
        id: 's5-6-7',
        type: 'mcq',
        prompt: 'A table is written 50,000 times a second and read rarely, always by its key. Add indexes?',
        options: [
          { text: 'No: they would only slow writes' },
          { text: 'Yes, on every column', why: 'Each would cost on 50,000 writes a second and help no read.' },
          { text: 'Yes, one per query you might write later', why: 'Add them when a real query needs them.' },
        ],
        answer: 0,
        explain: 'The primary key already serves reads by key.',
      },
      {
        id: 's5-6-8',
        type: 'fill-blank',
        prompt: 'Make the user-and-day filter a SEARCH.',
        code: `con = shop()
con.execute("create index ud on"
            " orders(___, day)")
p = plan(con, "select * from orders"
  " where user_id = 2"
  " and day = 'tue'")
print(p[:6])`,
        answer: ['user_id'],
        distractors: [{ text: 'total', why: 'A leading total column cannot be used for this filter.' }],
        expectOutput: 'SEARCH',
        explain: 'The leading column must be one you filter by.',
      },
    ],
  },
];

export const s5: Unit = {
  id: 'S5',
  track: 'system-design',
  title: 'Databases: modelling and queries',
  blurb: 'Tables and keys, joins, key-value, document, wide-column and graph stores, indexes and their cost, normalising, transactions and isolation, with real SQL running in SQLite.',
  prelude: PRELUDE,
  lessons: [...lessons, ...s5More],
  labs: s5Labs,
  library: s5Library,
};
