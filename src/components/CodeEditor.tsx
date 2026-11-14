import { autocompletion, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python } from '@codemirror/lang-python';
import { HighlightStyle, bracketMatching, indentOnInput, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { EditorView, drawSelection, keymap, lineNumbers } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { normalizeTyped } from '../lib/text';

export interface CodeEditorHandle {
  /** Insert text at the cursor (for the symbol keys) and keep the keyboard up. */
  insert: (text: string) => void;
  /** Replace everything (e.g. "use this solution"). */
  set: (text: string) => void;
}

// Colours come from the app's CSS variables, so the editor follows light and dark mode.
const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword, t.bool, t.null], color: 'var(--t-kw)' },
  { tag: [t.string, t.special(t.string)], color: 'var(--t-str)' },
  { tag: [t.number], color: 'var(--t-num)' },
  { tag: [t.comment, t.lineComment], color: 'var(--t-com)', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.standard(t.variableName)], color: 'var(--t-fn)' },
]);

const theme = EditorView.theme({
  '&': { backgroundColor: 'var(--code-bg)', color: 'var(--code-ink)', borderRadius: '12px', fontSize: '16px' },
  '&.cm-focused': { outline: '2px solid var(--primary)' },
  '.cm-content': { fontFamily: 'var(--mono)', padding: '10px 0', caretColor: 'var(--code-ink)', minHeight: '7.5em' },
  '.cm-gutters': { backgroundColor: 'transparent', color: 'var(--t-com)', border: 'none' },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 6px 0 10px', minWidth: '28px' },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection': { backgroundColor: 'rgb(133 147 255 / 35%) !important' },
  '.cm-cursor': { borderLeftColor: 'var(--code-ink)', borderLeftWidth: '2px' },
  '.cm-matchingBracket': { backgroundColor: 'rgb(255 255 255 / 12%)', outline: 'none' },
});

/**
 * A small Python editor (CodeMirror 6): highlighting, auto-indent, bracket
 * closing, undo. Lines wrap, so nothing scrolls sideways on a phone. iOS
 * smart punctuation is undone as the learner types.
 */
export const CodeEditor = forwardRef<CodeEditorHandle, { value: string; onChange: (v: string) => void; label: string; readOnly?: boolean }>(
  function CodeEditor({ value, onChange, label, readOnly = false }, ref) {
    const host = useRef<HTMLDivElement>(null);
    const view = useRef<EditorView | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
      const v = new EditorView({
        parent: host.current!,
        state: EditorState.create({
          doc: value,
          extensions: [
            lineNumbers(),
            history(),
            drawSelection(),
            indentUnit.of('    '),
            indentOnInput(),
            bracketMatching(),
            closeBrackets(),
            autocompletion({ activateOnTyping: false }),
            python(),
            syntaxHighlighting(highlight),
            keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
            EditorView.lineWrapping,
            EditorState.readOnly.of(readOnly),
            EditorView.contentAttributes.of({
              autocapitalize: 'off',
              autocorrect: 'off',
              spellcheck: 'false',
              'aria-label': label,
            }),
            // Undo iOS curly quotes and dashes as they are typed.
            EditorState.transactionFilter.of((tr) => {
              if (!tr.docChanged || !tr.isUserEvent('input')) return tr;
              const changes: { from: number; to: number; insert: string }[] = [];
              let dirty = false;
              tr.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
                const text = inserted.toString();
                const fixed = normalizeTyped(text);
                if (fixed !== text) dirty = true;
                changes.push({ from: fromA, to: toA, insert: fixed });
              });
              if (!dirty) return tr;
              const last = changes[changes.length - 1];
              return { changes, selection: { anchor: last.from + last.insert.length }, scrollIntoView: true, userEvent: 'input' };
            }),
            EditorView.updateListener.of((u) => {
              if (u.docChanged) onChangeRef.current(u.state.doc.toString());
            }),
            theme,
          ],
        }),
      });
      view.current = v;
      return () => v.destroy();
      // The editor owns its text after mounting; `set` replaces it.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(ref, () => ({
      insert(text: string) {
        const v = view.current;
        if (!v) return;
        const { from, to } = v.state.selection.main;
        v.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length }, userEvent: 'input.type' });
        v.focus();
      },
      set(text: string) {
        const v = view.current;
        if (!v) return;
        v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: text } });
      },
    }));

    return <div className="editor" ref={host} />;
  },
);

const KEYS: { label: string; text: string; aria?: string }[] = [
  { label: '⇥', text: '    ', aria: 'Indent' },
  ...['(', ')', '[', ']', ':', '=', '.', ',', '_', '"', '*', '@', '+', '-', '#'].map((s) => ({ label: s, text: s })),
];

/** The symbol row from the lesson inputs, plus an indent key (phones have no Tab). */
export function EditorKeys({ onKey }: { onKey: (text: string) => void }) {
  return (
    <div className="symkeys editor-keys" role="toolbar" aria-label="Symbols">
      {KEYS.map((k) => (
        <button
          key={k.label}
          type="button"
          className="symkey"
          aria-label={k.aria ?? k.label}
          // Keep focus (and the keyboard) in the editor.
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => onKey(k.text)}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
