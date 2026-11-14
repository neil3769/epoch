import { useRef, type RefObject } from 'react';

const SYMBOLS = ['[', ']', '(', ')', ':', '=', '@', '*', '.', '_', '"', ','];

/** Row of symbol keys shown above the phone keyboard for code input. */
export function SymbolKeys({
  target,
  onInsert,
}: {
  target: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onInsert: (value: string) => void;
}) {
  const insert = (s: string) => {
    const el = target.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + s + el.value.slice(end);
    onInsert(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + s.length, start + s.length);
    });
  };
  return (
    <div className="symkeys" role="toolbar" aria-label="Symbols">
      {SYMBOLS.map((s) => (
        <button
          key={s}
          type="button"
          className="symkey"
          // Keep focus (and the keyboard) on the input.
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => insert(s)}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/** Props that stop iOS from "helping" with code. */
export const codeInputProps = {
  autoCapitalize: 'off',
  autoCorrect: 'off',
  autoComplete: 'off',
  spellCheck: false,
  inputMode: 'text' as const,
};

/** On-screen number pad for grids and shapes, so no keyboard pops up. */
export function NumberPad({
  onKey,
  extra,
}: {
  onKey: (key: string) => void;
  extra?: { label: string; key: string }[];
}) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '−', '0', '⌫'];
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="numpad" ref={ref}>
      {keys.map((k) => (
        <button key={k} type="button" className="numkey" onClick={() => onKey(k === '−' ? '-' : k)} aria-label={k === '⌫' ? 'Delete' : k}>
          {k}
        </button>
      ))}
      {extra?.map((e) => (
        <button key={e.key} type="button" className="numkey numkey-wide" onClick={() => onKey(e.key)}>
          {e.label}
        </button>
      ))}
    </div>
  );
}
