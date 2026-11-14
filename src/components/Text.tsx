import { Fragment, type ReactNode } from 'react';

/** Renders `inline code` and **bold** inside lesson text. */
export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1] !== undefined) out.push(<code key={k++} className="ic">{m[1]}</code>);
    else out.push(<strong key={k++}>{m[2]}</strong>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

const KEYWORDS = new Set(
  'and as assert async await break class continue def elif else except False finally for from if import in is lambda None not or pass raise return True try while with yield'.split(
    ' ',
  ),
);
const BUILTINS = new Set('print len range list dict str int float type sum zip enumerate'.split(' '));

/** Tiny Python highlighter: enough for short snippets, no dependency. */
export function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(line))) {
    if (m[1]) out.push(<span key={k++} className="t-com">{m[1]}</span>);
    else if (m[2]) out.push(<span key={k++} className="t-str">{m[2]}</span>);
    else if (m[3]) out.push(<span key={k++} className="t-num">{m[3]}</span>);
    else if (m[4]) {
      const cls = KEYWORDS.has(m[4]) ? 't-kw' : BUILTINS.has(m[4]) ? 't-fn' : undefined;
      out.push(cls ? <span key={k++} className={cls}>{m[4]}</span> : <Fragment key={k++}>{m[4]}</Fragment>);
    } else out.push(<Fragment key={k++}>{m[0]}</Fragment>);
  }
  return out;
}

export function CodeBlock({ code, className = '' }: { code: string; className?: string }) {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  return (
    <pre className={`code ${className}`}>
      {lines.map((l, i) => (
        <div key={i} className="code-line">
          {l ? highlight(l) : ' '}
        </div>
      ))}
    </pre>
  );
}

export function OutputBlock({ text, label = 'Output' }: { text: string; label?: string }) {
  return (
    <div className="output">
      <div className="output-label">{label}</div>
      <pre>{text}</pre>
    </div>
  );
}
