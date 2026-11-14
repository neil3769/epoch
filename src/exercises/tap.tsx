import { useState } from 'react';
import type { ExerciseOf } from '../../content/schema';
import { CodeBlock, highlight } from '../components/Text';
import { GAP, splitLines } from '../lib/text';
import { shuffled } from './choice';
import type { ExProps, ExerciseKind } from './types';

// ----------------------------------------------------------- fill blank ---

interface FillValue {
  bank: string[];
  slots: (number | null)[];
}

function FillBlank({ ex, value, onChange, locked }: ExProps<ExerciseOf<'fill-blank'>, FillValue>) {
  const [bank] = useState(() => shuffled([...ex.answer, ...ex.distractors.map((d) => d.text)]));
  const slots = value?.slots ?? ex.answer.map(() => null);
  const used = new Set(slots.filter((s): s is number => s !== null));
  const set = (next: (number | null)[]) => onChange({ bank, slots: next });

  const place = (bi: number) => {
    const at = slots.indexOf(null);
    if (at < 0) return;
    const next = slots.slice();
    next[at] = bi;
    set(next);
  };
  const clear = (gi: number) => {
    const next = slots.slice();
    next[gi] = null;
    set(next);
  };

  let gap = 0;
  return (
    <>
      <pre className="code">
        {splitLines(ex.code).map((line, li) => {
          const parts = line.split(GAP);
          return (
            <div key={li} className="code-line">
              {parts.map((part, pi) => {
                const g = pi > 0 ? gap++ : -1;
                const tok = g >= 0 ? slots[g] : null;
                const right = locked && g >= 0 && tok !== null && bank[tok] === ex.answer[g];
                return (
                  <span key={pi}>
                    {g >= 0 && (
                      <button
                        type="button"
                        className={`gap${tok !== null ? ' filled' : ''}${locked ? (right ? ' right' : ' wrong') : ''}`}
                        disabled={locked || tok === null}
                        onClick={() => clear(g)}
                        aria-label={tok === null ? `gap ${g + 1}, empty` : `gap ${g + 1}: ${bank[tok]}, tap to remove`}
                      >
                        {tok === null ? '   ' : bank[tok]}
                      </button>
                    )}
                    {part ? highlight(part) : pi === 0 && parts.length === 1 ? ' ' : null}
                  </span>
                );
              })}
            </div>
          );
        })}
      </pre>
      <div className="bank" aria-label="Tokens">
        {bank.map((t, i) => (
          <button key={i} type="button" className="token" disabled={locked || used.has(i)} onClick={() => place(i)}>
            {t}
          </button>
        ))}
      </div>
    </>
  );
}

export const fillBlank: ExerciseKind<'fill-blank', FillValue> = {
  Component: FillBlank,
  ready: (_ex, v) => !!v && v.slots.every((s) => s !== null),
  grade: (ex, v) => {
    const tokens = v.slots.map((s) => v.bank[s!]);
    if (tokens.every((t, i) => t === ex.answer[i])) return { correct: true, message: ex.explain };
    const wrong = tokens.findIndex((t, i) => t !== ex.answer[i]);
    const d = ex.distractors.find((x) => x.text === tokens[wrong]);
    return {
      correct: false,
      message: d ? d.why : ex.explain,
      answer: ex.answer.join('  ·  '),
    };
  },
};

// ---------------------------------------------------------- order lines ---

function OrderLines({ ex, value, onChange, locked }: ExProps<ExerciseOf<'order-lines'>, number[]>) {
  const movable = ex.lines.map((l, i) => (l.fixed ? -1 : i)).filter((i) => i >= 0);
  const [bankOrder] = useState(() => {
    let s = shuffled(movable);
    // Never start in the solved order.
    while (s.length > 1 && s.every((x, i) => ex.lines[x].text === ex.lines[movable[i]].text)) s = shuffled(movable);
    return s;
  });
  const placed = value ?? [];
  let k = 0;
  return (
    <>
      <div className="program" aria-label="Your program">
        {ex.lines.map((line, i) => {
          if (line.fixed)
            return (
              <div key={i} className="pline fixed">
                <code>{highlight(line.text)}</code>
              </div>
            );
          const slot = k++;
          const li = placed[slot];
          if (li === undefined)
            return (
              <div key={i} className="pline empty">
                <span>{slot === placed.length ? 'tap a line below' : ' '}</span>
              </div>
            );
          const right = locked && ex.lines[li].text === ex.lines[movable[slot]].text;
          return (
            <button
              key={i}
              type="button"
              className={`pline placed${locked ? (right ? ' right' : ' wrong') : ''}`}
              disabled={locked}
              onClick={() => onChange(placed.filter((_, j) => j !== slot))}
            >
              <code>{highlight(ex.lines[li].text)}</code>
            </button>
          );
        })}
      </div>
      <div className="bank bank-lines" aria-label="Lines">
        {bankOrder
          .filter((i) => !placed.includes(i))
          .map((i) => (
            <button key={i} type="button" className="token line-token" disabled={locked} onClick={() => onChange([...placed, i])}>
              <code>{highlight(ex.lines[i].text)}</code>
            </button>
          ))}
      </div>
    </>
  );
}

export const orderLines: ExerciseKind<'order-lines', number[]> = {
  Component: OrderLines,
  ready: (ex, v) => !!v && v.length === ex.lines.filter((l) => !l.fixed).length,
  grade: (ex, v) => {
    const movable = ex.lines.filter((l) => !l.fixed);
    const ok = v.every((li, i) => ex.lines[li].text === movable[i].text);
    return ok
      ? { correct: true, message: ex.explain }
      : { correct: false, message: ex.explain, answer: ex.lines.map((l) => l.text).join('\n') };
  },
};

// ------------------------------------------------------------- spot bug ---

function SpotBug({ ex, value, onChange, locked }: ExProps<ExerciseOf<'spot-bug'>, number>) {
  const lines = splitLines(ex.code);
  return (
    <>
      <div className="error-box" role="note">
        <div className="error-label">Error</div>
        <pre>{ex.error}</pre>
      </div>
      <div className="code code-tappable" role="radiogroup" aria-label="Code lines">
        {lines.map((l, i) => {
          if (!l.trim()) return <div key={i} className="code-line blank">{' '}</div>;
          const picked = value === i;
          const state = locked ? (i === ex.answer ? ' right' : picked ? ' wrong' : '') : picked ? ' picked' : '';
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={picked}
              className={`code-line line-btn${state}`}
              disabled={locked}
              onClick={() => onChange(i)}
            >
              <span className="ln">{i + 1}</span>
              <span>{highlight(l)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export const spotBug: ExerciseKind<'spot-bug', number> = {
  Component: SpotBug,
  grade: (ex, v) =>
    v === ex.answer
      ? { correct: true, message: ex.explain }
      : { correct: false, message: ex.lineWhy[String(v)] ?? ex.explain, answer: `Line ${ex.answer + 1}` },
};

// ---------------------------------------------------------- match pairs ---

interface MatchValue {
  done: boolean;
  mistakes: number;
  first?: string;
}

function MatchPairs({ ex, onChange, locked }: ExProps<ExerciseOf<'match-pairs'>, MatchValue>) {
  const [lefts] = useState(() => shuffled(ex.pairs.map((_, i) => i)));
  const [rights] = useState(() => {
    // Make sure the two columns never line up row for row.
    let r = shuffled(ex.pairs.map((_, i) => i));
    while (r.some((x, k) => x === lefts[k])) r = shuffled(r);
    return r;
  });
  const [sel, setSel] = useState<{ side: 'l' | 'r'; i: number } | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [first, setFirst] = useState<string | undefined>();
  const [flash, setFlash] = useState<{ l: number; r: number; why: string } | null>(null);

  const tap = (side: 'l' | 'r', i: number) => {
    if (locked || matched.has(i)) return;
    if (!sel || sel.side === side) {
      setSel({ side, i });
      setFlash(null);
      return;
    }
    const l = side === 'l' ? i : sel.i;
    const r = side === 'r' ? i : sel.i;
    setSel(null);
    if (l === r) {
      const m = new Set(matched).add(l);
      setMatched(m);
      setFlash(null);
      if (m.size === ex.pairs.length) onChange({ done: true, mistakes, first });
    } else {
      const why = `\`${ex.pairs[l].left}\` does not go with \`${ex.pairs[r].right}\`. ${ex.pairs[l].why}`;
      setMistakes(mistakes + 1);
      setFirst(first ?? why);
      setFlash({ l, r, why });
    }
  };

  const cls = (side: 'l' | 'r', i: number) => {
    if (matched.has(i)) return ' right';
    if (flash && (side === 'l' ? flash.l : flash.r) === i) return ' wrong';
    if (sel && sel.side === side && sel.i === i) return ' picked';
    return '';
  };

  return (
    <>
      {ex.setup && <CodeBlock code={ex.setup} />}
      <div className="pairs">
        <div className="pair-col">
          {lefts.map((i) => (
            <button key={i} type="button" className={`pair-item${cls('l', i)}`} disabled={locked || matched.has(i)} onClick={() => tap('l', i)}>
              {ex.pairs[i].left}
            </button>
          ))}
        </div>
        <div className="pair-col">
          {rights.map((i) => (
            <button key={i} type="button" className={`pair-item${cls('r', i)}`} disabled={locked || matched.has(i)} onClick={() => tap('r', i)}>
              {ex.pairs[i].right}
            </button>
          ))}
        </div>
      </div>
      <p className="pair-note" aria-live="polite">
        {flash ? flash.why.replace(/`/g, '') : matched.size === ex.pairs.length ? 'All matched.' : 'Tap one on the left, then its partner on the right.'}
      </p>
    </>
  );
}

export const matchPairs: ExerciseKind<'match-pairs', MatchValue> = {
  Component: MatchPairs,
  ready: (_ex, v) => !!v?.done,
  grade: (ex, v) =>
    v.mistakes === 0
      ? { correct: true, message: ex.explain ?? 'Every pair matched first time.' }
      : { correct: false, message: v.first, answer: ex.pairs.map((p) => `${p.left} → ${p.right}`).join('\n') },
};

