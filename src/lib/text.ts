export const GAP = '___';

export const splitLines = (s: string): string[] => s.replace(/\r\n/g, '\n').split('\n');

export const countGaps = (code: string): number => code.split(GAP).length - 1;

/** Replace each ___ gap, in order, with the given tokens. */
export function fillGaps(code: string, tokens: (string | null | undefined)[]): string {
  const parts = code.split(GAP);
  return parts.reduce((acc, part, i) => (i === 0 ? part : acc + (tokens[i - 1] ?? GAP) + part), '');
}

/** Sentences in a card, ignoring periods inside `inline code`. */
export function countSentences(text: string): number {
  const plain = text.replace(/`[^`]*`/g, 'X').trim();
  if (!plain) return 0;
  return plain.split(/[.!?](?:\s+|$)/).filter((s) => s.trim().length > 0).length;
}

/**
 * iOS "smart punctuation" turns straight quotes into curly ones and -- into a
 * dash. Undo that before checking or running anything the learner typed.
 */
export function normalizeTyped(s: string): string {
  return s
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/—/g, '--')
    .replace(/–/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
    .replace(/\r\n/g, '\n');
}

const squash = (s: string) => normalizeTyped(s).replace(/\s+/g, '');

/** Does a typed answer match the expected printed output? */
export function outputMatches(typed: string, expected: string): boolean {
  const a = normalizeTyped(typed).trim();
  const b = expected.trim();
  if (a === b) return true;
  if (squash(a) === squash(b)) return true;
  const na = Number(a);
  const nb = Number(b);
  return a !== '' && b !== '' && Number.isFinite(na) && Number.isFinite(nb) && na === nb;
}
