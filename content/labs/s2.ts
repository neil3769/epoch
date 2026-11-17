import type { Lab } from '../schema';

/*
 * Unit S2 labs. Lab 1: a capacity sheet, with scaffolding (requests per
 * second, peak, servers, storage). Lab 2, from empty functions: bandwidth,
 * downtime, chained availability, human-readable sizes, and a one-call
 * sizing sheet. All use the Numbers page names from the prelude.
 */
export const s2Labs: Lab[] = [
  {
    id: 's2-lab-1',
    title: 'A capacity sheet',
    intro: 'Turn the estimation steps into functions you can reuse in every design: requests per second, the peak, the number of servers, and storage.',
    summary: 'You wrote the core sizing functions.',
    minutes: 12,
    unlockAfter: 's2-04',
    steps: [
      {
        goal: 'Finish `rps(dau, per_user)`: average requests per second.',
        starter: 'def rps(dau, per_user):\n    return dau * per_user / ___',
        solution: 'def rps(dau, per_user):\n    return dau * per_user / DAY',
        tests: 'assert abs(rps(10e6, 20) - 2314.8) < 0.1, f"got {rps(10e6, 20)}"',
        hints: ['Divide the daily count by the seconds in a day.', 'def rps(dau, per_user):\n    return dau * per_user / ___'],
      },
      {
        goal: 'Finish `peak(avg, factor=3)`: the peak rate.',
        starter: 'def peak(avg, factor=3):\n    return avg ___ factor',
        solution: 'def peak(avg, factor=3):\n    return avg * factor',
        tests: [
          'assert peak(2000) == 6000, f"got {peak(2000)}"',
          'assert peak(500, factor=10) == 5000, "sale day"',
        ].join('\n'),
        hints: ['The peak is a multiple of the average.', 'def peak(avg, factor=3):\n    return avg ___ factor'],
      },
      {
        goal: 'Finish `servers(peak, cap, spare=1)`: enough servers of capacity `cap` for the peak, rounded up, plus spares.',
        starter: 'import math\n\ndef servers(peak, cap, spare=1):\n    n = math.___(peak / cap)\n    return n + spare',
        solution: 'import math\n\ndef servers(peak, cap, spare=1):\n    n = math.ceil(peak / cap)\n    return n + spare',
        tests: [
          'assert servers(6000, 1000) == 7, f"got {servers(6000, 1000)}"',
          'assert servers(6500, 1000) == 8, "6.5 rounds up to 7, plus a spare"',
        ].join('\n'),
        hints: ['Round up: there is no half server.', 'import math\n\ndef servers(peak, cap, spare=1):\n    n = math.___(peak / cap)\n    return n + spare'],
      },
      {
        goal: 'Finish `storage_tb(per_day, size, years, copies=3)`: terabytes needed.',
        starter: 'def storage_tb(per_day, size, years,\n               copies=3):\n    n = per_day * 365 * years\n    return n * size * ___ / TB',
        solution: 'def storage_tb(per_day, size, years,\n               copies=3):\n    n = per_day * 365 * years\n    return n * size * copies / TB',
        tests: [
          'assert abs(storage_tb(1e6, IMAGE, 1) - 328.5) < 1e-6, f"got {storage_tb(1e6, IMAGE, 1)}"',
          'assert abs(storage_tb(1e6, IMAGE, 1, copies=1) - 109.5) < 1e-6, "one copy"',
        ].join('\n'),
        hints: ['Every copy is stored in full.', 'def storage_tb(per_day, size, years,\n               copies=3):\n    n = per_day * 365 * years\n    return n * size * ___ / TB'],
        explain: 'Keep this sheet: the walkthroughs use the same steps.',
      },
    ],
  },
  {
    id: 's2-lab-2',
    title: 'More of the sheet',
    intro: 'Add the rest of the estimates, each from an empty function: bandwidth, downtime, availability of a chain, sizes people can read, and one call that sizes a whole service.',
    summary: 'You built a reusable sizing sheet for any design.',
    minutes: 15,
    unlockAfter: 's2-07',
    steps: [
      {
        goal: 'Write `gbps(rps, size)`: gigabits per second for `rps` responses of `size` bytes.',
        starter: 'def gbps(rps, size):\n    pass',
        solution: 'def gbps(rps, size):\n    return rps * size * 8 / 1e9',
        tests: 'assert abs(gbps(2000, IMAGE) - 4.8) < 1e-9, f"got {gbps(2000, IMAGE)}"',
        hints: ['Bytes per second × 8, in billions.', 'def gbps(rps, size):\n    return rps * size * ___ / 1e9'],
      },
      {
        goal: 'Write `downtime_min(avail, period)`: minutes of downtime allowed in `period` seconds.',
        starter: 'def downtime_min(avail, period):\n    pass',
        solution: 'def downtime_min(avail, period):\n    down = 1 - avail\n    return down * period / MINUTE',
        tests: 'assert round(downtime_min(NINES_3, MONTH)) == 43, f"got {downtime_min(NINES_3, MONTH)}"',
        hints: ['The unavailable share of the period, in minutes.', 'def downtime_min(avail, period):\n    down = 1 - ___\n    return down * period / MINUTE'],
      },
      {
        goal: 'Write `chain(avails)`: the availability of parts that must all be up.',
        starter: 'def chain(avails):\n    pass',
        solution: 'import math\n\ndef chain(avails):\n    return math.prod(avails)',
        tests: [
          'assert abs(chain([0.999] * 3) - 0.997002999) < 1e-9, f"got {chain([0.999] * 3)}"',
          'assert chain([]) == 1, "no parts: always up"',
        ].join('\n'),
        hints: ['Multiply them all.', 'import math\n\ndef chain(avails):\n    return math.___(avails)'],
      },
      {
        goal: 'Write `human(n)`: bytes as text with one decimal and the largest fitting unit from PB down to KB, else bytes; for example `2.5 TB` or `512 B`.',
        starter: 'def human(n):\n    pass',
        solution: 'def human(n):\n    units = [(PB, "PB"), (TB, "TB"),\n             (GB, "GB"), (MB, "MB"),\n             (KB, "KB")]\n    for size, name in units:\n        if n >= size:\n            v = n / size\n            return f"{v:.1f} {name}"\n    return f"{n:.0f} B"',
        tests: [
          'assert human(2.5e12) == "2.5 TB", f"got {human(2.5e12)!r}"',
          'assert human(328.5e12) == "328.5 TB", f"got {human(328.5e12)!r}"',
          'assert human(1.6e15) == "1.6 PB", "petabytes"',
          'assert human(512) == "512 B", "small sizes in bytes"',
        ].join('\n'),
        hints: [
          'Try units from the largest down; use the first one n reaches.',
          'def human(n):\n    units = [(PB, "PB"), (TB, "TB"),\n             (GB, "GB"), (MB, "MB"),\n             (KB, "KB")]\n    for size, name in units:\n        if n >= ___:\n            v = n / size\n            return f"{v:.1f} {name}"\n    return f"{n:.0f} B"',
        ],
      },
      {
        goal: 'Write `sheet(dau, per_user, size)`: a dict with `"avg"` and `"peak"` (3× average) requests per second, and `"tb_year"`, the terabytes a year if every request stores `size` bytes once.',
        starter: 'def sheet(dau, per_user, size):\n    pass',
        solution: 'def sheet(dau, per_user, size):\n    per_day = dau * per_user\n    avg = per_day / DAY\n    tb = per_day * size * 365 / TB\n    return {"avg": avg,\n            "peak": 3 * avg,\n            "tb_year": tb}',
        tests: [
          's = sheet(1e6, 2, IMAGE)',
          'assert abs(s["avg"] - 23.148) < 0.001, f"avg: got {s[\'avg\']}"',
          'assert abs(s["peak"] - 3 * s["avg"]) < 1e-9, "peak is 3x"',
          'assert abs(s["tb_year"] - 219.0) < 1e-6, f"tb_year: got {s[\'tb_year\']}"',
        ].join('\n'),
        hints: [
          'Requests per day first; everything follows from it.',
          'def sheet(dau, per_user, size):\n    per_day = dau * per_user\n    avg = per_day / DAY\n    tb = per_day * size * 365 / TB\n    return {"avg": avg,\n            "peak": ___ * avg,\n            "tb_year": tb}',
        ],
        explain: 'Two numbers in, the shape of the system out.',
      },
    ],
  },
];
