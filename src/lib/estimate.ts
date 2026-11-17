/** Helpers for estimate exercises: tolerant number parsing and friendly formatting. */

/** True when `got` is within `factor` of `ref` either way (factor 2: from ref/2 to 2·ref). */
export const withinFactor = (got: number, ref: number, factor: number): boolean =>
  got > 0 && ref > 0 && got <= ref * factor * (1 + 1e-9) && got >= (ref / factor) * (1 - 1e-9);

const SUFFIX: Record<string, number> = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

/** "1200", "1,200", "1.2k", "3 M", "2e6" → number; null when it is not a positive number. */
export function parseAmount(s: string): number | null {
  const t = s.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, '');
  const m = /^(\d+(?:\.\d+)?(?:e[+-]?\d+)?)([kmbt])?$/.exec(t);
  if (!m) return null;
  const v = parseFloat(m[1]) * (m[2] ? SUFFIX[m[2]] : 1);
  return v > 0 && Number.isFinite(v) ? v : null;
}

/** 1500 → "1,500"; 2_500_000 → "2.5 million"; 0.0004 → "0.0004". */
export function formatNumber(v: number, digits = 3): string {
  const round = (x: number) => Number(x.toPrecision(digits));
  const words: [number, string][] = [
    [1e12, 'trillion'],
    [1e9, 'billion'],
    [1e6, 'million'],
  ];
  for (const [n, w] of words) if (v >= n) return `${round(v / n).toLocaleString('en-US')} ${w}`;
  return round(v).toLocaleString('en-US', { maximumFractionDigits: 10 });
}
