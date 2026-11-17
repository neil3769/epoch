import { useState } from 'react';
import type { ExerciseOf } from '../../content/schema';
import { Inline } from '../components/Text';
import { Diagram, type NodeMark } from '../figures/Diagram';
import { formatNumber, parseAmount, withinFactor } from '../lib/estimate';
import { shuffled } from './choice';
import type { ExProps, ExerciseKind, Grade } from './types';

/*
 * The system design exercise types: estimate, order-steps, bucket-sort,
 * scenario and diagram. Each gives a reason for every wrong choice.
 */

// ------------------------------------------------------------- estimate ---

type EstimateValue = number | string;

function Working({ lines }: { lines: string[] }) {
  return (
    <div className="working" aria-label="Working">
      <div className="working-label">Working</div>
      {lines.map((l, i) => (
        <div key={i} className="working-line">
          <Inline text={l} />
        </div>
      ))}
    </div>
  );
}

function Estimate({ ex, value, onChange, locked }: ExProps<ExerciseOf<'estimate'>, EstimateValue>) {
  const [order] = useState(() => (ex.options ? ex.options.map((_, i) => i) : []));
  return (
    <>
      {ex.options ? (
        <div className="choices" role="radiogroup">
          {order.map((i) => {
            const o = ex.options![i];
            const picked = value === i;
            const right = withinFactor(o.value, ex.answer, ex.tolerance);
            const state = locked ? (right ? 'right' : picked ? 'wrong' : '') : picked ? 'picked' : '';
            return (
              <button key={i} type="button" role="radio" aria-checked={picked} className={`choice ${state}`} disabled={locked} onClick={() => onChange(i)}>
                ≈ {formatNumber(o.value)} {ex.unit}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="typed estimate-typed">
          <label className="typed-label" htmlFor="estimate-answer">
            Your estimate ({ex.unit})
          </label>
          <input
            id="estimate-answer"
            className="code-input"
            inputMode="decimal"
            value={(value as string) ?? ''}
            disabled={locked}
            placeholder="e.g. 1200 or 1.2k"
            autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
          />
          <p className="hint-line">Within {ex.tolerance === 2 ? 'a factor of 2' : `× ${ex.tolerance}`} counts. You can write k, M or B.</p>
        </div>
      )}
      {locked && <Working lines={ex.work} />}
    </>
  );
}

export const estimate: ExerciseKind<'estimate', EstimateValue> = {
  Component: Estimate,
  ready: (ex, v) => (ex.options ? typeof v === 'number' : typeof v === 'string' && parseAmount(v) !== null),
  grade: (ex, v): Grade => {
    const got = ex.options ? ex.options[v as number].value : parseAmount(String(v))!;
    if (withinFactor(got, ex.answer, ex.tolerance)) return { correct: true, message: ex.explain };
    const why = ex.options?.[v as number]?.why;
    const dir = got > ex.answer ? 'too high' : 'too low';
    const ratio = got > ex.answer ? got / ex.answer : ex.answer / got;
    return {
      correct: false,
      message: why ?? `That is ${dir}, about ${formatNumber(ratio, 2)} times off. The working shows each step.`,
      answer: `≈ ${formatNumber(ex.answer)} ${ex.unit}`,
    };
  },
};

// ---------------------------------------------------------- order steps ---

function OrderSteps({ ex, value, onChange, locked }: ExProps<ExerciseOf<'order-steps'>, number[]>) {
  const [bank] = useState(() => {
    const idx = ex.steps.map((_, i) => i);
    let s = shuffled(idx);
    while (s.every((x, i) => x === i)) s = shuffled(idx);
    return s;
  });
  const placed = value ?? [];
  return (
    <>
      <ol className="program steps-program" aria-label="Your order">
        {ex.steps.map((_, slot) => {
          const si = placed[slot];
          if (si === undefined)
            return (
              <li key={slot} className="pline empty">
                <span>{slot === placed.length ? 'tap a step below' : ' '}</span>
              </li>
            );
          const right = locked && si === slot;
          return (
            <li key={slot}>
              <button
                type="button"
                className={`pline placed prose${locked ? (right ? ' right' : ' wrong') : ''}`}
                disabled={locked}
                onClick={() => onChange(placed.filter((_, j) => j !== slot))}
              >
                <span className="step-n">{slot + 1}</span>
                <Inline text={ex.steps[si]} />
              </button>
            </li>
          );
        })}
      </ol>
      <div className="bank bank-lines" aria-label="Steps">
        {bank
          .filter((i) => !placed.includes(i))
          .map((i) => (
            <button key={i} type="button" className="token line-token prose" disabled={locked} onClick={() => onChange([...placed, i])}>
              <Inline text={ex.steps[i]} />
            </button>
          ))}
      </div>
    </>
  );
}

export const orderSteps: ExerciseKind<'order-steps', number[]> = {
  Component: OrderSteps,
  ready: (ex, v) => !!v && v.length === ex.steps.length,
  grade: (ex, v) =>
    v.every((si, i) => si === i)
      ? { correct: true, message: ex.explain }
      : { correct: false, message: ex.explain, answer: ex.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') },
};

// ---------------------------------------------------------- bucket sort ---

function BucketSort({ ex, value, onChange, locked }: ExProps<ExerciseOf<'bucket-sort'>, (number | null)[]>) {
  const [order] = useState(() => shuffled(ex.items.map((_, i) => i)));
  const picks = value ?? ex.items.map(() => null);
  return (
    <div className="buckets">
      {order.map((i) => {
        const it = ex.items[i];
        const pick = picks[i];
        return (
          <div key={i} className={`bucket-item${locked ? (pick === it.bucket ? ' right' : ' wrong') : ''}`}>
            <p className="bucket-text">
              <Inline text={it.text} />
            </p>
            <div className="bucket-choices" role="radiogroup" aria-label={it.text}>
              {ex.buckets.map((b, bi) => {
                const on = pick === bi;
                const state = locked ? (bi === it.bucket ? ' right' : on ? ' wrong' : '') : on ? ' on' : '';
                return (
                  <button
                    key={bi}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`bucket-btn${state}`}
                    disabled={locked}
                    onClick={() => {
                      const next = picks.slice();
                      next[i] = bi;
                      onChange(next);
                    }}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
            {locked && pick !== it.bucket && (
              <p className="bucket-why">
                <Inline text={it.why} />
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const bucketSort: ExerciseKind<'bucket-sort', (number | null)[]> = {
  Component: BucketSort,
  ready: (_ex, v) => !!v && v.every((x) => x !== null),
  grade: (ex, v) => {
    const wrong = ex.items.filter((it, i) => v[i] !== it.bucket);
    if (!wrong.length) return { correct: true, message: ex.explain ?? 'All sorted.' };
    return { correct: false, message: `${wrong.length} misplaced: the reason is under each one. ${ex.explain ?? ''}`.trim() };
  },
};

// ------------------------------------------------------------- scenario ---

function Scenario({ ex, value, onChange, locked }: ExProps<ExerciseOf<'scenario'>, number>) {
  const [order] = useState(() => shuffled(ex.options.map((_, i) => i)));
  return (
    <>
      <div className="situation">
        <p>
          <Inline text={ex.situation} />
        </p>
        <ul className="needs">
          {ex.needs.map((n) => (
            <li key={n}>
              <Inline text={n} />
            </li>
          ))}
        </ul>
      </div>
      {ex.diagram && <Diagram spec={ex.diagram} />}
      <div className="choices" role="radiogroup">
        {order.map((i) => {
          const o = ex.options[i];
          const picked = value === i;
          const state = locked ? (i === ex.answer ? 'right' : picked ? 'wrong' : '') : picked ? 'picked' : '';
          return (
            <button key={i} type="button" role="radio" aria-checked={picked} className={`choice option-cost ${state}`} disabled={locked} onClick={() => onChange(i)}>
              <span className="opt-text">
                <Inline text={o.text} />
              </span>
              <span className="opt-cost">
                Cost: <Inline text={o.cost} />
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export const scenario: ExerciseKind<'scenario', number> = {
  Component: Scenario,
  grade: (ex, v) =>
    v === ex.answer
      ? { correct: true, message: ex.explain }
      : { correct: false, message: ex.options[v].why, answer: ex.options[ex.answer].text },
};

// -------------------------------------------------------------- diagram ---

type DiagramValue = string | string[] | number;

function DiagramEx({ ex, value, onChange, locked }: ExProps<ExerciseOf<'diagram'>, DiagramValue>) {
  const g = ex.goal;
  const marks: Record<string, NodeMark> = {};
  const badges: Record<string, string> = {};

  if (g.kind === 'tap') {
    const v = value as string | undefined;
    if (v) marks[v] = locked ? (v === g.answer ? 'right' : 'wrong') : 'picked';
    if (locked && v !== g.answer) marks[g.answer] = 'right';
    return <Diagram spec={ex.diagram} marks={marks} onTap={locked ? undefined : (id) => onChange(id)} />;
  }

  if (g.kind === 'path') {
    const v = (value as string[] | undefined) ?? [];
    v.forEach((id, i) => {
      badges[id] = badges[id] ? `${badges[id]},${i + 1}` : String(i + 1);
      marks[id] = locked ? (g.answer[i] === id ? 'right' : 'wrong') : 'picked';
    });
    return (
      <>
        <Diagram
          spec={ex.diagram}
          marks={marks}
          badges={badges}
          onTap={locked || v.length >= g.answer.length ? undefined : (id) => onChange([...v, id])}
        />
        <div className="dg-path-row">
          <span className="muted small">
            {v.length} of {g.answer.length} tapped
          </span>
          {!locked && v.length > 0 && (
            <button type="button" className="btn btn-small" onClick={() => onChange(v.slice(0, -1))}>
              Undo
            </button>
          )}
        </div>
      </>
    );
  }

  const v = value as number | undefined;
  marks[g.slot] = 'slot';
  const fill = v !== undefined ? g.options[v] : undefined;
  return (
    <>
      <Diagram spec={ex.diagram} marks={marks} slotFill={fill ? { kind: fill.kind, label: fill.label } : undefined} />
      <div className="choices" role="radiogroup">
        {g.options.map((o, i) => {
          const picked = v === i;
          const state = locked ? (i === g.answer ? 'right' : picked ? 'wrong' : '') : picked ? 'picked' : '';
          return (
            <button key={i} type="button" role="radio" aria-checked={picked} className={`choice ${state}`} disabled={locked} onClick={() => onChange(i)}>
              {o.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

export const diagram: ExerciseKind<'diagram', DiagramValue> = {
  Component: DiagramEx,
  ready: (ex, v) => {
    if (ex.goal.kind === 'path') return Array.isArray(v) && v.length === ex.goal.answer.length;
    return v !== undefined;
  },
  grade: (ex, v) => {
    const g = ex.goal;
    const label = (id: string) => ex.diagram.nodes.find((n) => n.id === id)?.label ?? id;
    if (g.kind === 'tap')
      return v === g.answer ? { correct: true, message: ex.explain } : { correct: false, message: g.why[v as string] ?? ex.explain, answer: label(g.answer) };
    if (g.kind === 'path') {
      const ok = (v as string[]).every((id, i) => id === g.answer[i]);
      return ok ? { correct: true, message: ex.explain } : { correct: false, message: ex.explain, answer: g.answer.map(label).join(' → ') };
    }
    return v === g.answer
      ? { correct: true, message: ex.explain }
      : { correct: false, message: g.options[v as number].why ?? ex.explain, answer: g.options[g.answer].label };
  },
};
