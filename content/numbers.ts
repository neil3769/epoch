/*
 * The Numbers page: rough orders of magnitude for back-of-envelope
 * estimates. It is open from the start in the Library, and every `estimate`
 * exercise uses these same values: the verifier runs NUMBERS_PY before each
 * expression and rejects a literal that should have been a name from here.
 */

export interface NumberRow {
  /** Python name available in estimate expressions. */
  name: string;
  value: number;
  /** How the page shows it. */
  shown: string;
  what: string;
  /** Reject this value written as a literal in an estimate expression. */
  strict?: boolean;
}

export interface NumberSection {
  title: string;
  note?: string;
  rows: NumberRow[];
}

const DAY = 86_400;
const YEAR = 365 * DAY;

export const NUMBER_SECTIONS: NumberSection[] = [
  {
    title: 'Powers of two',
    note: 'Each step of 2¹⁰ is about a thousand times bigger.',
    rows: [
      { name: 'KIB', value: 2 ** 10, shown: '2¹⁰ = 1,024', what: 'about a thousand' },
      { name: 'MIB', value: 2 ** 20, shown: '2²⁰ ≈ 1.05 million', what: 'about a million' },
      { name: 'GIB', value: 2 ** 30, shown: '2³⁰ ≈ 1.07 billion', what: 'about a billion' },
      { name: 'TIB', value: 2 ** 40, shown: '2⁴⁰ ≈ 1.1 trillion', what: 'about a trillion' },
    ],
  },
  {
    title: 'Sizes',
    note: 'Decimal units, as disks and networks are sold.',
    rows: [
      { name: 'KB', value: 1e3, shown: '1 KB = 10³ bytes', what: 'a short text message' },
      { name: 'MB', value: 1e6, shown: '1 MB = 10⁶ bytes', what: 'a book as plain text' },
      { name: 'GB', value: 1e9, shown: '1 GB = 10⁹ bytes', what: 'a third of an hour of HD video' },
      { name: 'TB', value: 1e12, shown: '1 TB = 10¹² bytes', what: 'a large laptop disk' },
      { name: 'PB', value: 1e15, shown: '1 PB = 10¹⁵ bytes', what: 'a thousand of those disks' },
    ],
  },
  {
    title: 'Time',
    note: 'For mental arithmetic, a day is about 10⁵ seconds.',
    rows: [
      { name: 'MINUTE', value: 60, shown: '60 s', what: 'a minute' },
      { name: 'HOUR', value: 3_600, shown: '3,600 s', what: 'an hour', strict: true },
      { name: 'DAY', value: DAY, shown: '86,400 s ≈ 10⁵', what: 'a day', strict: true },
      { name: 'MONTH', value: 30 * DAY, shown: '2.6 million s', what: 'a 30-day month', strict: true },
      { name: 'YEAR', value: YEAR, shown: '31.5 million s ≈ 3 × 10⁷', what: 'a year', strict: true },
    ],
  },
  {
    title: 'Latency',
    note: 'Orders of magnitude from Jeff Dean\'s widely copied table; current hardware is faster for some rows, but the gaps between rows still hold.',
    rows: [
      { name: 'RAM_READ', value: 100e-9, shown: '100 ns', what: 'read from main memory', strict: true },
      { name: 'SSD_READ', value: 150e-6, shown: '150 µs', what: 'random 4 KB read from an SSD', strict: true },
      { name: 'DC_ROUND_TRIP', value: 0.5e-3, shown: '0.5 ms', what: 'round trip inside a data centre', strict: true },
      { name: 'DISK_SEEK', value: 10e-3, shown: '10 ms', what: 'a spinning-disk seek', strict: true },
      { name: 'WORLD_ROUND_TRIP', value: 150e-3, shown: '150 ms', what: 'California to the Netherlands and back', strict: true },
    ],
  },
  {
    title: 'Availability',
    note: 'Allowed downtime = (1 − availability) × time.',
    rows: [
      { name: 'NINES_2', value: 0.99, shown: '99%', what: 'about 3.7 days down a year' },
      { name: 'NINES_3', value: 0.999, shown: '99.9%', what: 'about 8.8 hours a year, 43 minutes a month' },
      { name: 'NINES_4', value: 0.9999, shown: '99.99%', what: 'about 53 minutes a year' },
      { name: 'NINES_5', value: 0.99999, shown: '99.999%', what: 'about 5 minutes a year' },
    ],
  },
  {
    title: 'Typical sizes',
    note: 'Round assumptions used in this app\'s exercises; real values vary a lot.',
    rows: [
      { name: 'RECORD', value: 1e3, shown: '1 KB', what: 'a short post with its metadata' },
      { name: 'IMAGE', value: 300e3, shown: '300 KB', what: 'a photo resized for the web' },
      { name: 'VIDEO_MINUTE', value: 50e6, shown: '50 MB', what: 'a minute of HD video (about 3 GB an hour)' },
    ],
  },
];

export const NUMBER_SOURCES: { title: string; url: string }[] = [
  { title: 'Latency numbers every programmer should know (Jeff Dean and Peter Norvig, collected)', url: 'https://gist.github.com/jboner/2841832' },
  { title: 'Peter Norvig, Teach Yourself Programming in Ten Years (timing table)', url: 'https://norvig.com/21-days.html' },
  { title: 'Netflix Help Center: how much data Netflix uses (HD about 3 GB per hour)', url: 'https://help.netflix.com/en/node/87' },
];

export const NUMBER_ROWS: NumberRow[] = NUMBER_SECTIONS.flatMap((s) => s.rows);

/** The same values as Python assignments, run before every estimate expression. */
export const NUMBERS_PY = NUMBER_ROWS.map((r) => `${r.name} = ${r.value}`).join('\n');
