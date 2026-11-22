import type { LibraryPage } from '../schema';

/** Unit S14 summary page: unlocked in the Library when the unit is finished. */
export const s14Library: LibraryPage = {
  unit: 'S14',
  ideas: [
    {
      title: 'The process',
      text: 'Seven steps, said aloud as you start each: requirements, estimation, API, data model, high-level design, deep dive, bottlenecks and trade-offs. Ask before you draw: split requirements into what users can do and how well it must work, agree a short core, state assumptions when told "you decide", and write it all where the interviewer can see it.',
    },
    {
      title: 'Depth and defence',
      text: 'Go deep on the part that is hardest or most specific to this problem, and follow the interviewer\'s hints. Defend each choice in four parts: the choice, its cost, why the cost is acceptable here, and what would change your mind. When a pushback is right, agree and adjust.',
    },
    {
      title: 'Time and practice',
      text: 'Budget 35 minutes: about 5 on requirements, 3 on estimates, 5 on API and data model, 10 on the high-level design, 8 on a deep dive and 4 on bottlenecks. Think aloud, give a reason for every technology you name, and finish with what breaks first. Practise with the walkthroughs\' blank-page pass, spoken aloud, with the 35-minute timer.',
    },
  ],
  rules: [
    'Requirements before boxes.',
    'Say each step as you start it.',
    'Assume a number aloud and write it down.',
    'Deep dive where this problem is different.',
    'Choice, cost, why it is fine, what would change it.',
    'Never silent; never a name without a reason.',
    'Check the clock at each step change.',
  ],
  example: {
    code: [
      'import math',
      'per_day = 100e6',
      'avg = per_day / 86_400',
      'peak = math.ceil(avg * 3)',
      'servers = math.ceil(peak / 1000) + 1',
      'print(round(avg), peak, servers)',
    ].join('\n'),
    output: '1157 3473 5',
    notes: ['100 million requests a day is about 1,160 a second on average.', 'At three times that peak and 1,000 per server, four servers carry it; one more survives a failure.'],
  },
  mistakes: [
    { mistake: 'Drawing boxes in minute one.', fix: 'Ask about users, features and scale first.' },
    { mistake: 'Designing every feature mentioned.', fix: 'Agree a core and say what is out.' },
    { mistake: 'A deep dive into a generic load balancer.', fix: 'Go deep where this problem is hard.' },
    { mistake: '"Everyone uses it."', fix: 'Name the cost and why it is fine here.' },
    { mistake: 'Twenty minutes on the data model.', fix: 'Summarise and move on; come back if time allows.' },
  ],
  forReal:
    'Do the URL shortener walkthrough\'s blank-page pass out loud with the 35-minute timer, recording yourself if you can, then compare with the reference. Repeat with each new walkthrough as it appears, and once with a friend playing the interviewer.',
};
