import type { Lab } from '../schema';

/*
 * Unit S14 lab, from empty functions: the back-of-envelope arithmetic an
 * interview needs, and a pacing check for the 35 minutes.
 */
export const s14Labs: Lab[] = [
  {
    id: 's14-lab-1',
    title: 'Interview arithmetic',
    intro: 'From empty functions: the estimates every design interview asks for (requests a second, peaks, storage, servers) and a pacing check that tells you which step ran over.',
    summary: 'You wrote the estimates and the pacing check you will use in every design interview.',
    minutes: 12,
    unlockAfter: 's14-05',
    steps: [
      {
        goal: 'Write `per_second(per_day)`: the average rate, given a count per day (86,400 seconds).',
        starter: 'def per_second(per_day):\n    pass',
        solution: 'def per_second(per_day):\n    return per_day / 86_400',
        tests: [
          'assert round(per_second(86_400_000)) == 1000, f"got {per_second(86_400_000)}"',
          'assert round(per_second(100e6)) == 1157, "100 million a day"',
        ].join('\n'),
        hints: ['Divide by the seconds in a day.', 'def per_second(per_day):\n    return per_day / ___'],
      },
      {
        goal: 'Write `peak(avg, factor)`: the peak rate, `factor` times the average, rounded up to a whole number.',
        starter: 'def peak(avg, factor):\n    pass',
        solution: 'import math\n\ndef peak(avg, factor):\n    return math.ceil(avg * factor)',
        tests: [
          'assert peak(1157.4, 3) == 3473, f"got {peak(1157.4, 3)}"',
          'assert peak(100, 2) == 200, "exact"',
        ].join('\n'),
        hints: ['Multiply, then round up with math.ceil.', 'import math\n\ndef peak(avg, factor):\n    return math.___(avg * factor)'],
      },
      {
        goal: 'Write `storage_tb(per_day, size, years)`: terabytes (10¹² bytes) for `per_day` items of `size` bytes kept for `years` years of 365 days.',
        starter: 'def storage_tb(per_day, size, years):\n    pass',
        solution: 'def storage_tb(per_day, size, years):\n    days = 365 * years\n    total = per_day * size * days\n    return total / 1e12',
        tests: [
          'got = round(storage_tb(1e6, 500, 5), 2)',
          'assert got == 0.91, f"got {got}"',
        ].join('\n'),
        hints: ['Items × bytes × days, then divide by 10¹².', 'def storage_tb(per_day, size, years):\n    days = 365 * years\n    total = per_day * size * days\n    return total / ___'],
      },
      {
        goal: 'Write `servers(rps, cap, spare=1)`: whole servers, each handling `cap` requests a second, to carry a peak of `rps`, plus `spare` extra.',
        starter: 'def servers(rps, cap, spare=1):\n    pass',
        solution: 'import math\n\ndef servers(rps, cap, spare=1):\n    need = math.ceil(rps / cap)\n    return need + spare',
        tests: [
          'assert servers(3473, 1000) == 5, f"got {servers(3473, 1000)}"',
          'assert servers(2000, 1000, spare=0) == 2, "exactly two"',
        ].join('\n'),
        hints: [
          'Round the division up, then add the spares.',
          'import math\n\ndef servers(rps, cap, spare=1):\n    need = math.ceil(rps / cap)\n    return need + ___',
        ],
        explain: 'N+1: survive one server failing at peak.',
      },
      {
        goal: 'Write `over_budget(plan, spent)`: both map step names to minutes; return the steps where `spent` is more than `plan`, in `plan`\'s order (missing steps count as 0).',
        starter: 'def over_budget(plan, spent):\n    pass',
        solution: 'def over_budget(plan, spent):\n    out = []\n    for s, mins in plan.items():\n        if spent.get(s, 0) > mins:\n            out.append(s)\n    return out',
        tests: [
          'plan = {"requirements": 5, "estimates": 3, "design": 10}',
          'spent = {"requirements": 9, "estimates": 3}',
          'assert over_budget(plan, spent) == ["requirements"], f"got {over_budget(plan, spent)}"',
          'assert over_budget(plan, {}) == [], "nothing spent yet"',
        ].join('\n'),
        hints: [
          'Compare each planned step with what was spent.',
          'def over_budget(plan, spent):\n    out = []\n    for s, mins in plan.items():\n        if spent.get(s, 0) ___ mins:\n            out.append(s)\n    return out',
        ],
        explain: 'Check at each step change, and cut short what remains if you are behind.',
      },
    ],
  },
];
