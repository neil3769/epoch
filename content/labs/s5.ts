import type { Lab } from '../schema';

const DIFFERS =
  'Runs on SQLite in the browser, in memory. Server databases such as PostgreSQL use the same SQL for all of this, add real concurrency (many connections at once) and support `select … for update` and selectable isolation levels.';

/*
 * Unit S5 labs. Lab 1: query the shop, with scaffolding (filter, join and
 * group, add an index, read the plan). Lab 2, from empty functions: safe
 * money and stock (balance, a checked transfer in a transaction, an atomic
 * multi-unit sale, optimistic save, save with retry).
 */
export const s5Labs: Lab[] = [
  {
    id: 's5-lab-1',
    title: 'Query the shop',
    intro: 'Answer questions about the shop with SQL from Python: one user\'s orders, spending per city with a join, then add an index and confirm the plan uses it.',
    summary: 'You queried with filters, joins and grouping, and made a query use an index.',
    minutes: 12,
    unlockAfter: 's5-05',
    differs: DIFFERS,
    given: 'con = shop()',
    steps: [
      {
        goal: 'Finish `orders_of(con, uid)`: the totals of that user\'s orders, in id order.',
        starter: 'def orders_of(con, uid):\n    rows = q(con, "select total"\n      " from orders where user_id = ?"\n      " order by id", ___)\n    return [r[0] for r in rows]',
        solution: 'def orders_of(con, uid):\n    rows = q(con, "select total"\n      " from orders where user_id = ?"\n      " order by id", uid)\n    return [r[0] for r in rows]',
        tests: [
          'assert orders_of(con, 1) == [20.0, 35.5], f"got {orders_of(con, 1)}"',
          'assert orders_of(con, 9) == [], "unknown user: no orders"',
        ].join('\n'),
        hints: ['Pass the user id for the ?.', 'def orders_of(con, uid):\n    rows = q(con, "select total"\n      " from orders where user_id = ?"\n      " order by id", ___)\n    return [r[0] for r in rows]'],
      },
      {
        goal: 'Finish `spend_by_city(con)`: a dict from city to the total of its users\' orders.',
        starter: 'def spend_by_city(con):\n    rows = q(con, """\n      select u.city, sum(o.total)\n      from users u join orders o\n        on o.user_id = u.id\n      group by ___""")\n    return dict(rows)',
        solution: 'def spend_by_city(con):\n    rows = q(con, """\n      select u.city, sum(o.total)\n      from users u join orders o\n        on o.user_id = u.id\n      group by u.city""")\n    return dict(rows)',
        tests: 'assert spend_by_city(con) == {"Lisbon": 63.5, "Porto": 12.0}, f"got {spend_by_city(con)}"',
        hints: ['One row per city.', 'def spend_by_city(con):\n    rows = q(con, """\n      select u.city, sum(o.total)\n      from users u join orders o\n        on o.user_id = u.id\n      group by ___""")\n    return dict(rows)'],
        explain: 'Lisbon: Ana 55.5 + Cy 8.0.',
      },
      {
        goal: 'Finish `add_index(con)`: create an index named `by_day` on the orders\' `day` column.',
        starter: 'def add_index(con):\n    con.execute("create index by_day"\n                " on orders(___)")',
        solution: 'def add_index(con):\n    con.execute("create index by_day"\n                " on orders(day)")',
        tests: [
          'add_index(con)',
          'p = plan(con, "select * from orders where day = \'tue\'")',
          'assert p == "SEARCH orders USING INDEX by_day", f"got {p!r}"',
        ].join('\n'),
        hints: ['Index the column you filter by.', 'def add_index(con):\n    con.execute("create index by_day"\n                " on orders(___)")'],
      },
      {
        goal: 'Finish `is_search(con, sql)`: True if SQLite\'s plan for the query starts with SEARCH.',
        starter: 'def is_search(con, sql):\n    return plan(con, sql).startswith(\n        ___)',
        solution: 'def is_search(con, sql):\n    return plan(con, sql).startswith(\n        "SEARCH")',
        tests: [
          'con.execute("create index if not exists by_day on orders(day)")',
          'assert is_search(con, "select * from orders where day = \'mon\'"), "by_day is used"',
          'assert not is_search(con, "select * from orders where total > 10"), "total has no index"',
        ].join('\n'),
        hints: ['SCAN reads everything; SEARCH uses an index.', 'def is_search(con, sql):\n    return plan(con, sql).startswith(\n        ___)'],
        explain: 'A check like this can run in tests, so a slow query never ships unnoticed.',
      },
    ],
  },
  {
    id: 's5-lab-2',
    title: 'Safe money and stock',
    intro: 'Write the code that keeps money and stock correct, each piece from an empty function: a balance, a checked transfer in one transaction, an atomic sale, and optimistic saves with a retry.',
    summary: 'You wrote transfers, sales and saves that cannot lose or invent money or stock.',
    minutes: 18,
    unlockAfter: 's5-10',
    differs: DIFFERS,
    steps: [
      {
        goal: 'Write `balance(con, acct)`: the balance of one account.',
        starter: 'def balance(con, acct):\n    pass',
        solution: 'def balance(con, acct):\n    r = q(con, "select bal from acct"\n          " where id = ?", acct)\n    return r[0][0]',
        tests: 'assert balance(bank(), "a") == 100, f"got {balance(bank(), \'a\')}"',
        hints: ['One row, one column.', 'def balance(con, acct):\n    r = q(con, "select bal from acct"\n          " where id = ?", ___)\n    return r[0][0]'],
      },
      {
        goal: 'Write `transfer(con, src, dst, amt)`: in one transaction, raise `ValueError` if `src` has less than `amt`, otherwise move it.',
        starter: 'def transfer(con, src, dst, amt):\n    pass',
        solution: 'def transfer(con, src, dst, amt):\n    with con:\n        if balance(con, src) < amt:\n            raise ValueError("funds")\n        move(con, src, -amt)\n        move(con, dst, amt)',
        tests: [
          'c = bank()',
          'transfer(c, "a", "b", 60)',
          'assert bal(c) == {"a": 40, "b": 60}, f"got {bal(c)}"',
          'try:',
          '    transfer(c, "a", "b", 50)',
          '    raise AssertionError("should refuse: only 40 left")',
          'except ValueError:',
          '    pass',
          'assert bal(c) == {"a": 40, "b": 60}, "a refused transfer changes nothing"',
        ].join('\n'),
        hints: [
          'Check inside the transaction, then two updates.',
          'def transfer(con, src, dst, amt):\n    with con:\n        if balance(con, src) < ___:\n            raise ValueError("funds")\n        move(con, src, -amt)\n        move(con, dst, amt)',
        ],
        explain: 'Checking inside the transaction means the balance cannot change between check and move.',
      },
      {
        goal: 'Write `sell(con, k)`: sell `k` pens in one atomic statement only if at least `k` are left; return True if it sold.',
        starter: 'def sell(con, k):\n    pass',
        solution: 'def sell(con, k):\n    cur = con.execute(\n        "update stock set n = n - ?"\n        " where sku = \'pen\'"\n        " and n >= ?", (k, k))\n    return cur.rowcount == 1',
        tests: [
          'c = store(5)',
          'assert sell(c, 3) is True and sell(c, 3) is False, "3 of 5 sold, then only 2 left"',
          'assert q(c, "select n from stock") == [(2,)], f"got {q(c, \'select n from stock\')}"',
        ].join('\n'),
        hints: [
          'Put the "enough left" test in the WHERE clause.',
          'def sell(con, k):\n    cur = con.execute(\n        "update stock set n = n - ?"\n        " where sku = \'pen\'"\n        " and n >= ?", (k, ___))\n    return cur.rowcount == 1',
        ],
      },
      {
        goal: 'Write `save(con, n, version)`: set the pen stock to `n` and bump the version, only if the version is still `version`; return True if it saved.',
        starter: 'def save(con, n, version):\n    pass',
        solution: 'def save(con, n, version):\n    cur = con.execute(\n        "update stock set n = ?,"\n        " version = version + 1"\n        " where sku = \'pen\'"\n        " and version = ?",\n        (n, version))\n    return cur.rowcount == 1',
        tests: [
          'c = store(5)',
          'assert save(c, 9, 1) is True, "first save at version 1"',
          'assert save(c, 7, 1) is False, "version is now 2: refused"',
          'assert q(c, "select n, version from stock") == [(9, 2)], "the first save stands"',
        ].join('\n'),
        hints: [
          'The version goes in the WHERE clause and is bumped in SET.',
          'def save(con, n, version):\n    cur = con.execute(\n        "update stock set n = ?,"\n        " version = version + 1"\n        " where sku = \'pen\'"\n        " and version = ?",\n        (n, ___))\n    return cur.rowcount == 1',
        ],
      },
      {
        goal: 'Write `save_retry(con, change, tries=3)`: read `n` and `version`, try `save(con, change(n), version)`, and on a conflict reread and try again; return the final `n`, or raise `RuntimeError` after `tries` failures.',
        starter: 'def save_retry(con, change, tries=3):\n    pass',
        solution: 'def save_retry(con, change, tries=3):\n    for _ in range(tries):\n        r = q(con, "select n, version"\n              " from stock")\n        n, v = r[0]\n        if save(con, change(n), v):\n            return change(n)\n    raise RuntimeError("conflict")',
        tests: [
          'c = store(5)',
          'assert save_retry(c, lambda n: n + 2) == 7, "5 + 2"',
          'calls = []',
          'def nosy(n):',
          '    if not calls:',
          '        calls.append(1)',
          '        c.execute("update stock set version = version + 1")',
          '    return n * 2',
          'assert save_retry(c, nosy) == 14, "the first try loses a race, the retry sees 7 and saves 14"',
        ].join('\n'),
        hints: [
          'Loop: read, change, save; stop when save returns True.',
          'def save_retry(con, change, tries=3):\n    for _ in range(tries):\n        r = q(con, "select n, version"\n              " from stock")\n        n, v = r[0]\n        if save(con, change(n), ___):\n            return change(n)\n    raise RuntimeError("conflict")',
        ],
        explain: 'This loop is how ORMs and APIs handle optimistic conflicts.',
      },
    ],
  },
];
