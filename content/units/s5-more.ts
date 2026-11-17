import type { Lesson } from '../schema';

/* S5 lessons 7 to 11: normalised or denormalised, transactions and ACID,
 * isolation anomalies, preventing lost updates, checkpoint. Uses the
 * prelude in s5.ts, plus bank() (accounts a = 100, b = 0), bal(con) and
 * store(n) (a stock table with one product, "pen", n left, version 1). */

export const s5More: Lesson[] = [
  // ------------------------------------------------------------------ 7
  {
    id: 's5-07',
    title: 'Normalised or denormalised',
    summary: 'Store each fact once and join, or copy it where it is read; copies make reads fast and writes risky.',
    card: {
      title: 'Normalised or denormalised',
      text: 'Normalised data stores each fact once and joins to combine; denormalised data copies a fact to where it is read, such as the author\'s name inside every post. Copies make reads faster and writes slower and riskier: a copy that is not updated becomes a contradiction. Normalise by default, and denormalise a read path that measurements show is too slow.',
    },
    exercises: [
      {
        id: 's5-7-1',
        type: 'predict-output',
        prompt: 'Orders copy the user\'s city. Ana moves to Faro, but only `users` is updated. What does this print?',
        code: `users = {1: {"name": "Ana",
             "city": "Lisbon"}}
o = {"user": 1, "city": "Lisbon"}
orders = [dict(o), dict(o)]
users[1]["city"] = "Faro"
print({o["city"] for o in orders})`,
        answer: "{'Lisbon'}",
        typedWrong: [{ answer: "{'Faro'}", why: 'The copies in orders were not touched.' }],
        explain: 'Two answers to "where does Ana live?": an update anomaly.',
      },
      {
        id: 's5-7-2',
        type: 'estimate',
        prompt: 'A popular author has 10,000 posts, each with a copy of their display name. They rename themselves. How many rows must change?',
        expr: '10000 + 1',
        answer: 10001,
        tolerance: 1.2,
        unit: 'rows',
        options: [
          { value: 1, why: 'Every copy must change too.' },
          { value: 10001 },
          { value: 100, why: 'One copy per post: 10,000 of them, plus the profile.' },
        ],
        work: ['1 profile + 10,000 copies = 10,001 rows'],
        explain: 'Normalised, it would be one row.',
      },
      {
        id: 's5-7-3',
        type: 'bucket-sort',
        prompt: 'Normalised or denormalised?',
        buckets: ['Normalised', 'Denormalised'],
        items: [
          { text: 'Each fact stored once', bucket: 0, why: 'The definition.' },
          { text: 'Reads need no join', bucket: 1, why: 'The data is already where it is read.' },
          { text: 'One row changes on an update', bucket: 0, why: 'Only one copy exists.' },
          { text: 'Copies can disagree', bucket: 1, why: 'Every copy must be updated.' },
          { text: 'A post stores its author\'s name', bucket: 1, why: 'A copy of a fact owned by users.' },
        ],
        explain: 'Speed on reads, paid for on writes.',
      },
      {
        id: 's5-7-4',
        type: 'scenario',
        prompt: 'The feed join is the bottleneck. What do you do?',
        situation: 'The home feed reads 200 posts with author names, 50,000 times a second. Authors rename themselves rarely.',
        needs: ['Fast feed reads', 'Names may take a minute to update everywhere'],
        options: [
          {
            text: 'Copy names, fix in background',
            cost: 'A background job, and names briefly out of date.',
          },
          {
            text: 'Keep joining on every read',
            cost: 'No new moving parts.',
            why: 'The join is the measured bottleneck at 50,000 reads a second.',
          },
          {
            text: 'Never let authors rename',
            cost: 'Unhappy users.',
            why: 'A product limit to dodge a technical cost.',
          },
        ],
        answer: 0,
        explain: 'Denormalise where it is measured to matter, and own the update job.',
      },
      {
        id: 's5-7-5',
        type: 'mcq',
        prompt: 'What should a new schema be by default?',
        options: [
          { text: 'Normalised' },
          { text: 'Denormalised everywhere', why: 'You pay the write cost and risk before knowing it helps.' },
          { text: 'One big table', why: 'That copies every fact everywhere.' },
        ],
        answer: 0,
        explain: 'Denormalise specific read paths later, with numbers.',
      },
      {
        id: 's5-7-6',
        type: 'predict-output',
        prompt: 'Normalised: orders keep only the user id. Ana moves. What city does order 1 show?',
        code: `users = {1: {"city": "Lisbon"}}
orders = [{"id": 1, "user": 1}]
users[1]["city"] = "Faro"
o = orders[0]
print(users[o["user"]]["city"])`,
        answer: 'Faro',
        typedWrong: [{ answer: 'Lisbon', why: 'The order looks the city up through the user each time.' }],
        explain: 'One fact, one place, always current.',
      },
      {
        id: 's5-7-7',
        type: 'fill-blank',
        prompt: 'Denormalised: update every copy of the name.',
        code: `posts = [{"author": 7, "name": "Ana"},
         {"author": 7, "name": "Ana"},
         {"author": 8, "name": "Bo"}]
for p in posts:
    if p["author"] == ___:
        p["name"] = "Ana B."
print([p["name"] for p in posts])`,
        answer: ['7'],
        distractors: [{ text: '8', why: 'Author 8 is Bo.' }],
        expectOutput: "['Ana B.', 'Ana B.', 'Bo']",
        explain: 'Every copy, every time: the price of denormalising.',
      },
      {
        id: 's5-7-8',
        type: 'mcq',
        prompt: 'An order should show the price the customer paid, even if the product\'s price later changes. Copy the price into the order?',
        options: [
          { text: 'Yes: it is a different fact' },
          { text: 'No: always join to products', why: 'Then old orders would show today\'s price.' },
          { text: 'No: never copy anything', why: 'The price at purchase is its own fact, not a copy.' },
        ],
        answer: 0,
        explain: 'Not every repeated value is denormalisation: "price paid" is historical.',
      },
    ],
  },

  // ------------------------------------------------------------------ 8
  {
    id: 's5-08',
    title: 'Transactions and ACID',
    summary: 'A transaction makes several changes all-or-nothing; ACID names the guarantees.',
    card: {
      title: 'Transactions and ACID',
      text: 'A transaction groups changes so they all happen or none do: a transfer debits one account and credits another, never only one. ACID names the guarantees: atomic (all or nothing), consistent (rules still hold), isolated (others do not see half-done work) and durable (once committed, it survives a crash). Here `bank()` makes accounts a = 100 and b = 0, `move` changes a balance, and `with con:` is one transaction.',
      code: `con = bank()
with con:
    move(con, "a", -50)
    move(con, "b", 50)
print(bal(con))`,
      output: "{'a': 50, 'b': 50}",
    },
    exercises: [
      {
        id: 's5-8-1',
        type: 'predict-output',
        prompt: 'The app crashes after the debit, inside the transaction. What do the balances show?',
        code: `con = bank()
try:
    with con:
        move(con, "a", -50)
        raise RuntimeError("crash")
except RuntimeError:
    pass
print(bal(con))`,
        answer: "{'a': 100, 'b': 0}",
        options: [
          { text: "{'a': 100, 'b': 0}" },
          { text: "{'a': 50, 'b': 0}", why: 'The transaction rolled back: the debit was undone.' },
          { text: "{'a': 50, 'b': 50}", why: 'The credit never ran, and the debit was undone.' },
        ],
        explain: 'Atomic: no half transfer.',
      },
      {
        id: 's5-8-2',
        type: 'predict-output',
        prompt: 'The same crash in autocommit mode (isolation_level = None): each statement is saved on its own. What now?',
        code: `con = bank()
con.isolation_level = None
try:
    move(con, "a", -50)
    raise RuntimeError("crash")
except RuntimeError:
    pass
print(bal(con))`,
        answer: "{'a': 50, 'b': 0}",
        options: [
          { text: "{'a': 50, 'b': 0}" },
          { text: "{'a': 100, 'b': 0}", why: 'Without a transaction, the debit was saved immediately.' },
        ],
        explain: '€50 vanished: exactly what transactions prevent.',
      },
      {
        id: 's5-8-3',
        type: 'match-pairs',
        prompt: 'Match each ACID letter to its guarantee.',
        pairs: [
          { left: 'Atomic', right: 'all or nothing', why: 'No half-done transfers.' },
          { left: 'Consistent', right: 'rules still hold', why: 'Constraints are true before and after.' },
          { left: 'Isolated', right: 'no half-done work seen', why: 'Others do not see uncommitted changes.' },
          { left: 'Durable', right: 'survives a crash', why: 'Committed means written safely.' },
        ],
        explain: 'Relational databases give all four; many other stores give fewer.',
      },
      {
        id: 's5-8-4',
        type: 'order-steps',
        prompt: 'A transfer as a transaction. Put it in order.',
        steps: [
          'Begin the transaction',
          'Check account a has enough money',
          'Take 50 from a',
          'Add 50 to b',
          'Commit',
        ],
        explain: 'Any failure before the commit undoes everything.',
      },
      {
        id: 's5-8-5',
        type: 'run-code',
        prompt: 'Write `transfer(con, src, dst, amount)`: move the amount in one transaction.',
        before: 'con = bank()',
        solution: `def transfer(con, src, dst, amount):
    with con:
        move(con, src, -amount)
        move(con, dst, amount)`,
        tests: [
          'transfer(con, "a", "b", 30)',
          'assert bal(con) == {"a": 70, "b": 30}, f"got {bal(con)}"',
        ].join('\n'),
        maxLines: 10,
        placeholder: 'def transfer(con, src, dst, amount):',
        explain: 'The lab adds the "enough money" check.',
      },
      {
        id: 's5-8-6',
        type: 'scenario',
        prompt: 'An order and its stock change. How do you write them?',
        situation: 'Placing an order inserts an order row and lowers the product\'s stock. Last week a crash left an order with no stock change.',
        needs: ['Never an order without its stock change, or the reverse'],
        options: [
          {
            text: 'Both in one transaction',
            cost: 'Rows stay locked a little longer.',
          },
          {
            text: 'Insert, then lower stock later',
            cost: 'Nothing new.',
            why: 'A crash between them is exactly last week\'s bug.',
          },
          {
            text: 'Fix mismatches each night',
            cost: 'A nightly job.',
            why: 'It repairs the damage hours later instead of preventing it.',
          },
        ],
        answer: 0,
        explain: 'Changes that must agree go in one transaction.',
      },
      {
        id: 's5-8-7',
        type: 'mcq',
        prompt: 'The database said "committed", then the server lost power. Is the change kept?',
        options: [
          { text: 'Yes: durability' },
          { text: 'No: it was in memory', why: 'Commit waits until the change is written safely.' },
          { text: 'Only if it was small', why: 'Durability does not depend on size.' },
        ],
        answer: 0,
        explain: 'Databases write a log to disk before confirming the commit.',
      },
      {
        id: 's5-8-8',
        type: 'fill-blank',
        prompt: 'Make the change all-or-nothing.',
        code: `con = bank()
try:
    ___ con:
        move(con, "a", -10)
        1 / 0
except ZeroDivisionError:
    pass
print(bal(con))`,
        answer: ['with'],
        distractors: [{ text: 'if', why: '`if con:` runs the update with nothing to roll it back.' }],
        expectOutput: "{'a': 100, 'b': 0}",
        explain: 'The connection as a context manager commits, or rolls back on an error.',
      },
    ],
  },

  // ------------------------------------------------------------------ 9
  {
    id: 's5-09',
    title: 'Isolation and its anomalies',
    summary: 'Concurrent transactions can see dirty, changing or lost data; stronger isolation prevents more, at a cost.',
    card: {
      title: 'Isolation and its anomalies',
      text: 'When transactions run at the same time, weaker isolation lets them see each other in odd ways. A dirty read sees changes that may still be rolled back; a non-repeatable read gets two different answers to the same question; a lost update happens when two read-then-write cycles overlap. Stronger isolation levels prevent more of these, and cost more waiting or retries.',
    },
    exercises: [
      {
        id: 's5-9-1',
        type: 'predict-output',
        prompt: 'Two buyers take the last pens at once, interleaved like this. How many pens does the database end with?',
        code: `stock = 5
a = stock      # A reads 5
b = stock      # B reads 5
stock = a - 1  # A writes 4
stock = b - 1  # B writes 4
print(stock)`,
        answer: '4',
        typedWrong: [{ answer: '3', why: 'B computed from the 5 it read, overwriting A\'s write.' }],
        explain: 'Two sales, one decrement: a lost update.',
      },
      {
        id: 's5-9-2',
        type: 'match-pairs',
        prompt: 'Match each anomaly to what goes wrong.',
        pairs: [
          { left: 'Dirty read', right: 'sees work later rolled back', why: 'It read a change that never really happened.' },
          { left: 'Non-repeatable read', right: 'same question, two answers', why: 'Another transaction committed in between.' },
          { left: 'Lost update', right: 'one write overwrites another', why: 'Both read the old value, then both wrote.' },
        ],
        explain: 'Know them by example; the names come up in interviews.',
      },
      {
        id: 's5-9-3',
        type: 'order-steps',
        prompt: 'Put a dirty read in order.',
        steps: [
          'Transaction A sets the price to 0 (not committed)',
          'Transaction B reads the price: 0',
          'B charges a customer 0',
          'A rolls back: the price was never 0',
        ],
        explain: 'B acted on data that never existed. Read committed (the minimum most databases default to) prevents this.',
      },
      {
        id: 's5-9-4',
        type: 'bucket-sort',
        prompt: 'Read committed prevents only dirty reads. Serializable prevents all three. Which does each level leave possible?',
        buckets: ['Read committed', 'Serializable'],
        items: [
          { text: 'Prevents dirty reads', bucket: 0, why: 'The minimum it guarantees (and serializable too).' },
          { text: 'Still allows lost updates', bucket: 0, why: 'Two read-then-write cycles can overlap.' },
          { text: 'Behaves as if one at a time', bucket: 1, why: 'The definition of serializable.' },
          { text: 'May abort a transaction to keep order', bucket: 1, why: 'Conflicting transactions are rolled back and must be retried.' },
          { text: 'Still allows non-repeatable reads', bucket: 0, why: 'Each statement sees the latest committed data.' },
        ],
        explain: 'Stronger isolation: fewer surprises, more waiting or retries.',
      },
      {
        id: 's5-9-5',
        type: 'scenario',
        prompt: 'Two people book the last seat at the same moment. What do you use?',
        situation: 'The booking code reads "seats left", and if it is above 0, inserts a booking and lowers the count.',
        needs: ['Never sell more seats than exist', 'Bookings are rare enough that occasional retries are fine'],
        options: [
          {
            text: 'Serializable isolation, with retries',
            cost: 'Some transactions abort and must be retried.',
          },
          {
            text: 'Read committed as it is',
            cost: 'No retries.',
            why: 'Both can read 1 seat left and both book: overselling.',
          },
          {
            text: 'Check seats again after booking',
            cost: 'An extra query.',
            why: 'Too late: both bookings already exist.',
          },
        ],
        answer: 0,
        explain: 'Or an atomic conditional update (next lesson), which avoids retries.',
      },
      {
        id: 's5-9-6',
        type: 'predict-output',
        prompt: 'A non-repeatable read: A reads twice while B commits in between. What does A see?',
        code: `price = 10
first = price   # A reads
price = 12      # B updates, commits
second = price  # A reads again
print(first, second)`,
        answer: '10 12',
        typedWrong: [{ answer: '10 10', why: 'Under read committed, A sees B\'s committed change.' }],
        explain: 'Repeatable read or snapshot isolation would show 10 both times.',
      },
      {
        id: 's5-9-7',
        type: 'mcq',
        prompt: 'Why not always run at the strongest isolation level?',
        options: [
          { text: 'More waiting and aborted retries' },
          { text: 'It loses data', why: 'It loses nothing; it costs throughput.' },
          { text: 'It is not available anywhere', why: 'Most relational databases offer serializable.' },
        ],
        answer: 0,
        explain: 'Use the level each operation needs; PostgreSQL defaults to read committed.',
      },
      {
        id: 's5-9-8',
        type: 'fill-blank',
        prompt: 'Two increments, done safely in sequence.',
        code: `count = 0
for txn in ["A", "B"]:
    seen = count
    count = ___ + 1
print(count)`,
        answer: ['seen'],
        distractors: [{ text: '0', why: 'That resets the count instead of adding to it.' }],
        expectOutput: '2',
        explain: 'One after the other, nothing is lost; the trouble starts only when they overlap.',
      },
    ],
  },

  // ------------------------------------------------------------------ 10
  {
    id: 's5-10',
    title: 'Preventing lost updates',
    summary: 'Change in one atomic statement, lock the row, or check a version number and retry.',
    card: {
      title: 'Preventing lost updates',
      text: 'Three common fixes: make the change one atomic statement (`update stock set n = n - 1 where n > 0`), lock the row while you read and write it (`select … for update`), or keep a version number and only write if it has not changed (optimistic locking). Atomic statements are simplest; versions suit edits that take a person minutes. Here `store(n)` makes a stock table with one product, "pen".',
      code: `con = store(1)
sql = ("update stock set n = n - 1"
       " where sku = 'pen' and n > 0")
print(con.execute(sql).rowcount,
      con.execute(sql).rowcount)`,
      output: '1 0',
    },
    exercises: [
      {
        id: 's5-10-1',
        type: 'predict-output',
        prompt: 'Two sales, each one atomic statement, with 5 pens. What is left?',
        code: `con = store(5)
sql = ("update stock set n = n - 1"
       " where sku = 'pen'")
con.execute(sql)
con.execute(sql)
print(q(con, "select n from stock"))`,
        answer: '[(3,)]',
        typedWrong: [{ answer: '[(4,)]', why: 'Each statement reads and writes in one step: nothing is lost.' }],
        explain: 'The database does the read and the write together.',
      },
      {
        id: 's5-10-2',
        type: 'predict-output',
        prompt: 'Optimistic locking: two editors both loaded version 1. The second save checks the version. What does it update?',
        code: `con = store(5)
sql = ("update stock set n = ?,"
       " version = version + 1"
       " where sku = 'pen'"
       " and version = ?")
a = con.execute(sql, (9, 1)).rowcount
b = con.execute(sql, (7, 1)).rowcount
print(a, b)`,
        answer: '1 0',
        typedWrong: [{ answer: '1 1', why: 'After A\'s save the version is 2, so B\'s "version = 1" matches nothing.' }],
        explain: 'B sees 0 rows changed, reloads and tries again instead of overwriting.',
      },
      {
        id: 's5-10-3',
        type: 'run-code',
        prompt: 'Write `sell(con)`: lower the pen stock by one only if some are left; return True if it sold.',
        before: 'con = store(1)',
        solution: `def sell(con):
    cur = con.execute(
        "update stock set n = n - 1"
        " where sku = 'pen'"
        " and n > 0")
    return cur.rowcount == 1`,
        tests: [
          'assert sell(con) is True, "one pen: sold"',
          'assert sell(con) is False, "none left: refused"',
          'assert q(con, "select n from stock") == [(0,)], "never below zero"',
        ].join('\n'),
        maxLines: 6,
        placeholder: 'def sell(con):',
        explain: 'The condition and the change happen together: no overselling.',
      },
      {
        id: 's5-10-4',
        type: 'bucket-sort',
        prompt: 'Which fix suits each case best?',
        buckets: ['Atomic update', 'Version check'],
        items: [
          { text: 'Lowering a stock count', bucket: 0, why: 'One statement can check and change.' },
          { text: 'Two people editing one wiki page', bucket: 1, why: 'Edits take minutes; the second save must notice the first.' },
          { text: 'Adding to a like counter', bucket: 0, why: '`set likes = likes + 1` in one statement.' },
          { text: 'A form open for ten minutes', bucket: 1, why: 'Holding a lock for ten minutes would block everyone.' },
          { text: 'Taking a payment from a balance', bucket: 0, why: '`set bal = bal - ? where bal >= ?` checks and changes at once.' },
        ],
        explain: 'Short changes: atomic. Long human edits: versions.',
      },
      {
        id: 's5-10-5',
        type: 'scenario',
        prompt: 'Admins edit product descriptions in a form, sometimes for a long time. Edits get lost. What do you add?',
        situation: 'Two admins open the same product; both save; the first person\'s changes vanish.',
        needs: ['No silent overwrites', 'Do not block other admins while a form is open'],
        options: [
          {
            text: 'A version column, checked on save',
            cost: 'The second saver must reload and redo their change.',
          },
          {
            text: 'Lock the row while the form is open',
            cost: 'Others wait for as long as the form stays open.',
            why: 'That blocks other admins, against the needs.',
          },
          {
            text: 'Last save wins',
            cost: 'Nothing to build.',
            why: 'That is the silent overwrite happening today.',
          },
        ],
        answer: 0,
        explain: 'Optimistic locking: cheap when conflicts are rare, and never silent.',
      },
      {
        id: 's5-10-6',
        type: 'mcq',
        prompt: 'What does `select … for update` do?',
        options: [
          { text: 'Locks the rows it reads' },
          { text: 'Updates the rows it selects', why: 'It only reads them, holding a lock for the coming update.' },
          { text: 'Makes the query faster', why: 'It may make others wait; it is about correctness.' },
        ],
        answer: 0,
        explain: 'Others wanting the same rows wait, so no read-modify-write can interleave.',
      },
      {
        id: 's5-10-7',
        type: 'fill-blank',
        prompt: 'Never sell below zero.',
        code: `con = store(0)
cur = con.execute(
    "update stock set n = n - 1"
    " where sku = 'pen' and n ___ 0")
print(cur.rowcount)`,
        answer: ['>'],
        distractors: [{ text: '>=', why: 'With n = 0 that still sells, leaving -1.' }],
        expectOutput: '0',
        explain: 'No pens, no row changed, no sale.',
      },
      {
        id: 's5-10-8',
        type: 'order-steps',
        prompt: 'A save with optimistic locking that loses a race. Put it in order.',
        steps: [
          'Read the row and its version, 7',
          'Someone else saves: version becomes 8',
          'Write "where version = 7": 0 rows change',
          'Reload the row, now version 8',
          'Apply the change again and save',
        ],
        explain: 'No lock held while the person thinks; conflicts are detected, not prevented.',
      },
    ],
  },

  // ------------------------------------------------------------------ 11
  {
    id: 's5-11',
    title: 'Checkpoint: databases',
    summary: 'Keys, joins, store types, indexes, normalising, transactions and isolation, mixed.',
    checkpoint: true,
    card: {
      title: 'Checkpoint',
      text: 'Ten questions across the unit. Get 8 right first time to test out.',
    },
    exercises: [
      {
        id: 's5-11-1',
        type: 'predict-output',
        prompt: 'What does this print?',
        code: `con = shop()
print(q(con, """
  select count(*) from orders o
  join users u on u.id = o.user_id
  where u.city = 'Lisbon'"""))`,
        answer: '[(3,)]',
        typedWrong: [{ answer: '[(2,)]', why: 'Ana has two orders and Cy one: three Lisbon orders.' }],
        explain: 'Join, then filter on the user\'s city.',
      },
      {
        id: 's5-11-2',
        type: 'bucket-sort',
        prompt: 'Which store fits best?',
        buckets: ['Key-value', 'Relational', 'Wide-column'],
        items: [
          { text: 'Shopping carts by session id', bucket: 0, why: 'Fetched whole by one key.' },
          { text: 'Invoices with strict totals and reports', bucket: 1, why: 'Transactions, joins, constraints.' },
          { text: 'A billion log events a day by service and time', bucket: 2, why: 'Huge writes, read by key and time range.' },
          { text: 'Feature flags read on every request', bucket: 0, why: 'Tiny, read constantly by name.' },
          { text: 'Users, orders and payments', bucket: 1, why: 'Related records that must stay consistent.' },
        ],
        explain: 'The access pattern picks the store.',
      },
      {
        id: 's5-11-3',
        type: 'predict-output',
        prompt: 'What plan does SQLite choose?',
        code: `con = shop()
con.execute("create index c"
            " on users(city, name)")
print(plan(con, "select * from users"
                " where name = 'Bo'"))`,
        answer: 'SCAN users',
        options: [
          { text: 'SCAN users' },
          { text: 'SEARCH users USING INDEX c', why: 'name is not the leftmost column of the index.' },
        ],
        explain: 'The leftmost-prefix rule.',
      },
      {
        id: 's5-11-4',
        type: 'estimate',
        prompt: '8,000 inserts a second into a table with 5 indexes. Index updates per second?',
        expr: '8000 * 5',
        answer: 40000,
        tolerance: 1.5,
        unit: 'updates/s',
        work: ['8,000 × 5 = 40,000'],
        explain: 'Drop indexes no query uses.',
      },
      {
        id: 's5-11-5',
        type: 'predict-output',
        prompt: 'A crash inside a transaction. What do the balances show?',
        code: `con = bank()
try:
    with con:
        move(con, "a", -100)
        1 / 0
except ZeroDivisionError:
    pass
print(bal(con))`,
        answer: "{'a': 100, 'b': 0}",
        typedWrong: [{ answer: "{'a': 0, 'b': 0}", why: 'The error rolled the transaction back.' }],
        explain: 'Atomic.',
      },
      {
        id: 's5-11-6',
        type: 'scenario',
        prompt: 'Concert tickets: thousands try to buy the last 100 at once. How do you decrement the count?',
        situation: 'Each purchase must lower the "left" count, and the count must never go below zero.',
        needs: ['Never oversell', 'Handle thousands of attempts a second'],
        options: [
          {
            text: 'Atomic update "where left > 0"',
            cost: 'Each attempt contends for the same row briefly.',
          },
          {
            text: 'Read the count, then write count − 1',
            cost: 'Two statements per attempt.',
            why: 'Overlapping read-then-write cycles lose updates and oversell.',
          },
          {
            text: 'Recount sales nightly',
            cost: 'A nightly job.',
            why: 'Overselling happens long before the recount.',
          },
        ],
        answer: 0,
        explain: 'Check and change in one statement; rowcount tells you if it worked.',
      },
      {
        id: 's5-11-7',
        type: 'match-pairs',
        prompt: 'Match each problem to its fix.',
        pairs: [
          { left: 'Slow lookups by email', right: 'an index on email', why: 'Turns a scan into a search.' },
          { left: 'Half-finished transfers', right: 'a transaction', why: 'All or nothing.' },
          { left: 'Lost stock updates', right: 'an atomic update', why: 'Read and write in one step.' },
          { left: 'Silent overwrites of long edits', right: 'a version check', why: 'The second save notices.' },
        ],
        explain: 'Each tool has its problem.',
      },
      {
        id: 's5-11-8',
        type: 'predict-output',
        prompt: 'Overlapping updates, interleaved. What is the final count?',
        code: `likes = 10
a = likes
b = likes
likes = a + 1
likes = b + 1
print(likes)`,
        answer: '11',
        typedWrong: [{ answer: '12', why: 'B wrote 10 + 1 over A\'s 11.' }],
        explain: 'Use `set likes = likes + 1` in one statement.',
      },
      {
        id: 's5-11-9',
        type: 'diagram',
        prompt: 'Profiles, orders and payments in one relational DB; sessions in a key-value store. Which box should hold payments?',
        diagram: {
          nodes: [
            { id: 'a', kind: 'service', label: 'App' },
            { id: 'k', kind: 'cache', label: 'Sessions KV' },
            { id: 'r', kind: 'db', label: 'Relational' },
            { id: 'o', kind: 'store', label: 'File store' },
          ],
          edges: [
            { from: 'a', to: 'k' },
            { from: 'a', to: 'r' },
            { from: 'a', to: 'o' },
          ],
        },
        goal: {
          kind: 'tap',
          answer: 'r',
          why: {
            a: 'The app processes payments; it must not be where they are stored.',
            k: 'A key-value store lacks the transactions and constraints money needs.',
            o: 'Object storage is for files, not transactional records.',
          },
        },
        explain: 'Money needs transactions and constraints.',
      },
      {
        id: 's5-11-10',
        type: 'mcq',
        prompt: 'Order rows store the unit price at purchase. Is that harmful denormalisation?',
        options: [
          { text: 'No: price paid is its own fact' },
          { text: 'Yes: always join to products', why: 'Then past orders would change when prices change.' },
          { text: 'Yes: prices must be stored once', why: 'The current price and the price paid are different facts.' },
        ],
        answer: 0,
        explain: 'History is not duplication.',
      },
    ],
  },
];
