import type { LibraryPage } from '../schema';
import { NUMBER_SOURCES } from '../numbers';

/** Unit S2 summary page: unlocked in the Library when the unit is finished. */
export const s2Library: LibraryPage = {
  unit: 'S2',
  ideas: [
    {
      title: 'Traffic',
      text: 'Daily users × actions each ÷ 86,400 (about 10⁵) = average per second. Separate reads from writes. Multiply by a peak factor (2 to 5, more for events) and size servers for the peak plus a spare.',
    },
    {
      title: 'Storage and bandwidth',
      text: 'Storage = items a day × size × days kept × copies (usually 3). Bandwidth = requests per second × size, × 8 for bits. Media outweighs text by hundreds of times: object storage and CDNs.',
    },
    {
      title: 'Availability',
      text: 'Downtime = (1 − availability) × time: 99.9% is about 43 minutes a month. Chains multiply availabilities; independent redundant copies multiply failure chances.',
    },
    {
      title: 'Latency',
      text: 'Memory 100 ns, SSD 150 µs, data-centre round trip 0.5 ms, disk seek 10 ms, world round trip 150 ms. Keep chatty parts together; batch calls that must cross distance.',
    },
  ],
  rules: [
    '1 million a day ≈ 12 a second.',
    'Size for the peak, plus a spare.',
    'Text ≈ 1 KB, a web photo ≈ 300 KB, HD video ≈ 50 MB a minute.',
    'Bytes × 8 = bits.',
    'Three nines ≈ 43 minutes a month; four ≈ 53 minutes a year.',
    'Never cross an ocean inside a loop.',
  ],
  example: {
    code: [
      'dau, per_user = 10e6, 20',
      'avg = dau * per_user / DAY',
      'peak = 3 * avg',
      'tb = dau * IMAGE * 365 / TB',
      'print(round(avg), round(peak),',
      '      round(tb))',
    ].join('\n'),
    output: '2315 6944 1095',
    notes: [
      'Average and peak requests per second.',
      'One photo per user per day: about a petabyte a year before copies.',
    ],
  },
  mistakes: [
    { mistake: 'Sizing for the average.', fix: 'Size for the peak and add a spare.' },
    { mistake: 'Forgetting copies.', fix: 'Multiply storage by 3.' },
    { mistake: 'Mixing bits and bytes.', fix: 'Networks count bits: × 8.' },
    { mistake: 'Adding availabilities.', fix: 'Multiply for chains.' },
    { mistake: 'Spending effort on the third significant figure.', fix: 'Get the power of ten right.' },
  ],
  forReal:
    'Take a product you use daily and size it on paper in ten minutes: users, requests per second at peak, storage per year, bandwidth. Then look for its engineering blog or public figures and compare. Being within a factor of a few is a good result; the habit is what interviews test.',
  sources: NUMBER_SOURCES,
};
