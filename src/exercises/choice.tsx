import { useRef, useState } from 'react';
import type { ExerciseOf, Option } from '../../content/schema';
import { CodeBlock, Inline } from '../components/Text';
import { NumberPad, SymbolKeys, codeInputProps } from '../components/Keys';
import { canonicalShape } from '../lib/shapes';
import { normalizeTyped, outputMatches } from '../lib/text';
import type { ExProps, ExerciseKind, Grade } from './types';

export function shuffled<T>(xs: T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ------------------------------------------------------------- choices ---

function Choices({
  options,
  correct,
  value,
  onChange,
  locked,
  mono,
}: {
  options: Option[];
  correct: number;
  value: number | undefined;
  onChange: (i: number) => void;
  locked: boolean;
  mono: boolean;
}) {
  const [order] = useState(() => shuffled(options.map((_, i) => i)));
  return (
    <div className="choices" role="radiogroup">
      {order.map((i) => {
        const picked = value === i;
        let state = picked ? 'picked' : '';
        if (locked && i === correct) state = 'right';
        else if (locked && picked) state = 'wrong';
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={picked}
            className={`choice ${state} ${mono ? 'mono' : ''}`}
            disabled={locked}
            onClick={() => onChange(i)}
          >
            {mono ? <pre>{options[i].text}</pre> : <Inline text={options[i].text} />}
          </button>
        );
      })}
    </div>
  );
}

const gradeChoice = (options: Option[], correct: number, v: number, explain?: string): Grade =>
  v === correct
    ? { correct: true, message: explain }
    : { correct: false, message: options[v].why, answer: options[correct].text };

export const mcq: ExerciseKind<'mcq', number> = {
  Component: ({ ex, value, onChange, locked }) => (
    <>
      {ex.code && <CodeBlock code={ex.code} />}
      <Choices options={ex.options} correct={ex.answer} value={value} onChange={onChange} locked={locked} mono={false} />
    </>
  ),
  grade: (ex, v) => gradeChoice(ex.options, ex.answer, v, ex.explain),
};

// ------------------------------------------------------- typed output ---

function TypedOutput({ value, onChange, locked }: { value: string | undefined; onChange: (v: string) => void; locked: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="typed">
      <label className="typed-label" htmlFor="typed-answer">
        It prints:
      </label>
      <input
        id="typed-answer"
        ref={ref}
        className="code-input"
        value={value ?? ''}
        disabled={locked}
        placeholder="type the output"
        onChange={(e) => onChange(e.target.value)}
        {...codeInputProps}
      />
      {!locked && <SymbolKeys target={ref} onInsert={onChange} />}
    </div>
  );
}

type OutputValue = number | string;

export const predictOutput: ExerciseKind<'predict-output', OutputValue> = {
  Component: ({ ex, value, onChange, locked }: ExProps<ExerciseOf<'predict-output'>, OutputValue>) => (
    <>
      <CodeBlock code={ex.code} />
      {ex.options ? (
        <Choices
          options={ex.options}
          correct={ex.options.findIndex((o) => o.text === ex.answer)}
          value={value as number | undefined}
          onChange={onChange}
          locked={locked}
          mono
        />
      ) : (
        <TypedOutput value={value as string | undefined} onChange={onChange} locked={locked} />
      )}
    </>
  ),
  ready: (ex, v) => (ex.options ? typeof v === 'number' : typeof v === 'string' && v.trim() !== ''),
  grade: (ex, v) => {
    if (ex.options) return gradeChoice(ex.options, ex.options.findIndex((o) => o.text === ex.answer), v as number, ex.explain);
    const typed = normalizeTyped(String(v));
    if (outputMatches(typed, ex.answer)) return { correct: true, message: ex.explain };
    const known = ex.typedWrong?.find((w) => outputMatches(typed, w.answer));
    return { correct: false, message: known?.why ?? ex.explain, answer: ex.answer };
  },
};

// -------------------------------------------------------- typed shape ---

function ShapeInput({ value, onChange, locked }: { value: string | undefined; onChange: (v: string) => void; locked: boolean }) {
  const raw = value ?? '';
  const press = (k: string) => {
    if (k === 'error') return onChange(raw === 'error' ? '' : 'error');
    const base = raw === 'error' ? '' : raw;
    if (k === '⌫') return onChange(base.slice(0, -1));
    if (k === '-') return;
    if (k === ',') return onChange(base && !base.endsWith(',') ? base + ',' : base);
    onChange(base + k);
  };
  const shown = raw === 'error' ? 'error' : `(${raw.split(',').join(', ')}${raw.split(',').length === 1 && raw ? ',' : ''})`;
  return (
    <div className="shape-input">
      <div className={`shape-preview${raw ? '' : ' empty'}`} aria-live="polite">
        {raw ? shown : '( , )'}
      </div>
      {!locked && (
        <NumberPad
          onKey={press}
          extra={[
            { label: ', next number', key: ',' },
            { label: 'error', key: 'error' },
          ]}
        />
      )}
    </div>
  );
}

export const predictShape: ExerciseKind<'predict-shape', OutputValue> = {
  Component: ({ ex, value, onChange, locked }: ExProps<ExerciseOf<'predict-shape'>, OutputValue>) => (
    <>
      {ex.code.trim() !== '' && <CodeBlock code={ex.code} />}
      <p className="shape-target">
        Shape of <code>{ex.target}</code>
      </p>
      {ex.options ? (
        <Choices
          options={ex.options}
          correct={ex.options.findIndex((o) => o.text === ex.answer)}
          value={value as number | undefined}
          onChange={onChange}
          locked={locked}
          mono
        />
      ) : (
        <ShapeInput value={value as string | undefined} onChange={onChange} locked={locked} />
      )}
    </>
  ),
  ready: (ex, v) => (ex.options ? typeof v === 'number' : typeof v === 'string' && canonicalShape(v) !== null),
  grade: (ex, v) => {
    if (ex.options) return gradeChoice(ex.options, ex.options.findIndex((o) => o.text === ex.answer), v as number, ex.explain);
    const got = canonicalShape(String(v));
    if (got === ex.answer) return { correct: true, message: ex.explain };
    const known = ex.typedWrong?.find((w) => canonicalShape(w.answer) === got);
    return { correct: false, message: known?.why ?? ex.explain, answer: ex.answer };
  },
};
